import Job from '../models/Job.js';
import Application, { STATUSES } from '../models/Application.js';
import { asyncHandler, HttpError, matchScore, notify } from '../lib/helpers.js';
import { publicPath } from '../middleware/upload.js';

// POST /api/applications/:jobId  (seeker)  multipart: coverLetter, resume(optional file)
export const apply = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new HttpError(404, 'Job not found');
  if (job.status !== 'open') throw new HttpError(400, 'This job is no longer accepting applications');
  if (job.deadline && job.deadline < new Date()) throw new HttpError(400, 'The application deadline has passed');

  const resume = req.file
    ? { url: publicPath('resumes', req.file), originalName: req.file.originalname }
    : req.user.resume?.url
      ? { url: req.user.resume.url, originalName: req.user.resume.originalName }
      : null;
  if (!resume) throw new HttpError(400, 'Attach a resume or upload one to your profile first');

  if (await Application.findOne({ job: job._id, applicant: req.user._id })) {
    throw new HttpError(409, 'You have already applied to this job');
  }

  const app = await Application.create({
    job: job._id,
    applicant: req.user._id,
    recruiter: job.recruiter,
    coverLetter: req.body.coverLetter,
    resume,
    statusHistory: [{ status: 'applied', note: 'Application submitted' }],
  });
  job.applicantsCount += 1;
  await job.save();

  notify(job.recruiter, 'New application', `${req.user.name} applied for ${job.title}`, `/recruiter/jobs/${job._id}/applicants`);
  res.status(201).json({ application: app });
});

// GET /api/applications/mine  (seeker)
export const myApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ applicant: req.user._id })
    .populate('job', 'title company location type workMode status salary')
    .sort({ createdAt: -1 });
  res.json({ applications });
});

// DELETE /api/applications/:id  (seeker withdraws)
export const withdraw = asyncHandler(async (req, res) => {
  const app = await Application.findById(req.params.id);
  if (!app || String(app.applicant) !== String(req.user._id)) throw new HttpError(404, 'Application not found');
  if (!['applied', 'reviewing'].includes(app.status)) {
    throw new HttpError(400, 'You can only withdraw while the application is still being reviewed');
  }
  await Job.findByIdAndUpdate(app.job, { $inc: { applicantsCount: -1 } });
  await app.deleteOne();
  res.json({ message: 'Application withdrawn' });
});

// GET /api/applications/job/:jobId  (recruiter)
export const jobApplicants = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) throw new HttpError(404, 'Job not found');
  if (String(job.recruiter) !== String(req.user._id)) throw new HttpError(403, 'Not your job posting');

  const applications = await Application.find({ job: job._id })
    .populate('applicant', 'name email phone avatar headline location skills experienceYears education links bio')
    .sort({ createdAt: -1 });

  const list = applications.map((a) => {
    const o = a.toObject();
    o.matchScore = matchScore(job.skills, o.applicant?.skills || []);
    return o;
  });
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: list.filter((a) => a.status === s).length }), {});
  res.json({ job, applications: list, counts });
});

// PATCH /api/applications/:id/status  (recruiter)
export const updateStatus = asyncHandler(async (req, res) => {
  const { status, note, recruiterNotes } = req.body;
  const app = await Application.findById(req.params.id).populate('job', 'title company');
  if (!app || String(app.recruiter) !== String(req.user._id)) throw new HttpError(404, 'Application not found');

  if (recruiterNotes !== undefined) app.recruiterNotes = recruiterNotes;
  if (status && status !== app.status) {
    if (!STATUSES.includes(status)) throw new HttpError(400, 'Invalid status');
    app.status = status;
    app.statusHistory.push({ status, note });
    notify(
      app.applicant,
      'Application update',
      `Your application for ${app.job.title} at ${app.job.company?.name} is now: ${status}`,
      '/dashboard'
    );
  }
  await app.save();
  res.json({ application: app });
});

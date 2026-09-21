import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';
import { asyncHandler, HttpError, escapeRegex, toList, matchScore } from '../lib/helpers.js';

const SORTS = {
  latest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  'salary-high': { 'salary.max': -1 },
  'salary-low': { 'salary.min': 1 },
  popular: { views: -1 },
};

const decorate = (job, user) => {
  const o = job.toObject ? job.toObject() : job;
  if (user?.role === 'seeker') {
    o.matchScore = matchScore(o.skills, user.skills);
    o.saved = (user.savedJobs || []).some((id) => String(id) === String(o._id));
  }
  return o;
};

const pickJobFields = (b) => {
  const out = {};
  [
    'title', 'description', 'location', 'workMode', 'type', 'category',
    'experienceLevel', 'openings', 'deadline', 'featured',
  ].forEach((k) => {
    if (b[k] !== undefined && b[k] !== '') out[k] = b[k];
  });
  if (b.skills !== undefined) out.skills = toList(b.skills);
  if (b.perks !== undefined) out.perks = toList(b.perks);
  if (b.salary) {
    out.salary = {
      min: b.salary.min ? Number(b.salary.min) : undefined,
      max: b.salary.max ? Number(b.salary.max) : undefined,
    };
    if (out.salary.min && out.salary.max && out.salary.min > out.salary.max) {
      throw new HttpError(400, 'Minimum salary cannot be higher than maximum salary');
    }
  }
  if (b.deadline === '') out.deadline = undefined;
  return out;
};

// GET /api/jobs  — search, filter, sort, paginate
export const getJobs = asyncHandler(async (req, res) => {
  const {
    q, location, type, workMode, level, category, minSalary, skills, posted,
    sort = 'latest', page = 1, limit = 10, company,
  } = req.query;

  const and = [{ status: 'open' }, { $or: [{ deadline: null }, { deadline: { $exists: false } }, { deadline: { $gte: new Date() } }] }];

  if (q) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    and.push({ $or: [{ title: rx }, { 'company.name': rx }, { skills: rx }, { category: rx }] });
  }
  if (location) and.push({ location: new RegExp(escapeRegex(location.trim()), 'i') });
  if (company) and.push({ 'company.name': new RegExp(escapeRegex(company.trim()), 'i') });
  if (type) and.push({ type: { $in: toList(type) } });
  if (workMode) and.push({ workMode: { $in: toList(workMode) } });
  if (level) and.push({ experienceLevel: { $in: toList(level) } });
  if (category) and.push({ category });
  if (minSalary) and.push({ 'salary.max': { $gte: Number(minSalary) } });
  if (skills) {
    and.push({ skills: { $in: toList(skills).map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) } });
  }
  if (posted) {
    and.push({ createdAt: { $gte: new Date(Date.now() - Number(posted) * 86400000) } });
  }

  const pageNum = Math.max(1, Number(page));
  const lim = Math.min(50, Math.max(1, Number(limit)));
  const filter = { $and: and };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ featured: -1, ...(SORTS[sort] || SORTS.latest) })
      .skip((pageNum - 1) * lim)
      .limit(lim),
    Job.countDocuments(filter),
  ]);

  res.json({
    jobs: jobs.map((j) => decorate(j, req.user)),
    total,
    page: pageNum,
    pages: Math.ceil(total / lim) || 1,
  });
});

// GET /api/jobs/meta — home page numbers and category counts
export const getMeta = asyncHandler(async (req, res) => {
  const [categories, totalJobs, companies, featured] = await Promise.all([
    Job.aggregate([
      { $match: { status: 'open' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Job.countDocuments({ status: 'open' }),
    Job.distinct('company.name', { status: 'open' }),
    Job.find({ status: 'open' }).sort({ featured: -1, createdAt: -1 }).limit(6),
  ]);
  res.json({
    categories: categories.map((c) => ({ name: c._id, count: c.count })),
    totalJobs,
    totalCompanies: companies.length,
    featured: featured.map((j) => decorate(j, req.user)),
  });
});

// GET /api/jobs/:id
export const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate('recruiter', 'name avatar company');
  if (!job) throw new HttpError(404, 'This job does not exist or was removed');

  const isOwner = req.user && String(job.recruiter._id) === String(req.user._id);
  if (!isOwner) {
    job.views += 1;
    await job.save();
  }

  const similar = await Job.find({ _id: { $ne: job._id }, status: 'open', category: job.category })
    .sort({ createdAt: -1 })
    .limit(4);

  let application = null;
  if (req.user?.role === 'seeker') {
    application = await Application.findOne({ job: job._id, applicant: req.user._id }).select('status createdAt');
  }

  res.json({
    job: decorate(job, req.user),
    similar: similar.map((j) => decorate(j, req.user)),
    application,
    isOwner: !!isOwner,
  });
});

// POST /api/jobs
export const createJob = asyncHandler(async (req, res) => {
  const data = pickJobFields(req.body);
  const c = req.user.company || {};
  if (!c.name) throw new HttpError(400, 'Add your company name in your profile before posting a job');
  const job = await Job.create({
    ...data,
    recruiter: req.user._id,
    company: { name: c.name, logo: c.logo, website: c.website },
  });
  res.status(201).json({ job });
});

const ownedJob = async (req) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new HttpError(404, 'Job not found');
  if (String(job.recruiter) !== String(req.user._id)) throw new HttpError(403, 'You can only manage your own jobs');
  return job;
};

// PUT /api/jobs/:id
export const updateJob = asyncHandler(async (req, res) => {
  const job = await ownedJob(req);
  Object.assign(job, pickJobFields(req.body));
  const c = req.user.company || {};
  job.company = { name: c.name, logo: c.logo, website: c.website };
  await job.save();
  res.json({ job });
});

// PATCH /api/jobs/:id/status
export const toggleJobStatus = asyncHandler(async (req, res) => {
  const job = await ownedJob(req);
  job.status = job.status === 'open' ? 'closed' : 'open';
  await job.save();
  res.json({ job });
});

// DELETE /api/jobs/:id
export const deleteJob = asyncHandler(async (req, res) => {
  const job = await ownedJob(req);
  await Application.deleteMany({ job: job._id });
  await User.updateMany({ savedJobs: job._id }, { $pull: { savedJobs: job._id } });
  await job.deleteOne();
  res.json({ message: 'Job deleted' });
});

// GET /api/jobs/mine  (recruiter)
export const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ recruiter: req.user._id }).sort({ createdAt: -1 });
  res.json({ jobs });
});

// POST /api/jobs/:id/save  (seeker) — toggles bookmark
export const toggleSave = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).select('_id');
  if (!job) throw new HttpError(404, 'Job not found');
  const user = req.user;
  const idx = user.savedJobs.findIndex((id) => String(id) === String(job._id));
  if (idx >= 0) user.savedJobs.splice(idx, 1);
  else user.savedJobs.push(job._id);
  await user.save();
  res.json({ saved: idx < 0 });
});

// GET /api/jobs/saved  (seeker)
export const getSavedJobs = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ _id: { $in: req.user.savedJobs } }).sort({ createdAt: -1 });
  res.json({ jobs: jobs.map((j) => decorate(j, req.user)) });
});

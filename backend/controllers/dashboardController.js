import mongoose from 'mongoose';
import Job from '../models/Job.js';
import Application, { STATUSES } from '../models/Application.js';
import { asyncHandler, matchScore } from '../lib/helpers.js';

// GET /api/dashboard/recruiter
export const recruiterStats = asyncHandler(async (req, res) => {
  const id = new mongoose.Types.ObjectId(req.user._id);
  const since = new Date(Date.now() - 29 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [jobs, byStatus, daily, topJobs] = await Promise.all([
    Job.find({ recruiter: id }).select('status views applicantsCount'),
    Application.aggregate([{ $match: { recruiter: id } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Application.aggregate([
      { $match: { recruiter: id, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Job.find({ recruiter: id }).sort({ applicantsCount: -1 }).limit(5).select('title applicantsCount views'),
  ]);

  // Fill every day of the last 30 days so the chart has no gaps
  const map = Object.fromEntries(daily.map((d) => [d._id, d.count]));
  const series = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, applications: map[key] || 0 };
  });

  const statusCounts = STATUSES.reduce((a, s) => ({ ...a, [s]: byStatus.find((x) => x._id === s)?.count || 0 }), {});
  const totalApplications = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  res.json({
    totals: {
      jobs: jobs.length,
      openJobs: jobs.filter((j) => j.status === 'open').length,
      applications: totalApplications,
      views: jobs.reduce((a, j) => a + j.views, 0),
      hired: statusCounts.hired,
      newThisWeek: series.slice(-7).reduce((a, d) => a + d.applications, 0),
    },
    statusCounts,
    series,
    topJobs,
  });
});

// GET /api/dashboard/seeker
export const seekerStats = asyncHandler(async (req, res) => {
  const apps = await Application.find({ applicant: req.user._id })
    .populate('job', 'title company location')
    .sort({ createdAt: -1 });

  const statusCounts = STATUSES.reduce((a, s) => ({ ...a, [s]: apps.filter((x) => x.status === s).length }), {});
  const appliedIds = apps.map((a) => a.job?._id).filter(Boolean);

  // Recommended jobs: open jobs sharing skills with the candidate, best match first
  let recommended = [];
  if (req.user.skills?.length) {
    const rx = req.user.skills.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'));
    const jobs = await Job.find({ status: 'open', _id: { $nin: appliedIds }, skills: { $in: rx } }).limit(30);
    recommended = jobs
      .map((j) => ({ ...j.toObject(), matchScore: matchScore(j.skills, req.user.skills) }))
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      .slice(0, 6);
  }

  res.json({
    totals: {
      applied: apps.length,
      saved: req.user.savedJobs.length,
      inProgress: statusCounts.reviewing + statusCounts.shortlisted + statusCounts.interview,
      offers: statusCounts.hired,
    },
    statusCounts,
    recent: apps.slice(0, 5),
    recommended,
  });
});

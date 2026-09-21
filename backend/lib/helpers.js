import Notification from '../models/Notification.js';

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Accepts "a, b, c" or ["a","b"] and returns a clean unique array
export const toList = (v) => {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : String(v).split(',');
  return [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))];
};

// Skill match percentage between a job and a candidate (null if not computable)
export const matchScore = (jobSkills = [], userSkills = []) => {
  if (!jobSkills.length || !userSkills.length) return null;
  const mine = new Set(userSkills.map((s) => s.toLowerCase()));
  const hit = jobSkills.filter((s) => mine.has(s.toLowerCase())).length;
  return Math.round((hit / jobSkills.length) * 100);
};

export const notify = (user, title, message, link) =>
  Notification.create({ user, title, message, link }).catch(() => {});

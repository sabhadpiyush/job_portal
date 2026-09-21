import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('sl_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong. Please try again.';
export default api;

// Where uploaded files are served from (same origin unless you deploy the API separately)
export const fileUrl = (p) => (!p ? '' : p.startsWith('http') ? p : `${import.meta.env.VITE_FILE_URL || ''}${p}`);

export const CATEGORIES = [
  'Engineering', 'Design', 'Marketing', 'Sales', 'Data & Analytics',
  'Finance', 'Human Resources', 'Customer Support', 'Operations', 'Other',
];
export const JOB_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];
export const WORK_MODES = [
  { value: 'onsite', label: 'On-site' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'remote', label: 'Remote' },
];
export const LEVELS = [
  { value: 'fresher', label: 'Fresher (0 yrs)' },
  { value: 'junior', label: 'Junior (1-3 yrs)' },
  { value: 'mid', label: 'Mid (3-6 yrs)' },
  { value: 'senior', label: 'Senior (6+ yrs)' },
  { value: 'lead', label: 'Lead / Manager' },
];
export const label = (list, v) => list.find((x) => x.value === v)?.label || v;

// Application pipeline, in order
export const PIPELINE = ['applied', 'reviewing', 'shortlisted', 'interview', 'hired'];
export const STATUS = {
  applied: { label: 'Applied', cls: 'bg-sunken text-muted' },
  reviewing: { label: 'In review', cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  shortlisted: { label: 'Shortlisted', cls: 'bg-accent/20 text-amber-800 dark:text-accent' },
  interview: { label: 'Interview', cls: 'bg-violet-500/10 text-violet-700 dark:text-violet-300' },
  hired: { label: 'Hired', cls: 'bg-brand-soft text-brand' },
  rejected: { label: 'Not selected', cls: 'bg-danger/10 text-danger' },
};

// Salaries are stored per year in rupees and shown in lakhs per annum
export const formatSalary = (s) => {
  if (!s || (!s.min && !s.max)) return 'Not disclosed';
  const f = (n) => +(n / 100000).toFixed(1);
  if (s.min && s.max) return `₹${f(s.min)}–${f(s.max)} LPA`;
  return s.min ? `From ₹${f(s.min)} LPA` : `Up to ₹${f(s.max)} LPA`;
};

export const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return 'just now';
  const steps = [[60, 'min'], [3600, 'hour'], [86400, 'day'], [604800, 'week'], [2592000, 'month']];
  let unit = 'min', div = 60;
  for (const [s, u] of steps) if (secs >= s) { unit = u; div = s; }
  const n = Math.floor(secs / div);
  return `${n} ${unit}${n > 1 ? 's' : ''} ago`;
};

export const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

// Profile completeness for job seekers (drives the progress meter)
export const profileScore = (u) => {
  if (!u) return { pct: 0, missing: [] };
  const checks = [
    ['Add a profile photo', !!u.avatar],
    ['Write a headline', !!u.headline],
    ['Tell us your location', !!u.location],
    ['Write a short bio', !!u.bio],
    ['Add at least 3 skills', (u.skills || []).length >= 3],
    ['Upload your resume', !!u.resume?.url],
    ['Add your education', !!u.education],
    ['Link GitHub or LinkedIn', !!(u.links?.github || u.links?.linkedin)],
  ];
  const done = checks.filter((c) => c[1]).length;
  return { pct: Math.round((done / checks.length) * 100), missing: checks.filter((c) => !c[1]).map((c) => c[0]) };
};

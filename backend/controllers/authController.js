import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, HttpError, toList } from '../lib/helpers.js';
import { publicPath } from '../middleware/upload.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendAuth = (user, res, status = 200) => {
  const safe = user.toObject();
  delete safe.password;
  res.status(status).json({ token: signToken(user._id), user: safe });
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, companyName } = req.body;
  if (!name || !email || !password || !role) throw new HttpError(400, 'Name, email, password and role are required');
  if (!['seeker', 'recruiter'].includes(role)) throw new HttpError(400, 'Invalid role');
  if (role === 'recruiter' && !companyName) throw new HttpError(400, 'Company name is required for recruiters');

  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({
    name,
    email,
    password,
    role,
    ...(role === 'recruiter' ? { company: { name: companyName } } : {}),
  });
  sendAuth(user, res, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Incorrect email or password');
  sendAuth(user, res);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const b = req.body;
  ['name', 'phone', 'location', 'headline', 'bio', 'education'].forEach((k) => {
    if (b[k] !== undefined) user[k] = b[k];
  });
  if (b.experienceYears !== undefined) user.experienceYears = Number(b.experienceYears) || 0;
  if (b.skills !== undefined) user.skills = toList(b.skills);
  if (b.links) {
    ['linkedin', 'github', 'portfolio'].forEach((k) => {
      if (b.links[k] !== undefined) user.set(`links.${k}`, b.links[k]);
    });
  }
  if (user.role === 'recruiter' && b.company) {
    ['name', 'website', 'size', 'industry', 'description'].forEach((k) => {
      if (b.company[k] !== undefined) user.set(`company.${k}`, b.company[k]);
    });
  }
  await user.save();
  res.json({ user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new HttpError(400, 'Both passwords are required');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) throw new HttpError(401, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a PDF or Word file to upload');
  req.user.resume = {
    url: publicPath('resumes', req.file),
    originalName: req.file.originalname,
    uploadedAt: new Date(),
  };
  await req.user.save();
  res.json({ user: req.user });
});

export const removeResume = asyncHandler(async (req, res) => {
  req.user.resume = undefined;
  await req.user.save();
  res.json({ user: req.user });
});

// target=avatar (default) or target=logo (recruiter company logo)
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose an image to upload');
  const url = publicPath('images', req.file);
  if (req.query.target === 'logo' && req.user.role === 'recruiter') {
    req.user.set('company.logo', url);
  } else {
    req.user.avatar = url;
  }
  await req.user.save();
  res.json({ user: req.user });
});

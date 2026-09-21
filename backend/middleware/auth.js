import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler, HttpError } from '../lib/helpers.js';

const getToken = (req) => {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.split(' ')[1] : null;
};

// Requires a valid token
export const protect = asyncHandler(async (req, _res, next) => {
  const token = getToken(req);
  if (!token) throw new HttpError(401, 'Please log in to continue');
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError(401, 'Account no longer exists');
  req.user = user;
  next();
});

// Attaches the user when a token is present, but never blocks
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
    } catch {
      /* ignore invalid token */
    }
  }
  next();
});

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to do that'));
    }
    next();
  };

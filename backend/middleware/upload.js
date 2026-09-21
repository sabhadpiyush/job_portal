import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { HttpError } from '../lib/helpers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const make = (folder, allowedExt, maxMB) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  return multer({
    storage: multer.diskStorage({
      destination: dir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
      },
    }),
    limits: { fileSize: maxMB * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExt.includes(ext)) {
        return cb(new HttpError(400, `Unsupported file type. Allowed: ${allowedExt.join(', ')}`));
      }
      cb(null, true);
    },
  });
};

export const uploadResume = make('resumes', ['.pdf', '.doc', '.docx'], 5);
export const uploadImage = make('images', ['.png', '.jpg', '.jpeg', '.webp'], 2);

export const publicPath = (folder, file) => `/uploads/${folder}/${file.filename}`;

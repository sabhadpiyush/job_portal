import { Router } from 'express';
import * as c from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadResume, uploadImage } from '../middleware/upload.js';

const r = Router();
r.post('/register', c.register);
r.post('/login', c.login);
r.get('/me', protect, c.me);
r.put('/profile', protect, c.updateProfile);
r.put('/password', protect, c.changePassword);
r.post('/resume', protect, uploadResume.single('resume'), c.uploadResume);
r.delete('/resume', protect, c.removeResume);
r.post('/image', protect, uploadImage.single('image'), c.uploadImage);
export default r;

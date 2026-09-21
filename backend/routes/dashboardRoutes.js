import { Router } from 'express';
import * as c from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/recruiter', authorize('recruiter'), c.recruiterStats);
r.get('/seeker', authorize('seeker'), c.seekerStats);
export default r;

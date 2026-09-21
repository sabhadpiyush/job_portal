import { Router } from 'express';
import * as c from '../controllers/applicationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';

const r = Router();
r.use(protect);
r.get('/mine', authorize('seeker'), c.myApplications);
r.get('/job/:jobId', authorize('recruiter'), c.jobApplicants);
r.post('/:jobId', authorize('seeker'), uploadResume.single('resume'), c.apply);
r.patch('/:id/status', authorize('recruiter'), c.updateStatus);
r.delete('/:id', authorize('seeker'), c.withdraw);
export default r;

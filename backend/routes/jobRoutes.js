import { Router } from 'express';
import * as c from '../controllers/jobController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const r = Router();
r.get('/', optionalAuth, c.getJobs);
r.get('/meta', optionalAuth, c.getMeta);
r.get('/mine', protect, authorize('recruiter'), c.getMyJobs);
r.get('/saved', protect, authorize('seeker'), c.getSavedJobs);
r.post('/', protect, authorize('recruiter'), c.createJob);
r.get('/:id', optionalAuth, c.getJob);
r.put('/:id', protect, authorize('recruiter'), c.updateJob);
r.patch('/:id/status', protect, authorize('recruiter'), c.toggleJobStatus);
r.delete('/:id', protect, authorize('recruiter'), c.deleteJob);
r.post('/:id/save', protect, authorize('seeker'), c.toggleSave);
export default r;

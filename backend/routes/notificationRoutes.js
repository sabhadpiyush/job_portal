import { Router } from 'express';
import * as c from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/', c.list);
r.patch('/read-all', c.markAllRead);
r.patch('/:id/read', c.markRead);
export default r;

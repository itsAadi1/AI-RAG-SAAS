import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspace.controller';

const router = Router();

// All workspace routes require authentication
router.use(authMiddleware);

router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:id', getWorkspace);
router.put('/:id', updateWorkspace);
router.delete('/:id', deleteWorkspace);

export default router;


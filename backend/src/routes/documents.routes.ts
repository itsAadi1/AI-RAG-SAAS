import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadDocument } from '../controllers/documents.controller';

const router = Router();
const upload = multer();

// Document upload requires authentication
router.post('/upload', authMiddleware, upload.single('file'), uploadDocument);

export default router;

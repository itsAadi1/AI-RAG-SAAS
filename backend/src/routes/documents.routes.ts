import { Router } from 'express';
import multer from 'multer';
import { uploadDocument } from '../controllers/documents.controller';

const router = Router();
const upload = multer();

router.post('/upload', upload.single('file'), uploadDocument);

export default router;

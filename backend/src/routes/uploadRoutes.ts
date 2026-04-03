import { Router } from 'express';
import { upload } from '../services/fileService';
import { uploadFile } from '../controllers/uploadController';

const router = Router();

router.post('/rejection-letter', upload.single('file'), uploadFile);
router.post('/hospital-bill', upload.single('file'), uploadFile);

export default router;

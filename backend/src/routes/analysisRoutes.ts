import { Router } from 'express';
import { analyzeClaim, getAnalysisResult } from '../controllers/analysisController';
import { upload } from '../services/fileService';

const router = Router();

router.post('/analyze-claim', upload.fields([
    { name: 'rejection_document', maxCount: 1 },
    { name: 'hospital_bill', maxCount: 1 }
]), analyzeClaim);

router.get('/analysis/:analysisId', getAnalysisResult);

export default router;

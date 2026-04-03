import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { v4 as uuidv4 } from 'uuid';
import { ocrService } from '../services/ocr/ocrService';
import { analysisService } from '../services/analysis/analysisService';
import { llmService } from '../services/llm/llmService';
import { reportService } from '../services/report/reportService';
import path from 'path';

export const analyzeClaim = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[Controller] analyzeClaim called');

        // ========== DEBUG LOGGING (MANDATORY) ==========
        console.log('FILES:', req.files);
        console.log('BODY:', req.body);
        // ================================================

        // Handle Multipart Files
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const rejectionFile = files?.['rejection_document']?.[0];
        const billFile = files?.['hospital_bill']?.[0];

        console.log('[Controller] Rejection file:', rejectionFile ? rejectionFile.originalname : 'MISSING');
        console.log('[Controller] Bill file:', billFile ? billFile.originalname : 'MISSING');

        if (!rejectionFile || !billFile) {
            console.log('[Controller] ERROR: Missing files - rejectionFile:', !!rejectionFile, 'billFile:', !!billFile);
            return next(new AppError('Both Rejection Letter and Hospital Bill must be uploaded', 400));
        }

        console.log('[Controller] Files received successfully!');
        console.log('[Controller] Rejection path:', rejectionFile.path);
        console.log('[Controller] Bill path:', billFile.path);

        // Handle Date Fields (FormData strings) - NOW OPTIONAL
        const { admission_date, discharge_date, claim_submission_date } = req.body;

        const analysisId = uuidv4();

        // --- Date Parsing (OPTIONAL) ---
        // Note: Frontend sends YYYY-MM-DD strings
        let admit: Date | undefined;
        let discharge: Date | undefined;
        let submission: Date | undefined;

        // Only parse dates if they are non-empty strings
        if (admission_date && admission_date.trim() !== '') {
            const parsed = new Date(admission_date);
            if (!isNaN(parsed.getTime())) admit = parsed;
        }
        if (discharge_date && discharge_date.trim() !== '') {
            const parsed = new Date(discharge_date);
            if (!isNaN(parsed.getTime())) discharge = parsed;
        }
        if (claim_submission_date && claim_submission_date.trim() !== '') {
            const parsed = new Date(claim_submission_date);
            if (!isNaN(parsed.getTime())) submission = parsed;
        }

        console.log('[Controller] Parsed dates - Admit:', admit, 'Discharge:', discharge, 'Submission:', submission);

        // --- Date Logic Validation (ONLY IF ALL DATES ARE VALID) ---
        if (admit && discharge && submission) {
            if (discharge < admit) {
                return next(new AppError('Discharge date cannot be before admission date', 400));
            }
            if (submission < discharge) {
                return next(new AppError('Claim submission date cannot be before discharge date', 400));
            }
        }

        // Initialize Async Analysis
        analysisService.initAnalysis(analysisId);

        const filePaths = {
            rejection: rejectionFile.path,
            bill: billFile.path
        };

        const dates = { admissionDate: admit, dischargeDate: discharge, submissionDate: submission };

        // Trigger background processing (Fire & Forget from HTTP perspective)
        analysisService.processClaim(analysisId, filePaths, dates).catch(err => {
            console.error(`Background processing failed for ${analysisId}`, err);
        });

        // Return Immediate Response
        res.status(202).json({
            status: 'processing',
            data: {
                analysisId: analysisId,
                status: 'processing',
                stage: 'validating_documents',
                message: 'Analysis initiated'
            }
        });

    } catch (err) {
        next(err);
    }
};

export const getAnalysisResult = (req: Request, res: Response, next: NextFunction) => {
    const analysisId = req.params.analysisId as string;

    const result = analysisService.getResult(analysisId);

    if (!result) {
        return next(new AppError('Analysis not found', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            analysisId,
            ...result
        }
    });
};

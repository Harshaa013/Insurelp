import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export const uploadFile = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next(new AppError('No file uploaded', 400));
    }

    res.status(200).json({
        status: 'success',
        data: {
            fileId: req.file.filename, // Using filename as ID for simplicity in Phase 1
            originalName: req.file.originalname,
            path: req.file.path,
            size: req.file.size
        }
    });
};

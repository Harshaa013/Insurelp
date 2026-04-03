import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError';
import { VALID_MIME_TYPES, PIPELINE_ERRORS } from '../utils/documentConstants';
import logger from '../utils/logger';

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // secure filename with uuid
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

/**
 * STEP 1: FILE ROUTING (MANDATORY)
 * Strictly validate MIME types before processing
 * Only images (JPEG, PNG) and PDFs are allowed
 */
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if mimetype starts with "image/" or is "application/pdf"
    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
        logger.warn(`[Step 1] Rejected file: ${file.originalname}, MIME: ${file.mimetype}`);
        return cb(new Error(`${PIPELINE_ERRORS.INVALID_DOCUMENT}: Only images and PDFs are allowed`));
    }

    // Additional check: verify against allowed MIME types list
    const isValidMime = VALID_MIME_TYPES.includes(file.mimetype as any);

    if (!isValidMime) {
        logger.warn(`[Step 1] Rejected file with unsupported image type: ${file.mimetype}`);
        return cb(new Error(`${PIPELINE_ERRORS.INVALID_DOCUMENT}: Unsupported file format`));
    }

    logger.info(`[Step 1] Accepted file: ${file.originalname}, MIME: ${file.mimetype}`);
    return cb(null, true);
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter,
});

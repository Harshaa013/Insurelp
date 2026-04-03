/**
 * Document Processing Pipeline Constants
 * Central configuration for the 5-step validation pipeline
 */

// Step 1: Valid MIME types for file routing
export const VALID_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf'
] as const;

// Step 3: Medical keywords for OCR validation gate
export const MEDICAL_KEYWORDS = [
    'claim',
    'policy',
    'insurer',
    'hospital',
    'bill',
    'amount',
    'admission',
    'discharge',
    'patient',
    'treatment',
    'diagnosis',
    'insurance',
    'coverage',
    'premium',
    'medical',
    'healthcare',
    'rejected',
    'denied',
    'approved',
    'pending',
    'reimbursement',
    'cashless',
    'tpa',
    'hospitalization'
] as const;

// Step 3: OCR Confidence Gate thresholds
export const OCR_MIN_TEXT_LENGTH = 100;
export const OCR_MIN_KEYWORDS_REQUIRED = 1;

// Step 4: Classification confidence threshold
export const CLASSIFICATION_CONFIDENCE_THRESHOLD = 60;

// Document types enum
export type DocumentType = 'REJECTION_LETTER' | 'HOSPITAL_BILL' | 'UNRELATED_DOCUMENT';

// Error codes for pipeline stages
export const PIPELINE_ERRORS = {
    INVALID_DOCUMENT: 'INVALID_DOCUMENT',
    OCR_EMPTY: 'OCR_EMPTY',
    OCR_INSUFFICIENT: 'OCR_INSUFFICIENT',
    NO_MEDICAL_KEYWORDS: 'NO_MEDICAL_KEYWORDS',
    CLASSIFICATION_FAILED: 'CLASSIFICATION_FAILED',
    UNRELATED_DOCUMENT: 'UNRELATED_DOCUMENT'
} as const;

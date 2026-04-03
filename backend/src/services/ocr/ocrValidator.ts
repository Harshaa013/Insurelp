import {
    MEDICAL_KEYWORDS,
    OCR_MIN_TEXT_LENGTH,
    OCR_MIN_KEYWORDS_REQUIRED,
    PIPELINE_ERRORS
} from '../../utils/documentConstants';
import logger from '../../utils/logger';

/**
 * Result of OCR validation gate
 */
export interface OcrValidationResult {
    isValid: boolean;
    errorCode: string | null;
    reason: string;
    keywordsFound: string[];
    textLength: number;
}

/**
 * STEP 3: OCR CONFIDENCE GATE (CRITICAL)
 * 
 * This function validates OCR output to ensure:
 * 1. Text is not empty (OCR_EMPTY)
 * 2. Text meets minimum length requirement
 * 3. Text contains medical/insurance keywords
 * 
 * This prevents garbage input from reaching classification and analysis.
 */
export function validateOcrOutput(ocrText: string): OcrValidationResult {
    logger.info(`[Step 3] Validating OCR output (${ocrText.length} chars)`);
    logger.info(`[Step 3] OCR text preview (first 200 chars): ${ocrText.substring(0, 200)}`);

    // Check 1: OCR_EMPTY response
    if (ocrText === PIPELINE_ERRORS.OCR_EMPTY || !ocrText || ocrText.trim().length === 0) {
        logger.warn('[Step 3] FAILED: OCR returned empty');
        logger.warn(`[Step 3] Raw ocrText value was: "${ocrText}"`);
        return {
            isValid: false,
            errorCode: PIPELINE_ERRORS.OCR_EMPTY,
            reason: 'Document appears blank or unreadable. Please upload a clearer scan.',
            keywordsFound: [],
            textLength: 0
        };
    }

    const trimmedText = ocrText.trim();
    const textLength = trimmedText.length;

    // Check 2: Minimum text length
    if (textLength < OCR_MIN_TEXT_LENGTH) {
        logger.warn(`[Step 3] FAILED: Text too short (${textLength} < ${OCR_MIN_TEXT_LENGTH})`);
        return {
            isValid: false,
            errorCode: PIPELINE_ERRORS.OCR_INSUFFICIENT,
            reason: `Document contains insufficient text (${textLength} characters). Please upload a complete document.`,
            keywordsFound: [],
            textLength
        };
    }

    // Check 3: Medical keywords presence
    const lowerText = trimmedText.toLowerCase();
    const foundKeywords = MEDICAL_KEYWORDS.filter(keyword => lowerText.includes(keyword));

    if (foundKeywords.length < OCR_MIN_KEYWORDS_REQUIRED) {
        logger.warn(`[Step 3] FAILED: No medical keywords found in text`);
        return {
            isValid: false,
            errorCode: PIPELINE_ERRORS.NO_MEDICAL_KEYWORDS,
            reason: 'Document does not appear to be a medical or insurance document. Please upload the correct document.',
            keywordsFound: [],
            textLength
        };
    }

    // All checks passed
    logger.info(`[Step 3] PASSED: Found ${foundKeywords.length} medical keywords: ${foundKeywords.slice(0, 5).join(', ')}${foundKeywords.length > 5 ? '...' : ''}`);

    return {
        isValid: true,
        errorCode: null,
        reason: 'Valid medical document detected',
        keywordsFound: foundKeywords,
        textLength
    };
}

/**
 * Quick check for medical content without full validation
 * Used for early filtering
 */
export function containsMedicalKeywords(text: string): boolean {
    if (!text || text.length === 0) return false;

    const lowerText = text.toLowerCase();
    return MEDICAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Get a summary of OCR quality for logging/debugging
 */
export function getOcrQualitySummary(ocrText: string): {
    length: number;
    hasNumbers: boolean;
    hasDates: boolean;
    hasAmounts: boolean;
    medicalKeywordCount: number;
} {
    const text = ocrText || '';
    const lowerText = text.toLowerCase();

    return {
        length: text.length,
        hasNumbers: /\d+/.test(text),
        hasDates: /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text),
        hasAmounts: /[\$₹€£]\s*[\d,]+\.?\d*|\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(text),
        medicalKeywordCount: MEDICAL_KEYWORDS.filter(kw => lowerText.includes(kw)).length
    };
}

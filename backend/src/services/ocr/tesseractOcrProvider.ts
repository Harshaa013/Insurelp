import { IOcrProvider, OcrResult } from './ocr.interface';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { PIPELINE_ERRORS, MEDICAL_KEYWORDS } from '../../utils/documentConstants';

/**
 * TESSERACT OCR PROVIDER
 * Uses tesseract.js for local OCR processing
 * No external API dependencies - runs entirely on the server
 * 
 * ACCURACY-FIRST DESIGN: No hallucinations, just raw text extraction
 */
export class TesseractOcrProvider implements IOcrProvider {

    constructor() {
        logger.info('[TesseractOCR] Initialized - Local OCR engine ready');
    }

    public getName(): string {
        return 'TESSERACT';
    }

    /**
     * Extract text from an image file using Tesseract.js
     * Returns OCR_EMPTY for unreadable/blank images with confidence 0
     */
    public async extract(filePath: string): Promise<OcrResult> {
        logger.info(`[TesseractOCR] Processing file: ${filePath}`);

        try {
            // Validate file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Check file extension
            const ext = path.extname(filePath).toLowerCase();
            const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

            if (!supportedExtensions.includes(ext)) {
                // For PDFs, we'd need additional processing (pdf-to-image conversion)
                // For now, mark as unsupported
                if (ext === '.pdf') {
                    logger.warn(`[TesseractOCR] PDF files require conversion - marking as empty`);
                    return {
                        text: PIPELINE_ERRORS.OCR_EMPTY,
                        confidence: 0,
                        metadata: {
                            provider: 'tesseract',
                            status: 'unsupported_format',
                            reason: 'PDF files not yet supported by Tesseract provider'
                        }
                    };
                }
                throw new Error(`Unsupported file type: ${ext}`);
            }

            // Get file size for logging
            const stats = fs.statSync(filePath);
            logger.info(`[TesseractOCR] File size: ${stats.size} bytes, Extension: ${ext}`);

            // Run Tesseract OCR
            logger.info(`[TesseractOCR] Starting OCR recognition...`);
            const startTime = Date.now();

            const result = await Tesseract.recognize(
                filePath,
                'eng', // English language
                {
                    logger: (info) => {
                        // Log progress milestones only
                        if (info.status === 'recognizing text' && info.progress) {
                            if (info.progress === 1) {
                                logger.info(`[TesseractOCR] Recognition complete`);
                            }
                        }
                    }
                }
            );

            const duration = Date.now() - startTime;
            const extractedText = result.data.text.trim();
            const tesseractConfidence = result.data.confidence;

            // === DEBUG: Log raw OCR output immediately ===
            logger.info(`[TesseractOCR] === RAW OCR OUTPUT START ===`);
            logger.info(`[TesseractOCR] Duration: ${duration}ms`);
            logger.info(`[TesseractOCR] Raw text length: ${extractedText.length}`);
            logger.info(`[TesseractOCR] Tesseract confidence: ${tesseractConfidence}%`);
            logger.info(`[TesseractOCR] First 500 chars: ${extractedText.substring(0, 500)}`);
            logger.info(`[TesseractOCR] === RAW OCR OUTPUT END ===`);

            // Check for empty OCR response
            if (!extractedText || extractedText.length === 0) {
                logger.warn('[TesseractOCR] OCR returned empty text');
                return {
                    text: PIPELINE_ERRORS.OCR_EMPTY,
                    confidence: 0,
                    metadata: {
                        provider: 'tesseract',
                        status: 'empty',
                        duration: duration
                    }
                };
            }

            // Calculate our own confidence based on text quality and medical content
            const qualityConfidence = this.calculateConfidence(extractedText, tesseractConfidence);

            logger.info(`[TesseractOCR] Extracted ${extractedText.length} chars, quality confidence: ${(qualityConfidence * 100).toFixed(1)}%`);

            return {
                text: extractedText,
                confidence: qualityConfidence,
                metadata: {
                    provider: 'tesseract',
                    tesseractConfidence: tesseractConfidence,
                    charCount: extractedText.length,
                    duration: duration,
                    hasDocumentStructure: this.hasDocumentStructure(extractedText)
                }
            };

        } catch (error) {
            logger.error('[TesseractOCR] Extraction failed:', error);
            return {
                text: PIPELINE_ERRORS.OCR_EMPTY,
                confidence: 0,
                metadata: {
                    provider: 'tesseract',
                    status: 'error',
                    error: (error as Error).message
                }
            };
        }
    }

    /**
     * Check if text has document structure (headers, dates, amounts)
     */
    private hasDocumentStructure(text: string): boolean {
        const hasHeaders = /^[A-Z][A-Z\s]+$/m.test(text); // All caps line
        const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
        const hasAmounts = /[\$₹€£]?\s*[\d,]+\.?\d{0,2}/.test(text);
        const hasMultipleLines = text.split('\n').length > 3;

        return (hasHeaders || hasDates || hasAmounts) && hasMultipleLines;
    }

    /**
     * Calculate confidence score based on text quality heuristics
     * Combines Tesseract's confidence with our own quality checks
     * Returns a value between 0 and 1
     */
    private calculateConfidence(text: string, tesseractConfidence: number): number {
        if (!text || text.length === 0) return 0;

        let score = 0;

        // Base score from Tesseract confidence (0-100 -> 0-0.3)
        score += (tesseractConfidence / 100) * 0.30;

        // Text length scoring (max 0.20)
        if (text.length > 50) score += 0.04;
        if (text.length > 100) score += 0.04;
        if (text.length > 300) score += 0.04;
        if (text.length > 500) score += 0.04;
        if (text.length > 1000) score += 0.04;

        // Document structure scoring (max 0.20)
        const hasNumbers = /\d+/.test(text);
        const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
        const hasAmounts = /[\$₹€£]\s*[\d,]+\.?\d*|\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(text);
        const hasProperWords = /[A-Za-z]{4,}/.test(text);
        const hasMultipleLines = text.split('\n').length > 5;

        if (hasNumbers) score += 0.04;
        if (hasDates) score += 0.04;
        if (hasAmounts) score += 0.04;
        if (hasProperWords) score += 0.04;
        if (hasMultipleLines) score += 0.04;

        // Medical/Insurance keyword scoring (max 0.30 - MOST IMPORTANT)
        const lowerText = text.toLowerCase();
        const foundKeywords = MEDICAL_KEYWORDS.filter(kw => lowerText.includes(kw));

        // Each keyword adds 0.03, up to max of 0.30
        const keywordScore = Math.min(foundKeywords.length * 0.03, 0.30);
        score += keywordScore;

        logger.info(`[TesseractOCR] Confidence breakdown: tesseract=${tesseractConfidence}%, length=${text.length}, keywords=${foundKeywords.length}, finalScore=${score.toFixed(2)}`);

        // Cap at 0.95 (never 100% confident from OCR alone)
        return Math.min(score, 0.95);
    }
}

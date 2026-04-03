import { IOcrProvider, OcrResult } from './ocr.interface';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import logger from '../../utils/logger';
import { PIPELINE_ERRORS, MEDICAL_KEYWORDS } from '../../utils/documentConstants';

/**
 * STEP 2: GEMINI VISION OCR PROVIDER
 * Uses Gemini 1.5 Pro Vision model with a strict OCR-only prompt
 * to extract text deterministically without interpretation
 * 
 * ACCURACY-FIRST DESIGN: No hallucinations allowed
 */
export class GeminiVisionOCRProvider implements IOcrProvider {
    private model: any;
    private apiKey: string;

    /**
     * STRICT OCR-ONLY PROMPT
     * This is critical for deterministic extraction
     * DO NOT modify to add interpretation, classification, or analysis
     */
    private readonly OCR_PROMPT = `You are an OCR engine.

Task:
Extract ALL readable text from the provided document image exactly as-is.

Rules:
- Do NOT summarize
- Do NOT interpret
- Do NOT classify
- Do NOT explain
- Preserve numbers, dates, amounts, and formatting as much as possible
- If text is unreadable or absent, respond with: OCR_EMPTY

Return only raw extracted text.`;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';

        if (!this.apiKey) {
            logger.error('[GeminiVisionOCR] CRITICAL: GEMINI_API_KEY is missing');
            throw new Error('GEMINI_API_KEY is required for Gemini Vision OCR');
        }

        const genAI = new GoogleGenerativeAI(this.apiKey);
        // Using gemini-2.0-flash for vision OCR (gemini-1.5-pro is deprecated)
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        logger.info('[GeminiVisionOCR] Initialized with gemini-2.0-flash (vision)');
    }

    public getName(): string {
        return 'GEMINI_VISION';
    }

    /**
     * Extract text from an image or PDF file using Gemini Vision
     * Returns OCR_EMPTY for unreadable/random images with confidence 0
     */
    public async extract(filePath: string): Promise<OcrResult> {
        logger.info(`[GeminiVisionOCR] Processing file: ${filePath}`);

        try {
            // Validate file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Read file as base64
            const fileBuffer = fs.readFileSync(filePath);
            const base64Data = fileBuffer.toString('base64');

            // Determine MIME type from extension
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = this.getMimeType(ext);

            if (!mimeType) {
                throw new Error(`Unsupported file type: ${ext}`);
            }

            logger.info(`[GeminiVisionOCR] File size: ${fileBuffer.length} bytes, MIME: ${mimeType}`);
            logger.info(`[GeminiVisionOCR] Base64 data length: ${base64Data.length} chars`);

            // Validate base64 data is not empty
            if (!base64Data || base64Data.length === 0) {
                logger.error('[GeminiVisionOCR] CRITICAL: Base64 data is empty!');
                throw new Error('Failed to encode file as base64');
            }

            // Prepare the image part for Gemini - must use inlineData with base64
            const imagePart = {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType
                }
            };

            logger.info(`[GeminiVisionOCR] Calling Gemini API with inlineData...`);

            // Call Gemini Vision with strict OCR prompt
            const result = await this.model.generateContent([this.OCR_PROMPT, imagePart]);
            const response = await result.response;
            const extractedText = response.text().trim();

            // === DEBUG: Log raw OCR output immediately ===
            logger.info(`[GeminiVisionOCR] === RAW OCR OUTPUT START ===`);
            logger.info(`[GeminiVisionOCR] Raw text length: ${extractedText.length}`);
            logger.info(`[GeminiVisionOCR] First 500 chars: ${extractedText.substring(0, 500)}`);
            logger.info(`[GeminiVisionOCR] === RAW OCR OUTPUT END ===`);

            // Check for empty OCR response
            if (extractedText === PIPELINE_ERRORS.OCR_EMPTY ||
                extractedText.length === 0 ||
                extractedText.toLowerCase().includes('ocr_empty')) {
                logger.warn('[GeminiVisionOCR] OCR returned empty or unreadable');
                logger.warn(`[GeminiVisionOCR] Full response was: "${extractedText}"`);
                return {
                    text: PIPELINE_ERRORS.OCR_EMPTY,
                    confidence: 0,
                    metadata: {
                        provider: 'gemini-vision',
                        model: 'gemini-2.0-flash',
                        status: 'empty'
                    }
                };
            }

            // Calculate confidence based on text quality and medical content
            const confidence = this.calculateConfidence(extractedText);

            logger.info(`[GeminiVisionOCR] Extracted ${extractedText.length} chars, confidence: ${(confidence * 100).toFixed(1)}%`);

            return {
                text: extractedText,
                confidence: confidence,
                metadata: {
                    provider: 'gemini-vision',
                    model: 'gemini-2.0-flash',
                    charCount: extractedText.length,
                    hasDocumentStructure: this.hasDocumentStructure(extractedText)
                }
            };

        } catch (error) {
            logger.error('[GeminiVisionOCR] Extraction failed:', error);
            // Return OCR_EMPTY with 0 confidence on error - don't hallucinate
            return {
                text: PIPELINE_ERRORS.OCR_EMPTY,
                confidence: 0,
                metadata: {
                    provider: 'gemini-vision',
                    model: 'gemini-2.0-flash',
                    status: 'error',
                    error: (error as Error).message
                }
            };
        }
    }

    /**
     * Get MIME type from file extension
     */
    private getMimeType(ext: string): string | null {
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        return mimeTypes[ext] || null;
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
     * Returns a value between 0 and 1
     * 
     * ACCURACY-FIRST: Random images will get low confidence (< 0.3)
     * Valid medical documents will get high confidence (> 0.6)
     */
    private calculateConfidence(text: string): number {
        if (!text || text.length === 0) return 0;

        let score = 0;

        // Text length scoring (max 0.25)
        if (text.length > 50) score += 0.05;
        if (text.length > 100) score += 0.05;
        if (text.length > 300) score += 0.05;
        if (text.length > 500) score += 0.05;
        if (text.length > 1000) score += 0.05;

        // Document structure scoring (max 0.25)
        const hasNumbers = /\d+/.test(text);
        const hasDates = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(text);
        const hasAmounts = /[\$₹€£]\s*[\d,]+\.?\d*|\d{1,3}(?:,\d{3})*(?:\.\d{2})?/.test(text);
        const hasProperWords = /[A-Za-z]{4,}/.test(text);
        const hasMultipleLines = text.split('\n').length > 5;

        if (hasNumbers) score += 0.05;
        if (hasDates) score += 0.05;
        if (hasAmounts) score += 0.05;
        if (hasProperWords) score += 0.05;
        if (hasMultipleLines) score += 0.05;

        // Medical/Insurance keyword scoring (max 0.50 - MOST IMPORTANT)
        const lowerText = text.toLowerCase();
        const foundKeywords = MEDICAL_KEYWORDS.filter(kw => lowerText.includes(kw));

        // Each keyword adds 0.05, up to max of 0.50
        const keywordScore = Math.min(foundKeywords.length * 0.05, 0.50);
        score += keywordScore;

        logger.info(`[GeminiVisionOCR] Confidence breakdown: length=${text.length}, keywords=${foundKeywords.length}, score=${score.toFixed(2)}`);

        // Cap at 0.95 (never 100% confident from OCR alone)
        return Math.min(score, 0.95);
    }
}


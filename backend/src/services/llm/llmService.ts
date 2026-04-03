import { geminiClient } from './geminiClient';
import { PromptTemplates } from './promptTemplates';
import logger from '../../utils/logger';
import { ValidationResult, BillData } from './llm.interface';
import { CLASSIFICATION_CONFIDENCE_THRESHOLD, PIPELINE_ERRORS } from '../../utils/documentConstants';

export class LLMService {

    /**
     * STEP 4: DOCUMENT CLASSIFICATION
     * Classifies OCR text into REJECTION_LETTER, HOSPITAL_BILL, or UNRELATED_DOCUMENT
     * Applies confidence threshold gate
     */
    public async classifyDocument(text: string): Promise<ValidationResult> {
        const prompt = PromptTemplates.getDocumentClassificationPrompt(text);

        try {
            const result = await geminiClient.generateObject(prompt);

            // Strict Schema Validation - new schema uses 'documentType' not 'type'
            if (!result.documentType || typeof result.confidence !== 'number') {
                logger.warn('[Step 4] Gemini returned invalid classification schema', result);
                return {
                    type: 'unrelated_document',
                    isValid: false,
                    reason: 'AI Schema Failure',
                    confidence: 0
                };
            }

            const docType = result.documentType.toLowerCase().replace('_', '_');
            const confidence = result.confidence;

            // Confidence threshold gate (Step 4)
            const isAboveThreshold = confidence >= CLASSIFICATION_CONFIDENCE_THRESHOLD;
            const isValidType = docType !== 'unrelated_document';
            const isValid = isAboveThreshold && isValidType;

            logger.info(`[Step 4] Classification: type=${docType}, confidence=${confidence}, valid=${isValid}`);

            if (!isAboveThreshold) {
                logger.warn(`[Step 4] Confidence below threshold: ${confidence} < ${CLASSIFICATION_CONFIDENCE_THRESHOLD}`);
            }

            return {
                type: docType,
                isValid: isValid,
                reason: result.reason || (isValid ? 'Valid document' : `Low confidence or unrelated (${confidence}%)`),
                confidence: confidence
            };
        } catch (error) {
            logger.error('[Step 4] Document Classification Failed:', error);
            // FAIL SAFE: If we can't classify, we treat it as unrelated/refusal.
            return {
                type: 'unrelated_document',
                isValid: false,
                reason: 'Classification Service Unavailable',
                confidence: 0
            };
        }
    }

    public async extractBillData(text: string): Promise<BillData | null> {
        const prompt = PromptTemplates.getBillExtractionPrompt(text);

        try {
            const data = await geminiClient.generateObject(prompt);

            // Basic structural check
            if (!data.hospitalName && !data.totalAmount) {
                return null;
            }
            return data as BillData;
        } catch (error) {
            logger.error('Extraction Failed:', error);
            return null;
        }
    }

    public async extractAndVerify(text: string): Promise<{ data: BillData; verificationScore: number }> {
        // Pass 1: Extraction
        const extractedData = await this.extractBillData(text);

        if (!extractedData) {
            throw new Error('Extraction Pass 1 Failed: structured data not found');
        }

        // Pass 2: Forensic Verification
        const verifyPrompt = PromptTemplates.getVerificationPrompt(text, extractedData);
        let verificationResult;

        try {
            verificationResult = await geminiClient.generateObject(verifyPrompt);
        } catch (error) {
            logger.error('Verification Pass 2 Failed:', error);
            // If verification fails, we punish the score but return data if it looks okay-ish?
            // No, Strict Mode -> If verification tools fail, confidence is 0.
            return { data: extractedData, verificationScore: 0 };
        }

        const score = verificationResult.verificationScore || 0;
        logger.info(`[Strict Verify] Score: ${score}, Mismatches: ${verificationResult.mismatches?.join(', ')}`);

        return {
            data: extractedData,
            verificationScore: score
        };
    }
}

export const llmService = new LLMService();

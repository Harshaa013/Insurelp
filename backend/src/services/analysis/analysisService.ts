import { AnalysisResult, AnalysisStage, AnalysisOutcome } from './analysis.interface';
import { ocrService } from '../ocr/ocrService';
import { groqClient, GroqAnalysisResult } from '../llm/groqClient';
import logger from '../../utils/logger';

/**
 * ANALYSIS SERVICE - FINAL BACKEND FLOW
 * 
 * Pipeline:
 * 1. Validate files exist
 * 2. OCR rejection letter → text
 * 3. OCR hospital bill → text
 * 4. HARD VALIDATION (rules, not AI) ⚠️ CRITICAL
 * 5. Send clean text to Groq
 * 6. Groq returns structured JSON
 * 7. Map result for frontend
 * 
 * AI only runs AFTER hard validation passes!
 */

// Tiered validation thresholds (matches real insurance workflows)
const VALIDATION_THRESHOLDS = {
    REJECTION: {
        INVALID_BELOW: 150,       // < 150 chars = INVALID
        INCONCLUSIVE_BELOW: 300,  // 150-299 chars = INCONCLUSIVE (50% cap)
        ELIGIBLE_ABOVE: 300       // >= 300 chars = ELIGIBLE
    },
    BILL: {
        INVALID_BELOW: 100,       // < 100 chars = INVALID
        INCONCLUSIVE_BELOW: 200,  // 100-199 chars = INCONCLUSIVE (50% cap)
        ELIGIBLE_ABOVE: 200       // >= 200 chars = ELIGIBLE
    },
    REJECTION_KEYWORDS: /rejection|denied|claim|not approved|declined|refused/i,
    BILL_KEYWORDS: /total|amount|hospital|bill|charges|payment|invoice/i
};

// Validation status types
type ValidationStatus = 'INVALID' | 'INCONCLUSIVE' | 'ELIGIBLE';

interface ValidationResult {
    status: ValidationStatus;
    confidence: number;        // 0 for INVALID, capped for INCONCLUSIVE, -1 for ELIGIBLE (no cap)
    reason?: string;
    penaltyReason?: string;
}

export class AnalysisService {
    private results: Map<string, AnalysisResult> = new Map();

    public getResult(id: string): AnalysisResult | undefined {
        return this.results.get(id);
    }

    public initAnalysis(id: string): void {
        this.results.set(id, {
            analysisId: id,
            status: 'processing',
            outcome: null,
            stage: 'validating_documents',
            issue: '',
            description: '',
            confidenceScore: 0,
            checks: [],
            actionableSteps: []
        });
    }

    private updateStage(id: string, stage: AnalysisStage, message?: string) {
        const current = this.results.get(id);
        if (current) {
            this.results.set(id, { ...current, stage, message });
        }
    }

    /**
     * TIERED VALIDATION - Rejection Letter
     * 
     * 1. < 150 chars → INVALID (confidence = 0)
     * 2. 150-299 chars → INCONCLUSIVE (confidence cap = 50%)
     * 3. >= 300 chars → ELIGIBLE (proceed normally)
     */
    private validateRejectionLetter(text: string): ValidationResult {
        const length = text.length;

        // TIER 1: INVALID - Too short to verify
        if (length < VALIDATION_THRESHOLDS.REJECTION.INVALID_BELOW) {
            return {
                status: 'INVALID',
                confidence: 0,
                reason: `Rejection letter too short to verify (${length} chars, need at least 150)`
            };
        }

        // Check for rejection keywords (required for all tiers)
        if (!VALIDATION_THRESHOLDS.REJECTION_KEYWORDS.test(text)) {
            return {
                status: 'INVALID',
                confidence: 0,
                reason: 'Not a rejection letter - missing required keywords (rejection, denied, claim, etc.)'
            };
        }

        // TIER 2: INCONCLUSIVE - Short but may contain valid info
        if (length < VALIDATION_THRESHOLDS.REJECTION.INCONCLUSIVE_BELOW) {
            return {
                status: 'INCONCLUSIVE',
                confidence: 50, // Cap at 50%
                penaltyReason: `Short rejection letter (${length} chars) - confidence capped at 50%`
            };
        }

        // TIER 3: ELIGIBLE - Full validation
        return {
            status: 'ELIGIBLE',
            confidence: -1 // No cap, use AI confidence
        };
    }

    /**
     * TIERED VALIDATION - Hospital Bill
     * 
     * 1. < 100 chars → INVALID (confidence = 0)
     * 2. 100-199 chars → INCONCLUSIVE (confidence cap = 50%)
     * 3. >= 200 chars → ELIGIBLE (proceed normally)
     */
    private validateBill(text: string): ValidationResult {
        const length = text.length;

        // TIER 1: INVALID - Too short to verify
        if (length < VALIDATION_THRESHOLDS.BILL.INVALID_BELOW) {
            return {
                status: 'INVALID',
                confidence: 0,
                reason: `Hospital bill too short to verify (${length} chars, need at least 100)`
            };
        }

        // Check for bill keywords (required for all tiers)
        if (!VALIDATION_THRESHOLDS.BILL_KEYWORDS.test(text)) {
            return {
                status: 'INVALID',
                confidence: 0,
                reason: 'Not a hospital bill - missing required keywords (total, amount, hospital, bill, etc.)'
            };
        }

        // TIER 2: INCONCLUSIVE - Short but may contain valid info
        if (length < VALIDATION_THRESHOLDS.BILL.INCONCLUSIVE_BELOW) {
            return {
                status: 'INCONCLUSIVE',
                confidence: 50, // Cap at 50%
                penaltyReason: `Short hospital bill (${length} chars) - confidence capped at 50%`
            };
        }

        // TIER 3: ELIGIBLE - Full validation
        return {
            status: 'ELIGIBLE',
            confidence: -1 // No cap, use AI confidence
        };
    }

    /**
     * Map GROQ verification status to AnalysisOutcome
     */
    private mapStatusToOutcome(status: string, confidence: number): AnalysisOutcome {
        const upperStatus = (status || '').toUpperCase();
        if (upperStatus === 'SUCCESS' && confidence >= 70) {
            return 'VALID_ANALYSIS';
        } else if (upperStatus === 'PARTIAL' || (confidence >= 40 && confidence < 70)) {
            return 'INCONCLUSIVE';
        } else {
            return 'NOT_POSSIBLE';
        }
    }

    /**
     * FINAL BACKEND FLOW
     * 
     * Step 1: Validate files exist (multer)
     * Step 2: OCR rejection letter → text
     * Step 3: OCR hospital bill → text
     * Step 4: Hard validation (rules, not AI) ⚠️
     * Step 5: Send clean text to Groq
     * Step 6: Groq returns structured JSON
     * Step 7: Map to frontend result
     */
    public async processClaim(
        id: string,
        files: { rejection: string; bill: string },
        dates: { admissionDate?: Date; dischargeDate?: Date; submissionDate?: Date }
    ): Promise<void> {
        const verificationDetails: string[] = [];

        try {
            logger.info(`[Pipeline] Starting FINAL FLOW analysis for ${id}`);

            // ========== STEP 1: VALIDATE FILES EXIST ==========
            this.updateStage(id, 'validating_documents', 'Validating uploaded files...');
            logger.info(`[Step 1] File validation passed (handled by middleware)`);
            verificationDetails.push('Files uploaded successfully');

            // ========== STEP 2 & 3: OCR EXTRACTION ==========
            this.updateStage(id, 'extracting_text', 'Extracting text via OCR...');
            logger.info(`[Step 2-3] Starting OCR extraction...`);

            const [rejectionOcr, billOcr] = await Promise.all([
                ocrService.processFile(files.rejection),
                ocrService.processFile(files.bill)
            ]);

            const rejectionText = rejectionOcr.text;
            const billText = billOcr.text;

            logger.info(`[Step 2] Rejection OCR: ${rejectionText.length} chars`);
            logger.info(`[Step 3] Bill OCR: ${billText.length} chars`);
            verificationDetails.push(`OCR extracted: Rejection ${rejectionText.length} chars, Bill ${billText.length} chars`);

            // ========== STEP 4: TIERED VALIDATION (CRITICAL) ==========
            this.updateStage(id, 'validating_documents', 'Running tiered validation...');
            logger.info(`[Step 4] Starting TIERED VALIDATION (rules, not AI)...`);

            // Validate rejection letter
            const rejectionValidation = this.validateRejectionLetter(rejectionText);
            let confidenceCap = -1; // No cap by default
            let forceInconclusive = false;

            if (rejectionValidation.status === 'INVALID') {
                logger.warn(`[Step 4] VALIDATION FAILED - Rejection: ${rejectionValidation.reason}`);
                this.results.set(id, {
                    analysisId: id,
                    status: 'completed',
                    outcome: 'NOT_POSSIBLE',
                    stage: 'completed',
                    message: 'Validation Failed',
                    issue: 'Invalid Rejection Letter',
                    description: rejectionValidation.reason!,
                    confidenceScore: 0,
                    rawAiConfidence: 0,
                    verificationStatus: 'failed',
                    verificationDetails: [...verificationDetails, `❌ ${rejectionValidation.reason}`],
                    checks: ['Validation: FAILED'],
                    actionableSteps: [
                        'Upload a valid rejection letter from your insurance company',
                        'Ensure the document contains rejection or denial language',
                        'The document should be at least 150 characters when scanned'
                    ]
                });
                logger.info(`Analysis ${id} stopped at VALIDATION (rejection letter INVALID)`);
                return;
            } else if (rejectionValidation.status === 'INCONCLUSIVE') {
                logger.warn(`[Step 4] Rejection letter: INCONCLUSIVE - ${rejectionValidation.penaltyReason}`);
                verificationDetails.push(`⚠️ ${rejectionValidation.penaltyReason}`);
                confidenceCap = Math.min(confidenceCap === -1 ? 50 : confidenceCap, 50);
                forceInconclusive = true;
            } else {
                verificationDetails.push('✓ Rejection letter passed validation (ELIGIBLE)');
                logger.info(`[Step 4] Rejection letter: ELIGIBLE`);
            }

            // Validate hospital bill
            const billValidation = this.validateBill(billText);

            if (billValidation.status === 'INVALID') {
                logger.warn(`[Step 4] VALIDATION FAILED - Bill: ${billValidation.reason}`);
                this.results.set(id, {
                    analysisId: id,
                    status: 'completed',
                    outcome: 'NOT_POSSIBLE',
                    stage: 'completed',
                    message: 'Validation Failed',
                    issue: 'Invalid Hospital Bill',
                    description: billValidation.reason!,
                    confidenceScore: 0,
                    rawAiConfidence: 0,
                    verificationStatus: 'failed',
                    verificationDetails: [...verificationDetails, `❌ ${billValidation.reason}`],
                    checks: ['Rejection letter: PASSED', 'Hospital bill: FAILED'],
                    actionableSteps: [
                        'Upload a valid hospital bill or invoice',
                        'Ensure the document contains billing/amount information',
                        'The document should be at least 100 characters when scanned'
                    ]
                });
                logger.info(`Analysis ${id} stopped at VALIDATION (hospital bill INVALID)`);
                return;
            } else if (billValidation.status === 'INCONCLUSIVE') {
                logger.warn(`[Step 4] Hospital bill: INCONCLUSIVE - ${billValidation.penaltyReason}`);
                verificationDetails.push(`⚠️ ${billValidation.penaltyReason}`);
                confidenceCap = Math.min(confidenceCap === -1 ? 50 : confidenceCap, 50);
                forceInconclusive = true;
            } else {
                verificationDetails.push('✓ Hospital bill passed validation (ELIGIBLE)');
                logger.info(`[Step 4] Hospital bill: ELIGIBLE`);
            }

            if (forceInconclusive) {
                logger.info(`[Step 4] ⚠️ VALIDATION INCONCLUSIVE - Proceeding with 50% confidence cap`);
            } else {
                logger.info(`[Step 4] ✅ ALL VALIDATION PASSED - Proceeding to AI analysis`);
            }

            // ========== STEP 5 & 6: GROQ ANALYSIS ==========
            this.updateStage(id, 'analyzing_data', 'Analyzing with AI (Groq)...');
            logger.info(`[Step 5-6] Sending clean text to Groq...`);

            if (!groqClient.isAvailable()) {
                throw new Error('GROQ client not available - API key missing');
            }

            // Format dates for GROQ
            const formattedDates = {
                admissionDate: dates.admissionDate?.toISOString().split('T')[0],
                dischargeDate: dates.dischargeDate?.toISOString().split('T')[0],
                claimSubmissionDate: dates.submissionDate?.toISOString().split('T')[0]
            };

            const groqResult = await groqClient.analyzeClaim(billText, rejectionText, formattedDates);

            logger.info(`[Step 6] Groq returned structured JSON:`);
            logger.info(`  - Analysis Status: ${groqResult.analysis_status}`);
            logger.info(`  - Confidence Score: ${groqResult.confidence}%`);
            logger.info(`  - Hospital Bill Valid: ${groqResult.bill_valid}`);
            logger.info(`  - Rejection Letter Valid: ${groqResult.rejection_valid}`);

            // ========== STEP 7: MAP RESULT FOR FRONTEND ==========
            // Apply confidence cap if tiered validation was INCONCLUSIVE
            let finalConfidence = groqResult.confidence;
            let finalOutcome = this.mapStatusToOutcome(groqResult.analysis_status, groqResult.confidence);

            if (forceInconclusive) {
                // Cap confidence at 50% for INCONCLUSIVE documents
                finalConfidence = Math.min(finalConfidence, confidenceCap);
                // Force INCONCLUSIVE outcome if not already NOT_POSSIBLE
                if (finalOutcome !== 'NOT_POSSIBLE') {
                    finalOutcome = 'INCONCLUSIVE';
                }
                logger.info(`[Step 7] Applied confidence cap: ${groqResult.confidence}% → ${finalConfidence}% (capped at ${confidenceCap}%)`);
            }

            const outcome = finalOutcome;
            const confidenceScore = finalConfidence;

            // Build checks list
            const checks: string[] = [
                forceInconclusive ? `Tiered Validation: INCONCLUSIVE (50% cap)` : `Tiered Validation: PASSED`,
                `AI Confidence: ${groqResult.confidence}%${forceInconclusive ? ` → ${confidenceScore}% (capped)` : ''}`,
                `Analysis Status: ${groqResult.analysis_status}`,
                `Rejection Reasons Found: ${groqResult.rejection_reasons.length}`
            ];

            // Add any issues from GROQ
            if (groqResult.issues.length > 0) {
                groqResult.issues.forEach(issue => {
                    checks.push(`⚠️ ${issue}`);
                    verificationDetails.push(`Issue: ${issue}`);
                });
            }

            // Add reason codes
            if (groqResult.reason_codes.length > 0) {
                groqResult.reason_codes.forEach(code => {
                    verificationDetails.push(`Reason Code: ${code}`);
                });
            }

            // Build description based on structured reasons
            let description = groqResult.summary || '';

            // Override description if we have structured reasons (Reason First UX)
            if (groqResult.rejection_reasons.length > 0) {
                description = groqResult.rejection_reasons.map(r => r.explanation).join(' ');
            }

            // Save final result
            this.results.set(id, {
                analysisId: id,
                status: 'completed',
                outcome,
                stage: 'completed',
                message: `Analysis ${groqResult.analysis_status}`,
                issue: this.buildIssueTitle(outcome, groqResult),
                description,
                confidenceScore,
                rawAiConfidence: groqResult.confidence, // Use raw confidence here
                verificationStatus: groqResult.analysis_status.toLowerCase() as any,
                verificationDetails,
                checks,
                actionableSteps: this.getDefaultActionableSteps(outcome),
                extractedData: {
                    admissionDate: groqResult.dates.admission_date,
                    dischargeDate: groqResult.dates.discharge_date,
                    claimSubmissionDate: groqResult.dates.claim_submission_date,
                    totalAmount: groqResult.amounts.total_bill?.toString() || null,
                    rejectionReasons: groqResult.rejection_reasons // Pass structured reasons to frontend
                },
                ocrPreview: {
                    rejectionPreview: rejectionText.substring(0, 150) + '...',
                    billPreview: billText.substring(0, 150) + '...'
                }
            });

            logger.info(`Analysis ${id} completed as ${outcome} with confidence ${confidenceScore}%`);

        } catch (error) {
            logger.error(`Analysis ${id} failed:`, error);
            const current = this.results.get(id);
            if (current) {
                this.results.set(id, {
                    ...current,
                    status: 'failed',
                    outcome: 'ERROR',
                    stage: 'failed',
                    message: 'System Error',
                    issue: 'Analysis Failed',
                    description: `An error occurred: ${(error as Error).message}`,
                    confidenceScore: 0,
                    verificationStatus: 'failed',
                    verificationDetails: [...verificationDetails, `Error: ${(error as Error).message}`]
                });
            }
        }
    }

    /**
     * Build issue title based on outcome
     */
    /**
     * Build issue title based on outcome
     */
    private buildIssueTitle(outcome: AnalysisOutcome, groqResult: GroqAnalysisResult): string {
        // PRIORITIZE SPECIFIC REASONS for all outcomes (User requirement: Always show reason)
        if (groqResult.rejection_reasons.length > 0) {
            return groqResult.rejection_reasons[0].title;
        }

        if (groqResult.reason_codes.length > 0) {
            return groqResult.reason_codes[0]; // e.g. "Pre-Authorization Mismatch"
        }

        if (groqResult.issues.length > 0) {
            return groqResult.issues[0]; // e.g. "Document unreadable"
        }

        if (outcome === 'VALID_ANALYSIS') {
            return 'Claim Analysis Complete';
        } else if (outcome === 'INCONCLUSIVE') {
            return 'Analysis Partially Complete';
        } else {
            return 'Analysis Not Possible';
        }
    }

    /**
     * Default actionable steps based on outcome
     */
    private getDefaultActionableSteps(outcome: AnalysisOutcome): string[] {
        if (outcome === 'VALID_ANALYSIS') {
            return [
                'Review the extracted information for accuracy',
                'Generate an escalation letter based on the analysis',
                'Contact your insurance provider with the findings'
            ];
        } else if (outcome === 'INCONCLUSIVE') {
            return [
                'Review the identified issues carefully',
                'Upload clearer or additional documents if available',
                'You may still proceed, but review results before acting'
            ];
        } else {
            return [
                'Ensure you are uploading the correct document types',
                'Upload clearer images of your documents',
                'Verify documents are complete and readable'
            ];
        }
    }

    public async analyzeClaim(claimText: string, dates: any): Promise<AnalysisResult> {
        throw new Error("Use async processClaim flow");
    }

    public saveResult(id: string, result: AnalysisResult): void {
        this.results.set(id, result);
    }
}

export const analysisService = new AnalysisService();

import Groq from 'groq-sdk';
import logger from '../../utils/logger';

// STRICT JSON SYSTEM PROMPT
export const SYSTEM_PROMPT = `You are an insurance claim analysis engine.
Your output must be VALID JSON only. 
Do not include any explanations, markdown formatting, or code blocks.
If you cannot find information, return null or empty arrays as specified in the schema.
STRICT RULE: The output must be parseable by JSON.parse() without any modification.`;

// UPDATED DEEP ANALYSIS PROMPT
const PROMPT_TEMPLATE = `
You are an expert insurance claims analyst.

You are given:
1. OCR text from an insurance rejection letter
2. OCR text from a hospital bill

Your task is to IDENTIFY THE MOST LIKELY REASONS for claim rejection
by combining explicit statements AND implicit insurance logic.

IMPORTANT RULES:
- Do not stop at surface phrases like "claim denied"
- Infer reasons based on:
  • Amount approved vs amount billed
  • Partial insurance payments
  • Common insurance rules (pre-auth, sub-limits, exclusions)
- If the reason is inferred (not explicitly stated), label it as "Inferred"
- Do NOT invent facts not supported by documents
- Prefer insurance-standard terminology

ANALYSIS STEPS (DO INTERNALLY):
1. Identify whether claim was fully denied or partially approved
2. Compare billed amount vs insurance payment
3. Determine what insurance rule most likely caused the shortfall
4. Extract supporting evidence text

OUTPUT STRICT JSON ONLY:

{
  "rejection_reasons": [
    {
      "reason_type": "Explicit | Inferred",
      "title": "Short title of the reason",
      "explanation": "Detailed explanation of why this led to rejection",
      "evidence": "Quote or fact from documents",
      "document_source": "rejection_letter | hospital_bill | both"
    }
  ],
  "overall_confidence": number between 0 and 1,
  "confidence_note": "Confience reasoning..."
}

DO NOT include any text outside the JSON.

CONTEXT:
HOSPITAL BILL TEXT:
{{BILL_TEXT}}

REJECTION LETTER TEXT:
{{REJECTION_TEXT}}

DATES:
{{DATES}}
`;

export interface RejectionReason {
    reason_type: 'Explicit' | 'Inferred';
    title: string;
    explanation: string;
    evidence: string;
    document_source: 'rejection_letter' | 'hospital_bill' | 'both';
}

export interface GroqAnalysisResult {
    analysis_status: 'SUCCESS' | 'PARTIAL' | 'FAILED'; // Derived in client, not prompt
    rejection_reasons: RejectionReason[];
    confidence: number; // mapped from overall_confidence (0-100)
    confidence_note: string;
    // Legacy fields for compatibility if needed, or derived
    bill_valid: boolean;
    rejection_valid: boolean;
    issues: string[];
    dates: {
        admission_date: string | null;
        discharge_date: string | null;
        claim_submission_date: string | null;
    };
    amounts: {
        total_bill: number | null;
        insurance_paid: number | null;
        patient_responsibility: number | null;
    };
    reason_codes: string[];
    summary: string;
}

// Inner interface for the raw LLM response matching the prompt schema
interface RawLlmResponse {
    rejection_reasons: RejectionReason[];
    overall_confidence: number;
    confidence_note: string;
}

class GroqClient {
    private client: Groq | null = null;
    private model: string = 'llama-3.1-8b-instant';

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            logger.warn('[GroqClient] GROQ_API_KEY not set - GROQ analysis will not be available');
            return;
        }

        this.client = new Groq({ apiKey });
        logger.info(`[GroqClient] Initialized with model: ${this.model}, temperature: 0`);
    }

    public isAvailable(): boolean {
        return this.client !== null;
    }

    async analyzeClaim(
        billText: string,
        rejectionText: string,
        dates: { admissionDate?: string; dischargeDate?: string; claimSubmissionDate?: string }
    ): Promise<GroqAnalysisResult> {
        if (!this.client) {
            throw new Error('Groq client not initialized');
        }

        // Format dates for the prompt
        const dateString = `
Admission: ${dates.admissionDate || 'Not provided'}
Discharge: ${dates.dischargeDate || 'Not provided'}
Claim Submission: ${dates.claimSubmissionDate || 'Not provided'}`;

        const prompt = PROMPT_TEMPLATE
            .replace('{{BILL_TEXT}}', billText)
            .replace('{{REJECTION_TEXT}}', rejectionText)
            .replace('{{DATES}}', dateString);

        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                temperature: 0,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const content = completion.choices[0]?.message?.content || '{}';
            return this.parseResponse(content);

        } catch (error) {
            console.error('Groq Analysis Failed:', error);
            // Return Safe Failure State
            return {
                analysis_status: 'FAILED',
                rejection_reasons: [],
                confidence: 0,
                confidence_note: 'Analysis failed due to system error.',
                bill_valid: false,
                rejection_valid: false,
                issues: ['AI_SERVICE_UNAVAILABLE'],
                dates: { admission_date: null, discharge_date: null, claim_submission_date: null },
                amounts: { total_bill: null, insurance_paid: null, patient_responsibility: null },
                reason_codes: [],
                summary: 'System error during analysis.'
            };
        }
    }

    private parseResponse(content: string): GroqAnalysisResult {
        try {
            // Clean up content
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const raw: RawLlmResponse = JSON.parse(cleanContent);

            // Map Raw Response to Full GroqAnalysisResult
            const hasReasons = Array.isArray(raw.rejection_reasons) && raw.rejection_reasons.length > 0;
            const confidence = typeof raw.overall_confidence === 'number' ? raw.overall_confidence : 0;

            return {
                analysis_status: hasReasons ? 'SUCCESS' : (confidence > 0 ? 'PARTIAL' : 'FAILED'),
                rejection_reasons: raw.rejection_reasons || [],
                confidence: confidence > 1 ? confidence : confidence * 100, // Handle 0-1 vs 0-100 scales
                confidence_note: raw.confidence_note || '',

                // Derived/Backwards Compatible Fields
                bill_valid: true,
                rejection_valid: hasReasons,
                issues: hasReasons ? [] : ['No specific rejection reasons identified.'],
                dates: { admission_date: null, discharge_date: null, claim_submission_date: null },
                amounts: { total_bill: null, insurance_paid: null, patient_responsibility: null },
                reason_codes: raw.rejection_reasons?.map(r => r.title) || [],
                summary: raw.rejection_reasons?.map(r => r.explanation).join(' ') || raw.confidence_note || 'No summary available.'
            };

        } catch (error) {
            console.error('JSON Parse Error:', error);
            return {
                analysis_status: 'FAILED',
                rejection_reasons: [],
                confidence: 0,
                confidence_note: 'Failed to parse AI response.',
                bill_valid: false,
                rejection_valid: false,
                issues: ['AI_RESPONSE_PARSE_FAILED'],
                dates: { admission_date: null, discharge_date: null, claim_submission_date: null },
                amounts: { total_bill: null, insurance_paid: null, patient_responsibility: null },
                reason_codes: [],
                summary: 'Error parsing analysis results.'
            };
        }
    }

    /**
     * GRO Email Lookup
     */
    public async getGroEmail(companyName: string): Promise<string | null> {
        if (!this.client) {
            logger.warn('[GroqClient] Client not initialized, returning null for GRO lookup');
            return null;
        }

        const prompt = `
You are a lookup engine.

Task:
Find the official Grievance Redressal Officer (GRO) email address
for the insurance company named below.

Rules:
- Return ONLY the email address.
- If the email cannot be confidently determined, return exactly: NOT_FOUND
- Do NOT include explanations.
- Do NOT include quotes.
- Do NOT include formatting.
- Output must be a single line.

Insurance Company:
${companyName}
`.trim();

        try {
            const completion = await this.client.chat.completions.create({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
                max_tokens: 20
            });

            const output = completion.choices[0]?.message?.content?.trim();

            if (!output || output === 'NOT_FOUND') {
                return null;
            }

            return output;
        } catch (error) {
            logger.error('[GroqClient] GRO lookup failed:', error);
            return null;
        }
    }
}

export const groqClient = new GroqClient();

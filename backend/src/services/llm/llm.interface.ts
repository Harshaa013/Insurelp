export interface BillData {
    patientName: string | null;
    hospitalName: string | null;
    admissionDate: string | null;
    dischargeDate: string | null;
    totalAmount: number | null;
    billNumber: string | null;
}

export type DocumentType = 'hospital_bill' | 'rejection_letter' | 'unrelated_document';

export interface ValidationResult {
    isValid: boolean;
    type: DocumentType;
    reason?: string;
    confidence: number;
}

export interface ILLMProvider {
    /**
     * Extracts structured data from raw text using schema checking.
     * @param text Raw text input from OCR.
     * @returns Promise resolving to BillData.
     * @returns Promise resolving to BillData | null.
     */
    extractBillData(text: string): Promise<BillData | null>;

    /**
     * Generates a user-friendly explanation and next steps based on analysis context.
     * @param context Text describing the rule failures or analysis findings.
     * @returns Promise resolving to structured explanation.
     */
    generateExplanation(context: string): Promise<{ description: string; actionableSteps: string[]; confidenceScore: number }>;

    /**
     * Classifies the given document text into a predefined type and provides validation results.
     * @param text Raw text input from OCR.
     * @returns Promise resolving to ValidationResult.
     */
    classifyDocument(text: string): Promise<ValidationResult>;

    /**
     * Verifies that the extracted data exists verbatim in the source text.
     * @param text Raw source text.
     * @param data Extracted BillData to verify.
     * @returns Promise resolving to a confidence score (0-100).
     */
    verifyExtraction(text: string, data: BillData): Promise<number>;

    /**
     * Returns the name of the provider.
     */
    getName(): string;
}

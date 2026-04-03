import { ILLMProvider, BillData, ValidationResult } from './llm.interface';

export class MockLLMProvider implements ILLMProvider {
    getName(): string {
        return 'MOCK_LLM';
    }

    async extractBillData(text: string): Promise<BillData> {
        // Deterministic mock extraction based on keyword presence
        // This simulates an LLM finding data in the OCR text

        return {
            patientName: text.includes('John Doe') ? 'John Doe' : 'Unknown Patient',
            hospitalName: 'Apollo Hospital',
            admissionDate: '2023-01-01',
            dischargeDate: '2023-01-05',
            totalAmount: 150000,
            billNumber: 'INV-2023-001'
        };
    }

    async generateExplanation(context: string): Promise<{ description: string; actionableSteps: string[]; confidenceScore: number }> {
        // Mock logic to simulate "AI Explanation" based on the input context (which will contain rule failures)

        if (context.includes('Discharge Date is before Admission Date')) {
            return {
                description: "The AI has detected a critical date discrepancy. The discharge date appears to be listed before the admission date, which is logically impossible and likely a clerical error in the submitted forms.",
                actionableSteps: ["Verify the dates on the Discharge Summary", "Request a corrected document from the Hospital Administration"],
                confidenceScore: 95
            };
        }

        if (context.includes('Document Completeness')) {
            return {
                description: "The analysis indicates that the Discharge Summary is missing from the uploaded documents. This is a mandatory document for claim processing.",
                actionableSteps: ["Locate the original Discharge Summary", "Upload the file again ensuring it includes the summary"],
                confidenceScore: 90
            };
        }

        if (context.includes('Policy Exclusions')) {
            return {
                description: "Keywords related to policy exclusions (such as 'alcohol' or 'cosmetic') were found in the clinical notes. This may trigger a rejection based on standard policy terms.",
                actionableSteps: ["Review policy terms for specific exclusions", "Provide a medical justification letter if the treatment was medically necessary and not cosmetic"],
                confidenceScore: 85
            };
        }

        // Default "Success" explanation
        return {
            description: "The Standard Analysis has not detected any immediate 'Red Flags'. However, manual review is recommended for specific medical necessity criteria.",
            actionableSteps: ["Submit the claim for final processing", "Monitor status via the portal"],
            confidenceScore: 80
        };
    }
    async classifyDocument(text: string): Promise<ValidationResult> {
        const lowerText = text.toLowerCase();

        // Mock Classification Logic
        if (lowerText.includes('rejection') || lowerText.includes('denial') || lowerText.includes('claim')) {
            return {
                isValid: true,
                type: 'rejection_letter',
                confidence: 90,
                reason: 'Found keywords: rejection, claim'
            };
        }

        if (lowerText.includes('total amount') || lowerText.includes('invoice') || lowerText.includes('bill')) {
            return {
                isValid: true,
                type: 'hospital_bill',
                confidence: 85,
                reason: 'Found keywords: total amount, invoice'
            };
        }

        // Special case for our "bad" test case
        if (lowerText.includes('dummy') || lowerText.includes('irrelevant')) {
            return {
                isValid: false,
                type: 'unrelated_document',
                confidence: 99,
                reason: 'Document appears unrelated to insurance claims.'
            };
        }

        // Default to bill if unclear in mock, or rejection? 
        // Let's default to unrelated if really empty, but for mock purposes:
        return {
            isValid: true,
            type: 'hospital_bill',
            confidence: 60,
            reason: 'Default classification (Mock)'
        };
    }

    async verifyExtraction(text: string, data: BillData): Promise<number> {
        // Mock Verification Logic
        // In a real LLM, we'd send the prompt.
        // Here, we check if the extracted values are roughly present in the text.

        // Simulating "Perfect Match" for our happy path
        if (text.includes('Apollo Hospital') && text.includes('150000')) {
            return 98;
        }

        if (text.includes('unclear')) {
            return 40; // Trigger refusal
        }

        // Simulating "Low Confidence" for unknown/empty text
        if (!text || text.length < 10) {
            return 40;
        }

        return 95; // Default high confidence for mock
    }
}

export type AnalysisStage = 'validating_documents' | 'extracting_text' | 'analyzing_data' | 'generating_report' | 'completed' | 'failed';

export interface AnalysisInput {
    claimText: string;
    dates: {
        admissionDate?: Date;
        dischargeDate?: Date;
        submissionDate?: Date;
    };
}

export type AnalysisOutcome = 'VALID_ANALYSIS' | 'INCONCLUSIVE' | 'NOT_POSSIBLE' | 'ERROR';

export interface AnalysisResult {
    analysisId?: string;
    issue: string;
    description: string;
    confidenceScore: number;
    checks: string[];
    actionableSteps: string[];

    // Status tracking
    status: 'idle' | 'processing' | 'completed' | 'failed';
    outcome: AnalysisOutcome | null;
    stage?: AnalysisStage;
    message?: string;

    // Verification details (new)
    rawAiConfidence?: number;
    verificationStatus?: 'passed' | 'failed' | 'partial';
    verificationDetails?: string[];

    // Data
    extractedData?: any;
    ocrPreview?: {
        rejectionPreview: string;
        billPreview: string;
    };
}

export interface IAnalysisProvider {
    getName(): string;
    analyze(input: AnalysisInput): Promise<AnalysisResult>;
}

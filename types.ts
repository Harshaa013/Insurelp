export enum AppStep {
  LANDING = 'LANDING',
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  LETTER = 'LETTER',
  SIGNIN = 'SIGNIN'
}

export interface FileState {
  rejectionLetter: File | null;
  hospitalBill: File | null;
}

export interface DateState {
  admissionDate: string;
  dischargeDate: string;
  submissionDate: string;
}

export interface AnalysisData {
  issue: string;
  description: string;
  checks: string[];
}

// Updated to include INCONCLUSIVE and NOT_POSSIBLE
export type AnalysisOutcome = 'VALID_ANALYSIS' | 'INCONCLUSIVE' | 'NOT_POSSIBLE' | 'ERROR';

// New structured reason interface
export interface RejectionReason {
  reason_type: 'Explicit' | 'Inferred'; // New field for deep analysis
  title: string;
  explanation: string; // Renamed from description for clarity/prompt alignment
  evidence: string;
  document_source: 'rejection_letter' | 'hospital_bill' | 'both';
}

export interface AnalysisResult {
  analysisId: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  outcome: AnalysisOutcome | null;
  issue: string;
  description: string; // Summary description
  confidenceScore: number;
  checks: string[];
  actionableSteps: string[];

  // Structured data including reasons
  extractedData?: {
    admissionDate: string | null;
    dischargeDate: string | null;
    claimSubmissionDate: string | null;
    totalAmount: string | null;
    rejectionReasons?: RejectionReason[];
  };

  // New verification details
  rawAiConfidence?: number;
  verificationStatus?: 'passed' | 'failed' | 'partial';
  verificationDetails?: string[];
}
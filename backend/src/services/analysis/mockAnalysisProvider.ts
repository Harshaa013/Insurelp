import { IAnalysisProvider, AnalysisInput, AnalysisResult } from './analysis.interface';

export class MockAnalysisProvider implements IAnalysisProvider {
    getName(): string {
        return 'MockAnalysis';
    }

    async analyze(input: AnalysisInput): Promise<AnalysisResult> {
        console.log('[MockAnalysis] Analyzing input...');

        // Simple keyword matching to simulate "AI"
        if (input.claimText.toLowerCase().includes('emergency')) {
            return {
                issue: "Emergency Protocol Mismatch",
                description: "The claim was rejected because emergency procedures were not pre-authorized, but the documentation indicates an immediate life-threatening condition.",
                confidenceScore: 92,
                checks: ["Emergency Admission Criteria", "Vitals Assessment", "Triage Classification"],
                actionableSteps: ["Highlight Triage Report", "Cite IRDAI Emergency Clause"],
                status: 'completed',
                outcome: 'VALID_ANALYSIS'
            };
        }

        // Default response (matching frontend "Pre-Auth Scope Mismatch")
        return {
            issue: "Pre-Auth Scope Mismatch",
            description: "Based on our analysis, there may have been a procedural error regarding the pre-authorization scope vs final billing. The insurer likely rejected the claim claiming the procedure was outside the authorized limit, but failed to account for emergency exigencies documented in the discharge summary.",
            confidenceScore: 90,
            checks: [
                "Policy Check",
                "Medical Necessity",
                "Policy Exclusion Verification"
            ],
            actionableSteps: [
                "Review & Sign Grievance Letter",
                "Find Grievance Officer Email",
                "Attach Pre-Auth Request Copy"
            ],
            status: 'completed',
            outcome: 'VALID_ANALYSIS'
        };
    }

    private mockRejection(input: AnalysisInput): AnalysisResult {
        return {
            issue: 'Policy Exclusions applied',
            description: 'The claim contains items that are explicitly excluded under the policy terms (e.g., non-medical expenses).',
            confidenceScore: 85,
            checks: ['Policy Check (Failed)', 'Medical Necessity'],
            actionableSteps: ['Review policy exclusions', 'Submit justification if applicable'],
            status: 'completed',
            outcome: 'VALID_ANALYSIS'
        };
    }
}

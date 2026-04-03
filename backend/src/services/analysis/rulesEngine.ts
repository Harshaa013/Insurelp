import { AnalysisInput } from './analysis.interface';

export interface RuleResult {
    passed: boolean;
    name: string;
    description: string;
}

export class RulesEngine {
    public execute(input: AnalysisInput): RuleResult[] {
        const results: RuleResult[] = [];

        results.push(this.checkDateConsistency(input));
        results.push(this.checkMissingDocuments(input.claimText));
        results.push(this.checkExcludedItems(input.claimText));
        results.push(this.checkWaitingPeriod(input));

        return results;
    }

    private checkDateConsistency(input: AnalysisInput): RuleResult {
        const { admissionDate, dischargeDate, submissionDate } = input.dates;

        // If dates are missing, we pass (relaxed validation) or warn? 
        // User requirements said "Date mismatch".
        if (!admissionDate || !dischargeDate) {
            return { passed: true, name: 'Date Consistency', description: 'Dates not fully provided, skipped consistency check.' };
        }

        const admit = new Date(admissionDate);
        const discharge = new Date(dischargeDate);

        if (discharge < admit) {
            return { passed: false, name: 'Date Consistency', description: 'Discharge Date is before Admission Date.' };
        }

        if (submissionDate) {
            const submission = new Date(submissionDate);
            if (submission < discharge) {
                return { passed: false, name: 'Date Consistency', description: 'Claim Submission Date is before Discharge Date.' };
            }
        }

        return { passed: true, name: 'Date Consistency', description: 'Dates are logically consistent.' };
    }

    private checkMissingDocuments(text: string): RuleResult {
        // Simple heuristic: "Discharge Summary" is critical
        const hasDischargeSummary = text.toLowerCase().includes('discharge summary') || text.toLowerCase().includes('discharge card');
        if (!hasDischargeSummary) {
            // We won't fail hard, but we'll flag it
            // Actually, if it's a "Rejection Letter" upload, maybe we check for that?
            // Context says we have claimText combined.
            return { passed: false, name: 'Document Completeness', description: 'Discharge Summary keywords not found in text.' };
        }
        return { passed: true, name: 'Document Completeness', description: 'Essential documents appear to be present.' };
    }

    private checkExcludedItems(text: string): RuleResult {
        const excludedKeywords = ['alcohol', 'cosmetic surgery', 'non-medical'];
        const found = excludedKeywords.filter(k => text.toLowerCase().includes(k));

        if (found.length > 0) {
            return { passed: false, name: 'Policy Exclusions', description: `Potential excluded items found: ${found.join(', ')}` };
        }
        return { passed: true, name: 'Policy Exclusions', description: 'No policy exclusions detected in text.' };
    }

    private checkWaitingPeriod(input: AnalysisInput): RuleResult {
        // Mock logic: Assume policy start date is 2 years ago by default.
        // If admission date is within 30 days of "policy start", fail.
        // For this mock, we'll check if admission date is strangely close to a "known recent policy" date or just pass.
        // Let's implement a dummy check: If admission date is in Jan 2020, it fails (simulating a waiting period clause).

        if (input.dates.admissionDate) {
            const admit = new Date(input.dates.admissionDate);
            if (admit.getFullYear() === 2020 && admit.getMonth() === 0) {
                return { passed: false, name: 'Waiting Period', description: 'Admission is within the initial 30-day waiting period of the policy.' };
            }
        }
        return { passed: true, name: 'Waiting Period', description: 'claim is outside valid waiting periods.' };
    }
}

export const rulesEngine = new RulesEngine();

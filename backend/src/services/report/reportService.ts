import { AnalysisResult } from '../analysis/analysis.interface';

export class ReportService {
    public generateReport(result: AnalysisResult): AnalysisResult {
        // 1. Simplify Description (Simulated "Jargon Removal")
        const simpleDescription = this.simplifyText(result.description);

        // 2. Add Confidence Explanation to Description
        const confidenceNote = this.getConfidenceExplanation(result.confidenceScore, result.issue);
        const finalDescription = `${simpleDescription} ${confidenceNote}`;

        // 3. Format Checks as "Key Points" (Short sentences)
        // We'll map existing checks (which might be rule names) to friendlier text if possible
        // or just pass them through if they are already readable.
        const friendlyChecks = result.checks.map(check => this.makeFriendly(check));

        return {
            ...result,
            description: finalDescription,
            checks: friendlyChecks
        };
    }

    private simplifyText(text: string): string {
        // Simple heuristics to replace specific jargon words
        // In a real system, this might use an LLM or a dictionary
        let simplified = text
            .replace(/pre-authorization/gi, "pre-approval")
            .replace(/exigencies/gi, "urgent needs")
            .replace(/procedural error/gi, "process mistake")
            .replace(/scope vs final billing/gi, "approved cost vs actual bill");

        return simplified;
    }

    private getConfidenceExplanation(score: number, issue: string): string {
        if (score >= 90) {
            return `We are highly confident (${score}%) in this result because clear evidence was found in your documents regarding ${issue}.`;
        } else if (score >= 70) {
            return `We are reasonably confident (${score}%), but some details regarding ${issue} might be ambiguous.`;
        } else {
            return `Our confidence is lower (${score}%). We recommend manually reviewing the ${issue} section.`;
        }
    }

    private makeFriendly(check: string): string {
        // Handle failed states first to avoid overwriting with success messages
        if (check.includes('Failed')) {
            if (check.includes('Date Consistency')) return 'Date inconsistency found';
            if (check.includes('Document Completeness')) return 'Missing required documents';
            if (check.includes('Policy Exclusions')) return 'Policy exclusion triggered';
            if (check.includes('Waiting Period')) return 'Waiting period not met';

            return check.replace('(Failed)', '- Attention Needed');
        }

        if (check.includes('Policy Check')) return 'Policy rules verified';
        if (check.includes('Medical Necessity')) return 'Medical need confirmed';
        if (check.includes('Date Consistency')) return 'Dates are logical';
        if (check.includes('Document Completeness')) return 'All documents present';
        if (check.includes('Policy Exclusions')) return 'No excluded items';
        if (check.includes('Waiting Period')) return 'Waiting period satisfied';

        return check;
    }
}

export const reportService = new ReportService();

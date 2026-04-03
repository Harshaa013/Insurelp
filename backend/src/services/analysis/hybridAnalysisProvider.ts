import { IAnalysisProvider, AnalysisInput, AnalysisResult } from './analysis.interface';
import { rulesEngine } from './rulesEngine';
import { llmService } from '../llm/llmService';
import { PIISanitizer } from '../../utils/piiSanitizer';

export class HybridAnalysisProvider implements IAnalysisProvider {
    public getName(): string {
        return 'HYBRID_ENGINE';
    }

    public async analyze(input: AnalysisInput): Promise<AnalysisResult> {
        console.log('[HybridProvider] analyze called');

        // 1. Run Deterministic Rules
        const ruleResults = rulesEngine.execute(input);
        const failedRules = ruleResults.filter(r => !r.passed);

        // 2. Construct Context for LLM with PII MASKING
        const maskedClaimText = PIISanitizer.mask(input.claimText);

        let context = `Claim Text: ${maskedClaimText.substring(0, 500)}...\n\n`; // Truncate for prompt
        if (failedRules.length > 0) {
            context += `CRITICAL RULE FAILURES:\n${failedRules.map(r => `- ${r.name}: ${r.description}`).join('\n')}\n`;
        } else {
            context += "Rules Check: All deterministic checks passed. Please review for medical necessity/subtle issues.\n";
        }

        // 3. Get LLM Explanation using classification (which includes analysis)
        // Note: We use classifyDocument as a simple text analysis since generateExplanation was removed
        const llmResult = await llmService.classifyDocument(context);

        // 4. Merge Results
        // If rules failed, use LLM's explanation (which is primed by context) but ensure status is failed?
        // Actually, frontend just shows issue/desc. 
        // We probably want to map failed rules to "checks" list.

        const checks = ruleResults.map(r => r.passed ? r.name : `${r.name} (Failed)`);

        return {
            issue: failedRules.length > 0 ? "Policy/Procedure Violation" : "No Immediate Issues",
            description: llmResult.reason || 'Analysis complete',
            confidenceScore: llmResult.confidence,
            checks: checks,
            actionableSteps: [],
            status: 'completed',
            outcome: 'VALID_ANALYSIS'
        };
    }
}

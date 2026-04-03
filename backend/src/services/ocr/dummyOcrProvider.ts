import { IOcrProvider, OcrResult } from './ocr.interface';

export class DummyOcrProvider implements IOcrProvider {
    public getName(): string {
        return 'DummyOCR';
    }

    public async extract(filePath: string): Promise<OcrResult> {
        console.log(`[DummyOCR] Processing file: ${filePath}`);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // For testing/mock purposes, verify_analysis.sh writes text directly to the file.
        // So we can just read it.
        const fs = require('fs');
        let extractedText = "";
        try {
            extractedText = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
            extractedText = "Error reading file";
        }

        return {
            text: extractedText,
            confidence: 0.99,
            metadata: {
                provider: 'dummy',
                timestamp: new Date().toISOString()
            }
        };
    }
}

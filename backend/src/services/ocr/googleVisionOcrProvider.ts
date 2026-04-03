import { IOcrProvider, OcrResult } from './ocr.interface';
import { ImageAnnotatorClient } from '@google-cloud/vision';
import path from 'path';

export class GoogleVisionOCRProvider implements IOcrProvider {
    private client: ImageAnnotatorClient | null = null;
    private initError: Error | null = null;

    constructor() {
        const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credentialsPath) {
            // Resolve path relative to CWD
            const resolvedPath = path.resolve(process.cwd(), credentialsPath);
            try {
                // Simple file check using fs.accessSync or just try/catch around require?
                // Let's use fs.existsSync so we don't crash the auth library
                const fs = require('fs');
                if (fs.existsSync(resolvedPath)) {
                    this.client = new ImageAnnotatorClient();
                } else {
                    this.initError = new Error(`Credentials file not found at ${resolvedPath}`);
                }
            } catch (error) {
                this.initError = error as Error;
            }
        } else {
            this.initError = new Error('GOOGLE_APPLICATION_CREDENTIALS not set');
        }
    }

    public getName(): string {
        return 'GOOGLE_VISION';
    }

    public async extract(filePath: string): Promise<OcrResult> {
        if (this.initError) {
            throw new Error(`Google Vision client failed to initialize: ${this.initError.message}`);
        }
        if (!this.client) {
            // Try one more time or just fail?
            // Constructor should have caught it.
            throw new Error('Google Vision client not initialized.');
        }

        try {
            const [result] = await this.client.documentTextDetection(filePath);
            const fullTextAnnotation = result.fullTextAnnotation;

            if (!fullTextAnnotation) {
                return {
                    text: '',
                    confidence: 0,
                    metadata: {}
                };
            }

            const text = fullTextAnnotation.text || '';

            // Calculate average confidence (pages -> blocks -> paragraphs -> words -> symbols -> confidence)
            // This is computationally intuitive but Google gives generic page confidence sometimes? 
            // Actually, page.confidence exists in some versions, but standard way is block/paragraph aggregation.
            // For simplicity/robustness, we'll try to get page confidence or average it.

            const pagesLength = fullTextAnnotation.pages?.length || 0;
            let totalConfidence = 0;
            let blockCount = 0;

            const pagesData = fullTextAnnotation.pages?.map((page, index) => {
                let pageText = '';
                let pageConfidence = 0;
                let pageBlockCount = 0;

                page.blocks?.forEach(block => {
                    block.paragraphs?.forEach(paragraph => {
                        paragraph.words?.forEach(word => {
                            word.symbols?.forEach(symbol => {
                                pageText += symbol.text;
                            });
                            pageText += ' ';
                        });
                        // Basic approximation if block confidence is available, else we default
                        if (block.confidence) {
                            pageConfidence += block.confidence;
                            pageBlockCount++;
                            totalConfidence += block.confidence;
                            blockCount++;
                        }
                    });
                    pageText += '\n';
                });

                return {
                    pageNumber: index + 1,
                    text: pageText.trim(),
                    confidence: pageBlockCount > 0 ? pageConfidence / pageBlockCount : 0
                };
            }) || [];

            const finalConfidence = blockCount > 0 ? (totalConfidence / blockCount) * 100 : 0; // scaled to 0-100 for consistency

            return {
                text: text,
                confidence: Math.round(finalConfidence),
                metadata: {
                    pages: pagesData,
                    provider: 'google-vision'
                }
            };

        } catch (error) {
            throw error; // Let the service handle fallback
        }
    }
}

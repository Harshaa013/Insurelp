import { IOcrProvider, OcrResult } from './ocr.interface';
import { DummyOcrProvider } from './dummyOcrProvider';
import { GoogleVisionOCRProvider } from './googleVisionOcrProvider';
import { GeminiVisionOCRProvider } from './geminiVisionOcrProvider';
import { TesseractOcrProvider } from './tesseractOcrProvider';
import logger from '../../utils/logger';

// Configuration: Use environment variable or default to TESSERACT (local, no API limits)
type OcrProviderType = 'DUMMY' | 'GOOGLE_VISION' | 'GEMINI_VISION' | 'TESSERACT';

export class OcrService {
    private provider: IOcrProvider;
    private fallbackProvider: IOcrProvider;

    constructor(providerType: OcrProviderType = 'TESSERACT') {
        this.provider = this.createProvider(providerType);
        // Use Tesseract as fallback since it has no API limits
        this.fallbackProvider = providerType === 'TESSERACT'
            ? new DummyOcrProvider()
            : this.createFallbackProvider();

        logger.info(`[OcrService] Initialized with primary: ${this.provider.getName()}, fallback: ${this.fallbackProvider.getName()}`);
    }

    private createProvider(type: OcrProviderType): IOcrProvider {
        switch (type) {
            case 'DUMMY':
                return new DummyOcrProvider();
            case 'GOOGLE_VISION':
                return new GoogleVisionOCRProvider();
            case 'GEMINI_VISION':
                try {
                    return new GeminiVisionOCRProvider();
                } catch (error) {
                    logger.warn(`[OcrService] Failed to create Gemini Vision provider, falling back to Tesseract: ${(error as Error).message}`);
                    return new TesseractOcrProvider();
                }
            case 'TESSERACT':
                return new TesseractOcrProvider();
            default:
                logger.warn(`Unknown OCR provider type: ${type}, falling back to Tesseract.`);
                return new TesseractOcrProvider();
        }
    }

    private createFallbackProvider(): IOcrProvider {
        // Use Tesseract as fallback - it's local and has no API limits
        try {
            return new TesseractOcrProvider();
        } catch {
            logger.warn('[OcrService] Tesseract unavailable, using Dummy as fallback');
            return new DummyOcrProvider();
        }
    }

    public async processFile(filePath: string): Promise<OcrResult> {
        logger.info(`[OcrService] Processing file with ${this.provider.getName()}`);

        try {
            return await this.provider.extract(filePath);
        } catch (error) {
            logger.error(`[OcrService] Primary provider ${this.provider.getName()} failed: ${(error as Error).message}`);

            if (this.provider.getName() !== this.fallbackProvider.getName()) {
                logger.info(`[OcrService] Attempting fallback to ${this.fallbackProvider.getName()}`);
                try {
                    return await this.fallbackProvider.extract(filePath);
                } catch (fallbackError) {
                    logger.error(`[OcrService] Fallback provider also failed: ${(fallbackError as Error).message}`);
                    throw error; // Throw original error
                }
            }

            throw error;
        }
    }
}

// Singleton instance - defaults to TESSERACT (local OCR, no API limits)
export const ocrService = new OcrService((process.env.OCR_PROVIDER as OcrProviderType) || 'TESSERACT');

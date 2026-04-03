export interface OcrResult {
    text: string;
    confidence: number;
    metadata?: Record<string, any>;
}

export interface IOcrProvider {
    /**
     * Extracts text from a given file path.
     * @param filePath Absolute path to the file.
     * @returns Promise resolving to the OcrResult.
     */
    extract(filePath: string): Promise<OcrResult>;

    /**
     * Returns the name of the provider.
     */
    getName(): string;
}

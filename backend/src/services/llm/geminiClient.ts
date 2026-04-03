import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../../utils/logger';

export class GeminiClient {
    private model: any;
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';

        if (!this.apiKey) {
            logger.error('CRITICAL: GEMINI_API_KEY is missing from environment variables.');
            throw new Error('GEMINI_API_KEY is required for operation.');
        }

        const genAI = new GoogleGenerativeAI(this.apiKey);
        
        this.model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    }

    public async generateText(prompt: string): Promise<string> {
        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            logger.error('Gemini API Error:', error);
            throw new Error('AI Service Unavailable');
        }
    }

    public async generateObject(prompt: string): Promise<any> {
        try {
            const result = await this.model.generateContent(prompt + "\n\nReturn strictly valid JSON.");
            const response = await result.response;
            const text = response.text();

            // Clean markdown code blocks if present
            const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            logger.error('Gemini JSON Parse/API Error:', error);
            throw new Error(`AI Service Failed: ${(error as Error).message}`);
        }
    }
}

export const geminiClient = new GeminiClient();

export class PIISanitizer {
    /**
     * Masks sensitive patterns in text including:
     * - Email addresses
     * - Phone numbers
     * - Dates (optional context dependent)
     * - Common ID patterns (Aadhar-like, PAN-like) which are usually 12 digits or specific alphanumerics
     */
    public static mask(text: string): string {
        if (!text) return text;

        let masked = text;

        // Mask Emails
        masked = masked.replace(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g, '[REDACTED_EMAIL]');

        // Mask Phone Numbers (Simple 10 digit, or with country code)
        // Matches +91... or 10 digits
        masked = masked.replace(/(?:\+91|0)?[6-9]\d{9}/g, '[REDACTED_PHONE]');

        // Mask Aadhar-like (12 digits, often spaces in between)
        // \d{4}\s\d{4}\s\d{4}
        masked = masked.replace(/\b\d{4}\s\d{4}\s\d{4}\b/g, '[REDACTED_UID]');
        masked = masked.replace(/\b\d{12}\b/g, '[REDACTED_UID]');

        // Mask PAN-like (5 char, 4 digit, 1 char)
        masked = masked.replace(/[A-Z]{5}[0-9]{4}[A-Z]{1}/g, '[REDACTED_PAN]');

        return masked;
    }
}

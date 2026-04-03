export class PromptTemplates {
  public static getExplanationPrompt(context: string): string {
    return `
You are an expert Health Insurance Claims Analyst.
Your task is to explain why a claim might be rejected based on the provided analysis checks.

CONTEXT RULES:
${context}

INSTRUCTIONS:
1. Review the "CRITICAL RULE FAILURES" in the context carefully.
2. If rules failed, explain clearly what policy or data issue triggered the failure.
3. If no rules failed, look for subtle issues or confirm the claim looks good.
4. Provide a "Confidence Score" (0-100) reflecting how certain you are based on the evidence provided.
5. List specific "Actionable Steps" the user can take to fix the issue (e.g., "Upload Discharge Summary", "Check dates").

OUTPUT FORMAT (JSON):
{
  "description": "Clear explanation...",
  "actionableSteps": ["Step 1", "Step 2"],
  "confidenceScore": 85
}

RESPOND ONLY WITH VALID JSON.
`;
  }

  public static getDocumentClassificationPrompt(text: string): string {
    // Truncate to first 2000 chars to avoid token limits while preserving context
    const truncatedText = text.length > 2000 ? text.substring(0, 2000) : text;

    return `You are a medical insurance document classifier.

Given OCR-extracted text, classify the document as ONE of:

- REJECTION_LETTER
- HOSPITAL_BILL
- UNRELATED_DOCUMENT

Rules:
- If document is unrelated or ambiguous, choose UNRELATED_DOCUMENT
- Do NOT guess
- REJECTION_LETTER: Must reference claim denial, rejection, or insurance refusal
- HOSPITAL_BILL: Must contain charges, amounts, hospital/clinic name, patient details
- Return JSON only

Input Text:
${truncatedText}

Format:
{
  "documentType": "REJECTION_LETTER" | "HOSPITAL_BILL" | "UNRELATED_DOCUMENT",
  "confidence": 0-100,
  "reason": "short explanation"
}`;
  }

  public static getBillExtractionPrompt(text: string): string {
    return `
You are a precise Data Extraction AI.
Extract the following fields from the Hospital Bill text provided below.
Return NULL for any field not explicitly found. Do not hallucinate.

Fields to Extract:
- hospitalName (string)
- patientName (string)
- billNumber (string)
- admissionDate (YYYY-MM-DD or null)
- dischargeDate (YYYY-MM-DD or null)
- totalAmount (number)

Input Text:
${text}

Output JSON:
{
  "hospitalName": "...",
  "patientName": "...",
  "billNumber": "...",
  "admissionDate": "...",
  "dischargeDate": "...",
  "totalAmount": 1000
}
    `;
  }

  public static getVerificationPrompt(text: string, extractedData: any): string {
    return `
You are a Forensic Data Verifier.
Compare the "Extracted Data" against the "Original Text".
For each field, determine if the extracted value is EXACTLY present or logically derived from the text.

Original Text:
${text}

Extracted Data:
${JSON.stringify(extractedData, null, 2)}

Instructions:
1. Verify "hospitalName": Is it in the text?
2. Verify "totalAmount": Does it match the final total?
3. Verify Dates: do they match?

Output JSON:
{
  "verificationScore": 0-100, // 100 = Perfect match, 0 = Complete hallucination
  "mismatches": ["field1", "field2"], // List fields that are wrong
  "reason": "Explanation of score"
}
    `;
  }
}

/**
 * GRO Directory - Local Dataset
 * Contains official Grievance Redressal Officer email addresses for major Indian health insurers.
 * 
 * ⚠️ This is a local, hardcoded dataset. No API calls required.
 */

export const GRO_DIRECTORY = [
    {
        company: "Star Health and Allied Insurance Company Limited",
        groEmail: "grievance@starhealth.in"
    },
    {
        company: "HDFC ERGO General Insurance Company Limited",
        groEmail: "grievance@hdfcergo.com"
    },
    {
        company: "ICICI Lombard General Insurance Company Limited",
        groEmail: "customersupport@icicilombard.com"
    },
    {
        company: "New India Assurance Company Limited",
        groEmail: "gro@newindia.co.in"
    },
    {
        company: "United India Insurance Company Limited",
        groEmail: "gro@uiic.co.in"
    },
    {
        company: "Bajaj Allianz General Insurance Company Limited",
        groEmail: "bagichelp@bajajallianz.co.in"
    },
    {
        company: "Reliance General Insurance Company Limited",
        groEmail: "gro@reliancegeneral.co.in"
    }
];

/**
 * Normalize text for fuzzy matching
 * Removes common insurance company suffixes and normalizes whitespace
 */
export function normalizeCompanyName(text: string): string {
    return text
        .toLowerCase()
        .replace(/insurance|company|limited|ltd|and|&/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Find GRO email using fuzzy matching
 * @param userInput - The company name entered by the user
 * @returns The matching GRO entry or null if not found
 */
export function findGroEmail(userInput: string): { company: string; groEmail: string } | null {
    const normalizedInput = normalizeCompanyName(userInput);

    console.log("GRO search input:", userInput);
    console.log("Normalized input:", normalizedInput);

    const match = GRO_DIRECTORY.find(entry => {
        const normalizedCompany = normalizeCompanyName(entry.company);
        return normalizedCompany.includes(normalizedInput) || normalizedInput.includes(normalizedCompany);
    });

    console.log("Matched GRO:", match);

    return match || null;
}

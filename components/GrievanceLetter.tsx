import React, { useState } from 'react';
import { Mail, PenTool, Search, Clock, Download, CheckCircle, X, Copy, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { findGroEmail } from '../src/data/groDirectory';

interface GrievanceLetterProps {
  letterContent?: string;
  analysisData?: {
    issue?: string;
    description?: string;
    extractedData?: {
      hospital_name?: string;
      total_amount?: string;
      admission_date?: string;
      discharge_date?: string;
    };
  };
}

export const GrievanceLetter: React.FC<GrievanceLetterProps> = ({ letterContent, analysisData }) => {
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "complete">("idle");

  // GRO Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Generate letter text from analysis data or use provided content
  const generateLetterText = (): string => {
    const today = new Date().toLocaleDateString();
    const hospitalName = analysisData?.extractedData?.hospital_name || '[Hospital Name]';
    const totalAmount = analysisData?.extractedData?.total_amount || '[Amount]';
    const admissionDate = analysisData?.extractedData?.admission_date || '[Admission Date]';
    const dischargeDate = analysisData?.extractedData?.discharge_date || '[Discharge Date]';
    const issue = analysisData?.issue || 'Claim Rejection';
    const description = analysisData?.description || '';

    if (letterContent) {
      return letterContent;
    }

    return `FORMAL GRIEVANCE LETTER
To: Grievance Redressal Officer

[Your Name]
[Your Address]
[Policy Number: P-XXXXXXXXXX]
[Claim Number: C-XXXXXXXXXX]

Date: ${today}

Subject: Formal Grievance regarding ${issue}

Dear Sir/Madam,

I am writing to formally lodge a grievance against the rejection of my health insurance claim.

CLAIM DETAILS:
- Hospital: ${hospitalName}
- Admission Date: ${admissionDate}
- Discharge Date: ${dischargeDate}
- Total Amount: ${totalAmount}

REASON FOR GRIEVANCE:
${description || 'The rejection of my claim appears to be based on an incorrect assessment of the submitted documents. I believe this decision should be reviewed.'}

According to IRDAI guidelines and the policy terms, I request a thorough review of my claim with consideration of the following:

1. All medical documents have been submitted as required
2. The treatment was medically necessary
3. The claim falls within the policy coverage terms

I kindly request you to:
1. Review the attached documents and medical records
2. Reconsider the claim rejection decision
3. Process the pending amount at the earliest

As per regulatory guidelines, I expect a response within 15 days.

Thank you for your attention to this matter.

Sincerely,

[Your Signature]
[Your Name]
[Contact Number]
[Email Address]`;
  };

  const handleDownloadPDF = () => {
    const letterText = generateLetterText();

    if (!letterText) {
      alert("Letter content missing");
      return;
    }

    setDownloadStatus("downloading");

    try {
      const pdf = new jsPDF();

      // Set font
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);

      // Split text to fit page width (180mm with 15mm margins)
      const lines = pdf.splitTextToSize(letterText, 180);

      // Add text with proper positioning
      pdf.text(lines, 15, 20);

      // Save the PDF
      pdf.save("Insurance_Grievance_Letter.pdf");

      setDownloadStatus("complete");

      // Reset after 2 seconds
      setTimeout(() => {
        setDownloadStatus("idle");
      }, 2000);

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Failed to generate PDF. Please try again.");
      setDownloadStatus("idle");
    }
  };

  const handleGroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);

    // Use local fuzzy matching
    const match = findGroEmail(searchQuery);

    // Simulate a brief delay for UX feedback
    setTimeout(() => {
      if (match) {
        setSearchResult(match.groEmail);
      } else {
        setSearchError("No GRO email found for this insurer.\nTry entering the full or partial company name.");
      }
      setIsSearching(false);
    }, 300);
  };

  const copyToClipboard = () => {
    if (searchResult) {
      navigator.clipboard.writeText(searchResult);
    }
  };

  const today = new Date().toLocaleDateString();
  const hospitalName = analysisData?.extractedData?.hospital_name || '[Hospital Name]';
  const totalAmount = analysisData?.extractedData?.total_amount || '$4,500';
  const issue = analysisData?.issue || 'Pre-Auth Scope Mismatch';

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-heading font-bold text-slate-800 mb-8 text-center md:text-left">Your Grievance Letter Is Ready!</h2>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Column: Letter Preview */}
        <div className="lg:w-1/2 flex flex-col">
          <div className="bg-white border border-slate-200 shadow-lg p-8 md:p-12 min-h-[500px] text-xs md:text-sm text-slate-700 font-serif leading-relaxed relative rounded-sm">

            {/* Paper Texture/Lines Effect */}
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-500 rounded-t-sm"></div>

            <div className="text-center mb-8 border-b pb-4 border-slate-100">
              <h3 className="font-bold text-base uppercase tracking-widest text-slate-900">Formal Grievance Letter</h3>
              <p className="text-slate-500 mt-1">To Grievance Redressal Officer</p>
            </div>

            <div className="space-y-4 mb-8">
              <p className="font-bold">[Your Name]</p>
              <p className="font-bold">[Policy Number: P-12345678]</p>
              <p className="font-bold">[Claim Number: C-987654321]</p>
              <p>Date: {today}</p>
            </div>

            <div className="space-y-4 text-justify">
              <p>Subject: Formal Grievance regarding {issue}.</p>
              <p>
                Dear Sir/Madam,
              </p>
              <p>
                I am writing to formally lodge a grievance against the rejection of my claim. The rejection reason provided does not align with the documentation submitted. The emergency nature of the treatment is clearly documented in the attached discharge summary.
              </p>
              <p>
                According to IRDAI guidelines and the policy terms, emergency treatments are permissible when medically necessary. The refusal to consider the clinical context constitutes a procedural error.
              </p>
              <p>
                I request you to review the attached documents and process the pending amount of {totalAmount} immediately.
              </p>
            </div>

            <div className="mt-12">
              <p>Sincerely,</p>
              <p className="mt-8 border-t border-black w-40 pt-1">[Signature]</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-6 relative">
            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloadStatus === "downloading"}
              className={`flex-1 font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center transition-all h-12 ${downloadStatus === "complete"
                ? "bg-green-500 text-white"
                : downloadStatus === "downloading"
                  ? "bg-brand-400 text-white cursor-wait"
                  : "bg-brand-600 hover:bg-brand-700 text-white"
                }`}
            >
              {downloadStatus === "complete" ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" /> Downloaded!
                </>
              ) : downloadStatus === "downloading" ? (
                <>
                  <Download className="w-5 h-5 mr-2 animate-bounce" /> Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" /> Download PDF
                </>
              )}
            </button>

            {/* GRO Search Tool */}
            {!isSearchOpen ? (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-4 rounded-md shadow-md flex items-center justify-center transition-colors h-12"
              >
                <Search className="w-5 h-5 mr-2" /> Find GRO Email
              </button>
            ) : (
              <div className="absolute inset-x-0 bottom-0 bg-white border border-slate-200 shadow-xl rounded-lg p-4 z-20 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 text-sm">Find GRO Email</h4>
                  <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!searchResult ? (
                  <form onSubmit={handleGroSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter Insurer Name (e.g. Star Health)"
                      className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                      autoFocus
                    />
                    <button
                      type="button" // Changed from submit for safety, but button in form defaults to submit
                      onClick={() => handleGroSearch({ preventDefault: () => { } } as React.FormEvent)}
                      disabled={isSearching}
                      className="bg-amber-500 text-white px-3 py-2 rounded-md hover:bg-amber-600 disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </button>
                  </form>
                ) : (
                  <div className="flex gap-2 items-center bg-green-50 border border-green-200 rounded-md p-2">
                    <span className="flex-1 text-sm font-mono text-green-900 truncate">{searchResult}</span>
                    <button
                      onClick={copyToClipboard}
                      className="text-green-700 hover:text-green-900 p-1"
                      title="Copy Email"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSearchResult(null); setSearchQuery(''); }}
                      className="text-slate-400 hover:text-slate-600 text-xs underline ml-2"
                    >
                      New Search
                    </button>
                  </div>
                )}

                {searchError && (
                  <p className="text-xs text-red-500 mt-2">{searchError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="lg:w-1/2 space-y-6">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Next Steps</h3>

            <div className="grid gap-4">
              {/* Action 1 */}
              <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-orange-100 p-2 rounded-lg mr-4">
                  <PenTool className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">1. Review & Sign</h4>
                  <p className="text-sm text-slate-600 mt-1">Download the letter, review the details, and sign it physically or digitally.</p>
                </div>
              </div>

              {/* Action 2 */}
              <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsSearchOpen(true)}>
                <div className="bg-orange-100 p-2 rounded-lg mr-4">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">2. Find the Email</h4>
                  <p className="text-sm text-slate-600 mt-1">Use our tool to find the specific Grievance Officer's email for your insurer.</p>
                </div>
              </div>

              {/* Action 3 */}
              <div className="flex items-start p-4 bg-orange-50 border border-orange-100 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                <div className="bg-orange-100 p-2 rounded-lg mr-4">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">3. Await Response</h4>
                  <p className="text-sm text-slate-600 mt-1">They must reply within 15 days as per regulatory guidelines.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-100 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Need Help?</h3>
            <div className="space-y-3">
              <div className="flex items-center text-slate-700">
                <div className="w-5 h-5 rounded-full bg-brand-200 flex items-center justify-center mr-3 text-brand-700 text-xs font-bold">✓</div>
                Contact Our Support Team
              </div>
              <div className="flex items-center text-slate-700">
                <Mail className="w-5 h-5 text-brand-500 mr-3" />
                <a href="mailto:support@projectn.com" className="hover:text-brand-600 underline">support@projectn.com</a>
              </div>
              <div className="flex items-center text-slate-700">
                <div className="w-5 h-5 flex items-center justify-center mr-3">
                  <span className="text-brand-500 font-bold text-lg">☎</span>
                </div>
                <span>+91 98765 43210</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

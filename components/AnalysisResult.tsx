import React, { useEffect, useState } from 'react';
import * as api from '../lib/api';
import { AlertTriangle, CheckCircle, ChevronRight, XCircle, AlertCircle, Info, FileText } from 'lucide-react';
import { AnalysisResult as AnalysisResultType } from '../types';

interface AnalysisResultProps {
  onGenerate: () => void;
  analysisId: string;
  onAnalysisSuccess?: (data: AnalysisResultType) => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ onGenerate, analysisId, onAnalysisSuccess }) => {
  const [data, setData] = useState<AnalysisResultType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await api.getAnalysisResult(analysisId);
        setData(result);
        if (result && onAnalysisSuccess) {
          onAnalysisSuccess(result);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (analysisId) fetchData();
  }, [analysisId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-600 font-medium animate-pulse">Analyzing documents...</p>
    </div>
  );

  if (!data) return <div className="p-12 text-center text-red-500">Failed to load results.</div>;

  const { outcome, issue, description, confidenceScore, checks, actionableSteps } = data;
  const isError = outcome === 'ERROR';
  const confidence = confidenceScore || 0;
  const isLowConfidence = confidence < 70;

  // Theme selection based on outcome/confidence
  const getTheme = () => {
    if (isError) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-500', button: 'bg-red-600 hover:bg-red-700' };
    if (isLowConfidence) return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-slate-900', icon: 'text-amber-500', button: 'bg-amber-500 hover:bg-amber-600' };
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-slate-900', icon: 'text-green-500', button: 'bg-brand-600 hover:bg-brand-700' };
  };

  const theme = getTheme();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-heading font-bold text-slate-800 mb-6 text-center md:text-left">
        {isError ? 'Analysis Failed' : 'Reason for Claim Rejection'}
      </h2>

      <div className={`bg-white rounded-xl shadow-lg border overflow-hidden ${isError ? 'border-red-200' : 'border-slate-200'}`}>

        {/* Main Content Section */}
        <div className={`p-8 ${theme.bg} border-b ${theme.border}`}>
          <div className="flex items-start space-x-4">
            <div className={`mt-1 bg-white p-2 rounded-lg shadow-sm ${theme.icon}`}>
              {isError ? <XCircle className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
            </div>

            <div className="flex-1">
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
                {issue || 'Claim Analysis'}
              </h3>

              {/* STRUCTURED REASONS DISPLAY (Deep Analysis Mode) */}
              {data.extractedData?.rejectionReasons && data.extractedData.rejectionReasons.length > 0 ? (
                <div className="space-y-4 mt-3">
                  {data.extractedData.rejectionReasons.map((reason, idx) => (
                    <div key={idx} className="bg-white/50 rounded-lg p-3 border border-slate-100">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide ${reason.reason_type === 'Explicit' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {reason.reason_type}
                        </span>
                        <h4 className="font-bold text-slate-800 text-md">{reason.title}</h4>
                      </div>
                      <p className="text-slate-700 text-sm mt-1">{reason.explanation}</p>
                      {reason.evidence && (
                        <div className="mt-2 text-xs bg-slate-50 p-2 rounded border border-slate-100 italic text-slate-600">
                          <span className="font-semibold text-slate-900 not-italic">Evidence: </span>
                          "{reason.evidence}"
                          <span className="block mt-1 text-slate-400 not-italic">Source: {reason.document_source.replace('_', ' ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-700 leading-relaxed text-lg">
                  {description || 'No detailed description available.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {!isError && (
          <div className="p-8 space-y-8">
            {/* Details Found */}
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Details Found:
              </h4>
              <ul className="space-y-3">
                {checks?.map((check, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-slate-700">
                    <div className="mt-1">
                      {check.includes('PASSED') || check.includes('Yes') ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : check.includes('FAILED') || check.includes('No') ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <span className="text-sm">{check}</span>
                  </li>
                ))}
                {/* Improved Confidence Badge (Deep Analysis) */}
                <li className="flex items-center space-x-3 pt-2">
                  <span className="text-sm font-medium text-slate-500">Analysis Confidence:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${confidence >= 90 ? 'bg-green-100 text-green-800' :
                      confidence >= 70 ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                    }`}>
                    {confidence >= 90 ? 'High' : confidence >= 70 ? 'Medium' : 'Medium'}
                    <span className="ml-1 font-normal opacity-75">
                      (inferred from billing & insurer response)
                    </span>
                  </span>
                </li>
              </ul>
            </div>

            {/* Validation Warning (Conditional) */}
            {isLowConfidence && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-1">Verification note:</p>
                  <p>
                    The rejection letter appears clearly, but some details might be standard boilerplate.
                    For stronger legal certainty, ensure your uploaded documents are clear.
                  </p>
                  <p className="mt-2 font-medium">
                    You may still proceed with grievance generation.
                  </p>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 flex justify-end">
              <button
                onClick={onGenerate}
                className={`${theme.button} text-white text-lg font-bold py-3 px-8 rounded-lg shadow-md transition-all flex items-center group`}
              >
                Generate Escalation Letter
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <p className="text-center text-slate-400 text-xs mt-8">
        AI-assisted analysis based on IRDAI guidelines. Always verify details before submission.
      </p>
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import * as api from '../lib/api';
import { Upload, Calendar, CheckCircle2, FileText, X, Search, UploadCloud } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface UploadFormProps {
  onAnalyze: (analysisId: string) => void;
}

export const UploadForm: React.FC<UploadFormProps> = ({ onAnalyze }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState(0);

  // File States
  const [rejectionFile, setRejectionFile] = useState<File | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  // Separate progress for individual file uploads for visual effect
  const [rejectionProgress, setRejectionProgress] = useState(0);
  const [billProgress, setBillProgress] = useState(0);

  // Date States
  const [admissionDate, setAdmissionDate] = useState('');
  const [dischargeDate, setDischargeDate] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'rejection' | 'bill') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'rejection') {
        setRejectionFile(file);
        simulateUpload(setRejectionProgress);
      } else {
        setBillFile(file);
        simulateUpload(setBillProgress);
      }
    }
  };

  const simulateUpload = (setProgress: React.Dispatch<React.SetStateAction<number>>) => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleAnalyzeClick = async () => {
    if (!rejectionFile && !billFile) {
      return;
    }

    setAnalyzing(true);
    setGlobalProgress(10); // Start progress

    // --- REAL API INTEGRATION ---
    if (rejectionFile && billFile) {
      try {
        // Single Step: Upload & Trigger Analysis
        const formData = new FormData();
        formData.append("rejection_document", rejectionFile);
        formData.append("hospital_bill", billFile);
        formData.append("admission_date", admissionDate);
        formData.append("discharge_date", dischargeDate);
        formData.append("claim_submission_date", submissionDate);

        // TASK 3: LOGGING
        console.log("Preparing FormData for submission...");
        for (const pair of formData.entries()) {
          console.log(`FormData: ${pair[0]}`, pair[1]);
        }

        // Direct axios call - letting axios set the Content-Type boundary
        const response = await axios.post(
          "http://localhost:3000/api/v1/analyze-claim",
          formData
        );
        const initResult = response.data.data;

        if (initResult.analysisId) {
          // Poll for Completion
          const pollInterval = setInterval(async () => {
            try {
              const statusResult = await api.getAnalysisResult(initResult.analysisId);

              // Map backend stages to progress %
              let progress = 0;
              if (statusResult.stage === 'validating_documents') progress = 20;
              if (statusResult.stage === 'extracting_text') progress = 40;
              if (statusResult.stage === 'analyzing_data') progress = 60;
              if (statusResult.stage === 'generating_report') progress = 80;
              if (statusResult.status === 'completed') progress = 100;

              setGlobalProgress(progress);

              if (statusResult.status === 'completed') {
                clearInterval(pollInterval);
                setAnalyzing(false);
                onAnalyze(initResult.analysisId);
              }
              if (statusResult.status === 'failed') {
                clearInterval(pollInterval);
                setAnalyzing(false);
                alert("Analysis Failed: " + (statusResult.message || "Unknown error"));
              }
            } catch (e) {
              // Ignore transient errors
            }
          }, 1000);
        }

      } catch (error) {
        console.error("Analysis Failed", error);
        setAnalyzing(false);
        alert("Analysis failed! Check console.");
      }
    }
  };

  const removeFile = (type: 'rejection' | 'bill') => {
    if (type === 'rejection') {
      setRejectionFile(null);
      setRejectionProgress(0);
    } else {
      setBillFile(null);
      setBillProgress(0);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">

      {/* Background Decor - mimicking the sparkly/dreamy background in image */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 z-0" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/20 rounded-full blur-[80px]" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl overflow-hidden"
      >
        {/* Header */}
        <div className="pt-10 pb-6 px-8 md:px-12 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-800 tracking-tight">
            Upload Your Claim Documents
          </h2>
        </div>

        <div className="p-8 md:p-12 pt-2 grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left Upload Card: Rejection Proof */}
          <UploadCard
            title="Drop your rejection proof"
            subtitle="Supported: PDF, JPG, PNG"
            file={rejectionFile}
            progress={rejectionProgress}
            onChange={(e) => handleFileChange(e, 'rejection')}
            onRemove={() => removeFile('rejection')}
            id="rejection-upload"
          />

          {/* Right Upload Card: Hospital Bill */}
          <UploadCard
            title="Upload Final Hospital Bill"
            subtitle="Supported: PDF, JPG"
            file={billFile}
            progress={billProgress}
            onChange={(e) => handleFileChange(e, 'bill')}
            onRemove={() => removeFile('bill')}
            id="bill-upload"
          />

        </div>

        {/* Date Inputs Section */}
        <div className="px-8 md:px-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DateInput
              label="Admission Date"
              value={admissionDate}
              onChange={(e) => setAdmissionDate(e.target.value)}
            />
            <DateInput
              label="Discharge Date"
              value={dischargeDate}
              onChange={(e) => setDischargeDate(e.target.value)}
            />
            <DateInput
              label="Claim Submission Date"
              value={submissionDate}
              onChange={(e) => setSubmissionDate(e.target.value)}
            />
          </div>
        </div>

        {/* Footer / Action Section */}
        <div className="px-8 md:px-12 pb-12 flex flex-col items-center space-y-6">

          {/* Info Text */}
          <div className="flex items-center space-x-2 text-slate-500 text-sm font-medium bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Don't worry, we'll auto-read this soon ⚡</span>
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleAnalyzeClick}
            disabled={analyzing}
            className="group relative w-full max-w-md h-14 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 overflow-hidden"
          >
            {/* Background Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />

            {/* Content */}
            <div className="relative z-10 w-full h-full flex items-center justify-center space-x-2 text-lg font-bold">
              {analyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Analyzing... {Math.round(globalProgress)}%</span>
                </>
              ) : (
                <>
                  <span>Let's break this down</span>
                  <Search className="w-5 h-5 stroke-[2.5]" />
                </>
              )}
            </div>

            {/* Progress Bar (Bottom) */}
            {analyzing && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-100 ease-linear"
                style={{ width: `${globalProgress}%` }}
              />
            )}
          </button>

        </div>
      </motion.div>
    </div>
  );
};

// --- Sub Components ---

const UploadCard = ({
  title,
  subtitle,
  file,
  progress,
  onChange,
  onRemove,
  id
}: {
  title: string;
  subtitle: string;
  file: File | null;
  progress: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  id: string;
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col h-full min-h-[180px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <h3 className="text-lg font-semibold text-slate-800 mb-1 pl-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-4 pl-1">{subtitle}</p>

      <div
        className={cn(
          "relative flex-grow rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center p-6 bg-white/40 backdrop-blur-sm group cursor-pointer",
          isHovering ? "border-blue-400 bg-blue-50/30" : "border-white/60 hover:border-blue-300",
          file ? "border-solid border-white/0 shadow-inner bg-white/60" : "border-dashed"
        )}
        onClick={() => !file && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          className="hidden"
          onChange={onChange}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center text-center space-y-3"
            >
              <div className="w-16 h-12 relative">
                <UploadCloud className="w-12 h-12 text-blue-400 absolute top-0 left-1/2 -translate-x-1/2" />
                <motion.div
                  className="absolute -top-1 -right-2 text-yellow-400"
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨
                </motion.div>
              </div>

              <div className="space-y-1">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 text-blue-600">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-sm font-medium text-blue-600">
                  Drag & drop or <span className="underline">Browse</span>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="uploaded"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-3 w-full bg-white/80 p-3 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{file.name}</p>
                    <p className="text-xs text-green-600 font-medium flex items-center">
                      Uploaded! <CheckCircle2 className="w-3 h-3 ml-1" />
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="p-1 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const DateInput = ({ label, value, onChange }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
        </div>
        <input
          type="date"
          value={value}
          onChange={onChange}
          className="block w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl bg-white text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all shadow-sm hover:shadow-md"
          placeholder="dd/mm/yyyy"
        />
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { UploadForm } from './components/UploadForm';
import { AnalysisResult } from './components/AnalysisResult';
import { GrievanceLetter } from './components/GrievanceLetter';
import { HelpSection } from './components/HelpSection';
import { SignInCard } from './components/ui/sign-in-card-2';
import { AppStep } from './types';
import { renderCanvas } from './components/ui/canvas';

import { AnalysisResult as AnalysisResultType } from './types';

function App() {
  // ADAPTATION: Initial step is now SIGNIN as per requirement
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.SIGNIN);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResultType | null>(null);

  // Initialize Cursor Canvas
  // ADAPTATION: Dependency added [currentStep] to re-init canvas when moving from SIGNIN to LANDING
  useEffect(() => {
    const timer = setTimeout(() => {
      renderCanvas();
    }, 100);
    return () => clearTimeout(timer);
  }, [currentStep]);


  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Navigation handlers
  const handleStart = () => {
    setCurrentStep(AppStep.UPLOAD);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = (id: string) => {
    setAnalysisId(id);
    setCurrentStep(AppStep.ANALYSIS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalysisSuccess = (data: AnalysisResultType) => {
    setAnalysisResult(data);
  };

  const handleGenerate = () => {
    setCurrentStep(AppStep.LETTER);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHome = () => {
    setCurrentStep(AppStep.LANDING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignOut = () => {
    setCurrentStep(AppStep.SIGNIN);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Special layout for Sign In page (Full screen, no header/footer)
  if (currentStep === AppStep.SIGNIN) {
    // onSignInSuccess redirects to the Landing page
    return <SignInCard onSignInSuccess={handleHome} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* 
        Canvas for Cursor Effect. 
      */}
      <canvas
        className="fixed inset-0 pointer-events-none z-[100] mix-blend-difference opacity-40"
        id="canvas"
      ></canvas>

      <Header onNavigateHome={handleHome} onGetStarted={handleStart} onSignIn={handleSignOut} />

      <main className="flex-grow z-10 relative">
        {currentStep === AppStep.LANDING && (
          <Hero onStart={handleStart} />
        )}

        {currentStep === AppStep.UPLOAD && (
          <UploadForm onAnalyze={handleAnalyze} />
        )}

        {currentStep === AppStep.ANALYSIS && analysisId && (
          <AnalysisResult
            onGenerate={handleGenerate}
            analysisId={analysisId}
            onAnalysisSuccess={handleAnalysisSuccess}
          />
        )}

        {currentStep === AppStep.LETTER && (
          <GrievanceLetter analysisData={analysisResult || undefined} />
        )}
      </main>

      <HelpSection />
    </div>
  );
}

export default App;
import React from 'react';
import { FolderOpen, BarChart3, FileText, ArrowRight, Stethoscope, ShieldCheck, BadgeDollarSign, Building2, HeartPulse, FileSearch } from 'lucide-react';
import { Web3MediaHero } from "./ui/web3media-hero";

interface HeroProps {
  onStart: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStart }) => {
  return (
    <div className="bg-slate-50 overflow-hidden">
      {/* Web3MediaHero configured with Medical/Insurance Theme */}
      <Web3MediaHero
        title="Got a Rejected"
        highlightedText="Medical Claim?"
        subtitle="Don't let a procedural error cost you. Find out the likely reason and escalate it correctly with our intelligent analysis tool."
        ctaButton={{
          label: "Start Your Appeal",
          onClick: onStart
        }}
        hideHeader={true} // Hiding internal header to use the app's global header
        cryptoIcons={[
          {
            icon: <Stethoscope className="w-6 h-6 text-brand-600" />,
            label: "Clinical",
            position: { x: "15%", y: "20%" }
          },
          {
            icon: <ShieldCheck className="w-6 h-6 text-brand-600" />,
            label: "Coverage",
            position: { x: "80%", y: "15%" }
          },
          {
            icon: <BadgeDollarSign className="w-6 h-6 text-brand-600" />,
            label: "Claims",
            position: { x: "10%", y: "55%" }
          },
          {
            icon: <FileSearch className="w-6 h-6 text-brand-600" />,
            label: "Analysis",
            position: { x: "85%", y: "50%" }
          },
          {
            icon: <Building2 className="w-6 h-6 text-brand-600" />,
            label: "Provider",
            position: { x: "75%", y: "80%" }
          },
          {
            icon: <HeartPulse className="w-6 h-6 text-brand-600" />,
            label: "Vitals",
            position: { x: "20%", y: "75%" }
          }
        ]}
        trustedByText="Trusted by patients at"
        brands={[
          { name: "City General", logo: <span className="font-bold text-slate-400 text-sm md:text-base">City General</span> },
          { name: "Medicare", logo: <span className="font-bold text-slate-400 text-sm md:text-base">Medicare+</span> },
          { name: "HealthFirst", logo: <span className="font-bold text-slate-400 text-sm md:text-base">HealthFirst</span> },
          { name: "CareAll", logo: <span className="font-bold text-slate-400 text-sm md:text-base">CareAll</span> },
        ]}
      />

      {/* Steps Section */}
      <div className="bg-white py-16 border-t border-slate-100 relative z-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          
          <h2 className="text-2xl font-bold text-slate-800 mb-12">How It Works</h2>

          {/* Steps */}
          <div className="flex flex-col md:flex-row justify-center items-center md:items-start space-y-10 md:space-y-0 md:space-x-8 relative">
            
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-8 left-20 right-20 h-0.5 bg-slate-200 -z-10" />

            {/* Step 1 */}
            <div className="flex flex-col items-center relative bg-white md:bg-transparent p-4 md:p-0 w-full md:w-1/3">
              <div className="w-16 h-16 bg-white border-2 border-brand-100 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100 mb-4 transform transition-transform hover:scale-110">
                <FolderOpen className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">1. Upload Documents</h3>
              <p className="text-sm text-slate-500 mt-2">Securely share your bill and rejection letter</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center relative bg-white md:bg-transparent p-4 md:p-0 w-full md:w-1/3">
              <div className="w-16 h-16 bg-white border-2 border-brand-100 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100 mb-4 transform transition-transform hover:scale-110">
                <BarChart3 className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">2. Get Analysis</h3>
              <p className="text-sm text-slate-500 mt-2">Our engine detects the procedural error</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center relative bg-white md:bg-transparent p-4 md:p-0 w-full md:w-1/3">
              <div className="w-16 h-16 bg-white border-2 border-brand-100 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100 mb-4 transform transition-transform hover:scale-110">
                <FileText className="w-8 h-8 text-brand-500" />
              </div>
              <h3 className="font-semibold text-slate-800 text-lg">3. Review Grievance</h3>
              <p className="text-sm text-slate-500 mt-2">Receive a formal letter ready to sign</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';

export const HelpSection: React.FC = () => {
  return (
    <footer className="bg-slate-800 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div>
          <h3 className="text-white font-bold text-lg mb-4">Project-N</h3>
          <p className="text-sm leading-relaxed max-w-lg mx-auto">
            Empowering patients to fight unjust medical claim rejections with procedural intelligence and automated documentation.
          </p>
        </div>
      </div>
      <div className="border-t border-slate-700 mt-8 pt-8 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Project-N. All rights reserved.
      </div>
    </footer>
  );
};
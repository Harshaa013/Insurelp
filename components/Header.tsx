import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { AppStep } from '../types';

interface HeaderProps {
  onNavigateHome: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateHome, onGetStarted, onSignIn }) => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onNavigateHome}
        >
          <div className="bg-brand-50 p-1.5 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-heading font-bold text-slate-800 leading-tight">Insurelp</span>
            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Nation Rejection Helper</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-8">
          <div className="hidden md:flex space-x-6 text-sm font-medium text-slate-600">
            {/* ADAPTATION: Changed to Sign Out */}
            <button onClick={onSignIn} className="hover:text-brand-600 transition-colors">Sign Out</button>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 px-5 rounded-md shadow-sm transition-all transform hover:scale-105"
          >
            Get Started
          </button>
        </nav>
      </div>
    </header>
  );
};
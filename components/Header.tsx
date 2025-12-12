
import React from 'react';
import { AppMode } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: AppMode.HOME, label: 'Assistant', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { mode: AppMode.LIVE, label: 'Live', icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
    { mode: AppMode.VISION, label: 'Vision', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
    { mode: AppMode.GENERATE, label: 'Imagine', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-16">
          {/* Logo Area */}
          <div 
            className="flex items-center cursor-pointer group" 
            onClick={() => setMode(AppMode.HOME)}
          >
            <div className="relative">
                <div className="absolute inset-0 bg-brand-400 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative flex-shrink-0 flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-blue-600 text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
            </div>
            <span className="ml-3 text-lg font-bold text-slate-800 tracking-tight">
              Voya
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 bg-slate-100/50 p-1 rounded-full backdrop-blur-md border border-white/50">
            {navItems.map((item) => {
               const isActive = currentMode === item.mode;
               return (
                <button
                  key={item.mode}
                  onClick={() => setMode(item.mode)}
                  className={`flex items-center px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-white text-brand-600 shadow-[0_2px_10px_rgba(0,0,0,0.05)] ring-1 ring-black/5'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <svg className={`mr-2 h-4 w-4 transition-colors ${isActive ? 'text-brand-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              );
            })}
          </nav>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center bg-slate-100/80 p-1 rounded-xl">
             {navItems.map((item) => (
                <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`p-2 rounded-lg transition-all ${
                        currentMode === item.mode 
                        ? 'bg-white text-brand-600 shadow-sm' 
                        : 'text-slate-400'
                    }`}
                >
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                     </svg>
                </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

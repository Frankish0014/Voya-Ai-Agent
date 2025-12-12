import React, { useState } from 'react';
import Header from './components/Header';
import Home from './views/Home';
import LiveMode from './views/LiveMode';
import VisionMode from './views/VisionMode';
import GenMode from './views/GenMode';
import { AppMode } from './types';

function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  
  // In a real production app, you might want to force the user to set this if not in env.
  // For this demo, we assume it's available or injected via window.aistudio
  const apiKey = process.env.API_KEY || '';

  const renderContent = () => {
    switch (mode) {
      case AppMode.HOME:
        return <Home apiKey={apiKey} />;
      case AppMode.LIVE:
        return <LiveMode apiKey={apiKey} />;
      case AppMode.VISION:
        return <VisionMode apiKey={apiKey} />;
      case AppMode.GENERATE:
        return <GenMode apiKey={apiKey} />;
      default:
        return <Home apiKey={apiKey} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header currentMode={mode} setMode={setMode} />
      <main className="container mx-auto py-6">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

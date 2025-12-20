import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  // Enforce Dark Mode Permanently
  useEffect(() => {
    document.documentElement.classList.add('dark');
    // Optional: Clean up localStorage if it exists to avoid confusion
    localStorage.removeItem('theme');
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        return <Home />;
      case Tab.HISTORY:
        return <History />;
      case Tab.SETTINGS:
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans selection:bg-blue-500/30">
      <main className="relative z-10 min-h-screen">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
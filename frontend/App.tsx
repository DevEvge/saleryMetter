import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  // Initialize Theme Logic - Critical Fix
  useEffect(() => {
    // Check local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    // Force apply class
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <main className="relative z-10 min-h-screen">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
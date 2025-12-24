import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { Tab } from './types';

// Declare Telegram types globally to avoid TS errors
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme: 'light' | 'dark';
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            username?: string;
          };
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Initialize Telegram Web App
    const tg = window.Telegram?.WebApp;
    
    // Force Dark Mode Logic
    // We add the class manually to ensure it persists
    document.documentElement.classList.add('dark');

    if (tg) {
      tg.ready();
      tg.expand();

      // Configure Telegram Header to match our Dark Theme (Slate-900: #0f172a)
      try {
        tg.setHeaderColor('#0f172a'); 
        tg.setBackgroundColor('#0f172a');
      } catch (e) {
        console.log("Error setting TG colors", e);
      }

      // Safe User ID Retrieval
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserId(user.id);
        console.log("TG User connected:", user.first_name);
      }
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
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-blue-500/30">
      {/* Убрали pt-24 отсюда, чтобы страницы управляли своим отступом сами */}
      <main className="relative z-10 min-h-screen">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
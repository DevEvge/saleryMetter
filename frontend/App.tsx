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
        enableClosingConfirmation: () => void; // Добавили новую функцию
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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    document.documentElement.classList.add('dark');

    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation(); // <-- ВОТ ОНА, КОМАНДА ЗАПРЕТА СМАХИВАНИЯ

      try {
        tg.setHeaderColor('#0f172a'); 
        tg.setBackgroundColor('#0f172a');
      } catch (e) {
        console.log("Error setting TG colors", e);
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
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <main>
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
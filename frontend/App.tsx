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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // 1. Принудительно включаем темную тему для Tailwind
    document.documentElement.classList.add('dark');

    if (tg) {
      // 2. Сообщаем Telegram, что приложение готово
      tg.ready();
      tg.expand();
      // 3. Устанавливаем цвета интерфейса Telegram
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
    // Убрали все сложные стили отсюда. Теперь страницы сами управляют своими отступами.
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <main>
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
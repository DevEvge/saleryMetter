import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import History from './pages/History';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import { Tab } from './types';

// Розширюємо типи Telegram, щоб TypeScript не сварився
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        colorScheme: 'light' | 'dark';
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        contentSafeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
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
  // Стейт для збереження висоти відступу (якщо Telegram нам його дасть)
  const [safeAreaTop, setSafeAreaTop] = useState<number>(0);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    // Примусово вмикаємо темну тему для Tailwind
    document.documentElement.classList.add('dark');

    if (tg) {
      tg.ready();

      // --- ЛОГІКА ВІДСТУПІВ ---
      const updateSafeArea = () => {
        // Запитуємо у Телеграма: "Скільки місця займають твої кнопки?"
        if (tg.contentSafeAreaInset && tg.contentSafeAreaInset.top > 0) {
          setSafeAreaTop(tg.contentSafeAreaInset.top);
        } else {
          // Якщо Телеграм мовчить (0), скидаємо в 0 (тоді спрацює CSS env())
          setSafeAreaTop(0);
        }
      };

      // Запускаємо перевірку одразу
      updateSafeArea();

      // Підписуємось на зміни (наприклад, якщо користувач поверне екран або розгорне додаток)
      tg.onEvent('viewportChanged', updateSafeArea);

      // --- КОЛЬОРИ ---
      try {
        tg.setHeaderColor('#0f172a');
        tg.setBackgroundColor('#0f172a');
      } catch (e) { console.log(e); }

      // Розгортаємо на весь екран (тільки в проді)
      if (!import.meta.env.DEV) {
        tg.expand();
      }

      const user = tg.initDataUnsafe?.user;
      if (user) setUserId(user.id);

      // Прибирання підписки при закритті
      return () => {
        tg.offEvent('viewportChanged', updateSafeArea);
      };
    }
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME: return <Home />;
      case Tab.HISTORY: return <History />;
      case Tab.SETTINGS: return <Settings />;
      default: return <Home />;
    }
  };

  return (
    // ГОЛОВНИЙ ФІКС ТУТ:
    // style={{ paddingTop: ... }} має пріоритет.
    // Якщо JS отримав цифру > 0, ми ставимо її.
    // Якщо ні (0), ми використовуємо стандартний env(safe-area-inset-top).
    <div
      className="min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-white transition-colors font-sans pb-20"
      style={{
        paddingTop: safeAreaTop > 0 ? `${safeAreaTop}px` : 'env(safe-area-inset-top)'
      }}
    >
      <main className="relative z-10 min-h-screen">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
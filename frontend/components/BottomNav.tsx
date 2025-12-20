import React from 'react';
import { Home, History, Settings } from 'lucide-react';
import { Tab } from '../types';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: Tab.HOME, icon: Home, label: 'Головна' },
    { id: Tab.HISTORY, icon: History, label: 'Історія' },
    { id: Tab.SETTINGS, icon: Settings, label: 'Налаштування' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 z-50 pointer-events-none">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-3xl shadow-2xl flex justify-around items-center h-20 pointer-events-auto max-w-md mx-auto transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={isActive ? 28 : 24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] mt-1 font-medium ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
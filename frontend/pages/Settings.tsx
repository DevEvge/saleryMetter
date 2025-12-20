import React, { useEffect, useState } from 'react';
import { 
  Edit3, 
  X, 
  Save, 
  Coins, 
  Weight, 
  MapPin, 
  Moon, 
  Sun,
  Info
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { getSettings, saveSettings } from '../services/storageService';
import { AppSettings } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    pricePerPoint: 0,
    pricePerTon: 0,
    baseRate: 0,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>({ ...settings });
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load Settings
    setSettings(getSettings());

    // Sync state with actual DOM on mount
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const openModal = () => {
    setTempSettings({ ...settings });
    setIsModalOpen(true);
  };

  const handleTempChange = (field: keyof AppSettings, value: string) => {
    setTempSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    await new Promise(resolve => setTimeout(resolve, 500));
    saveSettings(tempSettings);
    setSettings(tempSettings);
    setIsModalOpen(false);
  };

  const inputClass = "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

  return (
    <div className="p-4 pt-8 pb-32 max-w-md mx-auto animate-fade-in relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">Налаштування</h1>
        <p className="text-gray-500 dark:text-gray-400 transition-colors">Профіль та параметри</p>
      </header>

      <div className="flex flex-col gap-6">
        
        {/* Theme Toggle */}
        <div 
          onClick={toggleTheme}
          className="bg-white dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-orange-100 text-orange-500'}`}>
                {isDark ? <Moon size={20} /> : <Sun size={20} />}
             </div>
             <div>
                <h3 className="text-gray-900 dark:text-white font-bold transition-colors">Тема оформлення</h3>
                <p className="text-xs text-gray-500 transition-colors">{isDark ? 'Темна' : 'Світла'}</p>
             </div>
          </div>
          <div className={`w-12 h-7 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}>
             <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Info Block (Read Only) */}
        <div>
           <div className="flex items-center gap-2 mb-3 px-1">
             <Info size={16} className="text-gray-400 dark:text-gray-500" />
             <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest transition-colors">Інформація про тарифи</h3>
           </div>
           
           <Card className="flex flex-col gap-0 p-0 overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 transition-colors">
                        <Coins size={20} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors">Ставка за виїзд</span>
                 </div>
                 <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{settings.baseRate} ₴</span>
              </div>

              <div className="p-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between transition-colors">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-colors">
                        <MapPin size={20} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors">Ціна за точку</span>
                 </div>
                 <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{settings.pricePerPoint} ₴</span>
              </div>

              <div className="p-5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors">
                        <Weight size={20} />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors">Ціна за тонну</span>
                 </div>
                 <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{settings.pricePerTon} ₴</span>
              </div>
           </Card>
        </div>

        <Button onClick={openModal} className="bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-700 mt-2 transition-colors">
            <Edit3 size={18} className="mr-2" />
            Змінити тарифи
        </Button>
      </div>

      {/* MODAL - Fixed Z-Index to 100 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="w-full max-w-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-2xl relative animate-slide-up transition-colors">
              
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Редагування тарифів</h2>
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                 >
                    <X size={20} />
                 </button>
              </div>

              <form onSubmit={saveChanges} className="flex flex-col gap-2">
                  <Input 
                     label="Ставка за виїзд (Маршрут)"
                     type="number"
                     inputMode="decimal"
                     value={tempSettings.baseRate || ''}
                     onChange={(e) => handleTempChange('baseRate', e.target.value)}
                     icon={<Coins size={20} className="text-blue-500 dark:text-blue-400"/>}
                     className={inputClass}
                     autoFocus
                  />
                  
                  <Input 
                     label="Ціна за точку"
                     type="number"
                     inputMode="decimal"
                     value={tempSettings.pricePerPoint || ''}
                     onChange={(e) => handleTempChange('pricePerPoint', e.target.value)}
                     icon={<MapPin size={20} className="text-purple-500 dark:text-purple-400"/>}
                     className={inputClass}
                  />

                  <Input 
                     label="Ціна за тонну"
                     type="number"
                     inputMode="decimal"
                     value={tempSettings.pricePerTon || ''}
                     onChange={(e) => handleTempChange('pricePerTon', e.target.value)}
                     icon={<Weight size={20} className="text-emerald-500 dark:text-green-400"/>}
                     className={`${inputClass} mb-8`}
                  />

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 dark:shadow-blue-900/50">
                     <Save size={20} className="mr-2" />
                     Зберегти зміни
                  </Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
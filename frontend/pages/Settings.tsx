import React, { useEffect, useState } from 'react';
import { 
  Edit3, 
  X, 
  Save, 
  Coins, 
  Weight, 
  MapPin, 
  Info,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { getSettings, saveSettings, clearRecords } from '../services/storageService';
import { AppSettings } from '../types';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    pricePerPoint: 0,
    pricePerTon: 0,
    baseRate: 0,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>({ ...settings });

  useEffect(() => {
    // Load Settings
    setSettings(getSettings());
  }, []);

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

  /**
   * Handler for wiping all application data.
   * Currently uses localStorage, but designed to be replaced with a DB call.
   */
  const handleWipeData = async () => {
    const isConfirmed = window.confirm(
      "Увага! Це незворотна дія.\n\nВи дійсно хочете видалити всю історію змін та скинути налаштування?"
    );

    if (isConfirmed) {
      // ---------------------------------------------------------
      // TODO: Replace the code below with your database API call in the future.
      // Example: await api.deleteAllUserData(userId);
      // ---------------------------------------------------------
      
      clearRecords(); // Clears localStorage
      window.location.reload(); // Reloads app to reset state
    }
  };

  return (
    <div className="p-4 pt-8 pb-32 max-w-md mx-auto animate-fade-in relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Налаштування</h1>
        <p className="text-gray-400">Профіль та параметри</p>
      </header>

      <div className="flex flex-col gap-6">
        
        {/* Info Block (Read Only) */}
        <div>
           <div className="flex items-center gap-2 mb-3 px-1">
             <Info size={16} className="text-gray-500" />
             <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest">Інформація про тарифи</h3>
           </div>
           
           <Card className="flex flex-col gap-0 p-0 overflow-hidden">
              <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Coins size={20} />
                    </div>
                    <span className="text-gray-300 font-medium">Ставка за виїзд</span>
                 </div>
                 <span className="text-xl font-bold text-white">{settings.baseRate} ₴</span>
              </div>

              <div className="p-5 border-b border-gray-700/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <MapPin size={20} />
                    </div>
                    <span className="text-gray-300 font-medium">Ціна за точку</span>
                 </div>
                 <span className="text-xl font-bold text-white">{settings.pricePerPoint} ₴</span>
              </div>

              <div className="p-5 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Weight size={20} />
                    </div>
                    <span className="text-gray-300 font-medium">Ціна за тонну</span>
                 </div>
                 <span className="text-xl font-bold text-white">{settings.pricePerTon} ₴</span>
              </div>
           </Card>
        </div>

        <Button onClick={openModal} className="bg-gray-800 border border-gray-600 text-white hover:bg-gray-700 mt-2">
            <Edit3 size={18} className="mr-2" />
            Змінити тарифи
        </Button>

        {/* Danger Zone / Testing Area */}
        <div className="mt-8 pt-8 border-t border-gray-800/50">
           <div className="flex items-center gap-2 mb-4 px-1 text-red-500/80">
             <AlertTriangle size={16} />
             <h3 className="text-xs font-bold uppercase tracking-widest">Тестова зона</h3>
           </div>
           <Button 
              onClick={handleWipeData} 
              variant="danger"
              className="h-12 text-base"
           >
              <Trash2 size={18} className="mr-2" />
              Стереть все данные
           </Button>
        </div>
      </div>

      {/* MODAL - Fixed Z-Index to 100 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 shadow-2xl relative animate-slide-up">
              
              <div className="flex items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-white">Редагування тарифів</h2>
                 <button 
                   onClick={() => setIsModalOpen(false)}
                   className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
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
                     icon={<Coins size={20} className="text-blue-400"/>}
                     autoFocus
                  />
                  
                  <Input 
                     label="Ціна за точку"
                     type="number"
                     inputMode="decimal"
                     value={tempSettings.pricePerPoint || ''}
                     onChange={(e) => handleTempChange('pricePerPoint', e.target.value)}
                     icon={<MapPin size={20} className="text-purple-400"/>}
                  />

                  <Input 
                     label="Ціна за тонну"
                     type="number"
                     inputMode="decimal"
                     value={tempSettings.pricePerTon || ''}
                     onChange={(e) => handleTempChange('pricePerTon', e.target.value)}
                     icon={<Weight size={20} className="text-green-400"/>}
                     className="mb-8"
                  />

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50">
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
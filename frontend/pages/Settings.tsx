import React, { useEffect, useState } from 'react';
import { 
  Edit3, 
  X, 
  Save, 
  Coins, 
  Weight, 
  MapPin, 
  Info,
  Loader,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { apiService } from '../services/api';
import { AppSettings } from '../types';

// Mapper from backend to frontend
const mapToFrontendSettings = (backendSettings: any): AppSettings => ({
  baseRate: backendSettings.departure_fee,
  pricePerPoint: backendSettings.cost_per_point,
  pricePerTon: backendSettings.price_per_tone,
});

// Mapper from frontend to backend
const mapToBackendSettings = (frontendSettings: AppSettings) => ({
  departure_fee: frontendSettings.baseRate,
  cost_per_point: frontendSettings.pricePerPoint,
  price_per_tone: frontendSettings.pricePerTon,
});

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<AppSettings>({
    pricePerPoint: 0,
    pricePerTon: 0,
    baseRate: 0,
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const backendSettings = await apiService.fetchSettings();
        const frontendSettings = mapToFrontendSettings(backendSettings);
        setSettings(frontendSettings);
        setTempSettings(frontendSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const openModal = () => {
    if (settings) {
      setTempSettings({ ...settings });
      setIsModalOpen(true);
    }
  };

  const handleTempChange = (field: keyof AppSettings, value: string) => {
    setTempSettings(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const saveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const backendData = mapToBackendSettings(tempSettings);
      await apiService.saveSettings(backendData);
      setSettings(tempSettings);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWipeData = async () => {
    const isConfirmed = window.confirm(
      "УВАГА! ЦЕ НЕЗВОРОТНА ДІЯ.\n\nВи дійсно хочете видалити ВСЮ історію змін та скинути ВСІ налаштування для вашого акаунту?"
    );

    if (isConfirmed) {
      setIsLoading(true);
      try {
        await apiService.wipeAllData();
        // Перезагружаем страницу, чтобы все обновилось с нуля
        window.location.reload();
      } catch (error) {
        console.error("Failed to wipe data:", error);
        alert("Не вдалося видалити дані. Спробуйте ще раз.");
        setIsLoading(false);
      }
    }
  };

  if (isLoading && !isModalOpen) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-4 pt-24 text-center">
        <h1 className="text-xl text-red-500">Не вдалося завантажити налаштування.</h1>
        <p className="text-gray-400">Спробуйте оновити сторінку.</p>
      </div>
    );
  }

  return (
    <div className="p-4 pt-24 pb-32 max-w-md mx-auto animate-fade-in relative">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Налаштування</h1>
        <p className="text-gray-400">Профіль та параметри</p>
      </header>

      <div className="flex flex-col gap-6">
        
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

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-gray-800/50">
           <div className="flex items-center gap-2 mb-4 px-1 text-red-500/80">
             <AlertTriangle size={16} />
             <h3 className="text-xs font-bold uppercase tracking-widest">Тестова зона</h3>
           </div>
           <Button 
              onClick={handleWipeData} 
              variant="danger"
              className="h-12 text-base"
              disabled={isLoading}
           >
              {isLoading ? <Loader className="animate-spin mr-2" /> : <Trash2 size={18} className="mr-2" />}
              Стереть все данные
           </Button>
        </div>
      </div>

      {/* MODAL */}
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

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/50" disabled={isLoading}>
                     {isLoading ? <Loader className="animate-spin mr-2" /> : <Save size={20} className="mr-2" />}
                     {isLoading ? 'Збереження...' : 'Зберегти зміни'}
                  </Button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
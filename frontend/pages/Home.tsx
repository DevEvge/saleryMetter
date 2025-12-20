import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Weight, 
  PlusCircle, 
  Coins,
  Map, 
  CircleDollarSign, 
  Save,
  Truck,
  Route,
  Briefcase,
  Loader
} from 'lucide-react';
import { Input, Button, Card } from '../components/ui';
import { ShiftType } from '../types';
import { apiService } from '../services/api';

const Home: React.FC = () => {
  const [activeType, setActiveType] = useState<ShiftType>('CITY_MAIN');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form States
  const [points, setPoints] = useState('');
  const [weight, setWeight] = useState('');
  const [extraPoints, setExtraPoints] = useState('');
  const [manualIncome, setManualIncome] = useState(''); // Used as Manual Base Rate for CITY_EXTRA
  const [distance, setDistance] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');

  useEffect(() => {
    // Initial data fetch can be added here if needed, for now, just stop loading.
    setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const dayData = {
      date,
      record_type: activeType,
      points: parseFloat(points) || 0,
      additional_points: parseFloat(extraPoints) || 0,
      weight: parseFloat(weight) || 0,
      manual_payment: parseFloat(manualIncome) || 0,
      distance_km: parseFloat(distance) || 0,
      price_per_km: parseFloat(pricePerKm) || 0,
    };

    try {
      await apiService.saveDay(dayData);
      // Reset form after successful save
      setPoints('');
      setWeight('');
      setExtraPoints('');
      setManualIncome('');
      setDistance('');
      setPricePerKm('');
    } catch (error) {
      console.error("Failed to save day:", error);
      // Handle error (e.g., show a notification)
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { id: ShiftType; label: string; icon: any }[] = [
    { id: 'CITY_MAIN', label: 'Маршрут', icon: Route },
    { id: 'CITY_EXTRA', label: 'Додатковий', icon: Briefcase },
    { id: 'INTERCITY', label: 'Міжмісто', icon: Truck },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  return (
    <div className="p-4 pt-6 pb-32 max-w-md mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Нова зміна</h1>
        <input 
          type="date" 
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm py-2 px-3 rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:border-blue-500 shadow-sm transition-colors"
        />
      </div>

      {/* Segmented Control */}
      <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl flex mb-8 border border-gray-200 dark:border-gray-700/50 relative overflow-hidden transition-colors">
         <div 
           className="absolute top-1 bottom-1 bg-white dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 rounded-xl transition-all duration-300 ease-out shadow-sm dark:shadow-lg dark:shadow-blue-900/50 border border-gray-100 dark:border-none"
           style={{
             left: `${(tabs.findIndex(t => t.id === activeType) * 100) / 3 + 1}%`,
             width: `${94 / 3}%`
           }}
         />
         
         {tabs.map((tab) => {
           const isActive = activeType === tab.id;
           const Icon = tab.icon;
           return (
             <button
               key={tab.id}
               onClick={() => setActiveType(tab.id)}
               className={`flex-1 relative z-10 py-3 rounded-xl text-xs font-bold transition-colors duration-200 flex flex-col items-center gap-1 ${
                 isActive 
                  ? 'text-blue-600 dark:text-white' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}
             >
               <Icon size={18} strokeWidth={2.5} />
               <span>{tab.label}</span>
             </button>
           );
         })}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Card className="min-h-[280px]">
          {/* CITY MAIN & EXTRA share common inputs */}
          {(activeType === 'CITY_MAIN' || activeType === 'CITY_EXTRA') && (
            <div className="animate-fade-in space-y-4">
               {activeType === 'CITY_EXTRA' && (
                  <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/30">
                     <p className="text-xs text-blue-600 dark:text-blue-300 font-bold uppercase tracking-wider mb-3">Оплата за виїзд</p>
                     <Input
                        label="Сума (грн)"
                        type="number"
                        inputMode="decimal"
                        placeholder="0 ₴"
                        value={manualIncome}
                        onChange={(e) => setManualIncome(e.target.value)}
                        icon={<Coins size={20} className="text-blue-500" />}
                        className="mb-0"
                        autoFocus
                        required
                      />
                  </div>
               )}

              <Input
                label="Кількість точок"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                icon={<MapPin size={20} />}
                required
              />
              <Input
                label="Вага (тони)"
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                icon={<Weight size={20} />}
                required
              />
              <Input
                label="Додаткові точки"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={extraPoints}
                onChange={(e) => setExtraPoints(e.target.value)}
                icon={<PlusCircle size={20} />}
              />
            </div>
          )}

          {/* INTERCITY */}
          {activeType === 'INTERCITY' && (
            <div className="animate-fade-in space-y-4">
              <Input
                label="Відстань (км)"
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                icon={<Map size={20} />}
                required
              />
              <Input
                label="Ціна за км (грн)"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={pricePerKm}
                onChange={(e) => setPricePerKm(e.target.value)}
                icon={<CircleDollarSign size={20} />}
                required
              />
            </div>
          )}
        </Card>

        <div className="mt-4">
          <Button 
            type="submit" 
            disabled={isSaving} 
            className="h-16 text-xl bg-blue-600 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-600 hover:bg-blue-500 dark:hover:from-emerald-400 dark:hover:to-teal-500 shadow-blue-500/30 dark:shadow-emerald-900/40"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader className="animate-spin mr-2" />
                Збереження...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={24} />
                Зберегти
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Home;
import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Truck, 
  MapPin, 
  Briefcase,
  Calendar,
  Weight,
  Map,
  Loader2,
  PlusCircle,
  Coins,
  Route
} from 'lucide-react';
import * as apiService from '../services/api';

const History: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    total_salary: 0, 
    total_km: 0,
    total_points: 0,
    total_weight: 0,
    total_days: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
      const data = await apiService.fetchDays(year, month);
      setHistory(data.history || []);
      setStats({
        total_salary: data.total_salary || 0,
        total_km: data.total_km || 0,
        total_points: data.total_points || 0,
        total_weight: data.total_weight || 0,
        total_days: data.total_days || 0,
      });
    } catch (e) {
      console.error("Error fetching stats:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Ви дійсно хочете видалити цей запис?")) {
        await apiService.deleteDay(id);
        fetchData();
    }
  };

  const formatMonth = (date: Date) => {
    const str = date.toLocaleString('uk-UA', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getDayInfo = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
        day: date.getUTCDate(),
        weekday: date.toLocaleString('uk-UA', { weekday: 'short', timeZone: 'UTC' })
    };
  };

  const getRecordMeta = (record: any) => {
    switch(record.record_type) {
        case 'INTERCITY': 
            return { icon: Truck, label: 'Міжмісто', color: 'text-purple-600 dark:text-purple-400' };
        case 'CITY_EXTRA': 
            return { icon: Briefcase, label: 'Додатковий', color: 'text-emerald-600 dark:text-emerald-400' };
        default: // CITY_MAIN
            return { icon: Route, label: 'Маршрут', color: 'text-blue-600 dark:text-blue-400' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center h-screen">
        <Loader2 size={48} className="animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="p-4 pt-0 pb-32 max-w-md mx-auto h-full flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800/80 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm transition-colors mt-2">
        <button 
            onClick={() => handleMonthChange(-1)}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
            <ChevronLeft size={24} />
        </button>
        
        <div className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
            <Calendar size={18} className="text-blue-600 dark:text-blue-500 mb-0.5" />
            <span>{formatMonth(currentDate)}</span>
        </div>

        <button 
            onClick={() => handleMonthChange(1)}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
        >
            <ChevronRight size={24} />
        </button>
      </div>

      <>
          <div className="mb-8 rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl shadow-blue-500/30 dark:shadow-blue-900/30 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Всього за місяць</p>
            <div className="flex items-baseline gap-1 mb-6 min-h-[40px]">
                <span className="text-4xl font-bold tracking-tight">
                    {stats.total_salary.toLocaleString('uk-UA')}
                </span>
                <span className="text-xl font-medium text-blue-200">₴</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Route size={16} className="text-blue-100" /></div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Зміни</p>
                        <p className="font-bold text-sm">{stats.total_days}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Map size={16} className="text-blue-100" /></div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Пробіг</p>
                        <p className="font-bold text-sm">{stats.total_km} км</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><MapPin size={16} className="text-blue-100" /></div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Точки</p>
                        <p className="font-bold text-sm">{stats.total_points}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center"><Weight size={16} className="text-blue-100" /></div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Вага</p>
                        <p className="font-bold text-sm">{stats.total_weight.toFixed(1)} т</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest">Деталізація</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700">
                {history.length} змін
              </span>
          </div>

          <div className="flex flex-col gap-3 min-h-[200px]">
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white dark:bg-gray-800/30 rounded-3xl border-dashed border-gray-200 dark:border-gray-800">
                    <Briefcase size={32} className="mb-2 opacity-20" />
                    <p>Немає записів</p>
                </div>
            ) : (
                history.map((record) => {
                    const dayInfo = getDayInfo(record.date);
                    const meta = getRecordMeta(record);
                    const Icon = meta.icon;

                    return (
                        <div key={record.id} className="bg-white dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200 dark:border-gray-700/50 rounded-2xl p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600/30 shrink-0">
                                        <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{dayInfo.day}</span>
                                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mt-0.5">{dayInfo.weekday}</span>
                                    </div>
                                    <div>
                                        <div className={`flex items-center gap-2 font-bold text-sm ${meta.color}`}>
                                            <Icon size={16} />
                                            <span>{meta.label}</span>
                                        </div>
                                        <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{record.total_salary} <span className="text-lg font-normal text-gray-400">₴</span></span>
                                    </div>
                                </div>
                                <button onClick={(e) => handleDelete(record.id, e)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700/50 pt-3 text-xs">
                                {record.record_type !== 'INTERCITY' && (
                                  <>
                                    <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg justify-center">
                                      <MapPin size={14} className="text-gray-500 dark:text-gray-400"/> <span className="font-bold text-gray-800 dark:text-white">{record.points || 0}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg justify-center">
                                      <PlusCircle size={14} className="text-gray-500 dark:text-gray-400"/> <span className="font-bold text-gray-800 dark:text-white">{record.additional_points || 0}</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg justify-center">
                                      <Weight size={14} className="text-gray-500 dark:text-gray-400"/> <span className="font-bold text-gray-800 dark:text-white">{record.weight || 0} т</span>
                                    </div>
                                  </>
                                )}
                                {record.record_type === 'INTERCITY' && (
                                  <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900/50 p-2 rounded-lg justify-center">
                                    <Map size={14} className="text-gray-500 dark:text-gray-400"/> <span className="font-bold text-gray-800 dark:text-white">{record.distance_km || 0} км</span>
                                  </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </>
    </div>
  );
};

export default History;
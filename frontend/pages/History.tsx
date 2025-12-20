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
  Loader2
} from 'lucide-react';
import { ShiftRecord } from '../types';
import { getRecords, deleteRecord } from '../services/storageService';

const History: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [history, setHistory] = useState<ShiftRecord[]>([]);
  const [stats, setStats] = useState({ income: 0, km: 0, weight: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    try {
        // Simulate a tiny delay for smoother transition
        await new Promise(r => setTimeout(r, 400)); 

        const allRecords = getRecords();
        const filtered = allRecords.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });
        
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const aggregations = filtered.reduce((acc, curr) => {
            return {
                income: acc.income + curr.totalIncome,
                km: acc.km + (curr.distance || 0),
                weight: acc.weight + (curr.weight || 0)
            };
        }, { income: 0, km: 0, weight: 0 });

        setHistory(filtered);
        setStats(aggregations);
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

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Ви дійсно хочете видалити цей запис?")) {
        deleteRecord(id);
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
        day: date.getDate(),
        weekday: date.toLocaleString('uk-UA', { weekday: 'short' })
    };
  };

  const getRecordMeta = (record: ShiftRecord) => {
    switch(record.type) {
        case 'INTERCITY': 
            return { 
                icon: Truck, 
                label: 'Міжмісто', 
                color: 'text-purple-600 dark:text-purple-400', 
                bg: 'bg-purple-100 dark:bg-purple-500/10',
                detail: `${record.distance} км`
            };
        case 'CITY_EXTRA': 
            return { 
                icon: Briefcase, 
                label: 'Додатковий', 
                color: 'text-emerald-600 dark:text-emerald-400', 
                bg: 'bg-emerald-100 dark:bg-emerald-500/10',
                detail: 'Змішаний'
            };
        default: // CITY_MAIN
            return { 
                icon: MapPin, 
                label: 'Маршрут', 
                color: 'text-blue-600 dark:text-blue-400', 
                bg: 'bg-blue-100 dark:bg-blue-500/10',
                detail: `${record.points} тчк`
            };
    }
  };

  return (
    <div className="p-4 pt-6 pb-32 max-w-md mx-auto h-full flex flex-col animate-fade-in">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6 bg-white dark:bg-gray-800/80 backdrop-blur-md p-2 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm transition-colors">
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

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center h-64">
           <Loader2 size={48} className="animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="mb-8 rounded-3xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl shadow-blue-500/30 dark:shadow-blue-900/30 text-white relative overflow-hidden transition-all duration-300 animate-slide-up">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none" />
            
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Всього за місяць</p>
            <div className="flex items-baseline gap-1 mb-6 min-h-[40px]">
                <span className="text-4xl font-bold tracking-tight">
                    {stats.income.toLocaleString('uk-UA')}
                </span>
                <span className="text-xl font-medium text-blue-200">₴</span>
            </div>

            <div className="flex gap-4 border-t border-white/10 pt-4">
                <div className="flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Map size={16} className="text-blue-100" />
                    </div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Пробіг</p>
                        <p className="font-bold text-sm">{stats.km} км</p>
                    </div>
                </div>
                <div className="w-px bg-white/10 h-8 self-center" />
                <div className="flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <Weight size={16} className="text-blue-100" />
                    </div>
                    <div>
                        <p className="text-[10px] text-blue-100 uppercase font-bold">Вага</p>
                        <p className="font-bold text-sm">{stats.weight.toFixed(1)} т</p>
                    </div>
                </div>
            </div>
          </div>

          {/* List Header */}
          <div className="flex items-center justify-between mb-3 px-1 animate-fade-in">
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest transition-colors">Деталізація</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 transition-colors">
                {history.length} змін
              </span>
          </div>

          {/* History List */}
          <div className="flex flex-col gap-3 min-h-[200px]">
            {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 bg-white dark:bg-gray-800/30 rounded-3xl border border-gray-200 dark:border-gray-800 border-dashed transition-colors animate-fade-in">
                    <Briefcase size={32} className="mb-2 opacity-20" />
                    <p>Немає записів</p>
                </div>
            ) : (
                history.map((record) => {
                    const dayInfo = getDayInfo(record.date);
                    const meta = getRecordMeta(record);
                    const Icon = meta.icon;

                    return (
                        <div 
                            key={record.id} 
                            className="relative overflow-hidden bg-white dark:bg-gray-800/60 backdrop-blur-sm border border-gray-100 dark:border-gray-700/50 rounded-2xl p-3 pr-4 flex items-center gap-4 transition-all active:scale-[0.99] animate-slide-up"
                        >
                            {/* Left: Date Box */}
                            <div className="flex flex-col items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600/30 shrink-0 transition-colors">
                                <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">{dayInfo.day}</span>
                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase mt-0.5">{dayInfo.weekday}</span>
                            </div>

                            {/* Center: Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon size={14} className={meta.color} />
                                    <span className={`text-sm font-bold truncate ${meta.color}`}>
                                        {meta.label}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-500 truncate transition-colors">
                                    {meta.detail}
                                </p>
                            </div>

                            {/* Right: Price & Action */}
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight transition-colors">
                                    {record.totalIncome} <span className="text-sm font-normal text-gray-400">₴</span>
                                </span>
                                <button 
                                    onClick={(e) => handleDelete(record.id, e)}
                                    className="p-1.5 -mr-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default History;
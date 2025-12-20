import { ShiftRecord, AppSettings } from '../types';

const STORAGE_KEY = 'driver_pay_records_v1';
const SETTINGS_KEY = 'driver_pay_settings_v1';

export const saveRecord = (record: ShiftRecord): ShiftRecord[] => {
  const existing = getRecords();
  const updated = [record, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const getRecords = (): ShiftRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const clearRecords = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};

export const deleteRecord = (id: string): ShiftRecord[] => {
  const existing = getRecords();
  const updated = existing.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  // Default values if nothing exists
  return data ? JSON.parse(data) : { pricePerPoint: 0, pricePerTon: 0, baseRate: 0 };
};
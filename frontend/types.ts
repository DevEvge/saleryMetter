export type ShiftType = 'CITY_MAIN' | 'CITY_EXTRA' | 'INTERCITY';

export interface ShiftRecord {
  id: string;
  date: string;
  type: ShiftType;

  // Specific fields based on type
  points?: number;       // City
  weight?: number;       // City (Tons)
  extraPoints?: number;  // City
  
  manualIncome?: number; // City Extra
  
  distance?: number;     // Intercity (km)
  pricePerKm?: number;   // Intercity (UAH/km)

  // Financials
  totalIncome: number;   // Calculated or manual
  fuel?: number;         // Optional fuel tracking if needed later
}

export interface AppSettings {
  pricePerPoint: number;
  pricePerTon: number;
  baseRate: number; // Base rate for trip/call-out
}

export enum Tab {
  HOME = 'home',
  HISTORY = 'history',
  SETTINGS = 'settings',
}

export interface Stats {
  totalNet: number;
  recordCount: number;
}
import { GoogleGenAI } from "@google/genai";
import { ShiftRecord } from "../types";

// Initialize Gemini
// Note: In a real production app, ensure this key is proxy-served or restricted.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeEarnings = async (records: ShiftRecord[]): Promise<string> => {
  if (records.length === 0) {
    return "Недостатньо даних для аналізу. Додайте декілька змін.";
  }

  // Prepare a lightweight summary to save tokens
  const summaryData = records.slice(0, 20).map(r => ({
    type: r.type,
    income: r.totalIncome,
    details: r.type === 'INTERCITY' 
      ? `Distance: ${r.distance}km` 
      : `Points: ${r.points}, Weight: ${r.weight}t`,
    date: r.date
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        You are a financial assistant for a logistics driver in Ukraine. Currency is UAH (₴).
        The driver has shifts of types: City (Main), City (Extra), and Intercity.
        
        Analyze the following recent shift data JSON:
        ${JSON.stringify(summaryData)}

        Provide a short, encouraging summary (max 3 sentences) in Ukrainian.
        Identify if they earn more on Intercity or City routes.
        Do not use markdown formatting like bolding, just plain text.
      `,
    });

    return response.text || "Не вдалося отримати аналіз.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Помилка з'єднання з AI асистентом.";
  }
};

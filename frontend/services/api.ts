const BASE_URL = '';

function getTelegramId() {
  // @ts-ignore
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    // @ts-ignore
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  }
  // Возвращаем тестовый ID, если мы не в окружении Telegram
  return 1; 
}

async function fetchSettings() {
  const response = await fetch(`${BASE_URL}/api/settings`, {
    headers: {
      'X-Telegram-ID': getTelegramId().toString(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch settings');
  }
  return response.json();
}

async function saveSettings(settings: { cost_per_point: number; departure_fee: number; price_per_tone: number }) {
  const response = await fetch(`${BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-ID': getTelegramId().toString(),
    },
    body: JSON.stringify(settings),
  });
  if (!response.ok) {
    throw new Error('Failed to save settings');
  }
  return response.json();
}

async function fetchDays(year: number, month: number) {
  const response = await fetch(`${BASE_URL}/api/stats/${year}/${month}`, {
    headers: {
      'X-Telegram-ID': getTelegramId().toString(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch work days');
  }
  return response.json();
}

async function saveDay(day: any) {
  const response = await fetch(`${BASE_URL}/api/days`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-ID': getTelegramId().toString(),
    },
    body: JSON.stringify(day),
  });
  if (!response.ok) {
    throw new Error('Failed to save work day');
  }
  return response.json();
}

async function deleteDay(dayId: number) {
  const response = await fetch(`${BASE_URL}/api/days/${dayId}`, {
    method: 'DELETE',
    headers: {
      'X-Telegram-ID': getTelegramId().toString(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to delete work day');
  }
  return response.json();
}

async function wipeAllData() {
  const response = await fetch(`${BASE_URL}/api/wipe`, {
    method: 'DELETE',
    headers: {
      'X-Telegram-ID': getTelegramId().toString(),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to wipe data');
  }
  return response.json();
}

export const apiService = {
  fetchSettings,
  saveSettings,
  fetchDays,
  saveDay,
  deleteDay,
  wipeAllData,
};
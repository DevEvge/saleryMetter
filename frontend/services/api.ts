const BASE_URL = 'https://retbert.pythonanywhere.com';

/**
 * Получает ID пользователя Telegram.
 * Вне Telegram возвращает тестовый ID '1' для разработки.
 */
function getTelegramId() {
  // @ts-ignore
  if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    // @ts-ignore
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  }
  return 1;
}

/**
 * Общая функция для выполнения fetch-запросов с добавлением заголовка Telegram ID.
 */
async function apiFetch(url: string, options: RequestInit = {}) {
  const headers = {
    ...options.headers,
    'X-Telegram-ID': getTelegramId().toString(),
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${BASE_URL}${url}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(errorData.detail || 'Failed to fetch');
  }
  return response.json();
}

// --- Функции для работы с API ---

let settingsPromise: Promise<any> | null = null;

export const fetchSettings = () => {
  // Якщо запит вже летить — повертаємо його ж, а не створюємо новий
  if (settingsPromise) return settingsPromise;

  settingsPromise = apiFetch('/api/settings')
    .finally(() => {
      // Через 5 секунд скидаємо кеш, щоб можна було оновити дані пізніше
      setTimeout(() => { settingsPromise = null; }, 5000);
    });

  return settingsPromise;
};

export const saveSettings = (settings: { cost_per_point: number; departure_fee: number; price_per_tone: number }) => {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
};

export const fetchDays = (year: number, month: number) => {
  return apiFetch(`/api/stats/${year}/${month}`);
};

export const saveDay = (day: any) => {
  return apiFetch('/api/days', {
    method: 'POST',
    body: JSON.stringify(day),
  });
};

export const deleteDay = (dayId: number) => {
  return apiFetch(`/api/days/${dayId}`, {
    method: 'DELETE',
  });
};

export const wipeAllData = () => {
  return apiFetch('/api/wipe', {
    method: 'DELETE',
  });
};

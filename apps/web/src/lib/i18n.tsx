'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Locale = 'ru' | 'az' | 'en';

const messages: Record<Locale, Record<string, string>> = {
  ru: {
    dashboard: 'Дашборд',
    clients: 'Клиенты',
    orders: 'Заказы',
    appointments: 'Записи',
    inventory: 'Склад',
    cash: 'Касса',
    analytics: 'Аналитика',
    settings: 'Настройки',
    logout: 'Выйти',
    save: 'Сохранить',
    cancel: 'Отмена',
    loading: 'Загрузка...',
  },
  az: {
    dashboard: 'Panel',
    clients: 'Müştərilər',
    orders: 'Sifarişlər',
    appointments: 'Qeydiyyat',
    inventory: 'Anbar',
    cash: 'Kassa',
    analytics: 'Analitika',
    settings: 'Parametrlər',
    logout: 'Çıxış',
    save: 'Saxla',
    cancel: 'Ləğv',
    loading: 'Yüklənir...',
  },
  en: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    orders: 'Orders',
    appointments: 'Appointments',
    inventory: 'Inventory',
    cash: 'Cash register',
    analytics: 'Analytics',
    settings: 'Settings',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading...',
  },
};

const LocaleCtx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (k: string) => string } | null>(
  null,
);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ru');
  useEffect(() => {
    const s = localStorage.getItem('locale') as Locale | null;
    if (s && messages[s]) setLocaleState(s);
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('locale', l);
  };
  const t = (k: string) => messages[locale][k] ?? k;
  return <LocaleCtx.Provider value={{ locale, setLocale, t }}>{children}</LocaleCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleCtx);
  if (!ctx) throw new Error('useI18n outside provider');
  return ctx;
}

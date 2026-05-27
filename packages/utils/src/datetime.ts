import { formatInTimeZone } from 'date-fns-tz';

export const BAKU_TZ = 'Asia/Baku';

export const formatBaku = (date: Date | string | number, pattern = 'yyyy-MM-dd HH:mm'): string =>
  formatInTimeZone(date, BAKU_TZ, pattern);

export const startOfDayUTC = (d: Date = new Date()): Date => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

export const endOfDayUTC = (d: Date = new Date()): Date => {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
};

const AZ_E164 = /^\+994\d{9}$/;

export const isValidAzPhone = (raw: string): boolean => AZ_E164.test(raw);

export const normalizeAzPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('994') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+994${digits.slice(1)}`;
  if (digits.length === 9) return `+994${digits}`;
  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
};

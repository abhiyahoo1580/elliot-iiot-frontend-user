/**
 * Converts any date input to ISO string
 */
export const toISOString = (date: Date): string => {
  return date.toISOString();
};


export function formatDate(date: string | number | Date, locale: string = 'en-US') {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  // Format as "DD MMM YYYY" (e.g. "13 oct 2025"). Use locale for month short name,
  // but compose manually to ensure consistent order.
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = d.toLocaleString(locale, { month: 'short' });
  const year = d.getFullYear();
  // Use capitalized short month (e.g. 'Oct')
  const monthCapitalized = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
  return `${day} ${monthCapitalized} ${year}`;
}

// Export-friendly date: 'DD MMM YYYY' with capitalized month (e.g. '13 Oct 2025')
export function formatDateExport(date: string | number | Date, locale: string = 'en-US') {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthShort = d.toLocaleString(locale, { month: 'short' });
  const year = d.getFullYear();
  const monthCapitalized = monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
  return `${day} ${monthCapitalized} ${year}`;
}
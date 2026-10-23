/**
 * Deterministic date and time formatting utilities.
 * Avoids React hydration mismatch errors caused by differing Intl/ICU locale formatting
 * between server-side Node.js (e.g., lowercase 'pm') and client browsers (e.g., uppercase 'PM').
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const month = MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${minutes} ${ampm}`;
}

export function formatDateTime(dateInput: string | number | Date | null | undefined): string {
  if (!dateInput) return '';
  const dateStr = formatDate(dateInput);
  const timeStr = formatTime(dateInput);
  if (!dateStr) return '';
  return timeStr ? `${dateStr}, ${timeStr}` : dateStr;
}

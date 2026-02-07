// 表示用フォーマット（yyyy/mm/dd）
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}

// input[type="date"]用のフォーマット（yyyy-mm-dd）
export function formatDateInput(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 短い表示用フォーマット（m/d）
export function formatDateShort(date: Date | string | null): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateWithDay(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return `${date.getDate()}(${days[date.getDay()]})`;
}

export function formatMonthYear(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getWeekNumber(date: Date): number {
  // ISO 8601週番号を計算
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // 木曜日に設定（ISO週は木曜日がある週で決まる）
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // 年の最初の日
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // 週番号を計算
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.toDateString() === d2.toDateString();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysArray(startDate: Date, count: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < count; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

export function daysBetween(d1: Date, d2: Date): number {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((date2.getTime() - date1.getTime()) / (24 * 60 * 60 * 1000));
}

export function isFirstOfMonth(date: Date): boolean {
  return date.getDate() === 1;
}

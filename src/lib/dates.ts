export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatMY(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function parseInputDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  return value;
}

export function mondayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}

export function isOverdue(dueDate: string, completed: boolean): boolean {
  return !completed && dueDate < todayISO();
}

export function isWithinDays(iso: string, days: number): boolean {
  const end = addDays(todayISO(), days);
  return iso >= todayISO() && iso <= end;
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKey(todayISO());
}

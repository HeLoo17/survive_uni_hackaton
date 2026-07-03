import type { AppData } from "../types";
import { isOverdue, todayISO, isWithinDays } from "./dates";

export function computeBadges(data: AppData) {
  const overdue = data.assignments.filter((a) => isOverdue(a.dueDate, a.completed)).length;
  const todosDueToday = data.todos.filter((t) => !t.completed && t.dueDate === todayISO()).length;
  const subsSoon = data.subscriptions.filter(
    (s) => s.active && isWithinDays(s.nextPaymentDate, 14)
  ).length;
  return { overdue, todosDueToday, subsSoon, total: overdue + todosDueToday + subsSoon };
}

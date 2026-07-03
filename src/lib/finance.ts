import type { FinanceRecord } from "../types";
import { currentMonthKey } from "./dates";

export function monthSummary(records: FinanceRecord[]) {
  const key = currentMonthKey();
  const month = records.filter((r) => r.date.startsWith(key));
  const income = month.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expenses = month.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  return { income, expenses, net: income - expenses };
}

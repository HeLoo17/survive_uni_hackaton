import type { BillingCycle } from "../types";
import { addDays } from "./dates";

export function advancePaymentDate(date: string, cycle: BillingCycle): string {
  if (cycle === "weekly") return addDays(date, 7);
  if (cycle === "monthly") {
    const d = new Date(date + "T12:00:00");
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }
  const d = new Date(date + "T12:00:00");
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function monthlyCost(amount: number, cycle: BillingCycle): number {
  if (cycle === "weekly") return amount * 4.33;
  if (cycle === "yearly") return amount / 12;
  return amount;
}

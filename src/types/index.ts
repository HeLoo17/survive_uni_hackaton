export type Priority = "low" | "medium" | "high";
export type BillingCycle = "weekly" | "monthly" | "yearly";
export type FinanceType = "income" | "expense";
export type EventType = "exam" | "other";

export interface Course { id: string; name: string; code?: string; }
export interface Assignment {
  id: string; title: string; courseId: string; dueDate: string;
  priority: Priority; completed: boolean; notes?: string; linkedTodoId?: string;
}
export interface ClassEntry {
  id: string; courseId: string; dayOfWeek: number;
  startTime: string; endTime: string; location: string;
}
export interface ScheduleEvent {
  id: string; title: string; courseId?: string; date: string;
  startTime?: string; endTime?: string; type: EventType;
}
export interface Todo {
  id: string; title: string; completed: boolean; dueDate?: string;
  createdAt: string; linkedAssignmentId?: string;
}
export interface Subscription {
  id: string; name: string; amount: number; billingCycle: BillingCycle;
  nextPaymentDate: string; active: boolean;
}
export interface FinanceRecord {
  id: string; type: FinanceType; category: string; amount: number;
  description: string; date: string;
}
export interface Settings { monthlyBudget: number; currency: "MYR"; demoLoaded: boolean; }
export interface AppData {
  courses: Course[]; assignments: Assignment[]; classes: ClassEntry[];
  events: ScheduleEvent[]; todos: Todo[]; subscriptions: Subscription[];
  finance: FinanceRecord[]; settings: Settings;
}
export const FINANCE_CATEGORIES = ["Food","Transport","Rent","Entertainment","Salary","Other"] as const;
export const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] as const;

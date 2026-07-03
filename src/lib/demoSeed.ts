import type { AppData } from "../types";
import { addDays, todayISO } from "./dates";
import { generateId } from "./storage";

export function createDemoData(): AppData {
  const c1 = generateId(), c2 = generateId(), c3 = generateId(), c4 = generateId();
  const t1 = generateId();
  const a1 = generateId();
  const today = todayISO();
  return {
    courses: [
      { id: c1, name: "Intro to Programming", code: "CSC101" },
      { id: c2, name: "Calculus II", code: "MAT201" },
      { id: c3, name: "Academic Writing", code: "ENG102" },
      { id: c4, name: "Business Fundamentals", code: "BUS110" },
    ],
    assignments: [
      { id: generateId(), title: "Lab Report 3", courseId: c1, dueDate: addDays(today, 2), priority: "high", completed: false },
      { id: generateId(), title: "Problem Set 5", courseId: c2, dueDate: addDays(today, 5), priority: "medium", completed: false },
      { id: generateId(), title: "Essay Draft", courseId: c3, dueDate: addDays(today, 10), priority: "low", completed: false },
      { id: a1, title: "Group Presentation", courseId: c4, dueDate: addDays(today, -2), priority: "high", completed: false, linkedTodoId: t1 },
    ],
    classes: [
      { id: generateId(), courseId: c1, dayOfWeek: 0, startTime: "09:00", endTime: "11:00", location: "Block A-201" },
      { id: generateId(), courseId: c2, dayOfWeek: 1, startTime: "14:00", endTime: "16:00", location: "Block B-105" },
      { id: generateId(), courseId: c3, dayOfWeek: 2, startTime: "10:00", endTime: "12:00", location: "Block C-302" },
      { id: generateId(), courseId: c4, dayOfWeek: 4, startTime: "08:00", endTime: "10:00", location: "Block D-101" },
    ],
    events: [
      { id: generateId(), title: "Midterm Exam", courseId: c2, date: addDays(today, 7), startTime: "09:00", endTime: "11:00", type: "exam" },
    ],
    todos: [
      { id: t1, title: "Prepare group slides", completed: false, dueDate: addDays(today, 1), createdAt: today, linkedAssignmentId: a1 },
      { id: generateId(), title: "Buy groceries", completed: false, createdAt: today },
      { id: generateId(), title: "Print lecture notes", completed: false, dueDate: today, createdAt: today },
      { id: generateId(), title: "Email lecturer", completed: true, createdAt: addDays(today, -1) },
    ],
    subscriptions: [
      { id: generateId(), name: "Spotify Student", amount: 8.9, billingCycle: "monthly", nextPaymentDate: addDays(today, 3), active: true },
      { id: generateId(), name: "Campus Gym", amount: 50, billingCycle: "monthly", nextPaymentDate: addDays(today, 20), active: true },
    ],
    finance: [
      { id: generateId(), type: "expense", category: "Food", amount: 12.5, description: "Nasi lemak", date: addDays(today, -1) },
      { id: generateId(), type: "expense", category: "Transport", amount: 5, description: "Grab to campus", date: addDays(today, -2) },
      { id: generateId(), type: "expense", category: "Food", amount: 18, description: "Cafeteria lunch", date: today },
      { id: generateId(), type: "expense", category: "Rent", amount: 350, description: "Hostel fee", date: addDays(today, -5) },
      { id: generateId(), type: "expense", category: "Entertainment", amount: 25, description: "Movie night", date: addDays(today, -3) },
      { id: generateId(), type: "income", category: "Salary", amount: 200, description: "Part-time job", date: addDays(today, -7) },
      { id: generateId(), type: "expense", category: "Food", amount: 8, description: "Coffee", date: addDays(today, -4) },
      { id: generateId(), type: "expense", category: "Transport", amount: 15, description: "Bus pass top-up", date: addDays(today, -6) },
      { id: generateId(), type: "expense", category: "Other", amount: 30, description: "Textbook", date: addDays(today, -8) },
      { id: generateId(), type: "income", category: "Other", amount: 50, description: "Sold old notes", date: addDays(today, -10) },
    ],
    settings: { monthlyBudget: 800, currency: "MYR", demoLoaded: true },
  };
}

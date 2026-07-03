import type { AppData, Settings } from "../types";

const PREFIX = "survive_uni:";

export function generateId(): string {
  return crypto.randomUUID();
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const defaultSettings = (): Settings => ({
  monthlyBudget: 800,
  currency: "MYR",
  demoLoaded: false,
});

export function loadAll(): AppData {
  return {
    courses: load("courses", []),
    assignments: load("assignments", []),
    classes: load("classes", []),
    events: load("events", []),
    todos: load("todos", []),
    subscriptions: load("subscriptions", []),
    finance: load("finance", []),
    settings: load("settings", defaultSettings()),
  };
}

export function saveAll(data: AppData): void {
  save("courses", data.courses);
  save("assignments", data.assignments);
  save("classes", data.classes);
  save("events", data.events);
  save("todos", data.todos);
  save("subscriptions", data.subscriptions);
  save("finance", data.finance);
  save("settings", data.settings);
}

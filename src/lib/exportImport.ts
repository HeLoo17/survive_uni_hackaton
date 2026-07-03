import type { AppData } from "../types";

export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function importData(raw: string): AppData {
  const parsed = JSON.parse(raw) as AppData;
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
  const keys = ["courses","assignments","classes","events","todos","subscriptions","finance","settings"] as const;
  for (const k of keys) {
    if (!Array.isArray(parsed[k]) && k !== "settings") throw new Error(`Missing ${k}`);
  }
  if (!parsed.settings || parsed.settings.currency !== "MYR") throw new Error("Invalid settings");
  return parsed;
}

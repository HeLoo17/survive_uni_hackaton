import { useCallback, useEffect, useState } from "react";
import type { AppData } from "../types";
import { createDemoData } from "../lib/demoSeed";
import { loadAll, saveAll } from "../lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadAll();
    if (!loaded.settings.demoLoaded && loaded.courses.length === 0) {
      const demo = createDemoData();
      saveAll(demo);
      return demo;
    }
    return loaded;
  });

  useEffect(() => {
    saveAll(data);
  }, [data]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => fn(prev));
  }, []);

  const loadDemo = useCallback(() => {
    const demo = createDemoData();
    setData(demo);
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData(next);
  }, []);

  return { data, update, loadDemo, replaceAll };
}

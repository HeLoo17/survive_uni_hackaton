import { createContext, useContext } from "react";
import { useAppData } from "../hooks/useAppData";

type Ctx = ReturnType<typeof useAppData>;
const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const value = useAppData();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}

import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { DeadlinesPage } from "./pages/DeadlinesPage";
import { SchedulePage } from "./pages/SchedulePage";
import { TodosPage } from "./pages/TodosPage";
import { SubscriptionsPage } from "./pages/SubscriptionsPage";
import { FinancePage } from "./pages/FinancePage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="deadlines" element={<DeadlinesPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

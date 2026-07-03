import { NavLink, Outlet } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { computeBadges } from "../lib/badges";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/deadlines", label: "Deadlines", badge: "overdue" as const },
  { to: "/schedule", label: "Schedule" },
  { to: "/todos", label: "Todos", badge: "todosDueToday" as const },
  { to: "/subscriptions", label: "Subscriptions", badge: "subsSoon" as const },
  { to: "/finance", label: "Finance" },
  { to: "/settings", label: "Settings" },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{count}</span>;
}

export function Layout() {
  const { data } = useApp();
  const badges = computeBadges(data);

  const nav = (
    <nav className="flex flex-col gap-1">
      {links.map(({ to, label, end, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center rounded-lg px-3 py-2 text-sm transition ${isActive ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-600 hover:bg-slate-100"}`
          }
        >
          {label}
          {badge && <Badge count={badges[badge]} />}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white lg:hidden">
        <div className="px-4 py-3">
          <p className="text-lg font-semibold">Survive Uni</p>
          <p className="text-xs text-slate-500">Student life, organised</p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 lg:block">
          <p className="mb-1 text-lg font-semibold">Survive Uni</p>
          <p className="mb-6 text-xs text-slate-500">Student life, organised</p>
          {nav}
        </aside>
        <main className="flex-1 p-4 pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 flex overflow-x-auto border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {links.slice(0, 5).map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `shrink-0 rounded-lg px-3 py-2 text-xs ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}>
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

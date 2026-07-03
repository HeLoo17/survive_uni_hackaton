import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatMY, isOverdue, isWithinDays, mondayIndex, todayISO } from "../lib/dates";
import { monthSummary } from "../lib/finance";
import { monthlyCost } from "../lib/subscriptions";

export function Dashboard() {
  const { data } = useApp();
  const today = todayISO();
  const courseCode = (id: string) => data.courses.find((c) => c.id === id)?.code ?? "—";

  const upcoming = data.assignments.filter((a) => !a.completed && isWithinDays(a.dueDate, 7)).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
  const overdueCount = data.assignments.filter((a) => isOverdue(a.dueDate, a.completed)).length;
  const todayClasses = data.classes.filter((c) => c.dayOfWeek === mondayIndex()).sort((a,b) => a.startTime.localeCompare(b.startTime));
  const todayEvents = data.events.filter((e) => e.date === today);
  const openTodos = data.todos.filter((t) => !t.completed).slice(0, 5);
  const subsSoon = data.subscriptions.filter((s) => s.active && isWithinDays(s.nextPaymentDate, 14));
  const subTotal = data.subscriptions.filter((s) => s.active).reduce((s, x) => s + monthlyCost(x.amount, x.billingCycle), 0);
  const fin = monthSummary(data.finance);
  const budgetPct = data.settings.monthlyBudget > 0 ? Math.min(100, (fin.expenses / data.settings.monthlyBudget) * 100) : 0;

  const card = "rounded-lg border border-slate-200 bg-white p-4";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Deadlines</h2><Link to="/deadlines" className="text-xs text-indigo-600">View all</Link></div>
          {overdueCount > 0 && <p className="mb-2 text-xs font-medium text-red-600">{overdueCount} overdue</p>}
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">Nothing due in the next 7 days.</p> : (
            <ul className="space-y-2 text-sm">{upcoming.slice(0, 4).map((a) => (
              <li key={a.id}><span className="font-medium">{a.title}</span> <span className="text-slate-500">· {courseCode(a.courseId)} · {formatMY(a.dueDate)}</span></li>
            ))}</ul>
          )}
        </section>
        <section className={card}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Today&apos;s schedule</h2><Link to="/schedule" className="text-xs text-indigo-600">View all</Link></div>
          {todayClasses.length === 0 && todayEvents.length === 0 ? <p className="text-sm text-slate-500">No classes or events today.</p> : (
            <ul className="space-y-2 text-sm">
              {todayClasses.map((c) => <li key={c.id}>{courseCode(c.courseId)} · {c.startTime}–{c.endTime} · {c.location}</li>)}
              {todayEvents.map((e) => <li key={e.id} className="text-amber-700">{e.title} · {e.startTime ?? "all day"}</li>)}
            </ul>
          )}
        </section>
        <section className={card}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">To-dos</h2><Link to="/todos" className="text-xs text-indigo-600">View all</Link></div>
          {openTodos.length === 0 ? <p className="text-sm text-slate-500">All done!</p> : (
            <ul className="space-y-1 text-sm">{openTodos.map((t) => <li key={t.id}>○ {t.title}{t.dueDate && ` · ${formatMY(t.dueDate)}`}</li>)}</ul>
          )}
        </section>
        <section className={card}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Subscriptions</h2><Link to="/subscriptions" className="text-xs text-indigo-600">View all</Link></div>
          <p className="mb-2 text-sm text-slate-500">Est. RM {subTotal.toFixed(2)}/mo</p>
          {subsSoon.length === 0 ? <p className="text-sm text-slate-500">None due in 14 days.</p> : (
            <ul className="space-y-1 text-sm">{subsSoon.map((s) => <li key={s.id}>{s.name} · RM {s.amount.toFixed(2)} · {formatMY(s.nextPaymentDate)}</li>)}</ul>
          )}
        </section>
        <section className={`${card} md:col-span-2`}>
          <div className="mb-3 flex items-center justify-between"><h2 className="font-medium">Finance this month</h2><Link to="/finance" className="text-xs text-indigo-600">View all</Link></div>
          <div className="mb-3 flex gap-6 text-sm">
            <span className="text-green-600">+RM {fin.income.toFixed(2)}</span>
            <span className="text-red-600">-RM {fin.expenses.toFixed(2)}</span>
            <span>Net RM {fin.net.toFixed(2)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${budgetPct >= 100 ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${budgetPct}%` }} /></div>
          <p className="mt-1 text-xs text-slate-500">RM {fin.expenses.toFixed(2)} of RM {data.settings.monthlyBudget.toFixed(2)} budget</p>
        </section>
      </div>
    </div>
  );
}

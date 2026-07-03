import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { generateId } from "../lib/storage";
import { formatMY } from "../lib/dates";
import { monthSummary } from "../lib/finance";
import { FINANCE_CATEGORIES } from "../types";
import type { FinanceType } from "../types";

export function FinancePage() {
  const { data, update } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "expense" as FinanceType, amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0,10) });
  const summary = monthSummary(data.finance);
  const budget = data.settings.monthlyBudget;
  const pct = budget > 0 ? Math.min(100, (summary.expenses / budget) * 100) : 0;
  const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white";
  const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader title="Finance" action={<button type="button" className={btn} onClick={() => setOpen(true)}>Add record</button>} />
      <p className="mb-4 text-xs text-slate-500">Subscriptions are tracked separately — avoid double-counting.</p>
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Income</p><p className="text-xl font-semibold text-green-600">RM {summary.income.toFixed(2)}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Expenses</p><p className="text-xl font-semibold text-red-600">RM {summary.expenses.toFixed(2)}</p></div>
        <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Net</p><p className="text-xl font-semibold">RM {summary.net.toFixed(2)}</p></div>
      </div>
      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-2 flex justify-between text-sm"><span>Monthly budget</span><span>RM {summary.expenses.toFixed(2)} / RM {budget.toFixed(2)}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${pct >= 100 ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} /></div>
        <label className="mt-3 block text-sm">Set budget (RM)
          <input type="number" className={input} value={budget} onChange={(e) => update((d) => ({ ...d, settings: { ...d.settings, monthlyBudget: +e.target.value || 0 } }))} />
        </label>
      </div>
      {data.finance.length === 0 ? <EmptyState message="Log your first expense or income." /> : (
        <ul className="space-y-2">
          {[...data.finance].sort((a,b) => b.date.localeCompare(a.date)).map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <div><p className="font-medium">{r.description}</p><p className="text-slate-500">{r.category} · {formatMY(r.date)}</p></div>
              <div className="flex items-center gap-3">
                <span className={r.type === "income" ? "text-green-600" : "text-red-600"}>{r.type === "income" ? "+" : "-"}RM {r.amount.toFixed(2)}</span>
                <button type="button" onClick={() => update((d) => ({ ...d, finance: d.finance.filter((x) => x.id !== r.id) }))} className="text-red-500">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="New record" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <label className="block text-sm">Type<select className={input} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FinanceType })}><option value="expense">Expense</option><option value="income">Income</option></select></label>
          <label className="block text-sm">Amount<input type="number" step="0.01" className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block text-sm">Category<select className={input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{FINANCE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="block text-sm">Description<input className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <label className="block text-sm">Date<input type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          <button type="button" className={`${btn} w-full`} onClick={() => {
            if (!form.amount || !form.description) return;
            update((d) => ({ ...d, finance: [{ id: generateId(), ...form, amount: +form.amount }, ...d.finance] }));
            setOpen(false);
          }}>Save</button>
        </div>
      </Modal>
    </div>
  );
}

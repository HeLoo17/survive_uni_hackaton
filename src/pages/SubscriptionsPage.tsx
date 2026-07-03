import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { generateId } from "../lib/storage";
import { formatMY, isWithinDays } from "../lib/dates";
import { advancePaymentDate, monthlyCost } from "../lib/subscriptions";
import type { BillingCycle } from "../types";

export function SubscriptionsPage() {
  const { data, update } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", billingCycle: "monthly" as BillingCycle, nextPaymentDate: new Date().toISOString().slice(0,10), active: true });

  const totalMonthly = data.subscriptions.filter((s) => s.active).reduce((sum, s) => sum + monthlyCost(s.amount, s.billingCycle), 0);
  const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white";
  const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  const markPaid = (id: string) => {
    update((d) => ({
      ...d,
      subscriptions: d.subscriptions.map((s) => s.id === id ? { ...s, nextPaymentDate: advancePaymentDate(s.nextPaymentDate, s.billingCycle) } : s),
    }));
  };

  return (
    <div>
      <PageHeader title="Subscriptions" action={<button type="button" className={btn} onClick={() => setOpen(true)}>Add subscription</button>} />
      <p className="mb-4 text-sm text-slate-500">Est. monthly total: <span className="font-semibold text-slate-900">RM {totalMonthly.toFixed(2)}</span></p>
      {data.subscriptions.length === 0 ? <EmptyState message="Track Spotify, gym, and other recurring payments here." /> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.subscriptions.map((s) => (
            <li key={s.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-slate-500">RM {s.amount.toFixed(2)} / {s.billingCycle}</p>
                  <p className="text-sm">Next: {formatMY(s.nextPaymentDate)}</p>
                  {s.active && isWithinDays(s.nextPaymentDate, 14) && <span className="text-xs font-medium text-amber-600">Due soon</span>}
                </div>
                <button type="button" onClick={() => update((d) => ({ ...d, subscriptions: d.subscriptions.map((x) => x.id === s.id ? { ...x, active: !x.active } : x) }))} className="text-xs text-slate-400">{s.active ? "Active" : "Paused"}</button>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => markPaid(s.id)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium">Mark as paid</button>
                <button type="button" onClick={() => update((d) => ({ ...d, subscriptions: d.subscriptions.filter((x) => x.id !== s.id) }))} className="text-xs text-red-500">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title="New subscription" onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <label className="block text-sm">Name<input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="block text-sm">Amount (RM)<input type="number" step="0.01" className={input} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label>
          <label className="block text-sm">Cycle<select className={input} value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value as BillingCycle })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>
          <label className="block text-sm">Next payment<input type="date" className={input} value={form.nextPaymentDate} onChange={(e) => setForm({ ...form, nextPaymentDate: e.target.value })} /></label>
          <button type="button" className={`${btn} w-full`} onClick={() => {
            if (!form.name || !form.amount) return;
            update((d) => ({ ...d, subscriptions: [...d.subscriptions, { id: generateId(), name: form.name, amount: +form.amount, billingCycle: form.billingCycle, nextPaymentDate: form.nextPaymentDate, active: true }] }));
            setOpen(false);
          }}>Save</button>
        </div>
      </Modal>
    </div>
  );
}

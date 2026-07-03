import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { generateId } from "../lib/storage";
import { formatMY, isOverdue } from "../lib/dates";
import type { Assignment, Priority } from "../types";

type Filter = "all" | "pending" | "overdue";

const empty = (): Omit<Assignment, "id"> => ({
  title: "", courseId: "", dueDate: new Date().toISOString().slice(0, 10),
  priority: "medium", completed: false, notes: "",
});

export function DeadlinesPage() {
  const { data, update } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty());
  const [editId, setEditId] = useState<string | null>(null);

  const courseName = (id: string) => data.courses.find((c) => c.id === id)?.code ?? "—";

  let list = [...data.assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (filter === "pending") list = list.filter((a) => !a.completed);
  if (filter === "overdue") list = list.filter((a) => isOverdue(a.dueDate, a.completed));

  const openNew = () => { setForm(empty()); setEditId(null); setOpen(true); };
  const openEdit = (a: Assignment) => {
    setForm({ title: a.title, courseId: a.courseId, dueDate: a.dueDate, priority: a.priority, completed: a.completed, notes: a.notes ?? "" });
    setEditId(a.id); setOpen(true);
  };

  const save = () => {
    if (!form.title || !form.courseId) return;
    update((d) => {
      if (editId) {
        return { ...d, assignments: d.assignments.map((a) => a.id === editId ? { ...a, ...form } : a) };
      }
      return { ...d, assignments: [...d.assignments, { ...form, id: generateId() }] };
    });
    setOpen(false);
  };

  const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700";
  const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader title="Assignment Deadlines" action={<button type="button" className={btn} onClick={openNew}>Add assignment</button>} />
      <div className="mb-4 flex gap-2">
        {(["all", "pending", "overdue"] as Filter[]).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>{f}</button>
        ))}
      </div>
      {list.length === 0 ? <EmptyState message="No assignments yet. Add your first deadline." /> : (
        <ul className="space-y-2">
          {list.map((a) => (
            <li key={a.id} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <input type="checkbox" checked={a.completed} onChange={() => update((d) => ({ ...d, assignments: d.assignments.map((x) => x.id === a.id ? { ...x, completed: !x.completed } : x) }))} className="mt-1" />
              <div className="flex-1">
                <p className={`font-medium ${a.completed ? "line-through text-slate-400" : ""}`}>{a.title}</p>
                <p className="text-sm text-slate-500">{courseName(a.courseId)} · Due {formatMY(a.dueDate)} · {a.priority}</p>
                {isOverdue(a.dueDate, a.completed) && <span className="text-xs font-medium text-red-600">Overdue</span>}
              </div>
              <button type="button" onClick={() => openEdit(a)} className="text-sm text-indigo-600">Edit</button>
              <button type="button" onClick={() => update((d) => ({ ...d, assignments: d.assignments.filter((x) => x.id !== a.id) }))} className="text-sm text-red-500">Delete</button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={open} title={editId ? "Edit assignment" : "New assignment"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <label className="block text-sm">Title<input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="block text-sm">Course
            <select className={input} value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course</option>
              {data.courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Due date<input type="date" className={input} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
          <label className="block text-sm">Priority
            <select className={input} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label className="block text-sm">Notes<textarea className={input} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <button type="button" className={`${btn} w-full`} onClick={save}>Save</button>
        </div>
      </Modal>
    </div>
  );
}

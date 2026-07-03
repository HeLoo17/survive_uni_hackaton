import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { generateId } from "../lib/storage";
import { formatMY, todayISO } from "../lib/dates";

export function TodosPage() {
  const { data, update } = useApp();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");

  const add = () => {
    if (!title.trim()) return;
    update((d) => ({
      ...d,
      todos: [{ id: generateId(), title: title.trim(), completed: false, dueDate: due || undefined, createdAt: todayISO() }, ...d.todos],
    }));
    setTitle(""); setDue("");
  };

  const makeAssignment = (todoId: string) => {
    const todo = data.todos.find((t) => t.id === todoId);
    if (!todo || !data.courses[0]) return;
    const aId = generateId();
    update((d) => ({
      ...d,
      assignments: [...d.assignments, {
        id: aId, title: todo.title, courseId: d.courses[0].id,
        dueDate: todo.dueDate ?? todayISO(), priority: "medium", completed: false, linkedTodoId: todoId,
      }],
      todos: d.todos.map((t) => t.id === todoId ? { ...t, linkedAssignmentId: aId } : t),
    }));
  };

  const open = data.todos.filter((t) => !t.completed);

  return (
    <div>
      <PageHeader title="To-Do List" />
      <div className="mb-6 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row">
        <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="New todo..." value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
        <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={due} onChange={(e) => setDue(e.target.value)} />
        <button type="button" onClick={add} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Add</button>
      </div>
      {open.length === 0 ? <EmptyState message="All caught up! Add a todo above." /> : (
        <ul className="space-y-2">
          {data.todos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <input type="checkbox" checked={t.completed} onChange={() => update((d) => ({ ...d, todos: d.todos.map((x) => x.id === t.id ? { ...x, completed: !x.completed } : x) }))} />
              <span className={`flex-1 text-sm ${t.completed ? "line-through text-slate-400" : ""}`}>{t.title}{t.dueDate && <span className="ml-2 text-slate-400">· {formatMY(t.dueDate)}</span>}</span>
              {!t.completed && !t.linkedAssignmentId && (
                <button type="button" onClick={() => makeAssignment(t.id)} className="text-xs text-indigo-600">Make assignment</button>
              )}
              {t.linkedAssignmentId && <span className="text-xs text-slate-400">Linked</span>}
              <button type="button" onClick={() => update((d) => ({ ...d, todos: d.todos.filter((x) => x.id !== t.id) }))} className="text-xs text-red-500">Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

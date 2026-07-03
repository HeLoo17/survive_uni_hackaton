import { useRef } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { generateId } from "../lib/storage";
import { exportData, importData } from "../lib/exportImport";

export function SettingsPage() {
  const { data, update, loadDemo, replaceAll } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white";
  const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader title="Settings" />
      <section className="mb-8 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium">Courses</h2>
        <ul className="mb-3 space-y-2">
          {data.courses.map((c) => (
            <li key={c.id} className="flex items-center justify-between text-sm">
              <span>{c.code} — {c.name}</span>
              <button type="button" className="text-red-500" onClick={() => update((d) => ({ ...d, courses: d.courses.filter((x) => x.id !== c.id) }))}>Remove</button>
            </li>
          ))}
        </ul>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const code = String(fd.get("code") || "").trim();
          const name = String(fd.get("name") || "").trim();
          if (!code || !name) return;
          update((d) => ({ ...d, courses: [...d.courses, { id: generateId(), code, name }] }));
          e.currentTarget.reset();
        }}>
          <input name="code" placeholder="Code (CSC101)" className={input} />
          <input name="name" placeholder="Course name" className={input} />
          <button type="submit" className={btn}>Add course</button>
        </form>
      </section>
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-medium">Data</h2>
        <button type="button" className={btn} onClick={loadDemo}>Load demo data</button>
        <button type="button" className="ml-2 rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={() => {
          const blob = new Blob([exportData(data)], { type: "application/json" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "survive-uni-backup.json"; a.click();
        }}>Export JSON</button>
        <button type="button" className="ml-2 rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={() => fileRef.current?.click()}>Import JSON</button>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          try { replaceAll(importData(await file.text())); alert("Import successful"); }
          catch (err) { alert(err instanceof Error ? err.message : "Import failed"); }
          e.target.value = "";
        }} />
      </section>
    </div>
  );
}

import { useState } from "react";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { Modal } from "../components/Modal";
import { EmptyState } from "../components/EmptyState";
import { generateId } from "../lib/storage";
import { formatMY, mondayIndex } from "../lib/dates";
import { DAYS } from "../types";
import type { ClassEntry, EventType } from "../types";

export function SchedulePage() {
  const { data, update } = useApp();
  const [tab, setTab] = useState<"timetable" | "events">("timetable");
  const [day, setDay] = useState(mondayIndex());
  const [classOpen, setClassOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [cForm, setCForm] = useState<Omit<ClassEntry, "id">>({ courseId: "", dayOfWeek: 0, startTime: "09:00", endTime: "10:00", location: "" });
  const [eForm, setEForm] = useState({ title: "", courseId: "", date: new Date().toISOString().slice(0,10), type: "exam" as EventType, startTime: "09:00", endTime: "11:00" });

  const courseLabel = (id: string) => { const c = data.courses.find((x) => x.id === id); return c ? `${c.code}` : "—"; };

  const btn = "rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white";
  const input = "mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

  return (
    <div>
      <PageHeader title="Class Schedule" action={
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={() => setClassOpen(true)}>Add class</button>
          <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-sm" onClick={() => setEventOpen(true)}>Add event</button>
        </div>
      } />
      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setTab("timetable")} className={`rounded-lg px-3 py-1.5 text-sm ${tab === "timetable" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white"}`}>Timetable</button>
        <button type="button" onClick={() => setTab("events")} className={`rounded-lg px-3 py-1.5 text-sm ${tab === "events" ? "bg-slate-900 text-white" : "border border-slate-200 bg-white"}`}>Events</button>
      </div>
      {tab === "timetable" ? (
        <>
          <div className="mb-4 flex gap-1 overflow-x-auto lg:hidden">
            {DAYS.map((d, i) => (
              <button key={d} type="button" onClick={() => setDay(i)} className={`shrink-0 rounded-lg px-3 py-2 text-sm ${day === i ? "bg-indigo-50 text-indigo-700" : "bg-white border border-slate-200"}`}>{d}</button>
            ))}
          </div>
          <div className="hidden gap-2 lg:grid lg:grid-cols-7">
            {DAYS.map((d, i) => (
              <div key={d} className="rounded-lg border border-slate-200 bg-white p-2">
                <p className="mb-2 text-center text-xs font-semibold text-slate-500">{d}</p>
                {data.classes.filter((c) => c.dayOfWeek === i).sort((a,b) => a.startTime.localeCompare(b.startTime)).map((c) => (
                  <div key={c.id} className="mb-2 rounded bg-indigo-50 p-2 text-xs">
                    <p className="font-medium">{courseLabel(c.courseId)}</p>
                    <p className="text-slate-500">{c.startTime}–{c.endTime}</p>
                    <p className="text-slate-400">{c.location}</p>
                    <button type="button" className="text-red-500" onClick={() => update((d) => ({ ...d, classes: d.classes.filter((x) => x.id !== c.id) }))}>Remove</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="space-y-2 lg:hidden">
            {data.classes.filter((c) => c.dayOfWeek === day).length === 0 ? <EmptyState message="No classes this day." /> :
              data.classes.filter((c) => c.dayOfWeek === day).map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="font-medium">{courseLabel(c.courseId)}</p>
                  <p className="text-sm text-slate-500">{c.startTime}–{c.endTime} · {c.location}</p>
                  <button type="button" className="mt-2 text-sm text-red-500" onClick={() => update((d) => ({ ...d, classes: d.classes.filter((x) => x.id !== c.id) }))}>Remove</button>
                </div>
              ))}
          </div>
        </>
      ) : (
        data.events.length === 0 ? <EmptyState message="No one-off events. Add exams or study sessions." /> : (
          <ul className="space-y-2">
            {data.events.sort((a,b) => a.date.localeCompare(b.date)).map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="font-medium">{e.title} <span className="text-xs uppercase text-slate-400">{e.type}</span></p>
                <p className="text-sm text-slate-500">{formatMY(e.date)}{e.startTime && ` · ${e.startTime}–${e.endTime}`}{e.courseId && ` · ${courseLabel(e.courseId)}`}</p>
                <button type="button" className="mt-2 text-sm text-red-500" onClick={() => update((d) => ({ ...d, events: d.events.filter((x) => x.id !== e.id) }))}>Remove</button>
              </li>
            ))}
          </ul>
        )
      )}
      <Modal open={classOpen} title="Add class" onClose={() => setClassOpen(false)}>
        <div className="space-y-3">
          <label className="block text-sm">Course<select className={input} value={cForm.courseId} onChange={(e) => setCForm({ ...cForm, courseId: e.target.value })}><option value="">Select</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}</select></label>
          <label className="block text-sm">Day<select className={input} value={cForm.dayOfWeek} onChange={(e) => setCForm({ ...cForm, dayOfWeek: +e.target.value })}>{DAYS.map((d,i) => <option key={d} value={i}>{d}</option>)}</select></label>
          <label className="block text-sm">Start<input type="time" className={input} value={cForm.startTime} onChange={(e) => setCForm({ ...cForm, startTime: e.target.value })} /></label>
          <label className="block text-sm">End<input type="time" className={input} value={cForm.endTime} onChange={(e) => setCForm({ ...cForm, endTime: e.target.value })} /></label>
          <label className="block text-sm">Location<input className={input} value={cForm.location} onChange={(e) => setCForm({ ...cForm, location: e.target.value })} /></label>
          <button type="button" className={`${btn} w-full`} onClick={() => { if (!cForm.courseId) return; update((d) => ({ ...d, classes: [...d.classes, { ...cForm, id: generateId() }] })); setClassOpen(false); }}>Save</button>
        </div>
      </Modal>
      <Modal open={eventOpen} title="Add event" onClose={() => setEventOpen(false)}>
        <div className="space-y-3">
          <label className="block text-sm">Title<input className={input} value={eForm.title} onChange={(e) => setEForm({ ...eForm, title: e.target.value })} /></label>
          <label className="block text-sm">Date<input type="date" className={input} value={eForm.date} onChange={(e) => setEForm({ ...eForm, date: e.target.value })} /></label>
          <label className="block text-sm">Type<select className={input} value={eForm.type} onChange={(e) => setEForm({ ...eForm, type: e.target.value as EventType })}><option value="exam">Exam</option><option value="other">Other</option></select></label>
          <button type="button" className={`${btn} w-full`} onClick={() => { if (!eForm.title) return; update((d) => ({ ...d, events: [...d.events, { ...eForm, id: generateId(), courseId: eForm.courseId || undefined }] })); setEventOpen(false); }}>Save</button>
        </div>
      </Modal>
    </div>
  );
}

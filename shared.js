const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TRACKER_FIELDS = {
  class: [
    { id: "title", label: "Class name", type: "text", placeholder: "e.g. Intro to Psychology", required: true },
    { id: "course", label: "Course code (optional)", type: "text", placeholder: "e.g. PSY101" },
    { id: "day", label: "Day", type: "select", options: DAYS },
    { id: "time", label: "Time", type: "time", required: true },
    { id: "location", label: "Location (optional)", type: "text", placeholder: "e.g. Lecture Hall B" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Bring laptop, tutorial week..." },
  ],
  assignment: [
    { id: "title", label: "Assignment title", type: "text", placeholder: "e.g. Essay draft", required: true },
    { id: "course", label: "Course / subject", type: "text", placeholder: "e.g. English Literature", required: true },
    { id: "dueDate", label: "Due date", type: "date", required: true },
    { id: "dueTime", label: "Due time (optional)", type: "time" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Word count, rubric link..." },
  ],
};

const SOCIAL_FIELDS = {
  study: [
    { id: "title", label: "Study session name", type: "text", placeholder: "e.g. Chem midterm cram", required: true },
    { id: "subject", label: "Subject", type: "text", placeholder: "e.g. Organic Chemistry", required: true },
    { id: "date", label: "Date", type: "date", required: true },
    { id: "time", label: "Time", type: "time", required: true },
    { id: "location", label: "Where", type: "text", placeholder: "e.g. Library 2nd floor", required: true },
    { id: "friends", label: "Who's coming?", type: "text", placeholder: "e.g. Alex, Sam, Jordan" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Review chapters 4–6..." },
  ],
  resource: [
    { id: "title", label: "Resource name", type: "text", placeholder: "e.g. Past exam papers", required: true },
    { id: "subject", label: "Subject / topic", type: "text", placeholder: "e.g. Calculus II", required: true },
    { id: "link", label: "Link (optional)", type: "url", placeholder: "https://..." },
    { id: "sharedBy", label: "Shared by", type: "text", placeholder: "e.g. Maria" },
    { id: "notes", label: "Why it's useful", type: "textarea", placeholder: "Great summary of integration techniques" },
  ],
  group: [
    { id: "title", label: "Group task", type: "text", placeholder: "e.g. Film the presentation", required: true },
    { id: "project", label: "Project / course", type: "text", placeholder: "e.g. Group project — CS201", required: true },
    { id: "assignedTo", label: "Assigned to", type: "text", placeholder: "e.g. You + Priya", required: true },
    { id: "dueDate", label: "Due date", type: "date", required: true },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Need tripod from media lab" },
  ],
};

const ATTENDANCE_KEY = "survive-uni-attendance";
const CLASS_KEY = "survive-uni-classes";
const ASSIGNMENT_KEY = "survive-uni-assignments";
const USER_NAME_KEY = "survive-uni-user-name";
const STUDY_KEY = "survive-uni-study-sessions";
const RESOURCE_KEY = "survive-uni-resources";
const GROUP_KEY = "survive-uni-group-tasks";

function loadStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function loadStorageObject(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function saveStorageObject(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getClassAttendanceList() {
  const classes = loadStorage(CLASS_KEY);
  const attendance = loadStorageObject(ATTENDANCE_KEY);
  return sortByDayTime(classes)
    .map((cls) => ({
      ...cls,
      attendees: (attendance[cls.id] || []).filter((a) => a.going).map((a) => a.name),
    }))
    .filter((cls) => cls.attendees.length > 0);
}

function buildFieldHtml(field, prefix = "") {
  const id = prefix ? `${prefix}-${field.id}` : field.id;
  const req = field.required ? " required" : "";
  const ph = field.placeholder ? ` placeholder="${field.placeholder}"` : "";

  if (field.type === "select") {
    const opts = field.options.map((o) => `<option value="${o}">${o}</option>`).join("");
    return `
      <div class="form-row">
        <label for="${id}">${field.label}</label>
        <select id="${id}" name="${field.id}"${req}>${opts}</select>
      </div>
    `;
  }

  if (field.type === "textarea") {
    return `
      <div class="form-row">
        <label for="${id}">${field.label}</label>
        <textarea id="${id}" name="${field.id}"${ph}${req}></textarea>
      </div>
    `;
  }

  return `
    <div class="form-row">
      <label for="${id}">${field.label}</label>
      <input type="${field.type}" id="${id}" name="${field.id}"${ph}${req}>
    </div>
  `;
}

function renderFormFields(container, fields, prefix = "") {
  container.innerHTML = "";
  const rendered = new Set();

  fields.forEach((field) => {
    if (rendered.has(field.id)) return;

    if (field.id === "dueDate" && fields.some((f) => f.id === "dueTime")) {
      const row = document.createElement("div");
      row.className = "form-row-inline";
      row.innerHTML =
        buildFieldHtml(fields.find((f) => f.id === "dueDate"), prefix) +
        buildFieldHtml(fields.find((f) => f.id === "dueTime"), prefix);
      container.appendChild(row);
      rendered.add("dueDate");
      rendered.add("dueTime");
      return;
    }

    if (field.id === "dueTime" && fields.some((f) => f.id === "dueDate")) return;

    container.insertAdjacentHTML("beforeend", buildFieldHtml(field, prefix));
    rendered.add(field.id);
  });
}

function collectFormData(form, fields) {
  const data = {};
  fields.forEach((field) => {
    const el = form.querySelector(`[name="${field.id}"]`);
    if (el) data[field.id] = el.value.trim();
  });
  return data;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  const firstInput = modal.querySelector("input, select, textarea");
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setupModal(modal, form, onSubmit) {
  const closeBtn = modal.querySelector(".modal-close");
  const cancelBtn = modal.querySelector(".modal-cancel");
  const backdrop = modal.querySelector(".modal-backdrop");

  const close = () => {
    form.reset();
    closeModal(modal);
  };

  closeBtn?.addEventListener("click", close);
  cancelBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    onSubmit(new FormData(form));
    form.reset();
    closeModal(modal);
  });
}

function createItemCard(item, meta, onToggle, onDelete) {
  const li = document.createElement("li");
  li.className = `item${item.done ? " done" : ""}`;
  li.dataset.id = item.id;

  li.innerHTML = `
    <label class="item-check">
      <input type="checkbox" class="done-toggle" ${item.done ? "checked" : ""}>
      <span class="checkmark"></span>
    </label>
    <div class="item-body">
      <h3 class="item-title">${escapeHtml(item.title)}</h3>
      <p class="item-meta">${escapeHtml(meta)}</p>
      ${item.notes ? `<p class="item-notes">${escapeHtml(item.notes)}</p>` : ""}
    </div>
    <button type="button" class="btn-icon delete-btn" title="Remove" aria-label="Remove">×</button>
  `;

  li.querySelector(".done-toggle").addEventListener("change", (e) => onToggle(item.id, e.target.checked));
  li.querySelector(".delete-btn").addEventListener("click", () => onDelete(item.id));

  return li;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sortByDayTime(items) {
  const dayOrder = DAYS;
  return [...items].sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return (a.time || "").localeCompare(b.time || "");
  });
}

function sortByDate(items, dateKey = "dueDate", timeKey = "dueTime") {
  return [...items].sort((a, b) => {
    const dateDiff = (a[dateKey] || "9999-12-31").localeCompare(b[dateKey] || "9999-12-31");
    if (dateDiff !== 0) return dateDiff;
    return (a[timeKey] || "").localeCompare(b[timeKey] || "");
  });
}

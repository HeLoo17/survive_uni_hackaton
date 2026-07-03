const STORAGE_KEY = "survive-uni-items";

const TYPE_LABELS = {
  class: "Class",
  assignment: "Assignment",
  deadline: "Deadline",
};

const FIELD_CONFIG = {
  class: [
    { id: "title", label: "Class name", type: "text", placeholder: "e.g. Intro to Psychology", required: true },
    { id: "course", label: "Course code (optional)", type: "text", placeholder: "e.g. PSY101" },
    { id: "day", label: "Day", type: "select", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
    { id: "time", label: "Time", type: "time", required: true },
    { id: "location", label: "Location (optional)", type: "text", placeholder: "e.g. Library Room 3" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Bring laptop, group project day..." },
  ],
  assignment: [
    { id: "title", label: "Assignment title", type: "text", placeholder: "e.g. Essay draft", required: true },
    { id: "course", label: "Course / subject", type: "text", placeholder: "e.g. English Literature", required: true },
    { id: "dueDate", label: "Due date", type: "date", required: true },
    { id: "dueTime", label: "Due time (optional)", type: "time" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "Word count, rubric link..." },
  ],
  deadline: [
    { id: "title", label: "Deadline name", type: "text", placeholder: "e.g. Course registration closes", required: true },
    { id: "category", label: "Category (optional)", type: "text", placeholder: "e.g. Admin, Exam, Club" },
    { id: "dueDate", label: "Date", type: "date", required: true },
    { id: "dueTime", label: "Time (optional)", type: "time" },
    { id: "notes", label: "Notes (optional)", type: "textarea", placeholder: "What you need to do before this..." },
  ],
};

let items = loadItems();
let activeFilter = "all";

const form = document.getElementById("add-form");
const formFields = document.getElementById("form-fields");
const itemList = document.getElementById("item-list");
const emptyState = document.getElementById("empty-state");
const itemTemplate = document.getElementById("item-template");

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getSelectedType() {
  return form.querySelector('input[name="type"]:checked').value;
}

function renderFormFields(type) {
  const fields = FIELD_CONFIG[type];
  formFields.innerHTML = "";

  fields.forEach((field) => {
    const row = document.createElement("div");
    row.className = field.id === "dueDate" && fields.some((f) => f.id === "dueTime")
      ? "form-row form-row-inline"
      : "form-row";

    if (field.id === "dueTime" && fields.some((f) => f.id === "dueDate")) {
      return;
    }

    if (field.id === "dueDate" && fields.some((f) => f.id === "dueTime")) {
      row.innerHTML = buildFieldHtml(fields.find((f) => f.id === "dueDate"));
      row.innerHTML += buildFieldHtml(fields.find((f) => f.id === "dueTime"));
      formFields.appendChild(row);
      return;
    }

    row.innerHTML = buildFieldHtml(field);
    formFields.appendChild(row);
  });
}

function buildFieldHtml(field) {
  const req = field.required ? " required" : "";
  const ph = field.placeholder ? ` placeholder="${field.placeholder}"` : "";

  if (field.type === "select") {
    const opts = field.options.map((o) => `<option value="${o}">${o}</option>`).join("");
    return `
      <label for="${field.id}">${field.label}</label>
      <select id="${field.id}" name="${field.id}"${req}>${opts}</select>
    `;
  }

  if (field.type === "textarea") {
    return `
      <label for="${field.id}">${field.label}</label>
      <textarea id="${field.id}" name="${field.id}"${ph}${req}></textarea>
    `;
  }

  return `
    <label for="${field.id}">${field.label}</label>
    <input type="${field.type}" id="${field.id}" name="${field.id}"${ph}${req}>
  `;
}

function collectFormData(type) {
  const data = { type };
  FIELD_CONFIG[type].forEach((field) => {
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

function buildMeta(item) {
  const parts = [];

  if (item.type === "class") {
    if (item.course) parts.push(item.course);
    parts.push(`${item.day} · ${formatTime(item.time)}`);
    if (item.location) parts.push(item.location);
  }

  if (item.type === "assignment") {
    parts.push(item.course);
    let due = `Due ${formatDate(item.dueDate)}`;
    if (item.dueTime) due += ` at ${formatTime(item.dueTime)}`;
    parts.push(due);
  }

  if (item.type === "deadline") {
    if (item.category) parts.push(item.category);
    let due = formatDate(item.dueDate);
    if (item.dueTime) due += ` · ${formatTime(item.dueTime)}`;
    parts.push(due);
  }

  return parts.join(" · ");
}

function sortItems(list) {
  const dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return [...list].sort((a, b) => {
    if (a.type === "class" && b.type === "class") {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return (a.time || "").localeCompare(b.time || "");
    }

    const dateA = a.dueDate || "9999-12-31";
    const dateB = b.dueDate || "9999-12-31";
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    return (a.dueTime || "").localeCompare(b.dueTime || "");
  });
}

function renderList() {
  const filtered = activeFilter === "all"
    ? items
    : items.filter((i) => i.type === activeFilter);

  const sorted = sortItems(filtered);

  itemList.innerHTML = "";

  if (sorted.length === 0) {
    emptyState.classList.remove("hidden");
    updateStats();
    return;
  }

  emptyState.classList.add("hidden");

  sorted.forEach((item) => {
    const node = itemTemplate.content.cloneNode(true);
    const li = node.querySelector(".item");
    li.dataset.id = item.id;
    if (item.done) li.classList.add("done");

    const badge = node.querySelector(".item-badge");
    badge.textContent = TYPE_LABELS[item.type];
    badge.classList.add(item.type);

    node.querySelector(".item-title").textContent = item.title;

    const meta = node.querySelector(".item-meta");
    meta.textContent = buildMeta(item);

    const notesEl = node.querySelector(".item-notes");
    if (item.notes) {
      notesEl.textContent = item.notes;
      notesEl.classList.remove("hidden");
    }

    node.querySelector(".done-toggle").checked = item.done;

    itemList.appendChild(node);
  });

  updateStats();
}

function updateStats() {
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = total - done;
  document.getElementById("stat-done").textContent = done;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const type = getSelectedType();
  const data = collectFormData(type);

  items.push({
    id: crypto.randomUUID(),
    ...data,
    done: false,
    createdAt: Date.now(),
  });

  saveItems();
  renderList();
  form.reset();
  renderFormFields(type);
});

form.querySelectorAll('input[name="type"]').forEach((radio) => {
  radio.addEventListener("change", () => renderFormFields(getSelectedType()));
});

document.querySelector(".filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;

  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  renderList();
});

itemList.addEventListener("change", (e) => {
  if (!e.target.classList.contains("done-toggle")) return;
  const li = e.target.closest(".item");
  const item = items.find((i) => i.id === li.dataset.id);
  if (!item) return;

  item.done = e.target.checked;
  li.classList.toggle("done", item.done);
  saveItems();
  updateStats();
});

itemList.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;

  const li = btn.closest(".item");
  items = items.filter((i) => i.id !== li.dataset.id);
  saveItems();
  renderList();
});

renderFormFields(getSelectedType());
renderList();

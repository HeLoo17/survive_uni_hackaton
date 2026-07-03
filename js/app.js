(function () {
  "use strict";

  const STORAGE_KEY = "survive-uni-items";

  const TYPE_LABELS = {
    assignment: "Assignment",
    study: "Study session",
    group: "Group task",
  };

  /** @type {Array<object>} */
  let items = loadItems();

  const els = {
    tabs: document.querySelectorAll(".tabs__btn"),
    panels: document.querySelectorAll(".panel"),
    weekGrid: document.getElementById("weekGrid"),
    weekRange: document.getElementById("weekRange"),
    weekEmpty: document.getElementById("weekEmpty"),
    weekStats: document.getElementById("weekStats"),
    lists: {
      assignment: document.getElementById("list-assignments"),
      study: document.getElementById("list-study"),
      group: document.getElementById("list-group"),
    },
    empties: {
      assignment: document.getElementById("empty-assignments"),
      study: document.getElementById("empty-study"),
      group: document.getElementById("empty-group"),
    },
    modal: document.getElementById("itemModal"),
    form: document.getElementById("itemForm"),
    modalTitle: document.getElementById("modalTitle"),
    itemId: document.getElementById("itemId"),
    itemType: document.getElementById("itemType"),
    itemTitle: document.getElementById("itemTitle"),
    itemSubject: document.getElementById("itemSubject"),
    itemDueDate: document.getElementById("itemDueDate"),
    itemTime: document.getElementById("itemTime"),
    itemLocation: document.getElementById("itemLocation"),
    itemFriends: document.getElementById("itemFriends"),
    itemAssignee: document.getElementById("itemAssignee"),
    itemNotes: document.getElementById("itemNotes"),
    studyFields: document.getElementById("studyFields"),
    friendsField: document.getElementById("friendsField"),
    assigneeField: document.getElementById("assigneeField"),
  };

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

  function uid() {
    return crypto.randomUUID();
  }

  function startOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfWeek(start) {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, today)) return "Today";
    if (sameDay(d, tomorrow)) return "Tomorrow";
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function formatWeekRange(start, end) {
    const opts = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
  }

  function isThisWeek(dateStr, weekStart, weekEnd) {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T12:00:00");
    return d >= weekStart && d <= weekEnd;
  }

  function linkify(text) {
    if (!text) return "";
    const escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  function getItem(id) {
    return items.find((i) => i.id === id);
  }

  function toggleDone(id) {
    const item = getItem(id);
    if (item) {
      item.done = !item.done;
      saveItems();
      render();
    }
  }

  function deleteItem(id) {
    if (!confirm("Delete this item?")) return;
    items = items.filter((i) => i.id !== id);
    saveItems();
    render();
  }

  function openModal(type, existing) {
    const isEdit = Boolean(existing);
    els.modalTitle.textContent = isEdit ? "Edit item" : `Add ${TYPE_LABELS[type].toLowerCase()}`;
    els.itemId.value = existing?.id || "";
    els.itemType.value = type;
    els.itemTitle.value = existing?.title || "";
    els.itemSubject.value = existing?.subject || "";
    els.itemDueDate.value = existing?.dueDate || "";
    els.itemTime.value = existing?.time || "";
    els.itemLocation.value = existing?.location || "";
    els.itemFriends.value = existing?.friends?.join(", ") || "";
    els.itemAssignee.value = existing?.assignee || "";
    els.itemNotes.value = existing?.notes || "";

    const isStudy = type === "study";
    const isGroup = type === "group";
    els.studyFields.hidden = !isStudy;
    els.friendsField.hidden = !isStudy;
    els.assigneeField.hidden = !isGroup;

    els.modal.showModal();
    els.itemTitle.focus();
  }

  function closeModal() {
    els.modal.close();
    els.form.reset();
  }

  function handleSubmit(e) {
    e.preventDefault();
    const type = els.itemType.value;
    const id = els.itemId.value || uid();
    const existing = getItem(id);

    const payload = {
      id,
      type,
      title: els.itemTitle.value.trim(),
      subject: els.itemSubject.value.trim(),
      dueDate: els.itemDueDate.value,
      notes: els.itemNotes.value.trim(),
      done: existing?.done || false,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };

    if (type === "study") {
      payload.time = els.itemTime.value;
      payload.location = els.itemLocation.value.trim();
      payload.friends = els.itemFriends.value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (type === "group") {
      payload.assignee = els.itemAssignee.value.trim();
    }

    if (existing) {
      items = items.map((i) => (i.id === id ? payload : i));
    } else {
      items.push(payload);
    }

    saveItems();
    closeModal();
    render();
  }

  function renderList(type) {
    const list = els.lists[type];
    const empty = els.empties[type];
    const filtered = items.filter((i) => i.type === type);

    list.innerHTML = "";
    empty.hidden = filtered.length > 0;

    filtered
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
      })
      .forEach((item) => {
        list.appendChild(createCard(item));
      });
  }

  function createCard(item) {
    const li = document.createElement("li");
    li.className = "item-card" + (item.done ? " item-card--done" : "");
    li.dataset.id = item.id;

    const metaParts = [];
    if (item.subject) metaParts.push(`<span class="tag">${escapeHtml(item.subject)}</span>`);
    if (item.dueDate) metaParts.push(`<span>${formatDate(item.dueDate)}</span>`);
    if (item.time) metaParts.push(`<span>${item.time}</span>`);
    if (item.location) metaParts.push(`<span>📍 ${escapeHtml(item.location)}</span>`);
    if (item.friends?.length) metaParts.push(`<span>👥 ${escapeHtml(item.friends.join(", "))}</span>`);
    if (item.assignee) metaParts.push(`<span>🙋 ${escapeHtml(item.assignee)}</span>`);

    li.innerHTML = `
      <input type="checkbox" class="item-card__check" ${item.done ? "checked" : ""} aria-label="Mark done">
      <div class="item-card__body">
        <p class="item-card__title">${escapeHtml(item.title)}</p>
        <div class="item-card__meta">${metaParts.join("")}</div>
        ${item.notes ? `<p class="item-card__notes">${linkify(item.notes)}</p>` : ""}
      </div>
      <div class="item-card__actions">
        <button type="button" class="btn btn--icon" data-action="edit" aria-label="Edit">✏️</button>
        <button type="button" class="btn btn--icon btn--danger" data-action="delete" aria-label="Delete">🗑️</button>
      </div>
    `;

    li.querySelector(".item-card__check").addEventListener("change", () => toggleDone(item.id));
    li.querySelector('[data-action="edit"]').addEventListener("click", () => openModal(item.type, item));
    li.querySelector('[data-action="delete"]').addEventListener("click", () => deleteItem(item.id));

    return li;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderWeek() {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(weekStart);

    els.weekRange.textContent = formatWeekRange(weekStart, weekEnd);
    els.weekGrid.innerHTML = "";

    const weekItems = items.filter((i) => isThisWeek(i.dueDate, weekStart, weekEnd));
    els.weekEmpty.hidden = weekItems.length > 0;

    const pending = weekItems.filter((i) => !i.done).length;
    const done = weekItems.filter((i) => i.done).length;
    els.weekStats.innerHTML = `
      <span class="stat-pill"><strong>${pending}</strong> due this week</span>
      <span class="stat-pill"><strong>${done}</strong> done</span>
      <span class="stat-pill"><strong>${items.filter((i) => !i.done).length}</strong> total open</span>
    `;

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dateStr = day.toISOString().slice(0, 10);
      const isToday =
        day.getFullYear() === today.getFullYear() &&
        day.getMonth() === today.getMonth() &&
        day.getDate() === today.getDate();

      const dayItems = weekItems.filter((item) => item.dueDate === dateStr);

      const col = document.createElement("div");
      col.className = "week-day" + (isToday ? " week-day--today" : "");
      col.innerHTML = `
        <div class="week-day__label">${day.toLocaleDateString(undefined, { weekday: "short" })}</div>
        <div class="week-day__date">${day.getDate()}</div>
        <ul class="week-day__items">
          ${dayItems
            .map(
              (item) =>
                `<li class="week-chip week-chip--${item.type}${item.done ? " week-chip--done" : ""}">${escapeHtml(item.title)}</li>`
            )
            .join("")}
        </ul>
      `;
      els.weekGrid.appendChild(col);
    }
  }

  function render() {
    renderWeek();
    renderList("assignment");
    renderList("study");
    renderList("group");
  }

  function switchTab(tabId) {
    els.tabs.forEach((btn) => {
      const active = btn.dataset.tab === tabId;
      btn.classList.toggle("tabs__btn--active", active);
      return btn.setAttribute("aria-selected", String(active));
    });

    els.panels.forEach((panel) => {
      const active = panel.id === `panel-${tabId}`;
      panel.classList.toggle("panel--active", active);
      panel.hidden = !active;
    });
  }

  document.querySelector(".tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tabs__btn");
    if (btn) switchTab(btn.dataset.tab);
  });

  document.body.addEventListener("click", (e) => {
    const addBtn = e.target.closest('[data-action="add"]');
    if (addBtn) openModal(addBtn.dataset.type);

    if (e.target.closest('[data-action="close-modal"]')) closeModal();
  });

  els.form.addEventListener("submit", handleSubmit);

  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });

  render();
})();

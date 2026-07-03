const STUDY_KEY = "survive-uni-study-sessions";
const RESOURCE_KEY = "survive-uni-resources";
const GROUP_KEY = "survive-uni-group-tasks";

let studySessions = loadStorage(STUDY_KEY);
let resources = loadStorage(RESOURCE_KEY);
let groupTasks = loadStorage(GROUP_KEY);

const studyList = document.getElementById("study-list");
const resourceList = document.getElementById("resource-list");
const groupList = document.getElementById("group-list");
const studyEmpty = document.getElementById("study-empty");
const resourceEmpty = document.getElementById("resource-empty");
const groupEmpty = document.getElementById("group-empty");
const attendanceList = document.getElementById("attendance-list");
const attendanceEmpty = document.getElementById("attendance-empty");

const studyModal = document.getElementById("study-modal");
const resourceModal = document.getElementById("resource-modal");
const groupModal = document.getElementById("group-modal");
const studyForm = document.getElementById("study-form");
const resourceForm = document.getElementById("resource-form");
const groupForm = document.getElementById("group-form");

renderFormFields(document.getElementById("study-form-fields"), SOCIAL_FIELDS.study);
renderFormFields(document.getElementById("resource-form-fields"), SOCIAL_FIELDS.resource);
renderFormFields(document.getElementById("group-form-fields"), SOCIAL_FIELDS.group);

document.getElementById("open-study-modal").addEventListener("click", () => openModal(studyModal));
document.getElementById("open-resource-modal").addEventListener("click", () => openModal(resourceModal));
document.getElementById("open-group-modal").addEventListener("click", () => openModal(groupModal));

setupModal(studyModal, studyForm, () => {
  const data = collectFormData(studyForm, SOCIAL_FIELDS.study);
  studySessions.push({ id: crypto.randomUUID(), ...data, createdAt: Date.now() });
  saveStorage(STUDY_KEY, studySessions);
  render();
});

setupModal(resourceModal, resourceForm, () => {
  const data = collectFormData(resourceForm, SOCIAL_FIELDS.resource);
  resources.push({ id: crypto.randomUUID(), ...data, done: false, createdAt: Date.now() });
  saveStorage(RESOURCE_KEY, resources);
  render();
});

setupModal(groupModal, groupForm, () => {
  const data = collectFormData(groupForm, SOCIAL_FIELDS.group);
  groupTasks.push({ id: crypto.randomUUID(), ...data, done: false, createdAt: Date.now() });
  saveStorage(GROUP_KEY, groupTasks);
  render();
});

function studyMeta(item) {
  const parts = [item.subject, `${formatDate(item.date)} · ${formatTime(item.time)}`, item.location];
  if (item.friends) parts.push(`With ${item.friends}`);
  return parts.join(" · ");
}

function resourceMeta(item) {
  const parts = [item.subject];
  if (item.sharedBy) parts.push(`Shared by ${item.sharedBy}`);
  if (item.link) parts.push("Has link");
  return parts.join(" · ");
}

function groupMeta(item) {
  return `${item.project} · ${item.assignedTo} · Due ${formatDate(item.dueDate)}`;
}

function toggleItem(list, key, id, done) {
  const item = list.find((i) => i.id === id);
  if (!item) return;
  item.done = done;
  saveStorage(key, list);
  render();
}

function deleteItem(list, key, id) {
  const idx = list.findIndex((i) => i.id === id);
  if (idx === -1) return;
  list.splice(idx, 1);
  saveStorage(key, list);
  render();
}

function renderStudyCard(item) {
  const li = document.createElement("li");
  li.className = "item item-clickable";
  li.dataset.id = item.id;

  li.innerHTML = `
    <div class="item-body">
      <h3 class="item-title">${escapeHtml(item.title)}</h3>
      <p class="item-meta">${escapeHtml(studyMeta(item))}</p>
      ${item.notes ? `<p class="item-notes">${escapeHtml(item.notes)}</p>` : ""}
      <span class="enter-room">Enter study room →</span>
    </div>
    <button type="button" class="btn-icon delete-btn" title="Remove session" aria-label="Remove session">×</button>
  `;

  li.addEventListener("click", (e) => {
    if (e.target.closest(".delete-btn")) return;
    window.location.href = `study-room.html?id=${encodeURIComponent(item.id)}`;
  });

  li.querySelector(".delete-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    deleteItem(studySessions, STUDY_KEY, item.id);
  });

  return li;
}

function renderResourceCard(item) {
  const li = createItemCard(
    item,
    resourceMeta(item),
    (id, done) => toggleItem(resources, RESOURCE_KEY, id, done),
    (id) => deleteItem(resources, RESOURCE_KEY, id)
  );

  if (item.link) {
    const meta = li.querySelector(".item-meta");
    meta.innerHTML = `${escapeHtml(resourceMeta(item))} · <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener" class="item-link">Open link</a>`;
  }

  if (item.notes) {
    const notes = document.createElement("p");
    notes.className = "item-notes";
    notes.textContent = item.notes;
    li.querySelector(".item-body").appendChild(notes);
  }

  return li;
}

function renderAttendance() {
  const going = getClassAttendanceList();
  attendanceList.innerHTML = "";
  attendanceEmpty.style.display = going.length === 0 ? "block" : "none";

  going.forEach((cls) => {
    const li = document.createElement("li");
    li.className = "attendance-item";
    li.innerHTML = `
      <div class="attendance-class">
        <strong>${escapeHtml(cls.title)}</strong>
        <span class="attendance-when">${escapeHtml(cls.day)} · ${escapeHtml(formatTime(cls.time))}${cls.location ? ` · ${escapeHtml(cls.location)}` : ""}</span>
      </div>
      <div class="attendance-names">${cls.attendees.map((n) => `<span class="attendee-badge">${escapeHtml(n)}</span>`).join("")}</div>
    `;
    attendanceList.appendChild(li);
  });
}

function renderList(container, emptyEl, items, renderFn) {
  container.innerHTML = "";
  emptyEl.style.display = items.length === 0 ? "block" : "none";
  items.forEach((item) => container.appendChild(renderFn(item)));
}

function updateStats() {
  document.getElementById("stat-sessions").textContent = studySessions.length;
  document.getElementById("stat-resources").textContent = resources.length;
  document.getElementById("stat-tasks").textContent = groupTasks.length;
}

function render() {
  renderAttendance();
  renderList(studyList, studyEmpty, sortByDate(studySessions, "date", "time"), renderStudyCard);
  renderList(resourceList, resourceEmpty, resources, renderResourceCard);
  renderList(groupList, groupEmpty, sortByDate(groupTasks), (item) =>
    createItemCard(
      item,
      groupMeta(item),
      (id, done) => toggleItem(groupTasks, GROUP_KEY, id, done),
      (id) => deleteItem(groupTasks, GROUP_KEY, id)
    )
  );
  updateStats();
}

render();

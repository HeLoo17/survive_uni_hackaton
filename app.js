let classes = loadStorage(CLASS_KEY);
let assignments = loadStorage(ASSIGNMENT_KEY);
let attendance = loadStorageObject(ATTENDANCE_KEY);

const weekGrid = document.getElementById("week-grid");
const classEmpty = document.getElementById("class-empty");
const assignmentList = document.getElementById("assignment-list");
const assignmentEmpty = document.getElementById("assignment-empty");
const userNameInput = document.getElementById("user-name");

const classModal = document.getElementById("class-modal");
const assignmentModal = document.getElementById("assignment-modal");
const classForm = document.getElementById("class-form");
const assignmentForm = document.getElementById("assignment-form");

userNameInput.value = localStorage.getItem(USER_NAME_KEY) || "";
userNameInput.addEventListener("input", () => {
  localStorage.setItem(USER_NAME_KEY, userNameInput.value.trim());
  renderWeekTimetable();
});

renderFormFields(document.getElementById("class-form-fields"), TRACKER_FIELDS.class);
renderFormFields(document.getElementById("assignment-form-fields"), TRACKER_FIELDS.assignment);

document.getElementById("open-class-modal").addEventListener("click", () => openModal(classModal));
document.getElementById("open-assignment-modal").addEventListener("click", () => openModal(assignmentModal));

setupModal(classModal, classForm, () => {
  const data = collectFormData(classForm, TRACKER_FIELDS.class);
  classes.push({ id: crypto.randomUUID(), ...data, createdAt: Date.now() });
  saveStorage(CLASS_KEY, classes);
  render();
});

setupModal(assignmentModal, assignmentForm, () => {
  const data = collectFormData(assignmentForm, TRACKER_FIELDS.assignment);
  assignments.push({ id: crypto.randomUUID(), ...data, done: false, createdAt: Date.now() });
  saveStorage(ASSIGNMENT_KEY, assignments);
  render();
});

function getUserName() {
  return userNameInput.value.trim() || "You";
}

function getClassAttendance(classId) {
  return attendance[classId] || [];
}

function setGoing(classId, going) {
  const name = getUserName();
  if (!attendance[classId]) attendance[classId] = [];

  const idx = attendance[classId].findIndex((a) => a.name === name);
  if (going) {
    const entry = { name, going: true, updatedAt: Date.now() };
    if (idx >= 0) attendance[classId][idx] = entry;
    else attendance[classId].push(entry);
  } else if (idx >= 0) {
    attendance[classId].splice(idx, 1);
  }

  saveStorageObject(ATTENDANCE_KEY, attendance);
  renderWeekTimetable();
}

function isUserGoing(classId) {
  const name = getUserName();
  return getClassAttendance(classId).some((a) => a.name === name && a.going);
}

function goingNames(classId) {
  return getClassAttendance(classId)
    .filter((a) => a.going)
    .map((a) => a.name)
    .join(", ");
}

function assignmentMeta(item) {
  let due = `Due ${formatDate(item.dueDate)}`;
  if (item.dueTime) due += ` at ${formatTime(item.dueTime)}`;
  return `${item.course} · ${due}`;
}

function toggleAssignment(id, done) {
  const item = assignments.find((i) => i.id === id);
  if (!item) return;
  item.done = done;
  saveStorage(ASSIGNMENT_KEY, assignments);
  renderAssignments();
}

function deleteClass(id) {
  classes = classes.filter((i) => i.id !== id);
  delete attendance[id];
  saveStorage(CLASS_KEY, classes);
  saveStorageObject(ATTENDANCE_KEY, attendance);
  render();
}

function deleteAssignment(id) {
  assignments = assignments.filter((i) => i.id !== id);
  saveStorage(ASSIGNMENT_KEY, assignments);
  render();
}

function createClassCard(item) {
  const going = isUserGoing(item.id);
  const names = goingNames(item.id);

  const card = document.createElement("div");
  card.className = "week-class-card";
  card.innerHTML = `
    <div class="week-class-top">
      <strong class="week-class-title">${escapeHtml(item.title)}</strong>
      <button type="button" class="btn-icon delete-btn" title="Remove class" aria-label="Remove class">×</button>
    </div>
    ${item.course ? `<span class="week-class-course">${escapeHtml(item.course)}</span>` : ""}
    <span class="week-class-time">${escapeHtml(formatTime(item.time))}</span>
    ${item.location ? `<span class="week-class-location">📍 ${escapeHtml(item.location)}</span>` : ""}
    ${item.notes ? `<span class="week-class-notes">${escapeHtml(item.notes)}</span>` : ""}
    <label class="going-toggle week-going" title="Let others know you're attending">
      <input type="checkbox" class="going-check" ${going ? "checked" : ""}>
      <span class="going-label">${going ? "Going ✓" : "Going?"}</span>
    </label>
    ${names ? `<span class="week-class-who">👥 ${escapeHtml(names)}</span>` : ""}
  `;

  card.querySelector(".going-check").addEventListener("change", (e) => {
    setGoing(item.id, e.target.checked);
  });

  card.querySelector(".delete-btn").addEventListener("click", () => deleteClass(item.id));
  return card;
}

function renderWeekTimetable() {
  weekGrid.innerHTML = "";

  const hasClasses = classes.length > 0;
  classEmpty.style.display = hasClasses ? "none" : "block";

  DAYS.forEach((day) => {
    const dayClasses = sortByDayTime(classes.filter((c) => c.day === day));

    const column = document.createElement("div");
    column.className = "week-day";
    column.innerHTML = `<h3 class="week-day-name">${day.slice(0, 3)}</h3>`;

    const slots = document.createElement("div");
    slots.className = "week-day-slots";

    if (dayClasses.length === 0) {
      slots.innerHTML = `<p class="week-day-empty">—</p>`;
    } else {
      dayClasses.forEach((item) => slots.appendChild(createClassCard(item)));
    }

    column.appendChild(slots);
    weekGrid.appendChild(column);
  });
}

function renderAssignments() {
  assignmentList.innerHTML = "";
  const sorted = sortByDate(assignments);
  assignmentEmpty.style.display = sorted.length === 0 ? "block" : "none";

  sorted.forEach((item) => {
    assignmentList.appendChild(
      createItemCard(
        item,
        assignmentMeta(item),
        toggleAssignment,
        (id) => deleteAssignment(id)
      )
    );
  });
}

function updateStats() {
  document.getElementById("stat-classes").textContent = classes.length;
  document.getElementById("stat-assignments").textContent = assignments.length;
}

function render() {
  renderWeekTimetable();
  renderAssignments();
  updateStats();
}

render();

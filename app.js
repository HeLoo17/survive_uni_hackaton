const CLASS_KEY = "survive-uni-classes";
const ASSIGNMENT_KEY = "survive-uni-assignments";
const ATTENDANCE_KEY = "survive-uni-attendance";
const USER_NAME_KEY = "survive-uni-user-name";

let classes = loadStorage(CLASS_KEY);
let assignments = loadStorage(ASSIGNMENT_KEY);
let attendance = loadStorageObject(ATTENDANCE_KEY);

const classTableBody = document.getElementById("class-table-body");
const classTable = document.getElementById("class-table");
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
  renderClassTable();
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
  renderClassTable();
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

function renderClassTable() {
  const sorted = sortByDayTime(classes);
  classTableBody.innerHTML = "";

  const hasClasses = sorted.length > 0;
  classTable.style.display = hasClasses ? "table" : "none";
  classEmpty.style.display = hasClasses ? "none" : "block";

  sorted.forEach((item) => {
    const tr = document.createElement("tr");
    const going = isUserGoing(item.id);
    const names = goingNames(item.id);

    tr.innerHTML = `
      <td class="cell-title">${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.course || "—")}</td>
      <td>${escapeHtml(item.day)}</td>
      <td>${escapeHtml(formatTime(item.time))}</td>
      <td>${escapeHtml(item.location || "—")}</td>
      <td class="cell-going">
        <label class="going-toggle" title="Let others know you're attending">
          <input type="checkbox" class="going-check" ${going ? "checked" : ""}>
          <span class="going-label">${going ? "Going" : "Not going"}</span>
        </label>
      </td>
      <td class="cell-who">${names ? escapeHtml(names) : '<span class="muted">—</span>'}</td>
      <td class="cell-action">
        <button type="button" class="btn-icon delete-btn" title="Remove class" aria-label="Remove class">×</button>
      </td>
    `;

    if (item.notes) {
      tr.title = item.notes;
    }

    tr.querySelector(".going-check").addEventListener("change", (e) => {
      setGoing(item.id, e.target.checked);
      tr.querySelector(".going-label").textContent = e.target.checked ? "Going" : "Not going";
    });

    tr.querySelector(".delete-btn").addEventListener("click", () => deleteClass(item.id));
    classTableBody.appendChild(tr);
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
  renderClassTable();
  renderAssignments();
  updateStats();
}

render();

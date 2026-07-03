const CLASS_KEY = "survive-uni-classes";
const ASSIGNMENT_KEY = "survive-uni-assignments";

let classes = loadStorage(CLASS_KEY);
let assignments = loadStorage(ASSIGNMENT_KEY);

const classList = document.getElementById("class-list");
const assignmentList = document.getElementById("assignment-list");
const classEmpty = document.getElementById("class-empty");
const assignmentEmpty = document.getElementById("assignment-empty");

const classModal = document.getElementById("class-modal");
const assignmentModal = document.getElementById("assignment-modal");
const classForm = document.getElementById("class-form");
const assignmentForm = document.getElementById("assignment-form");

renderFormFields(document.getElementById("class-form-fields"), TRACKER_FIELDS.class);
renderFormFields(document.getElementById("assignment-form-fields"), TRACKER_FIELDS.assignment);

document.getElementById("open-class-modal").addEventListener("click", () => openModal(classModal));
document.getElementById("open-assignment-modal").addEventListener("click", () => openModal(assignmentModal));

setupModal(classModal, classForm, () => {
  const data = collectFormData(classForm, TRACKER_FIELDS.class);
  classes.push({ id: crypto.randomUUID(), ...data, done: false, createdAt: Date.now() });
  saveStorage(CLASS_KEY, classes);
  render();
});

setupModal(assignmentModal, assignmentForm, () => {
  const data = collectFormData(assignmentForm, TRACKER_FIELDS.assignment);
  assignments.push({ id: crypto.randomUUID(), ...data, done: false, createdAt: Date.now() });
  saveStorage(ASSIGNMENT_KEY, assignments);
  render();
});

function classMeta(item) {
  const parts = [];
  if (item.course) parts.push(item.course);
  parts.push(`${item.day} · ${formatTime(item.time)}`);
  if (item.location) parts.push(item.location);
  return parts.join(" · ");
}

function assignmentMeta(item) {
  let due = `Due ${formatDate(item.dueDate)}`;
  if (item.dueTime) due += ` at ${formatTime(item.dueTime)}`;
  return `${item.course} · ${due}`;
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

function renderList(container, emptyEl, items, metaFn, listRef, storageKey) {
  container.innerHTML = "";
  emptyEl.style.display = items.length === 0 ? "block" : "none";

  items.forEach((item) => {
    container.appendChild(
      createItemCard(
        item,
        metaFn(item),
        (id, done) => toggleItem(listRef, storageKey, id, done),
        (id) => deleteItem(listRef, storageKey, id)
      )
    );
  });
}

function updateStats() {
  document.getElementById("stat-classes").textContent = classes.length;
  document.getElementById("stat-assignments").textContent = assignments.length;
  const done =
    classes.filter((i) => i.done).length + assignments.filter((i) => i.done).length;
  document.getElementById("stat-done").textContent = done;
}

function render() {
  renderList(classList, classEmpty, sortByDayTime(classes), classMeta, classes, CLASS_KEY);
  renderList(assignmentList, assignmentEmpty, sortByDate(assignments), assignmentMeta, assignments, ASSIGNMENT_KEY);
  updateStats();
}

render();

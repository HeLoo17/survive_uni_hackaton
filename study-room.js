const NOTES_KEY_PREFIX = "survive-uni-room-notes-";
const GOALS_KEY_PREFIX = "survive-uni-room-goals-";

const params = new URLSearchParams(window.location.search);
const sessionId = params.get("id");

const sessions = loadStorage(STUDY_KEY);
const session = sessions.find((s) => s.id === sessionId);

if (!session) {
  document.getElementById("room-title").textContent = "Session not found";
  document.getElementById("room-meta").textContent = "Head back to Study Squad and pick a session.";
} else {
  document.title = `Study Room — ${session.title}`;
  document.getElementById("room-title").textContent = session.title;

  const metaParts = [
    session.subject,
    `${formatDate(session.date)} · ${formatTime(session.time)}`,
    session.location,
  ];
  if (session.friends) metaParts.push(`With ${session.friends}`);
  document.getElementById("room-meta").textContent = metaParts.join(" · ");

  const info = document.getElementById("session-info");
  const rows = [
    ["Subject", session.subject],
    ["Date", formatDate(session.date)],
    ["Time", formatTime(session.time)],
    ["Location", session.location],
    ["Friends", session.friends || "—"],
    ["Notes", session.notes || "—"],
  ];
  info.innerHTML = rows
    .map(([dt, dd]) => `<dt>${escapeHtml(dt)}</dt><dd>${escapeHtml(dd)}</dd>`)
    .join("");
}

// Session notes
const notesEl = document.getElementById("session-notes");
const notesKey = NOTES_KEY_PREFIX + (sessionId || "default");
notesEl.value = localStorage.getItem(notesKey) || "";
notesEl.addEventListener("input", () => localStorage.setItem(notesKey, notesEl.value));

// Study goals
const goalsKey = GOALS_KEY_PREFIX + (sessionId || "default");
let goals = loadStorage(goalsKey);
const goalList = document.getElementById("goal-list");
const goalForm = document.getElementById("goal-form");

function renderGoals() {
  goalList.innerHTML = "";
  goals.forEach((goal) => {
    const li = document.createElement("li");
    li.className = `goal-item${goal.done ? " done" : ""}`;
    li.innerHTML = `
      <label class="goal-check">
        <input type="checkbox" ${goal.done ? "checked" : ""}>
        <span>${escapeHtml(goal.text)}</span>
      </label>
      <button type="button" class="btn-icon goal-delete" aria-label="Remove goal">×</button>
    `;
    li.querySelector("input").addEventListener("change", (e) => {
      goal.done = e.target.checked;
      saveStorage(goalsKey, goals);
      renderGoals();
    });
    li.querySelector(".goal-delete").addEventListener("click", () => {
      goals = goals.filter((g) => g.id !== goal.id);
      saveStorage(goalsKey, goals);
      renderGoals();
    });
    goalList.appendChild(li);
  });
}

goalForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("goal-input");
  const text = input.value.trim();
  if (!text) return;
  goals.push({ id: crypto.randomUUID(), text, done: false });
  saveStorage(goalsKey, goals);
  input.value = "";
  renderGoals();
});

renderGoals();

// Pomodoro
const POMODORO_FOCUS = 25 * 60;
const POMODORO_BREAK = 5 * 60;
let pomodoroSeconds = POMODORO_FOCUS;
let pomodoroInterval = null;
let pomodoroOnBreak = false;

const pomodoroDisplay = document.getElementById("pomodoro-display");
const pomodoroMode = document.getElementById("pomodoro-mode");
const pomodoroStartBtn = document.getElementById("pomodoro-start");

function formatTimer(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatStopwatch(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function updatePomodoroDisplay() {
  pomodoroDisplay.textContent = formatTimer(pomodoroSeconds);
  pomodoroMode.textContent = pomodoroOnBreak ? "Break time" : "Focus session";
}

function tickPomodoro() {
  if (pomodoroSeconds <= 0) {
    pomodoroOnBreak = !pomodoroOnBreak;
    pomodoroSeconds = pomodoroOnBreak ? POMODORO_BREAK : POMODORO_FOCUS;
    document.title = pomodoroOnBreak ? "Break time! — Study Room" : "Focus! — Study Room";
  } else {
    pomodoroSeconds--;
  }
  updatePomodoroDisplay();
}

pomodoroStartBtn.addEventListener("click", () => {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    pomodoroStartBtn.textContent = "Start";
  } else {
    pomodoroInterval = setInterval(tickPomodoro, 1000);
    pomodoroStartBtn.textContent = "Pause";
  }
});

document.getElementById("pomodoro-reset").addEventListener("click", () => {
  clearInterval(pomodoroInterval);
  pomodoroInterval = null;
  pomodoroOnBreak = false;
  pomodoroSeconds = POMODORO_FOCUS;
  pomodoroStartBtn.textContent = "Start";
  updatePomodoroDisplay();
});

updatePomodoroDisplay();

// Stopwatch
let stopwatchSeconds = 0;
let stopwatchInterval = null;
const stopwatchDisplay = document.getElementById("stopwatch-display");
const stopwatchStartBtn = document.getElementById("stopwatch-start");

stopwatchStartBtn.addEventListener("click", () => {
  if (stopwatchInterval) {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    stopwatchStartBtn.textContent = "Start";
  } else {
    stopwatchInterval = setInterval(() => {
      stopwatchSeconds++;
      stopwatchDisplay.textContent = formatStopwatch(stopwatchSeconds);
    }, 1000);
    stopwatchStartBtn.textContent = "Pause";
  }
});

document.getElementById("stopwatch-reset").addEventListener("click", () => {
  clearInterval(stopwatchInterval);
  stopwatchInterval = null;
  stopwatchSeconds = 0;
  stopwatchDisplay.textContent = "00:00:00";
  stopwatchStartBtn.textContent = "Start";
});

// Countdown
let countdownSeconds = 30 * 60;
let countdownInterval = null;
const countdownDisplay = document.getElementById("countdown-display");
const countdownStartBtn = document.getElementById("countdown-start");
const countdownMinutes = document.getElementById("countdown-minutes");

function syncCountdownFromInput() {
  countdownSeconds = parseInt(countdownMinutes.value, 10) * 60 || 1800;
  countdownDisplay.textContent = formatTimer(countdownSeconds);
}

countdownMinutes.addEventListener("change", syncCountdownFromInput);

countdownStartBtn.addEventListener("click", () => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
    countdownStartBtn.textContent = "Start";
  } else {
    if (countdownSeconds <= 0) syncCountdownFromInput();
    countdownInterval = setInterval(() => {
      if (countdownSeconds <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        countdownStartBtn.textContent = "Start";
        countdownDisplay.textContent = "Done!";
        document.title = "Time's up! — Study Room";
        return;
      }
      countdownSeconds--;
      countdownDisplay.textContent = formatTimer(countdownSeconds);
    }, 1000);
    countdownStartBtn.textContent = "Pause";
  }
});

document.getElementById("countdown-reset").addEventListener("click", () => {
  clearInterval(countdownInterval);
  countdownInterval = null;
  countdownStartBtn.textContent = "Start";
  syncCountdownFromInput();
});

syncCountdownFromInput();

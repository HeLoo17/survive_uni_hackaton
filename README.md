# Survive Uni

A multi-page web app for the Cursor mini hackathon — help students survive university life.

## How to open the app

The app is plain HTML/CSS/JS. **You must open it from the project folder** — the default GitHub `main` branch now includes all files.

### Option 1 — Local server (recommended)

```bash
git clone https://github.com/HeLoo17/survive_uni_hackaton.git
cd survive_uni_hackaton
python3 -m http.server 8080
```

Then open in your browser:

- **My Uni:** http://localhost:8080/index.html
- **Study Squad:** http://localhost:8080/social.html

### Option 2 — Open the file directly

1. Clone or download this repo
2. Open `index.html` in Chrome, Edge, or Firefox (double-click it)

> Use **Option 1** if buttons or popups do not work — some browsers restrict features when opening files directly.

### Option 3 — GitHub Pages (online)

After pushing to `main`, enable **GitHub Pages** in your repo:

1. Go to **Settings → Pages**
2. Under **Build and deployment**, set Source to **GitHub Actions**
3. The site will deploy automatically and be available at:
   `https://heloo17.github.io/survive_uni_hackaton/`

## Pages

| Page | File | Purpose |
|------|------|---------|
| **My Uni** | `index.html` | Weekly class timetable + assignments |
| **Study Squad** | `social.html` | Study sessions, resources, group tasks |
| **Study Room** | `study-room.html` | Focus tools — click a study session to enter |

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / nothing loads | Make sure you cloned the repo and `index.html` exists in the folder |
| Add class button does nothing | Hard refresh (`Ctrl+Shift+R`) or use a local server (Option 1) |
| Only see README on GitHub | Pull latest `main` — the app files are in the repo root |

## Run locally (quick)

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

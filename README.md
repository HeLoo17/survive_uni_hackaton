# Survive Uni

A two-page web app for the Cursor mini hackathon — help students survive university life.

## Pages

| Page | File | Purpose |
|------|------|---------|
| **My Uni** | `index.html` | Track classes and assignments |
| **Study Squad** | `social.html` | Plan study sessions, share resources, coordinate group tasks |

Both pages are linked via the top navigation bar and share the same visual system with different themes (academic green vs social purple).

## How it works

Each panel shows a list of items and a **+** button at the bottom. Clicking **+** opens a popup modal where you fill in the details — no permanent form cluttering the page.

### My Uni
- **Classes** — name, course code, day, time, location
- **Assignments** — title, course, due date & time

### Study Squad
- **Study sessions** — subject, date, time, location, friends
- **Shared resources** — name, subject, link, who shared it
- **Group tasks** — task, project, assigned to, due date

All items can be marked done or deleted. Data persists in your browser via `localStorage`.

## Run locally

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Hackathon requirements

| Requirement | Status |
|-------------|--------|
| Works in a web browser | Yes |
| Add items | Yes — via + popup on each panel |
| Display a list | Yes |
| Mark items as done | Yes |
| HTML/CSS/JS | Yes |
| Collaboration features | Yes — Study Squad page |

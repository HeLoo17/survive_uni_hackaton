# Survive Uni

A multi-page web app for the Cursor mini hackathon — help students survive university life.

## Pages

| Page | File | Purpose |
|------|------|---------|
| **My Uni** | `index.html` | Semester class table + assignments |
| **Study Squad** | `social.html` | Study sessions, resources, group tasks, class attendance |
| **Study Room** | `study-room.html` | Focus tools — click any study session to enter |

## Features

### My Uni
- **Semester class table** — view all classes in a table (no done checkbox; remove with × when semester ends)
- **Going? toggle** — mark yourself as attending so friends can see on Study Squad
- **Your name** — set your name so others know who's going
- **Assignments** — add, list, mark done via + popup

### Study Squad
- **Who's going to class** — shows attendance marked on My Uni
- **Study sessions** — click any session to open the **Study Room**
- **Shared resources** & **Group tasks**

### Study Room
- Pomodoro timer (25/5)
- Stopwatch
- Custom countdown timer
- Session notes (auto-saved)
- Study goals checklist
- Session details

## Run locally

```bash
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Note on attendance

Attendance is stored in your browser (`localStorage`). For a hackathon demo, friends can set different names on the same device to simulate multiple people. A real deployment would sync this via a backend.

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
- **Lab Topology:** http://localhost:8080/lab-topology.html

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
| **Lab Topology** | `lab-topology.html` | Presence-driven D3 force graph (ntopng + Proxmox) |

## Lab Topology (standalone)

`lab-topology.html` is a separate cybersecurity-lab project surface. It builds a **force-directed graph from live presence**, not a fixed always-on diagram.

### What makes a node appear / disappear

A host stays on the graph if **any** source still sees it:

| Source | How |
|--------|-----|
| ntopng traffic | `GET /lua/rest/v2/get/host/active.lua` + active flows |
| ntopng discovery | `GET /lua/rest/v2/get/network/discovery/discover.lua` |
| ntopng Active Monitoring | probed hosts (ICMP etc.) when AM endpoints respond |
| Proxmox | running QEMU/LXC via `/api2/json/cluster/resources?type=vm` |

When traffic/probes stop **and** Proxmox no longer reports `running`, the node/link exits after the grace timeout (default 30s).

Optional **Show planned topology** overlays dim catalog nodes (e.g. nodes 4–10 sketch).

Without API credentials (or when APIs fail / CORS blocks), the page loads a labeled **Demo** snapshot so you can still explore the UI.

### Configure in the Settings drawer

1. **ntopng** base URL (e.g. `http://192.168.90.x:3000`), API token, `ifid`
2. **Proxmox** base URL (e.g. `https://192.168.90.2:8006`) and token `USER@REALM!TOKENID=SECRET`
3. Click **Save & poll**

Tokens are stored only in browser `localStorage` — never commit them.

### Make silent powered-on VMs visible

1. In ntopng, add VM IPs to **Active Monitoring** (ICMP) and/or run **Network Discovery**
2. Keep **Use Proxmox** + **Show silent running VMs** enabled so guests with zero traffic still appear from power state

### CORS / proxy note

Browsers often block direct calls from `localhost` to ntopng/Proxmox. Practical options:

- Serve this page behind a same-origin reverse proxy to both APIs, or
- Host the static files on a host that can reach them and proxy `/ntop` + `/pve`

Example local proxy sketch (adjust to your lab):

```bash
# terminal A — static files
python3 -m http.server 8080

# terminal B — example with Caddy / nginx / any reverse proxy:
#   /            -> localhost:8080
#   /ntopng/     -> http://NTOPNG:3000/
#   /proxmox/    -> https://PVE:8006/
```

Then set the in-page base URLs to the proxied paths (same origin).

### Edit the known-lab catalog

Friendly names, VLAN colors, and Proxmox name maps live in [`lab-topology-data.js`](lab-topology-data.js). Presence is still driven by live APIs; the catalog only enriches known IPs/guests.

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

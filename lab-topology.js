(() => {
  const STORAGE_KEY = "lab-topology-settings-v1";
  const lab = window.LAB_TOPOLOGY;
  const vlanById = Object.fromEntries(lab.vlans.map((v) => [v.id, v]));
  const catalogById = Object.fromEntries(lab.catalog.map((c) => [c.id, c]));

  const state = {
    settings: loadSettings(),
    paused: false,
    mode: "demo",
    error: "",
    lastPollAt: null,
    selectedId: null,
    // presence tracking: id -> { lastSeen, sources, ...node }
    presence: new Map(),
    linkPresence: new Map(),
    graphNodes: [],
    graphLinks: [],
    unmapped: [],
    pollTimer: null,
  };

  const el = {
    modePill: document.getElementById("modePill"),
    modeText: document.getElementById("modeText"),
    hostCount: document.getElementById("hostCount"),
    linkCount: document.getElementById("linkCount"),
    lastPoll: document.getElementById("lastPoll"),
    vlanLegend: document.getElementById("vlanLegend"),
    detailPanel: document.getElementById("detailPanel"),
    unmappedList: document.getElementById("unmappedList"),
    ntopBaseUrl: document.getElementById("ntopBaseUrl"),
    ntopToken: document.getElementById("ntopToken"),
    ntopIfid: document.getElementById("ntopIfid"),
    pveBaseUrl: document.getElementById("pveBaseUrl"),
    pveToken: document.getElementById("pveToken"),
    pollInterval: document.getElementById("pollInterval"),
    graceTimeout: document.getElementById("graceTimeout"),
    useNtopng: document.getElementById("useNtopng"),
    useDiscovery: document.getElementById("useDiscovery"),
    useProxmox: document.getElementById("useProxmox"),
    includeSilentRunning: document.getElementById("includeSilentRunning"),
    showPlanned: document.getElementById("showPlanned"),
    forceDemo: document.getElementById("forceDemo"),
    saveSettings: document.getElementById("saveSettings"),
    pollNow: document.getElementById("pollNow"),
    pauseToggle: document.getElementById("pauseToggle"),
  };

  /* ---------------- settings ---------------- */

  function defaultSettings() {
    return {
      ntopBaseUrl: "",
      ntopToken: "",
      ntopIfid: 0,
      pveBaseUrl: "",
      pveToken: "",
      pollInterval: 10,
      graceTimeout: 30,
      useNtopng: true,
      useDiscovery: true,
      useProxmox: true,
      includeSilentRunning: true,
      showPlanned: false,
      forceDemo: false,
    };
  }

  function loadSettings() {
    try {
      return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch {
      return defaultSettings();
    }
  }

  function saveSettingsToStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.settings));
  }

  function fillSettingsForm() {
    const s = state.settings;
    el.ntopBaseUrl.value = s.ntopBaseUrl;
    el.ntopToken.value = s.ntopToken;
    el.ntopIfid.value = s.ntopIfid;
    el.pveBaseUrl.value = s.pveBaseUrl;
    el.pveToken.value = s.pveToken;
    el.pollInterval.value = s.pollInterval;
    el.graceTimeout.value = s.graceTimeout;
    el.useNtopng.checked = s.useNtopng;
    el.useDiscovery.checked = s.useDiscovery;
    el.useProxmox.checked = s.useProxmox;
    el.includeSilentRunning.checked = s.includeSilentRunning;
    el.showPlanned.checked = s.showPlanned;
    el.forceDemo.checked = s.forceDemo;
  }

  function readSettingsForm() {
    state.settings = {
      ntopBaseUrl: el.ntopBaseUrl.value.trim().replace(/\/$/, ""),
      ntopToken: el.ntopToken.value.trim(),
      ntopIfid: Number(el.ntopIfid.value) || 0,
      pveBaseUrl: el.pveBaseUrl.value.trim().replace(/\/$/, ""),
      pveToken: el.pveToken.value.trim(),
      pollInterval: Math.max(5, Number(el.pollInterval.value) || 10),
      graceTimeout: Math.max(5, Number(el.graceTimeout.value) || 30),
      useNtopng: el.useNtopng.checked,
      useDiscovery: el.useDiscovery.checked,
      useProxmox: el.useProxmox.checked,
      includeSilentRunning: el.includeSilentRunning.checked,
      showPlanned: el.showPlanned.checked,
      forceDemo: el.forceDemo.checked,
    };
  }

  /* ---------------- helpers ---------------- */

  function ipToInt(ip) {
    const parts = String(ip).split(".").map(Number);
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return null;
    return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
  }

  function cidrContains(cidr, ip) {
    if (!cidr) return false;
    const [base, bitsStr] = cidr.split("/");
    const bits = Number(bitsStr);
    const ipInt = ipToInt(ip);
    const baseInt = ipToInt(base);
    if (ipInt == null || baseInt == null || Number.isNaN(bits)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipInt & mask) === (baseInt & mask);
  }

  function vlanForIp(ip) {
    for (const v of lab.vlans) {
      if (v.cidr && cidrContains(v.cidr, ip)) return v;
    }
    return null;
  }

  function findCatalogByIp(ip) {
    return lab.catalog.find((c) => (c.ips || []).includes(ip)) || null;
  }

  function findCatalogByPve(guest) {
    const name = String(guest.name || "").toLowerCase();
    const node = String(guest.node || "").toLowerCase();
    return (
      lab.catalog.find((c) => {
        if (!c.pve) return false;
        if (c.pve.kind === "node") {
          return String(c.pve.name || "").toLowerCase() === node || String(c.pve.name || "").toLowerCase() === name;
        }
        const nameMatch = String(c.pve.name || "").toLowerCase() === name;
        const nodeMatch = !c.pve.node || String(c.pve.node).toLowerCase() === node;
        return nameMatch && nodeMatch;
      }) || null
    );
  }

  function formatBytes(n) {
    if (!n) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let v = n;
    let i = 0;
    while (v >= 1024 && i < units.length - 1) {
      v /= 1024;
      i += 1;
    }
    return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatBps(n) {
    if (!n) return "0 bps";
    if (n > 1e6) return `${(n / 1e6).toFixed(2)} Mbps`;
    if (n > 1e3) return `${(n / 1e3).toFixed(1)} Kbps`;
    return `${Math.round(n)} bps`;
  }

  /* ---------------- API clients ---------------- */

  async function ntopFetch(path, params = {}) {
    const base = state.settings.ntopBaseUrl;
    if (!base) throw new Error("ntopng base URL missing");
    const url = new URL(path, base.endsWith("/") ? base : `${base}/`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const headers = {};
    if (state.settings.ntopToken) headers.Authorization = `Token ${state.settings.ntopToken}`;
    const res = await fetch(url.toString(), { headers, credentials: "omit" });
    if (!res.ok) throw new Error(`ntopng ${res.status} ${path}`);
    return res.json();
  }

  function extractHostRows(payload) {
    const rsp = payload?.rsp ?? payload;
    const data = rsp?.data ?? rsp?.hosts ?? rsp;
    if (Array.isArray(data)) return data;
    if (Array.isArray(rsp)) return rsp;
    return [];
  }

  function normalizeHost(row) {
    const ip = row.ip || row.host || row.column_ip || row.name;
    if (!ip || typeof ip !== "string") return null;
    const bytes =
      row.bytes?.total ??
      row.bytes ??
      row.traffic ??
      (Number(row.bytes_sent || 0) + Number(row.bytes_rcvd || 0));
    const thptBps = row.thpt?.bps ?? row.throughput_bps ?? row.throughput ?? 0;
    return {
      ip,
      name: row.name && row.name !== 0 ? String(row.name) : ip,
      bytes: Number(bytes) || 0,
      thptBps: Number(thptBps) || 0,
      vlan: Number(row.vlan ?? row.vlan_id ?? 0) || 0,
      alerts: Number(row.num_alerts || 0) || 0,
    };
  }

  function extractFlowRows(payload) {
    const rsp = payload?.rsp ?? payload;
    const data = rsp?.data ?? rsp?.flows ?? rsp;
    if (Array.isArray(data)) return data;
    return [];
  }

  function normalizeFlow(row) {
    const src =
      row.client ||
      row.src ||
      row.column_client ||
      row.IPV4_SRC_ADDR ||
      row["cli.ip"] ||
      row.cli_ip;
    const dst =
      row.server ||
      row.dst ||
      row.column_server ||
      row.IPV4_DST_ADDR ||
      row["srv.ip"] ||
      row.srv_ip;
    const srcIp = typeof src === "object" ? src.ip || src.host : src;
    const dstIp = typeof dst === "object" ? dst.ip || dst.host : dst;
    if (!srcIp || !dstIp) return null;
    const bytes =
      row.bytes?.total ??
      row.bytes ??
      row.TOTAL_BYTES ??
      (Number(row.bytes_sent || 0) + Number(row.bytes_rcvd || 0));
    return { src: String(srcIp), dst: String(dstIp), bytes: Number(bytes) || 0 };
  }

  function extractDiscoveredIps(payload) {
    const rsp = payload?.rsp ?? payload;
    const list = rsp?.devices || rsp?.hosts || rsp?.data || rsp || [];
    const ips = new Set();
    const walk = (item) => {
      if (!item) return;
      if (typeof item === "string" && item.includes(".")) ips.add(item);
      if (typeof item === "object") {
        ["ip", "host", "ipv4", "address"].forEach((k) => {
          if (typeof item[k] === "string" && item[k].includes(".")) ips.add(item[k]);
        });
        Object.values(item).forEach((v) => {
          if (Array.isArray(v)) v.forEach(walk);
          else if (v && typeof v === "object") walk(v);
        });
      }
    };
    if (Array.isArray(list)) list.forEach(walk);
    else walk(list);
    return [...ips];
  }

  async function fetchNtopngPresence() {
    const ifid = state.settings.ntopIfid;
    const hostsPayload = await ntopFetch("/lua/rest/v2/get/host/active.lua", {
      ifid,
      perPage: 1000,
      currentPage: 1,
    });
    const hosts = extractHostRows(hostsPayload).map(normalizeHost).filter(Boolean);

    let flows = [];
    try {
      const flowsPayload = await ntopFetch("/lua/rest/v2/get/flow/active.lua", {
        ifid,
        perPage: 1000,
        currentPage: 1,
      });
      flows = extractFlowRows(flowsPayload).map(normalizeFlow).filter(Boolean);
    } catch {
      flows = [];
    }

    let discovered = [];
    if (state.settings.useDiscovery) {
      try {
        const discPayload = await ntopFetch("/lua/rest/v2/get/network/discovery/discover.lua", {
          ifid,
        });
        discovered = extractDiscoveredIps(discPayload);
      } catch {
        discovered = [];
      }
    }

    // Active Monitoring: try common Community endpoints; ignore failures.
    let probed = [];
    const amPaths = [
      "/lua/rest/v2/get/am_host/list.lua",
      "/lua/rest/v2/get/active_monitoring/hosts.lua",
      "/lua/rest/v2/get/am_host/active.lua",
    ];
    for (const path of amPaths) {
      try {
        const amPayload = await ntopFetch(path, { ifid });
        const rows = extractHostRows(amPayload);
        probed = rows
          .map((r) => r.ip || r.host || r.target || r.am_host)
          .filter((v) => typeof v === "string" && v.includes("."));
        if (probed.length) break;
      } catch {
        /* try next */
      }
    }

    return { hosts, flows, discovered, probed };
  }

  async function fetchProxmoxPresence() {
    const base = state.settings.pveBaseUrl;
    const token = state.settings.pveToken;
    if (!base || !token) throw new Error("Proxmox URL/token missing");
    const url = `${base}/api2/json/cluster/resources?type=vm`;
    const res = await fetch(url, {
      headers: {
        Authorization: `PVEAPIToken=${token}`,
      },
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`Proxmox ${res.status}`);
    const json = await res.json();
    const rows = Array.isArray(json.data) ? json.data : [];
    return rows
      .filter((r) => r.status === "running")
      .map((r) => ({
        vmid: r.vmid,
        name: r.name || String(r.vmid),
        node: r.node,
        type: r.type,
        status: r.status,
      }));
  }

  /* ---------------- presence merge ---------------- */

  function touchNode(map, id, patch, now) {
    const prev = map.get(id) || {
      id,
      sources: {},
      lastSeen: now,
      ips: new Set(),
      bytes: 0,
      thptBps: 0,
      alerts: 0,
    };
    const sources = { ...prev.sources, ...patch.sources };
    const ips = new Set(prev.ips);
    (patch.ips || []).forEach((ip) => ips.add(ip));
    map.set(id, {
      ...prev,
      ...patch,
      sources,
      ips,
      lastSeen: now,
      bytes: Math.max(prev.bytes || 0, patch.bytes || 0),
      thptBps: Math.max(prev.thptBps || 0, patch.thptBps || 0),
      alerts: Math.max(prev.alerts || 0, patch.alerts || 0),
    });
  }

  function touchLink(map, key, patch, now) {
    const prev = map.get(key) || { key, lastSeen: now, bytes: 0, kind: patch.kind };
    map.set(key, {
      ...prev,
      ...patch,
      lastSeen: now,
      bytes: Math.max(prev.bytes || 0, patch.bytes || 0),
    });
  }

  function ensureParentChain(seenIds, catalogEntry) {
    let cur = catalogEntry;
    while (cur?.parent) {
      seenIds.add(cur.parent);
      cur = catalogById[cur.parent];
    }
  }

  function mergePresence(snapshot, isDemo) {
    const now = Date.now();
    const graceMs = state.settings.graceTimeout * 1000;
    const nodeTouch = new Map();
    const linkTouch = new Map();
    const ipToNodeId = new Map();
    const unmapped = [];

    const registerIpNode = (ip, extras = {}) => {
      const cat = findCatalogByIp(ip);
      const vlan = vlanById[cat?.vlan] || vlanForIp(ip);
      const id = cat?.id || `ip:${ip}`;
      ipToNodeId.set(ip, id);
      touchNode(
        nodeTouch,
        id,
        {
          label: cat?.label || extras.name || ip,
          role: cat?.role || "host",
          zone: cat?.zone || (vlan?.id === "wan" ? "wan" : "lan"),
          vlan: cat?.vlan || vlan?.id || null,
          color: vlan?.color || "#8fa3b5",
          catalogStatus: cat?.status || "known",
          parent: cat?.parent || null,
          meta: cat?.meta || "",
          ips: [ip],
          bytes: extras.bytes || 0,
          thptBps: extras.thptBps || 0,
          alerts: extras.alerts || 0,
          sources: extras.sources || {},
        },
        now
      );
      if (cat) ensureParentChain(new Set([id]), cat);
      return id;
    };

    // Traffic hosts
    for (const h of snapshot.hosts || []) {
      const id = registerIpNode(h.ip, {
        name: h.name,
        bytes: h.bytes,
        thptBps: h.thptBps,
        alerts: h.alerts,
        sources: { traffic: true },
      });
      if (!findCatalogByIp(h.ip)) unmapped.push(h.ip);
      // re-touch sources only
      touchNode(nodeTouch, id, { sources: { traffic: true }, ips: [h.ip] }, now);
    }

    // Discovered
    for (const ip of snapshot.discovered || []) {
      const id = registerIpNode(ip, { sources: { discovered: true } });
      touchNode(nodeTouch, id, { sources: { discovered: true }, ips: [ip] }, now);
    }

    // Probed (AM)
    for (const ip of snapshot.probed || []) {
      const id = registerIpNode(ip, { sources: { probed: true } });
      touchNode(nodeTouch, id, { sources: { probed: true }, ips: [ip] }, now);
    }

    // Proxmox running guests
    for (const guest of snapshot.proxmox || []) {
      const cat = findCatalogByPve(guest);
      const id = cat?.id || `pve:${guest.node}:${guest.vmid || guest.name}`;
      const vlan = vlanById[cat?.vlan] || null;
      const sources = { running: true };
      const silentOnly = !nodeTouch.has(id) && !(cat?.ips || []).some((ip) => ipToNodeId.has(ip));
      if (silentOnly && !state.settings.includeSilentRunning) continue;

      touchNode(
        nodeTouch,
        id,
        {
          label: cat?.label || guest.name,
          role: cat?.role || guest.type || "vm",
          zone: cat?.zone || "lan",
          vlan: cat?.vlan || null,
          color: vlan?.color || "#c084fc",
          catalogStatus: cat?.status || "known",
          parent: cat?.parent || null,
          meta: cat?.meta || `Proxmox ${guest.type} on ${guest.node}`,
          pve: guest,
          ips: cat?.ips || [],
          sources,
        },
        now
      );

      // Parent edge to hypervisor/catalog parent
      const parentId =
        cat?.parent ||
        lab.catalog.find(
          (c) => c.pve?.kind === "node" && String(c.pve.name).toLowerCase() === String(guest.node).toLowerCase()
        )?.id;
      if (parentId) {
        touchNode(
          nodeTouch,
          parentId,
          {
            label: catalogById[parentId]?.label || parentId,
            role: catalogById[parentId]?.role || "hypervisor",
            zone: catalogById[parentId]?.zone || "lan",
            vlan: catalogById[parentId]?.vlan || "vlan90",
            color: vlanById[catalogById[parentId]?.vlan]?.color || "#3dd6c6",
            catalogStatus: catalogById[parentId]?.status || "known",
            sources: { running: true },
            ips: catalogById[parentId]?.ips || [],
          },
          now
        );
        const key = [parentId, id].sort().join("|");
        touchLink(linkTouch, key, { source: parentId, target: id, kind: "parent", bytes: 0 }, now);
      }
    }

    // Ensure parent chain nodes for any catalog-backed live nodes
    for (const node of [...nodeTouch.values()]) {
      let cur = catalogById[node.id];
      while (cur?.parent) {
        const parent = catalogById[cur.parent];
        if (!parent) break;
        if (!nodeTouch.has(parent.id)) {
          touchNode(
            nodeTouch,
            parent.id,
            {
              label: parent.label,
              role: parent.role,
              zone: parent.zone,
              vlan: parent.vlan,
              color: vlanById[parent.vlan]?.color || "#8fa3b5",
              catalogStatus: parent.status,
              parent: parent.parent || null,
              meta: parent.meta || "",
              sources: { structural: true },
              ips: parent.ips || [],
            },
            now
          );
        }
        const key = [parent.id, cur.id].sort().join("|");
        if (!linkTouch.has(key)) {
          touchLink(linkTouch, key, { source: parent.id, target: cur.id, kind: "parent", bytes: 0 }, now);
        }
        cur = parent;
      }
    }

    // Flows → links between mapped endpoints
    for (const f of snapshot.flows || []) {
      const sId = ipToNodeId.get(f.src) || (findCatalogByIp(f.src)?.id ?? null);
      const dId = ipToNodeId.get(f.dst) || (findCatalogByIp(f.dst)?.id ?? null);
      if (!sId || !dId || sId === dId) continue;
      if (!nodeTouch.has(sId)) registerIpNode(f.src, { sources: { traffic: true } });
      if (!nodeTouch.has(dId)) registerIpNode(f.dst, { sources: { traffic: true } });
      const key = [sId, dId].sort().join("|");
      touchLink(linkTouch, key, { source: sId, target: dId, kind: "flow", bytes: f.bytes }, now);
    }

    // Merge into persistent presence maps with grace
    for (const [id, node] of nodeTouch) {
      const prev = state.presence.get(id);
      state.presence.set(id, {
        ...node,
        ips: new Set([...(prev?.ips || []), ...node.ips]),
        sources: { ...(prev?.sources || {}), ...node.sources },
        lastSeen: now,
      });
    }
    for (const [key, link] of linkTouch) {
      state.linkPresence.set(key, { ...link, lastSeen: now });
    }

    // Expire stale
    for (const [id, node] of state.presence) {
      if (now - node.lastSeen > graceMs) state.presence.delete(id);
    }
    for (const [key, link] of state.linkPresence) {
      if (now - link.lastSeen > graceMs) state.linkPresence.delete(key);
    }

    // Planned overlay
    if (state.settings.showPlanned) {
      for (const c of lab.catalog) {
        if (state.presence.has(c.id)) continue;
        state.presence.set(c.id, {
          id: c.id,
          label: c.label,
          role: c.role,
          zone: c.zone,
          vlan: c.vlan,
          color: vlanById[c.vlan]?.color || "#8fa3b5",
          catalogStatus: c.status,
          parent: c.parent || null,
          meta: c.meta || "",
          ips: new Set(c.ips || []),
          sources: { planned: true },
          lastSeen: now,
          bytes: 0,
          thptBps: 0,
          alerts: 0,
          planned: true,
        });
      }
      for (const l of lab.plannedLinks) {
        if (!state.presence.has(l.source) || !state.presence.has(l.target)) continue;
        const key = [l.source, l.target].sort().join("|");
        if (!state.linkPresence.has(key)) {
          state.linkPresence.set(key, {
            key,
            source: l.source,
            target: l.target,
            kind: "planned",
            bytes: 0,
            lastSeen: now,
          });
        }
      }
    } else {
      // Drop planned-only nodes/links
      for (const [id, node] of state.presence) {
        const src = node.sources || {};
        const live = src.traffic || src.probed || src.discovered || src.running || src.structural;
        if (!live && src.planned) state.presence.delete(id);
      }
      for (const [key, link] of state.linkPresence) {
        if (link.kind === "planned") {
          const a = state.presence.get(typeof link.source === "object" ? link.source.id : link.source);
          const b = state.presence.get(typeof link.target === "object" ? link.target.id : link.target);
          if (!a || !b) state.linkPresence.delete(key);
        }
      }
    }

    state.graphNodes = [...state.presence.values()].map((n) => ({
      ...n,
      ips: [...n.ips],
      planned: Boolean(n.sources?.planned && !n.sources?.traffic && !n.sources?.running && !n.sources?.probed && !n.sources?.discovered),
    }));
    state.graphLinks = [...state.linkPresence.values()]
      .filter((l) => {
        const s = typeof l.source === "object" ? l.source.id : l.source;
        const t = typeof l.target === "object" ? l.target.id : l.target;
        return state.presence.has(s) && state.presence.has(t);
      })
      .map((l) => ({
        ...l,
        source: typeof l.source === "object" ? l.source.id : l.source,
        target: typeof l.target === "object" ? l.target.id : l.target,
      }));

    state.unmapped = [...new Set(unmapped)].sort();
    state.mode = isDemo ? "demo" : "live";
    state.lastPollAt = now;
    updateChrome();
    renderDetails();
    updateGraph();
  }

  /* ---------------- D3 graph ---------------- */

  const svg = d3.select("#graph");
  const gRoot = svg.append("g").attr("class", "viewport");
  const gLinks = gRoot.append("g").attr("class", "links");
  const gNodes = gRoot.append("g").attr("class", "nodes");

  let width = window.innerWidth;
  let height = window.innerHeight;

  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance((d) => (d.kind === "flow" ? 90 : 120))
        .strength(0.45)
    )
    .force("charge", d3.forceManyBody().strength(-280))
    .force("collide", d3.forceCollide().radius((d) => nodeRadius(d) + 8))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY().y((d) => zoneY(d)).strength(0.08));

  svg.call(
    d3
      .zoom()
      .scaleExtent([0.35, 3])
      .on("zoom", (event) => {
        gRoot.attr("transform", event.transform);
      })
  );

  function zoneY(d) {
    if (d.zone === "wan") return height * 0.28;
    if (d.zone === "core") return height * 0.45;
    return height * 0.68;
  }

  function nodeRadius(d) {
    const base = d.role === "switch" || d.role === "hypervisor" ? 16 : d.role === "cloud" ? 18 : 11;
    const boost = Math.min(10, Math.log10((d.bytes || 1) + 1) * 2);
    return base + boost;
  }

  function drag(sim) {
    function dragstarted(event, d) {
      if (!event.active) sim.alphaTarget(0.25).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    function dragended(event, d) {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
  }

  function updateGraph() {
    const nodes = state.graphNodes;
    const links = state.graphLinks;

    // Preserve positions
    const prevPos = new Map(simulation.nodes().map((n) => [n.id, n]));
    nodes.forEach((n) => {
      const p = prevPos.get(n.id);
      if (p) {
        n.x = p.x;
        n.y = p.y;
        n.vx = p.vx;
        n.vy = p.vy;
      }
    });

    const linkSel = gLinks.selectAll("line").data(links, (d) => d.key || `${d.source}-${d.target}`);
    linkSel.exit().transition().duration(250).attr("stroke-opacity", 0).remove();
    const linkEnter = linkSel.enter().append("line").attr("class", "link-line").attr("stroke-opacity", 0);
    const linkMerge = linkEnter.merge(linkSel);
    linkMerge
      .attr("class", (d) => `link-line ${d.kind || "flow"}`)
      .attr("stroke-width", (d) => {
        if (d.kind === "flow") return Math.max(1.2, Math.min(8, Math.log10((d.bytes || 1) + 1) * 1.8));
        return d.kind === "parent" ? 1.4 : 1.1;
      })
      .transition()
      .duration(250)
      .attr("stroke-opacity", 0.9);

    const nodeSel = gNodes.selectAll("g.node").data(nodes, (d) => d.id);
    nodeSel.exit().transition().duration(250).style("opacity", 0).remove();

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .style("opacity", 0)
      .call(drag(simulation))
      .on("click", (event, d) => {
        event.stopPropagation();
        state.selectedId = d.id;
        renderDetails();
        gNodes.selectAll("circle").classed("selected", (n) => n.id === d.id);
      });

    nodeEnter.append("circle").attr("class", "node-circle");
    nodeEnter
      .append("text")
      .attr("class", "node-label")
      .attr("dy", (d) => nodeRadius(d) + 12)
      .attr("text-anchor", "middle");

    const nodeMerge = nodeEnter.merge(nodeSel);
    nodeMerge.transition().duration(250).style("opacity", 1);
    nodeMerge
      .select("circle")
      .attr("r", (d) => nodeRadius(d))
      .attr("fill", (d) => d.color || "#8fa3b5")
      .attr("class", (d) => `node-circle${d.planned ? " planned" : ""}${state.selectedId === d.id ? " selected" : ""}`);
    nodeMerge.select("text").text((d) => d.label);

    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.force("x", d3.forceX(width / 2).strength(0.05));
    simulation.force("y", d3.forceY().y((d) => zoneY(d)).strength(0.08));
    simulation.alpha(0.55).restart();

    simulation.on("tick", () => {
      linkMerge
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      nodeMerge.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    el.hostCount.textContent = String(nodes.filter((n) => !n.planned).length || nodes.length);
    el.linkCount.textContent = String(links.length);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    simulation.force("center", d3.forceCenter(width / 2, height / 2));
    simulation.alpha(0.2).restart();
  }

  /* ---------------- UI ---------------- */

  function renderVlanLegend() {
    el.vlanLegend.innerHTML = lab.vlans
      .map(
        (v) =>
          `<li><span class="swatch" style="background:${v.color}"></span><span>${v.label}${
            v.cidr ? ` · ${v.cidr}` : ""
          }</span></li>`
      )
      .join("");
  }

  function updateChrome() {
    el.modePill.classList.remove("live", "demo", "error");
    if (state.error && state.mode !== "demo") {
      el.modePill.classList.add("error");
      el.modeText.textContent = "Error";
    } else if (state.mode === "live") {
      el.modePill.classList.add("live");
      el.modeText.textContent = "Live";
    } else {
      el.modePill.classList.add("demo");
      el.modeText.textContent = "Demo";
    }
    el.lastPoll.textContent = state.lastPollAt
      ? `Polled ${new Date(state.lastPollAt).toLocaleTimeString()}`
      : "Never polled";
    if (state.error) {
      el.lastPoll.title = state.error;
    }
  }

  function renderDetails() {
    el.unmappedList.innerHTML =
      state.unmapped.length === 0
        ? "<li>None yet</li>"
        : state.unmapped.map((ip) => `<li>${ip}</li>`).join("");

    const node = state.graphNodes.find((n) => n.id === state.selectedId);
    if (!node) {
      el.detailPanel.className = "detail-empty";
      el.detailPanel.textContent =
        "Click a node to inspect IPs, VLAN, throughput, and which presence sources mark it live.";
      return;
    }

    const sources = node.sources || {};
    const badges = [
      sources.traffic ? '<span class="badge traffic">traffic</span>' : "",
      sources.probed ? '<span class="badge probed">probed</span>' : "",
      sources.discovered ? '<span class="badge discovered">discovered</span>' : "",
      sources.running ? '<span class="badge running">running</span>' : "",
      node.planned ? '<span class="badge planned">planned</span>' : "",
    ].join("");

    el.detailPanel.className = "detail-block";
    el.detailPanel.innerHTML = `
      <h3>${node.label}</h3>
      <div class="meta">${node.role || "host"}${node.vlan ? ` · ${node.vlan}` : ""}</div>
      <div class="badge-row">${badges || '<span class="badge">no source flags</span>'}</div>
      <dl class="kv">
        <div><dt>IPs</dt><dd>${(node.ips || []).join(", ") || "—"}</dd></div>
        <div><dt>Bytes</dt><dd>${formatBytes(node.bytes)}</dd></div>
        <div><dt>Throughput</dt><dd>${formatBps(node.thptBps)}</dd></div>
        <div><dt>Alerts</dt><dd>${node.alerts || 0}</dd></div>
        <div><dt>Proxmox</dt><dd>${
          node.pve ? `${node.pve.type || ""} ${node.pve.name} @ ${node.pve.node}` : "—"
        }</dd></div>
      </dl>
      ${node.meta ? `<p class="detail-empty" style="margin-top:0.8rem">${node.meta}</p>` : ""}
    `;
  }

  /* ---------------- poll loop ---------------- */

  async function pollOnce() {
    if (state.paused) return;

    const s = state.settings;
    const wantLive =
      !s.forceDemo &&
      ((s.useNtopng && s.ntopBaseUrl) || (s.useProxmox && s.pveBaseUrl && s.pveToken));

    if (!wantLive) {
      state.error = "";
      mergePresence(lab.demoSnapshot, true);
      return;
    }

    const snapshot = {
      hosts: [],
      flows: [],
      discovered: [],
      probed: [],
      proxmox: [],
    };
    const errors = [];

    if (s.useNtopng && s.ntopBaseUrl) {
      try {
        const ntop = await fetchNtopngPresence();
        snapshot.hosts = ntop.hosts;
        snapshot.flows = ntop.flows;
        snapshot.discovered = ntop.discovered;
        snapshot.probed = ntop.probed;
      } catch (err) {
        errors.push(`ntopng: ${err.message}`);
      }
    }

    if (s.useProxmox && s.pveBaseUrl && s.pveToken) {
      try {
        snapshot.proxmox = await fetchProxmoxPresence();
      } catch (err) {
        errors.push(`Proxmox: ${err.message}`);
      }
    }

    const gotSomething =
      snapshot.hosts.length ||
      snapshot.flows.length ||
      snapshot.discovered.length ||
      snapshot.probed.length ||
      snapshot.proxmox.length;

    if (!gotSomething) {
      state.error = errors.join(" · ") || "No live data (CORS, auth, or empty interfaces?)";
      // Fall back to demo so the page stays useful
      mergePresence(lab.demoSnapshot, true);
      updateChrome();
      return;
    }

    state.error = errors.join(" · ");
    mergePresence(snapshot, false);
  }

  function restartTimer() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = setInterval(pollOnce, state.settings.pollInterval * 1000);
  }

  /* ---------------- wire UI ---------------- */

  document.querySelectorAll(".drawer-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".drawer-tabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.getElementById("tab-settings").hidden = tab !== "settings";
      document.getElementById("tab-details").hidden = tab !== "details";
    });
  });

  el.saveSettings.addEventListener("click", async () => {
    readSettingsForm();
    saveSettingsToStore();
    restartTimer();
    await pollOnce();
  });

  el.pollNow.addEventListener("click", () => {
    readSettingsForm();
    pollOnce();
  });

  el.pauseToggle.addEventListener("click", () => {
    state.paused = !state.paused;
    el.pauseToggle.textContent = state.paused ? "Resume" : "Pause";
  });

  [
    el.showPlanned,
    el.includeSilentRunning,
    el.forceDemo,
    el.useNtopng,
    el.useDiscovery,
    el.useProxmox,
  ].forEach((input) => {
    input.addEventListener("change", () => {
      readSettingsForm();
      saveSettingsToStore();
      pollOnce();
    });
  });

  svg.on("click", () => {
    state.selectedId = null;
    gNodes.selectAll("circle").classed("selected", false);
    renderDetails();
  });

  window.addEventListener("resize", resize);

  // boot
  fillSettingsForm();
  renderVlanLegend();
  resize();
  pollOnce();
  restartTimer();
})();

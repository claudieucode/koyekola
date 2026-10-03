// Espace de travail SEO de l'éditeur d'articles (permanent, indépendant du Mode Fun).
// Chaque panneau de l'onglet SEO devient un élément déplaçable : ancré à droite (barre latérale), à gauche, en bas,
// en fenêtre flottante, regroupé en onglets, réduit, agrandi, fermé, rouvert. La disposition est enregistrée sur le
// compte (serveur) et restaurée à l'ouverture. Les panneaux sont DÉPLACÉS dans la page (jamais recopiés) : leurs champs
// restent dans le formulaire de l'article et tous les comportements existants continuent de fonctionner.
// Aucune logique SEO ici : ce module ne s'occupe que de la place des panneaux.

const DOCKS = ["right", "left", "bottom"];
const LIMITS = { left: [220, 560], right: [260, 560], bottom: [140, 0.6], floatW: [240, 900], floatH: [140, 900] };
const ICONS = {
  score: "M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 0v8h8a8 8 0 0 0-8-8Z",
  reco: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2Z",
  "seo-site": "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15 15 0 0 0-1.4-4 8 8 0 0 1 4.4 4ZM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4ZM4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4H4.3Zm.8 2h3a15 15 0 0 0 1.4 4 8 8 0 0 1-4.4-4ZM8 8H5a8 8 0 0 1 4.4-4A15 15 0 0 0 8 8Zm4 12c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4Zm2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4Zm.3 5.6a15 15 0 0 0 1.4-4h3a8 8 0 0 1-4.4 4Zm1.7-5.6a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4h-3.4Z",
  keyword: "M7 14a3 3 0 1 1 2.8-4H21v3h-2v2h-3v-2H9.8A3 3 0 0 1 7 14Zm0-2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  google: "M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5Zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z",
  analysis: "M4 5h16v2H4V5Zm0 4h10v2H4V9Zm0 4h16v2H4v-2Zm0 4h10v2H4v-2Z",
  social: "M18 16a3 3 0 0 0-2.1.8L8.9 12.7a3 3 0 0 0 0-1.4l7-4A3 3 0 1 0 15 5l-7 4a3 3 0 1 0 0 6l7.1 4.1A3 3 0 1 0 18 16Z",
  structure: "M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v4h-8V3Zm0 6h8v12h-8V9Zm2 2v8h4v-8h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Z",
  links: "M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0ZM7 17a3 3 0 0 1 0-4.2l2-2 1.4 1.4-2 2a1 1 0 1 0 1.4 1.4l2-2 1.4 1.4-2 2A3 3 0 0 1 7 17Zm10-10a3 3 0 0 1 0 4.2l-2 2-1.4-1.4 2-2a1 1 0 0 0-1.4-1.4l-2 2-1.4-1.4 2-2A3 3 0 0 1 17 7Z",
  indexing: "M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  "seo-history": "M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2.1 5l-1.4 1.4A9 9 0 1 0 13 3Zm-1 5v5l4.3 2.5.7-1.2-3.5-2.1V8H12Z",
  opportunities: "M12 2 9.2 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.2-.6L12 2Z",
  technical: "M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.3 7.3 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5-2.3-1.6ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z",
  images: "M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5Z",
  performance: "M12 4a9 9 0 0 0-8 13h2.3A7 7 0 1 1 19 12a7 7 0 0 1-1.3 5H20a9 9 0 0 0-8-13Zm4.2 3.8-5.5 4.4a1.5 1.5 0 1 0 2 2.1l3.5-6.5Z",
  gsc: "M3 13h2v7H3v-7Zm4-4h2v11H7V9Zm4-4h2v15h-2V5Zm4 6h2v9h-2v-9Zm4-3h2v12h-2V8Z",
  external: "M10 6v2H5v11h11v-5h2v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6Zm11-3v8h-2V6.4l-7.8 7.8-1.4-1.4L17.6 5H13V3h8Z",
};
const DRAG_THRESHOLD = 6;
const el = (tag, attrs = {}, ...children) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
};
const svgIcon = (d) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("width", "16"); s.setAttribute("height", "16"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d); p.setAttribute("fill", "currentColor"); s.append(p); return s; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clone = (o) => JSON.parse(JSON.stringify(o));

export function createWorkspace({ root, api, initial, openPanel, isPanelOpen, showSeoTab, isSidebarOpen, openSidebar, onVisibilityChange, confirmDialog, toast }) {
  const layoutEl = root.querySelector(".wp-layout");
  const docks = { right: root.querySelector('[data-dock="right"]'), left: root.querySelector('[data-dock="left"]'), bottom: root.querySelector('[data-dock="bottom"]') };
  const floatsEl = root.querySelector("[data-wsp-floats]");
  const parking = root.querySelector("[data-wsp-parking]");
  const panels = new Map();
  [...docks.right.querySelectorAll(":scope > .wp-panel[data-panel]")].forEach((p, i) => {
    const btn = p.querySelector("[data-panel-toggle]");
    const title = btn ? btn.childNodes[0].textContent.trim() : p.dataset.panel;
    panels.set(p.dataset.panel, { key: p.dataset.panel, el: p, title, index: i });
  });
  const KEYS = [...panels.keys()];
  const compactQuery = window.matchMedia("(max-width: 1100px)");
  let state = null;
  let focusBackup = null;
  let saveTimer = null;
  const listeners = new Set();

  // ---------- Dispositions ----------
  const defaultLayout = () => ({
    v: 1,
    right: { groups: KEYS.map((k) => ({ panels: [k], active: k })) },
    left: { w: 320, groups: [] }, bottom: { h: 260, groups: [] }, floats: [],
    minimized: KEYS.filter((k) => !panels.get(k).el.classList.contains("is-open-default")), closed: [],
  });
  // Panneaux ouverts par défaut dans la page (avant toute action) : mémorisés une fois
  for (const p of panels.values()) if (p.el.classList.contains("is-open")) p.el.classList.add("is-open-default");
  const G = (...keys) => ({ panels: keys.filter((k) => panels.has(k)), active: keys.find((k) => panels.has(k)) });
  const PRESETS = {
    redaction: { label: "Rédaction", build: () => ({ v: 1, right: { groups: [G("score"), G("reco"), G("google"), G("keyword"), G("analysis")] }, left: { w: 320, groups: [] }, bottom: { h: 260, groups: [] }, floats: [], minimized: ["analysis"], closed: KEYS.filter((k) => !["score", "reco", "google", "keyword", "analysis"].includes(k)) }) },
    technique: { label: "Technique", build: () => ({ v: 1, right: { groups: [G("technical"), G("indexing"), G("structure")] }, left: { w: 320, groups: [] }, bottom: { h: 280, groups: [G("seo-site", "performance", "images")] }, floats: [], minimized: [], closed: KEYS.filter((k) => !["technical", "indexing", "structure", "seo-site", "performance", "images"].includes(k)) }) },
    analyse: { label: "Analyse", build: () => ({ v: 1, right: { groups: [G("keyword"), G("opportunities")] }, left: { w: 340, groups: [G("gsc", "performance", "external")] }, bottom: { h: 260, groups: [] }, floats: [], minimized: [], closed: KEYS.filter((k) => !["keyword", "opportunities", "gsc", "performance", "external"].includes(k)) }) },
    complet: { label: "SEO complet", build: () => ({ v: 1, right: { groups: [G("score"), G("reco"), G("google"), G("keyword"), G("analysis"), G("social"), G("links"), G("indexing")] }, left: { w: 330, groups: [G("opportunities"), G("technical"), G("structure"), G("images")] }, bottom: { h: 260, groups: [G("gsc", "performance", "external", "seo-site", "seo-history")] }, floats: [], minimized: ["analysis", "social", "links", "indexing", "structure", "images"], closed: [] }) },
    defaut: { label: "Par défaut", build: defaultLayout },
  };

  // Normalise une disposition : chaque panneau connu apparaît une seule fois (sinon ajouté à droite, réduit)
  function normalize(l) {
    const out = { v: 1, right: { w: l && l.right && l.right.w, groups: [] }, left: { w: (l && l.left && l.left.w) || 320, groups: [] }, bottom: { h: (l && l.bottom && l.bottom.h) || 260, groups: [] }, floats: [], minimized: [], closed: [] };
    const seen = new Set();
    const take = (g) => { const ks = (g && g.panels || []).filter((k) => panels.has(k) && !seen.has(k)); ks.forEach((k) => seen.add(k)); return ks.length ? { panels: ks, active: ks.includes(g.active) ? g.active : ks[0] } : null; };
    for (const d of DOCKS) for (const g of (l && l[d] && l[d].groups) || []) { const t = take(g); if (t) out[d].groups.push(t); }
    for (const f of (l && l.floats) || []) { const t = take(f); if (t) out.floats.push({ ...t, x: f.x || 40, y: f.y || 40, w: f.w || 340, h: f.h || 360 }); }
    for (const k of (l && l.closed) || []) if (panels.has(k) && !seen.has(k)) { seen.add(k); out.closed.push(k); }
    for (const k of KEYS) if (!seen.has(k)) { out.right.groups.push({ panels: [k], active: k }); out.minimized.push(k); }
    out.minimized = [...new Set([...out.minimized, ...((l && l.minimized) || []).filter((k) => panels.has(k))])];
    return out;
  }
  const isCompact = () => compactQuery.matches;
  const locate = (key) => {
    for (const d of DOCKS) for (const g of state[d].groups) if (g.panels.includes(key)) return { where: d, group: g };
    for (const f of state.floats) if (f.panels.includes(key)) return { where: "float", group: f };
    return state.closed.includes(key) ? { where: "closed" } : null;
  };
  const removeFromLayout = (key) => {
    for (const d of DOCKS) state[d].groups = state[d].groups.map((g) => ({ ...g, panels: g.panels.filter((k) => k !== key) })).filter((g) => g.panels.length).map((g) => ({ ...g, active: g.panels.includes(g.active) ? g.active : g.panels[0] }));
    state.floats = state.floats.map((g) => ({ ...g, panels: g.panels.filter((k) => k !== key) })).filter((g) => g.panels.length).map((g) => ({ ...g, active: g.panels.includes(g.active) ? g.active : g.panels[0] }));
    state.closed = state.closed.filter((k) => k !== key);
  };

  // ---------- En-têtes des panneaux : icône, actions, glisser ----------
  for (const p of panels.values()) {
    const title = p.el.querySelector(".wp-panel-title");
    const btn = title.querySelector("[data-panel-toggle]");
    if (ICONS[p.key]) btn.prepend(el("span", { class: "wsp-icon" }, svgIcon(ICONS[p.key])));
    const act = (label, cls, glyph, fn) => el("button", { type: "button", class: `wsp-act ${cls}`, "aria-label": `${label} : ${p.title}`, title: label, onclick: (e) => { e.stopPropagation(); fn(e); } }, glyph);
    title.append(el("span", { class: "wsp-actions" },
      act("Options du panneau", "wsp-act-menu", "⋮", (e) => contextMenu(p.key, e.currentTarget)),
      act("Réduire / déplier", "wsp-act-min", "−", () => setMinimized(p.key, isPanelOpen(p.key))),
      act("Agrandir", "wsp-act-max", "□", () => toggleMaximize(p.key)),
      act("Fermer le panneau", "wsp-act-close", "×", () => closePanel(p.key))));
    title.addEventListener("contextmenu", (e) => { if (isCompact()) return; e.preventDefault(); contextMenu(p.key, title.querySelector(".wsp-act-menu")); });
    btn.addEventListener("pointerdown", (e) => startDrag(e, p.key, btn));
  }

  // ---------- Rendu ----------
  function groupEl(g, where) {
    const multi = g.panels.length > 1;
    const sec = el("section", { class: `wsp-group${multi ? " is-tabbed" : ""}`, "data-wsp-group": where });
    if (multi) {
      const tabs = el("div", { class: "wsp-tabs", role: "tablist", "aria-label": "Panneaux regroupés" });
      for (const k of g.panels) {
        const on = k === g.active;
        const tab = el("button", { type: "button", role: "tab", class: "wsp-tab", "aria-selected": String(on), tabindex: on ? "0" : "-1", "data-wsp-tab": k }, panels.get(k).title);
        tab.addEventListener("click", () => { if (dragJustEnded) return; g.active = k; render(); save(); });
        tab.addEventListener("keydown", (e) => {
          const i = g.panels.indexOf(k);
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); g.active = g.panels[(i + (e.key === "ArrowRight" ? 1 : -1) + g.panels.length) % g.panels.length]; render(); save(); sec.querySelector(`[data-wsp-tab="${g.active}"]`)?.focus(); }
        });
        tab.addEventListener("pointerdown", (e) => startDrag(e, k, tab));
        tabs.append(tab);
      }
      sec.append(tabs);
    }
    for (const k of g.panels) {
      const p = panels.get(k).el;
      p.classList.toggle("wsp-inactive", multi && k !== g.active);
      sec.append(p);
    }
    return sec;
  }
  function render() {
    for (const p of panels.values()) parking.append(p.el);
    const compact = isCompact();
    const view = compact ? normalize({ right: { groups: KEYS.map((k) => ({ panels: [k], active: k })) }, minimized: state.minimized }) : state;
    for (const d of DOCKS) {
      docks[d].replaceChildren();
      if (d === "right") { for (const g of view[d].groups) docks[d].append(groupEl(g, d)); continue; }
      // Zones gauche et basse : contenu défilant + poignée de redimensionnement fixe
      const scroller = el("div", { class: "wsp-dock-scroll" });
      for (const g of view[d].groups) scroller.append(groupEl(g, d));
      docks[d].append(scroller);
      docks[d].hidden = !view[d].groups.length;
      if (view[d].groups.length) docks[d].append(splitter(d));
    }
    if (!compact && view.right.w) root.style.setProperty("--wp-sidebar-w", `${view.right.w}px`);
    docks.left.style.width = `${view.left.w}px`;
    docks.bottom.style.height = `${view.bottom.h}px`;
    floatsEl.replaceChildren(...view.floats.map((f, i) => floatEl(f, i)));
    for (const k of KEYS) {
      const p = panels.get(k);
      const inPark = p.el.parentNode === parking;
      if (!inPark) {
        const open = !view.minimized.includes(k);
        if (isPanelOpen(k) !== open) openPanel(k, open, { silent: true });
      }
    }
    root.classList.toggle("wsp-compact", compact);
    root.classList.toggle("wsp-has-left", !docks.left.hidden);
    root.classList.toggle("wsp-has-bottom", !docks.bottom.hidden);
    sideSplitter();
    notify();
  }
  function notify() { for (const fn of listeners) { try { fn(); } catch { /* un abonné défaillant n'arrête pas l'espace de travail */ } } if (onVisibilityChange) onVisibilityChange(); }

  // Fenêtre flottante : barre (onglets ou titre du panneau), corps, poignée de redimensionnement
  function floatEl(f, index) {
    const bounds = layoutEl.getBoundingClientRect();
    f.w = clamp(f.w, LIMITS.floatW[0], Math.min(LIMITS.floatW[1], bounds.width - 16));
    f.h = clamp(f.h, LIMITS.floatH[0], Math.min(LIMITS.floatH[1], bounds.height - 16));
    f.x = clamp(f.x, 0, Math.max(0, bounds.width - f.w));
    f.y = clamp(f.y, 0, Math.max(0, bounds.height - f.h));
    const minimized = f.panels.length === 1 && state.minimized.includes(f.panels[0]);
    const win = el("div", { class: `wsp-float${minimized ? " is-min" : ""}`, role: "dialog", "aria-label": `Fenêtre : ${panels.get(f.active).title}`, "data-wsp-float": String(index), style: `left:${f.x}px;top:${f.y}px;width:${f.w}px;${minimized ? "" : `height:${f.h}px;`}z-index:${30 + index}` });
    win.append(groupEl(f, "float"));
    const grip = el("div", { class: "wsp-resize", "aria-hidden": "true" });
    grip.addEventListener("pointerdown", (e) => startResizeFloat(e, f, win));
    win.append(grip);
    win.addEventListener("pointerdown", () => { const last = state.floats[state.floats.length - 1]; if (last !== f) { state.floats = [...state.floats.filter((x) => x !== f), f]; [...floatsEl.children].forEach((c, i) => { c.style.zIndex = String(30 + i); }); win.style.zIndex = String(30 + state.floats.length); } }, true);
    return win;
  }

  // ---------- Redimensionnement ----------
  function splitter(d) {
    const s = el("div", { class: `wsp-splitter wsp-splitter-${d}`, role: "separator", tabindex: "0", "aria-orientation": d === "bottom" ? "horizontal" : "vertical", "aria-label": d === "bottom" ? "Hauteur de la zone basse" : "Largeur de la zone gauche" });
    const apply = (v) => {
      if (d === "left") { state.left.w = clamp(Math.round(v), LIMITS.left[0], LIMITS.left[1]); docks.left.style.width = `${state.left.w}px`; }
      else { const max = Math.round(layoutEl.clientHeight * LIMITS.bottom[1]); state.bottom.h = clamp(Math.round(v), LIMITS.bottom[0], max); docks.bottom.style.height = `${state.bottom.h}px`; }
      s.setAttribute("aria-valuenow", String(d === "left" ? state.left.w : state.bottom.h));
    };
    s.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      s.setPointerCapture(e.pointerId);
      const start = d === "left" ? e.clientX : e.clientY;
      const init = d === "left" ? state.left.w : state.bottom.h;
      const move = (ev) => apply(d === "left" ? init + (ev.clientX - start) : init - (ev.clientY - start));
      const up = () => { s.removeEventListener("pointermove", move); s.removeEventListener("pointerup", up); save(); };
      s.addEventListener("pointermove", move);
      s.addEventListener("pointerup", up);
    });
    s.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 40 : 10;
      const grow = d === "left" ? { ArrowRight: 1, ArrowLeft: -1 } : { ArrowUp: 1, ArrowDown: -1 };
      if (grow[e.key]) { e.preventDefault(); apply((d === "left" ? state.left.w : state.bottom.h) + grow[e.key] * step); save(); }
    });
    return s;
  }
  // Largeur de la barre latérale droite (zone d'ancrage droite)
  let sideSplit = null;
  function sideSplitter() {
    const sidebar = root.querySelector("[data-sidebar]");
    if (!sidebar) return;
    if (!sideSplit) {
      sideSplit = el("div", { class: "wsp-splitter wsp-splitter-right", role: "separator", tabindex: "0", "aria-orientation": "vertical", "aria-label": "Largeur de la barre latérale" });
      const apply = (v) => { state.right.w = clamp(Math.round(v), LIMITS.right[0], LIMITS.right[1]); root.style.setProperty("--wp-sidebar-w", `${state.right.w}px`); };
      sideSplit.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        sideSplit.setPointerCapture(e.pointerId);
        const start = e.clientX;
        const init = sidebar.getBoundingClientRect().width;
        const move = (ev) => apply(init - (ev.clientX - start));
        const up = () => { sideSplit.removeEventListener("pointermove", move); sideSplit.removeEventListener("pointerup", up); save(); };
        sideSplit.addEventListener("pointermove", move);
        sideSplit.addEventListener("pointerup", up);
      });
      sideSplit.addEventListener("keydown", (e) => { const m = { ArrowLeft: 1, ArrowRight: -1 }[e.key]; if (m) { e.preventDefault(); apply(sidebar.getBoundingClientRect().width + m * (e.shiftKey ? 40 : 10)); save(); } });
      sidebar.before(sideSplit);
      new MutationObserver(() => { sideSplit.hidden = isCompact() || sidebar.hidden; }).observe(sidebar, { attributes: true, attributeFilter: ["hidden"] });
    }
    sideSplit.hidden = isCompact() || sidebar.hidden;
  }
  function startResizeFloat(e, f, win) {
    e.preventDefault();
    e.stopPropagation();
    const grip = e.currentTarget;
    grip.setPointerCapture(e.pointerId);
    const sx = e.clientX; const sy = e.clientY; const w0 = f.w; const h0 = f.h;
    const bounds = layoutEl.getBoundingClientRect();
    const move = (ev) => {
      f.w = clamp(w0 + ev.clientX - sx, LIMITS.floatW[0], Math.min(LIMITS.floatW[1], bounds.width - f.x));
      f.h = clamp(h0 + ev.clientY - sy, LIMITS.floatH[0], Math.min(LIMITS.floatH[1], bounds.height - f.y));
      win.style.width = `${f.w}px`; win.style.height = `${f.h}px`;
    };
    const up = () => { grip.removeEventListener("pointermove", move); grip.removeEventListener("pointerup", up); save(); };
    grip.addEventListener("pointermove", move);
    grip.addEventListener("pointerup", up);
  }

  // ---------- Glisser-déposer des panneaux (ancrage) ----------
  let drag = null;
  let dragJustEnded = false;
  const overlay = el("div", { class: "wsp-drop-overlay", hidden: true, "aria-hidden": "true" }, el("div", { class: "wsp-drop-preview" }), el("div", { class: "wsp-drop-label" }));
  layoutEl.append(overlay);
  function startDrag(e, key, handle) {
    if (e.button !== 0 || isCompact() || focusBackup) return;
    const sx = e.clientX; const sy = e.clientY;
    const loc = locate(key);
    if (!loc || loc.where === "closed") return;
    const pending = { key, loc, sx, sy, handle, started: false };
    const move = (ev) => {
      if (!pending.started) {
        if (Math.hypot(ev.clientX - sx, ev.clientY - sy) < DRAG_THRESHOLD) return;
        pending.started = true;
        beginDrag(pending, ev);
      }
      updateDrag(ev);
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      if (pending.started) { endDrag(ev); dragJustEnded = true; setTimeout(() => { dragJustEnded = false; }, 0); }
    };
    const cancel = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); if (pending.started) abortDrag(); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
  }
  // Un clic qui suit un glisser ne doit pas replier le panneau
  root.addEventListener("click", (e) => { if (dragJustEnded && e.target.closest(".wp-panel-title, .wsp-tab")) { e.stopPropagation(); e.preventDefault(); } }, true);
  function beginDrag(pending, ev) {
    const { key, loc } = pending;
    const isWindow = loc.where === "float";
    const win = isWindow ? pending.handle.closest(".wsp-float") : null;
    // Décalage mesuré au point de départ (avant le seuil de glisser) : la fenêtre suit exactement le pointeur
    drag = { ...pending, isWindow, win, target: null, offX: win ? pending.sx - win.getBoundingClientRect().left : 0, offY: win ? pending.sy - win.getBoundingClientRect().top : 0, group: loc.group };
    root.classList.add("wsp-dragging");
    overlay.hidden = false;
    overlay.querySelector(".wsp-drop-label").textContent = `Déplacer : ${panels.get(key).title}`;
  }
  function targetAt(ev) {
    const b = layoutEl.getBoundingClientRect();
    const x = ev.clientX - b.left; const y = ev.clientY - b.top;
    const sidebar = root.querySelector("[data-sidebar]");
    const band = Math.max(110, b.width * 0.12);
    // Survol d'un groupe existant : en-tête → onglet, sinon avant / après
    const under = document.elementFromPoint(ev.clientX, ev.clientY);
    const groupNode = under && under.closest(".wsp-group");
    if (groupNode && !(drag.win && drag.win.contains(groupNode))) {
      const g = groupFromNode(groupNode);
      if (g && !(g.group.panels.length === 1 && g.group.panels[0] === drag.key)) {
        const r = groupNode.getBoundingClientRect();
        if (ev.clientY - r.top < 46) return { type: "tab", ...g, rect: r };
        if (g.where !== "float") return { type: ev.clientY < r.top + r.height / 2 ? "before" : "after", ...g, rect: r };
      }
    }
    const sideOpen = sidebar && !sidebar.hidden && isSidebarOpen();
    const sbRect = sideOpen ? sidebar.getBoundingClientRect() : null;
    if (x < band) return { type: "dock", where: "left" };
    if ((sbRect && ev.clientX >= sbRect.left - 20) || x > b.width - band) return { type: "dock", where: "right" };
    if (y > b.height - Math.max(90, b.height * 0.18)) return { type: "dock", where: "bottom" };
    return { type: "float" };
  }
  function groupFromNode(node) {
    const where = node.dataset.wspGroup;
    const firstKey = node.querySelector(":scope > .wp-panel[data-panel]")?.dataset.panel;
    if (!firstKey) return null;
    const loc = locate(firstKey);
    return loc ? { where: loc.where, group: loc.group, node } : null;
  }
  function updateDrag(ev) {
    if (!drag) return;
    const b = layoutEl.getBoundingClientRect();
    if (drag.isWindow && drag.group.panels.length >= 1 && drag.group === locate(drag.key).group) {
      const f = drag.group;
      f.x = clamp(ev.clientX - b.left - drag.offX, 0, Math.max(0, b.width - f.w));
      f.y = clamp(ev.clientY - b.top - drag.offY, 0, Math.max(0, b.height - 40));
      drag.win.style.left = `${f.x}px`; drag.win.style.top = `${f.y}px`;
      drag.win.style.pointerEvents = "none";
    }
    const t = targetAt(ev);
    drag.target = t;
    const pv = overlay.querySelector(".wsp-drop-preview");
    let r;
    if (t.type === "tab") r = { left: t.rect.left - b.left, top: t.rect.top - b.top, width: t.rect.width, height: Math.min(t.rect.height, 220) };
    else if (t.type === "before" || t.type === "after") r = { left: t.rect.left - b.left, top: (t.type === "before" ? t.rect.top : t.rect.bottom) - b.top - 3, width: t.rect.width, height: 6 };
    else if (t.type === "dock" && t.where === "left") r = { left: 0, top: 0, width: Math.min(state.left.w, b.width / 3), height: b.height };
    else if (t.type === "dock" && t.where === "right") { const w = root.querySelector("[data-sidebar]")?.getBoundingClientRect().width || 300; r = { left: b.width - w, top: 0, width: w, height: b.height }; }
    else if (t.type === "dock" && t.where === "bottom") r = { left: 0, top: b.height - Math.min(state.bottom.h, b.height * 0.5), width: b.width, height: Math.min(state.bottom.h, b.height * 0.5) };
    else r = drag.isWindow ? null : { left: clamp(ev.clientX - b.left - 30, 0, b.width - 320), top: clamp(ev.clientY - b.top - 20, 0, b.height - 200), width: 320, height: 200 };
    pv.hidden = !r;
    if (r) Object.assign(pv.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
    pv.dataset.kind = t.type === "before" || t.type === "after" ? "line" : t.type;
    const LABEL = { tab: "Regrouper en onglets", before: "Placer ici", after: "Placer ici", float: drag.isWindow ? "Fenêtre flottante" : "Détacher en fenêtre flottante", dock: { left: "Ancrer à gauche", right: "Ancrer à droite", bottom: "Ancrer en bas" }[t.where] };
    const label = overlay.querySelector(".wsp-drop-label");
    label.textContent = LABEL[t.type] || "";
    label.style.left = `${clamp(ev.clientX - b.left + 14, 0, b.width - 200)}px`;
    label.style.top = `${clamp(ev.clientY - b.top + 14, 0, b.height - 30)}px`;
  }
  function endDrag(ev) {
    const d = drag;
    abortDrag();
    if (!d || !d.target) return;
    const t = d.target;
    const b = layoutEl.getBoundingClientRect();
    // Une fenêtre entière (avec ses onglets) déplacée : elle reste flottante sauf si on la dépose sur une zone
    const moving = d.isWindow && t.type !== "float" ? [...d.group.panels] : [d.key];
    if (d.isWindow && t.type === "float") { save(); return; }
    const targetGroup = t.group;
    for (const k of moving) removeFromLayout(k);
    if (t.type === "tab") {
      const g = findSame(targetGroup);
      if (g) { g.panels.push(...moving); g.active = moving[0]; } else state.right.groups.push({ panels: moving, active: moving[0] });
    } else if (t.type === "before" || t.type === "after") {
      const list = state[t.where].groups;
      const g = findSame(targetGroup);
      const i = g ? list.indexOf(g) : list.length;
      list.splice(t.type === "before" ? i : i + 1, 0, { panels: moving, active: moving[0] });
    } else if (t.type === "dock") {
      state[t.where].groups.push({ panels: moving, active: moving[0] });
      if (t.where === "right") showSeoTab();
    } else {
      state.floats.push({ panels: moving, active: moving[0], x: clamp(ev.clientX - b.left - 30, 0, b.width - 340), y: clamp(ev.clientY - b.top - 20, 0, b.height - 200), w: 340, h: 380 });
    }
    // Un panneau déplacé est fait pour être vu : il s'ouvre
    state.minimized = state.minimized.filter((k) => !moving.includes(k));
    render();
    save();
  }
  // Après removeFromLayout, les objets groupes ont été recréés : on retrouve le groupe cible par ses panneaux
  function findSame(g) {
    if (!g) return null;
    for (const d of DOCKS) for (const x of state[d].groups) if (x.panels.some((k) => g.panels.includes(k))) return x;
    for (const x of state.floats) if (x.panels.some((k) => g.panels.includes(k))) return x;
    return null;
  }
  function abortDrag() {
    if (drag && drag.win) drag.win.style.pointerEvents = "";
    drag = null;
    overlay.hidden = true;
    root.classList.remove("wsp-dragging");
  }

  // ---------- Actions ----------
  function moveTo(key, where) {
    removeFromLayout(key);
    if (where === "float") {
      const b = layoutEl.getBoundingClientRect();
      state.floats.push({ panels: [key], active: key, x: Math.max(0, b.width / 2 - 170), y: 40, w: 340, h: 380 });
    } else state[where].groups.push({ panels: [key], active: key });
    state.minimized = state.minimized.filter((k) => k !== key);
    render();
    save();
    if (where === "right") showSeoTab();
  }
  function groupWith(key, otherKey) {
    removeFromLayout(key);
    const loc = locate(otherKey);
    if (!loc || !loc.group) { state.right.groups.push({ panels: [key], active: key }); } else { loc.group.panels.push(key); loc.group.active = key; }
    render();
    save();
  }
  function resetPanel(key) {
    removeFromLayout(key);
    // Place d'origine : dans la barre droite, à son rang initial parmi les panneaux qui y sont seuls
    const idx = panels.get(key).index;
    const list = state.right.groups;
    let at = list.length;
    for (let i = 0; i < list.length; i++) { const first = panels.get(list[i].panels[0]); if (first && first.index > idx) { at = i; break; } }
    list.splice(at, 0, { panels: [key], active: key });
    render();
    save();
  }
  function closePanel(key) {
    if (maximized === key) toggleMaximize(key);
    removeFromLayout(key);
    state.closed.push(key);
    render();
    save();
  }
  function reopen(key) {
    if (!state.closed.includes(key) && locate(key)) return reveal(key);
    state.closed = state.closed.filter((k) => k !== key);
    resetPanel(key);
    reveal(key);
  }
  function setMinimized(key, min) {
    state.minimized = min ? [...new Set([...state.minimized, key])] : state.minimized.filter((k) => k !== key);
    openPanel(key, !min, { silent: true });
    const win = panels.get(key).el.closest(".wsp-float");
    if (win) { const f = state.floats[Number(win.dataset.wspFloat)]; if (f && f.panels.length === 1) { win.classList.toggle("is-min", min); win.style.height = min ? "" : `${f.h}px`; } }
    save();
    notify();
  }
  let maximized = null;
  function toggleMaximize(key) {
    const p = panels.get(key).el;
    const holder = p.closest(".wsp-group");
    if (maximized === key) {
      holder?.classList.remove("wsp-max");
      root.classList.remove("wsp-has-max");
      maximized = null;
      p.querySelector(".wsp-act-max").textContent = "□";
    } else {
      if (maximized) toggleMaximize(maximized);
      if (isCompact()) return;
      if (!isPanelOpen(key)) setMinimized(key, false);
      holder?.classList.add("wsp-max");
      root.classList.add("wsp-has-max");
      maximized = key;
      p.querySelector(".wsp-act-max").textContent = "❐";
      const loc = locate(key);
      if (loc && loc.group && loc.group.active !== key) { loc.group.active = key; render(); panels.get(key).el.closest(".wsp-group")?.classList.add("wsp-max"); }
    }
    notify();
  }
  // Rendre un panneau visible : rouvert, déplié, onglet actif, barre latérale ouverte, défilement, surbrillance
  function reveal(key) {
    if (!panels.has(key)) return;
    if (state.closed.includes(key)) { reopen(key); return; }
    const loc = locate(key);
    if (loc && loc.group && loc.group.active !== key) { loc.group.active = key; render(); save(); }
    if (state.minimized.includes(key)) setMinimized(key, false);
    const p = panels.get(key).el;
    if (docks.right.contains(p)) { if (!isSidebarOpen()) openSidebar(); showSeoTab(); }
    p.scrollIntoView({ block: "nearest", behavior: "smooth" });
    p.classList.remove("wsp-flash");
    void p.offsetWidth;
    p.classList.add("wsp-flash");
    const btn = p.querySelector("[data-panel-toggle]");
    setTimeout(() => btn && btn.focus({ preventScroll: true }), 50);
    notify();
  }

  // ---------- Menu contextuel d'un panneau ----------
  let openMenu = null;
  function closeMenu() { if (openMenu) { openMenu.remove(); openMenu = null; } }
  document.addEventListener("pointerdown", (e) => { if (openMenu && !openMenu.contains(e.target)) closeMenu(); });
  function contextMenu(key, anchor) {
    closeMenu();
    const loc = locate(key) || {};
    const item = (label, fn, disabled) => el("button", { type: "button", role: "menuitem", disabled: disabled || null, onclick: () => { closeMenu(); fn(); } }, label);
    const others = [];
    for (const d of [...DOCKS, "float"]) for (const g of d === "float" ? state.floats : state[d].groups) if (!g.panels.includes(key)) others.push(g);
    const compact = isCompact();
    const menu = el("div", { class: "wp-menu wsp-context", role: "menu", "aria-label": `Options : ${panels.get(key).title}` },
      el("p", { class: "wp-menu-label" }, panels.get(key).title),
      item("Ancrer à gauche", () => moveTo(key, "left"), compact || (loc.where === "left" && loc.group.panels.length === 1)),
      item("Ancrer à droite", () => moveTo(key, "right"), loc.where === "right" && loc.group.panels.length === 1),
      item("Ancrer en bas", () => moveTo(key, "bottom"), compact || (loc.where === "bottom" && loc.group.panels.length === 1)),
      item("Détacher (fenêtre flottante)", () => moveTo(key, "float"), compact || loc.where === "float"),
      ...(compact ? [] : others.slice(0, 8).map((g) => item(`Grouper avec « ${panels.get(g.active).title} »`, () => groupWith(key, g.active)))),
      el("hr"),
      item(maximized === key ? "Restaurer la taille" : "Agrandir", () => toggleMaximize(key), compact),
      item(isPanelOpen(key) ? "Réduire" : "Déplier", () => setMinimized(key, isPanelOpen(key))),
      item("Remettre à sa place par défaut", () => resetPanel(key)),
      item("Fermer le panneau", () => closePanel(key)));
    menu.addEventListener("keydown", (e) => {
      const items = [...menu.querySelectorAll("button:not([disabled])")];
      const i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); anchor.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    document.body.append(menu);
    const r = anchor.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.zIndex = "200";
    menu.hidden = false;
    const mw = menu.offsetWidth; const mh = menu.offsetHeight;
    menu.style.left = `${clamp(r.right - mw, 8, window.innerWidth - mw - 8)}px`;
    menu.style.top = `${r.bottom + mh + 8 > window.innerHeight ? Math.max(8, r.top - mh - 4) : r.bottom + 4}px`;
    openMenu = menu;
    menu.querySelector("button:not([disabled])")?.focus();
  }

  // ---------- Enregistrement ----------
  function save() {
    if (focusBackup) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { api("/formateur/blog/api/espace-seo/disposition", { method: "PUT", json: { layout: snapshot() } }).catch(() => { /* hors ligne : la disposition sera enregistrée au prochain changement */ }); }, 700);
  }
  const snapshot = () => clone(state);
  function applyLayout(l, { persist = true } = {}) {
    if (maximized) toggleMaximize(maximized);
    state = normalize(l);
    render();
    if (persist) save();
  }
  async function applyPreset(id) { const p = PRESETS[id]; if (!p) return; if (focusBackup) exitFocus(); applyLayout(p.build()); toast && toast(`Disposition « ${p.label} » appliquée.`); }
  async function saveAs(name) {
    const r = await api("/formateur/blog/api/espace-seo/dispositions", { method: "POST", json: { name, layout: snapshot() } });
    saved = r.saved;
    return r;
  }
  async function loadNamed(name) { const r = await api(`/formateur/blog/api/espace-seo/dispositions/${encodeURIComponent(name)}`); if (focusBackup) exitFocus(); applyLayout(r.layout); toast && toast(`Disposition « ${name} » appliquée.`); }
  async function deleteNamed(name) { const r = await api(`/formateur/blog/api/espace-seo/dispositions/${encodeURIComponent(name)}`, { method: "DELETE" }); saved = r.saved; }
  async function reset() {
    const ok = await confirmDialog("Réinitialiser l'espace de travail ? Tous les panneaux reprennent leur place d'origine dans la barre latérale.");
    if (!ok) return false;
    if (focusBackup) exitFocus();
    applyLayout(defaultLayout());
    toast && toast("Espace de travail réinitialisé.");
    return true;
  }
  let saved = (initial && initial.saved) || [];

  // ---------- Mode Focus SEO (temporaire, jamais enregistré) ----------
  const FOCUS = ["score", "reco", "analysis"];
  function enterFocus() {
    if (focusBackup || isCompact()) return;
    focusBackup = snapshot();
    state = normalize({ right: { groups: FOCUS.map((k) => ({ panels: [k], active: k })) }, closed: KEYS.filter((k) => !FOCUS.includes(k)), minimized: [] });
    root.classList.add("wsp-focus");
    render();
    if (!isSidebarOpen()) openSidebar();
    showSeoTab();
    notify();
  }
  function exitFocus() {
    if (!focusBackup) return;
    const back = focusBackup;
    focusBackup = null;
    root.classList.remove("wsp-focus");
    state = normalize(back);
    render();
  }
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (maximized) { e.preventDefault(); toggleMaximize(maximized); }
    else if (focusBackup && !document.querySelector(".wp-modal:not([hidden]), .wsp-palette:not([hidden]), .wp-popover")) exitFocus();
  });

  compactQuery.addEventListener("change", () => { if (maximized) toggleMaximize(maximized); if (focusBackup && isCompact()) exitFocus(); render(); });
  window.addEventListener("resize", () => { if (!isCompact() && state.floats.length) render(); });

  state = normalize(initial && initial.layout ? initial.layout : defaultLayout());
  render();

  // Panneau visible à l'écran (pour charger ses données seulement quand on le regarde)
  function isVisible(key) {
    const p = panels.get(key);
    if (!p || p.el.parentNode === parking || p.el.classList.contains("wsp-inactive") || !isPanelOpen(key)) return false;
    if (docks.right.contains(p.el)) return isSidebarOpen() && !docks.right.closest("[data-sidebar-panel]").hidden;
    return true;
  }

  return {
    panels: () => KEYS.map((k) => ({ key: k, title: panels.get(k).title, closed: state.closed.includes(k), where: (locate(k) || {}).where })),
    presets: () => Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label })),
    saved: () => saved,
    reveal, reopen, closePanel, moveTo, applyPreset, saveAs, loadNamed, deleteNamed, reset, enterFocus, exitFocus,
    inFocus: () => Boolean(focusBackup), isVisible, isCompact,
    onChange: (fn) => listeners.add(fn),
    notifyPanelToggle: (key, open) => { if (focusBackup || isCompact()) return; const was = !state.minimized.includes(key); if (was === open) return; state.minimized = open ? state.minimized.filter((k) => k !== key) : [...state.minimized, key]; save(); notify(); },
    containsPanel: (key) => panels.has(key),
  };
}

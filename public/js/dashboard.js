// KOLAKISA — « Mon espace » : barre latérale repliable (choix mémorisé sur cet appareil), tiroir sur mobile,
// menus « ⋯ » des formations, confirmations, page Apparence (aperçu en direct + enregistrement sur le compte).
(() => {
  const dash = document.getElementById("dash");
  if (!dash) return;
  const KEY = "kolakisa-dash-collapsed";
  const collapseBtn = dash.querySelector("[data-dash-collapse]");
  const sync = () => { const on = dash.classList.contains("is-collapsed"); collapseBtn?.setAttribute("aria-pressed", String(on)); collapseBtn?.setAttribute("aria-label", on ? "Déplier la barre latérale" : "Réduire la barre latérale"); collapseBtn?.setAttribute("title", on ? "Déplier la barre latérale" : "Réduire la barre latérale"); };
  sync();
  collapseBtn?.addEventListener("click", () => {
    dash.classList.toggle("is-collapsed");
    try { localStorage.setItem(KEY, dash.classList.contains("is-collapsed") ? "1" : "0"); } catch { /* stockage indisponible */ }
    sync();
  });

  // Tiroir (mobile)
  const menuBtn = dash.querySelector("[data-dash-menu]");
  const overlay = dash.querySelector("[data-dash-overlay]");
  const sidebar = document.getElementById("dashSidebar");
  const setDrawer = (open) => {
    dash.classList.toggle("is-drawer", open);
    overlay.hidden = !open;
    menuBtn?.setAttribute("aria-expanded", String(open));
    menuBtn?.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    if (open) sidebar.querySelector("a, button")?.focus(); else menuBtn?.focus();
  };
  menuBtn?.addEventListener("click", () => setDrawer(!dash.classList.contains("is-drawer")));
  overlay?.addEventListener("click", () => setDrawer(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && dash.classList.contains("is-drawer")) setDrawer(false); });
  window.matchMedia("(min-width: 761px)").addEventListener("change", (m) => { if (m.matches && dash.classList.contains("is-drawer")) setDrawer(false); });

  // Menus « ⋯ »
  const closeMenus = (except) => document.querySelectorAll(".dmenu-btn[aria-expanded='true']").forEach((b) => { if (b !== except) { b.setAttribute("aria-expanded", "false"); b.nextElementSibling.hidden = true; } });
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".dmenu-btn");
    if (!btn) { if (!e.target.closest(".dmenu-list")) closeMenus(); return; }
    const list = btn.nextElementSibling;
    const open = btn.getAttribute("aria-expanded") !== "true";
    closeMenus(btn);
    btn.setAttribute("aria-expanded", String(open));
    list.hidden = !open;
    if (open) {
      // Ouvre vers le bas s'il n'y a pas la place au-dessus
      list.classList.remove("is-below");
      if (btn.getBoundingClientRect().top - list.offsetHeight < 70) list.classList.add("is-below");
      list.querySelector("a, button:not([disabled])")?.focus();
    }
  });
  document.addEventListener("keydown", (e) => {
    const list = e.target.closest && e.target.closest(".dmenu-list");
    if (e.key === "Escape") { const open = document.querySelector(".dmenu-btn[aria-expanded='true']"); if (open) { closeMenus(); open.focus(); } return; }
    if (!list || !["ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const items = [...list.querySelectorAll("a, button:not([disabled])")];
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
  });

  // Confirmation des actions sensibles (archiver, supprimer…)
  document.addEventListener("submit", (e) => { const msg = e.target.dataset && e.target.dataset.confirm; if (msg && !window.confirm(msg)) e.preventDefault(); }, true);

  // ---------- Notifications (toasts) : succès affichés quelques secondes, fermables ----------
  const toasts = document.querySelectorAll("[data-toast]");
  if (toasts.length) {
    const stack = document.createElement("div");
    stack.className = "dash-toasts";
    stack.setAttribute("aria-live", "polite");
    document.body.appendChild(stack);
    toasts.forEach((t) => {
      const close = document.createElement("button");
      close.type = "button";
      close.className = "dash-toast-close";
      close.setAttribute("aria-label", "Fermer la notification");
      close.textContent = "×";
      const hide = () => { t.classList.add("is-leaving"); setTimeout(() => t.remove(), 250); };
      close.addEventListener("click", hide);
      t.appendChild(close);
      stack.appendChild(t);
      let timer = setTimeout(hide, 6000);
      t.addEventListener("mouseenter", () => clearTimeout(timer));
      t.addEventListener("mouseleave", () => { timer = setTimeout(hide, 3000); });
    });
  }

  // ---------- Fenêtres (dialog) : ouverture sans recharger ; sans JavaScript, les liens mènent à la page ----------
  const openDialog = (d) => { if (!d) return; if (d.open && !d.matches(":modal")) d.close(); if (!d.open) d.showModal(); d.querySelector("input, textarea, select, button")?.focus(); };
  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-dialog-open]");
    if (opener) { e.preventDefault(); closeMenus(); openDialog(document.getElementById(opener.dataset.dialogOpen)); return; }
    const closer = e.target.closest("[data-dialog-close]");
    if (closer && closer.closest("dialog")?.matches(":modal")) { e.preventDefault(); closer.closest("dialog").close(); }
  });
  document.querySelectorAll("dialog[data-autoshow]").forEach(openDialog);

  // ---------- Formulaires : envoi automatique d'un filtre, attente pendant un traitement long ----------
  document.querySelectorAll("select[data-autosubmit]").forEach((sel) => sel.addEventListener("change", () => sel.form.requestSubmit()));
  document.addEventListener("submit", (e) => {
    const f = e.target;
    if (e.defaultPrevented || !f.dataset || !f.dataset.busy) return;
    const btn = e.submitter || f.querySelector('button[type="submit"], button:not([type])');
    // Aucune progression simulée : le bouton indique seulement que le serveur travaille
    if (btn) setTimeout(() => { btn.disabled = true; btn.textContent = f.dataset.busy; }, 0);
  });

  // ---------- Onglets locaux (accessibles, flèches du clavier) ----------
  document.querySelectorAll("[data-tabs]").forEach((box) => {
    const tabs = [...box.querySelectorAll(':scope > [role="tablist"] [role="tab"]')];
    if (!tabs.length) return;
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const select = (i, focus) => tabs.forEach((t, j) => { const on = i === j; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; if (on && focus) t.focus(); });
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => { if (!["ArrowRight", "ArrowLeft"].includes(e.key)) return; e.preventDefault(); select((i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length, true); });
    });
    // Une adresse avec ancre (#tache-monitor, #programmees…) ouvre l'onglet qui la contient
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const fromHash = target ? panels.findIndex((p) => p === target || p.contains(target)) : -1;
    select(fromHash >= 0 ? fromHash : 0);
    if (fromHash >= 0 && target !== panels[fromHash]) setTimeout(() => target.scrollIntoView({ block: "start" }), 0);
  });

  // ---------- Tâches SEO : filtre par priorité et tri ----------
  const taskBox = document.querySelector("[data-tasklist]");
  if (taskBox) {
    const rows = [...taskBox.querySelectorAll("[data-task]")];
    const tbody = rows[0] && rows[0].parentElement;
    const empty = taskBox.querySelector("[data-task-empty]");
    let filter = "all";
    const apply = () => {
      let n = 0;
      rows.forEach((r) => { const show = filter === "done" ? r.dataset.done === "1" : r.dataset.done === "0" && (filter === "all" || r.dataset.priority === filter); r.hidden = !show; if (show) n += 1; });
      if (empty) empty.hidden = n > 0;
    };
    taskBox.querySelectorAll("[data-task-filter]").forEach((b) => b.addEventListener("click", () => {
      filter = b.dataset.taskFilter;
      taskBox.querySelectorAll("[data-task-filter]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
    taskBox.querySelector("[data-task-sort]")?.addEventListener("change", (e) => {
      const by = e.target.value;
      const cmp = { priority: (a, b) => a.dataset.rank - b.dataset.rank || b.dataset.pages - a.dataset.pages, pages: (a, b) => b.dataset.pages - a.dataset.pages || a.dataset.rank - b.dataset.rank, title: (a, b) => a.dataset.title.localeCompare(b.dataset.title, "fr") }[by];
      rows.sort(cmp).forEach((r) => tbody.appendChild(r));
    });
    apply();
  }

  // ---------- Réglages SEO : une rubrique à la fois ----------
  const settingsForm = document.querySelector("[data-settings]");
  if (settingsForm) {
    settingsForm.classList.add("is-tabbed");
    const links = [...settingsForm.querySelectorAll("[data-settings-tab]")];
    const panes = [...settingsForm.querySelectorAll("[data-settings-panel]")];
    const show = (key) => {
      panes.forEach((p) => p.classList.toggle("is-active", p.dataset.settingsPanel === key));
      links.forEach((l) => { if (l.dataset.settingsTab === key) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current"); });
    };
    links.forEach((l) => l.addEventListener("click", (e) => { e.preventDefault(); show(l.dataset.settingsTab); history.replaceState(null, "", `#rubrique-${l.dataset.settingsTab}`); settingsForm.querySelector(".is-active h2")?.scrollIntoView({ block: "nearest" }); }));
    // Ancre vers une rubrique ou un champ (#seo-org_logo) ; sinon la première rubrique en erreur ; sinon la première
    const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const errorLink = links.find((l) => l.querySelector(".seo-dot-error"));
    const pane = target ? panes.find((p) => p === target || p.contains(target)) : null;
    show(pane ? pane.dataset.settingsPanel : errorLink ? errorLink.dataset.settingsTab : panes[0].dataset.settingsPanel);
    if (target && pane && target !== pane) setTimeout(() => { target.scrollIntoView({ block: "center" }); target.focus({ preventScroll: true }); }, 0);
    const dirty = settingsForm.querySelector("[data-dirty]");
    settingsForm.addEventListener("input", () => { if (dirty) dirty.hidden = false; });
    settingsForm.addEventListener("submit", () => { if (dirty) dirty.hidden = true; });
  }

  // ---------- Chargement : squelette pendant le passage d'une rubrique SEO à une autre ----------
  if (dash.classList.contains("dash-seo")) {
    const content = dash.querySelector(".dash-content");
    dash.querySelector(".dash-nav")?.addEventListener("click", (e) => {
      const a = e.target.closest("a[href]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank" || a.origin !== location.origin) return;
      setTimeout(() => content.classList.add("is-loading"), 120);
    });
    window.addEventListener("pageshow", () => content.classList.remove("is-loading"));
  }

  // ---------- Apparence ----------
  const app = document.querySelector("[data-appearance]");
  if (!app) return;
  const data = JSON.parse(app.querySelector("[data-appearance-data]").textContent);
  let theme = data.prefs.theme;
  let colors = { ...data.prefs.colors };
  const state = app.querySelector("[data-save-state]");
  const HEX = /^#[0-9a-f]{6}$/i;
  const isDark = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] < 0.22; };
  // Même calcul que le serveur (src/services/dashboard.js#tokens) : l'aperçu est exactement ce qui sera enregistré
  const tokens = () => {
    const base = { ...(theme === "perso" ? data.themes.clair : data.themes[theme] || data.themes.clair) };
    if (theme === "perso") {
      if (colors.bg) { base.bg = colors.bg; Object.assign(base, isDark(colors.bg) ? { card: "#1c2128", text: "#e8ecef", muted: "#9aa4ae", border: "#2f363e" } : { card: "#ffffff", text: "#102a3a", muted: "#64748b", border: "#e2e8f0" }); }
      if (colors.card) { base.card = colors.card; Object.assign(base, isDark(colors.card) ? { text: "#e8ecef", muted: "#9aa4ae", border: "#2f363e" } : { text: "#102a3a", muted: "#64748b", border: "#e2e8f0" }); }
      if (colors.sidebar) { base.sidebar = colors.sidebar; base.sidebarText = isDark(colors.sidebar) ? "#d6dee6" : "#2b3440"; }
      if (colors.primary) base.primary = colors.primary;
      if (colors.button) base.button = colors.button;
      base.accent = colors.accent || base.primary;
    }
    const accent = base.accent || base.primary;
    const sd = isDark(base.sidebar);
    return { "--dash-bg": base.bg, "--dash-card": base.card, "--dash-text": base.text, "--dash-muted": base.muted, "--dash-border": base.border, "--dash-sidebar": base.sidebar, "--dash-sidebar-text": base.sidebarText, "--dash-primary": base.primary, "--dash-accent": accent, "--dash-button": base.button, "--dash-button-text": isDark(base.button) ? "#ffffff" : "#102a3a", "--dash-hover": sd ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 40, 60, 0.06)", "--dash-active-bg": sd ? "rgba(255, 255, 255, 0.12)" : `${accent}1a`, "--dash-active-text": sd ? "#ffffff" : accent, ...(isDark(base.card) ? { "--dash-success": "#4ade80", "--dash-warning": "#fbbf24", "--dash-danger": "#f87171" } : { "--dash-success": "#15803d", "--dash-warning": "#b45309", "--dash-danger": "#c2410c" }) };
  };
  const apply = () => {
    for (const [k, v] of Object.entries(tokens())) dash.style.setProperty(k, v);
    document.body.style.background = tokens()["--dash-bg"];
    app.querySelectorAll("[data-theme]").forEach((c) => { const on = c.dataset.theme === theme; c.setAttribute("aria-pressed", String(on)); c.querySelector(".theme-active").hidden = !on; });
    app.querySelector("[data-custom]").hidden = theme !== "perso";
  };
  let timer = null;
  const save = () => {
    clearTimeout(timer);
    state.textContent = "Enregistrement…";
    timer = setTimeout(async () => {
      try {
        const res = await fetch("/formateur/apparence", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ theme, colors }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Erreur ${res.status}`);
        state.textContent = "✓ Enregistré sur votre compte";
      } catch (e) { state.textContent = `Non enregistré : ${e.message}`; }
    }, 400);
  };
  app.querySelectorAll("[data-theme]").forEach((card) => card.addEventListener("click", () => {
    theme = card.dataset.theme;
    if (theme === "perso" && !Object.keys(colors).length) { const t = data.themes.clair; colors = { primary: t.primary, accent: t.primary, sidebar: t.sidebar, bg: t.bg, card: t.card, button: t.button }; fillFields(); }
    apply(); save();
  }));
  const fillFields = () => app.querySelectorAll("[data-color]").forEach((f) => {
    const k = f.dataset.color;
    const v = colors[k] || "";
    f.querySelector("input[type=color]").value = v || "#0b83c6";
    f.querySelector("input[type=text]").value = v.toUpperCase();
  });
  app.querySelectorAll("[data-color]").forEach((f) => {
    const k = f.dataset.color;
    const pick = f.querySelector("input[type=color]");
    const text = f.querySelector("input[type=text]");
    pick.addEventListener("input", () => { colors[k] = pick.value; text.value = pick.value.toUpperCase(); text.removeAttribute("aria-invalid"); apply(); save(); });
    text.addEventListener("input", () => {
      const v = text.value.trim().startsWith("#") ? text.value.trim() : `#${text.value.trim()}`;
      if (!HEX.test(v)) { text.setAttribute("aria-invalid", "true"); return; }
      text.removeAttribute("aria-invalid");
      colors[k] = v.toLowerCase(); pick.value = colors[k]; apply(); save();
    });
  });
  app.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (!window.confirm("Revenir à l'apparence par défaut (Clair) ?")) return;
    theme = "clair"; colors = {}; fillFields(); apply(); save();
  });
  fillFields();
  apply();
})();

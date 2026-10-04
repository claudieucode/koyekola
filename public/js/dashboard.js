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
      if (colors.sidebar) { base.sidebar = colors.sidebar; base.sidebarText = isDark(colors.sidebar) ? "#d6dee6" : "#2b3440"; }
      if (colors.primary) base.primary = colors.primary;
      if (colors.button) base.button = colors.button;
      base.accent = colors.accent || base.primary;
    }
    const accent = base.accent || base.primary;
    const sd = isDark(base.sidebar);
    return { "--dash-bg": base.bg, "--dash-card": base.card, "--dash-text": base.text, "--dash-muted": base.muted, "--dash-border": base.border, "--dash-sidebar": base.sidebar, "--dash-sidebar-text": base.sidebarText, "--dash-primary": base.primary, "--dash-accent": accent, "--dash-button": base.button, "--dash-button-text": isDark(base.button) ? "#ffffff" : "#102a3a", "--dash-hover": sd ? "rgba(255, 255, 255, 0.07)" : "rgba(15, 40, 60, 0.06)", "--dash-active-bg": sd ? "rgba(255, 255, 255, 0.12)" : `${accent}1a`, "--dash-active-text": sd ? "#ffffff" : accent };
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
    if (theme === "perso" && !Object.keys(colors).length) { const t = data.themes.clair; colors = { primary: t.primary, accent: t.primary, sidebar: t.sidebar, bg: t.bg, button: t.button }; fillFields(); }
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

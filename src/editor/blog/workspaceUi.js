// Interface de l'espace de travail SEO : menu « Espace de travail », palette de commandes (Cmd/Ctrl + Maj + K),
// réglages du Mode Fun et pont en LECTURE SEULE vers la couche ludique (chargée seulement si le Mode Fun est activé).
// Cmd+K reste « insérer un lien » dans l'éditeur, comme dans Gutenberg.

export function setupWorkspaceUi({ h, modal, control, input, toast, api, ws, data, renderers, DATA, postId, actions }) {
  const root = document.querySelector("[data-blog-editor]");
  const menuBtn = document.querySelector("[data-wsp-menu-toggle]");
  const menu = document.querySelector("[data-wsp-menu]");
  let fun = { ...(DATA.seoWorkspace && DATA.seoWorkspace.fun) };
  const funCommands = new Map();

  // ---------- Commandes (toutes déclenchent une action réelle) ----------
  function commands() {
    const list = [];
    for (const p of ws.panels()) list.push({ id: `panel:${p.key}`, group: "Panneaux", label: `${p.closed ? "Rouvrir" : "Afficher"} : ${p.title}`, run: () => ws.reveal(p.key) });
    for (const p of ws.presets()) list.push({ id: `preset:${p.id}`, group: "Dispositions", label: `Disposition : ${p.label}`, run: () => ws.applyPreset(p.id), disabled: ws.isCompact() });
    for (const s of ws.saved()) list.push({ id: `saved:${s.name}`, group: "Dispositions", label: `Ma disposition : ${s.name}`, run: () => ws.loadNamed(s.name).catch((e) => toast(e.message, "error")), disabled: ws.isCompact() });
    list.push({ id: "save-as", group: "Dispositions", label: "Enregistrer la disposition sous…", run: saveAsDialog, disabled: ws.isCompact() });
    list.push({ id: "focus", group: "Affichage", label: ws.inFocus() ? "Quitter le Mode Focus SEO" : "Mode Focus SEO (rédaction : note, recommandations, contenu)", run: () => (ws.inFocus() ? ws.exitFocus() : ws.enterFocus()), disabled: ws.isCompact() });
    list.push({ id: "reset", group: "Affichage", label: "Réinitialiser l'espace de travail…", run: () => ws.reset() });
    for (const a of actions()) list.push({ group: "Actions SEO", ...a });
    list.push({ id: "fun-toggle", group: "Mode Fun", label: fun.enabled ? "Désactiver le Mode Fun" : "Activer le Mode Fun 🎉", run: () => setFun({ enabled: !fun.enabled }) });
    list.push({ id: "fun-settings", group: "Mode Fun", label: "Réglages du Mode Fun…", run: funSettings });
    if (fun.enabled) for (const c of funCommands.values()) list.push({ group: "Mode Fun", ...c, run: () => { try { c.run(); } catch { /* la couche ludique ne doit jamais bloquer l'éditeur */ } } });
    return list.filter((c) => !c.hidden);
  }

  // ---------- Palette ----------
  let palette = null;
  function openPalette() {
    if (palette) return;
    const all = commands();
    const field = h("input", { type: "text", class: "wsp-palette-input", placeholder: "Rechercher une commande (panneau, disposition, action)…", "aria-label": "Rechercher une commande", role: "combobox", "aria-expanded": "true", "aria-controls": "wsp-palette-list", autocomplete: "off" });
    const list = h("ul", { class: "wsp-palette-list", id: "wsp-palette-list", role: "listbox", "aria-label": "Commandes" });
    const dlg = h("div", { class: "wsp-palette", role: "dialog", "aria-modal": "true", "aria-label": "Palette de commandes" }, h("div", { class: "wsp-palette-box" }, field, list, h("p", { class: "wsp-palette-help" }, "↑ ↓ pour choisir · Entrée pour lancer · Échap pour fermer")));
    let shown = [];
    let index = 0;
    const norm = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const draw = () => {
      const q = norm(field.value.trim());
      shown = all.filter((c) => !q || q.split(/\s+/).every((w) => norm(`${c.group} ${c.label}`).includes(w)));
      index = Math.min(index, Math.max(0, shown.length - 1));
      list.replaceChildren(...(shown.length ? shown.map((c, i) => h("li", { role: "option", id: `wsp-cmd-${i}`, "aria-selected": String(i === index), "aria-disabled": c.disabled ? "true" : null, class: `wsp-cmd${i === index ? " is-active" : ""}${c.disabled ? " is-disabled" : ""}`, onmousedown: (e) => { e.preventDefault(); run(i); } }, h("span", { class: "wsp-cmd-group" }, c.group), h("span", {}, c.label))) : [h("li", { class: "wsp-cmd is-empty" }, "Aucune commande ne correspond.")]));
      field.setAttribute("aria-activedescendant", shown.length ? `wsp-cmd-${index}` : "");
      list.querySelector(".is-active")?.scrollIntoView({ block: "nearest" });
    };
    const close = () => { dlg.remove(); palette = null; document.removeEventListener("keydown", trap, true); };
    const run = (i) => { const c = shown[i]; if (!c || c.disabled) return; close(); Promise.resolve().then(() => c.run()).catch((e) => toast(e.message || String(e), "error")); };
    const trap = (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); menuBtn?.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); index = Math.min(shown.length - 1, index + 1); draw(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); index = Math.max(0, index - 1); draw(); }
      else if (e.key === "Enter") { e.preventDefault(); run(index); }
      else if (e.key === "Tab") { e.preventDefault(); field.focus(); }
    };
    field.addEventListener("input", () => { index = 0; draw(); });
    dlg.addEventListener("mousedown", (e) => { if (e.target === dlg) close(); });
    document.addEventListener("keydown", trap, true);
    document.body.append(dlg);
    palette = dlg;
    draw();
    field.focus();
  }
  // Cmd/Ctrl + Maj + K : palette (Cmd+K seul reste « lien » dans le texte)
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") { e.preventDefault(); e.stopPropagation(); openPalette(); }
  }, true);

  // ---------- Menu « Espace de travail » ----------
  const item = (label, run, { role = "menuitem", checked, disabled, cls } = {}) => h("button", { type: "button", role, class: cls || null, "aria-checked": checked === undefined ? null : String(checked), disabled: disabled || null, onclick: () => { closeMenu(); Promise.resolve().then(run).catch((err) => toast(err.message || String(err), "error")); } }, label);
  function buildMenu() {
    const compact = ws.isCompact();
    const panelsList = ws.panels();
    menu.replaceChildren(
      h("p", { class: "wp-menu-label" }, "Panneaux SEO"),
      ...panelsList.map((p) => item(p.title, () => (p.closed ? ws.reopen(p.key) : ws.closePanel(p.key)), { role: "menuitemcheckbox", checked: !p.closed })),
      h("hr"),
      h("p", { class: "wp-menu-label" }, "Dispositions"),
      ...ws.presets().map((p) => item(p.label, () => ws.applyPreset(p.id), { disabled: compact })),
      ...ws.saved().map((s) => h("div", { class: "wsp-saved-row" }, item(`★ ${s.name}`, () => ws.loadNamed(s.name), { disabled: compact }), h("button", { type: "button", class: "wp-btn-icon wsp-saved-del", "aria-label": `Supprimer la disposition « ${s.name} »`, title: "Supprimer", onclick: async () => { closeMenu(); if (!window.confirm(`Supprimer la disposition « ${s.name} » ?`)) return; await ws.deleteNamed(s.name); toast("Disposition supprimée."); } }, "×"))),
      item("Enregistrer la disposition sous…", saveAsDialog, { disabled: compact }),
      h("hr"),
      item("Mode Focus SEO", () => (ws.inFocus() ? ws.exitFocus() : ws.enterFocus()), { role: "menuitemcheckbox", checked: ws.inFocus(), disabled: compact }),
      item("Palette de commandes   ⌘⇧K", openPalette),
      item("Réinitialiser l'espace de travail…", () => ws.reset()),
      h("hr"),
      item(`🎉 Mode Fun : ${fun.enabled ? "ON" : "OFF"}`, () => setFun({ enabled: !fun.enabled }), { role: "menuitemcheckbox", checked: Boolean(fun.enabled), cls: "wsp-fun-toggle" }),
      item("Réglages du Mode Fun…", funSettings),
      ...(compact ? [h("p", { class: "wp-help wsp-menu-note" }, "Sur petit écran, les panneaux restent dans la barre latérale (ancrage et fenêtres sur grand écran).")] : []));
  }
  function closeMenu() { menu.hidden = true; menuBtn.setAttribute("aria-expanded", "false"); }
  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = menu.hidden;
    document.querySelectorAll(".wp-menu").forEach((m) => { if (m !== menu) m.hidden = true; });
    if (open) { buildMenu(); menu.hidden = false; menuBtn.setAttribute("aria-expanded", "true"); menu.querySelector("button:not([disabled])")?.focus(); } else closeMenu();
  });
  document.addEventListener("click", (e) => { if (!menu.hidden && !menu.contains(e.target) && e.target !== menuBtn) closeMenu(); });
  menu.addEventListener("keydown", (e) => {
    const items = [...menu.querySelectorAll("button:not([disabled])")];
    const i = items.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); closeMenu(); menuBtn.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  });

  function saveAsDialog() {
    const name = input({ maxlength: 40, placeholder: "Ex. Mon espace SEO", value: "" });
    const err = h("p", { class: "wp-error", hidden: true });
    modal("Enregistrer la disposition", h("div", {}, control("Nom de la disposition", name, "Positions, tailles, panneaux ouverts et fermés, groupes et fenêtres flottantes."), err), [
      { label: "Annuler" },
      { label: "Enregistrer", primary: true, run: async () => {
        try { const r = await ws.saveAs(name.value.trim()); toast(`Disposition « ${r.name} » enregistrée.`); return false; } catch (e) { err.textContent = e.message; err.hidden = false; return true; }
      } },
    ]);
    setTimeout(() => name.focus(), 30);
  }

  // ---------- Mode Fun : réglages (le cœur de l'éditeur ne dépend jamais de la couche ludique) ----------
  async function setFun(patch) {
    const before = fun.enabled;
    try { fun = (await api("/formateur/blog/api/espace-seo/fun", { method: "PUT", json: { fun: patch } })).fun; } catch (e) { toast(e.message, "error"); return; }
    if (fun.enabled && !before) { loadFunLayer(); toast("Mode Fun activé. Les messages restent rares et se ferment d'un clic."); }
    if (!fun.enabled && before) { emitBridge("fun:off", null); toast("Mode Fun désactivé."); }
    emitBridge("fun:prefs", fun);
  }
  function funSettings() {
    const FLAGS = [["enabled", "Mode Fun"], ["humor", "Messages humoristiques"], ["eggs", "Easter eggs"], ["gamification", "Gamification (boss, points, badges)"], ["animations", "Réactions animées"], ["robot", "Assistant robot"], ["notifications", "Notifications ludiques"]];
    const draft = { ...fun };
    const body = h("div", { class: "wsp-fun-settings" },
      h("p", { class: "wp-help" }, "Couche ludique facultative : elle lit les vraies données SEO mais ne modifie jamais rien (note, contenu, réglages). Désactivée, l'éditeur fonctionne à 100 %."),
      ...FLAGS.map(([k, label]) => { const cb = h("input", { type: "checkbox", id: `wsp-fun-${k}`, checked: Boolean(draft[k]) }); cb.addEventListener("change", () => { draft[k] = cb.checked; }); return h("label", { class: "wp-checkbox", for: cb.id }, cb, ` ${label}`); }),
      h("label", { class: "wp-label", for: "wsp-fun-personality" }, "Personnalité"),
      (() => { const s = h("select", { id: "wsp-fun-personality" }, ...[["professionnel", "Professionnel (sobre, très rare)"], ["fun", "Fun"], ["chaotique", "Chaotique (plus bavard, toujours limité)"]].map(([v, l]) => h("option", { value: v, selected: draft.personality === v }, l))); s.addEventListener("change", () => { draft.personality = s.value; }); return s; })(),
      h("p", { class: "wp-help" }, `Progression ludique : ${fun.xp || 0} XP · ${(fun.badges || []).length} badge(s). Sans aucun effet sur le SEO.`));
    modal("Réglages du Mode Fun", body, [{ label: "Annuler" }, { label: "Enregistrer", primary: true, run: () => setFun(draft) }]);
  }

  // ---------- Pont vers la couche ludique (lecture seule) ----------
  const bridgeSubs = new Map();
  const safeClone = (v) => { try { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); } catch { return null; } };
  function emitBridge(type, payload) {
    for (const fn of bridgeSubs.get(type) || []) { try { fn(safeClone(payload)); } catch (e) { console.warn("[Mode Fun]", e); } }
  }
  // Résumé de l'analyse transmis à la couche ludique (lecture seule, copie)
  const forBridge = (a) => a && { score: a.score, summary: a.summary, words: a.words, checks: a.checks.map((c) => ({ id: c.id, group: c.group, status: c.status, label: c.label, advice: c.advice })), stats: a.stats ? { h1: a.stats.h1, h1InContent: a.stats.h1InContent, internalLinks: a.stats.internalLinks.length, externalLinks: a.stats.externalLinks.length, headings: a.stats.headings, images: a.stats.images } : null };
  data.on("*", (type, payload) => emitBridge(type, type === "analysis" ? forBridge(payload) : payload));
  window.KolakisaSEO = Object.freeze({
    version: 1,
    on(type, fn) { if (!bridgeSubs.has(type)) bridgeSubs.set(type, new Set()); bridgeSubs.get(type).add(fn); },
    // Lecture de données réelles déjà disponibles (même cache que les panneaux)
    read: async (part) => safeClone(part === "analysis" ? data.analysis() && { score: data.analysis().score, summary: data.analysis().summary, words: data.analysis().words } : await data.get(part).catch(() => null)),
    postId,
    reveal: (key) => ws.reveal(key),
    registerCommand: (c) => { if (c && c.id && c.label && typeof c.run === "function") funCommands.set(c.id, { id: `fun:${c.id}`, label: String(c.label), run: c.run }); },
    prefs: () => safeClone(fun),
    // Seule écriture permise : la progression ludique (points, badges), validée par le serveur
    saveProgress: async (p) => { try { fun = (await api("/formateur/blog/api/espace-seo/fun", { method: "PUT", json: { fun: { xp: p && p.xp, badges: p && p.badges } } })).fun; } catch { /* sans conséquence */ } return safeClone(fun); },
  });
  let funLoaded = false;
  function loadFunLayer() {
    if (funLoaded || !DATA.funScript) { if (funLoaded) { emitBridge("fun:on", fun); const a = data.analysis(); if (a) emitBridge("analysis", forBridge(a)); } return; }
    funLoaded = true;
    const s = document.createElement("script");
    s.src = DATA.funScript;
    s.async = true;
    s.onerror = () => { funLoaded = false; };
    s.onload = () => { const a = data.analysis(); if (a) emitBridge("analysis", forBridge(a)); };
    document.body.append(s);
  }
  if (fun.enabled) loadFunLayer();

  return { openPalette, emitBridge, funEnabled: () => Boolean(fun.enabled) };
}

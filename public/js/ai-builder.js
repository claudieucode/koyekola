// Interface « Assistant IA » de création de site (Programme 21.8). Aucune logique de moteur ici : ce script AFFICHE l'état renvoyé par le serveur (qui le lit dans les moteurs)
// et envoie des actions à l'API /marketing/ia/studio/… Tout texte venu du serveur ou de l'IA est inséré avec textContent (jamais innerHTML) : pas d'injection possible.
(() => {
  "use strict";
  const body = document.body, BASE = body.dataset.base, ID = body.dataset.id;
  const SITE = body.dataset.site || ""; // le site visé figure dans chaque adresse (?site=) : le serveur le revérifie, il ne fait jamais confiance au seul plan
  const withSite = (p) => (SITE ? `${p}${p.includes("?") ? "&" : "?"}site=${encodeURIComponent(SITE)}` : p);
  const CAN = { write: body.dataset.write === "1", design: body.dataset.design === "1", publish: body.dataset.publish === "1" };
  const $ = (id) => document.getElementById(id);
  let S = JSON.parse($("aib-initial").textContent);
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(`aib.${ID}.${k}`); if (v === null) localStorage.removeItem(`aib.${ID}.${k}`); else localStorage.setItem(`aib.${ID}.${k}`, v); } catch { return null; } return null; };
  const STEP_KEYS = S.steps.map((s) => s.key);
  let step = STEP_KEYS.includes(LS("step")) ? LS("step") : S.progress.current;
  let curPage = LS("page") || "";
  let previewPage = "", device = "desktop", lastSkipped = [], lastRetry = null, failedNetwork = null, busy = 0;
  const STATUS = { not_started: "Non commencé", in_progress: "En cours", to_review: "À vérifier", done: "Terminé", error: "Erreur" };
  const GEN = { none: "Non générée", proposed: "Proposition prête", draft: "Brouillon", published: "Publiée", missing: "Introuvable", unavailable: "Indisponible", invalid: "Invalide" };

  // ── DOM ──
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === false || v === null || v === undefined) continue;
      if (k === "class") el.className = v; else if (k === "text") el.textContent = v; else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else if (k === "value") el.value = v; else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const btn = (label, onclick, o = {}) => h("button", { type: "button", class: `aib-btn${o.primary ? " aib-btn-primary" : ""}${o.danger ? " aib-btn-danger" : ""}`, disabled: o.disabled, onclick, "aria-label": o.aria }, label);
  const badge = (status, label) => h("span", { class: `aib-badge is-${status}` }, label || STATUS[status] || status);
  const when = (ms) => (ms ? new Date(ms).toLocaleString("fr-FR") : "—");

  // ── Sauvegarde et erreurs ──
  const saveEl = $("aib-save"), saveT = $("aib-save-t");
  function setSave(kind, text) { saveEl.dataset.state = kind; saveT.textContent = text; }
  function banner(msg, actions) {
    const b = $("aib-banner"); b.replaceChildren(h("span", { text: msg }), ...(actions || []));
    b.hidden = !msg;
  }
  async function api(method, path, data, { raw = false } = {}) {
    busy += 1; if (method !== "GET") setSave("saving", "Enregistrement…");
    try {
      const r = await fetch(withSite(raw ? path : BASE + path), { method, credentials: "same-origin", headers: { Accept: "application/json", ...(data !== undefined ? { "Content-Type": "application/json" } : {}) }, body: data !== undefined ? JSON.stringify(data) : undefined });
      const j = await r.json().catch(() => null);
      if (!j || !r.ok || j.ok === false) { const e = new Error((j && j.error) || "Le serveur a répondu par une erreur."); e.status = r.status; e.code = j && j.code; throw e; }
      if (method !== "GET") setSave("saved", `Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
      banner("");
      return j;
    } catch (e) {
      const net = e instanceof TypeError;
      if (method !== "GET") setSave("error", "Échec de l'enregistrement");
      throw Object.assign(e, { network: net });
    } finally { busy -= 1; }
  }
  // Exécute une action : met l'état à jour et redessine ; toute erreur est expliquée, jamais silencieuse
  async function act(run, { retry = true } = {}) {
    lastRetry = run;
    try {
      const j = await run();
      failedNetwork = null;
      if (j && j.state) { S = j.state; }
      render();
      return j;
    } catch (e) {
      const actions = [];
      let msg = e.message;
      if (e.network) { msg = "Connexion perdue : l'action n'a pas été enregistrée. Vos modifications précédentes sont conservées."; failedNetwork = run; }
      else if (e.status === 409 && e.code === "conflict") { msg = `${e.message} Rechargez le projet pour voir la dernière version.`; actions.push(btn("Recharger", refresh)); }
      else if (e.status === 503) msg = `${e.message} Les fonctions IA ne sont pas disponibles pour le moment ; le reste de l'interface fonctionne.`;
      else if (e.status === 429) msg = `${e.message} Réessayez plus tard ou augmentez la limite d'utilisation.`;
      if (retry && (e.network || e.status === 503)) actions.push(btn("Réessayer", () => act(lastRetry)));
      banner(msg, actions);
      render();
      return null;
    }
  }
  async function refresh() { return act(async () => ({ state: (await api("GET", "/etat.json")).state })); }
  const rev = () => S.project.revision;
  const planOp = (operation, label) => act(() => api("POST", "/plan", { operation, revision: rev(), label }));

  // ── Dialogues (accessibles, sans window.prompt) ──
  const dlg = $("aib-dialog");
  function ask({ title, text, fields = [], ok = "Confirmer", danger = false }) {
    return new Promise((resolve) => {
      const form = h("form", { method: "dialog", class: "aib-form" }, h("h2", { text: title }), text ? h("p", { text }) : null,
        ...fields.map((f) => h("label", {}, f.label, f.type === "select" ? h("select", { name: f.name }, f.options.map((o) => h("option", { value: o.value, text: o.label }))) : h("input", { name: f.name, value: f.value || "", maxlength: f.max || 80, required: f.required !== false, autocomplete: "off" }))),
        h("div", { class: "aib-form-actions" }, h("button", { type: "button", class: "aib-btn", onclick: () => dlg.close("cancel") }, "Annuler"), h("button", { type: "submit", class: `aib-btn ${danger ? "aib-btn-danger" : "aib-btn-primary"}` }, ok)));
      dlg.replaceChildren(form);
      dlg.returnValue = "";
      dlg.oncancel = () => { dlg.returnValue = "cancel"; };
      dlg.onclose = () => { if (dlg.returnValue === "cancel" || !form.checkValidity()) return resolve(null); resolve(Object.fromEntries(new FormData(form))); };
      form.addEventListener("submit", (e) => { if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); } });
      dlg.showModal();
      const first = form.querySelector("input,select"); if (first) first.focus();
    });
  }
  const confirmDlg = (title, text, ok) => ask({ title, text, ok, danger: true }).then(Boolean);

  // ── Barre supérieure ──
  function renderTop() {
    $("aib-name").textContent = S.project.name;
    $("aib-progress-fill").style.width = `${S.progress.percent}%`;
    $("aib-progress-t").textContent = `${S.progress.done}/${S.progress.total} étapes`;
    $("aib-undo").disabled = !S.undo.canUndo || !CAN.write; $("aib-undo").title = S.undo.undoLabel ? `Annuler : ${S.undo.undoLabel}` : "Rien à annuler";
    $("aib-redo").disabled = !S.undo.canRedo || !CAN.write; $("aib-redo").title = S.undo.redoLabel ? `Rétablir : ${S.undo.redoLabel}` : "Rien à rétablir";
    $("aib-publish").hidden = !(CAN.publish && S.canPublish);
  }
  function renderSteps() {
    const ol = $("aib-steps"); ol.replaceChildren();
    S.steps.forEach((s, i) => ol.append(h("li", {}, h("button", { type: "button", class: `aib-step is-${s.status}`, "data-key": s.key, "aria-current": s.key === step ? "step" : false, onclick: () => go(s.key) },
      h("span", { class: "aib-step-n", text: String(i + 1) }), h("span", { class: "aib-step-t" }, h("strong", { text: s.label }), h("small", { text: s.detail }), badge(s.status))))));
  }
  function go(key) { step = key; LS("step", key); render(); const m = $("aib-main"); m.scrollTop = 0; }

  // ── Étape 1 : brief ──
  function stepBrief() {
    const wrap = h("div", { class: "aib-pane" });
    wrap.append(h("h1", { text: "Brief du projet" }), h("p", { class: "aib-lead", text: "Voici votre description. L'analyse est faite par le Brief Analyzer de Kolakisa ; vous gardez le contrôle sur chaque information." }));
    wrap.append(h("blockquote", { class: "aib-brief", text: S.brief }));
    if (S.readiness) wrap.append(h("p", {}, "Niveau de préparation du brief : ", h("strong", { text: S.readiness.level || "—" }), S.readiness.summary ? ` — ${S.readiness.summary}` : ""));
    const saved = Object.fromEntries((S.answers || []).map((a) => [a.id, a.answer]));
    let draft = {}; try { draft = JSON.parse(LS("answers") || "{}"); } catch { draft = {}; }
    if (S.questions.length) {
      wrap.append(h("h2", { text: `Questions de l'IA (${S.questions.length})` }), h("p", { class: "aib-hint", text: "Toutes sont facultatives : répondez à celles qui comptent. Vos réponses en cours sont gardées dans ce navigateur." }));
      const form = h("form", { class: "aib-qs", onsubmit: async (e) => { e.preventDefault(); const answers = {}; for (const q of S.questions) { const v = form.elements[q.id].value.trim(); if (v) answers[q.id] = v; } await act(() => api("POST", "/reponses", { answers, revision: rev() })); LS("answers", null); } });
      for (const q of S.questions) {
        const ta = h("textarea", { name: q.id, rows: 2, maxlength: 300, value: draft[q.id] ?? saved[q.id] ?? "", oninput: (e) => { draft[q.id] = e.target.value; LS("answers", JSON.stringify(draft)); } });
        form.append(h("label", { class: "aib-q" }, h("span", { text: q.question }), q.why ? h("small", { text: q.why }) : null, ta));
      }
      form.append(btn("Enregistrer mes réponses", () => form.requestSubmit(), { primary: true, disabled: !CAN.write }));
      wrap.append(form);
    } else wrap.append(h("p", { class: "aib-ok", text: "Aucune question en attente." }));
    if ((S.answers || []).length) wrap.append(h("details", {}, h("summary", { text: `Vos réponses (${S.answers.length})` }), h("ul", {}, S.answers.map((a) => h("li", {}, h("strong", { text: a.question }), ` — ${a.answer}`)))));
    if (!S.plan) {
      const assume = h("input", { type: "checkbox", id: "aib-assume" });
      wrap.append(h("div", { class: "aib-cta" }, h("label", {}, assume, " Continuer même si certaines informations manquent (les hypothèses seront signalées dans le plan)"),
        btn("Créer le plan du site", () => act(() => api("POST", "/planifier", { proceedWithAssumptions: assume.checked })).then(() => go("plan")), { primary: true, disabled: !CAN.write })));
    } else wrap.append(h("div", { class: "aib-cta" }, btn("Voir le plan du site", () => go("plan"), { primary: true })));
    wrap.append(h("p", { class: "aib-hint", text: "Pour repartir d'une autre description, créez un nouveau projet depuis la page d'accueil des projets : le brief d'un projet analysé n'est pas modifiable, seules vos réponses aux questions le sont." }));
    return wrap;
  }

  // ── Étape 2 : plan ──
  const SEC_LABEL = { hero: "Bandeau", text: "Texte", image: "Image", list: "Liste", course: "Formations", button: "Bouton", quote: "Citation", form: "Formulaire", features: "Points forts", faq: "Questions fréquentes", cta: "Appel à l'action", video: "Vidéo", testimonials: "Témoignages", divider: "Séparateur" };
  function stepPlan() {
    const wrap = h("div", { class: "aib-pane" });
    wrap.append(h("h1", { text: "Plan du site" }));
    const p = S.plan;
    if (!p) { wrap.append(h("p", { text: "Le plan n'existe pas encore. Créez-le depuis l'étape Brief." }), btn("Aller au brief", () => go("brief"))); return wrap; }
    const err = (p.warnings || []).filter((w) => w.level === "error"), warn = (p.warnings || []).filter((w) => w.level !== "error");
    wrap.append(h("p", { class: "aib-lead" }, h("strong", { text: p.site.name }), p.site.description ? ` — ${p.site.description}` : "", ` · ${p.pages.length} page(s)`));
    for (const w of err) wrap.append(h("p", { class: "aib-msg is-error", role: "alert", text: w.message }));
    for (const w of warn) wrap.append(h("p", { class: "aib-msg is-warn", text: w.message }));
    const bar = h("div", { class: "aib-bar" });
    if (CAN.write) {
      bar.append(btn("Renommer le site", async () => { const r = await ask({ title: "Renommer le site", fields: [{ name: "name", label: "Nom du site", value: p.site.name }], ok: "Renommer" }); if (r) planOp({ op: "rename_site", name: r.name }, "Renommage du site"); }),
        btn("Ajouter une page", addPageDialog));
      bar.append(S.project.status === "validated" ? badge("done", "Plan validé") : btn("Valider le plan", () => act(() => api("POST", "/plan/valider", { revision: rev() })), { primary: true }));
    }
    wrap.append(bar);
    for (const pg of p.pages) wrap.append(pageCard(pg));
    if ((p.features || []).length) wrap.append(h("h2", { text: "Fonctionnalités" }), h("ul", { class: "aib-feat" }, p.features.map((f) => h("li", {}, h("strong", { text: f.label || f.key }), ` · ${f.level}`, f.availability && f.availability !== "available" ? h("em", { text: ` (${f.availability === "partial" ? "partiel" : "indisponible"})` }) : null, f.reason ? h("small", { text: ` ${f.reason}` }) : null))));
    const recs = (p.recommendations || []).filter((r) => !r.accepted && !(p.rejectedRecommendations || []).includes(r.id));
    if (recs.length) wrap.append(h("h2", { text: "Suggestions de l'IA" }), h("ul", { class: "aib-recs" }, recs.map((r) => h("li", {}, h("span", { text: r.text }), CAN.write ? h("span", { class: "aib-inline" }, btn("Accepter", () => planOp({ op: "accept_recommendation", id: r.id }, "Suggestion acceptée")), btn("Refuser", () => planOp({ op: "reject_recommendation", id: r.id }, "Suggestion refusée"))) : null))));
    if ((p.assumptions || []).length) wrap.append(h("details", {}, h("summary", { text: `Hypothèses de l'IA (${p.assumptions.length})` }), h("ul", {}, p.assumptions.map((a) => h("li", { text: typeof a === "string" ? a : a.text || JSON.stringify(a) })))));
    wrap.append(h("div", { class: "aib-cta" }, btn("Continuer vers les pages", () => go("pages"), { primary: true, disabled: S.project.status !== "validated" }), S.project.status !== "validated" ? h("small", { text: "Validez d'abord le plan." }) : null));
    return wrap;
  }
  async function addPageDialog() {
    const r = await ask({ title: "Ajouter une page", fields: [{ name: "name", label: "Nom de la page" }, { name: "purpose", label: "Objectif (facultatif)", required: false, max: 240 }, { name: "pageType", label: "Type", type: "select", options: [{ value: "autre", label: "Autre" }, ...S.capabilities.pageTypes.map((t) => ({ value: t.id, label: t.label || t.id }))] }], ok: "Ajouter" });
    if (r) planOp({ op: "add_page", name: r.name, pageType: r.pageType, purpose: r.purpose || "" }, `Ajout de la page « ${r.name} »`);
  }
  function pageCard(pg) {
    const nav = S.plan.navigation || {}, menu = pg.menu && pg.menu !== "none" ? pg.menu : null;
    const pos = menu ? (nav[menu] || []).indexOf(pg.key) : -1;
    const head = h("div", { class: "aib-card-head" }, h("h3", {}, h("button", { type: "button", class: "aib-link", onclick: () => { curPage = pg.key; LS("page", pg.key); renderCtx(); } , text: pg.name })), h("span", { class: "aib-meta", text: `/${pg.slug} · ${pg.pageType}${pg.origin === "user" ? " · ajoutée par vous" : ""}` }));
    const actions = h("div", { class: "aib-inline" });
    if (CAN.write) {
      actions.append(btn("Renommer", async () => { const r = await ask({ title: "Renommer la page", fields: [{ name: "name", label: "Nom", value: pg.name }], ok: "Renommer" }); if (r) planOp({ op: "rename_page", key: pg.key, name: r.name }, `Renommage de « ${pg.name} »`); }),
        btn("Objectif", async () => { const r = await ask({ title: `Objectif de « ${pg.name} »`, fields: [{ name: "purpose", label: "Objectif de la page", value: pg.purpose, max: 240, required: false }], ok: "Enregistrer" }); if (r) planOp({ op: "set_page", key: pg.key, purpose: r.purpose }, `Objectif de « ${pg.name} »`); }),
        btn("Dupliquer", () => act(() => api("POST", "/plan/dupliquer", { key: pg.key, revision: rev() }))));
      if (menu && pos > 0) actions.append(btn("↑", () => planOp({ op: "move_in_navigation", menu, key: pg.key, to: pos - 1 }, `Déplacement de « ${pg.name} »`), { aria: `Monter la page ${pg.name}` }));
      if (menu && pos >= 0 && pos < (nav[menu] || []).length - 1) actions.append(btn("↓", () => planOp({ op: "move_in_navigation", menu, key: pg.key, to: pos + 1 }, `Déplacement de « ${pg.name} »`), { aria: `Descendre la page ${pg.name}` }));
      actions.append(btn("Supprimer", async () => { if (await confirmDlg(`Supprimer la page « ${pg.name} » ?`, "Elle disparaît du plan avec ses sections. Vous pourrez annuler tant que vous restez sur ce projet.", "Supprimer")) planOp({ op: "remove_page", key: pg.key }, `Suppression de « ${pg.name} »`); }, { danger: true }));
    }
    const secs = h("ol", { class: "aib-secs" }, pg.sections.map((s, i) => h("li", {}, h("span", { class: "aib-sec-t" }, h("strong", { text: SEC_LABEL[s.type] || s.type }), " — ", s.purpose || "(sans objectif)"),
      CAN.write ? h("span", { class: "aib-inline" },
        i > 0 ? btn("↑", () => planOp({ op: "move_section", pageKey: pg.key, key: s.key, to: i - 1 }, "Déplacement d'une section"), { aria: "Monter la section" }) : null,
        i < pg.sections.length - 1 ? btn("↓", () => planOp({ op: "move_section", pageKey: pg.key, key: s.key, to: i + 1 }, "Déplacement d'une section"), { aria: "Descendre la section" }) : null,
        btn("Modifier", async () => { const r = await ask({ title: "Modifier la section", fields: [{ name: "purpose", label: "Objectif de la section", value: s.purpose, max: 160 }], ok: "Enregistrer" }); if (r) planOp({ op: "set_section", pageKey: pg.key, key: s.key, purpose: r.purpose }, "Modification d'une section"); }),
        btn("Retirer", async () => { if (await confirmDlg("Retirer cette section ?", `La section « ${SEC_LABEL[s.type] || s.type} » de « ${pg.name} » sera retirée du plan.`, "Retirer")) planOp({ op: "remove_section", pageKey: pg.key, key: s.key }, "Suppression d'une section"); }, { danger: true })) : null)));
    const add = CAN.write ? btn("Ajouter une section", async () => {
      const r = await ask({ title: `Ajouter une section à « ${pg.name} »`, fields: [{ name: "type", label: "Type de section", type: "select", options: S.capabilities.sectionTypes.filter((t) => !["layout", "component", "divider"].includes(t)).map((t) => ({ value: t, label: SEC_LABEL[t] || t })) }, { name: "purpose", label: "Objectif", max: 160 }], ok: "Ajouter" });
      if (r) planOp({ op: "add_section", pageKey: pg.key, type: r.type, purpose: r.purpose }, `Ajout d'une section à « ${pg.name} »`);
    }) : null;
    return h("article", { class: `aib-card${curPage === pg.key ? " is-current" : ""}` }, head, pg.purpose ? h("p", { class: "aib-purpose", text: pg.purpose }) : null, actions, secs, add);
  }

  // ── Étape 3 : pages ──
  function stepPages() {
    const wrap = h("div", { class: "aib-pane" }, h("h1", { text: "Pages" }));
    if (S.project.status !== "validated") { wrap.append(h("p", { text: "Validez d'abord le plan du site." }), btn("Aller au plan", () => go("plan"))); return wrap; }
    if (!S.project.siteActive) { wrap.append(h("p", { class: "aib-msg is-error", text: "Le site de ce projet est absent ou archivé : restaurez-le pour générer des pages." })); return wrap; }
    const run = S.runs.pages;
    const useAi = h("input", { type: "checkbox", id: "aib-useai" });
    if (CAN.write) wrap.append(h("div", { class: "aib-bar" }, btn(run ? "Régénérer toutes les pages" : "Générer les pages", () => genPages(null, useAi.checked), { primary: true }),
      h("label", { class: "aib-inline" }, useAi, " Rédiger des textes avec l'IA (consomme votre quota IA)")));
    wrap.append(h("p", { class: "aib-hint", text: "La génération ne publie rien : les pages sont créées en brouillon. Une page déjà existante n'est jamais écrasée sans votre choix explicite." }));
    for (const s of lastSkipped) wrap.append(h("p", { class: "aib-msg is-warn", text: `${s.page}${s.section ? ` (${s.section})` : ""} : ${s.why}` }));
    const table = h("table", { class: "aib-table" }, h("caption", { class: "aib-sr", text: "Pages du plan" }), h("thead", {}, h("tr", {}, ["Page", "Adresse", "Sections", "État", "Modifiée", "Actions"].map((t) => h("th", { scope: "col", text: t })))));
    const tb = h("tbody"); const decisions = {};
    for (const pg of S.pages) {
      const pr = run && run.pages.find((x) => x.key === slug(pg.key));
      const a = h("td", { class: "aib-actions-cell" });
      if (pg.pageId) a.append(h("a", { class: "aib-btn", href: `/marketing/pages/${pg.pageId}/editeur`, target: "_blank", rel: "noopener" }, "Ouvrir dans l'éditeur"), btn("Aperçu", () => { previewPage = String(pg.pageId); go("apercu"); }));
      if (CAN.write && S.runs.pages) a.append(btn("Régénérer", () => genPages([slug(pg.key)], false), { aria: `Régénérer la page ${pg.name}` }));
      let state = h("td", {}, badge(pg.generation === "published" || pg.generation === "draft" ? "done" : pg.generation === "proposed" ? "in_progress" : pg.generation === "none" ? "not_started" : "error", GEN[pg.generation] || pg.generation), pg.detail ? h("small", { text: ` ${pg.detail}` }) : null);
      if (pr && pr.status === "ready" && !pg.pageId && run.status === "proposed") {
        const sel = h("select", { "aria-label": `Stratégie pour ${pg.name}`, onchange: (e) => { decisions[slug(pg.key)] = e.target.value; } }, ...(pr.existing ? [h("option", { value: "", text: "— Une page existe déjà : choisir —" }), h("option", { value: "version", text: "Nouvelle version de la page existante" }), h("option", { value: "replace", text: "Remplacer le contenu" }), h("option", { value: "create", text: "Créer une autre page" }), h("option", { value: "skip", text: "Ne pas générer" })] : [h("option", { value: "create", text: "Créer en brouillon" }), h("option", { value: "skip", text: "Ne pas générer" })]));
        if (!pr.existing) decisions[slug(pg.key)] = "create";
        state = h("td", {}, badge("in_progress", GEN.proposed), " ", sel, pr.warnings && pr.warnings.length ? h("details", {}, h("summary", { text: `${pr.warnings.length} remarque(s)` }), h("ul", {}, pr.warnings.map((w) => h("li", { text: w })))) : null);
        if (run.id) a.append(h("a", { class: "aib-btn", href: `/marketing/site-web/sites/${S.project.siteId}/generateur/${run.id}/apercu?page=${encodeURIComponent(slug(pg.key))}`, target: "_blank", rel: "noopener" }, "Voir la proposition"));
      }
      tb.append(h("tr", {}, h("th", { scope: "row", text: pg.name }), h("td", { text: `/${pg.slug}` }), h("td", { text: String(pg.sections) }), state, h("td", { text: when(pg.updatedAt ? Date.parse(String(pg.updatedAt).replace(" ", "T") + "Z") || pg.updatedAt : null) }), a));
    }
    table.append(tb); wrap.append(table);
    if (run && run.status === "proposed" && CAN.write) {
      const conf = h("input", { type: "checkbox", id: "aib-confirm-replace" });
      wrap.append(h("div", { class: "aib-cta" }, h("label", {}, conf, " Je confirme le remplacement des pages pour lesquelles j'ai choisi « Remplacer »"), btn("Appliquer en brouillon", () => act(async () => { const j = await api("POST", `/pages/${run.id}/appliquer`, { decisions, confirmReplace: conf.checked }); lastSkipped = []; return j; }), { primary: true })));
    }
    if (run && run.status === "applied" && CAN.write) wrap.append(h("div", { class: "aib-cta" }, btn("Annuler cette génération", async () => { if (await confirmDlg("Annuler la génération ?", "Les pages créées par cette génération et restées intactes sont retirées ; celles que vous avez modifiées depuis sont conservées et listées.", "Annuler la génération")) act(() => api("POST", `/pages/${run.id}/annuler`, {})); }, { danger: true })));
    return wrap;
  }
  const slug = (k) => String(k).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || k;
  function genPages(only, useAi) { return act(async () => { const j = await api("POST", "/pages/generer", { useAi, only }); lastSkipped = j.skipped || []; return j; }); }

  // ── Étape 4 : design ──
  function stepDesign() {
    const wrap = h("div", { class: "aib-pane" }, h("h1", { text: "Design et identité visuelle" }));
    if (!S.project.siteActive) { wrap.append(h("p", { class: "aib-msg is-error", text: "Le site de ce projet est absent ou archivé." })); return wrap; }
    const run = S.runs.design;
    if (CAN.design) {
      const brief = h("textarea", { id: "aib-design-brief", rows: 3, maxlength: 2000, placeholder: "Décrivez le style souhaité (ambiance, couleurs, références)…", value: LS("designBrief") || "", oninput: (e) => LS("designBrief", e.target.value) });
      const ai = h("input", { type: "checkbox" });
      wrap.append(h("div", { class: "aib-bar aib-col" }, h("label", { for: "aib-design-brief", text: "Style souhaité" }), brief, h("div", { class: "aib-inline" }, btn(run ? "Demander de nouvelles propositions" : "Proposer des directions artistiques", () => act(() => api("POST", "/design/generer", { brief: { text: brief.value }, useAi: ai.checked })), { primary: true }), h("label", { class: "aib-inline" }, ai, " Affiner avec l'IA (consomme votre quota)"))));
    } else wrap.append(h("p", { class: "aib-msg is-warn", text: "Votre rôle ne permet pas de modifier l'apparence : vous pouvez seulement consulter." }));
    wrap.append(h("p", { class: "aib-hint", text: "Appliquer une proposition l'ajoute au BROUILLON du personnalisateur ; rien n'est publié. Vos réglages manuels sont conservés sauf demande contraire." }));
    if (!run) { wrap.append(h("p", { text: "Aucune proposition pour le moment." })); return wrap; }
    const grid = h("div", { class: "aib-grid" });
    for (const p of run.proposals) {
      const swatches = p.colors ? Object.entries(p.colors).filter(([, v]) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v)).slice(0, 8) : [];
      grid.append(h("article", { class: `aib-card${run.chosen === p.key ? " is-current" : ""}` }, h("h3", { text: p.name }), h("p", { text: p.description }),
        swatches.length ? h("div", { class: "aib-swatches", role: "img", "aria-label": `Palette : ${swatches.map(([k, v]) => `${k} ${v}`).join(", ")}` }, swatches.map(([k, v]) => h("span", { class: "aib-swatch", style: `background:${v}`, title: `${k} ${v}` }))) : null,
        p.fonts ? h("p", { class: "aib-meta", text: `Polices : ${Object.values(p.fonts).filter((v) => typeof v === "string").join(" / ")}` }) : null,
        p.ok === false ? h("p", { class: "aib-msg is-error", text: "Cette variante n'est pas valide (contraste insuffisant)." }) : null,
        p.pros && p.pros.length ? h("ul", {}, p.pros.slice(0, 3).map((x) => h("li", { text: x }))) : null,
        p.limits && p.limits.length ? h("ul", { class: "aib-limits" }, p.limits.slice(0, 2).map((x) => h("li", { text: x }))) : null,
        h("div", { class: "aib-inline" }, btn("Comparer", () => compareDesign(run.id, p.key)), CAN.design && run.status !== "applied" && p.ok !== false ? btn("Appliquer", () => applyDesign(run.id, p.key), { primary: true }) : null)));
    }
    wrap.append(grid);
    if (S.runs.designApplied) wrap.append(h("div", { class: "aib-cta" }, h("p", { text: `Direction artistique appliquée au brouillon du personnalisateur (${S.runs.designApplied.applied ? S.runs.designApplied.applied.count : "?"} réglage(s)).` }), h("a", { class: "aib-btn", href: `/marketing/site-web/personnaliser?site=${S.project.siteId}`, target: "_blank", rel: "noopener" }, "Ajuster les couleurs et polices dans le personnalisateur"), CAN.design ? btn("Annuler l'application", () => act(() => api("POST", `/design/${S.runs.designApplied.id}/annuler`, {})), { danger: true }) : null));
    return wrap;
  }
  async function compareDesign(rid, key) {
    try {
      const j = await api("GET", `/design/${rid}/comparer?variante=${encodeURIComponent(key)}`);
      const rows = (j.comparison.rows || j.comparison.changes || []).slice(0, 60);
      dlg.replaceChildren(h("div", { class: "aib-form" }, h("h2", { text: "Comparaison avant / après" }), rows.length ? h("table", { class: "aib-table" }, h("thead", {}, h("tr", {}, ["Réglage", "Actuel", "Proposé", "État"].map((t) => h("th", { scope: "col", text: t })))), h("tbody", {}, rows.map((r) => h("tr", {}, h("th", { scope: "row", text: r.label || r.path || r.key || "" }), h("td", { text: String(r.current ?? r.before ?? "") }), h("td", { text: String(r.proposed ?? r.after ?? "") }), h("td", { text: r.protected ? "Votre réglage (conservé)" : r.state || "" }))))) : h("p", { text: "Aucune différence à afficher." }), h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close()))));
      dlg.onclose = null; dlg.showModal();
    } catch (e) { banner(e.message); }
  }
  async function applyDesign(rid, key) { await act(() => api("POST", `/design/${rid}/appliquer`, { variante: key })); }

  // ── Étape 5 : contenus (Content Generator 21.6) ──
  const SRC = { ai: "Généré par IA", user: "Modifié par vous", example: "Texte d'exemple" };
  const CONTENT = (p = "") => `/marketing/site-web/sites/${S.project.siteId}/contenus${p}`;
  async function content(method, path, data) { return api(method, CONTENT(path), data, { raw: true }); }
  function stepContenus() {
    const wrap = h("div", { class: "aib-pane" }, h("h1", { text: "Contenus" }));
    const gen = S.pages.filter((p) => p.pageId);
    if (!gen.length) { wrap.append(h("p", { text: "Générez d'abord les pages." }), btn("Aller aux pages", () => go("pages"))); return wrap; }
    wrap.append(h("p", { class: "aib-hint", text: "Les textes d'exemple apparaissent entre crochets dans les pages. Générez des textes par page, modifiez-les, puis appliquez-les au brouillon : rien n'est remplacé sans votre action, et vos modifications manuelles sont protégées." }));
    const table = h("table", { class: "aib-table" }, h("caption", { class: "aib-sr", text: "Contenus par page" }), h("thead", {}, h("tr", {}, ["Page", "Jeu de textes", "Actions"].map((t) => h("th", { scope: "col", text: t })))));
    const tb = h("tbody");
    for (const pg of gen) {
      const sets = (S.runs.content || []).filter((s) => s.page_id === pg.pageId);
      const set = sets[0];
      tb.append(h("tr", {}, h("th", { scope: "row", text: pg.name }), h("td", {}, set ? [badge(set.status === "applied" ? "done" : set.status === "accepted" ? "done" : "to_review", { applied: "Appliqué", accepted: "Validé", draft: "À vérifier", discarded: "Écarté" }[set.status] || set.status), ` modifié ${when(set.updated_at)}`] : badge("not_started", "Aucun texte généré")),
        h("td", { class: "aib-actions-cell" }, set ? btn("Voir et modifier", () => openSet(set.id, pg)) : null, CAN.write ? btn(set ? "Régénérer les textes vides" : "Générer les textes", async () => { const j = await act(() => content("POST", "/generer", { pageId: pg.pageId, scope: "empty" })); if (j && j.set) { await refresh(); openSet(j.set.id, pg); } }) : null)));
    }
    table.append(tb); wrap.append(table);
    return wrap;
  }
  async function openSet(sid, pg) {
    let set;
    try { set = (await content("GET", `/ensembles/${sid}`)).set; } catch (e) { return banner(e.message); }
    const ro = !CAN.write;
    const fields = Object.entries(set.fields || {});
    const list = h("div", { class: "aib-fields" });
    for (const [key, f] of fields) {
      const ta = h("textarea", { rows: Math.min(6, Math.max(2, String(f.value || "").split("\n").length)), maxlength: f.max || 4000, disabled: ro || f.locked, "aria-label": f.label || key }, f.value || "");
      ta.value = f.value || "";
      const ops = h("select", { "aria-label": `Réviser ${f.label || key}`, disabled: ro || f.locked }, h("option", { value: "", text: "Réviser avec l'IA…" }), ...[["rewrite", "Reformuler"], ["shorten", "Raccourcir"], ["expand", "Développer"], ["professional", "Plus professionnel"], ["commercial", "Plus commercial"], ["simplify", "Simplifier"], ["fix", "Corriger"]].map(([v, t]) => h("option", { value: v, text: t })));
      ops.addEventListener("change", async () => { if (!ops.value) return; try { await content("POST", `/ensembles/${sid}/reviser`, { field: key, op: ops.value }); } catch (e) { banner(e.message); } dlg.close(); await refresh(); openSet(sid, pg); });
      list.append(h("div", { class: "aib-field" }, h("div", { class: "aib-field-head" }, h("strong", { text: f.label || key }), h("span", { class: `aib-src is-${f.source || "example"}`, text: f.locked ? "Verrouillé" : SRC[f.source] || f.source || "" })), ta,
        ro ? null : h("div", { class: "aib-inline" }, btn("Enregistrer ce texte", async () => { try { await content("POST", `/ensembles/${sid}/modifier`, { field: key, text: ta.value }); dlg.close(); await refresh(); openSet(sid, pg); } catch (e) { banner(e.message); } }), ops,
          btn(f.locked ? "Déverrouiller" : "Verrouiller", async () => { try { await content("POST", `/ensembles/${sid}/verrouiller`, { field: key, locked: !f.locked }); dlg.close(); await refresh(); openSet(sid, pg); } catch (e) { banner(e.message); } }))));
    }
    const seo = set.seo && (set.seo.title || set.seo.description) ? h("div", { class: "aib-field" }, h("strong", { text: "Textes pour les moteurs de recherche (IA)" }), h("p", { text: set.seo.title || "" }), h("p", { text: set.seo.description || "" })) : null;
    const issues = (set.issues || []).slice(0, 8);
    dlg.replaceChildren(h("div", { class: "aib-form aib-wide" }, h("h2", { text: `Textes de « ${pg.name} »` }), h("p", { class: "aib-hint", text: `État : ${set.status}. Cadre éditorial : aucun fait (chiffres, noms, prix) n'est inventé ; les données manquantes restent à fournir.` }),
      ...issues.map((i) => h("p", { class: "aib-msg is-warn", text: typeof i === "string" ? i : i.message || JSON.stringify(i) })), list, seo,
      h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close()), ro ? null : btn("Valider le jeu de textes", async () => { try { await content("POST", `/ensembles/${sid}/accepter`, {}); dlg.close(); await refresh(); } catch (e) { banner(e.message); } }),
        ro ? null : btn("Appliquer au brouillon de la page", async () => { try { await content("POST", `/ensembles/${sid}/appliquer`, { pageId: pg.pageId }); dlg.close(); await refresh(); } catch (e) { banner(e.message); } }, { primary: true }))));
    dlg.onclose = null; dlg.showModal();
  }

  // ── Étape 6 : images et médias (AI Media Generator + Asset Manager, 21.7) ──
  const NEED = { needed: ["to_review", "À pourvoir"], queued: ["in_progress", "En cours"], generated: ["to_review", "Image générée : à accepter"], assigned: ["done", "En place"], skipped: ["done", "Ignoré"], no_slot: ["error", "Sans emplacement"] };
  const TASK = { queued: "En attente", running: "En cours", succeeded: "Terminée", failed: "Échec", cancelled: "Annulée" };
  let libCache = null, pollTimer = null;
  const money = (e) => (e.totalMicroUsd === null ? "coût inconnu (tarif non vérifié)" : `${(e.totalMicroUsd / 1e6).toFixed(4)} USD (${e.kind}, tarif ${e.priceStatus})`);
  async function loadLib(force) { if (!libCache || force) { try { libCache = (await api("GET", "/media/bibliotheque")).items; } catch { libCache = []; } } return libCache; }
  function stepMedias() {
    const wrap = h("div", { class: "aib-pane aib-pane-wide" }, h("h1", { text: "Images et médias" }));
    if (!S.pages.some((p) => p.pageId)) { wrap.append(h("p", { text: "Générez d'abord les pages." }), btn("Aller aux pages", () => go("pages"))); return wrap; }
    const M = S.media;
    wrap.append(h("p", { class: `aib-msg ${M.generation.available ? "is-warn" : "is-warn"}`, text: M.generation.reason || "Un fournisseur d'images réel est utilisable." }));
    wrap.append(h("p", {}, h("strong", { text: `${M.slots.length} emplacement(s) d'image` }), ` dont ${M.missing} sans image. `, h("a", { class: "aib-link", href: `/marketing/site-web/mediatheque?site=${S.project.siteId}`, target: "_blank", rel: "noopener", text: "Ouvrir la médiathèque du site" })));
    wrap.append(h("div", { class: "aib-bar" }, CAN.write ? btn(M.needs.length ? "Actualiser les besoins visuels" : "Analyser les besoins visuels", () => act(() => api("POST", "/media/planifier", {})), { primary: !M.needs.length }) : null,
      M.running ? h("span", { class: "aib-badge is-in_progress", role: "status", text: `${M.running} génération(s) en cours…` }) : null));
    wrap.append(h("details", {}, h("summary", { text: "Fournisseurs d'images" }), h("ul", {}, M.providers.map((p) => h("li", {}, h("strong", { text: p.label }), ` — ${p.usable ? "utilisable" : "indisponible"}`, p.integration ? ` (${p.integration})` : "", !p.usable && p.why ? h("small", { text: ` ${p.why}` }) : null)))));
    if (!M.needs.length) { wrap.append(h("p", { text: "Aucun besoin visuel analysé pour le moment : lancez l'analyse pour lister les images à fournir." })); return wrap; }
    const tasksOf = (key) => M.tasks.filter((t) => t.needKey === key);
    const grid = h("div", { class: "aib-grid" });
    for (const n of M.needs) {
      const [st, label] = NEED[n.status] || ["not_started", n.status];
      const ts = tasksOf(n.key);
      const card = h("article", { class: `aib-card${n.status === "needed" ? " is-missing" : ""}` }, h("h3", { text: `${n.pageName} — ${n.slot || n.widget}` }), badge(st, label), h("p", { class: "aib-purpose", text: n.description }), h("p", { class: "aib-meta", text: `Consigne : ${n.prompt}` }), n.reason && n.status !== "assigned" ? h("p", { class: "aib-meta", text: n.reason }) : null);
      // images candidates des générations terminées (à accepter ou refuser)
      const lib = libCache || [];
      for (const t of ts.filter((x) => x.status === "succeeded").slice(0, 1)) {
        const row = h("div", { class: "aib-cands" });
        for (const mid of t.mediaIds || []) { const it = lib.find((x) => x.id === mid); row.append(h("figure", {}, it ? h("img", { class: "aib-thumb", src: it.path, alt: it.alt || "Image générée", loading: "lazy" }) : h("div", { class: "aib-thumb aib-thumb-empty", text: `Image ${mid}` }), CAN.write && n.status !== "assigned" ? h("div", { class: "aib-inline" }, btn("Accepter", () => assignMedia(n, mid), { primary: true }), btn("Refuser", () => act(() => api("POST", "/media/generer", { needKeys: [n.key], provider: t.provider, model: t.model, variants: t.variants, regenerate: true })))) : null)); }
        card.append(row);
      }
      for (const t of ts.filter((x) => x.status === "failed").slice(0, 1)) card.append(h("p", { class: "aib-msg is-error", text: `Génération échouée : ${t.error || t.errorCode || "erreur"}` }), CAN.write ? btn("Réessayer", () => act(() => api("POST", `/media/taches/${t.id}/relancer`, {}))) : null);
      for (const t of ts.filter((x) => x.status === "queued" || x.status === "running").slice(0, 1)) card.append(h("p", { class: "aib-meta", text: `${TASK[t.status]} — ${t.provider}` }), CAN.write ? btn("Annuler", () => act(() => api("POST", `/media/taches/${t.id}/annuler`, {}))) : null);
      if (CAN.write && n.status !== "no_slot" && n.status !== "queued") card.append(h("div", { class: "aib-inline" }, btn("Générer", () => generateDialog(n)), btn("Modifier la consigne", () => promptDialog(n)), btn("Choisir dans la médiathèque", () => pickDialog(n)), h("a", { class: "aib-btn", href: `/marketing/pages/${n.pageId}/editeur`, target: "_blank", rel: "noopener" }, "Ouvrir la page")));
      grid.append(card);
    }
    wrap.append(grid);
    if (M.running && step === "medias") { clearTimeout(pollTimer); pollTimer = setTimeout(() => { if (step === "medias" && busy === 0) refresh().then(() => loadLib(true)).then(render); }, 3000); }
    return wrap;
  }
  async function assignMedia(need, mediaId) {
    const replace = need.status === "assigned";
    if (replace && !await confirmDlg("Remplacer l'image ?", "Cet emplacement contient déjà une image : elle sera remplacée (vous pourrez la restaurer depuis le moteur de médias).", "Remplacer")) return;
    await act(() => api("POST", "/media/affecter", { needKey: need.key, mediaId, replace }));
  }
  async function promptDialog(n) {
    const r = await ask({ title: "Modifier la consigne", fields: [{ name: "prompt", label: "Consigne de l'image", value: n.prompt, max: 1500 }], ok: "Enregistrer" });
    if (r) act(() => api("POST", "/media/besoin", { key: n.key, prompt: r.prompt }));
  }
  async function generateDialog(n) {
    const usable = S.media.providers.filter((p) => p.usable);
    if (!usable.length) return banner("Aucun fournisseur d'images n'est utilisable pour ce site (voir « Fournisseurs d'images »).");
    const r = await ask({ title: `Générer une image — ${n.pageName}`, text: "La génération passe par le serveur et respecte vos quotas et autorisations de dépense. Le coût estimé est calculé avant l'envoi.", fields: [{ name: "provider", label: "Fournisseur", type: "select", options: usable.map((p) => ({ value: p.id, label: `${p.label}${p.kind === "real" ? "" : " (démonstration)"}` })) }, { name: "variants", label: "Nombre de variantes (1 à 4)", value: "1", max: 1 }], ok: "Voir le coût estimé" });
    if (!r) return;
    let est;
    try { est = (await api("POST", "/media/estimer", { needKeys: [n.key], provider: r.provider, variants: Number(r.variants) || 1 })).estimate; } catch (e) { return banner(e.message); }
    if (!await ask({ title: "Confirmer la génération", text: `${est.images} image(s) via « ${est.provider} » (${est.model}). Coût estimé : ${money(est)}. ${est.note || ""}`, ok: "Lancer la génération" })) return;
    await act(() => api("POST", "/media/generer", { needKeys: [n.key], provider: r.provider, variants: Number(r.variants) || 1 }));
  }
  async function pickDialog(n) {
    const items = await loadLib(true);
    const list = h("div", { class: "aib-grid" });
    if (!items.length) list.append(h("p", { text: "La médiathèque du site ne contient aucune image. Importez-en depuis la médiathèque." }));
    for (const it of items) list.append(h("figure", { class: "aib-card" }, h("img", { class: "aib-thumb", src: it.path, alt: it.alt || it.name || "", loading: "lazy" }), h("figcaption", { text: it.name || `Image ${it.id}` }), btn("Choisir", async () => { dlg.close(); await assignMedia(n, it.id); }, { primary: true })));
    dlg.replaceChildren(h("div", { class: "aib-form aib-wide" }, h("h2", { text: `Choisir une image pour « ${n.pageName} »` }), list, h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close()))));
    dlg.onclose = null; dlg.returnValue = ""; dlg.showModal();
  }

  // ── Étape 7 : prévisualisation ──
  const DEVICES = { desktop: ["Ordinateur", "100%"], tablet: ["Tablette", "820px"], mobile: ["Mobile", "390px"] };
  function stepApercu() {
    const wrap = h("div", { class: "aib-pane aib-pane-wide" }, h("h1", { text: "Prévisualisation" }));
    const gen = S.pages.filter((p) => p.pageId);
    if (!gen.length) { wrap.append(h("p", { text: "Aucune page à prévisualiser : générez d'abord les pages." }), btn("Aller aux pages", () => go("pages"))); return wrap; }
    if (!gen.some((g) => String(g.pageId) === previewPage)) previewPage = String(gen[0].pageId);
    const sel = h("select", { "aria-label": "Page à prévisualiser", onchange: (e) => { previewPage = e.target.value; render(); } }, gen.map((g) => h("option", { value: g.pageId, text: g.name, selected: String(g.pageId) === previewPage })));
    const bar = h("div", { class: "aib-bar" }, sel, ...Object.entries(DEVICES).map(([k, [t]]) => h("button", { type: "button", class: `aib-btn${device === k ? " is-on" : ""}`, "aria-pressed": device === k ? "true" : "false", onclick: () => { device = k; render(); } }, t)), btn("Retour à l'édition", () => go("pages")));
    const frame = h("iframe", { class: "aib-frame", title: "Aperçu de la page", src: `/marketing/pages/${previewPage}/apercu`, loading: "lazy", style: `width:${DEVICES[device][1]}` });
    wrap.append(bar, h("div", { class: "aib-frame-wrap" }, frame));
    const items = S.checklist.filter((c) => ["preflight", "images", "liens", "contenus", "seo"].includes(c.key));
    wrap.append(h("h2", { text: "Vérifications automatiques" }), checklistEl(items), h("p", { class: "aib-hint", text: "L'aperçu utilise le moteur de rendu natif de Kolakisa avec vos brouillons actuels. La cohérence visuelle reste à juger à l'œil." }));
    return wrap;
  }

  // ── Étape 8 : publication ──
  const ICON = { ok: "✓", warn: "!", error: "✕", info: "i" };
  function checklistEl(items) {
    return h("ul", { class: "aib-check" }, items.map((c) => h("li", { class: `is-${c.level}` }, h("span", { class: "aib-ico", "aria-hidden": "true", text: ICON[c.level] }), h("span", {}, h("strong", { text: c.label }), c.blocking && c.level === "error" ? h("em", { text: " (bloquant)" }) : null, h("small", { text: c.message })), h("span", { class: "aib-sr", text: c.level === "ok" ? "OK" : c.level === "warn" ? "Avertissement" : c.level === "error" ? "Erreur" : "Information" }))));
  }
  function stepPublication() {
    const wrap = h("div", { class: "aib-pane" }, h("h1", { text: "Publication" }), h("p", { class: "aib-lead", text: "Liste de contrôle calculée sur l'état réel de votre site. La publication utilise le système natif de Kolakisa (contrôle de préparation de chaque page)." }), checklistEl(S.checklist));
    const todo = S.pages.filter((p) => p.pageId && p.pageStatus !== "published").length;
    wrap.append(h("div", { class: "aib-cta" }, btn(`Publier ${todo} page(s)`, publish, { primary: true, disabled: !(CAN.publish && S.canPublish) }), !CAN.publish ? h("small", { text: "Votre rôle ne permet pas de publier." }) : S.blockers.length ? h("small", { text: `Bloqué : ${S.blockers.join(" ")}` }) : todo === 0 ? h("small", { text: "Toutes les pages générées sont déjà publiées." }) : null));
    return wrap;
  }
  async function publish() {
    const todo = S.pages.filter((p) => p.pageId && p.pageStatus !== "published");
    if (!await confirmDlg("Publier le site ?", `${todo.length} page(s) seront mises en ligne : ${todo.map((p) => p.name).join(", ")}. Vous pourrez les remettre hors ligne depuis la liste des pages.`, "Publier")) return;
    const j = await act(() => api("POST", "/publier", {}));
    if (j) dlg.replaceChildren(h("div", { class: "aib-form" }, h("h2", { text: j.failed ? "Publication partielle" : "Publication terminée" }), h("ul", {}, j.results.map((r) => h("li", { text: `${r.name} : ${r.ok ? "publiée" : `échec — ${r.error}`}` }))), h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close(), { primary: true })))), dlg.onclose = null, dlg.showModal();
  }

  // ── Assistant ──
  function renderCtx() {
    const pg = S.plan && S.plan.pages.find((p) => p.key === curPage);
    $("aib-ctx").textContent = `${S.steps.find((s) => s.key === step).label}${pg ? ` · page « ${pg.name} »` : ""}`;
  }
  function renderChat() {
    const log = $("aib-chat"); const stick = log.scrollTop + log.clientHeight >= log.scrollHeight - 20;
    log.replaceChildren();
    if (!S.messages.length) log.append(h("p", { class: "aib-hint", text: "Demandez par exemple : « Ajoute une page À propos », « Ajoute une section FAQ à la page Contact » ou « Renomme la page Contact en Nous joindre »." }));
    for (const m of S.messages) {
      const box = h("div", { class: `aib-msgbox is-${m.role}${m.kind === "proposal" ? " is-proposal" : ""}` }, h("p", { text: m.text }));
      if (m.kind === "proposal" && m.proposal) {
        box.append(h("dl", { class: "aib-diff" }, h("dt", { text: "Changement" }), h("dd", { text: m.proposal.summary }), m.proposal.before ? [h("dt", { text: "Avant" }), h("dd", { text: m.proposal.before })] : null, m.proposal.after ? [h("dt", { text: "Après" }), h("dd", { text: m.proposal.after })] : null));
        if (!m.decision && CAN.write) box.append(h("div", { class: "aib-inline" }, btn("Accepter", () => act(() => api("POST", `/propositions/${m.id}/accepter`, { revision: rev() })), { primary: true }), btn("Refuser", () => act(() => api("POST", `/propositions/${m.id}/refuser`, {})))));
        else if (m.decision) box.append(h("small", { class: `aib-decision is-${m.decision}`, text: m.decision === "accepted" ? "Acceptée — vous pouvez l'annuler avec le bouton Annuler" : m.decision === "refused" ? "Refusée" : "Annulée" }));
      }
      log.append(box);
    }
    if (stick) log.scrollTop = log.scrollHeight;
    $("aib-chat-form").querySelector("textarea").disabled = !CAN.write;
  }
  $("aib-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault(); const ta = e.target.querySelector("textarea"); const text = ta.value.trim(); if (!text) return;
    ta.value = "";
    const j = await act(() => api("POST", "/assistant", { message: text, pageKey: curPage || undefined }));
    if (!j) ta.value = text;
    else if (j.redirect && STEP_KEYS.includes(j.redirect)) { $("aib-chat").append(btn(`Aller à l'étape « ${S.steps.find((s) => s.key === j.redirect).label} »`, () => go(j.redirect))); }
  });
  $("aib-chat-in").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("aib-chat-form").requestSubmit(); } });

  // ── Rendu général ──
  const RENDER = { brief: stepBrief, plan: stepPlan, pages: stepPages, design: stepDesign, contenus: stepContenus, medias: stepMedias, apercu: stepApercu, publication: stepPublication };
  function render() {
    // Le clavier ne doit jamais perdre sa place quand l'écran est redessiné : même étape → même bouton ; sinon, la zone de travail
    const active = document.activeElement;
    const stepKey = active && active.closest && active.closest("#aib-steps") ? (STEP_KEYS.find((k) => active.dataset && active.dataset.key === k) || null) : null;
    const inMain = Boolean(active && active.closest && active.closest("#aib-main"));
    renderTop(); renderSteps(); renderCtx();
    const main = $("aib-main"); const y = main.scrollTop;
    main.replaceChildren(RENDER[step]()); main.scrollTop = y;
    renderChat();
    if (stepKey) { const b = document.querySelector(`#aib-steps [data-key="${stepKey}"]`); if (b) b.focus({ preventScroll: true }); }
    else if (inMain && (document.activeElement === document.body || !document.activeElement)) main.focus({ preventScroll: true });
  }
  $("aib-undo").addEventListener("click", () => act(() => api("POST", "/annuler", { revision: rev() })));
  $("aib-redo").addEventListener("click", () => act(() => api("POST", "/retablir", { revision: rev() })));
  $("aib-preview").addEventListener("click", () => go("apercu"));
  $("aib-save-btn").addEventListener("click", async () => {
    // Tout est enregistré à chaque action : « Enregistrer » relit le serveur et confirme ce qui y est réellement
    const j = await act(async () => ({ state: (await api("GET", "/etat.json")).state }));
    if (j) setSave("saved", `Enregistré et vérifié à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
  });
  $("aib-publish").addEventListener("click", () => { go("publication"); publish(); });
  $("aib-toggle-assist").addEventListener("click", () => { $("aib-body").classList.toggle("is-assist-closed"); LS("assist", $("aib-body").classList.contains("is-assist-closed") ? "closed" : "open"); document.querySelector(".aib-menu").open = false; });
  // Sur écran étroit l'assistant est un tiroir : fermé au départ (il ne doit pas masquer le travail), ouvert par le bouton « Assistant »
  if (LS("assist") === "closed" || (LS("assist") === null && window.matchMedia("(max-width: 1180px)").matches)) $("aib-body").classList.add("is-assist-closed");
  $("aib-assist-btn").addEventListener("click", () => { $("aib-body").classList.toggle("is-assist-closed"); LS("assist", $("aib-body").classList.contains("is-assist-closed") ? "closed" : "open"); $("aib-assist-btn").setAttribute("aria-expanded", $("aib-body").classList.contains("is-assist-closed") ? "false" : "true"); });
  $("aib-assist-btn").setAttribute("aria-expanded", $("aib-body").classList.contains("is-assist-closed") ? "false" : "true");
  window.addEventListener("online", () => {
    if (failedNetwork) { const again = failedNetwork; banner("Connexion rétablie. La dernière action n'a PAS été enregistrée.", [btn("Réessayer", () => act(again))]); setSave("error", "Dernière action non enregistrée"); }
    else { banner(""); setSave("saved", "Connexion rétablie"); }
  });
  window.addEventListener("offline", () => { setSave("error", "Hors connexion"); banner("Vous êtes hors connexion. Vos actions ne seront pas enregistrées tant que la connexion n'est pas rétablie."); });
  window.addEventListener("beforeunload", (e) => { if (busy > 0) { e.preventDefault(); e.returnValue = ""; } });
  setSave("saved", `Enregistré — dernière modification ${when(S.project.updatedAt)}`);
  loadLib(false).then(() => { if (step === "medias") render(); });
  render();
})();

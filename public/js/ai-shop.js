// Interface « Boutique IA » (Programme 21.10). Aucune logique commerciale ici : ce script AFFICHE l'état renvoyé par le serveur (lu dans le moteur e-commerce) et envoie des actions à
// /marketing/ia/studio/boutique/… Tout texte venu du serveur ou de l'IA est inséré avec textContent. Aucun prix, stock, taux ou tarif n'est jamais proposé : ils sont saisis par la personne.
(() => {
  "use strict";
  const body = document.body, BASE = body.dataset.base, ID = body.dataset.id, SITE = body.dataset.site || "";
  const CAN = { write: body.dataset.write === "1", shop: body.dataset.shop === "1", payments: body.dataset.payments === "1", design: body.dataset.design === "1", publish: body.dataset.publish === "1" };
  const $ = (id) => document.getElementById(id);
  let S = JSON.parse($("aib-initial").textContent);
  const LS = (k, v) => { try { const key = `aibshop.${ID}.${k}`; if (v === undefined) return localStorage.getItem(key); if (v === null) localStorage.removeItem(key); else localStorage.setItem(key, v); } catch { return null; } return null; };
  const STEP_KEYS = S.steps.map((s) => s.key);
  let step = STEP_KEYS.includes(LS("step")) ? LS("step") : S.progress.current;
  let busy = 0, lastRetry = null, failedNetwork = null, lastResult = null, libCache = null, proposal = null, designRun = null;
  const STATUS = { not_started: "Non commencé", in_progress: "En cours", to_review: "À vérifier", done: "Terminé", error: "Erreur" };
  const LEVEL = { error: ["error", "Erreur bloquante"], warning: ["to_review", "Avertissement"], missing: ["in_progress", "Information manquante"], ok: ["done", "Validé"], info: ["not_started", "Information"] };
  const withSite = (p) => (SITE ? `${p}${p.includes("?") ? "&" : "?"}site=${encodeURIComponent(SITE)}` : p);
  const money = (c, cur) => (c === null || c === undefined ? "—" : `${(c / ((["XOF", "XAF", "RWF"].includes(cur)) ? 1 : 100)).toLocaleString("fr-FR", { minimumFractionDigits: ["XOF", "XAF", "RWF"].includes(cur) ? 0 : 2 })} ${cur || ""}`.trim());

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) { if (v === false || v === null || v === undefined) continue; if (k === "class") el.className = v; else if (k === "text") el.textContent = v; else if (k.startsWith("on")) el.addEventListener(k.slice(2), v); else if (k === "value") el.value = v; else el.setAttribute(k, v === true ? "" : v); }
    for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    return el;
  };
  const btn = (label, onclick, o = {}) => h("button", { type: "button", class: `aib-btn${o.primary ? " aib-btn-primary" : ""}${o.danger ? " aib-btn-danger" : ""}`, disabled: o.disabled, onclick, "aria-label": o.aria }, label);
  const badge = (status, label) => h("span", { class: `aib-badge is-${status}` }, label || STATUS[status] || status);
  const when = (ms) => (ms ? new Date(ms).toLocaleString("fr-FR") : "—");

  // ── sauvegarde, erreurs ──
  function setSave(kind, text) { $("aib-save").dataset.state = kind; $("aib-save-t").textContent = text; }
  function banner(msg, actions) { const b = $("aib-banner"); b.replaceChildren(h("span", { text: msg }), ...(actions || [])); b.hidden = !msg; }
  async function api(method, path, data) {
    busy += 1; if (method !== "GET") setSave("saving", "Enregistrement…");
    try {
      const r = await fetch(withSite(BASE + path), { method, credentials: "same-origin", headers: { Accept: "application/json", ...(data !== undefined ? { "Content-Type": "application/json" } : {}) }, body: data !== undefined ? JSON.stringify(data) : undefined });
      const j = await r.json().catch(() => null);
      if (!j || !r.ok || j.ok === false) { const e = new Error((j && j.error) || "Le serveur a répondu par une erreur."); e.status = r.status; e.code = j && j.code; throw e; }
      if (method !== "GET") setSave("saved", `Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`);
      banner(""); return j;
    } catch (e) { if (method !== "GET") setSave("error", "Échec de l'enregistrement"); throw Object.assign(e, { network: e instanceof TypeError }); }
    finally { busy -= 1; }
  }
  async function act(run) {
    lastRetry = run;
    try { const j = await run(); failedNetwork = null; if (j && j.state) S = j.state; render(); return j; }
    catch (e) {
      const actions = []; let msg = e.message;
      if (e.network) { msg = "Connexion perdue : l'action n'a pas été enregistrée. Vos modifications précédentes sont conservées."; failedNetwork = run; actions.push(btn("Réessayer", () => act(lastRetry))); }
      else if (e.status === 409 && e.code === "conflict") { msg = `${e.message} Rechargez le projet pour voir la dernière version.`; actions.push(btn("Recharger", refresh)); }
      else if (e.status === 503) msg = `${e.message} Les fonctions IA ne sont pas disponibles pour le moment ; le reste fonctionne.`;
      banner(msg, actions); render(); return null;
    }
  }
  const refresh = () => act(async () => ({ state: (await api("GET", "/etat.json")).state }));
  const rev = () => S.project.revision;
  const op = (operation, label) => act(() => api("POST", "/modifier", { operation: { ...operation, label }, revision: rev() }));

  // ── dialogues ──
  const dlg = $("aib-dialog");
  function ask({ title, text, fields = [], ok = "Confirmer", danger = false, wide = false }) {
    return new Promise((resolve) => {
      const field = (f) => h("label", {}, f.label,
        f.type === "select" ? h("select", { name: f.name }, f.options.map((o) => h("option", { value: o.value, text: o.label })))
          : f.type === "textarea" ? h("textarea", { name: f.name, rows: f.rows || 4, maxlength: f.max || 4000, value: f.value || "", required: f.required !== false })
            : h("input", { name: f.name, value: f.value || "", maxlength: f.max || 120, required: f.required !== false, inputmode: f.mode || false, autocomplete: "off" }), f.hint ? h("small", { text: f.hint }) : null);
      const form = h("form", { method: "dialog", class: `aib-form${wide ? " aib-wide" : ""}` }, h("h2", { text: title }), text ? h("p", { text }) : null, ...fields.map(field),
        h("div", { class: "aib-form-actions" }, h("button", { type: "button", class: "aib-btn", onclick: () => dlg.close("cancel") }, "Annuler"), h("button", { type: "submit", class: `aib-btn ${danger ? "aib-btn-danger" : "aib-btn-primary"}` }, ok)));
      dlg.replaceChildren(form); dlg.returnValue = ""; dlg.oncancel = () => { dlg.returnValue = "cancel"; };
      dlg.onclose = () => { if (dlg.returnValue === "cancel" || !form.checkValidity()) return resolve(null); resolve(Object.fromEntries(new FormData(form))); };
      form.addEventListener("submit", (e) => { if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); } });
      dlg.showModal(); const first = form.querySelector("input,select,textarea"); if (first) first.focus();
    });
  }
  const confirmDlg = (title, text, ok) => ask({ title, text, ok, danger: true }).then(Boolean);
  const show = (node) => { dlg.replaceChildren(node); dlg.onclose = null; dlg.returnValue = ""; dlg.showModal(); };

  // ── haut de page et navigation ──
  function renderTop() {
    $("aib-name").textContent = S.project.name; $("aib-progress-fill").style.width = `${S.progress.percent}%`; $("aib-progress-t").textContent = `${S.progress.done}/${S.progress.total} étapes`;
    $("aib-undo").disabled = !S.undo.canUndo || !CAN.write; $("aib-undo").title = S.undo.undoLabel ? `Annuler : ${S.undo.undoLabel}` : "Rien à annuler"; $("aib-redo").disabled = !S.undo.canRedo || !CAN.write;
  }
  function renderSteps() {
    const ol = $("aib-steps"); ol.replaceChildren();
    S.steps.forEach((s, i) => ol.append(h("li", {}, h("button", { type: "button", class: `aib-step is-${s.status}`, "data-key": s.key, "aria-current": s.key === step ? "step" : false, onclick: () => go(s.key) },
      h("span", { class: "aib-step-n", text: String(i + 1) }), h("span", { class: "aib-step-t" }, h("strong", { text: s.label }), h("small", { text: s.detail }), badge(s.status))))));
  }
  function go(key) { step = key; LS("step", key); render(); $("aib-main").scrollTop = 0; }
  const pane = (title, lead) => h("div", { class: "aib-pane aib-pane-wide" }, h("h1", { text: title }), lead ? h("p", { class: "aib-lead", text: lead }) : null);
  const next = (key, label) => h("div", { class: "aib-cta" }, btn(label || "Étape suivante", () => go(key), { primary: true }));
  const table = (heads, rows, caption) => h("table", { class: "aib-table" }, h("caption", { class: "aib-sr", text: caption }), h("thead", {}, h("tr", {}, heads.map((t) => h("th", { scope: "col", text: t })))), h("tbody", {}, rows));

  // ── 1. projet commercial ──
  function stepBrief() {
    const w = pane("Projet commercial", "Votre description et ce que Kolakisa en a retenu, avec la preuve. Rien n'est supposé : ce qui manque est listé à l'étape suivante.");
    w.append(h("blockquote", { class: "aib-brief", text: S.brief }));
    const F = { shopName: "Nom de la boutique", sector: "Secteur", country: "Pays", markets: "Marchés", language: "Langue", currency: "Devise", positioning: "Positionnement", audience: "Public", channels: "Canaux" };
    const rows = Object.entries(S.analysis.facts).map(([k, f]) => h("tr", {}, h("th", { scope: "row", text: F[k] || k }), h("td", { text: Array.isArray(f.value) ? f.value.join(", ") : k === "sector" ? S.analysis.sector.label : String(f.value) }), h("td", {}, badge("done", "Explicite")), h("td", { class: "aib-meta", text: f.evidence })));
    w.append(rows.length ? table(["Information", "Valeur", "Statut", "Preuve"], rows, "Informations retenues") : h("p", { class: "aib-msg is-warn", text: "Aucune information commerciale n'a pu être extraite : précisez-les à l'étape suivante." }));
    w.append(h("p", { class: "aib-hint", text: `Analyse réalisée par ${S.analysis.engine} : aucun texte n'a été envoyé à un fournisseur d'IA.` }), next("modele"));
    return w;
  }
  // ── 2. modèle économique ──
  const FACT_QUESTIONS = { shopName: "Nom de la boutique", country: "Pays d'exploitation (code à deux lettres, ex. CD, FR)", currency: "Devise des prix (code, ex. USD, EUR, XOF)", language: "Langue (fr, en)", audience: "Public cible", sector: "Secteur (informatique, mode, beauté, maison, alimentation, numerique, accessoires, sport)" };
  function stepModele() {
    const w = pane("Modèle économique", "Ce que le moteur de boutique de Kolakisa sait réellement faire pour votre modèle.");
    for (const m of S.analysis.models) w.append(h("article", { class: "aib-card" }, h("h3", { text: m.label }), badge(m.status === "supported" ? "done" : m.status === "partial" ? "to_review" : "error", m.status === "supported" ? "Pris en charge" : m.status === "partial" ? "Pris en charge en partie" : "Non pris en charge"), h("p", { text: m.reason }), h("p", { class: "aib-meta", text: `Preuve : ${m.evidence}` })));
    if (!S.analysis.models.length) w.append(h("p", { class: "aib-msg is-warn", text: "Modèle commercial non identifié : précisez ce que vous vendez." }));
    if (S.analysis.assumptions.length) w.append(h("h2", { text: "Hypothèses (à confirmer)" }), h("ul", {}, S.analysis.assumptions.map((a) => h("li", { text: `${a.key} : ${a.value} — ${a.reason}` }))));
    if (S.analysis.missing.length) { w.append(h("h2", { text: "Informations à préciser" })); const ul = h("ul", { class: "aib-recs" }); for (const m of S.analysis.missing) ul.append(h("li", {}, h("span", { text: m.question }), CAN.write && FACT_QUESTIONS[m.key] ? btn("Préciser", () => setFact(m.key)) : null)); w.append(ul); }
    if (CAN.write) w.append(h("div", { class: "aib-bar" }, btn("Corriger une information", async () => { const r = await ask({ title: "Corriger une information", fields: [{ name: "key", label: "Information", type: "select", options: Object.entries(FACT_QUESTIONS).map(([v, l]) => ({ value: v, label: l })) }], ok: "Continuer" }); if (r) setFact(r.key); }),
      btn("Régénérer plan et structure", async () => { if (await confirmDlg("Régénérer ?", "Le plan de boutique et la structure du catalogue sont recréés d'après les informations actuelles. Vous pourrez annuler.", "Régénérer")) { await op({ op: "replan" }, "Plan régénéré"); await op({ op: "restructure" }, "Structure régénérée"); } })));
    w.append(next("architecture")); return w;
  }
  async function setFact(key) { const r = await ask({ title: FACT_QUESTIONS[key] || key, fields: [{ name: "value", label: "Valeur", max: 120 }], ok: "Enregistrer" }); if (r) op({ op: "set_fact", key, value: r.value }, `Information « ${key} » précisée`); }

  // ── 3. architecture ──
  const KIND = { native: ["done", "Page native du moteur"], page: ["in_progress", "Page éditoriale"] };
  function stepArchitecture() {
    const w = pane("Architecture de la boutique", "Les pages natives (catalogue, fiche produit, panier) sont servies par le moteur ; les pages éditoriales sont créées en brouillon par le générateur de pages.");
    for (const n of S.plan.notes || []) w.append(h("p", { class: "aib-msg is-warn", text: n }));
    const rows = S.plan.pages.map((p, i) => h("tr", {}, h("th", { scope: "row" }, p.name, p.legal ? h("small", { text: " — modèle à compléter et à faire vérifier" }) : null), h("td", {}, badge(...KIND[p.kind])), h("td", { text: p.menu === "none" ? "—" : p.menu === "main" ? "Menu principal" : "Pied de page" }), h("td", { class: "aib-meta", text: p.purpose }),
      h("td", { class: "aib-actions-cell" }, S.applied.pages && S.applied.pages[p.key] ? [badge("done", "Brouillon créé"), h("a", { class: "aib-btn", href: `/marketing/pages/${S.applied.pages[p.key]}/editeur`, target: "_blank", rel: "noopener" }, "Ouvrir")] : null,
        CAN.write ? [i > 0 ? btn("↑", () => op({ op: "plan_move_page", key: p.key, to: i - 1 }, "Déplacement d'une page"), { aria: `Monter ${p.name}` }) : null, btn("Renommer", async () => { const r = await ask({ title: "Renommer la page", fields: [{ name: "name", label: "Nom", value: p.name }], ok: "Renommer" }); if (r) op({ op: "plan_rename_page", key: p.key, name: r.name }, `Renommage de « ${p.name} »`); }),
          p.required ? null : btn("Retirer", async () => { if (await confirmDlg(`Retirer « ${p.name} » du plan ?`, "La page n'est pas créée ; vous pourrez annuler.", "Retirer")) op({ op: "plan_remove_page", key: p.key }, `Retrait de « ${p.name} »`); }, { danger: true })] : null)));
    w.append(table(["Page", "Type", "Menu", "Objectif", "Actions"], rows, "Pages de la boutique"));
    if (CAN.write) w.append(h("div", { class: "aib-bar" }, btn("Ajouter une page", async () => { const r = await ask({ title: "Ajouter une page", fields: [{ name: "name", label: "Nom de la page" }, { name: "purpose", label: "Objectif (facultatif)", required: false, max: 240 }], ok: "Ajouter" }); if (r) op({ op: "plan_add_page", name: r.name, purpose: r.purpose }, `Ajout de « ${r.name} »`); }),
      S.plan.accepted ? badge("done", "Plan accepté") : btn("Accepter le plan", () => op({ op: "accept_plan" }, "Plan accepté"), { primary: true }),
      btn("Créer les pages éditoriales en brouillon", () => act(async () => { const r = await api("POST", "/appliquer/pages", {}); lastResult = `${r.result.created} page(s) créée(s) en brouillon.`; return r; }), { disabled: !S.plan.accepted || !CAN.publish })));
    if (lastResult && step === "architecture") w.append(h("p", { class: "aib-msg is-warn", role: "status", text: lastResult }));
    w.append(h("p", { class: "aib-hint", text: S.plan.legalNote }), next("catalogue")); return w;
  }
  // ── 4. catalogue ──
  function stepCatalogue() {
    const w = pane("Organisation du catalogue", "Catégories proposées d'après votre secteur : modifiez-les AVANT de les créer dans le catalogue réel. Rien n'est créé tant que vous n'avez pas accepté.");
    for (const n of S.structure.notes || []) w.append(h("p", { class: "aib-msg is-warn", text: n }));
    for (const p of S.structure.problems) w.append(h("p", { class: `aib-msg ${p.level === "warn" ? "is-warn" : ""}`, text: p.message }));
    const kids = (k) => S.structure.categories.filter((c) => (c.parent || null) === k);
    const list = (parent, depth) => kids(parent).flatMap((c) => [h("li", { style: `margin-left:${depth * 18}px` }, h("strong", { text: c.name }), c.attributes.length ? h("small", { text: ` — attributs : ${c.attributes.map((a) => a.name).join(", ")}` }) : null, S.applied.categories && S.applied.categories[c.key] ? badge("done", "Créée") : null,
      CAN.write ? h("span", { class: "aib-inline" }, btn("Renommer", async () => { const r = await ask({ title: "Renommer la catégorie", fields: [{ name: "name", label: "Nom", value: c.name }], ok: "Renommer" }); if (r) op({ op: "cat_rename_category", key: c.key, name: r.name }, `Renommage de « ${c.name} »`); }),
        depth < 2 ? btn("+ Sous-catégorie", async () => { const r = await ask({ title: `Sous-catégorie de « ${c.name} »`, fields: [{ name: "name", label: "Nom" }], ok: "Ajouter" }); if (r) op({ op: "cat_add_category", name: r.name, parent: c.key }, `Ajout de « ${r.name} »`); }) : null,
        btn("Retirer du plan", async () => { if (await confirmDlg(`Retirer « ${c.name} » du plan ?`, "Seul le plan est modifié (le catalogue déjà créé n'est pas touché). Vous pourrez annuler.", "Retirer")) op({ op: "cat_remove_category", key: c.key }, `Retrait de « ${c.name} »`); }, { danger: true })) : null), ...list(c.key, depth + 1)]);
    w.append(h("ul", { class: "aib-feat" }, list(null, 0)));
    if (S.structure.filters.length) w.append(h("p", { class: "aib-hint", text: `Filtres envisageables (à titre indicatif, le moteur filtre par catégorie et recherche) : ${S.structure.filters.map((f) => f.name).join(", ")}.` }));
    if (CAN.write) w.append(h("div", { class: "aib-bar" }, btn("Ajouter une catégorie", async () => { const r = await ask({ title: "Ajouter une catégorie", fields: [{ name: "name", label: "Nom" }], ok: "Ajouter" }); if (r) op({ op: "cat_add_category", name: r.name }, `Ajout de « ${r.name} »`); }),
      S.structure.accepted ? badge("done", "Structure acceptée") : btn("Accepter la structure", () => op({ op: "accept_structure" }, "Structure acceptée"), { primary: true }),
      btn("Créer les catégories dans le catalogue", () => act(async () => { const r = await api("POST", "/appliquer/structure", {}); lastResult = `Catégories : ${r.result.created} créée(s), ${r.result.reused} déjà présente(s).`; return r; }), { disabled: !S.structure.accepted || !CAN.shop })));
    if (lastResult && step === "catalogue") w.append(h("p", { class: "aib-msg is-warn", role: "status", text: lastResult }));
    w.append(next("produits")); return w;
  }
  // ── 5. produits ──
  function stepProduits() {
    const w = pane("Préparation des produits", "Des BROUILLONS : le contenu part des caractéristiques que vous fournissez. Prix, stock, SKU et images ne sont jamais inventés ; les produits sont créés en brouillon dans le catalogue, jamais publiés d'office.");
    if (CAN.write) w.append(h("div", { class: "aib-bar" }, btn("Nouveau produit", () => productDialog(), { primary: true }), btn("Importer un CSV", csvDialog)));
    const cur = S.analysis.facts.currency ? S.analysis.facts.currency.value : "EUR";
    const rows = S.drafts.map((d) => {
      const applied = S.applied.products && S.applied.products[d.key];
      const crit = (d.issues || []).filter((i) => i.level === "critical").length;
      return h("tr", {}, h("th", { scope: "row", text: d.name }), h("td", { text: d.type === "variable" ? "Variable" : d.type === "digital" ? "Numérique" : "Simple" }), h("td", { text: money(d.priceCents, cur) }), h("td", { text: d.stock === null ? "—" : String(d.stock) }), h("td", {}, d.content ? badge(crit ? "error" : "done", crit ? `${crit} affirmation(s) à corriger` : d.content.source === "ai" ? "Contenu IA" : "Contenu gabarit") : badge("not_started", "Sans contenu"), (d.missing || []).length ? h("small", { text: ` manque : ${d.missing.map((m) => m.key).join(", ")}` }) : null),
        h("td", { class: "aib-actions-cell" }, applied ? badge("done", "Créé (brouillon)") : CAN.write ? [btn("Générer le contenu", () => genDialog(d)), btn("Modifier", () => productDialog(d)), d.content ? btn("Voir le contenu", () => viewContent(d)) : null, btn("Retirer", async () => { if (await confirmDlg(`Retirer le brouillon « ${d.name} » ?`, "Le catalogue n'est pas touché.", "Retirer")) op({ op: "remove_product", key: d.key }, `Retrait de « ${d.name} »`); }, { danger: true })] : null));
    });
    if (S.drafts.length) w.append(table(["Produit", "Type", "Prix", "Stock", "Contenu", "Actions"], rows, "Brouillons de produits"));
    else w.append(h("p", { text: "Aucun brouillon. Ajoutez un produit ou importez un CSV (colonnes : nom, prix, stock, categorie, caracteristiques, sku, image)." }));
    if (S.drafts.some((d) => !(S.applied.products || {})[d.key]) && CAN.shop) w.append(h("div", { class: "aib-cta" }, btn("Créer les brouillons dans le catalogue", () => act(async () => { const r = await api("POST", "/appliquer/produits", {}); lastResult = r.result.results.map((x) => `${x.name} : ${x.status === "created" ? "créé en brouillon" : x.status === "already" ? "déjà créé" : `refusé — ${x.reasons.join(" ; ")}`}`).join("\n"); return r; }), { primary: true })));
    if (lastResult && step === "produits") w.append(h("pre", { class: "aib-brief", role: "status", text: lastResult }));
    w.append(h("h2", { text: `Catalogue réel (${S.catalog.count})` }), S.catalog.count ? table(["Produit", "Type", "Statut", "Prix", "SKU"], S.catalog.products.map((p) => h("tr", {}, h("th", { scope: "row", text: p.name }), h("td", { text: p.type }), h("td", {}, badge(p.status === "published" ? "done" : "in_progress", p.status === "published" ? "Publié" : "Brouillon")), h("td", { text: money(p.priceCents, cur) }), h("td", { text: p.sku || "—" }))), "Catalogue réel") : h("p", { class: "aib-hint", text: "Le catalogue est vide." }), next("design"));
    return w;
  }
  async function productDialog(d) {
    const cats = S.structure.categories;
    const r = await ask({ title: d ? `Modifier « ${d.name} »` : "Nouveau produit", wide: true, ok: "Enregistrer", fields: [
      { name: "name", label: "Nom du produit", value: d ? d.name : "", max: 200 }, { name: "facts", label: "Caractéristiques RÉELLES (une par ligne)", type: "textarea", rows: 5, value: d ? d.facts.join("\n") : "", required: false, hint: "Seules ces informations serviront à rédiger la fiche : rien d'autre n'est inventé." },
      { name: "price", label: "Prix (saisi par vous, jamais proposé)", value: d && d.priceCents !== null ? String(d.priceCents / 100).replace(".", ",") : "", required: false, mode: "decimal", max: 20 },
      { name: "stock", label: "Stock initial (vide = non géré)", value: d && d.stock !== null ? String(d.stock) : "", required: false, mode: "numeric", max: 8 }, { name: "sku", label: "Référence SKU (facultatif)", value: d ? d.sku : "", required: false, max: 80 },
      { name: "categoryKey", label: "Catégorie", type: "select", options: [{ value: "", label: "— aucune —" }, ...cats.map((c) => ({ value: c.key, label: c.name }))] },
      { name: "type", label: "Type", type: "select", options: [{ value: "simple", label: "Simple" }, { value: "variable", label: "Variable (taille, couleur…)" }, { value: "digital", label: "Numérique (sans livraison de fichier)" }] },
      { name: "attributes", label: "Attributs d'un produit variable (ex. Taille : S, M, L ; Couleur : Noir, Blanc)", required: false, max: 400 }, { name: "image", label: "Image (adresse https ou fichier de la médiathèque)", value: d ? d.image : "", required: false, max: 500 }] });
    if (!r) return;
    const attributes = (r.attributes || "").split(";").map((x) => { const [n, v] = x.split(":"); return { name: (n || "").trim(), values: (v || "").trim() }; }).filter((a) => a.name && a.values);
    const product = { name: r.name, facts: r.facts, price: r.price || undefined, priceCents: r.price ? undefined : null, stock: r.stock === "" ? null : Number(r.stock), sku: r.sku, categoryKey: r.categoryKey || null, type: r.type, attributes, image: r.image };
    if (d) op({ op: "update_product", key: d.key, product }, `Modification de « ${r.name} »`); else op({ op: "add_product", product }, `Ajout du brouillon « ${r.name} »`);
  }
  async function genDialog(d) {
    const r = await ask({ title: `Contenu de « ${d.name} »`, text: "Sans IA, un gabarit rédige uniquement à partir de vos caractéristiques. Avec l'IA, le texte est filtré : tout chiffre, contact, garantie ou certification absent de vos faits est remplacé ou signalé.", ok: "Générer",
      fields: [{ name: "style", label: "Style rédactionnel", type: "select", options: Object.entries(S.styles).map(([v, l]) => ({ value: v, label: l })) }, { name: "useAi", label: "Utiliser l'IA (consomme votre quota IA)", type: "select", options: [{ value: "", label: "Non — gabarit sans IA" }, { value: "1", label: "Oui — avec l'IA" }] }] });
    if (!r) return;
    await act(() => api("POST", `/produits/${encodeURIComponent(d.key)}/generer`, { useAi: r.useAi === "1", style: r.style }));
  }
  function viewContent(d) {
    const c = d.content; const sec = (t, v) => (v && (!Array.isArray(v) || v.length) ? h("div", { class: "aib-field" }, h("strong", { text: t }), Array.isArray(v) ? h("ul", {}, v.map((x) => h("li", { text: typeof x === "string" ? x : `${x.q} — ${x.a}` }))) : h("p", { text: v, style: "white-space:pre-wrap" })) : null);
    show(h("div", { class: "aib-form aib-wide" }, h("h2", { text: d.name }), h("p", { class: "aib-hint", text: `Source : ${c.source === "ai" ? "IA (filtrée)" : "gabarit sans IA"} · style ${S.styles[c.style] || c.style}` }),
      ...(d.issues || []).map((i) => h("p", { class: `aib-msg ${i.level === "critical" ? "is-error" : "is-warn"}`, text: i.message })),
      sec("Description courte", c.shortDescription), sec("Description", c.description), sec("Points forts", c.benefits), sec("Informations techniques", c.technical), sec("Titre SEO", c.seoTitle), sec("Méta-description", c.metaDescription), sec("Texte alternatif de l'image", c.altText), sec("Questions fréquentes", c.faq),
      h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close()))));
  }
  async function csvDialog() {
    const r = await ask({ title: "Importer un CSV", wide: true, ok: "Prévisualiser", text: "Colonnes reconnues : nom (obligatoire), sku, prix, stock, categorie, caracteristiques (séparées par |), image, type, attributs. Aucun produit n'est créé à cette étape.", fields: [{ name: "text", label: "Contenu du fichier CSV (collez-le ici)", type: "textarea", rows: 8, max: 900000 }] });
    if (!r) return;
    let pv; try { pv = (await api("POST", "/csv/apercu", { text: r.text })).preview; } catch (e) { return banner(e.message); }
    show(h("div", { class: "aib-form aib-wide" }, h("h2", { text: "Aperçu de l'import" }), h("p", { text: `${pv.total} ligne(s) : ${pv.wouldAdd} brouillon(s) valide(s). ${pv.ignoredColumns.length ? `Colonnes ignorées : ${pv.ignoredColumns.join(", ")}.` : ""}` }),
      ...pv.rows.filter((x) => x.errors.length).slice(0, 15).map((x) => h("p", { class: "aib-msg is-warn", text: `Ligne ${x.line} : ${x.errors.join(" ")}` })), ...pv.duplicates.slice(0, 15).map((x) => h("p", { class: "aib-msg is-error", text: `Doublon écarté : ${x.reason}` })),
      h("div", { class: "aib-form-actions" }, btn("Annuler", () => dlg.close()), btn("Ajouter les brouillons valides", async () => { dlg.close(); await act(() => api("POST", "/csv/ajouter", { text: r.text, revision: rev() })); }, { primary: true }))));
  }
  // ── 6. design ──
  function stepDesign() {
    const w = pane("Design de la boutique", "Directions artistiques adaptées à une boutique (lisibilité des prix, boutons d'achat, navigation). Appliquer une proposition l'ajoute au BROUILLON des styles ; vos réglages manuels sont protégés.");
    if (CAN.design) w.append(h("div", { class: "aib-bar" }, btn(designRun ? "Nouvelles propositions" : "Proposer des directions artistiques", () => act(async () => { const j = await api("POST", "/design/generer", { brief: { text: "boutique en ligne" } }); designRun = j.run; return j; }), { primary: true })));
    else w.append(h("p", { class: "aib-msg is-warn", text: "Votre rôle ne permet pas de modifier l'apparence." }));
    const run = designRun;
    if (run) { const grid = h("div", { class: "aib-grid" }); for (const p of run.proposals) grid.append(h("article", { class: "aib-card" }, h("h3", { text: p.name }), h("p", { text: p.description }), p.colors ? h("div", { class: "aib-swatches" }, Object.entries(p.colors).filter(([, v]) => typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v)).slice(0, 8).map(([k, v]) => h("span", { class: "aib-swatch", style: `background:${v}`, title: `${k} ${v}` }))) : null, p.ok === false ? h("p", { class: "aib-msg is-error", text: "Variante invalide (contraste insuffisant)." }) : null,
      h("div", { class: "aib-inline" }, btn("Comparer", () => compareDesign(run.id, p.key)), CAN.design && p.ok !== false ? btn("Appliquer", () => act(() => api("POST", `/design/${run.id}/appliquer`, { variante: p.key })), { primary: true }) : null))); w.append(grid); }
    if (S.design.applied) w.append(h("div", { class: "aib-cta" }, h("p", { text: "Une direction artistique est appliquée au brouillon des styles (non publiée)." }), CAN.design ? btn("Annuler l'application", () => act(() => api("POST", `/design/${S.design.applied}/annuler`, {})), { danger: true }) : null, h("a", { class: "aib-btn", href: `/marketing/site-web/styles?site=${S.project.siteId}`, target: "_blank", rel: "noopener" }, "Ajuster dans le personnalisateur")));
    w.append(next("medias")); return w;
  }
  async function compareDesign(rid, key) {
    try { const j = await api("GET", `/design/${rid}/comparer?variante=${encodeURIComponent(key)}`); const rows = (j.comparison.rows || j.comparison.changes || []).slice(0, 60);
      show(h("div", { class: "aib-form aib-wide" }, h("h2", { text: "Comparaison avant / après" }), rows.length ? table(["Réglage", "Actuel", "Proposé", "État"], rows.map((r) => h("tr", {}, h("th", { scope: "row", text: r.label || r.path || r.key || "" }), h("td", { text: String(r.current ?? r.before ?? "") }), h("td", { text: String(r.proposed ?? r.after ?? "") }), h("td", { text: r.protected ? "Votre réglage (conservé)" : r.state || "" }))), "Comparaison") : h("p", { text: "Aucune différence." }), h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close())))); } catch (e) { banner(e.message); }
  }
  // ── 7. médias ──
  async function loadLib() { try { libCache = (await api("GET", "/media/bibliotheque")).items; } catch { libCache = []; } return libCache; }
  function stepMedias() {
    const w = pane("Images et médias", "Les images des produits viennent de la médiathèque du site (photos réelles recommandées). Une image générée ne représente pas fidèlement un produit réel.");
    w.append(h("p", { class: "aib-msg is-warn", text: S.capabilities.absent.perProductImageGeneration }), h("a", { class: "aib-btn", href: `/marketing/site-web/mediatheque?site=${S.project.siteId}`, target: "_blank", rel: "noopener" }, "Ouvrir la médiathèque"));
    if (!S.catalog.count) w.append(h("p", { text: "Créez d'abord des produits dans le catalogue." }), next("produits", "Aller aux produits"));
    else w.append(table(["Produit", "Image", "Actions"], S.catalog.products.map((p) => h("tr", {}, h("th", { scope: "row", text: p.name }), h("td", {}, p.image ? h("img", { class: "aib-thumb", style: "max-width:90px", src: p.image, alt: p.name, loading: "lazy" }) : badge("to_review", "Image manquante")), h("td", {}, CAN.shop ? btn(p.image ? "Remplacer" : "Choisir une image", () => pickImage(p)) : null))), "Images des produits"));
    w.append(next("configuration")); return w;
  }
  async function pickImage(p) {
    const items = await loadLib(); const grid = h("div", { class: "aib-grid" });
    if (!items.length) grid.append(h("p", { text: "La médiathèque de ce site ne contient aucune image : importez-en depuis la médiathèque." }));
    for (const it of items) grid.append(h("figure", { class: "aib-card" }, h("img", { class: "aib-thumb", src: it.path, alt: it.alt || it.name || "", loading: "lazy" }), h("figcaption", { text: `${it.name || `Image ${it.id}`}${it.aiGenerated ? " (générée par IA)" : ""}` }), btn("Choisir", async () => { dlg.close(); await act(() => api("POST", "/media/produit", { productId: p.id, mediaId: it.id })); }, { primary: true })));
    show(h("div", { class: "aib-form aib-wide" }, h("h2", { text: `Image de « ${p.name} »` }), grid, h("div", { class: "aib-form-actions" }, btn("Fermer", () => dlg.close()))));
  }
  // ── 8. configuration ──
  function stepConfiguration() {
    const C = S.config; const w = pane("Configuration commerciale", "Marchés, devise, paiements, livraison, taxes. Kolakisa ne propose AUCUNE valeur : vous saisissez vos tarifs, délais et taux (à faire valider par un professionnel). Les clés de paiement se configurent sur le serveur, jamais ici.");
    w.append(h("h2", { text: "État du moteur" }), h("ul", {}, h("li", { text: `Devise : ${C.engine.currency}${C.capabilities.currency.current !== "EUR" ? " (seul l'euro est testé)" : ""}` }), h("li", { text: `Pays par défaut : ${C.engine.defaultCountry || "non défini"}` }), h("li", { text: `Taxes : ${C.engine.taxEnabled ? "activées" : "désactivées"} · ${C.taxRules.length} règle(s)` }), h("li", { text: `Livraison : ${C.zones.length} zone(s)` }), h("li", { text: `Boutique : ${C.engine.shopOpen ? "ouverte" : "fermée"}` })));
    w.append(h("h2", { text: "Paiements disponibles" }), h("ul", {}, C.capabilities.paymentProviders.map((p) => h("li", {}, h("strong", { text: p.label }), ` — ${p.usable ? "utilisable" : p.configuredOnServer ? "configuré, non activé pour cette boutique" : "non configuré sur le serveur"}`, h("small", { text: ` ${p.availability}` })))));
    if (C.markets.length) w.append(h("p", { text: `Marchés cités dans votre brief : ${C.markets.map((m) => m.name).join(", ")}.` }));
    if (C.todo.length) { w.append(h("h2", { text: "À traiter" })); for (const t of C.todo) w.append(h("p", { class: `aib-msg ${t.level === "blocking" ? "is-error" : t.level === "warning" ? "is-warn" : ""}`, text: t.message })); }
    if (CAN.payments) w.append(h("div", { class: "aib-bar" }, btn("Devise et pays", cfgBasics, { primary: true }), btn("Paiements", cfgPayments), btn("Zone de livraison", cfgZone), btn("Règle de taxe", cfgTax)));
    else w.append(h("p", { class: "aib-msg is-warn", text: "La configuration commerciale est réservée aux administrateurs de la boutique (droit « paiements »)." }));
    if (lastResult && step === "configuration") w.append(h("pre", { class: "aib-brief", role: "status", text: lastResult }));
    w.append(next("seo")); return w;
  }
  const applyCfg = (items, label) => act(async () => { const r = await api("POST", "/appliquer/configuration", { items }); lastResult = `${label} : ${r.result.done.join(", ") || "rien appliqué"}${r.result.refused.length ? `\nRefusé : ${r.result.refused.map((x) => `${x.item} (${x.reason})`).join(" ; ")}` : ""}`; return r; });
  async function cfgBasics() { const r = await ask({ title: "Devise et pays", ok: "Appliquer", fields: [{ name: "currency", label: "Devise (code, ex. EUR, USD, XOF)", value: S.config.engine.currency, max: 3 }, { name: "country", label: "Pays par défaut (code à 2 lettres)", value: S.config.engine.defaultCountry || "", required: false, max: 2 }] }); if (r) applyCfg({ currency: r.currency, defaultCountry: r.country || undefined }, "Réglages"); }
  async function cfgPayments() { const r = await ask({ title: "Moyens de paiement", ok: "Appliquer", text: "Seuls les moyens configurés sur le serveur sont acceptés.", fields: S.config.capabilities.paymentProviders.map((p) => ({ name: p.id, label: `${p.label} — ${p.configuredOnServer ? "disponible" : "non configuré"}`, type: "select", options: [{ value: "0", label: "Désactivé" }, { value: "1", label: "Activé" }] })) }); if (r) applyCfg({ paymentMethods: Object.entries(r).filter(([, v]) => v === "1").map(([k]) => k) }, "Paiements"); }
  async function cfgZone() { const r = await ask({ title: "Zone de livraison", ok: "Créer", text: "Saisissez VOS tarifs : aucun n'est proposé.", fields: [{ name: "name", label: "Nom de la zone", max: 80 }, { name: "countries", label: "Pays (codes séparés par des virgules)", max: 200 }, { name: "method", label: "Nom de la méthode (ex. Standard)", max: 80 }, { name: "cost", label: "Tarif (nombre dans la plus petite unité de la devise, ex. 1500 pour 15,00)", mode: "numeric", max: 9 }] }); if (r) applyCfg({ zones: [{ name: r.name, countries: r.countries.split(/[\s,;]+/).filter(Boolean), methods: [{ name: r.method, kind: "flat", costCents: Number(r.cost) }] }] }, "Livraison"); }
  async function cfgTax() { const r = await ask({ title: "Règle de taxe", ok: "Créer", text: "Saisissez le taux applicable (à faire valider par un professionnel). Aucun taux n'est proposé.", fields: [{ name: "name", label: "Nom (ex. TVA)", max: 60 }, { name: "country", label: "Pays (code ou *)", max: 2 }, { name: "rate", label: "Taux en % (ex. 16)", mode: "decimal", max: 6 }] }); if (r) applyCfg({ taxEnabled: true, taxRules: [{ name: r.name, country: r.country, rateBp: Math.round(Number(String(r.rate).replace(",", ".")) * 100) }] }, "Taxes"); }
  // ── 9. SEO ──
  function stepSeo() {
    const w = pane("SEO", "Titres, méta-descriptions et textes alternatifs. Aucun avis ni note n'est jamais généré.");
    const all = [...S.seoDrafts.map((i) => ({ level: i.level, message: i.message })), ...S.validation.seo.issues];
    if (!all.length) w.append(h("p", { class: "aib-ok", text: "Aucune remarque." })); for (const i of all.slice(0, 60)) w.append(h("p", { class: `aib-msg ${i.level === "warn" ? "is-warn" : ""}`, text: i.message }));
    w.append(h("h2", { text: "Limites du moteur" }), h("ul", {}, S.validation.seo.limits.map((l) => h("li", { text: l }))), next("apercu")); return w;
  }
  // ── 10. aperçu ──
  function stepApercu() {
    const w = pane("Prévisualisation", "Les pages éditoriales s'affichent avec l'aperçu natif ; les fiches produits en brouillon se contrôlent dans l'administration de la boutique (elles ne sont visibles du public qu'une fois publiées et la boutique ouverte).");
    const pages = Object.entries(S.applied.pages || {});
    if (pages.length) { const sel = h("select", { "aria-label": "Page à prévisualiser", onchange: (e) => { LS("preview", e.target.value); render(); } }, pages.map(([k, id]) => h("option", { value: id, text: (S.plan.pages.find((p) => p.key === k) || { name: k }).name, selected: String(id) === (LS("preview") || String(pages[0][1])) }))); w.append(h("div", { class: "aib-bar" }, sel), h("div", { class: "aib-frame-wrap" }, h("iframe", { class: "aib-frame", title: "Aperçu de la page", src: `/marketing/pages/${LS("preview") || pages[0][1]}/apercu`, loading: "lazy", style: "width:100%" }))); }
    else w.append(h("p", { text: "Aucune page éditoriale créée pour le moment." }));
    w.append(h("p", {}, h("a", { class: "aib-btn", href: `/marketing/site-web/sites/${S.project.siteId}/boutique`, target: "_blank", rel: "noopener" }, "Ouvrir l'administration de la boutique (fiches produits)")), next("verifications")); return w;
  }
  // ── 11. vérifications ──
  function stepVerifications() {
    const V = S.validation; const w = pane("Vérifications", "Contrôles calculés sur le catalogue et la configuration RÉELS. La boutique n'est « prête à vendre » que sans erreur bloquante.");
    w.append(h("p", { class: `aib-msg ${V.readyToSell ? "is-warn" : "is-error"}`, role: "status", text: V.readyToSell ? "Aucune erreur bloquante : la boutique peut être ouverte (aucun paiement n'a été testé par le constructeur)." : V.errors ? `Pas prête à vendre : ${V.errors} erreur(s) bloquante(s).` : "Pas prête à vendre : aucune erreur bloquante, mais aucun produit n'est publié (rien à vendre)." }));
    w.append(h("ul", { class: "aib-check" }, V.checks.map((c) => h("li", { class: `is-${c.level === "warning" ? "warn" : c.level === "missing" ? "warn" : c.level}` }, h("span", { class: "aib-ico", "aria-hidden": "true", text: c.level === "ok" ? "✓" : c.level === "error" ? "✕" : c.level === "info" ? "i" : "!" }), h("span", {}, h("strong", { text: c.label }), c.level === "error" ? h("em", { text: " (bloquant)" }) : null, h("small", { text: c.message })), h("span", { class: "aib-sr", text: LEVEL[c.level][1] })))));
    w.append(next("publication")); return w;
  }
  // ── 12. publication ──
  function stepPublication() {
    const V = S.validation; const w = pane("Publication", "Publie les produits qui passent les contrôles, les pages éditoriales, puis (si vous le demandez) ouvre la boutique. Aucun paiement n'est effectué.");
    const drafts = S.catalog.products.filter((p) => p.status !== "published");
    w.append(h("p", { text: `${drafts.length} produit(s) en brouillon dans le catalogue ; ${Object.keys(S.applied.pages || {}).length} page(s) éditoriale(s) créée(s) ; boutique ${S.capabilities.shopOpen ? "ouverte" : "fermée"}.` }));
    if (V.blockers.length) for (const b of V.blockers) w.append(h("p", { class: "aib-msg is-error", text: b }));
    w.append(h("div", { class: "aib-cta" }, btn("Publier produits et pages", () => publishDlg(false), { primary: true, disabled: !CAN.shop || !drafts.length && !Object.keys(S.applied.pages || {}).length }), btn("Publier et ouvrir la boutique", () => publishDlg(true), { disabled: !CAN.payments, aria: "Publier puis ouvrir la boutique au public" }), !CAN.payments ? h("small", { text: "Ouvrir la boutique exige le droit « paiements »." }) : null));
    if (lastResult && step === "publication") w.append(h("pre", { class: "aib-brief", role: "status", text: lastResult }));
    return w;
  }
  async function publishDlg(open) {
    if (!await confirmDlg(open ? "Publier et ouvrir la boutique ?" : "Publier ?", open ? "Les produits publiables et les pages sont publiés, puis la boutique est ouverte au public si aucune erreur ne subsiste." : "Les produits publiables et les pages éditoriales sont publiés. La boutique reste fermée tant que vous ne l'ouvrez pas.", open ? "Publier et ouvrir" : "Publier")) return;
    await act(async () => { const r = await api("POST", "/publier", { open }); const x = r.result; lastResult = `Produits publiés : ${x.products.join(", ") || "aucun"}\nPages publiées : ${x.pages.join(", ") || "aucune"}\nBoutique ouverte : ${x.opened ? "oui" : "non"}${x.refused.length ? `\nRefusé : ${x.refused.map((y) => `${y.name} (${y.reason})`).join(" ; ")}` : ""}`; return r; });
  }

  // ── assistant ──
  function renderChat() {
    const log = $("aib-chat"); log.replaceChildren();
    if (!proposal) log.append(h("p", { class: "aib-hint", text: "Demandez par exemple : « Ajoute une catégorie Imprimantes dans Ordinateurs », « Ajoute une page Nos engagements », « Ajoute un produit Clavier K2 »." }));
    for (const m of chat) log.append(h("div", { class: `aib-msgbox is-${m.role}` }, h("p", { text: m.text })));
    if (proposal) log.append(h("div", { class: "aib-msgbox is-assistant is-proposal" }, h("p", { text: proposal.text }), h("dl", { class: "aib-diff" }, h("dt", { text: "Changement" }), h("dd", { text: proposal.proposal.summary })), CAN.write ? h("div", { class: "aib-inline" }, btn("Accepter", async () => { const p = proposal; proposal = null; chat.push({ role: "assistant", text: `Accepté : ${p.proposal.summary}` }); await op(p.proposal.operation, p.proposal.summary); }, { primary: true }), btn("Refuser", () => { chat.push({ role: "assistant", text: "Proposition refusée." }); proposal = null; renderChat(); })) : null));
    log.scrollTop = log.scrollHeight;
  }
  const chat = [];
  $("aib-chat-form").addEventListener("submit", async (e) => {
    e.preventDefault(); const ta = e.target.querySelector("textarea"); const text = ta.value.trim(); if (!text) return; ta.value = "";
    chat.push({ role: "user", text }); proposal = null;
    try { const j = await api("POST", "/assistant", { message: text }); chat.push({ role: "assistant", text: j.reply.text }); if (j.reply.kind === "proposal") proposal = j.reply; if (j.reply.redirect && STEP_KEYS.includes(j.reply.redirect)) go(j.reply.redirect); } catch (err) { chat.push({ role: "assistant", text: err.message }); ta.value = text; }
    renderChat();
  });
  $("aib-chat-in").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("aib-chat-form").requestSubmit(); } });

  const RENDER = { brief: stepBrief, modele: stepModele, architecture: stepArchitecture, catalogue: stepCatalogue, produits: stepProduits, design: stepDesign, medias: stepMedias, configuration: stepConfiguration, seo: stepSeo, apercu: stepApercu, verifications: stepVerifications, publication: stepPublication };
  function render() {
    const active = document.activeElement;
    const stepKey = active && active.closest && active.closest("#aib-steps") ? (STEP_KEYS.find((k) => active.dataset && active.dataset.key === k) || null) : null;
    const inMain = Boolean(active && active.closest && active.closest("#aib-main"));
    renderTop(); renderSteps(); $("aib-ctx").textContent = S.steps.find((s) => s.key === step).label;
    const main = $("aib-main"); const y = main.scrollTop; main.replaceChildren(RENDER[step]()); main.scrollTop = y; renderChat();
    $("aib-chat-form").querySelector("textarea").disabled = !CAN.write;
    if (stepKey) { const b = document.querySelector(`#aib-steps [data-key="${stepKey}"]`); if (b) b.focus({ preventScroll: true }); }
    else if (inMain && (document.activeElement === document.body || !document.activeElement)) main.focus({ preventScroll: true });
  }
  $("aib-undo").addEventListener("click", () => act(() => api("POST", "/annuler", { revision: rev() })));
  $("aib-redo").addEventListener("click", () => act(() => api("POST", "/retablir", { revision: rev() })));
  $("aib-save-btn").addEventListener("click", async () => { const j = await refresh(); if (j) setSave("saved", `Enregistré et vérifié à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`); });
  const toggleAssist = () => { $("aib-body").classList.toggle("is-assist-closed"); LS("assist", $("aib-body").classList.contains("is-assist-closed") ? "closed" : "open"); $("aib-assist-btn").setAttribute("aria-expanded", $("aib-body").classList.contains("is-assist-closed") ? "false" : "true"); };
  $("aib-toggle-assist").addEventListener("click", () => { toggleAssist(); document.querySelector(".aib-menu").open = false; });
  $("aib-assist-btn").addEventListener("click", toggleAssist);
  if (LS("assist") === "closed" || (LS("assist") === null && window.matchMedia("(max-width: 1180px)").matches)) $("aib-body").classList.add("is-assist-closed");
  $("aib-assist-btn").setAttribute("aria-expanded", $("aib-body").classList.contains("is-assist-closed") ? "false" : "true");
  window.addEventListener("online", () => { if (failedNetwork) { const again = failedNetwork; banner("Connexion rétablie. La dernière action n'a PAS été enregistrée.", [btn("Réessayer", () => act(again))]); setSave("error", "Dernière action non enregistrée"); } else { banner(""); setSave("saved", "Connexion rétablie"); } });
  window.addEventListener("offline", () => { setSave("error", "Hors connexion"); banner("Vous êtes hors connexion. Vos actions ne seront pas enregistrées tant que la connexion n'est pas rétablie."); });
  window.addEventListener("beforeunload", (e) => { if (busy > 0) { e.preventDefault(); e.returnValue = ""; } });
  setSave("saved", `Enregistré — dernière modification ${when(S.project.updatedAt)}`);
  render();
})();

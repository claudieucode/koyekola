// Theme Builder (programme 23.1) : tableau de bord des modèles d'un site. Aucune donnée n'est insérée en HTML : tout passe par textContent ; les aperçus filaires (SVG construit côté serveur
// à partir de nombres et de classes fixes) sont analysés par DOMParser avant insertion.
(() => {
  const root = document.getElementById("tb"); if (!root) return;
  const base = root.dataset.base, canWrite = root.dataset.write === "1", canRemove = root.dataset.remove === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  const status = (m, k) => { const s = $("tb-status"); s.textContent = m || ""; s.dataset.k = k || ""; };
  const api = async (path, opt = {}) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) { const e = new Error(j.error || "Erreur."); e.code = j.code; e.conflicts = j.conflicts; throw e; } return j; };
  const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b || {}) });
  const ST = { published: "Publié", draft: "Brouillon", archived: "Archivé" };
  let data = null, opts = null, cur = "", editing = null;
  const dates = (s) => (s ? String(s).slice(0, 16).replace("T", " ") : "—");

  function drawTypes() {
    const ul = $("tb-types"); ul.textContent = "";
    const all = el("li"); const b0 = el("button"); b0.type = "button"; b0.setAttribute("aria-current", String(cur === "")); b0.append(el("span", "", "Toutes les parties"), el("span", "tb-count", String(data.total))); b0.addEventListener("click", () => { cur = ""; load(); }); all.append(b0); ul.append(all);
    let g = "";
    for (const t of data.types) {
      if (t.group !== g) { g = t.group; ul.append(el("li", "tb-grp", data.groups[g])); }
      const li = el("li"), b = el("button"); b.type = "button"; b.setAttribute("aria-current", String(cur === t.key)); if (!t.available) { b.disabled = true; b.title = t.reason; }
      const dot = el("span", "tb-dot"); dot.dataset.live = t.live ? "1" : "0"; dot.setAttribute("aria-hidden", "true");
      b.append(dot, el("span", "", t.label), el("span", "tb-count", String(t.count)));
      if (t.live) b.setAttribute("aria-label", `${t.label} : ${t.count} modèle(s), ${t.live} publié(s)`);
      b.addEventListener("click", () => { cur = t.key; load(); }); li.append(b); ul.append(li);
    }
    const sel = $("tb-new-type"); if (!sel.options.length) for (const t of data.types) { const o = el("option", "", t.available ? t.label : `${t.label} (indisponible)`); o.value = t.key; o.disabled = !t.available; sel.append(o); }
    const w = $("tb-why-type"); if (!w.options.length) for (const t of data.types) { const o = el("option", "", t.label); o.value = t.key; w.append(o); }
  }
  function svgOf(markup) { const d = new DOMParser().parseFromString(markup, "image/svg+xml"); return document.importNode(d.documentElement, true); }
  function menu(t) {
    const wrap = el("div", "tb-menu"); const btn = el("button", "btn btn-sm btn-outline", "⋯"); btn.type = "button"; btn.setAttribute("aria-haspopup", "true"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-label", `Actions pour ${t.name}`);
    const ul = el("ul", "tb-menu-list"); ul.hidden = true; ul.setAttribute("role", "menu");
    const item = (label, fn) => { const li = el("li"), b = el("button", "", label); b.type = "button"; b.setAttribute("role", "menuitem"); b.addEventListener("click", () => { close(); fn(); }); li.append(b); ul.append(li); };
    const close = () => { ul.hidden = true; btn.setAttribute("aria-expanded", "false"); };
    btn.addEventListener("click", () => { const open = ul.hidden; document.querySelectorAll(".tb-menu-list").forEach((u) => { u.hidden = true; }); ul.hidden = !open; btn.setAttribute("aria-expanded", String(open)); if (open) ul.querySelector("button").focus(); });
    wrap.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); btn.focus(); } });
    if (canWrite && t.status !== "archived") {
      item("Renommer", () => rename(t)); item("Dupliquer", () => act(t, "dupliquer", "Modèle dupliqué (brouillon)."));
      if (t.status === "published") item("Dépublier", () => act(t, "depublier", "Modèle dépublié."));
      item("Archiver", () => act(t, "archiver", "Modèle archivé."));
    }
    if (canWrite && t.status === "archived") { item("Restaurer", () => act(t, "restaurer", "Modèle restauré en brouillon.")); if (canRemove) item("Supprimer définitivement", () => remove(t)); }
    item("Exporter (JSON)", () => { location.href = `${base}/api/modeles/${t.id}/export.json`; }); item("Versions", () => versions(t)); item("Où est-il utilisé ?", () => where(t));
    wrap.append(btn, ul); return wrap;
  }
  function card(t) {
    const c = el("article", "tb-card"); c.dataset.status = t.status; c.dataset.id = t.id;
    const th = el("a", "tb-thumb"); th.href = t.editUrl; th.setAttribute("aria-label", `Ouvrir « ${t.name} » dans l'éditeur`); th.append(svgOf(t.thumb)); c.append(th);
    const b = el("div", "tb-body"); b.append(el("h3", "", t.name), el("p", "tb-type", t.typeLabel));
    const bd = el("div", "tb-badges"); const s = el("span", "tb-badge", ST[t.status]); s.dataset.k = t.status; bd.append(s); if (t.hasConflict) { const x = el("span", "tb-badge", "Conflit"); x.dataset.k = "conflict"; bd.append(x); } if (t.documentMissing) { const x = el("span", "tb-badge", "Document manquant"); x.dataset.k = "conflict"; bd.append(x); } b.append(bd);
    const m = el("p", "tb-meta"); const l1 = el("span"); l1.append(el("b", "", "S'affiche : "), document.createTextNode(t.describe.include)); m.append(l1);
    if (t.describe.exclude) { const l2 = el("span"); l2.append(el("b", "", "Sauf : "), document.createTextNode(t.describe.exclude)); m.append(l2); }
    const l3 = el("span"); l3.append(el("b", "", "Modifié : "), document.createTextNode(dates(t.updatedAt))); m.append(l3); b.append(m);
    const a = el("div", "tb-actions"); const ed = el("a", "btn btn-sm btn-primary", "Modifier"); ed.href = t.editUrl; a.append(ed);
    if (canWrite && t.status !== "archived") { const cd = el("button", "btn btn-sm btn-outline", "Conditions"); cd.type = "button"; cd.addEventListener("click", () => conditions(t)); a.append(cd);
      const pb = el("button", "btn btn-sm btn-outline", t.status === "published" ? "Republier" : "Publier"); pb.type = "button"; pb.addEventListener("click", () => publish(t)); a.append(pb); }
    a.append(menu(t)); b.append(a); c.append(b); return c;
  }
  function drawCards() {
    const box = $("tb-cards"); box.textContent = ""; $("tb-title").textContent = cur ? (data.types.find((t) => t.key === cur) || {}).label : "Toutes les parties";
    if (!data.templates.length) { const p = el("p", "sw-muted", data.total || data.archived ? "Aucun modèle ne correspond à ces filtres." : "Aucun modèle pour ce site. Créez-en un avec « Ajouter un modèle », ou reprenez l'existant avec « Récupérer l'existant »."); box.append(p); }
    for (const t of data.templates) box.append(card(t));
    const cf = $("tb-conflicts"); cf.hidden = !data.conflicts.length; cf.textContent = "";
    if (data.conflicts.length) { cf.append(el("strong", "", `${data.conflicts.length} conflit(s) entre modèles publiés`)); for (const c of data.conflicts) { const p = el("p"); p.append(el("b", "", c.severity === "blocking" ? "Bloquant : " : "Attention : "), document.createTextNode(`${c.message} ${c.suggestion}`)); cf.append(p); } }
  }
  async function load() {
    try { const q = new URLSearchParams(); if (cur) q.set("type", cur); if ($("tb-q").value.trim()) q.set("q", $("tb-q").value.trim()); const st = $("tb-st").value; if (st) q.set("statut", st); data = await api(`/modeles?${q}`); drawTypes(); drawCards(); }
    catch (e) { status(e.message, "err"); }
  }
  async function act(t, path, ok) { try { await post(`/modeles/${t.id}/${path}`); status(ok, "ok"); await load(); } catch (e) { status(e.message, "err"); } }
  async function rename(t) { const n = prompt("Nouveau nom du modèle", t.name); if (n === null) return; try { await post(`/modeles/${t.id}/renommer`, { name: n }); status("Modèle renommé.", "ok"); await load(); } catch (e) { status(e.message, "err"); } }
  async function remove(t) { if (!confirm(`Supprimer définitivement « ${t.name} » ? Le document (page ou composant) reste dans vos pages.`)) return; try { await post(`/modeles/${t.id}/supprimer`); status("Modèle supprimé.", "ok"); await load(); } catch (e) { status(e.message, "err"); } }
  async function publish(t) {
    try { const r = await post(`/modeles/${t.id}/publier`, { revision: t.revision }); status(r.conflicts && r.conflicts.length ? `Publié, avec ${r.conflicts.length} avertissement(s) : voir les conflits.` : "Modèle publié.", "ok"); await load(); }
    catch (e) { status(e.message, "err"); if (e.conflicts) await load(); }
  }
  const dlg = (id) => $(id);
  function openDlg(id) { const d = dlg(id); if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDlg(d) { if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeDlg(b.closest("dialog"))));

  // ---- éditeur de conditions
  const LIST = { ids: "Identifiants (virgules)", category: "Catégories (virgules)", childCategory: "Sous-catégories de (virgules)", tag: "Étiquettes (virgules)", author: "Auteurs (identifiants)", names: "Noms (virgules)" };
  function row(kindsAllowed, c) {
    const r = el("div", "tb-row"); const kw = el("label", "sw-field", "Condition"); const ks = el("select"); for (const k of opts.kinds.filter((k) => kindsAllowed.includes(k.key))) { const o = el("option", "", k.label); o.value = k.key; ks.append(o); } kw.append(ks); r.append(kw);
    const params = el("div", "tb-row-params"); params.style.display = "contents"; r.append(params); const rm = el("button", "btn btn-sm btn-outline", "Retirer"); rm.type = "button"; rm.addEventListener("click", () => r.remove()); r.append(rm);
    const fields = () => {
      params.textContent = ""; const def = opts.kinds.find((k) => k.key === ks.value);
      for (const k of def.criteria) {
        const w = el("label", "sw-field"); let inp;
        if (k === "sub") { w.append(el("span", "", "Type d'archive")); inp = el("select"); for (const s of opts.subs[ks.value] || []) { const o = el("option", "", { all: "Toutes", blog: "Blog", category: "Catégorie", tag: "Étiquette", author: "Auteur", date: "Date", search: "Recherche", shop: "Boutique" }[s] || s); o.value = s; inp.append(o); } }
        else if (k === "parent") { w.append(el("span", "", "Page parente")); inp = el("select"); for (const p of opts.pages) { const o = el("option", "", p.name); o.value = p.id; inp.append(o); } }
        else if (k === "direct" || k === "child") { w.append(el("span", "", k === "direct" ? "Enfants directs seulement" : "Inclure les sous-éléments")); inp = el("input"); inp.type = "checkbox"; }
        else if (k === "id") { w.append(el("span", "", "Identifiant")); inp = el("input"); }
        else if (k === "args") continue;
        else { w.append(el("span", "", LIST[k] || k)); inp = el("input"); inp.maxLength = 400; if (k === "ids" && ks.value === "page") { inp.placeholder = "ex. " + (opts.pages[0] ? opts.pages[0].id : "12"); } }
        inp.dataset.k = k; w.append(inp); params.append(w);
      }
    };
    ks.addEventListener("change", fields); if (c) ks.value = c.kind; fields();
    if (c) for (const inp of params.querySelectorAll("[data-k]")) { const v = c[inp.dataset.k]; if (v === undefined) continue; if (inp.type === "checkbox") inp.checked = Boolean(v); else inp.value = Array.isArray(v) ? v.join(", ") : v; }
    r.dataset.row = "1"; r.getKind = () => ks.value; r.read = () => {
      const o = { kind: ks.value };
      for (const inp of params.querySelectorAll("[data-k]")) { const k = inp.dataset.k; if (inp.type === "checkbox") { if (inp.checked) o[k] = true; } else if (inp.value.trim() !== "") { o[k] = k === "parent" ? Number(inp.value) : k === "sub" ? (inp.value === "all" ? undefined : inp.value) : inp.value; } }
      return o;
    };
    return r;
  }
  const allowedKinds = (type) => { const d = data.types.find((t) => t.key === type); const all = opts.kinds.map((k) => k.key).filter((k) => k !== "custom"); if (!d) return all; const glob = ["global", "custom"].includes(d.group); if (glob) return all; return all.filter((k) => opts.kinds.find((x) => x.key === k).views.some((v) => VIEWS[type].includes(v))); };
  const VIEWS = { single_page: ["front", "page"], single_post: ["post"], archive: ["archive"], search_results: ["search"], not_found: ["not_found"], single_product: ["product"], product_archive: ["product_archive"] };
  async function conditions(t) {
    editing = t; if (!opts) opts = await api("/options");
    const fill = (id, list) => { const box = $(id); box.textContent = ""; for (const c of list) box.append(row(allowedKinds(t.type), c)); };
    fill("tb-inc", t.conditions.include || []); fill("tb-exc", t.conditions.exclude || []); $("tb-cond-msg").hidden = true; $("tb-dlg-cond-h").textContent = `Conditions — ${t.name}`; openDlg("tb-dlg-cond");
  }
  $("tb-add-inc").addEventListener("click", () => $("tb-inc").append(row(allowedKinds(editing.type))));
  $("tb-add-exc").addEventListener("click", () => $("tb-exc").append(row(allowedKinds(editing.type))));
  $("tb-form-cond").addEventListener("submit", async (e) => {
    e.preventDefault(); const rd = (id) => [...$(id).querySelectorAll("[data-row]")].map((r) => r.read());
    try { const r = await post(`/modeles/${editing.id}/conditions`, { conditions: { include: rd("tb-inc"), exclude: rd("tb-exc") }, revision: editing.revision }); closeDlg($("tb-dlg-cond")); status(r.conflicts && r.conflicts.length ? "Conditions enregistrées — attention aux conflits signalés." : "Conditions enregistrées.", "ok"); await load(); }
    catch (err) { const m = $("tb-cond-msg"); m.hidden = false; m.textContent = err.message; }
  });

  // ---- création, import, ancien système
  $("tb-new")?.addEventListener("click", () => { $("tb-new-name").value = ""; if (cur) $("tb-new-type").value = cur; openDlg("tb-dlg-new"); });
  $("tb-form-new").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { const r = await post("/modeles", { type: $("tb-new-type").value, name: $("tb-new-name").value }); closeDlg($("tb-dlg-new")); status("Modèle créé en brouillon.", "ok"); location.href = r.template.editUrl; }
    catch (err) { status(err.message, "err"); closeDlg($("tb-dlg-new")); }
  });
  $("tb-import")?.addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return; e.target.value = "";
    try { if (f.size > 2000000) throw new Error("Fichier trop volumineux."); const payload = JSON.parse(await f.text()); await post("/importer", { payload }); status("Modèle importé en brouillon.", "ok"); await load(); }
    catch (err) { status(err instanceof SyntaxError ? "Ce fichier n'est pas un JSON valide." : err.message, "err"); }
  });
  $("tb-legacy")?.addEventListener("click", async () => {
    try { const r = await post("/importer-ancien"); status(`${r.imported.length} élément(s) repris${r.skipped.length ? `, ${r.skipped.length} ignoré(s) (${r.skipped.filter((s) => s.reason !== "déjà importé").map((s) => `${s.label} : ${s.reason}`).join(" ; ") || "déjà importés"})` : ""}.`, "ok"); await load(); }
    catch (err) { status(err.message, "err"); }
  });

  // ---- versions, utilisation, simulation
  function info(title, build) { $("tb-dlg-info-h").textContent = title; const box = $("tb-info"); box.textContent = ""; build(box); openDlg("tb-dlg-info"); }
  async function versions(t) {
    try { const r = await api(`/modeles/${t.id}/versions`); info(`Versions — ${t.name}`, (box) => { if (!r.versions.length) box.append(el("p", "sw-muted", "Aucune version publiée pour l'instant.")); const ul = el("ul"); for (const v of r.versions) { const li = el("li"); li.append(document.createTextNode(`Version ${v.number} · ${dates(v.createdAt)} · ${v.describe.include}${v.describe.exclude ? ` (sauf ${v.describe.exclude})` : ""} `)); if (canWrite) { const b = el("button", "btn btn-sm btn-outline", "Restaurer en brouillon"); b.type = "button"; b.addEventListener("click", async () => { try { await post(`/modeles/${t.id}/versions/${v.number}/restaurer`); closeDlg($("tb-dlg-info")); status(`Version ${v.number} restaurée en brouillon.`, "ok"); await load(); } catch (e) { status(e.message, "err"); } }); li.append(b); } ul.append(li); } box.append(ul); }); }
    catch (e) { status(e.message, "err"); }
  }
  async function where(t) {
    try { const r = await api(`/modeles/${t.id}/instances`); info(`Utilisation — ${t.name}`, (box) => { if (r.note) box.append(el("p", "sw-muted", r.note)); if (r.enumerable) { box.append(el("p", "", `${r.total} page(s) sur ${r.of} publiée(s).`)); const ul = el("ul"); for (const p of r.pages) ul.append(el("li", "", p.name)); box.append(ul); } }); }
    catch (e) { status(e.message, "err"); }
  }
  $("tb-why").addEventListener("click", async () => { if (!opts) opts = await api("/options"); if (cur) $("tb-why-type").value = cur; $("tb-why-out").textContent = ""; openDlg("tb-dlg-why"); });
  $("tb-form-why").addEventListener("submit", async (e) => {
    e.preventDefault(); const q = new URLSearchParams({ type: $("tb-why-type").value, vue: $("tb-why-view").value, id: $("tb-why-id").value, categories: $("tb-why-cat").value, etiquettes: $("tb-why-tag").value, archive: $("tb-why-arch").value, nom: $("tb-why-name").value });
    try { const r = await api(`/resolution?${q}`); const out = $("tb-why-out"); out.textContent = ""; out.append(el("p", "", r.winner ? `Modèle appliqué : « ${r.winner.name} ».` : "Aucun modèle publié ne s'applique : l'affichage d'origine du site est utilisé.")); const ul = el("ul", "tb-explain"); for (const x of r.explain) { const li = el("li", "", `${x.name} — ${x.reason}`); li.dataset.s = x.state; ul.append(li); } out.append(ul); }
    catch (err) { $("tb-why-out").textContent = err.message; }
  });
  $("tb-tools").addEventListener("submit", (e) => e.preventDefault());
  $("tb-q").addEventListener("input", () => { clearTimeout(load.t); load.t = setTimeout(load, 250); }); $("tb-st").addEventListener("change", load);
  document.addEventListener("click", (e) => { if (!e.target.closest(".tb-menu")) document.querySelectorAll(".tb-menu-list").forEach((u) => { u.hidden = true; }); });
  load();
})();

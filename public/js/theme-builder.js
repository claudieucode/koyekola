// Theme Builder (programme 23.1) : tableau de bord des modèles d'un site. Aucune donnée n'est insérée en HTML : tout passe par textContent ; les aperçus filaires (SVG construit côté serveur
// à partir de nombres et de classes fixes) sont analysés par DOMParser avant insertion.
(() => {
  const root = document.getElementById("tb"); if (!root) return;
  document.body.append(root); // plein écran : rattaché au body pour échapper à tout ancêtre qui crée un bloc conteneur (transform, contain) du gabarit
  const base = root.dataset.base, canWrite = root.dataset.write === "1", canRemove = root.dataset.remove === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  const status = (m, k) => { const s = $("tb-status"); s.textContent = m || ""; s.dataset.k = k || ""; };
  const api = async (path, opt = {}) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) { const e = new Error(j.error || "Erreur."); e.code = j.code; e.conflicts = j.conflicts; throw e; } return j; };
  const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b || {}) });
  const ST = { published: "Publié", draft: "Brouillon", archived: "Archivé" };
  let data = null, opts = null, cur = "", editing = null;
  // Icônes de navigation et structures types : balisage STATIQUE du code (aucune donnée du site), analysé par DOMParser comme les aperçus serveur.
  const IC = (d) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">${d}</svg>`;
  const ICONS = {
    all: IC('<path d="M4 7h16M7 12h10M10 17h4"/>'), header: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M3.5 9h17"/>'), footer: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M3.5 15h17"/>'),
    single_page: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M6 16l4-4 3 3 2-2 3 3"/><circle cx="9" cy="9" r="1"/>'), single_post: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M6.5 9h4v4h-4zM13 9h5M13 12h5M6.5 16h11"/>'),
    archive: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M8 9h.01M12 9h.01M16 9h.01M8 12h.01M12 12h.01M16 12h.01M8 15h.01M12 15h.01M16 15h.01"/>'), search_results: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><circle cx="11" cy="11.5" r="2.5"/><path d="M13 13.5l2.5 2.5M6.5 8h11"/>'),
    single_product: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M7 9h2l1.2 5h5L16.5 10H9.3"/><circle cx="11" cy="16.5" r=".6"/><circle cx="15" cy="16.5" r=".6"/>'), product_archive: IC('<rect x="4" y="4.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4.5" width="6.5" height="6.5" rx="1"/><rect x="4" y="13" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13" width="6.5" height="6.5" rx="1"/>'),
    not_found: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M7 14.5v-4l-2 3h3M10.5 10.5h2.5v4h-2.5zM15.5 14.5v-4l-2 3h3"/>'), sidebar: IC('<rect x="3.5" y="5" width="17" height="14" rx="1"/><path d="M15 5v14"/>'), custom: IC('<path d="M12 4v16M4 12h16"/>'),
    info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="currentColor"/><path d="M12 11v5.5" stroke="Canvas" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.7" r="1.2" fill="Canvas"/></svg>',
  };
  const R = (c, x, y, w, h) => `<rect class="tb-w-${c}" x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5"/>`, T = (x, y, t, a) => `<text class="tb-w-txt" x="${x}" y="${y}"${a ? ` text-anchor="${a}"` : ""}>${t}</text>`;
  const grid = (cols, rows, x0, y0, w, h) => { let o = ""; const cw = (w - (cols - 1) * 6) / cols, rh = h / rows; for (let r = 0; r < rows; r += 1) for (let c = 0; c < cols; c += 1) { const x = x0 + c * (cw + 6), y = y0 + r * rh; o += R("img", x, y, cw, rh - 14) + R("line", x, y + rh - 10, cw, 2) + R("line", x, y + rh - 5, cw * 0.6, 2); } return o; };
  const WIRE = {
    header: R("box", 8, 10, 184, 14) + T(12, 20, "Logo") + [0, 1, 2, 3].map((i) => R("line", 90 + i * 24, 16, 16, 2)).join(""),
    footer: R("box", 8, 88, 184, 30) + T(12, 106, "Logo") + [0, 1, 2, 3].map((i) => R("line", 90 + i * 26, 94, 20, 2) + R("line", 90 + i * 26, 100, 20, 2) + R("line", 90 + i * 26, 106, 20, 2)).join(""),
    single_page: T(100, 18, "Titre de la page", "middle") + R("img", 24, 26, 152, 54) + R("box", 8, 92, 184, 24) + T(100, 108, "Appel à l'action", "middle"),
    single_post: T(12, 16, "Titre de l'article") + R("img", 12, 21, 8, 8) + T(24, 28, "Auteur") + R("bar", 12, 34, 22, 6) + R("bar", 38, 34, 22, 6) + R("img", 12, 46, 176, 44) + R("line", 12, 98, 176, 2) + R("line", 12, 104, 176, 2) + R("line", 12, 110, 110, 2),
    archive: T(12, 16, "Titre de l'archive") + grid(3, 2, 12, 22, 176, 94),
    search_results: R("box", 8, 8, 184, 12) + T(14, 17, "Rechercher") + T(12, 36, "Résultats") + [0, 1, 2].map((i) => R("img", 12, 42 + i * 26, 24, 20) + R("line", 42, 44 + i * 26, 146, 2) + R("line", 42, 50 + i * 26, 146, 2) + R("line", 42, 56 + i * 26, 90, 2)).join(""),
    single_product: R("img", 14, 14, 70, 56) + T(96, 24, "Titre du produit") + R("bar", 96, 30, 20, 4) + R("line", 96, 40, 90, 2) + R("line", 96, 46, 90, 2) + R("btn", 96, 54, 40, 8) + T(100, 86, "Produits suggérés", "middle") + [0, 1, 2].map((i) => R("img", 36 + i * 46, 92, 40, 22)).join(""),
    product_archive: T(12, 16, "Produits") + R("line", 12, 26, 28, 2) + R("line", 12, 32, 28, 2) + R("line", 12, 38, 28, 2) + grid(3, 2, 50, 22, 140, 94),
    not_found: T(100, 28, "Page introuvable", "middle") + `<text class="tb-w-txt" x="100" y="86" text-anchor="middle" style="font-size:38px;font-weight:700">404</text>`,
    sidebar: R("box", 140, 10, 52, 100) + R("line", 146, 20, 40, 2) + R("line", 146, 28, 40, 2) + R("line", 146, 36, 30, 2) + R("line", 8, 14, 120, 2) + R("line", 8, 22, 120, 2) + R("line", 8, 30, 90, 2),
    custom: R("box", 40, 20, 120, 80) + T(100, 64, "Votre modèle", "middle"),
  };
  const wireSvg = (k) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 124" role="img" aria-label="Structure type, sans modèle créé" focusable="false">${WIRE[k] || WIRE.custom}</svg>`;
  const LEAD = {
    "": "Prenez le contrôle total, gagnez en cohérence et en rapidité en concevant les parties récurrentes qui composent un site complet : en-tête et pied de page, archives, page 404, pages de boutique et plus encore.",
    header: "L'en-tête s'affiche en haut de chaque page : logo, navigation, boutons.", footer: "Le pied de page s'affiche en bas de chaque page : colonnes, liens, mentions.",
    single_page: "Modèle des pages individuelles : titre, image mise en avant et contenu.", single_post: "Modèle des articles individuels : titre, auteur, image et texte.",
    archive: "Modèle des listes de contenus : blog, catégories, étiquettes, auteurs.", search_results: "Modèle de la page de résultats de recherche.",
    single_product: "Modèle de la fiche produit : visuel, titre, prix et bouton d'achat.", product_archive: "Modèle des listes de produits : boutique et catégories.", not_found: "Modèle affiché quand une page est introuvable.",
    sidebar: "Barre latérale réutilisable, affichée selon vos conditions.", custom: "Modèles libres, affichés là où vos conditions le décident.",
  };
  const dates = (s) => (s ? String(s).slice(0, 16).replace("T", " ") : "—");

  // Ordre de l'interface : parties du site d'abord, puis barre latérale et modèle personnalisé.
  const ordered = () => { const o = (t) => (t.key === "sidebar" ? 1 : t.key === "custom" ? 2 : 0); return [...data.types].sort((a, b) => o(a) - o(b)); };
  function drawTypes() {
    const ul = $("tb-types"); ul.textContent = "";
    const all = el("li"); const b0 = el("button"); b0.type = "button"; b0.setAttribute("aria-current", String(cur === "")); b0.append(icon("all"), el("span", "", "Toutes les parties"), el("span", "tb-count", String(data.total))); b0.addEventListener("click", () => { cur = ""; load(); }); all.append(b0); ul.append(all);
    let g = "";
    for (const t of ordered()) {
      if (!g) { g = "x"; ul.append(el("li", "tb-grp", "Parties du site")); }
      const li = el("li"), b = el("button"); b.type = "button"; b.setAttribute("aria-current", String(cur === t.key)); if (!t.available) { b.disabled = true; b.title = t.reason; }
      const dot = el("span", "tb-dot"); dot.dataset.live = t.live ? "1" : "0"; dot.setAttribute("aria-hidden", "true");
      b.append(icon(t.key), el("span", "", t.label), el("span", "tb-count", String(t.count)), dot);
      if (t.live) b.setAttribute("aria-label", `${t.label} : ${t.count} modèle(s), ${t.live} publié(s)`);
      b.addEventListener("click", () => { cur = t.key; load(); }); li.append(b); ul.append(li);
    }
    const sel = $("tb-new-type"); if (!sel.options.length) for (const t of data.types) { const o = el("option", "", t.available ? t.label : `${t.label} (indisponible)`); o.value = t.key; o.disabled = !t.available; sel.append(o); }
    const w = $("tb-why-type"); if (!w.options.length) for (const t of data.types) { const o = el("option", "", t.label); o.value = t.key; w.append(o); }
  }
  function icon(k) { const s = svgOf(ICONS[k] || ICONS.custom); s.setAttribute("class", "tb-ico"); s.setAttribute("aria-hidden", "true"); return s; }
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
  function infoBtn(name, fn) { const b = el("button", "tb-info"); b.type = "button"; b.setAttribute("aria-label", `Informations sur ${name}`); b.append(svgOf(ICONS.info)); b.firstChild.setAttribute("width", "18"); b.firstChild.setAttribute("height", "18"); b.addEventListener("click", fn); return b; }
  function details(t) { info(`Détails — ${t.name}`, (box) => { const p = (k, v) => { const x = el("p"); x.append(el("b", "", `${k} : `), document.createTextNode(v)); box.append(x); }; p("Type", t.typeLabel); p("État", ST[t.status]); p("S'affiche", t.describe.include); if (t.describe.exclude) p("Sauf", t.describe.exclude); p("Modifié", dates(t.updatedAt)); }); }
  // Carte « structure type » : un type sans modèle. Pointillés + libellé explicite : ce n'est PAS l'aperçu d'un modèle existant.
  function ghost(t) {
    const c = el("article", "tb-tcard"); c.dataset.type = t.key; const ch = el("div", "tb-ch"); ch.append(el("h3", "", t.label), infoBtn(t.label, () => info(t.label, (box) => box.append(el("p", "", LEAD[t.key] || ""), el("p", "sw-muted", "Aucun modèle n'existe pour cette partie : la structure ci-dessous est un exemple, pas un aperçu de votre site.")))));
    const th = el("div", "tb-thumb"); th.append(svgOf(wireSvg(t.key))); const b = el("div", "tb-body"); b.append(el("p", "tb-type", "Aucun modèle"));
    if (canWrite) { const a = el("div", "tb-actions"); const bt = el("button", "btn btn-sm btn-outline", "Créer un modèle"); bt.type = "button"; bt.setAttribute("aria-label", `Créer un modèle : ${t.label}`); bt.addEventListener("click", () => { $("tb-new-name").value = ""; $("tb-new-type").value = t.key; openDlg("tb-dlg-new"); }); a.append(bt); b.append(a); }
    c.append(ch, th, b); return c;
  }
  function card(t) {
    const c = el("article", "tb-card"); c.dataset.status = t.status; c.dataset.id = t.id;
    const ch = el("div", "tb-ch"); ch.append(el("h3", "", t.name), infoBtn(t.name, () => details(t))); c.append(ch);
    const th = el("a", "tb-thumb"); th.href = t.editUrl; th.setAttribute("aria-label", `Ouvrir « ${t.name} » dans l'éditeur`); th.append(svgOf(t.thumb)); c.append(th);
    const b = el("div", "tb-body"); b.append(el("p", "tb-type", t.typeLabel));
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
    const box = $("tb-cards"); box.textContent = ""; box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
    const ty = cur ? data.types.find((t) => t.key === cur) || {} : null, filtered = Boolean($("tb-q").value.trim() || $("tb-st").value);
    $("tb-title").textContent = cur ? ty.label : "Personnalisez chaque partie de votre site"; $("tb-lead").textContent = LEAD[cur] || "";
    if (!data.templates.length) { const p = el("p", "sw-muted", data.total || data.archived ? "Aucun modèle ne correspond à ces filtres." : "Aucun modèle pour ce site. Créez-en un avec « Ajouter un modèle », ou reprenez l'existant avec « Récupérer l'existant »."); box.append(p); }
    for (const t of data.templates) box.append(card(t));
    if (!filtered) for (const t of ordered()) if (t.available && !t.count && (!cur || cur === t.key)) box.append(ghost(t));
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
    try { const r = await api(`/modeles/${t.id}/versions`); info(`Versions — ${t.name}`, (box) => { if (!r.versions.length) box.append(el("p", "sw-muted", "Aucune version publiée pour l'instant.")); const ul = el("ul"); for (const v of r.versions) { const li = el("li"); li.append(document.createTextNode(`Version ${v.number} · ${dates(v.createdAt)} · ${v.describe.include}${v.describe.exclude ? ` (sauf ${v.describe.exclude})` : ""} `)); if (canWrite) { const b = el("button", "btn btn-sm btn-outline", "Restaurer en brouillon"); b.type = "button"; b.addEventListener("click", async () => { try { const rr = await post(`/modeles/${t.id}/versions/${v.number}/restaurer`); closeDlg($("tb-dlg-info")); status(`Version ${v.number} : contenu restauré en brouillon de travail (rien n'est changé en ligne avant la publication).${rr.conditionsRestored ? "" : " Les conditions en ligne n'ont pas été modifiées."}`, "ok"); await load(); } catch (e) { status(e.message, "err"); } }); li.append(b); } ul.append(li); } box.append(ul); }); }
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

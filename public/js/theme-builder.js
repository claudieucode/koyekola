// Theme Builder (programme 23.1) : tableau de bord des modèles d'un site. Aucune donnée n'est insérée en HTML : tout passe par textContent ; les aperçus filaires (SVG construit côté serveur
// à partir de nombres et de classes fixes) sont analysés par DOMParser avant insertion.
(() => {
  const root = document.getElementById("tb"); if (!root) return;
  document.body.append(root); // plein écran : rattaché au body pour échapper à tout ancêtre qui crée un bloc conteneur (transform, contain) du gabarit
  const base = root.dataset.base, canWrite = root.dataset.write === "1", canRemove = root.dataset.remove === "1";
  const $ = (id) => document.getElementById(id), el = (t, c, txt) => { const e = document.createElement(t); if (c) e.className = c; if (txt !== undefined) e.textContent = txt; return e; };
  // Thème clair / sombre / automatique : MÊME système que le reste de l'interface (attributs data-kola-pref / data-kola-theme sur <html>, mémorisé sous « kolaTheme ») ; aucun système parallèle
  (() => {
    const html = document.documentElement, group = root.querySelector("#tb-theme"); if (!group) return;
    const pref = () => { const p = html.getAttribute("data-kola-pref"); return p === "light" || p === "dark" ? p : "auto"; };
    const paint = () => group.querySelectorAll("[data-tb-theme]").forEach((b) => { const on = b.dataset.tbTheme === pref(); b.setAttribute("aria-checked", on ? "true" : "false"); b.tabIndex = on ? 0 : -1; });
    const apply = (p, remember) => {
      const dark = p === "dark" || (p !== "light" && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      html.setAttribute("data-kola-pref", p); html.setAttribute("data-kola-theme", dark ? "dark" : "light");
      if (remember) { try { localStorage.setItem("kolaTheme", p); } catch { /* navigation privée : préférence non conservée */ } }
      paint();
    };
    group.addEventListener("click", (e) => { const b = e.target.closest("[data-tb-theme]"); if (b) apply(b.dataset.tbTheme, true); });
    group.addEventListener("keydown", (e) => {
      const order = ["light", "dark", "auto"], i = order.indexOf(pref()), d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return; e.preventDefault(); apply(order[(i + d + order.length) % order.length], true); const b = group.querySelector(`[data-tb-theme="${pref()}"]`); if (b) b.focus();
    });
    if (window.matchMedia) matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (pref() === "auto") apply("auto", false); });
    paint();
  })();
  let statusT = 0;
  const status = (m, k) => { const s = $("tb-status"); s.textContent = m || ""; s.dataset.k = k || ""; s.dataset.show = m ? "1" : "0"; clearTimeout(statusT); if (m && k !== "err") statusT = setTimeout(() => { s.dataset.show = "0"; }, 6000); };
  const api = async (path, opt = {}) => { const r = await fetch(`${base}/api${path}`, { credentials: "same-origin", headers: { "Content-Type": "application/json" }, ...opt }); const j = await r.json().catch(() => ({ ok: false, error: "Réponse illisible." })); if (!j.ok) { const e = new Error(j.error || "Erreur."); e.code = j.code; e.conflicts = j.conflicts; throw e; } return j; };
  const post = (p, b) => api(p, { method: "POST", body: JSON.stringify(b || {}) });
  const ST = { published: "Publié", draft: "Brouillon", archived: "Archivé" };
  let data = null, opts = null, cur = "", editing = null, view = "grid", navDepth = 0, loadSeq = 0, ctl = null, shown = 0;
  const PAGE = 48, cache = new Map(), thumbs = new Map();
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* navigation privée : préférence non conservée */ } } };
  const VKEY = "kola.themeBuilder.view";
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
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
    sidebar: "Barre latérale réutilisable : affichée sous le contenu de la page, avant le pied de page, selon vos conditions.", custom: "Modèles libres : tous ceux dont les conditions correspondent s'affichent sous le contenu de la page, avant le pied de page.",
  };
  const dates = (s) => (s ? String(s).slice(0, 16).replace("T", " ") : "—");

  // Ordre de l'interface : parties du site d'abord, puis barre latérale et modèle personnalisé.
  const ordered = () => { const o = (t) => (t.key === "sidebar" ? 1 : t.key === "custom" ? 2 : 0); return [...data.types].sort((a, b) => o(a) - o(b)); };
  function drawTypes() {
    const ul = $("tb-types"); ul.textContent = "";
    const all = el("li"); const b0 = el("button"); b0.type = "button"; b0.setAttribute("aria-current", String(cur === "")); const dot0 = el("span", "tb-dot"); dot0.dataset.live = "0"; dot0.setAttribute("aria-hidden", "true"); b0.append(icon("all"), el("span", "tb-lbl", "Toutes les parties"), el("span", "tb-count", String(data.total)), dot0); b0.addEventListener("click", () => go("")); all.append(b0); ul.append(all);
    let g = "";
    for (const t of ordered()) {
      if (!g) { g = "x"; ul.append(el("li", "tb-grp", "Parties du site")); }
      const li = el("li"), b = el("button"); b.type = "button"; b.setAttribute("aria-current", String(cur === t.key)); if (!t.available) { b.disabled = true; b.title = t.reason; }
      const dot = el("span", "tb-dot"); dot.dataset.live = t.live ? "1" : "0"; dot.setAttribute("aria-hidden", "true");
      b.title = t.label; b.append(icon(t.key), el("span", "tb-lbl", t.label), el("span", "tb-count", String(t.count)), dot);
      if (t.live) b.setAttribute("aria-label", `${t.label} : ${t.count} modèle(s), ${t.live} publié(s)`);
      b.addEventListener("click", () => go(t.key)); li.append(b); ul.append(li);
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
    item("Aperçu", () => preview(t));
    if (canWrite && t.status !== "archived") {
      item("Renommer", () => rename(t)); item("Dupliquer", () => act(t, "dupliquer", "Modèle dupliqué (brouillon)."));
      if (t.status === "published") item("Dépublier", () => act(t, "depublier", "Modèle dépublié."));
      item("Archiver", () => act(t, "archiver", "Modèle archivé."));
      if (t.origin) item("Revenir au modèle initial", () => revertOrigin(t));
    }
    if (canWrite && t.status === "archived") { item("Restaurer", () => act(t, "restaurer", "Modèle restauré en brouillon.")); if (canRemove) item("Supprimer définitivement", () => remove(t)); }
    item("Exporter (JSON)", () => { location.href = `${base}/api/modeles/${t.id}/export.json`; }); item("Versions", () => versions(t)); item("Où est-il utilisé ?", () => where(t));
    wrap.append(btn, ul); return wrap;
  }
  function infoBtn(name, fn) { const b = el("button", "tb-info"); b.type = "button"; b.setAttribute("aria-label", `Informations sur ${name}`); b.append(svgOf(ICONS.info)); b.firstChild.setAttribute("width", "18"); b.firstChild.setAttribute("height", "18"); b.addEventListener("click", fn); return b; }
  function details(t) { info(`Détails — ${t.name}`, (box) => { const p = (k, v) => { const x = el("p"); x.append(el("b", "", `${k} : `), document.createTextNode(v)); box.append(x); }; p("Type", t.typeLabel); p("État", ST[t.status]); p("S'affiche", t.describe.include); if (t.describe.exclude) p("Sauf", t.describe.exclude); p("Modifié", dates(t.updatedAt)); if (t.origin) p("Modèle d'origine", `${t.origin.name} (bibliothèque)`); }); }
  // Carte « structure type » : un type sans modèle. Pointillés + libellé explicite : ce n'est PAS l'aperçu d'un modèle existant.
  function ghost(t) {
    const c = el("article", "tb-tcard"); c.dataset.type = t.key; const ch = el("div", "tb-ch"); ch.append(el("h3", "", t.label), infoBtn(t.label, () => info(t.label, (box) => box.append(el("p", "", LEAD[t.key] || ""), el("p", "sw-muted", "Aucun modèle n'existe pour cette partie : la structure ci-dessous est un exemple, pas un aperçu de votre site.")))));
    const th = el("div", "tb-thumb"); th.append(svgOf(wireSvg(t.key))); const b = el("div", "tb-body tb-body-g"); b.append(el("p", "tb-type", "Aucun modèle"));
    if (canWrite) { const a = el("div", "tb-actions"); const bt = el("button", "btn btn-sm btn-outline", "Créer un modèle"); bt.type = "button"; bt.setAttribute("aria-label", `Créer un modèle : ${t.label}`); bt.addEventListener("click", () => { $("tb-new-name").value = ""; $("tb-new-type").value = t.key; openDlg("tb-dlg-new"); }); a.append(bt); b.append(a); }
    c.append(ch, th, b); return c;
  }
  function card(t) {
    const c = el("article", "tb-card"); c.dataset.status = t.status; c.dataset.id = t.id;
    const ch = el("div", "tb-ch"); ch.append(el("h3", "", t.name), infoBtn(t.name, () => details(t)), menu(t)); ch.firstChild.title = t.name; c.append(ch);
    const th = el("a", "tb-thumb"); th.href = t.editUrl; th.setAttribute("aria-label", `Ouvrir « ${t.name} » dans l'éditeur`); lazyThumb(th, t, c); c.append(th);
    const b = el("div", "tb-body"), sub = el("div", "tb-sub"); sub.append(el("p", "tb-type", t.typeLabel));
    const bd = el("div", "tb-badges"); const s = el("span", "tb-badge", ST[t.status]); s.dataset.k = t.status; bd.append(s); if (t.hasConflict) { const x = el("span", "tb-badge", "Conflit"); x.dataset.k = "conflict"; bd.append(x); } if (t.documentMissing) { const x = el("span", "tb-badge", "Document manquant"); x.dataset.k = "conflict"; bd.append(x); } sub.append(bd); b.append(sub);
    if (t.status === "draft" && t.willReplace && t.willReplace.length) b.append(el("p", "tb-hint", `Non affiché : le site montre « ${t.willReplace.join(" », « ")} ». Publiez pour le remplacer.`));
    const m = el("div", "tb-meta"); const l1 = el("span", "tb-cond"), tx = el("span", "tb-cond-t"); tx.append(el("b", "", "S'affiche : "), document.createTextNode(t.describe.include)); l1.append(tx);
    // « Conditions » est rangé avec la ligne qu'il modifie (« S'affiche »), en action discrète.
    if (canWrite && t.status !== "archived") { const cd = el("button", "btn btn-sm btn-quiet", "Conditions"); cd.type = "button"; cd.addEventListener("click", () => conditions(t)); l1.append(cd); }
    m.append(l1);
    if (t.describe.exclude) { const l2 = el("span"); l2.append(el("b", "", "Sauf : "), document.createTextNode(t.describe.exclude)); m.append(l2); }
    const l3 = el("span"); l3.append(el("b", "", "Modifié : "), document.createTextNode(dates(t.updatedAt))); m.append(l3); b.append(m);
    // Actions : « Modifier » (principale), « Aperçu » (secondaire), « Publier » à droite ; le menu ⋯ est dans l'en-tête de la carte.
    const a = el("div", "tb-actions"); const ed = el("a", "btn btn-sm btn-primary", "Modifier"); ed.href = t.editUrl; a.append(ed);
    const pv = el("button", "btn btn-sm btn-outline", "Aperçu"); pv.type = "button"; pv.setAttribute("aria-label", `Aperçu de « ${t.name} »`); pv.addEventListener("click", () => preview(t)); a.append(pv);
    if (canWrite && t.status !== "archived") { a.append(el("span", "tb-spacer"));
      const pb = el("button", "btn btn-sm btn-outline", t.status === "published" ? "Republier" : "Publier"); pb.type = "button"; pb.addEventListener("click", () => publish(t)); a.append(pb); }
    b.append(a); c.append(b); return c;
  }
  // Miniature filaire chargée à la demande (visible à l'écran, 4 requêtes au plus en parallèle) : une liste de 60 modèles n'ouvre plus 60 documents d'un coup.
  const queue = []; let running = 0;
  const io = "IntersectionObserver" in window ? new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { io.unobserve(e.target); queue.push(e.target); } pump(); }, { rootMargin: "240px" }) : null;
  function pump() { while (running < 4 && queue.length) { const n = queue.shift(); if (!n.isConnected) continue; running += 1; fetchThumb(n).finally(() => { running -= 1; pump(); }); } }
  // Miniature RÉELLE : le HTML rendu par le moteur public pour CE modèle (fetch → iframe isolée « sandbox » sans script), réduit à la largeur de la carte. 3 rendus au plus en parallèle, HTML mis en cache pour la session ; en cas d'échec l'appelant garde la miniature filaire.
  const FRAME = { header: [960, 192], footer: [960, 288], def: [1000, 600] }, frames = new Map(), fq = []; let fRun = 0;
  const fitRo = "ResizeObserver" in window ? new ResizeObserver((es) => { for (const e of es) { const f = e.target.querySelector("iframe.tb-frame"); if (f) f.style.transform = `scale(${e.target.clientWidth / Number(f.getAttribute("width"))})`; } }) : null;
  function frameThumb(n, url, kind, key) {
    return new Promise((ok, no) => { fq.push({ n, url, kind, key, ok, no }); framePump(); });
  }
  function framePump() {
    while (fRun < 3 && fq.length) {
      const j = fq.shift(); fRun += 1;
      (async () => {
        let html = frames.get(j.key);
        if (html === undefined) { const r = await fetch(j.url, { credentials: "same-origin" }); if (!r.ok) throw new Error("rendu indisponible"); html = await r.text(); frames.set(j.key, html); if (frames.size > 120) frames.delete(frames.keys().next().value); }
        if (!j.n.isConnected) return;
        const [w, h] = FRAME[j.kind] || FRAME.def, f = document.createElement("iframe");
        f.className = "tb-frame"; f.setAttribute("sandbox", ""); f.setAttribute("tabindex", "-1"); f.setAttribute("aria-hidden", "true"); f.setAttribute("width", String(w)); f.setAttribute("height", String(h)); f.srcdoc = html;
        j.n.textContent = ""; j.n.append(f); j.n.dataset.state = "ok"; j.n.dataset.real = "1"; f.style.transform = `scale(${(j.n.clientWidth || 240) / w})`; if (fitRo) fitRo.observe(j.n);
      })().then(j.ok, j.no).finally(() => { fRun -= 1; framePump(); });
    }
  }
  async function fetchThumb(n) {
    const t = n._t, k = `${t.id}:${t.updatedAt}:${t.revision}:${t.docRev || ""}`;
    try { await frameThumb(n, `${base}/api/modeles/${t.id}/vignette`, t.type, `t:${k}`); return; } catch { /* repli : miniature filaire */ }
    try { let r = thumbs.get(k); if (!r) { r = await api(`/modeles/${t.id}/miniature`); thumbs.set(k, r); if (thumbs.size > 300) thumbs.delete(thumbs.keys().next().value); } paintThumb(n, r); }
    catch { n.dataset.state = "err"; }
  }
  function paintThumb(n, r) {
    if (n.dataset.real === "1") return;
    n.textContent = ""; n.append(svgOf(r.thumb)); n.dataset.state = "ok";
    if (r.documentMissing && n._card && !n._card.querySelector('[data-miss]')) { const bd = n._card.querySelector(".tb-badges"); if (bd) { const x = el("span", "tb-badge", "Document manquant"); x.dataset.k = "conflict"; x.dataset.miss = "1"; bd.append(x); } }
  }
  function lazyThumb(n, t, c) {
    n._t = t; n._card = c; n.dataset.state = "wait"; n.dataset.kind = t.type; n.append(el("span", "tb-shim"));
    if (t.thumb) paintThumb(n, { thumb: t.thumb, documentMissing: t.documentMissing }); // filaire immédiat, remplacé par le rendu réel dès qu'il est prêt
    pending.push(n);
  }
  // Observation après insertion dans la page : un élément encore détaché ne signale pas son entrée dans l'écran.
  const pending = [];
  function watchThumbs() { const l = pending.splice(0); for (const n of l) { if (io) io.observe(n); else { queue.push(n); } } if (!io) pump(); }
  const SORT = { recent: (a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")), name: (a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }), status: (a, b) => ["published", "draft", "archived"].indexOf(a.status) - ["published", "draft", "archived"].indexOf(b.status) || a.name.localeCompare(b.name, "fr") };
  // Ligne du mode liste : mêmes données et mêmes actions que la carte, présentées en tableau (colonnes nommées pour les lecteurs d'écran).
  function rowOf(t) {
    const tr = el("tr", "tb-card tb-row"); tr.dataset.status = t.status; tr.dataset.id = t.id;
    const cell = (label, ...kids) => { const td = el("td"); td.dataset.label = label; td.append(...kids); tr.append(td); return td; };
    const th = el("a", "tb-thumb tb-thumb-s"); th.href = t.editUrl; th.setAttribute("aria-label", `Ouvrir « ${t.name} » dans l'éditeur`); lazyThumb(th, t, tr);
    const nm = el("td", "tb-c-name"); nm.dataset.label = "Modèle"; const lk = el("a", "tb-name", t.name); lk.href = t.editUrl; nm.append(th, lk); tr.append(nm);
    cell("Type", document.createTextNode(t.typeLabel));
    const bd = el("div", "tb-badges"); const s = el("span", "tb-badge", ST[t.status]); s.dataset.k = t.status; bd.append(s); if (t.hasConflict) { const x = el("span", "tb-badge", "Conflit"); x.dataset.k = "conflict"; bd.append(x); } if (t.documentMissing) { const x = el("span", "tb-badge", "Document manquant"); x.dataset.k = "conflict"; bd.append(x); }
    cell("État", bd);
    cell("S'affiche", document.createTextNode(t.describe.include + (t.describe.exclude ? ` (sauf ${t.describe.exclude})` : "")));
    cell("Modifié", document.createTextNode(dates(t.updatedAt)));
    const a = el("div", "tb-actions"); const ed = el("a", "btn btn-sm btn-primary", "Modifier"); ed.href = t.editUrl; a.append(ed);
    const pv = el("button", "btn btn-sm btn-outline", "Aperçu"); pv.type = "button"; pv.setAttribute("aria-label", `Aperçu de « ${t.name} »`); pv.addEventListener("click", () => preview(t)); a.append(pv);
    if (canWrite && t.status !== "archived") { const pb = el("button", "btn btn-sm btn-outline", t.status === "published" ? "Republier" : "Publier"); pb.type = "button"; pb.addEventListener("click", () => publish(t)); a.append(pb); }
    a.append(menu(t)); cell("Actions", a).classList.add("tb-c-act"); return tr;
  }
  function ghostRow(t) {
    const tr = el("tr", "tb-tcard tb-row"); tr.dataset.type = t.key; const td = el("td"); td.colSpan = 6; td.className = "tb-c-ghost";
    td.append(el("strong", "", t.label), el("span", "", " — aucun modèle"));
    if (canWrite) { const bt = el("button", "btn btn-sm btn-outline", "Créer un modèle"); bt.type = "button"; bt.setAttribute("aria-label", `Créer un modèle : ${t.label}`); bt.addEventListener("click", () => { $("tb-new-name").value = ""; $("tb-new-type").value = t.key; openDlg("tb-dlg-new"); }); td.append(bt); }
    tr.append(td); return tr;
  }
  function emptyState(filtered, compact) {
    const d = el("div", compact ? "tb-empty tb-empty-s" : "tb-empty"); d.append(svgOf(IC('<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.5h17M8 13.5h8"/>')));
    d.firstChild.setAttribute("class", "tb-empty-ico"); d.firstChild.setAttribute("aria-hidden", "true");
    d.append(el("h2", "", filtered ? "Aucun résultat" : "Aucun modèle pour l'instant"), el("p", "sw-muted", filtered ? "Aucun modèle ne correspond à ces filtres." : "Aucun modèle pour ce site. Créez-en un avec « Ajouter un modèle », ou reprenez l'existant avec « Récupérer l'existant »."));
    if (filtered) { const b = el("button", "btn btn-outline", "Effacer les filtres"); b.type = "button"; b.addEventListener("click", () => { $("tb-q").value = ""; $("tb-st").value = ""; syncUrl(true); load(); }); d.append(b); }
    return d;
  }
  function drawCards() {
    const box = $("tb-cards"), list = view === "list";
    const ty = cur ? data.types.find((t) => t.key === cur) || {} : null, filtered = Boolean($("tb-q").value.trim() || $("tb-st").value);
    $("tb-title").textContent = cur ? ty.label : "Personnalisez chaque partie de votre site"; $("tb-lead").textContent = LEAD[cur] || "";
    document.title = `${cur ? ty.label + " · " : ""}Theme Builder`;
    box.dataset.view = view; box.textContent = ""; io && queue.splice(0);
    const sorted = [...data.templates].sort(SORT[$("tb-sort").value] || SORT.recent), compact = Boolean(cur && ty.catalog > 0 && !filtered && !sorted.length);
    const ghosts = filtered || compact ? [] : ordered().filter((t) => t.available && !t.count && (!cur || cur === t.key));
    // Catégorie avec catalogue et sans modèle : une seule ligne, le catalogue juste en dessous remplace l'état vide et la structure type.
    if (compact) { const p = el("p", "tb-mine-empty sw-muted", "Vous n'avez pas encore de modèle pour cette partie. Choisissez-en un dans les modèles prédéfinis ci-dessous"); if (canWrite) { p.append(document.createTextNode(", ou "), (() => { const b = el("button", "btn btn-sm btn-quiet", "créez-en un vierge"); b.type = "button"; b.addEventListener("click", () => { $("tb-new-name").value = ""; $("tb-new-type").value = cur; openDlg("tb-dlg-new"); }); return b; })()); } p.append(document.createTextNode(".")); box.append(p); }
    else if (!sorted.length) box.append(emptyState(Boolean(filtered || data.total || data.archived), ghosts.length > 0));
    let host = box;
    if (list) { const tb = el("table", "tb-table"); tb.setAttribute("aria-label", "Modèles"); const hd = el("thead"), hr = el("tr"); for (const h of ["Modèle", "Type", "État", "S'affiche", "Modifié", "Actions"]) { const th = el("th", "", h); th.scope = "col"; hr.append(th); } hd.append(hr); tb.append(hd); host = el("tbody"); tb.append(host); if (sorted.length || ghosts.length) box.append(tb); }
    const frag = document.createDocumentFragment(); let n = 0;
    for (const t of sorted) { if (n >= shown) break; frag.append(list ? rowOf(t) : card(t)); n += 1; }
    if (n >= shown && sorted.length > shown) { /* suite : bouton ci-dessous */ } else for (const t of ghosts) frag.append(list ? ghostRow(t) : ghost(t));
    host.append(frag); watchThumbs();
    if (sorted.length > shown) { const more = el("button", "btn btn-outline tb-more", `Afficher la suite (${sorted.length - shown} autres)`); more.type = "button"; more.addEventListener("click", () => { shown += PAGE; drawCards(); }); box.append(more); }
    const cf = $("tb-conflicts"); cf.hidden = !data.conflicts.length; cf.textContent = "";
    if (data.conflicts.length) { cf.append(el("strong", "", `${data.conflicts.length} conflit(s) entre modèles publiés`)); for (const c of data.conflicts) { const p = el("p"); p.append(el("b", "", c.severity === "blocking" ? "Bloquant : " : "Attention : "), document.createTextNode(`${c.message} ${c.suggestion}`)); cf.append(p); } }
    catSync(); $("tb-back").hidden = !cur; $("tb-back-l").textContent = navDepth > 0 ? "Retour" : "Toutes les parties";
  }
  const querystring = () => { const q = new URLSearchParams(); if (cur) q.set("type", cur); if ($("tb-q").value.trim()) q.set("q", $("tb-q").value.trim()); const st = $("tb-st").value; if (st) q.set("statut", st); return q; };
  // Adresse = état (catégorie, recherche, filtre) : le bouton Précédent du navigateur et les liens copiés retrouvent la même vue.
  function syncUrl(replace) {
    const q = querystring(), qs = q.toString(), url = location.pathname + (qs ? `?${qs}` : "");
    if (url === location.pathname + location.search) return;
    if (replace) history.replaceState({ tb: navDepth }, "", url); else { navDepth += 1; history.pushState({ tb: navDepth }, "", url); }
  }
  function readUrl() { const q = new URLSearchParams(location.search); const t = q.get("type") || ""; cur = t; $("tb-q").value = q.get("q") || ""; $("tb-st").value = ["published", "draft", "archived"].includes(q.get("statut")) ? q.get("statut") : ""; }
  // Modifications non enregistrées : la fenêtre de conditions (ou de création/renommage) ouverte et modifiée demande confirmation avant de quitter la vue.
  const dirty = () => [...document.querySelectorAll("#tb dialog[open]")].some((d) => d.dataset.dirty === "1");
  const guard = () => !dirty() || confirm("Des modifications ne sont pas enregistrées. Quitter sans les enregistrer ?");
  function go(type) {
    if (type === cur) return;
    if (!guard()) return;
    cur = type; shown = PAGE; syncUrl(false); load();
  }
  window.addEventListener("popstate", (e) => {
    if (!guard()) { history.pushState({ tb: navDepth }, "", location.href); return; }
    navDepth = e.state && Number.isInteger(e.state.tb) ? e.state.tb : 0; readUrl(); shown = PAGE; load();
  });
  window.addEventListener("beforeunload", (e) => { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
  $("tb-back").addEventListener("click", () => { if (!guard()) return; if (navDepth > 0) { history.back(); } else { cur = ""; shown = PAGE; syncUrl(false); load(); } });
  async function load() {
    const q = querystring(), key = q.toString(); q.set("leger", "1");
    if (ctl) ctl.abort(); ctl = new AbortController(); const my = ++loadSeq;
    const box = $("tb-cards"); box.setAttribute("aria-busy", "true");
    const hit = cache.get(key);
    if (hit) { data = hit; shown = Math.max(shown, PAGE); drawTypes(); drawCards(); } else if (!data) skeleton();
    try {
      const d = await api(`/modeles?${q}`, { signal: ctl.signal }); if (my !== loadSeq) return;
      data = d; cache.set(key, d); if (cache.size > 30) cache.delete(cache.keys().next().value);
      if (!shown) shown = PAGE; drawTypes(); drawCards(); box.setAttribute("aria-busy", "false");
    } catch (e) {
      if (e.name === "AbortError") return; box.setAttribute("aria-busy", "false");
      status(e.message || "Chargement impossible.", "err");
      if (!data) { box.textContent = ""; const d = el("div", "tb-empty"); d.append(el("h2", "", "Impossible de charger les modèles"), el("p", "sw-muted", e.message || "Vérifiez votre connexion."), (() => { const b = el("button", "btn btn-primary", "Réessayer"); b.type = "button"; b.addEventListener("click", () => load()); return b; })()); box.append(d); }
    }
  }
  function skeleton() { const box = $("tb-cards"); box.textContent = ""; box.dataset.view = "grid"; for (let i = 0; i < 6; i += 1) { const c = el("div", "tb-sk"); c.setAttribute("aria-hidden", "true"); box.append(c); } }
  const refresh = () => { cache.clear(); return load(); };
  async function act(t, path, ok) { try { await post(`/modeles/${t.id}/${path}`); status(ok, "ok"); await refresh(); } catch (e) { status(e.message, "err"); } }
  function rename(t) { renaming = t; $("tb-ren-name").value = t.name; openDlg("tb-dlg-ren"); $("tb-ren-name").select(); }
  let renaming = null;
  $("tb-form-ren").addEventListener("submit", async (e) => {
    e.preventDefault(); const t = renaming; if (!t) return;
    try { await post(`/modeles/${t.id}/renommer`, { name: $("tb-ren-name").value }); closeDlg($("tb-dlg-ren")); status("Modèle renommé.", "ok"); await refresh(); } catch (err) { status(err.message, "err"); closeDlg($("tb-dlg-ren")); }
  });
  // « Revenir au modèle initial » : la copie de travail de CET en-tête retrouve la composition de la bibliothèque (confirmation d'abord ; l'état précédent reste dans « Versions »)
  async function revertOrigin(t) {
    if (!t.origin || !confirm(`Revenir au modèle initial « ${t.origin.name} » ?\n\nL'en-tête « ${t.name} » retrouve la composition d'origine de la bibliothèque (contenu, couleurs, polices et réglages remis à zéro dans sa copie de travail). L'état actuel est gardé dans « Versions » : vous pourrez l'annuler. Rien n'est publié ; vos autres modèles et vos autres sites ne changent pas.`)) return;
    try { const r = await post(`/modeles/${t.id}/revenir-au-modele`); status(`« ${t.name} » est revenu au modèle initial « ${r.original.name} » (brouillon). Pour annuler : Versions › Restaurer la version ${r.version}.`, "ok"); await refresh(); }
    catch (e) { status(e.message, "err"); }
  }
  async function remove(t) { if (!confirm(`Supprimer définitivement « ${t.name} » ? Le document (page ou composant) reste dans vos pages.`)) return; try { await post(`/modeles/${t.id}/supprimer`); status("Modèle supprimé.", "ok"); await refresh(); } catch (e) { status(e.message, "err"); } }
  async function publish(t) {
    const go = async (replace) => { const r = await post(`/modeles/${t.id}/publier`, { revision: t.revision, replace }); status(r.replaced && r.replaced.length ? `Publié : remplace « ${r.replaced.map((o) => o.name).join(" », « ")} » (repassé en brouillon).` : r.conflicts && r.conflicts.length ? `Publié, avec ${r.conflicts.length} avertissement(s) : voir les conflits.` : "Modèle publié.", "ok"); await refresh(); };
    try { await go(false); }
    catch (e) {
      const dup = (e.conflicts || []).some((c) => c.severity === "blocking");
      if (dup && t.willReplace && t.willReplace.length && confirm(`Ce site affiche déjà « ${t.willReplace.join(" », « ")} » aux mêmes conditions.\n\nPublier « ${t.name} » à sa place ? L'ancien modèle repasse en brouillon (rien n'est supprimé).`)) { try { await go(true); } catch (e2) { status(e2.message, "err"); } return; }
      status(e.message, "err"); if (e.conflicts) await refresh();
    }
  }
  const dlg = (id) => $(id);
  function openDlg(id) { const d = dlg(id); d.dataset.dirty = "0"; if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
  function closeDlg(d) { d.dataset.dirty = "0"; if (typeof d.close === "function") d.close(); else d.removeAttribute("open"); }
  // Fermer une fenêtre modifiée (Annuler, Échap) demande confirmation ; les fenêtres de lecture se ferment sans question.
  const tryClose = (d) => { if (d.dataset.dirty === "1" && !confirm("Des modifications ne sont pas enregistrées. Fermer sans les enregistrer ?")) return false; closeDlg(d); return true; };
  document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => tryClose(b.closest("dialog"))));
  for (const id of ["tb-dlg-new", "tb-dlg-cond", "tb-dlg-ren"]) { const d = $(id); d.addEventListener("input", () => { d.dataset.dirty = "1"; }); d.addEventListener("change", () => { d.dataset.dirty = "1"; }); d.addEventListener("cancel", (e) => { e.preventDefault(); tryClose(d); }); }

  // ---- éditeur de conditions
  const LIST = { ids: "Identifiants (virgules)", category: "Catégories (virgules)", childCategory: "Sous-catégories de (virgules)", tag: "Étiquettes (virgules)", author: "Auteurs (identifiants)", names: "Noms (virgules)" };
  function row(kindsAllowed, c) {
    const r = el("div", "tb-row"); const kw = el("label", "sw-field", "Condition"); const ks = el("select"); for (const k of opts.kinds.filter((k) => kindsAllowed.includes(k.key))) { const o = el("option", "", k.label); o.value = k.key; ks.append(o); } kw.append(ks); r.append(kw);
    const params = el("div", "tb-row-params"); params.style.display = "contents"; r.append(params); const rm = el("button", "btn btn-sm btn-outline", "Retirer"); rm.type = "button"; rm.addEventListener("click", () => { r.remove(); $("tb-dlg-cond").dataset.dirty = "1"; }); r.append(rm);
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
  $("tb-add-inc").addEventListener("click", () => { $("tb-inc").append(row(allowedKinds(editing.type))); $("tb-dlg-cond").dataset.dirty = "1"; });
  $("tb-add-exc").addEventListener("click", () => { $("tb-exc").append(row(allowedKinds(editing.type))); $("tb-dlg-cond").dataset.dirty = "1"; });
  $("tb-form-cond").addEventListener("submit", async (e) => {
    e.preventDefault(); const rd = (id) => [...$(id).querySelectorAll("[data-row]")].map((r) => r.read());
    try { const r = await post(`/modeles/${editing.id}/conditions`, { conditions: { include: rd("tb-inc"), exclude: rd("tb-exc") }, revision: editing.revision }); closeDlg($("tb-dlg-cond")); status(r.conflicts && r.conflicts.length ? "Conditions enregistrées — attention aux conflits signalés." : "Conditions enregistrées.", "ok"); await refresh(); }
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
    try { if (f.size > 2000000) throw new Error("Fichier trop volumineux."); const payload = JSON.parse(await f.text()); await post("/importer", { payload }); status("Modèle importé en brouillon.", "ok"); await refresh(); }
    catch (err) { status(err instanceof SyntaxError ? "Ce fichier n'est pas un JSON valide." : err.message, "err"); }
  });
  $("tb-legacy")?.addEventListener("click", async () => {
    try { const r = await post("/importer-ancien"); status(`${r.imported.length} élément(s) repris${r.skipped.length ? `, ${r.skipped.length} ignoré(s) (${r.skipped.filter((s) => s.reason !== "déjà importé").map((s) => `${s.label} : ${s.reason}`).join(" ; ") || "déjà importés"})` : ""}.`, "ok"); await refresh(); }
    catch (err) { status(err.message, "err"); }
  });

  // ---- versions, utilisation, simulation
  function info(title, build) { $("tb-dlg-info-h").textContent = title; const box = $("tb-info"); box.textContent = ""; build(box); openDlg("tb-dlg-info"); }
  async function versions(t) {
    try { const r = await api(`/modeles/${t.id}/versions`); info(`Versions — ${t.name}`, (box) => { if (!r.versions.length) box.append(el("p", "sw-muted", "Aucune version publiée pour l'instant.")); const ul = el("ul"); for (const v of r.versions) { const li = el("li"); li.append(document.createTextNode(`Version ${v.number} · ${dates(v.createdAt)} · ${v.describe.include}${v.describe.exclude ? ` (sauf ${v.describe.exclude})` : ""} `)); if (canWrite) { const b = el("button", "btn btn-sm btn-outline", "Restaurer en brouillon"); b.type = "button"; b.addEventListener("click", async () => { try { const rr = await post(`/modeles/${t.id}/versions/${v.number}/restaurer`); closeDlg($("tb-dlg-info")); status(`Version ${v.number} : contenu restauré en brouillon de travail (rien n'est changé en ligne avant la publication).${rr.conditionsRestored ? "" : " Les conditions en ligne n'ont pas été modifiées."}`, "ok"); await refresh(); } catch (e) { status(e.message, "err"); } }); li.append(b); } ul.append(li); } box.append(ul); }); }
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
  // ---- aperçu réel : le modèle enregistré, rendu par le même moteur que l'éditeur, à la largeur de l'appareil choisi
  const DEV = { desktop: 1280, tablet: 820, mobile: 390 };
  let pv = null, dev = "desktop", pvRo = null;
  function fitPreview() {
    const st = $("tb-prev-stage"), wrap = $("tb-prev-wrap"), fr = $("tb-prev-frame"), w = DEV[dev], avail = st.clientWidth - 32, k = Math.min(1, avail / w);
    wrap.style.width = `${w * k}px`; fr.style.width = `${w}px`; fr.style.height = `${Math.max(240, (st.clientHeight - 32) / k)}px`; fr.style.transform = `scale(${k})`; wrap.style.height = `${Math.max(240, st.clientHeight - 32)}px`;
  }
  function setDevice(d) { dev = d; for (const b of document.querySelectorAll(".tb-devices button")) b.setAttribute("aria-pressed", String(b.dataset.dev === d)); $("tb-prev-wrap").dataset.dev = d; fitPreview(); }
  function loadPreview() {
    if (!pv) return; const fr = $("tb-prev-frame"), ld = $("tb-prev-load"); ld.hidden = false; ld.textContent = "Chargement de l'aperçu…"; ld.dataset.k = "";
    const pg = pv.previewNeedsPage ? $("tb-prev-page").value : ""; const url = pv.previewUrl + (pg ? `?page=${encodeURIComponent(pg)}` : "");
    $("tb-prev-open").href = url; fr.onload = () => { ld.hidden = true; }; fr.onerror = () => { ld.textContent = "L'aperçu n'a pas pu être chargé."; ld.dataset.k = "err"; }; fr.src = url;
  }
  async function preview(t) {
    pv = t; $("tb-prev-h").textContent = `Aperçu — ${t.name}`; $("tb-prev-sub").textContent = `${t.typeLabel} · ${ST[t.status]}`; $("tb-prev-edit").href = t.editUrl; $("tb-prev-edit").hidden = false;
    const w = $("tb-prev-pagew"); w.hidden = !t.previewNeedsPage;
    if (t.previewNeedsPage) { if (!opts) { try { opts = await api("/options"); } catch (e) { status(e.message, "err"); return; } } const s = $("tb-prev-page"); s.textContent = ""; const o0 = el("option", "", "Page choisie automatiquement"); o0.value = ""; s.append(o0); for (const p of opts.pages) { const o = el("option", "", p.name); o.value = p.id; s.append(o); } }
    openDlg("tb-prev"); setDevice(dev); loadPreview();
    if (!pvRo && "ResizeObserver" in window) { pvRo = new ResizeObserver(() => { if ($("tb-prev").open) fitPreview(); }); pvRo.observe($("tb-prev-stage")); }
  }
  const closePreview = () => { const d = $("tb-prev"); closeDlg(d); $("tb-prev-frame").removeAttribute("src"); pv = null; };
  $("tb-prev-back").addEventListener("click", closePreview);
  $("tb-prev").addEventListener("cancel", (e) => { e.preventDefault(); closePreview(); });
  $("tb-prev-page").addEventListener("change", loadPreview);
  for (const b of document.querySelectorAll(".tb-devices button")) b.addEventListener("click", () => setDevice(b.dataset.dev));

  // ---- bibliothèque de modèles (100 par type) : liste paginée côté serveur (métadonnées seulement), miniature et aperçu chargés à la demande, « Utiliser » = copie indépendante en brouillon
  const L = { type: "", q: "", skin: "", layout: "", page: 1, lview: "grid", info: null, busy: false };
  const libThumbs = new Map();
  const libStatus = (m, k) => { const s = $("tb-lib-status"); s.textContent = m || ""; s.dataset.k = k || ""; s.dataset.show = m ? "1" : "0"; };
  const libQuery = () => { const p = new URLSearchParams({ type: L.type, page: String(L.page), limite: "24" }); if (L.q) p.set("q", L.q); if (L.skin) p.set("identite", L.skin); if (L.layout) p.set("mise", L.layout); return p.toString(); };
  async function libLoad() {
    const seq = (L.seq = (L.seq || 0) + 1); $("tb-lib-cards").setAttribute("aria-busy", "true");
    try {
      if (!L.type) { const r = await api("/bibliotheque"); const sel = $("tb-lib-type"); sel.textContent = ""; for (const t of r.types) { const o = el("option", "", `${t.label} (${t.count})${t.available ? "" : " — indisponible"}`); o.value = t.type; o.disabled = !t.available; sel.append(o); } L.type = (r.types.find((t) => t.available) || r.types[0]).type; sel.value = L.type; }
      const r = await api(`/bibliotheque?${libQuery()}`); if (seq !== L.seq) return; L.info = r;
      const fill = (id, list, all) => { const s = $(id), v = s.value; if (s.options.length <= 1 || s.dataset.type !== L.type) { s.textContent = ""; const o = el("option", "", all); o.value = ""; s.append(o); for (const x of list) { const op = el("option", "", x.label); op.value = x.key; s.append(op); } s.dataset.type = L.type; s.value = v && [...s.options].some((o) => o.value === v) ? v : ""; } };
      fill("tb-lib-skin", r.skins, "Toutes"); fill("tb-lib-layout", r.layouts, "Toutes");
      libDraw(r);
    } catch (e) { libStatus(e.message, "err"); } finally { $("tb-lib-cards").setAttribute("aria-busy", "false"); }
  }
  function libDraw(r) {
    const box = $("tb-lib-cards"); box.textContent = ""; box.dataset.view = L.lview;
    $("tb-lib-sub").textContent = `${r.total} modèle${r.total > 1 ? "s" : ""} · page ${r.page} sur ${r.pages}`;
    $("tb-lib-page").textContent = `Page ${r.page} / ${r.pages}`; $("tb-lib-prev").disabled = r.page <= 1; $("tb-lib-next").disabled = r.page >= r.pages;
    if (!r.available) libStatus(r.reason || "Ce type n'est pas disponible pour ce site.", "err"); else libStatus("");
    if (!r.items.length) { box.append(el("p", "sw-muted", "Aucun modèle ne correspond à cette recherche.")); return; }
    for (const m of r.items) box.append(libCard(m, r.available));
  }
  function libCard(m, available, type = L.type, say = libStatus) {
    const c = el("article", "tb-card tb-libcard"); c.dataset.key = m.key;
    const ch = el("div", "tb-ch"); ch.append(el("h3", "", m.name)); c.append(ch);
    const th = el("div", "tb-thumb"); th.setAttribute("aria-hidden", "true"); th.dataset.skin = m.skinKey; c.append(th);
    const body = el("div", "tb-body"); body.append(el("p", "tb-type", m.layoutLabel + " · " + m.skinLabel), el("p", "sw-muted tb-card-d", m.desc)); const tags = el("p", "tb-tags"); for (const t of m.tags.slice(0, 4)) tags.append(el("span", "tb-tag", t)); body.append(tags);
    const act = el("div", "tb-actions");
    const pv = el("button", "btn btn-sm btn-outline", "Prévisualiser"); pv.type = "button"; pv.setAttribute("aria-label", `Prévisualiser « ${m.name} »`); pv.addEventListener("click", () => libPreview(m, type));
    act.append(pv);
    if (canWrite) { const us = el("button", "btn btn-sm btn-primary", "Utiliser ce modèle"); us.type = "button"; us.disabled = !available; us.setAttribute("aria-label", `Utiliser « ${m.name} »`); us.addEventListener("click", () => libUse(m, us, act, type, say)); act.append(us); }
    body.append(act); c.append(body); libLazyThumb(th, m, type); return c;
  }
  const libIo = "IntersectionObserver" in window ? new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { libIo.unobserve(e.target); e.target.__go(); } }, { rootMargin: "200px" }) : null;
  function libLazyThumb(th, m, type = L.type) {
    const key = `${type}:${m.key}`;
    th.dataset.kind = type;
    th.__go = async () => { try { await frameThumb(th, `${base}/api/bibliotheque/${type}/${m.key}/vignette`, type, `l:${base}:${key}`); return; } catch { /* repli : miniature filaire */ } try { let svg = libThumbs.get(key); if (!svg) { const r = await api(`/bibliotheque/${type}/${m.key}/miniature`); svg = r.thumb; libThumbs.set(key, svg); } th.textContent = ""; th.append(svgOf(svg)); } catch { /* miniature facultative */ } };
    if (libIo) libIo.observe(th); else th.__go();
  }
  async function libUse(m, btn, act, type = L.type, say = libStatus) {
    if (L.busy) return; L.busy = true; btn.disabled = true; btn.textContent = "Création…";
    try {
      const r = await post("/bibliotheque/utiliser", { type, key: m.key });
      say(`« ${m.name} » ajouté à votre site en brouillon.`, "ok");
      btn.textContent = "Ajouté ✓"; const ed = el("a", "btn btn-sm btn-outline", "Modifier"); ed.href = r.template.editUrl; ed.setAttribute("aria-label", `Modifier « ${m.name} »`); act.append(ed);
      await refresh();
    } catch (e) { say(e.message, "err"); btn.disabled = false; btn.textContent = "Utiliser ce modèle"; } finally { L.busy = false; }
  }
  function libPreview(m, type = L.type) {
    // même fenêtre d'aperçu que les modèles du site : le document du catalogue est rendu par le moteur public (aucune écriture)
    preview({ name: m.name, typeLabel: (data.types.find((t) => t.key === type) || {}).label || "", status: "draft", previewUrl: `${base}/api/bibliotheque/${type}/${m.key}/apercu`, editUrl: "#", previewNeedsPage: false, catalog: true });
    $("tb-prev-sub").textContent = "Modèle de la bibliothèque · données d'exemple"; $("tb-prev-edit").hidden = true;
  }

  // ---- catalogue DIRECT dans chaque catégorie : les 100 modèles prédéfinis du type courant, sans passer par la bibliothèque globale.
  // Même API, mêmes cartes, mêmes aperçus que la bibliothèque ; « Utiliser » crée une copie indépendante en brouillon (rien n'est publié).
  const C = { type: "", q: "", skin: "", layout: "", page: 1, seq: 0, ready: "" };
  const catSay = (m, k) => { const s = $("tb-cat-status"); s.textContent = m || ""; s.dataset.k = k || ""; s.hidden = !m; };
  const hasCatalog = (t) => Boolean(t) && t.catalog > 0;
  function catSync() {
    const sec = $("tb-cat"), t = cur ? data.types.find((x) => x.key === cur) : null;
    sec.hidden = !cur; $("tb-mine-h").hidden = !cur; if (!cur) { C.type = ""; return; }
    const none = $("tb-cat-none"), body = $("tb-cat-body");
    if (!hasCatalog(t)) { C.type = ""; body.hidden = true; none.hidden = false; none.textContent = `Il n'y a pas de modèles prédéfinis pour « ${t ? t.label : cur} » : aucune zone du site public ne les affiche. Créez un modèle avec « Ajouter un modèle ».`; $("tb-cat-count").textContent = ""; return; }
    none.hidden = true; body.hidden = false;
    if (C.type !== cur) { C.type = cur; C.q = ""; C.skin = ""; C.layout = ""; C.page = 1; $("tb-cat-q").value = ""; for (const id of ["tb-cat-skin", "tb-cat-layout"]) { const s = $(id); s.textContent = ""; s.dataset.type = ""; } catLoad(); }
  }
  async function catLoad() {
    const type = C.type, seq = ++C.seq, box = $("tb-cat-cards"); box.setAttribute("aria-busy", "true");
    const p = new URLSearchParams({ type, page: String(C.page), limite: "24" }); if (C.q) p.set("q", C.q); if (C.skin) p.set("identite", C.skin); if (C.layout) p.set("mise", C.layout);
    try {
      const r = await api(`/bibliotheque?${p}`); if (seq !== C.seq || type !== C.type) return;
      const fill = (id, list, all, cur2) => { const s = $(id); if (s.dataset.type !== type) { s.textContent = ""; const o = el("option", "", all); o.value = ""; s.append(o); for (const x of list) { const op = el("option", "", x.label); op.value = x.key; s.append(op); } s.dataset.type = type; s.value = cur2; } };
      fill("tb-cat-skin", r.skins, "Toutes les identités", C.skin); fill("tb-cat-layout", r.layouts, "Toutes les mises en page", C.layout);
      $("tb-cat-count").textContent = `${r.total} modèle${r.total > 1 ? "s" : ""}`;
      $("tb-cat-page").textContent = `Page ${r.page} sur ${r.pages}`; $("tb-cat-prev").disabled = r.page <= 1; $("tb-cat-next").disabled = r.page >= r.pages; $("tb-cat-pager").hidden = r.pages <= 1;
      if (!r.available) catSay(r.reason || "Ce type n'est pas disponible pour ce site.", "err"); else catSay("");
      box.textContent = ""; if (!r.items.length) { box.append(el("p", "sw-muted", "Aucun modèle ne correspond à cette recherche.")); }
      for (const m of r.items) box.append(libCard(m, r.available, type, catSay));
    } catch (e) { if (seq === C.seq) catSay(e.message || "Chargement impossible.", "err"); } finally { if (seq === C.seq) box.setAttribute("aria-busy", "false"); }
  }
  $("tb-cat-q").addEventListener("input", () => { clearTimeout(catLoad.t); catLoad.t = setTimeout(() => { C.q = $("tb-cat-q").value; C.page = 1; catLoad(); }, 250); });
  $("tb-cat-skin").addEventListener("change", () => { C.skin = $("tb-cat-skin").value; C.page = 1; catLoad(); });
  $("tb-cat-layout").addEventListener("change", () => { C.layout = $("tb-cat-layout").value; C.page = 1; catLoad(); });
  $("tb-cat-prev").addEventListener("click", () => { if (C.page > 1) { C.page -= 1; catLoad(); } });
  $("tb-cat-next").addEventListener("click", () => { C.page += 1; catLoad(); });
  $("tb-cat-tools").addEventListener("submit", (e) => e.preventDefault());
  // Retour : confirmation seulement si une fenêtre contient une saisie non enregistrée ; sinon navigation directe vers l'écran d'origine (adresse fournie par le serveur, jamais l'historique)
  $("tb-exit")?.addEventListener("click", (e) => { const dirty = [...document.querySelectorAll("dialog[open]")].some((d) => d.dataset.dirty === "1"); if (dirty && !confirm("Des modifications ne sont pas enregistrées. Quitter le Theme Builder ?")) e.preventDefault(); });
  const libOpen = () => { openDlg("tb-lib"); if (!L.info) libLoad(); };
  $("tb-lib-open").addEventListener("click", libOpen);
  $("tb-lib-back").addEventListener("click", () => closeDlg($("tb-lib")));
  $("tb-lib").addEventListener("cancel", (e) => { if ($("tb-prev").open) return; e.preventDefault(); closeDlg($("tb-lib")); });
  $("tb-lib-tools").addEventListener("submit", (e) => e.preventDefault());
  $("tb-lib-type").addEventListener("change", () => { L.type = $("tb-lib-type").value; L.page = 1; L.skin = ""; L.layout = ""; $("tb-lib-skin").value = ""; $("tb-lib-layout").value = ""; libLoad(); });
  $("tb-lib-q").addEventListener("input", () => { clearTimeout(libLoad.t); libLoad.t = setTimeout(() => { L.q = $("tb-lib-q").value; L.page = 1; libLoad(); }, 250); });
  $("tb-lib-skin").addEventListener("change", () => { L.skin = $("tb-lib-skin").value; L.page = 1; libLoad(); });
  $("tb-lib-layout").addEventListener("change", () => { L.layout = $("tb-lib-layout").value; L.page = 1; libLoad(); });
  $("tb-lib-prev").addEventListener("click", () => { if (L.page > 1) { L.page -= 1; libLoad(); } });
  $("tb-lib-next").addEventListener("click", () => { L.page += 1; libLoad(); });
  for (const b of document.querySelectorAll("[data-lview]")) b.addEventListener("click", () => { L.lview = b.dataset.lview; for (const x of document.querySelectorAll("[data-lview]")) x.setAttribute("aria-pressed", String(x === b)); $("tb-lib-cards").dataset.view = L.lview; });

  // ---- mode d'affichage (grille / liste), conservé entre les navigations et les sessions
  function setView(v, persist = true) {
    if (v !== "grid" && v !== "list") v = "grid"; if (v === view && data) return; view = v;
    for (const b of document.querySelectorAll(".tb-views button")) b.setAttribute("aria-pressed", String(b.dataset.view === v));
    if (persist) store.set(VKEY, v);
    if (!data) return;
    const swap = () => drawCards();
    if (document.startViewTransition && !reduced()) document.startViewTransition(swap); else swap();
  }
  for (const b of document.querySelectorAll(".tb-views button")) b.addEventListener("click", () => setView(b.dataset.view));

  $("tb-tools").addEventListener("submit", (e) => e.preventDefault());
  $("tb-q").addEventListener("input", () => { clearTimeout(load.t); load.t = setTimeout(() => { shown = PAGE; syncUrl(true); load(); }, 250); });
  $("tb-st").addEventListener("change", () => { shown = PAGE; syncUrl(true); load(); });
  $("tb-sort").addEventListener("change", () => { store.set("kola.themeBuilder.sort", $("tb-sort").value); if (data) drawCards(); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".tb-menu")) document.querySelectorAll(".tb-menu-list").forEach((u) => { u.hidden = true; }); });
  // Raccourcis (hors saisie et hors fenêtre ouverte) : / recherche · n nouveau modèle · v grille/liste · Échap vide la recherche.
  document.addEventListener("keydown", (e) => {
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === "Escape" && t === $("tb-q") && $("tb-q").value) { $("tb-q").value = ""; shown = PAGE; syncUrl(true); load(); return; }
    if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector("#tb dialog[open]")) return;
    if (e.key === "/") { e.preventDefault(); $("tb-q").focus(); }
    else if (e.key === "n" && canWrite) { e.preventDefault(); $("tb-new").click(); }
    else if (e.key === "v") { e.preventDefault(); setView(view === "grid" ? "list" : "grid"); }
  });
  // Départ : adresse → état ; préférences d'affichage et de tri retrouvées.
  { const sv = store.get(VKEY), so = store.get("kola.themeBuilder.sort"); if (so && SORT[so]) $("tb-sort").value = so; readUrl(); history.replaceState({ tb: 0 }, "", location.href); shown = PAGE; if (sv === "list") { view = "list"; for (const b of document.querySelectorAll(".tb-views button")) b.setAttribute("aria-pressed", String(b.dataset.view === "list")); } }
  load();
})();

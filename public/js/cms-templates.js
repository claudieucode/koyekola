// KOLAKISA CMS → Apparence → Templates : bibliothèque professionnelle de modèles d'un site (programme 20.4).
// Données de départ = JSON #tp-data posé par le serveur ; recherche, filtres, tri et pagination passent par catalogue.json (côté serveur, données réelles). L'importation passe par le serveur
// (une transaction, un jeton d'idempotence : un double clic ou une nouvelle tentative ne crée jamais les objets deux fois). Aucun succès n'est annoncé avant la réponse du serveur.
(function () {
  var root = document.querySelector("[data-tp-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === false || v == null) return; if (k === "text") el.textContent = v; else if (k === "onclick") el.addEventListener("click", v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var S = JSON.parse(document.getElementById("tp-data").textContent);
  var KIND = { site: "Site complet", page: "Page", section: "Section", component: "Composant", part: "Modèle de thème" };
  var SORT = { relevance: "Pertinence", recent: "Plus récents", alpha: "Ordre alphabétique", used: "Plus utilisés" };
  var TABS = [["pack", "Sites complets"], ["page", "Pages"], ["section", "Sections"], ["component", "Composants"], ["part", "Thème"], ["mine", "Mes modèles"], ["hist", "Imports"]];
  var st = { source: "pack", q: "", family: "", sector: "", category: "", siteType: "", compat: "", sort: "recent", page: 1 };
  var data = S.initial, items = S.initial.items.slice(), busy = false, loadSeq = 0, opener = null, sectorsCache = null;
  var liveEl = $("[data-tp-live]");
  function say(t) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = t; }, 30); }
  function banner(text) { $("[data-tp-banner-text]").textContent = text || ""; $("[data-tp-banner]").hidden = !text; }
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };
  function token() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
  var siteField = function () { return S.siteId === null ? {} : { site: String(S.siteId) }; };
  // Appel au serveur : JSON en retour, message lisible en cas d'erreur (jamais de succès supposé)
  function call(path, method, payload) {
    var opts = { method: method || "GET", credentials: "same-origin", headers: { Accept: "application/json" } };
    if (payload) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(Object.assign({}, payload, siteField())); }
    return fetch(S.base + path + (path.indexOf("?") >= 0 ? "&" : "?") + (S.siteId ? "site=" + S.siteId : "_=1"), opts).then(function (res) {
      return res.text().then(function (t) {
        var d = null; try { d = t ? JSON.parse(t) : null; } catch (x) { d = null; }
        if (!res.ok || !d || d.ok === false) { var e = new Error((d && (d.error && d.error.message || d.error)) || (res.status === 403 ? "Vous n'avez pas le droit d'effectuer cette action." : "Le serveur n'a pas pu répondre (erreur " + res.status + ")")); e.data = d; e.status = res.status; throw e; }
        return d;
      });
    }, function () { throw new Error("Connexion impossible : vérifiez votre réseau puis réessayez."); });
  }

  // ---------- Fenêtres ----------
  function open(d) { opener = document.activeElement; if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function closeAll(d) { if (d.close) d.close(); else d.removeAttribute("open"); if (opener && opener.focus && document.contains(opener)) { try { opener.focus(); } catch (x) { /* ignoré */ } } }
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; var d = $$("dialog").filter(function (x) { return x.open; })[0]; if (d) { e.preventDefault(); closeAll(d); } });
  $$("[data-tp-close]").forEach(function (b) { b.addEventListener("click", function () { closeAll(b.closest("dialog")); }); });

  // ---------- Requête ----------
  function query(page) {
    var p = [];
    if (st.source !== "hist") p.push("source=" + st.source);
    ["q", "family", "sector", "category", "siteType", "compat", "sort"].forEach(function (k) { if (st[k]) p.push(k + "=" + encodeURIComponent(st[k])); });
    p.push("page=" + page, "perPage=12");
    return p.join("&");
  }
  function load(append) {
    if (st.source === "hist") { renderAll(); return Promise.resolve(); }
    var seq = ++loadSeq, grid = $("[data-tp-grid]"); grid.setAttribute("aria-busy", "true"); $("[data-tp-error]").hidden = true;
    return call("/catalogue.json?" + query(append ? st.page + 1 : 1)).then(function (d) {
      if (seq !== loadSeq) return; // une réponse plus ancienne que la dernière demande est ignorée
      data = d; st.page = d.page; items = append ? items.concat(d.items) : d.items.slice(); st.sort = d.params.sort; grid.setAttribute("aria-busy", "false"); renderAll();
    }, function (x) { if (seq !== loadSeq) return; grid.setAttribute("aria-busy", "false"); $("[data-tp-error-text]").textContent = x.message; $("[data-tp-error]").hidden = false; });
  }
  $("[data-tp-retry]").addEventListener("click", function () { load(false); });

  // ---------- Onglets, filtres ----------
  function renderTabs() {
    var box = $("[data-tp-sources]"), hadFocus = box.contains(document.activeElement); box.textContent = ""; var counts = (data.facets && data.facets.sources) || {};
    TABS.forEach(function (t, idx) {
      var n = t[0] === "hist" ? S.history.length : counts[t[0]] || 0;
      var b = h("button", { type: "button", role: "tab", "aria-selected": String(st.source === t[0]), tabindex: st.source === t[0] ? "0" : "-1", "data-tp-source": t[0] }, [t[1] + " ", h("span", { class: "mk-st-count", text: String(n) })]);
      b.addEventListener("click", function () { st.source = t[0]; st.family = st.sector = st.category = st.siteType = st.compat = ""; st.sort = st.q ? "relevance" : "recent"; st.page = 1; load(false); });
      b.addEventListener("keydown", function (e) { var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!d) return; e.preventDefault(); var nb = $$("[data-tp-source]")[(idx + d + TABS.length) % TABS.length]; nb.focus(); nb.click(); });
      box.appendChild(b);
    });
    if (hadFocus) { var sel = box.querySelector('[aria-selected="true"]'); if (sel) sel.focus(); } // la barre d'onglets est reconstruite à chaque réponse : le focus clavier y reste
  }
  function fill(sel, options, current, all) {
    sel.textContent = ""; sel.appendChild(h("option", { value: "", text: all }));
    var seen = false; options.forEach(function (o) { if (o.value === current) seen = true; sel.appendChild(h("option", { value: o.value, text: o.text, selected: o.value === current ? true : null })); });
    if (current && !seen) sel.appendChild(h("option", { value: current, text: current, selected: true }));
  }
  function renderFilters() {
    var f = data.facets || { families: [], categories: [], siteTypes: [] }, hist = st.source === "hist";
    $("[data-tp-filters]").hidden = hist; $("[data-tp-search]").parentNode.hidden = false;
    fill($("[data-tp-family]"), f.families.map(function (x) { return { value: x.slug, text: x.label + " (" + x.count + ")" }; }), st.family, "Tous les secteurs");
    var fam = f.families.filter(function (x) { return x.slug === st.family; })[0], secs = fam ? fam.sectors : [];
    var secSel = $("[data-tp-sector]"); fill(secSel, secs.map(function (x) { return { value: x.slug, text: x.label + " (" + x.count + ")" }; }), st.sector, "Toutes les spécialités"); secSel.disabled = !fam;
    fill($("[data-tp-cat]"), f.categories.map(function (x) { return { value: x.label, text: x.label + " (" + x.count + ")" }; }), st.category, "Toutes les catégories");
    var stSel = $("[data-tp-site-type]"); fill(stSel, f.siteTypes.map(function (x) { return { value: x.slug, text: x.label + " (" + x.count + ")" }; }), st.siteType, "Tous les types"); stSel.parentNode.hidden = !f.siteTypes.length && !st.siteType;
    $("[data-tp-compat]").value = st.compat;
    var so = $("[data-tp-sort]"); so.textContent = ""; (data.sorts || ["recent", "alpha"]).forEach(function (k) { so.appendChild(h("option", { value: k, text: SORT[k], selected: st.sort === k ? true : null })); });
    $("[data-tp-reset]").hidden = !(st.q || st.family || st.sector || st.category || st.siteType || st.compat);
    $("[data-tp-own]").hidden = st.source !== "mine" || !S.can.import; $("[data-tp-sectors-open]").hidden = !S.can.categories;
  }
  $("[data-tp-search]").addEventListener("input", function (e) { clearTimeout(load.t); st.q = e.target.value.trim(); load.t = setTimeout(function () { st.page = 1; st.sort = st.q ? "relevance" : (st.sort === "relevance" ? "recent" : st.sort); load(false); }, 250); });
  [["family", "[data-tp-family]"], ["sector", "[data-tp-sector]"], ["category", "[data-tp-cat]"], ["siteType", "[data-tp-site-type]"], ["compat", "[data-tp-compat]"], ["sort", "[data-tp-sort]"]].forEach(function (p) {
    $(p[1]).addEventListener("change", function (e) { st[p[0]] = e.target.value; if (p[0] === "family") st.sector = ""; st.page = 1; load(false); });
  });
  $("[data-tp-reset]").addEventListener("click", function () { st.q = st.family = st.sector = st.category = st.siteType = st.compat = ""; st.sort = "recent"; $("[data-tp-search]").value = ""; st.page = 1; load(false); });
  $("[data-tp-more]").addEventListener("click", function () { load(true); });

  // ---------- Grille ----------
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var f = e.target; if (!f.getAttribute("src")) f.setAttribute("src", f.getAttribute("data-src")); io.unobserve(f); } }); }, { rootMargin: "300px" }) : null;
  function previewUrl(ref, page) { return S.base + "/apercu?ref=" + encodeURIComponent(ref) + (page ? "&page=" + encodeURIComponent(page) : "") + (S.siteId ? "&site=" + S.siteId : ""); }
  function chip(text, cls) { return h("span", { class: "mk-nm-chip" + (cls ? " " + cls : ""), text: text }); }
  function originChip(i) { return i.origin === "official" ? null : chip(i.origin === "organization" ? "Partagé" : "Mon site", "is-info"); }
  function compatNote(i) { return i.compat && i.compat.status !== "ok" ? h("p", { class: "mk-tl-compat is-" + i.compat.status }, i.compat.status === "blocked" ? "Incompatible avec ce site : voir les détails." : "À vérifier avant l'import : voir les détails.") : null; }
  function card(i) {
    var f = h("iframe", { title: "", "aria-hidden": "true", tabindex: "-1", "data-src": previewUrl(i.ref, i.pages[0].key), referrerpolicy: "same-origin", scrolling: "no" }); if (io) io.observe(f); else f.setAttribute("src", f.getAttribute("data-src"));
    var meta = [chip(KIND[i.kind], i.kind === "site" ? "is-info" : ""), originChip(i), " " + i.category + " · " + (i.kind === "site" ? plural(i.pageCount, "page") + " · " : "") + plural(i.elements, "élément")];
    var body = [h("h3", { text: i.name }), h("p", { class: "mk-pt-meta" }, meta), i.description ? h("p", { class: "field-hint", text: i.description }) : null];
    if (i.sectors && i.sectors.length) body.push(h("p", { class: "mk-tl-sectors-line", text: i.sectors.slice(0, 3).map(function (s) { return s.label; }).join(" · ") }));
    if (i.style) body.push(h("p", { class: "mk-tp-style", "aria-label": "Palette : " + i.style.paletteLabel }, [h("span", { class: "mk-st-pal-sw", "aria-hidden": "true" }, ["primary", "secondary", "background", "text"].map(function (k) { return h("i", { style: "background:" + i.style.colors[k] }); })), i.style.paletteLabel]));
    var note = compatNote(i); if (note) body.push(note);
    if (i.lastImport) body.push(h("p", { class: "field-hint mk-tp-done", text: "Déjà importé le " + i.lastImport + " UTC" }));
    body.push(h("div", { class: "mk-pt-card-actions" }, [h("button", { type: "button", class: "mk-wd-btn", "aria-label": "Aperçu de " + i.name, text: "Aperçu", onclick: function () { openPreview(i); } }),
      h("button", { type: "button", class: "mk-wd-btn", "aria-label": "Détails de " + i.name, text: "Détails", onclick: function () { openDetail(i); } }),
      h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--primary", "aria-label": "Utiliser ce modèle : " + i.name, text: "Utiliser ce modèle", disabled: !S.can.import || (i.compat && i.compat.status === "blocked") ? true : null, onclick: function () { openImport(i); } })]));
    return h("li", { class: "mk-pt-card", "data-ref": i.ref }, [h("div", { class: "mk-pt-thumb" }, f), h("div", { class: "mk-pt-card-body" }, body)]);
  }
  function fitThumbs() { $$(".mk-pt-thumb").forEach(function (t) { var w = t.clientWidth || 300, sc = w / 1200; t.style.height = Math.round(760 * sc) + "px"; var f = t.querySelector("iframe"); if (f) f.style.transform = "scale(" + sc + ")"; }); }
  window.addEventListener("resize", fitThumbs);
  function renderHistory() {
    var sec = $("[data-tp-history]"), ul = $("[data-tp-history-list]"); ul.textContent = "";
    S.history.forEach(function (x) {
      var what = x.kind === "section" && x.inserted ? plural(x.inserted.added, "section") + " dans « " + x.inserted.pageName + " »" : x.kind === "component" ? "composant « " + x.component + " »" : plural(x.pages, "page");
      var line = [h("strong", { text: x.label }), " — " + what + (x.menu ? " + menu" : "") + (x.styles ? " + brouillon de styles" : "") + (x.theme ? " + modèle de thème" : "") + " · " + x.at + " UTC" + (x.by ? " · " + x.by : "") + (x.undone ? " · annulé" : " ")];
      if (!x.undone && S.can.import) line.push(undoButton(x.id));
      ul.appendChild(h("li", { "data-hist": String(x.id) }, line));
    });
    sec.hidden = st.source !== "hist" || !S.history.length;
  }
  // Annulation en deux temps (jamais d'annulation en un clic accidentel)
  function undoButton(id) {
    var b = h("button", { type: "button", class: "mk-wd-btn", "data-tp-undo": String(id), text: "Annuler cet import" }), armed = false;
    b.addEventListener("click", function () {
      if (!armed) { armed = true; b.textContent = "Confirmer l'annulation"; setTimeout(function () { if (armed && document.contains(b)) { armed = false; b.textContent = "Annuler cet import"; } }, 6000); return; }
      b.disabled = true; b.textContent = "Annulation…";
      call("/annuler", "POST", { id: id }).then(function (d) { S.history = d.history; banner(""); say("Importation annulée."); renderAll(); load(false); var r = d.result; banner("Importation annulée : " + (r.pages ? plural(r.pages, "page") + " mise(s) à la corbeille" : r.sections ? plural(r.sections, "section") + " retirée(s)" : r.component ? "composant supprimé" : "rien d'autre à retirer") + (r.stylesKept ? ". Le brouillon de styles n'a pas été modifié : abandonnez-le dans Styles si besoin." : ".")); },
        function (x) { armed = false; b.disabled = false; b.textContent = "Annuler cet import"; banner(x.message); });
    });
    return b;
  }
  function renderAll() {
    renderTabs(); renderFilters(); var grid = $("[data-tp-grid]"); grid.textContent = "";
    var hist = st.source === "hist"; if (!hist) items.forEach(function (i) { grid.appendChild(card(i)); });
    fitThumbs(); renderHistory();
    var total = hist ? 0 : data.total;
    $("[data-tp-count]").textContent = hist ? "" : plural(total, "modèle") + (st.q || st.family || st.sector || st.category || st.siteType || st.compat ? " correspondant" + (total > 1 ? "s" : "") + " à votre recherche" : "") + (items.length < total ? " — " + items.length + " affiché" + (items.length > 1 ? "s" : "") : "");
    $("[data-tp-more-wrap]").hidden = hist || items.length >= total;
    var e = $("[data-tp-empty]"); e.hidden = hist ? !!S.history.length : items.length > 0;
    e.textContent = hist ? "Aucun import pour l'instant." : st.source === "mine" && !st.q && !st.family && !st.sector && !st.category && !st.siteType && !st.compat ? "Vous n'avez encore enregistré aucun modèle pour ce site. « Enregistrer un modèle… » en crée à partir d'une page ou de sections existantes." : "Aucun modèle ne correspond à votre recherche. Essayez d'autres mots, ou réinitialisez les filtres.";
    say(hist ? "" : plural(total, "modèle") + " trouvé" + (total > 1 ? "s" : ""));
  }

  // ---------- Aperçu ----------
  var W = { desktop: 0, tablet: 768, mobile: 390 }, prev = null, prevPage = null;
  function setDevice(d) {
    $$("[data-tp-device]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tp-device") === d)); });
    var fr = $("[data-tp-prev-frame]"), wrap = $("[data-tp-prevwrap]"); fr.style.width = W[d] ? W[d] + "px" : "100%";
    var avail = wrap.clientWidth || 1, sc = W[d] ? Math.min(1, avail / W[d]) : 1; fr.style.transform = sc < 1 ? "scale(" + sc + ")" : "none"; fr.style.transformOrigin = "top left"; fr.style.height = Math.round(560 / sc) + "px"; wrap.style.height = "560px";
  }
  function showPage(i, key) {
    prevPage = key; $$("[data-tp-prev-tabs] button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-key") === key)); });
    $("[data-tp-prev-frame]").setAttribute("src", previewUrl(i.ref, key));
  }
  function openPreview(i) {
    prev = i; $("[data-tp-prev-title]").textContent = "Aperçu : " + i.name; var tabs = $("[data-tp-prev-tabs]"); tabs.textContent = "";
    i.pages.forEach(function (p) { var b = h("button", { type: "button", role: "tab", "data-key": p.key, "aria-selected": "false", text: p.name }); b.addEventListener("click", function () { showPage(i, p.key); }); tabs.appendChild(b); });
    tabs.hidden = i.pages.length < 2; $("[data-tp-prev-import]").hidden = !S.can.import || (i.compat && i.compat.status === "blocked"); open($("[data-tp-dlg-preview]")); setDevice("desktop"); showPage(i, i.pages[0].key);
  }
  $$("[data-tp-device]").forEach(function (b) { b.addEventListener("click", function () { setDevice(b.getAttribute("data-tp-device")); }); });
  $("[data-tp-prev-import]").addEventListener("click", function () { closeAll($("[data-tp-dlg-preview]")); openImport(prev); });
  $("[data-tp-prev-detail]").addEventListener("click", function () { closeAll($("[data-tp-dlg-preview]")); openDetail(prev); });

  // ---------- Détails ----------
  var cur = null;
  function list(items2, cls) { var ul = h("ul", { class: cls || "" }); items2.forEach(function (x) { ul.appendChild(h("li", { text: x })); }); return ul; }
  function section(title, kids) { return h("section", { class: "mk-tl-block" }, [h("h3", { text: title })].concat(kids)); }
  function openDetail(i) {
    cur = i; var body = $("[data-tp-det-body]"); body.textContent = ""; body.appendChild(h("p", { class: "mk-wd-loading", text: "Chargement des détails…" }));
    $("[data-tp-det-title]").textContent = i.name; $("[data-tp-det-import]").hidden = true; $("[data-tp-det-own]").textContent = "";
    open($("[data-tp-dlg-detail]"));
    call("/detail.json?ref=" + encodeURIComponent(i.ref)).then(function (d) {
      var x = d.item; body.textContent = "";
      body.appendChild(h("p", null, [chip(KIND[x.kind], x.kind === "site" ? "is-info" : ""), " ", originChip(x), " " + x.category + " · version " + x.version + " · langue " + x.language.toUpperCase()]));
      if (x.description) body.appendChild(h("p", { text: x.description }));
      var cs = x.compat.status; body.appendChild(section("Compatibilité avec ce site", [h("p", { class: "mk-tl-compat is-" + cs, text: cs === "ok" ? "Compatible : tous les éléments sont disponibles et autorisés." : cs === "warn" ? "À vérifier : lisez les avertissements ci-dessous." : "Incompatible : l'import est impossible tant que ces points ne sont pas réglés." })]
        .concat(x.blockers.length ? [list(x.blockers.map(function (b) { return b.message; }), "mk-tl-issues is-blocked")] : []).concat(x.warnings.length ? [list(x.warnings.map(function (b) { return b.message; }), "mk-tl-issues is-warn")] : []).concat(x.notes.length ? [list(x.notes.map(function (b) { return b.message; }), "mk-tl-issues")] : [])));
      body.appendChild(section("Classement", [h("p", { text: (x.sectors.length ? "Secteurs : " + x.sectors.map(function (s) { return s.label; }).join(", ") : "Modèle générique (tous secteurs)") + (x.siteType ? " · Type de site : " + x.siteType : "") + (x.keywords.length ? " · Mots-clés : " + x.keywords.join(", ") : "") })]));
      body.appendChild(section("Éléments utilisés (" + x.widgets.length + ")", [x.widgets.length ? list(x.widgets.map(function (w) { return w.label + " × " + w.count; }), "mk-tl-cols") : h("p", { text: "Aucun élément." })]));
      body.appendChild(section("Structure", x.structure.map(function (p) { return h("div", null, [x.structure.length > 1 ? h("h4", { text: p.name }) : null, list(p.sections.map(function (s) { return (s.index + 1) + ". " + s.label; }))]); })));
      var res = []; if (x.requires && x.requires.length) res.push("Fonctionnalités utilisées : " + x.requires.join(", ")); if (x.deps.external.length) res.push("Ressources externes : " + x.deps.external.join(", ")); if (x.deps.uploads.length) res.push(plural(x.deps.uploads.length, "fichier") + " de la médiathèque cité(s)");
      body.appendChild(section("Ressources nécessaires", [res.length ? list(res) : h("p", { text: "Aucune ressource externe. Les images se choisissent dans la médiathèque du site." })]));
      body.appendChild(section("Source et licence", [h("p", { text: x.provenance + ". " + x.license })]));
      if (x.lastImport) body.appendChild(h("p", { class: "field-hint mk-tp-done", text: "Déjà importé dans ce site le " + x.lastImport + " UTC" }));
      var own = $("[data-tp-det-own]"); own.textContent = "";
      if (x.origin !== "official" && S.can.import) {
        if (/^mine:/.test(x.ref)) own.appendChild(h("button", { type: "button", class: "mk-wd-btn", text: "Modifier…", onclick: function () { closeAll($("[data-tp-dlg-detail]")); openEdit(x); } }));
        if (/^(mine|pattern|comp):/.test(x.ref)) own.appendChild(h("a", { class: "mk-wd-btn", href: S.base + "/export.json?ref=" + encodeURIComponent(x.ref) + (S.siteId ? "&site=" + S.siteId : ""), download: "", text: "Exporter" }));
        if (/^(mine|pattern):/.test(x.ref)) own.appendChild(h("button", { type: "button", class: "mk-wd-btn", text: "Supprimer", onclick: function () { if (!own.dataset.armed) { own.dataset.armed = "1"; this.textContent = "Confirmer la suppression"; return; } var b = this; b.disabled = true; call("/supprimer", "POST", { ref: x.ref }).then(function () { closeAll($("[data-tp-dlg-detail]")); say("Modèle supprimé."); load(false); }, function (e) { b.disabled = false; body.appendChild(h("p", { class: "mk-st-err", role: "alert", text: e.message })); }); } }));
      }
      $("[data-tp-det-import]").hidden = !S.can.import || cs === "blocked";
    }, function (e) { body.textContent = ""; body.appendChild(h("p", { class: "mk-st-err", role: "alert", text: e.message })); });
  }
  $("[data-tp-det-import]").addEventListener("click", function () { closeAll($("[data-tp-dlg-detail]")); openImport(cur); });

  // ---------- Importation ----------
  var imp = null, impKey = null, done = null, planState = null, pagesCache = null;
  function planBody() {
    var kind = imp.kind;
    return { ref: imp.ref, name: kind === "site" || kind === "section" ? "" : $("[data-tp-imp-name]").value, menu: kind === "site" && $("[data-tp-imp-menu]").checked, styles: kind === "site" && $("[data-tp-imp-styles]").checked,
      assign: kind === "part" && $("[data-tp-imp-assign]").checked, pageId: kind === "section" ? Number($("[data-tp-imp-page]").value) || null : null, position: kind === "section" ? $("[data-tp-imp-pos]").value : "end" };
  }
  function setOk() {
    var ok = $("[data-tp-imp-ok]"), p = planState; if (done) return;
    var ready = p && p.ok && (!p.plan.needsConfirm || $("[data-tp-imp-confirm]").checked);
    ok.disabled = !ready || busy;
  }
  function renderPlan(p) {
    var box = $("[data-tp-imp-plan]"), ops = $("[data-tp-imp-ops]"), iss = $("[data-tp-imp-issues]"); ops.textContent = ""; iss.textContent = ""; box.hidden = false;
    var T = { create_page: function (o) { return "Créer la page « " + o.name + " » en brouillon (" + plural(o.sections, "section") + ")"; }, create_menu: function (o) { return "Créer le menu « " + o.name + " »"; }, assign_menu: function (o) { return "Affecter ce menu à l'en-tête du site (il n'en a pas encore)"; },
      draft_styles: function (o) { return "Préparer un brouillon de styles : palette " + o.palette + " (rien n'est publié)"; }, assign_theme: function () { return "Affecter la page comme modèle de thème — effet sur toute l'organisation une fois la page publiée"; },
      insert_sections: function (o) { return "Insérer " + plural(o.count, "section") + " " + o.position + " dans la page « " + o.pageName + " » (brouillon)"; }, create_component: function (o) { return "Créer le composant « " + o.name + " » (il n'est branché nulle part)"; } };
    p.plan.operations.forEach(function (o) { ops.appendChild(h("li", { text: (T[o.op] || function () { return o.op; })(o) })); });
    p.plan.conflicts.forEach(function (c) { ops.appendChild(h("li", { class: "mk-tl-conflict", text: "Le nom « " + c.requested + " » existe déjà : le nouvel objet s'appellera « " + c.resolved + " » (rien n'est remplacé)." })); });
    var a = p.plan.analysis;
    if (a.blockers.length) iss.appendChild(list(a.blockers.map(function (b) { return b.message; }), "mk-tl-issues is-blocked"));
    if (a.warnings.length) iss.appendChild(list(a.warnings.map(function (b) { return b.message; }), "mk-tl-issues is-warn"));
    if (a.notes.length) iss.appendChild(list(a.notes.map(function (b) { return b.message; }), "mk-tl-issues"));
    $("[data-tp-imp-confirm-wrap]").hidden = !p.plan.needsConfirm; if (!p.plan.needsConfirm) $("[data-tp-imp-confirm]").checked = false;
  }
  var planTimer = null, planSeq = 0;
  function refreshPlan(delay) {
    clearTimeout(planTimer); planState = null; setOk(); var seq = ++planSeq;
    planTimer = setTimeout(function () {
      if (!imp || done) return;
      if (imp.kind === "section" && !Number($("[data-tp-imp-page]").value)) { $("[data-tp-imp-plan]").hidden = true; return; }
      call("/plan", "POST", planBody()).then(function (d) { if (seq !== planSeq) return; planState = { ok: d.plan.canImport, plan: d.plan }; $("[data-tp-imp-err]").hidden = true; renderPlan(planState); setOk(); },
        function (x) { if (seq !== planSeq) return; planState = { ok: false }; var err = $("[data-tp-imp-err]"); err.textContent = x.message; err.hidden = false; $("[data-tp-imp-plan]").hidden = true; setOk(); });
    }, delay || 0);
  }
  function openImport(i) {
    imp = i; impKey = token(); done = null; planState = null; var d = $("[data-tp-dlg-import]"), kind = i.kind;
    $("[data-tp-imp-title]").textContent = "Importer : " + i.name; $("[data-tp-imp-err]").hidden = true; $("[data-tp-imp-result]").hidden = true; $("[data-tp-imp-ok]").hidden = false; $("[data-tp-imp-ok]").disabled = true; $("[data-tp-imp-ok]").textContent = "Importer"; $("[data-tp-imp-plan]").hidden = true; $("[data-tp-imp-confirm]").checked = false;
    $("[data-tp-imp-what]").textContent = kind === "site" ? "Ce pack va créer " + plural(i.pageCount, "page") + " dans « " + S.siteName + " » :" : kind === "section" ? "Cette section sera ajoutée au BROUILLON d'une page de « " + S.siteName + " » :" : kind === "component" ? "Ce composant sera créé dans « " + S.siteName + " » (il ne sera branché nulle part) :" : kind === "part" ? "Cette page de modèle de thème sera créée en brouillon dans « " + S.siteName + " » :" : "Ce modèle va créer une page dans « " + S.siteName + " » :";
    var list0 = $("[data-tp-imp-list]"); list0.textContent = ""; var ul = h("ul", { class: "mk-tp-pages" }); i.pages.forEach(function (p) { ul.appendChild(h("li", null, [h("strong", { text: p.name }), " — " + plural(p.sections, "section") + ", " + plural(p.elements, "élément")])); }); list0.appendChild(ul);
    var single = kind === "page" || kind === "component" || kind === "part"; $("[data-tp-imp-single]").hidden = !single; $("[data-tp-imp-name]").value = single ? i.name : "";
    $("[data-tp-imp-name-label]").textContent = kind === "component" ? "Nom du composant" : "Nom de la page";
    $("[data-tp-imp-target]").hidden = kind !== "section";
    var opts = $("[data-tp-imp-options]"); opts.hidden = kind !== "site"; var m = $("[data-tp-imp-menu]"), s = $("[data-tp-imp-styles]");
    m.checked = false; s.checked = false; m.disabled = !S.can.menu; s.disabled = !S.can.styles;
    if (kind === "site") { m.parentNode.title = S.can.menu ? "" : "Vous n'avez pas le droit de créer un menu"; s.parentNode.title = S.can.styles ? "" : "Vous n'avez pas le droit de modifier les styles"; }
    var th = $("[data-tp-imp-theme]"); th.hidden = kind !== "part"; var as = $("[data-tp-imp-assign]"); as.checked = false; as.disabled = !S.can.assign; if (kind === "part") as.parentNode.title = S.can.assign ? "" : "Vous n'avez pas le droit d'affecter un modèle de thème";
    var warn = $("[data-tp-imp-warn]"); warn.hidden = !i.lastImport; if (i.lastImport) warn.textContent = "Ce modèle a déjà été importé dans ce site le " + i.lastImport + " UTC. Importer à nouveau créera " + (kind === "section" ? "de NOUVELLES sections (les existantes ne sont pas touchées)" : kind === "component" ? "un NOUVEAU composant (avec un numéro dans son nom)" : "de NOUVELLES pages (avec un numéro dans leur nom)") + " : rien d'existant ne sera remplacé ni modifié.";
    open(d);
    if (kind === "section") {
      var sel = $("[data-tp-imp-page]"); sel.textContent = ""; sel.appendChild(h("option", { value: "", text: "Chargement des pages…" }));
      call("/pages.json").then(function (r) { pagesCache = r.pages; sel.textContent = ""; sel.appendChild(h("option", { value: "", text: r.pages.length ? "Choisir une page" : "Aucune page disponible" })); r.pages.forEach(function (p) { sel.appendChild(h("option", { value: String(p.id), text: p.name + " (" + plural(p.sections.length, "section") + ")" })); }); }, function (x) { var err = $("[data-tp-imp-err]"); err.textContent = x.message; err.hidden = false; });
    } else refreshPlan(0);
  }
  ["[data-tp-imp-menu]", "[data-tp-imp-styles]", "[data-tp-imp-assign]", "[data-tp-imp-page]", "[data-tp-imp-pos]"].forEach(function (s) { $(s).addEventListener("change", function () { refreshPlan(0); }); });
  $("[data-tp-imp-name]").addEventListener("input", function () { refreshPlan(350); });
  $("[data-tp-imp-confirm]").addEventListener("change", setOk);
  $("[data-tp-form-import]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy || done || !planState || !planState.ok) return; busy = true; var err = $("[data-tp-imp-err]"), ok = $("[data-tp-imp-ok]"); err.hidden = true; ok.disabled = true; ok.textContent = "Importation…";
    var body = Object.assign(planBody(), { importKey: impKey, confirm: $("[data-tp-imp-confirm]").checked });
    call("/importer", "POST", body).then(function (d) {
      busy = false; done = d.result; S.history = d.history; ok.hidden = true;
      var r = d.result, res = $("[data-tp-imp-result]"); res.textContent = ""; res.hidden = false; var links = h("ul", { class: "mk-tp-pages" });
      var headline = r.kind === "section" && r.inserted ? plural(r.inserted.added, "section") + " ajoutée(s) au brouillon de « " + r.inserted.pageName + " »" : r.component ? "composant « " + r.component.name + " » créé" : plural(r.pages.length, "page") + (r.menu ? " + le menu « " + r.menu.name + " »" : "") + (r.styles ? " + un brouillon de styles" : "") + (r.theme ? " + l'affectation « " + r.theme.label + " »" : "");
      res.appendChild(h("p", null, [h("strong", { text: (r.replay ? "Déjà importé : " : "Importé : ") + headline + "." }), " Rien n'est publié : relisez, adaptez les textes d'exemple, puis publiez."]));
      r.pages.forEach(function (p) { links.appendChild(h("li", null, h("a", { href: S.links.editor + "/" + p.id + "/editeur", text: p.name + " — ouvrir dans l'éditeur" }))); });
      if (r.inserted) links.appendChild(h("li", null, h("a", { href: S.links.editor + "/" + r.inserted.pageId + "/editeur", text: r.inserted.pageName + " — ouvrir dans l'éditeur" })));
      if (r.component) links.appendChild(h("li", null, h("a", { href: "/marketing/site-web/composants/" + r.component.id + "/editeur" + S.query, text: r.component.name + " — ouvrir l'éditeur du composant" })));
      res.appendChild(links);
      var more = h("p", null); if (r.menu) more.appendChild(h("a", { href: S.links.menus, text: "Voir les menus" })); if (r.styles) { if (r.menu) more.appendChild(document.createTextNode(" · ")); more.appendChild(h("a", { href: S.links.styles, text: "Voir le brouillon de styles" })); }
      if (r.kind === "part") more.appendChild(h("a", { href: S.links.themeTemplates, text: "Modèles de thème" })); res.appendChild(more);
      var hist = S.history[0]; if (hist && !r.replay && S.can.import) res.appendChild(undoButton(hist.id));
      say("Modèle importé."); res.setAttribute("tabindex", "-1"); res.focus(); load(false);
    }, function (x) { busy = false; ok.textContent = "Réessayer"; err.textContent = x.message + (x.status >= 500 ? " Rien n'a été créé : vous pouvez réessayer." : ""); err.hidden = false; if (x.data && x.data.details && x.data.details.code === "confirm_required") { setOk(); } else ok.disabled = false; });
  });

  // ---------- Enregistrer ses modèles ----------
  function loadSectors() { return sectorsCache ? Promise.resolve(sectorsCache) : call("/secteurs.json").then(function (d) { sectorsCache = d; return d; }); }
  function saveKind() { return $$('input[name="tp-save-kind"]').filter(function (r) { return r.checked; })[0].value; }
  function renderSaveSections() {
    var kind = saveKind(), box = $("[data-tp-save-sections]"), list1 = $("[data-tp-save-sections-list]"); list1.textContent = ""; box.hidden = kind === "page";
    var p = (pagesCache || []).filter(function (x) { return String(x.id) === $("[data-tp-save-page]").value; })[0]; if (!p || kind === "page") return;
    box.querySelector("legend").textContent = kind === "section" ? "Sections à enregistrer" : "Section à enregistrer comme composant";
    p.sections.forEach(function (s) { list1.appendChild(h("label", { class: "mk-cms-check" }, [h("input", { type: kind === "section" ? "checkbox" : "radio", name: "tp-save-sec", value: String(s.index) }), " " + (s.index + 1) + ". " + s.label])); });
  }
  $$('input[name="tp-save-kind"]').forEach(function (r) { r.addEventListener("change", renderSaveSections); });
  $("[data-tp-save-page]").addEventListener("change", renderSaveSections);
  $("[data-tp-save-open]").addEventListener("click", function () {
    var err = $("[data-tp-save-err]"); err.hidden = true; $("[data-tp-save-name]").value = ""; $("[data-tp-save-desc]").value = ""; $("[data-tp-save-cat]").value = ""; $("[data-tp-save-kw]").value = "";
    var sel = $("[data-tp-save-page]"); sel.textContent = ""; sel.appendChild(h("option", { value: "", text: "Chargement…" }));
    var sec = $("[data-tp-save-sector]"); sec.textContent = ""; sec.appendChild(h("option", { value: "", text: "(aucun)" }));
    open($("[data-tp-dlg-save]"));
    Promise.all([call("/pages.json"), loadSectors()]).then(function (r) {
      pagesCache = r[0].pages; sel.textContent = ""; r[0].pages.forEach(function (p) { sel.appendChild(h("option", { value: String(p.id), text: p.name })); }); if (!r[0].pages.length) sel.appendChild(h("option", { value: "", text: "Aucune page : créez-en une d'abord" }));
      r[1].families.forEach(function (f) { var g = h("optgroup", { label: f.label }); f.sectors.forEach(function (s) { g.appendChild(h("option", { value: s.slug, text: s.label })); }); sec.appendChild(g); });
      renderSaveSections();
    }, function (x) { err.textContent = x.message; err.hidden = false; });
  });
  $("[data-tp-form-save]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return; var kind = saveKind(), err = $("[data-tp-save-err]"), ok = $("[data-tp-save-ok]"); err.hidden = true;
    var idx = $$('input[name="tp-save-sec"]').filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); });
    if (kind !== "page" && !idx.length) { err.textContent = kind === "section" ? "Cochez au moins une section." : "Choisissez la section à enregistrer."; err.hidden = false; return; }
    busy = true; ok.disabled = true;
    call("/enregistrer", "POST", { kind: kind, pageId: Number($("[data-tp-save-page]").value), indexes: idx, name: $("[data-tp-save-name]").value, description: $("[data-tp-save-desc]").value, category: $("[data-tp-save-cat]").value, sectors: $("[data-tp-save-sector]").value ? [$("[data-tp-save-sector]").value] : [], keywords: $("[data-tp-save-kw]").value })
      .then(function () { busy = false; ok.disabled = false; closeAll($("[data-tp-dlg-save]")); say("Modèle enregistré."); st.source = "mine"; st.q = st.family = st.sector = st.category = st.siteType = st.compat = ""; st.sort = "recent"; $("[data-tp-search]").value = ""; load(false); },
        function (x) { busy = false; ok.disabled = false; err.textContent = x.message; err.hidden = false; });
  });
  // Modifier un modèle de page du site
  var editing = null;
  function openEdit(x) {
    editing = x; $("[data-tp-edit-err]").hidden = true; $("[data-tp-edit-name]").value = x.name; $("[data-tp-edit-desc]").value = x.description || ""; $("[data-tp-edit-cat]").value = x.category || ""; $("[data-tp-edit-kw]").value = (x.keywords || []).join(", ");
    var vis = $$('input[name="tp-edit-vis"]'); vis.forEach(function (r) { r.checked = r.value === (x.origin === "organization" ? "organization" : "site"); r.disabled = !S.can.share; });
    open($("[data-tp-dlg-edit]"));
  }
  $("[data-tp-form-edit]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return; busy = true; var err = $("[data-tp-edit-err]"); err.hidden = true; var ok = $("[data-tp-edit-ok]"); ok.disabled = true;
    var visibility = $$('input[name="tp-edit-vis"]').filter(function (r) { return r.checked; })[0].value, body = { ref: editing.ref, name: $("[data-tp-edit-name]").value, description: $("[data-tp-edit-desc]").value, category: $("[data-tp-edit-cat]").value, keywords: $("[data-tp-edit-kw]").value };
    if (S.can.share) body.visibility = visibility;
    call("/modifier", "POST", body).then(function () { busy = false; ok.disabled = false; closeAll($("[data-tp-dlg-edit]")); say("Modèle mis à jour."); load(false); }, function (x) { busy = false; ok.disabled = false; err.textContent = x.message; err.hidden = false; });
  });
  // Fichier de modèle
  $("[data-tp-file]").addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
    if (f.size > 580 * 1024) { banner("Ce fichier est trop volumineux (580 Ko au plus)."); return; }
    var rd = new FileReader();
    rd.onload = function () {
      var doc; try { doc = JSON.parse(String(rd.result)); } catch (x) { banner("Ce fichier n'est pas un JSON valide."); return; }
      call("/importer-fichier", "POST", doc).then(function (d) { banner(""); var w = d.result.warnings || []; say("Modèle importé depuis le fichier."); st.source = "mine"; load(false).then(function () { banner("Modèle « " + d.result.name + " » ajouté à « Mes modèles »" + (d.result.renamed ? " (renommé : le nom existait déjà)" : "") + "." + (w.length ? " À vérifier : " + w.map(function (x2) { return x2.message; }).join(" ") : "")); }); }, function (x) { banner(x.message); });
    };
    rd.readAsText(f);
  });
  // Secteurs personnalisés (administrateur)
  function renderSectors(fams) {
    var ul = $("[data-tp-sec-list]"); ul.textContent = ""; var famSel = $("[data-tp-sec-family]"); famSel.textContent = "";
    fams.forEach(function (f) { famSel.appendChild(h("option", { value: f.slug, text: f.label })); });
    var any = false;
    fams.forEach(function (f) { f.sectors.filter(function (s) { return !s.official; }).forEach(function (s) { any = true; ul.appendChild(h("li", null, [s.label + " — " + f.label + " ", h("button", { type: "button", class: "mk-wd-btn", text: "Retirer", "aria-label": "Retirer le secteur " + s.label, onclick: function () { call("/secteurs/supprimer", "POST", { id: s.id }).then(function (d) { sectorsCache = null; renderSectors(d.families); load(false); }, function (x) { var e2 = $("[data-tp-sec-err]"); e2.textContent = x.message; e2.hidden = false; }); } })])); }); });
    if (!any) ul.appendChild(h("li", { class: "field-hint", text: "Aucun secteur personnalisé pour l'instant." }));
  }
  $("[data-tp-sectors-open]").addEventListener("click", function () { $("[data-tp-sec-err]").hidden = true; open($("[data-tp-dlg-sectors]")); sectorsCache = null; loadSectors().then(function (d) { renderSectors(d.families); }); });
  $("[data-tp-form-sector]").addEventListener("submit", function (e) {
    e.preventDefault(); var err = $("[data-tp-sec-err]"); err.hidden = true;
    call("/secteurs", "POST", { label: $("[data-tp-sec-label]").value, familySlug: $("[data-tp-sec-family]").value }).then(function (d) { $("[data-tp-sec-label]").value = ""; sectorsCache = null; renderSectors(d.families); load(false); }, function (x) { err.textContent = x.message; err.hidden = false; });
  });

  // ---------- Démarrage ----------
  if (S.readOnly) banner("Ce site est archivé ou supprimé : consultation seule.");
  $("[data-tp-loading]").hidden = true; $("[data-tp-main]").hidden = false; renderAll();
})();

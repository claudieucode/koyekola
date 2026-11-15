// KOLAKISA CMS → Médiathèque → mode « Colonnes » (à la manière de Finder), branché sur le gestionnaire de fichiers (public/js/media-explorer.js, interface window.MX).
// Données : l'arbre des dossiers vient de la page (ml-config) puis de dossiers.json ; les fichiers d'UN dossier arrivent par pages de 100 (liste.json?dossier=…), à la demande.
// Écritures : uniquement par l'API de la médiathèque (déplacer, renommer, créer, corbeille) : rien n'est affiché comme fait sans réponse réussie du serveur.
// Une sélection ne reconstruit QUE les colonnes qui changent ; les colonnes de gauche restent les mêmes éléments (voir docs/mediatheque-colonnes/README.md).
(function () {
  "use strict";
  var MX = window.MX; if (!MX) return;
  var K = MX.K, BASE = MX.base;
  var PAGE = 100, MIN_W = 160, MAX_W = 520;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COLORS = { bleu: "#4a78c2", vert: "#3d9a6b", orange: "#e08a2b", rouge: "#d1473f", violet: "#7a5bc7", jaune: "#d8aa22", rose: "#d6589b", gris: "#7b8794" };
  var FOLDER_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h3.6c.6 0 1.2.3 1.6.7L12 6h6.5A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z"/></svg>';
  var CHEV_SVG = '<svg class="mk-mc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';
  var h = function (tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k]; if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v; else if (k === "html") el.innerHTML = v; else el.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  };
  var clamp = function (n, a, b) { return Math.min(b, Math.max(a, n)); };
  var key = function (p) { return p === null || p === undefined ? "racine" : String(p); };
  var plural = MX.plural;
  var LS = "kw.mc.cw.v1:" + BASE; // largeurs propres à chaque colonne : mémorisées dans ce navigateur
  var ac = null; // écouteurs globaux de l'instance courante (retirés au remontage : la zone centrale est remplacée à chaque navigation)

  function mount(root) {
    if (!root || root.__mc) return; root.__mc = true;
    if (ac) ac.abort(); ac = new AbortController(); var sig = { signal: ac.signal };
    var C = function () { return MX.cfg(); };
    var CAN = Boolean(C().canWrite && C().scoped);
    root.textContent = ""; root.classList.add("mk-mc");
    if (!C().folderEnabled) { root.appendChild(h("div", { class: "mk-mc-note" }, [h("strong", { text: "Choisissez un site" }), "Les dossiers appartiennent à la médiathèque d'un site : choisissez un site pour naviguer en colonnes."])); return; }

    // ------------------------------------------------------------------ Préférences : largeur, métadonnées, extensions (par personne, enregistrées sur le serveur) ; couleurs, espacement et icônes : apparence du gestionnaire
    var sp = C().prefs || {}, widths = {};
    try { widths = JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) { widths = {}; }
    var colW = clamp(Number(sp.colWidth) || 240, 180, 420), meta = sp.colMeta !== false, extOn = sp.colExt !== false, saveT = 0, pend = {};
    function savePref(patch) { Object.keys(patch).forEach(function (k) { pend[k] = patch[k]; if (C().prefs) C().prefs[k] = patch[k]; }); clearTimeout(saveT); saveT = setTimeout(function () { var p = pend; pend = {}; K.api("POST", BASE + "/preferences", p).catch(function () { /* non enregistré : valable pour cette session */ }); }, 350); }
    function saveWidths() { try { localStorage.setItem(LS, JSON.stringify(widths)); } catch (e) { /* stockage indisponible */ } }
    function applyPrefs() { root.style.setProperty("--mc-w", colW + "px"); root.setAttribute("data-meta", meta ? "1" : "0"); }
    // Texte lisible sur la couleur de sélection choisie dans « Apparence » (clair, sombre ou personnalisé)
    function paintInk() {
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(probe).backgroundColor);
      if (m) root.style.setProperty("--mc-on-sel", (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255 > 0.6 ? "#0b1830" : "#ffffff");
    }
    var probe = h("i", { class: "mk-mc-probe", "aria-hidden": "true" });
    try { var mo = new MutationObserver(function () { paintInk(); }); mo.observe(MX.root, { attributes: true, attributeFilter: ["style", "class"] }); ac.signal.addEventListener("abort", function () { mo.disconnect(); }); } catch (e) { /* observateur indisponible : encre par défaut */ }

    // ------------------------------------------------------------------ État
    var folders = {}, kids = {}, files = {}, path = [], sel = null, active = 0, searchQ = "", cols = [], prevEl = null, hist = [], hpos = -1, dragging = null, menuEl = null, typed = "", typedTimer = 0;
    function indexTree(list) { folders = {}; kids = {}; (list || []).forEach(function (f) { folders[f.id] = f; var k = key(f.parentId); (kids[k] = kids[k] || []).push(f.id); }); }
    function chain(id) { var out = []; for (var x = id, n = 0; x !== null && x !== undefined && folders[x] && n < 12; x = folders[x].parentId, n++) out.unshift(x); return out; }
    function isInside(id, anc) { for (var x = id, n = 0; x !== null && x !== undefined && n < 12; x = folders[x] ? folders[x].parentId : null, n++) if (x === anc) return true; return false; }
    function extOf(m) { var e = String(m.path || "").split("?")[0].split(".").pop().toLowerCase(); return /^[a-z0-9]{1,5}$/.test(e) ? e : ""; }
    function label(m) {
      var e = extOf(m), n = String(m.name || ""), has = e && n.toLowerCase().slice(-(e.length + 1)) === "." + e;
      if (extOn) return has || !e ? n : n + "." + e;
      return has ? n.slice(0, -(e.length + 1)) : n;
    }
    var nameOfCol = function (p) { return p === null ? "Médiathèque" : folders[p] ? folders[p].name : "Dossier"; };
    function confirmDialog(o, yes) { MX.confirm(o.title, o.text, o.ok, o.danger).then(function (v) { if (v) yes(); }); }
    var toast = MX.toast;

    // ------------------------------------------------------------------ Squelette
    var bar = h("div", { class: "mk-mc-bar" });
    var btnBack = h("button", { type: "button", class: "mk-mc-btn", "aria-label": "Retour", title: "Retour (Alt + ←)", text: "←", disabled: true });
    var btnFwd = h("button", { type: "button", class: "mk-mc-btn", "aria-label": "Suivant", title: "Suivant (Alt + →)", text: "→", disabled: true });
    var btnUp = h("button", { type: "button", class: "mk-mc-btn", "aria-label": "Dossier parent", title: "Dossier parent", text: "↑", disabled: true });
    var crumbEl = h("nav", { class: "mk-mc-crumb", "aria-label": "Fil d'Ariane" });
    var searchInput = h("input", { type: "search", placeholder: "Rechercher dans ce dossier", "aria-label": "Rechercher dans le dossier sélectionné", maxlength: "100", autocomplete: "off" });
    var btnNew = CAN ? h("button", { type: "button", class: "mk-mc-btn", title: "Nouveau dossier dans le dossier ouvert", text: "Nouveau dossier" }) : null;
    var btnRefresh = h("button", { type: "button", class: "mk-mc-btn", "aria-label": "Actualiser", title: "Actualiser", text: "↻" });
    var setBox = h("details", { class: "mk-mc-set" });
    var colsEl = h("div", { class: "mk-mc-cols", "data-mc-cols": "" });
    var live = h("div", { class: "mk-mc-live", role: "status", "aria-live": "polite" });
    bar.appendChild(h("span", { class: "mk-mc-nav" }, [btnBack, btnFwd, btnUp]));
    [crumbEl, h("label", { class: "mk-mc-search" }, searchInput), btnNew, btnRefresh, setBox].forEach(function (n) { if (n) bar.appendChild(n); });
    [bar, colsEl, live, probe].forEach(function (n) { root.appendChild(n); });
    root.setAttribute("aria-label", "Navigation en colonnes de la médiathèque");
    applyPrefs(); paintInk();

    // Réglages propres à ce mode (les couleurs, l'espacement et la taille des icônes se règlent dans « Apparence »)
    (function settings() {
      function range(lbl, min, max, step, val, on) { var i = h("input", { type: "range", min: min, max: max, step: step, value: val, "aria-label": lbl }); i.addEventListener("input", function () { on(Number(i.value)); }); return h("label", { class: "is-range" }, [h("span", { text: lbl }), i]); }
      function check(lbl, val, on) { var i = h("input", { type: "checkbox" }); i.checked = val; i.addEventListener("change", function () { on(i.checked); }); return h("label", {}, [h("span", { text: lbl }), i]); }
      var body = h("div", { class: "mk-mc-setbody" }, [
        range("Largeur des colonnes", 180, 420, 10, colW, function (v) { colW = v; widths = {}; saveWidths(); cols.forEach(function (c) { c.el.style.width = ""; }); applyPrefs(); savePref({ colWidth: v }); }),
        check("Afficher les extensions", extOn, function (v) { extOn = v; relabel(); savePref({ colExt: v }); }),
        check("Afficher les métadonnées", meta, function (v) { meta = v; applyPrefs(); savePref({ colMeta: v }); }),
        h("p", { class: "mk-mc-hint", text: "Couleurs, mode clair ou sombre, espacement et taille des icônes : bouton « Apparence » de la barre d'outils." }),
        h("button", { type: "button", class: "mk-mc-btn", text: "Largeurs d'origine", onclick: function () { widths = {}; saveWidths(); cols.forEach(function (c) { c.el.style.width = ""; }); } })]);
      setBox.appendChild(h("summary", { class: "mk-mc-btn", title: "Réglages de la vue en colonnes", text: "Colonnes" })); setBox.appendChild(body);
    })();
    document.addEventListener("click", function (e) { if (setBox.open && !setBox.contains(e.target)) setBox.removeAttribute("open"); if (menuEl && !menuEl.contains(e.target)) closeMenu(); }, sig);

    // ------------------------------------------------------------------ Fichiers d'un dossier (pages de 100, à la demande)
    function loadFiles(parent, q, more) {
      var ck = key(parent) + "|" + q, st = files[ck] || (files[ck] = { items: [], total: 0, page: 0, more: false, loading: false, ready: false, err: null });
      if (st.loading) return Promise.resolve(st);
      st.loading = true; st.err = null;
      return K.list({ dossier: parent === null ? "racine" : parent, limite: PAGE, page: more ? st.page + 1 : 1, q: q, tri: "nom" }).then(function (r) {
        st.items = more ? st.items.concat(r.items) : r.items; st.total = r.total; st.page = r.page; st.more = Boolean(r.more); st.loading = false; st.ready = true; return st;
      }, function (err) { st.loading = false; st.err = MX.errMsg(err); st.ready = true; return st; });
    }
    function icon(m) {
      if (m.type === "image" && (m.thumb || m.path) && m.size <= 400 * 1024) return h("img", { src: m.thumb || m.path, alt: "", loading: "lazy", decoding: "async" });
      return h("span", { class: "mk-mc-ext", text: K.badge(m) });
    }

    // ------------------------------------------------------------------ Colonnes
    function buildColumn(depth, animate) {
      var parent = depth === 0 ? null : path[depth - 1];
      var el = h("section", { class: "mk-mc-col" + (animate ? " is-enter" : ""), "data-mc-col": depth, "aria-label": "Colonne " + (depth + 1) + " : " + nameOfCol(parent) });
      var list = h("ul", { class: "mk-mc-list", role: "listbox", "data-mc-files": "", "aria-label": nameOfCol(parent) });
      var foot = h("div", { class: "mk-mc-foot" });
      var handle = h("div", { class: "mk-mc-resize", role: "separator", "aria-orientation": "vertical", tabindex: "0", "aria-label": "Redimensionner la colonne " + (depth + 1), title: "Glisser pour redimensionner (double-clic : largeur d'origine)" });
      el.appendChild(h("div", { class: "mk-mc-colhead" }, h("b", { text: nameOfCol(parent) })));
      [list, foot, handle].forEach(function (n) { el.appendChild(n); });
      if (widths[depth]) el.style.width = clamp(widths[depth], MIN_W, MAX_W) + "px";
      var col = { el: el, list: list, foot: foot, parent: parent, depth: depth, rows: {}, selKey: null, q: "", timer: 0, io: null, waiting: false };
      if (window.IntersectionObserver) col.io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) moreOf(col); }); }, { root: list, rootMargin: "240px" });
      return col;
    }
    function folderRow(f) {
      var sub = (kids[key(f.id)] || []).length, row = h("li", { class: "mk-mc-row", role: "option", "aria-selected": "false", tabindex: "-1", "data-kind": "folder", "data-id": f.id, draggable: CAN ? "true" : null, "aria-label": f.name + ", dossier, " + plural(f.count, "fichier", "fichiers") + (sub ? ", " + plural(sub, "sous-dossier", "sous-dossiers") : "") }, [
        h("span", { class: "mk-mc-ico", html: FOLDER_SVG }), h("span", { class: "mk-mc-nm", text: f.name }), h("span", { class: "mk-mc-meta", text: String(f.count), title: plural(f.count, "fichier", "fichiers") }), h("span", { html: CHEV_SVG }).firstChild]);
      if (COLORS[f.color]) row.firstChild.style.setProperty("color", COLORS[f.color]);
      return row;
    }
    function fileRow(m) {
      var row = h("li", { class: "mk-mc-row", role: "option", "aria-selected": "false", tabindex: "-1", "data-kind": "file", "data-id": m.id, draggable: CAN ? "true" : null }, [
        h("span", { class: "mk-mc-ico" }, icon(m)), h("span", { class: "mk-mc-nm", text: label(m) }), h("span", { class: "mk-mc-meta", text: K.fmtSize(m.size) })]);
      row.__m = m; row.title = m.name + " · " + K.fmtSize(m.size) + (m.width ? " · " + m.width + " × " + m.height + " px" : "");
      return row;
    }
    function renderRows(col) {
      if (col.list.querySelector(".mk-mc-rename")) { col.dirty = true; return; } // un renommage est en cours : on ne détruit pas le champ de saisie, la colonne sera redessinée ensuite
      var q = col.q, top = col.list.scrollTop, st = files[key(col.parent) + "|" + q], needle = q.toLowerCase();
      var fa = document.activeElement, focused = fa && fa.classList && fa.classList.contains("mk-mc-row") && col.list.contains(fa) ? (fa.getAttribute("data-kind") === "folder" ? "f" : "m") + fa.getAttribute("data-id") : null; // la ligne qui a le focus clavier le garde après le redessin
      var frag = document.createDocumentFragment(); col.rows = {};
      if (col.io) col.io.disconnect();
      var fl = (kids[key(col.parent)] || []).map(function (id) { return folders[id]; }).filter(function (f) { return f && (!needle || f.name.toLowerCase().indexOf(needle) >= 0); });
      fl.forEach(function (f) { var r = folderRow(f); col.rows["f" + f.id] = r; frag.appendChild(r); });
      var nFiles = 0;
      if (!st || !st.ready) { for (var i = 0; i < 3; i++) frag.appendChild(h("li", { class: "mk-mc-skel", "aria-hidden": "true" }, [h("i"), h("b")])); }
      else if (st.err) frag.appendChild(h("li", { class: "mk-mc-note", role: "alert" }, [h("strong", { text: "Chargement impossible" }), st.err, h("br"), h("button", { type: "button", class: "mk-mc-more", "data-mc-retry": "", text: "Réessayer" })]));
      else {
        if (fl.length && st.items.length) frag.appendChild(h("li", { class: "mk-mc-sep", "aria-hidden": "true", text: "Fichiers" }));
        st.items.forEach(function (m) { var r = fileRow(m); col.rows["m" + m.id] = r; frag.appendChild(r); }); nFiles = st.total;
        if (st.more) frag.appendChild(h("li", { class: "mk-mc-moreli" }, h("button", { type: "button", class: "mk-mc-more", "data-mc-more": "", text: "Afficher " + Math.min(PAGE, st.total - st.items.length) + " fichiers de plus (" + (st.total - st.items.length) + " restants)" })));
        if (!fl.length && !st.items.length) frag.appendChild(h("li", { class: "mk-mc-note" }, q ? [h("strong", { text: "Aucun résultat" }), "Rien ne correspond à « " + q + " » dans ce dossier."] : [h("strong", { text: "Dossier vide" }), CAN ? "Glissez-y des fichiers ou des dossiers." : "Ce dossier ne contient rien."]));
      }
      col.list.textContent = ""; col.list.appendChild(frag); col.list.scrollTop = top;
      var more = col.list.querySelector("[data-mc-more]"); if (more && col.io) col.io.observe(more);
      col.foot.textContent = (st && st.ready && !st.err ? plural(fl.length, "dossier", "dossiers") + " · " + plural(nFiles, "fichier", "fichiers") : "Chargement…") + (q ? " · recherche" : "");
      markCol(col.depth);
      if (!col.list.querySelector('[tabindex="0"]')) { var first = col.list.querySelector(".mk-mc-row"); if (first) first.tabIndex = 0; }
      if (focused && col.rows[focused]) col.rows[focused].focus({ preventScroll: true });
    }
    function fetchColumn(col, delay) {
      var q = col.q, st = files[key(col.parent) + "|" + q];
      renderRows(col);
      if (st && st.ready) return;
      clearTimeout(col.timer);
      col.timer = setTimeout(function () { loadFiles(col.parent, q, false).then(function () { if (cols[col.depth] === col && col.q === q) { renderRows(col); announce(col); enterIfWaiting(col); } }); }, delay === undefined ? 70 : delay); // parcourir au clavier ne lance pas une requête par ligne
    }
    function enterIfWaiting(col) { if (!col.waiting) return; col.waiting = false; var first = col.list.querySelector(".mk-mc-row"); if (first) select(rowInfo(first)); }
    function moreOf(col) { var st = files[key(col.parent) + "|" + col.q]; if (!st || !st.more || st.loading) return; loadFiles(col.parent, col.q, true).then(function () { if (cols[col.depth] === col) renderRows(col); }); }
    function announce(col) {
      if (!col || col.depth !== path.length) return;
      var st = files[key(col.parent) + "|" + col.q]; if (!st || !st.ready) return;
      live.textContent = nameOfCol(col.parent) + " : " + plural(st.total, "fichier", "fichiers") + ", " + plural((kids[key(col.parent)] || []).length, "dossier", "dossiers") + ".";
    }
    function markCol(i) {
      var c = cols[i]; if (!c) return;
      var want = i < path.length ? "f" + path[i] : sel ? "m" + sel.id : null;
      var old = c.selKey && c.rows[c.selKey]; // une seule ligne à défaire : pas de parcours de toute la colonne
      if (old) { old.classList.remove("is-sel", "is-path"); old.setAttribute("aria-selected", "false"); old.tabIndex = -1; }
      c.selKey = want; var r = want && c.rows[want];
      if (r) { r.classList.add(i === active ? "is-sel" : "is-path"); r.setAttribute("aria-selected", "true"); r.tabIndex = 0; }
    }

    // ------------------------------------------------------------------ Navigation : ne change que les colonnes concernées
    function show(np, ns, o) {
      o = o || {};
      var old = path, p = 0; while (p < old.length && p < np.length && old[p] === np[p]) p++;
      var changed = old.length !== np.length || p < np.length;
      path = np; sel = ns || null;
      active = o.active !== undefined ? o.active : sel ? path.length : Math.max(0, path.length - 1);
      var need = path.length + 1;
      while (cols.length > need) { var gone = cols.pop(); clearTimeout(gone.timer); if (gone.io) gone.io.disconnect(); colsEl.removeChild(gone.el); }
      for (var i = Math.min(p + 1, cols.length); i < need; i++) {
        var col = buildColumn(i, !reduced);
        if (cols[i]) { clearTimeout(cols[i].timer); if (cols[i].io) cols[i].io.disconnect(); colsEl.replaceChild(col.el, cols[i].el); } else colsEl.insertBefore(col.el, prevEl);
        cols[i] = col; fetchColumn(col);
      }
      if (changed && searchQ) { searchQ = ""; searchInput.value = ""; var lc = cols[path.length]; if (lc && lc.q) { lc.q = ""; fetchColumn(lc, 0); } }
      for (var j = 0; j < cols.length; j++) markCol(j);
      buildPreview(); updateChrome();
      if (!o.noHist) pushHist();
      if (changed) announce(cols[path.length]);
      reveal();
      if (sel && (C().prefs || {}).info === "open") showInfo(sel); // le panneau d'informations de la médiathèque suit la sélection
      if (o.focus) focusActive();
    }
    function reveal() {
      var target = prevEl || cols[cols.length - 1].el, right = target.offsetLeft + target.offsetWidth;
      if (right > colsEl.scrollLeft + colsEl.clientWidth) colsEl.scrollTo({ left: right - colsEl.clientWidth, behavior: reduced ? "auto" : "smooth" });
    }
    function focusActive() { var c = cols[active]; if (!c) return; var r = (c.selKey && c.rows[c.selKey]) || c.list.querySelector(".mk-mc-row"); if (!r) return; r.focus({ preventScroll: true }); keepVisible(c.list, r); }
    function keepVisible(list, r) { var a = r.offsetTop - list.offsetTop, b = a + r.offsetHeight; if (a < list.scrollTop) list.scrollTop = a - 4; else if (b > list.scrollTop + list.clientHeight) list.scrollTop = b - list.clientHeight + 4; }
    function updateChrome() {
      crumbEl.textContent = "";
      var items = [{ n: "Médiathèque" }].concat(path.map(function (id) { return { n: folders[id] ? folders[id].name : "Dossier" }; }));
      items.forEach(function (it, i) {
        if (i) crumbEl.appendChild(h("i", { "aria-hidden": "true", text: "›" }));
        crumbEl.appendChild(h("button", { type: "button", "data-mc-crumb": i, "aria-current": i === items.length - 1 && !sel ? "true" : null, text: it.n, title: it.n }));
      });
      if (sel) { crumbEl.appendChild(h("i", { "aria-hidden": "true", text: "›" })); crumbEl.appendChild(h("button", { type: "button", "aria-current": "true", "data-mc-crumb": "file", text: label(sel), title: sel.name })); }
      crumbEl.scrollLeft = crumbEl.scrollWidth;
      btnUp.disabled = path.length === 0 && !sel; btnBack.disabled = hpos <= 0; btnFwd.disabled = hpos >= hist.length - 1;
      try { var u = new URL(window.location.href), last = path.length ? path[path.length - 1] : null; if (last) u.searchParams.set("dossier", String(last)); else u.searchParams.delete("dossier"); window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash); } catch (e) { /* adresse non modifiable : sans effet */ }
    }
    function pushHist() {
      var cur = hist[hpos];
      if (cur && cur.p.join() === path.join() && (cur.m ? cur.m.id : null) === (sel ? sel.id : null)) return;
      hist = hist.slice(0, hpos + 1); hist.push({ p: path.slice(), m: sel }); if (hist.length > 100) hist.shift(); hpos = hist.length - 1;
      btnBack.disabled = hpos <= 0; btnFwd.disabled = true;
    }
    function go(step) { var t = hist[hpos + step]; if (!t) return; hpos += step; var ok = t.p.filter(function (id) { return folders[id]; }); show(ok.length === t.p.length ? t.p : ok, ok.length === t.p.length ? t.m : null, { noHist: true, focus: true }); }

    // ------------------------------------------------------------------ Aperçu du fichier choisi (dernière colonne)
    function buildPreview() {
      if (!sel) { if (prevEl) { colsEl.removeChild(prevEl); prevEl = null; } return; }
      var m = sel, body = h("div", { class: "mk-mc-prev-body" }), inFolder = m.folderId ? (folders[m.folderId] ? folders[m.folderId].name : "—") : "Sans dossier";
      body.appendChild(h("div", { class: "mk-mc-prev-img" }, m.type === "image" ? h("img", { src: m.medium || m.path, alt: m.alt || "" }) : h("span", { class: "mk-mc-ext", text: K.badge(m) })));
      body.appendChild(h("h3", { text: m.name }));
      body.appendChild(h("dl", {}, [h("dt", { text: "Type" }), h("dd", { text: (K.TYPE_LABELS[m.type] || "Fichier") + " · " + extOf(m).toUpperCase() }), h("dt", { text: "Taille" }), h("dd", { text: K.fmtSize(m.size) }),
        m.width ? h("dt", { text: "Dimensions" }) : null, m.width ? h("dd", { text: m.width + " × " + m.height + " px" }) : null, h("dt", { text: "Ajouté le" }), h("dd", { text: K.fmtDate(m.createdAt) }), h("dt", { text: "Dossier" }), h("dd", { text: inFolder })]));
      body.appendChild(h("div", { class: "mk-mc-prev-actions" }, [
        h("button", { type: "button", class: "mk-mc-btn is-main", "data-mc-act": "details", text: "Informations" }), h("button", { type: "button", class: "mk-mc-btn", "data-mc-act": "copy", text: "Copier l'URL" }),
        h("a", { class: "mk-mc-btn", href: m.path, target: "_blank", rel: "noopener", text: "Ouvrir" })]));
      if (!prevEl) { prevEl = h("section", { class: "mk-mc-col mk-mc-prev" + (reduced ? "" : " is-enter"), "aria-label": "Aperçu du fichier" }); colsEl.appendChild(prevEl); }
      prevEl.textContent = ""; prevEl.appendChild(body);
    }
    function showInfo(m) { MX.selectOnly(m.id); MX.openInfo(true); } // panneau d'informations du gestionnaire (détails, utilisation, modification)
    function copyUrl(m) { K.copy(K.absolute(m.path)).then(function () { toast("Adresse copiée.", "ok"); }, function () { toast("Copie automatique impossible.", "error"); }); }

    // ------------------------------------------------------------------ Sélection par la souris et le clavier
    function rowInfo(row) { var c = row.closest("[data-mc-col]"); return { depth: Number(c.getAttribute("data-mc-col")), kind: row.getAttribute("data-kind"), id: Number(row.getAttribute("data-id")), row: row }; }
    function select(info, o) {
      o = o || {};
      if (info.kind === "folder") show(path.slice(0, info.depth).concat([info.id]), null, { active: info.depth, focus: o.focus !== false, noHist: o.noHist });
      else show(path.slice(0, info.depth), info.row.__m, { active: info.depth, focus: o.focus !== false, noHist: o.noHist });
    }
    function enter(info) { // → ou Entrée : entrer dans le dossier (premier élément de la colonne suivante) ; sur un fichier : informations
      if (info.kind === "file") { showInfo(info.row.__m); return; }
      var next = cols[info.depth + 1], first = next && next.list.querySelector(".mk-mc-row");
      if (first) select(rowInfo(first)); else if (next) next.waiting = true; // fichiers encore en chargement : on entrera dès leur arrivée
    }
    colsEl.addEventListener("click", function (e) {
      var t = e.target, more = t.closest("[data-mc-more]"); if (more) { moreOf(cols[Number(more.closest("[data-mc-col]").getAttribute("data-mc-col"))]); return; }
      var retry = t.closest("[data-mc-retry]"); if (retry) { var c = cols[Number(retry.closest("[data-mc-col]").getAttribute("data-mc-col"))]; delete files[key(c.parent) + "|" + c.q]; fetchColumn(c, 0); return; }
      var act = t.closest("[data-mc-act]"); if (act && sel) { if (act.getAttribute("data-mc-act") === "details") showInfo(sel); else copyUrl(sel); return; }
      var row = t.closest(".mk-mc-row"); if (!row || t.closest(".mk-mc-rename")) return;
      select(rowInfo(row));
    });
    colsEl.addEventListener("dblclick", function (e) {
      var hd = e.target.closest(".mk-mc-resize"); if (hd) { var el = hd.parentElement; delete widths[Number(el.getAttribute("data-mc-col"))]; el.style.width = ""; saveWidths(); return; }
      var row = e.target.closest(".mk-mc-row"); if (row && !e.target.closest(".mk-mc-rename")) enter(rowInfo(row));
    });
    colsEl.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" && !e.ctrlKey && !e.metaKey) e.stopPropagation(); // les raccourcis du gestionnaire (Suppr, F2, flèches…) ne s'appliquent pas à cette vue
      var row = e.target.closest && e.target.closest(".mk-mc-row");
      if (e.target.classList && e.target.classList.contains("mk-mc-resize")) return resizeKey(e);
      if (e.target.classList && e.target.classList.contains("mk-mc-rename")) return;
      if (!row) return;
      var info = rowInfo(row), list = row.parentElement, rows = [].slice.call(list.querySelectorAll(":scope > .mk-mc-row")), at = rows.indexOf(row), k = e.key, handled = true;
      if (e.altKey && k === "ArrowLeft") go(-1);
      else if (e.altKey && k === "ArrowRight") go(1);
      else if (k === "ArrowDown") { if (rows[at + 1]) select(rowInfo(rows[at + 1])); }
      else if (k === "ArrowUp") { if (rows[at - 1]) select(rowInfo(rows[at - 1])); }
      else if (k === "Home") { if (rows[0]) select(rowInfo(rows[0])); }
      else if (k === "End") { if (rows.length) select(rowInfo(rows[rows.length - 1])); }
      else if (k === "ArrowRight") { if (info.kind === "folder") { if (path[info.depth] !== info.id) select(info); enter(info); } else if (info.depth === path.length && sel && sel.id === info.id) { var d = prevEl && prevEl.querySelector("[data-mc-act]"); if (d) d.focus(); } }
      else if (k === "Enter") { if (info.kind === "folder") { if (path[info.depth] !== info.id) select(info); enter(info); } else showInfo(info.row.__m); }
      else if (k === "ArrowLeft") { if (info.depth > 0) show(path.slice(0, info.depth), null, { active: info.depth - 1, focus: true }); }
      else if (k === "F2" && CAN) startRename(info);
      else if ((k === "Delete" || k === "Backspace") && CAN) askTrash(info);
      else if (k === "ContextMenu" || (e.shiftKey && k === "F10")) { var r = row.getBoundingClientRect(); openMenu(info, r.left + 24, r.bottom - 4); }
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(k, rows);
      else handled = false;
      if (handled) e.preventDefault();
    });
    function typeahead(ch, rows) {
      typed += ch.toLowerCase(); clearTimeout(typedTimer); typedTimer = setTimeout(function () { typed = ""; }, 700);
      var hit = rows.filter(function (r) { var n = r.querySelector(".mk-mc-nm"); return n && n.textContent.toLowerCase().indexOf(typed) === 0; })[0];
      if (hit) select(rowInfo(hit));
    }
    btnBack.addEventListener("click", function () { go(-1); });
    btnFwd.addEventListener("click", function () { go(1); });
    btnUp.addEventListener("click", function () { if (sel) show(path.slice(), null, { focus: true }); else show(path.slice(0, -1), null, { focus: true }); });
    btnRefresh.addEventListener("click", function () { refresh().then(function () { toast("Médiathèque actualisée.", "ok"); }); });
    crumbEl.addEventListener("click", function (e) { var b = e.target.closest("[data-mc-crumb]"); if (!b) return; var i = b.getAttribute("data-mc-crumb"); if (i !== "file") show(path.slice(0, Number(i)), null, { focus: true }); });
    document.addEventListener("keydown", function (e) {
      if (!root.isConnected) return;
      if (e.key === "Escape" && menuEl) { closeMenu(); return; }
      var inside = root.contains(document.activeElement), typing = document.activeElement && document.activeElement.tagName === "INPUT";
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && inside && !typing) { e.preventDefault(); go(e.key === "ArrowLeft" ? -1 : 1); }
      if ((e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f")) && inside && !typing) { e.preventDefault(); searchInput.focus(); }
    }, sig);

    // ------------------------------------------------------------------ Recherche dans le dossier sélectionné
    var searchTimer = 0;
    searchInput.addEventListener("input", function () { clearTimeout(searchTimer); searchTimer = setTimeout(function () { searchQ = searchInput.value.trim(); var c = cols[path.length]; if (!c) return; c.q = searchQ; fetchColumn(c, 0); }, 220); });
    searchInput.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Escape") { searchInput.value = ""; searchInput.dispatchEvent(new Event("input")); focusActive(); } if (e.key === "ArrowDown") { e.preventDefault(); focusActive(); } });

    // ------------------------------------------------------------------ Redimensionner les colonnes
    var resizing = null;
    colsEl.addEventListener("pointerdown", function (e) {
      var hd = e.target.closest(".mk-mc-resize"); if (!hd) return;
      var el = hd.parentElement; resizing = { el: el, x: e.clientX, w: el.getBoundingClientRect().width, depth: Number(el.getAttribute("data-mc-col")), hd: hd };
      hd.setPointerCapture(e.pointerId); hd.classList.add("is-on"); e.preventDefault();
    });
    colsEl.addEventListener("pointermove", function (e) { if (!resizing) return; var w = clamp(resizing.w + e.clientX - resizing.x, MIN_W, MAX_W); resizing.el.style.width = w + "px"; resizing.now = w; });
    function endResize() { if (!resizing) return; resizing.hd.classList.remove("is-on"); if (resizing.now) { widths[resizing.depth] = Math.round(resizing.now); saveWidths(); } resizing = null; }
    colsEl.addEventListener("pointerup", endResize); colsEl.addEventListener("pointercancel", endResize);
    function resizeKey(e) {
      var el = e.target.parentElement, d = e.key === "ArrowLeft" ? -16 : e.key === "ArrowRight" ? 16 : 0; if (!d) return;
      e.preventDefault(); var w = clamp(Math.round(el.getBoundingClientRect().width) + d, MIN_W, MAX_W); el.style.width = w + "px"; widths[Number(el.getAttribute("data-mc-col"))] = w; saveWidths();
    }
    function relabel() { cols.forEach(function (c) { Object.keys(c.rows).forEach(function (k) { var r = c.rows[k]; if (r.__m) { var n = r.querySelector(".mk-mc-nm"); if (n) n.textContent = label(r.__m); } }); }); }

    // ------------------------------------------------------------------ Modifications (toujours confirmées par le serveur)
    function resetColumns() { cols.forEach(function (c) { clearTimeout(c.timer); if (c.io) c.io.disconnect(); }); colsEl.textContent = ""; cols = []; prevEl = null; }
    function loadTree() { return K.api("GET", BASE + "/dossiers.json").then(function (t) { indexTree(t.folders); files = {}; }); }
    function refresh() {
      return loadTree().then(function () {
        var np = []; path.forEach(function (id, i) { if (i === np.length && folders[id] && (folders[id].parentId === null || folders[id].parentId === undefined ? np.length === 0 : folders[id].parentId === np[np.length - 1])) np.push(id); });
        resetColumns(); show(np, null, { noHist: true, active: Math.min(active, np.length) });
      }, function (err) { toast(MX.errMsg(err), "error"); });
    }
    function startRename(info) {
      var row = info.row, nm = row.querySelector(".mk-mc-nm"); if (!nm || row.querySelector(".mk-mc-rename")) return;
      var current = info.kind === "folder" ? folders[info.id].name : row.__m.name, done = false;
      var input = h("input", { class: "mk-mc-rename", type: "text", maxlength: info.kind === "folder" ? "80" : "120", value: current, "aria-label": "Nouveau nom" });
      row.draggable = false; nm.hidden = true; nm.parentNode.insertBefore(input, nm); input.focus(); input.select();
      function finish(ok) {
        if (done) return; done = true; var v = input.value.trim(); row.draggable = CAN; input.parentNode.removeChild(input); nm.hidden = false;
        cols.forEach(function (c) { if (c.dirty) { c.dirty = false; renderRows(c); } });
        if (ok && v && v !== current) {
          if (info.kind === "folder") K.folderRename(info.id, v).then(function () { toast("Dossier renommé.", "ok"); refresh(); }, function (err) { toast(MX.errMsg(err), "error"); });
          else K.update(info.id, { name: v }).then(function (saved) { patchMedia(saved); toast("Fichier renommé.", "ok"); }, function (err) { toast(MX.errMsg(err), "error"); });
        }
        row.focus({ preventScroll: true });
      }
      input.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); finish(true); } else if (e.key === "Escape") { e.preventDefault(); finish(false); } });
      input.addEventListener("blur", function () { finish(true); });
    }
    function patchMedia(saved) {
      Object.keys(files).forEach(function (k) { files[k].items.forEach(function (m) { if (m.id === saved.id) Object.keys(saved).forEach(function (f) { if (saved[f] !== undefined) m[f] = saved[f]; }); }); });
      if (sel && sel.id === saved.id) { Object.keys(saved).forEach(function (f) { sel[f] = saved[f]; }); buildPreview(); updateChrome(); }
      relabel();
    }
    function newFolder(parent) {
      K.folderCreate("Nouveau dossier", parent).then(function (f) {
        return loadTree().then(function () {
          var np = chain(f.id); resetColumns(); path = [];
          show(np, null, { active: np.length - 1, focus: true });
          var r = cols[np.length - 1].rows["f" + f.id]; if (r) { keepVisible(cols[np.length - 1].list, r); startRename(rowInfo(r)); }
        });
      }).catch(function (err) { toast(MX.errMsg(err), "error"); });
    }
    if (btnNew) btnNew.addEventListener("click", function () { newFolder(path.length ? path[path.length - 1] : null); });
    function askTrash(info) {
      if (info.kind === "folder") {
        var f = folders[info.id];
        confirmDialog({ title: "Mettre le dossier à la corbeille ?", text: "Le dossier « " + f.name + " » part à la corbeille avec ses fichiers et ses sous-dossiers ; vous pourrez le restaurer.", ok: "Mettre à la corbeille", danger: true }, function () {
          K.api("POST", BASE + "/dossiers/" + info.id + "/corbeille", {}).then(function () { toast("Dossier mis à la corbeille.", "ok"); refresh(); }, function (err) { toast(MX.errMsg(err), "error"); });
        });
      } else {
        var m = info.row.__m;
        confirmDialog({ title: "Mettre à la corbeille ?", text: "« " + m.name + " » ira à la corbeille. Il restera affiché là où il est utilisé ; vous pourrez le restaurer.", ok: "Mettre à la corbeille", danger: true }, function () {
          K.trash(m.id).then(function () { toast("« " + m.name + " » est à la corbeille.", "ok"); refresh(); }, function (err) { toast(MX.errMsg(err), "error"); });
        });
      }
    }
    function askUnfold(info) {
      var f = folders[info.id];
      confirmDialog({ title: "Supprimer le dossier sans ses fichiers ?", text: "Le dossier « " + f.name + " » disparaît ; ses fichiers et sous-dossiers remontent d'un niveau. Aucun fichier n'est supprimé.", ok: "Supprimer le dossier", danger: true }, function () {
        K.folderDelete(info.id).then(function () { toast("Dossier supprimé ; ses fichiers sont conservés.", "ok"); refresh(); }, function (err) { toast(MX.errMsg(err), "error"); });
      });
    }
    function moveInto(drag, target) { // target : numéro de dossier ou null (racine)
      var p = drag.kind === "file" ? K.move([drag.id], target) : K.api("POST", BASE + "/dossiers/" + drag.id, { parent_id: target });
      return p.then(function (r) {
        if (r && r.failed && r.failed.length) toast(r.failed[0].message, "error"); else toast(drag.kind === "file" ? "Fichier déplacé." : "Dossier déplacé.", "ok");
        return refresh();
      }, function (err) { toast(MX.errMsg(err), "error"); });
    }

    // ------------------------------------------------------------------ Glisser-déposer (interne ; l'import de fichiers du bureau reste celui du gestionnaire)
    function dropTarget(e) {
      var row = e.target.closest && e.target.closest(".mk-mc-row");
      if (row && row.getAttribute("data-kind") === "folder") return { parent: Number(row.getAttribute("data-id")), el: row, row: row };
      var col = e.target.closest && e.target.closest("[data-mc-col]");
      if (col && cols[Number(col.getAttribute("data-mc-col"))]) return { parent: cols[Number(col.getAttribute("data-mc-col"))].parent, el: col, col: true };
      return null;
    }
    function validDrop(d, target) {
      if (!d || !target) return false;
      var from = d.kind === "file" ? (d.m.folderId === undefined ? null : d.m.folderId) : folders[d.id] ? folders[d.id].parentId || null : null;
      if ((from === null ? null : from) === target.parent) return false;
      if (d.kind === "folder" && target.parent !== null && isInside(target.parent, d.id)) return false;
      return true;
    }
    var dropEl = null, spring = 0;
    function clearDrop() { if (dropEl) dropEl.classList.remove("is-drop", "is-drop-col"); dropEl = null; clearTimeout(spring); }
    colsEl.addEventListener("dragstart", function (e) {
      var row = e.target.closest && e.target.closest(".mk-mc-row"); if (!row || !CAN) { e.preventDefault(); return; }
      var info = rowInfo(row); dragging = { kind: info.kind, id: info.id, m: row.__m || null }; row.classList.add("is-drag");
      e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "mc:" + row.querySelector(".mk-mc-nm").textContent);
    });
    colsEl.addEventListener("dragend", function () { clearDrop(); dragging = null; [].slice.call(colsEl.querySelectorAll(".is-drag")).forEach(function (r) { r.classList.remove("is-drag"); }); });
    colsEl.addEventListener("dragover", function (e) {
      if (!dragging) return; var t = dropTarget(e);
      if (!validDrop(dragging, t)) { clearDrop(); return; }
      e.preventDefault(); e.dataTransfer.dropEffect = "move";
      if (dropEl !== t.el) {
        clearDrop(); dropEl = t.el; dropEl.classList.add(t.row ? "is-drop" : "is-drop-col");
        if (t.row) { var info = rowInfo(t.row); spring = setTimeout(function () { if (path[info.depth] !== info.id) show(path.slice(0, info.depth).concat([info.id]), null, { active: info.depth, noHist: true }); }, 800); } // ouvre le dossier survolé
      }
    });
    colsEl.addEventListener("drop", function (e) {
      if (!dragging) return; var t = dropTarget(e), d = dragging; clearDrop(); dragging = null;
      if (!validDrop(d, t)) return; e.preventDefault(); moveInto(d, t.parent);
    });

    // ------------------------------------------------------------------ Menu contextuel
    function closeMenu() { if (menuEl) { var m = menuEl; menuEl = null; m.parentNode.removeChild(m); } }
    function openMenu(info, x, y) {
      closeMenu();
      var items = [], at = info ? { x: x, y: y } : { x: y.x, y: y.y };
      if (!info) { if (CAN) items.push(["Nouveau dossier ici", function () { newFolder(y.parent); }]); }
      else if (info.kind === "folder") {
        items.push(["Ouvrir", function () { select(info); enter(info); }]);
        if (CAN) items.push(["Nouveau sous-dossier", function () { newFolder(info.id); }], ["Renommer", function () { startRename(info); }], null, ["Mettre à la corbeille", function () { askTrash(info); }, true], ["Supprimer le dossier, garder les fichiers", function () { askUnfold(info); }, true]);
      } else {
        var m = info.row.__m;
        items.push(["Informations", function () { showInfo(m); }], ["Ouvrir dans un onglet", function () { window.open(m.path, "_blank", "noopener"); }], ["Copier l'URL", function () { copyUrl(m); }]);
        if (CAN) items.push(["Renommer", function () { startRename(info); }], null, ["Mettre à la corbeille", function () { askTrash(info); }, true]);
      }
      if (!items.length) return;
      var menu = h("div", { class: "mk-mc-menu", role: "menu", "aria-label": "Actions" });
      items.forEach(function (it) {
        if (!it) { menu.appendChild(h("hr")); return; }
        var b = h("button", { type: "button", role: "menuitem", class: it[2] ? "is-danger" : null, text: it[0] }); b.addEventListener("click", function () { closeMenu(); it[1](); }); menu.appendChild(b);
      });
      menu.addEventListener("keydown", function (e) {
        e.stopPropagation(); var bs = [].slice.call(menu.querySelectorAll("button")), i = bs.indexOf(document.activeElement);
        if (e.key === "ArrowDown") { e.preventDefault(); bs[(i + 1) % bs.length].focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); bs[(i - 1 + bs.length) % bs.length].focus(); }
        else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); closeMenu(); focusActive(); }
      });
      root.appendChild(menu); menuEl = menu;
      menu.style.left = clamp(at.x, 4, window.innerWidth - menu.offsetWidth - 4) + "px"; menu.style.top = clamp(at.y, 4, window.innerHeight - menu.offsetHeight - 4) + "px";
      menu.querySelector("button").focus();
    }
    colsEl.addEventListener("contextmenu", function (e) {
      e.stopPropagation(); // pas le menu du gestionnaire
      var row = e.target.closest(".mk-mc-row");
      if (row) { e.preventDefault(); var info = rowInfo(row); if (!(info.kind === "folder" ? path[info.depth] === info.id : sel && sel.id === info.id)) select(info, { focus: false }); openMenu(info, e.clientX, e.clientY); return; }
      var col = e.target.closest("[data-mc-col]"), c = col && cols[Number(col.getAttribute("data-mc-col"))];
      if (c && !col.classList.contains("mk-mc-prev") && CAN) { e.preventDefault(); openMenu(null, 0, { parent: c.parent, x: e.clientX, y: e.clientY }); }
    });

    // ------------------------------------------------------------------ Démarrage : l'arbre est déjà dans la page (aucune requête avant le premier affichage)
    indexTree((C().folders || []).map(function (f) { return f; }));
    var start = Number(root.getAttribute("data-start")) || null, np = start && folders[start] ? chain(start) : [];
    show(np, null, { active: Math.max(0, np.length - 1) });
    hist = [{ p: np.slice(), m: null }]; hpos = 0; updateChrome();
    root.setAttribute("data-ready", "1");
  }

  window.MXColumns = { mount: mount };
  var first = document.querySelector("[data-mx-columns]"); if (first) mount(first);
})();

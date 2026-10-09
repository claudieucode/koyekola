/* Font Manager (client) : sélecteur de police unique pour tous les éditeurs de Kolakisa.
   - manifeste léger chargé à la première ouverture (/polices/manifeste.json) ;
   - liste VIRTUALISÉE : seules les lignes visibles (plus une petite marge) existent dans la page, quel que soit le nombre de familles ;
   - aperçu de chaque ligne visible avec sa propre police : ses règles @font-face (/polices.css?f=…) ne sont demandées qu'une fois le
     défilement arrêté, et retirées à la fermeture du sélecteur (le navigateur ne télécharge un fichier que si une règle sert vraiment) ;
   - recherche instantanée, catégories, favoris et récentes (mémorisés dans ce navigateur) ;
   - KFonts.picker({ value, legacy, onChange, disabled, label, mode }) renvoie un bouton ; la valeur enregistrée est l'identifiant stable
     de la famille (« font.inter ») ou une ancienne valeur de l'éditeur (jamais réécrite). */
(function () {
  "use strict";
  var manifest = null, loading = null, byId = {}, loaded = {}, queue = [], flushTimer = null;
  var CATS = [["all", "Toutes"], ["sans-serif", "Sans empattement"], ["serif", "Serif"], ["display", "Display"], ["cursive", "Cursives / manuscrites"], ["monospace", "Monospace"], ["slab-serif", "Slab serif"], ["variable", "Polices variables"], ["popular", "Populaires"], ["fav", "Favoris"], ["recent", "Récentes"]];
  var SAMPLE = "The quick brown fox jumps over the lazy dog";
  var ROW_H = 69, OVERSCAN = 6; // hauteur fixe d'une ligne (voir font-manager.css) : condition de la virtualisation

  function store(key, fallback) { try { var v = JSON.parse(localStorage.getItem("kfonts:" + key)); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function save(key, v) { try { localStorage.setItem("kfonts:" + key, JSON.stringify(v)); } catch (e) { /* stockage indisponible : sans effet */ } }

  function load() {
    if (manifest) return Promise.resolve(manifest);
    if (!loading) loading = fetch("/polices/manifeste.json", { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error("manifeste"); return r.json(); }).then(function (m) {
      manifest = m; (m.families || []).forEach(function (f) { byId[f.id] = f; f.n = norm(f.family); f.cn = f.categories.map(norm); }); return m;
    });
    return loading;
  }
  // Charge les règles @font-face des familles demandées (groupées, une seule fois chacune). Deux cas : les familles UTILISÉES (nom du
  // bouton, police choisie) restent ; les familles d'APERÇU (lignes visibles du sélecteur) sont retirées à la fermeture, pour que parcourir
  // tout le catalogue ne laisse pas des centaines de règles actives dans la page.
  var previewLoaded = {}, previewLinks = [];
  function ensure(ids, preview) {
    var table = preview ? previewLoaded : loaded;
    ids.forEach(function (id) { if (!table[id] && queue.indexOf(id) < 0 && !(preview && loaded[id])) queue.push(preview ? "~" + id : id); });
    if (flushTimer || !queue.length) return;
    flushTimer = setTimeout(function () {
      flushTimer = null;
      var pinned = queue.filter(function (q) { return q.charAt(0) !== "~"; }), prev = queue.filter(function (q) { return q.charAt(0) === "~"; }).map(function (q) { return q.slice(1); });
      queue = [];
      [[pinned, false], [prev, true]].forEach(function (g) {
        while (g[0].length) {
          var batch = g[0].splice(0, 30);
          batch.forEach(function (id) { (g[1] ? previewLoaded : loaded)[id] = true; });
          var link = document.createElement("link"); link.rel = "stylesheet"; link.href = "/polices.css?f=" + batch.map(encodeURIComponent).join(",");
          document.head.appendChild(link);
          if (g[1]) previewLinks.push({ link: link, ids: batch });
        }
      });
    }, 40);
  }
  function dropPreview() {
    previewLinks.forEach(function (p) { p.link.remove(); p.ids.forEach(function (id) { delete previewLoaded[id]; }); });
    previewLinks = [];
  }
  // Familles déjà citées dans le document : leurs règles sont déjà là (ou chargées au premier affichage)
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") n.textContent = attrs[k]; else if (k === "class") n.className = attrs[k]; else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k] === true ? "" : attrs[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var SYN = { script: "cursive", manuscrite: "cursive", manuscrit: "cursive", cursives: "cursive", empattement: "serif", "sans serif": "sans-serif", mono: "monospace", chasse: "monospace", titre: "display", slab: "slab-serif", variable: "variable" };

  var openPanel = null;
  function closePanel() { if (openPanel) { openPanel.close(); openPanel = null; } }

  function picker(opts) {
    opts = opts || {};
    var legacy = opts.legacy || [];      // [[valeur, libellé], …] : réglages historiques de l'éditeur
    var value = opts.value == null ? "" : String(opts.value);
    var mode = opts.mode || "web";
    var btn = el("button", { type: "button", class: "kf-btn", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-label": (opts.label || "Police") + " : choisir dans la bibliothèque", disabled: opts.disabled ? true : null });
    var name = el("span", { class: "kf-btn-name" }); btn.appendChild(name); btn.appendChild(el("span", { class: "kf-btn-caret", "aria-hidden": "true", text: "▾" }));
    function labelOf(v) {
      if (!v) return opts.emptyLabel || "Par défaut";
      var f = byId[v]; if (f) return f.family;
      for (var i = 0; i < legacy.length; i++) if (legacy[i][0] === v) return legacy[i][1];
      return String(v).replace(/^font\./, "").replace(/-/g, " ");
    }
    function paint() {
      // Le nom d'une famille de la bibliothèque n'est connu qu'une fois le manifeste chargé
      if (/^font\./.test(value) && !manifest) load().then(function () { paint(); }).catch(function () {});
      name.textContent = labelOf(value);
      var f = byId[value];
      if (f) { ensure([f.id]); name.style.fontFamily = f.stack; } else name.style.fontFamily = "";
    }
    // L'étiquette d'une famille de la bibliothèque est connue après le chargement du manifeste
    paint();
    // Comme un champ de formulaire : .value (lecture / écriture) et événement « change » à chaque choix
    Object.defineProperty(btn, "value", { get: function () { return value; }, set: function (v) { value = v == null ? "" : String(v); paint(); } });
    btn.getValue = function () { return value; };
    btn.setValue = function (v) { btn.value = v; };
    btn.addEventListener("click", function () { if (btn.disabled) return; if (openPanel && openPanel.owner === btn) { closePanel(); return; } closePanel(); open(); });

    function open() {
      var cat = "all", query = "", results = [], body = null;
      var favs = store("fav", []), recent = store("recent", []);
      var panel = el("div", { class: "kf-panel", role: "dialog", "aria-label": "Bibliothèque de polices" });
      var search = el("input", { type: "search", class: "kf-search", placeholder: "Rechercher une police…", "aria-label": "Rechercher une police", autocomplete: "off", spellcheck: "false" });
      var chips = el("div", { class: "kf-cats", role: "group", "aria-label": "Catégories" });
      var list = el("div", { class: "kf-list", role: "listbox", tabindex: "-1", "aria-label": "Polices" });
      var foot = el("p", { class: "kf-foot" });
      panel.appendChild(search); panel.appendChild(chips); panel.appendChild(list); panel.appendChild(foot);
      document.body.appendChild(panel);
      // La fenêtre vit sur <body> (jamais coupée par un panneau) : elle reprend les jetons du thème de l'éditeur qui l'ouvre
      var cs = getComputedStyle(btn);
      [["--kf-bg", ["--editor-panel", "--card", "--surface"]], ["--kf-text", ["--editor-text", "--text"]], ["--kf-muted", ["--editor-muted", "--muted"]], ["--kf-border", ["--editor-border", "--border"]],
        ["--kf-hover", ["--editor-hover", "--surface-alt"]], ["--kf-accent", ["--editor-accent", "--accent"]], ["--kf-active", ["--editor-active", "--accent-light"]], ["--kf-accent-text", ["--editor-accent-text", "--accent-dark"]]].forEach(function (m) {
        for (var i = 0; i < m[1].length; i++) { var v = cs.getPropertyValue(m[1][i]).trim(); if (v) { panel.style.setProperty(m[0], v); break; } }
      });
      function place() {
        var r = btn.getBoundingClientRect(), w = Math.min(360, window.innerWidth - 16);
        var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)), spaceBelow = window.innerHeight - r.bottom - 12;
        var h = Math.min(520, Math.max(280, spaceBelow > 320 ? spaceBelow : r.top - 12));
        panel.style.width = w + "px"; panel.style.left = left + "px"; panel.style.maxHeight = h + "px";
        if (spaceBelow > 320) { panel.style.top = r.bottom + 6 + "px"; panel.style.bottom = ""; } else { panel.style.top = ""; panel.style.bottom = window.innerHeight - r.top + 6 + "px"; }
      }
      place();
      btn.setAttribute("aria-expanded", "true");
      var onDocDown = function (e) { if (!panel.contains(e.target) && !btn.contains(e.target)) closePanel(); };
      var onKey = function (e) { if (e.key === "Escape") { e.stopPropagation(); closePanel(); btn.focus(); } };
      var onResize = function () { place(); };
      document.addEventListener("mousedown", onDocDown, true); document.addEventListener("keydown", onKey, true); window.addEventListener("resize", onResize);
      openPanel = { owner: btn, close: function () { document.removeEventListener("mousedown", onDocDown, true); document.removeEventListener("keydown", onKey, true); window.removeEventListener("resize", onResize); clearTimeout(loadTimer); cancelAnimationFrame(frameReq); dropPreview(); panel.remove(); btn.setAttribute("aria-expanded", "false"); } };

      function choose(v) {
        if (/^font\./.test(v)) { recent = [v].concat(recent.filter(function (x) { return x !== v; })).slice(0, 12); save("recent", recent); }
        value = v; paint(); closePanel(); btn.focus();
        if (opts.onChange) opts.onChange(v);
        btn.dispatchEvent(new Event("change", { bubbles: true }));
      }
      function row(item, index) {
        var f = item.family, isLib = Boolean(f), id = isLib ? f.id : item.value;
        var li = el("div", { class: "kf-row" + (id === value ? " is-current" : ""), style: "top:" + index * ROW_H + "px" });
        var pick = el("button", { type: "button", class: "kf-pick", role: "option", "aria-selected": String(id === value), "aria-posinset": String(index + 1), "aria-setsize": String(results.length), "data-index": String(index), "data-font": isLib ? f.id : null });
        var title = el("span", { class: "kf-name", text: isLib ? f.family : item.label });
        if (isLib) title.style.fontFamily = f.stack;
        pick.appendChild(title);
        var sample = el("span", { class: "kf-sample", text: SAMPLE });
        if (isLib) sample.style.fontFamily = f.stack; else if (item.stack) sample.style.fontFamily = item.stack;
        pick.appendChild(sample);
        var meta = [];
        if (isLib) { meta.push(f.weights.length > 1 || f.variable ? (f.variable ? "variable " + f.weights[0] + "–" + f.weights[f.weights.length - 1] : f.weights.length + " graisses") : "1 graisse"); if (f.styles.indexOf("italic") >= 0) meta.push("italique"); }
        else meta.push("réglage du site");
        if (mode === "email") meta.push(isLib ? "e-mail : compatibilité limitée" : "e-mail compatible");
        pick.appendChild(el("span", { class: "kf-meta", text: meta.join(" · ") }));
        pick.addEventListener("click", function () { choose(id); });
        li.appendChild(pick);
        if (isLib) {
          var on = favs.indexOf(f.id) >= 0;
          var star = el("button", { type: "button", class: "kf-star", "aria-pressed": String(on), "aria-label": (on ? "Retirer des favoris : " : "Ajouter aux favoris : ") + f.family, title: on ? "Retirer des favoris" : "Ajouter aux favoris", text: on ? "★" : "☆" });
          star.addEventListener("click", function (e) { e.stopPropagation(); var i = favs.indexOf(f.id); if (i >= 0) favs.splice(i, 1); else favs.push(f.id); save("fav", favs); render(); });
          li.appendChild(star);
        }
        return li;
      }
      function legacyItems() { var st = typeof opts.legacyStacks === "function" ? opts.legacyStacks() : opts.legacyStacks; return legacy.map(function (l) { return { value: l[0], label: l[1], stack: st && st[l[0]] }; }); }
      function compute() {
        var q = norm(query).trim(), catWord = SYN[q] || null;
        var libs = (manifest ? manifest.families : []).filter(function (f) {
          if (cat === "fav" && favs.indexOf(f.id) < 0) return false;
          if (cat === "recent" && recent.indexOf(f.id) < 0) return false;
          if (cat !== "all" && cat !== "popular" && cat !== "fav" && cat !== "recent" && f.categories.indexOf(cat) < 0) return false;
          if (!q) return true;
          return f.n.indexOf(q) >= 0 || (catWord && f.categories.indexOf(catWord) >= 0) || f.cn.some(function (c) { return c.indexOf(q) >= 0; });
        });
        if (cat === "recent") libs.sort(function (a, b) { return recent.indexOf(a.id) - recent.indexOf(b.id); });
        else if (cat === "fav" || cat === "popular" || cat === "all") libs.sort(function (a, b) { return a.popularity - b.popularity; });
        var leg = (cat === "all" || cat === "popular") ? legacyItems().filter(function (l) { return !q || norm(l.label).indexOf(q) >= 0; }) : [];
        return leg.map(function (l) { return { legacy: true, value: l.value, label: l.label, stack: l.stack }; }).concat(libs.map(function (f) { return { family: f }; }));
      }
      // Liste virtualisée : la liste a la hauteur totale des résultats (ROW_H par ligne) ; seules les lignes visibles, plus une marge, existent
      var frameReq = 0, loadTimer = null, first = -1, last = -1, lastScroll = 0;
      function paintFoot() { foot.textContent = results.length + " police" + (results.length > 1 ? "s" : "") + (manifest ? " sur " + manifest.count + " dans la bibliothèque" : ""); }
      function windowRows(force) {
        var top = list.scrollTop, h = list.clientHeight || 320;
        var a = Math.max(0, Math.floor(top / ROW_H) - OVERSCAN), b = Math.min(results.length - 1, Math.ceil((top + h) / ROW_H) + OVERSCAN);
        if (!force && a === first && b === last) return;
        first = a; last = b;
        var keep = document.activeElement && body.contains(document.activeElement) ? document.activeElement.getAttribute("data-index") : null;
        body.textContent = "";
        for (var i = a; i <= b; i++) body.appendChild(row(results[i], i));
        if (keep !== null) { var again = body.querySelector('[data-index="' + keep + '"]'); if (again) again.focus({ preventScroll: true }); }
        schedulePreviews();
      }
      // Aperçus : seulement les lignes réellement visibles, et seulement quand le défilement s'est arrêté (≥ 140 ms sans mouvement) :
      // pendant un défilement rapide, aucune police n'est demandée
      function schedulePreviews() {
        clearTimeout(loadTimer);
        loadTimer = setTimeout(function () {
          if (Date.now() - lastScroll < 140) { schedulePreviews(); return; }
          var ids = [], va = Math.max(0, Math.floor(list.scrollTop / ROW_H) - 1), vb = Math.min(results.length - 1, Math.ceil((list.scrollTop + (list.clientHeight || 320)) / ROW_H) + 1);
          for (var k = va; k <= vb; k++) if (results[k] && results[k].family) ids.push(results[k].family.id);
          if (ids.length) ensure(ids, true);
        }, 160);
      }
      function render() {
        list.textContent = ""; results = compute(); first = last = -1;
        if (!results.length) { list.appendChild(el("p", { class: "kf-empty", text: cat === "fav" ? "Aucun favori : cliquez sur l’étoile d’une police." : cat === "recent" ? "Aucune police récente." : "Aucune police ne correspond." })); paintFoot(); return; }
        body = el("div", { class: "kf-rows", style: "height:" + results.length * ROW_H + "px" });
        list.appendChild(body); list.scrollTop = 0;
        windowRows(true); paintFoot();
      }
      list.addEventListener("scroll", function () { lastScroll = Date.now(); if (!frameReq) frameReq = requestAnimationFrame(function () { frameReq = 0; if (body) windowRows(false); }); }, { passive: true });
      // Clavier : les lignes hors fenêtre n'existent pas, les flèches parcourent donc la liste entière (Début / Fin / pages comprises)
      list.addEventListener("keydown", function (e) {
        var cur = document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute("data-index") : null;
        if (cur === null || !results.length) return;
        var d = { ArrowDown: 1, ArrowUp: -1, PageDown: 8, PageUp: -8 }[e.key], target;
        if (d) target = Number(cur) + d; else if (e.key === "Home") target = 0; else if (e.key === "End") target = results.length - 1; else return;
        e.preventDefault();
        target = Math.max(0, Math.min(results.length - 1, target));
        if (target * ROW_H < list.scrollTop) list.scrollTop = target * ROW_H; else if ((target + 1) * ROW_H > list.scrollTop + list.clientHeight) list.scrollTop = (target + 1) * ROW_H - list.clientHeight;
        windowRows(false);
        var next = body.querySelector('[data-index="' + target + '"]'); if (next) next.focus({ preventScroll: true });
      });
      CATS.forEach(function (c) {
        var b = el("button", { type: "button", class: "kf-chip" + (c[0] === cat ? " is-on" : ""), "aria-pressed": String(c[0] === cat), text: c[1] });
        b.addEventListener("click", function () { cat = c[0]; [].forEach.call(chips.children, function (x) { var on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", String(on)); }); render(); });
        chips.appendChild(b);
      });
      var t = null;
      search.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { query = search.value; render(); }, 60); });
      if (opts.allowEmpty !== false && opts.emptyLabel) { /* « par défaut » : choix explicite en tête */ }
      var reset = opts.emptyLabel ? el("button", { type: "button", class: "kf-reset", text: opts.emptyLabel }) : null;
      if (reset) { reset.addEventListener("click", function () { choose(""); }); panel.insertBefore(reset, list); }
      foot.textContent = "Chargement de la bibliothèque…";
      load().then(function () { if (openPanel && openPanel.owner === btn) { render(); search.focus(); var at = results.findIndex(function (r) { return (r.family ? r.family.id : r.value) === value; }); if (at >= 0 && body) { list.scrollTop = Math.max(0, at * ROW_H - 2 * ROW_H); windowRows(true); } } })
        .catch(function () { foot.textContent = "Bibliothèque indisponible : les polices du site restent utilisables."; render(); });
      search.focus();
    }
    return btn;
  }
  // Remplace un <select> de formulaire (poster un nom de champ) par le sélecteur de la bibliothèque : champ caché de même nom
  function enhance(sel, opts) {
    if (!sel || sel.getAttribute("data-kf-done")) return null;
    opts = opts || {};
    var legacy = [].filter.call(sel.options, function (o) { return !/^font\./.test(o.value); }).map(function (o) { return [o.value, o.textContent]; });
    var hidden = document.createElement("input"); hidden.type = "hidden"; hidden.name = sel.name; hidden.value = sel.value;
    var p = picker({ value: sel.value, legacy: legacy, disabled: sel.disabled, mode: opts.mode || "web", label: opts.label || (sel.labels && sel.labels[0] ? sel.labels[0].textContent : "Police"), onChange: function (v) { hidden.value = v; } });
    p.id = sel.id; p.setAttribute("data-kf-done", "1");
    sel.parentNode.insertBefore(hidden, sel); sel.parentNode.replaceChild(p, sel);
    return p;
  }
  window.KFonts = { enhance: enhance, picker: picker, load: load, ensure: ensure, byId: function (id) { return byId[id] || null; }, ready: function () { return Boolean(manifest); },
    weightsFor: function (id) { var f = byId[id]; return f ? { weights: f.weights, italic: f.styles.indexOf("italic") >= 0, variable: f.variable } : null; } };
})();

/* Manuel — documentation : recherche instantanée, sommaire qui suit le défilement, onglets, copie de code, filtres. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "manuel") return;
  if (document.__mnInit) return; document.__mnInit = 1;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fold = function (s) { return String(s).toLowerCase().replace(/[À-ſ]/g, function (c) { return c.normalize("NFD").charAt(0); }); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var path = location.pathname.replace(/\/+$/, "") || "/";
  var live = document.createElement("div"); live.className = "mn-sr"; live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite"); b.appendChild(live);
  var say = function (t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); };

  // Apparition douce (jamais masquée sans JS ni en mouvement réduit)
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("mn-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  // Ancres : l'identifiant des titres vient de data-anchor
  var heads = $$("[data-anchor]");
  heads.forEach(function (h) { h.id = h.getAttribute("data-anchor"); });
  function go(id, smooth) { var el = document.getElementById(id); if (!el) return; el.scrollIntoView({ behavior: smooth && !reduce ? "smooth" : "auto", block: "start" }); try { history.replaceState(null, "", "#" + id); } catch (e) {} }
  document.addEventListener("click", function (ev) {
    var a = ev.target.closest && ev.target.closest("a[href^='#']"); if (!a) return;
    var id = a.getAttribute("href").slice(1); if (!id) return;
    if (document.getElementById(id)) { ev.preventDefault(); go(id, true); var d = a.closest(".mn-mob"); if (d) d.open = false; }
    else if (!a.hasAttribute("data-tab") && !a.hasAttribute("data-filter")) ev.preventDefault();
  });
  if (location.hash.length > 1) setTimeout(function () { go(decodeURIComponent(location.hash.slice(1)), false); }, 60);

  // Page courante dans le sommaire + sous-sommaire de la page (suit le défilement)
  var curLinks = $$(".mn-side .mn-grp a").filter(function (a) { return (a.getAttribute("href").replace(/\/+$/, "") || "/") === path; });
  curLinks.forEach(function (a) { a.setAttribute("aria-current", "page"); });
  $$(".mn-mob-panel .mn-grp a").forEach(function (a) { if ((a.getAttribute("href").replace(/\/+$/, "") || "/") === path) a.setAttribute("aria-current", "page"); });
  var sub = [];
  if (heads.length > 1) {
    var tocUl = document.querySelector("[data-toc]");
    var label = function (h) { var c = h.cloneNode(true); $$(".mn-hash,.mn-k,time,.mn-badge", c).forEach(function (x) { x.parentNode.removeChild(x); }); return c.textContent.trim(); };
    var mk = function (host) { heads.forEach(function (h) { var li = document.createElement("li"), a = document.createElement("a"); a.href = "#" + h.id; a.textContent = label(h); li.appendChild(a); host.appendChild(li); sub.push(a); }); };
    if (tocUl) { mk(tocUl); b.classList.add("mn-toc-on"); }
    var art = document.querySelector(".mn-article");
    if (art) { var d = document.createElement("details"); d.className = "mn-tocm"; var sm = document.createElement("summary"); sm.textContent = "Sur cette page"; var ul = document.createElement("ul"); d.appendChild(sm); d.appendChild(ul); mk(ul); art.insertBefore(d, art.firstChild); }
    if (curLinks[0]) { var ul2 = document.createElement("ul"); ul2.className = "mn-sub"; mk(ul2); curLinks[0].parentNode.appendChild(ul2); }
    var ticking = false;
    var spy = function () {
      ticking = false; var cur = heads[0].id, lim = 110;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top <= lim) cur = h.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = heads[heads.length - 1].id;
      sub.forEach(function (a) { var on = a.getAttribute("href") === "#" + cur; a.classList.toggle("is-on", on); if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(spy); } }, { passive: true }); spy();
  }

  // Menu mobile : se referme au choix d'un lien
  $$(".mn-mob-panel a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details.mn-mob"); if (d) d.open = false; }); });

  // Onglets de blocs de code (npm / yarn / pnpm, langages), synchronisés dans la page et retenus
  function pick(fig, name) {
    var ok = false; $$("[data-tab]", fig).forEach(function (t) { if (t.getAttribute("data-tab") === name) ok = true; }); if (!ok) return false;
    $$("[data-tab]", fig).forEach(function (t) { var on = t.getAttribute("data-tab") === name; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); t.setAttribute("tabindex", on ? "0" : "-1"); });
    $$("[data-panel]", fig).forEach(function (p) { p.classList.toggle("mn-off", p.getAttribute("data-panel") !== name); });
    return true;
  }
  function choose(fig, name) { var g = fig.getAttribute("data-sync"); (g ? $$("[data-sync='" + g + "']") : [fig]).forEach(function (f) { pick(f, name); }); if (g) store.set("mn-" + g, name); }
  $$("[data-code]").forEach(function (fig) {
    var g = fig.getAttribute("data-sync"), saved = g && store.get("mn-" + g); if (saved) pick(fig, saved); else { var on = fig.querySelector("[data-tab].is-on"); if (on) pick(fig, on.getAttribute("data-tab")); }
    var tabs = $$("[data-tab]", fig);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function (ev) { ev.preventDefault(); choose(fig, t.getAttribute("data-tab")); });
      t.addEventListener("keydown", function (ev) { var n = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (!n) return; ev.preventDefault(); var x = tabs[(i + n + tabs.length) % tabs.length]; x.focus(); choose(fig, x.getAttribute("data-tab")); });
    });
    $$(".mn-pre", fig).forEach(function (p) { p.setAttribute("tabindex", "0"); p.setAttribute("role", "region"); p.setAttribute("aria-label", "Code : " + ((fig.querySelector(".mn-file") || {}).textContent || "exemple")); });
    // Bouton « Copier »
    var bar = fig.querySelector(".mn-bar"), btn = document.createElement("button");
    btn.type = "button"; btn.className = "mn-copy"; btn.textContent = "Copier"; btn.setAttribute("aria-label", "Copier le code dans le presse-papiers"); bar.appendChild(btn);
    var timer;
    btn.addEventListener("click", function () {
      var pre = fig.querySelector(".mn-pre:not(.mn-off)"); if (!pre) return; var txt = pre.textContent.replace(/\s+$/, "");
      function ok() { btn.textContent = "Copié"; btn.classList.add("is-done"); say("Code copié dans le presse-papiers."); clearTimeout(timer); timer = setTimeout(function () { btn.textContent = "Copier"; btn.classList.remove("is-done"); }, 2000); }
      function fail() { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = "Sélectionné"; say("Copie impossible : le code est sélectionné, faites Ctrl+C."); clearTimeout(timer); timer = setTimeout(function () { btn.textContent = "Copier"; }, 2500); }
      function legacy() { var t = document.createElement("textarea"); t.value = txt; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;top:0;left:0;opacity:0"; document.body.appendChild(t); t.select(); var done = false; try { done = document.execCommand("copy"); } catch (e) {} document.body.removeChild(t); done ? ok() : fail(); }
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, legacy); else legacy();
    });
  });
  // Terminal du héros : curseur clignotant
  var term = document.querySelector(".mn-hero .mn-pre code"); if (term && !reduce) term.classList.add("mn-term-caret");

  // Filtres (API : fonctions / options / hooks ; journal : ajouts / correctifs / ruptures)
  var secs = $$("[data-sec]"), kinds = $$("[data-kind]");
  var fil = "all", q = "";
  function visible() {
    kinds.forEach(function (k) { k.classList.toggle("mn-hide-f", fil !== "all" && k.getAttribute("data-kind") !== fil); });
    secs.forEach(function (s) {
      var own = s.hasAttribute("data-kind"), inner = $$("[data-kind]", s), hideF = false;
      if (!own && inner.length) hideF = inner.every(function (k) { return k.classList.contains("mn-hide-f"); });
      s.classList.toggle("mn-hide-f", hideF || (own && s.classList.contains("mn-hide-f")));
    });
  }
  $$("[data-filter]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault(); fil = a.getAttribute("data-filter");
      $$("[data-filter]", a.parentNode).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      visible(); say($$("[data-sec]:not(.mn-hide-f)").length + " section(s) affichée(s).");
    });
  });

  // Recherche instantanée : filtre et surligne la page, et propose les autres pages
  var box = document.querySelector("[data-search]");
  var INDEX = [["Installation", "/demarrage#installation", "npm yarn pnpm installer paquet"], ["Prérequis", "/demarrage#prerequis", "node version systeme"], ["Initialisation", "/demarrage#initialisation", "init projet configuration"], ["Première compilation", "/demarrage#premiere-compilation", "build dist sortie"], ["Mode développement", "/demarrage#mode-developpement", "watch surveillance"], ["Dépannage", "/demarrage#depannage", "erreur probleme cannot find module"], ["build(options)", "/api#build", "fonction compiler"], ["watch(options)", "/api#watch", "fonction surveiller polling"], ["defineConfig(config)", "/api#define-config", "fonction types autocompletion"], ["entry", "/api#option-entry", "option point entree"], ["outDir", "/api#option-out-dir", "option dossier sortie"], ["format", "/api#option-format", "option esm cjs iife"], ["transform", "/api#hook-transform", "hook plugin code"], ["onBuildEnd", "/api#hook-build-end", "hook rapport"], ["Étapes d'une compilation", "/guide#concepts", "pipeline concepts"], ["Résolution des modules", "/guide#resolution", "import chemin node_modules"], ["Formats de sortie", "/guide#formats", "esm cjs iife comparatif"], ["Plugins", "/guide#plugins", "hooks extension"], ["Cache", "/guide#cache", "no-cache invalidation"], ["Bonnes pratiques", "/guide#bonnes-pratiques", "faq questions"], ["Journal des versions", "/changelog", "changelog nouveautes migration"], ["Contribuer et contact", "/contact", "bogue idee documentation"]];
  if (box) {
    var inp = document.createElement("input"); inp.type = "search"; inp.placeholder = "Rechercher dans la documentation…"; inp.setAttribute("aria-label", "Rechercher dans la documentation"); inp.setAttribute("autocomplete", "off"); inp.setAttribute("enterkeyhint", "search");
    var res = document.createElement("div"); res.className = "mn-res mn-off"; res.setAttribute("role", "region"); res.setAttribute("aria-label", "Résultats de recherche");
    box.innerHTML = '<svg class="mn-sico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 16 4.5 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    box.appendChild(inp); var kb = document.createElement("kbd"); kb.textContent = "/"; kb.setAttribute("aria-hidden", "true"); box.appendChild(kb); box.appendChild(res);
    var texts = secs.map(function (s) { return fold(s.textContent); });
    var clearMarks = function () { $$("mark.mn-hit").forEach(function (m) { var p = m.parentNode; p.replaceChild(document.createTextNode(m.textContent), m); p.normalize(); }); };
    var mark = function (root, term) {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), list = [], n; while ((n = w.nextNode())) { if (n.parentNode.closest("script,style,.mn-copy,.mn-hash")) continue; if (fold(n.data).indexOf(term) > -1) list.push(n); }
      list.forEach(function (n) { var f = fold(n.data), i = 0, at, frag = document.createDocumentFragment(); while ((at = f.indexOf(term, i)) > -1) { if (at > i) frag.appendChild(document.createTextNode(n.data.slice(i, at))); var m = document.createElement("mark"); m.className = "mn-hit"; m.textContent = n.data.slice(at, at + term.length); frag.appendChild(m); i = at + term.length; } frag.appendChild(document.createTextNode(n.data.slice(i))); n.parentNode.replaceChild(frag, n); });
    };
    var run = function () {
      q = fold(inp.value.trim()); clearMarks();
      if (q.length < 2) { secs.forEach(function (s) { s.classList.remove("mn-hide-s"); }); res.classList.add("mn-off"); res.innerHTML = ""; if (!q) say(""); return; }
      var hits = [], html = "";
      secs.forEach(function (s, i) { var ok = texts[i].indexOf(q) > -1; s.classList.toggle("mn-hide-s", !ok); if (ok) { mark(s, q); var h = s.querySelector("[data-anchor]"); if (h) hits.push([h.id, (function () { var c = h.cloneNode(true); $$(".mn-hash,.mn-k,time,.mn-badge", c).forEach(function (x) { x.parentNode.removeChild(x); }); return c.textContent.trim(); })()]); } });
      var here = hits.map(function (h) { return "#" + h[0]; });
      var others = INDEX.filter(function (r) { return fold(r[0] + " " + r[2]).indexOf(q) > -1 && !(r[1].split("#")[0] === path && r[1].indexOf("#") > -1 && here.indexOf("#" + r[1].split("#")[1]) > -1); }).slice(0, 7);
      if (hits.length) html += '<p class="mn-res-h">Sur cette page</p><ul>' + hits.slice(0, 8).map(function (h) { return '<li><a href="#' + h[0] + '">' + h[1].replace(/</g, "&lt;") + "</a></li>"; }).join("") + "</ul>";
      else if (secs.length) html += "<p>Aucune section de cette page ne contient « " + inp.value.trim().replace(/</g, "&lt;") + " ».</p>";
      if (others.length) html += '<p class="mn-res-h">Dans la documentation</p><ul>' + others.map(function (r) { return '<li><a href="' + r[1] + '">' + r[0].replace(/</g, "&lt;") + "<small>" + r[1] + "</small></a></li>"; }).join("") + "</ul>";
      if (!hits.length && !others.length) html = "<p>Aucun résultat. Essayez un autre mot, ou ouvrez la <a href='/recherche'>page de recherche</a>.</p>";
      res.innerHTML = html; res.classList.remove("mn-off");
      say(hits.length + " section(s) sur cette page, " + others.length + " autre(s) page(s) suggérée(s).");
    };
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { inp.value = ""; run(); }
      else if (ev.key === "ArrowDown") { var a = res.querySelector("a"); if (a) { ev.preventDefault(); a.focus(); } }
      else if (ev.key === "Enter") { var f = res.querySelector("a"); if (f) { ev.preventDefault(); f.click(); if (f.getAttribute("href").charAt(0) !== "#") location.href = f.getAttribute("href"); } }
    });
    res.addEventListener("keydown", function (ev) {
      var as = $$("a", res), i = as.indexOf(document.activeElement);
      if (ev.key === "ArrowDown" && i < as.length - 1) { ev.preventDefault(); as[i + 1].focus(); } else if (ev.key === "ArrowUp") { ev.preventDefault(); (i > 0 ? as[i - 1] : inp).focus(); } else if (ev.key === "Escape") { inp.focus(); }
    });
    res.addEventListener("click", function (ev) { var a = ev.target.closest("a"); if (a && a.getAttribute("href").charAt(0) === "#") res.classList.add("mn-off"); });
    document.addEventListener("click", function (ev) { if (!box.contains(ev.target)) res.classList.add("mn-off"); });
    inp.addEventListener("focus", function () { if (res.innerHTML && q.length > 1) res.classList.remove("mn-off"); });
    document.addEventListener("keydown", function (ev) { if (ev.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || "")) { ev.preventDefault(); inp.focus(); inp.select(); } });
  }

  // Compteurs de la page d'accueil
  var cs = $$("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target); var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (reduce || isNaN(to) || to < 2) return;
      var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }
})();

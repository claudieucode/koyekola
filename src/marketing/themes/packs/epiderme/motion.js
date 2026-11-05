/* Épiderme — panier de routine, filtres, fiches, diagnostic et apparitions douces. Aucune dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "epiderme") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  b.classList.add("ep-js");
  function on(el, fn) { el.addEventListener("click", function (e) { e.preventDefault(); fn(el, e); }); el.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); fn(el, e); } }); }

  /* apparitions */
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("ep-rv");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  /* parallaxe macro du hero */
  var hero = $("[data-hero]");
  if (hero && !reduce) {
    var raf = 0, tx = 0, ty = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; hero.style.setProperty("--mx", tx.toFixed(3)); hero.style.setProperty("--my", ty.toFixed(3)); });
    });
  }

  /* compteurs */
  $$("[data-count]").forEach(function (el) {
    var n = +el.getAttribute("data-count"); if (reduce || !n || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var t0 = performance.now(); (function f(t) { var k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); });
    el.textContent = "0"; o.observe(el);
  });

  /* panier de routine (fictif, stocké dans le navigateur) */
  var KEY = "ep-routine", cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]").filter(function (x) { return x && x.id; }); } catch (e) { cart = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }
  function has(id) { return cart.some(function (x) { return x.id === id; }); }
  function render() {
    $$("[data-cart-n]").forEach(function (n) { n.textContent = cart.length; });
    $$("[data-cart-list]").forEach(function (ul) {
      ul.innerHTML = "";
      cart.forEach(function (x) { var li = document.createElement("li"), s = document.createElement("span"), a = document.createElement("a"); s.textContent = x.name; a.href = "#retirer"; a.textContent = "×"; a.setAttribute("aria-label", "Retirer " + x.name); a.setAttribute("data-rm", x.id); li.appendChild(s); li.appendChild(a); ul.appendChild(li); });
      var d = ul.closest(".ep-cart"); if (d) d.classList.toggle("has", cart.length > 0);
    });
    $$("[data-add]").forEach(function (a) { var o = has(a.getAttribute("data-add")); a.classList.toggle("is-on", o); a.setAttribute("aria-pressed", o ? "true" : "false"); });
  }
  function put(id, name) { if (!has(id)) cart.push({ id: id, name: name }); }
  document.addEventListener("click", function (e) {
    var rm = e.target.closest && e.target.closest("[data-rm]");
    if (rm) { e.preventDefault(); var id = rm.getAttribute("data-rm"); cart = cart.filter(function (x) { return x.id !== id; }); save(); render(); }
  });
  $$("[data-add]").forEach(function (a) { on(a, function () { var id = a.getAttribute("data-add"); if (has(id)) cart = cart.filter(function (x) { return x.id !== id; }); else put(id, a.getAttribute("data-name")); save(); render(); }); });
  render();
  /* fermeture des tiroirs */
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") $$(".ep-cart[open],.ep-menu[open]").forEach(function (d) { d.removeAttribute("open"); var s = d.querySelector("summary"); if (s) s.focus(); }); });
  document.addEventListener("click", function (e) { $$(".ep-cart[open],.ep-menu[open]").forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute("open"); }); });

  /* filtres (catalogue, glossaire, journal) */
  $$("[data-filter-grid]").forEach(function (grid) {
    var wrap = grid.closest(".pk-bleed") || document, chips = $$("[data-filter]", wrap), cnt = $("[data-filter-count]", wrap), items = $$("[data-cat]", grid);
    var word = cnt ? cnt.textContent.replace(/^\d+\s*/, "").replace(/ affich.*$/, "") : "", fem = cnt && /ées?$/.test(cnt.textContent);
    chips.forEach(function (c) { on(c, function () {
      var f = c.getAttribute("data-filter"), n = 0;
      chips.forEach(function (x) { var s = x === c; x.classList.toggle("is-on", s); x.setAttribute("aria-pressed", s ? "true" : "false"); });
      items.forEach(function (it) { var ok = f === "*" || it.getAttribute("data-cat") === f; it.classList.toggle("is-off", !ok); if (ok) { n++; it.classList.add("is-in"); } });
      if (cnt) cnt.textContent = n + " " + (n > 1 ? word : word.replace(/s$/, "")) + " affiché" + (fem ? "e" : "") + (n > 1 ? "s" : "");
    }); });
  });

  /* fiches produit : choix par ancre */
  var fiches = $$("[data-fiche]");
  if (fiches.length) {
    var picks = $$("[data-pick]");
    var show = function (id, focus) {
      if (!fiches.some(function (f) { return f.getAttribute("data-fiche") === id; })) id = fiches[0].getAttribute("data-fiche");
      fiches.forEach(function (f) { f.classList.toggle("is-on", f.getAttribute("data-fiche") === id); });
      picks.forEach(function (p) { var s = p.getAttribute("data-pick") === id; p.classList.toggle("is-on", s); p.setAttribute("aria-pressed", s ? "true" : "false"); });
    };
    picks.forEach(function (p) { on(p, function () { var id = p.getAttribute("data-pick"); show(id); try { history.replaceState(null, "", "#" + id); } catch (e) {} }); });
    show((location.hash || "").slice(1));
    window.addEventListener("hashchange", function () { show((location.hash || "").slice(1)); });
  }

  /* diagnostic de routine */
  var q = $("[data-quiz]");
  if (q) {
    var steps = $$(".ep-step", q), prog = $$("[data-p]", q), live = $("[data-live]", q), cur = 1, ans = { skin: "", needs: [], avoid: [], habit: "" };
    var pool = $$(".ep-poolul li").map(function (li) { return { id: li.getAttribute("data-id"), name: li.getAttribute("data-name"), slot: li.getAttribute("data-slot"), skin: li.getAttribute("data-skin").split(" "), need: li.getAttribute("data-need").split(" "), flags: li.getAttribute("data-flags").split(" "), when: li.getAttribute("data-when") }; });
    var KEYS = ["skin", "needs", "avoid", "habit"], LAB = { seche: "sèche", normale: "équilibrée", mixte: "mixte", grasse: "brillante", hydra: "hydratation", eclat: "teint lumineux", confort: "confort", mat: "fini mat", grain: "toucher lisse", acide: "sans acides", huile: "sans huiles ni beurres", parfum: "sans parfum", express: "express (2 min)", classique: "classique (5 min)", complete: "complète (10 min)" };
    var summary = "";
    function lock() { var s = steps[cur - 1], nx = $("[data-next]", s); if (!nx) return; var ok = cur === 1 ? !!ans.skin : cur === 4 ? !!ans.habit : cur === 2 ? ans.needs.length > 0 : true; nx.classList.toggle("is-lock", !ok); nx.setAttribute("aria-disabled", ok ? "false" : "true"); }
    function go(n, focus) {
      cur = n; steps.forEach(function (s, i) { s.classList.toggle("is-on", i === n - 1); });
      prog.forEach(function (p, i) { p.classList.toggle("is-on", i === n - 1); p.classList.toggle("is-done", i < n - 1); if (i === n - 1) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current"); });
      if (live) live.textContent = "Étape " + n + " sur 5";
      if (n === 5) result();
      lock();
      if (focus) { var h = $("h2", steps[n - 1]); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); } q.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
    }
    steps.forEach(function (s, i) {
      var key = KEYS[i], multi = $(".ep-opts", s) && $(".ep-opts", s).getAttribute("data-multi") === "1";
      $$(".ep-opt", s).forEach(function (o) { on(o, function () {
        var v = o.getAttribute("data-v"), opts = $$(".ep-opt", s);
        if (!multi) { opts.forEach(function (x) { x.setAttribute("aria-checked", x === o ? "true" : "false"); }); ans[key] = v; }
        else {
          var list = ans[key], k = list.indexOf(v);
          if (k > -1) list.splice(k, 1); else if (key === "needs" && list.length >= 2) { if (live) live.textContent = "Deux envies au maximum : décochez-en une."; return; } else list.push(v);
          opts.forEach(function (x) { x.setAttribute("aria-checked", list.indexOf(x.getAttribute("data-v")) > -1 ? "true" : "false"); });
        }
        lock();
      }); });
      var nx = $("[data-next]", s), pv = $("[data-prev]", s);
      if (nx) on(nx, function () { if (nx.classList.contains("is-lock")) { if (live) live.textContent = "Faites un choix pour continuer."; return; } go(cur + 1, true); });
      if (pv) on(pv, function () { go(i === 4 ? 4 : cur - 1, true); });
    });
    function pick(slot, skip, need) {
      var c = pool.filter(function (p) { return p.slot === slot && p.skin.indexOf(ans.skin) > -1 && !p.flags.some(function (f) { return ans.avoid.indexOf(f) > -1; }) && skip.indexOf(p.id) < 0; });
      if (need) { var m = c.filter(function (p) { return p.need.indexOf(need) > -1; }); if (m.length) return m[0]; }
      return c[0];
    }
    function pickClean(pm) {
      if (ans.skin === "seche" && ans.avoid.indexOf("huile") < 0 && pm) return pool.filter(function (p) { return p.id === "baume-fondant"; })[0];
      return pool.filter(function (p) { return p.id === (ans.skin === "mixte" || ans.skin === "grasse" ? "mousse-perle" : "gel-rosee"); })[0];
    }
    function pickCream() { var id = ans.skin === "seche" ? (ans.avoid.indexOf("huile") > -1 ? "creme-nuage" : "creme-cocon") : ans.skin === "grasse" ? "gelee-fraiche" : ans.skin === "mixte" ? (ans.needs.indexOf("mat") > -1 ? "gelee-fraiche" : "creme-nuage") : "creme-nuage"; return pool.filter(function (p) { return p.id === id; })[0]; }
    function fill(sel, list) { var ol = $(sel, q); ol.innerHTML = ""; list.forEach(function (p) { if (!p) return; var li = document.createElement("li"), a = document.createElement("a"), t = document.createElement("span"); a.href = "/produit#" + p.id; a.textContent = p.name; t.appendChild(a); var s = document.createElement("small"); s.textContent = p.when; t.appendChild(s); li.appendChild(t); ol.appendChild(li); }); }
    var all = [];
    function result() {
      var n1 = ans.needs[0] || "hydra", n2 = ans.needs[1], s1 = pick("serum", [], n1), s2 = n2 ? pick("serum", [s1 && s1.id], n2) : null, h = ans.habit, am, pm;
      if (s1 && s1.when.indexOf("Soir") === 0 && n1 === "grain") s1 = pick("serum", [s1.id], n1) || s1;
      var sAm = s1 && s1.when.indexOf("Soir") === 0 ? (pick("serum", [s1.id], n2 || "hydra") || pick("serum", [], "hydra")) : s1, sPm = s1 && s1.when === "Matin" ? s1 : s1;
      var cl = pickClean(false), clp = pickClean(true), cr = pickCream(), mk = pick("mask", [], null);
      if (h === "express") { am = [cr]; pm = [clp, cr]; }
      else { am = [cl, sAm, cr]; pm = [clp, h === "complete" && s2 && s2.id !== (sAm && sAm.id) ? s2 : (s1 && s1.when !== "Matin" ? s1 : null) || sAm, cr]; if (s1 && s1.when.indexOf("Soir") === 0 && h === "classique") pm[1] = s1; }
      pm = pm.filter(function (x, i, a) { return x && a.indexOf(x) === i; }); am = am.filter(Boolean);
      fill("[data-am]", am); fill("[data-pm]", pm);
      var wk = $("[data-weekly]", q); wk.textContent = h === "complete" && mk ? "Une à deux fois par semaine : " + mk.name + " (" + mk.when.toLowerCase() + ")." : "";
      all = am.concat(pm).concat(h === "complete" && mk ? [mk] : []).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var av = ans.avoid.map(function (x) { return LAB[x]; });
      summary = "Peau " + LAB[ans.skin] + " · envies : " + ans.needs.map(function (x) { return LAB[x]; }).join(", ") + (av.length ? " · " + av.join(", ") : "") + " · routine " + LAB[ans.habit] + ".\nMatin : " + am.map(function (p) { return p.name; }).join(" → ") + ".\nSoir : " + pm.map(function (p) { return p.name; }).join(" → ") + "." + (wk.textContent ? "\n" + wk.textContent : "");
      $("[data-sum]", q).textContent = "Peau " + LAB[ans.skin] + ", envies : " + ans.needs.map(function (x) { return LAB[x]; }).join(" et ") + (av.length ? ", " + av.join(", ") : "") + ", routine " + LAB[ans.habit] + ".";
    }
    var ad = $("[data-addall]", q), cp = $("[data-copy]", q);
    if (ad) on(ad, function () { all.forEach(function (p) { put(p.id, p.name); }); save(); render(); if (live) live.textContent = all.length + " formules ajoutées à votre routine."; });
    if (cp) on(cp, function () {
      var done = function (m) { if (live) live.textContent = m; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(summary).then(function () { done("Résumé copié : collez-le dans le formulaire de contact."); }, function () { done("Copie impossible : sélectionnez le texte à la main."); });
      else done("Copie impossible : sélectionnez le texte à la main.");
    });
    go(1, false);
  }
})();

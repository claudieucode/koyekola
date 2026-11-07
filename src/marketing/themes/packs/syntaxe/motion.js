// Syntaxe — comportements du thème : bouton « Copier » des blocs de code, filtres et tri des archives (conservés dans l'adresse), sommaire flottant qui suit la lecture,
// progression de lecture et bascule d'article de démonstration. Aucune dépendance ; tout est facultatif (sans script, la page reste lisible).
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "syntaxe") return;
  var body = document.body;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ----- révélation douce -----
  if (!calm && "IntersectionObserver" in window) {
    body.classList.add("sx-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (n) { if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in"); else io.observe(n); });
    setTimeout(function () { $$("[data-reveal]").forEach(function (n) { n.classList.add("is-in"); }); }, 2500);
  }

  // ----- message discret -----
  var tt;
  function toast(msg) {
    var t = $(".sx-toast");
    if (!t) { t = document.createElement("div"); t.className = "sx-toast"; t.setAttribute("role", "status"); body.appendChild(t); }
    t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 2200);
  }

  // ----- copier le code -----
  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else fallback();
    function fallback() {
      var a = document.createElement("textarea"); a.value = text; a.setAttribute("readonly", ""); a.style.cssText = "position:fixed;opacity:0;top:0";
      body.appendChild(a); a.select(); try { document.execCommand("copy"); done(); } catch (e) { toast("Copie impossible : sélectionnez le code à la main"); } body.removeChild(a);
    }
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-copy-code]");
    if (b) {
      ev.preventDefault();
      var pre = $("pre", b.closest("figure"));
      var label = $("span", b), old = label.textContent;
      copyText(pre.textContent.replace(/\n$/, ""), function () { b.classList.add("is-ok"); label.textContent = "Copié ✓"; toast("Code copié dans le presse-papiers"); setTimeout(function () { b.classList.remove("is-ok"); label.textContent = old; }, 2000); });
      return;
    }
    var top = ev.target.closest && ev.target.closest("[data-top]");
    if (top) { ev.preventDefault(); window.scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" }); }
  });

  // ----- filtres et tri (archives, extraits) -----
  var filters = $("[data-filters]");
  var listEl = $("[data-list]");
  if (filters && listEl) {
    var items = $$(".sx-item, .sx-snip-c");
    var state = { cat: "", tag: "", lang: "", sort: "date" };
    var empty = $("[data-empty]"), count = $("[data-count]");
    var attrOf = { cat: "cat", tag: "tag", lang: "lang" };
    var readHash = function () {
      var h = decodeURIComponent((location.hash || "").slice(1));
      state.cat = state.tag = state.lang = "";
      if (!h) return;
      if (h.indexOf("t-") === 0) state.tag = h; else if (h !== "tous" && $("[data-cat='" + h + "']", filters)) state.cat = h; else if (h !== "tous" && $("[data-lang='" + h + "']", filters)) state.lang = h;
    };
    var apply = function () {
      var shown = 0;
      items.forEach(function (n) {
        var ok = (!state.cat || n.getAttribute("data-cat") === state.cat) && (!state.tag || (" " + (n.getAttribute("data-tags") || "") + " ").indexOf(" " + state.tag + " ") > -1) && (!state.lang || n.getAttribute("data-lang") === state.lang);
        n.hidden = !ok; if (ok) shown++;
      });
      $$("[data-cat],[data-tag],[data-lang]", filters).forEach(function (c) {
        var k = c.hasAttribute("data-cat") ? "cat" : c.hasAttribute("data-tag") ? "tag" : "lang";
        var cv = c.getAttribute("data-" + k) || ""; var on = (cv === "tous" ? "" : cv) === state[k];
        c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      $$("[data-sort]", filters).forEach(function (c) { var on = c.getAttribute("data-sort") === state.sort; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      var cmp = state.sort === "min" ? function (a, b) { return a.getAttribute("data-min") - b.getAttribute("data-min") || a.getAttribute("data-n") - b.getAttribute("data-n"); } : function (a, b) { return a.getAttribute("data-n") - b.getAttribute("data-n"); };
      items.slice().sort(cmp).forEach(function (n) { n.parentNode.appendChild(n); });
      if (empty) empty.hidden = shown > 0;
      if (count) count.textContent = shown;
    };
    readHash(); apply();
    filters.addEventListener("click", function (ev) {
      var c = ev.target.closest && ev.target.closest(".sx-chip"); if (!c) return;
      ev.preventDefault();
      if (c.hasAttribute("data-sort")) state.sort = c.getAttribute("data-sort");
      else { var k = c.hasAttribute("data-cat") ? "cat" : c.hasAttribute("data-tag") ? "tag" : "lang"; var v = c.getAttribute("data-" + k) || ""; if (v === "tous") v = ""; state.cat = state.tag = state.lang = ""; state[k] = v; try { history.replaceState(null, "", v ? "#" + v : location.pathname + location.search); } catch (e) {} }
      apply();
    });
    window.addEventListener("hashchange", function () { readHash(); apply(); });
  }

  // ----- article : sommaire, progression et bascule d'article de démonstration -----
  var bodyEl = $("[data-body]");
  if (bodyEl) {
    var toc = $("[data-toc]"), bar = $("[data-prog]");
    var store = $("[data-data]");
    var original = bodyEl.innerHTML;
    var spy = null;
    var setIds = function () { $$("[data-anchor]", bodyEl).forEach(function (h) { h.id = h.getAttribute("data-anchor"); }); };
    var track = function () {
      if (spy) spy.disconnect();
      var hs = $$("[data-anchor]", bodyEl);
      if (!hs.length || !("IntersectionObserver" in window)) return;
      spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { $$("[data-toc-l]", toc).forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-toc-l") === e.target.getAttribute("data-anchor")); }); } });
      }, { rootMargin: "-10% 0px -75% 0px" });
      hs.forEach(function (h) { spy.observe(h); });
    };
    var show = function (slug) {
      var src = slug && store ? $("[data-slug='" + slug + "']", store) : null;
      var t = $("[data-a-title]"), l = $("[data-a-lead]"), m = $("[data-a-meta]"), c = $("[data-a-cat]");
      if (src) {
        bodyEl.innerHTML = src.innerHTML; t.textContent = src.getAttribute("data-title"); l.textContent = src.getAttribute("data-lead"); m.textContent = src.getAttribute("data-meta");
        c.textContent = src.getAttribute("data-catl").toLowerCase(); c.setAttribute("href", "/articles#" + src.getAttribute("data-cat"));
        if (toc) toc.hidden = true; document.title = src.getAttribute("data-title");
      } else if (bodyEl.getAttribute("data-swapped")) { location.reload(); return; }
      if (src) bodyEl.setAttribute("data-swapped", "1");
      else { setIds(); track(); }
    };
    var slugOf = function () { var h = decodeURIComponent((location.hash || "").slice(1)); return h && store && $("[data-slug='" + h + "']", store) ? h : ""; };
    setIds();
    if (slugOf()) { show(slugOf()); window.scrollTo(0, 0); } else track();
    window.addEventListener("hashchange", function () { var s = slugOf(); if (s) { show(s); window.scrollTo(0, 0); } });
    document.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("[data-toc-l]"); if (!a) return;
      ev.preventDefault(); var h = document.getElementById(a.getAttribute("data-toc-l")); if (h) h.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    });
    if (bar) {
      var upd = function () { var r = bodyEl.getBoundingClientRect(), tot = r.height - window.innerHeight * .6; bar.style.width = Math.max(0, Math.min(100, (-r.top / Math.max(tot, 1)) * 100)) + "%"; };
      window.addEventListener("scroll", upd, { passive: true }); upd();
    }
  }
})();

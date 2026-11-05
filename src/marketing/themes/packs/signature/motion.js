/* Signature — filtres, bascule liste/vignettes, fiche projet en panneau, CV imprimable, indicateur de menu, ratures et surligneur. Sans dépendance ; mouvement réduit respecté. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "signature") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  b.classList.add("sg-ui");

  // Hauteur de l'en-tête (menu mobile)
  var head = $(".sg-head");
  function sizeHead() { if (head) b.style.setProperty("--sg-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);

  // Menu : page courante + indicateur glissant
  var navEl = $(".sg-nav"), ind = $(".sg-ind");
  if (navEl) {
    var links = $$("a", navEl), path = location.pathname.replace(/\/+$/, "") || "/", cur = null;
    links.forEach(function (a) {
      var h = (a.getAttribute("href") || "").replace(/\/+$/, "") || "/";
      if (path === h || (h !== "/" && path.slice(-h.length) === h) || (h === "/" && /\/demo\/accueil$|\/demo$/.test(path))) { a.setAttribute("aria-current", "page"); cur = a; }
    });
    var moveTo = function (a) {
      if (!ind) return;
      if (!a) { ind.style.opacity = "0"; return; }
      var r = a.getBoundingClientRect(), n = navEl.getBoundingClientRect();
      ind.style.opacity = "1"; ind.style.width = r.width + "px"; ind.style.transform = "translateX(" + (r.left - n.left) + "px)";
    };
    links.forEach(function (a) { a.addEventListener("mouseenter", function () { moveTo(a); }); a.addEventListener("focus", function () { moveTo(a); }); });
    navEl.addEventListener("mouseleave", function () { moveTo(cur); });
    navEl.addEventListener("focusout", function () { moveTo(cur); });
    window.addEventListener("resize", function () { moveTo(cur); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveTo(cur); });
    moveTo(cur);
  }

  // Apparition au défilement, ratures et surligneur
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("sg-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 4, 3) * 80 + "ms"; io.observe(el); });
  }

  // Filtres génériques : [data-fscope] > liens [data-fg][data-fv] et éléments [data-fitem] portant data-<groupe>
  $$("[data-fscope]").forEach(function (scope) {
    var state = {}, items = $$("[data-fitem]", scope), cnt = $("[data-fcount]", scope), empty = $("[data-fempty]", scope), countBox = cnt && cnt.parentNode;
    var chips = $$("[data-fg]", scope);
    function apply() {
      var shown = 0, active = false;
      Object.keys(state).forEach(function (g) { if (state[g] !== "all") active = true; });
      items.forEach(function (it) {
        var ok = Object.keys(state).every(function (g) { var v = state[g]; if (v === "all") return true; return (it.getAttribute("data-" + g) || "").split(" ").indexOf(v) > -1; });
        it.classList.toggle("sg-off", !ok); if (ok) shown++;
      });
      chips.forEach(function (c) { var on = (state[c.getAttribute("data-fg")] || "all") === c.getAttribute("data-fv"); c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (cnt) cnt.textContent = shown;
      if (countBox) countBox.classList.toggle("is-filtered", active);
      if (empty) empty.classList.toggle("is-on", shown === 0);
    }
    chips.forEach(function (c) { state[c.getAttribute("data-fg")] = "all"; });
    scope.addEventListener("click", function (e) {
      var c = e.target.closest ? e.target.closest("[data-fg],[data-freset]") : null; if (!c || !scope.contains(c)) return;
      e.preventDefault();
      if (c.hasAttribute("data-freset")) Object.keys(state).forEach(function (g) { state[g] = "all"; });
      else state[c.getAttribute("data-fg")] = c.getAttribute("data-fv");
      apply();
    });
    // Compteur initial honnête : on compte les éléments filtrables de premier niveau
    apply();
  });

  // Bascule liste / vignettes
  $$("[data-view]").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var scope = btn.closest("[data-fscope]") || document, list = $("[data-fitems]", scope); if (!list) return;
      var grid = btn.getAttribute("data-view") === "grid";
      list.classList.toggle("sg-view-grid", grid); list.classList.toggle("sg-view-list", !grid);
      $$("[data-view]", scope).forEach(function (o) { var on = o === btn; o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", on ? "true" : "false"); });
    });
  });

  // Fiche projet en panneau
  var panel = $(".sg-panel"), scrim = $(".sg-scrim"), body = panel && $("[data-panel-body]", panel), opener = null;
  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; }
  function openPanel(art, from) {
    if (!panel || !body) return;
    opener = from; body.textContent = "";
    var th = $(".sg-th", art); if (th) body.appendChild(th.cloneNode(true));
    body.appendChild(el("h2", "", art.getAttribute("data-title")));
    body.appendChild(el("p", "sg-hand", art.getAttribute("data-kind")));
    body.appendChild(el("p", "", art.getAttribute("data-sum")));
    var dl = el("dl"), rows = [["Discipline", "data-disc"], ["Année", null], ["Technologies", "data-techs"], ["Mon rôle", "data-role"], ["Résultat", "data-res"]];
    rows.forEach(function (r) { var d = el("div"), v = r[1] ? art.getAttribute(r[1]) : art.getAttribute("data-y"); d.appendChild(el("dt", "", r[0])); d.appendChild(el("dd", "", v)); dl.appendChild(d); });
    body.appendChild(dl);
    var a = el("a", "sg-btn", "Lire l'étude de cas"); a.href = "/projet"; body.appendChild(a);
    panel.setAttribute("aria-hidden", "false"); panel.classList.add("is-on"); if (scrim) scrim.classList.add("is-on"); b.classList.add("sg-lock");
    var x = $(".sg-panel-x", panel); if (x) x.focus();
  }
  function closePanel() {
    if (!panel) return; panel.classList.remove("is-on"); panel.setAttribute("aria-hidden", "true"); if (scrim) scrim.classList.remove("is-on"); b.classList.remove("sg-lock");
    if (opener) opener.focus(); opener = null;
  }
  document.addEventListener("click", function (e) {
    var t = e.target; if (!t.closest) return;
    var o = t.closest("[data-open]");
    if (o && panel) { var art = o.closest(".sg-pj"); if (art) { e.preventDefault(); openPanel(art, o); return; } }
    if (t.closest("[data-close]")) { e.preventDefault(); closePanel(); return; }
    var pr = t.closest("[data-print]"); if (pr) { e.preventDefault(); window.print(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!panel || !panel.classList.contains("is-on")) return;
    if (e.key === "Escape") { closePanel(); return; }
    if (e.key === "Tab") {
      var f = $$("a[href],summary", panel); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!panel.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  });

  // Ligne de progression de la frise du parcours (transform uniquement)
  var wrap = $(".sg-tlwrap"), fill = wrap && $(".sg-tl-fill", wrap);
  if (fill && !reduce) {
    var tick = false;
    var upd = function () {
      tick = false; var r = wrap.getBoundingClientRect(), vh = window.innerHeight || 800;
      var p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / Math.max(1, r.height)));
      fill.style.transform = "scaleY(" + p.toFixed(3) + ")";
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener("resize", upd); upd();
  } else if (fill) { fill.style.transform = "scaleY(1)"; }

  // Compteurs des résultats d'étude de cas
  var counters = $$("[data-count]");
  if (counters.length && !reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el2 = e.target, to = parseInt(el2.getAttribute("data-count"), 10), t0 = performance.now();
        (function step(t) { var k = Math.min(1, (t - t0) / 900); el2.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); })(t0);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }
})();

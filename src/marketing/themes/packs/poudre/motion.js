/* Poudre — mouvements très lents et catalogue de soins interactif. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "poudre") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Apparition douce
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("po-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = Math.min(i % 4, 3) * 140 + "ms"; io.observe(el); });
  }

  // Chiffres qui montent doucement
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
        if (reduce || isNaN(to)) { el.textContent = to + suf; return; }
        var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 2200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Menu en nappe : fermeture au clic sur un lien, à Échap ou hors de la nappe
  var menu = $(".po-menu");
  if (menu) {
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; var s = $("summary", menu); if (s) s.focus(); } });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  }
  $$("[data-scrollto]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var t = $('[data-anchor="' + a.getAttribute("href").slice(1) + '"]'); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }); });

  // ----- Catalogue de soins + « mon rituel » -----
  var cat = $(".po-cat"); var KEY = "poudre-rituel";
  function fmtDur(m) { var h = Math.floor(m / 60), r = m % 60; return h ? h + " h" + (r ? " " + (r < 10 ? "0" + r : r) : "") : m + " min"; }
  if (cat) {
    var list = $("[data-list]", cat), items = $$(".po-soin", list), empty = $("[data-empty]", cat), countEl = $("[data-n]", cat);
    var state = { cat: "all", dur: "all", sort: "order", dir: 1, sel: [] };
    var rl = $("[data-r-list]", cat), rEmpty = $("[data-r-empty]", cat), rBar = $("[data-r-bar]", cat), chip = $(".po-chipbar", cat), sendLink = $("[data-send]", cat);
    var byId = {}; items.forEach(function (li) { byId[li.getAttribute("data-id")] = li; });
    function num(li, k) { return parseInt(li.getAttribute("data-" + k), 10); }
    function durOk(m) { return state.dur === "all" || (state.dur === "short" && m <= 45) || (state.dur === "mid" && m > 45 && m < 90) || (state.dur === "long" && m >= 90); }
    function render() {
      var shown = 0;
      items.forEach(function (li) { var ok = (state.cat === "all" || li.getAttribute("data-cat") === state.cat) && durOk(num(li, "min")); li.hidden = !ok; if (ok) shown++; });
      var sorted = items.slice().sort(function (x, y) {
        if (state.sort === "nom") return x.getAttribute("data-nom").localeCompare(y.getAttribute("data-nom"), "fr") * state.dir;
        return (num(x, state.sort) - num(y, state.sort)) * state.dir;
      });
      sorted.forEach(function (li) { list.appendChild(li); });
      var n = 0; sorted.forEach(function (li) { if (!li.hidden) { n++; var s = $(".po-s-n", li); if (s) s.textContent = (n < 10 ? "0" : "") + n; } });
      countEl.textContent = shown; empty.hidden = shown !== 0;
      countEl.parentNode.lastChild.textContent = shown > 1 ? " soins affichés" : " soin affiché";
    }
    function group(attr, key) {
      $$("[" + attr + "]", cat).forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault(); var v = a.getAttribute(attr);
          if (key === "sort") { if (state.sort === v && v !== "order") state.dir = -state.dir; else { state.sort = v; state.dir = 1; } $$("[data-sort]", cat).forEach(function (x) { var on = x.getAttribute("data-sort") === state.sort; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); }
          else { state[key] = v; $$("[" + attr + "]", cat).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); }); }
          render();
        });
      });
    }
    group("data-fcat", "cat"); group("data-fdur", "dur"); group("data-sort", "sort");

    function summary() {
      var m = 0, p = 0, lines = [];
      state.sel.forEach(function (id) { var li = byId[id]; m += num(li, "min"); p += num(li, "prix"); lines.push("- " + li.getAttribute("data-nom") + " (" + num(li, "min") + " min, " + num(li, "prix") + " €)"); });
      return { m: m, p: p, text: "Mon rituel (démonstration) :\n" + lines.join("\n") + "\nDurée totale : " + fmtDur(m) + " · Total indicatif : " + p + " €" };
    }
    function paint() {
      var s = summary(), n = state.sel.length;
      rl.innerHTML = ""; rBar.innerHTML = "";
      state.sel.forEach(function (id) {
        var li = byId[id], r = document.createElement("li"); r.innerHTML = "<strong></strong><span></span>";
        r.firstChild.textContent = li.getAttribute("data-nom"); r.lastChild.textContent = num(li, "min") + " min · " + num(li, "prix") + " €"; rl.appendChild(r);
        var seg = document.createElement("i"); seg.style.flexGrow = num(li, "min"); rBar.appendChild(seg);
      });
      rEmpty.hidden = n > 0;
      $$("[data-r='dur']", cat).forEach(function (e) { e.textContent = fmtDur(s.m); }); $$("[data-r='prix']", cat).forEach(function (e) { e.textContent = s.p + " €"; });
      $$("[data-r='n']", cat).forEach(function (e) { e.textContent = n; }); if (chip) { chip.hidden = n === 0; chip.childNodes[1].textContent = n > 1 ? " soins · " : " soin · "; }
      items.forEach(function (li) { var on = state.sel.indexOf(li.getAttribute("data-id")) >= 0; li.classList.toggle("is-picked", on); var a = $("[data-add]", li); a.setAttribute("aria-pressed", on ? "true" : "false"); });
      try { sessionStorage.setItem(KEY, n ? s.text : ""); } catch (e) {}
    }
    $$("[data-add]", cat).forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); var id = a.getAttribute("data-add"), i = state.sel.indexOf(id); if (i >= 0) state.sel.splice(i, 1); else state.sel.push(id); paint(); });
      a.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); a.click(); } });
    });
    var clr = $("[data-clear]", cat); if (clr) clr.addEventListener("click", function (e) { e.preventDefault(); state.sel = []; paint(); });
    if (chip) chip.addEventListener("click", function (e) { e.preventDefault(); var r = $("[data-ritual]", cat); if (r) r.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    if (sendLink) sendLink.addEventListener("click", function (e) { if (!state.sel.length) { e.preventDefault(); rEmpty.focus && rEmpty.focus(); rEmpty.textContent = "Ajoutez d'abord au moins un soin à votre rituel."; rEmpty.hidden = false; } });
    render(); paint();
  }

  // Contact : le résumé du rituel est déjà dans le message
  if (!cat) {
    var saved = ""; try { saved = sessionStorage.getItem(KEY) || ""; } catch (e) {}
    var tries = 0;
    (function fill() {
      var area = $(".lp-main textarea");
      if (!area) { if (saved && tries++ < 20) setTimeout(fill, 250); return; }
      if (saved && !area.value) {
        area.value = saved + "\n\n"; area.dispatchEvent(new Event("input", { bubbles: true }));
        var note = document.createElement("p"); note.className = "po-rec-note"; note.setAttribute("role", "status"); note.textContent = "Votre rituel composé dans le catalogue a été ajouté au message ci-dessous.";
        var f = area.closest("form"); if (f && f.parentNode) f.parentNode.insertBefore(note, f);
      }
    })();
  }
})();

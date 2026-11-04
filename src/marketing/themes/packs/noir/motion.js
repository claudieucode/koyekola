/* Maison Noir — lettres qui apparaissent, parallaxe très douce, lookbook, filtres et pastilles. Sans dépendance ; simplifié si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "noir") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var smooth = reduce ? "auto" : "smooth";

  // Menu plein écran : défilement de la page verrouillé, fermeture au clavier ou au clic sur un lien
  var menu = document.querySelector(".nr-menu");
  if (menu) {
    menu.addEventListener("toggle", function () { b.classList.toggle("nr-lock", menu.open); });
    $$(".nr-ov a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; var s = menu.querySelector("summary"); if (s) s.focus(); } });
  }

  // Lettres / mots : découpe des titres (texte conservé pour les lecteurs d'écran)
  function split(el, mode) {
    var idx = 0;
    var label = el.textContent.replace(/\s+/g, " ").trim();
    if (el.getAttribute("role") === "heading") el.setAttribute("aria-label", label);
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "nr-wd"; w.setAttribute("aria-hidden", "true");
            if (mode === "w") { w.style.setProperty("--i", idx++); w.textContent = part; }
            else Array.prototype.forEach.call(part, function (ch) { var c = document.createElement("span"); c.className = "nr-ch"; c.style.setProperty("--i", idx++); c.textContent = ch; w.appendChild(c); });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    }
    walk(el);
  }

  if (!reduce && "IntersectionObserver" in window) {
    $$("[data-split]").forEach(function (el) { split(el, el.getAttribute("data-split")); });
    b.classList.add("nr-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.1 });
    $$("[data-reveal],[data-split]").forEach(function (el) { io.observe(el); });
  }

  // Parallaxe très légère (transform uniquement), coupée par l'option ou le mouvement réduit
  var pars = $$("[data-par]"), ticking = false;
  function par() {
    ticking = false;
    var off = b.getAttribute("data-pk-parallaxe") === "off" || window.innerWidth < 761, vh = window.innerHeight;
    pars.forEach(function (el) {
      if (off) { el.style.transform = ""; return; }
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var d = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute("data-par"));
      el.style.transform = "translate3d(0," + Math.max(-40, Math.min(40, d)).toFixed(1) + "px,0)";
    });
  }
  if (pars.length && !reduce) {
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(par); } }, { passive: true });
    window.addEventListener("resize", par); par();
  }

  // Compteurs chiffrés
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (reduce || isNaN(to)) return;
        var t0 = null; requestAnimationFrame(function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); });
      });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Lookbook : compteur 01/12, flèches, clavier
  $$("[data-rail]").forEach(function (rail) {
    var scope = rail.closest("section"), cur = scope.querySelector("[data-cur]"), tot = scope.querySelector("[data-tot]"), prog = scope.querySelector("[data-prog]");
    var items = Array.prototype.slice.call(rail.children); if (tot) tot.textContent = (items.length < 10 ? "0" : "") + items.length;
    rail.setAttribute("tabindex", "0");
    function pad() { return parseFloat(getComputedStyle(rail).paddingLeft) || 0; }
    function index() {
      var x = rail.scrollLeft, best = 0, bd = 1e9;
      items.forEach(function (it, i) { var d = Math.abs(it.offsetLeft - rail.offsetLeft - pad() - x); if (d < bd) { bd = d; best = i; } });
      if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) best = items.length - 1;
      return best;
    }
    function upd() { var i = index(); if (cur) cur.textContent = (i < 9 ? "0" : "") + (i + 1); if (prog) prog.style.transform = "scaleX(" + ((i + 1) / items.length).toFixed(3) + ")"; }
    function go(dir) { var i = Math.max(0, Math.min(items.length - 1, index() + dir)); rail.scrollTo({ left: items[i].offsetLeft - rail.offsetLeft - pad(), behavior: smooth }); }
    var t = false; rail.addEventListener("scroll", function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; upd(); }); } }, { passive: true });
    $$("[data-dir]", scope).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); go(Number(a.getAttribute("data-dir"))); }); });
    rail.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); go(e.key === "ArrowRight" ? 1 : -1); } });
    window.addEventListener("resize", upd); upd();
  });

  // Collections : filtre par saison
  $$("[data-filter]").forEach(function (bar) {
    var scope = bar.closest("section"), cards = $$("[data-season]", scope), n = bar.querySelector("[data-n]");
    $$("a[data-f]", bar).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); var f = a.getAttribute("data-f"), c = 0;
        $$("a[data-f]", bar).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        cards.forEach(function (card) { var show = f === "toutes" || card.getAttribute("data-season") === f; card.classList.toggle("nr-off", !show); if (show) c++; });
        if (n) n.textContent = c;
      });
    });
  });

  // Fiches produit : pastilles de taille et de coloris (aucun panier)
  $$("[data-prod]").forEach(function (p) {
    var plate = p.querySelector(".nr-pl");
    $$("[data-opt]", p).forEach(function (g) {
      var name = g.getAttribute("data-opt"), out = p.querySelector('[data-o="' + name + '"]');
      $$("a", g).forEach(function (a) {
        a.addEventListener("click", function (e) {
          e.preventDefault();
          $$("a", g).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on ? "true" : "false"); });
          if (out) out.textContent = a.getAttribute("data-v");
          var pal = a.getAttribute("data-pal");
          if (pal && plate) plate.className = plate.className.replace(/nr-pl--\w+/, "nr-pl--" + pal);
        });
      });
    });
  });
})();

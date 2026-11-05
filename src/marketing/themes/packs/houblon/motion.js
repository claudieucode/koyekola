/* Houblon — révélations, compteurs, catalogue filtrable, radar de goût comparable, tuyau du procédé, composeur de visite. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "houblon") return;
  var R = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, fn) { el.addEventListener("click", function (e) { e.preventDefault(); fn(el, e); }); };
  var IO = "IntersectionObserver" in window;

  // Apparition au défilement
  if (!R && IO) {
    b.classList.add("hb-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Compteurs
  if (IO) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10); if (isNaN(to) || R) return;
        var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.5 });
    $("[data-count]").forEach(function (c) { co.observe(c); });
  }

  // Menu mobile : se referme au clic
  $(".hb-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  /* ---------- Radar de goût ---------- */
  function nums(s) { return String(s || "").split(",").map(Number); }
  function pts(v) { return v.map(function (x, i) { var a = -Math.PI / 2 + i * 2 * Math.PI / 5; return (100 + 66 * x / 10 * Math.cos(a)).toFixed(1) + "," + (100 + 66 * x / 10 * Math.sin(a)).toFixed(1); }).join(" "); }
  function Lab(root, scope) {
    this.root = root; this.scope = scope; this.pa = root.querySelector(".hb-pa"); this.pb = root.querySelector(".hb-pb");
    this.va = nums(root.getAttribute("data-r")); this.vb = [0, 0, 0, 0, 0]; this.slugA = root.getAttribute("data-a"); this.slugB = "";
    this.live = root.querySelector("[data-live]"); this.raf = 0;
  }
  Lab.prototype.find = function (slug) { var el = this.scope.querySelector('[data-slug="' + slug + '"]'); return el; };
  Lab.prototype.tween = function (poly, from, to, done) {
    var self = this, t0 = null; cancelAnimationFrame(poly._raf);
    if (R) { poly.setAttribute("points", pts(to)); done && done(); return; }
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 600), e = 1 - Math.pow(1 - p, 3); poly.setAttribute("points", pts(from.map(function (f, i) { return f + (to[i] - f) * e; }))); if (p < 1) poly._raf = requestAnimationFrame(step); else done && done(); }
    poly._raf = requestAnimationFrame(step);
  };
  Lab.prototype.bars = function () {
    var r = this.root; for (var i = 0; i < 5; i++) {
      r.querySelector('[data-bar-a="' + i + '"]').style.transform = "scaleX(" + this.va[i] / 10 + ")";
      r.querySelector('[data-bar-b="' + i + '"]').style.transform = "scaleX(" + (this.slugB ? this.vb[i] / 10 : 0) + ")";
      r.querySelector('[data-va="' + i + '"]').textContent = this.va[i];
      var vb = r.querySelector('[data-vb="' + i + '"]'); vb.hidden = !this.slugB; vb.textContent = this.vb[i];
    }
  };
  Lab.prototype.setA = function (el, first) {
    var from = this.va.slice(); this.va = nums(el.getAttribute("data-r")); this.slugA = el.getAttribute("data-slug");
    this.root.querySelector("[data-ka]").textContent = el.getAttribute("data-name"); this.root.querySelector("[data-kaa]").textContent = el.getAttribute("data-abv") + " %";
    this.tween(this.pa, first ? [0, 0, 0, 0, 0] : from, this.va); this.bars();
    if (this.slugB === this.slugA) this.setB(null);
    this.say();
  };
  Lab.prototype.setB = function (el) {
    var from = this.vb.slice(), w = this.root.querySelector("[data-kbw]");
    if (!el) { this.slugB = ""; this.tween(this.pb, from, [0, 0, 0, 0, 0]); w.hidden = true; this.vb = [0, 0, 0, 0, 0]; this.bars(); this.say(); return; }
    this.slugB = el.getAttribute("data-slug"); this.vb = nums(el.getAttribute("data-r"));
    w.hidden = false; this.root.querySelector("[data-kb]").textContent = el.getAttribute("data-name"); this.root.querySelector("[data-kba]").textContent = el.getAttribute("data-abv") + " %";
    this.tween(this.pb, from, this.vb); this.bars(); this.say();
  };
  var AX = ["amertume", "douceur", "fruité", "corps", "houblonnage"];
  Lab.prototype.say = function () {
    var a = this.find(this.slugA), t;
    if (!this.slugB) t = a.getAttribute("data-note");
    else {
      var bb = this.find(this.slugB), best = 0, d = 0; for (var i = 0; i < 5; i++) { var x = Math.abs(this.va[i] - this.vb[i]); if (x > d) { d = x; best = i; } }
      t = a.getAttribute("data-name") + " et " + bb.getAttribute("data-name") + " : la plus grande différence porte sur le " + AX[best] + " (" + this.va[best] + " contre " + this.vb[best] + ").";
      if (!d) t = "Deux profils identiques sur les cinq axes.";
    }
    if (this.live) this.live.textContent = t;
    this.mark();
  };
  Lab.prototype.mark = function () {
    var self = this;
    $("[data-slug]", this.scope).forEach(function (el) {
      var s = el.getAttribute("data-slug");
      if (el.classList.contains("hb-bot")) { el.classList.toggle("is-a", s === self.slugA); el.classList.toggle("is-b", s === self.slugB); }
      var c = el.querySelector ? el.querySelector("[data-cmp]") : null; if (el.hasAttribute("data-cmp")) c = el;
      if (c) c.setAttribute("aria-pressed", s === self.slugB ? "true" : "false");
    });
  };

  $("[data-lab]").forEach(function (root) {
    var scope = root.closest("[data-hb-scope]") || document, lab = new Lab(root, scope);
    var seen = false;
    root.querySelector("[data-kbw]").hidden = true; lab.bars(); lab.mark();
    function intro() { if (seen) return; seen = true; lab.tween(lab.pa, [0, 0, 0, 0, 0], lab.va); }
    if (IO && !R) { lab.pa.setAttribute("points", pts([0, 0, 0, 0, 0])); var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { intro(); o.disconnect(); } }, { threshold: 0.3 }); o.observe(root); } else seen = true;
    $("[data-pick]", scope).forEach(function (a) { on(a, function () { seen = true; lab.setA(a.closest("[data-slug]")); if (root.getBoundingClientRect().top > window.innerHeight * 0.85) root.scrollIntoView({ behavior: R ? "auto" : "smooth", block: "center" }); }); });
    $("[data-cmp]", scope).forEach(function (a) {
      on(a, function () {
        seen = true; var el = a.closest("[data-slug]"), s = el.getAttribute("data-slug");
        if (s === lab.slugA) { if (lab.live) lab.live.textContent = "Choisissez une autre bière que " + el.getAttribute("data-name") + " pour comparer."; return; }
        lab.setB(s === lab.slugB ? null : el);
      });
    });
  });

  /* ---------- Catalogue : filtres style + degré ---------- */
  $(".hb-cat").forEach(function (cat) {
    var state = { fam: "all", abv: "all" }, cards = $(".hb-bot", cat), n = cat.querySelector("[data-n]"), empty = cat.querySelector("[data-empty]"); if (empty) empty.hidden = true;
    function band(v) { return v < 5.5 ? "lo" : v <= 6.5 ? "mid" : "hi"; }
    function apply() {
      var c = 0; cards.forEach(function (card) {
        var ok = (state.fam === "all" || card.getAttribute("data-fam") === state.fam) && (state.abv === "all" || band(parseFloat(card.getAttribute("data-abv").replace(",", "."))) === state.abv);
        card.hidden = !ok; if (ok) c++;
      });
      n.textContent = c; if (empty) empty.hidden = c > 0;
    }
    $("[data-fg]", cat).forEach(function (a) {
      on(a, function () {
        var g = a.getAttribute("data-fg"); state[g] = a.getAttribute("data-fv");
        $('[data-fg="' + g + '"]', cat).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
        apply();
      });
    });
  });

  /* ---------- Tuyau du procédé ---------- */
  $("[data-proc]").forEach(function (sec) {
    var fill = sec.querySelector("[data-pipe]"), steps = $("[data-step]", sec), tick = false;
    function upd() {
      tick = false; var r = sec.getBoundingClientRect(), vh = window.innerHeight, p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / (r.height - vh * 0.1)));
      if (fill) fill.style.transform = "scaleY(" + (R ? 1 : p.toFixed(3)) + ")";
    }
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); window.addEventListener("resize", upd); upd();
  });

  /* ---------- Composeur de visite ---------- */
  $("[data-compose]").forEach(function (box) {
    var st = { f: "Visite classique", c: "Samedi", n: 4 }, send = box.querySelector("[data-send]"), pn = box.querySelector("[data-pn]");
    function txt() { return "Demande de visite : " + st.f + ", " + st.n + (st.n > 1 ? " personnes" : " personne") + ", " + st.c + "."; }
    function render() {
      pn.textContent = st.n; box.querySelector("[data-pl]").textContent = st.n > 1 ? "personnes" : "personne";
      box.querySelector("[data-rf]").textContent = st.f; box.querySelector("[data-rn]").textContent = st.n + (st.n > 1 ? " personnes" : " personne"); box.querySelector("[data-rc]").textContent = st.c;
      box.querySelector("[data-rt]").textContent = txt();
    }
    $("[data-g]", box).forEach(function (a) {
      function pick() { var g = a.getAttribute("data-g"); st[g] = a.getAttribute("data-v"); $('[data-g="' + g + '"]', box).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-checked", x === a ? "true" : "false"); }); render(); }
      on(a, pick);
      a.addEventListener("keydown", function (e) {
        if (e.key === " ") { e.preventDefault(); pick(); }
        if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowLeft") {
          var l = $('[data-g="' + a.getAttribute("data-g") + '"]', box), i = l.indexOf(a) + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1), t = l[(i + l.length) % l.length]; e.preventDefault(); t.focus(); t.click();
        }
      });
    });
    $("[data-pm]", box).forEach(function (a) { on(a, function () { st.n = Math.max(1, Math.min(20, st.n + Number(a.getAttribute("data-pm")))); render(); }); });
    var cp = box.querySelector("[data-copy]"), cm = box.querySelector("[data-cm]");
    if (cp) on(cp, function () {
      var t = txt(), done = function (ok) { cm.textContent = ok ? "Récapitulatif copié : collez-le dans le formulaire de contact." : "Copie impossible ici : recopiez la phrase du récapitulatif dans le formulaire de contact."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); }); else done(false);
    });
    if (send) send.addEventListener("click", function () { try { sessionStorage.setItem("hb-visite", txt()); } catch (e) {} });
  });
})();

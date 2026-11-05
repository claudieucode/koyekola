/* Barreau — révélation sobre, compteurs, domaines filtrables, fiche d'associé en panneau, orientation vers /contact. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "barreau") return;
  var red = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var uid = 0;
  b.classList.add("bq-js");

  // Apparition au défilement
  if (!red && "IntersectionObserver" in window) {
    b.classList.add("bq-anim");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = $("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
        if (red || isNaN(to)) { el.textContent = to + suf; return; }
        var t0 = null, from = to > 1000 ? to - 40 : 0;
        (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Mega-menu : Échap le referme
  $(".bq-has-mega").forEach(function (m) { m.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { var a = m.querySelector("a"); if (a) a.blur(); document.activeElement && document.activeElement.blur(); } }); });
  $(".bq-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Sommaire d'une page de domaine
  $("a[data-goto]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      ev.preventDefault();
      var t = document.querySelector('[data-sec="' + a.getAttribute("data-goto") + '"]'); if (!t) return;
      t.scrollIntoView({ behavior: red ? "auto" : "smooth", block: "start" });
      $("a[data-goto]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
    });
  });

  // Filtre : recherche + étiquettes (domaines, publications)
  $("[data-filter]").forEach(function (box) {
    var items = $("[data-item]", box), tags = $("a[data-tag]", box), out = box.querySelector("[data-count-out]"), empty = box.querySelector("[data-empty]"), slot = box.querySelector("[data-search-slot]");
    var noun = box.classList.contains("bq-pubs") ? ["publication", "publications"] : ["domaine", "domaines"];
    var q = "", tag = "*", inp = null;
    if (slot) {
      inp = document.createElement("input"); inp.type = "search"; inp.className = "bq-search"; inp.placeholder = "Rechercher un mot : bail, divorce, marque…"; inp.setAttribute("aria-label", "Rechercher dans la liste"); inp.autocomplete = "off";
      slot.appendChild(inp); inp.addEventListener("input", function () { q = norm(inp.value.trim()); apply(); });
    }
    items.forEach(function (it) { it.setAttribute("data-s", norm(it.textContent)); });
    function apply() {
      var n = 0;
      items.forEach(function (it) {
        var ok = (tag === "*" || (it.getAttribute("data-tags") || "").split(" ").indexOf(tag) > -1) && (!q || it.getAttribute("data-s").indexOf(q) > -1);
        it.classList.toggle("is-off", !ok); if (ok) n++;
      });
      if (out) out.textContent = n + " " + (n > 1 ? noun[1] : noun[0]);
      if (empty) empty.classList.toggle("is-off", n > 0);
    }
    tags.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); tag = a.getAttribute("data-tag");
        tags.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        apply();
      });
    });
  });

  // Fiche d'associé en panneau (dialogue accessible)
  var cards = {}; $("[data-assoc-id]").forEach(function (c) { cards[c.getAttribute("data-assoc-id")] = c; });
  var opens = $("[data-assoc-open]");
  if (opens.length) {
    var ov = document.createElement("div"); ov.className = "bq-ov";
    var pn = document.createElement("aside"); pn.className = "bq-panel"; pn.setAttribute("role", "dialog"); pn.setAttribute("aria-modal", "true"); pn.setAttribute("tabindex", "-1");
    var x = document.createElement("button"); x.type = "button"; x.className = "bq-x"; x.setAttribute("aria-label", "Fermer la fiche"); x.innerHTML = "&times;";
    var body = document.createElement("div"); pn.appendChild(x); pn.appendChild(body); b.appendChild(ov); b.appendChild(pn);
    var last = null, isOpen = false;
    var lockOthers = function (on) { Array.prototype.forEach.call(b.children, function (n) { if (n !== pn && n !== ov && n.tagName !== "SCRIPT") { if (on) n.setAttribute("inert", ""); else n.removeAttribute("inert"); } }); };
    function open(id, from) {
      var c = cards[id]; if (!c) return; last = from || document.activeElement;
      var head = c.querySelector(".bq-assoc-head"), more = c.querySelector(".bq-assoc-more"), por = c.querySelector(".bq-portrait");
      var tid = "bq-t" + (++uid); body.innerHTML = ""; var wrap = document.createElement("div"); wrap.className = "bq-assoc";
      if (por) wrap.appendChild(por.cloneNode(true)); var h = head.cloneNode(true); h.querySelector("h3").setAttribute("id", tid); wrap.appendChild(h); wrap.appendChild(more.cloneNode(true)); body.appendChild(wrap);
      pn.setAttribute("aria-labelledby", tid); b.classList.add("bq-lock"); isOpen = true; lockOthers(true); setTimeout(function () { x.focus(); }, 60);
    }
    function close() { if (!isOpen) return; isOpen = false; b.classList.remove("bq-lock"); lockOthers(false); if (last && last.focus) last.focus(); }
    opens.forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); open(a.getAttribute("data-assoc-open"), a); }); });
    x.addEventListener("click", close); ov.addEventListener("click", close);
    document.addEventListener("keydown", function (ev) {
      if (!isOpen) return;
      if (ev.key === "Escape") { ev.preventDefault(); close(); }
      if (ev.key === "Tab") {
        var f = $("a[href],button", pn).filter(function (e) { return e.offsetParent !== null; }); if (!f.length) return;
        var first = f[0], lastEl = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); lastEl.focus(); } else if (!ev.shiftKey && document.activeElement === lastEl) { ev.preventDefault(); first.focus(); }
      }
    });
  }

  // Formulaire d'orientation : trois questions, domaine suggéré, renvoi vers /contact avec résumé
  $("[data-orient]").forEach(function (box) {
    var res = box.querySelector("[data-result]"), ans = {}, doms = {};
    $("[data-dom-id]").forEach(function (d) { var h = d.querySelector("h3"), p = d.querySelector("p"); doms[d.getAttribute("data-dom-id")] = { n: h ? h.textContent : "", d: p ? p.textContent : "", href: (d.querySelector(".bq-link") || {}).getAttribute ? d.querySelector(".bq-link").getAttribute("href") : "/expertises" }; });
    $(".bq-q", box).forEach(function (q) {
      var key = q.getAttribute("data-q"), opts = $("[role=radio]", q);
      opts.forEach(function (o, i) {
        o.addEventListener("click", function (ev) { ev.preventDefault(); pick(o); });
        o.addEventListener("keydown", function (ev) {
          if (ev.key === " ") { ev.preventDefault(); pick(o); }
          var d = ev.key === "ArrowDown" || ev.key === "ArrowRight" ? 1 : ev.key === "ArrowUp" || ev.key === "ArrowLeft" ? -1 : 0;
          if (d) { ev.preventDefault(); var n = opts[(i + d + opts.length) % opts.length]; n.focus(); pick(n); }
        });
      });
      function pick(o) { opts.forEach(function (x) { x.setAttribute("aria-checked", x === o ? "true" : "false"); }); ans[key] = o; render(); }
    });
    function render() {
      if (!(ans.profil && ans.sujet && ans.etat)) { var n = 3 - Object.keys(ans).length; res.innerHTML = '<p class="bq-eyebrow">Domaine suggéré</p><p class="bq-res-empty">Encore ' + n + " question" + (n > 1 ? "s" : "") + " pour afficher une orientation.</p>"; return; }
      var main = doms[ans.sujet.getAttribute("data-dom")], sec = ans.etat.getAttribute("data-dom"), alt = sec && sec !== ans.sujet.getAttribute("data-dom") ? doms[sec] : null;
      if (!main) return;
      var sum = "Orientation (démonstration) — Profil : " + ans.profil.getAttribute("data-label") + ". Sujet : " + ans.sujet.getAttribute("data-label") + ". Situation : " + ans.etat.getAttribute("data-label") + ". Domaine suggéré : " + main.n + (alt ? " (à examiner aussi : " + alt.n + ")" : "") + ".";
      res.innerHTML = '<p class="bq-eyebrow">Domaine suggéré</p><p class="bq-res-t"></p><p class="bq-res-d"></p>' + (alt ? '<p class="bq-res-also"></p>' : "") + '<p class="bq-res-sum"></p><div class="bq-res-act"><a class="bq-btn"></a></div><p class="bq-res-note">Orientation indicative, sans valeur de conseil juridique ni garantie de résultat.</p>';
      res.querySelector(".bq-res-t").textContent = main.n; res.querySelector(".bq-res-d").textContent = main.d;
      if (alt) res.querySelector(".bq-res-also").textContent = "À examiner aussi : " + alt.n + " (procédure engagée).";
      res.querySelector(".bq-res-sum").textContent = sum;
      var go = res.querySelector(".bq-btn"); go.href = "/contact?orientation=" + encodeURIComponent(sum); go.textContent = "Écrire au cabinet avec ce résumé";
      var cp = document.createElement("button"); cp.type = "button"; cp.className = "bq-copy"; cp.textContent = "Copier le résumé";
      cp.addEventListener("click", function () { var done = function () { cp.textContent = "Résumé copié"; }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(sum).then(done, done); else done(); });
      res.querySelector(".bq-res-act").appendChild(cp);
    }
  });
})();

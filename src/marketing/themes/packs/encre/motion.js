/* Encre — tampons, portfolio filtrable, soins en étapes, demande de projet guidée. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "encre") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var host = $(".lp-main") || b; host.classList.add("en-js");
  var tx = function (el, t) { if (el) el.textContent = t; };
  var smooth = reduce ? "auto" : "smooth";

  // Menu mobile : se referme après un choix
  $$(".en-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    host.classList.add("en-rev");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Hero : les flashs se tamponnent un à un, puis le grand tampon claque
  var board = $("[data-board]");
  if (board && !reduce) {
    host.classList.add("en-anim");
    var cells = $$(".en-fl-c", board), big = $(".en-stampbig", board), sheet = $(".en-sheet:not(.en-sheet--back)", board);
    cells.forEach(function (c, i) { setTimeout(function () { c.classList.add("is-on"); }, 350 + i * 170); });
    setTimeout(function () { if (big) big.classList.add("is-on"); }, 350 + cells.length * 170 + 150);
    setTimeout(function () { if (sheet) sheet.classList.add("is-set"); }, 350 + cells.length * 170 + 800);
  }

  // ---------- Portfolio ----------
  var folio = $("[data-folio]");
  if (folio) {
    var f2 = $("[data-folio2]");
    if (f2) { var g2 = $("[data-grid2]", f2), g1 = $("[data-grid]", folio); while (g2.firstChild) g1.appendChild(g2.firstChild); $(".en-folio", folio).appendChild($("[data-fiche]", f2)); f2.style.display = "none"; }
    var grid = $("[data-grid]", folio), cards = $$(".en-pc", grid), chips = $$(".en-chip", folio);
    var fiche = $("[data-fiche]", folio), body = $("[data-fiche-body]", folio), acs = $$("[data-ac]", folio);
    var empty = $("[data-empty]", folio), reset = $("[data-reset]", folio);
    var st = { a: "all", s: "all" }, names = { a: {}, s: {} };
    chips.forEach(function (c) { names[c.getAttribute("data-f")][c.getAttribute("data-v")] = c.textContent; });
    function showBody() { acs.forEach(function (x) { x.hidden = true; }); body.hidden = false; }
    function fillBody(html) { body.innerHTML = html; body.hidden = false; acs.forEach(function (x) { x.hidden = true; }); }
    function apply() {
      var n = 0;
      cards.forEach(function (c) {
        var ok = (st.a === "all" || c.getAttribute("data-a") === st.a) && (st.s === "all" || c.getAttribute("data-s") === st.s);
        c.hidden = !ok; if (ok) { n++; if (!reduce) { c.classList.remove("is-pop"); void c.offsetWidth; c.classList.add("is-pop"); } }
      });
      chips.forEach(function (c) { var on = st[c.getAttribute("data-f")] === c.getAttribute("data-v"); c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      tx($("[data-count-n]", folio), n); tx($("[data-count-t]", folio), n > 1 ? "planches affichées" : "planche affichée");
      empty.hidden = n > 0; reset.hidden = st.a === "all" && st.s === "all";
      cards.forEach(function (c) { if (c.hidden) c.classList.remove("is-sel"); });
      // fiche : artiste choisi -> sa fiche ; sinon invitation
      var sel = $(".en-pc.is-sel", grid);
      if (sel && !sel.hidden) return;
      if (st.a !== "all") { body.hidden = true; acs.forEach(function (x) { x.hidden = x.getAttribute("data-ac") !== st.a; }); }
      else { showBody(); body.innerHTML = '<p class="en-k">Fiche</p><p class="en-fiche-h">Choisissez une planche</p><p>Touchez une planche pour voir sa fiche, ou un artiste pour lire son parcours.</p>'; }
    }
    function pick(card) {
      cards.forEach(function (c) { c.classList.toggle("is-sel", c === card); });
      var art = $(".en-pc-art", card).innerHTML, a = card.getAttribute("data-a"), s = card.getAttribute("data-s");
      var esc = function (t) { var d = document.createElement("div"); d.textContent = t; return d.innerHTML; };
      fillBody('<p class="en-k">Planche n° ' + ("0" + card.getAttribute("data-id")).slice(-2) + '</p><div class="en-fiche-art">' + art + '</div><p class="en-fiche-h">' + esc(card.getAttribute("data-t")) + '</p><p class="en-fiche-role">' + esc(names.s[s]) + ' · ' + esc(names.a[a]) + '</p>' +
        '<dl class="en-dl"><div><dt>Zone</dt><dd>' + esc(card.getAttribute("data-z")) + '</dd></div><div><dt>Taille</dt><dd>' + esc(card.getAttribute("data-m")) + '</dd></div><div><dt>Durée</dt><dd>' + esc(card.getAttribute("data-n")) + '</dd></div></dl>' +
        '<p><a class="en-btn en-btn--sm" href="/projet">Demander cette planche</a></p><p><a href="#' + a + '" data-artist="' + a + '">Voir la fiche de ' + esc(names.a[a]) + '</a></p>');
      if (window.innerWidth <= 1024) fiche.scrollIntoView({ behavior: smooth, block: "nearest" });
    }
    chips.forEach(function (c) { c.addEventListener("click", function (e) { e.preventDefault(); st[c.getAttribute("data-f")] = c.getAttribute("data-v"); apply(); }); });
    cards.forEach(function (c) { $("a", c).addEventListener("click", function (e) { e.preventDefault(); pick(c); }); });
    reset.addEventListener("click", function (e) { e.preventDefault(); st.a = st.s = "all"; apply(); });
    fiche.addEventListener("click", function (e) {
      var l = e.target.closest && e.target.closest("[data-artist]"); if (!l) return; e.preventDefault();
      st.a = l.getAttribute("data-artist"); cards.forEach(function (c) { c.classList.remove("is-sel"); }); apply();
    });
    var h = (location.hash || "").replace("#", "");
    if (names.a[h]) st.a = h; else if (names.s[h]) st.s = h;
    apply();
  }

  // ---------- Page artistes : aller à la fiche demandée ----------
  var h2 = (location.hash || "").replace("#", "");
  if (h2) { var tgt = $('[data-anchor="' + h2.replace(/[^a-z]/g, "") + '"]'); if (tgt) setTimeout(function () { tgt.scrollIntoView({ behavior: smooth, block: "start" }); }, 200); }

  // ---------- Soins : calendrier en étapes ----------
  var care = $("[data-care]");
  if (care) {
    var tabs = $$(".en-ct", care), panels = $$(".en-cp", care), cur = 0;
    var go = function (i) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { t.classList.toggle("is-on", k === cur); t.setAttribute("aria-selected", k === cur ? "true" : "false"); });
      panels.forEach(function (p, k) { p.hidden = k !== cur; });
    };
    tabs.forEach(function (t, k) { t.addEventListener("click", function (e) { e.preventDefault(); go(k); }); });
    go(0);
    $("[data-prev]", care).addEventListener("click", function (e) { e.preventDefault(); go(cur - 1); });
    $("[data-next]", care).addEventListener("click", function (e) { e.preventDefault(); go(cur + 1); });
  }

  // ---------- Demande de projet guidée ----------
  var wiz = $("[data-wiz]");
  if (wiz) {
    var steps = $$(".en-step", wiz), prog = $$(".en-pg", wiz), prev = $("[data-prev]", wiz), next = $("[data-next]", wiz), send = $("[data-send]", wiz), copy = $("[data-copy]", wiz), est = $("[data-est]", wiz);
    var sel = { zone: "", taille: "", style: "", jours: [], moments: [] }, at = 0;
    var DUR = { Petit: "1 à 2 heures", Moyen: "2 à 3 heures", Grand: "4 à 6 heures, parfois 2 séances", "Très grand": "plusieurs séances" };
    var WHO = { "Old school": "Maëlle Roux", "Japonais": "Ravi Menon", "Fineline": "Soren Lund", "Blackwork": "Ravi Menon ou Inès Carvalho", "Réalisme": "Inès Carvalho" };
    var zs = $$(".en-z", wiz);
    function msg() {
      var d = sel.jours.concat(sel.moments).join(", ") || "à préciser";
      return "Demande de projet de tatouage\nZone : " + (sel.zone || "à préciser") + "\nTaille : " + (sel.taille || "à préciser") + "\nStyle : " + (sel.style || "à préciser") + "\nDisponibilités : " + d + "\n\nMa description et mes références : ";
    }
    function render() {
      tx($('[data-r="zone"]', wiz), sel.zone || "à choisir"); tx($('[data-r="taille"]', wiz), sel.taille || "à choisir"); tx($('[data-r="style"]', wiz), sel.style || "à choisir");
      tx($('[data-r="dispo"]', wiz), sel.jours.concat(sel.moments).join(", ") || "à choisir");
      var k = (sel.taille || "").split(" (")[0], t = [];
      if (DUR[k]) t.push("Durée indicative : " + DUR[k] + ".");
      if (WHO[sel.style]) t.push("Artiste conseillé : " + WHO[sel.style] + ".");
      est.hidden = !t.length; est.textContent = t.join(" ");
      send.setAttribute("href", "/contact?message=" + encodeURIComponent(msg()));
      copy.hidden = !(sel.zone || sel.taille || sel.style || sel.jours.length || sel.moments.length);
      zs.forEach(function (z) { var on = sel.zone && z.getAttribute("data-z") === sel.zone.replace(/ et .*/, function (m) { return m; }); z.classList.toggle("is-on", !!on); });
    }
    function show(i) {
      at = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) { s.classList.toggle("is-on", k === at); });
      prog.forEach(function (p, k) { p.classList.toggle("is-on", k === at); p.classList.toggle("is-done", k < at); if (k === at) p.setAttribute("aria-current", "step"); else p.removeAttribute("aria-current"); });
      prev.hidden = at === 0; next.hidden = at === steps.length - 1;
    }
    $$(".en-opt", wiz).forEach(function (o) {
      o.addEventListener("click", function (e) {
        e.preventDefault(); var g = o.getAttribute("data-g"), v = o.getAttribute("data-v");
        if (g === "jours" || g === "moments") {
          var i = sel[g].indexOf(v); if (i < 0) sel[g].push(v); else sel[g].splice(i, 1);
          o.classList.toggle("is-on", i < 0); o.setAttribute("aria-pressed", i < 0 ? "true" : "false");
        } else {
          sel[g] = v; $$('.en-opt[data-g="' + g + '"]', wiz).forEach(function (x) { var on = x === o; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
          if (at < steps.length - 1 && g !== "zone") setTimeout(function () { show(at + 1); }, reduce ? 0 : 280);
        }
        render();
      });
    });
    prog.forEach(function (p, k) { p.addEventListener("click", function (e) { e.preventDefault(); show(k); }); });
    prev.addEventListener("click", function (e) { e.preventDefault(); show(at - 1); });
    next.addEventListener("click", function (e) { e.preventDefault(); show(at + 1); });
    copy.addEventListener("click", function (e) {
      e.preventDefault(); var t = msg(), ok = function () { copy.textContent = "Récapitulatif copié"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () {}); else ok();
    });
    // la zone mène à l'étape suivante via le bouton, pour laisser voir la silhouette
    show(0); render();
  }
})();

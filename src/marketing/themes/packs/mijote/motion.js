/* Mijote : fiche recette (portions, coches, minuteurs, impression), filtres des recettes, calendrier de saison. Aucune dépendance ; rien ne s'exécute hors du thème Mijote. */
(function () {
  var B = document.body;
  if (!B || B.getAttribute("data-kw-pack") !== "mijote") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var one = function (s, e) { return (e || document).querySelector(s); };
  var prevent = function (e) { if (e && e.preventDefault) e.preventDefault(); };
  if (!RM) B.classList.add("mj-js"); else B.classList.add("mj-js-calm");
  B.classList.add("mj-ready");

  // ----- activation au clavier des liens qui jouent le rôle de boutons / cases -----
  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === " " && t && t.getAttribute && /^(button|checkbox)$/.test(t.getAttribute("role") || "") && t.tagName === "A") { e.preventDefault(); t.click(); }
  });

  // ----- fiche recette : portions -----
  var fr = function (n) {
    if (n >= 100) return String(Math.round(n / 5) * 5);
    if (n >= 10) return String(Math.round(n * 2) / 2).replace(".", ",");
    var fracs = [[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]];
    var w = Math.floor(n), f = n - w, best = fracs[0], d = 9, i;
    for (i = 0; i < fracs.length; i++) { var dd = Math.abs(f - fracs[i][0]); if (dd < d) { d = dd; best = fracs[i]; } }
    if (best[0] === 1) { w += 1; best = fracs[0]; }
    if (d > 0.12 && n < 5) return String(Math.round(n * 10) / 10).replace(".", ",");
    if (!w && !best[1]) return "0";
    return (w ? String(w) : "") + (best[1] ? (w ? " " : "") + best[1] : "");
  };
  var scale = function (root, n) {
    var base = +root.getAttribute("data-base") || 6, k = n / base;
    all(".mj-ing").forEach(function (a) {
      var q = parseFloat(a.getAttribute("data-q")), u = a.getAttribute("data-u"), v = q * k; if (u === "pc") u = "";
      if (u === "g" && v >= 1000) { v = v / 1000; u = "kg"; } else if (u === "kg" && v < 1) { v = v * 1000; u = "g"; }
      if (u === "cl" && v >= 100) { v = v / 100; u = "L"; }
      var qe = one(".mj-qty", a), ue = one(".mj-u", a);
      if (qe) qe.textContent = (u === "g" || u === "cl") ? String(Math.round(v / (v > 40 ? 5 : 1)) * (v > 40 ? 5 : 1)) : fr(v);
      if (ue) ue.textContent = u;
    });
    all("[data-mj-n]").forEach(function (e) { e.textContent = n; });
    all("[data-mj-n2]").forEach(function (e) { e.textContent = n; });
    var pl = one(".mj-for"); if (pl) pl.setAttribute("data-n", n);
  };
  var rec = one("[data-mj-recipe]");
  if (rec) {
    var n = +rec.getAttribute("data-base") || 6;
    all("[data-mj-step]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        prevent(e);
        n = Math.min(24, Math.max(1, n + (+a.getAttribute("data-mj-step"))));
        scale(rec, n);
      });
    });
  }

  // ----- coches (ingrédients et étapes), remise à zéro, impression -----
  all(".mj-ing, .mj-step").forEach(function (a) {
    a.addEventListener("click", function (e) { prevent(e); a.setAttribute("aria-checked", a.getAttribute("aria-checked") === "true" ? "false" : "true"); });
  });
  var rst = one("[data-mj-reset-checks]");
  if (rst) rst.addEventListener("click", function (e) { prevent(e); all(".mj-ing, .mj-step").forEach(function (a) { a.setAttribute("aria-checked", "false"); }); });
  var pr = one("[data-mj-print]");
  if (pr) pr.addEventListener("click", function (e) { prevent(e); window.print(); });

  // ----- minuteurs d'étape -----
  var fmt = function (s) { var m = Math.floor(s / 60), r = s % 60; return (m >= 60 ? Math.floor(m / 60) + " h " + String(m % 60).padStart(2, "0") + " min" : m + ":" + String(r).padStart(2, "0")); };
  all("[data-mj-timer]").forEach(function (a) {
    var total = +a.getAttribute("data-mj-timer"), label = one("[data-mj-t]", a), orig = label ? label.innerHTML : "", left = total, iv = null;
    var stop = function () { clearInterval(iv); iv = null; };
    a.addEventListener("click", function (e) {
      prevent(e);
      if (iv) { stop(); left = total; a.classList.remove("is-run", "is-done"); if (label) label.innerHTML = orig; return; }
      if (a.classList.contains("is-done")) { a.classList.remove("is-done"); if (label) label.innerHTML = orig; left = total; return; }
      a.classList.add("is-run");
      if (label) label.textContent = "Reste " + fmt(left);
      iv = setInterval(function () {
        left -= 1;
        if (left <= 0) { stop(); left = total; a.classList.remove("is-run"); a.classList.add("is-done"); if (label) label.textContent = "Terminé : touchez pour remettre à zéro"; a.setAttribute("aria-live", "assertive"); return; }
        if (label) label.textContent = "Reste " + fmt(left);
      }, 1000);
    });
  });

  // ----- recettes : rubriques, étiquettes, durée et recherche par mot -----
  var holder = one("[data-mj-list]");
  if (holder) {
    var cards = all(".mj-list .mj-card"), st = { cat: "tout", tags: [], max: 0, q: "" };
    var empty = one("[data-mj-empty]"), count = one("[data-mj-count]");
    var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var shown = 0;
      cards.forEach(function (c) {
        var ok = (st.cat === "tout" || c.getAttribute("data-cat") === st.cat);
        var tg = (c.getAttribute("data-tags") || "").split(" ");
        st.tags.forEach(function (t) { if (tg.indexOf(t) < 0) ok = false; });
        if (st.max && +c.getAttribute("data-min") > st.max) ok = false;
        if (st.q && norm(c.getAttribute("data-hay") || "").indexOf(st.q) < 0) ok = false;
        c.classList.toggle("mj-hid", !ok);
        if (ok) shown++;
      });
      if (count) count.textContent = shown === 0 ? "Aucune recette" : shown === 1 ? "1 recette" : shown + " recettes";
      if (empty) empty.classList.toggle("mj-hid", shown !== 0);
    };
    var slot = one("[data-mj-search]");
    if (slot) {
      var inp = document.createElement("input");
      inp.type = "search"; inp.placeholder = "Filtrer par mot : courge, léa, rapide…"; inp.setAttribute("aria-label", "Filtrer les recettes par mot");
      inp.addEventListener("input", function () { st.q = norm(inp.value.trim()); apply(); });
      slot.appendChild(inp);
    }
    all("[data-mj-f]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        prevent(e);
        var p = a.getAttribute("data-mj-f").split(":");
        if (p[0] === "cat") { st.cat = p[1]; all("[data-mj-f^='cat:']").forEach(function (x) { x.classList.toggle("is-on", x === a); }); }
        else if (p[0] === "tag") { var i = st.tags.indexOf(p[1]); if (i < 0) st.tags.push(p[1]); else st.tags.splice(i, 1); a.classList.toggle("is-on", i < 0); }
        else if (p[0] === "max") { st.max = st.max ? 0 : +p[1]; a.classList.toggle("is-on", !!st.max); }
        apply();
      });
    });
    var rs = one("[data-mj-reset]");
    if (rs) rs.addEventListener("click", function (e) {
      prevent(e); st = { cat: "tout", tags: [], max: 0, q: "" };
      all("[data-mj-f]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-mj-f") === "cat:tout"); });
      var i2 = one("input", slot); if (i2) i2.value = ""; apply();
    });
    apply();
  }

  // ----- calendrier de saison : un mois à la fois (tout reste lisible sans script) -----
  var seas = one("[data-mj-seasons]");
  if (seas) {
    var tabs = all("[data-mj-month]", seas), panels = all("[data-mj-panel]", seas);
    var show = function (i) {
      tabs.forEach(function (t) { t.classList.toggle("is-on", +t.getAttribute("data-mj-month") === i); });
      panels.forEach(function (p) { p.classList.toggle("is-on", +p.getAttribute("data-mj-panel") === i); });
    };
    tabs.forEach(function (t) { t.addEventListener("click", function (e) { prevent(e); show(+t.getAttribute("data-mj-month")); }); });
    show(new Date().getMonth());
  }
})();

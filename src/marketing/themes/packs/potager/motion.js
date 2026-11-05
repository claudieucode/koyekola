/* Potager — saisons, calendrier des récoltes, composeur de panier. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "potager") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; };
  var now = new Date(), month = now.getMonth() + 1;
  var realSeason = month >= 3 && month <= 5 ? "printemps" : month >= 6 && month <= 8 ? "ete" : month >= 9 && month <= 11 ? "automne" : "hiver";
  b.setAttribute("data-pgm", month);

  // Hauteur de l'en-tête (menu mobile, bandeau collant)
  var head = $(".pg-head");
  function sizeHead() { if (head) b.style.setProperty("--pg-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  $$(".pg-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("pg-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Compteurs
  if (!reduce && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = +el.getAttribute("data-count"), t0 = null;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    $$("[data-count]").forEach(function (c) { co.observe(c); });
  }

  // ---------- Saisons ----------
  var SE = ["printemps", "ete", "automne", "hiver"];
  var air = null;
  function makeAir() {
    if (reduce) return;
    if (!air) { air = document.createElement("div"); air.className = "pg-air"; air.setAttribute("aria-hidden", "true"); b.appendChild(air); }
    air.innerHTML = "";
    for (var i = 0; i < 14; i++) {
      var p = document.createElement("i");
      p.style.setProperty("--s", (10 + Math.random() * 12).toFixed(0) + "px");
      p.style.left = (Math.random() * 100).toFixed(1) + "%";
      p.style.setProperty("--x", (Math.random() * 80 - 40).toFixed(0) + "px");
      p.style.setProperty("--d", (14 + Math.random() * 14).toFixed(1) + "s");
      p.style.setProperty("--l", (-Math.random() * 20).toFixed(1) + "s");
      air.appendChild(p);
    }
  }
  var composerUpdate = function () {};
  function setSeason(s, keep) {
    if (SE.indexOf(s) < 0) s = realSeason;
    b.setAttribute("data-season", s);
    $$(".pg-stab").forEach(function (t) { t.setAttribute("aria-selected", t.getAttribute("data-season") === s ? "true" : "false"); });
    $$(".pg-plate,.pg-sp").forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-s") === s); });
    if (!keep) store("pg-season", s);
    makeAir(); composerUpdate();
  }
  $$(".pg-stab").forEach(function (t) {
    if (t.getAttribute("data-season") === realSeason) t.classList.add("is-now");
    t.addEventListener("click", function (ev) { ev.preventDefault(); setSeason(t.getAttribute("data-season")); });
    t.addEventListener("keydown", function (ev) {
      var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (!d) return; ev.preventDefault();
      var tabs = $$(".pg-stab"), n = tabs[(tabs.indexOf(t) + d + tabs.length) % tabs.length]; n.focus(); setSeason(n.getAttribute("data-season"));
    });
  });
  var want = b.getAttribute("data-pk-season");
  setSeason(store("pg-season") || (want && want !== "auto" ? want : realSeason), true);

  // ---------- Filtres génériques (famille, saison) ----------
  function applyFilter(group, key, val) {
    $$('[data-fg="' + group + '"]').forEach(function (a) { var on = a.getAttribute("data-fv") === val; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
    $$('[data-fi="' + group + '"]').forEach(function (it) { var v = it.getAttribute("data-" + key); it.classList.toggle("pg-off", !(val === "tous" || v === val)); });
    if (group === "cal") calSummary();
  }
  $$("[data-fg]").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); applyFilter(a.getAttribute("data-fg"), a.getAttribute("data-fk"), a.getAttribute("data-fv")); }); });
  $$("[data-fauto]").forEach(function (box) { applyFilter("rec", "s", b.getAttribute("data-season")); });

  // ---------- Calendrier des récoltes ----------
  var cal = $("[data-cal]");
  var focusMonth = 0, nowOnly = false;
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  function calRows() { return $$(".pg-caltable tbody tr"); }
  function calSummary() {
    if (!cal) return;
    var m = focusMonth || month, rows = calRows(), n = 0;
    rows.forEach(function (r) {
      var h = r.getAttribute("data-h").split(",").map(Number), ok = h.indexOf(m) >= 0;
      var hide = r.classList.contains("pg-off");
      r.classList.toggle("is-dim", !ok && (focusMonth > 0 || nowOnly) && !hide);
      if (ok && !hide) n++;
    });
    var s = $("[data-sum]", cal); if (s) s.textContent = n + (n > 1 ? " légumes et herbes à récolter" : " légume ou herbe à récolter") + " en " + MOIS[m - 1] + (focusMonth ? "" : " (mois en cours)");
  }
  function showVeg(a) {
    if (!cal || !a) return;
    $$(".pg-caltable tbody tr").forEach(function (r) { r.classList.toggle("is-sel", r.contains(a)); });
    var set = function (k, v) { var el = $('[data-d="' + k + '"]', cal); if (el) el.textContent = v; };
    set("name", a.firstChild.textContent); set("lat", a.getAttribute("data-lat")); set("sow", a.getAttribute("data-sow")); set("har", a.getAttribute("data-har")); set("note", a.getAttribute("data-note"));
    var lat = $('[data-d="lat"]', cal); if (lat) lat.setAttribute("lang", "la");
    var art = $('[data-d="art"]', cal), src = $('.pg-specs [data-art="' + a.getAttribute("data-art") + '"]'); if (art && src) art.innerHTML = src.innerHTML;
  }
  function setMonth(m) {
    focusMonth = focusMonth === m ? 0 : m;
    if (focusMonth) b.setAttribute("data-pgf", focusMonth); else b.removeAttribute("data-pgf");
    $$("[data-m]").forEach(function (x) { x.setAttribute("aria-pressed", +x.getAttribute("data-m") === focusMonth ? "true" : "false"); });
    calSummary();
  }
  if (cal) {
    $$(".pg-caltable tbody th a").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); showVeg(a); });
      a.addEventListener("mouseenter", function () { showVeg(a); });
      a.addEventListener("focus", function () { showVeg(a); });
      a.addEventListener("keydown", function (ev) {
        if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return; ev.preventDefault();
        var rows = calRows().filter(function (r) { return !r.classList.contains("pg-off"); }), i = rows.indexOf(a.closest("tr")), n = rows[i + (ev.key === "ArrowDown" ? 1 : -1)];
        if (n) $("a", n).focus();
      });
    });
    $$("[data-m]").forEach(function (a) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); setMonth(+a.getAttribute("data-m")); });
      a.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (!d) return; ev.preventDefault();
        var all = $$(".pg-caltable [data-m]"), n = all[all.indexOf(a) + d]; if (n) n.focus();
      });
    });
    var no = $("[data-nowonly]", cal);
    if (no) no.addEventListener("click", function (ev) { ev.preventDefault(); nowOnly = !nowOnly; no.setAttribute("aria-pressed", nowOnly ? "true" : "false"); if (nowOnly && focusMonth) setMonth(focusMonth); calSummary(); });
    var first = calRows().filter(function (r) { return r.getAttribute("data-h").split(",").indexOf(String(month)) >= 0; })[0] || calRows()[0];
    showVeg($("th a", first)); calSummary();
  }

  // ---------- Composeur de panier ----------
  var comp = $("[data-comp]");
  if (comp) {
    var D = {}; try { D = JSON.parse(comp.getAttribute("data-comp")); } catch (e) { D = null; }
    if (D) {
      var st = { size: "duo", freq: "hebdo", pick: "ferme", x: {} };
      var KG = { solo: 3, duo: 5, famille: 8 }, PER = { hebdo: 4, quinzaine: 2, mensuel: 1 };
      var lab = function (g, v) { var a = $('[data-g="' + g + '"][data-v="' + v + '"]', comp); return a ? a.getAttribute("data-l") : v; };
      var fmt = function (g) { g = Math.max(50, Math.round(g / 50) * 50); return g >= 1000 ? (g / 1000).toFixed(2).replace(/\.?0+$/, "").replace(".", ",") + " kg" : g + " g"; };
      var out = {};
      var upd = composerUpdate = function () {
        var s = b.getAttribute("data-season") || realSeason, ex = [];
        D.x.forEach(function (x) { if (st.x[x[0]]) ex = ex.concat(x[1]); });
        var mix = D.s[s].filter(function (it) { return ex.indexOf(it[0]) < 0; }), tot = 0;
        mix.forEach(function (it) { tot += it[1]; });
        var kg = KG[st.size] * 1000, html = "", lines = [];
        mix.forEach(function (it) {
          var q = it[1] ? fmt(kg * it[1] / tot) : "1 botte"; lines.push(D.v[it[0]] + " " + q);
          html += "<li><span>" + D.v[it[0]] + "</span><span>" + q + "</span></li>";
        });
        if (!mix.length) html = "<li><span>Trop d'exclusions : la ferme composera un panier sur mesure</span></li>";
        var names = D.x.filter(function (x) { return st.x[x[0]]; }).map(function (x) { return $('[data-x="' + x[0] + '"]', comp).getAttribute("data-l"); });
        var meta = "≈ " + (KG[st.size] * PER[st.freq]) + " kg de légumes par mois · " + lab("freq", st.freq).toLowerCase() + " · retrait : " + lab("pick", st.pick).toLowerCase();
        var txt = "Bonjour, je souhaite recevoir un panier " + lab("size", st.size) + " (environ " + KG[st.size] + " kg), de saison (" + D.sn[s].toLowerCase() + "), " + lab("freq", st.freq).toLowerCase() + ", retrait " + lab("pick", st.pick).toLowerCase() + "." + (names.length ? " Je préfère écarter : " + names.join(", ").toLowerCase() + "." : "") + " (Demande préparée depuis le site de démonstration.)";
        $$("[data-r]", comp).forEach(function (el) { out[el.getAttribute("data-r")] = el; });
        out.season.textContent = D.sn[s]; out.size.textContent = lab("size", st.size); out.list.innerHTML = html; out.meta.textContent = meta; out.text.textContent = txt;
        out.copied.textContent = "";
        store("pg-demande", txt);
      };
      var opts = $$(".pg-opt", comp);
      opts.forEach(function (a) { a.setAttribute("tabindex", a.getAttribute("role") === "radio" && a.getAttribute("aria-checked") !== "true" ? "-1" : "0"); });
      function pick(a) {
        if (a.getAttribute("role") === "checkbox") { var x = a.getAttribute("data-x"); st.x[x] = !st.x[x]; a.setAttribute("aria-checked", st.x[x] ? "true" : "false"); }
        else { var g = a.getAttribute("data-g"); st[g] = a.getAttribute("data-v");
          $$('[data-g="' + g + '"]', comp).forEach(function (o) { var on = o === a; o.setAttribute("aria-checked", on ? "true" : "false"); o.classList.toggle("is-on", on); o.setAttribute("tabindex", on ? "0" : "-1"); }); }
        upd();
      }
      opts.forEach(function (a) {
        a.addEventListener("click", function (ev) { ev.preventDefault(); pick(a); });
        a.addEventListener("keydown", function (ev) {
          if (ev.key === " ") { ev.preventDefault(); pick(a); return; }
          if (a.getAttribute("role") !== "radio") return;
          var d = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0; if (!d) return; ev.preventDefault();
          var grp = $$('[data-g="' + a.getAttribute("data-g") + '"]', comp), n = grp[(grp.indexOf(a) + d + grp.length) % grp.length]; n.focus(); pick(n);
        });
      });
      var cp = $("[data-copy]", comp);
      if (cp) cp.addEventListener("click", function (ev) {
        ev.preventDefault(); var t = out.text.textContent;
        var done = function (ok) { out.copied.textContent = ok ? "Résumé copié !" : "Sélectionnez le texte ci-dessus pour le copier."; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); }); else done(false);
      });
      upd();
    }
  }

  // ---------- Contact : reprend la demande de panier ----------
  var msg = store("pg-demande"), ta = $(".lp-main textarea");
  if (msg && ta && !ta.value) {
    ta.value = msg;
    var note = document.createElement("p"); note.className = "pg-prefill"; note.textContent = "Votre composition de panier a été reprise dans le message : modifiez-la si besoin.";
    ta.parentNode.insertBefore(note, ta.parentNode.firstChild);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }
})();

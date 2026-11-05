/* Moustache — animations douces et rendez-vous guidé, sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "moustache") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Liens d'ancre internes : jamais de saut brusque ni d'adresse modifiée
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    e.preventDefault();
    var k = a.getAttribute("href").slice(1), t = $('[data-anchor="' + k + '"]');
    if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  });
  $$(".mo-nav a,.mo-drawer a").forEach(function (a) { if (a.getAttribute("href") === location.pathname.replace(/\/demo\//, "/").replace(/^.*\/demo/, "") || a.pathname === location.pathname) a.setAttribute("aria-current", "page"); });

  // Apparition douce, clignement des yeux
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("mo-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
    $$(".mo-eyes").forEach(function (el, i) { el.classList.add("mo-blink"); el.style.animationDelay = (-i * 1.3) + "s"; });
  }

  // Horaires : ouvert / fermé maintenant, jour en cours
  var H = { 1: [[510, 720], [840, 1140]], 2: [[510, 720], [840, 1140]], 3: [[510, 720], [840, 1140]], 4: [[510, 720], [840, 1140]], 5: [[510, 720], [840, 1140]], 6: [[540, 780]], 0: [] };
  var d = new Date(), mn = d.getHours() * 60 + d.getMinutes(), wd = d.getDay();
  function hm(m) { return Math.floor(m / 60) + " h" + (m % 60 ? " " + (m % 60 < 10 ? "0" : "") + m % 60 : ""); }
  var open = (H[wd] || []).filter(function (r) { return mn >= r[0] && mn < r[1]; })[0], txt;
  if (open) txt = "<b>Ouvert maintenant</b><br>jusqu'à " + hm(open[1]);
  else { var nx = null, k; for (var i = 0; i < 8 && !nx; i++) { var dd = (wd + i) % 7; (H[dd] || []).forEach(function (r) { if (!nx && (i > 0 || r[0] > mn)) nx = [i, r[0], dd]; }); }
    var nm = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"]; txt = "<b>Fermé en ce moment</b><br>réouvre " + (nx ? (nx[0] === 0 ? "aujourd'hui" : nx[0] === 1 ? "demain" : nm[nx[2]]) + " à " + hm(nx[1]) : ""); }
  $$("[data-open]").forEach(function (el) { var t = $("[data-open-t]", el); if (t) t.innerHTML = txt; if (!open) el.classList.add("is-closed"); });
  $$(".mo-hours tr").forEach(function (tr) { if (+tr.getAttribute("data-day") === wd) tr.classList.add("is-today"); });

  // Fiches conseils filtrables
  $$("[data-filters]").length && (function () { var box = document;
    var f = { sp: "", tp: "" }, cards = $$(".mo-tip", box), n = $("[data-n]", box), nl = $("[data-nl]", box), em = $("[data-empty]", box), list = null;
    function apply() {
      var c = 0; cards.forEach(function (el) { var ok = (!f.sp || (" " + el.getAttribute("data-sp") + " ").indexOf(" " + f.sp + " ") > -1) && (!f.tp || el.getAttribute("data-tp") === f.tp); el.hidden = !ok; if (ok) c++; });
      n.textContent = c; nl.textContent = c > 1 ? "fiches" : "fiche"; em.hidden = c > 0;
      $$("[data-f]", box).forEach(function (a) { var v = a.getAttribute("data-v"), on = (v === "tous" ? "" : v) === f[a.getAttribute("data-f")]; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on); });
    }
    box.addEventListener("click", function (e) {
      var a = e.target.closest("[data-f]"); if (a) { var v = a.getAttribute("data-v"); f[a.getAttribute("data-f")] = v === "tous" ? "" : v; apply(); }
      if (e.target.closest("[data-reset]")) { f.sp = f.tp = ""; apply(); }
    });
    apply();
  })();

  // Rendez-vous guidé (démonstration : rien n'est enregistré)
  $$("[data-book]").forEach(function (root) {
    var st = { step: 1, espece: "", k: "", motif: "", d: 0, jour: null, heure: "", premiere: "", contact: "" };
    var panels = $$("[data-panel]", root), steps = $$(".mo-steps li", root), back = $("[data-back]", root), live = $("[data-live]", root), days = $("[data-days]", root), slots = $("[data-slots]", root), next = $("[data-next]", root);
    var JN = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"], MN = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    function nac() { return st.k === "lapin" || st.k === "oiseau"; }
    function go(n, focus) {
      st.step = n; panels.forEach(function (p) { p.hidden = +p.getAttribute("data-panel") !== n; });
      steps.forEach(function (s, i) { s.classList.toggle("is-on", i + 1 === n); s.classList.toggle("is-done", i + 1 < n); if (i + 1 === n) s.setAttribute("aria-current", "step"); else s.removeAttribute("aria-current"); });
      back.hidden = n === 1; var q = $("[data-panel='" + n + "'] .mo-q", root);
      if (live) live.textContent = "Étape " + n + " sur 5 : " + (q ? q.textContent : "");
      if (n === 2) $$("[data-sp]", root).forEach(function (o) { if (o.hasAttribute("data-pick")) o.hidden = (" " + o.getAttribute("data-sp") + " ").indexOf(" " + st.k + " ") < 0; });
      if (n === 3) buildDays(); if (n === 5) recap();
      if (focus && q) { q.setAttribute("tabindex", "-1"); q.focus({ preventScroll: true }); }
    }
    function check(group, el) { $$("[data-pick='" + group + "']", root).forEach(function (o) { o.setAttribute("aria-checked", o === el ? "true" : "false"); }); }
    function ready() { next.setAttribute("aria-disabled", st.premiere && st.contact ? "false" : "true"); }
    function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; }
    function key(dt) { return dt.getFullYear() + "-" + dt.getMonth() + "-" + dt.getDate(); }
    function buildDays() {
      days.innerHTML = ""; slots.innerHTML = ""; st.jour = null; st.heure = "";
      var h = $("[data-hint]", root); h.textContent = nac() ? "Les consultations lapins et oiseaux ont lieu le lundi, le mercredi et le vendredi." : "Créneaux de démonstration, du lundi au samedi (fermé le dimanche).";
      var c = 0; for (var i = 1; i < 21 && c < 6; i++) {
        var dt = new Date(); dt.setDate(dt.getDate() + i); var w = dt.getDay(); if (w === 0 || (nac() && [1, 3, 5].indexOf(w) < 0)) continue; c++;
        var a = document.createElement("a"); a.className = "mo-day"; a.href = "#jour"; a.setAttribute("role", "radio"); a.setAttribute("aria-checked", "false");
        a.innerHTML = "<small>" + JN[w].slice(0, 3) + ".</small><b>" + dt.getDate() + "</b><small>" + MN[dt.getMonth()].slice(0, 3) + "." + "</small>";
        a.dt = dt; days.appendChild(a);
      }
    }
    function buildSlots(dt) {
      var w = dt.getDay(), groups = w === 6 ? [["Matin", 540, 780]] : [["Matin", 510, 720], ["Après-midi", 840, 1110]], out = "";
      groups.forEach(function (g) { out += '<p class="mo-slotgrp">' + g[0] + '</p><div class="mo-slotrow" role="radiogroup" aria-label="' + g[0] + '">';
        for (var m = g[1]; m < g[2]; m += 30) { var t = hm(m), off = hash(key(dt) + m + st.k) % 4 === 0;
          out += off ? '<span class="mo-slot is-off" aria-disabled="true" title="Complet">' + t + '<span class="mo-sr"> complet</span></span>' : '<a class="mo-slot" href="#creneau" role="radio" aria-checked="false" data-t="' + t + '">' + t + '</a>'; }
        out += "</div>"; });
      slots.innerHTML = out;
    }
    function recap() {
      var j = st.jour ? JN[st.jour.getDay()] + " " + st.jour.getDate() + " " + MN[st.jour.getMonth()] + " à " + st.heure : "";
      st.rows = [["Animal", st.espece], ["Motif", st.motif + " (" + st.d + " min)"], ["Créneau souhaité", j], ["Première visite", st.premiere], ["Recontact", st.contact]];
      $("[data-recap]", root).innerHTML = st.rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join("");
    }
    root.addEventListener("click", function (e) {
      var t = e.target; var p = t.closest("[data-pick]"), a;
      if (p) { e.preventDefault(); var g = p.getAttribute("data-pick"); check(g, p);
        if (g === "espece") { st.espece = p.getAttribute("data-v"); st.k = p.getAttribute("data-k"); go(2, true); }
        else if (g === "motif") { st.motif = p.getAttribute("data-v"); st.d = p.getAttribute("data-d"); go(3, true); }
        else { st[g] = p.getAttribute("data-v"); ready(); } return; }
      if ((a = t.closest(".mo-day"))) { e.preventDefault(); $$(".mo-day", days).forEach(function (o) { o.setAttribute("aria-checked", o === a ? "true" : "false"); }); st.jour = a.dt; st.heure = ""; buildSlots(a.dt); if (live) live.textContent = "Créneaux affichés pour le " + JN[a.dt.getDay()] + " " + a.dt.getDate() + "."; return; }
      if ((a = t.closest("a.mo-slot"))) { e.preventDefault(); st.heure = a.getAttribute("data-t"); go(4, true); return; }
      if (t.closest("[data-next]")) { e.preventDefault(); if (st.premiere && st.contact) go(5, true); return; }
      if (t.closest("[data-back]")) { e.preventDefault(); go(Math.max(1, st.step - 1), true); return; }
      if (t.closest("[data-restart]")) { e.preventDefault(); st.premiere = st.contact = ""; $$("[data-pick]", root).forEach(function (o) { o.setAttribute("aria-checked", "false"); }); ready(); go(1, true); return; }
      if ((a = t.closest("[data-copy]"))) { e.preventDefault(); var txt = "Demande de rendez-vous (démonstration)\n" + st.rows.map(function (r) { return r[0] + " : " + r[1]; }).join("\n");
        var done = function () { a.textContent = "Résumé copié"; if (live) live.textContent = "Résumé copié dans le presse-papiers."; };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { a.textContent = "Sélectionnez le résumé"; }); else a.textContent = "Sélectionnez le résumé"; }
    });
    function hm(m) { return Math.floor(m / 60) + " h " + (m % 60 ? m % 60 : "00"); }
    go(1, false);
  });
})();

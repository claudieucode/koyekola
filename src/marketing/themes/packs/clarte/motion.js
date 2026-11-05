/* Clarté — agenda des célébrations (.ics), médiathèque à lecteur simulé, filtres, apparitions douces. Sans dépendance. */
(function () {
  var b = document.body; if (b.getAttribute("data-kw-pack") !== "clarte") return;
  var R = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var P = function (n) { return n < 10 ? "0" + n : "" + n; };
  var iso = function (d) { return d.getFullYear() + "-" + P(d.getMonth() + 1) + "-" + P(d.getDate()); };
  var E = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"); };
  var fr = function (d, o) { return d.toLocaleDateString("fr-FR", o); };
  var hm = function (t) { return t.replace(":", " h "); };
  var T = { celebration: "Célébration", priere: "Prière", musique: "Musique", familles: "Familles", communaute: "Rencontre" };
  var mmss = function (s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + P(s % 60); };
  var L=document.querySelector(".lp-main")||b;L.classList.add("cl-live");

  // Apparition douce
  if (!R && "IntersectionObserver" in window) {
    L.classList.add("cl-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
  }

  // Prochaine date d'un rendez-vous hebdomadaire
  $("[data-nextdow]").forEach(function (el) {
    var dow = +el.getAttribute("data-nextdow"), tm = el.getAttribute("data-time").split(":"), now = new Date(), nx = el.querySelector(".cl-nx"); if (!nx) return;
    for (var k = 0; k < 8; k++) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k, +tm[0], +tm[1]);
      if (d.getDay() === dow && d > now) { nx.textContent = "Prochain : " + fr(d, { weekday: "long", day: "numeric", month: "long" }); break; }
    }
  });

  // Filtres génériques (médiathèque, groupes, actualités)
  $(".cl-filters").forEach(function (bar) {
    var box = document.querySelector(bar.getAttribute("data-for")), cnt = bar.querySelector(".cl-count"); if (!box) return;
    var items = $("[data-cat]", box);
    bar.addEventListener("click", function (e) {
      var a = e.target.closest("a[data-f]"); if (!a) return; e.preventDefault();
      var f = a.getAttribute("data-f"), n = 0;
      $("a[data-f]", bar).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      items.forEach(function (it) { var ok = f === "all" || it.getAttribute("data-cat") === f; it.classList.toggle("cl-off", !ok); if (ok) n++; });
      if (cnt) cnt.textContent = n + (n > 1 ? " résultats" : " résultat");
    });
  });

  // Choix de situation (première visite)
  var who = document.querySelector(".cl-who"), out = document.querySelector(".cl-plan-out");
  if (who && out) who.addEventListener("click", function (e) {
    var a = e.target.closest("a[data-plan]"); if (!a) return; e.preventDefault();
    $("a", who).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
    out.innerHTML = '<p class="cl-plan-t">' + E(a.getAttribute("data-t")) + "</p><p>" + E(a.getAttribute("data-x")) + '</p><a class="cl-btn cl-btn--ghost" href="/contact">Prévenir l\'accueil de ma venue</a>';
  });

  // ----- Agenda -----
  var ag = document.querySelector(".cl-ag");
  if (ag) (function () {
    var ev = $(".cl-ev", ag).map(function (n, i) {
      var g = function (k) { return n.getAttribute("data-" + k); };
      return { i: i, dow: g("dow"), date: g("date"), t: g("time"), du: +g("dur"), ty: g("type"), n: n.querySelector(".cl-ev-t").textContent, p: n.querySelector(".cl-ev-p").textContent, x: n.querySelector(".cl-ev-d").textContent };
    });
    var out = ag.querySelector(".cl-ag-out"), title = ag.querySelector(".cl-ag-title"), S = { v: "week", a: new Date(), f: "all", sel: iso(new Date()) };
    var live = document.createElement("p"); live.className = "cl-ag-note"; live.setAttribute("role", "status"); ag.querySelector(".cl-ag-note").after(live);
    var mon = function (d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - (x.getDay() + 6) % 7); return x; };
    var add = function (d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
    var occ = function (d) { var s = iso(d); return ev.filter(function (e) { return (e.date ? e.date === s : +e.dow === d.getDay()) && (S.f === "all" || e.ty === S.f); }).sort(function (a, c) { return a.t < c.t ? -1 : 1; }); };
    var card = function (e, d, h) {
      return '<article class="cl-c cl-t-' + e.ty + '"><p class="cl-c-h"><b>' + hm(e.t) + "</b><span>" + T[e.ty] + "</span></p><" + h + ">" + E(e.n) + "</" + h + '><p class="cl-c-p">' + E(e.p) + " · " + e.du + ' min</p><p class="cl-c-d">' + E(e.x) + '</p><div><a href="#ics" class="cl-ics" data-e="' + e.i + '" data-d="' + iso(d) + '" title="Télécharger un fichier .ics : ' + E(e.n) + '">Ajouter au calendrier</a>' + (e.date ? "" : '<a href="#ics" class="cl-ics" data-e="' + e.i + '" data-d="' + iso(d) + '" data-w="1">Chaque semaine</a>') + "</div></article>";
    };
    function render() {
      var h = "", today = iso(new Date());
      if (S.v === "week") {
        var m = mon(S.a), e6 = add(m, 6);
        title.textContent = fr(m, { day: "numeric", month: "long" }) + " – " + fr(e6, { day: "numeric", month: "long", year: "numeric" });
        h = '<div class="cl-wk">';
        for (var k = 0; k < 7; k++) { var d = add(m, k), o = occ(d); h += '<section class="cl-day' + (iso(d) === today ? " is-today" : "") + '"><h3 class="cl-day-h">' + fr(d, { weekday: "long" }) + "<small>" + fr(d, { day: "numeric", month: "short" }) + '</small></h3><div class="cl-day-b">' + (o.length ? o.map(function (e) { return card(e, d, "h4"); }).join("") : '<p class="cl-none">Pas de rendez-vous.</p>') + "</div></section>"; }
        out.innerHTML = h + "</div>";
      } else {
        var f = new Date(S.a.getFullYear(), S.a.getMonth(), 1), st = mon(f);
        title.textContent = fr(f, { month: "long", year: "numeric" });
        h = '<div class="cl-mo" role="group" aria-label="Calendrier du mois">';
        ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."].forEach(function (x) { h += '<div class="cl-mo-h" aria-hidden="true">' + x + "</div>"; });
        for (var j = 0; j < 42; j++) {
          var c = add(st, j); if (j >= 35 && c.getMonth() !== f.getMonth()) break;
          var oc = occ(c), s = iso(c);
          h += '<a href="#jour" class="cl-cell' + (c.getMonth() !== f.getMonth() ? " is-out" : "") + (s === today ? " is-today" : "") + (s === S.sel ? " is-sel" : "") + '" data-d="' + s + '" aria-label="' + fr(c, { weekday: "long", day: "numeric", month: "long" }) + ", " + oc.length + ' rendez-vous"><b>' + c.getDate() + '</b><span class="cl-dots">' + oc.map(function (e) { return '<i class="cl-dot cl-t-' + e.ty + '"></i>'; }).join("") + "</span>" + (oc.length ? "<small>" + oc.length + " rdv</small>" : "") + "</a>";
        }
        h += "</div>";
        var sd = new Date(S.sel + "T12:00:00"), so = occ(sd);
        out.innerHTML = h + '<div class="cl-daybox"><h3>' + fr(sd, { weekday: "long", day: "numeric", month: "long" }) + '</h3><div class="cl-lst">' + (so.length ? so.map(function (e) { return card(e, sd, "h4"); }).join("") : '<p class="cl-none">Pas de rendez-vous ce jour-là.</p>') + "</div></div>";
      }
    }
    function ics(e, d, w) {
      var ds = iso(d).replace(/-/g, ""), tm = e.t.split(":"), en = new Date(d.getFullYear(), d.getMonth(), d.getDate(), +tm[0], +tm[1] + e.du), now = new Date();
      var st = ds + "T" + tm[0] + tm[1] + "00", ed = iso(en).replace(/-/g, "") + "T" + P(en.getHours()) + P(en.getMinutes()) + "00";
      var q = function (s) { return String(s).replace(/([,;\\])/g, "\\$1"); };
      var L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Communaute de la Clarte//demo//FR", "BEGIN:VEVENT", "UID:" + e.i + "-" + st + "@clarte-demo", "DTSTAMP:" + iso(now).replace(/-/g, "") + "T" + P(now.getHours()) + P(now.getMinutes()) + "00", "DTSTART:" + st, "DTEND:" + ed, w ? "RRULE:FREQ=WEEKLY;COUNT=26" : "", "SUMMARY:" + q(e.n), "LOCATION:" + q(e.p + ", 8 rue des Tilleuls, Rivemont"), "DESCRIPTION:" + q(e.x), "END:VEVENT", "END:VCALENDAR"].filter(Boolean).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([L], { type: "text/calendar;charset=utf-8" }));
      a.download = "clarte-" + e.n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + ds + ".ics"; document.body.appendChild(a); a.click(); a.remove();
      live.textContent = "Fichier « " + a.download + " » téléchargé : ouvrez-le pour l'ajouter à votre agenda.";
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    }
    ag.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a || !ag.contains(a) || (a.getAttribute("href") || "").charAt(0) !== "#") return; e.preventDefault();
      var g = function (k) { return a.getAttribute("data-" + k); }, grp = function (sel) { $(sel, ag).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); };
      if (g("view")) { S.v = g("view"); grp("[data-view]"); if (S.v === "month") S.sel = iso(S.a); }
      else if (g("type")) { S.f = g("type"); grp("[data-type]"); }
      else if (g("go") !== null) { var n = +g("go"); if (!n) { S.a = new Date(); S.sel = iso(S.a); } else if (S.v === "week") S.a = add(S.a, 7 * n); else { S.a = new Date(S.a.getFullYear(), S.a.getMonth() + n, 1); S.sel = iso(S.a); } }
      else if (g("e") !== null) { ics(ev[+g("e")], new Date(g("d") + "T12:00:00"), g("w")); return; }
      else if (g("d")) { S.sel = g("d"); }
      else return;
      render();
      var sel = a.getAttribute("data-d") && out.querySelector('[data-d="' + S.sel + '"]'); if (sel) sel.focus();
    });
    render();
  })();

  // ----- Lecteur de prédications simulé -----
  var pl = document.querySelector(".cl-pl"), rows = $(".cl-sm");
  if (pl && rows.length) (function () {
    var q = function (s) { return pl.querySelector(s); }, bar = q(".cl-seek"), fill = q(".cl-seek-fill"), now = q(".cl-t-now"), len = q(".cl-t-len"), chs = q(".cl-chs"), trs = q(".cl-trs"), pbtn = q(".cl-pl-play"), sp = q(".cl-pl-sp");
    var S = { r: null, t: 0, len: 0, play: false, sp: 1, tm: null, ps: [] }, SP = [1, 1.5, 2];
    bar.setAttribute("role", "slider"); bar.setAttribute("tabindex", "0"); bar.setAttribute("aria-valuemin", "0");
    pbtn.setAttribute("role", "button"); pbtn.setAttribute("aria-pressed", "false");
    function upd() {
      fill.style.transform = "scaleX(" + (S.len ? S.t / S.len : 0) + ")"; now.textContent = mmss(S.t);
      bar.setAttribute("aria-valuenow", Math.floor(S.t)); bar.setAttribute("aria-valuetext", mmss(S.t) + " sur " + mmss(S.len));
      var cur = -1; S.ps.forEach(function (p, i) { if (S.t >= +p.getAttribute("data-t")) cur = i; });
      $("p", trs).forEach(function (p, i) { var on = i === cur; if (on && !p.classList.contains("is-now") && S.play) trs.scrollTop = p.offsetTop - trs.offsetTop - 6; p.classList.toggle("is-now", on); });
      $("a", chs).forEach(function (a, i) { a.classList.toggle("is-now", i === cur); });
    }
    function setPlay(v) { S.play = v; pl.classList.toggle("is-play", v); pbtn.setAttribute("aria-pressed", v); pbtn.setAttribute("aria-label", v ? "Pause" : "Lecture"); clearInterval(S.tm); if (v) S.tm = setInterval(function () { S.t += 0.25 * S.sp; if (S.t >= S.len) { S.t = S.len; setPlay(false); } upd(); }, 250); }
    function load(i, go) {
      var r = rows[i]; if (!r) return; setPlay(false); S.r = r; S.t = 0; S.len = +r.getAttribute("data-len"); S.ps = $(".cl-tr p", r);
      rows.forEach(function (x) { x.classList.toggle("is-cur", x === r); });
      q(".cl-pl-th").textContent = r.querySelector(".cl-sm-th").textContent; q(".cl-pl-title").textContent = r.querySelector(".cl-sm-t").textContent; q(".cl-pl-meta").textContent = r.querySelector(".cl-sm-m").textContent;
      len.textContent = mmss(S.len); bar.setAttribute("aria-valuemax", S.len); bar.setAttribute("aria-label", "Position dans l'extrait « " + r.querySelector(".cl-sm-t").textContent + " »");
      chs.innerHTML = S.ps.map(function (p) { return '<li><a href="#chapitre" data-t="' + p.getAttribute("data-t") + '"><b>' + mmss(+p.getAttribute("data-t")) + "</b>" + E(p.getAttribute("data-ch")) + "</a></li>"; }).join("");
      trs.innerHTML = S.ps.map(function (p) { return '<p data-t="' + p.getAttribute("data-t") + '">' + E(p.textContent) + "</p>"; }).join(""); trs.scrollTop = 0;
      upd(); if (go) setPlay(true);
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a"); if (!a) return; var k = a.getAttribute("data-pl");
      if (a.classList.contains("cl-play")) { e.preventDefault(); load(+a.getAttribute("data-i"), true); pl.scrollIntoView && window.innerWidth < 1024 && pl.scrollIntoView({ behavior: R ? "auto" : "smooth", block: "start" }); return; }
      if (!pl.contains(a)) return;
      if (a.parentNode.parentNode === chs) { e.preventDefault(); S.t = +a.getAttribute("data-t"); upd(); return; }
      if (!k) return; e.preventDefault();
      if (k === "play") { if (S.t >= S.len) S.t = 0; setPlay(!S.play); upd(); }
      else if (k === "speed") { S.sp = SP[(SP.indexOf(S.sp) + 1) % 3]; sp.textContent = "×" + S.sp; }
      else { S.t = Math.min(S.len, Math.max(0, S.t + +k)); upd(); }
    });
    pbtn.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); pbtn.click(); } });
    bar.addEventListener("click", function (e) { var r = bar.getBoundingClientRect(); S.t = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * S.len; upd(); });
    bar.addEventListener("keydown", function (e) {
      var d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 30, PageDown: -30 }[e.key];
      if (d) { e.preventDefault(); S.t = Math.min(S.len, Math.max(0, S.t + d)); upd(); } else if (e.key === "Home") { e.preventDefault(); S.t = 0; upd(); } else if (e.key === "End") { e.preventDefault(); S.t = S.len; upd(); }
    });
    load(0, false);
  })();
})();

/* Albergo — diaporama lent, onglets/filtres, galerie plein écran et sélecteur de séjour (calendrier, nuits, voyageurs, récapitulatif → /contact). Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "albergo") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var el = function (t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
  b.classList.add("al-on");

  var head = document.querySelector(".al-head");
  function sizeHead() { if (head) b.style.setProperty("--al-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  $$(".al-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  $$(".al-card-art,.al-strip-i").forEach(function (a) { a.tabIndex = -1; });

  // Apparitions
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("al-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (n, i) { n.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(n); });
    setTimeout(function () { $$("[data-reveal]:not(.is-in)").forEach(function (n) { var r = n.getBoundingClientRect(); if (r.top < innerHeight) n.classList.add("is-in"); }); }, 1500);
  }

  // Diaporama lent
  $$("[data-show]").forEach(function (show) {
    var slides = $$(".al-slide", show), dots = $$("[data-go]", show), cap = show.querySelector("[data-capout]"), pauseBtn = show.querySelector("[data-pause]");
    var i = 0, paused = reduce, timer = null, ms = b.getAttribute("data-pk-tempo") === "slower" ? 11000 : 7000;
    show.style.setProperty("--al-t", ms + "ms");
    function go(n, user) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-on", k === i); s.setAttribute("aria-hidden", k === i ? "false" : "true"); });
      dots.forEach(function (d, k) { d.classList.remove("al-run"); d.classList.toggle("is-on", k === i); d.setAttribute("aria-current", k === i ? "true" : "false"); });
      if (cap) cap.textContent = slides[i].getAttribute("data-cap");
      if (!paused && !reduce) { void show.offsetWidth; dots[i].classList.add("al-run"); }
      schedule();
    }
    function schedule() { clearTimeout(timer); if (!paused && !reduce) timer = setTimeout(function () { go(i + 1); }, ms); }
    function setPaused(p) {
      paused = p; if (pauseBtn) { pauseBtn.textContent = p ? "Lecture" : "Pause"; pauseBtn.setAttribute("aria-label", p ? "Relancer le diaporama" : "Mettre le diaporama en pause"); }
      dots.forEach(function (d) { d.classList.remove("al-run"); }); if (!p) { void show.offsetWidth; dots[i].classList.add("al-run"); } schedule();
    }
    $$("[data-step]", show).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); go(i + Number(a.getAttribute("data-step"))); }); });
    dots.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); go(Number(a.getAttribute("data-go"))); }); });
    if (pauseBtn) pauseBtn.addEventListener("click", function (e) { e.preventDefault(); setPaused(!paused); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    if (reduce && pauseBtn) pauseBtn.textContent = "Lecture";
    go(0);
  });

  // Onglets / filtres (data-tabs = groupe ; panneaux [data-panel-group] ; éléments [data-filter] > [data-item][data-cats])
  var roomHooks = [];
  function activate(group, key, quiet) {
    $$('[data-tabs="' + group + '"] a').forEach(function (a) { var on = a.getAttribute("data-tab") === key; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on ? "true" : "false"); });
    $$('[data-panel-group="' + group + '"]').forEach(function (p) { if (p.getAttribute("data-panel") !== key) p.setAttribute("data-off", "1"); else p.removeAttribute("data-off"); });
    $$('[data-filter="' + group + '"] [data-item]').forEach(function (it) { it.hidden = !(key === "toutes" || (it.getAttribute("data-cats") || "").split(" ").indexOf(key) > -1); });
    $$(".al-galp").forEach(function (s) { if (s.querySelector("[data-item]")) s.hidden = !s.querySelector("[data-item]:not([hidden])"); });
    if (group === "chambre" && !quiet) roomHooks.forEach(function (f) { f(key); });
  }
  $$("[data-tabs]").forEach(function (t) { var g = t.getAttribute("data-tabs"); $$("a[data-tab]", t).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); activate(g, a.getAttribute("data-tab")); }); }); });
  var hash = (location.hash || "").slice(1);
  if (hash && document.querySelector('[data-tabs="chambre"] a[data-tab="' + hash + '"]')) setTimeout(function () { activate("chambre", hash); }, 0);

  // Galerie plein écran
  var zooms = $$("[data-zoom]");
  if (zooms.length) {
    var lb = el("div", "al-lb"), box = el("div", "al-lb-box"), bar = el("div", "al-lb-bar");
    lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Image agrandie");
    var pv = el("button", "", "&#8592;"), nx = el("button", "", "&#8594;"), cl = el("button", "", "&#10005;"), lab = el("span", "");
    pv.setAttribute("aria-label", "Image précédente"); nx.setAttribute("aria-label", "Image suivante"); cl.setAttribute("aria-label", "Fermer");
    [pv, lab, nx, cl].forEach(function (n) { bar.appendChild(n); }); lb.appendChild(box); lb.appendChild(bar); b.appendChild(lb);
    var cur = 0, last = null;
    var vis = function () { return zooms.filter(function (z) { return !z.closest("[data-item]").hidden; }); };
    function show(n) { var v = vis(); if (!v.length) return; cur = (n + v.length) % v.length; box.innerHTML = v[cur].innerHTML; lab.textContent = v[cur].closest("figure").querySelector("figcaption").textContent + " (" + (cur + 1) + "/" + v.length + ")"; }
    function open(z) { last = z; lb.hidden = false; show(vis().indexOf(z)); cl.focus(); }
    function close() { lb.hidden = true; if (last) last.focus(); }
    zooms.forEach(function (z) { z.addEventListener("click", function (e) { e.preventDefault(); open(z); }); });
    pv.addEventListener("click", function () { show(cur - 1); }); nx.addEventListener("click", function () { show(cur + 1); }); cl.addEventListener("click", close);
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowRight") show(cur + 1); else if (e.key === "ArrowLeft") show(cur - 1);
      else if (e.key === "Tab") { var f = [pv, nx, cl], k = f.indexOf(document.activeElement); e.preventDefault(); f[(k + (e.shiftKey ? -1 : 1) + 3) % 3].focus(); }
    });
  }

  // Formulaire de contact : reprend le récapitulatif du sélecteur
  var q = (location.search.match(/[?&]resume=([^&]+)/) || [])[1], msg = "";
  try { msg = q ? decodeURIComponent(q.replace(/\+/g, " ")) : ""; } catch (e) { msg = ""; }
  if (msg && /\/contact\/?$/.test(location.pathname)) {
    var ta = document.querySelector(".lp-main textarea[name*=message], .lp-main textarea"), note = el("p", "al-resume"), host = ta ? (ta.closest("form") || ta.parentNode) : document.querySelector(".lp-main .lp-block-layout:not(:has(.pk-bleed))");
    if (ta) { ta.value = msg; ta.dispatchEvent(new Event("input", { bubbles: true })); note.textContent = "Récapitulatif repris de votre sélection : vous pouvez le modifier avant l'envoi."; }
    else note.textContent = "Votre demande : " + msg + " (à recopier dans votre message).";
    if (host && host.parentNode) host.parentNode.insertBefore(note, host);
  }

  // ----- Sélecteur de séjour -----
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"], JC = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
  var DAY = 86400000;
  function mid(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addD(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return a && b && a.getTime() === b.getTime(); }
  function wd(d) { return (d.getDay() + 6) % 7; }
  function nightsBetween(a, b) { return Math.round((b - a) / DAY); }
  var MC = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  function fmt(d) { return JC[wd(d)] + ". " + d.getDate() + " " + MC[d.getMonth()] + " " + d.getFullYear(); }
  function eur(n) { return Math.round(n).toLocaleString("fr-FR") + " €"; }
  var TODAY = mid(new Date());

  $$("[data-book]").forEach(function (root) {
    var rooms = $$(".al-rm", root).map(function (a, k) { return { a: a, id: a.getAttribute("data-room"), name: a.getAttribute("data-name"), price: +a.getAttribute("data-price"), max: +a.getAttribute("data-max"), k: k }; });
    var calBox = root.querySelector("[data-cal]"), hint = root.querySelector("[data-hint]"), gBox = root.querySelector("[data-guests]"), oBox = root.querySelector("[data-opts]"), rb = root.querySelector("[data-recap-body]"), send = root.querySelector("[data-send]");
    var S = { room: rooms[0], a: null, b: null, ad: 2, ch: 0, bf: false, tr: false, view: new Date(TODAY.getFullYear(), TODAY.getMonth(), 1), focus: null };
    S.room = rooms.filter(function (r) { return r.id === root.getAttribute("data-room"); })[0] || rooms[0];
    var MAXN = 14;

    function busy(d) { return (d.getDate() * 5 + d.getMonth() * 3 + S.room.k * 4) % 9 === 0 || (d.getDate() === 31 && d.getMonth() === 11); }
    function rate(d) { var f = 1; if (d.getDay() === 5 || d.getDay() === 6) f += 0.15; if (d.getMonth() === 6 || d.getMonth() === 7) f += 0.25; return S.room.price * f; }
    function say(t, err) { hint.textContent = t; hint.classList.toggle("is-err", !!err); }

    // Chambres (radiogroupe)
    function paintRooms() { rooms.forEach(function (r) { var on = r === S.room; r.a.setAttribute("aria-checked", on ? "true" : "false"); r.a.setAttribute("tabindex", on ? "0" : "-1"); }); }
    function pickRoom(r, fromTab) {
      S.room = r; var m = r.max; while (S.ad + S.ch > m) { if (S.ch) S.ch--; else S.ad--; }
      if (S.a && S.b) { for (var d = S.a; d < S.b; d = addD(d, 1)) if (busy(d)) { S.a = S.b = null; say("Cette chambre est complète sur une nuit de votre séjour : choisissez d'autres dates.", true); break; } }
      paintRooms(); drawCal(); drawGuests(); recap();
    }
    rooms.forEach(function (r) {
      r.a.setAttribute("role", "radio");
      r.a.addEventListener("click", function (e) { e.preventDefault(); pickRoom(r); });
      r.a.addEventListener("keydown", function (e) {
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (d) { e.preventDefault(); var n = rooms[(r.k + d + rooms.length) % rooms.length]; pickRoom(n); n.a.focus(); }
        else if (e.key === " ") { e.preventDefault(); pickRoom(r); }
      });
    });
    roomHooks.push(function (id) { var r = rooms.filter(function (x) { return x.id === id; })[0]; if (r) pickRoom(r); });

    // Calendrier
    function monthEl(first, idx, two) {
      var m = el("div", "al-cal-m"), h = el("div", "al-cal-h");
      function nv(dir, cls) {
        var x = el("button", "al-cal-nav" + (cls || ""), dir < 0 ? "&#8249;" : "&#8250;"); x.type = "button"; x.setAttribute("aria-label", dir < 0 ? "Mois précédent" : "Mois suivant");
        x.disabled = dir < 0 && first <= new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
        x.addEventListener("click", function () { S.view = new Date(S.view.getFullYear(), S.view.getMonth() + dir, 1); drawCal(); }); return x;
      }
      h.appendChild(idx === 0 ? nv(-1) : el("span", "al-cal-sp")); h.appendChild(el("b", "", MOIS[first.getMonth()] + " " + first.getFullYear())); h.appendChild(idx === 0 ? nv(1, " al-mob") : nv(1));
      m.appendChild(h);
      var g = el("div", "al-cal-g"); g.setAttribute("role", "group"); g.setAttribute("aria-label", MOIS[first.getMonth()] + " " + first.getFullYear());
      JC.forEach(function (j, k) { var w = el("span", "al-cal-w", j.slice(0, 1).toUpperCase() + j.slice(1, 3)); w.setAttribute("aria-hidden", "true"); w.title = JOURS[k]; g.appendChild(w); });
      for (var k = 0; k < wd(first); k++) g.appendChild(el("span", "al-d is-void"));
      var n = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      for (var i = 1; i <= n; i++) {
        var d = new Date(first.getFullYear(), first.getMonth(), i), bt = el("button", "al-d", "<span>" + i + "</span>");
        bt.type = "button"; bt.dataset.t = d.getTime();
        var past = d < TODAY, bz = busy(d), lab = JOURS[wd(d)] + " " + i + " " + MOIS[d.getMonth()] + " " + d.getFullYear();
        if (past) bt.disabled = true;
        if (bz && !past) { bt.classList.add("is-busy"); lab += ", nuit complète"; }
        if (same(d, TODAY)) bt.classList.add("is-today");
        var isA = same(d, S.a), isB = same(d, S.b);
        if (isA) { bt.classList.add("is-a"); lab += ", arrivée"; } if (isB) { bt.classList.add("is-b"); lab += ", départ"; }
        if (S.a && S.b && d > S.a && d < S.b) bt.classList.add("is-in");
        if (S.a && S.b && isA) bt.classList.add("is-a");
        bt.setAttribute("aria-label", lab); bt.setAttribute("aria-pressed", isA || isB ? "true" : "false");
        bt.tabIndex = (S.focus ? same(d, S.focus) : (isA || (!S.a && same(d, TODAY)) || (!S.a && n && i === 1 && first > TODAY))) ? 0 : -1;
        bt.addEventListener("click", function (ev) { choose(new Date(+ev.currentTarget.dataset.t)); });
        bt.addEventListener("keydown", keyNav);
        g.appendChild(bt);
      }
      m.appendChild(g); return m;
    }
    function keyNav(e) {
      var d = new Date(+e.currentTarget.dataset.t), t = null;
      if (e.key === "ArrowRight") t = addD(d, 1); else if (e.key === "ArrowLeft") t = addD(d, -1); else if (e.key === "ArrowDown") t = addD(d, 7); else if (e.key === "ArrowUp") t = addD(d, -7);
      else if (e.key === "PageDown") t = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()); else if (e.key === "PageUp") t = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
      else if (e.key === "Home") t = addD(d, -wd(d)); else if (e.key === "End") t = addD(d, 6 - wd(d));
      if (!t) return; e.preventDefault(); if (t < TODAY) t = TODAY;
      S.focus = t; var v = S.view, two = calBox.querySelectorAll(".al-cal-m").length > 1 && getComputedStyle(calBox.querySelectorAll(".al-cal-m")[1]).display !== "none";
      var lo = v, hi = new Date(v.getFullYear(), v.getMonth() + (two ? 2 : 1), 0);
      if (t < lo) S.view = new Date(t.getFullYear(), t.getMonth(), 1); else if (t > hi) S.view = new Date(t.getFullYear(), t.getMonth() - (two ? 1 : 0), 1);
      drawCal(true);
    }
    function drawCal(refocus) {
      calBox.innerHTML = ""; var v = S.view;
      calBox.appendChild(monthEl(v, 0, true)); calBox.appendChild(monthEl(new Date(v.getFullYear(), v.getMonth() + 1, 1), 1, true));
      if (refocus && S.focus) { var t = calBox.querySelector('.al-d[data-t="' + S.focus.getTime() + '"]'); if (t) t.focus(); }
    }
    function choose(d) {
      S.focus = d;
      if (!S.a || (S.a && S.b) || d <= S.a) {
        if (busy(d)) { S.a = S.b = null; say("La nuit du " + fmt(d) + " est complète pour cette chambre.", true); }
        else { S.a = d; S.b = null; say("Arrivée le " + fmt(d) + ". Choisissez maintenant votre date de départ."); }
      } else {
        var n = nightsBetween(S.a, d), bad = null;
        for (var x = S.a; x < d; x = addD(x, 1)) if (busy(x)) { bad = x; break; }
        if (bad) say("La nuit du " + fmt(bad) + " est complète : choisissez un départ plus tôt ou d'autres dates.", true);
        else if (n > MAXN) say("Séjour limité à " + MAXN + " nuits dans ce sélecteur.", true);
        else { S.b = d; say(n + (n > 1 ? " nuits" : " nuit") + " du " + fmt(S.a) + " au " + fmt(d) + "."); }
      }
      drawCal(true); recap();
    }

    // Voyageurs et options
    function stepper(label, sub, key, min, max) {
      var w = el("div", "al-gst"), t = el("div", "", "<b>" + label + "</b><small>" + sub + "</small>"), c = el("div", "al-gst-c");
      var m = el("button", "al-cal-nav", "&minus;"), p = el("button", "al-cal-nav", "+"), o = el("output", "", S[key]);
      m.type = p.type = "button"; m.setAttribute("aria-label", "Moins de " + label.toLowerCase()); p.setAttribute("aria-label", "Plus de " + label.toLowerCase());
      o.setAttribute("aria-live", "polite"); m.disabled = S[key] <= min; p.disabled = S[key] >= max || S.ad + S.ch >= S.room.max;
      m.addEventListener("click", function () { S[key]--; drawGuests(); recap(); gBox.querySelector('[data-k="' + key + '"] .al-cal-nav:nth-child(1)').focus(); });
      p.addEventListener("click", function () { S[key]++; drawGuests(); recap(); var bt = gBox.querySelectorAll('[data-k="' + key + '"] .al-cal-nav'); (bt[1].disabled ? bt[0] : bt[1]).focus(); });
      c.appendChild(m); c.appendChild(o); c.appendChild(p); w.appendChild(t); w.appendChild(c); w.setAttribute("data-k", key); return w;
    }
    function drawGuests() { gBox.innerHTML = ""; gBox.appendChild(stepper("Adultes", "13 ans et plus", "ad", 1, 4)); gBox.appendChild(stepper("Enfants", "moins de 13 ans", "ch", 0, 3)); }
    function opt(key, title, sub, price) {
      var l = el("label", "al-opt"), i = el("input"); i.type = "checkbox"; i.checked = S[key];
      l.appendChild(i); l.appendChild(el("span", "", title + "<small>" + sub + "</small>")); l.appendChild(el("em", "", price));
      i.addEventListener("change", function () { S[key] = i.checked; recap(); }); return l;
    }
    oBox.appendChild(opt("bf", "Petit-déjeuner", "18 € par adulte et par nuit, 9 € par enfant", "+ 18 €")); oBox.appendChild(opt("tr", "Navette depuis la gare", "Forfait aller-retour de démonstration", "+ 45 €"));

    // Récapitulatif
    function recap() {
      var r = S.room, ok = S.a && S.b;
      if (!ok) { rb.innerHTML = "<p><strong>" + r.name + "</strong>, jusqu'à " + r.max + " personnes, dès " + eur(r.price) + " la nuit.</p><p>" + (S.a ? "Arrivée le " + fmt(S.a) + " : choisissez la date de départ." : "Choisissez vos dates d'arrivée et de départ dans le calendrier.") + "</p>"; lock(true); return; }
      var n = nightsBetween(S.a, S.b), base = 0; for (var d = S.a; d < S.b; d = addD(d, 1)) base += rate(d);
      var gs = S.ad + S.ch, bf = S.bf ? n * (S.ad * 18 + S.ch * 9) : 0, tr = S.tr ? 45 : 0, tax = n * S.ad * 2.3, tot = base + bf + tr + tax;
      var who = S.ad + (S.ad > 1 ? " adultes" : " adulte") + (S.ch ? ", " + S.ch + (S.ch > 1 ? " enfants" : " enfant") : "");
      var rows = [["Chambre", r.name], ["Arrivée", fmt(S.a)], ["Départ", fmt(S.b)], ["Durée", n + (n > 1 ? " nuits" : " nuit")], ["Voyageurs", who], ["Hébergement", eur(base)]];
      if (bf) rows.push(["Petit-déjeuner", eur(bf)]); if (tr) rows.push(["Navette", eur(tr)]); rows.push(["Taxe de séjour", eur(tax)]);
      rb.innerHTML = '<dl class="al-rc">' + rows.map(function (x) { return "<div><dt>" + x[0] + "</dt><dd>" + x[1] + "</dd></div>"; }).join("") + '</dl><div class="al-total"><span>Total estimé</span><b>' + eur(tot) + "</b></div><small>Soit environ " + eur(base / n) + " la nuit, week-ends (+15 %) et juillet-août (+25 %) inclus. Estimation de démonstration.</small>";
      var text = "Demande de séjour (démonstration) : " + r.name + ", du " + fmt(S.a) + " au " + fmt(S.b) + " (" + n + (n > 1 ? " nuits" : " nuit") + "), " + who + (S.bf ? ", avec petit-déjeuner" : "") + (S.tr ? ", avec navette" : "") + ". Estimation : " + eur(tot) + ".";
      S.text = text; lock(false);
      try { sessionStorage.setItem("albergo-resume", text); } catch (e) {}
    }
    function lock(on) { send.setAttribute("aria-disabled", on ? "true" : "false"); if (on) { send.setAttribute("href", "/contact"); send.tabIndex = -1; } else { send.setAttribute("href", "/contact?resume=" + encodeURIComponent(S.text)); send.tabIndex = 0; } }
    send.addEventListener("click", function (e) { if (send.getAttribute("aria-disabled") === "true") e.preventDefault(); });

    paintRooms(); drawCal(); drawGuests(); recap();
  });
})();

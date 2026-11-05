/* Rasoir — révélations, compteurs, onglets, filtres, horaires du jour et prise de rendez-vous (démonstration, rien n'est enregistré). */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "rasoir") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("rs-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = $$("[data-count]");
  function fmt(n, sep) { return sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ") : String(n); }
  if (cs.length && "IntersectionObserver" in window && !reduce) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), sep = el.getAttribute("data-sep"), t0 = null;
        function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / 1400); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))), sep); if (p < 1) requestAnimationFrame(step); }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  } else cs.forEach(function (c) { c.textContent = fmt(parseInt(c.getAttribute("data-count"), 10), c.getAttribute("data-sep")); });

  // Jour courant dans les horaires
  var today = new Date().getDay();
  $$("[data-hours] tr[data-d]").forEach(function (tr) { if (Number(tr.getAttribute("data-d")) === today) tr.classList.add("is-today"); });

  // Onglets (carte des prestations)
  $$(".rs-tabs[data-scope]").forEach(function (tabs) {
    var scope = tabs.closest(".pk-bleed");
    $$("a[data-tab]", tabs).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        $$("a[data-tab]", tabs).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        $$("[data-panel]", scope).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== a.getAttribute("data-tab"); });
      });
    });
    // Filtres (galerie, produits)
    $$("a[data-filter]", tabs).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var f = a.getAttribute("data-filter"), box = $("[data-filterable]", scope);
        $$("a[data-filter]", tabs).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        $$("[data-cat]", box).forEach(function (it) { it.hidden = f !== "all" && it.getAttribute("data-cat") !== f; });
      });
    });
  });

  // Menu mobile : se referme au clic
  $$(".rs-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // ---------- Prise de rendez-vous ----------
  var bk = $("[data-book]"); if (!bk) return;
  var NAMES = { gaston: "Gaston Rasoir", marcel: "Marcel Ortega", lucien: "Lucien Ferré", any: "Le premier libre" };
  // Prestations assurées par chaque barbier ; jours de présence (mar..sam)
  var CAN = { gaston: ["coupe", "degrade", "barbe", "rasage", "complet"], marcel: ["coupe", "barbe", "rasage", "complet"], lucien: ["coupe", "degrade", "barbe", "complet", "petit"], any: null };
  var DAYS = { gaston: [1, 1, 1, 1, 1], marcel: [1, 0, 1, 1, 1], lucien: [1, 1, 1, 1, 0] };
  var MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], DN = ["mar.", "mer.", "jeu.", "ven.", "sam."];
  var st = { bar: null, svc: null, slot: null, wk: 0 }, dates = [];
  var cols = $$(".rs-day", bk);

  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 9973; return h; }
  function openDays() { // cinq jours ouvrés (mar-sam) à partir de demain, décalés par semaine
    var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + 1 + st.wk * 7);
    var out = []; while (out.length < 5) { var g = d.getDay(); if (g >= 2 && g <= 6) out.push(new Date(d.getTime())); d.setDate(d.getDate() + 1); }
    return out;
  }
  function free(bar, di, slot) { // un créneau est libre selon barbier, jour et heure (valeurs de démonstration)
    var d = dates[di], key = d.getDate() + "-" + d.getMonth() + "-" + slot;
    function one(k) { return DAYS[k][d.getDay() - 2] && hash(k + key) % 100 > 38; }
    return bar === "any" ? one("gaston") || one("marcel") || one("lucien") : one(bar);
  }
  function who(di, slot) { // en mode « premier libre », barbier proposé
    var ks = ["gaston", "marcel", "lucien"].filter(function (k) { return (!st.svc || CAN[k].indexOf(st.svc.slug) > -1) && DAYS[k][dates[di].getDay() - 2] && hash(k + dates[di].getDate() + "-" + dates[di].getMonth() + "-" + slot) % 100 > 38; });
    return ks[0] || null;
  }
  function label(d) { return DN[d.getDay() - 2] + " " + d.getDate() + " " + MONTHS[d.getMonth()]; }

  function paint() {
    dates = openDays();
    cols.forEach(function (col, i) {
      $(".rs-day-h b", col).textContent = DN[dates[i].getDay() - 2].replace(".", "");
      $("[data-dnum]", col).textContent = dates[i].getDate() + " " + MONTHS[dates[i].getMonth()];
      $$(".rs-slot", col).forEach(function (a) {
        var s = a.getAttribute("data-slot"), ok = st.bar ? free(st.bar, i, s) : free("any", i, s);
        if (st.bar === "any" && st.svc && ok) ok = !!who(i, s);
        a.classList.toggle("is-full", !ok); a.setAttribute("aria-disabled", ok ? "false" : "true");
        a.setAttribute("aria-label", dates[i] && (label(dates[i]) + " à " + s + (ok ? ", libre" : ", complet")));
        var on = st.slot && st.slot.i === i && st.slot.s === s && st.slot.wk === st.wk && ok;
        a.setAttribute("aria-checked", on ? "true" : "false");
      });
    });
    var wl = $("[data-weeklab]"); if (wl) wl.textContent = label(dates[0]) + " – " + label(dates[4]);
    var prev = $("[data-wk='-1']"); if (prev) prev.setAttribute("aria-disabled", st.wk <= 0 ? "true" : "false");
    var next = $("[data-wk='1']"); if (next) next.setAttribute("aria-disabled", st.wk >= 3 ? "true" : "false");
  }

  function recap() {
    var bar = st.bar, svc = st.svc, sl = st.slot, set = function (k, v) { var e = $("[data-r='" + k + "']", bk); if (e) e.textContent = v; };
    var barTxt = bar ? NAMES[bar] : "À choisir";
    if (bar === "any" && sl && sl.who) barTxt = "Premier libre (" + NAMES[sl.who] + ")";
    set("bar", barTxt); set("svc", svc ? svc.name : "À choisir");
    set("slot", sl ? sl.text : "À choisir"); set("dur", svc ? svc.dur + " min" : "–"); set("price", svc ? svc.price + " €" : "–");
    var ok = bar && svc && sl, send = $("[data-send]", bk), msg = $("[data-msg]", bk);
    send.setAttribute("aria-disabled", ok ? "false" : "true");
    msg.textContent = ok ? "Votre demande est prête : envoyez-la via le formulaire de contact." : "Complétez les trois étapes pour envoyer la demande.";
  }

  function pick(group, a) { $$("[role='radio']", group).forEach(function (x) { x.setAttribute("aria-checked", x === a ? "true" : "false"); }); }

  function selectBar(k) {
    st.bar = k; var g = $("[data-group='bar']", bk); pick(g, $("[data-bar='" + k + "']", g));
    var note = $("[data-note]", bk), can = CAN[k], msg = "";
    $$("[data-svc]", bk).forEach(function (a) { var ok = !can || can.indexOf(a.getAttribute("data-svc")) > -1; a.setAttribute("aria-disabled", ok ? "false" : "true"); });
    if (st.svc && can && can.indexOf(st.svc.slug) < 0) { msg = NAMES[k].split(" ")[0] + " ne propose pas « " + st.svc.name + " » : choisissez une autre prestation."; st.svc = null; $$("[data-svc]", bk).forEach(function (a) { a.setAttribute("aria-checked", "false"); }); }
    note.textContent = msg; st.slot = null; paint(); recap();
  }
  function selectSvc(a) {
    if (a.getAttribute("aria-disabled") === "true") return;
    st.svc = { slug: a.getAttribute("data-svc"), name: a.getAttribute("data-name"), dur: a.getAttribute("data-dur"), price: a.getAttribute("data-price") };
    pick($("[data-group='svc']", bk), a); $("[data-note]", bk).textContent = ""; paint(); recap();
  }
  function selectSlot(a) {
    if (a.getAttribute("aria-disabled") === "true") return;
    var col = a.closest(".rs-day"), i = cols.indexOf(col), s = a.getAttribute("data-slot");
    if (!st.bar) { var n = $("[data-note]", bk); n.textContent = "Choisissez d'abord un barbier (étape 1)."; return; }
    st.slot = { i: i, s: s, wk: st.wk, text: label(dates[i]) + " à " + s.replace(":", " h "), who: st.bar === "any" ? who(i, s) : null };
    paint(); recap();
  }

  bk.addEventListener("click", function (ev) {
    var a = ev.target.closest("a"); if (!a || !bk.contains(a)) return;
    if (a.hasAttribute("data-bar")) { ev.preventDefault(); selectBar(a.getAttribute("data-bar")); }
    else if (a.hasAttribute("data-svc")) { ev.preventDefault(); selectSvc(a); }
    else if (a.hasAttribute("data-slot")) { ev.preventDefault(); selectSlot(a); }
    else if (a.hasAttribute("data-wk")) { ev.preventDefault(); var w = st.wk + Number(a.getAttribute("data-wk")); if (w >= 0 && w <= 3) { st.wk = w; paint(); } }
    else if (a.hasAttribute("data-copy")) { ev.preventDefault(); copy(a); }
    else if (a.hasAttribute("data-send")) { if (a.getAttribute("aria-disabled") === "true") { ev.preventDefault(); $("[data-msg]", bk).textContent = "Il manque encore un choix : barbier, prestation ou créneau."; } }
  });
  // Clavier : la barre d'espace active aussi les choix, les flèches parcourent le groupe
  bk.addEventListener("keydown", function (ev) {
    var a = ev.target.closest && ev.target.closest("[role='radio']"); if (!a) return;
    if (ev.key === " ") { ev.preventDefault(); a.click(); }
    if (ev.key.indexOf("Arrow") === 0) {
      var items = $$("[role='radio']:not([aria-disabled='true'])", a.closest("[role='radiogroup']")), i = items.indexOf(a), d = (ev.key === "ArrowRight" || ev.key === "ArrowDown") ? 1 : -1;
      var n = items[(i + d + items.length) % items.length]; if (n) { ev.preventDefault(); n.focus(); }
    }
  });

  function summary() {
    var g = function (k) { var e = $("[data-r='" + k + "']", bk); return e ? e.textContent : ""; };
    return "Demande de rendez-vous (démonstration)\nBarbier : " + g("bar") + "\nPrestation : " + g("svc") + "\nCréneau : " + g("slot") + "\nDurée : " + g("dur") + "\nTarif indicatif : " + g("price");
  }
  function copy(a) {
    var msg = $("[data-msg]", bk);
    if (!(st.bar && st.svc && st.slot)) { msg.textContent = "Complétez d'abord les trois étapes."; return; }
    var t = summary();
    function done(ok) { msg.textContent = ok ? "Résumé copié : collez-le dans le formulaire de contact." : "Copie impossible ici : recopiez le ticket ci-dessus."; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { done(true); }, function () { done(false); });
    else done(false);
  }

  // Présélection par l'adresse (#gaston, #rasage…)
  var h = (location.hash || "").replace("#", "");
  if (NAMES[h]) selectBar(h); else paint();
  if (h && !NAMES[h]) { var s = $("[data-svc='" + h + "']", bk); if (s) selectSvc(s); }
  recap();
})();

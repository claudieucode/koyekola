/* Fournil — horaires vivants, filtres de carte, composeur de commande à retirer. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "fournil") return;
  var b = document.body, KEY = "fnBag", MSG = "fnMsg";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("fn-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $("[data-reveal],[data-stamp]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
    // sécurité : rien ne reste invisible
    setTimeout(function () { $("[data-reveal]:not(.is-in),[data-stamp]:not(.is-in)").forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("is-in"); }); }, 1500);
  }

  // Compteurs
  $("[data-count]").forEach(function (el) {
    var n = +el.getAttribute("data-count"); if (reduce || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var t0 = Date.now(); (function f() { var p = Math.min(1, (Date.now() - t0) / 900); el.textContent = Math.round(n * p); if (p < 1) requestAnimationFrame(f); })(); });
    o.observe(el);
  });

  // ---- Horaires vivants ----
  var S = { 0: ["07:00", "13:00"], 1: null, 2: ["06:30", "19:00"], 3: ["06:30", "19:00"], 4: ["06:30", "19:00"], 5: ["06:30", "19:00"], 6: ["06:30", "19:30"] };
  var DN = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var mins = function (t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; };
  var fmt = function (m) { var h = Math.floor(m / 60), r = m % 60; return h + " h" + (r ? " " + pad(r) : ""); };
  var dur = function (m) { return m >= 60 ? Math.floor(m / 60) + " h" + (m % 60 ? " " + pad(m % 60) : "") : m + " min"; };
  function nextOpen(d, m) {
    for (var i = 0; i < 8; i++) { var k = (d + i) % 7, s = S[k]; if (s && (i > 0 || m < mins(s[0]))) return (i === 0 ? "aujourd'hui" : i === 1 ? "demain" : DN[k]) + " à " + fmt(mins(s[0])); }
    return "";
  }
  function status() {
    var n = new Date(), d = n.getDay(), m = n.getHours() * 60 + n.getMinutes(), s = S[d], o = { d: d, m: m, state: "closed", label: "Fermé", detail: "", batch: "", hot: false, live: "" };
    var items = $("[data-hours] .fn-batches li"), bl = [];
    var src = items.length ? items.slice(0, 4) : [];
    src.forEach(function (li) { if (li.getAttribute("data-days").split(",").indexOf("" + d) > -1) bl.push([mins(li.getAttribute("data-t")), li.querySelector("span").textContent]); });
    if (!bl.length) bl = [[405, "Baguettes tradition"], [510, "Croissants et pains au chocolat"], [630, "Pains de campagne et seigle"]].concat(d > 1 ? [[930, "Brioches et cookies du goûter"]] : []);
    if (!s) { o.label = "Fermé aujourd'hui"; o.detail = "Réouverture " + nextOpen(d, m) + "."; o.batch = "Le lundi, le four se repose et le levain aussi."; o.live = "Fermé aujourd'hui · réouverture " + nextOpen(d, m); return o; }
    var op = mins(s[0]), cl = mins(s[1]), last = null, next = null;
    bl.forEach(function (x) { if (x[0] <= m) last = x; else if (!next) next = x; });
    if (m < op) { o.state = "soon"; o.label = "Pas encore ouvert"; o.detail = "Ouvre à " + fmt(op) + " (dans " + dur(op - m) + ")."; }
    else if (m >= cl) { o.label = "Fermé"; o.detail = "Réouverture " + nextOpen(d, m) + "."; }
    else if (cl - m <= 30) { o.state = "soon"; o.label = "Ferme bientôt"; o.detail = "Ferme à " + fmt(cl) + " (dans " + dur(cl - m) + ")."; }
    else { o.state = "open"; o.label = "Ouvert"; o.detail = "Ferme à " + fmt(cl) + " (dans " + dur(cl - m) + ")."; }
    if (m >= op && m < cl) {
      if (last && m - last[0] <= 25) { o.hot = true; o.batch = "Fournée sortie il y a " + (m - last[0] < 2 ? "un instant" : (m - last[0]) + " min") + " : " + last[1] + ". Encore chaud !"; }
      else if (next) o.batch = (last ? "Dernière fournée à " + fmt(last[0]) + ". " : "") + "Prochaine à " + fmt(next[0]) + " : " + next[1] + ".";
      else if (last) o.batch = "Dernière fournée sortie à " + fmt(last[0]) + " : " + last[1] + ". Reste de la journée : les invendus partent vite.";
    } else if (m < op && bl[0]) o.batch = "Première fournée à " + fmt(bl[0][0]) + " : " + bl[0][1] + ".";
    else o.batch = "Plus de fournée aujourd'hui. À demain pour les baguettes du matin.";
    o.live = o.label + " · " + o.detail.replace(/\.$/, "") + (o.hot ? " · fournée sortie !" : "");
    o.last = last; o.next = next; o.open = m >= op && m < cl;
    return o;
  }
  var lastTxt = "";
  function paint() {
    var o = status();
    $("[data-live]").forEach(function (el) { el.textContent = o.live; });
    $("[data-hours]").forEach(function (w) {
      w.setAttribute("data-state", o.state);
      var set = function (k, v) { var e = w.querySelector('[data-hr="' + k + '"]'); if (e && e.textContent !== v) e.textContent = v; };
      set("state", o.label); set("detail", o.detail); set("batch", o.batch);
      var bt = w.querySelector(".fn-hours-batch"); if (bt) bt.classList.toggle("is-hot", o.hot);
      $(".fn-batches li", w).forEach(function (li) {
        var on = li.getAttribute("data-days").split(",").indexOf("" + o.d) > -1, t = mins(li.getAttribute("data-t"));
        li.classList.toggle("is-hide", !on);
        li.classList.toggle("is-done", on && t <= o.m);
        li.classList.toggle("is-next", on && o.next && o.next[0] === t && o.open !== false);
      });
      $("tr[data-d]", w).forEach(function (tr) { tr.classList.toggle("is-today", +tr.getAttribute("data-d") === o.d); });
    });
  }
  paint(); setInterval(paint, 30000);

  // ---- Filtres (carte du jour, carte, boissons) ----
  $("[data-filterbox]").forEach(function (box) {
    var links = $("[data-filter]", box);
    links.forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault(); var f = a.getAttribute("data-filter");
        links.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        $("[data-cat]", box).forEach(function (it) { it.hidden = !(f === "all" || it.getAttribute("data-cat") === f); });
      });
    });
  });

  // ---- Commande à retirer ----
  var bag = {};
  try { bag = JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch (e) { bag = {}; }
  var save = function () { try { sessionStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) { } };
  var eur = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var count = function () { var c = 0; for (var k in bag) c += bag[k][0]; return c; };
  function setQ(id, name, price, d) {
    var q = Math.max(0, Math.min(20, ((bag[id] && bag[id][0]) || 0) + d));
    if (q) bag[id] = [q, name, price]; else delete bag[id];
    save(); sync();
  }
  var pickDay = null, pickSlot = null, order = document.querySelector("[data-order]");
  function text() {
    var L = ["Commande à retirer (démonstration, sans paiement)"], t = 0;
    for (var k in bag) { var x = bag[k]; L.push(x[0] + " × " + x[1] + " (" + eur(x[0] * x[2]) + ")"); t += x[0] * x[2]; }
    L.push("Total indicatif : " + eur(t), "Retrait : " + (pickDay ? pickDay.label : "jour à préciser") + (pickSlot ? ", " + pickSlot.label : ", créneau à préciser"), "Paiement sur place au retrait.", "Nom :");
    return L.join("\n");
  }
  function sync() {
    var c = count();
    $("[data-bagcount]").forEach(function (e) { e.textContent = c; });
    $("[data-bagpill]").forEach(function (e) { e.hidden = !c; });
    $("[data-line]").forEach(function (l) { var q = (bag[l.getAttribute("data-id")] || [0])[0]; l.querySelector("[data-qv]").textContent = q; l.classList.toggle("has-q", q > 0); });
    if (!order) return;
    var ul = order.querySelector("[data-sum]"), t = 0; ul.innerHTML = "";
    for (var k in bag) { var x = bag[k], li = document.createElement("li"); li.innerHTML = "<span></span><b></b>"; li.firstChild.textContent = x[0] + " × " + x[1]; li.lastChild.textContent = eur(x[0] * x[2]); ul.appendChild(li); t += x[0] * x[2]; }
    if (!c) { var e = document.createElement("li"); e.className = "fn-empty"; e.textContent = "Aucun article pour l'instant."; ul.appendChild(e); }
    order.querySelector("[data-total]").textContent = eur(t);
    order.querySelector("[data-when]").textContent = "Retrait : " + (pickDay ? pickDay.label : "à choisir") + (pickSlot ? ", " + pickSlot.label : "");
    var s = order.querySelector("[data-send]"); s.setAttribute("aria-disabled", c ? "false" : "true"); s.href = "/contact?message=" + encodeURIComponent(text());
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a"); if (!a) return;
    if (a.hasAttribute("data-add")) {
      e.preventDefault(); setQ(a.getAttribute("data-id"), a.getAttribute("data-name"), +a.getAttribute("data-price"), 1);
      a.classList.add("is-pop"); setTimeout(function () { a.classList.remove("is-pop"); }, 220);
      $("[data-bagmsg]").forEach(function (m) { m.textContent = "Ajouté : " + a.getAttribute("data-name") + "."; });
    } else if (a.hasAttribute("data-q")) {
      e.preventDefault(); var l = a.closest("[data-line]"); setQ(l.getAttribute("data-id"), l.getAttribute("data-name"), +l.getAttribute("data-price"), +a.getAttribute("data-q"));
    } else if (a.hasAttribute("data-clear")) { e.preventDefault(); bag = {}; save(); sync(); }
    else if (a.hasAttribute("data-copy")) {
      e.preventDefault(); var msg = order.querySelector("[data-sendmsg]");
      try { navigator.clipboard.writeText(text()).then(function () { msg.textContent = "Récapitulatif copié."; }, function () { msg.textContent = "Copie impossible : utilisez « Envoyer »."; }); } catch (x) { msg.textContent = "Copie impossible : utilisez « Envoyer »."; }
    } else if (a.hasAttribute("data-send")) {
      var m2 = order.querySelector("[data-sendmsg]");
      if (!count()) { e.preventDefault(); m2.textContent = "Ajoutez d'abord au moins un article."; return; }
      try { sessionStorage.setItem(MSG, text()); } catch (x) { }
    } else if (a.hasAttribute("data-day") || a.hasAttribute("data-slot")) {
      e.preventDefault(); if (a.getAttribute("aria-disabled") === "true") return;
      var day = a.hasAttribute("data-day"), grp = $(day ? "[data-day]" : "[data-slot]");
      grp.forEach(function (x) { x.setAttribute("aria-checked", x === a ? "true" : "false"); });
      var v = { label: a.textContent }; if (day) { v.today = a.getAttribute("data-today") === "1"; pickDay = v; pickDay.dow = +a.getAttribute("data-dow"); slots(); } else pickSlot = v;
      sync();
    }
  });
  function slots() {
    if (!pickDay) return; var s = S[pickDay.dow], n = new Date(), today = pickDay.today;
    $("[data-slot]").forEach(function (x) {
      var f = mins(x.getAttribute("data-from")), t = mins(x.getAttribute("data-to")), ok = !!s && f >= mins(s[0]) && t <= mins(s[1]) && (!today || f >= n.getHours() * 60 + n.getMinutes() + 60);
      x.setAttribute("aria-disabled", ok ? "false" : "true"); if (!ok && x.getAttribute("aria-checked") === "true") { x.setAttribute("aria-checked", "false"); pickSlot = null; }
    });
  }
  if (order) {
    var box = order.querySelector("[data-days]"), n0 = new Date(), cnt = 0; box.innerHTML = "";
    for (var i = 0; i < 8 && cnt < 4; i++) {
      var dt = new Date(n0.getFullYear(), n0.getMonth(), n0.getDate() + i), s0 = S[dt.getDay()];
      if (!s0 || (i === 0 && n0.getHours() * 60 + n0.getMinutes() > mins(s0[1]) - 120)) continue;
      var a = document.createElement("a"); a.href = "#jour"; a.setAttribute("role", "radio"); a.setAttribute("aria-checked", "false"); a.setAttribute("data-day", ""); a.setAttribute("data-dow", dt.getDay());
      a.textContent = (i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : DN[dt.getDay()].charAt(0).toUpperCase() + DN[dt.getDay()].slice(1)) + " " + dt.getDate() + " " + MS[dt.getMonth()];
      a.setAttribute("data-today", i === 0 ? "1" : "0");
      box.appendChild(a); cnt++;
    }
  }
  sync();

  // Page contact : le récapitulatif préremplit le message
  var area = document.querySelector(".lp-main textarea");
  if (area && !area.value) {
    var txt = ""; try { txt = new URLSearchParams(location.search).get("message") || sessionStorage.getItem(MSG) || ""; } catch (e) { }
    if (txt) { area.value = txt; area.dispatchEvent(new Event("input", { bubbles: true })); }
  }
})();

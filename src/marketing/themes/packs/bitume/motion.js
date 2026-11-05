// Bitume — drops sur horloge, liste d'alerte, fiche pièce, conseiller de taille, filtres. Sans dépendance.
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "bitume") return;
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var H = 36e5, CYC = 672 * H, EPOCH = Date.UTC(2026, 0, 5);
  var S = { veste: ["Veste Chantier", 90, 72], hoodie: ["Hoodie Béton", 228, 48], cargo: ["Cargo Goudron", 378, 96], tee: ["Tee Photocopie", 492, 36], casquette: ["Casquette Palette", 594, 72] };
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };

  /* apparition + inclinaison des affiches à la souris */
  if (!calm && "IntersectionObserver" in window) {
    b.classList.add("bt-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
    var hero = $("[data-hero]");
    if (hero && matchMedia("(pointer:fine)").matches) hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - .5).toFixed(2)); hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - .5).toFixed(2)); });
    $$("[data-count]").forEach(function (el) {
      var to = +el.getAttribute("data-count");
      var o = new IntersectionObserver(function (es) { if (!es[0].isIntersecting) return; o.disconnect(); var t0 = performance.now(); (function f(t) { var p = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); })(t0); });
      o.observe(el);
    });
  }

  /* menu : page courante */
  var path = location.pathname.replace(/\/$/, "") || "/";
  $$(".bt-st[href]").forEach(function (a) { var h = a.getAttribute("href"); if (h !== "/" && path.slice(-h.length) === h && !a.classList.contains("bt-st--alert")) a.setAttribute("aria-current", "page"); });

  /* horloge des drops : cycle de 28 jours, répété pour la démonstration */
  function stateOf(id, now) {
    var d = S[id], pos = (now - EPOCH) % CYC, s = d[1] * H, e = s + d[2] * H, base = now - pos;
    if (pos < s) return { st: "soon", at: base + s };
    if (pos < e) return { st: "live", at: base + e };
    return { st: "out", at: base + CYC + s };
  }
  function fmt(ms, sec) { var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + " j " : "") + pad(h) + " h " + pad(m) + " min" + (sec ? " " + pad(s % 60) + " s" : ""); }
  var LBL = { soon: ["Bientôt", "Ouvre dans"], live: ["En ligne", "Se termine dans"], out: ["Épuisé", "Prochaine série dans"] };
  function setClock(box, ms) { var s = Math.max(0, Math.floor(ms / 1000)), v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 }; $$("[data-u]", box).forEach(function (c) { c.textContent = pad(v[c.getAttribute("data-u")]); }); }
  function tick() {
    var now = Date.now(), best = null, id, r;
    $$("[data-drop]").forEach(function (el) {
      var k = el.getAttribute("data-drop"); if (!S[k]) return;
      var q = stateOf(k, now); el.setAttribute("data-state", q.st);
      $$("[data-badge]", el).forEach(function (x) { x.textContent = LBL[q.st][0]; });
      $$("[data-cdlabel]", el).forEach(function (x) { x.textContent = LBL[q.st][1]; });
      $$("[data-cd]", el).forEach(function (x) { x.textContent = fmt(q.at - now, !calm && q.st !== "out"); });
    });
    for (id in S) { r = stateOf(id, now); var key = (r.st === "live" ? 0 : 1e13) + r.at; if (!best || key < best.k) best = { k: key, id: id, r: r }; }
    $$("[data-next]").forEach(function (box) {
      var q = best.r; $("[data-next-k]", box).textContent = q.st === "live" ? "En ligne maintenant" : "Prochain drop";
      $("[data-next-n]", box).textContent = S[best.id][0];
      $("[data-next-d]", box).textContent = (q.st === "live" ? "Se termine le " : "Ouvre le ") + new Date(q.at).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
      setClock(box, q.at - now);
    });
    var tl = $("[data-tl]"); if (tl) $("[data-nowmark]", tl).style.setProperty("--nx", (((now - EPOCH) % CYC) / CYC * (tl.clientWidth - 6)) + "px");
    $$("[data-store]").forEach(function (li) {
      var wd = "", hr = 0;
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date(now)).forEach(function (p) { if (p.type === "weekday") wd = p.value; if (p.type === "hour") hr = +p.value % 24; });
      var di = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(wd) + 1, dd = li.getAttribute("data-days").split("-"), open = di >= +dd[0] && di <= +dd[1] && hr >= +li.getAttribute("data-from") && hr < +li.getAttribute("data-to"), o = $("[data-open]", li);
      o.textContent = open ? "Ouvert maintenant" : "Fermé"; o.className = "bt-open " + (open ? "is-open" : "is-shut");
    });
  }
  tick(); setInterval(tick, calm ? 30000 : 1000);

  /* filtres : état des drops, décor du lookbook, type de magasin */
  $$("[data-filters]").forEach(function (g) {
    var byState = g.getAttribute("data-filters") === "state", attr = byState ? "data-state" : "data-cat";
    function apply(f) {
      var n = 0; $$(byState ? "[data-drop][data-state]" : "[data-cat]:not(.bt-chip)").forEach(function (el) { var ok = f === "all" || el.getAttribute(attr) === f; el.classList.toggle("is-gone", !ok); if (ok) n++; });
      var em = $("[data-empty]"); if (em) em.classList.toggle("is-show", !n);
    }
    g.addEventListener("click", function (e) {
      var a = e.target.closest("[data-f]"); if (!a) return; e.preventDefault();
      $$("[data-f]", g).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); }); apply(a.getAttribute("data-f"));
    });
    if (byState) setInterval(function () { var on = $(".is-on", g); if (on && on.getAttribute("data-f") !== "all") apply(on.getAttribute("data-f")); }, 2000);
  });

  /* liste d'alerte (mémorisée dans ce navigateur) */
  var list = []; try { list = JSON.parse(localStorage.getItem("bt-alert") || "[]").filter(function (i) { return S[i]; }); } catch (e) {}
  function renderAlert() {
    try { localStorage.setItem("bt-alert", JSON.stringify(list)); } catch (e) {}
    $$("[data-alert-count]").forEach(function (c) { c.textContent = list.length; });
    $$("[data-alert]").forEach(function (a) { var on = list.indexOf(a.getAttribute("data-alert")) > -1; a.setAttribute("aria-pressed", on); a.textContent = on ? "Dans ma liste" : "M'alerter"; });
    var ul = $("[data-alertlist]"); if (ul) {
      ul.textContent = ""; list.forEach(function (id) { var li = document.createElement("li"), s = document.createElement("span"), a = document.createElement("a"); s.textContent = S[id][0]; a.href = "#retirer"; a.textContent = "Retirer"; a.setAttribute("data-del", id); a.setAttribute("aria-label", "Retirer " + S[id][0]); li.appendChild(s); li.appendChild(a); ul.appendChild(li); });
      $("[data-alertempty]").classList.toggle("is-gone", !!list.length);
    }
    var snd = $("[data-alertsend]"); if (snd) snd.setAttribute("href", "/contact?objet=" + encodeURIComponent("Liste d'alerte Bitume : " + (list.map(function (i) { return S[i][0]; }).join(", ") || "à compléter")));
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-alert],[data-del]"); if (!a) return; e.preventDefault();
    var id = a.getAttribute("data-alert") || a.getAttribute("data-del"), i = list.indexOf(id); if (i > -1) list.splice(i, 1); else list.push(id); renderAlert();
  });
  renderAlert();

  /* fiche pièce */
  var tabs = $("[data-ptabs]");
  function lum(h) { var n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; }
  function sum(p) {
    var sw = $(".bt-sw.is-on", p), sz = $(".bt-size.is-on", p), t = $("[data-sum]", p), snd = $("[data-send]", p);
    $("[data-sizename]", p).textContent = sz ? sz.getAttribute("data-size") : "à choisir";
    var msg = $(".bt-h2", p).textContent + " · " + sw.getAttribute("data-swn") + (sz ? " · taille " + sz.getAttribute("data-size") : "");
    t.textContent = sz ? "Résumé : " + msg + ". Envoyez-le par le formulaire de contact." : "Choisissez une taille pour composer votre message.";
    snd.setAttribute("href", "/contact?objet=" + encodeURIComponent("Alerte drop : " + msg));
  }
  function showPanel(id) {
    $$("[data-prodpanel]").forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-prodpanel") === id); });
    $$("[data-ptab]").forEach(function (t) { var on = t.getAttribute("data-ptab") === id; t.classList.toggle("is-on", on); t.setAttribute("aria-pressed", on); });
  }
  if (tabs) {
    b.classList.add("bt-js");
    tabs.addEventListener("click", function (e) { var t = e.target.closest("[data-ptab]"); if (!t) return; e.preventDefault(); showPanel(t.getAttribute("data-ptab")); try { history.replaceState(null, "", "#" + t.getAttribute("data-ptab")); } catch (x) {} });
    var h = (location.hash || "").slice(1); showPanel(S[h] ? h : "veste");
    $$("[data-prodpanel]").forEach(function (p) {
      function paint() { var sw = $(".bt-sw.is-on", p), hx = sw.getAttribute("data-sw"), g = $(".bt-garm", p), dk = lum(hx) < .35; g.style.setProperty("--g", hx); g.style.setProperty("--p", dk ? "#efeadc" : "#111"); $("[data-stage]", p).classList.toggle("is-dark", dk); $("[data-swname]", p).textContent = sw.getAttribute("data-swn"); sum(p); }
      p.addEventListener("click", function (e) {
        var s = e.target.closest("[data-sw]"), z = e.target.closest("[data-size]"); if (!s && !z) return; e.preventDefault();
        if (s) { $$("[data-sw]", p).forEach(function (x) { x.classList.toggle("is-on", x === s); x.setAttribute("aria-pressed", x === s); }); paint(); }
        else if (!z.classList.contains("is-out")) { $$("[data-size]", p).forEach(function (x) { x.classList.toggle("is-on", x === z); x.setAttribute("aria-pressed", x === z); }); sum(p); }
      });
      paint();
    });
  }

  /* conseiller de taille */
  var adv = $("[data-advisor]");
  if (adv) {
    var pick = {}, SZ = ["XS", "S", "M", "L", "XL", "XXL"], NOTE = ["Coupe ajustée : cette taille tombe près du corps.", "Pièces taillées larges : cette taille donne la coupe du lookbook.", "Vous voulez de l'ampleur : cette taille, ou la suivante pour un effet XXL."];
    adv.addEventListener("click", function (e) {
      var c = e.target.closest("[data-adv]"); if (!c) return; e.preventDefault();
      var g = c.getAttribute("data-adv"); pick[g] = +c.getAttribute("data-v");
      $$("[data-adv='" + g + "']", adv).forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      var res = $("[data-advsize]"), note = $("[data-advnote]");
      if (pick.h == null || pick.b == null || pick.c == null) { note.textContent = "Il manque encore : " + [pick.h == null ? "taille" : "", pick.b == null ? "gabarit" : "", pick.c == null ? "coupe" : ""].filter(Boolean).join(", ") + "."; return; }
      var i = Math.max(0, Math.min(5, pick.h + 1 + pick.b + pick.c));
      res.textContent = SZ[i]; note.textContent = NOTE[pick.c + 1];
      $$("tr[data-size]").forEach(function (r) { r.classList.toggle("is-pick", r.getAttribute("data-size") === SZ[i]); });
    });
  }

  /* magasins : pin lié à la fiche */
  $$("[data-store]").forEach(function (li) {
    function on(v) { li.classList.toggle("is-on", v); var p = $("[data-pin='" + li.getAttribute("data-store") + "']"); if (p) p.classList.toggle("is-on", v); }
    li.addEventListener("mouseenter", function () { on(true); }); li.addEventListener("mouseleave", function () { on(false); });
    li.addEventListener("focusin", function () { on(true); }); li.addEventListener("focusout", function () { on(false); });
  });
})();

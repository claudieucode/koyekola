/* Comptoir — badge « ouvert maintenant », filtre des services, devis en 3 questions, recherche dans l'index. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "comptoir") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) b.setAttribute("data-pk-reduced", "1");
  var one = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  // Ouvert maintenant ? (horaires lus dans l'attribut data-hours : par jour, ouverture/fermeture du matin puis de l'après-midi)
  var open = one("[data-cp-open]");
  if (open) {
    var hrs = []; try { hrs = JSON.parse(open.getAttribute("data-hours")); } catch (e) {}
    var now = new Date(), day = (now.getDay() + 6) % 7, h = now.getHours() + now.getMinutes() / 60, d = hrs[day] || [], isOpen = false;
    for (var i = 0; i + 1 < d.length; i += 2) if (h >= d[i] && h < d[i + 1]) isOpen = true;
    open.textContent = isOpen ? "Ouvert maintenant" : "Fermé pour le moment";
    open.className += isOpen ? " is-open" : " is-closed";
  }

  // Services : recherche et filtres par famille
  var tools = one("[data-cp-tools]");
  if (tools) {
    var cards = all("[data-cp-list] .cp-svc"), cnt = one("[data-cp-count]"), none = one("[data-cp-none]"), cats = [];
    cards.forEach(function (c) { var k = c.getAttribute("data-c"); if (cats.indexOf(k) < 0) cats.push(k); });
    var inp = document.createElement("input"); inp.type = "search"; inp.className = "cp-find"; inp.placeholder = "Un mot : clé, fuite, peinture…"; inp.setAttribute("aria-label", "Chercher un service"); inp.autocomplete = "off"; tools.appendChild(inp);
    var chips = ["Tous"].concat(cats).map(function (c, i) { var bt = document.createElement("button"); bt.type = "button"; bt.className = "cp-chip"; bt.textContent = c; bt.setAttribute("data-c", i ? c : ""); bt.setAttribute("aria-pressed", i ? "false" : "true"); tools.appendChild(bt); return bt; });
    var cur = "";
    var apply = function () {
      var q = norm(inp.value).split(/\s+/).filter(Boolean), n = 0;
      cards.forEach(function (c) { var ok = (!cur || c.getAttribute("data-c") === cur) && q.every(function (w) { return norm(c.getAttribute("data-s")).indexOf(w) >= 0; }); c.hidden = !ok; if (ok) n++; });
      if (cnt) cnt.textContent = plural(n, "service"); if (none) none.hidden = n > 0;
    };
    inp.addEventListener("input", apply);
    chips.forEach(function (bt) { bt.addEventListener("click", function () { cur = bt.getAttribute("data-c"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); }); apply(); }); });
  }

  // Devis en 3 questions
  var wiz = one("[data-cp-wiz]");
  if (wiz) {
    var TYPE = { depannage: ["Dépannage", 90], entretien: ["Entretien", 120], travaux: ["Travaux", 220], montage: ["Montage et installation", 70] };
    var SIZE = { petit: ["petit besoin", 1], moyen: ["besoin moyen", 2.1], grand: ["grand besoin", 4.2] };
    var WHEN = { urgent: ["sous 24 h", 1.3], semaine: ["cette semaine", 1], planifie: ["à planifier", 0.95] };
    var ans = {}, step = 1, panes = all("[data-cp-p]", wiz), marks = all("[data-cp-s]", wiz), back = one("[data-cp-back]", wiz);
    var fmt = function (n) { return Math.round(n / 5) * 5; };
    var show = function (n) {
      step = n;
      panes.forEach(function (p) { p.hidden = +p.getAttribute("data-cp-p") !== n; });
      marks.forEach(function (m) { var k = +m.getAttribute("data-cp-s"); m.classList.toggle("is-on", k === n); m.classList.toggle("is-done", k < n); });
      if (back) back.hidden = n === 1 || n === 4;
    };
    var result = function () {
      var t = TYPE[ans[1]], s = SIZE[ans[2]], w = WHEN[ans[3]], mid = t[1] * s[1] * w[1], lo = fmt(mid * 0.85), hi = fmt(mid * 1.15);
      one("[data-cp-range]", wiz).textContent = lo + " – " + hi + " €";
      var recap = t[0] + ", " + s[0] + ", " + w[0] + " : fourchette indicative de " + lo + " à " + hi + " € TTC.";
      one("[data-cp-recap]", wiz).textContent = recap;
      one("[data-cp-calc]", wiz).innerHTML = "<div><dt>Base « " + t[0] + " »</dt><dd>" + t[1] + " €</dd></div><div><dt>Taille : " + s[0] + "</dt><dd>× " + String(s[1]).replace(".", ",") + "</dd></div><div><dt>Délai : " + w[0] + "</dt><dd>× " + String(w[1]).replace(".", ",") + "</dd></div><div><dt>Fourchette (± 15 %)</dt><dd>" + lo + " – " + hi + " €</dd></div>";
      store.set("cp-recap", recap);
    };
    wiz.addEventListener("click", function (e) {
      var o = e.target.closest ? e.target.closest(".cp-opt") : null, r = e.target.closest ? e.target.closest("[data-cp-reset]") : null, bk = e.target.closest ? e.target.closest("[data-cp-back]") : null;
      if (o) { e.preventDefault(); var q = +o.getAttribute("data-q"); ans[q] = o.getAttribute("data-v"); all('.cp-opt[data-q="' + q + '"]', wiz).forEach(function (x) { x.setAttribute("aria-checked", x === o ? "true" : "false"); }); if (q === 3) result(); show(q + 1); var nx = one('[data-cp-p="' + (q + 1) + '"] .cp-opt, [data-cp-send]', wiz); if (nx && nx.focus) nx.focus(); }
      else if (r) { e.preventDefault(); ans = {}; all(".cp-opt", wiz).forEach(function (x) { x.setAttribute("aria-checked", "false"); }); show(1); }
      else if (bk) { e.preventDefault(); show(Math.max(1, step - 1)); }
    });
    wiz.addEventListener("keydown", function (e) {
      var o = e.target; if (!o.classList || !o.classList.contains("cp-opt")) return;
      if (e.key === " ") { e.preventDefault(); o.click(); }
      var g = all(".cp-opt", o.parentNode), i = g.indexOf(o);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); g[(i + 1) % g.length].focus(); }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); g[(i + g.length - 1) % g.length].focus(); }
    });
    show(1);
  }

  // Formulaire de contact : reprend le récapitulatif du devis
  var rec = store.get("cp-recap"), box = one("[data-cp-recapbox]");
  if (rec && box) {
    box.hidden = false; one("[data-cp-recapt]", box).textContent = rec;
    var ta = one(".lp-main textarea");
    if (ta && !ta.value) { ta.value = "Bonjour, je souhaite un devis. " + rec; ta.dispatchEvent(new Event("input", { bubbles: true })); }
  }

  // Page de recherche : filtre l'index selon ?q=
  var idx = one("[data-cp-index]");
  if (idx) {
    var cs = all(".cp-svc", idx), empty = one("[data-cp-empty]"), rc = one("[data-cp-rcount]"), qs = "";
    try { qs = new URLSearchParams(location.search).get("q") || ""; } catch (e) {}
    var inp2 = one(".lp-main input[type=search], .lp-main input[name=q]");
    var run = function (val) {
      var q = norm(val).split(/\s+/).filter(Boolean), n = 0;
      cs.forEach(function (c) { var ok = q.every(function (w) { return norm(c.getAttribute("data-s")).indexOf(w) >= 0; }); c.hidden = !ok; if (ok) n++; });
      if (rc) rc.textContent = q.length ? plural(n, "résultat") + " pour « " + val + " »" : "Saisissez un mot dans la recherche, ou parcourez la liste.";
      if (empty) { empty.hidden = !(q.length && !n); var s = one("[data-cp-q]", empty); if (s) s.textContent = val; }
    };
    if (qs) { run(qs); if (inp2 && !inp2.value) inp2.value = qs; }
    if (inp2) inp2.addEventListener("input", function () { run(inp2.value); });
  }
})();

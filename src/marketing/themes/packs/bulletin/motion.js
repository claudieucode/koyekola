// Bulletin — bandeau d'info tournant, fil d'actualités filtrable (type, année, mot), recherche instantanée, compteurs de chiffres clés, compte à rebours de l'agenda. Sans dépendance ; inactif hors du thème Bulletin.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "bulletin") return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches || /^(calm|off)$/.test(document.body.getAttribute("data-pk-motion") || "");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  var burger = $(".bu-burger");
  if (burger) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") burger.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!burger.contains(e.target)) burger.removeAttribute("open"); });
  }

  // Bandeau d'info : fait défiler les titres toutes les 6 secondes, s'arrête au survol et sous « réduire les animations »
  var tk = $("[data-ticker-a]");
  if (tk && !calm) {
    var titles = [], pos = 0, hold = false;
    var all = ["Résultats du troisième trimestre : chiffre d'affaires en hausse de 6,4 %", "Brémond ouvre un centre de service à Lyon-Vénissieux", "Lancement de la pompe VX-300 : 22 % d'énergie en moins", "Quarante apprentis rejoignent les ateliers de Cholet"];
    titles = all.slice();
    tk.parentNode.addEventListener("mouseenter", function () { hold = true; }); tk.parentNode.addEventListener("mouseleave", function () { hold = false; });
    setInterval(function () {
      if (hold || document.hidden) return;
      pos = (pos + 1) % titles.length; tk.textContent = titles[pos]; tk.style.animation = "none"; void tk.offsetWidth; tk.style.animation = "";
    }, 6000);
  }

  // Fil d'actualités : filtres combinés (type, année) + mot saisi
  $$("[data-filter]").forEach(function (box) {
    var items = $$("[data-list] > li", box), none = $("[data-none]", box), count = $("[data-count]", box), state = {}, word = "";
    var apply = function () {
      var shown = 0;
      items.forEach(function (li) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || li.getAttribute("data-" + k) === state[k]; });
        if (ok && word) ok = word.split(/\s+/).every(function (w) { return (li.getAttribute("data-q") || "").indexOf(w) >= 0; });
        li.classList.toggle("is-hidden", !ok); if (ok) shown++;
      });
      if (count) count.innerHTML = "<b>" + shown + "</b> " + (box.getAttribute("data-filter") === "presse" ? (shown > 1 ? "communiqués" : "communiqué") : (shown > 1 ? "actualités" : "actualité"));
      if (none) none.hidden = shown !== 0;
    };
    $$("[data-chips]", box).forEach(function (ul) {
      var key = ul.getAttribute("data-chips");
      ul.addEventListener("click", function (e) {
        var a = e.target.closest("a"); if (!a) return; e.preventDefault();
        $$("a", ul).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
        state[key] = a.getAttribute("data-v") === "tout" ? "" : a.getAttribute("data-v"); apply();
      });
    });
    var qb = $("[data-q-box]", box);
    if (qb) { var input = document.createElement("input"); input.type = "search"; input.placeholder = "VX-300, carbone, Cholet…"; input.setAttribute("aria-label", "Filtrer par mot"); input.autocomplete = "off"; qb.appendChild(input); input.addEventListener("input", function () { word = norm(input.value).trim(); apply(); }); }
    var reset = $("[data-reset]", box);
    if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); state = {}; word = ""; if (qb && $("input", qb)) $("input", qb).value = ""; $$("[data-chips] a", box).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-v") === "tout"); }); apply(); });
  });

  // Recherche instantanée
  var sr = $("[data-search]");
  if (sr) {
    var list = $$("[data-results] > li", sr), nn = $("[data-none]", sr), hint = $("[data-hint]", sr);
    var wrap = document.createElement("div"), inp = document.createElement("input");
    wrap.className = "bu-sf"; inp.type = "search"; inp.placeholder = "résultats, pompe, apprentis, Lyon…"; inp.setAttribute("aria-label", "Rechercher une actualité"); inp.autocomplete = "off";
    wrap.appendChild(inp); sr.insertBefore(wrap, sr.firstChild);
    var run = function () {
      var q = norm(inp.value).trim(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      list.forEach(function (li) { var ok = !q || words.every(function (w) { return li.getAttribute("data-q").indexOf(w) >= 0; }); li.classList.toggle("is-hidden", !ok); if (ok) shown++; });
      nn.hidden = shown !== 0;
      if (hint) hint.textContent = !q ? "Saisissez quelques lettres pour filtrer les " + list.length + " actualités." : shown + (shown > 1 ? " actualités trouvées" : " actualité trouvée") + " pour « " + inp.value.trim() + " ».";
    };
    inp.addEventListener("input", run);
    var qs = new URLSearchParams(location.search).get("q"); if (qs) { inp.value = qs; run(); }
  }

  // Chiffres clés : comptent jusqu'à leur valeur à l'apparition (valeur finale écrite d'emblée sans animation)
  var nums = $$("[data-count]").filter(function (el) { return el.tagName === "B" && /^\d+$/.test(el.getAttribute("data-count")); });
  if (nums.length && !calm && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, end = +el.getAttribute("data-count"), t0 = performance.now(), fmt = function (n) { return n.toLocaleString("fr-FR"); };
        var step = function (t) { var p = Math.min(1, (t - t0) / 1100), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = fmt(v); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }

  // Agenda : première échéance à venir par rapport à la date du visiteur, compte à rebours en jours
  $$("[data-next]").forEach(function (box) {
    var lis = $("[data-agenda] > li"), now = new Date(); now.setHours(0, 0, 0, 0);
    var FALL = [["2027-02-04", "Chiffre d'affaires du quatrième trimestre"], ["2027-02-25", "Résultats annuels 2026"], ["2027-05-19", "Assemblée générale des actionnaires"], ["2027-07-22", "Résultats du premier semestre 2027"]];
    var dates = lis.length ? lis.map(function (li) { return { li: li, d: new Date(li.getAttribute("data-date") + "T00:00:00"), t: $("h2", li).textContent }; })
      : FALL.map(function (x) { return { li: document.createElement("li"), d: new Date(x[0] + "T00:00:00"), t: x[1] }; });
    var nextOne = null;
    dates.forEach(function (x) { if (x.d < now) x.li.classList.add("is-past"); else if (!nextOne) nextOne = x; });
    var n = $("[data-next-n]", box), d = $("[data-next-d]", box), t = $("[data-next-t]", box);
    if (!nextOne) { if (n) n.parentNode.hidden = true; if (t) t.textContent = "Aucune échéance à venir pour le moment."; return; }
    n.textContent = Math.round((nextOne.d - now) / 864e5);
    d.textContent = nextOne.d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    t.textContent = nextOne.t;
  });
})();

// Étape — filtres (rubrique, saison, continent), composeur d'itinéraire (jours, km, budget), recherche instantanée, apparition douce. Sans dépendance ; inactif hors du thème Étape.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "etape") return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches || /^(calm|off)$/.test(document.body.getAttribute("data-pk-motion") || "");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // Menu mobile : se referme avec Échap ou un clic ailleurs
  var burger = $(".et-burger");
  if (burger) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") burger.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!burger.contains(e.target)) burger.removeAttribute("open"); });
  }

  // Filtres combinés : chaque groupe de pastilles (data-chips="clé") filtre les éléments portant data-<clé>
  $$("[data-filter]").forEach(function (box) {
    var items = $$("[data-list] > li", box), none = $("[data-none]", box), count = $("[data-count]", box), state = {};
    var unit = box.getAttribute("data-filter") === "dest" ? ["destination", "destinations"] : ["article", "articles"];
    function apply() {
      var shown = 0;
      items.forEach(function (li) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || li.getAttribute("data-" + k) === state[k]; });
        li.classList.toggle("is-hidden", !ok); if (ok) shown++;
      });
      if (count) count.innerHTML = "<b>" + shown + "</b> " + (shown > 1 ? unit[1] : unit[0]);
      if (none) none.hidden = shown !== 0;
    }
    $$("[data-chips]", box).forEach(function (ul) {
      var key = ul.getAttribute("data-chips");
      ul.addEventListener("click", function (e) {
        var a = e.target.closest("a"); if (!a) return; e.preventDefault();
        $$("a", ul).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
        state[key] = a.getAttribute("data-v") === "tout" ? "" : a.getAttribute("data-v"); apply();
      });
    });
    var reset = $("[data-reset]", box);
    if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); state = {}; $$("[data-chips] a", box).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-v") === "tout"); }); apply(); });
  });

  // Composeur d'itinéraire : on coche ou décoche les étapes, les totaux se recalculent
  var route = $("[data-route]");
  if (route) {
    var stages = $$(".et-stage", route), totals = { n: $("[data-t=n]", route), j: $("[data-t=j]", route), km: $("[data-t=km]", route), eur: $("[data-t=eur]", route) };
    var fmt = function (n) { return n.toLocaleString("fr-FR"); };
    // Les kilomètres des étapes retirées entre deux étapes gardées s'additionnent (on les parcourt quand même en route)
    var skipped = function (s) { var extra = 0, p = s.previousElementSibling; while (p && p.classList.contains("is-off")) { extra += +p.getAttribute("data-km"); p = p.previousElementSibling; } return extra; };
    var calc = function () {
      var on = stages.filter(function (s) { return !s.classList.contains("is-off"); }), j = 0, km = 0, eur = 0;
      on.forEach(function (s, i) { j += +s.getAttribute("data-j"); eur += +s.getAttribute("data-eur"); if (i > 0) km += +s.getAttribute("data-km") + skipped(s); });
      totals.n.textContent = on.length; totals.j.textContent = j; totals.km.textContent = fmt(km); totals.eur.textContent = fmt(eur);
    };
    stages.forEach(function (s) {
      var b = document.createElement("button"); b.type = "button"; b.className = "et-pick"; b.setAttribute("aria-pressed", "true"); b.textContent = "Garder cette étape";
      s.querySelector("div").appendChild(b);
      b.addEventListener("click", function () { var off = !s.classList.contains("is-off"); s.classList.toggle("is-off", off); b.setAttribute("aria-pressed", off ? "false" : "true"); b.textContent = off ? "Remettre cette étape" : "Garder cette étape"; calc(); });
    });
    var rs = $("[data-reset]", route);
    if (rs) rs.addEventListener("click", function (e) { e.preventDefault(); stages.forEach(function (s) { s.classList.remove("is-off"); var b = $(".et-pick", s); if (b) { b.setAttribute("aria-pressed", "true"); b.textContent = "Garder cette étape"; } }); calc(); });
    calc();
  }

  // Recherche instantanée dans les articles du carnet, avec état « aucun résultat »
  var sr = $("[data-search]");
  if (sr) {
    var list = $$("[data-results] > li", sr), none = $("[data-none]", sr), hint = $("[data-hint]", sr);
    var form = document.createElement("div"); form.className = "et-sf";
    var input = document.createElement("input"); input.type = "search"; input.placeholder = "Lisbonne, budget, train de nuit…"; input.setAttribute("aria-label", "Rechercher dans le journal"); input.autocomplete = "off";
    form.appendChild(input); sr.insertBefore(form, sr.firstChild);
    var run = function () {
      var q = norm(input.value).trim(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      list.forEach(function (li) { var ok = !q || words.every(function (w) { return li.getAttribute("data-q").indexOf(w) >= 0; }); li.classList.toggle("is-hidden", !ok); if (ok) shown++; });
      none.hidden = shown !== 0;
      if (hint) hint.textContent = !q ? "Saisissez quelques lettres pour filtrer les " + list.length + " articles du carnet." : shown + (shown > 1 ? " articles trouvés" : " article trouvé") + " pour « " + input.value.trim() + " ».";
    };
    input.addEventListener("input", run);
    var qs = new URLSearchParams(location.search).get("q"); if (qs) { input.value = qs; run(); }
  }

  // Apparition douce des cartes au défilement
  if (!calm && "IntersectionObserver" in window) {
    document.body.classList.add("et-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $(".et-card,.et-dest,.et-stage,.et-bag,.et-person").forEach(function (el) { el.setAttribute("data-reveal", ""); if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in"); else io.observe(el); });
    setTimeout(function () { $("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); }); }, 2500);
  }
})();

// Commun — calculateur de cotisation, agenda et missions filtrables, recherche instantanée, compteurs. Sans dépendance ; inactif hors du thème Commun.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "commun") return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches || /^(calm|off)$/.test(document.body.getAttribute("data-pk-motion") || "");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var fmt = function (n) { return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }); };

  var burger = $(".cm-burger");
  if (burger) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") burger.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!burger.contains(e.target)) burger.removeAttribute("open"); });
  }

  // Filtres combinés (agenda : type + mois ; missions : pôle + engagement)
  $$("[data-filter]").forEach(function (box) {
    var items = $$("[data-list] > li", box), none = $("[data-none]", box), count = $("[data-count]", box), state = {};
    var unit = box.getAttribute("data-filter") === "missions" ? ["mission", "missions"] : ["rendez-vous", "rendez-vous"];
    var apply = function () {
      var shown = 0;
      items.forEach(function (li) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || li.getAttribute("data-" + k) === state[k]; });
        li.classList.toggle("is-hidden", !ok); if (ok) shown++;
      });
      if (count) count.innerHTML = "<b>" + shown + "</b> " + (shown > 1 ? unit[1] : unit[0]);
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
    var reset = $("[data-reset]", box);
    if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); state = {}; $$("[data-chips] a", box).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-v") === "tout"); }); apply(); });
  });

  // Calculateur de cotisation : formule + don libre → total, réduction (66 % du don) et coût réel
  var calc = $("[data-calc]");
  if (calc) {
    var items = $$("[data-formules] > li", calc), cot = 15, don = 0;
    var out = { cot: $("[data-t=cot]", calc), don: $("[data-t=don]", calc), tot: $("[data-t=tot]", calc), red: $("[data-t=red]", calc), net: $("[data-t=net]", calc) };
    var wrap = document.createElement("div"), lab = document.createElement("label"), inp = document.createElement("input");
    wrap.className = "cm-don"; lab.textContent = "Don libre en plus (en euros)"; lab.setAttribute("for", "cm-don-input");
    inp.id = "cm-don-input"; inp.type = "number"; inp.min = "0"; inp.max = "5000"; inp.step = "1"; inp.value = "0"; inp.inputMode = "numeric";
    wrap.appendChild(lab); wrap.appendChild(inp); $("[data-formules]", calc).parentNode.appendChild(wrap);
    var upd = function () {
      var red = Math.round(don * 0.66 * 100) / 100;
      out.cot.textContent = fmt(cot); out.don.textContent = fmt(don); out.tot.textContent = fmt(cot + don); out.red.textContent = fmt(red); out.net.textContent = fmt(cot + don - red);
    };
    items.forEach(function (li) {
      li.setAttribute("tabindex", "0"); li.setAttribute("role", "button"); li.setAttribute("aria-pressed", li.classList.contains("is-on") ? "true" : "false");
      var pick = function () { items.forEach(function (x) { x.classList.toggle("is-on", x === li); x.setAttribute("aria-pressed", x === li ? "true" : "false"); }); cot = +li.getAttribute("data-v"); upd(); };
      li.addEventListener("click", pick);
      li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
    inp.addEventListener("input", function () { var v = Math.max(0, Math.min(5000, Math.floor(+inp.value || 0))); don = v; upd(); });
    upd();
  }

  // Recherche instantanée
  var sr = $("[data-search]");
  if (sr) {
    var list = $$("[data-results] > li", sr), nn = $("[data-none]", sr), hint = $("[data-hint]", sr);
    var w2 = document.createElement("div"), i2 = document.createElement("input");
    w2.className = "cm-sf"; i2.type = "search"; i2.placeholder = "jardin, soupe, devoirs, Repair Café…"; i2.setAttribute("aria-label", "Rechercher dans le site"); i2.autocomplete = "off";
    w2.appendChild(i2); sr.insertBefore(w2, sr.firstChild);
    var run = function () {
      var q = norm(i2.value).trim(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      list.forEach(function (li) { var ok = !q || words.every(function (w) { return li.getAttribute("data-q").indexOf(w) >= 0; }); li.classList.toggle("is-hidden", !ok); if (ok) shown++; });
      nn.hidden = shown !== 0;
      if (hint) hint.textContent = !q ? "Saisissez quelques lettres pour filtrer les " + list.length + " contenus." : shown + (shown > 1 ? " contenus trouvés" : " contenu trouvé") + " pour « " + i2.value.trim() + " ».";
    };
    i2.addEventListener("input", run);
    var qs = new URLSearchParams(location.search).get("q"); if (qs) { i2.value = qs; run(); }
  }

  // Chiffres de l'accueil : comptent jusqu'à leur valeur à l'apparition
  var nums = $$("b[data-count]").filter(function (el) { return /^\d+$/.test(el.getAttribute("data-count")); });
  if (nums.length && !calm && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; io.unobserve(e.target);
        var el = e.target, end = +el.getAttribute("data-count"), t0 = performance.now();
        var step = function (t) { var p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (el) { io.observe(el); });
  }
})();

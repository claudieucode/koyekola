// Courrier — archives filtrables (rubrique, mois), recherche instantanée, bascule mensuel / annuel, barre de lecture, bande d'abonnement fermable. Sans dépendance ; inactif hors du thème Courrier.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "courrier") return;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches || /^(calm|off)$/.test(document.body.getAttribute("data-pk-motion") || "");
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  var burger = $(".co-burger");
  if (burger) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") burger.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!burger.contains(e.target)) burger.removeAttribute("open"); });
  }

  // Archives : deux groupes de pastilles (rubrique, mois) combinés, compteur, état « aucun numéro »
  $$("[data-filter]").forEach(function (box) {
    var items = $$("[data-list] > li", box), none = $("[data-none]", box), count = $("[data-count]", box), state = {};
    var apply = function () {
      var shown = 0;
      items.forEach(function (li) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || li.getAttribute("data-" + k) === state[k]; });
        li.classList.toggle("is-hidden", !ok); if (ok) shown++;
      });
      if (count) count.innerHTML = "<b>" + shown + "</b> " + (shown > 1 ? "numéros" : "numéro");
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

  // Recherche instantanée dans les numéros
  var sr = $("[data-search]");
  if (sr) {
    var list = $$("[data-results] > li", sr), none = $("[data-none]", sr), hint = $("[data-hint]", sr);
    var input = document.createElement("input"), wrap = document.createElement("div");
    wrap.className = "co-sf"; input.type = "search"; input.placeholder = "eau, retraites, abeilles, Louise…"; input.setAttribute("aria-label", "Rechercher dans les numéros"); input.autocomplete = "off";
    wrap.appendChild(input); sr.insertBefore(wrap, sr.firstChild);
    var run = function () {
      var q = norm(input.value).trim(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      list.forEach(function (li) { var ok = !q || words.every(function (w) { return li.getAttribute("data-q").indexOf(w) >= 0; }); li.classList.toggle("is-hidden", !ok); if (ok) shown++; });
      none.hidden = shown !== 0;
      if (hint) hint.textContent = !q ? "Saisissez quelques lettres pour filtrer les " + list.length + " numéros." : shown + (shown > 1 ? " numéros trouvés" : " numéro trouvé") + " pour « " + input.value.trim() + " ».";
    };
    input.addEventListener("input", run);
    var qs = new URLSearchParams(location.search).get("q"); if (qs) { input.value = qs; run(); }
  }

  // Abonnement : bascule mensuel / annuel (le prix et l'économie se recalculent)
  var plans = $("[data-plans]");
  if (plans) {
    var price = $("[data-price]", plans), per = $("[data-per]", plans), save = $("[data-save]", plans);
    var m = +price.getAttribute("data-m"), a = +price.getAttribute("data-a");
    $$("[data-bill]", plans).forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        $$("[data-bill]", plans).forEach(function (x) { x.classList.toggle("is-on", x === btn); x.setAttribute("aria-pressed", x === btn ? "true" : "false"); });
        var yearly = btn.getAttribute("data-bill") === "a";
        price.textContent = yearly ? a : m; per.textContent = yearly ? "par an" : "par mois";
        save.innerHTML = yearly ? "Soit <b>" + (a / 12).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " € par mois</b>, deux mois offerts." : "Passez à l'annuel : <b>" + (m * 12 - a) + " € d'économie</b> par an.";
      });
    });
  }

  // Barre de lecture fine sur la page d'un numéro
  var art = $(".co-issue");
  if (art && !calm) {
    var bar = document.createElement("div"); bar.className = "co-read"; bar.setAttribute("aria-hidden", "true"); document.body.appendChild(bar);
    var upd = function () { var r = art.getBoundingClientRect(), h = r.height - window.innerHeight; bar.style.width = (h > 0 ? Math.min(100, Math.max(0, -r.top / h * 100)) : 0) + "%"; };
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  }

  // Bande d'abonnement mobile : fermable pour la session
  var bandeau = $("[data-subbar]");
  if (bandeau) {
    var key = "courrier-bande", gone = false;
    try { gone = sessionStorage.getItem(key) === "1"; } catch (e) { gone = false; }
    if (gone) bandeau.classList.add("is-closed");
    else {
      var x = document.createElement("button"); x.type = "button"; x.className = "co-subbar-x"; x.setAttribute("aria-label", "Fermer la bande d'abonnement"); x.textContent = "×";
      var inner = $(".co-subbar-in", bandeau); inner.appendChild(x);
      x.addEventListener("click", function () { bandeau.classList.add("is-closed"); try { sessionStorage.setItem(key, "1"); } catch (e) { /* stockage indisponible */ } });
    }
  }
})();

// KOLAKISA — sélecteur de site de « Mon espace » : ouverture/fermeture accessibles, recherche, protection des modifications non enregistrées.
// Les options sont de vrais liens : sans ce script, le changement de site fonctionne quand même (seules la recherche et la confirmation disparaissent).
(function () {
  var root = document.querySelector("[data-dash-site]");
  var main = document.getElementById("main");
  var dirty = false;
  var siteOfPage = root && root.querySelector(".dash-site-opt.is-current");
  if (main) {
    main.addEventListener("input", function (e) { if (e.target && e.target.closest("form") && e.target.closest("form").method.toLowerCase() === "post") dirty = true; });
    main.addEventListener("submit", function () { dirty = false; });
    // Toute soumission porte le site affiché : un autre onglet ne peut pas rediriger l'écriture vers un autre site
    main.addEventListener("submit", function (e) {
      var f = e.target; var cur = root && root.getAttribute("data-current-site");
      if (!f || f.method.toLowerCase() !== "post" || !cur || f.querySelector('input[name="site"]')) return;
      var h = document.createElement("input"); h.type = "hidden"; h.name = "site"; h.value = cur; f.appendChild(h);
    }, true);
  }
  if (!root) return;
  var btn = root.querySelector("[data-dash-site-toggle]");
  var pop = root.querySelector(".dash-site-pop");
  var search = root.querySelector("[data-dash-site-search]");
  var empty = root.querySelector("[data-dash-site-empty]");
  function open(v) {
    pop.hidden = !v; btn.setAttribute("aria-expanded", v ? "true" : "false");
    if (v) { (search || pop.querySelector(".is-current") || pop.querySelector("a")).focus(); } else { btn.focus(); }
  }
  btn.addEventListener("click", function () { open(pop.hidden); });
  document.addEventListener("click", function (e) { if (!pop.hidden && !root.contains(e.target)) { pop.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
  root.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !pop.hidden) { e.preventDefault(); open(false); return; }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && !pop.hidden) {
      var links = Array.prototype.filter.call(pop.querySelectorAll("li:not([hidden]) a"), Boolean); if (!links.length) return;
      var i = links.indexOf(document.activeElement); e.preventDefault();
      links[(i + (e.key === "ArrowDown" ? 1 : links.length - 1) + (i < 0 ? 1 : 0)) % links.length].focus();
    }
  });
  if (search) search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase(); var shown = 0;
    pop.querySelectorAll("li[data-site-name]").forEach(function (li) { var ok = !q || li.getAttribute("data-site-name").indexOf(q) !== -1; li.hidden = !ok; if (ok) shown++; });
    empty.hidden = shown !== 0;
  });
  pop.addEventListener("click", function (e) {
    var a = e.target.closest("a.dash-site-opt"); if (!a || !dirty || a.classList.contains("is-current")) return;
    if (!window.confirm("Des modifications ne sont pas enregistrées. Changer de site les fera perdre. Continuer ?")) e.preventDefault();
  });
  if (siteOfPage) root.setAttribute("data-current-site", siteOfPage.getAttribute("href").indexOf("site=") === -1 ? "principal" : new URL(siteOfPage.href, location.href).searchParams.get("site"));
})();

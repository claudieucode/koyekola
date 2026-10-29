// Funnel Studio : recherche et filtre de la liste des tunnels (affichage seulement : aucune donnée écrite, aucune requête)
// et onglets de l'espace d'un tunnel (Étapes, Statistiques, Automatisations, Paramètres).
(function () {
  "use strict";

  // ---------- Liste des tunnels ----------
  var input = document.querySelector("[data-fs-search]");
  var list = document.querySelector("[data-fs-list]");
  if (input && list) {
    var cards = Array.prototype.slice.call(list.querySelectorAll(".fs-card"));
    var none = document.querySelector("[data-fs-nomatch]");
    var live = document.querySelector("[data-fs-count]");
    var filter = document.querySelector("[data-fs-filter]");
    var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim(); };
    var names = cards.map(function (c) { return norm(c.getAttribute("data-fs-name")); });
    var frame = 0;
    var apply = function () {
      var q = norm(input.value), st = filter ? filter.value : "", shown = 0;
      cards.forEach(function (c, i) { var ok = (!q || names[i].indexOf(q) !== -1) && (!st || c.getAttribute("data-fs-state") === st); c.hidden = !ok; if (ok) shown++; });
      if (none) none.hidden = shown !== 0;
      if (live) live.textContent = q || st ? shown + (shown > 1 ? " tunnels affichés" : " tunnel affiché") : "";
    };
    if (filter) filter.addEventListener("change", apply);
    input.addEventListener("input", function () { cancelAnimationFrame(frame); frame = requestAnimationFrame(apply); });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape" && input.value) { input.value = ""; apply(); } });
  }

  // ---------- Espace d'un tunnel : onglets ----------
  var ws = document.querySelector("[data-fs-ws]");
  if (ws) {
    var tabs = Array.prototype.slice.call(ws.querySelectorAll('[role="tab"][data-fs-tab]'));
    var keys = tabs.map(function (t) { return t.getAttribute("data-fs-tab"); });
    var activate = function (key, focus) {
      if (keys.indexOf(key) === -1) return;
      ws.setAttribute("data-active", key);
      tabs.forEach(function (t) { var on = t.getAttribute("data-fs-tab") === key; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; if (on && focus) t.focus(); });
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t.getAttribute("data-fs-tab")); try { history.replaceState(null, "", "#" + t.getAttribute("aria-controls").replace("fn-panel-", "fn-")); } catch (e) { /* rien */ } });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
        if (n === null) return;
        e.preventDefault();
        activate(keys[(n + tabs.length) % tabs.length], true);
      });
    });
    // Une ancre (étape, statistiques, réglages…) ouvre l'onglet qui la contient, puis y fait défiler
    var fromHash = function () {
      var id = decodeURIComponent((location.hash || "").slice(1));
      var el = id ? document.getElementById(id) : null;
      var panel = el && el.closest ? el.closest("[data-fs-panel]") : null;
      if (panel) { activate(panel.getAttribute("data-fs-panel")); if (el !== panel && el.scrollIntoView) el.scrollIntoView({ block: "start" }); return; }
      if (!id && /[?&]periode=/.test(location.search)) activate("stats");
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
  }
})();

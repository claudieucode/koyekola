// Mes formations : recherche, filtre par état et tri de la bibliothèque, côté navigateur (les cartes sont déjà dans la page : aucune requête).
// Sans ce script, toutes les formations restent visibles dans l'ordre du serveur. L'état (filtre, tri) est gardé dans l'adresse (#etat=…&q=…&tri=…) pour survivre au retour depuis un cours.
(function () {
  // Couverture introuvable : l'image est remplacée par le visuel de remplacement (pas d'icône d'image cassée)
  function broken(img) { var ph = img.parentNode.querySelector(".mc-cover-ph"); if (ph) { img.hidden = true; ph.hidden = false; } }
  [].forEach.call(document.querySelectorAll(".mc-cover img, .mc-resume-cover img"), function (img) {
    if (img.complete && img.naturalWidth === 0) broken(img); else img.addEventListener("error", function () { broken(img); });
  });
  var root = document.querySelector("[data-mc]");
  if (!root) return;
  var tools = root.querySelector("[data-mc-tools]"), grid = root.querySelector("[data-mc-grid]"), none = root.querySelector("[data-mc-none]"), live = root.querySelector("[data-mc-live]");
  var q = root.querySelector("[data-mc-q]"), sel = root.querySelector("[data-mc-s]"), chips = [].slice.call(root.querySelectorAll("[data-mc-f]"));
  var cards = [].slice.call(grid.querySelectorAll("[data-mc-card]"));
  if (cards.length < 2) return; // une seule formation : rien à chercher
  tools.hidden = false;
  var state = { f: "all", q: "", s: "default" };
  var norm = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  cards.forEach(function (c) { c._t = norm(c.getAttribute("data-title")); });
  var cmp = {
    default: function (a, b) { return a.dataset.rank - b.dataset.rank; },
    az: function (a, b) { return a._t.localeCompare(b._t, "fr"); },
    pct: function (a, b) { return b.dataset.pct - a.dataset.pct || a.dataset.rank - b.dataset.rank; }
  };
  function readHash() {
    var p = new URLSearchParams(location.hash.slice(1));
    if (chips.some(function (c) { return c.getAttribute("data-mc-f") === p.get("etat"); })) state.f = p.get("etat");
    state.q = (p.get("q") || "").slice(0, 80);
    if (cmp[p.get("tri")]) state.s = p.get("tri");
  }
  function writeHash() {
    var p = new URLSearchParams();
    if (state.f !== "all") p.set("etat", state.f);
    if (state.q) p.set("q", state.q);
    if (state.s !== "default") p.set("tri", state.s);
    var h = p.toString();
    try { history.replaceState(null, "", location.pathname + location.search + (h ? "#" + h : "")); } catch (e) { /* ignoré */ }
  }
  function apply() {
    var term = norm(state.q).trim(), shown = 0;
    cards.sort(cmp[state.s]).forEach(function (c) {
      var ok = (state.f === "all" || c.getAttribute("data-status") === state.f) && (!term || c._t.indexOf(term) !== -1);
      c.hidden = !ok; if (ok) shown++;
      grid.appendChild(c);
    });
    chips.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mc-f") === state.f)); });
    none.hidden = shown > 0; grid.hidden = shown === 0;
    live.textContent = shown === cards.length ? "" : shown + " formation" + (shown > 1 ? "s" : "") + " affichée" + (shown > 1 ? "s" : "") + " sur " + cards.length;
    q.value = state.q; sel.value = state.s;
    writeHash();
  }
  var timer;
  q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { state.q = q.value; apply(); }, 120); });
  sel.addEventListener("change", function () { state.s = sel.value; apply(); });
  chips.forEach(function (b) { b.addEventListener("click", function () { state.f = b.getAttribute("data-mc-f"); apply(); }); });
  root.querySelector("[data-mc-reset]").addEventListener("click", function () { state.f = "all"; state.q = ""; state.s = "default"; apply(); q.focus(); });
  readHash(); apply();
})();

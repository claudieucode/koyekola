// Questions fréquentes (page publique) : recherche, filtre par catégorie, « tout déplier », lien direct vers une question. Les questions sont déjà dans la page (aucune requête) ;
// sans ce script la page reste un accordéon natif complet. L'état (recherche, catégorie) est gardé dans l'adresse : ?q=…&cat=…, la question ouverte par #faq-<n>.
(function () {
  var tools = document.querySelector("[data-faq-tools]"), root = document.querySelector("[data-faq-root]");
  if (!root) return;
  var items = [].slice.call(root.querySelectorAll("[data-faq]")), groups = [].slice.call(root.querySelectorAll("[data-faq-group]"));
  var all = [].slice.call(root.querySelectorAll("details.faq-item"));
  var q = document.querySelector("[data-faq-q]"), live = document.querySelector("[data-faq-live]"), none = document.querySelector("[data-faq-none]"), toggle = document.querySelector("[data-faq-toggle]");
  var chips = [].slice.call(document.querySelectorAll("[data-faq-cat]"));
  var norm = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim(); };
  var state = { q: "", cat: "" };

  function openFromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = /^faq-\d+$/.test(id) ? document.getElementById(id) : null;
    if (!el || el.tagName !== "DETAILS") return;
    if (el.hidden) { state.q = ""; state.cat = ""; apply(false); }
    el.open = true; el.scrollIntoView({ block: "start" });
  }
  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q); if (state.cat) p.set("cat", state.cat);
    var s = p.toString();
    try { history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash); } catch (e) { /* ignoré */ }
  }
  function apply(write) {
    var term = norm(state.q), shown = 0;
    groups.forEach(function (g) {
      var inCat = !state.cat || g.getAttribute("data-faq-group") === state.cat, any = 0;
      [].forEach.call(g.querySelectorAll("[data-faq]"), function (el) {
        var ok = inCat && (!term || el.getAttribute("data-text").indexOf(term) !== -1);
        el.hidden = !ok; if (ok) { any++; shown++; }
      });
      // Sans recherche de texte (liste sans [data-faq]) : le groupe suit seulement la catégorie
      if (!items.length) { g.hidden = !inCat; shown += inCat ? g.querySelectorAll("details").length : 0; } else g.hidden = !any;
    });
    chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.getAttribute("data-faq-cat") === state.cat)); });
    if (none) none.hidden = shown > 0;
    root.hidden = shown === 0;
    if (live) live.textContent = (term || state.cat) ? shown + " question" + (shown > 1 ? "s" : "") + " affichée" + (shown > 1 ? "s" : "") + " sur " + all.length : "";
    if (q) q.value = state.q;
    if (write !== false) writeUrl();
  }
  if (tools) tools.hidden = false;
  var p = new URLSearchParams(location.search);
  state.q = (p.get("q") || "").slice(0, 80);
  if (chips.some(function (c) { return c.getAttribute("data-faq-cat") === p.get("cat"); })) state.cat = p.get("cat") || "";
  var timer;
  if (q) q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { state.q = q.value; apply(); }, 120); });
  chips.forEach(function (c) { c.addEventListener("click", function () { state.cat = c.getAttribute("data-faq-cat"); apply(); }); });
  var reset = document.querySelector("[data-faq-reset]");
  if (reset) reset.addEventListener("click", function () { state.q = ""; state.cat = ""; apply(); if (q) q.focus(); });
  if (toggle) toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-pressed") !== "true";
    all.forEach(function (d) { if (!d.hidden) d.open = open; });
    toggle.setAttribute("aria-pressed", String(open)); toggle.textContent = open ? "Tout replier" : "Tout déplier";
  });
  apply(false); openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();

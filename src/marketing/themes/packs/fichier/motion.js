/* Fichier : répertoire filtrable (catégorie, commune par liste ou par carte, mot), tri, copie du téléphone. Aucune dépendance ; inactif hors du thème Fichier. */
(function () {
  var B = document.body;
  if (!B || B.getAttribute("data-kw-pack") !== "fichier") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var one = function (s, e) { return (e || document).querySelector(s); };
  var prevent = function (e) { if (e && e.preventDefault) e.preventDefault(); };

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === " " && t && t.tagName === "A" && t.getAttribute("role") === "button") { e.preventDefault(); t.click(); }
  });

  // ----- copie du téléphone d'une fiche -----
  all("[data-fi-copy]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e);
      var v = a.getAttribute("data-fi-copy"), old = a.textContent;
      var ok = function () { a.textContent = "Numéro copié"; setTimeout(function () { a.textContent = old; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(v).then(ok, function () {});
    });
  });

  // ----- répertoire -----
  var first = one("[data-fi-list]");
  if (!first) {
    // sur l'accueil, la carte envoie vers le répertoire
    all("[data-fi-map] [data-fi-lieu]").forEach(function (b) { b.addEventListener("click", function (e) { prevent(e); location.href = "/repertoire"; }); });
    all("[data-fi-pin]").forEach(function (p) { p.addEventListener("click", function () { location.href = "/repertoire"; }); });
    return;
  }
  var second = one("[data-fi-list2]");
  var cards = all(".fi-card", first.parentNode).concat(second ? all(".fi-card", second) : []);
  var st = { cat: "tout", lieu: "", q: "", sort: "nom" };
  var count = one("[data-fi-count]"), empty = one("[data-fi-empty]");
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var apply = function () {
    var n = 0;
    cards.forEach(function (c) {
      var ok = (st.cat === "tout" || c.getAttribute("data-cat") === st.cat) && (!st.lieu || c.getAttribute("data-lieu") === st.lieu) && (!st.q || (c.getAttribute("data-hay") || "").indexOf(st.q) > -1);
      c.classList.toggle("fi-hid", !ok); if (ok) n++;
    });
    if (count) count.textContent = n === 0 ? "Aucune fiche" : n === 1 ? "1 fiche" : n + " fiches";
    if (empty) empty.classList.toggle("fi-hid", n !== 0);
    all("[data-fi-pin]").forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-fi-pin") === st.lieu); });
    all("[data-fi-lieu]").forEach(function (b) { b.classList.toggle("is-on", b.getAttribute("data-fi-lieu") === st.lieu); });
  };
  var sortCards = function () {
    var key = st.sort;
    var by = { nom: function (a, b) { return a.getAttribute("data-name") < b.getAttribute("data-name") ? -1 : 1; },
      lieu: function (a, b) { var x = a.getAttribute("data-lieu"), y = b.getAttribute("data-lieu"); return x === y ? (a.getAttribute("data-name") < b.getAttribute("data-name") ? -1 : 1) : (x < y ? -1 : 1); },
      anciennete: function (a, b) { return (+a.getAttribute("data-year")) - (+b.getAttribute("data-year")); } }[key];
    cards.sort(by);
    var split = Math.ceil(cards.length / 2);
    cards.forEach(function (c, i) { (i < 12 || !second ? first : second).appendChild(c); });
    if (second) { /* les 12 premières dans la première liste, le reste dans la seconde */ }
  };
  var slot = one("[data-fi-search]");
  if (slot) {
    var inp = document.createElement("input");
    inp.type = "search"; inp.placeholder = "Nom, métier, commune…"; inp.setAttribute("aria-label", "Rechercher dans le répertoire");
    inp.addEventListener("input", function () { st.q = norm(inp.value.trim()); apply(); });
    slot.appendChild(inp);
  }
  all("[data-fi-cat]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e); st.cat = a.getAttribute("data-fi-cat");
      all("[data-fi-cat]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
      apply();
    });
  });
  all("[data-fi-sort]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e); st.sort = a.getAttribute("data-fi-sort");
      all("[data-fi-sort]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
      sortCards(); apply();
    });
  });
  var pick = function (k) { st.lieu = st.lieu === k ? "" : k; apply(); };
  all("[data-fi-lieu]").forEach(function (b) { b.addEventListener("click", function (e) { prevent(e); pick(b.getAttribute("data-fi-lieu")); }); });
  all("[data-fi-pin]").forEach(function (p) { p.addEventListener("click", function () { pick(p.getAttribute("data-fi-pin")); }); });
  var rs = one("[data-fi-reset]");
  if (rs) rs.addEventListener("click", function (e) {
    prevent(e); st = { cat: "tout", lieu: "", q: "", sort: st.sort };
    all("[data-fi-cat]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-fi-cat") === "tout"); });
    var i2 = slot && one("input", slot); if (i2) i2.value = ""; apply();
  });
  sortCards(); apply();
})();

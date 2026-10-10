// Éditeur de pages — boîte « Raccourcis clavier » : recherche instantanée, symboles selon la plateforme, fermeture par le fond, piège du focus.
// Elle ne possède AUCUNE donnée : la liste des raccourcis vient du gabarit (une seule source, regroupée par catégories) ; ce fichier ne fait que la
// présenter. Elle n'ajoute, ne retire et ne modifie aucun raccourci : les touches de l'éditeur restent gérées par page-builder.js.
(function () {
  "use strict";
  var dlg = document.querySelector("[data-pb-shortcuts]");
  if (!dlg) return;
  var search = dlg.querySelector("[data-sc-search]"), empty = dlg.querySelector("[data-sc-empty]"), status = dlg.querySelector("[data-sc-status]");
  var body = dlg.querySelector(".pb-sc-body"), cols = dlg.querySelector(".pb-sc-cols");
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // ---- Plateforme : ⌘ ⌥ ⇧ sur Mac, Ctrl Alt Maj ailleurs (le gabarit écrit les noms « génériques ») ----
  var nav = window.navigator || {};
  var isMac = /mac|iphone|ipad/i.test((nav.userAgentData && nav.userAgentData.platform) || nav.platform || nav.userAgent || "");
  var MAC = { "Ctrl/⌘": "⌘", "Alt": "⌥", "Maj": "⇧" }, OTHER = { "Ctrl/⌘": "Ctrl" };
  var SYNONYMS = { "Ctrl/⌘": " ctrl control cmd command ⌘ ", "Maj": " maj shift ⇧ ", "Alt": " alt option ⌥ ", "Suppr": " suppr delete supprimer ", "Échap": " echap esc escape ", "Entrée": " entree enter retour " };
  var rows = [];
  Array.prototype.forEach.call(dlg.querySelectorAll(".pb-sc-group"), function (group) {
    Array.prototype.forEach.call(group.querySelectorAll("dt"), function (dt) {
      var dd = dt.nextElementSibling, hay = "";
      Array.prototype.forEach.call(dt.querySelectorAll(".pb-key"), function (k) {
        var canon = k.getAttribute("data-k") || k.textContent;
        k.setAttribute("data-k", canon);
        var shown = (isMac ? MAC : OTHER)[canon] || canon;
        k.textContent = shown;
        hay += " " + canon + " " + shown + (SYNONYMS[canon] || "");
      });
      var label = dd.textContent;
      dd.setAttribute("data-label", label);
      rows.push({ group: group, dt: dt, dd: dd, label: label, nlabel: norm(label), hay: norm(label + " " + hay) });
    });
  });

  // ---- Recherche : tous les mots saisis doivent se retrouver (action, touches, « ctrl », « cmd », « ⌘ »…) ; catégories vides masquées ----
  function mark(row, tokens) {
    var text = row.label, n = row.nlabel;
    if (!tokens.length || n.length !== text.length) { row.dd.textContent = text; return; }
    var spans = [];
    tokens.forEach(function (t) { var i = n.indexOf(t); if (i >= 0) spans.push([i, i + t.length]); });
    if (!spans.length) { row.dd.textContent = text; return; }
    spans.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [spans[0].slice()];
    spans.slice(1).forEach(function (sp) { var l = merged[merged.length - 1]; if (sp[0] <= l[1]) l[1] = Math.max(l[1], sp[1]); else merged.push(sp.slice()); });
    row.dd.textContent = "";
    var at = 0;
    merged.forEach(function (m) {
      if (m[0] > at) row.dd.appendChild(document.createTextNode(text.slice(at, m[0])));
      var el = document.createElement("mark"); el.className = "pb-sc-mark"; el.textContent = text.slice(m[0], m[1]); row.dd.appendChild(el); at = m[1];
    });
    if (at < text.length) row.dd.appendChild(document.createTextNode(text.slice(at)));
  }
  function filter() {
    var tokens = norm(search.value).split(/\s+/).filter(Boolean), shown = 0, groups = new Map();
    rows.forEach(function (r) {
      var ok = tokens.every(function (t) { return r.hay.indexOf(t) >= 0; });
      r.dt.hidden = r.dd.hidden = !ok;
      if (ok) { shown++; groups.set(r.group, true); }
      mark(r, ok ? tokens : []);
    });
    Array.prototype.forEach.call(dlg.querySelectorAll(".pb-sc-group"), function (g) { g.hidden = !groups.has(g); });
    empty.hidden = shown > 0; if (cols) cols.hidden = shown === 0;
    status.textContent = tokens.length ? (shown ? shown + (shown > 1 ? " raccourcis trouvés" : " raccourci trouvé") : "Aucun raccourci trouvé") : "";
    body.scrollTop = 0;
  }
  search.addEventListener("input", filter);

  // ---- Clavier : Ctrl/⌘ + K place le curseur dans la recherche UNIQUEMENT quand la boîte est ouverte (sinon : palette de commandes, inchangée) ----
  dlg.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && k === "k") { e.preventDefault(); e.stopPropagation(); search.focus(); search.select(); return; }
    if (e.key !== "Tab") return;
    // Piège du focus : Tab depuis le dernier élément revient au premier (et Maj + Tab l'inverse), le focus ne part pas vers le navigateur
    var f = Array.prototype.filter.call(dlg.querySelectorAll("button, input, [href], [tabindex]:not([tabindex='-1'])"), function (x) { return !x.disabled && x.getClientRects().length; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dlg)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  // ---- Fermeture : clic sur le fond assombri (comme Échap, la croix et le bouton) ; recherche remise à zéro ; focus rendu au menu qui l'a ouverte ----
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", function () {
    if (search.value) { search.value = ""; filter(); }
    var b = document.querySelector("[data-pb-mainmenu]"), a = document.activeElement;
    if (b && (!a || a === document.body || dlg.contains(a))) b.focus({ preventScroll: true });
  });
  filter();
})();

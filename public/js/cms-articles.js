// KOLAKISA CMS → Articles : panneaux « Options de l'écran » / « Aide », colonnes masquables (mémorisées), modification rapide en ligne,
// choix de la catégorie / étiquette d'une action groupée, barre d'actions du bas du tableau. Le serveur reste la seule source des données.
(function () {
  var store = { get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } } };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Panneaux : un seul ouvert à la fois, fermés par Échap
  var toggles = $$("[data-ar-panel-toggle]");
  function closePanels(except) {
    toggles.forEach(function (b) {
      var panel = document.getElementById(b.getAttribute("aria-controls"));
      if (b === except) return;
      b.setAttribute("aria-expanded", "false"); if (panel) panel.hidden = true;
    });
  }
  toggles.forEach(function (b) {
    b.addEventListener("click", function () {
      var panel = document.getElementById(b.getAttribute("aria-controls"));
      var open = b.getAttribute("aria-expanded") !== "true";
      closePanels(b); b.setAttribute("aria-expanded", String(open)); if (panel) panel.hidden = !open;
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = toggles.filter(function (b) { return b.getAttribute("aria-expanded") === "true"; })[0];
    if (open) { closePanels(null); open.focus(); }
  });

  // Colonnes affichées : mémorisées dans ce navigateur
  var table = $("[data-ar-table]");
  var colsKey = (table && table.getAttribute("data-ar-store")) || "mk_ar_cols"; // chaque liste (articles, pages) mémorise ses propres colonnes
  var hidden = [];
  try { hidden = JSON.parse(store.get(colsKey) || "[]"); } catch (e) { hidden = []; }
  if (!Array.isArray(hidden)) hidden = [];
  function applyCols() {
    $$("[data-ar-col]").forEach(function (box) { box.checked = hidden.indexOf(box.getAttribute("data-ar-col")) === -1; });
    if (!table) return;
    ["auteur", "categories", "etiquettes", "commentaires", "date"].forEach(function (c) {
      $$(".col-" + c, table).forEach(function (cell) { cell.hidden = hidden.indexOf(c) !== -1; });
    });
    $$(".mk-ar-quick td", table).forEach(function (td) { td.colSpan = table.rows[0].cells.length - hidden.filter(function (c) { return ["auteur", "categories", "etiquettes", "commentaires", "date"].indexOf(c) !== -1; }).length; });
  }
  $$("[data-ar-col]").forEach(function (box) {
    box.addEventListener("change", function () {
      var c = box.getAttribute("data-ar-col");
      hidden = hidden.filter(function (x) { return x !== c; });
      if (!box.checked) hidden.push(c);
      store.set(colsKey, JSON.stringify(hidden)); applyCols();
    });
  });
  applyCols();

  // Modification rapide : une ligne de formulaire sous l'article ; une seule ouverte à la fois
  function quick(id, open) {
    var row = document.getElementById("ar-quick-" + id), btn = $('[data-ar-quick-open="' + id + '"]');
    if (!row) return;
    $$(".mk-ar-quick").forEach(function (r) { if (r !== row && !r.hidden) { r.hidden = true; var o = $('[data-ar-quick-open="' + r.id.replace("ar-quick-", "") + '"]'); if (o) o.setAttribute("aria-expanded", "false"); } });
    row.hidden = !open; if (btn) btn.setAttribute("aria-expanded", String(open));
    if (open) { var f = $("input[name=title]", row); if (f) f.focus(); } else if (btn) btn.focus();
  }
  $$("[data-ar-quick-open]").forEach(function (b) { b.addEventListener("click", function () { quick(b.getAttribute("data-ar-quick-open"), b.getAttribute("aria-expanded") !== "true"); }); });
  $$("[data-ar-quick-close]").forEach(function (b) { b.addEventListener("click", function () { quick(b.getAttribute("data-ar-quick-close"), false); }); });
  $$("[data-ar-quick-form]").forEach(function (f) {
    f.addEventListener("keydown", function (e) { if (e.key === "Escape") quick(f.closest("tr").id.replace("ar-quick-", ""), false); });
    f.addEventListener("submit", function (e) { // pas de double envoi
      if (f.getAttribute("data-sent")) { e.preventDefault(); return; }
      f.setAttribute("data-sent", "1"); var b = $("button[type=submit]", f); if (b) { b.disabled = true; b.textContent = "Enregistrement…"; }
    });
  });

  // Action groupée : la catégorie / l'étiquette à ajouter n'apparaît que pour l'action qui en a besoin
  var bulkSelect = $("[data-ar-bulk-select]");
  var bulkForm = $("#pages-bulk");
  function syncTerms() {
    $$("[data-ar-bulk-term]").forEach(function (el) { el.hidden = !bulkSelect || el.getAttribute("data-ar-bulk-term") !== bulkSelect.value; });
  }
  // Barre du bas : reprend les choix de celle du haut et la déclenche (même confirmation, même contrôle serveur)
  var mirror = $("[data-ar-bulk-mirror]"), apply2 = $("[data-ar-bulk-apply2]");
  function syncMirror() {
    if (!bulkSelect || !mirror) return;
    if (!mirror.options.length || mirror.options.length !== bulkSelect.options.length) { mirror.innerHTML = bulkSelect.innerHTML; }
    mirror.value = bulkSelect.value; mirror.disabled = bulkSelect.disabled;
    apply2.disabled = bulkSelect.disabled || !bulkSelect.value;
    syncTerms();
  }
  if (bulkSelect) {
    bulkSelect.addEventListener("change", syncMirror);
    if (mirror) {
      mirror.addEventListener("change", function () { bulkSelect.value = mirror.value; bulkSelect.dispatchEvent(new Event("change", { bubbles: true })); });
      apply2.addEventListener("click", function () { if (bulkForm.requestSubmit) bulkForm.requestSubmit(); else bulkForm.submit(); });
      document.addEventListener("change", function (e) { if (e.target && e.target.matches("[data-cms-row],[data-cms-select-all]")) setTimeout(syncMirror, 0); });
      syncMirror();
    }
  }
  if (bulkForm) bulkForm.addEventListener("submit", function () { // pas de double envoi
    if (bulkForm.getAttribute("data-sent")) return; setTimeout(function () { bulkForm.setAttribute("data-sent", "1"); $$("button[type=submit]", bulkForm).forEach(function (b) { b.disabled = true; }); }, 0);
  });
})();

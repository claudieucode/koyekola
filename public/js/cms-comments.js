// KOLAKISA CMS → Commentaires : sélection (page courante seulement), actions groupées (haut et bas synchronisés, confirmation avant corbeille
// ou suppression définitive), volets « Répondre » et « Modification rapide » (clavier : Entrée / Échap), anti double envoi.
// La liste, les droits et chaque action sont rendus et contrôlés par le serveur ; ce script n'ajoute que le confort.
(function () {
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = document.getElementById("cm-bulk");
  var rows = $("[data-cms-row]");
  var alls = $("[data-cms-select-all]");
  var selects = $("[data-cms-bulk-select]");
  var applies = $("[data-cms-bulk-apply]");
  var count = $("[data-cms-bulk-count]")[0];
  var clears = $("[data-cms-clear]");
  function picked() { return rows.filter(function (r) { return r.checked; }).length; }
  function refresh() {
    var n = picked();
    selects.forEach(function (s) { s.disabled = n === 0; });
    applies.forEach(function (b, i) { b.disabled = n === 0 || !selects[i].value; });
    if (count) count.textContent = n ? n + " sélectionné" + (n > 1 ? "s" : "") : "";
    clears.forEach(function (c) { c.hidden = n === 0; });
    rows.forEach(function (r) { var tr = r.closest("tr"); if (tr) tr.classList.toggle("is-selected", r.checked); });
    alls.forEach(function (a) { a.checked = n > 0 && n === rows.length; a.indeterminate = n > 0 && n < rows.length; });
  }
  alls.forEach(function (a) { a.addEventListener("change", function () { rows.forEach(function (r) { r.checked = a.checked; }); refresh(); }); });
  rows.forEach(function (r) { r.addEventListener("change", refresh); });
  clears.forEach(function (c) { c.addEventListener("click", function () { rows.forEach(function (r) { r.checked = false; }); refresh(); }); });
  selects.forEach(function (s) { s.addEventListener("change", function () { selects.forEach(function (o) { o.value = s.value; }); refresh(); }); });
  var confirmed = false;
  if (form) form.addEventListener("submit", function (e) {
    var chosen = (selects[0] || {}).value, n = picked();
    if (!n || !chosen) { e.preventDefault(); return; }
    if (confirmed) return;
    var plural = n > 1 ? "commentaires" : "commentaire";
    var texts = {
      corbeille: { title: "Mettre à la corbeille ?", text: n + " " + plural + " " + (n > 1 ? "iront" : "ira") + " à la corbeille ; vous pourrez " + (n > 1 ? "les" : "le") + " restaurer.", ok: "Mettre à la corbeille" },
      supprimer: { title: "Supprimer définitivement ?", text: n + " " + plural + " " + (n > 1 ? "seront supprimés" : "sera supprimé") + " pour de bon. Cette action est irréversible.", ok: "Supprimer" }
    }[chosen];
    if (!texts) return;
    e.preventDefault();
    var go = function () { confirmed = true; form.submit(); };
    if (window.mkConfirm) window.mkConfirm(texts, go); else if (window.confirm(texts.text)) go();
  });
  // Les boutons « Appliquer » sont hors du formulaire (attribut form) : ils le soumettent sans quitter la page courante
  // Volets de réponse et de modification rapide
  function closePanel(p) { p.hidden = true; var o = document.querySelector('[data-cm-open="' + p.id + '"]'); if (o) o.focus(); }
  $("[data-cm-open]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      $(".cmx-drawer").forEach(function (p) { p.hidden = true; });
      var p = document.getElementById(a.getAttribute("data-cm-open"));
      if (!p) return;
      p.hidden = false;
      var f = p.querySelector("textarea"); if (f) f.focus();
    });
  });
  $(".cmx-drawer").forEach(function (p) {
    p.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); closePanel(p); } });
    var c = p.querySelector("[data-cm-close]"); if (c) c.addEventListener("click", function () { closePanel(p); });
  });
  // Anti double envoi (réponse, modification) : un seul envoi, bouton grisé
  $("form[data-cm-once]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      if (f.getAttribute("data-sent")) { e.preventDefault(); return; }
      f.setAttribute("data-sent", "1");
      $("button[type=submit]", f).forEach(function (b) { b.disabled = true; b.textContent = "Envoi…"; });
    });
  });
  // Filtres repliables en zone étroite (le bouton n'existe que si le script tourne)
  var panel = document.querySelector(".cmx-panel");
  if (panel) {
    panel.classList.add("cmx-js");
    var tg = panel.querySelector("[data-cmx-toggle]"), fl = document.getElementById("cmx-filters");
    if (tg && fl) { tg.hidden = false; tg.addEventListener("click", function () { var open = fl.classList.toggle("is-open"); tg.setAttribute("aria-expanded", open ? "true" : "false"); }); }
    // Chargement : le tableau s'estompe pendant l'envoi ; retiré si la page revient de l'historique
    panel.addEventListener("submit", function (e) { if (!e.defaultPrevented) panel.setAttribute("aria-busy", "true"); });
    window.addEventListener("pageshow", function () { panel.removeAttribute("aria-busy"); });
  }
  // Menu « Plus » : un seul ouvert à la fois, fermé par un clic ailleurs ou Échap
  var menus = $("details.cmx-menu");
  menus.forEach(function (m) { m.addEventListener("toggle", function () { if (m.open) menus.forEach(function (o) { if (o !== m) o.open = false; }); }); });
  document.addEventListener("click", function (e) { menus.forEach(function (m) { if (m.open && !m.contains(e.target)) m.open = false; }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menus.forEach(function (m) { if (m.open) { m.open = false; var sm = m.querySelector("summary"); if (sm) sm.focus(); } }); });
  // Retour visuel : le bouton « Appliquer » passe en cours d'envoi
  if (form) form.addEventListener("submit", function () { if (confirmed) applies.forEach(function (b) { b.setAttribute("aria-busy", "true"); }); });
  refresh();
})();

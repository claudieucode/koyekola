// Menus de navigation du site (CMS → Navigation) : sous-menus accessibles au clavier et au toucher.
// Bouton « sous-menu » : Entrée/Espace/clic ouvre ou ferme (aria-expanded) ; Échap ferme et rend le focus au bouton ;
// un clic ailleurs ou la sortie du focus ferme les sous-menus ouverts. Sans ce script, le menu reste lisible (liens du premier niveau).
(function () {
  function toggle(li, open) {
    li.classList.toggle("is-open", open);
    var b = li.querySelector(":scope > .nav-sub-toggle, :scope > .nav-group-toggle");
    if (b) b.setAttribute("aria-expanded", String(open));
  }
  function closeAll(except, root) {
    (root || document).querySelectorAll(".nav-item.is-open").forEach(function (li) { if (li !== except && !(except && li.contains(except))) toggle(li, false); });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".nav-sub-toggle, .nav-group-toggle");
    if (b) { var li = b.closest(".nav-item"); var open = !li.classList.contains("is-open"); closeAll(li); toggle(li, open); return; }
    if (!e.target.closest(".nav-item")) closeAll(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector(".nav-item.is-open");
    if (!open) return;
    var inner = open.querySelector(":scope .nav-item.is-open") || open;
    var focusIn = document.activeElement && open.contains(document.activeElement);
    toggle(inner, false);
    if (focusIn) { var b = inner.querySelector(":scope > .nav-sub-toggle, :scope > .nav-group-toggle"); if (b) b.focus(); }
  });
  document.addEventListener("focusin", function (e) {
    var cur = e.target.closest ? e.target.closest(".nav-item") : null;
    document.querySelectorAll(".nav-item.is-open").forEach(function (li) { if (!cur || !li.contains(cur)) toggle(li, false); });
  });
})();

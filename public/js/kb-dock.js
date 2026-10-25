// KOLAKISA — rail de navigation : « Plus » de la barre rapide mobile (ouvre le menu complet existant) et position du rail (en bas par défaut sur grands écrans ; retour à gauche possible).
// Aucune écoute globale, aucune boucle : deux gestionnaires de clic. La position choisie est mémorisée dans ce navigateur (localStorage.kbDock).
(function () {
  "use strict";
  var root = document.documentElement;
  var store = { get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } } };
  var more = document.querySelector("[data-dock-more]");
  if (more) more.addEventListener("click", function () {
    var toggle = document.querySelector("[data-dash-menu], [data-mk-sidebar-toggle]");   // le bouton ☰ de la coque (Mon espace ou Marketing / CMS) : même ouverture, même fermeture, même focus
    if (toggle) toggle.click();
  });
  var pos = document.querySelector("[data-dock-pos]");
  function sync() {
    var bottom = root.getAttribute("data-kb-dock") === "bottom";
    if (!pos) return;
    pos.setAttribute("aria-pressed", String(bottom));
    var label = bottom ? "Replacer la barre à gauche de l'écran" : "Placer la barre en bas de l'écran";
    pos.setAttribute("data-tip", label); pos.setAttribute("aria-label", label);
  }
  if (pos) pos.addEventListener("click", function () {
    var next = root.getAttribute("data-kb-dock") === "bottom" ? "left" : "bottom";
    if (next === "bottom") root.setAttribute("data-kb-dock", "bottom"); else root.removeAttribute("data-kb-dock");
    store.set("kbDock", next); sync();
  });
  sync();
})();

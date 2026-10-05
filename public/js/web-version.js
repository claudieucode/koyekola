// Version web d'un e-mail : le cadre prend la hauteur de son contenu (même origine ; le contenu, lui, n'exécute aucun script)
(function () {
  "use strict";
  var frame = document.querySelector(".ev-frame");
  if (!frame) return;
  // Mesure à partir d'une hauteur minimale : sinon le document remplit le cadre et ne paraît jamais plus petit que lui
  function fit() { try { var d = frame.contentDocument; if (!d || !d.documentElement) return; frame.style.height = "50px"; frame.style.height = Math.max(300, d.documentElement.scrollHeight) + "px"; } catch (e) { /* cadre isolé : hauteur par défaut */ } }
  frame.addEventListener("load", fit);
  // Le cadre a pu finir de charger avant ce script (chargé en « defer ») : ajuster tout de suite aussi
  try { if (frame.contentDocument && frame.contentDocument.readyState === "complete") fit(); } catch (e) { /* rien */ }
  window.addEventListener("resize", fit);
})();

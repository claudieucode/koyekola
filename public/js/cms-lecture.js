// KOLAKISA CMS → Paramètres → Lecture : volets contextuels selon le mode d'accueil, et avertissement immédiat d'une page choisie deux fois.
// Sans ce script, tous les volets restent visibles et le serveur refuse toute configuration incohérente : il ne fait que guider.
(function () {
  "use strict";
  var root = document.querySelector("[data-read]");
  if (!root) return;
  var radios = root.querySelectorAll("[data-read-mode]");
  var panels = root.querySelectorAll("[data-read-panel]");
  var home = root.querySelector("#rd-home"), posts = root.querySelector("#rd-posts");
  var clash = document.createElement("p");
  clash.className = "mk-read-warn"; clash.setAttribute("role", "alert"); clash.hidden = true;
  clash.textContent = "La page des articles doit être différente de la page d'accueil.";
  if (posts) posts.parentNode.appendChild(clash);
  function mode() { for (var i = 0; i < radios.length; i++) if (radios[i].checked) return radios[i].value; return "page"; }
  function sync() {
    var m = mode();
    panels.forEach(function (p) { if (p.getAttribute("data-read-panel") === m) p.removeAttribute("data-off"); else p.setAttribute("data-off", ""); });
    if (home && posts) clash.hidden = !(m === "page" && home.value && home.value === posts.value);
  }
  radios.forEach(function (r) { r.addEventListener("change", sync); });
  if (home) home.addEventListener("change", sync);
  if (posts) posts.addEventListener("change", sync);
  sync();
})();

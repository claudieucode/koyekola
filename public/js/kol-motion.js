/* KOLAKISA — primitives des micro-interactions de l'éditeur (durées, courbes et mouvements : jetons --kol-motion-* de page-builder.css).
   Principe : l'état logique ne dépend JAMAIS d'une animation. appear() joue une apparition sur un élément déjà inséré ; leave() garde un élément déjà masqué
   (attribut hidden posé) visible et inerte le temps de sa sortie. Mouvement réduit : elles ne font rien. Aucune mise en page n'est touchée
   (opacity, scale et translate seulement, côté CSS). */
(function (root) {
  "use strict";
  var mq = root.matchMedia ? root.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var reduced = function () { return Boolean(mq && mq.matches); };

  // Joue l'apparition `kind` (pop, scale, rise, fade, panel-left, panel-right, appear) ; la classe disparaît à la fin de l'animation
  function appear(el, kind) {
    if (!el || reduced()) return;
    var cls = "kol-in-" + kind;
    if (el.classList.contains(cls)) return;
    el.classList.add(cls);
    var done = function (e) { if (e && e.target !== el) return; el.classList.remove(cls); el.removeEventListener("animationend", done); el.removeEventListener("animationcancel", done); };
    el.addEventListener("animationend", done); el.addEventListener("animationcancel", done);
    setTimeout(done, 600); // filet de sécurité (onglet en arrière-plan : l'événement peut ne pas arriver)
  }

  // Sortie visuelle d'un élément qu'on masque avec l'attribut `hidden` : à appeler JUSTE AVANT `el.hidden = true`. L'attribut (l'état logique) change
  // tout de suite ; la classe .kol-leaving maintient l'affichage ~90 ms, inerte (aucun clic ne lui est destiné), puis disparaît d'elle-même.
  function leave(el, kind) {
    if (!el || reduced() || el.hidden || !el.isConnected) return;
    el.classList.remove("kol-leaving", "kol-leaving-fade");
    el.classList.add("kol-leaving"); if (kind === "fade") el.classList.add("kol-leaving-fade");
    el.setAttribute("aria-hidden", "true"); el.setAttribute("inert", "");
    var done = function (e) { if (e && e.target !== el) return; cancelLeave(el); el.removeEventListener("animationend", done); el.removeEventListener("animationcancel", done); };
    el.addEventListener("animationend", done); el.addEventListener("animationcancel", done);
    setTimeout(done, 400);
  }
  // À appeler quand l'élément est rouvert (hidden = false) : la sortie en cours est annulée
  function cancelLeave(el) { if (!el) return; el.classList.remove("kol-leaving", "kol-leaving-fade"); el.removeAttribute("aria-hidden"); el.removeAttribute("inert"); }

  var api = { appear: appear, leave: leave, cancelLeave: cancelLeave, reduced: reduced };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.KolMotion = api;
})(typeof window !== "undefined" ? window : this);

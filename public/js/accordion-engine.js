// Moteur commun des accordéons de l'éditeur (<details class="pb-acc">) : UN SEUL endroit décide de ce qui se ferme quand une section s'ouvre.
//
//   Modes (réglage global « Comportement des accordéons », mémorisé par l'éditeur) :
//     "many"  Plusieurs ouverts          : chaque section est indépendante (comportement historique, valeur par défaut)
//     "one"   Un seul ouvert             : ouvrir une section ferme les autres du groupe
//     "below" Fermer ceux situés en dessous : ouvrir une section ferme celles qui la suivent dans le groupe ; celles du dessus restent
//
//   Groupe = les <details class="pb-acc"> FRÈRES (même parent) : un accordéon imbriqué est donc dans son propre groupe, et un autre
//   panneau n'est jamais touché. L'ordre « en dessous » est l'ordre des frères dans le DOM (jamais des coordonnées).
//   Exception future par groupe : poser data-acc-mode="one|many|below" sur le parent (ou un ancêtre) ; sinon le réglage global s'applique.
//   Un futur accordéon n'a rien à écrire : tout <details class="pb-acc"> est pris en charge, quel que soit son titre ou son identifiant.
//
// La logique pure (plan, normalize) ne touche pas au DOM : elle est testée à part.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.KWAccordion = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var MODES = ["many", "one", "below"];
  var DEFAULT_MODE = "many";
  var LABELS = {
    one: ["Un seul ouvert", "L’ouverture d’une section ferme les autres."],
    many: ["Plusieurs ouverts", "Chaque section peut rester ouverte indépendamment."],
    below: ["Fermer ceux situés en dessous", "Les sections situées sous celle ouverte se ferment."],
  };

  // ---------- logique pure ----------
  // open : états actuels (booléens, dans l'ordre du groupe) ; index : section touchée ; opening : true = ouverture, false = fermeture.
  // Retourne les nouveaux états. Fermer une section ne change jamais les autres, quel que soit le mode.
  function plan(mode, open, index, opening) {
    var next = open.slice();
    next[index] = Boolean(opening);
    if (!opening) return next;
    if (mode === "one") return next.map(function (_, i) { return i === index; });
    if (mode === "below") return next.map(function (v, i) { return i > index ? false : v; });
    return next;
  }
  // Règle explicite de passage vers « un seul ouvert » (ou d'un rendu qui contient plusieurs sections ouvertes) : on garde la section
  // la plus récemment ouverte par la personne (keep = son index) ; à défaut, la première ouverte dans l'ordre. Les autres modes ne changent rien.
  function normalize(mode, open, keep) {
    if (mode !== "one") return open.slice();
    var count = open.filter(Boolean).length;
    if (count <= 1) return open.slice();
    var k = keep >= 0 && open[keep] ? keep : open.indexOf(true);
    return open.map(function (_, i) { return i === k; });
  }

  // ---------- DOM ----------
  var cfg = { get: function () { return DEFAULT_MODE; }, set: function () {} };
  var lastKey = null; // identifiant (data-group) de la dernière section ouverte par la personne
  function configure(c) { if (c && c.get) cfg.get = c.get; if (c && c.set) cfg.set = c.set; }
  function validMode(m) { return MODES.indexOf(m) >= 0 ? m : DEFAULT_MODE; }
  function mode(scope) {
    var o = scope && scope.closest ? scope.closest("[data-acc-mode]") : null;
    return validMode(o ? o.getAttribute("data-acc-mode") : cfg.get());
  }
  function isAcc(el) { return el && el.tagName === "DETAILS" && el.classList.contains("pb-acc"); }
  function groupOf(det) {
    var p = det.parentElement;
    return p ? Array.prototype.filter.call(p.children, isAcc) : [det];
  }
  function keepIndex(list) { for (var i = 0; i < list.length; i++) if (lastKey && list[i].getAttribute("data-group") === lastKey) return i; return -1; }
  function scroller(el) {
    for (var n = el.parentElement; n; n = n.parentElement) { var o = getComputedStyle(n).overflowY; if ((o === "auto" || o === "scroll") && n.scrollHeight > n.clientHeight) return n; }
    return null;
  }

  // Appliqué AVANT que la section touchée change d'état (clic ou clavier sur son titre) : seules les sections qui doivent changer sont modifiées
  function beforeUserToggle(det) {
    var list = groupOf(det), i = list.indexOf(det), opening = !det.open;
    if (opening) lastKey = det.getAttribute("data-group");
    var states = list.map(function (d) { return d.open; });
    var next = plan(mode(det.parentElement), states, i, opening);
    var changed = list.filter(function (d, j) { return j !== i && d.open !== next[j]; });
    if (!changed.length) return 0;
    var sc = scroller(det), top = det.getBoundingClientRect().top;
    changed.forEach(function (d) { d.open = false; });
    // la section cliquée reste là où se trouve le pointeur (les sections fermées au-dessus ne la font pas sauter)
    if (sc) { var delta = det.getBoundingClientRect().top - top; if (delta) sc.scrollTop += delta; }
    return changed.length;
  }
  // Ouverture demandée par le code (aller à un réglage) : mêmes règles qu'un clic
  function reveal(det) { if (!det.open) beforeUserToggle(det); det.open = true; }

  // Met en conformité les groupes d'une zone (après construction de l'inspecteur, ou changement de mode). Retourne le nombre de sections fermées.
  function normalizeIn(scope, revealKey) {
    if (!scope || !scope.querySelectorAll) return 0;
    var parents = [], n = 0;
    Array.prototype.forEach.call(scope.querySelectorAll("details.pb-acc"), function (d) { if (d.parentElement && parents.indexOf(d.parentElement) < 0) parents.push(d.parentElement); });
    parents.forEach(function (p) {
      var list = Array.prototype.filter.call(p.children, isAcc), m = mode(p);
      var states = list.map(function (d) { return d.open; }), keep = -1;
      if (revealKey) for (var i = 0; i < list.length; i++) if (list[i].getAttribute("data-group") === revealKey) keep = i;
      if (keep < 0) keep = keepIndex(list);
      var next;
      if (revealKey && keep >= 0 && states[keep]) next = plan(m, states, keep, true); // section demandée : mêmes règles qu'un clic
      else next = normalize(m, states, keep);
      list.forEach(function (d, j) { if (d.open && !next[j]) { d.open = false; n++; } });
    });
    return n;
  }
  function setMode(m, scope) { m = validMode(m); cfg.set(m); return normalizeIn(scope || (typeof document !== "undefined" ? document : null)); }
  function getMode() { return validMode(cfg.get()); }

  function init() {
    if (typeof document === "undefined" || init.done) return;
    init.done = true;
    // Capture : avant le comportement natif de <details>. Entrée / Espace sur le titre produisent aussi un « click » : le clavier est couvert.
    document.addEventListener("click", function (e) {
      var sm = e.target && e.target.closest ? e.target.closest("summary") : null;
      if (!sm || !isAcc(sm.parentNode) || sm.parentNode.firstElementChild !== sm) return;
      beforeUserToggle(sm.parentNode);
    }, true);
  }
  init();

  return { MODES: MODES, LABELS: LABELS, DEFAULT_MODE: DEFAULT_MODE, plan: plan, normalize: normalize, configure: configure, mode: mode, getMode: getMode, setMode: setMode, groupOf: groupOf, normalizeIn: normalizeIn, reveal: reveal, beforeUserToggle: beforeUserToggle };
});

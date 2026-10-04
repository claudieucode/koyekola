// Calque flottant commun à tous les menus « ⋮ » / déroulants du site (Marketing, Mon espace, SEO, éditeurs).
// Le menu reste à sa place dans le HTML (formulaires, confirmations, ordre de tabulation et variables CSS conservés) mais
// il est affiché en position: fixed, calculée depuis le bouton : il ne modifie JAMAIS la hauteur de la ligne ou de la
// carte, n'agrandit pas la zone de défilement d'un tableau et n'est pas coupé par un parent en overflow.
// Placement : sous le bouton, ou au-dessus s'il manque de place ; aligné sur le bord droit du bouton (ou gauche),
// toujours entièrement dans l'écran ; recalculé au défilement (page ou tableau) et au redimensionnement.
// Un seul menu ouvert à la fois sur toute la page, quel que soit le système qui l'a ouvert.
(function () {
  "use strict";
  if (window.kbFloat) return;
  var MARGIN = 8; // distance minimale aux bords de l'écran
  var current = null; // { trigger, panel, opts, frame, home }

  // Un ancêtre avec transform / filter / contain… devient le repère de position: fixed : on sort alors le menu
  // dans <body> le temps de l'ouverture (repli rare, aucun cas sur les pages actuelles hors en-tête du site).
  function trapsFixed(node) {
    for (var n = node.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (cs.transform !== "none" || cs.filter !== "none" || cs.perspective !== "none" || (cs.backdropFilter && cs.backdropFilter !== "none") ||
        (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== "none") || /paint|layout|strict|content/.test(cs.contain || "") || /transform|filter/.test(cs.willChange || "")) return true;
    }
    return false;
  }

  function place() {
    if (!current) return;
    var t = current.trigger, p = current.panel, o = current.opts;
    if (!t.isConnected || !p.isConnected) { close(current.panel); return; }
    var r = t.getBoundingClientRect();
    var vw = document.documentElement.clientWidth, vh = window.innerHeight;
    // Bouton sorti de l'écran (défilement) ou masqué : le menu se ferme plutôt que de flotter sans repère
    if (r.bottom < 0 || r.top > vh || (r.width === 0 && r.height === 0)) { close(current.panel, { reason: "hidden" }); return; }
    p.style.maxHeight = "";
    var w = p.offsetWidth, h = p.offsetHeight, gap = o.gap == null ? 6 : o.gap;
    var below = vh - r.bottom - gap - MARGIN, above = r.top - gap - MARGIN;
    var side = h <= below || below >= above ? "bottom" : "top";
    var room = side === "bottom" ? below : above;
    if (h > room) { p.style.maxHeight = Math.max(120, room) + "px"; h = p.offsetHeight; } // très long menu : défilement interne
    var top = side === "bottom" ? r.bottom + gap : r.top - gap - h;
    top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
    var left = o.align === "start" ? r.left : r.right - w;
    left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN));
    p.style.top = Math.round(top) + "px";
    p.style.left = Math.round(left) + "px";
    p.setAttribute("data-placement", side);
  }
  var queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(function () { queued = false; place(); }); }

  // Ouvre `panel` (déjà visible : hidden retiré par l'appelant) en calque flottant ancré sur `trigger`.
  // opts.onClose(reason) : appelé quand le calque se ferme de lui-même (autre menu ouvert, bouton disparu…)
  function open(trigger, panel, opts) {
    if (current && current.panel !== panel) close(current.panel, { reason: "other" });
    opts = opts || {};
    var home = null;
    if (trapsFixed(panel)) { home = document.createComment("menu"); panel.parentNode.insertBefore(home, panel); document.body.appendChild(panel); }
    panel.classList.add("kb-floating");
    current = { trigger: trigger, panel: panel, opts: opts, home: home };
    place();
    window.addEventListener("scroll", schedule, true); // capture : aussi le défilement des tableaux et des panneaux
    window.addEventListener("resize", schedule);
  }

  function close(panel, info) {
    if (!current || (panel && current.panel !== panel)) return;
    var c = current;
    current = null;
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", schedule);
    c.panel.classList.remove("kb-floating");
    c.panel.style.top = c.panel.style.left = c.panel.style.maxHeight = "";
    c.panel.removeAttribute("data-placement");
    if (c.home) { c.home.parentNode.insertBefore(c.panel, c.home); c.home.remove(); }
    if (info && info.reason && typeof c.opts.onClose === "function") c.opts.onClose(info.reason);
  }

  // Changement de page (y compris retour arrière depuis le cache) : rien ne reste ouvert
  window.addEventListener("pagehide", function () { if (current) close(current.panel, { reason: "page" }); });

  window.kbFloat = { open: open, close: close, place: place, isOpen: function (panel) { return !!current && current.panel === panel; } };
})();

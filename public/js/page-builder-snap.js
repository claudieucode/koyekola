/* KOLAKISA — moteur des règles, de la grille et du magnétisme (calculs purs, sans accès à la page).
   Chargé avant page-builder.js, qui s'en sert pour le dessin et les gestes. Aussi utilisable par Node (tests).
   Toutes les coordonnées sont celles de la page affichée, en pixels CSS (origine : coin haut gauche de la page).
   Ces calculs ne servent qu'à l'édition : rien d'ici n'est enregistré dans le contenu ni publié. */
(function (root) {
  "use strict";

  // ---------- Préférences ----------
  var UNITS = ["px", "%", "rem", "em", "vw", "vh"];
  var DEFAULTS = {
    show: { rulers: true, guides: true, grid: false, margins: false, columns: true, safe: false, container: false },
    snap: { on: true, guides: true, grid: true, edges: true, center: true, columns: true, elements: true, smart: true, distances: true },
    unit: "px",
    perDevice: true, // guides indépendants par écran
    step: 8, // pas de la grille libre (px)
    mode: "free", // "free" : grille de pas régulier ; "web" : colonnes
    distance: 8, // distance d'accrochage (px d'écran)
    strength: 2, // force du magnétisme : 1 légère, 2 normale, 3 forte
    web: { columns: 12, gutter: 24, marginL: 32, marginR: 32, maxWidth: 1200 },
    safe: { top: 24, right: 16, bottom: 24, left: 16 },
    // Réglages propres à chaque écran quand ils diffèrent de l'ordinateur
    devices: { tablet: { columns: 8, gutter: 20, marginL: 24, marginR: 24, maxWidth: 720 }, mobile: { columns: 4, gutter: 16, marginL: 16, marginR: 16, maxWidth: 0 } }
  };
  var COLUMN_CHOICES = [1, 2, 3, 4, 6, 8, 12, 16];

  function num(v, min, max, d) { v = Number(v); if (!isFinite(v)) return d; return Math.min(max, Math.max(min, v)); }
  function bool(v, d) { return typeof v === "boolean" ? v : d; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // Préférences relues du stockage : toute valeur invalide retombe sur la valeur par défaut
  function normalize(raw) {
    var r = raw && typeof raw === "object" ? raw : {};
    var d = clone(DEFAULTS);
    ["show", "snap"].forEach(function (g) { Object.keys(d[g]).forEach(function (k) { d[g][k] = bool(r[g] && r[g][k], d[g][k]); }); });
    d.unit = UNITS.indexOf(r.unit) >= 0 ? r.unit : d.unit;
    d.perDevice = bool(r.perDevice, d.perDevice);
    d.step = num(r.step, 2, 200, d.step);
    d.mode = r.mode === "web" ? "web" : "free";
    d.distance = num(r.distance, 1, 48, d.distance);
    d.strength = [1, 2, 3].indexOf(Number(r.strength)) >= 0 ? Number(r.strength) : d.strength;
    var web = function (src, base) {
      var s = src && typeof src === "object" ? src : {};
      var cols = Number(s.columns);
      return { columns: COLUMN_CHOICES.indexOf(cols) >= 0 ? cols : base.columns, gutter: num(s.gutter, 0, 100, base.gutter), marginL: num(s.marginL, 0, 400, base.marginL), marginR: num(s.marginR, 0, 400, base.marginR), maxWidth: num(s.maxWidth, 0, 4000, base.maxWidth) };
    };
    d.web = web(r.web, d.web);
    ["tablet", "mobile"].forEach(function (k) { d.devices[k] = web(r.devices && r.devices[k], d.devices[k]); });
    ["top", "right", "bottom", "left"].forEach(function (k) { d.safe[k] = num(r.safe && r.safe[k], 0, 400, d.safe[k]); });
    return d;
  }

  // Réglages de grille de l'écran affiché
  function gridFor(prefs, device) {
    return device === "tablet" || device === "mobile" ? prefs.devices[device] : prefs.web;
  }

  // ---------- Règle : choix d'un pas lisible ----------
  var STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
  // Plus petit pas « rond » dont l'écart à l'écran dépasse minPx (plus le zoom est fort, plus le pas est fin)
  function niceStep(zoom, minPx) {
    var m = minPx || 56;
    for (var i = 0; i < STEPS.length; i++) if (STEPS[i] * zoom >= m) return STEPS[i];
    return STEPS[STEPS.length - 1];
  }
  // Pas des petites graduations pour un pas principal donné
  function minorStep(step, zoom) {
    var s = step * zoom;
    return s >= 120 ? step / 10 : s >= 60 ? step / 5 : step / 2;
  }

  // ---------- Unités ----------
  // ctx : { vw, vh (fenêtre d'affichage), root (px d'un rem), font (px d'un em), parent (largeur de référence pour %) }
  function fromPx(px, unit, ctx) {
    var c = ctx || {};
    var base = { px: 1, "%": (c.parent || c.vw || 1) / 100, rem: c.root || 16, em: c.font || c.root || 16, vw: (c.vw || 1) / 100, vh: (c.vh || 1) / 100 }[unit] || 1;
    return px / base;
  }
  function toPx(value, unit, ctx) {
    var c = ctx || {};
    var base = { px: 1, "%": (c.parent || c.vw || 1) / 100, rem: c.root || 16, em: c.font || c.root || 16, vw: (c.vw || 1) / 100, vh: (c.vh || 1) / 100 }[unit] || 1;
    return value * base;
  }
  function format(px, unit, ctx) {
    var v = fromPx(px, unit, ctx);
    if (unit === "px") return String(Math.round(v));
    return String(Math.round(v * 100) / 100).replace(".", ",");
  }
  // Lit « 12,5 », « 12.5px », « 40 % »… et rend des pixels ; null si illisible
  function parse(text, unit, ctx) {
    var m = /^\s*(-?\d+(?:[.,]\d+)?)\s*(px|%|rem|em|vw|vh)?\s*$/i.exec(String(text));
    if (!m) return null;
    return toPx(parseFloat(m[1].replace(",", ".")), (m[2] || unit || "px").toLowerCase(), ctx);
  }

  // ---------- Grille web ----------
  // Géométrie de la grille en colonnes pour une page de largeur pageW. Le conteneur est centré (margin: auto) avec une
  // largeur maximale ; les marges s'appliquent à l'intérieur de la page quand elle est plus étroite que le conteneur.
  function webGrid(cfg, pageW) {
    var maxW = cfg.maxWidth > 0 ? Math.min(cfg.maxWidth, pageW) : pageW;
    var left = Math.max(0, (pageW - maxW) / 2);
    var inner = { left: left + cfg.marginL, right: left + maxW - cfg.marginR };
    if (inner.right - inner.left < cfg.columns) inner = { left: left, right: left + maxW };
    var n = cfg.columns, width = inner.right - inner.left;
    var colW = Math.max(0, (width - cfg.gutter * (n - 1)) / n);
    var cols = [];
    for (var i = 0; i < n; i++) { var l = inner.left + i * (colW + cfg.gutter); cols.push({ left: l, right: l + colW }); }
    return { container: { left: left, right: left + maxW }, inner: inner, columns: cols, colWidth: colW };
  }

  // ---------- Cibles d'accrochage ----------
  // Une cible : { v: position, kind, label }. Les cibles verticales (axe x) ou horizontales (axe y) sont des listes.
  // Grille libre : les deux multiples du pas autour de la valeur (pas de longue liste de lignes) ; grille web : bords
  // des colonnes (axe horizontal seulement). Le magnétisme à la grille agit même grille masquée (la grille n'est qu'affichée).
  function gridTargets(prefs, device, pageW, probe, axis) {
    var out = [];
    if (prefs.mode === "free" && prefs.snap.grid) {
      var step = prefs.step, lo = Math.floor(probe / step) * step;
      out.push({ v: lo, kind: "grid", label: "grille", pri: 6 }, { v: lo + step, kind: "grid", label: "grille", pri: 6 });
    }
    if (axis === "x" && prefs.mode === "web" && prefs.snap.columns) {
      var g = webGrid(gridFor(prefs, device), pageW);
      g.columns.forEach(function (c, i) { out.push({ v: c.left, kind: "column", label: "colonne " + (i + 1), pri: 2 }); out.push({ v: c.right, kind: "column", label: "colonne " + (i + 1), pri: 2 }); });
    }
    return out;
  }

  // Cherche, parmi des cibles, la plus proche d'une valeur (à moins de dist). Égalité : la première rencontrée.
  function prio(t) { return t.pri === undefined ? 9 : t.pri; }
  // Cible retenue parmi celles à portée : un guide posé par la personne l'emporte toujours sur le reste ; sinon la plus
  // proche, et à distance égale la plus prioritaire (écart > colonne > élément > bord > centre > grille)
  function nearest(value, targets, dist) {
    var best = null;
    for (var i = 0; i < targets.length; i++) {
      var d = Math.abs(targets[i].v - value);
      if (d > dist) continue;
      var score = d - (prio(targets[i]) === 0 ? 1e6 : 0);
      if (best === null || score < best.score - 1e-6 || (Math.abs(score - best.score) <= 1e-6 && prio(targets[i]) < prio(best.t))) best = { score: score, d: d, t: targets[i] };
    }
    return best ? best.t : null;
  }

  // Distance réelle d'accrochage (px de la page) : distance choisie × force, ramenée à la page par le zoom
  function reach(prefs, zoom) { return (prefs.distance * ({ 1: 0.6, 2: 1, 3: 1.5 }[prefs.strength] || 1)) / (zoom || 1); }

  // Déplace des bords d'un rectangle vers les cibles les plus proches sur un axe.
  // edges : positions de ce qui bouge (gauche, centre, droite…), chacune { v, name }. Rend { delta, hit } ou null.
  function snapAxis(edges, targets, dist) {
    var best = null;
    edges.forEach(function (e) {
      var t = nearest(e.v, targets, dist);
      if (t) { var d = Math.abs(t.v - e.v); if (best === null || d < best.d) best = { d: d, delta: t.v - e.v, edge: e, target: t }; }
    });
    return best;
  }

  // ---------- Distances et espacements ----------
  // Rectangles : { left, top, right, bottom }. Rend l'écart horizontal ou vertical entre deux rectangles qui se
  // font face (null s'ils se chevauchent ou ne sont pas face à face).
  function gapBetween(a, b) {
    var overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0;
    var overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
    if (overlapY && b.left >= a.right) return { axis: "x", from: a.right, to: b.left, value: b.left - a.right, y1: Math.max(a.top, b.top), y2: Math.min(a.bottom, b.bottom) };
    if (overlapY && a.left >= b.right) return { axis: "x", from: b.right, to: a.left, value: a.left - b.right, y1: Math.max(a.top, b.top), y2: Math.min(a.bottom, b.bottom) };
    if (overlapX && b.top >= a.bottom) return { axis: "y", from: a.bottom, to: b.top, value: b.top - a.bottom, x1: Math.max(a.left, b.left), x2: Math.min(a.right, b.right) };
    if (overlapX && a.top >= b.bottom) return { axis: "y", from: b.bottom, to: a.top, value: a.top - b.bottom, x1: Math.max(a.left, b.left), x2: Math.min(a.right, b.right) };
    return null;
  }
  // Voisins les plus proches (un par côté) d'un rectangle
  function neighbours(rect, others, max) {
    var lim = max || 400, out = { left: null, right: null, top: null, bottom: null };
    others.forEach(function (o) {
      var g = gapBetween(rect, o);
      if (!g || g.value > lim) return;
      var side = g.axis === "x" ? (o.left >= rect.right ? "right" : "left") : (o.top >= rect.bottom ? "bottom" : "top");
      if (!out[side] || g.value < out[side].value) { g.other = o; out[side] = g; }
    });
    return out;
  }
  // Espacements identiques : écarts déjà présents entre éléments voisins de la liste (même axe), avec leur
  // fréquence ; sert à proposer de reproduire un écart existant (tolérance 0,5 px)
  function repeatedGaps(rects, axis) {
    var sorted = rects.slice().sort(function (a, b) { return axis === "x" ? a.left - b.left : a.top - b.top; });
    var counts = {};
    for (var i = 0; i + 1 < sorted.length; i++) {
      var g = gapBetween(sorted[i], sorted[i + 1]);
      if (g && g.axis === axis && g.value > 0) { var k = Math.round(g.value * 2) / 2; counts[k] = (counts[k] || 0) + 1; }
    }
    return Object.keys(counts).map(function (k) { return { value: Number(k), count: counts[k] }; }).filter(function (x) { return x.count >= 2; }).sort(function (a, b) { return b.count - a.count; });
  }
  // Cibles d'écart : positions que prendrait un bord pour laisser, avec un élément voisin, un écart déjà utilisé
  // (écart répété entre voisins, ou gap réel d'un parent Flexbox / Grille). Dans les deux sens : après l'élément
  // (son bord droit / bas + écart) ou avant lui (son bord gauche / haut − écart).
  function gapTargets(rect, others, gaps, axis) {
    var out = [];
    others.forEach(function (o) {
      gaps.forEach(function (gp) {
        if (axis === "x") {
          if (Math.min(rect.bottom, o.bottom) - Math.max(rect.top, o.top) <= 0) return;
          out.push({ v: o.right + gp, kind: "gap", label: "écart de " + gp + " px", rect: o, pri: 1 });
          out.push({ v: o.left - gp, kind: "gap", label: "écart de " + gp + " px", rect: o, pri: 1 });
        } else {
          if (Math.min(rect.right, o.right) - Math.max(rect.left, o.left) <= 0) return;
          out.push({ v: o.bottom + gp, kind: "gap", label: "écart de " + gp + " px", rect: o, pri: 1 });
          out.push({ v: o.top - gp, kind: "gap", label: "écart de " + gp + " px", rect: o, pri: 1 });
        }
      });
    });
    return out;
  }

  var api = { UNITS: UNITS, DEFAULTS: DEFAULTS, COLUMN_CHOICES: COLUMN_CHOICES, normalize: normalize, gridFor: gridFor, niceStep: niceStep, minorStep: minorStep,
    fromPx: fromPx, toPx: toPx, format: format, parse: parse, webGrid: webGrid, gridTargets: gridTargets, nearest: nearest, reach: reach, snapAxis: snapAxis,
    gapBetween: gapBetween, neighbours: neighbours, repeatedGaps: repeatedGaps, gapTargets: gapTargets };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KWSnap = api;
})(typeof window !== "undefined" ? window : this);

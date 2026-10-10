// Éditeur de pages — MANIPULATION DIRECTE sur le canevas (survol intelligent, poignées d'écart et de marge intérieure, main temporaire).
//
// Principe : ce module ne possède AUCUNE donnée. Il lit et écrit les mêmes propriétés que l'inspecteur (styles par écran, via le pont fourni par
// page-builder.js : styleSet / change / ownValue / inheritedValue). Pendant un geste, seul un style inline est posé sur l'élément du canevas ;
// au relâchement, UNE seule étape d'historique est enregistrée (puis la sauvegarde habituelle). Rien n'est écrit pendant le geste.
//
// Registre : DIRECT_CONTROLS = [{ id, appliesTo(item, caps), handles(ctx) }]. Un nouveau contrôle s'ajoute avec pbDirect.register(...), sans toucher au reste.
// Les capacités viennent de l'inspecteur (INSPECTORS[type].groups), jamais d'une seconde liste : un type sans « écart » n'a pas de poignée d'écart.
(function (root) {
  "use strict";
  var B = null;              // pont (page-builder.js)
  var DOC = null;            // document de l'iframe courant
  var layer = null;          // couche persistante (hors flux) dans ce document
  var hoverEl = null, hoverTag = null, tip = null;
  var st = { hoverId: null, near: false, touch: false, drag: null, raf: 0, last: null, spaceTemp: null, handles: [] };
  var STRUCTURAL = ["layout", "container", "columns", "column", "grid", "stack", "group"];
  var SIDES = { Top: "paddingTop", Right: "paddingRight", Bottom: "paddingBottom", Left: "paddingLeft" };
  var SIDE_LABEL = { Top: "haute", Right: "droite", Bottom: "basse", Left: "gauche" };
  var NEAR = 14;             // tolérance (px de page) autour de l'élément sélectionné : les poignées restent atteignables sans clignoter

  // ---------- Registre des contrôles ----------
  var CONTROLS = [];
  function register(c) { CONTROLS = CONTROLS.filter(function (x) { return x.id !== c.id; }).concat([c]); }

  // ---------- Aides ----------
  var px = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };
  var round = function (n, d) { var k = Math.pow(10, d || 0); return Math.round(n * k) / k; };
  function el(tag, cls, text) { var e = DOC.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function snapPrefs() { try { var s = root.pbRules && root.pbRules.state(); return s ? { on: Boolean(s.aids.snap && s.prefs.snap.on !== false && s.prefs.snap.grid), step: s.prefs.step || 8 } : { on: false, step: 8 }; } catch (e) { return { on: false, step: 8 }; } }
  function targetOf(node) { return node && node.closest ? node.closest("[data-node-id],[data-section-id]") : null; }
  function idOf(e) { return e ? e.getAttribute("data-node-id") || e.getAttribute("data-section-id") : null; }
  function overlayOf(node) { return node && node.closest ? node.closest(".pb-dm-layer, .pb-sel-box, .pb-sel-badge, .pb-handle, .pb-dim, .pb-col-split, .pb-struct-add, .pb-parent-box, .pb-smart-layer, .pb-ruler, .pb-guide") : null; }
  function usable(it) { return Boolean(it && B.canWrite() && (B.isNode(it) || it.type === "layout") && !B.lockedDeep(it.id)); }

  // Valeur px ⇄ unité du moteur (px, rem, em : conversion fiable ; % : pas de conversion fiable → px, annoncé)
  function unitInfo(it, key, elm) {
    var v = B.ownValue(it, key); if (v === undefined) v = B.inheritedValue(it, key);
    var p = typeof v === "string" && v.indexOf("token:") !== 0 && B.splitLen ? B.splitLen(v) : null;
    var unit = p && p.unit ? p.unit : "px", token = typeof v === "string" && v.indexOf("token:") === 0;
    var cs = DOC.defaultView.getComputedStyle(elm);
    var rem = px(DOC.defaultView.getComputedStyle(DOC.documentElement).fontSize) || 16, em = px(cs.fontSize) || 16;
    var changed = false;
    if (unit === "%" || unit === "vw" || unit === "vh" || unit === "auto" || unit === "") { unit = "px"; changed = true; }
    if (token) changed = true;
    return { unit: unit, rem: rem, em: em, changed: changed, inherited: B.ownValue(it, key) === undefined && B.inheritedValue(it, key) !== undefined };
  }
  function toUnit(pxv, ui) { return ui.unit === "rem" ? round(pxv / ui.rem, 2) : ui.unit === "em" ? round(pxv / ui.em, 2) : Math.round(pxv); }
  function fmt(pxv, ui) { return toUnit(pxv, ui) + " " + ui.unit; }
  function stepFor(ui, big) { return ui.unit === "px" ? (big ? 10 : 1) : (big ? 1 : 0.1); }

  // ---------- Couche persistante ----------
  function ensureLayer() {
    if (!DOC || !DOC.body) return null;
    if (layer && layer.isConnected && layer.ownerDocument === DOC) return layer;
    layer = el("div", "pb-dm-layer"); layer.setAttribute("aria-hidden", "false");
    hoverEl = el("div", "pb-dm-hover"); hoverEl.hidden = true;
    hoverTag = el("div", "pb-dm-tag"); hoverTag.hidden = true;
    tip = el("div", "pb-dm-tip"); tip.hidden = true;
    layer.appendChild(hoverEl); layer.appendChild(hoverTag); layer.appendChild(tip);
    DOC.body.appendChild(layer);
    DOC.body.classList.add("pb-dm-on");
    return layer;
  }
  function place(node, r) { node.style.left = r.left + "px"; node.style.top = r.top + "px"; node.style.width = r.width + "px"; node.style.height = r.height + "px"; }

  // ---------- Survol intelligent : UNE cible, la plus profonde, jamais pendant un geste ----------
  function hoverEnabled() { return DOC && !st.drag && !B.gesture() && !B.editing() && B.tool() !== "hand" && !st.touch; }
  function setHover(node) {
    var id = node ? idOf(node) : null;
    if (id === st.hoverId) return;
    st.hoverId = id;
    if (!id || B.selection().indexOf(id) >= 0) { hoverEl.hidden = true; hoverTag.hidden = true; return; }
    var it = B.byId(id); if (!it) { hoverEl.hidden = true; hoverTag.hidden = true; return; }
    var r = B.pageRect(node);
    place(hoverEl, r); hoverEl.hidden = false;
    // Petite barre à l'intérieur du coin haut gauche (donc sans « trou » entre l'élément et la barre : pas de clignotement en y allant)
    hoverTag.textContent = "";
    var name = el("span", "pb-dm-name", B.nameOf(it)); hoverTag.appendChild(name);
    if (B.canWrite()) {
      [["mousePointer", "Sélectionner", function () { B.select(id); }], ["sliders", "Style : ouvrir les réglages", function () { B.select(id); B.openInspector("style"); }], ["copy", "Dupliquer", function () { B.select(id); B.duplicateSelected(); }]].forEach(function (a) {
        var b = el("button", "pb-dm-act"); b.type = "button"; b.title = a[1]; b.setAttribute("aria-label", a[1]);
        var ic = B.icon(a[0]); if (ic) b.appendChild(DOC.importNode(ic, true));
        b.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
        b.addEventListener("mousedown", function (e) { e.stopPropagation(); e.preventDefault(); });
        b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); setHover(null); a[2](); });
        hoverTag.appendChild(b);
      });
    }
    // Au-dessus de l'élément, collée à son bord (aucun vide à traverser : pas de clignotement) ; dans le coin haut gauche seulement s'il n'y a pas de place au-dessus.
    // La barre elle-même ne capte pas la souris : seules ses trois petites icônes le font (le texte du nom laisse passer les clics).
    var above = r.top >= 24;
    hoverTag.style.left = (r.left) + "px"; hoverTag.style.top = (above ? r.top - 22 : r.top + 2) + "px"; hoverTag.hidden = false;
  }

  // ---------- Contrôle « écart » (gap, rowGap, columnGap) ----------
  var gapControl = {
    id: "gap", label: "Écart entre les éléments",
    appliesTo: function (it, caps) { return Boolean(caps.gap); },
    handles: function (ctx) {
      var it = ctx.it, elm = ctx.el, cs = ctx.cs;
      if (!/^(inline-)?(flex|grid)$/.test(cs.display)) return []; // en mise en page « bloc » l'écart n'a aucun effet : pas de contrôle inutile
      var kids = (B.kidsOf(it) || []).slice(0, 40).map(function (c) { return B.canvasEl(c.id); }).filter(Boolean);
      var rects = kids.map(function (k) { return B.pageRect(k); }).filter(function (r) { return r.width > 0 && r.height > 0; });
      var zones = [];
      rects.forEach(function (a, i) {
        var aB = a.top + a.height, aR = a.left + a.width, bestY = null, bestX = null;
        rects.forEach(function (b, j) {
          if (j === i) return;
          var x1 = Math.max(a.left, b.left), x2 = Math.min(aR, b.left + b.width), y1 = Math.max(a.top, b.top), y2 = Math.min(aB, b.top + b.height);
          if (b.top >= aB - 0.5 && x2 - x1 >= 4 && (!bestY || b.top < bestY.top)) bestY = { top: b.top, x1: x1, x2: x2 };
          if (b.left >= aR - 0.5 && y2 - y1 >= 4 && (!bestX || b.left < bestX.left)) bestX = { left: b.left, y1: y1, y2: y2 };
        });
        if (bestY) zones.push({ axis: "y", x: (bestY.x1 + bestY.x2) / 2, y: aB + (bestY.top - aB) / 2, w: bestY.x2 - bestY.x1, h: bestY.top - aB });
        if (bestX) zones.push({ axis: "x", x: aR + (bestX.left - aR) / 2, y: (bestX.y1 + bestX.y2) / 2, w: bestX.left - aR, h: bestX.y2 - bestX.y1 });
      });
      // doublons (même ligne d'écart vue de plusieurs éléments) : on garde une poignée par ligne
      var seen = {}, out = [];
      zones.forEach(function (z) { var k = z.axis + ":" + Math.round(z.axis === "y" ? z.y : z.x); if (!seen[k] && out.length < 12) { seen[k] = 1; out.push(z); } });
      var split = ["rowGap", "columnGap"].some(function (k) { return B.ownValue(it, k) !== undefined || B.inheritedValue(it, k) !== undefined; });
      return out.map(function (z) {
        var key = split ? (z.axis === "y" ? "rowGap" : "columnGap") : "gap";
        var ui = unitInfo(it, key, elm);
        var base = px(z.axis === "y" ? cs.rowGap : cs.columnGap);
        return { kind: "gap", axis: z.axis, x: z.x, y: z.y, zone: z, keys: [key], base: base, ui: ui, min: 0, sign: 1, name: "Écart " + (z.axis === "y" ? "vertical" : "horizontal"),
          aria: "Écart " + (z.axis === "y" ? "vertical" : "horizontal") + " entre les éléments : glisser, ou flèches du clavier (Maj : par 10)", hint: "Modifier l'écart",
          live: function (v) { elm.style.setProperty(key === "gap" ? "gap" : key === "rowGap" ? "row-gap" : "column-gap", v + "px"); }, restore: function () { ["gap", "row-gap", "column-gap"].forEach(function (p) { elm.style.removeProperty(p); }); } };
      });
    }
  };

  // ---------- Contrôle « marge intérieure » (padding des conteneurs) ----------
  var paddingControl = {
    id: "padding", label: "Marge intérieure",
    appliesTo: function (it, caps) { return Boolean(caps.spacing) && STRUCTURAL.indexOf(it.type) >= 0; },
    handles: function (ctx) {
      var it = ctx.it, elm = ctx.el, cs = ctx.cs, r = ctx.rect, out = [];
      Object.keys(SIDES).forEach(function (side) {
        var key = SIDES[side], v = px(cs[key]), inset = Math.max(v / 2, 16), ui = unitInfo(it, key, elm);
        var vertical = side === "Top" || side === "Bottom";
        var x = vertical ? r.left + r.width / 2 : side === "Left" ? r.left + inset : r.left + r.width - inset;
        var y = vertical ? (side === "Top" ? r.top + inset : r.top + r.height - inset) : r.top + r.height / 2;
        out.push({ kind: "pad", side: side, axis: vertical ? "y" : "x", x: x, y: y, keys: [key], base: v, ui: ui, min: 0, sign: side === "Top" || side === "Left" ? 1 : -1, name: "Marge intérieure " + SIDE_LABEL[side],
          aria: "Marge intérieure " + SIDE_LABEL[side] + " : glisser, ou flèches du clavier (Maj : par 10 ; Maj + glisser : les quatre côtés)", hint: "Modifier la marge intérieure",
          live: function (val, all) { (all ? Object.keys(SIDES) : [side]).forEach(function (s) { elm.style[SIDES[s]] = val + "px"; }); },
          restore: function () { Object.keys(SIDES).forEach(function (s) { elm.style[SIDES[s]] = ""; }); },
          band: { side: side, v: v } });
      });
      return out;
    }
  };
  register(gapControl); register(paddingControl);

  // ---------- Poignées : création, positionnement ----------
  function clearHandles() {
    st.handles.forEach(function (h) { if (h.node.parentNode) h.node.parentNode.removeChild(h.node); if (h.zone && h.zone.parentNode) h.zone.parentNode.removeChild(h.zone); });
    st.handles = [];
  }
  function refresh() {
    if (!B || !DOC || !ensureLayer()) return;
    if (st.drag) return;
    clearHandles();
    var sel = B.selection();
    if (sel.length !== 1 || B.gesture() || B.editing() || B.tool() === "hand") { layer.classList.remove("is-near"); return; }
    var it = B.byId(sel[0]), elm = it && B.canvasEl(it.id);
    if (!usable(it) || !elm) return;
    var caps = B.caps(it), cs = DOC.defaultView.getComputedStyle(elm), rect = B.pageRect(elm);
    var ctx = { it: it, el: elm, cs: cs, rect: rect, caps: caps };
    CONTROLS.forEach(function (c) {
      if (!c.appliesTo(it, caps)) return;
      c.handles(ctx).forEach(function (spec) { build(spec, it, elm); });
    });
    layer.classList.toggle("is-near", st.near || st.touch);
  }
  function build(spec, it, elm) {
    var node = el("div", "pb-dm-h pb-dm-" + spec.kind + " is-" + spec.axis + (spec.side ? " is-" + spec.side.toLowerCase() : ""));
    node.setAttribute("role", "slider"); node.setAttribute("tabindex", "0"); node.title = spec.hint; node.setAttribute("aria-label", spec.aria);
    node.setAttribute("aria-orientation", spec.axis === "y" ? "vertical" : "horizontal"); node.setAttribute("aria-valuemin", "0");
    node.setAttribute("aria-valuenow", String(toUnit(spec.base, spec.ui))); node.setAttribute("aria-valuetext", fmt(spec.base, spec.ui));
    node.style.left = spec.x + "px"; node.style.top = spec.y + "px";
    var zone = null;
    if (spec.kind === "gap") { zone = el("div", "pb-dm-gaprect"); place(zone, { left: spec.zone.axis === "y" ? spec.x - spec.zone.w / 2 : spec.x - spec.zone.w / 2, top: spec.y - spec.zone.h / 2, width: spec.zone.w, height: spec.zone.h }); layer.appendChild(zone); }
    var h = { node: node, spec: spec, zone: zone, it: it, el: elm };
    node.addEventListener("pointerdown", function (e) { startDrag(e, h); });
    node.addEventListener("keydown", function (e) { onKey(e, h); });
    node.addEventListener("focus", function () { layer.classList.add("is-near"); if (zone) zone.classList.add("is-on"); showTip(h, spec.base); });
    node.addEventListener("blur", function () { if (!st.drag) { tip.hidden = true; if (zone) zone.classList.remove("is-on"); } });
    node.addEventListener("pointerenter", function () { if (zone && !st.drag) zone.classList.add("is-on"); });
    node.addEventListener("pointerleave", function () { if (zone && !st.drag && DOC.activeElement !== node) zone.classList.remove("is-on"); });
    layer.appendChild(node); st.handles.push(h);
  }
  function showTip(h, pxv, note) {
    var s = h.spec, ui = s.ui;
    tip.textContent = s.name + " · " + fmt(pxv, ui) + (ui.inherited && h.fresh !== false ? " · hérité" : "") + (note ? " · " + note : "");
    tip.style.left = (s.x + 16) + "px"; tip.style.top = (s.y - 28) + "px"; tip.hidden = false;
  }

  // ---------- Geste : un seul style inline pendant le geste, UNE étape d'historique au relâchement ----------
  function nextValue(h, startPx, delta, ev) {
    var s = h.spec, v = startPx + s.sign * delta;
    v = Math.max(s.min, v);
    var sp = snapPrefs();
    if (sp.on && !(ev && ev.altKey)) { var m = Math.round(v / sp.step) * sp.step; if (Math.abs(v - m) <= 3) v = m; } // aimantation douce : une valeur précise reste possible
    return s.ui.unit === "px" ? Math.round(v) : v;
  }
  function startDrag(e, h) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    var s = h.spec, startPx = s.base, p0 = s.axis === "y" ? e.clientY : e.clientX, cur = startPx, all = false;
    st.drag = { h: h, cancelled: false };
    B.gesture(true);
    try { h.node.setPointerCapture(e.pointerId); } catch (x) { /* capture indisponible : les écouteurs du document prennent le relais */ }
    h.node.classList.add("is-active"); layer.classList.add("is-near", "is-dragging");
    if (h.zone) h.zone.classList.add("is-on");
    // Les coordonnées d'un événement reçu DANS l'iframe sont déjà en pixels de page (le zoom est une transformation du cadre) : aucune division par le zoom
    var scale = 1;
    var apply = function () {
      var next = st.last; st.raf = 0; if (!next) return;
      var d = ((s.axis === "y" ? next.y : next.x) - p0) / scale;
      all = Boolean(next.shift && s.kind === "pad");
      cur = nextValue(h, startPx, d, next);
      s.live(cur, all);
      showTip(h, cur, all ? "4 côtés" : (s.ui.changed ? (s.ui.unit === "px" && s.ui.inherited === false ? "unité : px" : "") : ""));
      var cs = DOC.defaultView.getComputedStyle(h.el);
      h.node.setAttribute("aria-valuenow", String(toUnit(cur, s.ui))); h.node.setAttribute("aria-valuetext", fmt(cur, s.ui));
      reposition(h);
    };
    var move = function (ev) { st.last = { x: ev.clientX, y: ev.clientY, shift: ev.shiftKey, altKey: ev.altKey }; if (!st.raf) st.raf = DOC.defaultView.requestAnimationFrame(apply); };
    var onKeyDrag = function (ev) { if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); st.drag.cancelled = true; finish(); } };
    var finish = function (ev) {
      DOC.removeEventListener("pointermove", move, true); DOC.removeEventListener("pointerup", finish, true); DOC.removeEventListener("pointercancel", finish, true); DOC.removeEventListener("keydown", onKeyDrag, true); document.removeEventListener("keydown", onKeyDrag, true);
      if (st.raf) { DOC.defaultView.cancelAnimationFrame(st.raf); st.raf = 0; if (st.last && !st.drag.cancelled) apply(); }
      try { h.node.releasePointerCapture(e.pointerId); } catch (x) { /* déjà relâché */ }
      var cancelled = st.drag.cancelled;
      s.restore(); tip.hidden = true; layer.classList.remove("is-dragging"); h.node.classList.remove("is-active");
      st.drag = null; st.last = null;
      B.ignoreClick(300); // le clic qui suit le relâchement ne doit pas désélectionner
      B.gesture(false);
      if (!cancelled && Math.round(cur * 100) !== Math.round(startPx * 100)) commit(h, cur, startPx, all);
      else refresh();
    };
    DOC.addEventListener("pointermove", move, true); DOC.addEventListener("pointerup", finish, true); DOC.addEventListener("pointercancel", finish, true); DOC.addEventListener("keydown", onKeyDrag, true); document.addEventListener("keydown", onKeyDrag, true);
  }
  function reposition(h) {
    // l'élément change de taille pendant le geste : les poignées suivent (une lecture par image)
    var r = B.pageRect(h.el), s = h.spec, cs = DOC.defaultView.getComputedStyle(h.el);
    if (s.kind === "pad") {
      var side = s.side, inset = Math.max(px(cs[SIDES[side]]) / 2, 16), vertical = s.axis === "y";
      s.x = vertical ? r.left + r.width / 2 : side === "Left" ? r.left + inset : r.left + r.width - inset;
      s.y = vertical ? (side === "Top" ? r.top + inset : r.top + r.height - inset) : r.top + r.height / 2;
      h.node.style.left = s.x + "px"; h.node.style.top = s.y + "px";
    }
    tip.style.left = (s.x + 16) + "px"; tip.style.top = (s.y - 28) + "px";
  }
  function commit(h, valuePx, startPx, all) {
    var s = h.spec, id = h.it.id, ui = s.ui, val = toUnit(valuePx, ui) + ui.unit, before = toUnit(startPx, ui) + ui.unit;
    var keys = all ? Object.keys(SIDES).map(function (k) { return SIDES[k]; }) : s.keys;
    var label = s.name + " : " + before + " → " + val;
    B.change(function () {
      var it = B.byId(id); if (!it) return false;
      var set = B.styleSet(it, B.device(), "normal", true); if (!set) return false;
      keys.forEach(function (k) { set[k] = Number(toUnit(valuePx, ui)) === 0 ? "0" : val; });
      B.cleanStyles(it);
    }, { key: "direct:" + id + ":" + keys.join(",") + ":" + Date.now(), label: label });
    B.toast(label + " (écran « " + B.bpLabel(B.device()) + " »)." + (ui.changed ? " Unité : px." : ""));
  }
  // Clavier : flèches = pas fin, Maj = pas large. Alt est laissé aux raccourcis de l'éditeur (Alt + ↑ / ↓ déplace l'élément).
  function onKey(e, h) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var dir = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : 0;
    if (!dir) { if (e.key === "Escape") { h.node.blur(); } return; }
    e.preventDefault(); e.stopPropagation();
    var s = h.spec, ui = s.ui, stepPx = stepFor(ui, e.shiftKey) * (ui.unit === "rem" ? ui.rem : ui.unit === "em" ? ui.em : 1);
    var to = Math.max(s.min, s.base + dir * stepPx); // flèche haut / droite : augmenter ; bas / gauche : diminuer (sur tous les côtés)
    to = ui.unit === "px" ? Math.round(to) : to;
    if (Math.round(to * 100) === Math.round(s.base * 100)) return;
    commit(h, to, s.base, false);
  }

  // ---------- Proximité (les poignées n'apparaissent qu'à portée de l'élément sélectionné) et survol ----------
  function onMove(e) {
    if (e.pointerType === "touch") { st.touch = true; return; }
    st.touch = false;
    st.last2 = { x: e.clientX, y: e.clientY, target: e.target };
    if (!st.raf2) st.raf2 = DOC.defaultView.requestAnimationFrame(frame);
  }
  function frame() {
    st.raf2 = 0;
    var m = st.last2; if (!m || !DOC || st.drag) return;
    var win = DOC.defaultView, over = overlayOf(m.target);
    // survol : une seule cible, la plus profonde ; sur un overlay (poignée, barre) on garde la cible actuelle
    if (!over) { if (hoverEnabled()) setHover(targetOf(DOC.elementFromPoint(m.x, m.y))); else if (st.hoverId) setHover(null); }
    // proximité de la sélection
    var sel = B.selection(), near = false;
    if (sel.length === 1) {
      var e0 = B.canvasEl(sel[0]);
      if (e0) { var r = e0.getBoundingClientRect(); near = m.x >= r.left - NEAR && m.x <= r.right + NEAR && m.y >= r.top - NEAR && m.y <= r.bottom + NEAR; }
    }
    if (near !== st.near) { st.near = near; if (layer) layer.classList.toggle("is-near", near || st.touch); }
  }
  function onLeave() { if (st.hoverId) setHover(null); if (st.near) { st.near = false; if (layer && !st.drag) layer.classList.remove("is-near"); } }

  // ---------- Main temporaire : Espace maintenu (jamais dans un champ, une fenêtre, un menu ou pendant une édition) ----------
  function spaceAllowed(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return false;
    var t = e.target, tag = t && t.tagName;
    if (t && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A" || t.isContentEditable || (t.closest && t.closest("[contenteditable],[role=button],[role=menuitem],[role=slider],summary")))) return false;
    if (B.editing()) return false;
    var top = document; if (top.querySelector("dialog[open], .pb-menu:not([hidden]), .pb-cpop:not([hidden]), .pb-amenu, .pb-rules-pop:not([hidden])")) return false;
    return true;
  }
  function spaceDown(e) {
    if (!(e.code === "Space" || e.key === " ")) return;
    if (!spaceAllowed(e)) return;
    e.preventDefault();                       // l'Espace ne fait pas défiler la page quand il sert de main
    if (e.repeat || st.spaceTemp !== null || B.tool() === "hand") return;
    st.spaceTemp = B.tool(); B.setTool("hand");
  }
  function spaceUp(e) {
    if (!(e.code === "Space" || e.key === " ") || st.spaceTemp === null) return;
    var back = st.spaceTemp; st.spaceTemp = null;
    if (B.tool() === "hand") B.setTool(back || "select");
  }
  function spaceReset() { if (st.spaceTemp !== null) { var back = st.spaceTemp; st.spaceTemp = null; if (B.tool() === "hand") B.setTool(back || "select"); } }

  // Panoramique depuis la zone grise autour de la page (le document de l'iframe gère déjà le sien : outil Main existant)
  function stagePan(stage) {
    stage.addEventListener("pointerdown", function (e) {
      if (B.tool() !== "hand" || e.button !== 0 || (e.target.closest && e.target.closest("iframe, button, [role=button]"))) return;
      e.preventDefault();
      var win = B.frame().contentWindow, sx = e.clientX, sy = e.clientY, oy = win.scrollY, sl = stage.scrollLeft, st0 = stage.scrollTop;
      document.body.classList.add("is-panning");
      var move = function (ev) { win.scrollTo(0, oy - (ev.clientY - sy) / (B.zoom() || 1)); stage.scrollLeft = sl - (ev.clientX - sx); stage.scrollTop = st0 - (ev.clientY - sy); };
      var up = function () { stage.removeEventListener("pointermove", move); stage.removeEventListener("pointerup", up); stage.removeEventListener("pointercancel", up); document.body.classList.remove("is-panning"); try { stage.releasePointerCapture(e.pointerId); } catch (x) { /* déjà relâché */ } };
      try { stage.setPointerCapture(e.pointerId); } catch (x) { /* capture indisponible */ }
      stage.addEventListener("pointermove", move); stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
    });
  }

  // ---------- Branchement ----------
  function canvas(doc) {
    if (!B || !doc || !doc.body) return;
    DOC = doc; layer = null; st.hoverId = null; st.near = false; st.handles = []; st.drag = null;
    ensureLayer();
    doc.addEventListener("pointermove", onMove, { passive: true });
    doc.addEventListener("pointerleave", onLeave);
    doc.addEventListener("pointerdown", function (e) { if (e.pointerType === "touch") { st.touch = true; if (layer) layer.classList.add("is-near"); } else st.touch = false; }, true);
    doc.addEventListener("keydown", spaceDown, true); doc.addEventListener("keyup", spaceUp, true);
    doc.defaultView.addEventListener("blur", spaceReset);
    refresh();
  }
  function attach(bridge) {
    B = bridge;
    document.addEventListener("keydown", spaceDown, true); document.addEventListener("keyup", spaceUp, true);
    window.addEventListener("blur", spaceReset);
    var stage = B.stage(); if (stage) stagePan(stage);
    // bouton « Main » près du zoom : même état que l'outil H ; l'état se synchronise quand l'outil change (touche H, Espace maintenu, bouton)
    var btn = document.querySelector("[data-pb-pan]");
    if (btn) {
      btn.addEventListener("click", function () { B.setTool(B.tool() === "hand" ? "select" : "hand"); });
      var sync = function () { var on = B.tool() === "hand"; btn.setAttribute("aria-pressed", String(on)); var s = B.stage(); if (s) s.classList.toggle("is-hand", on); };
      document.addEventListener("pb:tool", sync); sync();
    }
    var d0 = B.frame().contentDocument; if (d0 && d0.body && d0.body.classList.contains("lp-builder")) canvas(d0); // le canevas était déjà chargé
    document.addEventListener("pb:tool", function () { if (B.tool() === "hand") { setHover(null); clearHandles(); if (layer) layer.classList.remove("is-near"); } else refresh(); });
  }
  root.pbDirect = { attach: attach, canvas: canvas, refresh: refresh, register: register, controls: function () { return CONTROLS.map(function (c) { return c.id; }); } };
})(window);

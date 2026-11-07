// Motion Studio — module « split-text » : découpe un texte en lettres, mots ou lignes et le révèle (6 effets).
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Le serveur écrit le texte COMPLET dans .kw-ms-st-src (visible sans JavaScript) ;
// ce module le remplace par : une copie lisible par les lecteurs d'écran (.kw-ms-sr, masquée visuellement par découpage) + la version découpée (aria-hidden).
// Mouvement réduit : aucun découpage, le texte reste tel quel. destroy() restitue le contenu d'origine.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("split-text", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  // Images-clés des 6 effets (appliquées à .kw-ms-u, jamais à la racine : sa transformation propre n'est pas touchée)
  var PRESETS = {
    "fade-up": [{ opacity: 0, transform: "translateY(.6em)" }, { opacity: 1, transform: NONE }],
    fade: [{ opacity: 0 }, { opacity: 1 }],
    blur: [{ opacity: 0, filter: "blur(.35em)" }, { opacity: 1, filter: "blur(0)" }],
    "mask-up": [{ transform: "translateY(105%)" }, { transform: NONE }],
    scale: [{ opacity: 0, transform: "scale(.5)" }, { opacity: 1, transform: NONE }],
    flip: [{ opacity: 0, transform: "rotateX(-90deg) translateY(.3em)" }, { opacity: 1, transform: NONE }],
  };
  // Effets supplémentaires du composant « Révélation de texte » (lot t, module partagé) : le composant « Texte animé » n'en propose que les 6 ci-dessus
  var REVEAL = {
    dim: [{ opacity: 0.15 }, { opacity: 1 }],
    "slide-left": [{ opacity: 0, transform: "translateX(-.8em)" }, { opacity: 1, transform: NONE }],
    "slide-right": [{ opacity: 0, transform: "translateX(.8em)" }, { opacity: 1, transform: NONE }],
    rotate: [{ opacity: 0, transform: "rotate(10deg) translateY(.5em)" }, { opacity: 1, transform: NONE }],
    wipe: [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
    "blur-in": [{ opacity: 0, filter: "blur(.5em)", transform: "scale(1.1)" }, { opacity: 1, filter: "blur(0)", transform: NONE }],
  };
  var frames = function (id) { return PRESETS[id] || REVEAL[id] || null; };
  // Texte → suite de { w: "mot" } et { s: " " } (les espaces sont conservés tels quels entre les mots)
  function splitWords(text) {
    var out = [];
    String(text).split(/(\s+)/).forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) out.push({ s: " " }); else out.push({ w: p }); });
    return out;
  }
  // Lettres d'un mot sans couper un caractère composé (accent combiné, émoji) : Array.from suit les points de code
  var charsOf = function (w) { return Array.from(w); };

  function init(ctx) {
    var el = ctx.el, doc = ctx.doc;
    var src = el.querySelector(".kw-ms-st-src");
    if (!src || ctx.reduced) return {};
    var unit = el.getAttribute("data-kw-ms-split") || "words";
    var preset = frames(ctx.cfg.preset) ? ctx.cfg.preset : "fade-up";
    var segs = [], full = [];
    Array.prototype.forEach.call(src.childNodes, function (n) {
      if (n.nodeName === "BR") { segs.push({ br: true }); full.push(" "); }
      else { segs.push({ t: n.textContent }); full.push(n.textContent); }
    });
    var text = full.join("").replace(/\s+/g, " ").trim();
    var mk = function (cls, parent) { var s = doc.createElement("span"); s.className = cls; if (parent) parent.appendChild(s); return s; };
    var sr = mk("kw-ms-sr"); sr.textContent = text;
    var vis = mk("kw-ms-st-vis"); vis.setAttribute("aria-hidden", "true");
    if (preset === "mask-up") vis.className += " kw-ms-masked";
    if (preset === "flip") vis.className += " kw-ms-3d";
    var units = [];
    var addUnit = function (parent, content) { var m = mk("kw-ms-m", parent), u = mk("kw-ms-u", m); u.textContent = content; units.push(u); return u; };

    el.textContent = "";
    el.appendChild(sr); el.appendChild(vis);

    var buildFlat = function () { // mots ou lettres
      segs.forEach(function (sg) {
        if (sg.br) { vis.appendChild(doc.createElement("br")); return; }
        splitWords(sg.t).forEach(function (p) {
          if (p.s) { vis.appendChild(doc.createTextNode(" ")); return; }
          if (unit === "chars") { var w = mk("kw-ms-w", vis); charsOf(p.w).forEach(function (c) { addUnit(w, c); }); }
          else { var m = mk("kw-ms-w", vis); addUnit(m, p.w); }
        });
      });
    };
    var buildLines = function () {
      // 1) mesure : les mots en ligne, regroupés par position verticale ; 2) chaque ligne devient un bloc
      var probe = mk("kw-ms-st-probe", vis), words = [];
      segs.forEach(function (sg) {
        if (sg.br) { probe.appendChild(doc.createElement("br")); words.push(null); return; }
        splitWords(sg.t).forEach(function (p) { if (p.s) probe.appendChild(doc.createTextNode(" ")); else { var s = mk("kw-ms-pw", probe); s.textContent = p.w; words.push(s); } });
      });
      var lines = [], cur = [], top = null;
      words.forEach(function (s) {
        if (!s) { if (cur.length) lines.push(cur); cur = []; top = null; return; }
        var t = s.offsetTop;
        if (top !== null && Math.abs(t - top) > 2) { lines.push(cur); cur = []; }
        top = t; cur.push(s.textContent);
      });
      if (cur.length) lines.push(cur);
      vis.removeChild(probe);
      lines.forEach(function (ws) { var l = addUnit(vis, ws.join(" ")); l.parentNode.className += " kw-ms-line"; });
    };
    if (unit === "lines") buildLines(); else buildFlat();
    if (!units.length) { restore(); return {}; }

    var n = units.length;
    units.forEach(function (u, i) { ctx.animate(u, frames(preset), { delay: ctx.stagger(i, n) }); });

    function restore() { el.textContent = ""; el.appendChild(src); }
    // Les lignes dépendent de la largeur et des polices : on reconstruit (l'état « déjà joué » est conservé par le runtime)
    if (unit === "lines") {
      ctx.onResize(function () { ctx.rebuild(); });
      if (doc.fonts && doc.fonts.status !== "loaded" && doc.fonts.ready) { var live = true; doc.fonts.ready.then(function () { if (live) ctx.rebuild(); }); ctx.onCleanup(function () { live = false; }); }
    }
    return { destroy: restore };
  }
  return { PRESETS: PRESETS, REVEAL: REVEAL, splitWords: splitWords, charsOf: charsOf, init: init };
});

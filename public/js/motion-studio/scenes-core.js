// KOLAKISA — Motion Studio, lot 3 : cœur des SCÈNES (timeline multi-éléments). UMD : le même fichier sert au serveur (liste des effets, calcul des départs), à l'éditeur
// (timeline visuelle) et à la page publique (lecture). Aucune bibliothèque : Web Animations API. Modèle et règles : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md, section « Lot 3 »
//
//   scène = { id, name?, trigger?, anchor?, repeat?, scrub?, off?, steps: [pas] }
//   pas   = { id, target, effect?, at?, duration?, delay?, easing?, sync?, after? }
//
// Début d'un pas (ms) = base + délai, où base = début du pas `sync` (même départ), fin du pas `after` (à la suite), sinon `at` (instant absolu).
// Un lien incohérent (pas inconnu, boucle) est traité comme « instant absolu » : jamais d'erreur, jamais de blocage.
// Règle d'animation : transform en composition « add » (s'ajoute à --kw-tf et aux propriétés de kw-effects, ne les remplace pas) ; opacity / filter à part.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else { root.KWMSScenes = api; if (root.KWMS && root.KWMS.register) root.KWMS.register("scenes-core", function () { return api; }); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var EASINGS = { smooth: "cubic-bezier(.2, .7, .2, 1)", linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "cubic-bezier(.34, 1.56, .64, 1)" };
  var DEFAULT_STEP = { effect: "fade-in", at: 0, duration: 600, delay: 0, easing: "smooth" };
  var LIMITS = { at: [0, 30000], duration: [50, 10000], delay: [0, 10000], steps: 40, scenes: 12, name: 60 };
  var T = function (v) { return { transform: v }; };
  var O = function (v) { return { opacity: v }; };
  // kind : in (état final = état naturel de l'élément) · out (l'élément finit transformé / masqué) · emph (revient à l'état naturel)
  // fx : opacity / filter (remplacement) · tf : transform (composition « add »). Aucune largeur / hauteur / position.
  var EFFECTS = {
    "fade-in": { label: "Apparition (fondu)", kind: "in", fx: [O(0), O(1)] },
    "slide-up": { label: "Entrée par le bas", kind: "in", fx: [O(0), O(1)], tf: [T("translateY(40px)"), T("translateY(0)")] },
    "slide-down": { label: "Entrée par le haut", kind: "in", fx: [O(0), O(1)], tf: [T("translateY(-40px)"), T("translateY(0)")] },
    "slide-left": { label: "Entrée par la droite", kind: "in", fx: [O(0), O(1)], tf: [T("translateX(40px)"), T("translateX(0)")] },
    "slide-right": { label: "Entrée par la gauche", kind: "in", fx: [O(0), O(1)], tf: [T("translateX(-40px)"), T("translateX(0)")] },
    "zoom-in": { label: "Zoom avant (apparition)", kind: "in", fx: [O(0), O(1)], tf: [T("scale(.85)"), T("scale(1)")] },
    "zoom-out": { label: "Zoom arrière (apparition)", kind: "in", fx: [O(0), O(1)], tf: [T("scale(1.15)"), T("scale(1)")] },
    "blur-in": { label: "Netteté progressive", kind: "in", fx: [{ opacity: 0, filter: "blur(12px)" }, { opacity: 1, filter: "blur(0px)" }] },
    "rotate-in": { label: "Rotation d'entrée", kind: "in", fx: [O(0), O(1)], tf: [T("rotate(-8deg) scale(.95)"), T("rotate(0deg) scale(1)")] },
    "pop": { label: "Rebond d'apparition", kind: "in", fx: [O(0), O(1)], tf: [T("scale(.6)"), T("scale(1)")] },
    "wipe-up": { label: "Révélation vers le haut", kind: "in", fx: [{ opacity: 0, clipPath: "inset(100% 0 0 0)" }, { opacity: 1, clipPath: "inset(0% 0 0 0)" }] },
    "wipe-right": { label: "Révélation vers la droite", kind: "in", fx: [{ opacity: 0, clipPath: "inset(0 100% 0 0)" }, { opacity: 1, clipPath: "inset(0 0% 0 0)" }] },
    "pulse": { label: "Pulsation", kind: "emph", tf: [T("scale(1)"), T("scale(1.08)"), T("scale(1)")] },
    "fade-out": { label: "Disparition (fondu)", kind: "out", fx: [O(1), O(0)] },
    "slide-out-up": { label: "Sortie par le haut", kind: "out", fx: [O(1), O(0)], tf: [T("translateY(0)"), T("translateY(-40px)")] },
    "slide-out-down": { label: "Sortie par le bas", kind: "out", fx: [O(1), O(0)], tf: [T("translateY(0)"), T("translateY(40px)")] },
    "zoom-exit": { label: "Zoom arrière (sortie)", kind: "out", fx: [O(1), O(0)], tf: [T("scale(1)"), T("scale(.85)")] },
  };
  var TRIGGERS = { viewport: "Quand l'élément est visible", load: "Au chargement de la page", click: "Au clic sur l'élément", scroll: "Selon le défilement" };
  // Transitions de sections : effets sans transform ni filter (ils créeraient un bloc de référence pour les éléments `fixed` / `sticky` posés dans la section)
  var SECTION_EFFECTS = ["fade-in", "wipe-up", "wipe-right"];
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d) { v = Number(v); return isFinite(v) ? v : d; };
  var easingCss = function (e) { return Object.prototype.hasOwnProperty.call(EASINGS, e) ? EASINGS[e] : /^cubic-bezier\(/.test(String(e)) ? e : EASINGS.smooth; };

  // Valeurs effectives d'un pas (défauts appliqués, bornes respectées) — le serveur n'écrit jamais les défauts, le lecteur les rétablit
  function stepOf(s) {
    return {
      id: s.id, target: s.target, effect: Object.prototype.hasOwnProperty.call(EFFECTS, s.effect) ? s.effect : DEFAULT_STEP.effect,
      at: clamp(Math.round(num(s.at, 0)), LIMITS.at[0], LIMITS.at[1]), duration: clamp(Math.round(num(s.duration, DEFAULT_STEP.duration)), LIMITS.duration[0], LIMITS.duration[1]),
      delay: clamp(Math.round(num(s.delay, 0)), LIMITS.delay[0], LIMITS.delay[1]), easing: s.easing || DEFAULT_STEP.easing, sync: s.sync || null, after: s.after || null,
    };
  }
  // Départs et fins de tous les pas : { items: [{ id, step, start, end, base, link }], total }. `link` : "sync" | "after" | null (lien effectivement suivi)
  function resolve(scene) {
    var steps = ((scene && scene.steps) || []).map(stepOf), byId = {}, memo = {}, items = [];
    steps.forEach(function (s) { byId[s.id] = s; });
    function startOf(s, trail) {
      if (memo[s.id] !== undefined) return memo[s.id];
      var master = s.sync && s.sync !== s.id ? byId[s.sync] : null, kind = master ? "sync" : null;
      if (!master && s.after && s.after !== s.id && byId[s.after]) { master = byId[s.after]; kind = "after"; }
      if (master && trail.indexOf(master.id) >= 0) { master = null; kind = null; } // boucle : traité comme absolu
      var base = s.at;
      if (master) { var ms = startOf(master, trail.concat(s.id)); base = kind === "sync" ? ms : ms + master.duration; }
      var out = { start: base + s.delay, base: base, link: kind };
      memo[s.id] = out.start; byId[s.id].__link = kind; byId[s.id].__base = base;
      return out.start;
    }
    var total = 0;
    steps.forEach(function (s) {
      var st = startOf(s, [s.id]), end = st + s.duration;
      items.push({ id: s.id, step: s, start: st, end: end, base: s.__base, link: s.__link });
      total = Math.max(total, end);
    });
    return { items: items, total: Math.min(total, 120000) };
  }
  // Un lien crée-t-il une boucle ? (le serveur retire le lien fautif) — renvoie les identifiants de pas dont le lien est à retirer
  function cycles(steps) {
    var by = {}, bad = [];
    (steps || []).forEach(function (s) { by[s.id] = s; });
    (steps || []).forEach(function (s) {
      var seen = {}, cur = s;
      for (;;) {
        var nx = cur.sync || cur.after;
        if (!nx || !by[nx]) break;
        if (seen[nx] || nx === s.id) { bad.push(s.id); break; }
        seen[nx] = true; cur = by[nx];
      }
    });
    return bad;
  }
  var firstTarget = function (scene) { var s = (scene.steps || [])[0]; return s ? s.target : null; };
  var anchorOf = function (scene) { return scene.anchor || firstTarget(scene); };

  // Animations d'un effet sur un élément : créées EN PAUSE, état de départ tenu (fill both). timing : { delay, duration, easing }
  function animateStep(el, effectId, timing) {
    var fx = EFFECTS[effectId] || EFFECTS[DEFAULT_STEP.effect], out = [];
    var base = { duration: timing.duration, delay: timing.delay || 0, easing: easingCss(timing.easing), fill: "both" };
    var mk = function (frames, composite) {
      var o = {}; for (var k in base) o[k] = base[k];
      if (composite) o.composite = composite;
      var a = el.animate(frames, o); a.pause(); a.currentTime = 0; out.push(a);
    };
    if (fx.fx) mk(fx.fx);
    if (fx.tf) mk(fx.tf, "add");
    return out;
  }
  // État final sans animation (mouvement réduit) : seuls les effets de sortie laissent une trace ; les entrées finissent à l'état naturel de l'élément
  function applyFinal(el, effectId) {
    var fx = EFFECTS[effectId]; if (!fx || fx.kind !== "out") return [];
    var out = [], one = function (frames, composite) { var o = { duration: 1, fill: "forwards" }; if (composite) o.composite = composite; var a = el.animate([frames[frames.length - 1]], o); out.push(a); };
    if (fx.fx) one(fx.fx);
    if (fx.tf) one(fx.tf, "add");
    return out;
  }

  // Lecteur d'une scène. o : { find(id) → élément | null, cleanOnFinish?: bool, reduced?: bool (aucune animation créée) }
  function createPlayer(scene, o) {
    var r = resolve(scene), anims = [], kinds = [], extra = [], targets = 0, el, played = false;
    r.items.forEach(function (it) {
      el = o.find(it.step.target); if (!el) return;
      targets++;
      if (o.reduced) return; // mouvement réduit : aucune animation n'est créée, seul finish() applique les états finaux
      var list = animateStep(el, it.step.effect, { delay: it.start, duration: it.step.duration, easing: it.step.easing });
      list.forEach(function (a) {
        anims.push(a); kinds.push(EFFECTS[it.step.effect].kind);
        if (o.cleanOnFinish && EFFECTS[it.step.effect].kind !== "out") a.onfinish = function () { try { a.cancel(); } catch (e) { /* déjà retirée */ } };
      });
    });
    var each = function (fn) { anims.forEach(function (a) { try { fn(a); } catch (e) { /* animation retirée */ } }); };
    var p = {
      total: r.total, count: targets, steps: r.items.length,
      hold: function () { each(function (a) { a.pause(); a.currentTime = 0; }); },
      play: function () { played = true; each(function (a) { a.cancel(); a.currentTime = 0; a.play(); }); },
      pause: function () { each(function (a) { a.pause(); }); },
      resume: function () { each(function (a) { a.play(); }); },
      seek: function (ms) { each(function (a) { a.pause(); a.currentTime = clamp(ms, 0, r.total); }); },
      time: function () { var t = 0; each(function (a) { if (a.currentTime !== null && a.currentTime !== undefined) t = Math.max(t, Number(a.currentTime)); }); return Math.min(t, r.total); },
      state: function () {
        var s = "idle", running = 0, paused = 0, fin = 0;
        each(function (a) { if (a.playState === "running") running++; else if (a.playState === "paused") paused++; else if (a.playState === "finished") fin++; });
        if (running) s = "running"; else if (paused) s = "paused"; else if (fin) s = "finished";
        return s;
      },
      finish: function () { // mouvement réduit : états finaux, aucune animation visible
        each(function (a) { a.cancel(); });
        r.items.forEach(function (it) { var e = o.find(it.step.target); if (e) extra = extra.concat(applyFinal(e, it.step.effect)); });
      },
      rest: function () { each(function (a) { a.cancel(); }); extra.forEach(function (a) { try { a.cancel(); } catch (e) { /* rien */ } }); extra = []; },
      destroy: function () { p.rest(); anims = []; },
      played: function () { return played; },
    };
    return p;
  }

  return { VERSION: 1, EFFECTS: EFFECTS, EASINGS: EASINGS, TRIGGERS: TRIGGERS, SECTION_EFFECTS: SECTION_EFFECTS, LIMITS: LIMITS, DEFAULT_STEP: DEFAULT_STEP, stepOf: stepOf, resolve: resolve, cycles: cycles, anchorOf: anchorOf, easingCss: easingCss, animateStep: animateStep, applyFinal: applyFinal, createPlayer: createPlayer };
});

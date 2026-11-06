// Motion Studio, lot « t » — module « text-fx » : machine à écrire, brouillage de texte, compteur de nombres, texte rotatif, texte dégradé animé,
// texte masqué par image / couleur, texte circulaire, titre animé. Un seul fichier pour huit composants : le serveur écrit data-kw-ms-fx="<effet>".
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Le serveur écrit le contenu FINAL lisible sans JavaScript ; ce module le remplace
// par une version animée (copie lisible par les lecteurs d'écran .kw-ms-sr + version visuelle aria-hidden) et destroy() restitue le contenu d'origine.
// Mouvement réduit : aucune transformation (ctx.reduced), le contenu reste tel que le serveur l'a écrit.
//
// Deux familles :
//  - animations « images-clés » (rotatif, dégradé, masque, cercle, titre) : ctx.animate() — le runtime gère déclencheur, lecture, pause, défilement.
//  - animations « horloge » (machine à écrire, brouillage, compteur) : le texte dépend de la progression ; on crée une animation WAAPI invisible
//    (l'horloge, linéaire ou avec la courbe choisie) gérée par le runtime comme les autres, et on LIT sa progression à chaque image pour écrire le texte.
//    Ainsi déclencheur, défilement, répétition, arrêt et position dans l'éditeur fonctionnent sans second moteur.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("text-fx", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var num = function (v, d) { return typeof v === "number" && isFinite(v) ? v : d; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var points = function (s) { return Array.from(String(s)); }; // lettres sans couper un caractère composé ni un émoji

  // ------------------------------------------------------------------------------------------------ machine à écrire (fonctions pures)
  // Plan : pour chaque phrase, écriture → pause → effacement (sauf la dernière si la lecture ne boucle pas) → court silence.
  function twPlan(phrases, o) {
    var segs = [], t = 0;
    phrases.forEach(function (ph, i) {
      var n = points(ph).length, last = i === phrases.length - 1;
      var add = function (k, d) { segs.push({ i: i, k: k, t0: t, t1: t + d, n: n }); t += d; };
      add("type", n * o.speed); add("hold", o.hold);
      if (!last || o.loop) { add("del", n * o.del); add("gap", 200); }
    });
    return { segs: segs, total: t };
  }
  // Instant (ms) → { i: phrase, n: nombre de lettres visibles }
  function twAt(plan, ms) {
    var s = plan.segs, m = clamp(ms, 0, plan.total);
    for (var k = 0; k < s.length; k++) {
      var g = s[k];
      if (m < g.t1 || k === s.length - 1) {
        var span = g.t1 - g.t0, f = span > 0 ? clamp((m - g.t0) / span, 0, 1) : 1;
        if (g.k === "type") return { i: g.i, n: Math.min(g.n, Math.floor(f * g.n + 1e-9)) };
        if (g.k === "hold") return { i: g.i, n: g.n };
        if (g.k === "del") return { i: g.i, n: g.n - Math.min(g.n, Math.floor(f * g.n + 1e-9)) };
        return { i: g.i, n: 0 };
      }
    }
    return { i: 0, n: 0 };
  }

  // ------------------------------------------------------------------------------------------------ brouillage (fonctions pures)
  var CHARSETS = {
    letters: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    caps: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    digits: "0123456789",
    symbols: "!<>-_\\/[]{}=+*^?#%&@$",
    binary: "01",
  };
  // Nombre pseudo-aléatoire stable dans [0, 1[ (même entrée = même sortie : testable, pas de Math.random dans le rendu)
  function hash(a, b) {
    var h = (Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489917) >>> 0; h ^= h >>> 16;
    return (h >>> 0) % 100000 / 100000;
  }
  // Plan : une phrase = brouillage de `d` ms puis pause `h` ms (la pause n'existe que s'il y a plusieurs phrases ou une boucle)
  function scPlan(n, d, h, loop) {
    var seg = d + (n > 1 || loop ? h : 0);
    return { n: n, d: d, seg: seg, total: Math.max(1, n * seg) };
  }
  function scAt(plan, ms) {
    var m = clamp(ms, 0, plan.total), i = Math.min(plan.n - 1, Math.floor(m / plan.seg)), local = m - i * plan.seg;
    return { i: i, p: plan.d > 0 ? clamp(local / plan.d, 0, 1) : 1 };
  }
  // Texte brouillé à la progression p (0 : tout brouillé ; 1 : texte final). Les espaces ne changent jamais. order : « ltr » (de gauche à droite) ou « random ».
  function scrambleText(chars, p, o) {
    var set = points(o.set || CHARSETS.letters), seed = o.seed || 0, bucket = o.bucket || 0, ltr = o.order !== "random";
    var visible = 0; chars.forEach(function (c) { if (!/\s/.test(c)) visible++; });
    var rank = 0, out = "";
    chars.forEach(function (c, idx) {
      if (/\s/.test(c)) { out += c; return; }
      rank++;
      var th = ltr ? rank / visible : 0.12 + 0.88 * hash(idx + seed, 3);
      out += p >= th - 1e-9 ? c : set[Math.floor(hash(idx * 31 + seed, bucket) * set.length) % set.length];
    });
    return out;
  }

  // ------------------------------------------------------------------------------------------------ compteur (fonctions pures)
  var THOUSANDS = { none: "", space: " ", comma: ",", dot: ".", apos: "’" };
  var DECIMALS = { comma: ",", dot: "." };
  // 1234567.891 → « 1 234 567,89 » selon les réglages. Le moins est un vrai signe moins (U+2212) placé avant le préfixe.
  function formatNumber(v, o) {
    o = o || {};
    var dec = clamp(Math.round(num(o.decimals, 0)), 0, 4), x = Number(v);
    if (!isFinite(x)) x = 0;
    var s = Math.abs(x).toFixed(dec), parts = s.split("."), int = parts[0];
    var th = Object.prototype.hasOwnProperty.call(THOUSANDS, o.thousands) ? THOUSANDS[o.thousands] : THOUSANDS.space;
    var dsep = Object.prototype.hasOwnProperty.call(DECIMALS, o.decimal) ? DECIMALS[o.decimal] : DECIMALS.comma;
    if (th && th === dsep) th = THOUSANDS.space; // jamais deux séparateurs identiques
    if (th) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, th);
    var neg = x < 0 && Number(s) !== 0;
    return (neg ? "−" : "") + (o.prefix || "") + int + (dec ? dsep + parts[1] : "") + (o.suffix || "");
  }

  // ------------------------------------------------------------------------------------------------ texte rotatif
  var SHOWN = { opacity: 1, transform: "none", filter: "none" };
  var ROT = {
    "fade-up": { inn: { opacity: 0, transform: "translateY(.6em)", filter: "none" }, out: { opacity: 0, transform: "translateY(-.6em)", filter: "none" } },
    fade: { inn: { opacity: 0, transform: "none", filter: "none" }, out: { opacity: 0, transform: "none", filter: "none" } },
    flip: { inn: { opacity: 0, transform: "rotateX(-90deg)", filter: "none" }, out: { opacity: 0, transform: "rotateX(90deg)", filter: "none" } },
    blur: { inn: { opacity: 0, transform: "none", filter: "blur(.3em)" }, out: { opacity: 0, transform: "none", filter: "blur(.3em)" } },
    zoom: { inn: { opacity: 0, transform: "scale(.6)", filter: "none" }, out: { opacity: 0, transform: "scale(1.4)", filter: "none" } },
    slide: { inn: { opacity: 0, transform: "translateX(.8em)", filter: "none" }, out: { opacity: 0, transform: "translateX(-.8em)", filter: "none" } },
  };
  // Images-clés d'un mot dans un cycle de n mots. x : durée de la transition, hold : temps affiché. loop faux : le dernier mot reste affiché.
  function rotFrames(i, n, x, hold, loop, preset, ease) {
    var P = ROT[preset] || ROT["fade-up"], T = x + hold + x, C = n * T, t0 = i * T, kf = [];
    var add = function (ms, st, e) { var f = { offset: clamp(ms / C, 0, 1) }; for (var k in st) f[k] = st[k]; if (e) f.easing = e; kf.push(f); };
    if (t0 > 0) { add(0, P.inn); add(t0, P.inn, ease); } else add(0, P.inn, ease);
    add(t0 + x, SHOWN);
    var outStart = t0 + x + hold;
    if (i === n - 1 && !loop) { add(C, SHOWN); return kf; }
    add(outStart, SHOWN, ease); add(outStart + x, P.out);
    if (outStart + x < C) add(C, P.out);
    return kf;
  }

  // ------------------------------------------------------------------------------------------------ outils DOM
  var mk = function (doc, tag, cls, parent) { var e = doc.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; };
  // Retire les enfants du composant et renvoie la fonction qui les remet tels quels
  function takeChildren(el) {
    var saved = []; while (el.firstChild) saved.push(el.removeChild(el.firstChild));
    return function () { while (el.firstChild) el.removeChild(el.firstChild); saved.forEach(function (n) { el.appendChild(n); }); };
  }
  // Boîte de taille stable : un fantôme invisible (la plus longue version du texte) réserve la place ; le texte vivant s'écrit par-dessus
  function stableBox(doc, ghostText, parent) {
    var box = mk(doc, "span", "kw-ms-tbox", parent), g = mk(doc, "span", "kw-ms-tbox-ghost", box);
    g.textContent = ghostText; g.setAttribute("aria-hidden", "true");
    return { box: box, live: mk(doc, "span", "kw-ms-tbox-live", box) };
  }
  var easeOf = function (ctx) { var K = ctx.win && ctx.win.KWMS; return K && K.easingCss ? K.easingCss(ctx.cfg.easing) : "ease"; };
  var isLoop = function (cfg) { return cfg.iterations === "infinite" || cfg.iterations > 1; };

  // Bouton « Pause » (boucles sans fin seulement, page publiée seulement) : suspend toutes les animations du composant, reprend celles qui tournaient
  function pauseButton(ctx, anims) {
    if (ctx.mode !== "public" || ctx.cfg.iterations !== "infinite" || !ctx.doc.body) return null;
    var b = mk(ctx.doc, "button", "kw-ms-tpause"), running = [], paused = false;
    b.type = "button"; b.textContent = "Mettre en pause l'animation"; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", function () {
      paused = !paused;
      if (paused) { running = anims.filter(function (a) { return a.playState === "running"; }); running.forEach(function (a) { try { a.pause(); } catch (e) { /* retirée */ } }); }
      else { running.forEach(function (a) { try { a.play(); } catch (e) { /* retirée */ } }); running = []; }
      b.setAttribute("aria-pressed", paused ? "true" : "false");
      b.textContent = paused ? "Reprendre l'animation" : "Mettre en pause l'animation";
    });
    if (ctx.el.parentNode) ctx.el.parentNode.insertBefore(b, ctx.el.nextSibling);
    ctx.onCleanup(function () { if (b.parentNode) b.parentNode.removeChild(b); });
    return b;
  }

  // Horloge : animation WAAPI invisible dont la progression pilote le texte. render(p) à chaque image où la progression change ; still() quand elle est
  // annulée (éditeur, déclencheur clic / survol avant le premier jeu, « déjà joué »). Le tout s'arrête hors écran.
  function drive(ctx, total, ease, render, still) {
    var win = ctx.win, clock = mk(ctx.doc, "span", "kw-ms-tclock", ctx.el);
    clock.setAttribute("aria-hidden", "true");
    var anim = ctx.animate(clock, [{ opacity: 0 }, { opacity: 1 }], { duration: Math.max(50, Math.round(total)), easing: ease ? ctx.cfg.easing : "linear" });
    var raf = 0, last = null, live = true, visible = true, io = null;
    function prog() { try { var p = anim.effect.getComputedTiming().progress; return p === null || p === undefined ? null : p; } catch (e) { return null; } }
    function frame() {
      raf = 0; if (!live) return;
      var p = prog(), key = p === null ? "still" : p;
      if (key !== last) { last = key; if (p === null) still(); else render(clamp(p, 0, 1)); }
      if (visible && live) raf = win.requestAnimationFrame(frame);
    }
    if (win.IntersectionObserver) {
      io = new win.IntersectionObserver(function (es) { es.forEach(function (e) { visible = e.isIntersecting; if (visible && !raf && live) raf = win.requestAnimationFrame(frame); }); });
      io.observe(ctx.el);
    }
    frame();
    var stop = function () { live = false; if (raf) win.cancelAnimationFrame(raf); raf = 0; if (io) io.disconnect(); };
    ctx.onCleanup(stop);
    return { anim: anim, stop: stop };
  }

  // ------------------------------------------------------------------------------------------------ les huit effets
  var FX = {};

  FX.typewriter = function (ctx) {
    var el = ctx.el, doc = ctx.doc, P = ctx.cfg.params;
    var ps = [].map.call(el.querySelectorAll(".kw-ms-tpw-p"), function (n) { return n.textContent; }).filter(Boolean);
    if (!ps.length) return {};
    var pe = el.querySelector(".kw-ms-tpw-pre"), se = el.querySelector(".kw-ms-tpw-suf");
    var pre = pe ? pe.textContent : "", suf = se ? se.textContent : "", cursor = el.getAttribute("data-kw-ms-tcursor") || "bar";
    var restore = takeChildren(el);
    var plan = twPlan(ps, { speed: clamp(num(P.speed, 70), 10, 500), del: clamp(num(P.deleteSpeed, 35), 5, 400), hold: clamp(num(P.hold, 1600), 200, 20000), loop: isLoop(ctx.cfg) });
    var chars = ps.map(points);
    var sr = mk(doc, "span", "kw-ms-sr", el); sr.textContent = [pre, ps.join(", "), suf].filter(Boolean).join(" ");
    var vis = mk(doc, "span", "kw-ms-tpw-vis", el); vis.setAttribute("aria-hidden", "true");
    if (pre) vis.appendChild(doc.createTextNode(pre + " "));
    var longest = ps.reduce(function (a, b) { return points(b).length > points(a).length ? b : a; }, "");
    var b = stableBox(doc, longest, vis), typed = doc.createTextNode("");
    b.live.appendChild(typed);
    if (cursor !== "none") mk(doc, "span", "kw-ms-tcursor", b.live);
    if (suf) vis.appendChild(doc.createTextNode(" " + suf));
    var d = drive(ctx, plan.total, false,
      function (p) { var a = twAt(plan, p * plan.total), t = chars[a.i].slice(0, a.n).join(""); if (typed.nodeValue !== t) typed.nodeValue = t; },
      function () { typed.nodeValue = ps[0]; });
    pauseButton(ctx, [d.anim]);
    return { destroy: restore };
  };

  FX.scramble = function (ctx) {
    var el = ctx.el, doc = ctx.doc, P = ctx.cfg.params;
    var ps = [].map.call(el.querySelectorAll(".kw-ms-scr-p"), function (n) { return n.textContent; }).filter(Boolean);
    if (!ps.length) return {};
    var restore = takeChildren(el);
    var set = CHARSETS[P.charset] || CHARSETS.letters, order = P.order === "random" ? "random" : "ltr";
    var plan = scPlan(ps.length, clamp(ctx.cfg.duration, 50, 10000), clamp(num(P.hold, 1500), 200, 20000), isLoop(ctx.cfg));
    var chars = ps.map(points);
    var sr = mk(doc, "span", "kw-ms-sr", el); sr.textContent = ps.join(", ");
    var vis = mk(doc, "span", "kw-ms-scr-vis", el); vis.setAttribute("aria-hidden", "true");
    var longest = ps.reduce(function (a, b) { return points(b).length > points(a).length ? b : a; }, "");
    var b = stableBox(doc, longest, vis), node = doc.createTextNode(""); b.live.appendChild(node);
    var d = drive(ctx, plan.total, false,
      function (p) {
        var ms = p * plan.total, a = scAt(plan, ms), t = a.p >= 1 ? ps[a.i] : scrambleText(chars[a.i], a.p, { set: set, order: order, seed: a.i * 17, bucket: Math.floor(ms / 60) });
        if (node.nodeValue !== t) node.nodeValue = t;
      },
      function () { node.nodeValue = ps[0]; });
    pauseButton(ctx, [d.anim]);
    return { destroy: restore };
  };

  FX.ticker = function (ctx) {
    var el = ctx.el, doc = ctx.doc, o = ctx.opts || {};
    var numEl = el.querySelector(".kw-ms-tick-num");
    if (!numEl) return {};
    var from = num(o.from, 0), to = num(o.to, 0), fmt = { decimals: o.decimals, thousands: o.thousands, decimal: o.decimal, prefix: o.prefix || "", suffix: o.suffix || "" };
    var fin = formatNumber(to, fmt), start = formatNumber(from, fmt);
    var restore = (function () { var kids = []; while (numEl.firstChild) kids.push(numEl.removeChild(numEl.firstChild)); return function () { while (numEl.firstChild) numEl.removeChild(numEl.firstChild); kids.forEach(function (n) { numEl.appendChild(n); }); }; })();
    var sr = mk(doc, "span", "kw-ms-sr", numEl); sr.textContent = fin;
    var vis = mk(doc, "span", "kw-ms-tick-vis", numEl); vis.setAttribute("aria-hidden", "true");
    var b = stableBox(doc, fin.length >= start.length ? fin : start, vis), node = doc.createTextNode(fin); b.live.appendChild(node);
    drive(ctx, ctx.cfg.duration, true,
      function (p) { var t = p >= 1 ? fin : formatNumber(from + (to - from) * p, fmt); if (node.nodeValue !== t) node.nodeValue = t; },
      function () { node.nodeValue = fin; });
    return { destroy: restore };
  };

  FX.rotating = function (ctx) {
    var el = ctx.el, doc = ctx.doc, P = ctx.cfg.params;
    var words = [].slice.call(el.querySelectorAll(".kw-ms-rot-w")), n = words.length;
    if (n < 2) return {};
    var parts = [].slice.call(el.children).filter(function (c) { return c.className.indexOf("kw-ms-rot-") === 0; });
    var pre = el.querySelector(".kw-ms-rot-pre"), post = el.querySelector(".kw-ms-rot-post");
    var texts = words.map(function (w) { return w.textContent; });
    var sr = mk(doc, "span", "kw-ms-sr"); sr.textContent = [pre ? pre.textContent : "", texts.join(", "), post ? post.textContent : ""].filter(Boolean).join(" ");
    el.insertBefore(sr, el.firstChild);
    parts.forEach(function (c) { c.setAttribute("aria-hidden", "true"); });
    el.classList.add("kw-ms-rot-live");
    var x = ctx.cfg.duration, hold = clamp(num(P.hold, 1800), 200, 20000), loop = isLoop(ctx.cfg), ease = easeOf(ctx);
    var preset = ROT[ctx.cfg.preset] ? ctx.cfg.preset : "fade-up", total = n * (x + hold + x), anims = [];
    words.forEach(function (w, i) { anims.push(ctx.animate(w, rotFrames(i, n, x, hold, loop, preset, ease), { duration: total, easing: "linear" })); });
    pauseButton(ctx, anims);
    return { destroy: function () { el.classList.remove("kw-ms-rot-live"); parts.forEach(function (c) { c.removeAttribute("aria-hidden"); }); if (sr.parentNode) sr.parentNode.removeChild(sr); } };
  };

  FX.gradient = function (ctx) {
    var el = ctx.el, t = el.querySelector(".kw-ms-grad-text");
    if (!t) return {};
    var preset = ctx.cfg.preset === "shimmer" ? "shimmer" : "flow";
    el.classList.add("kw-ms-grad-live", "is-" + preset);
    var a = preset === "shimmer"
      ? ctx.animate(t, [{ backgroundPosition: "150% 0, 0 0" }, { backgroundPosition: "-50% 0, 0 0" }])
      : ctx.animate(t, [{ backgroundPosition: "0% 50%" }, { backgroundPosition: "200% 50%" }]);
    pauseButton(ctx, [a]);
    return { destroy: function () { el.classList.remove("kw-ms-grad-live", "is-" + preset); } };
  };

  FX.mask = function (ctx) {
    var el = ctx.el, doc = ctx.doc, t = el.querySelector(".kw-ms-tmask-text");
    if (!t) return {};
    var preset = ctx.cfg.preset === "wipe" ? "wipe" : "pan", anims = [];
    if (preset === "wipe") {
      var parent = t.parentNode, wrap = mk(doc, "span", "kw-ms-tmask-wipe"), out = t.cloneNode(true);
      out.className = "kw-ms-tmask-out"; out.setAttribute("aria-hidden", "true"); out.removeAttribute("style");
      parent.insertBefore(wrap, t); wrap.appendChild(out); wrap.appendChild(t);
      anims.push(ctx.animate(t, [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }]));
      pauseButton(ctx, anims);
      return { destroy: function () { parent.insertBefore(t, wrap); parent.removeChild(wrap); } };
    }
    if (el.getAttribute("data-kw-ms-fill") !== "image") return {}; // le défilement de l'image demande une image
    anims.push(ctx.animate(t, [{ backgroundPosition: "0% 0%, 0 0" }, { backgroundPosition: "100% 100%, 0 0" }]));
    pauseButton(ctx, anims);
    return {};
  };

  FX.circular = function (ctx) {
    var spin = ctx.el.querySelector(".kw-ms-circ-spin");
    if (!spin) return {};
    var ccw = ctx.cfg.params.turn === "ccw";
    var a = ctx.animate(spin, ccw ? [{ transform: "rotate(360deg)" }, { transform: "rotate(0deg)" }] : [{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }]);
    pauseButton(ctx, [a]);
    return {};
  };

  var DECO = {
    marker: [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
    wipe: [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
  };
  FX.heading = function (ctx) {
    var el = ctx.el, P = ctx.cfg.params;
    var parts = ["before", "word", "after"].map(function (k) { return el.querySelector(".kw-ms-ahd-" + k); }).filter(Boolean);
    var deco = el.querySelector(".kw-ms-ahd-deco"), mark = el.querySelector(".kw-ms-ahd-mark");
    var lead = P.lead !== false, delay = 0;
    if (lead) {
      parts.forEach(function (p, i) { ctx.animate(p, [{ opacity: 0, transform: "translateY(.5em)" }, { opacity: 1, transform: "none" }], { delay: i * 110 }); });
      delay = parts.length * 110 + 80;
    }
    if (mark && ctx.cfg.preset === "marker") ctx.animate(mark, DECO.marker, { delay: delay });
    else if (deco) ctx.animate(deco, DECO.wipe, { delay: delay });
    return {};
  };

  function init(ctx) {
    var fx = ctx.el.getAttribute("data-kw-ms-fx"), f = Object.prototype.hasOwnProperty.call(FX, fx) ? FX[fx] : null;
    if (!f || ctx.reduced) return {};
    return f(ctx) || {};
  }

  return {
    init: init, FX: Object.keys(FX), CHARSETS: CHARSETS, THOUSANDS: THOUSANDS, DECIMALS: DECIMALS, ROT: ROT,
    twPlan: twPlan, twAt: twAt, scPlan: scPlan, scAt: scAt, scrambleText: scrambleText, hash: hash, formatNumber: formatNumber, rotFrames: rotFrames, points: points,
  };
});

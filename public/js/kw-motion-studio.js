// KOLAKISA — runtime PARTAGÉ du Motion Studio (page publiée, aperçu et canevas de l'éditeur). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
//
// Aucune bibliothèque d'animation : CSS + Web Animations API (element.animate). Pas de licence, pas de poids.
// Un « module » (public/js/motion-studio/<nom>.js) s'enregistre par KWMS.register(nom, init). Pour chaque élément [data-kw-ms-module="<nom>"] :
//   init(ctx) construit les animations avec ctx.animate(...) (créées EN PAUSE, état de départ tenu) et renvoie { destroy?, play?, pause?, seek? } (tout facultatif).
//   Le RUNTIME s'occupe du reste : déclencheur (viewport / load / click / hover / scroll), mouvement réduit, écrans coupés, changement de point de rupture,
//   nettoyage des observateurs et écouteurs, chargement paresseux du module, et en mode éditeur : play / pause / seek / stop.
// Le contenu reste visible si le script, le module ou Web Animations échoue (le serveur écrit le contenu final).
// UMD comme kw-effects.js : les fonctions pures se testent sous Node sans navigateur.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else { var api = factory(); root.KWMS = api; if (root.document) api.autostart(root); }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var BP = { mobile: 767, tablet: 1023 };
  var EASINGS = { smooth: "cubic-bezier(.2, .7, .2, 1)", linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "cubic-bezier(.34, 1.56, .64, 1)" };
  var DEFAULTS = { trigger: "viewport", duration: 700, delay: 0, easing: "smooth", stagger: 0, iterations: 1, direction: "normal", repeat: false, rm: "none" };
  var TRIGGERS = ["viewport", "load", "click", "hover", "scroll"];
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var breakpointOf = function (w) { return w <= BP.mobile ? "mobile" : w <= BP.tablet ? "tablet" : "desktop"; };
  var easingCss = function (e) { return Object.prototype.hasOwnProperty.call(EASINGS, e) ? EASINGS[e] : /^cubic-bezier\(/.test(String(e)) ? e : EASINGS.smooth; };

  // Réglages d'un élément : JSON du serveur (déjà validé) complété par les valeurs communes ; une valeur illisible retombe sur le défaut
  function parseConfig(el) {
    var raw = {};
    try { raw = JSON.parse(el.getAttribute("data-kw-ms") || "{}") || {}; } catch (e) { raw = {}; }
    var c = {}; for (var k in DEFAULTS) c[k] = DEFAULTS[k];
    for (var k2 in raw) c[k2] = raw[k2];
    if (TRIGGERS.indexOf(c.trigger) < 0) c.trigger = "viewport";
    c.duration = clamp(Number(c.duration) || DEFAULTS.duration, 50, 10000);
    c.delay = clamp(Number(c.delay) || 0, 0, 10000);
    c.stagger = clamp(Number(c.stagger) || 0, 0, 1000);
    if (c.trigger === "scroll") c.iterations = 1; // la progression est celle du défilement
    c.params = c.params && typeof c.params === "object" ? c.params : {};
    c.off = Array.isArray(c.off) ? c.off : [];
    c.always = Boolean(c.alwaysMotion) || el.hasAttribute("data-kw-motion-always");
    return c;
  }
  var parseOpts = function (el) { try { return JSON.parse(el.getAttribute("data-kw-ms-opts") || "{}") || {}; } catch (e) { return {}; } };
  // Retard d'un élément dans une cascade de n éléments : ordre selon `from` ; la cascade entière est plafonnée (4 s) pour rester agréable
  function staggerDelay(i, n, step, from, rnd) {
    if (!step || n < 2) return 0;
    var total = step * (n - 1);
    if (total > 4000) step = 4000 / (n - 1);
    var order = from === "end" ? n - 1 - i : from === "center" ? Math.abs(i - (n - 1) / 2) : from === "random" ? Math.floor((rnd ? rnd(i) : 0.5) * (n - 1)) : i;
    return Math.round(order * step);
  }
  // Progression du défilement : 0 quand le haut de l'élément touche le bas de la fenêtre, 1 quand son bas quitte le haut ; plage start–end en %
  function scrollProgress(rect, vh, start, end) {
    var span = vh + rect.height; if (span <= 0) return 0;
    var raw = clamp((vh - rect.top) / span, 0, 1) * 100, s = start == null ? 0 : start, e = end == null ? 100 : end;
    if (e <= s) e = s + 1;
    return clamp((raw - s) / (e - s), 0, 1);
  }

  var registry = {}; // nom → init (commun à tous les runtimes de la fenêtre)
  function register(name, init) { if (typeof init === "function") registry[name] = init; }

  // ------------------------------------------------------------------------------------------------------------
  function create(win, options) {
    var doc = win.document, editor = Boolean(options && options.mode === "editor");
    var recs = new Map(), destroyed = false, mq = [], loaders = {}, moduleMap = null, mo = null;
    var supported = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
    var reduceQ = win.matchMedia ? win.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

    function mapOf() {
      if (moduleMap) return moduleMap;
      moduleMap = {};
      try { var s = doc.getElementById("kw-ms-modules"); if (s) moduleMap = JSON.parse(s.textContent || "{}") || {}; } catch (e) { moduleMap = {}; }
      return moduleMap;
    }
    // Chargement paresseux (même origine, adresse avec empreinte écrite par le serveur) ; une promesse par module
    function load(name) {
      if (registry[name]) return Promise.resolve(registry[name]);
      if (loaders[name]) return loaders[name];
      loaders[name] = new Promise(function (resolve, reject) {
        if (!/^[a-z][a-z0-9-]{1,30}$/.test(name)) { reject(new Error("module")); return; }
        var s = doc.createElement("script");
        s.src = mapOf()[name] || "/js/motion-studio/" + name + ".js";
        s.async = true;
        s.onload = function () { registry[name] ? resolve(registry[name]) : reject(new Error("module non enregistré")); };
        s.onerror = function () { reject(new Error("chargement")); };
        doc.head.appendChild(s);
      });
      loaders[name].catch(function () { delete loaders[name]; });
      return loaders[name];
    }

    function totalOf(rec) {
      var t = 0;
      rec.anims.forEach(function (a) { try { var e = a.effect.getComputedTiming().endTime; if (isFinite(e)) t = Math.max(t, e); } catch (x) { /* animation retirée */ } });
      return t;
    }
    var each = function (rec, fn) { rec.anims.forEach(function (a) { try { fn(a); } catch (e) { /* animation déjà terminée ou retirée */ } }); };
    function rest(rec) { each(rec, function (a) { a.cancel(); }); }            // état naturel = contenu final tel que le serveur l'a écrit
    function hold(rec) { each(rec, function (a) { a.pause(); a.currentTime = 0; }); } // état de départ tenu
    function run(rec) {
      if (rec.dead) return;
      rec.played = true;
      if (rec.inst.play) { rec.inst.play(); return; }
      each(rec, function (a) { a.cancel(); a.currentTime = 0; a.play(); });
    }

    function teardown(rec) {
      rec.dead = true;
      rec.cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* nettoyage au mieux */ } });
      each(rec, function (a) { a.cancel(); });
      try { if (rec.inst && rec.inst.destroy) rec.inst.destroy(); } catch (e) { /* module défaillant */ }
      rec.anims = []; rec.inst = null;
      rec.el.removeAttribute("data-kw-ms-state");
    }

    // (Ré)active un élément : décide s'il est coupé (écran), réduit (mouvement réduit) ou animé, puis pose le déclencheur
    function activate(rec, factory) {
      var el = rec.el, cfg = rec.cfg = parseConfig(el);
      rec.dead = false; rec.anims = []; rec.cleanups = [];
      var bp = breakpointOf(win.innerWidth);
      if (cfg.off.indexOf(bp) >= 0) { el.setAttribute("data-kw-ms-state", "off"); return; }
      var reduced = !cfg.always && Boolean(reduceQ.matches) && !editor;
      var ctx = {
        el: el, win: win, doc: doc, cfg: cfg, opts: parseOpts(el), mode: editor ? "editor" : "public", reduced: reduced, bp: bp,
        // Animation créée en pause, état de départ tenu (fill both). timing : { delay, duration, easing } facultatifs ; tout le reste vient des réglages
        animate: function (target, keyframes, timing) {
          var t = timing || {};
          var a = target.animate(keyframes, {
            duration: t.duration != null ? t.duration : cfg.duration, delay: (t.delay || 0) + (t.noBaseDelay ? 0 : cfg.delay), easing: easingCss(t.easing || cfg.easing), fill: "both",
            iterations: cfg.iterations === "infinite" ? Infinity : cfg.iterations || 1, direction: cfg.direction || "normal",
          });
          a.pause(); a.currentTime = 0;
          rec.anims.push(a);
          return a;
        },
        stagger: function (i, n) { return staggerDelay(i, n, cfg.stagger, cfg.params.from || "start", function (k) { return ((((k + 1) * 2654435761) >>> 0) % 1000) / 1000; }); },
        onCleanup: function (fn) { rec.cleanups.push(fn); },
        // Largeur de l'élément modifiée (retour à la ligne différent) : le module peut demander une reconstruction ; l'état « déjà joué » est conservé
        onResize: function (fn) {
          if (!win.ResizeObserver) return;
          var w = el.clientWidth, t = 0, ro = new win.ResizeObserver(function () {
            if (el.clientWidth === w) return;
            w = el.clientWidth; win.clearTimeout(t); t = win.setTimeout(fn, 200);
          });
          ro.observe(el); rec.cleanups.push(function () { ro.disconnect(); win.clearTimeout(t); });
        },
        rebuild: function () { rebuild(rec, factory); },
      };
      var inst;
      try { inst = factory(ctx) || {}; } catch (e) { inst = null; }
      if (!inst) { teardown(rec); return; }
      rec.inst = inst; el.setAttribute("data-kw-ms-state", reduced ? "reduced" : "ready");
      if (!supported || !rec.anims.length && !inst.play) return;
      if (reduced) {
        rest(rec);
        if (cfg.rm === "fade") { var f = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, fill: "backwards" }); rec.anims.push(f); }
        return;
      }
      if (editor) { rest(rec); return; } // éditeur : état final visible ; lecture à la demande (play / pause / seek)
      if (rec.played && !cfg.repeat) { rest(rec); return; }
      bindTrigger(rec);
    }

    function bindTrigger(rec) {
      var el = rec.el, cfg = rec.cfg, t = cfg.trigger;
      var on = function (target, type, fn, opt) { target.addEventListener(type, fn, opt); rec.cleanups.push(function () { target.removeEventListener(type, fn, opt); }); };
      if (t === "click" || t === "hover") { rest(rec); on(el, t === "click" ? "click" : "mouseenter", function () { run(rec); }); return; }
      hold(rec);
      if (t === "load") {
        var go = function () { run(rec); };
        if (doc.readyState === "complete") { var id = win.requestAnimationFrame(go); rec.cleanups.push(function () { win.cancelAnimationFrame(id); }); }
        else on(win, "load", go);
        return;
      }
      if (t === "scroll") {
        var raf = 0, sc = cfg.scrub || {}, total = totalOf(rec) || 1;
        var upd = function () {
          raf = 0;
          var p = scrollProgress(el.getBoundingClientRect(), win.innerHeight || 1, sc.start, sc.end);
          if (rec.inst.seek) rec.inst.seek(p * total); else each(rec, function (a) { a.currentTime = p * total; });
        };
        var q = function () { if (!raf) raf = win.requestAnimationFrame(upd); };
        on(win, "scroll", q, { passive: true }); on(win, "resize", q);
        rec.cleanups.push(function () { if (raf) win.cancelAnimationFrame(raf); });
        upd(); return;
      }
      // viewport : une seule fois (ou à chaque retour si « rejouer »)
      if (!win.IntersectionObserver) { run(rec); return; }
      var io = new win.IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { run(rec); if (!cfg.repeat) io.disconnect(); }
          else if (cfg.repeat && rec.played) { hold(rec); }
        });
      }, { threshold: 0.2 });
      io.observe(el); rec.cleanups.push(function () { io.disconnect(); });
    }

    function rebuild(rec, factory) {
      if (destroyed || rec.dead) return;
      var played = rec.played;
      teardown(rec); rec.played = played;
      activate(rec, factory);
    }

    function init(el) {
      if (destroyed || recs.has(el)) return;
      var name = el.getAttribute("data-kw-ms-module");
      if (!name) return;
      var rec = { el: el, name: name, anims: [], cleanups: [], played: false, dead: true, inst: null, cfg: null, factory: null };
      recs.set(el, rec);
      load(name).then(function (factory) {
        if (destroyed || recs.get(el) !== rec) return;
        rec.factory = factory; activate(rec, factory);
      }, function () { el.setAttribute("data-kw-ms-state", "error"); }); // le contenu final reste affiché
    }
    function scan(scope) {
      var r = scope || doc;
      // éléments retirés du document (canevas : section remplacée) : nettoyage
      recs.forEach(function (rec, el) { if (!el.isConnected) { teardown(rec); recs.delete(el); } });
      var list = r.querySelectorAll ? r.querySelectorAll("[data-kw-ms-module]") : [];
      Array.prototype.forEach.call(list, init);
    }
    function reactivateAll() { recs.forEach(function (rec) { if (rec.factory) { var p = rec.played; teardown(rec); rec.played = p; activate(rec, rec.factory); } }); startPage(); }

    // ---------- Lot 3 : scènes de la page (timeline multi-éléments), transitions de sections, défilement fluide ----------
    // Données écrites par le serveur (<script id="kw-ms-scenes">) ; le cœur (scenes-core) et le défilement fluide sont des modules chargés à la demande.
    // Éditeur : aucun déclencheur ; le panneau « Scènes » pilote l'API `scenes` (set / play / pause / resume / seek / stop) avec le contenu en cours d'édition.
    var core = null, coreP = null, pageGen = 0, pageRecs = [], smooth = null, edit = {}, sceneData = null;
    try { var sd = doc.getElementById("kw-ms-scenes"); sceneData = sd ? JSON.parse(sd.textContent || "null") : null; } catch (e) { sceneData = null; }
    var NODE = /^[a-z0-9]{6,20}$/;
    var findNode = function (id) { return NODE.test(String(id)) ? doc.querySelector('[data-node-id="' + id + '"]') || doc.querySelector(".kw-n-" + id) : null; };
    function ensureCore() {
      if (core) return Promise.resolve(core);
      if (!coreP) { coreP = load("scenes-core").then(function (f) { core = f(); return core; }); coreP.catch(function () { coreP = null; }); }
      return coreP;
    }
    function stopPage() {
      pageGen++;
      pageRecs.forEach(function (r) { r.cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* nettoyage au mieux */ } }); if (r.player) r.player.destroy(); });
      pageRecs = [];
      if (smooth) { smooth.destroy(); smooth = null; }
    }
    // Surveille l'arrivée d'un élément à l'écran par mesure (défilement, redimensionnement, mise en page) plutôt que par IntersectionObserver : celui-ci ne voit
    // pas un élément dont l'état de départ est lui-même rogné (clip-path), donc une révélation « en volet » ne se déclencherait jamais.
    function watchView(el, rec, threshold, onEnter, onLeave) {
      var raf = 0, inside = false, ro = null;
      var chk = function () {
        raf = 0;
        var r = el.getBoundingClientRect(), vh = win.innerHeight || 1, vis = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        var now = r.height > 0 && vis > 0 && (vis / r.height >= threshold || vis / vh >= threshold);
        if (now && !inside) { inside = true; onEnter(); } else if (!now && inside) { inside = false; if (onLeave) onLeave(); }
      };
      var q = function () { if (!raf) raf = win.requestAnimationFrame(chk); };
      win.addEventListener("scroll", q, { passive: true }); win.addEventListener("resize", q); win.addEventListener("load", q);
      if (win.ResizeObserver) { ro = new win.ResizeObserver(q); ro.observe(doc.documentElement); }
      rec.cleanups.push(function () { win.removeEventListener("scroll", q); win.removeEventListener("resize", q); win.removeEventListener("load", q); if (ro) ro.disconnect(); if (raf) win.cancelAnimationFrame(raf); });
      q();
    }
    function bindScene(c, sc, reduced, bp) {
      if ((sc.off || []).indexOf(bp) >= 0 || !(sc.steps && sc.steps.length)) return;
      var trig = sc.trigger || "viewport", anchor = findNode(c.anchorOf(sc));
      if (!anchor) return; // élément absent de cette page (masqué pour ce visiteur…) : la scène ne fait rien, le contenu reste affiché
      var rec = { cleanups: [], player: c.createPlayer(sc, { find: findNode, cleanOnFinish: trig !== "scroll", reduced: reduced }) }, player = rec.player;
      pageRecs.push(rec);
      if (!player.count) return;
      if (trig === "click") player.rest(); // les animations naissent en pause à l'état de départ : le clic laisse le contenu tel quel jusqu'au déclencheur (mouvement réduit : aucune animation créée)
      var on = function (t, type, fn, opt) { t.addEventListener(type, fn, opt); rec.cleanups.push(function () { t.removeEventListener(type, fn, opt); }); };
      var go = function () { if (reduced) player.finish(); else player.play(); }; // mouvement réduit : états finaux, sans animation
      if (trig === "click") { on(anchor, "click", go); return; }
      if (reduced && trig === "scroll") trig = "viewport";
      if (!reduced) player.hold();
      if (trig === "load") {
        if (doc.readyState === "complete") { var id = win.requestAnimationFrame(go); rec.cleanups.push(function () { win.cancelAnimationFrame(id); }); } else on(win, "load", go);
        return;
      }
      if (trig === "scroll") {
        var raf = 0, rg = sc.scrub || {}, total = player.total || 1;
        var upd = function () { raf = 0; player.seek(scrollProgress(anchor.getBoundingClientRect(), win.innerHeight || 1, rg.start, rg.end) * total); };
        var q = function () { if (!raf) raf = win.requestAnimationFrame(upd); };
        on(win, "scroll", q, { passive: true }); on(win, "resize", q); rec.cleanups.push(function () { if (raf) win.cancelAnimationFrame(raf); });
        upd(); return;
      }
      var done = false;
      watchView(anchor, rec, 0.2, function () { if (done) return; go(); if (!sc.repeat) done = true; }, function () { if (sc.repeat && player.played() && !reduced) player.hold(); });
    }
    // Transition des sections : chaque section sous la ligne de flottaison apparaît quand elle arrive à l'écran ; celles déjà visibles à l'ouverture ne sont jamais masquées
    function bindSections(c, reduced) {
      var st = sceneData && sceneData.sectionTransition;
      if (!st || reduced) return;
      var vh = win.innerHeight || 0;
      Array.prototype.forEach.call(doc.querySelectorAll(".lp-main > *"), function (el) {
        if (el.classList.contains("lp-site-part") || el.getBoundingClientRect().top < vh) return;
        var anims = c.animateStep(el, st.type, { delay: 0, duration: st.duration || 700, easing: "smooth" }), rec = { cleanups: [], player: { destroy: function () { anims.forEach(function (a) { try { a.cancel(); } catch (e) { /* retirée */ } }); } } };
        anims.forEach(function (a) { a.onfinish = function () { try { a.cancel(); } catch (e) { /* retirée */ } }; });
        pageRecs.push(rec);
        var shown = false;
        watchView(el, rec, 0.1, function () { if (shown) return; shown = true; anims.forEach(function (a) { a.currentTime = 0; a.play(); }); });
      });
    }
    function startPage() {
      stopPage();
      if (editor || destroyed || !sceneData) return;
      var gen = pageGen, reduced = Boolean(reduceQ.matches), bp = breakpointOf(win.innerWidth);
      if ((sceneData.scenes && sceneData.scenes.length) || sceneData.sectionTransition) {
        ensureCore().then(function (c) {
          if (gen !== pageGen || destroyed) return;
          (sceneData.scenes || []).forEach(function (sc) { try { bindScene(c, sc, reduced, bp); } catch (e) { /* une scène défaillante n'arrête pas les autres */ } });
          try { bindSections(c, reduced); } catch (e) { /* contenu déjà visible */ }
        }, function () { /* module introuvable : le contenu reste affiché tel quel */ });
      }
      // Défilement fluide : jamais en mouvement réduit, jamais avec le magnétisme de défilement (scroll-snap) de la page
      var snap = ""; try { snap = win.getComputedStyle(doc.documentElement).scrollSnapType || ""; } catch (e) { snap = ""; }
      if (sceneData.smoothScroll && !reduced && (snap === "" || snap === "none")) {
        load("smooth-scroll").then(function (f) { if (gen === pageGen && !destroyed && !smooth) smooth = f().create(win, sceneData.smoothScroll); }, function () { /* défilement natif */ });
      }
    }
    // API des scènes (éditeur) : lit un plan { scenes: [...] } fourni par le panneau, joue la scène sur le canevas. Chaque appel renvoie une promesse (chargement du cœur).
    var scenesApi = {
      set: function (data) { Object.keys(edit).forEach(function (k) { edit[k].destroy(); }); edit = {}; sceneData = data && typeof data === "object" ? data : null; return true; },
      data: function () { return sceneData; },
      build: function (id) {
        return ensureCore().then(function (c) {
          var sc = ((sceneData && sceneData.scenes) || []).filter(function (x) { return x.id === id; })[0];
          if (!sc) return null;
          if (edit[id]) edit[id].destroy();
          return (edit[id] = c.createPlayer(sc, { find: findNode }));
        });
      },
      play: function (id) { return scenesApi.build(id).then(function (p) { if (!p) return false; p.play(); return true; }); },
      pause: function (id) { if (!edit[id]) return false; edit[id].pause(); return true; },
      resume: function (id) { if (!edit[id]) return false; edit[id].resume(); return true; },
      stop: function (id) { if (!edit[id]) return false; edit[id].destroy(); delete edit[id]; return true; },
      seek: function (id, ms) { var go = function (p) { if (!p) return false; p.seek(ms); return true; }; return edit[id] ? Promise.resolve(go(edit[id])) : scenesApi.build(id).then(go); },
      time: function (id) { return edit[id] ? edit[id].time() : 0; },
      duration: function (id) { return edit[id] ? edit[id].total : 0; },
      state: function (id) { return edit[id] ? edit[id].state() : "idle"; },
    };

    // Points de rupture et préférence de mouvement : réévaluation de tous les éléments
    var lastBp = breakpointOf(win.innerWidth);
    [BP.mobile, BP.tablet].forEach(function (w) {
      if (!win.matchMedia) return;
      var q = win.matchMedia("(max-width: " + w + "px)"), fn = function () { var bp = breakpointOf(win.innerWidth); if (bp !== lastBp) { lastBp = bp; reactivateAll(); } };
      if (q.addEventListener) { q.addEventListener("change", fn); mq.push([q, fn]); }
    });
    if (reduceQ.addEventListener) { reduceQ.addEventListener("change", reactivateAll); mq.push([reduceQ, reactivateAll]); }

    // Éditeur : le canevas remplace des sections entières (patchCanvas) → on observe pour initialiser les nouveaux éléments
    if (editor && win.MutationObserver && doc.body) {
      var timer = 0;
      mo = new win.MutationObserver(function () { win.clearTimeout(timer); timer = win.setTimeout(function () { scan(); }, 60); });
      mo.observe(doc.body, { childList: true, subtree: true });
    }

    var target = function (t) { return typeof t === "string" ? doc.querySelector('[data-node-id="' + t + '"]') || doc.getElementById(t) : t; };
    var recOf = function (t) { var el = target(t); return el ? recs.get(el) : null; };
    return {
    startPage();

      scan: scan, mode: editor ? "editor" : "public", scenes: scenesApi,
      // API de l'éditeur (identifiant d'élément ou élément) — sans effet en dehors d'un élément initialisé
      play: function (t) { var r = recOf(t); if (!r || !r.inst) return false; each(r, function (a) { a.cancel(); }); if (r.inst.play) r.inst.play(); else each(r, function (a) { a.currentTime = 0; a.play(); }); return true; },
      pause: function (t) { var r = recOf(t); if (!r || !r.inst) return false; if (r.inst.pause) r.inst.pause(); else each(r, function (a) { a.pause(); }); return true; },
      resume: function (t) { var r = recOf(t); if (!r || !r.inst) return false; each(r, function (a) { a.play(); }); return true; },
      seek: function (t, ms) { var r = recOf(t); if (!r || !r.inst) return false; if (r.inst.seek) r.inst.seek(ms); else each(r, function (a) { a.pause(); a.currentTime = ms; }); return true; },
      stop: function (t) { var r = recOf(t); if (!r) return false; rest(r); return true; },
      duration: function (t) { var r = recOf(t); return r && r.inst ? totalOf(r) : 0; },
      state: function (t) { var el = target(t); return el ? el.getAttribute("data-kw-ms-state") : null; },
      count: function () { return recs.size; },
      destroy: function () {
        if (destroyed) return; destroyed = true;
        if (mo) mo.disconnect();
        mq.forEach(function (p) { p[0].removeEventListener("change", p[1]); });
        recs.forEach(function (rec) { teardown(rec); });
        stopPage(); Object.keys(edit).forEach(function (k) { edit[k].destroy(); }); edit = {};
        recs.clear();
      },
    };
  }

  function autostart(win) {
    var start = function () {
      var d = win.document;
      var editor = Boolean(d.body && d.body.hasAttribute("data-kw-builder"));
      if (!editor && !d.querySelector("[data-kw-ms-module]") && !d.getElementById("kw-ms-scenes")) return;
      var inst = create(win, { mode: editor ? "editor" : "public" });
      win.kwMotionStudio = inst; inst.scan();
      win.addEventListener("pagehide", function () { inst.destroy(); });
    };
    if (win.document.readyState === "loading") win.document.addEventListener("DOMContentLoaded", start); else start();
  }

  return { VERSION: 1, DEFAULTS: DEFAULTS, EASINGS: EASINGS, TRIGGERS: TRIGGERS, BP: BP, register: register, registered: function () { return Object.keys(registry); }, parseConfig: parseConfig, staggerDelay: staggerDelay, scrollProgress: scrollProgress, breakpointOf: breakpointOf, easingCss: easingCss, create: create, autostart: autostart };
});

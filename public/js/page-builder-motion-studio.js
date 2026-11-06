// Page Builder — panneau MOTION STUDIO (composants animés). Chargé AVANT page-builder.js, qui lui confie ses fonctions internes (attach) puis lui
// demande d'afficher le panneau d'un composant (panel). Sur le modèle de page-builder-effects.js.
// Six sections repliables : Contenu · Style · Animation · Interactions · Responsive · Avancé. Chaque section n'affiche que les réglages PERTINENTS pour
// le composant (fiche `motion.controls` / `motion.params` du widget, décidée par le serveur : SPEC.types[].motion). Les réglages vivent dans
// node.motion.studio (schéma versionné, revalidé par le serveur) et passent tous par change() : annuler / rétablir, enregistrement, canevas.
// Aperçu : le runtime partagé (kw-motion-studio.js) tourne dans le canevas en mode éditeur ; ce panneau le pilote (lire, pause, position).
(function () {
  "use strict";
  var A = null, seq = 0;
  var uid = function () { return "pb-ms-" + (++seq); };
  function attach(api) { A = api; }

  var EASE_LABELS = { smooth: "Douce (par défaut)", linear: "Constante", ease: "Standard", "ease-in": "Accélère", "ease-out": "Ralentit à la fin", "ease-in-out": "Accélère puis ralentit", spring: "Ressort" };
  var ITER = [["1", "Une fois"], ["2", "2 fois"], ["3", "3 fois"], ["4", "4 fois"], ["5", "5 fois"], ["infinite", "En boucle (sans fin)"]];
  var DIRS = { normal: "Normale", reverse: "Inversée", alternate: "Aller-retour", "alternate-reverse": "Retour-aller" };
  var ANIM_KEYS = ["preset", "duration", "delay", "easing", "stagger", "iterations", "direction", "params"];

  var typeOf = function (it) { return A.SPEC.types.find(function (t) { return t.type === it.type; }); };
  var specOf = function (it) { var t = typeOf(it); return t && t.motion ? t.motion : null; };
  var studioOf = function (it) { return (it.motion && it.motion.studio) || {}; };
  var has = function (spec, c) { return spec.controls.indexOf(c) >= 0; };
  var effective = function (it, spec, k) { var s = studioOf(it); return s[k] !== undefined ? s[k] : spec.defaults[k]; };

  // Modifie it.motion.studio : annulable, enregistré, revalidé par le serveur. Les valeurs vides retirent le réglage ; sans réglage, `studio` disparaît.
  function setStudio(it, label, mutate, opts) {
    A.change(function () {
      var x = A.byId(it.id), m = Object.assign({}, x.motion), st = Object.assign({}, m.studio || {});
      mutate(st);
      Object.keys(st).forEach(function (k) {
        var v = st[k];
        if (v === undefined || v === "" || v === null || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length)) delete st[k];
      });
      delete st.v;
      if (Object.keys(st).length) m.studio = Object.assign({ v: 1 }, st); else delete m.studio;
      if (Object.keys(m).length) x.motion = m; else delete x.motion;
    }, { label: label, key: opts && opts.key, light: opts && opts.light });
  }

  function numRow(it, spec, key, label, min, max, unit, step) {
    var set = studioOf(it)[key] !== undefined;
    return A.numField(label, { min: min, max: max, step: step || 1, integer: true, staticUnit: unit, value: effective(it, spec, key), placeholder: String(spec.defaults[key]), base: spec.defaults[key], drag: true, allowEmpty: true, prop: "ms-" + key,
      onCommit: function (raw, u, opts) { setStudio(it, label, function (st) { st[key] = raw === "" ? undefined : Number(raw); }, opts); } }, set, function () { setStudio(it, label, function (st) { delete st[key]; }); });
  }

  // Aperçu dans le canevas : le runtime de l'iframe est piloté ici (aucun second moteur). Absent (canevas pas encore rechargé) : message clair.
  function runtime() { try { var f = A.frame(); return f && f.contentWindow && f.contentWindow.kwMotionStudio ? f.contentWindow.kwMotionStudio : null; } catch (e) { return null; } }
  function previewRow(it) {
    var h = A.h, id = uid(), range = h("input", { type: "range", min: "0", max: "1000", step: "10", value: "0", id: id, "data-ms-seek": "" });
    var need = function () { var r = runtime(); if (!r) A.toast("Aperçu indisponible : attendez la fin du chargement de la page.", true); return r; };
    var btn = function (label, tip, name, fn) { return h("button", { type: "button", class: "btn btn-outline btn-sm", "data-tip": tip, "data-ms-act": name, onclick: fn }, label); };
    range.addEventListener("input", function () { var r = need(); if (!r) return; range.max = String(Math.max(100, Math.round(r.duration(it.id)))); r.seek(it.id, Number(range.value)); });
    return h("div", { class: "pb-field pb-ms-preview", role: "group", "aria-label": "Aperçu de l'animation" },
      h("div", { class: "pb-row pb-wrap" },
        btn("Lire", "Joue l'animation dans la page", "play", function () { var r = need(); if (r) { r.play(it.id); range.value = "0"; } }),
        btn("Pause", "Fige l'animation", "pause", function () { var r = need(); if (r) r.pause(it.id); }),
        btn("Reprendre", "Continue la lecture", "resume", function () { var r = need(); if (r) r.resume(it.id); }),
        btn("Arrêter", "Revient à l'état final", "stop", function () { var r = need(); if (r) r.stop(it.id); })),
      h("label", { class: "pb-sub", for: id, text: "Position dans l'animation" }), range);
  }

  function contentSection(it, locked) {
    return A.accGroup("ms-content", "Contenu", true, function (b) { A.schemaFields(it, b, locked); });
  }
  function styleSection() {
    return A.accGroup("ms-style", "Style", false, function (b) {
      b.appendChild(A.h("p", { class: "pb-hint", text: "Police, taille, couleur, espacement et alignement se règlent dans l'onglet Style, comme pour un titre. L'animation ne modifie jamais ces réglages." }));
      b.appendChild(A.h("button", { type: "button", class: "btn btn-outline btn-sm", "data-ms-act": "open-style", onclick: function () { A.setTab("style"); } }, "Ouvrir l'onglet Style"));
    });
  }
  function animationSection(it, spec, locked) {
    var h = A.h, s = studioOf(it), n = ANIM_KEYS.filter(function (k) { return s[k] !== undefined; }).length;
    return A.accGroup("ms-anim", "Animation", true, function (b) {
      if (has(spec, "preset")) b.appendChild(A.selectField("Effet", effective(it, spec, "preset"), spec.presets, function (v) { setStudio(it, "Effet d'animation", function (st) { st.preset = v === spec.defaults.preset ? undefined : v; }); }, { disabled: locked }));
      if (spec.preview !== false) b.appendChild(previewRow(it)); // faux : composant piloté par le défilement ou par un clic (rien à lire dans l'éditeur)
      if (has(spec, "duration")) b.appendChild(numRow(it, spec, "duration", "Durée", 50, 10000, "ms", 50));
      if (has(spec, "delay")) b.appendChild(numRow(it, spec, "delay", "Délai", 0, 10000, "ms", 50));
      if (has(spec, "stagger")) b.appendChild(numRow(it, spec, "stagger", "Décalage entre éléments", 0, 1000, "ms", 5));
      if (has(spec, "easing")) {
        var cur = effective(it, spec, "easing"), opts = A.SPEC.motionStudio.easings.map(function (e) { return [e, EASE_LABELS[e] || e]; });
        if (!opts.some(function (o) { return o[0] === cur; })) opts.push([cur, "Personnalisée"]);
        b.appendChild(A.selectField("Courbe d'accélération", cur, opts, function (v) { setStudio(it, "Courbe d'animation", function (st) { st.easing = v === spec.defaults.easing ? undefined : v; }); }, { disabled: locked }));
      }
      if (has(spec, "iterations")) b.appendChild(A.selectField("Répétition", String(effective(it, spec, "iterations")), ITER, function (v) { setStudio(it, "Répétition", function (st) { st.iterations = v === "1" ? undefined : v === "infinite" ? "infinite" : Number(v); }); }, { disabled: locked }));
      if (has(spec, "direction")) b.appendChild(A.selectField("Sens", effective(it, spec, "direction"), Object.keys(DIRS).map(function (k) { return [k, DIRS[k]]; }), function (v) { setStudio(it, "Sens d'animation", function (st) { st.direction = v === "normal" ? undefined : v; }); }, { disabled: locked }));
      spec.params.forEach(function (p) {
        var cur = (studioOf(it).params || {})[p.key];
        var setP = function (v) { setStudio(it, p.label, function (st) { st.params = Object.assign({}, st.params); st.params[p.key] = v; }); };
        if (p.kind === "select") b.appendChild(A.selectField(p.label, cur !== undefined ? cur : p.default, p.options, setP, { disabled: locked }));
        else if (p.kind === "bool") b.appendChild(A.checkField(p.label, cur !== undefined ? cur : p.default, setP, { disabled: locked }));
        else b.appendChild(A.numField(p.label, { min: p.min, max: p.max, step: p.step || 1, integer: false, value: cur !== undefined ? cur : p.default, base: p.default, drag: true, prop: "ms-p-" + p.key, onCommit: function (raw, u, o) { setStudio(it, p.label, function (st) { st.params = Object.assign({}, st.params); st.params[p.key] = raw === "" ? undefined : Number(raw); }, o); } }, cur !== undefined, function () { setP(undefined); }));
      });
      b.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked || !n, "data-ms-act": "reset-anim", onclick: function () {
        setStudio(it, "Réinitialiser l'animation", function (st) { ANIM_KEYS.forEach(function (k) { delete st[k]; }); });
      } }, "Réinitialiser l'animation"));
    }, n);
  }
  function interactionsSection(it, spec, locked) {
    var s = studioOf(it), trig = effective(it, spec, "trigger");
    return A.accGroup("ms-inter", "Interactions", false, function (b) {
      if (has(spec, "trigger")) b.appendChild(A.selectField("Déclencheur", trig, A.SPEC.motionStudio.triggers, function (v) { setStudio(it, "Déclencheur d'animation", function (st) { st.trigger = v === spec.defaults.trigger ? undefined : v; }); }, { disabled: locked }));
      if (trig === "viewport" && has(spec, "repeat")) b.appendChild(A.checkField("Rejouer à chaque retour à l'écran", effective(it, spec, "repeat"), function (v) { setStudio(it, "Rejouer l'animation", function (st) { st.repeat = v ? true : undefined; }); }, { disabled: locked }));
      if (trig === "scroll" && has(spec, "scrub")) {
        var sc = s.scrub || {};
        var setS = function (k, v) { setStudio(it, "Plage de défilement", function (st) { var c = Object.assign({ start: 0, end: 100 }, st.scrub); c[k] = v; st.scrub = c.start === 0 && c.end === 100 ? undefined : c; }); };
        b.appendChild(A.numField("Début de la plage", { min: 0, max: 99, step: 1, integer: true, staticUnit: "%", value: sc.start === undefined ? 0 : sc.start, base: 0, drag: true, allowEmpty: false, prop: "ms-scrub-start", onCommit: function (raw) { setS("start", Number(raw)); } }, sc.start !== undefined, function () { setS("start", 0); }));
        b.appendChild(A.numField("Fin de la plage", { min: 1, max: 100, step: 1, integer: true, staticUnit: "%", value: sc.end === undefined ? 100 : sc.end, base: 100, drag: true, allowEmpty: false, prop: "ms-scrub-end", onCommit: function (raw) { setS("end", Number(raw)); } }, sc.end !== undefined, function () { setS("end", 100); }));
      }
      if (trig === "click" || trig === "hover") b.appendChild(A.h("p", { class: "pb-hint", text: "Le contenu est visible tout de suite ; l'animation se joue à chaque " + (trig === "click" ? "clic." : "survol.") }));
      if (trig === "scroll") b.appendChild(A.h("p", { class: "pb-hint", text: "L'animation avance et recule avec le défilement de la page." }));
    });
  }
  function responsiveSection(it, locked) {
    var h = A.h, s = studioOf(it), off = s.off || [], screens = A.SPEC.motionStudio.screens;
    return A.accGroup("ms-resp", "Responsive", false, function (b) {
      var checks = h("div", { class: "pb-checks" });
      screens.forEach(function (bp) {
        var cb = h("input", { type: "checkbox", disabled: locked, "data-ms-screen": bp });
        cb.checked = off.indexOf(bp) < 0;
        cb.addEventListener("change", function () {
          var next = screens.filter(function (x) { return x === bp ? !cb.checked : off.indexOf(x) >= 0; });
          if (next.length === screens.length) { cb.checked = true; A.toast("Laissez au moins un écran actif.", true); return; }
          setStudio(it, "Écrans de l'animation", function (st) { st.off = next.length ? next : undefined; });
        });
        checks.appendChild(h("label", {}, cb, " " + A.bpLabel(bp)));
      });
      b.appendChild(h("div", { class: "pb-field" }, h("p", { class: "pb-sub", text: "Animation active sur" }), checks));
      b.appendChild(A.selectField("Si l'appareil demande moins de mouvement", s.rm || "none", A.SPEC.motionStudio.reduced, function (v) { setStudio(it, "Mouvement réduit", function (st) { st.rm = v === "none" ? undefined : v; }); }, { disabled: locked }));
      b.appendChild(h("p", { class: "pb-hint", text: "Sur un écran où l'animation est coupée, le contenu s'affiche directement, sans mouvement." }));
    }, off.length);
  }
  function advancedSection(it, locked) {
    var s = studioOf(it);
    return A.accGroup("ms-adv", "Avancé", false, function (b) {
      b.appendChild(A.checkField("Toujours animer, même si l'appareil demande moins de mouvement", s.alwaysMotion, function (v) { setStudio(it, "Mouvement réduit", function (st) { st.alwaysMotion = v ? true : undefined; }); }, { disabled: locked, hint: "À éviter : c'est une préférence d'accessibilité du visiteur." }));
      b.appendChild(A.h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-ms-act": "reset-all", disabled: locked || !Object.keys(s).length, onclick: function () { setStudio(it, "Réinitialiser Motion Studio", function (st) { Object.keys(st).forEach(function (k) { delete st[k]; }); }); } }, "Tout réinitialiser (valeurs par défaut du composant)"));
    }, s.alwaysMotion ? 1 : 0);
  }

  // Panneau d'un composant : renvoie vrai s'il a pris la main (sinon l'éditeur affiche ses champs habituels)
  function panel(it, box, locked) {
    if (!A || !it || !A.isNode(it)) return false;
    var spec = specOf(it);
    if (!spec) return false;
    box.appendChild(contentSection(it, locked));
    box.appendChild(styleSection());
    box.appendChild(animationSection(it, spec, locked));
    if (has(spec, "trigger") || has(spec, "repeat")) box.appendChild(interactionsSection(it, spec, locked));
    box.appendChild(responsiveSection(it, locked));
    box.appendChild(advancedSection(it, locked));
    return true;
  }
  // Canevas (re)chargé : le runtime de l'iframe démarre seul (mode éditeur) ; on lui redemande de balayer le document
  function canvas(win) { try { if (win && win.kwMotionStudio) win.kwMotionStudio.scan(); } catch (e) { /* canevas en cours de remplacement */ } }

  window.pbMotionStudio = { attach: attach, panel: panel, canvas: canvas, setStudio: function (it, label, fn, o) { return A ? setStudio(it, label, fn, o) : undefined; } };
})();

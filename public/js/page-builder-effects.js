// Page Builder — sections AVANCÉES CONTEXTUELLES de l'inspecteur (moteur d'effets). Chargé AVANT page-builder.js, qui lui confie ses
// fonctions internes (attach) puis lui demande, pour l'élément sélectionné, les sections à afficher (sections).
// Règle : une section n'existe QUE si le type de l'élément en a la capacité (SPEC.types[].capabilities, décidé par le serveur) :
//   scroll → Effets de défilement · mouse → Effet de souris · sticky → Épinglage · transform → Transformer · mask → Masque.
// Chaque contrôle lit et écrit le document de l'éditeur (change / setStyle) : annuler-rétablir, enregistrement, écrans et rendu du
// canevas fonctionnent comme pour tout le reste. Le serveur revalide chaque valeur ; le moteur d'exécution est kw-effects.js.
(function () {
  "use strict";
  var A = null;
  var seq = 0;
  var uid = function () { return "pb-fx-" + (++seq); };

  function attach(api) { A = api; }

  // Capacités du type de l'élément (vide pour tout ce qui n'est pas un élément du registre)
  function capsOf(it) {
    var t = A.SPEC.types.find(function (x) { return x.type === it.type; });
    return t && t.capabilities ? t.capabilities : [];
  }

  // Section repliable : la brique commune de l'inspecteur si elle existe (accGroup), sinon un <details> du même style
  function section(key, title, count, build) {
    if (A.accGroup) return A.accGroup("fx-" + key, title, false, build, count || 0);
    var h = A.h;
    var det = h("details", { class: "pb-acc", "data-group": "fx-" + key });
    if (A.store.get("open-fx-" + key, false)) det.open = true;
    det.addEventListener("toggle", function () { A.store.set("open-fx-" + key, det.open); });
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: title }), count ? h("span", { class: "pb-acc-count", text: String(count) }) : null));
    var inner = h("div", { class: "pb-acc-body" });
    build(inner);
    det.appendChild(inner);
    return det;
  }

  // Une ligne « libellé | valeur » : NumericControl de l'éditeur (saisie, ▲▼, flèches clavier, glissement, curseur) ; vide = effet retiré
  // cfg : step, integer, precision, slider ([min, max]), drag ; le pas par défaut suit l'étendue de la plage
  function numRow(label, value, min, max, unit, onSet, disabled, placeholder, cfg) {
    var span = max - min;
    var c = Object.assign({ min: min, max: max, step: span <= 1 ? 0.01 : span <= 10 ? 0.1 : 1, integer: false, staticUnit: unit, value: value, placeholder: placeholder || "0", base: Number(placeholder) || 0, disabled: disabled, drag: true,
      onCommit: function (raw, u, opts) { return onSet(raw === "" ? undefined : Number(raw), opts); } }, cfg || {});
    return A.numField(label, c, value !== undefined, function () { onSet(undefined); });
  }

  // Modifie it.motion (même emplacement que l'animation d'entrée) : annulable, enregistré, revalidé par le serveur
  function setMotion(it, label, mutate, opts) {
    A.change(function () {
      var x = A.byId(it.id), m = Object.assign({}, x.motion);
      mutate(m);
      Object.keys(m).forEach(function (k) {
        var v = m[k];
        if (v === undefined || v === "" || v === null || (typeof v === "object" && !Array.isArray(v) && !Object.keys(v).length) || (Array.isArray(v) && !v.length)) delete m[k];
      });
      if (Object.keys(m).length) x.motion = m; else delete x.motion;
    }, { label: label, key: opts && opts.key, light: opts && opts.light });
  }

  // « Actif sur » : écrans où les effets de défilement et de souris sont coupés (data-kw-fx-off côté page)
  function screensRow(it, locked) {
    var h = A.h, off = (it.motion && it.motion.off) || [];
    var checks = h("div", { class: "pb-checks" });
    A.BPS.forEach(function (bp) {
      var cb = h("input", { type: "checkbox", disabled: locked });
      cb.checked = off.indexOf(bp) < 0;
      cb.addEventListener("change", function () {
        var next = A.BPS.filter(function (x) { return x === bp ? !cb.checked : off.indexOf(x) >= 0; });
        if (next.length === A.BPS.length) { cb.checked = true; A.toast("Laissez au moins un écran actif (sinon supprimez les effets).", true); return; }
        setMotion(it, "Écrans des effets", function (m) { m.off = next; });
      });
      checks.appendChild(h("label", {}, cb, " " + A.bpLabel(bp)));
    });
    return h("div", { class: "pb-field" }, h("p", { class: "pb-sub", text: "Actif sur" }), checks);
  }

  function scrollSection(it, locked) {
    var m = it.motion || {}, sc = m.scroll || {};
    var count = Object.keys(sc).length;
    return section("scroll", "Effets de défilement", count, function (inner) {
      var h = A.h;
      var tilt = m.mouse && m.mouse.mode === "tilt";
      A.SPEC.scrollFx.forEach(function (fx) {
        var blocked = fx.key === "rotate" && tilt;
        inner.appendChild(numRow(fx.label, sc[fx.key], fx.min, fx.max, fx.unit, function (v, opts) {
          setMotion(it, "Effet de défilement", function (mm) { var n = Object.assign({}, mm.scroll); if (v === undefined || v === 0) delete n[fx.key]; else n[fx.key] = Math.round(v); mm.scroll = n; }, opts);
        }, locked || blocked, "0", { integer: true, step: 1 }));
        if (blocked) inner.appendChild(h("p", { class: "pb-hint", text: "Rotation indisponible : l'inclinaison à la souris utilise déjà la rotation de l'élément." }));
      });
      inner.appendChild(h("p", { class: "pb-hint", text: "L'effet suit la position réelle de l'élément dans la fenêtre pendant le défilement (0 au centre de l'écran). Visible dans l'aperçu et sur la page publiée, pas dans le canevas de l'éditeur." }));
      if (count || m.mouse) inner.appendChild(screensRow(it, locked));
    });
  }

  function mouseSection(it, locked) {
    var m = it.motion || {}, mo = m.mouse || null;
    return section("mouse", "Effet de souris", mo ? 1 : 0, function (inner) {
      var h = A.h;
      if (A.getDevice() === "mobile") {
        inner.appendChild(h("p", { class: "pb-hint", text: "Un appareil mobile n'a pas de curseur : l'effet de souris n'y est jamais appliqué. Passez en affichage Ordinateur pour le régler." }));
        return;
      }
      inner.appendChild(A.selectField("Effet", mo ? mo.mode : "", [["", "Aucun"]].concat(A.SPEC.mouseModes), function (v) {
        setMotion(it, "Effet de souris", function (mm) { if (!v) delete mm.mouse; else mm.mouse = { mode: v, strength: (mm.mouse && mm.mouse.strength) || 30 }; });
      }, { disabled: locked }));
      if (mo) {
        inner.appendChild(numRow("Intensité", mo.strength, 1, 100, mo.mode === "tilt" ? "→ jusqu'à " + Math.round(mo.strength * 0.2) + "°" : "→ jusqu'à " + Math.round(mo.strength * 0.5) + " px", function (v, opts) {
          setMotion(it, "Effet de souris", function (mm) { mm.mouse = Object.assign({}, mm.mouse, { strength: v === undefined ? 30 : Math.round(v) }); }, opts);
        }, locked, "30", { integer: true, step: 1 }));
        if (mo.mode === "track") inner.appendChild(A.checkField("Suivre le curseur (au lieu de s'en éloigner)", mo.invert, function (v) {
          setMotion(it, "Effet de souris", function (mm) { mm.mouse = Object.assign({}, mm.mouse, { invert: v ? true : undefined }); });
        }, { disabled: locked }));
        inner.appendChild(h("p", { class: "pb-hint", text: "Seulement sur un appareil avec souris (pointeur précis et survol). Jamais appliqué aux personnes qui ont demandé de réduire les animations." }));
        inner.appendChild(screensRow(it, locked));
      }
    });
  }

  // Épinglage : position « sticky » avec un décalage du haut ou du bas, réglable par écran comme les autres styles
  function stickySection(it, locked) {
    var pos = A.ownValue(it, "position"), top = A.ownValue(it, "top"), bottom = A.ownValue(it, "bottom");
    var mode = pos === "sticky" ? (bottom !== undefined && top === undefined ? "bottom" : "top") : "";
    return section("sticky", "Épinglage", mode ? 1 : 0, function (inner) {
      var h = A.h, ids = A.idsOf([it]);
      var apply = function (next) {
        if (!next) { if (pos === "sticky") A.setStyles(ids, { position: "", top: "", bottom: "" }, { label: "Épinglage" }); return; }
        var offset = (next === "top" ? top : bottom) || "0px";
        A.setStyles(ids, next === "top" ? { position: "sticky", top: offset, bottom: "" } : { position: "sticky", bottom: offset, top: "" }, { label: "Épinglage" });
      };
      inner.appendChild(A.breakpointSwitch([it]));
      inner.appendChild(A.selectField("Épingler", mode, [["", "Aucun"], ["top", "En haut de l'écran"], ["bottom", "En bas de l'écran"]], apply, { disabled: locked }));
      if (mode) {
        var cur = mode === "top" ? top : bottom;
        inner.appendChild(numRow("Distance du bord", cur === undefined ? undefined : parseInt(cur, 10), 0, 2000, "px", function (v, opts) {
          var px = (v === undefined ? 0 : Math.round(v)) + "px";
          A.setStyles(ids, mode === "top" ? { top: px } : { bottom: px }, { label: "Épinglage", key: opts && opts.key, light: opts && opts.light });
        }, locked, "0", { integer: true, step: 1 }));
        inner.appendChild(h("p", { class: "pb-hint", text: "L'élément reste visible tant que son conteneur est à l'écran (comportement natif du navigateur). Donnez-lui un « plan » (z-index) dans Position pour qu'il passe au-dessus du reste." }));
      }
    });
  }

  var TRANSFORM_FIELDS = [
    ["x", "Décalage X", "len", "0"], ["y", "Décalage Y", "len", "0"], ["rotate", "Rotation", "°", "0", -360, 360], ["scale", "Échelle", "×", "1", 0.1, 3],
    ["skewX", "Inclinaison X", "°", "0", -60, 60], ["skewY", "Inclinaison Y", "°", "0", -60, 60],
  ];
  // Transformer : déplacement, rotation, échelle, inclinaison — au repos (Normal) ou au survol, pour l'écran modifié
  function transformSection(it, locked, caps) {
    var t = A.ownValue(it, "transform") || {};
    return section("transform", "Transformer", Object.keys(t).length, function (inner) {
      var h = A.h, ids = A.idsOf([it]);
      inner.appendChild(A.breakpointSwitch([it]));
      if (A.hasStates(it)) {
        var state = A.getState() === "hover" ? "hover" : "normal";
        inner.appendChild(h("div", { class: "pb-seg pb-state-seg", role: "radiogroup", "aria-label": "État de la transformation" }, [["normal", "Normal"], ["hover", "Survol"]].map(function (s) {
          return h("button", { type: "button", role: "radio", "aria-checked": String(state === s[0]), onclick: function () { A.setState(s[0]); } }, s[1]);
        })));
        if (state === "hover") inner.appendChild(h("p", { class: "pb-hint", text: "Transformation au survol de la souris (sur un appareil sans survol elle ne s'applique jamais)." }));
      }
      var put = function (key, value, opts) {
        var next = Object.assign({}, A.ownValue(A.byId(it.id), "transform") || {});
        if (value === undefined || value === null || value === "") delete next[key]; else next[key] = value;
        A.setStyle(ids, "transform", Object.keys(next).length ? next : "", { label: "Transformation", key: opts && opts.key, light: opts && opts.light });
      };
      TRANSFORM_FIELDS.forEach(function (f) {
        var id = uid(), cur = t[f[0]];
        if (f[2] === "len") {
          // Déplacement : nombre + unité (px, %, rem) ; changer l'unité change le CSS
          var cl = /^(-?[\d.]+)(px|%|rem|em|vh|vw)$/.exec(String(cur === undefined ? "" : cur));
          inner.appendChild(A.numField(f[1], { min: -9999, max: 9999, step: function (u) { return u === "px" || u === "%" ? 1 : 0.1; }, units: ["px", "%", "rem"], unit: cl ? cl[2] : "px", value: cl ? cl[1] : cur === "0" ? "0" : "", placeholder: "0", base: 0, drag: true, disabled: locked, prop: "transform-" + f[0],
            onCommit: function (raw, u, opts) {
              var v = raw === "" ? "" : Number(raw) === 0 ? "0" : raw + u;
              if (v !== "" && A.parseLength(v, "top") === null) return false;
              put(f[0], v === "0" || v === "" ? undefined : v, opts);
            } }, cur !== undefined, function () { put(f[0], undefined); }));
        } else {
          var cfg = f[0] === "scale" ? { step: 0.01, precision: 2, slider: [f[4], f[5]] } : { step: 1, integer: true, slider: f[0] === "rotate" ? [f[4], f[5]] : null };
          inner.appendChild(numRow(f[1], cur, f[4], f[5], f[2], function (v, opts) { put(f[0], v === undefined ? undefined : f[0] === "scale" ? v : Math.round(v), opts); }, locked, f[3], cfg));
        }
      });
      inner.appendChild(h("p", { class: "pb-hint", text: "Origine de la transformation et durée de la transition : sections Position et Effets de l'onglet Style." }));
    });
  }

  // Masque : découpe en forme (tracé CSS) et/ou masque d'image (PNG ou SVG avec transparence de la médiathèque)
  function maskSection(it, locked) {
    var mk = A.ownValue(it, "mask") || {};
    return section("mask", "Masque", Object.keys(mk).length ? 1 : 0, function (inner) {
      var h = A.h, ids = A.idsOf([it]);
      inner.appendChild(A.breakpointSwitch([it]));
      var put = function (patch) {
        var next = Object.assign({}, A.ownValue(A.byId(it.id), "mask") || {}, patch);
        Object.keys(next).forEach(function (k) { if (next[k] === undefined || next[k] === "") delete next[k]; });
        if (!next.src) { delete next.size; delete next.position; delete next.repeat; }
        A.setStyle(ids, "mask", Object.keys(next).length ? next : "", { label: "Masque" });
      };
      inner.appendChild(A.selectField("Forme", mk.shape || "", [["", "Aucune"]].concat(A.SPEC.maskShapes), function (v) { put({ shape: v || undefined }); }, { disabled: locked }));
      inner.appendChild(h("div", { class: "pb-row pb-wrap" },
        h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: locked, onclick: function () { A.openMedia({ title: "Image du masque (transparence)", onPick: function (m) { put({ src: m.path, size: mk.size || "contain", position: mk.position || "center", repeat: mk.repeat || "no-repeat" }); } }); } }, mk.src ? "Changer l'image du masque" : "Choisir une image de masque"),
        mk.src ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { put({ src: undefined }); } }, "Retirer l'image") : null));
      if (mk.src) {
        inner.appendChild(h("div", { class: "pb-grid-2" },
          A.selectField("Taille", mk.size || "contain", [["contain", "Contenir"], ["cover", "Couvrir"], ["auto", "Automatique"]], function (v) { put({ size: v }); }, { disabled: locked }),
          A.selectField("Position", mk.position || "center", [["center", "Centre"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"]], function (v) { put({ position: v }); }, { disabled: locked })));
        inner.appendChild(A.selectField("Répétition", mk.repeat || "no-repeat", [["no-repeat", "Aucune"], ["repeat", "Répéter"], ["space", "Espacer"], ["round", "Ajuster"]], function (v) { put({ repeat: v }); }, { disabled: locked }));
        inner.appendChild(h("p", { class: "pb-hint", text: "Seules les zones opaques de l'image restent visibles." }));
      }
    });
  }

  // Les sections de l'élément, dans l'ordre d'affichage ; vide si l'élément n'a aucune capacité avancée
  function sections(it, locked) {
    if (!A || !it || !A.isNode(it)) return [];
    var caps = capsOf(it), out = [];
    if (caps.indexOf("scroll") >= 0) out.push(scrollSection(it, locked));
    if (caps.indexOf("mouse") >= 0) out.push(mouseSection(it, locked));
    if (caps.indexOf("sticky") >= 0) out.push(stickySection(it, locked));
    if (caps.indexOf("transform") >= 0) out.push(transformSection(it, locked, caps));
    if (caps.indexOf("mask") >= 0) out.push(maskSection(it, locked));
    return out;
  }

  window.pbEffects = { attach: attach, sections: sections, capsOf: function (it) { return A ? capsOf(it) : []; } };
})();

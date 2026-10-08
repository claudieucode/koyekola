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
  // Épinglage (position: sticky réel) : haut ou bas de l'écran, distance du bord, plan (z-index), écran par écran ; « Aucun » sur un écran
  // coupe l'épinglage hérité de l'écran plus grand (position: static écrite), et les causes qui empêchent un épinglage de fonctionner
  // (conteneur trop court, débordement masqué) sont CONSTATÉES dans le canevas et signalées
  function stickyDiagnostics(it) {
    var el = A.canvasEl(it.id), win = el && el.ownerDocument.defaultView, out = [];
    if (!el || !win) return out;
    var parent = el.parentElement;
    if (parent && parent.getBoundingClientRect().height <= el.getBoundingClientRect().height + 1) {
      var pd = win.getComputedStyle(parent).display, stretch = /flex|grid/.test(pd) && win.getComputedStyle(el).alignSelf !== "flex-start" && win.getComputedStyle(el).alignSelf !== "start";
      out.push(stretch ? "Le conteneur étire l'élément sur toute sa hauteur : il n'a donc aucune place pour glisser. Réglez « Alignement dans le parent » (Mise en page) sur « Début »." : "Le conteneur n'est pas plus haut que l'élément : il n'y a aucune place pour qu'il reste épinglé. Donnez plus de hauteur au conteneur.");
    }
    for (var p = parent; p && p !== el.ownerDocument.documentElement; p = p.parentElement) {
      var cs = win.getComputedStyle(p);
      if (/(hidden|auto|scroll|clip)/.test(cs.overflowY) || /(hidden|auto|scroll|clip)/.test(cs.overflowX)) { out.push("Un conteneur parent a un débordement masqué ou défilant : il bloque l'épinglage (Style › Effets › Débordement : « Visible »)."); break; }
    }
    return out;
  }
  function stickySection(it, locked) {
    var own = A.ownValue(it, "position"), inh = A.inheritedValue(it, "position");
    var eff = own !== undefined ? own : inh;
    var top = A.ownValue(it, "top"), bottom = A.ownValue(it, "bottom");
    var etop = top !== undefined ? top : A.inheritedValue(it, "top"), ebottom = bottom !== undefined ? bottom : A.inheritedValue(it, "bottom");
    var mode = eff === "sticky" ? (ebottom !== undefined && etop === undefined ? "bottom" : "top") : "";
    return section("sticky", "Épinglage", own === "sticky" ? 1 : 0, function (inner) {
      var h = A.h, ids = A.idsOf([it]);
      var apply = function (next) {
        if (!next) {
          // Écran plus petit avec un épinglage hérité : on l'éteint explicitement ; sinon on efface simplement la valeur
          if (inh === "sticky" && own !== "static") A.setStyles(ids, { position: "static", top: "", bottom: "" }, { label: "Épinglage" });
          else if (own !== undefined) A.setStyles(ids, { position: "", top: "", bottom: "" }, { label: "Épinglage" });
          return;
        }
        var offset = (next === "top" ? etop : ebottom) || "0px";
        A.setStyles(ids, next === "top" ? { position: "sticky", top: offset, bottom: "" } : { position: "sticky", bottom: offset, top: "" }, { label: "Épinglage" });
      };
      inner.appendChild(A.breakpointSwitch([it]));
      inner.appendChild(A.selectField("Épingler", mode, [["", "Aucun"], ["top", "En haut de l'écran"], ["bottom", "En bas de l'écran"]], apply, { disabled: locked }));
      if (mode) {
        var cur = mode === "top" ? etop : ebottom;
        inner.appendChild(numRow("Distance du bord", cur === undefined ? undefined : parseInt(cur, 10), 0, 2000, "px", function (v, opts) {
          var px = (v === undefined ? 0 : Math.round(v)) + "px";
          A.setStyles(ids, mode === "top" ? { top: px } : { bottom: px }, { label: "Épinglage", key: opts && opts.key, light: opts && opts.light });
        }, locked, "0", { integer: true, step: 1 }));
        var z = A.ownValue(it, "zIndex"), zi = A.inheritedValue(it, "zIndex");
        inner.appendChild(A.numField("Plan (z-index)", { min: -100, max: 9999, step: 1, integer: true, value: z === undefined ? "" : z, placeholder: zi === undefined ? "auto" : zi, base: 10, drag: true, disabled: locked, prop: "sticky-zindex",
          onCommit: function (raw, u, opts) { A.setStyles(ids, { zIndex: raw === "" ? "" : Number(raw) }, { label: "Plan", key: opts && opts.key, light: opts && opts.light }); } }, z !== undefined, function () { A.setStyles(ids, { zIndex: "" }, { label: "Plan" }); }));
        stickyDiagnostics(it).forEach(function (msg) { inner.appendChild(h("p", { class: "pb-note is-warn", "data-pb-sticky-warn": "", text: msg })); });
        inner.appendChild(h("p", { class: "pb-hint", text: "L'élément reste visible tant que son conteneur est à l'écran (comportement natif du navigateur). Donnez-lui un plan (z-index) pour qu'il passe au-dessus du reste. Réglable séparément sur tablette et mobile." }));
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

  // ---------- Animation d'entrée, au survol, mouvement réduit, copie / réinitialisation (moteur de mouvement) ----------
  // Le catalogue (SPEC.animations) vient du registre du serveur : le menu, la recherche, l'aperçu et la validation lisent la même source.
  var EASE_CSS = { smooth: "cubic-bezier(.2, .7, .2, 1)", linear: "linear", ease: "ease", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "cubic-bezier(.34, 1.56, .64, 1)" };
  var EASE_LABEL = { smooth: "Douce (par défaut)", ease: "ease", linear: "linear", "ease-in": "ease-in", "ease-out": "ease-out", "ease-in-out": "ease-in-out", spring: "Ressort", custom: "cubic-bezier personnalisé…" };
  var ENTRANCE_KEYS = ["entrance", "duration", "delay", "easing", "repeat", "iterations", "direction", "trigger", "screens"];
  var animById = function (id) { return A.SPEC.animations.filter(function (a) { return a.id === id; })[0] || null; };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // Aperçu dans le canevas : style posé sur l'élément du canevas SEULEMENT (jamais dans le document, jamais enregistré) ; retiré à la fin
  var preview = null;
  function stopPreview() {
    if (!preview) return;
    clearTimeout(preview.timer);
    try { preview.el.style.animation = ""; } catch (e) { /* élément déjà remplacé */ }
    var btn = preview.button; preview = null;
    if (btn) btn.textContent = "▶ Prévisualiser";
  }
  function playPreview(it, animId, p, button) {
    var el = A.canvasEl(it.id), a = animById(animId);
    if (!el || !a) return;
    stopPreview();
    var d = el.ownerDocument;
    if (!d.getElementById("pb-motion-all")) { var st = d.createElement("style"); st.id = "pb-motion-all"; st.textContent = A.SPEC.motionCss; d.head.appendChild(st); }
    p = p || {};
    var dur = p.duration || a.defaultDuration, delay = p.delay || 0, iter = p.iterations || 1;
    var ease = p.easing ? (EASE_CSS[p.easing] || p.easing) : EASE_CSS[a.defaultEasing] || EASE_CSS.smooth;
    el.style.animation = "none"; void el.offsetWidth;
    el.style.animation = "kw-a-" + animId + " " + dur + "ms " + ease + " " + delay + "ms " + iter + " " + (p.direction || "normal") + (a.fill === "none" ? "" : " " + a.fill); // « none » (attention) est la valeur par défaut : on ne l'écrit pas (ambigu avec le nom)
    var total = iter === "infinite" ? 6000 : (dur * iter + delay + 120);
    preview = { el: el, button: button || null, manual: Boolean(button), timer: setTimeout(function () { stopPreview(); }, total) };
    if (button) button.textContent = "⏹ Arrêter";
  }

  // Menu des animations : recherche instantanée, catégories toujours visibles, aperçu au survol (sans enregistrer), choix au clic ou à Entrée
  var pop = null, popFor = null;
  function closeMenu() { if (!pop) return; stopPreview(); pop.remove(); pop = null; popFor = null; document.removeEventListener("mousedown", onOutside, true); }
  function onOutside(e) { if (pop && !pop.contains(e.target) && !(popFor && popFor.contains(e.target))) closeMenu(); }
  function openMenu(anchor, it, current, onPick) {
    if (pop) { var same = popFor === anchor; closeMenu(); if (same) return; }
    var h = A.h, m = it.motion || {};
    var search = h("input", { type: "search", class: "pb-amenu-search", placeholder: "Rechercher une animation…", "aria-label": "Rechercher une animation", autocomplete: "off" });
    var list = h("div", { class: "pb-amenu-list", role: "listbox", "aria-label": "Animations" });
    var items = [];
    var itemBtn = function (id, label, on) {
      var b = h("button", { type: "button", role: "option", class: "pb-amenu-item" + (on ? " is-on" : ""), "aria-selected": String(Boolean(on)), "data-anim": id, text: label });
      b.addEventListener("mouseenter", function () { if (id) playPreview(it, id, { duration: null, delay: 0, iterations: 1 }); else stopPreview(); });
      b.addEventListener("focus", function () { if (id) playPreview(it, id, { iterations: 1 }); });
      b.addEventListener("mouseleave", stopPreview);
      b.addEventListener("click", function () { var chosen = id; closeMenu(); onPick(chosen); });
      return b;
    };
    var draw = function () {
      list.textContent = ""; items = [];
      var q = norm(search.value.trim());
      if (!q) { var none = itemBtn("", "Aucune", !current); items.push(none); list.appendChild(none); }
      A.SPEC.animationCategories.forEach(function (cat) {
        var inCat = A.SPEC.animations.filter(function (a) { return a.category === cat && (!q || norm(a.label).indexOf(q) >= 0 || norm(a.id).indexOf(q) >= 0 || norm(cat).indexOf(q) >= 0); });
        if (!inCat.length) return;
        list.appendChild(h("div", { class: "pb-amenu-cat", role: "presentation", text: cat }));
        inCat.forEach(function (a) { var b = itemBtn(a.id, a.label, a.id === current); items.push(b); list.appendChild(b); });
      });
      if (!items.length) list.appendChild(h("p", { class: "pb-hint", text: "Aucune animation ne correspond." }));
    };
    search.addEventListener("input", draw);
    pop = h("div", { class: "pb-amenu", role: "dialog", "aria-label": "Choisir une animation" }, search, list);
    pop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); var a = anchor; closeMenu(); a.focus(); return; }
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown") { e.preventDefault(); (items[Math.min(items.length - 1, i + 1)] || items[0]).focus(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (i <= 0) search.focus(); else items[i - 1].focus(); }
      else if (e.key === "Enter" && document.activeElement === search) {
        e.preventDefault();
        var first = items.filter(function (b) { return b.getAttribute("data-anim"); })[0];
        if (first) first.click();
      }
    });
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect(), w = Math.max(r.width, 250);
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8)) + "px";
    pop.style.top = Math.min(r.bottom + 4, window.innerHeight - 340) + "px";
    pop.style.width = w + "px";
    popFor = anchor;
    draw();
    document.addEventListener("mousedown", onOutside, true);
    search.focus();
    var cur = list.querySelector(".is-on"); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: "nearest" });
  }

  var animSelect = function (label, value, inherit, onChange, disabled) {
    var h = A.h, id = uid();
    var sel = h("select", { id: id, disabled: disabled }, [h("option", { value: "", text: inherit })].concat([h("option", { value: "none", text: "Aucune animation" })], A.SPEC.animationCategories.map(function (cat) {
      return h("optgroup", { label: cat }, A.SPEC.animations.filter(function (a) { return a.category === cat; }).map(function (a) { return h("option", { value: a.id, text: a.label }); }));
    })));
    sel.value = value || "";
    sel.addEventListener("change", function () { onChange(sel.value); });
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), sel);
  };

  var clip = null;
  function motionPanel(it, locked) {
    var h = A.h, m = it.motion || {};
    var has = Object.keys(m).length;
    return section("motion", "Effets de mouvement", has ? Object.keys(m).filter(function (k) { return k !== "off" && k !== "alwaysMotion"; }).length : 0, function (inner) {
      var a = m.entrance ? animById(m.entrance) : null;
      var set = function (mutate, opts) { setMotion(it, "Animation d'entrée", mutate, opts); };
      // --- Animation d'entrée ---
      inner.appendChild(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Animation d'entrée" })));
      var pickId = uid();
      var pickBtn = h("button", { type: "button", id: pickId, class: "pb-amenu-btn", disabled: locked, "aria-haspopup": "dialog", "data-pb-anim-pick": "" }, h("span", { text: a ? a.label : "Aucune" }), h("span", { class: "pb-amenu-caret", "aria-hidden": "true", text: "▾" }));
      pickBtn.addEventListener("click", function () {
        openMenu(pickBtn, it, m.entrance || "", function (id) {
          if (!id) { set(function (mm) { ENTRANCE_KEYS.forEach(function (k) { delete mm[k]; }); }); return; }
          var an = animById(id);
          set(function (mm) {
            mm.entrance = id;
            if (mm.duration === undefined) mm.duration = an.defaultDuration;
            if (mm.delay === undefined) mm.delay = 0;
          });
          setTimeout(function () { var cur = A.byId(it.id); playPreview(cur, id, { duration: cur.motion && cur.motion.duration, easing: cur.motion && cur.motion.easing }); }, 520); // après le redessin du canevas (220 ms), sinon l'aperçu serait effacé
        });
      });
      inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: pickId, text: "Animation" }), pickBtn));
      if (a) {
        var secs = function (v) { return Math.round(v) / 1000; };
        inner.appendChild(h("div", { class: "pb-prop-group" },
          A.numField("Durée", { min: 0.1, max: 10, step: 0.1, precision: 2, staticUnit: "s", value: secs(m.duration), base: 0.6, allowEmpty: false, drag: true, disabled: locked, prop: "motion-duration",
            onCommit: function (raw, u, opts) { var ms = Math.round(Number(raw) * 1000); if (!isFinite(ms)) return false; set(function (mm) { mm.duration = ms; }, opts); } }, false),
          A.numField("Délai", { min: 0, max: 10, step: 0.1, precision: 2, staticUnit: "s", value: secs(m.delay || 0), base: 0, allowEmpty: false, drag: true, disabled: locked, prop: "motion-delay",
            onCommit: function (raw, u, opts) { var ms = Math.round(Number(raw) * 1000); if (!isFinite(ms)) return false; set(function (mm) { mm.delay = ms; }, opts); } }, false)));
        // Courbe : un nom connu, ou 4 nombres pour un « cubic-bezier » personnalisé
        var cur = m.easing || "smooth", custom = /^cubic-bezier/.test(cur);
        var easeId = uid();
        var easeSel = h("select", { id: easeId, disabled: locked }, Object.keys(EASE_LABEL).map(function (k) { return h("option", { value: k, text: EASE_LABEL[k] }); }));
        easeSel.value = custom ? "custom" : cur;
        easeSel.addEventListener("change", function () {
          if (easeSel.value === "custom") { set(function (mm) { mm.easing = "cubic-bezier(0.25, 0.1, 0.25, 1)"; }); return; }
          set(function (mm) { if (easeSel.value === "smooth") delete mm.easing; else mm.easing = easeSel.value; });
        });
        inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: easeId, text: "Courbe d'accélération" }), easeSel));
        if (custom) {
          var bid = uid(), nums = (/\(([^)]*)\)/.exec(cur) || [0, ""])[1];
          var bez = h("input", { id: bid, type: "text", class: "pb-len-num pb-bezier", value: nums, disabled: locked, "aria-label": "cubic-bezier : x1, y1, x2, y2", placeholder: "0.25, 0.1, 0.25, 1", autocomplete: "off" });
          bez.addEventListener("change", function () {
            var p = bez.value.split(",").map(function (x) { return Number(x.trim()); });
            if (p.length !== 4 || p.some(function (x) { return !isFinite(x); }) || p[0] < 0 || p[0] > 1 || p[2] < 0 || p[2] > 1 || p[1] < -3 || p[1] > 3 || p[3] < -3 || p[3] > 3) { bez.setAttribute("aria-invalid", "true"); A.toast("Courbe : 4 nombres (x1, y1, x2, y2) ; x entre 0 et 1, y entre -3 et 3.", true); return; }
            bez.removeAttribute("aria-invalid");
            set(function (mm) { mm.easing = "cubic-bezier(" + p.join(", ") + ")"; });
          });
          inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: bid, text: "x1, y1, x2, y2" }), bez));
        }
        var itId = uid();
        var itSel = h("select", { id: itId, disabled: locked }, [["1", "Une fois"], ["2", "2 fois"], ["3", "3 fois"], ["infinite", "Infini"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
        itSel.value = String(m.iterations || 1);
        itSel.addEventListener("change", function () { set(function (mm) { if (itSel.value === "1") delete mm.iterations; else mm.iterations = itSel.value === "infinite" ? "infinite" : Number(itSel.value); if (itSel.value === "1" && /^alternate/.test(mm.direction || "")) delete mm.direction; }); });
        inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: itId, text: "Répétition" }), itSel));
        if (m.iterations === "infinite") inner.appendChild(h("p", { class: "pb-hint", text: "Animation sans fin : à réserver aux éléments d'attention ; elle est coupée pour les visiteurs qui préfèrent moins de mouvement." }));
        var dirs = [["normal", "Normal"], ["reverse", "Inverse"]].concat(m.iterations && m.iterations !== 1 ? [["alternate", "Aller-retour"], ["alternate-reverse", "Aller-retour inversé"]] : []);
        var dId = uid();
        var dSel = h("select", { id: dId, disabled: locked }, dirs.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
        dSel.value = dirs.some(function (o) { return o[0] === (m.direction || "normal"); }) ? (m.direction || "normal") : "normal";
        dSel.addEventListener("change", function () { set(function (mm) { if (dSel.value === "normal") delete mm.direction; else mm.direction = dSel.value; }); });
        inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: dId, text: "Direction" }), dSel));
        var tId = uid();
        var tSel = h("select", { id: tId, disabled: locked }, A.SPEC.motionTriggers.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
        tSel.value = m.trigger || "viewport";
        tSel.addEventListener("change", function () { set(function (mm) { if (tSel.value === "viewport") delete mm.trigger; else mm.trigger = tSel.value; if (tSel.value !== "viewport") delete mm.repeat; }); });
        inner.appendChild(h("div", { class: "pb-field" }, h("label", { for: tId, text: "Déclenchement" }), tSel));
        if (m.trigger === "click" || m.trigger === "hover") inner.appendChild(h("p", { class: "pb-hint", text: "L'élément reste visible tant que l'animation n'est pas déclenchée ; elle se rejoue à chaque " + (m.trigger === "click" ? "clic." : "survol.") }));
        if (!m.trigger || m.trigger === "viewport") inner.appendChild(A.checkField("Jouer une seule fois", !m.repeat, function (v) { set(function (mm) { if (v) delete mm.repeat; else mm.repeat = true; }); }, { disabled: locked, hint: "Décoché : elle se rejoue à chaque fois que l'élément revient à l'écran." }));
        // Un autre écran peut remplacer l'animation ou la couper ; vide = hérite de l'écran plus grand
        var sc = m.screens || {};
        var setScreen = function (bp, v) { set(function (mm) { var n = Object.assign({}, mm.screens); if (!v) delete n[bp]; else n[bp] = v; mm.screens = n; }); };
        inner.appendChild(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Selon l'écran" })));
        inner.appendChild(animSelect("Tablette", sc.tablet, "Hérite de l'ordinateur", function (v) { setScreen("tablet", v); }, locked));
        inner.appendChild(animSelect("Mobile", sc.mobile, "Hérite de la tablette", function (v) { setScreen("mobile", v); }, locked));
        var pbtn = h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-anim-preview": "", onclick: function () {
          if (preview && preview.manual) { stopPreview(); return; } // ⏹ ; un aperçu automatique (juste après un choix) est simplement relancé
          var cur2 = A.byId(it.id).motion || {};
          playPreview(it, cur2.entrance, { duration: cur2.duration, delay: cur2.delay, easing: cur2.easing, iterations: cur2.iterations, direction: cur2.direction }, pbtn);
        } }, "▶ Prévisualiser");
        inner.appendChild(h("div", { class: "pb-row pb-wrap" }, pbtn,
          h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { stopPreview(); set(function (mm) { ENTRANCE_KEYS.forEach(function (k) { delete mm[k]; }); }); } }, "Supprimer l'animation")));
      }
      // --- Au survol ---
      inner.appendChild(A.selectField("Au survol", m.hover || "", [["", "Aucun effet"]].concat(A.SPEC.hovers), function (v) { setMotion(it, "Effet au survol", function (mm) { if (v) mm.hover = v; else delete mm.hover; }); }, { disabled: locked }));
      // --- Accessibilité ---
      inner.appendChild(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Accessibilité" })));
      inner.appendChild(A.checkField("Respecter les préférences système de mouvement réduit", !m.alwaysMotion, function (v) { setMotion(it, "Mouvement réduit", function (mm) { if (v) delete mm.alwaysMotion; else mm.alwaysMotion = true; }); }, { disabled: locked, hint: "Activé : pour les visiteurs qui ont demandé moins d'animations, l'entrée devient un fondu court (ou disparaît), le défilement et la souris sont coupés." }));
      // --- Copier / coller / réinitialiser ---
      inner.appendChild(h("div", { class: "pb-row pb-wrap" },
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !has, onclick: function () {
          var cur3 = A.byId(it.id), styles = {};
          Object.keys(cur3.styles || {}).forEach(function (bp) { ["position", "top", "bottom", "zIndex"].forEach(function (k) { if (cur3.styles[bp] && cur3.styles[bp][k] !== undefined) { styles[bp] = styles[bp] || {}; styles[bp][k] = cur3.styles[bp][k]; } }); });
          clip = { motion: JSON.parse(JSON.stringify(cur3.motion || {})), styles: styles };
          A.toast("Effets de mouvement copiés.");
        } }, "Copier les effets"),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () {
          if (!clip) { A.toast("Copiez d'abord les effets d'un autre élément.", true); return; }
          A.change(function () {
            var x = A.byId(it.id);
            if (Object.keys(clip.motion).length) x.motion = JSON.parse(JSON.stringify(clip.motion)); else delete x.motion;
            Object.keys(clip.styles).forEach(function (bp) { x.styles = x.styles || {}; x.styles[bp] = Object.assign({}, x.styles[bp], clip.styles[bp]); });
          }, { label: "Coller les effets de mouvement" });
        } }, "Coller les effets"),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked || !has, onclick: function () { stopPreview(); A.change(function () { delete A.byId(it.id).motion; }, { label: "Réinitialiser les effets de mouvement" }); } }, "Réinitialiser")));
    });
  }

  // ---------- Défilement « de → à » et souris « amplitudes » (moteur de mouvement) ----------
  // Chaque effet a sa case à cocher : cochée, il reçoit des valeurs de départ et d'arrivée réelles (enregistrées, rendues par kw-effects.js
  // sur la page publiée et l'aperçu). La plage (début / fin en % du trajet dans la fenêtre), le sens et l'inversion s'appliquent à tous.
  function scrollFxSection(it, locked) {
    var h = A.h, m = it.motion || {}, fx = m.scrollFx || {};
    var keys = A.SPEC.scrollRange;
    var count = keys.filter(function (r) { return fx[r.key]; }).length;
    return section("scrollfx", "Défilement : de → à", count, function (inner) {
      var set = function (fn, opts, label) { setMotion(it, label || "Défilement (de → à)", function (mm) { var n = JSON.parse(JSON.stringify(mm.scrollFx || {})); fn(n); mm.scrollFx = n; }, opts); };
      inner.appendChild(h("p", { class: "pb-hint", text: "L'élément passe de la valeur de départ à la valeur d'arrivée pendant qu'il traverse la fenêtre. Visible dans l'aperçu et sur la page publiée." }));
      keys.forEach(function (r) {
        var cur = fx[r.key], cid = uid();
        var cb = h("input", { type: "checkbox", id: cid, disabled: locked });
        cb.checked = Boolean(cur);
        cb.addEventListener("change", function () { set(function (n) { if (cb.checked) n[r.key] = { from: r.def[0], to: r.def[1] }; else delete n[r.key]; }); });
        inner.appendChild(h("label", { class: "pb-check", for: cid }, cb, " " + r.label));
        if (!cur) return;
        var cfg = function (which, label) {
          return { min: r.min, max: r.max, step: r.step, precision: r.step < 1 ? 2 : 0, integer: r.step >= 1, staticUnit: r.unit || null, value: cur[which], base: r.def[which === "from" ? 0 : 1], allowEmpty: false, drag: true, disabled: locked, prop: "sfx-" + r.key + "-" + which,
            onCommit: function (raw, u, opts) { var v = Number(raw); if (!isFinite(v)) return false; set(function (n) { var o = Object.assign({}, n[r.key] || cur); o[which] = v; n[r.key] = o; }, opts); } };
        };
        inner.appendChild(h("div", { class: "pb-grid-2" }, A.numField("De", cfg("from"), false), A.numField("À", cfg("to"), false)));
      });
      if (count) {
        inner.appendChild(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Zone de déclenchement" })));
        inner.appendChild(h("div", { class: "pb-grid-2" },
          A.numField("Début (%)", { min: 0, max: 99, step: 1, integer: true, staticUnit: "%", value: fx.start === undefined ? 0 : fx.start, base: 0, allowEmpty: false, drag: true, disabled: locked, prop: "sfx-start", onCommit: function (raw, u, opts) { var v = Number(raw); set(function (n) { if (v === 0) delete n.start; else n.start = v; }, opts); } }, false),
          A.numField("Fin (%)", { min: 1, max: 100, step: 1, integer: true, staticUnit: "%", value: fx.end === undefined ? 100 : fx.end, base: 100, allowEmpty: false, drag: true, disabled: locked, prop: "sfx-end", onCommit: function (raw, u, opts) { var v = Number(raw); set(function (n) { if (v === 100) delete n.end; else n.end = v; }, opts); } }, false)));
        if ((fx.start || 0) >= (fx.end || 100)) inner.appendChild(h("p", { class: "pb-hint is-warn", text: "Le début doit être avant la fin : sinon la zone complète est utilisée." }));
        inner.appendChild(A.selectField("Sens du défilement", fx.dir || "both", A.SPEC.scrollDirs, function (v) { set(function (n) { if (v === "both") delete n.dir; else n.dir = v; }); }, { disabled: locked }));
        inner.appendChild(A.checkField("Inverser la progression", fx.invert, function (v) { set(function (n) { if (v) n.invert = true; else delete n.invert; }); }, { disabled: locked }));
        if (fx.rotateX) inner.appendChild(A.numField("Perspective", { min: 200, max: 3000, step: 50, integer: true, staticUnit: "px", value: fx.perspective || 1000, base: 1000, allowEmpty: false, drag: true, disabled: locked, prop: "sfx-perspective", onCommit: function (raw, u, opts) { var v = Number(raw); set(function (n) { if (v === 1000) delete n.perspective; else n.perspective = v; }, opts); } }, false));
        inner.appendChild(screensRow(it, locked));
        inner.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { set(function (n) { Object.keys(n).forEach(function (k) { delete n[k]; }); }); } }, "Désactiver les effets de défilement"));
      }
    });
  }
  function mouseFxSection(it, locked) {
    var h = A.h, m = it.motion || {}, fx = m.mouseFx || {};
    var keys = A.SPEC.mouseRange;
    var count = keys.filter(function (r) { return fx[r.key]; }).length;
    return section("mousefx", "Souris : amplitudes", count, function (inner) {
      var set = function (fn, opts) { setMotion(it, "Effet de souris (amplitudes)", function (mm) { var n = JSON.parse(JSON.stringify(mm.mouseFx || {})); fn(n); mm.mouseFx = n; }, opts); };
      inner.appendChild(h("p", { class: "pb-hint", text: "L'amplitude est atteinte quand le curseur est au bord de la fenêtre ; au centre, l'élément est au repos. Uniquement avec une souris (pas sur écran tactile)." }));
      keys.forEach(function (r) {
        var cur = fx[r.key], cid = uid();
        var cb = h("input", { type: "checkbox", id: cid, disabled: locked });
        cb.checked = Boolean(cur);
        cb.addEventListener("change", function () { set(function (n) { if (cb.checked) n[r.key] = r.key === "scale" ? 10 : 20; else delete n[r.key]; }); });
        inner.appendChild(h("label", { class: "pb-check", for: cid }, cb, " " + r.label));
        if (cur) inner.appendChild(A.numField("Amplitude", { min: r.min, max: r.max, step: r.step, integer: true, staticUnit: r.unit, value: cur, base: 20, allowEmpty: false, drag: true, disabled: locked, prop: "mfx-" + r.key,
          onCommit: function (raw, u, opts) { var v = Number(raw); if (!isFinite(v)) return false; set(function (n) { if (v === 0) delete n[r.key]; else n[r.key] = v; }, opts); } }, false));
      });
      if (count) {
        if (fx.rotateX || fx.rotateY) inner.appendChild(A.numField("Perspective", { min: 200, max: 3000, step: 50, integer: true, staticUnit: "px", value: fx.perspective || 1000, base: 1000, allowEmpty: false, drag: true, disabled: locked, prop: "mfx-perspective", onCommit: function (raw, u, opts) { var v = Number(raw); set(function (n) { if (v === 1000) delete n.perspective; else n.perspective = v; }, opts); } }, false));
        inner.appendChild(A.numField("Réactivité", { min: 2, max: 100, step: 1, integer: true, staticUnit: "%", value: fx.speed || 18, base: 18, allowEmpty: false, drag: true, disabled: locked, prop: "mfx-speed", onCommit: function (raw, u, opts) { var v = Number(raw); set(function (n) { if (v === 18) delete n.speed; else n.speed = v; }, opts); } }, false));
        inner.appendChild(screensRow(it, locked));
        inner.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { set(function (n) { Object.keys(n).forEach(function (k) { delete n[k]; }); }); } }, "Désactiver les effets de souris"));
      }
    });
  }

  // Les sections de l'élément, dans l'ordre d'affichage ; vide si l'élément n'a aucune capacité avancée
  function sections(it, locked) {
    if (!A || !it || !A.isNode(it)) return [];
    var caps = capsOf(it), out = [];
    if (caps.indexOf("scroll") >= 0) { out.push(scrollSection(it, locked)); out.push(scrollFxSection(it, locked)); }
    if (caps.indexOf("mouse") >= 0) { out.push(mouseSection(it, locked)); out.push(mouseFxSection(it, locked)); }
    if (caps.indexOf("sticky") >= 0) out.push(stickySection(it, locked));
    if (caps.indexOf("transform") >= 0) out.push(transformSection(it, locked, caps));
    if (caps.indexOf("mask") >= 0) out.push(maskSection(it, locked));
    return out;
  }

  window.pbEffects = { attach: attach, sections: sections, motion: function (it, locked) { return A ? motionPanel(it, locked) : null; }, capsOf: function (it) { return A ? capsOf(it) : []; } };
})();

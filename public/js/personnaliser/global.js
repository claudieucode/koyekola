/* Personnaliser › Global : Typographie, Couleurs, Conteneur, Boutons.
   Chaque sous-catégorie lit et écrit UN ensemble « tokens.global.<section> » du moteur de styles (validé par le serveur : marketing/pages/globalStyles.js). Une valeur vide = héritée du thème ;
   tablette et mobile ne font que surcharger l'ordinateur. L'aperçu, le brouillon et la publication passent par le mécanisme commun de settings.js (K.api) : aucun second système. */
(function () {
  "use strict";
  var K = window.KWPZ; if (!K || !K.boot || !K.boot.global || !K.api) return;
  var boot = K.boot, G = boot.global, A = K.api;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var h = A.h, icon = A.icon, toast = A.toast, V = A.values;
  var IDS = { typography: "tokens.global.typography", colors: "tokens.global.colors", container: "tokens.global.container", buttons: "tokens.global.buttons" };
  var DEVNAME = { desktop: "ordinateur", tablet: "tablette", mobile: "mobile" };
  var clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var registry = [], openPop = null;
  var devKey = function () { var d = A.device(); return d === "tablet" ? "t" : d === "mobile" ? "m" : "d"; };
  var tmKey = function () { var d = A.device(); return d === "tablet" ? "tablet" : d === "mobile" ? "mobile" : null; };
  function edit(name, fn) { var o = clone(V()[IDS[name]]); fn(o); A.set(IDS[name], o); }
  var warnings = [];
  G.gradients = function () { return V()[IDS.colors].gradients || []; };
  function gradientCss(id) {
    var gr = G.gradients().filter(function (x) { return x.id === id; })[0]; if (!gr) return "";
    var stops = gr.stops.map(function (s) { return s.c + " " + s.p + "%"; }).join(", ");
    return gr.kind === "radial" ? "radial-gradient(circle at center, " + stops + ")" : "linear-gradient(" + gr.angle + "deg, " + stops + ")";
  }
  function toHex(r, g, b) { return "#" + [r, g, b].map(function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }
  function hslToHex(hh, s, l) { s /= 100; l /= 100; var k = function (n) { return (n + hh / 30) % 12; }, a = s * Math.min(l, 1 - l), f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); }; return toHex(Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))); }
  // Accepte #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), hsl(), hsla() (virgules ou espaces) ; renvoie #rrggbb[aa] ou null
  function parseCss(str) {
    var s = String(str || "").trim().toLowerCase(), m;
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(s)) return s;
    if (/^#[0-9a-f]{3}$/.test(s)) return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
    var alphaOf = function (x) { if (x === undefined) return 1; var a = x.slice(-1) === "%" ? parseFloat(x) / 100 : parseFloat(x); return a >= 0 && a <= 1 ? a : null; };
    if ((m = /^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:[\s,\/]+([\d.]+%?))?\s*\)$/.exec(s))) { var r = +m[1], g = +m[2], b = +m[3], a = alphaOf(m[4]); if (r > 255 || g > 255 || b > 255 || a === null) return null; return withAlpha(toHex(r, g, b), a); }
    if ((m = /^hsla?\(\s*(\d{1,3})(?:deg)?[\s,]+(\d{1,3})%[\s,]+(\d{1,3})%(?:[\s,\/]+([\d.]+%?))?\s*\)$/.exec(s))) { var a2 = alphaOf(m[4]); if (+m[1] > 360 || +m[2] > 100 || +m[3] > 100 || a2 === null) return null; return withAlpha(hslToHex(+m[1], +m[2], +m[3]), a2); }
    return null;
  }
  function reg(fn) { registry.push(fn); return fn; }
  function refreshAll() { registry.forEach(function (fn) { try { fn(); } catch (e) { /* écran en cours de remplacement */ } }); }
  var num = function (v) { return v === null || v === undefined || v === "" ? null : Number(v); };
  var fmt = function (n) { return n === null || n === undefined ? "" : String(Math.round(n * 100) / 100); };

  // ---------- Couleurs : palette, références, conversions ----------
  var HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
  function paletteList() {
    var c = V()[IDS.colors];
    if (c.palette.length) return c.palette;
    var p = G.palettes.filter(function (x) { return x.key === c.paletteKey; })[0];
    return p ? p.colors.map(function (hex, i) { return { id: G.paletteIds[i], name: G.slots[i], hex: hex }; }) : [];
  }
  var BASE_COLOR = { accent: "primary", secondary: "secondary", highlight: "accent", complementary: null, link: "primary", linkHover: "primary", headings: "secondary", text: "text", textSecondary: "muted", border: null, divider: null, siteBg: "background", contentBg: "surface" };
  function resolveColor(v) {
    if (!v) return "";
    if (v === "transparent" || HEX.test(v)) return v;
    if (v.indexOf("p:") === 0) { var hit = paletteList().filter(function (c) { return c.id === v.slice(2); })[0]; return hit ? hit.hex : ""; }
    if (v.indexOf("token:") === 0) return (G.base.colors || {})[v.slice(6)] || "";
    if (v.indexOf("g:") === 0) return gradientCss(v.slice(2));
    return "";
  }
  // Couleur visible d'un emplacement : valeur propre, sinon palette choisie, sinon couleur d'origine du thème
  function effectiveColor(field) {
    var c = V()[IDS.colors], own = c[field];
    if (own) return resolveColor(own);
    var f = G.colorFields.filter(function (x) { return x.key === field; })[0];
    if ((c.paletteKey || c.palette.length) && f.ref) { var r = resolveColor(f.ref); if (r) return r; }
    var k = BASE_COLOR[field]; return k ? (G.base.colors || {})[k] : "#d6e2ec";
  }
  function hexParts(v) { var m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(v || ""); return m ? { rgb: "#" + m[1].toLowerCase(), a: m[2] ? parseInt(m[2], 16) / 255 : 1 } : { rgb: "#000000", a: 1 }; }
  function withAlpha(rgb, a) { if (a >= 0.995) return rgb; var n = Math.max(0, Math.min(255, Math.round(a * 255))).toString(16); return rgb + (n.length < 2 ? "0" + n : n); }
  function rgbOf(hex) { var p = hexParts(hex).rgb; return [1, 3, 5].map(function (i) { return parseInt(p.slice(i, i + 2), 16); }); }
  function hslOf(hex) {
    var c = rgbOf(hex).map(function (x) { return x / 255; }), mx = Math.max.apply(null, c), mn = Math.min.apply(null, c), l = (mx + mn) / 2, s = 0, hh = 0, d = mx - mn;
    if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === c[0] ? (c[1] - c[2]) / d + (c[1] < c[2] ? 6 : 0) : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; hh *= 60; }
    return [Math.round(hh), Math.round(s * 100), Math.round(l * 100)];
  }

  // ---------- Changements, annuler / rétablir ----------
  function resetBtn(label, onClick, isSet) {
    var b = h("button", { type: "button", class: "kwg-reset", "aria-label": "Réinitialiser : " + label, title: "Réinitialiser (valeur du thème)", onclick: onClick }, [icon("reset")]);
    reg(function () { var on = isSet(); b.disabled = !on; b.classList.toggle("is-on", on); });
    return b;
  }
  function devIcon(on) { return on ? h("span", { class: "kwg-dev", title: "Réglage propre à l'appareil : " + DEVNAME[A.device()] }, [icon(A.device())]) : null; }
  function group(title, kids, onReset, isSet, extraNode) {
    var t = h("div", { class: "kwg-gtitle" }, [h("span", { text: title })]);
    var acts = h("span", { style: "display:inline-flex;gap:2px" });
    if (extraNode) acts.appendChild(extraNode);
    if (onReset) acts.appendChild(resetBtn(title, onReset, isSet || function () { return true; }));
    t.appendChild(acts);
    return h("section", { class: "kwg-group" }, [t].concat(kids));
  }
  // Curseur + champ numérique : get() → nombre ou null (hérité), put(n | null)
  function slider(o0) {
    var o = Object.assign({}, o0); ["min", "max"].forEach(function (k) { if (typeof o0[k] === "function") Object.defineProperty(o, k, { get: o0[k] }); });
    var id = "kwg-" + Math.random().toString(36).slice(2, 8);
    var range = h("input", { type: "range", min: String(o.min), max: String(o.max), step: String(o.step || 1), "aria-label": o.label });
    var input = h("input", { type: "number", class: "kwg-input", id: id, min: String(o.min), max: String(o.max), step: String(o.step || "any"), placeholder: o.placeholder !== undefined && o.placeholder !== null ? String(o.placeholder) : "", "aria-label": o.label + (o.unit ? " (" + o.unit + ")" : "") });
    var lab = h("div", { class: "kwg-flabel" }, [h("span", { class: "kwg-lt" }, [h("label", { for: id, text: o.label }), devIcon(o.device)]), h("span", { style: "display:inline-flex;align-items:center;gap:4px" }, [o.unit ? h("span", { class: "kwg-unit", text: o.unit }) : null, resetBtn(o.label, function () { o.put(null); }, function () { return o.get() !== null; })])]);
    var err = h("p", { class: "kwg-err", hidden: true });
    function commit(raw) {
      if (raw === "" || raw === null) { o.put(null); return; }
      var n = Number(raw); if (!isFinite(n)) return;
      if (n < o.min || n > o.max) { err.hidden = false; err.textContent = o.label + " : un nombre entre " + o.min + " et " + o.max + " est attendu."; input.classList.add("is-bad"); return; }
      err.hidden = true; input.classList.remove("is-bad"); o.put(n);
    }
    range.addEventListener("input", function () { input.value = range.value; commit(range.value); });
    input.addEventListener("input", function () { if (input.value !== "" && isFinite(Number(input.value)) && Number(input.value) >= o.min && Number(input.value) <= o.max) range.value = input.value; commit(input.value); });
    reg(function () { range.min = String(o.min); range.max = String(o.max); input.min = String(o.min); input.max = String(o.max); var v = o.get(); if (document.activeElement !== input) input.value = fmt(v); range.value = v !== null ? String(v) : (o.placeholder !== undefined && o.placeholder !== null && o.placeholder !== "" ? String(o.placeholder) : String(o.min)); });
    return h("div", { class: "kwg-field" }, [lab, h("div", { class: "kwg-range" }, [range, input]), err]);
  }
  function selectField(o) {
    var id = "kwg-" + Math.random().toString(36).slice(2, 8);
    var sel = h("select", { class: "kwg-select", id: id }, o.options.map(function (x) { return h("option", { value: String(x[0]), text: x[1] }); }));
    sel.addEventListener("change", function () { o.put(sel.value === "" ? (o.nullable ? null : "") : (o.number ? Number(sel.value) : sel.value)); });
    reg(function () { var v = o.get(); sel.value = v === null || v === undefined ? "" : String(v); });
    return h("div", { class: "kwg-field" }, [h("div", { class: "kwg-flabel" }, [h("span", { class: "kwg-lt" }, [h("label", { for: id, text: o.label }), devIcon(o.device)]), resetBtn(o.label, function () { o.put(o.nullable ? null : ""); }, function () { var v = o.get(); return v !== null && v !== "" && v !== undefined; })]), sel]);
  }
  function segmented(o) {
    var box = h("div", { class: "kwg-seg", role: "group", "aria-label": o.label });
    var btns = o.options.map(function (x) { var b = h("button", { type: "button", "data-v": x[0], text: x[1], onclick: function () { o.put(x[0]); } }); box.appendChild(b); return b; });
    reg(function () { var v = o.get(); btns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === v)); }); });
    return box;
  }
  function toggle(o) {
    var id = "kwg-" + Math.random().toString(36).slice(2, 8);
    var b = h("button", { type: "button", class: "kwg-sw-toggle", role: "switch", id: id, "aria-checked": "false", "aria-label": o.label, onclick: function () { o.put(!o.get()); } });
    reg(function () { b.setAttribute("aria-checked", String(!!o.get())); });
    return h("div", { class: "kwg-toggle" }, [h("span", { text: o.label }), b]);
  }

  // Pastille de couleur + fenêtre de choix (palette, code, transparence, valeurs RGB / HSL, copie)
  function colorRow(label, o) {
    // o.fields : [{get, put, hint}] ; une pastille par champ (normal, survol)
    var sws = o.fields.map(function (f, i) {
      var sw = h("button", { type: "button", class: "kwg-sw", "aria-label": label + (o.fields.length > 1 ? (i ? " (survol)" : " (normal)") : ""), "aria-haspopup": "true", onclick: function () { togglePop(i); } }, [h("i")]);
      reg(function () {
        var v = f.get(), c = f.shown(), ref = v && v.indexOf("p:") === 0;
        sw.firstChild.style.background = c || ""; sw.classList.toggle("is-ref", !!ref || !v); sw.firstChild.textContent = ""; // la couleur est sur la couche intérieure : le damier ne se mélange pas à elle
        if (ref || !v) sw.firstChild.appendChild(icon("globe"));
        sw.title = !v ? "Hérité (thème ou palette)" : ref ? "Couleur de la palette" : c;
      });
      return sw;
    });
    var row = h("div", { class: "kwg-colorrow" }, [h("span", null, [label, devIcon(o.device)]), h("span", { class: "kwg-swatches" }, [resetBtn(label, function () { o.fields.forEach(function (f) { f.put(""); }); }, function () { return o.fields.some(function (f) { return !!f.get(); }); })].concat(sws))]);
    var slot = h("div");
    var cur = -1;
    function togglePop(i) {
      var was = cur;
      if (openPop) { openPop.close(); }
      if (was === i) return; // un second clic sur la même pastille referme la fenêtre
      cur = i; sws.forEach(function (s, k) { s.classList.toggle("is-open", k === i); });
      var pop = popover(o.fields[i], label);
      slot.textContent = ""; slot.appendChild(pop);
      openPop = { close: function () { slot.textContent = ""; sws.forEach(function (s) { s.classList.remove("is-open"); }); cur = -1; openPop = null; } };
    }
    return h("div", null, [row, slot]);
  }
  function popover(f, label) {
    var v = f.get(), c = f.shown();
    var parts = hexParts(HEX.test(c) ? c : "#000000");
    var hex = h("input", { type: "text", class: "kwg-input", "aria-label": label + " : code couleur", maxlength: "9", placeholder: "#rrggbb", value: HEX.test(v) ? v : (HEX.test(c) ? c : "") });
    var pick = h("input", { type: "color", "aria-label": label + " : sélecteur", value: parts.rgb, style: "width:44px;height:34px;border:0;padding:0;background:none" });
    var alpha = h("input", { type: "range", min: "0", max: "100", step: "1", value: String(Math.round(parts.a * 100)), "aria-label": label + " : transparence" });
    var read = h("div", { class: "kwg-readout" });
    function readout() { var cc = HEX.test(hex.value) ? hex.value : c; if (!HEX.test(cc)) { read.textContent = ""; return; } var r = rgbOf(cc), hs = hslOf(cc), p = hexParts(cc); read.textContent = ""; [cc, "rgb(" + r.join(", ") + ")", "hsl(" + hs[0] + ", " + hs[1] + "%, " + hs[2] + "%)", "alpha " + Math.round(p.a * 100) + " %"].forEach(function (t) { read.appendChild(h("span", { text: t })); }); }
    function commitHex(val) { f.put(val); }
    hex.addEventListener("input", function () { var x = hex.value.trim().toLowerCase(); if (HEX.test(x)) { hex.classList.remove("is-bad"); var p = hexParts(x); pick.value = p.rgb; alpha.value = String(Math.round(p.a * 100)); commitHex(x); readout(); } else hex.classList.add("is-bad"); });
    pick.addEventListener("input", function () { var val = withAlpha(pick.value, Number(alpha.value) / 100); hex.value = val; hex.classList.remove("is-bad"); commitHex(val); readout(); });
    alpha.addEventListener("input", function () { var val = withAlpha(pick.value, Number(alpha.value) / 100); hex.value = val; commitHex(val); readout(); });
    var dots = h("div", { class: "kwg-dots", role: "group", "aria-label": "Couleurs de la palette" });
    paletteList().forEach(function (p) { dots.appendChild(h("button", { type: "button", class: "kwg-dot" + (v === "p:" + p.id ? " is-sel" : ""), style: "background:" + p.hex, title: p.name + " " + p.hex, "aria-label": "Utiliser la couleur de palette « " + p.name + " »", onclick: function () { f.put("p:" + p.id); if (openPop) openPop.close(); } })); });
    var kids = [];
    var prev = h("div", { class: "kwg-pop-preview", "aria-hidden": "true" }, [h("i")]);
    function paintPrev() { var cc = HEX.test(hex.value) ? hex.value : c; prev.firstChild.style.background = cc || ""; }
    // Saisie libre (HEX, RGB, RGBA, HSL), teinte / saturation / luminosité, collage
    var free = h("input", { type: "text", class: "kwg-input", "aria-label": label + " : saisir HEX, RGB, RGBA ou HSL", placeholder: "#0277b6 · rgb(2 119 182) · hsla(201, 98%, 36%, .8)" });
    var hs0 = hslOf(HEX.test(c) ? c : "#000000");
    var hue = h("input", { type: "range", min: "0", max: "360", step: "1", value: String(hs0[0]), "aria-label": label + " : teinte" });
    var sat = h("input", { type: "range", min: "0", max: "100", step: "1", value: String(hs0[1]), "aria-label": label + " : saturation" });
    var lig = h("input", { type: "range", min: "0", max: "100", step: "1", value: String(hs0[2]), "aria-label": label + " : luminosité" });
    function applyHex(val, skipHsl) { var p = hexParts(val); pick.value = p.rgb; alpha.value = String(Math.round(p.a * 100)); hex.value = val; hex.classList.remove("is-bad"); free.classList.remove("is-bad"); if (!skipHsl) { var q = hslOf(val); hue.value = String(q[0]); sat.value = String(q[1]); lig.value = String(q[2]); } commitHex(val); readout(); paintPrev(); }
    function fromHsl() { applyHex(withAlpha(hslToHex(Number(hue.value), Number(sat.value), Number(lig.value)), Number(alpha.value) / 100), true); }
    [hue, sat, lig].forEach(function (r) { r.addEventListener("input", fromHsl); });
    free.addEventListener("change", function () { var v2 = parseCss(free.value); if (v2) { applyHex(v2); free.value = ""; } else free.classList.add("is-bad"); });
    var gradDots = null;
    if (f.grad && G.gradients && G.gradients().length) {
      gradDots = h("div", { class: "kwg-dots", role: "group", "aria-label": "Dégradés de la palette" });
      G.gradients().forEach(function (gr) { gradDots.appendChild(h("button", { type: "button", class: "kwg-dot" + (v === "g:" + gr.id ? " is-sel" : ""), style: "background:" + gradientCss(gr.id), title: "Dégradé « " + gr.name + " »", "aria-label": "Utiliser le dégradé « " + gr.name + " »", onclick: function () { f.put("g:" + gr.id); if (openPop) openPop.close(); } })); });
    }
    if (paletteList().length) kids.push(h("small", { text: "Palette globale" }), dots);
    if (gradDots) kids.push(h("small", { text: "Dégradés" }), gradDots);
    kids.push(h("small", { text: "Aperçu" }), prev, h("small", { text: "Saisir une valeur" }), free, h("small", { text: "Teinte" }), hue, h("small", { text: "Saturation" }), sat, h("small", { text: "Luminosité" }), lig,
      h("small", { text: "Couleur personnalisée" }), h("div", { class: "kwg-pop-line" }, [pick, hex]), h("small", { text: "Transparence" }), alpha, read,
      h("div", { class: "kwg-pop-line", style: "margin-top:8px;flex-wrap:wrap" }, [
        h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Coller", onclick: function () { if (!navigator.clipboard || !navigator.clipboard.readText) { toast("Collez la valeur dans le champ « Saisir une valeur ».", "error"); return; } navigator.clipboard.readText().then(function (t) { var v2 = parseCss(t); if (v2) applyHex(v2); else toast("Valeur collée non reconnue.", "error"); }, function () { toast("Collez la valeur dans le champ « Saisir une valeur ».", "error"); }); } }),
        h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Transparent", onclick: function () { f.put("transparent"); if (openPop) openPop.close(); } }),
        h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Hériter du thème", onclick: function () { f.put(""); if (openPop) openPop.close(); } }),
        h("button", { type: "button", class: "kwg-btn kwg-mini", "aria-label": "Copier la valeur", onclick: function () { var t = HEX.test(hex.value) ? hex.value : c; if (navigator.clipboard && t) navigator.clipboard.writeText(t).then(function () { toast("Valeur copiée : " + t); }, function () { toast("Copie impossible sur ce navigateur.", "error"); }); } }, [icon("copy", "kwg-i-s"), " Copier"]),
      ]));
    readout(); paintPrev();
    return h("div", { class: "kwg-pop" }, kids);
  }
  var colorField = function (section, key, hover) { // champ de la section « colors » (valeur propre ou héritée)
    return { get: function () { return V()[IDS[section]][key]; }, put: function (v) { edit(section, function (o) { o[key] = v; }); }, shown: function () { return effectiveColor(key); } };
  };

  // Boîte de police repliable : « Famille  16px / 400 ⌄ »
  function fontOptions(inherit) { var o = [["", inherit || "Hérité du thème"]]; G.fonts.forEach(function (f) { o.push([f.id, f.label]); }); return o; }
  function fontLabel(id) { var f = G.fonts.filter(function (x) { return x.id === id; })[0]; return f ? f.label : "Hérité"; }
  var WEIGHTS = [["", "Hérité"]].concat(G.weights.map(function (w) { return [String(w), String(w)]; }));
  // acc : { get(): objet de l'élément ; edit(fn) ; base: {size, weight, lh} ; family: bool ; responsive: bool }
  function fontBox(label, acc, opts) {
    opts = opts || {};
    var meta = h("span", { class: "kwg-fmeta" }), name = h("span", { class: "kwg-fname" });
    var btn = h("button", { type: "button", "aria-expanded": "false", onclick: function () { box.classList.toggle("is-open"); btn.setAttribute("aria-expanded", String(box.classList.contains("is-open"))); } }, [name, meta, icon("chev", "kwg-chev")]);
    var body = h("div", { class: "kwg-fontbody" });
    var box = h("div", { class: "kwg-fontbox" }, [btn, body]);
    function cur() { return acc.get(); }
    function respGet(k) { var o = cur(), t = tmKey(); return t && opts.responsive ? o[t][k] : o[k]; }
    function respPut(k, v) { acc.edit(function (o) { var t = tmKey(); if (t && opts.responsive) o[t][k] = v; else o[k] = v; }); }
    if (opts.family !== false) body.appendChild(selectField({ label: "Police", options: fontOptions(opts.inheritLabel), get: function () { return cur().family || ""; }, put: function (v) { acc.edit(function (o) { o.family = v; }); } }));
    var unitOf = function () { return cur().unit || "px"; };
    if (opts.unitSel !== false) body.appendChild(selectField({ label: "Unité de taille", options: Object.keys(G.sizeUnits).map(function (u) { return [u, u]; }), get: function () { return unitOf(); }, put: function (v) { acc.edit(function (o) { o.unit = v || "px"; o.size = null; if (o.tablet) o.tablet.size = null; if (o.mobile) o.mobile.size = null; }); } }));
    body.appendChild(slider({ label: "Taille", min: function () { return opts.unitSel === false ? (opts.minSize || 8) : G.sizeUnits[unitOf()][0]; }, max: function () { return opts.unitSel === false ? (opts.maxSize || 120) : G.sizeUnits[unitOf()][1]; }, step: 0.1, device: !!opts.responsive, placeholder: unitOf() === "px" ? (opts.base && opts.base.size) : "", get: function () { return respGet("size"); }, put: function (v) { respPut("size", v); } }));
    body.appendChild(selectField({ label: "Graisse", options: WEIGHTS, nullable: true, number: true, get: function () { var w = cur().weight; return w === null ? "" : String(w); }, put: function (v) { acc.edit(function (o) { o.weight = v === null || v === "" ? null : Number(v); }); } }));
    body.appendChild(slider({ label: "Hauteur de ligne", min: 0.8, max: 3, step: 0.05, device: !!opts.responsive, placeholder: opts.base && opts.base.lh, get: function () { return respGet("lh"); }, put: function (v) { respPut("lh", v); } }));
    body.appendChild(slider({ label: "Espacement des lettres", unit: "em", min: -0.2, max: 1, step: 0.01, device: !!opts.responsive, get: function () { return respGet("ls"); }, put: function (v) { respPut("ls", v); } }));
    if (opts.ws !== false) body.appendChild(slider({ label: "Espacement des mots", unit: "em", min: -0.5, max: 2, step: 0.01, get: function () { return cur().ws === undefined ? null : cur().ws; }, put: function (v) { acc.edit(function (o) { o.ws = v; }); } }));
    body.appendChild(selectField({ label: "Casse", options: [["", "Hérité"], ["none", "Normale"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Première Lettre"]], get: function () { return cur().transform || ""; }, put: function (v) { acc.edit(function (o) { o.transform = v; }); } }));
    if (opts.style !== false) body.appendChild(selectField({ label: "Style", options: [["", "Hérité"], ["normal", "Normal"], ["italic", "Italique"]], get: function () { return cur().style || ""; }, put: function (v) { acc.edit(function (o) { o.style = v; }); } }));
    if (opts.deco !== false) body.appendChild(selectField({ label: "Décoration", options: [["", "Hérité"], ["none", "Aucune"], ["underline", "Soulignée"], ["line-through", "Barrée"], ["overline", "Surlignée"]], get: function () { return cur().deco || ""; }, put: function (v) { acc.edit(function (o) { o.deco = v; }); } }));
    if (opts.color) body.appendChild(colorRow("Couleur", { fields: [{ get: function () { return cur().color || ""; }, put: function (v) { acc.edit(function (o) { o.color = v; }); }, shown: function () { return resolveColor(cur().color) || (G.base.colors || {}).text; } }] }));
    reg(function () {
      var o = cur(), fam = o.family || (opts.fallbackFamily ? opts.fallbackFamily() : "");
      name.textContent = fam ? fontLabel(fam) : (opts.inheritLabel || "Hérité");
      name.style.fontFamily = ""; var size = o.size !== null ? o.size : (opts.base && opts.base.size);
      var w = o.weight !== null ? o.weight : (opts.fallbackWeight ? opts.fallbackWeight() : (opts.base && opts.base.weight));
      meta.textContent = ""; meta.appendChild(document.createTextNode((size ? size + (o.unit || "px") : "—"))); meta.appendChild(h("i", { text: "/" })); meta.appendChild(document.createTextNode(w ? String(w) : "hérité"));
    });
    return h("div", { class: "kwg-field" }, [h("div", { class: "kwg-flabel" }, [h("span", { class: "kwg-lt", text: label })]), box]);
  }

  // ---------- Global › Typographie ----------
  function screenTypography() {
    var T = function () { return V()[IDS.typography]; };
    var ed = function (fn) { edit("typography", fn); };
    var kids = [];
    var base = G.base.type || {};
    // Pré-réglages : six combinaisons de polices
    var cards = h("div", { class: "kwg-cards", role: "group", "aria-label": "Pré-réglages typographiques" });
    G.typePresets.forEach(function (p) {
      var stackH = fontStackOf(p.heading), b = h("button", { type: "button", class: "kwg-card", "data-preset": p.id, title: p.label + " : " + fontLabel(p.heading) + " et " + fontLabel(p.body), onclick: function () {
        ed(function (o) { o.preset = p.id; o.bodyFont.family = ""; o.headingFont.family = ""; o.bodyFont.weight = null; o.headingFont.weight = null; });
      } }, [h("span", { class: "kwg-aa", style: "font-family:" + stackH, text: "Aa" }), h("span", { class: "kwg-fam", style: "font-family:" + fontStackOf(p.body), text: p.label })]);
      reg(function () { b.setAttribute("aria-pressed", String(T().preset === p.id)); });
      cards.appendChild(b);
    });
    kids.push(group("Pré-réglages", [cards], function () { ed(function (o) { o.preset = ""; o.bodyFont.family = ""; o.headingFont.family = ""; o.bodyFont.weight = null; o.headingFont.weight = null; }); }, function () { return !!T().preset || !!T().bodyFont.family || !!T().headingFont.family; }));
    var preset = function () { return G.typePresets.filter(function (p) { return p.id === T().preset; })[0] || null; };
    // Police de base
    kids.push(group("Police de base", [
      fontBox("Police du corps de texte", { get: function () { return T().bodyFont; }, edit: function (fn) { ed(function (o) { fn(o.bodyFont); }); } },
        { responsive: true, base: base.body, fallbackFamily: function () { return preset() ? preset().body : ""; }, fallbackWeight: function () { return preset() ? preset().bodyWeight : (base.body && base.body.weight); }, color: false, style: true, deco: true }),
      fontBox("Police des titres", { get: function () { return { family: T().headingFont.family, size: null, weight: T().headingFont.weight, lh: null, ls: null, transform: "", style: "", deco: "", color: "", tablet: { size: null, lh: null, ls: null }, mobile: { size: null, lh: null, ls: null } }; }, edit: function (fn) { ed(function (o) { var tmp = { family: o.headingFont.family, weight: o.headingFont.weight, size: null, lh: null, ls: null, transform: "", style: "", deco: "", color: "", tablet: {}, mobile: {} }; fn(tmp); o.headingFont.family = tmp.family; o.headingFont.weight = tmp.weight; }); } },
        { responsive: false, ws: false, unitSel: false, base: { size: null, weight: base.h1 && base.h1.weight }, fallbackFamily: function () { return preset() ? preset().heading : ""; }, fallbackWeight: function () { return preset() ? preset().headingWeight : (base.h1 && base.h1.weight); }, minSize: 8, style: false, deco: false }),
    ]));
    kids.push(h("p", { class: "kwg-soon", style: "padding:0 16px 12px;font-size:12px" }, ["Les polices sont chargées à la demande : seules les familles utilisées par le site sont envoyées au visiteur. Pour importer vos propres fichiers (WOFF, WOFF2, TTF, OTF) ou gérer la bibliothèque : ", h("a", { href: boot.links.fonts, target: "_blank", rel: "noopener", text: "Apparence → Polices" }), "."]));
    // Titres H1 à H6
    var levels = G.levels.map(function (k) {
      return fontBox("Police " + k.toUpperCase(), { get: function () { return T()[k]; }, edit: function (fn) { ed(function (o) { fn(o[k]); }); } }, { responsive: true, color: true, base: base[k], minSize: 10, maxSize: 160, fallbackFamily: function () { var f = T().headingFont.family || (preset() && preset().heading); return f || ""; } });
    });
    kids.push(group("Police de titre", levels));
    // Autres éléments typographiques : citations, petits textes, légendes, listes, texte secondaire
    kids.push(group("Autres éléments", G.otherTypo.map(function (e) {
      return fontBox(e.label, { get: function () { return T().others[e.key]; }, edit: function (fn) { ed(function (o) { fn(o.others[e.key]); }); } }, { responsive: true, color: true, minSize: 8, maxSize: 160 });
    })));
    // Corps du texte (détails)
    kids.push(group("Texte du corps", [
      slider({ label: "Taille du texte courant", unit: T().bodyFont.unit || "px", min: function () { return G.sizeUnits[T().bodyFont.unit || "px"][0]; }, max: function () { return G.sizeUnits[T().bodyFont.unit || "px"][1]; }, step: 0.1, device: true, placeholder: base.body && base.body.size, get: function () { var t = tmKey(); return t ? T().bodyFont[t].size : T().bodyFont.size; }, put: function (v) { ed(function (o) { var t = tmKey(); if (t) o.bodyFont[t].size = v; else o.bodyFont.size = v; }); } }),
      slider({ label: "Largeur de lecture", unit: "caractères", min: 20, max: 120, step: 1, get: function () { return T().readWidth; }, put: function (v) { ed(function (o) { o.readWidth = v; }); } }),
      colorRow("Couleur du texte", { fields: [{ get: function () { return T().body.color; }, put: function (v) { ed(function (o) { o.body.color = v; }); }, shown: function () { return resolveColor(T().body.color) || effectiveColor("text"); } }] }),
    ]));
    // Liens
    kids.push(group("Liens", [
      selectField({ label: "Police des liens", options: fontOptions("Hérité (police du texte)"), get: function () { return T().link.family; }, put: function (v) { ed(function (o) { o.link.family = v; }); } }),
      colorRow("Couleur", { fields: [{ get: function () { return T().link.color; }, put: function (v) { ed(function (o) { o.link.color = v; }); }, shown: function () { return resolveColor(T().link.color) || effectiveColor("link"); } }, { get: function () { return T().link.hover; }, put: function (v) { ed(function (o) { o.link.hover = v; }); }, shown: function () { return resolveColor(T().link.hover) || effectiveColor("linkHover"); } }] }),
      selectField({ label: "Graisse", options: WEIGHTS, nullable: true, number: true, get: function () { var w = T().link.weight; return w === null ? "" : String(w); }, put: function (v) { ed(function (o) { o.link.weight = v === null || v === "" ? null : Number(v); }); } }),
      selectField({ label: "Soulignement", options: [["", "Hérité"], ["always", "Toujours"], ["hover", "Au survol"], ["none", "Jamais"]], get: function () { return T().link.underline; }, put: function (v) { ed(function (o) { o.link.underline = v; }); } }),
      selectField({ label: "Décoration", options: [["", "Hérité"], ["none", "Aucune"], ["underline", "Soulignée"], ["line-through", "Barrée"]], get: function () { return T().link.deco; }, put: function (v) { ed(function (o) { o.link.deco = v; }); } }),
      slider({ label: "Transition", unit: "ms", min: 0, max: 2000, step: 10, get: function () { return T().link.transition; }, put: function (v) { ed(function (o) { o.link.transition = v; }); } }),
    ]));
    // Marge inférieure des paragraphes + liens soulignés
    var pm = h("div", { class: "kwg-group" });
    pm.appendChild(slider({ label: "Marge inf. de paragraphe", unit: T().paragraphMargin.unit, min: 0, max: 10, step: 0.1, get: function () { return T().paragraphMargin.value; }, put: function (v) { ed(function (o) { o.paragraphMargin.value = v; }); } }));
    pm.appendChild(selectField({ label: "Unité", options: [["em", "em"], ["rem", "rem"], ["px", "px"]], get: function () { return T().paragraphMargin.unit; }, put: function (v) { ed(function (o) { o.paragraphMargin.unit = v || "em"; }); } }));
    pm.appendChild(toggle({ label: "Souligner les liens du contenu", get: function () { return T().underlineLinks; }, put: function (v) { ed(function (o) { o.underlineLinks = v; }); } }));
    kids.push(pm);
    return kids;
  }
  function fontStackOf(id) { return id === "system" ? "system-ui, sans-serif" : id === "georgia" ? "Georgia, serif" : "'" + fontLabel(id) + "', system-ui, sans-serif"; }

  // ---------- Global › Couleurs ----------
  function screenColors() {
    var C = function () { return V()[IDS.colors]; };
    var ed = function (fn) { edit("colors", fn); };
    var kids = [];
    var editing = false;
    // Palette globale
    var pals = h("div", { class: "kwg-palettes", role: "group", "aria-label": "Palettes prédéfinies" });
    G.palettes.forEach(function (p) {
      var strip = h("div", { class: "kwg-strip" }, p.colors.slice(0, 4).map(function (c) { return h("span", { style: "background:" + c }); }));
      var b = h("button", { type: "button", class: "kwg-pal", "data-palette": p.key, onclick: function () { ed(function (o) { o.paletteKey = p.key; o.palette = p.colors.map(function (hex, i) { return { id: G.paletteIds[i], name: G.slots[i], hex: hex }; }); G.colorFields.forEach(function (f) { o[f.key] = ""; }); }); } }, [strip, h("b", { text: p.label })]);
      reg(function () { b.setAttribute("aria-pressed", String(C().paletteKey === p.key)); });
      pals.appendChild(b);
    });
    var dotsBox = h("div"), note = h("p", { class: "kwg-soon", style: "padding:0 0 8px;font-size:12px" });
    var editSlot = h("div");
    var pencil = h("button", { type: "button", class: "kwg-reset kwg-pencil", "aria-label": "Modifier la palette", title: "Modifier la palette (ajouter, renommer, supprimer)", "aria-pressed": "false", onclick: function () { editing = !editing; pencil.classList.toggle("is-on", editing); pencil.setAttribute("aria-pressed", String(editing)); drawDots(); } }, [icon("pencil")]);
    var selected = null;
    function drawDots() {
      dotsBox.textContent = ""; editSlot.textContent = "";
      var list = paletteList();
      note.hidden = !!list.length; note.textContent = list.length ? "" : "Aucune palette appliquée : le site garde les couleurs de son thème. Choisissez une palette ci-dessus ou ajoutez des couleurs.";
      var dots = h("div", { class: "kwg-dots", role: "group", "aria-label": "Couleurs de la palette" });
      list.forEach(function (p) {
        dots.appendChild(h("button", { type: "button", class: "kwg-dot" + (selected === p.id ? " is-sel" : ""), style: "background:" + p.hex, title: p.name + " " + p.hex, "aria-label": "Couleur « " + p.name + " » " + p.hex, onclick: function () { if (!editing) { copyToast(p); return; } selected = selected === p.id ? null : p.id; drawDots(); } }));
      });
      if (editing || !list.length) dots.appendChild(h("button", { type: "button", class: "kwg-dot kwg-dot-add", "aria-label": "Ajouter une couleur", title: "Ajouter une couleur", onclick: addColor }, [icon("plus", "kwg-i-s")]));
      dotsBox.appendChild(dots);
      if (editing && selected) { var p = list.filter(function (x) { return x.id === selected; })[0]; if (p) editSlot.appendChild(paletteEditor(p)); else selected = null; }
    }
    function copyToast(p) { if (navigator.clipboard) navigator.clipboard.writeText(p.hex).then(function () { toast("« " + p.name + " » copiée : " + p.hex); }, function () { /* copie refusée */ }); }
    function addColor() {
      if (paletteList().length >= 24) { toast("24 couleurs au plus.", "error"); return; }
      var id = "p" + Math.random().toString(36).slice(2, 7), n = paletteList().length + 1;
      ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; o.palette.push({ id: id, name: "Couleur " + n, hex: "#3b82f6" }); });
      editing = true; pencil.classList.add("is-on"); selected = id; drawDots();
    }
    function paletteEditor(p) {
      var name = h("input", { type: "text", class: "kwg-input", maxlength: "30", value: p.name, "aria-label": "Nom de la couleur" });
      var hex = h("input", { type: "text", class: "kwg-input", maxlength: "9", value: p.hex, "aria-label": "Code de la couleur" });
      var pick = h("input", { type: "color", value: hexParts(p.hex).rgb, "aria-label": "Sélecteur de couleur", style: "width:44px;height:34px;border:0;padding:0;background:none" });
      var alpha = h("input", { type: "range", min: "0", max: "100", value: String(Math.round(hexParts(p.hex).a * 100)), "aria-label": "Transparence" });
      function upd(fn) { ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; var t = o.palette.filter(function (x) { return x.id === p.id; })[0]; if (t) fn(t); }); }
      name.addEventListener("input", function () { upd(function (t) { t.name = name.value; }); });
      hex.addEventListener("input", function () { var x = hex.value.trim().toLowerCase(); if (HEX.test(x)) { hex.classList.remove("is-bad"); pick.value = hexParts(x).rgb; alpha.value = String(Math.round(hexParts(x).a * 100)); upd(function (t) { t.hex = x; }); redrawDot(p.id, x); } else hex.classList.add("is-bad"); });
      pick.addEventListener("input", function () { var v = withAlpha(pick.value, Number(alpha.value) / 100); hex.value = v; upd(function (t) { t.hex = v; }); redrawDot(p.id, v); });
      alpha.addEventListener("input", function () { var v = withAlpha(pick.value, Number(alpha.value) / 100); hex.value = v; upd(function (t) { t.hex = v; }); redrawDot(p.id, v); });
      var read = h("div", { class: "kwg-readout" }); [p.hex, "rgb(" + rgbOf(p.hex).join(", ") + ")", "hsl(" + hslOf(p.hex).join(", ") + ")"].forEach(function (t, i) { read.appendChild(h("span", { text: i === 2 ? "hsl(" + hslOf(p.hex)[0] + ", " + hslOf(p.hex)[1] + "%, " + hslOf(p.hex)[2] + "%)" : t })); });
      return h("div", { class: "kwg-pop" }, [h("small", { text: "Nom" }), name, h("div", { style: "height:8px" }), h("small", { text: "Couleur" }), h("div", { class: "kwg-pop-line" }, [pick, hex]), h("small", { text: "Transparence" }), alpha, read,
        h("div", { class: "kwg-pop-line", style: "margin-top:8px" }, [
          h("button", { type: "button", class: "kwg-btn kwg-mini", onclick: function () { copyToast(p); } }, [icon("copy", "kwg-i-s"), " Copier"]),
          h("button", { type: "button", class: "kwg-btn kwg-mini", onclick: function () { ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; var i = o.palette.findIndex(function (x) { return x.id === p.id; }); if (i > 0) { var t = o.palette[i]; o.palette[i] = o.palette[i - 1]; o.palette[i - 1] = t; } }); drawDots(); } }, ["◀ Avancer"]),
          h("button", { type: "button", class: "kwg-btn kwg-mini", onclick: function () { ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; var i = o.palette.findIndex(function (x) { return x.id === p.id; }); if (i >= 0 && i < o.palette.length - 1) { var t = o.palette[i]; o.palette[i] = o.palette[i + 1]; o.palette[i + 1] = t; } }); drawDots(); } }, ["Reculer ▶"]),
          h("button", { type: "button", class: "kwg-btn kwg-mini", "aria-label": "Dupliquer la couleur", onclick: function () { if (paletteList().length >= 24) { toast("24 couleurs au plus.", "error"); return; } var nid = "p" + Math.random().toString(36).slice(2, 7); ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; var i = o.palette.findIndex(function (x) { return x.id === p.id; }); if (i >= 0) { var src = o.palette[i]; o.palette.splice(i + 1, 0, { id: nid, name: (src.name + " (copie)").slice(0, 30), hex: src.hex }); } }); selected = nid; drawDots(); } }, [h("span", { text: "Dupliquer" })]),
          h("button", { type: "button", class: "kwg-btn kwg-mini", "aria-label": "Supprimer la couleur", onclick: function () { ed(function (o) { if (!o.palette.length) o.palette = paletteList().map(function (c) { return { id: c.id, name: c.name, hex: c.hex }; }); o.paletteKey = "custom"; o.palette = o.palette.filter(function (x) { return x.id !== p.id; }); G.colorFields.forEach(function (f) { if (o[f.key] === "p:" + p.id) o[f.key] = ""; }); }); selected = null; drawDots(); } }, [icon("trash", "kwg-i-s"), " Supprimer"]),
        ])]);
    }
    function redrawDot() {} // les pastilles suivent la saisie via le rafraîchissement commun
    kids.push(group("Palette globale", [pals, dotsBox, note, editSlot], function () { ed(function (o) { o.paletteKey = ""; o.palette = []; G.colorFields.forEach(function (f) { o[f.key] = ""; }); }); selected = null; editing = false; pencil.classList.remove("is-on"); }, function () { return !!C().paletteKey || C().palette.length > 0; }, pencil));
    // Après chaque changement : les pastilles sont redessinées, SAUF si l'on est en train de saisir dans l'éditeur d'une couleur (le curseur ne doit jamais être perdu) : alors seules les pastilles sont recolorées sur place
    var lastSig = null;
    reg(function () {
      var sig = JSON.stringify(paletteList());
      if (sig === lastSig) return;
      lastSig = sig;
      if (editSlot.contains(document.activeElement) && document.activeElement.tagName === "INPUT") {
        var dots = [].slice.call(dotsBox.querySelectorAll(".kwg-dot:not(.kwg-dot-add)")), list = paletteList();
        dots.forEach(function (d, i) { if (list[i]) { d.style.background = list[i].hex; d.title = list[i].name + " " + list[i].hex; d.setAttribute("aria-label", "Couleur « " + list[i].name + " » " + list[i].hex); } });
        return;
      }
      drawDots();
    });
    // Couleurs du thème
    var themeKeys = ["accent", "secondary", "highlight", "complementary", "link", "headings", "text", "textSecondary", "border", "divider"];
    var rowsTheme = [
      colorRow("Couleur principale", { fields: [colorField("colors", "accent")] }),
      colorRow("Couleur secondaire", { fields: [colorField("colors", "secondary")] }),
      colorRow("Accentuation", { fields: [colorField("colors", "highlight")] }),
      colorRow("Couleur complémentaire", { fields: [colorField("colors", "complementary")] }),
      colorRow("Liens (normal, survol)", { fields: [colorField("colors", "link"), colorField("colors", "linkHover")] }),
      colorRow("Titres (H1-H6)", { fields: [colorField("colors", "headings")] }),
      colorRow("Texte principal", { fields: [colorField("colors", "text")] }),
      colorRow("Texte secondaire", { fields: [colorField("colors", "textSecondary")] }),
      colorRow("Bordures", { fields: [colorField("colors", "border")] }),
      colorRow("Séparateurs", { fields: [colorField("colors", "divider")] }),
    ];
    kids.push(group("Couleurs du thème", rowsTheme, function () { ed(function (o) { themeKeys.concat(["linkHover"]).forEach(function (k) { o[k] = ""; }); }); }, function () { return themeKeys.concat(["linkHover"]).some(function (k) { return !!C()[k]; }); }));
    // Couleurs de surface
    kids.push(group("Couleurs de surface", [
      colorRow("Fond du site", { fields: [colorField("colors", "siteBg")] }),
      colorRow("Fond secondaire (contenu)", { fields: [colorField("colors", "contentBg")] }),
    ], function () { ed(function (o) { o.siteBg = ""; o.contentBg = ""; o.siteBgGradient = ""; }); }, function () { return !!C().siteBg || !!C().contentBg || !!C().siteBgGradient; }));
    // Dégradés
    kids.push(gradientsGroup(C, ed));
    // Couleurs des états
    var stateField = function (key) { return { get: function () { return C().states[key]; }, put: function (v) { ed(function (o) { o.states[key] = v; }); }, shown: function () { return resolveColor(C().states[key]); } }; };
    kids.push(group("États interactifs", [
      h("p", { class: "kwg-soon", style: "padding:0 0 8px;font-size:12px", text: "Normal : couleurs ci-dessus. Survol des liens : ligne « Liens ». Survol, clic et désactivé des boutons : écran Boutons." }),
      colorRow("Contour du focus clavier", { fields: [stateField("focus")] }),
      colorRow("Éléments désactivés", { fields: [stateField("disabled")] }),
    ], function () { ed(function (o) { o.states.focus = ""; o.states.disabled = ""; }); }, function () { return !!C().states.focus || !!C().states.disabled; }));
    if (warnings.length) kids.push(h("div", { class: "kwg-soon", role: "status" }, [h("strong", { text: "Lisibilité" })].concat(warnings.map(function (w) { return h("span", { style: "display:block", text: w }); }))));
    return kids;
  }

  // ---------- Global › Conteneur ----------
  function perDev(section, key) { // { d, t, m } d'une section : lecture / écriture de l'appareil courant
    return { get: function () { return V()[IDS[section]][key][devKey()]; }, put: function (v) { edit(section, function (o) { o[key][devKey()] = v; }); } };
  }
  function screenContainer() {
    var C = function () { return V()[IDS.container]; };
    var ed = function (fn) { edit("container", fn); };
    var kids = [];
    var layouts = h("div", { class: "kwg-layouts", role: "group", "aria-label": "Mise en page du conteneur" });
    [["full", "Pleine largeur"], ["boxed", "Encadré"], ["narrow", "Encadré étroit"]].forEach(function (l) {
      var pg = h("span", { class: "pg" }, [h("i", { class: "img" }), h("i", { class: "ln" }), h("i", { class: "ln" }), h("i", { class: "ln", style: "width:70%" })]);
      var b = h("button", { type: "button", class: "kwg-layout l-" + l[0], "data-layout": l[0], title: l[1], "aria-label": l[1], onclick: function () { ed(function (o) { o.layout = l[0]; }); } }, [pg]);
      reg(function () { b.setAttribute("aria-pressed", String(C().layout === l[0])); });
      layouts.appendChild(b);
    });
    kids.push(group("Mise en page du conteneur", [layouts], function () { ed(function (o) { o.layout = ""; }); }, function () { return !!C().layout; }));
    var style = segmented({ label: "Style de conteneur", options: [["open", "Ouvert"], ["boxed", "Encadré - Tout"]], get: function () { return C().style; }, put: function (v) { ed(function (o) { o.style = o.style === v ? "" : v; }); } });
    var w = h("div", { class: "kwg-group" }, [h("div", { class: "kwg-gtitle" }, [h("span", { text: "Style de conteneur" }), resetBtn("Style de conteneur", function () { ed(function (o) { o.style = ""; }); }, function () { return !!C().style; })]), style]);
    kids.push(w);
    var baseSizes = G.base.sizes || {};
    var sizes = [];
    sizes.push(slider({ label: "Largeur de conteneur", unit: "px", min: 320, max: 2400, step: 10, device: true, placeholder: baseSizes.content, get: perDev("container", "width").get, put: perDev("container", "width").put }));
    sizes.push(slider({ label: "Largeur du conteneur étroit", unit: "px", min: 280, max: 1600, step: 10, device: true, placeholder: baseSizes.narrow, get: perDev("container", "narrow").get, put: perDev("container", "narrow").put }));
    sizes.push(slider({ label: "Largeur du conteneur large", unit: "px", min: 600, max: 3000, step: 10, device: true, get: perDev("container", "wide").get, put: perDev("container", "wide").put }));
    sizes.push(slider({ label: "Largeur maximale du site", unit: "px", min: 320, max: 3000, step: 10, device: true, get: perDev("container", "maxWidth").get, put: perDev("container", "maxWidth").put }));
    var quick = h("div", { class: "kwg-seg", role: "group", "aria-label": "Largeurs de départ" });
    [["Étroit", 720], ["Standard", 1140], ["Large", 1320], ["Très large", 1600]].forEach(function (q) { quick.appendChild(h("button", { type: "button", text: q[0], title: q[1] + " px", onclick: function () { ed(function (o) { o.layout = o.layout === "full" ? "" : o.layout; o.width[devKey()] = q[1]; }); } })); });
    quick.appendChild(h("button", { type: "button", text: "Pleine", title: "Pleine largeur", onclick: function () { ed(function (o) { o.layout = "full"; }); } }));
    kids.push(h("section", { class: "kwg-group" }, [h("div", { class: "kwg-gtitle" }, [h("span", { text: "Largeurs de départ (modifiables ensuite)" })]), quick].concat(sizes)));
    kids.push(group("Comportement", [
      selectField({ label: "Alignement du conteneur", options: [["", "Hérité"], ["center", "Centré"], ["left", "À gauche"]], get: function () { return C().align; }, put: function (v) { ed(function (o) { o.align = v; }); } }),
      selectField({ label: "Débordement du contenu", options: [["", "Hérité"], ["visible", "Visible"], ["hidden", "Masqué"], ["clip", "Coupé"]], get: function () { return C().overflow; }, put: function (v) { ed(function (o) { o.overflow = v; }); } }),
    ], function () { ed(function (o) { o.align = ""; o.overflow = ""; }); }, function () { return !!C().align || !!C().overflow; }));
    kids.push(group("Espacements et marges", [
      slider({ label: "Marge interne horizontale", unit: "px", min: 0, max: 200, step: 1, device: true, get: perDev("container", "padX").get, put: perDev("container", "padX").put }),
      slider({ label: "Marge interne verticale", unit: "px", min: 0, max: 300, step: 1, device: true, get: perDev("container", "padY").get, put: perDev("container", "padY").put }),
      slider({ label: "Marges du contenu", unit: "px", min: 0, max: 300, step: 1, device: true, get: perDev("container", "margin").get, put: perDev("container", "margin").put }),
      slider({ label: "Espacement des sections", unit: "px", min: 0, max: 300, step: 1, device: true, get: perDev("container", "sectionGap").get, put: perDev("container", "sectionGap").put }),
    ]));
    return kids;
  }

  // ---------- Global › Boutons ----------
  var btnTab = "primary";
  function sidesField(label, getS, edS, opts) {
    // getS() → { linked, unit, d:{t,r,b,l}, t:{...}, m:{...} } ; edS(fn) modifie l'objet
    var inputs = ["t", "r", "b", "l"].map(function (k) {
      var inp = h("input", { type: "number", min: String(opts.min), max: String(opts.max), step: "any", inputmode: "decimal", "aria-label": label + " : " + { t: "en haut", r: "à droite", b: "en bas", l: "à gauche" }[k], placeholder: opts.placeholder !== undefined ? String(opts.placeholder) : "" });
      inp.addEventListener("input", function () {
        var raw = inp.value, v = raw === "" ? null : Number(raw); if (v !== null && (!isFinite(v) || v < opts.min || v > opts.max)) return;
        edS(function (s) { if (s.linked) { ["t", "r", "b", "l"].forEach(function (x) { s[devKey()][x] = v; }); } else s[devKey()][k] = v; });
      });
      return inp;
    });
    var link = h("button", { type: "button", "aria-label": "Lier ou délier les quatre côtés", title: "Lier / délier les quatre côtés", "aria-pressed": "true", onclick: function () { edS(function (s) { s.linked = !s.linked; }); } }, [icon("link")]);
    var unit = h("select", { class: "kwg-unit", "aria-label": label + " : unité", style: "border:0;background:none" }, [["px", "px"], ["em", "em"], ["rem", "rem"]].map(function (u) { return h("option", { value: u[0], text: u[1] }); }));
    unit.addEventListener("change", function () { edS(function (s) { s.unit = unit.value; }); });
    var cap = h("div", { class: "kwg-sides-cap" }, ["EN HAUT", "À DROITE", "EN BAS", "À GAUCHE"].map(function (t) { return h("span", { text: t }); }).concat([h("span")]));
    reg(function () { var s = getS(); inputs.forEach(function (inp, i) { var v = s[devKey()][["t", "r", "b", "l"][i]]; if (document.activeElement !== inp) inp.value = fmt(v); }); link.setAttribute("aria-pressed", String(!!s.linked)); link.replaceChild(icon(s.linked ? "link" : "unlink"), link.firstChild); unit.value = s.unit; });
    var set_ = function () { var s = getS(); return ["d", "t", "m"].some(function (d) { return ["t", "r", "b", "l"].some(function (k) { return s[d][k] !== null; }); }); };
    var clear = function () { edS(function (s) { ["d", "t", "m"].forEach(function (d) { ["t", "r", "b", "l"].forEach(function (k) { s[d][k] = null; }); }); }); };
    return h("div", { class: "kwg-field" }, [h("div", { class: "kwg-flabel" }, [h("span", { class: "kwg-lt" }, [label, devIcon(true)]), h("span", { style: "display:inline-flex;align-items:center;gap:4px" }, [unit, resetBtn(label, clear, set_)])]), h("div", { class: "kwg-sides" }, inputs.concat([link])), cap]);
  }
  function screenButtons() {
    var B = function () { return V()[IDS.buttons][btnTab]; };
    var ed = function (fn) { edit("buttons", function (o) { fn(o[btnTab]); }); };
    var kids = [];
    var tabs = h("div", { class: "kwg-tabs", role: "tablist" });
    [["primary", "PRIMARY"], ["secondary", "SECONDARY"]].forEach(function (t) { tabs.appendChild(h("button", { type: "button", role: "tab", "data-tab": t[0], "aria-selected": String(btnTab === t[0]), text: t[1], onclick: function () { btnTab = t[0]; renderCurrent(false); } })); });
    kids.push(tabs);
    // Pré-réglages
    var pres = h("div", { class: "kwg-presets", role: "group", "aria-label": "Pré-réglages de boutons" });
    G.buttonPresets.forEach(function (p) {
      var r = p.radius === 999 ? "999px" : p.radius + "px";
      var b = h("button", { type: "button", class: "kwg-preset" + (p.outline ? " is-outline" : ""), "data-preset": p.id, style: "border-radius:" + r, title: p.label, text: "Button", onclick: function () { applyPreset(p); } });
      reg(function () { b.setAttribute("aria-pressed", String(B().preset === p.id)); });
      pres.appendChild(b);
    });
    function applyPreset(p) {
      ed(function (b) {
        b.preset = p.id;
        var four = function (s, v) { s.linked = true; ["d"].forEach(function (d) { ["t", "r", "b", "l"].forEach(function (k) { s[d][k] = v; }); }); };
        four(b.radius, p.radius); four(b.borderWidth, p.outline ? 2 : 0);
        b.borderStyle = p.outline ? "solid" : "none";
        if (p.outline) { b.normal.bg = "transparent"; b.normal.color = "token:primary"; b.normal.border = "token:primary"; b.hover.bg = "token:primary"; b.hover.color = "#ffffff"; b.hover.border = "token:primary"; }
        else { b.normal.bg = "token:primary"; b.normal.color = "#ffffff"; b.normal.border = "token:primary"; b.hover.bg = "token:secondary"; b.hover.color = "#ffffff"; b.hover.border = "token:secondary"; }
      });
    }
    var resetAll = function () { ed(function (b) { var d = emptyButton(); Object.keys(d).forEach(function (k) { b[k] = d[k]; }); }); };
    kids.push(group("Pré-réglages de boutons", [pres], resetAll, function () { return !same(B(), emptyButton()); }));
    // Couleurs et états
    var st = function (state, key) { return { get: function () { return B()[state][key]; }, put: function (v) { ed(function (b) { b[state][key] = v; }); }, shown: function () { return resolveColor(B()[state][key]) || ""; } }; };
    var colorRows = [colorRow("Couleur du texte", { fields: [st("normal", "color"), st("hover", "color")] }), colorRow("Couleur d'arrière-plan", { fields: [st("normal", "bg"), st("hover", "bg")] }), colorRow("Couleur de bordure", { fields: [st("normal", "border"), st("hover", "border")] })];
    var more = h("details", { class: "kwg-more" }, [h("summary", { text: "États focus et clic" }), h("div", null, [colorRow("Focus : texte", { fields: [st("focus", "color")] }), colorRow("Focus : fond", { fields: [st("focus", "bg")] }), colorRow("Focus : contour", { fields: [st("focus", "border")] }),
      colorRow("Clic : texte", { fields: [st("active", "color")] }), colorRow("Clic : fond", { fields: [st("active", "bg")] }), colorRow("Clic : bordure", { fields: [st("active", "border")] }),
      colorRow("Désactivé : texte", { fields: [st("disabled", "color")] }), colorRow("Désactivé : fond", { fields: [st("disabled", "bg")] }), colorRow("Désactivé : bordure", { fields: [st("disabled", "border")] })])]);
    kids.push(buttonPreview(B, btnTab));
    kids.push(h("section", { class: "kwg-group" }, colorRows.concat([more])));
    // Police
    var fb = (G.base.buttons || {});
    kids.push(h("section", { class: "kwg-group" }, [fontBox("Police", { get: function () { return B().font; }, edit: function (fn) { ed(function (b) { fn(b.font); }); } }, { responsive: false, family: true, style: false, deco: false, base: { size: null, weight: 500, lh: null }, minSize: 8, maxSize: 60 })]));
    // Dimensions
    kids.push(h("section", { class: "kwg-group" }, [
      sidesField("Marge interne", function () { return B().padding; }, function (fn) { ed(function (b) { fn(b.padding); }); }, { min: 0, max: 120, placeholder: "" }),
      sidesField("Largeur de bordure", function () { return B().borderWidth; }, function (fn) { ed(function (b) { fn(b.borderWidth); }); }, { min: 0, max: 20 }),
      sidesField("Rayon de bordure", function () { return B().radius; }, function (fn) { ed(function (b) { fn(b.radius); }); }, { min: 0, max: 999 }),
    ]));
    // Autres propriétés
    var sh = function (k) { return { get: function () { return B().shadowCustom[k]; }, put: function (v) { ed(function (b) { b.shadowCustom[k] = v; }); } }; };
    var shadow = [
      toggle({ label: "Ombre personnalisée", get: function () { return B().shadowCustom.on; }, put: function (v) { ed(function (b) { b.shadowCustom.on = v; }); } }),
      slider({ label: "Décalage horizontal", unit: "px", min: -50, max: 50, step: 1, get: sh("x").get, put: sh("x").put }),
      slider({ label: "Décalage vertical", unit: "px", min: -50, max: 50, step: 1, get: sh("y").get, put: sh("y").put }),
      slider({ label: "Flou", unit: "px", min: 0, max: 100, step: 1, get: sh("blur").get, put: sh("blur").put }),
      slider({ label: "Diffusion", unit: "px", min: -50, max: 50, step: 1, get: sh("spread").get, put: sh("spread").put }),
      colorRow("Couleur de l'ombre", { fields: [{ get: function () { return B().shadowCustom.color; }, put: function (v) { ed(function (b) { b.shadowCustom.color = v; }); }, shown: function () { return resolveColor(B().shadowCustom.color); } }] }),
      slider({ label: "Transparence de l'ombre", min: 0, max: 1, step: 0.05, get: sh("opacity").get, put: sh("opacity").put }),
    ];
    var effects = [
      slider({ label: "Élévation au survol", unit: "px", min: 0, max: 12, step: 1, get: function () { return B().hoverLift; }, put: function (v) { ed(function (b) { b.hoverLift = v; }); } }),
      slider({ label: "Échelle au survol", min: 0.9, max: 1.15, step: 0.01, get: function () { return B().hoverScale; }, put: function (v) { ed(function (b) { b.hoverScale = v; }); } }),
      slider({ label: "Durée de la transition", unit: "ms", min: 0, max: 2000, step: 10, get: function () { return B().transition; }, put: function (v) { ed(function (b) { b.transition = v; }); } }),
    ];
    kids.push(group("Ombre", shadow, function () { ed(function (b) { var d = emptyButton(); b.shadowCustom = d.shadowCustom; b.shadow = ""; }); }, function () { return B().shadowCustom.on || !!B().shadow; }));
    kids.push(group("Effets au survol", effects, function () { ed(function (b) { b.hoverLift = null; b.hoverScale = null; b.transition = null; }); }, function () { return B().hoverLift !== null || B().hoverScale !== null || B().transition !== null; }));
    var oth = [
      selectField({ label: "Style de bordure", options: [["", "Hérité"], ["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Points"], ["double", "Double"]], get: function () { return B().borderStyle; }, put: function (v) { ed(function (b) { b.borderStyle = v; }); } }),
      selectField({ label: "Ombre", options: [["", "Héritée"], ["none", "Aucune"], ["sm", "Légère"], ["md", "Moyenne"], ["lg", "Forte"]], get: function () { return B().shadow; }, put: function (v) { ed(function (b) { b.shadow = v; }); } }),
      slider({ label: "Opacité", min: 0, max: 1, step: 0.05, get: function () { return B().opacity; }, put: function (v) { ed(function (b) { b.opacity = v; }); } }),
      slider({ label: "Espace entre l'icône et le texte", unit: "px", min: 0, max: 40, step: 1, get: function () { return B().iconGap; }, put: function (v) { ed(function (b) { b.iconGap = v; }); } }),
      selectField({ label: "Alignement du texte", options: [["", "Hérité"], ["left", "Gauche"], ["center", "Centré"], ["right", "Droite"]], get: function () { return B().align; }, put: function (v) { ed(function (b) { b.align = v; }); } }),
      slider({ label: "Largeur", unit: "px", min: 0, max: 1200, step: 5, device: true, get: function () { return B().width[devKey()]; }, put: function (v) { ed(function (b) { b.width[devKey()] = v; }); } }),
      slider({ label: "Largeur minimale", unit: "px", min: 0, max: 600, step: 5, device: true, get: function () { return B().minWidth[devKey()]; }, put: function (v) { ed(function (b) { b.minWidth[devKey()] = v; }); } }),
      slider({ label: "Largeur maximale", unit: "px", min: 0, max: 1200, step: 5, device: true, get: function () { return B().maxWidth[devKey()]; }, put: function (v) { ed(function (b) { b.maxWidth[devKey()] = v; }); } }),
      slider({ label: "Hauteur minimale", unit: "px", min: 0, max: 300, step: 1, device: true, get: function () { return B().minHeight[devKey()]; }, put: function (v) { ed(function (b) { b.minHeight[devKey()] = v; }); } }),
      toggle({ label: "Pleine largeur", get: function () { return B().fullWidth; }, put: function (v) { ed(function (b) { b.fullWidth = v; }); } }),
    ];
    kids.push(h("section", { class: "kwg-group" }, [h("div", { class: "kwg-gtitle" }, [h("span", { text: "Autres réglages" })])].concat(oth)));
    void fb;
    return kids;
  }
  function emptyButton() { return clone(G.defaults.buttons.primary); }
  // ---------- Dégradés ----------
  function gradientsGroup(C, ed) {
    var box = h("div"), selected = null, lastSig = null;
    var rand = function () { return Math.random().toString(36).slice(2, 7); };
    function upd(id, fn) { ed(function (o) { var t = o.gradients.filter(function (x) { return x.id === id; })[0]; if (t) fn(t); }); }
    function cur(id) { return C().gradients.filter(function (x) { return x.id === id; })[0] || null; }
    function add() {
      if (C().gradients.length >= 12) { toast("12 dégradés au plus.", "error"); return; }
      var id = "g" + rand(), n = C().gradients.length + 1;
      ed(function (o) { o.gradients.push({ id: id, name: "Dégradé " + n, kind: "linear", angle: 90, stops: [{ c: "#0b2a40", p: 0 }, { c: "#0277b6", p: 100 }] }); });
      selected = id; draw();
    }
    function editor(gr0) {
      var id = gr0.id, g = function () { return cur(id) || gr0; };
      var name = h("input", { type: "text", class: "kwg-input", maxlength: "30", value: g().name, "aria-label": "Nom du dégradé" });
      name.addEventListener("input", function () { upd(id, function (t) { t.name = name.value; }); });
      var kind = h("div", { class: "kwg-seg", role: "group", "aria-label": "Type de dégradé" }, [["linear", "Linéaire"], ["radial", "Radial"]].map(function (k) { return h("button", { type: "button", "data-v": k[0], text: k[1], onclick: function () { upd(id, function (t) { t.kind = k[0]; }); } }); }));
      var syncKind = function () { [].forEach.call(kind.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-v") === g().kind)); }); }; reg(syncKind); syncKind();
      var angle = slider({ label: "Angle", unit: "°", min: 0, max: 360, step: 1, get: function () { return g().angle; }, put: function (v) { upd(id, function (t) { t.angle = v === null ? 90 : v; }); } });
      var stopsBox = h("div", { class: "kwg-stops" });
      g().stops.forEach(function (st, i) {
        var pick = h("input", { type: "color", value: hexParts(st.c).rgb, "aria-label": "Couleur du point " + (i + 1), style: "width:40px;height:32px;border:0;padding:0;background:none" });
        var hx = h("input", { type: "text", class: "kwg-input", maxlength: "9", value: st.c, "aria-label": "Code du point " + (i + 1) });
        var pos = h("input", { type: "number", class: "kwg-input", min: "0", max: "100", step: "1", value: String(st.p), "aria-label": "Position du point " + (i + 1) + " (%)", style: "width:70px" });
        pick.addEventListener("input", function () { var v = withAlpha(pick.value, hexParts(hx.value).a); hx.value = v; upd(id, function (t) { t.stops[i].c = v; }); });
        hx.addEventListener("input", function () { var v = parseCss(hx.value); if (v) { hx.classList.remove("is-bad"); pick.value = hexParts(v).rgb; upd(id, function (t) { t.stops[i].c = v; }); } else hx.classList.add("is-bad"); });
        pos.addEventListener("input", function () { var n = Number(pos.value); if (pos.value !== "" && n >= 0 && n <= 100) upd(id, function (t) { t.stops[i].p = n; }); });
        var del = h("button", { type: "button", class: "kwg-reset", "aria-label": "Supprimer le point " + (i + 1), disabled: g().stops.length <= 2, onclick: function () { upd(id, function (t) { t.stops.splice(i, 1); }); draw(); } }, [icon("x")]);
        stopsBox.appendChild(h("div", { class: "kwg-stop" }, [pick, hx, pos, del]));
      });
      var addStop = h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Ajouter un point de couleur", disabled: g().stops.length >= 6, onclick: function () { upd(id, function (t) { t.stops.push({ c: "#ffffff", p: 100 }); }); draw(); } });
      var asBg = h("button", { type: "button", class: "kwg-btn kwg-mini", onclick: function () { ed(function (o) { o.siteBgGradient = o.siteBgGradient === id ? "" : id; }); } });
      var syncBg = function () { asBg.textContent = C().siteBgGradient === id ? "Ne plus utiliser comme fond du site" : "Utiliser comme fond du site"; asBg.setAttribute("aria-pressed", String(C().siteBgGradient === id)); angle.hidden = g().kind === "radial"; };
      reg(syncBg); syncBg();
      var dup = h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Dupliquer", onclick: function () { if (C().gradients.length >= 12) { toast("12 dégradés au plus.", "error"); return; } var nid = "g" + rand(); ed(function (o) { var t = o.gradients.filter(function (x) { return x.id === id; })[0]; if (t) o.gradients.push({ id: nid, name: (t.name + " (copie)").slice(0, 30), kind: t.kind, angle: t.angle, stops: clone(t.stops) }); }); selected = nid; draw(); } });
      var rm = h("button", { type: "button", class: "kwg-btn kwg-mini", text: "Supprimer", onclick: function () { ed(function (o) { o.gradients = o.gradients.filter(function (x) { return x.id !== id; }); if (o.siteBgGradient === id) o.siteBgGradient = ""; }); selected = null; draw(); } });
      return h("div", { class: "kwg-pop" }, [h("small", { text: "Nom" }), name, h("div", { style: "height:8px" }), h("small", { text: "Type" }), kind, angle, h("small", { text: "Points de couleur (couleur, position en %)" }), stopsBox, addStop, h("div", { class: "kwg-pop-line", style: "margin-top:8px;flex-wrap:wrap" }, [asBg, dup, rm])]);
    }
    function draw() {
      box.textContent = "";
      var list = C().gradients; lastSig = list.map(function (x) { return x.id; }).join();
      if (!list.length) box.appendChild(h("p", { class: "kwg-soon", style: "padding:0 0 8px;font-size:12px", text: "Aucun dégradé. Ajoutez-en un pour l'utiliser comme fond du site ou comme fond de bouton." }));
      list.forEach(function (gr) {
        box.appendChild(h("div", { class: "kwg-grad" + (selected === gr.id ? " is-open" : ""), "data-id": gr.id }, [
          h("button", { type: "button", class: "kwg-grad-bar", title: "Modifier le dégradé « " + gr.name + " »", "aria-label": "Modifier le dégradé « " + gr.name + " »", "aria-expanded": String(selected === gr.id), onclick: function () { selected = selected === gr.id ? null : gr.id; draw(); } }),
          h("span", { class: "kwg-grad-name", text: gr.name }),
        ]));
        if (selected === gr.id) box.appendChild(editor(gr));
      });
      box.appendChild(h("button", { type: "button", class: "kwg-btn kwg-mini", "data-act": "add-gradient", text: "Ajouter un dégradé", onclick: add }));
      paint();
    }
    function paint() { $$(".kwg-grad", box).forEach(function (row) { var id = row.getAttribute("data-id"), g = cur(id), bar = row.querySelector(".kwg-grad-bar"), nm = row.querySelector(".kwg-grad-name"); if (bar) bar.style.background = gradientCss(id); if (nm && g) nm.textContent = g.name; }); }
    draw();
    reg(function () { var sig = C().gradients.map(function (x) { return x.id; }).join(); if (sig !== lastSig) { if (box.contains(document.activeElement)) { lastSig = sig; paint(); } else draw(); } else paint(); });
    return group("Dégradés", [box], function () { ed(function (o) { o.gradients = []; o.siteBgGradient = ""; }); selected = null; draw(); }, function () { return C().gradients.length > 0; });
  }

  // ---------- Aperçu du bouton ----------
  function buttonPreview(B, tab) {
    var hover = false;
    var btn = h("span", { class: "kwg-pbtn", role: "img", "aria-label": "Aperçu du bouton" }, ["Bouton d'exemple"]);
    var tog = h("div", { class: "kwg-seg", role: "group", "aria-label": "État affiché" }, [["normal", "Normal"], ["hover", "Survol"]].map(function (x) { return h("button", { type: "button", "data-v": x[0], text: x[1], onclick: function () { hover = x[0] === "hover"; refreshAll(); } }); }));
    var box = h("div", { class: "kwg-pv" }, [btn]);
    function sides(s) { var q = s.d, vals = ["t", "r", "b", "l"].map(function (k) { return q[k]; }); return vals.every(function (v) { return v === null; }) ? "" : vals.map(function (v) { return (v === null ? 0 : v) + s.unit; }).join(" "); }
    reg(function () {
      var b = B(), st = hover ? b.hover : b.normal, bc = G.base.colors || {}, primary = tab === "primary";
      var col = function (v, fb) { var r = resolveColor(v); return r || fb; };
      var bg = col(st.bg, col(b.normal.bg, primary ? bc.primary : "transparent")), fg = col(st.color, col(b.normal.color, primary ? "#ffffff" : bc.primary)), bd = col(st.border, col(b.normal.border, bc.primary));
      var sh = b.shadowCustom, shadow = sh.on ? (sh.x || 0) + "px " + (sh.y === null ? 4 : sh.y) + "px " + (sh.blur === null ? 12 : sh.blur) + "px " + (sh.spread || 0) + "px " + (resolveColor(sh.color) || "#0b2a40") : ({ sm: "0 1px 3px rgba(11,42,64,.12)", md: "0 4px 16px rgba(11,42,64,.14)", lg: "0 12px 32px rgba(11,42,64,.2)", none: "none" }[b.shadow] || "none");
      var f = b.font, css = [
        "background:" + bg, "color:" + fg, "border-color:" + bd, "border-style:" + (b.borderStyle || "solid"), "border-width:" + (sides(b.borderWidth) || "2px"), "border-radius:" + (sides(b.radius) || "6px"), "padding:" + (sides(b.padding) || "10px 22px"), "box-shadow:" + shadow,
        f.size !== null ? "font-size:" + f.size + "px" : "", f.weight !== null ? "font-weight:" + f.weight : "font-weight:600", f.family ? "font-family:" + fontStackOf(f.family) : "", f.ls !== null ? "letter-spacing:" + f.ls + "em" : "", f.transform ? "text-transform:" + f.transform : "",
        b.opacity !== null ? "opacity:" + b.opacity : "", b.hoverLift !== null || b.hoverScale !== null ? (hover ? "transform:translateY(-" + (b.hoverLift || 0) + "px) scale(" + (b.hoverScale || 1) + ")" : "transform:none") : "", b.minWidth.d !== null ? "min-width:" + b.minWidth.d + "px" : "", b.maxWidth.d !== null ? "max-width:" + b.maxWidth.d + "px" : "",
      ].filter(Boolean).join(";");
      btn.setAttribute("style", css);
      [].forEach.call(tog.children, function (x) { x.setAttribute("aria-pressed", String((x.getAttribute("data-v") === "hover") === hover)); });
    });
    return h("section", { class: "kwg-group" }, [h("div", { class: "kwg-gtitle" }, [h("span", { text: "Aperçu" }), tog]), box]);
  }

  // ---------- Écrans et navigation interne ----------
  var ROWS = [["typography", "Typographie"], ["colors", "Couleurs"], ["container", "Conteneur"], ["buttons", "Boutons"]];
  var badgeCount = function (key) { return Object.keys(A.pending()).filter(function (id) { return id === IDS[key]; }).length; };
  function screenRoot(go) {
    var ul = h("div", { class: "kwg-rows", role: "list" });
    ROWS.forEach(function (r) {
      var n = h("span", { class: "kwg-badge", hidden: true });
      var b = h("button", { type: "button", class: "kwg-row", "data-row": r[0], onclick: function () { go(r[0]); } }, [h("span", { text: r[1] }), n, icon("chev")]);
      reg(function () { var c = badgeCount(r[0]); n.hidden = !c; n.textContent = c ? "modifié" : ""; });
      ul.appendChild(b);
    });
    return [ul];
  }
  K.registerPanel("global", { render: function (container) {
    var wrap = h("div", { class: "kwg-wrap" }); container.appendChild(wrap);
    var path = null;
    function go(p) { path = p; render(true); }
    function render(focus) {
      registry = []; openPop = null; wrap.textContent = "";
      var sub = ROWS.filter(function (r) { return r[0] === path; })[0];
      K.detail.setHead(sub ? "Global" : "Vous personnalisez", sub ? sub[1] : "Global");
      K.detail.setBack(sub ? function () { go(null); } : null);
      var kids = path === "typography" ? screenTypography() : path === "colors" ? screenColors() : path === "container" ? screenContainer() : path === "buttons" ? screenButtons() : screenRoot(go);
      kids.forEach(function (k) { if (k) wrap.appendChild(k); });
      refreshAll();
      if (focus) K.detail.focusTitle();
    }
    render(false);
    K.on("settings:changed", function () { if (wrap.isConnected) refreshAll(); });
    K.on("change:device", function () { if (wrap.isConnected) refreshAll(); });
    K.on("settings:rerender", function () { if (wrap.isConnected && K.state.category === "global") render(false); });
    K.on("settings:warnings", function (w) { warnings = w || []; });
  } });
})();

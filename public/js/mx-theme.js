// KOLAKISA CMS → Médiathèque : thème du gestionnaire de fichiers — SOURCE UNIQUE.
// Trois modes : « clair », « sombre » et « personnalisé » (partant d'un thème de base ; les couleurs personnalisées sont enregistrées SÉPARÉMENT pour le clair et pour le sombre).
// Tout composant lit des jetons sémantiques (--mx-*, --mxs-*) posés sur <html> : menus, fenêtres, aperçu et panneaux ajoutés à <body> sont donc thémés comme le reste.
// Ce script est chargé AVANT le premier affichage de la page (aucun scintillement au chargement) ; media-explorer.js s'en sert pour les changements en direct.
// Contrôle de contraste WCAG 2.2 AA : rapports calculés ici ; une correction n'est jamais appliquée sans le choix de la personne.
(function (root) {
  "use strict";

  var KEYS = ["sideBg", "mainBg", "text", "textSoft", "icon", "sep", "sel", "hover", "folder", "accent", "border", "badge"];
  var HEX = /^#[0-9a-f]{6}$/i;

  // Palettes complètes des deux thèmes de base (les valeurs du CSS par défaut = clair ; un test vérifie qu'elles ne divergent pas)
  var PRESETS = {
    clair: { sideBg: "#0d2238", mainBg: "#ffffff", text: "#0b2a40", textSoft: "#4f5f70", icon: "#9fb0c4", sep: "#2a4058", sel: "#e3eefa", hover: "#eaf1f8", folder: "#4f8fd6", accent: "#0a74b5", border: "#dbe3ec", badge: "#2a4058" },
    sombre: { sideBg: "#08131f", mainBg: "#0f1b2a", text: "#e6edf6", textSoft: "#a9b8cb", icon: "#9fb0c4", sep: "#22364b", sel: "#1d4670", hover: "#17293d", folder: "#6fb4ff", accent: "#6fb4ff", border: "#25384d", badge: "#22364b" },
  };
  // Couleurs d'état propres à chaque thème de base (non personnalisables : elles garantissent la lisibilité des messages)
  var STATE = {
    clair: { ok: "#1c7a4f", warn: "#8a5a00", err: "#b3261e", star: "#c28f00", shadow: "rgba(11, 42, 64, 0.32)", overlay: "rgba(6, 17, 28, 0.5)" },
    sombre: { ok: "#4cc38a", warn: "#e5a93a", err: "#ff8a80", star: "#e8b94a", shadow: "rgba(0, 0, 0, 0.55)", overlay: "rgba(0, 0, 0, 0.6)" },
  };

  // ---------------------------------------------------------------- Couleurs
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function hex(c) { return "#" + c.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]); }
  function channel(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function lum(h) { var c = rgb(h); return 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2]); }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  function onColor(bg) { return ratio("#ffffff", bg) >= ratio("#0b1726", bg) ? "#ffffff" : "#0b1726"; } // texte lisible posé SUR une couleur
  // Rapproche `fg` du noir ou du blanc (selon le fond) jusqu'au rapport demandé : proposition de correction, sa teinte est conservée au maximum
  function adjust(fg, bg, min) {
    if (ratio(fg, bg) >= min) return fg;
    var target = lum(bg) > 0.4 ? "#000000" : "#ffffff", best = target;
    for (var t = 0.05; t <= 1.0001; t += 0.05) { var c = mix(fg, target, t); if (ratio(c, bg) >= min) { best = c; break; } }
    return best;
  }

  // ---------------------------------------------------------------- Modèle d'un thème (validé ici ET côté serveur)
  function clampInt(v, lo, hi, d) { return isFinite(Number(v)) && v !== "" && v !== null ? Math.min(Math.max(Math.round(Number(v)), lo), hi) : d; }
  function cleanColors(o) { var out = {}; if (o && typeof o === "object") KEYS.forEach(function (k) { if (typeof o[k] === "string" && HEX.test(o[k])) out[k] = o[k].toLowerCase(); }); return out; }
  // Ancien format : « colors » à plat. Il devient les couleurs du thème sur lequel il avait été choisi (sombre → sombre, sinon clair)
  function normalize(t) {
    var o = t && typeof t === "object" ? t : {}, mode = o.mode === "sombre" || o.mode === "personnalise" ? o.mode : "clair";
    var base = o.base === "sombre" ? "sombre" : o.base === "clair" ? "clair" : mode === "sombre" ? "sombre" : "clair";
    var colors = { clair: {}, sombre: {} };
    if (o.colors && typeof o.colors === "object") {
      if (o.colors.clair || o.colors.sombre) { colors.clair = cleanColors(o.colors.clair); colors.sombre = cleanColors(o.colors.sombre); }
      else colors[mode === "sombre" ? "sombre" : base] = cleanColors(o.colors);
    }
    return { mode: mode, base: base, colors: colors, radius: clampInt(o.radius, 0, 20, 8), space: clampInt(o.space, 80, 140, 100), iconSize: clampInt(o.iconSize, 14, 26, 16) };
  }
  // Thème de base effectivement affiché, et couleurs finales (préréglage + personnalisations du thème de base)
  function baseOf(t) { return t.mode === "sombre" ? "sombre" : t.mode === "personnalise" ? t.base : "clair"; }
  function resolve(t) {
    var base = baseOf(t), colors = {}, custom = t.mode === "personnalise" ? t.colors[base] : {};
    KEYS.forEach(function (k) { colors[k] = custom[k] || PRESETS[base][k]; });
    return { base: base, colors: colors, custom: custom };
  }

  // ---------------------------------------------------------------- Jetons sémantiques
  function tokens(t) {
    var r = resolve(t), c = r.colors, s = STATE[r.base], chosen = r.custom;
    var darkSide = lum(c.sideBg) < 0.2;                                  // barre latérale sombre → texte clair
    var sideText = darkSide ? "#e6edf6" : "#0b2a40", sideMuted = darkSide ? "#a9b8cb" : "#4f5f70";
    var bg = c.mainBg, text = c.text;
    var v = {
      "--mx-bg": bg, "--mx-soft": mix(bg, text, 0.045), "--mx-card": bg, "--mx-pop": mix(bg, text, r.base === "sombre" ? 0.06 : 0.0), "--mx-field": mix(bg, text, 0.045),
      "--mx-text": text, "--mx-muted": c.textSoft, "--mx-disabled": mix(c.textSoft, bg, 0.45), "--mx-icon-c": c.textSoft,
      "--mx-line": c.border, "--mx-line-strong": mix(c.border, text, 0.55),
      "--mx-sel": c.sel, "--mx-hover": c.hover, "--mx-accent": c.accent, "--mx-accent-ink": r.base === "sombre" ? mix(c.accent, "#ffffff", 0.2) : mix(c.accent, "#000000", 0.28),
      "--mx-on-accent": onColor(c.accent), "--mx-folder": c.folder, "--mx-badge": c.badge,
      "--mx-ok": s.ok, "--mx-warn": s.warn, "--mx-err": s.err, "--mx-star": s.star, "--mx-shadow": s.shadow, "--mx-overlay": s.overlay,
      "--mx-focus": mix(c.accent, r.base === "sombre" ? "#ffffff" : "#000000", 0.15),
      "--mxs-bg": c.sideBg, "--mxs-text": sideText, "--mxs-muted": sideMuted, "--mxs-icon": c.icon, "--mxs-sep": c.sep, "--mxs-folder": c.folder,
      "--mxs-hover": chosen.hover || (darkSide ? "rgba(255, 255, 255, 0.07)" : "rgba(11, 42, 64, 0.07)"),
      "--mxs-sel": chosen.sel || (darkSide ? "rgba(111, 180, 255, 0.18)" : "rgba(10, 116, 181, 0.14)"),
      "--mxs-accent": chosen.accent || (darkSide ? "#6fb4ff" : c.accent),
    };
    v["--mx-radius"] = t.radius + "px"; v["--mx-space"] = String(t.space / 100); v["--mx-icon"] = t.iconSize + "px";
    return v;
  }

  // ---------------------------------------------------------------- Contrôle WCAG 2.2 AA
  // Chaque contrôle : texte (4,5) ou élément d'interface (3) ; `key` = la couleur personnalisable à corriger ; `fix` = proposition (jamais appliquée seule)
  function audit(t) {
    var r = resolve(t), c = r.colors, v = tokens(t), out = [];
    var add = function (id, label, fg, bg, min, key, fixFg, fixBg) {
      var q = ratio(fg, bg), item = { id: id, label: label, ratio: Math.round(q * 100) / 100, min: min, ok: q >= min, key: key, fg: fg, bg: bg };
      if (!item.ok) item.fix = adjust(fixFg, fixBg, min);
      out.push(item);
    };
    add("text", "Texte principal sur le fond du contenu", c.text, c.mainBg, 4.5, "text", c.text, c.mainBg);
    add("muted", "Texte secondaire sur le fond du contenu", c.textSoft, c.mainBg, 4.5, "textSoft", c.textSoft, c.mainBg);
    add("sel", "Texte principal sur un élément sélectionné", c.text, c.sel, 4.5, "text", c.text, c.sel);
    add("accent", "Liens et éléments actifs sur le fond", c.accent, c.mainBg, 4.5, "accent", c.accent, c.mainBg);
    add("onaccent", "Texte des boutons principaux", v["--mx-on-accent"], c.accent, 4.5, "accent", c.accent, v["--mx-on-accent"]);
    add("side", "Texte de la barre latérale", v["--mxs-text"], c.sideBg, 4.5, "sideBg", c.sideBg, v["--mxs-text"]);
    add("sidemuted", "Texte secondaire de la barre latérale", v["--mxs-muted"], c.sideBg, 4.5, "sideBg", c.sideBg, v["--mxs-muted"]);
    add("icon", "Icônes de la barre latérale", c.icon, c.sideBg, 3, "icon", c.icon, c.sideBg);
    add("border", "Bordures des champs", v["--mx-line-strong"], c.mainBg, 3, "border", c.border, c.mainBg);
    return out;
  }

  // ---------------------------------------------------------------- Application dans la page
  var applied = {};
  function apply(theme, opts) {
    var doc = root.document; if (!doc) return;
    var t = normalize(theme), el = doc.documentElement, v = tokens(t), r = resolve(t);
    opts = opts || {};
    // Un changement de thème est appliqué EN UNE FOIS : les transitions sont coupées le temps d'un affichage (jamais de mélange d'anciennes et de nouvelles couleurs)
    if (opts.instant !== false) { el.classList.add("mx-theming"); root.requestAnimationFrame(function () { root.requestAnimationFrame(function () { el.classList.remove("mx-theming"); }); }); }
    el.setAttribute("data-mxt", r.base); el.setAttribute("data-mxt-mode", t.mode);
    Object.keys(applied).forEach(function (k) { if (!(k in v)) el.style.removeProperty(k); });
    Object.keys(v).forEach(function (k) { if (applied[k] !== v[k]) el.style.setProperty(k, v[k]); });
    applied = v;
    return t;
  }
  function init() { try { var seed = root.__MX_THEME__; if (seed) apply(seed, { instant: false }); } catch (e) { /* thème par défaut du CSS */ } }

  var api = { KEYS: KEYS, PRESETS: PRESETS, STATE: STATE, normalize: normalize, resolve: resolve, baseOf: baseOf, tokens: tokens, audit: audit, apply: apply, ratio: ratio, adjust: adjust, mix: mix, lum: lum };
  root.MXTheme = api;
  if (root.document) init();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

/* Inspecteur de qualité web de l'éditeur : contrôles sur le rendu RÉEL du canevas (DOM), rattachés aux éléments natifs de la page.
   - Rapide d'abord : contrôles locaux (écran affiché) après une pause de saisie, jamais à chaque frappe, jamais de réseau ;
     audit complet à la demande : trois écrans + SEO (moteur SEO existant du serveur).
   - Discret : un indicateur dans la barre, un rapport qui s'ouvre sur demande ; ni focus volé ni sélection modifiée.
   - Honnête : « aucun problème détecté dans le périmètre vérifié » n'est pas une certification ; les contrôles manuels sont listés.
   - Les corrections sont des modifications natives, annulables, puis le contrôle est relancé : un problème n'est « corrigé » que s'il a disparu. */
(function () {
  "use strict";
  var B = null;
  var SEV = { blocking: ["Bloquant", 0], critical: ["Critique", 1], important: ["Important", 2], minor: ["Mineur", 3], tip: ["Recommandation", 4] };
  var CATS = { html: "HTML et CSS", a11y: "Accessibilité", responsive: "Responsive", seo: "SEO technique", perf: "Performance", general: "Qualité générale" };
  var VW = { desktop: 0, tablet: 820, mobile: 390 };
  var MANUAL = [
    "Navigation complète au clavier (ordre logique, aucun piège) : à essayer avec la touche Tab.",
    "Indicateur de focus visible sur chaque élément interactif.",
    "Pertinence des textes alternatifs et des intitulés de liens (le contrôle automatique ne vérifie que leur présence).",
    "Sous-titres et transcriptions des vidéos et audios.",
    "Lecture d'écran (VoiceOver, NVDA) sur les parcours importants.",
    "Mesures de performance réelles (Core Web Vitals) sur la page publiée.",
  ];
  var S = { status: "idle", issues: [], dismissed: {}, fixed: 0, ms: 0, at: 0, version: -1, key: "", full: false, seo: null, vitals: null, continuous: true, filter: "all", showDismissed: false, open: false, token: 0, runs: 0 };
  var el = {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  var px = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };

  // ---------- Couleurs et contraste (WCAG 2.x) ----------
  function parseColor(s) {
    var m = String(s || "").match(/rgba?\(([^)]+)\)/); if (!m) return null;
    var p = m[1].split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  var lin = function (c) { c = c / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  var lum = function (c) { return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b); };
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function over(top, bottom) { var a = top.a + bottom.a * (1 - top.a); if (!a) return { r: 255, g: 255, b: 255, a: 1 }; return { r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a, g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a, b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a, a: a }; }
  // Fond effectif d'un élément : couches superposées jusqu'à un fond opaque ; null si une image/dégradé empêche un calcul fiable
  function backdrop(el, win) {
    var layers = [];
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      var cs = win.getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      var c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
    }
    var acc = { r: 255, g: 255, b: 255, a: 1 };
    for (var i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  }
  var hex = function (c) { return "#" + [c.r, c.g, c.b].map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); };
  // Couleur de texte la plus proche (même teinte) qui atteint le contraste voulu sur ce fond
  function fixColor(fg, bg, need) {
    var dark = lum(bg) > 0.4, t = dark ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
    for (var k = 0; k <= 20; k++) {
      var f = k / 20, c = { r: fg.r + (t.r - fg.r) * f, g: fg.g + (t.g - fg.g) * f, b: fg.b + (t.b - fg.b) * f, a: 1 };
      if (ratio(c, bg) >= need) return hex(c);
    }
    return dark ? "#000000" : "#ffffff";
  }

  // ---------- Moteur de contrôles (sur un document rendu) ----------
  var nodeEl = function (n) { return n && n.closest ? n.closest("[data-node-id],[data-section-id]") : null; };
  var nodeIdOf = function (n) { var e = nodeEl(n); return e ? (e.getAttribute("data-node-id") || e.getAttribute("data-section-id")) : ""; };
  function nameOfNode(id) { var it = id && B && B.byId ? B.byId(id) : null; return it ? B.nameOf(it) : ""; }
  var isVisible = function (e, win) { var cs = win.getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden") return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  var accessibleName = function (e) {
    var t = (e.getAttribute("aria-label") || e.getAttribute("title") || "").trim(); if (t) return t;
    if (e.getAttribute("aria-labelledby")) return "x";
    t = (e.textContent || "").replace(/\s+/g, " ").trim(); if (t) return t;
    var img = e.querySelector("img[alt]:not([alt=''])"); return img ? img.getAttribute("alt") : "";
  };
  var GENERIC_LINK = /^(cliquez ici|ici|en savoir plus|lire la suite|voir plus|plus|click here|read more|more)$/i;

  function checkDocument(doc, opts) {
    opts = opts || {};
    var win = doc.defaultView, bp = opts.bp || "desktop", out = [], seen = {};
    var add = function (rule, cat, sev, e, msg, cause, fix, extra) {
      var nid = extra && extra.nodeId !== undefined ? extra.nodeId : nodeIdOf(e);
      var ebp = (extra && extra.bp) || bp;
      var key = rule + ":" + (nid || (e ? pathOf(e) : "")) + ":" + (cat === "responsive" || rule === "contrast" || rule === "target-size" ? ebp : "");
      if (seen[key]) return; seen[key] = true;
      out.push(Object.assign({ id: key, rule: rule, cat: cat, sev: sev, msg: msg, cause: cause, fix: fix, nodeId: nid, bp: bp, name: nameOfNode(nid), auto: null }, extra || {}));
    };
    // Seul le contenu de la page est contrôlé (l'en-tête et le pied de page viennent des réglages du site)
    var root = opts.synthetic ? doc.body : (doc.querySelector(".lp-main") || doc.body);
    var all = $$("*", root).slice(0, 5000);
    var pathOf = function (e) { var p = [], n = e; for (var i = 0; n && n.nodeType === 1 && i < 4; i++, n = n.parentElement) p.push(n.tagName.toLowerCase() + ([].indexOf.call(n.parentNode ? n.parentNode.children : [], n))); return p.join(">"); };

    // --- HTML / structure ---
    var ids = {};
    all.forEach(function (e) { if (e.id) (ids[e.id] = ids[e.id] || []).push(e); });
    Object.keys(ids).forEach(function (k) { if (ids[k].length > 1) add("dup-id", "html", "important", ids[k][1], "Identifiant « " + k + " » utilisé " + ids[k].length + " fois", "Deux éléments portent le même attribut id, ce qui casse les ancres, les libellés et les scripts.", "Donnez un identifiant différent à chaque élément (champ « Ancre » ou « Classe CSS » de l'inspecteur).", { detail: k }); });
    $$("a a, a button, button a, button button", root).forEach(function (e) { add("nested-interactive", "html", "important", e, "Élément interactif dans un autre élément interactif", "Un lien ou un bouton est imbriqué dans un lien ou un bouton : le comportement au clavier et au lecteur d'écran est imprévisible.", "Retirez le lien du conteneur ou du bouton qui le contient."); });
    $$("h1,h2,h3,h4,h5,h6", root).forEach(function (e) { if (!(e.textContent || "").trim() && !e.querySelector("img[alt]:not([alt=''])")) add("empty-heading", "html", "important", e, "Titre vide", "Un titre sans texte est annoncé par les lecteurs d'écran et pollue le plan de la page.", "Saisissez le texte du titre ou supprimez l'élément."); });
    if (!opts.synthetic && !(doc.documentElement.getAttribute("lang") || "").trim()) add("lang", "html", "important", doc.documentElement, "Langue de la page non déclarée", "L'attribut lang est absent : prononciation et traduction automatiques peuvent être fausses.", "Renseignez la langue dans les réglages du site.", { nodeId: "" });

    // --- Accessibilité ---
    $$("img", root).forEach(function (e) {
      if (!e.hasAttribute("alt")) add("img-alt", "a11y", "critical", e, "Image sans texte alternatif", "L'image n'a pas d'attribut alt : un lecteur d'écran annonce son nom de fichier, ou rien.", "Décrivez l'image dans le champ « Texte alternatif » ; laissez-le vide uniquement si l'image est purement décorative.", { wcag: "1.1.1" });
      else if (/\.(jpe?g|png|gif|webp|svg)$/i.test(e.getAttribute("alt") || "")) add("img-alt-file", "a11y", "important", e, "Texte alternatif qui ressemble à un nom de fichier", "« " + e.getAttribute("alt") + " » ne décrit pas l'image.", "Remplacez-le par une courte description utile.", { wcag: "1.1.1" });
    });
    $$("a, button, [role=button], [role=link]", root).forEach(function (e) {
      if (!accessibleName(e)) add("control-name", "a11y", "critical", e, (e.tagName === "A" ? "Lien" : "Bouton") + " sans nom accessible", "Il n'a ni texte, ni aria-label, ni image avec texte alternatif : sa fonction est inconnue des lecteurs d'écran.", "Ajoutez un libellé visible, ou un libellé accessible (champ « Libellé accessible »).", { wcag: "4.1.2 / 2.4.4" });
      else if (e.tagName === "A" && GENERIC_LINK.test(accessibleName(e).trim())) add("link-generic", "seo", "tip", e, "Texte de lien peu explicite (« " + accessibleName(e).trim() + " »)", "Hors contexte, ce libellé ne dit pas où mène le lien (lecteurs d'écran, moteurs de recherche).", "Décrivez la destination : « Voir le programme de la formation ».", { wcag: "2.4.4" });
      if ((e.getAttribute("role") === "button" || e.getAttribute("role") === "link") && e.tagName !== "A" && e.tagName !== "BUTTON" && !e.hasAttribute("tabindex")) add("not-focusable", "a11y", "important", e, "Élément interactif inaccessible au clavier", "Il a un rôle de bouton ou de lien mais ne peut pas recevoir le focus.", "Utilisez un vrai bouton ou lien, ou ajoutez tabindex=\"0\".", { wcag: "2.1.1" });
    });
    $$("[tabindex]", root).forEach(function (e) { if (px(e.getAttribute("tabindex")) > 0) add("tabindex-positive", "a11y", "minor", e, "tabindex positif", "Un tabindex supérieur à 0 impose un ordre de tabulation artificiel.", "Utilisez tabindex=\"0\" ou l'ordre naturel de la page.", { wcag: "2.4.3" }); });
    $$("input, select, textarea", root).forEach(function (e) {
      var t = (e.getAttribute("type") || "").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image"].indexOf(t) >= 0) return;
      var labelled = e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.getAttribute("title") || (e.id && doc.querySelector('label[for="' + e.id.replace(/"/g, "") + '"]')) || e.closest("label");
      if (!labelled) add("field-label", "a11y", "critical", e, "Champ de formulaire sans libellé", "Le champ n'est associé à aucun libellé : on ne sait pas quoi y saisir.", "Associez un libellé au champ (élément label ou libellé accessible).", { wcag: "1.3.1 / 3.3.2" });
    });
    // Hiérarchie des titres
    var heads = $$("h1,h2,h3,h4,h5,h6", root).filter(function (e) { return (e.textContent || "").trim(); });
    var h1s = heads.filter(function (e) { return e.tagName === "H1"; });
    if (opts.page !== false && heads.length && !h1s.length) add("h1-missing", "a11y", "minor", heads[0], "Aucun titre principal (H1)", "La page n'a pas de titre de niveau 1 : le sujet de la page est moins clair.", "Passez le titre principal au niveau 1 (champ « Niveau » du widget Titre).", { wcag: "1.3.1", nodeId: nodeIdOf(heads[0]) });
    if (h1s.length > 1) add("h1-many", "a11y", "minor", h1s[1], h1s.length + " titres principaux (H1)", "Plusieurs H1 brouillent le plan de la page.", "Gardez un seul H1 ; les autres en H2.", { wcag: "1.3.1" });
    var last = 0;
    heads.forEach(function (e) { var l = +e.tagName.slice(1); if (last && l > last + 1) add("heading-order", "a11y", "important", e, "Niveau de titre sauté (H" + last + " puis H" + l + ")", "Un H" + l + " suit un H" + last + " sans H" + (last + 1) + " : le plan de la page est incohérent.", "Utilisez le niveau H" + (last + 1) + " (champ « Niveau »), puis réglez la taille dans le style.", { wcag: "1.3.1" }); last = l; });

    // --- Contraste (échantillon limité, éléments portant du texte) ---
    var texts = all.filter(function (e) { for (var c = e.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.nodeValue.trim().length) return true; return false; }).slice(0, 400);
    texts.forEach(function (e) {
      if (!isVisible(e, win) || (!opts.synthetic && !nodeIdOf(e))) return; // hors contenu de la page (aides de l'éditeur)
      var cs = win.getComputedStyle(e), fg = parseColor(cs.color), bg = backdrop(e, win);
      if (!fg || !bg) return;
      var f = fg.a < 1 ? over(fg, bg) : fg;
      var r = ratio(f, bg), size = px(cs.fontSize), large = size >= 24 || (size >= 18.66 && px(cs.fontWeight) >= 700), need = large ? 3 : 4.5;
      if (r + 0.005 < need) {
        var nid = nodeIdOf(e), ok = fixColor(f, bg, need);
        add("contrast", "a11y", r < 3 ? "critical" : "important", e, "Contraste insuffisant (" + (Math.round(r * 10) / 10) + ":1, " + need + ":1 requis)", "Le texte " + hex(f) + " sur le fond " + hex(bg) + " est difficile à lire.", "Éclaircissez ou assombrissez le texte (proposition : " + ok + ").", { wcag: "1.4.3", nodeId: nid, auto: nid ? { kind: "color", id: nid, bp: "desktop", map: { color: ok } } : null, detail: Math.round(r * 10) / 10 + ":1" });
      }
    });

    // --- Responsive / tactile (écran affiché) ---
    var vw = VW[bp];
    if (bp !== "desktop" && vw) {
      var rootW = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
      if (rootW > vw + 2) {
        var worst = null;
        $$("[data-node-id],[data-section-id]", doc).forEach(function (e) { var r = e.getBoundingClientRect(); if (r.right > vw + 2 && (!worst || r.right > worst.r)) worst = { e: e, r: r.right }; });
        // l'élément le plus HAUT qui dépasse (ses enfants en sont la conséquence)
        var top = worst && worst.e; while (top && top.parentElement && nodeEl(top.parentElement) && nodeEl(top.parentElement).getBoundingClientRect().right > vw + 2) top = nodeEl(top.parentElement);
        if (top) {
          var nid2 = nodeIdOf(top);
          add("overflow-x", "responsive", "important", top, "Débordement horizontal sur " + (bp === "mobile" ? "mobile" : "tablette"), "Le contenu dépasse de " + Math.round(worst.r - vw) + " px : l'écran défile latéralement.", "Largeur 100 % et largeur maximale 100 % sur cet écran.", { nodeId: nid2, auto: nid2 ? { kind: "style", id: nid2, bp: bp, map: { width: "100%", maxWidth: "100%" } } : null });
        }
      }
    }
    var minTarget = bp === "desktop" ? 24 : 44;
    $$("a, button, input:not([type=hidden]), select, textarea, [role=button]", root).forEach(function (e) {
      if (!isVisible(e, win) || (!opts.synthetic && !nodeIdOf(e))) return;
      var cs = win.getComputedStyle(e);
      if (e.tagName === "A" && (cs.display === "inline" || e.closest("p, li, span, td"))) return; // lien dans une phrase : exception WCAG 2.5.8
      var r = e.getBoundingClientRect();
      if (r.height < minTarget || r.width < 24) {
        var nid = nodeIdOf(e), hard = r.height < 24 || r.width < 24;
        add("target-size", "a11y", hard ? "important" : "minor", e, "Zone tactile de " + Math.round(r.width) + " × " + Math.round(r.height) + " px", hard ? "Moins de 24 × 24 px : critère WCAG 2.2 AA (2.5.8) non respecté." : "Moins de 44 px de haut : difficile à toucher sur un écran tactile (recommandation).", "Hauteur minimale de 44 px pour cet élément.", { wcag: "2.5.8", nodeId: nid, auto: nid ? { kind: "style", id: nid, bp: bp, map: { minHeight: "44px" } } : null });
      }
    });
    $$("*", root).slice(0, 3000).forEach(function (e) {
      if (!nodeEl(e) || nodeEl(e) !== e || !(e.textContent || "").trim() || !isVisible(e, win)) return;
      var fs = px(win.getComputedStyle(e).fontSize);
      if (fs && fs < 12 && e.children.length === 0) add("small-text", "responsive", "minor", e, "Texte de " + fs + " px", "En dessous de 12 px, la lecture est difficile, surtout sur mobile.", "Taille de police d'au moins 14 px.", { auto: nodeIdOf(e) ? { kind: "style", id: nodeIdOf(e), bp: bp, map: { fontSize: "14px" } } : null });
    });

    // --- Performance (observations du navigateur) ---
    var imgs = $$("img", root);
    imgs.forEach(function (e, i) {
      var r = e.getBoundingClientRect();
      if (e.complete && e.naturalWidth && r.width && e.naturalWidth > r.width * 2.2 && e.naturalWidth > 600) add("img-oversize", "perf", "minor", e, "Image bien plus grande que son affichage (" + e.naturalWidth + " px pour " + Math.round(r.width) + " px)", "Mesure observée dans l'éditeur : le visiteur télécharge plus de pixels que nécessaire.", "Importez une version plus petite ou utilisez les variantes de la médiathèque.");
      if (!e.hasAttribute("width") && !e.hasAttribute("height") && !(win.getComputedStyle(e).aspectRatio && win.getComputedStyle(e).aspectRatio !== "auto")) add("img-dimensions", "perf", "tip", e, "Image sans dimensions déclarées", "Estimation : sans largeur/hauteur ni ratio, le contenu peut se déplacer au chargement de l'image (CLS).", "Fixez un ratio d'image ou des dimensions dans le style.");
      if (i > 2 && e.getAttribute("loading") !== "lazy" && r.top > win.innerHeight * 1.5) add("img-lazy", "perf", "tip", e, "Image hors écran chargée immédiatement", "Estimation : charger cette image plus tard allège le premier affichage.", "Activez le chargement différé si l'option existe pour ce widget.");
    });
    if (all.length > 1500) add("dom-size", "perf", "tip", doc.body, "Page très volumineuse (" + all.length + " éléments)", "Un grand nombre d'éléments ralentit le rendu, surtout sur mobile.", "Découpez le contenu en plusieurs pages ou simplifiez les structures imbriquées.", { nodeId: "" });

    // --- Qualité générale (modèle) ---
    if (!opts.synthetic && B) {
      var secs = B.sections();
      secs.forEach(function (s) { if (s.type === "layout" && (!s.children || !s.children.length)) add("empty-section", "general", "tip", null, "Section vide", "Une section sans élément n'affiche rien.", "Ajoutez du contenu ou supprimez-la.", { nodeId: s.id }); });
      B.walk(function (it) {
        var kids = it.children;
        if (["container", "stack", "group", "grid", "columns", "column"].indexOf(it.type) >= 0 && kids && !kids.length) add("empty-container", "general", "tip", null, "Conteneur vide", "Un conteneur sans contenu ne sert à rien (hors espace volontaire).", "Ajoutez un widget ou supprimez-le.", { nodeId: it.id });
        // Réglages contradictoires (modèle) : largeur minimale > largeur maximale pour un même écran
        ["desktop", "tablet", "mobile"].forEach(function (b) {
          var st = (it.styles && it.styles[b]) || {}, mn = px(st.minWidth), mx = px(st.maxWidth);
          if (/px$/.test(st.minWidth || "") && /px$/.test(st.maxWidth || "") && mn > mx) add("min-gt-max", "html", "important", null, "Largeur minimale supérieure à la largeur maximale (" + b + ")", "Les deux réglages se contredisent : seule la largeur minimale s'applique.", "Corrigez l'une des deux valeurs.", { nodeId: it.id, bp: b });
          // Largeur effective de l'écran : les réglages « ordinateur » s'appliquent aussi à la tablette et au mobile tant qu'ils ne sont pas remplacés
          if (b === "desktop") return;
          var chain = b === "mobile" ? ["mobile", "tablet", "desktop"] : ["tablet", "desktop"], w = "", m = "";
          chain.forEach(function (k) { var set = (it.styles && it.styles[k]) || {}; if (!w && set.width) w = set.width; if (!m && set.maxWidth) m = set.maxWidth; });
          if (/px$/.test(w) && px(w) > VW[b] && !/%|vw$/.test(m)) add("fixed-width-model", "responsive", "important", null, "Largeur fixe de " + w + " sur " + (b === "mobile" ? "mobile" : "tablette"), "Cette largeur dépasse l'écran (" + VW[b] + " px) et provoque un débordement.", "Largeur en pourcentage ou largeur maximale de 100 % pour cet écran.", { nodeId: it.id, bp: b, auto: { kind: "style", id: it.id, bp: b, map: { width: "100%", maxWidth: "100%" } } });
        });
      });
    }
    return out;
  }

  // ---------- Exécution, cache, états ----------
  var now = function () { return (window.performance || Date).now(); };
  function runLocal(opts) {
    opts = opts || {};
    var doc = B.frame().contentDocument;
    if (!doc || !doc.body || !B.canvasReady()) { S.status = "unavailable"; render(); return; }
    var t0 = now(); S.runs++;
    var bp = B.device();
    var issues = checkDocument(doc, { bp: bp }).filter(function (i) { return i.sev; });
    // les constats d'un autre écran (audit complet) restent tant que le document n'a pas changé
    var keep = S.full && S.version === B.version() ? S.issues.filter(function (i) { return i.bp !== bp || ["overflow-x", "target-size", "contrast", "small-text", "fixed-width-model"].indexOf(i.rule) < 0 && i.cat !== "perf"; }) : [];
    var merged = merge(issues, keep);
    track(merged);
    S.issues = merged; S.version = B.version(); S.key = bp; S.ms = Math.round(now() - t0); S.at = Date.now();
    S.status = S.full && keep.length ? "partial" : "partial";
    S.full = S.full && S.version === B.version();
    render();
  }
  function merge(a, b) { var seen = {}; return a.concat(b).filter(function (i) { if (seen[i.id]) return false; seen[i.id] = true; return true; }); }
  function track(next) {
    var ids = {}; next.forEach(function (i) { ids[i.id] = 1; });
    if (S.pendingFix && !ids[S.pendingFix.id]) { S.fixed++; B.toast("Vérifié : le problème « " + S.pendingFix.msg + " » a disparu."); }
    else if (S.pendingFix) B.toast("Le problème persiste après la correction : examinez-le dans le rapport.", true);
    S.pendingFix = null;
  }
  // Audit complet : trois écrans (le cadre du canevas change de largeur) + SEO du serveur ; l'écran de départ est restauré
  function runFull() {
    if (S.status === "running") return Promise.resolve();
    var back = B.device(), token = ++S.token, all = [];
    S.status = "running"; render();
    var t0 = now();
    return B.saveNow().then(function () {
      return ["desktop", "tablet", "mobile"].reduce(function (p, bp) {
        return p.then(function () { B.setDevice(bp); return settle().then(function () { var doc = B.frame().contentDocument; all = merge(all, checkDocument(doc, { bp: bp })); }); });
      }, Promise.resolve());
    }).then(function () { B.setDevice(back); return settle(); })
      .then(function () { return seoChecks(true); })
      .then(function (seo) {
        if (token !== S.token) return;
        all = merge(all, seo);
        track(all);
        S.issues = all; S.version = B.version(); S.full = true; S.status = "done"; S.ms = Math.round(now() - t0); S.at = Date.now(); S.key = back;
        return vitals();
      }).catch(function () { B.setDevice(back); S.status = "unavailable"; }).then(function () { render(); });
  }
  var settle = function () { return new Promise(function (ok) { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(ok, 220); }); }); }); };
  // SEO : le moteur du serveur (pas de second moteur) ; seules les constatations à améliorer sont reprises
  function seoChecks(withHtml) {
    var url = B.seoUrl();
    if (!url) return Promise.resolve([]);
    var c = B.content();
    return B.api("POST", url, { analyse: withHtml, title: c.title, description: c.description, seo: c.seo }).then(function (r) {
      S.seo = r;
      return (r.checks || []).filter(function (x) { return x.status !== "good"; }).map(function (x) {
        return { id: "seo:" + x.id, rule: "seo-" + x.id, cat: "seo", sev: x.status === "problem" ? "important" : "tip", msg: x.label, cause: x.advice || "", fix: "Réglages de la page → Référencement (SEO).", nodeId: "", bp: "desktop", name: "", auto: null, page: true };
      });
    }, function () { return []; });
  }
  function vitals() {
    return new Promise(function (ok) {
      var win = B.frame().contentWindow, out = { cls: null, lcp: null };
      try {
        var done = 0, fin = function () { if (++done === 2) { S.vitals = out; ok(); } };
        var one = function (type, fn) { try { var po = new win.PerformanceObserver(function (l) { fn(l.getEntries()); }); po.observe({ type: type, buffered: true }); setTimeout(function () { try { po.disconnect(); } catch (e) { /* rien */ } fin(); }, 120); } catch (e) { fin(); } };
        one("layout-shift", function (es) { out.cls = Math.round(es.filter(function (e) { return !e.hadRecentInput; }).reduce(function (s, e) { return s + e.value; }, 0) * 1000) / 1000; });
        one("largest-contentful-paint", function (es) { if (es.length) out.lcp = Math.round(es[es.length - 1].startTime); });
      } catch (e) { ok(); }
    });
  }

  // Résultats devenus obsolètes dès que le document change ; recalcul léger après une pause, jamais pendant un geste
  var timer = null, backoff = 1;
  function onChange() {
    if (!B || S.version === B.version()) return;
    if (S.issues.length || S.status === "done" || S.status === "partial") { if (S.status !== "stale") { S.status = "stale"; render(true); } }
    clearTimeout(timer);
    if (!S.continuous) return;
    timer = setTimeout(function () {
      if (B.busy()) { onChange(); return; }
      var go = function () { if (S.version !== B.version()) { runLocal(); backoff = S.ms > 80 ? Math.min(5, backoff + 1) : 1; } };
      if (window.requestIdleCallback) window.requestIdleCallback(go, { timeout: 2500 }); else go();
    }, 1100 * backoff);
  }

  // ---------- Interface ----------
  function counts() {
    var open = S.issues.filter(function (i) { return S.showDismissed || !S.dismissed[i.id]; });
    var c = { total: 0, blocking: 0, critical: 0, important: 0, minor: 0, tip: 0 };
    S.issues.forEach(function (i) { if (S.dismissed[i.id]) return; c.total++; c[i.sev]++; });
    c.list = open; return c;
  }
  var LABEL = { idle: "Aucun contrôle effectué", running: "Audit en cours…", partial: "Audit partiel (écran affiché)", done: "Audit complet effectué", stale: "Résultats obsolètes : la page a changé", unavailable: "Vérification impossible (canevas indisponible)" };
  function headline(c) {
    if (S.status === "idle") return LABEL.idle;
    if (S.status === "running" || S.status === "unavailable") return LABEL[S.status];
    var base = c.total ? c.total + " point(s) à examiner" + (c.critical + c.blocking ? " dont " + (c.critical + c.blocking) + " critique(s)" : "") : "Contrôles effectués, aucun problème détecté dans le périmètre vérifié";
    return (S.status === "stale" ? "Obsolète · " : S.status === "partial" ? "Partiel · " : "") + base;
  }
  function render(light) {
    if (!el.btn) return;
    var c = counts();
    var state = S.status === "running" ? "running" : S.status === "stale" ? "stale" : S.status === "idle" ? "idle" : c.blocking || c.critical ? "critical" : c.total ? "warn" : "ok";
    el.btn.dataset.state = state;
    el.badge.textContent = S.status === "idle" ? "" : c.total ? String(c.total) : "✓";
    el.btn.setAttribute("data-tip", "Qualité de la page : " + headline(c));
    el.btn.setAttribute("aria-label", "Qualité de la page : " + headline(c));
    if (!S.open || (light && el.dlg.contains(document.activeElement))) return;
    paint(c);
  }
  function paint(c) {
    el.status.textContent = headline(c);
    el.status.dataset.state = el.btn.dataset.state;
    el.meta.textContent = S.at ? "Dernier contrôle : " + new Date(S.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " · " + S.ms + " ms" + (S.full ? " · 3 écrans + SEO" : " · écran " + (B.device() === "desktop" ? "ordinateur" : B.device() === "tablet" ? "tablette" : "mobile") + " seulement") : "";
    el.chips.textContent = "";
    var cats = Object.keys(CATS);
    el.chips.appendChild(chip("all", "Tout", c.list.length));
    cats.forEach(function (k) { var n = c.list.filter(function (i) { return i.cat === k; }).length; if (n || S.filter === k) el.chips.appendChild(chip(k, CATS[k], n)); });
    el.list.textContent = "";
    var shown = c.list.filter(function (i) { return S.filter === "all" || i.cat === S.filter; }).sort(function (a, b) { return SEV[a.sev][1] - SEV[b.sev][1]; });
    if (!shown.length) el.list.appendChild(h("p", { class: "pb-q-empty", text: S.status === "idle" ? "Lancez un contrôle pour analyser la page." : "Rien à signaler ici. Cela ne garantit pas la conformité complète : voir les contrôles manuels ci-dessous." }));
    CATS_ORDER(shown).forEach(function (g) {
      el.list.appendChild(h("h3", { class: "pb-q-cat", text: CATS[g.cat] + " (" + g.items.length + ")" }));
      g.items.forEach(function (i) { el.list.appendChild(card(i)); });
    });
    el.fixed.textContent = S.fixed ? S.fixed + " problème(s) corrigé(s) et vérifié(s) pendant cette session." : "";
    el.vitals.textContent = S.vitals && (S.vitals.cls !== null || S.vitals.lcp !== null) ? "Observé dans l'éditeur (non représentatif de la page publiée) : " + (S.vitals.cls !== null ? "CLS " + S.vitals.cls : "") + (S.vitals.lcp ? " · LCP " + S.vitals.lcp + " ms" : "") : "";
    el.cont.checked = S.continuous;
    el.dis.textContent = Object.keys(S.dismissed).length ? (S.showDismissed ? "Masquer les ignorés" : "Afficher les ignorés (" + Object.keys(S.dismissed).length + ")") : "";
  }
  function CATS_ORDER(list) { var out = []; Object.keys(CATS).forEach(function (k) { var items = list.filter(function (i) { return i.cat === k; }); if (items.length) out.push({ cat: k, items: items }); }); return out; }
  function chip(k, label, n) { return h("button", { type: "button", class: "pb-q-chip" + (S.filter === k ? " is-on" : ""), "aria-pressed": String(S.filter === k), onclick: function () { S.filter = k; paint(counts()); } }, label + (n ? " " + n : "")); }
  function card(i) {
    var dismissed = Boolean(S.dismissed[i.id]);
    var c = h("article", { class: "pb-q-card is-" + i.sev + (dismissed ? " is-dismissed" : ""), "data-q-rule": i.rule });
    c.appendChild(h("header", {}, [h("span", { class: "pb-q-sev", text: SEV[i.sev][0] }), h("strong", { text: i.msg })]));
    if (i.name || i.bp !== "desktop") c.appendChild(h("p", { class: "pb-q-where", text: (i.name ? "Élément : " + i.name : "") + (i.bp !== "desktop" ? (i.name ? " · " : "") + (i.bp === "tablet" ? "tablette" : "mobile") : "") + (i.wcag ? " · WCAG " + i.wcag : "") }));
    if (i.cause) c.appendChild(h("p", { class: "pb-q-cause", text: i.cause }));
    if (i.fix) c.appendChild(h("p", { class: "pb-q-fix", text: "Correction : " + i.fix }));
    var acts = h("div", { class: "pb-q-acts" });
    if (i.nodeId && B.byId(i.nodeId)) acts.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-q-go": true, onclick: function () { goTo(i); } }, "Voir"));
    if (i.auto && B.canWrite() && !dismissed) acts.appendChild(h("button", { type: "button", class: "btn btn-primary btn-sm", "data-q-fix": true, onclick: function () { autoFix(i); } }, i.auto.kind === "color" ? "Corriger la couleur" : "Corriger"));
    if (B.canWrite() && window.pbAi && window.pbAi.prefill && !i.page) acts.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-q-ai": true, onclick: function () { askAi(i); } }, "Demander à l'IA"));
    acts.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-q-ignore": true, onclick: function () { S.dismissed[i.id] = !dismissed || undefined; if (dismissed) delete S.dismissed[i.id]; saveDismissed(); render(); paint(counts()); } }, dismissed ? "Ne plus ignorer" : "Ignorer"));
    c.appendChild(acts);
    return c;
  }
  function goTo(i) {
    if (i.bp && i.bp !== B.device() && VW[i.bp] !== undefined) B.setDevice(i.bp);
    B.select(i.nodeId);
    setTimeout(function () { var n = B.canvasEl(i.nodeId); if (n && n.scrollIntoView) n.scrollIntoView({ block: "center", behavior: "auto" }); B.openInspector(); }, 120);
  }
  function autoFix(i) {
    var a = i.auto;
    if (!B.applyStyles(a.id, a.bp, a.map, "Qualité : " + i.msg.slice(0, 50))) return;
    S.pendingFix = { id: i.id, msg: i.msg };
    verify(i, 0);
  }
  // Le canevas se redessine après la modification : on relit le rendu jusqu'à ce que le problème ait disparu (3 essais), puis on constate
  function verify(i, n) {
    setTimeout(function () {
      var doc = B.frame().contentDocument, still = doc && checkDocument(doc, { bp: B.device() }).some(function (x) { return x.id === i.id; });
      if (still && n < 3) return verify(i, n + 1);
      runLocal();
    }, 500);
  }
  function askAi(i) {
    window.pbAi.prefill({ tab: "create", scope: "selection", selection: i.nodeId, instruction: "Corrige ce point de qualité sur l'élément sélectionné, sans toucher au reste : " + i.msg + ". " + (i.cause || "") + " " + (i.fix || "") });
  }
  function saveDismissed() { B.store.set("q-dismiss-" + B.pageId(), S.dismissed); }

  function build() {
    el.dlg = h("dialog", { class: "pb-quality", "aria-labelledby": "pb-q-title", "data-pb-quality-dialog": true });
    el.status = h("p", { class: "pb-q-status", role: "status", "aria-live": "polite" });
    el.meta = h("p", { class: "pb-q-meta" });
    el.chips = h("div", { class: "pb-q-chips", role: "group", "aria-label": "Filtrer par catégorie" });
    el.list = h("div", { class: "pb-q-list" });
    el.fixed = h("p", { class: "pb-q-meta" });
    el.vitals = h("p", { class: "pb-q-meta" });
    el.cont = h("input", { type: "checkbox", "data-q-continuous": true });
    el.cont.addEventListener("change", function () { S.continuous = el.cont.checked; B.store.set("q-continuous", S.continuous); if (S.continuous) onChange(); });
    el.dis = h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { S.showDismissed = !S.showDismissed; paint(counts()); } });
    var manual = h("details", { class: "pb-q-manual" }, [h("summary", { text: "Contrôles à faire à la main (non automatisables)" }), h("ul", {}, MANUAL.map(function (t) { return h("li", { text: t }); }))]);
    el.dlg.appendChild(h("div", { class: "pb-q-head" }, [h("h2", { id: "pb-q-title" }, "Qualité de la page"),
      h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Fermer", onclick: function () { el.dlg.close(); } }, B.icon("close"))]));
    el.dlg.appendChild(h("div", { class: "pb-q-body" }, [el.status, el.meta,
      h("div", { class: "pb-q-actions" }, [h("button", { type: "button", class: "btn btn-outline btn-sm", "data-q-run": true, onclick: function () { runLocal(); } }, "Relancer (écran affiché)"),
        h("button", { type: "button", class: "btn btn-primary btn-sm", "data-q-full": true, onclick: function () { runFull(); } }, "Audit complet"),
        h("label", { class: "pb-check pb-q-cont", "data-tip": "Analyse l'écran affiché après une pause de saisie. Désactivez-la si l'éditeur vous semble lent ; l'audit complet reste possible." }, [el.cont, " Contrôles continus"])]),
      el.chips, el.list, el.fixed, el.vitals, el.dis, manual,
      h("p", { class: "pb-q-note", text: "Ces contrôles automatiques signalent les problèmes détectables ; ils ne garantissent ni la conformité WCAG complète, ni un classement dans les moteurs de recherche." })]));
    document.body.appendChild(el.dlg);
    el.dlg.addEventListener("close", function () { S.open = false; el.btn.setAttribute("aria-expanded", "false"); });
    // Fenêtre non modale (show) : le navigateur n'y gère pas Échap ; on ferme et on rend le focus au bouton qui l'a ouverte
    el.dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); el.dlg.close(); el.btn.focus(); } });
  }
  function open() { S.open = true; el.dlg.show(); el.btn.setAttribute("aria-expanded", "true"); if (S.status === "idle") runLocal(); else paint(counts()); }

  function init() {
    el.btn = $("[data-pb-quality]");
    if (!el.btn) return;
    el.badge = $(".pb-q-badge", el.btn);
    S.continuous = B.store.get("q-continuous", true) !== false;
    S.dismissed = B.store.get("q-dismiss-" + B.pageId(), {}) || {};
    build();
    el.btn.addEventListener("click", function () { if (el.dlg.open) el.dlg.close(); else open(); });
    B.subscribe(onChange);
    render();
    // premier contrôle léger, une fois le canevas affiché
    setTimeout(function () { if (S.continuous && S.status === "idle") runLocal(); }, 2500);
  }
  window.pbQuality = { attach: function (bridge) { B = bridge; init(); }, checkDocument: function (doc, opts) { return checkDocument(doc, Object.assign({ synthetic: true }, opts || {})); }, state: S, runLocal: function () { runLocal(); }, runFull: runFull, beforePublish: function () { if (!B) return; runLocal(); var c = counts(); if (c.critical + c.blocking) B.toast(c.critical + c.blocking + " problème(s) critique(s) de qualité détecté(s) : consultez le rapport (icône bouclier). La publication reste possible.", true); } };
})();

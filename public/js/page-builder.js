// Page Builder KOLAKISA (Site Web / Tunnels). Le canevas affiche le RENDU RÉEL de la page (même gabarit que la page
// publiée, calculé par le serveur à chaque modification) ; ce script gère le modèle (sections et éléments imbriqués),
// la sélection synchronisée canevas ↔ calques, le glisser-déposer, l'édition directe des textes, l'inspecteur (styles
// par écran et par état), la barre contextuelle, l'historique, la médiathèque, les composants, les blocs, l'aperçu, la
// palette de commandes et la sauvegarde automatique du brouillon. Le serveur valide chaque valeur : rien n'est affiché
// qui ne soit enregistré tel quel. Aucun HTML venant de l'utilisateur n'est inséré dans l'interface de l'éditeur
// (textContent / value) ; le texte riche est assaini par le serveur avant d'apparaître dans la page.
(function () {
  "use strict";
  var boot = JSON.parse(document.getElementById("pb-boot").textContent);
  var SPEC = boot.spec;
  var PAGE = boot.page;
  // Édition de la source d'un composant (en-tête, pied de page…) : mêmes écrans, adresses propres au composant, pas de publication
  var IS_COMPONENT = Boolean(PAGE.component);
  var BASE = PAGE.base || "/marketing/pages/" + PAGE.id;
  var canWrite = boot.canWrite;
  var REVIEW = boot.review || null; // demande de validation en cours (page d'une personne qui ne peut pas publier)
  var NT = {}; SPEC.types.forEach(function (t) { NT[t.type] = t; });
  var LEGACY = {}; boot.types.forEach(function (t) { LEGACY[t.type] = t; });
  var SP = {}; SPEC.styleProps.forEach(function (p) { SP[p.key] = p; });
  var BPS = SPEC.breakpoints.map(function (b) { return b.key; });
  // Hiérarchie des écrans : la tablette hérite de l'ordinateur, le mobile de la tablette, le grand écran de l'ordinateur (il ne passe jamais par la tablette ni le mobile)
  var DEVICE_PARENT = { tablet: "desktop", mobile: "tablet", wide: "desktop" };
  function ancestors(dev) { var out = []; for (var d = DEVICE_PARENT[dev]; d; d = DEVICE_PARENT[d]) out.push(d); return out; }
  var bpLabel = function (k) { return SPEC.breakpoints.find(function (b) { return b.key === k; }).label; };
  var components = boot.components.slice();

  // ---------- Outils ----------
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var clone = function (v) { return JSON.parse(JSON.stringify(v)); };
  // Fait défiler SEULEMENT le conteneur défilant le plus proche de l'élément (la liste, ou le document du canevas s'il est dans le cadre).
  // Element.scrollIntoView fait aussi défiler tous les ancêtres, fenêtre comprise : en disposition empilée (≤ 1100 px) sélectionner un bloc
  // faisait sauter toute la page de ~350 px (barre d'outils hors de l'écran). Le défilement natif est conservé (il gère le zoom, les
  // transformations…) ; la position des autres ancêtres est ensuite rétablie. Mesuré dans Chrome (scripts/audit-editeurs.js).
  function scrollInside(el, smooth) {
    if (!el || !el.isConnected) return;
    var doc = el.ownerDocument, scroller = null, others = [];
    for (var p = el.parentElement; p; p = p.parentElement) {
      var cs = doc.defaultView.getComputedStyle(p);
      if (!scroller && /(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight && p !== doc.documentElement && p !== doc.body) scroller = p;
      else others.push([p, p.scrollTop, p.scrollLeft]);
    }
    var inFrame = doc !== document, wx = window.scrollX, wy = window.scrollY;
    el.scrollIntoView({ block: "nearest", behavior: smooth ? "smooth" : "auto" });
    // le document du cadre (le canevas) est le seul « conteneur » voulu quand l'élément y est ; sinon on rétablit tout ce qui est au-dessus du conteneur trouvé
    others.forEach(function (o) { if (!(inFrame && (o[0] === doc.documentElement || o[0] === doc.body))) { o[0].scrollTop = o[1]; o[0].scrollLeft = o[2]; } });
    if (window.scrollX !== wx || window.scrollY !== wy) window.scrollTo(wx, wy);
  }
  var newId = function () { var a = new Uint8Array(6); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("pb:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("pb:" + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } },
  };
  // Comportement des accordéons : réglage d'interface (mémorisé dans ce navigateur, jamais dans le document de la page)
  if (window.KWAccordion) window.KWAccordion.configure({ get: function () { return store.get("acc-mode", "many"); }, set: function (v) { store.set("acc-mode", v); } });
  function h(tag, attrs) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v;
      else if (k === "value") el.value = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.keys(v).forEach(function (d) { el.dataset[d] = v[d]; });
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c === null || c === undefined || c === false) continue;
      (Array.isArray(c) ? c : [c]).forEach(function (x) { if (x !== null && x !== undefined && x !== false) el.appendChild(typeof x === "string" ? document.createTextNode(x) : x); });
    }
    return el;
  }
  // Les modèles d'icônes ne changent pas : on les retrouve une seule fois (le calque est reconstruit à chaque modification, une recherche
  // dans le document par icône y coûtait l'essentiel du temps)
  var iconTemplates = {};
  function icon(name) {
    var t = iconTemplates[name] || (iconTemplates[name] = document.querySelector('template[data-pb-icon="' + name + '"]'));
    return t ? t.content.firstElementChild.cloneNode(true) : h("span", { "aria-hidden": "true" });
  }
  var toastTimer = null;
  function toast(text, isError) {
    var t = $("[data-pb-toast]");
    t.textContent = text;
    t.classList.toggle("is-error", Boolean(isError));
    if (window.KolMotion) window.KolMotion.cancelLeave(t);
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (window.KolMotion) window.KolMotion.leave(t, "fade"); t.hidden = true; }, isError ? 6500 : 3200);
  }
  // MEDIA-ROUTING : les appels à la médiathèque portent le site de la page (balise mk-media-site : son site, ou « principal ») ; le serveur le revérifie
  function mediaSiteUrl(url) {
    if (!/^\/marketing\/site-web\/medias/.test(url) || /[?&]site=/.test(url)) return url;
    var m = document.querySelector('meta[name="mk-media-site"]'), v = m && m.getAttribute("content");
    return /^(?:\d{1,12}|principal)$/.test(String(v || "")) ? url + (url.indexOf("?") >= 0 ? "&" : "?") + "site=" + v : url;
  }
  function api(method, url, body, isForm) {
    url = mediaSiteUrl(url);
    var opts = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body && isForm) opts.body = body;
    else if (body) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body); }
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
        if (!r.ok) {
          var msg = data && data.error ? (typeof data.error === "string" ? data.error : data.error.message) : "Erreur du serveur (" + r.status + ").";
          var err = new Error(msg); err.status = r.status; err.code = data && data.error && data.error.code; throw err;
        }
        return data;
      });
    });
  }
  function apiFail(err) { toast(err.message || "La requête a échoué.", true); }

  // ---------- Modèle : sections (racine) et éléments imbriqués ----------
  var content = clone(boot.content);
  var CONTAINERS = SPEC.types.filter(function (t) { return t.container; }).map(function (t) { return t.type; });
  // Section ou élément ? Certaines sections prêtes portent le nom d'un élément (texte, image, liste, bouton…) : une
  // section se reconnaît à sa place (racine de la page) ou à sa marque (section pas encore placée, copiée, déplacée)
  var SECTION_MARK = new WeakSet();
  var markSection = function (it) { if (it && typeof it === "object") SECTION_MARK.add(it); return it; };
  var isNode = function (it) { return Boolean(it && NT[it.type] && !it.section && !SECTION_MARK.has(it) && (!content || content.sections.indexOf(it) < 0)); };
  var kidsOf = function (it) { return it && (it.type === "layout" || CONTAINERS.indexOf(it.type) >= 0) ? (it.children || (it.children = [])) : null; };
  function ensureIds(list) {
    (list || []).forEach(function (it) {
      if (!it.id) it.id = newId();
      var k = kidsOf(it);
      if (k) ensureIds(k);
    });
  }
  // Nouveaux identifiants pour une copie. `map` (ancien → nouveau) permet ensuite de rediriger les interactions de la copie vers les
  // copies de leurs cibles (voir reIdAll) : sans cela, une copie continuerait à piloter les éléments d'origine.
  // Une ancre est unique dans la page : une copie la perd, SAUF « Ancre de menu » dont le nom est obligatoire (sans lui le serveur refuse tout le brouillon) :
  // elle reçoit un nom voisin et libre (tarifs → tarifs-2). `pendingAnchors` retient les noms donnés pendant la même copie.
  var pendingAnchors = {};
  function freeAnchor(base) {
    var taken = {}; walk(function (x) { if (x.anchor) taken[x.anchor] = true; });
    for (var n = 2; n < 1000; n++) { var suffix = "-" + n, name = base.slice(0, 40 - suffix.length) + suffix; if (!taken[name] && !pendingAnchors[name]) { pendingAnchors[name] = true; return name; } }
    return base;
  }
  function reId(it, map) { var old = it.id; it.id = newId(); if (map && old) map[old] = it.id; delete it.locked; if (it.type === "menuanchor" && it.anchor) it.anchor = freeAnchor(it.anchor); else delete it.anchor; var k = kidsOf(it); if (k) k.forEach(function (c) { reId(c, map); }); return it; }
  function remapInteractions(it, map) {
    if (it.interactions) it.interactions.forEach(function (x) { if (map[x.target]) x.target = map[x.target]; });
    var k = kidsOf(it); if (k) k.forEach(function (c) { remapInteractions(c, map); });
  }
  function reIdAll(items) { var map = {}; pendingAnchors = {}; items.forEach(function (it) { reId(it, map); }); items.forEach(function (it) { remapInteractions(it, map); }); return items; }
  // Retire les interactions dont la cible vient d'être supprimée (dans le même pas d'historique : annuler les rétablit)
  function dropInteractionsTo(removed) {
    walk(function (it) {
      if (!it.interactions) return;
      var kept = it.interactions.filter(function (x) { return !removed[x.target]; });
      if (kept.length === it.interactions.length) return;
      if (kept.length) it.interactions = kept; else delete it.interactions;
    });
  }
  ensureIds(content.sections);
  // Dernière version ENREGISTRÉE de la page (voir « Réinitialisation » plus bas) : référence des icônes de réinitialisation
  var KR = window.KWReset;
  var saved = new KR.Baseline();
  saved.set(content.sections);
  // Recherche d'un élément : { item, list, index, parent (null = racine), depth, ancestors }
  function locate(id, list, parent, depth, ancestors) {
    list = list || content.sections; depth = depth || 0; ancestors = ancestors || [];
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      if (it.id === id) return { item: it, list: list, index: i, parent: parent || null, depth: depth, ancestors: ancestors };
      var k = kidsOf(it);
      if (k) { var r = locate(id, k, it, depth + 1, ancestors.concat(it)); if (r) return r; }
    }
    return null;
  }
  var byId = function (id) { var l = locate(id); return l ? l.item : null; };
  function walk(fn, list, parent, depth) {
    (list || content.sections).forEach(function (it) {
      fn(it, parent || null, depth || 0);
      var k = kidsOf(it);
      if (k) walk(fn, k, it, (depth || 0) + 1);
    });
  }
  function typeLabel(it) {
    if (!it) return "";
    if (it.type === "layout") return "Section libre";
    if (it.type === "component") return "Composant";
    return NT[it.type] ? NT[it.type].label : LEGACY[it.type] ? LEGACY[it.type].label : it.type;
  }
  function preview(it) {
    var p = it.props || {};
    var t = p.text || p.label || (p.html ? p.html.replace(/<[^>]+>/g, " ") : "") || it.title || it.heading || it.label || "";
    return String(t).replace(/\s+/g, " ").trim().slice(0, 40);
  }
  var nameOf = function (it) { return it.name || (preview(it) && it.type !== "layout" ? typeLabel(it) + " · " + preview(it) : typeLabel(it)); };
  function lockedDeep(id) { var l = locate(id); if (!l) return false; return Boolean(l.item.locked || l.ancestors.some(function (a) { return a.locked; })); }
  function topOf(id) { var l = locate(id); return l ? (l.ancestors[0] || l.item) : null; }
  var sectionIndex = function (s) { return content.sections.indexOf(s); };

  // ---------- État de l'éditeur ----------
  var selection = [];
  var navListeners = [];            // gestionnaire de menu (page-builder-menu.js) : prévenu à chaque modification ou sélection
  var device = "desktop";           // écran affiché ET modifié (styles par écran)
  var styleState = "normal";        // normal | hover | focus | active
  var revision = PAGE.revision, hasDraft = PAGE.hasDraft, status = PAGE.status;
  var collapsed = store.get("collapsed-" + PAGE.id, {});
  var editing = null;               // édition directe en cours dans le canevas
  var clipboard = null, styleClipboard = null;
  var tool = "select";              // select | hand
  var zoom = 1, zoomFit = false;
  var aids = store.get("aids", { grid: false, outlines: false, rulers: false, snap: true });
  // Règles, grille et magnétisme : réglages d'interface propres à ce navigateur (jamais enregistrés dans le contenu de la page).
  // Les quatre interrupteurs principaux (règles, guides, grille, magnétisme) restent dans `aids` ; le détail est ici.
  var KS = window.KWSnap;
  var snapPrefs = KS.normalize(store.get("snapcfg", null));
  var saveSnapPrefs = function () { store.set("snapcfg", snapPrefs); };
  function effPrefs() {
    var p = Object.assign({}, snapPrefs);
    p.show = Object.assign({}, snapPrefs.show, { rulers: Boolean(aids.rulers), guides: aids.guides !== false, grid: Boolean(aids.grid) });
    p.snap = Object.assign({}, snapPrefs.snap, { on: Boolean(aids.snap) });
    return p;
  }
  var panels = store.get("panels", { left: 260, right: 340, layers: 46, leftHidden: false, rightHidden: false });
  var frame = $("[data-pb-frame]");
  var stage = $("[data-pb-stage]");
  var wrap = $("[data-pb-frame-wrap]");
  var dirty = false, blocked = false, saving = false, saveTimer = null, inflight = null; // inflight : la requête d'enregistrement en cours

  // ---------- Historique (annuler / rétablir) ----------
  var past = [], future = [], lastKey = null;
  // Libellés de l'historique (même ordre que past / future) : ce que chaque étape a fait, et quand
  var pastLabels = [], futureLabels = [], nextLabel = null;
  var snapshot = function () { return JSON.stringify({ sections: content.sections, title: content.title, description: content.description, seo: content.seo, theme: content.theme, selection: selection }); };
  function restore(snap) {
    var s = JSON.parse(snap);
    content.sections = s.sections; content.title = s.title; content.description = s.description; content.seo = s.seo; content.theme = s.theme;
    selection = s.selection.filter(function (id) { return byId(id); });
  }
  // Une modification : l'état précédent part dans l'historique. Les frappes successives dans un même champ (clé
  // identique) forment UNE seule étape d'annulation.
  function change(fn, opts) {
    opts = opts || {};
    if (!canWrite || probing) return false;
    // Même clé que la modification précédente (frappes, glissement de curseur) : pas de nouvelle copie du document
    var before = opts.key && opts.key === lastKey ? null : snapshot();
    var label = opts.label || nextLabel || "Modification";
    nextLabel = null;
    if (fn() === false) return false;
    if (!opts.key || opts.key !== lastKey) {
      past.push(before);
      pastLabels.push({ label: label, at: Date.now() });
      if (past.length > 150) { past.shift(); pastLabels.shift(); }
      future = []; futureLabels = [];
    } else if (pastLabels.length) pastLabels[pastLabels.length - 1].at = Date.now();
    lastKey = opts.key || null;
    afterChange(opts.light, !opts.key && !opts.light);
    return true;
  }
  function undo() { if (!past.length) return; future.push(snapshot()); futureLabels.push(pastLabels.pop()); restore(past.pop()); lastKey = null; afterChange(false, true); }
  function redo() { if (!future.length) return; past.push(snapshot()); pastLabels.push(futureLabels.pop()); restore(future.pop()); lastKey = null; afterChange(false, true); }
  // Revenir à un point de l'historique (n étapes en arrière ou en avant)
  function travel(steps) { var n = Math.abs(steps); for (var i = 0; i < n; i++) { if (steps < 0) undo(); else redo(); } }
  function openHistory(anchor) {
    var r = anchor.getBoundingClientRect();
    var t = function (ms) { return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
    // Cliquer une action ramène la page à l'état juste APRÈS cette action (les actions suivantes restent rétablissables)
    var entries = [{ heading: "Historique des actions (" + pastLabels.length + ")" }];
    futureLabels.slice().reverse().forEach(function (l, i) { var ahead = futureLabels.length - i; entries.push(["↷ " + l.label, function () { travel(ahead); }, !canWrite, t(l.at), "is-future"]); });
    pastLabels.slice().reverse().forEach(function (l, i) { entries.push([(i === 0 ? "● " : "") + l.label + (i === 0 ? " (état actuel)" : ""), function () { travel(-i); }, !canWrite || i === 0, t(l.at), i === 0 ? "is-current" : null]); });
    if (pastLabels.length) entries.push(["Début de la session (avant ces modifications)", function () { travel(-pastLabels.length); }, !canWrite]);
    else if (!futureLabels.length) entries.push(["Aucune modification pour l'instant", function () {}, true]);
    showMenuEntries(entries.slice(0, 60), r.left, r.bottom + 4, { wide: true });
  }
  // light : saisie dans un champ de l'inspecteur (il n'est pas redessiné, sinon le curseur serait perdu)
  // Saisie (light) : les calques sont redessinés au plus une fois par pause de frappe ; le reste suit tout de suite
  var treeTimer = null;
  function scheduleTree() { clearTimeout(treeTimer); treeTimer = setTimeout(renderTree, 120); }
  // Un rendu secondaire (calques, inspecteur, réglages…) qui échoue ne doit JAMAIS empêcher le rendu du canevas ni l'enregistrement
  // d'une modification déjà appliquée au document : chaque étape est isolée, l'erreur est signalée dans la console.
  function guarded(fn) { try { fn(); } catch (err) { if (window.console) console.error("[KOLAKISA] rendu de l'éditeur :", err); } }
  var docVersion = 0; // compteur de modifications du document (résultats de l'inspecteur de qualité : actuels ou obsolètes)
  function afterChange(light, quick) {
    docVersion++;
    resetMemo = {};
    guarded(function () { if (light) scheduleTree(); else { clearTimeout(treeTimer); renderTree(); } });
    if (!light) { guarded(renderInspector); guarded(renderContext); guarded(refreshPageSettings); }
    guarded(updateHistoryButtons);
    guarded(scheduleHistorySave);
    guarded(refreshStart);
    if (!light) { guarded(placeCanvasBar); guarded(renderDoc); } // saisie : la barre est replacée avec les repères, juste après le rendu du canevas
    scheduleRender(quick);
    scheduleSave();
    navListeners.forEach(function (f) { guarded(f); });
    guarded(refreshResets);
  }
  // ---------- Historique conservé après rechargement ----------
  // L'historique (étapes + libellés) est copié dans ce navigateur (localStorage « pb-history-<page> ») avec l'empreinte du document auquel il
  // s'applique. Au rechargement il n'est repris QUE si le document chargé est identique à cette empreinte : sinon (page modifiée ailleurs, version
  // restaurée…) il est écarté, jamais appliqué à un autre contenu. Taille plafonnée : les étapes les plus anciennes partent d'abord.
  var HISTORY_KEY = "pb-history-" + PAGE.id, HISTORY_MAX_CHARS = 2000000, historyTimer = null;
  function docKey() { return JSON.stringify({ sections: content.sections, title: content.title, description: content.description, seo: content.seo, theme: content.theme }); }
  function writeHistory() {
    clearTimeout(historyTimer); historyTimer = null;
    try {
      if (!canWrite || (!past.length && !future.length)) { localStorage.removeItem(HISTORY_KEY); return; }
      var p = past.slice(), pl = pastLabels.slice(), f = future.slice(), fl = futureLabels.slice();
      var size = function () { var n = 0; p.forEach(function (x) { n += x.length; }); f.forEach(function (x) { n += x.length; }); return n; };
      var total = size();
      while (total > HISTORY_MAX_CHARS && p.length) { total -= p[0].length; p.shift(); pl.shift(); }
      while (total > HISTORY_MAX_CHARS && f.length) { total -= f[0].length; f.shift(); fl.shift(); }
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ cur: docKey(), past: p, pastLabels: pl, future: f, futureLabels: fl }));
    } catch (e) { try { localStorage.removeItem(HISTORY_KEY); } catch (e2) { /* stockage indisponible */ } }
  }
  function scheduleHistorySave() { clearTimeout(historyTimer); historyTimer = setTimeout(writeHistory, 800); }
  // Reprise : renvoie vrai si l'historique enregistré correspond exactement au document courant
  function restoreHistory() {
    if (!canWrite) return false;
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || "null"); } catch (e) { raw = null; }
    if (!raw || raw.cur !== docKey() || !Array.isArray(raw.past) || !Array.isArray(raw.future) || raw.past.length !== (raw.pastLabels || []).length || raw.future.length !== (raw.futureLabels || []).length) return false;
    past = raw.past; pastLabels = raw.pastLabels; future = raw.future; futureLabels = raw.futureLabels; lastKey = null;
    updateHistoryButtons();
    return true;
  }
  window.addEventListener("pagehide", function () { if (historyTimer) writeHistory(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden" && historyTimer) writeHistory(); });
  function updateHistoryButtons() {
    $("[data-pb-undo]").disabled = !past.length || !canWrite;
    $("[data-pb-redo]").disabled = !future.length || !canWrite;
  }

  // ---------- Réinitialisation : revenir à la dernière version ENREGISTRÉE ----------
  // Référence (« saved ») : la page telle qu'elle était à l'ouverture, puis telle qu'elle est après chaque enregistrement
  // demandé (bouton Enregistrer, Ctrl/⌘ + S, publication). L'enregistrement automatique protège le travail mais ne déplace
  // pas la référence. Un élément est modifié quand la valeur actuelle de l'un de ses réglages diffère de la référence
  // (après normalisation : « #F00 » = « rgb(255,0,0) »). Un élément créé depuis n'a pas de référence : pas d'icône.
  // Trois sortes de retour, distinctes : cette réinitialisation (dernière valeur enregistrée), l'icône ↺ des champs de style
  // (retirer la valeur propre à l'écran pour retrouver l'héritage) et les valeurs par défaut du widget.
  var probing = null;               // lecture à blanc d'un champ pour savoir quel réglage il écrit (rien n'est modifié)
  var resetMemo = {};               // réglages modifiés par élément, recalculés à chaque modification
  var resetBtns = [];               // icônes affichées dans l'inspecteur (leur visibilité suit l'état réel)
  var inspItem = null;              // élément dont l'inspecteur est en cours de dessin
  // États PAR ÉCRAN : « hover » = ordinateur (données d'origine inchangées), « hover@tablet » / « hover@mobile » = réglages propres à cet écran (même format que le serveur : nodes.js STATE_SCOPES)
  var stateKey = function (state, dev) { return !dev || dev === "desktop" ? state : state + "@" + dev; };
  var stylePath = function (key) { return (styleState === "normal" ? "s:" + device : "t:" + stateKey(styleState, device)) + ":" + key; };
  function commitSaved(json) {
    if (json === undefined) saved.set(content.sections); else saved.setJson(json);
    resetMemo = {};
    refreshResets(); placeCanvasBar();
  }
  function changedPaths(it) {
    if (!it || !canWrite) return [];
    var m = resetMemo[it.id];
    if (m) return m;
    var base = saved.get(it.id);
    return (resetMemo[it.id] = base ? KR.diff(it, base, isNode(it)) : []);
  }
  // Réglages modifiés des descendants : { total, kids, list: [{ id, paths }] }
  function subtreeChanges(it) {
    var memo = resetMemo["deep:" + it.id];
    if (memo) return memo;
    var out = resetMemo["deep:" + it.id] = { total: 0, kids: 0, list: [] };
    (kidsOf(it) || []).forEach(function (c) {
      var ps = changedPaths(c);
      if (ps.length) { out.total += ps.length; out.kids++; out.list.push({ id: c.id, paths: ps }); }
      var d = subtreeChanges(c);
      out.total += d.total; out.kids += d.kids; out.list = out.list.concat(d.list);
    });
    return out;
  }
  var plural = function (n, one, many) { return n + " " + (n > 1 ? many : one); };
  function restorePaths(list, label) {
    list = list.filter(function (x) { return x.paths.length; });
    if (!list.length) return;
    if (list.some(function (x) { return lockedDeep(x.id); })) { toast("Élément verrouillé : déverrouillez-le d'abord.", true); return; }
    change(function () {
      var any = false;
      list.forEach(function (x) { var it = byId(x.id), base = saved.get(x.id); if (it && base) { KR.restore(it, base, x.paths, isNode(it)); any = true; } });
      if (!any) return false;
    }, { label: label });
  }
  function paintRestore(b, ch) {
    var ps = b._scope(ch);
    b.classList.toggle("is-on", ps.length > 0);
    if (ps.length) { var tip = b._tip(ps); b.setAttribute("aria-label", tip); b.setAttribute("data-tip", tip); b.tabIndex = 0; } else b.tabIndex = -1;
  }
  function refreshResets() {
    if (!resetBtns.length) return;
    resetBtns = resetBtns.filter(function (b) { return b.isConnected; });
    var it = selection.length === 1 ? byId(selection[0]) : null;
    var ch = it ? changedPaths(it) : [];
    resetBtns.forEach(function (b) { paintRestore(b, ch); });
  }
  // Icône de réinitialisation : présente dans le DOM mais invisible (donc sans décalage) tant que son réglage n'a pas changé
  function restoreButton(it, scope, tip, onClick, cls) {
    if (!canWrite || selection.length !== 1 || !saved.has(it.id)) return null;
    var b = h("button", { type: "button", class: "pb-restore" + (cls ? " " + cls : "") }, icon("undo"));
    b._scope = scope; b._tip = typeof tip === "function" ? tip : function () { return tip; };
    b.addEventListener("click", function (e) {
      e.preventDefault(); e.stopPropagation(); hideTip();
      var cur = byId(it.id);
      if (onClick) onClick(cur, b); else restorePaths([{ id: it.id, paths: scope(changedPaths(cur)) }], "Restaurer la dernière valeur enregistrée");
    });
    resetBtns.push(b);
    paintRestore(b, changedPaths(it));
    return b;
  }
  // Un réglage de style de l'écran (et de l'état) affiché
  function styleRestore(it, key) {
    var path = stylePath(key), where = device !== "desktop" || styleState !== "normal" ? " (" + (device !== "desktop" ? bpLabel(device) : "") + (device !== "desktop" && styleState !== "normal" ? ", " : "") + (styleState !== "normal" ? styleState : "") + ")" : "";
    return restoreButton(it, function (ch) { return ch.indexOf(path) >= 0 ? [path] : []; }, "Restaurer la dernière valeur enregistrée" + where);
  }
  // Un groupe de réglages de style (écran et état affichés) : seuls ses réglages modifiés sont restaurés
  function groupRestore(it, group, keys) {
    var kind = styleState === "normal" ? "s" : "t", scopeName = styleState === "normal" ? device : stateKey(styleState, device);
    var all = keys.concat(Object.keys(SP).filter(function (k) { return SP[k].group === group; }));
    return restoreButton(it, function (ch) {
      return ch.filter(function (p) { var q = KR.parsePath(p); return q.kind === kind && q.scope === scopeName && all.indexOf(q.key) >= 0; });
    }, function (ps) { return "Restaurer les " + plural(ps.length, "réglage modifié", "réglages modifiés") + " de ce groupe"; }, null, "pb-restore-group");
  }
  // Un champ de contenu : on lit à blanc ce que son rappel écrirait pour savoir de quel réglage il s'agit
  function withRestore(el, probe) {
    var it = inspItem;
    if (!it || !el || !saved.has(it.id) || selection.length !== 1 || !canWrite) return el;
    var rec = [];
    probing = rec;
    try { probe(); } catch (e) { /* champ sans réglage propre */ }
    probing = null;
    if (!rec.length) return el;
    var b = restoreButton(it, function (ch) { return ch.filter(function (p) { return rec.indexOf(p) >= 0; }); }, "Restaurer la dernière valeur enregistrée");
    if (b) { el.classList.add("pb-has-restore"); el.appendChild(b); }
    return el;
  }
  // Tout l'élément : ses seuls réglages, ou aussi ceux de ses enfants (choix explicite, périmètre annoncé)
  function resetElement(it, btn) {
    var own = changedPaths(it), deep = subtreeChanges(it);
    var label = "Réinitialiser « " + nameOf(it) + " »";
    if (!own.length && !deep.total) return;
    if (!deep.total) { restorePaths([{ id: it.id, paths: own }], label); return; }
    var r = btn.getBoundingClientRect();
    var entries = [{ heading: "Réinitialiser les modifications non enregistrées" }];
    if (own.length) entries.push(["Cet élément seulement (" + plural(own.length, "réglage", "réglages") + ")", function () { restorePaths([{ id: it.id, paths: own }], label); }]);
    entries.push([(own.length ? "Cet élément et " : "") + "ses enfants modifiés : " + plural(deep.kids, "enfant", "enfants") + ", " + plural(own.length + deep.total, "réglage", "réglages"),
      function () { restorePaths([{ id: it.id, paths: own }].concat(deep.list), label + " et ses enfants"); }]);
    showMenuEntries(entries, r.left, r.bottom + 4, { wide: true });
  }
  var elementResetCount = function (it) { var d = subtreeChanges(it); return changedPaths(it).length + d.total; };
  function elementRestore(it, cls) {
    return restoreButton(it, function (ch) { var d = subtreeChanges(it); return ch.length || d.total ? [1] : []; }, function () {
      var own = changedPaths(it).length, d = subtreeChanges(it);
      return "Réinitialiser les modifications non enregistrées" + (own ? " (" + plural(own, "réglage", "réglages") + (d.total ? " et celles de ses enfants" : "") + ")" : " de ses enfants");
    }, resetElement, cls);
  }

  // ---------- Sélection ----------
  function select(id, additive, opts) {
    opts = opts || {};
    if (editing && (!id || id !== editing.id)) commitEdit();
    if (!id) selection = [];
    else if (additive) selection = selection.indexOf(id) >= 0 ? selection.filter(function (x) { return x !== id; }) : selection.concat(id);
    else selection = [id];
    var geo = mode === "structure" ? null : readOverlayGeo(); // lectures AVANT toute écriture (arbre, inspecteur, classes du canevas)
    if (id && !additive) revealInTree(id);
    styleState = "normal";
    markTreeSelection();
    renderInspector();
    renderContext();
    markCanvasSelection(opts.scroll !== false, geo);
    markDocSelection(opts.scroll !== false);
    navListeners.forEach(function (f) { f(); });
  }
  var selectedItems = function () { return selection.map(byId).filter(Boolean); };
  function revealInTree(id) {
    var l = locate(id);
    if (!l) return;
    var changed = false;
    l.ancestors.forEach(function (a) { if (collapsed[a.id]) { delete collapsed[a.id]; changed = true; } });
    if (changed) { store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  }

  // ---------- Widgets réservés (cadenas de la bibliothèque) ----------
  // Sans la permission exigée, un widget réservé ne s'ajoute pas (ni par copier-coller, duplication, bloc ou composant) ;
  // ceux déjà dans la page au chargement restent déplaçables. Le serveur refuse aussi l'enregistrement (même règle).
  function deniedWidget(type) { var need = NT[type] && NT[type].requires; return need && !(boot.perms || {})[need] ? need : null; }
  var lockedBaseline = {};
  walk(function (n) { if (isNode(n) && deniedWidget(n.type)) lockedBaseline[n.id] = JSON.stringify(n.props || {}); });
  function refusesLockedWidget(items) {
    var bad = null;
    var check = function (n) { if (!bad && isNode(n) && deniedWidget(n.type) && lockedBaseline[n.id] !== JSON.stringify(n.props || {})) bad = n; };
    items.forEach(function (it) { check(it); if (kidsOf(it)) walk(check, kidsOf(it)); });
    if (bad) toast("« " + NT[bad.type].label + " » : " + SPEC.widgetPermissions[deniedWidget(bad.type)] + ".", true);
    return Boolean(bad);
  }

  // ---------- Placement (règles de structure) ----------
  // Racine : uniquement des sections. Section libre et conteneurs : uniquement des éléments. Un élément posé à la racine
  // est placé dans une nouvelle section libre (jamais d'élément orphelin).
  // Limites de la page, annoncées par le serveur (SPEC.limits) : vérifiées AVANT d'insérer, pour un message immédiat. Sans cela, l'ajout
  // était accepté à l'écran puis refusé à l'enregistrement (« Trop d'éléments ») et le travail restait non enregistré.
  function nodeTotal() { var n = 0; walk(function (x) { if (isNode(x)) n++; }); return n; }
  function nodesIn(it) { return (isNode(it) ? 1 : 0) + countDeep(it); }
  function heightOf(it) { var k = kidsOf(it), m = 0; (k || []).forEach(function (c) { m = Math.max(m, heightOf(c)); }); return isNode(it) ? 1 + m : m; }
  function exceedsLimits(parent, items) {
    var lim = SPEC.limits || {};
    if (lim.nodes && nodeTotal() + items.reduce(function (n, it) { return n + nodesIn(it); }, 0) > lim.nodes) { toast("Une page compte au plus " + lim.nodes + " éléments : supprimez-en avant d'en ajouter.", true); return true; }
    if (lim.depth) {
      var base = parent ? locate(parent.id).depth : 0; // section = 0, ses éléments = 1
      if (items.some(function (it) { return base + heightOf(it) > lim.depth; })) { toast("Les éléments ne peuvent pas être imbriqués sur plus de " + lim.depth + " niveaux.", true); return true; }
    }
    return false;
  }
  function insertInto(parent, index, items) {
    if (refusesLockedWidget(items)) return null;
    if (exceedsLimits(parent, items)) return null;
    if (parent === null) {
      var sections = [], pending = [];
      items.forEach(function (it) { if (isNode(it)) pending.push(it); else { if (pending.length) { sections.push({ id: newId(), type: "layout", children: pending }); pending = []; } sections.push(it); } });
      if (pending.length) sections.push({ id: newId(), type: "layout", children: pending });
      if (content.sections.length + sections.length > 30) { toast("Une page compte au plus 30 sections.", true); return null; }
      Array.prototype.splice.apply(content.sections, [index, 0].concat(sections));
      return items;
    }
    var k = kidsOf(parent);
    if (!k || items.some(function (it) { return !isNode(it); })) { toast("Une section ne se place pas dans un conteneur : seuls les éléments s'y placent.", true); return null; }
    Array.prototype.splice.apply(k, [index, 0].concat(items));
    return items;
  }
  // Où ajouter un nouvel élément : dans le conteneur sélectionné, sinon après la sélection, sinon en fin de page
  function insertionPoint(it) {
    var l = selection.length ? locate(selection[selection.length - 1]) : null;
    if (isNode(it) && l) {
      if (kidsOf(l.item) && !lockedDeep(l.item.id)) return { parent: l.item, index: kidsOf(l.item).length };
      if (l.parent && !lockedDeep(l.parent.id)) return { parent: l.parent, index: l.index + 1 };
    }
    var top = l ? (l.ancestors[0] || l.item) : null;
    return { parent: null, index: top ? sectionIndex(top) + 1 : content.sections.length };
  }
  function addItems(items, at, label) {
    items.forEach(function (it) { ensureIds([it]); });
    var p = at || insertionPoint(items[0]);
    if (p.parent && lockedDeep(p.parent.id)) { toast("Emplacement verrouillé : déverrouillez-le d'abord.", true); return; }
    nextLabel = label || "Ajout : " + (items.length === 1 ? typeLabel(items[0]) : items.length + " éléments");
    change(function () {
      if (!insertInto(p.parent, p.index, items)) return false;
      selection = items.map(function (it) { return it.id; });
    });
    markCanvasSelection(false);
  }
  function newNode(type, extra) {
    var t = NT[type];
    var n = Object.assign({ type: type }, clone(t.blank), extra || {});
    if (t.container && !n.children) n.children = [];
    ensureIds([n]);
    return n;
  }
  // Ajout d'un élément du registre (demande la donnée réelle si besoin : image, vidéo, formation…)
  function addElement(type, at) {
    if (!canWrite) return;
    if (type === "layout") return addItems([{ type: "layout", children: [newNode("container")] }], at && at.parent === null ? at : { parent: null, index: insertionPoint({ type: "layout" }).index });
    var t = NT[type];
    if (!t) return addLegacy(type, at);
    if (t.asks === "image" && type === "hotspot") return openMedia({ title: "Image à points d'intérêt", onPick: function (m) {
      if (!m.alt) { toast("Ajoutez d'abord un texte de remplacement à cette image (dans la médiathèque).", true); return; }
      addItems([newNode("hotspot", { props: { src: m.path, alt: m.alt, spots: [{ x: 50, y: 50, title: "Point d'intérêt", text: "Ce qu'il faut savoir ici." }] } })], at);
    } });
    if (type === "imagebox") return openMedia({ title: "Image de la boîte", onPick: function (m) { addItems([newNode("imagebox", { props: { src: m.path, alt: m.alt || "", title: "Un titre clair", text: "Expliquez en une phrase ce que la personne y gagne." } })], at); } });
    if (t.asks === "form") {
      var fl = boot.forms || [];
      if (!fl.length) { toast("Créez d'abord un formulaire (Audience → Formulaires d'inscription).", true); return; }
      return ask("Formulaire", [["formId", "select", "Formulaire à afficher", false, fl.map(function (f) { return [f.id, f.name + (f.status === "published" ? "" : " (non publié)")]; })]], function (v) { addItems([newNode("signupform", { props: { formId: Number(v.formId), heading: "", intro: "", button: "S'inscrire" } })], at); });
    }
    if (t.asks === "rating") return ask("Évaluation (note réelle)", [["value", "text", "Note sur 5 (ex. 4,5)"], ["title", "text", "Libellé (facultatif, ex. Note des élèves)", true]], function (v) { addItems([newNode("rating", { props: { value: Number(String(v.value).replace(",", ".")), scale: 5, title: v.title || "" } })], at); });
    if (t.asks === "anchor") return ask("Ancre de menu", [["name", "text", "Nom de l'ancre (ex. tarifs) : les liens « #tarifs » mènent ici"]], function (v) {
      var a = String(v.name || "").trim().toLowerCase();
      if (!/^[a-z][a-z0-9-]{0,39}$/.test(a)) { toast("Nom invalide : lettres minuscules, chiffres et tirets, en commençant par une lettre.", true); return; }
      var taken = false; walk(function (x) { if (x.anchor === a) taken = true; });
      if (taken) { toast("L'ancre « " + a + " » est déjà utilisée sur cette page.", true); return; }
      addItems([newNode("menuanchor", { anchor: a })], at);
    });
    if (t.asks === "map") return ask("Google Maps", [["address", "text", "Adresse ou lieu (ex. 12 avenue de la Paix, Brazzaville)"]], function (v) { addItems([newNode("map", { props: { address: v.address, zoom: 14, height: 350 } })], at); });
    if (t.asks === "embed") return ask("Contenu intégré", [["url", "url", "Adresse (YouTube, Vimeo, Google Maps « Intégrer », Calendly, Spotify, SoundCloud, Google Forms, Typeform, Loom, Canva)"], ["title", "text", "Titre (lu par les lecteurs d'écran)"]], function (v) { addItems([newNode("embed", { props: v })], at); });
    if (t.asks === "image") return openMedia({ title: "Choisir l'image", onPick: function (m) { addItems([newNode("image", { props: m.alt ? { src: m.path, alt: m.alt } : { src: m.path, alt: "", decorative: true } })], at); if (!m.alt) toast("Image ajoutée comme décorative : ajoutez un texte de remplacement si elle porte une information."); } });
    if (t.asks === "images") return openMedia({ title: type === "carousel" ? "Images du carrousel (au moins deux)" : "Images de la galerie (plusieurs possibles)", multiple: true, onPick: function (list) {
      var missing = list.filter(function (m) { return !m.alt; });
      if (missing.length) { toast("Ajoutez d'abord un texte de remplacement aux images choisies (dans la médiathèque) : " + missing.map(function (m) { return m.name; }).join(", "), true); return; }
      if (type === "carousel" && list.length < 2) { toast("Un carrousel demande au moins deux images.", true); return; }
      addItems([newNode(type, { props: { images: list.map(function (m) { return { src: m.path, alt: m.alt }; }) } })], at);
    } });
    if (t.asks === "video") return ask("Nouvelle vidéo", [["url", "url", "Adresse (YouTube, Vimeo ou fichier vidéo https://)"], ["title", "text", "Titre (lu par les lecteurs d'écran)"]], function (v) { addItems([newNode("video", { props: v })], at); });
    if (t.asks === "audio") return ask("Nouveau fichier audio", [["src", "url", "Adresse https:// du fichier (.mp3, .m4a, .ogg, .wav)"], ["title", "text", "Titre (facultatif)", true]], function (v) { addItems([newNode("audio", { props: v })], at); });
    if (t.asks === "course") {
      if (!boot.courses.length) { toast("Publiez d'abord une formation dans le catalogue.", true); return; }
      return ask(type === "addtocart" ? "Formation à vendre" : type === "courserating" ? "Formation dont afficher les avis" : "Formation à présenter", [["courseId", "course", "Formation"]], function (v) { addItems([newNode(type, { props: type === "addtocart" ? { courseId: Number(v.courseId), mode: "cart", label: "Ajouter au panier" } : type === "courserating" ? { courseId: Number(v.courseId) } : { courseId: Number(v.courseId), cta: "Découvrir la formation" } })], at); });
    }
    addItems([newNode(type)], at);
  }
  // Raccourci de bibliothèque : crée un élément existant préréglé (le serveur le valide comme tout autre)
  function addShortcut(sc, at) {
    if (!canWrite) return;
    if (sc.preset) { addItems([newNode(sc.type, { props: clone(sc.preset) })], at); return; }
    ask(sc.label, [["url", "url", "Adresse de la page " + sc.label + " (ex. https://soundcloud.com/artiste/titre)"], ["title", "text", "Titre (lu par les lecteurs d'écran)"]], function (v) {
      if (!new RegExp(sc.pattern, "i").test(String(v.url || "").trim())) { toast("Adresse " + sc.label + " attendue (https://soundcloud.com/artiste/titre).", true); return; }
      addItems([newNode(sc.type, { props: { url: String(v.url).trim(), title: v.title } })], at);
    });
  }
  // Sections existantes (bandeau, formulaire, points forts…) : leur contenu de départ vient du serveur
  function addLegacy(type, at) {
    var t = LEGACY[type];
    if (!t) return;
    if (t.unavailable) { toast(t.unavailable, true); return; }
    if (type === "form" && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription.", true); return; }
    var where = at && at.parent === null ? at : { parent: null, index: insertionPoint({ type: type }).index };
    if (t.asks) return ask("Nouvelle vidéo", [["url", "url", "Adresse (YouTube, Vimeo ou fichier https://)"], ["title", "text", "Titre de la vidéo"]], function (v) { addItems([markSection({ type: "video", url: v.url, title: v.title, caption: "" })], where); });
    addItems([markSection(clone(t.blank))], where);
  }

  // ---------- Opérations sur la sélection ----------
  function refuseLocked(ids) {
    if (ids.some(lockedDeep)) { toast("Élément verrouillé : déverrouillez-le d'abord (cadenas dans les calques).", true); return true; }
    return false;
  }
  // Sélection sans doublons parent/enfant (un enfant d'un élément sélectionné suit son parent)
  function topLevelSelection(ids) {
    ids = ids || selection;
    return ids.filter(function (id) { var l = locate(id); return l && !l.ancestors.some(function (a) { return ids.indexOf(a.id) >= 0; }); });
  }
  function removeSelected() { removeItems(topLevelSelection()); }
  // Suppression (avec toute la descendance) : modèle, calques, canevas et sélection mis à jour ; annulable (Ctrl/⌘ + Z)
  function removeItems(ids) {
    ids = topLevelSelection(ids);
    if (!ids.length || refuseLocked(ids)) return;
    var label = ids.length === 1 ? "« " + nameOf(byId(ids[0])) + " »" : ids.length + " éléments";
    nextLabel = "Suppression : " + label;
    change(function () {
      var gone = {};
      ids.forEach(function (id) { var l = locate(id); if (l) { walk(function (x) { gone[x.id] = true; }, [l.item]); l.list.splice(l.index, 1); } });
      dropInteractionsTo(gone);
      selection = selection.filter(function (id) { return byId(id); });
    });
    markCanvasSelection(false);
    toast(label + " supprimé. Ctrl/⌘ + Z pour annuler.");
  }
  // Nombre d'éléments contenus (toute la descendance)
  function countDeep(it) { var n = 0; (kidsOf(it) || []).forEach(function (c) { n += 1 + countDeep(c); }); return n; }
  function duplicateSelected() {
    var ids = topLevelSelection();
    if (!ids.length) return;
    if (ids.some(function (id) { return !isNode(byId(id)); }) && content.sections.length + ids.length > 30) { toast("Une page compte au plus 30 sections.", true); return; }
    var made = reIdAll(ids.map(function (id) { return clone(byId(id)); }));
    if (refusesLockedWidget(made)) return;
    if (SPEC.limits && SPEC.limits.nodes && nodeTotal() + made.reduce(function (n, it) { return n + nodesIn(it); }, 0) > SPEC.limits.nodes) { toast("Une page compte au plus " + SPEC.limits.nodes + " éléments : supprimez-en avant d'en dupliquer.", true); return; }
    nextLabel = "Duplication";
    change(function () {
      ids.forEach(function (id, i) { var l = locate(id); l.list.splice(l.index + 1, 0, made[i]); });
      selection = made.map(function (c) { return c.id; });
    });
  }
  // Ancre d'un élément (lien direct #ancre) : vérifiée ici pour un message immédiat, revérifiée par le serveur
  function setAnchor(id, value) {
    var v = String(value || "").trim().toLowerCase();
    if (v && !/^[a-z][a-z0-9-]{0,39}$/.test(v)) { toast("Ancre invalide : lettres minuscules, chiffres et tirets, en commençant par une lettre.", true); renderInspector(); return; }
    var taken = false;
    walk(function (x) { if (x.id !== id && x.anchor === v) taken = true; });
    if (v && taken) { toast("L'ancre « " + v + " » est déjà utilisée sur cette page.", true); renderInspector(); return; }
    nextLabel = "Ancre";
    change(function () { var it = byId(id); if (v) it.anchor = v; else delete it.anchor; });
  }

  // ---------- Structures : colonnes et grille ----------
  // Largeur des colonnes : proportions (flex-grow) par écran, ramenées à une moyenne de 1 (1 / 1 = moitié-moitié).
  var MAX_COLS = 6;
  function growIn(c, devs) {
    for (var j = 0; j < devs.length; j++) { var s = c.styles && c.styles[devs[j]]; if (s && s.flexGrow !== undefined) return Number(s.flexGrow); }
    return 1;
  }
  function growAt(c, dev) { return growIn(c, [dev].concat(ancestors(dev))); }
  // Parts de la largeur (en %) de chaque colonne, pour l'écran modifié
  function columnShares(it) {
    var g = (kidsOf(it) || []).map(function (c) { return growAt(c, device); });
    var tot = g.reduce(function (a, b) { return a + b; }, 0) || 1;
    return g.map(function (x) { return x / tot * 100; });
  }
  // Enregistre des parts (en %) pour l'écran modifié : une valeur égale à celle héritée n'est pas répétée
  function storeShares(colsItem, shares) {
    var k = kidsOf(colsItem), avg = 100 / k.length;
    k.forEach(function (c, i) {
      var g = Math.max(0.05, Math.round(shares[i] / avg * 100) / 100);
      var inh = growIn(c, ancestors(device));
      var s = styleSet(c, device, "normal", true);
      if (Math.abs(g - inh) < 0.01) delete s.flexGrow; else s.flexGrow = g;
      cleanStyles(c);
    });
  }
  function equalizeColumns(colsItem) {
    kidsOf(colsItem).forEach(function (c) { if (c.styles) BPS.forEach(function (b) { if (c.styles[b]) delete c.styles[b].flexGrow; }); cleanStyles(c); });
  }
  var pct = function (v) { return (Math.round(v * 10) / 10).toString().replace(".", ",") + " %"; };
  function addColumn(id) {
    var it = byId(id);
    if (!it || it.type !== "columns" || refuseLocked([id])) return;
    var n = kidsOf(it).length;
    if (n >= MAX_COLS) { toast("Au plus " + MAX_COLS + " colonnes : utilisez une grille pour davantage.", true); return; }
    change(function () { var x = byId(id); kidsOf(x).push(newNode("column")); equalizeColumns(x); selection = [id]; });
    toast((n + 1) + " colonnes de " + pct(100 / (n + 1)) + " chacune (largeurs modifiables).");
  }
  function removeColumn(id, index) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var k = kidsOf(it);
    if (k.length <= 1) { toast("Il reste une seule colonne : supprimez plutôt toute la structure.", true); return; }
    var i = index === undefined ? k.length - 1 : index;
    var inside = countDeep(k[i]);
    change(function () { kidsOf(byId(id)).splice(i, 1); selection = [id]; });
    toast("Colonne " + (i + 1) + " retirée" + (inside ? " avec ses " + inside + " élément(s)" : "") + ". Ctrl/⌘ + Z pour annuler.");
  }
  function moveColumn(id, i, delta) {
    if (refuseLocked([id])) return;
    change(function () { var k = kidsOf(byId(id)); var j = i + delta; if (j < 0 || j >= k.length) return false; var t = k[i]; k[i] = k[j]; k[j] = t; });
  }
  // Largeur d'une colonne (en %) : les autres se partagent le reste en gardant leurs proportions
  function setColumnShare(id, i, value) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var sh = columnShares(it);
    if (sh.length < 2) return;
    var v = Math.min(95, Math.max(5, value));
    var rest = 100 - sh[i], next = sh.map(function (x, j) { return j === i ? v : rest > 0 ? x / rest * (100 - v) : (100 - v) / (sh.length - 1); });
    if (next.some(function (x) { return x < 2; })) { toast("Chaque colonne garde au moins quelques pour cent de la largeur.", true); renderInspector(); return; }
    change(function () { storeShares(byId(id), next); });
  }
  // Grille : nombre de colonnes réellement affiché (réglage de l'écran, sinon celui mesuré dans le canevas)
  function gridColumnsOf(it) {
    // Tablette / mobile sans réglage propre : la grille se resserre d'elle-même (voir pageCss) → lue dans le canevas
    var gridChain = device === "wide" ? ["wide", "desktop"] : device === "mobile" ? ["mobile", "tablet"] : [device];
    for (var j = 0; j < gridChain.length; j++) { var s = it.styles && it.styles[gridChain[j]]; if (s && s.columns !== undefined) return Number(s.columns); }
    var el = canvasEl(it.id);
    if (el) { var t = frame.contentWindow.getComputedStyle(el).gridTemplateColumns; if (t && t !== "none") return t.split(" ").length; }
    return 3;
  }
  function gridSetColumns(id, n) {
    n = Math.min(12, Math.max(1, n));
    setStyle([id], "columns", n);
  }
  function gridAddRow(id) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var cols = gridColumnsOf(it), n = kidsOf(it).length;
    var add = (cols - n % cols) % cols + cols; // compléter la dernière ligne, puis une ligne entière
    if (n + add > 96) { toast("Une grille compte au plus 96 cellules.", true); return; }
    change(function () { var k = kidsOf(byId(id)); for (var i = 0; i < add; i++) k.push(newNode("container", { name: "Cellule " + (n + i + 1) })); selection = [id]; });
    toast("Ligne ajoutée (" + add + " cellule" + (add > 1 ? "s" : "") + ").");
  }
  function gridRemoveRow(id) {
    var it = byId(id);
    if (!it || refuseLocked([id])) return;
    var cols = gridColumnsOf(it), k = kidsOf(it);
    if (k.length <= cols) { toast("La grille garde au moins une ligne.", true); return; }
    var drop = k.length % cols || cols;
    var inside = k.slice(-drop).reduce(function (a, c) { return a + countDeep(c); }, 0);
    change(function () { kidsOf(byId(id)).splice(-drop, drop); selection = [id]; });
    toast("Dernière ligne retirée (" + drop + " cellule" + (drop > 1 ? "s" : "") + (inside ? ", " + inside + " élément(s)" : "") + "). Ctrl/⌘ + Z pour annuler.");
  }

  // Transformer un bloc de texte en un autre (titre, paragraphe, citation, liste) : le texte, le nom et le style sont gardés
  var TRANSFORMABLE = { heading: "Titre", text: "Paragraphe", quote: "Citation", list: "Liste" };
  function plainOf(it) {
    var p = it.props || {};
    if (it.type === "text") { var d = document.createElement("div"); d.innerHTML = p.html || ""; return Array.prototype.map.call(d.querySelectorAll("p, li, h2, h3, h4, h5, h6, blockquote"), function (x) { return x.textContent.trim(); }).filter(Boolean).join("\n") || d.textContent.trim(); }
    if (it.type === "list") return (p.items || []).join("\n");
    return String(p.text || "");
  }
  function transformNode(id, to) {
    var it = byId(id);
    if (!it || !isNode(it) || !TRANSFORMABLE[it.type] || !TRANSFORMABLE[to] || it.type === to || refuseLocked([id])) return;
    var text = plainOf(it), lines = text.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    var esc = function (v) { return String(v).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var props = to === "heading" ? { text: lines.join(" ").slice(0, 200), level: "2" }
      : to === "text" ? { html: it.type === "list" ? "<ul>" + lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>" : lines.map(function (l) { return "<p>" + esc(l) + "</p>"; }).join("") }
      : to === "quote" ? { text: lines.join(" ").slice(0, 600), author: "" }
      : { items: (lines.length ? lines : [text || "Point"]).slice(0, 30), ordered: false };
    nextLabel = "Transformer en " + TRANSFORMABLE[to].toLowerCase();
    change(function () { var x = byId(id); x.type = to; x.props = props; });
    toast("Bloc transformé en " + TRANSFORMABLE[to].toLowerCase() + " (Ctrl/⌘ + Z pour annuler).");
  }
  // Déplacer d'un cran parmi ses voisins (Alt + ↑ / ↓)
  function nudge(delta) {
    var ids = topLevelSelection();
    if (!ids.length || refuseLocked(ids)) return;
    var first = locate(ids[0]);
    if (!ids.every(function (id) { return locate(id).list === first.list; })) { toast("Pour déplacer plusieurs éléments ensemble, ils doivent avoir le même parent.", true); return; }
    nextLabel = delta < 0 ? "Monter" : "Descendre";
    change(function () {
      var list = first.list;
      var idx = ids.map(function (id) { return list.indexOf(byId(id)); }).sort(function (a, b) { return a - b; });
      if ((delta < 0 && idx[0] === 0) || (delta > 0 && idx[idx.length - 1] === list.length - 1)) return false;
      (delta < 0 ? idx : idx.slice().reverse()).forEach(function (i) { var t = list[i + delta]; list[i + delta] = list[i]; list[i] = t; });
    });
  }
  // Déplacer vers un parent et une position (glisser-déposer). Un élément ne va jamais dans un de ses descendants.
  function moveTo(ids, parent, index) {
    ids = topLevelSelection(ids);
    if (!ids.length || refuseLocked(ids)) return;
    if (parent && lockedDeep(parent.id)) { toast("Emplacement verrouillé.", true); return; }
    if (parent && ids.some(function (id) { return id === parent.id || locate(parent.id).ancestors.some(function (a) { return a.id === id; }); })) { toast("Un élément ne peut pas aller à l'intérieur de lui-même.", true); return; }
    var items = ids.map(byId);
    items.forEach(function (it) { if (!isNode(it)) markSection(it); }); // reste une section une fois retirée de la racine
    if (parent && items.some(function (it) { return !isNode(it); })) { toast("Une section ne se place pas dans un conteneur.", true); return; }
    nextLabel = "Déplacement";
    change(function () {
      var targetList = parent ? kidsOf(parent) : content.sections;
      var anchor = targetList[index] || null;
      ids.forEach(function (id) { var l = locate(id); l.list.splice(l.index, 1); });
      var at = anchor ? targetList.indexOf(anchor) : targetList.length;
      if (at < 0) at = targetList.length;
      if (!insertInto(parent, at, items)) return false;
      selection = ids.slice();
    });
  }
  function setFlag(ids, flag, value) {
    if (!ids.length) return;
    nextLabel = flag === "hidden" ? (value ? "Masquer" : "Afficher") : flag === "locked" ? (value ? "Verrouiller" : "Déverrouiller") : "Modification";
    change(function () { ids.forEach(function (id) { var it = byId(id); if (it) { if (value) it[flag] = true; else delete it[flag]; } }); });
  }
  function rename(id, name) {
    nextLabel = "Renommer";
    change(function () { var it = byId(id); if (!it) return false; var n = String(name || "").trim().slice(0, 60); if ((it.name || "") === n) return false; if (n) it.name = n; else delete it.name; });
  }
  // Grouper : éléments d'un même parent → un « Groupe » à la place du premier
  function groupSelected() {
    var ids = topLevelSelection();
    if (!ids.length) return;
    var items = ids.map(function (id) { return locate(id); });
    if (items.some(function (l) { return !isNode(l.item); })) { toast("Seuls des éléments (pas des sections entières) se groupent.", true); return; }
    if (!items.every(function (l) { return l.list === items[0].list; })) { toast("Pour grouper, choisissez des éléments du même parent.", true); return; }
    if (refuseLocked(ids)) return;
    change(function () {
      var list = items[0].list;
      var sorted = items.slice().sort(function (a, b) { return a.index - b.index; });
      var g = { id: newId(), type: "group", name: "Groupe", children: sorted.map(function (l) { return l.item; }) };
      var at = sorted[0].index;
      sorted.slice().reverse().forEach(function (l) { list.splice(list.indexOf(l.item), 1); });
      list.splice(at, 0, g);
      selection = [g.id];
    });
  }
  function ungroupSelected() {
    var ids = selection.filter(function (id) { var it = byId(id); return it && ["group", "stack", "container"].indexOf(it.type) >= 0; });
    if (!ids.length) { toast("Sélectionnez un groupe (ou une pile, un conteneur) à dissocier.", true); return; }
    if (refuseLocked(ids)) return;
    change(function () {
      var freed = [];
      ids.forEach(function (id) { var l = locate(id); var kids = l.item.children || []; Array.prototype.splice.apply(l.list, [l.index, 1].concat(kids)); freed = freed.concat(kids.map(function (k) { return k.id; })); });
      selection = freed;
    });
  }
  // Copier / couper / coller (éléments et sections)
  function copySelected(cut) {
    var ids = topLevelSelection();
    if (!ids.length) return;
    clipboard = ids.map(function (id) { var it = byId(id); var c = clone(it); if (!isNode(it)) c.section = true; return c; });
    store.set("clipboard", clipboard);
    // Copie aussi dans le presse-papiers du système (texte balisé) : permet « Coller depuis un autre site ou navigateur » ; sans permission, la copie interne suffit
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText("KOLAKISA:" + JSON.stringify({ v: 1, items: clipboard })).catch(function () {}); } catch (e) { /* copie interne seulement */ }
    if (cut) { if (refuseLocked(ids)) return; removeSelected(); toast("Coupé (" + ids.length + ")."); }
    else toast("Copié (" + ids.length + ").");
  }
  function paste() {
    var items = clipboard || store.get("clipboard", null);
    if (!items || !items.length) { toast("Rien à coller.", true); return; }
    addItems(reIdAll(items.map(function (it) { return clone(it); })).map(function (c) { if (c.section) { delete c.section; markSection(c); } return c; }));
  }
  // Coller depuis le presse-papiers du système : éléments copiés dans un autre site KOLAKISA ou un autre navigateur. Le contenu est relu, borné, puis revalidé par le serveur à l'enregistrement.
  function pasteFromSystem() {
    if (!navigator.clipboard || !navigator.clipboard.readText) { toast("Votre navigateur ne permet pas de lire le presse-papiers.", true); return; }
    navigator.clipboard.readText().then(function (text) {
      if (!text || text.indexOf("KOLAKISA:") !== 0) { toast("Le presse-papiers ne contient pas d'éléments KOLAKISA copiés.", true); return; }
      if (text.length > 600000) { toast("Contenu copié trop volumineux.", true); return; }
      var data; try { data = JSON.parse(text.slice(9)); } catch (e) { data = null; }
      var items = data && data.v === 1 && Array.isArray(data.items) ? data.items.filter(function (x) { return x && typeof x === "object" && typeof x.type === "string"; }).slice(0, 40) : [];
      if (!items.length) { toast("Aucun élément valide dans le presse-papiers.", true); return; }
      addItems(reIdAll(items.map(function (it) { return clone(it); })).map(function (c) { if (c.section) { delete c.section; markSection(c); } return c; }));
      toast("Collé depuis le presse-papiers (" + items.length + ").");
    }, function () { toast("Accès au presse-papiers refusé : autorisez-le dans le navigateur.", true); });
  }
  // Copier / coller le style (styles par écran et par état ; préréglages des sections)
  // Réinitialiser le style : tous les écrans et tous les états (le contenu est gardé) ; annulable
  function resetStyle() {
    var ids = selection.slice();
    if (!ids.length || refuseLocked(ids)) return;
    var any = ids.some(function (id) { var it = byId(id); return it && (it.styles || it.states || it.parts); });
    if (!any) { toast("Aucun style propre à réinitialiser."); return; }
    change(function () { ids.forEach(function (id) { var it = byId(id); if (it) { delete it.styles; delete it.states; delete it.parts; } }); });
    toast("Style réinitialisé (tous les écrans et états). Ctrl/⌘ + Z pour annuler.");
  }
  function copyStyle() {
    var it = selectedItems()[0];
    if (!it) return;
    styleClipboard = { styles: clone(it.styles || {}), states: clone(it.states || {}), style: clone(it.style || null), type: it.type, parts: clone(it.parts || {}) };
    store.set("style-clipboard", styleClipboard);
    toast("Style copié depuis « " + nameOf(it) + " ».");
  }
  // Groupes de réglages collables séparément (même découpage que l'onglet Style de l'inspecteur)
  var STYLE_GROUPS = [["typography", "Typographie"], ["color", "Couleurs"], ["background", "Fond"], ["border", "Bordure"], ["spacing", "Espacement"], ["size", "Dimensions"], ["effects", "Effets"], ["layout", "Mise en page"], ["position", "Position"]];
  // Un réglage s'applique à un élément seulement si l'inspecteur de CET élément propose son groupe (et ce réglage dans ce groupe)
  function acceptsStyle(it, key) {
    var p = SP[key], g = isNode(it) ? inspectorFor(it).groups : null;
    if (!p || !g || g[p.group] === undefined) return false;
    return Array.isArray(g[p.group]) ? g[p.group].indexOf(key) >= 0 : true;
  }
  // Coller le style : FUSION (les réglages propres de la cible qui ne sont pas dans le style copié restent), seulement les réglages applicables à la cible,
  // éventuellement limités à des groupes (« Coller le style : couleurs »). Le contenu n'est jamais touché. Une seule étape d'annulation.
  function pasteStyle(only) {
    var st = styleClipboard || store.get("style-clipboard", null);
    if (!st) { toast("Aucun style copié.", true); return; }
    var ids = selection.slice();
    if (!ids.length || refuseLocked(ids)) return;
    var applied = 0, skipped = 0;
    var wanted = function (key) { return !only || (SP[key] && only.indexOf(SP[key].group) >= 0); };
    var done = change(function () {
      ids.forEach(function (id) {
        var it = byId(id);
        if (!it) return;
        if (!isNode(it)) { if (st.style && !only) { it.style = Object.assign({}, it.style || {}, clone(st.style)); applied++; } return; }
        Object.keys(st.styles || {}).forEach(function (bp) {
          Object.keys(st.styles[bp] || {}).forEach(function (key) {
            if (!wanted(key)) return;
            if (!acceptsStyle(it, key)) { skipped++; return; }
            it.styles = it.styles || {}; it.styles[bp] = it.styles[bp] || {};
            it.styles[bp][key] = clone(st.styles[bp][key]); applied++;
          });
        });
        Object.keys(st.states || {}).forEach(function (state) {
          Object.keys(st.states[state] || {}).forEach(function (key) {
            if (!wanted(key)) return;
            if (!acceptsStyle(it, key)) { skipped++; return; }
            it.states = it.states || {}; it.states[state] = it.states[state] || {};
            it.states[state][key] = clone(st.states[state][key]); applied++;
          });
        });
        // Parties (carte, titre…) : reprises seulement entre widgets du MÊME type, partie par partie, et seulement les réglages que la partie accepte
        if (st.type && st.type === it.type) Object.keys(st.parts || {}).forEach(function (pk) {
          var def = partDef(it, pk), src = st.parts[pk];
          if (!def) return;
          var okKey = function (key) { var g = SP[key] && SP[key].group; if (key === "backgroundColor") g = "background"; var spec = g && def.groups[g]; return spec === true || (Array.isArray(spec) && spec.indexOf(key) >= 0); };
          [["styles", Object.keys(src.styles || {})], ["states", Object.keys(src.states || {})]].forEach(function (kind) {
            kind[1].forEach(function (slot) {
              Object.keys(src[kind[0]][slot] || {}).forEach(function (key) {
                if (!wanted(key)) return;
                if (!okKey(key)) { skipped++; return; }
                it.parts = it.parts || {}; it.parts[pk] = it.parts[pk] || {}; it.parts[pk][kind[0]] = it.parts[pk][kind[0]] || {}; it.parts[pk][kind[0]][slot] = it.parts[pk][kind[0]][slot] || {};
                it.parts[pk][kind[0]][slot][key] = clone(src[kind[0]][slot][key]); applied++;
              });
            });
          });
        });
      });
      if (!applied) return false;
    }, { label: only ? "Coller le style (" + only.map(function (g) { return (STYLE_GROUPS.filter(function (x) { return x[0] === g; })[0] || [0, g])[1].toLowerCase(); }).join(", ") + ")" : "Coller le style" });
    if (!done) { toast(skipped ? "Aucun réglage du style copié ne s'applique à cet élément." : "Rien à coller" + (only ? " pour ce groupe." : "."), true); return; }
    toast("Style collé sur " + ids.length + " élément" + (ids.length > 1 ? "s" : "") + " : " + applied + " réglage" + (applied > 1 ? "s" : "") + (skipped ? " (" + skipped + " inapplicable" + (skipped > 1 ? "s" : "") + " ignoré" + (skipped > 1 ? "s" : "") + ")" : "") + ". Les autres réglages de la cible sont conservés.");
  }

  // ---------- Styles (par écran et par état) ----------
  // Écran modifié = écran affiché. Une valeur absente est héritée de l'écran plus grand.
  // Cible des réglages : null = le widget lui-même ; sinon une de ses PARTIES (carte, image, titre…, déclarées par le registre). Les parties ont la même forme
  // que le widget ({ styles: { écran }, states: { état } }) : tous les contrôles, l'historique et l'enregistrement fonctionnent donc sans changement.
  var styleTarget = null;
  // Un réglage n'est écrit dans une PARTIE que si le registre des parties (parts.js, même source que le serveur) l'accepte pour cette partie ; sinon il
  // revient au widget lui-même (ex. « Aligner dans le parent » de la barre contextuelle alors qu'une partie est choisie dans l'inspecteur).
  var GROUP_OF = null;
  function groupOfKey(k) { if (!GROUP_OF) { GROUP_OF = {}; SPEC.styleProps.forEach(function (p) { GROUP_OF[p.key] = p.group; }); } return k === "backgroundColor" ? "background" : GROUP_OF[k]; }
  function partAllowsKey(it, key) {
    var pd = styleTarget && partDef(it, styleTarget), g = pd && groupOfKey(key);
    if (!pd || !g) return true; // pas de partie, ou réglage composé (fond, filtre, ombre…) géré par les contrôles de son groupe
    var spec = pd.groups[g];
    return spec === true || (Array.isArray(spec) && spec.indexOf(key) >= 0);
  }
  function holderOf(it, create, key) {
    if (!styleTarget || !partDef(it, styleTarget) || (key !== undefined && !partAllowsKey(it, key))) return it;
    if (!it.parts || !it.parts[styleTarget]) { if (!create) return null; it.parts = it.parts || {}; it.parts[styleTarget] = {}; }
    return it.parts[styleTarget];
  }
  function partDef(it, key) { var d = it && isNode(it) && NT[it.type] && NT[it.type].parts; return d ? d.filter(function (x) { return x.key === key; })[0] || null : null; }
  function styleSet(it, bp, state, create, key) {
    var o = holderOf(it, create, key);
    if (!o) return null;
    if (state && state !== "normal") {
      var sk = stateKey(state, bp);
      if (!o.states) { if (!create) return null; o.states = {}; }
      if (!o.states[sk]) { if (!create) return null; o.states[sk] = {}; }
      return o.states[sk];
    }
    if (!o.styles) { if (!create) return null; o.styles = {}; }
    if (!o.styles[bp]) { if (!create) return null; o.styles[bp] = {}; }
    return o.styles[bp];
  }
  function ownValue(it, key) { var s = styleSet(it, device, styleState, false, key); return s && s[key] !== undefined ? s[key] : undefined; }
  // Valeur héritée (écrans plus grands) : affichée en indication grise
  function inheritedValue(it, key) {
    if (styleState !== "normal") {
      // État d'un écran plus petit : la valeur de l'écran plus grand (ordinateur, puis tablette) est reprise, affichée en gris
      var sh = holderOf(it, false, key), sup = ancestors(device);
      for (var q = 0; q < sup.length; q++) { var ss = sh && sh.states && sh.states[stateKey(styleState, sup[q])]; if (ss && ss[key] !== undefined) return ss[key]; }
      return undefined;
    }
    var i = BPS.indexOf(device);
    // Grille sans réglage propre à la tablette / au mobile : 2 colonnes au plus sur tablette, 1 sur mobile (voir pageCss)
    if (!styleTarget && it.type === "grid" && (key === "columns" || key === "gridTemplate") && (device === "tablet" || device === "mobile")) {
      var own = function (b) { var st = it.styles && it.styles[b]; return st && (st.columns !== undefined || st.gridTemplate !== undefined); };
      var d = (it.styles && it.styles.desktop) || {}, cols = d.gridTemplate ? String(d.gridTemplate).split(" ").length : Number(d.columns) || 0;
      if (!own("tablet") && (device === "tablet" ? cols > 2 : !own("mobile") && cols > 1)) return key === "columns" ? (device === "tablet" ? 2 : 1) : undefined;
    }
    var ho = holderOf(it, false, key);
    var up = ancestors(device);
    for (var j = 0; j < up.length; j++) { var s = ho && ho.styles && ho.styles[up[j]]; if (s && s[key] !== undefined) return s[key]; }
    return undefined;
  }
  function cleanSet(o) {
    if (o.styles) { BPS.forEach(function (b) { if (o.styles[b] && !Object.keys(o.styles[b]).length) delete o.styles[b]; }); if (!Object.keys(o.styles).length) delete o.styles; }
    if (o.states) { Object.keys(o.states).forEach(function (k) { if (!Object.keys(o.states[k]).length) delete o.states[k]; }); if (!Object.keys(o.states).length) delete o.states; }
  }
  function cleanStyles(it) {
    cleanSet(it);
    if (it.parts) { Object.keys(it.parts).forEach(function (k) { cleanSet(it.parts[k]); if (!Object.keys(it.parts[k]).length) delete it.parts[k]; }); if (!Object.keys(it.parts).length) delete it.parts; }
  }
  var COMPOSED_LABEL = { filter: "filtres", backdrop: "filtres de l'arrière-plan", shadow: "ombre personnalisée", overlay: "voile", gradient: "dégradé", backgroundImage: "image de fond", transform: "transformation", mask: "masque" };
  var CASCADE_KEYS = ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textTransform", "lineHeight"];
  function setStyle(ids, key, value, opts) { var m = {}; m[key] = value; setStyles(ids, m, opts); }
  // Plusieurs propriétés en une seule étape d'annulation (côtés liés, retrait du fond…)
  // La clé de regroupement d'historique contient les éléments visés, la partie et l'écran/état : deux éléments différents ne partagent JAMAIS une étape d'annulation.
  function setStyles(ids, map, opts) {
    if (probing) { Object.keys(map).forEach(function (k) { probing.push(stylePath(k)); }); return; }
    ids = ids || selection;
    if (!ids.length || refuseLocked(ids)) return;
    if (refuseFormat(ids, Object.keys(map))) return;
    if (change(function () {
      ids.forEach(function (id) {
        var it = byId(id);
        if (!it) return;
        Object.keys(map).forEach(function (key) {
          var value = map[key];
          var empty = value === "" || value === null || value === undefined;
          var set = styleSet(it, device, styleState, !empty, key);
          if (!set) return;
          if (empty) delete set[key]; else set[key] = value;
          // Réglage du WIDGET lui-même (pas d'une partie) : s'il existe un réglage de la même propriété posé sur l'une de ses parties (cas des modèles de la
          // bibliothèque, dont les parties portent déjà une police ou une couleur), il masquerait le nouveau réglage : on le retire pour que le choix de l'utilisateur
          // s'applique réellement (priorité : la dernière valeur choisie sur le widget l'emporte).
          if (!empty && !styleTarget && (!styleState || styleState === "normal") && CASCADE_KEYS.indexOf(key) >= 0 && it.parts) {
            Object.keys(it.parts).forEach(function (pk) { var ps = it.parts[pk] && it.parts[pk].styles && it.parts[pk].styles[device]; if (ps && ps[key] !== undefined) delete ps[key]; });
          }
        });
        cleanStyles(it);
      });
    }, { key: opts && opts.key ? opts.key + ":" + ids.join(",") + ":" + (styleTarget || "") + ":" + device + ":" + styleState : null, light: opts && opts.light, label: "Style : " + Object.keys(map).map(function (k) { return SP[k] ? SP[k].label : COMPOSED_LABEL[k] || k; }).slice(0, 2).join(", ") + (device !== "desktop" ? " (" + bpLabel(device) + ")" : "") }) !== false) previewStyles(ids, map);
  }
  // Retour visuel IMMÉDIAT : la valeur choisie est posée tout de suite en style en ligne sur l'élément du canevas, sans attendre le rendu
  // serveur. Le rendu serveur qui suit remplace la page et retire ces styles (clearPreviews) : seul ce qui est certain d'être identique
  // au CSS généré est prévisualisé (propriétés simples, valeurs littérales, état normal, élément lui-même).
  var PREVIEW = { fontSize: 1, color: 1, backgroundColor: 1, opacity: 1, letterSpacing: 1, width: 1, height: 1, maxWidth: 1, minHeight: 1, gap: 1, borderRadius: 1, paddingTop: 1, paddingRight: 1, paddingBottom: 1, paddingLeft: 1, marginTop: 1, marginRight: 1, marginBottom: 1, marginLeft: 1 };
  var PREVIEW_VALUE = /^(-?\d{1,4}(\.\d{1,3})?(px|%|rem|em|vh|vw)?|#[0-9a-fA-F]{3,8})$/;
  // Listes de mise en page et de texte dont le CSS généré est EXACTEMENT « propriété: valeur » (aucune conversion côté serveur) : la valeur est
  // aperçue tout de suite si elle fait partie des options du modèle (la même liste que le serveur accepte)
  var PREVIEW_ENUM = { display: 1, flexDirection: 1, flexWrap: 1, justifyContent: 1, alignItems: 1, alignContent: 1, alignSelf: 1, justifySelf: 1, justifyItems: 1, textAlign: 1, textTransform: 1, textDecoration: 1, fontStyle: 1, fontWeight: 1, position: 1, overflow: 1, overflowX: 1, overflowY: 1, visibility: 1, whiteSpace: 1, objectFit: 1, cursor: 1, pointerEvents: 1, direction: 1 };
  var previews = [];
  function previewStyles(ids, map) {
    if (styleState !== "normal" || styleTarget || !ids) return;
    var doc = frame.contentDocument;
    if (!doc || !doc.body || swapping) return;
    ids.forEach(function (id) {
      var el = doc.querySelector('[data-node-id="' + id + '"]');
      if (!el) return;
      Object.keys(map).forEach(function (key) {
        var v = map[key];
        var isEnum = PREVIEW_ENUM[key] && SP[key] && SP[key].options && typeof v === "string" && SP[key].options.some(function (o) { return o[0] === v; });
        if (!isEnum && (!PREVIEW[key] || typeof v !== "string" && typeof v !== "number" || !PREVIEW_VALUE.test(String(v)))) return;
        var css = key.replace(/[A-Z]/g, function (c) { return "-" + c.toLowerCase(); });
        if (!previews.some(function (x) { return x.el === el && x.css === css; })) previews.push({ el: el, css: css, was: el.style.getPropertyValue(css) });
        el.style.setProperty(css, String(v));
      });
    });
  }
  function clearPreviews() {
    previews.forEach(function (x) { if (x.was) x.el.style.setProperty(x.css, x.was); else x.el.style.removeProperty(x.css); });
    previews = [];
  }
  // Largeur du contenu d'un conteneur : « full » (propriété) et « maxWidth » (style de l'écran affiché) changent ENSEMBLE, en une seule étape d'annulation
  function setContainerWidth(id, mode, customValue) {
    if (lockedDeep(id)) { toast("Élément verrouillé.", true); return; }
    change(function () {
      var it = byId(id);
      if (!it) return false;
      it.props = it.props || {};
      var inherited = inheritedValue(it, "maxWidth") !== undefined;
      if (mode === "full") it.props.full = true; else delete it.props.full;
      if (mode === "band") it.props.band = true; else delete it.props.band;
      var set = styleSet(it, device, "normal", mode === "custom" || inherited);
      if (mode === "custom") set.maxWidth = customValue;
      else if (inherited) set.maxWidth = mode === "full" || mode === "band" ? "100%" : "1100px"; // écran plus petit qui hérite d'une largeur personnalisée : on la remplace explicitement
      else if (set) delete set.maxWidth;
      cleanStyles(it);
    }, { label: "Largeur du contenu" });
  }
  function setProp(id, key, value, opts) {
    if (probing) { probing.push((isNode(byId(id)) ? "p:" : "f:") + key); return; }
    if (lockedDeep(id)) { toast("Élément verrouillé.", true); return; }
    change(function () {
      var it = byId(id);
      if (!it) return false;
      if (isNode(it)) { it.props = it.props || {}; it.props[key] = value; } else it[key] = value;
    }, { key: opts && opts.key ? (String(opts.key).indexOf(id) >= 0 ? opts.key : id + ":" + opts.key) : undefined, light: opts && opts.light, label: "Contenu : " + typeLabel(byId(id) || {}) });
  }
  // Valeurs saisies : « 24 » → « 24px » ; vérification avant envoi (le serveur revérifie)
  var LEN = /^-?\d{1,4}(\.\d{1,3})?(px|%|rem|em|vh|vw)$/;
  var SIGNED_LEN = /^(margin|top|left|right|bottom|letterSpacing|wordSpacing|textIndent)/;
  function parseLength(v, key) {
    var s = String(v || "").trim().toLowerCase().replace(",", ".");
    if (!s) return "";
    if (/^-?\d{1,4}(\.\d{1,3})?$/.test(s)) s = s === "0" ? "0" : s + "px";
    if (s === "auto") return ["width", "height", "flexBasis", "marginTop", "marginRight", "marginBottom", "marginLeft"].indexOf(key) >= 0 ? s : null;
    if (s === "fit-content" || s === "min-content" || s === "max-content") return ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight"].indexOf(key) >= 0 ? s : null;
    if (s === "0" || LEN.test(s)) {
      if (/^-/.test(s) && !SIGNED_LEN.test(key)) return null;
      return s;
    }
    return null;
  }

  // ---------- Calques (arbre) ----------
  var treeEl = $("[data-pb-layers]");
  var dragIds = null, dragNew = null;
  // Les calques ne sont reconstruits que si ce qu'ils affichent a changé (identifiants, noms, drapeaux, hiérarchie, repli, filtre) : une
  // modification de style, de couleur ou de dimension ne touche à aucun calque (mesuré : la reconstruction coûte ~ 15 000 nœuds DOM à 400 éléments)
  var treeRendered = false, treeSig = null, treeMarked = null, treeTab = null, treeNames = {}, treeLi = {};
  function treeSignature() {
    var out = [];
    treeNames = {};
    (function w(list, lvl) { list.forEach(function (it) { var k = kidsOf(it); var nm = treeNames[it.id] = nameOf(it); out.push(it.id + "|" + lvl + "|" + it.type + "|" + nm + "|" + (it.hidden ? 1 : 0) + (it.locked ? 1 : 0) + (it.note ? "n" + it.note.length : "") + (collapsed[it.id] ? 1 : 0) + "|" + (k ? k.length : -1)); if (k) w(k, lvl + 1); }); })(content.sections, 1);
    return out.join("\n") + "#" + treeQuery + "#" + errorItemId + "#" + canWrite;
  }
  function renderTree() {
    var sig = treeSignature();
    if (sig === treeSig && treeEl.firstChild) { markTreeSelection(true); return; }
    treeSig = sig;
    var nm = function (it) { return treeNames[it.id] !== undefined ? treeNames[it.id] : nameOf(it); };
    var matches = function (it) { return norm(nm(it)).indexOf(treeQuery) >= 0 || norm(typeLabel(it)).indexOf(treeQuery) >= 0; };
    var hasMatch = function (it) { return matches(it) || (kidsOf(it) || []).some(hasMatch); };
    // Une ligne (<li>) : créée une fois, puis RÉUTILISÉE tant que ce qu'elle affiche ne change pas. Les écouteurs lisent l'élément par son
    // identifiant au moment du clic (jamais l'objet capturé : annuler / rétablir remplace tous les objets du document).
    var makeRow = function (it0, level, kids, open) {
      var id = it0.id, cur = function () { return byId(id) || it0; };
      var on = selection.indexOf(id) >= 0;
      var li = h("li", { role: "treeitem", "aria-level": String(level), "aria-selected": String(on), "aria-expanded": kids && kids.length ? String(Boolean(open)) : null, class: "pb-node" + (it0.hidden ? " is-hidden" : "") + (it0.locked ? " is-locked" : ""), dataset: { id: id } });
      var label = nm(it0);
      var row = h("div", { class: "pb-row-item" + (on ? " is-selected" : "") + (id === errorItemId ? " is-error" : ""), draggable: canWrite ? "true" : null, style: "--level:" + (level - 1), tabindex: "-1" },
        kids && kids.length ? h("button", { type: "button", class: "pb-twist", tabindex: "-1", "aria-label": open ? "Replier" : "Déplier", onclick: function (e) { e.stopPropagation(); toggleCollapse(id); } }, icon(open ? "chevronDown" : "chevronRight")) : h("span", { class: "pb-twist-gap", "aria-hidden": "true" }),
        h("span", { class: "pb-node-icon", "aria-hidden": "true" }, icon(isNode(it0) ? NT[it0.type].icon : it0.type === "layout" ? "layout" : "fileText")),
        h("span", { class: "pb-node-name", text: label }),
        it0.note ? h("span", { class: "pb-note-dot", role: "img", "aria-label": "Note de l'équipe : " + it0.note, "data-tip": it0.note }, icon("fileText")) : null,
        h("span", { class: "pb-node-flags" },
          h("button", { type: "button", tabindex: "-1", class: "pb-flag" + (it0.hidden ? " is-on" : ""), "aria-pressed": String(Boolean(it0.hidden)), "aria-label": (it0.hidden ? "Afficher « " : "Masquer « ") + label + " »", "data-tip": it0.hidden ? "Afficher" : "Masquer", disabled: !canWrite, onclick: function (e) { e.stopPropagation(); setFlag([id], "hidden", !cur().hidden); } }, icon(it0.hidden ? "eyeOff" : "eye")),
          h("button", { type: "button", tabindex: "-1", class: "pb-flag" + (it0.locked ? " is-on" : ""), "aria-pressed": String(Boolean(it0.locked)), "aria-label": (it0.locked ? "Déverrouiller « " : "Verrouiller « ") + label + " »", "data-tip": it0.locked ? "Déverrouiller" : "Verrouiller", disabled: !canWrite, onclick: function (e) { e.stopPropagation(); setFlag([id], "locked", !cur().locked); } }, icon("lock")),
          h("button", { type: "button", tabindex: "-1", class: "pb-flag pb-flag-more", "aria-haspopup": "menu", "aria-label": "Actions de « " + label + " »", "data-tip": "Actions (dupliquer, copier, renommer, déplacer…)",
            onclick: function (e) { e.stopPropagation(); if (selection.indexOf(id) < 0) select(id); var r = e.currentTarget.getBoundingClientRect(); openMenu(r.right - 4, r.bottom + 4); } }, icon("moreVertical")),
          h("button", { type: "button", tabindex: "-1", class: "pb-flag pb-flag-delete", "aria-label": "Supprimer « " + label + " »" + (kids && kids.length ? " et ses " + countDeep(it0) + " élément(s)" : ""), "data-tip": kids && kids.length ? "Supprimer (avec ses " + countDeep(it0) + " élément(s))" : "Supprimer", disabled: !canWrite || lockedDeep(id), onclick: function (e) { e.stopPropagation(); removeItems([id]); } }, icon("trash"))));
      row.addEventListener("click", function (e) { select(id, e.shiftKey || e.metaKey || e.ctrlKey); });
      row.addEventListener("dblclick", function (e) { if (canWrite && !e.target.closest("button")) startRename(row, cur()); });
      row.addEventListener("contextmenu", function (e) { e.preventDefault(); if (selection.indexOf(id) < 0) select(id); openMenu(e.clientX, e.clientY); });
      row.addEventListener("dragstart", function (e) {
        if (lockedDeep(id)) { e.preventDefault(); toast("Élément verrouillé.", true); return; }
        dragIds = selection.indexOf(id) >= 0 ? selection.slice() : [id]; dragNew = null;
        e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move");
      });
      row.addEventListener("dragover", function (e) {
        if (!dragIds && !dragNew) return;
        var pos = dropPosition(row, e.clientY, cur());
        e.preventDefault();
        clearTreeDrop();
        row.classList.add(pos === "before" ? "is-drop-before" : pos === "after" ? "is-drop-after" : "is-drop-inside");
      });
      row.addEventListener("dragleave", function () { row.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); });
      row.addEventListener("drop", function (e) {
        var it = cur(), pos = dropPosition(row, e.clientY, it);
        clearTreeDrop();
        e.preventDefault();
        var l = locate(id);
        performDrop(pos === "inside" ? { parent: it, index: kidsOf(it).length } : { parent: l.parent, index: l.index + (pos === "after" ? 1 : 0) });
      });
      li.appendChild(row);
      return li;
    };
    // Bouton « Supprimer » d'une ligne réutilisée : son libellé dépend du nombre d'éléments qu'elle contient et d'un verrou hérité. Il est mis à jour EN PLACE
    // (recréer la ligne d'un conteneur obligeait à déplacer tous ses descendants dans le DOM : mesuré, c'était l'essentiel de la mise en page après une opération)
    var syncDelete = function (li, it, has) {
      var b = li.firstElementChild && li.firstElementChild.querySelector(".pb-flag-delete");
      if (!b) return;
      var label = nm(it), n = has ? countDeep(it) : 0;
      var aria = "Supprimer « " + label + " »" + (has ? " et ses " + n + " élément(s)" : ""), tip = has ? "Supprimer (avec ses " + n + " élément(s))" : "Supprimer", off = !canWrite || lockedDeep(it.id);
      if (b.getAttribute("aria-label") !== aria) { b.setAttribute("aria-label", aria); b.setAttribute("data-tip", tip); }
      if (b.disabled !== off) b.disabled = off;
    };
    var nextLi = {};
    var reconcile = function (list, level, into) {
      var seq = [];
      list.forEach(function (it) {
        if (treeQuery && !hasMatch(it)) return;
        var kids = kidsOf(it), has = Boolean(kids && kids.length), open = has && (treeQuery ? true : !collapsed[it.id]);
        // Signature de la LIGNE (sans ses enfants) : tout ce qu'elle affiche
        var rsig = [level, it.type, nm(it), it.hidden ? 1 : 0, it.locked ? 1 : 0, it.note || "", has ? (open ? "o" : "c") : "-", it.id === errorItemId ? 1 : 0, canWrite ? 1 : 0].join("|");
        var ent = treeLi[it.id], brandNew = treeRendered && !treeQuery && !ent;
        if (!ent || ent.sig !== rsig) ent = { li: makeRow(it, level, kids, open), sig: rsig };
        if (brandNew) freshRows.push(ent.li);
        else syncDelete(ent.li, it, has);
        nextLi[it.id] = ent;
        var li = ent.li, ul = li.lastElementChild && li.lastElementChild.tagName === "UL" ? li.lastElementChild : null;
        if (open) { if (!ul) { ul = h("ul", { role: "group", class: "pb-tree-group" }); li.appendChild(ul); } reconcile(kids, level + 1, ul); } else if (ul) ul.remove();
        seq.push(li);
      });
      // Ordre : on ne déplace que les lignes qui ne sont pas déjà à leur place
      // D'abord retirer les lignes disparues (sinon la ligne suivante serait « déplacée » devant elle, avec tous ses descendants), puis insérer les manquantes
      var keep = new Set(seq), at = into.firstElementChild;
      while (at) { var nx = at.nextElementSibling; if (!keep.has(at)) at.remove(); at = nx; }
      at = into.firstElementChild;
      seq.forEach(function (li) { if (at === li) at = at.nextElementSibling; else into.insertBefore(li, at); });
    };
    $$(".pb-tree-empty", treeEl).forEach(function (e) { e.remove(); });
    var freshRows = []; // lignes réellement nouvelles (identifiant jamais vu) : apparition très courte ; pas pour un filtre ni pour un afflux (chargement, gros annuler)
    reconcile(content.sections, 1, treeEl);
    treeLi = nextLi;
    if (window.KolMotion && freshRows.length && freshRows.length <= 12) freshRows.forEach(function (li) { window.KolMotion.appear(li, "fade"); });
    treeRendered = true;
    var anyRow = treeEl.firstElementChild;
    if (treeQuery && !anyRow) treeEl.appendChild(h("li", { class: "pb-tree-empty", role: "none" }, h("p", { class: "pb-hint", text: "Aucun calque ne correspond." })));
    if (!content.sections.length) treeEl.appendChild(h("li", { class: "pb-tree-empty", role: "none" }, h("p", { class: "pb-hint", text: "Page vide : glissez un élément ou un bloc ici, ou dans la page." })));
    treeMarked = null; markTreeSelection(true); // coches de sélection : lignes réutilisées comprises
    var cur = treeEl.querySelector(".pb-row-item.is-selected") || treeEl.querySelector(".pb-row-item");
    if (cur) cur.tabIndex = 0;
    treeTab = cur; treeMarked = selection.slice();
    var info = $("[data-pb-page-count]");
    if (info) { var total = 0; walk(function () { total++; }); info.textContent = content.sections.length + " section" + (content.sections.length > 1 ? "s" : "") + " · " + (total - content.sections.length) + " élément" + (total - content.sections.length > 1 ? "s" : ""); }
  }
  // Avant / après / dedans selon la hauteur du pointeur dans la ligne ; « dedans » seulement pour un conteneur
  function dropPosition(row, y, it) {
    var r = row.getBoundingClientRect();
    var rel = (y - r.top) / r.height;
    var accepts = kidsOf(it) && (dragNew ? isNode(dragNew.sample) : (dragIds || []).every(function (id) { return isNode(byId(id)); }));
    if (accepts && rel > 0.28 && rel < 0.72) return "inside";
    return rel < 0.5 ? "before" : "after";
  }
  function clearTreeDrop() { $$(".is-drop-before, .is-drop-after, .is-drop-inside", treeEl).forEach(function (el) { el.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); }
  treeEl.addEventListener("dragover", function (e) { if ((dragIds || dragNew) && (e.target === treeEl || e.target.closest(".pb-tree-empty"))) e.preventDefault(); });
  treeEl.addEventListener("drop", function (e) { if (e.target === treeEl || e.target.closest(".pb-tree-empty")) { e.preventDefault(); performDrop({ parent: null, index: content.sections.length }); } });
  document.addEventListener("dragend", function () { dragIds = null; dragNew = null; clearTreeDrop(); hideDropIndicator(); });
  function performDrop(target) {
    if (dragNew) { var make = dragNew.make; dragNew = null; make(target); }
    else if (dragIds) { var ids = dragIds; dragIds = null; moveTo(ids, target.parent, target.index); }
  }
  // Sélection dans les calques : seules les lignes dont l'état change sont touchées (avant : les 400 lignes, à chaque sélection)
  function markTreeSelection(noScroll) {
    var mark = function (li, on) { if (!li) return; li.setAttribute("aria-selected", String(on)); if (li.firstElementChild) li.firstElementChild.classList.toggle("is-selected", on); };
    var liOf = function (id) { return treeEl.querySelector('.pb-node[data-id="' + id + '"]'); };
    if (!treeMarked) {
      $$(".pb-node", treeEl).forEach(function (li) { mark(li, selection.indexOf(li.dataset.id) >= 0); });
    } else {
      treeMarked.forEach(function (id) { if (selection.indexOf(id) < 0) mark(liOf(id), false); });
      selection.forEach(function (id) { if (treeMarked.indexOf(id) < 0) mark(liOf(id), true); });
    }
    treeMarked = selection.slice();
    var cur = selection.length ? treeEl.querySelector('.pb-node[data-id="' + selection[selection.length - 1] + '"] > .pb-row-item') : null;
    if (cur) {
      if (treeTab && treeTab.isConnected) treeTab.tabIndex = -1; else $$(".pb-row-item", treeEl).forEach(function (r) { r.tabIndex = -1; });
      cur.tabIndex = 0; treeTab = cur;
      // Faire apparaître la ligne : au prochain affichage (le défilement impose une mise en page, inutile en plein traitement du clic)
      if (!noScroll) requestAnimationFrame(function () { scrollInside(cur); });
    }
  }
  function toggleCollapse(id, value) {
    if (value === undefined) value = !collapsed[id];
    if (value) collapsed[id] = true; else delete collapsed[id];
    store.set("collapsed-" + PAGE.id, collapsed);
    renderTree();
  }
  function startRename(row, it) {
    var nameEl = row.querySelector(".pb-node-name");
    var input = h("input", { type: "text", class: "pb-rename", maxlength: "60", value: it.name || "", placeholder: typeLabel(it), "aria-label": "Nouveau nom du calque" });
    nameEl.replaceWith(input);
    input.focus(); input.select();
    var done = false;
    var finish = function (save) { if (done) return; done = true; if (save) rename(it.id, input.value); treeSig = null; treeLi = {}; renderTree(); }; // le champ de saisie a remplacé le nom dans le calque : reconstruction forcée même si rien n'a changé
    input.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") finish(true); if (e.key === "Escape") finish(false); });
    input.addEventListener("blur", function () { finish(true); });
    input.addEventListener("click", function (e) { e.stopPropagation(); });
  }
  // Clavier dans l'arbre : ↑ ↓ (parcourir), → ← (déplier, replier, parent), Entrée (écrire), F2 (renommer)
  treeEl.addEventListener("keydown", function (e) {
    var row = e.target.closest && e.target.closest(".pb-row-item");
    if (!row || e.target.tagName === "INPUT" || e.altKey || e.metaKey || e.ctrlKey) return; // raccourcis (Alt + ↑…) : gérés plus bas
    var rows = $$(".pb-row-item", treeEl);
    var i = rows.indexOf(row);
    var id = row.parentNode.dataset.id;
    var it = byId(id);
    var go = function (r) { if (!r) return; rows.forEach(function (x) { x.tabIndex = -1; }); r.tabIndex = 0; r.focus(); select(r.parentNode.dataset.id, e.shiftKey); };
    if (e.key === "ArrowDown") { e.preventDefault(); go(rows[i + 1]); }
    else if (e.key === "ArrowUp") { e.preventDefault(); go(rows[i - 1]); }
    else if (e.key === "ArrowRight" && kidsOf(it) && kidsOf(it).length) { e.preventDefault(); if (collapsed[id]) { toggleCollapse(id, false); focusRow(id); } else go(rows[i + 1]); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); if (kidsOf(it) && kidsOf(it).length && !collapsed[id]) { toggleCollapse(id, true); focusRow(id); } else { var l = locate(id); if (l.parent) { select(l.parent.id); focusRow(l.parent.id); } } }
    else if (e.key === "F2" && canWrite) { e.preventDefault(); startRename(row, it); }
    else if (e.key === "Enter") { e.preventDefault(); select(id); if (INLINE[it.type]) startEdit(id); }
  });
  function focusRow(id) { var r = treeEl.querySelector('.pb-node[data-id="' + id + '"] > .pb-row-item'); if (r) { $$(".pb-row-item", treeEl).forEach(function (x) { x.tabIndex = -1; }); r.tabIndex = 0; r.focus(); } }
  function expandAll() { collapsed = {}; store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  function collapseAll() { walk(function (it) { if (kidsOf(it) && kidsOf(it).length) collapsed[it.id] = true; }); store.set("collapsed-" + PAGE.id, collapsed); renderTree(); }
  // Une seule flèche dans l'en-tête : replier / déplier le panneau Calques (l'inspecteur prend alors toute la hauteur)
  var layersToggle = $("[data-pb-layers-toggle]");
  function applyLayersPanel() {
    var open = !panels.layersCollapsed;
    $("[data-pb-right]").classList.toggle("is-layers-collapsed", !open);
    layersToggle.setAttribute("aria-expanded", String(open));
    layersToggle.setAttribute("aria-label", open ? "Replier le panneau Structure" : "Déplier le panneau Structure");
    layersToggle.setAttribute("data-tip", open ? "Replier le panneau Structure" : "Déplier le panneau Structure");
    layersToggle.textContent = "";
    layersToggle.appendChild(icon(open ? "chevronDown" : "chevronRight"));
  }
  layersToggle.addEventListener("click", function () { panels.layersCollapsed = !panels.layersCollapsed; store.set("panels", panels); applyLayersPanel(); });

  // ---------- Structures : « + » → « Quelle mise en page utiliser ? » (Flexbox ou Grille) → structure réelle ----------
  // Chaque structure est un arbre d'éléments réel (conteneurs flex ou grille, avec leurs réglages tablette et mobile) fourni
  // par le serveur ; l'insérer passe par addItems (historique, calques, enregistrement) comme tout autre ajout.
  var layoutDialog = $("[data-pb-layout]");
  var layoutBody = $("[data-pb-layout-body]");
  var layoutTitle = $("[data-pb-layout-title]");
  var layoutTarget = null;
  var STRUCTURES = SPEC.structures || [], STRUCTURE_KINDS = SPEC.structureKinds || [];
  // Miniature : l'arbre de la structure redessiné en petit avec ses VRAIES valeurs (direction, base de taille, colonnes, étendues)
  function miniature(node, role) {
    var d = (node.styles && node.styles.desktop) || {};
    var kids = node.children || [];
    var el = h("span", { class: "pb-mini" + (role === "root" ? " is-root" : "") + (kids.length ? "" : " is-leaf"), "aria-hidden": "true" });
    var st = el.style;
    if (d.display === "flex") { st.display = "flex"; st.flexDirection = d.flexDirection || "column"; st.gap = "3px"; }
    else if (d.display === "grid") {
      st.display = "grid"; st.gap = "3px";
      st.gridTemplateColumns = d.gridTemplate ? d.gridTemplate.split(" ").map(function (t) { return /fr$/.test(t) ? "minmax(0," + t + ")" : t; }).join(" ") : "repeat(" + (d.columns || 3) + ",minmax(0,1fr))";
      st.gridTemplateRows = "repeat(" + (d.gridRows || 1) + ",1fr)";
    }
    if (role === "cell-flex") { if (d.flexBasis) st.flexBasis = d.flexBasis; if (d.flexGrow !== undefined) st.flexGrow = String(d.flexGrow); if (d.flexShrink !== undefined) st.flexShrink = String(d.flexShrink); st.minWidth = "0"; }
    if (role === "cell-grid") { if (d.gridColumnSpan) st.gridColumn = "span " + d.gridColumnSpan; if (d.gridRowSpan) st.gridRow = "span " + d.gridRowSpan; }
    kids.forEach(function (k) { el.appendChild(miniature(k, d.display === "grid" ? "cell-grid" : "cell-flex")); });
    return el;
  }
  function openStructurePicker(target) {
    if (!canWrite) return;
    if (editing) commitEdit();
    layoutTarget = target;
    if (!layoutDialog.open) layoutDialog.showModal();
    showLayoutKinds(); // après l'ouverture : le focus va au premier choix (Flexbox), pas à la croix
  }
  function showLayoutKinds() {
    layoutTitle.textContent = "Quelle mise en page utiliser ?";
    layoutBody.textContent = "";
    var row = h("div", { class: "pb-layout-kinds", role: "group", "aria-label": "Type de mise en page" });
    STRUCTURE_KINDS.forEach(function (k) {
      var sample = STRUCTURES.filter(function (x) { return x.key === (k.key === "flex" ? "flex-3" : "grid-2x2"); })[0] || STRUCTURES.filter(function (x) { return x.kind === k.key; })[0];
      row.appendChild(h("button", { type: "button", class: "pb-kind", "data-kind": k.key, onclick: function () { showStructures(k.key); } },
        h("span", { class: "pb-kind-art" }, sample ? miniature(sample.tree, "root") : null), h("strong", { class: "pb-kind-name", text: k.label.toUpperCase() }), h("span", { class: "pb-kind-hint", text: k.hint })));
    });
    layoutBody.appendChild(row);
    var first = row.querySelector("button");
    if (first) first.focus();
  }
  function showStructures(kind) {
    var k = STRUCTURE_KINDS.filter(function (x) { return x.key === kind; })[0];
    layoutTitle.textContent = "Choisissez une structure · " + k.label;
    layoutBody.textContent = "";
    layoutBody.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm pb-layout-back", onclick: showLayoutKinds }, "← Changer de mise en page"));
    var grid = h("div", { class: "pb-structures", role: "group", "aria-label": "Structures " + k.label });
    STRUCTURES.filter(function (x) { return x.kind === kind; }).forEach(function (x) {
      grid.appendChild(h("button", { type: "button", class: "pb-structure", "data-structure": x.key, title: x.label, "aria-label": x.label, onclick: function () { layoutDialog.close(); addStructure(x, layoutTarget); } },
        miniature(x.tree, "root"), h("span", { class: "pb-structure-name", text: x.label })));
    });
    layoutBody.appendChild(grid);
    var first = grid.querySelector("button");
    if (first) first.focus();
  }
  function addStructure(x, target) {
    if (!canWrite || !x) return;
    var node = clone(x.tree);
    ensureIds([node]);
    var at = target || insertionPoint({ type: "container" });
    if (at.parent && lockedDeep(at.parent.id)) { toast("Emplacement verrouillé : déverrouillez-le d'abord.", true); return; }
    addItems([node], at, "Structure : " + x.label);
  }
  // Clic sur un « + » du canevas : zone vide d'un conteneur, d'une section libre, ou page vide
  function canvasAdd(btn) {
    if (!canWrite) return;
    var root = btn.getAttribute("data-kw-add") === "root";
    var owner = root ? null : btn.closest("[data-node-id],[data-section-id]");
    var id = idOfEl(owner);
    var it = id ? byId(id) : null;
    if (!root && !it) return;
    if (it && lockedDeep(it.id)) { toast("Emplacement verrouillé : déverrouillez-le d'abord.", true); return; }
    if (it) select(it.id, false, { scroll: false });
    openStructurePicker(root ? { parent: null, index: content.sections.length } : { parent: it, index: (kidsOf(it) || []).length });
  }
  $("[data-pb-layers-add]").addEventListener("click", function () { openStructurePicker(insertionPoint({ type: "container" })); });
  $("[data-pb-expand-all]").addEventListener("click", expandAll);
  $("[data-pb-collapse-all]").addEventListener("click", collapseAll);

  // ---------- Panneau Structure : attaché, détaché (flottant, déplaçable, redimensionnable), fermé ----------
  // Le MÊME panneau change de mode (aucune copie) : sa liste, sa sélection, ses niveaux ouverts et son défilement sont conservés.
  var layersPanel = $("[data-pb-layers-panel]");
  var layersHead = $("[data-pb-layers-head]");
  var rightEl = $("[data-pb-right]");
  var dockBtn = $("[data-pb-layers-dock]");
  var dockClose = $("[data-pb-layers-close]");
  var dockOpen = $("[data-pb-layers-open]");
  var dock = Object.assign({ mode: "docked", last: "docked", x: null, y: null, w: 340, h: 440 }, store.get("layers-dock", {}));
  if (["docked", "floating", "closed"].indexOf(dock.mode) < 0) dock.mode = "docked";
  if (dock.last !== "floating") dock.last = "docked";
  var resizeGrip = h("span", { class: "pb-float-resize", "aria-hidden": "true", "data-tip": "Redimensionner" });
  layersPanel.appendChild(resizeGrip);
  function clampDock() {
    dock.w = Math.min(Math.max(240, Math.round(dock.w)), Math.max(240, window.innerWidth - 16));
    dock.h = Math.min(Math.max(180, Math.round(dock.h)), Math.max(180, window.innerHeight - 16));
    dock.x = Math.min(Math.max(0, Math.round(dock.x)), Math.max(0, window.innerWidth - dock.w));
    dock.y = Math.min(Math.max(0, Math.round(dock.y)), Math.max(0, window.innerHeight - 48));
  }
  function applyDock(initial) {
    var floating = dock.mode === "floating", closed = dock.mode === "closed";
    if (floating && (dock.x === null || dock.y === null)) { var r = rightEl.getBoundingClientRect(); dock.x = Math.max(8, r.left - dock.w - 12); dock.y = Math.max(56, r.top + 8); }
    if (floating) clampDock();
    layersPanel.classList.toggle("is-floating", floating);
    layersPanel.classList.toggle("is-closed", closed);
    rightEl.classList.toggle("is-layers-detached", dock.mode !== "docked");
    if (floating) { layersPanel.style.left = dock.x + "px"; layersPanel.style.top = dock.y + "px"; layersPanel.style.width = dock.w + "px"; layersPanel.style.height = dock.h + "px"; }
    else ["left", "top", "width", "height"].forEach(function (k) { layersPanel.style[k] = ""; });
    dockBtn.textContent = ""; dockBtn.appendChild(icon(floating ? "panelLeft" : "externalLink"));
    var label = floating ? "Rattacher le panneau Structure à l'interface" : "Détacher le panneau Structure (le déplacer et le redimensionner)";
    dockBtn.setAttribute("aria-label", label); dockBtn.setAttribute("data-tip", label);
    dockBtn.setAttribute("aria-pressed", String(floating));
    dockOpen.setAttribute("aria-pressed", String(!closed));
    layersHead.tabIndex = floating ? 0 : -1;
    layersHead.setAttribute("aria-label", floating ? "Panneau Structure flottant : flèches pour le déplacer, Maj + flèches pour le redimensionner" : "");
    store.set("layers-dock", dock);
    if (!initial) { if (zoomFit) applyZoom(); else drawRulers(); }
  }
  function setDockMode(mode) {
    if (mode !== "closed") dock.last = mode;
    dock.mode = mode;
    applyDock();
    if (mode !== "closed" && selection.length) markTreeSelection();
  }
  dockBtn.addEventListener("click", function () { setDockMode(dock.mode === "floating" ? "docked" : "floating"); });
  dockClose.addEventListener("click", function () { setDockMode("closed"); });
  dockOpen.addEventListener("click", function () { setDockMode(dock.mode === "closed" ? dock.last : "closed"); });
  layersHead.addEventListener("dblclick", function (e) { if (!e.target.closest("button")) setDockMode(dock.mode === "floating" ? "docked" : "floating"); });
  // Déplacer (en-tête) et redimensionner (coin) le panneau flottant
  function dockGesture(handle, onMove) {
    handle.addEventListener("pointerdown", function (e) {
      if (dock.mode !== "floating" || (handle === layersHead && e.target.closest("button"))) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      var start = { x: e.clientX, y: e.clientY, dock: Object.assign({}, dock) };
      frame.style.pointerEvents = "none";
      layersPanel.classList.add("is-moving");
      var overRight = function (ev) { var r = rightEl.getBoundingClientRect(); return handle === layersHead && !panels.rightHidden && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; };
      var move = function (ev) { onMove(start, ev.clientX - start.x, ev.clientY - start.y); clampDock(); layersPanel.style.left = dock.x + "px"; layersPanel.style.top = dock.y + "px"; layersPanel.style.width = dock.w + "px"; layersPanel.style.height = dock.h + "px"; rightEl.classList.toggle("is-dock-target", overRight(ev)); };
      // Relâché au-dessus du panneau de droite : le panneau se rattache (comme déposer une fenêtre sur son emplacement)
      var up = function (ev) { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); handle.removeEventListener("pointercancel", up); frame.style.pointerEvents = ""; layersPanel.classList.remove("is-moving"); var dropped = ev && ev.type === "pointerup" && overRight(ev); rightEl.classList.remove("is-dock-target"); store.set("layers-dock", dock); if (dropped) setDockMode("docked"); };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up); handle.addEventListener("pointercancel", up);
    });
  }
  dockGesture(layersHead, function (s, dx, dy) { dock.x = s.dock.x + dx; dock.y = s.dock.y + dy; });
  dockGesture(resizeGrip, function (s, dx, dy) { dock.w = s.dock.w + dx; dock.h = s.dock.h + dy; });
  layersHead.addEventListener("keydown", function (e) {
    if (dock.mode !== "floating" || e.target !== layersHead || ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].indexOf(e.key) < 0) return;
    e.preventDefault();
    var step = 16, dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0, dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
    if (e.shiftKey) { dock.w += dx; dock.h += dy; } else { dock.x += dx; dock.y += dy; }
    applyDock();
  });
  window.addEventListener("resize", function () { if (dock.mode === "floating") applyDock(); });
  applyDock(true);

  // ---------- Palette d'éléments, outils, blocs, composants ----------
  // Glisser depuis la palette : dragNew = { sample, make(cible) }
  function draggableSource(el, sample, make) {
    el.setAttribute("draggable", canWrite ? "true" : "false");
    el.addEventListener("dragstart", function (e) {
      if (!canWrite) { e.preventDefault(); return; }
      dragNew = { sample: sample, make: make }; dragIds = null;
      e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", "pb-new");
    });
  }
  // Bibliothèque de widgets (gauche = créer) : catégories dans l'ordre d'Elementor (fiches du registre, nodes.js WIDGETS),
  // repliables (mémorisé dans ce navigateur). La barre d'outils peut n'afficher qu'une catégorie ; la recherche porte sur tout.
  var elCategory = store.get("el-category", "");
  var elClosed = store.get("el-closed", []);
  function elementGroups() {
    var item = function (t) { var need = deniedWidget(t.type); return { type: t.type, sub: t.sub || null, label: t.label, desc: t.description || null, icon: t.icon, keywords: t.keywords, locked: need ? "Widget " + SPEC.widgetPermissions[need] + "." : null, disabled: t.asks === "course" && !boot.courses.length ? "Publiez d'abord une formation dans le catalogue." : null }; };
    var groups = Object.keys(SPEC.widgetGroups).map(function (k) { return { key: k, label: SPEC.widgetGroups[k], items: SPEC.types.filter(function (t) { return t.group === k; }).map(item) }; });
    groups[0].items.unshift({ type: "layout", label: "Section libre", icon: "layout", keywords: "section libre bloc zone" });
    (SPEC.shortcuts || []).forEach(function (sc) { var g = groups.find(function (x) { return x.key === sc.group; }); if (g) g.items.push({ type: sc.type, sub: sc.sub || null, shortcut: sc, label: sc.label, icon: sc.icon, keywords: sc.keywords }); });
    // Catégorie « Site » : éléments regroupés par sous-catégorie, dans l'ordre voulu
    var subs = SPEC.siteSubs || [], gSite = groups.find(function (x) { return x.key === "site"; });
    if (gSite) gSite.items = gSite.items.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { var ra = a.x.sub ? subs.indexOf(a.x.sub) : subs.length, rb = b.x.sub ? subs.indexOf(b.x.sub) : subs.length; return ra - rb || a.i - b.i; }).map(function (e) { return e.x; });
    var legacy = boot.types.map(function (t) { return { type: t.type, label: t.label, icon: "fileText", disabled: t.unavailable, legacy: true, keywords: t.type === "form" ? "formulaire inscription email champs newsletter" : "section prete" }; });
    var gForm = groups.find(function (g) { return g.key === "form"; });
    gForm.items = gForm.items.concat(legacy.filter(function (t) { return t.type === "form"; }));
    groups.push({ key: "sections", label: "Sections prêtes", items: legacy.filter(function (t) { return t.type !== "form"; }) });
    return groups;
  }
  if (elCategory && !elementGroups().some(function (g) { return g.key === elCategory; })) { elCategory = ""; store.set("el-category", ""); }
  // Favoris et éléments récemment utilisés (préférences d'interface de cette personne, dans ce navigateur)
  var favs = store.get("el-favs", []), recents = store.get("el-recent", []);
  var elKey = function (it) { return it.shortcut ? "x:" + it.shortcut.key : (it.legacy ? "s:" : "n:") + it.type; };
  function useElement(it) { recents = [elKey(it)].concat(recents.filter(function (k) { return k !== elKey(it); })).slice(0, 6); store.set("el-recent", recents); }
  function toggleFav(it) { var k = elKey(it); favs = favs.indexOf(k) >= 0 ? favs.filter(function (x) { return x !== k; }) : favs.concat(k); store.set("el-favs", favs); renderElements($("[data-pb-el-search]").value); }
  function toggleGroup(key) { elClosed = elClosed.indexOf(key) >= 0 ? elClosed.filter(function (k) { return k !== key; }) : elClosed.concat(key); store.set("el-closed", elClosed); renderElements($("[data-pb-el-search]").value); var b = $('[data-pb-group="' + key + '"]'); if (b) b.focus(); }
  function renderElements(filter) {
    var box = $("[data-pb-elements]");
    box.textContent = "";
    var f = norm(filter);
    var groups = elementGroups();
    // Recherche en temps réel : une seule liste, triée par pertinence (nom qui commence par le mot, nom qui le contient,
    // catégorie, mot associé — « image » trouve aussi Galerie et Carrousel d'images)
    if (f) {
      var score = function (it, g) { var l = norm(it.label); return l.indexOf(f) === 0 ? 0 : l.indexOf(f) >= 0 ? 1 : norm(g.label).indexOf(f) >= 0 ? 2 : norm(it.keywords || "").indexOf(f) >= 0 ? 3 : 9; };
      var found = [];
      groups.forEach(function (g, gi) { g.items.forEach(function (it, ii) { var sc = score(it, g); if (sc < 9) found.push({ it: it, sc: sc, o: gi * 100 + ii }); }); });
      found.sort(function (x, y) { return x.sc - y.sc || x.o - y.o; });
      groups = found.length ? [{ key: "results", label: found.length + " résultat" + (found.length > 1 ? "s" : ""), items: found.map(function (x) { return x.it; }), fixed: true }] : [];
    }
    if (!f && !elCategory) {
      var all = [].concat.apply([], groups.map(function (g) { return g.items; }));
      var pick = function (keys) { return keys.map(function (k) { return all.find(function (x) { return elKey(x) === k; }); }).filter(Boolean); };
      var fav = pick(favs), rec = pick(recents.filter(function (k) { return favs.indexOf(k) < 0; }));
      groups = (fav.length ? [{ key: "fav", label: "Favoris", items: fav }] : []).concat(rec.length ? [{ key: "recent", label: "Récemment utilisés", items: rec }] : []).concat(groups);
    }
    var shown = f ? groups : elCategory ? groups.filter(function (g) { return g.key === elCategory; }) : groups;
    if (!f && elCategory) {
      var g0 = groups.find(function (g) { return g.key === elCategory; });
      box.appendChild(h("div", { class: "pb-cat-head" }, h("strong", { text: g0 ? g0.label : "" }), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { setCategory(""); } }, "Tout afficher")));
    }
    shown.forEach(function (g) {
      if (!g.items.length) return;
      var ul = h("ul", { class: "pb-palette", id: "pb-group-" + g.key });
      var lastSub = null;
      g.items.forEach(function (it) {
        if (g.key === "site" && !f && it.sub !== lastSub) { lastSub = it.sub; ul.appendChild(h("li", { class: "pb-pal-subhead", text: it.sub || "Autres" })); }
        var off = it.disabled || it.locked;
        var btn = h("button", { type: "button", class: "pb-pal-item" + (it.locked ? " is-locked" : ""), disabled: !canWrite || Boolean(it.disabled), "aria-disabled": it.locked ? "true" : null, "data-tip": off || it.desc || null, "data-widget": it.shortcut ? it.shortcut.key : it.type,
          onclick: function () { if (it.locked) { toast(it.label + " : " + it.locked, true); return; } useElement(it); if (it.shortcut) addShortcut(it.shortcut); else if (it.legacy) addLegacy(it.type); else addElement(it.type); } },
          icon(it.icon), h("span", { text: it.label }), f && it.legacy && it.type !== "form" ? h("span", { class: "pb-pal-kind", text: "Section prête" }) : null, it.locked ? h("span", { class: "pb-pal-lock", "aria-label": "Réservé" }, icon("lock")) : null);
        if (!off) draggableSource(btn, it.legacy ? { type: it.type, section: true } : { type: it.type }, function (target) { useElement(it); if (it.shortcut) addShortcut(it.shortcut, target); else if (it.legacy) addLegacy(it.type, target); else addElement(it.type, target); });
        var isFav = favs.indexOf(elKey(it)) >= 0;
        var star = h("button", { type: "button", class: "pb-fav", "aria-pressed": String(isFav), "aria-label": (isFav ? "Retirer des favoris : " : "Ajouter aux favoris : ") + it.label, "data-tip": isFav ? "Retirer des favoris" : "Ajouter aux favoris", onclick: function (e) { e.stopPropagation(); toggleFav(it); } }, isFav ? "★" : "☆");
        ul.appendChild(h("li", { class: "pb-pal-li" }, btn, star));
      });
      // Catégorie repliable (sauf résultats de recherche et catégorie choisie dans la barre d'outils)
      var closed = !f && !elCategory && elClosed.indexOf(g.key) >= 0;
      var head = f || elCategory ? (f ? h("h3", { class: "pb-sub", text: g.label }) : null)
        : h("h3", { class: "pb-pal-head" }, h("button", { type: "button", class: "pb-pal-toggle", "aria-expanded": String(!closed), "aria-controls": "pb-group-" + g.key, "data-pb-group": g.key, onclick: function () { toggleGroup(g.key); } },
          icon(closed ? "chevronRight" : "chevronDown"), h("span", { text: g.label }), h("span", { class: "pb-pal-count", text: String(g.items.length) })));
      ul.hidden = closed;
      box.appendChild(h("section", { class: "pb-pal-group", "data-group": g.key }, head, ul));
    });
    if (box.querySelectorAll(".pb-pal-group").length === 0) box.appendChild(h("p", { class: "pb-hint", text: "Aucun widget ne correspond." }));
  }
  // Choisir une catégorie (barre d'outils) : le panneau de gauche s'ouvre sur la bibliothèque correspondante
  function setCategory(key) {
    elCategory = key;
    store.set("el-category", key);
    if (key === "blocks") openTab($("#pb-tab-blocks"));
    else if (key === "components") { openTab($("#pb-tab-elements")); openLibTab($("#pb-lib-components")); }
    else { openTab($("#pb-tab-elements")); openLibTab($("#pb-lib-widgets")); $("[data-pb-el-search]").value = ""; renderElements(""); }
    $$(".pb-tool[data-cat]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.cat === key)); });
  }
  $("[data-pb-el-search]").addEventListener("input", function () { renderElements(this.value); });

  // Barre d'outils (gauche = créer) : modes du canevas, puis catégories de la bibliothèque d'éléments
  var TOOLS = [
    { key: "select", label: "Sélection (V)", icon: "mousePointer", mode: true },
    { key: "hand", label: "Main (H)", tip: "Main : faire défiler la page en la glissant (H)", icon: "arrowRightLeft", mode: true },
    { sep: true },
    { cat: "layout", label: "Mise en page", tip: "Mise en page : section, conteneur, grille, colonnes, pile, groupe", icon: "layout" },
    { cat: "basic", label: "Basique", tip: "Basique : titre, image, texte, vidéo, bouton, séparateur, espaceur, icône…", icon: "type" },
    { cat: "general", label: "Général", tip: "Général : onglets, accordéon, carrousel, galerie, compteur, témoignage, alerte, HTML…", icon: "listChecks" },
    { cat: "form", label: "Formulaire", tip: "Formulaire d'inscription de la page", icon: "fileText" },
    { cat: "advanced", label: "Avancé", tip: "Avancé : compte à rebours, offre tarifaire, fenêtre, infobulle, points d'intérêt, contenu intégré, texte dynamique", icon: "zap" },
    { cat: "site", label: "Site", tip: "Site : menu, fil d'Ariane, recherche, compte du visiteur, derniers articles", icon: "globe" },
    { cat: "commerce", label: "E-commerce", tip: "E-commerce : formations du catalogue (vrai panier KOLAKISA)", icon: "cart" },
    { cat: "social", label: "Réseaux sociaux", tip: "Réseaux sociaux : icônes de vos comptes", icon: "share2" },
    { sep: true },
    { cat: "sections", label: "Sections prêtes", tip: "Sections prêtes : bandeau, points forts, FAQ, appel à l'action…", icon: "listChecks" },
    { cat: "blocks", label: "Blocs", tip: "Blocs : en-têtes, tarifs, témoignages, colonnes… prêts à l'emploi", icon: "columns" },
    { cat: "components", label: "Composants", tip: "Composants réutilisables", icon: "copy" },
  ];
  // Barre d'outils : compacte (icônes, nom en infobulle) ou étendue (icône + nom) — préférence d'interface mémorisée
  var toolLabel = function (label) { return label.replace(/\s*\([^)]*\)$/, ""); };
  function renderTools() {
    var nav = $("[data-pb-tools]");
    nav.textContent = "";
    var expanded = Boolean(panels.toolsExpanded), dense = Boolean(panels.toolsDense);
    nav.appendChild(h("button", { type: "button", class: "pb-tool pb-tools-toggle", "aria-expanded": String(expanded), "aria-label": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils (noms des outils)", "data-tip": expanded ? "Réduire la barre d'outils" : "Déployer la barre d'outils",
      onclick: function () { panels.toolsExpanded = !panels.toolsExpanded; if (panels.toolsExpanded) panels.toolsDense = false; applyPanels(); renderTools(); } }, icon(expanded ? "chevronLeft" : "chevronRight"), h("span", { class: "pb-tool-label", text: expanded ? "Réduire" : "Déployer" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool pb-tools-cols", "aria-pressed": String(dense), "aria-label": dense ? "Barre d'outils sur une colonne" : "Barre d'outils sur deux colonnes", "data-tip": dense ? "Une colonne (compacte)" : "Deux colonnes (outils nommés, barre plus courte)",
      onclick: function () { panels.toolsDense = !panels.toolsDense; if (panels.toolsDense) panels.toolsExpanded = false; applyPanels(); renderTools(); } }, icon("columns"), h("span", { class: "pb-tool-label", text: dense ? "1 colonne" : "2 colonnes" })));
    nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" }));
    TOOLS.forEach(function (t) {
      if (t.sep) { nav.appendChild(h("span", { class: "pb-tools-sep", role: "separator" })); return; }
      var btn = h("button", { type: "button", class: "pb-tool", "aria-label": t.label, "data-tip": t.tip || t.label, "data-mode": t.mode ? t.key : null, "data-cat": t.cat || null,
        "aria-pressed": t.mode ? String(tool === t.key) : String(elCategory === t.cat && !panels.leftHidden),
        onclick: function () { if (t.mode) setTool(t.key); else setCategory(t.cat); } }, icon(t.icon), h("span", { class: "pb-tool-label", text: toolLabel(t.label) }));
      nav.appendChild(btn);
    });
    nav.appendChild(h("span", { class: "pb-tools-grow" }));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Médiathèque", "data-tip": "Médiathèque", onclick: function () { openMedia({ title: "Médiathèque" }); } }, icon("image"), h("span", { class: "pb-tool-label", text: "Médiathèque" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Règles (R)", "data-tip": "Règles (R)", "data-aid": "rulers", "aria-pressed": String(Boolean(aids.rulers)), onclick: function () { setAid("rulers", !aids.rulers); } }, icon("spacing"), h("span", { class: "pb-tool-label", text: "Règles" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Guides", "data-tip": "Afficher les guides (tirez-les depuis les règles)", "data-aid": "guides", "aria-pressed": String(aids.guides !== false), onclick: function () { setAid("guides", aids.guides === false); } }, icon("columns"), h("span", { class: "pb-tool-label", text: "Guides" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Panneau des éléments", "data-tip": panels.leftHidden ? "Afficher le panneau des éléments" : "Masquer le panneau des éléments", "aria-pressed": String(!panels.leftHidden), onclick: function () { togglePanel("left"); } }, icon("layers"), h("span", { class: "pb-tool-label", text: "Éléments" })));
    nav.appendChild(h("button", { type: "button", class: "pb-tool", "aria-label": "Calques", "data-tip": panels.rightHidden ? "Afficher les calques et l'inspecteur" : "Masquer les calques et l'inspecteur", "aria-pressed": String(!panels.rightHidden), onclick: function () { togglePanel("right"); } }, icon("listChecks"), h("span", { class: "pb-tool-label", text: "Calques" })));
  }

  // ---------- Infobulles (une seule, au-dessus de l'interface : jamais coupée par un panneau qui défile) ----------
  var tipEl = h("div", { class: "pb-tip", role: "tooltip", id: "pb-tip", hidden: true });
  document.body.appendChild(tipEl);
  var tipTimer = null, tipFor = null;
  var tipHidAt = 0; // instant où la dernière infobulle visible s'est fermée : passer d'un bouton voisin à l'autre ne réattend pas le délai complet
  function hideTip() { clearTimeout(tipTimer); tipTimer = null; if (tipFor) tipFor.removeAttribute("aria-describedby"); tipFor = null; if (!tipEl.hidden) tipHidAt = Date.now(); tipEl.hidden = true; }
  function showTip(el) {
    var text = el.getAttribute("data-tip");
    if (!text) return;
    // Barre étendue : le nom est déjà affiché, l'infobulle n'ajoute que ce qui manque (raccourci, indisponibilité)
    var label = el.querySelector(".pb-tool-label");
    if ((panels.toolsExpanded || panels.toolsDense) && label && el.closest(".pb-tools") && text === label.textContent && label.scrollWidth <= label.clientWidth) return;
    // « Titre (Ctrl/⌘ + … pour …) » : le titre d'abord, le raccourci en second plan (même texte, rien n'est ajouté ni retiré)
    var kb = /^(.*?)\s*\(([^()]*(?:Ctrl|⌘|Maj|Alt)[^()]*)\)\s*$/.exec(text);
    tipEl.textContent = "";
    if (kb && kb[1]) { tipEl.appendChild(h("span", { class: "pb-tip-title", text: kb[1] })); tipEl.appendChild(h("span", { class: "pb-tip-key", text: kb[2] })); }
    else tipEl.textContent = text;
    tipEl.hidden = false;
    var r = el.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    var side = el.closest(".pb-tools");
    var left = side ? r.right + 10 : r.left + r.width / 2 - t.width / 2;
    var top = side ? r.top + r.height / 2 - t.height / 2 : r.bottom + 8;
    if (!side && top + t.height > window.innerHeight - 8) top = r.top - t.height - 8;
    tipEl.style.left = Math.max(8, Math.min(left, window.innerWidth - t.width - 8)) + "px";
    tipEl.style.top = Math.max(8, Math.min(top, window.innerHeight - t.height - 8)) + "px";
    tipEl.classList.toggle("is-side", Boolean(side));
    el.setAttribute("aria-describedby", "pb-tip");
    tipFor = el;
  }
  // Champ de saisie actif (focus ou saisie en cours) : aucune infobulle ne doit venir le recouvrir
  var isEditing = function (el) { var ae = document.activeElement; return Boolean(ae && ae.matches && ae.matches("input, textarea, select, [contenteditable]") && (el === ae || el.contains(ae))); };
  function armTip(el) {
    if (tipFor === el) return;
    if (isEditing(el) || el.getAttribute("aria-expanded") === "true") { hideTip(); return; }
    var warm = Date.now() - tipHidAt < 250 || !tipEl.hidden;
    hideTip();
    tipFor = el;
    tipTimer = setTimeout(function () { tipFor = null; showTip(el); }, warm ? 40 : 350);
  }
  document.addEventListener("mouseover", function (e) { var el = e.target.closest && e.target.closest("[data-tip]"); if (el) armTip(el); else if (tipFor) hideTip(); });
  document.addEventListener("mouseout", function (e) { var el = e.target.closest && e.target.closest("[data-tip]"); if (el && !el.contains(e.relatedTarget)) hideTip(); });
  document.addEventListener("focusin", function (e) { if (e.target.matches && e.target.matches("input, textarea, select")) { hideTip(); return; } var el = e.target.closest && e.target.closest("[data-tip]"); if (el && el.matches(":focus-visible")) armTip(el); });
  document.addEventListener("focusout", hideTip);
  document.addEventListener("mousedown", hideTip, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" || (e.target.matches && e.target.matches("input, textarea, select"))) hideTip(); }, true); // Échap, ou saisie dans un champ : l'infobulle disparaît
  function setTool(k) {
    tool = k;
    document.dispatchEvent(new CustomEvent("pb:tool", { detail: k }));
    $$(".pb-tool[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === k)); });
    var doc = frame.contentDocument;
    if (doc && doc.body) doc.body.classList.toggle("pb-hand", k === "hand");
    placeCanvasBar();
  }
  // Modèle de l'équipe inséré dans la page en cours : une copie de ses sections (nouveaux identifiants)
  function insertTemplate(t, target) {
    api("GET", "/marketing/site-web/modeles/" + t.id + ".json" + (PAGE.siteId ? "?site=" + PAGE.siteId : "")).then(function (r) {
      var secs = reIdAll(clone(r.template.sections)).map(function (s) { return markSection(s); });
      if (secs.some(function (s) { return s.type === "form"; }) && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription : ce modèle en contient un.", true); return; }
      ensureIds(secs);
      var index = target && target.parent === null ? target.index : insertionPoint({ type: "layout" }).index;
      nextLabel = "Modèle inséré : « " + t.name + " »";
      change(function () { if (!insertInto(null, index, secs)) return false; selection = secs.length ? [secs[0].id] : []; });
      markCanvasSelection(true);
      toast("Modèle « " + t.name + " » inséré (" + secs.length + " section" + (secs.length > 1 ? "s" : "") + ", copie indépendante).");
    }, apiFail);
  }
  function renderBlocks() {
    var box = $("[data-pb-blocks]");
    box.textContent = "";
    if ((boot.templates || []).length) {
      var tl = h("ul", { class: "pb-blocks" });
      boot.templates.forEach(function (t) {
        var btn = h("button", { type: "button", class: "pb-block-item", "data-template": String(t.id), disabled: !canWrite, onclick: function () { insertTemplate(t, null); } }, h("strong", { text: t.name }), h("span", { class: "pb-hint", text: (t.category ? t.category + " · " : "") + t.sections + " section" + (t.sections > 1 ? "s" : "") }));
        draggableSource(btn, { type: "layout" }, function (target) { insertTemplate(t, target); });
        tl.appendChild(h("li", {}, btn));
      });
      box.appendChild(h("section", { class: "pb-pal-group" }, h("h3", { class: "pb-sub", text: "Modèles de l'équipe" }), h("p", { class: "pb-hint", text: "Pages enregistrées avec « Enregistrer comme modèle » : leurs sections sont copiées dans cette page." }), tl));
    }
    var cats = {};
    boot.blocks.forEach(function (b) { (cats[b.category] = cats[b.category] || []).push(b); });
    Object.keys(cats).forEach(function (c) {
      var ul = h("ul", { class: "pb-blocks" });
      cats[c].forEach(function (b) {
        var make = function (target) {
          if (b.sections.some(function (s) { return s.type === "form"; }) && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription : ce bloc en contient un.", true); return; }
          var secs = clone(b.sections); ensureIds(secs);
          var index = target && target.parent === null ? target.index : target && target.parent ? sectionIndex(topOf(target.parent.id)) + 1 : insertionPoint({ type: "layout" }).index;
          change(function () { if (!insertInto(null, index, secs)) return false; selection = [secs[0].id]; });
          markCanvasSelection(true);
        };
        var btn = h("button", { type: "button", class: "pb-block-item", "data-block": b.key, disabled: !canWrite, onclick: function () { make(null); } }, h("strong", { text: b.label }), h("span", { class: "pb-hint", text: b.sections.length > 1 ? b.sections.length + " sections" : "Section libre" }));
        draggableSource(btn, { type: "layout" }, make);
        ul.appendChild(h("li", {}, btn));
      });
      box.appendChild(h("section", { class: "pb-pal-group" }, h("h3", { class: "pb-sub", text: c }), ul));
    });
  }
  function fetchComponent(id) { return api("GET", "/marketing/site-web/composants/" + id + ".json").then(function (r) { return r.component; }); }
  // Onglet Éléments › Composants (ceux de ce site) et › Globales (partagés par tous les sites de l'organisation)
  var compQuery = "";
  $$("[data-pb-comp-q]").forEach(function (q) { q.addEventListener("input", function () { compQuery = norm(q.value); $$("[data-pb-comp-q]").forEach(function (o) { if (o !== q) o.value = q.value; }); renderComponents(); }); });
  // Modifier un composant (nom, portée) : la réponse du serveur remplace la fiche locale
  function updateComponentMeta(c, body, done) {
    api("POST", "/marketing/site-web/composants/" + c.id, body).then(function (r) {
      components = components.map(function (x) { return x.id === c.id ? Object.assign({}, x, { name: r.component.name, global: r.component.global, uses: r.component.uses, kind: r.component.kind, hasDraft: r.component.hasDraft, version: r.component.version, blocks: r.component.blocks }) : x; });
      renderComponents(); toast(done);
    }, apiFail);
  }
  // ---------- Composants réutilisables : enregistrer, retrouver, insérer, modifier, mettre à jour, détacher, supprimer ----------
  // Deux natures. STANDARD : un modèle, ses insertions sont des copies indépendantes. GLOBAL : une référence partagée ; ses insertions sont des instances LIÉES
  // (section « composant ») qui affichent la dernière version diffusée. « Tous les sites » est une portée (colonne site_id), distincte de la nature.
  var plural = function (n, one, many) { return n + " " + (n > 1 ? many : one); };
  function renderComponents() {
    [[$("[data-pb-components]"), "standard", "Aucun composant standard. Sélectionnez un ou plusieurs blocs dans la page, puis « Enregistrer comme composant » (inspecteur, menu clic droit ou Ctrl/⌘ + K)."],
     [$("[data-pb-globals]"), "global", "Aucun composant global. Sélectionnez plusieurs blocs, puis « Enregistrer comme composant » et choisissez « Composant global »."]].forEach(function (x) {
      x[0].textContent = "";
      var all = components.filter(function (c) { return (c.kind || "standard") === x[1]; });
      var list = all.filter(function (c) { return !compQuery || norm(c.name).indexOf(compQuery) >= 0; });
      if (!all.length) x[0].appendChild(h("li", {}, h("p", { class: "pb-hint", text: x[2] })));
      else if (!list.length) x[0].appendChild(h("li", {}, h("p", { class: "pb-hint", text: "Aucun composant ne correspond à la recherche." })));
      list.forEach(function (c) { x[0].appendChild(componentRow(c)); });
    });
  }
  function componentRow(c) {
    var isGlobal = c.kind === "global";
    var meta = [];
    if (c.blocks) meta.push(plural(c.blocks, "bloc", "blocs"));
    if (isGlobal) meta.push(c.uses ? plural(c.uses, "instance liée", "instances liées") : "aucune instance liée");
    if (c.global) meta.push("tous les sites");
    var insertBtn = h("button", { type: "button", class: "btn btn-primary btn-sm", disabled: !canWrite, "data-comp-insert": c.id, "data-tip": isGlobal ? "Insérer une instance liée à ce composant global" : "Insérer une copie indépendante de ce modèle", onclick: function () { insertComponent(c, null); } }, "Insérer");
    draggableSource(insertBtn, { type: isGlobal ? "component" : "layout" }, function (target) { insertComponent(c, target); });
    var more = h("button", { type: "button", class: "pb-icon-btn", "data-comp-menu": c.id, "aria-haspopup": "menu", "aria-label": "Actions du composant « " + c.name + " »", "data-tip": "Plus d'actions", onclick: function (e) { var r = e.currentTarget.getBoundingClientRect(); showMenuEntries(componentMenu(c), r.left, r.bottom + 4, { wide: true }); } }, icon("moreHorizontal"));
    return h("li", { class: "pb-comp pb-comp2", "data-comp": c.id, "data-kind": c.kind || "standard" },
      h("div", { class: "pb-comp-main" },
        h("div", { class: "pb-comp-line" }, h("strong", { class: "pb-comp-name", text: c.name }), h("span", { class: "pb-comp-badge is-" + (c.kind || "standard"), text: isGlobal ? "Global" : "Standard" }), c.hasDraft ? h("span", { class: "pb-comp-badge is-draft", "data-tip": "Des modifications ne sont pas encore diffusées : « Mettre à jour » dans l'éditeur du composant", text: "Brouillon" }) : null),
        h("span", { class: "pb-hint pb-comp-meta", text: meta.join(" · ") })),
      h("div", { class: "pb-comp-actions" }, insertBtn, more));
  }
  function componentMenu(c) {
    var isGlobal = c.kind === "global";
    return [
      ["Modifier le composant", function () { openComponentEditor(c); }, !canWrite],
      ["Renommer", function () { renameComponent(c); }, !canWrite],
      isGlobal ? ["Insérer une copie indépendante", function () { fetchComponent(c.id).then(function (comp) { insertCopy(comp, null, c.name); }, apiFail); }, !canWrite] : null,
      isGlobal ? ["Pages qui l'utilisent…", function () { showComponentPages(c); }, false] : null,
      "-",
      c.global ? (PAGE.siteId ? ["Le réserver au site « " + (PAGE.siteName || "de cette page") + " »", function () { updateComponentMeta(c, { global: false, siteId: PAGE.siteId }, "« " + c.name + " » est maintenant réservé à ce site."); }, !canWrite] : null)
        : ["Le partager avec tous les sites", function () { updateComponentMeta(c, { global: true }, "« " + c.name + " » est maintenant partagé avec tous les sites."); }, !canWrite],
      "-",
      ["Supprimer…", function () { deleteComponentFlow(c); }, !canWrite, "", "is-danger"],
    ].filter(function (x) { return x !== null; });
  }
  function renameComponent(c) {
    ask("Renommer le composant", [["name", "text", "Nouveau nom"]], function (v) { if (v.name && v.name !== c.name) updateComponentMeta(c, { name: v.name }, "Composant renommé : « " + v.name + " »."); });
    var input = $("[data-pb-ask-fields] input[name='name']"); if (input) { input.value = c.name; input.select(); }
  }
  // Ouvre la partie globale cliquée : modèle Theme Builder (si connu) et retour à CETTE page ; la page est enregistrée d'abord (aucune modification perdue)
  function openSitePart(btn) {
    var cid = Number(btn.getAttribute("data-part-edit")), tid = btn.getAttribute("data-part-template");
    if (!cid) return;
    var url = "/marketing/site-web/composants/" + cid + "/editeur?" + (tid ? "modele=" + encodeURIComponent(tid) + "&" : "") + (PAGE.id ? "retour=" + encodeURIComponent("/marketing/pages/" + PAGE.id + "/editeur") : "");
    var go = function () { window.location.assign(url); };
    if (dirty || saving) saveNow().then(go); else go();
  }
  function openComponentEditor(c) {
    var go = function () { window.open("/marketing/site-web/composants/" + c.id + "/editeur", "_blank", "noopener"); };
    if (dirty || saving) saveNow().then(go); else go();
  }
  // Insertion : global → instance liée (référence) ; standard → copie indépendante avec de NOUVEAUX identifiants (jamais ceux du modèle)
  function insertComponent(c, target) {
    if (!canWrite) return;
    if (c.kind === "global") {
      addItems([{ type: "component", componentId: c.id }], { parent: null, index: target && target.parent === null ? target.index : insertionPoint({ type: "component" }).index }, "Insertion : composant global « " + c.name + " »");
      return;
    }
    fetchComponent(c.id).then(function (comp) { insertCopy(comp, target, c.name); }, apiFail);
  }
  function insertCopy(comp, target, name) {
    var sec = markSection(reIdAll([clone(comp.section)])[0]);
    ensureIds([sec]);
    if (refusesLockedWidget([sec])) return;
    var sel = selection.length === 1 ? byId(selection[0]) : null;
    // Un élément ou un conteneur est sélectionné : les blocs du composant s'insèrent à sa place (règles de placement du moteur) ; sinon, une nouvelle section
    if (!target && sec.type === "layout" && sel && isNode(sel) && sec.children && sec.children.length) addItems(sec.children, undefined, "Insertion : « " + name + " »");
    else addItems([sec], { parent: null, index: target && target.parent === null ? target.index : insertionPoint({ type: "layout" }).index }, "Insertion : « " + name + " »");
  }
  // Instance liée → bloc indépendant : même apparence et même contenu, structure native avec de nouveaux identifiants ; annulable
  function detachInstance(it) {
    if (!canWrite || !it || it.type !== "component") return;
    fetchComponent(it.componentId).then(function (comp) {
      var sec = comp.section;
      if (refusesLockedWidget([reId(clone(sec))])) return;
      nextLabel = "Détacher du composant";
      change(function () { var l = locate(it.id); if (!l) return false; var copy = markSection(reId(clone(sec))); copy.id = it.id; ensureIds([copy]); if (it.hideOn) copy.hideOn = it.hideOn; if (it.name) copy.name = it.name; l.list[l.index] = copy; selection = [copy.id]; });
      markCanvasSelection(false);
      toast("Détaché du composant : ce bloc est maintenant indépendant et entièrement modifiable.");
    }, apiFail);
  }
  function showComponentPages(c) {
    api("GET", "/marketing/site-web/composants/" + c.id + "/instances.json").then(function (r) {
      compDialog({ title: "Pages qui utilisent « " + c.name + " »", hideConfirm: true, cancelLabel: "Fermer", build: function (body) {
        if (!r.pages.length) { body.appendChild(h("p", { class: "pb-hint", text: "Aucune page n'utilise ce composant pour l'instant." })); return; }
        body.appendChild(h("p", { class: "pb-hint", text: plural(r.instances, "instance liée", "instances liées") + " dans " + plural(r.pages.length, "page", "pages") + "." }));
        body.appendChild(h("ul", { class: "pb-comp-pages" }, r.pages.map(function (p) { return h("li", {}, h("a", { href: "/marketing/pages/" + p.id + "/editeur", target: "_blank", rel: "noopener", text: p.name }), h("span", { class: "pb-hint", text: " · " + plural(p.count || p.live, "instance", "instances") + (p.status === "published" ? " · en ligne" : "") })); })));
      } });
    }, apiFail);
  }

  // ---------- Boîte de dialogue des composants (une seule, réutilisée ; jetons de l'éditeur, clair et sombre) ----------
  var compDlg = null;
  function compDialog(o) {
    if (!compDlg) {
      compDlg = h("dialog", { class: "pb-modal pb-comp-dlg", "aria-labelledby": "pb-comp-dlg-title" },
        h("form", { method: "dialog" },
          h("div", { class: "pb-modal-head" }, h("h2", { id: "pb-comp-dlg-title", "data-cd-title": "" }), h("span", { class: "pb-modal-spacer" }), h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Fermer", "data-cd-x": "" }, icon("close"))),
          h("div", { class: "pb-comp-dlg-body", "data-cd-body": "" }),
          h("p", { class: "pb-note is-warn", role: "alert", "data-cd-error": "", hidden: true }),
          h("div", { class: "pb-comp-dlg-foot" }, h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-cd-cancel": "" }, "Annuler"), h("button", { type: "submit", class: "btn btn-primary btn-sm", "data-cd-ok": "" }, "Valider"))));
      document.body.appendChild(compDlg);
      compDlg.querySelector("[data-cd-x]").addEventListener("click", function () { compDlg.close(); });
      compDlg.querySelector("[data-cd-cancel]").addEventListener("click", function () { compDlg.close(); });
      compDlg.querySelector("form").addEventListener("submit", function (e) {
        e.preventDefault();
        var fn = compDlg._confirm; if (!fn) return;
        var err = compDlg.querySelector("[data-cd-error]"), ok = compDlg.querySelector("[data-cd-ok]");
        err.hidden = true; ok.disabled = true;
        new Promise(function (resolve) { resolve(fn()); }).then(function (res) { ok.disabled = false; if (res === false) return; compDlg.close(); }, function (e2) { ok.disabled = false; err.textContent = e2 && e2.message ? e2.message : "L'opération a échoué."; err.hidden = false; });
      });
    }
    compDlg.querySelector("[data-cd-title]").textContent = o.title;
    var body = compDlg.querySelector("[data-cd-body]"); body.textContent = "";
    compDlg.querySelector("[data-cd-error]").hidden = true;
    var ok = compDlg.querySelector("[data-cd-ok]"); ok.hidden = Boolean(o.hideConfirm); ok.disabled = false; ok.textContent = o.confirmLabel || "Valider"; ok.classList.toggle("btn-danger", Boolean(o.danger)); ok.classList.toggle("btn-primary", !o.danger);
    compDlg.querySelector("[data-cd-cancel]").textContent = o.cancelLabel || "Annuler";
    compDlg._confirm = o.onConfirm || null;
    o.build(body);
    compDlg.showModal();
    var first = body.querySelector("input:not([type=radio]), input[type=radio]:checked, button, a"); if (first) first.focus();
  }

  // ---------- Enregistrer comme composant : toujours depuis la sélection réelle ----------
  // Un composant est UNE section : un seul bloc (section ou élément) ou plusieurs ÉLÉMENTS, enregistrés dans l'ordre du document avec leur structure interne.
  function componentSource() {
    var items = selectedItems();
    if (!items.length) return { error: "Sélectionnez d'abord un ou plusieurs blocs dans la page." };
    if (items.some(function (x) { return x.type === "component"; })) return { error: "Un composant ne peut pas contenir un autre composant (instance liée) : détachez-la d'abord." };
    var picked = {}; items.forEach(function (x) { picked[x.id] = 1; });
    var top = items.filter(function (x) { var l = locate(x.id); return l && !l.ancestors.some(function (a) { return picked[a.id]; }); });
    var order = {}, n = 0; walk(function (x) { order[x.id] = n++; });
    top.sort(function (a, b) { return order[a.id] - order[b.id]; });
    var section;
    if (top.length === 1 && !isNode(top[0])) section = clone(top[0]);
    else if (top.every(isNode)) section = { type: "layout", children: top.map(clone) };
    else return { error: "Un composant est une seule section : sélectionnez soit une section, soit des éléments (pas plusieurs sections)." };
    delete section.id; delete section.locked;
    var count = 0; var countIn = function (list) { (list || []).forEach(function (x) { count++; countIn(x.children); }); };
    if (section.type === "layout") countIn(section.children); else count = 1;
    return { section: section, top: top, count: count, signature: top.map(function (x) { return x.id; }).join(",") };
  }
  function structureRows(top) {
    var rows = [];
    var visit = function (x, depth) {
      if (rows.length >= 8) return;
      var kids = kidsOf(x) || [];
      rows.push({ label: nameOf(x), depth: depth, icon: blockIcon(x) });
      kids.forEach(function (k) { visit(k, depth + 1); });
    };
    top.forEach(function (x) { visit(x, 0); });
    return rows;
  }
  function openSaveComponent() {
    if (!canWrite) return;
    var src = componentSource();
    if (src.error) { toast(src.error, true); return; }
    var multiple = src.top.length > 1;
    var nameInput = h("input", { type: "text", id: "pb-comp-dlg-name", name: "name", maxlength: "80", required: true, autocomplete: "off", value: multiple ? "" : nameOf(src.top[0]) === typeLabel(src.top[0]) ? "" : nameOf(src.top[0]), placeholder: "Nom du composant" });
    var kindStd = h("input", { type: "radio", name: "kind", value: "standard", id: "pb-comp-kind-std", checked: true });
    var kindGlo = h("input", { type: "radio", name: "kind", value: "global", id: "pb-comp-kind-glo" });
    compDialog({ title: "Enregistrer comme composant", confirmLabel: "Enregistrer", build: function (body) {
      body.appendChild(h("div", { class: "pb-field" }, h("label", { for: "pb-comp-dlg-name", text: "Nom du composant" }), nameInput));
      var rows = structureRows(src.top);
      body.appendChild(h("div", { class: "pb-comp-sum" },
        h("p", { class: "pb-comp-sum-title", text: multiple ? plural(src.top.length, "bloc sélectionné", "blocs sélectionnés") + " · " + plural(src.count, "élément", "éléments") : plural(src.count, "élément", "éléments") + " · " + (isNode(src.top[0]) ? typeLabel(src.top[0]) : "Section") }),
        h("ul", { class: "pb-comp-tree", "aria-label": "Structure enregistrée" }, rows.map(function (r) { return h("li", { style: "padding-left:" + (r.depth * 14) + "px" }, icon(r.icon), h("span", { text: r.label })); })),
        src.count > rows.length ? h("p", { class: "pb-hint", text: "… et " + (src.count - rows.length) + " autre(s) élément(s) imbriqué(s)." }) : null));
      if (multiple) {
        body.appendChild(h("fieldset", { class: "pb-comp-kinds" }, h("legend", { text: "Type de composant" }),
          h("label", { class: "pb-comp-kind", for: "pb-comp-kind-std" }, kindStd, h("span", {}, h("strong", { text: "Composant standard" }), h("small", { text: "Un modèle réutilisable : chaque insertion est une copie indépendante." }))),
          h("label", { class: "pb-comp-kind", for: "pb-comp-kind-glo" }, kindGlo, h("span", {}, h("strong", { text: "Composant global" }), h("small", { text: "Une référence partagée : ses instances liées reçoivent les mises à jour du composant principal." })))));
      } else body.appendChild(h("p", { class: "pb-hint", text: "Composant standard : un modèle réutilisable, chaque insertion est une copie indépendante." }));
    }, onConfirm: function () {
      var nm = nameInput.value.trim();
      if (!nm) throw new Error("Donnez un nom au composant.");
      if (components.some(function (x) { return norm(x.name) === norm(nm); })) throw new Error("Un composant porte déjà ce nom.");
      var now = componentSource();   // la sélection a pu changer pendant que la fenêtre était ouverte
      if (now.error || now.signature !== src.signature) throw new Error("La sélection a changé : fermez cette fenêtre et recommencez.");
      return saveAsComponent(now.section, nm, multiple && kindGlo.checked ? "global" : "standard").then(function () { return true; }, function (err) { throw err; });
    } });
    nameInput.focus();
  }
  function saveAsComponent(section, name, kind) {
    return api("POST", "/marketing/site-web/composants", { name: name, section: section, kind: kind, global: !PAGE.siteId, siteId: PAGE.siteId }).then(function (r) {
      r.component.uses = 0; components.push(r.component); renderComponents();
      toast("Composant « " + r.component.name + " » enregistré (Éléments › " + (kind === "global" ? "Globales" : "Composants") + ").");
      return r.component;
    });
  }

  // ---------- Supprimer : choix explicite quand des instances liées existent ----------
  function deleteComponentFlow(c) {
    api("GET", "/marketing/site-web/composants/" + c.id + "/instances.json").then(function (r) {
      var mode = h("input", { type: "radio", name: "mode", value: "detach", id: "pb-comp-del-detach", checked: true });
      var modeAll = h("input", { type: "radio", name: "mode", value: "instances", id: "pb-comp-del-all" });
      compDialog({ title: "Supprimer ce composant ?", confirmLabel: "Supprimer", danger: true, build: function (body) {
        if (!r.instances) { body.appendChild(h("p", { text: "« " + c.name + " » n'est utilisé par aucune page. Il sera supprimé de la bibliothèque." })); return; }
        body.appendChild(h("p", { text: "« " + c.name + " » possède encore " + plural(r.instances, "instance liée", "instances liées") + " dans " + plural(r.pages.length, "page", "pages") + " (" + r.pages.slice(0, 4).map(function (p) { return "« " + p.name + " »"; }).join(", ") + (r.pages.length > 4 ? "…" : "") + "). Que faire ?" }));
        body.appendChild(h("fieldset", { class: "pb-comp-kinds" }, h("legend", { class: "sr-only", text: "Sort des instances" }),
          h("label", { class: "pb-comp-kind", for: "pb-comp-del-all" }, modeAll, h("span", {}, h("strong", { text: "Supprimer le composant et ses instances" }), h("small", { text: "Retire le composant et ses " + plural(r.instances, "instance liée", "instances liées") + ". Les blocs indépendants ne sont pas touchés." }))),
          h("label", { class: "pb-comp-kind", for: "pb-comp-del-detach" }, mode, h("span", {}, h("strong", { text: "Conserver les instances comme blocs indépendants" }), h("small", { text: "Supprime le composant de la bibliothèque ; chaque instance garde son apparence et son contenu, sans lien." })))));
        body.appendChild(h("p", { class: "pb-hint", text: "Cette action n'est pas annulable : l'historique d'annulation de cette page est réinitialisé." }));
      }, onConfirm: function () { return performComponentDelete(c, r.instances ? (modeAll.checked ? "instances" : "detach") : null); } });
    }, apiFail);
  }
  // Serveur d'abord (une transaction : tout ou rien), puis la page ouverte : son brouillon est converti ici
  function performComponentDelete(c, mode) {
    var needSection = mode === "detach" ? fetchComponent(c.id) : Promise.resolve(null);
    var pid = /^\d+$/.test(String(PAGE.id)) ? Number(PAGE.id) : null;
    return needSection.then(function (comp) {
      return api("POST", "/marketing/site-web/composants/" + c.id + "/supprimer", { mode: mode, skipDraftOfPage: pid }).then(function (r) {
        if (r.revisions && pid && r.revisions[pid]) revision = r.revisions[pid];
        if (mode) {
          var swap = function (list) {
            for (var i = list.length - 1; i >= 0; i--) {
              if (list[i].type !== "component" || list[i].componentId !== c.id) continue;
              if (mode === "instances") list.splice(i, 1);
              else { var copy = markSection(reId(clone(comp.section))); copy.id = list[i].id || copy.id; if (list[i].hideOn) copy.hideOn = list[i].hideOn; if (list[i].name) copy.name = list[i].name; list[i] = copy; }
            }
          };
          swap(content.sections);
          ensureIds(content.sections);
        }
        components = components.filter(function (x) { return x.id !== c.id; });
        past = []; future = []; pastLabels = []; futureLabels = []; lastKey = null; // une suppression de bibliothèque n'est pas annulable : on ne laisse aucune étape qui recréerait une référence orpheline
        selection = selection.filter(function (id) { return byId(id); });
        updateHistoryButtons(); scheduleHistorySave(); renderTree(); renderInspector(); scheduleRender(); scheduleSave(); renderComponents();
        toast(mode === "detach" ? "Composant supprimé ; ses " + plural(r.instances, "instance est devenue indépendante", "instances sont devenues indépendantes") + "." : mode === "instances" ? "Composant et " + plural(r.instances, "instance supprimés", "instances supprimés") + "." : "Composant supprimé.");
        return true;
      });
    });
  }

  // ---------- Champs de l'inspecteur ----------
  var fieldSeq = 0;
  var fid = function () { return "pb-f-" + (++fieldSeq); };
  // ---------- Données dynamiques : sélecteur d'étiquettes {{article.titre}}… (moteur : src/marketing/pages/dynamic.js) ----------
  var dynPop = null;
  function closeDynPicker() { if (dynPop) { dynPop.remove(); dynPop = null; } }
  // pick(token) : appelée avec « {{post.title}} » ; kinds : types de sources proposés (texte, adresse, image)
  function openDynPicker(anchor, pick, kinds) {
    closeDynPicker();
    var cat = SPEC.dynamic, q = h("input", { type: "search", class: "pb-dyn-search", placeholder: "Rechercher une donnée…", "aria-label": "Rechercher une donnée dynamique" });
    var list = h("div", { class: "pb-dyn-list", role: "listbox", "aria-label": "Données dynamiques" });
    var draw = function () {
      list.textContent = "";
      var term = norm(q.value);
      cat.groups.forEach(function (g) {
        var items = cat.sources.filter(function (x) { return x.group === g.key && (!kinds || kinds.indexOf(x.kind) >= 0 || x.kind === "text" && kinds.indexOf("text") >= 0) && (!term || norm(x.label + " " + x.key).indexOf(term) >= 0); });
        if (!items.length) return;
        list.appendChild(h("p", { class: "pb-dyn-group", text: g.label }));
        items.forEach(function (x) { list.appendChild(h("button", { type: "button", role: "option", class: "pb-dyn-item", onclick: function () { closeDynPicker(); pick("{{" + x.key + "}}"); } }, h("span", { text: x.label }), h("code", { text: x.key }))); });
      });
      if (!list.children.length) list.appendChild(h("p", { class: "pb-hint", text: "Aucune donnée ne correspond." }));
    };
    q.addEventListener("input", draw);
    dynPop = h("div", { class: "pb-dyn-pop", role: "dialog", "aria-label": "Insérer une donnée dynamique" }, q, list,
      h("p", { class: "pb-hint", text: "La donnée est lue à chaque affichage de la page. Filtres : {{post.title | truncate: 40}}, {{user.first_name | fallback: ami}}." }));
    document.body.appendChild(dynPop);
    draw();
    var r = anchor.getBoundingClientRect();
    dynPop.style.top = Math.min(r.bottom + 4, window.innerHeight - dynPop.offsetHeight - 8) + "px";
    dynPop.style.left = Math.max(8, Math.min(r.left - 220, window.innerWidth - dynPop.offsetWidth - 8)) + "px";
    q.focus();
    dynPop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeDynPicker(); anchor.focus(); } });
    setTimeout(function () { document.addEventListener("mousedown", function away(e) { if (dynPop && !dynPop.contains(e.target) && e.target !== anchor) { closeDynPicker(); } if (!dynPop) document.removeEventListener("mousedown", away); }); }, 0);
  }
  // Le contenu d'un élément contient-il une étiquette ? (l'écriture directe l'écraserait : on passe par l'inspecteur)
  var hasDynamic = function (it) { return /\{\{\s*[a-z]+\.[a-z_]+/i.test(JSON.stringify(it.props || {})); };
  function dynButton(input, opts) {
    return h("button", { type: "button", class: "pb-icon-btn pb-dyn-btn", "aria-label": "Insérer une donnée dynamique", "data-tip": "Donnée dynamique : titre, image, adresse… lus à chaque affichage", disabled: opts.disabled || null,
      onclick: function (e) {
        var btn = e.currentTarget;
        openDynPicker(btn, function (token) {
          var a = input.selectionStart === undefined || input.selectionStart === null ? input.value.length : input.selectionStart, b = input.selectionEnd === undefined || input.selectionEnd === null ? a : input.selectionEnd;
          input.value = input.value.slice(0, a) + token + input.value.slice(b);
          input.dispatchEvent(new Event(opts.onChange ? "change" : "input", { bubbles: true }));
          input.focus();
        }, opts.dynKinds || ["text"]);
      } }, icon("braces"));
  }
  function textField(label, value, onInput, opts) {
    opts = opts || {};
    var id = fid();
    var input = opts.multiline ? h("textarea", { id: id, rows: opts.rows || "4", maxlength: opts.max ? String(opts.max) : null, disabled: opts.disabled }) : h("input", { id: id, type: opts.type || "text", maxlength: opts.max ? String(opts.max) : null, disabled: opts.disabled, list: opts.list || null, placeholder: opts.placeholder || null });
    input.value = value === undefined || value === null ? "" : value;
    input.addEventListener(opts.onChange ? "change" : "input", function () { onInput(input.value); });
    var probe = function () { onInput(input.value); };
    if (opts.dyn) return withRestore(h("div", { class: "pb-field pb-field-dyn" }, h("label", { for: id, text: label }), h("div", { class: "pb-dyn-row" }, input, dynButton(input, opts)), opts.hint ? h("p", { class: "pb-hint", text: opts.hint }) : null), probe);
    return withRestore(h("div", { class: "pb-field" }, h("label", { for: id, text: label }), input, opts.hint ? h("p", { class: "pb-hint", text: opts.hint }) : null), probe);
  }
  // Champ numérique d'un contenu (pas d'un style) : même NumericControl que l'inspecteur de style
  function numberField(label, value, cfg, apply, hint) {
    var id = fid();
    var ctl = numericControl(Object.assign({ id: id, label: label, value: value === undefined || value === null ? "" : value, drag: true, placeholder: "" }, cfg, {
      onCommit: function (raw, u, opts) { if (raw === "") return cfg.allowEmpty === false ? false : apply(null, opts); return apply(Number(raw), opts); } }));
    var lab = h("label", { for: id, text: label });
    if (ctl.scrub) ctl.scrub(lab);
    return withRestore(h("div", { class: "pb-field" }, lab, ctl, hint ? h("p", { class: "pb-hint", text: hint }) : null), function () { apply(Number(value) || 0, {}); });
  }
  // Réglage facultatif d'un widget animé : la valeur par défaut est retirée des données (rien de superflu enregistré)
  function optSelect(it, label, key, current, options, dflt, disabled) {
    return selectField(label, String(current === undefined || current === null ? dflt : current), options, function (v) { change(function () { var x = byId(it.id).props; if (v === dflt) delete x[key]; else x[key] = /^-?\d+$/.test(v) ? Number(v) : v; }); }, { disabled: disabled });
  }
function selectField(label, value, options, onChange, opts) {
    opts = opts || {};
    var id = fid();
    var sel = h("select", { id: id, disabled: opts.disabled }, options.map(function (o) { return h("option", { value: String(o[0]), text: o[1] }); }));
    sel.value = value === undefined || value === null ? String(options[0][0]) : String(value);
    sel.addEventListener("change", function () { onChange(sel.value); });
    return withRestore(h("div", { class: "pb-field" }, h("label", { for: id, text: label }), sel), function () { onChange(sel.value); });
  }
  // Mouvement du menu : animation d'ouverture des sous-menus / méga-menus, durée, courbe, délais, cascade, animation des liens au survol (props.menuMotion ; chaque valeur par défaut est retirée)
  function menuMotionPanel(box, it, p, disabled) {
    var mm = p.menuMotion || {};
    var set = function (key, v, dflt) { change(function () { var x = byId(it.id).props; x.menuMotion = x.menuMotion || {}; if (v === "" || v === null || v === dflt) delete x.menuMotion[key]; else x.menuMotion[key] = v; if (!Object.keys(x.menuMotion).length) delete x.menuMotion; }); };
    box.appendChild(h("p", { class: "pb-hint", text: "Ouverture fluide des sous-menus avec délais (évite les fermetures accidentelles). Désactivé tant que rien n'est réglé." }));
    box.appendChild(selectField("Animation d'ouverture", mm.enter || "none", [["none", "Aucune (affichage direct)"], ["fade", "Fondu"], ["slide-up", "Glisse vers le haut"], ["slide-down", "Glisse vers le bas"], ["slide-left", "Glisse vers la gauche"], ["slide-right", "Glisse vers la droite"], ["zoom", "Zoom"], ["flip", "Bascule"], ["blur", "Flou"], ["clip", "Révélation (masque)"]], function (v) { change(function () { var x = byId(it.id).props; x.menuMotion = x.menuMotion || {}; if (v === "none") delete x.menuMotion.enter; else x.menuMotion.enter = v; if (!Object.keys(x.menuMotion).length) delete x.menuMotion; }); }, { disabled: disabled }));
    [["duration", "Durée (ms)", 180, 0, 1500], ["openDelay", "Délai d'ouverture (ms)", 0, 0, 1000], ["closeDelay", "Délai de fermeture (ms)", 0, 0, 1500], ["distance", "Distance de glissement (px)", 10, 0, 80], ["cascade", "Décalage entre éléments (ms, 0 = pas de cascade)", 0, 0, 250]].forEach(function (f) {
      box.appendChild(numberField(f[1], mm[f[0]] === undefined ? f[2] : mm[f[0]], { min: f[3], max: f[4], step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; set(f[0], n, f[2]); }));
    });
    box.appendChild(selectField("Courbe", mm.ease || "ease", [["ease", "Douce"], ["ease-out", "Freinée"], ["ease-in-out", "Entrée et sortie"], ["linear", "Linéaire"], ["snappy", "Nerveuse"], ["spring", "Ressort"], ["smooth", "Fluide"]], function (v) { set("ease", v, "ease"); }, { disabled: disabled }));
    box.appendChild(selectField("Lien au survol", mm.linkHover || "none", [["none", "Aucun"], ["lift", "Se soulève"], ["shift", "Se décale"], ["grow", "Grossit"], ["shrink", "Rétrécit"], ["tilt", "S'incline"]], function (v) { set("linkHover", v, "none"); }, { disabled: disabled }));
    if (mm.linkHover) box.appendChild(numberField("Intensité du survol (px ou %)", mm.hoverDistance === undefined ? 3 : mm.hoverDistance, { min: 1, max: 30, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; set("hoverDistance", n, 3); }));
  }
  // Style INDIVIDUEL d'un lien du menu : un lien, une partie (lien, sous-menu, icône, badge), un état, un écran ; chaque valeur ne touche que ce lien (props.itemStyles).
  var LINK_STYLE_SEL = { key: "p0", part: "link", state: "base", bp: "desktop" };
  var LINK_STYLE_FIELDS = [["color", "Couleur du texte", "#rrggbb"], ["backgroundColor", "Fond", "#rrggbb"], ["fontSize", "Taille du texte", "16px"], ["fontWeight", "Épaisseur (300 à 900)", "600"], ["letterSpacing", "Espacement des lettres", "1px"], ["textTransform", "Casse (none, uppercase, lowercase, capitalize)", "uppercase"], ["paddingTop", "Marge intérieure haut", "6px"], ["paddingRight", "Marge intérieure droite", "14px"], ["paddingBottom", "Marge intérieure bas", "6px"], ["paddingLeft", "Marge intérieure gauche", "14px"], ["borderRadius", "Arrondi", "999px"], ["borderWidth", "Épaisseur de bordure", "1px"], ["borderColor", "Couleur de bordure", "#rrggbb"], ["opacity", "Opacité (0 à 1)", "1"]];
  function linkStylePanel(box, it, p, disabled) {
    var sel = LINK_STYLE_SEL, entries = p.itemStyles || {};
    var keys = []; (p.items || []).forEach(function (m, i) { keys.push(["p" + i, (m.label || "Lien " + (i + 1)) + (entries["p" + i] ? " ●" : "")]); (m.children || []).forEach(function (c, j) { keys.push(["p" + i + "-" + j, "   ↳ " + (c.label || "Sous-lien") + (entries["p" + i + "-" + j] ? " ●" : "")]); }); });
    if (!keys.length) for (var n = 0; n < 12; n++) keys.push(["p" + n, "Lien n° " + (n + 1) + (entries["p" + n] ? " ●" : "")]);
    keys.push(["panel", "Panneau du menu mobile" + (p.panelStyles ? " ●" : "")]);
    var isPanel = sel.key === "panel";
    if (!keys.some(function (k) { return k[0] === sel.key; })) sel.key = keys[0][0];
    if (isPanel && ["panel", "backdrop", "close", "links", "list"].indexOf(sel.part) < 0) sel.part = "panel";
    if (!isPanel && ["link", "sub", "icon", "badge"].indexOf(sel.part) < 0) sel.part = "link";
    var rerender = function () { renderInspector(); };
    box.appendChild(h("p", { class: "pb-hint", text: "Choisissez un lien, un état et un écran : les valeurs saisies ne s'appliquent qu'à ce lien (● = déjà personnalisé). Laissez vide pour retirer une valeur." }));
    box.appendChild(selectField("Lien", sel.key, keys, function (v) { if (probing) return; sel.key = v; rerender(); }, { disabled: disabled }));
    box.appendChild(selectField("Partie", sel.part, isPanel ? [["panel", "Le panneau"], ["backdrop", "Le fond assombri"], ["close", "Le bouton de fermeture"], ["links", "Les liens du panneau"], ["list", "La liste du panneau"]] : [["link", "Le lien"], ["sub", "Son sous-menu / méga-menu"], ["icon", "Son icône"], ["badge", "Son badge"]], function (v) { if (probing) return; sel.part = v; rerender(); }, { disabled: disabled }));
    box.appendChild(selectField("État", sel.state, [["base", "Normal"], ["hover", "Survol"], ["focus", "Focus clavier"], ["active", "Clic"], ["current", "Page courante"]], function (v) { if (probing) return; sel.state = v; rerender(); }, { disabled: disabled }));
    box.appendChild(selectField("Écran", sel.bp, [["desktop", "Ordinateur"], ["tablet", "Tablette"], ["mobile", "Mobile"]], function (v) { if (probing) return; sel.bp = v; rerender(); }, { disabled: disabled }));
    // chemin des réglages : base → styles[écran] ; survol, focus, clic → states[état ou état@écran] ; page courante → current[écran]
    var bag = function (x, create) {
      var e;
      if (isPanel) { e = x.panelStyles = x.panelStyles || {}; e = e[sel.part] = e[sel.part] || {}; if (sel.state === "current") sel.state = "base"; }
      else { e = x.itemStyles = x.itemStyles || {}; e = e[sel.key] = e[sel.key] || {}; e = e[sel.part] = e[sel.part] || {}; }
      if (sel.state === "base") { if (!create && !e.styles) return null; e.styles = e.styles || {}; return (e.styles[sel.bp] = e.styles[sel.bp] || {}); }
      if (sel.state === "current") { if (!create && !e.current) return null; e.current = e.current || {}; return (e.current[sel.bp] = e.current[sel.bp] || {}); }
      var k = sel.bp === "desktop" ? sel.state : sel.state + "@" + sel.bp; if (!create && !e.states) return null; e.states = e.states || {}; return (e.states[k] = e.states[k] || {});
    };
    var read = function (k) { var e = isPanel ? (p.panelStyles || {})[sel.part] : entries[sel.key] && entries[sel.key][sel.part]; if (!e) return ""; var set = sel.state === "base" ? e.styles && e.styles[sel.bp] : sel.state === "current" ? e.current && e.current[sel.bp] : e.states && e.states[sel.bp === "desktop" ? sel.state : sel.state + "@" + sel.bp]; return set && set[k] !== undefined ? String(set[k]) : ""; };
    var prune = function (x) { if (isPanel) { var pe = x.panelStyles || {}; Object.keys(pe).forEach(function (pp) { var t = pe[pp]; ["styles", "states"].forEach(function (g) { if (t[g]) { Object.keys(t[g]).forEach(function (b) { if (!Object.keys(t[g][b]).length) delete t[g][b]; }); if (!Object.keys(t[g]).length) delete t[g]; } }); if (!Object.keys(t).length) delete pe[pp]; }); if (!Object.keys(pe).length) delete x.panelStyles; return; } var e = x.itemStyles; Object.keys(e).forEach(function (kk) { Object.keys(e[kk]).forEach(function (pp) { var t = e[kk][pp]; ["styles", "states", "current"].forEach(function (g) { if (t[g]) { Object.keys(t[g]).forEach(function (b) { if (!Object.keys(t[g][b]).length) delete t[g][b]; }); if (!Object.keys(t[g]).length) delete t[g]; } }); if (!Object.keys(t).length) delete e[kk][pp]; }); if (!Object.keys(e[kk]).length) delete e[kk]; }); if (!Object.keys(e).length) delete x.itemStyles; };
    LINK_STYLE_FIELDS.forEach(function (f) {
      box.appendChild(textField(f[1], read(f[0]), function (v) {
        change(function () { var x = byId(it.id).props, val = String(v).trim(), set = bag(x, val !== ""); if (val === "") { if (set) delete set[f[0]]; if (x.itemStyles || x.panelStyles) prune(x); } else set[f[0]] = /^-?\d+(\.\d+)?$/.test(val) && ["opacity"].indexOf(f[0]) < 0 && f[0] !== "fontWeight" ? val + "px" : val; }, { key: it.id + ":is" + sel.key + sel.part + sel.state + sel.bp + f[0], light: true });
      }, { max: 40, disabled: disabled, onChange: true, hint: f[2] ? "Exemple : " + f[2] : "" }));
    });
    box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || !(isPanel ? p.panelStyles : entries[sel.key]), onclick: function () { change(function () { var x = byId(it.id).props; if (isPanel) { delete x.panelStyles; } else if (x.itemStyles) { delete x.itemStyles[sel.key]; prune(x); } }); toast("Réglages réinitialisés."); } }, isPanel ? "Réinitialiser le panneau" : "Réinitialiser ce lien"));
    box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || isPanel || !entries[sel.key], onclick: function () { LINK_STYLE_CLIP = JSON.parse(JSON.stringify(entries[sel.key])); toast("Style du lien copié."); } }, "Copier le style de ce lien"));
    box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || isPanel || !LINK_STYLE_CLIP, onclick: function () { change(function () { var x = byId(it.id).props; x.itemStyles = x.itemStyles || {}; x.itemStyles[sel.key] = JSON.parse(JSON.stringify(LINK_STYLE_CLIP)); }); toast("Style collé sur ce lien."); } }, "Coller le style copié"));
  }
  var LINK_STYLE_CLIP = null;
  function checkField(label, value, onChange, opts) {
    var cb = h("input", { type: "checkbox", disabled: opts && opts.disabled });
    cb.checked = Boolean(value);
    cb.addEventListener("change", function () { onChange(cb.checked); });
    var lab = withRestore(h("label", { class: "pb-check" }, cb, " " + label), function () { onChange(cb.checked); });
    return opts && opts.hint ? h("div", {}, lab, h("p", { class: "pb-hint", text: opts.hint })) : lab;
  }
  document.body.appendChild(h("datalist", { id: "pb-tags" }, (boot.tags || []).map(function (t) { return h("option", { value: t }); })));
  document.body.appendChild(h("datalist", { id: "pb-links" }, boot.links.map(function (l) { return h("option", { value: l.url, label: l.label }); })));

  // Contenu de chaque élément (onglet « Contenu »)
  // Widget personnalisé : champs de l'inspecteur générés depuis sa description (src/marketing/pages/widgets)
  // Un champ simple d'un widget personnalisé ; set(valeur, léger, clé) l'enregistre (léger = saisie au clavier : une seule étape d'annulation par rafale)
  function schemaScalar(f, val, set, disabled, widgetType) {
    var frag = document.createDocumentFragment();
    if (f.kind === "text" || f.kind === "textarea" || f.kind === "link") frag.appendChild(textField(f.label, val, function (v) { set(v, true); }, { max: f.max || (f.kind === "textarea" ? 1000 : f.kind === "link" ? 500 : 200), multiline: f.kind === "textarea", list: f.kind === "link" ? "pb-links" : null, placeholder: f.kind === "link" ? "/catalogue, /p/…, #ancre ou https://…" : null, disabled: disabled }));
    else if (f.kind === "number") frag.appendChild(numberField(f.label, val, { min: f.min, max: f.max, step: f.step || 1, integer: f.integer || Number.isInteger(f.min) && Number.isInteger(f.max) && !f.step, disabled: disabled }, function (n, opts) { if (n === null) return false; set(n, opts && opts.light, opts && opts.key); }, "Entre " + f.min + " et " + f.max + "."));
    else if (f.kind === "select") frag.appendChild(selectField(f.label, val, f.options, function (v) { set(v); }, { disabled: disabled }));
    else if (f.kind === "bool") frag.appendChild(checkField(f.label, val === true, function (v) { set(v); }, { disabled: disabled }));
    else if (f.kind === "image") {
      frag.appendChild(h("p", { class: "pb-sub", text: f.label }));
      frag.appendChild(mediaPreview(val, function (m) { set(m.path); }, disabled));
      if (val && !f.required) frag.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { set(""); } }, "Retirer l'image"));
    } else if (f.kind === "icon") { frag.appendChild(h("p", { class: "pb-sub", text: f.label })); frag.appendChild(iconPicker(val || "", function (v) { set(v); }, disabled)); }
    else if (f.kind === "color") { var cid = fid(); frag.appendChild(h("div", { class: "pb-field" }, h("label", { for: cid, text: f.label }), colorButton(cid, val, undefined, disabled, function (v, o) { set(v || "", o && o.light); }, "w-" + widgetType + "-" + f.key))); }
    return frag;
  }
  // Valeur de départ d'un nouvel élément d'une liste : défaut du sous-champ, sinon vide / 1re option / minimum
  function blankItem(f) {
    var o = {};
    f.fields.forEach(function (sf) { o[sf.key] = sf.default !== undefined ? sf.default : sf.kind === "bool" ? false : sf.kind === "number" ? sf.min : sf.kind === "select" ? sf.options[0][0] : ""; });
    return o;
  }
  // Liste d'éléments répétés (diapositives, liens, témoignages…) : ajouter, supprimer, réordonner, et chaque sous-champ modifie le rendu réel
  function itemsEditor(it, f, disabled) {
    var list = (it.props && it.props[f.key]) || [], min = f.min || 0;
    // Les actions relisent TOUJOURS la liste courante de l'élément (une saisie « légère » ne reconstruit pas l'inspecteur : la liste capturée à l'affichage serait périmée)
    var live = function () { var n = byId(it.id); return (n && n.props && n.props[f.key]) || []; };
    var wrap = h("div", { class: "pb-items", role: "group", "aria-label": f.label });
    wrap.appendChild(h("p", { class: "pb-sub", text: f.label + " (" + list.length + (f.max ? " sur " + f.max : "") + ")" }));
    var commit = function (next, light, key) { setProp(it.id, f.key, next, light ? { key: key, light: true } : null); };
    list.forEach(function (item, i) {
      var move = function (d) { var cur = live(), next = cur.slice(), t = next[i]; next[i] = next[i + d]; next[i + d] = t; commit(next); };
      var head = h("div", { class: "pb-items-head" }, h("strong", { text: "Élément " + (i + 1) }), h("span", { class: "pb-items-tools" },
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Monter l'élément " + (i + 1), "data-tip": "Monter", disabled: disabled || i === 0, onclick: function () { move(-1); } }, icon("arrowUp")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Descendre l'élément " + (i + 1), "data-tip": "Descendre", disabled: disabled || i === list.length - 1, onclick: function () { move(1); } }, icon("arrowDown")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Dupliquer l'élément " + (i + 1), "data-tip": "Dupliquer", disabled: disabled || list.length >= f.max, onclick: function () { var cur = live(), next = cur.slice(); next.splice(i + 1, 0, Object.assign({}, cur[i])); commit(next); } }, icon("copy")),
        h("button", { type: "button", class: "pb-icon-btn is-danger", "aria-label": "Supprimer l'élément " + (i + 1), "data-tip": "Supprimer", disabled: disabled || list.length <= min, onclick: function () { commit(live().filter(function (_, k) { return k !== i; })); } }, icon("trash"))));
      var card = h("div", { class: "pb-items-item" }, head);
      f.fields.forEach(function (sf) {
        var set = function (v, light, key) { var next = live().map(function (x) { return Object.assign({}, x); }); if (!next[i]) return; next[i][sf.key] = v; commit(next, light, key || it.id + ":" + f.key + ":" + i + ":" + sf.key); };
        card.appendChild(schemaScalar(sf, item[sf.key], set, disabled, it.type));
      });
      wrap.appendChild(card);
    });
    wrap.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || list.length >= f.max, onclick: function () { commit(live().concat([blankItem(f)])); } }, icon("plus"), "Ajouter un élément"));
    return wrap;
  }
  function schemaFields(it, box, disabled) {
    var p = it.props || (it.props = {});
    (NT[it.type].schema || []).forEach(function (f) {
      if (f.kind === "items") { box.appendChild(itemsEditor(it, f, disabled)); return; }
      var set = function (v, light, key) { setProp(it.id, f.key, v, light ? { key: key || it.id + ":" + f.key, light: true } : null); };
      box.appendChild(schemaScalar(f, p[f.key], set, disabled, it.type));
    });
  }
  // Groupes repliables (un seul ouvert à la fois) pour les réglages des éléments d'en-tête : même présentation que l'onglet « En-tête »
  var accOpenFor = {}; // élément → groupe ouvert : le groupe reste ouvert quand le panneau se redessine après une modification
  function accGroups(root, nodeId) {
    var first = true;
    return function (title) {
      var want = accOpenFor[nodeId], isOpen = want === undefined ? first : want === title; first = false;
      var det = h("details", { class: "pb-hdr-acc", open: isOpen ? "" : null });
      det.appendChild(h("summary", {}, h("span", { class: "pb-hdr-acc-title", text: title }), h("span", { class: "pb-hdr-acc-chev", "aria-hidden": "true" }, icon("chevronRight"))));
      var body = h("div", { class: "pb-hdr-acc-body" }); det.appendChild(body);
      det.addEventListener("toggle", function () {
        if (det.open) { accOpenFor[nodeId] = title; [].forEach.call(root.querySelectorAll(":scope > details.pb-hdr-acc"), function (o) { if (o !== det && o.open) o.open = false; }); }
        else if (accOpenFor[nodeId] === title) accOpenFor[nodeId] = "";
      });
      root.appendChild(det); return body;
    };
  }
  function nodeContentFields(it, box, disabled) {
    var p = it.props || (it.props = {});
    if (NT[it.type] && NT[it.type].schema && !deniedWidget(it.type)) {
      if (NT[it.type].motion && window.pbMotionStudio && window.pbMotionStudio.panel(it, box, disabled)) return; // composant Motion Studio : panneau à six sections (page-builder-motion-studio.js)
      schemaFields(it, box, disabled); return;
    }
    if (deniedWidget(it.type)) { box.appendChild(h("p", { class: "pb-note is-warn" }, icon("lock"), h("span", { text: "Widget " + SPEC.widgetPermissions[deniedWidget(it.type)] + " : vous pouvez le déplacer ou le supprimer, pas le modifier." }))); disabled = true; }
    var set = function (k, light) { return function (v) { setProp(it.id, k, v, { key: it.id + ":" + k, light: light !== false }); }; };
    // Deux réglages qui ne s'affichent qu'ENSEMBLE (ex. texte + adresse d'un bouton) : quand un seul est rempli, on le dit au lieu de ne rien montrer
    var pairSet = function (k, other, what) { return function (v) { set(k)(v); if (!String(v || "").trim() !== !(byId(it.id).props[other] || "").toString().trim()) toast(what + " n'apparaît que si le texte ET l'adresse sont remplis."); }; };
    var grp = ["menu", "sitelogo", "search", "account"].indexOf(it.type) >= 0 && isHeaderDoc() ? accGroups(box, it.id) : null;
    switch (it.type) {
      case "heading":
        box.appendChild(textField("Texte", p.text, set("text"), { max: 200, disabled: disabled, dyn: true, hint: "Ou double-cliquez sur le titre dans la page. { } : insérer une donnée dynamique." }));
        box.appendChild(selectField("Niveau", p.level, [["1", "Titre 1 (un seul par page)"], ["2", "Titre 2"], ["3", "Titre 3"], ["4", "Titre 4"], ["5", "Titre 5"], ["6", "Titre 6"]], set("level", false), { disabled: disabled }));
        box.appendChild(selectField("Balise HTML", p.tag || "", [["", "Titre (selon le niveau)"], ["p", "Paragraphe"], ["div", "Bloc (div)"], ["span", "Texte en ligne (span)"]], function (v) { change(function () { var x = byId(it.id).props; if (v) x.tag = v; else delete x.tag; }); }, { disabled: disabled, hint: "Un titre aide les moteurs de recherche et les lecteurs d'écran ; choisissez autre chose seulement pour un simple texte d'apparence de titre." }));
        box.appendChild(textField("Lien (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, dyn: true, dynKinds: ["url"], placeholder: "/catalogue, /p/…, #ancre ou https://…", hint: "Tout le titre devient cliquable sur la page publiée." }));
        box.appendChild(checkField("Ouvrir le lien dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        break;
      case "text":
        box.appendChild(h("p", { class: "pb-hint", text: "Double-cliquez sur le texte dans la page pour l'écrire directement : gras, italique, liens, listes, couleurs… dans la barre du haut." }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { startEdit(it.id); } }, "Écrire dans la page"));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, "data-tip": "Ajoute à la fin du texte une donnée lue à chaque affichage (titre, prix, date…)",
          onclick: function (e) { openDynPicker(e.currentTarget, function (token) { change(function () { var x = byId(it.id); x.props.html = (x.props.html || "") + "<p>" + token + "</p>"; }); }, ["text"]); } }, "Insérer une donnée dynamique"));
        box.appendChild(checkField("Lettrine (première lettre agrandie)", p.dropCap, function (v) { setProp(it.id, "dropCap", v); }, { disabled: disabled, hint: "Les colonnes de texte se règlent dans Style → Typographie (« Colonnes »)." }));
        if (hasDynamic(it)) box.appendChild(h("p", { class: "pb-hint", text: "Ce texte contient une donnée dynamique : il se modifie ici (Écrire dans la page est désactivé pour ne pas effacer la donnée)." }));
        break;
      case "list":
        box.appendChild(textField("Points (un par ligne)", (p.items || []).join("\n"), function (v) { setProp(it.id, "items", v.split("\n"), { key: it.id + ":items", light: true }); }, { multiline: true, disabled: disabled }));
        box.appendChild(checkField("Liste numérotée", p.ordered, function (v) { setProp(it.id, "ordered", v); }, { disabled: disabled }));
        break;
      case "quote":
        box.appendChild(textField("Citation", p.text, set("text"), { multiline: true, max: 600, disabled: disabled }));
        box.appendChild(textField("Auteur", p.author, set("author"), { max: 100, disabled: disabled }));
        break;
      case "code":
        box.appendChild(textField("Texte affiché tel quel", p.text, set("text"), { multiline: true, rows: "8", max: 4000, disabled: disabled, hint: "Affiché comme texte, jamais exécuté." }));
        box.appendChild(selectField("Coloration du code", p.language || "text", SPEC.codeLanguages, function (v) { change(function () { var x = byId(it.id); if (v === "text") delete x.props.language; else x.props.language = v; }); }, { disabled: disabled }));
        box.appendChild(checkField("Numéros de ligne", p.lineNumbers, function (v) { setProp(it.id, "lineNumbers", v); }, { disabled: disabled }));
        box.appendChild(checkField("Bouton « Copier »", p.copy, function (v) { setProp(it.id, "copy", v); }, { disabled: disabled }));
        box.appendChild(textField("Lignes surlignées (ex. 2-4, 7)", p.highlight, function (v) {
          // Mêmes règles que le serveur (nodes.js, code) : numéros ou plages « 2-4 », séparés par des virgules. Une saisie illisible est expliquée, jamais perdue en silence.
          var bad = v.trim() && v.split(",").some(function (part) { var m = /^\s*(\d{1,4})(?:\s*-\s*(\d{1,4}))?\s*$/.exec(part); return !m || Number(m[1]) < 1 || (m[2] && (Number(m[2]) < Number(m[1]) || Number(m[2]) - Number(m[1]) >= 200)); });
          if (bad) { toast("Lignes surlignées : écrivez des numéros ou des plages, par exemple 2-4, 7.", true); renderInspector(); return; }
          change(function () { var x = byId(it.id).props; if (v.trim()) x.highlight = v.trim(); else delete x.highlight; }, { key: it.id + ":hl", light: true });
        }, { max: 80, disabled: disabled }));
        break;
      case "image":
        box.appendChild(mediaPreview(/^\{\{/.test(p.src || "") ? "" : p.src, function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); }, disabled));
        box.appendChild(textField("…ou image dynamique", /^\{\{/.test(p.src || "") ? p.src : "", function (v) { if (/^\s*\{\{[^}]+\}\}\s*$/.test(v)) setProp(it.id, "src", v.trim()); else if (v.trim()) toast("Image dynamique : écrivez une étiquette entre doubles accolades, ex. {{post.image}} (ou utilisez le bouton d'étiquettes).", true); else if (/^\{\{/.test(p.src || "")) toast("Pour remplacer l'image dynamique, choisissez une image dans la médiathèque.", true); }, { onChange: true, disabled: disabled, dyn: true, dynKinds: ["image"], placeholder: "{{post.image}} ou {{course.image}}", hint: "Remplace l'image choisie ; lue à chaque affichage (utile dans une boucle ou un modèle)." }));
        box.appendChild(resolutionField(it, [p.src], disabled));
        if (!p.link) box.appendChild(checkField("Agrandir au clic (visionneuse)", p.lightbox, function (v) { setProp(it.id, "lightbox", v); }, { disabled: disabled, hint: "Ouvre l'image d'origine en grand. Indisponible si l'image a un lien." }));
        box.appendChild(textField("Texte de remplacement", p.alt, function (v) { change(function () { var x = byId(it.id); x.props.alt = v; if (v) delete x.props.decorative; else x.props.decorative = true; }, { key: it.id + ":alt", light: true }); }, { max: 200, disabled: disabled, dyn: true, hint: "Décrit l'image pour les personnes qui ne la voient pas (et pour le référencement). Vide = image décorative." }));
        box.appendChild(textField("Lien au clic (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, dyn: true, dynKinds: ["url"], placeholder: "/catalogue ou https://…" }));
        if (p.link) box.appendChild(checkField("Ouvrir le lien dans un nouvel onglet (https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        box.appendChild(textField("Légende", p.caption, set("caption"), { max: 200, disabled: disabled }));
        box.appendChild(textField("Titre (infobulle au survol, facultatif)", p.title, set("title"), { max: 150, disabled: disabled }));
        break;
      case "gallery":
        (p.images || []).forEach(function (im, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" }, h("img", { src: im.src, alt: "", class: "pb-thumb" }),
            textField("Texte de remplacement " + (i + 1), im.alt, function (v) { change(function () { byId(it.id).props.images[i].alt = v; }, { key: it.id + ":img" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Légende " + (i + 1), im.caption, function (v) { change(function () { byId(it.id).props.images[i].caption = v; }, { key: it.id + ":gcap" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Étiquette " + (i + 1) + " (filtre, facultatif)", im.tag, function (v) { change(function () { var x = byId(it.id).props.images[i]; if (v) x.tag = v; else delete x.tag; }, { key: it.id + ":gtag" + i, light: true }); }, { max: 30, disabled: disabled }),
            textField("Lien de l'image " + (i + 1) + " (facultatif)", im.link, function (v) { change(function () { byId(it.id).props.images[i].link = v; }, { key: it.id + ":glink" + i, light: true }); }, { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…" }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.images.length < 2, onclick: function () { change(function () { byId(it.id).props.images.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(resolutionField(it, (p.images || []).map(function (im) { return im.src; }), disabled));
        box.appendChild(checkField("Agrandir au clic (visionneuse)", p.lightbox, function (v) { setProp(it.id, "lightbox", v); }, { disabled: disabled, hint: "Les images qui ont un lien ouvrent leur lien." }));
        var galMode = p.masonry ? "masonry" : p.layout === "justified" ? "justified" : "grid";
        box.appendChild(selectField("Disposition", galMode, [["grid", "Grille"], ["masonry", "Mosaïque (hauteurs naturelles)"], ["justified", "Justifiée (lignes de même hauteur)"]], function (v) {
          change(function () { var x = byId(it.id); delete x.props.masonry; delete x.props.layout; if (v === "masonry") x.props.masonry = true; else if (v === "justified") x.props.layout = "justified"; });
        }, { disabled: disabled }));
        if (galMode !== "justified") box.appendChild(numberField("Colonnes", p.columns || 3, { min: 1, max: 12, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; change(function () { var x = byId(it.id); if (n === 3) delete x.props.columns; else x.props.columns = n; }); }, "De 1 à 12 (2 au plus sur téléphone)."));
        if (galMode === "grid") box.appendChild(selectField("Ratio d'aspect des images", p.ratio || "1:1", [["1:1", "Carré (1:1)"], ["4:3", "4:3"], ["3:2", "3:2"], ["16:9", "16:9"], ["9:16", "Vertical (9:16)"], ["21:9", "Panoramique (21:9)"]], function (v) { change(function () { var x = byId(it.id); if (v === "1:1") delete x.props.ratio; else x.props.ratio = v; }); }, { disabled: disabled }));
        if (galMode === "justified") box.appendChild(selectField("Hauteur des lignes", String(p.rowHeight || "200"), [["120", "120 px"], ["160", "160 px"], ["200", "200 px"], ["260", "260 px"], ["320", "320 px"]], function (v) { change(function () { var x = byId(it.id); if (v === "200") delete x.props.rowHeight; else x.props.rowHeight = v; }); }, { disabled: disabled }));
        box.appendChild(checkField("Légende au survol (sur l'image)", p.overlay, function (v) { setProp(it.id, "overlay", v); }, { disabled: disabled, hint: "Sur écran tactile, la légende reste visible." }));
        box.appendChild(checkField("Barre de filtres (par étiquette d'image)", p.filters, function (v) { setProp(it.id, "filters", v); }, { disabled: disabled, hint: "Donnez une étiquette à chaque image ci-dessus : « Tous » plus une touche par étiquette." }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.images || []).length >= 24, onclick: function () { openMedia({ title: "Ajouter à la galerie", multiple: true, onPick: function (list) { change(function () { var x = byId(it.id); list.forEach(function (m) { x.props.images.push({ src: m.path, alt: m.alt || "" }); }); }); } }); } }, "Ajouter des images"));
        break;
      case "video":
        box.appendChild(textField("Adresse (YouTube, Vimeo ou fichier https://)", p.url, set("url"), { type: "url", disabled: disabled }));
        box.appendChild(libraryButton("Choisir dans la médiathèque", { title: "Choisir une vidéo", type: "video" }, function (m) { change(function () { var x = byId(it.id).props; x.url = m.path; if (!x.title) x.title = m.title || m.name; }); toast("Vidéo choisie dans la médiathèque."); }, disabled));
        box.appendChild(textField("Titre (lu par les lecteurs d'écran)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" },
          numberField("Début (secondes)", p.start || "", { min: 1, max: 86399, step: 1, integer: true, disabled: disabled, empty: true }, function (n) { change(function () { var x = byId(it.id).props; if (n === null || n === "") delete x.start; else x.start = n; }); }),
          numberField("Fin (secondes)", p.end || "", { min: 2, max: 86400, step: 1, integer: true, disabled: disabled, empty: true }, function (n) { change(function () { var x = byId(it.id).props; if (n === null || n === "") delete x.end; else x.end = n; }); })));
        box.appendChild(h("p", { class: "pb-sub", text: "Lecture" }));
        box.appendChild(checkField("Lecture automatique (sans le son, exigé par les navigateurs)", p.autoplay, function (v) { change(function () { var x = byId(it.id).props; if (v) { x.autoplay = true; x.muted = true; } else { delete x.autoplay; if (x.controls === false) delete x.controls; } }); }, { disabled: disabled }));
        box.appendChild(checkField("Son coupé au départ", p.muted || p.autoplay, function (v) { setProp(it.id, "muted", v); }, { disabled: disabled || p.autoplay }));
        box.appendChild(checkField("Lire en boucle", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled }));
        box.appendChild(checkField("Afficher les commandes de lecture", p.controls !== false, function (v) { change(function () { var x = byId(it.id).props; if (v) delete x.controls; else x.controls = false; }); }, { disabled: disabled || !p.autoplay, hint: p.autoplay ? null : "Les commandes restent affichées sans lecture automatique (sinon la vidéo ne pourrait pas démarrer)." }));
        if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(p.url || "")) {
          box.appendChild(h("p", { class: "pb-sub", text: "Image d'attente (avant la lecture)" }));
          box.appendChild(mediaPreview(p.poster, function (m) { setProp(it.id, "poster", m.path); }, disabled));
          if (p.poster) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { delete byId(it.id).props.poster; }); } }, "Retirer l'image d'attente"));
        }
        break;
      case "audio":
        box.appendChild(textField("Adresse https:// du fichier", p.src, set("src"), { type: "url", disabled: disabled }));
        box.appendChild(libraryButton("Choisir dans la médiathèque", { title: "Choisir un fichier audio", type: "audio" }, function (m) { change(function () { var x = byId(it.id).props; x.src = m.path; if (!x.title) x.title = m.title || m.name; }); toast("Fichier audio choisi dans la médiathèque."); }, disabled));
        box.appendChild(textField("Titre", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(checkField("Lire en boucle", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled, hint: "Pas de lecture automatique : les navigateurs la bloquent pour un son." }));
        break;
      case "button":
      case "link":
        box.appendChild(textField("Texte", p.label, set("label"), { max: it.type === "button" ? 80 : 120, disabled: disabled, dyn: true }));
        box.appendChild(textField("Adresse", p.url, set("url"), { list: "pb-links", disabled: disabled, dyn: true, dynKinds: ["url"], placeholder: "/catalogue, /p/… ou https://…", hint: PAGE.funnel ? "/etape-suivante : l'étape suivante du tunnel « " + PAGE.funnel.name + " »." : null }));
        box.appendChild(libraryButton("Lier un fichier de la médiathèque (PDF, document…)", { title: "Choisir un document", type: "documents" }, function (m) { change(function () { byId(it.id).props.url = m.path; }); toast("Lien vers « " + m.name + " »."); }, disabled));
        if (it.type === "button") box.appendChild(selectField("Apparence", p.variant, [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], set("variant", false), { disabled: disabled }));
        if (it.type === "button") box.appendChild(selectField("Taille", p.size || "md", [["sm", "Petite"], ["md", "Normale"], ["lg", "Grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(checkField("Ouvrir dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        if (it.type === "button") {
          box.appendChild(selectField("Nature du lien (moteurs de recherche)", p.rel || "", [["", "Normal"], ["nofollow", "Non recommandé (nofollow)"], ["sponsored", "Sponsorisé / payé"]], function (v) { setProp(it.id, "rel", v); }, { disabled: disabled }));
          box.appendChild(h("p", { class: "pb-sub", text: "Icône du bouton" }));
          if (p.icon) {
            box.appendChild(selectField("Position de l'icône", p.iconPos || "before", [["before", "Avant le texte"], ["after", "Après le texte"]], function (v) { setProp(it.id, "iconPos", v); }, { disabled: disabled }));
            box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id).props; delete x.icon; delete x.iconPos; }); } }, "Retirer l'icône"));
          }
          box.appendChild(iconPicker(p.icon || "", function (v) { setProp(it.id, "icon", v); }, disabled));
        }
        break;
      case "accordion":
        repeatEditor(box, it, "items", [["q", "Question", 200], ["a", "Réponse (gras, liens…)", 2000, true]], { q: "Nouvelle question ?", a: "La réponse." }, 30, disabled);
        box.appendChild(checkField("Première question ouverte à l'affichage", p.openFirst, function (v) { setProp(it.id, "openFirst", v); }, { disabled: disabled }));
        box.appendChild(checkField("Données structurées FAQ (moteurs de recherche)", p.faqSchema, function (v) { setProp(it.id, "faqSchema", v); }, { disabled: disabled }));
        box.appendChild(selectField("Icône des questions", p.icon || "chevron", [["chevron", "Flèche"], ["plus", "Plus / moins"], ["none", "Aucune"]], function (v) { setProp(it.id, "icon", v); }, { disabled: disabled }));
        box.appendChild(checkField("Une seule réponse ouverte à la fois", p.single, function (v) { setProp(it.id, "single", v); }, { disabled: disabled, hint: "Ouvrir une question referme les autres (navigateurs récents ; ailleurs, plusieurs restent possibles)." }));
        break;
      case "tabs":
        repeatEditor(box, it, "items", [["title", "Titre de l'onglet", 60], ["text", "Contenu (gras, liens…)", 2000, true]], { title: "Nouvel onglet", text: "Contenu." }, 20, disabled);
        (p.items || []).forEach(function (tb, i) {
          box.appendChild(selectField("Icône de l'onglet « " + tb.title + " »", tb.icon || "", [["", "Aucune"]].concat(SPEC.icons.map(function (n) { return [n, n]; })), function (v) { change(function () { var x = byId(it.id).props.items[i]; if (v) x.icon = v; else delete x.icon; }); }, { disabled: disabled }));
        });
        box.appendChild(checkField("Onglets à la verticale (à gauche du contenu)", p.vertical, function (v) { setProp(it.id, "vertical", v); }, { disabled: disabled, hint: "Sur mobile, ils repassent à l'horizontale." }));
        break;
      case "badge":
        box.appendChild(textField("Texte", p.text, set("text"), { max: 40, disabled: disabled }));
        box.appendChild(selectField("Couleur", p.tone, [["primary", "Couleur du site"], ["neutral", "Neutre"], ["success", "Succès"], ["warning", "Attention"], ["error", "Alerte"]], function (v) { setProp(it.id, "tone", v); }, { disabled: disabled }));
        break;
      case "timeline":
        repeatEditor(box, it, "items", [["date", "Date ou repère", 40], ["title", "Titre", 120], ["text", "Texte", 600, true]], { date: "", title: "Nouvelle étape", text: "" }, 30, disabled);
        break;
      case "progress":
        box.appendChild(textField("Libellé", p.label, set("label"), { max: 80, disabled: disabled }));
        box.appendChild(numberField("Valeur (0 à 100)", p.value, { min: 0, max: 100, step: 1, integer: true, slider: [0, 100], allowEmpty: false, staticUnit: "%", disabled: disabled }, function (n, opts) { if (n === null) return false; setProp(it.id, "value", n, opts && opts.light ? { key: opts.key || it.id + ":value", light: true } : null); }, "Une donnée réelle (par ex. places réservées) ; ne pas inventer de chiffre."));
        box.appendChild(checkField("Afficher la valeur en %", p.showValue !== false, function (v) { setProp(it.id, "showValue", v); }, { disabled: disabled }));
        box.appendChild(checkField("Remplir la barre à l'apparition (animation)", p.animate, function (v) { setProp(it.id, "animate", v); }, { disabled: disabled }));
        if (p.animate) {
          box.appendChild(optSelect(it, "Durée du remplissage", "duration", p.duration, [["1000", "1 s (défaut)"], ["400", "Rapide (0,4 s)"], ["2000", "2 s"], ["4000", "Lente (4 s)"]], "1000", disabled));
          box.appendChild(optSelect(it, "Courbe", "easing", p.easing, [["smooth", "Douce (défaut)"], ["linear", "Régulière"], ["out", "Rapide puis lente"]], "smooth", disabled));
        }
        break;
      case "menu":
        if (grp) box = grp("Source et liens");
        box.appendChild(textField("Nom du menu (lecteurs d'écran)", p.label, set("label"), { max: 60, disabled: disabled }));
        // Source des liens : le menu AFFECTÉ à un emplacement dans Apparence → Menus (une seule source de vérité, recommandé), un menu précis, ou une liste écrite ici
        var menuSource = p.source === "location" || p.source === "name" ? p.source : "manual";
        box.appendChild(selectField("Source des liens", menuSource, [["location", "Menu du CMS affecté à un emplacement (recommandé)"], ["name", "Un menu précis du CMS"], ["manual", "Liste de liens écrite ici"]], function (v) {
          // Passer à une liste manuelle sans lien la rendrait invalide : un premier lien à modifier est proposé ; vers un emplacement, « en-tête » est choisi par défaut
          change(function () { var pr = byId(it.id).props; pr.source = v; if (v === "location" && !pr.location) pr.location = "header"; if (v === "manual" && !(pr.items || []).length) pr.items = [{ label: "Nouveau lien", url: "/" }]; }, { label: "Menu : source des liens" });
        }, { disabled: disabled }));
        if (menuSource === "location") {
          box.appendChild(selectField("Emplacement", p.location || "header", [["header", "En-tête du site"], ["footer", "Pied de page"], ["mobile", "Menu mobile"]], function (v) { setProp(it.id, "location", v); }, { disabled: disabled }));
          box.appendChild(h("p", { class: "pb-hint", text: "Les liens, leur ordre et les sous-menus viennent du menu affecté à cet emplacement du site (Apparence → Menus) : modifiez-le là, la page publiée suit." }));
        } else if (menuSource === "name") {
          box.appendChild(textField("Nom du menu", p.menuName, set("menuName"), { max: 80, disabled: disabled }));
          box.appendChild(h("p", { class: "pb-hint", text: "Un menu de CE site, publié, retrouvé par son nom (Apparence → Menus)." }));
        } else {
        repeatEditor(box, it, "items", [["label", "Texte du lien", 60], ["url", "Adresse (/page, https://… ou #ancre)", 500]], { label: "Nouveau lien", url: "/" }, 12, disabled);
        // Sous-menus : un niveau, sous chaque lien
        (p.items || []).forEach(function (m, i) {
          var kids = m.children || [];
          var sub = h("details", { class: "pb-acc pb-sub-acc" }, h("summary", {}, h("span", { class: "pb-acc-title", text: "Sous-menu de « " + m.label + " »" }), kids.length ? h("span", { class: "pb-acc-count", text: String(kids.length) }) : null));
          var body = h("div", { class: "pb-acc-body" });
          kids.forEach(function (c, j) {
            body.appendChild(h("div", { class: "pb-repeat-item" },
              textField("Texte", c.label, function (v) { change(function () { byId(it.id).props.items[i].children[j].label = v; }, { key: it.id + ":sub" + i + "l" + j, light: true }); }, { max: 60, disabled: disabled }),
              textField("Adresse", c.url, function (v) { change(function () { byId(it.id).props.items[i].children[j].url = v; }, { key: it.id + ":sub" + i + "u" + j, light: true }); }, { list: "pb-links", disabled: disabled }),
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id).props.items[i]; x.children.splice(j, 1); if (!x.children.length) delete x.children; }); } }, "Retirer")));
          });
          body.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || kids.length >= 10, onclick: function () { change(function () { var x = byId(it.id).props.items[i]; x.children = (x.children || []).concat({ label: "Sous-lien", url: "/" }); }); } }, "Ajouter un sous-lien"));
          sub.appendChild(body);
          box.appendChild(sub);
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () {
          var pagesOnSite = boot.links.filter(function (l) { return /^\/p\//.test(l.url) && !(p.items || []).some(function (m) { return m.url === l.url; }); }).slice(0, 12 - (p.items || []).length);
          if (!pagesOnSite.length) { toast("Aucune autre page publiée à ajouter.", true); return; }
          change(function () { var x = byId(it.id).props; pagesOnSite.forEach(function (l) { x.items.push({ label: l.label.replace(/^Page « |»$/g, "").trim(), url: l.url }); }); });
          toast(pagesOnSite.length + " page(s) publiée(s) ajoutée(s) au menu.");
        } }, "Ajouter les pages publiées"));
        }
        if (grp) box = grp("Apparence du menu");
        box.appendChild(checkField("Liens les uns sous les autres", p.vertical, function (v) { setProp(it.id, "vertical", v); }, { disabled: disabled }));
        box.appendChild(selectField("Pointeur des liens", p.pointer || "", [["", "Aucun (soulignement au survol)"], ["underline", "Trait dessous"], ["overline", "Trait dessus"], ["double", "Double trait"], ["framed", "Cadre"], ["background", "Fond"]], function (v) { change(function () { var x = byId(it.id).props; if (v) { x.pointer = v; } else { delete x.pointer; delete x.pointerAnim; delete x.pointerColor; } }); }, { disabled: disabled }));
        if (p.pointer) {
          box.appendChild(selectField("Animation du pointeur", p.pointerAnim || "fade", [["fade", "Fondu"], ["slide", "Glissement"], ["grow", "Étirement"], ["drop", "Chute"]], function (v) { setProp(it.id, "pointerAnim", v); }, { disabled: disabled }));
          box.appendChild(textField("Couleur du pointeur (#rrggbb, vide = couleur d'accent)", p.pointerColor || "", function (v) { change(function () { var x = byId(it.id).props; if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v).trim())) x.pointerColor = String(v).trim(); else delete x.pointerColor; }); }, { max: 7, disabled: disabled, placeholder: "#1e3a5f" }));
        }
        box.appendChild(selectField("Indicateur de sous-menu", p.indicator || "chevron", [["chevron", "Chevron (par défaut)"], ["angle", "Angle"], ["plus", "Plus / moins"], ["none", "Aucun"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "chevron") delete x.indicator; else x.indicator = v; }); }, { disabled: disabled }));
        box.appendChild(selectField("Animation d'ouverture des sous-menus", p.submenuAnim || "", [["", "Aucune"], ["fade", "Fondu"], ["slide", "Glissement"]], function (v) { change(function () { var x = byId(it.id).props; if (v) x.submenuAnim = v; else delete x.submenuAnim; }); }, { disabled: disabled }));
        if (grp) box = grp("Mouvement du menu");
        menuMotionPanel(box, it, p, disabled);
        if (grp) box = grp("Style d'un lien (individuel)");
        linkStylePanel(box, it, p, disabled);
        if (grp) box = grp("Bouton mobile (hamburger)");
        box.appendChild(checkField("Sur mobile, replier derrière un bouton « Menu »", p.mobileToggle, function (v) { setProp(it.id, "mobileToggle", v); }, { disabled: disabled }));
        if (p.mobileToggle) {
          box.appendChild(numberField("Replier le menu sous cette largeur d'écran (px)", p.menuBreakpoint || 767, { min: 320, max: 1920, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; change(function () { var x = byId(it.id).props; if (n === 767) delete x.menuBreakpoint; else x.menuBreakpoint = n; }); }, "767 par défaut. Montez à 1024 pour que le bouton « Menu » apparaisse aussi sur tablette ; 1920 pour l'avoir partout."));
          box.appendChild(selectField("Ouverture du menu sur mobile", p.mobileMode === "drawer" ? "drawer" : "inline", [["inline", "Déplié sous le bouton"], ["drawer", "Tiroir latéral"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "drawer") { x.mobileMode = "drawer"; } else { delete x.mobileMode; delete x.drawerSide; } }); }, { disabled: disabled }));
          if (p.mobileMode === "drawer") box.appendChild(selectField("Côté du tiroir", p.drawerSide === "left" ? "left" : "right", [["right", "À droite"], ["left", "À gauche"]], function (v) { change(function () { byId(it.id).props.drawerSide = v; }); }, { disabled: disabled }));
        }
        if (isHeaderDoc() && p.source && p.source !== "manual") { if (grp) box = grp("Méga-menu"); megaSection(box, it, p, disabled); }
        break;
      case "carousel":
        box.appendChild(textField("Nom du carrousel (lecteurs d'écran)", p.label, set("label"), { max: 80, disabled: disabled }));
        box.appendChild(resolutionField(it, (p.images || []).map(function (im) { return im.src; }), disabled));
        (p.images || []).forEach(function (im, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" }, h("img", { src: im.src, alt: "", class: "pb-thumb" }),
            textField("Texte de remplacement " + (i + 1), im.alt, function (v) { change(function () { byId(it.id).props.images[i].alt = v; }, { key: it.id + ":img" + i, light: true }); }, { max: 200, disabled: disabled }),
            textField("Légende " + (i + 1), im.caption, function (v) { change(function () { byId(it.id).props.images[i].caption = v; }, { key: it.id + ":cap" + i, light: true }); }, { max: 200, disabled: disabled }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.images.length < 3, onclick: function () { change(function () { byId(it.id).props.images.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(optSelect(it, "Transition entre les images", "effect", p.effect, [["slide", "Défilement (glissé)"], ["fade", "Fondu (une seule image visible)"]], "slide", disabled));
        box.appendChild(optSelect(it, "Images visibles à la fois (bureau ; 1 sur mobile)", "perView", p.perView, [["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"]], "1", disabled));
        box.appendChild(checkField("Points de navigation", p.dots !== false, function (v) { setProp(it.id, "dots", v); }, { disabled: disabled }));
        box.appendChild(checkField("Revenir au début après la dernière image (boucle)", p.loop, function (v) { setProp(it.id, "loop", v); }, { disabled: disabled }));
        box.appendChild(checkField("Défilement automatique", p.autoplay, function (v) { setProp(it.id, "autoplay", v); }, { disabled: disabled, hint: "S'arrête au survol, au clavier ou au toucher ; jamais si la personne réduit les animations." }));
        if (p.autoplay) box.appendChild(selectField("Intervalle", String(p.interval || 5), ["2", "3", "4", "5", "6", "8", "10", "15", "20"].map(function (n) { return [n, n + " secondes"]; }), function (v) { setProp(it.id, "interval", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.images || []).length >= 24, onclick: function () { openMedia({ title: "Ajouter au carrousel", multiple: true, onPick: function (list) { change(function () { var x = byId(it.id); list.forEach(function (m) { x.props.images.push({ src: m.path, alt: m.alt || "" }); }); }); } }); } }, "Ajouter des images"));
        break;
      case "table":
        tableEditor(box, it, disabled);
        box.appendChild(checkField("Dernière ligne en pied de tableau (total)", p.footer, function (v) { setProp(it.id, "footer", v); }, { disabled: disabled }));
        box.appendChild(checkField("Lignes alternées", p.striped, function (v) { setProp(it.id, "striped", v); }, { disabled: disabled }));
        box.appendChild(selectField("Alignement des cellules", p.align || "left", [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], function (v) { setProp(it.id, "align", v); }, { disabled: disabled }));
        break;
      case "divider":
        box.appendChild(selectField("Style du trait", p.lineStyle || "solid", [["solid", "Plein"], ["dashed", "Tirets"], ["dotted", "Points"], ["double", "Double"]], function (v) { setProp(it.id, "lineStyle", v); }, { disabled: disabled }));
        box.appendChild(selectField("Épaisseur", String(p.thickness || 1), ["1", "2", "3", "4", "6", "8", "12"].map(function (n) { return [n, n + " px"]; }), function (v) { setProp(it.id, "thickness", Number(v)); }, { disabled: disabled }));
        var dc = fid();
        box.appendChild(h("div", { class: "pb-field" }, h("label", { for: dc, text: "Couleur du trait" }), colorButton(dc, p.color, undefined, disabled, function (v, o) { if (v) setProp(it.id, "color", v, o && o.light ? { key: it.id + ":color", light: true } : null); else change(function () { delete byId(it.id).props.color; }); }, "divider-color")));
        box.appendChild(textField("Texte au milieu du trait (facultatif)", p.text, set("text"), { max: 60, disabled: disabled, placeholder: "ex. ou" }));
        box.appendChild(selectField("Position du texte", p.align || "center", [["left", "À gauche"], ["center", "Au centre"], ["right", "À droite"]], function (v) { setProp(it.id, "align", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Largeur : onglet Style › Dimensions ; espace autour : Espacement." }));
        break;
      case "imagebox":
      case "iconbox":
        if (it.type === "imagebox") {
          box.appendChild(h("p", { class: "pb-sub", text: "Image" }));
          box.appendChild(mediaPreview(p.src, function (m) { change(function () { var x = byId(it.id).props; x.src = m.path; if (!x.alt && m.alt) x.alt = m.alt; }); }, disabled));
          box.appendChild(resolutionField(it, [p.src], disabled));
          box.appendChild(textField("Texte de remplacement (vide = image décorative)", p.alt, set("alt"), { max: 200, disabled: disabled }));
        } else {
          box.appendChild(iconPicker(p.icon || "star", function (v) { setProp(it.id, "icon", v); }, disabled));
          box.appendChild(selectField("Taille de l'icône", String(p.size || 48), [["24", "24 px"], ["32", "32 px"], ["48", "48 px"], ["64", "64 px"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        }
        box.appendChild(textField("Titre", p.title, set("title"), { max: 120, disabled: disabled }));
        box.appendChild(selectField("Niveau du titre", p.titleLevel || "3", [["2", "Titre 2"], ["3", "Titre 3"], ["4", "Titre 4"], ["5", "Titre 5"], ["6", "Titre 6"]], function (v) { setProp(it.id, "titleLevel", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte", p.text, set("text"), { multiline: true, max: 600, disabled: disabled }));
        box.appendChild(selectField("Position du visuel", p.position || "top", [["top", "En haut"], ["left", "À gauche"], ["right", "À droite"]], function (v) { setProp(it.id, "position", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "À gauche ou à droite : empilé sur mobile." }));
        box.appendChild(textField("Lien (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue, /p/…, #ancre ou https://…" }));
        box.appendChild(checkField("Ouvrir le lien dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        break;
      case "sitelogo":
        if (grp) box = grp("Logo et lien");
        box.appendChild(numberField("Hauteur du logo (px)", p.height || 48, { min: 20, max: 160, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; setProp(it.id, "height", n); }, "De 20 à 160 px. Pour la largeur, le rognage ou l'arrondi : onglet Style, partie « Image »."));
        box.appendChild(checkField("Le logo est un lien", p.link !== false, function (v) { setProp(it.id, "link", v); }, { disabled: disabled }));
        if (p.link !== false) {
          box.appendChild(textField("Adresse du lien (vide = accueil du site)", p.href || "", function (v) { change(function () { var x = byId(it.id).props; if (String(v).trim()) x.href = String(v).trim(); else { delete x.href; delete x.newTab; } }); }, { max: 500, disabled: disabled, placeholder: "/page ou https://…" }));
          if (/^https:\/\//.test(p.href || "")) box.appendChild(checkField("Ouvrir dans un nouvel onglet", p.newTab === true, function (v) { setProp(it.id, "newTab", v ? true : undefined); }, { disabled: disabled }));
        }
        if (grp) box = grp("Au défilement");
        box.appendChild(selectField("Taille du logo une fois la page défilée", p.scrollHeight ? String(p.scrollHeight) : "", [["", "Identique"], ["24", "24 px"], ["32", "32 px"], ["40", "40 px"], ["48", "48 px"], ["64", "64 px"]].concat([24, 32, 40, 48, 64].indexOf(Number(p.scrollHeight)) < 0 && p.scrollHeight ? [[String(p.scrollHeight), p.scrollHeight + " px"]] : []), function (v) { setProp(it.id, "scrollHeight", v ? Number(v) : ""); }, { disabled: disabled }));
        box.appendChild(textField("Texte alternatif au défilement (logo sans image)", p.scrollText || "", set("scrollText"), { max: 40, disabled: disabled, onChange: true, hint: "Ex. des initiales. Remplace le nom du site quand la page défile. Agit dans un en-tête collant ou superposé." }));
        box.appendChild(h("p", { class: "pb-hint", text: "Le logo vient des réglages SEO (Organisation › Logo) ; sans logo, le nom du site s'affiche. Accueil : la page d'accueil du site si elle est en ligne, sinon l'accueil de KOLAKISA." }));
        if (isHeaderDoc()) {
          if (grp) box = grp("Variantes du logo");
          // Variantes de logo (en-tête) : l'état « en haut de page » (ex. logo clair sur fond transparent) et les petits écrans ; elles remplacent le logo principal quand elles s'appliquent
          [["logoTop", "Logo en haut de page", "Affiché tant que la page n'a pas défilé (par exemple un logo clair sur un en-tête transparent). Le logo principal revient après le défilement. Sans effet si l'en-tête est ordinaire."], ["logoMobile", "Logo mobile", "Remplace le logo sur les écrans de 767 px et moins."]].forEach(function (v) {
            box.appendChild(h("p", { class: "pb-sub", text: v[1] }));
            box.appendChild(mediaPreview(p[v[0]], function (m) { change(function () { byId(it.id).props[v[0]] = m.path; }); }, disabled));
            if (p[v[0]]) box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, "data-pb-clear-logo": v[0], onclick: function () { change(function () { delete byId(it.id).props[v[0]]; }); } }, "Retirer"));
            box.appendChild(h("p", { class: "pb-hint", text: v[2] }));
          });
        }
        break;
      case "catfilter":
        box.appendChild(selectField("Catégories de…", p.source, [["posts", "Articles du blog"], ["courses", "Formations du catalogue"]], function (v) { setProp(it.id, "source", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte du premier lien", p.allLabel, set("allLabel"), { max: 40, disabled: disabled }));
        box.appendChild(checkField("Afficher le nombre d'éléments", p.showCount !== false, function (v) { setProp(it.id, "showCount", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Liens « ?categorie=… » vers cette même page. Dans la grille en boucle, cochez « Filtrer avec l'adresse » : elle ne montre alors que la catégorie choisie." }));
        break;
      case "postcontent":
        box.appendChild(h("p", { class: "pb-hint", text: "Affiche le texte de l'article du blog. À placer dans une page choisie comme modèle « Article du blog » (Site Web › Modèles de thème). Dans l'éditeur, le dernier article publié sert d'exemple." }));
        break;
      case "sitetitle":
        box.appendChild(selectField("Balise", p.tag || "p", [["p", "Paragraphe"], ["span", "Texte en ligne"], ["h1", "Titre 1"], ["h2", "Titre 2"], ["h3", "Titre 3"]], function (v) { setProp(it.id, "tag", v); }, { disabled: disabled }));
        box.appendChild(checkField("Lien vers l'accueil du site", p.link !== false, function (v) { setProp(it.id, "link", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte alternatif au défilement", p.scrollText || "", set("scrollText"), { max: 40, disabled: disabled, onChange: true, hint: "Ex. des initiales. Remplace le nom du site quand la page défile. Agit dans un en-tête collant ou superposé." }));
        box.appendChild(h("p", { class: "pb-hint", text: "Le nom du site de cette page (sinon le nom du site des réglages SEO), toujours à jour." }));
        break;
      case "copyright":
        box.appendChild(textField("Titulaire (vide = nom du site)", p.owner, set("owner"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Texte après", p.text, set("text"), { max: 160, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "L'année se met à jour toute seule." }));
        break;
      case "animatedheading":
        box.appendChild(textField("Début (fixe)", p.before, set("before"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Mots qui se succèdent (un par ligne, 2 à 8)", (p.words || []).join("\n"), function (v) { setProp(it.id, "words", v.split("\n").map(function (x) { return x.trim(); }).filter(Boolean)); }, { multiline: true, disabled: disabled }));
        box.appendChild(textField("Fin (fixe)", p.after, set("after"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Niveau", p.level, [["1", "Titre 1 (un seul par page)"], ["2", "Titre 2"], ["3", "Titre 3"], ["4", "Titre 4"]], set("level", false), { disabled: disabled }));
        box.appendChild(selectField("Effet", p.effect || "fade", [["fade", "Fondu"], ["slide", "Glissement"], ["blur", "Flou"], ["zoom", "Zoom"], ["type", "Machine à écrire"]], function (v) { setProp(it.id, "effect", v); }, { disabled: disabled }));
        if (p.effect === "type") box.appendChild(checkField("Curseur clignotant à droite du mot", p.cursor !== false, function (v) { change(function () { var x = byId(it.id).props; if (v) delete x.cursor; else x.cursor = false; }); }, { disabled: disabled }));
        box.appendChild(selectField("Durée par mot", String(p.interval || 2500), [["1500", "1,5 s"], ["2500", "2,5 s"], ["4000", "4 s"], ["6000", "6 s"]], function (v) { setProp(it.id, "interval", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "L'animation se voit dans l'aperçu et sur la page publiée (jamais si le visiteur a demandé moins d'animations). Les lecteurs d'écran lisent la phrase entière." }));
        break;
      case "flipbox":
        box.appendChild(h("p", { class: "pb-sub", text: "Recto" }));
        box.appendChild(iconPicker(p.icon || "", function (v) { setProp(it.id, "icon", v); }, disabled));
        box.appendChild(textField("Titre du recto", p.frontTitle, set("frontTitle"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Texte du recto", p.frontText, set("frontText"), { multiline: true, max: 300, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Verso" }));
        box.appendChild(textField("Titre du verso", p.backTitle, set("backTitle"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Texte du verso", p.backText, set("backText"), { multiline: true, max: 400, disabled: disabled }));
        box.appendChild(textField("Bouton du verso : texte (facultatif)", p.ctaLabel, pairSet("ctaLabel", "ctaUrl", "Le bouton du verso"), { max: 40, disabled: disabled }));
        box.appendChild(textField("Bouton du verso : adresse", p.ctaUrl, pairSet("ctaUrl", "ctaLabel", "Le bouton du verso"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue, /p/… ou https://…" }));
        box.appendChild(selectField("Effet", p.effect || "flip", [["flip", "Retournement"], ["fade", "Fondu"]], function (v) { setProp(it.id, "effect", v); }, { disabled: disabled }));
        if ((p.effect || "flip") === "flip") box.appendChild(optSelect(it, "Sens du retournement", "direction", p.direction, [["horizontal", "Horizontal (défaut)"], ["vertical", "Vertical"]], "horizontal", disabled));
        box.appendChild(optSelect(it, "Vitesse", "duration", p.duration, [["600", "Normale (0,6 s)"], ["300", "Rapide (0,3 s)"], ["1000", "Lente (1 s)"]], "600", disabled));
        box.appendChild(selectField("Hauteur", String(p.height || 280), [["200", "200 px"], ["280", "280 px"], ["360", "360 px"], ["440", "440 px"]].concat([200, 280, 360, 440].indexOf(Number(p.height)) < 0 && p.height ? [[String(p.height), p.height + " px"]] : []), function (v) { setProp(it.id, "height", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Le verso s'affiche au survol, au clavier (Tab puis Entrée) ou d'un toucher sur mobile." }));
        break;
      case "pricelist":
        repeatEditor(box, it, "items", [["title", "Prestation", 80], ["price", "Prix réel", 30], ["text", "Description (facultative)", 200], ["link", "Lien (facultatif)", 500]], { title: "[Prestation]", price: "[Prix]", text: "" }, 30, disabled);
        break;
      case "toc":
        box.appendChild(textField("Titre", p.title, set("title"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Titres repris", p.depth || "3", [["2", "Titres 2"], ["3", "Titres 2 et 3"], ["4", "Titres 2 à 4"]], function (v) { setProp(it.id, "depth", v); }, { disabled: disabled }));
        box.appendChild(checkField("Liste numérotée", p.numbered, function (v) { setProp(it.id, "numbered", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Construite automatiquement à partir des titres de la page : elle se met à jour toute seule." }));
        break;
      case "readingprogress":
        box.appendChild(selectField("Position", p.position || "top", [["top", "En haut de l'écran"], ["bottom", "En bas de l'écran"]], function (v) { setProp(it.id, "position", v); }, { disabled: disabled }));
        box.appendChild(selectField("Forme", p.shape === "circle" ? "circle" : "bar", [["bar", "Barre sur toute la largeur"], ["circle", "Cercle dans un coin (à droite)"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "circle") x.shape = "circle"; else delete x.shape; }); }, { disabled: disabled }));
        box.appendChild(selectField("Épaisseur", String(p.thickness || 4), ["2", "3", "4", "6", "8", "10"].map(function (n) { return [n, n + " px"]; }), function (v) { setProp(it.id, "thickness", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Couleur : onglet Style › Couleurs (couleur du texte). Sur la page publiée, la barre suit la lecture." }));
        break;
      case "signupform":
        var fl = boot.forms || [], cur = fl.find(function (f) { return f.id === p.formId; });
        box.appendChild(selectField("Formulaire", String(p.formId), fl.map(function (f) { return [String(f.id), f.name + (f.status === "published" ? "" : " (non publié)")]; }).concat(cur ? [] : [[String(p.formId), "Formulaire introuvable"]]), function (v) { setProp(it.id, "formId", Number(v)); }, { disabled: disabled }));
        if (cur && cur.status !== "published") box.appendChild(h("p", { class: "pb-note is-warn", text: "Ce formulaire n'est pas publié : il ne s'affiche pas sur la page, et la page ne peut pas être publiée tant qu'il ne l'est pas." }));
        box.appendChild(textField("Titre au-dessus (facultatif)", p.heading, set("heading"), { max: 150, disabled: disabled }));
        box.appendChild(textField("Introduction (facultative)", p.intro, set("intro"), { multiline: true, max: 400, disabled: disabled }));
        box.appendChild(textField("Texte du bouton", p.button, set("button"), { max: 40, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Champs, case de consentement, double confirmation, étiquettes et message de remerciement : réglés dans le formulaire lui-même." }));
        if (cur) box.appendChild(h("a", { class: "btn btn-ghost btn-sm", href: "/marketing/formulaires/" + cur.id, target: "_blank", rel: "noopener" }, "Modifier le formulaire ↗"));
        break;
      case "rating":
        box.appendChild(textField("Libellé (facultatif)", p.title, set("title"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Échelle", String(p.scale || 5), [["5", "Sur 5"], ["10", "Sur 10"]], function (v) { change(function () { var x = byId(it.id).props; x.scale = Number(v); if (x.value > x.scale) x.value = x.scale; }); }, { disabled: disabled }));
        box.appendChild(selectField("Note", String(p.value), (function () { var o = []; for (var v = 0; v <= (p.scale || 5); v += 0.5) o.push([String(v), String(v).replace(".", ",")]); return o; })(), function (v) { setProp(it.id, "value", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Une note réelle (par exemple la moyenne de vrais avis)." }));
        box.appendChild(checkField("Afficher la note en chiffres", p.showValue !== false, function (v) { setProp(it.id, "showValue", v); }, { disabled: disabled }));
        break;
      case "menuanchor":
        box.appendChild(textField("Nom de l'ancre", it.anchor, function (v) { setAnchor(it.id, v); }, { max: 40, onChange: true, disabled: disabled, hint: "Un lien « #" + (it.anchor || "nom") + " » (menu, bouton…) fait défiler la page jusqu'ici. Invisible sur la page publiée." }));
        break;
      case "map":
        box.appendChild(textField("Adresse ou lieu", p.address, set("address"), { max: 200, disabled: disabled, placeholder: "ex. 12 avenue de la Paix, Brazzaville" }));
        box.appendChild(selectField("Zoom", String(p.zoom || 14), [["5", "5 · pays"], ["8", "8 · région"], ["11", "11 · ville"], ["14", "14 · quartier"], ["16", "16 · rue"], ["18", "18 · bâtiment"]].concat([1, 2, 3, 4, 6, 7, 9, 10, 12, 13, 15, 17, 19, 20].indexOf(Number(p.zoom)) >= 0 ? [[String(p.zoom), String(p.zoom)]] : []), function (v) { setProp(it.id, "zoom", Number(v)); }, { disabled: disabled }));
        box.appendChild(selectField("Hauteur", String(p.height || 350), [["250", "250 px"], ["350", "350 px"], ["450", "450 px"], ["600", "600 px"]].concat([250, 350, 450, 600].indexOf(Number(p.height)) < 0 && p.height ? [[String(p.height), p.height + " px"]] : []), function (v) { setProp(it.id, "height", Number(v)); }, { disabled: disabled }));
        box.appendChild(textField("Titre (lu par les lecteurs d'écran)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Carte Google Maps sans clé d'API. Dans l'éditeur, elle est représentée ; elle se charge dans l'aperçu et sur la page publiée." }));
        break;
      case "html":
        box.appendChild(textField("HTML", p.html, set("html"), { multiline: true, rows: "10", max: 20000, disabled: disabled, hint: "Nettoyé à l'enregistrement : scripts, styles, formulaires, cadres et événements (onclick…) sont retirés ; liens https://, /page, #ancre ou mailto: seulement. SVG accepté (formes, dégradés)." }));
        break;
      case "embed":
        box.appendChild(textField("Adresse du contenu", p.url, set("url"), { type: "url", disabled: disabled, hint: "Services acceptés : " + SPEC.embedProviders.join(", ") + "." }));
        box.appendChild(textField("Titre (lu par les lecteurs d'écran)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Dans l'éditeur, le contenu est représenté (il se charge dans l'aperçu et sur la page publiée)." }));
        break;
      case "iconlist":
        box.appendChild(checkField("Éléments côte à côte (en ligne)", p.inline, function (v) { setProp(it.id, "inline", v); }, { disabled: disabled }));
        box.appendChild(checkField("Trait de séparation entre les éléments", p.divider, function (v) { setProp(it.id, "divider", v); }, { disabled: disabled }));
        (p.items || []).forEach(function (x, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" },
            textField("Texte " + (i + 1), x.text, function (v) { change(function () { byId(it.id).props.items[i].text = v; }, { key: it.id + ":il" + i, light: true }); }, { max: 200, disabled: disabled }),
            selectField("Icône", x.icon, SPEC.icons.map(function (n) { return [n, n]; }), function (v) { change(function () { byId(it.id).props.items[i].icon = v; }); }, { disabled: disabled }),
            textField("Lien (facultatif)", x.link, function (v) { change(function () { byId(it.id).props.items[i].link = v; }, { key: it.id + ":ill" + i, light: true }); }, { list: "pb-links", disabled: disabled }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.items.length < 2, onclick: function () { change(function () { byId(it.id).props.items.splice(i, 1); }); } }, "Retirer")));
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.items || []).length >= 30, onclick: function () { change(function () { byId(it.id).props.items.push({ text: "Nouvelle ligne", icon: "check" }); }); } }, "Ajouter une ligne"));
        var icc = fid();
        box.appendChild(h("div", { class: "pb-field" }, h("label", { for: icc, text: "Couleur des icônes" }), colorButton(icc, p.iconColor, undefined, disabled, function (v, o) { if (v) setProp(it.id, "iconColor", v, o && o.light ? { key: it.id + ":icc", light: true } : null); else change(function () { delete byId(it.id).props.iconColor; }); }, "iconlist-color")));
        break;
      case "tooltip":
        box.appendChild(textField("Texte souligné", p.text, set("text"), { max: 120, disabled: disabled }));
        box.appendChild(textField("Explication (au survol ou au clavier)", p.tip, set("tip"), { multiline: true, max: 300, disabled: disabled }));
        box.appendChild(selectField("Position", p.position, [["top", "Au-dessus"], ["bottom", "En dessous"]], function (v) { setProp(it.id, "position", v); }, { disabled: disabled }));
        break;
      case "hotspot":
        box.appendChild(mediaPreview(p.src, function (m) { change(function () { var x = byId(it.id).props; x.src = m.path; if (m.alt) x.alt = m.alt; }); }, disabled));
        box.appendChild(resolutionField(it, [p.src], disabled));
        box.appendChild(checkField("Faire pulser les points (attire le regard)", p.pulse === true, function (v) { change(function () { var x = byId(it.id).props; if (v) x.pulse = true; else delete x.pulse; }); }, { disabled: disabled }));
        box.appendChild(selectField("Ouvrir l'infobulle", p.trigger === "hover" ? "hover" : "click", [["click", "Au clic"], ["hover", "Au survol (et au clic)"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "hover") x.trigger = "hover"; else delete x.trigger; }); }, { disabled: disabled }));
        box.appendChild(textField("Texte de remplacement de l'image", p.alt, set("alt"), { max: 200, disabled: disabled }));
        (p.spots || []).forEach(function (sp, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" },
            textField("Point " + (i + 1) + " : titre", sp.title, function (v) { change(function () { byId(it.id).props.spots[i].title = v; }, { key: it.id + ":spt" + i, light: true }); }, { max: 80, disabled: disabled }),
            textField("Texte", sp.text, function (v) { change(function () { byId(it.id).props.spots[i].text = v; }, { key: it.id + ":spx" + i, light: true }); }, { max: 300, disabled: disabled }),
            h("div", { class: "pb-grid-2" },
              numberField("Position horizontale (%)", sp.x, { min: 0, max: 100, step: 1, precision: 1, staticUnit: "%", allowEmpty: false, disabled: disabled }, function (n, opts) { if (n === null) return false; change(function () { byId(it.id).props.spots[i].x = n; }, opts && opts.light ? { key: opts.key, light: true } : null); }),
              numberField("Position verticale (%)", sp.y, { min: 0, max: 100, step: 1, precision: 1, staticUnit: "%", allowEmpty: false, disabled: disabled }, function (n, opts) { if (n === null) return false; change(function () { byId(it.id).props.spots[i].y = n; }, opts && opts.light ? { key: opts.key, light: true } : null); })),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { byId(it.id).props.spots.splice(i, 1); }); } }, "Retirer ce point")));
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.spots || []).length >= 12, onclick: function () { change(function () { var x = byId(it.id).props; x.spots = (x.spots || []).concat({ x: 50, y: 50, title: "Nouveau point", text: "" }); }); } }, "Ajouter un point"));
        box.appendChild(h("p", { class: "pb-hint", text: "Astuce : 0 % = bord gauche / haut de l'image, 100 % = bord droit / bas." }));
        break;
      case "posts":
        box.appendChild(selectField("Nombre d'articles", String(p.count), ["1", "2", "3", "4", "6", "8", "9", "12"].map(function (n) { return [n, n]; }), function (v) { setProp(it.id, "count", Number(v)); }, { disabled: disabled }));
        box.appendChild(textField("Catégorie (facultative, nom exact)", p.category, set("category"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Présentation", p.layout, [["grid", "Grille de cartes"], ["list", "Liste"]], function (v) { setProp(it.id, "layout", v); }, { disabled: disabled }));
        box.appendChild(checkField("Image de couverture", p.showImage !== false, function (v) { setProp(it.id, "showImage", v); }, { disabled: disabled }));
        box.appendChild(checkField("Date", p.showDate !== false, function (v) { setProp(it.id, "showDate", v); }, { disabled: disabled }));
        box.appendChild(checkField("Extrait", p.showExcerpt !== false, function (v) { setProp(it.id, "showExcerpt", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte s'il n'y a aucun article", p.empty, set("empty"), { max: 160, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Les articles publiés du blog, lus à chaque affichage : un nouvel article apparaît tout seul." }));
        break;
      case "courselist":
        box.appendChild(selectField("Nombre de formations", String(p.count), ["1", "2", "3", "4", "6", "8", "9", "12"].map(function (n) { return [n, n]; }), function (v) { setProp(it.id, "count", Number(v)); }, { disabled: disabled }));
        box.appendChild(textField("Catégorie (facultative, nom exact)", p.category, set("category"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Ordre", p.sort, [["recent", "Les plus récentes"], ["title", "Par titre"], ["price", "Par prix croissant"]], function (v) { setProp(it.id, "sort", v); }, { disabled: disabled }));
        box.appendChild(checkField("Afficher le prix", p.showPrice !== false, function (v) { setProp(it.id, "showPrice", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte du bouton", p.cta, set("cta"), { max: 40, disabled: disabled }));
        box.appendChild(textField("Texte s'il n'y a aucune formation", p.empty, set("empty"), { max: 160, disabled: disabled }));
        break;
      case "search":
        if (grp) box = grp("Recherche");
        box.appendChild(selectField("Rechercher dans", p.target, [["catalogue", "Le catalogue des formations"], ["blog", "Le blog"], ["site", "Le site (articles et pages)"]], function (v) { change(function () { var x = byId(it.id).props; x.target = v; if (v !== "site") delete x.suggest; }); }, { disabled: disabled }));
        box.appendChild(selectField("Affichage", p.skin === "overlay" ? "overlay" : "classic", [["classic", "Champ de recherche dans la page"], ["overlay", "Loupe qui ouvre la recherche en plein écran"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "overlay") x.skin = "overlay"; else delete x.skin; }); }, { disabled: disabled }));
        if (p.target === "site") box.appendChild(checkField("Suggestions pendant la frappe", p.suggest === true, function (v) { change(function () { var x = byId(it.id).props; if (v) x.suggest = true; else delete x.suggest; }); }, { disabled: disabled, hint: "Jusqu'à 6 articles ou pages du site, dès 2 caractères saisis." }));
        if (grp) box = grp("Champ et bouton");
        box.appendChild(textField("Texte d'exemple dans le champ", p.placeholder, set("placeholder"), { max: 80, disabled: disabled }));
        box.appendChild(selectField("Bouton de recherche", p.buttonType || "text", [["text", "Texte (« Rechercher »)"], ["icon", "Loupe seule"], ["inline", "Loupe dans le champ (minimal)"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "text") delete x.buttonType; else x.buttonType = v; }); }, { disabled: disabled }));
        box.appendChild(textField(p.buttonType ? "Nom du bouton (lu par les lecteurs d'écran)" : "Texte du bouton", p.button, set("button"), { max: 30, disabled: disabled }));
        break;
      case "account":
        if (grp) box = grp("Présentation");
        box.appendChild(selectField("Présentation du lien", p.look || "text", [["text", "Texte seul"], ["icon-text", "Icône et texte"], ["icon", "Icône seule"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "text") delete x.look; else x.look = v; }); }, { disabled: disabled }));
        if (grp) box = grp("Textes des liens");
        box.appendChild(textField("Lien pour un visiteur non connecté", p.login, set("login"), { max: 40, disabled: disabled }));
        box.appendChild(textField("Lien pour un visiteur connecté", p.account, set("account"), { max: 40, disabled: disabled }));
        box.appendChild(selectField("Affichage pour un visiteur connecté", p.skin === "menu" ? "menu" : "links", [["links", "Lien « Mon compte »"], ["menu", "Menu déroulant (compte, panier, déconnexion)"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "menu") x.skin = "menu"; else delete x.skin; }); }, { disabled: disabled }));
        box.appendChild(checkField("Lien vers le panier (avec le nombre de formations)", p.showCart !== false, function (v) { setProp(it.id, "showCart", v); }, { disabled: disabled }));
        box.appendChild(textField("Texte du lien panier", p.cart, set("cart"), { max: 30, disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Lu à chaque affichage : la personne connectée voit « " + (p.account || "Mon compte") + " » et son panier. Dans l'éditeur et l'aperçu, la page est montrée comme à un visiteur non connecté." }));
        break;
      case "dyntext":
        box.appendChild(selectField("Donnée affichée", p.source, [["firstName", "Prénom du visiteur (contact connu)"], ["today", "Date du jour"], ["year", "Année en cours"], ["pageTitle", "Titre de la page"], ["courseCount", "Nombre de formations publiées"], ["postCount", "Nombre d'articles publiés"]], function (v) { setProp(it.id, "source", v); }, { disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Avant", p.before, set("before"), { max: 120, disabled: disabled }), textField("Après", p.after, set("after"), { max: 120, disabled: disabled })));
        box.appendChild(textField("Si la donnée est inconnue", p.fallback, set("fallback"), { max: 80, disabled: disabled, hint: "Par exemple : « Bonjour [prénom] » devient « Bonjour à vous » pour un visiteur inconnu." }));
        box.appendChild(selectField("Balise", p.tag, [["p", "Paragraphe"], ["span", "En ligne"], ["h2", "Titre 2"], ["h3", "Titre 3"]], function (v) { setProp(it.id, "tag", v); }, { disabled: disabled }));
        break;
      case "toggle":
        box.appendChild(textField("Titre (cliquable)", p.title, set("title"), { max: 150, disabled: disabled }));
        box.appendChild(textField("Contenu (gras, liens…)", p.text, set("text"), { multiline: true, max: 4000, disabled: disabled }));
        box.appendChild(checkField("Ouvert à l'affichage", p.open, function (v) { setProp(it.id, "open", v); }, { disabled: disabled }));
        break;
      case "alert":
        box.appendChild(selectField("Type", p.tone, [["info", "Information"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur / important"]], function (v) { setProp(it.id, "tone", v); }, { disabled: disabled }));
        box.appendChild(textField("Titre (facultatif)", p.title, set("title"), { max: 120, disabled: disabled }));
        box.appendChild(textField("Message (gras, liens…)", p.text, set("text"), { multiline: true, max: 1000, disabled: disabled }));
        box.appendChild(checkField("Le visiteur peut le fermer", p.dismissible, function (v) { setProp(it.id, "dismissible", v); }, { disabled: disabled }));
        break;
      case "counter":
        box.appendChild(textField("Nombre (réel, vérifiable)", String(p.value), function (v) { var n = Number(String(v).replace(",", ".")); if (!isFinite(n)) { toast("Nombre attendu.", true); return; } setProp(it.id, "value", n, { key: it.id + ":value", light: true }); }, { disabled: disabled, hint: "Ne pas inventer de chiffre : indiquez sa source dans le libellé." }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Avant (ex. +)", p.prefix, set("prefix"), { max: 10, disabled: disabled }), textField("Après (ex. %, élèves)", p.suffix, set("suffix"), { max: 16, disabled: disabled })));
        box.appendChild(textField("Ce que mesure ce nombre (et sa source)", p.label, set("label"), { max: 120, disabled: disabled }));
        box.appendChild(selectField("Décimales", String(p.decimals || 0), [["0", "Aucune"], ["1", "1"], ["2", "2"]], function (v) { setProp(it.id, "decimals", Number(v)); }, { disabled: disabled }));
        box.appendChild(selectField("Séparateur des milliers", p.separator || "space", [["space", "Espace (1 234)"], ["dot", "Point (1.234)"], ["none", "Aucun (1234)"]], function (v) { change(function () { var x = byId(it.id).props; if (v === "space") delete x.separator; else x.separator = v; }); }, { disabled: disabled }));
        box.appendChild(selectField("Animation du comptage", String(p.duration === undefined ? 1500 : p.duration), [["0", "Aucune"], ["800", "Rapide"], ["1500", "Normale"], ["3000", "Lente"]], function (v) { setProp(it.id, "duration", Number(v)); }, { disabled: disabled }));
        box.appendChild(optSelect(it, "Départ après", "delay", p.delay, [["0", "Tout de suite"], ["300", "0,3 s"], ["600", "0,6 s"], ["1000", "1 s"], ["2000", "2 s"]], "0", disabled));
        box.appendChild(optSelect(it, "Courbe du comptage", "easing", p.easing, [["smooth", "Douce (défaut)"], ["linear", "Régulière"], ["out", "Rapide puis lente"]], "smooth", disabled));
        box.appendChild(textField("Valeur de départ (0 par défaut)", String(p.start || 0), function (v) { var n = Number(String(v).replace(",", ".")); if (!isFinite(n)) { toast("Nombre attendu.", true); return; } change(function () { var x = byId(it.id).props; if (n === 0) delete x.start; else x.start = n; }); }, { disabled: disabled }));
        break;
      case "testimonial":
        box.appendChild(textField("Témoignage (réel, avec l'accord de la personne)", p.text, set("text"), { multiline: true, max: 1200, disabled: disabled }));
        box.appendChild(textField("Nom", p.name, set("name"), { max: 80, disabled: disabled }));
        box.appendChild(textField("Fonction ou contexte", p.role, set("role"), { max: 120, disabled: disabled }));
        box.appendChild(selectField("Note", String(p.rating || 0), [["0", "Pas de note"], ["1", "1 / 5"], ["2", "2 / 5"], ["3", "3 / 5"], ["4", "4 / 5"], ["5", "5 / 5"]], function (v) { setProp(it.id, "rating", Number(v)); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Photo (facultative)" }));
        box.appendChild(mediaPreview(p.avatar, function (m) { setProp(it.id, "avatar", m.path); }, disabled));
        if (p.avatar) box.appendChild(selectField("Place de la photo", p.avatarPos || "", [["", "À côté du nom (défaut)"], ["above", "Au-dessus du témoignage"], ["left", "À gauche du témoignage"], ["right", "À droite du témoignage"]], function (v) { change(function () { var x = byId(it.id).props; if (v) x.avatarPos = v; else delete x.avatarPos; }); }, { disabled: disabled }));
        if (p.avatar) box.appendChild(resolutionField(it, [p.avatar], disabled));
        if (p.avatar) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id).props; delete x.avatar; delete x.size; }); } }, "Retirer la photo"));
        break;
      case "pricing":
        box.appendChild(textField("Nom de l'offre", p.title, set("title"), { max: 80, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Prix (réel)", p.price, set("price"), { max: 30, disabled: disabled }), textField("Période (ex. / mois)", p.period, set("period"), { max: 40, disabled: disabled })));
        box.appendChild(textField("Description courte", p.description, set("description"), { max: 300, disabled: disabled }));
        box.appendChild(textField("Ce qui est inclus (un point par ligne)", (p.features || []).join("\n"), function (v) { setProp(it.id, "features", v.split("\n"), { key: it.id + ":features", light: true }); }, { multiline: true, disabled: disabled }));
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Texte du bouton", p.ctaLabel, pairSet("ctaLabel", "ctaUrl", "Le bouton de l'offre"), { max: 60, disabled: disabled }), textField("Adresse du bouton", p.ctaUrl, pairSet("ctaUrl", "ctaLabel", "Le bouton de l'offre"), { list: "pb-links", disabled: disabled })));
        box.appendChild(textField("Badge (ex. Le plus choisi)", p.badge, set("badge"), { max: 40, disabled: disabled }));
        box.appendChild(checkField("Mettre cette offre en avant", p.highlight, function (v) { setProp(it.id, "highlight", v); }, { disabled: disabled }));
        break;
      case "breadcrumb":
        repeatEditor(box, it, "items", [["label", "Texte", 60], ["url", "Adresse", 500]], { label: "Niveau", url: "/" }, 8, disabled, ["url"]);
        box.appendChild(selectField("Séparateur", p.separator || "chevron", [["chevron", "›"], ["slash", "/"], ["dot", "·"]], function (v) { setProp(it.id, "separator", v); }, { disabled: disabled }));
        break;
      case "social":
        box.appendChild(textField("Nom de la liste (lecteurs d'écran)", p.label, set("label"), { max: 60, disabled: disabled }));
        (p.items || []).forEach(function (x, i) {
          box.appendChild(h("div", { class: "pb-repeat-item" },
            selectField("Réseau", x.network, SPEC.socialNetworks, function (v) { change(function () { byId(it.id).props.items[i].network = v; }); }, { disabled: disabled }),
            textField(x.network === "email" ? "Adresse (mailto:vous@exemple.fr)" : "Adresse du profil (https://…)", x.url, function (v) { change(function () { byId(it.id).props.items[i].url = v; }, { key: it.id + ":soc" + i, light: true }); }, { disabled: disabled }),
            h("div", { class: "pb-row" },
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || i === 0, "aria-label": "Monter", onclick: function () { change(function () { var a = byId(it.id).props.items; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); } }, icon("arrowUp")),
              h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || p.items.length < 2, onclick: function () { change(function () { byId(it.id).props.items.splice(i, 1); }); } }, "Retirer"))));
        });
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled || (p.items || []).length >= 12, onclick: function () { change(function () { byId(it.id).props.items.push({ network: "instagram", url: "https://" }); }); } }, "Ajouter un réseau"));
        box.appendChild(selectField("Taille", String(p.size || 32), [["24", "Petite"], ["32", "Moyenne"], ["40", "Grande"], ["48", "Très grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(selectField("Forme", p.shape || "circle", [["circle", "Rond"], ["square", "Carré arrondi"], ["plain", "Icône seule"]], function (v) { setProp(it.id, "shape", v); }, { disabled: disabled }));
        break;
      case "sharebuttons":
        box.appendChild(textField("Nom de la liste (lecteurs d'écran)", p.label, set("label"), { max: 60, disabled: disabled }));
        box.appendChild(textField("Texte proposé au partage (facultatif : sinon le titre de la page)", p.message, set("message"), { max: 120, disabled: disabled }));
        (SPEC.shareNetworks || []).forEach(function (n) {
          box.appendChild(checkField(n[1], (p.networks || []).indexOf(n[0]) >= 0, function (on) {
            var list = (byId(it.id).props.networks || []).slice();
            if (!on && list.length <= 1) { toast("Gardez au moins un réseau de partage.", true); renderInspector(); return; }
            change(function () { var cur = byId(it.id).props.networks || []; byId(it.id).props.networks = on ? (cur.indexOf(n[0]) >= 0 ? cur : cur.concat(n[0])) : cur.filter(function (x) { return x !== n[0]; }); });
          }, { disabled: disabled }));
        });
        box.appendChild(selectField("Taille", String(p.size || 32), [["24", "Petite"], ["32", "Moyenne"], ["40", "Grande"], ["48", "Très grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(selectField("Forme", p.shape || "circle", [["circle", "Rond"], ["square", "Carré arrondi"], ["plain", "Icône seule"]], function (v) { setProp(it.id, "shape", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-hint", text: "Le partage envoie l'adresse publique de la page publiée (https). Sur le site publié seulement : dans l'éditeur, les liens ne sont pas actifs." }));
        break;
      case "modal":
        box.appendChild(textField("Texte du bouton qui ouvre la fenêtre", p.buttonLabel, set("buttonLabel"), { max: 60, disabled: disabled }));
        box.appendChild(selectField("Apparence du bouton", p.variant, [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], function (v) { setProp(it.id, "variant", v); }, { disabled: disabled }));
        box.appendChild(textField("Titre de la fenêtre", p.title, set("title"), { max: 120, disabled: disabled }));
        box.appendChild(textField("Contenu (gras, liens…)", p.text, set("text"), { multiline: true, max: 4000, disabled: disabled }));
        var mfl = boot.forms || [], mcur = mfl.find(function (f) { return f.id === p.formId; });
        box.appendChild(selectField("Formulaire dans la fenêtre (facultatif)", p.formId ? String(p.formId) : "", [["", "Aucun formulaire"]].concat(mfl.map(function (f) { return [String(f.id), f.name + (f.status === "published" ? "" : " (non publié)")]; })).concat(p.formId && !mcur ? [[String(p.formId), "Formulaire introuvable"]] : []), function (v) { change(function () { var x = byId(it.id); if (v) { x.props.formId = Number(v); if (!x.props.formButton) x.props.formButton = "S'inscrire"; } else { delete x.props.formId; delete x.props.formButton; } }, { label: "Formulaire dans la fenêtre" }); }, { disabled: disabled }));
        if (p.formId) {
          if (mcur && mcur.status !== "published") box.appendChild(h("p", { class: "pb-note is-warn", text: "Ce formulaire n'est pas publié : la page ne pourra pas être publiée tant qu'il ne l'est pas." }));
          box.appendChild(textField("Texte du bouton d'envoi", p.formButton || "", set("formButton"), { max: 40, disabled: disabled }));
        }
        box.appendChild(h("div", { class: "pb-grid-2" }, textField("Bouton dans la fenêtre (facultatif)", p.ctaLabel, pairSet("ctaLabel", "ctaUrl", "Le bouton de la fenêtre"), { max: 60, disabled: disabled }), textField("Son adresse", p.ctaUrl, pairSet("ctaUrl", "ctaLabel", "Le bouton de la fenêtre"), { list: "pb-links", disabled: disabled })));
        box.appendChild(selectField("Taille", p.size || "md", [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(selectField("Position", p.position || "center", [["center", "Fenêtre au centre"], ["left", "Panneau glissant depuis la gauche"], ["right", "Panneau glissant depuis la droite"], ["corner", "Carte dans le coin bas droit (ne bloque pas la page)"], ["bar", "Barre en bas de l'écran (ne bloque pas la page)"]], function (v) { setProp(it.id, "position", v); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Apparence de la fenêtre" }));
        box.appendChild(selectField("Animation d'entrée", p.animIn || "none", SPEC.modalAnims, function (v) { change(function () { var x = byId(it.id).props; if (v === "none") delete x.animIn; else x.animIn = v; }); }, { disabled: disabled }));
        box.appendChild(selectField("Animation de sortie", p.animOut || "none", SPEC.modalAnims, function (v) { change(function () { var x = byId(it.id).props; if (v === "none") delete x.animOut; else x.animOut = v; }); }, { disabled: disabled }));
        var ovc = "pb-modal-overlay-" + it.id;
        box.appendChild(h("div", { class: "pb-field" }, h("label", { for: ovc, text: "Couleur de la superposition (vide = par défaut)" }), colorButton(ovc, p.overlayColor, undefined, disabled, function (v, o) { change(function () { var x = byId(it.id).props; if (!v) delete x.overlayColor; else x.overlayColor = v; }); })));
        box.appendChild(numberField("Flou de la superposition (px, 0 = aucun)", p.overlayBlur || 0, { min: 0, max: 20, step: 1, integer: true, disabled: disabled }, function (n) { change(function () { var x = byId(it.id).props; if (!n) delete x.overlayBlur; else x.overlayBlur = n; }); }));
        box.appendChild(checkField("Bloquer le défilement de la page pendant l'ouverture", p.noScroll, function (v) { change(function () { var x = byId(it.id).props; if (v) x.noScroll = true; else delete x.noScroll; }); }, { disabled: disabled }));
        box.appendChild(h("p", { class: "pb-sub", text: "Ouverture automatique" }));
        box.appendChild(selectField("Quand ouvrir la fenêtre", p.auto || "", [["", "Seulement au clic sur le bouton"]].concat(SPEC.modalTriggers), function (v) { change(function () { var x = byId(it.id).props; if (!v) { ["auto", "delay", "scrollAt", "clicks", "target", "minViews", "source", "freq", "autoClose", "lock", "startDate", "endDate", "dismissBtn"].forEach(function (k) { delete x[k]; }); } else { x.auto = v; if (!x.freq) x.freq = "session"; } }); }, { disabled: disabled, hint: "Dans l'éditeur, la fenêtre ne s'ouvre jamais toute seule." }));
        if (p.auto === "load" || p.auto === "idle") box.appendChild(numberField(p.auto === "idle" ? "Inactivité avant ouverture (secondes)" : "Délai avant ouverture (secondes)", p.delay || (p.auto === "idle" ? 20 : 5), { min: 1, max: 600, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; setProp(it.id, "delay", n); }));
        if (p.auto === "scroll") box.appendChild(numberField("Défilement de la page (%)", p.scrollAt || 50, { min: 5, max: 95, step: 5, integer: true, disabled: disabled }, function (n) { if (n === null) return false; setProp(it.id, "scrollAt", n); }));
        if (p.auto === "element") box.appendChild(textField("Nom de l'ancre à atteindre (widget « Ancre de menu »)", p.target || "", function (v) { change(function () { var x = byId(it.id).props; var t = String(v || "").replace(/^#/, ""); if (!t) delete x.target; else x.target = t; }); }, { max: 40, disabled: disabled, onChange: true }));
        if (p.auto === "clicks") box.appendChild(numberField("Nombre de clics sur la page", p.clicks || 3, { min: 1, max: 50, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; setProp(it.id, "clicks", n); }));
        if (p.auto) {
          box.appendChild(numberField("Pages vues minimum pendant la visite (vide = aucune règle)", p.minViews || "", { min: 2, max: 20, step: 1, integer: true, disabled: disabled }, function (n) { change(function () { var x = byId(it.id).props; if (!n) delete x.minViews; else x.minViews = n; }); }));
          box.appendChild(selectField("Provenance du visiteur", p.source || "", [["", "Tous les visiteurs"]].concat(SPEC.modalSources), function (v) { change(function () { var x = byId(it.id).props; if (!v) delete x.source; else x.source = v; }); }, { disabled: disabled }));
          box.appendChild(selectField("Appareil", p.device || "", [["", "Tous les appareils"], ["desktop", "Ordinateur et tablette large"], ["mobile", "Téléphone (écran étroit)"]], function (v) { change(function () { var x = byId(it.id).props; if (!v) delete x.device; else x.device = v; }); }, { disabled: disabled }));
          box.appendChild(selectField("Type de visiteur", p.visitor || "", [["", "Tous les visiteurs"], ["new", "Nouveau visiteur (première visite)"], ["returning", "Visiteur déjà venu"]], function (v) { change(function () { var x = byId(it.id).props; if (!v) delete x.visitor; else x.visitor = v; }); }, { disabled: disabled }));
          box.appendChild(selectField("Fréquence", p.freq || "session", [["session", "Une fois par visite"], ["once", "Une seule fois pour ce visiteur"], ["always", "À chaque affichage de la page"]], function (v) { setProp(it.id, "freq", v); }, { disabled: disabled }));
          box.appendChild(numberField("Fermeture automatique après (secondes, vide = jamais)", p.autoClose || "", { min: 1, max: 600, step: 1, integer: true, disabled: disabled }, function (n) { change(function () { var x = byId(it.id).props; if (!n) delete x.autoClose; else x.autoClose = n; }); }));
          box.appendChild(h("div", { class: "pb-grid-2" }, textField("Afficher à partir du", p.startDate || "", function (v) { change(function () { var x = byId(it.id).props; if (!v) delete x.startDate; else x.startDate = v; }); }, { type: "date", disabled: disabled, onChange: true }), textField("… jusqu'au (inclus)", p.endDate || "", function (v) { change(function () { var x = byId(it.id).props; if (!v) delete x.endDate; else x.endDate = v; }); }, { type: "date", disabled: disabled, onChange: true })));
          box.appendChild(checkField("Proposer le bouton « Ne plus afficher »", p.dismissBtn, function (v) { change(function () { var x = byId(it.id).props; if (v) x.dismissBtn = true; else delete x.dismissBtn; }); }, { disabled: disabled, hint: "Le visiteur peut refuser définitivement cette fenêtre." }));
          box.appendChild(checkField("Empêcher la fermeture par Échap ou clic à côté", p.lock, function (v) { setProp(it.id, "lock", v); }, { disabled: disabled, hint: "Le bouton « × » reste disponible." }));
        }
        box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { var d = frame.contentDocument && frame.contentDocument.getElementById("kw-m-" + it.id); if (d && d.showModal) { d.showModal(); var c = d.querySelector("[data-kw-modal-close]"); if (c) c.onclick = function () { d.close(); }; d.onclick = function (e) { if (e.target === d) d.close(); }; } } }, "Ouvrir la fenêtre dans le canevas"));
        break;
      case "countdown":
        var d = p.until ? new Date(p.until) : new Date(Date.now() + 7 * 86400000);
        var pad = function (n) { return ("0" + n).slice(-2); };
        var val = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
        box.appendChild(textField("Fin (heure de votre ordinateur)", val, function (v) { var x = new Date(v); if (!isNaN(x)) setProp(it.id, "until", x.toISOString().replace(/\.\d{3}Z$/, "Z")); }, { type: "datetime-local", disabled: disabled, onChange: true }));
        box.appendChild(selectField("Mode", p.mode === "evergreen" ? "evergreen" : "fixed", [["fixed", "Date fixe (la même pour tous)"], ["evergreen", "Minuteur par visiteur (démarre à sa première visite)"]], function (v) { change(function () { var x = byId(it.id); if (v === "evergreen") { x.props.mode = "evergreen"; x.props.minutes = x.props.minutes || 60; } else { delete x.props.mode; delete x.props.minutes; } }); }, { disabled: disabled }));
        if (p.mode === "evergreen") box.appendChild(numberField("Durée par visiteur (minutes)", p.minutes || 60, { min: 1, max: 14400, step: 1, integer: true, disabled: disabled }, function (n) { if (n === null) return false; setProp(it.id, "minutes", n); }, "La date ci-dessus sert seulement de repli sans JavaScript."));
        box.appendChild(selectField("À la fin", p.expire || "message", [["message", "Afficher le texte"], ["hide", "Masquer le compte à rebours"], ["redirect", "Rediriger vers une page"]], function (v) { change(function () { var x = byId(it.id); if (v === "message") { delete x.props.expire; delete x.props.redirectUrl; } else x.props.expire = v; if (v === "redirect" && !x.props.redirectUrl) x.props.redirectUrl = "/"; if (v !== "redirect") delete x.props.redirectUrl; }); }, { disabled: disabled }));
        if (p.expire === "redirect") box.appendChild(textField("Adresse de redirection", p.redirectUrl, set("redirectUrl"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…" }));
        else if (p.expire !== "hide") box.appendChild(textField("Texte affiché à la fin", p.endText, set("endText"), { max: 120, disabled: disabled }));
        [["days", "Jours"], ["hours", "Heures"], ["minutes", "Minutes"], ["seconds", "Secondes"]].forEach(function (u) {
          box.appendChild(checkField("Afficher : " + u[1], (p.hideUnits || []).indexOf(u[0]) < 0, function (v) { change(function () { var x = byId(it.id); var l = (x.props.hideUnits || []).filter(function (z) { return z !== u[0]; }); if (!v) l.push(u[0]); if (l.length && l.length < 4) x.props.hideUnits = l; else delete x.props.hideUnits; }); }, { disabled: disabled || ((p.hideUnits || []).length >= 3 && (p.hideUnits || []).indexOf(u[0]) < 0) }));
        });
        break;
      case "course":
        box.appendChild(selectField("Formation", p.courseId, boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { setProp(it.id, "courseId", Number(v)); }, { disabled: disabled }));
        box.appendChild(textField("Texte du bouton", p.cta, set("cta"), { max: 60, disabled: disabled }));
        break;
      case "courserating":
        box.appendChild(selectField("Formation", p.courseId, boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { setProp(it.id, "courseId", Number(v)); }, { disabled: disabled }));
        box.appendChild(checkField("Afficher le nombre d'avis", p.showCount !== false, function (v) { setProp(it.id, "showCount", v); }, { disabled: disabled, hint: "La note et le nombre d'avis sont ceux des avis réellement publiés sur la formation." }));
        box.appendChild(textField("Texte quand il n'y a pas encore d'avis", p.empty, set("empty"), { max: 80, disabled: disabled }));
        break;
      case "addtocart":
        box.appendChild(selectField("Formation", p.courseId, boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { setProp(it.id, "courseId", Number(v)); }, { disabled: disabled }));
        box.appendChild(selectField("Action", p.mode || "cart", [["cart", "Ajouter au panier"], ["buy", "Acheter maintenant (va à la commande)"]], function (v) { change(function () { var x = byId(it.id).props; x.mode = v; if (x.label === "Ajouter au panier" || x.label === "Acheter maintenant") x.label = v === "buy" ? "Acheter maintenant" : "Ajouter au panier"; }); }, { disabled: disabled }));
        box.appendChild(textField("Texte du bouton", p.label, set("label"), { max: 60, disabled: disabled }));
        box.appendChild(selectField("Apparence", p.variant || "primary", [["primary", "Plein"], ["outline", "Contour"], ["ghost", "Discret"]], function (v) { setProp(it.id, "variant", v); }, { disabled: disabled }));
        box.appendChild(selectField("Taille", p.size || "md", [["sm", "Petit"], ["md", "Normal"], ["lg", "Grand"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(checkField("Afficher le prix à côté du bouton", p.showPrice === true, function (v) { setProp(it.id, "showPrice", v); }, { disabled: disabled, hint: "Le prix vient du catalogue (« Gratuit » si la formation est gratuite). Le visiteur doit être connecté pour ajouter au panier." }));
        break;
      case "icon":
        box.appendChild(iconPicker(p.name, function (v) { setProp(it.id, "name", v); }, disabled));
        box.appendChild(textField("Lien au clic (facultatif)", p.link, set("link"), { list: "pb-links", disabled: disabled, placeholder: "/catalogue ou https://…", hint: "Une icône cliquable a besoin d'une description (ci-dessous)." }));
        if (p.link) box.appendChild(checkField("Nouvel onglet (https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: disabled }));
        box.appendChild(selectField("Taille", p.size, [["16", "16 px"], ["24", "24 px"], ["32", "32 px"], ["48", "48 px"], ["64", "64 px"], ["96", "96 px"], ["128", "128 px"]], function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        box.appendChild(textField("Description (si l'icône porte une information)", p.label, set("label"), { max: 80, disabled: disabled }));
        break;
      case "spacer":
        box.appendChild(selectField("Hauteur", p.size, ["8", "16", "24", "32", "48", "64", "80", "96", "128"].map(function (v) { return [v, v + " px"]; }), function (v) { setProp(it.id, "size", v); }, { disabled: disabled }));
        break;
      default:
        box.appendChild(h("p", { class: "pb-hint", text: kidsOf(it) ? "Conteneur : " + kidsOf(it).length + " élément(s). Sa mise en page (direction, écarts, colonnes, alignement) se règle dans l'onglet Style." : "Aucun contenu à régler : voir l'onglet Style." }));
    }
  }
  // Choix d'une icône : grille de la bibliothèque du site, avec recherche (les noms sont en anglais)
  function iconPicker(current, onPick, disabled) {
    var q = h("input", { type: "search", class: "pb-icon-search", placeholder: "Rechercher une icône (star, mail, clock…)", "aria-label": "Rechercher une icône", disabled: disabled, autocomplete: "off" });
    var grid = h("div", { class: "pb-icon-grid", role: "listbox", "aria-label": "Icônes" });
    var draw = function () {
      var f = q.value.trim().toLowerCase();
      grid.textContent = "";
      SPEC.icons.filter(function (n) { return !f || n.toLowerCase().indexOf(f) >= 0; }).forEach(function (n) {
        grid.appendChild(h("button", { type: "button", role: "option", class: "pb-icon-opt", "aria-selected": String(n === current), "aria-label": n, "data-tip": n, "data-icon": n, disabled: disabled, onclick: function () { onPick(n); } }, icon(n)));
      });
      if (!grid.children.length) grid.appendChild(h("p", { class: "pb-hint", text: "Aucune icône ne correspond." }));
    };
    q.addEventListener("input", draw);
    draw();
    return h("div", { class: "pb-field" }, h("label", { text: "Icône : " + current }), q, grid);
  }
  // noLast : clés de champs sans effet sur le DERNIER rang (le serveur les ignore) ; l'éditeur l'explique au lieu de proposer un champ muet
  function repeatEditor(box, it, key, fields, blank, max, disabled, noLast) {
    var list = it.props[key] || [];
    list.forEach(function (row, i) {
      var w = h("div", { class: "pb-repeat-item" }, h("div", { class: "pb-row" }, h("strong", { text: "N° " + (i + 1) }),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || i === 0, "aria-label": "Monter le n° " + (i + 1), onclick: function () { change(function () { var a = byId(it.id).props[key]; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); } }, icon("arrowUp")),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || list.length < 2, onclick: function () { change(function () { byId(it.id).props[key].splice(i, 1); }); } }, "Retirer")));
      fields.forEach(function (fd) { if (noLast && noLast.indexOf(fd[0]) >= 0 && i === list.length - 1) { w.appendChild(h("p", { class: "pb-hint", text: "Dernier niveau : c'est la page actuelle, il n'a pas d'adresse." })); return; } w.appendChild(textField(fd[1], row[fd[0]], function (v) { change(function () { byId(it.id).props[key][i][fd[0]] = v; }, { key: it.id + ":" + key + i + fd[0], light: true }); }, { max: fd[2], multiline: fd[3], disabled: disabled })); });
      box.appendChild(w);
    });
    if (list.length < max) box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(it.id); x.props[key] = (x.props[key] || []).concat(clone(blank)); }); } }, "Ajouter"));
  }
  function tableEditor(box, it, disabled) {
    var rows = it.props.rows || [];
    var cols = rows.length ? rows[0].length : 1;
    var tbl = h("table", { class: "pb-table-edit" });
    rows.forEach(function (r, i) {
      tbl.appendChild(h("tr", {}, r.map(function (c, j) {
        var inp = h("input", { type: "text", value: c, maxlength: "200", disabled: disabled, "aria-label": "Ligne " + (i + 1) + ", colonne " + (j + 1) });
        inp.addEventListener("input", function () { change(function () { byId(it.id).props.rows[i][j] = inp.value; }, { key: it.id + ":cell" + i + "-" + j, light: true }); });
        return h("td", {}, inp);
      })));
    });
    box.appendChild(h("div", { class: "pb-table-wrap" }, tbl));
    var b = function (label, fn, off) { return h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || off, onclick: function () { change(fn); } }, label); };
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      b("+ Ligne", function () { byId(it.id).props.rows.push(Array(cols).fill("")); }, rows.length >= 40),
      b("− Ligne", function () { byId(it.id).props.rows.pop(); }, rows.length < 2),
      b("+ Colonne", function () { byId(it.id).props.rows.forEach(function (r) { r.push(""); }); }, cols >= 8),
      b("− Colonne", function () { byId(it.id).props.rows.forEach(function (r) { r.pop(); }); }, cols < 2)));
    box.appendChild(checkField("Première ligne = en-têtes", it.props.header !== false, function (v) { setProp(it.id, "header", v); }, { disabled: disabled }));
    box.appendChild(textField("Légende (facultative)", it.props.caption, function (v) { setProp(it.id, "caption", v, { key: it.id + ":caption", light: true }); }, { max: 150, disabled: disabled }));
  }
  function mediaPreview(src, onPick, disabled) {
    return h("div", { class: "pb-media-pick" }, src ? h("img", { src: src, alt: "", class: "pb-thumb" }) : h("span", { class: "pb-hint", text: "Aucune image" }),
      h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { openMedia({ title: "Choisir l'image", onPick: onPick }); } }, src ? "Remplacer" : "Choisir"));
  }

  // Résolution d'une image (service commun : tailles réellement disponibles pour les images de la médiathèque).
  // `srcs` : adresses des images du widget (une seule pour Image, plusieurs pour Galerie / Carrousel). Les tailles proposées
  // sont fournies par le serveur (plus petites que la plus petite image) ; la valeur « full » = original (rien n'est enregistré).
  var resCache = {};
  function resolutionField(it, srcs, disabled, io) {
    var wrap = h("div", { class: "pb-res", "data-pb-resolution": "" });
    var list = (srcs || []).filter(function (s) { return s && !/^\{\{/.test(s); });
    var key = list.join("|");
    function paint(info) {
      wrap.textContent = "";
      var cur = io ? io.get() : ((it.props && it.props.size) || "full");
      var sizes = (info && info.sizes) || [];
      var opts = [["full", "Taille originale" + (info && info.width && list.length === 1 ? " (" + info.width + " × " + info.height + " px)" : "")]];
      sizes.forEach(function (z) { opts.push([z.key, z.label + " (" + z.width + (z.height ? " × " + z.height : "") + " px" + (z.crop ? ", recadrée" : "") + ")"]); });
      if (sizes.length && !(io && io.noAuto)) opts.push(["auto", "Adaptative (selon l'écran)"]);
      if (!opts.some(function (o) { return o[0] === cur; })) opts.push([cur, "Indisponible pour cette image (original affiché)"]);
      var hint = !info ? "Chargement des tailles…" : !info.available ? "Les versions réduites ne sont pas disponibles sur ce serveur : l'image d'origine est affichée." : !info.complete ? "Disponible pour les images de la médiathèque." : !sizes.length ? "Cette image est déjà petite : seule la taille originale est proposée." : "Une version plus légère charge plus vite. L'image d'origine n'est pas modifiée.";
      wrap.appendChild(selectField("Résolution de l'image", cur, opts, function (v) { if (io) { io.set(v); return; } change(function () { var x = byId(it.id); if (v === "full") delete x.props.size; else x.props.size = v; }); }, { disabled: disabled || !info || !sizes.length, hint: hint }));
    }
    if (!list.length) { paint({ available: true, complete: false, sizes: [] }); return wrap; }
    if (resCache[key]) { paint(resCache[key]); return wrap; }
    paint(null);
    api("GET", "/marketing/site-web/medias/resolutions.json?" + list.map(function (s) { return "src=" + encodeURIComponent(s); }).join("&")).then(function (info) { resCache[key] = info; if (wrap.isConnected) paint(info); }, function () { if (wrap.isConnected) paint({ available: false, complete: false, sizes: [] }); });
    return wrap;
  }

  // Sections prêtes (bandeau, formulaire…) : champs de contenu
  var F = {
    hero: [["title", "text", "Titre", 150], ["subtitle", "textarea", "Sous-titre", 300], ["image", "image", "Image"], ["imageAlt", "text", "Description de l'image", 200], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "link", "Adresse du bouton"]],
    text: [["markdown", "markdown", "Texte"]],
    image: [["src", "image", "Image"], ["alt", "text", "Description de l'image (obligatoire)", 200], ["caption", "text", "Légende", 200], ["link", "link", "Lien au clic (facultatif)"]],
    list: [["title", "text", "Titre", 150], ["items", "lines", "Points (un par ligne)"]],
    course: [["courseId", "course", "Formation"], ["cta", "text", "Texte du bouton", 60]],
    button: [["label", "text", "Texte", 60], ["url", "link", "Adresse"], ["align", "select", "Position", [["center", "Centré"], ["left", "À gauche"]]]],
    quote: [["text", "textarea", "Citation", 600], ["author", "text", "Auteur", 120]],
    form: [["heading", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400]],
    features: [["title", "text", "Titre", 150], ["intro", "textarea", "Introduction", 400], ["columns", "select", "Colonnes sur ordinateur", [[2, "2"], [3, "3"], [4, "4"]]], ["items", "repeat", "Cartes", { max: 12, blank: { title: "Nouvelle carte", text: "" }, fields: [["title", "Titre", 80], ["text", "Texte", 400, true]] }]],
    faq: [["title", "text", "Titre", 150], ["items", "repeat", "Questions", { max: 20, blank: { q: "Nouvelle question ?", a: "La réponse." }, fields: [["q", "Question", 200], ["a", "Réponse (gras, liens…)", 2000, true]] }]],
    cta: [["title", "text", "Titre", 150], ["text", "textarea", "Texte", 400], ["buttonLabel", "text", "Texte du bouton", 60], ["buttonUrl", "link", "Adresse du bouton"]],
    video: [["url", "text", "Adresse (YouTube, Vimeo ou fichier https://)"], ["title", "text", "Titre (lu par les lecteurs d'écran)", 150], ["caption", "text", "Légende", 200]],
    testimonials: [["title", "text", "Titre", 150], ["items", "repeat", "Témoignages", { max: 12, blank: { text: "Nouveau témoignage.", author: "", role: "" }, fields: [["text", "Témoignage", 600, true], ["author", "Auteur", 120], ["role", "Fonction", 120]] }]],
    divider: [["line", "checkbox", "Afficher une ligne"], ["size", "select", "Hauteur", [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]]]],
  };
  function legacyContentFields(s, box, disabled) {
    if (s.type === "form") {
      box.appendChild(h("p", { class: "pb-note" + (PAGE.formId && PAGE.formPublished ? "" : " is-warn"), text: PAGE.formId ? "Formulaire « " + PAGE.formName + " »" + (PAGE.formPublished ? "" : " (pas encore publié : la page ne pourra pas être publiée)") + "." : "Aucun formulaire choisi : la page ne peut pas être publiée." }));
      box.appendChild(h("div", { class: "pb-row pb-wrap" },
        PAGE.formId ? h("a", { class: "btn btn-outline btn-sm", href: "/marketing/formulaires/" + PAGE.formId, target: "_blank", rel: "noopener" }, "Champs, consentement, liste, messages") : null,
        h("a", { class: "btn btn-ghost btn-sm", href: "/marketing/pages/" + PAGE.id }, PAGE.formId ? "Choisir un autre formulaire" : "Choisir le formulaire")));
    }
    (F[s.type] || []).forEach(function (fd) {
      var key = fd[0], kind = fd[1], label = fd[2], extra = fd[3];
      var set = function (v, light) { setProp(s.id, key, v, { key: s.id + ":" + key, light: light !== false }); };
      if (kind === "repeat") {
        var list = s[key] || [];
        box.appendChild(h("p", { class: "pb-sub", text: label }));
        list.forEach(function (row, i) {
          var w = h("div", { class: "pb-repeat-item" }, h("div", { class: "pb-row" }, h("strong", { text: "N° " + (i + 1) }),
            h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled || list.length < 2, onclick: function () { change(function () { byId(s.id)[key].splice(i, 1); }); } }, "Retirer")));
          extra.fields.forEach(function (f) { w.appendChild(textField(f[1], row[f[0]], function (v) { change(function () { byId(s.id)[key][i][f[0]] = v; }, { key: s.id + key + i + f[0], light: true }); }, { max: f[2], multiline: f[3], disabled: disabled })); });
          box.appendChild(w);
        });
        if (list.length < extra.max) box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { change(function () { var x = byId(s.id); x[key] = (x[key] || []).concat(clone(extra.blank)); }); } }, "Ajouter"));
        return;
      }
      if (kind === "checkbox") { box.appendChild(checkField(label, s[key] !== false, function (v) { set(v, false); }, { disabled: disabled })); return; }
      if (kind === "select") { box.appendChild(selectField(label, s[key], extra, function (v) { set(typeof extra[0][0] === "number" ? Number(v) : v, false); }, { disabled: disabled })); return; }
      if (kind === "course") { box.appendChild(selectField(label, s[key], boot.courses.map(function (c) { return [c.id, c.title]; }), function (v) { set(Number(v), false); }, { disabled: disabled })); return; }
      if (kind === "image") {
        box.appendChild(h("p", { class: "pb-sub", text: label }));
        box.appendChild(mediaPreview(s[key], function (m) { change(function () { var x = byId(s.id); x[key] = m.path; if (key === "src" && !x.alt && m.alt) x.alt = m.alt; if (key === "image" && !x.imageAlt && m.alt) x.imageAlt = m.alt; }); }, disabled));
        if (s[key] && key === "image") box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: disabled, onclick: function () { set("", false); } }, "Retirer l'image"));
        return;
      }
      if (kind === "lines") { box.appendChild(textField(label, (s[key] || []).join("\n"), function (v) { set(v.split("\n")); }, { multiline: true, disabled: disabled })); return; }
      box.appendChild(textField(label, s[key], set, { multiline: kind === "textarea" || kind === "markdown", rows: kind === "markdown" ? "10" : "4", max: typeof extra === "number" ? extra : null, list: kind === "link" ? "pb-links" : null, disabled: disabled, hint: kind === "markdown" ? "**gras**, *italique*, ## intertitre, listes avec « - », [lien](https://…)." : null }));
    });
  }

  // ---------- Contrôles de style ----------
  // ---------- Inspecteur : un schéma par type d'élément (registre extensible) ----------
  // groups : groupes de l'onglet Style et leurs propriétés (null = toutes celles du groupe ; true = contrôle composé) ;
  // states : styles de survol / focus / clic proposés. Un nouveau type d'élément ajoute ici son schéma.
  var BOX_LAYOUT = ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "alignContent", "gap", "rowGap", "columnGap"];
  var SIZE_W = ["width", "minWidth", "maxWidth"];
  var BOX = { layout: BOX_LAYOUT, size: null, spacing: true, typography: null, color: null, background: true, border: null, effects: null }; // la typographie d'un conteneur est héritée par ses enfants
  var TEXTUAL = { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: ["boxShadow", "opacity", "transitionDuration", "transitionEasing", "backdropBlur", "visibility", "cursor", "mixBlendMode"] };
  // Ordre des groupes selon la nature de l'élément (le premier est ouvert par défaut)
  var TEXT_ORDER = ["typography", "spacing", "size", "layout", "background", "border", "effects"];
  var INSPECTORS = {
    section: { kind: "Section", groups: BOX },
    container: { kind: "Conteneur", groups: BOX, tabs: "box", states: ["hover", "active"] },
    columns: { kind: "Colonnes", groups: BOX, tabs: "box", states: ["hover", "active"] },
    column: { kind: "Colonne", groups: BOX, tabs: "box", states: ["hover", "active"] },
    stack: { kind: "Pile", groups: BOX, tabs: "box", states: ["hover", "active"] },
    group: { kind: "Groupe", groups: BOX, tabs: "box", states: ["hover", "active"] },
    grid: { kind: "Grille", groups: { layout: ["columns", "gridTemplate", "gridRows", "gridRowsTemplate", "gridAutoFlow", "gridAutoRows", "gridAutoColumns", "gap", "rowGap", "columnGap", "justifyItems", "alignItems", "alignContent", "justifyContent"], size: null, spacing: true, color: null, background: true, border: null, effects: null }, tabs: "box", states: ["hover", "active"] },
    heading: { kind: "Titre", groups: TEXTUAL, order: TEXT_ORDER },
    text: { kind: "Texte", groups: TEXTUAL, order: TEXT_ORDER },
    list: { kind: "Liste", groups: TEXTUAL, order: TEXT_ORDER },
    quote: { kind: "Citation", groups: TEXTUAL, order: TEXT_ORDER },
    code: { kind: "Code", groups: TEXTUAL, order: TEXT_ORDER },
    table: { kind: "Tableau", groups: TEXTUAL, order: TEXT_ORDER },
    tabs: { kind: "Onglets", groups: TEXTUAL, order: TEXT_ORDER },
    accordion: { kind: "Accordéon / FAQ", groups: TEXTUAL, order: TEXT_ORDER },
    countdown: { kind: "Compte à rebours", groups: TEXTUAL, order: TEXT_ORDER },
    badge: { kind: "Badge", groups: { layout: ["alignSelf"], typography: ["fontSize", "fontWeight", "textTransform", "letterSpacing"], spacing: true, border: null }, order: ["typography", "border", "spacing", "layout"] },
    timeline: { kind: "Chronologie", groups: TEXTUAL, order: TEXT_ORDER },
    progress: { kind: "Barre de progression", groups: { layout: ["alignSelf"], typography: ["fontSize", "fontWeight"], color: ["color"], size: SIZE_W, spacing: true }, order: ["size", "typography", "spacing", "layout"] },
    menu: { kind: "Menu", groups: TEXTUAL, order: TEXT_ORDER, states: true },
    toggle: { kind: "Bascule", groups: TEXTUAL, order: TEXT_ORDER },
    html: { kind: "HTML (sécurisé)", groups: TEXTUAL, order: TEXT_ORDER },
    embed: { kind: "Contenu intégré", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    iconlist: { kind: "Liste d'icônes", groups: TEXTUAL, order: TEXT_ORDER },
    tooltip: { kind: "Infobulle", groups: { layout: ["alignSelf"], typography: null, color: null, spacing: true }, order: TEXT_ORDER },
    hotspot: { kind: "Image à points", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    posts: { kind: "Derniers articles", groups: TEXTUAL, order: TEXT_ORDER },
    courselist: { kind: "Formations du catalogue", groups: TEXTUAL, order: TEXT_ORDER },
    search: { kind: "Recherche", groups: { layout: ["alignSelf"], typography: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "textTransform"], color: ["color"], size: SIZE_W, spacing: true }, order: ["typography", "size", "spacing", "layout"] },
    account: { kind: "Compte du visiteur", groups: TEXTUAL, order: TEXT_ORDER, states: true },
    dyntext: { kind: "Texte dynamique", groups: TEXTUAL, order: TEXT_ORDER },
    alert: { kind: "Alerte", groups: TEXTUAL, order: TEXT_ORDER },
    counter: { kind: "Compteur", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, effects: ["opacity", "transitionDuration", "transitionEasing"] }, order: ["typography", "spacing", "size", "layout", "effects"] },
    testimonial: { kind: "Témoignage", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: null }, order: ["typography", "background", "border", "effects", "spacing", "size", "layout"], states: true },
    pricing: { kind: "Offre tarifaire", groups: { layout: ["alignSelf"], typography: null, color: null, size: SIZE_W, spacing: true, background: true, border: null, effects: null }, order: ["background", "border", "effects", "typography", "spacing", "size", "layout"], states: true },
    breadcrumb: { kind: "Fil d'Ariane", groups: TEXTUAL, order: TEXT_ORDER },
    sharebuttons: { kind: "Boutons de partage", groups: { layout: ["alignSelf"], color: ["color"], spacing: true, effects: ["opacity"] }, order: ["color", "spacing", "layout", "effects"] },
    social: { kind: "Réseaux sociaux", groups: { layout: ["alignSelf"], typography: ["fontFamily", "fontSize", "fontWeight"], color: ["color"], spacing: true, effects: ["opacity"] }, order: ["typography", "color", "spacing", "layout", "effects"] },
    modal: { kind: "Fenêtre (modale)", groups: { layout: ["alignSelf"], spacing: true }, order: ["spacing", "layout"] },
    carousel: { kind: "Carrousel", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    image: { kind: "Image", groups: { layout: ["alignSelf"], size: null, media: null, spacing: true, border: null, effects: null }, states: true, order: ["size", "media", "border", "effects", "spacing", "layout"] },
    gallery: { kind: "Galerie", groups: { layout: ["columns", "gap"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["layout", "size", "border", "effects", "spacing"] },
    video: { kind: "Vidéo", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    audio: { kind: "Audio", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null } },
    button: { kind: "Bouton", groups: { layout: ["alignSelf"], typography: null, color: null, background: true, size: SIZE_W, spacing: true, border: null, effects: null }, states: true, order: ["typography", "size", "background", "border", "spacing", "effects", "layout"] },
    link: { kind: "Lien", groups: { layout: ["alignSelf"], typography: null, color: ["color"], spacing: true }, states: true, order: TEXT_ORDER },
    icon: { kind: "Icône", groups: { layout: ["alignSelf"], color: ["color"], size: ["width", "height"], spacing: true }, states: true },
    spacer: { kind: "Espace", groups: { size: ["height"], spacing: true } },
    divider: { kind: "Séparateur", groups: { size: SIZE_W, typography: ["fontSize", "fontWeight", "textTransform", "letterSpacing"], color: ["color"], border: null, spacing: true } },
    imagebox: { kind: "Boîte d'image", groups: TEXTUAL, order: TEXT_ORDER },
    iconbox: { kind: "Boîte d'icône", groups: TEXTUAL, order: TEXT_ORDER },
    signupform: { kind: "Formulaire", groups: TEXTUAL, order: TEXT_ORDER },
    animatedheading: { kind: "Titre animé", groups: TEXTUAL, order: TEXT_ORDER },
    sitelogo: { kind: "Logo du site", groups: { layout: ["alignSelf"], typography: ["fontFamily", "fontSize", "fontWeight", "letterSpacing", "textTransform"], color: ["color"], spacing: true, effects: ["opacity"] }, order: ["typography", "spacing", "layout", "effects"] },
    sitetitle: { kind: "Titre du site", groups: TEXTUAL, order: TEXT_ORDER },
    catfilter: { kind: "Filtre par catégorie", groups: TEXTUAL, order: TEXT_ORDER },
    postcontent: { kind: "Contenu de l'article", groups: { layout: ["alignSelf"], size: SIZE_W, spacing: true, border: null, effects: null }, order: ["size", "border", "effects", "spacing", "layout"] },
    copyright: { kind: "Copyright", groups: TEXTUAL, order: TEXT_ORDER },
    flipbox: { kind: "Boîte retournable", groups: { layout: ["alignSelf"], typography: null, size: SIZE_W, spacing: true, border: null, effects: ["boxShadow", "opacity"] }, order: ["size", "typography", "spacing", "border", "effects", "layout"] },
    pricelist: { kind: "Liste de prix", groups: TEXTUAL, order: TEXT_ORDER },
    toc: { kind: "Table des matières", groups: TEXTUAL, order: TEXT_ORDER },
    readingprogress: { kind: "Barre de lecture", groups: { color: ["color"] } },
    rating: { kind: "Évaluation", groups: { layout: ["alignSelf"], typography: ["fontSize", "fontWeight"], color: ["color"], spacing: true }, order: ["typography", "spacing", "layout"] },
    menuanchor: { kind: "Ancre de menu", groups: null },
    map: { kind: "Google Maps", groups: { size: SIZE_W, spacing: true, border: null, effects: ["boxShadow", "opacity"] }, order: ["size", "spacing", "border", "effects"] },
    courserating: { kind: "Avis de la formation", groups: TEXTUAL, order: TEXT_ORDER },
    addtocart: { kind: "Bouton d'achat", groups: { layout: ["alignSelf"], spacing: true, effects: ["opacity"] }, order: ["spacing", "layout", "effects"] },
    course: { kind: "Formation", groups: { layout: ["alignSelf"], size: SIZE_W, background: true, spacing: true, border: null, effects: null }, states: true },
    form: { kind: "Formulaire", groups: { size: null, spacing: true, color: null, background: true, border: null, effects: null }, presets: true },
    component: { kind: "Composant", groups: null },
    legacy: { kind: "Section prête", groups: { size: null, spacing: true, color: null, background: true, border: null, effects: null }, presets: true },
  };
  // Widgets personnalisés : schéma d'inspecteur selon leur nature (texte ou boîte)
  SPEC.types.forEach(function (t) { if (t.schema && !INSPECTORS[t.type]) INSPECTORS[t.type] = t.style === "box" ? { kind: t.label, groups: BOX } : { kind: t.label, groups: TEXTUAL, order: TEXT_ORDER }; });
  // États : le serveur accepte survol / focus / clic pour tout type ; seules les fiches ne les proposaient pas. Survol pour les éléments de contenu et les widgets personnalisés.
  ["heading", "text", "list", "quote", "badge", "iconlist", "rating", "counter", "progress", "gallery", "video", "carousel", "social", "sharebuttons", "iconbox", "imagebox", "map", "hotspot"].forEach(function (t) { if (INSPECTORS[t] && !INSPECTORS[t].states) INSPECTORS[t].states = ["hover"]; });
  SPEC.types.forEach(function (t) { if (t.schema && INSPECTORS[t.type] && !INSPECTORS[t.type].states) INSPECTORS[t.type].states = ["hover"]; });
  function inspectorFor(it) {
    if (!it) return null;
    if (it.type === "layout") return INSPECTORS.section;
    if (it.type === "component") return INSPECTORS.component;
    if (isNode(it)) return INSPECTORS[it.type] || { kind: typeLabel(it), groups: { spacing: true, size: null } };
    if (it.type === "form") return INSPECTORS.form;
    return Object.assign({}, INSPECTORS.legacy, { kind: LEGACY[it.type] ? LEGACY[it.type].label : INSPECTORS.legacy.kind });
  }
  // États (survol) : le serveur les accepte et les publie pour TOUT élément ; l'interface les offrait pour 15 types seulement. On les ouvre (survol) aux
  // autres types qui ont un aspect réglable ; pas aux éléments sans apparence propre (espace, progression de lecture, contenus intégrés, médias lus…).
  var NO_STATES = ["spacer", "readingprogress", "modal", "tooltip", "embed", "html", "map", "video", "audio", "lottie", "component", "form", "legacy", "section", "sitelogo", "hotspot", "carousel", "gallery"];
  Object.keys(INSPECTORS).forEach(function (k) {
    var d = INSPECTORS[k], g = d.groups || {};
    if (d.states || NO_STATES.indexOf(k) >= 0) return;
    if (["typography", "color", "background", "border", "effects"].some(function (x) { return g[x] !== undefined; })) d.states = ["hover"];
  });
  var GROUP_ORDER = ["layout", "spacing", "size", "typography", "color", "background", "media", "border", "effects"];
  var optLabel = function (p, v) { var o = (p.options || []).find(function (x) { return String(x[0]) === String(v); }); return o ? o[1] : v; };
  var lockedAny = function (items) { return !canWrite || items.some(function (x) { return lockedDeep(x.id); }); };
  var idsOf = function (items) { return items.map(function (x) { return x.id; }); };
  // ---------- Contrôles de style compacts ----------
  // Une ligne par propriété : libellé | valeur | effacer. Le point devant le libellé signale une valeur propre à l'écran
  // modifié ; les petites icônes d'appareil, les écrans plus petits qui ont leur propre valeur pour cette propriété.
  // Mots-clés de dimension : valeur sans nombre (comme « auto ») ; liste fermée, la même que celle du serveur
  var KW = ["auto", "fit-content", "min-content", "max-content"];
  var isKw = function (u) { return KW.indexOf(u) >= 0; };
  var UNITS = {
    width: ["px", "%", "rem", "em", "vw", "auto", "fit-content", "min-content", "max-content"], height: ["px", "%", "rem", "em", "vh", "auto", "fit-content", "min-content", "max-content"], outlineWidth: ["px"], outlineOffset: ["px", "rem"], flexBasis: ["px", "%", "rem", "auto"],
    minWidth: ["px", "%", "rem", "em", "vw", "fit-content", "min-content", "max-content"], maxWidth: ["px", "%", "rem", "em", "vw", "fit-content", "min-content", "max-content"], minHeight: ["px", "%", "rem", "em", "vh", "fit-content", "min-content", "max-content"], maxHeight: ["px", "%", "rem", "em", "vh", "fit-content", "min-content", "max-content"],
    gap: ["px", "rem", "em", "%"], rowGap: ["px", "rem", "em", "%"], columnGap: ["px", "rem", "em", "%"], fontSize: ["px", "em", "rem", "vw"], letterSpacing: ["px", "em", "rem"], wordSpacing: ["px", "em", "rem"], scrollMarginTop: ["px", "rem", "em"], textStrokeWidth: ["px", "em"], textIndent: ["px", "em", "rem", "%"], borderWidth: ["px"], borderTopWidth: ["px"], borderRightWidth: ["px"], borderBottomWidth: ["px"], borderLeftWidth: ["px"],
    borderRadius: ["px", "%", "rem"], borderTopLeftRadius: ["px", "%", "rem"], borderTopRightRadius: ["px", "%", "rem"], borderBottomRightRadius: ["px", "%", "rem"], borderBottomLeftRadius: ["px", "%", "rem"],
    top: ["px", "%", "rem"], left: ["px", "%", "rem"], right: ["px", "%", "rem"], bottom: ["px", "%", "rem"],
  };
  ["Top", "Right", "Bottom", "Left"].forEach(function (s) { UNITS["margin" + s] = ["px", "%", "rem", "em", "auto"]; UNITS["padding" + s] = ["px", "%", "rem", "em"]; });
  var unitsOf = function (key) { return (UNITS[key] || ["px", "%", "rem", "em"]).slice(); };
  // « 64px » → { num: "64", unit: "px" } ; « auto » → { num: "", unit: "auto" } ; « 0 » → { num: "0", unit: "px" }
  function splitLen(v) {
    if (v === undefined || v === null || v === "") return null;
    var s = String(v);
    if (isKw(s)) return { num: "", unit: s };
    var m = /^(-?[\d.]+)([a-z%]*)$/.exec(s);
    return m ? { num: m[1], unit: m[2] || "px" } : null;
  }
  var DEVICE_ICON = { desktop: "monitor", wide: "monitor", tablet: "tablet", smartphone: "smartphone", mobile: "smartphone" };
  // Flèches ↑ / ↓ : un pas (Maj : 10 pas, Alt : un dixième) ; chaque pas s'applique tout de suite, une seule étape d'annulation
  function arrowStep(input, step, read, write) {
    input.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      var d = (e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : e.altKey ? 0.1 : 1) * step;
      write(Math.round((read() + d) * 1000) / 1000);
    });
  }
  // ---------- NumericControl : l'UNIQUE infrastructure des champs numériques de l'éditeur ----------
  // Chaque champ (taille, marge, opacité, rotation, filtre, ombre…) n'est qu'une CONFIGURATION de cette fonction :
  //   { id, label, value, placeholder, min, max, step (nombre ou fonction de l'unité), precision, integer,
  //     units (liste), unit (courante), staticUnit (texte fixe), inlineUnit (l'unité se tape avec le nombre : cases de marge),
  //     allowEmpty, slider ([min, max] ou fonction de l'unité), drag, disabled, base (valeur de départ si vide),
  //     onCommit(texteNombre | "", unité, opts) → false si refusé }
  // Saisie, ▲▼, flèches du clavier, curseur et glissement passent tous par onCommit : un seul chemin vers le modèle, donc vers
  // l'historique (annuler / rétablir), l'enregistrement et le rendu. Un clic ▲▼ ou une touche = une étape d'annulation ;
  // un glissement ou un déplacement de curseur = UNE étape (même clé), et le document n'est copié qu'une fois par geste.
  var ncSeq = 0;
  // Curseurs : part de la piste parcourue (variable CSS --pb-fill, 0–100 %) pour dessiner la partie active ; purement visuel, ne touche ni la valeur ni les bornes
  function paintRange(r) {
    var lo = Number(r.min || 0), hi = Number(r.max || 100), v = Number(r.value);
    r.style.setProperty("--pb-fill", (hi > lo ? Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)) : 0) + "%");
  }
  function numericControl(c) {
    var units = c.units && c.units.length ? c.units.slice() : null;
    var min = c.min === undefined ? -Infinity : c.min, max = c.max === undefined ? Infinity : c.max;
    var prec = c.precision === undefined ? 3 : c.precision;
    var unitState = c.unit || (units ? units[0] : "");
    if (units && unitState && units.indexOf(unitState) < 0) units.push(unitState);
    var stepOf = function (u) { return typeof c.step === "function" ? c.step(u) : (c.step || 1); };
    var rnd = function (n) { if (c.integer) return Math.round(n); var f = Math.pow(10, prec); return Math.round(n * f) / f; };
    var clamp = function (n) { return Math.min(max, Math.max(min, n)); };
    var shown = function (n, u) { return c.inlineUnit && u && u !== "px" ? n + u : String(n); };
    var input = h("input", { id: c.id, type: "text", inputmode: "decimal", class: "pb-len-num", value: c.value === undefined || c.value === null ? "" : String(c.value), placeholder: c.placeholder === undefined ? "–" : String(c.placeholder), disabled: c.disabled || isKw(unitState), autocomplete: "off", "data-prop": c.prop || null, "aria-label": c.ariaLabel || null, "data-tip": c.tip || null });
    if (c.inputClass) input.className = c.inputClass;
    // Contrat : un champ numérique n'ouvre JAMAIS de liste au focus (ni datalist, ni autocomplétion) ; l'attribut « list » n'est volontairement pas pris en charge ici.
    var sel = null;
    if (units && !c.inlineUnit) {
      if (units.length > 1) { sel = h("select", { class: "pb-len-unit", "aria-label": (c.label || "Valeur") + " : unité", disabled: c.disabled }, units.map(function (u) { return h("option", { value: u, text: u }); })); sel.value = unitState; }
    }
    var unitNow = function () {
      if (c.inlineUnit) { var m = /(px|%|rem|em|vh|vw|auto)$/i.exec(input.value.trim()); return m ? m[1].toLowerCase() : unitState; }
      return sel ? sel.value : unitState;
    };
    var invalid = function (msg) { input.setAttribute("aria-invalid", "true"); toast((c.label || "Valeur") + " : " + msg, true); return false; };
    // Nombre affiché (ou valeur héritée en grisé, ou point de départ) ; jamais NaN
    var read = function () {
      var v = parseFloat(String(input.value).replace(",", "."));
      if (!isFinite(v)) v = parseFloat(String(input.placeholder).replace(",", "."));
      if (!isFinite(v)) v = c.base !== undefined ? c.base : 0;
      return v;
    };
    var stat = c.staticUnit || (units && units.length === 1 && !c.inlineUnit ? units[0] : "");
    var range = null;
    var rangeOf = function (u) { var r = typeof c.slider === "function" ? c.slider(u) : c.slider; return r && r.length === 2 ? r : null; };
    var syncRange = function () {
      if (!range) return;
      var r = rangeOf(unitNow());
      range.hidden = !r;
      if (!r) return;
      range.min = String(r[0]); range.max = String(r[1]); range.step = String(stepOf(unitNow()));
      range.value = String(read());
      paintRange(range);
    };
    var mark = function (on) { var row = input.closest ? input.closest(".pb-prop") : null; if (row) row.classList.toggle("is-set", on); };
    var send = function (n, u, opts) {
      var ok = c.onCommit(n === "" ? "" : String(n), u, opts);
      if (ok === false) return false;
      input.removeAttribute("aria-invalid");
      mark(n !== "" || isKw(u));
      return true;
    };
    // Saisie validée (Entrée / sortie du champ) : « 32 », « 2rem » (si l'unité existe pour cette propriété), ou vide
    var commit = function (opts) {
      var u = unitNow();
      var raw = input.value.trim().replace(",", ".");
      if (isKw(u)) { input.value = ""; input.placeholder = u; send("", u, opts); return true; }
      var kwTyped = KW.filter(function (k) { return k === raw.toLowerCase(); })[0]; if (kwTyped) { if (units && units.indexOf(kwTyped) >= 0) { if (sel) sel.value = kwTyped; else unitState = kwTyped; send("", kwTyped, opts); return true; } return invalid("« " + kwTyped + " » n'est pas possible ici."); }
      if (raw === "") { if (c.allowEmpty === false) return invalid("une valeur est nécessaire."); send("", u, opts); syncRange(); return true; }
      var m = (units ? /^(-?\d*\.?\d+)\s*(px|%|rem|em|vh|vw)?$/i : /^(-?\d*\.?\d+)$/).exec(raw);
      if (!m) return invalid(units ? "nombre attendu (ex. 24, 50 %, 2rem)." : "nombre attendu.");
      if (m[2]) {
        var tu = m[2].toLowerCase();
        if (units.indexOf(tu) < 0) return invalid("l'unité « " + tu + " » n'existe pas pour ce réglage (" + units.filter(function (x) { return !isKw(x); }).join(", ") + ").");
        u = tu; if (sel) sel.value = tu; else unitState = tu;
      }
      var typed = parseFloat(m[1]);
      // Saisie hors bornes : refusée avec la plage permise (les flèches, le curseur et le glissement, eux, s'arrêtent aux bornes)
      if (typed < min || typed > max) return invalid(isFinite(min) && isFinite(max) ? "entre " + min + " et " + max + "." : isFinite(max) ? max + " au plus." : min + " au moins.");
      var n = rnd(typed);
      input.value = shown(n, u);
      if (isKw(u)) u = units[0];
      if (send(n, u, opts) === false) return false;
      syncRange();
      return true;
    };
    // Un pas (flèches ▲▼, clavier, glissement) : repart de la valeur affichée ou héritée
    var bump = function (steps, opts) {
      if (c.disabled) return;
      var u = unitNow();
      if (isKw(u)) { u = units.filter(function (x) { return !isKw(x); })[0] || "px"; if (sel) sel.value = u; else unitState = u; input.disabled = false; }
      var n = rnd(clamp(read() + steps * stepOf(u)));
      input.value = shown(n, u);
      input.removeAttribute("aria-invalid");
      send(n, u, opts);
      syncRange();
    };
    input.addEventListener("change", function () { commit(); });
    // Mode « direct » (panneau Réglages du site) : chaque frappe valide est appliquée tout de suite, sans message tant que la saisie est incomplète
    if (c.live) input.addEventListener("input", function () {
      var raw = input.value.trim().replace(",", ".");
      if (!/^-?\d*\.?\d+$/.test(raw)) return;
      var n = parseFloat(raw);
      if (n < min || n > max) return;
      send(rnd(n), unitNow(), { light: true });
    });
    var burst = 0;
    input.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault(); e.stopPropagation(); // pas de déplacement de l'élément sélectionné dans le canevas
      if (!e.repeat) burst = ++ncSeq;
      bump((e.key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? 10 : e.altKey ? 0.1 : 1), { key: e.repeat ? "step:" + c.id + ":" + burst : null, light: true });
    });
    if (sel) sel.addEventListener("change", function () {
      input.disabled = Boolean(c.disabled) || isKw(sel.value);
      if (isKw(sel.value) || input.value.trim() !== "") commit(); else { input.focus(); syncRange(); }
    });
    // ▲▼ : deux vrais boutons compacts (hors de l'ordre de tabulation : le clavier a déjà les flèches)
    var stepBtn = function (dir, glyph, text) {
      return h("button", { type: "button", class: "pb-nstep-btn", tabindex: "-1", disabled: c.disabled, "aria-label": text + " : " + (c.label || "valeur"), "data-dir": dir > 0 ? "up" : "down",
        onmousedown: function (e) { e.preventDefault(); }, // le champ garde le focus
        onclick: function (e) { e.preventDefault(); bump(dir * (e.shiftKey ? 10 : e.altKey ? 0.1 : 1), { light: true }); } }, glyph);
    };
    var stepper = h("span", { class: "pb-nstep", role: "group", "aria-label": (c.label || "Valeur") + " : pas" }, stepBtn(1, "▲", "Augmenter"), stepBtn(-1, "▼", "Diminuer"));
    var box = h("div", { class: c.inlineUnit ? "pb-boxcell " + (c.cellClass || "") : "pb-len" }, input, c.hideSteps ? null : stepper, sel, !sel && stat ? h("span", { class: "pb-len-unit is-static", text: stat }) : null);
    // Curseur : seulement quand une plage a du sens ; un déplacement = une étape d'annulation, appliquée en direct
    var wrap = box;
    if (c.slider) {
      range = h("input", { type: "range", class: "pb-nc-range", disabled: c.disabled, "aria-label": (c.label || "Valeur") + " : curseur", tabindex: "0" });
      var slide = 0;
      range.addEventListener("pointerdown", function () { slide = ++ncSeq; });
      range.addEventListener("keydown", function () { slide = ++ncSeq; });
      range.addEventListener("input", function () {
        var u = unitNow(); if (isKw(u)) { u = units.filter(function (x) { return !isKw(x); })[0] || "px"; if (sel) sel.value = u; input.disabled = false; }
        paintRange(range);
        var n = rnd(clamp(Number(range.value)));
        input.value = shown(n, u);
        send(n, u, { key: "slide:" + c.id + ":" + (slide || ++ncSeq), light: true });
      });
      range.addEventListener("change", function () { renderInspector(); });
      wrap = h("div", { class: "pb-nc" }, box, range);
      syncRange();
    }
    // Glissement horizontal sur le LIBELLÉ de la ligne (la zone de saisie reste du texte : sélection, copier-coller, clavier intacts)
    wrap.scrub = function (label) {
      if (!c.drag || c.disabled || !label) return;
      label.classList.add("pb-scrub");
      label.setAttribute("data-tip", "Glisser vers la gauche ou la droite pour modifier la valeur (Maj : ×10, Alt : ÷10)");
      label.addEventListener("pointerdown", function (e) {
        if (e.button !== 0) return;
        var x0 = e.clientX, base = read(), moved = false, key = "drag:" + c.id + ":" + (++ncSeq), pending = null, raf = 0;
        var flush = function () {
          raf = 0; if (pending === null) return;
          var u = unitNow(); if (isKw(u)) u = units.filter(function (x) { return !isKw(x); })[0] || "px";
          var n = rnd(clamp(pending)); pending = null;
          input.value = shown(n, u); send(n, u, { key: key, light: true }); syncRange();
        };
        var move = function (ev) {
          var dx = ev.clientX - x0;
          if (!moved && Math.abs(dx) < 4) return;
          moved = true; ev.preventDefault(); document.body.classList.add("pb-scrubbing");
          pending = base + Math.round(dx / 4) * stepOf(unitNow()) * (ev.shiftKey ? 10 : ev.altKey ? 0.1 : 1);
          if (!raf) raf = requestAnimationFrame(flush);
        };
        var up = function () {
          document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
          document.body.classList.remove("pb-scrubbing");
          if (raf) { cancelAnimationFrame(raf); raf = 0; }
          if (moved) {
            flush();
            var eat = function (ev) { ev.preventDefault(); ev.stopPropagation(); label.removeEventListener("click", eat, true); };
            label.addEventListener("click", eat, true); setTimeout(function () { label.removeEventListener("click", eat, true); }, 0);
            renderInspector();
          }
        };
        document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
      });
    };
    wrap.input = input;
    return wrap;
  }

  // Libellés courts dans les lignes (le nom complet reste en infobulle et pour les lecteurs d'écran)
  var SHORT = { alignItems: "Aligner", alignSelf: "Alignement", justifySelf: "Justification", justifyItems: "Justifier", alignContent: "Aligner lignes", gridAutoFlow: "Remplissage", flexWrap: "Retour ligne", justifyContent: "Justifier", gap: "Écart", rowGap: "Écart lignes", columnGap: "Écart colonnes", flexDirection: "Direction", display: "Affichage",
    minWidth: "Largeur min.", maxWidth: "Largeur max.", minHeight: "Hauteur min.", maxHeight: "Hauteur max.", flexGrow: "Proportion", columns: "Colonnes",
    fontFamily: "Police", fontWeight: "Graisse", fontSize: "Taille", lineHeight: "Interligne", letterSpacing: "Interlettrage", wordSpacing: "Esp. des mots", columnCount: "Colonnes", textStrokeWidth: "Contour", textStrokeColor: "Couleur du contour", direction: "Sens", scrollMarginTop: "Décalage d'ancre", backgroundClip: "Découpe du fond", textIndent: "Retrait", textTransform: "Casse", textAlign: "Alignement", textDecoration: "Décoration", fontStyle: "Style",
    zIndex: "Plan", boxShadow: "Ombre (préréglage)", gridTemplate: "Largeurs", gridRows: "Lignes", gridColumnSpan: "Colonnes occupées", gridRowSpan: "Lignes occupées", textShadow: "Ombre du texte", transitionDuration: "Transition (ms)", backdropBlur: "Flou arrière (px)", transformOrigin: "Origine", right: "Décalage droite", bottom: "Décalage bas", opacity: "Opacité", overflow: "Débordement", objectFit: "Cadrage", objectPosition: "Point focal", aspectRatio: "Proportions", top: "Décalage haut", left: "Décalage gauche" };
  function propRow(items, key, control, label, id, extra) {
    label = label || SHORT[key];
    var it = items[0];
    var own = ownValue(it, key);
    var dis = lockedAny(items);
    var oh = holderOf(it, false);
    var others = BPS.filter(function (b) { var bag = oh && (styleState === "normal" ? oh.styles && oh.styles[b] : oh.states && oh.states[stateKey(styleState, b)]); return b !== "desktop" && bag && bag[key] !== undefined; });
    var marks = others.length ? h("span", { class: "pb-prop-bps" }, others.map(function (b) {
      return h("span", { class: "pb-prop-bp" + (b === device ? " is-current" : ""), title: "Valeur propre à l'écran « " + bpLabel(b) + " »", role: "img", "aria-label": "Valeur propre : " + bpLabel(b) }, icon(DEVICE_ICON[b]));
    })) : null;
    var reset = own !== undefined ? h("button", { type: "button", class: "pb-reset", "data-tip": "Effacer : revenir à la valeur héritée", "aria-label": "Effacer « " + (label || SP[key].label) + " » pour cet écran", disabled: dis, onclick: function () { setStyle(idsOf(items), key, ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
    var lab = h("label", { for: id, class: "pb-prop-label", title: label && label !== SP[key].label ? label + " (" + SP[key].label + ")" : SP[key].label, "aria-label": SP[key].label }, label || SP[key].label);
    if (control && control.scrub) control.scrub(lab);
    return h("div", { class: "pb-field pb-style-field pb-prop" + (own !== undefined ? " is-set" : ""), "data-prop": key },
      h("div", { class: "pb-prop-head" }, lab, marks, items.length === 1 ? styleRestore(it, key) : null),
      control, extra || null, reset);
  }
  // ---------- Contrôles iconographiques : un bouton = une vraie valeur du modèle ----------
  // [valeur, libellé (infobulle, lecteur d'écran), icône (bibliothèque d'icônes du site) ou « T:texte court », axe du dessin]
  // L'axe du dessin (h : horizontal, v : vertical) permet de pivoter l'icône quand le conteneur est en colonne.
  var ISEG_J = [["flex-start", "Début", "justifyStart", "h"], ["center", "Centre", "justifyCenter", "h"], ["flex-end", "Fin", "justifyEnd", "h"], ["space-between", "Espace entre", "justifyBetween", "h"], ["space-around", "Espace autour", "justifyAround", "h"], ["space-evenly", "Espace égal", "justifyEvenly", "h"]];
  var ISEG_A = [["flex-start", "Début", "alignStart", "v"], ["center", "Centre", "alignMiddle", "v"], ["flex-end", "Fin", "alignEnd", "v"], ["stretch", "Étirer", "alignStretch", "v"]];
  var ISEG_X = [["start", "Début", "justifyStart", "h"], ["center", "Centre", "justifyCenter", "h"], ["end", "Fin", "justifyEnd", "h"], ["stretch", "Étirer", "stretchX", "h"]];
  var ICON_ENUMS = {
    display: { values: [["block", "Bloc", "T:Bloc"], ["flex", "Flex", "T:Flex"], ["grid", "Grille", "T:Grille"], ["inline-block", "En ligne", "T:Ligne"], ["none", "Aucun : masqué", "T:Aucun"]] },
    flexDirection: { values: [["row", "Direction : ligne", "arrowRight"], ["column", "Direction : colonne", "arrowDown"], ["row-reverse", "Direction : ligne inversée", "arrowLeft"], ["column-reverse", "Direction : colonne inversée", "arrowUp"]] },
    flexWrap: { values: [["nowrap", "Sans retour à la ligne", "wrapNone"], ["wrap", "Retour à la ligne", "wrapOn"], ["wrap-reverse", "Retour à la ligne inversé", "wrapReverse"]] },
    justifyContent: { axis: "main", values: ISEG_J },
    alignItems: { axis: "cross", values: ISEG_A.concat([["baseline", "Ligne de base du texte", "alignBaseline", "v"]]) },
    alignContent: { axis: "cross", values: ISEG_A.slice(0, 3).concat(ISEG_J.slice(3), [ISEG_A[3]]) },
    alignSelf: { axis: "cross", child: true, values: [["auto", "Automatique (celui du parent)", "T:Auto"]].concat(ISEG_A) },
    justifyItems: { axis: "x", values: ISEG_X },
    justifySelf: { axis: "x", child: true, values: [["auto", "Automatique (celui de la grille)", "T:Auto"]].concat(ISEG_X) },
    textAlign: { values: [["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]] },
    fontStyle: { values: [["normal", "Normal", "T:N"], ["italic", "Italique", "T:I"]] },
    textTransform: { values: [["none", "Casse telle que saisie", "T:—"], ["uppercase", "MAJUSCULES", "T:AB"], ["lowercase", "minuscules", "T:ab"], ["capitalize", "Première Lettre En Majuscule", "T:Ab"]] },
    textDecoration: { values: [["none", "Aucune décoration", "T:—"], ["underline", "Souligné", "T:U"], ["line-through", "Barré", "T:S"]] },
    overflow: { values: [["visible", "Débordement visible", "T:Visible"], ["hidden", "Débordement masqué", "T:Masqué"], ["auto", "Défilement si nécessaire", "T:Défiler"]] },
  };
  // Axe physique (h / v) réglé par une propriété d'alignement, d'après le rendu réel du canevas (sens du conteneur)
  var axisReal = {};
  function physicalAxis(it, key) {
    var spec = ICON_ENUMS[key];
    if (!spec || !spec.axis) return null;
    if (spec.axis === "x") return "h";
    var l = spec.child ? locate(it.id) : null;
    var target = spec.child ? (l && l.parent) : it;
    if (!target) return null;
    // Valeur du modèle (écran affiché, héritage compris) d'abord : juste même avant que le canevas soit redessiné ;
    // sinon le rendu réel (valeur par défaut de chaque conteneur)
    var disp = valueOf(target, "display"), dir = valueOf(target, "flexDirection");
    if (!disp || !dir) {
      // Style réel du canevas lu UNE fois par élément et par reconstruction de l'inspecteur (chaque lecture force un calcul de style)
      var real = axisReal[target.id];
      if (!real) {
        var el = canvasEl(target.id), cs = el && frame.contentWindow ? frame.contentWindow.getComputedStyle(el) : null;
        real = axisReal[target.id] = cs ? { display: cs.display, flexDirection: cs.flexDirection } : {};
      }
      if (!disp) disp = real.display;
      if (!dir) dir = real.flexDirection;
    }
    var col = !/grid/.test(disp || "") && /column/.test(dir || "");
    return spec.axis === "main" ? (col ? "v" : "h") : (col ? "h" : "v");
  }
  // Groupe de boutons (radio) : flèches / Début / Fin pour se déplacer, Entrée ou Espace pour choisir ; recliquer efface
  var segRefocus = null;
  function segGroup(opts, groupLabel, focusKey, dis) {
    var group = h("div", { class: "pb-iseg", role: "radiogroup", "aria-label": groupLabel });
    var btns = opts.map(function (o) {
      var text = o.icon.indexOf("T:") === 0 ? o.icon.slice(2) : null;
      return h("button", { type: "button", role: "radio", class: "pb-iseg-btn" + (text ? " is-text" : "") + (o.inherited ? " is-inherited" : "") + (o.rot ? " " + o.rot : ""), "aria-checked": String(Boolean(o.on)), "aria-label": o.label + (o.inherited ? " (valeur héritée)" : ""), "data-tip": o.label + (o.inherited ? " · valeur héritée" : o.on && o.clears ? " · cliquer à nouveau pour effacer" : ""), "data-value": o.value === undefined ? null : String(o.value), tabindex: "-1", disabled: dis,
        onclick: function () { segRefocus = focusKey + "|" + (o.value === undefined ? o.label : o.value); o.act(); } }, text ? h("span", { class: "pb-iseg-text", text: text }) : icon(o.icon));
    });
    var at = btns.findIndex(function (b) { return b.getAttribute("aria-checked") === "true"; });
    btns[at < 0 ? 0 : at].tabIndex = 0;
    group.addEventListener("keydown", function (e) {
      var i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      var n = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? btns.length - 1 : null;
      if (n === null) return;
      e.preventDefault(); e.stopPropagation(); // les flèches ne déplacent pas l'élément sélectionné dans le canevas
      n = (n + btns.length) % btns.length;
      btns[i].tabIndex = -1; btns[n].tabIndex = 0; btns[n].focus();
    });
    btns.forEach(function (b) { group.appendChild(b); });
    // Après un choix, l'inspecteur est redessiné : le focus clavier revient sur le bouton choisi
    if (segRefocus && segRefocus.indexOf(focusKey + "|") === 0) {
      var want = segRefocus.slice(focusKey.length + 1); segRefocus = null;
      var target = btns.find(function (b) { return b.dataset.value === want || b.getAttribute("aria-label") === want; }) || btns[at < 0 ? 0 : at];
      setTimeout(function () { if (target && document.body.contains(target)) target.focus({ preventScroll: true }); }, 0);
    }
    return group;
  }
  // Propriété à valeurs connues → groupe d'icônes ; une valeur hors des icônes (ancienne page…) garde la liste classique
  function iconSeg(items, key) {
    var spec = ICON_ENUMS[key], it = items[0];
    var own = ownValue(it, key), inh = inheritedValue(it, key);
    var mixed = items.some(function (x) { return JSON.stringify(ownValue(x, key)) !== JSON.stringify(own); });
    var known = function (v) { return v === undefined || spec.values.some(function (o) { return o[0] === String(v); }); };
    if (!known(own) || !known(inh)) return null;
    var axis = physicalAxis(it, key), cur = mixed ? undefined : own;
    return segGroup(spec.values.filter(function (v) { return SP[key].options.some(function (o) { return o[0] === v[0]; }); }).map(function (v) {
      var on = cur !== undefined && String(cur) === v[0];
      return { value: v[0], label: v[1], icon: v[2], on: on, clears: true, inherited: cur === undefined && !mixed && inh !== undefined && String(inh) === v[0], rot: v[3] && axis && v[3] !== axis ? (v[3] === "h" ? "rot-cw" : "rot-ccw") : "",
        act: function () { setStyle(idsOf(items), key, on ? "" : v[0]); } };
    }), SP[key].label, key, lockedAny(items));
  }
  // Ligne de réglage composée (plusieurs propriétés) : même présentation qu'une propriété simple
  function compoundRow(label, control, isSet, onReset, dis) {
    return h("div", { class: "pb-field pb-style-field pb-prop" + (isSet ? " is-set" : "") },
      h("div", { class: "pb-prop-head" }, h("span", { class: "pb-prop-label", text: label })), control,
      isSet ? h("button", { type: "button", class: "pb-reset", "data-tip": "Effacer : revenir à la valeur héritée", "aria-label": "Effacer « " + label + " » pour cet écran", disabled: dis, onclick: onReset }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" }));
  }
  // Réglages personnalisés dépliés (affichage seulement, dans ce navigateur)
  var segMore = {};
  // Ordre d'un enfant (flex ou grille) : premier, dernier ou valeur personnalisée
  function orderControl(items) {
    var it = items[0], own = ownValue(it, "order"), inh = inheritedValue(it, "order"), dis = lockedAny(items);
    var k = it.id + ":order", cur = own !== undefined ? own : inh;
    var custom = Boolean(segMore[k]) || (cur !== undefined && cur !== -20 && cur !== 20);
    var wrap = h("div", { class: "pb-prop-group" }, compoundRow("Ordre", segGroup([
      { value: -20, label: "Placer en premier", icon: "arrowUp", on: own === -20, clears: true, inherited: own === undefined && inh === -20, act: function () { setStyle(idsOf(items), "order", own === -20 ? "" : -20); } },
      { value: 20, label: "Placer en dernier", icon: "arrowDown", on: own === 20, clears: true, inherited: own === undefined && inh === 20, act: function () { setStyle(idsOf(items), "order", own === 20 ? "" : 20); } },
      { label: "Ordre personnalisé", icon: "edit", on: custom, act: function () { segMore[k] = !custom; renderInspector(); } },
    ], "Ordre", "order", dis), own !== undefined, function () { setStyle(idsOf(items), "order", ""); }, dis));
    if (custom) wrap.appendChild(styleControl(items, "order", "Position"));
    return wrap;
  }
  // Taille flexible d'un enfant flex : grandir, rétrécir ou valeurs personnalisées (grandir, rétrécir, base)
  function flexSizeControl(items) {
    var it = items[0], dis = lockedAny(items), k = it.id + ":flex";
    var g = ownValue(it, "flexGrow"), sh = ownValue(it, "flexShrink"), b = ownValue(it, "flexBasis");
    var grow = g === 1 && sh === 0 && b === undefined, shrink = g === 0 && sh === 1 && b === undefined;
    var any = g !== undefined || sh !== undefined || b !== undefined;
    var custom = Boolean(segMore[k]) || (any && !grow && !shrink);
    var clear = { flexGrow: "", flexShrink: "", flexBasis: "" };
    var wrap = h("div", { class: "pb-prop-group" }, compoundRow("Taille flexible", segGroup([
      { value: "grow", label: "Grandir : occuper l'espace libre", icon: "growX", on: grow, clears: true, act: function () { setStyles(idsOf(items), grow ? clear : { flexGrow: 1, flexShrink: 0, flexBasis: "" }); } },
      { value: "shrink", label: "Rétrécir si la place manque", icon: "shrinkX", on: shrink, clears: true, act: function () { setStyles(idsOf(items), shrink ? clear : { flexGrow: 0, flexShrink: 1, flexBasis: "" }); } },
      { label: "Taille personnalisée", icon: "edit", on: custom, act: function () { segMore[k] = !custom; renderInspector(); } },
    ], "Taille flexible", "flexsize", dis), any, function () { setStyles(idsOf(items), clear); }, dis));
    if (custom) ["flexGrow", "flexShrink", "flexBasis"].forEach(function (key) { if (SP[key]) wrap.appendChild(styleControl(items, key, { flexGrow: "Grandir", flexShrink: "Rétrécir", flexBasis: "Base" }[key])); });
    return wrap;
  }
  // Groupe « Mise en page » : réglages du conteneur (écarts colonne / ligne côte à côte), puis « Enfant Flex » / « Enfant de grille »
  var CHILD_KEYS = ["alignSelf", "justifySelf", "order", "flexGrow", "flexShrink", "flexBasis", "gridColumnStart", "gridColumnEnd", "gridColumnSpan", "gridRowStart", "gridRowEnd", "gridRowSpan"];
  function layoutControls(items, keys, inner) {
    var it = items[0], kind = parentLayout(it);
    var childOf = function (k) { return CHILD_KEYS.indexOf(k) >= 0 && !(it.type === "column" && CHILD_FLEX.indexOf(k) >= 0); };
    var own = keys.filter(function (k) { return !childOf(k); }), child = keys.filter(childOf);
    var paired = own.indexOf("rowGap") >= 0 && own.indexOf("columnGap") >= 0;
    own.forEach(function (k) {
      if (!SP[k]) return;
      if (paired && (k === "rowGap" || k === "columnGap")) {
        if (inner.querySelector(".pb-pair")) return;
        inner.appendChild(h("div", { class: "pb-pair", role: "group", "aria-label": "Écarts" }, styleControl(items, "columnGap", "Colonnes"), styleControl(items, "rowGap", "Lignes")));
        return;
      }
      inner.appendChild(styleControl(items, k));
    });
    if (!child.length) return;
    inner.appendChild(h("p", { class: "pb-acc-sub", text: kind === "grid" ? "Enfant de grille" : kind === "flex" ? "Enfant Flex" : "Placement dans le parent" }));
    var flexDone = false;
    child.forEach(function (k) {
      if (k === "order") inner.appendChild(orderControl(items));
      else if (CHILD_FLEX.indexOf(k) >= 0 && kind === "flex") { if (!flexDone) { flexDone = true; inner.appendChild(flexSizeControl(items)); } }
      else if (SP[k]) inner.appendChild(styleControl(items, k));
    });
  }
  // Graisses : avec une police de la bibliothèque, seules les graisses réellement fournies par la famille sont proposées
  // (la valeur déjà enregistrée reste affichée, jamais effacée)
  function availableOptions(items, key, p) {
    if (key !== "fontWeight" || !window.KFonts) return p.options;
    var fam = ownValue(items[0], "fontFamily"); if (fam === undefined) fam = inheritedValue(items[0], "fontFamily");
    var w = /^font\./.test(String(fam || "")) ? window.KFonts.weightsFor(fam) : null;
    if (!w) return p.options;
    var own = ownValue(items[0], key);
    return p.options.filter(function (o) { var n = Number(o[0]); return String(o[0]) === String(own) || (w.variable ? n >= w.weights[0] && n <= w.weights[w.weights.length - 1] : w.weights.indexOf(n) >= 0); });
  }
  function styleControl(items, key, label, extra) {
    var p = SP[key];
    var it = items[0];
    var own = ownValue(it, key);
    var mixed = items.some(function (x) { return JSON.stringify(ownValue(x, key)) !== JSON.stringify(own); });
    var inh = inheritedValue(it, key);
    var dis = lockedAny(items);
    var id = fid();
    var control;
    var seg = p.kind === "enum" && ICON_ENUMS[key] ? iconSeg(items, key) : null;
    if (seg) control = seg;
    else if (key === "fontFamily" && window.KFonts) {
      // Police : bibliothèque centrale (Font Manager), les cinq réglages du site restent proposés en tête
      control = window.KFonts.picker({ value: mixed || own === undefined ? "" : String(own), legacy: p.options.map(function (o) { return [o[0], o[1]]; }), emptyLabel: inh !== undefined ? "Hérité : " + (/^font\./.test(inh) ? String(inh).replace(/^font\./, "").replace(/-/g, " ") : optLabel(p, inh)) : "Par défaut", disabled: dis, label: "Police",
        onChange: function (v) { setStyle(idsOf(items), key, v); } });
      control.id = id;
    }
    else if (p.kind === "enum") {
      control = h("select", { id: id, class: "pb-prop-select", disabled: dis }, [h("option", { value: "", text: inh !== undefined ? "Hérité : " + optLabel(p, inh) : "Par défaut" })].concat(availableOptions(items, key, p).map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
      control.value = mixed || own === undefined ? "" : String(own);
      control.addEventListener("change", function () { setStyle(idsOf(items), key, control.value); });
    } else if (p.kind === "color") control = colorButton(id, mixed ? undefined : own, inh, dis, function (v, opts) { setStyle(idsOf(items), key, v, opts); }, key);
    else if (p.kind === "number") control = numberControl(items, key, id, mixed ? undefined : own, inh, dis);
    else if (p.kind === "text") {
      control = h("input", { id: id, type: "text", class: "pb-prop-text", value: mixed || own === undefined ? "" : String(own), placeholder: inh !== undefined ? String(inh) : "ex. 2fr 1fr", disabled: dis, autocomplete: "off" });
      control.addEventListener("change", function () {
        var v = control.value.trim().toLowerCase().replace(/\s+/g, " ");
        if (v && !/^((\d{1,2}(\.\d)?fr|\d{1,4}px|\d{1,3}%|auto)( |$)){1,12}$/.test(v + " ")) { control.setAttribute("aria-invalid", "true"); toast(p.label + " : valeurs séparées par des espaces, parmi 1fr, 240px, 30%, auto (12 au plus).", true); return; }
        setStyle(idsOf(items), key, v);
      });
    }
    else control = lengthControl(items, key, id, mixed ? undefined : own, inh, dis);
    return propRow(items, key, control, label, id, extra);
  }
  // Configuration de chaque propriété numérique (pas, bornes, précision, curseur, glissement). Les bornes reprennent celles du
  // serveur (nodes.js) : rien de plus étroit, rien de plus large. Pas : 1 pour px et %, 0,1 pour em / rem / vw / vh.
  var STEP_REL = function (u) { return u === "px" || u === "%" ? 1 : 0.1; };
  var SIGNED = /^(margin|top|left|right|bottom|letterSpacing|wordSpacing|textIndent)/;
  var isSigned = function (key) { return SIGNED.test(key); };
  var rangeBy = function (map) { return function (u) { return map[u] || null; }; };
  var LENCFG = {
    fontSize: { base: 16, slider: rangeBy({ px: [8, 120], em: [0.5, 8], rem: [0.5, 8], vw: [0.5, 12] }), min: 1 },
    letterSpacing: { min: -100, max: 100, step: function (u) { return u === "px" ? 0.1 : 0.01; }, precision: 2 },
    wordSpacing: { min: -100, max: 100, step: function (u) { return u === "px" ? 0.1 : 0.01; }, precision: 2 },
    textIndent: { min: -999, max: 999 },
    borderRadius: { slider: rangeBy({ px: [0, 100], "%": [0, 50], rem: [0, 6] }) },
    // Écarts : curseur de confort (la saisie accepte toujours jusqu'à 9999 ; une valeur enregistrée hors plage n'est jamais ramenée dans la plage)
    gap: { slider: rangeBy({ px: [0, 100], rem: [0, 6], em: [0, 6], "%": [0, 20] }) },
    rowGap: { slider: rangeBy({ px: [0, 100], rem: [0, 6], em: [0, 6], "%": [0, 20] }) },
    columnGap: { slider: rangeBy({ px: [0, 100], rem: [0, 6], em: [0, 6], "%": [0, 20] }) },
  };
  // Nombres sans unité : [min, max, pas] + précision, entier, curseur, valeur de départ
  var NUMCFG = {
    opacity: { precision: 2, slider: [0, 1], base: 1, staticUnit: "0 – 1" },
    lineHeight: { precision: 2, slider: [0.8, 3], base: 1.5, staticUnit: "×" },
    zIndex: { integer: true },
    backdropBlur: { integer: true, staticUnit: "px" },
    transitionDuration: { integer: true, staticUnit: "ms" },
    columns: { integer: true }, columnCount: { integer: true }, lineClamp: { integer: true }, flexGrow: { precision: 1 }, flexShrink: { precision: 1 }, order: { integer: true },
    gridRows: { integer: true }, gridColumnSpan: { integer: true }, gridRowSpan: { integer: true },
    gridColumnStart: { integer: true }, gridColumnEnd: { integer: true }, gridRowStart: { integer: true }, gridRowEnd: { integer: true },
  };
  var NUM = { backdropBlur: [1, 40, 1], opacity: [0, 1, 0.01], lineHeight: [0.8, 3, 0.1], zIndex: [-100, 9999, 1], columns: [1, 12, 1], columnCount: [1, 6, 1], lineClamp: [1, 10, 1], flexGrow: [0, 20, 0.1], flexShrink: [0, 20, 0.1], order: [-20, 20, 1], gridRows: [1, 12, 1], gridColumnSpan: [1, 12, 1], gridRowSpan: [1, 6, 1], gridColumnStart: [1, 13, 1], gridColumnEnd: [1, 13, 1], gridRowStart: [1, 13, 1], gridRowEnd: [1, 13, 1], transitionDuration: [0, 2000, 50] };
  // Nombre sans unité d'une propriété de style (opacité, interligne, plan…)
  function numberControl(items, key, id, own, inh, dis) {
    var lim = NUM[key] || [-9999, 9999, 1], cfg = NUMCFG[key] || {};
    return numericControl(Object.assign({ id: id, label: SP[key].label, min: lim[0], max: lim[1], step: lim[2], value: own === undefined ? "" : own, placeholder: inh !== undefined ? inh : cfg.base !== undefined ? cfg.base : "", disabled: dis, drag: true }, cfg, {
      onCommit: function (raw, u, opts) { setStyle(idsOf(items), key, raw === "" ? "" : Number(raw), opts); },
    }));
  }
  // Longueurs : valeur + unité (seules les unités utiles à la propriété) ; « 2rem » tapé directement est compris ; changer l'unité change le CSS
  // Valeurs globales du site (espacements, rayons, tailles de texte) : un élément peut les RÉFÉRENCER (« token:space-md ») au lieu de copier un nombre ;
  // changer le jeton dans les réglages du site met alors à jour tous les éléments qui le référencent.
  var LEN_FAMILY = { gap: "space", rowGap: "space", columnGap: "space", marginTop: "space", marginRight: "space", marginBottom: "space", marginLeft: "space", paddingTop: "space", paddingRight: "space", paddingBottom: "space", paddingLeft: "space", borderRadius: "radius", fontSize: "type" };
  var LEN_LABEL = { "space-xs": "Espacement XS", "space-sm": "Espacement S", "space-md": "Espacement M", "space-lg": "Espacement L", "space-xl": "Espacement XL", "space-xxl": "Espacement XXL",
    "radius-sm": "Rayon S", "radius-md": "Rayon M", "radius-lg": "Rayon L", "radius-button": "Rayon des boutons", "radius-field": "Rayon des champs", "radius-card": "Rayon des cartes",
    "h1-size": "Taille H1", "h2-size": "Taille H2", "h3-size": "Taille H3", "h4-size": "Taille H4", "h5-size": "Taille H5", "h6-size": "Taille H6", "body-size": "Taille du texte", "caption-size": "Taille de légende", "button-size": "Taille des boutons" };
  var lenTokenLabel = function (t) { return LEN_LABEL[t] || t; };
  function lengthControl(items, key, id, own, inh, dis) {
    var fam = LEN_FAMILY[key], list = fam && SPEC.lengthTokens && SPEC.lengthTokens[fam];
    var numeric = lengthControlPlain(items, key, id, own, inh, dis);
    if (!list || !list.length) return numeric;
    var isTok = typeof own === "string" && own.indexOf("token:") === 0;
    var pick = function (btn) {
      var r = btn.getBoundingClientRect();
      var entries = [{ heading: "Valeurs du site" }].concat(list.map(function (t) { return [(("token:" + t.key) === own ? "● " : "") + lenTokenLabel(t.key), function () { setStyle(idsOf(items), key, "token:" + t.key); }, dis, "défaut " + t.value.replace("px", " px")]; }));
      entries.push([isTok ? "Revenir à une valeur propre" : "Valeur propre (nombre)", function () { if (isTok) setStyle(idsOf(items), key, ""); }, dis || !isTok]);
      showMenuEntries(entries, r.left, r.bottom + 4, { wide: true });
    };
    var btn = h("button", { type: "button", class: "pb-tokbtn" + (isTok ? " is-on" : ""), disabled: dis, "aria-haspopup": "menu", "aria-label": "Valeur du site pour « " + SP[key].label + " »", "data-tip": isTok ? "Lié au site : " + lenTokenLabel(own.slice(6)) + " (cliquer pour changer)" : "Utiliser une valeur du site (suit les réglages du site)", onclick: function () { pick(btn); } }, icon("link"));
    if (isTok) return h("div", { class: "pb-lenwrap is-token" }, h("span", { class: "pb-tokchip", text: "Site : " + lenTokenLabel(own.slice(6)) }), btn);
    var wrapNum = h("div", { class: "pb-lenwrap" }, numeric, btn);
    wrapNum.scrub = numeric.scrub; // le glissement sur le libellé vient du champ numérique : l'enveloppe « valeur du site » doit le transmettre
    wrapNum.input = numeric.input;
    return wrapNum;
  }
  function lengthControlPlain(items, key, id, own, inh, dis) {
    var units = unitsOf(key), cur = splitLen(own), base = splitLen(inh), cfg = LENCFG[key] || {};
    var unit = cur ? cur.unit : base ? base.unit : units[0];
    return numericControl(Object.assign({ id: id, label: SP[key].label, units: units, unit: unit, step: STEP_REL, min: isSigned(key) ? -9999 : 0, max: 9999, base: 0, drag: true, disabled: dis,
      value: cur && !isKw(cur.unit) ? cur.num : "", placeholder: base ? (isKw(base.unit) ? base.unit : base.num) : cur && isKw(cur.unit) ? cur.unit : "–" }, cfg, {
      onCommit: function (raw, u, opts) {
        var v = isKw(u) ? u : raw === "" ? "" : Number(raw) === 0 ? "0" : raw + u;
        if (parseLength(v, key) === null) { toast(SP[key].label + " : valeur invalide.", true); return false; }
        setStyle(idsOf(items), key, v, opts);
      },
    }));
  }
  // Une ligne « libellé | valeur | ↺ » autour d'un NumericControl (filtres, ombre, transformation, angle…)
  function numField(label, cfg, isSet, onReset) {
    var id = fid(); cfg.id = id; cfg.label = label;
    var ctl = numericControl(cfg), lab = h("label", { for: id, class: "pb-prop-label", text: label });
    if (ctl.scrub) ctl.scrub(lab);
    return h("div", { class: "pb-field pb-style-field pb-prop" + (isSet ? " is-set" : ""), "data-prop": cfg.prop || null },
      h("div", { class: "pb-prop-head" }, lab), ctl,
      isSet && onReset ? h("button", { type: "button", class: "pb-reset", "data-tip": "Effacer : revenir à la valeur par défaut", "aria-label": "Effacer « " + label + " »", disabled: cfg.disabled, onclick: onReset }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" }));
  }

  // ---------- Couleurs : bouton compact (pastille + code) et sélecteur ----------
  var TOKEN_LABEL = { primary: "Principale", secondary: "Secondaire", accent: "Accent", background: "Fond", surface: "Surface", text: "Texte", muted: "Atténuée", success: "Succès", warning: "Alerte", error: "Erreur", "on-primary": "Sur principale", "on-accent": "Sur accent" };
  // Couleurs personnalisées du site (créées dans « Réglages du site ») : proposées comme celles du système
  var siteCustomColors = function () { return (window.KWEditor && window.KWEditor.customColors) || PAGE.customColors || []; };
  var tokenKeys = function () { return SPEC.colorTokens.concat(siteCustomColors().map(function (c) { return c.key; })); };
  var tokenLabel = function (t) { var c = siteCustomColors().filter(function (x) { return x.key === t; })[0]; return c ? c.label : (TOKEN_LABEL[t] || t); };
  // Couleur réelle d'une couleur du site (thème appliqué à la page affichée dans le canevas)
  function tokenColor(t) { try { var d = frame.contentDocument; var c = d && d.body ? getComputedStyle(d.body).getPropertyValue("--kw-" + t).trim() : ""; return c || null; } catch (e) { return null; } }
  var colorPreview = function (v) { return !v ? null : v === "transparent" ? "transparent" : v.indexOf("token:") === 0 ? tokenColor(v.slice(6)) : v; };
  var colorText = function (v) { return !v ? "" : v === "transparent" ? "Transparente" : v.indexOf("token:") === 0 ? "Site : " + tokenLabel(v.slice(6)) : v.toUpperCase(); };
  var hex2 = function (n) { return ("0" + Math.max(0, Math.min(255, Math.round(n))).toString(16)).slice(-2); };
  function normHex(v) { var s = String(v).toLowerCase(); if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3]; return s; }
  function hexToRgb(v) { var s = normHex(v); return { r: parseInt(s.slice(1, 3), 16), g: parseInt(s.slice(3, 5), 16), b: parseInt(s.slice(5, 7), 16), a: s.length === 9 ? parseInt(s.slice(7, 9), 16) / 255 : 1 }; }
  function rgbToHsl(c) {
    var r = c.r / 255, g = c.g / 255, b = c.b / 255, max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, s = 0, hh = 0, d = max - min;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = Math.round(hh * 60); if (hh < 0) hh += 360; }
    return hh + "°, " + Math.round(s * 100) + " %, " + Math.round(l * 100) + " %";
  }
  function hslToHex(hh, s, l) {
    s /= 100; l /= 100;
    var k = function (n) { return (n + hh / 30) % 12; }, a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return "#" + hex2(f(0) * 255) + hex2(f(8) * 255) + hex2(f(4) * 255);
  }
  // Saisie libre : #RGB, #RRGGBB, #RRGGBBAA, rgb(a)(r, g, b[, a]), hsl(a)(t, s %, l %[, a]) → #rrggbb[aa]
  function parseColor(text) {
    var s = String(text || "").trim().toLowerCase().replace(/\s+/g, "");
    if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return normHex(s);
    if (/^[0-9a-f]{6}$/.test(s)) return "#" + s;
    var alpha = function (x) { if (x === undefined) return ""; var a = /%$/.test(x) ? parseFloat(x) / 100 : parseFloat(x); return isFinite(a) && a < 1 ? hex2(Math.max(0, a) * 255) : ""; };
    var m = /^rgba?\((\d{1,3}),(\d{1,3}),(\d{1,3})(?:,([\d.]+%?))?\)$/.exec(s);
    if (m && [m[1], m[2], m[3]].every(function (x) { return Number(x) <= 255; })) return "#" + hex2(m[1]) + hex2(m[2]) + hex2(m[3]) + alpha(m[4]);
    m = /^hsla?\((\d{1,3})(?:deg)?,(\d{1,3})%,(\d{1,3})%(?:,([\d.]+%?))?\)$/.exec(s);
    if (m && Number(m[1]) <= 360 && Number(m[2]) <= 100 && Number(m[3]) <= 100) return hslToHex(Number(m[1]), Number(m[2]), Number(m[3])) + alpha(m[4]);
    return null;
  }
  function paintSwatch(sw, v) {
    sw.className = "pb-swatch" + (!v ? " is-empty" : v === "transparent" ? " is-transparent" : "");
    var c = v && v !== "transparent" ? colorPreview(v) : null;
    sw.style.background = c || "";
    if (v && v !== "transparent" && !c) sw.classList.add("is-empty");
  }
  // opts.noClear : pas de « par défaut » (couleurs d'un dégradé)
  function colorButton(id, own, inh, dis, onSet, histKey, opts) {
    opts = opts || {};
    var sw = h("span", { class: "pb-swatch", "aria-hidden": "true" });
    paintSwatch(sw, own || inh);
    var text = h("span", { class: "pb-color-text", text: own ? colorText(own) : inh ? colorText(inh) + " · hérité" : "Par défaut" });
    var btn = h("button", { type: "button", id: id, class: "pb-color-btn" + (own ? "" : " is-inherited"), disabled: dis, "aria-haspopup": "dialog", "data-color-key": histKey }, sw, text);
    btn.addEventListener("click", function () { if (!cpop.hidden && cpopFor === btn) { closeColorPop(); return; } openColorPop(btn, own, inh, onSet, opts); });
    return btn;
  }
  var cpop = h("div", { class: "pb-cpop", role: "dialog", "aria-label": "Choisir une couleur", hidden: true });
  document.body.appendChild(cpop);
  var cpopFor = null, cpopDirty = false;
  function closeColorPop(noRender) {
    if (cpop.hidden) return;
    cpop.hidden = true;
    var f = cpopFor; cpopFor = null;
    if (cpopDirty && !noRender) { cpopDirty = false; renderInspector(); renderContext(); var again = f && f.dataset.colorKey ? $("[data-pb-inspector] [data-color-key='" + f.dataset.colorKey + "']") : null; if (again) again.focus(); }
    else if (f && document.body.contains(f)) f.focus();
    cpopDirty = false;
  }
  function openColorPop(btn, own, inh, onSet, opts) {
    closeColorPop(true);
    cpopFor = btn; cpopDirty = false;
    cpop.textContent = "";
    var hk = "color:" + (btn.dataset.colorKey || "x");
    var cur = own && /^#/.test(own) ? normHex(own) : null;
    var state = { hex: cur ? cur.slice(0, 7) : "#0277b6", alpha: cur && cur.length === 9 ? parseInt(cur.slice(7), 16) / 255 : 1 };
    var sw = btn.querySelector(".pb-swatch"), label = btn.querySelector(".pb-color-text");
    var hexIn = h("input", { type: "text", class: "pb-cpop-hex", value: cur ? cur.toUpperCase() : "", placeholder: "#RRGGBB, rgb(…), hsl(…)", "aria-label": "Code couleur (HEX, RGB ou HSL)", autocomplete: "off", spellcheck: "false" });
    var native = h("input", { type: "color", value: state.hex, "aria-label": "Nuancier", class: "pb-cpop-native" });
    var alpha = h("input", { type: "range", min: "0", max: "100", step: "1", value: String(Math.round(state.alpha * 100)), "aria-label": "Opacité de la couleur (en %)", class: "pb-cpop-range" });
    paintRange(alpha);
    var alphaOut = h("output", { class: "pb-cpop-alpha", text: Math.round(state.alpha * 100) + " %" });
    var info = h("p", { class: "pb-cpop-info", "aria-live": "polite" });
    var show = function (v) {
      paintSwatch(sw, v);
      label.textContent = v ? colorText(v) : "Par défaut";
      btn.classList.toggle("is-inherited", !v);
      var rgb = v && /^#/.test(v) ? hexToRgb(v) : null;
      info.textContent = rgb ? "RGB " + rgb.r + ", " + rgb.g + ", " + rgb.b + (rgb.a < 1 ? " · opacité " + Math.round(rgb.a * 100) + " %" : "") + " · HSL " + rgbToHsl(rgb) : v ? colorText(v) : "";
      $$(".pb-cpop-token", cpop).forEach(function (x) { x.classList.toggle("is-on", v === "token:" + x.dataset.token); });
    };
    var set = function (v) { cpopDirty = true; show(v); onSet(v, { key: hk, light: true }); };
    var applyHex = function () { var v = state.hex + (state.alpha < 0.999 ? hex2(state.alpha * 255) : ""); hexIn.value = v.toUpperCase(); hexIn.removeAttribute("aria-invalid"); set(v); };
    native.addEventListener("input", function () { state.hex = native.value; applyHex(); });
    alpha.addEventListener("input", function () { state.alpha = Number(alpha.value) / 100; alphaOut.textContent = alpha.value + " %"; paintRange(alpha); applyHex(); });
    hexIn.addEventListener("change", function () {
      var c = parseColor(hexIn.value);
      if (!c) { hexIn.setAttribute("aria-invalid", "true"); toast("Couleur : #RRGGBB, rgb(r, g, b) ou hsl(t, s %, l %) attendu.", true); return; }
      state.hex = c.slice(0, 7); state.alpha = c.length === 9 ? parseInt(c.slice(7), 16) / 255 : 1;
      native.value = state.hex; alpha.value = String(Math.round(state.alpha * 100)); paintRange(alpha); alphaOut.textContent = alpha.value + " %";
      applyHex();
    });
    hexIn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); hexIn.dispatchEvent(new Event("change")); } });
    var tokens = h("div", { class: "pb-cpop-tokens", role: "group", "aria-label": "Couleurs du site" }, tokenKeys().map(function (t) {
      var c = tokenColor(t);
      var b = h("button", { type: "button", class: "pb-cpop-token" + (c ? "" : " is-empty"), "data-token": t, "data-tip": "Site : " + tokenLabel(t) + (c ? " (" + c + ")" : " — définie par le thème du site"), "aria-label": "Couleur du site : " + tokenLabel(t) });
      if (c) b.style.background = c;
      b.addEventListener("click", function () { set("token:" + t); });
      return b;
    }));
    cpop.appendChild(h("div", { class: "pb-cpop-row" }, native, hexIn));
    cpop.appendChild(h("div", { class: "pb-cpop-row" }, h("span", { class: "pb-cpop-label", text: "Opacité" }), alpha, alphaOut));
    cpop.appendChild(info);
    cpop.appendChild(h("p", { class: "pb-cpop-label", text: "Couleurs du site" }));
    if (!tokenKeys().some(tokenColor)) cpop.appendChild(h("p", { class: "pb-cpop-none", text: "Cette page n'utilise pas de thème de site : ces couleurs n'y ont pas de valeur (reliez la page à un site pour les utiliser)." }));
    cpop.appendChild(tokens);
    cpop.appendChild(h("div", { class: "pb-cpop-row pb-cpop-actions" },
      h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { set("transparent"); } }, "Transparente"),
      opts.noClear ? null : h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { cpopDirty = true; onSet("", {}); closeColorPop(); } }, inh ? "Hériter" : "Par défaut"),
      h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { closeColorPop(); } }, "OK")));
    show(own);
    if (!own) info.textContent = inh ? "Valeur héritée : " + colorText(inh) : "Aucune couleur réglée pour cet écran.";
    cpop.hidden = false;
    var r = btn.getBoundingClientRect(), w = cpop.offsetWidth, hgt = cpop.offsetHeight;
    var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    var top = r.bottom + 4 + hgt > window.innerHeight - 8 ? Math.max(8, r.top - hgt - 4) : r.bottom + 4;
    cpop.style.left = left + "px"; cpop.style.top = top + "px";
    hexIn.focus();
  }
  document.addEventListener("mousedown", function (e) { if (!cpop.hidden && !cpop.contains(e.target) && !(cpopFor && cpopFor.contains(e.target))) closeColorPop(); });
  cpop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeColorPop(); } });

  // ---------- Espacement : modèle de boîte compact (marges autour, intérieur dedans), côtés liables ----------
  var SIDES = ["Top", "Right", "Bottom", "Left"];
  var SIDE_LABEL = { Top: "haut", Right: "droite", Bottom: "bas", Left: "gauche" };
  var linkState = store.get("spacing-link", { margin: false, padding: false });
  var spUnit = { margin: "px", padding: "px" };
  function spacingBox(items) {
    var it = items[0], dis = lockedAny(items), ids = idsOf(items);
    var showLen = function (v) { var p = splitLen(v); return !p ? "" : p.unit === "auto" ? "auto" : p.unit === "px" ? p.num : p.num + p.unit; };
    var cell = function (kind, side) {
      var key = kind + side;
      var own = ownValue(it, key), inh = inheritedValue(it, key);
      var name = (kind === "margin" ? "Marge " : "Intérieur ") + SIDE_LABEL[side];
      var cls = "is-" + kind[0] + side[0].toLowerCase();
      var isTok = typeof own === "string" && own.indexOf("token:") === 0;
      var u0 = (splitLen(own) || splitLen(inh) || { unit: spUnit[kind] }).unit;
      return numericControl({ prop: key, label: name, inlineUnit: true, hideSteps: false, units: unitsOf(key), unit: u0 === "auto" ? spUnit[kind] : u0, step: STEP_REL, min: isSigned(key) ? -9999 : 0, max: 9999, base: 0, disabled: dis,
        value: isTok ? "" : showLen(own), placeholder: isTok ? lenTokenLabel(own.slice(6)).replace("Espacement ", "") : inh !== undefined ? showLen(inh) : "0", inputClass: "pb-box-input " + cls + (own !== undefined ? " is-set" : "") + (isTok ? " is-token" : ""), cellClass: cls,
        ariaLabel: name + (linkState[kind] ? " (4 côtés liés)" : ""), tip: name + (inh !== undefined && own === undefined ? " · hérité : " + inh : ""),
        onCommit: function (raw, u, opts) {
          var v = u === "auto" ? "auto" : raw === "" ? "" : Number(raw) === 0 ? "0" : raw + u;
          if (parseLength(v, key) === null) { toast(name + " : valeur invalide (ex. 24, 2rem" + (kind === "margin" ? ", auto" : "") + ").", true); return false; }
          var map = {};
          (linkState[kind] ? SIDES : [side]).forEach(function (sd) { map[kind + sd] = v; });
          if (linkState[kind]) $$("[data-pb-inspector] .pb-box-input[data-prop^='" + kind + "']").forEach(function (x) { if (x.getAttribute("data-prop") !== key) x.value = showLen(v); });
          setStyles(ids, map, opts);
        } });
    };
    // Unité commune des 4 côtés : elle s'applique aux valeurs déjà saisies (le CSS change vraiment) et sert aux prochaines saisies
    var unitSel = function (kind, label) {
      var first = SIDES.map(function (sd) { return splitLen(ownValue(it, kind + sd)); }).filter(function (p) { return p && p.unit !== "auto"; })[0];
      var sel = h("select", { class: "pb-len-unit pb-link-unit", "aria-label": label + " : unité des 4 côtés", "data-tip": label + " : unité des 4 côtés (les nombres sont conservés, sans conversion)", disabled: dis }, ["px", "%", "rem", "em"].map(function (u) { return h("option", { value: u, text: u }); }));
      sel.classList.add("pb-sp-unit");
      sel.value = first ? first.unit : spUnit[kind];
      sel.addEventListener("change", function () {
        spUnit[kind] = sel.value;
        var map = {};
        SIDES.forEach(function (sd) { var p = splitLen(ownValue(it, kind + sd)); if (p && p.unit !== "auto" && p.num !== "") map[kind + sd] = Number(p.num) === 0 ? "0" : p.num + sel.value; });
        if (Object.keys(map).length) { setStyles(ids, map); toast(label + " : unité " + sel.value + " — les nombres sont conservés (pas de conversion)."); } else renderInspector();
      });
      return sel;
    };
    var linkBtn = function (kind, label) {
      var on = Boolean(linkState[kind]);
      return h("button", { type: "button", class: "pb-link-btn is-icon", "aria-pressed": String(on), "data-link": kind, "aria-label": (on ? "Délier les côtés : " : "Lier les 4 côtés : ") + label, "data-tip": on ? label + " : 4 côtés liés (une valeur pour tous)" : label + " : côtés indépendants — cliquer pour les lier", disabled: dis,
        onclick: function () {
          linkState[kind] = !on; store.set("spacing-link", linkState);
          if (!on) {
            var vals = SIDES.map(function (s) { return ownValue(it, kind + s); });
            var first = vals.filter(function (v) { return v !== undefined; })[0];
            if (first !== undefined && vals.some(function (v) { return v !== first; })) {
              var map = {}; SIDES.forEach(function (s) { map[kind + s] = first; });
              setStyles(ids, map);
              toast(label + " : les 4 côtés valent maintenant " + first + ".");
              return;
            }
          }
          renderInspector();
        } }, icon("link"));
    };
    // Valeur du site (espacement XS … XXL) pour les 4 côtés d'une boîte : une RÉFÉRENCE (« token:space-md »), pas une copie du nombre
    var tokBtn = function (kind, label) {
      var list = SPEC.lengthTokens && SPEC.lengthTokens.space;
      if (!list || !list.length) return null;
      var allTok = SIDES.every(function (sd) { var v = ownValue(it, kind + sd); return typeof v === "string" && v.indexOf("token:") === 0; });
      var btn = h("button", { type: "button", class: "pb-tokbtn" + (allTok ? " is-on" : ""), disabled: dis, "aria-haspopup": "menu", "aria-label": label + " : valeur du site (4 côtés)", "data-tip": label + " : utiliser une valeur du site (suit les réglages du site)",
        onclick: function () {
          var r = btn.getBoundingClientRect();
          var entries = [{ heading: label + " : valeurs du site" }].concat(list.map(function (t) { return [lenTokenLabel(t.key), function () { var map = {}; SIDES.forEach(function (sd) { map[kind + sd] = "token:" + t.key; }); setStyles(ids, map); }, dis, "défaut " + t.value.replace("px", " px")]; }));
          entries.push(["Revenir à des valeurs propres", function () { var map = {}; SIDES.forEach(function (sd) { var v = ownValue(it, kind + sd); if (typeof v === "string" && v.indexOf("token:") === 0) map[kind + sd] = ""; }); if (Object.keys(map).length) setStyles(ids, map); }, dis || !SIDES.some(function (sd) { var v = ownValue(it, kind + sd); return typeof v === "string" && v.indexOf("token:") === 0; })]);
          showMenuEntries(entries, r.left, r.bottom + 4, { wide: true });
        } }, icon("palette"));
      return btn;
    };
    // Présentation : deux blocs « Marge externe » / « Marge interne » (titre, valeur du site, liaison), grille 2 × 2 Haut / Droite / Bas / Gauche ;
    // chaque champ porte l'icône de son côté et l'unité du groupe (vrai sélecteur, le même pour les 4 côtés). Mêmes données, même liaison que partout.
    var ORDER = ["Top", "Right", "Bottom", "Left"], SIDE_NAME = { Top: "Haut", Right: "Droite", Bottom: "Bas", Left: "Gauche" };
    var group = function (kind, title, label) {
      var fields = ORDER.map(function (sd) {
        return h("div", { class: "pb-sp-field" },
          h("span", { class: "pb-sp-side", text: SIDE_NAME[sd] }),
          h("div", { class: "pb-sp-box" }, h("span", { class: "pb-sp-edge is-" + sd.toLowerCase(), "aria-hidden": "true" }), cell(kind, sd), unitSel(kind, label)));
      });
      return h("div", { class: "pb-sp-group", "data-kind": kind },
        h("div", { class: "pb-sp-head" }, h("span", { class: "pb-sp-title", text: title }), tokBtn(kind, label), linkBtn(kind, label)),
        h("div", { class: "pb-sp-grid" }, fields));
    };
    return h("div", { class: "pb-spacing" }, group("margin", "Marge externe", "Marge"), group("padding", "Marge interne", "Intérieur"));
  }

  // ---------- Bordure : style d'abord ; épaisseur et couleur seulement s'il y a une bordure ; arrondi liable ----------
  var CORNER_KEYS = [["borderTopLeftRadius", "↖ Haut gauche"], ["borderTopRightRadius", "↗ Haut droit"], ["borderBottomRightRadius", "↘ Bas droit"], ["borderBottomLeftRadius", "↙ Bas gauche"]];
  var radiusSplit = {}, widthSplit = {};
  var SIDE_WIDTHS = [["borderTopWidth", "↑ Haut"], ["borderRightWidth", "→ Droite"], ["borderBottomWidth", "↓ Bas"], ["borderLeftWidth", "← Gauche"]];
  var valueOf = function (it, k) { var o = ownValue(it, k); return o !== undefined ? o : inheritedValue(it, k); };
  function borderControls(items, inner) {
    var it = items[0], ids = idsOf(items), dis = lockedAny(items);
    inner.appendChild(styleControl(items, "borderStyle", "Style"));
    var style = valueOf(it, "borderStyle");
    if ((style && style !== "none") || ownValue(it, "borderWidth") !== undefined || ownValue(it, "borderColor") !== undefined || SIDE_WIDTHS.some(function (k) { return ownValue(it, k[0]) !== undefined; })) {
      // Épaisseur : une valeur (liée) ou une par côté (ex. seulement une ligne en bas)
      var wsplit = widthSplit[it.id] || SIDE_WIDTHS.some(function (k) { return valueOf(it, k[0]) !== undefined; });
      var wlink = h("button", { type: "button", class: "pb-link-btn is-icon", "aria-pressed": String(!wsplit), "data-link": "border-width", "aria-label": wsplit ? "Lier les 4 côtés (une épaisseur)" : "Délier : une épaisseur par côté", "data-tip": wsplit ? "Côtés indépendants — cliquer pour une seule épaisseur" : "4 côtés liés — cliquer pour régler chaque côté", disabled: dis,
        onclick: function () {
          if (wsplit) {
            var first = SIDE_WIDTHS.map(function (k) { return ownValue(it, k[0]); }).filter(function (v) { return v !== undefined; })[0];
            var map = {}; SIDE_WIDTHS.forEach(function (k) { map[k[0]] = ""; });
            if (first !== undefined) map.borderWidth = first;
            delete widthSplit[it.id];
            setStyles(ids, map);
          } else {
            widthSplit[it.id] = true;
            // Sans épaisseur générale, le navigateur mettrait 3 px aux côtés non réglés : on part de 0 (seuls les côtés réglés se voient)
            if (valueOf(it, "borderWidth") === undefined) { setStyle(ids, "borderWidth", "0"); toast("Épaisseur par côté : les côtés non réglés restent à 0."); }
            else renderInspector();
          }
        } }, icon("link"));
      if (!wsplit) inner.appendChild(styleControl(items, "borderWidth", "Épaisseur", wlink));
      else {
        inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Épaisseur par côté" }), wlink));
        inner.appendChild(styleControl(items, "borderWidth", "Tous les côtés"));
        SIDE_WIDTHS.forEach(function (k) { inner.appendChild(styleControl(items, k[0], k[1])); });
      }
      inner.appendChild(styleControl(items, "borderColor", "Couleur"));
    }
    // Contour (hors de la bordure : ne change pas la taille ; utile au focus et aux repères) : les réglages détaillés n'apparaissent qu'une fois un style choisi
    inner.appendChild(styleControl(items, "outlineStyle", "Contour : style"));
    var ostyle = valueOf(it, "outlineStyle");
    if ((ostyle && ostyle !== "none") || ownValue(it, "outlineWidth") !== undefined || ownValue(it, "outlineColor") !== undefined || ownValue(it, "outlineOffset") !== undefined) {
      inner.appendChild(styleControl(items, "outlineWidth", "Contour : épaisseur"));
      inner.appendChild(styleControl(items, "outlineColor", "Contour : couleur"));
      inner.appendChild(styleControl(items, "outlineOffset", "Contour : décalage"));
    }
    var split = radiusSplit[it.id] || CORNER_KEYS.some(function (c) { return valueOf(it, c[0]) !== undefined; });
    var link = h("button", { type: "button", class: "pb-link-btn is-icon", "aria-pressed": String(!split), "data-link": "radius", "aria-label": split ? "Lier les 4 coins (un seul arrondi)" : "Délier : un arrondi par coin", "data-tip": split ? "Coins indépendants — cliquer pour un seul arrondi" : "4 coins liés — cliquer pour régler chaque coin", disabled: dis,
      onclick: function () {
        if (split) {
          var first = CORNER_KEYS.map(function (c) { return ownValue(it, c[0]); }).filter(function (v) { return v !== undefined; })[0];
          var map = {}; CORNER_KEYS.forEach(function (c) { map[c[0]] = ""; });
          if (first !== undefined) map.borderRadius = first;
          delete radiusSplit[it.id];
          setStyles(ids, map);
        } else { radiusSplit[it.id] = true; renderInspector(); }
      } }, icon("link"));
    if (!split) { inner.appendChild(styleControl(items, "borderRadius", "Arrondi", link)); return; }
    inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Arrondi par coin" }), link));
    inner.appendChild(styleControl(items, "borderRadius", "Tous les coins"));
    CORNER_KEYS.forEach(function (c) { inner.appendChild(styleControl(items, c[0], c[1])); });
  }

  // ---------- Fond : type (aucun, couleur, image, dégradé) puis seulement ses réglages ----------
  var bgChoice = {};
  function bgTypeOf(it) { return valueOf(it, "gradient") ? "gradient" : valueOf(it, "backgroundImage") ? "image" : valueOf(it, "backgroundColor") ? "color" : "none"; }
  function backgroundControls(items, inner) {
    var it = items[0], ids = idsOf(items), dis = lockedAny(items);
    var type = bgChoice[it.id] || bgTypeOf(it);
    var choose = function (v) {
      if (v === "none") { delete bgChoice[it.id]; setStyles(ids, { backgroundColor: "", backgroundImage: "", gradient: "", overlay: "", backgroundSize: "", backgroundPosition: "", backgroundRepeat: "", backgroundAttachment: "" }); return; }
      bgChoice[it.id] = v;
      if (v === "gradient" && !valueOf(it, "gradient")) { setStyle(ids, "gradient", { from: "#0277b6", to: "#102a3a", angle: 180 }); return; }
      renderInspector();
    };
    // Type de fond : groupe de boutons (un type = ses réglages seulement)
    var typeSeg = segGroup([["none", "Aucun fond", "T:Aucun"], ["color", "Couleur", "T:Couleur"], ["image", "Image", "T:Image"], ["gradient", "Dégradé", "T:Dégradé"]].map(function (o) {
      return { value: o[0], label: o[1], icon: o[2], on: type === o[0], act: function () { if (type !== o[0]) choose(o[0]); } };
    }), "Type de fond", "bgtype", dis);
    inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop", "data-prop": "backgroundType" }, h("div", { class: "pb-prop-head" }, h("span", { class: "pb-prop-label" }, "Type")), typeSeg, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    var has = function (k) { return ownValue(it, k) !== undefined; };
    if (type === "color" || has("backgroundColor")) inner.appendChild(styleControl(items, "backgroundColor", type === "color" ? "Couleur" : "Couleur dessous"));
    if (type === "image" || has("backgroundImage")) {
      var bg = ownValue(it, "backgroundImage");
      var pid = fid();
      var pick = h("button", { type: "button", id: pid, class: "pb-img-btn", disabled: dis, onclick: function () { openMedia({ title: "Image de fond", onPick: function (m) { setStyle(ids, "backgroundImage", { src: m.path }); } }); } },
        bg ? h("img", { src: bg.src, alt: "" }) : h("span", { class: "pb-img-empty", "aria-hidden": "true" }), h("span", { class: "pb-color-text", text: bg ? bg.src.split("/").pop() : "Choisir une image" }));
      var rm = bg ? h("button", { type: "button", class: "pb-reset", "data-tip": "Retirer l'image de fond", "aria-label": "Retirer l'image de fond", disabled: dis, onclick: function () { setStyle(ids, "backgroundImage", ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
      inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop" + (bg ? " is-set" : ""), "data-prop": "backgroundImage" }, h("div", { class: "pb-prop-head" }, h("label", { for: pid, class: "pb-prop-label" }, "Image")), pick, rm));
      if (bg && bg.src) inner.appendChild(resolutionField(it, [bg.src], dis, { noAuto: true, get: function () { return bg.size || "full"; }, set: function (v) { setStyle(ids, "backgroundImage", v === "full" ? { src: bg.src } : { src: bg.src, size: v }); } }));
      if (bg || valueOf(it, "backgroundImage")) {
        inner.appendChild(styleControl(items, "backgroundSize", "Taille"));
        inner.appendChild(styleControl(items, "backgroundPosition", "Position"));
        inner.appendChild(styleControl(items, "backgroundRepeat", "Répétition"));
        inner.appendChild(styleControl(items, "backgroundAttachment", "Défilement"));
      }
    }
    // Voile : une couleur (souvent semi-transparente) posée sur l'image ou le dégradé, pour la lisibilité du texte
    if (type === "image" || type === "gradient" || has("overlay")) {
      var ov = ownValue(it, "overlay"), ovi = inheritedValue(it, "overlay");
      var oid = fid();
      var ovBtn = colorButton(oid, ov && ov.color, ovi && ovi.color, dis, function (v, opts) { setStyle(ids, "overlay", v ? { color: v } : "", opts); }, "overlay");
      var ovReset = ov ? h("button", { type: "button", class: "pb-reset", "data-tip": "Retirer le voile", "aria-label": "Retirer le voile", disabled: dis, onclick: function () { setStyle(ids, "overlay", ""); } }, "↺") : h("span", { class: "pb-reset-slot", "aria-hidden": "true" });
      inner.appendChild(h("div", { class: "pb-field pb-style-field pb-prop" + (ov ? " is-set" : ""), "data-prop": "overlay" }, h("div", { class: "pb-prop-head" }, h("label", { for: oid, class: "pb-prop-label", title: "Voile coloré posé sur le fond (choisir une opacité dans le sélecteur)" }, "Voile")), ovBtn, ovReset));
    }
    if (type === "gradient" || has("gradient")) {
      var g = valueOf(it, "gradient");
      var gset = function (part) { return function (v, opts) { if (v === "" || v === null || v === undefined) return; var cur = Object.assign({ from: "#0277b6", to: "#102a3a", angle: 180 }, valueOf(byId(it.id), "gradient") || {}); cur[part] = v; Object.keys(cur).forEach(function (k) { if (cur[k] === "" ) delete cur[k]; }); setStyle(ids, "gradient", cur, opts); }; };
      var row = function (label, control, cid) { return h("div", { class: "pb-field pb-style-field pb-prop" }, h("div", { class: "pb-prop-head" }, h("label", { for: cid, class: "pb-prop-label" }, label)), control, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })); };
      var f1 = fid(), f2 = fid(), f3 = fid();
      inner.appendChild(row("Départ", colorButton(f1, g && g.from, undefined, dis, gset("from"), "gradient-from", { noClear: true }), f1));
      inner.appendChild(row("Arrivée", colorButton(f2, g && g.to, undefined, dis, gset("to"), "gradient-to", { noClear: true }), f2));
      inner.appendChild(selectField("Type de dégradé", g && g.type === "radial" ? "radial" : "linear", [["linear", "Linéaire (angle)"], ["radial", "Radial (du centre)"]], function (v) { gset("type")(v === "radial" ? "radial" : "linear"); }, { disabled: dis }));
      inner.appendChild(h("div", { class: "pb-grid-2" },
        numberField("Position départ (%)", g && g.fromAt !== undefined ? g.fromAt : 0, { min: 0, max: 100, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; gset("fromAt")(n); }),
        numberField("Position arrivée (%)", g && g.toAt !== undefined ? g.toAt : 100, { min: 0, max: 100, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; gset("toAt")(n); })));
      // Couleurs intermédiaires (jusqu'à 3), chacune avec sa position en %
      ((g && g.extra) || []).forEach(function (e, i) {
        var cid = fid();
        var setEx = function (patch) { var cur = Object.assign({ from: "#0277b6", to: "#102a3a", angle: 180 }, valueOf(byId(it.id), "gradient") || {}); var ex = (cur.extra || []).slice(); ex[i] = Object.assign({}, ex[i], patch); cur.extra = ex; setStyle(ids, "gradient", cur); };
        inner.appendChild(h("div", { class: "pb-grid-2" },
          row("Couleur " + (i + 2), colorButton(cid, e.color, undefined, dis, function (v) { if (v) setEx({ color: v }); }, "gradient-x" + i, { noClear: true }), cid),
          numberField("Position (%)", e.at, { min: 0, max: 100, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setEx({ at: n }); })));
        inner.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { var cur = Object.assign({}, valueOf(byId(it.id), "gradient")); cur.extra = (cur.extra || []).filter(function (z, k) { return k !== i; }); if (!cur.extra.length) delete cur.extra; setStyle(ids, "gradient", cur); } }, "Retirer cette couleur"));
      });
      inner.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis || ((g && g.extra) || []).length >= 3 || !g, onclick: function () { var cur = Object.assign({ from: "#0277b6", to: "#102a3a", angle: 180 }, valueOf(byId(it.id), "gradient") || {}); cur.extra = (cur.extra || []).concat([{ color: "#ffffff", at: 50 }]); setStyle(ids, "gradient", cur); } }, "Ajouter une couleur au dégradé"));
      var angRow = numField("Angle", { min: 0, max: 360, step: 1, integer: true, staticUnit: "°", value: g ? g.angle : 180, placeholder: 180, base: 180, slider: [0, 360], drag: true, disabled: dis, prop: "gradient-angle",
        onCommit: function (raw, u, opts) { if (raw === "") return false; gset("angle")(Number(raw), opts); } }, false);
      inner.appendChild(angRow);
      if (has("gradient")) inner.appendChild(h("div", { class: "pb-prop-sub" }, h("span"), h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { if (bgChoice[it.id] === "gradient") delete bgChoice[it.id]; setStyle(ids, "gradient", ""); } }, "Retirer le dégradé")));
    }
    // Découpe du fond : jusqu'à la bordure, au remplissage, au contenu, ou dans les lettres du texte (dégradé / image visibles à travers le texte)
    if (type === "image" || type === "gradient" || has("backgroundImage") || has("gradient") || has("backgroundClip")) inner.appendChild(styleControl(items, "backgroundClip", "Découpe du fond"));
  }
  // Séparateur de forme (conteneurs) : une forme en haut et / ou en bas (forme, hauteur, couleur, retournement, au premier plan)
  function shapeDividerControls(it, dis) {
    var out = [];
    // Diaporama en arrière-plan : images de la médiathèque en fondu, temps par image, effet Ken Burns
    var bs = it.bgSlides || { images: [] };
    var setBs = function (fn) { nextLabel = "Diaporama de fond"; change(function () { var x = byId(it.id); var cur = Object.assign({ images: [] }, x.bgSlides); fn(cur); if (cur.images.length) x.bgSlides = cur; else delete x.bgSlides; }); };
    out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Diaporama en arrière-plan" })));
    bs.images.forEach(function (src, i) {
      out.push(h("div", { class: "pb-repeat-item" }, h("img", { src: src, alt: "", class: "pb-thumb" }), h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setBs(function (c) { c.images.splice(i, 1); }); } }, "Retirer")));
    });
    out.push(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis || bs.images.length >= 8, onclick: function () { openMedia({ title: "Images du diaporama de fond", multiple: true, onPick: function (list) { setBs(function (c) { list.forEach(function (m) { if (c.images.length < 8) c.images.push(m.path); }); }); } }); } }, "Ajouter des images"));
    if (bs.images.length === 1) out.push(h("p", { class: "pb-hint", text: "Une seule image : elle reste fixe. Ajoutez-en une deuxième pour lancer le diaporama." }));
    if (bs.images.length >= 2) {
      out.push(numberField("Secondes par image", bs.seconds || 5, { min: 2, max: 30, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setBs(function (c) { if (n === 5) delete c.seconds; else c.seconds = n; }); }));
      out.push(checkField("Effet Ken Burns (zoom lent)", bs.kenBurns, function (v) { setBs(function (c) { if (v) c.kenBurns = true; else delete c.kenBurns; }); }, { disabled: dis }));
    }
      [["top", "Séparateur de forme en haut"], ["bottom", "Séparateur de forme en bas"]].forEach(function (pos) {
        var cur = (it.shapes || []).find(function (x) { return x.position === pos[0]; });
        var setShape = function (patch, label) {
          nextLabel = "Séparateur de forme";
          change(function () {
            var x = byId(it.id), list = (x.shapes || []).filter(function (y) { return y.position !== pos[0]; });
            var base = cur ? Object.assign({}, cur) : { position: pos[0] };
            var next = Object.assign(base, patch);
            Object.keys(next).forEach(function (k) { if (next[k] === "" || next[k] === false || next[k] === undefined) delete next[k]; });
            if (next.shape) list.push(next);
            if (list.length) x.shapes = list; else delete x.shapes;
          });
        };
        out.push(selectField(pos[1], cur ? cur.shape : "", [["", "Aucun"]].concat(SPEC.shapeDividers), function (v) { setShape({ shape: v }); }, { disabled: dis }));
        if (cur) {
          out.push(h("div", { class: "pb-grid-2" },
            numberField("Hauteur (px)", cur.height || 100, { min: 20, max: 300, step: 10, integer: true, disabled: dis }, function (n) { if (n === null) return false; setShape({ height: n === 100 ? "" : n }); }),
            h("div", { class: "pb-field" }, h("label", { class: "pb-prop-label", text: "Couleur" }), h("input", { type: "color", "aria-label": "Couleur de la forme", value: /^#[0-9a-fA-F]{6}$/.test(cur.color || "") ? cur.color : "#ffffff", disabled: dis, onchange: function (e) { setShape({ color: e.target.value }); } }))));
          out.push(checkField("Retourner la forme", cur.flip, function (v) { setShape({ flip: v }); }, { disabled: dis }));
          out.push(checkField("Au premier plan (devant le contenu)", cur.front, function (v) { setShape({ front: v }); }, { disabled: dis }));
        }
      });
    return out;
  }
  function composedControls(items, group) {
    var it = items[0];
    var dis = lockedAny(items);
    var ids = idsOf(items);
    var out = [];
    if (group === "effects") {
      var fl = ownValue(it, "filter") || {}, fli = inheritedValue(it, "filter") || {};
      var FILTERS = [["blur", "Flou", 0, 40, "px", 0], ["brightness", "Luminosité", 0, 300, "%", 100], ["contrast", "Contraste", 0, 300, "%", 100], ["grayscale", "Noir et blanc", 0, 100, "%", 0], ["saturate", "Saturation", 0, 300, "%", 100], ["sepia", "Sépia", 0, 100, "%", 0], ["hueRotate", "Teinte", -360, 360, "°", 0], ["invert", "Inversion des couleurs", 0, 100, "%", 0]];
      out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Filtres" }), Object.keys(fl).length ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "filter", ""); } }, "Retirer") : null));
      FILTERS.forEach(function (f) {
        var putF = function (n, opts) { var next = Object.assign({}, ownValue(byId(it.id), "filter") || {}); if (n === null) delete next[f[0]]; else next[f[0]] = n; setStyle(ids, "filter", Object.keys(next).length ? next : "", opts); };
        out.push(numField(f[1], { min: f[2], max: f[3], step: 1, integer: true, staticUnit: f[4], value: fl[f[0]] === undefined ? "" : fl[f[0]], placeholder: fli[f[0]] !== undefined ? fli[f[0]] : f[5], base: f[5], slider: [f[2], f[3]], drag: true, disabled: dis, prop: "filter-" + f[0],
          onCommit: function (raw, u, opts) { putF(raw === "" ? null : Number(raw), opts); } }, fl[f[0]] !== undefined, function () { putF(null); }));
      });
      var bl = ownValue(it, "backdrop") || {}, bli = inheritedValue(it, "backdrop") || {};
      var BFILTERS = [["blur", "Flou", 0, 40, "px", 0], ["brightness", "Luminosité", 0, 300, "%", 100], ["contrast", "Contraste", 0, 300, "%", 100], ["grayscale", "Noir et blanc", 0, 100, "%", 0], ["saturate", "Saturation", 0, 300, "%", 100], ["sepia", "Sépia", 0, 100, "%", 0], ["hueRotate", "Teinte", -360, 360, "°", 0], ["invert", "Inversion des couleurs", 0, 100, "%", 0]];
      out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Filtres de l'arrière-plan (verre dépoli)" }), Object.keys(bl).length ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "backdrop", ""); } }, "Retirer") : null));
      BFILTERS.forEach(function (f) {
        var putF = function (n, opts) { var next = Object.assign({}, ownValue(byId(it.id), "backdrop") || {}); if (n === null) delete next[f[0]]; else next[f[0]] = n; setStyle(ids, "backdrop", Object.keys(next).length ? next : "", opts); };
        out.push(numField(f[1], { min: f[2], max: f[3], step: 1, integer: true, staticUnit: f[4], value: bl[f[0]] === undefined ? "" : bl[f[0]], placeholder: bli[f[0]] !== undefined ? bli[f[0]] : f[5], base: f[5], slider: [f[2], f[3]], drag: true, disabled: dis, prop: "filter-" + f[0],
          onCommit: function (raw, u, opts) { putF(raw === "" ? null : Number(raw), opts); } }, bl[f[0]] !== undefined, function () { putF(null); }));
      });
      var sh = ownValue(it, "shadow"), shi = inheritedValue(it, "shadow"), cur = sh || shi || { x: 0, y: 6, blur: 18, spread: 0, color: "#10222f29" };
      var put = function (k, v, opts) { var next = Object.assign({ x: 0, y: 6, blur: 18, spread: 0, color: "#10222f29" }, ownValue(byId(it.id), "shadow") || shi || {}); next[k] = v; setStyle(ids, "shadow", next, opts); };
      var num = function (k, label, min, max) {
        return numField(label, { min: min, max: max, step: 1, integer: true, staticUnit: "px", value: sh ? sh[k] : "", placeholder: cur[k], base: cur[k], drag: true, disabled: dis, prop: "shadow-" + k,
          onCommit: function (raw, u, opts) { if (raw === "") return false; put(k, Number(raw), opts); } }, false);
      };
      out.push(h("p", { class: "pb-prop-sub" }, h("span", { class: "pb-prop-label", text: "Ombre personnalisée" }), sh ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis, onclick: function () { setStyle(ids, "shadow", ""); } }, "Retirer") : null));
      var sc = fid();
      out.push(num("x", "Décalage X", -100, 100), num("y", "Décalage Y", -100, 100), num("blur", "Flou", 0, 200), num("spread", "Étendue", -50, 100),
        h("div", { class: "pb-field pb-style-field pb-prop" + (sh ? " is-set" : ""), "data-prop": "shadow" }, h("div", { class: "pb-prop-head" }, h("label", { for: sc, class: "pb-prop-label" }, "Couleur")), colorButton(sc, sh && sh.color, shi && shi.color, dis, function (v, opts) { if (v) put("color", v, opts); }, "shadow", { noClear: true }), h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    }
    if (group === "background" && kidsOf(it)) shapeDividerControls(it, dis).forEach(function (c) { out.push(c); });
    // (la transformation — déplacement, rotation, échelle, inclinaison — est dans la section « Transformer », page-builder-effects.js)
    return out;
  }
  // Sélecteur d'écran : icônes (nom en infobulle) ; un point signale un écran où cet élément a ses propres réglages
  // Nombre de réglages propres à un état, pour un écran (dev) ou pour tous les écrans (dev = null)
  function stateCount(it, state, dev) {
    var bh = holderOf(it, false), n = 0;
    if (!bh || !bh.states) return 0;
    BPS.forEach(function (b) { if (dev && b !== dev) return; var set = bh.states[stateKey(state, b)]; if (set) n += Object.keys(set).length; });
    return n;
  }
  function breakpointSwitch(items) {
    var it = items[0];
    var seg = h("div", { class: "pb-seg pb-bp-seg", role: "radiogroup", "aria-label": "Écran modifié" }, SPEC.breakpoints.map(function (b) {
      var bh = holderOf(it, false), own = bh && bh.styles && bh.styles[b.key] && Object.keys(bh.styles[b.key]).length;
      return h("button", { type: "button", role: "radio", "aria-checked": String(device === b.key), class: own ? "has-values" : null, "data-tip": own ? b.label + " · réglages propres à cet écran" : b.label + (b.key === "desktop" ? "" : " · hérite de l'écran plus grand"), "data-device": b.key, onclick: function () { setDevice(b.key); } }, icon(DEVICE_ICON[b.key]), h("span", { class: "sr-only", text: b.label }));
    }));
    return h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "Écran" }), seg);
  }
  // Réglages d'un ENFANT selon la mise en page de son parent : flex (croissance, rétrécissement, base, ordre) ou grille (début,
  // fin, étendue de la colonne et de la ligne, alignement dans la case). Seuls ceux qui s'appliquent réellement sont proposés.
  var CHILD_FLEX = ["flexGrow", "flexShrink", "flexBasis"];
  function parentLayout(it) {
    var l = locate(it.id);
    if (!l || !l.parent) return "none";
    var p = l.parent;
    if (p.type === "layout") return "flow";
    var d = valueOf(p, "display");
    if (d === "grid") return "grid";
    if (d === "block" || d === "inline-block" || d === "inline" || d === "none") return "block";
    return p.type === "grid" ? "grid" : "flex";
  }
  function withChildKeys(it, keys, plan) {
    var kind = parentLayout(it);
    var extra = kind === "grid" ? ["alignSelf", "justifySelf", "gridColumnStart", "gridColumnEnd", "gridColumnSpan", "gridRowStart", "gridRowEnd", "gridRowSpan", "order"]
      : kind === "flex" ? ["alignSelf", "flexGrow", "flexShrink", "flexBasis", "order"] : [];
    var taken = {};
    plan.forEach(function (x) { x[1].forEach(function (k) { taken[k] = true; }); });
    var out = keys.slice();
    extra.forEach(function (k) { if (out.indexOf(k) < 0 && !taken[k] && SP[k]) out.push(k); });
    return out;
  }
  // Sélecteur de PARTIE (widgets qui en déclarent) : « Widget · Carte · Image · Titre… » ; un point signale une partie déjà personnalisée
  function partsRow(items, box) {
    var it = items[0], defs = items.length === 1 && isNode(it) && NT[it.type] && NT[it.type].parts;
    if (!defs) return;
    var pick = function (key) { styleTarget = key; renderInspector(); };
    var chip = function (key, label) {
      var own = key ? Boolean(it.parts && it.parts[key]) : Boolean(it.styles || it.states);
      return h("button", { type: "button", class: "pb-part" + (styleTarget === key ? " is-on" : "") + (own ? " has-own" : ""), "aria-pressed": String(styleTarget === key), "data-part": key || "", "data-tip": own ? label + " · réglages propres" : label, onclick: function () { pick(key); } }, label);
    };
    var row = h("div", { class: "pb-parts", role: "group", "aria-label": "Partie du widget à modifier" }, chip(null, "Widget"));
    defs.forEach(function (d) { row.appendChild(chip(d.key, d.label)); });
    var wrap = h("div", { class: "pb-parts-wrap" }, h("span", { class: "pb-insp-bar-label", text: "Partie" }), row);
    if (styleTarget && it.parts && it.parts[styleTarget]) wrap.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm pb-part-reset", disabled: lockedAny(items), "data-tip": "Revient aux valeurs par défaut du thème pour cette partie (tous les écrans et états)", onclick: function () {
      var key = styleTarget;
      change(function () { var x = byId(it.id); if (x && x.parts) { delete x.parts[key]; cleanStyles(x); } }, { label: "Réinitialiser la partie" });
      toast("Partie réinitialisée. Ctrl/⌘ + Z pour annuler.");
    } }, "Réinitialiser la partie"));
    box.appendChild(wrap);
  }
  function styleTab(items, box) {
    var it = items[0];
    var pdef = styleTarget ? partDef(it, styleTarget) : null;
    // Partie choisie : ses groupes et ses états (déclarés par le registre) remplacent ceux du widget
    var schema = pdef ? { kind: pdef.label, groups: pdef.groups, states: pdef.states.length ? pdef.states : null } : inspectorFor(it);
    partsRow(items, box);
    var bar = breakpointSwitch(items);
    if (pdef && styleState !== "normal" && pdef.states.indexOf(styleState) < 0) styleState = "normal";
    // « Après défilement » : état propre aux éléments d'un EN-TÊTE (la page a défilé au-delà du seuil) ; jamais pour une partie interne d'un widget ni pour les éléments sans apparence propre
    var hdrState = function (x) { return !pdef && isHeaderDoc() && NO_STATES.indexOf(x.type) < 0; };
    if ((schema.states || hdrState(it)) && (pdef || items.every(function (x) { return inspectorFor(x).states || hdrState(x); }))) {
      bar.appendChild(h("span", { class: "pb-insp-bar-label is-second", text: "État" }));
      var stateList = (Array.isArray(schema.states) ? SPEC.states.filter(function (st) { return schema.states.indexOf(st.key) >= 0; }) : schema.states ? SPEC.states : []).filter(function (st) { return st.key !== "scrolled" && st.key !== "menuOpen"; }).concat(hdrState(it) ? SPEC.states.filter(function (st) { return st.key === "scrolled" || st.key === "menuOpen"; }) : []);
      bar.appendChild(h("div", { class: "pb-seg pb-state-seg", role: "radiogroup", "aria-label": "État de l'élément" }, [{ key: "normal", label: "Normal" }].concat(stateList).map(function (st) {
        var sn = st.key === "normal" ? 0 : stateCount(it, st.key, device), sa = st.key === "normal" ? 0 : stateCount(it, st.key, null);
        return h("button", { type: "button", role: "radio", "aria-checked": String(styleState === st.key), "data-state": st.key, class: sa ? "has-values" : null, "aria-label": st.label + (sn ? " : " + sn + " réglage(s) pour cet écran" : sa ? " : réglages sur un autre écran" : ""), "data-tip": sa ? st.label + " · " + sn + " réglage(s) propre(s) à cet écran, " + sa + " au total" : st.label, onclick: function () { styleState = st.key; renderInspector(); renderContext(); forceStatePreview(); } }, st.label, sn ? h("span", { class: "pb-state-n", "aria-hidden": "true" }, String(sn)) : null);
      })));
    } else if (styleState !== "normal") styleState = "normal";
    box.appendChild(bar);
    if (styleState !== "normal") box.appendChild(h("p", { class: "pb-hint pb-insp-note", text: "Style appliqué au " + { hover: "survol de la souris", focus: "focus au clavier (contour conservé tant qu'aucun autre repère visible n'est réglé)", active: "moment du clic", scrolled: "moment où la page a défilé au-delà du seuil de l'en-tête", menuOpen: "moment où le menu de l'en-tête est ouvert" }[styleState] + (device === "desktop" ? ", sur l'ordinateur et sur les écrans plus petits tant qu'ils n'ont pas de réglage propre." : " de l'écran « " + bpLabel(device) + " » : un champ vide reprend la valeur de l'écran plus grand (en gris), les autres écrans ne changent pas.") }));
    else if (device !== "desktop") box.appendChild(h("p", { class: "pb-hint pb-insp-note", text: "Écran « " + bpLabel(device) + " » : un champ vide reprend la valeur de l'écran plus grand (en gris)." }));
    // Une propriété, une seule place : la couleur du texte va dans la typographie quand elle existe, la couleur de fond
    // dans « Fond » (avec l'image et le dégradé)
    var keysOf = function (g) {
      var spec = schema.groups[g];
      return Array.isArray(spec) ? spec.slice() : SPEC.styleProps.filter(function (p) { return p.group === g && (CHILD_FLEX.indexOf(p.key) < 0 || it.type === "column") && (p.key !== "lineClamp" || styleTarget); }).map(function (p) { return p.key; });
    };
    var plan = [];
    var order = schema.order || GROUP_ORDER;
    var hasTypo = schema.groups && schema.groups.typography !== undefined;
    order.forEach(function (g) {
      if (!schema.groups || schema.groups[g] === undefined) return;
      var keys = g === "spacing" ? [] : keysOf(g);
      if (g === "color") {
        keys = keys.filter(function (k) { return k !== "backgroundColor"; });
        if (hasTypo || !keys.length) return;
      }
      if (g === "typography" && schema.groups.color !== undefined && keysOf("color").indexOf("color") >= 0) keys.splice(Math.min(3, keys.length), 0, "color");
      if (g === "layout" && !pdef) keys = withChildKeys(it, keys, plan); // le placement dans le parent concerne le WIDGET, jamais une de ses parties
      if (g === "background") keys = ["backgroundColor", "backgroundImage", "gradient", "overlay", "backgroundClip", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment"];
      plan.push([g, keys]);
    });
    // Un élément sans groupe « Mise en page » (image, bouton…) reçoit tout de même les réglages d'enfant de son parent
    if (!pdef && !plan.some(function (x) { return x[0] === "layout"; })) { var ck = withChildKeys(it, [], plan); if (ck.length) plan.push(["layout", ck]); }
    if (it.type === "layout" && items.length === 1) {
      var wid = fid();
      var wsel = h("select", { id: wid, class: "pb-prop-select", disabled: lockedAny(items) }, STYLE.width.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
      wsel.value = (it.style && it.style.width) || "normal";
      wsel.addEventListener("change", function () { change(function () { var x = byId(it.id); x.style = Object.assign({}, x.style); if (wsel.value === "normal") delete x.style.width; else x.style.width = wsel.value; if (!Object.keys(x.style).length) delete x.style; }); });
      box.appendChild(h("div", { class: "pb-field pb-style-field pb-prop pb-sec-width" + (it.style && it.style.width ? " is-set" : ""), "data-prop": "sectionWidth" }, h("div", { class: "pb-prop-head" }, h("label", { for: wid, class: "pb-prop-label" }, "Largeur de section")), wsel, h("span", { class: "pb-reset-slot", "aria-hidden": "true" })));
    }
    plan.forEach(function (x, i) { box.appendChild(styleSection(items, x[0], x[1], { open: i === 0 })); });
    if (schema.presets && !isNode(it)) legacyLayout(items, box);
  }
  // Un groupe repliable (état ouvert / fermé mémorisé) ; le nombre discret = valeurs propres à l'écran modifié
  var COLOR_LABEL = { color: "Texte" };
  function styleSection(items, g, keys, opts) {
    var det = accShell(g, opts && opts.open);
    var counted = g === "spacing" ? SIDES.map(function (s) { return "margin" + s; }).concat(SIDES.map(function (s) { return "padding" + s; })) : keys;
    var set = counted.filter(function (k, i) { return counted.indexOf(k) === i && items.some(function (x) { return ownValue(x, k) !== undefined; }); }).length;
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: SPEC.groups[g] || g }), items.length === 1 ? groupRestore(items[0], g, counted) : null, set ? h("span", { class: "pb-acc-count", title: set + " réglage(s) propre(s) à cet écran", "aria-label": set + " réglage(s) modifié(s)" }, String(set)) : null));
    var inner = h("div", { class: "pb-acc-body" });
    if (g === "spacing") inner.appendChild(spacingBox(items));
    else if (g === "border") borderControls(items, inner);
    else if (g === "background") backgroundControls(items, inner);
    else if (g === "layout") layoutControls(items, keys, inner);
    else keys.forEach(function (k) { if (SP[k]) inner.appendChild(styleControl(items, k, g === "typography" && k === "color" ? "Couleur" : g === "color" ? COLOR_LABEL[k] : null)); });
    composedControls(items, g).forEach(function (x) { inner.appendChild(x); });
    det.appendChild(inner);
    return det;
  }
  // Préréglages des sections prêtes (espacement, fond, largeur, alignement du design system)
  var STYLE = {
    padding: [["", "Par défaut"], ["none", "Aucun"], ["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"], ["xl", "Très grand"]],
    background: [["default", "Aucun"], ["surface", "Surface"], ["primary", "Couleur principale"], ["accent", "Accent"], ["dark", "Foncé"]],
    align: [["", "Par défaut"], ["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]],
    width: [["normal", "Normale"], ["narrow", "Étroite"], ["wide", "Large"], ["full", "Pleine largeur"]],
  };
  var STYLE_LABEL = { padding: "Espacement vertical (design system)", background: "Fond (design system)", align: "Alignement du texte", width: "Largeur (design system)" };
  function legacyLayout(items, box) {
    var det = h("details", { class: "pb-acc", open: true }, h("summary", { text: "Préréglages du site" }));
    var inner = h("div", { class: "pb-acc-body" });
    var dis = lockedAny(items);
    Object.keys(STYLE).forEach(function (k) {
      var vals = items.map(function (s) { return (s.style && s.style[k]) || ""; });
      inner.appendChild(selectField(STYLE_LABEL[k], vals[0] || STYLE[k][0][0], STYLE[k], function (v) {
        change(function () { items.forEach(function (s0) { var s = byId(s0.id); s.style = Object.assign({}, s.style); if (!v || v === "default" || v === "normal") delete s.style[k]; else s.style[k] = v; if (!Object.keys(s.style).length) delete s.style; }); });
      }, { disabled: dis }));
    });
    det.appendChild(inner);
    box.appendChild(det);
  }

  // ---------- Informations (selon la sélection : uniquement des données réelles du modèle et du canevas) ----------
  var KIND_LABEL = { layout: "Section", container: "Conteneur", columns: "Colonnes", column: "Colonne", grid: "Grille", stack: "Pile", group: "Groupe" };
  function measured(id) {
    var doc = frame.contentDocument;
    var el = doc && doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]');
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), el: el };
  }
  function infoRows(it) {
    var rows = [];
    var add = function (k, v) { if (v !== undefined && v !== null && v !== "") rows.push([k, String(v)]); };
    if (!it) {
      var count = 0; walk(function () { count += 1; });
      add("Nom", PAGE.name);
      add("Adresse", "/p/" + PAGE.slug);
      add("Statut", $("[data-pb-status]").textContent);
      add("Sections", content.sections.length);
      add("Éléments", count - content.sections.length);
      add("Écran affiché", bpLabel(device) + " · " + shownWidth + " px de large");
      add("Zoom", Math.round(zoom * 100) + " %");
      add("Enregistrement", $("[data-pb-save]").textContent || "—");
      return rows;
    }
    var l = locate(it.id);
    var p = it.props || {};
    var m = measured(it.id);
    var node = isNode(it);
    add("Type", KIND_LABEL[it.type] || (node ? typeLabel(it) + (it.type === "heading" ? " (H" + p.level + ")" : it.type === "text" ? " (texte riche)" : it.type === "list" ? (p.ordered ? " (numérotée)" : " (à puces)") : "") : (LEGACY[it.type] ? LEGACY[it.type].label : typeLabel(it)) + " (section prête)"));
    add("Nom", it.name || "—");
    add("Identifiant", it.id);
    add("Parent", l && l.parent ? nameOf(l.parent) : "Page");
    if (kidsOf(it)) add("Enfants", kidsOf(it).length + (countDeep(it) > kidsOf(it).length ? " (" + countDeep(it) + " au total)" : ""));
    if (m) add("Dimensions affichées", m.w + " × " + m.h + " px (" + bpLabel(device).toLowerCase() + ")");
    if (node && (it.type === "heading" || it.type === "quote")) add("Contenu", (p.text || "").slice(0, 120));
    if (!node && (it.markdown || it.text)) { var md = String(it.markdown || it.text).replace(/[#*_>\[\]()`-]/g, " ").replace(/\s+/g, " ").trim(); add("Contenu", md.slice(0, 120) + (md.length > 120 ? "…" : "")); }
    if (node && it.type === "text") { var txt = (p.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(); add("Contenu", txt.slice(0, 120) + (txt.length > 120 ? "…" : "")); add("Mots", txt ? txt.split(" ").length : 0); }
    if ((node && it.type === "image") || (!node && ((it.type === "hero" && it.image) || (it.type === "image" && it.src)))) {
      var src = p.src || it.src || it.image;
      add("Source", src);
      add("Format", (String(src).split("?")[0].split(".").pop() || "").toUpperCase());
      add("Texte de remplacement", p.decorative ? "Image décorative" : (p.alt || it.alt || it.imageAlt || "manquant"));
      var img = m && (m.el.tagName === "IMG" ? m.el : m.el.querySelector("img"));
      if (img && img.naturalWidth) add("Taille chargée", img.naturalWidth + " × " + img.naturalHeight + " px");
    }
    if (!node && it.type === "button") { add("Texte", it.label); add("Adresse", it.url); }
    if (node && (it.type === "button" || it.type === "link")) { add("Texte", p.label); add("Adresse", p.url); if (it.type === "button") add("Apparence", { primary: "Plein", outline: "Contour", ghost: "Discret" }[p.variant] || p.variant); add("Nouvel onglet", p.newTab ? "oui" : "non"); }
    if (it.type === "form") { add("Formulaire", PAGE.formName || "aucun (à choisir dans les réglages de la page)"); add("Publié", PAGE.formId ? (PAGE.formPublished ? "oui" : "non : la page ne peut pas être publiée") : "—"); add("Titre", it.heading); }
    if (!node && it.type !== "layout" && it.type !== "form" && it.type !== "button") add("Titre", it.title || it.heading);
    var bps = BPS.filter(function (b) { return it.styles && it.styles[b] && Object.keys(it.styles[b]).length; });
    add("Réglages par écran", bps.length ? bps.map(bpLabel).join(", ") : "aucun (style par défaut)");
    var sts = Object.keys(it.states || {});
    if (sts.length) add("États stylés", sts.map(function (k) { var pq = k.split("@"); return { hover: "survol", focus: "focus", active: "clic" }[pq[0]] + (pq[1] ? " (" + bpLabel(pq[1]).toLowerCase() + ")" : ""); }).join(", "));
    if (it.audience) add("Affiché à", (SPEC.audiences.find(function (a) { return a[0] === it.audience.who; }) || [0, it.audience.who])[1] + (it.audience.value !== undefined ? " " + it.audience.value : ""));
    if (it.hideOn && it.hideOn.length) add("Masqué sur", it.hideOn.map(bpLabel).join(", "));
    add("État", [it.hidden ? "masqué" : "", lockedDeep(it.id) ? "verrouillé" : ""].filter(Boolean).join(", ") || "visible, modifiable");
    return rows;
  }
  var infoOpen = store.get("info-open", true);
  function infoBlock(it) {
    var det = h("details", { class: "pb-info", "data-pb-info": it ? it.id : "page" });
    det.open = infoOpen;
    det.addEventListener("toggle", function () { infoOpen = det.open; store.set("info-open", infoOpen); });
    det.appendChild(h("summary", { text: "Informations" }));
    det.appendChild(h("dl", { class: "pb-meta" }, infoRows(it).reduce(function (all, r) { return all.concat(h("dt", { text: r[0] }), h("dd", { text: r[1] })); }, [])));
    return det;
  }
  // Mesures du canevas changées (nouveau rendu, écran, zoom) : seules les informations sont redessinées
  function refreshInfo() {
    var box = $("[data-pb-info]");
    if (!box) return;
    var it = box.dataset.pbInfo === "page" ? null : byId(box.dataset.pbInfo);
    if (box.dataset.pbInfo !== "page" && !it) return;
    var dl = box.querySelector("dl");
    dl.replaceWith(h("dl", { class: "pb-meta" }, infoRows(it).reduce(function (all, r) { return all.concat(h("dt", { text: r[0] }), h("dd", { text: r[1] })); }, [])));
  }

  // ---------- Inspecteur ----------
  var inspTab = store.get("insp-tab", "content");
  var headObserver = null, inspHeadH = 0, inspScroll = 0;
  (function () { var b = $("[data-pb-inspector]"); if (b) b.addEventListener("scroll", function () { inspScroll = b.scrollTop; }, { passive: true }); })();
  var pendingReveal = null;
  // Réglage « Comportement des accordéons » (menu principal et commandes) : une entrée par mode, le mode actif est coché
  function accEntry(m) {
    var K = window.KWAccordion, on = K && K.getMode() === m;
    return [(on ? "● " : "○ ") + K.LABELS[m][0], function () { accSetMode(m); }, !K, K.LABELS[m][1]];
  }
  function accSetMode(m) {
    var K = window.KWAccordion; if (!K) return;
    var closed = K.setMode(m, document.querySelector("[data-pb-inspector]"));
    toast("Accordéons : « " + K.LABELS[m][0] + " »." + (closed ? " " + closed + " section" + (closed > 1 ? "s" : "") + " refermée" + (closed > 1 ? "s" : "") + " (la dernière ouverte reste ouverte)." : ""));
  }
  function renderInspector() {
    applyPreviewState(); // l'aperçu de l'état (en-tête) suit l'état choisi, même quand rien n'est sélectionné
    if (typeof cpop !== "undefined" && cpop && !cpop.hidden) { cpop.hidden = true; cpopFor = null; }
    var box = $("[data-pb-inspector]");
    axisReal = {};
    if (box.dataset.for !== selection.join(",")) styleTarget = null; // un autre élément : on repart du widget lui-même
    var keepScroll = box.dataset.for === selection.join(",") ? inspScroll : 0;
    box.textContent = "";
    resetBtns = []; inspItem = null;
    box.dataset.for = selection.join(",");
    // fieldSeq n'est JAMAIS remis à zéro : les identifiants (pb-f-N) restent uniques dans toute la page, sinon un libellé de
    // l'inspecteur désignait un champ d'un autre panneau (réglages de la page…) au clic et pour les lecteurs d'écran
    var items = selectedItems();
    if (styleTarget && !(items.length === 1 && partDef(items[0], styleTarget))) styleTarget = null;
    // Rien de sélectionné : état vide, et seulement quelques actions globales réelles
    if (!items.length) {
      box.appendChild(h("div", { class: "pb-insp-empty" },
        h("span", { class: "pb-insp-empty-icon", "aria-hidden": "true" }, icon("sliders")),
        h("h2", { text: "Aucun élément sélectionné" }),
        h("p", { class: "pb-hint", text: "Sélectionnez un élément sur le canevas ou dans les calques pour modifier ses propriétés." })));
      // Actions réelles de la page : écran modifié, réglages de la page (onglet « Page »), annuler / rétablir (même historique que la barre du haut)
      box.appendChild(h("div", { class: "pb-insp-section" },
        breakpointSwitch([{}]),
        h("button", { type: "button", class: "btn btn-outline btn-sm pb-pagebtn", "data-tip": "Titre, description, SEO, couleurs, CSS de la page", onclick: function () { openTab($("#pb-tab-page")); } }, icon("layout"), "Réglages de la page"),
        h("div", { class: "pb-hist-row", role: "group", "aria-label": "Historique" },
          h("button", { type: "button", class: "pb-hist-btn", disabled: !past.length || !canWrite, "data-tip": "Annuler (Ctrl/⌘ + Z)", onclick: undo }, icon("undo"), "Annuler"),
          h("button", { type: "button", class: "pb-hist-btn", disabled: !future.length || !canWrite, "data-tip": "Rétablir (Ctrl/⌘ + Maj + Z)", onclick: redo }, icon("redo"), "Rétablir"))));
      var det = infoBlock(null);
      det.querySelector("summary").textContent = "Informations sur la page";
      box.appendChild(det);
      return;
    }
    var it = items[0];
    var multi = items.length > 1;
    if (formatLocked() && items.every(function (x) { return isTopLevelId(x.id); })) {
      box.appendChild(h("div", { class: "pb-note", role: "note" }, icon("lock"), h("span", { text: " Format verrouillé : largeur et marges de cet élément protégées. " }),
        canWrite ? h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { setLayout(Object.assign({}, layoutOf(), { locked: false })); } }, "Déverrouiller") : null));
    }
    var locked = lockedAny(items);
    inspItem = multi || locked ? null : it;
    var schema = inspectorFor(it);
    var l = locate(it.id);
    // En-tête : ce que l'on modifie (nature, nom) et son chemin dans la structure (cliquable)
    var crumbs = multi || !l.ancestors.length ? null : h("nav", { class: "pb-crumbs", "aria-label": "Parents de l'élément" }, [h("button", { type: "button", onclick: function () { select(null); }, text: "Page" })].concat(l.ancestors.map(function (a) { return h("button", { type: "button", onclick: function () { select(a.id); }, text: nameOf(a) }); })));
    var kindIcon = multi ? "layers" : isNode(it) && NT[it.type] ? NT[it.type].icon : it.type === "layout" ? "layout" : "fileText";
    var head = h("div", { class: "pb-insp-head" }, crumbs,
      h("div", { class: "pb-insp-title" },
        h("span", { class: "pb-insp-icon", "aria-hidden": "true" }, icon(kindIcon)),
        h("div", { class: "pb-insp-titles" },
          h("p", { class: "pb-kind", text: multi ? "Sélection multiple" : "Modifier " + schema.kind }),
          h("h2", { text: multi ? items.length + " éléments" : (it.name || preview(it) || schema.kind) })),
        h("span", { class: "pb-insp-head-actions" }, multi ? null : elementRestore(it),
          h("button", { type: "button", class: "pb-panel-toggle", "aria-haspopup": "menu", "data-tip": "Actions : dupliquer, copier, renommer, déplacer, supprimer…", "aria-label": "Actions de la sélection", onclick: function (e) { var r = e.currentTarget.getBoundingClientRect(); openMenu(r.right - 4, r.bottom + 4); } }, icon("moreVertical")),
          h("button", { type: "button", class: "pb-panel-toggle", "data-tip": "Désélectionner", "aria-label": "Désélectionner", onclick: function () { select(null); } }, icon("close")))));
    box.appendChild(head);
    // L'onglet qui suit reste collé sous l'en-tête quand on fait défiler : on lui donne la hauteur réelle de l'en-tête
    if (headObserver) headObserver.disconnect();
    // Hauteur de l'en-tête : valeur connue d'avant, corrigée par l'observateur avant l'affichage (lire offsetHeight ici imposait une mise en page complète)
    if (window.ResizeObserver) { headObserver = new ResizeObserver(function () { inspHeadH = head.offsetHeight; box.style.setProperty("--pb-insp-head-h", inspHeadH + "px"); }); headObserver.observe(head); }
    box.style.setProperty("--pb-insp-head-h", (inspHeadH || 96) + "px");
    if (locked && canWrite) box.appendChild(h("p", { class: "pb-note is-warn", text: "Verrouillé : déverrouillez-le (cadenas dans les calques) pour le modifier." }));
    var boxTabs = !multi && schema.tabs === "box";
    var tabs = boxTabs ? [["general", "Général"], ["style", "Style"], ["interactions", "Interactions"]] : multi ? [["style", "Style"], ["advanced", "Avancé"]] : !schema.groups ? [["content", "Contenu"], ["advanced", "Avancé"]] : [["content", "Contenu"], ["style", "Style"], ["advanced", "Avancé"]];
    if (!tabs.some(function (t) { return t[0] === inspTab; })) inspTab = tabs[0][0];
    var tablist = h("div", { class: "pb-insp-tabs", role: "tablist", "aria-label": "Réglages de la sélection" });
    tabs.forEach(function (t) { tablist.appendChild(h("button", { type: "button", role: "tab", "aria-selected": String(inspTab === t[0]), onclick: function () { inspTab = t[0]; store.set("insp-tab", inspTab); renderInspector(); } }, t[1])); });
    box.appendChild(tablist);
    var body = h("div", { class: "pb-insp-body", role: "tabpanel" });
    box.appendChild(body);
    if (inspTab !== "style") styleTarget = null; // les parties ne se règlent que dans l'onglet Style
    if (inspTab === "general") generalTab(it, body, locked);
    else if (inspTab === "interactions") interactionsTab(it, body, locked);
    else if (inspTab === "content") {
      if (it.type === "component") componentInspector(body, it);
      else if (kidsOf(it)) structureContent(it, body);
      else if (isNode(it)) nodeContentFields(it, body, locked);
      else legacyContentFields(it, body, locked);
    } else if (inspTab === "style") { styleTab(items, body); if (boxTabs) boxStyleExtras(items, body, locked); }
    else advancedTab(items, body, locked);
    inspItem = null;
    if (window.KWAccordion) window.KWAccordion.normalizeIn(box, pendingReveal); pendingReveal = null; // règle du mode choisi (ex. « un seul ouvert ») appliquée au rendu
    if (keepScroll || inspScroll) { box.scrollTop = keepScroll; inspScroll = keepScroll; } // écrire le défilement impose une mise en page : seulement s'il y a quelque chose à restaurer
  }
  // Contenu d'une section libre ou d'un conteneur : sa structure (enfants cliquables), et comment y ajouter
  function structureContent(it, box) {
    var kids = kidsOf(it);
    box.appendChild(h("p", { class: "pb-sub", text: kids.length ? kids.length + " élément(s) à l'intérieur" : "Vide" }));
    if (kids.length) {
      box.appendChild(h("ul", { class: "pb-kids" }, kids.map(function (c) {
        return h("li", {}, h("button", { type: "button", class: "pb-kid", onclick: function () { select(c.id); } }, icon(isNode(c) ? NT[c.type].icon : "layout"), h("span", { class: "pb-kid-kind", text: (inspectorFor(c) || {}).kind || typeLabel(c) }), h("span", { class: "pb-kid-name", text: c.name || preview(c) })));
      })));
    }
    if (it.type === "columns") columnsContent(it, box);
    else if (it.type === "grid") gridContent(it, box);
    if (["container", "grid", "stack", "group"].indexOf(it.type) >= 0) {
      var dis = !canWrite || lockedDeep(it.id), p = it.props || {};
      if (it.type === "container") {
        // Mode d'affichage des enfants : ordinaire, onglets (titre = nom de l'enfant) ou carrousel
        box.appendChild(checkField("Carte insérée dans la boucle de la grille parente (non répétée)", p.loopInsert === true, function (v) { setProp(it.id, "loopInsert", v); }, { disabled: dis, hint: "Seulement utile dans une grille qui répète des résultats : réglez « Intercaler une carte après N résultats » sur la grille." }));
        box.appendChild(selectField("Affichage des éléments à l'intérieur", p.mode || "", [["", "Normal (les uns sous les autres)"], ["tabs", "Onglets (un conteneur enfant par onglet)"], ["accordion", "Accordéon (un conteneur enfant par volet)"], ["carousel", "Carrousel (un conteneur enfant par diapositive)"]], function (v) { change(function () { var x = byId(it.id); if (v) { x.props.mode = v; } else { ["mode", "tabsLook", "tabsStart", "accStart", "accSingle", "accMobile", "dots", "loop", "autoplay", "interval"].forEach(function (k) { delete x.props[k]; }); } }); }, { disabled: dis }));
        var setNested = function (k) { return function (v) { setProp(it.id, k, v); }; };
        if (p.mode === "tabs") {
          box.appendChild(h("p", { class: "pb-hint", text: "Le nom de chaque conteneur enfant (menu ⋮ → Renommer, ou panneau Structure) devient le titre de son onglet ; sans nom : « Onglet 1 », « Onglet 2 »…" }));
          box.appendChild(selectField("Style des onglets", p.tabsLook || "line", [["line", "Soulignés"], ["pills", "Boutons arrondis"]], setNested("tabsLook"), { disabled: dis }));
          box.appendChild(numberField("Onglet ouvert au départ", p.tabsStart || 1, { min: 1, max: 12, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setProp(it.id, "tabsStart", n); }, "De 1 à 12."));
        } else if (p.mode === "accordion") {
          box.appendChild(h("p", { class: "pb-hint", text: "Le nom de chaque conteneur enfant (menu ⋮ → Renommer, ou panneau Structure) devient le titre de son volet ; il peut contenir n'importe quels éléments. Sans nom : « Volet 1 », « Volet 2 »…" }));
          box.appendChild(selectField("Ouvert au départ", p.accStart || "first", [["first", "Le premier volet"], ["none", "Aucun"], ["all", "Tous"]], setNested("accStart"), { disabled: dis }));
          box.appendChild(checkField("Un seul volet ouvert à la fois", p.accSingle === true, setNested("accSingle"), { disabled: dis }));
          box.appendChild(checkField("Volets seulement sur mobile (écran de 767 px ou moins) ; ordinateur et tablette : affichage normal", p.accMobile === true, setNested("accMobile"), { disabled: dis }));
        } else if (p.mode === "carousel") {
          box.appendChild(h("p", { class: "pb-hint", text: "Chaque conteneur enfant est une diapositive (images, textes, boutons… à l'intérieur). Boutons précédent / suivant et défilement au doigt inclus." }));
          box.appendChild(checkField("Points de navigation", p.dots !== false, setNested("dots"), { disabled: dis }));
          box.appendChild(checkField("Reboucler", p.loop === true, setNested("loop"), { disabled: dis }));
          box.appendChild(checkField("Lecture automatique", p.autoplay === true, setNested("autoplay"), { disabled: dis }));
          if (p.autoplay) box.appendChild(numberField("Secondes entre deux diapositives", p.interval || 5, { min: 2, max: 20, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setProp(it.id, "interval", n); }, "De 2 à 20."));
        }
        // Trois modèles de largeur : encadrée (largeur des conteneurs du site, centrée), pleine largeur, personnalisée (largeur max. propre à l'écran affiché)
        var mw = ownValue(it, "maxWidth"); if (mw === undefined) mw = inheritedValue(it, "maxWidth");
        var wmode = p.full ? "full" : p.band && (mw === undefined || mw === "") ? "band" : mw !== undefined && mw !== "" ? "custom" : "boxed";
        box.appendChild(selectField("Largeur du contenu", wmode, [["boxed", "Encadrée (largeur des conteneurs du site, centrée)"], ["band", "Fond pleine largeur, contenu encadré"], ["full", "Pleine largeur"], ["custom", "Personnalisée (largeur max.)"]], function (v) { setContainerWidth(it.id, v, mw !== undefined && mw !== "" ? mw : "960px"); }, { disabled: dis }));
        if (wmode === "custom") {
          var wid = fid();
          var winp = h("input", { id: wid, type: "text", value: mw === undefined ? "" : String(mw), placeholder: "960px", disabled: dis, "aria-describedby": wid + "-h" });
          winp.addEventListener("change", function () {
            var v = parseLength(winp.value, "maxWidth");
            if (v === null || v === "") { toast("Largeur max. : valeur invalide (ex. 960px, 80%, 60rem).", true); winp.value = mw === undefined ? "" : String(mw); return; }
            setStyle([it.id], "maxWidth", v);
          });
          box.appendChild(h("div", { class: "pb-field" }, h("label", { for: wid, text: "Largeur max. de ce conteneur" }), winp, h("p", { class: "pb-hint", id: wid + "-h", text: "Propre à l'écran « " + bpLabel(device) + " » ; px, %, rem ou vw. Le conteneur reste centré et ne dépasse jamais son parent." })));
        }
      }
      if (p.full) {
        if (!isHeaderDoc()) { /* dans un en-tête, l'onglet « En-tête » règle l'effet (un seul endroit) */
        box.appendChild(selectField("Effet de l'en-tête au défilement", p.headerFx || "", [["", "Aucun"], ["shrink", "Se réduit"], ["solid", "Devient plein (en-tête superposé)"], ["both", "Se réduit et devient plein"], ["hide", "Se cache en descendant, revient en remontant"]], function (v) { change(function () { var n = byId(it.id); if (!n) return false; n.props = n.props || {}; if (v) n.props.headerFx = v; else delete n.props.headerFx; }, { label: "Effet de l'en-tête au défilement" }); }, { disabled: dis }));
        box.appendChild(h("p", { class: "pb-hint", text: "Sans effet hors d'un en-tête du Theme Builder (premier conteneur de l'en-tête, collant ou superposé). Coupé si le visiteur demande moins de mouvement." }));
        }
        box.appendChild(selectField("Couleurs et polices de l'en-tête", p.headerIdentity === "site" ? "site" : "", [["", "Identité du modèle (couleurs et polices du modèle)"], ["site", "Couleurs et polices du site"]], function (v) { setProp(it.id, "headerIdentity", v); }, { disabled: dis }));
        box.appendChild(h("p", { class: "pb-hint", text: "À régler sur le premier conteneur d'un en-tête. « Couleurs et polices du site » masque, à l'affichage, les couleurs et polices propres au modèle ; rien n'est effacé : revenir sur « Identité du modèle » les rétablit. Jamais appliqué sans votre choix." }));
      }
      box.appendChild(checkField("Barre fermable (bouton de fermeture pour le visiteur)", p.dismissible === true, function (v) { setProp(it.id, "dismissible", v); }, { disabled: dis, hint: "Pour une barre supérieure : le visiteur la masque d'un clic, son choix est mémorisé dans son navigateur (elle revient si son texte change). Rien n'est supprimé." }));
      box.appendChild(selectField("Balise HTML", p.tag || "div", SPEC.boxTags.map(function (t) { return [t, BOX_TAG_LABEL[t] || t]; }), function (v) { setProp(it.id, "tag", v); }, { disabled: dis }));
      box.appendChild(h("p", { class: "pb-hint", text: "La balise donne le sens de la zone aux lecteurs d'écran et aux moteurs de recherche ; l'affichage ne change pas." }));
    }
    box.appendChild(h("div", { class: "pb-row pb-wrap" }, h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !canWrite || lockedDeep(it.id) || it.type === "columns", onclick: function () { openCommands("Ajouter", { inside: it.id }); } }, icon("plus"), "Ajouter un élément à l'intérieur")));
    box.appendChild(h("p", { class: "pb-hint", text: it.type === "columns" ? "Chaque colonne reçoit ses propres éléments : sélectionnez une colonne puis ajoutez-y un élément (ou glissez-le dedans)." : "Vous pouvez aussi glisser un élément de la bibliothèque (à gauche) directement dedans." }));
  }
  var BOX_TAG_LABEL = { div: "div (neutre)", section: "section (partie de la page)", header: "header (en-tête)", footer: "footer (pied)", article: "article (contenu autonome)", aside: "aside (contenu annexe)", nav: "nav (navigation)" };
  // Colonnes : nombre, largeur de chacune (en % de la ligne, pour l'écran modifié), ordre
  function columnsContent(it, box) {
    var kids = kidsOf(it), dis = !canWrite || lockedDeep(it.id);
    var shares = columnShares(it);
    box.appendChild(h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "Colonnes" }),
      h("div", { class: "pb-stepper" },
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Retirer la dernière colonne", "data-tip": "Retirer la dernière colonne", disabled: dis || kids.length <= 1, onclick: function () { removeColumn(it.id); } }, icon("minus")),
        h("output", { class: "pb-stepper-value", "data-pb-col-count": "", text: String(kids.length) }),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Ajouter une colonne", "data-tip": "Ajouter une colonne (largeurs réparties également)", disabled: dis || kids.length >= MAX_COLS, onclick: function () { addColumn(it.id); } }, icon("plus")))));
    if (device === "mobile") box.appendChild(h("p", { class: "pb-hint", text: "Sur mobile, les colonnes s'affichent l'une sous l'autre : leurs largeurs se règlent sur ordinateur et tablette." }));
    var list = h("ol", { class: "pb-cols-list" });
    kids.forEach(function (c, i) {
      var id = fid();
      var shareCtl = numericControl({ id: id, label: "Largeur de la colonne " + (i + 1), min: 5, max: 95, step: 1, precision: 1, value: Math.round(shares[i] * 10) / 10, base: 50, allowEmpty: false, disabled: dis || device === "mobile" || kids.length < 2, ariaLabel: null,
        onCommit: function (raw) { var v = Number(raw); if (!isFinite(v)) return false; setColumnShare(it.id, i, v); } });
      shareCtl.input.setAttribute("data-pb-col-share", String(i));
      list.appendChild(h("li", { class: "pb-col-row" },
        h("button", { type: "button", class: "pb-kid", onclick: function () { select(c.id); } }, h("span", { class: "pb-kid-name", text: c.name || "Colonne " + (i + 1) }), h("span", { class: "pb-kid-kind", text: (kidsOf(c) || []).length + " élément(s)" })),
        h("label", { class: "sr-only", for: id, text: "Largeur de la colonne " + (i + 1) + " en %" }), shareCtl, h("span", { class: "pb-unit", text: "%" }),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Déplacer la colonne " + (i + 1) + " vers la gauche", "data-tip": "Vers la gauche", disabled: dis || i === 0, onclick: function () { moveColumn(it.id, i, -1); } }, icon("chevronLeft")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Déplacer la colonne " + (i + 1) + " vers la droite", "data-tip": "Vers la droite", disabled: dis || i === kids.length - 1, onclick: function () { moveColumn(it.id, i, 1); } }, icon("chevronRight")),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Supprimer la colonne " + (i + 1), "data-tip": "Supprimer cette colonne", disabled: dis || kids.length <= 1, onclick: function () { removeColumn(it.id, i); } }, icon("trash"))));
    });
    box.appendChild(list);
    box.appendChild(h("div", { class: "pb-row pb-wrap" }, h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: dis || device === "mobile", onclick: function () { change(function () { equalizeColumns(byId(it.id)); }); } }, "Répartir également")));
    box.appendChild(h("p", { class: "pb-hint", text: "Astuce : dans la page, tirez la séparation entre deux colonnes pour changer leurs largeurs." }));
  }
  // Grille : colonnes (écran modifié) et lignes (calculées à partir du nombre de cellules)
  function gridContent(it, box) {
    var dis = !canWrite || lockedDeep(it.id);
    var cols = gridColumnsOf(it), n = kidsOf(it).length, rows = Math.max(1, Math.ceil(n / cols));
    var stepper = function (label, value, attr, minus, plus, offMinus, offPlus) {
      return h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: label }), h("div", { class: "pb-stepper" },
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": minus[0], "data-tip": minus[0], disabled: dis || offMinus, onclick: minus[1] }, icon("minus")),
        h("output", { class: "pb-stepper-value", text: String(value) }, null),
        h("button", { type: "button", class: "pb-icon-btn", "aria-label": plus[0], "data-tip": plus[0], disabled: dis || offPlus, onclick: plus[1] }, icon("plus"))));
    };
    var c = stepper("Colonnes", cols, "cols", ["Retirer une colonne", function () { gridSetColumns(it.id, cols - 1); }], ["Ajouter une colonne", function () { gridSetColumns(it.id, cols + 1); }], cols <= 1, cols >= 12);
    c.querySelector("output").setAttribute("data-pb-grid-cols", "");
    box.appendChild(c);
    var r = stepper("Lignes", rows, "rows", ["Retirer la dernière ligne", function () { gridRemoveRow(it.id); }], ["Ajouter une ligne", function () { gridAddRow(it.id); }], n <= cols, n >= 96);
    r.querySelector("output").setAttribute("data-pb-grid-rows", "");
    box.appendChild(r);
    // Boucle : la grille répète son contenu (le modèle) pour chaque article ou formation, lus à chaque affichage
    var loop = it.props && it.props.loop;
    box.appendChild(checkField("Répéter pour chaque article ou formation (boucle)", Boolean(loop), function (v) { change(function () { var x = byId(it.id); if (v) x.props.loop = { source: "posts", count: 6, sort: "recent" }; else delete x.props.loop; }, { label: v ? "Boucle activée" : "Boucle désactivée" }); }, { disabled: dis }));
    if (loop) {
      var setLoop = function (k, v) { change(function () { var x = byId(it.id); x.props.loop = Object.assign({}, x.props.loop); if (v === "" || v === false) delete x.props.loop[k]; else x.props.loop[k] = v; if (k === "source") { x.props.loop.sort = "recent"; } }, { key: it.id + ":loop:" + k, light: typeof v === "string" && k !== "source" && k !== "sort" }); };
      box.appendChild(selectField("Contenu à répéter", loop.source, [["posts", "Articles du blog"], ["courses", "Formations du catalogue"], ["products", "Produits de la boutique"], ["pages", "Pages du site"], ["authors", "Auteurs"], ["reviews", "Avis clients vérifiés (témoignages)"], ["categories", "Catégories d'articles"], ["tags", "Étiquettes d'articles"]], function (v) { setLoop("source", v); }, { disabled: dis }));
      box.appendChild(selectField("Nombre par page", String(loop.count), ["1", "2", "3", "4", "6", "8", "9", "12", "16", "24", "32", "48"].map(function (n) { return [n, n]; }), function (v) { setLoop("count", Number(v)); }, { disabled: dis }));
      box.appendChild(selectField("Ordre", loop.sort || "recent", loop.source === "courses" || loop.source === "products" ? [["recent", "Les plus récentes"], ["title", "Par titre"], ["price", "Par prix croissant"]] : [["recent", "Les plus récents"], ["old", "Les plus anciens"], ["title", "Par titre"]], function (v) { setLoop("sort", v); }, { disabled: dis }));
      var catList = ((boot.termChoices || {})[loop.source] || []).slice();
      if (loop.category && catList.indexOf(loop.category) < 0) catList.unshift(loop.category);
      if (loop.source === "reviews") { /* pas de catégorie pour les avis */ }
      else if (catList.length && ["posts", "courses", "products"].indexOf(loop.source) >= 0) box.appendChild(selectField("Catégorie (facultative)", loop.category || "", [["", "Toutes les catégories"]].concat(catList.map(function (n) { return [n, n]; })), function (v) { setLoop("category", v); }, { disabled: dis }));
      else box.appendChild(textField("Catégorie (facultative, nom exact)", loop.category || "", function (v) { setLoop("category", v); }, { max: 80, disabled: dis, onChange: true }));
      if (loop.source === "posts") {
        box.appendChild(textField("Étiquettes (séparées par des virgules, facultatif)", (loop.tags || []).join(", "), function (v) { change(function () { var x = byId(it.id); x.props.loop = Object.assign({}, x.props.loop); var t = v.split(",").map(function (a) { return a.trim(); }).filter(Boolean); if (t.length) x.props.loop.tags = t; else delete x.props.loop.tags; }, { key: it.id + ":loop:tags", light: true }); }, { max: 200, disabled: dis, onChange: true }));
      }
      if (loop.source === "posts" || loop.source === "courses" || loop.source === "pages") {
        box.appendChild(checkField("Exclure l'élément affiché sur la page (articles liés, suggestions)", loop.excludeCurrent === true, function (v) { setLoop("excludeCurrent", v); }, { disabled: dis }));
      }
      box.appendChild(checkField("Défilement horizontal (carrousel : flèches et glissement)", loop.slider === true, function (v) { change(function () { var x = byId(it.id); x.props.loop = Object.assign({}, x.props.loop); if (v) { x.props.loop.slider = true; delete x.props.loop.paginate; delete x.props.loop.pagination; } else delete x.props.loop.slider; }, { label: "Carrousel de boucle" }); }, { disabled: dis }));
      box.appendChild(selectField("Pagination", loop.paginate ? (loop.pagination || "numbers") : "none", [["none", "Aucune"], ["numbers", "Page x / y"], ["prevnext", "Précédent / Suivant"], ["both", "Numéros de pages"], ["more", "Bouton « Voir plus »"], ["infinite", "Défilement infini"]], function (v) { change(function () { var x = byId(it.id); x.props.loop = Object.assign({}, x.props.loop); if (v === "none") { delete x.props.loop.paginate; delete x.props.loop.pagination; } else { x.props.loop.paginate = true; x.props.loop.pagination = v; } }, { label: "Pagination" }); }, { disabled: dis }));
      box.appendChild(numberField("Intercaler une carte après N résultats (vide = aucune)", loop.insertAt || "", { min: 1, max: 50, step: 1, integer: true, disabled: dis }, function (n) { change(function () { var x = byId(it.id); x.props.loop = Object.assign({}, x.props.loop); if (!n) { delete x.props.loop.insertAt; delete x.props.loop.insertEvery; } else x.props.loop.insertAt = n; }, { label: "Carte insérée dans la boucle" }); }, "Dans cette grille, cochez « Carte insérée » sur un conteneur enfant : il n'est pas répété, il s'intercale entre les résultats (publicité, appel à l'action)."));
      if (loop.insertAt) box.appendChild(checkField("Répéter la carte tous les N résultats", loop.insertEvery === true, function (v) { setLoop("insertEvery", v); }, { disabled: dis }));
      box.appendChild(checkField("Filtrer avec l'adresse (?q=… recherche, ?categorie=…)", loop.urlFilter === true, function (v) { setLoop("urlFilter", v); }, { disabled: dis }));
      box.appendChild(textField("Message s'il n'y a aucun résultat", loop.empty || "", function (v) { setLoop("empty", v); }, { max: 160, disabled: dis, onChange: true }));
      box.appendChild(h("p", { class: "pb-hint", text: "Le contenu de cette grille est le MODÈLE d'un résultat : ajoutez-y un titre, une image, un bouton, puis utilisez { } pour y insérer le titre, l'image ou l'adresse du résultat. La page montre un exemplaire par résultat." }));
    }
    box.appendChild(h("p", { class: "pb-hint", text: "Colonnes pour l'écran « " + bpLabel(device) + " » ; une ligne = " + cols + " cellule(s). L'écart, le remplissage et l'alignement des cases se règlent dans Style › Mise en page." }));
    if (device === "desktop") box.appendChild(h("p", { class: "pb-hint", text: "Sur tablette, la grille passe d'elle-même à 2 colonnes au plus, et à 1 sur mobile — sauf si vous réglez ces écrans (icônes d'écran en haut)." }));
  }
  function advancedTab(items, box, locked) {
    var it = items[0];
    var single = items.length === 1;
    var b = function (label, fn, opts) { return h("button", Object.assign({ type: "button", class: "btn btn-outline btn-sm", onclick: fn }, opts || {}), label); };
    if (single) {
      var info = infoBlock(it);
      box.appendChild(info);
      box.appendChild(textField("Nom du calque", it.name, function (v) { rename(it.id, v); }, { max: 60, placeholder: inspectorFor(it).kind, onChange: true, disabled: !canWrite }));
      if (isNode(it)) box.appendChild(anchorField(it, locked));
      if (isNode(it)) box.appendChild(noteGroup(it, locked));
    }
    // Position et plan (propriétés avancées de placement), pour l'écran actif
    if (inspectorFor(it).groups) {
      var pos = styleSection(items, "position", SPEC.styleProps.filter(function (p) { return p.group === "position"; }).map(function (p) { return p.key; }));
      box.appendChild(pos);
    }
    if (single && it.type !== "component") box.appendChild(audienceField(it, locked));
    if (single && it.type !== "component") box.appendChild(screensField(it, locked));
    if (single && isNode(it)) { box.appendChild(motionField(it, locked)); fxSections(it, locked, box); box.appendChild(interactionField(it, locked)); box.appendChild(codeField(it, locked)); }
    if (items.length > 1) {
      box.appendChild(h("p", { class: "pb-sub", text: "Aligner (dans leur parent)" }));
      box.appendChild(h("div", { class: "pb-row pb-wrap" }, [["flex-start", "Début"], ["center", "Centre"], ["flex-end", "Fin"], ["stretch", "Étirer"]].map(function (a) { return b(a[1], function () { setStyle(selection.slice(), "alignSelf", a[0]); }, { disabled: !canWrite || locked }); }),
        b("Répartir", distribute, { disabled: !canWrite || locked })));
    }
    actionsAndComponent(items, box, locked, b);
  }
  // Actions sur l'élément (masquer, verrouiller, dupliquer, style, supprimer) et enregistrement comme composant
  function actionsAndComponent(items, box, locked, b) {
    var it = items[0];
    var single = items.length === 1;
    b = b || function (label, fn, opts) { return h("button", Object.assign({ type: "button", class: "btn btn-outline btn-sm", onclick: fn }, opts || {}), label); };
    box.appendChild(h("p", { class: "pb-sub", text: "Actions" }));
    box.appendChild(h("div", { class: "pb-row pb-wrap" },
      b(items.some(function (x) { return x.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !items.some(function (x) { return x.hidden; })); }, { disabled: !canWrite }),
      b(items.some(function (x) { return x.locked; }) ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !items.some(function (x) { return x.locked; })); }, { disabled: !canWrite }),
      b("Dupliquer", duplicateSelected, { disabled: !canWrite }),
      b("Copier le style", copyStyle),
      b("Coller le style", function () { pasteStyle(); }, { disabled: !canWrite || locked }),
      b("Réinitialiser le style", resetStyle, { disabled: !canWrite || locked || !items.some(function (x) { return x.styles || x.states || x.parts; }) }),
      items.length > 1 ? b("Grouper", groupSelected, { disabled: !canWrite || locked }) : null,
      single && ["group", "stack", "container"].indexOf(it.type) >= 0 ? b("Dissocier", ungroupSelected, { disabled: !canWrite || locked }) : null,
      b("Supprimer", removeSelected, { class: "btn btn-danger btn-sm", disabled: !canWrite || locked })));
    if (canWrite && !IS_COMPONENT && items.every(function (x) { return x.type !== "component"; })) {
      box.appendChild(h("p", { class: "pb-sub", text: "Composant réutilisable" }));
      box.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-comp-save": "", onclick: openSaveComponent }, "Enregistrer comme composant…"));
    }
  }
  // « Afficher sur » : écrans sur lesquels l'élément est visible (au moins un doit rester)
  function screensField(it, locked) {
    var box = h("div", { class: "pb-field" });
    var checks = h("div", { class: "pb-checks" });
    BPS.forEach(function (bp) {
      var cb = h("input", { type: "checkbox", disabled: locked });
      cb.checked = !(it.hideOn || []).includes(bp);
      cb.addEventListener("change", function () {
        var next = BPS.filter(function (x) { return x === bp ? !cb.checked : (it.hideOn || []).includes(x); });
        if (next.length === BPS.length) { cb.checked = true; toast("Il doit rester visible sur au moins un écran (sinon : « Masquer »).", true); return; }
        nextLabel = "Visibilité par écran";
        change(function () { var s = byId(it.id); if (next.length) s.hideOn = next; else delete s.hideOn; });
      });
      checks.appendChild(h("label", {}, cb, " " + bpLabel(bp)));
    });
    box.appendChild(h("p", { class: "pb-sub", text: "Afficher sur" }));
    box.appendChild(checks);
    return box;
  }
  // ID de l'élément (ancre d'un lien #…) : réellement présent dans la page publiée, validé et unique par le serveur
  function anchorField(it, locked) {
    return textField("Ancre (identifiant pour un lien #…)", it.anchor, function (v) { setAnchor(it.id, v); }, { max: 40, placeholder: "ex. tarifs", onChange: true, disabled: !canWrite || locked, hint: it.anchor ? "Lien vers cet élément : " + (PAGE.slug ? "/p/" + PAGE.slug : "") + "#" + it.anchor : "Lettres minuscules, chiffres et tirets. Permet un lien direct vers cet élément (menu, bouton « Voir les tarifs »…)." });
  }
  // ---------- Inspecteur d'un conteneur (Flexbox, Grille, Pile, Groupe, Colonnes) : Général / Style / Interactions ----------
  // Chaque champ lit et écrit le MÊME document que le reste de l'éditeur (setProp, rename, setAnchor, change) : annuler / rétablir,
  // enregistrement automatique, écrans, calques et rendu du canevas fonctionnent donc sans rien de plus. Un autre type d'élément
  // adopte ces onglets en déclarant « tabs: "box" » dans INSPECTORS.
  var LINKABLE = ["container", "grid", "stack", "group"];
  // Coque commune de TOUS les accordéons de l'inspecteur : un <details class="pb-acc"> dont l'état ouvert / fermé est mémorisé dans ce navigateur
  // (« open-<clé> »). Le comportement à l'ouverture (un seul ouvert, plusieurs, fermer en dessous) est donné par le moteur commun
  // (accordion-engine.js), qui agit sur tout <details class="pb-acc"> : rien à écrire ici pour un nouvel accordéon.
  function accShell(key, defOpen) {
    var det = h("details", { class: "pb-acc", "data-group": key });
    if (store.get("open-" + key, Boolean(defOpen))) det.open = true;
    det.addEventListener("toggle", function () { store.set("open-" + key, det.open); });
    return det;
  }
  // Groupe repliable de l'inspecteur (état ouvert mémorisé dans ce navigateur) ; count = réglages en place
  function accGroup(key, title, defOpen, build, count) {
    var det = accShell(key, defOpen);
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: title }), count ? h("span", { class: "pb-acc-count", "aria-label": count + " réglage(s) en place" }, String(count)) : null));
    var inner = h("div", { class: "pb-acc-body" });
    build(inner);
    det.appendChild(inner);
    return det;
  }
  // Contenu d'un groupe existant (déjà repliable) placé dans un autre groupe : sans double titre
  var bodyOf = function (det) { var b = det.querySelector(":scope > .pb-acc-body"); return b || det; };
  // Note privée de l'équipe sur un élément : visible seulement dans l'éditeur (jamais écrite dans la page publique)
  function noteGroup(it, locked) {
    return accGroup("g-note", "Note de l'équipe", Boolean(it.note), function (b) {
      b.appendChild(textField("Note privée sur cet élément", it.note || "", function (v) { change(function () { var s = byId(it.id); if (!s) return false; var n = String(v || "").trim().slice(0, 500); if ((s.note || "") === n) return false; if (n) s.note = n; else delete s.note; }); }, { multiline: true, rows: 3, max: 500, disabled: locked, onChange: true, hint: "Visible seulement dans l'éditeur (pastille dans la Structure). Jamais publiée sur le site." }));
    }, it.note ? 1 : 0);
  }
  function generalTab(it, box, locked) {
    var dis = !canWrite || locked;
    var p = it.props || {};
    box.appendChild(accGroup("g-settings", "Réglages", true, function (b) {
      b.appendChild(textField("Nom du calque", it.name, function (v) { rename(it.id, v); }, { max: 60, placeholder: inspectorFor(it).kind, onChange: true, disabled: !canWrite }));
      structureContent(it, b); // éléments à l'intérieur, colonnes ou grille, largeur, balise HTML
      if (LINKABLE.indexOf(it.type) >= 0) {
        b.appendChild(textField("Lien (toute la zone devient cliquable)", p.link, function (v) { setProp(it.id, "link", v.trim()); }, { list: "pb-links", onChange: true, disabled: dis, placeholder: "/catalogue, #ancre ou https://…", hint: "Impossible si la zone contient déjà un bouton ou un lien : un lien ne peut pas en contenir un autre." }));
        if (p.link) b.appendChild(checkField("Ouvrir le lien dans un nouvel onglet (adresses https:// seulement)", p.newTab, function (v) { setProp(it.id, "newTab", v); }, { disabled: dis }));
      }
    }, (it.name ? 1 : 0) + (p.link ? 1 : 0)));
    box.appendChild(accGroup("g-ident", "Identifiant et attributs", Boolean(it.anchor || (it.attrs || []).length), function (b) {
      b.appendChild(anchorField(it, locked));
      b.appendChild(bodyOf(codeField(it, locked, { onlyAttrs: true })));
    }, (it.anchor ? 1 : 0) + (it.attrs || []).length));
    box.appendChild(accGroup("g-display", "Conditions d'affichage", Boolean(it.audience || (it.hideOn || []).length), function (b) {
      b.appendChild(audienceField(it, locked));
      b.appendChild(screensField(it, locked));
    }, (it.audience ? 1 : 0) + ((it.hideOn || []).length ? 1 : 0)));
    box.appendChild(noteGroup(it, locked));
    box.appendChild(infoBlock(it));
    box.appendChild(accGroup("g-actions", "Actions", true, function (b) { actionsAndComponent([it], b, locked); }));
  }
  function interactionsTab(it, box, locked) {
    box.appendChild(motionField(it, locked));
    fxSections(it, locked, box);
    box.appendChild(interactionField(it, locked));
    // États : le style au survol / au clic se règle dans l'onglet Style (même moteur que l'état normal) ; raccourcis réels
    var schema = inspectorFor(it), states = Array.isArray(schema.states) ? SPEC.states.filter(function (st) { return schema.states.indexOf(st.key) >= 0; }) : schema.states ? SPEC.states : [];
    if (states.length) box.appendChild(accGroup("i-states", "États (survol, clic…)", Boolean(it.states && Object.keys(it.states).length), function (b) {
      b.appendChild(h("p", { class: "pb-hint", text: "Couleurs, ombre, transformation… propres à un état : réglées dans l'onglet Style, pour cet état." }));
      b.appendChild(h("div", { class: "pb-row pb-wrap" }, states.map(function (st) {
        var n = stateCount(it, st.key, null);
        return h("button", { type: "button", class: "btn btn-outline btn-sm", "data-state": st.key, onclick: function () { inspTab = "style"; store.set("insp-tab", inspTab); styleState = st.key; renderInspector(); renderContext(); forceStatePreview(); } }, "Régler : " + st.label + (n ? " (" + n + ", tous écrans)" : ""));
      })));
    }, it.states ? Object.keys(it.states).length : 0));
  }
  // Position et CSS personnalisé : à la suite des sections de l'onglet Style
  function boxStyleExtras(items, box, locked) {
    box.appendChild(styleSection(items, "position", SPEC.styleProps.filter(function (p) { return p.group === "position"; }).map(function (p) { return p.key; })));
    box.appendChild(codeField(items[0], locked, { noAttrs: true }));
  }
  // Sections avancées contextuelles (défilement, souris, épinglage, transformer, masque) : voir page-builder-effects.js
  function fxSections(it, locked, box) {
    if (!window.pbEffects) return;
    window.pbEffects.sections(it, locked).forEach(function (el) { box.appendChild(el); });
  }
  // Animation : entrée à l'apparition (durée, délai) et effet au survol ; rejouable dans le canevas
  function motionField(it, locked) {
    if (window.pbEffects && window.pbEffects.motion) return window.pbEffects.motion(it, locked); // moteur de mouvement (page-builder-effects.js)
    var m = it.motion || {};
    var setM = function (k, v) { nextLabel = "Animation"; change(function () { var x = byId(it.id); var n = Object.assign({}, x.motion); if (v === "" || v === undefined) delete n[k]; else n[k] = v; if (k === "entrance" && !v) { delete n.duration; delete n.delay; } if (k === "entrance" && v) { if (n.duration === undefined) n.duration = 600; if (n.delay === undefined) n.delay = 0; } if (Object.keys(n).length) x.motion = n; else delete x.motion; }); };
    var det = accShell("motion", Boolean(m.entrance || m.hover));
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: "Animation" }), m.entrance || m.hover ? h("span", { class: "pb-acc-count", text: String((m.entrance ? 1 : 0) + (m.hover ? 1 : 0)) }) : null));
    var inner = h("div", { class: "pb-acc-body" });
    inner.appendChild(selectField("À l'apparition", m.entrance || "", [["", "Aucune"]].concat(SPEC.entrances), function (v) { setM("entrance", v); }, { disabled: locked }));
    if (m.entrance) {
      inner.appendChild(h("div", { class: "pb-grid-2" },
        selectField("Durée", String(m.duration || 600), [["300", "Rapide"], ["600", "Normale"], ["900", "Lente"], ["1500", "Très lente"]], function (v) { setM("duration", Number(v)); }, { disabled: locked }),
        selectField("Délai", String(m.delay || 0), [["0", "Aucun"], ["150", "0,15 s"], ["300", "0,3 s"], ["600", "0,6 s"], ["1000", "1 s"]], function (v) { setM("delay", Number(v)); }, { disabled: locked })));
      inner.appendChild(selectField("Courbe", m.easing || "smooth", [["smooth", "Douce (par défaut)"], ["ease-out", "Ralentit à la fin"], ["ease-in", "Accélère"], ["ease-in-out", "Accélère puis ralentit"], ["linear", "Constante"], ["spring", "Ressort"]], function (v) { setM("easing", v === "smooth" ? "" : v); }, { disabled: locked }));
      inner.appendChild(checkField("Rejouer à chaque fois qu'il revient à l'écran", m.repeat, function (v) { setM("repeat", v ? true : ""); }, { disabled: locked }));
      inner.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { var el = canvasEl(it.id); if (!el) return; el.classList.remove("pb-anim-replay"); void el.offsetWidth; el.classList.add("pb-anim-replay"); setTimeout(function () { el.classList.remove("pb-anim-replay"); }, (m.duration || 600) + 100); } }, "Voir l'animation"));
    }
    inner.appendChild(selectField("Au survol", m.hover || "", [["", "Aucun effet"]].concat(SPEC.hovers), function (v) { setM("hover", v); }, { disabled: locked }));
    inner.appendChild(h("p", { class: "pb-hint", text: "Les animations ne jouent pas pour les personnes qui ont demandé à réduire les animations (réglage de leur appareil)." }));
    det.appendChild(inner);
    return det;
  }
  // Interactions : déclencheur sur cet élément → action sur un élément de la page ; état de départ ; programmation
  function interactionField(it, locked) {
    var list = it.interactions || [];
    var det = accShell("interactions", Boolean(list.length || it.startHidden || it.schedule));
    var n = list.length + (it.startHidden ? 1 : 0) + (it.schedule ? 1 : 0);
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: "Interactions et conditions" }), n ? h("span", { class: "pb-acc-count", text: String(n) }) : null));
    var inner = h("div", { class: "pb-acc-body" });
    var targets = [];
    walk(function (x) { if (isNode(x)) targets.push([x.id, nameOf(x)]); });
    var setList = function (fn) { nextLabel = "Interactions"; change(function () { var x = byId(it.id); var l = (x.interactions || []).slice(); fn(l); if (l.length) x.interactions = l; else delete x.interactions; }); };
    list.forEach(function (ix, i) {
      inner.appendChild(h("div", { class: "pb-repeat-item" },
        selectField("Quand", ix.trigger, SPEC.ixTriggers, function (v) { setList(function (l) { l[i] = Object.assign({}, l[i], { trigger: v }); }); }, { disabled: locked }),
        selectField("Faire", ix.action, SPEC.ixActions, function (v) { setList(function (l) { l[i] = Object.assign({}, l[i], { action: v }); }); }, { disabled: locked }),
        selectField("Sur l'élément", ix.target, targets, function (v) { setList(function (l) { l[i] = Object.assign({}, l[i], { target: v }); }); }, { disabled: locked }),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { setList(function (l) { l.splice(i, 1); }); } }, "Retirer")));
    });
    inner.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: locked || list.length >= 6 || targets.length < 2, onclick: function () {
      var other = targets.find(function (t) { return t[0] !== it.id; });
      setList(function (l) { l.push({ trigger: "click", action: "toggle", target: other ? other[0] : it.id }); });
    } }, "Ajouter une interaction"));
    inner.appendChild(checkField("Masqué au chargement (affiché par une interaction)", it.startHidden, function (v) { nextLabel = "État de départ"; change(function () { var x = byId(it.id); if (v) x.startHidden = true; else delete x.startHidden; }); }, { disabled: locked, hint: "Dans l'éditeur, il reste visible (contour pointillé)." }));
    var sc = it.schedule || {};
    var local = function (iso) { if (!iso) return ""; var d = new Date(iso); var pad = function (k) { return ("0" + k).slice(-2); }; return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()); };
    var setSc = function (k, v) { nextLabel = "Programmation"; change(function () { var x = byId(it.id); var s0 = Object.assign({}, x.schedule); if (v) s0[k] = new Date(v).toISOString(); else delete s0[k]; if (Object.keys(s0).length) x.schedule = s0; else delete x.schedule; }); };
    inner.appendChild(h("p", { class: "pb-sub", text: "Afficher seulement entre deux dates" }));
    inner.appendChild(h("div", { class: "pb-grid-2" },
      textField("À partir du", local(sc.from), function (v) { setSc("from", v); }, { type: "datetime-local", onChange: true, disabled: locked }),
      textField("Jusqu'au", local(sc.until), function (v) { setSc("until", v); }, { type: "datetime-local", onChange: true, disabled: locked })));
    // Jours et heures (heure de Paris) : l'élément n'est affiché que ces jours-là et dans cette plage horaire
    var setDays = function (d, on) { nextLabel = "Programmation"; change(function () { var x = byId(it.id); var s0 = Object.assign({}, x.schedule); var l = (s0.days || [1, 2, 3, 4, 5, 6, 7]).filter(function (z) { return z !== d; }); if (on) l.push(d); l.sort(); if (l.length >= 7 || !l.length) delete s0.days; else s0.days = l; if (Object.keys(s0).length) x.schedule = s0; else delete x.schedule; }); };
    inner.appendChild(h("p", { class: "pb-sub", text: "Afficher seulement certains jours (heure de Paris)" }));
    inner.appendChild(h("div", { class: "pb-row pb-wrap" }, [[1, "Lun"], [2, "Mar"], [3, "Mer"], [4, "Jeu"], [5, "Ven"], [6, "Sam"], [7, "Dim"]].map(function (d) {
      return checkField(d[1], !sc.days || sc.days.indexOf(d[0]) >= 0, function (v) { setDays(d[0], v); }, { disabled: locked });
    })));
    var setHours = function (k, v) { nextLabel = "Programmation"; change(function () { var x = byId(it.id); var s0 = Object.assign({}, x.schedule); var hh = Object.assign({}, s0.hours); if (v) hh[k] = v; else delete hh[k]; if (hh.from || hh.to) s0.hours = hh; else delete s0.hours; if (Object.keys(s0).length) x.schedule = s0; else delete x.schedule; }); };
    inner.appendChild(h("div", { class: "pb-grid-2" },
      textField("De (heure)", (sc.hours || {}).from || "", function (v) { setHours("from", v); }, { type: "time", onChange: true, disabled: locked }),
      textField("À (heure)", (sc.hours || {}).to || "", function (v) { setHours("to", v); }, { type: "time", onChange: true, disabled: locked })));
    inner.appendChild(h("p", { class: "pb-hint", text: "Renseignez les deux heures ; une plage qui passe minuit (22:00 → 06:00) est permise. L'heure est celle de Paris, évaluée à chaque affichage de la page." }));
    if (kidsOf(it)) {
      var bv = it.bgVideo ? it.bgVideo.src : "";
      inner.appendChild(textField("Vidéo de fond (fichier .mp4 ou .webm)", bv, function (v) { nextLabel = "Vidéo de fond"; change(function () { var x = byId(it.id); if (v.trim()) x.bgVideo = Object.assign({}, x.bgVideo, { src: v.trim() }); else delete x.bgVideo; }); }, { type: "url", onChange: true, disabled: locked, placeholder: "https://…/fond.mp4", hint: "Lue sans le son et en boucle derrière le contenu ; arrêtée pour les personnes qui réduisent les animations." }));
      if (it.bgVideo) {
        var setBv = function (k, v) { nextLabel = "Vidéo de fond"; change(function () { var x = byId(it.id); var b = Object.assign({}, x.bgVideo); if (v === null || v === "" || v === false) delete b[k]; else b[k] = v; x.bgVideo = b; }); };
        inner.appendChild(h("div", { class: "pb-grid-2" },
          numberField("Début (secondes)", it.bgVideo.start || "", { min: 1, max: 86399, step: 1, integer: true, disabled: locked }, function (n) { setBv("start", n); }),
          numberField("Fin (secondes)", it.bgVideo.end || "", { min: 2, max: 86400, step: 1, integer: true, disabled: locked }, function (n) { setBv("end", n); })));
        inner.appendChild(checkField("Lire une seule fois (sans boucle)", it.bgVideo.once, function (v) { setBv("once", v); }, { disabled: locked }));
        inner.appendChild(mediaPreview(it.bgVideo.poster, function (m) { setBv("poster", m.path); }, locked));
        inner.appendChild(h("p", { class: "pb-hint", text: "Image de secours : affichée si la vidéo ne peut pas se charger." }));
      }
    }
    det.appendChild(inner);
    return det;
  }
  // ---------- Classes globales du site : styles nommés, appliqués à tout élément qui porte le nom (modifier = tout est mis à jour) ----------
  var siteClasses = (PAGE.siteClasses || []).slice();
  function saveSiteClasses(list, done) {
    if (!PAGE.siteSettingsUrl) return Promise.reject(new Error("Cette page n'appartient à aucun site."));
    return api("GET", PAGE.siteSettingsUrl).then(function (r) {
      var next = Object.assign({}, r.settings, { classes: list });
      return api("PUT", PAGE.siteSettingsUrl, { revision: r.revision, tokens: r.tokens, settings: next });
    }).then(function (r) {
      siteClasses = (r.settings && r.settings.classes) || [];
      if (done) done();
      renderInspector();
      scheduleRender();
    }).catch(function (e) { toast(e.message, true); });
  }
  // Styles propres de l'élément (écrans et états), prêts à entrer dans une classe
  var classNames = function (it) { return String(it.classes || "").split(/\s+/).filter(Boolean); };
  function setNodeClasses(it, names, label, clearOwn) {
    change(function () { var x = byId(it.id); if (names.length) x.classes = names.join(" "); else delete x.classes; if (clearOwn) { delete x.styles; delete x.states; } }, { label: label });
  }
  // ---------- Style Studio : styles enregistrés = classes globales du site (liées : modifier le style met à jour tous ses éléments) ----------
  // Un style contient seulement les catégories / propriétés / écrans / états choisis. Deux modes d'application :
  //  • Compléter : le style est lié ; les réglages propres de l'élément gardent la priorité (rien n'est retiré).
  //  • Remplacer : le style est lié ET les réglages propres de l'élément, dans les catégories du style, sont retirés (le style prend ces catégories).
  // Dissocier : copie les valeurs du style dans l'élément (seulement là où il n'a rien) puis coupe le lien : apparence inchangée.
  var PRESET_CATS = SPEC.presetCategories || [];
  var COMPOSED_LABEL = { gradient: "Dégradé", overlay: "Voile", shadow: "Ombre", filter: "Filtres", backdrop: "Filtres de l'arrière-plan", transform: "Transformation", mask: "Masque" };
  var presetKeyLabel = function (k) { return (SP[k] && SP[k].label) || COMPOSED_LABEL[k] || k; };
  var presetCatOf = function (k) { for (var i = 0; i < PRESET_CATS.length; i++) if (PRESET_CATS[i].keys.indexOf(k) >= 0) return PRESET_CATS[i].id; return null; };
  var presetCatLabel = function (id) { var c = PRESET_CATS.filter(function (x) { return x.id === id; })[0]; return c ? c.label : id; };
  var presetScopeLabel = function (scope) { var pq = String(scope).split("@"), s = SPEC.states.filter(function (x) { return x.key === pq[0]; })[0]; return s ? "État : " + s.label + (pq[1] ? " (" + bpLabel(pq[1]).toLowerCase() + ")" : "") : bpLabel(scope); };
  var styleDef = function (name) { return siteClasses.filter(function (x) { return x.name === name; })[0] || null; };
  var styleTitle = function (c) { return c.label || c.name; };
  // Identifiant technique à partir du nom saisi (minuscules, tirets, sans accents, jamais un préfixe réservé)
  function slugifyStyle(label) {
    var s = String(label || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30).replace(/-+$/, "");
    if (!s) return "";
    if (!/^[a-z]/.test(s)) s = "s-" + s;
    if (/^(kw|lp|pb|mk)-/.test(s)) s = "s-" + s;
    return s.slice(0, 30).replace(/-+$/, "");
  }
  function presetKeysOf(def) {
    var out = {};
    ["styles", "states"].forEach(function (src) { Object.keys(def[src] || {}).forEach(function (s) { Object.keys(def[src][s]).forEach(function (k) { out[k] = true; }); }); });
    return out;
  }
  // Catégories d'un style : celles enregistrées, sinon déduites de ses propriétés (styles créés avant le Style Studio)
  function styleCats(def) {
    if (def.meta && def.meta.categories && def.meta.categories.length) return def.meta.categories;
    var seen = {}; Object.keys(presetKeysOf(def)).forEach(function (k) { var c = presetCatOf(k); if (c) seen[c] = true; });
    return PRESET_CATS.map(function (c) { return c.id; }).filter(function (id) { return seen[id]; });
  }
  function stylesOf(it) { return classNames(it).filter(function (n) { return styleDef(n); }); }
  function usersOfStyle(name) { var n = 0; walk(function (x) { if (isNode(x) && classNames(x).indexOf(name) >= 0) n++; }); return n; }
  // Propriétés propres de l'élément qui peuvent entrer dans un style : { styles|states : { écran|état : [clés] } }
  function presetOwn(it) {
    var out = { styles: {}, states: {} };
    ["styles", "states"].forEach(function (src) {
      Object.keys(it[src] || {}).forEach(function (scope) {
        var keys = Object.keys(it[src][scope] || {}).filter(function (k) { return presetCatOf(k); });
        if (keys.length) out[src][scope] = keys;
      });
    });
    return out;
  }
  // Copie filtrée (jamais l'original) : absent ≠ vide, valeurs copiées telles quelles
  function presetPick(it, keys, scopes) {
    var out = { styles: {}, states: {}, n: 0 };
    ["styles", "states"].forEach(function (src) {
      Object.keys(it[src] || {}).forEach(function (scope) {
        if (!scopes[scope]) return;
        var sub = {};
        Object.keys(it[src][scope] || {}).forEach(function (k) { if (keys[k]) { sub[k] = clone(it[src][scope][k]); out.n++; } });
        if (Object.keys(sub).length) out[src][scope] = sub;
      });
    });
    return out;
  }
  // Aperçu réel : les propriétés enregistrées appliquées à un échantillon (propriétés de taille / de position ignorées pour rester lisible)
  var SAMPLE_SKIP = /^(width|height|min|max|margin|padding|aspectRatio|objectFit|objectPosition|transform$|transformOrigin|lineClamp|transition|backgroundAttachment|backgroundPosition|backgroundSize|backgroundRepeat|mask$)/;
  function styleSample(def) {
    var el = h("span", { class: "pb-sp-sample", "aria-hidden": "true", text: "Aa" }), set = (def.styles && def.styles.desktop) || {};
    Object.keys(set).forEach(function (k) {
      var v = set[k];
      if (SAMPLE_SKIP.test(k)) return;
      try {
        if (k === "gradient" && v && v.from && v.to) el.style.backgroundImage = "linear-gradient(" + (Number(v.angle) || 180) + "deg," + v.from + "," + v.to + ")";
        else if (SP[k] && SP[k].css && typeof v !== "object") el.style.setProperty(SP[k].css, String(v));
      } catch (e) { /* valeur non affichable : ignorée */ }
    });
    return el;
  }
  // ----- Appliquer / dissocier / retirer (une seule étape d'annulation) -----
  function applyStyleTo(ids, name, mode) {
    var def = styleDef(name); if (!def) return;
    var cats = styleCats(def);
    change(function () {
      ids.forEach(function (id) {
        var x = byId(id); if (!x) return;
        var cl = classNames(x); if (cl.indexOf(name) < 0) cl.push(name); x.classes = cl.join(" ");
        if (mode !== "replace") return;
        ["styles", "states"].forEach(function (src) {
          Object.keys(x[src] || {}).forEach(function (scope) {
            Object.keys(x[src][scope]).forEach(function (k) { if (cats.indexOf(presetCatOf(k)) >= 0) delete x[src][scope][k]; });
            if (!Object.keys(x[src][scope]).length) delete x[src][scope];
          });
          if (x[src] && !Object.keys(x[src]).length) delete x[src];
        });
      });
    }, { label: "Style « " + styleTitle(def) + " » appliqué (" + (mode === "replace" ? "remplacement" : "complément") + ")" });
    var skipped = [];
    ids.forEach(function (id) { var x = byId(id); if (x && def.meta && def.meta.source && def.meta.source !== x.type) { var no = presetUnsupported(x, def); if (no.length) skipped.push(no.length); } });
    var all = Object.keys(presetKeysOf(def)).length;
    if (skipped.length) toast("Style « " + styleTitle(def) + " » : certains réglages (" + skipped[0] + " sur " + all + ") n'ont pas d'effet sur ce type d'élément.");
    else toast("Style « " + styleTitle(def) + " » appliqué.");
  }
  function unlinkStyleFrom(ids, name, copy) {
    var def = styleDef(name); if (!def) return;
    change(function () {
      ids.forEach(function (id) {
        var x = byId(id); if (!x) return;
        var cl = classNames(x).filter(function (n) { return n !== name; });
        if (copy) ["styles", "states"].forEach(function (src) {
          Object.keys(def[src] || {}).forEach(function (scope) {
            Object.keys(def[src][scope]).forEach(function (k) {
              x[src] = x[src] || {}; x[src][scope] = x[src][scope] || {};
              if (!Object.prototype.hasOwnProperty.call(x[src][scope], k)) x[src][scope][k] = clone(def[src][scope][k]);
            });
          });
        });
        if (cl.length) x.classes = cl.join(" "); else delete x.classes;
      });
    }, { label: copy ? "Dissocié du style « " + styleTitle(def) + " »" : "Style « " + styleTitle(def) + " » retiré" });
  }
  // ----- Points d'entrée communs (menus, barre flottante, palette) -----
  function saveStyleOf(it) {
    if (!it || !isNode(it)) { toast("Sélectionnez un widget ou un conteneur pour enregistrer son style.", true); return; }
    if (!PAGE.siteSettingsUrl) { toast("Les styles enregistrés appartiennent à un site : cette page n'en a pas.", true); return; }
    openStyleDialog(it);
  }
  var canSaveStyle = function (items) { return items.length === 1 && isNode(items[0]) && Boolean(PAGE.siteSettingsUrl) && Boolean(items[0].styles || items[0].states); };
  // ----- Enregistrer / redéfinir -----
  function openStyleDialog(it, redefineName) {
    var own = presetOwn(it), scopes = {}, keys = {}, byCat = {}, redef = redefineName ? styleDef(redefineName) : null;
    ["styles", "states"].forEach(function (src) { Object.keys(own[src]).forEach(function (scope) { scopes[scope] = true; own[src][scope].forEach(function (k) { keys[k] = true; (byCat[presetCatOf(k)] = byCat[presetCatOf(k)] || {})[k] = true; }); }); });
    var scopeList = Object.keys(scopes);
    if (!scopeList.length) { toast("Cet élément n'a aucun réglage propre à enregistrer : modifiez d'abord son style dans l'inspecteur.", true); return; }
    // Redéfinition : on part des catégories déjà contenues dans le style (le reste reste décoché)
    if (redef) { var rc = styleCats(redef); Object.keys(keys).forEach(function (k) { keys[k] = rc.indexOf(presetCatOf(k)) >= 0; }); if (!Object.keys(keys).some(function (k) { return keys[k]; })) Object.keys(keys).forEach(function (k) { keys[k] = true; }); }
    var cats = PRESET_CATS.filter(function (c) { return byCat[c.id]; });
    var dlg = h("dialog", { class: "pb-modal pb-sp", "aria-labelledby": "pb-sp-title", "data-pb-style-dialog": "" });
    var form = h("form", { class: "pb-sp-form", method: "dialog", novalidate: "" });
    var master = h("input", { type: "checkbox", "data-sp-all": "", "aria-label": "Tout sélectionner" }), summary = h("p", { class: "pb-sp-summary", "data-sp-summary": "", "aria-live": "polite" });
    var catBoxes = {}, keyBoxes = {}, catCounts = {}, sampleHost = h("div", { class: "pb-sp-sample-host" });
    var nameIn = h("input", { type: "text", class: "pb-input", maxlength: "60", placeholder: "Nom du style", "aria-label": "Nom du style", "data-sp-name": "", value: redef ? styleTitle(redef) : "", autocomplete: "off", disabled: redef ? true : null });
    var warn = h("p", { class: "pb-note is-warn", role: "alert", hidden: true, "data-sp-error": "" });
    var applyIn = h("input", { type: "checkbox", "data-sp-apply": "" }); applyIn.checked = true;
    var saveBtn = h("button", { type: "submit", class: "btn btn-primary", "data-sp-save": "" }, redef ? "Redéfinir le style" : "Enregistrer le style");
    var chosenKeys = function () { return Object.keys(keys).filter(function (k) { return keys[k]; }); };
    var chosenScopes = function () { return scopeList.filter(function (s) { return scopes[s]; }); };
    var slugNow = function () { return redef ? redef.name : slugifyStyle(nameIn.value); };
    function refresh() {
      var all = Object.keys(keys), on = chosenKeys();
      master.checked = on.length === all.length; master.indeterminate = on.length > 0 && on.length < all.length;
      cats.forEach(function (c) {
        var ks = Object.keys(byCat[c.id]), n = ks.filter(function (k) { return keys[k]; }).length;
        catBoxes[c.id].checked = n === ks.length; catBoxes[c.id].indeterminate = n > 0 && n < ks.length;
        catCounts[c.id].textContent = n + "/" + ks.length;
        ks.forEach(function (k) { keyBoxes[k].checked = Boolean(keys[k]); });
      });
      var p = presetPick(it, keys, scopes);
      summary.textContent = p.n ? p.n + " réglage" + (p.n > 1 ? "s" : "") + " seront enregistrés" + (scopeList.length > 1 ? " · " + chosenScopes().map(presetScopeLabel).join(", ") : "") + "." : "Rien n'est sélectionné.";
      sampleHost.textContent = ""; sampleHost.appendChild(styleSample(p));
      var slug = slugNow(), exists = !redef && slug && siteClasses.some(function (x) { return x.name === slug; });
      saveBtn.disabled = !p.n || !slug;
      if (!redef) saveBtn.textContent = exists ? "Remplacer le style" : "Enregistrer le style";
      if (exists) { warn.hidden = false; warn.textContent = "Le style « " + slug + " » existe déjà : il sera remplacé pour tous les éléments du site qui l'utilisent."; }
      else if (redef) { var n = usersOfStyle(redef.name); warn.hidden = false; warn.textContent = "Ce style est utilisé par " + n + " élément" + (n > 1 ? "s" : "") + " de cette page (et peut-être d'autres pages du site) : tous suivront la nouvelle définition. Leurs réglages propres sont conservés."; }
      else warn.hidden = true;
    }
    var setAll = function (v) { Object.keys(keys).forEach(function (k) { keys[k] = v; }); refresh(); };
    master.addEventListener("change", function () { setAll(master.checked); });
    form.appendChild(h("div", { class: "pb-modal-head" }, h("h2", { id: "pb-sp-title", text: redef ? "Redéfinir le style" : "Enregistrer comme style" }), h("span", { class: "pb-modal-spacer" }),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", "aria-label": "Fermer", onclick: function () { dlg.close(); } }, "×")));
    var body = h("div", { class: "pb-sp-body" });
    body.appendChild(h("p", { class: "pb-hint", text: "Source : " + ((inspectorFor(it) || {}).kind || it.type) + ". Cochez ce que le style doit contenir ; le texte, les images, les liens et la structure ne sont jamais copiés." }));
    body.appendChild(h("div", { class: "pb-sp-namerow" }, h("div", { class: "pb-field" }, h("label", { text: "Nom du style" }), nameIn), sampleHost));
    body.appendChild(h("div", { class: "pb-sp-bar" }, h("label", { class: "pb-check pb-sp-master" }, master, " Tout sélectionner"),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-sp-none": "", onclick: function () { setAll(false); } }, "Tout désélectionner")));
    var list = h("div", { class: "pb-sp-cats", role: "group", "aria-label": "Catégories à enregistrer" });
    cats.forEach(function (c) {
      var cb = h("input", { type: "checkbox", "data-sp-cat": c.id }); catBoxes[c.id] = cb;
      cb.addEventListener("change", function () { Object.keys(byCat[c.id]).forEach(function (k) { keys[k] = cb.checked; }); refresh(); });
      var det = h("details", { class: "pb-sp-cat" });
      var props = h("div", { class: "pb-sp-props" });
      Object.keys(byCat[c.id]).forEach(function (k) {
        var kb = h("input", { type: "checkbox", "data-sp-key": k }); keyBoxes[k] = kb;
        kb.addEventListener("change", function () { keys[k] = kb.checked; refresh(); });
        props.appendChild(h("label", { class: "pb-check" }, kb, " " + presetKeyLabel(k)));
      });
      det.appendChild(h("summary", {}, h("label", { class: "pb-check", onclick: function (e) { e.stopPropagation(); } }, cb, " " + c.label), (catCounts[c.id] = h("span", { class: "pb-sp-count" }))));
      det.appendChild(props);
      list.appendChild(det);
    });
    body.appendChild(list);
    if (scopeList.length > 1) {
      var sc = h("div", { class: "pb-sp-scopes", role: "group", "aria-label": "Écrans et états à enregistrer" }, h("span", { class: "pb-sub", text: "Écrans et états" }));
      scopeList.forEach(function (s) {
        var cb = h("input", { type: "checkbox", "data-sp-scope": s }); cb.checked = true;
        cb.addEventListener("change", function () { scopes[s] = cb.checked; refresh(); });
        sc.appendChild(h("label", { class: "pb-check" }, cb, " " + presetScopeLabel(s)));
      });
      body.appendChild(sc);
    }
    body.appendChild(h("p", { class: "pb-hint", text: "Portée : ce site (le style sert à toutes ses pages)." }));
    if (!redef) body.appendChild(h("label", { class: "pb-check" }, applyIn, " Appliquer à cet élément (ses réglages enregistrés passent dans le style, les autres restent)"));
    body.appendChild(summary); body.appendChild(warn);
    form.appendChild(body);
    form.appendChild(h("div", { class: "pb-sp-actions" }, h("button", { type: "button", class: "btn btn-outline", onclick: function () { dlg.close(); } }, "Annuler"), saveBtn));
    nameIn.addEventListener("input", refresh);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = slugNow(), label = nameIn.value.trim();
      if (!/^[a-z][a-z0-9-]{0,29}$/.test(name)) { warn.hidden = false; warn.textContent = "Donnez un nom au style (lettres, chiffres, tirets)."; nameIn.focus(); return; }
      var p = presetPick(it, keys, scopes);
      if (!p.n) return;
      var picked = chosenKeys(), catIds = PRESET_CATS.filter(function (c) { return picked.some(function (k) { return byCat[c.id] && byCat[c.id][k]; }); }).map(function (c) { return c.id; });
      var prev = styleDef(name), def = { name: name, meta: { source: it.type, categories: catIds, updated: new Date().toISOString().slice(0, 10) } };
      if (label && label !== name) def.label = label.slice(0, 60);
      if (redef && redef.label) def.label = redef.label;
      if (Object.keys(p.styles).length) def.styles = p.styles;
      if (Object.keys(p.states).length) def.states = p.states;
      var next = siteClasses.map(clone), at = -1; next.forEach(function (x, i) { if (x.name === name) at = i; });
      if (at >= 0) next[at] = def; else next.push(def);
      saveBtn.disabled = true;
      saveSiteClasses(next, function () {
        if (applyIn.checked && !redef) change(function () {
          var x = byId(it.id), cl = classNames(x);
          if (cl.indexOf(name) < 0) cl.push(name);
          x.classes = cl.join(" ");
          ["styles", "states"].forEach(function (src) {
            Object.keys(p[src]).forEach(function (scope) {
              Object.keys(p[src][scope]).forEach(function (k) { delete x[src][scope][k]; });
              if (!Object.keys(x[src][scope]).length) delete x[src][scope];
            });
            if (x[src] && !Object.keys(x[src]).length) delete x[src];
          });
        }, { label: "Style « " + (def.label || name) + " » enregistré et appliqué" });
        toast("Style « " + (def.label || name) + " » " + (redef ? "redéfini" : prev ? "remplacé" : "enregistré") + " (" + p.n + " réglage" + (p.n > 1 ? "s" : "") + ").");
        dlg.close();
        if (libraryPaint) libraryPaint();
      });
      setTimeout(function () { if (dlg.open) saveBtn.disabled = false; }, 4000);
    });
    dlg.appendChild(form);
    dlg.addEventListener("close", function () { dlg.remove(); });
    document.body.appendChild(dlg);
    refresh();
    dlg.showModal();
    (redef ? saveBtn : nameIn).focus();
  }
  // Compatibilité : réglages d'un style que le type de l'élément cible ne propose pas (écrits mais sans effet sur lui)
  function presetUnsupported(it, def) {
    var schema = inspectorFor(it), g = schema && schema.groups;
    if (!g) return Object.keys(presetKeysOf(def));
    var offered = function (k) { var gr = k === "backgroundColor" ? "background" : (SP[k] && SP[k].group) || (({ gradient: "background", overlay: "background", shadow: "effects", filter: "effects", backdrop: "effects", transform: "position", mask: "mask" })[k]); var spec = gr && g[gr]; return spec === true || (Array.isArray(spec) && spec.indexOf(k) >= 0) || (k === "color" && g.typography !== undefined); };
    return Object.keys(presetKeysOf(def)).filter(function (k) { return !offered(k); });
  }
  // ----- Bibliothèque des styles du site -----
  var libraryPaint = null;
  function openStyleLibrary() {
    if (!PAGE.siteSettingsUrl) { toast("Les styles enregistrés appartiennent à un site : cette page n'en a pas.", true); return; }
    var dlg = h("dialog", { class: "pb-modal pb-sp pb-sl", "aria-labelledby": "pb-sl-title", "data-pb-style-library": "" });
    var mode = store.get("style-mode", "complete") === "replace" ? "replace" : "complete";
    var q = "", cat = "";
    var search = h("input", { type: "search", class: "pb-input", placeholder: "Rechercher un style", "aria-label": "Rechercher un style", "data-sl-search": "" });
    var catSel = h("select", { class: "pb-prop-select", "aria-label": "Filtrer par catégorie", "data-sl-cat": "" }, h("option", { value: "", text: "Toutes les catégories" }), PRESET_CATS.map(function (c) { return h("option", { value: c.id, text: c.label }); }));
    var modeHint = h("p", { class: "pb-hint", "data-sl-hint": "" });
    var seg = h("div", { class: "pb-seg", role: "radiogroup", "aria-label": "Mode d'application" });
    var listEl = h("div", { class: "pb-sl-list", "data-sl-list": "" });
    var HINT = { complete: "Compléter : le style s'ajoute ; les réglages propres de l'élément restent prioritaires et rien n'est retiré.", replace: "Remplacer : les réglages propres de l'élément, dans les catégories du style, sont retirés ; le style les remplace." };
    function paintMode() {
      seg.textContent = "";
      [["complete", "Compléter"], ["replace", "Remplacer"]].forEach(function (m) {
        seg.appendChild(h("button", { type: "button", role: "radio", "aria-checked": String(mode === m[0]), "data-sl-mode": m[0], onclick: function () { mode = m[0]; store.set("style-mode", mode); paintMode(); } }, m[1]));
      });
      modeHint.textContent = HINT[mode];
    }
    function targets() { return selectedItems().filter(function (x) { return isNode(x) && !lockedDeep(x.id); }); }
    function paint() {
      listEl.textContent = "";
      var sel = selectedItems(), one = sel.length === 1 && isNode(sel[0]) ? sel[0] : null, used = one ? stylesOf(one) : [], tg = targets();
      var rows = siteClasses.filter(function (c) {
        var text = (styleTitle(c) + " " + c.name).toLowerCase();
        return (!q || text.indexOf(q) >= 0) && (!cat || styleCats(c).indexOf(cat) >= 0);
      });
      if (!rows.length) listEl.appendChild(h("p", { class: "pb-hint", text: siteClasses.length ? "Aucun style ne correspond." : "Aucun style enregistré. Réglez un élément dans l'inspecteur, puis « Enregistrer comme style… »." }));
      rows.forEach(function (c) {
        var cl = styleCats(c), n = usersOfStyle(c.name), on = used.indexOf(c.name) >= 0;
        var act = function (label, fn, dis, attrs) { return h("button", Object.assign({ type: "button", class: "btn btn-ghost btn-sm", disabled: dis || null, onclick: fn }, attrs || {}), label); };
        listEl.appendChild(h("div", { class: "pb-sl-row" + (on ? " is-on" : ""), "data-style": c.name },
          styleSample(c),
          h("div", { class: "pb-sl-main" }, h("strong", { text: styleTitle(c) }), on ? h("span", { class: "pb-blk-badge", text: "Appliqué" }) : null,
            h("small", { text: (cl.map(presetCatLabel).join(" · ") || "—") + " · " + n + " élément" + (n > 1 ? "s" : "") + " ici" })),
          h("button", { type: "button", class: "btn btn-outline btn-sm", "data-sl-apply": c.name, disabled: !canWrite || !tg.length, "data-tip": !tg.length ? "Sélectionnez d'abord un élément (non verrouillé) dans le canevas" : null, onclick: function () { applyStyleTo(tg.map(function (x) { return x.id; }), c.name, mode); paint(); } }, "Appliquer"),
          h("details", { class: "pb-sl-more" }, h("summary", { "aria-label": "Autres actions pour " + styleTitle(c), text: "⋯" }),
            h("div", { class: "pb-sl-menu" },
              act("Renommer", function () {
                ask("Renommer le style", [["label", "text", "Nom du style"]], function (v) {
                  var next = siteClasses.map(clone); next.forEach(function (x) { if (x.name === c.name) { if (v.label) x.label = v.label.slice(0, 60); else delete x.label; } });
                  saveSiteClasses(next, paint);
                });
                var f = $("[data-pb-ask-fields] [name=label]"); if (f) { f.value = styleTitle(c); f.select(); }
              }, !canWrite, { "data-sl-rename": c.name }),
              act("Dupliquer", function () {
                var base = c.name.slice(0, 24) + "-copie", nm = base, i = 2;
                while (styleDef(nm)) nm = base.slice(0, 27) + "-" + (i++);
                var copy = clone(c); copy.name = nm; copy.label = (styleTitle(c) + " (copie)").slice(0, 60);
                saveSiteClasses(siteClasses.map(clone).concat([copy]), paint);
              }, !canWrite, { "data-sl-dup": c.name }),
              act("Redéfinir depuis la sélection", function () { dlg.close(); openStyleDialog(one, c.name); }, !canWrite || !one || !canSaveStyle([one]), { "data-sl-redefine": c.name }),
              act("Supprimer", function () {
                var msg = n ? n + " élément" + (n > 1 ? "s" : "") + " de cette page " + (n > 1 ? "utilisent" : "utilise") + " ce style : ils seront dissociés et garderont leur apparence. Les autres pages du site qui l'utilisent la perdront. Supprimer « " + styleTitle(c) + " » ?" : "Supprimer le style « " + styleTitle(c) + " » du site ? Les autres pages qui l'utilisent perdront son apparence.";
                if (!window.confirm(msg)) return;
                var ids = []; walk(function (x) { if (isNode(x) && classNames(x).indexOf(c.name) >= 0) ids.push(x.id); });
                if (ids.length) unlinkStyleFrom(ids, c.name, true);
                saveSiteClasses(siteClasses.filter(function (x) { return x.name !== c.name; }), function () { toast("Style supprimé."); paint(); });
              }, !canWrite, { "data-sl-delete": c.name })))));
      });
    }
    search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); paint(); });
    catSel.addEventListener("change", function () { cat = catSel.value; paint(); });
    paintMode();
    var form = h("div", { class: "pb-sp-form" },
      h("div", { class: "pb-modal-head" }, h("h2", { id: "pb-sl-title", text: "Styles du site" }), h("span", { class: "pb-modal-spacer" }),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", "aria-label": "Fermer", onclick: function () { dlg.close(); } }, "×")),
      h("div", { class: "pb-sp-body" },
        h("div", { class: "pb-sl-tools" }, search, catSel),
        h("div", { class: "pb-sl-mode" }, h("span", { class: "pb-sub", text: "Appliquer en mode" }), seg), modeHint,
        listEl),
      h("div", { class: "pb-sp-actions" },
        h("button", { type: "button", class: "btn btn-outline", "data-sl-new": "", disabled: !canWrite, onclick: function () { var s = selectedItems(); if (s.length === 1 && canSaveStyle(s)) { dlg.close(); saveStyleOf(s[0]); } else toast("Sélectionnez un élément qui a des réglages propres pour enregistrer son style.", true); } }, "Enregistrer la sélection comme style…"),
        h("button", { type: "button", class: "btn btn-primary", onclick: function () { dlg.close(); } }, "Fermer")));
    dlg.appendChild(form);
    dlg.addEventListener("close", function () { libraryPaint = null; dlg.remove(); });
    document.body.appendChild(dlg);
    libraryPaint = paint;
    paint();
    dlg.showModal();
    search.focus();
  }
  function globalClassesBlock(it, locked) {
    var box = h("div", { class: "pb-global-classes" });
    box.appendChild(h("p", { class: "pb-sub", text: "Classes globales du site" }));
    var names = classNames(it);
    if (!siteClasses.length) box.appendChild(h("p", { class: "pb-hint", text: "Aucune classe globale. Réglez le style de cet élément, puis « Enregistrer comme style » : les autres éléments pourront le réutiliser, et le modifier mettra tout à jour." }));
    siteClasses.forEach(function (c) {
      var on = names.indexOf(c.name) >= 0;
      var cb = h("input", { type: "checkbox", disabled: locked || null });
      cb.checked = on;
      cb.addEventListener("change", function () {
        setNodeClasses(it, cb.checked ? names.concat([c.name]) : names.filter(function (n) { return n !== c.name; }), cb.checked ? "Classe « " + c.name + " » appliquée" : "Classe « " + c.name + " » retirée", false);
        if (cb.checked && c.meta && c.meta.source && c.meta.source !== it.type) {
          var no = presetUnsupported(it, c), all = Object.keys(presetKeysOf(c)).length;
          if (no.length) toast("Style « " + c.name + " » : " + (all - no.length) + " réglage" + (all - no.length > 1 ? "s" : "") + " sur " + all + " s'appliquent à ce type d'élément (sans effet : " + no.slice(0, 4).map(presetKeyLabel).join(", ") + (no.length > 4 ? "…" : "") + ").");
        }
      });
      box.appendChild(h("div", { class: "pb-gclass-row" },
        h("label", { class: "pb-check" }, cb, " " + (c.label || "." + c.name)),
        on ? h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked || !(it.styles || it.states), "data-tip": "Remplace le contenu du style par les réglages que vous choisissez parmi ceux de cet élément (tous les éléments qui l'utilisent suivent)", onclick: function () { openStyleDialog(it, c.name); } }, "Mettre à jour le style") : null,
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, "aria-label": "Supprimer la classe " + c.name,
          onclick: function () { if (!window.confirm("Supprimer la classe « " + c.name + " » du site ? Les éléments qui la portent perdent son style.")) return; saveSiteClasses(siteClasses.filter(function (x) { return x.name !== c.name; }), function () { toast("Classe supprimée."); }); } }, "Supprimer")));
    });
    box.appendChild(h("div", { class: "pb-gclass-new" }, h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-save-style": "", disabled: locked || !PAGE.siteSettingsUrl || !(it.styles || it.states), "data-tip": "Choisissez les catégories de réglages de cet élément à enregistrer comme style réutilisable", onclick: function () { openStyleDialog(it); } }, "Enregistrer comme style…"), h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-pb-style-library-open": "", onclick: openStyleLibrary }, "Bibliothèque")));
    if (!PAGE.siteSettingsUrl) box.appendChild(h("p", { class: "pb-hint", text: "Les classes globales appartiennent à un site : cette page n'en a pas." }));
    else box.appendChild(classesTransfer(locked));
    return box;
  }
  // Export / import des classes globales seules (fichier .json) : l'import passe par l'enregistrement normal des réglages du site, donc par la même validation
  function classesTransfer(locked) {
    var file = h("input", { type: "file", accept: "application/json,.json", hidden: "", "data-pb-classes-import": "" });
    file.addEventListener("change", function () {
      var f = file.files && file.files[0]; file.value = "";
      if (!f) return;
      if (f.size > 1048576) { toast("Fichier trop volumineux (1 Mo au plus).", true); return; }
      f.text().then(function (txt) {
        var data; try { data = JSON.parse(txt); } catch (e) { toast("Ce fichier n'est pas un export de classes valide.", true); return; }
        var list = Array.isArray(data) ? data : data && Array.isArray(data.classes) ? data.classes : null;
        if (!list || !list.length) { toast("Aucune classe trouvée dans ce fichier.", true); return; }
        var byName = {}; siteClasses.forEach(function (c) { byName[c.name] = c; });
        var added = 0, replaced = 0;
        list.forEach(function (c) { if (c && typeof c.name === "string") { if (byName[c.name]) replaced++; else added++; byName[c.name] = c; } });
        if (!added && !replaced) { toast("Aucune classe trouvée dans ce fichier.", true); return; }
        saveSiteClasses(Object.keys(byName).map(function (k) { return byName[k]; }), function () { toast("Classes importées : " + added + " ajoutée" + (added > 1 ? "s" : "") + ", " + replaced + " remplacée" + (replaced > 1 ? "s" : "") + "."); });
      });
    });
    return h("div", { class: "pb-gclass-transfer" },
      h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-pb-classes-export": "", disabled: !siteClasses.length, onclick: function () {
        var blob = new Blob([JSON.stringify({ kolakisa: "classes", version: 1, classes: siteClasses }, null, 2)], { type: "application/json" });
        var a = h("a", { href: URL.createObjectURL(blob), download: "classes-globales.json" }); document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
        toast(siteClasses.length + " classe" + (siteClasses.length > 1 ? "s exportées" : " exportée") + ".");
      } }, "Exporter les classes"),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked || !canWrite, onclick: function () { file.click(); } }, "Importer des classes"), file);
  }
  // Code : CSS propre à l'élément, classes et attributs (vérifiés à l'enregistrement : aucune ressource externe)
  function codeField(it, locked, opts) {
    opts = opts || {};
    var det = null;
    var n = (opts.onlyAttrs ? 0 : (it.css ? 1 : 0) + (it.cssHover ? 1 : 0) + (it.classes ? 1 : 0)) + (opts.noAttrs ? 0 : (it.attrs ? it.attrs.length : 0));
    det = accShell("code", Boolean(n));
    det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: opts.onlyAttrs ? "Attributs HTML" : opts.noAttrs ? "CSS personnalisé et classes" : "CSS, classes et attributs" }), n ? h("span", { class: "pb-acc-count", text: String(n) }) : null));
    var inner = h("div", { class: "pb-acc-body" });
    if (!opts.onlyAttrs) {
    var put = function (k) { return function (v) { nextLabel = { css: "CSS de l'élément", cssHover: "CSS au survol", classes: "Classes" }[k] || "Code"; change(function () { var x = byId(it.id); if (String(v).trim()) x[k] = String(v).trim(); else delete x[k]; }); }; };
    inner.appendChild(textField("CSS de l'élément (déclarations)", it.css, put("css"), { multiline: true, rows: "4", onChange: true, max: 2000, disabled: locked, placeholder: "letter-spacing: .02em;\nbackground-color: #f3f8fc;", hint: "Appliqué à cet élément seulement, après les réglages de l'inspecteur. Pas d'url(), d'@, de \\ ni de < >." }));
    inner.appendChild(textField("CSS au survol", it.cssHover, put("cssHover"), { multiline: true, rows: "2", onChange: true, max: 2000, disabled: locked, placeholder: "transform: translateY(-2px);" }));
    inner.appendChild(textField("Classes", it.classes, put("classes"), { onChange: true, max: 300, disabled: locked, placeholder: "carte-mise-en-avant", hint: "À cibler dans le CSS de la page (onglet Page). Préfixes kw-, lp-, pb-, mk- réservés." }));
    if (PAGE.siteSettingsUrl || siteClasses.length) inner.appendChild(globalClassesBlock(it, locked));
    }
    if (!opts.noAttrs) {
    var attrs = it.attrs || [];
    var setAttrs = function (fn) { nextLabel = "Attributs"; change(function () { var x = byId(it.id); var l = (x.attrs || []).slice(); fn(l); if (l.length) x.attrs = l; else delete x.attrs; }); };
    inner.appendChild(h("p", { class: "pb-sub", text: "Attributs (data-…, aria-…, title, role, lang)" }));
    attrs.forEach(function (a, i) {
      inner.appendChild(h("div", { class: "pb-repeat-item" }, h("div", { class: "pb-grid-2" },
        textField("Nom", a.name, function (v) { setAttrs(function (l) { l[i] = { name: v.trim().toLowerCase(), value: l[i].value }; }); }, { onChange: true, max: 41, disabled: locked }),
        textField("Valeur", a.value, function (v) { setAttrs(function (l) { l[i] = { name: l[i].name, value: v }; }); }, { onChange: true, max: 200, disabled: locked })),
        h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { setAttrs(function (l) { l.splice(i, 1); }); } }, "Retirer")));
    });
    inner.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: locked || attrs.length >= 10, onclick: function () { setAttrs(function (l) { l.push({ name: "data-suivi", value: "" }); }); } }, "Ajouter un attribut"));
    }
    det.appendChild(inner);
    return det;
  }
  // Personnalisation : à qui s'affiche cet élément (évalué sur la page publique avec ce que le site sait du visiteur)
  function audienceField(it, locked) {
    var wrap = h("div", { class: "pb-field" });
    var a = it.audience || {};
    var needsValue = function (w) { return w === "tag" || w === "not_tag" || w === "score_min" || w === "param"; };
    var holder = function (w) { return w === "score_min" ? "Score minimal" : w === "param" ? "clé ou clé=valeur (ex. campagne=printemps)" : "Nom de l'étiquette"; };
    // Une ligne « condition » (liste + valeur éventuelle). get() lit la condition actuelle ; put(cond) l'enregistre (null = retirer).
    function condRow(label, cond, put, removable) {
      var id = fid(), c = cond || {};
      var sel = h("select", { id: id, disabled: locked }, [h("option", { value: "", text: removable ? "— choisir —" : "Tout le monde" })].concat(SPEC.audiences.map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
      sel.value = c.who || "";
      var val = h("input", { type: c.who === "score_min" ? "number" : "text", min: "0", step: "1", maxlength: "60", placeholder: holder(c.who), value: c.value === undefined ? "" : String(c.value), disabled: locked, "aria-label": "Valeur de la condition" });
      val.hidden = !needsValue(c.who);
      var apply = function () {
        var who = sel.value;
        val.hidden = !needsValue(who); val.type = who === "score_min" ? "number" : "text"; val.placeholder = holder(who);
        if (needsValue(who) && val.value.trim() === "") { val.focus(); return; }
        put(!who ? null : needsValue(who) ? { who: who, value: who === "score_min" ? Number(val.value) : val.value.trim() } : { who: who });
      };
      sel.addEventListener("change", apply); val.addEventListener("change", apply);
      var row = h("div", { class: "pb-field" }, h("label", { for: id, text: label }), sel, val);
      if (removable) row.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked, onclick: function () { put(null); } }, "Retirer cette condition"));
      return row;
    }
    // Écrit l'ensemble { who, value, and, or } après modification par fn(copie)
    var edit = function (fn) { change(function () { var x = byId(it.id), cur = JSON.parse(JSON.stringify(x.audience || {})); fn(cur); if (!cur.who) delete x.audience; else { if (cur.and && !cur.and.length) delete cur.and; if (cur.or && !cur.or.length) delete cur.or; x.audience = cur; } }); };
    wrap.appendChild(h("p", { class: "pb-sub", text: "Personnalisation" }));
    wrap.appendChild(condRow("Afficher à", a.who ? { who: a.who, value: a.value } : null, function (c) {
      edit(function (cur) { if (!c) { for (var k in cur) delete cur[k]; } else { cur.who = c.who; if (c.value !== undefined) cur.value = c.value; else delete cur.value; } });
    }, false));
    if (a.who) {
      (a.and || []).forEach(function (c, i) {
        wrap.appendChild(condRow("ET", c, function (nc) { edit(function (cur) { if (nc) cur.and[i] = nc; else cur.and.splice(i, 1); }); }, true));
      });
      wrap.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: locked || (a.and || []).length >= 3, onclick: function () { edit(function (cur) { cur.and = (cur.and || []).concat([{ who: "known" }]); }); } }, "Ajouter une condition (ET)"));
      (a.or || []).forEach(function (g, gi) {
        wrap.appendChild(condRow("OU bien (groupe " + (gi + 2) + ")", { who: g.who, value: g.value }, function (nc) { edit(function (cur) { if (nc) { cur.or[gi].who = nc.who; if (nc.value !== undefined) cur.or[gi].value = nc.value; else delete cur.or[gi].value; } else cur.or.splice(gi, 1); }); }, true));
        (g.and || []).forEach(function (c, i) {
          wrap.appendChild(condRow("ET (groupe " + (gi + 2) + ")", c, function (nc) { edit(function (cur) { var l = cur.or[gi].and; if (nc) l[i] = nc; else l.splice(i, 1); if (!l.length) delete cur.or[gi].and; }); }, true));
        });
        wrap.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: locked || (g.and || []).length >= 3, onclick: function () { edit(function (cur) { cur.or[gi].and = (cur.or[gi].and || []).concat([{ who: "known" }]); }); } }, "Ajouter une condition (ET) au groupe " + (gi + 2)));
      });
      wrap.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: locked || (a.or || []).length >= 3, onclick: function () { edit(function (cur) { cur.or = (cur.or || []).concat([{ who: "known" }]); }); } }, "Ajouter un autre groupe (OU)"));
      wrap.appendChild(h("p", { class: "pb-hint", text: "Les conditions d'un même groupe s'additionnent (ET) ; l'élément s'affiche si l'un des groupes est satisfait (OU)." }));
    }
    wrap.appendChild(h("p", { class: "pb-hint", text: "Selon ce que le site sait réellement du visiteur : son compte s'il est connecté, ou le contact relié à son navigateur (cookies acceptés). Un visiteur inconnu ne voit que ce qui s'adresse à tout le monde ou aux inconnus." }));
    return wrap;
  }
  // Répartir : le parent commun répartit l'espace entre ses enfants (flex, espacés)
  function distribute() {
    var ls = selection.map(function (id) { return locate(id); }).filter(Boolean);
    var parent = ls[0] && ls[0].parent;
    if (!parent || !ls.every(function (l) { return l.parent === parent; })) { toast("Répartir : choisissez des éléments du même parent.", true); return; }
    if (lockedDeep(parent.id)) { toast("Parent verrouillé.", true); return; }
    change(function () { var s = styleSet(parent, device, "normal", true); s.display = "flex"; s.justifyContent = "space-between"; if (!s.flexDirection) s.flexDirection = parent.type === "columns" ? "row" : "column"; cleanStyles(parent); });
  }
  // Composant synchronisé : sa source se modifie ici, pour TOUTES les pages qui l'affichent
  var compSaveTimer = null;
  // Instance liée : on ne modifie pas son contenu ici (il vient du composant principal) ; on peut l'ouvrir, la détacher, voir ses pages
  function componentInspector(box, s) {
    var c = components.find(function (x) { return x.id === s.componentId; });
    box.appendChild(h("p", { class: "pb-note", "data-comp-linked": "", text: "Instance liée au composant global « " + (c ? c.name : "?") + " » : son contenu vient du composant principal. Une mise à jour du composant principal s'y applique après « Mettre à jour »." }));
    var row = h("div", { class: "pb-row pb-wrap" });
    row.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !c, "data-comp-main": "", onclick: function () { if (c) openComponentEditor(c); } }, "Accéder au composant principal"));
    if (canWrite) row.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-comp-detach": "", "data-tip": "Remplace cette instance par un bloc indépendant, sans lien avec le composant", onclick: function () { detachInstance(s); } }, "Détacher du composant"));
    box.appendChild(row);
    box.appendChild(h("p", { class: "pb-hint", text: "« Modifier cette instance » = la détacher : le bloc devient alors entièrement modifiable ici, sans toucher au composant." }));
  }

  // ---------- Barre contextuelle (selon la sélection) ----------
  function ctxSelect(label, key, items, options) {
    var p = SP[key];
    var own = ownValue(items[0], key);
    if (key === "fontFamily" && window.KFonts) {
      var kf = window.KFonts.picker({ value: own === undefined ? "" : String(own), legacy: p.options.map(function (o) { return [o[0], o[1]]; }), emptyLabel: "Police par défaut", disabled: lockedAny(items), label: label || "Police", onChange: function (v) { setStyle(idsOf(items), key, v); } });
      kf.classList.add("kf-ctx"); kf.setAttribute("data-tip", label || p.label);
      return kf;
    }
    var sel = h("select", { "aria-label": label || p.label, "data-tip": label || p.label, disabled: lockedAny(items) }, [h("option", { value: "", text: label || p.label })].concat((options || p.options).map(function (o) { return h("option", { value: o[0], text: o[1] }); })));
    sel.value = own === undefined ? "" : String(own);
    // Valeur vide : le libellé de la commande sert de repère (sans « … »), grisé ; valeur choisie : texte normal
    var markEmpty = function () { sel.classList.toggle("is-empty", !sel.value); };
    markEmpty();
    sel.addEventListener("change", function () { markEmpty(); setStyle(idsOf(items), key, key === "columns" && sel.value ? Number(sel.value) : sel.value); });
    return sel;
  }
  // Case compacte de la barre contextuelle : même NumericControl (flèches ↑↓, unité tapée avec le nombre, bornes du serveur)
  function ctxLength(label, key, items, width, short) {
    var it = items[0], own = ownValue(it, key), inh = inheritedValue(it, key), dis = lockedAny(items);
    var isNum = SP[key].kind === "number", cfg = (isNum ? NUMCFG[key] : LENCFG[key]) || {};
    var commonOpts = { label: label, ariaLabel: label, tip: label, inputClass: "pb-ctx-num", cellClass: "pb-ctx-cell", hideSteps: true, disabled: dis, drag: false, allowEmpty: true };
    var wrap;
    if (isNum) {
      var lim = NUM[key] || [-9999, 9999, 1];
      wrap = numericControl(Object.assign({ inlineUnit: true, min: lim[0], max: lim[1], step: lim[2], value: own === undefined ? "" : own, placeholder: inh !== undefined ? inh : (short || label), base: cfg.base, onCommit: function (raw, u, opts) { setStyle(idsOf(items), key, raw === "" ? "" : Number(raw), opts); } }, commonOpts, { slider: null, staticUnit: null }));
    } else {
      var units = unitsOf(key), cur = splitLen(own), base = splitLen(inh);
      var disp = function (p) { return !p ? "" : p.unit === "auto" ? "auto" : p.unit === "px" ? p.num : p.num + p.unit; };
      wrap = numericControl(Object.assign({ inlineUnit: true, units: units, unit: (cur || base || { unit: units[0] }).unit === "auto" ? "px" : (cur || base || { unit: units[0] }).unit, step: STEP_REL, min: isSigned(key) ? -9999 : 0, max: 9999, base: 0, value: disp(cur), placeholder: base ? disp(base) : (short || label),
        onCommit: function (raw, u, opts) {
          var v = u === "auto" ? "auto" : raw === "" ? "" : Number(raw) === 0 ? "0" : raw + u;
          if (parseLength(v, key) === null) { toast(label + " : valeur invalide.", true); return false; }
          setStyle(idsOf(items), key, v, opts);
        } }, cfg, commonOpts, { slider: null }));
    }
    wrap.style.width = (width || 64) + "px";
    return wrap;
  }
  function ctxColor(label, key, items) {
    var own = ownValue(items[0], key);
    var inh = inheritedValue(items[0], key), shown = own && /^#/.test(own) ? own : inh && /^#/.test(inh) ? inh : "";
    var inp = h("input", { type: "color", "aria-label": label, "data-tip": label + (own ? " : " + own : " (hérité)"), value: shown ? shown.slice(0, 7) : "#000000", disabled: lockedAny(items) });
    var box = h("span", { class: "pb-ctx-color" + (own ? " is-set" : "") + (shown ? "" : " is-unknown") }, inp);
    inp.addEventListener("change", function () { box.classList.add("is-set"); box.classList.remove("is-unknown"); setStyle(idsOf(items), key, inp.value); });
    return box;
  }
  function ctxAlign(items, key, values) {
    var own = ownValue(items[0], key);
    return h("span", { class: "pb-seg pb-seg-icons", role: "group", "aria-label": SP[key].label }, values.map(function (v) {
      return h("button", { type: "button", "aria-pressed": String(own === v[0]), "aria-label": v[1], "data-tip": v[1], disabled: lockedAny(items), onclick: function () { setStyle(idsOf(items), key, own === v[0] ? "" : v[0]); } }, icon(v[2]));
    }));
  }
  // Groupes logiques de la barre. Priorité : 0 = toujours visible ; plus le nombre est grand, plus le groupe passe tôt dans « Plus » quand la place manque
  var ctxSep = function () { return h("span", { class: "pb-ctx-sep", "aria-hidden": "true" }); };
  var ctxGroups = [];
  function ctxGroup(bar, name, prio, controls) {
    var g = h("span", { class: "pb-ctx-group", role: "group", "aria-label": name, "data-ctx-prio": String(prio) }, controls);
    ctxGroups.push(g);
    bar.appendChild(g);
    return g;
  }
  var ctxFitRaf = 0, ctxFitWidth = -1, ctxObserver = null, ctxMoreOpen = null;
  function ctxCloseMore() {
    if (!ctxMoreOpen) return;
    ctxMoreOpen.btn.setAttribute("aria-expanded", "false"); ctxMoreOpen.pop.hidden = true; ctxMoreOpen = null;
    document.removeEventListener("pointerdown", ctxOutside, true);
  }
  function ctxOutside(e) { if (ctxMoreOpen && !ctxMoreOpen.wrap.contains(e.target)) ctxCloseMore(); }
  // Bouton « Plus » : reçoit les groupes qui ne tiennent plus (les mêmes nœuds : état et écouteurs conservés)
  function ctxMore(bar) {
    var pop = h("div", { class: "pb-ctx-pop", role: "group", "aria-label": "Autres réglages", hidden: true });
    var btn = h("button", { type: "button", class: "pb-ctx-btn pb-ctx-icon", "aria-label": "Plus de réglages", "aria-haspopup": "true", "aria-expanded": "false", "data-tip": "Plus de réglages" }, "⋯");
    var wrap = h("span", { class: "pb-ctx-more", hidden: true }, [btn, pop]);
    btn.addEventListener("click", function () {
      if (ctxMoreOpen && ctxMoreOpen.wrap === wrap) { ctxCloseMore(); return; }
      ctxCloseMore();
      var r = btn.getBoundingClientRect();
      pop.hidden = false; btn.setAttribute("aria-expanded", "true");
      pop.style.top = Math.round(r.bottom + 6) + "px";
      pop.style.left = Math.max(8, Math.min(Math.round(r.right - pop.offsetWidth), window.innerWidth - pop.offsetWidth - 8)) + "px";
      ctxMoreOpen = { wrap: wrap, btn: btn, pop: pop };
      document.addEventListener("pointerdown", ctxOutside, true);
    });
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape" && ctxMoreOpen) { ctxCloseMore(); btn.focus(); e.stopPropagation(); } });
    bar.appendChild(wrap);
    return wrap;
  }
  // Place disponible = largeur réelle de la barre (pas de la fenêtre) : on remet tout en ligne, puis on déplace les groupes les moins
  // prioritaires dans « Plus » jusqu'à ce que la rangée tienne. Rien n'est supprimé ni tronqué : les commandes déplacées restent actives.
  function fitContext() {
    ctxFitRaf = 0;
    var bar = $("[data-pb-context]"), wrap = bar && bar.querySelector(".pb-ctx-more");
    if (!bar || !wrap || !ctxGroups.length) return;
    var pop = wrap.querySelector(".pb-ctx-pop"), wasOpen = !!ctxMoreOpen;
    ctxCloseMore();
    ctxGroups.forEach(function (g) { if (g.getAttribute("data-ctx-prio") !== "0") bar.insertBefore(g, wrap); });
    wrap.hidden = true;
    ctxFitWidth = bar.clientWidth;
    if (bar.scrollWidth <= bar.clientWidth + 1) return;
    wrap.hidden = false;
    var moved = [];
    var cand = ctxGroups.map(function (g, i) { return { g: g, i: i, p: Number(g.getAttribute("data-ctx-prio")) }; }).filter(function (c) { return c.p > 0; })
      .sort(function (a, b) { return b.p - a.p || b.i - a.i; });
    for (var k = 0; k < cand.length && bar.scrollWidth > bar.clientWidth + 1; k++) { moved.push(cand[k]); pop.appendChild(cand[k].g); }
    moved.sort(function (a, b) { return a.i - b.i; }).forEach(function (c) { pop.appendChild(c.g); });
    if (wasOpen) wrap.querySelector("button").click();
  }
  function scheduleFitContext() { if (!ctxFitRaf) ctxFitRaf = requestAnimationFrame(fitContext); }
  function watchContextWidth() {
    var bar = $("[data-pb-context]");
    if (!bar || ctxObserver || !window.ResizeObserver) return;
    ctxObserver = new ResizeObserver(function () { if (bar.clientWidth !== ctxFitWidth) scheduleFitContext(); });
    ctxObserver.observe(bar);
  }
  // La barre est reconstruite à chaque changement de sélection ou de valeur. Deux garde-fous : (1) l'ajustement « Plus » se fait dans la MÊME image
  // (avant la peinture) : plus d'image intermédiaire où la rangée déborde puis saute ; (2) le champ qui avait le focus le retrouve (même commande,
  // même curseur) : taper une taille puis Entrée ne renvoie plus le focus à la page.
  function ctxFocusKey(bar) {
    var a = document.activeElement;
    if (!a || a === bar || !bar.contains(a)) return null;
    var host = a.closest("[aria-label],[data-tip]");
    var label = host ? (host.getAttribute("aria-label") || host.getAttribute("data-tip")) : null;
    if (!label) return null;
    var field = a.matches("input,select,textarea,button");
    return { label: label, tag: a.tagName, start: field && typeof a.selectionStart === "number" ? a.selectionStart : null, end: field && typeof a.selectionEnd === "number" ? a.selectionEnd : null };
  }
  function ctxRestoreFocus(bar, k) {
    if (!k) return;
    var nodes = bar.querySelectorAll("[aria-label],[data-tip]"), target = null;
    for (var i = 0; i < nodes.length && !target; i++) {
      if ((nodes[i].getAttribute("aria-label") || nodes[i].getAttribute("data-tip")) !== k.label) continue;
      target = nodes[i].tagName === k.tag ? nodes[i] : nodes[i].querySelector(k.tag.toLowerCase());
    }
    if (!target || target.disabled) return;
    try { target.focus({ preventScroll: true }); if (k.start !== null && target.setSelectionRange) target.setSelectionRange(k.start, k.end); } catch (e) { /* champ sans sélection */ }
  }
  function renderContext() {
    var bar = $("[data-pb-context]"), key = bar ? ctxFocusKey(bar) : null;
    renderContextBar(); watchContextWidth();
    if (ctxFitRaf) { cancelAnimationFrame(ctxFitRaf); ctxFitRaf = 0; }
    fitContext();
    if (bar) ctxRestoreFocus(bar, key);
  }
  function renderContextBar() {
    var bar = $("[data-pb-context]");
    ctxCloseMore();
    bar.textContent = "";
    ctxGroups = [];
    if (editing && editing.rich) { richToolbar(bar); return; }
    var items = selectedItems();
    if (!items.length) { bar.appendChild(h("span", { class: "pb-ctx-hint", text: "Écran : " + bpLabel(device) + (device === "desktop" ? "" : " — vos réglages s'appliquent à cet écran") })); return; }
    var it = items[0];
    var same = items.every(function (x) { return x.type === it.type; });
    bar.appendChild(h("span", { class: "pb-ctx-name", text: items.length > 1 ? items.length + " éléments" : typeLabel(it) }));
    if (styleState !== "normal") bar.appendChild(h("span", { class: "pb-ctx-state", text: { hover: "Survol", focus: "Focus", active: "Clic" }[styleState] }));
    if (items.length > 1) {
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: !canWrite, onclick: groupSelected }, "Grouper"));
      bar.appendChild(ctxAlign(items, "alignSelf", [["flex-start", "Aligner au début", "alignLeft"], ["center", "Centrer", "alignCenter"], ["flex-end", "Aligner à la fin", "alignRight"]]));
      bar.appendChild(h("button", { type: "button", class: "pb-ctx-btn", disabled: !canWrite, onclick: distribute }, "Répartir"));
      return;
    }
    if (same && isNode(it) && inspectorFor(it).groups && inspectorFor(it).groups.typography !== undefined) {
      ctxGroup(bar, "Typographie", 1, [ctxSelect("Police", "fontFamily", items), ctxLength("Taille", "fontSize", items, 64), ctxSelect("Graisse", "fontWeight", items)]);
      ctxGroup(bar, "Couleur du texte", 2, [ctxColor("Couleur du texte", "color", items)]);
      ctxGroup(bar, "Alignement du texte", 4, [ctxAlign(items, "textAlign", [["left", "Aligner à gauche", "alignLeft"], ["center", "Centrer", "alignCenter"], ["right", "Aligner à droite", "alignRight"], ["justify", "Justifier", "alignJustify"]])]);
      ctxGroup(bar, "Espacement et casse", 5, [ctxLength("Interligne", "lineHeight", items, 84), ctxLength("Espacement des lettres", "letterSpacing", items, 104, "Interlettrage"), ctxSelect("Casse", "textTransform", items)]);
    }
    if (it.type === "button") {
      ctxGroup(bar, "Bouton", 3, [ctxColor("Fond du bouton", "backgroundColor", items), ctxLength("Arrondi", "borderRadius", items, 68), ctxSelect("Largeur", "width", items, [["auto", "Largeur auto"], ["100%", "Toute la largeur"]])]);
      ctxGroup(bar, "Disposition", 4, [ctxAlign(items, "alignSelf", [["flex-start", "À gauche", "alignLeft"], ["center", "Centré", "alignCenter"], ["flex-end", "À droite", "alignRight"]])]);
      ctxGroup(bar, "États", 3, [h("button", { type: "button", class: "pb-ctx-btn", onclick: function () { inspTab = "style"; styleState = "hover"; renderInspector(); renderContext(); } }, "Survol…")]);
    }
    if (it.type === "image") {
      ctxGroup(bar, "Image", 1, [
        h("button", { type: "button", class: "pb-ctx-btn", disabled: lockedAny(items), onclick: function () { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } }, icon("image"), "Remplacer"),
        ctxSelect("Cadrage", "objectFit", items), ctxSelect("Proportions", "aspectRatio", items)]);
      ctxGroup(bar, "Forme et dimensions", 3, [ctxLength("Arrondi", "borderRadius", items, 68), ctxSelect("Ombre", "boxShadow", items), ctxLength("Largeur", "width", items, 72)]);
    }
    if (!isNode(it) || kidsOf(it)) {
      ctxGroup(bar, "Fond", 2, [ctxColor("Couleur de fond", "backgroundColor", items)]);
      ctxGroup(bar, "Espacement", 3, [ctxLength("Intérieur haut", "paddingTop", items, 72, "Int. haut"), ctxLength("Intérieur bas", "paddingBottom", items, 72, "Int. bas")].concat(kidsOf(it) ? [ctxLength("Écart entre enfants", "gap", items, 68, "Écart")] : []));
      var dims = [];
      if (it.type === "grid") dims.push(ctxSelect("Colonnes", "columns", items, [1, 2, 3, 4, 5, 6].map(function (n) { return [n, n + " colonne" + (n > 1 ? "s" : "")]; })));
      dims.push(ctxLength("Largeur max.", "maxWidth", items, 92));
      dims.push(ctxSelect("Arrondi", "borderRadius", items, [["0", "Sans arrondi"], ["8px", "8 px"], ["12px", "12 px"], ["16px", "16 px"], ["24px", "24 px"]]));
      ctxGroup(bar, "Dimensions et forme", 4, dims);
    }
    if (ctxGroups.length) ctxMore(bar);
    if (INLINE[it.type] && canWrite) ctxGroup(bar, "Édition", 0, [h("button", { type: "button", class: "pb-ctx-btn", disabled: lockedDeep(it.id), onclick: function () { startEdit(it.id); } }, icon("edit"), "Écrire")]).classList.add("pb-ctx-end");
  }

  // ---------- Édition directe dans le canevas ----------
  // plain : texte simple (titre, bouton, lien, citation) ; rich : texte riche (barre de mise en forme en haut)
  var INLINE = { heading: "plain", button: "plain", link: "plain", quote: "plain", text: "rich" };
  function startEdit(id) {
    var it = byId(id);
    if (!it || !INLINE[it.type] || !canWrite) return;
    if (lockedDeep(id)) { toast("Élément verrouillé.", true); return; }
    // Contenu dynamique : la page affiche la VALEUR de la donnée ; écrire dessus effacerait l'étiquette. On passe par l'inspecteur.
    if (hasDynamic(it)) { toast("Ce contenu est dynamique ({{…}}) : modifiez-le dans le panneau de droite.", false); openInspector("content"); return; }
    var doc = frame.contentDocument;
    var el = doc && doc.querySelector('[data-node-id="' + id + '"]');
    if (!el) return;
    if (it.type === "quote") el = el.querySelector("p") || el;
    if (editing) commitEdit();
    if (selection.length !== 1 || selection[0] !== id) { selection = [id]; markTreeSelection(); renderInspector(); }
    editing = { id: id, el: el, rich: INLINE[it.type] === "rich", before: it.type === "text" ? el.innerHTML : el.textContent };
    placeCanvasBar();
    $$(".pb-handle", doc).forEach(function (x) { x.remove(); });
    el.setAttribute("contenteditable", "true");
    el.classList.add("pb-editing");
    el.focus();
    var range = doc.createRange(); range.selectNodeContents(el); range.collapse(false);
    var sel = frame.contentWindow.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    renderContext();
    toast(editing.rich ? "Écriture directe : mise en forme dans la barre du haut ; Échap pour annuler, clic ailleurs pour valider." : "Écriture directe : Entrée pour valider, Échap pour annuler.");
  }
  function commitEdit(cancel) {
    if (!editing) return;
    var ed = editing;
    editing = null;
    placeCanvasBar();
    ed.el.removeAttribute("contenteditable");
    ed.el.classList.remove("pb-editing");
    var it = byId(ed.id);
    if (!cancel && it) {
      if (ed.rich) {
        var html = ed.el.innerHTML.trim();
        if (!ed.el.textContent.trim()) { toast("Un texte ne peut pas être vide : supprimez l'élément s'il ne sert plus.", true); pendingRender = true; }
        else if (html !== ed.before) setProp(ed.id, "html", html);
      } else {
        var text = ed.el.textContent.replace(/\s+/g, " ").trim();
        var key = it.type === "button" || it.type === "link" ? "label" : "text";
        if (!text) { toast("Le texte ne peut pas être vide.", true); pendingRender = true; }
        else if (text !== String(ed.before).replace(/\s+/g, " ").trim()) setProp(ed.id, key, text);
      }
    } else pendingRender = true;
    renderContext();
    renderInspector();
    if (pendingRender) { pendingRender = false; scheduleRender(); }
    else drawOverlays();
  }
  // Barre de mise en forme du texte riche (agit sur la sélection dans le canevas)
  function richToolbar(bar) {
    var doc = frame.contentDocument;
    var exec = function (cmd, value) { doc.execCommand(cmd, false, value === undefined ? null : value); if (editing) editing.el.focus(); };
    var keepFocus = function (b) { b.addEventListener("mousedown", function (e) { e.preventDefault(); }); return b; };
    var btn = function (label, ic, cmd, value) {
      var b = keepFocus(h("button", { type: "button", class: "pb-ctx-btn pb-ctx-icon", "aria-label": label, "data-tip": label }, icon(ic)));
      b.addEventListener("click", function () { if (typeof cmd === "function") cmd(); else exec(cmd, value); });
      return b;
    };
    var txt = function (label, text, cmd, cls) {
      var b = keepFocus(h("button", { type: "button", class: "pb-ctx-btn pb-ctx-icon " + (cls || ""), "aria-label": label, "data-tip": label }, text));
      b.addEventListener("click", function () { exec(cmd); });
      return b;
    };
    bar.appendChild(h("span", { class: "pb-ctx-name", text: "Texte" }));
    var block = h("select", { "aria-label": "Type de paragraphe", "data-tip": "Type de paragraphe" }, [["p", "Paragraphe"], ["h2", "Intertitre 2"], ["h3", "Intertitre 3"], ["h4", "Intertitre 4"], ["blockquote", "Citation"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    block.addEventListener("change", function () { exec("formatBlock", "<" + block.value + ">"); });
    bar.appendChild(block);
    bar.appendChild(txt("Gras (Ctrl/⌘ + B)", "G", "bold", "is-bold"));
    bar.appendChild(txt("Italique (Ctrl/⌘ + I)", "I", "italic", "is-italic"));
    bar.appendChild(txt("Souligné (Ctrl/⌘ + U)", "S", "underline", "is-underline"));
    bar.appendChild(txt("Barré", "B", "strikeThrough", "is-strike"));
    bar.appendChild(txt("Exposant", "x²", "superscript"));
    bar.appendChild(txt("Indice", "x₂", "subscript"));
    bar.appendChild(ctxSep());
    var color = keepFocus(h("input", { type: "color", "aria-label": "Couleur du texte sélectionné", "data-tip": "Couleur du texte", value: "#102a3a" }));
    color.addEventListener("change", function () { doc.execCommand("styleWithCSS", false, true); exec("foreColor", color.value); doc.execCommand("styleWithCSS", false, false); });
    bar.appendChild(color);
    bar.appendChild(btn("Surligner", "highlighter", function () { doc.execCommand("styleWithCSS", false, true); exec("hiliteColor", "#fff3b0"); doc.execCommand("styleWithCSS", false, false); }));
    bar.appendChild(btn("Lien", "link", function () {
      var sel = frame.contentWindow.getSelection();
      var range = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      if (!range || range.collapsed) { toast("Sélectionnez d'abord le texte du lien.", true); return; }
      editing.keep = true;
      ask("Lien", [["url", "link", "Adresse (/catalogue, /p/… ou https://…)"], ["newTab", "checkbox", "Ouvrir dans un nouvel onglet"]], function (v) {
        if (!editing) return;
        editing.keep = false;
        editing.el.focus();
        sel.removeAllRanges(); sel.addRange(range);
        if (!/^(\/(?!\/)|https:\/\/)/.test(v.url)) { toast("Adresse : /… ou https://…", true); return; }
        exec("createLink", v.url);
        if (v.newTab) { var a = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement); a = a && a.closest("a"); if (a) a.setAttribute("target", "_blank"); }
      }, function () { if (editing) { editing.keep = false; editing.el.focus(); sel.removeAllRanges(); sel.addRange(range); } });
    }));
    bar.appendChild(btn("Retirer le lien", "close", "unlink"));
    bar.appendChild(ctxSep());
    bar.appendChild(btn("Liste à puces", "list", "insertUnorderedList"));
    bar.appendChild(btn("Liste numérotée", "listOrdered", "insertOrderedList"));
    bar.appendChild(btn("Augmenter le retrait", "indentMore", "indent"));
    bar.appendChild(btn("Diminuer le retrait", "indentLess", "outdent"));
    bar.appendChild(ctxSep());
    bar.appendChild(btn("Aligner à gauche", "alignLeft", "justifyLeft"));
    bar.appendChild(btn("Centrer", "alignCenter", "justifyCenter"));
    bar.appendChild(btn("Aligner à droite", "alignRight", "justifyRight"));
    bar.appendChild(btn("Effacer la mise en forme", "clearFormat", "removeFormat"));
    var ok = keepFocus(h("button", { type: "button", class: "pb-ctx-btn" }, icon("check"), "Valider"));
    ok.addEventListener("click", function () { commitEdit(); });
    bar.appendChild(ok);
  }

  // ---------- Canevas (rendu réel) ----------
  var renderTimer = null, renderSeq = 0, pendingRender = false;
  var payload = function () { return { sections: content.sections, title: content.title, description: content.description, theme: content.theme, seo: content.seo }; };
  // Pas de nouveau rendu pendant une édition directe ou un geste dans le canevas (guide, poignée) : le document serait
  // remplacé sous la souris ; le rendu attend la fin du geste
  var gesture = false;
  // Saisie continue : 150 ms de regroupement ; action isolée (dupliquer, supprimer, annuler, couleur choisie…) : rendu presque tout de suite
  // Délai de regroupement de la saisie : proportionnel au coût du dernier rendu (petite page : réponse rapide ; grande page : on ne multiplie pas les requêtes)
  var lastRenderMs = 100;
  // Regroupement des rendus : le PREMIER changement après une pause (400 ms sans changement) est envoyé tout de suite — l'attente d'une fenêtre de regroupement
  // n'aurait servi qu'à retarder l'affichage —, les suivants (frappes, séries) attendent la fenêtre habituelle pour ne pas multiplier les requêtes.
  var lastScheduleAt = -1e9;
  function scheduleRender(quick) {
    if (editing || gesture) { pendingRender = true; return; }
    clearTimeout(renderTimer);
    var now = performance.now(), first = now - lastScheduleAt > 400;
    lastScheduleAt = now;
    renderTimer = setTimeout(renderCanvas, first ? 0 : quick ? 30 : Math.max(50, Math.min(150, Math.round(lastRenderMs * 1.2))));
  }
  function endGesture() { gesture = false; if (pendingRender && !editing) { pendingRender = false; scheduleRender(); } }
  var errorItemId = null;
  // « Section 3 › élément 2 « Titre » : … » → identifiant de l'élément en cause (mis en évidence dans les calques)
  function itemFromError(message) {
    var m = /Section (\d+)((?: › élément \d+(?: « [^»]* »)?)*)/.exec(message || "");
    if (!m) return null;
    var it = content.sections[Number(m[1]) - 1];
    (m[2].match(/élément (\d+)/g) || []).forEach(function (part) { var k = it && kidsOf(it); it = k ? k[Number(part.replace(/\D/g, "")) - 1] : null; });
    return it ? it.id : null;
  }
  // Mise à jour du canevas EN PLACE : le rendu serveur est comparé au précédent, section par section, et seules les sections
  // modifiées sont remplacées (feuilles de style comprises). Le document du cadre, ses écouteurs, ses images déjà chargées et le
  // défilement restent en place : plus de rechargement complet à chaque modification. Tout ce qui sortirait de ce cadre simple
  // (en-tête ou pied changé, scripts, sections interactives : onglets, carrousel, animations, formulaires…) recharge le cadre
  // en entier, comme avant.
  var lastRender = null;
  var INTERACTIVE = /\sdata-kw-(?!add\b)[a-z-]+|<script|<iframe|<video|<audio|<form|<input|<details|<style/i;
  function renderSignature(text) {
    var d = new DOMParser().parseFromString(text, "text/html");
    var main = d.getElementById("main");
    var sig = { doc: d, main: main, head: "", styles: [], bodyClass: d.body ? d.body.className : "", bodyStyle: d.body ? d.body.getAttribute("style") || "" : "", rest: "", items: [] };
    if (!main || !d.body) return null;
    Array.prototype.forEach.call(d.head.children, function (el) { if (el.tagName === "STYLE") sig.styles.push(el.textContent); else sig.head += el.outerHTML; });
    var clone = d.body.cloneNode(true);
    clone.querySelector("#main").textContent = "";
    clone.removeAttribute("style");
    sig.rest = clone.outerHTML;
    var other = 0;
    Array.prototype.forEach.call(main.children, function (el) { sig.items.push({ key: el.getAttribute("data-section-id") || "~" + other++, html: el.outerHTML, el: el }); });
    return sig;
  }
  function patchCanvas(text) {
    var next = renderSignature(text), prev = lastRender;
    lastRender = next;
    if (!next || !prev) return false;
    var doc = frame.contentDocument;
    var main = doc && doc.body && doc.readyState === "complete" ? doc.getElementById("main") : null;
    if (!main || !doc.body.classList.contains("lp-builder")) return false;
    if (next.head !== prev.head || next.rest !== prev.rest || next.bodyClass !== prev.bodyClass) return false;
    var liveStyles = Array.prototype.filter.call(doc.head.children, function (el) { return el.tagName === "STYLE" && el.id !== "pb-force-state"; });
    // Le nombre de feuilles peut changer (la première règle d'un élément en crée une) : elles sont réconciliées plus bas, sans recharger le cadre
    if (liveStyles.length !== prev.styles.length) return false;
    var prevHtml = {};
    prev.items.forEach(function (i) { prevHtml[i.key] = i.html; });
    var liveByKey = {}, liveOther = [];
    Array.prototype.forEach.call(main.children, function (el) { var k = el.getAttribute("data-section-id"); if (k) liveByKey[k] = el; else liveOther.push(el); });
    var want = [], other = 0, replaced = 0;
    for (var n = 0; n < next.items.length; n++) {
      var it = next.items[n], live = it.key.charAt(0) === "~" ? liveOther[Number(it.key.slice(1))] : liveByKey[it.key];
      if (live && prevHtml[it.key] === it.html) { want.push(live); continue; }
      if (INTERACTIVE.test(it.html) || (live && INTERACTIVE.test(prevHtml[it.key] || ""))) return false;
      want.push(doc.importNode(it.el, true)); replaced++;
    }
    var knownIds = {};
    Array.prototype.forEach.call(doc.querySelectorAll("[data-node-id],[data-section-id]"), function (e) { knownIds[idOfEl(e)] = 1; });
    // Tout est vérifié : on applique (aucun retour en arrière possible après ce point)
    syncStyles(doc, liveStyles, next.styles);
    if (next.bodyStyle !== prev.bodyStyle) doc.body.setAttribute("style", next.bodyStyle);
    var ref = main.firstChild;
    want.forEach(function (el) { if (el === ref) ref = ref.nextSibling; else main.insertBefore(el, ref); });
    Array.prototype.slice.call(main.children).forEach(function (el) { if (want.indexOf(el) < 0) el.remove(); });
    inlineTouched.forEach(function (el) { el.style.width = ""; el.style.height = ""; });
    inlineTouched = [];
    clearPreviews();
    // Éléments créés : apparition très courte (opacité + micro-zoom, sans toucher à la mise en page). Seuls les plus hauts d'un lot sont animés (au plus 6)
    if (window.KolMotion) {
      var fresh = Array.prototype.filter.call(doc.querySelectorAll("[data-node-id],[data-section-id]"), function (e) { return !knownIds[idOfEl(e)]; });
      var top = fresh.filter(function (e) { var up = e.parentElement && e.parentElement.closest("[data-node-id],[data-section-id]"); return !up || knownIds[idOfEl(up)]; });
      if (top.length && top.length <= 6) top.forEach(function (e) { window.KolMotion.appear(e, "appear"); });
    }
    markCanvasSelection(false);
    drawRulers();
    drawGuides();
    refreshInfo();
    return true;
  }
  // Feuilles <style> du cadre alignées sur le nouveau rendu, en place : réutilisées si identiques, créées ou retirées sinon (ordre conservé)
  function syncStyles(doc, live, wanted) {
    var cur = 0, surplus = wanted.length - live.length, last = null;
    wanted.forEach(function (text) {
      var l = live[cur];
      while (surplus < 0 && l && l.textContent !== text) { l.remove(); cur++; surplus++; l = live[cur]; }
      if (surplus > 0 && (!l || l.textContent !== text)) {
        var made = doc.createElement("style"); made.textContent = text;
        if (l) l.parentNode.insertBefore(made, l); else if (last) last.parentNode.insertBefore(made, last.nextSibling); else doc.head.appendChild(made);
        surplus--; last = made; return;
      }
      if (l) { if (l.textContent !== text) l.textContent = text; cur++; last = l; }
    });
    for (; cur < live.length; cur++) live[cur].remove();
  }
  // Rechargement COMPLET du cadre (sections interactives : onglets, accordéons, compteurs, formulaires…, dont les scripts ne
  // s'initialisent qu'une fois). Double tampon : le nouveau cadre se charge masqué par-dessus l'ancien, qui reste affiché et actif
  // jusqu'à ce que le nouveau soit prêt ; l'échange est alors immédiat (aucun blanc, défilement et sélection restitués par setupCanvas).
  var swapping = null, canvasReady = false;
  function reloadCanvas(text, y) {
    if (!canvasReady) { frame.onload = function () { setupCanvas(y); }; frame.srcdoc = text; return; } // tout premier affichage
    var old = frame, nu = old.cloneNode(false);
    nu.removeAttribute("data-pb-frame"); nu.removeAttribute("srcdoc");
    nu.style.position = "absolute"; nu.style.inset = "0"; nu.style.visibility = "hidden";
    swapping = nu;
    nu.onload = function () {
      // Un iframe inséré déclenche d'abord un `load` pour son document vide initial : on n'échange que sur le vrai contenu
      var nd = nu.contentDocument;
      if (swapping !== nu || !nd || nd.URL !== "about:srcdoc" || !nd.body) return;
      swapping = null;
      // Une édition directe ou un geste a commencé entre-temps : on ne remplace rien sous la main de la personne
      if (editing || gesture) { nu.remove(); lastRender = null; pendingRender = true; return; }
      // Le clavier passe à la zone du canevas (sinon un raccourci tapé pendant l'échange, Ctrl/⌘ + Z par exemple, serait perdu)
      if (document.activeElement === old) $("[data-pb-canvas]").focus({ preventScroll: true });
      nu.setAttribute("data-pb-frame", ""); nu.style.position = ""; nu.style.inset = ""; nu.style.visibility = "";
      frame = nu; old.remove();
      setupCanvas(y);
    };
    nu.srcdoc = text; // avant l'insertion : le document chargé est directement le bon
    old.parentNode.appendChild(nu);
  }
  function renderCanvas() {
    if (editing || gesture) { pendingRender = true; return; }
    var seq = ++renderSeq, t0 = performance.now();
    fetch(BASE + "/rendu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: payload() }) })
      .then(function (r) { return r.text().then(function (text) { return { ok: r.ok, text: text }; }); })
      .then(function (res) {
        if (seq !== renderSeq) return;
        lastRenderMs = performance.now() - t0;
        var errBox = $("[data-pb-render-error]");
        if (!res.ok) {
          var msg = "Aperçu non mis à jour.";
          try { msg = JSON.parse(res.text).error.message; } catch (e) { /* réponse non JSON */ }
          errBox.textContent = msg + " Corrigez ce point : l'aperçu et l'enregistrement reprendront.";
          errBox.hidden = false;
          errorItemId = itemFromError(msg);
          markError();
          return;
        }
        errBox.hidden = true;
        if (errorItemId) { errorItemId = null; markError(); }
        if (editing || gesture) { pendingRender = true; return; }
        // Un rechargement précédent n'a pas fini : son contenu est dépassé, on le jette et on recharge avec ce rendu-ci
        // (on l'oublie AVANT de le retirer : retirer un cadre qui finit de charger déclenche son `load` pendant le retrait, et son gestionnaire
        // l'aurait alors promu en canevas à la place de l'ancien, laissant la page sans cadre)
        if (swapping) { var stale = swapping; swapping = null; stale.onload = null; stale.remove(); lastRender = null; }
        if (patchCanvas(res.text)) return;
        var y = 0;
        try { y = frame.contentWindow.scrollY; } catch (e) { y = 0; }
        inlineTouched = [];
        reloadCanvas(res.text, y);
      }, function () { var errBox = $("[data-pb-render-error]"); errBox.textContent = "Aperçu indisponible (connexion au serveur interrompue)."; errBox.hidden = false; });
  }
  function markError() { $$(".pb-row-item.is-error", treeEl).forEach(function (r) { r.classList.remove("is-error"); }); if (errorItemId) { var r = treeEl.querySelector('.pb-node[data-id="' + errorItemId + '"] > .pb-row-item'); if (r) r.classList.add("is-error"); } }
  var ignoreClickUntil = 0;
  // Le canevas ne prend le clavier que sur une action de la personne (clic dedans, édition directe, touche Tab) : un
  // chargement ou un contenu de la page ne doit jamais retirer le curseur d'un champ de l'inspecteur
  var canvasPointerAt = 0, tabAt = 0, parentFocus = null;
  document.addEventListener("focusin", function (e) { if (e.target !== frame) parentFocus = e.target; });
  document.addEventListener("keydown", function (e) { if (e.key === "Tab") tabAt = Date.now(); }, true);
  var targetOf = function (e) { return e.target && e.target.closest ? e.target.closest("[data-node-id],[data-section-id]") : null; };
  var idOfEl = function (el) { return el ? el.getAttribute("data-node-id") || el.getAttribute("data-section-id") : null; };
  // Aperçu de l'état choisi (« Après défilement », « Menu ouvert ») sur le canevas : l'en-tête est montré tel qu'il sera dans cet état, pour régler son style à l'œil
  function applyPreviewState() {
    try {
      var doc = frame && frame.contentDocument; if (!doc || !doc.body) return;
      var on = isHeaderDoc();
      // Sur le canevas d'un modèle d'en-tête, le document édité est le premier bloc de la page (pas d'enveloppe « lp-site-header » comme sur le site publié) :
      // on pose la classe sur lui, et sur l'enveloppe quand elle existe ; les règles de style par état (.lp-site-header.is-scrolled …) s'appliquent donc aussi ici
      var main = doc.querySelector(".lp-main"), first = main && main.querySelector(":scope > .lp-block");
      var previewing = on && (styleState === "scrolled" || styleState === "menuOpen");
      if (first && previewing) { if (!first.classList.contains("lp-site-header")) { first.classList.add("lp-site-header"); first.setAttribute("data-pb-preview-hdr", ""); } }
      else if (first && first.hasAttribute("data-pb-preview-hdr")) { first.classList.remove("lp-site-header"); first.removeAttribute("data-pb-preview-hdr"); }
      [].concat(first ? [first] : [], [].slice.call(doc.querySelectorAll(".lp-site-header, .lp-site-part"))).forEach(function (el) {
        el.classList.toggle("is-scrolled", on && styleState === "scrolled");
        el.classList.toggle("is-menu-open", on && styleState === "menuOpen");
      });
    } catch (e) { /* canevas pas encore prêt */ }
  }
  function setupCanvas(y) {
    applyPreviewState();
    previews = [];
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    canvasReady = true;
    guarded(refreshStart); // premier rendu terminé : seul moment où une page vide peut proposer le choix de création
    doc.body.classList.add("lp-builder");
    if (window.pbMotionStudio) window.pbMotionStudio.canvas(frame.contentWindow); // runtime Motion Studio du canevas (mode éditeur : lecture / pause / position)
    if (window.pbDirect) window.pbDirect.canvas(doc); // manipulation directe : couche de survol et poignées de ce document
    doc.body.classList.toggle("pb-outlines", aids.outlines);
    doc.body.classList.toggle("pb-hand", tool === "hand");
    frame.contentWindow.scrollTo(0, y);
    doc.addEventListener("mousedown", function (e) { canvasPointerAt = Date.now(); closeMenu(); releasePart(e); }, true); // le canevas est un iframe : ses clics n'atteignent pas l'écouteur du document parent
    doc.addEventListener("keydown", function (e) { if (e.key === "Tab") tabAt = Date.now(); }, true);
    frame.contentWindow.addEventListener("focus", function () {
      if (editing || Date.now() - canvasPointerAt < 1500 || Date.now() - tabAt < 500) return;
      var back = parentFocus && document.body.contains(parentFocus) && !parentFocus.disabled ? parentFocus : $("[data-pb-canvas]");
      back.focus({ preventScroll: true });
    });
    doc.addEventListener("click", function (e) {
      if (selectedGuide) { selectedGuide = null; drawGuides(); }
      if (tool === "hand") { e.preventDefault(); return; }
      // Fin d'un redimensionnement (poignée, séparation de colonnes) : le relâchement n'est pas un clic de sélection
      if (Date.now() < ignoreClickUntil) { e.preventDefault(); return; }
      if (editing && editing.el.contains(e.target)) return;
      e.preventDefault();
      if (e.target.closest(".pb-handle")) return;
      var plus = e.target.closest && e.target.closest("[data-kw-add]");
      if (plus) { canvasAdd(plus); return; }
      // Partie globale du site (en-tête, pied de page) : action explicite, ouvre le composant EXACT de cette partie (identifiants lus sur l'élément cliqué)
      var partBtn = e.target.closest && e.target.closest("[data-part-edit]");
      if (partBtn) { openSitePart(partBtn); return; }
      select(idOfEl(targetOf(e)), e.shiftKey || e.metaKey || e.ctrlKey, { scroll: false });
    });
    doc.addEventListener("dblclick", function (e) {
      var id = idOfEl(targetOf(e));
      var it = id && byId(id);
      if (it && INLINE[it.type]) { e.preventDefault(); startEdit(id); }
    });
    doc.addEventListener("contextmenu", function (e) {
      var id = idOfEl(targetOf(e));
      if (!id || editing) return;
      e.preventDefault();
      if (selection.indexOf(id) < 0) select(id, false, { scroll: false });
      var r = frame.getBoundingClientRect();
      openMenu(r.left + e.clientX * zoom, r.top + e.clientY * zoom);
    });
    doc.addEventListener("keydown", function (e) {
      if (editing) {
        if (e.key === "Escape") { e.preventDefault(); var ed = editing; if (ed.rich) ed.el.innerHTML = ed.before; else ed.el.textContent = ed.before; commitEdit(true); return; }
        if (e.key === "Enter" && !editing.rich) { e.preventDefault(); commitEdit(); return; }
        if ((e.metaKey || e.ctrlKey) && ["b", "i", "u"].indexOf(e.key.toLowerCase()) >= 0 && !editing.rich) e.preventDefault();
        return;
      }
      if (!menu.hidden || document.querySelector("dialog[open]:not([data-pb-navmgr]):not([data-pb-rules])")) return;
      onKey(e);
    });
    doc.addEventListener("focusout", function (e) { if (editing && e.target === editing.el && !editing.keep) setTimeout(function () { if (editing && !editing.keep && doc.activeElement !== editing.el) commitEdit(); }, 150); });
    doc.addEventListener("paste", function (e) {
      if (!editing || editing.rich) return;
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData("text/plain");
      doc.execCommand("insertText", false, text.replace(/\s+/g, " "));
    });
    // Glisser-déposer dans le canevas (depuis la palette, les calques, ou un élément sélectionné du canevas)
    doc.addEventListener("dragstart", function (e) {
      var id = idOfEl(targetOf(e));
      if (!id || editing || !canWrite || lockedDeep(id)) { e.preventDefault(); return; }
      dragIds = selection.indexOf(id) >= 0 ? selection.slice() : [id]; dragNew = null;
      e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move");
    });
    doc.addEventListener("mousedown", function (e) {
      if (tool === "hand") { panStart(e); return; }
      var el = targetOf(e);
      var id = idOfEl(el);
      if (el && selection.indexOf(id) >= 0 && !editing && canWrite && !lockedDeep(id) && !e.target.closest(".pb-handle")) el.setAttribute("draggable", "true");
    });
    doc.addEventListener("mouseup", function () { $$("[data-node-id][draggable],[data-section-id][draggable]", doc).forEach(function (x) { x.removeAttribute("draggable"); }); });
    doc.addEventListener("dragover", function (e) {
      if (!dragIds && !dragNew) return;
      var t = canvasDropTarget(e);
      if (!t) { hideDropIndicator(); return; }
      e.preventDefault();
      showDropIndicator(t);
    });
    doc.addEventListener("drop", function (e) {
      var t = canvasDropTarget(e);
      hideDropIndicator();
      if (!t) return;
      e.preventDefault();
      performDrop(t.target);
    });
    frame.contentWindow.addEventListener("scroll", function () { drawOverlays(); drawRulers(); }, { passive: true });
    // Position du pointeur reportée sur les règles
    var raf = 0;
    doc.addEventListener("mousemove", function (e) {
      if (!aids.rulers) return;
      pointerPage = { x: e.clientX + frame.contentWindow.scrollX, y: e.clientY + frame.contentWindow.scrollY };
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; drawRulers(); });
    });
    doc.addEventListener("mouseleave", function () { pointerPage = null; drawRulers(); });
    // Alt + survol : distances entre l'élément sélectionné et celui survolé (rien n'est modifié)
    doc.addEventListener("mousemove", function (e) { if (e.altKey) measureHover(e); else if (measuring) { measuring = false; smartClear(); } });
    doc.addEventListener("keyup", function (e) { if (e.key === "Alt" && measuring) { measuring = false; smartClear(); } });
    markCanvasSelection(false);
    drawRulers();
    drawGuides();
    refreshInfo();
  }
  // Cible de dépôt dans le canevas : avant / après un élément (selon l'axe de son parent) ou dans un conteneur
  // Élément qui met réellement en page les enfants de `el` : le conteneur parent ; pour un enfant direct d'une Section libre, la section elle-même
  // (l'enveloppe .kw-layout est transparente : display: contents, ses enfants sont ceux de la section)
  function layoutParentEl(el) {
    var p = el ? el.parentElement : null;
    while (p && p.classList && p.classList.contains("kw-layout")) p = p.parentElement;
    return p;
  }
  function canvasDropTarget(e) {
    var doc = frame.contentDocument;
    var el = targetOf(e);
    var sample = dragNew ? dragNew.sample : byId((dragIds || [])[0]);
    var placingNode = Boolean(sample && (dragNew ? NT[sample.type] && !sample.section : isNode(sample)));
    if (!el) return { target: { parent: null, index: content.sections.length }, el: null, pos: "end" };
    var l = locate(idOfEl(el));
    if (!l) return null;
    var r = el.getBoundingClientRect();
    var it = l.item;
    var horizontal = false;
    var lpe = layoutParentEl(el); if (l.parent && lpe) { var cs = doc.defaultView.getComputedStyle(lpe); horizontal = (cs.display.indexOf("flex") >= 0 && cs.flexDirection.indexOf("row") === 0) || (cs.display.indexOf("grid") >= 0 && cs.gridTemplateColumns.split(" ").length > 1); }
    var rel = horizontal ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height;
    var accepts = kidsOf(it) && placingNode && !lockedDeep(it.id) && !(dragIds && dragIds.indexOf(it.id) >= 0);
    if (accepts && ((rel > 0.2 && rel < 0.8) || !kidsOf(it).length)) return { target: { parent: it, index: kidsOf(it).length }, el: el, pos: "inside", horizontal: horizontal };
    if (!placingNode && l.parent) {
      var top = l.ancestors[0];
      var te = doc.querySelector('[data-section-id="' + top.id + '"]');
      var tr = te.getBoundingClientRect();
      var after = (e.clientY - tr.top) / tr.height >= 0.5;
      return { target: { parent: null, index: sectionIndex(top) + (after ? 1 : 0) }, el: te, pos: after ? "after" : "before", horizontal: false };
    }
    if (l.parent && lockedDeep(l.parent.id)) return null;
    return { target: { parent: l.parent, index: l.index + (rel >= 0.5 ? 1 : 0) }, el: el, pos: rel >= 0.5 ? "after" : "before", horizontal: horizontal };
  }
  function overlayEl(cls) {
    var doc = frame.contentDocument;
    var el = doc.querySelector("." + cls);
    if (!el) { el = doc.createElement("div"); el.className = cls; doc.body.appendChild(el); }
    return el;
  }
  function pageRect(el) { var r = el.getBoundingClientRect(); var w = frame.contentWindow; return { left: r.left + w.scrollX, top: r.top + w.scrollY, width: r.width, height: r.height }; }
  function showDropIndicator(t) {
    var doc = frame.contentDocument;
    if (!doc) return;
    var line = overlayEl("pb-drop-line"), box = overlayEl("pb-drop-box"), label = overlayEl("pb-drop-label");
    if (!t.el) {
      var main = doc.querySelector(".lp-main") || doc.body;
      var pr = pageRect(main);
      box.style.display = "none";
      line.style.cssText = "left:" + pr.left + "px;top:" + (pr.top + pr.height - 2) + "px;width:" + pr.width + "px;height:3px";
      label.textContent = "Fin de la page (nouvelle section)";
      label.style.cssText = "left:" + pr.left + "px;top:" + Math.max(0, pr.top + pr.height - 24) + "px";
      return;
    }
    var r = pageRect(t.el);
    var parentName = t.target.parent ? nameOf(t.target.parent) : "la page";
    if (t.pos === "inside") {
      line.style.display = "none";
      box.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px";
      label.textContent = "Dans « " + nameOf(t.target.parent) + " » · position " + (t.target.index + 1);
    } else {
      box.style.display = "none";
      if (t.horizontal) line.style.cssText = "left:" + ((t.pos === "after" ? r.left + r.width : r.left) - 1) + "px;top:" + r.top + "px;width:3px;height:" + r.height + "px";
      else line.style.cssText = "left:" + r.left + "px;top:" + ((t.pos === "after" ? r.top + r.height : r.top) - 1) + "px;width:" + r.width + "px;height:3px";
      label.textContent = (t.pos === "after" ? "Après" : "Avant") + " « " + nameOf(byId(idOfEl(t.el))) + " » · dans " + (t.target.parent ? "« " + parentName + " »" : parentName);
    }
    label.style.left = r.left + "px";
    label.style.top = Math.max(0, r.top - 22) + "px";
  }
  function hideDropIndicator() {
    var doc = frame.contentDocument;
    if (!doc) return;
    $$(".pb-drop-line, .pb-drop-box, .pb-drop-label", doc).forEach(function (x) { x.remove(); });
  }
  // Sélection dans le canevas : cadre, nom, dimensions, parent en pointillés, poignées de redimensionnement
  // Aperçu d'un état dans le canevas : tant qu'un état (survol, focus, clic) est choisi dans le panneau, l'élément sélectionné est AFFICHÉ dans cet état, sans survol réel.
  // Les règles « .kw-n-<id>:hover » de la page sont recopiées avec une classe (« .pb-force-state ») : mêmes valeurs, mêmes écrans (requêtes de média comprises), une seule cible.
  function forceStatePreview() {
    var doc = frame.contentDocument;
    if (!doc || !doc.head) return;
    var old = doc.getElementById("pb-force-state");
    if (old) old.parentNode.removeChild(old);
    $$(".pb-force-state", doc).forEach(function (el) { el.classList.remove("pb-force-state"); });
    if (styleState === "normal" || selection.length !== 1 || styleTarget) return;
    var id = selection[0], el = doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]');
    var pseudo = { hover: ":hover", focus: ":focus-visible", active: ":active" }[styleState];
    if (!el || !pseudo || !/^[a-z0-9]{6,20}$/.test(id)) return;
    var needle = ".kw-n-" + id + pseudo, out = [];
    var walkRules = function (rules, wrap) {
      Array.prototype.forEach.call(rules, function (r) {
        if (r.cssRules && r.media) walkRules(r.cssRules, function (t) { return wrap("@media " + r.media.mediaText + "{" + t + "}"); });
        else if (r.selectorText && r.selectorText.indexOf(needle) >= 0) {
          var sel = r.selectorText.split(",").filter(function (x) { return x.trim().indexOf(needle) >= 0; }).map(function (x) { return x.split(needle).join(".kw-n-" + id + ".pb-force-state"); }).join(",");
          out.push(wrap(sel + "{" + r.style.cssText + "}"));
        }
      });
    };
    Array.prototype.forEach.call(doc.styleSheets, function (sh) { try { walkRules(sh.cssRules, function (t) { return t; }); } catch (e) { /* feuille inaccessible */ } });
    if (!out.length) return;
    var st = doc.createElement("style");
    st.id = "pb-force-state"; st.textContent = out.join("\n");
    doc.head.appendChild(st);
    el.classList.add("pb-force-state");
  }
  function markCanvasSelection(scroll, pre) {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    guarded(forceStatePreview);
    $$(".is-selected", doc).forEach(function (el) { el.classList.remove("is-selected"); });
    selection.forEach(function (id) { var el = doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]'); if (el) el.classList.add("is-selected"); });
    drawOverlays(pre);
    if (scroll && selection.length) {
      var first = doc.querySelector('[data-node-id="' + selection[0] + '"],[data-section-id="' + selection[0] + '"]');
      if (first) { var r = pre && pre.items[0] && pre.items[0].client ? pre.items[0].client : first.getBoundingClientRect(); if (r.top < 0 || r.top > frame.contentWindow.innerHeight - 40) first.scrollIntoView({ block: "center", behavior: "smooth" }); }
    }
  }
  // Géométrie nécessaire aux aides de sélection (cadres, parent, poignées, barre d'actions) : LUE EN BLOC, avant toute écriture dans la page, l'arbre ou l'inspecteur.
  // La mise en page du canevas ne dépend pas de la sélection (simple contour) : lire avant ou après donne les mêmes valeurs, mais lire avant évite une mise en page forcée.
  function readOverlayGeo() {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return null;
    var geo = { pageW: doc.documentElement.clientWidth };
    geo.items = selection.map(function (id, n) {
      var el = doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]');
      if (!el) return null;
      var rd = { el: el, r: pageRect(el) };
      if (n === 0) { rd.l = locate(id); var pe = rd.l && rd.l.parent ? doc.querySelector('[data-node-id="' + rd.l.parent.id + '"],[data-section-id="' + rd.l.parent.id + '"]') : null; rd.pr = pe ? pageRect(pe) : null; rd.client = el.getBoundingClientRect(); }
      return rd;
    });
    geo.bar = barGeo();
    return geo;
  }
  function barGeo() {
    var el = selection.length ? canvasEl(selection[0]) : null;
    return { fr: frame.getBoundingClientRect(), sr: stage.getBoundingClientRect(), r: el ? el.getBoundingClientRect() : null };
  }
  function drawOverlays(pre) {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    var geo = pre || readOverlayGeo();
    if (!geo) return;
    var pageW = geo.pageW, reads = geo.items;
    $$(".pb-sel-box, .pb-sel-badge, .pb-parent-box, .pb-handle, .pb-dim, .pb-col-split, .pb-struct-add", doc).forEach(function (x) { x.remove(); });
    placeCanvasBar(geo.bar);
    selection.forEach(function (id, n) {
      var rd = reads[n];
      if (!rd) return;
      var el = rd.el, r = rd.r;
      var box = doc.createElement("div"); box.className = "pb-sel-box"; box.style.cssText = "left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px"; doc.body.appendChild(box);
      if (n !== 0) return;
      var it = byId(id);
      var badge = doc.createElement("div"); badge.className = "pb-sel-badge"; badge.textContent = nameOf(it) + " · " + Math.round(r.width) + " × " + Math.round(r.height);
      badge.style.left = r.left + "px"; badge.style.top = Math.max(18, r.top) + "px"; doc.body.appendChild(badge);
      if (rd.pr) { var pr = rd.pr; var pb = doc.createElement("div"); pb.className = "pb-parent-box"; pb.style.cssText = "left:" + pr.left + "px;top:" + pr.top + "px;width:" + pr.width + "px;height:" + pr.height + "px"; doc.body.appendChild(pb); }
      if (selection.length === 1 && isNode(it) && canWrite && !lockedDeep(id) && !editing) {
        [["e", r.left + r.width, r.top + r.height / 2, "Largeur"], ["s", r.left + r.width / 2, r.top + r.height, "Hauteur"], ["se", r.left + r.width, r.top + r.height, "Largeur et hauteur"]].forEach(function (hd) {
          // Les poignées restent entièrement dans la page, même quand l'élément touche son bord (pleine largeur)
          var hx = Math.max(7, Math.min(hd[1], pageW - 7));
          var hEl = doc.createElement("div"); hEl.className = "pb-handle pb-handle-" + hd[0]; hEl.style.left = hx + "px"; hEl.style.top = hd[2] + "px";
          hEl.setAttribute("title", hd[3]);
          hEl.addEventListener("mousedown", function (e) { resizeStart(e, id, el, hd[0]); });
          doc.body.appendChild(hEl);
        });
      }
      if (selection.length === 1 && canWrite && !lockedDeep(id) && !editing) structureOverlays(it, el, r);
    });
    if (window.pbDirect) window.pbDirect.refresh();
  }
  // Colonnes et grille sélectionnées : séparations à tirer (largeurs) et bouton « + » au bord (colonne, ligne)
  function structureOverlays(it, el, r) {
    var doc = frame.contentDocument;
    var plus = function (cls, x, y, label, fn) {
      var b = doc.createElement("button");
      b.type = "button"; b.className = "pb-struct-add " + cls; b.textContent = "+"; b.title = label; b.setAttribute("aria-label", label);
      b.style.left = x + "px"; b.style.top = y + "px";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); });
      b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); fn(); });
      doc.body.appendChild(b);
    };
    if (it.type === "columns") {
      var kids = kidsOf(it);
      if (kids.length < MAX_COLS) plus("is-col", r.left + r.width, r.top + r.height / 2, "Ajouter une colonne", function () { addColumn(it.id); });
      if (frame.contentWindow.getComputedStyle(el).flexDirection.indexOf("row") !== 0) return; // colonnes empilées (mobile)
      var els = kids.map(function (c) { return canvasEl(c.id); });
      if (els.some(function (x) { return !x; })) return;
      for (var i = 0; i < els.length - 1; i++) {
        var a = pageRect(els[i]), b = pageRect(els[i + 1]);
        if (Math.abs(a.top - b.top) > 4) continue; // colonnes passées à la ligne
        var sp = doc.createElement("div");
        sp.className = "pb-col-split";
        sp.title = "Tirer pour changer la largeur des colonnes " + (i + 1) + " et " + (i + 2);
        sp.style.cssText = "left:" + ((a.left + a.width + b.left) / 2) + "px;top:" + r.top + "px;height:" + r.height + "px";
        (function (k) { sp.addEventListener("mousedown", function (e) { columnSplitStart(e, it.id, k); }); })(i);
        doc.body.appendChild(sp);
      }
    } else if (it.type === "grid") {
      plus("is-row", r.left + r.width / 2, r.top + r.height, "Ajouter une ligne", function () { gridAddRow(it.id); });
      plus("is-col", r.left + r.width, r.top + r.height / 2, "Ajouter une colonne", function () { gridSetColumns(it.id, gridColumnsOf(it) + 1); });
    }
  }
  // Tirer la séparation entre deux colonnes : les deux voisines se partagent leur largeur commune
  function columnSplitStart(e, colsId, i) {
    e.preventDefault(); e.stopPropagation();
    var doc = frame.contentDocument;
    var cols = kidsOf(byId(colsId)).map(function (c) { return canvasEl(c.id); });
    var widths = cols.map(function (x) { return x.getBoundingClientRect().width; });
    var pair = widths[i] + widths[i + 1], total = widths.reduce(function (a, b) { return a + b; }, 0), x0 = e.clientX, a0 = widths[i];
    var min = total * 0.05;
    var nice = [25, 100 / 3, 50, 200 / 3, 75, 20, 40, 60, 80];
    var dim = doc.createElement("div"); dim.className = "pb-dim"; doc.body.appendChild(dim);
    gesture = true;
    var shares = null;
    var move = function (ev) {
      var a = Math.min(pair - min, Math.max(min, a0 + ev.clientX - x0));
      var w = widths.slice(); w[i] = a; w[i + 1] = pair - a;
      shares = w.map(function (x) { return x / total * 100; });
      if (aids.snap && !ev.altKey) { // magnétisme (Alt : libre) : pour cent entiers, et fractions courantes (¼, ⅓, ½…) à 1,5 % près
        var near = nice.filter(function (n) { return Math.abs(n - shares[i]) <= 1.5; })[0];
        var target = near !== undefined ? near : Math.round(shares[i]);
        var both = shares[i] + shares[i + 1];
        target = Math.min(both - 5, Math.max(5, target));
        shares[i] = target; shares[i + 1] = both - target;
      }
      cols.forEach(function (c, k) { c.style.flexGrow = String(shares[k]); });
      var r = pageRect(cols[i + 1]);
      dim.textContent = shares.map(pct).join(" · ");
      dim.style.left = r.left + "px"; dim.style.top = Math.max(0, r.top - 30) + "px";
    };
    var up = function () {
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); dim.remove();
      cols.forEach(function (c) { c.style.flexGrow = ""; });
      gesture = false;
      ignoreClickUntil = Date.now() + 250;
      if (!shares) { endGesture(); return; }
      change(function () { storeShares(byId(colsId), shares); });
      toast("Largeurs enregistrées pour l'écran « " + bpLabel(device) + " » : " + shares.map(pct).join(" / ") + ".");
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
  }
  // Redimensionner à la souris : largeur / hauteur en pixels, pour l'écran modifié. Le bord qui bouge s'accroche (si le
  // magnétisme est actif) aux guides, à la grille, aux bords, aux centres, aux autres éléments et à la disposition réelle
  // du parent (pistes de Grille, écart Flexbox). Alt : mouvement libre. Maj (poignée d'angle) : garder les proportions.
  // Éléments dont un geste a posé une taille en ligne (aperçu pendant le glissement) : la taille enregistrée vient ensuite du rendu,
  // et la mise à jour en place retire ces tailles provisoires (sinon elles masqueraient, par exemple, une annulation)
  var inlineTouched = [];
  function resizeStart(e, id, el, dir) {
    if (inlineTouched.indexOf(el) < 0) inlineTouched.push(el);
    e.preventDefault(); e.stopPropagation();
    var doc = frame.contentDocument;
    var start = { x: e.clientX, y: e.clientY, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height };
    var dim = doc.createElement("div"); dim.className = "pb-dim"; doc.body.appendChild(dim);
    gesture = true;
    var cur = { w: null, h: null };
    var origin = pageRect(el), env = snapEnv(el), raf = 0, last = null;
    // La mise en page décide où tombe le bord quand la taille change (case centrée dans sa piste de Grille, élément centré
    // dans une ligne Flexbox : le bord ne bouge que de moitié). Une mesure au départ donne ce rapport : le magnétisme vise
    // la position RÉELLE du bord, jamais une largeur qui le ferait tomber à côté.
    var slope = function (prop, key, grow) {
      var before = el.style[prop], b0 = el.getBoundingClientRect(), v0 = key === "w" ? b0.width : b0.height;
      el.style[prop] = (v0 + 10) + "px";
      var b1 = el.getBoundingClientRect(), moved = key === "w" ? b1.right - b0.right : b1.bottom - b0.bottom;
      el.style[prop] = before;
      return moved >= 1 && moved <= 10.5 ? moved / 10 : 1;
    };
    var sx = dir !== "s" ? slope("width", "w") : 1, sy = dir !== "e" ? slope("height", "h") : 1;
    var right0 = origin.left + origin.width, bottom0 = origin.top + origin.height;
    var edgeNow = function (axis) { var r = el.getBoundingClientRect(), w = frame.contentWindow; return axis === "x" ? r.right + w.scrollX : r.bottom + w.scrollY; };
    // Amène le bord EXACTEMENT sur la cible : la mise en page peut réagir autrement que prévu (Flexbox qui rétrécit les
    // éléments, bornes min / max). Quelques essais corrigés par la mesure réelle ; hors d'atteinte : pas d'accrochage (null)
    var fit = function (prop, axis, target, w, slope0, min) {
      var s = slope0, pw = null, pe = null;
      for (var k = 0; k < 5; k++) {
        w = Math.max(min, Math.round(w));
        el.style[prop] = w + "px";
        var e = edgeNow(axis), err = target - e;
        if (Math.abs(err) <= 0.6) return w;
        if (pw !== null && Math.abs(w - pw) > 0.01) { var m = (e - pe) / (w - pw); if (m > 0.05 && m < 1.5) s = m; }
        pw = w; pe = e;
        w += err / s;
      }
      return Math.abs(target - edgeNow(axis)) <= 1.5 ? w : null;
    };
    var step = function (ev) {
      var notes = [], hx = null, hy = null, w = null, hh = null;
      var ratio = start.h / Math.max(1, start.w);
      // La poignée suit le curseur : la taille varie de (déplacement ÷ rapport), pour que le BORD reste sous la souris
      if (dir !== "s") w = start.w + (ev.clientX - start.x) / sx;
      if (dir !== "e") hh = start.h + (ev.clientY - start.y) / sy;
      if (ev.shiftKey && dir === "se") { if (Math.abs(ev.clientX - start.x) >= Math.abs(ev.clientY - start.y)) hh = w * ratio; else w = hh / ratio; }
      if (w !== null) {
        hx = snapEdge(env, "x", right0 + sx * (w - start.w), ev);
        cur.w = Math.max(16, Math.round(w)); el.style.width = cur.w + "px";
        if (hx) { var fx = fit("width", "x", hx.v, cur.w, sx, 16); if (fx === null) hx = null; else cur.w = fx; }
        if (hx) notes.push(hx.label);
      }
      if (hh !== null) {
        hy = snapEdge(env, "y", bottom0 + sy * (hh - start.h), ev);
        cur.h = Math.max(8, Math.round(hh)); el.style.height = cur.h + "px";
        if (hy) { var fy = fit("height", "y", hy.v, cur.h, sy, 8); if (fy === null) hy = null; else cur.h = fy; }
        if (hy) notes.push(hy.label);
      }
      var r = pageRect(el), box = { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height };
      smartClear();
      if (!ev.altKey || !env.prefs.snap.on) { if (hx) drawSnapHit(env, hx, "x", box); if (hy) drawSnapHit(env, hy, "y", box); }
      drawDistances(env, box);
      dim.textContent = Math.round(r.width) + " × " + Math.round(r.height) + (notes.length ? " · calé : " + notes.join(", ") : "");
      dim.style.left = (r.left + r.width + 8) + "px"; dim.style.top = (r.top + r.height + 8) + "px";
    };
    // Un seul calcul par image affichée : la souris peut envoyer bien plus d'évènements
    var move = function (ev) { last = { clientX: ev.clientX, clientY: ev.clientY, shiftKey: ev.shiftKey, altKey: ev.altKey }; if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (last) step(last); }); };
    var up = function (ev) {
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); dim.remove();
      if (raf) { cancelAnimationFrame(raf); raf = 0; if (last) step(last); }
      smartClear();
      gesture = false;
      ignoreClickUntil = Date.now() + 250;
      // Une borne (largeur / hauteur min. ou max.) peut empêcher l'élément d'atteindre la taille demandée : écrire quand même cette taille
      // enregistrerait une valeur que la page n'affiche jamais. Elle n'est alors pas enregistrée (et l'utilisateur est prévenu).
      var limited = [];
      var csr = frame.contentWindow.getComputedStyle(el);
      if (csr.boxSizing === "border-box") {
        // Seule une borne min. / max. DÉCLARÉE explique une taille inatteignable (en Flexbox, la taille rendue peut aussi différer de la valeur : c'est normal)
        var par = el.parentElement;
        var bound = function (v, base) { if (!v || v === "none" || v === "auto") return null; if (/%$/.test(v)) return base ? parseFloat(v) * base / 100 : null; var n = parseFloat(v); return isFinite(n) ? n : null; };
        var over = function (req, min, max) { return (max !== null && req > max + 1.5) || (min !== null && req < min - 1.5); };
        if (cur.w !== null && over(cur.w, bound(csr.minWidth, par && par.clientWidth), bound(csr.maxWidth, par && par.clientWidth))) { limited.push("largeur"); cur.w = null; }
        if (cur.h !== null && over(cur.h, bound(csr.minHeight, par && par.clientHeight), bound(csr.maxHeight, par && par.clientHeight))) { limited.push("hauteur"); cur.h = null; }
      }
      if (cur.w === null && cur.h === null) { endGesture(); if (limited.length) toast("La " + limited.join(" et la ") + " demandée n'est pas atteignable (limite min. / max. de l'élément) : rien n'a été enregistré.", true); return; }
      // Unité d'origine conservée : un élément réglé en % (ou rem, em, vw, vh) reste fluide ; seul un élément sans valeur propre ou en mots-clés
      // (auto, fit-content…) reçoit des pixels. Le facteur px ↔ unité est mesuré sur l'élément lui-même au début du geste.
      var inUnit = function (key, px, startPx) {
        var it0 = byId(id), own = ownValue(it0, key), v = own !== undefined ? own : inheritedValue(it0, key);
        var m = typeof v === "string" ? /^(-?\d+(?:\.\d+)?)(%|rem|em|vw|vh)$/.exec(v) : null;
        if (!m || !(Number(m[1]) > 0) || !(startPx > 0)) return Math.round(px) + "px";
        var n = Math.round((px / (startPx / Number(m[1]))) * 100) / 100;
        return n + m[2];
      };
      change(function () {
        var s = styleSet(byId(id), device, "normal", true);
        if (cur.w !== null) s.width = inUnit("width", cur.w, start.w);
        if (cur.h !== null) s.height = inUnit("height", cur.h, start.h);
      });
      toast("Dimensions enregistrées pour l'écran « " + bpLabel(device) + " »." + (limited.length ? " (" + limited.join(" et ") + " limitée par un min. / max.)" : ""));
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
  }
  // ---------- Barre d'actions du canevas (posée sur l'élément sélectionné) ----------
  // Registre extensible : chaque action déclare son icône, son libellé, quand elle est indisponible et ce qu'elle fait ;
  // chaque type d'élément liste ses actions propres, complétées des actions communes selon le contexte.
  var canvasEl = function (id) { var doc = frame.contentDocument; return doc ? doc.querySelector('[data-node-id="' + id + '"],[data-section-id="' + id + '"]') : null; };
  var cbar = h("div", { class: "pb-cbar", role: "toolbar", "aria-label": "Actions sur la sélection", hidden: true });
  document.body.appendChild(cbar);
  var anyFlag = function (k) { return selectedItems().some(function (x) { return x[k]; }); };
  var CANVAS_ACTIONS = {
    parent: { icon: "arrowUp", label: "Sélectionner le parent", run: function (it) { var l = locate(it.id); if (l && l.parent) select(l.parent.id, false, { scroll: false }); } },
    move: { icon: "grip", label: "Déplacer : tirez vers un nouvel emplacement (ou Alt + ↑ / ↓)", drag: true },
    edit: { icon: "edit", label: "Modifier le texte (ou double-clic)", run: function (it) { startEdit(it.id); } },
    replace: { icon: "image", label: "Remplacer l'image", run: function (it) { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } },
    crop: { icon: "borderBox", label: "Recadrer : cadrage, point focal, proportions", run: function () { openInspector("style", "media"); } },
    settings: { icon: "sliders", label: "Réglages du contenu", run: function () { openInspector("content"); } },
    addCol: { icon: "plus", label: "Ajouter une colonne", off: function (it) { return kidsOf(it).length >= MAX_COLS; }, run: function (it) { addColumn(it.id); } },
    delCol: { icon: "minus", label: "Retirer la dernière colonne", off: function (it) { return kidsOf(it).length <= 1; }, run: function (it) { removeColumn(it.id); } },
    gridCol: { icon: "columns", label: "Ajouter une colonne à la grille", off: function (it) { return gridColumnsOf(it) >= 12; }, run: function (it) { gridSetColumns(it.id, gridColumnsOf(it) + 1); } },
    gridRow: { icon: "listPlus", label: "Ajouter une ligne", run: function (it) { gridAddRow(it.id); } },
    gridRowDel: { icon: "listMinus", label: "Retirer la dernière ligne", off: function (it) { return kidsOf(it).length <= gridColumnsOf(it); }, run: function (it) { gridRemoveRow(it.id); } },
    addInside: { icon: "plus", label: "Ajouter un élément à l'intérieur", run: function (it) { openCommands("Ajouter", { inside: it.id }); } },
    addSection: { icon: "listPlus", label: "Ajouter une section en dessous", run: function (it) { openCommands("Ajouter", { after: topOf(it.id).id }); } },
    restore: { icon: "undo", label: function () { var it = selectedItems()[0]; var n = it ? elementResetCount(it) : 0; return "Réinitialiser les modifications non enregistrées (" + plural(n, "réglage", "réglages") + ")"; }, run: function (it, btn) { resetElement(it, btn); } },
    saveStyle: { icon: "palette", label: "Enregistrer comme style : choisir les réglages à réutiliser", off: function (it) { return !canSaveStyle([it]); }, run: function (it) { saveStyleOf(byId(it.id) || it); } },
    duplicate: { icon: "copy", label: "Dupliquer (Ctrl/⌘ + D)", run: function () { duplicateSelected(); } },
    hide: { icon: function () { return anyFlag("hidden") ? "eye" : "eyeOff"; }, label: function () { return anyFlag("hidden") ? "Afficher (Ctrl/⌘ + Maj + H)" : "Masquer : reste dans la page et les calques (Ctrl/⌘ + Maj + H)"; }, pressed: function () { return anyFlag("hidden"); }, run: function () { setFlag(selection.slice(), "hidden", !anyFlag("hidden")); } },
    lock: { icon: "lock", label: function () { return anyFlag("locked") ? "Déverrouiller (Ctrl/⌘ + Maj + L)" : "Verrouiller : ni déplacé, ni modifié, ni supprimé (Ctrl/⌘ + Maj + L)"; }, pressed: function () { return anyFlag("locked"); }, run: function () { setFlag(selection.slice(), "locked", !anyFlag("locked")); } },
    remove: { icon: "trash", label: "Supprimer (Suppr) — Ctrl/⌘ + Z pour annuler", danger: true, run: function () { removeSelected(); } },
    more: { icon: "moreHorizontal", label: "Plus d'actions : copier, coller, style, grouper, ajouter…", run: function (it, btn) { var r = btn.getBoundingClientRect(); openMenu(r.left, r.bottom + 4); } },
  };
  var TEXTISH = ["edit"], SETTINGS = ["settings"];
  var TYPE_ACTIONS = { heading: TEXTISH, text: TEXTISH, button: TEXTISH, link: TEXTISH, quote: TEXTISH, image: ["replace", "crop"], video: SETTINGS, audio: SETTINGS, gallery: SETTINGS, accordion: SETTINGS, tabs: SETTINGS, table: SETTINGS, list: SETTINGS, countdown: SETTINGS, course: SETTINGS, icon: SETTINGS, code: SETTINGS,
    columns: ["addCol", "delCol"], grid: ["gridCol", "gridRow", "gridRowDel"], container: ["addInside"], column: ["addInside"], stack: ["addInside"], group: ["addInside"], layout: ["addInside", "addSection"], form: ["settings", "addSection"], legacy: ["settings", "addSection"], component: ["settings"] };
  var STRUCTURAL = ["layout", "container", "columns", "column", "grid", "stack", "group"];
  function canvasActionsFor(items) {
    if (!items.length || !canWrite) return [];
    if (items.length > 1) return ["duplicate", "hide", "lock", "remove", "more"];
    var it = items[0], l = locate(it.id);
    if (it.locked) return ["lock", "more"];
    if (lockedDeep(it.id)) return l.parent ? ["parent", "more"] : ["more"];
    var key = isNode(it) ? it.type : it.type === "layout" || it.type === "component" || it.type === "form" ? it.type : "legacy";
    var list = (l.parent ? ["parent"] : []).concat(isNode(it) ? ["move"] : []).concat(TYPE_ACTIONS[key] || []).concat(isNode(it) && PAGE.siteSettingsUrl ? ["saveStyle"] : []).concat(elementResetCount(it) ? ["restore"] : []).concat(["duplicate", "hide"]);
    if (STRUCTURAL.indexOf(it.type) >= 0 || !isNode(it)) list.push("lock");
    return list.concat(["remove", "more"]);
  }
  var val = function (v) { return typeof v === "function" ? v() : v; };
  function buildCanvasBar(acts, it) {
    cbar.textContent = "";
    acts.forEach(function (k) {
      var a = CANVAS_ACTIONS[k];
      var label = val(a.label);
      var b = h("button", { type: "button", class: "pb-cbar-btn" + (a.danger ? " is-danger" : ""), "data-action": k, "aria-label": label, "data-tip": label, "aria-pressed": a.pressed ? String(a.pressed()) : null, disabled: a.off && a.off(it) ? true : null }, icon(val(a.icon)));
      if (a.drag) {
        b.setAttribute("draggable", "true");
        b.addEventListener("dragstart", function (e) { dragIds = selection.slice(); dragNew = null; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move"); hideTip(); });
      } else b.addEventListener("click", function (e) { e.preventDefault(); hideTip(); a.run(it, b); });
      cbar.appendChild(b);
    });
  }
  // Position : au-dessus de l'élément (bord droit), en dessous s'il n'y a pas la place ; masquée hors de la zone visible
  var barSizes = {};
  function placeCanvasBar(pre) {
    if (!cbar) return; // appel pendant l'initialisation
    if (mode === "structure") { cbar.hidden = true; return; }
    var items = selectedItems();
    var acts = editing || gesture || tool === "hand" ? [] : canvasActionsFor(items);
    var el = acts.length ? canvasEl(selection[0]) : null;
    if (!el) { cbar.hidden = true; return; }
    var key = selection.join(",") + "|" + acts.join(",") + "|" + items.map(function (x) { return (x.hidden ? "h" : "") + (x.locked ? "l" : "") + ((kidsOf(x) || []).length); }).join(",") + "|" + device;
    if (cbar.dataset.key !== key) { buildCanvasBar(acts, items[0]); cbar.dataset.key = key; }
    var g = pre && pre.r ? pre : null, fr = g ? g.fr : frame.getBoundingClientRect(), sr = g ? g.sr : stage.getBoundingClientRect(), r = g ? g.r : el.getBoundingClientRect();
    var top = fr.top + r.top * zoom, bottom = fr.top + r.bottom * zoom, right = fr.left + r.right * zoom;
    if (bottom < sr.top + 8 || top > sr.bottom - 8 || !r.width) { cbar.hidden = true; return; }
    // Taille de la barre : ne dépend que de son jeu d'actions ; mesurée une fois (affichée), puis relue dans le cache (pas de mise en page forcée à chaque sélection)
    var sizeKey = acts.join(",") + "|" + device, size = barSizes[sizeKey];
    cbar.hidden = false;
    if (!size) size = barSizes[sizeKey] = [cbar.offsetWidth, cbar.offsetHeight];
    var bw = size[0], bh = size[1];
    // Au-dessus si possible. Sinon : un conteneur qui a des enfants reçoit la barre EN DESSOUS (elle ne recouvre jamais ses
    // enfants) ; un élément vide ou sans enfants, assez grand, la reçoit dans son coin haut (on ne cache pas son voisin) ;
    // sinon en dessous ; en dernier recours en haut de la zone visible
    var y = top - bh - 6;
    if (y < sr.top + 4) {
      var hasKids = (kidsOf(items[0]) || []).length > 0;
      var fitsBelow = bottom + 6 + bh < sr.bottom;
      if (hasKids && fitsBelow) y = bottom + 6;
      else if (bottom - top >= bh * 2.5) y = Math.max(top, sr.top) + 4;
      else y = fitsBelow ? bottom + 6 : sr.top + 4;
    }
    var x = Math.min(Math.max(right - bw, sr.left + 4), sr.right - bw - 4);
    cbar.style.left = Math.round(x) + "px"; cbar.style.top = Math.round(y) + "px";
  }
  stage.addEventListener("scroll", placeCanvasBar, { passive: true });
  window.addEventListener("resize", function () { barSizes = {}; placeCanvasBar(); });
  // Ouvrir l'inspecteur sur un onglet (et un groupe de réglages déplié)
  function openInspector(tab, group) {
    if (panels.rightHidden) togglePanel("right");
    inspTab = tab; store.set("insp-tab", tab);
    if (group) { store.set("open-" + group, true); pendingReveal = group; }
    renderInspector();
    var target = group ? $("[data-pb-inspector] details[data-group='" + group + "']") : $("[data-pb-inspector] .pb-insp-body");
    if (target) { scrollInside(target); var f = target.querySelector("input, select, textarea, button"); if (f) f.focus({ preventScroll: true }); }
  }

  // Outil « main » : faire défiler la page en la glissant
  function panStart(e) {
    e.preventDefault();
    var win = frame.contentWindow, doc = frame.contentDocument;
    var sx = e.clientX, sy = e.clientY, oy = win.scrollY, sl = stage.scrollLeft;
    var move = function (ev) { win.scrollTo(0, oy - (ev.clientY - sy)); stage.scrollLeft = sl - (ev.clientX - sx) * zoom; };
    var up = function () { doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up); doc.body.classList.remove("is-panning"); };
    doc.body.classList.add("is-panning"); // curseur « main fermée » pendant le déplacement
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
  }

  // ---------- Mode « Structure » : le même document, présenté comme une suite de blocs éditables ----------
  // Aucun second document : chaque saisie passe par setProp / change (historique, sauvegarde, calques, inspecteur et
  // canevas suivent). Entrée en fin de titre ou de texte crée un paragraphe après ; Retour arrière dans un bloc de
  // texte vide le supprime ; « + » entre deux blocs ouvre l'insertion à cet endroit ; la poignée déplace le bloc.
  var mode = store.get("mode", "visual");
  var docEl = $("[data-pb-doc]");
  var docFocus = null; // { id, field, end } : curseur à rendre après un redessin
  // Passer en « Structure » masque le canevas (display:none) : le navigateur oublie alors son défilement. On retient la vue en quittant
  // le mode Visuel et on la rétablit au retour (sinon la page repartait toujours tout en haut).
  var visualView = null;
  function setMode(m) {
    if (editing) commitEdit();
    var next = m === "structure" ? "structure" : "visual";
    if (mode === "visual" && next === "structure") { try { visualView = { y: frame.contentWindow.scrollY, sl: stage.scrollLeft, st: stage.scrollTop }; } catch (e) { visualView = null; } }
    mode = next;
    store.set("mode", mode);
    $$("[data-pb-mode]").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.pbMode === mode)); });
    $("[data-pb-canvas]").classList.toggle("is-structure", mode === "structure");
    docEl.hidden = mode !== "structure";
    if (mode === "structure") renderDoc();
    else {
      applyZoom();
      if (visualView) { try { frame.contentWindow.scrollTo(0, visualView.y); stage.scrollLeft = visualView.sl; stage.scrollTop = visualView.st; } catch (e) { /* cadre pas encore prêt : il se positionnera à son chargement */ } visualView = null; }
      requestAnimationFrame(function () { drawOverlays(); drawRulers(); drawGuides(); });
    }
    placeCanvasBar();
  }
  $$("[data-pb-mode]").forEach(function (b) { b.addEventListener("click", function () { setMode(b.dataset.pbMode); }); });
  var blockIcon = function (it) { return isNode(it) ? NT[it.type].icon : it.type === "layout" ? "layout" : it.type === "component" ? "copy" : "fileText"; };
  function blockSummary(it) {
    var p = it.props || {};
    switch (it.type) {
      case "gallery": return (p.images || []).length + " image(s)";
      case "accordion": return (p.items || []).length + " question(s) : " + (p.items || []).map(function (x) { return x.q; }).join(" · ");
      case "tabs": return (p.items || []).length + " onglet(s) : " + (p.items || []).map(function (x) { return x.title; }).join(" · ");
      case "table": return (p.rows || []).length + " ligne(s) × " + ((p.rows || [])[0] || []).length + " colonne(s)";
      case "countdown": return "Jusqu'au " + (p.until ? new Date(p.until).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "—");
      case "course": var c = (boot.courses || []).find(function (x) { return x.id === p.courseId; }); return c ? c.title : "Formation";
      case "courserating": var cr = (boot.courses || []).find(function (x) { return x.id === p.courseId; }); return "Avis · " + (cr ? cr.title : "formation");
      case "addtocart": var ac = (boot.courses || []).find(function (x) { return x.id === p.courseId; }); return (p.label || "Acheter") + " · " + (ac ? ac.title : "formation");
      case "spacer": return "Espace de " + p.size + " px";
      case "divider": return "Ligne de séparation";
      case "icon": return "Icône « " + p.name + " », " + p.size + " px";
      case "map": return "Carte : " + p.address;
      case "imagebox": case "iconbox": return p.title;
      case "sitelogo": return "Logo du site";
      case "sitetitle": return "Titre du site";
      case "postcontent": return "Contenu de l'article";
      case "catfilter": return "Filtre : " + (p.source === "courses" ? "formations" : "articles");
      case "copyright": return "© " + (p.owner || "nom du site") + (p.text ? ". " + p.text : "");
      case "animatedheading": return [p.before, (p.words || []).join(" / "), p.after].filter(Boolean).join(" ");
      case "flipbox": return p.frontTitle;
      case "pricelist": return (p.items || []).length + " ligne(s) : " + (p.items || []).map(function (x) { return x.title; }).join(" · ");
      case "toc": return p.title + " (titres 2 à " + p.depth + ")";
      case "readingprogress": return "Barre de lecture " + (p.position === "bottom" ? "en bas" : "en haut");
      case "signupform": var sf = (boot.forms || []).find(function (f) { return f.id === p.formId; }); return "Formulaire : " + (sf ? sf.name : "introuvable");
      case "rating": return (p.title ? p.title + " · " : "") + String(p.value).replace(".", ",") + "/" + p.scale;
      case "menuanchor": return "#" + (it.anchor || "");
      case "badge": return p.text;
      case "timeline": return (p.items || []).length + " étape(s) : " + (p.items || []).map(function (x) { return x.title; }).join(" · ");
      case "progress": return p.label + " : " + p.value + " %";
      case "menu": return (p.items || []).map(function (x) { return x.label; }).join(" · ");
      case "carousel": return (p.images || []).length + " image(s)";
      case "toggle": return p.title;
      case "alert": return (p.title ? p.title + " — " : "") + String(p.text || "").slice(0, 80);
      case "counter": return (p.prefix || "") + p.value + (p.suffix || "") + " · " + p.label;
      case "testimonial": return p.name + " : « " + String(p.text || "").slice(0, 60) + " »";
      case "pricing": return p.title + " · " + p.price + (p.period ? " " + p.period : "");
      case "breadcrumb": return (p.items || []).map(function (x) { return x.label; }).join(" › ");
      case "social": return (p.items || []).map(function (x) { return x.network; }).join(" · ");
      case "sharebuttons": return (p.networks || []).join(" · ");
      case "modal": return "Bouton « " + p.buttonLabel + " » → " + p.title + (p.position && p.position !== "center" ? " (panneau latéral)" : "");
      case "html": return String(p.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
      case "embed": return p.title + " · " + p.url;
      case "iconlist": return (p.items || []).map(function (x) { return x.text; }).join(" · ");
      case "tooltip": return p.text + " → " + p.tip;
      case "hotspot": return (p.spots || []).length + " point(s) d'intérêt";
      case "posts": return p.count + " dernier(s) article(s)" + (p.category ? " · " + p.category : "");
      case "courselist": return p.count + " formation(s)" + (p.category ? " · " + p.category : "");
      case "search": return "Recherche dans " + (p.target === "blog" ? "le blog" : "le catalogue");
      case "account": return "Connexion / compte" + (p.showCart ? " + panier" : "");
      case "dyntext": return (p.before || "") + "[" + p.source + "]" + (p.after || "");
      case "audio": return p.title || p.src || "";
      case "component": return "Composant synchronisé : le modifier change toutes ses utilisations";
      default: return preview(it) || "";
    }
  }
  // Champ éditable du bloc (contenteditable) : chaque frappe = une modification « légère » (une étape d'annulation par champ)
  function editable(it, field, html, cls, opts) {
    opts = opts || {};
    var dis = lockedDeep(it.id) || !canWrite;
    var el = h("div", { class: "pb-blk-edit " + (cls || ""), contenteditable: dis ? "false" : opts.rich ? "true" : "plaintext-only", role: "textbox", "aria-multiline": opts.rich ? "true" : "false", "aria-label": opts.label || field, "data-field": field, "data-placeholder": opts.placeholder || "", spellcheck: "true" });
    if (opts.rich) el.innerHTML = html || ""; else el.textContent = html || "";
    el.addEventListener("input", function () {
      var v = opts.rich ? el.innerHTML : el.textContent.replace(/\n/g, " ");
      if (opts.write) opts.write(v); else setProp(it.id, field, v, { key: it.id + ":" + field, light: true });
    });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey && (!opts.rich || atEnd(el))) {
        if (opts.rich && !atEnd(el)) return;
        e.preventDefault();
        if (opts.noSplit) return;
        newParagraphAfter(it.id);
      } else if (e.key === "Backspace" && !el.textContent.trim() && opts.removable) {
        e.preventDefault();
        var prev = prevEditable(it.id);
        removeItems([it.id]);
        if (prev) { docFocus = { id: prev.id, field: prev.field, end: true }; restoreDocFocus(); }
      }
    });
    el.addEventListener("paste", function (e) {
      if (opts.rich) return; // texte riche : nettoyé par le serveur (liste blanche)
      e.preventDefault();
      var t = (e.clipboardData || window.clipboardData).getData("text/plain").replace(/\s+/g, " ");
      document.execCommand("insertText", false, t);
    });
    return el;
  }
  function atEnd(el) {
    var s = window.getSelection();
    if (!s.rangeCount) return false;
    var r = s.getRangeAt(0).cloneRange();
    r.selectNodeContents(el); r.setStart(s.getRangeAt(0).endContainer, s.getRangeAt(0).endOffset);
    return !r.toString().length;
  }
  // Entrée en fin de bloc : un paragraphe vide juste après (dans le même parent), curseur dedans
  function newParagraphAfter(id) {
    var l = locate(id);
    if (!l || !canWrite) return;
    var n = newNode("text", { props: { html: "" } });
    var at = l.parent || isNode(l.item) ? { parent: l.parent, index: l.index + 1 } : { parent: null, index: sectionIndex(l.item) + 1 };
    if (at.parent && lockedDeep(at.parent.id)) return;
    change(function () { if (!insertInto(at.parent, at.index, [n])) return false; selection = [n.id]; });
    docFocus = { id: n.id, field: "html" };
    restoreDocFocus();
  }
  // Bloc éditable précédent (ordre de lecture), pour y remettre le curseur
  function prevEditable(id) {
    var order = [];
    walk(function (x) { if (["heading", "text", "quote"].indexOf(x.type) >= 0 && isNode(x)) order.push(x); });
    var i = order.findIndex(function (x) { return x.id === id; });
    var p = i > 0 ? order[i - 1] : null;
    return p ? { id: p.id, field: p.type === "text" ? "html" : "text" } : null;
  }
  function restoreDocFocus() {
    if (!docFocus || mode !== "structure") return;
    var f = docFocus; docFocus = null;
    var el = docEl.querySelector('.pb-blk[data-id="' + f.id + '"] [data-field="' + f.field + '"]');
    if (!el) return;
    el.focus();
    if (el.isContentEditable) { var r = document.createRange(); r.selectNodeContents(el); r.collapse(!f.end ? true : false); if (f.end) r.collapse(false); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  }
  function blockInput(it, field, label, value, opts) {
    opts = opts || {};
    var id = fid();
    var inp = h("input", { id: id, type: opts.type || "text", value: value || "", placeholder: opts.placeholder || "", disabled: lockedDeep(it.id) || !canWrite, list: opts.list || null, maxlength: opts.max ? String(opts.max) : null, "data-field": field, autocomplete: "off" });
    inp.addEventListener("input", function () { if (opts.write) opts.write(inp.value); else setProp(it.id, field, inp.value, { key: it.id + ":" + field, light: true }); });
    return h("label", { class: "pb-blk-inp", for: id }, h("span", { text: label }), inp);
  }
  function blockBody(it) {
    var p = it.props || {};
    var dis = lockedDeep(it.id) || !canWrite;
    if (it.type === "heading" && isNode(it)) return editable(it, "text", p.text, "is-h" + p.level, { label: "Titre", placeholder: "Titre…" });
    if (it.type === "text" && isNode(it)) return editable(it, "html", p.html, "is-text", { rich: true, label: "Paragraphe", placeholder: "Écrivez… (Entrée en fin de texte : nouveau paragraphe)", removable: true });
    if (it.type === "quote" && isNode(it)) return h("div", { class: "pb-blk-quote" }, editable(it, "text", p.text, "is-quote", { label: "Citation", placeholder: "Citation…", noSplit: true }), blockInput(it, "author", "Auteur", p.author, { max: 100 }));
    if ((it.type === "button" || it.type === "link") && isNode(it)) return h("div", { class: "pb-blk-row" }, blockInput(it, "label", "Texte", p.label, { max: 80 }), blockInput(it, "url", "Adresse", p.url, { list: "pb-links", placeholder: "/catalogue ou https://…" }));
    if (it.type === "video" && isNode(it)) return h("div", { class: "pb-blk-row" }, blockInput(it, "url", "Adresse de la vidéo", p.url, { type: "url" }), blockInput(it, "title", "Titre", p.title, { max: 150 }));
    if (it.type === "list" && isNode(it)) {
      var ta = h("textarea", { rows: String(Math.max(2, (p.items || []).length)), disabled: dis, "aria-label": "Points de la liste (un par ligne)", "data-field": "items" });
      ta.value = (p.items || []).join("\n");
      ta.addEventListener("input", function () { setProp(it.id, "items", ta.value.split("\n"), { key: it.id + ":items", light: true }); });
      return h("div", { class: "pb-blk-list" + (p.ordered ? " is-ordered" : "") }, ta);
    }
    if (it.type === "code" && isNode(it)) {
      var code = h("textarea", { rows: "4", class: "is-code", disabled: dis, "aria-label": "Texte affiché tel quel", "data-field": "text" });
      code.value = p.text || "";
      code.addEventListener("input", function () { setProp(it.id, "text", code.value, { key: it.id + ":text", light: true }); });
      return code;
    }
    if (it.type === "image" && isNode(it)) {
      return h("div", { class: "pb-blk-media" }, h("img", { src: p.src, alt: "", class: "pb-blk-img" }),
        h("div", { class: "pb-blk-media-side" }, blockInput(it, "alt", "Texte de remplacement", p.alt, { max: 200, write: function (v) { change(function () { var x = byId(it.id); x.props.alt = v; if (v) delete x.props.decorative; else x.props.decorative = true; }, { key: it.id + ":alt", light: true }); } }),
          h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis, onclick: function () { openMedia({ title: "Remplacer l'image", onPick: function (m) { change(function () { var x = byId(it.id); x.props.src = m.path; if (m.alt && !x.props.alt) { x.props.alt = m.alt; delete x.props.decorative; } }); } }); } }, "Remplacer l'image")));
    }
    // Sections prêtes : leurs textes principaux s'écrivent ici (mêmes champs que l'inspecteur) ; le reste à droite
    if (!isNode(it) && F[it.type]) {
      var flds = F[it.type].filter(function (f) { return ["text", "textarea", "markdown", "lines"].indexOf(f[1]) >= 0; }).slice(0, 4);
      if (flds.length) {
        var wrap = h("div", { class: "pb-blk-legacy" });
        flds.forEach(function (f) {
          var key = f[0];
          if (f[1] === "text") { wrap.appendChild(blockInput(it, key, f[2], it[key], { max: f[3] })); return; }
          var lines = f[1] === "lines";
          var ta = h("textarea", { rows: String(f[1] === "markdown" ? 5 : 3), disabled: dis, "aria-label": f[2], "data-field": key, maxlength: f[3] ? String(f[3]) : null });
          ta.value = lines ? (it[key] || []).join("\n") : it[key] || "";
          ta.addEventListener("input", function () { setProp(it.id, key, lines ? ta.value.split("\n") : ta.value, { key: it.id + ":" + key, light: true }); });
          wrap.appendChild(h("label", { class: "pb-blk-inp" }, h("span", { text: f[2] + (f[1] === "markdown" ? " (gras **…**, liens [texte](adresse))" : "") }), ta));
        });
        if (F[it.type].length > flds.length) wrap.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm pb-blk-more", onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); openInspector("content"); } }, "Autres réglages (image, bouton, éléments…)"));
        return wrap;
      }
    }
    // Autres éléments : résumé réel + réglages dans l'inspecteur
    var summary = isNode(it) || it.type === "component" ? blockSummary(it) : (it.heading || it.title || it.label || preview(it) || "");
    return h("div", { class: "pb-blk-summary" }, h("span", { text: summary || "—" }), h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); openInspector("content"); } }, "Modifier"));
  }
  function inserter(anchor, label) {
    return h("div", { class: "pb-ins" }, h("button", { type: "button", class: "pb-ins-btn", disabled: !canWrite, "aria-label": label, "data-tip": label, onclick: function (e) { e.stopPropagation(); openCommands("Ajouter", anchor); } }, icon("plus")));
  }
  function docBlock(it) {
    var kids = kidsOf(it);
    var l = locate(it.id);
    var dis = lockedDeep(it.id) || !canWrite;
    var schema = inspectorFor(it);
    var tool = function (ic, label, fn, off, cls) { return h("button", { type: "button", class: "pb-blk-tool" + (cls ? " " + cls : ""), "aria-label": label, "data-tip": label, disabled: off || null, onclick: function (e) { e.stopPropagation(); select(it.id, false, { scroll: false }); fn(); } }, icon(ic)); };
    var level = it.type === "heading" && isNode(it) ? h("select", { class: "pb-blk-level", "aria-label": "Niveau du titre", disabled: dis, onchange: function (e) { setProp(it.id, "level", e.target.value); } }, ["1", "2", "3", "4", "5", "6"].map(function (n) { return h("option", { value: n, text: "H" + n }); })) : null;
    if (level) level.value = String(it.props.level);
    var morph = isNode(it) && TRANSFORMABLE[it.type] && !dis ? h("select", { class: "pb-blk-level pb-blk-morph", "aria-label": "Transformer ce bloc en", "data-tip": "Transformer ce bloc", onchange: function (e) { var v = e.target.value; e.target.value = ""; if (v) transformNode(it.id, v); } }, [h("option", { value: "", text: "Transformer…" })].concat(Object.keys(TRANSFORMABLE).filter(function (k) { return k !== it.type; }).map(function (k) { return h("option", { value: k, text: TRANSFORMABLE[k] }); }))) : null;
    var grip = h("span", { class: "pb-blk-grip", draggable: dis ? "false" : "true", "aria-hidden": "true", title: "Glisser pour déplacer" }, icon("grip"));
    grip.addEventListener("dragstart", function (e) { e.stopPropagation(); dragIds = selection.indexOf(it.id) >= 0 ? selection.slice() : [it.id]; dragNew = null; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "pb-move"); });
    var head = h("div", { class: "pb-blk-head" }, grip, icon(blockIcon(it)), h("span", { class: "pb-blk-kind", text: schema.kind }), it.name ? h("span", { class: "pb-blk-name", text: it.name }) : null,
      it.hidden ? h("span", { class: "pb-blk-badge", text: "Masqué" }) : null, it.locked ? h("span", { class: "pb-blk-badge", text: "Verrouillé" }) : null, it.audience ? h("span", { class: "pb-blk-badge is-aud", text: "Public ciblé" }) : null,
      h("span", { class: "pb-blk-grow" }), morph, level,
      h("span", { class: "pb-blk-tools" },
        tool("arrowUp", "Monter (Alt + ↑)", function () { nudge(-1); }, dis || l.index === 0),
        tool("arrowDown", "Descendre (Alt + ↓)", function () { nudge(1); }, dis || l.index === l.list.length - 1),
        tool("copy", "Dupliquer (Ctrl/⌘ + D)", function () { duplicateSelected(); }, !canWrite),
        tool(it.hidden ? "eye" : "eyeOff", it.hidden ? "Afficher" : "Masquer", function () { setFlag([it.id], "hidden", !it.hidden); }, !canWrite),
        tool("trash", "Supprimer (Ctrl/⌘ + Z pour annuler)", function () { removeItems([it.id]); }, dis, "is-danger"),
        tool("moreHorizontal", "Plus d'actions", function () { var r = head.getBoundingClientRect(); openMenu(r.right - 220, r.bottom); }, false)));
    var el = h("div", { class: "pb-blk" + (kids ? " is-box" : "") + (it.hidden ? " is-hidden" : "") + (selection.indexOf(it.id) >= 0 ? " is-selected" : ""), "data-id": it.id, "data-type": it.type, tabindex: "-1" }, head);
    if (!kids) el.appendChild(h("div", { class: "pb-blk-body" }, blockBody(it)));
    else {
      var list = h("div", { class: "pb-blk-kids" });
      if (!kids.length) list.appendChild(h("button", { type: "button", class: "pb-blk-empty", disabled: dis, "data-drop-inside": it.id, onclick: function (e) { e.stopPropagation(); openCommands("Ajouter", { inside: it.id }); } }, icon("plus"), it.type === "column" ? "Colonne vide : ajouter un élément" : "Vide : ajouter un élément"));
      kids.forEach(function (c, i) { if (i === 0 && !dis) list.appendChild(inserter({ before: c.id }, "Insérer un élément ici")); list.appendChild(docBlock(c)); if (!dis) list.appendChild(inserter({ after: c.id }, "Insérer un élément ici")); });
      el.appendChild(list);
    }
    return el;
  }
  function renderDoc() {
    if (mode !== "structure") return;
    var keep = docEl.scrollTop;
    var active = document.activeElement && docEl.contains(document.activeElement) ? document.activeElement : null;
    if (active && !docFocus) { var b = active.closest(".pb-blk"); if (b && active.dataset.field) docFocus = { id: b.dataset.id, field: active.dataset.field, end: true }; }
    docEl.textContent = "";
    var page = h("div", { class: "pb-doc-page" });
    page.appendChild(h("div", { class: "pb-doc-head" }, h("p", { class: "pb-kind", text: "Structure de la page" }), h("h2", { text: content.title || PAGE.name }),
      h("p", { class: "pb-hint", text: content.sections.length + " section(s). Écrivez directement dans les blocs ; « + » insère un élément ; la poignée ⠿ déplace ; les styles se règlent à droite. Même page que le mode Visuel." })));
    if (!content.sections.length) page.appendChild(h("p", { class: "pb-hint", text: "Page vide." }));
    content.sections.forEach(function (s, i) { if (i === 0 && canWrite) page.appendChild(inserter({ before: s.id }, "Insérer une section ici")); page.appendChild(docBlock(s)); if (canWrite) page.appendChild(inserter({ after: s.id }, "Insérer une section ici")); });
    if (canWrite) page.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm pb-doc-add", onclick: function () { openCommands("Ajouter"); } }, icon("plus"), "Ajouter un bloc en fin de page"));
    docEl.appendChild(page);
    docEl.scrollTop = keep;
    restoreDocFocus();
  }
  function markDocSelection(scroll) {
    if (mode !== "structure") return;
    $$(".pb-blk.is-selected", docEl).forEach(function (b) { b.classList.remove("is-selected"); });
    selection.forEach(function (id) { var b = docEl.querySelector('.pb-blk[data-id="' + id + '"]'); if (b) b.classList.add("is-selected"); });
    if (scroll && selection.length) { var f = docEl.querySelector('.pb-blk[data-id="' + selection[0] + '"]'); scrollInside(f, true); }
  }
  // Sélection : un clic sur un bloc (ou dans un de ses champs) le sélectionne — inspecteur et calques suivent
  docEl.addEventListener("mousedown", function (e) {
    var b = e.target.closest(".pb-blk");
    if (!b || e.target.closest(".pb-blk-tool, .pb-ins-btn, .pb-blk-empty")) return;
    // Clic hors d'un champ : le bloc prend le clavier (Suppr, Ctrl/⌘ + D, Alt + ↑ / ↓… s'appliquent à lui)
    var onField = e.target.closest("input, textarea, select, [contenteditable='true'], [contenteditable='plaintext-only'], button");
    if (!onField) setTimeout(function () { var again = docEl.querySelector('.pb-blk[data-id="' + b.dataset.id + '"]'); if (again) again.focus({ preventScroll: true }); }, 0);
    if (selection.length === 1 && selection[0] === b.dataset.id && !(e.shiftKey || e.metaKey || e.ctrlKey)) return;
    select(b.dataset.id, e.shiftKey || e.metaKey || e.ctrlKey, { scroll: false });
  });
  docEl.addEventListener("focusin", function (e) {
    var b = e.target.closest(".pb-blk");
    if (b && selection.indexOf(b.dataset.id) < 0) select(b.dataset.id, false, { scroll: false });
  });
  // Glisser-déposer : avant / après un bloc (moitié haute / basse), ou dans un conteneur vide
  var docDrop = null;
  function clearDocDrop() { $$(".is-drop-before, .is-drop-after, .is-drop-inside", docEl).forEach(function (x) { x.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); docDrop = null; }
  docEl.addEventListener("dragover", function (e) {
    if (!dragIds && !dragNew) return;
    clearDocDrop();
    var empty = e.target.closest("[data-drop-inside]");
    if (empty) { var box = byId(empty.dataset.dropInside); if (box && !lockedDeep(box.id)) { e.preventDefault(); empty.classList.add("is-drop-inside"); docDrop = { parent: box, index: 0 }; } return; }
    var b = e.target.closest(".pb-blk");
    if (!b) return;
    var l = locate(b.dataset.id);
    if (!l || (dragIds && dragIds.some(function (id) { return id === l.item.id || l.ancestors.some(function (a) { return a.id === id; }); }))) return;
    if (l.parent && lockedDeep(l.parent.id)) return;
    var r = b.getBoundingClientRect();
    var after = e.clientY > r.top + Math.min(r.height / 2, 40);
    e.preventDefault();
    b.classList.add(after ? "is-drop-after" : "is-drop-before");
    docDrop = { parent: l.parent, index: l.index + (after ? 1 : 0) };
  });
  docEl.addEventListener("dragleave", function (e) { if (!docEl.contains(e.relatedTarget)) clearDocDrop(); });
  docEl.addEventListener("drop", function (e) {
    if (!docDrop) return;
    e.preventDefault();
    var t = docDrop; clearDocDrop();
    performDrop(t);
  });

  // ---------- Écrans, zoom, aides visuelles ----------
  // Largeur de la page affichée dans le cadre (px CSS de la page). Tablette et mobile : largeur d'appareil fixe. Ordinateur :
  // largeur FLUIDE = l'espace réellement disponible dans le canevas (fenêtre − panneaux), jamais sous le point de rupture
  // « tablette » du site (sinon le cadre afficherait la mise en page tablette) ni au-dessus d'un plafond confortable. Si l'espace
  // est plus étroit que le minimum, la page garde ce minimum et le zoom « ajuster » la réduit pour qu'elle tienne.
  var WIDTH = { desktop: 1280, tablet: 820, mobile: 390, wide: 1920 }; // largeur nominale : repli, et valeur des appareils (grand écran : son point de rupture, réglable dans les réglages du site)
  function wideFrom() { var w = PAGE.breakpoints && PAGE.breakpoints.wide; return Number.isInteger(w) ? w : 1920; }
  function desktopMax() { return wideFrom() - 1; } // le cadre « ordinateur » reste sous le seuil du grand écran (sinon il afficherait la mise en page grand écran)
  var STAGE_PAD = 48; // 24 px de chaque côté de la surface de travail
  WIDTH.wide = wideFrom();
  var shownWidth = WIDTH.desktop;
  function desktopMin() { var bp = PAGE.breakpoints && PAGE.breakpoints.tablet; return (Number.isInteger(bp) ? bp : 1023) + 1; }
  function frameWidth(avail) {
    if (device === "wide") return wideFrom();
    if (device !== "desktop") return WIDTH[device];
    var target = zoomFit ? avail : Math.floor(avail / zoom);
    return Math.min(desktopMax(), Math.max(desktopMin(), target));
  }
  function setDevice(d) {
    if (editing) commitEdit();
    selectedGuide = null;
    device = d;
    notifyRules();
    $$(".pb-top .pb-devices button").forEach(function (b) { b.setAttribute("aria-checked", String(b.dataset.device === d)); });
    wrap.dataset.device = d;
    applyZoom();
    renderInspector(); renderContext();
    requestAnimationFrame(function () { drawOverlays(); drawGuides(); drawRulers(); refreshInfo(); });
  }
  $$(".pb-top .pb-devices button").forEach(function (b) { b.addEventListener("click", function () { setDevice(b.dataset.device); }); });
  var MAX_ZOOM = 4; // 400 %
  function applyZoom() {
    var avail = Math.max(240, stage.clientWidth - STAGE_PAD);
    var w = frameWidth(avail);
    shownWidth = w;
    if (zoomFit) zoom = Math.min(1, Math.max(0.25, Math.floor(avail / w * 100) / 100));
    var hgt = Math.max(400, (stage.clientHeight - STAGE_PAD) / zoom);
    wrap.style.width = w + "px";
    wrap.style.height = hgt + "px";
    wrap.style.transform = "scale(" + zoom + ")";
    // La boîte de mise en page garde sa taille d'origine malgré le zoom : on la recentre et on retire l'excédent à droite et en bas
    wrap.style.marginLeft = Math.max(0, (avail - w * zoom) / 2) + "px";
    wrap.style.marginRight = -((1 - zoom) * w) + "px";
    wrap.style.marginBottom = -((1 - zoom) * hgt) + "px";
    $("[data-pb-zoom-value]").textContent = Math.round(zoom * 100) + " %";
    $$("[data-pb-zoom]").forEach(function (b) { var v = b.dataset.pbZoom; b.disabled = (v === "-" && zoom <= 0.25) || (v === "+" && zoom >= MAX_ZOOM); });
    drawRulers();
    refreshInfo();
    placeCanvasBar();
  }
  // Recalcul de la zone du canevas (largeur du cadre, zoom, règles, barre d'actions) : au plus UN par image, quel que soit le nombre de causes
  // (glisser d'une poignée de panneau, observateur de taille, redimensionnement de la fenêtre)
  // Pendant le glissement d'une poignée de panneau, le recalcul (qui refait la mise en page de toute la page du cadre à chaque nouvelle largeur) est limité
  // à ~11 par seconde : le bord du panneau suit la main à chaque image, le canevas se met à jour en continu mais pas à chaque pixel ; au relâchement,
  // un dernier recalcul exact est fait.
  var zoomQueued = false, panelDragging = false, lastZoomAt = 0;
  function queueZoom() {
    if (zoomQueued) return;
    zoomQueued = true;
    requestAnimationFrame(function run() {
      if (panelDragging && performance.now() - lastZoomAt < 90) { requestAnimationFrame(run); return; }
      zoomQueued = false; lastZoomAt = performance.now();
      if (zoomFit) applyZoom(); else drawRulers();
    });
  }
  function setZoom(z) { zoomFit = z === "fit"; if (!zoomFit) zoom = Math.min(MAX_ZOOM, Math.max(0.25, z)); applyZoom(); requestAnimationFrame(function () { drawOverlays(); drawGuides(); }); }
  $$("[data-pb-zoom]").forEach(function (b) { b.addEventListener("click", function () { var v = b.dataset.pbZoom; setZoom(v === "fit" ? "fit" : v === "100" ? 1 : v === "+" ? Math.round((zoom + 0.1) * 10) / 10 : Math.round((zoom - 0.1) * 10) / 10); }); });
  window.addEventListener("resize", queueZoom);
  // La zone du canevas change de taille (panneaux, fenêtre, mise en page initiale) : le cadre suit
  if (window.ResizeObserver) new ResizeObserver(function () { queueZoom(); }).observe(stage);
  function setAid(k, v) {
    aids[k] = v; store.set("aids", aids);
    $$("[data-pb-toggle='" + k + "'], [data-aid='" + k + "']").forEach(function (b) { b.setAttribute("aria-pressed", String(k === "guides" ? v !== false : Boolean(v))); });
    if (k === "rulers") { $("[data-pb-ruler-x]").hidden = !v; $("[data-pb-ruler-y]").hidden = !v; $("[data-pb-ruler-corner]").hidden = !v; $("[data-pb-canvas]").classList.toggle("has-rulers", v); drawRulers(); }
    var doc = frame.contentDocument;
    if (k === "outlines" && doc && doc.body) doc.body.classList.toggle("pb-outlines", v);
    if (k === "grid") drawGrid();
    if (k === "guides" || k === "guidesLocked") { drawGuides(); drawRulers(); }
    if (k === "snap" && !v) smartClear();
    notifyRules();
  }
  $$("[data-pb-toggle]").forEach(function (b) { b.addEventListener("click", function () { setAid(b.dataset.pbToggle, !aids[b.dataset.pbToggle]); }); });

  // ---------- Règles et guides ----------
  // Coordonnées : celles de la page affichée, en pixels CSS (origine : coin haut gauche de la page ; l'axe vertical
  // suit le défilement de la page). Le zoom ne change que l'échelle d'affichage. Les guides sont une préférence
  // d'interface propre à chaque page et à chaque écran (jamais enregistrés dans le contenu de la page).
  var RULER = 20;
  var guides = store.get("guides-" + PAGE.id, {});
  var selectedGuide = null;
  var pointerPage = null;
  // Guides de l'écran affiché (ou communs à tous les écrans quand « guides indépendants par écran » est désactivé)
  var guideKey = function (d) { return snapPrefs.perDevice ? (d || device) : "all"; };
  var guidesFor = function (d) { var k = guideKey(d), g = guides[k]; if (!g) g = guides[k] = { h: [], v: [] }; return g; };
  var saveGuides = function () { store.set("guides-" + PAGE.id, guides); notifyRules(); };
  var rulesListeners = [];
  function notifyRules() { (rulesListeners || []).forEach(function (f) { try { f(); } catch (e) { /* panneau fermé */ } }); }
  // Unités : la règle et les guides restent des COORDONNÉES du canevas (pixels CSS de la page) ; une autre unité n'est qu'un
  // affichage de ces coordonnées (rem, em : tailles de texte de la page / de la sélection ; %, vw, vh : dimensions de la page)
  function unitCtx(axis) {
    var c = { vw: WIDTH[device] || 1280, vh: 800, root: 16, font: 16, parent: WIDTH[device] || 1280 };
    try {
      var doc = frame.contentDocument, win = frame.contentWindow;
      c.vw = doc.documentElement.clientWidth || c.vw; c.vh = win.innerHeight || c.vh;
      c.root = parseFloat(win.getComputedStyle(doc.documentElement).fontSize) || 16; c.font = c.root;
      var sel = selection.length ? doc.querySelector('[data-node-id="' + selection[0] + '"],[data-section-id="' + selection[0] + '"]') : null;
      if (sel) c.font = parseFloat(win.getComputedStyle(sel).fontSize) || c.root;
      c.parent = axis === "h" ? Math.max(doc.documentElement.scrollHeight, c.vh) : c.vw; // % : largeur de la page (x) ou hauteur de la page (y)
    } catch (e) { /* page pas encore prête */ }
    return c;
  }
  var unitSuffix = function () { return snapPrefs.unit === "px" ? " px" : snapPrefs.unit === "%" ? " %" : " " + snapPrefs.unit; };
  // Position d'un guide (axe "v" : x, axe "h" : y) dans l'unité choisie
  function fmtPos(axis, px) { return KS.format(px, snapPrefs.unit, unitCtx(axis)) + unitSuffix(); }
  function fmtLen(px) { return Math.round(px * 10) / 10 + " px"; }
  var rulerText = function (v) { return snapPrefs.unit === "px" ? String(Math.round(v)) : String(Math.round(v * 100) / 100).replace(".", ","); };
  // Étendue (en pixels de page) de la sélection : surlignée sur les règles
  function selectionBand() {
    try {
      if (selection.length !== 1) return null;
      var doc = frame.contentDocument, el = doc.querySelector('[data-node-id="' + selection[0] + '"],[data-section-id="' + selection[0] + '"]');
      if (!el) return null;
      var r = pageRect(el);
      return { x1: r.left, x2: r.left + r.width, y1: r.top, y2: r.top + r.height };
    } catch (e) { return null; }
  }
  function drawRulers() {
    if (!aids.rulers) return;
    var rx = $("[data-pb-ruler-x]"), ry = $("[data-pb-ruler-y]");
    var cr = $("[data-pb-canvas]").getBoundingClientRect(), fr = frame.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var sy = 0, sx = 0; try { sy = frame.contentWindow.scrollY; sx = frame.contentWindow.scrollX; } catch (e) { sy = 0; }
    var corner = $("[data-pb-ruler-corner]");
    if (corner) { corner.textContent = snapPrefs.unit; corner.title = "Unité des règles : " + snapPrefs.unit + " (clic : changer). Les coordonnées restent en pixels de la page. Clic droit : guides"; }
    var g = guidesFor(), band = selectionBand();
    var paint = function (cv, len, horizontal, origin, offset, marks, pointer, axis, span) {
      // Échelle en unités : pas lisible choisi selon le zoom, graduations alignées sur des valeurs rondes de l'unité
      var ppu = KS.toPx(1, snapPrefs.unit, unitCtx(axis)) || 1; // pixels de page par unité
      var spu = zoom * ppu;                                      // pixels d'écran par unité
      var step = KS.niceStep(spu), minor = KS.minorStep(step, spu);
      cv.width = Math.max(1, Math.round((horizontal ? len : RULER) * dpr)); cv.height = Math.max(1, Math.round((horizontal ? RULER : len) * dpr));
      cv.style.width = (horizontal ? len : RULER) + "px"; cv.style.height = (horizontal ? RULER : len) + "px";
      var c = cv.getContext("2d"); c.scale(dpr, dpr);
      c.fillStyle = "#f8fafc"; c.fillRect(0, 0, horizontal ? len : RULER, horizontal ? RULER : len);
      var at = function (px) { return origin + (px - offset) * zoom; };
      if (span) { // étendue de l'élément sélectionné
        var a = at(span[0]), b = at(span[1]);
        c.fillStyle = "rgba(8,145,178,.16)";
        if (horizontal) c.fillRect(a, 0, Math.max(1, b - a), RULER); else c.fillRect(0, a, RULER, Math.max(1, b - a));
      }
      c.strokeStyle = "#cbd5e1"; c.beginPath(); if (horizontal) { c.moveTo(0, RULER - 0.5); c.lineTo(len, RULER - 0.5); } else { c.moveTo(RULER - 0.5, 0); c.lineTo(RULER - 0.5, len); } c.stroke();
      c.fillStyle = "#475569"; c.strokeStyle = "#94a3b8"; c.font = "9px system-ui, sans-serif"; c.lineWidth = 1;
      var first = Math.floor((offset - origin / zoom) / ppu / minor), last = Math.ceil((offset + (len - origin) / zoom) / ppu / minor);
      for (var k = first; k <= last && last - first < 4000; k++) {
        var v = Math.round(k * minor * 1e6) / 1e6;
        var pos = Math.round(at(v * ppu)) + 0.5;
        if (pos < 0 || pos > len) continue;
        var major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
        var half = !major && Math.abs((v * 2) / step - Math.round((v * 2) / step)) < 1e-6;
        var tick = major ? RULER - 4 : half ? 8 : 5;
        c.beginPath();
        if (horizontal) { c.moveTo(pos, RULER - tick); c.lineTo(pos, RULER); } else { c.moveTo(RULER - tick, pos); c.lineTo(RULER, pos); }
        c.stroke();
        if (major) {
          var text = rulerText(v);
          if (horizontal) c.fillText(text, pos + 3, 9);
          else { c.save(); c.translate(9, pos + 3); c.rotate(Math.PI / 2); c.fillText(text, 0, 0); c.restore(); }
        }
      }
      // Guides de cet écran, et position du pointeur dans la page
      c.fillStyle = "#0891b2";
      if (aids.guides !== false) marks.forEach(function (m) { var p = at(m); if (p < 0 || p > len) return; c.beginPath(); if (horizontal) { c.moveTo(p - 4, 0); c.lineTo(p + 4, 0); c.lineTo(p, 6); } else { c.moveTo(0, p - 4); c.lineTo(0, p + 4); c.lineTo(6, p); } c.fill(); });
      if (pointer !== null) { var pp = Math.round(at(pointer)) + 0.5; if (pp >= 0 && pp <= len) { c.strokeStyle = "#dc2626"; c.beginPath(); if (horizontal) { c.moveTo(pp, 0); c.lineTo(pp, RULER); } else { c.moveTo(0, pp); c.lineTo(RULER, pp); } c.stroke(); } }
    };
    paint(rx, Math.max(0, cr.width - RULER), true, fr.left - (cr.left + RULER), sx, g.v, pointerPage ? pointerPage.x : null, "v", band && [band.x1, band.x2]);
    paint(ry, Math.max(0, cr.height - RULER), false, fr.top - (cr.top + RULER), sy, g.h, pointerPage ? pointerPage.y : null, "h", band && [band.y1, band.y2]);
  }
  stage.addEventListener("scroll", drawRulers, { passive: true });
  // ---------- Grille, marges, conteneur, zone de sécurité (dessinés dans le canevas, jamais dans le contenu) ----------
  // La grille suit le magnétisme : « libre » = lignes à pas régulier ; « web » = colonnes + gouttières + marges du conteneur.
  function pageSize() {
    var doc = frame.contentDocument, win = frame.contentWindow;
    return { w: doc.documentElement.clientWidth || WIDTH[device], h: Math.max(doc.documentElement.scrollHeight, win.innerHeight || 0) };
  }
  function drawGrid() {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    $$(".pb-grid-overlay, .pb-safe-area", doc).forEach(function (x) { x.remove(); });
    var p = effPrefs(), s = p.show, cfg = KS.gridFor(p, device), size = pageSize();
    var web = KS.webGrid(cfg, size.w);
    var ov = doc.createElement("div");
    ov.className = "pb-grid-overlay"; ov.setAttribute("aria-hidden", "true");
    ov.style.width = size.w + "px"; ov.style.height = size.h + "px";
    var add = function (cls, css, label) { var d = doc.createElement("div"); d.className = cls; d.style.cssText = css; if (label) d.setAttribute("data-label", label); ov.appendChild(d); return d; };
    var any = false;
    if (s.grid && p.mode === "free") {
      var shown = p.step * Math.max(1, Math.ceil(4 / (p.step * zoom))); // jamais plus dense qu'un trait tous les 4 px d'écran
      ov.style.backgroundImage = "linear-gradient(to right,rgba(2,119,182,.18) 1px,transparent 1px),linear-gradient(to bottom,rgba(2,119,182,.18) 1px,transparent 1px)";
      ov.style.backgroundSize = shown + "px " + shown + "px";
      any = true;
    }
    if (s.grid && p.mode === "web" && s.columns) {
      web.columns.forEach(function (c) { add("pb-grid-col", "left:" + c.left + "px;width:" + (c.right - c.left) + "px"); });
      any = true;
    }
    if (s.margins) {
      add("pb-margin-line", "left:" + web.inner.left + "px", "marge " + cfg.marginL);
      add("pb-margin-line is-right", "left:" + web.inner.right + "px", "marge " + cfg.marginR);
      any = true;
    }
    if (s.container) {
      add("pb-container-line", "left:" + web.container.left + "px", "conteneur" + (cfg.maxWidth > 0 ? " · max " + cfg.maxWidth + " px" : ""));
      add("pb-container-line is-right", "left:" + web.container.right + "px");
      any = true;
    }
    if (any) doc.body.appendChild(ov);
    if (s.safe) {
      var sa = doc.createElement("div");
      sa.className = "pb-safe-area"; sa.setAttribute("aria-hidden", "true");
      sa.style.cssText = "top:" + p.safe.top + "px;right:" + p.safe.right + "px;bottom:" + p.safe.bottom + "px;left:" + p.safe.left + "px";
      sa.setAttribute("data-label", "Zone de sécurité");
      doc.body.appendChild(sa);
    }
  }

  // ---------- Magnétisme : repères d'accrochage, repères intelligents, distances ----------
  // Tout est calculé à partir d'un index pris UNE fois au début du geste (positions des éléments de la page, contexte
  // du parent) : pendant le déplacement de la souris, seules des comparaisons de nombres sont faites.
  var pageBox = function (el) { var r = pageRect(el); return { left: r.left, top: r.top, right: r.left + r.width, bottom: r.top + r.height }; };
  function snapEnv(el) {
    var doc = frame.contentDocument, win = frame.contentWindow, p = effPrefs(), size = pageSize();
    var env = { prefs: p, size: size, rects: [], parent: null, layout: "flow", self: el ? pageBox(el) : { left: 0, top: 0, right: 0, bottom: 0 }, el: el, tracks: { x: [], y: [] }, gap: { x: 0, y: 0 }, siblings: [] };
    var list = doc.querySelectorAll("[data-node-id],[data-section-id]");
    for (var i = 0; i < list.length && env.rects.length < 500; i++) {
      var e = list[i];
      if (el && (e === el || el.contains(e) || e.contains(el))) continue; // ni lui-même, ni ses enfants, ni ses parents (ceux-ci : bords du parent / centre)
      var b = pageBox(e);
      if (b.right - b.left < 1 || b.bottom - b.top < 1) continue;
      env.rects.push(b);
      if (el && e.parentElement === el.parentElement) env.siblings.push(b);
    }
    var pe = el ? layoutParentEl(el) : null;
    if (pe) {
      var cs = win.getComputedStyle(pe), pb = pageBox(pe);
      var pl = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) || 0, pr = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth) || 0;
      var pt = parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth) || 0, pbm = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) || 0;
      env.parent = { left: pb.left + pl, right: pb.right - pr, top: pb.top + pt, bottom: pb.bottom - pbm };
      env.gap = { x: parseFloat(cs.columnGap) || 0, y: parseFloat(cs.rowGap) || 0 };
      if (/grid/.test(cs.display)) {
        env.layout = "grid";
        var lines = function (tpl, start, gap) {
          var out = [], at = start;
          String(tpl).split(" ").forEach(function (t) { var w = parseFloat(t); if (!isFinite(w)) return; out.push(at, at + w); at += w + gap; });
          return out;
        };
        env.tracks.x = lines(cs.gridTemplateColumns, env.parent.left, env.gap.x);
        env.tracks.y = lines(cs.gridTemplateRows, env.parent.top, env.gap.y);
      } else if (/flex/.test(cs.display)) env.layout = /column/.test(cs.flexDirection) ? "flex-column" : "flex-row";
    }
    return env;
  }
  // Cibles d'accrochage pour un bord qui bouge sur l'axe "x" (position horizontale) ou "y" ; probe : valeur actuelle du bord
  function snapTargets(env, axis, probe, forGuide) {
    var p = env.prefs, sn = p.snap, t = [], size = env.size;
    var x = axis === "x";
    if (!forGuide && sn.guides && p.show.guides) { var g = guidesFor(); (x ? g.v : g.h).forEach(function (v) { t.push({ v: v, kind: "guide", label: "guide", pri: 0 }); }); }
    if (!forGuide || p.show.grid) t = t.concat(KS.gridTargets(p, device, size.w, probe, axis));
    if (sn.edges) {
      var cfg = KS.gridFor(p, device), web = KS.webGrid(cfg, size.w);
      if (x) { t.push({ v: 0, kind: "edge", label: "bord de la page", pri: 4 }, { v: size.w, kind: "edge", label: "bord de la page", pri: 4 }); if (p.mode === "web" || p.show.container) t.push({ v: web.container.left, kind: "edge", label: "conteneur", pri: 4 }, { v: web.container.right, kind: "edge", label: "conteneur", pri: 4 }); }
      else t.push({ v: 0, kind: "edge", label: "haut de la page", pri: 4 });
      if (env.parent) { if (x) t.push({ v: env.parent.left, kind: "edge", label: "bord du parent", pri: 4 }, { v: env.parent.right, kind: "edge", label: "bord du parent", pri: 4 }); else t.push({ v: env.parent.top, kind: "edge", label: "bord du parent", pri: 4 }, { v: env.parent.bottom, kind: "edge", label: "bord du parent", pri: 4 }); }
    }
    if (sn.center) {
      if (x) t.push({ v: size.w / 2, kind: "center", label: "centre de la page", pri: 2.5 });
      if (env.parent) t.push({ v: x ? (env.parent.left + env.parent.right) / 2 : (env.parent.top + env.parent.bottom) / 2, kind: "center", label: "centre du parent", pri: 2.5 });
    }
    if (sn.elements) {
      env.rects.forEach(function (r) {
        if (x) t.push({ v: r.left, kind: "element", label: "bord d'un élément", rect: r, pri: 3 }, { v: r.right, kind: "element", label: "bord d'un élément", rect: r, pri: 3 }, { v: (r.left + r.right) / 2, kind: "element", label: "centre d'un élément", rect: r, pri: 3 });
        else t.push({ v: r.top, kind: "element", label: "bord d'un élément", rect: r, pri: 3 }, { v: r.bottom, kind: "element", label: "bord d'un élément", rect: r, pri: 3 }, { v: (r.top + r.bottom) / 2, kind: "element", label: "centre d'un élément", rect: r, pri: 3 });
      });
    }
    // Disposition réelle du parent : lignes de piste (Grille), écart (gap) des voisins (Flexbox), écarts déjà présents
    if (sn.columns && env.layout === "grid") (x ? env.tracks.x : env.tracks.y).forEach(function (v) { t.push({ v: v, kind: "column", label: x ? "colonne de la grille" : "ligne de la grille", pri: 2 }); });
    if (sn.elements && env.siblings.length) {
      var gaps = [], flow = env.layout === "flow";
      var gp = x ? env.gap.x : env.gap.y;
      if (gp > 0 && (env.layout === "grid" || (x ? env.layout === "flex-row" : env.layout === "flex-column"))) gaps.push(Math.round(gp * 10) / 10);
      if (flow || !gaps.length) KS.repeatedGaps(env.siblings, x ? "x" : "y").forEach(function (rg) { gaps.push(rg.value); });
      if (gaps.length) t = t.concat(KS.gapTargets(env.self, env.siblings, gaps, x ? "x" : "y"));
    }
    return t;
  }
  // Un bord qui se déplace : renvoie la cible retenue (ou null) ; Alt suspend le magnétisme, le mouvement reste libre
  function snapEdge(env, axis, value, ev) {
    if (!env.prefs.snap.on || (ev && ev.altKey)) return null;
    var reach = KS.reach(env.prefs, zoom);
    var hit = KS.snapAxis([{ v: value, name: "edge" }], snapTargets(env, axis, value), reach);
    return hit ? hit.target : null;
  }

  // Repères intelligents et distances : calque temporaire dans le canevas, supprimé à la fin du geste
  function smartLayer(doc) {
    var l = doc.querySelector(".pb-smart-layer");
    if (!l) { l = doc.createElement("div"); l.className = "pb-smart-layer"; l.setAttribute("aria-hidden", "true"); doc.body.appendChild(l); }
    return l;
  }
  function smartClear() { var doc = frame.contentDocument; if (!doc) return; $$(".pb-smart-layer", doc).forEach(function (x) { x.remove(); }); }
  function smartLine(layer, axis, pos, from, to, kind) {
    var d = layer.ownerDocument.createElement("div");
    d.className = "pb-smart pb-smart-" + (axis === "x" ? "v" : "h") + " is-" + kind;
    if (axis === "x") d.style.cssText = "left:" + pos + "px;top:" + from + "px;height:" + Math.max(1, to - from) + "px";
    else d.style.cssText = "top:" + pos + "px;left:" + from + "px;width:" + Math.max(1, to - from) + "px";
    layer.appendChild(d);
  }
  function smartTag(layer, x, y, text, kind) {
    var d = layer.ownerDocument.createElement("div");
    d.className = "pb-smart-tag is-" + (kind || "snap"); d.textContent = text;
    d.style.cssText = "left:" + x + "px;top:" + y + "px";
    layer.appendChild(d);
  }
  // Mesure entre deux rectangles : trait + valeur au milieu (« 24 px »)
  function drawGap(layer, g, kind) {
    if (g.axis === "x") {
      var y = (g.y1 + g.y2) / 2;
      smartLine(layer, "y", y, g.from, g.to, "dist" + (kind ? " is-" + kind : ""));
      smartTag(layer, (g.from + g.to) / 2, y - 9, fmtLen(g.value), kind || "dist");
    } else {
      var x = (g.x1 + g.x2) / 2;
      smartLine(layer, "x", x, g.from, g.to, "dist" + (kind ? " is-" + kind : ""));
      smartTag(layer, x + 4, (g.from + g.to) / 2 - 8, fmtLen(g.value), kind || "dist");
    }
  }
  // Distances d'un rectangle à ses voisins ; deux écarts égaux (ou égaux à un écart déjà présent) sont signalés en vert
  function drawDistances(env, rect, others) {
    var doc = frame.contentDocument;
    if (!doc || !env.prefs.snap.distances) return;
    var layer = smartLayer(doc), nb = KS.neighbours(rect, others || env.rects, 600);
    var known = KS.repeatedGaps(env.rects, "x").concat(KS.repeatedGaps(env.rects, "y")).map(function (r) { return r.value; });
    var eq = function (a, b) { return a && b && Math.abs(a.value - b.value) < 0.6; };
    ["left", "right", "top", "bottom"].forEach(function (side) {
      var g = nb[side]; if (!g) return;
      var opposite = nb[{ left: "right", right: "left", top: "bottom", bottom: "top" }[side]];
      var same = eq(g, opposite) || known.some(function (v) { return Math.abs(v - g.value) < 0.6; });
      drawGap(layer, g, same ? "equal" : "");
    });
  }
  // Repère d'accrochage : trait le long de la cible atteinte, avec son nom
  function drawSnapHit(env, hit, axis, rect) {
    var doc = frame.contentDocument;
    if (!doc || !hit || !env.prefs.snap.smart) return;
    var layer = smartLayer(doc);
    var kind = hit.kind === "guide" ? "guide" : "snap";
    if (axis === "x") {
      var top = rect.top, bottom = rect.bottom;
      if (hit.rect) { top = Math.min(top, hit.rect.top); bottom = Math.max(bottom, hit.rect.bottom); } else { top = 0; bottom = env.size.h; }
      smartLine(layer, "x", hit.v, top, bottom, kind);
      smartTag(layer, hit.v + 4, Math.max(0, rect.top - 22), hit.label, "snap");
    } else {
      var left = rect.left, right = rect.right;
      if (hit.rect) { left = Math.min(left, hit.rect.left); right = Math.max(right, hit.rect.right); } else { left = 0; right = env.size.w; }
      smartLine(layer, "y", hit.v, left, right, kind);
      smartTag(layer, Math.max(0, rect.left), hit.v + 4, hit.label, "snap");
    }
  }
  // Position dans la page (coordonnées CSS) d'un point de l'écran ; inside : au-dessus de la page affichée
  function pageAt(clientX, clientY) {
    var fr = frame.getBoundingClientRect();
    var win = frame.contentWindow;
    return { x: Math.round((clientX - fr.left) / zoom + win.scrollX), y: Math.round((clientY - fr.top) / zoom + win.scrollY), inside: clientX >= fr.left && clientX <= fr.right && clientY >= fr.top && clientY <= fr.bottom };
  }
  // Guides dans le canevas : lignes en coordonnées de page (elles suivent le défilement et le zoom)
  function drawGuides() {
    var doc = frame.contentDocument;
    if (!doc || !doc.body) return;
    $$(".pb-guide", doc).forEach(function (x) { x.remove(); });
    drawGrid();
    if (aids.guides === false) return;
    var g = guidesFor();
    var H = doc.documentElement.scrollHeight;
    ["h", "v"].forEach(function (axis) {
      g[axis].forEach(function (pos, i) {
        var el = doc.createElement("div");
        el.className = "pb-guide pb-guide-" + axis + (selectedGuide && selectedGuide.axis === axis && selectedGuide.i === i ? " is-selected" : "") + (aids.guidesLocked ? " is-locked" : "");
        if (axis === "h") el.style.top = pos + "px"; else { el.style.left = pos + "px"; el.style.height = H + "px"; }
        el.setAttribute("title", (axis === "h" ? "Guide horizontal : " : "Guide vertical : ") + fmtPos(axis, pos) + (aids.guidesLocked ? " (verrouillé)" : " — glisser pour déplacer, hors de la page pour supprimer"));
        el.addEventListener("mousedown", function (e) { guideDrag(e, axis, i, el); });
        el.addEventListener("contextmenu", function (e) { e.preventDefault(); e.stopPropagation(); selectedGuide = { axis: axis, i: i }; drawGuides(); var r = frame.getBoundingClientRect(); guideMenu(r.left + e.clientX * zoom, r.top + e.clientY * zoom); });
        el.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); });
        el.addEventListener("dblclick", function (e) { e.preventDefault(); e.stopPropagation(); selectedGuide = { axis: axis, i: i }; drawGuides(); if (window.pbRules) window.pbRules.open("guides"); });
        doc.body.appendChild(el);
      });
    });
  }
  // Accrochage d'un guide qu'on place : éléments, centres, bords, colonnes (Alt : libre)
  function guideSnap(env, axis, v, ev) {
    if (!env.prefs.snap.on || (ev && ev.altKey)) return null;
    var hit = KS.snapAxis([{ v: v, name: "guide" }], snapTargets(env, axis === "v" ? "x" : "y", v, true), KS.reach(env.prefs, zoom));
    return hit ? hit.target : null;
  }
  function guideLabel(doc, axis, pos) {
    var lab = doc.querySelector(".pb-guide-label") || doc.body.appendChild(Object.assign(doc.createElement("div"), { className: "pb-guide-label" }));
    var win = frame.contentWindow;
    lab.textContent = fmtPos(axis, pos);
    lab.style.left = (axis === "v" ? pos + 6 : win.scrollX + 6) + "px";
    lab.style.top = (axis === "h" ? pos + 6 : win.scrollY + 6) + "px";
    return lab;
  }
  // Déplacer un guide (dans le canevas) ; relâché au bord de la page (vers la règle) : supprimé
  function guideDrag(e, axis, i, el) {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    selectedGuide = { axis: axis, i: i };
    if (aids.guidesLocked) { drawGuides(); toast("Guides verrouillés : clic droit sur une règle pour les déverrouiller."); return; }
    var doc = frame.contentDocument, win = frame.contentWindow;
    gesture = true;
    var moved = false, out = false, cur = guidesFor()[axis][i];
    var genv = snapEnv(null);
    el.classList.add("is-selected");
    var place = function (v, isOut, ev) {
      moved = true;
      out = isOut;
      var hit = isOut ? null : guideSnap(genv, axis, v, ev);
      cur = Math.max(0, Math.round(hit ? hit.v : v));
      el.style[axis === "h" ? "top" : "left"] = cur + "px";
      el.classList.toggle("is-removing", out);
      if (out) { var l0 = doc.querySelector(".pb-guide-label"); if (l0) l0.textContent = "Relâcher : supprimer"; } else { var lb = guideLabel(doc, axis, cur); if (hit) lb.textContent += " · " + hit.label; }
      drawRulers();
    };
    // Dans la page (coordonnées du canevas) ; vers le bord de la page : suppression
    var move = function (ev) { pointerPage = { x: ev.clientX + win.scrollX, y: ev.clientY + win.scrollY }; place(axis === "h" ? ev.clientY + win.scrollY : ev.clientX + win.scrollX, axis === "h" ? ev.clientY < 4 : ev.clientX < 4, ev); };
    // Hors de la page (règles, panneaux) : le déplacement continue ; relâché du côté de sa règle (au-dessus ou à
    // gauche de la page), le guide est supprimé
    var pmove = function (ev) {
      var fr = frame.getBoundingClientRect(), pp = pageAt(ev.clientX, ev.clientY);
      place(axis === "h" ? pp.y : pp.x, axis === "h" ? ev.clientY < fr.top : ev.clientX < fr.left, ev);
    };
    var finished = false;
    var up = function () {
      if (finished) return;
      finished = true;
      doc.removeEventListener("mousemove", move); doc.removeEventListener("mouseup", up);
      document.removeEventListener("mousemove", pmove); document.removeEventListener("mouseup", up);
      var lab = doc.querySelector(".pb-guide-label"); if (lab) lab.remove();
      if (moved) {
        var g = guidesFor();
        if (out) { g[axis].splice(i, 1); selectedGuide = null; toast("Guide supprimé."); }
        else g[axis][i] = cur;
        saveGuides();
      }
      drawGuides(); drawRulers();
      endGesture();
    };
    doc.addEventListener("mousemove", move); doc.addEventListener("mouseup", up);
    document.addEventListener("mousemove", pmove); document.addEventListener("mouseup", up);
  }
  // Créer un guide en le tirant depuis une règle (horizontale → guide horizontal, verticale → guide vertical)
  function rulerDrag(axis) {
    return function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      if (aids.guides === false) setAid("guides", true);
      var cv = e.currentTarget;
      cv.setPointerCapture(e.pointerId);
      var doc = frame.contentDocument;
      if (!doc || !doc.body) return;
      gesture = true;
      var genv = snapEnv(null);
      var temp = doc.createElement("div");
      temp.className = "pb-guide pb-guide-" + axis + " is-temp";
      if (axis === "v") temp.style.height = doc.documentElement.scrollHeight + "px";
      temp.style.display = "none";
      doc.body.appendChild(temp);
      var pos = null;
      var move = function (ev) {
        var p = pageAt(ev.clientX, ev.clientY);
        // Guide horizontal : seule la hauteur compte (relâché à côté d'une page étroite, il est créé quand même) ;
        // guide vertical : seule la position horizontale compte
        var fr = frame.getBoundingClientRect(), cv0 = $("[data-pb-canvas]").getBoundingClientRect();
        var inBand = axis === "h" ? ev.clientY >= fr.top && ev.clientY <= fr.bottom && ev.clientX >= cv0.left && ev.clientX <= cv0.right
          : ev.clientX >= fr.left && ev.clientX <= fr.right && ev.clientY >= cv0.top && ev.clientY <= cv0.bottom;
        pos = inBand ? Math.max(0, axis === "h" ? p.y : p.x) : null;
        var hit = pos === null ? null : guideSnap(genv, axis, pos, ev);
        if (hit) pos = Math.max(0, Math.round(hit.v));
        temp.style.display = pos === null ? "none" : "";
        if (pos !== null) { temp.style[axis === "h" ? "top" : "left"] = pos + "px"; var lb = guideLabel(doc, axis, pos); if (hit) lb.textContent += " · " + hit.label; }
        pointerPage = p.inside ? { x: p.x, y: p.y } : null;
        drawRulers();
      };
      var up = function () {
        cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up);
        temp.remove();
        var lab = doc.querySelector(".pb-guide-label"); if (lab) lab.remove();
        if (pos !== null) {
          var g = guidesFor();
          g[axis].push(pos);
          selectedGuide = { axis: axis, i: g[axis].length - 1 };
          saveGuides();
          toast((axis === "h" ? "Guide horizontal" : "Guide vertical") + " à " + fmtPos(axis, pos) + " (écran " + bpLabel(device).toLowerCase() + "). Glissez-le hors de la page pour le supprimer.");
        }
        drawGuides(); drawRulers();
        endGesture();
      };
      cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up);
    };
  }
  $("[data-pb-ruler-x]").addEventListener("pointerdown", rulerDrag("h"));
  $("[data-pb-ruler-y]").addEventListener("pointerdown", rulerDrag("v"));
  function removeSelectedGuide() {
    if (!selectedGuide) return false;
    var g = guidesFor();
    if (g[selectedGuide.axis][selectedGuide.i] === undefined) { selectedGuide = null; return false; }
    g[selectedGuide.axis].splice(selectedGuide.i, 1);
    selectedGuide = null;
    saveGuides(); drawGuides(); drawRulers();
    toast("Guide supprimé.");
    return true;
  }
  function clearGuides() { guides[device] = { h: [], v: [] }; selectedGuide = null; saveGuides(); drawGuides(); drawRulers(); toast("Guides de l'écran « " + bpLabel(device) + " » supprimés."); }
  function guideMenu(x, y) {
    var entries = [
      selectedGuide ? ["Position de ce guide…", function () { window.pbRules.open("guides"); }, false] : null,
      selectedGuide ? ["Supprimer ce guide", removeSelectedGuide, false, "Suppr"] : null,
      ["Ajouter un guide à une position précise…", function () { window.pbRules.open("guides"); }, false],
      [aids.guidesLocked ? "Déverrouiller les guides" : "Verrouiller les guides", function () { setAid("guidesLocked", !aids.guidesLocked); }, false],
      [aids.guides === false ? "Afficher les guides" : "Masquer les guides", function () { setAid("guides", aids.guides === false); }, false],
      ["Supprimer tous les guides de cet écran", clearGuides, !(guidesFor().h.length || guidesFor().v.length)],
      ["Règles et magnétisme : réglages…", function () { window.pbRules.open(); }, false],
    ].filter(Boolean);
    showSimpleMenu(entries, x, y);
  }
  function showSimpleMenu(entries, x, y) {
    menu.textContent = "";
    entries.forEach(function (en) { menu.appendChild(h("button", { type: "button", role: "menuitem", class: "pb-menu-item", disabled: en[2] || null, tabindex: "-1", onclick: function () { closeMenu(); en[1](); } }, h("span", { text: en[0] }), en[3] ? h("kbd", { text: en[3] }) : null)); });
    if (window.KolMotion) window.KolMotion.cancelLeave(menu);
    menu.hidden = false;
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
    var first = menu.querySelector(".pb-menu-item:not([disabled])"); if (first) first.focus();
  }
  // Coin des règles : choix de l'unité d'affichage (les coordonnées restent des pixels de la page)
  function unitMenu(x, y) {
    showSimpleMenu(KS.UNITS.map(function (u) { return [(u === snapPrefs.unit ? "✓ " : "") + { px: "Pixels (px)", "%": "Pourcentage de la page (%)", rem: "rem : taille de texte de la page", em: "em : taille de texte de la sélection", vw: "vw : largeur de la fenêtre", vh: "vh : hauteur de la fenêtre" }[u], function () { updatePrefs(function (p) { p.unit = u; }); }, false]; }), x, y);
  }
  var cornerEl = $("[data-pb-ruler-corner]");
  cornerEl.setAttribute("role", "button"); cornerEl.setAttribute("tabindex", "0");
  cornerEl.addEventListener("click", function (e) { var r = cornerEl.getBoundingClientRect(); unitMenu(r.left, r.bottom + 4); });
  cornerEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); var r = cornerEl.getBoundingClientRect(); unitMenu(r.left, r.bottom + 4); } });
  // Niveaux de zoom usuels
  var zoomValueEl = $("[data-pb-zoom-value]");
  function zoomMenu() {
    var r = zoomValueEl.getBoundingClientRect();
    showSimpleMenu([["Ajuster à la fenêtre", function () { setZoom("fit"); }, false, "Maj 1"]].concat([0.5, 0.64, 0.75, 1, 1.25, 1.5, 2, 3, 4].map(function (z) { return [(!zoomFit && Math.abs(zoom - z) < 0.005 ? "✓ " : "") + Math.round(z * 100) + " %", function () { setZoom(z); }, false]; })), r.left, r.bottom + 4);
  }
  zoomValueEl.setAttribute("role", "button"); zoomValueEl.setAttribute("tabindex", "0"); zoomValueEl.setAttribute("title", "Niveaux de zoom");
  zoomValueEl.addEventListener("click", zoomMenu);
  zoomValueEl.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); zoomMenu(); } });
  ["[data-pb-ruler-x]", "[data-pb-ruler-y]", "[data-pb-ruler-corner]"].forEach(function (sel) { $(sel).addEventListener("contextmenu", function (e) { e.preventDefault(); selectedGuide = null; guideMenu(e.clientX, e.clientY); }); });

  // ---------- Mesure au survol (Alt), réglages, passerelle vers le panneau « Règles et magnétisme » ----------
  var measuring = false;
  function measureHover(e) {
    if (!snapPrefs.snap.distances || gesture || editing || selection.length !== 1) { if (measuring) { measuring = false; smartClear(); } return; }
    var doc = frame.contentDocument, a = canvasEl(selection[0]), b = targetOf(e);
    smartClear();
    measuring = true;
    if (!a || !b || a === b) return;
    var A = pageBox(a), B = pageBox(b), layer = smartLayer(doc);
    var box = doc.createElement("div"); box.className = "pb-smart-box"; box.style.cssText = "left:" + B.left + "px;top:" + B.top + "px;width:" + (B.right - B.left) + "px;height:" + (B.bottom - B.top) + "px"; layer.appendChild(box);
    if (B.left <= A.left && B.right >= A.right && B.top <= A.top && B.bottom >= A.bottom) { // l'élément survolé contient la sélection : marges intérieures
      var my = (A.top + A.bottom) / 2, mx = (A.left + A.right) / 2;
      [{ axis: "x", from: B.left, to: A.left, y1: my, y2: my }, { axis: "x", from: A.right, to: B.right, y1: my, y2: my }, { axis: "y", from: B.top, to: A.top, x1: mx, x2: mx }, { axis: "y", from: A.bottom, to: B.bottom, x1: mx, x2: mx }].forEach(function (g) { g.value = g.to - g.from; if (g.value > 0.5) drawGap(layer, g, ""); });
    } else {
      var g = KS.gapBetween(A, B);
      if (g) drawGap(layer, g, ""); else smartTag(layer, B.left, Math.max(0, B.top - 20), "se chevauchent", "dist");
    }
  }
  // Modifier les réglages (un seul chemin pour le panneau, les menus et les raccourcis) : valider, enregistrer, redessiner
  function updatePrefs(fn) {
    fn(snapPrefs);
    snapPrefs = KS.normalize(snapPrefs);
    saveSnapPrefs();
    drawGuides(); drawRulers();
    notifyRules();
  }
  function guideParse(axis, text) {
    var px = KS.parse(text, snapPrefs.unit, unitCtx(axis));
    return px === null ? null : Math.max(0, Math.round(px));
  }
  function addGuideAt(axis, text) {
    var px = guideParse(axis, text);
    if (px === null) { toast("Position illisible : écrivez un nombre, par exemple 640 ou 40 %.", true); return false; }
    if (aids.guides === false) setAid("guides", true);
    var g = guidesFor();
    g[axis].push(px);
    selectedGuide = { axis: axis, i: g[axis].length - 1 };
    saveGuides(); drawGuides(); drawRulers();
    return true;
  }
  function moveGuideTo(axis, i, text) {
    var px = guideParse(axis, text), g = guidesFor();
    if (px === null || g[axis][i] === undefined) { toast("Position illisible : écrivez un nombre, par exemple 640 ou 40 %.", true); return false; }
    g[axis][i] = px;
    selectedGuide = { axis: axis, i: i };
    saveGuides(); drawGuides(); drawRulers();
    return true;
  }
  window.pbRules = {
    state: function () { return { prefs: snapPrefs, effective: effPrefs(), aids: aids, device: device, deviceLabel: bpLabel(device), width: WIDTH[device], guides: guidesFor(), selected: selectedGuide, zoom: zoom, unitCtx: unitCtx }; },
    setAid: setAid, update: updatePrefs, add: addGuideAt, move: moveGuideTo,
    format: function (axis, px) { return KS.format(px, snapPrefs.unit, unitCtx(axis)); },
    remove: function (axis, i) { selectedGuide = { axis: axis, i: i }; removeSelectedGuide(); },
    clear: clearGuides,
    select: function (axis, i) { selectedGuide = axis === null ? null : { axis: axis, i: i }; drawGuides(); notifyRules(); },
    subscribe: function (fn) { rulesListeners.push(fn); },
    setZoom: setZoom,
    open: function () {}, // remplacé par le panneau
    h: h, toast: toast, icon: icon,
  };

  // ---------- Apparence de l'éditeur (claire / sombre / système) ----------
  // Préférence PERSONNELLE de l'éditeur, gardée comme les autres réglages d'interface (magasin « pb: » : survit au rechargement,
  // propre à ce navigateur). Elle change l'interface de l'éditeur : barre d'outils, panneau de gauche et panneau de droite (calques,
  // inspecteur), par les jetons --editor-* de page-builder.css ; jamais la page ni le canevas. L'attribut data-palette est posé sur
  // <main> et sur <body> (les menus et sélecteurs ouverts hors des panneaux suivent le même thème).
  var PALETTE_MODES = [["light", "Claire", "sun"], ["dark", "Sombre", "moon"], ["system", "Système", "monitor"]];
  var paletteMode = store.get("palette-theme", "light");
  if (!PALETTE_MODES.some(function (m) { return m[0] === paletteMode; })) paletteMode = "light";
  var paletteMedia = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function paletteResolved() { return paletteMode === "system" ? (paletteMedia && paletteMedia.matches ? "dark" : "light") : paletteMode; }
  // Thème de l'éditeur (ajouté au mode clair / sombre) : « classic » = l'interface d'origine, « custom » = couleurs choisies puis
  // dérivées par KWTheme (contrastes vérifiés), « navy » = Navy Premium. Même magasin « pb: » que le mode ; jamais la page ni le canevas.
  var SKINS = ["classic", "custom", "navy"];
  var skin = store.get("editor-skin", "classic");
  if (SKINS.indexOf(skin) < 0) skin = "classic";
  var customTheme = store.get("editor-custom", { accent: "#0277b6" });
  if (!customTheme || typeof customTheme !== "object" || !window.KWTheme.parseHex(customTheme.accent)) customTheme = { accent: "#0277b6" };
  var customKeys = [];
  var customResult = null;
  function applyCustomTokens() {
    customKeys.forEach(function (k) { document.body.style.removeProperty(k); });
    customKeys = [];
    customResult = window.KWTheme.derive(customTheme);
    if (skin !== "custom") return;
    Object.keys(customResult.tokens).forEach(function (k) { document.body.style.setProperty(k, customResult.tokens[k]); customKeys.push(k); });
  }
  // Changement de thème ATOMIQUE : toutes les valeurs (jetons personnalisés, data-skin, data-palette) sont posées dans la même tâche, pendant
  // que les transitions sont coupées (classe pb-theme-switching). Un recalcul de style forcé fige alors les couleurs finales avant que la
  // classe ne soit retirée : aucune image intermédiaire (ancien fond + nouveau texte…) n'est jamais affichée, et les transitions normales
  // (survol, ouverture des panneaux…) restent intactes ensuite.
  function withThemeSwitch(fn) {
    var root = document.body, nested = root.classList.contains("pb-theme-switching");
    if (nested) return fn();
    root.classList.add("pb-theme-switching");
    try { fn(); void root.offsetHeight; } finally { root.classList.remove("pb-theme-switching"); }
  }
  function applyPalette() { withThemeSwitch(paintPalette); }
  function paintPalette() {
    applyCustomTokens();
    var resolved = skin === "navy" ? "dark" : skin === "custom" ? customResult.scheme : paletteResolved();
    document.body.dataset.skin = skin;
    $("[data-pb-main]").dataset.palette = resolved;
    document.body.dataset.palette = resolved;
    // Bascule rapide clair / sombre du panneau de droite : l'icône montre le mode vers lequel on bascule
    $$("[data-pb-theme-toggle]").forEach(function (b) {
      var dark = resolved === "dark";
      b.setAttribute("aria-pressed", String(dark));
      b.setAttribute("data-tip", dark ? "Passer en mode clair" : "Passer en mode sombre");
      b.setAttribute("aria-label", dark ? "Passer en mode clair" : "Passer en mode sombre");
    });
    $$("[data-pal-mode]").forEach(function (b) { var cur = b.dataset.palMode === paletteMode, on = cur && skin === "classic"; b.setAttribute("aria-checked", String(on)); b.tabIndex = cur ? 0 : -1; });
  }
  function setPaletteMode(m) { paletteMode = m; store.set("palette-theme", m); setSkin("classic"); }
  function setSkin(k) { skin = k; store.set("editor-skin", k); withThemeSwitch(function () { applyPalette(); if (window.pbThemeDialogRefresh) window.pbThemeDialogRefresh(); }); }
  function setCustom(t) { customTheme = t; store.set("editor-custom", t); if (skin !== "custom") { skin = "custom"; store.set("editor-skin", "custom"); } withThemeSwitch(function () { applyPalette(); if (window.pbThemeDialogRefresh) window.pbThemeDialogRefresh(); }); }
  (function buildPaletteFoot() {
    var group = h("div", { class: "pb-pal-theme", role: "radiogroup", "aria-label": "Apparence de l'éditeur" }, PALETTE_MODES.map(function (m) {
      return h("button", { type: "button", role: "radio", "aria-checked": "false", "data-pal-mode": m[0], "data-tip": "Apparence " + m[1].toLowerCase(), "aria-label": "Apparence " + m[1].toLowerCase(),
        onclick: function () { setPaletteMode(m[0]); } }, icon(m[2]));
    }));
    // Flèches : passer d'un mode à l'autre comme un groupe de boutons radio
    group.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var i = PALETTE_MODES.findIndex(function (m) { return m[0] === paletteMode; });
      var next = PALETTE_MODES[(i + d + PALETTE_MODES.length) % PALETTE_MODES.length][0];
      setPaletteMode(next);
      var btn = group.querySelector('[data-pal-mode="' + next + '"]'); if (btn) btn.focus();
    });
    var themesBtn = h("button", { type: "button", class: "pb-panel-toggle", "data-pb-themes": "", "data-tip": "Thèmes de l'éditeur : Classique, Personnalisé, Navy Premium", "aria-label": "Thèmes de l'éditeur", "aria-haspopup": "dialog", onclick: openThemeDialog }, icon("palette"));
    $("[data-pb-left]").appendChild(h("div", { class: "pb-pal-foot" }, h("span", { class: "pb-pal-foot-label", text: "Apparence" }), themesBtn, group));
    $$("[data-pb-theme-toggle]").forEach(function (b) { b.addEventListener("click", function () { var dark = skin === "classic" ? paletteResolved() === "dark" : $("[data-pb-main]").dataset.palette === "dark"; setPaletteMode(dark ? "light" : "dark"); }); });
    applyPalette();
  })();
  // ---------- Fenêtre « Thèmes de l'éditeur » : aperçus réels, sélecteur de couleurs, présets ----------
  var CARD_PREVIEWS = {
    classic: function () { var dark = paletteResolved() === "dark"; return dark ? { top: "#0b2a40", panel: "#151515", border: "#2a2a2a", canvas: "#e9eff5", accent: "#6cb8e6" } : { top: "#0b2a40", panel: "#ffffff", border: "#dfe6ec", canvas: "#e9eff5", accent: "#0277b6" }; },
    custom: function () { var t = window.KWTheme.derive(customTheme).tokens; return { top: t["--editor-top"], panel: t["--editor-panel"], border: t["--editor-border"], canvas: "#e9eff5", accent: t["--editor-accent"] }; },
    navy: function () { return { top: "#0b2a40", panel: "#0a2438", border: "#17405d", canvas: "#e9eff5", accent: "#2b9ae0" }; },
  };
  var CARD_LABELS = { classic: ["Classique", "L'interface d'origine"], custom: ["Personnalisé", "Vos couleurs, contrastes calculés"], navy: ["Navy Premium", "Bleu nuit, canevas clair"] };
  var CUSTOM_FIELDS = [["accent", "Couleur d'accent", false], ["panel", "Panneaux", true], ["bg", "Fond de l'éditeur", true], ["top", "Barre supérieure", true], ["text", "Texte principal", true]];
  function openThemeDialog() {
    var dlg = $("[data-pb-theme-dialog]");
    if (!dlg) {
      dlg = h("dialog", { class: "pb-modal pb-theme-dialog", "data-pb-theme-dialog": "", "aria-labelledby": "pb-theme-title" });
      document.body.appendChild(dlg);
      dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    }
    dlg.textContent = "";
    var cards = h("div", { class: "pb-theme-cards", role: "radiogroup", "aria-label": "Thème de l'éditeur" });
    SKINS.forEach(function (k) {
      var pv = CARD_PREVIEWS[k]();
      var pvEl = h("span", { class: "pb-tp", "aria-hidden": "true" }, h("span", { class: "pb-tp-top" }), h("span", { class: "pb-tp-row" }, h("span", { class: "pb-tp-side" }), h("span", { class: "pb-tp-canvas" }, h("i")), h("span", { class: "pb-tp-side" })));
      pvEl.style.cssText = "--tp-top:" + pv.top + ";--tp-panel:" + pv.panel + ";--tp-border:" + pv.border + ";--tp-canvas:" + pv.canvas + ";--tp-accent:" + pv.accent;
      cards.appendChild(h("button", { type: "button", class: "pb-theme-card", role: "radio", "aria-checked": String(skin === k), "data-skin-choice": k, onclick: function () { setSkin(k); } },
        pvEl, h("span", {}, CARD_LABELS[k][0], h("small", { text: CARD_LABELS[k][1] }))));
    });
    var custom = h("section", { class: "pb-theme-custom", "data-pb-theme-custom": "", "aria-label": "Couleurs personnalisées" });
    custom.hidden = skin !== "custom";
    var presets = h("div", { class: "pb-theme-presets", role: "group", "aria-label": "Présets" });
    window.KWTheme.PRESETS.forEach(function (p) {
      presets.appendChild(h("button", { type: "button", class: "pb-theme-preset", "data-preset": p.key, onclick: function () { setCustom({ accent: p.accent, panel: p.panel, bg: p.bg, top: p.top }); } }, h("i", { style: "--sw:" + p.accent }), p.name));
    });
    var fields = h("div", { class: "pb-theme-fields" });
    CUSTOM_FIELDS.forEach(function (f) {
      var key = f[0];
      var id = "pb-theme-" + key;
      var picker = h("input", { type: "color", id: id, "data-theme-color": key, "aria-label": f[1] });
      var hex = h("input", { type: "text", "data-theme-hex": key, maxlength: "7", placeholder: f[2] ? "auto" : "#0277b6", "aria-label": f[1] + " (valeur hexadécimale)", spellcheck: "false", autocomplete: "off" });
      var commit = function (v) {
        var t = Object.assign({}, customTheme);
        if (v === "" && f[2]) delete t[key]; else if (window.KWTheme.parseHex(v)) t[key] = window.KWTheme.toHex(window.KWTheme.parseHex(v)); else return;
        setCustom(t);
      };
      picker.addEventListener("input", function () { commit(picker.value); });
      hex.addEventListener("change", function () { commit(hex.value.trim()); });
      fields.appendChild(h("label", { class: "pb-theme-field", for: id }, f[1], h("span", { class: "pb-theme-inputs" }, picker, hex)));
    });
    var note = h("p", { class: "pb-theme-note", "data-pb-theme-note": "", role: "status" });
    custom.appendChild(presets); custom.appendChild(fields); custom.appendChild(note);
    custom.appendChild(h("div", { class: "pb-theme-actions" }, h("button", { type: "button", class: "btn btn-outline btn-sm", "data-theme-reset": "", onclick: function () { setCustom({ accent: "#0277b6" }); } }, "Réinitialiser")));
    var close = h("button", { type: "button", class: "pb-panel-toggle", "aria-label": "Fermer", "data-tip": "Fermer", onclick: function () { dlg.close(); } }, icon("close"));
    dlg.appendChild(h("div", { class: "pb-modal-head" }, h("h2", { id: "pb-theme-title", text: "Thèmes de l'éditeur" }), h("span", { class: "pb-modal-spacer" }), close));
    dlg.appendChild(h("div", { class: "pb-theme-body" }, h("p", { class: "pb-theme-note", text: "Un thème change seulement les couleurs et les effets de l'interface : jamais la page, le canevas ni les fonctions." }), cards, custom));
    window.pbThemeDialogRefresh = function () {
      if (!dlg.open) return;
      $$("[data-skin-choice]", dlg).forEach(function (c) { c.setAttribute("aria-checked", String(c.dataset.skinChoice === skin)); var pv = CARD_PREVIEWS[c.dataset.skinChoice](); var el = c.querySelector(".pb-tp"); el.style.cssText = "--tp-top:" + pv.top + ";--tp-panel:" + pv.panel + ";--tp-border:" + pv.border + ";--tp-canvas:" + pv.canvas + ";--tp-accent:" + pv.accent; });
      custom.hidden = skin !== "custom";
      var derived = window.KWTheme.derive(customTheme);
      var tk = derived.tokens, shown = { accent: customTheme.accent, panel: tk["--editor-panel"], bg: tk["--editor-bg"], top: tk["--editor-top"], text: tk["--editor-text"] };
      CUSTOM_FIELDS.forEach(function (f) {
        var picker = dlg.querySelector('[data-theme-color="' + f[0] + '"]'), hex = dlg.querySelector('[data-theme-hex="' + f[0] + '"]');
        picker.value = shown[f[0]]; if (document.activeElement !== hex) hex.value = customTheme[f[0]] ? customTheme[f[0]].toUpperCase() : "";
      });
      var r = derived.report;
      note.textContent = "Contraste du texte : " + r.text.toFixed(1) + ":1 · de l'accent : " + r.accentText.toFixed(1) + ":1" + (r.accentAdjusted ? " · l'accent a été légèrement ajusté pour rester visible." : ".");
    };
    dlg.showModal();
    window.pbThemeDialogRefresh();
    var cur = dlg.querySelector('.pb-theme-card[aria-checked="true"]'); if (cur) cur.focus();
  }
  if (paletteMedia) { var onScheme = function () { if (paletteMode === "system") applyPalette(); }; if (paletteMedia.addEventListener) paletteMedia.addEventListener("change", onScheme); else if (paletteMedia.addListener) paletteMedia.addListener(onScheme); }

  // Sections repliables de l'Inspecteur : le contenu apparaît en douceur quand l'AUTEUR ouvre (jamais quand l'Inspecteur est reconstruit avec des sections déjà ouvertes)
  var accUser = 0;
  ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest("summary")) accUser = Date.now(); }, true); });
  document.addEventListener("toggle", function (e) { var d = e.target; if (window.KolMotion && d.open && d.matches && d.matches("details.pb-acc, details.pb-info") && Date.now() - accUser < 500) window.KolMotion.appear(d.querySelector(":scope > .pb-acc-body, :scope > .pb-meta"), "rise"); }, true);

  // ---------- Panneaux redimensionnables ----------
  var main = $("[data-pb-main]");
  var PANEL_MIN_RIGHT = 280;
  // live : glissement d'une poignée en cours — les préférences ne sont écrites qu'au relâchement (une écriture, pas une par pixel)
  function applyPanels(live) {
    if (panels.right < PANEL_MIN_RIGHT) panels.right = PANEL_MIN_RIGHT; // largeur enregistrée avant ce minimum
    main.style.setProperty("--pb-tools-w", panels.toolsExpanded ? "176px" : panels.toolsDense ? "136px" : "48px");
    main.classList.toggle("is-tools-expanded", Boolean(panels.toolsExpanded));
    main.classList.toggle("is-tools-dense", Boolean(panels.toolsDense) && !panels.toolsExpanded);
    main.style.setProperty("--pb-left-w", panels.left + "px");
    main.style.setProperty("--pb-right-w", panels.right + "px");
    main.classList.toggle("is-left-hidden", panels.leftHidden);
    main.classList.toggle("is-right-hidden", panels.rightHidden);
    $("[data-pb-right]").style.setProperty("--pb-layers-h", panels.layers + "%");
    if (!live) store.set("panels", panels);
    queueZoom();
  }
  function togglePanel(side) { panels[side + "Hidden"] = !panels[side + "Hidden"]; applyPanels(); renderTools(); if (!panels[side + "Hidden"] && window.KolMotion) window.KolMotion.appear($(side === "left" ? "[data-pb-left]" : "[data-pb-right]"), "panel-" + side); if (pageSettingsStale) refreshPageSettings(); }
  $$("[data-pb-resize]").forEach(function (handle) {
    var side = handle.dataset.pbResize;
    // Largeur : jamais assez étroite pour rendre les contrôles illisibles (droite : 280 px au moins), ni plus de la moitié de la fenêtre
    var setW = function (w, live) { var min = side === "right" ? PANEL_MIN_RIGHT : 200; panels[side] = Math.min(560, Math.max(min, Math.min(Math.round(w), Math.round(window.innerWidth * 0.5)))); panels[side + "Hidden"] = false; applyPanels(live); };
    handle.addEventListener("pointerdown", function (e) {
      e.preventDefault(); handle.setPointerCapture(e.pointerId); panelDragging = true;
      var sx = e.clientX, sw = panels[side];
      frame.style.pointerEvents = "none";
      var move = function (ev) { setW(side === "left" ? sw + ev.clientX - sx : sw - (ev.clientX - sx), true); };
      var up = function () { handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", up); frame.style.pointerEvents = ""; panelDragging = false; store.set("panels", panels); queueZoom(); renderTools(); };
      handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", up);
    });
    handle.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setW(panels[side] + ((e.key === "ArrowRight") === (side === "left") ? 16 : -16)); } });
    handle.addEventListener("dblclick", function () { togglePanel(side); });
  });
  var split = $("[data-pb-split]");
  split.addEventListener("pointerdown", function (e) {
    e.preventDefault(); split.setPointerCapture(e.pointerId);
    var r = $("[data-pb-right]").getBoundingClientRect();
    frame.style.pointerEvents = "none";
    var move = function (ev) { panels.layers = Math.min(80, Math.max(15, Math.round((ev.clientY - r.top) / r.height * 100))); applyPanels(); };
    var up = function () { split.removeEventListener("pointermove", move); split.removeEventListener("pointerup", up); frame.style.pointerEvents = ""; };
    split.addEventListener("pointermove", move); split.addEventListener("pointerup", up);
  });
  split.addEventListener("keydown", function (e) { if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); panels.layers = Math.min(80, Math.max(15, panels.layers + (e.key === "ArrowDown" ? 4 : -4))); applyPanels(); } });

  // ---------- Onglets du panneau gauche ----------
  // Bibliothèque (onglet Éléments) : Widgets, Composants, Globales — onglet mémorisé dans ce navigateur
  var libTabs = $$(".pb-subtabs [role=tab]");
  function openLibTab(tab) { libTabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute("aria-controls")).hidden = !on; }); store.set("lib-tab", tab.id); }
  libTabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openLibTab(t); });
    t.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var next = libTabs[(i + (e.key === "ArrowRight" ? 1 : libTabs.length - 1)) % libTabs.length]; openLibTab(next); next.focus(); });
  });
  if (document.getElementById(store.get("lib-tab", ""))) openLibTab(document.getElementById(store.get("lib-tab", "")));
  var tabs = $$(".pb-tabs [role=tab]");
  function openTab(tab) { if (panels.leftHidden) togglePanel("left"); tabs.forEach(function (t) { var on = t === tab; t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1; document.getElementById(t.getAttribute("aria-controls")).hidden = !on; }); if (pageSettingsStale) refreshPageSettings(); }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { openTab(t); });
    t.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length]; openTab(next); next.focus(); });
  });

  // ---------- Réglages de la page (titre, description, SEO, couleurs) ----------
  // Le panneau « Page » (réglages, aperçu et analyse SEO côté serveur) n'est reconstruit que lorsqu'il est visible : sinon il est
  // seulement marqué « à rafraîchir » et refait à l'ouverture de l'onglet (une requête et une reconstruction en moins par modification).
  var pageSettingsStale = true;
  function pageSettingsVisible() { var box = $("[data-pb-page-settings]"), pane = box && box.closest("[role=tabpanel]"); return Boolean(pane) && !pane.hidden && !panels.leftHidden; }
  function refreshPageSettings() { if (!pageSettingsVisible()) { pageSettingsStale = true; return; } renderPageSettings(); }
  // ---------- Format de mise en page (conception guidée) : le serveur applique le verrou ; ici, refus immédiat et clair ----------
  var LF = boot.layoutFormats || { formats: {}, protected: [], labels: {} };
  function layoutOf() { var l = content.theme && content.theme.layout; return l && l.mode === "guided" ? l : null; }
  function formatLocked() { var l = layoutOf(); return Boolean(l && l.locked); }
  function isTopLevelId(id) { var l = locate(id); return Boolean(l && l.parent && l.parent.type === "layout"); }
  function refuseFormat(ids, keys) {
    if (!formatLocked() || !keys.some(function (k) { return LF.protected.indexOf(k) >= 0; }) || !ids.some(isTopLevelId)) return false;
    toast("Format verrouillé : la largeur et les marges des éléments de premier niveau sont protégées. Déverrouillez le format dans l'onglet « Page ».", true);
    return true;
  }
  function formatConflicts() {
    var out = [];
    content.sections.forEach(function (s) {
      if (s.type !== "layout") return;
      (s.children || []).forEach(function (n) {
        var sets = Object.keys(n.styles || {}).map(function (k) { return n.styles[k]; }).concat(Object.keys(n.states || {}).map(function (k) { return n.states[k]; }));
        if (sets.some(function (set) { return LF.protected.some(function (p) { return set && set[p] !== undefined && set[p] !== ""; }); })) out.push(n);
      });
    });
    return out;
  }
  function setLayout(next, opts) {
    opts = opts || {};
    var conflicts = next && next.locked ? formatConflicts() : [];
    if (conflicts.length && !opts.clear) {
      if (!window.confirm(conflicts.length + " élément(s) de premier niveau ont déjà une largeur ou des marges. Pour verrouiller ce format, ces réglages doivent être remis à zéro (annulable avec Ctrl/⌘ + Z). Continuer ?")) { renderPageSettings(); return; }
      opts.clear = true;
    }
    var label = next ? "Format : " + ((LF.formats[next.format] || {}).label || next.format) + (next.locked ? " (verrouillé)" : "") : "Conception libre";
    change(function () {
      content.theme = Object.assign({}, content.theme);
      if (next) content.theme.layout = next; else delete content.theme.layout;
      if (opts.clear) formatConflicts().forEach(function (n) {
        Object.keys(n.styles || {}).concat(Object.keys(n.states || {})).forEach(function (k) {
          var set = (n.styles && n.styles[k]) || (n.states && n.states[k]);
          LF.protected.forEach(function (p) { if (set) delete set[p]; });
          cleanStyles(n);
        });
      });
    }, { label: label });
    // Verrouiller / déverrouiller : enregistrement immédiat (le serveur n'accepte un déverrouillage que seul)
    saveNow().then(function () { var ae = document.activeElement; if (ae && ae.blur && $("[data-pb-page-settings]").contains(ae)) ae.blur(); renderPageSettings(); renderInspector(); });
  }
  // Magnétisme de défilement de la page : la page s'accroche au début de chaque section (theme.scrollSnap)
  function scrollSnapSection(box) {
    var cur = (content.theme && content.theme.scrollSnap) || null;
    var put = function (patch) {
      change(function () {
        content.theme = Object.assign({}, content.theme);
        var next = Object.assign({}, cur || { position: "start" }, patch);
        if (patch.position === "") delete content.theme.scrollSnap;
        else { if (!next.padding) delete next.padding; if (!next.always) delete next.always; content.theme.scrollSnap = next; }
      }, { key: "page:scrollSnap", light: true });
    };
    box.appendChild(h("p", { class: "pb-sub", text: "Magnétisme de défilement" }));
    box.appendChild(selectField("Accrocher les sections", cur ? cur.position : "", [["", "Non"], ["start", "Au haut de l'écran"], ["center", "Au centre de l'écran"], ["end", "Au bas de l'écran"]], function (v) { put({ position: v }); }, { disabled: !canWrite, hint: "En faisant défiler la page publiée, chaque section s'accroche à la position choisie. Pas actif dans l'éditeur." }));
    if (cur) {
      box.appendChild(numberField("Marge de défilement (px)", cur.padding || 0, { min: 0, max: 300, step: 1, integer: true, disabled: !canWrite }, function (n) { if (n === null) return false; put({ padding: n }); }, "Utile avec un en-tête fixe, pour que la section ne passe pas dessous."));
      box.appendChild(checkField("Arrêt obligatoire sur chaque section", cur.always, function (v) { put({ always: v }); }, { disabled: !canWrite, hint: "Plus strict : on ne peut pas dépasser une section sans s'y arrêter." }));
    }
  }
  function formatSection(box) {
    box.appendChild(h("p", { class: "pb-sub", text: "Format de mise en page" }));
    var l = layoutOf(), locked = formatLocked();
    var fmt = function (patch) { return Object.assign({ mode: "guided", format: "standard", maxWidth: 1200, gutter: 24, locked: false }, l || {}, patch); };
    var presets = LF.formats;
    box.appendChild(selectField("Conception", l ? "guided" : "free", [["free", "Libre : je règle tout moi-même"], ["guided", "Guidée par un format"]], function (v) {
      if (v === "free") setLayout(null); else { var f = presets.standard; setLayout({ mode: "guided", format: "standard", maxWidth: f.maxWidth, gutter: f.gutter, locked: false }); }
    }, { disabled: !canWrite || locked }));
    if (!l) { box.appendChild(h("p", { class: "pb-hint", text: "Conteneurs, Flexbox et widgets : aucune contrainte. Le format n'est pas une taille d'écran : l'aperçu ordinateur / tablette / mobile ne change pas." })); return; }
    box.appendChild(selectField("Format", l.format, Object.keys(presets).map(function (k) { return [k, presets[k].label + (k !== "custom" && presets[k].maxWidth ? " · " + presets[k].maxWidth + " px" : "")]; }), function (v) {
      var f = presets[v]; setLayout(fmt({ format: v, maxWidth: v === "custom" ? l.maxWidth : f.maxWidth, gutter: v === "custom" ? l.gutter : f.gutter }));
    }, { disabled: !canWrite || locked }));
    box.appendChild(h("p", { class: "pb-hint", text: (presets[l.format] || {}).hint || "" }));
    if (l.format === "custom") {
      box.appendChild(textField("Largeur maximale du contenu (px, 0 = aucune)", String(l.maxWidth), function (v) { var n = Math.round(Number(v)); if (isFinite(n) && (n === 0 || (n >= 320 && n <= 2400))) setLayout(fmt({ maxWidth: n })); }, { type: "number", disabled: !canWrite || locked }));
      box.appendChild(textField("Marge latérale minimale (px)", String(l.gutter), function (v) { var n = Math.round(Number(v)); if (isFinite(n) && n >= 0 && n <= 96) setLayout(fmt({ gutter: n })); }, { type: "number", disabled: !canWrite || locked }));
    } else box.appendChild(h("p", { class: "pb-hint", text: "Largeur fluide plafonnée à " + (l.maxWidth ? l.maxWidth + " px" : "l'écran") + ", marges de " + l.gutter + " px minimum. Les éléments de premier niveau de chaque section suivent ce format ; un réglage manuel l'emporte tant que le format est déverrouillé." }));
    // Largeur effective du contenu à l'écran actuel (ordinateur / tablette / mobile) : mesurée sur la largeur LOGIQUE de l'iframe (clientWidth : le zoom n'y change rien)
    var eff = h("p", { class: "pb-hint", "data-pb-format-effective": "", "aria-live": "polite" });
    var paintEff = function () {
      var fr = $("[data-pb-frame]"), vw = fr ? fr.clientWidth : 0, avail = vw - 2 * l.gutter, cap = l.maxWidth > 0 && avail > l.maxWidth, w = cap ? l.maxWidth : avail;
      eff.textContent = vw > 0 && w > 0 ? "Largeur effective du contenu à cet écran : " + w + " px (écran de " + vw + " px, marges de " + l.gutter + " px de chaque côté" + (cap ? ", contenu centré" : ", le contenu suit l'écran") + ")." : "";
    };
    paintEff();
    box.appendChild(eff);
    if (window.ResizeObserver && $("[data-pb-frame]")) { var ro = new ResizeObserver(function () { if (!eff.isConnected) { ro.disconnect(); return; } paintEff(); }); ro.observe($("[data-pb-frame]")); }
    box.appendChild(checkField("Verrouiller le format", l.locked, function (v) { setLayout(fmt({ locked: v })); }, { disabled: !canWrite, hint: locked ? "Protégé : " + LF.protected.map(function (p) { return LF.labels[p]; }).join(", ").toLowerCase() + " des éléments de premier niveau, le format lui-même. Textes, images, couleurs, widgets et sections restent libres." : "Verrouillé, le format protège la largeur et les marges des éléments de premier niveau, y compris pour l'IA." }));
  }
  // ---------- Écran de démarrage d'une page vide : création GUIDÉE uniquement ----------
  // Le choix « classique / guidée » n'existe plus : une page vide ouvre directement le catalogue de gabarits. Aucun moteur de plus : le parcours écrit theme.layout
  // par setLayout (même voie que l'onglet Page, verrou contrôlé par le serveur), donc largeur et marges sont toujours initialisées. Les pages existantes,
  // créées sans format, s'ouvrent comme avant (l'écran n'apparaît que pour un vrai état vide) ; l'accueil rouvert garde « Ajouter une structure ». Affiché seulement pour un vrai état vide : écriture permise, aucune section, aucun format, canevas rendu, aucune
  // modification dans la session. Dès qu'une section ou une modification existe, il ne revient plus (vider une page existante ne le déclenche pas).
  var startEl = $("[data-pb-start]"), startStep = "choice", startDraft = null, startDone = IS_COMPONENT || !canWrite || content.sections.length > 0 || Boolean(layoutOf());
  var PC = boot.pageCatalog || null, catState = { q: "", group: "all", scope: "gabarits", sort: "default" }, recentFilter = "all";
  function startEligible() { return !startDone && canvasReady && !past.length && !content.sections.length && !layoutOf(); }
  function startFinish() { homeOpen = false; if (homeBtn) homeBtn.setAttribute("aria-pressed", "false"); startDone = true; refreshStart(); }
  // ---------- Accueil rouvert à la demande (icône Accueil) : même panneau, vue de navigation seulement ----------
  // Ouvrir l'accueil ne touche ni au document, ni à l'historique, ni à l'enregistrement, ni à la sélection : « Reprendre mon travail » ne fait que
  // refermer le panneau, tout l'état de travail étant resté en mémoire. Aucun stockage de plus : après un rechargement, la page est restaurée
  // par le brouillon serveur (et la copie locale proposée par offerBackup), comme avant.
  var homeOpen = false, homeBtn = $("[data-pb-home]"), homeFrom = null;
  function hasWork() { return content.sections.length > 0 || past.length > 0 || Boolean(layoutOf()); }
  function homeButtonState() { if (homeBtn) { homeBtn.setAttribute("aria-pressed", String(homeOpen)); } }
  function closeHome() {
    if (!homeOpen) return;
    homeOpen = false; homeButtonState(); homeNotice = null;
    startEl.hidden = true; startEl.textContent = "";
    refreshStart();
    var back = homeFrom; homeFrom = null;
    if (back && back.isConnected && back.focus) back.focus({ preventScroll: true });
  }
  function openHome() {
    if (!startEl || IS_COMPONENT || !canWrite) return;
    if (homeOpen) { closeHome(); return; }
    if (!startEl.hidden) { var f0 = startEl.querySelector("button:not([disabled])"); if (f0) f0.focus({ preventScroll: true }); return; } // l'écran de démarrage est déjà affiché
    if (editing) commitEdit();
    if (mode !== "visual") setMode("visual"); // le panneau se pose sur le canevas visuel
    homeFrom = document.activeElement;
    homeOpen = true; homeButtonState(); homeNotice = null;
    startStep = "choice"; startDraft = null;
    startEl.hidden = false;
    paintStart();
  }
  if (homeBtn) { if (IS_COMPONENT || !canWrite) homeBtn.hidden = true; else homeBtn.addEventListener("click", openHome); }
  if (startEl) startEl.addEventListener("keydown", function (e) { if (e.key === "Escape" && homeOpen && startStep === "choice") { e.stopPropagation(); closeHome(); } });
  function refreshStart() {
    if (!startEl) return;
    if (homeOpen) return; // accueil ouvert volontairement : seule une action explicite le referme (pas le rendu qui suit une modification)
    if (!startDone && (content.sections.length || past.length || layoutOf())) startDone = true;
    if (!startEligible()) { if (!startEl.hidden) { startEl.hidden = true; startEl.textContent = ""; } return; }
    if (!startEl.hidden) return; // déjà affiché : pas de redessin
    startStep = "choice"; startDraft = null;
    startEl.hidden = false;
    paintStart();
  }
  function beginGuided() { startStep = PC ? "catalog" : "config"; var p = LF.formats.standard || {}; startDraft = { format: "standard", maxWidth: p.maxWidth || 1200, gutter: p.gutter || 24, locked: true, gabarit: "" }; }
  function paintStart(focusFirst) {
    startEl.textContent = "";
    var box = h("div", { class: "pb-start-box" });
    startEl.appendChild(box);
    if (startStep === "choice" && !homeOpen) beginGuided(); // création guidée obligatoire : pas de choix de mode
    if (startStep === "choice") paintStartChoice(box); else if (startStep === "catalog" && PC) paintCatalog(box); else paintStartConfig(box);
    if (focusFirst !== false) { var f = box.querySelector("button:not([disabled]), input:not([disabled])"); if (f) f.focus({ preventScroll: true }); }
  }
  // Illustrations SVG vectorielles inline (constantes, ~1 Ko chacune, aucune image ni requête) : même grammaire pour les quatre (fenêtre de navigateur,
  // trait de 1,5, rayons 6/3, accent réservé à l'élément « action »). Les couleurs viennent des jetons --editor-* via les classes il-* : elles suivent donc le thème.
  var IL_WIN = '<rect class="il-w" x="14" y="10" width="212" height="100" rx="8"/><path class="il-bar" d="M14 18a8 8 0 0 1 8-8h196a8 8 0 0 1 8 8v8H14z"/><circle class="il-t" cx="26" cy="18" r="2"/><circle class="il-t" cx="34" cy="18" r="2"/><circle class="il-t" cx="42" cy="18" r="2"/>';
  var IL_SVG = {
    resume: IL_WIN + '<rect class="il-s" x="26" y="34" width="188" height="28" rx="4"/><rect class="il-a" x="36" y="43" width="74" height="6" rx="3"/><rect class="il-t" x="36" y="53" width="104" height="3" rx="1.5"/><rect class="il-t" x="26" y="72" width="120" height="4" rx="2"/><rect class="il-bar" x="26" y="82" width="158" height="4" rx="2"/><rect class="il-bar" x="26" y="92" width="96" height="4" rx="2"/><rect class="il-a" x="148" y="68" width="1.8" height="14" rx="1"/><path class="il-cur" d="M176 70l0 22 5.5-5 4 9 3.5-1.6-4-8.6 7.5-.2z"/>',
    structure: IL_WIN + '<rect class="il-s" x="26" y="34" width="188" height="20" rx="4"/><rect class="il-t" x="36" y="41" width="70" height="4" rx="2"/><rect class="il-d" x="26" y="62" width="188" height="38" rx="5"/><rect class="il-w2" x="34" y="69" width="48" height="24" rx="3"/><rect class="il-w2" x="96" y="69" width="48" height="24" rx="3"/><rect class="il-w2" x="158" y="69" width="48" height="24" rx="3"/><circle class="il-a" cx="206" cy="100" r="11"/><path class="il-plus" d="M206 94.5v11M200.5 100h11"/>',
    blank: '<rect class="il-w" x="14" y="10" width="212" height="100" rx="8"/><path class="il-bar" d="M14 18a8 8 0 0 1 8-8h196a8 8 0 0 1 8 8v8H14z"/><circle class="il-t" cx="26" cy="18" r="2"/><circle class="il-t" cx="34" cy="18" r="2"/><circle class="il-t" cx="42" cy="18" r="2"/><rect class="il-d" x="30" y="36" width="180" height="64" rx="5"/><circle class="il-a" cx="120" cy="68" r="14"/><path class="il-plus" d="M120 60v16M112 68h16"/><path class="il-spark" d="M168 48l1.8 4.2 4.2 1.8-4.2 1.8L168 60l-1.8-4.2-4.2-1.8 4.2-1.8zM70 82l1.2 2.8 2.8 1.2-2.8 1.2L70 90l-1.2-2.8-2.8-1.2 2.8-1.2z"/>',
    guided: '<rect class="il-w" x="22" y="24" width="64" height="82" rx="6"/><rect class="il-s" x="30" y="32" width="48" height="22" rx="3"/><rect class="il-bar" x="30" y="62" width="48" height="4" rx="2"/><rect class="il-bar" x="30" y="72" width="32" height="4" rx="2"/><rect class="il-w" x="154" y="24" width="64" height="82" rx="6"/><rect class="il-bar" x="162" y="32" width="22" height="22" rx="3"/><rect class="il-bar" x="188" y="32" width="22" height="22" rx="3"/><rect class="il-bar" x="162" y="62" width="48" height="4" rx="2"/><rect class="il-bar" x="162" y="72" width="36" height="4" rx="2"/><rect class="il-w il-front" x="82" y="12" width="76" height="98" rx="7"/><rect class="il-s" x="91" y="21" width="58" height="26" rx="4"/><rect class="il-a" x="98" y="29" width="30" height="5" rx="2.5"/><rect class="il-t" x="98" y="37" width="40" height="3" rx="1.5"/><rect class="il-bar" x="91" y="55" width="26" height="18" rx="3"/><rect class="il-bar" x="123" y="55" width="26" height="18" rx="3"/><rect class="il-t" x="91" y="81" width="58" height="4" rx="2"/><rect class="il-a" x="91" y="92" width="26" height="9" rx="4.5"/>'
  };
  function illus(kind) {
    var el = h("div", { class: "pb-illus is-" + kind, "aria-hidden": "true" });
    el.innerHTML = '<svg viewBox="0 0 240 120" focusable="false" preserveAspectRatio="xMidYMid meet">' + (IL_SVG[kind] || "") + '</svg>';
    return el;
  }
  function paintStartChoice(box) { paintHomeChoice(box); } // seul l'accueil rouvert propose encore un choix (reprendre, structure, gabarit, nouvelle page)
  // Accueil rouvert : reprendre (action principale, pleine largeur) puis trois autres façons de commencer, étiquetées par ce qu'elles touchent :
  // « Sur cette page » (ajouter une structure, gabarit) ou « Nouveau document » (page vierge). Les identifiants data-pb-* des actions sont inchangés.
  function homeCard(iconName, tag, title, text, label, onclick, id) {
    return h("div", { class: "pb-start-card pb-home-card", "data-pb-start-card": id },
      illus(id === "guided" ? "guided" : id === "blank" ? "blank" : "structure"),
      h("div", { class: "pb-home-top" }, h("span", { class: "pb-start-icon", "aria-hidden": "true" }, icon(iconName)), h("span", { class: "pb-home-tag", text: tag })),
      h("h2", { class: "pb-start-title", text: title }),
      h("p", { class: "pb-start-text", text: text }),
      h("button", { type: "button", class: "btn btn-outline pb-start-btn", "data-pb-start-go": id, onclick: onclick }, label));
  }
  function paintHomeChoice(box) {
    var n = content.sections.length, lockedHome = formatLocked(), busy = newPageBusy;
    var summary = n ? plural(n, "section", "sections") + (past.length ? " · " + plural(past.length, "modification annulable", "modifications annulables") : "") + ". Rien n'est modifié en revenant." : "Page vide, réglages conservés. Rien n'est modifié en revenant.";
    box.appendChild(h("div", { class: "pb-home-head" }, h("h1", { class: "pb-start-head", text: "Que voulez-vous faire ?" }), h("p", { class: "pb-home-sub", text: "Votre travail est conservé : choisissez comment poursuivre." })));
    if (homeNotice) box.appendChild(h("p", { class: "pb-note" + (homeNotice.error ? " is-warn" : ""), role: homeNotice.error ? "alert" : "status", "data-pb-home-note": "", text: homeNotice.text }));
    var sv = blocked ? ["is-error", "Enregistrement impossible : document dans un état incertain"] : saving ? ["is-busy", "Enregistrement en cours…"] : dirty ? ["is-pending", "Modifications en attente d'enregistrement"] : ["is-ok", "Tout est enregistré"];
    box.appendChild(h("div", { class: "pb-start-card pb-home-resume", "data-pb-start-card": "resume" },
      illus("resume"),
      h("div", { class: "pb-home-resume-text" }, h("h2", { class: "pb-start-title", text: "Votre travail en cours" }), h("p", { class: "pb-start-text", text: summary }), h("p", { class: "pb-home-state " + sv[0], "data-pb-home-state": "", role: "status", text: sv[1] })),
      h("button", { type: "button", class: "btn btn-primary pb-start-btn", "data-pb-start-go": "resume", "data-pb-home-resume": "", onclick: closeHome }, "Reprendre mon travail")));
    box.appendChild(h("p", { class: "pb-home-label", text: "Ou commencer autrement" }));
    box.appendChild(h("div", { class: "pb-start-cards is-home" },
      homeCard("layers", "Sur cette page", "Ajouter une structure", "Ajoutez conteneurs, colonnes ou grille à la fin de la page. Rien n'est effacé.", "Ajouter une structure",
        function () { startFinish(); openStructurePicker({ parent: null, index: content.sections.length }); }, "classic"),
      homeCard("layout", "Sur cette page", "Création guidée", lockedHome ? "Format verrouillé : déverrouillez-le d'abord dans l'onglet « Page »." : "Appliquez un gabarit et ses règles de mise en page. Annulable avec Ctrl/⌘ + Z.", "Choisir un gabarit",
        function () { if (lockedHome) return; startStep = PC ? "catalog" : "config"; var p = layoutOf() || LF.formats.standard || {}; startDraft = layoutOf() ? { format: p.format, maxWidth: p.maxWidth, gutter: p.gutter, locked: Boolean(p.locked), gabarit: "" } : { format: "standard", maxWidth: p.maxWidth || 1200, gutter: p.gutter || 24, locked: true, gabarit: "" }; paintStart(); }, "guided"),
      homeCard("plus", "Nouveau document", "Nouvelle page vierge", "Créez une page vide et indépendante. La page actuelle reste enregistrée dans « Pages ».", busy ? "Création en cours…" : "Nouvelle page vierge", requestNewPage, "blank")));
    var blankBtn = box.querySelector('[data-pb-start-go="blank"]'); if (blankBtn) { blankBtn.disabled = busy; blankBtn.setAttribute("aria-busy", String(busy)); }
    if (lockedHome) { var gb = box.querySelector('[data-pb-start-go="guided"]'); if (gb) gb.disabled = true; }
    paintRecents(box);
  }
  // ---------- Nouvelle page vierge : enregistrement vérifié, puis création par la route existante ----------
  // La page courante n'est jamais vidée ni remplacée : une page DISTINCTE est créée (POST /marketing/pages, comme « Nouvelle page » du CMS), puis on y navigue.
  var newPageBusy = false, homeNotice = null;
  function setHomeNotice(text, error) { homeNotice = text ? { text: text, error: Boolean(error) } : null; if (homeOpen && startEl && !startEl.hidden && startStep === "choice") paintStart(false); }
  function setNewPageBusy(on) { newPageBusy = on; if (homeOpen && startEl && !startEl.hidden && startStep === "choice") paintStart(false); }
  // Enregistrement RÉEL du brouillon (même service que le bouton Enregistrer) ; réussi seulement si plus rien n'est en attente ni en erreur
  function saveConfirmed() {
    if (editing) commitEdit();
    return Promise.resolve(saveNow()).then(function () {
      if (saving && inflight) return inflight.then(function () { return saveConfirmed(); });
      if (dirty || blocked || aiHold || saving) throw new Error("L'enregistrement n'a pas abouti. Votre travail est conservé dans l'éditeur ; réessayez.");
      return true;
    });
  }
  // ---------- Dialogue commun de nommage : toute création réelle d'un NOUVEAU document passe ici ----------
  // Le nom est validé par le serveur (mêmes règles que le renommage : obligatoire, 100 caractères au plus, unique sans tenir compte de la casse), puis la page est
  // créée EN UNE FOIS avec ce nom (POST /marketing/pages/creer.json) : aucune page anonyme n'existe, même brièvement. Annuler ne crée rien ; une erreur garde le dialogue.
  // Résultat : { url } si la page est créée, null si l'utilisateur annule. `spec` : { template, layout } du parcours guidé (conservés tels quels).
  var NAME_MAX = 100;
  function askPageName(spec) {
    spec = spec || {};
    return new Promise(function (resolve) {
      var done = false, busy = false, checkTimer = null, checkSeq = 0, valid = false, input = null, msg = null, touched = false, badge = null;
      var okBtn = function () { return compDlg && compDlg.querySelector("[data-cd-ok]"); };
      var setState = function (text, kind) { msg.textContent = text || ""; msg.className = "pb-hint pb-name-msg" + (kind ? " is-" + kind : ""); input.setAttribute("aria-invalid", kind === "error" ? "true" : "false"); };
      var apply = function () { var b = okBtn(); if (b && !busy) b.disabled = !valid; };
      var validate = function () {
        var text = input.value.trim(); clearTimeout(checkTimer); valid = false; apply();
        if (!text) { setState(touched ? "Le nom est obligatoire." : "", ""); return; }
        if (text.length > NAME_MAX) { setState("Le nom ne peut pas dépasser " + NAME_MAX + " caractères (" + text.length + " saisis).", "error"); return; }
        setState("Vérification…", "");
        var seq = ++checkSeq;
        checkTimer = setTimeout(function () {
          api("GET", "/marketing/pages/nom.json?name=" + encodeURIComponent(text) + (spec.rename ? "&except=" + spec.rename.id : "") + (PAGE.siteId ? "&site=" + PAGE.siteId : "")).then(function (r) {
            if (seq !== checkSeq) return;
            valid = Boolean(r.ok); setState(r.ok ? "" : r.message, r.ok ? "" : "error"); apply();
          }, function () { if (seq !== checkSeq) return; valid = true; setState("", ""); apply(); }); // réseau indisponible : le serveur revérifiera à la création
        }, 250);
      };
      compDialog({ title: spec.rename ? "Renommer la page" : "Créer une nouvelle page", confirmLabel: spec.rename ? "Renommer" : "Créer la page", cancelLabel: "Annuler", build: function (body) {
        // Habillage propre à ce dialogue (classe retirée à la fermeture : le dialogue partagé reste identique pour les autres usages)
        compDlg.classList.add("pb-name-dlg");
        badge = h("span", { class: "pb-name-badge", "aria-hidden": "true" }, icon(spec.rename ? "edit" : "fileText"));
        var headEl = compDlg.querySelector(".pb-modal-head"); headEl.insertBefore(badge, headEl.firstChild);
        body.appendChild(h("p", { class: "pb-hint pb-name-intro", text: spec.rename ? "Le nom change partout ; l'adresse de la page et son identifiant restent les mêmes." : "Donnez un nom à votre page pour la retrouver facilement dans votre espace de travail." }));
        input = h("input", { type: "text", class: "pb-input", "data-pb-name-input": "", id: "pb-name-input", maxlength: String(NAME_MAX + 50), placeholder: "Ex. : Accueil, À propos, Nos services…", autocomplete: "off", "aria-describedby": "pb-name-msg", "aria-required": "true" });
        msg = h("p", { class: "pb-hint pb-name-msg", id: "pb-name-msg", role: "status", "aria-live": "polite" });
        body.appendChild(h("div", { class: "pb-field" }, h("label", { for: "pb-name-input", text: "Nom de la page" }), input));
        body.appendChild(msg);
        input.addEventListener("input", function () { touched = true; validate(); });
        if (spec.rename) input.value = spec.rename.name;
        setTimeout(function () { validate(); input.focus(); input.select(); }, 0);
      }, onConfirm: function () {
        if (busy || !valid) return false;
        busy = true; var b = okBtn(); if (b) { b.disabled = true; b.setAttribute("aria-busy", "true"); b.textContent = spec.rename ? "Enregistrement…" : "Création…"; }
        if (spec.rename) return api("POST", "/marketing/pages/" + spec.rename.id + "/renommer.json", { name: input.value.trim() }).then(function (r) { done = true; resolve({ name: r.page.name }); return true; }, function (e) { busy = false; var b3 = okBtn(); if (b3) { b3.removeAttribute("aria-busy"); b3.textContent = "Renommer"; } setTimeout(apply, 0); throw e; });
        var body = { name: input.value.trim(), template: spec.template || "", layout: spec.layout || null };
        if (PAGE.siteId) body.siteId = PAGE.siteId;
        return api("POST", "/marketing/pages/creer.json", body).then(function (r) { done = true; resolve({ url: r.url }); return true; }, function (e) {
          busy = false; var b2 = okBtn(); if (b2) { b2.removeAttribute("aria-busy"); b2.textContent = "Créer la page"; }
          setTimeout(function () { apply(); if (/déjà ce nom/.test(e.message || "")) { valid = false; setState(e.message, "error"); apply(); } }, 0);
          throw e;
        });
      } });
      compDlg.addEventListener("close", function onClose() { compDlg.removeEventListener("close", onClose); clearTimeout(checkTimer); compDlg.classList.remove("pb-name-dlg"); if (badge && badge.parentNode) badge.parentNode.removeChild(badge); if (!done) resolve(null); });
    });
  }
  // Renommer depuis la barre supérieure : mêmes règles et même dialogue ; le nom est mis à jour partout où il est affiché sans recharger l'éditeur
  var titleEl = $(".pb-title h1");
  if (titleEl && !IS_COMPONENT && canWrite && PAGE.id) {
    var renameBtn = h("button", { type: "button", class: "pb-icon-btn pb-title-edit", "data-pb-rename": "", "data-tip": "Renommer la page", "aria-label": "Renommer la page" }, icon("edit"));
    titleEl.parentNode.insertBefore(renameBtn, titleEl.nextSibling);
    renameBtn.addEventListener("click", function () {
      askPageName({ rename: { id: PAGE.id, name: PAGE.name || titleEl.textContent } }).then(function (r) {
        if (!r) return;
        PAGE.name = r.name; titleEl.textContent = r.name;
        document.title = document.title.replace(/^[^·]*/, "Éditeur — " + r.name + " ");
        toast("Page renommée : « " + r.name + " ».");
      });
    });
  }
  var CANCELLED = function () { var e = new Error("Création annulée."); e.cancelled = true; return e; };
  // Adresse de la page créée, ou rejet « annulé » (rien n'a été créé)
  function nameThenCreate(spec) { return askPageName(spec).then(function (r) { if (!r) throw CANCELLED(); return r.url; }); }
  function leaveFor(url, discard) {
    if (discard) { dirty = false; clearTimeout(saveTimer); try { localStorage.removeItem("pb-backup-" + PAGE.id); localStorage.removeItem(HISTORY_KEY); } catch (e) { /* stockage indisponible */ } }
    window.location.assign(url);
  }
  var NEWPAGE_LEAVE = { getUrl: function () { return nameThenCreate({}); }, auto: true, text: "Vous allez quitter le document actuel pour créer une nouvelle page vierge. Enregistrez vos modifications pour pouvoir reprendre ce travail plus tard.", saved: "Votre travail est enregistré. Vous pouvez maintenant créer la nouvelle page vierge." };
  function requestNewPage() { requestLeave(NEWPAGE_LEAVE); }
  // Quitter ce document pour un autre (nouvelle page, page récente, liste des pages) : jamais de perte silencieuse, enregistrement vérifié d'abord.
  // opts : getUrl() → promesse de l'adresse à ouvrir ; text : explication de la boîte de dialogue ; saved : message après un enregistrement réussi.
  function notifyLeave(text, error) { if (homeOpen && startStep === "choice") setHomeNotice(text, error); else if (text) toast(text, error); }
  function requestLeave(opts) {
    if (newPageBusy || !canWrite) return;
    if (blocked || aiHold) { notifyLeave(blocked ? "Ce document est dans un état incertain (modifié ailleurs ou enregistrement refusé) : rien n'est quitté. Actualisez ou copiez votre travail d'abord." : "Une proposition de l'IA est en cours d'aperçu : appliquez-la ou annulez-la avant de quitter ce document.", true); return; }
    if (editing) commitEdit();
    setNewPageBusy(true); setHomeNotice(null);
    var settle = saving && inflight ? inflight.then(function () {}) : Promise.resolve();
    settle.then(function () {
      if (blocked || aiHold) throw new Error("Ce document est dans un état incertain : rien n'est quitté.");
      if (!dirty && !saving) return opts.getUrl().then(function (url) { leaveFor(url, false); return "left"; });
      setNewPageBusy(false); // modifications en attente : la boîte de dialogue décide
      return openLeaveDialog(opts).then(function () { return "dialog"; });
    }).catch(function (err) { setNewPageBusy(false); if (err && err.cancelled) return; notifyLeave(err.message || "L'opération a échoué.", true); });
  }
  function openLeaveDialog(opts) {
    return new Promise(function (resolve) {
      var confirming = false, working = false, quitBtn = null;
      var lock = function (on) { working = on; if (!compDlg) return; Array.prototype.forEach.call(compDlg.querySelectorAll("button"), function (b) { b.disabled = on; }); };
      compDialog({ title: "Enregistrer votre travail avant de continuer ?", confirmLabel: "Enregistrer et continuer", cancelLabel: "Annuler", build: function (body) {
        body.appendChild(h("p", { class: "pb-hint", "data-pb-leave-text": "", text: opts.text }));
        quitBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-leave-quit": "", onclick: function () {
          if (working) return;
          var err = compDlg.querySelector("[data-cd-error]");
          if (!confirming) { confirming = true; quitBtn.textContent = "Confirmer : abandonner mes modifications"; quitBtn.classList.add("btn-danger"); err.textContent = "Les modifications non enregistrées de ce document seront perdues. La dernière version enregistrée reste intacte."; err.hidden = false; return; }
          lock(true); err.hidden = true;
          // Le document n'est abandonné (leaveFor) qu'APRÈS la création réussie de la nouvelle page : si le nom est annulé, rien n'est perdu
          lock(false); compDlg.close();
          setTimeout(function () { opts.getUrl().then(function (url) { leaveFor(url, true); resolve("quit"); }, function (e) { if (!e.cancelled) notifyLeave(e.message, true); }); }, 50);
        } }, "Quitter sans enregistrer");
        body.appendChild(quitBtn);
      }, onConfirm: function () {
        if (working) return false;
        lock(true);
        return saveConfirmed().then(function () {
          lock(false);
          if (opts.auto) { lock(false); resolve("saved"); setTimeout(function () { opts.getUrl().then(function (u) { leaveFor(u, false); }, function (e) { setNewPageBusy(false); if (!e.cancelled) notifyLeave(e.message, true); }); }, 50); return true; }
          notifyLeave(opts.saved, false);
          resolve("saved"); return true;
        }, function (e) { lock(false); throw e; });
      } });
      compDlg.addEventListener("close", function onClose() { compDlg.removeEventListener("close", onClose); resolve("closed"); });
    });
  }
  // ---------- Création guidée : catalogue de gabarits réels + inventaire des types de pages (étape « catalog ») ----------
  // Quatre notions séparées : type de page (inventaire), gabarit visuel (composition réelle de sections), structure (conteneurs/grille, inchangés) et
  // format du canevas (étape suivante). Les types sans gabarit sont seulement RÉPERTORIÉS (jamais présentés comme prêts). Aucun gabarit simulé.
  var WF = { hero: "hero", features: "cols", list: "lines", text: "lines", faq: "rows", cta: "cta", form: "form", testimonials: "quote", course: "card", divider: "rule", layout: "cols" };
  function wireframe(shape) {
    var wf = h("div", { class: "pb-wf", "aria-hidden": "true" });
    (shape.length ? shape : ["text"]).slice(0, 7).forEach(function (t) {
      var k = WF[t] || "lines", b = h("span", { class: "pb-wf-" + k });
      if (k === "cols" || k === "card") { b.appendChild(h("i")); b.appendChild(h("i")); if (k === "cols") b.appendChild(h("i")); }
      if (k === "lines" || k === "rows" || k === "form") { b.appendChild(h("i")); b.appendChild(h("i")); }
      wf.appendChild(b);
    });
    return wf;
  }
  function catMatches(words, hay) { return words.every(function (w) { return hay.indexOf(w) >= 0; }); }
  function paintCatalog(box) {
    var d = startDraft, st = catState;
    var gabs = PC.gabarits, typeById = {}; PC.types.forEach(function (t) { typeById[t.id] = t; });
    var home = homeOpen;
    box.appendChild(h("div", { class: "pb-home-head" }, h("h1", { class: "pb-start-head", text: "Choisissez un gabarit" }),
      h("p", { class: "pb-home-sub", "data-pb-cat-count": "", text: plural(gabs.length, "gabarit prêt à l'emploi", "gabarits prêts à l'emploi") + " · " + plural(PC.types.length, "type de page répertorié", "types de pages répertoriés") + ". Un gabarit n'est jamais un format : vous réglerez la largeur ensuite." })));
    var q = h("input", { type: "search", class: "pb-input", "data-pb-cat-q": "", placeholder: "Rechercher : contact, vente, portfolio…", "aria-label": "Rechercher un gabarit ou un type de page", value: st.q });
    var sort = h("select", { class: "pb-input", "data-pb-cat-sort": "", "aria-label": "Trier" }, h("option", { value: "default", text: "Ordre proposé" }), h("option", { value: "name", text: "Nom (A → Z)" }), h("option", { value: "sections", text: "Nombre de sections" }));
    sort.value = st.sort;
    var scope = h("div", { class: "pb-cat-seg", role: "group", "aria-label": "Afficher" });
    [["gabarits", "Gabarits disponibles"], ["all", "Tous les types de pages"]].forEach(function (o) {
      scope.appendChild(h("button", { type: "button", class: "pb-cat-chip" + (st.scope === o[0] ? " is-on" : ""), "aria-pressed": String(st.scope === o[0]), "data-pb-cat-scope": o[0], onclick: function () { st.scope = o[0]; repaintCat(); } }, o[1]));
    });
    box.appendChild(h("div", { class: "pb-cat-bar" }, q, sort, scope));
    var groups = h("div", { class: "pb-cat-groups", role: "group", "aria-label": "Catégories" });
    [{ id: "all", label: "Toutes les catégories" }].concat(PC.groups).forEach(function (g) {
      groups.appendChild(h("button", { type: "button", class: "pb-cat-chip" + (st.group === g.id ? " is-on" : ""), "aria-pressed": String(st.group === g.id), "data-pb-cat-group": g.id, onclick: function () { st.group = g.id; repaintCat(); } }, g.label));
    });
    box.appendChild(groups);
    var results = h("div", { class: "pb-cat-results", "aria-live": "polite" });
    box.appendChild(results);
    var action = h("div", { class: "pb-start-actions pb-cat-actions" });
    box.appendChild(action);
    function repaintCat() {
      $$("[data-pb-cat-scope]", box).forEach(function (b) { var on = b.getAttribute("data-pb-cat-scope") === st.scope; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      $$("[data-pb-cat-group]", box).forEach(function (b) { var on = b.getAttribute("data-pb-cat-group") === st.group; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); });
      results.textContent = "";
      var words = norm(st.q).split(/\s+/).filter(Boolean);
      var okGab = gabs.filter(function (g) {
        if (st.group !== "all" && g.groups.indexOf(st.group) < 0) return false;
        var hay = norm([g.name, g.category, g.description].concat(g.types.map(function (id) { return typeById[id].name + " " + typeById[id].groupLabel; })).join(" "));
        return catMatches(words, hay);
      });
      if (st.sort === "name") okGab = okGab.slice().sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); });
      if (st.sort === "sections") okGab = okGab.slice().sort(function (a, b) { return b.shape.length - a.shape.length; });
      var okTypes = PC.types.filter(function (t) {
        if (t.gabarits.length) return false; // couverts : ils apparaissent sur la carte de leur gabarit
        if (st.group !== "all" && t.group !== st.group) return false;
        return catMatches(words, norm(t.name + " " + t.groupLabel));
      });
      var showBlank = !words.length && st.group === "all";
      var recentG = store.get("pb-gab-recent", []).map(function (k) { return gabs.filter(function (g) { return g.key === k; })[0]; }).filter(Boolean);
      if (recentG.length && !words.length && st.group === "all") {
        var rg = h("div", { class: "pb-cat-groups", "data-pb-cat-recentg": "", role: "group", "aria-label": "Gabarits récemment appliqués" }, h("span", { class: "pb-home-label", text: "Récemment appliqués" }));
        recentG.forEach(function (g) { rg.appendChild(h("button", { type: "button", class: "pb-cat-chip" + (d.gabarit === g.key ? " is-on" : ""), "data-pb-cat-pick": g.key, onclick: function () { var c = box.querySelector('[data-pb-cat-card="' + g.key + '"]'); if (c) { c.click(); c.scrollIntoView({ block: "nearest" }); } } }, g.name)); });
        results.appendChild(rg);
      }
      var grid = h("div", { class: "pb-cat-grid", role: "radiogroup", "aria-label": "Gabarits" });
      if (showBlank) grid.appendChild(catCard("", "Page vide", "Aucune section : vous choisissez seulement le format du canevas, puis construisez librement.", [], ["hero"].slice(0, 0), "Format seul"));
      okGab.forEach(function (g) { grid.appendChild(catCard(g.key, g.name, g.description, g.types.slice(0, 3).map(function (id) { return typeById[id].name; }).concat(g.types.length > 3 ? ["+" + (g.types.length - 3)] : []), g.shape, plural(g.shape.length, "section", "sections"))); });
      if (showBlank || okGab.length) results.appendChild(grid);
      if (st.scope === "all" && okTypes.length) {
        var det = h("section", { class: "pb-cat-types", "data-pb-cat-types": "" }, h("h2", { class: "pb-cat-h", text: "Types de pages sans gabarit pour l'instant (" + okTypes.length + ")" }), h("p", { class: "pb-hint", text: "Répertoriés pour la couverture : aucun gabarit n'existe encore pour eux. Vous pouvez partir d'une page vide ou d'un gabarit proche." }));
        var ul = h("ul", { class: "pb-cat-tlist" });
        okTypes.forEach(function (t) { ul.appendChild(h("li", { "data-pb-cat-type": t.id }, h("span", { class: "pb-cat-tname", text: t.name }), h("span", { class: "pb-cat-tmeta", text: t.needs ? "Nécessite : " + t.needs : t.groupLabel }), h("span", { class: "pb-cat-badge" + (t.needs ? " is-need" : ""), text: t.needs ? "Fonction manquante" : "Répertorié" }))); });
        det.appendChild(ul); results.appendChild(det);
      }
      if (!okGab.length && !(st.scope === "all" && okTypes.length) && !showBlank) {
        results.appendChild(h("div", { class: "pb-cat-empty", "data-pb-cat-empty": "" }, icon("search"), h("p", { class: "pb-start-title", text: "Aucun résultat" }), h("p", { class: "pb-start-text", text: st.q ? "Rien ne correspond à « " + st.q + " »." : "Aucun gabarit dans cette catégorie." }),
          h("button", { type: "button", class: "btn btn-outline", "data-pb-cat-reset": "", onclick: function () { st.q = ""; st.group = "all"; q.value = ""; repaintCat(); } }, "Effacer la recherche et les filtres")));
      }
      if (st.scope === "gabarits" && okTypes.length && !(words.length === 0 && st.group === "all")) results.appendChild(h("p", { class: "pb-hint", "data-pb-cat-more": "", text: plural(okTypes.length, "type de page correspondant n'a pas encore de gabarit", "types de pages correspondants n'ont pas encore de gabarit") + ". Choisissez « Tous les types de pages » pour les voir." }));
      paintActions();
    }
    function catCard(key, name, desc, tags, shape, meta) {
      var on = (d.gabarit || "") === key;
      var card = h("button", { type: "button", class: "pb-cat-card" + (on ? " is-on" : ""), role: "radio", "aria-checked": String(on), "data-pb-cat-card": key || "blank", onclick: function () { d.gabarit = key; $$(".pb-cat-card", box).forEach(function (c) { var o = c.getAttribute("data-pb-cat-card") === (key || "blank"); c.classList.toggle("is-on", o); c.setAttribute("aria-checked", String(o)); }); paintActions(); } },
        key ? wireframe(shape) : h("div", { class: "pb-wf is-blank", "aria-hidden": "true" }, icon("plus")),
        h("strong", { class: "pb-cat-name", text: name }), h("span", { class: "pb-cat-desc", text: desc }),
        h("span", { class: "pb-cat-tags" }, tags.map(function (t) { return h("span", { class: "pb-cat-tag", text: t }); }), h("span", { class: "pb-cat-meta", text: meta })));
      return card;
    }
    function paintActions() {
      action.textContent = "";
      var chosen = d.gabarit ? (gabs.filter(function (g) { return g.key === d.gabarit; })[0] || null) : null;
      if (homeOpen) {
        action.appendChild(h("button", { type: "button", class: "btn btn-outline", "data-pb-start-back": "", onclick: function () { startStep = "choice"; paintStart(); } }, "Retour"));
        action.appendChild(h("button", { type: "button", class: "btn btn-outline", "data-pb-start-cancel": "", onclick: startFinish }, "Annuler"));
      }
      action.appendChild(h("button", { type: "button", class: "btn btn-primary", "data-pb-cat-next": "", onclick: function () { startStep = "config"; paintStart(); } }, chosen ? "Continuer avec « " + chosen.name + " »" : "Continuer avec une page vide"));
    }
    var qTimer = null;
    q.addEventListener("input", function () { st.q = q.value; clearTimeout(qTimer); qTimer = setTimeout(repaintCat, 120); });
    sort.addEventListener("change", function () { st.sort = sort.value; repaintCat(); });
    repaintCat();
    box.addEventListener("keydown", function (e) { if (e.key === "Escape" && e.target !== q && homeOpen) { e.stopPropagation(); startStep = "choice"; paintStart(); } });
    paintRecents(box);
  }
  // Insère un gabarit intégré à la fin (accueil) ou en tête (page vide), en une étape annulable ; la copie est neuve, aucune page n'est dupliquée
  function insertGabarit(key, atEnd) {
    return api("GET", "/marketing/site-web/gabarits/" + encodeURIComponent(key) + ".json").then(function (r) {
      var secs = reIdAll(clone(r.gabarit.sections)).map(function (s) { return markSection(s); });
      if (secs.some(function (s) { return s.type === "form"; }) && content.sections.some(function (s) { return s.type === "form"; })) { toast("Une page n'a qu'un formulaire d'inscription : ce gabarit en contient un, il n'a pas été ajouté.", true); return false; }
      var lay = layoutOf();
      if (lay && lay.locked) { // le format verrouillé règle la largeur et les marges de premier niveau : le gabarit n'y touche pas (sinon l'enregistrement serait refusé)
        secs.forEach(function (sec) { (sec.children || []).forEach(function (n) { [n.styles, n.states].forEach(function (grp) { Object.keys(grp || {}).forEach(function (k) { LF.protected.forEach(function (pr) { if (grp[k]) delete grp[k][pr]; }); }); }); }); });
      }
      ensureIds(secs);
      var name = (PC.gabarits.filter(function (g) { return g.key === key; })[0] || {}).name || key;
      nextLabel = "Gabarit appliqué : « " + name + " »";
      change(function () { if (!insertInto(null, atEnd ? content.sections.length : 0, secs)) return false; selection = secs.length ? [secs[0].id] : []; });
      markCanvasSelection(true);
      store.set("pb-gab-recent", [key].concat(store.get("pb-gab-recent", []).filter(function (k) { return k !== key; })).slice(0, 4));
      toast("Gabarit « " + name + " » ajouté (" + plural(secs.length, "section", "sections") + "). Annulable avec Ctrl/⌘ + Z.");
      return true;
    });
  }
  // ---------- Pages récentes : pages réelles de l'organisation, classées par dernière MODIFICATION (aucune date d'ouverture n'est enregistrée) ----------
  function ago(sqlDate) {
    var t = Date.parse(String(sqlDate || "").replace(" ", "T") + "Z");
    if (isNaN(t)) return "";
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 60) return "à l'instant";
    if (s < 3600) return "il y a " + Math.round(s / 60) + " min";
    if (s < 86400) return "il y a " + Math.round(s / 3600) + " h";
    if (s < 86400 * 30) return "il y a " + Math.round(s / 86400) + " j";
    return "le " + new Date(t).toLocaleDateString("fr-FR");
  }
  function statusOf(p) { return p.status === "published" ? (p.hasDraft ? { t: "Publiée · brouillon en cours", c: "is-live" } : { t: "Publiée", c: "is-live" }) : p.status === "unpublished" ? { t: "Dépubliée", c: "" } : { t: "Brouillon", c: "is-draft" }; }
  var KIND_LABEL = { page: "Page du site", landing: "Page d'atterrissage", step: "Étape de tunnel", post: "Article" };
  function paintRecents(box) {
    var pins = store.get("pb-pins", []);
    var list = (boot.recentPages || []).filter(function (p) { return recentFilter === "all" || (recentFilter === "pin" ? pins.indexOf(p.id) >= 0 : recentFilter === "draft" ? p.status !== "published" || p.hasDraft : p.status === "published"); })
      .map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return (pins.indexOf(b.p.id) >= 0) - (pins.indexOf(a.p.id) >= 0) || a.i - b.i; }).map(function (x) { return x.p; });
    var sec = h("section", { class: "pb-recents", "data-pb-recents": "", "aria-label": "Pages récentes" });
    var head = h("div", { class: "pb-recents-head" }, h("h2", { class: "pb-cat-h", text: "Pages récentes" }));
    var chips = h("div", { class: "pb-cat-seg", role: "group", "aria-label": "Filtrer les pages récentes" });
    [["all", "Toutes"], ["pin", "Épinglées"], ["draft", "Brouillons"], ["live", "Publiées"]].forEach(function (o) {
      chips.appendChild(h("button", { type: "button", class: "pb-cat-chip" + (recentFilter === o[0] ? " is-on" : ""), "aria-pressed": String(recentFilter === o[0]), "data-pb-recent-filter": o[0], onclick: function () { recentFilter = o[0]; paintStart(false); } }, o[1]));
    });
    head.appendChild(chips);
    head.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-pb-recent-all": "", onclick: function () { requestLeave({ getUrl: function () { return Promise.resolve("/marketing/pages"); }, text: "Vous allez quitter le document actuel pour afficher toutes les pages. Enregistrez vos modifications pour pouvoir reprendre ce travail plus tard.", saved: "", auto: true }); } }, "Voir toutes les pages"));
    sec.appendChild(head);
    if (!(boot.recentPages || []).length) {
      sec.appendChild(h("div", { class: "pb-recents-empty", "data-pb-recents-empty": "" }, icon("fileText"), h("p", { class: "pb-start-text", text: "Aucune autre page pour l'instant. Quand vous en créerez, les dernières pages modifiées apparaîtront ici pour être rouvertes en un clic." })));
    } else if (!list.length) {
      sec.appendChild(h("p", { class: "pb-hint", "data-pb-recents-none": "", text: "Aucune page dans ce filtre." }));
    } else {
      var ul = h("ul", { class: "pb-recents-list" });
      list.slice(0, 6).forEach(function (p) {
        var s = statusOf(p);
        ul.appendChild(h("li", { class: "pb-recent", "data-pb-recent": String(p.id) },
          h("span", { class: "pb-recent-ico", "aria-hidden": "true" }, icon("fileText")),
          h("span", { class: "pb-recent-main" }, h("strong", { class: "pb-recent-name", text: p.name }), h("span", { class: "pb-recent-meta", text: (KIND_LABEL[p.kind] || "Page") + (p.siteName ? " · " + p.siteName : "") + " · modifiée " + ago(p.updatedAt) })),
          h("span", { class: "pb-cat-badge " + s.c, text: s.t }),
          h("button", { type: "button", class: "pb-recent-pin" + (pins.indexOf(p.id) >= 0 ? " is-on" : ""), "data-pb-recent-pin": String(p.id), "aria-pressed": String(pins.indexOf(p.id) >= 0), "aria-label": (pins.indexOf(p.id) >= 0 ? "Désépingler « " : "Épingler « ") + p.name + " » (sur cet appareil)", "data-tip": "Épingler sur cet appareil", onclick: function () { var cur = store.get("pb-pins", []); store.set("pb-pins", cur.indexOf(p.id) >= 0 ? cur.filter(function (x) { return x !== p.id; }) : [p.id].concat(cur).slice(0, 20)); paintStart(false); } }, icon("star")),
          h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-recent-open": String(p.id), "aria-label": "Ouvrir la page « " + p.name + " »", onclick: function () { requestLeave({ getUrl: function () { return Promise.resolve("/marketing/pages/" + p.id + "/editeur"); }, text: "Vous allez quitter le document actuel pour ouvrir « " + p.name + " ». Enregistrez vos modifications pour pouvoir reprendre ce travail plus tard.", saved: "", auto: true }); } }, "Ouvrir")));
      });
      sec.appendChild(ul);
    }
    box.appendChild(sec);
  }
  function startPreview() {
    var d = startDraft, wide = d.maxWidth > 0 ? Math.max(20, Math.min(100, Math.round(d.maxWidth / 1600 * 100))) : 100;
    var pv = h("div", { class: "pb-start-preview", "data-pb-start-preview": "", role: "img", "aria-label": "Aperçu : contenu centré, " + (d.maxWidth ? d.maxWidth + " px au plus" : "sans largeur maximale") + ", marges de " + d.gutter + " px au minimum" },
      h("div", { class: "pb-start-pv-inner", style: "width:" + wide + "%" }, h("span", { class: "pb-start-pv-bar" }), h("span", { class: "pb-start-pv-bar is-short" }), h("span", { class: "pb-start-pv-block" })));
    return h("div", null, pv, h("p", { class: "pb-hint pb-start-pv-note", "data-pb-start-note": "", text: d.maxWidth ? "Contenu : " + d.maxWidth + " px au plus, marges de " + d.gutter + " px au minimum. Sur un écran plus étroit, il suit l'écran." : "Contenu fluide : il suit toute la largeur de l'écran, marges de " + d.gutter + " px au minimum." }));
  }
  function paintStartConfig(box) {
    var d = startDraft, presets = LF.formats, err = h("p", { class: "pb-note is-warn", role: "alert", hidden: true });
    box.appendChild(PC ? h("div", { class: "pb-home-head" }, h("h1", { class: "pb-start-head", text: "Format du canevas" }), h("p", { class: "pb-home-sub", "data-pb-start-chosen": "", text: d.gabarit ? "Gabarit : « " + (PC && d.gabarit ? (PC.gabarits.filter(function (g) { return g.key === d.gabarit; })[0] || {}).name : "") + " ». Le format règle la largeur du contenu et les marges, pas la composition." : "Page vide. Le format règle la largeur du contenu et les marges." })) : h("h1", { class: "pb-start-head", text: "Choisissez un gabarit" }));
    var list = h("div", { class: "pb-start-formats", role: "radiogroup", "aria-label": "Format de conception" });
    Object.keys(presets).forEach(function (k) {
      var f = presets[k], on = d.format === k;
      list.appendChild(h("button", { type: "button", class: "pb-start-format" + (on ? " is-on" : ""), role: "radio", "aria-checked": on ? "true" : "false", "data-pb-start-format": k, onclick: function () {
        d.format = k; if (k !== "custom") { d.maxWidth = f.maxWidth; d.gutter = f.gutter; }
        paintStart(false); var b = box.parentNode && startEl.querySelector('[data-pb-start-format="' + k + '"]'); if (b) b.focus({ preventScroll: true });
      } }, h("strong", { text: f.label }), h("span", { text: k === "custom" ? "320 à 2 400 px" : (f.maxWidth ? f.maxWidth + " px maximum" : "Largeur de l'écran") }), h("small", { text: k === "custom" ? "Vos valeurs" : "Marges " + f.gutter + " px · fluide sous " + (f.maxWidth ? f.maxWidth + " px" : "l'écran") })));
    });
    box.appendChild(list);
    box.appendChild(h("p", { class: "pb-hint", text: (presets[d.format] || {}).hint || "" }));
    var pvHost = h("div", { class: "pb-start-pvhost" });
    var refreshPv = function () { pvHost.textContent = ""; pvHost.appendChild(startPreview()); };
    if (d.format === "custom") {
      var num = function (label, key, min, max, note) {
        var inp = h("input", { type: "number", class: "pb-input", value: String(d[key]), min: String(min), max: String(max), "aria-label": label });
        inp.setAttribute("data-pb-start-" + key, "");
        inp.addEventListener("input", function () { d[key] = inp.value === "" ? NaN : Number(inp.value); refreshPv(); });
        return h("label", { class: "pb-start-num" }, h("span", { text: label }), inp, h("small", { text: note }));
      };
      box.appendChild(h("div", { class: "pb-start-nums" }, num("Largeur maximale du contenu (px)", "maxWidth", 0, 2400, "0 = aucune limite, sinon 320 à 2 400"), num("Marge latérale minimale (px)", "gutter", 0, 96, "0 à 96")));
    }
    refreshPv();
    box.appendChild(pvHost);
    var lockText = function () { return d.locked ? "Protège " + LF.protected.map(function (p) { return LF.labels[p]; }).join(", ").toLowerCase() + " des éléments de premier niveau. Textes, images, couleurs et widgets restent libres. Modifiable ensuite dans l'onglet « Page »." : "Les réglages du format restent modifiables partout. Vous pourrez verrouiller plus tard dans l'onglet « Page »."; };
    var lockLabel = h("strong", { text: d.locked ? "Format verrouillé" : "Format déverrouillé" }), lockHint = h("small", { text: lockText() });
    var lock = h("button", { type: "button", class: "pb-start-lock" + (d.locked ? " is-on" : ""), role: "switch", "aria-checked": d.locked ? "true" : "false", "data-pb-start-lock": "", onclick: function () {
      d.locked = !d.locked; lock.classList.toggle("is-on", d.locked); lock.setAttribute("aria-checked", d.locked ? "true" : "false"); lockLabel.textContent = d.locked ? "Format verrouillé" : "Format déverrouillé"; lockHint.textContent = lockText();
    } }, icon("lock"), h("span", { class: "pb-start-lock-text" }, lockLabel, lockHint));
    box.appendChild(lock);
    box.appendChild(err);
    box.appendChild(h("div", { class: "pb-start-actions" },
      PC || homeOpen ? h("button", { type: "button", class: "btn btn-outline", "data-pb-start-back": "", onclick: function () { startStep = PC ? "catalog" : "choice"; paintStart(); } }, "Retour") : null,
      homeOpen ? h("button", { type: "button", class: "btn btn-outline", "data-pb-start-cancel": "", onclick: startFinish }, "Annuler") : null,
      h("button", { type: "button", class: "btn btn-outline", "data-pb-start-newpage": "", title: "Crée une page distincte avec ce gabarit et ce format ; la page actuelle n'est pas modifiée", onclick: function () {
        var wOk2 = d.maxWidth === 0 || (Number.isInteger(d.maxWidth) && d.maxWidth >= 320 && d.maxWidth <= 2400), gOk2 = Number.isInteger(d.gutter) && d.gutter >= 0 && d.gutter <= 96;
        if (d.format === "custom" && !(wOk2 && gOk2)) { err.textContent = !wOk2 ? "Largeur maximale : 0 (aucune limite) ou entre 320 et 2 400 px." : "Marge latérale : entre 0 et 96 px."; err.hidden = false; return; }
        var spec = { template: d.gabarit || "", layout: { mode: "guided", format: d.format, maxWidth: d.maxWidth, gutter: d.gutter, locked: d.locked } };
        requestLeave({ getUrl: function () { return nameThenCreate(spec); }, auto: true, saved: "", text: "Vous allez quitter le document actuel pour créer une nouvelle page" + (d.gabarit ? " à partir du gabarit choisi" : "") + ". Enregistrez vos modifications pour pouvoir reprendre ce travail plus tard." });
      } }, "Créer dans une nouvelle page"),
      h("button", { type: "button", class: "btn btn-primary", "data-pb-start-continue": "", onclick: function () {
        var wOk = d.maxWidth === 0 || (Number.isInteger(d.maxWidth) && d.maxWidth >= 320 && d.maxWidth <= 2400), gOk = Number.isInteger(d.gutter) && d.gutter >= 0 && d.gutter <= 96;
        if (d.format === "custom" && !(wOk && gOk)) { err.textContent = !wOk ? "Largeur maximale : 0 (aucune limite) ou entre 320 et 2 400 px." : "Marge latérale : entre 0 et 96 px."; err.hidden = false; return; }
        var layout = { mode: "guided", format: d.format, maxWidth: d.maxWidth, gutter: d.gutter, locked: d.locked };
        var wasHome = homeOpen;
        homeOpen = false; startDone = true; // le panneau se retire d'abord : aucune retouche du canevas par lui
        setLayout(layout);
        refreshStart();
        if (wasHome) homeButtonState();
        if (d.gabarit) { insertGabarit(d.gabarit, wasHome).catch(apiFail); return; }
        openStructurePicker({ parent: null, index: wasHome ? content.sections.length : 0 });
      } }, d.gabarit ? "Appliquer le gabarit" : "Continuer")));
    box.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.stopPropagation(); startStep = PC ? "catalog" : "choice"; paintStart(); } });
  }
  // ---------- Méga-menu (en-tête) : un panneau composé librement par rubrique du menu ----------
  // Le panneau est un COMPOSANT du site (éditeur existant) ; le menu ne garde que « identifiant de la rubrique → identifiant du composant » (props.mega).
  function megaStarter() {
    var col = function (title) { return { type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "column", gap: "8px", flexGrow: "1" } }, children: [{ type: "heading", props: { text: title, level: "3" } }, { type: "text", props: { html: "<p>Décrivez cette rubrique en une phrase.</p>" } }, { type: "button", props: { label: "En savoir plus", url: "/" } }] }; };
    return { type: "layout", children: [{ type: "container", props: {}, styles: { desktop: { display: "flex", flexDirection: "row", gap: "32px" }, mobile: { flexDirection: "column" } }, children: [col("Première colonne"), col("Deuxième colonne"), col("Troisième colonne")] }] };
  }
  function megaSection(box, it, p, disabled) {
    box.appendChild(h("p", { class: "pb-sub", text: "Méga-menus" }));
    box.appendChild(h("p", { class: "pb-hint", text: "Une rubrique du menu peut ouvrir un panneau composé librement : colonnes, images, textes, boutons. Le panneau est un composant de ce site : « Modifier le panneau » l'ouvre dans l'éditeur, « Mettre à jour » le publie." }));
    var host = h("div", { "data-pb-mega": "" }, h("p", { class: "pb-hint", text: "Chargement des rubriques du menu…" }));
    box.appendChild(host);
    var mega = p.mega || {}, ids = Object.keys(mega).map(function (k) { return mega[k]; });
    var q = "source=" + encodeURIComponent(p.source) + "&location=" + encodeURIComponent(p.location || "") + "&menuName=" + encodeURIComponent(p.menuName || "") + "&ids=" + ids.join(",");
    api("GET", "/marketing/site-web/composants/" + PAGE.component.id + "/menu.json?" + q).then(function (r) {
      host.textContent = "";
      if (!r.items.length) { host.appendChild(h("p", { class: "pb-hint", text: "Aucun menu publié pour cette source : affectez un menu dans Apparence → Menus pour créer des panneaux." })); return; }
      r.items.forEach(function (item) {
        var cid = mega[String(item.id)], comp = cid ? r.components[cid] : null;
        var row = h("div", { class: "pb-mega-row", "data-pb-mega-item": String(item.id) }, h("strong", { text: item.label }));
        if (comp) {
          row.appendChild(h("span", { class: "pb-hint", text: "Panneau : " + comp.name + (comp.hasDraft ? " (modifications non publiées)" : "") }));
          row.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-mega-edit": String(item.id), onclick: function () { window.open("/marketing/site-web/composants/" + comp.id + "/editeur", "_blank", "noopener"); } }, "Modifier le panneau"));
          row.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, "data-pb-mega-remove": String(item.id), onclick: function () { change(function () { var x = byId(it.id).props; var m = Object.assign({}, x.mega || {}); delete m[String(item.id)]; if (Object.keys(m).length) x.mega = m; else { delete x.mega; delete x.megaTrigger; delete x.megaWidth; } }); toast("Panneau retiré de la rubrique (le composant est conservé)."); renderInspector(); } }, "Retirer"));
        } else {
          row.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, "data-pb-mega-create": String(item.id), onclick: function () { createPanel(item); } }, "Créer un panneau"));
        }
        host.appendChild(row);
      });
      if (ids.length) {
        host.appendChild(selectField("Ouverture du panneau", p.megaTrigger === "click" ? "click" : "hover", [["hover", "Au survol (et au clavier)"], ["click", "Au clic"]], function (v) { setProp(it.id, "megaTrigger", v); }, { disabled: disabled }));
        host.appendChild(selectField("Largeur du panneau", p.megaWidth === "full" ? "full" : "item", [["item", "Sous la rubrique"], ["full", "Pleine largeur de l'en-tête"]], function (v) { setProp(it.id, "megaWidth", v); }, { disabled: disabled }));
      }
    }, function () { host.textContent = ""; host.appendChild(h("p", { class: "pb-note is-warn", text: "Impossible de lire les rubriques du menu." })); });
    function createPanel(item) {
      var tryName = function (n) {
        return api("POST", "/marketing/site-web/composants", { name: "Méga-menu · " + item.label + (n > 1 ? " (" + n + ")" : ""), section: megaStarter(), kind: "standard", global: !PAGE.siteId, siteId: PAGE.siteId }).catch(function (err) { if (n < 6 && /porte déjà ce nom/.test(err.message || "")) return tryName(n + 1); throw err; });
      };
      tryName(1).then(function (r) {
        change(function () { var x = byId(it.id).props; var m = Object.assign({}, x.mega || {}); m[String(item.id)] = r.component.id; x.mega = m; if (!x.megaTrigger) x.megaTrigger = "hover"; if (!x.megaWidth) x.megaWidth = "item"; });
        toast("Panneau créé. Modifiez-le dans l'onglet qui s'ouvre, puis cliquez « Mettre à jour ».");
        window.open("/marketing/site-web/composants/" + r.component.id + "/editeur", "_blank", "noopener");
        renderInspector();
      }, apiFail);
    }
  }
  // ---------- Réglages de l'EN-TÊTE (Header Builder) : bloc `header` de la section, validé par le serveur (headerSettings.js) ----------
  // Lecture : le bloc s'il existe, sinon l'ancien format (position de la première bande + headerFx) : le panneau affiche donc l'état réel d'un en-tête ancien.
  // Document d'en-tête : modèle « En-tête » du Theme Builder (identité du modèle) ou composant affecté comme en-tête du site (ancien réglage)
  // Document de pied de page : modèle « Pied de page » du Theme Builder (identité du modèle) ou composant du site affecté comme pied
  // Modèles du Theme Builder autres que l'en-tête et le pied : un onglet de réglages (grille de résultats, style, éléments) comme pour le pied de page
  var TPL_TABS = { archive: "Archive", search_results: "Recherche", not_found: "Page 404", single_post: "Article", single_page: "Page", single_product: "Produit", product_archive: "Boutique", cart: "Panier", checkout: "Commande", order_received: "Confirmation", my_account: "Compte" };
  function partType() { var c = IS_COMPONENT && PAGE.component; var t = (PAGE.identity && PAGE.identity.template) || (c && c.identity && c.identity.template); return (t && t.type) || (c && c.role) || ""; }
  function isTplDoc() { return Object.prototype.hasOwnProperty.call(TPL_TABS, partType()); }
  function isFooterDoc() { var c = IS_COMPONENT && PAGE.component; if (!c) return false; var t = (PAGE.identity && PAGE.identity.template) || (c.identity && c.identity.template); return c.role === "footer" || Boolean(t && t.type === "footer"); }
  function isHeaderDoc() { var c = IS_COMPONENT && PAGE.component; if (!c) return false; var t = (PAGE.identity && PAGE.identity.template) || (c.identity && c.identity.template); return c.role === "header" || Boolean(t && t.type === "header"); }
  function headerSection() { var s = content.sections && content.sections[0]; return s && s.type === "layout" ? s : null; }
  function headerNow() {
    var dflt = { mode: "static", fx: "", threshold: 8, offset: 0, zIndex: 60, stickOn: ["desktop", "tablet", "mobile"], shrink: { height: 32 }, hideOnScroll: { enabled: false, tolerance: 8 }, edge: "top", reserve: 72 };
    var s = headerSection(); if (!s) return dflt;
    if (s.header && typeof s.header === "object") {
      var hd = s.header;
      return { mode: hd.mode || "static", fx: hd.fx || "", threshold: hd.threshold === undefined ? 8 : hd.threshold, offset: hd.offset || 0, zIndex: hd.zIndex || 60,
        stickOn: Array.isArray(hd.stickOn) && hd.stickOn.length ? hd.stickOn : dflt.stickOn, shrink: { height: hd.shrink && hd.shrink.height ? hd.shrink.height : 32 }, hideOnScroll: { enabled: Boolean(hd.hideOnScroll && hd.hideOnScroll.enabled), tolerance: hd.hideOnScroll && hd.hideOnScroll.tolerance !== undefined ? hd.hideOnScroll.tolerance : 8 }, edge: hd.edge === "bottom" ? "bottom" : "top", reserve: hd.reserve || 72 };
    }
    var first = s.children && s.children[0], pos = first && first.styles && first.styles.desktop ? first.styles.desktop.position : "";
    var fx = first && first.props && /^(shrink|solid|both|hide)$/.test(first.props.headerFx || "") ? first.props.headerFx : "";
    var mode = pos === "sticky" ? "sticky" : pos === "absolute" ? "overlay" : "static";
    // Ancien réglage « Se cache en descendant » (headerFx = hide) : affiché comme le masquage réglable de l'onglet
    if (fx === "hide") return Object.assign(dflt, { mode: mode, fx: "", hideOnScroll: { enabled: mode !== "static", tolerance: 6 } });
    return Object.assign(dflt, { mode: mode, fx: mode === "static" ? "" : fx });
  }
  function setHeader(patch, key) {
    change(function () {
      var s = headerSection(); if (!s) return false;
      var next = Object.assign({ v: 1 }, s.header || {}, headerNow(), patch);
      if (next.mode === "static") { next.fx = ""; next.hideOnScroll = { enabled: false, tolerance: next.hideOnScroll.tolerance }; }
      s.header = next;
    }, { key: "header:" + (key || "all"), label: "Réglages de l'en-tête", light: true });
    // Le panneau se redessine (champs désactivés, résumé) en gardant le focus clavier sur le même champ
    var box = $("[data-pb-page-settings]"), fields = [].slice.call(box.querySelectorAll("select, input")), at = fields.indexOf(document.activeElement);
    box.textContent = ""; renderHeaderSettings(box);
    if (at >= 0) { var again = box.querySelectorAll("select, input")[at]; if (again && !again.disabled) again.focus(); }
  }
  // Accès direct aux réglages complets (Contenu / Style / Avancé, écrans, états) du conteneur de l'en-tête et de chacun de ses éléments : le panneau de droite s'ouvre dessus
  function headerAccess(box) {
    var sec = headerSection(), root = sec && sec.children && sec.children[0]; if (!root) return;
    var open = function (id, tab, state) { styleState = state || "normal"; inspTab = tab; store.set("insp-tab", tab); select(id); renderInspector(); };
    // Une seule carte, une ligne par réglage (titre, courte explication, flèche) : plus de boutons en vrac
    var row = function (iconName, title, hint, onclick, depth) {
      return h("button", { type: "button", class: "pb-hdr-row", style: depth ? "padding-left:" + (14 + depth * 14) + "px" : null, onclick: onclick },
        h("span", { class: "pb-hdr-ico", "aria-hidden": "true" }, icon(iconName)),
        h("span", { class: "pb-hdr-txt" }, h("span", { class: "pb-hdr-title", text: title }), hint ? h("span", { class: "pb-hdr-hint", text: hint }) : null),
        h("span", { class: "pb-hdr-go", "aria-hidden": "true" }, icon("chevronRight")));
    };
    hdrAcc(box, "disposition", "Disposition et contenu", function (b) { headerLayout(b, sec); });
    hdrAcc(box, "reglages", "Réglages du conteneur", function (b) {
      b.appendChild(h("div", { class: "pb-hdr-list" }, [
        row("layout", "Mise en page et contenu", "Direction, largeur, structure", function () { open(root.id, "content"); }),
        row("palette", "Style", "Fond, bordure, ombre, espacements", function () { open(root.id, "style"); }),
        row("arrowDown", "Après défilement", "Apparence une fois la page défilée", function () { open(root.id, "style", "scrolled"); }),
        row("listChecks", "Menu ouvert", "Apparence quand le menu est déplié", function () { open(root.id, "style", "menuOpen"); }),
        row("sliders", "Avancé", "Ancre, écrans, CSS personnalisé", function () { open(root.id, "advanced"); })]));
    });
    hdrAcc(box, "rangees", "Rangées collées", function (b) { headerRows(b, sec); });
    hdrAcc(box, "style", "Style du conteneur", function (b) { headerRootPanel(b, root); });
    hdrAcc(box, "mobile", "Menu mobile (hamburger)", function (b) { headerMobile(b); });
    if (PAGE.siteId) hdrAcc(box, "ecrans", "Écrans du site", function (b) {
      b.appendChild(h("p", { class: "pb-hint", text: "La largeur à partir de laquelle un écran compte comme « tablette » ou « mobile » se règle pour tout le site (en-tête compris). Le repli du menu en bouton se règle séparément, sur le menu." }));
      b.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/site-web/sites/" + PAGE.siteId + "/responsive", target: "_blank", rel: "noopener" }, "Régler les écrans du site"));
    });
    var els = []; (function walk(list, depth) { (list || []).forEach(function (n) { if (n !== root) els.push({ n: n, depth: depth }); if (n.children) walk(n.children, Math.min(depth + 1, 3)); }); })(sec.children[0].children, 0);
    if (els.length) hdrAcc(box, "elements", "Éléments de l'en-tête", function (b) {
      b.appendChild(h("div", { class: "pb-hdr-list" }, els.map(function (e) {
        var n = e.n, t = (preview(n) || "").slice(0, 40), inside = (n.children || []).slice(0, 3).map(typeLabel).join(", ");
        return row(isNode(n) && NT[n.type] ? NT[n.type].icon : "layout", n.name || typeLabel(n), n.name ? typeLabel(n) : (t ? t : inside), function () { open(n.id, inspTab === "advanced" ? "advanced" : "content"); }, e.depth);
      })));
    });
  }
  // ======== Disposition et contenu : placer logo, menu et actions selon l'écran, sans toucher à la structure ========
  // Principe : on retrouve la « barre principale » = le plus petit conteneur qui réunit le logo (ou titre du site) et le menu ; ses enfants sont les « emplacements ».
  // Un modèle de disposition règle CETTE barre (flex / grille, sens, alignement, espacement) et l'ordre des emplacements, pour l'écran choisi seulement : les écrans plus petits
  // héritent de l'écran plus grand tant qu'on n'a rien réglé pour eux (même mécanisme que tous les réglages par écran). Rien n'est déplacé dans l'arbre : un « Annuler » défait tout.
  var HDR_BRAND = ["sitelogo", "sitetitle"];
  function hdrMain(sec) {
    var brand = null, nav = null;
    (function walk(list) { (list || []).forEach(function (n) { if (!brand && HDR_BRAND.indexOf(n.type) >= 0) brand = n; if (!nav && n.type === "menu") nav = n; if (n.children) walk(n.children); }); })(sec.children);
    if (!brand && !nav) return null;
    var chain = function (n) { var l = locate(n.id); return l ? l.ancestors.filter(function (a) { return a.type !== "layout" && kidsOf(a); }) : []; };
    var ca = brand ? chain(brand) : null, cb = nav ? chain(nav) : null, lca = null;
    if (ca && cb) { for (var i = 0; i < Math.min(ca.length, cb.length) && ca[i] === cb[i]; i++) lca = ca[i]; }
    else { var one = ca || cb; lca = one[one.length - 1] || null; }
    if (!lca) lca = (sec.children || []).filter(function (n) { return n.type === "container"; })[0] || null;
    if (!lca || !(lca.children || []).length) return null;
    var contains = function (root, t) { var f = false; (function w(n) { if (n === t) f = true; (n.children || []).forEach(w); })(root); return f; };
    var slots = lca.children.map(function (c) { return { node: c, role: brand && contains(c, brand) ? "brand" : nav && contains(c, nav) ? "nav" : "actions" }; });
    return { lca: lca, brand: brand, nav: nav, slots: slots };
  }
  function hdrSlotLabel(sl) {
    if (sl.node.name) return sl.node.name;
    if (sl.role === "brand") return "Logo / titre du site";
    if (sl.role === "nav") return "Menu de navigation";
    var names = []; (function w(n) { if (!(n.children || []).length) { var t = typeLabel(n); if (names.indexOf(t) < 0) names.push(t); } else n.children.forEach(w); })(sl.node);
    return names.slice(0, 3).join(" + ") || typeLabel(sl.node);
  }
  var HDR_ROW = { display: "flex", flexDirection: "row", flexWrap: "nowrap", alignItems: "center", justifyContent: "space-between", gap: "24px" };
  var HDR_COL = { display: "flex", flexDirection: "column", flexWrap: "nowrap", justifyContent: "center", gap: "12px" };
  var HDR_LAYOUTS = [
    { key: "classic", label: "Logo · Menu · Actions", hint: "Le menu occupe le centre", lca: HDR_ROW, slots: { brand: { order: 1, flexGrow: 0 }, nav: { order: 2, flexGrow: 1 }, actions: { order: 3, flexGrow: 0 } }, mock: "m1" },
    { key: "right", label: "Logo à gauche, le reste à droite", hint: "Menu et actions regroupés à droite", lca: HDR_ROW, slots: { brand: { order: 1, flexGrow: 1 }, nav: { order: 2, flexGrow: 0 }, actions: { order: 3, flexGrow: 0 } }, mock: "m2" },
    { key: "center", label: "Logo centré, menu dessous", hint: "Tout centré sur deux lignes", lca: Object.assign({}, HDR_COL, { alignItems: "center" }), slots: { brand: { order: 1, flexGrow: 0, alignSelf: "center" }, nav: { order: 2, flexGrow: 0, alignSelf: "center" }, actions: { order: 3, flexGrow: 0, alignSelf: "center" } }, mock: "m3" },
    { key: "split", label: "Menu · Logo centré · Actions", hint: "Logo au milieu, menu à gauche", lca: { display: "grid", gridTemplate: "1fr auto 1fr", alignItems: "center", gap: "16px" }, slots: { nav: { order: 1, justifySelf: "start" }, brand: { order: 2, justifySelf: "center" }, actions: { order: 3, justifySelf: "end" } }, mock: "m4" },
    { key: "compact", label: "Barre compacte", hint: "Logo, actions, puis bouton menu", lca: Object.assign({}, HDR_ROW, { gap: "12px" }), slots: { brand: { order: 1, flexGrow: 1 }, actions: { order: 2, flexGrow: 0 }, nav: { order: 3, flexGrow: 0 } }, mock: "m5" },
    { key: "stack", label: "Empilé", hint: "Tout sur une colonne, pleine largeur", lca: Object.assign({}, HDR_COL, { alignItems: "stretch", gap: "10px" }), slots: { brand: { order: 1, flexGrow: 0, alignSelf: "stretch" }, nav: { order: 2, flexGrow: 0, alignSelf: "stretch" }, actions: { order: 3, flexGrow: 0, alignSelf: "stretch" } }, mock: "m6" }
  ];
  var HDR_LAYOUT_KEYS = ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gap", "gridTemplate"];
  var HDR_SLOT_KEYS = ["order", "flexGrow", "alignSelf", "justifySelf"];
  var hdrEditOpen = null;
  function hdrOrdered(main) {
    var val = function (sl, i) { var v = ownValue(sl.node, "order"); if (v === undefined || v === "") v = inheritedValue(sl.node, "order"); return v === undefined || v === "" || isNaN(Number(v)) ? i + 1 : Number(v); };
    return main.slots.map(function (sl, i) { return { sl: sl, i: i, v: val(sl, i) }; }).sort(function (a, b) { return a.v - b.v || a.i - b.i; }).map(function (x) { return x.sl; });
  }
  function headerLayout(b, sec) {
    var main = hdrMain(sec), dis = !canWrite;
    var redraw = function () { hdrOpen = "disposition"; var bx = $("[data-pb-page-settings]"); bx.textContent = ""; renderHeaderSettings(bx); };
    if (!main) { b.appendChild(h("p", { class: "pb-hint", text: "Cet en-tête n'a ni logo ni menu : ajoutez-en un pour pouvoir régler la disposition." })); return; }
    b.appendChild(h("p", { class: "pb-hint", text: "Choisissez l'écran, puis un modèle de placement. Les réglages d'un écran n'affectent pas les autres : le téléphone suit la tablette, qui suit l'ordinateur, tant que vous n'y avez rien changé." }));
    // Écran
    b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "1 · Écran à régler" }));
    b.appendChild(h("div", { class: "pb-hdr-tiles is-two", role: "radiogroup", "aria-label": "Écran à régler" }, SPEC.breakpoints.map(function (bp) {
      return h("button", { type: "button", role: "radio", class: "pb-hdr-tile is-flat", "aria-checked": String(device === bp.key), onclick: function () { setDevice(bp.key); redraw(); } }, h("span", { class: "pb-hdr-tile-title", text: bp.label }));
    })));
    // Modèles
    b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "2 · Modèle de placement" }));
    var grid = h("div", { class: "pb-hdr-tiles", role: "group", "aria-label": "Modèles de disposition" });
    HDR_LAYOUTS.forEach(function (m) {
      var mock = h("span", { class: "pb-lm " + m.mock, "aria-hidden": "true" }, h("i", { class: "pb-lm-b is-brand" }), h("i", { class: "pb-lm-b is-nav" }), h("i", { class: "pb-lm-b is-act" }));
      grid.appendChild(h("button", { type: "button", class: "pb-hdr-tile", disabled: dis, onclick: function () {
        change(function () {
          var L = byId(main.lca.id); if (!L) return false;
          var set = styleSet(L, device, "normal", true); HDR_LAYOUT_KEYS.forEach(function (k) { delete set[k]; }); Object.keys(m.lca).forEach(function (k) { set[k] = m.lca[k]; }); cleanStyles(L);
          main.slots.forEach(function (sl) { var n = byId(sl.node.id); if (!n) return; var st = styleSet(n, device, "normal", true); HDR_SLOT_KEYS.forEach(function (k) { delete st[k]; }); var o = m.slots[sl.role] || m.slots.actions; Object.keys(o).forEach(function (k) { st[k] = o[k]; }); cleanStyles(n); });
        }, { label: "Disposition de l'en-tête : " + m.label + " (" + bpLabel(device) + ")" });
        toast("Disposition « " + m.label + " » appliquée à l'écran « " + bpLabel(device) + " ».");
        redraw();
      } }, mock, h("span", { class: "pb-hdr-tile-title", text: m.label }), h("span", { class: "pb-hdr-tile-hint", text: m.hint })));
    });
    b.appendChild(grid);
    if (device !== "desktop") b.appendChild(h("div", { class: "pb-hdr-resetrow" }, h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: dis, onclick: function () {
      change(function () {
        var L = byId(main.lca.id); if (!L) return false; var set = styleSet(L, device, "normal", false); if (set) HDR_LAYOUT_KEYS.forEach(function (k) { delete set[k]; }); cleanStyles(L);
        main.slots.forEach(function (sl) { var n = byId(sl.node.id); var st = n && styleSet(n, device, "normal", false); if (st) { HDR_SLOT_KEYS.forEach(function (k) { delete st[k]; }); cleanStyles(n); } });
      }, { label: "Retour à la disposition de l'écran plus grand" });
      redraw();
    } }, "Reprendre la disposition de l'écran plus grand")));
    // Ordre et placement
    b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "3 · Ordre et placement (écran : " + bpLabel(device) + ")" }));
    var ordered = hdrOrdered(main), card = h("div", { class: "pb-hdr-list" });
    ordered.forEach(function (sl, idx) {
      var grow = Number(ownValue(sl.node, "flexGrow") !== undefined ? ownValue(sl.node, "flexGrow") : inheritedValue(sl.node, "flexGrow")) > 0;
      var hidden = (sl.node.hideOn || []).indexOf(device) >= 0;
      var move = function (d) { return function () {
        var list = hdrOrdered(main), at = list.indexOf(sl), to = at + d; if (to < 0 || to >= list.length) return;
        var t = list[at]; list[at] = list[to]; list[to] = t;
        change(function () { list.forEach(function (x, i) { var n = byId(x.node.id); if (!n) return; styleSet(n, device, "normal", true).order = i + 1; cleanStyles(n); }); }, { label: "Ordre des éléments de l'en-tête (" + bpLabel(device) + ")" });
        redraw();
      }; };
      var btn = function (txt, label, fn, off) { return h("button", { type: "button", class: "pb-hdr-mini", "aria-label": label, "data-tip": label, disabled: dis || off, onclick: fn }, txt); };
      card.appendChild(h("div", { class: "pb-hdr-slot" + (hidden ? " is-hidden" : "") },
        h("span", { class: "pb-hdr-slot-n", text: String(idx + 1) }),
        h("span", { class: "pb-hdr-txt" }, h("span", { class: "pb-hdr-title", text: hdrSlotLabel(sl) }), h("span", { class: "pb-hdr-hint", text: hidden ? "Masqué sur cet écran" : grow ? "Occupe l'espace libre" : "Taille de son contenu" })),
        h("span", { class: "pb-hdr-slot-tools" },
          btn("↑", "Avancer d'une place", move(-1), idx === 0), btn("↓", "Reculer d'une place", move(1), idx === ordered.length - 1),
          btn(grow ? "↔" : "⇥", grow ? "Ne plus occuper l'espace libre" : "Occuper l'espace libre (pousse les autres éléments)", function () { change(function () { var n = byId(sl.node.id); if (!n) return false; var st = styleSet(n, device, "normal", true); st.flexGrow = grow ? 0 : 1; cleanStyles(n); }, { label: "Espace libre (" + bpLabel(device) + ")" }); redraw(); }),
          btn(hidden ? "◌" : "●", hidden ? "Afficher sur cet écran" : "Masquer sur cet écran", function () {
            var cur = (sl.node.hideOn || []).slice(), next = hidden ? cur.filter(function (x) { return x !== device; }) : cur.concat(device);
            if (!hidden && BPS.every(function (x) { return next.indexOf(x) >= 0; })) { toast("Un élément ne peut pas être masqué sur tous les écrans."); return; }
            change(function () { var n = byId(sl.node.id); if (!n) return false; if (next.length) n.hideOn = next; else delete n.hideOn; }, { label: "Visibilité sur l'écran « " + bpLabel(device) + " »" }); redraw();
          }))));
    });
    b.appendChild(card);
    // Contenu et couleurs
    b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "4 · Texte et couleurs des éléments" }));
    if (styleState !== "normal") b.appendChild(h("p", { class: "pb-hint", text: "Vous modifiez l'état « " + styleState + " » : repassez sur « Normal » (dans « Style du conteneur ») pour l'apparence habituelle." }));
    var leaves = []; (function w(n) { if (!(n.children || []).length) { if (["spacer", "divider"].indexOf(n.type) < 0) leaves.push(n); } else n.children.forEach(w); })(main.lca);
    var list = h("div", { class: "pb-hdr-list" });
    leaves.forEach(function (n) {
      var open = hdrEditOpen === n.id, p = n.props || {};
      var title = typeLabel(n), sub = (preview(n) || "").slice(0, 36);
      var head = h("button", { type: "button", class: "pb-hdr-row", "aria-expanded": String(open), onclick: function () { hdrEditOpen = open ? null : n.id; redraw(); } },
        h("span", { class: "pb-hdr-ico", "aria-hidden": "true" }, icon(NT[n.type] ? NT[n.type].icon : "layout")),
        h("span", { class: "pb-hdr-txt" }, h("span", { class: "pb-hdr-title", text: n.name || title }), sub ? h("span", { class: "pb-hdr-hint", text: sub }) : null),
        h("span", { class: "pb-hdr-go" + (open ? " is-open" : ""), "aria-hidden": "true" }, icon("chevronRight")));
      list.appendChild(head);
      if (open) {
        var body = h("div", { class: "pb-hdr-quick" });
        var tk = typeof p.text === "string" ? "text" : typeof p.label === "string" && n.type === "button" ? "label" : null;
        if (tk) body.appendChild(textField(tk === "label" ? "Texte du bouton" : "Texte", p[tk], function (v) { setProp(n.id, tk, v); }, { disabled: dis, max: 160 }));
        if (n.type === "button" && typeof p.url === "string") body.appendChild(textField("Lien du bouton", p.url, function (v) { setProp(n.id, "url", v); }, { disabled: dis, max: 500, placeholder: "/page ou https://…" }));
        var ids = [n];
        [["color", "Couleur du texte"], ["backgroundColor", "Couleur de fond"]].forEach(function (c) { if (SP[c[0]]) { try { body.appendChild(styleControl(ids, c[0], c[1])); } catch (e) { /* indisponible */ } } });
        body.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { styleState = "normal"; inspTab = "style"; store.set("insp-tab", "style"); select(n.id); renderInspector(); } }, "Tous les réglages de cet élément →"));
        list.appendChild(body);
      }
    });
    b.appendChild(list);
  }
  // ---- Menu mobile (hamburger) : un modèle de design, appliqué à tous les menus de l'en-tête, pour les écrans plus petits qu'un ordinateur ----
  var HDR_BURGERS = [
    { key: "none", label: "Menu étalé", hint: "Pas de bouton : le menu reste visible", props: null, mock: "none" },
    { key: "classic", label: "Classique", hint: "Bouton « Menu », liste dépliée dessous", props: {}, mock: "inline" },
    { key: "drawer-right", label: "Tiroir à droite", hint: "Panneau qui glisse de la droite", props: { mobileMode: "drawer", drawerSide: "right", burgerText: "", burgerShape: "round" }, mock: "right" },
    { key: "drawer-left", label: "Tiroir à gauche", hint: "Panneau qui glisse de la gauche", props: { mobileMode: "drawer", drawerSide: "left", burgerText: "", burgerShape: "plain" }, mock: "left" },
    { key: "full", label: "Plein écran", hint: "Le menu couvre tout l'écran", props: { mobileMode: "full", burger: "lines2", burgerText: "", burgerShape: "round" }, mock: "full" },
    { key: "sheet", label: "Panneau du bas", hint: "Le menu monte depuis le bas", props: { mobileMode: "sheet", burgerText: "Menu", burgerShape: "box" }, mock: "sheet" },
    { key: "minimal", label: "Minimal", hint: "Deux traits, sans cadre, tiroir à droite", props: { mobileMode: "drawer", drawerSide: "right", burger: "lines2", burgerText: "", burgerShape: "plain" }, mock: "right" },
    { key: "dots", label: "Points", hint: "Trois points, bouton rond", props: { mobileMode: "drawer", drawerSide: "right", burger: "dots", burgerText: "", burgerShape: "round" }, mock: "right" },
    { key: "text", label: "Texte seul", hint: "MENU en lettres, sans icône", props: { mobileMode: "full", burger: "text", burgerText: "Menu", burgerShape: "plain" }, mock: "full" }
  ];
  var HDR_BURGER_KEYS = ["mobileMode", "drawerSide", "burger", "burgerText", "burgerShape"];
  function hdrMenus() { var out = []; (function walk(list) { (list || []).forEach(function (n) { if (n.type === "menu") out.push(n); if (n.children) walk(n.children); }); })((headerSection() || {}).children); return out; }
  function hdrBurgerOf(props) {
    if (!props || !props.mobileToggle) return "none";
    var sig = function (q) { return [q.mobileMode === "drawer" || q.mobileMode === "full" || q.mobileMode === "sheet" ? q.mobileMode : "inline", q.mobileMode === "drawer" ? (q.drawerSide === "left" ? "left" : "right") : "", q.burger || "lines", typeof q.burgerText === "string" ? q.burgerText : "Menu", q.burgerShape || "box"].join("|"); };
    var cur = sig(props), found = "";
    HDR_BURGERS.forEach(function (m) { if (m.props && sig(m.props) === cur) found = m.key; });
    return found || "custom";
  }
  // Aperçu RÉEL et cliquable du menu mobile : la page rendue par le serveur (mêmes styles, même script que le site publié) dans un cadre de téléphone ou de tablette
  var hdrPrevDev = "phone", hdrPrevOpen = false;
  function headerLivePreview(b, active) {
    var wrap = h("div", { class: "pb-hdr-live" });
    var W = hdrPrevDev === "tab" ? 820 : 390, H = hdrPrevDev === "tab" ? 600 : 640;
    var fr = h("iframe", { class: "pb-hdr-live-frame", title: "Aperçu réel du menu mobile", sandbox: "allow-scripts allow-same-origin" });
    var box = h("div", { class: "pb-hdr-phone is-" + hdrPrevDev }, fr);
    var note = h("p", { class: "pb-hint pb-hdr-live-note", "aria-live": "polite" });
    var seg = h("div", { class: "pb-hdr-live-seg", role: "radiogroup", "aria-label": "Taille de l'aperçu" }, [["phone", "Téléphone"], ["tab", "Tablette"]].map(function (o) {
      return h("button", { type: "button", role: "radio", "aria-checked": String(hdrPrevDev === o[0]), onclick: function () { hdrPrevDev = o[0]; hdrPrevOpen = false; var bx = $("[data-pb-page-settings]"); hdrOpen = "mobile"; bx.textContent = ""; renderHeaderSettings(bx); } }, o[1]);
    }));
    var toggle = h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: true, onclick: function () { var bg = burgerIn(); if (bg) bg.click(); } }, "Ouvrir / fermer le menu");
    wrap.appendChild(h("p", { class: "pb-hdr-sublabel", text: "Aperçu réel" }));
    wrap.appendChild(h("div", { class: "pb-hdr-live-bar" }, seg, toggle));
    wrap.appendChild(box); wrap.appendChild(note);
    b.appendChild(wrap);
    var burgerIn = function () { try { var d = fr.contentDocument; return d && d.querySelector(".kw-menu-burger"); } catch (e) { return null; } };
    var fit = function () { var cw = box.clientWidth || 240, sc = Math.min(1, cw / W); fr.style.width = W + "px"; fr.style.height = H + "px"; fr.style.transform = "scale(" + sc + ")"; box.style.height = Math.round(H * sc) + "px"; };
    requestAnimationFrame(fit);
    if (active === "none") { note.textContent = "Menu étalé : aucun bouton, le menu reste visible sur tous les écrans."; box.classList.add("is-idle"); }
    fetch(BASE + "/rendu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: payload() }) })
      .then(function (r) { return r.text().then(function (t) { return { ok: r.ok, t: t }; }); })
      .then(function (res) {
        if (!res.ok) { note.textContent = "Aperçu indisponible pour le moment."; return; }
        fr.onload = function () {
          fit();
          try {
            var d = fr.contentDocument, st = d.createElement("style"); st.textContent = "[data-kw-add], .kw-add { display: none !important; } html { scroll-behavior: auto; }"; d.head.appendChild(st);
          } catch (e) { /* aperçu sans retouche */ }
          var tries = 0, wait = function () {
            var bg = burgerIn();
            if (bg) { toggle.disabled = false; note.textContent = "Touchez le bouton dans l'aperçu : c'est le vrai menu, tel que vos visiteurs le verront."; if (hdrPrevOpen) { hdrPrevOpen = false; setTimeout(function () { bg.click(); }, 250); } return; }
            if (++tries < 12) { setTimeout(wait, 150); return; }
            if (active !== "none") note.textContent = "Aucun bouton n'apparaît : le menu de cet en-tête est vide (ajoutez des liens dans Apparence → Menus, emplacement « En-tête ») ou l'écran de l'aperçu est plus large que la taille choisie.";
          };
          wait();
        };
        fr.srcdoc = res.t;
      }).catch(function () { note.textContent = "Aperçu indisponible pour le moment."; });
  }
  function headerMobile(b) {
    var menus = hdrMenus(), dis = !canWrite;
    var redraw = function () { hdrOpen = "mobile"; var bx = $("[data-pb-page-settings]"); bx.textContent = ""; renderHeaderSettings(bx); };
    if (!menus.length) { b.appendChild(h("p", { class: "pb-hint", text: "Cet en-tête n'a pas encore de menu. Ajoutez un élément « Menu de navigation » : le modèle de menu hamburger s'appliquera ensuite à tous les menus de l'en-tête." })); return; }
    b.appendChild(h("p", { class: "pb-hint", text: "Sur les écrans plus petits qu'un ordinateur, le menu se replie derrière un bouton hamburger. Choisissez un modèle : il s'applique à tous les menus de l'en-tête." }));
    var active = hdrBurgerOf(menus[0].props);
    headerLivePreview(b, active);
    var tiles = h("div", { class: "pb-hdr-tiles", role: "radiogroup", "aria-label": "Modèle de menu hamburger" });
    HDR_BURGERS.forEach(function (m) {
      var mock = h("span", { class: "pb-mm is-" + m.mock, "aria-hidden": "true" }, h("span", { class: "pb-mm-bar" }, h("i", { class: "pb-mm-logo" }), h("i", { class: "pb-mm-btn" })), h("i", { class: "pb-mm-panel" }));
      tiles.appendChild(h("button", { type: "button", role: "radio", class: "pb-hdr-tile", "aria-checked": String(active === m.key), disabled: dis, onclick: function () {
        hdrOpen = "mobile";
        change(function () {
          hdrMenus().forEach(function (n) {
            var x = byId(n.id); if (!x) return; x.props = x.props || {};
            HDR_BURGER_KEYS.forEach(function (k) { delete x.props[k]; });
            if (!m.props) { delete x.props.mobileToggle; delete x.props.menuBreakpoint; return; }
            x.props.mobileToggle = true; Object.keys(m.props).forEach(function (k) { x.props[k] = m.props[k]; });
          });
        }, { label: "Modèle de menu hamburger : " + m.label });
        hdrPrevOpen = Boolean(m.props);
        if (m.props) { var q = menus[0].props.menuBreakpoint || 767; var want = q > 767 ? "tablet" : "mobile"; if (device !== want) { setDevice(want); toast("Écran « " + bpLabel(want) + " » : le canevas montre maintenant le bouton hamburger."); } }
        redraw();
      } }, mock, h("span", { class: "pb-hdr-tile-title", text: m.label }), h("span", { class: "pb-hdr-tile-hint", text: m.hint })));
    });
    b.appendChild(tiles);
    if (active === "custom") b.appendChild(h("p", { class: "pb-hint", text: "Réglage personnalisé : ce menu a des réglages de bouton différents des modèles. Choisir un modèle les remplace." }));
    if (active !== "none") {
      var bp = menus[0].props.menuBreakpoint || 767, mode = bp === 1023 ? "tab" : bp === 767 ? "mob" : "cus";
      b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "Quand l'utiliser" }));
      var seg = h("div", { class: "pb-hdr-tiles is-two", role: "radiogroup", "aria-label": "Tailles d'écran concernées" });
      [["tab", "Tablette et mobile", "Écrans de 1023 px et moins", 1023], ["mob", "Mobile seulement", "Écrans de 767 px et moins", 767], ["cus", "Personnalisé", "Choisir la largeur", bp !== 767 && bp !== 1023 ? bp : 900]].forEach(function (o) {
        seg.appendChild(h("button", { type: "button", role: "radio", class: "pb-hdr-tile is-flat", "aria-checked": String(mode === o[0]), disabled: dis, onclick: function () {
          change(function () { hdrMenus().forEach(function (n) { var x = byId(n.id); if (!x) return; if (o[3] === 767) delete x.props.menuBreakpoint; else x.props.menuBreakpoint = o[3]; }); }, { label: "Taille d'écran du menu hamburger" });
          redraw();
        } }, h("span", { class: "pb-hdr-tile-title", text: o[1] }), h("span", { class: "pb-hdr-tile-hint", text: o[2] })));
      });
      b.appendChild(seg);
      if (mode === "cus") b.appendChild(numberField("Largeur d'écran (px)", bp, { min: 320, max: 1920, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; change(function () { hdrMenus().forEach(function (q) { var x = byId(q.id); if (x) { if (n === 767) delete x.props.menuBreakpoint; else x.props.menuBreakpoint = n; } }); }, { label: "Largeur du menu hamburger", key: "burger-bp", light: true }); }, "Au-dessous de cette largeur, le menu devient un bouton."));
    }
  }
  // Accordéon de l'onglet « En-tête » : une seule section ouverte à la fois ; la section ouverte est retenue quand le panneau se redessine
  var hdrOpen = "comportement";
  function hdrAcc(box, key, title, fill) {
    var body = h("div", { class: "pb-hdr-acc-body" }); fill(body);
    if (!body.childNodes.length) return;
    var det = h("details", { class: "pb-hdr-acc", "data-hdr-sec": key, open: hdrOpen === key ? "" : null });
    det.appendChild(h("summary", {}, h("span", { class: "pb-hdr-acc-title", text: title }), h("span", { class: "pb-hdr-acc-chev", "aria-hidden": "true" }, icon("chevronRight"))));
    det.appendChild(body);
    det.addEventListener("toggle", function () {
      if (det.open) { hdrOpen = key; [].forEach.call(box.querySelectorAll(":scope > details.pb-hdr-acc"), function (o) { if (o !== det && o.open) o.open = false; }); }
      else if (hdrOpen === key) hdrOpen = "";
    });
    box.appendChild(det);
  }
  // Rangées de l'en-tête (les conteneurs de premier niveau) : chacune peut se coller seule en haut de l'écran pendant que les autres défilent
  function headerRows(box, sec) {
    var rows = (sec.children || []).filter(function (n) { return n.type === "container"; });
    // Un seul conteneur racine (cas courant) : ses rangées sont les conteneurs qu'il contient
    if (rows.length === 1) { var inner = (rows[0].children || []).filter(function (n) { return n.type === "container"; }); if (inner.length) rows = inner; }
    if (!rows.length) return;
    box.appendChild(h("p", { class: "pb-hint", text: "Une rangée cochée reste en haut de l'écran pendant que les autres défilent." }));
    var card = h("div", { class: "pb-hdr-card" });
    rows.forEach(function (r, i) {
      var name = r.name || "Rangée " + (i + 1);
      card.appendChild(checkField("Coller la rangée « " + name + " »", Boolean(r.props && r.props.stickRow), function (on) {
        change(function () { var x = byId(r.id); if (!x) return false; x.props = x.props || {}; if (on) x.props.stickRow = true; else { delete x.props.stickRow; delete x.props.stickOffset; } }, { label: "Coller une rangée de l'en-tête" });
        var b = $("[data-pb-page-settings]"); b.textContent = ""; renderHeaderSettings(b);
      }, { disabled: !canWrite }));
      if (r.props && r.props.stickRow) card.appendChild(numberField("Distance du bord haut (px) : " + name, r.props.stickOffset || 0, { min: 0, max: 200, step: 1, integer: true, disabled: !canWrite }, function (n) { if (n === null) return false; change(function () { var x = byId(r.id); if (!x) return false; if (n) x.props.stickOffset = n; else delete x.props.stickOffset; }, { label: "Distance de la rangée collée", key: "stick:" + r.id, light: true }); }));
    });
    box.appendChild(card);
  }
  var HDR_GROUPS = [
    ["Mise en page", [["flexDirection", "Direction"], ["flexWrap", "Retour à la ligne"], ["justifyContent", "Justification"], ["alignItems", "Alignement"], ["gap", "Espacement entre éléments"]]],
    ["Taille", [["width", "Largeur"], ["maxWidth", "Largeur maximale"], ["minHeight", "Hauteur minimale"], ["overflow", "Débordement"]]],
    ["Espacements", [["paddingTop", "Marge interne haut"], ["paddingBottom", "Marge interne bas"], ["paddingLeft", "Marge interne gauche"], ["paddingRight", "Marge interne droite"], ["marginTop", "Marge externe haut"], ["marginBottom", "Marge externe bas"]]],
    ["Fond, bordure et ombre", [["backgroundColor", "Couleur de fond"], ["borderStyle", "Type de bordure"], ["borderBottomWidth", "Bordure du bas (épaisseur)"], ["borderColor", "Couleur de bordure"], ["borderRadius", "Arrondi"], ["boxShadow", "Ombre"], ["opacity", "Opacité"], ["backdropBlur", "Flou de l'arrière-plan"]]],
    ["Avancé", [["visibility", "Visibilité (garde sa place)"], ["transitionDuration", "Durée des transitions"]]]
  ];
  var hdrRootOpen = {};
  function headerRootPanel(box, root, only) {
    var items = [root];
    var again = function () { var b = $("[data-pb-page-settings]"); b.textContent = ""; renderHeaderSettings(b); renderInspector(); };
    var card = h("div", { class: "pb-hdr-card" });
    var bar = h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "Écran" }),
      h("div", { class: "pb-seg pb-bp-seg", role: "radiogroup", "aria-label": "Écran modifié" }, SPEC.breakpoints.map(function (b) {
        return h("button", { type: "button", role: "radio", "aria-checked": String(device === b.key), onclick: function () { setDevice(b.key); var bx = $("[data-pb-page-settings]"); bx.textContent = ""; renderHeaderSettings(bx); } }, b.label);
      })));
    card.appendChild(bar);
    var states = [{ key: "normal", label: "Normal" }].concat(SPEC.states.filter(function (st) { return (only || ["hover", "scrolled", "menuOpen"]).indexOf(st.key) >= 0; }));
    card.appendChild(h("div", { class: "pb-insp-bar" }, h("span", { class: "pb-insp-bar-label", text: "État" }),
      h("div", { class: "pb-seg pb-state-seg", role: "radiogroup", "aria-label": "État de l'en-tête" }, states.map(function (st) {
        return h("button", { type: "button", role: "radio", "aria-checked": String(styleState === st.key), onclick: function () { styleState = st.key; again(); } }, st.label);
      }))));
    if (styleState !== "normal") card.appendChild(h("p", { class: "pb-hint", text: styleState === "scrolled" ? "Ces réglages s'appliquent seulement après le défilement (au-delà du seuil)." : styleState === "menuOpen" ? "Ces réglages s'appliquent seulement quand le menu est ouvert." : "Ces réglages s'appliquent au survol." }));
    else if (device !== "desktop") card.appendChild(h("p", { class: "pb-hint", text: "Écran « " + bpLabel(device) + " » : un champ vide reprend la valeur de l'écran plus grand." }));
    card.appendChild(h("p", { class: "pb-hdr-sublabel", text: "Réglages à modifier" }));
    HDR_GROUPS.forEach(function (g) {
      var det = h("details", { class: "pb-acc", open: hdrRootOpen[g[0]] ? "" : null, ontoggle: function (e) { var d = e.currentTarget; if (d.open) { Object.keys(hdrRootOpen).forEach(function (k) { hdrRootOpen[k] = false; }); hdrRootOpen[g[0]] = true; [].forEach.call(d.parentNode.querySelectorAll(":scope > details.pb-acc"), function (o) { if (o !== d && o.open) o.open = false; }); } else hdrRootOpen[g[0]] = false; } });
      det.appendChild(h("summary", {}, h("span", { class: "pb-acc-title", text: g[0] })));
      var inner = h("div", { class: "pb-acc-body" });
      g[1].forEach(function (kv) { if (SP[kv[0]]) { try { inner.appendChild(styleControl(items, kv[0], kv[1])); } catch (e) { /* propriété indisponible pour ce conteneur */ } } });
      det.appendChild(inner); card.appendChild(det);
    });
    box.appendChild(card);
  }
  // ======== Pied de page : colonnes par écran, ordre et masquage des colonnes, style du conteneur, éléments ========
  // « Barre des colonnes » = le conteneur qui réunit le plus de colonnes (enfants conteneurs) ; sinon le conteneur racine.
  function footMain(sec) {
    var root = (sec.children || []).filter(function (n) { return n.type === "container"; })[0] || null;
    if (!root) return null;
    var best = null, bestN = 1;
    (function walk(n, depth) { var kids = (n.children || []).filter(function (c) { return c.type === "container" || c.type === "grid" || c.type === "group" || c.type === "stack"; }); if (kids.length > bestN) { best = n; bestN = kids.length; } (n.children || []).forEach(function (c) { if (c.children) walk(c, depth + 1); }); })(root, 0);
    var cols = best || root;
    return { root: root, cols: cols, slots: (cols.children || []).map(function (c) { return { node: c, role: "col" }; }) };
  }
  // Modèle (archive, recherche, 404, article…) : « grille principale » = la première grille (résultats en boucle) ; ses blocs = les enfants du conteneur racine
  function tplMain(sec) {
    var root = (sec.children || []).filter(function (n) { return n.type === "container"; })[0] || null;
    if (!root) return null;
    var grid = null;
    (function walk(n) { if (!grid && n.type === "grid") { grid = n; return; } (n.children || []).forEach(walk); })(root);
    return { root: root, cols: grid || root, hasGrid: Boolean(grid), slots: (root.children || []).map(function (c) { return { node: c, role: "bloc" }; }) };
  }
  // Page-modèle : la section qui porte la grille de résultats, sinon la première section avec contenu
  function tplSection() {
    var list = (content.sections || []).filter(function (x) { return x && x.type === "layout"; }), found = null;
    list.forEach(function (x) { if (!found && tplMain(x) && tplMain(x).hasGrid) found = x; });
    return found || list[0] || null;
  }
  var FOOT_GAPS = [["12px", "Serré"], ["24px", "Normal"], ["40px", "Large"], ["64px", "Très large"]];
  function renderFooterSettings(box) {
    var tpl = isTplDoc(), sec = tpl ? tplSection() : headerSection(), main = sec && (tpl ? tplMain(sec) : footMain(sec)), dis = !canWrite;
    var what = tpl ? "ce modèle" : "ce pied de page", blocs = tpl ? "blocs" : "colonnes";
    if (!main) { box.appendChild(h("p", { class: "pb-hint", text: "Ce document n'a pas encore de conteneur : ajoutez-en un pour régler sa disposition et son style." })); return; }
    if (["colonnes", "style", "ecrans", "elements"].indexOf(hdrOpen) < 0) hdrOpen = "colonnes";
    var hasCols = !tpl || main.hasGrid;
    var redraw = function () { var bx = $("[data-pb-page-settings]"); bx.textContent = ""; renderFooterSettings(bx); };
    // Les réglages de colonnes concernent toujours l'état « Normal », quel que soit l'état choisi plus bas dans « Style du conteneur »
    var readN = function (n, k) { var sv = styleState; styleState = "normal"; var v = ownValue(n, k); if (v === undefined || v === "") v = inheritedValue(n, k); styleState = sv; return v; };
    var asNormal = function (fn) { var sv = styleState; styleState = "normal"; try { fn(); } finally { styleState = sv; } };
    var open = function (id, tab, state) { styleState = state || "normal"; inspTab = tab; store.set("insp-tab", tab); select(id); renderInspector(); };
    var row = function (iconName, title, hint, onclick, depth) {
      return h("button", { type: "button", class: "pb-hdr-row", style: depth ? "padding-left:" + (14 + depth * 14) + "px" : null, onclick: onclick },
        h("span", { class: "pb-hdr-ico", "aria-hidden": "true" }, icon(iconName)),
        h("span", { class: "pb-hdr-txt" }, h("span", { class: "pb-hdr-title", text: title }), hint ? h("span", { class: "pb-hdr-hint", text: hint }) : null),
        h("span", { class: "pb-hdr-go", "aria-hidden": "true" }, icon("chevronRight")));
    };
    hdrAcc(box, "colonnes", tpl ? "Disposition" : "Colonnes et disposition", function (b) {
      b.appendChild(h("p", { class: "pb-hint", text: "Réglez la disposition écran par écran : le téléphone suit la tablette, qui suit l'ordinateur, tant que vous n'y avez rien changé." + (hasCols ? "" : " Ce modèle n'a pas de grille de résultats : seuls l'alignement et l'ordre des blocs sont réglables ici.") }));
      b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "1 · Écran à régler" }));
      b.appendChild(h("div", { class: "pb-hdr-tiles is-two", role: "radiogroup", "aria-label": "Écran à régler" }, SPEC.breakpoints.map(function (bp) {
        return h("button", { type: "button", role: "radio", class: "pb-hdr-tile is-flat", "aria-checked": String(device === bp.key), onclick: function () { setDevice(bp.key); redraw(); } }, h("span", { class: "pb-hdr-tile-title", text: bp.label }));
      })));
      var cur = readN(main.cols, "columns");
      if (hasCols) b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "2 · " + (tpl ? "Colonnes de la grille de résultats" : "Nombre de colonnes") + " (écran : " + bpLabel(device) + ")" }));
      if (hasCols) b.appendChild(h("div", { class: "pb-hdr-tiles is-cols", role: "radiogroup", "aria-label": "Nombre de colonnes" }, [1, 2, 3, 4, 5, 6].map(function (n) {
        var mock = h("span", { class: "pb-fm", "aria-hidden": "true" }); for (var i = 0; i < n; i++) mock.appendChild(h("i"));
        return h("button", { type: "button", role: "radio", class: "pb-hdr-tile", "aria-checked": String(Number(cur) === n), disabled: dis, onclick: function () {
          change(function () { var c = byId(main.cols.id); if (!c) return false; var set = styleSet(c, device, "normal", true); if (c.type !== "grid") set.display = "grid"; delete set.gridTemplate; set.columns = n; cleanStyles(c); }, { label: "Colonnes de la grille : " + n + " (" + bpLabel(device) + ")" });
          redraw();
        } }, mock, h("span", { class: "pb-hdr-tile-title", text: n + (n > 1 ? " colonnes" : " colonne") }));
      })));
      if (hasCols) b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "3 · Espacement entre les " + (tpl ? "cartes" : "colonnes") }));
      var gcur = readN(main.cols, "gap");
      if (hasCols) b.appendChild(h("div", { class: "pb-hdr-tiles is-two", role: "radiogroup", "aria-label": "Espacement" }, FOOT_GAPS.map(function (g) {
        return h("button", { type: "button", role: "radio", class: "pb-hdr-tile is-flat", "aria-checked": String(String(gcur) === g[0]), disabled: dis, onclick: function () { asNormal(function () { setStyles([main.cols.id], { gap: g[0] }); }); redraw(); } }, h("span", { class: "pb-hdr-tile-title", text: g[1] }), h("span", { class: "pb-hdr-tile-hint", text: g[0] }));
      })));
      b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "4 · Alignement du texte" }));
      var acur = readN(main.root, "textAlign");
      b.appendChild(h("div", { class: "pb-hdr-tiles is-two", role: "radiogroup", "aria-label": "Alignement du texte" }, [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]].map(function (a) {
        return h("button", { type: "button", role: "radio", class: "pb-hdr-tile is-flat", "aria-checked": String(acur === a[0]), disabled: dis, onclick: function () { asNormal(function () { setStyles([main.root.id], { textAlign: a[0] }); }); redraw(); } }, h("span", { class: "pb-hdr-tile-title", text: a[1] }));
      })));
      // Ordre et visibilité des colonnes pour l'écran choisi
      b.appendChild(h("p", { class: "pb-hdr-sublabel", text: "5 · Ordre et visibilité des " + blocs + " (écran : " + bpLabel(device) + ")" }));
      var ordered = hdrOrdered({ slots: main.slots }), card = h("div", { class: "pb-hdr-list" });
      ordered.forEach(function (sl, idx) {
        var hidden = (sl.node.hideOn || []).indexOf(device) >= 0;
        var move = function (d) { return function () {
          var list = hdrOrdered({ slots: main.slots }), at = list.indexOf(sl), to = at + d; if (to < 0 || to >= list.length) return;
          var t = list[at]; list[at] = list[to]; list[to] = t;
          change(function () { list.forEach(function (x, i) { var n = byId(x.node.id); if (!n) return; styleSet(n, device, "normal", true).order = i + 1; cleanStyles(n); }); }, { label: "Ordre des " + blocs + " (" + bpLabel(device) + ")" });
          redraw();
        }; };
        var btn = function (txt, label, fn, off) { return h("button", { type: "button", class: "pb-hdr-mini", "aria-label": label, "data-tip": label, disabled: dis || off, onclick: fn }, txt); };
        var name = sl.node.name || (function () { var t = []; (function w(n) { if (!(n.children || []).length) { var l = (preview(n) || typeLabel(n)).slice(0, 28); if (t.indexOf(l) < 0) t.push(l); } else n.children.forEach(w); })(sl.node); return t.slice(0, 2).join(" · ") || typeLabel(sl.node); })();
        card.appendChild(h("div", { class: "pb-hdr-slot" + (hidden ? " is-hidden" : "") },
          h("span", { class: "pb-hdr-slot-n", text: String(idx + 1) }),
          h("span", { class: "pb-hdr-txt" }, h("span", { class: "pb-hdr-title", text: name }), h("span", { class: "pb-hdr-hint", text: hidden ? "Masquée sur cet écran" : "Visible" })),
          h("span", { class: "pb-hdr-slot-tools" }, btn("↑", "Avancer d'une place", move(-1), idx === 0), btn("↓", "Reculer d'une place", move(1), idx === ordered.length - 1),
            btn(hidden ? "◌" : "●", hidden ? "Afficher sur cet écran" : "Masquer sur cet écran", function () {
              var cur2 = (sl.node.hideOn || []).slice(), next = hidden ? cur2.filter(function (x) { return x !== device; }) : cur2.concat(device);
              if (!hidden && BPS.every(function (x) { return next.indexOf(x) >= 0; })) { toast("Ce bloc ne peut pas être masqué sur tous les écrans."); return; }
              change(function () { var n = byId(sl.node.id); if (!n) return false; if (next.length) n.hideOn = next; else delete n.hideOn; }, { label: "Visibilité d'un bloc (" + bpLabel(device) + ")" }); redraw();
            }))));
      });
      b.appendChild(card);
    });
    hdrAcc(box, "style", "Style du conteneur", function (b) { headerRootPanel(b, main.root, ["hover"]); });
    var els = []; (function walk(list, depth) { (list || []).forEach(function (n) { els.push({ n: n, depth: depth }); if (n.children) walk(n.children, Math.min(depth + 1, 3)); }); })(main.root.children, 0);
    if (els.length) hdrAcc(box, "elements", tpl ? "Éléments du modèle" : "Éléments du pied de page", function (b) {
      b.appendChild(h("div", { class: "pb-hdr-list" }, els.map(function (e) {
        var n = e.n, t = (preview(n) || "").slice(0, 40), inside = (n.children || []).slice(0, 3).map(typeLabel).join(", ");
        return row(isNode(n) && NT[n.type] ? NT[n.type].icon : "layout", n.name || typeLabel(n), n.name ? typeLabel(n) : (t ? t : inside), function () { open(n.id, inspTab === "advanced" ? "advanced" : "content"); }, e.depth);
      })));
    });
    if (PAGE.siteId) hdrAcc(box, "ecrans", "Écrans du site", function (b) {
      b.appendChild(h("p", { class: "pb-hint", text: "La largeur à partir de laquelle un écran compte comme « tablette » ou « mobile » se règle pour tout le site." }));
      b.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/site-web/sites/" + PAGE.siteId + "/responsive", target: "_blank", rel: "noopener" }, "Régler les écrans du site"));
    });
  }
  var HDR_DEVICES = [["desktop", "Ordinateur"], ["tablet", "Tablette"], ["mobile", "Mobile"]];
  function renderHeaderSettings(box) {
    if (isFooterDoc() || isTplDoc()) { renderFooterSettings(box); return; }
    var d = headerNow(), dis = !canWrite, moving = d.mode === "sticky" || d.mode === "fixed", live = d.mode !== "static";
    headerAccess(box);
    var beh = h("div");
    beh.appendChild(h("p", { class: "pb-hint", text: "Comment l'en-tête se comporte sur le site publié." }));
    var card = h("div", { class: "pb-hdr-card" });
    card.appendChild(selectField("Position", d.mode, [["static", "Ordinaire (défile avec la page)"], ["sticky", "Collé en haut pendant le défilement"], ["fixed", "Fixé en haut (reste visible, sans décalage)"], ["overlay", "Superposé au visuel d'ouverture (transparent)"]], function (v) { setHeader({ mode: v }, "mode"); }, { disabled: dis }));
    if (!live) card.appendChild(h("p", { class: "pb-hint", text: "Un en-tête ordinaire n'a ni effet de défilement ni masquage. Choisissez une autre position pour les activer." }));
    if (moving) {
      card.appendChild(h("p", { class: "pb-sub", text: "Coller sur" }));
      HDR_DEVICES.forEach(function (dv) {
        card.appendChild(checkField(dv[1], d.stickOn.indexOf(dv[0]) >= 0, function (on) {
          var next = HDR_DEVICES.map(function (x) { return x[0]; }).filter(function (k) { return k === dv[0] ? on : d.stickOn.indexOf(k) >= 0; });
          if (!next.length) { setHeader({}, "stick-last"); return; } // au moins un appareil : la case décochée revient
          setHeader({ stickOn: next }, "stickOn");
        }, { disabled: dis }));
      });
      card.appendChild(h("p", { class: "pb-hint", text: "Sur les autres appareils, l'en-tête redevient ordinaire." }));
      card.appendChild(selectField("Bord de l'écran", d.edge, [["top", "En haut"], ["bottom", "En bas (barre fixée au bas de l'écran)"]], function (v) { setHeader({ edge: v }, "edge"); }, { disabled: dis }));
      if (d.edge === "bottom") card.appendChild(numberField("Hauteur réservée dans la page (px)", d.reserve, { min: 32, max: 200, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ reserve: n }, "reserve"); }, "Place gardée à l'emplacement de l'en-tête pour que le contenu ne saute pas. Mettez la hauteur réelle de votre barre."));
      card.appendChild(numberField("Décalage depuis le haut (px)", d.offset, { min: 0, max: 200, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ offset: n }, "offset"); }, "Distance entre le haut de l'écran et l'en-tête (ex. sous une barre fixe)."));
    }
    if (live) {
      card.appendChild(selectField("Effet au défilement", d.fx, [["", "Aucun"], ["shrink", "Réduire la hauteur des rangées"], ["solid", "Passer à un fond plein"], ["both", "Réduire et fond plein"]], function (v) { setHeader({ fx: v }, "fx"); }, { disabled: dis }));
      card.appendChild(numberField("Seuil de défilement (px)", d.threshold, { min: 0, max: 1000, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ threshold: n }, "threshold"); }, "Distance parcourue par la page avant l'état « défilé » (effet, styles « Après défilement », masquage). 8 px par défaut."));
      if (d.fx === "shrink" || d.fx === "both") card.appendChild(numberField("Hauteur du logo réduit (px)", d.shrink.height, { min: 24, max: 120, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ shrink: { height: n } }, "shrink"); }, "Taille maximale du logo une fois l'en-tête réduit."));
      card.appendChild(checkField("Masquer en descendant, réapparaître en remontant", d.hideOnScroll.enabled, function (on) { setHeader({ hideOnScroll: { enabled: on, tolerance: d.hideOnScroll.tolerance } }, "hide"); }, { disabled: dis, hint: "L'en-tête reste visible quand un menu est ouvert ou que le clavier y a le focus." }));
      if (d.hideOnScroll.enabled) card.appendChild(numberField("Tolérance (px)", d.hideOnScroll.tolerance, { min: 0, max: 100, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ hideOnScroll: { enabled: true, tolerance: n } }, "tol"); }, "Mouvement minimal avant de masquer ou d'afficher : évite les à-coups."));
      card.appendChild(numberField("Niveau d'empilement (1 à 100)", d.zIndex, { min: 1, max: 100, step: 1, integer: true, disabled: dis }, function (n) { if (n === null) return false; setHeader({ zIndex: n }, "z"); }, "Plus la valeur est haute, plus l'en-tête passe au-dessus des autres éléments. 60 par défaut."));
      card.appendChild(h("p", { class: "pb-hint", text: "Pour changer l'apparence d'un élément après le défilement (fond, couleur, taille), sélectionnez-le puis choisissez l'état « Après défilement » dans l'onglet Style." }));
    }
    beh.appendChild(card);
    var modeText = { static: "Ordinaire : défile avec la page.", sticky: "Collé : reste visible en haut de l'écran pendant le défilement.", fixed: "Fixé : reste en haut de l'écran pendant tout le défilement.", overlay: "Superposé : posé sur le haut du visuel d'ouverture de chaque page." }[d.mode];
    var fxText = d.fx ? " Effet : " + ({ shrink: "hauteur réduite", solid: "fond plein", both: "hauteur réduite et fond plein" })[d.fx] + " après " + d.threshold + " px." : "";
    var hideText = d.hideOnScroll.enabled ? " Masqué en descendant." : "";
    var devText = moving && d.stickOn.length < 3 ? " Actif sur : " + HDR_DEVICES.filter(function (x) { return d.stickOn.indexOf(x[0]) >= 0; }).map(function (x) { return x[1].toLowerCase(); }).join(", ") + "." : "";
    beh.appendChild(h("p", { class: "pb-note", "data-pb-header-summary": "", text: modeText + fxText + hideText + devText }));
    hdrAcc(box, "comportement", "Comportement au défilement", function (b) { b.appendChild(beh); });
  }
  function renderPageSettings() {
    pageSettingsStale = false;
    var box = $("[data-pb-page-settings]");
    if (box.contains(document.activeElement)) return; // saisie en cours : on ne redessine pas
    box.textContent = "";
    if (isHeaderDoc() || isFooterDoc() || isTplDoc()) { renderHeaderSettings(box); return; }
    var seo = content.seo || {};
    var setC = function (k) { return function (v) { change(function () { content[k] = v; }, { key: "page:" + k, light: true }); }; };
    var setS = function (k) { return function (v) { change(function () { content.seo = Object.assign({}, content.seo); if (v === "" || v === false) delete content.seo[k]; else content.seo[k] = v; }, { key: "seo:" + k, light: true }); }; };
    box.appendChild(h("p", { class: "pb-sub", text: "Page" }));
    box.appendChild(textField("Titre de la page (onglet du navigateur)", content.title, setC("title"), { max: 120, disabled: !canWrite }));
    box.appendChild(textField("Description (aperçu de partage)", content.description, setC("description"), { multiline: true, max: 300, disabled: !canWrite }));
    if (!IS_COMPONENT) formatSection(box);
    if (!IS_COMPONENT) scrollSnapSection(box);
    if (!IS_COMPONENT && window.pbMotionTimeline) window.pbMotionTimeline.panel(box); // scènes, transitions de page / de sections, défilement fluide (Motion Studio)
    // ----- Référencement (palier 11) : mêmes données que la page publique, aperçu et analyse calculés par le moteur SEO du serveur -----
    var seoCfg = boot.seo || {};
    var seoCan = canWrite && seoCfg.canEdit;
    var scheduleSerp = function () { clearTimeout(serpTimer); serpTimer = setTimeout(refreshSerp, 450); };
    var serpTimer = null;
    var seoInput = function (k) { var f = setS(k); return function (v) { f(v); scheduleSerp(); }; };
    var seoFlag = function (k, label, hint) { return checkField(label, seo[k], function (v) { change(function () { content.seo = Object.assign({}, content.seo); if (v) content.seo[k] = true; else delete content.seo[k]; }); scheduleSerp(); }, { disabled: !seoCan, hint: hint }); };
    var counted = function (field, max, wording) {
      var input = field.querySelector("input, textarea");
      var note = h("p", { class: "pb-hint pb-count" });
      var paint = function () { var n = input.value.length; note.textContent = n + " caractères" + (n ? " — " + wording : ""); note.classList.toggle("is-warn", n > max); };
      input.addEventListener("input", paint); paint();
      field.appendChild(note);
      return field;
    };
    box.appendChild(h("p", { class: "pb-sub", text: "Référencement (SEO)" }));
    if (!seoCan) box.appendChild(h("p", { class: "pb-note is-warn", text: canWrite ? "Les réglages SEO sont en lecture seule : la permission « seo.edit » est nécessaire pour les modifier." : "Lecture seule." }));
    box.appendChild(h("p", { class: "pb-hint", text: "Ordre de priorité : réglage SEO de la page → titre et description de la page → réglages SEO du site → réglages de KOLAKISA. Les longueurs affichées sont des repères : les moteurs tronquent différemment selon l'appareil." }));
    var serp = h("div", { class: "pb-serp", "data-pb-serp": "", "aria-live": "polite" });
    box.appendChild(h("p", { class: "pb-sub", text: "Aperçu dans les résultats de recherche" }));
    box.appendChild(serp);
    box.appendChild(h("p", { class: "pb-hint", text: "Approximation visuelle : chaque moteur affiche les résultats à sa façon." }));
    box.appendChild(counted(textField("Titre SEO", seo.title, seoInput("title"), { max: 70, disabled: !seoCan, placeholder: content.title }), 60, "environ 60 caractères sont généralement visibles"));
    box.appendChild(counted(textField("Méta-description", seo.description, seoInput("description"), { multiline: true, rows: "3", max: 160, disabled: !seoCan }), 160, "environ 150 à 160 caractères sont généralement visibles"));
    box.appendChild(textField("Adresse canonique (facultative)", seo.canonical, seoInput("canonical"), { type: "url", disabled: !seoCan, placeholder: (boot.siteUrl || "https://…") + "/p/" + PAGE.slug, hint: "Vide : l'adresse de cette page. Une autre adresse indique aux moteurs que l'original est ailleurs." }));
    box.appendChild(textField("Mot-clé principal (facultatif)", seo.focusKeyword, seoInput("focusKeyword"), { max: 80, disabled: !seoCan, hint: "Sert uniquement à l'analyse. Il n'est jamais publié dans la page." }));
    box.appendChild(h("p", { class: "pb-sub", text: "Partage sur les réseaux (Open Graph, X)" }));
    box.appendChild(textField("Titre de partage", seo.ogTitle, seoInput("ogTitle"), { max: 95, disabled: !seoCan, placeholder: "Titre SEO" }));
    box.appendChild(textField("Description de partage", seo.ogDescription, seoInput("ogDescription"), { multiline: true, rows: "2", max: 200, disabled: !seoCan, placeholder: "Méta-description" }));
    box.appendChild(selectField("Carte X (Twitter)", seo.twitterCard || "", [["", "Automatique"], ["summary", "Petite image (summary)"], ["summary_large_image", "Grande image (summary_large_image)"]], function (v) { change(function () { content.seo = Object.assign({}, content.seo); if (v) content.seo.twitterCard = v; else delete content.seo.twitterCard; }); scheduleSerp(); }, { disabled: !seoCan }));
    box.appendChild(h("p", { class: "pb-hint", text: "Image de partage (médiathèque ; sinon l'image du bandeau, puis celle du site) :" }));
    box.appendChild(mediaPreview(seo.ogImage, function (m) { change(function () { content.seo = Object.assign({}, content.seo, { ogImage: m.path }); }); scheduleSerp(); }, !seoCan));
    if (seo.ogImage) box.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", disabled: !seoCan, onclick: function () { change(function () { content.seo = Object.assign({}, content.seo); delete content.seo.ogImage; }); scheduleSerp(); } }, "Retirer"));
    box.appendChild(h("p", { class: "pb-sub", text: "Indexation" }));
    box.appendChild(seoFlag("noindex", "Ne pas indexer cette page (noindex)", "La page reste accessible mais n'apparaîtra pas dans les résultats ni dans le plan du site."));
    box.appendChild(seoFlag("nofollow", "Ne pas suivre les liens de la page (nofollow)"));
    box.appendChild(seoFlag("noarchive", "Interdire la copie en cache (noarchive)"));
    box.appendChild(seoFlag("nosnippet", "Interdire les extraits (nosnippet)"));
    box.appendChild(seoFlag("noimageindex", "Ne pas indexer les images (noimageindex)"));
    // Analyse du brouillon enregistré (indications, jamais une promesse de classement)
    var result = h("div", { class: "pb-seo-result", "data-pb-seo-result": "", "aria-live": "polite" });
    var runBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: !seoCfg.canView || !seoCfg.url }, "Analyser la page");
    runBtn.addEventListener("click", function () {
      runBtn.disabled = true; result.textContent = "Analyse en cours…";
      var run = function () { api("POST", seoCfg.url, { analyse: true, title: content.title, description: content.description, seo: content.seo || {} }).then(function (r) { paintAnalysis(result, r); }).catch(function (e) { result.textContent = e.message; }).then(function () { runBtn.disabled = false; }); };
      // L'analyse lit le brouillon ENREGISTRÉ : on l'enregistre d'abord si besoin
      Promise.resolve(saveNow()).then(run, run);
    });
    box.appendChild(h("p", { class: "pb-sub", text: "Analyse SEO" }));
    box.appendChild(h("p", { class: "pb-hint", text: seoCfg.canView ? "Contrôles sur le brouillon enregistré : titre, description, structure des titres, images, liens, partage. Ce sont des indications, pas un classement." : "La permission « seo.view » est nécessaire pour l'analyse." }));
    box.appendChild(runBtn);
    box.appendChild(result);
    function refreshSerp() {
      if (!seoCfg.canView || !seoCfg.url) { serp.textContent = ""; return; }
      api("POST", seoCfg.url, { title: content.title, description: content.description, seo: content.seo || {} }).then(function (r) {
        serp.textContent = "";
        serp.appendChild(h("p", { class: "pb-serp-url", text: r.serp.url }));
        serp.appendChild(h("p", { class: "pb-serp-title", text: r.serp.title }));
        serp.appendChild(h("p", { class: "pb-serp-desc", text: r.serp.description }));
        if (!r.resolved.indexable) serp.appendChild(h("p", { class: "pb-note is-warn", text: "Cette page ne sera pas indexée (" + r.resolved.reasons.join(" ; ") + ")." }));
      }).catch(function (e) { serp.textContent = ""; serp.appendChild(h("p", { class: "pb-note is-warn", text: e.message })); });
    }
    function paintAnalysis(into, r) {
      into.textContent = "";
      into.appendChild(h("p", { class: "pb-seo-score", text: "Repère interne : " + r.score + " / 100 — " + r.summary.good + " bon(s), " + r.summary.improve + " à améliorer, " + r.summary.problem + " problème(s)." }));
      into.appendChild(h("p", { class: "pb-hint", text: r.scoreNote }));
      var labels = { good: "Bon", improve: "À améliorer", problem: "Problème" };
      r.checks.forEach(function (c) {
        into.appendChild(h("div", { class: "pb-note pb-seo-check is-" + c.status }, h("strong", { text: labels[c.status] + " · " }), c.label, c.advice ? h("span", { class: "pb-seo-advice", text: " — " + c.advice }) : null));
      });
    }
    refreshSerp();
    box.appendChild(h("p", { class: "pb-hint", text: "Adresse (/p/" + PAGE.slug + "), formulaire, étiquettes et indexation générale : dans les réglages de la page. " + (PAGE.indexable ? "Page indexable." : "Page non indexable (voir ses réglages).") }));
    // Vérifications réelles du contenu (titre principal, textes de remplacement)
    var h1 = 0, noAlt = 0;
    var firstHero = content.sections.findIndex(function (x) { return x.type === "hero" && !x.hidden; });
    if (firstHero >= 0) h1++;
    walk(function (it) { if (it.hidden) return; if (it.type === "heading" && it.props && String(it.props.level) === "1") h1++; if (it.type === "image" && it.props && !it.props.alt && !it.props.decorative) noAlt++; if (it.type === "image" && !isNode(it) && !it.alt) noAlt++; });
    box.appendChild(h("p", { class: "pb-sub", text: "Vérifications" }));
    box.appendChild(h("p", { class: "pb-note" + (h1 === 1 ? "" : " is-warn"), text: h1 === 1 ? "Un seul titre principal (H1) : correct." : h1 === 0 ? "Aucun titre principal (H1) : ajoutez un titre de niveau 1." : h1 + " titres principaux (H1) : gardez-en un seul." }));
    box.appendChild(h("p", { class: "pb-note" + (noAlt ? " is-warn" : ""), text: noAlt ? noAlt + " image(s) sans texte de remplacement." : "Toutes les images ont un texte de remplacement (ou sont décoratives)." }));
    if (!PAGE.siteId) {
      box.appendChild(h("p", { class: "pb-sub", text: "Couleurs de la page" }));
      var theme = content.theme || {};
      [["accent", "Couleur principale"], ["background", "Fond"], ["text", "Texte"]].forEach(function (c) {
        var inp = h("input", { type: "color", value: theme[c[0]] || "#000000", disabled: !canWrite, id: "pb-theme-" + c[0] });
        inp.addEventListener("change", function () { change(function () { content.theme = Object.assign({}, content.theme); content.theme[c[0]] = inp.value; }); });
        box.appendChild(h("div", { class: "pb-field pb-inline" }, h("label", { for: "pb-theme-" + c[0], text: c[1] }), inp));
      });
    } else {
      box.appendChild(h("p", { class: "pb-note", text: "Couleurs, polices, tailles de titres, boutons et espacements viennent du design system du site « " + PAGE.siteName + " » : les modifier là les applique à toutes ses pages." }));
      box.appendChild(h("div", { class: "pb-btn-stack" },
        h("a", { class: "btn btn-outline btn-sm", href: "/marketing/site-web/sites/" + PAGE.siteId + "/reglages/design-system", target: "_blank", rel: "noopener" }, "Ouvrir les styles globaux du site"),
        h("a", { class: "btn btn-outline btn-sm", href: "/marketing/site-web/sites/" + PAGE.siteId + "/constructeur-de-theme?type=footer", target: "_blank", rel: "noopener" }, "En-tête et pied de page du site")));
    }
    // CSS de la page : confiné au contenu de la page, vérifié à l'enregistrement (aucune ressource externe)
    box.appendChild(h("p", { class: "pb-sub", text: "CSS de la page" }));
    var cssIn = textField("Règles CSS (sélecteurs { déclarations })", (content.theme && content.theme.css) || "", function (v) {
      nextLabel = "CSS de la page";
      change(function () { content.theme = Object.assign({}, content.theme); if (v.trim()) content.theme.css = v.trim(); else delete content.theme.css; });
    }, { multiline: true, rows: "7", onChange: true, max: 8000, disabled: !canWrite, placeholder: ".carte-mise-en-avant { border-color: #0277b6; }\n.lp-hero h1 { letter-spacing: -.02em; }", hint: "Chaque règle ne s'applique qu'au contenu de cette page. Utilisez les classes données aux éléments (inspecteur › Avancé). Pas d'url(), d'@, de \\ ni de < >." });
    box.appendChild(cssIn);
    box.appendChild(h("a", { class: "btn btn-outline btn-sm", href: "/marketing/pages/" + PAGE.id }, "Réglages et versions de la page"));
  }

  // ---------- Médiathèque du CMS : sélecteur partagé (vidéos, audio, documents) ----------
  // Les images passent par la fenêtre ci-dessous (même médiathèque) ; le reste par le MediaPicker partagé (KWMediaPicker).
  function pickFromLibrary(opts, onPick) {
    if (!window.KWMediaPicker) { toast("La médiathèque n'est pas disponible : rechargez la page.", true); return; }
    if (editing) commitEdit();
    window.KWMediaPicker.open({ title: opts.title, type: opts.type, multiple: false, onPick: onPick });
  }
  function libraryButton(label, opts, onPick, disabled) {
    return h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: disabled, onclick: function () { pickFromLibrary(opts, onPick); } }, label);
  }

  // ---------- Médiathèque ----------
  var mediaDialog = $("[data-pb-media]");
  var mediaOpts = {}, mediaItems = [], mediaChosen = [], mediaSavedFlash = null, mediaLoadedOnce = false;
  function openMedia(opts) {
    if (editing) commitEdit();
    mediaOpts = opts || {};
    mediaChosen = [];
    $("#pb-media-title").textContent = mediaOpts.title || "Médiathèque";
    mediaDialog.showModal();
    $("[data-pb-media-q]").focus();
    loadMedia();
  }
  var mediaTimer = null;
  var mediaCount = function (n) { return n + (n > 1 ? " images" : " image"); };
  function loadMedia(keep) {
    var q = $("[data-pb-media-q]").value, src = $("[data-pb-media-src]").value;
    var grid = $("[data-pb-media-grid]");
    $("[data-pb-media-status]").textContent = "Chargement…";
    if (!mediaItems.length && !mediaLoadedOnce) { // premier affichage : emplacements neutres plutôt qu'une zone vide
      grid.setAttribute("aria-busy", "true"); grid.textContent = "";
      for (var i = 0; i < 8; i++) grid.appendChild(h("li", { class: "pb-media-skel", "aria-hidden": "true" }));
    }
    return api("GET", "/marketing/site-web/medias.json?source=" + encodeURIComponent(src) + "&q=" + encodeURIComponent(q)).then(function (r) {
      mediaItems = r.items; mediaLoadedOnce = true;
      if (keep) mediaChosen = mediaChosen.map(function (c) { return mediaItems.find(function (m) { return m.source === c.source && m.id === c.id; }) || c; });
      $("[data-pb-media-status]").textContent = r.items.length ? mediaCount(r.items.length) + (q ? " trouvée" + (r.items.length > 1 ? "s" : "") : "") : "";
      grid.setAttribute("aria-busy", "false");
      renderMediaGrid();
    }, function (err) { grid.setAttribute("aria-busy", "false"); grid.textContent = ""; $("[data-pb-media-status]").textContent = err.message; });
  }
  $("[data-pb-media-q]").addEventListener("input", function () { clearTimeout(mediaTimer); mediaTimer = setTimeout(loadMedia, 180); });
  $("[data-pb-media-src]").addEventListener("change", function () { loadMedia(); });
  $("[data-pb-media-sort]").addEventListener("change", function () { renderMediaGrid(); });
  var mediaKey = function (m) { return m.source + ":" + m.id; };
  function sortedMedia() {
    var mode = $("[data-pb-media-sort]").value, list = mediaItems.slice();
    if (mode === "az" || mode === "za") list.sort(function (a, b) { return (mode === "az" ? 1 : -1) * String(a.name).localeCompare(String(b.name), "fr", { sensitivity: "base", numeric: true }); });
    return list;
  }
  function renderMediaGrid() {
    var grid = $("[data-pb-media-grid]"), empty = $("[data-pb-media-empty]");
    grid.textContent = "";
    var list = sortedMedia(), q = $("[data-pb-media-q]").value.trim();
    empty.hidden = list.length > 0;
    if (!list.length) {
      empty.textContent = "";
      empty.appendChild(h("span", { class: "pb-media-empty-ico", "aria-hidden": "true" }, icon("image")));
      empty.appendChild(h("strong", { text: q ? "Aucune image trouvée" : "Aucune image" }));
      empty.appendChild(h("span", { text: q ? "Essayez un autre terme ou une autre bibliothèque." : "Importez votre première image pour commencer." }));
      if (!q && canWrite) empty.appendChild(h("button", { type: "button", class: "btn btn-primary btn-sm", onclick: function () { $("[data-pb-upload]").click(); } }, icon("plus"), "Importer une image"));
    }
    list.forEach(function (m) {
      var chosen = mediaChosen.some(function (x) { return mediaKey(x) === mediaKey(m); });
      var btn = h("button", { type: "button", class: "pb-media-item" + (chosen ? " is-chosen" : ""), "aria-pressed": String(chosen), title: m.name, "aria-label": (m.alt || m.name) + (m.width ? " (" + m.width + " × " + m.height + ")" : "") + (m.alt ? "" : " — texte alternatif manquant"), onclick: function () { chooseMedia(m); }, ondblclick: function () { chooseMedia(m, true); } },
        h("span", { class: "pb-media-thumb" }, h("img", { src: m.path, alt: "", loading: "lazy", decoding: "async" }), h("span", { class: "pb-media-check", "aria-hidden": "true" }, icon("check")), m.alt ? null : h("span", { class: "pb-media-flag", text: "Alt manquant" })),
        h("span", { class: "pb-media-name", text: m.name }));
      grid.appendChild(h("li", {}, btn));
    });
    renderMediaDetail();
  }
  function chooseMedia(m, confirmNow) {
    if (mediaOpts.multiple) {
      var k = mediaKey(m);
      mediaChosen = mediaChosen.some(function (x) { return mediaKey(x) === k; }) ? mediaChosen.filter(function (x) { return mediaKey(x) !== k; }) : mediaChosen.concat(m);
    } else mediaChosen = [m];
    renderMediaGrid();
    if (confirmNow && !mediaOpts.multiple && mediaOpts.onPick) finishMedia();
  }
  function finishMedia() {
    if (!mediaOpts.onPick || !mediaChosen.length) return;
    var pick = mediaOpts.onPick, chosen = mediaChosen.slice(), multiple = mediaOpts.multiple;
    mediaDialog.close();
    pick(multiple ? chosen : chosen[0]);
  }
  var fmtSize = function (b) { return !b ? "—" : b >= 1048576 ? (b / 1048576).toFixed(2).replace(".", ",") + " Mo" : Math.max(1, Math.round(b / 1024)) + " Ko"; };
  var shortPath = function (p) { return p.length > 38 ? p.slice(0, 20) + "…" + p.slice(-16) : p; };
  function mediaInfoRow(label, value, full) { return h("div", { class: "pb-media-row" }, h("dt", { text: label }), h("dd", { title: full || null }, value)); }
  function renderMediaDetail() {
    var box = $("[data-pb-media-detail]");
    box.textContent = "";
    var m = mediaChosen[mediaChosen.length - 1];
    if (!m) {
      box.appendChild(h("div", { class: "pb-media-nosel" }, h("span", { class: "pb-media-empty-ico", "aria-hidden": "true" }, icon("image")), h("strong", { text: "Sélectionnez une image" }),
        h("span", { text: mediaOpts.onPick ? "Choisissez une ressource pour afficher ses détails (double-clic pour l'insérer directement)." : "Choisissez une ressource pour afficher ses détails." })));
      return;
    }
    // Aperçu (damier discret : les transparences restent visibles) ; en cas d'échec de chargement, message et « Réessayer »
    var prev = h("div", { class: "pb-media-preview" });
    var showImg = function (bust) {
      prev.textContent = "";
      var img = h("img", { src: m.path + (bust ? (m.path.indexOf("?") < 0 ? "?" : "&") + "r=" + Date.now() : ""), alt: m.alt || "" });
      img.addEventListener("error", function () { prev.textContent = ""; prev.appendChild(h("div", { class: "pb-media-fail", role: "alert" }, h("span", { text: "Impossible de charger cette image." }), h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { showImg(true); } }, "Réessayer"))); });
      prev.appendChild(img);
    };
    showImg(false);
    box.appendChild(prev);
    var pathBtn = h("button", { type: "button", class: "pb-media-copy", "data-tip": "Copier l'adresse", "aria-label": "Copier l'adresse de l'image", onclick: function () {
      var done = function () { toast("Adresse copiée."); }, fail = function () { toast("Copie impossible : sélectionnez l'adresse à la main.", true); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.origin + m.path).then(done, fail); else fail();
    } }, icon("copy"));
    box.appendChild(h("dl", { class: "pb-media-info" },
      mediaInfoRow("Nom", h("span", { class: "pb-media-ell", text: m.name }), m.name),
      mediaInfoRow("Dimensions", m.width ? m.width + " × " + m.height + " px" : "inconnues"),
      mediaInfoRow("Poids", fmtSize(m.size)),
      mediaInfoRow("Type", m.mime || "image"),
      mediaInfoRow("Bibliothèque", m.source === "marketing" ? "Marketing" : "Site (Centre de gestion)"),
      mediaInfoRow("Adresse", h("span", { class: "pb-media-pathrow" }, h("code", { class: "pb-media-ell", text: shortPath(m.path) }), pathBtn), m.path)));
    var usageBox = h("div", { class: "pb-media-usage", "aria-live": "polite" });
    var usageList = null; // null = inconnu, [] = non utilisée
    box.appendChild(usageBox);
    if (m.source === "marketing") {
      api("GET", "/marketing/site-web/medias/" + m.id + "/usage.json").then(function (r) {
        if (mediaChosen[mediaChosen.length - 1] !== m && !usageBox.isConnected) return;
        usageList = r.items;
        if (!r.items.length) return;
        usageBox.appendChild(h("p", { class: "pb-media-usage-title", text: "Utilisée dans " + r.items.length + (r.items.length > 1 ? " contenus" : " contenu") }));
        var ul = h("ul", {});
        r.items.slice(0, 6).forEach(function (u) { ul.appendChild(h("li", {}, u.href ? h("a", { href: u.href, target: "_blank", rel: "noopener", text: u.name }) : h("span", { text: u.name }), h("small", { text: " " + u.kind }))); });
        if (r.items.length > 6) ul.appendChild(h("li", {}, h("small", { text: "… et " + (r.items.length - 6) + " autre(s)" })));
        usageBox.appendChild(ul);
      }, function () { /* information facultative : la suppression reste protégée côté serveur */ });
    }
    var actions = h("div", { class: "pb-media-actions" });
    if (m.editable && canWrite) {
      var name = textField("Nom", m.name, function () {}, { max: 120 });
      var alt = textField("Texte alternatif", m.alt, function () {}, { max: 200 });
      alt.appendChild(h("p", { class: "pb-media-help", text: m.alt ? "Lu par les lecteurs d'écran ; affiché si l'image ne charge pas." : "Manquant : décrivez l'image pour améliorer l'accessibilité." }));
      var meta = h("div", { class: "pb-media-meta" }, h("h3", { text: "Métadonnées" }), name, alt);
      box.appendChild(meta);
      var save = h("button", { type: "button", class: "btn btn-primary btn-sm", disabled: true }, "Enregistrer");
      var flashed = mediaSavedFlash === mediaKey(m); mediaSavedFlash = null;
      if (flashed) { save.textContent = "Enregistré"; setTimeout(function () { if (save.isConnected && save.textContent === "Enregistré") save.textContent = "Enregistrer"; }, 1600); }
      var nameIn = name.querySelector("input"), altIn = alt.querySelector("input");
      var dirty = function () { save.disabled = nameIn.value === m.name && altIn.value === (m.alt || ""); if (!save.disabled && save.textContent === "Enregistré") save.textContent = "Enregistrer"; };
      nameIn.addEventListener("input", dirty); altIn.addEventListener("input", dirty);
      save.addEventListener("click", function () {
        save.disabled = true; save.textContent = "Enregistrement…";
        api("POST", "/marketing/site-web/medias/" + m.id, { alt: altIn.value, name: nameIn.value }).then(function (r) { Object.assign(m, r.media); mediaSavedFlash = mediaKey(m); toast("Modifications enregistrées."); loadMedia(true); }, function (err) { save.textContent = "Enregistrer"; save.disabled = false; apiFail(err); });
      });
      var del = h("button", { type: "button", class: "btn btn-sm pb-media-del" }, icon("trash"), "Supprimer");
      del.addEventListener("click", function () { // confirmation sur place ; si le fichier est utilisé, la suppression est refusée (liste ci-dessus)
        actions.textContent = "";
        var inUse = usageList && usageList.length;
        actions.appendChild(h("div", { class: "pb-media-confirm", role: "alertdialog", "aria-label": "Confirmer la suppression" },
          h("strong", { text: "Supprimer cette image ?" }),
          h("span", { text: inUse ? "Cette image est actuellement utilisée : retirez-la d'abord des contenus listés ci-dessus." : "Cette action ne peut pas être annulée." }),
          h("div", { class: "pb-row pb-wrap" },
            h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { renderMediaDetail(); } }, "Annuler"),
            h("button", { type: "button", class: "btn btn-sm pb-media-del is-solid", disabled: Boolean(inUse), onclick: function () {
              api("POST", "/marketing/site-web/medias/" + m.id + "/supprimer", {}).then(function () { mediaChosen = []; toast("Image supprimée."); loadMedia(); }, function (err) { apiFail(err); renderMediaDetail(); });
            } }, "Supprimer définitivement"))));
        actions.querySelector(".btn-outline").focus();
      });
      actions.appendChild(save); actions.appendChild(del);
    } else if (!m.editable) box.appendChild(h("p", { class: "pb-media-help", text: "Texte alternatif et suppression : Centre de gestion → Ressources." }));
    if (mediaOpts.onPick) box.insertBefore(h("button", { type: "button", class: "btn btn-primary pb-media-insert", onclick: finishMedia }, mediaOpts.multiple ? "Insérer " + mediaChosen.length + " image(s)" : "Insérer cette image"), box.children[1]);
    if (actions.children.length) box.appendChild(actions);
  }
  function uploadFile(file) {
    if (!file) return;
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.type)) { toast("Format accepté : JPEG, PNG, GIF ou WebP.", true); return; }
    if (file.size > 5 * 1048576) { toast("Image trop lourde : 5 Mo au plus.", true); return; }
    var fd = new FormData(); fd.append("file", file);
    $("[data-pb-media-status]").textContent = "Envoi de « " + file.name + " »…";
    api("POST", "/marketing/site-web/medias", fd, true).then(function (r) {
      toast("Image envoyée : ajoutez son texte alternatif à droite.");
      $("[data-pb-media-src]").value = "all"; $("[data-pb-media-q]").value = "";
      mediaChosen = mediaOpts.multiple ? mediaChosen.concat(r.media) : [r.media];
      loadMedia(true);
    }, function (err) { $("[data-pb-media-status]").textContent = err.message; toast(err.message, true); });
  }
  $("[data-pb-upload]").addEventListener("change", function () { uploadFile(this.files[0]); this.value = ""; });
  var drop = $("[data-pb-drop]");
  drop.addEventListener("click", function () { $("[data-pb-upload]").click(); });
  drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("[data-pb-upload]").click(); } });
  ["dragenter", "dragover"].forEach(function (ev) { mediaDialog.addEventListener(ev, function (e) { if (canWrite && e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) { e.preventDefault(); drop.classList.add("is-over"); } }); });
  mediaDialog.addEventListener("dragleave", function (e) { if (!mediaDialog.contains(e.relatedTarget)) drop.classList.remove("is-over"); });
  mediaDialog.addEventListener("drop", function (e) { drop.classList.remove("is-over"); if (!canWrite) return; e.preventDefault(); if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]); });
  if (!canWrite) { $(".pb-upload").hidden = true; drop.hidden = true; }

  // ---------- Fenêtre « demande de contenu » ----------
  var askDialog = $("[data-pb-ask]");
  var askDone = null, askCancel = null;
  // fields : [nom, type (text | url | link | course | checkbox), libellé, facultatif]
  function ask(title, fields, done, cancel) {
    $("[data-pb-ask-title]").textContent = title;
    var box = $("[data-pb-ask-fields]");
    box.textContent = "";
    fields.forEach(function (f, i) {
      var id = "pb-ask-" + i;
      if (f[1] === "checkbox") { box.appendChild(h("label", { class: "pb-check" }, h("input", { type: "checkbox", id: id, name: f[0] }), " " + f[2])); return; }
      var input = f[1] === "select" ? h("select", { id: id, name: f[0] }, f[4].map(function (o) { return h("option", { value: o[0], text: o[1] }); }))
        : f[1] === "course" ? h("select", { id: id, name: f[0] }, boot.courses.map(function (c) { return h("option", { value: c.id, text: c.title }); }))
        : h("input", { id: id, name: f[0], type: f[1] === "link" ? "text" : f[1], list: f[1] === "link" ? "pb-links" : null, required: f[3] ? null : true });
      box.appendChild(h("div", { class: "pb-field" }, h("label", { for: id, text: f[2] }), input));
    });
    $("[data-pb-ask-error]").hidden = true;
    askDone = done; askCancel = cancel || null;
    askDialog.showModal();
    var first = box.querySelector("input, select"); if (first) first.focus();
  }
  $("[data-pb-ask-form]").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = {};
    $$("[data-pb-ask-fields] [name]").forEach(function (x) { v[x.name] = x.type === "checkbox" ? x.checked : x.value.trim(); });
    var cb = askDone; askDone = null; askCancel = null;
    askDialog.close();
    if (cb) cb(v);
  });
  askDialog.addEventListener("close", function () { if (askCancel) { var c = askCancel; askCancel = null; askDone = null; c(); } });
  $$("[data-pb-close]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });

  // ---------- Aperçu (fenêtre dans la page, jamais un nouvel onglet d'office) ----------
  var previewDialog = $("[data-pb-preview-dialog]");
  function openPreview() {
    if (editing) commitEdit();
    var go = function () { $("[data-pb-preview-frame]").src = IS_COMPONENT ? "/marketing/site-web/composants/" + PAGE.component.id + "/apercu?rev=" + revision + "&t=" + Date.now() : "/marketing/pages/" + PAGE.id + "/apercu?t=" + Date.now(); previewDialog.showModal(); };
    if ((dirty || saving) && !blocked) { clearTimeout(saveTimer); saveNow().then(function () { if (dirty) { toast("Aperçu non ouvert : vos dernières modifications ne sont pas enregistrées (voir le message en haut).", true); return; } go(); }); } else go();
  }
  $("[data-pb-preview]").addEventListener("click", openPreview);
  $$("[data-preview-device]").forEach(function (b) { b.addEventListener("click", function () { $$("[data-preview-device]").forEach(function (x) { x.setAttribute("aria-checked", String(x === b)); }); $("[data-pb-preview-frame]").dataset.device = b.dataset.previewDevice; }); });
  // Plein écran : le même dialogue, redimensionné (aucune reconstruction du cadre : appareil, défilement et page restent tels quels)
  var previewFullBtn = $("[data-pb-preview-full]");
  function setPreviewFull(on) {
    previewDialog.classList.toggle("is-full", on);
    previewFullBtn.setAttribute("aria-pressed", String(on));
    var label = on ? "Quitter le plein écran" : "Plein écran";
    previewFullBtn.setAttribute("aria-label", label); previewFullBtn.setAttribute("data-tip", label);
  }
  previewFullBtn.addEventListener("click", function () { setPreviewFull(!previewDialog.classList.contains("is-full")); });
  previewDialog.addEventListener("keydown", function (e) { if (e.key === "Escape" && previewDialog.classList.contains("is-full")) { e.preventDefault(); setPreviewFull(false); } }); // Échap sort d'abord du plein écran
  previewDialog.addEventListener("close", function () { $("[data-pb-preview-frame]").src = "about:blank"; setPreviewFull(false); });

  // ---------- Menu contextuel (clic droit) ----------
  var menu = $("[data-pb-menu]");
  function openMenu(x, y) {
    var items = selectedItems();
    if (!items.length) return;
    var it = items[0];
    var locked = lockedAny(items);
    var l = locate(it.id);
    var entries = [
      INLINE[it.type] && items.length === 1 ? ["Modifier le texte", function () { startEdit(it.id); }, locked, "Entrée"] : null,
      ["Dupliquer", duplicateSelected, !canWrite, "Ctrl+D"],
      ["Copier", function () { copySelected(false); }, false, "Ctrl+C"],
      ["Couper", function () { copySelected(true); }, !canWrite || locked, "Ctrl+X"],
      ["Coller", paste, !canWrite, "Ctrl+V"],
      ["Coller depuis un autre site ou navigateur", pasteFromSystem, !canWrite],
      ["Copier le style", copyStyle, false, "Ctrl+Alt+C"],
      ["Coller le style", function () { pasteStyle(); }, !canWrite || locked, "Ctrl+Maj+V"],
      ["Réinitialiser le style", resetStyle, !canWrite || locked || !items.some(function (z) { return z.styles || z.states || z.parts; })],
      "-",
      { heading: "Style" },
      PAGE.siteSettingsUrl && items.every(isNode) ? ["Appliquer un style…", openStyleLibrary, !canWrite || locked] : null,
      items.length === 1 && isNode(it) ? ["Enregistrer comme style…", function () { saveStyleOf(byId(it.id) || it); }, !canWrite || locked || !canSaveStyle(items)] : null,
      items.length === 1 && isNode(it) && stylesOf(it).length ? ["Modifier le style « " + styleTitle(styleDef(stylesOf(it)[0])) + " »…", openStyleLibrary, false] : null,
      items.length === 1 && isNode(it) && stylesOf(it).length ? ["Redéfinir « " + styleTitle(styleDef(stylesOf(it)[0])) + " » depuis cet élément…", function () { openStyleDialog(byId(it.id) || it, stylesOf(it)[0]); }, !canWrite || locked || !canSaveStyle(items)] : null,
      items.length === 1 && isNode(it) && stylesOf(it).length ? ["Dissocier du style (garde l'apparence)", function () { unlinkStyleFrom([it.id], stylesOf(it)[0], true); }, !canWrite || locked] : null,
      items.length === 1 && isNode(it) && stylesOf(it).length ? ["Retirer le style (perd son apparence)", function () { unlinkStyleFrom([it.id], stylesOf(it)[0], false); }, !canWrite || locked] : null,
      "-",
      items.length === 1 ? ["Renommer", function () { var row = treeEl.querySelector('.pb-node[data-id="' + it.id + '"] > .pb-row-item'); if (row) startRename(row, it); }, !canWrite, "F2"] : null,
      [items.some(function (z) { return z.hidden; }) ? "Afficher" : "Masquer", function () { setFlag(selection.slice(), "hidden", !items.some(function (z) { return z.hidden; })); }, !canWrite, "Ctrl+Maj+H"],
      [items.some(function (z) { return z.locked; }) ? "Déverrouiller" : "Verrouiller", function () { setFlag(selection.slice(), "locked", !items.some(function (z) { return z.locked; })); }, !canWrite, "Ctrl+Maj+L"],
      items.length > 1 ? ["Grouper", groupSelected, !canWrite || locked, "Ctrl+G"] : null,
      !IS_COMPONENT && items.every(function (x) { return x.type !== "component"; }) ? ["Enregistrer comme composant…", openSaveComponent, !canWrite] : null,
      items.length === 1 && items[0].type === "component" ? ["Détacher du composant", function () { detachInstance(items[0]); }, !canWrite] : null,
      items.length === 1 && ["group", "stack", "container"].indexOf(it.type) >= 0 ? ["Dissocier", ungroupSelected, !canWrite || locked, "Ctrl+Maj+G"] : null,
      l && l.parent ? ["Sélectionner le parent", function () { select(l.parent.id); }, false] : null,
      ["Monter", function () { nudge(-1); }, !canWrite || locked, "Alt+↑"],
      ["Descendre", function () { nudge(1); }, !canWrite || locked, "Alt+↓"],
      items.length === 1 && isNode(it) && TRANSFORMABLE[it.type] ? ["Transformer en " + (it.type === "heading" ? "paragraphe" : "titre"), function () { transformNode(it.id, it.type === "heading" ? "text" : "heading"); }, !canWrite || locked] : null,
      ["Ajouter au-dessus…", function () { openCommands("Ajouter", { before: it.id }); }, !canWrite],
      ["Ajouter en dessous…", function () { openCommands("Ajouter", { after: it.id }); }, !canWrite],
      "-",
      ["Supprimer", removeSelected, !canWrite || locked, "Suppr"],
    ].filter(Boolean);
    showMenuEntries(entries, x, y);
  }
  // Une liste d'actions dans le menu flottant (menu contextuel, menu principal, publication, historique) :
  // entrée = [libellé, action, désactivée, raccourci, classe] ou "-" (séparateur)
  var menuOpener = null; // élément qui avait le focus à l'ouverture : Échap le lui rend (le menu flottant est partagé par plusieurs boutons)
  function showMenuEntries(entries, x, y, opts) {
    opts = opts || {};
    if (menu.hidden) menuOpener = document.activeElement;
    menu.textContent = "";
    menu.classList.toggle("is-wide", Boolean(opts.wide));
    entries.forEach(function (e) {
      if (e === "-") { menu.appendChild(h("div", { class: "pb-menu-sep", role: "separator" })); return; }
      if (typeof e === "object" && e.heading) { menu.appendChild(h("p", { class: "pb-menu-heading", text: e.heading })); return; }
      menu.appendChild(h("button", { type: "button", role: "menuitem", class: "pb-menu-item" + (e[0] === "Supprimer" ? " is-danger" : "") + (e[4] ? " " + e[4] : ""), disabled: e[2] || null, tabindex: "-1", onclick: function () { closeMenu(); e[1](); } }, h("span", { text: e[0] }), e[3] ? h("kbd", { text: e[3] }) : null));
    });
    if (window.KolMotion) window.KolMotion.cancelLeave(menu);
    menu.hidden = false;
    var r = menu.getBoundingClientRect();
    menu.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px";
    menu.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
    var first = menu.querySelector(".pb-menu-item:not([disabled])"); if (first) first.focus();
  }
  function closeMenu() { if (window.KolMotion && !menu.hidden) window.KolMotion.leave(menu); menu.hidden = true; var mb = $("[data-pb-mainmenu]"); if (mb) mb.setAttribute("aria-expanded", "false"); }
  menu.addEventListener("keydown", function (e) {
    var list = $$(".pb-menu-item:not([disabled])", menu);
    var i = list.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); (list[i + 1] || list[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (list[i - 1] || list[list.length - 1]).focus(); }
    else if (e.key === "Escape" || e.key === "Tab") { e.preventDefault(); closeMenu(); if (e.key === "Escape") refocusMenuOpener(); }
  });
  // Un geste hors de l'inspecteur (poignée, glisser, barre contextuelle, menu…) agit toujours sur le widget lui-même : la partie choisie est lâchée avant
  var inInspectorFlow = ".pb-right, [data-pb-inspector], .pb-cpop, .pb-amenu, .pb-dyn-pop, .kf-panel, .pb-menu, .pb-tip, .pb-toast";
  var releasePart = function (e) { if (styleTarget && !(e.target.closest && e.target.closest(inInspectorFlow))) { styleTarget = null; renderInspector(); } };
  document.addEventListener("mousedown", releasePart, true);
  var menuWasOpenAtPress = false;
  document.addEventListener("mousedown", function (e) { menuWasOpenAtPress = !menu.hidden && Boolean(e.target.closest && e.target.closest("[data-pb-mainmenu]")); if (!menu.hidden && !menu.contains(e.target)) closeMenu(); }, true);
  // Échap ferme le menu et rend le focus à l'élément qui l'a ouvert (sinon il tombait sur <body> : l'utilisateur au clavier perdait sa place)
  function refocusMenuOpener() { var o = menuOpener; menuOpener = null; if (o && o !== document.body && o.isConnected && o.focus) o.focus(); }
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { closeMenu(); refocusMenuOpener(); } }); // Échap ferme aussi quand le focus n'est plus dans le menu
  window.addEventListener("blur", closeMenu); // clic dans l'iframe ou hors de la fenêtre

  // ---------- Palette de commandes (Ctrl/⌘ + K) ----------
  var cmdDialog = $("[data-pb-command-dialog]");
  var cmdAnchor = null, cmdIndex = 0, cmdShown = [];
  function commandList() {
    var has = selection.length > 0;
    var adds = [{ type: "layout", label: "Section libre", icon: "layout" }].concat(SPEC.types.map(function (t) { return { type: t.type, label: t.label, icon: t.icon }; })).concat(boot.types.map(function (t) { return { type: t.type, label: t.label + " (section prête)", legacy: true }; }));
    var list = canWrite ? adds.map(function (a) { return { label: "Ajouter : " + a.label, icon: a.icon, run: function () { addAt(a.type, a.legacy); } }; }) : [];
    if (canWrite) boot.blocks.forEach(function (b) { list.push({ label: "Ajouter le bloc : " + b.label, run: function () { var btn = $(".pb-block-item[data-block='" + b.key + "']"); if (btn) btn.click(); } }); });
    return list.concat([
      { label: "Ouvrir la médiathèque", run: function () { openMedia({ title: "Médiathèque" }); } },
      { label: "Aperçu", run: openPreview }, { label: "Enregistrer maintenant", run: saveNow, off: !canWrite }, { label: "Publier", run: function () { $("[data-pb-publish]").click(); }, off: !canWrite || $("[data-pb-publish]").hidden },
      { label: "Annuler", run: undo, off: !past.length }, { label: "Rétablir", run: redo, off: !future.length },
      { label: "Accordéons : un seul ouvert", run: function () { accSetMode("one"); } }, { label: "Accordéons : plusieurs ouverts", run: function () { accSetMode("many"); } }, { label: "Accordéons : fermer ceux situés en dessous", run: function () { accSetMode("below"); } },
      { label: "Dupliquer la sélection", run: duplicateSelected, off: !has || !canWrite }, { label: "Supprimer la sélection", run: removeSelected, off: !has || !canWrite },
      { label: "Enregistrer comme composant…", run: openSaveComponent, off: !selection.length || !canWrite || IS_COMPONENT },
      { label: "Détacher du composant", run: function () { var x = selection.length === 1 ? byId(selection[0]) : null; if (x && x.type === "component") detachInstance(x); }, off: !canWrite || selection.length !== 1 || (byId(selection[0]) || {}).type !== "component" },
      { label: "Grouper", run: groupSelected, off: selection.length < 2 || !canWrite }, { label: "Dissocier", run: ungroupSelected, off: !has || !canWrite },
      { label: "Masquer / afficher", run: function () { setFlag(selection.slice(), "hidden", !selectedItems().some(function (z) { return z.hidden; })); }, off: !has || !canWrite },
      { label: "Verrouiller / déverrouiller", run: function () { setFlag(selection.slice(), "locked", !selectedItems().some(function (z) { return z.locked; })); }, off: !has || !canWrite },
      { label: "Styles du site : bibliothèque", run: openStyleLibrary, off: !PAGE.siteSettingsUrl },
      { label: "Enregistrer comme style…", run: function () { saveStyleOf(selectedItems()[0]); }, off: !has || !canWrite || !canSaveStyle(selectedItems()) },
      { label: "Coller depuis un autre site ou navigateur", run: pasteFromSystem, off: !canWrite }, { label: "Copier le style", run: copyStyle, off: !has }, { label: "Réinitialiser le style", run: resetStyle, off: !has || !canWrite }, { label: "Coller le style", run: function () { pasteStyle(); }, off: !has || !canWrite },
      ].concat(STYLE_GROUPS.map(function (g) { return { label: "Coller le style : " + g[1].toLowerCase() + " seulement", run: function () { pasteStyle([g[0]]); }, off: !has || !canWrite || !(styleClipboard || store.get("style-clipboard", null)) }; })).concat([
      { label: "Sélectionner le parent", run: function () { var l = locate(selection[0]); if (l && l.parent) select(l.parent.id); }, off: !has },
      { label: "Écran : ordinateur", run: function () { setDevice("desktop"); } }, { label: "Écran : tablette", run: function () { setDevice("tablet"); } }, { label: "Écran : mobile", run: function () { setDevice("mobile"); } },
      { label: "Zoom : ajuster à l'écran", run: function () { setZoom("fit"); } }, { label: "Zoom : 100 %", run: function () { setZoom(1); } },
      { label: "Grille : afficher / masquer", run: function () { setAid("grid", !aids.grid); } },
      { label: "Guides : afficher / masquer", run: function () { setAid("guides", aids.guides === false); } },
      { label: aids.guidesLocked ? "Guides : déverrouiller" : "Guides : verrouiller", run: function () { setAid("guidesLocked", !aids.guidesLocked); } },
      { label: "Guides : tout supprimer (cet écran)", run: clearGuides, off: !(guidesFor().h.length || guidesFor().v.length) }, { label: "Contours : afficher / masquer", run: function () { setAid("outlines", !aids.outlines); } }, { label: "Règles : afficher / masquer", run: function () { setAid("rulers", !aids.rulers); } },
      { label: "Panneau des éléments : afficher / masquer", run: function () { togglePanel("left"); } },
      { label: "Vider la page : repartir d'un canevas vide (annulable)", run: function () { nextLabel = "Page vidée"; change(function () { if (!content.sections.length) return false; content.sections = []; selection = []; }); }, off: !canWrite || !content.sections.length },
      { label: "Ajouter une structure (Flexbox ou Grille)", run: function () { openStructurePicker(insertionPoint({ type: "container" })); }, off: !canWrite },
      { label: dock.mode === "floating" ? "Structure : rattacher le panneau" : "Structure : détacher le panneau", run: function () { setDockMode(dock.mode === "floating" ? "docked" : "floating"); } },
      { label: dock.mode === "closed" ? "Structure : rouvrir le panneau" : "Structure : fermer le panneau", run: function () { setDockMode(dock.mode === "closed" ? dock.last : "closed"); } },
      { label: "Calques : tout déplier", run: expandAll }, { label: "Calques : tout replier", run: collapseAll },
      { label: panels.layersCollapsed ? "Calques : déplier le panneau" : "Calques : replier le panneau", run: function () { layersToggle.click(); } }, { label: "Calques et inspecteur : afficher / masquer", run: function () { togglePanel("right"); } },
      { label: "Réglages de la page (SEO, titre)", run: function () { openTab($("#pb-tab-page")); } },
      { label: mode === "structure" ? "Mode : Visuel" : "Mode : Structure (blocs)", run: function () { setMode(mode === "structure" ? "visual" : "structure"); } },
    ])).filter(function (c) { return !c.off; });
  }
  function addAt(type, legacy) {
    var anchor = cmdAnchor; cmdAnchor = null;
    var at;
    if (anchor && anchor.inside) {
      var box = byId(anchor.inside);
      if (box && kidsOf(box)) at = { parent: box, index: kidsOf(box).length };
    } else if (anchor) {
      var l = locate(anchor.before || anchor.after);
      if (l) {
        var node = !legacy && type !== "layout";
        at = node ? (l.parent || isNode(l.item) ? { parent: l.parent, index: l.index + (anchor.after ? 1 : 0) } : { parent: null, index: sectionIndex(l.item) + (anchor.after ? 1 : 0) }) : { parent: null, index: sectionIndex(l.ancestors[0] || l.item) + (anchor.after ? 1 : 0) };
      }
    }
    if (legacy) addLegacy(type, at); else addElement(type, at);
  }
  // Catégories (déduites du début du libellé, sans rien renommer), icônes, raccourcis et synonymes : de simples tables à côté de la liste
  var CMD_CATS = ["Créer", "Édition", "Page", "Affichage", "Interface"];
  function cmdCategory(l) {
    if (/^Ajouter/.test(l)) return "Créer";
    if (/^(Dupliquer|Supprimer|Grouper|Dissocier|Masquer|Verrouiller|Copier|Coller|Réinitialiser|Sélectionner|Annuler|Rétablir|Vider)/.test(l)) return "Édition";
    if (/^(Écran|Zoom|Grille|Guides|Contours|Règles)/.test(l)) return "Affichage";
    if (/^(Structure|Calques|Panneau|Mode)/.test(l)) return "Interface";
    return "Page";
  }
  var CMD_ICONS = [[/^Ouvrir la médiathèque/, "image"], [/^Aperçu/, "eye"], [/^Enregistrer/, "check"], [/^Publier/, "upload"], [/^Annuler/, "undo"], [/^Rétablir/, "redo"], [/^Dupliquer/, "copy"], [/^(Supprimer|Vider)/, "trash"], [/^(Grouper|Dissocier)/, "layers"], [/^Masquer/, "eyeOff"], [/^Verrouiller/, "lock"], [/style/, "palette"], [/^Sélectionner le parent/, "arrowUp"], [/^Écran : ordinateur/, "monitor"], [/^Écran : tablette/, "tablet"], [/^Écran : mobile/, "smartphone"], [/^Zoom/, "maximize"], [/^(Grille|Guides|Contours|Règles)/, "borderBox"], [/^(Structure|Calques|Panneau)/, "layers"], [/^Réglages/, "sliders"], [/^Mode/, "edit"], [/^Ajouter une structure/, "layout"], [/^Ajouter le bloc/, "listPlus"]];
  var CMD_KEYS = [[/^Enregistrer/, "Ctrl+S"], [/^Annuler$/, "Ctrl+Z"], [/^Rétablir$/, "Ctrl+Maj+Z"], [/^Dupliquer/, "Ctrl+D"], [/^Supprimer la sélection/, "Suppr"], [/^Grouper$/, "Ctrl+G"], [/^Dissocier$/, "Ctrl+Maj+G"], [/^Masquer/, "Ctrl+Maj+H"], [/^Verrouiller/, "Ctrl+Maj+L"], [/^Copier le style/, "Ctrl+Alt+C"], [/^Coller le style$/, "Ctrl+Alt+V"], [/^Zoom : ajuster/, "Maj+1"], [/^Structure : (rouvrir|fermer)/, "Ctrl+Maj+Y"], [/^Mode :/, "Ctrl+Maj+E"]];
  var CMD_ALIASES = [[/^Ajouter : Conteneur/, "container"], [/^Ajouter : Section/, "section"], [/^Ajouter : Colonne/, "columns column"], [/^Ajouter : Titre/, "heading title"], [/^Ajouter : Texte/, "text paragraph"], [/^Ajouter : Image/, "picture photo"], [/^Ajouter : Bouton/, "button"], [/^Ajouter : Vid/, "video"], [/^Supprimer/, "delete remove"], [/^Dupliquer/, "duplicate copy clone"], [/^Masquer/, "hide show"], [/^Verrouiller/, "lock unlock"], [/^Aperçu/, "preview"], [/^Enregistrer/, "save"], [/^Publier/, "publish"], [/^Annuler/, "undo"], [/^Rétablir/, "redo"], [/^Écran/, "responsive device"], [/^Zoom/, "scale"], [/^Grouper/, "group"]];
  var cmdMac = /Mac|iPhone|iPad/.test(navigator.platform || "");
  var CMD_MAX = 80, CMD_RECENT = 4;
  function cmdLookup(table, label) { for (var i = 0; i < table.length; i++) if (table[i][0].test(label)) return table[i][1]; return ""; }
  function cmdKbd(label) {
    var k = cmdLookup(CMD_KEYS, label);
    return k && cmdMac ? k.replace(/Ctrl\+?/, "⌘").replace(/Alt\+?/, "⌥").replace(/Maj\+?/, "⇧").replace(/Suppr/, "⌫") : k;
  }
  var cmdRows = [];
  function openCommands(prefill, anchor) {
    if (editing) commitEdit();
    cmdAnchor = anchor || null;
    var q = $("[data-pb-cmd-q]");
    q.value = prefill || "";
    cmdIndex = 0;
    if (!cmdDialog.open) cmdDialog.showModal();
    renderCommands();
    q.focus();
  }
  function cmdRow(c, i) {
    var kbd = cmdKbd(c.label);
    return h("li", { role: "option", id: "pb-cmd-" + i, "aria-selected": "false", class: "pb-cmd-item", onclick: function () { runCommand(i); } },
      h("span", { class: "pb-cmd-ico", "aria-hidden": "true" }, c.icon || cmdLookup(CMD_ICONS, c.label) ? icon(c.icon || cmdLookup(CMD_ICONS, c.label)) : null),
      h("span", { class: "pb-cmd-label", text: c.label }), kbd ? h("kbd", { class: "pb-cmd-kbd", text: kbd }) : null);
  }
  // Reconstruit la liste (frappe seulement) : favoris et récentes en tête quand la recherche est vide, puis les catégories
  function renderCommands() {
    var words = norm($("[data-pb-cmd-q]").value).split(/\s+/).filter(Boolean);
    var pool = commandList().filter(function (c) { var t = norm(c.label + " " + cmdLookup(CMD_ALIASES, c.label)); return words.every(function (w) { return t.indexOf(w) >= 0; }); });
    if (words.length) pool = pool.slice(0, CMD_MAX); // sans recherche, tout est listé par catégorie (les 80 premiers seraient tous des « Ajouter »)
    var groups = [], favs = store.get("cmd-fav", []);
    function take(title, list) { if (!list.length) return; groups.push([title, list]); pool = pool.filter(function (c) { return list.indexOf(c) < 0; }); }
    take("Favoris", pool.filter(function (c) { return favs.indexOf(c.label) >= 0; }));
    if (!words.length) take("Récentes", store.get("cmd-recent", []).map(function (l) { return pool.filter(function (c) { return c.label === l; })[0]; }).filter(Boolean));
    CMD_CATS.forEach(function (cat) { take(cat, pool.filter(function (c) { return cmdCategory(c.label) === cat; })); });
    var ul = $("[data-pb-cmd-list]");
    ul.textContent = "";
    cmdShown = []; cmdRows = [];
    groups.forEach(function (g) {
      ul.appendChild(h("li", { class: "pb-cmd-cat", role: "presentation", text: g[0] }));
      g[1].forEach(function (c) { var li = cmdRow(c, cmdShown.length); cmdShown.push(c); cmdRows.push(li); ul.appendChild(li); });
    });
    if (!cmdShown.length) ul.appendChild(h("li", { class: "pb-cmd-empty", role: "presentation" }, h("strong", { text: "Aucune commande trouvée" }), h("span", { text: "Essayez un autre terme." })));
    cmdIndex = Math.min(cmdIndex, Math.max(0, cmdShown.length - 1));
    setCmdActive(cmdIndex, true);
  }
  // Déplacer la sélection ne touche que deux lignes (pas de reconstruction, donc pas de scintillement)
  function setCmdActive(i, top) {
    var prev = $(".pb-cmd-list .is-active"); if (prev) { prev.classList.remove("is-active"); prev.setAttribute("aria-selected", "false"); }
    cmdIndex = i;
    var el = cmdRows[i], q = $("[data-pb-cmd-q]");
    q.setAttribute("aria-activedescendant", el ? el.id : "");
    if (!el) return;
    el.classList.add("is-active"); el.setAttribute("aria-selected", "true");
    if (top && i === 0) $("[data-pb-cmd-list]").scrollTop = 0; else scrollInside(el);
  }
  function runCommand(i) {
    var c = cmdShown[i]; if (!c) return;
    store.set("cmd-recent", [c.label].concat(store.get("cmd-recent", []).filter(function (l) { return l !== c.label; })).slice(0, CMD_RECENT));
    var anchor = cmdAnchor; cmdDialog.close(); cmdAnchor = anchor; c.run(); cmdAnchor = null;
  }
  $("[data-pb-cmd-q]").addEventListener("input", function () { cmdIndex = 0; renderCommands(); });
  $("[data-pb-cmd-q]").addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); if (cmdShown.length) setCmdActive((cmdIndex + 1) % cmdShown.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); if (cmdShown.length) setCmdActive((cmdIndex - 1 + cmdShown.length) % cmdShown.length); }
    else if (e.key === "Enter") { e.preventDefault(); runCommand(cmdIndex); }
    else if ((e.ctrlKey || e.metaKey) && (e.key || "").toLowerCase() === "k") { e.preventDefault(); e.stopPropagation(); cmdDialog.close(); } // le raccourci d'ouverture ferme aussi (l'écouteur global se tait quand une fenêtre est ouverte)
  });
  // Clic sur le fond : la cible est le <dialog> lui-même (son contenu le remplit entièrement) ; on exige aussi que l'appui ait commencé sur le fond
  var cmdPressedBackdrop = false;
  cmdDialog.addEventListener("mousedown", function (e) { cmdPressedBackdrop = e.target === cmdDialog; });
  cmdDialog.addEventListener("click", function (e) { if (e.target === cmdDialog && cmdPressedBackdrop) cmdDialog.close(); cmdPressedBackdrop = false; });
  $("[data-pb-command]").addEventListener("click", function () { openCommands(""); });

  // ---------- Sauvegarde automatique ----------
  var retry = 0;
  var saveEl = $("[data-pb-save]");
  // Texte court : la largeur de l'en-tête ne doit pas dépendre de l'état d'enregistrement (un texte plus long que « Enregistré à 14:03 » faisait passer
  // l'en-tête sur une ligne de plus à certaines largeurs : tout le canevas descendait de 46 px à chaque modification, puis remontait)
  function setSave(text, cls, full) { saveEl.textContent = text; saveEl.title = full || text; saveEl.className = "pb-save" + (cls ? " " + cls : ""); }
  function scheduleSave() {
    if (!canWrite) return;
    dirty = true;
    if (!blocked) setSave("Non enregistré", "is-dirty", "Modifications non enregistrées");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 1000);
    backup();
  }
  // Réglages que le serveur a écartés (inapplicables à une partie) : l'éditeur les retire de SON document, sans nouvelle étape d'historique, et prévient une fois
  function healIgnored(list) {
    var seen = {};
    list.forEach(function (w) {
      if (w.kind === "scene_target" && window.pbMotionTimeline) window.pbMotionTimeline.heal(w); // scène qui visait un élément supprimé : pas retiré
      var it = w.nodeId && byId(w.nodeId), p = it && it.parts && it.parts[w.part];
      if (it && w.kind === "interaction_target" && it.interactions) {
        var keep = it.interactions.filter(function (x) { return x.target !== w.target; });
        if (keep.length) it.interactions = keep; else delete it.interactions;
      }
      if (p) {
        if (w.kind === "part_prop") { var bag = (p.styles && p.styles[w.scope]) || (p.states && p.states[w.scope]); if (bag) delete bag[w.prop]; }
        if (w.kind === "part_state" && p.states) delete p.states[w.state];
        cleanStyles(it);
        if (!Object.keys(p).length) delete it.parts[w.part];
      }
      seen[w.message] = true;
    });
    var msgs = Object.keys(seen);
    toast(msgs[0] + (msgs.length > 1 ? " (+" + (msgs.length - 1) + " autre" + (msgs.length > 2 ? "s" : "") + ")" : ""), false);
    renderInspector(); scheduleRender(true);
  }
  function backup() { try { localStorage.setItem("pb-backup-" + PAGE.id, JSON.stringify({ at: Date.now(), revision: revision, content: payload() })); } catch (e) { /* stockage indisponible */ } }
  var aiHold = false; // aperçu d'une proposition de l'IA : rien n'est enregistré tant qu'elle n'est pas appliquée
  // explicit : enregistrement demandé (bouton, Ctrl/⌘ + S, publication, changement de page) ; l'enregistrement automatique
  // ne déplace pas la référence des icônes de réinitialisation, sinon elles disparaîtraient après une seconde
  function save(explicit) {
    explicit = explicit === true;
    if (!dirty || blocked || aiHold) return Promise.resolve();
    if (saving) { clearTimeout(saveTimer); saveTimer = setTimeout(save, 500); return Promise.resolve(); }
    saving = true;
    dirty = false;
    setSave("Enregistrement…");
    // Ce qui part au serveur : c'est CET état (et pas celui, plus récent, de l'écran à l'arrivée de la réponse) qui devient la référence
    var sentJson = explicit ? JSON.stringify(content.sections) : null;
    inflight = api("PUT", BASE + "/brouillon", { content: payload(), revision: revision }).then(function (r) {
      saving = false; retry = 0; revision = r.revision; hasDraft = true;
      // Composant ordinaire : le serveur garde une copie de travail non diffusée → « Modifications non diffusées » et le bouton « Mettre à jour » apparaissent tout de suite
      if (IS_COMPONENT && PAGE.component && r.draft !== undefined) PAGE.component.hasDraft = Boolean(r.draft);
      if (r.warnings && r.warnings.length) healIgnored(r.warnings);
      if (sentJson !== null) commitSaved(sentJson);
      updateStatus();
      if (!dirty) { setSave("Enregistré à " + new Date(r.savedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), "is-ok"); try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } }
    }, function (err) {
      saving = false; dirty = true; backup();
      if (err.status === 409) { blocked = true; setSave("Non enregistré : " + (IS_COMPONENT ? "composant modifié" : "page modifiée") + " ailleurs", "is-error"); toast(err.message + " Une copie de votre travail est gardée dans ce navigateur.", true); return; }
      if (err.status === 422) { setSave("Non enregistré : " + err.message, "is-error"); errorItemId = itemFromError(err.message); markError(); return; }
      if (err.status === 403) { blocked = true; setSave("Non enregistré : droits insuffisants", "is-error"); return; }
      retry = Math.min(retry + 1, 5);
      // Session expirée : le message dit quoi faire (le travail est gardé dans ce navigateur, les essais reprennent seuls une fois reconnecté)
      setSave(err.status === 401 ? "Session expirée : reconnectez-vous (dans un autre onglet). Nouvel essai dans " + (retry * 5) + " s" : "Erreur d'enregistrement : nouvel essai dans " + (retry * 5) + " s", "is-error", err.status === 401 ? "Votre session a expiré : le travail non enregistré est gardé dans ce navigateur. Connectez-vous dans un autre onglet : l'enregistrement reprendra tout seul." : null);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(save, retry * 5000);
    }).then(function () { inflight = null; });
    return inflight;
  }
  function saveNow() { if (editing) commitEdit(); clearTimeout(saveTimer); if (saving && inflight) return inflight.then(function () { return saveNow(); }); if (!dirty) { setSave("Tout est enregistré", "is-ok"); if (!saving && !blocked) commitSaved(); return Promise.resolve(); } return save(true); }
  $("[data-pb-save-now]").addEventListener("click", saveNow);
  if (!canWrite) $("[data-pb-save-now]").hidden = true;
  window.addEventListener("beforeunload", function (e) { if (editing) commitEdit(); if (dirty || saving) { backup(); e.preventDefault(); e.returnValue = ""; } });

  // ---------- Statut, publication ----------
  function updateStatus() {
    var el = $("[data-pb-status]");
    // Composant (en-tête, pied de page, variante, composant ordinaire) : copie de travail enregistrée ; seule « Mettre à jour » change ce que voient les visiteurs
    if (IS_COMPONENT) {
      var cm = PAGE.component || {};
      var pubBtn = $("[data-pb-publish]");
      var part = cm.role === "header" || cm.role === "footer" || cm.role === "variant";
      var what = cm.role === "footer" ? "Pied de page" : cm.role === "variant" ? "Variante d'en-tête" : cm.role === "header" ? "En-tête" : "";
      el.textContent = cm.hasDraft ? (what ? what + " : brouillon non publié" : "Modifications non diffusées") : (what ? what + " : publié, à jour" : "À jour");
      el.classList.toggle("is-live", !cm.hasDraft);
      if (pubBtn) { pubBtn.hidden = !canWrite || !cm.hasDraft; pubBtn.textContent = part ? "Mettre à jour" : cm.kind === "global" ? "Mettre à jour…" : "Mettre à jour le modèle"; }
      var pv = $("[data-pb-preview]"); if (pv) pv.style.display = "";
      var tab = $("#pb-tab-page"); if (tab) { var isHdr = isHeaderDoc(), isFtr = isFooterDoc(), isTpl = isTplDoc(); tab.style.display = isHdr || isFtr || isTpl ? "" : "none"; var tabText = isFtr ? "Pied de page" : isTpl ? TPL_TABS[partType()] : "En-tête"; if ((isHdr || isFtr || isTpl) && tab.textContent !== tabText) tab.textContent = tabText; }
      return;
    }
    var tplTab = $("#pb-tab-page"); if (tplTab && isTplDoc() && tplTab.textContent !== TPL_TABS[partType()]) tplTab.textContent = TPL_TABS[partType()];
    var live = status === "published";
    el.textContent = live ? (hasDraft ? "En ligne · modifications non publiées" : "En ligne") : status === "unpublished" ? "Hors ligne" : "Brouillon";
    el.classList.toggle("is-live", live && !hasDraft);
    var pub = $("[data-pb-publish]");
    pub.hidden = !canWrite || (live && !hasDraft) || Boolean(PAGE.abTest);
    // Sans le droit de publier : le bouton devient « Demander la validation » (un éditeur relit puis publie)
    pub.textContent = !boot.canPublish !== false ? (REVIEW ? "Validation demandée" : "Demander la validation") : live ? "Publier les modifications" : "Publier";
    pub.disabled = Boolean(!boot.canPublish !== false && REVIEW);
    if (REVIEW && !boot.canPublish !== false) pub.setAttribute("data-tip", "Demande envoyée le " + String(REVIEW.requested_at).slice(0, 16).replace("T", " ") + " : un éditeur doit relire et publier.");
    if (REVIEW && boot.canPublish !== false) el.textContent += " · validation demandée" + (REVIEW.by_name ? " par " + REVIEW.by_name : "");
    if (PAGE.abTest) el.textContent = "Version B d'un test A/B";
  }
  // Éditeur d'un composant ordinaire : « Mettre à jour » diffuse le brouillon. Global → aperçu des pages touchées avant propagation ; standard → seul le modèle change.
  function publishComponentUpdate(btn) {
    var cm = PAGE.component, pid = null;
    clearTimeout(saveTimer);
    btn.disabled = true;
    // Même garantie que la publication d'une page (palier 7) : on attend la fin de l'enregistrement en cours, puis on diffuse la version confirmée par le serveur
    saveNow().then(function () {
      if (dirty || blocked || saving) { toast("Enregistrez d'abord vos modifications (voir le message en haut).", true); return; }
      return api("GET", "/marketing/site-web/composants/" + cm.id + "/instances.json").then(function (r) {
        var isPart = cm.role === "header" || cm.role === "footer" || cm.role === "variant";
        var apply = function () {
          return api("POST", "/marketing/site-web/composants/" + cm.id + "/mettre-a-jour", { revision: revision }).then(function (res) {
            cm.hasDraft = false; cm.version = res.component.version; if (res.component.revision !== undefined) revision = res.component.revision; updateStatus();
            if (isPart) { toast((cm.role === "footer" ? "Pied de page" : cm.role === "variant" ? "Variante d'en-tête" : "En-tête") + " mis à jour (version " + res.component.version + ") : les visiteurs voient maintenant cette version."); return true; }
            toast(cm.kind === "global" ? (r.instances ? "Composant mis à jour : " + plural(r.instances, "instance liée a reçu", "instances liées ont reçu") + " la nouvelle version." : "Composant mis à jour (aucune instance liée pour l'instant).") : "Modèle mis à jour : les futures insertions utiliseront cette version ; les copies déjà insérées ne changent pas.");
            return true;
          });
        };
        if (isPart || cm.kind !== "global" || !r.instances) return apply();
        compDialog({ title: "Mettre à jour le composant global", confirmLabel: "Mettre à jour", build: function (body) {
          body.appendChild(h("p", { text: "Cette mise à jour sera appliquée à " + plural(r.instances, "instance liée", "instances liées") + ", dans " + plural(r.pages.length, "page", "pages") + " :" }));
          body.appendChild(h("ul", { class: "pb-comp-pages" }, r.pages.map(function (p) { return h("li", {}, h("span", { text: p.name }), h("span", { class: "pb-hint", text: " · " + plural(p.count, "instance", "instances") + (p.status === "published" ? " · en ligne" : "") })); })));
          body.appendChild(h("p", { class: "pb-hint", text: "Les blocs détachés du composant ne sont pas modifiés. Tout est appliqué en une seule fois." }));
        }, onConfirm: apply });
      });
    }).then(function () { btn.disabled = false; }, function (e) { btn.disabled = false; apiFail(e); });
  }
  $("[data-pb-publish]").addEventListener("click", function () {
    var btn = this;
    if (IS_COMPONENT) { if (PAGE.component) publishComponentUpdate(btn); return; }
    if (!boot.canPublish !== false) {
      btn.disabled = true;
      saveNow().then(function () {
        if (dirty || blocked || saving) { btn.disabled = false; toast("Enregistrez d'abord vos modifications (voir le message en haut).", true); return; }
        return api("POST", "/marketing/pages/" + PAGE.id + "/demander-validation.json", {}).then(function (r) { REVIEW = r.review; updateStatus(); toast("Validation demandée : un éditeur pourra relire et publier cette page."); }, apiFail);
      }).then(function () { updateStatus(); });
      return;
    }
    if (window.pbQuality) window.pbQuality.beforePublish();
    if (editing) commitEdit();
    btn.disabled = true;
    clearTimeout(saveTimer);
    saveNow().then(function () {
      if (dirty || blocked || saving) { btn.disabled = false; toast("Enregistrez d'abord vos modifications (voir le message en haut).", true); return; }
      return api("POST", "/marketing/pages/" + PAGE.id + "/publier.json", {}).then(function (r) {
        status = "published"; hasDraft = false; revision = r.revision;
        if (!saving) commitSaved();
        updateStatus();
        toast("Page en ligne (version " + r.version + ") : " + r.url);
      }, apiFail);
    }).then(function () { btn.disabled = false; });
  });
  $("[data-pb-undo]").addEventListener("click", undo);
  $("[data-pb-redo]").addEventListener("click", redo);
  $("[data-pb-history]").addEventListener("click", function () { openHistory(this); });

  // ---------- Menu principal et menu de publication ----------
  function exportPage() { saveNow().then(function () { window.location.href = "/marketing/pages/" + PAGE.id + "/exporter"; }); }
  function importPage() { var f = $("[data-pb-import-file]"); f.value = ""; f.click(); }
  $("[data-pb-import-file]").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast("Fichier trop lourd (2 Mo au plus).", true); return; }
    file.text().then(function (text) {
      var data; try { data = JSON.parse(text); } catch (e) { toast("Ce fichier n'est pas un export de page KOLAKISA (JSON illisible).", true); return; }
      return api("POST", "/marketing/pages/importer.json", { data: data, siteId: PAGE.siteId || null }).then(function (r) {
        toast("Page « " + r.page.name + " » importée (nouvelle page, en brouillon). Ouverture…");
        setTimeout(function () { window.location.href = r.url; }, 700);
      }, apiFail);
    });
  });
  function saveAsTemplate() {
    ask("Enregistrer comme modèle de page", [["name", "text", "Nom du modèle"], ["category", "text", "Catégorie (facultative)", true], ["description", "text", "Description (facultative)", true]], function (v) {
      return saveNow().then(function () { return api("POST", "/marketing/site-web/modeles", { name: v.name, category: v.category, description: v.description, content: payload(), siteId: PAGE.siteId || null }); }).then(function (r) {
        toast("Modèle « " + r.template.name + " » enregistré : il est proposé dans « Nouvelle page ».");
      }, apiFail);
    });
  }
  // Pont avec le panneau « Réglages du site » (public/js/site-settings.js) : mêmes notifications, et le canevas est
  // redessiné par le même rendu serveur (donc avec les mêmes réglages que la page publiée) après chaque enregistrement
  window.KWNumeric = { create: numericControl };
  window.KWEditor = { siteId: PAGE.siteId || null, canWrite: canWrite, customColors: PAGE.customColors || [], toast: toast, pickImage: function (cb) { openMedia({ title: "Choisir une image", onPick: function (m) { cb(m.path, m.alt || ""); } }); }, rerender: function () { renderCanvas(); } };
  $("[data-pb-mainmenu]").addEventListener("click", function () {
    if (menuWasOpenAtPress) { menuWasOpenAtPress = false; return; } // bascule : le menu était ouvert, le mousedown vient de le fermer
    this.setAttribute("aria-expanded", "true");
    var r = this.getBoundingClientRect();
    if (IS_COMPONENT) {
      showMenuEntries([
        { heading: "Composant du site" },
        ["Retour à la fiche du site", function () { saveNow().then(function () { window.location.href = $(".pb-back").getAttribute("href"); }); }],
        "-",
        ["Abandonner les modifications non publiées", function () {
          if (!(PAGE.component && PAGE.component.hasDraft)) { toast("Aucune modification non publiée."); return; }
          saveNow().then(function () { return api("POST", "/marketing/site-web/composants/" + PAGE.component.id + "/abandonner", { revision: revision }); }).then(function () { window.location.reload(); }, apiFail);
        }, !canWrite],
        "-",
        ["Historique des actions", function () { openHistory($("[data-pb-history]")); }],
        ["Raccourcis clavier", function () { $("[data-pb-shortcuts]").showModal(); }],
        ["Toutes les commandes…", function () { openCommands(""); }, false, "Ctrl+K"],
      ], r.left, r.bottom + 4, { wide: true });
      return;
    }
    showMenuEntries([
      { heading: "Site" },
      [PAGE.siteId ? "Réglages du site (couleurs, polices…)" : "Réglages du site (cette page n'a pas de site)", function () { if (window.KWSiteSettings) window.KWSiteSettings.open(); }, !PAGE.siteId, ""],
      "-",
      { heading: "Page" },
      ["Réglages de la page (titre, SEO, CSS)", function () { openTab($("#pb-tab-page")); }],
      ["Réglages du menu de navigation", function () { window.pbNav.open(); }],
      ["Versions, comparaison et restauration", function () { window.location.href = "/marketing/pages/" + PAGE.id + "#lp-versions"; }],
      ["Historique des actions", function () { openHistory($("[data-pb-history]")); }],
      "-",
      { heading: "Comportement des accordéons" },
      accEntry("one"), accEntry("many"), accEntry("below"),
      "-",
      { heading: "Modèles et fichiers" },
      ["Enregistrer comme modèle de page…", saveAsTemplate, !canWrite],
      ["Exporter la page (fichier JSON)", exportPage],
      ["Importer une page (nouvelle page)…", importPage, !canWrite],
      "-",
      [mode === "structure" ? "Passer à l'éditeur visuel" : "Passer à l'éditeur en blocs", function () { setMode(mode === "structure" ? "visual" : "structure"); }, false, "Ctrl+Maj+E"],
      ["Raccourcis clavier", function () { $("[data-pb-shortcuts]").showModal(); }],
      ["Toutes les commandes…", function () { openCommands(""); }, false, "Ctrl+K"],
      "-",
      ["Retour à la liste des pages", function () { saveNow().then(function () { window.location.href = "/marketing/pages"; }); }],
    ], r.left, r.bottom + 4, { wide: true });
  });
  $("[data-pb-publish-menu]").addEventListener("click", function () {
    var r = this.getBoundingClientRect();
    var live = status === "published";
    showMenuEntries([
      [live && hasDraft ? "Publier les modifications" : live ? "Déjà en ligne (rien à publier)" : "Publier", function () { $("[data-pb-publish]").click(); }, !canWrite || (live && !hasDraft) || Boolean(PAGE.abTest)],
      ["Aperçu (ordinateur, tablette, mobile)", openPreview],
      ["Voir la page en ligne", function () { window.open("/p/" + PAGE.slug, "_blank", "noopener"); }, !live],
      "-",
      ["Dépublier (mettre hors ligne)", function () {
        if (!window.confirm("Mettre la page hors ligne ? Son adresse affichera « page indisponible ». Le contenu est gardé.")) return;
        api("POST", "/marketing/pages/" + PAGE.id + "/depublier.json", {}).then(function (rr) { status = "unpublished"; revision = rr.revision; updateStatus(); toast("Page hors ligne."); }, apiFail);
      }, !canWrite || !live, "", "is-danger"],
    ], Math.max(8, r.right - 280), r.bottom + 4, { wide: true });
  });

  // ---------- Recherche dans les calques ----------
  var treeQuery = "";
  $("[data-pb-layers-q]").addEventListener("input", function () { treeQuery = norm(this.value); renderTree(); });

  // ---------- Raccourcis clavier ----------
  function onKey(e) {
    var t = e.target;
    var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    var mod = e.metaKey || e.ctrlKey;
    var k = (e.key || "").toLowerCase();
    if (!typing && styleTarget) styleTarget = null; // touches de l'éditeur (déplacements…) : sur le widget, jamais sur une partie
    if (mod && k === "s") { e.preventDefault(); saveNow(); return; }
    if (homeOpen) return; // accueil ouvert : aucun raccourci du canevas (Suppr, coller…) ne doit agir sur la page cachée dessous
    if (mod && e.shiftKey && k === "y") { e.preventDefault(); setDockMode(dock.mode === "closed" ? dock.last : "closed"); return; }
    if (mod && k === "k") { e.preventDefault(); if (cmdDialog.open) cmdDialog.close(); else openCommands(""); return; }
    if (mod && e.shiftKey && k === "e") { e.preventDefault(); setMode(mode === "structure" ? "visual" : "structure"); return; }
    if (typing || editing) return;
    if (mod && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
    if (mod && k === "y") { e.preventDefault(); redo(); return; }
    if (mod && (k === "=" || k === "+")) { e.preventDefault(); setZoom(Math.round((zoom + 0.1) * 10) / 10); return; }
    if (mod && k === "-") { e.preventDefault(); setZoom(Math.round((zoom - 0.1) * 10) / 10); return; }
    if (mod && k === "0") { e.preventDefault(); setZoom(1); return; }
    if (e.shiftKey && (e.code === "Digit1" || k === "!")) { e.preventDefault(); setZoom("fit"); return; }
    if (mod && k === "a") { e.preventDefault(); var l0 = selection.length ? locate(selection[0]) : null; selection = (l0 ? l0.list : content.sections).map(function (s) { return s.id; }); markTreeSelection(); renderInspector(); renderContext(); markCanvasSelection(false); return; }
    if (mod && e.altKey && (k === "c" || e.code === "KeyC")) { e.preventDefault(); copyStyle(); return; }
    if (mod && e.altKey && (k === "v" || e.code === "KeyV")) { e.preventDefault(); pasteStyle(); return; }
    if (mod && k === "c") { e.preventDefault(); copySelected(false); return; }
    if (k === "escape") { if (selectedGuide) { selectedGuide = null; drawGuides(); return; } if (selection.length) select(null); return; }
    if ((k === "delete" || k === "backspace") && selectedGuide) { e.preventDefault(); removeSelectedGuide(); return; }
    if (!mod && !e.altKey && !e.shiftKey && k === "r") { e.preventDefault(); setAid("rulers", !aids.rulers); return; }
    // Aides de conception : Maj + R guides, Maj + G grille, Maj + M magnétisme (rien d'autre n'utilise ces combinaisons)
    if (!mod && !e.altKey && e.shiftKey && k === "r") { e.preventDefault(); setAid("guides", aids.guides === false); return; }
    if (!mod && !e.altKey && e.shiftKey && k === "g") { e.preventDefault(); setAid("grid", !aids.grid); return; }
    if (!mod && !e.altKey && e.shiftKey && k === "m") { e.preventDefault(); setAid("snap", !aids.snap); toast(aids.snap ? "Magnétisme activé." : "Magnétisme désactivé : mouvement libre."); return; }
    if (!canWrite) return;
    if (mod && k === "x") { e.preventDefault(); copySelected(true); return; }
    if (mod && e.shiftKey && !e.altKey && k === "v") { e.preventDefault(); pasteStyle(); return; } // coller le style (même raccourci qu'Elementor, documenté)
    if (mod && k === "v") { e.preventDefault(); paste(); return; }
    if (mod && k === "d") { e.preventDefault(); duplicateSelected(); return; }
    if (mod && k === "g") { e.preventDefault(); if (e.shiftKey) ungroupSelected(); else groupSelected(); return; }
    if (mod && e.shiftKey && k === "h") { e.preventDefault(); setFlag(selection.slice(), "hidden", !selectedItems().some(function (z) { return z.hidden; })); return; }
    if (mod && e.shiftKey && k === "l") { e.preventDefault(); setFlag(selection.slice(), "locked", !selectedItems().some(function (z) { return z.locked; })); return; }
    if ((k === "delete" || k === "backspace") && selection.length) { e.preventDefault(); removeSelected(); return; }
    if (e.altKey && (k === "arrowup" || k === "arrowdown")) { e.preventDefault(); nudge(k === "arrowup" ? -1 : 1); return; }
    if (k === "enter" && selection.length === 1 && INLINE[(byId(selection[0]) || {}).type]) { e.preventDefault(); startEdit(selection[0]); return; }
    if (!mod && !e.altKey && !e.shiftKey) {
      if (k === "v") setTool("select");
      else if (k === "h") setTool("hand");
      else if (k === "t") addElement("text");
      else if (k === "i") addElement("image");
      else if (k === "b") addElement("button");
    }
  }
  document.addEventListener("keydown", function (e) { if (!menu.hidden || document.querySelector("dialog[open]:not([data-pb-navmgr]):not([data-pb-rules])")) return; onKey(e); });

  // ---------- Démarrage ----------
  var historyRestored = restoreHistory();
  (function offerBackup() {
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem("pb-backup-" + PAGE.id) || "null"); } catch (e) { raw = null; }
    if (!raw || !raw.content || !canWrite) return;
    if (JSON.stringify(raw.content.sections) === JSON.stringify(content.sections)) { try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } return; }
    if (window.confirm("Une copie non enregistrée de cette page (" + new Date(raw.at).toLocaleString("fr-FR") + ") est gardée dans ce navigateur. La reprendre ?")) {
      change(function () { content.sections = raw.content.sections || content.sections; ensureIds(content.sections); if (raw.content.seo) content.seo = raw.content.seo; if (raw.content.title) content.title = raw.content.title; if (raw.content.description !== undefined) content.description = raw.content.description; });
      if (!historyRestored) restoreHistory(); // l'historique gardé s'applique à cette copie non enregistrée : on le reprend à la place de l'étape unique créée ci-dessus
    } else { try { localStorage.removeItem("pb-backup-" + PAGE.id); } catch (e) { /* rien */ } }
  })();
  if (!canWrite) setSave("Lecture seule");
  Object.keys(aids).forEach(function (k) { $$("[data-pb-toggle='" + k + "']").forEach(function (b) { b.setAttribute("aria-pressed", String(aids[k])); }); });
  if (aids.rulers) { $("[data-pb-ruler-x]").hidden = false; $("[data-pb-ruler-y]").hidden = false; $("[data-pb-ruler-corner]").hidden = false; $("[data-pb-canvas]").classList.add("has-rulers"); }
  zoomFit = true;
  applyPanels();
  applyLayersPanel();
  updateStatus();
  renderTools();
  renderElements("");
  renderBlocks();
  renderComponents();
  refreshPageSettings();
  renderTree();
  renderInspector();
  renderContext();
  updateHistoryButtons();
  applyZoom();
  renderCanvas();
  setMode(mode);
  // Pont vers le gestionnaire de menu (page-builder-menu.js) : mêmes fonctions que l'inspecteur, donc même document et même historique
  window.pbNav = { h: h, walk: function (fn) { walk(fn); }, byId: byId, topOf: topOf, sectionNumber: function (top) { return top ? sectionIndex(top) + 1 : 0; }, change: change, select: function (id) { select(id); },
    selection: function () { return selection.slice(); }, toast: toast, canWrite: canWrite, links: boot.links, addElement: function (type) { addElement(type); }, subscribe: function (f) { navListeners.push(f); }, open: function () {} };
  // Pont vers la manipulation directe (page-builder-direct.js) : mêmes propriétés que l'inspecteur, mêmes fonctions d'écriture et d'historique
  if (window.pbDirect) window.pbDirect.attach({
    frame: function () { return frame; }, stage: function () { return stage; }, canWrite: function () { return canWrite; }, selection: function () { return selection.slice(); },
    byId: byId, isNode: isNode, kidsOf: kidsOf, lockedDeep: lockedDeep, nameOf: nameOf, canvasEl: canvasEl, pageRect: pageRect, select: function (id) { select(id); },
    openInspector: openInspector, duplicateSelected: duplicateSelected, icon: icon, toast: toast, bpLabel: bpLabel,
    device: function () { return device; }, tool: function () { return tool; }, setTool: setTool, zoom: function () { return zoom; }, editing: function () { return Boolean(editing); },
    gesture: function (on) { if (on === undefined) return gesture; if (on) gesture = true; else endGesture(); }, ignoreClick: function (ms) { ignoreClickUntil = Date.now() + ms; },
    ownValue: ownValue, inheritedValue: inheritedValue, splitLen: splitLen, styleSet: styleSet, cleanStyles: cleanStyles, change: change,
    caps: function (it) { var ins = inspectorFor(it), g = (ins && ins.groups) || {}; return { gap: Array.isArray(g.layout) && g.layout.indexOf("gap") >= 0, spacing: Boolean(g.spacing), size: g.size !== undefined && g.size !== false }; }
  });
  // Pont vers l'inspecteur de qualité (page-builder-quality.js) : lecture du rendu réel, corrections natives annulables
  if (window.pbQuality) window.pbQuality.attach({
    api: api, store: store, icon: icon, toast: toast, canWrite: function () { return canWrite; }, pageId: function () { return PAGE.id; },
    saveNow: function () { return saveNow(); }, subscribe: function (f) { navListeners.push(f); }, version: function () { return docVersion; },
    busy: function () { return gesture || Boolean(editing); }, content: function () { return content; }, sections: function () { return content.sections; },
    walk: function (fn) { walk(fn); }, byId: byId, nameOf: nameOf, frame: function () { return frame; }, canvasReady: function () { return canvasReady; }, canvasEl: canvasEl,
    device: function () { return device; }, setDevice: setDevice, select: function (id) { select(id); }, openInspector: function () { openInspector(); },
    seoUrl: function () { return (boot.seo || {}).canView ? boot.seo.url : null; },
    applyStyles: function (id, bp, map, label) {
      var it = byId(id);
      if (!it || !canWrite || refuseLocked([id]) || refuseFormat([id], Object.keys(map))) return false;
      change(function () { Object.keys(map).forEach(function (k) { styleSet(it, bp, "normal", true)[k] = map[k]; }); cleanStyles(it); }, { label: label || "Qualité" });
      return true;
    },
  });
  // Lien direct vers un élément (#element=<id>), utilisé par le Personnaliser (« Modifier seulement cet élément ») : sélectionne l'élément s'il existe dans cette page, sinon ne fait rien.
  (function () {
    var m = /(?:^|[#&])element=([a-z0-9]{6,20})(?:&|$)/.exec(location.hash || "");
    if (m && byId(m[1])) select(m[1]);
  })();
  // Pont vers IA Kolakisa (page-builder-ai.js) : l'IA propose, l'éditeur applique en UNE étape d'historique
  if (window.pbAi) window.pbAi.attach({
    base: BASE, api: api, store: store, icon: icon, toast: toast, canWrite: function () { return canWrite; },
    saveNow: function () { return saveNow(); }, revision: function () { return revision; },
    snapshotKey: function () { return JSON.stringify([content.sections, content.title, content.description]); },
    sections: function () { return content.sections; },
    frame: function () { return frame; }, device: function () { return device; }, setDevice: setDevice,
    byId: byId, canvasEl: canvasEl, pageRect: pageRect, selection: function () { return selection.slice(); },
    applyContent: function (next, label, hold) {
      if (hold) aiHold = true;
      change(function () {
        content.sections = clone(next.sections);
        if (next.title !== undefined) content.title = next.title;
        if (next.description !== undefined) content.description = next.description;
        selection = selection.filter(function (id) { return byId(id); });
      }, { label: label || "IA Kolakisa" });
      if (!hold) { aiHold = false; scheduleSave(); }
    },
    keepPreview: function () { aiHold = false; scheduleSave(); },
    discardPreview: function () { undo(); future.pop(); futureLabels.pop(); updateHistoryButtons(); aiHold = false; scheduleSave(); },
  });
  if (window.pbMotionStudio) window.pbMotionStudio.attach({
    h: h, toast: toast, SPEC: SPEC, bpLabel: bpLabel, byId: byId, isNode: isNode, change: change, accGroup: accGroup, numField: numField, selectField: selectField, checkField: checkField,
    schemaFields: schemaFields, frame: function () { return frame; }, setTab: function (t) { inspTab = t; store.set("insp-tab", t); renderInspector(); },
  });
  // Timeline visuelle du Motion Studio (scènes multi-éléments, transitions de page, défilement fluide) : lit et écrit theme.motionScenes par change()
  if (window.pbMotionTimeline) window.pbMotionTimeline.attach({
    h: h, toast: toast, SPEC: SPEC, bpLabel: bpLabel, change: change, accGroup: accGroup, selectField: selectField, checkField: checkField,
    frame: function () { return frame; }, content: function () { return content; }, selection: function () { return selection.slice(); }, canWrite: function () { return canWrite; },
  });
  if (window.pbEffects) window.pbEffects.attach({
    h: h, store: store, toast: toast, SPEC: SPEC, BPS: BPS, bpLabel: bpLabel, byId: byId, isNode: isNode, change: change, idsOf: idsOf,
    accGroup: accGroup, ownValue: ownValue, inheritedValue: inheritedValue, canvasEl: canvasEl, setStyle: setStyle, setStyles: setStyles, parseLength: parseLength, numField: numField, numericControl: numericControl, selectField: selectField, checkField: checkField,
    openMedia: openMedia, breakpointSwitch: breakpointSwitch, getDevice: function () { return device; }, getState: function () { return styleState; },
    setState: function (st) { styleState = st; renderInspector(); renderContext(); }, hasStates: function (it) { return Boolean(inspectorFor(it).states); },
  });
  // Lecture de l'état pour les tests de bout en bout (aucune écriture possible par ce biais)
  window.__pb = { content: function () { return clone(content); }, selection: function () { return selection.slice(); }, device: function () { return device; }, revision: function () { return revision; }, dirty: function () { return dirty || saving; }, mode: function () { return mode; } };
})();

/* KOLAKISA — moteur de réinitialisation : compare un élément à sa dernière version ENREGISTRÉE et restaure ses réglages.
   Calculs purs (aucun accès à la page) : chargé avant page-builder.js, aussi utilisable par Node (tests).
   Chaque réglage d'un élément a un « chemin » stable :
     p:<clé>            contenu (props d'un élément)            f:<clé>   champ d'une ancienne section
     s:<écran>:<clé>    style d'un écran                        t:<état>:<clé>   style d'un état (survol, focus…)
     m:<clé>            réglage de l'élément (nom, masqué…)
   Les enfants ne font jamais partie des réglages d'un élément : réinitialiser un parent ne touche pas ses enfants. */
(function (root) {
  "use strict";

  var META_SKIP = { id: 1, type: 1, props: 1, styles: 1, states: 1, children: 1 };
  var STYLE_KEYS = { styles: "s", states: "t" };

  // ---------- Normalisation : deux écritures équivalentes d'une même valeur ne comptent pas comme un changement ----------
  function hexColor(s) {
    var m = /^#([0-9a-f]{3,4})$/i.exec(s);
    if (m) return "#" + m[1].split("").map(function (c) { return c + c; }).join("").toLowerCase();
    return /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ? s.toLowerCase() : null;
  }
  function rgbColor(s) {
    var m = /^rgba?\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i.exec(s);
    if (!m || +m[1] > 255 || +m[2] > 255 || +m[3] > 255) return null;
    var a = m[4] === undefined ? 1 : /%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    var h = function (n) { return ("0" + (+n).toString(16)).slice(-2); };
    return "#" + h(m[1]) + h(m[2]) + h(m[3]) + (a >= 1 ? "" : h(Math.round(a * 255)));
  }
  function normString(s) {
    var t = s.trim();
    var c = hexColor(t) || rgbColor(t);
    if (c) return c;
    // Longueur : « 10.0px », « 010px », « 10,5px » → « 10px », « 10.5px » ; « 0px » et « 0 » sont la même chose
    var m = /^(-?\d+(?:[.,]\d+)?)(px|%|rem|em|vh|vw|ms|s|deg)?$/i.exec(t);
    if (m) {
      var n = parseFloat(m[1].replace(",", "."));
      if (isFinite(n)) return (n === 0 ? "0" : String(Math.round(n * 1000) / 1000)) + (n === 0 ? "" : (m[2] || "").toLowerCase());
    }
    return t;
  }
  function norm(v) {
    if (v === undefined) return undefined;
    if (v === null || typeof v === "boolean") return v;
    if (typeof v === "number") return Math.round(v * 1000) / 1000;
    if (typeof v === "string") return normString(v);
    if (Array.isArray(v)) return v.map(norm);
    if (typeof v === "object") { var o = {}; Object.keys(v).sort().forEach(function (k) { var x = norm(v[k]); if (x !== undefined) o[k] = x; }); return o; }
    return v;
  }
  // Un nombre et sa version écrite (« 12 » / 12) restent deux valeurs distinctes pour le serveur : on les compare à la forme près, pas au type
  function key(v) { var n = norm(v); return n === undefined ? "\u0000absent" : typeof n === "number" ? JSON.stringify(String(n)) : JSON.stringify(n); }

  // ---------- Chemins d'un élément ----------
  // Retourne { chemin: valeur brute } pour tous les réglages présents sur l'élément (sans les enfants)
  function settings(item, isNode) {
    var out = {};
    if (!item) return out;
    var holder = isNode ? item.props : null;
    if (isNode && holder) Object.keys(holder).forEach(function (k) { out["p:" + k] = holder[k]; });
    Object.keys(item).forEach(function (k) {
      if (META_SKIP[k]) return;
      out[(isNode ? "m:" : "f:") + k] = item[k];
    });
    // Ancienne section : ses réglages sont les champs eux-mêmes ; « props » n'existe que sur les éléments
    if (!isNode && item.props) Object.keys(item.props).forEach(function (k) { out["p:" + k] = item.props[k]; });
    Object.keys(STYLE_KEYS).forEach(function (bucket) {
      var map = item[bucket];
      if (!map) return;
      Object.keys(map).forEach(function (scope) {
        var set = map[scope];
        if (set && typeof set === "object") Object.keys(set).forEach(function (k) { out[STYLE_KEYS[bucket] + ":" + scope + ":" + k] = set[k]; });
      });
    });
    return out;
  }

  // Chemins qui diffèrent entre l'élément courant et sa référence (ajouts, retraits et changements de valeur)
  function diff(item, base, isNode) {
    if (!item || !base) return [];
    var a = settings(item, isNode), b = settings(base, isNode), out = [];
    Object.keys(a).forEach(function (p) { if (!(p in b) || key(a[p]) !== key(b[p])) out.push(p); });
    Object.keys(b).forEach(function (p) { if (!(p in a)) out.push(p); });
    return out;
  }

  function parsePath(path) {
    var s = String(path).split(":"), kind = s[0];
    if (kind === "s" || kind === "t") return { kind: kind, scope: s[1], key: s.slice(2).join(":") };
    return { kind: kind, key: s.slice(1).join(":") };
  }

  // Valeur propre à la copie : on ne partage aucun objet avec la référence
  function copy(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  function prune(item) {
    Object.keys(STYLE_KEYS).forEach(function (bucket) {
      var map = item[bucket];
      if (!map) return;
      Object.keys(map).forEach(function (scope) { if (!map[scope] || !Object.keys(map[scope]).length) delete map[scope]; });
      if (!Object.keys(map).length) delete item[bucket];
    });
  }

  // Remet les chemins donnés à la valeur de la référence (ou les retire s'ils n'y existent pas). Seuls ces chemins changent.
  function restore(item, base, paths, isNode) {
    var done = [];
    paths.forEach(function (path) {
      var p = parsePath(path), want;
      if (p.kind === "s" || p.kind === "t") {
        var bucket = p.kind === "s" ? "styles" : "states";
        want = base[bucket] && base[bucket][p.scope] ? base[bucket][p.scope][p.key] : undefined;
        if (want === undefined) { if (item[bucket] && item[bucket][p.scope]) delete item[bucket][p.scope][p.key]; }
        else { item[bucket] = item[bucket] || {}; item[bucket][p.scope] = item[bucket][p.scope] || {}; item[bucket][p.scope][p.key] = copy(want); }
      } else if (p.kind === "p") {
        want = base.props ? base.props[p.key] : undefined;
        if (want === undefined) { if (item.props) delete item.props[p.key]; }
        else { item.props = item.props || {}; item.props[p.key] = copy(want); }
      } else {
        want = base[p.key];
        if (want === undefined) delete item[p.key]; else item[p.key] = copy(want);
      }
      done.push(path);
    });
    prune(item);
    return done;
  }

  // ---------- Regroupement par groupe de réglages (mise en page, typographie…) ----------
  // groupOfKey : clé de style → groupe (fourni par l'éditeur). Contenu, réglages de l'élément : groupes à part.
  function groupOf(path, groupOfKey) {
    var p = parsePath(path);
    if (p.kind === "p" || p.kind === "f") return "content";
    if (p.kind === "m") return "element";
    return groupOfKey(p.key) || "other";
  }

  // ---------- Référence enregistrée ----------
  // Garde la dernière version enregistrée (texte JSON) et la déplie élément par élément seulement quand on la consulte.
  function Baseline() { this.json = null; this.index = null; this.version = 0; }
  Baseline.prototype.set = function (sections) { this.json = JSON.stringify(sections || []); this.index = null; this.version++; };
  Baseline.prototype.setJson = function (json) { this.json = json; this.index = null; this.version++; };
  Baseline.prototype.build = function () {
    if (this.index) return this.index;
    var map = {}, walkList = function (list, top) {
      (list || []).forEach(function (n) {
        if (!n || typeof n !== "object") return;
        if (n.id) map[n.id] = { item: n, isNode: !top };
        if (Array.isArray(n.children)) walkList(n.children, false);
      });
    };
    walkList(this.json ? JSON.parse(this.json) : [], true);
    this.index = map;
    return map;
  };
  // Élément tel qu'il était à l'enregistrement, ou null s'il n'existait pas encore (élément nouveau : aucune référence)
  Baseline.prototype.get = function (id) { var e = this.build()[id]; return e ? e.item : null; };
  Baseline.prototype.has = function (id) { return Boolean(this.build()[id]); };

  var api = { norm: norm, same: function (a, b) { return key(a) === key(b); }, settings: settings, diff: diff, restore: restore, parsePath: parsePath, groupOf: groupOf, Baseline: Baseline };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.KWReset = api;
})(typeof window !== "undefined" ? window : this);

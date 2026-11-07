// KOLAKISA CMS → Apparence → Styles : gestionnaire de styles globaux. Données = JSON #st-data posé par le serveur ; enregistrements = routes /site-web/styles/{rendu,brouillon,annuler,publier,restaurer}
// (même brouillon, mêmes validations, même publication). Le serveur REVALIDE tout ; rien n'est annoncé comme réussi avant sa réponse.
(function () {
  var root = document.querySelector("[data-st-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === false || v == null) return; if (k === "text") el.textContent = v; else if (k === "onclick") el.addEventListener("click", v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var boot = JSON.parse(document.getElementById("st-data").textContent);
  var controls = {}; boot.panels.forEach(function (p) { p.controls.forEach(function (c) { controls[c.id] = c; }); });
  var live = clone(boot.live), values = clone(boot.values), saved = clone(boot.changes), rev = boot.draft.rev || 0;
  var undo = [], redo = [], errors = {}, warnings = [], busy = false, seq = 0, tab = boot.panels[0] ? boot.panels[0].id : "", conflict = false;
  var CAN = boot.can.edit;
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var empty = function (v) { return v === null || v === undefined || v === ""; };
  var same = function (a, b) { return String(empty(a) ? "" : a) === String(empty(b) ? "" : b); };
  function work() { var o = {}; Object.keys(values).forEach(function (id) { if (!same(values[id], live[id])) o[id] = values[id]; }); return o; }
  function sameMaps(a, b) { var ka = Object.keys(a), kb = Object.keys(b); return ka.length === kb.length && ka.every(function (k) { return same(a[k], b[k]); }); }
  var dirty = function () { return !sameMaps(work(), saved); };
  var pending = function () { return Object.keys(work()).length; };
  var hasErrors = function () { return Object.keys(errors).length > 0; };

  // ---------- Annonces, bandeau, état ----------
  var liveEl = $("[data-st-live]"), stateEl = $("[data-st-state]"), banner = $("[data-st-banner]"), bannerText = $("[data-st-banner-text]"), bannerBtn = $("[data-st-banner-action]");
  function say(t) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = t; }, 30); }
  function showBanner(text, label, fn) { bannerText.textContent = text; banner.hidden = false; bannerBtn.hidden = !label; bannerBtn.textContent = label || ""; bannerBtn.onclick = fn || null; }
  var hideBanner = function () { banner.hidden = true; };
  function setState() {
    var d = dirty(), n = pending();
    stateEl.classList.toggle("is-dirty", d);
    stateEl.textContent = busy === "save" ? "Enregistrement…" : busy === "publish" ? "Publication…" : hasErrors() ? "Valeur invalide : corrigez-la pour enregistrer" : d ? "Modifications non enregistrées" : n ? n + " réglage" + (n > 1 ? "s" : "") + " en brouillon, non publié" + (n > 1 ? "s" : "") : "À jour : identique à la version en ligne";
    $("[data-st-save]").disabled = !CAN || !d || !!busy || hasErrors() || conflict;
    $("[data-st-publish]").disabled = !boot.can.publish || !!busy || hasErrors() || n === 0 || conflict;
    $("[data-st-discard]").disabled = !CAN || !!busy || (n === 0 && !rev);
    $("[data-st-undo]").disabled = !undo.length; $("[data-st-redo]").disabled = !redo.length;
    $$("[data-st-tab]").forEach(function (b) { var id = b.getAttribute("data-st-tab"), c = boot.panels.filter(function (p) { return p.id === id; })[0]; if (!c) return; var k = c.controls.filter(function (x) { return !same(values[x.id], live[x.id]); }).length; var badge = b.querySelector(".mk-st-count"); if (badge) { badge.textContent = k ? String(k) : ""; badge.hidden = !k; } });
  }
  window.addEventListener("beforeunload", function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && dirty() && !a.target && !/^#/.test(a.getAttribute("href") || "") && !confirm("Des modifications de style ne sont pas enregistrées. Quitter cette page sans les enregistrer ?")) e.preventDefault();
  }, true);

  // ---------- Couleurs : lecture effective et contraste (WCAG) ----------
  function hex(c) { var n = parseInt(String(c).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function lum(c) { var v = hex(c).map(function (x) { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; }
  function ratio(a, b) { var l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }
  var isHex = function (c) { return /^#[0-9a-f]{6}$/i.test(String(c || "")); };
  function eff(id) { var v = values[id]; if (!empty(v)) return v; if (!empty(live[id])) return live[id]; return boot.defaults[id]; }
  function onColor(c) { return ratio(c, "#ffffff") >= ratio(c, "#10222f") ? "#ffffff" : "#10222f"; }
  function pairs() {
    var c = function (k) { return eff("tokens.colors." + k); };
    var out = [["Texte sur le fond", c("text"), c("background")], ["Texte sur les cartes (surface)", c("text"), c("surface")], ["Texte discret sur le fond", c("muted"), c("background")], ["Texte discret sur les cartes", c("muted"), c("surface")],
      ["Texte des boutons sur la couleur principale", eff("tokens.buttons.normal.color") && isHex(eff("tokens.buttons.normal.color")) ? eff("tokens.buttons.normal.color") : onColor(c("primary")), eff("tokens.buttons.normal.bg") && isHex(eff("tokens.buttons.normal.bg")) ? eff("tokens.buttons.normal.bg") : c("primary")]];
    var link = eff("tokens.link.color"); out.push(["Liens sur le fond", isHex(link) ? link : c("primary"), c("background")]);
    return out.filter(function (p) { return isHex(p[1]) && isHex(p[2]); });
  }

  // ---------- Historique des modifications (annuler / rétablir) ----------
  function remember() { undo.push(clone(values)); if (undo.length > 60) undo.shift(); redo = []; }
  function restoreSnap(from, to, msg) { if (!from.length) return; to.push(clone(values)); values = from.pop(); errors = {}; renderBody(); afterChange(); say(msg); }
  $("[data-st-undo]").addEventListener("click", function () { restoreSnap(undo, redo, "Modification annulée."); });
  $("[data-st-redo]").addEventListener("click", function () { restoreSnap(redo, undo, "Modification rétablie."); });

  // ---------- Champs ----------
  var body = $("[data-st-body]"), tabsEl = $("[data-st-tabs]");
  function rid(id) { return "st-f-" + id.replace(/[^A-Za-z0-9]/g, "_"); }
  function shown(c) { if (!c.showIf) return true; return Object.keys(c.showIf).every(function (k) { return String(values[k]) === String(c.showIf[k]); }); }
  function set(id, value, snap) { if (snap) remember(); values[id] = value; delete errors[id]; afterChange(); }
  function resetBtn(c) {
    var d = !same(values[c.id], live[c.id]);
    return h("button", { type: "button", class: "mk-st-reset", "aria-label": "Revenir à la version en ligne : " + c.label, title: "Revenir à la version en ligne", hidden: !d, onclick: function () { set(c.id, live[c.id], true); renderBody(); } }, "↺");
  }
  function field(c) {
    var id = rid(c.id), wrap = h("div", { class: "field-group mk-st-field", "data-st-ctl": c.id }), input;
    var label = h("label", { for: id, text: c.label });
    if (c.kind === "color") {
      var txt = h("input", { type: "text", id: id, maxlength: "7", autocomplete: "off", spellcheck: "false", placeholder: c.allowEmpty ? "Origine" : "#000000", value: eff(c.id) && !empty(values[c.id]) ? values[c.id] : (c.allowEmpty ? "" : eff(c.id)) });
      var pick = h("input", { type: "color", "aria-label": c.label + " (sélecteur)", value: isHex(eff(c.id)) ? eff(c.id) : "#000000" });
      var sw = h("span", { class: "mk-st-swatch", style: isHex(eff(c.id)) ? "background:" + eff(c.id) : null, "aria-hidden": "true" });
      txt.disabled = pick.disabled = !CAN;
      txt.addEventListener("input", function () { var v = txt.value.trim().toLowerCase(); if (v !== "" && !/^#[0-9a-f]{6}$/.test(v)) { errors[c.id] = c.label + " : code hexadécimal attendu (ex. #0277b6)."; showError(c.id); setState(); return; } if (!values.__snap) { remember(); values.__snap = 1; delete values.__snap; } values[c.id] = v; delete errors[c.id]; showError(c.id); if (isHex(v)) { pick.value = v; sw.style.background = v; } afterChange(); });
      pick.addEventListener("input", function () { remember(); values[c.id] = pick.value; txt.value = pick.value; sw.style.background = pick.value; delete errors[c.id]; showError(c.id); afterChange(); });
      input = h("div", { class: "mk-st-colorrow" }, [sw, pick, txt, resetBtn(c)]);
    } else if (c.kind === "number") {
      var num = h("input", { type: "number", id: id, min: c.min, max: c.max, step: c.step || 1, inputmode: "decimal", value: empty(values[c.id]) ? "" : values[c.id], placeholder: empty(live[c.id]) && !empty(boot.defaults[c.id]) ? boot.defaults[c.id] : null });
      num.disabled = !CAN;
      num.addEventListener("input", function () {
        var raw = num.value.trim();
        if (raw === "") { remember(); values[c.id] = ""; delete errors[c.id]; showError(c.id); afterChange(); return; }
        var n = Number(raw);
        if (!isFinite(n) || n < c.min || n > c.max) { errors[c.id] = c.label + " : un nombre entre " + c.min + " et " + c.max + " est attendu."; showError(c.id); setState(); return; }
        remember(); values[c.id] = n; delete errors[c.id]; showError(c.id); afterChange();
      });
      input = h("div", { class: "mk-st-numrow" }, [num, c.unit ? h("span", { class: "mk-st-unit", text: c.unit }) : null, resetBtn(c)]);
    } else if (c.kind === "select") {
      var sel = h("select", { id: id }, (c.options || []).map(function (o) { return h("option", { value: String(o[0]), text: o[1], selected: String(values[c.id]) === String(o[0]) ? true : null }); }));
      sel.disabled = !CAN;
      sel.addEventListener("change", function () { remember(); values[c.id] = c.number ? Number(sel.value) : sel.value; delete errors[c.id]; showError(c.id); afterChange(); });
      input = h("div", { class: "mk-st-numrow" }, [sel, resetBtn(c)]);
    } else if (c.kind === "toggle") {
      var cb = h("input", { type: "checkbox", id: id }); cb.checked = !!values[c.id]; cb.disabled = !CAN;
      cb.addEventListener("change", function () { remember(); values[c.id] = cb.checked; afterChange(); renderBody(); });
      return h("div", { class: "field-group mk-st-field" }, [h("label", { class: "mk-cms-check", for: id }, [cb, " " + c.label]), c.help ? h("span", { class: "field-hint", text: c.help }) : null]);
    } else return null;
    wrap.appendChild(label); wrap.appendChild(input);
    wrap.appendChild(h("span", { class: "field-hint mk-st-err", role: "alert", "data-st-err": c.id, hidden: !errors[c.id], text: errors[c.id] || "" }));
    if (c.help) wrap.appendChild(h("span", { class: "field-hint", text: c.help }));
    return wrap;
  }
  function showError(id) { var el = $('[data-st-err="' + id + '"]'); if (el) { el.textContent = errors[id] || ""; el.hidden = !errors[id]; } }

  // ---------- Onglets ----------
  var TABS = { couleurs: "Palette", typographie: "Typographie", "mise-en-page": "Formes et espacements", boutons: "Boutons et liens" };
  function renderTabs() {
    tabsEl.textContent = "";
    boot.panels.forEach(function (p) {
      var b = h("button", { type: "button", role: "tab", id: "st-tab-" + p.id, "aria-selected": String(tab === p.id), "aria-controls": "st-body", "data-st-tab": p.id, tabindex: tab === p.id ? "0" : "-1" }, [TABS[p.id] || p.label, h("span", { class: "mk-st-count", hidden: true })]);
      b.addEventListener("click", function () { tab = p.id; renderTabs(); renderBody(); setState(); });
      b.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var i = boot.panels.findIndex(function (x) { return x.id === tab; }); i = (i + (e.key === "ArrowRight" ? 1 : boot.panels.length - 1)) % boot.panels.length; tab = boot.panels[i].id; renderTabs(); renderBody(); setState(); var nb = $('[data-st-tab="' + tab + '"]'); if (nb) nb.focus(); });
      tabsEl.appendChild(b);
    });
    tabsEl.appendChild(h("button", { type: "button", role: "tab", id: "st-tab-historique", "aria-selected": String(tab === "historique"), "aria-controls": "st-body", "data-st-tab": "historique", tabindex: tab === "historique" ? "0" : "-1", onclick: function () { tab = "historique"; renderTabs(); renderBody(); setState(); } }, "Versions"));
  }
  function groupActions(p) {
    if (!CAN) return null;
    return h("div", { class: "mk-st-groupbar" }, [
      h("button", { type: "button", class: "mk-wd-btn", text: "Revenir à la version en ligne", onclick: function () { remember(); p.controls.forEach(function (c) { values[c.id] = live[c.id]; delete errors[c.id]; }); renderBody(); afterChange(); say("Réglages de la famille ramenés à la version en ligne."); } }),
      h("button", { type: "button", class: "mk-wd-btn", text: "Valeurs d'origine de Kolakisa", onclick: function () {
        if (!confirm("Remplacer les réglages de cette famille par les valeurs d'origine de Kolakisa ? Rien n'est publié tant que vous ne publiez pas, et vous pouvez annuler.")) return;
        remember(); p.controls.forEach(function (c) { if (Object.prototype.hasOwnProperty.call(boot.defaults, c.id)) values[c.id] = boot.defaults[c.id]; else if (c.nullable || c.allowEmpty) values[c.id] = ""; delete errors[c.id]; }); renderBody(); afterChange(); say("Valeurs d'origine appliquées au brouillon.");
      } }),
    ]);
  }
  function renderBody() {
    body.textContent = ""; body.setAttribute("aria-labelledby", "st-tab-" + tab);
    if (tab === "historique") return renderHistory();
    var p = boot.panels.filter(function (x) { return x.id === tab; })[0]; if (!p) return;
    if (boot.pendingEngineDraft) body.appendChild(h("p", { class: "mk-wd-banner" }, "Un brouillon de l'ancien éditeur est en cours pour le site principal : publiez-le ou annulez-le avant de publier ici."));
    if (tab === "couleurs") renderPalette(p); else if (tab === "typographie") renderGeneric(p, "Polices et échelle typographique. Les polices téléversées se gèrent dans Polices.", boot.links.polices, "Gérer les polices"); else if (tab === "boutons") renderGeneric(p, "Forme et états des boutons, et style des liens.", null); else renderGeneric(p, "Arrondis, ombres, espacements et largeurs du site.", null);
    var ga = groupActions(p); if (ga) body.appendChild(ga);
    // Échelle complète (titres 4 à 6, légende, espacements XS à XXL, rayons, ombres) : écran « Design system avancé » du site (mêmes valeurs, enregistrées une seule fois)
    if (boot.links.designSystem && (tab === "typographie" || tab === "mise-en-page")) body.appendChild(h("p", { class: "field-hint" }, ["Réglages avancés du site : ", h("a", { href: boot.links.designSystem, text: "Design system avancé →" })]));
  }
  function renderGeneric(p, intro, href, hrefLabel) {
    body.appendChild(h("p", { class: "field-hint", text: intro }));
    if (href) body.appendChild(h("p", null, h("a", { href: href, text: hrefLabel + " →" })));
    var groups = {}, order = [];
    p.controls.forEach(function (c) { var g = group(c); if (!groups[g]) { groups[g] = []; order.push(g); } groups[g].push(c); });
    order.forEach(function (g) {
      var fs = h("fieldset", { class: "mk-st-group" }, [h("legend", { text: g })]);
      groups[g].forEach(function (c) { if (!shown(c)) return; var f = field(c); if (f) fs.appendChild(f); });
      body.appendChild(fs);
    });
  }
  function group(c) {
    var id = c.id;
    if (/^tokens\.fonts/.test(id)) return "Polices"; if (/^tokens\.type\.h1/.test(id)) return "Titre 1"; if (/^tokens\.type\.h2/.test(id)) return "Titre 2"; if (/^tokens\.type\.h3/.test(id)) return "Titre 3"; if (/^tokens\.type\.body/.test(id)) return "Texte courant";
    if (/^tokens\.link/.test(id)) return "Liens"; if (/^tokens\.radius/.test(id)) return /button/.test(id) ? "Forme des boutons" : "Arrondis"; if (/^tokens\.shadow/.test(id)) return "Ombres"; if (/^tokens\.space/.test(id)) return "Échelle d'espacement";
    if (/^(settings\.layout|tokens\.sizes)/.test(id)) return "Largeurs et marges"; if (/^tokens\.buttons\.(normal)/.test(id)) return "Boutons : état normal"; if (/^tokens\.buttons\.hover/.test(id)) return "Boutons : au survol"; if (/^tokens\.buttons\.focus/.test(id)) return "Boutons : focus clavier"; if (/^tokens\.buttons/.test(id)) return "Boutons : dimensions";
    return "Autres réglages";
  }
  function renderPalette(p) {
    body.appendChild(h("p", { class: "field-hint", text: "Choisissez une palette de départ puis ajustez chaque couleur. Chaque palette proposée respecte les contrastes AA ; les contrastes de VOS couleurs sont vérifiés ci-dessous." }));
    var pal = h("div", { class: "mk-st-palettes", role: "group", "aria-label": "Palettes prêtes" });
    boot.palettes.forEach(function (x) {
      var b = h("button", { type: "button", class: "mk-st-palette", "aria-label": "Appliquer la palette " + x.label, title: x.hint, disabled: !CAN ? true : null }, [
        h("span", { class: "mk-st-pal-sw", "aria-hidden": "true" }, ["primary", "secondary", "accent", "background", "text"].filter(function (k) { return x.colors[k]; }).map(function (k) { return h("i", { style: "background:" + x.colors[k] }); })), h("span", { class: "mk-st-pal-name", text: x.label })]);
      b.addEventListener("click", function () { remember(); Object.keys(x.colors).forEach(function (k) { if (controls["tokens.colors." + k]) { values["tokens.colors." + k] = x.colors[k]; delete errors["tokens.colors." + k]; } }); renderBody(); afterChange(); say("Palette « " + x.label + " » appliquée au brouillon."); });
      pal.appendChild(b);
    });
    body.appendChild(pal);
    var main = p.controls.filter(function (c) { return /^tokens\.colors\./.test(c.id); }), rest = p.controls.filter(function (c) { return !/^tokens\.colors\./.test(c.id); });
    var fs = h("fieldset", { class: "mk-st-group" }, [h("legend", { text: "Couleurs de la marque" })]); main.forEach(function (c) { var f = field(c); if (f) fs.appendChild(f); }); body.appendChild(fs);
    var fs2 = h("fieldset", { class: "mk-st-group" }, [h("legend", { text: "Liens et bordures" })]); rest.forEach(function (c) { if (!shown(c)) return; var f = field(c); if (f) fs2.appendChild(f); }); body.appendChild(fs2);
    var mx = h("div", { class: "mk-st-contrast", "data-st-contrast": "" }); body.appendChild(mx); renderContrast();
  }
  function renderContrast() {
    var el = $("[data-st-contrast]"); if (!el) return; el.textContent = "";
    el.appendChild(h("h3", { text: "Lisibilité (contraste WCAG)" }));
    var ul = h("ul", { class: "mk-st-ratios" });
    pairs().forEach(function (p) {
      var r = ratio(p[1], p[2]), lvl = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA (grand texte)" : "Insuffisant";
      ul.appendChild(h("li", { class: r >= 4.5 ? "is-ok" : "is-bad" }, [h("span", { class: "mk-st-ratio-sample", style: "background:" + p[2] + ";color:" + p[1], "aria-hidden": "true", text: "Aa" }), h("span", { class: "mk-st-ratio-name", text: p[0] }), h("strong", { text: r.toFixed(1) + ":1" }), h("span", { class: "mk-st-ratio-lvl", text: lvl })]));
    });
    el.appendChild(ul);
    if (warnings.length) el.appendChild(h("p", { class: "field-hint", role: "status", text: "Contrôle du serveur : " + warnings.join(" ") }));
  }
  function renderHistory() {
    body.appendChild(h("p", { class: "field-hint", text: "Publications faites depuis Styles. « Revenir en arrière » place les anciennes valeurs dans le brouillon : rien n'est publié tant que vous ne publiez pas." }));
    if (!boot.history.length) { body.appendChild(h("p", { class: "mk-st-empty", text: "Aucune publication enregistrée pour ce site." })); return; }
    var ul = h("ul", { class: "mk-st-versions" });
    boot.history.forEach(function (v) {
      ul.appendChild(h("li", null, [h("span", null, [h("strong", { text: v.publishedAt + " UTC" }), h("small", { text: (v.by ? " · " + v.by : "") + " · " + v.count + " réglage" + (v.count > 1 ? "s" : "") + (v.note ? " · " + v.note : "") })]),
        boot.can.publish ? h("button", { type: "button", class: "mk-wd-btn", text: "Revenir en arrière", onclick: function () { restoreVersion(v.id); } }) : null]));
    });
    body.appendChild(ul);
  }

  // ---------- Guide de style (rendu en direct des réglages) ----------
  var guide = $("[data-st-guide]");
  var SHADOWS = { none: "none", sm: "0 1px 3px rgba(11,42,64,.08)", md: "0 4px 16px rgba(11,42,64,.10)", lg: "0 12px 32px rgba(11,42,64,.14)" };
  function stack(id) { var v = eff(id); return boot.fontStacks[v] || "system-ui, sans-serif"; }
  function num(id, fb) { var v = Number(eff(id)); return isFinite(v) && !empty(eff(id)) ? v : fb; }
  function css() {
    var c = function (k) { return eff("tokens.colors." + k) || "#000000"; }, pri = c("primary");
    var bg = isHex(eff("tokens.buttons.normal.bg")) ? eff("tokens.buttons.normal.bg") : pri;
    var vars = {
      "--g-primary": pri, "--g-secondary": c("secondary"), "--g-accent": boot.principal ? c("secondary") : c("accent"), "--g-bg": c("background"), "--g-surface": c("surface"), "--g-text": c("text"), "--g-muted": c("muted"), "--g-border": eff("tokens.border.color") || "#d7e3ec",
      "--g-link": isHex(eff("tokens.link.color")) ? eff("tokens.link.color") : pri, "--g-link-hover": isHex(eff("tokens.link.hoverColor")) ? eff("tokens.link.hoverColor") : pri, "--g-underline": eff("tokens.link.underline") === "none" ? "none" : "underline",
      "--g-fh": stack("tokens.fonts.heading"), "--g-fb": stack("tokens.fonts.body"),
      "--g-h1": num("tokens.type.h1.size", 40) + "px", "--g-h1w": eff("tokens.type.h1.weight") || 700, "--g-h1l": num("tokens.type.h1.lineHeight", 1.2),
      "--g-h2": num("tokens.type.h2.size", 30) + "px", "--g-h2w": eff("tokens.type.h2.weight") || 700, "--g-h2l": num("tokens.type.h2.lineHeight", 1.25),
      "--g-h3": num("tokens.type.h3.size", 22) + "px", "--g-h3w": eff("tokens.type.h3.weight") || 600, "--g-h3l": num("tokens.type.h3.lineHeight", 1.3),
      "--g-body": num("tokens.type.body.size", 16) + "px", "--g-bodyl": num("tokens.type.body.lineHeight", 1.6),
      "--g-rmd": num("tokens.radius.md", 10) + "px", "--g-rlg": num("tokens.radius.lg", 16) + "px", "--g-rbtn": num("tokens.radius.button", 8) + "px", "--g-shadow": SHADOWS[eff("tokens.shadow.card")] || SHADOWS.md, "--g-bshadow": SHADOWS[eff("tokens.shadow.button")] || "none",
      "--g-bbg": bg, "--g-bcolor": isHex(eff("tokens.buttons.normal.color")) ? eff("tokens.buttons.normal.color") : onColor(bg), "--g-bborder": isHex(eff("tokens.buttons.normal.border")) ? eff("tokens.buttons.normal.border") : bg, "--g-bbw": num("tokens.buttons.borderWidth", 1) + "px",
      "--g-hbg": isHex(eff("tokens.buttons.hover.bg")) ? eff("tokens.buttons.hover.bg") : bg, "--g-hcolor": isHex(eff("tokens.buttons.hover.color")) ? eff("tokens.buttons.hover.color") : onColor(isHex(eff("tokens.buttons.hover.bg")) ? eff("tokens.buttons.hover.bg") : bg),
      "--g-fcolor": isHex(eff("tokens.buttons.focus.color")) ? eff("tokens.buttons.focus.color") : pri, "--g-fw": num("tokens.buttons.focus.width", 3) + "px", "--g-py": num("tokens.buttons.paddingY", 10) + "px", "--g-px": num("tokens.buttons.paddingX", 20) + "px",
      "--g-s1": num("tokens.space.sm", 8) + "px", "--g-s2": num("tokens.space.md", 16) + "px", "--g-s3": num("tokens.space.lg", 24) + "px", "--g-s4": num("tokens.space.xl", 40) + "px",
    };
    return Object.keys(vars).map(function (k) { return k + ":" + vars[k]; }).join(";");
  }
  var faceStyle = document.createElement("style"); faceStyle.id = "st-faces"; document.head.appendChild(faceStyle);
  function renderGuide() {
    guide.setAttribute("style", css());
    if (guide.getAttribute("data-built")) return;
    guide.setAttribute("data-built", "1");
    guide.appendChild(h("div", { class: "g-page" }, [
      h("p", { class: "g-eyebrow", text: "Guide de style" }),
      h("p", { class: "g-h1", text: "Un titre de niveau 1" }), h("p", { class: "g-h2", text: "Un titre de niveau 2" }), h("p", { class: "g-h3", text: "Un titre de niveau 3" }),
      h("p", null, ["Un paragraphe de texte courant pour juger la police, la taille et l'interligne. Il contient un ", h("a", { href: "#", class: "g-link", onclick: function (e) { e.preventDefault(); } }, "lien dans le texte"), " et un ", h("span", { class: "g-muted", text: "passage discret" }), "."]),
      h("div", { class: "g-row" }, [h("button", { type: "button", class: "g-btn", tabindex: "-1" }, "Bouton principal"), h("button", { type: "button", class: "g-btn is-hover", tabindex: "-1" }, "Au survol"), h("button", { type: "button", class: "g-btn is-focus", tabindex: "-1" }, "Focus clavier"), h("button", { type: "button", class: "g-btn g-btn--outline", tabindex: "-1" }, "Bouton contour")]),
      h("div", { class: "g-cards" }, [1, 2, 3].map(function (n) { return h("div", { class: "g-card" }, [h("p", { class: "g-h3", text: "Carte " + n }), h("p", { class: "g-muted", text: "Surface, bordure, arrondi et ombre des cartes." })]); })),
      h("div", { class: "g-form" }, [h("label", { text: "Un champ de formulaire" }), h("input", { type: "text", placeholder: "Votre e-mail", "aria-label": "Exemple de champ", tabindex: "-1", readonly: true })]),
      h("div", { class: "g-chips", "aria-label": "Couleurs de la marque" }, ["primary", "secondary", "accent", "background", "surface", "text", "muted"].filter(function (k) { return controls["tokens.colors." + k]; }).map(function (k) { return h("span", { class: "g-chip", style: "background:var(--g-" + (k === "background" ? "bg" : k) + ")" }, h("small", { text: k })); })),
    ]));
  }

  // ---------- Appels au serveur ----------
  function post(path, bodyObj) {
    var payload = Object.assign({ site: boot.siteId === null ? "" : String(boot.siteId) }, bodyObj);
    return fetch(boot.base + path + boot.siteQuery, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) })
      .then(function (res) { return res.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; } if (!res.ok) { var err = new Error((d && d.error && d.error.message) || (res.status === 401 ? "Votre session a expiré : reconnectez-vous." : res.status === 403 ? "Vous n'avez pas le droit de faire cela." : "Le serveur n'a pas pu traiter la demande (erreur " + res.status + ").")); err.status = res.status; throw err; } return d; }); },
        function () { var err = new Error("Connexion impossible : vérifiez votre réseau. Vos modifications restent dans cette page."); err.network = true; throw err; });
  }
  function matchError(m) { var hit = null; Object.keys(controls).forEach(function (id) { if (!hit && m.indexOf(controls[id].label) === 0) hit = id; }); return hit; }
  var timer = null, iframe = $("[data-st-iframe]");
  function afterChange() { setState(); renderGuide(); renderContrast(); schedulePreview(); }
  function schedulePreview() { clearTimeout(timer); timer = setTimeout(sendPreview, 240); }
  function sendPreview() {
    if (!CAN || hasErrors()) return;
    var mine = ++seq, w = Object.assign({}, outside(), work());
    post("/rendu", { changes: w }).then(function (r) {
      if (mine < seq) return;
      warnings = r.warnings || []; hideBanner(); renderContrast();
      if (r.assets && typeof r.assets.faces === "string") faceStyle.textContent = r.assets.faces; else if (r.assets && typeof r.assets.appearanceCss === "string") faceStyle.textContent = (r.assets.appearanceCss.match(/@font-face[^}]*}/g) || []).join("\n");
      if (pageTabOn()) { if (r.structural) reloadFrame(); else applyAssets(r.assets); }
    }, function (e) {
      if (mine < seq) return;
      if (e.network) { showBanner(e.message); return; }
      var id = matchError(e.message); if (id) { errors[id] = e.message; showError(id); } else showBanner(e.message); setState();
    });
  }
  // Les réglages du brouillon qui ne font pas partie de cet écran (ajoutés par la Direction artistique, par exemple) sont conservés tels quels dans l'aperçu et l'enregistrement
  var outsideChanges = clone(boot.outside || {});
  function outside() { return outsideChanges; }

  function frameDoc() { try { return iframe.contentDocument; } catch (e) { return null; } }
  function styleEl(doc, id) { var el = doc.getElementById(id); if (!el) { el = doc.createElement("style"); el.id = id; doc.head.appendChild(el); } return el; }
  function applyAssets(a) {
    var doc = frameDoc(); if (!doc || !doc.head || !a) return;
    if (typeof a.appearanceCss === "string") styleEl(doc, "kw-appearance").textContent = a.appearanceCss;
    if (typeof a.theme === "string") styleEl(doc, "kw-site-theme").textContent = a.theme;
    if (typeof a.custom === "string") styleEl(doc, "kw-site-custom").textContent = a.custom;
    if (typeof a.faces === "string") styleEl(doc, "kw-site-faces").textContent = a.faces;
    if (typeof a.bodyStyle === "string" && doc.body) a.bodyStyle.split(";").forEach(function (d) { var i = d.indexOf(":"); if (i > 0) doc.body.style.setProperty(d.slice(0, i).trim(), d.slice(i + 1).trim()); });
  }
  var withParam = function (url) { var b = url.split("#")[0], hs = url.indexOf("#") >= 0 ? url.slice(url.indexOf("#")) : ""; return b.replace(/([?&])kwcustom=1(&|$)/, "$1").replace(/[?&]$/, "") + (b.indexOf("?") >= 0 ? "&" : "?") + "kwcustom=1" + hs; };
  function pageTabOn() { return $('[data-st-ptab="page"]').getAttribute("aria-selected") === "true"; }
  function reloadFrame() { try { iframe.contentWindow.location.reload(); } catch (e) { var s = $("[data-st-page-select]"); if (s.value) iframe.src = withParam(s.value); } }
  iframe.addEventListener("load", function () {
    var doc = frameDoc(); if (!doc) return;
    doc.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (!a) return; var href = a.getAttribute("href") || ""; if (href.charAt(0) === "#") return; e.preventDefault(); }, true);
    doc.addEventListener("submit", function (e) { e.preventDefault(); }, true);
  });
  (function () {
    var sel = $("[data-st-page-select]");
    if (!boot.previews.length) { sel.hidden = true; $("[data-st-page-empty]").hidden = false; iframe.hidden = true; return; }
    boot.previews.forEach(function (p) { sel.appendChild(h("option", { value: p.url, text: p.label })); });
    sel.addEventListener("change", function () { iframe.src = withParam(sel.value); });
  })();
  $$("[data-st-ptab]").forEach(function (b) {
    b.addEventListener("click", function () {
      var which = b.getAttribute("data-st-ptab");
      $$("[data-st-ptab]").forEach(function (x) { x.setAttribute("aria-selected", String(x === b)); });
      $("[data-st-guide]").hidden = which !== "guide"; $("[data-st-guide]").parentNode.querySelector(".mk-st-page").hidden = which !== "page";
      if (which === "page" && !iframe.getAttribute("src") && boot.previews.length) { iframe.src = withParam($("[data-st-page-select]").value || boot.previews[0].url); }
      sendPreview();
    });
  });
  // Appareils : la largeur simulée (tablette 768 px, mobile 390 px) est celle de la page affichée ; si la colonne est plus étroite, le cadre est réduit (échelle), jamais déformé
  var stage = $("[data-st-stage]"), wrap = $("[data-st-stagewrap]"), DEVICE_W = { desktop: 0, tablet: 768, mobile: 390 };
  function fit() {
    var d = stage.getAttribute("data-device"), w = DEVICE_W[d], avail = wrap.clientWidth || 1;
    if (!w) { stage.style.width = "100%"; stage.style.transform = "none"; wrap.style.height = "auto"; return; }
    var scale = Math.min(1, avail / w);
    stage.style.width = w + "px"; stage.style.transform = scale < 1 ? "scale(" + scale + ")" : "none"; stage.setAttribute("data-scale", scale.toFixed(3));
    wrap.style.height = Math.ceil(stage.offsetHeight * scale) + "px";
  }
  if (window.ResizeObserver) { new ResizeObserver(fit).observe(wrap); new ResizeObserver(fit).observe(stage); }
  window.addEventListener("resize", fit);
  $$("[data-st-device]").forEach(function (b) { b.addEventListener("click", function () { stage.setAttribute("data-device", b.getAttribute("data-st-device")); $$("[data-st-device]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); fit(); say("Aperçu : " + b.textContent + "."); }); });

  // ---------- Brouillon, publication ----------
  function saveDraft() {
    if (busy || !CAN || hasErrors() || !dirty() || conflict) return Promise.resolve(false);
    busy = "save"; setState(); var w = Object.assign({}, outside(), work());
    return post("/brouillon", { changes: w, rev: rev }).then(function (r) { rev = r.draft.rev; saved = clone(work()); busy = false; hideBanner(); setState(); say("Brouillon enregistré."); return true; },
      function (e) { busy = false; if (/modifié depuis|supprimé ou publié/.test(e.message)) { conflict = true; showBanner(e.message, "Recharger la page", function () { location.reload(); }); } else { var id = matchError(e.message); if (id) { errors[id] = e.message; showError(id); } showBanner(e.message, e.network ? "Réessayer" : null, e.network ? saveDraft : null); } setState(); return false; });
  }
  function publish() {
    if (busy || !boot.can.publish || hasErrors() || pending() === 0 || conflict) return;
    var n = pending(), o = Object.keys(outside()).length;
    if (!confirm("Publier " + n + " réglage" + (n > 1 ? "s" : "") + " de style sur le site « " + boot.siteName + " » ? Ils seront visibles par tous les visiteurs." + (o ? "\n\nLe brouillon contient aussi " + o + " réglage" + (o > 1 ? "s" : "") + " hors de cet écran (Direction artistique…) : ils seront publiés en même temps." : ""))) return;
    (dirty() ? saveDraft() : Promise.resolve(true)).then(function (ok) {
      if (!ok) return;
      busy = "publish"; setState();
      post("/publier", { rev: rev }).then(function (r) {
        Object.keys(r.live || {}).forEach(function (id) { if (controls[id]) live[id] = r.live[id]; }); Object.keys(r.values || {}).forEach(function (id) { if (controls[id]) values[id] = r.values[id]; });
        saved = {}; rev = 0; undo = []; redo = []; errors = {}; outsideChanges = {}; boot.history = r.history || boot.history; busy = false; hideBanner(); renderBody(); renderGuide(); setState(); say("Publié : le site public utilise maintenant ces styles."); if (pageTabOn()) reloadFrame();
      }, function (e) { busy = false; showBanner(e.message); setState(); });
    });
  }
  function discard() {
    if (!confirm("Abandonner le brouillon ? Les réglages non publiés (enregistrés ou non) seront perdus.")) return;
    post("/annuler", {}).then(function () { values = clone(live); saved = {}; rev = 0; undo = []; redo = []; errors = {}; outsideChanges = {}; hideBanner(); renderBody(); renderGuide(); renderContrast(); setState(); say("Brouillon abandonné."); if (pageTabOn()) reloadFrame(); }, function (e) { showBanner(e.message); });
  }
  function restoreVersion(id) { post("/restaurer", { version: id }).then(function () { say("Anciennes valeurs placées dans le brouillon : rechargement."); setTimeout(function () { location.reload(); }, 500); }, function (e) { showBanner(e.message); }); }
  $("[data-st-save]").addEventListener("click", saveDraft); $("[data-st-publish]").addEventListener("click", publish); $("[data-st-discard]").addEventListener("click", discard);
  document.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveDraft(); } });

  // ---------- Démarrage ----------
  if (boot.stale) showBanner("Le brouillon enregistré n'est plus applicable (" + boot.stale + ") : il est ignoré.");
  if (boot.readOnly) showBanner("Ce site est archivé ou supprimé : consultation seule.");
  if (boot.outsideChanges) showBanner(boot.outsideChanges + " réglage" + (boot.outsideChanges > 1 ? "s" : "") + " du brouillon hors de cet écran (Direction artistique…) sont conservés tels quels.");
  $("[data-st-loading]").hidden = true; $("[data-st-layout]").hidden = false;
  renderTabs(); renderBody(); renderGuide(); setState(); fit();
})();

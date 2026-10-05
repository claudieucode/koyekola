/* Éditeur d'e-mails (v3) — Campagnes → Modèles d'e-mails.
   Zones : onglets (blocs, structure, médias, styles, message, vérification) · canevas = RENDU RÉEL de l'e-mail (aperçu
   serveur « annoté » : chaque bloc porte data-mk-block, un bloc incomplet s'affiche à sa place avec son problème) ·
   réglages du bloc sélectionné. Annuler / rétablir, glisser-déposer (blocs, réordonnancement, fichiers de l'ordinateur),
   médiathèque persistante (/marketing/medias), enregistrement automatique (jamais « Enregistré » si ce n'est pas vrai).
   L'état vit dans un objet JS ; le serveur valide, normalise et rend tout. Aucun texte saisi n'est inséré comme HTML
   (textContent / value) ; seuls les SVG du registre d'icônes (fournis par le serveur) et le rendu de l'aperçu
   (produit et assaini par le serveur) le sont. */
(function () {
  "use strict";
  var dataNode = document.getElementById("mk-editor-data");
  if (!dataNode) return;
  var data = JSON.parse(dataNode.textContent);
  var readOnly = !!data.readOnly;
  var state = data.template;
  state.footer = state.footer || { text: "" };
  state.theme = state.theme || {};
  state.category = state.category || "";
  var ICONS = data.icons || {};
  var BLOCKS = data.blocks || {};
  var $ = function (id) { return document.getElementById(id); };

  var TYPES = {
    heading: function () { return { type: "heading", text: "Votre titre", level: 2, align: "left" }; },
    text: function () { return { type: "text", html: "<p>Votre texte ici.</p>" }; },
    image: function () { return { type: "image", src: "", alt: "", decorative: false, width: 552, align: "center" }; },
    button: function () { return { type: "button", label: "Cliquez ici", url: "", align: "center" }; },
    divider: function () { return { type: "divider" }; },
    spacer: function () { return { type: "spacer", height: 24 }; },
    columns: function () { return { type: "columns", leftHtml: "<p>Colonne de gauche</p>", rightHtml: "<p>Colonne de droite</p>", ratio: "50-50" }; },
    link: function () { return { type: "link", label: "En savoir plus", url: "", align: "left" }; },
    coupon: function () { return { type: "coupon", code: "BIENVENUE10", title: "-10 % sur votre première formation", details: "" }; },
    quote: function () { return { type: "quote", text: "Une citation inspirante.", author: "" }; },
    list: function () { return { type: "list", style: "bullets", items: ["Premier élément", "Deuxième élément"] }; },
    social: function () { return { type: "social", align: "center", links: [{ network: "facebook", url: "" }] }; },
    video: function () { return { type: "video", url: "", thumbnail: "", title: "", width: 552, align: "center" }; },
    course: function () { return { type: "course", courseId: data.courses && data.courses.length ? data.courses[0].id : undefined, cta: "Voir la formation" }; },
    posts: function () { return { type: "posts", count: 3, layout: "excerpt", showImages: true, cta: "Lire la suite" }; }
  };
  var NETWORKS = [["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"], ["website", "Site web"]];
  var LIST_STYLES = [["bullets", "Puces"], ["numbers", "Numéros"], ["checks", "Coches ✓"]];
  var ALIGNS = [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]];
  // Réglages mobiles possibles selon le type (même liste que le serveur : src/marketing/templates/blocks.js MOBILE_KEYS)
  var MOBILE_FIELDS = { "*": ["padTop", "padBottom", "padLeft", "padRight"], heading: ["fontSize", "align"], text: ["fontSize", "align"], button: ["fontSize", "align", "fullWidth"], image: ["width", "align"], video: ["width", "align"], spacer: ["height"], social: ["align"], link: ["fontSize", "align"], quote: ["fontSize", "align"], list: ["fontSize", "align"] };
  var BORDER_STYLES = [["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]];
  // Formes du bouton : arrondi prédéfini (le rayon reste la seule donnée enregistrée)
  var SHAPES = [["square", "Carré", 0], ["soft", "Légèrement arrondi", 4], ["rounded", "Arrondi", 12], ["pill", "Ovale", 40]];
  var THEME_DEFAULTS = { background: "#f3f8fc", contentBackground: "#ffffff", textColor: "#10222f", accent: "#0277b6", fontFamily: "system", secondary: "#d5e3ee", maxWidth: 600, radius: 4, spacing: "normal" };
  // Ensembles prêts à l'emploi : plusieurs vrais blocs insérés d'un coup (chacun ensuite modifiable séparément)
  var PRESETS = {
    gif: function () { return [{ type: "image", src: "", alt: "", decorative: false, width: 400, align: "center" }]; },
    cta: function () { return [{ type: "heading", text: "Prêt à commencer ?", level: 2, align: "center" }, { type: "text", html: "<p style=\"text-align:center\">Rejoignez la formation et progressez à votre rythme.</p>" }, { type: "button", label: "Je m'inscris", url: "", align: "center" }]; },
    offer: function () { return [{ type: "heading", text: "Une offre pour vous", level: 2, align: "center" }, { type: "coupon", code: "OFFRE20", title: "-20 % sur toutes les formations", details: "Valable 7 jours." }, { type: "button", label: "En profiter", url: "", align: "center" }]; }
  };
  var FONT_LABELS = { system: "Sans empattement (système)", arial: "Arial", verdana: "Verdana", trebuchet: "Trebuchet MS", tahoma: "Tahoma", serif: "Georgia", times: "Times New Roman", courier: "Courier New" };

  var dirty = false;
  var saving = false;
  var lastFocused = null;
  var selectedId = null;
  var blockErrors = [];   // blocs incomplets signalés par l'aperçu serveur [{ id, message }]
  var lintWarnings = [];  // alertes de qualité (objet, préheader, variables…)

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) node.setAttribute(k, attrs[k] === true ? "" : attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function iconSpan(name, cls) { var s = el("span", { "class": cls || "mk-ico", "aria-hidden": "true" }); s.innerHTML = ICONS[name] || ""; return s; } // SVG du registre fixe (serveur)
  function iconBtn(name, label, onClick, extra) {
    var b = el("button", Object.assign({ type: "button", "class": "mk-b-icon", "aria-label": label, "data-tip": label }, extra || {}));
    b.appendChild(iconSpan(name));
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function genId() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function announce(text) { var live = $("mk-live"); if (live) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 30); } }
  function toast(text, type) { if (typeof window.mkToast === "function") window.mkToast(text, type || "info"); else announce(text); }
  function label(block) { return BLOCKS[block.type] ? BLOCKS[block.type].label : block.type; }
  function indexOfId(id) { for (var i = 0; i < state.blocks.length; i++) if (state.blocks[i].id === id) return i; return -1; }
  function blockById(id) { var i = indexOfId(id); return i === -1 ? null : state.blocks[i]; }

  // ---------- État d'enregistrement (jamais « Enregistré » si le serveur ne l'a pas confirmé) ----------
  var statusEl = $("mk-status"), retryBtn = $("mk-retry");
  function status(kind, text) {
    statusEl.textContent = text;
    statusEl.title = text;
    statusEl.setAttribute("data-state", kind); // saved | dirty | saving | error | invalid
    if (retryBtn) retryBtn.hidden = kind !== "error";
  }
  function savedLabel() { return "Enregistré · version " + state.version; }

  // ---------- Historique (annuler / rétablir) ----------
  var history = [], pos = -1, savedPos = 0, lastKey = null, lastTime = 0, MAX_HISTORY = 100;
  var undoBtn = $("mk-undo"), redoBtn = $("mk-redo");
  function snapshot() { return JSON.stringify({ name: state.name, kind: state.kind, category: state.category, subject: state.subject, preheader: state.preheader, theme: state.theme, footer: state.footer, blocks: state.blocks }); }
  function updateHistoryUi() { if (undoBtn) undoBtn.disabled = pos <= 0; if (redoBtn) redoBtn.disabled = pos >= history.length - 1; }
  function record(key) {
    var snap = snapshot();
    if (pos >= 0 && history[pos] === snap) return;
    var now = Date.now();
    if (key && key === lastKey && now - lastTime < 1000 && pos === history.length - 1 && pos > 0 && pos !== savedPos) history[pos] = snap;
    else {
      history = history.slice(0, pos + 1);
      history.push(snap);
      if (history.length > MAX_HISTORY) { history.shift(); if (savedPos > 0) savedPos--; }
      pos = history.length - 1;
    }
    lastKey = key; lastTime = now;
    updateHistoryUi();
  }
  function restore(index, message) {
    if (inline) inline = null; // le canevas est reconstruit depuis l'état restauré
    pos = index; lastKey = null;
    var snap = JSON.parse(history[pos]);
    ["name", "kind", "category", "subject", "preheader", "theme", "footer", "blocks"].forEach(function (k) { state[k] = snap[k]; });
    state.footer = state.footer || { text: "" }; state.theme = state.theme || {};
    if (selectedId && indexOfId(selectedId) === -1) selectedId = null;
    syncSettings(); renderStructure(); renderProps(); updateHistoryUi(); applyDesktopWidth();
    dirty = pos !== savedPos;
    if (dirty) { status("dirty", "Modifications non enregistrées"); scheduleAutosave(); } else status("saved", savedLabel());
    schedulePreview();
    announce(message);
  }
  function undo() { if (pos > 0) restore(pos - 1, "Modification annulée."); }
  function redo() { if (pos < history.length - 1) restore(pos + 1, "Modification rétablie."); }
  if (undoBtn) undoBtn.addEventListener("click", undo);
  if (redoBtn) redoBtn.addEventListener("click", redo);
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey)) return;
    var k = e.key.toLowerCase();
    if (k === "s") { e.preventDefault(); if (!readOnly) save({ manual: true }); return; }
    if (readOnly) return;
    var t = e.target, editing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (editing) return; // dans un champ, Ctrl+Z reste celui du navigateur (l'historique suit la saisie)
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
  });

  // Toute modification : historique, aperçu, enregistrement automatique. structural : liste / réglages à redessiner.
  function changed(structural) {
    dirty = true;
    status("dirty", "Modifications non enregistrées");
    var a = document.activeElement;
    var typing = a && (a.tagName === "TEXTAREA" || a.isContentEditable || (a.tagName === "INPUT" && a.type !== "checkbox"));
    record(inlineTyping && inline ? "inline-" + inline.id : typing && a.id ? a.id : null); // frappe dans l'e-mail : une étape d'annulation par rafale
    if (structural) renderStructure();
    else refreshStructureLabels();
    schedulePreview();
    scheduleAutosave();
    if (toolbar) toolbar.sync();
  }

  // ---------- Contenu envoyé au serveur ----------
  function intOrUndefined(v) { var n = parseInt(v, 10); return isNaN(n) ? undefined : n; }
  var hexOk = function (v) { return typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v); };
  function typo(b, o) {
    if (b.font) o.font = b.font;
    var fs = intOrUndefined(b.fontSize); if (fs !== undefined) o.fontSize = fs;
    if (typeof b.lineHeight === "number") o.lineHeight = b.lineHeight;
    if (hexOk(b.color)) o.color = b.color;
    emph(b, o);
  }
  function emph(b, o) {
    if (b.weight === "normal" || b.weight === "bold") o.weight = b.weight;
    if (b.italic) o.italic = true;
    var ls = intOrUndefined(b.letterSpacing); if (ls) o.letterSpacing = ls;
  }
  function cleanBox(b, o) {
    if (!b.box) return;
    var x = {}, t = intOrUndefined(b.box.padTop), bt = intOrUndefined(b.box.padBottom);
    if (t !== undefined) x.padTop = t;
    if (bt !== undefined) x.padBottom = bt;
    var pl = intOrUndefined(b.box.padLeft), pr = intOrUndefined(b.box.padRight);
    if (pl !== undefined) x.padLeft = pl;
    if (pr !== undefined) x.padRight = pr;
    if (hexOk(b.box.background)) x.background = b.box.background;
    var bd = b.box.border;
    if (bd) {
      var y = {};
      if (bd.style && bd.style !== "none") { y.style = bd.style; var bw = intOrUndefined(bd.width); if (bw !== undefined) y.width = bw; if (hexOk(bd.color)) y.color = bd.color; }
      var rr = intOrUndefined(bd.radius); if (rr) y.radius = rr;
      if (Object.keys(y).length) x.border = y;
    }
    if (b.box.hideMobile) x.hideMobile = true;
    if (b.box.hideDesktop) x.hideDesktop = true;
    if (Object.keys(x).length) o.box = x;
  }
  // Réglages mobiles : seulement les valeurs saisies (vide = comme sur ordinateur)
  function cleanMobile(b, o) {
    if (!b.mobile) return;
    var m = {}, keys = MOBILE_FIELDS["*"].concat(MOBILE_FIELDS[b.type] || []);
    keys.forEach(function (k) {
      var v = b.mobile[k];
      if (k === "align") { if (v === "left" || v === "center" || v === "right") m.align = v; }
      else if (k === "fullWidth") { if (v === true) m.fullWidth = true; }
      else { var n = intOrUndefined(v); if (n !== undefined) m[k] = n; }
    });
    if (Object.keys(m).length) o.mobile = m;
  }
  // Ce qui part au serveur : uniquement les champs connus de chaque type (le serveur revalide et nettoie tout)
  function cleanBlock(b) {
    var o = { id: b.id, type: b.type };
    if (b.type === "heading") {
      o.text = b.text || ""; o.level = intOrUndefined(b.level) || 2; o.align = b.align || "left"; typo(b, o); delete o.lineHeight;
      if (b.href && b.href.trim()) { o.href = b.href.trim(); if (b.newTab) o.newTab = true; }
    }
    else if (b.type === "text") { if (typeof b.html === "string") o.html = b.html; else o.markdown = b.markdown || ""; typo(b, o); if (b.align) o.align = b.align; }
    else if (b.type === "image") {
      o.src = b.src || ""; o.alt = b.alt || ""; o.decorative = !!b.decorative; o.align = b.align || "left";
      var w = intOrUndefined(b.width); if (w !== undefined) o.width = w;
      if (b.href && b.href.trim()) { o.href = b.href.trim(); if (b.newTab) o.newTab = true; }
      var ir = intOrUndefined(b.radius); if (ir) o.radius = ir;
    } else if (b.type === "button") {
      o.label = b.label || ""; o.url = b.url || ""; o.align = b.align || "center";
      if (b.color) o.color = b.color;
      if (hexOk(b.textColor)) o.textColor = b.textColor;
      var bf = intOrUndefined(b.fontSize); if (bf !== undefined) o.fontSize = bf;
      var br = intOrUndefined(b.radius); if (br !== undefined) o.radius = br;
      if (b.size && b.size !== "m") o.size = b.size;
      if (b.fullWidth) o.fullWidth = true;
      if (b.newTab) o.newTab = true;
      emph(b, o);
      if (b.borderStyle && b.borderStyle !== "none") { o.borderStyle = b.borderStyle; var bbw = intOrUndefined(b.borderWidth); if (bbw !== undefined) o.borderWidth = bbw; if (hexOk(b.borderColor)) o.borderColor = b.borderColor; }
    } else if (b.type === "divider") {
      if (b.style && b.style !== "solid") o.style = b.style;
      var th = intOrUndefined(b.thickness); if (th !== undefined) o.thickness = th;
      var dw = intOrUndefined(b.width); if (dw !== undefined) o.width = dw;
      if (hexOk(b.color)) o.color = b.color;
      if (b.align && b.align !== "center") o.align = b.align;
    } else if (b.type === "spacer") { var h = intOrUndefined(b.height); if (h !== undefined) o.height = h; }
    else if (b.type === "columns") {
      if (typeof b.leftHtml === "string" || typeof b.rightHtml === "string") { o.leftHtml = b.leftHtml || ""; o.rightHtml = b.rightHtml || ""; } else { o.left = b.left || ""; o.right = b.right || ""; }
      if (b.ratio && b.ratio !== "50-50") o.ratio = b.ratio;
      if (b.stack === false) o.stack = false;
      else if (b.reverse) o.reverse = true;
    }
    else if (b.type === "quote") { o.text = b.text || ""; if (b.author && b.author.trim()) o.author = b.author; typo(b, o); if (b.italic === false) o.italic = false; if (b.align) o.align = b.align; }
    else if (b.type === "list") { o.style = b.style || "bullets"; o.items = (b.items || []).slice(); typo(b, o); if (b.align) o.align = b.align; }
    else if (b.type === "social") {
      o.align = b.align || "center"; o.links = (b.links || []).map(function (l) { return { network: l.network, url: l.url || "" }; });
      if (b.display === "buttons") { o.display = "buttons"; if (b.colors === "accent") o.colors = "accent"; }
    }
    else if (b.type === "video") {
      o.url = b.url || ""; o.title = b.title || ""; o.align = b.align || "center";
      if (b.thumbnail && b.thumbnail.trim()) o.thumbnail = b.thumbnail.trim();
      var vw = intOrUndefined(b.width); if (vw !== undefined) o.width = vw;
    } else if (b.type === "course") {
      o.courseId = intOrUndefined(b.courseId); o.cta = b.cta || "Voir la formation";
      if (b.snapshot) o.snapshot = b.snapshot;
      if (b.refresh) o.refresh = true;
    } else if (b.type === "posts") {
      var pc = intOrUndefined(b.count); o.count = pc && pc >= 1 && pc <= 10 ? pc : 3;
      o.layout = b.layout === "titles" ? "titles" : "excerpt"; o.showImages = b.showImages !== false; o.cta = b.cta || "Lire la suite";
      if (b.items) o.items = b.items;
      if (b.refresh) o.refresh = true;
    } else if (b.type === "link") { o.label = b.label || ""; o.url = b.url || ""; o.align = b.align || "left"; if (b.newTab) o.newTab = true; typo(b, o); }
    else if (b.type === "coupon") { o.code = b.code || ""; if (b.title && b.title.trim()) o.title = b.title; if (b.details && b.details.trim()) o.details = b.details; if (hexOk(b.color)) o.color = b.color; }
    cleanBox(b, o);
    cleanMobile(b, o);
    if (b.showIf && b.showIf.trim()) o.showIf = b.showIf.trim();
    if (b.hidden) o.hidden = true;
    return o;
  }
  function payload() {
    return { name: state.name, kind: state.kind, category: state.category || "", subject: state.subject, preheader: state.preheader, theme: state.theme, footer: { text: state.footer.text || "" }, blocks: state.blocks.map(cleanBlock) };
  }

  // ---------- Variables ----------
  function insertAtCursor(input, text) {
    if (!input) return false;
    if (input.isContentEditable) {
      input.focus();
      if (input._range) { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(input._range); }
      document.execCommand("insertText", false, text);
      return true;
    }
    var start = input.selectionStart == null ? input.value.length : input.selectionStart;
    var end = input.selectionEnd == null ? input.value.length : input.selectionEnd;
    input.setRangeText(text, start, end, "end");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    return true;
  }
  document.addEventListener("focusin", function (e) { if (e.target && e.target.matches && e.target.matches("[data-var-target]")) lastFocused = e.target; });
  function fillVariableSelect(sel) {
    var groups = {};
    (data.variables || []).forEach(function (v) {
      if (!groups[v.group]) { groups[v.group] = el("optgroup", { label: v.group }); sel.appendChild(groups[v.group]); }
      groups[v.group].appendChild(el("option", { value: v.path }, v.label + "  ·  {{" + v.path + "}}"));
    });
    sel.addEventListener("change", function () {
      if (!sel.value) return;
      if (!lastFocused || !document.body.contains(lastFocused)) announce("Placez d'abord le curseur dans un champ de texte.");
      else insertAtCursor(lastFocused, "{{" + sel.value + "}}");
      sel.value = "";
    });
  }
  if ($("mk-var")) fillVariableSelect($("mk-var"));

  // ---------- Champs d'un bloc ----------
  function group(labelText, control, hint) {
    var wrap = el("div", { "class": "field-group" });
    wrap.appendChild(el("label", { "for": control.id }, labelText));
    wrap.appendChild(control);
    if (hint) wrap.appendChild(el("span", { "class": "field-hint" }, hint));
    return wrap;
  }
  function markdownField(block, key, labelText, rows) {
    var wrap = el("div", { "class": "field-group" });
    var area = el("textarea", { id: "f-" + block.id + "-" + key, rows: String(rows || 6), maxlength: "10000", "data-var-target": "" });
    area.value = block[key] || "";
    if (readOnly) area.disabled = true;
    area.addEventListener("input", function () { block[key] = area.value; changed(); });
    wrap.appendChild(el("label", { "for": area.id }, labelText));
    if (!readOnly) {
      var tools = el("div", { "class": "mk-tools", role: "group", "aria-label": "Mise en forme : " + labelText });
      [["Gras", "**", "**", "texte"], ["Italique", "*", "*", "texte"], ["Lien", "[", "](https://)", "texte du lien"], ["Titre", "## ", "", "Titre"], ["Liste", "- ", "", "élément"]].forEach(function (t) {
        var b = el("button", { type: "button", "class": "mk-tools-btn" + (t[0] === "Gras" ? " is-bold" : t[0] === "Italique" ? " is-italic" : "") }, t[0]);
        b.addEventListener("click", function () {
          var s = area.selectionStart, e = area.selectionEnd, sel = area.value.slice(s, e) || t[3];
          var text = t[0] === "Liste" ? sel.split("\n").map(function (l) { return "- " + l; }).join("\n") : t[1] + sel + t[2];
          area.setRangeText(text, s, e, "end");
          area.dispatchEvent(new Event("input", { bubbles: true }));
          area.focus();
        });
        tools.appendChild(b);
      });
      wrap.appendChild(tools);
    }
    wrap.appendChild(area);
    wrap.appendChild(el("span", { "class": "field-hint" }, "Markdown : **gras**, *italique*, [lien](https://…), « - » pour une liste. Le HTML n'est pas accepté."));
    return wrap;
  }
  // ---------- Éditeur de texte riche ----------
  // Zone d'édition du navigateur (contenteditable) + barre d'outils. Le contenu est reconstruit nœud par nœud à partir
  // d'une liste fermée (jamais d'insertion HTML brute) ; le serveur le renettoie et le met en forme pour l'e-mail.
  var RICH_TAGS = { P: 1, H2: 1, H3: 1, H4: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, S: 1, STRIKE: 1, SUP: 1, SUB: 1, A: 1, UL: 1, OL: 1, LI: 1, BR: 1, SPAN: 1, BLOCKQUOTE: 1, DIV: 1, FONT: 1 };
  var RICH_STYLES = ["color", "background-color", "font-size", "text-align", "margin-left", "padding-left"];
  var SAFE_HREF = /^(https:\/\/|mailto:|\{\{\s*(unsubscribe_url|preferences_url|view_url)\s*\}\})/i;
  function importRich(node, into) {
    [].forEach.call(node.childNodes, function (n) {
      if (n.nodeType === 3) { into.appendChild(document.createTextNode(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      if (!RICH_TAGS[n.tagName]) { importRich(n, into); return; } // balise inconnue : on garde seulement son texte
      var tag = { B: "strong", I: "em", STRIKE: "s", DIV: "p", FONT: "span" }[n.tagName] || n.tagName.toLowerCase();
      var out = document.createElement(tag);
      RICH_STYLES.forEach(function (prop) { var v = n.style && n.style.getPropertyValue(prop); if (v) out.style.setProperty(prop, v); });
      if (n.tagName === "FONT" && n.getAttribute("color")) out.style.color = n.getAttribute("color");
      if (tag === "a") { var href = n.getAttribute("href") || ""; if (SAFE_HREF.test(href)) out.setAttribute("href", href); if (n.getAttribute("target") === "_blank") out.setAttribute("target", "_blank"); }
      importRich(n, out);
      into.appendChild(out);
    });
  }
  function setRich(editor, html) {
    editor.textContent = "";
    importRich(new DOMParser().parseFromString(String(html || ""), "text/html").body, editor);
    if (!editor.firstChild) editor.appendChild(el("p", {}, ""));
  }
  var FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];
  function richField(block, key, labelText, opts) {
    opts = opts || {};
    var wrap = el("div", { "class": "field-group mk-rich" });
    var id = "f-" + block.id + "-" + key;
    var lab = el("span", { "class": "mk-rich-label", id: id + "-label" }, labelText);
    wrap.appendChild(lab);
    var editor = el("div", { "class": "mk-rich-area", id: id, role: "textbox", "aria-multiline": "true", "aria-labelledby": id + "-label", "data-var-target": "", spellcheck: "true" });
    editor.contentEditable = readOnly ? "false" : "true";
    editor.style.minHeight = (opts.rows || 6) * 1.5 + "em";
    setRich(editor, block[key]);
    var sync = function () { block[key] = editor.innerHTML; changed(); };
    if (!readOnly) {
      var bar = el("div", { "class": "mk-rich-bar", role: "toolbar", "aria-label": "Mise en forme : " + labelText, "aria-controls": id });
      var more = el("div", { "class": "mk-rich-bar mk-rich-more", role: "toolbar", "aria-label": "Mise en forme avancée", hidden: true });
      var saveRange = function () { var sel = window.getSelection(); if (sel.rangeCount && editor.contains(sel.anchorNode)) editor._range = sel.getRangeAt(0).cloneRange(); };
      var restoreRange = function () { editor.focus(); if (editor._range) { var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(editor._range); } };
      var exec = function (cmd, value, css) { restoreRange(); document.execCommand("styleWithCSS", false, !!css); document.execCommand(cmd, false, value == null ? null : value); saveRange(); refresh(); sync(); };
      var states = [];
      var btn = function (target, icon, text, title, run, stateCmd) {
        var b = el("button", { type: "button", "class": "mk-rich-btn", "aria-label": title, "data-tip": title });
        if (stateCmd) b.setAttribute("aria-pressed", "false");
        if (icon) b.appendChild(iconSpan(icon)); else b.appendChild(el("span", { "class": "mk-rich-glyph", "aria-hidden": "true" }, text));
        b.addEventListener("mousedown", function (e) { e.preventDefault(); }); // garde la sélection dans la zone de texte
        b.addEventListener("click", run);
        if (stateCmd) states.push([b, stateCmd]);
        target.appendChild(b);
        return b;
      };
      var sep = function (target) { target.appendChild(el("span", { "class": "mk-rich-sep", "aria-hidden": "true" })); };
      var select = function (target, title, options, run) {
        var s = el("select", { "class": "mk-rich-select", "aria-label": title, title: title });
        options.forEach(function (o) { s.appendChild(el("option", { value: o[0] }, o[1])); });
        s.addEventListener("change", function () { if (s.value !== "") run(s.value); s.value = ""; });
        target.appendChild(s);
        return s;
      };
      var colorBtn = function (target, title, glyph, cmd) {
        var l = el("label", { "class": "mk-rich-btn mk-rich-color", title: title, "data-tip": title });
        l.appendChild(el("span", { "class": "mk-rich-glyph", "aria-hidden": "true" }, glyph));
        var c = el("input", { type: "color", "aria-label": title, value: cmd === "foreColor" ? "#d1121f" : "#fff3a0" });
        l.addEventListener("mousedown", saveRange);
        c.addEventListener("change", function () { exec(cmd, c.value, true); });
        l.appendChild(c); target.appendChild(l);
      };
      select(bar, "Style du paragraphe", [["", "Paragraphe"], ["p", "Texte normal"], ["h2", "Grand titre"], ["h3", "Titre moyen"], ["h4", "Petit titre"], ["blockquote", "Citation"]], function (v) { exec("formatBlock", "<" + v + ">"); });
      btn(bar, null, "B", "Gras (Ctrl+B)", function () { exec("bold"); }, "bold");
      btn(bar, null, "I", "Italique (Ctrl+I)", function () { exec("italic"); }, "italic");
      btn(bar, null, "U", "Souligné (Ctrl+U)", function () { exec("underline"); }, "underline");
      btn(bar, null, "S", "Barré", function () { exec("strikeThrough"); }, "strikeThrough");
      sep(bar);
      var linkBtn = btn(bar, "link", null, "Lien (Ctrl+K)", function () { openLink(); });
      var toggle = btn(bar, "moreHorizontal", null, "Plus d'options de mise en forme", function () { more.hidden = !more.hidden; toggle.setAttribute("aria-expanded", String(!more.hidden)); });
      toggle.setAttribute("aria-expanded", "false");
      bar.appendChild(el("span", { "class": "mk-rich-break", "aria-hidden": "true" }));
      btn(bar, "list", null, "Liste à puces", function () { exec("insertUnorderedList"); }, "insertUnorderedList");
      btn(bar, null, "1.", "Liste numérotée", function () { exec("insertOrderedList"); }, "insertOrderedList");
      sep(bar);
      select(bar, "Alignement", [["", "Aligner"], ["justifyLeft", "À gauche"], ["justifyCenter", "Centré"], ["justifyRight", "À droite"], ["justifyFull", "Justifié"]], function (v) { exec(v, null, true); });
      colorBtn(bar, "Couleur du texte", "A", "foreColor");
      var vars = el("select", { "class": "mk-rich-select", "aria-label": "Insérer une variable", title: "Insérer une variable" });
      vars.appendChild(el("option", { value: "" }, "{ } Variable"));
      fillVariableOptions(vars);
      vars.addEventListener("mousedown", saveRange);
      vars.addEventListener("change", function () { if (vars.value) { restoreRange(); document.execCommand("insertText", false, "{{" + vars.value + "}}"); saveRange(); sync(); } vars.value = ""; });
      bar.appendChild(vars);
      select(more, "Taille du texte", [["", "Taille"]].concat(FONT_SIZES.map(function (n) { return [String(n), n + " px"]; })), function (v) {
        exec("fontSize", "7"); // le navigateur marque la sélection (<font size=7>) : remplacée par une vraie taille en pixels
        [].forEach.call(editor.querySelectorAll('font[size="7"]'), function (f) { var sp = document.createElement("span"); sp.style.fontSize = v + "px"; while (f.firstChild) sp.appendChild(f.firstChild); f.parentNode.replaceChild(sp, f); });
        sync();
      });
      colorBtn(more, "Couleur de fond (surlignage)", "▮", "hiliteColor");
      btn(more, null, "⇥", "Augmenter le retrait", function () { exec("indent", null, true); });
      btn(more, null, "⇤", "Diminuer le retrait", function () { exec("outdent", null, true); });
      btn(more, null, "x²", "Exposant", function () { exec("superscript"); }, "superscript");
      btn(more, null, "x₂", "Indice", function () { exec("subscript"); }, "subscript");
      btn(more, null, "Tx", "Effacer la mise en forme", function () { exec("removeFormat"); exec("unlink"); });
      btn(more, "undo", null, "Annuler la saisie", function () { exec("undo"); });
      btn(more, "redo", null, "Rétablir la saisie", function () { exec("redo"); });
      wrap.appendChild(bar); wrap.appendChild(more);
      // Lien : adresse (https://, mailto: ou lien système), nouvel onglet ; validé avant d'être appliqué
      var linkBox = el("div", { "class": "mk-rich-link", hidden: true });
      var linkInput = el("input", { type: "text", id: id + "-href", placeholder: "https://… ou mailto:…", "aria-label": "Adresse du lien", maxlength: "2000" });
      var linkNew = el("input", { type: "checkbox", id: id + "-newtab" });
      var linkNewLab = el("label", { "class": "checkbox-row", "for": id + "-newtab" }); linkNewLab.appendChild(linkNew); linkNewLab.appendChild(document.createTextNode(" Nouvel onglet"));
      var linkOk = el("button", { type: "button", "class": "btn btn-primary btn-sm" }, "Appliquer");
      var linkDel = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Retirer le lien");
      var linkMsg = el("p", { "class": "mk-rich-link-msg", role: "alert" });
      linkBox.appendChild(linkInput); linkBox.appendChild(linkNewLab); linkBox.appendChild(linkOk); linkBox.appendChild(linkDel); linkBox.appendChild(linkMsg);
      var currentLink = function () { var sel = window.getSelection(); var n = sel.rangeCount ? sel.anchorNode : null; while (n && n !== editor) { if (n.nodeType === 1 && n.tagName === "A") return n; n = n.parentNode; } return null; };
      function openLink() {
        saveRange();
        var a = currentLink();
        linkInput.value = a ? a.getAttribute("href") || "" : ""; linkNew.checked = !!(a && a.getAttribute("target") === "_blank");
        linkMsg.textContent = ""; linkBox.hidden = false; linkInput.focus();
      }
      linkOk.addEventListener("click", function () {
        var url = linkInput.value.trim();
        if (!SAFE_HREF.test(url) || /\s/.test(url)) { linkMsg.textContent = "Adresse invalide : commencez par https:// ou mailto: (ou {{unsubscribe_url}})."; linkInput.focus(); return; }
        restoreRange();
        var sel = window.getSelection();
        if (sel.isCollapsed && !currentLink()) document.execCommand("insertText", false, url); // pas de texte choisi : l'adresse devient le texte
        if (sel.isCollapsed && !currentLink()) { var r = sel.getRangeAt(0); r.setStart(r.startContainer, Math.max(0, r.startOffset - url.length)); sel.removeAllRanges(); sel.addRange(r); }
        document.execCommand("createLink", false, url);
        var a = currentLink() || editor.querySelector('a[href="' + url.replace(/"/g, "") + '"]');
        if (a) { if (linkNew.checked) a.setAttribute("target", "_blank"); else a.removeAttribute("target"); }
        linkBox.hidden = true; saveRange(); sync(); announce("Lien appliqué.");
      });
      linkDel.addEventListener("click", function () { restoreRange(); var a = currentLink(); if (a) { var r = document.createRange(); r.selectNodeContents(a); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); } document.execCommand("unlink"); linkBox.hidden = true; sync(); announce("Lien retiré."); });
      linkInput.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); linkOk.click(); } else if (e.key === "Escape") { e.stopPropagation(); linkBox.hidden = true; editor.focus(); } });
      wrap.appendChild(linkBox);
      // État des boutons (gras actif…) selon la position du curseur
      var refresh = function () { states.forEach(function (s) { var on = false; try { on = document.queryCommandState(s[1]); } catch (e) { on = false; } s[0].setAttribute("aria-pressed", on ? "true" : "false"); }); linkBtn.setAttribute("aria-pressed", currentLink() ? "true" : "false"); };
      editor._richRefresh = function () { saveRange(); refresh(); };
      editor.addEventListener("keydown", function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLink(); }
      });
    }
    editor.addEventListener("focus", function () { try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { /* navigateur ancien */ } });
    // Collage : texte seul (les mises en forme d'autres logiciels cassent les e-mails) — paragraphes conservés
    editor.addEventListener("paste", function (e) {
      if (readOnly) return;
      var text = (e.clipboardData || window.clipboardData).getData("text/plain");
      e.preventDefault();
      document.execCommand("insertText", false, text);
    });
    editor.addEventListener("input", sync);
    editor.addEventListener("blur", function () { var sel = window.getSelection(); if (sel.rangeCount && editor.contains(sel.anchorNode)) editor._range = sel.getRangeAt(0).cloneRange(); });
    wrap.appendChild(editor);
    if (opts.hint !== false) wrap.appendChild(el("span", { "class": "field-hint" }, "Sélectionnez du texte puis choisissez une mise en forme. Les variables {{…}} sont remplacées pour chaque destinataire."));
    return wrap;
  }
  document.addEventListener("selectionchange", function () { var a = document.activeElement; if (a && a._richRefresh) a._richRefresh(); }); // un seul écouteur pour toutes les zones
  function fillVariableOptions(sel) {
    var groups = {};
    (data.variables || []).forEach(function (v) {
      if (!groups[v.group]) { groups[v.group] = el("optgroup", { label: v.group }); sel.appendChild(groups[v.group]); }
      groups[v.group].appendChild(el("option", { value: v.path }, v.label + "  ·  {{" + v.path + "}}"));
    });
  }
  function itemsField(block) {
    var area = el("textarea", { id: "f-" + block.id + "-items", rows: "5", maxlength: "5000", "data-var-target": "" });
    area.value = (block.items || []).join("\n");
    if (readOnly) area.disabled = true;
    area.addEventListener("input", function () { block.items = area.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean); changed(); });
    return group("Éléments (un par ligne, 20 au plus)", area, "Chaque ligne devient un élément de la liste. Les variables sont permises.");
  }
  function socialField(block) {
    var wrap = el("div", { "class": "mk-social" });
    block.links = block.links || [];
    block.links.forEach(function (link, i) {
      var row = el("div", { "class": "mk-social-row" });
      var sel = el("select", { id: "f-" + block.id + "-net-" + i, "aria-label": "Réseau du lien " + (i + 1) });
      NETWORKS.forEach(function (n) { sel.appendChild(el("option", { value: n[0] }, n[1])); });
      sel.value = link.network; if (readOnly) sel.disabled = true;
      sel.addEventListener("change", function () { link.network = sel.value; changed(); });
      var url = el("input", { type: "text", id: "f-" + block.id + "-url-" + i, maxlength: "2000", placeholder: "https://…", "aria-label": "Adresse du lien " + (i + 1) });
      url.value = link.url || ""; if (readOnly) url.disabled = true;
      url.addEventListener("input", function () { link.url = url.value; changed(); });
      row.appendChild(sel); row.appendChild(url);
      if (!readOnly) {
        var rm = iconBtn("close", "Retirer le lien " + (i + 1), function () { block.links.splice(i, 1); renderProps(); changed(); announce("Lien retiré."); });
        row.appendChild(rm);
      }
      wrap.appendChild(row);
    });
    if (!readOnly) {
      var add = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "+ Ajouter un réseau");
      add.disabled = block.links.length >= 8;
      add.addEventListener("click", function () {
        var used = block.links.map(function (l) { return l.network; });
        var free = NETWORKS.filter(function (n) { return used.indexOf(n[0]) === -1; })[0];
        if (!free) return;
        block.links.push({ network: free[0], url: "" }); renderProps(); changed();
        announce("Réseau ajouté.");
      });
      wrap.appendChild(add);
    }
    return group("Liens", wrap, "Adresses en https:// uniquement. Chaque réseau une seule fois (8 au plus).");
  }
  function courseField(block) {
    var courses = data.courses || [];
    var out = [];
    if (!courses.length) out.push(el("p", { "class": "mk-note" }, "Aucune formation publiée dans le catalogue : publiez-en une pour l'insérer ici."));
    var sel = el("select", { id: "f-" + block.id + "-course" });
    sel.appendChild(el("option", { value: "" }, "Choisir une formation…"));
    courses.forEach(function (c) { sel.appendChild(el("option", { value: String(c.id) }, c.title)); });
    sel.value = block.courseId == null ? "" : String(block.courseId);
    if (readOnly) sel.disabled = true;
    sel.addEventListener("change", function () { block.courseId = sel.value === "" ? undefined : parseInt(sel.value, 10); block.snapshot = undefined; block.refresh = false; renderProps(); changed(); });
    out.push(group("Formation du catalogue", sel));
    if (block.snapshot) out.push(el("p", { "class": "field-hint" }, "Enregistré : « " + block.snapshot.title + " » — " + (block.snapshot.priceCents ? (block.snapshot.priceCents / 100).toFixed(2).replace(".", ",") + " €" : "gratuit") + ". Le prix et le titre sont figés dans le modèle."));
    else if (block.courseId) out.push(el("p", { "class": "field-hint" }, "Les informations de la formation seront lues dans le catalogue à l'enregistrement."));
    out.push(F.text(block, "cta", "Texte du bouton", { owner: block.id, vars: true, max: 80 }));
    if (block.snapshot) out.push(F.toggle(block, "refresh", "Actualiser titre, prix et image depuis le catalogue à l'enregistrement", { owner: block.id }));
    return out;
  }
  // Image : importer depuis l'ordinateur, choisir dans la médiathèque, ou coller une adresse
  function imageSource(block) {
    var wrap = el("div", { "class": "mk-img-source" });
    if (block.src) {
      var thumb = el("img", { "class": "mk-img-thumb", src: block.src, alt: "" });
      wrap.appendChild(thumb);
    } else wrap.appendChild(el("p", { "class": "mk-img-empty" }, "Aucune image choisie."));
    if (!readOnly) {
      var row = el("div", { "class": "mk-img-actions" });
      var file = el("input", { type: "file", accept: "image/jpeg,image/png,image/gif,image/webp", "class": "sr-only", id: "f-" + block.id + "-file" });
      var importLabel = el("label", { "class": "btn btn-outline btn-sm", "for": file.id });
      importLabel.appendChild(iconSpan("upload")); importLabel.appendChild(document.createTextNode(" Importer"));
      file.addEventListener("change", function () { if (file.files[0]) uploadFiles([file.files[0]], { target: block.id }); file.value = ""; });
      var lib = el("button", { type: "button", "class": "btn btn-outline btn-sm" });
      lib.appendChild(iconSpan("image")); lib.appendChild(document.createTextNode(" Médiathèque"));
      lib.addEventListener("click", function () { pickFor = block.id; showPane("media"); setMediaStatus("Choisissez une image pour le bloc sélectionné."); });
      row.appendChild(importLabel); row.appendChild(file); row.appendChild(lib);
      wrap.appendChild(row);
    }
    return wrap;
  }
  // ---------- Réglages du bloc : système unifié (public/js/mk/fields.js) ----------
  // Chaque bloc : onglets Contenu / Styles / Visibilité / Avancé. Styles toujours dans le même ordre :
  // Typographie → réglages propres au bloc → Dimensions → Espacement intérieur → Fond → Bordure.
  // Seules les propriétés que le moteur d'envoi sait rendre sont proposées.
  var F = window.MkFields.create({
    el: el, iconSpan: iconSpan, readOnly: readOnly, announce: announce,
    changed: function (structural) { changed(structural); },
    rerender: function () { renderProps(); },
    theme: function () { var t = {}; Object.keys(THEME_DEFAULTS).forEach(function (k) { t[k] = state.theme && state.theme[k] != null ? state.theme[k] : THEME_DEFAULTS[k]; }); return t; },
    fonts: function () { return (data.fonts || Object.keys(FONT_LABELS)).map(function (k) { return [k, FONT_LABELS[k] || k]; }); },
    fontLabel: function (k) { return FONT_LABELS[k] || k; },
  });
  function th(k) { return state.theme && state.theme[k] != null ? state.theme[k] : THEME_DEFAULTS[k]; }
  var SPACING_PX = { compact: 4, normal: 8, large: 16 };
  // Typographie prise en charge par le moteur, type par type (police, taille [min, max, défaut], interligne, couleur…)
  function typoSpec(block) {
    var t = block.type;
    if (t === "heading") return { font: true, size: [16, 44, { 1: 28, 2: 22, 3: 18 }[block.level || 2]], color: true, align: "left", weight: "bold", italic: true, letterSpacing: true };
    if (t === "text") return { font: true, size: [12, 28, 16], lineHeight: true, color: true, align: "inherit", weight: "normal", italic: true, letterSpacing: true };
    if (t === "quote") return { font: true, size: [12, 32, 18], lineHeight: true, color: true, align: "inherit", weight: "normal", italic: "default-on", letterSpacing: true };
    if (t === "list") return { font: true, size: [12, 28, 16], lineHeight: true, color: true, align: "inherit", weight: "normal", italic: true, letterSpacing: true };
    if (t === "link") return { font: true, size: [12, 28, 16], lineHeight: true, color: true, colorInherit: th("accent"), colorInheritLabel: "Couleur principale", align: "left", weight: "bold", italic: true, letterSpacing: true };
    return null;
  }
  var BORDER_STYLES = [["none", "Aucune"], ["solid", "Pleine"], ["dashed", "Tirets"], ["dotted", "Pointillés"]];
  var SHAPES = [["0", "Carré"], ["4", "Léger"], ["12", "Arrondi"], ["40", "Ovale"]];
  // Onglet Contenu
  function contentSections(block) {
    var S = F.section, o = { owner: block.id }, t = block.type, out = [];
    if (t === "heading") {
      out.push(S("Titre", [F.text(block, "text", "Texte du titre", { owner: block.id, vars: true, max: 200 }), F.segment(block, "level", "Niveau", [[1, "Grand"], [2, "Moyen"], [3, "Petit"]], { owner: block.id, fallback: 2, int: true })]));
      out.push(S("Lien (facultatif)", [F.text(block, "href", "Adresse au clic (https://… ou mailto:)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr" }), F.toggle(block, "newTab", "Ouvrir dans un nouvel onglet", o)]));
    } else if (t === "text") {
      if (typeof block.html === "string") {
        var write = el("button", { type: "button", "class": "btn btn-primary btn-sm mk-b-write" });
        write.appendChild(iconSpan("edit")); write.appendChild(document.createTextNode(" Écrire dans l'e-mail"));
        write.disabled = readOnly;
        write.addEventListener("click", function () { scrollToBlock(block.id); startInline(block.id); });
        out.push(S("Texte", [el("p", { "class": "mk-fx-hint mk-b-writehint" }, "Le texte s'écrit directement dans l'e-mail : cliquez dedans. La barre d'outils au-dessus du canevas le met en forme (style, gras, couleurs, liens, alignement, listes, retrait, variables)."), write]));
      } else out.push(S("Texte", [markdownField(block, "markdown", "Texte", 8)]));
    } else if (t === "image") {
      out.push(S("Image", [imageSource(block), F.text(block, "src", "Adresse de l'image (https://…)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr/image.png" }),
        F.text(block, "alt", "Texte alternatif", { owner: block.id, vars: true, max: 200, hint: "Décrit l'image aux lecteurs d'écran et quand l'image est bloquée." }), F.toggle(block, "decorative", "Image décorative (pas de texte alternatif)", o)]));
      out.push(S("Lien au clic (facultatif)", [F.text(block, "href", "Adresse (https://…)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr" }), F.toggle(block, "newTab", "Ouvrir dans un nouvel onglet", o)]));
    } else if (t === "button") {
      out.push(S("Bouton", [F.text(block, "label", "Texte du bouton", { owner: block.id, vars: true, max: 80 }), F.text(block, "url", "Lien (https://… ou mailto:)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr" }), F.toggle(block, "newTab", "Ouvrir dans un nouvel onglet", o)]));
    } else if (t === "spacer") {
      out.push(S("Espace", [el("p", { "class": "mk-fx-hint" }, "Un espace vide entre deux blocs : sa hauteur se règle dans « Styles » (avec une hauteur propre au mobile si besoin).")]));
    } else if (t === "columns") {
      var richCols = typeof block.leftHtml === "string";
      out.push(S("Colonne de gauche", [richCols ? richField(block, "leftHtml", "Colonne de gauche", { rows: 4, hint: false }) : markdownField(block, "left", "Colonne de gauche", 5)]));
      out.push(S("Colonne de droite", [richCols ? richField(block, "rightHtml", "Colonne de droite", { rows: 4, hint: false }) : markdownField(block, "right", "Colonne de droite", 5)]));
    } else if (t === "divider") {
      out.push(S("Ligne de séparation", [el("p", { "class": "mk-fx-hint" }, "Une ligne horizontale entre deux parties du message : son apparence se règle dans « Styles ».")]));
    } else if (t === "quote") {
      out.push(S("Citation", [F.text(block, "text", "Citation", { owner: block.id, vars: true, max: 500 }), F.text(block, "author", "Auteur (facultatif)", { owner: block.id, vars: true, max: 100 })]));
    } else if (t === "list") {
      out.push(S("Liste", [itemsField(block)]));
    } else if (t === "social") {
      out.push(S("Réseaux", [socialField(block)]));
    } else if (t === "video") {
      out.push(S("Vidéo", [F.text(block, "url", "Adresse de la vidéo (https://…)", { owner: block.id, max: 2000, placeholder: "https://youtube.com/watch?v=…" }), F.text(block, "title", "Titre de la vidéo (texte alternatif)", { owner: block.id, vars: true, max: 200 }),
        F.text(block, "thumbnail", "Miniature (adresse d'une image https://…, facultatif)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr/miniature.jpg" }),
        el("p", { "class": "mk-fx-hint" }, "Un e-mail ne peut pas lire de vidéo : le message affiche la miniature et un lien « Regarder la vidéo ».")]));
    } else if (t === "course") {
      out.push(S("Formation", courseField(block)));
    } else if (t === "posts") {
      var shown = (block.items || []).length;
      out.push(S("Articles", [
        F.number(block, "count", "Nombre d'articles", { owner: block.id, min: 1, max: 10, inherit: 3 }),
        F.segment(block, "layout", "Présentation", [["excerpt", "Image et résumé"], ["titles", "Titres seuls"]], { owner: block.id, fallback: "excerpt" }),
        F.toggle(block, "showImages", "Afficher l'image de chaque article", o),
        F.text(block, "cta", "Texte du lien", { owner: block.id, vars: true, max: 40 }),
        el("p", { "class": "field-hint" }, shown ? "Aperçu : les " + shown + " derniers articles du blog, figés à l'enregistrement." : "Les derniers articles du blog seront lus à l'enregistrement."),
        el("p", { "class": "mk-fx-hint" }, "Dans une campagne RSS, ce bloc est rempli automatiquement avec les NOUVEAUX articles à chaque envoi."),
        shown ? F.toggle(block, "refresh", "Actualiser avec les derniers articles à l'enregistrement", { owner: block.id }) : null,
      ]));
    } else if (t === "link") {
      out.push(S("Lien", [F.text(block, "label", "Texte du lien", { owner: block.id, vars: true, max: 120 }), F.text(block, "url", "Adresse (https://… ou mailto:)", { owner: block.id, max: 2000, placeholder: "https://exemple.fr" }), F.toggle(block, "newTab", "Ouvrir dans un nouvel onglet", o)]));
    } else if (t === "coupon") {
      out.push(S("Offre", [F.text(block, "code", "Code promo", { owner: block.id, vars: true, max: 40, placeholder: "BIENVENUE10" }), F.text(block, "title", "Titre de l'offre (facultatif)", { owner: block.id, vars: true, max: 100 }), F.text(block, "details", "Conditions (facultatif)", { owner: block.id, vars: true, max: 300, placeholder: "Valable jusqu'au 30 septembre." })]));
    }
    return out;
  }
  // Onglet Styles (ordinateur, ou commun aux deux quand « mêmes styles »)
  function styleSections(block) {
    var S = F.section, o = { owner: block.id }, t = block.type, out = [];
    var spec = typoSpec(block);
    if (spec) out.push(S("Typographie", F.typography(block, spec)));
    if (t === "button") {
      out.push(S("Texte du bouton", [F.number(block, "fontSize", "Taille", { owner: block.id, min: 12, max: 24, unit: "px", inherit: 16 }),
        F.color(block, "textColor", "Couleur du texte", { owner: block.id, inherit: "#ffffff", inheritLabel: "Automatique (contraste lisible)" }),
        F.segment(block, "weight", "Graisse", [["normal", "Normale"], ["bold", "Grasse"]], { owner: block.id, fallback: "bold" }),
        F.toggle(block, "italic", "Italique", o), F.number(block, "letterSpacing", "Espacement des lettres", { owner: block.id, min: 0, max: 10, unit: "px", inherit: 0 })]));
      var r = block.radius == null ? th("radius") : block.radius;
      out.push(S("Bouton", [F.color(block, "color", "Couleur du bouton", { owner: block.id, inherit: th("accent"), inheritLabel: "Couleur principale" }),
        F.segment({ shape: String(r) }, "shape", "Forme", SHAPES, { owner: block.id, fallback: String(r), onPick: function (v) { block.radius = parseInt(v, 10); renderProps(); } }),
        F.number(block, "radius", "Arrondi", { owner: block.id, min: 0, max: 40, unit: "px", inherit: th("radius") }),
        F.segment(block, "size", "Taille", [["s", "Petit"], ["m", "Moyen"], ["l", "Grand"]], { owner: block.id, fallback: "m" })]));
      var bb = [F.segment(block, "borderStyle", "Bordure du bouton", BORDER_STYLES.slice(1), { owner: block.id, inherit: "Aucune", rerender: true })];
      if (block.borderStyle && block.borderStyle !== "none") bb.push(F.number(block, "borderWidth", "Épaisseur", { owner: block.id, min: 1, max: 8, unit: "px", inherit: 2 }), F.color(block, "borderColor", "Couleur de la bordure", { owner: block.id, inherit: "#10222f", inheritLabel: "Couleur du texte" }));
      out.push(S("Bordure du bouton", bb));
      out.push(S("Dimensions et position", [F.toggle(block, "fullWidth", "Toute la largeur", o), F.segment(block, "align", "Alignement", F.ALIGNS, { owner: block.id, fallback: "center" })]));
    } else if (t === "image") {
      out.push(S("Dimensions et position", [F.number(block, "width", "Largeur", { owner: block.id, min: 40, max: 720, unit: "px", inherit: 552, hint: "Hauteur proportionnelle (les e-mails ne déforment pas les images)." }), F.number(block, "radius", "Arrondi des coins", { owner: block.id, min: 0, max: 40, unit: "px", inherit: 0 }), F.segment(block, "align", "Alignement", F.ALIGNS, { owner: block.id, fallback: "left" })]));
    } else if (t === "divider") {
      out.push(S("Ligne", [F.segment(block, "style", "Style", BORDER_STYLES.slice(1), { owner: block.id, fallback: "solid" }), F.color(block, "color", "Couleur", { owner: block.id, inherit: th("secondary"), inheritLabel: "Couleur secondaire" })]));
      out.push(S("Dimensions et position", [F.number(block, "thickness", "Épaisseur", { owner: block.id, min: 1, max: 8, unit: "px", inherit: 1 }), F.number(block, "width", "Largeur", { owner: block.id, min: 10, max: 100, unit: "%", inherit: 100 }), F.segment(block, "align", "Alignement", F.ALIGNS, { owner: block.id, fallback: "center" })]));
    } else if (t === "spacer") {
      out.push(S("Dimensions", [F.number(block, "height", "Hauteur", { owner: block.id, min: 4, max: 120, unit: "px", inherit: 24 })]));
    } else if (t === "columns") {
      var cols = [F.select(block, "ratio", "Largeurs (gauche / droite)", [["50-50", "50 % / 50 %"], ["60-40", "60 % / 40 %"], ["40-60", "40 % / 60 %"], ["70-30", "70 % / 30 %"], ["30-70", "30 % / 70 %"]], { owner: block.id, fallback: "50-50" }),
        F.toggle(block, "stack", "Empiler les colonnes sur mobile", { owner: block.id, defaultOn: true, structural: false })];
      if (block.stack !== false) cols.push(F.toggle(block, "reverse", "Sur mobile : colonne de droite en premier", o));
      out.push(S("Colonnes", cols));
    } else if (t === "list") {
      out.push(S("Liste", [F.segment(block, "style", "Puces", LIST_STYLES, { owner: block.id, fallback: "bullets" })]));
    } else if (t === "social") {
      var so = [F.segment(block, "display", "Présentation", [["text", "Liens texte"], ["buttons", "Pastilles"]], { owner: block.id, fallback: "text", rerender: true })];
      if (block.display === "buttons") so.push(F.segment(block, "colors", "Couleur des pastilles", [["brand", "Réseaux"], ["accent", "Principale"]], { owner: block.id, fallback: "brand" }));
      so.push(F.segment(block, "align", "Alignement", F.ALIGNS, { owner: block.id, fallback: "center" }));
      so.push(el("p", { "class": "mk-fx-hint" }, "Pas de logos : Gmail et Outlook bloquent souvent les images d'icônes ; les pastilles s'affichent partout."));
      out.push(S("Réseaux", so));
    } else if (t === "video") {
      out.push(S("Dimensions et position", [F.number(block, "width", "Largeur de la miniature", { owner: block.id, min: 40, max: 600, unit: "px", inherit: 552 }), F.segment(block, "align", "Alignement", F.ALIGNS, { owner: block.id, fallback: "center" })]));
    } else if (t === "coupon") {
      out.push(S("Coupon", [F.color(block, "color", "Couleur du cadre et du code", { owner: block.id, inherit: th("accent"), inheritLabel: "Couleur principale" })]));
    }
    // Communs à tous les blocs
    block.box = block.box || {};
    var pad = SPACING_PX[th("spacing")] || 8;
    out.push(S("Espacement intérieur", [F.spacing(block.box, "Marges intérieures", { owner: block.id, inherit: { padTop: pad, padBottom: pad, padLeft: 24, padRight: 24 } })]));
    out.push(S("Fond", [F.color(block.box, "background", "Couleur de fond", { owner: block.id + "-box", inherit: th("contentBackground"), inheritLabel: "Fond du contenu" })]));
    out.push(S("Bordure du bloc", F.border(block.box, "border", { owner: block.id })));
    return out;
  }
  // Styles mobiles : seulement les réglages applicables ; vide = comme sur ordinateur
  function mobileSections(block) {
    var m = block.mobile, keys = MOBILE_FIELDS[block.type] || [], owner = block.id + "-m", out = [];
    var size = { heading: [16, 44], text: [12, 28], button: [12, 24], quote: [12, 32], list: [12, 28], link: [12, 28] }[block.type];
    var typo = [];
    if (keys.indexOf("fontSize") !== -1) typo.push(F.number(m, "fontSize", "Taille du texte sur mobile", { owner: owner, min: size[0], max: size[1], unit: "px", inherit: block.fontSize || "idem" }));
    if (keys.indexOf("align") !== -1) typo.push(F.segment(m, "align", "Alignement sur mobile", F.ALIGNS, { owner: owner, inherit: "Comme ordinateur" }));
    if (typo.length) out.push(F.section("Typographie et position (mobile)", typo));
    var dims = [];
    if (keys.indexOf("width") !== -1) dims.push(F.number(m, "width", "Largeur sur mobile", { owner: owner, min: 40, max: 720, unit: "px", inherit: block.width || "idem" }));
    if (keys.indexOf("height") !== -1) dims.push(F.number(m, "height", "Hauteur sur mobile", { owner: owner, min: 4, max: 120, unit: "px", inherit: block.height || "idem" }));
    if (keys.indexOf("fullWidth") !== -1) dims.push(F.toggle(m, "fullWidth", "Bouton sur toute la largeur sur mobile", { owner: owner }));
    if (dims.length) out.push(F.section("Dimensions (mobile)", dims));
    var b = block.box || {};
    out.push(F.section("Espacement intérieur (mobile)", [F.spacing(m, "Marges intérieures sur mobile", { owner: owner, inherit: { padTop: b.padTop != null ? b.padTop : "idem", padBottom: b.padBottom != null ? b.padBottom : "idem", padLeft: b.padLeft != null ? b.padLeft : "idem", padRight: b.padRight != null ? b.padRight : "idem" }, hint: "Vide (« idem ») = même valeur que sur ordinateur." })]));
    out.push(F.section("", [el("p", { "class": "mk-fx-hint" }, "Le canevas est passé en vue « Mobile » pour montrer le rendu réel. Outlook sur ordinateur ignore ces réglages et garde ceux de l'ordinateur.")]));
    return out;
  }
  // « Mêmes styles pour ordinateur et mobiles » (par défaut) ; sinon Ordinateur | Mobile
  var stylesDevice = "desktop";
  function setCanvasDevice(dev) {
    var b = document.querySelector(dev === "mobile" ? '[data-size="375"]' : '[data-size][data-tip="Bureau"]');
    if (b && b.getAttribute("aria-pressed") !== "true") b.click();
  }
  function deviceSwitch(block) {
    var nodes = [];
    var same = el("input", { type: "checkbox", id: "f-" + block.id + "-samestyles", "class": "mk-fx-switch" });
    same.checked = !block.mobile; same.disabled = readOnly;
    same.addEventListener("change", function () {
      if (same.checked) {
        var filled = block.mobile && Object.keys(block.mobile).some(function (k) { return block.mobile[k] !== undefined && block.mobile[k] !== ""; });
        if (filled && !window.confirm("Les réglages propres au mobile de ce bloc seront supprimés (Ctrl+Z pour annuler). Continuer ?")) { same.checked = false; return; }
        block.mobile = undefined; stylesDevice = "desktop"; setCanvasDevice("desktop");
      } else block.mobile = {};
      changed(true); renderProps();
      announce(same.checked ? "Mêmes styles sur ordinateur et mobile." : "Styles distincts : choisissez Ordinateur ou Mobile.");
    });
    var lab = el("label", { "class": "mk-fx-toggle mk-b-same", "for": same.id }); lab.appendChild(same); lab.appendChild(el("span", {}, "Mêmes styles pour ordinateur et mobiles"));
    nodes.push(lab);
    if (block.mobile) nodes.push(F.segment({ d: stylesDevice }, "d", "Appareil modifié", [["desktop", "Ordinateur"], ["mobile", "Mobile"]], { owner: block.id + "-device", fallback: "desktop", onPick: function (v) { stylesDevice = v; setCanvasDevice(v); setTimeout(renderProps, 0); } }));
    return F.section("", nodes, { cls: "mk-b-devicebar" });
  }
  // Onglet Visibilité : appareils (au moins un), envoi, condition sur le contact
  function visibilitySections(block) {
    block.box = block.box || {};
    var box = block.box, msg = el("p", { "class": "mk-fx-error", role: "alert" });
    var guard = function (key) { return function (hidden, input) { var other = key === "hideMobile" ? "hideDesktop" : "hideMobile"; if (hidden && box[other]) { input.checked = true; msg.textContent = "Un bloc s'affiche au moins sur un appareil. Pour ne l'envoyer à personne, décochez « Envoyer ce bloc »."; return false; } msg.textContent = ""; return true; }; };
    var send = el("input", { type: "checkbox", id: "f-" + block.id + "-send", "class": "mk-fx-switch" });
    send.checked = !block.hidden; send.disabled = readOnly;
    send.addEventListener("change", function () { if (send.checked === !block.hidden) return; toggleHidden(block.id); });
    var sendLab = el("label", { "class": "mk-fx-toggle", "for": send.id }); sendLab.appendChild(send); sendLab.appendChild(el("span", {}, "Envoyer ce bloc"));
    return [
      F.section("Appareils", [F.toggle(box, "hideDesktop", "Afficher sur ordinateur", { owner: block.id + "-show", invert: true, structural: true, guard: guard("hideDesktop") }),
        F.toggle(box, "hideMobile", "Afficher sur mobile", { owner: block.id + "-show", invert: true, structural: true, guard: guard("hideMobile") }), msg,
        el("p", { "class": "mk-fx-hint" }, "Vérifiez le résultat avec les vues « Bureau » et « Mobile » du canevas.")]),
      F.section("Envoi", [sendLab, el("p", { "class": "mk-fx-hint" }, "Décoché : le bloc reste dans le modèle (estompé) mais n'est jamais envoyé.")]),
      F.section("Condition sur le contact", [F.text(block, "showIf", "Afficher ce bloc seulement si…", { owner: block.id, max: 200, placeholder: "contact.country == \"FR\"", hint: "Ex. : contact.country == \"FR\" · contact.company · not contact.company. Vide = tous les contacts." })]),
    ];
  }
  // Onglet Avancé : identifiant, réglages personnalisés (chacun réinitialisable), réinitialisation complète
  var CONTENT_KEYS = ["id", "type", "text", "html", "markdown", "label", "url", "href", "newTab", "src", "alt", "decorative", "items", "links", "code", "title", "details", "author", "courseId", "cta", "snapshot", "refresh", "leftHtml", "rightHtml", "left", "right", "level", "thumbnail", "showIf", "hidden", "box", "mobile"];
  var STYLE_LABELS = { font: "Police", fontSize: "Taille du texte", lineHeight: "Interligne", color: "Couleur", align: "Alignement", weight: "Graisse", italic: "Italique", letterSpacing: "Espacement des lettres", textColor: "Couleur du texte", radius: "Arrondi", size: "Taille du bouton", fullWidth: "Toute la largeur", borderStyle: "Bordure du bouton", borderWidth: "Épaisseur de la bordure", borderColor: "Couleur de la bordure", style: "Style", thickness: "Épaisseur", width: "Largeur", height: "Hauteur", ratio: "Répartition des colonnes", stack: "Empilement sur mobile", reverse: "Ordre sur mobile", display: "Présentation", colors: "Couleur des pastilles" };
  var BOX_LABELS = { padTop: "Espacement (haut)", padBottom: "Espacement (bas)", padLeft: "Espacement (gauche)", padRight: "Espacement (droite)", background: "Fond", border: "Bordure du bloc" };
  // Valeurs par défaut enregistrées d'office par le serveur : ce ne sont pas des réglages personnalisés
  var TYPE_DEFAULTS = { heading: { align: "left" }, button: { align: "center" }, image: { align: "left", width: 552 }, link: { align: "left" }, social: { align: "center" }, list: { style: "bullets" }, video: { align: "center", width: 552 }, spacer: { height: 24 } };
  var VALUE_LABELS = { left: "À gauche", center: "Centré", right: "À droite", normal: "Normale", bold: "Grasse", s: "Petit", m: "Moyen", l: "Grand", solid: "Pleine", dashed: "Tirets", dotted: "Pointillés", bullets: "Puces", numbers: "Numéros", checks: "Coches", text: "Liens texte", buttons: "Pastilles", accent: "Couleur principale" };
  var PX_KEYS = ["fontSize", "letterSpacing", "radius", "borderWidth", "thickness", "height", "padTop", "padBottom", "padLeft", "padRight"];
  function fmt(k, v, type) {
    if (v === true) return "Oui";
    if (v === false) return k === "stack" ? "Non (côte à côte)" : "Non";
    if (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)) return v.toUpperCase();
    if (k === "font") return FONT_LABELS[v] || v;
    if (k === "width") return v + (type === "divider" ? " %" : " px");
    if (k === "lineHeight") return String(v).replace(".", ",");
    if (PX_KEYS.indexOf(k) !== -1) return v + " px";
    return VALUE_LABELS[v] || String(v);
  }
  function overrides(block) {
    var list = [], defs = TYPE_DEFAULTS[block.type] || {};
    Object.keys(block).forEach(function (k) { if (CONTENT_KEYS.indexOf(k) === -1 && block[k] != null && block[k] !== "" && defs[k] !== block[k]) list.push({ label: STYLE_LABELS[k] || k, value: fmt(k, block[k], block.type), reset: function () { delete block[k]; } }); });
    var box = block.box || {};
    Object.keys(BOX_LABELS).forEach(function (k) { var v = box[k]; if (v == null || (k === "border" && !Object.keys(v).some(function (x) { return v[x] != null; }))) return; list.push({ label: BOX_LABELS[k], value: k === "border" ? [v.style && VALUE_LABELS[v.style], v.width && v.width + " px", v.color && v.color.toUpperCase(), v.radius && "arrondi " + v.radius + " px"].filter(Boolean).join(", ") : fmt(k, v), reset: function () { delete box[k]; } }); });
    if (block.mobile && Object.keys(block.mobile).some(function (x) { return block.mobile[x] != null; })) list.push({ label: "Réglages mobiles", value: Object.keys(block.mobile).filter(function (x) { return block.mobile[x] != null; }).length + " réglage(s)", reset: function () { block.mobile = undefined; } });
    return list;
  }
  function advancedSections(block) {
    var idInput = el("input", { type: "text", id: "f-" + block.id + "-blockid", readonly: "readonly" }); idInput.value = block.id;
    var copy = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Copier");
    copy.addEventListener("click", function () { (navigator.clipboard ? navigator.clipboard.writeText(block.id) : Promise.reject()).then(function () { toast("Identifiant copié.", "ok"); }, function () { idInput.select(); }); });
    var idRow = el("div", { "class": "mk-fx-copy" }); idRow.appendChild(idInput); idRow.appendChild(copy);
    var list = overrides(block), nodes = [];
    if (!list.length) nodes.push(el("p", { "class": "mk-fx-hint" }, "Aucun réglage personnalisé : ce bloc suit entièrement les styles globaux du message."));
    else {
      var ul = el("ul", { "class": "mk-fx-overrides" });
      list.forEach(function (it) {
        var li = el("li", {});
        li.appendChild(el("span", { "class": "mk-fx-ov-label" }, it.label));
        li.appendChild(el("span", { "class": "mk-fx-ov-value" }, it.value));
        if (!readOnly) { var r = el("button", { type: "button", "class": "mk-fx-reset", "aria-label": it.label + " : revenir à la valeur globale" }, "Réinitialiser"); r.addEventListener("click", function () { it.reset(); changed(true); renderProps(); announce(it.label + " : valeur globale rétablie."); }); li.appendChild(r); }
        ul.appendChild(li);
      });
      nodes.push(ul);
      if (!readOnly) {
        var all = el("button", { type: "button", "class": "btn btn-outline btn-sm" }, "Réinitialiser tous les styles du bloc");
        all.addEventListener("click", function () {
          if (!window.confirm("Tous les styles personnalisés de ce bloc reviendront aux styles globaux (le contenu est conservé ; Ctrl+Z pour annuler).")) return;
          list.forEach(function (it) { it.reset(); }); changed(true); renderProps(); announce("Styles du bloc réinitialisés.");
        });
        nodes.push(all);
      }
    }
    return [F.section("Identifiant du bloc", [F.field("Identifiant (lecture seule)", idRow, { hint: "Repère technique unique du bloc dans ce modèle (conservé à l'enregistrement)." })]), F.section("Réglages personnalisés", nodes)];
  }
  // Sections de l'onglet demandé
  function tabSections(block, tab) {
    if (tab === "content") return contentSections(block);
    if (tab === "visibility") return visibilitySections(block);
    if (tab === "advanced") return advancedSections(block);
    var list = [deviceSwitch(block)];
    if (block.mobile && stylesDevice === "mobile") return list.concat(mobileSections(block));
    return list.concat(styleSections(block));
  }

  // ---------- Opérations sur les blocs ----------
  function insertIndex() { var i = selectedId ? indexOfId(selectedId) : -1; return i === -1 ? state.blocks.length : i + 1; }
  // Ensemble prêt à l'emploi : plusieurs vrais blocs, insérés ensemble (une seule étape d'annulation)
  function addPreset(key, at) {
    if (!PRESETS[key] || readOnly) return;
    var index = at == null ? insertIndex() : Math.max(0, Math.min(at, state.blocks.length));
    var added = PRESETS[key]().map(function (b) { b.id = genId(); return b; });
    Array.prototype.splice.apply(state.blocks, [index, 0].concat(added));
    selectedId = added[0].id;
    changed(true); renderProps();
    announce(added.length + " bloc" + (added.length > 1 ? "s" : "") + " ajouté" + (added.length > 1 ? "s" : "") + " en position " + (index + 1) + ".");
  }
  function addBlock(type, at, preset) {
    if (typeof type === "string" && type.indexOf("preset:") === 0) { addPreset(type.slice(7), at); return null; }
    if (!TYPES[type] || readOnly) return null;
    var block = Object.assign(TYPES[type](), preset || {}); block.id = genId();
    var index = at == null ? insertIndex() : Math.max(0, Math.min(at, state.blocks.length));
    state.blocks.splice(index, 0, block);
    selectedId = block.id;
    changed(true); renderProps();
    announce("Bloc « " + label(block) + " » ajouté en position " + (index + 1) + " sur " + state.blocks.length + ".");
    return block;
  }
  function move(from, to) {
    if (to < 0 || to >= state.blocks.length || from === to) return;
    var item = state.blocks.splice(from, 1)[0];
    state.blocks.splice(to, 0, item);
    changed(true);
    announce("Bloc déplacé en position " + (to + 1) + " sur " + state.blocks.length + ".");
  }
  function duplicate(id) {
    var i = indexOfId(id); if (i === -1) return;
    var copy = JSON.parse(JSON.stringify(state.blocks[i])); copy.id = genId();
    state.blocks.splice(i + 1, 0, copy); selectedId = copy.id;
    changed(true); renderProps(); announce("Bloc dupliqué.");
  }
  function remove(id) {
    var i = indexOfId(id); if (i === -1) return;
    var name = label(state.blocks[i]);
    state.blocks.splice(i, 1);
    if (selectedId === id) selectedId = null;
    changed(true); renderProps(); announce("Bloc « " + name + " » supprimé. Ctrl+Z pour le rétablir.");
  }
  function toggleHidden(id) {
    var b = blockById(id); if (!b) return;
    b.hidden = !b.hidden;
    changed(true); renderProps(); announce(b.hidden ? "Bloc masqué : il ne sera pas envoyé." : "Bloc de nouveau affiché.");
  }
  function select(id, opts) {
    if (inline && inline.id !== id) stopInline();
    selectedId = id;
    renderProps();
    markSelection();
    if (opts && opts.scroll) scrollToBlock(id);
    if (opts && opts.focus) { var first = $("mk-props").querySelector("input:not([type=hidden]):not([disabled]), textarea, select"); if (first) first.focus(); }
  }

  // ---------- Réglages du bloc sélectionné (colonne de droite) ----------
  var props = $("mk-props");
  function textBtn(iconName, text, labelText, onClick, cls) {
    var b = el("button", { type: "button", "class": "mk-b-textbtn" + (cls ? " " + cls : ""), "aria-label": labelText, "data-tip": labelText });
    b.appendChild(iconSpan(iconName)); b.appendChild(el("span", { "class": "mk-b-textbtn-label" }, text));
    b.addEventListener("click", onClick);
    return b;
  }
  function blockToolbar(block) {
    var i = indexOfId(block.id);
    var bar = el("div", { "class": "mk-b-blocktools", role: "toolbar", "aria-label": "Actions du bloc" });
    var order = el("div", { "class": "mk-b-blocktools-group", role: "group", "aria-label": "Position" });
    var up = iconBtn("arrowUp", "Monter le bloc", function () { move(indexOfId(block.id), indexOfId(block.id) - 1); }); up.disabled = i === 0;
    var down = iconBtn("arrowDown", "Descendre le bloc", function () { move(indexOfId(block.id), indexOfId(block.id) + 1); }); down.disabled = i === state.blocks.length - 1;
    order.appendChild(up); order.appendChild(down);
    bar.appendChild(order);
    bar.appendChild(textBtn("copy", "Dupliquer", "Dupliquer le bloc", function () { duplicate(block.id); }));
    bar.appendChild(textBtn(block.hidden ? "eye" : "eyeOff", block.hidden ? "Afficher" : "Masquer", block.hidden ? "Afficher le bloc" : "Masquer le bloc (non envoyé)", function () { toggleHidden(block.id); }));
    bar.appendChild(iconBtn("trash", "Supprimer le bloc", function () { remove(block.id); }, { "class": "mk-b-icon is-danger mk-b-blocktools-del" }));
    return bar;
  }
  var builder = $("mk-editor");
  var propsTab = "content";
  function renderProps() {
    if (!props) return;
    props.textContent = "";
    var block = selectedId ? blockById(selectedId) : null;
    builder.classList.toggle("has-selection", !!block); // écran moyen / mobile : les réglages s'ouvrent en panneau
    buildBlockbar();
    if (!block) {
      var empty = el("div", { "class": "mk-b-props-empty" });
      empty.appendChild(iconSpan("edit", "mk-b-props-empty-ico"));
      empty.appendChild(el("p", {}, readOnly ? "Cliquez sur un bloc de l'e-mail pour voir ses réglages." : "Cliquez sur un bloc de l'e-mail (ou dans «\u00a0Structure\u00a0») pour le modifier."));
      empty.appendChild(el("p", { "class": "field-hint" }, "L'objet, le préheader et le pied de page se règlent dans l'onglet «\u00a0Message\u00a0» ; les couleurs et la police dans «\u00a0Styles\u00a0»."));
      props.appendChild(empty);
      if (toolbar) toolbar.render();
      return;
    }
    var head = el("div", { "class": "mk-b-props-head" });
    var info = BLOCKS[block.type] || {};
    var ic = el("span", { "class": "mk-b-props-icon", "aria-hidden": "true" }); ic.innerHTML = info.icon || "";
    head.appendChild(ic);
    var t = el("div", { "class": "mk-b-props-title" });
    t.appendChild(el("h2", {}, label(block)));
    t.appendChild(el("p", {}, "Bloc " + (indexOfId(block.id) + 1) + " sur " + state.blocks.length + (block.hidden ? " · masqué (non envoyé)" : "")));
    head.appendChild(t);
    head.appendChild(iconBtn("close", "Fermer les réglages du bloc", function () { select(null); }, { "class": "mk-b-icon mk-b-props-close" }));
    props.appendChild(head);
    if (!readOnly) props.appendChild(blockToolbar(block));
    var err = blockErrors.filter(function (x) { return x.id === block.id; })[0];
    if (err) {
      var alertBox = el("div", { "class": "mk-b-alert", role: "alert" });
      alertBox.appendChild(iconSpan("alertCircle"));
      alertBox.appendChild(el("p", {}, "À compléter : " + err.message));
      props.appendChild(alertBox);
    }
    // Onglets Contenu / Styles / Visibilité (l'onglet choisi reste actif d'un bloc à l'autre)
    var TABS = [["content", "Contenu"], ["styles", "Styles"], ["visibility", "Visibilité"], ["advanced", "Avancé"]];
    var tabs = el("div", { "class": "mk-ptabs", role: "tablist", "aria-label": "Réglages du bloc" });
    var panel = el("div", { "class": "mk-b-props-body", role: "tabpanel", id: "mk-props-panel", "aria-labelledby": "mk-tab-" + propsTab, tabindex: "0" });
    TABS.forEach(function (t, i) {
      var on = t[0] === propsTab;
      var b = el("button", { type: "button", role: "tab", id: "mk-tab-" + t[0], "class": "mk-ptab", "aria-selected": String(on), "aria-controls": "mk-props-panel", tabindex: on ? "0" : "-1" }, t[1]);
      if (t[0] === "visibility" && (block.hidden || block.showIf || (block.box && (block.box.hideMobile || block.box.hideDesktop)))) b.appendChild(el("span", { "class": "mk-ptab-dot", "aria-label": " (réglage actif)" }));
      if (t[0] === "styles" && block.mobile) b.appendChild(el("span", { "class": "mk-ptab-dot", "aria-label": " (styles mobiles)" }));
      b.addEventListener("click", function () { propsTab = t[0]; renderProps(); var nb = $("mk-tab-" + t[0]); if (nb) nb.focus(); });
      b.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") n = -i; else if (e.key === "End") n = TABS.length - 1 - i;
        if (!n) return; e.preventDefault(); propsTab = TABS[(i + n + TABS.length) % TABS.length][0]; renderProps(); var nb = $("mk-tab-" + propsTab); if (nb) nb.focus();
      });
      tabs.appendChild(b);
    });
    props.appendChild(tabs);
    tabSections(block, propsTab).forEach(function (sct) {
      if (!sct.nodes.length) return;
      var box = el("section", { "class": "mk-b-section" + (sct.cls ? " " + sct.cls : "") });
      if (sct.title) box.appendChild(el("h3", { "class": "mk-b-section-title" }, sct.title));
      sct.nodes.forEach(function (n) { box.appendChild(n); });
      panel.appendChild(box);
    });
    props.appendChild(panel);
    if (toolbar) toolbar.render();
  }

  // ---------- Structure (liste des blocs, accessible au clavier, réordonnable) ----------
  var structure = $("mk-structure");
  var dragFrom = -1;
  var BLOCK_DRAG = "text/mk-block", MOVE_DRAG = "text/mk-move";
  // Texte visible d'un contenu riche : document inerte (DOMParser) — rien n'y est exécuté ni chargé
  function htmlText(html) { return new DOMParser().parseFromString(String(html || ""), "text/html").body.textContent || ""; }
  function plain(md) { return String(md || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*#_>`]/g, "").replace(/^\s*-\s+/gm, ""); }
  function summaryOf(b) {
    var s = "";
    if (b.type === "heading" || b.type === "quote") s = b.text;
    else if (b.type === "text") s = typeof b.html === "string" ? htmlText(b.html) : plain(b.markdown);
    else if (b.type === "button") s = (b.label || "") + (b.url ? " → " + b.url : "");
    else if (b.type === "image") s = b.alt || (b.src ? b.src.split("/").pop() : "");
    else if (b.type === "list") s = (b.items || []).join(" · ");
    else if (b.type === "columns") s = typeof b.leftHtml === "string" ? htmlText(b.leftHtml) + " | " + htmlText(b.rightHtml) : plain(b.left) + (b.right ? " | " + plain(b.right) : "");
    else if (b.type === "link") s = (b.label || "") + (b.url ? " → " + b.url : "");
    else if (b.type === "coupon") s = (b.code || "") + (b.title ? " · " + b.title : "");
    else if (b.type === "video") s = b.title || b.url;
    else if (b.type === "social") s = (b.links || []).map(function (l) { var n = NETWORKS.filter(function (x) { return x[0] === l.network; })[0]; return n ? n[1] : l.network; }).join(", ");
    else if (b.type === "course") { var c = (data.courses || []).filter(function (x) { return x.id === b.courseId; })[0]; s = c ? c.title : (b.snapshot ? b.snapshot.title : ""); }
    else if (b.type === "posts") s = (b.items || []).length ? (b.items || []).map(function (i) { return i.title; }).join(" · ") : "Rempli avec les nouveaux articles à chaque envoi RSS";
    else if (b.type === "spacer") s = (b.height || 24) + " px";
    else if (b.type === "divider") s = "Ligne de séparation";
    return String(s || "").replace(/\s+/g, " ").trim().slice(0, 140);
  }
  function structureAction(iconName, text, onClick, opts) {
    opts = opts || {};
    var b = iconBtn(iconName, text, function (e) { e.stopPropagation(); onClick(); }, { "class": "mk-b-icon mk-structure-act" + (opts.danger ? " is-danger" : "") });
    if (opts.disabled) b.disabled = true;
    return b;
  }
  function renderStructure() {
    if (!structure) return;
    structure.textContent = "";
    var count = $("mk-structure-count"); if (count) count.textContent = state.blocks.length ? String(state.blocks.length) : "";
    if (!state.blocks.length) structure.appendChild(el("li", { "class": "mk-structure-empty" }, readOnly ? "Aucun bloc." : "Aucun bloc : ajoutez-en depuis l'onglet « Blocs »."));
    state.blocks.forEach(function (b, index) {
      var li = el("li", { "class": "mk-structure-item" + (b.id === selectedId ? " is-selected" : "") + (b.hidden ? " is-hidden" : ""), "data-id": b.id });
      var row = el("div", { "class": "mk-structure-row" });
      if (!readOnly) {
        var grip = el("span", { "class": "mk-structure-grip", draggable: "true", title: "Glisser pour déplacer", "aria-hidden": "true" });
        grip.appendChild(iconSpan("grip"));
        row.appendChild(grip);
      }
      var btn = el("button", { type: "button", "class": "mk-structure-btn", "aria-current": b.id === selectedId ? "true" : undefined, "aria-label": "Bloc " + (index + 1) + " : " + label(b) + (b.hidden ? " (masqué)" : "") + (summaryOf(b) ? " — " + summaryOf(b) : "") + ". Alt + flèches pour déplacer.", draggable: readOnly ? undefined : "true" });
      var ic = el("span", { "class": "mk-structure-icon", "aria-hidden": "true" }); ic.innerHTML = (BLOCKS[b.type] || {}).icon || "";
      btn.appendChild(ic);
      var txt = el("span", { "class": "mk-structure-text" });
      var nameLine = el("span", { "class": "mk-structure-line" });
      nameLine.appendChild(el("span", { "class": "mk-structure-name" }, (index + 1) + ". " + label(b)));
      if (b.hidden) nameLine.appendChild(el("span", { "class": "mk-structure-tag" }, "Masqué"));
      if (blockErrors.some(function (x) { return x.id === b.id; })) nameLine.appendChild(el("span", { "class": "mk-structure-tag is-error" }, "À compléter"));
      if (b.showIf) nameLine.appendChild(el("span", { "class": "mk-structure-tag" }, "Condition"));
      if (b.box && b.box.hideMobile) nameLine.appendChild(el("span", { "class": "mk-structure-tag" }, "Ordinateur seulement"));
      if (b.box && b.box.hideDesktop) nameLine.appendChild(el("span", { "class": "mk-structure-tag" }, "Mobile seulement"));
      txt.appendChild(nameLine);
      var sum = summaryOf(b);
      txt.appendChild(el("span", { "class": "mk-structure-sum" + (sum ? "" : " is-empty"), title: sum || undefined }, sum || "Aucun contenu"));
      btn.appendChild(txt);
      btn.addEventListener("click", function () { select(b.id, { scroll: true }); });
      btn.addEventListener("keydown", function (e) {
        if (readOnly || !e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        var from = indexOfId(b.id), to = from + (e.key === "ArrowUp" ? -1 : 1);
        move(from, to);
        var again = structure.querySelector('[data-id="' + b.id + '"] .mk-structure-btn'); if (again) again.focus();
      });
      row.appendChild(btn);
      li.appendChild(row);
      if (!readOnly) {
        // Zone d'actions : toujours présente pour le bloc sélectionné, révélée au survol / au clavier pour les autres
        var acts = el("div", { "class": "mk-structure-actions", role: "group", "aria-label": "Actions du bloc " + (index + 1) });
        acts.appendChild(structureAction("arrowUp", "Monter", function () { move(indexOfId(b.id), indexOfId(b.id) - 1); }, { disabled: index === 0 }));
        acts.appendChild(structureAction("arrowDown", "Descendre", function () { move(indexOfId(b.id), indexOfId(b.id) + 1); }, { disabled: index === state.blocks.length - 1 }));
        acts.appendChild(structureAction("edit", "Modifier", function () { select(b.id, { scroll: true, focus: true }); }));
        acts.appendChild(structureAction("copy", "Dupliquer", function () { duplicate(b.id); }));
        acts.appendChild(structureAction(b.hidden ? "eye" : "eyeOff", b.hidden ? "Afficher" : "Masquer", function () { toggleHidden(b.id); }));
        acts.appendChild(structureAction("trash", "Supprimer", function () { remove(b.id); }, { danger: true }));
        li.appendChild(acts);
        var startDrag = function (e) { dragFrom = indexOfId(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData(MOVE_DRAG, b.id); e.dataTransfer.setData("text/plain", label(b)); try { e.dataTransfer.setDragImage(li, 24, 20); } catch (x) { /* image de glisser par défaut */ } li.classList.add("is-dragging"); structure.classList.add("is-sorting"); };
        var endDrag = function () { dragFrom = -1; li.classList.remove("is-dragging"); structure.classList.remove("is-sorting"); clearStructureMarks(); };
        btn.addEventListener("dragstart", startDrag); grip.addEventListener("dragstart", startDrag);
        btn.addEventListener("dragend", endDrag); grip.addEventListener("dragend", endDrag);
        li.addEventListener("dragover", function (e) {
          if (!isDrag(e, MOVE_DRAG) && !isDrag(e, BLOCK_DRAG)) return;
          e.preventDefault();
          var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
          clearStructureMarks(); li.classList.add(after ? "is-drop-after" : "is-drop-before");
        });
        li.addEventListener("drop", function (e) {
          var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
          var target = indexOfId(b.id) + (after ? 1 : 0);
          clearStructureMarks();
          if (isDrag(e, BLOCK_DRAG)) { e.preventDefault(); addBlock(e.dataTransfer.getData(BLOCK_DRAG), target); return; }
          if (!isDrag(e, MOVE_DRAG)) return;
          e.preventDefault();
          var from = indexOfId(e.dataTransfer.getData(MOVE_DRAG));
          if (from === -1) return;
          move(from, from < target ? target - 1 : target);
        });
      }
      structure.appendChild(li);
    });
  }
  function clearStructureMarks() { [].forEach.call(structure.querySelectorAll(".is-drop-before, .is-drop-after"), function (n) { n.classList.remove("is-drop-before", "is-drop-after"); }); }
  function refreshStructureLabels() {
    if (!structure) return;
    state.blocks.forEach(function (b) {
      var s = structure.querySelector('[data-id="' + b.id + '"] .mk-structure-sum'); if (!s) return;
      var sum = summaryOf(b);
      s.textContent = sum || "Aucun contenu"; s.classList.toggle("is-empty", !sum);
      if (sum) s.title = sum; else s.removeAttribute("title");
    });
  }
  function isDrag(e, type) { return !!(e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], type) !== -1); }
  function isFileDrag(e) { return isDrag(e, "Files"); }

  // ---------- Palette (onglet « Blocs ») ----------
  if (!readOnly) {
    [].forEach.call(document.querySelectorAll("[data-add]"), function (btn) {
      var type = btn.getAttribute("data-add");
      btn.addEventListener("click", function () { addBlock(type); scrollToBlock(selectedId); });
      btn.addEventListener("dragstart", function (e) { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData(BLOCK_DRAG, type); e.dataTransfer.setData("text/plain", type); });
    });
    [].forEach.call(document.querySelectorAll("[data-add-preset]"), function (btn) {
      var key = btn.getAttribute("data-add-preset");
      btn.addEventListener("click", function () { addPreset(key); scrollToBlock(selectedId); });
      btn.addEventListener("dragstart", function (e) { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData(BLOCK_DRAG, "preset:" + key); e.dataTransfer.setData("text/plain", key); });
    });
  }

  // ---------- Onglets de gauche ----------
  var tabs = [].slice.call(document.querySelectorAll(".mk-b-tab"));
  function showPane(key) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-pane") === key;
      t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
      var pane = $("pane-" + t.getAttribute("data-pane")); if (pane) pane.hidden = !on;
    });
    if (key === "media") { loadMedia(false); renderMedia(); }
    if (key === "check") renderCheck();
    if (key === "message") refreshMessageFields();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { showPane(t.getAttribute("data-pane")); });
    t.addEventListener("keydown", function (e) {
      var to = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      var n = tabs[(to + tabs.length) % tabs.length]; n.focus(); showPane(n.getAttribute("data-pane"));
    });
  });

  // ---------- Réglages du message et styles globaux ----------
  var bindings = [];
  function bind(id, get, set) {
    var input = $(id);
    if (!input) return;
    input.value = get();
    if (readOnly) input.disabled = true;
    var onChange = function () { set(input.value); changed(); };
    input.addEventListener("input", onChange);
    input.addEventListener("change", onChange);
    bindings.push(function () { input.value = get(); });
  }
  function syncSettings() { bindings.forEach(function (fn) { fn(); }); }
  bind("t-name", function () { return state.name || ""; }, function (v) { state.name = v; });
  bind("t-kind", function () { return state.kind || "marketing"; }, function (v) { state.kind = v; });
  bind("t-category", function () { return state.category || ""; }, function (v) { state.category = v; });
  bind("t-subject", function () { return state.subject || ""; }, function (v) { state.subject = v; });
  bind("t-preheader", function () { return state.preheader || ""; }, function (v) { state.preheader = v; });
  bind("t-footer", function () { return state.footer.text || ""; }, function (v) { state.footer.text = v; });
  [["t-bg", "background"], ["t-cbg", "contentBackground"], ["t-text", "textColor"], ["t-accent", "accent"], ["t-secondary", "secondary"], ["t-font", "fontFamily"], ["t-spacing", "spacing"]].forEach(function (pair) {
    bind(pair[0], function () { return state.theme[pair[1]] || THEME_DEFAULTS[pair[1]]; }, function (v) { state.theme[pair[1]] = v; });
  });
  // Nombres bornés (largeur du message, arrondi) : une saisie hors limites n'est appliquée qu'une fois corrigée
  [["t-maxwidth", "maxWidth", 480, 720], ["t-radius", "radius", 0, 24]].forEach(function (d) {
    var input = $(d[0]); if (!input) return;
    var show = function () { input.value = String(state.theme[d[1]] != null ? state.theme[d[1]] : THEME_DEFAULTS[d[1]]); input.removeAttribute("aria-invalid"); };
    show(); bindings.push(show);
    if (readOnly) { input.disabled = true; return; }
    input.addEventListener("input", function () {
      var n = parseInt(input.value, 10);
      if (isNaN(n) || n < d[2] || n > d[3]) { input.setAttribute("aria-invalid", "true"); return; }
      input.removeAttribute("aria-invalid"); state.theme[d[1]] = n; changed();
      if (d[1] === "maxWidth") applyDesktopWidth();
    });
    input.addEventListener("blur", show);
  });
  // Code hexadécimal à côté de chaque couleur : lisible, copiable, saisissable (#RRGGBB)
  [].forEach.call(document.querySelectorAll("[data-hex-for]"), function (hex) {
    var color = $(hex.getAttribute("data-hex-for"));
    if (!color) return;
    var show = function () { hex.value = color.value.toUpperCase(); hex.removeAttribute("aria-invalid"); };
    color.addEventListener("input", show);
    bindings.push(show);
    show();
    hex.addEventListener("input", function () {
      var v = hex.value.trim(); if (v && v.charAt(0) !== "#") v = "#" + v;
      if (/^#[0-9a-f]{6}$/i.test(v)) { hex.removeAttribute("aria-invalid"); color.value = v.toLowerCase(); color.dispatchEvent(new Event("input", { bubbles: true })); }
      else hex.setAttribute("aria-invalid", "true");
    });
    hex.addEventListener("blur", show);
  });
  // Objet / préheader : une seule ligne (pas de retour à la ligne) mais affichés en entier ; compteurs de caractères
  function autogrow(area) { area.style.height = "auto"; area.style.height = area.scrollHeight + 2 + "px"; }
  var growers = [].slice.call(document.querySelectorAll(".mk-autogrow"));
  growers.forEach(function (area) {
    if (area.hasAttribute("data-single-line")) {
      area.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
      area.addEventListener("input", function () { if (/[\r\n]/.test(area.value)) { var at = area.selectionStart; area.value = area.value.replace(/[\r\n]+/g, " "); area.setSelectionRange(at, at); area.dispatchEvent(new Event("change")); } });
    }
    area.addEventListener("input", function () { autogrow(area); updateCount(area); });
  });
  function updateCount(area) {
    var c = document.querySelector('[data-count-for="' + area.id + '"]');
    if (c) c.textContent = area.value.length + " / " + area.getAttribute("maxlength");
  }
  function refreshMessageFields() { growers.forEach(function (a) { if (a.offsetParent) autogrow(a); updateCount(a); }); }
  bindings.push(refreshMessageFields);
  var nameInput = $("t-name");
  if (nameInput) { var nameTitle = function () { nameInput.title = nameInput.value; }; nameInput.addEventListener("input", nameTitle); bindings.push(nameTitle); }
  if ($("mk-theme-reset")) $("mk-theme-reset").addEventListener("click", function () {
    state.theme = Object.assign({}, THEME_DEFAULTS); syncSettings(); changed(); applyDesktopWidth(); announce("Styles réinitialisés.");
  });

  // ---------- Canevas : rendu réel de l'e-mail, blocs cliquables, glisser-déposer ----------
  var frame = $("mk-frame");
  var canvas = $("mk-canvas");
  var contactSel = $("mk-contact");
  (data.contacts || []).forEach(function (c) { contactSel.appendChild(el("option", { value: String(c.id) }, c.email)); });
  contactSel.addEventListener("change", function () { stopInline({ rerender: false }); runPreview(); });
  // Largeur d'affichage : l'e-mail garde sa VRAIE largeur (600 / 480 / 375 px) ; s'il ne tient pas dans le canevas,
  // il est réduit à l'affichage (zoom), jamais recomposé ni coupé. Les marges latérales restent libres pour la barre du bloc.
  var frameWidth = 600, zoom = 1, zoomEl = $("mk-zoom"), zoomFull = false; // zoomFull : 100 % demandé (défilement horizontal dans le canevas)
  [].forEach.call(document.querySelectorAll("[data-size]"), function (btn) {
    btn.addEventListener("click", function () {
      frameWidth = parseInt(btn.getAttribute("data-size"), 10);
      frame.style.width = frameWidth + "px";
      [].forEach.call(document.querySelectorAll("[data-size]"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      fitZoom(); setTimeout(fitFrame, 50);
    });
  });
  function fitZoom() {
    var cs = getComputedStyle(canvas);
    var avail = canvas.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var fit = avail > 0 ? Math.min(1, Math.floor((avail / frameWidth) * 100) / 100) : 1;
    // Très petit écran (téléphone) : une réduction sous 60 % serait illisible → l'e-mail (adaptatif) est affiché à la
    // largeur disponible, comme sur un téléphone ; sinon il garde sa largeur réelle.
    var narrow = fit < 0.6 && !zoomFull;
    frame.style.width = (narrow ? Math.max(280, Math.floor(avail)) : frameWidth) + "px";
    var z = zoomFull ? 1 : narrow ? 1 : fit;
    if (zoomEl) {
      zoomEl.hidden = fit >= 0.95 && !narrow; // réduction imperceptible : pas d'indicateur
      zoomEl.setAttribute("aria-pressed", zoomFull ? "true" : "false");
      zoomEl.textContent = zoomFull ? "100 %" : narrow ? "Largeur de l'écran" : "Zoom " + Math.round(fit * 100) + " %";
      zoomEl.title = zoomFull ? "Affiché à 100 % (faites défiler horizontalement). Cliquez pour ajuster à l'espace disponible."
        : narrow ? "Espace trop étroit : l'e-mail (adaptatif) est affiché à la largeur disponible, comme sur un téléphone. Cliquez pour l'afficher à sa vraie largeur (" + frameWidth + " px)."
        : "L'e-mail est réduit pour tenir dans l'espace disponible ; il garde sa vraie largeur (" + frameWidth + " px). Cliquez pour l'afficher à 100 %.";
      zoomEl.setAttribute("aria-label", zoomEl.title);
    }
    if (z === zoom && frame.style.zoom) return;
    zoom = z;
    frame.style.zoom = String(zoom);
    placeBlockbar();
  }
  if (window.ResizeObserver) new ResizeObserver(function () { fitZoom(); placeBlockbar(); }).observe(canvas);
  else window.addEventListener("resize", function () { fitZoom(); placeBlockbar(); });
  frame.style.width = frameWidth + "px";
  if (zoomEl) zoomEl.addEventListener("click", function () { zoomFull = !zoomFull; fitZoom(); });
  // Vue « Bureau » = largeur du message choisie dans les styles globaux (480 à 720 px)
  function applyDesktopWidth() {
    var desk = document.querySelector('[data-size][data-tip="Bureau"]');
    var mw = parseInt(state.theme.maxWidth, 10) || 600;
    var w = mw + 32; // comme une messagerie sur ordinateur : le message et 16 px de fond de chaque côté (jamais la règle mobile)
    if (!desk) return;
    desk.setAttribute("data-size", String(w)); desk.setAttribute("aria-label", "Bureau (message de " + mw + " px)");
    if (desk.getAttribute("aria-pressed") === "true") { frameWidth = w; frame.style.width = w + "px"; fitZoom(); setTimeout(fitFrame, 50); }
  }
  applyDesktopWidth();
  fitZoom();
  var previewTimer = null, previewSeq = 0;
  var previewBusy = false, pendingInline = null; // rechargement du canevas en cours / écriture à reprendre après
  function schedulePreview() {
    if (inline && keepInline()) return;
    previewBusy = true;
    clearTimeout(previewTimer); previewTimer = setTimeout(runPreview, 350);
  }
  function previewDone() { previewBusy = false; if (pendingInline) { var p = pendingInline; pendingInline = null; startInline(p.id, p.point); } }
  function runPreview() {
    if (inline && keepInline()) { previewBusy = false; return; }
    previewBusy = true;
    var seq = ++previewSeq;
    var body = { template: payload(), annotate: true };
    if (contactSel.value) body.contactId = parseInt(contactSel.value, 10);
    fetch("/marketing/modeles/apercu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (seq !== previewSeq) return; // réponse périmée
        if (!r.ok) { showError(r.j.error || "Aperçu impossible."); previewDone(); return; }
        showError("");
        frame.style.minHeight = frame.offsetHeight + "px"; // pas de saut de défilement pendant le rechargement
        frame.srcdoc = r.j.html;
        $("mk-subject").textContent = r.j.subject;
        $("mk-text").textContent = r.j.text;
        blockErrors = r.j.blockErrors || [];
        lintWarnings = r.j.warnings || [];
        renderStructure(); renderCheck();
        if (selectedId) { var err = props && props.querySelector(".mk-warn.is-error"); var has = blockErrors.some(function (x) { return x.id === selectedId; }); if (Boolean(err) !== has) renderProps(); }
      })
      .catch(function (e) { if (seq === previewSeq) { console.error("[éditeur] aperçu", e); showError("Aperçu impossible pour le moment : vérifiez votre connexion."); previewDone(); } });
  }
  function frameDoc() { try { return frame.contentDocument; } catch (e) { return null; } }
  function rows() { var d = frameDoc(); return d ? [].slice.call(d.querySelectorAll("[data-mk-block]")) : []; }
  function fitFrame() { var d = frameDoc(); if (!d || !d.documentElement) return; frame.style.height = Math.max(400, d.documentElement.scrollHeight) + "px"; frame.style.minHeight = ""; placeBlockbar(); }
  // Coordonnées d'un bloc du rendu dans le canevas (le rendu peut être réduit : coordonnées internes × zoom)
  function blockBox(id) {
    var r = rows().filter(function (n) { return n.getAttribute("data-mk-block") === id; })[0];
    if (!r) return null;
    var fr = frame.getBoundingClientRect(), cr = canvas.getBoundingClientRect(), rr = r.getBoundingClientRect();
    var top = fr.top - cr.top + canvas.scrollTop + rr.top * zoom;
    return { top: top, bottom: top + rr.height * zoom, right: fr.right - cr.left + canvas.scrollLeft, left: fr.left - cr.left + canvas.scrollLeft };
  }
  function scrollToBlock(id) {
    var box = blockBox(id);
    if (!box) return;
    var view = canvas.clientHeight;
    if (box.top >= canvas.scrollTop + 16 && box.bottom <= canvas.scrollTop + view - 16) return; // déjà visible : pas de saut
    canvas.scrollTo({ top: Math.max(0, box.top - 40), behavior: "smooth" });
  }
  // Styles d'édition injectés dans le rendu (contour au survol / à la sélection, ligne d'insertion) — jamais envoyés
  var EDIT_CSS = "[data-mk-edit]{outline:none;cursor:text;min-height:1.6em}[data-mk-edit] a{pointer-events:auto;cursor:text}[data-mk-edit] p{margin:0 0 16px}[data-mk-edit]>:last-child{margin-bottom:0}" +
    "[data-mk-edit] h2{margin:0 0 12px;font-size:22px;line-height:1.25;font-weight:800}[data-mk-edit] h3{margin:0 0 12px;font-size:19px;line-height:1.3;font-weight:700}[data-mk-edit] h4{margin:0 0 10px;font-size:17px;line-height:1.3;font-weight:700}" +
    "[data-mk-edit] ul,[data-mk-edit] ol{margin:0 0 16px;padding-left:24px}[data-mk-edit] li{margin:0 0 6px}[data-mk-edit] blockquote{margin:0 0 16px;padding:4px 0 4px 14px;border-left:3px solid var(--mk-accent,#0277b6)}[data-mk-edit] a{text-decoration:underline}" +
    "[data-mk-block][data-mk-editing]>td{box-shadow:inset 0 0 0 2px #0277b6;background-image:none!important}[data-mk-block]{cursor:pointer}[data-mk-block]>td{transition:box-shadow .12s}[data-mk-block][data-mk-hover]>td{box-shadow:inset 0 0 0 1px #7aa7c7}" +
    "[data-mk-block][data-mk-selected]>td{box-shadow:inset 0 0 0 2px #0277b6;position:relative}[data-mk-block][data-mk-selected]>td[data-mk-name]::after{content:attr(data-mk-name);position:absolute;left:0;top:0;padding:1px 8px;border-radius:0 0 6px 0;background:#0277b6;color:#fff;font:600 12px/18px -apple-system,Segoe UI,Roboto,Arial,sans-serif;pointer-events:none;z-index:5}a{pointer-events:none}#mk-insert{position:absolute;left:12px;right:12px;height:0;border-top:3px solid #0277b6;border-radius:2px;pointer-events:none;z-index:10}" +
    "#mk-insert::before{content:'';position:absolute;left:-5px;top:-6.5px;width:10px;height:10px;border-radius:50%;background:#0277b6}" +
    "[data-mk-block][data-mk-selected]>td{background-image:linear-gradient(rgba(2,119,182,.04),rgba(2,119,182,.04))}" +
    "[data-mk-block][data-mk-dragging]>td{opacity:.35}" +
    "#mk-insert::after{content:'Déposer ici';position:absolute;left:50%;top:-11px;transform:translateX(-50%);padding:0 10px;border-radius:10px;background:#0277b6;color:#fff;font:600 12px/20px -apple-system,Segoe UI,Roboto,Arial,sans-serif;white-space:nowrap}";
  frame.addEventListener("load", decorateFrame);
  function decorateFrame() {
    var d = frameDoc();
    if (!d || !d.body) return;
    var st = d.createElement("style"); st.textContent = EDIT_CSS; d.head.appendChild(st);
    d.body.style.position = "relative";
    fitFrame();
    markSelection();
    setTimeout(previewDone, 0);
    d.addEventListener("click", function (e) {
      e.preventDefault(); // un lien de l'e-mail ne s'ouvre jamais dans l'éditeur
      if (inline && inline.box.contains(e.target)) return; // dans le texte en cours d'écriture : le curseur se place
      var row = e.target.closest && e.target.closest("[data-mk-block]");
      if (row) {
        var rid = row.getAttribute("data-mk-block");
        select(rid, { focus: false });
        var rb = blockById(rid);
        if (rb && rb.type === "text" && typeof rb.html === "string" && !readOnly) startInline(rid, { x: e.clientX, y: e.clientY });
      }
      else if (selectedId && !(e.target.closest && e.target.closest(".mk-container"))) select(null); // clic hors du message : désélection
    }, true);
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && selectedId && !inline) select(null); });
    d.addEventListener("selectionchange", function () { if (inline) { textApi.saveRange(); if (toolbar) toolbar.sync(); } });
    d.addEventListener("mouseover", function (e) {
      var row = e.target.closest && e.target.closest("[data-mk-block]");
      rows().forEach(function (n) { n.toggleAttribute("data-mk-hover", n === row); });
      if (row) showHoverGrip(row.getAttribute("data-mk-block"));
    });
    d.addEventListener("mouseleave", function () { hideHoverGrip(300); });
    d.addEventListener("mouseleave", function () { rows().forEach(function (n) { n.removeAttribute("data-mk-hover"); }); });
    if (readOnly) return;
    d.addEventListener("dragover", function (e) {
      if (!isDrag(e, BLOCK_DRAG) && !isDrag(e, MOVE_DRAG) && !isFileDrag(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = isDrag(e, MOVE_DRAG) ? "move" : "copy";
      showInsert(e.clientY, e);
    });
    d.addEventListener("dragleave", function (e) { if (!e.relatedTarget) hideInsert(); });
    d.addEventListener("drop", function (e) {
      var spot = dropSpot(e.clientY, e);
      hideInsert();
      if (isFileDrag(e) && e.dataTransfer.files.length) { e.preventDefault(); uploadFiles([].slice.call(e.dataTransfer.files), { at: spot.index, target: spot.onImage }); return; }
      if (isDrag(e, BLOCK_DRAG)) { e.preventDefault(); addBlock(e.dataTransfer.getData(BLOCK_DRAG), spot.index); return; }
      if (isDrag(e, MOVE_DRAG)) {
        e.preventDefault();
        var from = indexOfId(e.dataTransfer.getData(MOVE_DRAG));
        if (from !== -1) move(from, from < spot.index ? spot.index - 1 : spot.index);
      }
    });
  }
  // Où insérer : avant / après le bloc le plus proche (moitié haute / basse) ; image déposée SUR un bloc image → remplace
  function dropSpot(y, e) {
    var list = rows();
    var index = state.blocks.length, line = null, onImage = null;
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) { index = indexOfId(list[i].getAttribute("data-mk-block")); line = r.top; break; }
      line = r.bottom;
    }
    if (isFileDrag(e)) {
      var hit = list.filter(function (n) { var r = n.getBoundingClientRect(); return y >= r.top && y <= r.bottom; })[0];
      var hb = hit && blockById(hit.getAttribute("data-mk-block"));
      if (hb && hb.type === "image") onImage = hb.id;
    }
    if (index === -1) index = state.blocks.length;
    return { index: index, line: line == null ? 24 : line, onImage: onImage };
  }
  function showInsert(y, e) {
    var d = frameDoc(); if (!d) return;
    var spot = dropSpot(y, e);
    var mark = d.getElementById("mk-insert");
    if (!mark) { mark = d.createElement("div"); mark.id = "mk-insert"; d.body.appendChild(mark); }
    var scroll = d.documentElement.scrollTop || d.body.scrollTop;
    var hit = spot.onImage && rows().filter(function (n) { return n.getAttribute("data-mk-block") === spot.onImage; })[0];
    rows().forEach(function (n) { n.toggleAttribute("data-mk-hover", n === hit); });
    mark.style.display = hit ? "none" : "block";
    mark.style.top = (spot.line + scroll) + "px";
  }
  function hideInsert() { var d = frameDoc(); var m = d && d.getElementById("mk-insert"); if (m) m.remove(); rows().forEach(function (n) { n.removeAttribute("data-mk-hover"); }); }
  // Contour + étiquette + mini-barre d'outils du bloc sélectionné, dans le rendu
  function markSelection() {
    var d = frameDoc();
    if (d && d.body) rows().forEach(function (n) {
      var on = n.getAttribute("data-mk-block") === selectedId;
      n.toggleAttribute("data-mk-selected", on);
      var cell = n.firstElementChild, b = on && blockById(selectedId);
      if (cell) { if (b) cell.setAttribute("data-mk-name", label(b)); else cell.removeAttribute("data-mk-name"); }
    });
    [].forEach.call(structure ? structure.querySelectorAll(".mk-structure-item") : [], function (li) {
      var on = li.getAttribute("data-id") === selectedId;
      li.classList.toggle("is-selected", on);
      var b = li.querySelector(".mk-structure-btn"); if (b) { if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); }
    });
    buildBlockbar();
  }
  // Barre d'actions du bloc sélectionné : dans la marge du canevas, à droite de l'e-mail, alignée sur le bloc et
  // maintenue visible pendant le défilement (jamais par-dessus le contenu, jamais hors du canevas).
  var blockbar = $("mk-blockbar"), barFor = null;
  function buildBlockbar() {
    if (!blockbar) return;
    var block = selectedId ? blockById(selectedId) : null;
    if (!block || readOnly) { blockbar.hidden = true; blockbar.textContent = ""; barFor = null; return; }
    var i = indexOfId(block.id), key = block.id + ":" + i + ":" + state.blocks.length + ":" + !!block.hidden;
    if (barFor !== key) {
      barFor = key;
      blockbar.textContent = "";
      var badge = el("span", { "class": "mk-b-blockbar-type", "data-tip": label(block) + " · bloc " + (i + 1) + " sur " + state.blocks.length });
      var info = BLOCKS[block.type] || {};
      badge.innerHTML = info.icon || ""; // icône du registre (serveur)
      blockbar.appendChild(badge);
      blockbar.appendChild(el("span", { "class": "sr-only" }, label(block) + ", bloc " + (i + 1) + " sur " + state.blocks.length));
      blockbar.appendChild(dragHandle(block.id, "mk-b-icon mk-b-grip"));
      [["arrowUp", "Monter", function () { move(indexOfId(selectedId), indexOfId(selectedId) - 1); }, i === 0],
        ["arrowDown", "Descendre", function () { move(indexOfId(selectedId), indexOfId(selectedId) + 1); }, i === state.blocks.length - 1],
        ["edit", "Modifier (réglages à droite)", function () { select(selectedId, { focus: true }); }],
        ["copy", "Dupliquer", function () { duplicate(selectedId); }],
        [block.hidden ? "eye" : "eyeOff", block.hidden ? "Afficher" : "Masquer (non envoyé)", function () { toggleHidden(selectedId); }],
        ["trash", "Supprimer", function () { remove(selectedId); }, false, true]].forEach(function (a) {
        var b = iconBtn(a[0], a[1], function () { a[2](); }, { "class": "mk-b-icon" + (a[4] ? " is-danger" : "") });
        if (a[3]) b.disabled = true;
        blockbar.appendChild(b);
      });
    }
    blockbar.hidden = false;
    placeBlockbar();
  }
  // ---------- Glisser-déplacer DANS le canevas : poignée « Déplacer » ----------
  // Événements de pointeur (souris, pavé tactile, écran tactile) capturés par la poignée : le mouvement est suivi même
  // au-dessus de l'e-mail ; une ligne d'insertion montre l'emplacement ; le canevas défile près des bords.
  // Clavier : flèches haut / bas sur la poignée. Échap annule.
  var dragging = null;
  function dragHandle(id, cls) {
    var b = el("button", { type: "button", "class": cls, "aria-label": "Déplacer le bloc (glisser, ou flèches haut / bas)", "data-tip": "Déplacer (glisser)", "aria-roledescription": "poignée de déplacement" });
    b.appendChild(iconSpan("grip"));
    b.addEventListener("pointerdown", function (e) { if (e.button === 0) startCanvasDrag(e, id, b); });
    b.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      var from = indexOfId(id); move(from, from + (e.key === "ArrowUp" ? -1 : 1));
      select(id, { scroll: true });
      setTimeout(function () { var g = blockbar && blockbar.querySelector(".mk-b-grip"); if (g) g.focus(); }, 0);
    });
    return b;
  }
  function startCanvasDrag(e, id, handle) {
    if (readOnly || indexOfId(id) === -1) return;
    e.preventDefault();
    try { handle.setPointerCapture(e.pointerId); } catch (x) { /* capture indisponible : suivi par le document */ }
    var startX = e.clientX, startY = e.clientY, lastY = null, chip = null;
    var frameY = function (clientY) { var fr = frame.getBoundingClientRect(); return (clientY - fr.top) / zoom; };
    var cleanup = function () {
      handle.removeEventListener("pointermove", onMove); handle.removeEventListener("pointerup", onUp); handle.removeEventListener("pointercancel", onCancel);
      document.removeEventListener("keydown", onKey, true);
      if (chip) chip.remove();
      builder.classList.remove("is-block-dragging");
      rows().forEach(function (n) { n.removeAttribute("data-mk-dragging"); });
      hideInsert(); dragging = null;
    };
    var onMove = function (ev) {
      if (!dragging) {
        if (Math.abs(ev.clientX - startX) + Math.abs(ev.clientY - startY) < 5) return; // simple clic : pas de déplacement
        var block = blockById(id);
        dragging = { id: id };
        builder.classList.add("is-block-dragging");
        hideHoverGrip(0);
        rows().forEach(function (n) { n.toggleAttribute("data-mk-dragging", n.getAttribute("data-mk-block") === id); });
        chip = el("div", { "class": "mk-b-dragchip", "aria-hidden": "true" }, "Déplacer : " + label(block));
        document.body.appendChild(chip);
      }
      chip.style.left = ev.clientX + 14 + "px"; chip.style.top = ev.clientY + 10 + "px";
      var cr = canvas.getBoundingClientRect();
      if (ev.clientY < cr.top + 48) canvas.scrollTop -= 14; else if (ev.clientY > cr.bottom - 48) canvas.scrollTop += 14;
      lastY = frameY(ev.clientY);
      showInsert(lastY, {});
    };
    var onUp = function () {
      var wasDragging = !!dragging, y = lastY;
      cleanup();
      if (!wasDragging) { select(id, { scroll: false }); return; }
      if (y == null) return;
      var spot = dropSpot(y, {}), from = indexOfId(id);
      var to = from < spot.index ? spot.index - 1 : spot.index;
      if (from !== -1 && to !== from) move(from, to); else announce("Bloc laissé à sa place.");
      select(id, { scroll: false });
    };
    var onCancel = function () { cleanup(); };
    var onKey = function (ev) { if (ev.key === "Escape" && dragging) { ev.preventDefault(); ev.stopPropagation(); cleanup(); announce("Déplacement annulé."); } };
    handle.addEventListener("pointermove", onMove); handle.addEventListener("pointerup", onUp); handle.addEventListener("pointercancel", onCancel);
    document.addEventListener("keydown", onKey, true);
  }
  // Poignée au survol : à gauche de n'importe quel bloc du rendu (sans avoir à le sélectionner d'abord)
  var hoverGrip = null, hoverFor = null, hoverTimer = null;
  function showHoverGrip(id) {
    if (readOnly || dragging || !canvas) return;
    clearTimeout(hoverTimer);
    if (!hoverGrip) {
      hoverGrip = el("div", { "class": "mk-b-hovergrip" });
      hoverGrip.addEventListener("mouseenter", function () { clearTimeout(hoverTimer); });
      hoverGrip.addEventListener("mouseleave", function () { hideHoverGrip(300); });
      canvas.appendChild(hoverGrip);
    }
    if (hoverFor !== id) { hoverGrip.textContent = ""; hoverGrip.appendChild(dragHandle(id, "mk-b-hovergrip-btn")); hoverFor = id; }
    var box = blockBox(id);
    if (!box) return;
    hoverGrip.hidden = false;
    hoverGrip.style.top = Math.round(box.top + 4) + "px";
    hoverGrip.style.left = Math.max(2, Math.round(box.left - 30)) + "px";
  }
  function hideHoverGrip(delay) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { if (hoverGrip && !dragging) hoverGrip.hidden = true; }, delay || 0);
  }
  var placeQueued = false;
  function placeBlockbar() {
    if (!blockbar || blockbar.hidden || !selectedId) return;
    var box = blockBox(selectedId);
    if (!box) { blockbar.style.visibility = "hidden"; return; }
    blockbar.style.visibility = "";
    var h = blockbar.offsetHeight, viewTop = canvas.scrollTop + 8, viewBottom = canvas.scrollTop + canvas.clientHeight - 8;
    var top = Math.max(box.top, Math.min(viewTop, box.bottom - h)); // suit le bloc, reste visible s'il est long
    top = Math.min(top, Math.max(box.top, viewBottom - h));
    top = Math.max(0, Math.min(top, canvas.scrollHeight - h));
    blockbar.style.top = Math.round(top) + "px";
    blockbar.style.left = Math.round(box.right - (frameWidth > parseInt(state.theme.maxWidth || 600, 10) ? 12 * zoom : -10)) + "px"; // sur le fond autour du message
  }
  canvas.addEventListener("scroll", function () { if (placeQueued) return; placeQueued = true; requestAnimationFrame(function () { placeQueued = false; placeBlockbar(); }); }, { passive: true });

  // ---------- Fichiers : glisser-déposer et import → médiathèque (persistant) → bloc ----------
  var IMG_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  function precheck(file) {
    var n = (file.name || "").toLowerCase();
    if (/^video\//.test(file.type) || /\.(mp4|webm|mov|m4v)$/.test(n)) return "« " + file.name + " » : un e-mail ne peut pas lire de vidéo. Publiez-la (YouTube…) puis utilisez le bloc « Vidéo » avec son adresse.";
    if (file.type === "image/svg+xml" || /\.svg$/.test(n)) return "« " + file.name + " » : les images SVG ne sont pas acceptées dans un e-mail. Exportez-la en PNG.";
    var isImg = IMG_TYPES.indexOf(file.type) !== -1 || /\.(jpe?g|png|gif|webp)$/.test(n);
    var isPdf = file.type === "application/pdf" || /\.pdf$/.test(n);
    if (!isImg && !isPdf) return "« " + file.name + " » : format non pris en charge (images JPEG, PNG, GIF, WebP, ou PDF).";
    if (isImg && file.size > 5 * 1048576) return "« " + file.name + " » : image trop lourde (5 Mo au plus).";
    if (isPdf && file.size > 10 * 1048576) return "« " + file.name + " » : PDF trop lourd (10 Mo au plus).";
    return null;
  }
  function altFromName(name) { return String(name || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120); }
  function uploadOne(file) {
    var fd = new FormData(); fd.append("file", file);
    return fetch("/marketing/medias", { method: "POST", credentials: "same-origin", body: fd })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok) throw new Error(j.error || "Envoi impossible (" + res.status + ")."); return j.media; }); });
  }
  // opts.at : position d'insertion ; opts.target : id d'un bloc image à remplir (remplacement)
  function uploadFiles(files, opts) {
    if (readOnly) return;
    opts = opts || {};
    var at = opts.at == null ? insertIndex() : opts.at;
    files.reduce(function (p, file) {
      return p.then(function () {
        var problem = precheck(file);
        if (problem) { toast(problem, "error"); setMediaStatus(problem); return null; }
        setMediaStatus("Envoi de « " + file.name + " »…");
        return uploadOne(file).then(function (m) {
          setMediaStatus("« " + m.name + " » ajouté à la médiathèque.");
          mediaCache.unshift(m); renderMedia();
          useMedia(m, { at: at, target: opts.target });
          if (!opts.target) at++;
          opts.target = null;
        }).catch(function (err) {
          console.error("[éditeur] envoi de fichier", err);
          toast("« " + file.name + " » : " + err.message, "error"); setMediaStatus(err.message);
        });
      });
    }, Promise.resolve());
  }
  // Insère un média : image → bloc image (ou remplace l'image du bloc visé) ; PDF → bouton de téléchargement
  function useMedia(m, opts) {
    opts = opts || {};
    var target = opts.target ? blockById(opts.target) : null;
    if (m.kind === "image") {
      if (target && target.type === "image") {
        target.src = m.url; if (!target.alt && !target.decorative) target.alt = m.alt || altFromName(m.name);
        selectedId = target.id; changed(true); renderProps(); announce("Image remplacée.");
        return;
      }
      addBlock("image", opts.at, { src: m.url, alt: m.alt || altFromName(m.name), width: Math.min(552, m.width || 552) });
    } else {
      addBlock("button", opts.at, { label: "Télécharger le document (PDF)", url: m.url });
      toast("Document ajouté : un bouton « Télécharger » renvoie vers le PDF.", "ok");
    }
  }

  // ---------- Médiathèque (onglet « Médias ») ----------
  var mediaCache = [], mediaMore = false, mediaLoaded = false, pickFor = null;
  var mediaGrid = $("mk-media-grid"), mediaQ = $("mk-media-q"), mediaKind = $("mk-media-kind"), mediaMoreBtn = $("mk-media-more");
  function setMediaStatus(t) { var s = $("mk-media-status"); if (s) s.textContent = t || ""; }
  function fmtSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + "\u00a0Mo" : Math.max(1, Math.round(n / 1024)) + "\u00a0Ko"; }
  function loadMedia(more) {
    if (!mediaGrid || (mediaLoaded && !more && !loadMedia.force)) return;
    loadMedia.force = false;
    var offset = more ? mediaCache.length : 0;
    setMediaStatus("Chargement…");
    fetch("/marketing/medias?limite=30&depuis=" + offset + "&q=" + encodeURIComponent(mediaQ.value) + "&type=" + encodeURIComponent(mediaKind.value), { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error(j.error || "Chargement impossible."); return j; }); })
      .then(function (j) { mediaCache = more ? mediaCache.concat(j.items) : j.items; mediaMore = j.more; mediaLoaded = true; setMediaStatus(j.total ? j.total + " média" + (j.total > 1 ? "s" : "") : "Aucun média : importez une image ou un PDF."); renderMedia(); })
      .catch(function (e) { console.error("[éditeur] médiathèque", e); setMediaStatus("Médiathèque indisponible : " + e.message); });
  }
  var mediaSearchTimer = null;
  if (mediaQ) mediaQ.addEventListener("input", function () { clearTimeout(mediaSearchTimer); mediaSearchTimer = setTimeout(function () { loadMedia.force = true; loadMedia(false); }, 250); });
  if (mediaKind) mediaKind.addEventListener("change", function () { loadMedia.force = true; loadMedia(false); });
  if (mediaMoreBtn) mediaMoreBtn.addEventListener("click", function () { loadMedia(true); });
  function mediaType(m) { var t = { "image/png": "PNG", "image/jpeg": "JPEG", "image/gif": "GIF", "image/webp": "WebP", "application/pdf": "PDF" }[m.mime]; return t || (m.kind === "image" ? "Image" : "Document"); }
  function renderMedia() {
    if (!mediaGrid) return;
    mediaGrid.textContent = "";
    var selectedImage = selectedId && blockById(selectedId) && blockById(selectedId).type === "image";
    mediaCache.forEach(function (m) {
      var li = el("li", { "class": "mk-media-item" });
      var replaces = m.kind === "image" && (pickFor || selectedImage);
      var pick = el("button", { type: "button", "class": "mk-media-pick-btn", "aria-label": (replaces ? "Utiliser l'image « " : m.kind === "image" ? "Insérer l'image « " : "Insérer le document « ") + m.name + " »" + (replaces ? " dans le bloc image sélectionné" : "") });
      if (m.kind === "image") pick.appendChild(el("img", { src: m.url, alt: "", loading: "lazy", width: "120", height: "90" }));
      else pick.appendChild(iconSpan("fileText", "mk-media-doc"));
      var chip = el("span", { "class": "mk-media-insert", "aria-hidden": "true" });
      chip.appendChild(iconSpan("plus")); chip.appendChild(el("span", {}, replaces ? "Utiliser" : "Insérer"));
      pick.appendChild(chip);
      pick.appendChild(el("span", { "class": "mk-media-type", "aria-hidden": "true" }, mediaType(m)));
      pick.addEventListener("click", function () {
        var target = pickFor || (selectedImage ? selectedId : null);
        useMedia(m, { target: m.kind === "image" ? target : null });
        pickFor = null;
      });
      li.appendChild(pick);
      var meta = el("div", { "class": "mk-media-meta" });
      meta.appendChild(el("span", { "class": "mk-media-name", title: m.name }, m.name));
      meta.appendChild(el("span", { "class": "mk-media-info" }, (m.width ? m.width + " × " + m.height + " · " : "") + fmtSize(m.size)));
      li.appendChild(meta);
      var actions = el("div", { "class": "mk-media-actions" });
      if (m.kind === "image") actions.appendChild(iconBtn("edit", "Texte alternatif de « " + m.name + " »", function () { editAlt(m); }));
      actions.appendChild(iconBtn("link", "Copier l'adresse de « " + m.name + " »", function () { if (navigator.clipboard) navigator.clipboard.writeText(m.url).then(function () { toast("Adresse copiée.", "ok"); }); }));
      actions.appendChild(iconBtn("trash", "Supprimer « " + m.name + " »", function () { deleteMedia(m); }, { "class": "mk-b-icon is-danger" }));
      li.appendChild(actions);
      mediaGrid.appendChild(li);
    });
    if (mediaMoreBtn) mediaMoreBtn.hidden = !mediaMore;
  }
  function postJson(url, body) {
    return fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body || {}) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { if (!res.ok) throw new Error(j.error || "Opération impossible (" + res.status + ")."); return j; }); });
  }
  function editAlt(m) {
    var text = window.prompt("Texte alternatif de « " + m.name + " » (proposé à chaque insertion de cette image) :", m.alt || "");
    if (text === null) return;
    postJson("/marketing/medias/" + m.id, { alt: text }).then(function (j) { Object.assign(m, j.media); renderMedia(); toast("Texte alternatif enregistré.", "ok"); }).catch(function (e) { toast(e.message, "error"); });
  }
  function deleteMedia(m) {
    var go = function () {
      postJson("/marketing/medias/" + m.id + "/supprimer").then(function () { mediaCache = mediaCache.filter(function (x) { return x.id !== m.id; }); renderMedia(); toast("Média supprimé.", "ok"); }).catch(function (e) { toast(e.message, "error"); });
    };
    if (typeof window.mkConfirm === "function") window.mkConfirm({ title: "Supprimer ce média ?", text: "« " + m.name + " » sera retiré de la médiathèque. Un média utilisé par un modèle ne peut pas être supprimé.", ok: "Supprimer" }, go);
    else if (window.confirm("Supprimer « " + m.name + " » ?")) go();
  }
  var mediaFile = $("mk-media-file"), mediaDrop = $("mk-media-drop");
  if (mediaFile) mediaFile.addEventListener("change", function () { uploadFiles([].slice.call(mediaFile.files), {}); mediaFile.value = ""; });
  if (mediaDrop) {
    mediaDrop.addEventListener("dragover", function (e) { if (!isFileDrag(e)) return; e.preventDefault(); mediaDrop.classList.add("is-over"); });
    mediaDrop.addEventListener("dragleave", function () { mediaDrop.classList.remove("is-over"); });
    mediaDrop.addEventListener("drop", function (e) { mediaDrop.classList.remove("is-over"); if (!isFileDrag(e)) return; e.preventDefault(); uploadFiles([].slice.call(e.dataTransfer.files), {}); });
  }
  // Un fichier lâché ailleurs que sur une zone prévue ne doit jamais ouvrir le fichier dans l'onglet (perte du travail)
  window.addEventListener("dragover", function (e) { if (isFileDrag(e)) e.preventDefault(); });
  window.addEventListener("drop", function (e) { if (isFileDrag(e)) { e.preventDefault(); toast("Déposez le fichier dans l'e-mail ou dans la médiathèque.", "info"); } });

  // ---------- Vérification (blocs incomplets + alertes de qualité) ----------
  function renderCheck() {
    var box = $("mk-check"), badge = $("mk-check-count");
    var errors = lintWarnings.filter(function (w) { return w.level === "error"; });
    var tips = lintWarnings.length - errors.length;
    var count = blockErrors.length + errors.length;
    if (badge) { badge.hidden = !count; badge.textContent = String(count); badge.setAttribute("aria-label", count + " problème" + (count > 1 ? "s" : "") + " à corriger"); }
    if (!box) return;
    box.textContent = "";
    var sum = el("div", { "class": "mk-check-summary " + (count ? "is-error" : tips ? "is-warning" : "is-ok") });
    sum.appendChild(iconSpan(count ? "alertCircle" : tips ? "alertTriangle" : "checkCircle", "mk-check-summary-icon"));
    var st = el("div", {});
    st.appendChild(el("p", { "class": count ? "mk-check-sum" : "mk-check-ok" }, count ? count + " problème" + (count > 1 ? "s" : "") + " à corriger avant l'envoi" : tips ? "Aucun problème bloquant" : "Aucun problème détecté"));
    st.appendChild(el("p", { "class": "mk-check-sub" }, tips ? tips + " conseil" + (tips > 1 ? "s" : "") + " pour améliorer le message" : count ? "Les blocs incomplets ne sont pas enregistrés automatiquement." : "Le message est prêt à être envoyé."));
    sum.appendChild(st);
    box.appendChild(sum);
    if (!count && !tips) return;
    var ul = el("ul", { "class": "mk-check-list" });
    function item(level, text, onGo) {
      var li = el("li", { "class": level === "error" ? "is-error" : "is-warning" });
      var link = typeof onGo === "string"; // réglage hors de l'éditeur : ouvert dans un nouvel onglet (le travail en cours reste ici)
      var node = link ? el("a", { "class": "mk-check-go", href: onGo, target: "_blank", rel: "noopener" }) : el(onGo ? "button" : "div", onGo ? { type: "button", "class": "mk-check-go" } : { "class": "mk-check-go is-static" });
      node.appendChild(el("span", { "class": "mk-check-badge" }, level === "error" ? "Erreur" : "Conseil"));
      node.appendChild(el("span", { "class": "mk-check-msg" }, text + (link ? " (s'ouvre dans un nouvel onglet)" : "")));
      if (onGo) node.appendChild(iconSpan(link ? "externalLink" : "chevronRight", "mk-check-chev"));
      if (onGo && !link) node.addEventListener("click", onGo);
      li.appendChild(node); ul.appendChild(li);
    }
    blockErrors.forEach(function (be) {
      item("error", "Bloc " + (indexOfId(be.id) + 1) + " (" + (BLOCKS[be.type] ? BLOCKS[be.type].label : be.type) + ") : " + be.message, function () { select(be.id, { scroll: true, focus: true }); });
    });
    lintWarnings.forEach(function (w) {
      var code = w.code || "";
      var go = /^address/.test(code) ? "/marketing/modeles#adresse"
        : /^subject|^preheader/.test(code) ? function () { showPane("message"); var f = $(/preheader/.test(code) ? "t-preheader" : "t-subject"); if (f) f.focus(); } : null;
      item(w.level === "error" ? "error" : "warning", w.message, go);
    });
    box.appendChild(ul);
  }

  // ---------- Enregistrement (manuel et automatique) ----------
  function showError(message) { var box = $("mk-editor-error"); box.textContent = message || ""; box.hidden = !message; }
  var autosaveTimer = null;
  function scheduleAutosave() { if (readOnly) return; clearTimeout(autosaveTimer); autosaveTimer = setTimeout(function () { save({ manual: false }); }, 2500); }
  function save(opts) {
    opts = opts || {};
    if (readOnly) return Promise.resolve(false);
    if (saving) { scheduleAutosave(); return Promise.resolve(false); }
    if (!dirty && !opts.manual) return Promise.resolve(true);
    // Brouillon incomplet : l'enregistrement automatique attend (le serveur refuserait), l'état le dit clairement
    if (!opts.manual && blockErrors.length) { status("invalid", blockErrors.length + " bloc" + (blockErrors.length > 1 ? "s" : "") + " à compléter · non enregistré"); return Promise.resolve(false); }
    clearTimeout(autosaveTimer);
    saving = true; status("saving", "Enregistrement…");
    var sentPos = pos;
    return fetch("/marketing/modeles/" + state.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template: payload(), version: state.version, autosave: !opts.manual }) })
      .then(function (res) { return res.json().catch(function () { return {}; }).then(function (j) { return { ok: res.ok, status: res.status, j: j }; }); })
      .then(function (r) {
        saving = false;
        if (!r.ok) {
          console.error("[éditeur] enregistrement refusé", r.status, r.j);
          status("error", r.status === 409 ? "Conflit : modifié ailleurs" : "Impossible d'enregistrer");
          showError((r.j && r.j.error) || "Enregistrement impossible.");
          return false;
        }
        state.version = r.j.version; showError("");
        var snaps = r.j.courseSnapshots || {};
        state.blocks.forEach(function (b) { if (b.type === "course") { b.refresh = false; if (snaps[b.id]) b.snapshot = snaps[b.id]; } });
        savedPos = sentPos;
        dirty = pos !== savedPos;
        if (dirty) { status("dirty", "Modifications non enregistrées"); scheduleAutosave(); }
        else status("saved", savedLabel() + " · " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
        if (opts.manual) renderProps();
        return true;
      })
      .catch(function (e) {
        saving = false; console.error("[éditeur] enregistrement", e);
        status("error", "Impossible d'enregistrer"); showError("Enregistrement impossible pour le moment : vérifiez votre connexion, puis « Réessayer ».");
        return false;
      });
  }
  var saveBtn = $("mk-save");
  if (saveBtn) saveBtn.addEventListener("click", function () { save({ manual: true }); });
  if (retryBtn) retryBtn.addEventListener("click", function () { save({ manual: true }); });
  window.addEventListener("beforeunload", function (e) { if (dirty || saving) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- Boîtes de dialogue : aperçu, test, versions ; menu « Plus » ----------
  function openDialog(id) { var d = $(id); if (d && !d.open) { d.showModal(); if (window.mkDialogFocusFirst) window.mkDialogFocusFirst(d); } return d; }
  [].forEach.call(document.querySelectorAll("[data-close-dialog]"), function (b) { b.addEventListener("click", function () { var d = b.closest("dialog"); if (d) d.close(); }); });
  [].forEach.call(document.querySelectorAll("dialog"), function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });
  // Fenêtre « Aperçu » (public/js/mk/preview.js) : rendu réel, appareils, vérifications, navigateur, test
  var previewWin = window.MkPreview ? window.MkPreview.create({
    el: el, announce: announce, toast: toast, postJson: postJson, payload: payload, templateId: state.id,
    openDialog: openDialog,
    contact: function () { return contactSel.value; },
    setContact: function (v) { if (contactSel.value !== v) { contactSel.value = v; stopInline({ rerender: false }); runPreview(); } },
    // Version enregistrée à jour (test, navigateur) : attend un enregistrement automatique en cours, puis enregistre si besoin
    ensureSaved: function () {
      if (readOnly) return Promise.resolve(true);
      return new Promise(function (resolve) {
        (function attempt(n) {
          if (saving) { if (n > 75) resolve(false); else setTimeout(function () { attempt(n + 1); }, 200); return; }
          if (!dirty) { resolve(true); return; }
          save({ manual: true }).then(resolve, function () { resolve(false); });
        })(0);
      });
    },
  }) : null;
  if ($("mk-open-preview")) $("mk-open-preview").addEventListener("click", function () { stopInline(); if (previewWin) previewWin.open(); });
  if ($("mk-open-test")) $("mk-open-test").addEventListener("click", function () { openDialog("mk-test-dialog"); });
  var testForm = $("mk-test-dialog") && $("mk-test-dialog").querySelector("form");
  if (testForm) testForm.addEventListener("submit", function (e) {
    // Le test part de la version ENREGISTRÉE : enregistrer d'abord s'il reste des modifications
    if (!dirty) return;
    e.preventDefault();
    save({ manual: true }).then(function (ok) { if (ok) testForm.submit(); else toast("Enregistrez d'abord le modèle (voir le message d'erreur) avant l'envoi du test.", "error"); });
  });
  if ($("mk-open-versions")) $("mk-open-versions").addEventListener("click", function () { closeMore(); openDialog("mk-versions-dialog"); });
  var moreBtn = $("mk-more"), moreMenu = $("mk-more-menu");
  function closeMore() { if (moreMenu) { if (window.kbFloat) window.kbFloat.close(moreMenu); moreMenu.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); } }
  if (moreBtn) {
    moreBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!moreMenu.hidden) { closeMore(); return; }
      moreMenu.hidden = false; moreBtn.setAttribute("aria-expanded", "true");
      if (window.kbFloat) window.kbFloat.open(moreBtn, moreMenu, { onClose: function () { moreMenu.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); } });
      var f = moreMenu.querySelector("[role=menuitem]"); if (f) f.focus();
    });
    document.addEventListener("click", function (e) { if (!moreMenu.contains(e.target)) closeMore(); });
    moreMenu.addEventListener("keydown", function (e) {
      var items = [].slice.call(moreMenu.querySelectorAll("[role=menuitem]")), i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { closeMore(); moreBtn.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
    });
  }

  // ---------- Édition directe du texte dans l'e-mail ----------
  // Le bloc texte sélectionné devient éditable DANS le canevas (son contenu source, nettoyé) ; chaque frappe met à jour
  // block.html (même nettoyage que l'ancien champ), l'historique et l'enregistrement automatique. Le canevas n'est pas
  // rechargé pendant l'écriture (curseur et sélection conservés) ; le rendu réel revient en quittant le bloc.
  var inline = null, inlineTyping = false;
  var FONT_STACKS = { system: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif: "Georgia,'Times New Roman',serif", arial: "Arial,Helvetica,sans-serif", verdana: "Verdana,Geneva,sans-serif", trebuchet: "'Trebuchet MS',Helvetica,sans-serif", tahoma: "Tahoma,Verdana,sans-serif", times: "'Times New Roman',Times,serif", courier: "'Courier New',Courier,monospace" };
  var INLINE_KEYS = ["html", "font", "fontSize", "lineHeight", "color", "letterSpacing", "align", "weight", "italic"];
  function themeValue(k) { return state.theme && state.theme[k] != null ? state.theme[k] : THEME_DEFAULTS[k]; }
  function inlineSignature() {
    // Données telles qu'envoyées au serveur (un réglage vide affiché dans le panneau ne compte pas comme un changement)
    return JSON.stringify({ t: state.theme, b: state.blocks.map(function (b) { var c = cleanBlock(b); if (b.id === inline.id) INLINE_KEYS.forEach(function (k) { delete c[k]; }); return c; }) });
  }
  // Seuls le texte et la typographie du bloc en cours ont changé : on les applique en direct ; sinon, fin de l'écriture
  function keepInline() {
    if (!blockById(inline.id)) { inline = null; return false; }
    if (inlineSignature() === inline.sig) { applyInlineStyle(); return true; }
    stopInline({ rerender: false });
    return false;
  }
  function applyInlineStyle() {
    var b = blockById(inline.id), st = inline.box.style;
    st.fontFamily = FONT_STACKS[b.font || themeValue("fontFamily")] || "";
    st.fontSize = (b.fontSize || 16) + "px";
    st.lineHeight = String(b.lineHeight || 1.6);
    st.color = b.color || themeValue("textColor");
    st.letterSpacing = b.letterSpacing ? b.letterSpacing + "px" : "";
    st.textAlign = b.align || "";
    inline.box.ownerDocument.documentElement.style.setProperty("--mk-accent", themeValue("accent"));
  }
  function syncInline() {
    var b = inline && blockById(inline.id); if (!b) return;
    var tmp = document.createElement("div");
    importRich(inline.box, tmp); // liste fermée de balises et de styles, adresses de liens vérifiées
    b.html = tmp.innerHTML;
    inlineTyping = true;
    try { changed(); } finally { inlineTyping = false; }
  }
  function inlineInput() { syncInline(); fitFrame(); if (toolbar) toolbar.sync(); }
  function startInline(id, point) {
    if (readOnly) return;
    id = id || selectedId;
    var b = blockById(id);
    if (!b || b.type !== "text" || typeof b.html !== "string") return;
    if (inline && inline.id === id) { inline.box.focus(); return; }
    if (inline) stopInline();
    if (selectedId !== id) select(id, { focus: false });
    if (previewBusy) { pendingInline = { id: id, point: point }; return; } // le canevas se recharge : l'écriture commence ensuite
    var d = frameDoc();
    var row = rows().filter(function (n) { return n.getAttribute("data-mk-block") === id; })[0];
    if (!d || !row || !row.firstElementChild) return;
    var cell = row.firstElementChild;
    var box = d.createElement("div");
    box.setAttribute("data-mk-edit", ""); box.setAttribute("role", "textbox"); box.setAttribute("aria-multiline", "true"); box.setAttribute("aria-label", "Texte du bloc (Échap pour terminer)");
    box.contentEditable = "true"; box.spellcheck = true;
    var tmp = document.createElement("div"); setRich(tmp, b.html); // contenu nettoyé (liste fermée), déplacé nœud par nœud
    while (tmp.firstChild) box.appendChild(tmp.firstChild);
    cell.textContent = ""; cell.appendChild(box);
    row.setAttribute("data-mk-editing", "");
    inline = { id: id, box: box, range: null, sig: null };
    applyInlineStyle();
    inline.sig = inlineSignature();
    try { d.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { /* navigateur ancien */ }
    box.addEventListener("input", inlineInput);
    box.addEventListener("keydown", inlineKeys);
    // Collage : texte seul (les mises en forme d'autres logiciels cassent les e-mails)
    box.addEventListener("paste", function (e) { e.preventDefault(); var text = (e.clipboardData || window.clipboardData).getData("text/plain"); d.execCommand("insertText", false, text); });
    box.focus();
    var sel = d.getSelection(), r = null;
    if (point && d.caretRangeFromPoint) { r = d.caretRangeFromPoint(point.x, point.y); if (r && !box.contains(r.startContainer)) r = null; }
    if (!r) { r = d.createRange(); r.selectNodeContents(box); r.collapse(false); }
    sel.removeAllRanges(); sel.addRange(r);
    textApi.saveRange(); fitFrame();
    if (toolbar) toolbar.sync();
    announce("Écriture dans le texte : la barre d'outils au-dessus du canevas met en forme la sélection. Échap pour terminer.");
  }
  function stopInline(opts) {
    if (!inline) return;
    var cur = inline; inline = null;
    cur.box.contentEditable = "false";
    if (cur.box.parentNode && cur.box.parentNode.parentNode) cur.box.parentNode.parentNode.removeAttribute("data-mk-editing");
    if (!opts || opts.rerender !== false) schedulePreview();
    if (toolbar) toolbar.sync();
  }
  function inlineKeys(e) {
    var k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); stopInline(); announce("Écriture terminée : le bloc reste sélectionné."); return; } // un 2e Échap désélectionne
    if (!mod) return;
    if (k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (k === "y") { e.preventDefault(); redo(); }
    else if (k === "s") { e.preventDefault(); save({ manual: true }); }
    else if (k === "k") { e.preventDefault(); var lb = $("mk-ctxbar").querySelector('[aria-label="Lien (Ctrl+K)"]'); if (lb) lb.click(); }
  }
  function rgbHex(v) { var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/.exec(v || ""); if (!m || m[4] === "0") return ""; return "#" + [m[1], m[2], m[3]].map(function (x) { return ("0" + parseInt(x, 10).toString(16)).slice(-2); }).join(""); }
  // Commandes de texte : toujours sur la sélection de l'e-mail (gardée quand on clique dans la barre)
  var textApi = {
    active: function () { return !!inline; },
    doc: function () { return inline ? inline.box.ownerDocument : null; },
    saveRange: function () { if (!inline) return; var s = textApi.doc().getSelection(); if (s.rangeCount && inline.box.contains(s.anchorNode)) inline.range = s.getRangeAt(0).cloneRange(); },
    restore: function () { var d = textApi.doc(); inline.box.focus(); if (inline.range) { var s = d.getSelection(); s.removeAllRanges(); s.addRange(inline.range); } },
    exec: function (cmd, value, css) {
      if (!inline) return;
      var d = textApi.doc(); textApi.restore();
      try { d.execCommand("styleWithCSS", false, !!css); d.execCommand(cmd, false, value == null ? null : value); } catch (e) { console.error("[éditeur] commande", cmd, e); }
      textApi.saveRange(); inlineInput();
    },
    state: function (cmd) { try { return textApi.doc().queryCommandState(cmd); } catch (e) { return false; } },
    anchorEl: function () {
      var s = textApi.doc().getSelection(), n = s.rangeCount ? s.anchorNode : null;
      if (!n || !inline.box.contains(n)) n = inline.box.firstElementChild || inline.box;
      return n.nodeType === 3 ? n.parentNode : n;
    },
    hasSelection: function () { var s = textApi.doc().getSelection(); return !!(s.rangeCount && !s.isCollapsed && inline.box.contains(s.anchorNode)); },
    blockTag: function () { for (var n = textApi.anchorEl(); n && n !== inline.box; n = n.parentNode) { if (/^(P|H2|H3|H4|BLOCKQUOTE)$/.test(n.tagName)) return n.tagName.toLowerCase(); if (n.tagName === "LI") return "p"; } return "p"; },
    setBlock: function (tag) { textApi.exec("formatBlock", "<" + tag + ">"); },
    sizeAtCaret: function () { var n = textApi.anchorEl(); return Math.round(parseFloat(textApi.doc().defaultView.getComputedStyle(n).fontSize)); },
    colorAtCaret: function () { return rgbHex(textApi.doc().defaultView.getComputedStyle(textApi.anchorEl()).color); },
    highlightAtCaret: function () { for (var n = textApi.anchorEl(); n && n !== inline.box; n = n.parentNode) { var v = rgbHex(n.style && n.style.backgroundColor); if (v) return v; } return ""; },
    setSize: function (px) {
      textApi.exec("fontSize", "7"); // marque la sélection (<font size=7>), remplacée par une vraie taille en pixels
      [].forEach.call(inline.box.querySelectorAll('font[size="7"]'), function (f) { var sp = f.ownerDocument.createElement("span"); sp.style.fontSize = px + "px"; while (f.firstChild) sp.appendChild(f.firstChild); f.parentNode.replaceChild(sp, f); });
      inlineInput();
    },
    link: function () { if (!inline) return null; for (var n = textApi.anchorEl(); n && n !== inline.box; n = n.parentNode) if (n.tagName === "A") return n; return null; },
    applyLink: function (url, newTab) {
      if (!SAFE_HREF.test(url) || /\s/.test(url)) return "Adresse invalide : commencez par https:// ou mailto: (ou {{unsubscribe_url}}).";
      var d = textApi.doc(); textApi.restore();
      var a = textApi.link();
      if (a) a.setAttribute("href", url);
      else {
        var s = d.getSelection();
        if (s.isCollapsed) { d.execCommand("insertText", false, url); var r = s.getRangeAt(0); r.setStart(r.startContainer, Math.max(0, r.startOffset - url.length)); s.removeAllRanges(); s.addRange(r); } // sans texte choisi : l'adresse devient le texte
        d.execCommand("createLink", false, url);
        a = textApi.link() || inline.box.querySelector('a[href="' + url.replace(/"/g, "") + '"]');
      }
      if (a) { if (newTab) a.setAttribute("target", "_blank"); else a.removeAttribute("target"); }
      textApi.saveRange(); inlineInput();
      return true;
    },
    removeLink: function () {
      var d = textApi.doc(); textApi.restore();
      var a = textApi.link();
      if (a) { var r = d.createRange(); r.selectNodeContents(a); var s = d.getSelection(); s.removeAllRanges(); s.addRange(r); }
      d.execCommand("unlink"); textApi.saveRange(); inlineInput();
    },
    insertVariable: function (path) { textApi.exec("insertText", "{{" + path + "}}"); },
    // Retrait : dans une liste, imbrication réelle ; sinon décalage du paragraphe (24 px par niveau, 4 niveaux)
    indent: function (delta) {
      if (!inline) return;
      textApi.restore();
      for (var n = textApi.anchorEl(); n && n !== inline.box; n = n.parentNode) if (n.tagName === "LI") { textApi.exec(delta > 0 ? "indent" : "outdent"); return; }
      var s = textApi.doc().getSelection(), r = s.rangeCount ? s.getRangeAt(0) : null;
      [].forEach.call(inline.box.querySelectorAll("p, h2, h3, h4, blockquote"), function (blk) {
        if (r && !r.intersectsNode(blk)) return;
        var cur = parseInt(blk.style.marginLeft, 10) || 0, next = Math.max(0, Math.min(96, cur + delta * 24));
        blk.style.marginLeft = next ? next + "px" : "";
      });
      inlineInput();
    },
    clear: function () { textApi.exec("removeFormat"); textApi.exec("unlink"); },
  };

  // ---------- Barre d'outils contextuelle (public/js/mk/toolbar.js) ----------
  var toolbar = null;
  if (window.MkToolbar && $("mk-ctxbar") && !readOnly) {
    var varList = function () { var sel = document.createElement("select"); fillVariableOptions(sel); return [].filter.call(sel.options, function (o) { return o.value; }).map(function (o) { return [o.value, o.textContent]; }); };
    toolbar = window.MkToolbar.create({
      root: $("mk-ctxbar"), el: el, iconSpan: iconSpan, announce: announce, toast: toast,
      label: function (b) { return label(b); },
      block: function () { return selectedId ? blockById(selectedId) : null; },
      blockChanged: function (opts) { changed(opts && opts.structural); renderProps(); },
      theme: function () { var t = {}; Object.keys(THEME_DEFAULTS).forEach(function (k) { t[k] = themeValue(k); }); return t; },
      setTheme: function (k, v) { state.theme[k] = v; syncSettings(); applyDesktopWidth(); changed(); },
      fonts: function () { return (data.fonts || Object.keys(FONT_LABELS)).map(function (k) { return [k, FONT_LABELS[k] || k]; }); },
      variables: varList,
      blockTypes: function () { return Object.keys(TYPES).map(function (t) { return [t, BLOCKS[t] ? BLOCKS[t].label : t]; }); },
      addBlock: function (type) { addBlock(type); },
      toggleHidden: function () { if (selectedId) toggleHidden(selectedId); },
      openProps: function (tab) { propsTab = tab; renderProps(); var f = props.querySelector("#mk-tab-" + tab); if (f) f.focus(); },
      uploadInto: function (file) { uploadFiles([file], { target: selectedId }); },
      openMediaFor: function () { pickFor = selectedId; showPane("media"); setMediaStatus("Choisissez une image pour le bloc sélectionné."); },
      startInline: function () { if (selectedId) { scrollToBlock(selectedId); startInline(selectedId); } },
      text: textApi,
    });
  }

  // ---------- Démarrage ----------
  state.blocks.forEach(function (b) { if (!b.id) b.id = genId(); });
  renderStructure();
  renderProps();
  refreshMessageFields();
  record(null);
  savedPos = 0;
  updateHistoryUi();
  runPreview();
})();

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
    text: function () { return { type: "text", markdown: "Votre texte ici." }; },
    image: function () { return { type: "image", src: "", alt: "", decorative: false, width: 552, align: "center" }; },
    button: function () { return { type: "button", label: "Cliquez ici", url: "", align: "center" }; },
    divider: function () { return { type: "divider" }; },
    spacer: function () { return { type: "spacer", height: 24 }; },
    columns: function () { return { type: "columns", left: "Colonne de gauche", right: "Colonne de droite" }; },
    quote: function () { return { type: "quote", text: "Une citation inspirante.", author: "" }; },
    list: function () { return { type: "list", style: "bullets", items: ["Premier élément", "Deuxième élément"] }; },
    social: function () { return { type: "social", align: "center", links: [{ network: "facebook", url: "" }] }; },
    video: function () { return { type: "video", url: "", thumbnail: "", title: "", width: 552, align: "center" }; },
    course: function () { return { type: "course", courseId: data.courses && data.courses.length ? data.courses[0].id : undefined, cta: "Voir la formation" }; }
  };
  var NETWORKS = [["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"], ["website", "Site web"]];
  var LIST_STYLES = [["bullets", "Puces"], ["numbers", "Numéros"], ["checks", "Coches ✓"]];
  var ALIGNS = [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]];
  var THEME_DEFAULTS = { background: "#f3f8fc", contentBackground: "#ffffff", textColor: "#10222f", accent: "#0277b6", fontFamily: "system" };

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
    pos = index; lastKey = null;
    var snap = JSON.parse(history[pos]);
    ["name", "kind", "category", "subject", "preheader", "theme", "footer", "blocks"].forEach(function (k) { state[k] = snap[k]; });
    state.footer = state.footer || { text: "" }; state.theme = state.theme || {};
    if (selectedId && indexOfId(selectedId) === -1) selectedId = null;
    syncSettings(); renderStructure(); renderProps(); updateHistoryUi();
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
    var typing = a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && a.type !== "checkbox"));
    record(typing && a.id ? a.id : null);
    if (structural) renderStructure();
    else refreshStructureLabels();
    schedulePreview();
    scheduleAutosave();
  }

  // ---------- Contenu envoyé au serveur ----------
  function intOrUndefined(v) { var n = parseInt(v, 10); return isNaN(n) ? undefined : n; }
  function cleanBlock(b) {
    var o = { id: b.id, type: b.type };
    if (b.type === "heading") { o.text = b.text || ""; o.level = intOrUndefined(b.level) || 2; o.align = b.align || "left"; }
    else if (b.type === "text") { o.markdown = b.markdown || ""; }
    else if (b.type === "image") {
      o.src = b.src || ""; o.alt = b.alt || ""; o.decorative = !!b.decorative; o.align = b.align || "left";
      var w = intOrUndefined(b.width); if (w !== undefined) o.width = w;
      if (b.href && b.href.trim()) o.href = b.href.trim();
    } else if (b.type === "button") {
      o.label = b.label || ""; o.url = b.url || ""; o.align = b.align || "center";
      if (b.color) o.color = b.color;
    } else if (b.type === "spacer") { var h = intOrUndefined(b.height); if (h !== undefined) o.height = h; }
    else if (b.type === "columns") { o.left = b.left || ""; o.right = b.right || ""; }
    else if (b.type === "quote") { o.text = b.text || ""; if (b.author && b.author.trim()) o.author = b.author; }
    else if (b.type === "list") { o.style = b.style || "bullets"; o.items = (b.items || []).slice(); }
    else if (b.type === "social") { o.align = b.align || "center"; o.links = (b.links || []).map(function (l) { return { network: l.network, url: l.url || "" }; }); }
    else if (b.type === "video") {
      o.url = b.url || ""; o.title = b.title || ""; o.align = b.align || "center";
      if (b.thumbnail && b.thumbnail.trim()) o.thumbnail = b.thumbnail.trim();
      var vw = intOrUndefined(b.width); if (vw !== undefined) o.width = vw;
    } else if (b.type === "course") {
      o.courseId = intOrUndefined(b.courseId); o.cta = b.cta || "Voir la formation";
      if (b.snapshot) o.snapshot = b.snapshot;
      if (b.refresh) o.refresh = true;
    }
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
  function textField(block, key, labelText, opts) {
    opts = opts || {};
    var input = el("input", { type: "text", id: "f-" + block.id + "-" + key, maxlength: String(opts.max || 500) });
    if (opts.vars) input.setAttribute("data-var-target", "");
    if (opts.placeholder) input.setAttribute("placeholder", opts.placeholder);
    input.value = block[key] == null ? "" : String(block[key]);
    if (readOnly) input.disabled = true;
    input.addEventListener("input", function () { block[key] = input.value; changed(); });
    return group(labelText, input, opts.hint);
  }
  function selectField(block, key, labelText, options, fallback) {
    var sel = el("select", { id: "f-" + block.id + "-" + key });
    options.forEach(function (o) { sel.appendChild(el("option", { value: String(o[0]) }, o[1])); });
    sel.value = String(block[key] == null ? fallback : block[key]);
    if (readOnly) sel.disabled = true;
    sel.addEventListener("change", function () { block[key] = sel.value; changed(); });
    return group(labelText, sel);
  }
  function numberField(block, key, labelText, min, max) {
    var input = el("input", { type: "number", id: "f-" + block.id + "-" + key, min: String(min), max: String(max), step: "1" });
    input.value = block[key] == null ? "" : String(block[key]);
    if (readOnly) input.disabled = true;
    input.addEventListener("input", function () { block[key] = input.value === "" ? undefined : parseInt(input.value, 10); changed(); });
    return group(labelText, input);
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
  function checkField(block, key, labelText) {
    var input = el("input", { type: "checkbox", id: "f-" + block.id + "-" + key });
    input.checked = !!block[key];
    if (readOnly) input.disabled = true;
    input.addEventListener("change", function () { block[key] = input.checked; changed(); });
    var lab = el("label", { "class": "checkbox-row", "for": input.id });
    lab.appendChild(input);
    lab.appendChild(document.createTextNode(" " + labelText));
    var wrap = el("div", { "class": "field-group" });
    wrap.appendChild(lab);
    return wrap;
  }
  function colorField(block) {
    var wrap = el("div", { "class": "field-group" });
    var toggle = el("input", { type: "checkbox", id: "f-" + block.id + "-customcolor" });
    toggle.checked = !!block.color;
    var color = el("input", { type: "color", id: "f-" + block.id + "-color", "aria-label": "Couleur du bouton" });
    color.value = block.color || state.theme.accent || "#0277b6";
    color.disabled = readOnly || !toggle.checked;
    toggle.disabled = readOnly;
    toggle.addEventListener("change", function () { color.disabled = readOnly || !toggle.checked; block.color = toggle.checked ? color.value : undefined; changed(); });
    color.addEventListener("input", function () { block.color = color.value; changed(); });
    var lab = el("label", { "class": "checkbox-row", "for": toggle.id });
    lab.appendChild(toggle);
    lab.appendChild(document.createTextNode(" Couleur personnalisée (sinon : couleur principale des styles)"));
    wrap.appendChild(lab);
    wrap.appendChild(color);
    return wrap;
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
    out.push(textField(block, "cta", "Texte du bouton", { vars: true, max: 80 }));
    if (block.snapshot) out.push(checkField(block, "refresh", "Actualiser titre, prix et image depuis le catalogue à l'enregistrement"));
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
  // Réglages d'un bloc, rangés en sections (contenu, apparence…) ; la condition d'affichage vient toujours en dernier
  function blockSections(block) {
    var out = [];
    function sec(title, nodes) { out.push({ title: title, nodes: nodes.filter(Boolean) }); }
    if (block.type === "heading") {
      sec("Contenu", [textField(block, "text", "Titre", { vars: true, max: 200 })]);
      sec("Apparence", [selectField(block, "level", "Taille", [[1, "Grand"], [2, "Moyen"]], 2), selectField(block, "align", "Alignement", ALIGNS, "left")]);
    } else if (block.type === "text") {
      sec("Contenu", [markdownField(block, "markdown", "Texte", 8)]);
    } else if (block.type === "image") {
      sec("Image", [imageSource(block), textField(block, "src", "Adresse de l'image (https://…)", { max: 2000, placeholder: "https://exemple.fr/image.png" }),
        textField(block, "alt", "Texte alternatif", { vars: true, max: 200, hint: "Décrit l'image aux lecteurs d'écran et quand l'image est bloquée." }), checkField(block, "decorative", "Image décorative (pas de texte alternatif)")]);
      sec("Mise en page", [numberField(block, "width", "Largeur (px, 40 à 600)", 40, 600), selectField(block, "align", "Alignement", ALIGNS, "left")]);
      sec("Lien", [textField(block, "href", "Lien au clic (facultatif)", { max: 2000, placeholder: "https://exemple.fr" })]);
    } else if (block.type === "button") {
      sec("Contenu", [textField(block, "label", "Texte du bouton", { vars: true, max: 80 }), textField(block, "url", "Adresse (https://… ou mailto:)", { max: 2000, placeholder: "https://exemple.fr" })]);
      sec("Apparence", [selectField(block, "align", "Alignement", ALIGNS, "center"), colorField(block)]);
    } else if (block.type === "spacer") {
      sec("Dimensions", [numberField(block, "height", "Hauteur (px, 4 à 120)", 4, 120)]);
    } else if (block.type === "columns") {
      sec("Contenu", [markdownField(block, "left", "Colonne de gauche", 5), markdownField(block, "right", "Colonne de droite", 5), el("p", { "class": "field-hint" }, "Sur mobile, les deux colonnes s'affichent l'une sous l'autre.")]);
    } else if (block.type === "divider") {
      sec("Réglages", [el("p", { "class": "field-hint" }, "Une ligne fine de séparation : aucun réglage.")]);
    } else if (block.type === "quote") {
      sec("Contenu", [textField(block, "text", "Citation", { vars: true, max: 500 }), textField(block, "author", "Auteur (facultatif)", { vars: true, max: 100 })]);
    } else if (block.type === "list") {
      sec("Contenu", [itemsField(block)]);
      sec("Apparence", [selectField(block, "style", "Style", LIST_STYLES, "bullets")]);
    } else if (block.type === "social") {
      sec("Liens", [socialField(block)]);
      sec("Apparence", [selectField(block, "align", "Alignement", ALIGNS, "center")]);
    } else if (block.type === "video") {
      sec("Vidéo", [textField(block, "url", "Adresse de la vidéo (https://…)", { max: 2000, placeholder: "https://youtube.com/watch?v=…" }), textField(block, "title", "Titre de la vidéo (texte alternatif)", { vars: true, max: 200 }),
        textField(block, "thumbnail", "Miniature (adresse d'une image https://…, facultatif)", { max: 2000, placeholder: "https://exemple.fr/miniature.jpg" }),
        el("p", { "class": "field-hint" }, "Un e-mail ne peut pas lire de vidéo : le message affiche la miniature et un lien « Regarder la vidéo ».")]);
      sec("Mise en page", [numberField(block, "width", "Largeur de la miniature (px, 40 à 600)", 40, 600), selectField(block, "align", "Alignement", ALIGNS, "center")]);
    } else if (block.type === "course") {
      sec("Formation", courseField(block));
    }
    return out;
  }
  function conditionSection(block) {
    var details = el("details", { "class": "mk-advanced mk-b-section" });
    var sum = el("summary", { "class": "mk-b-section-title" }, "Condition d'affichage");
    if (block.showIf) sum.appendChild(el("span", { "class": "mk-b-pill" }, "Active"));
    details.appendChild(sum);
    details.appendChild(textField(block, "showIf", "Afficher ce bloc seulement si…", { max: 200, placeholder: "contact.country == \"FR\"", hint: "Ex. : contact.country == \"FR\" · contact.company · not contact.company" }));
    if (block.showIf) details.open = true;
    return details;
  }

  // ---------- Opérations sur les blocs ----------
  function insertIndex() { var i = selectedId ? indexOfId(selectedId) : -1; return i === -1 ? state.blocks.length : i + 1; }
  function addBlock(type, at, preset) {
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
    var body = el("div", { "class": "mk-b-props-body" });
    blockSections(block).forEach(function (sct) {
      var box = el("section", { "class": "mk-b-section" });
      box.appendChild(el("h3", { "class": "mk-b-section-title" }, sct.title));
      sct.nodes.forEach(function (n) { box.appendChild(n); });
      body.appendChild(box);
    });
    body.appendChild(conditionSection(block));
    props.appendChild(body);
  }

  // ---------- Structure (liste des blocs, accessible au clavier, réordonnable) ----------
  var structure = $("mk-structure");
  var dragFrom = -1;
  var BLOCK_DRAG = "text/mk-block", MOVE_DRAG = "text/mk-move";
  function plain(md) { return String(md || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*#_>`]/g, "").replace(/^\s*-\s+/gm, ""); }
  function summaryOf(b) {
    var s = "";
    if (b.type === "heading" || b.type === "quote") s = b.text;
    else if (b.type === "text") s = plain(b.markdown);
    else if (b.type === "button") s = (b.label || "") + (b.url ? " → " + b.url : "");
    else if (b.type === "image") s = b.alt || (b.src ? b.src.split("/").pop() : "");
    else if (b.type === "list") s = (b.items || []).join(" · ");
    else if (b.type === "columns") s = plain(b.left) + (b.right ? " | " + plain(b.right) : "");
    else if (b.type === "video") s = b.title || b.url;
    else if (b.type === "social") s = (b.links || []).map(function (l) { var n = NETWORKS.filter(function (x) { return x[0] === l.network; })[0]; return n ? n[1] : l.network; }).join(", ");
    else if (b.type === "course") { var c = (data.courses || []).filter(function (x) { return x.id === b.courseId; })[0]; s = c ? c.title : (b.snapshot ? b.snapshot.title : ""); }
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
  [["t-bg", "background"], ["t-cbg", "contentBackground"], ["t-text", "textColor"], ["t-accent", "accent"], ["t-font", "fontFamily"]].forEach(function (pair) {
    bind(pair[0], function () { return state.theme[pair[1]] || THEME_DEFAULTS[pair[1]]; }, function (v) { state.theme[pair[1]] = v; });
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
    state.theme = Object.assign({}, THEME_DEFAULTS); syncSettings(); changed(); announce("Styles réinitialisés.");
  });

  // ---------- Canevas : rendu réel de l'e-mail, blocs cliquables, glisser-déposer ----------
  var frame = $("mk-frame");
  var canvas = $("mk-canvas");
  var contactSel = $("mk-contact");
  (data.contacts || []).forEach(function (c) { contactSel.appendChild(el("option", { value: String(c.id) }, c.email)); });
  contactSel.addEventListener("change", runPreview);
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
  fitZoom();
  var previewTimer = null, previewSeq = 0;
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(runPreview, 350); }
  function runPreview() {
    var seq = ++previewSeq;
    var body = { template: payload(), annotate: true };
    if (contactSel.value) body.contactId = parseInt(contactSel.value, 10);
    fetch("/marketing/modeles/apercu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (seq !== previewSeq) return; // réponse périmée
        if (!r.ok) { showError(r.j.error || "Aperçu impossible."); return; }
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
      .catch(function (e) { if (seq === previewSeq) { console.error("[éditeur] aperçu", e); showError("Aperçu impossible pour le moment : vérifiez votre connexion."); } });
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
  var EDIT_CSS = "[data-mk-block]{cursor:pointer}[data-mk-block]>td{transition:box-shadow .12s}[data-mk-block][data-mk-hover]>td{box-shadow:inset 0 0 0 1px #7aa7c7}" +
    "[data-mk-block][data-mk-selected]>td{box-shadow:inset 0 0 0 2px #0277b6}a{pointer-events:none}#mk-insert{position:absolute;left:12px;right:12px;height:0;border-top:3px solid #0277b6;border-radius:2px;pointer-events:none;z-index:10}" +
    "#mk-insert::before{content:'';position:absolute;left:-5px;top:-6.5px;width:10px;height:10px;border-radius:50%;background:#0277b6}" +
    "[data-mk-block][data-mk-selected]>td{background-image:linear-gradient(rgba(2,119,182,.04),rgba(2,119,182,.04))}";
  frame.addEventListener("load", decorateFrame);
  function decorateFrame() {
    var d = frameDoc();
    if (!d || !d.body) return;
    var st = d.createElement("style"); st.textContent = EDIT_CSS; d.head.appendChild(st);
    d.body.style.position = "relative";
    fitFrame();
    markSelection();
    d.addEventListener("click", function (e) {
      e.preventDefault(); // un lien de l'e-mail ne s'ouvre jamais dans l'éditeur
      var row = e.target.closest && e.target.closest("[data-mk-block]");
      if (row) select(row.getAttribute("data-mk-block"), { focus: false });
    }, true);
    d.addEventListener("mouseover", function (e) {
      var row = e.target.closest && e.target.closest("[data-mk-block]");
      rows().forEach(function (n) { n.toggleAttribute("data-mk-hover", n === row); });
    });
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
    if (d && d.body) rows().forEach(function (n) { n.toggleAttribute("data-mk-selected", n.getAttribute("data-mk-block") === selectedId); });
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
    blockbar.style.left = Math.round(box.right + 10) + "px";
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
  function openDialog(id) { var d = $(id); if (d && !d.open) d.showModal(); return d; }
  [].forEach.call(document.querySelectorAll("[data-close-dialog]"), function (b) { b.addEventListener("click", function () { var d = b.closest("dialog"); if (d) d.close(); }); });
  [].forEach.call(document.querySelectorAll("dialog"), function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });
  var pframe = $("mk-preview-frame");
  if ($("mk-open-preview")) $("mk-open-preview").addEventListener("click", function () {
    openDialog("mk-preview-dialog");
    $("mk-preview-subject").textContent = "…";
    var body = { template: payload() };
    if (contactSel.value) body.contactId = parseInt(contactSel.value, 10);
    postJson("/marketing/modeles/apercu", body).then(function (j) { pframe.srcdoc = j.html; $("mk-preview-subject").textContent = j.subject; $("mk-text").textContent = j.text; })
      .catch(function (e) { pframe.srcdoc = ""; $("mk-preview-subject").textContent = "Aperçu impossible : " + e.message; });
  });
  [].forEach.call(document.querySelectorAll("[data-psize]"), function (btn) {
    btn.addEventListener("click", function () {
      pframe.style.width = btn.getAttribute("data-psize") + "px";
      [].forEach.call(document.querySelectorAll("[data-psize]"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    });
  });
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
  function closeMore() { if (moreMenu) { moreMenu.hidden = true; moreBtn.setAttribute("aria-expanded", "false"); } }
  if (moreBtn) {
    moreBtn.addEventListener("click", function (e) { e.stopPropagation(); var open = moreMenu.hidden; moreMenu.hidden = !open; moreBtn.setAttribute("aria-expanded", String(open)); if (open) { var f = moreMenu.querySelector("[role=menuitem]"); if (f) f.focus(); } });
    document.addEventListener("click", function (e) { if (!moreMenu.contains(e.target)) closeMore(); });
    moreMenu.addEventListener("keydown", function (e) {
      var items = [].slice.call(moreMenu.querySelectorAll("[role=menuitem]")), i = items.indexOf(document.activeElement);
      if (e.key === "Escape") { closeMore(); moreBtn.focus(); }
      else if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus(); }
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

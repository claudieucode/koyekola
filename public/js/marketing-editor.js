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
      var tools = el("div", { "class": "mk-tools", role: "group", "aria-label": "Mise en forme" });
      [["Gras", "**", "**", "texte"], ["Italique", "*", "*", "texte"], ["Lien", "[", "](https://)", "texte du lien"], ["Titre", "## ", "", "Titre"], ["Liste", "- ", "", "élément"]].forEach(function (t) {
        var b = el("button", { type: "button" }, t[0]);
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
  function blockFields(block) {
    var f = [];
    if (block.type === "heading") {
      f.push(textField(block, "text", "Titre", { vars: true, max: 200 }));
      f.push(selectField(block, "level", "Taille", [[1, "Grand"], [2, "Moyen"]], 2));
      f.push(selectField(block, "align", "Alignement", ALIGNS, "left"));
    } else if (block.type === "text") {
      f.push(markdownField(block, "markdown", "Texte", 8));
    } else if (block.type === "image") {
      f.push(imageSource(block));
      f.push(textField(block, "src", "Adresse de l'image (https://…)", { max: 2000, placeholder: "https://exemple.fr/image.png" }));
      f.push(textField(block, "alt", "Texte alternatif (décrit l'image aux lecteurs d'écran et si l'image est bloquée)", { vars: true, max: 200 }));
      f.push(checkField(block, "decorative", "Image décorative (pas de texte alternatif)"));
      f.push(numberField(block, "width", "Largeur (px, 40 à 600)", 40, 600));
      f.push(selectField(block, "align", "Alignement", ALIGNS, "left"));
      f.push(textField(block, "href", "Lien au clic (facultatif)", { max: 2000, placeholder: "https://exemple.fr" }));
    } else if (block.type === "button") {
      f.push(textField(block, "label", "Texte du bouton", { vars: true, max: 80 }));
      f.push(textField(block, "url", "Adresse (https://… ou mailto:)", { max: 2000, placeholder: "https://exemple.fr" }));
      f.push(selectField(block, "align", "Alignement", ALIGNS, "center"));
      f.push(colorField(block));
    } else if (block.type === "spacer") {
      f.push(numberField(block, "height", "Hauteur (px, 4 à 120)", 4, 120));
    } else if (block.type === "columns") {
      f.push(markdownField(block, "left", "Colonne de gauche", 5));
      f.push(markdownField(block, "right", "Colonne de droite", 5));
      f.push(el("p", { "class": "field-hint" }, "Sur mobile, les deux colonnes s'affichent l'une sous l'autre."));
    } else if (block.type === "divider") {
      f.push(el("p", { "class": "field-hint" }, "Une ligne fine de séparation : aucun réglage."));
    } else if (block.type === "quote") {
      f.push(textField(block, "text", "Citation", { vars: true, max: 500 }));
      f.push(textField(block, "author", "Auteur (facultatif)", { vars: true, max: 100 }));
    } else if (block.type === "list") {
      f.push(selectField(block, "style", "Style", LIST_STYLES, "bullets"));
      f.push(itemsField(block));
    } else if (block.type === "social") {
      f.push(selectField(block, "align", "Alignement", ALIGNS, "center"));
      f.push(socialField(block));
    } else if (block.type === "video") {
      f.push(textField(block, "url", "Adresse de la vidéo (https://…)", { max: 2000, placeholder: "https://youtube.com/watch?v=…" }));
      f.push(textField(block, "thumbnail", "Miniature (adresse d'une image https://…, facultatif)", { max: 2000, placeholder: "https://exemple.fr/miniature.jpg" }));
      f.push(textField(block, "title", "Titre de la vidéo (texte alternatif)", { vars: true, max: 200 }));
      f.push(numberField(block, "width", "Largeur de la miniature (px, 40 à 600)", 40, 600));
      f.push(selectField(block, "align", "Alignement", ALIGNS, "center"));
      f.push(el("p", { "class": "field-hint" }, "Un e-mail ne peut pas lire de vidéo : le message affiche la miniature et un lien « Regarder la vidéo »."));
    } else if (block.type === "course") {
      courseField(block).forEach(function (n) { f.push(n); });
    }
    var details = el("details", { "class": "mk-advanced" });
    details.appendChild(el("summary", {}, "Condition d'affichage (facultatif)"));
    details.appendChild(textField(block, "showIf", "Afficher ce bloc seulement si…", { max: 200, placeholder: "contact.country == \"FR\"", hint: "Ex. : contact.country == \"FR\" · contact.company · not contact.company" }));
    if (block.showIf) details.open = true;
    f.push(details);
    return f;
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
  function blockToolbar(block) {
    var i = indexOfId(block.id);
    var bar = el("div", { "class": "mk-b-blocktools", role: "toolbar", "aria-label": "Actions du bloc" });
    var up = iconBtn("arrowUp", "Monter le bloc", function () { move(indexOfId(block.id), indexOfId(block.id) - 1); }); up.disabled = i === 0;
    var down = iconBtn("arrowDown", "Descendre le bloc", function () { move(indexOfId(block.id), indexOfId(block.id) + 1); }); down.disabled = i === state.blocks.length - 1;
    bar.appendChild(up); bar.appendChild(down);
    bar.appendChild(iconBtn("copy", "Dupliquer le bloc", function () { duplicate(block.id); }));
    bar.appendChild(iconBtn(block.hidden ? "eye" : "eyeOff", block.hidden ? "Afficher le bloc" : "Masquer le bloc (non envoyé)", function () { toggleHidden(block.id); }));
    bar.appendChild(iconBtn("trash", "Supprimer le bloc", function () { remove(block.id); }, { "class": "mk-b-icon is-danger" }));
    return bar;
  }
  var builder = $("mk-editor");
  function renderProps() {
    if (!props) return;
    props.textContent = "";
    var block = selectedId ? blockById(selectedId) : null;
    builder.classList.toggle("has-selection", !!block); // écran moyen / mobile : les réglages s'ouvrent en panneau
    if (!block) {
      var empty = el("div", { "class": "mk-b-props-empty" });
      empty.appendChild(iconSpan("edit", "mk-b-props-empty-ico"));
      empty.appendChild(el("p", {}, readOnly ? "Cliquez sur un bloc de l'e-mail pour voir ses réglages." : "Cliquez sur un bloc de l'e-mail (ou dans « Structure ») pour le modifier."));
      empty.appendChild(el("p", { "class": "field-hint" }, "L'objet, le préheader et le pied de page se règlent dans l'onglet « Message » ; les couleurs et la police dans « Styles »."));
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
    if (err) props.appendChild(el("p", { "class": "mk-warn is-error", role: "alert" }, "À compléter : " + err.message));
    var body = el("div", { "class": "mk-b-props-body" });
    blockFields(block).forEach(function (n) { body.appendChild(n); });
    props.appendChild(body);
  }

  // ---------- Structure (liste des blocs, accessible au clavier, réordonnable) ----------
  var structure = $("mk-structure");
  var dragFrom = -1;
  var BLOCK_DRAG = "text/mk-block", MOVE_DRAG = "text/mk-move";
  function summaryOf(b) {
    var s = b.text || b.label || b.title || (b.markdown ? b.markdown.replace(/[*#_[\]()]/g, "").slice(0, 60) : "") || (b.type === "image" ? (b.alt || (b.src ? b.src.split("/").pop() : "")) : "") || (b.items ? b.items.join(", ") : "");
    return String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);
  }
  function renderStructure() {
    if (!structure) return;
    structure.textContent = "";
    if (!state.blocks.length) structure.appendChild(el("li", { "class": "mk-structure-empty" }, readOnly ? "Aucun bloc." : "Aucun bloc : ajoutez-en depuis l'onglet « Blocs »."));
    state.blocks.forEach(function (b, index) {
      var li = el("li", { "class": "mk-structure-item" + (b.id === selectedId ? " is-selected" : "") + (b.hidden ? " is-hidden" : ""), "data-id": b.id });
      var btn = el("button", { type: "button", "class": "mk-structure-btn", "aria-current": b.id === selectedId ? "true" : undefined, "aria-label": "Bloc " + (index + 1) + " : " + label(b) + (b.hidden ? " (masqué)" : "") + ". Alt + flèches pour déplacer.", draggable: readOnly ? undefined : "true" });
      var ic = el("span", { "class": "mk-structure-icon", "aria-hidden": "true" }); ic.innerHTML = (BLOCKS[b.type] || {}).icon || "";
      btn.appendChild(ic);
      var txt = el("span", { "class": "mk-structure-text" });
      txt.appendChild(el("span", { "class": "mk-structure-name" }, (index + 1) + ". " + label(b)));
      txt.appendChild(el("span", { "class": "mk-structure-sum" }, summaryOf(b)));
      btn.appendChild(txt);
      if (b.hidden) btn.appendChild(el("span", { "class": "mk-structure-tag" }, "Masqué"));
      if (blockErrors.some(function (x) { return x.id === b.id; })) btn.appendChild(el("span", { "class": "mk-structure-tag is-error" }, "À compléter"));
      btn.addEventListener("click", function () { select(b.id, { scroll: true }); });
      btn.addEventListener("keydown", function (e) {
        if (readOnly || !e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
        e.preventDefault();
        var from = indexOfId(b.id), to = from + (e.key === "ArrowUp" ? -1 : 1);
        move(from, to);
        var again = structure.querySelector('[data-id="' + b.id + '"] .mk-structure-btn'); if (again) again.focus();
      });
      if (!readOnly) {
        btn.addEventListener("dragstart", function (e) { dragFrom = indexOfId(b.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData(MOVE_DRAG, b.id); e.dataTransfer.setData("text/plain", label(b)); li.classList.add("is-dragging"); });
        btn.addEventListener("dragend", function () { dragFrom = -1; li.classList.remove("is-dragging"); clearStructureMarks(); });
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
      li.appendChild(btn);
      structure.appendChild(li);
    });
  }
  function clearStructureMarks() { [].forEach.call(structure.querySelectorAll(".is-drop-before, .is-drop-after"), function (n) { n.classList.remove("is-drop-before", "is-drop-after"); }); }
  function refreshStructureLabels() {
    if (!structure) return;
    state.blocks.forEach(function (b) { var s = structure.querySelector('[data-id="' + b.id + '"] .mk-structure-sum'); if (s) s.textContent = summaryOf(b); });
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
    if (key === "media") loadMedia(false);
    if (key === "check") renderCheck();
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
  if ($("mk-theme-reset")) $("mk-theme-reset").addEventListener("click", function () {
    state.theme = Object.assign({}, THEME_DEFAULTS); syncSettings(); changed(); announce("Styles réinitialisés.");
  });

  // ---------- Canevas : rendu réel de l'e-mail, blocs cliquables, glisser-déposer ----------
  var frame = $("mk-frame");
  var canvas = $("mk-canvas");
  var contactSel = $("mk-contact");
  (data.contacts || []).forEach(function (c) { contactSel.appendChild(el("option", { value: String(c.id) }, c.email)); });
  contactSel.addEventListener("change", runPreview);
  [].forEach.call(document.querySelectorAll("[data-size]"), function (btn) {
    btn.addEventListener("click", function () {
      frame.style.width = btn.getAttribute("data-size") + "px";
      [].forEach.call(document.querySelectorAll("[data-size]"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      setTimeout(fitFrame, 50);
    });
  });
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
  function fitFrame() { var d = frameDoc(); if (!d || !d.documentElement) return; frame.style.height = Math.max(400, d.documentElement.scrollHeight) + "px"; frame.style.minHeight = ""; }
  function scrollToBlock(id) {
    var r = rows().filter(function (n) { return n.getAttribute("data-mk-block") === id; })[0];
    if (!r) return;
    var top = frame.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop + r.getBoundingClientRect().top - 40;
    canvas.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }
  // Styles d'édition injectés dans le rendu (contour au survol / à la sélection, ligne d'insertion) — jamais envoyés
  var EDIT_CSS = "[data-mk-block]{cursor:pointer}[data-mk-block]>td{transition:box-shadow .12s}[data-mk-block][data-mk-hover]>td{box-shadow:inset 0 0 0 1px #7aa7c7}" +
    "[data-mk-block][data-mk-selected]>td{box-shadow:inset 0 0 0 2px #0277b6}a{pointer-events:none}#mk-insert{position:absolute;left:12px;right:12px;height:0;border-top:3px solid #0277b6;border-radius:2px;pointer-events:none;z-index:10}" +
    "#mk-insert::before{content:'';position:absolute;left:-5px;top:-6.5px;width:10px;height:10px;border-radius:50%;background:#0277b6}" +
    "#mk-bar{position:absolute;z-index:11;display:flex;gap:2px;padding:3px;background:#fff;border:1px solid #d5e3ee;border-radius:8px;box-shadow:0 2px 8px rgba(11,42,64,.18)}" +
    "#mk-bar button{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:0;border-radius:6px;background:none;color:#10222f;cursor:pointer}" +
    "#mk-bar button:hover{background:#eaf3fa}#mk-bar button.is-danger{color:#d1121f}#mk-bar span{display:inline-flex}" +
    "#mk-tag{position:absolute;z-index:11;padding:2px 8px;border-radius:6px 6px 0 0;background:#0277b6;color:#fff;font:600 11px/1.6 -apple-system,Segoe UI,Roboto,Arial,sans-serif;pointer-events:none}";
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
      if (e.target.closest && e.target.closest("#mk-bar")) return;
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
    var list = rows().filter(function (n) { return !n.closest("#mk-bar"); });
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
    var d = frameDoc(); if (!d || !d.body) return;
    var old = d.getElementById("mk-bar"); if (old) old.remove();
    var oldTag = d.getElementById("mk-tag"); if (oldTag) oldTag.remove();
    var row = null;
    rows().forEach(function (n) { var on = n.getAttribute("data-mk-block") === selectedId; n.toggleAttribute("data-mk-selected", on); if (on) row = n; });
    [].forEach.call(structure ? structure.querySelectorAll(".mk-structure-item") : [], function (li) {
      var on = li.getAttribute("data-id") === selectedId;
      li.classList.toggle("is-selected", on);
      var b = li.querySelector(".mk-structure-btn"); if (b) { if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); }
    });
    if (!row) return;
    var block = blockById(selectedId);
    var r = row.getBoundingClientRect(), scroll = d.documentElement.scrollTop || d.body.scrollTop;
    var tag = d.createElement("div"); tag.id = "mk-tag"; tag.textContent = label(block) + (block.hidden ? " · masqué" : "");
    tag.style.left = (r.left + 4) + "px"; tag.style.top = (r.top + scroll - 19) + "px";
    d.body.appendChild(tag);
    if (readOnly) return;
    var bar = d.createElement("div"); bar.id = "mk-bar"; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Actions du bloc");
    var i = indexOfId(selectedId);
    [["arrowUp", "Monter", function () { move(indexOfId(selectedId), indexOfId(selectedId) - 1); }, i === 0],
      ["arrowDown", "Descendre", function () { move(indexOfId(selectedId), indexOfId(selectedId) + 1); }, i === state.blocks.length - 1],
      ["edit", "Modifier (réglages à droite)", function () { select(selectedId, { focus: true }); }],
      ["copy", "Dupliquer", function () { duplicate(selectedId); }],
      [block.hidden ? "eye" : "eyeOff", block.hidden ? "Afficher" : "Masquer (non envoyé)", function () { toggleHidden(selectedId); }],
      ["trash", "Supprimer", function () { remove(selectedId); }, false, true]].forEach(function (a) {
      var b = d.createElement("button"); b.type = "button"; b.title = a[1]; b.setAttribute("aria-label", a[1]);
      var s = d.createElement("span"); s.innerHTML = ICONS[a[0]] || ""; b.appendChild(s);
      if (a[3]) { b.disabled = true; b.style.opacity = ".35"; }
      if (a[4]) b.className = "is-danger";
      b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); if (!b.disabled) a[2](); });
      bar.appendChild(b);
    });
    d.body.appendChild(bar);
    bar.style.top = (r.top + scroll - 40 < 0 ? r.bottom + scroll + 4 : r.top + scroll - 40) + "px";
    bar.style.right = Math.max(4, d.documentElement.clientWidth - r.right + 4) + "px"; // ancrée à droite du bloc, jamais hors de l'e-mail
  }

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
  function fmtSize(n) { return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko"; }
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
  function renderMedia() {
    if (!mediaGrid) return;
    mediaGrid.textContent = "";
    mediaCache.forEach(function (m) {
      var li = el("li", { "class": "mk-media-item" });
      var pick = el("button", { type: "button", "class": "mk-media-pick-btn", "aria-label": (m.kind === "image" ? "Insérer l'image « " : "Insérer le document « ") + m.name + " »" });
      if (m.kind === "image") pick.appendChild(el("img", { src: m.url, alt: "", loading: "lazy", width: "120", height: "90" }));
      else pick.appendChild(iconSpan("fileText", "mk-media-doc"));
      pick.addEventListener("click", function () {
        var target = pickFor || (selectedId && blockById(selectedId) && blockById(selectedId).type === "image" ? selectedId : null);
        useMedia(m, { target: m.kind === "image" ? target : null });
        pickFor = null;
      });
      li.appendChild(pick);
      var meta = el("div", { "class": "mk-media-meta" });
      meta.appendChild(el("span", { "class": "mk-media-name", title: m.name }, m.name));
      meta.appendChild(el("span", { "class": "mk-media-info" }, (m.width ? m.width + " × " + m.height + " · " : "PDF · ") + fmtSize(m.size)));
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
    var count = blockErrors.length + errors.length;
    if (badge) { badge.hidden = !count; badge.textContent = String(count); badge.setAttribute("aria-label", count + " problème" + (count > 1 ? "s" : "") + " à corriger"); }
    if (!box) return;
    box.textContent = "";
    if (!count && !lintWarnings.length) { box.appendChild(el("p", { "class": "mk-check-ok" }, "Aucun problème détecté.")); return; }
    if (count) box.appendChild(el("p", { "class": "mk-check-sum" }, count + " problème" + (count > 1 ? "s" : "") + " à corriger avant l'envoi"));
    var ul = el("ul", { "class": "mk-check-list" });
    blockErrors.forEach(function (be) {
      var li = el("li", { "class": "is-error" });
      var b = el("button", { type: "button", "class": "mk-check-go" }, "Bloc " + (indexOfId(be.id) + 1) + " (" + (BLOCKS[be.type] ? BLOCKS[be.type].label : be.type) + ") : " + be.message);
      b.addEventListener("click", function () { select(be.id, { scroll: true, focus: true }); });
      li.appendChild(b); ul.appendChild(li);
    });
    lintWarnings.forEach(function (w) {
      var li = el("li", { "class": w.level === "error" ? "is-error" : "is-warning" });
      var goMessage = /^subject|^preheader|address/.test(w.code || "");
      var b = el("button", { type: "button", "class": "mk-check-go" }, (w.level === "error" ? "" : "Conseil : ") + w.message);
      b.addEventListener("click", function () { if (goMessage) { showPane("message"); var f = $(/preheader/.test(w.code) ? "t-preheader" : "t-subject"); if (f) f.focus(); } });
      li.appendChild(b); ul.appendChild(li);
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
  record(null);
  savedPos = 0;
  updateHistoryUi();
  runPreview();
})();

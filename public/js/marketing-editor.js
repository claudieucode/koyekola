/* Éditeur d'e-mails par blocs (v2) : palette à gauche, blocs au centre, aperçu à droite ; annuler / rétablir ; glisser-déposer
   depuis la palette ou entre blocs. L'état vit dans un objet JS ; le serveur valide et normalise tout (rien n'est « cru » ici).
   Aucune donnée n'est insérée comme HTML : uniquement textContent et value. */
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
  var $ = function (id) { return document.getElementById(id); };

  var TYPES = {
    heading: { label: "Titre", make: function () { return { type: "heading", text: "Votre titre", level: 2, align: "left" }; } },
    text: { label: "Texte", make: function () { return { type: "text", markdown: "Votre texte ici." }; } },
    image: { label: "Image", make: function () { return { type: "image", src: "", alt: "", decorative: false, width: 552, align: "center" }; } },
    button: { label: "Bouton", make: function () { return { type: "button", label: "Cliquez ici", url: "", align: "center" }; } },
    divider: { label: "Séparateur", make: function () { return { type: "divider" }; } },
    spacer: { label: "Espace", make: function () { return { type: "spacer", height: 24 }; } },
    columns: { label: "Deux colonnes", make: function () { return { type: "columns", left: "Colonne de gauche", right: "Colonne de droite" }; } },
    quote: { label: "Citation", make: function () { return { type: "quote", text: "Une citation inspirante.", author: "" }; } },
    list: { label: "Liste", make: function () { return { type: "list", style: "bullets", items: ["Premier élément", "Deuxième élément"] }; } },
    social: { label: "Réseaux sociaux", make: function () { return { type: "social", align: "center", links: [{ network: "facebook", url: "" }] }; } },
    video: { label: "Vidéo", make: function () { return { type: "video", url: "", thumbnail: "", title: "", width: 552, align: "center" }; } },
    course: { label: "Formation", make: function () { return { type: "course", courseId: data.courses && data.courses.length ? data.courses[0].id : undefined, cta: "Voir la formation" }; } }
  };
  var NETWORKS = [["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["tiktok", "TikTok"], ["whatsapp", "WhatsApp"], ["website", "Site web"]];
  var LIST_STYLES = [["bullets", "Puces"], ["numbers", "Numéros"], ["checks", "Coches ✓"]];
  var ALIGNS = [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]];

  var dirty = false;
  var saving = false;
  var lastFocused = null;
  var dragIndex = -1;
  var previewTimer = null;
  var previewSeq = 0;

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function genId() { return "b" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function announce(text) { var live = $("mk-live"); if (live) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 30); } }
  function status(text) { $("mk-status").textContent = text; }

  // ---------- Historique (annuler / rétablir) ----------
  // Chaque modification est un instantané de tout le modèle ; la frappe dans un même champ est regroupée (1 s).
  var history = [];
  var pos = -1;
  var savedPos = 0;
  var lastKey = null;
  var lastTime = 0;
  var MAX_HISTORY = 100;
  var undoBtn = $("mk-undo"), redoBtn = $("mk-redo");

  function snapshot() {
    return JSON.stringify({ name: state.name, kind: state.kind, category: state.category, subject: state.subject, preheader: state.preheader, theme: state.theme, footer: state.footer, blocks: state.blocks });
  }
  function updateHistoryUi() {
    if (undoBtn) undoBtn.disabled = pos <= 0;
    if (redoBtn) redoBtn.disabled = pos >= history.length - 1;
  }
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
    renderBlocks(); syncSettings(); updateHistoryUi();
    dirty = pos !== savedPos;
    status(dirty ? "Modifications non enregistrées" : "Enregistré · version " + state.version);
    schedulePreview();
    announce(message);
  }
  function undo() { if (pos > 0) restore(pos - 1, "Modification annulée."); }
  function redo() { if (pos < history.length - 1) restore(pos + 1, "Modification rétablie."); }
  if (undoBtn) undoBtn.addEventListener("click", undo);
  if (redoBtn) redoBtn.addEventListener("click", redo);
  // Raccourcis : dans un champ de saisie, Ctrl+Z reste celui du navigateur (il annule la frappe, l'historique suit)
  document.addEventListener("keydown", function (e) {
    if (readOnly || !(e.ctrlKey || e.metaKey)) return;
    var t = e.target, editing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
    if (editing) return;
    var k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
  });

  function changed() {
    dirty = true;
    status("Modifications non enregistrées");
    var a = document.activeElement;
    var typing = a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && a.type !== "checkbox"));
    record(typing && a.id ? a.id : null);
    schedulePreview();
  }

  // ---------- Contenu du modèle envoyé au serveur ----------
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
    return o;
  }
  function payload() {
    return {
      name: state.name, kind: state.kind, category: state.category || "", subject: state.subject, preheader: state.preheader, theme: state.theme,
      footer: { text: state.footer.text || "" }, blocks: state.blocks.map(cleanBlock)
    };
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
  document.addEventListener("focusin", function (e) {
    if (e.target && e.target.matches && e.target.matches("[data-var-target]")) lastFocused = e.target;
  });
  (function fillVariables() {
    var sel = $("mk-var");
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
  })();

  // ---------- Champs d'un bloc ----------
  function group(labelText, control, hint) {
    var wrap = el("div", { "class": "field-group" });
    var label = el("label", { "for": control.id }, labelText);
    wrap.appendChild(label);
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
    var label = el("label", { "class": "checkbox-row", "for": input.id });
    label.appendChild(input);
    label.appendChild(document.createTextNode(" " + labelText));
    return el("div", { "class": "field-group" }).appendChild(label).parentNode;
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
    var label = el("label", { "class": "checkbox-row", "for": toggle.id });
    label.appendChild(toggle);
    label.appendChild(document.createTextNode(" Couleur personnalisée"));
    wrap.appendChild(label);
    wrap.appendChild(color);
    return wrap;
  }

  // Éléments d'une liste : un par ligne
  function itemsField(block) {
    var area = el("textarea", { id: "f-" + block.id + "-items", rows: "5", maxlength: "5000", "data-var-target": "" });
    area.value = (block.items || []).join("\n");
    if (readOnly) area.disabled = true;
    area.addEventListener("input", function () { block.items = area.value.split("\n").map(function (l) { return l.trim(); }).filter(Boolean); changed(); });
    return group("Éléments (un par ligne, 20 au plus)", area, "Chaque ligne devient un élément de la liste. Les variables sont permises.");
  }

  // Réseaux sociaux : une ligne par lien (réseau + adresse https)
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
        var rm = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Retirer le lien " + (i + 1) }, "✕");
        rm.addEventListener("click", function () { block.links.splice(i, 1); renderBlocks(); changed(); announce("Lien retiré."); });
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
        block.links.push({ network: free[0], url: "" }); renderBlocks(); changed();
        announce("Réseau ajouté.");
      });
      wrap.appendChild(add);
    }
    return group("Liens", wrap, "Adresses en https:// uniquement. Chaque réseau une seule fois (8 au plus).");
  }

  // Formation du catalogue : l'instantané (titre, prix) est pris par le serveur à l'enregistrement
  function courseField(block) {
    var courses = data.courses || [];
    var out = [];
    if (!courses.length) out.push(el("p", { "class": "mk-note" }, "Aucune formation publiée dans le catalogue : publiez-en une pour l'insérer ici."));
    var sel = el("select", { id: "f-" + block.id + "-course" });
    sel.appendChild(el("option", { value: "" }, "Choisir une formation…"));
    courses.forEach(function (c) { sel.appendChild(el("option", { value: String(c.id) }, c.title)); });
    sel.value = block.courseId == null ? "" : String(block.courseId);
    if (readOnly) sel.disabled = true;
    sel.addEventListener("change", function () { block.courseId = sel.value === "" ? undefined : parseInt(sel.value, 10); block.snapshot = undefined; block.refresh = false; renderBlocks(); changed(); });
    out.push(group("Formation du catalogue", sel));
    if (block.snapshot) out.push(el("p", { "class": "field-hint" }, "Enregistré : « " + block.snapshot.title + " » — " + (block.snapshot.priceCents ? (block.snapshot.priceCents / 100).toFixed(2).replace(".", ",") + " €" : "gratuit") + ". Le prix et le titre sont figés dans le modèle."));
    else if (block.courseId) out.push(el("p", { "class": "field-hint" }, "Les informations de la formation seront lues dans le catalogue à l'enregistrement."));
    out.push(textField(block, "cta", "Texte du bouton", { vars: true, max: 80 }));
    if (block.snapshot) out.push(checkField(block, "refresh", "Actualiser titre, prix et image depuis le catalogue à l'enregistrement"));
    return out;
  }

  function blockFields(block) {
    var f = [];
    if (block.type === "heading") {
      f.push(textField(block, "text", "Titre", { vars: true, max: 200 }));
      f.push(selectField(block, "level", "Taille", [[1, "Grand"], [2, "Moyen"]], 2));
      f.push(selectField(block, "align", "Alignement", ALIGNS, "left"));
    } else if (block.type === "text") {
      f.push(markdownField(block, "markdown", "Texte", 7));
    } else if (block.type === "image") {
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
    } else if (block.type === "divider") {
      f.push(el("p", { "class": "field-hint" }, "Une ligne fine de séparation."));
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

  // ---------- Liste des blocs ----------
  var list = $("mk-blocks");
  var dropEnd = $("mk-drop-end");
  var selectedId = null;
  var PALETTE_TYPE = "text/mk-block";

  function label(block) { return TYPES[block.type] ? TYPES[block.type].label : block.type; }
  function indexOfId(id) { for (var i = 0; i < state.blocks.length; i++) if (state.blocks[i].id === id) return i; return -1; }
  function isPaletteDrag(e) { return !!(e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], PALETTE_TYPE) !== -1); }
  // Position d'insertion d'un nouveau bloc : juste après le bloc sélectionné, sinon à la fin
  function insertIndex() { var i = selectedId ? indexOfId(selectedId) : -1; return i === -1 ? state.blocks.length : i + 1; }
  function markSelected() {
    [].forEach.call(list.querySelectorAll(".mk-block"), function (card) {
      var on = card.getAttribute("data-id") === selectedId;
      card.classList.toggle("is-selected", on);
      if (on) card.setAttribute("aria-current", "true"); else card.removeAttribute("aria-current");
    });
  }
  function select(id) { if (selectedId === id) return; selectedId = id; markSelected(); }

  function addBlock(type, at) {
    if (!TYPES[type] || readOnly) return;
    var block = TYPES[type].make(); block.id = genId();
    var index = at == null ? insertIndex() : Math.max(0, Math.min(at, state.blocks.length));
    state.blocks.splice(index, 0, block);
    selectedId = block.id;
    renderBlocks(); changed();
    var card = list.querySelector('.mk-block[data-id="' + block.id + '"]');
    var first = card && card.querySelector("input, textarea, select");
    if (first) first.focus();
    announce("Bloc « " + label(block) + " » ajouté en position " + (index + 1) + " sur " + state.blocks.length + ".");
  }

  function move(from, to) {
    if (to < 0 || to >= state.blocks.length || from === to) return;
    var item = state.blocks.splice(from, 1)[0];
    state.blocks.splice(to, 0, item);
    renderBlocks();
    changed();
    var handle = list.querySelectorAll(".mk-handle")[to];
    if (handle) handle.focus();
    announce("Bloc déplacé en position " + (to + 1) + " sur " + state.blocks.length + ".");
  }
  function renderBlocks() {
    list.textContent = "";
    if (!state.blocks.length) list.appendChild(el("p", { "class": "field-hint" }, readOnly ? "Aucun bloc." : "Aucun bloc : cliquez sur un bloc de la palette, ou glissez-le ici."));
    state.blocks.forEach(function (block, index) {
      if (!block.id) block.id = genId();
      var card = el("div", { "class": "mk-block", role: "group", "data-id": block.id, "aria-label": "Bloc " + (index + 1) + " : " + label(block) });
      var head = el("div", { "class": "mk-block-head" });
      if (!readOnly) {
        var handle = el("button", { type: "button", "class": "mk-handle", draggable: "true", "aria-label": "Déplacer le bloc " + (index + 1) + " (glisser-déposer)", title: "Glisser pour déplacer" }, "⠿");
        handle.addEventListener("dragstart", function (e) { dragIndex = index; card.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(index)); showDropEnd(true); });
        handle.addEventListener("dragend", function () { dragIndex = -1; card.classList.remove("is-dragging"); showDropEnd(false); [].forEach.call(list.querySelectorAll(".is-over"), function (n) { n.classList.remove("is-over"); }); });
        head.appendChild(handle);
      }
      head.appendChild(el("span", { "class": "mk-block-title" }, (index + 1) + ". " + label(block)));
      if (!readOnly) {
        var up = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Monter le bloc " + (index + 1) }, "↑");
        up.disabled = index === 0;
        up.addEventListener("click", function () { move(index, index - 1); });
        var down = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Descendre le bloc " + (index + 1) }, "↓");
        down.disabled = index === state.blocks.length - 1;
        down.addEventListener("click", function () { move(index, index + 1); });
        var dup = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Dupliquer le bloc " + (index + 1), title: "Dupliquer" }, "⧉");
        dup.addEventListener("click", function () {
          var copy = JSON.parse(JSON.stringify(block)); copy.id = genId();
          state.blocks.splice(index + 1, 0, copy); selectedId = copy.id; renderBlocks(); changed(); announce("Bloc dupliqué.");
        });
        var del = el("button", { type: "button", "class": "mk-icon-btn", "aria-label": "Supprimer le bloc " + (index + 1), title: "Supprimer" }, "✕");
        del.addEventListener("click", function () { state.blocks.splice(index, 1); if (selectedId === block.id) selectedId = null; renderBlocks(); changed(); announce("Bloc supprimé. Annuler pour le rétablir."); });
        [up, down, dup, del].forEach(function (b) { head.appendChild(b); });
      }
      card.appendChild(head);
      var body = el("div", { "class": "mk-block-body" });
      blockFields(block).forEach(function (n) { body.appendChild(n); });
      card.appendChild(body);

      card.addEventListener("focusin", function () { select(block.id); });
      card.addEventListener("click", function () { select(block.id); });
      card.addEventListener("dragover", function (e) { if (dragIndex < 0 && !isPaletteDrag(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = isPaletteDrag(e) ? "copy" : "move"; card.classList.add("is-over"); });
      card.addEventListener("dragleave", function () { card.classList.remove("is-over"); });
      card.addEventListener("drop", function (e) {
        card.classList.remove("is-over");
        if (isPaletteDrag(e)) { e.preventDefault(); var type = e.dataTransfer.getData(PALETTE_TYPE); showDropEnd(false); addBlock(type, index); return; }
        if (dragIndex < 0) return;
        e.preventDefault(); var from = dragIndex; dragIndex = -1; move(from, index);
      });
      list.appendChild(card);
    });
    markSelected();
  }

  // Zone de dépôt « à la fin » (visible seulement pendant un glisser-déposer)
  function showDropEnd(on) { if (dropEnd) dropEnd.hidden = !on; }
  if (dropEnd && !readOnly) {
    dropEnd.addEventListener("dragover", function (e) { if (dragIndex < 0 && !isPaletteDrag(e)) return; e.preventDefault(); dropEnd.classList.add("is-over"); });
    dropEnd.addEventListener("dragleave", function () { dropEnd.classList.remove("is-over"); });
    dropEnd.addEventListener("drop", function (e) {
      dropEnd.classList.remove("is-over"); showDropEnd(false);
      if (isPaletteDrag(e)) { e.preventDefault(); addBlock(e.dataTransfer.getData(PALETTE_TYPE), state.blocks.length); return; }
      if (dragIndex < 0) return;
      e.preventDefault(); var from = dragIndex; dragIndex = -1; move(from, state.blocks.length - 1);
    });
  }

  // ---------- Palette (colonne de gauche) ----------
  if (!readOnly) {
    [].forEach.call(document.querySelectorAll("[data-add]"), function (btn) {
      var type = btn.getAttribute("data-add");
      btn.addEventListener("click", function () { addBlock(type); });
      btn.addEventListener("dragstart", function (e) { e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData(PALETTE_TYPE, type); e.dataTransfer.setData("text/plain", type); showDropEnd(true); });
      btn.addEventListener("dragend", function () { showDropEnd(false); });
    });
  }

  // ---------- Réglages généraux ----------
  var bindings = [];
  function bind(id, get, set) {
    var input = $(id);
    if (!input) return;
    input.value = get();
    if (readOnly) input.disabled = true;
    input.addEventListener("input", function () { set(input.value); changed(); });
    input.addEventListener("change", function () { set(input.value); changed(); });
    bindings.push(function () { input.value = get(); });
  }
  function syncSettings() { bindings.forEach(function (fn) { fn(); }); }
  bind("t-name", function () { return state.name || ""; }, function (v) { state.name = v; });
  bind("t-kind", function () { return state.kind || "marketing"; }, function (v) { state.kind = v; });
  bind("t-category", function () { return state.category || ""; }, function (v) { state.category = v; });
  bind("t-subject", function () { return state.subject || ""; }, function (v) { state.subject = v; });
  bind("t-preheader", function () { return state.preheader || ""; }, function (v) { state.preheader = v; });
  bind("t-footer", function () { return state.footer.text || ""; }, function (v) { state.footer.text = v; });
  var THEME_DEFAULTS = { background: "#f3f8fc", contentBackground: "#ffffff", textColor: "#10222f", accent: "#0277b6", fontFamily: "system" };
  [["t-bg", "background"], ["t-cbg", "contentBackground"], ["t-text", "textColor"], ["t-accent", "accent"], ["t-font", "fontFamily"]].forEach(function (pair) {
    bind(pair[0], function () { return state.theme[pair[1]] || THEME_DEFAULTS[pair[1]]; }, function (v) { state.theme[pair[1]] = v; });
  });

  // ---------- Aperçu ----------
  var frame = $("mk-frame");
  var contactSel = $("mk-contact");
  (data.contacts || []).forEach(function (c) { contactSel.appendChild(el("option", { value: String(c.id) }, c.email)); });
  contactSel.addEventListener("change", runPreview);
  [].forEach.call(document.querySelectorAll("[data-size]"), function (btn) {
    btn.addEventListener("click", function () {
      frame.style.width = btn.getAttribute("data-size") + "px";
      [].forEach.call(document.querySelectorAll("[data-size]"), function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
    });
  });

  function showWarnings(warnings, errorMessage) {
    var box = $("mk-warnings");
    box.textContent = "";
    if (errorMessage) { box.appendChild(el("div", { "class": "mk-warn is-error", role: "alert" }, errorMessage)); return; }
    if (!warnings.length) { box.appendChild(el("div", { "class": "field-hint" }, "Aucune alerte de qualité.")); return; }
    warnings.forEach(function (w) { box.appendChild(el("div", { "class": "mk-warn" + (w.level === "error" ? " is-error" : "") }, (w.level === "error" ? "Erreur : " : "Conseil : ") + w.message)); });
  }
  function schedulePreview() { clearTimeout(previewTimer); previewTimer = setTimeout(runPreview, 500); }
  function runPreview() {
    var seq = ++previewSeq;
    var body = { template: payload() };
    if (contactSel.value) body.contactId = parseInt(contactSel.value, 10);
    fetch("/marketing/modeles/apercu", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
      .then(function (r) {
        if (seq !== previewSeq) return; // réponse périmée
        if (r.ok) { frame.srcdoc = r.j.html; $("mk-subject").textContent = r.j.subject; $("mk-text").textContent = r.j.text; showWarnings(r.j.warnings, null); }
        else showWarnings([], r.j.error || "Aperçu impossible.");
      })
      .catch(function () { if (seq === previewSeq) showWarnings([], "Aperçu impossible pour le moment."); });
  }

  // ---------- Enregistrement ----------
  function showError(message) { var box = $("mk-editor-error"); box.textContent = message || ""; box.hidden = !message; }
  function save() {
    if (readOnly || saving) return;
    saving = true; showError(""); status("Enregistrement…");
    fetch("/marketing/modeles/" + state.id, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ template: payload(), version: state.version }) })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, status: res.status, j: j }; }); })
      .then(function (r) {
        if (r.ok) {
          state.version = r.j.version; dirty = false; savedPos = pos; status("Enregistré · version " + state.version); showWarnings(r.j.warnings, null);
          // Les instantanés de formations pris par le serveur sont conservés tels quels (le prix ne change pas tout seul)
          var snaps = r.j.courseSnapshots || {};
          state.blocks.forEach(function (b) { if (b.type === "course") { b.refresh = false; if (snaps[b.id]) b.snapshot = snaps[b.id]; } });
          renderBlocks();
        }
        else { status("Non enregistré"); showError(r.j.error || "Enregistrement impossible."); }
      })
      .catch(function () { status("Non enregistré"); showError("Enregistrement impossible pour le moment : vérifiez votre connexion."); })
      .then(function () { saving = false; });
  }
  var saveBtn = $("mk-save");
  if (saveBtn) saveBtn.addEventListener("click", save);
  document.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } });
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = ""; } });

  renderBlocks();
  record(null);
  savedPos = 0;
  updateHistoryUi();
  runPreview();
})();

// KOLAKISA CMS → Médias : interaction de la page (le serveur rend la liste ; ici : envoi, sélection, détails, corbeille).
// Toute écriture passe par l'API de la médiathèque (KWMedia) : rien n'est affiché comme enregistré sans réponse réussie.
(function () {
  var K = window.KWMedia;
  var cfg = {};
  try { cfg = JSON.parse(document.getElementById("ml-config").textContent); } catch (e) { return; }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v; else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var toast = K.toast;
  var confirmDialog = function (opts, yes) { if (window.mkConfirm) window.mkConfirm(opts, yes); else if (window.confirm(opts.text)) yes(); };

  // ---------------------------------------------------------------- Envoi
  var drop = $("[data-ml-drop]");
  // Un fichier envoyé apparaît tout de suite dans la liste s'il correspond au filtre en cours
  function added(m) {
    ["all", m.type === "pdf" || m.type === "document" ? "documents" : m.type].forEach(function (k) { var c = $('[data-ml-count="' + k + '"]'); if (c) c.textContent = String(Number(c.textContent) + 1); });
    var matches = !cfg.trashed && !cfg.hasFilter && (!cfg.type || cfg.type === m.type || (cfg.type === "documents" && (m.type === "pdf" || m.type === "document")));
    if (!matches) { toast("« " + m.name + " » est enregistré (il n'apparaît pas avec les filtres actuels).", "ok"); return; }
    var label = K.TYPE_LABELS[m.type] || "Fichier";
    var mini = m.type === "image" ? h("img", { src: m.path, alt: "", loading: "lazy", width: "36", height: "36" }) : h("span", { class: "mk-ml-badge", text: K.badge(m) });
    var check = cfg.canWrite ? h("input", { type: "checkbox", "data-ml-check": "", value: m.id, "aria-label": "Sélectionner « " + m.name + " »" }) : null;
    var table = $("[data-ml-list] tbody");
    if (table) {
      var tr = h("tr", { "data-ml-item": "", "data-id": m.id, class: "is-new" }, [
        cfg.canWrite ? h("td", { class: "mk-cms-check-col", "data-label": "Sélection" }, check) : null,
        h("th", { scope: "row", "data-label": "Fichier" }, h("button", { type: "button", class: "mk-ml-link", "data-ml-open": "" }, [h("span", { class: "mk-ml-mini" }, mini), h("span", { "data-ml-name": "", text: m.name })])),
        h("td", { "data-label": "Type", text: label }), h("td", { class: "mk-num", "data-label": "Taille", text: K.fmtSize(m.size) }), h("td", { "data-label": "Dimensions", text: m.width ? m.width + " × " + m.height + " px" : "—" }),
        h("td", { "data-label": "Ajouté le", text: K.fmtDate(m.createdAt) }), h("td", { "data-label": "Auteur", text: "Vous" }),
        h("td", { class: "mk-row-actions mk-cms-actions-col" }, h("button", { type: "button", class: "btn btn-ghost btn-sm", "data-ml-open": "", text: "Détails" })),
      ]);
      table.prepend(tr);
    } else {
      var grid = $("[data-ml-grid]");
      if (!grid) {
        // Bibliothèque vide : l'état vide cède la place à la grille, sans recharger la page (les autres envois continuent)
        var empty = $(".mk-empty"); if (empty) empty.remove();
        grid = h("ul", { class: "mk-ml-grid", "data-ml-grid": "", role: "list" }); $(".mk-ml-main").prepend(grid);
      }
      var thumb = h("button", { type: "button", class: "mk-ml-thumb", "data-ml-open": "", "aria-label": "Détails de « " + m.name + " »" }, m.type === "image" ? h("img", { src: m.path, alt: "", loading: "lazy" }) : h("span", { class: "mk-ml-badge", text: K.badge(m) }));
      grid.prepend(h("li", { class: "mk-ml-item is-new", "data-ml-item": "", "data-id": m.id }, [check ? (check.className = "mk-ml-check", check) : null, thumb, h("span", { class: "mk-ml-name", "data-ml-name": "", text: m.name }), h("span", { class: "mk-sub", text: label + " · " + K.fmtSize(m.size) })]));
    }
    toast("« " + m.name + " » ajouté à la médiathèque.", "ok");
  }
  // L'envoi lui-même (zone de dépôt, file, progression, états) est celui de public/js/media-upload.js, commun à la page « Ajouter un fichier média » :
  // chaque fichier ENREGISTRÉ par le serveur est annoncé ici et apparaît tout de suite dans la liste (sans doublon).
  window.addEventListener("kw-media-saved", function (e) { if (e.detail && !$('[data-ml-item][data-id="' + e.detail.id + '"]')) added(e.detail); });

  // « Ajouter un fichier média » : ouvre / referme la zone d'envoi (comme WordPress) ; le choix des fichiers se fait dans la zone
  var browseBtn = $("[data-ml-browse]"), zone = document.getElementById("ml-upload");
  if (browseBtn && zone) browseBtn.addEventListener("click", function () {
    var open = zone.hidden; zone.hidden = !open; browseBtn.setAttribute("aria-expanded", String(open));
    if (open && drop) drop.focus();
  });

  // Filtres : un changement de type, de date ou de tri s'applique tout de suite (le bouton « Filtrer » reste pour le clavier et sans JavaScript)
  $$("[data-ml-autosubmit]").forEach(function (sel) { sel.addEventListener("change", function () { var f = sel.form; if (f) { if (f.requestSubmit) f.requestSubmit(); else f.submit(); } }); });

  // « Sélection groupée » : les cases et les actions n'apparaissent que lorsque le mode est activé ; ouvrir un fichier et le sélectionner sont deux gestes distincts
  var main = $("[data-ml-main]"), selToggle = $("[data-ml-select-toggle]");
  function selecting() { return Boolean(main && main.classList.contains("is-selecting")); }
  if (selToggle && main) selToggle.addEventListener("click", function () {
    var on = !selecting();
    main.classList.toggle("is-selecting", on); selToggle.setAttribute("aria-pressed", String(on)); selToggle.textContent = on ? "Annuler la sélection" : "Sélection groupée";
    var b = $("[data-ml-bulk]"); if (b) b.hidden = !on;
    if (on) closePanelQuiet(); else { checks().forEach(function (c) { c.checked = false; }); refreshBulk(); }
  });

  // ---------------------------------------------------------------- Sélection et actions groupées
  var bulk = $("[data-ml-bulk]");
  function checks() { return $$("[data-ml-check]"); }
  function selected() { return checks().filter(function (c) { return c.checked; }).map(function (c) { return Number(c.value); }); }
  function refreshBulk() {
    if (!bulk) return;
    var n = selected().length, all = checks();
    var action = $("[data-ml-bulk-action]"), apply = $("[data-ml-bulk-apply]"), all_ = $("[data-ml-all]");
    action.disabled = n === 0; apply.disabled = n === 0 || !action.value;
    $("[data-ml-bulk-count]").textContent = n ? n + " fichier" + (n > 1 ? "s" : "") + " sélectionné" + (n > 1 ? "s" : "") : "";
    all_.checked = n > 0 && n === all.length; all_.indeterminate = n > 0 && n < all.length;
    $$("[data-ml-item]").forEach(function (it) { var c = $("[data-ml-check]", it); it.classList.toggle("is-selected", Boolean(c && c.checked)); });
  }
  if (bulk) {
    document.addEventListener("change", function (e) { if (e.target.matches("[data-ml-check], [data-ml-bulk-action]")) refreshBulk(); });
    $("[data-ml-all]").addEventListener("change", function () { var on = this.checked; checks().forEach(function (c) { c.checked = on; }); refreshBulk(); });
    $("[data-ml-bulk-apply]").addEventListener("click", function () {
      var action = $("[data-ml-bulk-action]").value, ids = selected();
      if (!action || !ids.length) return;
      var run = function () {
        K.bulk(action, ids).then(function (r) {
          var msg = r.done.length + " fichier" + (r.done.length > 1 ? "s" : "") + " traité" + (r.done.length > 1 ? "s" : "") + ".";
          if (r.failed.length) msg += " " + r.failed.length + " refusé" + (r.failed.length > 1 ? "s" : "") + " : " + r.failed.map(function (f) { return "« " + f.name + " » : " + f.message; }).join(" · ");
          try { sessionStorage.setItem("mlFlash", JSON.stringify({ text: msg, type: r.failed.length ? "error" : "ok" })); } catch (e) { /* sans stockage : pas de message après rechargement */ }
          location.reload();
        }, function (err) { toast(err.message, "error"); });
      };
      if (action === "corbeille" || action === "supprimer") confirmDialog({ title: action === "supprimer" ? "Supprimer définitivement ?" : "Mettre à la corbeille ?", text: action === "supprimer" ? ids.length + " fichier(s) seront effacés pour de bon. Un fichier utilisé par une page, un e-mail ou un site sera refusé." : ids.length + " fichier(s) iront à la corbeille. Ils resteront affichés là où ils sont utilisés ; vous pourrez les restaurer.", ok: action === "supprimer" ? "Supprimer" : "Mettre à la corbeille" }, run);
      else run();
    });
    refreshBulk();
  }
  try { var flash = sessionStorage.getItem("mlFlash"); if (flash) { sessionStorage.removeItem("mlFlash"); var f = JSON.parse(flash); toast(f.text, f.type); } } catch (e) { /* ignoré */ }

  // ---------------------------------------------------------------- Panneau de détails
  var panel = $("[data-ml-panel]");
  var current = null, lastTrigger = null;
  function closePanelQuiet() { panel.hidden = true; panel.textContent = ""; current = null; $$("[data-ml-item].is-open").forEach(function (i) { i.classList.remove("is-open"); }); }
  function closePanel() { panel.hidden = true; panel.textContent = ""; current = null; $$("[data-ml-item].is-open").forEach(function (i) { i.classList.remove("is-open"); }); if (lastTrigger) lastTrigger.focus(); }
  document.addEventListener("click", function (e) {
    var open = e.target.closest("[data-ml-open]");
    if (!open) return;
    var item = open.closest("[data-ml-item]");
    if (!item) return;
    if (selecting()) { var c = $("[data-ml-check]", item); if (c) { c.checked = !c.checked; refreshBulk(); } return; } // mode sélection : un clic coche, il n'ouvre pas les détails
    lastTrigger = open;
    openDetail(Number(item.getAttribute("data-id")), item);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden && !document.querySelector("dialog[open]")) closePanel(); });

  function openDetail(id, item) {
    panel.hidden = false; panel.textContent = "Chargement…"; panel.focus();
    $$("[data-ml-item].is-open").forEach(function (i) { i.classList.remove("is-open"); }); if (item) item.classList.add("is-open");
    K.detail(id).then(function (d) { current = { media: d.media, usage: d.usage, item: item }; render(); }, function (err) { panel.textContent = ""; panel.appendChild(h("p", { class: "mk-ml-error", role: "alert", text: err.message })); panel.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Fermer", onclick: closePanel })); });
  }
  function preview(m) {
    if (m.type === "image") return h("img", { class: "mk-ml-prev", src: m.path, alt: m.alt || "" });
    if (m.type === "video") return h("video", { class: "mk-ml-prev", src: m.path, controls: "", preload: "metadata" });
    if (m.type === "audio") return h("audio", { class: "mk-ml-prev-audio", src: m.path, controls: "", preload: "metadata" });
    // PDF : cadre de la même origine (la politique de sécurité du site interdit les balises « object »)
    if (m.type === "pdf") return h("div", {}, [h("iframe", { class: "mk-ml-prev-pdf", src: m.path, title: "Aperçu du PDF " + m.name, loading: "lazy" }), h("a", { class: "field-hint", href: m.path, target: "_blank", rel: "noopener", text: "Ouvrir le PDF dans un onglet" })]);
    return h("div", { class: "mk-ml-prev-file" }, [h("span", { class: "mk-ml-badge", text: K.badge(m) }), h("span", { class: "mk-sub", text: "Pas d'aperçu pour ce format : téléchargez le fichier pour l'ouvrir." })]);
  }
  function field(label, id, value, opts) {
    opts = opts || {};
    var control = opts.multiline ? h("textarea", { id: id, rows: "3", maxlength: opts.max, disabled: opts.disabled }) : h("input", { id: id, type: "text", maxlength: opts.max, disabled: opts.disabled });
    control.value = value || "";
    return h("div", { class: "field-group" }, [h("label", { for: id, text: label }), control, opts.hint ? h("p", { class: "field-hint", text: opts.hint }) : null]);
  }
  function render() {
    var m = current.media, usage = current.usage, trashed = Boolean(m.deletedAt);
    var locked = !cfg.canWrite || trashed;
    panel.textContent = "";
    var head = h("div", { class: "mk-ml-panel-head" }, [h("h2", { text: m.name }), h("button", { type: "button", class: "btn btn-ghost btn-sm", "aria-label": "Fermer le panneau", text: "Fermer", onclick: closePanel })]);
    // Précédent / suivant : dans l'ordre de la liste affichée (mêmes filtres, même site) ; les fichiers d'une autre page de résultats ne sont pas atteints d'ici
    var order = $$("[data-ml-item]"), at = current.item ? order.indexOf(current.item) : -1;
    var go = function (step) { var next = order[at + step]; if (next) { lastTrigger = $("[data-ml-open]", next); openDetail(Number(next.getAttribute("data-id")), next); } };
    var pager = at < 0 || order.length < 2 ? null : h("div", { class: "mk-ml-panel-nav", role: "group", "aria-label": "Naviguer entre les fichiers" }, [
      h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "← Précédent", disabled: at === 0 ? "" : null, onclick: function () { go(-1); } }),
      h("span", { class: "mk-sub", text: (at + 1) + " / " + order.length }),
      h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Suivant →", disabled: at === order.length - 1 ? "" : null, onclick: function () { go(1); } })]);
    var status = h("p", { class: "field-hint", role: "status", "aria-live": "polite" });
    var urlInput = h("input", { id: "ml-f-url", type: "text", readonly: "", value: K.absolute(m.path), "aria-label": "Adresse du fichier", onfocus: function () { this.select(); } });
    var copyBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Copier l'URL", onclick: function () {
      K.copy(K.absolute(m.path)).then(function () { copyBtn.textContent = "Copié !"; toast("Adresse copiée.", "ok"); setTimeout(function () { copyBtn.textContent = "Copier l'URL"; }, 1600); }, function () { urlInput.select(); toast("Copie automatique impossible : l'adresse est sélectionnée, faites Ctrl+C.", "error"); });
    } });
    var info = h("dl", { class: "mk-cms-dl" }, [
      h("dt", { text: "Type" }), h("dd", { text: (K.TYPE_LABELS[m.type] || "Fichier") + " · " + (m.mime || "") }),
      h("dt", { text: "Taille" }), h("dd", { text: K.fmtSize(m.size) }),
      m.width ? h("dt", { text: "Dimensions" }) : null, m.width ? h("dd", { text: m.width + " × " + m.height + " px" }) : null,
      h("dt", { text: "Ajouté le" }), h("dd", { text: K.fmtDate(m.createdAt) }),
      h("dt", { text: "Par" }), h("dd", { text: m.author || "—" }),
      trashed ? h("dt", { text: "Corbeille" }) : null, trashed ? h("dd", { text: "depuis le " + K.fmtDate(m.deletedAt) }) : null,
    ]);
    var fName = field("Nom du fichier", "ml-f-name", m.name, { max: 120, disabled: locked });
    var fTitle = field("Titre", "ml-f-title", m.title, { max: 150, disabled: locked });
    var fAlt = m.type === "image" ? field("Texte alternatif (accessibilité)", "ml-f-alt", m.alt, { max: 200, disabled: locked, hint: "Décrit l'image pour les personnes qui ne la voient pas et pour les moteurs de recherche." }) : null;
    var fCap = field("Légende", "ml-f-cap", m.caption, { max: 300, disabled: locked });
    var fDesc = field("Description", "ml-f-desc", m.description, { max: 1000, multiline: true, disabled: locked });
    var save = locked ? null : h("button", { type: "button", class: "btn btn-primary btn-sm", text: "Enregistrer", onclick: function () {
      save.disabled = true; status.textContent = "Enregistrement…";
      var val = function (f) { return f ? $("input,textarea", f).value : undefined; };
      K.update(m.id, { name: val(fName), title: val(fTitle), alt: val(fAlt), caption: val(fCap), description: val(fDesc) }).then(function (saved) {
        saved.author = m.author; current.media = saved; status.textContent = "Enregistré."; toast("Informations enregistrées.", "ok");
        $$("[data-ml-name]", current.item).forEach(function (n) { n.textContent = saved.name; });
        save.disabled = false;
      }, function (err) { status.textContent = err.message; status.className = "mk-ml-error"; save.disabled = false; });
    } });
    var usageBox = h("div", { class: "mk-ml-usage" }, [h("h3", { text: "Utilisation" }), usage.length
      ? h("ul", {}, usage.map(function (u) { return h("li", {}, u.href ? h("a", { href: u.href, text: u.kind + " « " + u.name + " »" }) : document.createTextNode(u.kind + " « " + u.name + " »")); }))
      : h("p", { class: "field-hint", text: "Ce fichier n'est utilisé par aucune page, aucun e-mail ni aucun site." })]);
    var actions = h("div", { class: "mk-ml-panel-actions" }, [copyBtn, h("a", { class: "btn btn-outline btn-sm", href: m.path, target: "_blank", rel: "noopener", text: m.type === "document" ? "Télécharger" : "Ouvrir" })]);
    if (cfg.canWrite && !trashed) actions.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Mettre à la corbeille", onclick: function () {
      var run = function () { K.trash(m.id).then(function () { toast("« " + m.name + " » est à la corbeille.", "ok"); removeFromView(m.id); }, function (err) { status.textContent = err.message; status.className = "mk-ml-error"; }); };
      if (usage.length) confirmDialog({ title: "Fichier utilisé", text: "« " + m.name + " » est utilisé par " + usage.length + " élément" + (usage.length > 1 ? "s" : "") + " (" + usage.slice(0, 3).map(function (u) { return u.kind + " « " + u.name + " »"; }).join(", ") + "). Il restera affiché tant que vous ne le retirez pas de ces contenus ; vous pourrez le restaurer.", ok: "Mettre à la corbeille" }, run); else run();
    } }));
    if (cfg.canWrite && trashed) actions.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Restaurer", onclick: function () { K.restore(m.id).then(function () { toast("« " + m.name + " » est restauré.", "ok"); removeFromView(m.id); }, function (err) { status.textContent = err.message; status.className = "mk-ml-error"; }); } }));
    if (cfg.canDelete && trashed) actions.appendChild(h("button", { type: "button", class: "btn btn-danger btn-sm", text: "Supprimer définitivement", onclick: function () {
      confirmDialog({ title: "Supprimer définitivement ?", text: usage.length ? "« " + m.name + " » est utilisé par " + usage.length + " élément" + (usage.length > 1 ? "s" : "") + " : la suppression sera refusée tant que vous ne l'aurez pas retiré de ces contenus." : "« " + m.name + " » sera effacé pour de bon. Cette action est irréversible.", ok: "Supprimer" }, function () {
        K.purge(m.id).then(function () { toast("« " + m.name + " » est supprimé.", "ok"); removeFromView(m.id); }, function (err) { status.textContent = err.message; status.className = "mk-ml-error"; toast(err.message, "error"); });
      });
    } }));
    [head, pager, preview(m), info, h("div", { class: "field-group" }, [h("label", { for: "ml-f-url", text: "Adresse (URL)" }), urlInput]), actions, fName, fTitle, fAlt, fCap, fDesc, save, status, usageBox].forEach(function (n) { if (n) panel.appendChild(n); });
  }
  // Le fichier a quitté cette vue (corbeille, restauration, suppression) : on le retire de la liste et du panneau
  function removeFromView(id) {
    var it = $('[data-ml-item][data-id="' + id + '"]'); if (it) it.remove();
    closePanel(); refreshBulk();
    var left = $$("[data-ml-item]").length; if (!left) location.reload();
  }
})();

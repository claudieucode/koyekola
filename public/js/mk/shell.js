/* Coque de l'espace marketing : menu latéral (repli mémorisé, tiroir mobile), menus déroulants, confirmations,
   fenêtres modales, zone de dépôt de fichier, messages temporaires, onglets, sélection de lignes. JavaScript
   natif ; aucune donnée n'est insérée comme HTML. */
(function () {
  "use strict";
  var root = document.documentElement;
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var DESKTOP = window.matchMedia("(min-width: 961px)");
  function store(key, value) { try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); } catch (e) { return null; } return null; }
  function focusable(container) { return $$("a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])", container).filter(function (n) { return n.offsetParent !== null; }); }

  // ---------- Menu latéral ----------
  var sidebar = document.getElementById("mk-sidebar");
  var overlay = document.querySelector(".mk-overlay");
  var collapseBtns = $$("[data-mk-sidebar-collapse]"); // en-tête du menu et, dans le CMS, commande « Replier le menu » en bas du panneau
  var toggleBtn = document.querySelector("[data-mk-sidebar-toggle]");

  function setCollapsed(collapsed, remember) {
    if (collapsed) root.setAttribute("data-sidebar", "collapsed"); else root.removeAttribute("data-sidebar");
    if (remember) store("mkSidebar", collapsed ? "collapsed" : "open"); // seul un choix de l'utilisateur est mémorisé
    collapseBtns.forEach(function (btn) {
      btn.setAttribute("aria-pressed", collapsed ? "true" : "false");
      var label = collapsed ? "Déployer le menu" : "Réduire le menu";
      btn.setAttribute("aria-label", label); btn.setAttribute("title", label);
    });
  }
  if (collapseBtns.length) {
    setCollapsed(root.getAttribute("data-sidebar") === "collapsed");
    collapseBtns.forEach(function (btn) { btn.addEventListener("click", function () { setCollapsed(root.getAttribute("data-sidebar") !== "collapsed", true); }); });
  }

  function openDrawer() {
    if (!sidebar) return;
    sidebar.classList.add("is-open");
    if (overlay) overlay.hidden = false;
    if (toggleBtn) toggleBtn.setAttribute("aria-expanded", "true");
    var first = focusable(sidebar)[0]; if (first) first.focus();
  }
  function closeDrawer(returnFocus) {
    if (!sidebar || !sidebar.classList.contains("is-open")) return;
    sidebar.classList.remove("is-open");
    if (overlay) overlay.hidden = true;
    if (toggleBtn) { toggleBtn.setAttribute("aria-expanded", "false"); if (returnFocus) toggleBtn.focus(); }
  }
  if (toggleBtn) toggleBtn.addEventListener("click", function () { if (sidebar.classList.contains("is-open")) closeDrawer(true); else openDrawer(); });
  $$("[data-mk-sidebar-close]").forEach(function (b) { b.addEventListener("click", function () { closeDrawer(true); }); });
  DESKTOP.addEventListener("change", function (e) { if (e.matches) closeDrawer(false); });
  if (sidebar) {
    // dans le tiroir, le focus reste à l'intérieur (Tab boucle)
    sidebar.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !sidebar.classList.contains("is-open")) return;
      var items = focusable(sidebar); if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // sections dépliables (ouvertes seules dans le menu réduit : un clic redéploie le menu)
    // « Site Web » : le chevron (bouton distinct du lien) ouvre ou ferme l'accordéon sans navigation
    $$(".mk-nav-caret-btn", sidebar).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var group = btn.closest(".mk-nav-group");
        if (DESKTOP.matches && root.getAttribute("data-sidebar") === "collapsed") { setCollapsed(false, true); group.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); return; }
        var open = !group.classList.contains("is-open");
        group.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
    $$(".mk-nav-head", sidebar).forEach(function (head) {
      head.addEventListener("click", function () {
        var group = head.closest(".mk-nav-group");
        if (DESKTOP.matches && root.getAttribute("data-sidebar") === "collapsed") { setCollapsed(false, true); group.classList.add("is-open"); head.setAttribute("aria-expanded", "true"); return; }
        var open = !group.classList.contains("is-open");
        group.classList.toggle("is-open", open);
        head.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  // ---------- Menus déroulants ----------
  var dropdowns = $$("[data-mk-dropdown]");
  function closeDropdown(d, returnFocus) {
    var btn = d.querySelector("[aria-haspopup]"), menu = d.querySelector("[role=menu]");
    if (!menu || menu.hidden) return;
    if (window.kbFloat) window.kbFloat.close(menu);
    menu.hidden = true; btn.setAttribute("aria-expanded", "false");
    if (returnFocus) btn.focus();
  }
  dropdowns.forEach(function (d) {
    var btn = d.querySelector("[aria-haspopup]"), menu = d.querySelector("[role=menu]");
    if (!btn || !menu) return;
    function items() { return $$("[role=menuitem], [role=menuitemradio]", menu); }
    btn.addEventListener("click", function () {
      var open = menu.hidden;
      dropdowns.forEach(function (o) { if (o !== d) closeDropdown(o, false); });
      if (!open) { closeDropdown(d, false); return; }
      menu.hidden = false; btn.setAttribute("aria-expanded", "true");
      // Calque flottant : la ligne, la carte ou le tableau ne changent jamais de taille
      if (window.kbFloat) window.kbFloat.open(btn, menu, { onClose: function () { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); } });
      var first = items()[0]; if (first) first.focus();
    });
    d.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeDropdown(d, true); return; }
      if (menu.hidden || (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End")) return;
      e.preventDefault();
      var list = items(), i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown") i = (i + 1) % list.length;
      else if (e.key === "ArrowUp") i = (i - 1 + list.length) % list.length;
      else if (e.key === "Home") i = 0; else i = list.length - 1;
      list[i].focus();
    });
    d.addEventListener("focusout", function (e) { if (!e.relatedTarget || !d.contains(e.relatedTarget)) closeDropdown(d, false); });
  });
  document.addEventListener("click", function (e) { dropdowns.forEach(function (d) { if (!d.contains(e.target)) closeDropdown(d, false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(true); });

  // ---------- Messages temporaires ----------
  var toasts = document.getElementById("mk-toasts");
  function toast(text, type) {
    if (!toasts) return;
    var t = document.createElement("div");
    t.setAttribute("class", "mk-toast" + (type === "ok" ? " mk-toast-ok" : type === "error" ? " mk-toast-error" : ""));
    var span = document.createElement("span"); span.textContent = text;
    var close = document.createElement("button"); close.type = "button"; close.setAttribute("aria-label", "Fermer le message"); close.textContent = "×";
    close.addEventListener("click", function () { t.remove(); });
    t.appendChild(span); t.appendChild(close); toasts.appendChild(t);
    if (type !== "error") setTimeout(function () { t.remove(); }, 6000);
  }
  window.mkToast = toast;
  $$("[data-mk-toast]").forEach(function (b) { b.addEventListener("click", function () { toast(b.getAttribute("data-mk-toast"), b.getAttribute("data-mk-toast-type") || "info"); }); });

  // ---------- Fenêtres : en-tête commun (titre, description, fermer) — même structure que les fenêtres des pages ----------
  // Utilisé par les fenêtres construites en JavaScript (confirmation ici, éditeur de scénarios via window.mkDialogHead).
  var CLOSE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  function dialogHead(o) {
    var head = document.createElement("header"); head.setAttribute("class", "mk-dialog-head");
    var titles = document.createElement("div"); titles.setAttribute("class", "mk-dialog-titles");
    var h = document.createElement("h2"); h.id = o.titleId; h.textContent = o.title; titles.appendChild(h);
    if (o.desc) { var p = document.createElement("p"); p.setAttribute("class", "mk-dialog-desc"); if (o.descId) p.id = o.descId; p.textContent = o.desc; titles.appendChild(p); }
    var close = document.createElement("button"); close.type = "button"; close.setAttribute("class", "mk-dialog-close"); close.setAttribute("aria-label", o.closeLabel || "Fermer");
    close.innerHTML = CLOSE_SVG; // icône fixe (aucune donnée saisie)
    head.appendChild(titles); head.appendChild(close);
    return { el: head, close: close };
  }
  window.mkDialogHead = dialogHead;
  // À l'ouverture : focus sur le premier champ du contenu (sinon le navigateur le donne au bouton « Fermer » ou à la fenêtre)
  function focusFirst(dlg) {
    var field = dlg.querySelector(".mk-dialog-body :is(input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled]))");
    var target = field || dlg.querySelector(".mk-dialog-actions .btn:not([disabled])");
    if (target) target.focus();
  }
  window.mkDialogFocusFirst = focusFirst;

  // ---------- Confirmation avant une action grave ----------
  // <button data-mk-confirm="Texte" data-mk-confirm-title="Titre" data-mk-confirm-ok="Supprimer"> dans un <form>
  function confirmDialog(opts, onYes, onNo) {
    onNo = onNo || function () {};
    if (typeof HTMLDialogElement !== "function") { if (window.confirm(opts.text)) onYes(); else onNo(); return; }
    var dlg = document.createElement("dialog"); dlg.setAttribute("class", "mk-dialog mk-dialog-sm");
    dlg.setAttribute("role", "alertdialog");
    dlg.setAttribute("aria-labelledby", "mk-dlg-title"); dlg.setAttribute("aria-describedby", "mk-dlg-text");
    var head = dialogHead({ titleId: "mk-dlg-title", title: opts.title, descId: "mk-dlg-text", desc: opts.text, closeLabel: "Annuler" });
    var actions = document.createElement("div"); actions.setAttribute("class", "mk-dialog-actions");
    var no = document.createElement("button"); no.type = "button"; no.setAttribute("class", "btn btn-outline btn-sm"); no.textContent = "Annuler";
    var yes = document.createElement("button"); yes.type = "button"; yes.setAttribute("class", "btn btn-danger btn-sm"); yes.textContent = opts.ok;
    actions.appendChild(no); actions.appendChild(yes); dlg.appendChild(head.el); dlg.appendChild(actions);
    document.body.appendChild(dlg);
    var previous = document.activeElement;
    function done() { dlg.close(); dlg.remove(); if (previous && previous.focus) previous.focus(); onNo(); }
    no.addEventListener("click", done);
    head.close.addEventListener("click", done);
    yes.addEventListener("click", function () { dlg.close(); dlg.remove(); onYes(); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); done(); });
    dlg.showModal(); no.focus();
  }
  window.mkConfirm = confirmDialog; // réutilisée par l'éditeur de scénarios (src/editor/automation/ui.js)
  $$("[data-mk-confirm]").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      if (trigger.getAttribute("data-mk-confirmed") === "1") return;
      e.preventDefault();
      var form = trigger.form;
      confirmDialog({
        title: trigger.getAttribute("data-mk-confirm-title") || "Confirmer l'action",
        text: trigger.getAttribute("data-mk-confirm"),
        ok: trigger.getAttribute("data-mk-confirm-ok") || "Confirmer"
      }, function () {
        if (!form) return;
        trigger.setAttribute("data-mk-confirmed", "1");
        if (form.requestSubmit) form.requestSubmit(trigger); else form.submit();
      });
    });
  });

  // ---------- Modal réutilisable (création, édition… — jamais pour confirmer une suppression, voir plus haut) ----------
  // Ouverture : [data-mk-modal-open="id-du-dialog"] sur un bouton ou un lien (la navigation est annulée).
  // Le dialog est un <dialog data-mk-modal data-mk-modal-hash="mot-cle"> ; data-mk-modal-hash le relie à une ancre
  // (ex. #nouvelle) pour qu'un lien externe (bouton principal du bandeau) puisse l'ouvrir directement.
  // Fermeture : [data-mk-modal-close] à l'intérieur, clic sur le fond, ou Échap (natif à <dialog>, qui piège aussi le focus).
  var allModals = $$("dialog[data-mk-modal]");
  function openModalEl(dlg) { if (dlg && typeof dlg.showModal === "function" && !dlg.open) { dlg.showModal(); focusFirst(dlg); } }
  function closeModalEl(dlg) { if (dlg && dlg.open) dlg.close(); }
  $$("[data-mk-modal-open]").forEach(function (trigger) {
    trigger.addEventListener("click", function (e) {
      var dlg = document.getElementById(trigger.getAttribute("data-mk-modal-open"));
      if (!dlg) return;
      e.preventDefault();
      openModalEl(dlg);
    });
  });
  allModals.forEach(function (dlg) {
    $$("[data-mk-modal-close]", dlg).forEach(function (b) { b.addEventListener("click", function () { closeModalEl(dlg); }); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) closeModalEl(dlg); }); // clic hors du contenu (sur le <dialog> lui-même = le fond)
    dlg.addEventListener("close", function () {
      var hash = dlg.getAttribute("data-mk-modal-hash");
      if (hash && location.hash === "#" + hash) history.replaceState(null, "", location.pathname + location.search);
    });
  });
  function openModalFromHash() {
    var hash = location.hash.slice(1);
    if (!hash) return;
    var dlg = allModals.filter(function (d) { return d.getAttribute("data-mk-modal-hash") === hash; })[0];
    if (!dlg) return;
    openModalEl(dlg);
    // Ouverte par l'ancre de l'adresse : après le chargement, le navigateur donne le focus à la cible de l'ancre
    // (la fenêtre elle-même) ; on le rend au premier champ.
    var refocus = function () { if (dlg.open && (document.activeElement === dlg || document.activeElement === document.body)) focusFirst(dlg); };
    if (document.readyState === "complete") setTimeout(refocus, 0); else window.addEventListener("load", function () { setTimeout(refocus, 0); }, { once: true });
  }
  openModalFromHash();
  window.addEventListener("hashchange", openModalFromHash);

  // Réouverture après une erreur de création : <span hidden data-mk-modal-reopen="id-du-dialog"> (partial
  // modal-reopen, rendu seulement quand le serveur a renvoyé un message d'erreur). La modale se rouvre avec, en
  // tête, une copie du message d'erreur (sinon caché derrière le fond sombre) et les valeurs déjà saisies.
  // Les saisies sont gardées le temps d'un aller-retour dans sessionStorage (jamais mot de passe ni fichier),
  // effacées dès la page suivante.
  // <form data-mk-once> : une seule soumission à la fois (double clic, Entrée répétée). Le bouton est rendu inactif ; il est rétabli si la page revient de l'historique.
  $$("form[data-mk-once]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("data-mk-sent") === "1") { e.preventDefault(); return; }
      form.setAttribute("data-mk-sent", "1"); form.setAttribute("aria-busy", "true");
      $$("button[type=submit]", form).forEach(function (b) { b.setAttribute("aria-disabled", "true"); b.classList.add("is-busy"); });
    });
  });
  window.addEventListener("pageshow", function (ev) {
    if (!ev.persisted) return;
    $$("form[data-mk-once]").forEach(function (form) {
      form.removeAttribute("data-mk-sent"); form.removeAttribute("aria-busy");
      $$("button[type=submit]", form).forEach(function (b) { b.removeAttribute("aria-disabled"); b.classList.remove("is-busy"); });
    });
  });
  var DRAFT = "mkModalDraft:";
  function draftable(el) { return el.name && !el.disabled && ["password", "hidden", "file", "submit", "button"].indexOf(el.type) === -1; }
  allModals.forEach(function (dlg) {
    var form = dlg.querySelector("form");
    if (!form || !dlg.id) return;
    form.addEventListener("submit", function () {
      var values = $$("input, select, textarea", form).filter(draftable).map(function (el) {
        return { name: el.name, value: el.value, checked: (el.type === "checkbox" || el.type === "radio") ? el.checked : null };
      });
      try { sessionStorage.setItem(DRAFT + dlg.id, JSON.stringify(values)); } catch (e) { /* stockage indisponible : on ne garde rien */ }
    });
  });
  var reopenId = (document.querySelector("[data-mk-modal-reopen]") || { getAttribute: function () { return null; } }).getAttribute("data-mk-modal-reopen");
  allModals.forEach(function (dlg) {
    var saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(DRAFT + dlg.id) || "null"); sessionStorage.removeItem(DRAFT + dlg.id); } catch (e) { saved = null; }
    if (dlg.id !== reopenId) return;
    var fields = $$("input, select, textarea", dlg).filter(draftable);
    (saved || []).forEach(function (v) {
      fields.filter(function (el) { return el.name === v.name; }).forEach(function (el) {
        if (v.checked === null) { if (el.type !== "checkbox" && el.type !== "radio") el.value = v.value; }
        else if (el.value === v.value) el.checked = v.checked;
      });
    });
    var flash = document.querySelector(".mk-flash-error");
    var body = dlg.querySelector(".mk-dialog-body");
    if (flash && body) {
      var copy = flash.cloneNode(true);
      copy.classList.add("mk-dialog-error");
      var title = body.querySelector("h2");
      body.insertBefore(copy, title ? title.nextSibling : body.firstChild);
    }
    openModalEl(dlg);
  });

  // ---------- Message personnalisé pour un champ obligatoire ----------
  // <input required data-mk-required-message="Texte affiché par le navigateur si le champ est vide">
  $$("[data-mk-required-message]").forEach(function (input) {
    input.addEventListener("invalid", function () { input.setCustomValidity(input.validity.valueMissing ? input.getAttribute("data-mk-required-message") : ""); });
    input.addEventListener("input", function () { input.setCustomValidity(""); });
  });

  // ---------- Zone de dépôt de fichier (glisser-déposer + sélection classique, un seul fichier) ----------
  // <div class="mk-dropzone" data-mk-dropzone data-mk-dropzone-max-mb="10">
  //   <div data-mk-dropzone-empty>…</div>          (état vide, avec le <input type=file data-mk-dropzone-input> dedans)
  //   <div data-mk-dropzone-file hidden>…<span data-mk-dropzone-name></span><span data-mk-dropzone-size></span>
  //     <button type="button" data-mk-dropzone-clear></button></div>
  //   <p data-mk-dropzone-error hidden></p>
  // </div>
  // Le <input type=file> reste l'unique source de vérité (le glisser-déposer y écrit via DataTransfer) : le
  // formulaire fonctionne à l'identique sans JavaScript, ce composant n'est qu'une couche de confort.
  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " o";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " Ko";
    return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
  }
  $$("[data-mk-dropzone]").forEach(function (zone) {
    var input = zone.querySelector("[data-mk-dropzone-input]");
    var empty = zone.querySelector("[data-mk-dropzone-empty]");
    var fileBox = zone.querySelector("[data-mk-dropzone-file]");
    var nameEl = zone.querySelector("[data-mk-dropzone-name]");
    var sizeEl = zone.querySelector("[data-mk-dropzone-size]");
    var errorEl = zone.querySelector("[data-mk-dropzone-error]");
    var clearBtn = zone.querySelector("[data-mk-dropzone-clear]");
    var maxMb = Number(zone.getAttribute("data-mk-dropzone-max-mb")) || 0;
    if (!input) return;
    function showError(text) { if (errorEl) { errorEl.textContent = text; errorEl.hidden = false; } }
    function clearError() { if (errorEl) { errorEl.hidden = true; errorEl.textContent = ""; } }
    function refresh() {
      var file = input.files && input.files[0];
      zone.classList.toggle("has-file", Boolean(file)); // désactive le clic-partout une fois un fichier choisi (voir CSS) : le bouton « retirer » redevient cliquable
      if (!file) { if (empty) empty.hidden = false; if (fileBox) fileBox.hidden = true; return; }
      if (maxMb && file.size > maxMb * 1024 * 1024) {
        showError("Fichier trop volumineux (" + humanSize(file.size) + ") : " + maxMb + " Mo au plus.");
        input.value = "";
        zone.classList.remove("has-file");
        if (empty) empty.hidden = false; if (fileBox) fileBox.hidden = true;
        return;
      }
      clearError();
      if (nameEl) nameEl.textContent = file.name;
      if (sizeEl) sizeEl.textContent = humanSize(file.size);
      if (empty) empty.hidden = true; if (fileBox) fileBox.hidden = false;
    }
    input.addEventListener("change", refresh);
    if (clearBtn) clearBtn.addEventListener("click", function () { input.value = ""; clearError(); refresh(); input.focus(); });
    ["dragenter", "dragover"].forEach(function (evt) {
      zone.addEventListener(evt, function (e) { e.preventDefault(); zone.classList.add("is-dragover"); });
    });
    ["dragleave", "dragend"].forEach(function (evt) {
      zone.addEventListener(evt, function () { zone.classList.remove("is-dragover"); });
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("is-dragover");
      var files = e.dataTransfer && e.dataTransfer.files;
      if (!files || !files.length) return;
      input.files = files; // un seul fichier : le navigateur ne garde que files[0] pour un input non-multiple
      refresh();
    });
    refresh(); // état initial (ex. après une erreur serveur qui recharge la page, le champ est de toute façon vide)
  });

  // ---------- Onglets (avec panneaux sur la même page) ----------
  $$("[data-mk-tabs]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls")); if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var next = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (next < 0) return; e.preventDefault(); select(tabs[next], true);
      });
    });
  });

  // ---------- Champs qui dépendent d'un choix (ex. étiquette ou liste selon l'action) ----------
  // <select data-mk-op> + <span data-mk-show-for="a,b"> : le bloc n'est visible que pour les valeurs listées
  $$("[data-mk-op]").forEach(function (sel) {
    var scope = sel.closest("form") || document;
    function sync() {
      $$("[data-mk-show-for]", scope).forEach(function (n) {
        var show = n.getAttribute("data-mk-show-for").split(",").indexOf(sel.value) !== -1;
        n.hidden = !show;
        $$("input, select", n).forEach(function (f) { f.disabled = !show; });
      });
    }
    sel.addEventListener("change", sync); sync();
  });

  // ---------- Blocs repliables ouverts d'office sur grand écran (ex. filtres secondaires) ----------
  var WIDE = window.matchMedia("(min-width: 721px)");
  var wideDetails = $$("details[data-mk-desktop-open]");
  function syncDetails() { if (WIDE.matches) wideDetails.forEach(function (d) { d.open = true; }); }
  WIDE.addEventListener("change", syncDetails); syncDetails();

  // ---------- Sélection de lignes d'un tableau ----------
  $$("table[data-mk-select]").forEach(function (table) {
    var all = table.querySelector("[data-mk-select-all]");
    var rows = $$("[data-mk-select-row]", table);
    var bar = document.querySelector("[data-mk-bulkbar]");
    var count = bar ? bar.querySelector("[data-mk-selected-count]") : null;
    function refresh() {
      var n = rows.filter(function (r) { return r.checked; }).length;
      rows.forEach(function (r) { r.closest("tr").classList.toggle("is-selected", r.checked); });
      if (all) { all.checked = n > 0 && n === rows.length; all.indeterminate = n > 0 && n < rows.length; }
      if (bar) bar.hidden = n === 0;
      if (count) count.textContent = n === 1 ? "1 sélectionné" : n + " sélectionnés";
    }
    if (all) all.addEventListener("change", function () { rows.forEach(function (r) { r.checked = all.checked; }); refresh(); });
    rows.forEach(function (r) { r.addEventListener("change", refresh); });
    refresh();
  });
  // ---------- Thème de l'interface : Clair · Sombre · Automatique ----------
  // L'attribut data-kola-theme (clair/sombre) est posé dans <head> avant le premier affichage ; ici : bascule, mémorisation (kolaTheme), suivi du système.
  var DARK_MQ = window.matchMedia("(prefers-color-scheme: dark)");
  var themeCycle = document.querySelector("[data-kola-theme-cycle]");
  var themeChoices = $$("[data-kola-theme-set]");
  var THEME_NAME = { light: "clair", dark: "sombre", auto: "automatique" };
  function currentPref() { var p = root.getAttribute("data-kola-pref"); return p === "light" || p === "dark" ? p : "auto"; }
  function applyTheme(pref, remember) {
    var dark = pref === "dark" || (pref === "auto" && DARK_MQ.matches);
    // pas de fondu entre les deux thèmes : toutes les surfaces changent ensemble, sans clignotement
    root.setAttribute("data-kola-switching", "");
    root.setAttribute("data-kola-pref", pref);
    root.setAttribute("data-kola-theme", dark ? "dark" : "light");
    if (remember) store("kolaTheme", pref);
    var meta = document.querySelector("meta[name=theme-color]"); if (meta) meta.setAttribute("content", dark ? "#0d1524" : "#ffffff");
    themeChoices.forEach(function (b) { b.setAttribute("aria-checked", b.getAttribute("data-kola-theme-set") === pref ? "true" : "false"); });
    if (themeCycle) { var label = "Thème de l'interface : " + THEME_NAME[pref] + " (cliquer pour changer)"; themeCycle.setAttribute("aria-label", label); themeCycle.setAttribute("title", label); }
    window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { root.removeAttribute("data-kola-switching"); }); });
  }
  applyTheme(currentPref(), false);
  if (themeCycle) themeCycle.addEventListener("click", function () {
    // le bouton alterne clair ↔ sombre selon l'affichage actuel ; « Automatique » se choisit dans le menu du compte
    applyTheme(root.getAttribute("data-kola-theme") === "dark" ? "light" : "dark", true);
  });
  themeChoices.forEach(function (b) { b.addEventListener("click", function () { applyTheme(b.getAttribute("data-kola-theme-set"), true); }); });
  DARK_MQ.addEventListener("change", function () { if (currentPref() === "auto") applyTheme("auto", false); });
})();

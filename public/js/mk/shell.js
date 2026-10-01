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
  var collapseBtn = document.querySelector("[data-mk-sidebar-collapse]");
  var toggleBtn = document.querySelector("[data-mk-sidebar-toggle]");

  function setCollapsed(collapsed) {
    if (collapsed) root.setAttribute("data-sidebar", "collapsed"); else root.removeAttribute("data-sidebar");
    store("mkSidebar", collapsed ? "collapsed" : "open");
    if (collapseBtn) {
      collapseBtn.setAttribute("aria-pressed", collapsed ? "true" : "false");
      var label = collapsed ? "Déployer le menu" : "Réduire le menu";
      collapseBtn.setAttribute("aria-label", label); collapseBtn.setAttribute("title", label);
    }
  }
  if (collapseBtn) {
    setCollapsed(root.getAttribute("data-sidebar") === "collapsed");
    collapseBtn.addEventListener("click", function () { setCollapsed(root.getAttribute("data-sidebar") !== "collapsed"); });
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
    $$(".mk-nav-head", sidebar).forEach(function (head) {
      head.addEventListener("click", function () {
        var group = head.closest(".mk-nav-group");
        if (DESKTOP.matches && root.getAttribute("data-sidebar") === "collapsed") { setCollapsed(false); group.classList.add("is-open"); head.setAttribute("aria-expanded", "true"); return; }
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
    menu.hidden = true; btn.setAttribute("aria-expanded", "false");
    if (returnFocus) btn.focus();
  }
  dropdowns.forEach(function (d) {
    var btn = d.querySelector("[aria-haspopup]"), menu = d.querySelector("[role=menu]");
    if (!btn || !menu) return;
    function items() { return $$("[role=menuitem]", menu); }
    btn.addEventListener("click", function () {
      var open = menu.hidden;
      dropdowns.forEach(function (o) { if (o !== d) closeDropdown(o, false); });
      menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) { var first = items()[0]; if (first) first.focus(); }
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

  // ---------- Confirmation avant une action grave ----------
  // <button data-mk-confirm="Texte" data-mk-confirm-title="Titre" data-mk-confirm-ok="Supprimer"> dans un <form>
  function confirmDialog(opts, onYes) {
    if (typeof HTMLDialogElement !== "function") { if (window.confirm(opts.text)) onYes(); return; }
    var dlg = document.createElement("dialog"); dlg.setAttribute("class", "mk-dialog");
    dlg.setAttribute("aria-labelledby", "mk-dlg-title"); dlg.setAttribute("aria-describedby", "mk-dlg-text");
    var body = document.createElement("div"); body.setAttribute("class", "mk-dialog-body");
    var h = document.createElement("h2"); h.id = "mk-dlg-title"; h.textContent = opts.title;
    var p = document.createElement("p"); p.id = "mk-dlg-text"; p.textContent = opts.text;
    body.appendChild(h); body.appendChild(p);
    var actions = document.createElement("div"); actions.setAttribute("class", "mk-dialog-actions");
    var no = document.createElement("button"); no.type = "button"; no.setAttribute("class", "btn btn-outline btn-sm"); no.textContent = "Annuler";
    var yes = document.createElement("button"); yes.type = "button"; yes.setAttribute("class", "btn btn-danger btn-sm"); yes.textContent = opts.ok;
    actions.appendChild(no); actions.appendChild(yes); dlg.appendChild(body); dlg.appendChild(actions);
    document.body.appendChild(dlg);
    var previous = document.activeElement;
    function done() { dlg.close(); dlg.remove(); if (previous && previous.focus) previous.focus(); }
    no.addEventListener("click", done);
    yes.addEventListener("click", function () { dlg.close(); dlg.remove(); onYes(); });
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); done(); });
    dlg.showModal(); no.focus();
  }
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
  function openModalEl(dlg) { if (dlg && typeof dlg.showModal === "function" && !dlg.open) dlg.showModal(); }
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
    if (dlg) openModalEl(dlg);
  }
  openModalFromHash();
  window.addEventListener("hashchange", openModalFromHash);

  // Réouverture après une erreur de création : <span hidden data-mk-modal-reopen="id-du-dialog"> (partial
  // modal-reopen, rendu seulement quand le serveur a renvoyé un message d'erreur). La modale se rouvre avec, en
  // tête, une copie du message d'erreur (sinon caché derrière le fond sombre) et les valeurs déjà saisies.
  // Les saisies sont gardées le temps d'un aller-retour dans sessionStorage (jamais mot de passe ni fichier),
  // effacées dès la page suivante.
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
})();

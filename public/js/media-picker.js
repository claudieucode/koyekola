// KOLAKISA MediaPicker — le sélecteur de médias PARTAGÉ (une seule version pour l'éditeur de pages, la fiche d'une page,
// et les futurs modules : articles, e-mails, tunnels, produits…). Il lit la médiathèque du CMS par son API (KWMedia),
// permet de rechercher, filtrer par type, charger la suite, et d'envoyer de nouveaux fichiers (glisser-déposer compris) ;
// un fichier envoyé apparaît tout de suite et est présélectionné.
//
//   KWMediaPicker.open({ title: "Choisir une vidéo", type: "video", multiple: false, onPick: function (media) { … } })
//
// type : "image" | "video" | "audio" | "documents" (PDF + Office) ; absent = tous les types, avec un filtre dans la fenêtre.
// extra : { label, onClick } = bouton supplémentaire du pied (ex. « Anciennes images du blog »), qui ferme le sélecteur puis agit.
// onPick reçoit le média choisi { id, path, url, name, title, alt, type, mime, size, width, height… } (un tableau si multiple).
(function () {
  var K = window.KWMedia;
  var TYPE_OPTIONS = [["", "Tous les fichiers"], ["image", "Images"], ["video", "Vidéos"], ["audio", "Audio"], ["documents", "Documents"], ["lottie", "Animations Lottie"]];
  var ACCEPT = { image: "image/jpeg,image/png,image/gif,image/webp,image/avif", video: "video/mp4,video/webm", audio: "audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a", documents: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx", lottie: ".json,.lottie,application/json" };
  var SINGULAR = { image: "une image", video: "une vidéo", audio: "un fichier audio", documents: "un document", lottie: "une animation Lottie" };

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
  var matches = function (type, m) { return !type || type === m.type || (type === "documents" && (m.type === "pdf" || m.type === "document")); };

  function open(opts) {
    opts = opts || {};
    var type = opts.type || "";
    var multiple = Boolean(opts.multiple);
    var state = { q: "", type: type, scope: "", folder: "", page: 1, items: [], chosen: [], more: false, canUpload: false, loading: false };
    var previous = document.activeElement;

    var title = h("h2", { id: "kwmp-title", text: opts.title || "Médiathèque" });
    var status = h("p", { class: "kwmp-status", role: "status", "aria-live": "polite" });
    var search = h("input", { type: "search", class: "kwmp-search", placeholder: "Rechercher (nom, titre, texte alternatif)…", "aria-label": "Rechercher un fichier" });
    var select = type ? null : h("select", { class: "kwmp-type", "aria-label": "Type de fichier" }, TYPE_OPTIONS.map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    var scope = h("select", { class: "kwmp-type", "aria-label": "Afficher" }, [["", "Tous"], ["recents", "Récemment ajoutés"], ["utilise", "Récemment utilisés"], ["favoris", "Favoris"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
    var folderSel = h("select", { class: "kwmp-type", "aria-label": "Dossier", hidden: "" }, [h("option", { value: "", text: "Tous les dossiers" })]);
    var grid = h("ul", { class: "kwmp-grid", role: "list", "aria-label": "Fichiers" });
    var more = h("button", { type: "button", class: "kwmp-more", text: "Charger la suite", hidden: "" });
    var queue = h("ul", { class: "kwmp-queue", "aria-live": "polite", hidden: "" });
    var input = h("input", { type: "file", class: "kwmp-file", multiple: multiple ? "" : null, accept: type ? ACCEPT[type] : Object.keys(ACCEPT).map(function (k) { return ACCEPT[k]; }).join(","), "aria-label": "Choisir des fichiers à envoyer", tabindex: "-1" });
    var drop = h("div", { class: "kwmp-drop", tabindex: "0", role: "button", "aria-label": "Envoyer un fichier : glissez-le ici ou appuyez sur Entrée pour le choisir", hidden: "" }, [h("strong", { text: "Envoyer " + (type ? SINGULAR[type] : "un fichier") }), h("span", { text: "glissez-le ici ou cliquez pour le choisir" })]);
    var ok = h("button", { type: "button", class: "kwmp-ok", text: "Choisir", disabled: "" });
    var cancel = h("button", { type: "button", class: "kwmp-cancel", text: "Annuler" });
    var dlg = h("dialog", { class: "kwmp", "aria-labelledby": "kwmp-title" }, [
      h("header", { class: "kwmp-head" }, [title, h("button", { type: "button", class: "kwmp-x", "aria-label": "Fermer la médiathèque", text: "×", onclick: close })]),
      h("div", { class: "kwmp-tools" }, [search, select, scope, folderSel]),
      drop, input, queue, status,
      h("div", { class: "kwmp-body" }, [grid, more]),
      h("footer", { class: "kwmp-foot" }, [h("a", { class: "kwmp-link", href: "/marketing/site-web/mediatheque", target: "_blank", rel: "noopener", text: "Gérer la médiathèque" }),
        opts.extra ? h("button", { type: "button", class: "kwmp-cancel", text: opts.extra.label, onclick: function () { close(); opts.extra.onClick(); } }) : null, cancel, ok]),
    ]);
    document.body.appendChild(dlg);

    function close() { if (dlg.open) dlg.close(); dlg.remove(); if (previous && previous.focus) previous.focus(); }
    cancel.addEventListener("click", close);
    dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(); });

    function isChosen(m) { return state.chosen.some(function (c) { return c.id === m.id; }); }
    function refreshOk() {
      ok.disabled = !state.chosen.length;
      ok.textContent = multiple && state.chosen.length ? "Insérer " + state.chosen.length + " fichier" + (state.chosen.length > 1 ? "s" : "") : "Choisir";
    }
    function choose(m, now) {
      if (multiple) state.chosen = isChosen(m) ? state.chosen.filter(function (c) { return c.id !== m.id; }) : state.chosen.concat(m);
      else state.chosen = [m];
      paint(); refreshOk();
      if (now && !multiple) finish();
    }
    function finish() {
      if (!state.chosen.length) return;
      var out = multiple ? state.chosen.slice() : state.chosen[0];
      try { K.api("POST", K.BASE + "/utilise", { ids: state.chosen.map(function (c) { return c.id; }) }).catch(function () { /* l'usage n'est pas enregistré : le choix reste valable */ }); } catch (e) { /* idem */ }
      close();
      if (opts.onPick) opts.onPick(out);
    }
    ok.addEventListener("click", finish);

    function tile(m) {
      var chosen = isChosen(m);
      var thumb = m.type === "image" ? h("img", { src: m.thumb || m.path, alt: "", loading: "lazy", decoding: "async" }) : h("span", { class: "kwmp-badge", text: K.badge(m) });
      var btn = h("button", { type: "button", class: "kwmp-item" + (chosen ? " is-chosen" : ""), "aria-pressed": String(chosen), "aria-label": (m.title || m.name) + " (" + (K.TYPE_LABELS[m.type] || "fichier") + ", " + K.fmtSize(m.size) + ")" + (m.type === "image" && !m.alt ? ", sans texte alternatif" : ""),
        onclick: function () { choose(m, false); }, ondblclick: function () { choose(m, true); } }, [thumb, h("span", { class: "kwmp-name", text: m.name }), m.type === "image" && !m.alt ? h("span", { class: "kwmp-flag", text: "Sans texte alt." }) : null]);
      return h("li", {}, btn);
    }
    function paint() {
      grid.textContent = "";
      state.items.forEach(function (m) { grid.appendChild(tile(m)); });
      more.hidden = !state.more;
    }
    function load(reset) {
      if (reset) { state.page = 1; state.items = []; }
      state.loading = true; status.textContent = "Chargement…";
      var p = { q: state.q, type: state.type, page: state.page, limite: 24 }; if (state.scope) p[state.scope] = 1; if (state.folder) p.dossier = state.folder;
      return K.list(p).then(function (r) {
        state.items = state.items.concat(r.items); state.more = r.more; state.canUpload = r.canUpload; state.loading = false;
        drop.hidden = !r.canUpload;
        status.textContent = r.total ? r.total + " fichier" + (r.total > 1 ? "s" : "") + (state.q ? " pour cette recherche." : ".") : (state.q ? "Aucun fichier pour cette recherche." : "Aucun fichier : envoyez-en un.");
        paint();
      }, function (err) { state.loading = false; status.textContent = err.message; status.className = "kwmp-status is-error"; });
    }
    var timer = null;
    search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { state.q = search.value; load(true); }, 250); });
    scope.addEventListener("change", function () { state.scope = scope.value; load(true); });
    folderSel.addEventListener("change", function () { state.folder = folderSel.value; load(true); });
    // Dossiers de la médiathèque de ce site (s'il y en a) : un choix de plus pour retrouver un fichier
    K.api("GET", K.BASE + "/dossiers.json").then(function (r) { if (!r.enabled || !r.folders.length) return; var byParent = function (pid) { return r.folders.filter(function (x) { return (x.parentId || null) === pid; }); }; var add = function (pid, depth) { byParent(pid).forEach(function (x) { folderSel.appendChild(h("option", { value: String(x.id), text: "\u00a0\u00a0".repeat(depth) + x.name })); add(x.id, depth + 1); }); }; folderSel.appendChild(h("option", { value: "racine", text: "Sans dossier" })); add(null, 0); folderSel.hidden = false; }, function () { /* sans dossiers */ });
    if (select) select.addEventListener("change", function () { state.type = select.value; load(true); });
    more.addEventListener("click", function () { state.page++; load(false); });

    // Envoi depuis le sélecteur : un fichier à la fois (progression et erreur par fichier), puis présélection
    function sendFiles(files) {
      Array.prototype.slice.call(files).forEach(function (file) {
        var bar = h("progress", { max: "100", value: "0", "aria-label": "Envoi de " + file.name });
        var msg = h("span", { class: "kwmp-q-msg", text: "Envoi…" });
        var li = h("li", {}, [h("span", { class: "kwmp-q-name", text: file.name }), bar, msg]);
        queue.hidden = false; queue.prepend(li);
        K.upload(file, { onProgress: function (p) { bar.value = Math.round(p * 100); } }).promise.then(function (m) {
          bar.value = 100; msg.textContent = "Enregistré.";
          setTimeout(function () { li.remove(); if (!queue.children.length) queue.hidden = true; }, 3000);
          if (matches(state.type, m)) { state.items.unshift(m); choose(m, false); } else msg.textContent = "Enregistré dans la médiathèque, mais ce n'est pas " + (SINGULAR[state.type] || "le bon type") + ".";
        }, function (err) { msg.textContent = err.message; msg.className = "kwmp-q-msg is-error"; });
      });
    }
    drop.addEventListener("click", function () { input.click(); });
    drop.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    input.addEventListener("change", function () { if (input.files.length) sendFiles(input.files); input.value = ""; });
    ["dragenter", "dragover"].forEach(function (ev) { dlg.addEventListener(ev, function (e) { if (!drop.hidden && e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types, "Files") >= 0) { e.preventDefault(); drop.classList.add("is-over"); } }); });
    dlg.addEventListener("dragleave", function (e) { if (e.target === dlg || e.target === drop) drop.classList.remove("is-over"); });
    dlg.addEventListener("drop", function (e) { drop.classList.remove("is-over"); if (!drop.hidden && e.dataTransfer && e.dataTransfer.files.length) { e.preventDefault(); sendFiles(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]]); } });

    dlg.showModal();
    search.focus();
    load(true);
    return { close: close };
  }

  window.KWMediaPicker = { open: open };
})();

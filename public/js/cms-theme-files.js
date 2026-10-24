/* Apparence → Éditeur de fichiers des thèmes : ouverture des fichiers, état du document, enregistrement réel, conflits, historique.
   L'éditeur de code (CodeMirror) vient de theme-code-editor.js. Rien n'est « enregistré » à l'écran avant la réponse du serveur. */
(function () {
  "use strict";
  var root = document.querySelector("[data-tf-root]");
  if (!root) return;
  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var base = root.getAttribute("data-tf-base");
  var site = root.getAttribute("data-tf-site");
  var canWrite = root.getAttribute("data-tf-can-write") === "1";
  var init = null;
  try { init = JSON.parse(root.getAttribute("data-tf-init") || "null"); } catch (e) { init = null; }
  if (!init) return;

  var ui = {
    theme: $("[data-tf-theme]"), themeState: $("[data-tf-theme-state]"), fileName: $("[data-tf-file-name]"), doc: $("[data-tf-doc]"), docText: $("[data-tf-doc-text]"),
    save: $("[data-tf-save]"), revert: $("[data-tf-revert]"), history: $("[data-tf-history]"), help: $("[data-tf-help]"), helpPanel: $("#tf-help"), historyPanel: $("#tf-history"),
    tree: $("[data-tf-tree]"), search: $("[data-tf-search]"), none: $("[data-tf-none]"), pathLabel: $("[data-tf-path-label]"), ro: $("[data-tf-ro]"), host: $("[data-tf-editor]"),
    fallback: $("[data-tf-fallback]"), alert: $("[data-tf-alert]"), lang: $("[data-tf-lang]"), lines: $("[data-tf-lines]"), size: $("[data-tf-size]"), dialog: $("[data-tf-dialog]"),
    versions: $("[data-tf-versions]"), historyFile: $("[data-tf-history-file]"), historyEmpty: $("[data-tf-history-empty]"), versionView: $("[data-tf-version-view]"),
    versionTitle: $("[data-tf-version-title]"), versionCode: $("[data-tf-version-code]"), restore: $("[data-tf-restore]"), resize: $("[data-tf-resize]"), body: $("[data-tf-body]"),
  };
  var state = { theme: init.theme, path: init.path, etag: init.etag, original: ui.fallback.value, language: init.language, editable: init.editable, busy: false, error: false, versionId: null, editor: null };

  var q = function (extra) { var p = new URLSearchParams(extra || {}); if (site) p.set("site", site); return p.toString(); };
  var api = function (method, path, params, body) {
    var url = base + path + "?" + q(method === "GET" ? params : {});
    var opt = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(body); }
    return fetch(url, opt).then(function (r) { return r.json().catch(function () { return { ok: false, error: { code: "server", message: "Réponse inattendue du serveur." } }; }).then(function (j) { j.status = r.status; return j; }); });
  };

  // ----- État du document -----
  var value = function () { return state.editor ? state.editor.getValue() : ui.fallback.value; };
  var dirty = function () { return value() !== state.original; };
  var bytes = function (s) { return new Blob([s]).size; };
  function paint() {
    var d = dirty(), cls = state.error ? "is-error" : d ? "is-dirty" : "is-saved";
    ui.doc.className = "tf-doc " + cls;
    ui.docText.textContent = state.busy ? "Enregistrement…" : state.error ? "Erreur : non enregistré" : d ? "Modifications non enregistrées" : "Enregistré";
    ui.save.disabled = !(state.editable && d) || state.busy;
    ui.revert.disabled = !d || state.busy;
    ui.ro.hidden = state.editable;
    ui.save.setAttribute("aria-busy", state.busy ? "true" : "false");
    ui.lines.textContent = (state.editor ? state.editor.lineCount() : value().split("\n").length) + " lignes";
    ui.size.textContent = (bytes(value()) / 1024).toFixed(1).replace(".", ",") + " Ko";
    ui.history.disabled = state.path === "compiled/style.css";
    root.classList.toggle("is-dirty", d);
  }
  function alertMsg(text, kind) { ui.alert.hidden = !text; ui.alert.textContent = text || ""; ui.alert.className = "tf-alert" + (kind ? " is-" + kind : ""); }
  function toast(text) { var t = document.getElementById("mk-toasts"); if (!t) return; var n = document.createElement("div"); n.className = "mk-toast mk-toast-ok"; n.textContent = text; t.appendChild(n); setTimeout(function () { n.remove(); }, 3500); }

  // ----- Éditeur -----
  function mount(content, file) {
    state.original = content; state.language = file.language; state.editable = Boolean(file.editable) && canWrite;
    if (window.KolakisaCode) {
      if (!state.editor) {
        ui.fallback.hidden = true;
        state.editor = window.KolakisaCode.create(ui.host, { doc: content, language: file.language, readOnly: !state.editable, onChange: function () { state.error = false; alertMsg(""); paint(); }, onSave: save, label: "Contenu de " + file.path });
      } else { state.editor.setValue(content, file.language); state.editor.setReadOnly(!state.editable); }
    } else { ui.fallback.value = content; ui.fallback.readOnly = !state.editable; ui.fallback.oninput = function () { state.error = false; paint(); }; }
    ui.lang.textContent = String(file.language).toUpperCase();
    state.error = false; alertMsg(""); paint();
  }
  function setCurrent(path) {
    $$("[data-tf-path]").forEach(function (b) { var on = b.getAttribute("data-tf-path") === path; b.classList.toggle("is-current", on); if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    ui.fileName.textContent = path; ui.pathLabel.textContent = path; ui.historyFile.textContent = path;
    var u = new URL(location.href); u.searchParams.set("theme", state.theme); u.searchParams.set("fichier", path); history.replaceState(null, "", u);
  }

  // ----- Garde « modifications non enregistrées » -----
  function guard(next) {
    if (!dirty()) return next();
    var tx = $("[data-tf-dialog-text]");
    tx.textContent = "« " + state.path + " » contient des modifications non enregistrées. Que souhaitez-vous faire ?";
    $("[data-tf-dialog-save]").hidden = !state.editable;
    ui.dialog.returnValue = "cancel";
    ui.dialog.addEventListener("close", function once() {
      ui.dialog.removeEventListener("close", once);
      if (ui.dialog.returnValue === "discard") next();
      else if (ui.dialog.returnValue === "save") save().then(function (ok) { if (ok) next(); });
    });
    if (ui.dialog.showModal) ui.dialog.showModal(); else if (window.confirm("Abandonner les modifications non enregistrées ?")) next();
  }

  // ----- Ouvrir un fichier -----
  function open(path, force) {
    if (path === state.path && !state.error && !force) return;
    (force ? function (f) { f(); } : guard)(function () {
      alertMsg("");
      api("GET", "/lire", { theme: state.theme, fichier: path }).then(function (r) {
        if (!r.ok) return alertMsg(r.error ? r.error.message : "Fichier illisible.", "error");
        state.path = path; state.etag = r.file.etag; setCurrent(path); mount(r.file.content, r.file); renderVersions(r.revisions || []); closeVersion();
      }).catch(function () { alertMsg("Impossible de joindre le serveur.", "error"); });
    });
  }

  // ----- Enregistrer -----
  function save() {
    if (!state.editable || state.busy || !dirty()) return Promise.resolve(false);
    state.busy = true; paint(); alertMsg("");
    return api("POST", "/enregistrer", {}, { theme: state.theme, fichier: state.path, content: value(), etag: state.etag, site: site || undefined }).then(function (r) {
      state.busy = false;
      if (!r.ok) {
        state.error = true; paint();
        alertMsg(r.error ? r.error.message : "Enregistrement impossible.", r.status === 409 ? "conflict" : "error");
        if (r.status === 409) offerReload();
        return false;
      }
      state.etag = r.file.etag; state.original = r.file.content;
      if (value() !== r.file.content) { if (state.editor) state.editor.setValue(r.file.content); else ui.fallback.value = r.file.content; }
      state.error = false; paint(); renderVersions(r.revisions || []); toast(r.message || "Enregistré.");
      if (r.file.changed === false) alertMsg(r.message, "info");
      return true;
    }).catch(function () { state.busy = false; state.error = true; paint(); alertMsg("Impossible de joindre le serveur : rien n'a été enregistré.", "error"); return false; });
  }
  function offerReload() {
    var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-outline btn-sm"; b.textContent = "Charger la version du serveur (abandonner mon texte)";
    b.addEventListener("click", function () { var p = state.path; state.path = ""; open(p, true); });
    ui.alert.appendChild(document.createTextNode(" ")); ui.alert.appendChild(b);
  }

  // ----- Annuler les modifications -----
  function revert() { if (!dirty()) return; if (state.editor) state.editor.setValue(state.original); else ui.fallback.value = state.original; state.error = false; alertMsg(""); paint(); }

  // ----- Historique -----
  function renderVersions(list) {
    ui.versions.textContent = ""; ui.historyEmpty.hidden = list.length > 0;
    list.forEach(function (v, i) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "tf-version"; b.setAttribute("data-id", v.id);
      b.textContent = String(v.at).slice(0, 16).replace("T", " ") + " · " + v.by + (v.note ? " · " + v.note : "") + (i === 0 ? " (actuelle)" : "");
      b.addEventListener("click", function () { showVersion(v.id); });
      li.appendChild(b); ui.versions.appendChild(li);
    });
  }
  function showVersion(id) {
    api("GET", "/version", { theme: state.theme, fichier: state.path, id: id }).then(function (r) {
      if (!r.ok) return alertMsg(r.error ? r.error.message : "Version illisible.", "error");
      state.versionId = id; ui.versionView.hidden = false; ui.versionCode.textContent = r.revision.content;
      ui.versionTitle.textContent = "Version du " + String(r.revision.at).slice(0, 16) + (r.revision.note ? " — " + r.revision.note : "");
      ui.restore.hidden = !state.editable;
    });
  }
  function closeVersion() { state.versionId = null; ui.versionView.hidden = true; }
  function restore() {
    if (state.versionId === null) return;
    guard(function () {
      if (!window.confirm("Restaurer cette version ? Elle sera enregistrée comme une nouvelle version et appliquée au thème.")) return;
      api("POST", "/restaurer", {}, { theme: state.theme, fichier: state.path, id: state.versionId, etag: state.etag, site: site || undefined }).then(function (r) {
        if (!r.ok) { alertMsg(r.error ? r.error.message : "Restauration impossible.", r.status === 409 ? "conflict" : "error"); return; }
        state.etag = r.file.etag; mount(r.file.content, r.file); renderVersions(r.revisions || []); closeVersion(); toast(r.message);
      });
    });
  }

  // ----- Changer de thème (sans perdre le travail en cours) -----
  function changeTheme(key) {
    guard(function () {
      api("GET", "/arbre", { theme: key }).then(function (r) {
        if (!r.ok) { ui.theme.value = state.theme; return alertMsg(r.error ? r.error.message : "Thème illisible.", "error"); }
        state.theme = key; rebuildTree(r.files);
        ui.themeState.textContent = r.theme.active ? "Actif" : r.theme.builtin ? "Intégré" : "Inactif";
        ui.themeState.className = "mk-status " + (r.theme.active ? "mk-status-ok" : "mk-status-off");
        state.path = ""; open("theme.json", true);
      });
    });
  }
  function rebuildTree(files) {
    var dirs = {}; files.forEach(function (f) { (dirs[f.dir] = dirs[f.dir] || []).push(f); });
    var ul = ui.tree.querySelector("ul"); ul.textContent = "";
    var item = function (f) {
      var li = document.createElement("li"); li.setAttribute("role", "none");
      var b = document.createElement("button"); b.type = "button"; b.className = "tf-item"; b.setAttribute("data-tf-path", f.path);
      var n = document.createElement("span"); n.className = "tf-item-name"; n.textContent = f.name; b.appendChild(n);
      if (!f.editable) { var l = document.createElement("span"); l.className = "tf-lock"; l.title = "Lecture seule"; l.textContent = "⌀"; b.appendChild(l); }
      li.appendChild(b); return li;
    };
    (dirs[""] || []).forEach(function (f) { ul.appendChild(item(f)); });
    Object.keys(dirs).filter(Boolean).forEach(function (d) {
      var li = document.createElement("li"); li.className = "tf-dir is-open"; li.setAttribute("data-tf-dir", d);
      var b = document.createElement("button"); b.type = "button"; b.className = "tf-dir-btn"; b.setAttribute("aria-expanded", "true"); b.setAttribute("data-tf-dir-toggle", ""); b.textContent = d;
      var sub = document.createElement("ul"); dirs[d].forEach(function (f) { sub.appendChild(item(f)); });
      li.appendChild(b); li.appendChild(sub); ul.appendChild(li);
    });
  }

  // ----- Événements -----
  ui.tree.addEventListener("click", function (e) {
    var dir = e.target.closest("[data-tf-dir-toggle]");
    if (dir) { var li = dir.parentNode, open_ = !li.classList.contains("is-open"); li.classList.toggle("is-open", open_); dir.setAttribute("aria-expanded", open_ ? "true" : "false"); return; }
    var f = e.target.closest("[data-tf-path]"); if (f) open(f.getAttribute("data-tf-path"));
  });
  ui.search.addEventListener("input", function () {
    var term = ui.search.value.trim().toLowerCase(), any = false;
    $$("[data-tf-path]").forEach(function (b) { var ok = !term || b.getAttribute("data-tf-path").toLowerCase().indexOf(term) !== -1; b.parentNode.hidden = !ok; if (ok) any = true; });
    $$("[data-tf-dir]").forEach(function (d) { var vis = $$("[data-tf-path]", d).some(function (b) { return !b.parentNode.hidden; }); d.hidden = !vis; if (term && vis) { d.classList.add("is-open"); } });
    ui.none.hidden = any;
  });
  ui.save.addEventListener("click", save);
  ui.revert.addEventListener("click", revert);
  ui.theme.addEventListener("change", function () { var k = ui.theme.value; if (k === state.theme) return; if (dirty()) ui.theme.value = state.theme; changeTheme(k); });
  ui.help.addEventListener("click", function () { var o = ui.helpPanel.hidden; ui.helpPanel.hidden = !o; ui.help.setAttribute("aria-expanded", o ? "true" : "false"); });
  ui.history.addEventListener("click", function () {
    var o = ui.historyPanel.hidden; ui.historyPanel.hidden = !o; ui.history.setAttribute("aria-expanded", o ? "true" : "false");
    if (o) api("GET", "/lire", { theme: state.theme, fichier: state.path }).then(function (r) { if (r.ok) renderVersions(r.revisions || []); });
  });
  $("[data-tf-version-close]").addEventListener("click", closeVersion);
  ui.restore.addEventListener("click", restore);
  window.addEventListener("beforeunload", function (e) { if (dirty()) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("keydown", function (e) { if ((e.metaKey || e.ctrlKey) && e.key === "s" && root.contains(document.activeElement || root)) { e.preventDefault(); save(); } });

  // Largeur du panneau des fichiers (souris et clavier)
  (function () {
    var min = 180, max = 460, w = 260, saved = null;
    try { saved = Number(localStorage.getItem("tfSideWidth")); } catch (e) { /* stockage indisponible */ }
    if (saved >= min && saved <= max) w = saved;
    var apply = function () { ui.resize.setAttribute("aria-valuenow", String(w)); ui.body.style.setProperty("--tf-side", w + "px"); try { localStorage.setItem("tfSideWidth", String(w)); } catch (e) { /* ignoré */ } };
    apply();
    ui.resize.addEventListener("pointerdown", function (e) { e.preventDefault(); ui.resize.setPointerCapture(e.pointerId); var x0 = e.clientX, w0 = w;
      var move = function (ev) { w = Math.max(min, Math.min(max, w0 + ev.clientX - x0)); ui.body.style.setProperty("--tf-side", w + "px"); };
      var up = function () { ui.resize.removeEventListener("pointermove", move); ui.resize.removeEventListener("pointerup", up); apply(); };
      ui.resize.addEventListener("pointermove", move); ui.resize.addEventListener("pointerup", up); });
    ui.resize.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); w = Math.max(min, Math.min(max, w + (e.key === "ArrowLeft" ? -16 : 16))); apply(); } });
  })();

  mount(ui.fallback.value, { language: init.language, path: init.path, editable: init.editable });
  ui.fileName.textContent = state.path;
  api("GET", "/lire", { theme: state.theme, fichier: state.path }).then(function (r) { if (r.ok) renderVersions(r.revisions || []); });
})();

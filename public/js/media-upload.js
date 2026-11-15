// KOLAKISA Médias — téléversement : UNE file d'importation pour toute la médiathèque (page « Ajouter un fichier média » et zone d'envoi de la Médiathèque).
// Deux couches : la LOGIQUE (validation, file, états, concurrence, doublons, nouveaux essais — sans DOM, testée sous Node) et l'AFFICHAGE (zone de dépôt, liste, résumé).
// Le navigateur ne fait que prévenir : le serveur revalide tout (signature réelle du fichier, taille, droits, site) et SEUL son « enregistré » marque un fichier comme réussi.
(function (root) {
  "use strict";

  var STATES = { waiting: "En attente", validating: "En validation", sending: "En cours de transfert", processing: "En cours de traitement", done: "Réussi", error: "Échec", cancelled: "Annulé" };
  var ACTIVE = { waiting: 1, validating: 1, sending: 1, processing: 1 };

  var extOf = function (name) { var m = /\.([A-Za-z0-9]{1,8})$/.exec(String(name || "")); return m ? m[1].toLowerCase() : ""; };
  var fingerprint = function (f) { return [f.name, f.size, f.lastModified || 0].join("|"); }; // même nom, même taille, même date : le même fichier choisi deux fois
  var fmtSize = function (n) { n = Number(n) || 0; return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : n >= 1024 ? Math.round(n / 1024) + " Ko" : n + " o"; };
  var WORDS = { image: "une image", video: "une vidéo", audio: "un fichier audio", pdf: "un PDF", document: "un document", lottie: "une animation Lottie" };

  // cfg (fournie par le serveur, source unique) : { extTypes: { jpg: "image", … }, limits: { image: Mo, … }, formats: "…" }
  function validate(file, cfg) {
    var ext = extOf(file.name), type = cfg.extTypes[ext];
    if (!file.size) return { ok: false, message: "Fichier vide : rien à téléverser." };
    if (!type) return { ok: false, message: "Format non pris en charge" + (ext ? " (." + ext + ")" : "") + ". Formats acceptés : " + cfg.formats + "." };
    var max = cfg.limits[type];
    if (max && file.size > max * 1048576) return { ok: false, message: "Fichier trop lourd (" + fmtSize(file.size) + ") : " + max + " Mo au plus pour " + WORDS[type] + "." };
    return { ok: true, type: type };
  }

  // transport(file, { onProgress(0..1), onSent() }) → { promise, abort } ; le résultat de promise est le média ENREGISTRÉ par le serveur
  function createQueue(opts) {
    var concurrency = opts.concurrency || 2, items = [], seq = 0, listeners = [];
    var emit = function (item) { if (opts.onChange) opts.onChange(items.slice(), item || null); };
    var active = function () { return items.filter(function (i) { return i.state === "sending" || i.state === "processing"; }).length; };
    function set(item, state, extra) { item.state = state; if (extra) Object.keys(extra).forEach(function (k) { item[k] = extra[k]; }); emit(item); }
    function check(item) {
      set(item, "validating");
      var v = opts.validate(item.file);
      if (v.ok) set(item, "waiting", { message: "" }); else set(item, "error", { message: v.message, rejected: true });
    }
    function start(item) {
      set(item, "sending", { progress: 0, message: "" });
      item.job = opts.transport(item.file, {
        onProgress: function (p) { item.progress = p; emit(item); },
        onSent: function () { if (item.state === "sending") set(item, "processing", { progress: 1 }); }, // les octets sont partis ; le fichier n'est PAS encore enregistré
      });
      item.job.promise.then(function (media) { set(item, "done", { media: media, progress: 1, message: "" }); },
        function (err) { if (err && err.aborted) set(item, "cancelled", { message: "Envoi annulé." }); else set(item, "error", { message: (err && err.message) || "Échec de l'envoi." }); })
        .then(function () { item.job = null; pump(); });
    }
    function pump() { for (var i = 0; i < items.length && active() < concurrency; i++) if (items[i].state === "waiting") start(items[i]); }
    return {
      items: function () { return items.slice(); },
      // Retourne { added, skipped } : un fichier déjà dans la file (en attente, en cours ou réussi) n'est jamais ajouté deux fois
      add: function (files) {
        var added = [], skipped = [], seen = {};
        items.forEach(function (i) { if (ACTIVE[i.state] || i.state === "done") seen[fingerprint(i.file)] = true; });
        Array.prototype.slice.call(files).forEach(function (file) {
          var fp = fingerprint(file);
          if (seen[fp]) { skipped.push({ name: file.name, reason: "déjà dans la file ou déjà téléversé" }); return; }
          seen[fp] = true;
          var item = { id: ++seq, file: file, name: file.name, size: file.size, state: "waiting", progress: 0, message: "", media: null, job: null };
          items.push(item); added.push(item); check(item);
        });
        pump(); return { added: added, skipped: skipped };
      },
      cancel: function (id) { var it = items.filter(function (i) { return i.id === id; })[0]; if (!it) return; if (it.job && (it.state === "sending" || it.state === "processing")) it.job.abort(); else if (ACTIVE[it.state]) set(it, "cancelled", { message: "Envoi annulé." }); pump(); },
      retry: function (id) { var it = items.filter(function (i) { return i.id === id; })[0]; if (!it || (it.state !== "error" && it.state !== "cancelled")) return; check(it); pump(); },
      remove: function (id) { var at = -1; items.forEach(function (i, n) { if (i.id === id) at = n; }); if (at >= 0 && !ACTIVE[items[at].state]) { items.splice(at, 1); emit(null); } },
      pending: function () { return items.filter(function (i) { return ACTIVE[i.state]; }).length; },
      counts: function () { var c = { done: 0, error: 0, cancelled: 0, active: 0 }; items.forEach(function (i) { if (ACTIVE[i.state]) c.active++; else c[i.state]++; }); return c; },
    };
  }

  // ------------------------------------------------------------------ Affichage
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
  var hasFiles = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; };

  // els : { drop, input, list, summary?, browse? } ; cfg : configuration serveur ; hooks : { transport, onSaved(media), toast(text, type), libraryUrl }
  function mount(els, cfg, hooks) {
    var K = root.KWMedia, toast = hooks.toast || function () {};
    var rows = {}, depth = 0;
    var queue = createQueue({
      validate: function (f) { return validate(f, cfg); },
      transport: hooks.transport || function (file, cb) { return K.upload(file, { onProgress: cb.onProgress, onSent: cb.onSent, folder: file.mxFolder !== undefined ? file.mxFolder : hooks.destination ? hooks.destination() : "", name: file.mxName || "" }); },
      concurrency: cfg.concurrency || 2,
      onChange: function (items, changed) { render(items, changed); },
    });

    function render(items) {
      if (els.list) els.list.hidden = !items.length;
      var keep = {};
      items.forEach(function (it) {
        keep[it.id] = true;
        var r = rows[it.id];
        if (!r) {
          r = rows[it.id] = {
            bar: h("progress", { max: "100", value: "0", "aria-label": "Progression de l'envoi de " + it.name }),
            state: h("span", { class: "mk-ml-q-status", role: "status" }), msg: h("span", { class: "mk-sub mk-ml-q-msg" }),
            cancel: h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Annuler", onclick: function () { queue.cancel(it.id); } }),
            retry: h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Réessayer", hidden: "", onclick: function () { queue.retry(it.id); } }),
            drop: h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Retirer", hidden: "", onclick: function () { queue.remove(it.id); } }),
            view: h("a", { class: "btn btn-outline btn-sm", text: "Voir dans la médiathèque", hidden: "" }),
          };
          r.li = h("li", { class: "mk-ml-q-item", "data-state": it.state }, [h("span", { class: "mk-ml-q-name", text: it.name }), h("span", { class: "mk-sub", text: fmtSize(it.size) }), r.bar, h("span", { class: "mk-ml-q-text" }, [r.state, r.msg]), h("span", { class: "mk-ml-q-actions" }, [r.cancel, r.retry, r.drop, r.view])]);
          els.list.prepend(r.li);
        }
        var active = it.state === "waiting" || it.state === "validating" || it.state === "sending" || it.state === "processing";
        r.li.setAttribute("data-state", it.state);
        r.bar.value = Math.round((it.progress || 0) * 100); r.bar.hidden = !(it.state === "sending" || it.state === "processing");
        r.state.textContent = it.state === "sending" ? STATES.sending + " : " + Math.round((it.progress || 0) * 100) + " %" : it.state === "processing" ? STATES.processing + " : enregistrement par le serveur…" : STATES[it.state];
        r.state.className = "mk-ml-q-status" + (it.state === "done" ? " is-ok" : it.state === "error" || it.state === "cancelled" ? " is-error" : "");
        r.msg.textContent = it.message || (it.state === "done" && it.media ? "Enregistré dans la médiathèque (" + (it.media.width ? it.media.width + " × " + it.media.height + " px, " : "") + fmtSize(it.media.size) + ")." : "");
        r.cancel.hidden = !active; r.retry.hidden = !(it.state === "error" && !it.rejected) && it.state !== "cancelled"; r.drop.hidden = active || it.state === "done";
        if (it.state === "done" && it.media && !r.notified) { r.notified = true; if (hooks.onSaved) hooks.onSaved(it.media); if (hooks.libraryUrl) { r.view.href = hooks.libraryUrl(it.media); r.view.hidden = false; } }
      });
      Object.keys(rows).forEach(function (id) { if (!keep[id]) { rows[id].li.remove(); delete rows[id]; } });
      summarize();
    }
    function summarize() {
      if (!els.summary) return;
      var c = queue.counts(), total = c.done + c.error + c.cancelled;
      if (!c.active && !total) { els.summary.hidden = true; els.summary.textContent = ""; return; }
      els.summary.hidden = false;
      if (c.active) { els.summary.textContent = c.active + " fichier" + (c.active > 1 ? "s" : "") + " en cours…"; els.summary.className = "mk-ml-summary"; return; }
      var parts = [];
      if (c.done) parts.push(c.done + " fichier" + (c.done > 1 ? "s" : "") + " enregistré" + (c.done > 1 ? "s" : "") + " dans la médiathèque de ce site");
      if (c.error) parts.push(c.error + " échec" + (c.error > 1 ? "s" : ""));
      if (c.cancelled) parts.push(c.cancelled + " annulé" + (c.cancelled > 1 ? "s" : ""));
      els.summary.textContent = parts.join(" · ") + ". ";
      els.summary.className = "mk-ml-summary" + (c.error ? " has-error" : c.done ? " is-ok" : "");
      if (c.done && hooks.libraryHref) els.summary.appendChild(h("a", { class: "btn btn-outline btn-sm", href: hooks.libraryHref, text: "Ouvrir la médiathèque" }));
    }

    function take(files) {
      if (!files || !files.length) return;
      // Avant l'envoi, la page peut vérifier les conflits de noms (hooks.beforeAdd) : elle renvoie les fichiers à envoyer (renommés ou non), jamais un envoi silencieux
      if (hooks.beforeAdd) { var list = Array.prototype.slice.call(files); Promise.resolve(hooks.beforeAdd(list)).then(function (ok) { add(ok || list); }, function () { add(list); }); return; }
      add(files);
    }
    function add(files) {
      if (!files || !files.length) return;
      var r = queue.add(files);
      if (r.skipped.length) toast(r.skipped.length === 1 ? "« " + r.skipped[0].name + " » : " + r.skipped[0].reason + "." : r.skipped.length + " fichiers ignorés : déjà dans la file ou déjà téléversés.", "error");
      var refused = r.added.filter(function (i) { return i.rejected; });
      if (refused.length) toast(refused.length + " fichier" + (refused.length > 1 ? "s" : "") + " refusé" + (refused.length > 1 ? "s" : "") + " avant l'envoi (voir la liste) ; les autres continuent.", "error");
    }
    if (els.drop) {
      var browse = function () { if (els.input) els.input.click(); };
      els.drop.addEventListener("click", function (e) { if (!e.target.closest("[data-ml-browse-btn]")) browse(); });
      els.drop.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && e.target === els.drop) { e.preventDefault(); browse(); } });
      // Glisser-déposer : compteur d'entrées (les enfants de la zone déclenchent aussi dragenter / dragleave) ; l'état visuel ne reste jamais « bloqué »
      var off = function () { depth = 0; els.drop.classList.remove("is-over"); };
      els.drop.addEventListener("dragenter", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth++; els.drop.classList.add("is-over"); });
      els.drop.addEventListener("dragover", function (e) { if (!hasFiles(e)) return; e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; });
      els.drop.addEventListener("dragleave", function (e) { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) els.drop.classList.remove("is-over"); });
      els.drop.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); e.stopPropagation(); off(); take(e.dataTransfer.files); });
      ["dragend", "dragexit"].forEach(function (ev) { document.addEventListener(ev, off); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") off(); });
      // Un fichier lâché à côté de la zone n'ouvre pas le fichier dans le navigateur
      ["dragover", "drop"].forEach(function (ev) { window.addEventListener(ev, function (e) { if (hasFiles(e) && !els.drop.contains(e.target)) { e.preventDefault(); if (ev === "drop") { off(); toast("Déposez les fichiers dans la zone prévue.", "error"); } } }); });
    }
    if (els.input) els.input.addEventListener("change", function () { take(els.input.files); els.input.value = ""; });
    if (els.browse) els.browse.addEventListener("click", function (e) { e.stopPropagation(); if (els.input) els.input.click(); });
    // Quitter la page pendant des envois : avertissement du navigateur
    window.addEventListener("beforeunload", function (e) { if (queue.pending() > 0) { e.preventDefault(); e.returnValue = ""; return ""; } });
    return { queue: queue, take: take };
  }

  // Montage automatique : toute page qui porte une zone de dépôt et sa configuration (#mu-config, donnée par le serveur) reçoit la même file d'importation
  function auto() {
    var cfgEl = document.getElementById("mu-config"), drop = document.querySelector("[data-ml-drop]");
    if (!cfgEl || !drop || !root.KWMedia) return;
    var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
    var base = cfg.libraryUrl || "";
    var ctl = mount({ drop: drop, input: document.querySelector("[data-ml-input]"), list: document.querySelector("[data-ml-queue]"), summary: document.querySelector("[data-ml-summary]"), browse: document.querySelector("[data-ml-browse-btn]") }, cfg, {
      toast: root.KWMedia.toast,
      onSaved: function (m) { window.dispatchEvent(new CustomEvent("kw-media-saved", { detail: m })); },
      libraryUrl: function (m) { return base + (base.indexOf("?") >= 0 ? "&" : "?") + "q=" + encodeURIComponent(m.name); },
      libraryHref: base,
      destination: function () { var d = document.querySelector("[data-mx-import-dest]"); return d ? d.value : ""; },
      beforeAdd: function (files) { return root.MXImport && root.MXImport.beforeAdd ? root.MXImport.beforeAdd(files) : files; },
    });
    root.KWUploadCtl = ctl; // la médiathèque y dépose aussi les fichiers glissés depuis le bureau
  }
  if (typeof document !== "undefined") { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto(); }

  var api = { STATES: STATES, extOf: extOf, fingerprint: fingerprint, fmtSize: fmtSize, validate: validate, createQueue: createQueue, mount: mount };
  root.KWUpload = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);

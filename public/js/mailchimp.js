/* KOLAKISA → Marketing → Mailchimp. Console de l'intégration Mailchimp (API Marketing v3 et Transactional) : onglets, tableaux, formulaires, assistant de campagne.
   Aucune donnée venue de Mailchimp n'est injectée comme HTML : tout passe par textContent / attributs ; les aperçus d'e-mail s'affichent dans un iframe « sandbox » sans script.
   Aucune clé d'API n'arrive jamais ici : le serveur ne la renvoie pas. */
(function () {
  "use strict";
  var root = document.querySelector("[data-mc-root]");
  var boot = document.getElementById("mc-data");
  if (!root || !boot) return;
  var BOOT = JSON.parse(boot.textContent || "{}");
  var API = BOOT.api;
  var state = { status: BOOT.status, sync: BOOT.sync, tab: "connexion", audiences: null };
  var panel = root.querySelector("[data-mc-panel]");
  var tabsEl = root.querySelector("[data-mc-tabs]");
  var barEl = root.querySelector("[data-mc-bar]");
  var flashEl = root.querySelector("[data-mc-flash]");

  /* ---------- Outils ---------- */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === undefined || v === null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, String(v));
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c === undefined || c === null || c === false) return;
    if (Array.isArray(c)) c.forEach(function (x) { append(el, x); });
    else el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  var uid = 0;
  var nextId = function (p) { return "mc-" + p + "-" + (++uid); };
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }
  var fmtNum = function (n) { return Number(n || 0).toLocaleString("fr-FR"); };
  var pct = function (r) { return (Number(r || 0) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %"; };
  var money = function (n) { return Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 2 }); };
  function fmtDate(v) {
    if (!v) return "—";
    var d = new Date(String(v).indexOf("T") < 0 && /^\d{4}-\d\d-\d\d \d/.test(String(v)) ? String(v).replace(" ", "T") + "Z" : v);
    return isNaN(d) ? String(v) : d.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
  }
  var STATUS_FR = { subscribed: "Abonné", unsubscribed: "Désabonné", cleaned: "Adresse invalide", pending: "En attente de confirmation", transactional: "Transactionnel", archived: "Archivé",
    save: "Brouillon", paused: "En pause", schedule: "Planifiée", sending: "En cours d'envoi", sent: "Envoyée", canceling: "Annulation", canceled: "Annulée", active: "Active", draft: "Brouillon", published: "Publiée", unpublished: "Non publiée", applied: "Appliqué", ignored: "Ignoré", failed: "Échec", received: "Reçu" };
  var statusFr = function (s) { return STATUS_FR[s] || s || "—"; };

  function flash(message, kind) {
    flashEl.hidden = !message;
    flashEl.textContent = message || "";
    flashEl.className = "mk-mc-flash" + (kind ? " is-" + kind : "");
    if (message) flashEl.scrollIntoView({ block: "nearest" });
  }
  function ApiError(message, code, status) { var e = new Error(message); e.code = code; e.status = status; return e; }
  async function api(method, path, body) {
    var res;
    try {
      res = await fetch(API + path, { method: method, credentials: "same-origin", headers: Object.assign({ Accept: "application/json", "X-Requested-With": "fetch" }, body !== undefined ? { "Content-Type": "application/json" } : {}), body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (e) { throw ApiError("Impossible de joindre le serveur Kolakisa. Vérifiez votre connexion puis réessayez.", "network", 0); }
    var json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    if (!json) throw ApiError(res.redirected || res.status === 401 || res.status === 302 ? "Votre session a expiré : reconnectez-vous à Kolakisa." : "Réponse inattendue du serveur (code " + res.status + ").", "bad_response", res.status);
    if (!json.ok) throw ApiError((json.error && json.error.message) || "Erreur inconnue.", json.error && json.error.code, res.status);
    return json.data;
  }
  var q = function (obj) {
    var p = new URLSearchParams();
    Object.keys(obj || {}).forEach(function (k) { if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") p.append(k, obj[k]); });
    var s = p.toString();
    return s ? "?" + s : "";
  };
  var enc = encodeURIComponent;
  function fail(e) { flash(e && e.message ? e.message : "Erreur inattendue.", "error"); }
  function busy(el, on) { if (el) { el.setAttribute("aria-busy", on ? "true" : "false"); } }

  function badge(text, kind) { return h("span", { class: "mk-mc-badge" + (kind ? " is-" + kind : ""), text: text }); }
  function statusBadge(s) {
    var kind = { subscribed: "ok", sent: "ok", active: "ok", published: "ok", applied: "ok", unsubscribed: "warn", paused: "warn", schedule: "info", sending: "info", pending: "info", cleaned: "bad", failed: "bad", canceled: "bad" }[s] || "";
    return badge(statusFr(s), kind);
  }
  function button(label, onclick, opts) {
    opts = opts || {};
    return h("button", { type: opts.type || "button", class: "mk-mc-btn" + (opts.primary ? " is-primary" : "") + (opts.danger ? " is-danger" : ""), onclick: onclick, disabled: opts.disabled, "aria-label": opts.aria, title: opts.title, text: label });
  }
  function field(label, input, hint) {
    var id = input.id || nextId("f");
    input.id = id;
    return h("div", { class: "mk-mc-field" }, h("label", { for: id, text: label }), input, hint ? h("small", { id: id + "-h", text: hint }) : null);
  }
  function select(options, value, props) {
    var el = h("select", props || {});
    options.forEach(function (o) {
      var opt = h("option", { value: Array.isArray(o) ? o[0] : o, text: Array.isArray(o) ? o[1] : o });
      if ((Array.isArray(o) ? o[0] : o) === value) opt.selected = true;
      el.appendChild(opt);
    });
    return el;
  }

  /* Boîte de dialogue de formulaire : fields = [{ name, label, type, required, hint, options, value, rows }] ; onSubmit(values) renvoie une promesse (l'erreur s'affiche dans la boîte) */
  function formDialog(opts) {
    var dlg = h("dialog", { class: "mk-mc-dialog", "aria-labelledby": "mc-dlg-title" });
    var err = h("p", { class: "mk-mc-dlg-error", role: "alert", hidden: true });
    var form = h("form", { novalidate: true, method: "dialog" });
    var inputs = {};
    (opts.fields || []).forEach(function (f) {
      var input;
      if (f.type === "select") input = select(f.options, f.value);
      else if (f.type === "textarea") input = h("textarea", { rows: f.rows || 5, spellcheck: "false" });
      else if (f.type === "checkbox") input = h("input", { type: "checkbox" });
      else input = h("input", { type: f.type || "text", autocomplete: "off", maxlength: f.max, min: f.min, max: f.maxValue, step: f.step });
      if (f.type !== "select" && f.type !== "checkbox" && f.value !== undefined) input.value = f.value;
      if (f.type === "checkbox") input.checked = Boolean(f.value);
      if (f.required) input.required = true;
      inputs[f.name] = input;
      if (f.type === "checkbox") {
        var cid = nextId("c"); input.id = cid;
        form.appendChild(h("div", { class: "mk-mc-check" }, input, h("label", { for: cid, text: f.label }), f.hint ? h("small", { text: f.hint }) : null));
      } else form.appendChild(field(f.label + (f.required ? " (obligatoire)" : ""), input, f.hint));
    });
    var submit = button(opts.submitLabel || "Enregistrer", null, { primary: true, type: "submit", danger: opts.danger });
    var cancel = button("Annuler", function () { dlg.close(); });
    form.appendChild(h("div", { class: "mk-mc-actions" }, cancel, submit));
    form.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      err.hidden = true;
      var values = {};
      for (var i = 0; i < (opts.fields || []).length; i++) {
        var f = opts.fields[i], el = inputs[f.name];
        var v = f.type === "checkbox" ? el.checked : el.value.trim();
        if (f.required && (v === "" || v === false) && f.type !== "checkbox") { err.textContent = "« " + f.label + " » est obligatoire."; err.hidden = false; el.focus(); return; }
        if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { err.textContent = "« " + f.label + " » : adresse e-mail invalide."; err.hidden = false; el.focus(); return; }
        values[f.name] = v;
      }
      submit.disabled = true; busy(dlg, true);
      try { await opts.onSubmit(values); dlg.close(); }
      catch (e) { err.textContent = e.message || "Erreur."; err.hidden = false; }
      finally { submit.disabled = false; busy(dlg, false); }
    });
    dlg.appendChild(h("h2", { id: "mc-dlg-title", text: opts.title }));
    if (opts.intro) dlg.appendChild(h("p", { class: "mk-mc-sub", text: opts.intro }));
    dlg.appendChild(err); dlg.appendChild(form);
    dlg.addEventListener("close", function () { dlg.remove(); if (opts.returnFocus && document.contains(opts.returnFocus)) opts.returnFocus.focus(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    var first = form.querySelector("input, select, textarea"); if (first) first.focus();
    return dlg;
  }
  /* Confirmation explicite : le bouton porte l'action (« Envoyer maintenant »…) ; typed = texte à recopier pour les actions irréversibles */
  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      var dlg = h("dialog", { class: "mk-mc-dialog", "aria-labelledby": "mc-cf-title" });
      var typedInput = opts.typed ? h("input", { type: "text", autocomplete: "off", "aria-label": "Recopiez « " + opts.typed + " » pour confirmer" }) : null;
      var ok = button(opts.label || "Confirmer", null, { primary: !opts.danger, danger: opts.danger, disabled: Boolean(opts.typed) });
      if (typedInput) typedInput.addEventListener("input", function () { ok.disabled = typedInput.value.trim() !== opts.typed; });
      var done = false;
      var finish = function (v) { if (done) return; done = true; dlg.close(); resolve(v); };
      ok.addEventListener("click", function () { finish(true); });
      dlg.addEventListener("close", function () { dlg.remove(); if (!done) { done = true; resolve(false); } });
      dlg.appendChild(h("h2", { id: "mc-cf-title", text: opts.title }));
      dlg.appendChild(h("p", { text: opts.text }));
      if (typedInput) dlg.appendChild(h("div", { class: "mk-mc-field" }, h("label", { text: "Recopiez « " + opts.typed + " »" }), typedInput));
      dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Annuler", function () { finish(false); }), ok));
      document.body.appendChild(dlg);
      dlg.showModal();
      (typedInput || dlg.querySelector("button")).focus();
    });
  }
  /* Tableau accessible ; columns = [{ label, cell(row) → texte | nœud }] */
  function table(caption, columns, rows, opts) {
    opts = opts || {};
    var t = h("table", { class: "mk-mc-table" });
    t.appendChild(h("caption", { class: "sr-only", text: caption }));
    var head = h("tr");
    columns.forEach(function (c) { head.appendChild(h("th", { scope: "col", text: c.label })); });
    t.appendChild(h("thead", {}, head));
    var body = h("tbody");
    rows.forEach(function (row, i) {
      var tr = h("tr");
      columns.forEach(function (c) { tr.appendChild(h("td", { "data-label": c.label }, c.cell(row, i))); });
      body.appendChild(tr);
    });
    t.appendChild(body);
    return h("div", { class: "mk-mc-scroll" }, t);
  }
  function empty(text) { return h("p", { class: "mk-mc-empty", text: text }); }
  function csvCell(v) { var t = String(v === undefined || v === null ? "" : v); if (/^[=@\t\r]/.test(t) || (/^[+-]/.test(t) && !/^[+-]?[\d\s().-]+$/.test(t))) t = "'" + t; return /[",\n\r;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; }
  function downloadCsv(name, header, rows) {
    var text = "﻿" + [header.map(csvCell).join(",")].concat(rows.map(function (r) { return r.map(csvCell).join(","); })).join("\r\n") + "\r\n";
    var url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
    var a = h("a", { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  /* Analyse d'un CSV (virgule ou point-virgule, guillemets) → { header, rows } */
  function parseCsv(text) {
    text = String(text || "").replace(/^﻿/, "");
    var first = text.split(/\r?\n/)[0] || "";
    var delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ";" : ",";
    var rows = [], row = [], cur = "", inq = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inq) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inq = false; } else cur += c; }
      else if (c === '"') inq = true;
      else if (c === delim) { row.push(cur); cur = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.some(function (x) { return x.trim() !== ""; })) rows.push(row); row = []; }
      else cur += c;
    }
    row.push(cur); if (row.some(function (x) { return x.trim() !== ""; })) rows.push(row);
    return { header: (rows.shift() || []).map(function (x) { return x.trim(); }), rows: rows };
  }
  /* Graphique en barres SVG (valeurs 0..max) accessible : titre, description, tableau équivalent masqué */
  function barChart(title, items, opts) {
    opts = opts || {};
    var w = 560, hgt = 180, pad = 28, max = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([opts.max || 0.0001]));
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + hgt); svg.setAttribute("role", "img"); svg.setAttribute("class", "mk-mc-chart");
    var tt = document.createElementNS(ns, "title"); tt.textContent = title; svg.appendChild(tt);
    var desc = document.createElementNS(ns, "desc"); desc.textContent = items.map(function (i) { return i.label + " : " + (opts.format ? opts.format(i.value) : i.value); }).join(" ; "); svg.appendChild(desc);
    var bw = (w - pad * 2) / Math.max(items.length, 1);
    items.forEach(function (it, i) {
      var bh = Math.round((hgt - pad * 2) * (it.value / max));
      var r = document.createElementNS(ns, "rect");
      r.setAttribute("x", pad + i * bw + 4); r.setAttribute("y", hgt - pad - bh); r.setAttribute("width", Math.max(bw - 8, 2)); r.setAttribute("height", Math.max(bh, 1)); r.setAttribute("class", "mk-mc-rect" + (it.kind ? " is-" + it.kind : ""));
      svg.appendChild(r);
      if (items.length <= 12) { var tx = document.createElementNS(ns, "text"); tx.setAttribute("x", pad + i * bw + bw / 2); tx.setAttribute("y", hgt - 8); tx.setAttribute("text-anchor", "middle"); tx.setAttribute("class", "mk-mc-axis"); tx.textContent = String(it.label).slice(0, 10); svg.appendChild(tx); }
    });
    return svg;
  }

  /* Pagination count/offset : load(offset, count) → { total } ; construit « Précédent / Suivant » */
  function pager(total, offset, count, go) {
    var from = total ? offset + 1 : 0, to = Math.min(offset + count, total);
    return h("nav", { class: "mk-mc-pager", "aria-label": "Pagination" },
      h("span", { text: from + "–" + to + " sur " + fmtNum(total) }),
      button("Précédent", function () { go(Math.max(offset - count, 0)); }, { disabled: offset <= 0 }),
      button("Suivant", function () { go(offset + count); }, { disabled: offset + count >= total }));
  }

  /* ---------- Audiences partagées entre onglets ---------- */
  async function loadAudiences(force) {
    if (state.audiences && !force) return state.audiences;
    var remote = await api("GET", "/audiences" + q({ count: 100, fields: "lists.id,lists.name,lists.stats,lists.double_optin,lists.campaign_defaults,lists.permission_reminder,total_items" }));
    var mirror = {};
    try { (await api("GET", "/miroir/audiences")).forEach(function (a) { mirror[a.id] = a; }); } catch (e) { /* miroir absent : pas de liaison affichée */ }
    state.audiences = (remote.lists || []).map(function (l) { return Object.assign({}, l, { localListId: mirror[l.id] ? mirror[l.id].localListId : null }); });
    return state.audiences;
  }
  function audienceSelect(audiences, value, label) {
    return field(label || "Audience", select(audiences.map(function (a) { return [a.id, a.name + " (" + fmtNum(a.stats && a.stats.member_count) + ")"]; }), value));
  }
  /* ---------- Onglets et barre d'état ---------- */
  var tabs = [];
  function registerTab(t) { tabs.push(t); }
  var connected = function () { return Boolean(state.status && state.status.connected); };
  var pollTimer = null;

  function renderBar() {
    clear(barEl);
    if (!connected()) { barEl.appendChild(h("p", { class: "mk-mc-sub", text: "Non connecté. Enregistrez votre clé d'API dans l'onglet « Connexion »." })); return; }
    var a = state.status.account || {};
    var s = state.sync || {};
    var label = s.running ? "Synchronisation en cours…" : s.lastSyncAt ? "Dernière synchronisation : " + fmtDate(s.lastSyncAt) + " (" + ({ ok: "réussie", partial: "partielle", error: "en erreur", never: "jamais" }[s.status] || s.status) + ")" : "Jamais synchronisé";
    barEl.appendChild(h("div", { class: "mk-mc-barinner" },
      h("span", { class: "mk-mc-who", text: "Connecté : " + (a.name || "compte Mailchimp") + (a.dc ? " (" + a.dc + ")" : "") }),
      h("span", { class: "mk-mc-sync" + (s.status === "error" ? " is-bad" : s.status === "partial" ? " is-warn" : ""), role: "status", text: label }),
      button(s.running ? "En cours…" : "Synchroniser maintenant", function () { startSync(false); }, { disabled: s.running })));
  }
  async function refreshStatus() {
    try { var d = await api("GET", "/etat"); state.status = d.status; state.sync = d.sync; } catch (e) { return; }
    renderBar();
    if (state.sync && state.sync.running) schedulePoll(); else if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  }
  function schedulePoll() { if (pollTimer) return; pollTimer = setTimeout(async function () { pollTimer = null; var was = state.sync && state.sync.running; await refreshStatus(); if (was && !(state.sync && state.sync.running)) { state.audiences = null; if (state.tab !== "connexion") renderTab(); else renderTab(); flash(state.sync.status === "error" ? "La synchronisation a échoué : " + (state.sync.error || "voir le détail dans l'onglet Connexion.") : "Synchronisation terminée.", state.sync.status === "error" ? "error" : "ok"); } }, 2500); }
  async function startSync(full, quiet) {
    try { await api("POST", "/sync", { full: Boolean(full) }); if (!quiet) flash("Synchronisation lancée. Vous pouvez continuer à travailler.", "ok"); state.sync = Object.assign({}, state.sync, { running: true }); renderBar(); schedulePoll(); }
    catch (e) { fail(e); }
  }
  function buildTabs() {
    clear(tabsEl);
    tabs.forEach(function (t, i) {
      var locked = t.needsConnection && !connected();
      var b = h("button", { type: "button", role: "tab", id: "mc-tab-" + t.id, "aria-controls": "mc-panel", "aria-selected": state.tab === t.id ? "true" : "false", tabindex: state.tab === t.id ? "0" : "-1", "aria-disabled": locked ? "true" : null, class: "mk-mc-tab" + (locked ? " is-locked" : ""), text: t.label });
      b.addEventListener("click", function () { selectTab(t.id, true); });
      b.addEventListener("keydown", function (ev) {
        var idx = i, key = ev.key;
        if (key === "ArrowRight") idx = (i + 1) % tabs.length; else if (key === "ArrowLeft") idx = (i - 1 + tabs.length) % tabs.length; else if (key === "Home") idx = 0; else if (key === "End") idx = tabs.length - 1; else return;
        ev.preventDefault();
        var target = tabsEl.children[idx]; target.focus();
      });
      tabsEl.appendChild(b);
    });
    panel.setAttribute("role", "tabpanel"); panel.id = "mc-panel";
  }
  function selectTab(id, userAction) {
    var t = tabs.filter(function (x) { return x.id === id; })[0] || tabs[0];
    if (t.needsConnection && !connected()) { flash("Connectez d'abord votre compte Mailchimp (onglet « Connexion »).", "error"); if (userAction) return; t = tabs[0]; }
    flash("");
    state.tab = t.id;
    try { history.replaceState(null, "", "#" + t.id); } catch (e) { /* aperçu sans historique */ }
    buildTabs();
    panel.setAttribute("aria-labelledby", "mc-tab-" + t.id);
    renderTab();
    if (userAction) { var cur = document.getElementById("mc-tab-" + t.id); if (cur) cur.focus(); }
  }
  function renderTab() {
    var t = tabs.filter(function (x) { return x.id === state.tab; })[0] || tabs[0];
    clear(panel);
    panel.appendChild(h("h2", { class: "mk-mc-h2", text: t.label }));
    var holder = h("div", { class: "mk-mc-body" });
    panel.appendChild(holder);
    holder.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
    busy(panel, true);
    Promise.resolve().then(function () { return t.render(holder); }).then(function () { var l = holder.querySelector(".mk-mc-loading"); if (l) l.remove(); }).catch(function (e) { clear(holder); holder.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message || "Erreur." })); }).then(function () { busy(panel, false); });
  }
  function start() {
    renderBar();
    var wanted = (location.hash || "").replace("#", "");
    var initial = tabs.some(function (t) { return t.id === wanted; }) ? wanted : connected() ? "apercu" : "connexion";
    selectTab(initial, false);
    if (state.sync && state.sync.running) schedulePoll();
  }
  window.__mc = { h: h, api: api, state: state, flash: flash, formDialog: formDialog, confirmDialog: confirmDialog, table: table, button: button, field: field, select: select, statusBadge: statusBadge, badge: badge, empty: empty, q: q, enc: enc, fmtNum: fmtNum, pct: pct, money: money, fmtDate: fmtDate, statusFr: statusFr, clear: clear, fail: fail, busy: busy, downloadCsv: downloadCsv, parseCsv: parseCsv, barChart: barChart, pager: pager, loadAudiences: loadAudiences, audienceSelect: audienceSelect, csvCell: csvCell, BOOT: BOOT, registerTab: registerTab, start: start, refreshStatus: refreshStatus, selectTab: selectTab, renderTab: renderTab, renderBar: renderBar, startSync: startSync, connected: connected, nextId: nextId, append: append };
})();

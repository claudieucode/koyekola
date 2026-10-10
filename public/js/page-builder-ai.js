/* IA Kolakisa : un seul espace pour créer, adapter au responsive et corriger la page de l'éditeur.
   - Une seule fenêtre (<dialog>) : grande fenêtre centrée OU panneau latéral ; on bascule sans rien perdre (même contenu, même état).
   - L'IA PROPOSE (opérations validées par le serveur) ; l'éditeur applique en UNE étape d'historique (Ctrl+Z l'annule). Aperçu = application
     provisoire, sans enregistrement automatique, annulable.
   - Adapter : l'éditeur MESURE le rendu réel de la tablette et du mobile ; les corrections sont calculées par des règles et n'écrivent que dans l'écran concerné.
   - Corriger : annotations dessinées au-dessus du canevas (temporaires, jamais enregistrées dans la page) ; chaque annotation est reliée aux éléments réels qu'elle recouvre. */
(function () {
  "use strict";
  var B = null;
  var S = { mode: "dialog", tab: "create", configured: null, busy: false, ctl: null, history: [], current: null, previewing: false, report: null, annot: null };
  var el = {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var BP_W = { tablet: 820, mobile: 390 };
  var BP_NAME = { desktop: "ordinateur", tablet: "tablette", mobile: "mobile" };

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") n.textContent = v;
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  var ico = function (name) { return B.icon(name); };
  var pref = function (k, d) { return B.store.get("ai-" + k, d); };

  // ---------- Fenêtre ----------
  function build() {
    var tabs = [["create", "Créer", "sparkles"], ["adapt", "Adapter", "smartphone"], ["fix", "Corriger", "edit"]];
    el.dlg = h("dialog", { class: "pb-ai", "aria-labelledby": "pb-ai-title", "data-pb-ai-dialog": true });
    el.modeBtn = h("button", { type: "button", class: "pb-icon-btn", "data-pb-ai-mode": true, onclick: function () { setMode(S.mode === "dialog" ? "panel" : "dialog"); } });
    el.head = h("div", { class: "pb-ai-head" }, [
      h("h2", { id: "pb-ai-title" }, [ico("sparkles", 16), " IA Kolakisa"]),
      h("div", { class: "pb-ai-tabs", role: "tablist" }, tabs.map(function (t) {
        return h("button", { type: "button", role: "tab", class: "pb-ai-tab", "data-tab": t[0], onclick: function () { setTab(t[0]); } }, [ico(t[2], 15), t[1]]);
      })),
      el.modeBtn,
      h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Fermer", "data-tip": "Fermer (la conversation est conservée)", onclick: function () { el.dlg.close(); } }, [ico("close", 16)]),
    ]);
    el.notice = h("div", { class: "pb-ai-notice", hidden: true, role: "status" });
    el.panes = {};
    tabs.forEach(function (t) { el.panes[t[0]] = h("section", { class: "pb-ai-pane", "data-pane": t[0], role: "tabpanel", hidden: true }); });
    buildCreate(); buildAdapt(); buildFix();
    el.dlg.appendChild(el.head); el.dlg.appendChild(el.notice);
    el.body = h("div", { class: "pb-ai-body" }, Object.keys(el.panes).map(function (k) { return el.panes[k]; }));
    el.dlg.appendChild(el.body);
    document.body.appendChild(el.dlg);
    el.dlg.addEventListener("keydown", function (e) { if (e.key === "Escape" && S.annot) { e.preventDefault(); stopAnnot(); } });
    el.dlg.addEventListener("close", function () { if (!S.switching) refreshButton(); });
  }
  function refreshButton() { el.btn.setAttribute("aria-expanded", String(el.dlg.open)); el.btn.classList.toggle("is-active", el.dlg.open); }
  function open() {
    if (S.mode === "dialog") el.dlg.showModal(); else el.dlg.show();
    el.dlg.dataset.mode = S.mode; refreshButton(); updateModeBtn(); checkState();
    var ta = $("textarea", el.panes[S.tab]); if (ta && !ta.disabled) ta.focus();
  }
  function setMode(m, temp) {
    S.mode = m; if (!temp) B.store.set("ai-mode", m);
    if (el.dlg.open) { S.switching = true; el.dlg.close(); S.switching = false; open(); }
    updateModeBtn();
  }
  function updateModeBtn() {
    el.modeBtn.innerHTML = "";
    el.modeBtn.appendChild(ico(S.mode === "dialog" ? "columns" : "maximize", 16));
    el.modeBtn.setAttribute("aria-label", S.mode === "dialog" ? "Passer en panneau latéral" : "Passer en grande fenêtre");
    el.modeBtn.setAttribute("data-tip", S.mode === "dialog" ? "Panneau latéral : la page reste visible et modifiable" : "Grande fenêtre centrée");
  }
  function setTab(t) {
    if (S.annot && t !== "fix") stopAnnot();
    S.tab = t; B.store.set("ai-tab", t);
    $$(".pb-ai-tab", el.head).forEach(function (b) { b.setAttribute("aria-selected", String(b.dataset.tab === t)); b.classList.toggle("is-on", b.dataset.tab === t); });
    Object.keys(el.panes).forEach(function (k) { el.panes[k].hidden = k !== t; });
  }
  function notice(text, kind) { el.notice.hidden = !text; el.notice.textContent = text || ""; el.notice.className = "pb-ai-notice" + (kind ? " is-" + kind : ""); }
  function checkState() {
    B.api("GET", B.base + "/ia/etat").then(function (r) {
      S.configured = r.configured;
      notice(r.configured ? "" : "L'IA n'est pas activée sur ce serveur (clé ANTHROPIC_API_KEY manquante). L'analyse responsive par règles reste disponible dans « Adapter ».", "warn");
      [el.sendCreate, el.sendFix].forEach(function (b) { if (b) b.disabled = !r.configured || S.busy; });
    }, function () { /* hors ligne : l'envoi signalera l'erreur */ });
  }

  // ---------- Appel d'une proposition ----------
  function ask(payload, host, sendBtn, label) {
    if (S.busy) return;
    discardIfPreviewing();
    B.saveNow().then(function () {
      var key = B.snapshotKey();
      payload.revision = B.revision(); payload.bp = B.device(); payload.selection = B.selection()[0] || "";
      payload.history = S.history.slice(-6);
      S.busy = true; S.ctl = typeof AbortController === "function" ? new AbortController() : null;
      setBusy(host, true, label);
      return fetch(B.base + "/ia/proposer", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), signal: S.ctl && S.ctl.signal })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse illisible (" + r.status + ")." }; }).then(function (d) { d.__status = r.status; return d; }); })
        .then(function (d) {
          if (!d.ok) throw new Error(d.error || "Erreur du serveur.");
          S.history.push({ role: "user", text: payload.instruction });
          S.history.push({ role: "ai", text: d.question || d.summary || "" });
          S.current = { p: d, key: key, host: host };
          renderProposal(host, d);
        });
    }).catch(function (e) {
      if (e && e.name === "AbortError") { host.textContent = ""; host.appendChild(h("p", { class: "pb-ai-muted", text: "Demande annulée." })); return; }
      host.textContent = ""; host.appendChild(h("p", { class: "pb-ai-error", role: "alert", text: (e && e.message) || "Erreur." }));
    }).then(function () { S.busy = false; S.ctl = null; setBusy(host, false); checkState(); });
  }
  function setBusy(host, on, label) {
    [el.sendCreate, el.sendFix].forEach(function (b) { if (b) b.disabled = on || S.configured === false; });
    if (on) {
      host.textContent = "";
      host.appendChild(h("div", { class: "pb-ai-busy", role: "status" }, [h("span", { class: "pb-ai-spin" }), h("span", { text: label || "L'IA prépare une proposition…" }),
        h("button", { type: "button", class: "btn btn-outline btn-sm", onclick: function () { if (S.ctl) S.ctl.abort(); } }, "Annuler")]));
    }
  }

  // ---------- Proposition : différences, aperçu, application, rejet ----------
  var KIND = { style: "Style", prop: "Contenu", insert: "Ajout", remove: "Suppression", move: "Déplacement", page: "Page" };
  function renderProposal(host, p, opts) {
    opts = opts || {};
    host.textContent = "";
    if (p.question) host.appendChild(h("p", { class: "pb-ai-question", text: p.question }));
    if (p.summary) host.appendChild(h("p", { class: "pb-ai-summary", text: p.summary }));
    var changes = p.changes || [];
    if (!changes.length) { if (!p.question) host.appendChild(h("p", { class: "pb-ai-muted", text: "Aucune modification proposée." })); return; }
    var groups = {};
    changes.forEach(function (c) { (groups[c.target + ":" + (c.bp || "")] = groups[c.target + ":" + (c.bp || "")] || []).push(c); });
    var list = h("div", { class: "pb-ai-changes" });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], first = g[0];
      var d = h("details", { class: "pb-ai-group" }, [h("summary", {}, [h("strong", { text: first.name }), h("span", { class: "pb-ai-count", text: g.length + (g.length > 1 ? " modifications" : " modification") + (first.bp ? " · " + BP_NAME[first.bp] : "") })])]);
      g.forEach(function (c) {
        var row = h("div", { class: "pb-ai-row" + (c.destructive ? " is-danger" : "") });
        row.appendChild(h("span", { class: "pb-ai-kind", text: KIND[c.kind] || c.kind }));
        if (c.kind === "style" || c.kind === "prop" || c.kind === "page") {
          row.appendChild(h("span", { class: "pb-ai-prop", text: c.label || c.prop }));
          row.appendChild(h("span", { class: "pb-ai-diff" }, [h("del", { text: c.before || "—" }), " → ", h("ins", { text: c.after || "(retiré)" })]));
        } else row.appendChild(h("span", { class: "pb-ai-prop", text: c.kind === "remove" ? "sera supprimé" : c.parent ? "dans « " + c.parent + " »" : "" }));
        if (c.why) row.title = c.why;
        d.appendChild(row);
      });
      if (g.length === 1) d.open = true;
      list.appendChild(d);
    });
    host.appendChild(list);
    var confirm = null;
    if (p.needsConfirm) {
      confirm = h("input", { type: "checkbox", "data-pb-ai-confirm": true });
      host.appendChild(h("label", { class: "pb-ai-confirm" }, [confirm, " Je confirme les suppressions proposées ci-dessus."]));
    }
    var apply = h("button", { type: "button", class: "btn btn-primary btn-sm", "data-pb-ai-apply": true, onclick: function () { applyCurrent(); } }, "Appliquer");
    var prev = h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-ai-preview": true, onclick: function () { togglePreview(prev); } }, "Aperçu");
    var rej = h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-ai-reject": true, onclick: function () { rejectCurrent(); } }, "Rejeter");
    if (confirm) { apply.disabled = true; confirm.addEventListener("change", function () { apply.disabled = !confirm.checked; }); }
    var acts = h("div", { class: "pb-ai-actions" }, [apply, prev, rej]);
    if (opts.extra) acts.appendChild(opts.extra);
    host.appendChild(acts);
    host.appendChild(h("p", { class: "pb-ai-hint", text: "Une seule étape d'historique : Ctrl/⌘ + Z annule toute la proposition." }));
  }
  function label(p) { return "IA : " + ((p.summary || "modification").slice(0, 60)); }
  function currentFresh() {
    if (!S.current) return false;
    if (!S.previewing && B.snapshotKey() !== S.current.key) { B.toast("La page a changé depuis la proposition : relancez la demande.", true); return false; }
    return true;
  }
  function togglePreview(btn) {
    if (!S.current) return;
    if (S.previewing) { discardIfPreviewing(); btn.textContent = "Aperçu"; return; }
    if (!currentFresh()) return;
    B.applyContent(S.current.p.content, label(S.current.p), true);
    S.previewing = true; S.previewKey = B.snapshotKey(); btn.textContent = "Arrêter l'aperçu";
    notice("Aperçu provisoire : rien n'est enregistré tant que vous n'avez pas cliqué sur « Appliquer ».", "info");
  }
  function discardIfPreviewing() {
    if (!S.previewing) return;
    S.previewing = false;
    if (B.snapshotKey() === S.previewKey) B.discardPreview(); else { B.keepPreview(); B.toast("La page a été modifiée pendant l'aperçu : utilisez Ctrl/⌘ + Z pour revenir en arrière.", true); }
    notice(S.configured === false ? "L'IA n'est pas activée sur ce serveur." : "");
    $$("[data-pb-ai-preview]").forEach(function (b) { b.textContent = "Aperçu"; });
  }
  function applyCurrent() {
    if (!S.current) return;
    if (S.previewing) { S.previewing = false; B.keepPreview(); }
    else { if (!currentFresh()) return; B.applyContent(S.current.p.content, label(S.current.p), false); }
    B.toast("Proposition appliquée. Ctrl/⌘ + Z pour annuler.");
    S.current.host.textContent = ""; S.current.host.appendChild(h("p", { class: "pb-ai-ok", role: "status", text: "✔ Appliqué : " + (S.current.p.summary || "modification") }));
    S.current = null; notice("");
    if (S.annot) stopAnnot();
    if (S.report) setTimeout(function () { if (S.tab === "adapt") analyse(true); }, 400);
  }
  function rejectCurrent() {
    discardIfPreviewing();
    if (S.current) { S.current.host.textContent = ""; S.current.host.appendChild(h("p", { class: "pb-ai-muted", text: "Proposition rejetée : la page n'a pas changé." })); }
    S.current = null;
  }

  // ---------- Onglet Créer ----------
  var IDEAS = ["Crée une page d'accueil pour une formation en ligne", "Ajoute une section de questions fréquentes", "Rends cette section plus aérée et plus lisible", "Ajoute un appel à l'action clair en bas de page"];
  function buildCreate() {
    var pane = el.panes.create;
    el.scope = h("select", { class: "pb-ai-select", "aria-label": "Périmètre de la demande" }, [h("option", { value: "page", text: "Toute la page" }), h("option", { value: "selection", text: "Élément sélectionné seulement" })]);
    el.ask = h("textarea", { rows: 4, maxlength: 4000, placeholder: "Décrivez ce que vous voulez : créer une page, une section, changer un style, un texte…", "aria-label": "Demande à l'IA" });
    el.sendCreate = h("button", { type: "button", class: "btn btn-primary btn-sm", "data-pb-ai-send": true, onclick: function () { send("create"); } }, [ico("send", 14), " Envoyer"]);
    el.createOut = h("div", { class: "pb-ai-out", "aria-live": "polite" });
    el.ask.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send("create"); } });
    pane.appendChild(h("div", { class: "pb-ai-form" }, [
      h("div", { class: "pb-ai-ideas" }, IDEAS.map(function (t) { return h("button", { type: "button", class: "pb-ai-chip", onclick: function () { el.ask.value = t; el.ask.focus(); }, text: t }); })),
      el.ask, h("div", { class: "pb-ai-formrow" }, [el.scope, el.sendCreate]),
    ]));
    pane.appendChild(el.createOut);
  }
  function send(mode) {
    var ta = mode === "fix" ? el.fixAsk : el.ask, text = (ta.value || "").trim();
    if (!text) { B.toast("Décrivez d'abord ce que vous voulez obtenir.", true); return; }
    var payload = { instruction: text, mode: mode === "create" ? (B.sections().length ? "modify" : "create") : "fix" };
    if (mode === "create") {
      payload.scope = el.scope.value;
      if (payload.scope === "selection" && !B.selection().length) { B.toast("Sélectionnez d'abord un élément dans la page.", true); return; }
      if (!B.sections().length) payload.mode = "create";
    } else {
      var a = annotationPayload(); payload.annotations = a.annotations; payload.measures = a.measures; payload.scope = "page";
    }
    ask(payload, mode === "create" ? el.createOut : el.fixOut, mode === "create" ? el.sendCreate : el.sendFix);
  }

  // ---------- Onglet Adapter : mesures réelles + règles ----------
  function buildAdapt() {
    var pane = el.panes.adapt;
    el.analyse = h("button", { type: "button", class: "btn btn-primary btn-sm", "data-pb-ai-analyse": true, onclick: function () { analyse(false); } }, [ico("smartphone", 14), " Analyser tablette et mobile"]);
    el.adaptOut = h("div", { class: "pb-ai-out", "aria-live": "polite" });
    pane.appendChild(h("p", { class: "pb-ai-lead", text: "L'éditeur mesure le rendu réel à 820 px et à 390 px, puis propose des corrections ciblées. Elles s'écrivent uniquement dans l'écran concerné : l'ordinateur n'est jamais modifié." }));
    pane.appendChild(h("div", { class: "pb-ai-formrow" }, [el.analyse]));
    pane.appendChild(el.adaptOut);
  }
  function pxOf(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  function nodeIdOf(n) { return n.dataset.nodeId || n.dataset.sectionId || ""; }
  // Mesure le rendu de l'écran affiché (le cadre du canevas a la largeur de l'écran)
  function measure(bp) {
    var doc = B.frame().contentDocument, win = doc.defaultView, vw = BP_W[bp], out = [], flagged = {}, over = {};
    var nodes = $$("[data-node-id],[data-section-id]", doc);
    var hasOverAbove = function (n) { for (var p = n.parentElement; p; p = p.parentElement) if (over[nodeIdOf(p)]) return true; return false; };
    var hasOverBelow = function (n) { return Object.keys(over).some(function (id) { var d = B.canvasEl(id); return d && d !== n && n.contains(d); }); };
    var add = function (id, kind, detail, value) { out.push({ id: id, kind: kind, bp: bp, detail: detail, value: value }); flagged[id] = true; };
    // 1) débordements : seul l'élément le plus haut qui dépasse est signalé (ses enfants en sont la conséquence)
    nodes.forEach(function (n) {
      var id = nodeIdOf(n), it = B.byId(id); if (!it) return;
      var r = n.getBoundingClientRect(), cs = win.getComputedStyle(n);
      if (cs.display === "none" || r.width === 0 || cs.position === "fixed" || r.right <= vw + 2) return;
      over[id] = true;
      if (hasOverAbove(n)) { delete over[id]; over[id] = true; return; }
      var own = (it.styles && it.styles[bp]) || {}, base = (it.styles && it.styles.desktop) || {};
      add(id, it.type === "image" ? "image" : pxOf(own.width || base.width) > vw ? "fixedWidth" : "overflow", "dépasse de " + Math.round(r.right - vw) + " px à droite de l'écran");
    });
    // 2) lisibilité, zones tactiles, colonnes, marges
    nodes.forEach(function (n) {
      var id = nodeIdOf(n), it = B.byId(id); if (!it || flagged[id]) return;
      var r = n.getBoundingClientRect(), cs = win.getComputedStyle(n);
      if (cs.display === "none" || r.width === 0) return;
      var isText = ["heading", "text", "button", "quote"].indexOf(it.type) >= 0, fs = pxOf(cs.fontSize);
      if (isText && fs && fs < 12) { add(id, "smallText", "texte de " + fs + " px", cs.fontSize); return; }
      if (it.type === "heading" && fs > (bp === "mobile" ? 40 : 56)) { add(id, "bigText", "titre de " + Math.round(fs) + " px", cs.fontSize); return; }
      if ((it.type === "button" || (it.props && it.props.link)) && r.height < 40) { add(id, "tapTarget", "zone de " + Math.round(r.height) + " px de haut", ""); return; }
      if (cs.display === "grid") {
        var cols = cs.gridTemplateColumns.split(" ").filter(Boolean).length;
        if (cols > (bp === "mobile" ? 1 : 3)) { add(id, "columns", cols + " colonnes sur " + vw + " px", String(cols)); return; }
      } else if (cs.display === "flex" && cs.flexDirection.indexOf("row") === 0 && n.children.length >= 3 && bp === "mobile") {
        var narrow = $$(":scope > *", n).filter(function (c) { return c.getBoundingClientRect().width < 110; }).length;
        if (narrow >= 2) { add(id, "columns", n.children.length + " blocs côte à côte sur " + vw + " px", ""); return; }
      }
      if (cs.display === "flex" && cs.flexWrap === "nowrap" && n.scrollWidth > n.clientWidth + 2 && !hasOverBelow(n)) { add(id, "noWrap", "contenu plus large que son bloc", ""); return; }
      if (it.type !== "layout" && pxOf(cs.paddingLeft) + pxOf(cs.paddingRight) > vw * 0.2) add(id, "bigPadding", "marges intérieures de " + Math.round(pxOf(cs.paddingLeft) + pxOf(cs.paddingRight)) + " px au total", "");
    });
    return out;
  }
  function settle() { return new Promise(function (ok) { requestAnimationFrame(function () { requestAnimationFrame(function () { setTimeout(ok, 260); }); }); }); }
  function analyse(quiet) {
    if (S.busy) return;
    discardIfPreviewing();
    var host = el.adaptOut, back = B.device();
    S.busy = true; el.analyse.disabled = true;
    if (!quiet) { host.textContent = ""; host.appendChild(h("div", { class: "pb-ai-busy" }, [h("span", { class: "pb-ai-spin" }), h("span", { text: "Mesure du rendu sur tablette et mobile…" })])); }
    var issues = [];
    B.saveNow().then(function () { return seq(["tablet", "mobile"], function (bp) { B.setDevice(bp); return settle().then(function () { issues = issues.concat(measure(bp)); }); }); })
      .then(function () { B.setDevice(back); return settle(); })
      .then(function () { return B.api("POST", B.base + "/ia/responsive", { revision: B.revision(), issues: issues }); })
      .then(function (r) { S.report = { r: r, issues: issues, key: B.snapshotKey() }; renderReport(host, r, issues); })
      .catch(function (e) { B.setDevice(back); host.textContent = ""; host.appendChild(h("p", { class: "pb-ai-error", role: "alert", text: e.message })); })
      .then(function () { S.busy = false; el.analyse.disabled = false; });
  }
  function seq(list, fn) { return list.reduce(function (p, x) { return p.then(function () { return fn(x); }); }, Promise.resolve()); }
  function renderReport(host, r, issues) {
    host.textContent = "";
    var rows = r.report || [];
    host.appendChild(h("p", { class: "pb-ai-summary", text: !rows.length ? "Aucun problème détecté sur la tablette ni sur le mobile." : rows.length + " constat(s) sur les écrans mesurés." }));
    if (!rows.length) return;
    var checks = [];
    var list = h("div", { class: "pb-ai-report" });
    rows.forEach(function (row) {
      var can = row.status === "correction proposée";
      var cb = h("input", { type: "checkbox", checked: can, disabled: !can, "aria-label": "Appliquer cette correction" });
      checks.push({ cb: cb, row: row });
      list.appendChild(h("label", { class: "pb-ai-rep" + (can ? "" : " is-muted") }, [cb, h("span", {}, [
        h("strong", { text: row.name || "Élément" }), h("span", { class: "pb-ai-count", text: row.label + " · " + BP_NAME[row.bp] }),
        h("small", { text: (row.cause ? row.cause + ". " : "") + (can ? "Correction : " : "") + row.reason }),
      ])]));
    });
    host.appendChild(list);
    var out = h("div", { class: "pb-ai-out" });
    var go = h("button", { type: "button", class: "btn btn-primary btn-sm", "data-pb-ai-fixsel": true, onclick: function () {
      var chosen = checks.filter(function (c) { return c.cb.checked; }).map(function (c) { return c.row; });
      if (!chosen.length) { B.toast("Cochez au moins une correction.", true); return; }
      var wanted = issues.filter(function (i) { return chosen.some(function (c) { return c.id === i.id && c.kind === i.kind && c.bp === i.bp; }); });
      B.api("POST", B.base + "/ia/responsive", { revision: B.revision(), issues: wanted }).then(function (p) {
        S.current = { p: p, key: B.snapshotKey(), host: out }; renderProposal(out, p);
      }, function (e) { B.toast(e.message, true); });
    } }, "Préparer les corrections cochées");
    host.appendChild(h("div", { class: "pb-ai-actions" }, [go]));
    host.appendChild(out);
  }

  // ---------- Onglet Corriger : annotations ----------
  var TOOLS = [["pen", "Crayon", "edit"], ["arrow", "Flèche", "annotArrow"], ["circle", "Cercle", "annotCircle"], ["rect", "Rectangle", "annotRect"], ["text", "Texte", "type"], ["eraser", "Gomme", "eraser"]];
  function buildFix() {
    var pane = el.panes.fix;
    el.fixAsk = h("textarea", { rows: 3, maxlength: 4000, placeholder: "Que faut-il corriger ? Ex. : « ce texte est collé au bord », « ces deux boutons ne sont pas alignés »", "aria-label": "Description du problème" });
    el.sendFix = h("button", { type: "button", class: "btn btn-primary btn-sm", "data-pb-ai-send-fix": true, onclick: function () { send("fix"); } }, [ico("send", 14), " Diagnostiquer et corriger"]);
    el.annotBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", "data-pb-ai-annot": true, onclick: function () { S.annot ? stopAnnot() : startAnnot(); } }, [ico("edit", 14), " Annoter la page"]);
    el.annotBar = h("div", { class: "pb-ai-tools", role: "toolbar", "aria-label": "Outils d'annotation", hidden: true });
    TOOLS.forEach(function (t) { el.annotBar.appendChild(h("button", { type: "button", class: "pb-icon-btn", "data-tool": t[0], "data-tip": t[1], "aria-label": t[1], "aria-pressed": "false", onclick: function () { setTool(t[0]); } }, [ico(t[2], 15)])); });
    el.annotBar.appendChild(h("button", { type: "button", class: "pb-icon-btn", "data-pb-ai-undo": true, "data-tip": "Annuler le dernier tracé", "aria-label": "Annuler le dernier tracé", onclick: function () { if (S.annot) { S.annot.shapes.pop(); drawAnnot(); } } }, [ico("undo", 15)]));
    el.annotBar.appendChild(h("button", { type: "button", class: "pb-icon-btn", "data-pb-ai-clear": true, "data-tip": "Tout effacer", "aria-label": "Tout effacer", onclick: function () { if (S.annot) { S.annot.shapes = []; drawAnnot(); } } }, [ico("trash", 15)]));
    el.fixOut = h("div", { class: "pb-ai-out", "aria-live": "polite" });
    pane.appendChild(h("p", { class: "pb-ai-lead", text: "Entourez, soulignez ou pointez ce qui ne va pas directement sur la page. L'IA reçoit vos annotations et les mesures réelles des éléments concernés, cherche la vraie cause, puis propose une correction ciblée. Les annotations ne sont jamais enregistrées dans la page." }));
    pane.appendChild(h("div", { class: "pb-ai-formrow" }, [el.annotBtn]));
    pane.appendChild(el.annotBar); pane.appendChild(el.fixAsk);
    pane.appendChild(h("div", { class: "pb-ai-formrow" }, [el.sendFix]));
    pane.appendChild(el.fixOut);
  }
  function setTool(t) { if (!S.annot) return; S.annot.tool = t; $$("[data-tool]", el.annotBar).forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.tool === t)); }); S.annot.canvas.style.cursor = t === "text" ? "text" : "crosshair"; }
  function frameBox() {
    var f = B.frame(), r = f.getBoundingClientRect();
    return { left: r.left, top: r.top, width: r.width, height: r.height, k: r.width / (f.clientWidth || r.width || 1) };
  }
  function startAnnot() {
    if (S.annot) return;
    if (S.mode === "dialog") { S.restoreMode = true; setMode("panel", true); }
    var c = h("canvas", { class: "pb-ai-annot", "data-pb-ai-canvas": true, "aria-label": "Zone d'annotation sur la page" });
    document.body.appendChild(c);
    S.annot = { canvas: c, shapes: [], tool: "pen", cur: null };
    var place = function () { var b = frameBox(); c.style.left = b.left + "px"; c.style.top = b.top + "px"; c.style.width = b.width + "px"; c.style.height = b.height + "px"; c.width = Math.round(b.width); c.height = Math.round(b.height); drawAnnot(); };
    S.annot.place = place; place();
    window.addEventListener("resize", place);
    var pt = function (e) { var b = frameBox(); return { x: (e.clientX - b.left) / b.k, y: (e.clientY - b.top) / b.k }; };
    c.addEventListener("wheel", function (e) { e.preventDefault(); }, { passive: false });
    c.addEventListener("pointerdown", function (e) {
      var a = S.annot; if (!a || e.button !== 0) return;
      var p = pt(e);
      if (a.tool === "text") { askText(e, p); return; }
      if (a.tool === "eraser") { a.erasing = true; erase(p); c.setPointerCapture(e.pointerId); return; }
      a.cur = { kind: a.tool, pts: [p] };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointermove", function (e) {
      var a = S.annot; if (!a) return; var p = pt(e);
      if (a.erasing) { erase(p); return; }
      if (!a.cur) return;
      if (a.cur.kind === "pen") a.cur.pts.push(p); else a.cur.pts[1] = p;
      drawAnnot();
    });
    var end = function () {
      var a = S.annot; if (!a) return; a.erasing = false;
      if (a.cur) { var s = a.cur; a.cur = null; var big = s.pts.length > 1 && (s.kind === "pen" || Math.abs(s.pts[1].x - s.pts[0].x) + Math.abs(s.pts[1].y - s.pts[0].y) > 6); if (big && a.shapes.length < 30) a.shapes.push(s); drawAnnot(); }
    };
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
    el.annotBar.hidden = false; el.annotBtn.textContent = ""; el.annotBtn.appendChild(ico("check", 14)); el.annotBtn.appendChild(document.createTextNode(" Terminer l'annotation"));
    setTool("pen");
    notice("Annotation : faites défiler la page AVANT de dessiner (le défilement est bloqué pendant le tracé). Échap pour quitter.", "info");
  }
  function stopAnnot() {
    var a = S.annot; if (!a) return;
    window.removeEventListener("resize", a.place);
    a.canvas.remove(); S.annot = null;
    var tb = $(".pb-ai-textbox"); if (tb) tb.remove();
    el.annotBar.hidden = true; el.annotBtn.textContent = ""; el.annotBtn.appendChild(ico("edit", 14)); el.annotBtn.appendChild(document.createTextNode(" Annoter la page"));
    notice(S.configured === false ? "L'IA n'est pas activée sur ce serveur." : "");
    if (S.restoreMode) { S.restoreMode = false; setMode("dialog", true); }
  }
  function askText(e, p) {
    var old = $(".pb-ai-textbox"); if (old) old.remove();
    var inp = h("input", { type: "text", class: "pb-ai-textbox", maxlength: 120, placeholder: "Texte puis Entrée", "aria-label": "Texte de l'annotation" });
    inp.style.left = e.clientX + "px"; inp.style.top = e.clientY + "px";
    var over = false;
    var done = function (ok) { if (over) return; over = true; var v = inp.value.trim(); if (inp.parentNode) inp.remove(); if (ok && v && S.annot) { S.annot.shapes.push({ kind: "text", pts: [p], text: v }); drawAnnot(); } };
    inp.addEventListener("keydown", function (k) { if (k.key === "Enter") { k.preventDefault(); done(true); } else if (k.key === "Escape") { k.stopPropagation(); done(false); } });
    inp.addEventListener("blur", function () { done(true); });
    document.body.appendChild(inp); setTimeout(function () { inp.focus(); }, 0);
  }
  function dist(p, a, b) { var dx = b.x - a.x, dy = b.y - a.y, l = dx * dx + dy * dy, t = l ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l)) : 0; return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)); }
  function near(s, p) {
    var r = 10 / (frameBox().k || 1);
    if (s.kind === "pen") return s.pts.some(function (q, i) { return i && dist(p, s.pts[i - 1], q) < r; });
    if (s.kind === "arrow") return dist(p, s.pts[0], s.pts[1]) < r;
    if (s.kind === "text") return Math.abs(p.x - s.pts[0].x) < 60 && Math.abs(p.y - s.pts[0].y) < 14;
    var x1 = Math.min(s.pts[0].x, s.pts[1].x), x2 = Math.max(s.pts[0].x, s.pts[1].x), y1 = Math.min(s.pts[0].y, s.pts[1].y), y2 = Math.max(s.pts[0].y, s.pts[1].y);
    var inOuter = p.x > x1 - r && p.x < x2 + r && p.y > y1 - r && p.y < y2 + r, inInner = p.x > x1 + r && p.x < x2 - r && p.y > y1 + r && p.y < y2 - r;
    return inOuter && !inInner;
  }
  function erase(p) { var a = S.annot; var n = a.shapes.length; a.shapes = a.shapes.filter(function (s) { return !near(s, p); }); if (a.shapes.length !== n) drawAnnot(); }
  function drawAnnot() {
    var a = S.annot; if (!a) return; var c = a.canvas, g = c.getContext("2d"), b = frameBox(), k = b.k;
    g.clearRect(0, 0, c.width, c.height); g.lineWidth = 3; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#e11d48"; g.fillStyle = "#e11d48"; g.font = "600 15px system-ui, sans-serif";
    a.shapes.concat(a.cur ? [a.cur] : []).forEach(function (s) {
      var P = s.pts.map(function (q) { return { x: q.x * k, y: q.y * k }; });
      g.beginPath();
      if (s.kind === "pen") { P.forEach(function (q, i) { i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); }); g.stroke(); }
      else if (s.kind === "rect" && P[1]) { g.strokeRect(P[0].x, P[0].y, P[1].x - P[0].x, P[1].y - P[0].y); }
      else if (s.kind === "circle" && P[1]) { g.ellipse((P[0].x + P[1].x) / 2, (P[0].y + P[1].y) / 2, Math.abs(P[1].x - P[0].x) / 2, Math.abs(P[1].y - P[0].y) / 2, 0, 0, Math.PI * 2); g.stroke(); }
      else if (s.kind === "arrow" && P[1]) {
        g.moveTo(P[0].x, P[0].y); g.lineTo(P[1].x, P[1].y); g.stroke();
        var ang = Math.atan2(P[1].y - P[0].y, P[1].x - P[0].x); g.beginPath(); g.moveTo(P[1].x, P[1].y);
        g.lineTo(P[1].x - 14 * Math.cos(ang - 0.45), P[1].y - 14 * Math.sin(ang - 0.45)); g.lineTo(P[1].x - 14 * Math.cos(ang + 0.45), P[1].y - 14 * Math.sin(ang + 0.45)); g.closePath(); g.fill();
      } else if (s.kind === "text") { g.fillText(s.text, P[0].x, P[0].y); }
    });
  }
  // Annotation → éléments réels recouverts (du plus au moins probable)
  function samples(s) {
    var p = s.pts, out = [], i, j;
    if (s.kind === "pen") { for (i = 0; i < p.length; i += Math.max(1, Math.floor(p.length / 12))) out.push(p[i]); return out; }
    if (s.kind === "text") return [p[0], { x: p[0].x, y: p[0].y - 10 }];
    if (s.kind === "arrow") return [p[1], p[1], p[0]];
    var x1 = Math.min(p[0].x, p[1].x), x2 = Math.max(p[0].x, p[1].x), y1 = Math.min(p[0].y, p[1].y), y2 = Math.max(p[0].y, p[1].y);
    for (i = 0; i < 5; i++) for (j = 0; j < 5; j++) {
      var x = x1 + (x2 - x1) * (i + 0.5) / 5, y = y1 + (y2 - y1) * (j + 0.5) / 5;
      if (s.kind === "circle" && Math.pow((x - (x1 + x2) / 2) / ((x2 - x1) / 2 || 1), 2) + Math.pow((y - (y1 + y2) / 2) / ((y2 - y1) / 2 || 1), 2) > 1) continue;
      out.push({ x: x, y: y });
    }
    return out;
  }
  function elementsAt(s) {
    var doc = B.frame().contentDocument, count = {};
    samples(s).forEach(function (q) {
      var hit = doc.elementsFromPoint(q.x, q.y).filter(function (n) { return n.closest && n.closest("[data-node-id],[data-section-id]"); })[0];
      var n = hit && hit.closest("[data-node-id],[data-section-id]"); if (!n) return;
      var id = nodeIdOf(n); if (id && B.byId(id)) count[id] = (count[id] || 0) + 1;
    });
    return Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 4);
  }
  var MEASURED = ["display", "position", "width", "height", "marginTop", "marginBottom", "marginLeft", "marginRight", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight", "fontSize", "textAlign", "flexDirection", "justifyContent", "alignItems", "gap", "overflow"];
  function annotationPayload() {
    var doc = B.frame().contentDocument, win = doc.defaultView, ids = {}, annotations = [];
    var shapes = S.annot ? S.annot.shapes : [];
    shapes.forEach(function (s) { var e = elementsAt(s); e.forEach(function (id) { ids[id] = 1; }); annotations.push({ kind: s.kind, text: s.text || "", elements: e }); });
    var selected = B.selection()[0]; if (selected) ids[selected] = 1;
    var measures = Object.keys(ids).slice(0, 40).map(function (id) {
      var n = B.canvasEl(id), it = B.byId(id), cs = n ? win.getComputedStyle(n) : null, r = n ? B.pageRect(n) : null;
      var computed = cs ? MEASURED.map(function (k) { return k + ":" + cs[k]; }).join(";") : "";
      var own = (it && it.styles && it.styles[B.device()]) || (it && it.styles && it.styles.desktop) || {};
      return { id: id, type: it ? it.type : "", rect: r ? Math.round(r.left) + "," + Math.round(r.top) + "," + Math.round(r.width) + "x" + Math.round(r.height) : "", computed: computed + (Object.keys(own).length ? " | réglages:" + JSON.stringify(own) : "") };
    });
    return { annotations: annotations, measures: measures };
  }

  // ---------- Démarrage ----------
  function init() {
    el.btn = $("[data-pb-ai]");
    if (!el.btn) return;
    S.mode = pref("mode", "dialog") === "panel" ? "panel" : "dialog";
    build();
    var t = pref("tab", "create"); setTab(["create", "adapt", "fix"].indexOf(t) >= 0 ? t : "create");
    updateModeBtn();
    if (!B.canWrite()) { el.btn.disabled = true; el.btn.setAttribute("data-tip", "IA Kolakisa : réservée aux personnes qui peuvent modifier la page"); return; }
    el.btn.addEventListener("click", function () { if (el.dlg.open) el.dlg.close(); else open(); });
  }
  window.pbAi = { attach: function (bridge) { B = bridge; init(); }, state: S };
})();

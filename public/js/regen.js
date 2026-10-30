/* Modifier avec l'IA et historique (programme 21.9). Interface SEULEMENT : chaque action appelle une route serveur ; les protections, conflits et contrôles de droits sont revérifiés côté serveur. */
(function () {
  "use strict";
  var root = document.getElementById("rg"); if (!root) return;
  var BASE = root.getAttribute("data-base") + "/api", CAN_WRITE = root.getAttribute("data-write") === "1", CAN_RESTORE = root.getAttribute("data-restore") === "1";
  var $ = function (s) { return document.querySelector(s); }, S = { offset: 0, pages: [], op: null };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function say(msg, k) { var el = $("#rg-status"); el.textContent = msg || ""; if (k) el.setAttribute("data-k", k); else el.removeAttribute("data-k"); }
  function api(method, path, body) {
    return fetch(BASE + path, { method: method, credentials: "same-origin", headers: Object.assign({ Accept: "application/json" }, body !== undefined ? { "Content-Type": "application/json" } : {}), body: body !== undefined ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse inattendue du serveur." }; }).then(function (j) { j.status = r.status; return j; }); }, function () { return { ok: false, error: "Connexion perdue : rien n'a été modifié. Réessayez.", status: 0 }; });
  }
  // ---------- onglets ----------
  function tab(name) { ["edit", "hist", "prot"].forEach(function (t) { var on = t === name; $("#rg-t-" + t).setAttribute("aria-selected", String(on)); $("#rg-t-" + t).tabIndex = on ? 0 : -1; $("#rg-p-" + t).hidden = !on; }); if (name === "hist") loadHistory(true); if (name === "prot") loadProt(); }
  root.querySelector(".rg-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) tab(b.getAttribute("data-tab")); });
  root.querySelector(".rg-tabs").addEventListener("keydown", function (e) { var order = ["edit", "hist", "prot"], cur = order.indexOf(document.activeElement && document.activeElement.getAttribute("data-tab")); if (cur < 0) return; if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = order[(cur + (e.key === "ArrowRight" ? 1 : order.length - 1)) % order.length]; tab(n); $("#rg-t-" + n).focus(); } });
  // ---------- sélecteurs (identifiants stables) ----------
  function pagesFromSite() { return api("GET", "/pages").then(function (j) { return j.ok ? j.pages : []; }); }
  function fillSelects(pages) { ["#rg-page", "#rg-prot-page"].forEach(function (sel) { var el = $(sel), cur = el.value; el.innerHTML = '<option value="">—</option>' + pages.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + "</option>"; }).join(""); el.value = cur; }); }
  $("#rg-page").addEventListener("change", function () { var id = this.value; $("#rg-section").innerHTML = '<option value="">—</option>'; $("#rg-field").innerHTML = '<option value="">—</option>'; if (!id) return; api("GET", "/protections?page=" + id).then(function (j) { if (!j.ok) return; S.elements = j.elements; $("#rg-section").innerHTML = '<option value="">—</option>' + j.elements.map(function (e) { return '<option value="' + esc(e.ref) + '">' + esc(e.label) + "</option>"; }).join(""); }); });
  $("#rg-section").addEventListener("change", function () { var sec = (S.elements || []).filter(function (e) { return e.ref === $("#rg-section").value; })[0]; $("#rg-field").innerHTML = '<option value="">—</option>' + (sec ? sec.fields.map(function (f) { return '<option value="' + esc(f.ref) + '">' + esc(f.label) + "</option>"; }).join("") : ""); });
  // ---------- proposition ----------
  var LEVEL = { low: ["ok", "Impact faible"], medium: ["warn", "Impact moyen"], high: ["err", "Impact élevé : confirmation requise"] };
  function renderProposal(j) {
    var box = $("#rg-proposal");
    if (j.status === "clarification") { box.innerHTML = '<div class="rg-card"><h3>J\'ai besoin d\'une précision</h3>' + j.questions.map(function (q) { return "<p>" + esc(q.question) + (q.candidates ? "<br>" + q.candidates.map(function (c) { return '<span class="rg-chip">' + esc(c.label) + "</span>"; }).join("") : "") + "</p>"; }).join("") + '<p class="sw-muted">Aucune modification n\'a été préparée.</p></div>'; return; }
    if (j.status === "unsupported" || j.status === "advice") { box.innerHTML = '<div class="rg-card"><p>' + esc(j.message) + "</p></div>"; return; }
    var imp = j.impact, lv = LEVEL[imp.level];
    S.op = j.opId;
    box.innerHTML = '<div class="rg-card"><h3>Proposition n° ' + j.opId + ' <span class="rg-chip" data-k="' + lv[0] + '">' + lv[1] + '</span><span class="rg-chip">Périmètre : ' + esc(j.plan.scope) + "</span></h3><p>" + esc(j.plan.why) + "</p>" + (j.plan.escalation ? '<p class="rg-chip" data-k="warn">' + esc(j.plan.escalation) + "</p>" : "") +
      j.preview.changes.map(function (c) { return "<div><strong>" + esc(c.label) + '</strong> <span class="rg-chip" data-k="ai">' + esc(c.category) + '</span><div class="rg-ba"><div class="rg-b"><small>Avant</small><br>' + esc(c.before) + '</div><div class="rg-a"><small>Après</small><br>' + esc(c.after) + "</div></div></div>"; }).join("") +
      "<p><strong>Concerné :</strong> " + (imp.direct.map(function (d) { return esc(d.label); }).join(" · ") || "—") + (imp.indirect.length ? "<br><strong>Indirectement :</strong> " + imp.indirect.map(function (d) { return esc(d.label); }).join(" · ") : "") + (imp.pages.length ? "<br><strong>Pages :</strong> " + imp.pages.map(function (p) { return esc(p.name); }).join(", ") : "") + "</p>" +
      (imp.protectedHit.length ? '<p class="rg-chip" data-k="warn">Éléments protégés : ' + imp.protectedHit.map(function (p) { return esc(p.label) + " (" + esc(p.state) + ")"; }).join(", ") + "</p>" : "") +
      "<p class=\"sw-muted\">Préservé : " + j.preview.preserved.map(esc).join(" · ") + ". " + esc(j.usage.note) + '</p><div class="rg-row">' + (CAN_WRITE ? '<button class="btn btn-primary" data-act="apply" data-confirm="' + (j.plan.requiresConfirmation ? 1 : 0) + '">' + (j.plan.requiresConfirmation ? "Confirmer et appliquer au brouillon" : "Appliquer au brouillon") + '</button><button class="btn" data-act="reject">Refuser</button>' : "") + "</div></div>";
  }
  $("#rg-form").addEventListener("submit", function (e) {
    e.preventDefault(); var btn = e.target.querySelector('button[type="submit"]'); btn.disabled = true; say("Analyse de la demande…");
    api("POST", "/demander", { text: $("#rg-text").value, selection: { pageId: Number($("#rg-page").value) || null, sectionId: $("#rg-section").value || null, fieldKey: $("#rg-field").value || null } }).then(function (j) { btn.disabled = !CAN_WRITE; if (!j.ok) { say(j.error, "error"); return; } say(""); renderProposal(j); });
  });
  $("#rg-proposal").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || !S.op) return; var act = b.getAttribute("data-act"); b.disabled = true;
    if (act === "reject") return api("POST", "/operations/" + S.op + "/refuser", {}).then(function (j) { say(j.ok ? "Proposition refusée : rien n'a été modifié." : j.error, j.ok ? "ok" : "error"); if (j.ok) $("#rg-proposal").innerHTML = ""; });
    send(false, []);
    function send(use, allow) { api("POST", "/operations/" + S.op + "/appliquer", { confirm: b.getAttribute("data-confirm") === "1", allow: allow, resolve: use ? "use_ai" : null }).then(function (j) {
      if (j.ok) { say(j.note || "Brouillon mis à jour.", "ok"); $("#rg-proposal").innerHTML = ""; return; }
      b.disabled = false;
      if (j.code === "needs_confirmation" && j.detail && confirm(j.error + "\n\nRemplacer quand même ?")) return send(use, j.detail.map(function (d) { return String(d.ref); }));
      if (j.code === "conflict" && j.detail && j.detail.resolutions && confirm(j.error + "\n\nOK : appliquer quand même la proposition de l'IA (la version actuelle reste dans l'historique).\nAnnuler : conserver la version actuelle.")) return send(true, allow);
      say(j.error, "error"); }); }
  });
  $("#rg-undo").addEventListener("click", function () { op("/annuler", "Opération annulée (l'état d'avant est conservé dans l'historique)."); });
  $("#rg-redo").addEventListener("click", function () { op("/retablir", "Opération rétablie."); });
  function op(path, okMsg, extra) { api("POST", path, extra || {}).then(function (j) { if (j.ok) { say(okMsg, "ok"); return; } if (j.code === "conflict" && j.detail && j.detail.resolutions && confirm(j.error)) return op(path, okMsg, { restoreAnyway: true }); say(j.error, "error"); }); }
  // ---------- historique ----------
  function loadHistory(reset) {
    if (reset) S.offset = 0;
    api("GET", "/historique?limite=15&debut=" + S.offset + ($("#rg-f-actor").value ? "&acteur=" + $("#rg-f-actor").value : "") + ($("#rg-f-status").value ? "&statut=" + $("#rg-f-status").value : "")).then(function (j) {
      if (!j.ok) { say(j.error, "error"); return; }
      var html = j.items.map(function (o) { return '<div class="rg-card"><h3>' + esc(o.request || o.kind) + ' <span class="rg-chip" data-k="' + (o.actor === "ai" ? "ai" : "") + '">' + (o.actor === "ai" ? "IA" : "Personne") + '</span><span class="rg-chip" data-k="' + (o.status === "applied" ? "ok" : o.status === "proposed" ? "warn" : "") + '">' + esc(o.status) + '</span></h3><p class="sw-muted">' + esc(o.createdAt) + " · " + esc(o.kind) + (o.changeCount ? " · " + o.changeCount + " changement(s)" : "") + (o.aiCalls ? " · " + o.aiCalls + " appel(s) IA (coût non communiqué)" : "") + "</p>" + (o.changes[0] ? '<div class="rg-ba"><div class="rg-b">' + esc(o.changes[0].before) + '</div><div class="rg-a">' + esc(o.changes[0].after) + "</div></div>" : "") + "</div>"; }).join("") || '<p class="sw-muted">Aucune opération.</p>';
      var box = $("#rg-ops"); box.innerHTML = reset ? html : box.innerHTML + html; S.offset += j.items.length; $("#rg-more").hidden = S.offset >= j.total;
    });
    api("GET", "/versions?limite=10").then(function (j) { if (!j.ok) return; $("#rg-snaps").innerHTML = '<table class="rg-table"><thead><tr><th scope="col">Version</th><th scope="col">Niveau</th><th scope="col">Date</th><th scope="col"></th></tr></thead><tbody>' + (j.items.map(function (s) { return "<tr><td>" + esc(s.label) + "</td><td>" + esc(s.level) + "</td><td>" + esc(s.createdAt) + '</td><td class="rg-row"><button class="btn btn-sm" data-snap="cmp" data-id="' + s.id + '" data-level="' + esc(s.level) + '">Comparer à l\'actuel</button>' + (CAN_RESTORE ? '<button class="btn btn-sm" data-snap="rst" data-id="' + s.id + '">Restaurer</button>' : "") + "</td></tr>"; }).join("") || '<tr><td colspan="4" class="sw-muted">Aucune version enregistrée.</td></tr>') + "</tbody></table><p class=\"sw-muted\">" + j.stats.snapshots + " version(s), " + Math.round(j.stats.bytes / 1024) + " Ko. Aucune version n'est supprimée automatiquement.</p>"; });
    api("GET", "/consommation").then(function (j) { if (j.ok) $("#rg-usage").textContent = j.usage.aiCalls + " appel(s) IA sur ce site (coût réel non communiqué)"; });
  }
  $("#rg-more").addEventListener("click", function () { loadHistory(false); });
  $("#rg-f-actor").addEventListener("change", function () { loadHistory(true); }); $("#rg-f-status").addEventListener("change", function () { loadHistory(true); });
  $("#rg-snap").addEventListener("click", function () { api("POST", "/versions", { level: "site", label: "Version du site" }).then(function (j) { say(j.ok ? "Version du site enregistrée." : j.error, j.ok ? "ok" : "error"); if (j.ok) loadHistory(true); }); });
  $("#rg-snaps").addEventListener("click", function (e) {
    var b = e.target.closest("[data-snap]"); if (!b) return; var id = b.getAttribute("data-id");
    if (b.getAttribute("data-snap") === "cmp") return api("GET", "/comparer?a=" + id + "&vs=actuel").then(function (j) { var c = j.comparison; $("#rg-compare").innerHTML = !j.ok ? '<p class="rg-chip" data-k="err">' + esc(j.error) + "</p>" : '<div class="rg-card"><h3>Différences avec l\'état actuel</h3>' + (c.identical ? '<p class="sw-muted">Identique : aucune différence.</p>' : "<p>" + c.summary.total + " différence(s) (" + c.summary.content + " contenu, " + c.summary.style + " style, " + c.summary.media + " média, " + c.summary.structure + " structure)</p>" + c.changes.slice(0, 40).map(function (d) { return "<div><span class=\"rg-chip\">" + esc(d.kind) + '</span><span class="rg-chip" data-k="ai">' + esc(d.category) + "</span> " + esc(d.path) + '<div class="rg-ba"><div class="rg-b">' + esc(d.before) + '</div><div class="rg-a">' + esc(d.after) + "</div></div></div>"; }).join("")) + "</div>"; });
    if (b.getAttribute("data-snap") === "rst" && confirm("Restaurer cette version dans le brouillon ? L'état actuel est conservé dans l'historique (vous pourrez l'annuler).")) restoreSnap(Number(id), false);
  });
  function restoreSnap(id, any) { api("POST", "/restaurer", { snapshotId: id, restoreAnyway: any }).then(function (j) { if (j.ok) { say("Version restaurée dans le brouillon" + (j.kept && j.kept.length ? " (" + j.kept.length + " élément(s) protégé(s) conservé(s))" : "") + ".", "ok"); loadHistory(true); return; } if (j.code === "conflict" && !any && confirm(j.error)) return restoreSnap(id, true); say(j.error, "error"); }); }
  // ---------- protection ----------
  var ST = { locked: ["err", "Verrouillé"], validated: ["ok", "Validé"], ai: ["ai", "Généré par IA"], user_modified: ["warn", "Modifié par vous"], pending: ["warn", "En attente"], user: ["", "Non marqué"] };
  function loadProt() {
    var pid = $("#rg-prot-page").value;
    api("GET", "/protections" + (pid ? "?page=" + pid : "")).then(function (j) {
      if (!j.ok) { say(j.error, "error"); return; }
      var rows = [];
      if (j.page) rows.push({ kind: "page", ref: j.page.id, label: "Page entière", state: j.page.state });
      (j.elements || []).forEach(function (e) { rows.push(e); (e.fields || []).forEach(function (f) { rows.push({ kind: "field", ref: f.ref, label: "  ↳ " + f.label, state: f.state }); }); });
      var explicit = {}; j.explicit.forEach(function (p) { explicit[p.kind + ":" + p.ref] = p.state; });
      $("#rg-prot").innerHTML = rows.length ? '<table class="rg-table"><thead><tr><th scope="col">Élément</th><th scope="col">État</th><th scope="col"></th></tr></thead><tbody>' + rows.map(function (r) { var st = explicit[r.kind + ":" + r.ref] || r.state, s = ST[st] || ST.user; return "<tr><td>" + esc(r.label) + '</td><td><span class="rg-chip" data-k="' + s[0] + '">' + s[1] + "</span></td><td>" + (CAN_WRITE ? ['locked:Verrouiller', 'validated:Valider', 'none:Retirer'].map(function (a) { var p = a.split(":"); return '<button class="btn btn-sm" data-prot="' + p[0] + '" data-kind="' + r.kind + '" data-ref="' + esc(r.ref) + '">' + p[1] + "</button> "; }).join("") : "") + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="sw-muted">Choisissez une page pour voir l\'état de ses éléments.</p>' + (j.explicit.length ? "<p>" + j.explicit.length + " protection(s) posée(s) sur le site.</p>" : "");
    });
  }
  $("#rg-prot-page").addEventListener("change", loadProt);
  $("#rg-prot").addEventListener("click", function (e) { var b = e.target.closest("[data-prot]"); if (!b) return; api("POST", "/protections", { kind: b.getAttribute("data-kind"), ref: b.getAttribute("data-ref"), state: b.getAttribute("data-prot") }).then(function (j) { say(j.ok ? "Protection mise à jour." : j.error, j.ok ? "ok" : "error"); if (j.ok) loadProt(); }); });
  pagesFromSite().then(fillSelects);
})();

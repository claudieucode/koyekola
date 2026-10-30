/* Mailchimp — onglets Campagnes (assistant en 5 étapes), Modèles, Rapports. */
(function () {
  "use strict";
  var M = window.__mc;
  if (!M) return;
  var h = M.h, api = M.api, q = M.q, enc = M.enc, button = M.button, field = M.field, select = M.select, table = M.table, flash = M.flash, fail = M.fail, fmtNum = M.fmtNum, pct = M.pct, clear = M.clear;

  var MERGE_TAGS = [["FNAME", "Prénom"], ["LNAME", "Nom"], ["EMAIL", "Adresse e-mail"], ["UNSUB", "Lien de désabonnement (obligatoire)"], ["UPDATE_PROFILE", "Mettre à jour ses préférences"], ["ARCHIVE", "Version en ligne"], ["LIST:COMPANY", "Société de l'audience"], ["LIST:ADDRESSLINE", "Adresse postale de l'audience"], ["CURRENT_YEAR", "Année en cours"], ["MC:SUBJECT", "Objet de la campagne"]];
  var STARTER = '<!DOCTYPE html>\n<html lang="fr">\n<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>*|MC:SUBJECT|*</title></head>\n<body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1b2b45">\n<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">\n<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px">\n<tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:24px">Bonjour *|FNAME|*,</h1>\n<div mc:edit="corps"><p style="margin:0 0 16px;line-height:1.6">Votre message ici.</p></div></td></tr>\n<tr><td style="padding:16px 32px;font-size:12px;color:#5a687d;border-top:1px solid #e5eaf0">*|LIST:COMPANY|* — *|LIST:ADDRESSLINE|*<br><a href="*|UNSUB|*">Se désabonner</a> · <a href="*|UPDATE_PROFILE|*">Gérer mes préférences</a></td></tr>\n</table></td></tr></table>\n</body>\n</html>\n';

  /* Éditeur HTML avec aperçu : renvoie { root, value(), set(v) } */
  function htmlEditor(initial, opts) {
    opts = opts || {};
    var ta = h("textarea", { class: "mk-mc-code", rows: 16, spellcheck: "false", "aria-label": opts.label || "Code HTML de l'e-mail", maxlength: 1000000 });
    ta.value = initial || "";
    var frame = h("iframe", { class: "mk-mc-frame", sandbox: "", title: "Aperçu de l'e-mail (valeurs d'exemple)", referrerpolicy: "no-referrer" });
    var wrap = h("div", { class: "mk-mc-framewrap" }, frame);
    var warn = h("ul", { class: "mk-mc-lint", "aria-live": "polite" });
    var timer = null, seq = 0;
    function lint() {
      clear(warn);
      var v = ta.value;
      if (!v.trim()) return;
      if (opts.requireUnsub !== false && !/\*\|UNSUB\|\*/.test(v)) warn.appendChild(h("li", { class: "is-bad", text: "Il manque le lien de désabonnement *|UNSUB|* : Mailchimp refuse l'envoi sans lui." }));
      if (!/\*\|LIST:ADDRESSLINE\|\*|\*\|LIST:COMPANY\|\*/.test(v) && opts.requireUnsub !== false) warn.appendChild(h("li", { class: "is-warn", text: "Pensez à l'adresse postale de l'expéditeur (*|LIST:ADDRESSLINE|*), exigée par la loi dans la plupart des pays." }));
      if (/<script[\s>]/i.test(v)) warn.appendChild(h("li", { class: "is-warn", text: "Les scripts sont ignorés par les messageries : retirez-les." }));
      if (v.length > 102000) warn.appendChild(h("li", { class: "is-warn", text: "Plus de 102 Ko : Gmail coupera le message (« Afficher l'intégralité »)." }));
    }
    function refresh() {
      lint();
      clearTimeout(timer);
      var mine = ++seq;
      timer = setTimeout(async function () {
        if (!ta.value.trim()) { frame.srcdoc = ""; return; }
        try { var r = await api("POST", "/modeles/apercu", { html: ta.value }); if (mine === seq) frame.srcdoc = r.html; }
        catch (e) { if (mine === seq) frame.srcdoc = "<p style='font-family:sans-serif'>Aperçu indisponible : " + String(e.message).replace(/[<>&]/g, "") + "</p>"; }
      }, 350);
      if (opts.onChange) opts.onChange(ta.value);
    }
    ta.addEventListener("input", refresh);
    var tags = h("div", { class: "mk-mc-tags", role: "group", "aria-label": "Insérer une balise de fusion" });
    MERGE_TAGS.forEach(function (t) {
      tags.appendChild(h("button", { type: "button", class: "mk-mc-chipbtn", title: t[1], "aria-label": "Insérer " + t[1], text: "*|" + t[0] + "|*", onclick: function () {
        var s = ta.selectionStart, e = ta.selectionEnd, ins = "*|" + t[0] + "|*";
        ta.value = ta.value.slice(0, s) + ins + ta.value.slice(e); ta.focus(); ta.selectionStart = ta.selectionEnd = s + ins.length; refresh();
      } }));
    });
    var dev = h("div", { class: "mk-mc-actions", role: "group", "aria-label": "Largeur de l'aperçu" },
      button("Ordinateur", function () { wrap.className = "mk-mc-framewrap"; }), button("Mobile", function () { wrap.className = "mk-mc-framewrap is-mobile"; }));
    var root = h("div", { class: "mk-mc-editor" }, tags, h("div", { class: "mk-mc-editgrid" }, h("div", {}, ta, warn), h("div", {}, dev, wrap)));
    refresh();
    return { root: root, value: function () { return ta.value; }, set: function (v) { ta.value = v; refresh(); } };
  }
  M.htmlEditor = htmlEditor;

  /* ---------- Campagnes ---------- */
  var TYPES = [["regular", "Standard (HTML)", "Un e-mail HTML envoyé à une audience ou à un segment."], ["plaintext", "Texte brut", "Un e-mail sans mise en forme."], ["rss", "RSS", "Envoyé automatiquement à chaque nouvel article d'un flux RSS."], ["variate", "Test A/B (objets)", "Compare plusieurs objets sur une partie de l'audience, puis envoie le meilleur au reste."]];
  var CAMP_STATUS = [["", "Tous les statuts"], ["save", "Brouillons"], ["schedule", "Planifiées"], ["sending", "En cours d'envoi"], ["sent", "Envoyées"], ["paused", "En pause"]];
  var roundQuarter = function (d) { var t = new Date(d.getTime()); t.setSeconds(0, 0); t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15); return t; };
  var toLocalInput = function (d) { var p = function (n) { return String(n).padStart(2, "0"); }; return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()); };

  async function checklistDialog(id, opener, silent) {
    try {
      var c = await api("GET", "/campagnes/" + id + "/verification");
      if (silent && c.is_ready) return c;
      var dlg = h("dialog", { class: "mk-mc-dialog", "aria-labelledby": "mc-ck-t" });
      dlg.appendChild(h("h2", { id: "mc-ck-t", text: c.is_ready ? "Prête à l'envoi" : "Pas encore prête à l'envoi" }));
      dlg.appendChild(h("ul", { class: "mk-mc-lint" }, (c.items || []).map(function (i) { return h("li", { class: i.type === "success" ? "is-ok" : i.type === "warning" ? "is-warn" : "is-bad", text: (i.type === "success" ? "✔ " : i.type === "warning" ? "⚠ " : "✖ ") + (i.heading || "") + (i.details ? " — " + i.details : "") }); })));
      dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); })));
      dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
      document.body.appendChild(dlg); dlg.showModal();
      return c;
    } catch (e) { fail(e); return null; }
  }
  function contentDialog(id, opener, after) {
    var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-labelledby": "mc-co-t" });
    dlg.appendChild(h("h2", { id: "mc-co-t", text: "Contenu de la campagne" }));
    var body = h("div"); dlg.appendChild(body);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
    document.body.appendChild(dlg); dlg.showModal();
    body.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
    api("GET", "/campagnes/" + id + "/contenu").then(function (c) {
      clear(body);
      var ed = htmlEditor(c.html || "", {});
      body.appendChild(ed.root);
      var err = h("p", { class: "mk-mc-dlg-error", role: "alert", hidden: true });
      body.appendChild(err);
      body.appendChild(h("div", { class: "mk-mc-actions" }, button("Enregistrer le contenu", async function () {
        try { await api("PUT", "/campagnes/" + id + "/contenu", { html: ed.value() }); flash("Contenu enregistré.", "ok"); dlg.close(); if (after) after(); } catch (e) { err.textContent = e.message; err.hidden = false; }
      }, { primary: true }), button("Fermer", function () { dlg.close(); })));
    }).catch(function (e) { clear(body); body.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); body.appendChild(button("Fermer", function () { dlg.close(); })); });
  }
  function testDialog(id, opener) {
    M.formDialog({ title: "Envoyer un e-mail de test", intro: "Cinq adresses au plus. L'objet est précédé de « [TEST] ».", fields: [{ name: "emails", label: "Adresses (séparées par des virgules)", required: true, type: "textarea", rows: 2 }, { name: "type", label: "Format", type: "select", options: [["html", "HTML"], ["plaintext", "Texte brut"]], value: "html" }], submitLabel: "Envoyer le test", returnFocus: opener,
      onSubmit: async function (v) { var list = v.emails.split(/[\s,;]+/).filter(Boolean); if (!list.length || list.length > 5) throw new Error("Saisissez de 1 à 5 adresses e-mail."); if (list.some(function (x) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); })) throw new Error("Une adresse est invalide."); await api("POST", "/campagnes/" + id + "/test", { test_emails: list, send_type: v.type }); flash("Test envoyé à " + list.join(", ") + ".", "ok"); } });
  }
  async function sendNow(c, reload) {
    var recipients = c.recipients && c.recipients.recipient_count;
    var chk = await checklistDialog(c.id, null, true);
    if (!chk || !chk.is_ready) return;
    var ok = await M.confirmDialog({ title: "Envoyer la campagne maintenant ?", text: "« " + ((c.settings && c.settings.title) || c.id) + " » partira immédiatement vers " + (recipients !== undefined ? fmtNum(recipients) + " destinataire(s)" : "toute l'audience ciblée") + ". L'envoi est irréversible.", label: "Envoyer maintenant", danger: true });
    if (!ok) return;
    try { await api("POST", "/campagnes/" + c.id + "/envoyer", { confirm: true }); flash("Campagne envoyée.", "ok"); reload(); } catch (e) { fail(e); }
  }
  function scheduleDialog(c, opener, reload) {
    var def = toLocalInput(roundQuarter(new Date(Date.now() + 3600 * 1000)));
    M.formDialog({ title: "Planifier l'envoi", intro: "Mailchimp planifie par tranches de 15 minutes ; l'heure saisie est celle de votre navigateur.", fields: [{ name: "when", label: "Date et heure d'envoi", type: "datetime-local", required: true, value: def }, { name: "ok", label: "Je confirme la planification de cet envoi", type: "checkbox" }], submitLabel: "Planifier", returnFocus: opener,
      onSubmit: async function (v) {
        if (!v.ok) throw new Error("Cochez la case de confirmation.");
        var d = roundQuarter(new Date(v.when));
        if (isNaN(d) || d.getTime() < Date.now() + 5 * 60000) throw new Error("Choisissez une date future (au moins dans 15 minutes).");
        await api("POST", "/campagnes/" + c.id + "/planifier", { schedule_time: d.toISOString().replace(/\.\d{3}Z$/, "+00:00"), confirm: true });
        flash("Envoi planifié pour le " + d.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }) + ".", "ok"); reload();
      } });
  }

  async function campaignWizard(opener, reload, resume) {
    var audiences = await M.loadAudiences();
    if (!audiences.length) { flash("Créez d'abord une audience (onglet « Audiences »).", "error"); return; }
    var d = { step: 1, type: "regular", listId: audiences[0].id, segmentId: "", title: "", subject: "", preview: "", fromName: "", replyTo: "", html: STARTER, plain: "", feedUrl: "", frequency: "daily", subjectB: "", testSize: 20, waitHours: 24, criteria: "opens", mode: "draft", when: toLocalInput(roundQuarter(new Date(Date.now() + 24 * 3600 * 1000))), campaignId: resume || null, segments: [] };
    var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-labelledby": "mc-wz-t" });
    var title = h("h2", { id: "mc-wz-t" }), steps = h("ol", { class: "mk-mc-steps", "aria-label": "Étapes" }), body = h("div"), err = h("p", { class: "mk-mc-dlg-error", role: "alert", hidden: true }), nav = h("div", { class: "mk-mc-actions" });
    dlg.appendChild(title); dlg.appendChild(steps); dlg.appendChild(err); dlg.appendChild(body); dlg.appendChild(nav);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); if (d.campaignId) reload(); });
    document.body.appendChild(dlg); dlg.showModal();
    var NAMES = ["Type", "Destinataires", "Paramètres", "Contenu", "Envoi"];
    var editor = null;
    var audience = function () { return audiences.filter(function (a) { return a.id === d.listId; })[0]; };
    function defaults() { var cd = (audience() && audience().campaign_defaults) || {}; if (!d.fromName) d.fromName = cd.from_name || ""; if (!d.replyTo) d.replyTo = cd.from_email || ""; if (!d.subject && cd.subject) d.subject = cd.subject; }
    function showErr(m) { err.textContent = m; err.hidden = !m; if (m) err.scrollIntoView({ block: "nearest" }); }
    function collect() {
      var g = function (n) { var el = body.querySelector("[name='" + n + "']"); return el ? (el.type === "checkbox" ? el.checked : el.value) : undefined; };
      if (d.step === 1) { d.type = (body.querySelector("input[name='type']:checked") || {}).value || d.type; if (d.type === "rss") { d.feedUrl = g("feedUrl").trim(); d.frequency = g("frequency"); } if (d.type === "variate") { d.subjectB = g("subjectB").trim(); d.testSize = Number(g("testSize")); d.waitHours = Number(g("waitHours")); d.criteria = g("criteria"); } }
      if (d.step === 2) { d.listId = g("listId"); d.segmentId = g("segmentId") || ""; }
      if (d.step === 3) { d.title = g("title").trim(); d.subject = g("subject").trim(); d.preview = g("preview").trim(); d.fromName = g("fromName").trim(); d.replyTo = g("replyTo").trim(); }
      if (d.step === 4) { if (d.type === "plaintext") d.plain = g("plain"); else if (editor) d.html = editor.value(); }
      if (d.step === 5) { d.mode = (body.querySelector("input[name='mode']:checked") || {}).value || "draft"; d.when = g("when") || d.when; }
    }
    function validate() {
      if (d.step === 1) { if (d.type === "rss" && !/^https:\/\/[^\s]+$/.test(d.feedUrl)) return "L'adresse du flux RSS doit commencer par https://."; if (d.type === "variate") { if (!d.subjectB) return "Saisissez le second objet à comparer."; if (!(d.testSize >= 10 && d.testSize <= 100)) return "La part de test doit être comprise entre 10 et 100 %."; } }
      if (d.step === 3) { if (!d.title) return "Le titre interne est obligatoire."; if (!d.subject) return "L'objet est obligatoire."; if (!d.fromName) return "Le nom de l'expéditeur est obligatoire."; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.replyTo)) return "L'adresse de réponse est invalide."; }
      if (d.step === 4) { if (d.type === "plaintext" ? !d.plain.trim() : !d.html.trim()) return "Le contenu est vide."; if (d.type === "plaintext" ? !/\*\|UNSUB\|\*/.test(d.plain) : !/\*\|UNSUB\|\*/.test(d.html)) return "Il manque le lien de désabonnement *|UNSUB|*."; }
      return "";
    }
    async function ensureCampaign() {
      var recipients = { list_id: d.listId };
      if (d.segmentId) recipients.segment_opts = { saved_segment_id: Number(d.segmentId) };
      var settings = { title: d.title, subject_line: d.subject, preview_text: d.preview, from_name: d.fromName, reply_to: d.replyTo };
      var body2 = { type: d.type, recipients: recipients, settings: settings };
      if (d.type === "rss") body2.rss_opts = { feed_url: d.feedUrl, frequency: d.frequency, schedule: { hour: 9 }, constrain_rss_img: false };
      if (d.type === "variate") body2.variate_settings = { winner_criteria: d.criteria, wait_time: d.waitHours, test_size: d.testSize, subject_lines: [d.subject, d.subjectB] };
      if (d.campaignId) { await api("PATCH", "/campagnes/" + d.campaignId, { recipients: recipients, settings: settings }); }
      else { var c = await api("POST", "/campagnes", body2); d.campaignId = c.id; }
      await api("PUT", "/campagnes/" + d.campaignId + "/contenu", d.type === "plaintext" ? { plain_text: d.plain } : { html: d.html });
      return d.campaignId;
    }
    function renderSteps() { clear(steps); NAMES.forEach(function (n, i) { steps.appendChild(h("li", { class: i + 1 === d.step ? "is-current" : i + 1 < d.step ? "is-done" : "", "aria-current": i + 1 === d.step ? "step" : null, text: n })); }); title.textContent = "Nouvelle campagne — étape " + d.step + " sur 5 : " + NAMES[d.step - 1]; }
    async function render() {
      renderSteps(); clear(body); clear(nav); showErr(""); editor = null;
      if (d.step === 1) {
        var fs = h("fieldset", { class: "mk-mc-radios" }, h("legend", { text: "Type de campagne" }));
        TYPES.forEach(function (t, i) { var id = "mc-ty-" + i; fs.appendChild(h("div", { class: "mk-mc-radio" }, h("input", { type: "radio", name: "type", id: id, value: t[0], checked: d.type === t[0], disabled: Boolean(d.campaignId) }), h("label", { for: id }, h("strong", { text: t[1] }), h("span", { text: " — " + t[2] })))); });
        body.appendChild(fs);
        var extra = h("div");
        body.appendChild(extra);
        var drawExtra = function () {
          var t = (body.querySelector("input[name='type']:checked") || {}).value; clear(extra);
          if (t === "rss") { var f = h("input", { type: "url", name: "feedUrl", value: d.feedUrl, placeholder: "https://exemple.fr/feed" }); extra.appendChild(field("Adresse du flux RSS (HTTPS)", f)); var fr = select([["daily", "Chaque jour"], ["weekly", "Chaque semaine"], ["monthly", "Chaque mois"]], d.frequency, { name: "frequency" }); extra.appendChild(field("Fréquence d'envoi", fr)); }
          if (t === "variate") { extra.appendChild(field("Second objet à comparer (le premier est saisi à l'étape 3)", h("input", { type: "text", name: "subjectB", value: d.subjectB, maxlength: 150 }))); extra.appendChild(field("Part de l'audience utilisée pour le test (10 à 100 %)", h("input", { type: "number", name: "testSize", min: 10, max: 100, value: d.testSize }))); extra.appendChild(field("Attendre (heures) avant d'envoyer le gagnant", h("input", { type: "number", name: "waitHours", min: 1, max: 336, value: d.waitHours }))); extra.appendChild(field("Critère du gagnant", select([["opens", "Taux d'ouverture"], ["clicks", "Taux de clic"]], d.criteria, { name: "criteria" }))); }
        };
        body.addEventListener("change", function (ev) { if (ev.target.name === "type") drawExtra(); });
        drawExtra();
      }
      if (d.step === 2) {
        var aud = select(audiences.map(function (a) { return [a.id, a.name + " (" + fmtNum(a.stats && a.stats.member_count) + " contacts)"]; }), d.listId, { name: "listId" });
        var seg = select([["", "Toute l'audience"]], d.segmentId, { name: "segmentId" });
        body.appendChild(field("Audience", aud)); body.appendChild(field("Segment ou tag (facultatif)", seg));
        var info = h("p", { class: "mk-mc-sub", "aria-live": "polite" }); body.appendChild(info);
        var countOf = function (opt) { var m = opt && opt.textContent.match(/\((\d[\d\s\u202f\u00a0]*)\)$/); return m ? Number(m[1].replace(/\D/g, "")) : 0; };
        var updateInfo = function () {
          var a = audiences.filter(function (z) { return z.id === aud.value; })[0];
          info.textContent = "Destinataires estimés : " + fmtNum(seg.value ? countOf(seg.options[seg.selectedIndex]) : (a && a.stats && a.stats.member_count)) + " (abonnés uniquement).";
        };
        var loadSeg = async function () {
          clear(seg); seg.appendChild(h("option", { value: "", text: "Toute l'audience" }));
          try { var found = (await api("GET", "/audiences/" + aud.value + "/segments?count=100")).segments || []; found.forEach(function (x) { var o = h("option", { value: x.id, text: (x.type === "static" ? "Tag : " : "Segment : ") + x.name + " (" + fmtNum(x.member_count) + ")" }); if (String(x.id) === String(d.segmentId)) o.selected = true; seg.appendChild(o); }); } catch (e) { info.textContent = "Segments indisponibles : " + e.message; return; }
          updateInfo();
        };
        aud.addEventListener("change", function () { d.listId = aud.value; d.segmentId = ""; loadSeg(); });
        seg.addEventListener("change", function () { d.segmentId = seg.value; updateInfo(); });
        loadSeg();
      }
      if (d.step === 3) {
        defaults();
        var tx = function (n, v, ph) { return h("input", { type: "text", name: n, value: v, maxlength: 150, placeholder: ph || "" }); };
        body.appendChild(field("Titre interne (visible de vous seul)", tx("title", d.title)));
        body.appendChild(field("Objet de l'e-mail" + (d.type === "variate" ? " (version A)" : ""), tx("subject", d.subject), "Court et précis : c'est ce qui décide de l'ouverture."));
        body.appendChild(field("Texte d'aperçu (facultatif)", tx("preview", d.preview), "Affiché après l'objet dans la boîte de réception."));
        body.appendChild(field("Nom de l'expéditeur", tx("fromName", d.fromName)));
        body.appendChild(field("Adresse de réponse", h("input", { type: "email", name: "replyTo", value: d.replyTo, maxlength: 254 }), "Doit être une adresse que vous contrôlez (domaine vérifié chez Mailchimp)."));
      }
      if (d.step === 4) {
        if (d.type === "plaintext") { body.appendChild(field("Texte de l'e-mail", h("textarea", { name: "plain", rows: 14, spellcheck: "false" }, d.plain || "Bonjour *|FNAME|*,\n\nVotre message ici.\n\nSe désabonner : *|UNSUB|*\n*|LIST:ADDRESSLINE|*"), "Balises : *|FNAME|*, *|UNSUB|* (obligatoire), *|LIST:ADDRESSLINE|*.")); var ta = body.querySelector("textarea"); ta.value = d.plain || ta.textContent; }
        else {
          var tplSel = select([["", "— Partir d'un modèle —"]], "", { "aria-label": "Charger un modèle" });
          body.appendChild(h("div", { class: "mk-mc-actions" }, field("Modèle", tplSel), button("Charger ce modèle", async function () {
            if (!tplSel.value) { flash("Choisissez un modèle.", "error"); return; }
            try { var c = await api("GET", "/modeles/" + tplSel.value + "/contenu"); editor.set(c.html || ""); flash("Modèle chargé.", "ok"); } catch (e) { fail(e); }
          })));
          api("GET", "/modeles?count=100&type=user").then(function (t) { (t.templates || []).forEach(function (x) { tplSel.appendChild(h("option", { value: x.id, text: x.name })); }); }).catch(function () {});
          editor = htmlEditor(d.html, {}); body.appendChild(editor.root);
        }
      }
      if (d.step === 5) {
        var a = audience(), segText = d.segmentId ? "segment/tag n° " + d.segmentId : "toute l'audience";
        body.appendChild(h("dl", { class: "mk-mc-dl" }, [["Type", (TYPES.filter(function (t) { return t[0] === d.type; })[0] || [])[1]], ["Audience", (a && a.name) + " — " + segText], ["Objet", d.subject + (d.type === "variate" ? " / " + d.subjectB : "")], ["Expéditeur", d.fromName + " <" + d.replyTo + ">"]].map(function (r) { return [h("dt", { text: r[0] }), h("dd", { text: r[1] || "—" })]; })));
        body.appendChild(h("details", {}, h("summary", { text: "Prévisualisation complète" }), d.type === "plaintext" ? h("pre", { class: "mk-mc-pre", text: d.plain }) : (function () { var e2 = htmlEditor(d.html, {}); return h("div", {}, h("div", { class: "mk-mc-framewrap-solo" }, e2.root.querySelector(".mk-mc-framewrap").parentNode)); })()));
        var tests = h("input", { type: "text", name: "tests", placeholder: "moi@exemple.fr, collegue@exemple.fr", "aria-label": "Adresses de test" });
        body.appendChild(h("div", { class: "mk-mc-actions" }, field("Envoyer un test à", tests), button("Envoyer le test", async function () {
          var list = tests.value.split(/[\s,;]+/).filter(Boolean);
          if (!list.length || list.length > 5 || list.some(function (x) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); })) { showErr("Saisissez de 1 à 5 adresses de test valides."); return; }
          try { showErr(""); await ensureCampaign(); await api("POST", "/campagnes/" + d.campaignId + "/test", { test_emails: list, send_type: d.type === "plaintext" ? "plaintext" : "html" }); flash("Test envoyé.", "ok"); } catch (e) { showErr(e.message); }
        })));
        var fs2 = h("fieldset", { class: "mk-mc-radios" }, h("legend", { text: "Que faire de cette campagne ?" }));
        [["draft", "Enregistrer en brouillon (rien n'est envoyé)"], ["schedule", "Planifier l'envoi"], ["send", "Envoyer maintenant"]].forEach(function (m, i) { var id = "mc-mo-" + i; fs2.appendChild(h("div", { class: "mk-mc-radio" }, h("input", { type: "radio", name: "mode", id: id, value: m[0], checked: d.mode === m[0] }), h("label", { for: id, text: m[1] }))); });
        body.appendChild(fs2);
        body.appendChild(field("Date et heure (si planifiée)", h("input", { type: "datetime-local", name: "when", value: d.when })));
        body.appendChild(h("div", { class: "mk-mc-check" }, h("input", { type: "checkbox", id: "mc-wz-ok", name: "confirm" }), h("label", { for: "mc-wz-ok", text: "Je confirme avoir relu le contenu et les destinataires" })));
      }
      if (d.step > 1) nav.appendChild(button("Précédent", function () { collect(); d.step--; render(); }));
      nav.appendChild(button("Annuler", function () { dlg.close(); }));
      if (d.step < 5) nav.appendChild(button("Suivant", function () { collect(); var m = validate(); if (m) { showErr(m); return; } d.step++; render(); }, { primary: true }));
      else nav.appendChild(button("Terminer", async function (ev) {
        collect();
        if (!body.querySelector("input[name='confirm']").checked) { showErr("Cochez la case de confirmation."); return; }
        var btn = ev.currentTarget; btn.disabled = true; M.busy(dlg, true); showErr("");
        try {
          var id = await ensureCampaign();
          if (d.mode === "draft") { flash("Brouillon enregistré dans Mailchimp.", "ok"); dlg.close(); return; }
          var chk = await api("GET", "/campagnes/" + id + "/verification");
          if (!chk.is_ready) { showErr("La campagne n'est pas prête : " + (chk.items || []).filter(function (i) { return i.type === "error"; }).map(function (i) { return (i.heading || "") + (i.details ? " (" + i.details + ")" : ""); }).join(" ; ") + " Elle est enregistrée en brouillon : corrigez puis reprenez depuis la liste."); return; }
          if (d.mode === "schedule") { var t = roundQuarter(new Date(d.when)); if (isNaN(t) || t.getTime() < Date.now() + 5 * 60000) { showErr("Choisissez une date future."); return; } await api("POST", "/campagnes/" + id + "/planifier", { schedule_time: t.toISOString().replace(/\.\d{3}Z$/, "+00:00"), confirm: true }); flash("Envoi planifié pour le " + t.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" }) + ".", "ok"); }
          else { await api("POST", "/campagnes/" + id + "/envoyer", { confirm: true }); flash("Campagne envoyée.", "ok"); }
          dlg.close();
        } catch (e) { showErr(e.message + (d.campaignId ? " (La campagne reste enregistrée en brouillon chez Mailchimp.)" : "")); }
        finally { btn.disabled = false; M.busy(dlg, false); }
      }, { primary: true }));
      var first = body.querySelector("input:not([type=hidden]), select, textarea"); if (first) first.focus();
    }
    render();
  }

  M.registerTab({ id: "campagnes", label: "Campagnes", needsConnection: true, render: async function (el) {
    var view = { status: "", type: "", offset: 0, count: 20 };
    var stSel = select(CAMP_STATUS, ""), tySel = select([["", "Tous les types"]].concat(TYPES.map(function (t) { return [t[0], t[1]]; })), "");
    el.appendChild(h("div", { class: "mk-mc-bar2" }, field("Statut", stSel), field("Type", tySel)));
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("Nouvelle campagne", function (ev) { campaignWizard(ev.currentTarget, load); }, { primary: true }), button("Actualiser", function () { load(); })));
    var out = h("div", { "aria-live": "polite" }); el.appendChild(out);
    async function load() {
      clear(out); out.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
      try {
        var d = await api("GET", "/campagnes" + q({ count: view.count, offset: view.offset, status: view.status, type: view.type, sort_field: "create_time", sort_dir: "DESC" }));
        var rows = d.campaigns || []; clear(out);
        if (!rows.length) { out.appendChild(M.empty("Aucune campagne pour ce filtre.")); return; }
        out.appendChild(table("Campagnes Mailchimp", [
          { label: "Campagne", cell: function (c) { return (c.settings && c.settings.title) || c.id; } }, { label: "Objet", cell: function (c) { return (c.settings && c.settings.subject_line) || "—"; } },
          { label: "Type", cell: function (c) { return (TYPES.filter(function (t) { return t[0] === c.type; })[0] || [c.type, c.type])[1]; } }, { label: "Statut", cell: function (c) { return M.statusBadge(c.status); } },
          { label: "Envoi", cell: function (c) { return M.fmtDate(c.send_time); } }, { label: "Destinataires", cell: function (c) { return fmtNum(c.recipients && c.recipients.recipient_count); } },
          { label: "Actions", cell: function (c) {
            var a = [];
            var editable = c.status === "save" || c.status === "paused";
            if (editable) { a.push(button("Contenu", function (ev) { contentDialog(c.id, ev.currentTarget, load); })); a.push(button("Test", function (ev) { testDialog(c.id, ev.currentTarget); })); a.push(button("Vérifier", function (ev) { checklistDialog(c.id, ev.currentTarget); })); a.push(button("Planifier", function (ev) { scheduleDialog(c, ev.currentTarget, load); })); a.push(button("Envoyer", function () { sendNow(c, load); }, { primary: true })); }
            if (c.status === "schedule") a.push(button("Annuler la planification", async function () { try { await api("POST", "/campagnes/" + c.id + "/deplanifier", {}); flash("Planification annulée : la campagne repasse en brouillon.", "ok"); load(); } catch (e) { fail(e); } }));
            if (c.type === "rss" && c.status === "sending") a.push(button("Mettre en pause", async function () { try { await api("POST", "/campagnes/" + c.id + "/pause", {}); load(); } catch (e) { fail(e); } }));
            if (c.type === "rss" && c.status === "paused") a.push(button("Reprendre", async function () { try { await api("POST", "/campagnes/" + c.id + "/reprendre", {}); load(); } catch (e) { fail(e); } }));
            if (c.status === "sent" || c.status === "sending") a.push(button("Rapport", function () { M.state.reportFor = c.id; M.selectTab("rapports", true); }));
            a.push(button("Dupliquer", async function () { try { await api("POST", "/campagnes/" + c.id + "/dupliquer", {}); flash("Campagne dupliquée (brouillon).", "ok"); load(); } catch (e) { fail(e); } }));
            if (c.status !== "sent" && c.status !== "sending") a.push(button("Supprimer", async function () { if (!(await M.confirmDialog({ title: "Supprimer cette campagne ?", text: "« " + ((c.settings && c.settings.title) || c.id) + " » sera supprimée chez Mailchimp.", label: "Supprimer", danger: true }))) return; try { await api("DELETE", "/campagnes/" + c.id + "?confirm=1"); flash("Campagne supprimée.", "ok"); load(); } catch (e) { fail(e); } }, { danger: true }));
            return h("span", { class: "mk-mc-inline" }, a);
          } }], rows));
        out.appendChild(M.pager(d.total_items || 0, view.offset, view.count, function (o) { view.offset = o; load(); }));
      } catch (e) { clear(out); out.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
    }
    stSel.addEventListener("change", function () { view.status = stSel.value; view.offset = 0; load(); });
    tySel.addEventListener("change", function () { view.type = tySel.value; view.offset = 0; load(); });
    load();
  } });

  /* ---------- Modèles ---------- */
  function templateEditor(tpl, opener, reload) {
    var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-labelledby": "mc-te-t" });
    dlg.appendChild(h("h2", { id: "mc-te-t", text: tpl ? "Modifier le modèle « " + tpl.name + " »" : "Nouveau modèle" }));
    var body = h("div"); dlg.appendChild(body);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
    document.body.appendChild(dlg); dlg.showModal();
    var name = h("input", { type: "text", maxlength: 150, value: tpl ? tpl.name : "" });
    var err = h("p", { class: "mk-mc-dlg-error", role: "alert", hidden: true });
    body.appendChild(field("Nom du modèle (obligatoire)", name)); body.appendChild(err);
    var ed = null;
    function mount(html) {
      ed = htmlEditor(html, {}); body.appendChild(ed.root);
      body.appendChild(h("div", { class: "mk-mc-actions" }, button("Enregistrer", async function () {
        if (!name.value.trim()) { err.textContent = "Le nom est obligatoire."; err.hidden = false; name.focus(); return; }
        if (!ed.value().trim()) { err.textContent = "Le HTML est vide."; err.hidden = false; return; }
        try { if (tpl) await api("PATCH", "/modeles/" + tpl.id, { name: name.value.trim(), html: ed.value() }); else await api("POST", "/modeles", { name: name.value.trim(), html: ed.value() }); flash("Modèle enregistré.", "ok"); dlg.close(); reload(); } catch (e) { err.textContent = e.message; err.hidden = false; }
      }, { primary: true }), button("Fermer", function () { dlg.close(); })));
    }
    if (tpl) api("GET", "/modeles/" + tpl.id + "/contenu").then(function (c) { mount(c.html || ""); }).catch(function (e) { err.textContent = e.message; err.hidden = false; }); else mount(STARTER);
  }
  M.registerTab({ id: "modeles", label: "Modèles", needsConnection: true, render: async function (el) {
    var tySel = select([["user", "Mes modèles"], ["base", "Modèles de base Mailchimp"], ["gallery", "Galerie Mailchimp"]], "user");
    var search = h("input", { type: "search", "aria-label": "Filtrer les modèles par nom", placeholder: "Filtrer par nom" });
    el.appendChild(h("div", { class: "mk-mc-bar2" }, field("Catégorie", tySel), field("Filtrer", search)));
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("Nouveau modèle", function (ev) { templateEditor(null, ev.currentTarget, load); }, { primary: true })));
    var vars = h("details", {}, h("summary", { text: "Variables disponibles (balises de fusion)" }), table("Balises de fusion", [{ label: "Balise", cell: function (t) { return h("code", { text: "*|" + t[0] + "|*" }); } }, { label: "Remplacée par", cell: function (t) { return t[1]; } }], MERGE_TAGS));
    el.appendChild(vars);
    var out = h("div", { class: "mk-mc-gallery", "aria-live": "polite" }); el.appendChild(out);
    var all = [];
    function draw() {
      clear(out);
      var f = search.value.trim().toLowerCase(), list = all.filter(function (t) { return !f || String(t.name).toLowerCase().indexOf(f) >= 0; });
      if (!list.length) { out.appendChild(M.empty(all.length ? "Aucun modèle ne correspond." : "Aucun modèle dans cette catégorie.")); return; }
      list.forEach(function (t) {
        var own = t.type === "user";
        out.appendChild(h("article", { class: "mk-mc-tplcard" },
          t.thumbnail && /^https:\/\//.test(t.thumbnail) ? h("img", { src: t.thumbnail, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : h("div", { class: "mk-mc-thumb", "aria-hidden": "true", text: "HTML" }),
          h("h3", { text: t.name }), h("p", { class: "mk-mc-sub", text: (own ? "Modèle personnalisé" : t.type === "base" ? "Modèle de base" : "Galerie") + " · " + M.fmtDate(t.date_created) }),
          h("div", { class: "mk-mc-inline" },
            button("Aperçu", async function (ev) { var opener = ev.currentTarget; try { var c = await api("GET", "/modeles/" + t.id + "/contenu"); var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-label": "Aperçu du modèle " + t.name }); var e2 = htmlEditor(c.html || "", {}); e2.root.querySelector("textarea").readOnly = true; dlg.appendChild(h("h2", { text: "Aperçu : " + t.name })); dlg.appendChild(e2.root); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); if (document.contains(opener)) opener.focus(); }); document.body.appendChild(dlg); dlg.showModal(); } catch (e) { fail(e); } }),
            own ? button("Modifier", function (ev) { templateEditor(t, ev.currentTarget, load); }) : null,
            button("Dupliquer", async function () { try { var c = await api("GET", "/modeles/" + t.id + "/contenu"); if (!c.html) throw new Error("Ce modèle n'a pas de HTML récupérable (modèle glisser-déposer)."); await api("POST", "/modeles", { name: t.name + " (copie)", html: c.html }); flash("Modèle dupliqué dans « Mes modèles ».", "ok"); if (tySel.value === "user") load(); } catch (e) { fail(e); } }),
            own ? button("Supprimer", async function () { if (!(await M.confirmDialog({ title: "Supprimer ce modèle ?", text: "« " + t.name + " » sera supprimé chez Mailchimp. Les campagnes déjà créées ne sont pas modifiées.", label: "Supprimer", danger: true }))) return; try { await api("DELETE", "/modeles/" + t.id + "?confirm=1"); flash("Modèle supprimé.", "ok"); load(); } catch (e) { fail(e); } }, { danger: true }) : null)));
      });
    }
    async function load() { clear(out); out.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" })); try { all = (await api("GET", "/modeles" + q({ count: 100, type: tySel.value }))).templates || []; draw(); } catch (e) { clear(out); out.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); } }
    tySel.addEventListener("change", load); search.addEventListener("input", draw);
    load();
  } });

  /* ---------- Rapports ---------- */
  var PRINT = function () { window.print(); };
  function exportBtn(name, header, rows) { return button("Exporter en CSV", function () { M.downloadCsv(name, header, rows); }); }
  async function reportDetail(el, rep, back) {
    clear(el);
    var id = rep.id;
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("← Retour aux rapports", back), button("Imprimer / enregistrer en PDF", PRINT)));
    el.appendChild(h("h3", { text: rep.campaign_title || rep.subject_line || id }));
    var nav = h("div", { class: "mk-mc-subtabs", role: "group", "aria-label": "Sections du rapport" }), out = h("div", { "aria-live": "polite" });
    el.appendChild(nav); el.appendChild(out);
    var pg = { offset: 0, count: 50 };
    var SECTIONS = {
      resume: { label: "Résumé", run: async function () {
        var r = rep; var sent = r.emails_sent || 0;
        var tiles = h("div", { class: "mk-mc-tiles" });
        [["Envoyés", fmtNum(sent)], ["Ouvertures uniques", fmtNum(r.opens && r.opens.unique_opens)], ["Taux d'ouverture", pct(r.opens && r.opens.open_rate)], ["Clics uniques", fmtNum(r.clicks && r.clicks.unique_clicks)], ["Taux de clic", pct(r.clicks && r.clicks.click_rate)], ["Rebonds durs", fmtNum(r.bounces && r.bounces.hard_bounces)], ["Rebonds mous", fmtNum(r.bounces && r.bounces.soft_bounces)], ["Désabonnements", fmtNum(r.unsubscribed)], ["Plaintes", fmtNum(r.abuse_reports)], ["Revenus", M.money(r.ecommerce && r.ecommerce.total_revenue)]].forEach(function (x) { tiles.appendChild(h("div", { class: "mk-mc-tile" }, h("span", { class: "mk-mc-tile-v", text: x[1] }), h("span", { class: "mk-mc-tile-l", text: x[0] }))); });
        out.appendChild(tiles);
        var ratio = function (n) { return sent ? n / sent : 0; };
        out.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Répartition (part des e-mails envoyés)" }), M.barChart("Ouvertures, clics, rebonds et désabonnements", [{ label: "Ouverts", value: r.opens && r.opens.open_rate || 0, kind: "ok" }, { label: "Clics", value: r.clicks && r.clicks.click_rate || 0, kind: "info" }, { label: "Rebonds", value: ratio((r.bounces && (r.bounces.hard_bounces + r.bounces.soft_bounces)) || 0), kind: "bad" }, { label: "Désabo.", value: ratio(r.unsubscribed || 0), kind: "warn" }], { format: pct, max: 1 })));
        var adv = h("section", { class: "mk-mc-card" }, h("h3", { text: "Conseils de Mailchimp" })); out.appendChild(adv);
        api("GET", "/rapports/" + id + "/conseils").then(function (a) { var items = a.advice || []; adv.appendChild(items.length ? h("ul", {}, items.map(function (x) { return h("li", { text: x.message || x.type }); })) : M.empty("Aucun conseil.")); }).catch(function () { adv.remove(); });
      } },
      ouvertures: { label: "Ouvertures", run: async function () { var d = await api("GET", "/rapports/" + id + "/ouvertures" + q({ count: pg.count, offset: pg.offset })); var rows = d.members || []; out.appendChild(rows.length ? table("Ouvertures par contact", [{ label: "E-mail", cell: function (m) { return m.email_address; } }, { label: "Ouvertures", cell: function (m) { return fmtNum(m.opens_count); } }, { label: "Dernière ouverture", cell: function (m) { var o = (m.opens || []).slice(-1)[0]; return o ? M.fmtDate(o.timestamp) : "—"; } }], rows) : M.empty("Aucune ouverture enregistrée.")); out.appendChild(exportBtn("ouvertures-" + id + ".csv", ["email", "ouvertures"], rows.map(function (m) { return [m.email_address, m.opens_count]; }))); out.appendChild(M.pager(d.total_items || 0, pg.offset, pg.count, function (o) { pg.offset = o; show("ouvertures"); })); } },
      clics: { label: "Clics", run: async function () { var d = await api("GET", "/rapports/" + id + "/clics?count=100"); var rows = d.urls_clicked || []; out.appendChild(rows.length ? table("Clics par lien", [{ label: "Lien", cell: function (u) { return h("a", { href: /^https?:\/\//.test(u.url) ? u.url : "#", target: "_blank", rel: "noopener noreferrer nofollow", text: u.url }); } }, { label: "Clics", cell: function (u) { return fmtNum(u.total_clicks); } }, { label: "Clics uniques", cell: function (u) { return fmtNum(u.unique_clicks); } }, { label: "Part", cell: function (u) { return pct(u.click_percentage / 100); } }, { label: "Détail", cell: function (u) { return button("Qui a cliqué ?", async function () { try { var m = (await api("GET", "/rapports/" + id + "/clics/" + enc(u.id) + "/membres?count=100")).members || []; var dlg = h("dialog", { class: "mk-mc-dialog", "aria-label": "Contacts ayant cliqué" }); dlg.appendChild(h("h2", { text: "Contacts ayant cliqué" })); dlg.appendChild(m.length ? table("Contacts", [{ label: "E-mail", cell: function (x) { return x.email_address; } }, { label: "Clics", cell: function (x) { return fmtNum(x.clicks); } }], m) : M.empty("Aucun contact.")); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); }); document.body.appendChild(dlg); dlg.showModal(); } catch (e) { fail(e); } }); } }], rows) : M.empty("Aucun clic enregistré.")); out.appendChild(exportBtn("clics-" + id + ".csv", ["lien", "clics", "clics uniques"], rows.map(function (u) { return [u.url, u.total_clicks, u.unique_clicks]; }))); } },
      rebonds: { label: "Rebonds", run: async function () { var b = await api("GET", "/rapports/" + id + "/rebonds"); [["Rebonds durs (adresse inexistante)", b.hard], ["Rebonds mous (boîte pleine, serveur indisponible)", b.soft]].forEach(function (s) { out.appendChild(h("h3", { text: s[0] + " : " + s[1].length })); out.appendChild(s[1].length ? table(s[0], [{ label: "E-mail", cell: function (x) { return x.email; } }, { label: "Date", cell: function (x) { return M.fmtDate(x.at); } }], s[1]) : M.empty("Aucun.")); }); out.appendChild(exportBtn("rebonds-" + id + ".csv", ["type", "email", "date"], b.hard.map(function (x) { return ["dur", x.email, x.at]; }).concat(b.soft.map(function (x) { return ["mou", x.email, x.at]; })))); } },
      desabonnements: { label: "Désabonnements", run: async function () { var d = await api("GET", "/rapports/" + id + "/desabonnements?count=100"); var rows = d.unsubscribes || []; out.appendChild(rows.length ? table("Désabonnements", [{ label: "E-mail", cell: function (x) { return x.email_address; } }, { label: "Date", cell: function (x) { return M.fmtDate(x.timestamp); } }, { label: "Motif", cell: function (x) { return x.reason || "—"; } }], rows) : M.empty("Aucun désabonnement.")); out.appendChild(exportBtn("desabonnements-" + id + ".csv", ["email", "date", "motif"], rows.map(function (x) { return [x.email_address, x.timestamp, x.reason]; }))); } },
      plaintes: { label: "Plaintes", run: async function () { var d = await api("GET", "/rapports/" + id + "/plaintes?count=100"); var rows = d.abuse_reports || []; out.appendChild(rows.length ? table("Signalements d'abus", [{ label: "E-mail", cell: function (x) { return x.email_address; } }, { label: "Date", cell: function (x) { return M.fmtDate(x.date); } }], rows) : M.empty("Aucune plainte.")); } },
      domaines: { label: "Domaines", run: async function () { var d = await api("GET", "/rapports/" + id + "/domaines"); var rows = d.domains || []; out.appendChild(rows.length ? table("Performance par domaine", [{ label: "Domaine", cell: function (x) { return x.domain; } }, { label: "Envoyés", cell: function (x) { return fmtNum(x.emails_sent); } }, { label: "Rebonds", cell: function (x) { return fmtNum(x.bounces); } }, { label: "Ouvertures", cell: function (x) { return fmtNum(x.opens); } }, { label: "Clics", cell: function (x) { return fmtNum(x.clicks); } }, { label: "Désabonnés", cell: function (x) { return fmtNum(x.unsubs); } }], rows) : M.empty("Pas de données par domaine.")); out.appendChild(exportBtn("domaines-" + id + ".csv", ["domaine", "envoyés", "rebonds", "ouvertures", "clics"], rows.map(function (x) { return [x.domain, x.emails_sent, x.bounces, x.opens, x.clicks]; }))); } },
      localisations: { label: "Localisation", run: async function () { var d = await api("GET", "/rapports/" + id + "/localisations?count=100"); var rows = d.locations || []; out.appendChild(rows.length ? table("Ouvertures par pays", [{ label: "Pays", cell: function (x) { return x.country_code || "—"; } }, { label: "Région", cell: function (x) { return x.region || "—"; } }, { label: "Ouvertures", cell: function (x) { return fmtNum(x.opens); } }], rows) : M.empty("Pas de données de localisation.")); } },
      produits: { label: "Revenus par produit", run: async function () { var d = await api("GET", "/rapports/" + id + "/produits?count=100"); var rows = d.products || []; out.appendChild(rows.length ? table("Revenus par produit", [{ label: "Produit", cell: function (x) { return x.title; } }, { label: "Achats", cell: function (x) { return fmtNum(x.total_purchased); } }, { label: "Revenus", cell: function (x) { return M.money(x.total_revenue); } }], rows) : M.empty("Aucune vente attribuée à cette campagne.")); } },
      ab: { label: "Test A/B", run: async function () { var d = await api("GET", "/rapports/" + id + "/sous-rapports"); var rows = d.reports || []; out.appendChild(rows.length ? table("Variantes", [{ label: "Variante", cell: function (x) { return x.campaign_title || x.subject_line || x.id; } }, { label: "Envoyés", cell: function (x) { return fmtNum(x.emails_sent); } }, { label: "Ouvertures", cell: function (x) { return pct(x.opens && x.opens.open_rate); } }, { label: "Clics", cell: function (x) { return pct(x.clicks && x.clicks.click_rate); } }], rows) : M.empty("Cette campagne n'est pas un test A/B.")); } }
    };
    async function show(key) {
      Array.prototype.forEach.call(nav.children, function (b) { b.setAttribute("aria-pressed", b.dataset.key === key ? "true" : "false"); });
      clear(out); out.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
      var holder = out; var tmp = h("div"); out = tmp;
      try { await SECTIONS[key].run(); } catch (e) { tmp.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
      out = holder; clear(holder); while (tmp.firstChild) holder.appendChild(tmp.firstChild);
    }
    Object.keys(SECTIONS).forEach(function (k) { var b = h("button", { type: "button", class: "mk-mc-btn", "data-key": k, "aria-pressed": "false", text: SECTIONS[k].label }); b.addEventListener("click", function () { pg.offset = 0; show(k); }); nav.appendChild(b); });
    show("resume");
  }
  M.registerTab({ id: "rapports", label: "Rapports", needsConnection: true, render: async function (el) {
    var d = await api("GET", "/rapports?count=50");
    var rows = (d.reports || []).slice().sort(function (a, b) { return String(b.send_time || "").localeCompare(String(a.send_time || "")); });
    function list() {
      clear(el);
      var tools = h("div", { class: "mk-mc-actions" });
      var picked = {};
      tools.appendChild(button("Comparer la sélection", async function () {
        var ids = Object.keys(picked); if (ids.length < 2 || ids.length > 10) { flash("Sélectionnez de 2 à 10 campagnes à comparer.", "error"); return; }
        try { var c = await api("POST", "/rapports/comparer", { ids: ids }); compare(c); } catch (e) { fail(e); }
      }, { primary: true }));
      tools.appendChild(exportBtn("rapports-campagnes.csv", ["campagne", "envoi", "envoyés", "taux d'ouverture", "taux de clic", "rebonds", "désabonnements", "revenus"], rows.map(function (r) { return [r.campaign_title || r.subject_line, r.send_time, r.emails_sent, r.opens && r.opens.open_rate, r.clicks && r.clicks.click_rate, r.bounces && (r.bounces.hard_bounces + r.bounces.soft_bounces), r.unsubscribed, r.ecommerce && r.ecommerce.total_revenue]; })));
      tools.appendChild(button("Imprimer / enregistrer en PDF", PRINT));
      el.appendChild(tools);
      if (!rows.length) { el.appendChild(M.empty("Aucune campagne envoyée : les rapports apparaissent après le premier envoi.")); return; }
      el.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Taux d'ouverture des dernières campagnes" }), M.barChart("Taux d'ouverture par campagne", rows.slice(0, 12).reverse().map(function (r) { return { label: String(r.campaign_title || r.subject_line || "").slice(0, 8), value: r.opens && r.opens.open_rate || 0, kind: "ok" }; }), { format: pct, max: 1 })));
      el.appendChild(table("Rapports de campagnes", [
        { label: "Sélection", cell: function (r) { var cb = h("input", { type: "checkbox", "aria-label": "Comparer " + (r.campaign_title || r.id) }); cb.addEventListener("change", function () { if (cb.checked) picked[r.id] = true; else delete picked[r.id]; }); return cb; } },
        { label: "Campagne", cell: function (r) { return button(r.campaign_title || r.subject_line || r.id, function () { reportDetail(el, r, list); }, { aria: "Ouvrir le rapport de " + (r.campaign_title || r.id) }); } },
        { label: "Envoi", cell: function (r) { return M.fmtDate(r.send_time); } }, { label: "Envoyés", cell: function (r) { return fmtNum(r.emails_sent); } },
        { label: "Ouvertures", cell: function (r) { return pct(r.opens && r.opens.open_rate); } }, { label: "Clics", cell: function (r) { return pct(r.clicks && r.clicks.click_rate); } },
        { label: "Rebonds", cell: function (r) { return fmtNum(r.bounces && (r.bounces.hard_bounces + r.bounces.soft_bounces)); } }, { label: "Désabo.", cell: function (r) { return fmtNum(r.unsubscribed); } }, { label: "Revenus", cell: function (r) { return M.money(r.ecommerce && r.ecommerce.total_revenue); } }], rows));
    }
    function compare(c) {
      clear(el);
      el.appendChild(h("div", { class: "mk-mc-actions" }, button("← Retour aux rapports", list), exportBtn("comparaison-campagnes.csv", ["campagne", "envoyés", "ouvertures", "clics", "rebonds", "désabonnements", "revenus"], c.campaigns.map(function (x) { return [x.title || x.subject, x.sent, x.openRate, x.clickRate, x.bounces, x.unsubscribed, x.revenue]; })), button("Imprimer / enregistrer en PDF", PRINT)));
      el.appendChild(h("h3", { text: "Comparaison de " + c.campaigns.length + " campagnes" }));
      el.appendChild(h("section", { class: "mk-mc-card" }, h("h4", { text: "Taux d'ouverture" }), M.barChart("Taux d'ouverture", c.campaigns.map(function (x) { return { label: String(x.title || x.subject).slice(0, 8), value: x.openRate, kind: x.id === c.best.openRate ? "ok" : "info" }; }), { format: pct, max: 1 }), h("h4", { text: "Taux de clic" }), M.barChart("Taux de clic", c.campaigns.map(function (x) { return { label: String(x.title || x.subject).slice(0, 8), value: x.clickRate, kind: x.id === c.best.clickRate ? "ok" : "info" }; }), { format: pct, max: 1 })));
      el.appendChild(table("Comparaison", [{ label: "Campagne", cell: function (x) { return (x.title || x.subject) + (x.id === c.best.openRate ? " (meilleure ouverture)" : ""); } }, { label: "Envoyés", cell: function (x) { return fmtNum(x.sent); } }, { label: "Ouvertures", cell: function (x) { return pct(x.openRate); } }, { label: "Clics", cell: function (x) { return pct(x.clickRate); } }, { label: "Rebonds", cell: function (x) { return fmtNum(x.bounces); } }, { label: "Désabo.", cell: function (x) { return fmtNum(x.unsubscribed); } }, { label: "Revenus", cell: function (x) { return M.money(x.revenue); } }], c.campaigns));
    }
    list();
    if (M.state.reportFor) { var want = rows.filter(function (r) { return r.id === M.state.reportFor; })[0]; M.state.reportFor = null; if (want) reportDetail(el, want, list); }
  } });
})();

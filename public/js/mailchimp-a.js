/* Mailchimp — onglets Connexion, Vue d'ensemble, Audiences, Contacts. */
(function () {
  "use strict";
  var M = window.__mc;
  if (!M) return;
  var h = M.h, api = M.api, q = M.q, enc = M.enc, button = M.button, field = M.field, select = M.select, table = M.table, flash = M.flash, fail = M.fail, fmtNum = M.fmtNum, pct = M.pct;

  /* ---------- Connexion ---------- */
  M.registerTab({ id: "connexion", label: "Connexion", render: async function (el) {
    var st = M.state.status;
    if (!st.connected) {
      if (!st.encryptionReady) el.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: "La variable ENCRYPTION_KEY est absente ou invalide sur le serveur : aucune clé ne peut être enregistrée. Demandez à l'hébergeur de la configurer." }));
      el.appendChild(h("p", { text: "Collez ici la clé d'API de votre compte Mailchimp. Elle se génère dans Mailchimp → Compte → Extras → Clés d'API, et se termine par le centre de données (par exemple « -us21 »)." }));
      var input = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: "0123456789abcdef0123456789abcdef-us21", required: true });
      var btn = button("Valider et enregistrer", null, { primary: true, type: "submit", disabled: !st.encryptionReady });
      var form = h("form", { class: "mk-mc-form", novalidate: true }, field("Clé d'API Mailchimp", input, "La clé est vérifiée en direct auprès de Mailchimp, puis enregistrée chiffrée. Elle ne s'affichera plus jamais."), h("div", { class: "mk-mc-actions" }, btn));
      form.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        btn.disabled = true; M.busy(form, true);
        try { var d = await api("POST", "/connexion", { apiKey: input.value.trim() }); M.state.status = d.status; input.value = ""; M.renderBar(); M.selectTab("connexion", false); flash("Connecté au compte « " + d.account.name + " ». Première synchronisation lancée.", "ok"); M.startSync(true, true); }
        catch (e) { fail(e); input.focus(); }
        finally { btn.disabled = false; M.busy(form, false); }
      });
      el.appendChild(form);
      return;
    }
    var a = st.account || {};
    var dl = h("dl", { class: "mk-mc-dl" });
    [["Compte", a.name], ["E-mail du compte", a.email], ["Rôle", a.role], ["Offre payante (Pro)", a.proEnabled ? "Oui" : "Non"], ["Centre de données", a.dc], ["Abonnés (total Mailchimp)", fmtNum(a.totalSubscribers)], ["Connecté le", M.fmtDate(a.connectedAt)]].forEach(function (r) { dl.appendChild(h("dt", { text: r[0] })); dl.appendChild(h("dd", { text: r[1] || "—" })); });
    el.appendChild(h("section", { class: "mk-mc-card", "aria-label": "Compte connecté" }, h("h3", { text: "Compte connecté" }), dl,
      h("div", { class: "mk-mc-actions" },
        button("Tester la connexion", async function () { try { await api("GET", "/compte/ping"); flash("Connexion à Mailchimp : OK.", "ok"); } catch (e) { fail(e); } }),
        button("Synchronisation complète", function () { M.startSync(true); }),
        button("Déconnecter", async function () {
          if (!(await M.confirmDialog({ title: "Déconnecter Mailchimp ?", text: "La clé d'API et le jeton de webhook seront effacés de Kolakisa. Les contacts déjà importés restent. Les webhooks créés chez Mailchimp cesseront d'être acceptés.", label: "Déconnecter", danger: true }))) return;
          try { var d = await api("DELETE", "/connexion"); M.state.status = d.status; M.renderBar(); M.selectTab("connexion", false); flash("Mailchimp est déconnecté.", "ok"); } catch (e) { fail(e); }
        }, { danger: true }))));
    var auto = h("input", { type: "checkbox", id: "mc-auto" });
    auto.checked = st.syncEnabled;
    auto.addEventListener("change", async function () { try { var d = await api("POST", "/synchronisation/activer", { enabled: auto.checked }); M.state.status = d; flash(auto.checked ? "Synchronisation automatique activée (toutes les heures)." : "Synchronisation automatique désactivée.", "ok"); } catch (e) { auto.checked = !auto.checked; fail(e); } });
    var s = M.state.sync || {};
    var sec = h("section", { class: "mk-mc-card", "aria-label": "Synchronisation" }, h("h3", { text: "Synchronisation" }),
      h("div", { class: "mk-mc-check" }, auto, h("label", { for: "mc-auto", text: "Synchroniser automatiquement toutes les heures" })),
      h("p", { class: "mk-mc-sub", text: "Kolakisa reste maître des consentements : une personne désinscrite, rebondie ou supprimée chez Kolakisa n'est jamais réabonnée par Mailchimp (le désabonnement est renvoyé à Mailchimp). Pour les autres informations, Mailchimp fait autorité." }));
    if (s.summary) {
      var sm = s.summary;
      var rows = [["Audiences lues", sm.audiences], ["Campagnes lues", sm.campaigns], ["Rapports mis à jour", sm.reports], ["Contacts lus", sm.pulled], ["Nouveaux contacts", sm.created], ["Abonnés confirmés", sm.subscribed], ["Désinscrits", sm.unsubscribed], ["Adresses invalides", sm.suppressed], ["Conflits résolus (le plus restrictif gagne)", sm.conflicts], ["Envoyés vers Mailchimp (abonnés)", sm.pushedSubscribe], ["Envoyés vers Mailchimp (désabonnés)", sm.pushedUnsubscribe]];
      sec.appendChild(table("Résumé de la dernière synchronisation", [{ label: "Élément", cell: function (r) { return r[0]; } }, { label: "Nombre", cell: function (r) { return fmtNum(r[1]); } }], rows));
      if (sm.truncated) sec.appendChild(h("p", { class: "mk-mc-note", text: "La synchronisation a été limitée (volume important) : la suivante reprendra où elle s'est arrêtée." }));
      if (sm.errors && sm.errors.length) sec.appendChild(h("div", { class: "mk-mc-note is-bad", role: "alert" }, h("strong", { text: "Problèmes rencontrés :" }), h("ul", {}, sm.errors.map(function (m) { return h("li", { text: m }); }))));
    }
    if (s.error) sec.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: s.error }));
    el.appendChild(sec);
    var whs = h("section", { class: "mk-mc-card", "aria-label": "Adresse du webhook" }, h("h3", { text: "Adresse du webhook entrant" }));
    el.appendChild(whs);
    try {
      var w = await api("GET", "/webhook-url");
      if (!w.url) whs.appendChild(h("p", { class: "mk-mc-note", text: "Aucune adresse publique : la variable SITE_URL (HTTPS) n'est pas définie sur le serveur. Mailchimp ne pourra pas prévenir Kolakisa en temps réel ; la synchronisation horaire reste active." }));
      else {
        var code = h("code", { class: "mk-mc-url", text: w.url });
        whs.appendChild(h("p", { class: "mk-mc-sub", text: "Mailchimp ne signe pas ses webhooks : cette adresse contient un jeton secret. Ne la partagez pas. Installez-la en un clic depuis l'onglet « Webhooks »." }));
        whs.appendChild(code);
        whs.appendChild(h("div", { class: "mk-mc-actions" },
          button("Copier l'adresse", async function () { try { await navigator.clipboard.writeText(w.url); flash("Adresse copiée.", "ok"); } catch (e) { flash("Copie impossible : sélectionnez l'adresse et copiez-la manuellement.", "error"); } }),
          button("Régénérer le jeton", async function () {
            if (!(await M.confirmDialog({ title: "Régénérer le jeton ?", text: "L'ancienne adresse cesse de fonctionner immédiatement. Réinstallez ensuite le webhook depuis l'onglet « Webhooks ».", label: "Régénérer", danger: true }))) return;
            try { await api("POST", "/jeton-webhook/regenerer", {}); flash("Jeton régénéré. Réinstallez les webhooks.", "ok"); M.renderTab(); } catch (e) { fail(e); }
          }, { danger: true })));
      }
    } catch (e) { whs.appendChild(h("p", { class: "mk-mc-note is-bad", text: e.message })); }
  } });

  /* ---------- Vue d'ensemble ---------- */
  M.registerTab({ id: "apercu", label: "Vue d'ensemble", needsConnection: true, render: async function (el) {
    var d = await api("GET", "/tableau-de-bord");
    var t = d.totals;
    var tiles = h("div", { class: "mk-mc-tiles" });
    [["Contacts", fmtNum(t.contacts)], ["Audiences", fmtNum(t.audiences)], ["Campagnes", fmtNum(t.campaigns)], ["Taux d'ouverture moyen", pct(t.avgOpenRate)], ["Revenus des campagnes", M.money(t.revenue)]].forEach(function (x) { tiles.appendChild(h("div", { class: "mk-mc-tile" }, h("span", { class: "mk-mc-tile-v", text: x[1] }), h("span", { class: "mk-mc-tile-l", text: x[0] }))); });
    el.appendChild(tiles);
    if (d.alerts.length) el.appendChild(h("div", { class: "mk-mc-alerts", role: "region", "aria-label": "Alertes" }, d.alerts.map(function (a) { return h("p", { class: "mk-mc-note " + (a.level === "danger" ? "is-bad" : "is-warn"), text: a.text }); })));
    var gsec = h("section", { class: "mk-mc-card" }, h("h3", { text: "Évolution des abonnés (30 derniers jours)" }));
    if (d.growth.length) {
      gsec.appendChild(M.barChart("Nouveaux abonnés par jour", d.growth.map(function (g) { return { label: String(g.day).slice(5), value: g.subscribed, kind: "ok" }; })));
      gsec.appendChild(h("details", {}, h("summary", { text: "Voir les valeurs" }), table("Abonnés par jour", [{ label: "Jour", cell: function (g) { return g.day; } }, { label: "Inscriptions", cell: function (g) { return fmtNum(g.subscribed); } }, { label: "Désinscriptions", cell: function (g) { return fmtNum(g.unsubscribed); } }], d.growth)));
    } else gsec.appendChild(M.empty("Pas encore de données d'activité (la première audience n'a pas d'activité récente)."));
    el.appendChild(gsec);
    var csec = h("section", { class: "mk-mc-card" }, h("h3", { text: "Dernières campagnes" }));
    if (!d.recentCampaigns.length) csec.appendChild(M.empty("Aucune campagne. Créez-en une dans l'onglet « Campagnes »."));
    else csec.appendChild(table("Dernières campagnes", [
      { label: "Campagne", cell: function (c) { return c.title || c.subject || c.id; } }, { label: "Statut", cell: function (c) { return M.statusBadge(c.status); } },
      { label: "Envoi", cell: function (c) { return M.fmtDate(c.sendTime); } }, { label: "Envoyés", cell: function (c) { return fmtNum(c.sent); } },
      { label: "Ouvertures", cell: function (c) { return c.report && c.report.openRate !== undefined ? pct(c.report.openRate) : "—"; } }, { label: "Clics", cell: function (c) { return c.report && c.report.clickRate !== undefined ? pct(c.report.clickRate) : "—"; } }], d.recentCampaigns));
    el.appendChild(csec);
  } });

  /* ---------- Audiences ---------- */
  var MERGE_TYPES = [["text", "Texte"], ["number", "Nombre"], ["address", "Adresse"], ["phone", "Téléphone"], ["date", "Date"], ["url", "Adresse web"], ["imageurl", "Image"], ["radio", "Choix unique (boutons)"], ["dropdown", "Choix unique (liste)"], ["birthday", "Anniversaire"], ["zip", "Code postal"]];
  var audienceFields = function (a) {
    var cd = (a && a.campaign_defaults) || {}, c = (a && a.contact) || {};
    return [
      { name: "name", label: "Nom de l'audience", required: true, value: a ? a.name : "" },
      { name: "permission_reminder", label: "Rappel d'autorisation", required: true, type: "textarea", rows: 3, value: a ? a.permission_reminder : "Vous recevez cet e-mail car vous vous êtes inscrit sur notre site.", hint: "Texte affiché en pied d'e-mail pour rappeler pourquoi la personne reçoit vos messages." },
      { name: "from_name", label: "Nom de l'expéditeur par défaut", required: true, value: cd.from_name || "" },
      { name: "from_email", label: "Adresse de l'expéditeur par défaut", required: true, type: "email", value: cd.from_email || "" },
      { name: "subject", label: "Objet par défaut", value: cd.subject || "" },
      { name: "language", label: "Langue", value: cd.language || "fr", hint: "Code à deux lettres, par exemple fr ou en." }
    ].concat(a ? [{ name: "double_optin", label: "Double confirmation (les nouveaux inscrits confirment par e-mail)", type: "checkbox", value: a.double_optin }] : [
      { name: "company", label: "Société (obligatoire par la loi, affichée en pied d'e-mail)", required: true, value: c.company || "" },
      { name: "address1", label: "Adresse postale", required: true, value: c.address1 || "" },
      { name: "city", label: "Ville", required: true, value: c.city || "" },
      { name: "state", label: "Région / département", required: true, value: c.state || "" },
      { name: "zip", label: "Code postal", required: true, value: c.zip || "" },
      { name: "country", label: "Pays (code à deux lettres)", required: true, value: c.country || "FR" }]);
  };
  function audienceBody(v, creating) {
    var body = { name: v.name, permission_reminder: v.permission_reminder, campaign_defaults: { from_name: v.from_name, from_email: v.from_email, subject: v.subject || "", language: v.language || "fr" } };
    if (creating) { body.contact = { company: v.company, address1: v.address1, city: v.city, state: v.state, zip: v.zip, country: v.country }; body.email_type_option = false; }
    else body.double_optin = Boolean(v.double_optin);
    return body;
  }
  function openCsvImport(a, opener) {
    var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-labelledby": "mc-imp-t" });
    var body = h("div");
    dlg.appendChild(h("h2", { id: "mc-imp-t", text: "Importer des contacts dans « " + a.name + " »" }));
    dlg.appendChild(body);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    var fileInput = h("input", { type: "file", accept: ".csv,text/csv,text/plain" });
    body.appendChild(h("p", { text: "Choisissez un fichier CSV (virgule ou point-virgule, première ligne = titres des colonnes, 5 000 lignes au plus)." }));
    body.appendChild(field("Fichier CSV", fileInput));
    var mappingBox = h("div");
    body.appendChild(mappingBox);
    var parsed = null;
    fileInput.addEventListener("change", async function () {
      clear2(mappingBox);
      var f = fileInput.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { mappingBox.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: "Fichier trop volumineux (2 Mo au plus)." })); return; }
      parsed = M.parseCsv(await f.text());
      if (!parsed.rows.length) { mappingBox.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: "Le fichier ne contient aucune ligne de données." })); return; }
      if (parsed.rows.length > 5000) { mappingBox.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: "Plus de 5 000 lignes (" + fmtNum(parsed.rows.length) + ") : découpez le fichier." })); return; }
      var fields = [];
      try { fields = (await api("GET", "/audiences/" + a.id + "/champs?count=100")).merge_fields || []; } catch (e) { fields = []; }
      if (!fields.length) fields = [{ tag: "FNAME", name: "Prénom" }, { tag: "LNAME", name: "Nom" }];
      var targets = [["", "— Ignorer cette colonne —"], ["email", "Adresse e-mail"], ["tags", "Tags (séparés par des virgules)"]].concat(fields.filter(function (x) { return x.tag !== "EMAIL"; }).map(function (x) { return [x.tag, x.name + " (" + x.tag + ")"]; }));
      var guess = function (name) { var n = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); if (/e-?mail|courriel|mail/.test(n)) return "email"; if (/^(prenom|first)/.test(n)) return "FNAME"; if (/^(nom|last|name)/.test(n)) return "LNAME"; if (/tag|etiquette/.test(n)) return "tags"; return ""; };
      var selects = parsed.header.map(function (name) { var s = select(targets, guess(name)); s.setAttribute("aria-label", "Colonne « " + name + " » : champ de destination"); return s; });
      var map = table("Correspondance des colonnes", [{ label: "Colonne du fichier", cell: function (c, i) { return c; } }, { label: "Exemple", cell: function (c, i) { return (parsed.rows[0][i] || "").slice(0, 40); } }, { label: "Importer dans", cell: function (c, i) { return selects[i]; } }], parsed.header);
      mappingBox.appendChild(h("h3", { text: "Correspondance des colonnes" })); mappingBox.appendChild(map);
      var attest = h("input", { type: "checkbox", id: "mc-attest" });
      var upd = h("input", { type: "checkbox", id: "mc-upd" });
      var tag = h("input", { type: "text", placeholder: "ex. import-novembre", maxlength: 60 });
      mappingBox.appendChild(field("Tag à ajouter à tous les contacts importés (facultatif)", tag));
      mappingBox.appendChild(h("div", { class: "mk-mc-check" }, attest, h("label", { for: "mc-attest", text: "Je certifie que ces personnes ont donné leur consentement à recevoir mes e-mails" }), h("small", { text: "Sans cette case, les contacts sont importés « en attente » et Mailchimp leur envoie lui-même un e-mail de confirmation." })));
      mappingBox.appendChild(h("div", { class: "mk-mc-check" }, upd, h("label", { for: "mc-upd", text: "Mettre à jour les contacts déjà présents" }), h("small", { text: "Un contact désabonné ou supprimé n'est jamais réabonné." })));
      var go = button("Importer " + fmtNum(parsed.rows.length) + " ligne(s)", null, { primary: true });
      var result = h("div", { "aria-live": "polite" });
      go.addEventListener("click", async function () {
        var emailCol = selects.findIndex(function (s) { return s.value === "email"; });
        if (emailCol < 0) { flash("Choisissez la colonne qui contient les adresses e-mail.", "error"); return; }
        var used = {}; var dup = false;
        selects.forEach(function (s) { if (s.value) { if (used[s.value]) dup = true; used[s.value] = true; } });
        if (dup) { flash("Un même champ de destination est choisi deux fois.", "error"); return; }
        var rows = parsed.rows.map(function (r) { var o = {}; selects.forEach(function (s, i) { if (s.value && (r[i] || "").trim()) o[s.value] = r[i].trim(); }); return o; });
        go.disabled = true; M.busy(dlg, true);
        try {
          var rep = await api("POST", "/audiences/" + a.id + "/import", { rows: rows, attestConsent: attest.checked, updateExisting: upd.checked, tags: tag.value.trim() ? [tag.value.trim()] : [] });
          clear2(result);
          result.appendChild(h("p", { class: "mk-mc-note is-ok", text: "Import terminé : " + fmtNum(rep.created) + " créé(s), " + fmtNum(rep.updated) + " mis à jour, statut « " + M.statusFr(rep.status) + " »." }));
          var det = [["Adresses invalides", rep.invalid.length], ["Doublons dans le fichier", rep.duplicates], ["Écartés (désinscrits, rebonds ou plaintes chez Kolakisa)", rep.blocked], ["Refusés par Mailchimp", rep.errors.length]];
          result.appendChild(table("Détail de l'import", [{ label: "Résultat", cell: function (r) { return r[0]; } }, { label: "Nombre", cell: function (r) { return fmtNum(r[1]); } }], det));
          if (rep.invalid.length) result.appendChild(h("details", {}, h("summary", { text: "Lignes invalides" }), h("ul", {}, rep.invalid.map(function (x) { return h("li", { text: "Ligne " + x.line + " : " + x.reason }); }))));
          if (rep.errors.length) result.appendChild(h("details", {}, h("summary", { text: "Refus de Mailchimp" }), h("ul", {}, rep.errors.map(function (x) { return h("li", { text: x.email + " : " + x.message }); }))));
          state2.dirty = true;
        } catch (e) { clear2(result); result.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
        finally { go.disabled = false; M.busy(dlg, false); }
      });
      mappingBox.appendChild(h("div", { class: "mk-mc-actions" }, go));
      mappingBox.appendChild(result);
    });
    body.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); })));
    fileInput.focus();
  }
  var state2 = { dirty: false };
  function clear2(el) { M.clear(el); }

  function simpleList(opts) {
    var box = h("section", { class: "mk-mc-card", "aria-label": opts.title }, h("h3", { text: opts.title }));
    var holder = h("div");
    var tools = h("div", { class: "mk-mc-actions" });
    if (opts.create) tools.appendChild(button(opts.create.label, function (ev) {
      M.formDialog({ title: opts.create.label, fields: opts.create.fields, submitLabel: "Créer", returnFocus: ev.currentTarget, onSubmit: async function (v) { await opts.create.submit(v); flash("Créé.", "ok"); load(); } });
    }));
    tools.appendChild(button("Actualiser", function () { load(); }));
    box.appendChild(tools); box.appendChild(holder);
    async function load() {
      clear2(holder); holder.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
      try { var rows = await opts.load(); clear2(holder); holder.appendChild(rows.length ? table(opts.title, opts.columns(load), rows) : M.empty(opts.empty || "Aucun élément.")); }
      catch (e) { clear2(holder); holder.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
    }
    load();
    return box;
  }
  var del = function (label, text, path, after, typed) {
    return button("Supprimer", async function () {
      if (!(await M.confirmDialog({ title: label, text: text, label: "Supprimer", danger: true, typed: typed }))) return;
      try { await api("DELETE", path + (path.indexOf("?") < 0 ? "?confirm=1" : "&confirm=1")); flash("Supprimé.", "ok"); after(); } catch (e) { fail(e); }
    }, { danger: true });
  };

  M.simpleList = simpleList; M.del = del;
  async function audienceDetail(el, a, back) {
    M.clear(el);
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("← Retour aux audiences", back)));
    el.appendChild(h("h3", { text: a.name }));
    var st = a.stats || {};
    var tiles = h("div", { class: "mk-mc-tiles" });
    [["Contacts abonnés", st.member_count], ["Désabonnés", st.unsubscribe_count], ["Adresses invalides", st.cleaned_count], ["Taux d'ouverture", pct(st.open_rate)], ["Taux de clic", pct(st.click_rate)], ["Croissance moyenne / mois", st.avg_sub_rate]].forEach(function (x) { tiles.appendChild(h("div", { class: "mk-mc-tile" }, h("span", { class: "mk-mc-tile-v", text: typeof x[1] === "number" ? fmtNum(x[1]) : (x[1] === undefined ? "—" : x[1]) }), h("span", { class: "mk-mc-tile-l", text: x[0] }))); });
    el.appendChild(tiles);
    var grow = h("section", { class: "mk-mc-card" }, h("h3", { text: "Croissance de l'audience" }));
    el.appendChild(grow);
    api("GET", "/audiences/" + a.id + "/croissance?count=12&sort_dir=DESC").then(function (g) {
      var items = (g.history || []).slice().reverse();
      if (!items.length) { grow.appendChild(M.empty("Pas encore d'historique de croissance.")); return; }
      grow.appendChild(M.barChart("Abonnés par mois", items.map(function (m) { return { label: String(m.month).slice(2), value: m.existing || 0, kind: "info" }; })));
      grow.appendChild(h("details", {}, h("summary", { text: "Voir les valeurs" }), table("Croissance par mois", [{ label: "Mois", cell: function (m) { return m.month; } }, { label: "Abonnés", cell: function (m) { return fmtNum(m.existing); } }, { label: "Inscriptions (formulaires)", cell: function (m) { return fmtNum(m.optins); } }, { label: "Imports", cell: function (m) { return fmtNum(m.imports); } }], items)));
    }).catch(function (e) { grow.appendChild(h("p", { class: "mk-mc-note is-bad", text: e.message })); });

    el.appendChild(simpleList({ title: "Champs personnalisés (merge fields)", empty: "Aucun champ personnalisé.",
      load: async function () { return (await api("GET", "/audiences/" + a.id + "/champs?count=100")).merge_fields || []; },
      columns: function (reload) { return [{ label: "Nom", cell: function (r) { return r.name; } }, { label: "Balise", cell: function (r) { return h("code", { text: "*|" + r.tag + "|*" }); } }, { label: "Type", cell: function (r) { return r.type; } }, { label: "Obligatoire", cell: function (r) { return r.required ? "Oui" : "Non"; } },
        { label: "Actions", cell: function (r) { return r.tag === "EMAIL" ? "—" : del("Supprimer le champ « " + r.name + " » ?", "Les valeurs de ce champ seront perdues chez Mailchimp.", "/audiences/" + a.id + "/champs/" + r.merge_id, reload); } }]; },
      create: { label: "Ajouter un champ", fields: [{ name: "name", label: "Nom du champ", required: true }, { name: "tag", label: "Balise (MAJUSCULES, 10 caractères au plus)", hint: "Exemple : VILLE. Laissez vide pour la générer." }, { name: "type", label: "Type", type: "select", options: MERGE_TYPES, value: "text" }, { name: "required", label: "Champ obligatoire dans les formulaires", type: "checkbox" }],
        submit: function (v) { var b = { name: v.name, type: v.type, required: v.required }; if (v.tag) b.tag = v.tag.toUpperCase(); return api("POST", "/audiences/" + a.id + "/champs", b); } } }));

    el.appendChild(simpleList({ title: "Segments", empty: "Aucun segment.",
      load: async function () { return (await api("GET", "/audiences/" + a.id + "/segments?count=100&type=saved")).segments || []; },
      columns: function (reload) { return [{ label: "Nom", cell: function (r) { return r.name; } }, { label: "Contacts", cell: function (r) { return fmtNum(r.member_count); } }, { label: "Actions", cell: function (r) { return del("Supprimer le segment « " + r.name + " » ?", "Les contacts restent dans l'audience.", "/audiences/" + a.id + "/segments/" + r.id, reload); } }]; },
      create: { label: "Créer un segment", fields: [{ name: "name", label: "Nom du segment", required: true }, { name: "field", label: "Champ à comparer (balise, ex. VILLE ou FNAME)", required: true, value: "FNAME" }, { name: "op", label: "Condition", type: "select", options: [["is", "est égal à"], ["not", "est différent de"], ["contains", "contient"], ["notcontain", "ne contient pas"], ["starts", "commence par"], ["ends", "finit par"]], value: "is" }, { name: "value", label: "Valeur", required: true }],
        submit: function (v) { return api("POST", "/audiences/" + a.id + "/segments", { name: v.name, options: { match: "all", conditions: [{ condition_type: "TextMerge", field: v.field.toUpperCase(), op: v.op, value: v.value }] } }); } } }));

    el.appendChild(simpleList({ title: "Tags", empty: "Aucun tag.",
      load: async function () { return (await api("GET", "/audiences/" + a.id + "/tags")).tags || []; },
      columns: function () { return [{ label: "Tag", cell: function (r) { return r.name; } }, { label: "Identifiant", cell: function (r) { return String(r.id); } }]; },
      create: { label: "Créer un tag", fields: [{ name: "name", label: "Nom du tag", required: true }, { name: "emails", label: "Adresses e-mail à taguer (une par ligne, facultatif)", type: "textarea", rows: 4 }],
        submit: function (v) { return api("POST", "/audiences/" + a.id + "/segments", { name: v.name, static_segment: v.emails.split(/\s+/).filter(function (x) { return x.indexOf("@") > 0; }) }); } } }));

    el.appendChild(simpleList({ title: "Groupes d'intérêts", empty: "Aucun groupe d'intérêts.",
      load: async function () { return (await api("GET", "/audiences/" + a.id + "/groupes?count=100")).categories || []; },
      columns: function (reload) { return [{ label: "Titre", cell: function (r) { return r.title; } }, { label: "Type", cell: function (r) { return r.type; } },
        { label: "Actions", cell: function (r) { return h("span", { class: "mk-mc-inline" }, button("Intérêts", function (ev) { interestsDialog(a, r, ev.currentTarget); }), del("Supprimer le groupe « " + r.title + " » ?", "Ses intérêts seront supprimés.", "/audiences/" + a.id + "/groupes/" + r.id, reload)); } }]; },
      create: { label: "Créer un groupe", fields: [{ name: "title", label: "Titre", required: true }, { name: "type", label: "Présentation", type: "select", options: [["checkboxes", "Cases à cocher"], ["dropdown", "Liste déroulante"], ["radio", "Boutons radio"], ["hidden", "Masqué"]], value: "checkboxes" }],
        submit: function (v) { return api("POST", "/audiences/" + a.id + "/groupes", { title: v.title, type: v.type }); } } }));
  }
  function interestsDialog(a, cat, opener) {
    var dlg = h("dialog", { class: "mk-mc-dialog", "aria-labelledby": "mc-int-t" });
    var holder = h("div");
    dlg.appendChild(h("h2", { id: "mc-int-t", text: "Intérêts de « " + cat.title + " »" }));
    dlg.appendChild(holder);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
    document.body.appendChild(dlg); dlg.showModal();
    async function load() {
      clear2(holder);
      try {
        var list = (await api("GET", "/audiences/" + a.id + "/groupes/" + cat.id + "/interets?count=100")).interests || [];
        holder.appendChild(list.length ? table("Intérêts", [{ label: "Nom", cell: function (r) { return r.name; } }, { label: "Abonnés", cell: function (r) { return fmtNum(r.subscriber_count); } }, { label: "Actions", cell: function (r) { return del("Supprimer l'intérêt « " + r.name + " » ?", "Il disparaît du groupe.", "/audiences/" + a.id + "/groupes/" + cat.id + "/interets/" + r.id, load); } }], list) : M.empty("Aucun intérêt."));
      } catch (e) { holder.appendChild(h("p", { class: "mk-mc-note is-bad", text: e.message })); }
      var input = h("input", { type: "text", maxlength: 100 });
      var add = button("Ajouter", async function () { if (!input.value.trim()) return; try { await api("POST", "/audiences/" + a.id + "/groupes/" + cat.id + "/interets", { name: input.value.trim() }); load(); } catch (e) { fail(e); } }, { primary: true });
      holder.appendChild(field("Nouvel intérêt", input)); holder.appendChild(h("div", { class: "mk-mc-actions" }, add, button("Fermer", function () { dlg.close(); })));
    }
    load();
  }

  M.registerTab({ id: "audiences", label: "Audiences", needsConnection: true, render: async function (el) {
    var audiences = await M.loadAudiences(true);
    function list() {
      M.clear(el);
      var tools = h("div", { class: "mk-mc-actions" },
        button("Créer une audience", function (ev) { M.formDialog({ title: "Créer une audience", fields: audienceFields(null), submitLabel: "Créer", returnFocus: ev.currentTarget, onSubmit: async function (v) { await api("POST", "/audiences", audienceBody(v, true)); flash("Audience créée.", "ok"); M.state.audiences = null; M.renderTab(); } }); }, { primary: true }),
        button("Actualiser", function () { M.state.audiences = null; M.renderTab(); }));
      el.appendChild(tools);
      if (!audiences.length) { el.appendChild(M.empty("Aucune audience chez Mailchimp. Créez-en une pour commencer.")); return; }
      el.appendChild(table("Audiences Mailchimp", [
        { label: "Audience", cell: function (a) { return button(a.name, function () { audienceDetail(el, a, list); }, { aria: "Ouvrir l'audience " + a.name }); } },
        { label: "Contacts", cell: function (a) { return fmtNum(a.stats && a.stats.member_count); } }, { label: "Désabonnés", cell: function (a) { return fmtNum(a.stats && a.stats.unsubscribe_count); } },
        { label: "Invalides", cell: function (a) { return fmtNum(a.stats && a.stats.cleaned_count); } }, { label: "Ouvertures", cell: function (a) { return pct(a.stats && a.stats.open_rate); } }, { label: "Clics", cell: function (a) { return pct(a.stats && a.stats.click_rate); } },
        { label: "Liste Kolakisa", cell: function (a) { return a.localListId ? M.badge("Liée (liste n° " + a.localListId + ")", "ok") : M.badge("Non liée"); } },
        { label: "Actions", cell: function (a) {
          return h("span", { class: "mk-mc-inline" },
            button(a.localListId ? "Délier" : "Lier", async function () {
              try {
                if (a.localListId) { if (!(await M.confirmDialog({ title: "Délier l'audience ?", text: "Les contacts ne seront plus échangés avec Kolakisa pour cette audience. Rien n'est supprimé.", label: "Délier" }))) return; await api("POST", "/audiences/" + a.id + "/delier", {}); }
                else { await api("POST", "/audiences/" + a.id + "/lier", { create: true }); }
                flash(a.localListId ? "Audience déliée." : "Audience liée : une liste Kolakisa a été créée. Lancez une synchronisation pour échanger les contacts.", "ok"); M.state.audiences = null; M.renderTab();
              } catch (e) { fail(e); }
            }),
            button("Importer", function (ev) { openCsvImport(a, ev.currentTarget); }),
            button("Exporter", function (ev) { M.formDialog({ title: "Exporter les contacts de « " + a.name + " »", fields: [{ name: "status", label: "Statut", type: "select", options: [["", "Tous"], ["subscribed", "Abonnés"], ["unsubscribed", "Désabonnés"], ["cleaned", "Adresses invalides"], ["pending", "En attente"]], value: "" }], submitLabel: "Télécharger le CSV", returnFocus: ev.currentTarget, onSubmit: async function (v) { window.location.href = M.BOOT.api + "/audiences/" + a.id + "/export.csv" + q({ status: v.status }); } }); }),
            button("Modifier", function (ev) { M.formDialog({ title: "Modifier l'audience", fields: audienceFields(a), returnFocus: ev.currentTarget, onSubmit: async function (v) { await api("PATCH", "/audiences/" + a.id, audienceBody(v, false)); flash("Audience modifiée.", "ok"); M.state.audiences = null; M.renderTab(); } }); }),
            del("Supprimer l'audience « " + a.name + " » ?", "Tous ses contacts disparaissent chez Mailchimp. Cette action est irréversible.", "/audiences/" + a.id, function () { M.state.audiences = null; M.renderTab(); }, a.name));
        } }], audiences));
    }
    list();
  } });

  /* ---------- Contacts ---------- */
  var STATUS_OPTS = [["", "Tous les statuts"], ["subscribed", "Abonnés"], ["unsubscribed", "Désabonnés"], ["cleaned", "Adresses invalides"], ["pending", "En attente"], ["transactional", "Transactionnels"], ["archived", "Archivés"]];
  M.registerTab({ id: "contacts", label: "Contacts", needsConnection: true, render: async function (el) {
    var audiences = await M.loadAudiences();
    if (!audiences.length) { el.appendChild(M.empty("Aucune audience : créez-en une dans l'onglet « Audiences ».")); return; }
    var view = { list: audiences[0].id, status: "subscribed", offset: 0, count: 25, tag: "", selected: {} };
    var audSel = select(audiences.map(function (a) { return [a.id, a.name]; }), view.list), stSel = select(STATUS_OPTS, view.status);
    var search = h("input", { type: "search", placeholder: "Adresse e-mail exacte", "aria-label": "Rechercher un contact par adresse e-mail" });
    var bar = h("div", { class: "mk-mc-bar2" }, field("Audience", audSel), field("Statut", stSel), field("Rechercher", search));
    var bulk = h("div", { class: "mk-mc-bulk", hidden: true, role: "region", "aria-label": "Actions groupées" });
    var out = h("div", { "aria-live": "polite" });
    el.appendChild(bar);
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("Ajouter un contact", function (ev) { addContact(ev.currentTarget); }, { primary: true }), button("Importer un CSV", function (ev) { openCsvImport(audiences.filter(function (a) { return a.id === view.list; })[0], ev.currentTarget); })));
    el.appendChild(bulk); el.appendChild(out);
    var rowsNow = [];
    function selectedEmails() { return Object.keys(view.selected); }
    function renderBulk() {
      var n = selectedEmails().length;
      bulk.hidden = !n; M.clear(bulk);
      if (!n) return;
      bulk.appendChild(h("strong", { text: n + " contact(s) sélectionné(s)" }));
      var run = async function (title, text, label, fn, danger) {
        if (!(await M.confirmDialog({ title: title, text: text, label: label, danger: danger }))) return;
        var emails = selectedEmails(), ok = 0, errs = [];
        for (var i = 0; i < emails.length; i++) { try { await fn(emails[i]); ok++; } catch (e) { errs.push(emails[i] + " : " + e.message); } flash("Traitement… " + (i + 1) + " / " + emails.length); }
        flash(ok + " contact(s) traité(s)." + (errs.length ? " " + errs.length + " échec(s) : " + errs.slice(0, 3).join(" ; ") : ""), errs.length ? "error" : "ok");
        view.selected = {}; load();
      };
      var path = function (e) { return "/audiences/" + view.list + "/membres/" + enc(e); };
      bulk.appendChild(button("Désabonner", function () { run("Désabonner " + n + " contact(s) ?", "Ils ne recevront plus vos e-mails. La synchronisation répercutera ce choix chez Kolakisa.", "Désabonner", function (e) { return api("PATCH", path(e), { status: "unsubscribed" }); }); }));
      bulk.appendChild(button("Archiver", function () { run("Archiver " + n + " contact(s) ?", "Ils quittent l'audience (réversible par réabonnement volontaire).", "Archiver", function (e) { return api("DELETE", path(e) + "?confirm=1"); }, true); }, { danger: true }));
      var tag = h("input", { type: "text", maxlength: 60, "aria-label": "Nom du tag", placeholder: "Nom du tag" });
      bulk.appendChild(tag);
      bulk.appendChild(button("Ajouter le tag", function () { if (!tag.value.trim()) { flash("Saisissez le nom du tag.", "error"); return; } run("Ajouter le tag « " + tag.value.trim() + " » ?", n + " contact(s) recevront ce tag.", "Ajouter", function (e) { return api("POST", path(e) + "/tags", { tags: [{ name: tag.value.trim(), status: "active" }] }); }); }));
      bulk.appendChild(button("Retirer le tag", function () { if (!tag.value.trim()) { flash("Saisissez le nom du tag.", "error"); return; } run("Retirer le tag « " + tag.value.trim() + " » ?", n + " contact(s) perdront ce tag.", "Retirer", function (e) { return api("POST", path(e) + "/tags", { tags: [{ name: tag.value.trim(), status: "inactive" }] }); }); }));
    }
    async function load() {
      M.clear(out); out.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
      try {
        var d = await api("GET", "/audiences/" + view.list + "/membres" + q({ status: view.status, count: view.count, offset: view.offset, sort_field: "last_changed", sort_dir: "DESC" }));
        rowsNow = d.members || [];
        M.clear(out);
        if (!rowsNow.length) { out.appendChild(M.empty("Aucun contact pour ce filtre.")); renderBulk(); return; }
        out.appendChild(table("Contacts de l'audience", [
          { label: "Sélection", cell: function (m) { var cb = h("input", { type: "checkbox", "aria-label": "Sélectionner " + m.email_address }); cb.checked = Boolean(view.selected[m.email_address]); cb.addEventListener("change", function () { if (cb.checked) view.selected[m.email_address] = true; else delete view.selected[m.email_address]; renderBulk(); }); return cb; } },
          { label: "E-mail", cell: function (m) { return button(m.email_address, function (ev) { contactCard(view.list, m.email_address, ev.currentTarget, load); }, { aria: "Ouvrir la fiche de " + m.email_address }); } },
          { label: "Statut", cell: function (m) { return M.statusBadge(m.status); } },
          { label: "Prénom", cell: function (m) { return (m.merge_fields && m.merge_fields.FNAME) || "—"; } }, { label: "Nom", cell: function (m) { return (m.merge_fields && m.merge_fields.LNAME) || "—"; } },
          { label: "Tags", cell: function (m) { return (m.tags || []).map(function (t) { return t.name; }).join(", ") || "—"; } }, { label: "Dernière modification", cell: function (m) { return M.fmtDate(m.last_changed); } }], rowsNow));
        out.appendChild(M.pager(d.total_items || 0, view.offset, view.count, function (o) { view.offset = o; load(); }));
        renderBulk();
      } catch (e) { M.clear(out); out.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
    }
    audSel.addEventListener("change", function () { view.list = audSel.value; view.offset = 0; view.selected = {}; load(); });
    stSel.addEventListener("change", function () { view.status = stSel.value; view.offset = 0; view.selected = {}; load(); });
    search.addEventListener("keydown", async function (ev) {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      var v = search.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { flash("Saisissez une adresse e-mail complète.", "error"); return; }
      try { var r = await api("GET", "/audiences/" + view.list + "/membres/" + enc(v) + "/existe"); if (r.exists) { flash(""); contactCard(view.list, v, search, load); } else flash("Cette adresse n'existe pas dans l'audience.", "error"); } catch (e) { fail(e); }
    });
    function addContact(opener) {
      M.formDialog({ title: "Ajouter un contact", fields: [{ name: "email", label: "Adresse e-mail", type: "email", required: true }, { name: "fname", label: "Prénom" }, { name: "lname", label: "Nom" }, { name: "tags", label: "Tags (séparés par des virgules)" },
        { name: "consent", label: "Cette personne a donné son consentement à recevoir mes e-mails", type: "checkbox", hint: "Sans cette case, Mailchimp lui envoie un e-mail de confirmation." }], submitLabel: "Ajouter", returnFocus: opener,
        onSubmit: async function (v) { await api("POST", "/audiences/" + view.list + "/membres", { email_address: v.email, status: v.consent ? "subscribed" : "pending", merge_fields: { FNAME: v.fname, LNAME: v.lname }, tags: v.tags ? v.tags.split(",").map(function (t) { return t.trim(); }).filter(Boolean) : [] }); flash("Contact ajouté.", "ok"); load(); } });
    }
    load();
  } });

  function contactCard(listId, email, opener, reload) {
    var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-labelledby": "mc-ct-t" });
    var body = h("div");
    dlg.appendChild(h("h2", { id: "mc-ct-t", text: "Fiche contact : " + email }));
    dlg.appendChild(body);
    dlg.addEventListener("close", function () { dlg.remove(); if (opener && document.contains(opener)) opener.focus(); });
    document.body.appendChild(dlg); dlg.showModal();
    var base = "/audiences/" + listId + "/membres/" + enc(email);
    async function load() {
      clear2(body); body.appendChild(h("p", { class: "mk-mc-loading", text: "Chargement…" }));
      try {
        var m = await api("GET", base);
        clear2(body);
        var dl = h("dl", { class: "mk-mc-dl" });
        [["Statut", M.statusFr(m.status)], ["Prénom", m.merge_fields && m.merge_fields.FNAME], ["Nom", m.merge_fields && m.merge_fields.LNAME], ["Inscrit le", M.fmtDate(m.timestamp_opt || m.timestamp_signup)], ["Dernière modification", M.fmtDate(m.last_changed)], ["Taux d'ouverture", m.stats && pct(m.stats.avg_open_rate)], ["Taux de clic", m.stats && pct(m.stats.avg_click_rate)], ["Langue", m.language], ["Client de messagerie", m.email_client], ["Pays", m.location && m.location.country_code]].forEach(function (r) { dl.appendChild(h("dt", { text: r[0] })); dl.appendChild(h("dd", { text: r[1] || "—" })); });
        body.appendChild(dl);
        var fname = h("input", { type: "text", value: (m.merge_fields && m.merge_fields.FNAME) || "", maxlength: 100 }), lname = h("input", { type: "text", value: (m.merge_fields && m.merge_fields.LNAME) || "", maxlength: 100 });
        var canChange = ["subscribed", "unsubscribed", "pending"].indexOf(m.status) >= 0;
        var stSel = select([["subscribed", "Abonné"], ["unsubscribed", "Désabonné"]], m.status === "unsubscribed" ? "unsubscribed" : "subscribed"); stSel.disabled = !canChange;
        var consent = h("input", { type: "checkbox", id: "mc-ct-c" });
        body.appendChild(h("h3", { text: "Modifier" }));
        body.appendChild(h("div", { class: "mk-mc-bar2" }, field("Prénom", fname), field("Nom", lname), field("Statut", stSel)));
        body.appendChild(h("div", { class: "mk-mc-check" }, consent, h("label", { for: "mc-ct-c", text: "Cette personne a donné son consentement (nécessaire pour abonner)" }), h("small", { text: "Un contact désabonné ne peut pas être réabonné par l'API : il doit se réinscrire lui-même." })));
        body.appendChild(h("div", { class: "mk-mc-actions" }, button("Enregistrer", async function () {
          var b = { merge_fields: { FNAME: fname.value.trim(), LNAME: lname.value.trim() } };
          if (canChange && stSel.value !== m.status) { if (stSel.value === "subscribed" && !consent.checked) { flash("Cochez la case de consentement pour abonner cette personne.", "error"); return; } b.status = stSel.value; }
          try { await api("PATCH", base, b); flash("Contact mis à jour.", "ok"); load(); reload(); } catch (e) { fail(e); }
        }, { primary: true })));
        body.appendChild(h("h3", { text: "Tags" }));
        var tagBox = h("p", {}, ((m.tags || []).length ? m.tags : []).map(function (t) { return h("span", { class: "mk-mc-chip" }, t.name, h("button", { type: "button", class: "mk-mc-x", "aria-label": "Retirer le tag " + t.name, text: "×", onclick: async function () { try { await api("POST", base + "/tags", { tags: [{ name: t.name, status: "inactive" }] }); load(); } catch (e) { fail(e); } } })); }));
        if (!(m.tags || []).length) tagBox.appendChild(document.createTextNode("Aucun tag."));
        body.appendChild(tagBox);
        var tagIn = h("input", { type: "text", maxlength: 60, "aria-label": "Nouveau tag" });
        body.appendChild(h("div", { class: "mk-mc-actions" }, tagIn, button("Ajouter le tag", async function () { if (!tagIn.value.trim()) return; try { await api("POST", base + "/tags", { tags: [{ name: tagIn.value.trim(), status: "active" }] }); load(); } catch (e) { fail(e); } })));
        body.appendChild(h("h3", { text: "Historique d'activité" }));
        var act = h("div"); body.appendChild(act);
        api("GET", base + "/activite?count=20").then(function (a) { var items = a.activity || []; act.appendChild(items.length ? table("Activité du contact", [{ label: "Date", cell: function (x) { return M.fmtDate(x.timestamp); } }, { label: "Action", cell: function (x) { return x.activity_type || x.action || x.type; } }, { label: "Campagne", cell: function (x) { return x.title || x.campaign_id || "—"; } }], items) : M.empty("Aucune activité enregistrée.")); }).catch(function (e) { act.appendChild(h("p", { class: "mk-mc-note", text: e.message })); });
        body.appendChild(h("h3", { text: "Notes" }));
        var notes = h("div"); body.appendChild(notes);
        api("GET", base + "/notes").then(function (n) { var items = n.notes || []; notes.appendChild(items.length ? table("Notes", [{ label: "Date", cell: function (x) { return M.fmtDate(x.created_at); } }, { label: "Note", cell: function (x) { return x.note; } }], items) : M.empty("Aucune note.")); }).catch(function () {});
        var noteIn = h("input", { type: "text", maxlength: 1000, "aria-label": "Nouvelle note" });
        body.appendChild(h("div", { class: "mk-mc-actions" }, noteIn, button("Ajouter la note", async function () { if (!noteIn.value.trim()) return; try { await api("POST", base + "/notes", { note: noteIn.value.trim() }); load(); } catch (e) { fail(e); } })));
        body.appendChild(h("h3", { text: "Zone sensible" }));
        body.appendChild(h("div", { class: "mk-mc-actions" },
          button("Archiver", async function () { if (!(await M.confirmDialog({ title: "Archiver ce contact ?", text: "Il quitte l'audience (réversible si la personne se réinscrit).", label: "Archiver", danger: true }))) return; try { await api("DELETE", base + "?confirm=1"); flash("Contact archivé.", "ok"); dlg.close(); reload(); } catch (e) { fail(e); } }, { danger: true }),
          button("Supprimer définitivement", async function () { if (!(await M.confirmDialog({ title: "Supprimer définitivement ?", text: "Droit à l'effacement : la fiche est détruite chez Mailchimp et l'adresse ne pourra plus être réimportée. Irréversible.", label: "Supprimer définitivement", danger: true, typed: email }))) return; try { await api("POST", base + "/suppression-definitive", { confirm: true }); flash("Contact supprimé définitivement.", "ok"); dlg.close(); reload(); } catch (e) { fail(e); } }, { danger: true })));
        body.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); })));
      } catch (e) { clear2(body); body.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); body.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); }
    }
    load();
  }
})();

/* Mailchimp — onglets Webhooks, Automatisations, Boutiques, Pages, Compte, Transactionnel, Journal. */
(function () {
  "use strict";
  var M = window.__mc;
  if (!M) return;
  var h = M.h, api = M.api, q = M.q, enc = M.enc, button = M.button, field = M.field, select = M.select, table = M.table, flash = M.flash, fail = M.fail, fmtNum = M.fmtNum, pct = M.pct, clear = M.clear, simpleList = M.simpleList, del = M.del;
  var EVENTS = [["subscribe", "Inscription"], ["unsubscribe", "Désinscription"], ["profile", "Modification du profil"], ["cleaned", "Adresse invalide (rebond, plainte)"], ["upemail", "Changement d'adresse"], ["campaign", "Envoi de campagne"]];
  var hideToken = function (u) { return String(u || "").replace(/(\/webhooks\/mailchimp\/\d+\/)[0-9a-f]{48}/, "$1••••••••"); };

  /* ---------- Webhooks ---------- */
  M.registerTab({ id: "webhooks", label: "Webhooks", needsConnection: true, render: async function (el) {
    var audiences = await M.loadAudiences();
    if (!audiences.length) { el.appendChild(M.empty("Aucune audience : créez-en une d'abord.")); return; }
    var sel = select(audiences.map(function (a) { return [a.id, a.name]; }), audiences[0].id);
    el.appendChild(field("Audience", sel));
    var hookBox = h("section", { class: "mk-mc-card", "aria-label": "Webhooks de l'audience" }), logBox = h("section", { class: "mk-mc-card", "aria-label": "Événements reçus" });
    el.appendChild(hookBox); el.appendChild(logBox);
    async function loadHooks() {
      clear(hookBox); hookBox.appendChild(h("h3", { text: "Webhooks configurés chez Mailchimp" }));
      var info = await api("GET", "/webhook-url");
      var tools = h("div", { class: "mk-mc-actions" });
      var inst = button("Installer le webhook Kolakisa", async function () { try { var r = await api("POST", "/audiences/" + sel.value + "/webhooks/installer", {}); flash(r.created ? "Webhook installé : Mailchimp préviendra Kolakisa en temps réel." : "Webhook déjà installé : mis à jour.", "ok"); loadHooks(); } catch (e) { fail(e); } }, { primary: true, disabled: !info.url });
      tools.appendChild(inst);
      tools.appendChild(button("Créer un webhook personnalisé", function (ev) {
        var fields = [{ name: "url", label: "Adresse du webhook (HTTPS)", required: true, type: "url", value: "https://" }].concat(EVENTS.map(function (e) { return { name: "e_" + e[0], label: e[1] + " (" + e[0] + ")", type: "checkbox", value: true }; }), [{ name: "s_user", label: "Source : actions des abonnés", type: "checkbox", value: true }, { name: "s_admin", label: "Source : actions de l'administrateur", type: "checkbox", value: true }, { name: "s_api", label: "Source : appels d'API", type: "checkbox", value: false }]);
        M.formDialog({ title: "Créer un webhook", fields: fields, submitLabel: "Créer", returnFocus: ev.currentTarget, onSubmit: async function (v) {
          if (!/^https:\/\/[^\s]+$/.test(v.url)) throw new Error("L'adresse doit commencer par https://.");
          var events = {}; EVENTS.forEach(function (e) { events[e[0]] = Boolean(v["e_" + e[0]]); });
          await api("POST", "/audiences/" + sel.value + "/webhooks", { url: v.url, events: events, sources: { user: v.s_user, admin: v.s_admin, api: v.s_api } }); flash("Webhook créé.", "ok"); loadHooks();
        } });
      }));
      hookBox.appendChild(tools);
      if (!info.url) hookBox.appendChild(h("p", { class: "mk-mc-note", text: "L'installation en un clic nécessite la variable SITE_URL (HTTPS) sur le serveur." }));
      try {
        var d = await api("GET", "/audiences/" + sel.value + "/webhooks");
        var rows = d.webhooks || [];
        hookBox.appendChild(rows.length ? table("Webhooks de l'audience", [{ label: "Adresse", cell: function (w) { return h("code", { text: hideToken(w.url) }); } },
          { label: "Événements", cell: function (w) { return Object.keys(w.events || {}).filter(function (k) { return w.events[k]; }).join(", ") || "—"; } }, { label: "Sources", cell: function (w) { return Object.keys(w.sources || {}).filter(function (k) { return w.sources[k]; }).join(", ") || "—"; } },
          { label: "Actions", cell: function (w) { return del("Supprimer ce webhook ?", "Mailchimp cessera de prévenir cette adresse.", "/audiences/" + sel.value + "/webhooks/" + w.id, loadHooks); } }], rows) : M.empty("Aucun webhook sur cette audience."));
      } catch (e) { hookBox.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); }
    }
    /* Journal des événements reçus : se met à jour tout seul (toutes les 4 s) tant que l'onglet est ouvert */
    var events = [], lastId = 0, timer = null, fType = "", fStatus = "";
    var typeSel = select([["", "Tous les types"]].concat(EVENTS.map(function (e) { return [e[0], e[0]]; })), ""), stSel = select([["", "Tous les états"], ["applied", "Appliqués"], ["ignored", "Ignorés"], ["failed", "En échec"]], "");
    var logOut = h("div", { "aria-live": "polite" });
    function drawLog() {
      clear(logOut);
      var rows = events.filter(function (e) { return (!fType || e.type === fType) && (!fStatus || e.status === fStatus); });
      if (!rows.length) { logOut.appendChild(M.empty("Aucun événement reçu pour l'instant. Ils apparaissent ici dès que Mailchimp prévient Kolakisa.")); return; }
      logOut.appendChild(table("Événements Mailchimp reçus", [
        { label: "Reçu le", cell: function (e) { return M.fmtDate(e.receivedAt); } }, { label: "Type", cell: function (e) { return e.type; } }, { label: "E-mail", cell: function (e) { return e.email || "—"; } },
        { label: "État", cell: function (e) { return M.statusBadge(e.status); } }, { label: "Détail", cell: function (e) { return e.detail || "—"; } }, { label: "Rejeux", cell: function (e) { return String(e.replays); } },
        { label: "Actions", cell: function (e) { return h("span", { class: "mk-mc-inline" }, button("Charge", function (ev) { var opener = ev.currentTarget; var dlg = h("dialog", { class: "mk-mc-dialog", "aria-label": "Charge de l'événement" }); dlg.appendChild(h("h2", { text: "Événement n° " + e.id })); dlg.appendChild(h("pre", { class: "mk-mc-pre", text: JSON.stringify(e.payload, null, 2) })); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); if (document.contains(opener)) opener.focus(); }); document.body.appendChild(dlg); dlg.showModal(); }),
          button("Rejouer", async function () { try { var r = await api("POST", "/evenements/" + e.id + "/rejouer", {}); flash("Événement rejoué : " + M.statusFr(r.status) + (r.detail ? " — " + r.detail : ""), r.status === "failed" ? "error" : "ok"); await loadLog(true); } catch (x) { fail(x); } })); } }], rows));
    }
    async function loadLog(reset) {
      try {
        var d = await api("GET", "/evenements" + (reset ? "?limit=100" : q({ after: lastId, limit: 100 })));
        var fresh = d.events || [];
        if (reset) events = fresh; else if (fresh.length) events = fresh.slice().reverse().concat(events).slice(0, 300);
        events.forEach(function (e) { if (e.id > lastId) lastId = e.id; });
        if (reset || fresh.length) drawLog();
      } catch (e) { /* la prochaine passe réessaiera */ }
    }
    logBox.appendChild(h("h3", { text: "Événements reçus (temps réel)" }));
    logBox.appendChild(h("div", { class: "mk-mc-bar2" }, field("Type", typeSel), field("État", stSel)));
    logBox.appendChild(logOut);
    typeSel.addEventListener("change", function () { fType = typeSel.value; drawLog(); }); stSel.addEventListener("change", function () { fStatus = stSel.value; drawLog(); });
    sel.addEventListener("change", loadHooks);
    await loadHooks(); await loadLog(true);
    timer = setInterval(function () { if (!document.contains(logBox)) { clearInterval(timer); return; } if (!document.hidden) loadLog(false); }, 4000);
  } });

  /* ---------- Automatisations ---------- */
  function automationDetail(el, a, back) {
    clear(el);
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("← Retour aux automatisations", back)));
    el.appendChild(h("h3", { text: (a.settings && a.settings.title) || a.id }));
    var emails = [];
    var box = h("div"); el.appendChild(box);
    async function load() {
      clear(box);
      try { emails = (await api("GET", "/automatisations/" + a.id + "/emails")).emails || []; } catch (e) { box.appendChild(h("p", { class: "mk-mc-note is-bad", text: e.message })); return; }
      var tools = h("div", { class: "mk-mc-actions" },
        button("Ajouter un contact", function (ev) {
          if (!emails.length) { flash("Cette automatisation n'a pas d'e-mail.", "error"); return; }
          M.formDialog({ title: "Ajouter un contact à l'automatisation", intro: "Le contact doit déjà être abonné à l'audience. Il entre dans la séquence à l'e-mail choisi.", fields: [{ name: "email", label: "Adresse e-mail", type: "email", required: true }, { name: "step", label: "E-mail de la séquence", type: "select", options: emails.map(function (e) { return [e.id, (e.settings && e.settings.title) || e.id]; }), value: emails[0].id }], submitLabel: "Ajouter", returnFocus: ev.currentTarget,
            onSubmit: async function (v) { await api("POST", "/automatisations/" + a.id + "/emails/" + enc(v.step) + "/file", { email_address: v.email }); flash("Contact ajouté à la séquence.", "ok"); load(); } });
        }, { primary: true }),
        button("Retirer un contact", function (ev) { M.formDialog({ title: "Retirer un contact de l'automatisation", intro: "Le contact ne recevra plus cette séquence (définitif pour cette automatisation).", fields: [{ name: "email", label: "Adresse e-mail", type: "email", required: true }], submitLabel: "Retirer", danger: true, returnFocus: ev.currentTarget, onSubmit: async function (v) { await api("POST", "/automatisations/" + a.id + "/retires", { email_address: v.email, confirm: true }); flash("Contact retiré.", "ok"); load(); } }); }, { danger: true }),
        button("Actualiser", load));
      box.appendChild(tools);
      box.appendChild(emails.length ? table("E-mails de la séquence", [
        { label: "E-mail", cell: function (e) { return (e.settings && e.settings.title) || e.id; } }, { label: "Objet", cell: function (e) { return (e.settings && e.settings.subject_line) || "—"; } }, { label: "Statut", cell: function (e) { return M.statusBadge(e.status); } },
        { label: "Délai", cell: function (e) { var d = e.delay || {}; return d.amount !== undefined ? d.amount + " " + d.type + " (" + d.action + ")" : "—"; } }, { label: "Envoyés", cell: function (e) { return fmtNum(e.emails_sent); } },
        { label: "Ouvertures", cell: function (e) { return e.report_summary ? pct(e.report_summary.open_rate) : "—"; } }, { label: "Clics", cell: function (e) { return e.report_summary ? pct(e.report_summary.click_rate) : "—"; } },
        { label: "Actions", cell: function (e) { return h("span", { class: "mk-mc-inline" }, e.status === "sending" ? button("Arrêter", async function () { try { await api("POST", "/automatisations/" + a.id + "/emails/" + enc(e.id) + "/arreter", {}); load(); } catch (x) { fail(x); } }) : button("Démarrer", async function () { if (!(await M.confirmDialog({ title: "Démarrer cet e-mail ?", text: "Les contacts éligibles commenceront à le recevoir.", label: "Démarrer" }))) return; try { await api("POST", "/automatisations/" + a.id + "/emails/" + enc(e.id) + "/demarrer", { confirm: true }); load(); } catch (x) { fail(x); } }),
          button("File d'attente", async function () { try { var qd = (await api("GET", "/automatisations/" + a.id + "/emails/" + enc(e.id) + "/file")).queue || []; var dlg = h("dialog", { class: "mk-mc-dialog", "aria-label": "File d'attente" }); dlg.appendChild(h("h2", { text: "File d'attente de l'e-mail" })); dlg.appendChild(qd.length ? table("Contacts en attente", [{ label: "E-mail", cell: function (x) { return x.email_address; } }, { label: "Prochain envoi", cell: function (x) { return M.fmtDate(x.next_send); } }], qd) : M.empty("Personne n'attend cet e-mail.")); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); }); document.body.appendChild(dlg); dlg.showModal(); } catch (x) { fail(x); } })); } }], emails) : M.empty("Aucun e-mail dans cette automatisation."));
      var removed = h("section", { class: "mk-mc-card" }, h("h3", { text: "Contacts retirés" })); box.appendChild(removed);
      api("GET", "/automatisations/" + a.id + "/retires").then(function (r) { var rows = r.subscribers || []; removed.appendChild(rows.length ? table("Contacts retirés", [{ label: "E-mail", cell: function (x) { return x.email_address; } }], rows) : M.empty("Aucun contact retiré.")); }).catch(function () { removed.remove(); });
    }
    load();
  }
  M.registerTab({ id: "automatisations", label: "Automatisations", needsConnection: true, render: async function (el) {
    function list() {
      clear(el);
      var holder = h("div");
      el.appendChild(h("div", { class: "mk-mc-actions" }, button("Actualiser", list), button("Déclencher une étape de parcours client", function (ev) {
        M.formDialog({ title: "Déclencher une étape de parcours client", intro: "Faire entrer un contact dans un parcours (Customer Journeys) via une étape de type « API ». Les identifiants se trouvent dans l'URL du parcours chez Mailchimp.", fields: [{ name: "journey", label: "Identifiant du parcours", required: true }, { name: "step", label: "Identifiant de l'étape", required: true }, { name: "email", label: "Adresse e-mail du contact", type: "email", required: true }], submitLabel: "Déclencher", returnFocus: ev.currentTarget,
          onSubmit: async function (v) { await api("POST", "/parcours/" + enc(v.journey) + "/etapes/" + enc(v.step) + "/declencher", { email_address: v.email }); flash("Étape déclenchée.", "ok"); } });
      })));
      el.appendChild(holder);
      api("GET", "/automatisations?count=50").then(function (d) {
        var rows = d.automations || [];
        holder.appendChild(rows.length ? table("Automatisations Mailchimp", [
          { label: "Automatisation", cell: function (a) { return button((a.settings && a.settings.title) || a.id, function () { automationDetail(el, a, list); }, { aria: "Ouvrir " + ((a.settings && a.settings.title) || a.id) }); } },
          { label: "Statut", cell: function (a) { return M.statusBadge(a.status); } }, { label: "Déclencheur", cell: function (a) { return (a.trigger_settings && a.trigger_settings.workflow_title) || "—"; } },
          { label: "Envoyés", cell: function (a) { return fmtNum(a.emails_sent); } }, { label: "Ouvertures", cell: function (a) { return a.report_summary ? pct(a.report_summary.open_rate) : "—"; } }, { label: "Clics", cell: function (a) { return a.report_summary ? pct(a.report_summary.click_rate) : "—"; } },
          { label: "Actions", cell: function (a) { return h("span", { class: "mk-mc-inline" },
            a.status === "sending" ? button("Arrêter", async function () { try { await api("POST", "/automatisations/" + a.id + "/arreter", {}); flash("Automatisation arrêtée.", "ok"); list(); } catch (e) { fail(e); } }) : button("Démarrer", async function () { if (!(await M.confirmDialog({ title: "Démarrer l'automatisation ?", text: "Tous ses e-mails seront activés : les contacts éligibles les recevront.", label: "Démarrer" }))) return; try { await api("POST", "/automatisations/" + a.id + "/demarrer", { confirm: true }); flash("Automatisation démarrée.", "ok"); list(); } catch (e) { fail(e); } }),
            button("Archiver", async function () { if (!(await M.confirmDialog({ title: "Archiver cette automatisation ?", text: "Elle quitte la liste active.", label: "Archiver", danger: true }))) return; try { await api("POST", "/automatisations/" + a.id + "/archiver", { confirm: true }); list(); } catch (e) { fail(e); } }, { danger: true })); } }], rows) : M.empty("Aucune automatisation. Créez-les dans Mailchimp (Customer Journeys) ; vous pourrez ensuite y inscrire des contacts depuis ici."));
      }).catch(function (e) { holder.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); });
    }
    list();
  } });

  /* ---------- Boutiques (e-commerce) ---------- */
  function storeDetail(el, s, back) {
    clear(el);
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("← Retour aux boutiques", back)));
    el.appendChild(h("h3", { text: s.name }));
    el.appendChild(h("p", { class: "mk-mc-sub", text: "Devise : " + (s.currency_code || "—") + " · Audience : " + (s.list_id || "—") + " · Produits : " + fmtNum(s.product_count !== undefined ? s.product_count : 0) }));
    var base = "/boutiques/" + enc(s.id);
    el.appendChild(simpleList({ title: "Produits", empty: "Aucun produit.",
      load: async function () { return (await api("GET", base + "/produits?count=100")).products || []; },
      columns: function (reload) { return [{ label: "Produit", cell: function (p) { return p.title; } }, { label: "Identifiant", cell: function (p) { return p.id; } }, { label: "Variantes", cell: function (p) { return fmtNum((p.variants || []).length); } }, { label: "Prix", cell: function (p) { return (p.variants && p.variants[0] && p.variants[0].price !== undefined) ? M.money(p.variants[0].price) : "—"; } }, { label: "Actions", cell: function (p) { return del("Supprimer le produit « " + p.title + " » ?", "Il disparaît du catalogue Mailchimp.", base + "/produits/" + enc(p.id), reload); } }]; },
      create: { label: "Ajouter un produit", fields: [{ name: "id", label: "Identifiant unique du produit", required: true, hint: "Lettres, chiffres, tirets (ex. formation-seo)." }, { name: "title", label: "Titre", required: true }, { name: "price", label: "Prix (nombre)", type: "number", required: true, step: "0.01", min: 0 }, { name: "url", label: "Adresse de la fiche produit (HTTPS)", type: "url" }],
        submit: function (v) { var b = { id: v.id, title: v.title, variants: [{ id: v.id + "-v1", title: v.title, price: Number(v.price) }] }; if (v.url) b.url = v.url; return api("POST", base + "/produits", b); } } }));
    el.appendChild(simpleList({ title: "Commandes", empty: "Aucune commande enregistrée.",
      load: async function () { return (await api("GET", base + "/commandes?count=50")).orders || []; },
      columns: function () { return [{ label: "Commande", cell: function (o) { return o.id; } }, { label: "Client", cell: function (o) { return (o.customer && (o.customer.email_address || o.customer.id)) || "—"; } }, { label: "Total", cell: function (o) { return M.money(o.order_total) + " " + (o.currency_code || ""); } }, { label: "Statut", cell: function (o) { return o.financial_status || "—"; } }, { label: "Date", cell: function (o) { return M.fmtDate(o.processed_at_foreign || o.updated_at); } }, { label: "Campagne", cell: function (o) { return o.campaign_id || "—"; } }]; } }));
    el.appendChild(simpleList({ title: "Clients de la boutique", empty: "Aucun client.",
      load: async function () { return (await api("GET", base + "/clients?count=50")).customers || []; },
      columns: function () { return [{ label: "E-mail", cell: function (c) { return c.email_address; } }, { label: "Nom", cell: function (c) { return [c.first_name, c.last_name].filter(Boolean).join(" ") || "—"; } }, { label: "Commandes", cell: function (c) { return fmtNum(c.orders_count); } }, { label: "Total dépensé", cell: function (c) { return M.money(c.total_spent); } }, { label: "Abonné", cell: function (c) { return c.opt_in_status ? "Oui" : "Non"; } }]; } }));
  }
  M.registerTab({ id: "boutiques", label: "Boutiques", needsConnection: true, render: async function (el) {
    var audiences = await M.loadAudiences();
    function list() {
      clear(el);
      var holder = h("div");
      el.appendChild(h("div", { class: "mk-mc-actions" }, button("Créer une boutique", function (ev) {
        M.formDialog({ title: "Créer une boutique Mailchimp", fields: [{ name: "id", label: "Identifiant unique", required: true, hint: "Lettres, chiffres, tirets (ex. ma-boutique)." }, { name: "name", label: "Nom", required: true }, { name: "list", label: "Audience reliée", type: "select", options: audiences.map(function (a) { return [a.id, a.name]; }), value: audiences[0] && audiences[0].id }, { name: "cur", label: "Devise (code ISO)", required: true, value: "EUR" }, { name: "domain", label: "Domaine de la boutique" }],
          submitLabel: "Créer", returnFocus: ev.currentTarget, onSubmit: async function (v) { var b = { id: v.id, list_id: v.list, name: v.name, currency_code: v.cur.toUpperCase() }; if (v.domain) b.domain = v.domain; await api("POST", "/boutiques", b); flash("Boutique créée.", "ok"); list(); } });
      }, { primary: true }), button("Actualiser", list)));
      el.appendChild(holder);
      api("GET", "/boutiques?count=50").then(function (d) {
        var rows = d.stores || [];
        holder.appendChild(rows.length ? table("Boutiques Mailchimp", [{ label: "Boutique", cell: function (s) { return button(s.name, function () { storeDetail(el, s, list); }, { aria: "Ouvrir la boutique " + s.name }); } }, { label: "Devise", cell: function (s) { return s.currency_code; } }, { label: "Audience", cell: function (s) { return s.list_id; } }, { label: "Actions", cell: function (s) { return del("Supprimer la boutique « " + s.name + " » ?", "Produits, commandes et clients de la boutique seront supprimés chez Mailchimp.", "/boutiques/" + enc(s.id), list, s.name); } }], rows) : M.empty("Aucune boutique chez Mailchimp."));
      }).catch(function (e) { holder.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); });
    }
    list();
  } });

  /* ---------- Pages de destination ---------- */
  M.registerTab({ id: "pages", label: "Pages", needsConnection: true, render: async function (el) {
    el.appendChild(simpleList({ title: "Pages de destination (landing pages)", empty: "Aucune page de destination.",
      load: async function () { return (await api("GET", "/pages?count=50")).landing_pages || []; },
      columns: function (reload) { return [{ label: "Nom", cell: function (p) { return p.name; } }, { label: "Titre", cell: function (p) { return p.title || "—"; } }, { label: "Statut", cell: function (p) { return M.statusBadge(p.status); } }, { label: "Adresse", cell: function (p) { return p.published_url && /^https:\/\//.test(p.published_url) ? h("a", { href: p.published_url, target: "_blank", rel: "noopener noreferrer", text: p.published_url }) : "—"; } },
        { label: "Actions", cell: function (p) { return h("span", { class: "mk-mc-inline" },
          p.status === "published" ? button("Dépublier", async function () { try { await api("POST", "/pages/" + enc(p.id) + "/depublier", {}); flash("Page dépubliée.", "ok"); reload(); } catch (e) { fail(e); } }) : button("Publier", async function () { if (!(await M.confirmDialog({ title: "Publier cette page ?", text: "Elle sera visible publiquement sur Internet.", label: "Publier" }))) return; try { await api("POST", "/pages/" + enc(p.id) + "/publier", { confirm: true }); flash("Page publiée.", "ok"); reload(); } catch (e) { fail(e); } }),
          button("Rapport", async function () { try { var r = await api("GET", "/pages/" + enc(p.id) + "/rapport"); var dlg = h("dialog", { class: "mk-mc-dialog", "aria-label": "Rapport de la page" }); dlg.appendChild(h("h2", { text: "Rapport : " + p.name })); var rows = Object.keys(r).filter(function (k) { return typeof r[k] !== "object"; }).map(function (k) { return [k, r[k]]; }); dlg.appendChild(rows.length ? table("Rapport de la page", [{ label: "Indicateur", cell: function (x) { return x[0]; } }, { label: "Valeur", cell: function (x) { return String(x[1]); } }], rows) : M.empty("Pas encore de données.")); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); }); document.body.appendChild(dlg); dlg.showModal(); } catch (e) { fail(e); } }),
          del("Supprimer la page « " + p.name + " » ?", "Elle disparaît chez Mailchimp.", "/pages/" + enc(p.id), reload)); } }]; },
      create: { label: "Créer une page", fields: [{ name: "name", label: "Nom interne", required: true }, { name: "title", label: "Titre affiché", required: true }], submit: function (v) { return api("POST", "/pages" + q({ use_default_list: "true" }), { type: "signup", name: v.name, title: v.title }); } } }));
  } });

  /* ---------- Compte ---------- */
  M.registerTab({ id: "compte", label: "Compte", needsConnection: true, render: async function (el) {
    var info = await api("GET", "/compte");
    var dl = h("dl", { class: "mk-mc-dl" });
    [["Compte", info.account_name], ["Contact principal", [info.first_name, info.last_name].filter(Boolean).join(" ")], ["E-mail", info.email], ["Rôle", info.role], ["Offre payante", info.pro_enabled ? "Oui" : "Non"], ["Abonnés (total)", fmtNum(info.total_subscribers)], ["Secteur", info.industry_stats && info.industry_stats.type], ["Société", info.contact && info.contact.company]].forEach(function (r) { dl.appendChild(h("dt", { text: r[0] })); dl.appendChild(h("dd", { text: r[1] || "—" })); });
    el.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Informations du compte" }), dl, h("p", { class: "mk-mc-sub", text: "La gestion des utilisateurs du compte n'est pas exposée par l'API Marketing de Mailchimp : elle se fait dans Mailchimp → Compte → Utilisateurs." })));
    el.appendChild(simpleList({ title: "Domaines d'expédition vérifiés", empty: "Aucun domaine.",
      load: async function () { return (await api("GET", "/compte/domaines")).domains || []; },
      columns: function (reload) { return [{ label: "Domaine", cell: function (d) { return d.domain; } }, { label: "Vérifié", cell: function (d) { return d.verified ? M.badge("Oui", "ok") : M.badge("Non", "warn"); } }, { label: "Adresse de vérification", cell: function (d) { return d.verification_email || "—"; } },
        { label: "Actions", cell: function (d) { return h("span", { class: "mk-mc-inline" }, d.verified ? null : button("Saisir le code reçu", function (ev) { M.formDialog({ title: "Vérifier " + d.domain, fields: [{ name: "code", label: "Code reçu par e-mail", required: true }], submitLabel: "Vérifier", returnFocus: ev.currentTarget, onSubmit: async function (v) { await api("POST", "/compte/domaines/" + enc(d.domain) + "/verifier", { code: v.code }); flash("Domaine vérifié.", "ok"); reload(); } }); }), del("Supprimer le domaine « " + d.domain + " » ?", "Vous ne pourrez plus envoyer depuis ce domaine.", "/compte/domaines/" + enc(d.domain), reload)); } }]; },
      create: { label: "Ajouter un domaine", fields: [{ name: "email", label: "Adresse e-mail sur ce domaine (reçoit le code)", type: "email", required: true }], submit: function (v) { return api("POST", "/compte/domaines", { verification_email: v.email }); } } }));
    el.appendChild(simpleList({ title: "Applications autorisées", empty: "Aucune application autorisée.",
      load: async function () { return (await api("GET", "/compte/applications")).apps || []; },
      columns: function () { return [{ label: "Application", cell: function (a) { return a.name; } }, { label: "Description", cell: function (a) { return a.description || "—"; } }, { label: "Utilisateurs", cell: function (a) { return fmtNum((a.users || []).length); } }]; } }));
    el.appendChild(simpleList({ title: "Activité récente du compte", empty: "Aucune activité.",
      load: async function () { return (await api("GET", "/compte/activite?count=20")).chimp_chatter || []; },
      columns: function () { return [{ label: "Date", cell: function (c) { return M.fmtDate(c.update_time); } }, { label: "Type", cell: function (c) { return c.type; } }, { label: "Message", cell: function (c) { return c.message; } }]; } }));
  } });

  /* ---------- Transactionnel (Mandrill) ---------- */
  var tx = function (op, body) { return api("POST", "/transactionnel/" + op, body || {}); };
  M.registerTab({ id: "transactionnel", label: "Transactionnel", needsConnection: true, render: async function (el) {
    var st = M.state.status;
    el.appendChild(h("p", { class: "mk-mc-sub", text: "Mailchimp Transactional (Mandrill) envoie les e-mails de service (reçus, mots de passe). C'est un module complémentaire payant de Mailchimp, avec sa propre clé d'API." }));
    var key = h("input", { type: "password", autocomplete: "off", spellcheck: "false", placeholder: st.transactionalKeySet ? "Clé enregistrée (non affichée) : saisissez-en une nouvelle pour la remplacer" : "Clé d'API Mandrill" });
    var form = h("form", { class: "mk-mc-form", novalidate: true }, field("Clé d'API Mailchimp Transactional", key, "Mailchimp → Transactional → Settings → SMTP & API Info. Enregistrée chiffrée, jamais réaffichée."), h("div", { class: "mk-mc-actions" }, button("Enregistrer la clé", null, { primary: true, type: "submit" }), st.transactionalKeySet ? button("Effacer la clé", async function () { try { var r = await api("PUT", "/transactionnel/cle", { key: "" }); M.state.status = r.status; flash("Clé effacée.", "ok"); M.renderTab(); } catch (e) { fail(e); } }, { danger: true }) : null));
    form.addEventListener("submit", async function (ev) { ev.preventDefault(); try { var r = await api("PUT", "/transactionnel/cle", { key: key.value.trim() }); M.state.status = r.status; key.value = ""; flash("Clé enregistrée.", "ok"); M.renderTab(); } catch (e) { fail(e); } });
    el.appendChild(form);
    if (!st.transactionalKeySet) return;
    var info;
    try { info = await tx("users.info"); } catch (e) { el.appendChild(h("p", { class: "mk-mc-note is-bad", role: "alert", text: e.message })); return; }
    el.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Compte Transactional" }), h("div", { class: "mk-mc-tiles" }, [["Compte", info.username], ["Réputation", info.reputation], ["Quota horaire", info.hourly_quota], ["Envoyés aujourd'hui", info.stats && info.stats.today && info.stats.today.sent]].map(function (x) { return h("div", { class: "mk-mc-tile" }, h("span", { class: "mk-mc-tile-v", text: x[1] === undefined || x[1] === null ? "—" : String(x[1]) }), h("span", { class: "mk-mc-tile-l", text: x[0] })); }))));
    el.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Envoyer un e-mail transactionnel" }), h("div", { class: "mk-mc-actions" }, button("Envoyer un e-mail…", function (ev) {
      M.formDialog({ title: "Envoyer un e-mail transactionnel", intro: "Cet envoi est réel. Les adresses en rebond dur ou en plainte sont refusées.", fields: [{ name: "to", label: "Destinataire", type: "email", required: true }, { name: "from_email", label: "Adresse d'expédition (domaine vérifié)", type: "email", required: true }, { name: "from_name", label: "Nom de l'expéditeur" }, { name: "subject", label: "Objet", required: true }, { name: "html", label: "Message (HTML)", type: "textarea", required: true, rows: 6 }, { name: "ok", label: "Je confirme l'envoi réel de cet e-mail", type: "checkbox" }], submitLabel: "Envoyer", returnFocus: ev.currentTarget,
        onSubmit: async function (v) { if (!v.ok) throw new Error("Cochez la case de confirmation."); var r = await tx("messages.send", { message: { subject: v.subject, from_email: v.from_email, from_name: v.from_name || undefined, html: v.html, to: [{ email: v.to, type: "to" }] }, confirm: true }); flash("Envoi demandé : " + ((r[0] && r[0].status) || "ok") + (r[0] && r[0].reject_reason ? " (" + r[0].reject_reason + ")" : "") + ".", "ok"); } });
    }, { primary: true }))));
    var searchIn = h("input", { type: "text", value: "*", "aria-label": "Recherche de messages", maxlength: 200 }), sOut = h("div", { "aria-live": "polite" });
    var doSearch = async function () { clear(sOut); try { var rows = await tx("messages.search", { query: searchIn.value.trim() || "*", limit: 50 }); sOut.appendChild(rows.length ? table("Messages envoyés", [{ label: "Date", cell: function (m) { return M.fmtDate(m.ts * 1000); } }, { label: "Destinataire", cell: function (m) { return m.email; } }, { label: "Objet", cell: function (m) { return m.subject; } }, { label: "État", cell: function (m) { return m.state; } }, { label: "Ouvertures", cell: function (m) { return fmtNum(m.opens); } }, { label: "Clics", cell: function (m) { return fmtNum(m.clicks); } }], rows) : M.empty("Aucun message.")); } catch (e) { sOut.appendChild(h("p", { class: "mk-mc-note is-bad", text: e.message })); } };
    el.appendChild(h("section", { class: "mk-mc-card" }, h("h3", { text: "Suivi des messages" }), field("Recherche (syntaxe Mandrill, ex. email:client@exemple.fr)", searchIn), h("div", { class: "mk-mc-actions" }, button("Rechercher", doSearch, { primary: true })), sOut));
    var arr = function (op, body) { return async function () { var r = await tx(op, body); return Array.isArray(r) ? r : []; }; };
    el.appendChild(simpleList({ title: "Expéditeurs", empty: "Aucun expéditeur.", load: arr("senders.list"), columns: function () { return [{ label: "Adresse", cell: function (s) { return s.address; } }, { label: "Envois", cell: function (s) { return fmtNum(s.sent); } }, { label: "Rebonds durs", cell: function (s) { return fmtNum(s.hard_bounces); } }, { label: "Plaintes", cell: function (s) { return fmtNum(s.complaints); } }]; } }));
    el.appendChild(simpleList({ title: "Domaines d'expédition", empty: "Aucun domaine.", load: arr("senders.domains"),
      columns: function (reload) { return [{ label: "Domaine", cell: function (d) { return d.domain; } }, { label: "SPF", cell: function (d) { return d.spf && d.spf.valid ? M.badge("Valide", "ok") : M.badge("À vérifier", "warn"); } }, { label: "DKIM", cell: function (d) { return d.dkim && d.dkim.valid ? M.badge("Valide", "ok") : M.badge("À vérifier", "warn"); } }, { label: "Actions", cell: function (d) { return button("Vérifier le DNS", async function () { try { var r = await tx("senders.checkDomain", { domain: d.domain }); flash("SPF : " + (r.spf && r.spf.valid ? "valide" : "à corriger") + " · DKIM : " + (r.dkim && r.dkim.valid ? "valide" : "à corriger"), "ok"); reload(); } catch (e) { fail(e); } }); } }]; },
      create: { label: "Ajouter un domaine", fields: [{ name: "domain", label: "Domaine (ex. exemple.fr)", required: true }], submit: function (v) { return tx("senders.addDomain", { domain: v.domain }); } } }));
    el.appendChild(simpleList({ title: "Modèles transactionnels", empty: "Aucun modèle.", load: arr("templates.list"),
      columns: function (reload) { return [{ label: "Nom", cell: function (t) { return t.name; } }, { label: "Objet", cell: function (t) { return t.subject || "—"; } }, { label: "Actions", cell: function (t) { return h("span", { class: "mk-mc-inline" }, button("Aperçu", async function () { try { var r = await tx("templates.render", { template_name: t.slug || t.name, template_content: [], merge_vars: [] }); var dlg = h("dialog", { class: "mk-mc-dialog is-wide", "aria-label": "Aperçu du modèle" }); dlg.appendChild(h("h2", { text: "Aperçu : " + t.name })); dlg.appendChild(h("iframe", { class: "mk-mc-frame", sandbox: "", srcdoc: r.html || "", title: "Aperçu du modèle " + t.name })); dlg.appendChild(h("div", { class: "mk-mc-actions" }, button("Fermer", function () { dlg.close(); }))); dlg.addEventListener("close", function () { dlg.remove(); }); document.body.appendChild(dlg); dlg.showModal(); } catch (e) { fail(e); } }),
        button("Supprimer", async function () { if (!(await M.confirmDialog({ title: "Supprimer ce modèle ?", text: "« " + t.name + " » sera supprimé de Mandrill.", label: "Supprimer", danger: true }))) return; try { await tx("templates.delete", { name: t.slug || t.name, confirm: true }); reload(); } catch (e) { fail(e); } }, { danger: true })); } }]; } }));
    var hookEvents = ["send", "hard_bounce", "soft_bounce", "open", "click", "spam", "unsub", "reject"];
    el.appendChild(simpleList({ title: "Webhooks transactionnels", empty: "Aucun webhook.", load: arr("webhooks.list"),
      columns: function (reload) { return [{ label: "Adresse", cell: function (w) { return h("code", { text: w.url }); } }, { label: "Événements", cell: function (w) { return (w.events || []).join(", "); } }, { label: "Actions", cell: function (w) { return button("Supprimer", async function () { if (!(await M.confirmDialog({ title: "Supprimer ce webhook ?", text: "Mandrill cessera de prévenir cette adresse.", label: "Supprimer", danger: true }))) return; try { await tx("webhooks.delete", { id: w.id, confirm: true }); reload(); } catch (e) { fail(e); } }, { danger: true }); } }]; },
      create: { label: "Créer un webhook", fields: [{ name: "url", label: "Adresse (HTTPS)", type: "url", required: true, value: "https://" }].concat(hookEvents.map(function (e) { return { name: "e_" + e, label: e, type: "checkbox", value: e === "hard_bounce" || e === "reject" || e === "spam" }; })), submit: function (v) { return tx("webhooks.add", { url: v.url, events: hookEvents.filter(function (e) { return v["e_" + e]; }) }); } } }));
    el.appendChild(simpleList({ title: "Liste de rejet (blacklist)", empty: "Aucune adresse rejetée.", load: arr("rejects.list", { include_expired: false }),
      columns: function (reload) { return [{ label: "Adresse", cell: function (r) { return r.email; } }, { label: "Motif", cell: function (r) { return r.reason || "—"; } }, { label: "Depuis", cell: function (r) { return r.created_at || "—"; } }, { label: "Actions", cell: function (r) { return button("Retirer", async function () { if (!(await M.confirmDialog({ title: "Retirer cette adresse ?", text: "Mandrill pourra de nouveau lui livrer des messages (possible seulement pour un rejet manuel).", label: "Retirer", danger: true }))) return; try { await tx("rejects.delete", { email: r.email, confirm: true }); reload(); } catch (e) { fail(e); } }, { danger: true }); } }]; },
      create: { label: "Bloquer une adresse", fields: [{ name: "email", label: "Adresse e-mail", type: "email", required: true }, { name: "comment", label: "Commentaire" }], submit: function (v) { return tx("rejects.add", { email: v.email, comment: v.comment || undefined }); } } }));
    el.appendChild(simpleList({ title: "Liste d'autorisation (whitelist)", empty: "Aucune adresse autorisée.", load: arr("allowlists.list"),
      columns: function (reload) { return [{ label: "Adresse", cell: function (r) { return r.email; } }, { label: "Commentaire", cell: function (r) { return r.detail || "—"; } }, { label: "Actions", cell: function (r) { return button("Retirer", async function () { try { await tx("allowlists.delete", { email: r.email, confirm: true }); reload(); } catch (e) { fail(e); } }, { danger: true }); } }]; },
      create: { label: "Autoriser une adresse", fields: [{ name: "email", label: "Adresse e-mail", type: "email", required: true }, { name: "comment", label: "Commentaire" }], submit: function (v) { return tx("allowlists.add", { email: v.email, comment: v.comment || undefined }); } } }));
  } });

  /* ---------- Journal des appels ---------- */
  M.registerTab({ id: "journal", label: "Journal", needsConnection: true, render: async function (el) {
    el.appendChild(h("p", { class: "mk-mc-sub", text: "Les 100 derniers appels de Kolakisa vers Mailchimp : méthode, chemin (identifiants masqués), statut, durée. Jamais la clé ni le contenu. Conservés 30 jours." }));
    el.appendChild(h("div", { class: "mk-mc-actions" }, button("Actualiser", function () { M.renderTab(); })));
    var rows = await api("GET", "/journal-appels?limit=100");
    el.appendChild(rows.length ? table("Journal des appels", [{ label: "Date", cell: function (r) { return M.fmtDate(r.createdAt); } }, { label: "Méthode", cell: function (r) { return r.method; } }, { label: "Chemin", cell: function (r) { return h("code", { text: r.path }); } }, { label: "Statut", cell: function (r) { return h("span", { class: r.status >= 400 || r.status === 0 ? "mk-mc-bad" : "", text: String(r.status) }); } }, { label: "Durée", cell: function (r) { return r.durationMs + " ms"; } }, { label: "Tentatives", cell: function (r) { return String(r.attempts); } }, { label: "Erreur", cell: function (r) { return r.errorCode || "—"; } }], rows) : M.empty("Aucun appel enregistré."));
  } });

  M.start();
})();

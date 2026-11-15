// KOLAKISA CMS → Réglages → Connecteurs. Données = JSON #cn-data posé par le serveur ; toutes les actions passent par l'API JSON (le serveur revérifie droits, niveau et validité).
// Règles : aucun HTML injecté (createElement + textContent) ; aucune valeur secrète n'est jamais reçue ni affichée ; « Enregistré » et « Connecté » n'apparaissent qu'après la réponse du serveur.
(function () {
  var root = document.querySelector("[data-cn-root]");
  if (!root) return;
  var S = JSON.parse(document.getElementById("cn-data").textContent);
  var $ = function (sel) { return root.querySelector(sel); };
  var listEl = $("[data-cn-list]"), flash = $("[data-cn-flash]"), search = $("[data-cn-search]"), cat = $("[data-cn-cat]"), filtersEl = $("[data-cn-filters]"), emptyEl = $("[data-cn-empty]"), capsBox = $("[data-cn-caps]"), capsList = $("[data-cn-caps-list]");
  var openId = null, filter = "all", busy = false, drafts = {};
  var FILTERS = [["all", "Tous"], ["available", "Disponibles"], ["connected", "Connectés"], ["todo", "À configurer"], ["error", "En erreur"], ["disabled", "Désactivés"]];

  function h(tag, attrs, kids) {
    var e = tag === "svg" || tag === "path" ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.setAttribute("class", attrs[k]); else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k] === true ? "" : attrs[k]); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function say(text, kind) { flash.hidden = !text; flash.textContent = text || ""; flash.className = "mk-cn-flash" + (kind ? " is-" + kind : ""); }
  function api(method, path, body) {
    var url = S.api.replace("/connecteurs", "/connecteurs" + path);
    return fetch(url, { method: method, credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; }); });
  }
  function apply(b) { if (b && b.catalog) { S.catalog = b.catalog; S.capabilities = b.capabilities || S.capabilities; S.can = b.can || S.can; } }
  var ERR = "Une erreur est survenue. Vos valeurs sont conservées : réessayez.";

  // ----- État affiché d'un connecteur (calculé à partir des données réelles) -----
  function stateOf(c) {
    if (c.kind === "external") return c.external.state === "configured" ? ["ok", "Configuré ailleurs"] : c.external.state === "unconfigured" ? ["todo", "Non configuré"] : ["todo", "État inconnu"];
    if (!c.available) return ["bad", "Indisponible"];
    var k = c.connection;
    if (!k) return ["idle", "Disponible"];
    var shared = c.source === "central" && S.scope.siteId ? " (partagé par le niveau central)" : "";
    return { connected: ["ok", "Connecté" + shared], configured: ["todo", "Configuré, non testé" + shared], error: ["bad", "En erreur"], disabled: ["off", "Désactivé"], pending: ["todo", "En attente d'autorisation"] }[k.state] || ["idle", k.state];
  }
  function group(c) {
    if (c.kind === "external") return c.external.state === "configured" ? "connected" : "todo";
    if (!c.connection) return c.available ? "available" : "todo";
    return { connected: "connected", configured: "todo", error: "error", disabled: "disabled", pending: "todo" }[c.connection.state];
  }
  function matches(c) {
    var q = search.value.trim().toLowerCase();
    if (cat.value && c.category !== cat.value) return false;
    if (filter === "available" && !(c.kind === "native" && c.available && !c.connection)) return false;
    if (filter !== "all" && filter !== "available" && group(c) !== filter) return false;
    if (!q) return true;
    return [c.name, c.provider, c.description, c.categoryLabel].concat(c.capabilities.map(function (k) { var x = S.capabilities.filter(function (y) { return y.key === k; })[0]; return x ? x.label : k; })).join(" ").toLowerCase().indexOf(q) >= 0;
  }
  function primary(c) {
    if (c.kind === "external") return ["Ouvrir", "link"];
    if (!c.available) return ["Indisponible", "off"];
    var k = c.connection;
    if (!k) return ["Configurer", "primary"];
    return { connected: ["Gérer", "outline"], configured: ["Tester", "primary"], error: ["Corriger", "primary"], disabled: ["Réactiver", "outline"], pending: ["Continuer", "primary"] }[k.state] || ["Gérer", "outline"];
  }

  // ----- Liste -----
  function render() {
    listEl.textContent = "";
    var shown = 0;
    S.catalog.forEach(function (c) {
      if (!matches(c)) return; shown++;
      var st = stateOf(c), pa = primary(c), open = openId === c.id, pid = "cn-p-" + c.id;
      var head = h("button", { type: "button", class: "mk-cn-row-btn", "aria-expanded": String(open), "aria-controls": pid, "data-cn-open": c.id }, [
        c.logo ? h("span", { class: "mk-cn-mark mk-cn-mark--logo", "aria-hidden": "true" }, [h("img", { src: c.logo, alt: "", width: "24", height: "24", loading: "lazy", decoding: "async" })]) : h("span", { class: "mk-cn-mark", "aria-hidden": "true", text: c.mark || c.name.slice(0, 1) }),
        h("span", { class: "mk-cn-row-main" }, [h("span", { class: "mk-cn-name", text: c.name }), h("span", { class: "mk-cn-desc", text: c.description }),
          h("span", { class: "mk-cn-tags" }, [h("span", { class: "mk-cn-tag", text: c.categoryLabel })].concat(c.capabilities.map(function (k) { var x = S.capabilities.filter(function (y) { return y.key === k; })[0]; return h("span", { class: "mk-cn-tag mk-cn-tag--cap", text: x ? x.label : k }); })))]),
        h("span", { class: "mk-cn-state is-" + st[0], text: st[1] }),
        h("span", { class: "mk-cn-act mk-cn-act--" + pa[1], text: pa[0] }),
        h("svg", { class: "mk-cn-chev", viewBox: "0 0 20 20", width: "18", height: "18", "aria-hidden": "true" }, [h("path", { d: "M5 7.5l5 5 5-5", fill: "none", stroke: "currentColor", "stroke-width": "1.8", "stroke-linecap": "round", "stroke-linejoin": "round" })]),
      ]);
      var panel = h("div", { class: "mk-cn-panel", id: pid, role: "region", "aria-label": "Détails de " + c.name }, [h("div", { class: "mk-cn-panel-in" }, [open ? detail(c) : null])]);
      listEl.appendChild(h("article", { class: "mk-cn-card" + (open ? " is-open" : ""), "data-cn-id": c.id }, [head, panel]));
    });
    emptyEl.hidden = shown > 0;
    $$("[data-cn-open]").forEach(function (b) { b.addEventListener("click", function () { openId = openId === b.getAttribute("data-cn-open") ? null : b.getAttribute("data-cn-open"); say(""); render(); }); });
    renderFilters(); renderCaps();
  }
  function $$(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  function renderFilters() {
    filtersEl.textContent = "";
    FILTERS.forEach(function (f) {
      var n = S.catalog.filter(function (c) { var keep = filter; filter = f[0]; var m = matches(c); filter = keep; return m; }).length;
      var a = h("button", { type: "button", class: "mk-cn-filter", "aria-pressed": String(filter === f[0]) }, [f[1] + " ", h("span", { class: "mk-cn-count", text: String(n) })]);
      a.addEventListener("click", function () { filter = f[0]; render(); }); filtersEl.appendChild(a);
    });
  }
  function renderCaps() {
    var caps = (S.capabilities || []).filter(function (c) { return c.providers.length > 1; });
    capsBox.hidden = !caps.length; capsList.textContent = "";
    caps.forEach(function (cp) {
      var sel = h("select", { id: "cn-pref-" + cp.key, "aria-describedby": "cn-pref-h-" + cp.key }, [h("option", { value: "", text: "Automatique (seulement si un unique fournisseur est connecté)" })].concat(cp.providers.map(function (p) { return h("option", { value: p.id, text: p.name + (p.usable ? "" : " (" + (p.state === "absent" ? "non configuré" : p.state === "disabled" ? "désactivé" : "à corriger") + ")") }); })));
      sel.value = cp.preferred || ""; sel.disabled = !S.can.write;
      sel.addEventListener("change", function () {
        if (busy) return; busy = true; say("Enregistrement…", "info");
        api("PUT", "-preference", { capability: cp.key, connector: sel.value }).then(function (r) { busy = false; if (r.status === 200 && r.body.ok) { apply(r.body); render(); say("Fournisseur enregistré.", "ok"); } else { sel.value = cp.preferred || ""; say(r.body.error || ERR, "error"); } }).catch(function () { busy = false; sel.value = cp.preferred || ""; say(ERR, "error"); });
      });
      capsList.appendChild(h("div", { class: "mk-cn-cap" }, [h("label", { for: "cn-pref-" + cp.key, text: cp.label }), sel, h("p", { class: "mk-cn-sub", id: "cn-pref-h-" + cp.key, text: cp.description })]));
    });
  }

  // ----- Fiche d'un connecteur -----
  function section(title, kids) { return h("section", { class: "mk-cn-sec" }, [h("h3", { text: title })].concat(kids)); }
  function detail(c) {
    var box = h("div", { class: "mk-cn-detail" });
    if (c.kind === "external") {
      box.appendChild(section("Géré dans son propre module", [h("p", { text: c.description }), h("p", { class: "mk-cn-sub", text: c.managedBy }), h("p", { class: "mk-cn-sub", text: "État réel : " + (c.external.detail || "inconnu") }),
        h("p", {}, [h("a", { class: "mk-cn-btn mk-cn-btn--primary", href: c.manage.href, text: c.manage.label + " →" })]), c.docsUrl ? h("p", {}, [h("a", { href: c.docsUrl, target: "_blank", rel: "noopener noreferrer", text: "Documentation du fournisseur ↗" })]) : null]));
      return box;
    }
    box.appendChild(section("Ce que ce connecteur permet", [h("p", { text: c.longDescription || c.description }), h("ul", { class: "mk-cn-caps-ul" }, c.capabilities.map(function (k) { var x = S.capabilities.filter(function (y) { return y.key === k; })[0]; return h("li", { text: x ? x.label + " — " + x.description : k }); }))]));
    if (!c.available) { box.appendChild(h("p", { class: "mk-cn-note is-bad", role: "alert", text: c.availabilityReason })); }
    box.appendChild(section("Avant de commencer", [h("ul", {}, c.requirements.map(function (r) { return h("li", { text: r }); })), c.costNote ? h("p", { class: "mk-cn-sub", text: "Coût : " + c.costNote }) : null, c.privacyNote ? h("p", { class: "mk-cn-sub", text: "Confidentialité : " + c.privacyNote }) : null,
      h("p", { class: "mk-cn-links" }, [c.credentialsUrl ? h("a", { href: c.credentialsUrl, target: "_blank", rel: "noopener noreferrer", text: "Obtenir une clé ↗" }) : null, h("a", { href: c.docsUrl, target: "_blank", rel: "noopener noreferrer", text: "Documentation ↗" })])]));
    var k = c.connection;
    if (k) box.appendChild(section("Connexion", [connectionInfo(c, k)]));
    else if (S.scope.siteId && c.source === "central") box.appendChild(h("p", { class: "mk-cn-note", text: "Ce site utilise la connexion partagée du niveau central." }));
    box.appendChild(form(c, k));
    return box;
  }
  function connectionInfo(c, k) {
    var rows = [["État", stateOf(c)[1]]];
    if (c.source === "central" && S.scope.siteId) rows.push(["Origine", "Connexion partagée par le niveau central (ses identifiants ne sont pas visibles ici)"]);
    if (k.lastTest) rows.push(["Dernier test", (k.lastTest.ok ? "Réussi" : "Échec") + " · " + k.lastTest.at + " UTC · " + k.lastTest.message]);
    else rows.push(["Dernier test", "Jamais testé : l'état « connecté » n'est affiché qu'après un test réussi."]);
    if (k.lastError) rows.push(["Dernière erreur", k.lastError.message + " (" + k.lastError.at + " UTC)"]);
    rows.push(["Utilisations", k.usageCount + (k.lastUsedAt ? " · dernière le " + k.lastUsedAt + " UTC" : "")]);
    return h("dl", { class: "mk-cn-dl" }, rows.reduce(function (a, r) { return a.concat([h("dt", { text: r[0] }), h("dd", { text: r[1] })]); }, []));
  }
  function form(c, k) {
    var own = k && !(c.source === "central" && S.scope.siteId);
    var f = h("form", { class: "mk-cn-form", novalidate: true, "data-cn-form": c.id }), inputs = {}, initial = {};
    var d = drafts[c.id] || {};
    c.fields.forEach(function (fd) {
      var id = "cn-f-" + c.id + "-" + fd.key, value = d[fd.key] !== undefined ? d[fd.key] : (fd.type === "secret" ? "" : own && k.config[fd.key] !== undefined ? k.config[fd.key] : fd.default);
      var saved = fd.type === "secret" && own && k.secretFields.indexOf(fd.key) >= 0;
      var input = h("input", { id: id, name: fd.key, type: fd.type === "secret" ? "password" : fd.type === "number" ? "number" : "text", autocomplete: "off", spellcheck: "false", value: fd.type === "secret" ? "" : String(value === undefined || value === null ? "" : value), placeholder: saved ? "•••••••• enregistrée : laisser vide pour la conserver" : fd.type === "secret" ? "Collez la clé ici" : "", disabled: !S.can.write || (fd.type === "secret" && !S.can.secrets) || !c.available, "aria-describedby": id + "-h" });
      if (fd.type === "secret") input.value = value || "";
      inputs[fd.key] = input; initial[fd.key] = input.value;
      f.appendChild(h("div", { class: "mk-cn-field" }, [h("label", { for: id, text: fd.label + (fd.required ? " *" : "") }), input, h("p", { class: "mk-cn-sub", id: id + "-h", text: fd.help + (fd.type === "secret" ? " Jamais réaffichée, jamais envoyée au navigateur." : "") })]));
    });
    var msg = h("p", { class: "mk-cn-msg", role: "status", "aria-live": "polite" });
    var save = h("button", { type: "submit", class: "mk-cn-btn mk-cn-btn--primary", disabled: true, text: own ? "Enregistrer" : S.scope.siteId && c.source === "central" ? "Utiliser mes propres identifiants" : "Enregistrer" });
    var actions = h("div", { class: "mk-cn-actions" }, [save]);
    var bar = actions;
    function dirty() { return Object.keys(inputs).some(function (key) { return inputs[key].value !== initial[key]; }); }
    function sync() { var dd = dirty(); drafts[c.id] = {}; Object.keys(inputs).forEach(function (key) { drafts[c.id][key] = inputs[key].value; }); save.disabled = busy || !dd || !S.can.write || !c.available; msg.textContent = dd ? "Modifications non enregistrées" : ""; msg.className = "mk-cn-msg" + (dd ? " is-dirty" : ""); }
    f.addEventListener("input", sync);
    function run(label, method, path, body, done) {
      if (busy) return; busy = true; sync(); msg.textContent = label; msg.className = "mk-cn-msg is-info";
      api(method, path, body).then(function (r) {
        busy = false;
        if (r.status === 200 && r.body.ok) { apply(r.body); done(r.body); return; }
        sync(); msg.textContent = r.body.error || ERR; msg.className = "mk-cn-msg is-error";
      }).catch(function () { busy = false; sync(); msg.textContent = ERR; msg.className = "mk-cn-msg is-error"; });
    }
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (save.disabled) return;
      var values = {}; Object.keys(inputs).forEach(function (key) { values[key] = inputs[key].value; });
      run("Enregistrement…", "PUT", "/" + c.id, { values: values }, function () { delete drafts[c.id]; render(); say("Configuration enregistrée. Elle n'est pas encore validée : testez la connexion.", "ok"); });
    });
    if (k && own) {
      var test = h("button", { type: "button", class: "mk-cn-btn mk-cn-btn--outline", text: "Tester la connexion", disabled: !S.can.write || k.state === "disabled" });
      test.addEventListener("click", function () { run("Test en cours…", "POST", "/" + k.id + "/test", {}, function (b) { render(); say(b.test.ok ? b.test.message : "Échec du test : " + b.test.message, b.test.ok ? "ok" : "error"); }); });
      var tog = h("button", { type: "button", class: "mk-cn-btn mk-cn-btn--ghost", text: k.state === "disabled" ? "Réactiver" : "Désactiver", disabled: !S.can.write });
      tog.addEventListener("click", function () { run("…", "POST", "/" + k.id + (k.state === "disabled" ? "/activer" : "/desactiver"), {}, function () { render(); say(k.state === "disabled" ? "Connecteur réactivé : testez la connexion." : "Connecteur désactivé : aucune capacité n'est plus fournie.", "ok"); }); });
      var rev = h("button", { type: "button", class: "mk-cn-btn mk-cn-btn--ghost", text: "Révoquer les identifiants", disabled: !S.can.secrets || !k.secretFields.length });
      rev.addEventListener("click", function () { if (!window.confirm("Les identifiants enregistrés sont supprimés du serveur. Le connecteur n'est plus utilisable tant que vous n'en saisissez pas de nouveaux. Continuer ?")) return; run("…", "POST", "/" + k.id + "/revoquer", {}, function () { render(); say("Identifiants révoqués. Pensez aussi à les révoquer chez le fournisseur.", "ok"); }); });
      var del = h("button", { type: "button", class: "mk-cn-btn mk-cn-btn--danger", text: "Supprimer la connexion", disabled: !S.can.secrets });
      del.addEventListener("click", function () { if (!window.confirm("Supprimer cette connexion et ses identifiants ? Les fonctions qui l'utilisent cesseront de fonctionner.")) return; run("…", "DELETE", "/" + k.id, null, function () { openId = null; render(); say("Connexion supprimée.", "ok"); }); });
      [test, tog, rev, del].forEach(function (b) { actions.appendChild(b); });
      if (S.can.share) {
        var chk = h("input", { type: "checkbox", id: "cn-share-" + c.id, checked: k.shared || false });
        chk.addEventListener("change", function () { run("…", "POST", "/" + k.id + "/partager", { shared: chk.checked }, function () { render(); say(chk.checked ? "Connexion partagée : les sites peuvent l'utiliser sans connaître ses identifiants." : "Partage retiré : les sites n'utilisent plus cette connexion.", "ok"); }); });
        f.appendChild(h("div", { class: "mk-cn-share" }, [chk, h("label", { for: "cn-share-" + c.id, text: "Partager cette connexion avec les sites" }), h("p", { class: "mk-cn-sub", text: "Désactivé par défaut. Un site qui a ses propres identifiants utilise toujours les siens ; les identifiants partagés ne lui sont jamais montrés." })]));
      }
    }
    f.appendChild(bar); f.appendChild(msg);
    return f;
  }

  // ----- Initialisation -----
  var cats = {}; S.catalog.forEach(function (c) { cats[c.category] = c.categoryLabel; });
  Object.keys(cats).forEach(function (k) { cat.appendChild(h("option", { value: k, text: cats[k] })); });
  search.addEventListener("input", render); cat.addEventListener("change", render);
  window.addEventListener("beforeunload", function (e) { var any = Object.keys(drafts).some(function (id) { var c = S.catalog.filter(function (x) { return x.id === id; })[0]; return c && Object.keys(drafts[id] || {}).some(function (k) { var fd = c.fields.filter(function (y) { return y.key === k; })[0]; var base = fd && fd.type === "secret" ? "" : (c.connection && c.connection.config[k] !== undefined ? String(c.connection.config[k]) : String(fd ? fd.default : "")); return drafts[id][k] !== base; }); }); if (any) { e.preventDefault(); e.returnValue = ""; } });
  render();
})();

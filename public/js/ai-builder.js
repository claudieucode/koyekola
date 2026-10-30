/* Créateur de site IA (programme 21.8). Interface SEULEMENT : chaque action appelle une route serveur qui délègue au moteur concerné (brief, plan, pages, design, contenus, médias, publication).
   Rien n'est calculé ici : l'état des étapes, la progression et les contrôles viennent du serveur. Aucune clé, aucun secret, aucun appel direct à un fournisseur d'IA. */
(function () {
  "use strict";
  var boot = JSON.parse(document.getElementById("aib-boot").textContent);
  var API = boot.base + "/api", $ = function (s, r) { return (r || document).querySelector(s); }, root = $("#aib");
  var STEPS = [["brief", "Brief du projet"], ["plan", "Plan du site"], ["pages", "Pages"], ["design", "Design"], ["contents", "Contenus"], ["media", "Images et médias"], ["preview", "Prévisualisation"], ["publish", "Publication"]];
  var STATUS_TXT = { notstarted: "Non commencé", inprogress: "En cours", review: "À vérifier", done: "Terminé", error: "Erreur" };
  var S = { pid: boot.projectId, st: null, step: "brief", ctl: null, save: { state: "idle", at: null, msg: "" }, cache: {}, ui: {}, timer: null, poll: null, assistOpen: window.innerWidth > 1024, chat: [] };

  // ---------- outils ----------
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function time(d) { return (d || new Date()).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  function toast(msg, kind, action) {
    var box = $("#aib-toasts"), t = document.createElement("div"); t.className = "aib-toast"; if (kind) t.setAttribute("data-k", kind);
    t.innerHTML = esc(msg) + (action ? ' <button type="button" class="aib-btn">' + esc(action.label) + "</button>" : "");
    if (action) t.querySelector("button").addEventListener("click", function () { t.remove(); action.run(); });
    box.appendChild(t); setTimeout(function () { t.remove(); }, kind === "error" ? 9000 : 4500);
  }
  // Appel serveur : erreurs réseau ou serveur transformées en messages lisibles (jamais de détail interne)
  function call(method, path, body, opt) {
    opt = opt || {};
    var o = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body !== undefined) { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body); }
    if (opt.signal) o.signal = opt.signal;
    if (method !== "GET") setSave("saving");
    return fetch(API + path, o).then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse inattendue du serveur." }; }).then(function (j) { j.status = r.status; return j; }); }, function (e) {
      if (e && e.name === "AbortError") throw e;
      var err = new Error("Connexion perdue : vos données ne sont pas enregistrées. Vérifiez votre réseau, puis réessayez."); err.network = true; throw err;
    }).then(function (j) {
      if (!j.ok) { var er = new Error(j.error || "Une erreur est survenue."); er.code = j.code; er.status = j.status; if (method !== "GET") setSave("error", er.message); throw er; }
      if (method !== "GET") setSave("saved");
      return j;
    }, function (e) { if (method !== "GET" && e.network) setSave("error", e.message); throw e; });
  }
  function fail(e, retry) { if (e && e.name === "AbortError") return; toast(e.message || "Erreur.", "error", retry ? { label: "Réessayer", run: retry } : null); }
  function setSave(state, msg) {
    S.save = { state: state, at: state === "saved" ? new Date() : S.save.at, msg: msg || "" };
    var el = $("#aib-save"); el.setAttribute("data-state", state);
    el.textContent = state === "saving" ? "Enregistrement…" : state === "saved" ? "Enregistré à " + time(S.save.at) : state === "error" ? "Échec de l'enregistrement" : S.save.at ? "Enregistré à " + time(S.save.at) : "";
    el.title = state === "error" ? msg : "";
  }
  function busy(btn, on) { if (btn) { btn.disabled = on; btn.setAttribute("aria-busy", on ? "true" : "false"); } }

  // ---------- chargement ----------
  function loadState() {
    if (S.ctl) S.ctl.abort(); S.ctl = new AbortController();
    return call("GET", "/projets/" + S.pid + "/etat", undefined, { signal: S.ctl.signal }).then(function (j) { S.st = j; renderChrome(); return j; });
  }
  function renderChrome() {
    var st = S.st; if (!st) return;
    $("#aib-project-name").textContent = st.project.name;
    $("#aib-progress").textContent = st.progress.done + " étape(s) sur " + st.progress.total + " terminée(s)" + (st.progress.review.length ? " · " + st.progress.review.length + " à vérifier" : "") + (st.progress.failed.length ? " · " + st.progress.failed.length + " en erreur" : "");
    $("#aib-undo").disabled = !st.canUndo; $("#aib-redo").disabled = !st.canRedo;
    var pubStep = st.steps.filter(function (s) { return s.key === "publish"; })[0];
    $("#aib-publish-btn").hidden = !(pubStep && (pubStep.status === "review" || pubStep.status === "done") && boot.perms.publish);
    $("#aib-side").innerHTML = st.steps.map(function (s, i) {
      return '<button type="button" class="aib-step" data-act="go" data-step="' + s.key + '" data-status="' + s.status + '"' + (S.step === s.key ? ' aria-current="step"' : "") + '><span class="aib-step-n" aria-hidden="true">' + (s.status === "done" ? "✓" : s.status === "error" ? "!" : i + 1) + '</span><span><span class="aib-step-t">' + esc(s.label) + '</span><span class="aib-step-s">' + STATUS_TXT[s.status] + " · " + esc(s.detail) + "</span></span></button>";
    }).join("");
    if (S.save.state === "idle") setSave("idle");
  }

  // ---------- accueil des projets ----------
  function viewProjects() {
    var m = $("#aib-main"); m.innerHTML = '<div class="aib-loading">Chargement des projets…</div>'; $("#aib-side").innerHTML = ""; $("#aib-assist").innerHTML = ""; root.setAttribute("data-assist", "closed"); $("#aib-project-name").textContent = ""; $("#aib-progress").textContent = "";
    call("GET", "/projets").then(function (j) {
      var groups = ["en cours", "en attente", "terminé", "publié"], by = {}; j.projects.forEach(function (p) { (by[p.group] = by[p.group] || []).push(p); });
      var last = j.projects[0];
      m.innerHTML = '<h1>Mes projets de site IA</h1><p class="aib-lead">Décrivez votre projet, relisez le plan, les pages, le design, les textes et les images, puis publiez. Votre travail est enregistré à chaque étape.</p>' +
        (last ? '<p><button class="aib-btn aib-primary" data-act="open" data-id="' + last.id + '">Reprendre mon travail : ' + esc(last.name) + "</button></p>" : "") +
        (boot.perms.write ? '<section class="aib-card"><h2>Nouveau projet</h2><form data-form="new" class="aib-row"><label class="aib-field"><span>Nom du projet</span><input name="name" maxlength="100" required placeholder="Ex. Site de mon entreprise"></label><button class="aib-btn aib-primary" type="submit">Créer le projet</button></form></section>' : "") +
        (j.projects.length ? groups.filter(function (g) { return by[g]; }).map(function (g) {
          return "<h2>" + g.charAt(0).toUpperCase() + g.slice(1) + '</h2><div class="aib-proj">' + by[g].map(function (p) {
            return '<article class="aib-card"><strong>' + esc(p.name) + '</strong><span class="aib-note">Modifié le ' + esc(p.updatedAt) + " · " + p.progress.done + "/" + p.progress.total + ' étapes terminées</span><div class="aib-bar" role="img" aria-label="' + p.progress.done + ' étapes sur ' + p.progress.total + ' terminées">' + p.progress.steps.map(function (s) { return '<i data-s="' + s.status + '"></i>'; }).join("") + '</div><div class="aib-row"><button class="aib-btn aib-primary aib-sm" data-act="open" data-id="' + p.id + '">Ouvrir</button></div></article>';
          }).join("") + "</div>";
        }).join("") : '<p class="aib-empty">Aucun projet pour le moment.</p>');
    }, function (e) { fail(e, viewProjects); m.innerHTML = '<p class="aib-errline">' + esc(e.message) + "</p>"; });
  }
  function openProject(id) { S.pid = id; history.pushState({}, "", boot.base + "/" + id); start(); }

  // ---------- démarrage ----------
  function start() {
    root.setAttribute("data-ready", "1");
    if (!S.pid) return viewProjects();
    root.setAttribute("data-assist", S.assistOpen ? "open" : "closed"); $("#aib-assist-btn").setAttribute("aria-pressed", String(S.assistOpen)); renderAssist();
    loadState().then(function (j) {
      var firstOpen = j.steps.filter(function (s) { return s.status === "review" || s.status === "inprogress" || s.status === "error"; })[0] || j.steps.filter(function (s) { return s.status === "notstarted"; })[0] || j.steps[0];
      go(S.step === "brief" && !S.ui.started ? firstOpen.key : S.step); S.ui.started = true; loadChat();
      if (j.progress.tasks.some(function (t) { return t.status === "queued" || t.status === "running"; })) startPolling();
    }, function (e) { fail(e, start); $("#aib-main").innerHTML = '<p class="aib-errline">' + esc(e.message) + "</p>"; });
  }
  function startPolling() { clearInterval(S.poll); S.poll = setInterval(function () { loadState().then(function (j) { if (S.step === "media") views.media(); if (!j.progress.tasks.some(function (t) { return t.status === "queued" || t.status === "running"; })) { clearInterval(S.poll); S.poll = null; } }, function () {}); }, 2500); }
  function go(step) { S.step = step; renderChrome(); $("#aib-main").innerHTML = '<div class="aib-loading">Chargement…</div>'; (views[step] || views.brief)(); $("#aib-main").scrollTop = 0; renderAssist(); }

  // ---------- étape 1 : brief ----------
  var BRIEF_FIELDS = [["projectName", "Nom du projet"], ["company", "Entreprise ou marque"], ["sector", "Secteur d'activité"], ["siteType", "Type de site"], ["audience", "Public cible"], ["country", "Pays (code, ex. CD)"], ["language", "Langue principale"], ["languages", "Langues secondaires"], ["goals", "Objectifs commerciaux"], ["services", "Services ou produits"], ["style", "Style visuel souhaité"], ["references", "Références éventuelles"]];
  var STAT = { explicit: ["ok", "Fourni"], inferred: ["ai", "Déduit"], assumed: ["warn", "Hypothèse"], unknown: ["", "Inconnu"] };
  function fact(label, f) { if (!f || !f.value) return ""; var s = STAT[f.status] || STAT.unknown; return "<li><strong>" + esc(label) + " :</strong> " + esc(f.value) + ' <span class="aib-chip" data-k="' + s[0] + '">' + s[1] + "</span></li>"; }
  views = {};
  views.brief = function () {
    var p = S.st.project, d = p.draft || {}, m = $("#aib-main");
    var backup = null; try { backup = JSON.parse(localStorage.getItem("aib:draft:" + p.id) || "null"); } catch (e) { backup = null; }
    var diverge = backup && backup.rev === p.revision - 0 && JSON.stringify(backup.fields) !== JSON.stringify(pick(d));
    call("GET", "/projets/" + S.pid + "/plan").then(function (pl) {
      var v = pl.plan, a = v && v.analysis, can = boot.perms.write;
      m.innerHTML = "<h1>Brief du projet</h1><p class=\"aib-lead\">Décrivez votre site avec vos propres mots. L'analyse extrait ce qui est explicite, ce qui est déduit et ce qui manque : vous gardez le contrôle.</p>" +
        (diverge ? '<div class="aib-card"><strong>Saisies non enregistrées retrouvées.</strong> <button class="aib-btn aib-sm" data-act="restore-draft">Les restaurer</button></div>' : "") +
        '<form class="aib-card" data-form="brief"><label class="aib-field"><span>Votre projet</span><textarea name="description" rows="6" maxlength="3000" ' + (can ? "" : "disabled") + ' placeholder="Ex. Je souhaite créer un site professionnel pour une entreprise de construction et de rénovation à Kinshasa. Le site doit présenter les services, les réalisations, l\'entreprise et permettre de demander un devis.">' + esc(d.description || "") + '</textarea></label><div class="aib-grid" style="margin-top:12px">' +
        BRIEF_FIELDS.map(function (f) { return '<label class="aib-field"><span>' + f[1] + '</span><input name="' + f[0] + '" maxlength="300" value="' + esc(d[f[0]] || "") + '" ' + (can ? "" : "disabled") + "></label>"; }).join("") + "</div>" +
        '<p class="aib-note">Logo et fichiers de marque : ajoutez-les dans la <a href="' + esc(boot.siteBase) + '/medias">médiathèque du site</a>' + (d.logoMediaId ? " (logo : média n° " + esc(d.logoMediaId) + ")" : "") + ".</p>" +
        (can ? '<div class="aib-row"><button class="aib-btn aib-primary" type="submit" id="aib-analyze">' + (a ? "Analyser à nouveau" : "Analyser le brief") + '</button><span class="aib-note">Vos saisies sont enregistrées automatiquement.</span></div>' : '<p class="aib-note">Vous n\'avez pas le droit de modifier ce projet.</p>') + "</form>" + (a ? analysisCard(v) : "");
      bindDraft(m);
    }, function (e) { fail(e, views.brief); });
  };
  function pick(d) { var o = {}; ["description"].concat(BRIEF_FIELDS.map(function (f) { return f[0]; })).forEach(function (k) { o[k] = d[k] || ""; }); return o; }
  function analysisCard(v) {
    var a = v.analysis, pr = a.project, lvl = a.readiness.level, q = a.questions || [];
    var h = '<section class="aib-card"><h2>Ce que j\'ai compris <span class="aib-chip" data-k="' + (lvl === "ready" ? "ok" : lvl === "blocked" ? "warn" : "err") + '">' + (lvl === "ready" ? "Prêt à planifier" : lvl === "blocked" ? "Informations bloquantes" : "Brief insuffisant") + '</span></h2><ul class="aib-list">' +
      fact("Type de site", Object.assign({}, pr.siteType, { value: pr.siteTypeLabel })) + fact("Entreprise", pr.name) + fact("Secteur", pr.sector) + fact("Public", pr.audience) + fact("Ville", pr.city) + fact("Pays", { value: pr.country.value, status: pr.country.status }) + fact("Langue du site", a.language.site) +
      a.goals.map(function (g) { return "<li><strong>Objectif :</strong> " + esc(g.label) + ' <span class="aib-chip" data-k="' + (STAT[g.status] || STAT.unknown)[0] + '">' + (STAT[g.status] || STAT.unknown)[1] + "</span></li>"; }).join("") +
      a.features.map(function (f) { return "<li><strong>Fonctionnalité :</strong> " + esc(f.label) + ' <span class="aib-chip" data-k="' + (f.availability === "available" ? "ok" : f.availability === "partial" ? "warn" : "err") + '">' + (f.availability === "available" ? "Disponible" : f.availability === "partial" ? "Partielle" : "Indisponible") + "</span></li>"; }).join("") + "</ul>";
    if (a.contradictions.length) h += '<p class="aib-warnline"><strong>Contradictions :</strong> ' + a.contradictions.map(function (c) { return esc(c.description); }).join(" ") + "</p>";
    h += (a.warnings || []).filter(function (w) { return w.level === "error" || w.level === "warning"; }).map(function (w) { return '<p class="' + (w.level === "error" ? "aib-errline" : "aib-warnline") + '">' + esc(w.message) + "</p>"; }).join("") + "</section>";
    if (q.length) h += '<form class="aib-card" data-form="answers"><h2>Questions pour affiner</h2><p class="aib-note">Répondez à celles qui comptent ; vous pouvez passer les autres.</p>' + q.map(function (x) { var cur = (v.answers.filter(function (r) { return r.id === x.id; })[0] || {}).answer || ""; return '<label class="aib-field" style="margin-top:10px"><span>' + esc(x.question) + (x.blocking ? ' <span class="aib-chip" data-k="warn">Bloquante</span>' : ' <span class="aib-chip">Facultative</span>') + '</span><span class="aib-note" style="font-weight:400">' + esc(x.why) + '</span><input name="' + esc(x.id) + '" value="' + esc(cur) + '" maxlength="300" list="aib-dl-' + esc(x.id) + '">' + (x.choices && x.choices.length ? '<datalist id="aib-dl-' + esc(x.id) + '">' + x.choices.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + "</datalist>" : "") + "</label>"; }).join("") + '<div class="aib-row"><button class="aib-btn" type="submit">Enregistrer mes réponses et réanalyser</button></div></form>';
    var canPlan = lvl !== "insufficient";
    h += '<div class="aib-row">' + (canPlan ? '<button class="aib-btn aib-primary" data-act="planify"' + (lvl === "blocked" ? ' data-assume="1"' : "") + ">" + (v.plan ? "Régénérer le plan" : lvl === "blocked" ? "Continuer avec des hypothèses et proposer le plan" : "Proposer le plan du site") + "</button>" : '<span class="aib-errline">Complétez le brief pour pouvoir planifier.</span>') + (v.plan ? '<button class="aib-btn" data-act="go" data-step="plan">Voir le plan</button>' : "") + "</div>";
    return h;
  }
  function bindDraft(m) {
    var form = $('[data-form="brief"]', m); if (!form) return;
    form.addEventListener("input", function () { clearTimeout(S.timer); setSave("saving"); var f = collect(form); try { localStorage.setItem("aib:draft:" + S.st.project.id, JSON.stringify({ rev: S.st.project.revision, fields: f })); } catch (e) { /* stockage indisponible */ } S.timer = setTimeout(function () { saveDraft(f); }, 800); });
  }
  function collect(form) { var o = {}; Array.prototype.forEach.call(form.elements, function (el) { if (el.name) o[el.name] = el.value; }); return o; }
  function saveDraft(fields) {
    return call("POST", "/projets/" + S.pid + "/brouillon", { fields: fields, revision: S.st.project.revision }).then(function (j) { S.st.project = j.project; try { localStorage.removeItem("aib:draft:" + S.pid); } catch (e) { /* */ } $("#aib-project-name").textContent = j.project.name; }, function (e) {
      if (e.code === "conflict") { toast(e.message, "error", { label: "Recharger", run: function () { loadState().then(function () { go(S.step); }); } }); } else fail(e);
    });
  }
  function flush() { var f = $('[data-form="brief"]'); if (f && S.timer) { clearTimeout(S.timer); S.timer = null; return saveDraft(collect(f)); } return Promise.resolve(); }

  // ---------- étape 2 : plan ----------
  var SEC_TYPES = [["hero", "Bandeau"], ["text", "Texte"], ["features", "Points forts en cartes"], ["faq", "Questions fréquentes"], ["cta", "Appel à l'action"], ["form", "Formulaire"], ["testimonials", "Témoignages"], ["list", "Liste"], ["video", "Vidéo"], ["image", "Image"], ["quote", "Citation"]];
  var AV = { available: ["ok", "Disponible"], partial: ["warn", "Partiel"], unavailable: ["err", "Indisponible"] };
  function opPlan(op, label) { var pl = S.cache.plan; return call("POST", "/projets/" + S.pid + "/plan/modifier", { operation: op, revision: pl.revision }).then(function (j) { S.cache.plan = j.plan; return loadState(); }).then(function () { views.plan(); if (label) toast(label); }, function (e) { fail(e); if (e.code === "conflict") views.plan(); }); }
  views.plan = function () {
    var m = $("#aib-main");
    call("GET", "/projets/" + S.pid + "/plan").then(function (r) {
      var v = r.plan; S.cache.plan = v;
      if (!v || !v.plan) { m.innerHTML = '<h1>Plan du site</h1><p class="aib-empty">Aucun plan pour le moment. ' + (v && v.analysis ? '<button class="aib-btn aib-primary" data-act="planify">Proposer le plan</button>' : '<button class="aib-btn" data-act="go" data-step="brief">Analyser le brief</button>') + "</p>"; return; }
      var pl = v.plan, can = boot.perms.write;
      var warns = pl.warnings.filter(function (w) { return w.level !== "info"; });
      m.innerHTML = "<h1>Plan du site</h1><p class=\"aib-lead\">" + esc(pl.site.name) + " — " + pl.pages.length + " page(s), " + pl.summary.sections + ' section(s). Statut : <span class="aib-chip" data-k="' + (v.status === "validated" ? "ok" : v.status === "to_fix" ? "err" : "warn") + '">' + ({ pending: "En attente de validation", validated: "Validé", modified: "Modifié", to_fix: "À corriger", draft: "Brouillon" }[v.status]) + "</span></p>" +
        (can ? '<div class="aib-row"><label class="aib-field" style="flex:1;max-width:340px"><span>Nom du site</span><input id="aib-site-name" value="' + esc(pl.site.name) + '" maxlength="80"></label><button class="aib-btn" data-act="rename-site">Renommer</button></div>' : "") +
        pl.pages.map(function (pg, i) {
          return '<article class="aib-page"><header><strong>' + esc(pg.name) + '</strong><span class="aib-note">/' + esc(pg.slug) + '</span><span class="aib-chip" data-k="' + (AV[pg.availability] || AV.available)[0] + '">' + (AV[pg.availability] || AV.available)[1] + '</span><span class="aib-chip">' + ({ essential: "Essentielle", recommended: "Recommandée", optional: "Facultative" }[pg.priority] || "") + '</span><span class="aib-chip" data-k="' + (pg.origin === "user" ? "user" : "ai") + '">' + (pg.origin === "user" ? "Demandée" : "Proposée par l'IA") + "</span>" +
            (can ? '<span style="margin-left:auto" class="aib-row"><button class="aib-btn aib-sm" data-act="page-up" data-key="' + esc(pg.key) + '" ' + (i === 0 ? "disabled" : "") + ' aria-label="Monter la page ' + esc(pg.name) + '">↑</button><button class="aib-btn aib-sm" data-act="page-down" data-key="' + esc(pg.key) + '" ' + (i === pl.pages.length - 1 ? "disabled" : "") + ' aria-label="Descendre la page ' + esc(pg.name) + '">↓</button><button class="aib-btn aib-sm" data-act="page-rename" data-key="' + esc(pg.key) + '">Renommer</button><button class="aib-btn aib-sm" data-act="page-goal" data-key="' + esc(pg.key) + '">Objectif</button><button class="aib-btn aib-sm" data-act="page-ask" data-key="' + esc(pg.key) + '">Demander à l\'IA</button><button class="aib-btn aib-sm aib-danger" data-act="page-del" data-key="' + esc(pg.key) + '">Supprimer</button></span>' : "") + '</header><div class="aib-body-in"><p class="aib-note">' + esc(pg.purpose) + "</p>" +
            pg.sections.map(function (s, j) { return '<div class="aib-sec"><span class="grow"><strong>' + esc(s.purpose || s.type) + '</strong> <span class="aib-note">(' + esc(s.type) + ")</span></span>" + ((AV[s.availability] || AV.available)[0] !== "ok" ? '<span class="aib-chip" data-k="' + AV[s.availability][0] + '" title="' + esc((s.missing || []).join(" ; ")) + '">' + AV[s.availability][1] + "</span>" : "") + (can ? '<button class="aib-btn aib-sm" data-act="sec-up" data-page="' + esc(pg.key) + '" data-key="' + esc(s.key) + '" data-to="' + (j - 1) + '" ' + (j === 0 ? "disabled" : "") + ' aria-label="Monter la section">↑</button><button class="aib-btn aib-sm" data-act="sec-up" data-page="' + esc(pg.key) + '" data-key="' + esc(s.key) + '" data-to="' + (j + 1) + '" ' + (j === pg.sections.length - 1 ? "disabled" : "") + ' aria-label="Descendre la section">↓</button><button class="aib-btn aib-sm aib-danger" data-act="sec-del" data-page="' + esc(pg.key) + '" data-key="' + esc(s.key) + '" aria-label="Supprimer la section">×</button>' : "") + "</div>"; }).join("") +
            (can ? '<div class="aib-row"><select data-sectype="' + esc(pg.key) + '" aria-label="Type de section">' + SEC_TYPES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + "</option>"; }).join("") + '</select><button class="aib-btn aib-sm" data-act="sec-add" data-page="' + esc(pg.key) + '">Ajouter une section</button></div>' : "") + "</div></article>";
        }).join("") +
        (can ? '<div class="aib-row"><label class="aib-field" style="max-width:300px"><span>Nouvelle page</span><input id="aib-newpage" maxlength="80" placeholder="Ex. À propos"></label><button class="aib-btn" data-act="page-add">Ajouter la page</button></div>' : "") +
        '<section class="aib-card" style="margin-top:14px"><h2>Fonctionnalités</h2><ul class="aib-list">' + pl.features.map(function (f) { return "<li><strong>" + esc(f.label) + '</strong> <span class="aib-chip" data-k="' + (f.level === "required" ? "warn" : "") + '">' + ({ required: "Indispensable", recommended: "Recommandée", optional: "Facultative" }[f.level]) + '</span> <span class="aib-chip" data-k="' + (AV[f.availability] || AV.available)[0] + '">' + (AV[f.availability] || AV.available)[1] + "</span>" + (f.availabilityReason ? '<span class="aib-note"> — ' + esc(f.availabilityReason) + "</span>" : "") + (can && f.availability === "unavailable" && f.level === "required" && !f.acknowledged ? ' <button class="aib-btn aib-sm" data-act="feat-ack" data-key="' + esc(f.key) + '">Continuer sans</button>' : "") + (can ? ' <button class="aib-btn aib-sm" data-act="feat-del" data-key="' + esc(f.key) + '" aria-label="Retirer ' + esc(f.label) + '">Retirer</button>' : "") + "</li>"; }).join("") + "</ul></section>" +
        (pl.recommendations.length ? '<section class="aib-card"><h2>Recommandations de l\'IA</h2><ul class="aib-list">' + pl.recommendations.map(function (r) { return "<li>" + esc(r.text) + ' <span class="aib-note">' + esc(r.why) + "</span> " + (r.accepted ? '<span class="aib-chip" data-k="ok">Acceptée</span>' : (can ? '<button class="aib-btn aib-sm" data-act="rec-ok" data-id="' + esc(r.id) + '">Accepter</button> <button class="aib-btn aib-sm" data-act="rec-no" data-id="' + esc(r.id) + '">Refuser</button>' : "")) + "</li>"; }).join("") + "</ul></section>" : "") +
        (warns.length ? '<section class="aib-card"><h2>Alertes</h2>' + warns.map(function (w) { return '<p class="' + (w.level === "error" ? "aib-errline" : "aib-warnline") + '">' + esc(w.message) + "</p>"; }).join("") + "</section>" : "") +
        (can ? '<div class="aib-row"><button class="aib-btn aib-primary" data-act="plan-validate"' + (v.status === "validated" ? " disabled" : "") + ">Valider le plan</button>" + (v.status === "validated" ? '<button class="aib-btn" data-act="go" data-step="pages">Passer aux pages</button>' : "") + "</div>" : "");
    }, function (e) { fail(e, views.plan); });
  };

  // ---------- étape 3 : pages ----------
  views.pages = function () {
    var m = $("#aib-main"), can = boot.perms.write;
    call("GET", "/projets/" + S.pid + "/pages").then(function (j) {
      var run = j.run, ps = j.pages, plan = S.st.steps[1].status === "done";
      m.innerHTML = "<h1>Pages</h1><p class=\"aib-lead\">Les pages sont créées avec le Page Generator à partir du plan validé, en <strong>brouillon</strong> : rien n'est publié.</p>" +
        (!plan ? '<p class="aib-warnline">Validez d\'abord le plan du site.</p>' : "") +
        (run && run.status === "proposed" ? '<section class="aib-card"><h2>Proposition de pages à examiner</h2><ul class="aib-list">' + run.pages.map(function (p) { return "<li><strong>" + esc(p.name) + '</strong> <span class="aib-chip" data-k="' + (p.status === "ready" ? "ok" : "err") + '">' + (p.status === "ready" ? "Prête" : p.status === "unavailable" ? "Indisponible" : "Invalide") + "</span> " + p.sections + " section(s)" + (p.existing ? ' <span class="aib-warnline">Une page « ' + esc(p.existing.name) + ' » existe déjà : choisissez une stratégie.</span> <select data-decision="' + esc(p.key) + '"><option value="create">Créer une nouvelle page</option><option value="version">Nouvelle version</option><option value="skip">Ignorer</option></select>' : "") + (p.reason ? '<div class="aib-note">' + esc(p.reason) + "</div>" : "") + (p.warnings.length ? '<div class="aib-note">' + p.warnings.map(esc).join("<br>") + "</div>" : "") + "</li>"; }).join("") + '</ul><div class="aib-row"><button class="aib-btn aib-primary" data-act="pages-apply"' + (can ? "" : " disabled") + '>Appliquer en brouillon</button></div></section>' : "") +
        (can && plan ? '<div class="aib-row"><button class="aib-btn aib-primary" data-act="pages-gen">' + (run ? "Régénérer la proposition de pages" : "Générer les pages") + '</button><label class="aib-note"><input type="checkbox" id="aib-pages-ai"> Compléter les textes d\'exemple avec l\'IA (module IA du site requis)</label></div>' : "") +
        (ps.length ? '<table class="aib-table" style="margin-top:14px"><thead><tr><th>Page</th><th>Adresse</th><th>Statut</th><th>Sections</th><th>Textes</th><th>Modifiée</th><th></th></tr></thead><tbody>' + ps.map(function (p) { return "<tr><td><strong>" + esc(p.name) + "</strong></td><td>/" + esc(p.slug || "") + '</td><td><span class="aib-chip" data-k="' + (p.status === "published" ? "ok" : "warn") + '">' + (p.status === "published" ? (p.hasDraft ? "En ligne + brouillon" : "En ligne") : "Brouillon") + "</span></td><td>" + p.sections + '</td><td><span class="aib-chip" data-k="' + (p.contentState === "applied" ? "ok" : p.contentState === "none" ? "warn" : "ai") + '">' + ({ applied: "Appliqués", accepted: "Acceptés", proposed: "Proposés", none: "Exemples" }[p.contentState]) + "</span>" + (p.placeholders ? ' <span class="aib-note">' + p.placeholders + " à remplacer</span>" : "") + "</td><td>" + esc(p.updatedAt || "") + '</td><td class="aib-row"><button class="aib-btn aib-sm" data-act="preview-page" data-id="' + p.pageId + '">Aperçu</button><a class="aib-btn aib-sm" href="' + esc(p.editUrl) + '" target="_blank" rel="noopener">Éditeur</a><button class="aib-btn aib-sm" data-act="content-page" data-id="' + p.pageId + '">Contenus</button></td></tr>'; }).join("") + "</tbody></table>" + (can ? '<div class="aib-row"><button class="aib-btn aib-danger" data-act="pages-undo">Annuler la génération de pages</button></div>' : "") : (run && run.status === "proposed" ? "" : '<p class="aib-empty">Aucune page générée pour le moment.</p>'));
    }, function (e) { fail(e, views.pages); });
  };

  // ---------- étape 4 : design ----------
  views.design = function () {
    var m = $("#aib-main"), can = boot.perms.design;
    call("GET", "/projets/" + S.pid + "/design").then(function (j) {
      var run = j.run;
      m.innerHTML = "<h1>Design et identité visuelle</h1><p class=\"aib-lead\">Le Design Generator propose des directions artistiques vérifiées (contrastes, polices). L'application écrit dans le <strong>brouillon du Personnaliser</strong> : vos réglages manuels sont protégés et rien n'est publié.</p>" +
        (can ? '<form class="aib-card" data-form="design"><label class="aib-field"><span>Style souhaité (facultatif)</span><input name="text" maxlength="300" value="' + esc(((S.st.project.draft || {}).style) || "") + '" placeholder="Ex. élégant, bleu marine, espaces généreux"></label><div class="aib-row"><button class="aib-btn aib-primary" type="submit">' + (run ? "Proposer d'autres directions" : "Proposer des directions") + '</button><label class="aib-note"><input type="checkbox" name="ia"> Affiner avec l\'IA</label></div></form>' : '<p class="aib-note">Le droit « appearance.styles » est requis pour proposer ou appliquer un design.</p>') +
        (run ? '<div class="aib-dir">' + run.proposals.map(function (p) { var pal = p.design.palette; return '<article class="aib-card"><h2>' + esc(p.name) + '</h2><p class="aib-note">' + esc(p.description) + '</p><div class="aib-swatches" aria-label="Palette">' + ["primary", "secondary", "accent", "background", "text"].map(function (k) { return '<span class="aib-swatch" style="background:' + esc(pal[k]) + '" title="' + k + " " + esc(pal[k]) + '"></span>'; }).join("") + "</div><p class=\"aib-note\">Polices : " + esc(((p.design.typography || {}).pair) || "") + "</p><ul class=\"aib-list\">" + p.pros.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + (p.limits || []).map(function (x) { return '<li class="aib-note">' + esc(x) + "</li>"; }).join("") + "</ul>" + (can ? '<div class="aib-row"><button class="aib-btn aib-sm" data-act="design-compare" data-key="' + esc(p.key) + '">Comparer avec l\'actuel</button><button class="aib-btn aib-primary aib-sm" data-act="design-apply" data-key="' + esc(p.key) + '"' + (run.status === "applied" ? " disabled" : "") + ">Appliquer</button></div>" : "") + '<div data-cmp="' + esc(p.key) + '"></div></article>'; }).join("") + "</div>" + (run.status === "applied" ? '<div class="aib-row"><span class="aib-chip" data-k="ok">Direction appliquée</span><a class="aib-btn aib-sm" href="' + esc(boot.siteBase) + '/personnaliser" target="_blank" rel="noopener">Réglages précis (Personnaliser)</a>' + (can ? '<button class="aib-btn aib-danger aib-sm" data-act="design-undo">Annuler l\'application</button>' : "") + "</div>" : "") : '<p class="aib-empty">Aucune proposition pour le moment.</p>');
    }, function (e) { fail(e, views.design); });
  };

  // ---------- étape 5 : contenus ----------
  views.contents = function () {
    var m = $("#aib-main"), can = boot.perms.write;
    call("GET", "/projets/" + S.pid + "/contenus").then(function (j) {
      S.cache.contents = j.pages;
      m.innerHTML = "<h1>Contenus</h1><p class=\"aib-lead\">Les textes sont écrits dans les <strong>champs natifs</strong> des sections, à partir de ce que vous avez fourni. Aucun chiffre, contact ou garantie n'est inventé : les informations manquantes restent à compléter. Un texte que vous modifiez n'est jamais remplacé sans votre accord.</p>" +
        (j.pages.length ? j.pages.map(function (p) { return '<article class="aib-page"><header><strong>' + esc(p.name) + '</strong><span class="aib-chip" data-k="' + (p.contentState === "applied" ? "ok" : p.contentState === "none" ? "warn" : "ai") + '">' + ({ applied: "Textes appliqués", accepted: "Acceptés", proposed: "Proposés", none: "Textes d'exemple" }[p.contentState]) + "</span>" + (p.placeholders ? '<span class="aib-note">' + p.placeholders + " espace(s) réservé(s)</span>" : "") + (can ? '<span style="margin-left:auto" class="aib-row"><button class="aib-btn aib-sm aib-primary" data-act="content-gen" data-id="' + p.pageId + '">Générer les textes</button></span>' : "") + '</header><div class="aib-body-in" data-pagebox="' + p.pageId + '">' + (p.sets.length ? '<button class="aib-btn aib-sm" data-act="content-open" data-id="' + p.pageId + '" data-set="' + p.sets[0].id + '">Ouvrir la dernière proposition (' + esc(p.sets[0].status) + ")</button>" : '<p class="aib-note">Aucune proposition de textes.</p>') + "</div></article>"; }).join("") : '<p class="aib-empty">Générez d\'abord les pages.</p>');
      if (S.ui.openSet) { var o = S.ui.openSet; S.ui.openSet = null; openSet(o.page, o.set); }
    }, function (e) { fail(e, views.contents); });
  };
  var SRC = { ai: ["ai", "Généré par IA"], user: ["user", "Modifié manuellement"] };
  function openSet(pageId, setId) {
    var box = $('[data-pagebox="' + pageId + '"]'); if (!box) return; box.innerHTML = '<div class="aib-loading">Chargement…</div>';
    fetch(boot.siteBase + "/contenus/ensembles/" + setId, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error); var set = j.set; S.cache.set = set;
      var issues = set.issues.filter(function (i) { return i.severity === "critical" && !i.resolved; });
      box.innerHTML = '<p class="aib-note">Proposition n° ' + set.id + ' · <span class="aib-chip" data-k="' + (set.status === "applied" ? "ok" : "ai") + '">' + esc(set.status) + "</span> · langue " + esc(set.language) + "</p>" +
        (issues.length ? '<p class="aib-errline">' + issues.length + " problème(s) critique(s) à résoudre avant d'appliquer : " + issues.slice(0, 3).map(function (i) { return esc(i.message); }).join(" ") + "</p>" : "") +
        Object.keys(set.fields).map(function (k) { var f = set.fields[k], s = SRC[f.source] || SRC.ai; return '<div class="aib-field-edit" data-fk="' + esc(k) + '"><div style="flex:1;min-width:0"><div><strong>' + esc(f.label) + '</strong> <span class="aib-chip" data-k="' + s[0] + '">' + s[1] + "</span>" + (f.appliedValue !== undefined ? ' <span class="aib-chip" data-k="ok">Appliqué</span>' : "") + (f.locked ? ' <span class="aib-chip">Verrouillé</span>' : "") + (/\[[^\]]+\]/.test(f.value) ? ' <span class="aib-chip" data-k="warn">À compléter</span>' : "") + '</div><textarea rows="2" maxlength="' + f.max + '" data-edit="' + esc(k) + '" ' + (boot.perms.write ? "" : "disabled") + ">" + esc(f.value) + '</textarea><div class="aib-variants" hidden></div></div>' + (boot.perms.write ? '<div class="aib-row" style="flex-direction:column;align-items:stretch"><button class="aib-btn aib-sm" data-act="field-save" data-set="' + set.id + '" data-k="' + esc(k) + '">Enregistrer</button><select data-op="' + esc(k) + '" aria-label="Retravailler ce texte"><option value="">Retravailler…</option><option value="shorten">Raccourcir</option><option value="expand">Développer</option><option value="professional">Plus professionnel</option><option value="commercial">Plus commercial</option><option value="simplify">Simplifier</option><option value="fix">Corriger</option><option value="seo">Améliorer le SEO</option><option value="variants">Plusieurs variantes</option></select><button class="aib-btn aib-sm" data-act="field-lock" data-set="' + set.id + '" data-k="' + esc(k) + '" data-lock="' + (f.locked ? "0" : "1") + '">' + (f.locked ? "Déverrouiller" : "Verrouiller") + "</button></div>" : "") + "</div>"; }).join("") +
        '<div class="aib-card" style="margin-top:10px"><h2>SEO</h2><p><strong>Titre :</strong> ' + esc(set.seo.title) + "<br><strong>Description :</strong> " + esc(set.seo.description) + "<br><strong>Mot-clé :</strong> " + esc(set.seo.focusKeyword) + " " + (set.seo.keywordSource ? '<span class="aib-chip">' + ({ provided: "fourni", suggested: "suggéré par l'IA", external: "source externe" }[set.seo.keywordSource]) + "</span>" : "") + '</p><p class="aib-note">' + esc((set.seo.keywords || {}).note || "") + "</p></div>" +
        (set.questions.length ? '<p class="aib-note"><strong>Informations à fournir :</strong> ' + set.questions.map(function (q) { return esc(q.question); }).join(" · ") + "</p>" : "") +
        (boot.perms.write ? '<div class="aib-row"><button class="aib-btn" data-act="set-accept" data-set="' + set.id + '"' + (set.status === "applied" ? " disabled" : "") + '>Valider les textes</button><button class="aib-btn aib-primary" data-act="set-apply" data-set="' + set.id + '" data-page="' + pageId + '">Appliquer à la page (brouillon)</button></div>' : "");
    }).catch(function (e) { fail(e); box.innerHTML = '<p class="aib-errline">' + esc(e.message) + "</p>"; });
  }
  function eng(path, body) { return fetch(boot.siteBase + "/contenus" + path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body || {}) }).then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) { var e = new Error(j.error || "Erreur."); e.code = j.code; throw e; } return j; }); }

  // ---------- étape 6 : médias ----------
  var NEED = { needed: ["warn", "Manquante"], queued: ["ai", "En file"], running: ["ai", "En cours"], generated: ["ai", "Générée (à choisir)"], assigned: ["ok", "Utilisée"], skipped: ["", "Ignorée"], no_slot: ["", "Sans emplacement natif"] };
  views.media = function () {
    var m = $("#aib-main"), can = boot.perms.write;
    call("GET", "/projets/" + S.pid + "/medias").then(function (j) {
      var needs = j.needs, open = needs.filter(function (n) { return n.status === "needed"; }), demo = j.providers.filter(function (p) { return p.id === "demo"; })[0];
      m.innerHTML = "<h1>Images et médias</h1><p class=\"aib-lead\">Les images viennent de la médiathèque du site. Une image générée par IA est toujours étiquetée comme telle et n'est <strong>jamais</strong> présentée comme une photographie réelle de votre entreprise. Le fournisseur de démonstration ne coûte rien ; un fournisseur réel exige une autorisation de dépense.</p>" +
        (can ? '<div class="aib-row"><button class="aib-btn" data-act="media-plan">Analyser les besoins d\'images</button><a class="aib-btn" href="' + esc(boot.siteBase) + '/medias" target="_blank" rel="noopener">Importer dans la médiathèque</a><a class="aib-btn" href="' + esc(boot.siteBase) + '/medias-ia" target="_blank" rel="noopener">Bibliothèque et métadonnées</a></div>' : "") +
        (j.tasks.some(function (t) { return t.status === "queued" || t.status === "running"; }) ? '<p class="aib-note" aria-live="polite">Génération en cours : elle n\'est pas terminée tant que le serveur ne l\'a pas confirmé.</p>' : "") +
        (needs.length ? '<table class="aib-table" style="margin-top:12px"><thead><tr><th>Emplacement</th><th>Page</th><th>Statut</th><th>Consigne</th><th></th></tr></thead><tbody>' + needs.map(function (n) { var s = NEED[n.status] || ["", n.status]; var task = j.tasks.filter(function (t) { return t.needKey === n.key; })[0]; return "<tr><td>" + esc(n.description) + "</td><td>" + esc(n.pageName) + '</td><td><span class="aib-chip" data-k="' + s[0] + '">' + s[1] + "</span>" + (task && task.status === "failed" ? '<div class="aib-errline">' + esc(task.error || "Échec de la génération.") + "</div>" : "") + '</td><td class="aib-note">' + esc((n.prompt || "").slice(0, 120)) + '…</td><td class="aib-row">' + (can && n.status !== "no_slot" ? '<button class="aib-btn aib-sm" data-act="media-gen" data-key="' + esc(n.key) + '">' + (n.status === "needed" ? "Générer" : "Régénérer") + '</button><button class="aib-btn aib-sm" data-act="media-pick" data-key="' + esc(n.key) + '">Choisir dans la médiathèque</button>' : "") + "</td></tr>"; }).join("") + "</tbody></table>" : '<p class="aib-empty">Aucun besoin analysé : lancez l\'analyse après avoir généré les pages.</p>') +
        (open.length && can ? '<div class="aib-row"><label class="aib-field" style="max-width:260px"><span>Fournisseur</span><select id="aib-prov">' + j.providers.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.usable ? "" : " disabled") + ">" + esc(p.label) + (p.usable ? "" : " — indisponible") + "</option>"; }).join("") + '</select></label><button class="aib-btn" data-act="media-est" data-keys="' + open.map(function (n) { return esc(n.key); }).join(",") + '">Estimer le coût</button><button class="aib-btn aib-primary" data-act="media-genall" data-keys="' + open.map(function (n) { return esc(n.key); }).join(",") + '">Générer les ' + open.length + " images manquantes</button></div><div id=\"aib-est\" class=\"aib-note\"></div>" : "") + '<div id="aib-gal"></div>';
      var failedUnusable = j.providers.filter(function (p) { return !p.usable && p.why; }); void demo; void failedUnusable;
    }, function (e) { fail(e, views.media); });
  };

  // ---------- étape 7 : aperçu ----------
  var WIDTH = { desktop: "100%", tablet: "768px", mobile: "390px" };
  views.preview = function () {
    var m = $("#aib-main");
    call("GET", "/projets/" + S.pid + "/apercu").then(function (j) {
      var ps = j.pages; S.ui.device = S.ui.device || "desktop"; S.ui.pv = S.ui.pv || (ps[0] && ps[0].pageId);
      m.innerHTML = "<h1>Prévisualisation</h1><p class=\"aib-lead\">L'aperçu utilise le moteur de rendu natif de Kolakisa, sur le brouillon actuel. Il reflète vos modifications des étapes précédentes.</p>" +
        (ps.length ? '<div class="aib-row"><label class="aib-field" style="min-width:220px"><span>Page</span><select id="aib-pv-page">' + ps.map(function (p) { return '<option value="' + p.pageId + '"' + (p.pageId === S.ui.pv ? " selected" : "") + ">" + esc(p.name) + "</option>"; }).join("") + '</select></label><div class="aib-devices" role="group" aria-label="Appareil">' + ["desktop", "tablet", "mobile"].map(function (d) { return '<button type="button" class="aib-btn aib-sm" data-act="device" data-d="' + d + '" aria-pressed="' + (S.ui.device === d) + '">' + { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile" }[d] + "</button>"; }).join("") + '</div><button class="aib-btn aib-sm" data-act="go" data-step="pages">Retour à l\'édition</button></div><div class="aib-frame-wrap"><iframe class="aib-frame" id="aib-frame" title="Aperçu de la page" style="width:' + WIDTH[S.ui.device] + '" src="/marketing/pages/' + S.ui.pv + '/apercu" sandbox="allow-same-origin allow-scripts allow-forms"></iframe></div>' +
          '<section class="aib-card" style="margin-top:12px"><h2>Vérifications</h2>' + (j.checks.length ? j.checks.map(function (c) { return '<p class="' + (c.level === "error" ? "aib-errline" : c.level === "warning" ? "aib-warnline" : "aib-note") + '"><strong>' + esc(c.page) + " :</strong> " + esc(c.message) + "</p>"; }).join("") : '<p class="aib-note">Aucun lien cassé, image manquante ou espace réservé détecté.</p>') + '<p class="aib-note">Cohérence visuelle et version mobile : à relire dans l\'aperçu (non vérifiées automatiquement).</p></section>' +
          (boot.perms.write ? '<div class="aib-row">' + (j.previewed ? '<span class="aib-chip" data-k="ok">Site relu</span><button class="aib-btn aib-sm" data-act="unreview">Annuler la relecture</button>' : '<button class="aib-btn aib-primary" data-act="reviewed">J\'ai relu le site</button>') + "</div>" : "") : '<p class="aib-empty">Aucune page à prévisualiser : générez d\'abord les pages.</p>');
    }, function (e) { fail(e, views.preview); });
  };

  // ---------- étape 8 : publication ----------
  views.publish = function () {
    var m = $("#aib-main");
    call("GET", "/projets/" + S.pid + "/publication").then(function (j) {
      var c = j.check;
      m.innerHTML = "<h1>Publication</h1><p class=\"aib-lead\">La publication utilise le système natif de Kolakisa, avec ses contrôles. Un point bloquant empêche la mise en ligne ; un avertissement la laisse possible.</p>" +
        '<section class="aib-card">' + c.items.map(function (i) { return '<div class="aib-check" data-ok="' + i.ok + '" data-level="' + i.level + '"><span class="aib-check-ic" aria-hidden="true">' + (i.ok === true ? "✓" : i.ok === false ? (i.level === "error" ? "✕" : "!") : "i") + '</span><span><strong>' + esc(i.label) + "</strong> — " + (i.ok === true ? "OK" : i.ok === false ? (i.level === "error" ? "Bloquant" : "Avertissement") : "À vérifier") + '<br><span class="aib-note">' + esc(i.detail) + "</span></span></div>"; }).join("") + "</section>" +
        '<div class="aib-row"><button class="aib-btn aib-primary" data-act="publish"' + (c.canPublish && boot.perms.publish ? "" : " disabled") + ">Publier les pages du projet</button>" + (!boot.perms.publish ? '<span class="aib-note">Le droit de publier est requis.</span>' : !c.canPublish ? '<span class="aib-errline">' + c.blocking.length + " point(s) bloquant(s) à corriger.</span>" : "") + '</div><p class="aib-note">Le domaine n\'est pas modifié par la publication : voir <a href="' + esc(boot.siteBase) + '/domaines">Domaines du site</a>.</p>';
    }, function (e) { fail(e, views.publish); });
  };

  // ---------- assistant ----------
  function renderAssist() {
    var a = $("#aib-assist"); if (!S.pid) { a.innerHTML = ""; return; }
    a.innerHTML = '<header>Assistant IA <button class="aib-btn aib-sm" data-act="assist" aria-label="Replier l\'assistant">×</button></header><div class="aib-chat" id="aib-chat" aria-live="polite"></div><div class="aib-ctx" id="aib-ctx"></div><form class="aib-send" data-form="chat"><textarea name="m" rows="2" maxlength="600" placeholder="Ex. Ajoute une page À propos" aria-label="Votre demande"' + (boot.perms.write ? "" : " disabled") + '></textarea><button class="aib-btn aib-primary" type="submit"' + (boot.perms.write ? "" : " disabled") + ">Envoyer</button></form>";
    paintChat(); paintCtx();
  }
  function paintCtx() { var c = $("#aib-ctx"); if (!c) return; var st = STEPS.filter(function (s) { return s[0] === S.step; })[0]; c.textContent = "Contexte : étape « " + (st ? st[1] : "") + " »" + (S.ui.ctxPage ? " · page " + S.ui.ctxPage : "") + (S.ui.ctxField ? " · champ sélectionné" : "") + (S.ui.ctxNeed ? " · image sélectionnée" : ""); }
  function loadChat() { call("GET", "/projets/" + S.pid + "/journal").then(function (j) { S.chat = j.events; paintChat(); }, function () {}); }
  function paintChat() {
    var c = $("#aib-chat"); if (!c) return;
    c.innerHTML = S.chat.filter(function (e) { return e.kind === "chat" || e.kind === "change" || e.kind === "system"; }).slice(-40).map(function (e) {
      var role = e.kind === "chat" ? e.role : "system", p = e.proposal;
      return '<div class="aib-msg" data-role="' + role + '">' + esc(e.text) + (p && e.status === "pending" ? proposalHtml(p, e.id) : e.status === "accepted" ? '<div class="aib-note">✓ Acceptée</div>' : e.status === "rejected" ? '<div class="aib-note">Refusée</div>' : "") + "</div>";
    }).join("") || '<div class="aib-msg" data-role="system">Demandez une modification (« Ajoute une page À propos ») ou un conseil. Rien n\'est modifié sans votre accord.</div>';
    c.scrollTop = c.scrollHeight;
  }
  function proposalHtml(p, id) {
    return '<div class="aib-prop"><strong>' + esc(p.summary) + "</strong>" + (p.element ? '<div class="aib-note">Élément : ' + esc(p.element) + "</div>" : "") + (p.before || p.after ? '<div class="ba"><div class="b"><small>Avant</small><br>' + esc(p.before || "") + '</div><div class="a"><small>Après</small><br>' + esc(p.after || "") + "</div></div>" : "") + (p.estimate ? '<div class="aib-note">Coût estimé : ' + (p.estimate.totalMicroUsd === null ? "inconnu" : p.estimate.totalMicroUsd + " µ$") + "</div>" : "") + '<div class="aib-row"><button class="aib-btn aib-primary aib-sm" data-act="prop-ok" data-id="' + id + '">Accepter</button><button class="aib-btn aib-sm" data-act="prop-no" data-id="' + id + '">Refuser</button></div></div>';
  }

  // ---------- actions ----------
  function act(el) {
    var a = el.getAttribute("data-act"), d = function (k) { return el.getAttribute("data-" + k); }, pid = S.pid;
    var done = function () { return loadState().then(function () { go(S.step); }); };
    switch (a) {
      case "go": return flush().then(function () { go(d("step")); });
      case "open": return openProject(Number(d("id")));
      case "projects": history.pushState({}, "", boot.base); S.pid = null; return viewProjects();
      case "menu": var mn = $("#aib-menu"); mn.hidden = !mn.hidden; el.setAttribute("aria-expanded", String(!mn.hidden)); return;
      case "assist": S.assistOpen = !S.assistOpen; root.setAttribute("data-assist", S.assistOpen ? "open" : "closed"); $("#aib-assist-btn").setAttribute("aria-pressed", String(S.assistOpen)); return;
      case "rename": var nm = prompt("Nom du projet", S.st.project.name); if (nm && nm.trim()) return call("POST", "/projets/" + pid + "/brouillon", { fields: { projectName: nm.trim() }, revision: S.st.project.revision }).then(function (j) { S.st.project = j.project; renderChrome(); }, fail); return;
      case "archive": if (confirm("Archiver ce projet ? Les pages déjà créées ne sont pas supprimées.")) return call("POST", "/projets/" + pid + "/archiver", {}).then(function () { history.pushState({}, "", boot.base); S.pid = null; viewProjects(); }, fail); return;
      case "save": return flush().then(function () { return loadState(); }).then(function () { setSave("saved"); toast("Projet enregistré."); }, fail);
      case "undo": busy(el, true); return call("POST", "/projets/" + pid + "/annuler", {}).then(function (j) { toast("Annulé : " + j.undone.text); return done(); }, fail).then(function () { busy(el, false); });
      case "redo": busy(el, true); return call("POST", "/projets/" + pid + "/retablir", {}).then(function (j) { toast("Rétabli : " + j.redone.text); return done(); }, fail).then(function () { busy(el, false); });
      case "restore-draft": try { var b = JSON.parse(localStorage.getItem("aib:draft:" + pid)); return saveDraft(b.fields).then(done); } catch (e) { return; }
      case "planify": busy(el, true); return flush().then(function () { return call("POST", "/projets/" + pid + "/planifier", { proceedWithAssumptions: d("assume") === "1" }); }).then(function () { toast("Plan proposé. Relisez-le avant de le valider."); S.step = "plan"; return done(); }, function (e) { fail(e); busy(el, false); });
      case "rename-site": return opPlan({ op: "rename_site", name: $("#aib-site-name").value }, "Site renommé.");
      case "page-add": var np = $("#aib-newpage").value.trim(); if (!np) return toast("Donnez un nom à la page.", "error"); return opPlan({ op: "add_page", name: np }, "Page ajoutée.");
      case "page-del": if (confirm("Retirer cette page du plan ? (Les pages déjà générées dans le site ne sont pas supprimées.)")) return opPlan({ op: "remove_page", key: d("key") }, "Page retirée du plan."); return;
      case "page-rename": var rn = prompt("Nouveau nom de la page"); if (rn) return opPlan({ op: "rename_page", key: d("key"), name: rn }, "Page renommée."); return;
      case "page-goal": var pg = S.cache.plan.plan.pages.filter(function (x) { return x.key === d("key"); })[0]; var gl = prompt("Objectif de la page", pg ? pg.purpose : ""); if (gl !== null) return opPlan({ op: "set_page", key: d("key"), purpose: gl }, "Objectif modifié."); return;
      case "page-up": case "page-down": var main = S.cache.plan.plan.navigation.main, idx = main.indexOf(d("key")); if (idx < 0) return toast("Cette page n'est pas dans le menu principal.", "error"); return opPlan({ op: "move_in_navigation", menu: "main", key: d("key"), to: idx + (a === "page-up" ? -1 : 1) }, "Menu réorganisé.");
      case "page-ask": S.ui.ctxPage = d("key"); paintCtx(); S.assistOpen = true; root.setAttribute("data-assist", "open"); var ta = $('[data-form="chat"] textarea'); if (ta) { ta.focus(); ta.placeholder = "Ex. Ajoute une section FAQ"; } return;
      case "sec-add": var sel = $('[data-sectype="' + d("page") + '"]'); return opPlan({ op: "add_section", pageKey: d("page"), type: sel.value, purpose: sel.options[sel.selectedIndex].text }, "Section ajoutée.");
      case "sec-del": return opPlan({ op: "remove_section", pageKey: d("page"), key: d("key") }, "Section retirée.");
      case "sec-up": return opPlan({ op: "move_section", pageKey: d("page"), key: d("key"), to: Number(d("to")) }, "Section déplacée.");
      case "feat-ack": return opPlan({ op: "acknowledge_feature", key: d("key") });
      case "feat-del": return opPlan({ op: "remove_feature", key: d("key") }, "Fonctionnalité retirée.");
      case "rec-ok": return opPlan({ op: "accept_recommendation", id: d("id") }, "Recommandation acceptée.");
      case "rec-no": return opPlan({ op: "reject_recommendation", id: d("id") }, "Recommandation refusée.");
      case "plan-validate": busy(el, true); return call("POST", "/projets/" + pid + "/plan/valider", { revision: S.cache.plan.revision }).then(function () { toast("Plan validé."); return done(); }, function (e) { fail(e); busy(el, false); });
      case "pages-gen": busy(el, true); return call("POST", "/projets/" + pid + "/pages/generer", { ia: $("#aib-pages-ai") && $("#aib-pages-ai").checked }).then(function (j) { toast("Proposition prête" + (j.skipped.length ? " · " + j.skipped.length + " section(s) écartée(s) (indisponibles)" : "") + ". Rien n'est encore enregistré."); return done(); }, function (e) { fail(e); busy(el, false); });
      case "pages-apply": var dec = {}; Array.prototype.forEach.call(document.querySelectorAll("[data-decision]"), function (s) { dec[s.getAttribute("data-decision")] = s.value; }); busy(el, true); return call("POST", "/projets/" + pid + "/pages/appliquer", { decisions: dec }).then(function (j) { toast(Object.keys(j.applied).length + " page(s) enregistrée(s) en brouillon."); return done(); }, function (e) { fail(e); busy(el, false); });
      case "pages-undo": if (confirm("Annuler la génération de pages ? Les pages modifiées depuis seront laissées intactes.")) return call("POST", "/projets/" + pid + "/pages/annuler", {}).then(function (j) { toast("Génération annulée (" + j.report.filter(function (r) { return r.done; }).length + " page(s) retirée(s))."); return done(); }, fail); return;
      case "preview-page": S.ui.pv = Number(d("id")); return go("preview");
      case "content-page": S.ui.openPage = Number(d("id")); return go("contents");
      case "design-compare": return call("GET", "/projets/" + S.pid + "/design/comparer?key=" + encodeURIComponent(d("key"))).then(function (j) { var box = $('[data-cmp="' + d("key") + '"]'); var s = j.comparison.summary; box.innerHTML = '<p class="aib-note">' + s.same + " identique(s) · " + s.replace + " à remplacer · <strong>" + s.protected + " protégé(s)</strong> (vos réglages manuels ne sont pas écrasés).</p>"; }, fail);
      case "design-apply": busy(el, true); return call("POST", "/projets/" + pid + "/design/appliquer", { key: d("key") }).then(function () { toast("Direction appliquée au brouillon du Personnaliser."); return done(); }, function (e) { fail(e); busy(el, false); });
      case "design-undo": return call("POST", "/projets/" + pid + "/design/annuler", {}).then(function () { toast("Application annulée."); return done(); }, fail);
      case "content-gen": busy(el, true); return call("POST", "/projets/" + pid + "/contenus/generer", { pageId: Number(d("id")) }).then(function (j) { toast("Textes proposés. Rien n'est encore écrit dans la page."); S.ui.openSet = { page: Number(d("id")), set: j.set.id }; return loadState().then(function () { views.contents(); }); }, function (e) { fail(e); busy(el, false); });
      case "content-open": return openSet(Number(d("id")), Number(d("set")));
      case "field-save": var tx = $('[data-edit="' + d("k") + '"]'); return eng("/ensembles/" + d("set") + "/modifier", { field: d("k"), text: tx.value }).then(function () { toast("Texte enregistré (modification manuelle)."); loadState(); return openSet(S.cache.set.pageId, Number(d("set"))); }, fail);
      case "field-lock": return eng("/ensembles/" + d("set") + "/verrouiller", { field: d("k"), locked: d("lock") === "1" }).then(function () { return openSet(S.cache.set.pageId, Number(d("set"))); }, fail);
      case "variant-use": return eng("/ensembles/" + d("set") + "/choisir", { field: d("k"), variant: Number(d("v")), replaceManual: d("manual") === "1" }).then(function () { toast("Variante choisie."); return openSet(S.cache.set.pageId, Number(d("set"))); }, function (e) { if (e.code === "manual_protected" && confirm("Ce texte a été modifié à la main. Le remplacer ?")) { el.setAttribute("data-manual", "1"); return act(el); } fail(e); });
      case "set-accept": return eng("/ensembles/" + d("set") + "/accepter").then(function () { toast("Textes validés."); return openSet(S.cache.set.pageId, Number(d("set"))); }, fail);
      case "set-apply": busy(el, true); return call("POST", "/projets/" + pid + "/contenus/appliquer", { setId: Number(d("set")) }).then(function (j) { toast(j.written.length + " champ(s) écrit(s)" + (j.skipped.length ? " · " + j.skipped.length + " conservé(s) (modifiés ou verrouillés)" : "") + "."); return loadState().then(function () { S.ui.openSet = { page: Number(d("page")), set: Number(d("set")) }; views.contents(); }); }, function (e) { fail(e); busy(el, false); });
      case "media-plan": return call("POST", "/projets/" + pid + "/medias/planifier", {}).then(function () { return loadState().then(function () { views.media(); }); }, fail);
      case "media-est": return call("POST", "/projets/" + pid + "/medias/estimer", { needKeys: d("keys").split(","), provider: $("#aib-prov").value }).then(function (j) { var e = j.estimate; $("#aib-est").textContent = e.images + " image(s) · " + (e.totalMicroUsd === null ? "coût inconnu" : "coût " + (e.kind === "estimé" ? "estimé " : "") + e.totalMicroUsd + " µ$") + (e.note ? " — " + e.note : ""); }, fail);
      case "media-gen": case "media-genall": var keys = a === "media-gen" ? [d("key")] : d("keys").split(","); var pv = $("#aib-prov") ? $("#aib-prov").value : "demo"; busy(el, true); return call("POST", "/projets/" + pid + "/medias/generer", { needKeys: keys, provider: pv, regenerate: a === "media-gen" }).then(function () { toast("Génération lancée : elle n'est terminée qu'une fois confirmée."); return loadState().then(function () { views.media(); startPolling(); }); }, function (e) { fail(e); busy(el, false); });
      case "media-pick": return pickMedia(d("key"));
      case "media-use": return call("POST", "/projets/" + pid + "/medias/affecter", { needKey: d("key"), mediaId: Number(d("id")), replace: d("replace") === "1" }).then(function () { toast("Image associée à l'emplacement."); return done(); }, function (e) { if (e.code === "conflict" && confirm(e.message + "\n\nRemplacer l'image actuelle ?")) { el.setAttribute("data-replace", "1"); return act(el); } fail(e); });
      case "device": S.ui.device = d("d"); var fr = $("#aib-frame"); if (fr) fr.style.width = WIDTH[S.ui.device]; Array.prototype.forEach.call(document.querySelectorAll('[data-act="device"]'), function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-d") === S.ui.device)); }); return;
      case "reviewed": return call("POST", "/projets/" + pid + "/apercu/valider", { value: true }).then(done, fail);
      case "unreview": return call("POST", "/projets/" + pid + "/apercu/valider", { value: false }).then(done, fail);
      case "publish": if (!confirm("Mettre en ligne les pages de ce projet ? Elles seront visibles publiquement.")) return; busy(el, true); return call("POST", "/projets/" + pid + "/publication/publier", { confirm: true }).then(function (j) { var ok = j.results.filter(function (r) { return r.ok; }).length; toast(ok + " page(s) publiée(s) sur " + j.results.length + "." + (ok < j.results.length ? " Certaines ont échoué : voir le détail." : ""), ok < j.results.length ? "error" : ""); return done(); }, function (e) { fail(e); busy(el, false); });
      case "prop-ok": case "prop-no": return call("POST", "/projets/" + pid + "/assistant/" + d("id") + "/decider", { accept: a === "prop-ok" }).then(function (j) { if (j.result && j.result.target) return go(j.result.target); toast(a === "prop-ok" ? "Modification appliquée." : "Proposition refusée."); return loadState().then(function () { loadChat(); if (a === "prop-ok") go(S.step); }); }, function (e) { fail(e); loadChat(); });
    }
  }
  function pickMedia(key) {
    fetch(boot.siteBase + "/medias-ia/medias.json?ai=1", { credentials: "same-origin" }).then(function (r) { return r.json(); }).then(function (j) {
      var g = $("#aib-gal"); g.innerHTML = '<section class="aib-card"><h2>Choisir une image</h2><div class="aib-row">' + (j.items || []).slice(0, 24).map(function (m) { return '<button class="aib-btn aib-sm" data-act="media-use" data-key="' + esc(key) + '" data-id="' + m.id + '">' + esc(m.name || m.path) + (m.ai ? " (IA)" : "") + "</button>"; }).join("") + ((j.items || []).length ? "" : '<span class="aib-note">La médiathèque est vide pour ce site.</span>') + "</div></section>";
    }).catch(function () { toast("Impossible de charger la médiathèque.", "error"); });
  }

  // ---------- événements ----------
  document.addEventListener("click", function (e) {
    var menu = $("#aib-menu"); if (menu && !menu.hidden && !e.target.closest("#aib-menu, #aib-menu-btn")) { menu.hidden = true; $("#aib-menu-btn").setAttribute("aria-expanded", "false"); }
    var el = e.target.closest("[data-act]"); if (!el || el.disabled) return; e.preventDefault(); act(el);
  });
  document.addEventListener("change", function (e) {
    var op = e.target.getAttribute && e.target.getAttribute("data-op");
    if (op && e.target.value) {
      var key = op, val = e.target.value; e.target.value = ""; var set = S.cache.set; S.ui.ctxField = key; paintCtx();
      var box = $('[data-fk="' + key + '"] .aib-variants'); box.hidden = false; box.textContent = "Création des variantes…";
      eng("/ensembles/" + set.id + "/reviser", { field: key, op: val, count: val === "variants" ? 3 : 2 }).then(function (j) {
        box.innerHTML = '<div class="aib-note">Avant : ' + esc(j.before) + "</div>" + j.variants.map(function (v) { return '<div style="margin-top:6px"><div>' + esc(v.text) + (v.blocking ? ' <span class="aib-chip" data-k="err">Information non étayée</span>' : "") + '</div><button class="aib-btn aib-sm" data-act="variant-use" data-set="' + set.id + '" data-k="' + esc(key) + '" data-v="' + v.id + '"' + (v.blocking ? " disabled" : "") + ">Utiliser cette variante</button></div>"; }).join("");
      }, function (er) { box.textContent = er.message; });
    }
    if (e.target.id === "aib-pv-page") { S.ui.pv = Number(e.target.value); var f = $("#aib-frame"); if (f) f.src = "/marketing/pages/" + S.ui.pv + "/apercu"; }
  });
  document.addEventListener("focusin", function (e) { var t = e.target; if (t.getAttribute && t.getAttribute("data-edit")) { S.ui.ctxField = t.getAttribute("data-edit"); paintCtx(); } });
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-form]"); if (!f) return; e.preventDefault(); var kind = f.getAttribute("data-form"), btn = f.querySelector('button[type="submit"]');
    if (kind === "new") { busy(btn, true); return call("POST", "/projets", { name: f.elements.name.value }).then(function (j) { openProject(j.project.id); }, function (er) { fail(er); busy(btn, false); }); }
    if (kind === "brief") { busy(btn, true); return flush().then(function () { return saveDraft(collect(f)); }).then(function () { return call("POST", "/projets/" + S.pid + "/analyser", {}); }).then(function () { toast("Brief analysé."); return loadState().then(function () { views.brief(); }); }, function (er) { fail(er); busy(btn, false); }); }
    if (kind === "answers") { var ans = {}; Array.prototype.forEach.call(f.elements, function (el) { if (el.name) ans[el.name] = el.value.trim() ? el.value.trim() : null; }); busy(btn, true); return call("POST", "/projets/" + S.pid + "/reponses", { answers: ans }).then(function () { toast("Réponses prises en compte."); return loadState().then(function () { views.brief(); }); }, function (er) { fail(er); busy(btn, false); }); }
    if (kind === "design") { busy(btn, true); return call("POST", "/projets/" + S.pid + "/design/generer", { text: f.elements.text.value, ia: Boolean(f.elements.ia && f.elements.ia.checked) }).then(function () { toast("Directions proposées. Rien n'est appliqué."); return loadState().then(function () { views.design(); }); }, function (er) { fail(er); busy(btn, false); }); }
    if (kind === "chat") {
      var ta = f.elements.m, msg = ta.value.trim(); if (!msg) return; busy(btn, true); ta.value = "";
      S.chat.push({ kind: "chat", role: "user", text: msg, status: "done" }); paintChat();
      return call("POST", "/projets/" + S.pid + "/assistant", { message: msg, step: S.step, pageKey: S.ui.ctxPage || null, fieldKey: S.ui.ctxField || null, setId: S.cache.set ? S.cache.set.id : null, needKey: S.ui.ctxNeed || null }).then(function () { return call("GET", "/projets/" + S.pid + "/journal"); }).then(function (j) { S.chat = j.events; paintChat(); busy(btn, false); }, function (er) { fail(er); busy(btn, false); loadChat(); });
    }
  });
  window.addEventListener("beforeunload", function (e) { if (S.save.state === "error" || S.timer) { e.preventDefault(); e.returnValue = ""; } });
  window.addEventListener("popstate", function () { var m = location.pathname.match(/createur-ia\/(\d+)$/); S.pid = m ? Number(m[1]) : null; start(); });
  var views; start();
})();

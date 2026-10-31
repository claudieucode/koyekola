/* Contenu et qualité SEO (programme 22.6). Interface SEULEMENT : chaque action appelle une route serveur qui revérifie site, droits et portée. Tout texte affiché passe par textContent. */
(function () {
  "use strict";
  var root = document.getElementById("ci"); if (!root) return;
  var BASE = root.getAttribute("data-base") + "/api", EDIT = root.getAttribute("data-edit") === "1", AI = root.getAttribute("data-ai") === "1";
  var $ = function (s) { return document.querySelector(s); }, TABS = ["over", "page", "link", "lang", "kw", "set"], S = { pages: [] };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") el.textContent = attrs[k]; else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]); else if (attrs[k] !== false && attrs[k] != null) el.setAttribute(k, attrs[k]); });
    (function add(list) { [].concat(list == null ? [] : list).forEach(function (c) { if (Array.isArray(c)) add(c); else if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); })(kids);
    return el;
  }
  function say(msg, k) { var el = $("#ci-status"); el.textContent = msg || ""; if (k) el.setAttribute("data-k", k); else el.removeAttribute("data-k"); }
  function api(method, path, body) {
    return fetch(BASE + path, { method: method, credentials: "same-origin", headers: Object.assign({ Accept: "application/json" }, body !== undefined ? { "Content-Type": "application/json" } : {}), body: body !== undefined ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "Réponse inattendue du serveur." }; }).then(function (j) { j.status = r.status; return j; }); }, function () { return { ok: false, error: "Le serveur ne répond pas." }; });
  }
  function tab(name) { TABS.forEach(function (t) { var on = t === name; $("#ci-t-" + t).setAttribute("aria-selected", String(on)); $("#ci-t-" + t).tabIndex = on ? 0 : -1; $("#ci-p-" + t).hidden = !on; }); load(name); }
  root.querySelector(".ci-tabs").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) tab(b.getAttribute("data-tab")); });
  root.querySelector(".ci-tabs").addEventListener("keydown", function (e) { var i = TABS.indexOf(document.activeElement && document.activeElement.getAttribute("data-tab")); if (i < 0 || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return; var n = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length]; tab(n); $("#ci-t-" + n).focus(); });
  var ROLE_FR = { primary: "principal", secondary: "secondaire", question: "question", entity: "entité", variant: "variante" };
  var SEV = { blocking: "Bloquant", important: "Important", optional: "Facultatif" };
  function empty(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function stat(label, value) { return h("div", { class: "ci-stat" }, [h("strong", { text: String(value == null ? "—" : value) }), h("span", { text: label })]); }
  // ---------- formulaires de saisie (visibles seulement avec le droit de modification ; le serveur revérifie tout) ----------
  var uid = 0;
  function field(label, control) { var id = "ci-f" + (++uid); control.id = id; return h("div", { class: "sw-field" }, [h("label", { for: id, text: label }), control]); }
  function input(name, ph, val) { return h("input", { type: "text", name: name, placeholder: ph || null, value: val || "" }); }
  function select(name, opts, val) { var el = h("select", { name: name }); opts.forEach(function (o) { var op = h("option", { value: o[0], text: o[1] }); if (String(o[0]) === String(val)) op.selected = true; el.appendChild(op); }); return el; }
  function form(title, fields, submitLabel, onSubmit) {
    var f = h("form", { class: "ci-form", novalidate: "novalidate" }, [h("h2", { text: title })].concat(fields, [h("button", { type: "submit", class: "btn btn-primary", text: submitLabel })]));
    f.addEventListener("submit", function (e) { e.preventDefault(); onSubmit(f); });
    return f;
  }
  function pagesOptions(withNone) { return api("GET", "/tableau-de-bord").then(function (j) { var o = withNone ? [["", "Tout le site"]] : []; if (j.ok) j.dashboard.pages.forEach(function (p) { o.push([p.pageId, p.name]); }); return o; }); }
  function result(j, okMsg, reload) { say(j.ok ? okMsg : (j.error || "Erreur."), j.ok ? "ok" : "err"); if (j.ok && reload) reload(); }
  // ---------- vue d'ensemble ----------
  function over() {
    api("GET", "/tableau-de-bord").then(function (j) {
      var box = empty($("#ci-over")); if (!j.ok) { box.textContent = j.error || "Erreur."; return; }
      var d = j.dashboard, o = d.overview;
      box.appendChild(h("div", { class: "ci-stats" }, [stat("Pages analysées", o.analyzed), stat("Pages optimisées", o.optimized), stat("À améliorer", o.toImprove), stat("Sans métadonnées", o.withoutMetadata), stat("Problèmes techniques", o.withTechnicalIssues), stat("Pages orphelines", o.orphans), stat("Contenus incomplets", o.incomplete), stat("Score moyen", o.averageScore)]));
      box.appendChild(h("p", { class: "sw-muted", text: d.disclaimer }));
      box.appendChild(h("p", { class: "sw-muted", text: d.traffic.note }));
      var tb = h("table", { class: "mk-table" }, [h("thead", {}, h("tr", {}, ["Page", "Genre", "Score", "Critères évalués", "Bloquants", "Problèmes"].map(function (t) { return h("th", { scope: "col", text: t }); })))]);
      var body = h("tbody"); d.pages.forEach(function (p) { body.appendChild(h("tr", {}, [h("td", {}, h("button", { type: "button", class: "btn btn-sm", text: p.name, onclick: function () { S.pick = p.pageId; tab("page"); } })), h("td", { text: p.kind || "à préciser" }), h("td", { text: p.score == null ? "—" : String(p.score) }), h("td", { text: p.evaluated }), h("td", { text: String(p.blocking) }), h("td", { text: String(p.issues) })])); });
      tb.appendChild(body); box.appendChild(h("div", { class: "ci-scroll", role: "region", "aria-label": "Pages analysées (défilement horizontal)", tabindex: "0" }, tb));
      var ed = d.editorial; box.appendChild(h("h2", { text: "Analyse éditoriale" }));
      [["Ton incohérent (tutoiement / vouvoiement)", ed.toneConsistency], ["Formules creuses", ed.writingFillers], ["Répétitions", ed.repetitions], ["Contenus très proches", ed.nearDuplicates], ["Informations à compléter", ed.missingInfo], ["Affirmations à justifier", ed.unverifiedClaims]].forEach(function (r) { box.appendChild(h("p", {}, [h("strong", { text: r[0] + " : " }), r[1].length ? r[1].map(function (p) { return p.name; }).join(", ") : "aucune page"])); });
    });
  }
  // ---------- analyse d'une page ----------
  function pagePick() {
    var sel = $("#ci-page"); if (sel.options.length) return;
    api("GET", "/tableau-de-bord").then(function (j) { if (!j.ok) return; S.pages = j.dashboard.pages; S.pages.forEach(function (p) { sel.appendChild(h("option", { value: p.pageId, text: p.name })); }); if (S.pick) sel.value = String(S.pick); evalPage(); });
  }
  function evalPage(force) {
    var id = $("#ci-page").value; if (!id) return; var box = empty($("#ci-eval")); box.textContent = "Analyse…";
    api("GET", "/pages/" + encodeURIComponent(id) + (force ? "?force=1" : "")).then(function (j) {
      empty(box); if (!j.ok) { box.textContent = j.error || "Erreur."; return; }
      var e = j.evaluation, q = e.quality;
      box.appendChild(h("p", {}, [h("strong", { text: "Score global : " + (q.global == null ? "non évaluable" : q.global + "/100") }), " (" + q.evaluable + " critères évalués sur " + q.total + ")" + (e.cached ? " · résultat en mémoire, contenu inchangé" : "")]));
      box.appendChild(h("p", { class: "sw-muted", text: q.disclaimer }));
      box.appendChild(h("p", { text: "Genre : " + (e.kind || "à préciser") + " · Intention estimée : " + e.intent.label + (e.keyword ? " · Mot-clé : " + e.keyword : " · aucun mot-clé principal") }));
      var ul = h("ul", { class: "ci-crit" }); q.criteria.forEach(function (c) { ul.appendChild(h("li", {}, [h("strong", { text: c.label + " : " }), c.score == null ? "non évaluable" : c.score + "/100", c.note ? h("small", { text: " — " + c.note }) : null])); }); box.appendChild(ul);
      box.appendChild(h("h2", { text: "Problèmes détectés (" + q.issues.length + ")" }));
      q.issues.forEach(function (i) { box.appendChild(h("div", { class: "ci-issue", "data-sev": i.severity }, [h("strong", { text: SEV[i.severity] + " · " }), i.explanation, h("br"), h("em", { text: "Recommandation : " + i.recommendation }), i.correction ? h("div", { class: "ci-fix" }, ["Correction proposée : ", h("code", { text: i.correction.value || i.correction.note || i.correction.type }), i.correction.value && i.correction.note ? h("small", { text: " — " + i.correction.note }) : null]) : null])); });
      if (AI) { box.appendChild(h("h2", { text: "Améliorer avec l'IA (avant/après)" })); box.appendChild(h("p", { class: "sw-muted", text: "Chaque action prépare une proposition dans l'écran « Modifier avec l'IA et historique », où vous l'acceptez, la refusez ou l'annulez." })); }
      box.appendChild(h("button", { type: "button", class: "btn btn-sm", text: "Ré-analyser", onclick: function () { evalPage(true); } }));
    });
  }
  // ---------- maillage ----------
  function links() {
    api("GET", "/liens").then(function (j) {
      var box = empty($("#ci-links")); if (!j.ok) { box.textContent = j.error || "Erreur."; return; }
      box.appendChild(h("p", { class: "sw-muted", text: j.analysis.limits }));
      box.appendChild(h("p", {}, [h("strong", { text: "Pages orphelines : " }), j.analysis.orphans.length ? j.analysis.orphans.map(function (p) { return p.name; }).join(", ") : "aucune"]));
      box.appendChild(h("p", {}, [h("strong", { text: "Ancres génériques : " }), j.analysis.generic.length ? j.analysis.generic.map(function (g) { return "« " + g.anchor + " » (" + g.pageName + ")"; }).join(", ") : "aucune"]));
      box.appendChild(h("h2", { text: "Propositions de liens (" + j.proposals.length + ")" }));
      j.proposals.forEach(function (p) {
        var row = h("div", { class: "ci-issue" }, [h("strong", { text: p.pageName }), " → ", h("strong", { text: p.targetName }), h("div", { text: "Ancre : « " + p.anchor + " » — " + p.context })]);
        if (EDIT) { row.appendChild(h("button", { type: "button", class: "btn btn-sm btn-primary", text: "Accepter (dans le brouillon)", onclick: function () { decide(p.id, "accepter"); } })); row.appendChild(h("button", { type: "button", class: "btn btn-sm", text: "Refuser", onclick: function () { decide(p.id, "refuser"); } })); }
        box.appendChild(row);
      });
    });
  }
  function decide(id, what) { api("POST", "/liens/" + id + "/" + what, {}).then(function (j) { say(j.ok ? (what === "accepter" ? j.note : "Proposition refusée.") : j.error, j.ok ? "ok" : "err"); links(); }); }
  $("#ci-link-run").addEventListener("click", function () { if (!EDIT) { say("Droit insuffisant.", "err"); return; } api("POST", "/liens/proposer", {}).then(function (j) { say(j.ok ? j.created + " nouvelle(s) proposition(s)." : j.error, j.ok ? "ok" : "err"); links(); }); });
  // ---------- langues ----------
  function langs() {
    api("GET", "/langues").then(function (j) {
      var box = empty($("#ci-langs")); if (!j.ok) { box.textContent = j.error || "Erreur."; return; }
      box.appendChild(h("p", { class: "sw-muted", text: "Reliez les pages qui sont des traductions ou des adaptations locales les unes des autres. Une adaptation doit avoir un contenu propre au marché visé." }));
      if (!j.groups.length) box.appendChild(h("p", { text: "Aucun groupe de traduction." }));
      j.groups.forEach(function (g) { box.appendChild(h("div", { class: "ci-issue" }, [h("strong", { text: "Groupe " + g.groupKey + " : " }), g.members.map(function (m) { return m.tag + " → " + m.name + (m.status === "published" ? "" : " (non publiée)"); }).join(" · "), g.validation.issues.map(function (i) { return h("div", { text: (i.severity === "error" ? "Erreur : " : i.severity === "warning" ? "Attention : " : "") + i.message }); })])); });
      if (!EDIT) return;
      pagesOptions(false).then(function (opts) {
        if (!opts.length) return;
        box.appendChild(form("Relier une page à une langue", [
          field("Page", select("pageId", opts)), field("Langue (deux lettres, ex. en)", input("lang", "en")), field("Région (facultatif, ex. CD)", input("region", "CD")),
          field("Type", select("kind", [["translation", "Traduction"], ["adaptation", "Adaptation locale (contenu propre au marché)"]])),
          field("Groupe", select("groupKey", [["", "Nouveau groupe (cette page est l'original)"]].concat(j.groups.map(function (g) { return [g.groupKey, "Groupe " + g.groupKey + " : " + g.members.map(function (m) { return m.tag; }).join(", ")]; })))),
        ], "Relier", function (f) {
          var v = function (n) { return f.elements[n].value.trim(); };
          api("POST", "/langues", { pageId: Number(v("pageId")), lang: v("lang").toLowerCase(), region: v("region").toUpperCase(), kind: v("kind"), groupKey: v("groupKey") }).then(function (r) { result(r, "Page reliée.", langs); });
        }));
        var members = []; j.groups.forEach(function (g) { g.members.forEach(function (m) { members.push(m); }); });
        if (members.length) {
          box.appendChild(h("h2", { text: "Retirer une page d'un groupe" }));
          members.forEach(function (m) { box.appendChild(h("p", {}, [m.tag + " → " + m.name + " ", h("button", { type: "button", class: "btn btn-sm", text: "Retirer", "aria-label": "Retirer " + m.name + " (" + m.tag + ")", onclick: function () { api("POST", "/langues/" + m.pageId + "/retirer", {}).then(function (r) { result(r, "Page retirée du groupe.", langs); }); } })])); });
        }
      });
    });
  }
  // ---------- mots-clés et sources ----------
  function kws() {
    Promise.all([api("GET", "/mots-cles"), api("GET", "/sources")]).then(function (r) {
      var box = empty($("#ci-kws")); if (!r[0].ok) { box.textContent = r[0].error || "Erreur."; return; }
      box.appendChild(h("p", { class: "sw-muted", text: "Chaque donnée chiffrée indique sa provenance. Kolakisa ne produit aucun volume de recherche ni aucune difficulté : sans source réelle, la valeur reste « non disponible »." }));
      r[0].keywords.forEach(function (k) { box.appendChild(h("p", {}, [h("strong", { text: k.keyword }), " (" + (ROLE_FR[k.role] || k.role) + ", " + k.provenanceLabel + ") — " + k.metricsNote + " ", EDIT ? h("button", { type: "button", class: "btn btn-sm", text: "Supprimer", "aria-label": "Supprimer le mot-clé " + k.keyword, onclick: function () { api("POST", "/mots-cles/" + k.id + "/supprimer", {}).then(function (x) { result(x, "Mot-clé supprimé.", kws); }); } }) : null])); });
      if (!r[0].keywords.length) box.appendChild(h("p", { text: "Aucun mot-clé enregistré." }));
      box.appendChild(h("h2", { text: "Sources de données" }));
      (r[1].connectors || []).forEach(function (c) { box.appendChild(h("p", {}, [h("strong", { text: c.label + " : " }), c.status.label + " — " + c.limits])); });
      if (EDIT) pagesOptions(true).then(function (opts) {
        box.appendChild(form("Ajouter un mot-clé (saisie manuelle)", [
          field("Mot-clé ou question", input("keyword", "ex. isolation des combles")),
          field("Rôle", select("role", [["primary", "Principal"], ["secondary", "Secondaire"], ["question", "Question d'internaute"], ["entity", "Entité ou sujet connexe"], ["variant", "Variante"]], "secondary")),
          field("Page concernée", select("pageId", opts)),
        ], "Ajouter", function (f) {
          var v = function (n) { return f.elements[n].value.trim(); };
          api("POST", "/mots-cles", { keyword: v("keyword"), role: v("role"), pageId: v("pageId") === "" ? null : Number(v("pageId")), provenance: "manual" }).then(function (x) { result(x, "Mot-clé ajouté (saisie manuelle, sans donnée chiffrée).", kws); });
        }));
      });
    });
  }
  function sets() {
    api("GET", "/reglages").then(function (j) {
      var box = empty($("#ci-sets")); if (!j.ok) { box.textContent = j.error || "Erreur."; return; }
      box.appendChild(h("p", {}, [h("strong", { text: "Langue de contenu : " }), j.market.language + (j.market.country ? " · pays " + j.market.country : " · pays non défini")]));
      box.appendChild(h("p", {}, [h("strong", { text: "Voix de marque : " }), j.voice.orientations.join(", ") + " · adresse « " + j.voice.address + " »"]));
      var facts = Object.keys(j.facts).filter(function (k) { return k !== "company_name"; }).map(function (k) { return k + " = " + j.facts[k]; }).join("\n");
      box.appendChild(h("p", { class: "sw-muted", text: "Faits fournis : seule base de ce qui est tenu pour vérifié. Aucun chiffre, label, garantie ou récompense ne doit apparaître dans un texte s'il n'est pas ici." }));
      if (!EDIT) { box.appendChild(h("p", { text: facts || "Aucun fait renseigné." })); return; }
      var ta = h("textarea", { name: "facts", rows: "8", placeholder: "annee_creation = 2012\nville = Kinshasa\ncertification = (uniquement si réelle)" }); ta.value = facts;
      box.appendChild(form("Faits de l'entreprise", [field("Un fait par ligne, au format « clé = valeur »", ta)], "Enregistrer les faits", function (f) {
        var out = {}, bad = null; f.elements.facts.value.split("\n").forEach(function (line) { if (!line.trim()) return; var i = line.indexOf("="); if (i < 1) { bad = line; return; } out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); });
        if (bad) { say("Ligne sans « = » : " + bad, "err"); return; }
        api("POST", "/reglages/faits", { facts: out }).then(function (r) { result(r, "Faits enregistrés.", sets); });
      }));
      box.appendChild(form("Marché et langue du contenu", [
        field("Langue principale (deux lettres)", input("language", "fr", j.market.language)), field("Pays visé (facultatif, ex. CD)", input("country", "CD", j.market.country)),
        field("Autres langues du site (séparées par des virgules)", input("languages", "en, ln", (j.market.languages || []).filter(function (l) { return l !== j.market.language; }).join(", "))),
      ], "Enregistrer le marché", function (f) {
        var v = function (n) { return f.elements[n].value.trim(); };
        api("POST", "/reglages/marche", { language: v("language").toLowerCase() || "fr", country: v("country").toUpperCase(), languages: v("languages").split(",").map(function (x) { return x.trim().toLowerCase(); }).filter(Boolean) }).then(function (r) { result(r, "Marché enregistré.", sets); });
      }));
    });
  }
  function load(name) { if (name === "over") over(); else if (name === "page") pagePick(); else if (name === "link") links(); else if (name === "lang") langs(); else if (name === "kw") kws(); else if (name === "set") sets(); }
  $("#ci-page").addEventListener("change", function () { evalPage(false); });
  over();
})();

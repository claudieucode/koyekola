// KOLAKISA CMS → Redirections, liens cassés, permaliens (palier 12) : fenêtres de saisie et test d'une redirection.
// Les enregistrements passent par de vrais formulaires ; le test appelle le serveur (POST /redirections/tester) et affiche sa réponse réelle.
(function () {
  var BASE = "/marketing/site-web/redirections";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var parse = function (el, attr) { try { return JSON.parse(el.getAttribute(attr)); } catch (e) { return null; } };
  var open = function (d) { if (d && typeof d.showModal === "function" && !d.open) d.showModal(); };
  var el = function (tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };

  var form = $("#ur-form");
  if (form) {
    var f = $("[data-ur-form]", form), title = $("#ur-form-title", form);
    var fill = function (r) {
      f.action = r ? BASE + "/" + r.id : BASE;
      title.textContent = r ? "Modifier la redirection" : "Ajouter une redirection";
      $("#ur-source").value = r ? r.source : ""; $("#ur-target").value = r ? r.target : "";
      $("#ur-status").value = r ? String(r.status) : "301";
      var site = $("#ur-site"); if (site) site.value = r && r.site_id ? String(r.site_id) : "";
      $("#ur-note").value = r ? r.note : "";
      var set = function (id, v) { var n = $(id); if (n) n.value = v; };
      set("#ur-match", r ? r.match_type : "exact"); set("#ur-group", r && r.group_id ? String(r.group_id) : ""); set("#ur-priority", r ? String(r.priority) : "100");
      set("#ur-starts", r ? r.starts_at : ""); set("#ur-ends", r ? r.ends_at : ""); set("#ur-query", r ? r.query_mode : "keep");
      var adv = $(".rd-adv", f); if (adv) adv.open = Boolean(r && (r.group_id || r.priority !== 100 || r.starts_at || r.ends_at || r.query_mode === "drop"));
    };
    document.addEventListener("click", function (e) {
      var n = e.target.closest("[data-ur-new]"), ed = e.target.closest("[data-ur-edit]");
      if (n) { fill(null); open(form); $("#ur-source").focus(); }
      if (ed) { fill(parse(ed, "data-ur-edit")); open(form); $("#ur-source").focus(); }
    });
  }

  var del = $("#ur-delete");
  if (del) {
    var df = $("[data-ur-delete-form]", del);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-ur-delete]");
      if (!b) return;
      var r = parse(b, "data-ur-delete");
      df.action = BASE + "/" + r.id + "/supprimer";
      $("[data-ur-delete-text]", del).textContent = "Supprimer la redirection de « " + r.source + " » vers « " + r.target + " » ?";
      open(del);
    });
  }

  // Test : chaque étape est une vraie réponse du serveur
  var test = $("#ur-test");
  if (test) {
    var out = $("[data-ur-trace]", test);
    var run = function (r) {
      out.textContent = "Test en cours…";
      open(test);
      fetch(BASE + "/tester", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ source: r.source, siteId: r.site_id || "" }) })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }); })
        .then(function (x) {
          out.textContent = "";
          if (!x.ok) { out.appendChild(el("p", "mk-ur-bad", (x.j.error && x.j.error.message) || "Le test a échoué.")); return; }
          var j = x.j;
          if (j.host) out.appendChild(el("p", "field-hint", "Domaine testé : " + j.host));
          var ol = el("ol", "mk-ur-steps");
          j.steps.forEach(function (s) {
            var li = el("li", "mk-ur-step");
            li.appendChild(el("code", "", s.url));
            li.appendChild(el("span", s.status >= 400 || s.status === 0 ? "mk-ur-bad" : "mk-ur-ok", s.error ? s.error : "HTTP " + s.status));
            if (s.location) li.appendChild(el("span", "mk-sub", "→ " + s.location));
            ol.appendChild(li);
          });
          out.appendChild(ol);
          var verdicts = { ok: "Résultat : la destination répond (200).", externe: "Résultat : la redirection mène vers un site extérieur (non suivi).", "404": "Résultat : la destination est introuvable (404).", boucle: "Résultat : boucle de redirections.", erreur: "Résultat : la destination répond par une erreur." };
          out.appendChild(el("p", j.verdict === "ok" || j.verdict === "externe" ? "mk-ur-ok" : "mk-ur-bad", verdicts[j.verdict] + (j.hops > 1 ? " Attention : " + j.hops + " redirections à la suite." : "")));
        })
        .catch(function () { out.textContent = "Le test n'a pas pu être exécuté (réseau)."; });
    };
    document.addEventListener("click", function (e) { var b = e.target.closest("[data-ur-test]"); if (b) run(parse(b, "data-ur-test")); });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-ur-close]")) { var d = e.target.closest("dialog"); if (d) d.close(); }
  });
  // « Analyser » les liens : indication de travail (l'analyse interroge le serveur pour chaque adresse)
  var scan = $("[data-ur-scan]");
  if (scan) scan.addEventListener("submit", function () { var b = $("button[type=submit]", scan); if (b) { b.disabled = true; b.textContent = "Analyse en cours…"; } });
})();

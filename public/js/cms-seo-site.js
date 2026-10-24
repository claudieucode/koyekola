// Rubriques SEO d'un site : compteurs indicatifs, aperçu de l'extrait de recherche, indication de modifications non enregistrées,
// confirmation des actions lourdes, aperçu de robots.txt avant publication, suivi réel de l'avancement d'une analyse.
// Aucun calcul de référencement ici : le serveur reste la seule source ; ce script n'affiche que ce qu'il renvoie.
(function () {
  "use strict";
  var ready = function (fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); };
  ready(function () {
    // Compteurs de caractères (repères indicatifs)
    document.querySelectorAll("[data-count-for]").forEach(function (out) {
      var input = document.getElementById(out.getAttribute("data-count-for"));
      if (!input) return;
      var max = Number(input.getAttribute("data-counter")) || 0;
      var paint = function () {
        var n = input.value.length;
        out.textContent = max ? n + " / " + max + " caractères (repère indicatif)" : n + " caractères";
        out.classList.toggle("is-over", Boolean(max) && n > max);
      };
      input.addEventListener("input", paint); paint();
    });
    // Aperçu de l'extrait de recherche : titre = modèle du site, description = description par défaut saisie
    var serpTitle = document.querySelector("[data-serp-title]");
    var serpDesc = document.querySelector("[data-serp-desc]");
    var byName = function (n) { return document.querySelector('[name="' + n + '"]'); };
    var refreshSerp = function () {
      if (serpTitle) {
        var tpl = (byName("title_template") && byName("title_template").value) || serpTitle.getAttribute("data-template") || "{title}{sep}{site_name}";
        var sepEl = byName("title_separator");
        var sep = (sepEl && sepEl.value) || serpTitle.getAttribute("data-sep") || " · ";
        var site = (byName("site_name") && byName("site_name").value) || serpTitle.getAttribute("data-site") || "";
        serpTitle.textContent = tpl.replace(/\{title\}/g, "Titre de la page").replace(/\{sep\}/g, sep).replace(/\{site_name\}/g, site);
      }
      if (serpDesc) { var d = byName("default_description"); if (d && d.value) serpDesc.textContent = d.value; }
    };
    ["title_template", "title_separator", "site_name", "default_description"].forEach(function (n) { var el = byName(n); if (el) el.addEventListener("input", refreshSerp); if (el) el.addEventListener("change", refreshSerp); });
    refreshSerp();

    // Modifications non enregistrées + état « enregistrement en cours »
    var dirtyForms = [];
    document.querySelectorAll("form[data-dirty-form]").forEach(function (form) {
      var note = form.querySelector("[data-dirty-note]");
      var mark = function () { if (note) note.hidden = false; form.setAttribute("data-dirty", "1"); };
      form.addEventListener("input", mark); form.addEventListener("change", mark);
      form.addEventListener("submit", function () { form.removeAttribute("data-dirty"); });
      dirtyForms.push(form);
    });
    window.addEventListener("beforeunload", function (e) {
      if (dirtyForms.some(function (f) { return f.getAttribute("data-dirty") === "1"; })) { e.preventDefault(); e.returnValue = ""; }
    });
    document.querySelectorAll("form[data-busy-form]").forEach(function (form) {
      form.addEventListener("submit", function () {
        var b = form.querySelector('button[type="submit"]:not([disabled])');
        if (b) { b.setAttribute("aria-busy", "true"); b.classList.add("is-busy"); setTimeout(function () { b.disabled = true; }, 0); }
      });
    });
    // Confirmations simples (data-confirm sur un formulaire ou un bouton)
    document.addEventListener("submit", function (e) {
      var msg = e.target.getAttribute && e.target.getAttribute("data-confirm");
      var btn = e.submitter && e.submitter.getAttribute && e.submitter.getAttribute("data-confirm");
      var text = btn || msg;
      if (text && !window.confirm(text)) e.preventDefault();
    }, true);

    // Indexation : la case de confirmation n'apparaît que lorsqu'on ferme tout le site
    var siteForm = document.querySelector("form[data-confirm-field]");
    if (siteForm) {
      var field = siteForm.querySelector('[name="' + siteForm.getAttribute("data-confirm-field") + '"]');
      var box = document.getElementById(siteForm.getAttribute("data-confirm-box"));
      var initial = field && field.checked;
      var sync = function () { if (box && field) box.hidden = !(field.checked && !initial); };
      if (field) field.addEventListener("change", sync); sync();
    }

    // Robots : aperçu avant publication (validation côté serveur)
    var rform = document.querySelector("form[data-robots-form]");
    if (rform) {
      var text = rform.querySelector("textarea");
      var live = rform.querySelector("[data-robots-live]");
      var confirmBox = rform.querySelector("[data-robots-confirm]");
      var run = function () {
        fetch(rform.getAttribute("data-preview-url"), { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ robots_custom: text.value }) })
          .then(function (r) { return r.json(); })
          .then(function (d) {
            live.textContent = "";
            var add = function (cls, t) { var s = document.createElement("span"); s.className = "mk-seo-note mk-seo-note-" + cls; s.textContent = t; live.appendChild(s); };
            if (!d.valid) add("warning", d.error || "Règles invalides.");
            (d.warnings || []).filter(function (w) { return w.level !== "info"; }).forEach(function (w) { add("warning", w.message); });
            if (d.preview) { var pre = document.createElement("pre"); pre.className = "mk-seo-code"; var c = document.createElement("code"); c.textContent = d.preview; pre.appendChild(c); live.appendChild(pre); }
            if (confirmBox) confirmBox.hidden = !d.needsConfirm;
          })
          .catch(function () { live.textContent = "L'aperçu n'a pas pu être calculé : réessayez."; });
      };
      var btn = rform.querySelector("[data-robots-preview]");
      if (btn) btn.addEventListener("click", run);
    }

    // Analyse : avancement réel (lu sur le serveur toutes les 2 s), puis affichage des résultats
    var poll = document.querySelector("[data-poll-url]");
    if (poll) {
      var url = poll.getAttribute("data-poll-url");
      var done = poll.getAttribute("data-poll-done");
      var bar = poll.querySelector("[data-bar]");
      var label = poll.querySelector("[data-poll-text]");
      var fails = 0;
      var tick = function () {
        fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); }).then(function (s) {
          fails = 0;
          if (s.status === "running") {
            if (label) label.textContent = s.pages + " page(s) lue(s)";
            if (bar) bar.style.width = Math.min(95, Math.round(100 * s.pages / Math.max(s.known, s.pages, 1))) + "%";
            setTimeout(tick, 2000);
          } else { if (bar) bar.style.width = "100%"; window.location.href = done; }
        }).catch(function () { if (++fails < 5) setTimeout(tick, 4000); else if (label) label.textContent = "Suivi interrompu : rechargez la page pour voir l'état de l'analyse."; });
      };
      setTimeout(tick, 1200);
    }
  });
})();

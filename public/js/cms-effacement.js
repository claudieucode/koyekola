// Outils → Effacer les données : validation du formulaire, sélection groupée, confirmations, double soumission, traitement lot par lot.
(function () {
  "use strict";
  var EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,255}\.[^\s@<>"]{2,}$/;
  function once(form) {
    form.addEventListener("submit", function (e) {
      if (form.dataset.sent === "1") { e.preventDefault(); return; }
      form.dataset.sent = "1";
      Array.prototype.forEach.call(form.querySelectorAll("button[type=submit]"), function (b) { b.setAttribute("aria-busy", "true"); setTimeout(function () { b.disabled = true; }, 0); });
    });
  }

  var form = document.querySelector("[data-er-form]");
  if (form) {
    var input = form.querySelector("#er-identifier"), err = form.querySelector("#er-id-err");
    form.addEventListener("submit", function (e) {
      var v = input.value.trim(), ok = v.length > 0 && v.length <= 254 && (v.indexOf("@") === -1 || EMAIL.test(v));
      err.hidden = ok; input.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) { e.preventDefault(); e.stopImmediatePropagation(); input.focus(); }
    }, true);
    once(form);
  }

  var bulk = document.querySelector("[data-er-bulk]");
  if (bulk) {
    var picks = function () { return bulk.querySelectorAll("[data-er-pick]"); };
    Array.prototype.forEach.call(bulk.querySelectorAll("[data-er-all]"), function (all) {
      all.addEventListener("change", function () {
        Array.prototype.forEach.call(picks(), function (p) { p.checked = all.checked; });
        Array.prototype.forEach.call(bulk.querySelectorAll("[data-er-all]"), function (o) { o.checked = all.checked; });
      });
    });
    bulk.addEventListener("submit", function (e) {
      var s = e.submitter, one = s && s.hasAttribute("data-er-one");
      if (one) { var msg = s.getAttribute("data-confirm"); if (msg && !window.confirm(msg)) e.preventDefault(); return; }
      var action = bulk.querySelector("#er-bulk-action");
      var any = Array.prototype.some.call(picks(), function (p) { return p.checked; });
      if (!action || !action.value || !any) { e.preventDefault(); window.alert(!action || !action.value ? "Choisissez une action groupée." : "Sélectionnez au moins une demande."); return; }
      if (action.value === "supprimer" && !window.confirm("Supprimer les demandes sélectionnées de la liste ? Aucune donnée personnelle ne sera effacée.")) e.preventDefault();
    });
  }

  // Page de détail : le traitement continue lot par lot tant qu'il n'est pas fini ; la barre ne montre que des étapes réellement enregistrées
  var run = document.querySelector("[data-er-run]");
  if (run) {
    var url = run.getAttribute("data-er-run"), bar = document.getElementById("er-bar"), label = document.getElementById("er-bar-label"), live = document.getElementById("er-live");
    var busyRetry = 0;
    var paint = function (d) {
      if (d.progress) { bar.value = d.progress.percent; label.textContent = d.progress.done + " catégorie(s) sur " + d.progress.total + " traitée(s) — " + d.progress.erased + " effacé(s), " + d.progress.anonymized + " anonymisé(s)"; }
    };
    var tick = function () {
      fetch(url, { method: "POST", credentials: "same-origin", headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: "json=1" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          paint(d);
          if (d.finished || d.notRunnable) { live.textContent = d.status === "completed" ? "Effacement terminé." : "Traitement arrêté."; window.location.reload(); return; }
          if (d.busy && ++busyRetry > 40) { live.textContent = "Un autre traitement tient cette demande : rechargez la page dans un instant."; return; }
          setTimeout(tick, d.busy ? 1500 : 150);
        })
        .catch(function () { live.textContent = "Connexion interrompue : le traitement reprendra là où il s'est arrêté (bouton « Continuer »)."; });
    };
    tick();
  }
  Array.prototype.forEach.call(document.querySelectorAll("form[data-er-once]"), once);
})();

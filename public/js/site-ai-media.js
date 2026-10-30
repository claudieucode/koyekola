// Médias IA : suivi de progression des générations (interrogation légère, arrêtée quand plus rien n'est en cours). Fonctionne sans JavaScript (rechargement manuel).
(function () {
  "use strict";
  var root = document.querySelector("[data-ai-media]");
  if (!root || root.dataset.active !== "1") return;
  var status = root.querySelector("[data-ai-status]"), url = root.dataset.poll, delay = 2000, tries = 0;
  function tick() {
    tries += 1;
    fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { return r.ok ? r.json() : null; }).then(function (b) {
      if (!b) { if (status) status.textContent = "suivi indisponible — rechargez la page"; return; }
      var open = b.tasks.filter(function (t) { return t.status === "queued" || t.status === "running"; }).length;
      if (open === 0) { location.reload(); return; }
      if (status) status.textContent = open + " en cours…";
      if (tries < 120) { delay = Math.min(8000, delay + 500); setTimeout(tick, delay); }
    }).catch(function () { if (status) status.textContent = "hors connexion — nouvel essai"; setTimeout(tick, 5000); });
  }
  setTimeout(tick, delay);
})();

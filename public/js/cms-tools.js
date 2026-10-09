// KOLAKISA CMS → Outils (palier 13) : suivi d'une opération en cours. Interroge le serveur (GET /outils/operations/<id>.json) et affiche la
// progression RÉELLE (compteurs écrits par l'exécuteur au rythme du travail). Quand l'opération se termine, la page est rechargée pour afficher le rapport.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  document.querySelectorAll("[data-tools-run]").forEach(function (box) {
    if (box.getAttribute("data-tools-state") !== "active") return;
    var url = box.getAttribute("data-tools-url");
    var bar = $("[data-tools-bar]", box), meter = $("[role=progressbar]", box);
    var set = function (sel, v) { var el = $(sel, box); if (el) el.textContent = v; };
    var lastMessage = "";
    var timer = null;
    var tick = function () {
      fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (p) {
          bar.style.width = p.percent + "%";
          meter.setAttribute("aria-valuenow", String(p.percent));
          set("[data-tools-percent]", p.percent + " %");
          set("[data-tools-done]", String(p.done)); set("[data-tools-failed]", String(p.failed)); set("[data-tools-skipped]", String(p.skipped));
          if (p.total) set("[data-tools-total]", String(p.total));
          // Message annoncé aux lecteurs d'écran seulement quand il change (pas à chaque interrogation)
          if (p.message && p.message !== lastMessage) { lastMessage = p.message; set("[data-tools-message]", p.message); }
          if (p.finished || p.awaiting) { clearInterval(timer); window.location.reload(); }
        })
        .catch(function () { set("[data-tools-message]", "Connexion perdue : nouvelle tentative…"); });
    };
    timer = setInterval(tick, 800);
    tick();
  });
  // Changement de site : recharge l'écran courant pour ce site
  var sel = $("[data-tools-site]");
  if (sel) sel.addEventListener("change", function () { sel.form.submit(); });
})();

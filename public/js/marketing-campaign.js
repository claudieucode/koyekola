/* Page d'une campagne : actualisation automatique pendant l'envoi, et conversion de l'heure locale de programmation en UTC. */
(function () {
  "use strict";
  var live = document.querySelector("[data-autorefresh]");
  if (live) setTimeout(function () { window.location.reload(); }, 10000);
  var local = document.querySelector('input[name="send_at"]');
  var utc = document.getElementById("send-at-utc");
  if (local && utc && local.form) {
    local.form.addEventListener("submit", function () {
      var d = local.value ? new Date(local.value) : null;
      utc.value = d && !isNaN(d.getTime()) ? d.toISOString() : "";
    });
  }
})();

/* Liste de contrôle d'un brouillon : le bouton « Annuler » d'une ligne la referme (sans rien enregistrer). */
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-mk-cl-cancel]"), function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest("details");
      if (item) { item.open = false; var s = item.querySelector("summary"); if (s) s.focus(); }
    });
  });
})();

/* Page d'une campagne : actualisation automatique pendant l'envoi, et conversion de l'heure locale de programmation en UTC. */
(function () {
  "use strict";
  var live = document.querySelector("[data-autorefresh]");
  if (live) setTimeout(function () { window.location.reload(); }, 10000);
  // « Quand ? » : seul le réglage du choix coché est affiché (sans JavaScript, tout reste visible et utilisable)
  var when = document.querySelector("[data-mk-when]");
  if (when) {
    var sync = function () {
      var checked = when.querySelector('input[name="send_mode"]:checked');
      Array.prototype.forEach.call(when.querySelectorAll("[data-when]"), function (box) {
        var on = checked && box.getAttribute("data-when") === checked.value;
        box.hidden = !on;
        Array.prototype.forEach.call(box.querySelectorAll("input"), function (i) { if (i.type !== "hidden") i.required = Boolean(on); });
      });
    };
    when.addEventListener("change", sync);
    sync();
  }
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

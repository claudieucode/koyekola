// Outils → Importer : accord de téléchargement des médias, double soumission.
(function () {
  "use strict";
  var form = document.querySelector("[data-im-form]");
  if (!form) return;
  var media = form.querySelector("[data-im-media]"), box = form.querySelector("[data-im-media-consent]");
  if (media && box) media.addEventListener("change", function () { box.hidden = !media.checked; var c = box.querySelector("input"); if (c && !media.checked) c.checked = false; });
  form.addEventListener("submit", function (e) {
    if (form.dataset.sent === "1") { e.preventDefault(); return; }
    if (media && media.checked) { var c = box.querySelector("input"); if (c && !c.checked) { e.preventDefault(); window.alert("Cochez l'accord de téléchargement des médias, ou décochez le téléchargement."); return; } }
    form.dataset.sent = "1";
    var b = form.querySelector("[data-im-submit]"); if (b) { b.setAttribute("aria-busy", "true"); setTimeout(function () { b.disabled = true; }, 0); }
  });
})();

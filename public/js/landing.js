// Page d'atterrissage : fuseau horaire du navigateur transmis avec l'inscription (envoi des e-mails à l'heure locale)
(function () {
  "use strict";
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    Array.prototype.forEach.call(document.querySelectorAll("input[data-tz]"), function (i) { i.value = tz; });
  } catch (e) { /* fuseau inconnu : rien n'est envoyé */ }
})();

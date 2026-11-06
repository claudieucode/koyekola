/* Personnaliser — noyau : lecture de la configuration envoyée par le serveur, petit bus d'événements, état partagé, indicateur « modifications non enregistrées ».
   Les modules suivants (catégories, aperçu, coque) ne se parlent QUE par ce noyau. Rien ici ne touche le DOM, sauf l'avertissement avant de quitter. */
(function () {
  "use strict";
  var el = document.getElementById("pz-boot");
  var boot = {};
  try { boot = JSON.parse(el.textContent); } catch (e) { boot = {}; }

  var handlers = {};
  var state = { device: boot.defaultDevice || "desktop", collapsed: false, category: null, dirty: false, publishing: false };

  var KWPZ = window.KWPZ = {
    boot: boot,
    state: state,
    // Abonnement / émission : on(« device », fn) ; emit(« device », valeur)
    on: function (name, fn) { (handlers[name] = handlers[name] || []).push(fn); },
    emit: function (name, payload) { (handlers[name] || []).slice().forEach(function (fn) { try { fn(payload); } catch (e) { if (window.console) console.error("Personnaliser :", name, e); } }); },
    // Change une valeur de l'état et prévient les abonnés seulement si elle change réellement (aucun rendu inutile)
    set: function (key, value) { if (state[key] === value) return false; state[key] = value; KWPZ.emit("change:" + key, value); return true; },
    // Les futures catégories signalent ici qu'elles ont des modifications non publiées
    setDirty: function (v) { KWPZ.set("dirty", Boolean(v)); },
    // Confirmation avant de perdre un travail non publié (fermeture, changement de site)
    canLeave: function () { return !state.dirty || window.confirm("Vous avez des modifications non publiées. Quitter quand même ?"); },
    toast: function (message) { KWPZ.emit("toast", message); }
  };

  window.addEventListener("beforeunload", function (e) { if (state.dirty) { e.preventDefault(); e.returnValue = ""; } });
})();

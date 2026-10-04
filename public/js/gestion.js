// Centre de gestion : envoi de fichiers (chargé uniquement par ces pages).
// Les confirmations « data-confirm » sont déjà gérées pour tout Mon espace par dashboard.js.
(function () {
  // Nombre de fichiers choisis : permet au serveur de signaler ceux qu'il a refusés (type non pris en charge)
  document.querySelectorAll("[data-g-upload]").forEach(function (f) {
    f.addEventListener("submit", function () {
      var input = f.querySelector("input[type=file]");
      f.querySelector("[data-g-count]").value = input.files ? input.files.length : 0;
      var b = f.querySelector("button[type=submit]");
      b.disabled = true;
      b.textContent = "Envoi en cours…";
    });
  });
})();

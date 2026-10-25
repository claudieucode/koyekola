// Support (élève) : retour immédiat à l'envoi (bouton inactif + libellé « Envoi… » : pas de second clic possible), compteur de caractères,
// Ctrl/Cmd + Entrée pour envoyer. Sans ce script, les formulaires fonctionnent tels quels (le serveur écarte déjà les doublons).
(function () {
  [].forEach.call(document.querySelectorAll("form"), function (form) {
    var buttons = [].slice.call(form.querySelectorAll("[data-pending]"));
    if (!buttons.length) return;
    form.addEventListener("submit", function (e) {
      if (buttons.some(function (b) { return b.disabled; })) { e.preventDefault(); return; } // déjà envoyé : pas de second envoi
      if (typeof form.checkValidity === "function" && !form.checkValidity()) return;
      var sent = e.submitter && e.submitter.hasAttribute("data-pending") ? e.submitter : buttons[0];
      sent.dataset.label = sent.textContent; sent.setAttribute("aria-busy", "true"); sent.textContent = sent.getAttribute("data-pending");
      setTimeout(function () { buttons.forEach(function (b) { b.disabled = true; }); }, 0); // après la lecture des champs (dont le bouton « résoudre »)
    });
    // Page revenue depuis l'historique : les boutons redeviennent actifs
    window.addEventListener("pageshow", function (e) { if (e.persisted) buttons.forEach(function (b) { b.disabled = false; b.removeAttribute("aria-busy"); if (b.dataset.label) b.textContent = b.dataset.label; }); });
  });
  [].forEach.call(document.querySelectorAll("textarea[data-count]"), function (t) {
    var out = document.getElementById(t.getAttribute("data-count")), max = Number(t.getAttribute("maxlength")) || 5000;
    function show() { if (out) out.textContent = t.value.length + " / " + max; }
    t.addEventListener("input", show); show();
    if (t.hasAttribute("data-ctrl-enter")) t.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && t.form) { e.preventDefault(); if (t.form.requestSubmit) t.form.requestSubmit(); } });
  });
})();

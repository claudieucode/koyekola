// KOLAKISA CMS → Utilisateurs et rôles : sélection des permissions d'un rôle (tout / rien / par groupe) et compteur. Tout l'enregistrement
// passe par de vrais formulaires ; ce script ne fait que cocher des cases.
(function () {
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = document.querySelector("[data-us-roleform]");
  if (form) {
    var boxes = function () { return $$("[data-us-perm]", form).filter(function (b) { return !b.disabled; }); };
    var count = $$("[data-us-count]", form)[0] || document.querySelector("[data-us-count]");
    var refresh = function () { if (count) { var all = $$("[data-us-perm]", form); count.textContent = all.filter(function (b) { return b.checked; }).length + " permission(s) cochée(s) sur " + all.length; } };
    $$("[data-us-all]", form).forEach(function (b) { b.addEventListener("click", function () { var on = b.getAttribute("data-us-all") === "1"; boxes().forEach(function (x) { x.checked = on; }); refresh(); }); });
    $$("[data-us-group-all]", form).forEach(function (b) { b.addEventListener("click", function () { var on = b.getAttribute("data-us-group-all") === "1"; $$("[data-us-perm]", b.closest("[data-us-group]")).filter(function (x) { return !x.disabled; }).forEach(function (x) { x.checked = on; }); refresh(); }); });
    form.addEventListener("change", refresh);
    refresh();
  }
  // Invitation : un seul envoi à la fois (double clic, touche Entrée répétée) ; le bouton se réactive si la page revient de l'historique
  $$("[data-us-invite]").forEach(function (f) {
    var btn = f.querySelector("[data-us-send]"), state = f.querySelector("[data-us-state]"), sent = false;
    f.addEventListener("submit", function (e) {
      if (sent) { e.preventDefault(); return; }
      var email = f.querySelector('input[name="email"]');
      if (email && !email.checkValidity()) { e.preventDefault(); email.focus(); if (state) state.textContent = "Indiquez une adresse e-mail valide."; return; }
      sent = true; if (btn) btn.disabled = true; if (state) state.textContent = "Envoi…";
    });
    window.addEventListener("pageshow", function () { sent = false; if (btn) btn.disabled = false; if (state) state.textContent = ""; });
  });
  // Rôle : modifications non enregistrées signalées avant de quitter la page
  if (form) {
    var snap = function () { return $$("input,textarea,select", form).map(function (el) { return el.name + "=" + (el.type === "checkbox" ? el.checked : el.value); }).join("&"); };
    var initial = snap(), saving = false;
    form.addEventListener("submit", function () { saving = true; });
    window.addEventListener("beforeunload", function (e) { if (!saving && snap() !== initial) { e.preventDefault(); e.returnValue = ""; } });
  }
  // Fiche d'une personne d'un site : « Enregistrer » ne s'active qu'après un vrai changement de rôle ; envoi unique
  $$("[data-su-roleform]").forEach(function (f) {
    var sel = f.querySelector("select"), btn = f.querySelector("[data-su-save]"), state = f.querySelector("[data-su-state]"), start = sel ? sel.value : "", sent = false;
    if (!sel || !btn) return;
    sel.addEventListener("change", function () { var d = sel.value !== start; btn.disabled = !d; if (state) state.textContent = d ? "Modification non enregistrée" : ""; });
    f.addEventListener("submit", function (e) { if (sent) { e.preventDefault(); return; } sent = true; btn.disabled = true; if (state) state.textContent = "Enregistrement…"; });
    window.addEventListener("beforeunload", function (e) { if (!sent && sel.value !== start) { e.preventDefault(); e.returnValue = ""; } });
  });
  $$("[data-us-autosubmit]").forEach(function (s) { s.addEventListener("change", function () { s.form.submit(); }); });
})();

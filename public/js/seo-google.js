// Connexions Google (SEO) : validation légère de la clé JSON saisie, côté navigateur seulement. Rien n'est envoyé ni stocké ici ; la clé n'est jamais relue depuis le serveur.
(function () {
  "use strict";
  function check(text) {
    text = (text || "").trim();
    if (!text) return { kind: "empty" };
    var o; try { o = JSON.parse(text); } catch (e) { return { kind: "bad", msg: "JSON invalide : " + String(e.message).replace(/^JSON\.parse: /, "").slice(0, 90) + ". Collez le fichier complet, accolades comprises." }; }
    if (!o || typeof o !== "object" || Array.isArray(o)) return { kind: "bad", msg: "Ce n'est pas un objet JSON : collez le contenu du fichier de clé." };
    if (o.type !== "service_account") return { kind: "bad", msg: "Ce JSON n'est pas une clé de compte de service (le champ « type » doit valoir service_account)." };
    if (!o.client_email || !o.private_key) return { kind: "bad", msg: "Clé incomplète : « client_email » et « private_key » sont requis." };
    return { kind: "ok", email: String(o.client_email) };
  }
  document.querySelectorAll("[data-gx-card]").forEach(function (card) {
    var ta = card.querySelector("[data-gx-json]"), state = card.querySelector("[data-gx-json-state]"), form = card.querySelector("[data-gx-form]");
    if (!ta || !state || !form) return;
    var initial = state.textContent, pill = card.querySelector("[data-gx-pill]"), pillText = card.querySelector("[data-gx-pill-text]");
    function render() {
      var r = check(ta.value); ta.classList.toggle("is-invalid", r.kind === "bad"); ta.classList.toggle("is-valid", r.kind === "ok"); ta.setAttribute("aria-invalid", r.kind === "bad" ? "true" : "false");
      state.className = "gx-json-state" + (r.kind === "bad" ? " is-bad" : r.kind === "ok" ? " is-ok" : "");
      state.textContent = r.kind === "empty" ? initial : r.kind === "bad" ? r.msg : "JSON valide. Compte de service : " + r.email + " — ajoutez cette adresse comme utilisateur dans Google.";
      return r;
    }
    ta.addEventListener("input", render);
    form.addEventListener("submit", function (e) {
      var submitter = e.submitter, act = submitter && submitter.value;
      if (act === "tester" || act === "deconnecter") return;
      var r = check(ta.value);
      if (r.kind === "bad") { e.preventDefault(); e.stopImmediatePropagation(); render(); ta.focus(); return; }
      if (r.kind === "empty" && ta.getAttribute("data-gx-saved") !== "1") { e.preventDefault(); e.stopImmediatePropagation(); state.className = "gx-json-state is-bad"; state.textContent = "Collez la clé du compte de service pour connecter ce site."; ta.focus(); }
    }, true);
    form.addEventListener("submit", function (e) {
      if (e.defaultPrevented) return;
      if (pill && pillText) { pill.className = "gx-pill gx-pill-busy"; pillText.textContent = "Vérification en cours…"; }
    });
  });
})();

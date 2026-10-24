// Santé du site : boutons de copie (texte complet côté serveur, valeur seule) avec repli sélectionnable si le presse-papiers est refusé.
(function () {
  "use strict";
  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    return Promise.resolve(legacyCopy(text));
  }
  document.addEventListener("click", function (e) {
    var one = e.target.closest("[data-sh-copy]");
    if (one) {
      copy(one.getAttribute("data-sh-copy")).then(function (ok) { one.classList.toggle("is-done", ok); one.setAttribute("title", ok ? "Copié" : "Copie refusée"); setTimeout(function () { one.classList.remove("is-done"); one.setAttribute("title", "Copier la valeur"); }, 1500); });
      return;
    }
    var all = e.target.closest("[data-sh-copy-all]");
    if (!all) return;
    var state = document.querySelector("[data-sh-copystate]"), box = document.querySelector("[data-sh-fallback]"), area = box && box.querySelector("textarea");
    all.disabled = true; state.textContent = "Collecte en cours…";
    fetch(all.getAttribute("data-url"), { credentials: "same-origin", headers: { Accept: "text/plain" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (text) {
        return copy(text).then(function (ok) {
          if (ok) { state.textContent = "Informations copiées dans le presse-papiers."; if (box) box.hidden = true; }
          else { state.textContent = "Copie automatique impossible : sélectionnez le texte ci-dessous."; if (box) { box.hidden = false; area.value = text; area.focus(); area.select(); } }
        });
      })
      .catch(function () { state.textContent = "Impossible de collecter les informations. Réessayez."; })
      .then(function () { all.disabled = false; });
  });
})();

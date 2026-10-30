// Boutique publique : ajout au panier sans rechargement (amélioration progressive — sans JavaScript, le formulaire fonctionne par redirection).
// Le serveur reste seul juge : prix, stock et quantité sont revérifiés à chaque appel ; ce script ne calcule rien.
(function () {
  "use strict";
  if (window.__shopBound) return; // chargé par plusieurs éléments de la page : un seul écouteur
  window.__shopBound = true;
  function badge(n) { document.querySelectorAll("[data-sh-cart-count]").forEach(function (el) { el.textContent = String(n); }); }
  function refreshCount(base) {
    fetch(base + "/panier.json", { headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then(function (r) { return r.json(); }).then(function (d) { badge(d.count || 0); }).catch(function () { /* le compteur se mettra à jour au prochain chargement */ });
  }
  function initCount() {
    var els = document.querySelectorAll("[data-sh-cart-count]");
    if (els.length) refreshCount("/boutique");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCount); else initCount();
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches || !form.matches("form[data-sh-add]")) return;
    if (!window.fetch) return;
    event.preventDefault();
    var msg = form.querySelector("[data-sh-msg]");
    var button = form.querySelector("button[type=submit]");
    if (button) button.disabled = true;
    fetch(form.action, { method: "POST", body: new URLSearchParams(new FormData(form)), headers: { Accept: "application/json", "X-Requested-With": "fetch" }, credentials: "same-origin" })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (msg) msg.textContent = res.ok ? "Ajouté au panier." : (res.d.message || "Impossible d'ajouter ce produit.");
        if (res.ok) refreshCount(new URL(form.action).pathname.replace(/\/panier\/ajouter$/, ""));
      })
      .catch(function () { if (msg) msg.textContent = "Connexion impossible. Réessayez."; })
      .then(function () { if (button) button.disabled = false; });
  });
})();

// Boutique publique : ajout au panier sans rechargement (amélioration progressive — sans JavaScript, le formulaire fonctionne par redirection).
// Le serveur reste seul juge : prix, stock et quantité sont revérifiés à chaque appel ; ce script ne calcule rien.
(function () {
  "use strict";
  if (window.__shopBound) return; // chargé par plusieurs éléments de la page : un seul écouteur
  window.__shopBound = true;
  function badge(n) { document.querySelectorAll("[data-sh-cart-count]").forEach(function (el) { el.textContent = String(n); }); }
  function total(d) { var els = document.querySelectorAll("[data-sh-cart-total]"); if (!els.length || typeof d.total !== "number") return; var txt; try { txt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: String(d.currency || "eur").toUpperCase() }).format(d.total / 100); } catch (e) { txt = (d.total / 100).toFixed(2); } els.forEach(function (el) { el.textContent = txt; }); }
  function refreshCount(base) {
    fetch(base + "/panier.json", { headers: { Accept: "application/json" }, credentials: "same-origin" })
      .then(function (r) { return r.json(); }).then(function (d) { badge(d.count || 0); total(d); }).catch(function () { /* le compteur se mettra à jour au prochain chargement */ });
  }
  function initCount() {
    var els = document.querySelectorAll("[data-sh-cart-count], [data-sh-cart-total]");
    if (els.length) refreshCount("/boutique");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCount); else initCount();
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form.matches || !form.matches("form[data-sh-add]")) return;
    if (!window.fetch) return;
    if (event.submitter && event.submitter.hasAttribute("data-sh-now")) return; // « Acheter maintenant » : navigation normale vers la commande (le serveur ajoute puis redirige)
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

// Liste de cadeaux : « livrer chez le bénéficiaire » masque l'adresse de l'invité (le serveur utilise alors l'adresse enregistrée de la liste, qui n'est jamais affichée).
(function () {
  var radios = document.querySelectorAll("[data-sh-gift-delivery]");
  var box = document.querySelector("[data-sh-ship-fieldset]");
  if (!radios.length || !box) return;
  function sync() {
    var recipient = Array.prototype.some.call(radios, function (r) { return r.checked && r.value === "recipient"; });
    box.hidden = recipient;
    Array.prototype.forEach.call(box.querySelectorAll("input"), function (i) {
      if (recipient) { if (i.required) { i.dataset.wasRequired = "1"; i.required = false; } } else if (i.dataset.wasRequired) { i.required = true; }
    });
  }
  Array.prototype.forEach.call(radios, function (r) { r.addEventListener("change", sync); });
  sync();
})();

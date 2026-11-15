// KOLAKISA CMS → Comptes → Profil : aperçu et contrôle de la photo choisie, indication des modifications non enregistrées, état de chargement des boutons.
// Rien ici ne remplace le serveur : le type et la taille de la photo sont revérifiés à l'enregistrement, et seul son « enregistré » fait foi.
(function () {
  "use strict";
  var root = document.querySelector("[data-pf]");
  if (!root) return;
  var MAX = 2 * 1048576, OK = /^image\/(jpeg|png|gif|webp|avif)$/;
  var size = function (n) { return n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " Mo" : Math.max(1, Math.round(n / 1024)) + " Ko"; };

  // ---- Photo de profil : aperçu immédiat, nom et poids du fichier, refus lisible avant l'envoi
  var box = root.querySelector("[data-pf-avatar]"), input = root.querySelector("[data-pf-file]");
  if (box && input) {
    var img = box.querySelector("[data-pf-avatar-img]"), initial = box.querySelector("[data-pf-avatar-initial]");
    var name = box.querySelector("[data-pf-filename]"), error = box.querySelector("[data-pf-file-error]");
    var original = img ? img.getAttribute("src") : "", hadPhoto = Boolean(original), url = null;
    var reset = function () { if (url) { URL.revokeObjectURL(url); url = null; } if (hadPhoto) img.src = original; else { img.hidden = true; img.removeAttribute("src"); if (initial) initial.hidden = false; } name.textContent = "Aucun fichier choisi"; box.classList.remove("has-file"); };
    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      error.hidden = true; error.textContent = "";
      if (!f) { reset(); return; }
      if (!OK.test(f.type)) { input.value = ""; reset(); error.textContent = "Ce fichier n'est pas une image prise en charge (JPEG, PNG, GIF, WebP ou AVIF)."; error.hidden = false; return; }
      if (f.size > MAX) { input.value = ""; reset(); error.textContent = "Cette image pèse " + size(f.size) + " : 2 Mo au plus."; error.hidden = false; return; }
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(f); img.src = url; img.hidden = false; if (initial) initial.hidden = true;
      name.textContent = f.name + " · " + size(f.size); box.classList.add("has-file");
    });
  }

  // ---- Modifications non enregistrées : les champs du formulaire principal (attribut form="pf-main")
  var note = root.querySelector("[data-pf-note]"), bar = root.querySelector("[data-pf-save]");
  var idle = note ? note.textContent : "";
  var dirty = function () { if (!bar || bar.classList.contains("is-dirty")) return; bar.classList.add("is-dirty"); if (note) note.textContent = "Modifications non enregistrées."; };
  document.addEventListener("input", function (e) { if (e.target.getAttribute && e.target.getAttribute("form") === "pf-main") dirty(); });
  document.addEventListener("change", function (e) { if (e.target.getAttribute && e.target.getAttribute("form") === "pf-main") dirty(); });

  // ---- Envoi : le bouton passe en « chargement » (une seule soumission), et se rétablit si on revient sur la page
  var busy = function (btn) { if (!btn || btn.classList.contains("is-loading")) return; btn.classList.add("is-loading"); btn.setAttribute("aria-busy", "true"); setTimeout(function () { btn.disabled = true; }, 0); };
  document.addEventListener("submit", function (e) {
    var f = e.target; if (!f || !f.querySelector) return;
    if (f.id === "pf-main") busy(root.querySelector("[data-pf-submit]"));
    else if (root.contains(f)) busy(f.querySelector('button[type="submit"]'));
  });
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    root.querySelectorAll(".is-loading").forEach(function (b) { b.classList.remove("is-loading"); b.removeAttribute("aria-busy"); b.disabled = false; });
    if (bar) { bar.classList.remove("is-dirty"); if (note) note.textContent = idle; }
  });
})();

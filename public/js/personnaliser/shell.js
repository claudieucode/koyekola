/* Personnaliser — coque : sélecteur d'appareil, masquage du panneau, boutons du haut (Fermer, Guide de style, Publier), messages brefs. */
(function () {
  "use strict";
  var K = window.KWPZ; if (!K) return;
  var app = document.getElementById("pz-app");
  var $ = function (id) { return document.getElementById(id); };

  // ----- Appareils (radio accessible : flèches, Début/Fin) -----
  var group = $("pz-devices");
  (K.boot.devices || []).forEach(function (d) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "pz-device"; b.dataset.device = d.id; b.setAttribute("role", "radio");
    b.innerHTML = '<svg aria-hidden="true"><use href="#pz-i-' + d.id + '"/></svg><span></span>';
    b.lastChild.textContent = d.label;
    b.addEventListener("click", function () { K.set("device", d.id); });
    group.appendChild(b);
  });
  function markDevice(id) { Array.prototype.forEach.call(group.children, function (b) { var on = b.dataset.device === id; b.setAttribute("aria-checked", String(on)); b.tabIndex = on ? 0 : -1; }); }
  K.on("change:device", markDevice); markDevice(K.state.device);
  group.addEventListener("keydown", function (e) {
    var order = (K.boot.devices || []).map(function (d) { return d.id; }), i = order.indexOf(K.state.device), n = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % order.length; else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i + order.length - 1) % order.length;
    else if (e.key === "Home") n = 0; else if (e.key === "End") n = order.length - 1; else return;
    e.preventDefault(); K.set("device", order[n]); var t = group.querySelector('[data-device="' + order[n] + '"]'); if (t) t.focus();
  });

  // ----- Masquer / afficher le panneau -----
  var hide = $("pz-hide"), show = $("pz-show");
  K.on("change:collapsed", function (c) {
    app.classList.toggle("is-collapsed", c); hide.setAttribute("aria-expanded", String(!c)); show.hidden = !c;
    if (c) show.focus({ preventScroll: true }); else hide.focus({ preventScroll: true });
  });
  hide.addEventListener("click", function () { K.set("collapsed", true); });
  show.addEventListener("click", function () { K.set("collapsed", false); });
  // Écran réduit : le panneau recouvre l'aperçu, on le replie dès qu'une page est chargée pour la première fois
  if (window.matchMedia && window.matchMedia("(max-width: 900px)").matches) { /* ouvert au départ : l'utilisateur choisit */ }

  // ----- Fermer : demande confirmation seulement s'il y a un travail non publié -----
  $("pz-close").addEventListener("click", function (e) { if (!K.canLeave()) e.preventDefault(); else K.state.dirty = false; });

  // ----- Guide de style : l'emplacement et l'événement sont prêts, le guide viendra plus tard -----
  var sg = $("pz-styleguide");
  sg.addEventListener("click", function () { var on = sg.getAttribute("aria-pressed") !== "true"; sg.setAttribute("aria-pressed", String(on)); K.emit("styleguide", on); });

  // ----- Publier : états normal / survol / focus / désactivé / chargement (le moteur de publication viendra avec les catégories) -----
  var pub = $("pz-publish");
  function renderPublish() {
    var state = K.state.publishing ? "loading" : K.state.publishable ? "ready" : "disabled";
    pub.dataset.state = state; var off = state !== "ready"; pub.disabled = off; pub.setAttribute("aria-disabled", String(off)); pub.setAttribute("aria-busy", String(state === "loading"));
  }
  K.on("change:publishable", renderPublish); K.on("change:dirty", renderPublish); K.on("change:publishing", renderPublish); renderPublish();
  pub.addEventListener("click", function () { K.emit("publish"); });

  // ----- Message bref -----
  var toast = $("pz-toast"), tt = null;
  K.on("toast", function (m) { var o = typeof m === "string" ? { message: m, kind: "ok" } : m; toast.textContent = o.message; toast.className = "pz-toast" + (o.kind === "error" ? " is-error" : ""); toast.setAttribute("role", o.kind === "error" ? "alert" : "status"); toast.hidden = false; clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, o.kind === "error" ? 7000 : 3500); });

  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !K.state.category && !e.defaultPrevented && K.state.collapsed) K.set("collapsed", false); });
})();

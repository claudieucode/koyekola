// KOLAKISA CMS — boîte « Nouvelle page » (PAGES-02) : validation du nom, mode d'édition, protection contre le double envoi, confirmation avant d'abandonner une saisie.
// Logique pure (testée sous Node) + branchement sur la boîte unique partials/new-page-dialog.ejs. Le serveur revalide tout (nom, modèle, site, droits) et ne crée la page qu'UNE fois
// (jeton request_id) : rien n'est annoncé comme créé avant sa réponse.
(function (root) {
  "use strict";
  var cleanName = function (v) { return String(v == null ? "" : v).replace(/\s+/g, " ").trim(); };
  function nameState(v, max) {
    var n = cleanName(v);
    if (!n) return { ok: false, name: "", message: "Donnez un nom à la page." };
    if (n.length > (max || 100)) return { ok: false, name: n, message: "Le nom est trop long (" + (max || 100) + " caractères au plus)." };
    return { ok: true, name: n, message: "" };
  }
  // Un seul envoi par ouverture de la boîte : un deuxième clic, ou la touche Entrée répétée, ne repart pas
  function createGuard() {
    var sent = false;
    return { begin: function () { if (sent) return false; sent = true; return true; }, reset: function () { sent = false; }, sent: function () { return sent; } };
  }
  var api = { cleanName: cleanName, nameState: nameState, createGuard: createGuard };
  root.KWNewPage = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  function mount(dlg) {
    var form = dlg.querySelector("[data-np-form]");
    if (!form) return;
    var name = form.querySelector("[data-np-name]"), hint = form.querySelector("[data-np-hint]"), submit = form.querySelector("[data-np-submit]"), status = form.querySelector("[data-np-status]");
    var layout = form.querySelector("[data-np-layout]"), guard = createGuard(), label = submit.textContent;
    // Ouverte par le serveur (adresse « ?nouvelle=1 ») : elle devient une vraie fenêtre modale, avec piège du focus
    if (dlg.hasAttribute("open") && typeof dlg.showModal === "function") { dlg.removeAttribute("open"); dlg.showModal(); }
    var refresh = function () { var st = nameState(name.value); submit.disabled = !st.ok || guard.sent(); hint.textContent = st.ok || !name.value ? "Obligatoire. Les espaces au début et à la fin sont retirés." : st.message; };
    name.addEventListener("input", refresh); refresh();
    // Mode « édition par sections » : la mise en page guidée ne s'applique pas (réglage de l'éditeur visuel) ; ses champs ne sont pas envoyés
    var syncMode = function () { var m = form.querySelector('[name="ouvrir"]:checked'); if (layout) { layout.disabled = !!m && m.value === "fiche"; layout.style.opacity = layout.disabled ? ".55" : ""; } };
    form.addEventListener("change", syncMode); syncMode();
    form.addEventListener("submit", function (e) {
      var st = nameState(name.value);
      if (!st.ok) { e.preventDefault(); hint.textContent = st.message; name.focus(); return; }
      if (!guard.begin()) { e.preventDefault(); return; }
      name.value = st.name;                                 // espaces superflus retirés
      submit.disabled = true; submit.textContent = "Création en cours…"; form.setAttribute("aria-busy", "true"); if (status) status.textContent = "Création de la page…";
    });
    // Retour arrière du navigateur (page en cache) : la boîte redevient utilisable ; le jeton du formulaire protège d'une double création
    window.addEventListener("pageshow", function (e) { if (e.persisted) { guard.reset(); submit.textContent = label; form.removeAttribute("aria-busy"); if (status) status.textContent = ""; refresh(); } });

    // Abandon : une saisie n'est pas perdue en silence (Annuler, croix, Échap, clic sur le fond) ; sans saisie, la boîte se ferme tout de suite. Rien n'a été envoyé : aucune page n'est créée.
    var dirty = function () { return !guard.sent() && cleanName(name.value) !== ""; };
    var abandon = function () {
      var close = function () { name.value = ""; refresh(); dlg.close(); };
      if (window.mkConfirm) window.mkConfirm({ title: "Abandonner cette page ?", text: "Le nom saisi sera perdu. Aucune page n'a été créée.", ok: "Abandonner" }, close);
      else if (window.confirm("Abandonner la saisie ? Aucune page n'a été créée.")) close();
    };
    Array.prototype.forEach.call(dlg.querySelectorAll("[data-mk-modal-close]"), function (b) { b.addEventListener("click", function (e) { if (dirty()) { e.stopImmediatePropagation(); e.preventDefault(); abandon(); } }, true); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg && dirty()) { e.stopImmediatePropagation(); abandon(); } }, true);
    dlg.addEventListener("cancel", function (e) { if (dirty()) { e.preventDefault(); abandon(); } });
  }
  function init() { Array.prototype.forEach.call(document.querySelectorAll("dialog[data-np]"), mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})(typeof window !== "undefined" ? window : globalThis);

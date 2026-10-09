// KOLAKISA CMS → Apparence : taille de l'aperçu (ordinateur / tablette / mobile), choix d'un logo dans la médiathèque,
// champs de conditions des templates selon la famille choisie. Tout l'enregistrement passe par de vrais formulaires.
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Aperçu : la largeur du cadre change, le site s'y adapte réellement (mêmes media queries)
  var frame = $("[data-ap-frame]");
  $$("[data-ap-device]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!frame) return;
      frame.style.width = b.getAttribute("data-ap-device") + "px";
      $$("[data-ap-device]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    });
  });

  // Logo : sélecteur partagé de la médiathèque (images)
  $$("[data-ap-media-field]").forEach(function (box) {
    var pick = $("[data-ap-media-pick]", box), id = $("[data-ap-media-id]", box), name = $("[data-ap-media-name]", box);
    pick.addEventListener("click", function () {
      if (!window.KWMediaPicker) { name.textContent = "La médiathèque n'est pas disponible : rechargez la page."; return; }
      window.KWMediaPicker.open({ title: "Choisir un logo", type: "image", multiple: false, onPick: function (m) { id.value = String(m.id); name.textContent = (m.title || m.name || "Image") + " (n° " + m.id + ")"; } });
    });
  });

  // Templates : n'afficher que les conditions utiles à la famille choisie, et son aide
  var tf = $("[data-ap-template-form]");
  if (tf) {
    var conds = {}; try { conds = JSON.parse(tf.getAttribute("data-conditions")); } catch (e) { conds = {}; }
    var type = $("#tt-type", tf);
    var update = function () {
      var allowed = conds[type.value] || [];
      $$("[data-ap-cond]", tf).forEach(function (el) { el.hidden = allowed.indexOf(el.getAttribute("data-ap-cond")) < 0; });
      $$("[data-ap-types] li", tf).forEach(function (li) { li.hidden = li.getAttribute("data-type") !== type.value; });
    };
    type.addEventListener("change", update); update();
  }
})();

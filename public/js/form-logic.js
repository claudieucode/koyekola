// Logique conditionnelle des formulaires d'inscription (page /f/…, pages du site, pop-up) : un champ marqué
// data-show-if='{"field":"…","op":"equals|notEquals|filled","value":"…"}' n'apparaît que si la condition est remplie.
// Un champ caché est désactivé (ni envoyé, ni exigé). Le serveur refait exactement le même calcul : ce script n'est
// qu'un confort d'affichage. Sans dépendance.
(function () {
  "use strict";
  function valueOf(form, name) {
    var els = form.querySelectorAll('[name="' + name.replace(/"/g, "") + '"]');
    var out = "";
    Array.prototype.forEach.call(els, function (el) {
      if (el.disabled) return;
      if (el.type === "checkbox" || el.type === "radio") { if (el.checked) out = el.value; }
      else out = el.value;
    });
    return String(out || "").trim();
  }
  function apply(form) {
    var blocks = Array.prototype.slice.call(form.querySelectorAll("[data-show-if]"));
    // Dans l'ordre du formulaire : une condition ne vise qu'un champ placé avant (déjà calculé)
    blocks.forEach(function (block) {
      var c;
      try { c = JSON.parse(block.getAttribute("data-show-if")); } catch (e) { return; }
      var v = valueOf(form, c.field);
      var visible = c.op === "filled" ? v !== "" : c.op === "equals" ? v.toLowerCase() === String(c.value).toLowerCase() : v.toLowerCase() !== String(c.value).toLowerCase();
      block.hidden = !visible;
      Array.prototype.forEach.call(block.querySelectorAll("input, select, textarea"), function (el) { el.disabled = !visible; });
    });
  }
  function bind(form) {
    if (!form || form.__kwLogic) return;
    form.__kwLogic = true;
    apply(form);
    form.addEventListener("input", function () { apply(form); });
    form.addEventListener("change", function () { apply(form); });
  }
  window.KolakisaFormLogic = { bind: bind, apply: apply };
  function init() { Array.prototype.forEach.call(document.querySelectorAll("form"), function (f) { if (f.querySelector("[data-show-if]")) bind(f); }); }
  if (document.readyState !== "loading") init(); else document.addEventListener("DOMContentLoaded", init);
})();

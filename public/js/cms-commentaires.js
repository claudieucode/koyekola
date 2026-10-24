// KOLAKISA CMS → Paramètres → Commentaires : volets contextuels (sans effacer les valeurs enregistrées) et compteurs de lignes des listes.
// Sans ce script, tous les volets restent visibles et le serveur valide tout : il ne fait que guider.
(function () {
  "use strict";
  var root = document.querySelector("[data-cm]");
  if (!root) return;
  var ctl = {
    guests: root.querySelector('input[name="comments_guests_allowed"]'), close: root.querySelector('[data-cm-ctl="close"]'),
    replies: root.querySelector('[data-cm-ctl="replies"]'), paginate: root.querySelector('[data-cm-ctl="paginate"]'),
    avatars: root.querySelector('[data-cm-ctl="avatars"]'), ext: root.querySelector('[data-cm-ctl="ext"]'),
  };
  function sync() {
    Object.keys(ctl).forEach(function (k) {
      var on = ctl[k] && ctl[k].checked;
      root.querySelectorAll('[data-cm-panel="' + k + '"]').forEach(function (p) { if (on) p.removeAttribute("data-off"); else p.setAttribute("data-off", ""); });
    });
    var ext = ctl.ext && ctl.ext.checked;
    root.querySelectorAll(".mk-cm-av.is-locked").forEach(function (l) { l.classList.toggle("is-locked", !ext); });
  }
  Object.keys(ctl).forEach(function (k) { if (ctl[k]) ctl[k].addEventListener("change", sync); });
  root.querySelectorAll("[data-cm-count]").forEach(function (badge) {
    var ta = document.getElementById(badge.getAttribute("data-cm-count"));
    if (!ta) return;
    var max = (badge.textContent.split("/")[1] || "500").trim();
    var upd = function () { var n = ta.value.split(/\r?\n/).filter(function (l) { return l.trim(); }).length; badge.textContent = n + " / " + max; badge.classList.toggle("is-over", n > Number(max)); };
    ta.addEventListener("input", upd);
  });
  sync();
})();

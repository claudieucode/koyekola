// Campagnes → Réseaux sociaux : compteur de caractères selon les réseaux cochés (limite la plus stricte), date de
// programmation convertie en heure universelle (le serveur ne connaît pas le fuseau du navigateur).
(function () {
  "use strict";
  var form = document.querySelector("[data-social-form]");
  if (!form) return;
  var body = form.querySelector("[data-social-body]");
  var count = form.querySelector("[data-social-count]");
  var boxes = [].slice.call(form.querySelectorAll('input[name="networks"]'));
  function update() {
    var limits = boxes.filter(function (b) { return b.checked; }).map(function (b) { return Number(b.getAttribute("data-limit")); });
    var max = limits.length ? Math.min.apply(null, limits) : 5000;
    var n = body.value.length;
    count.textContent = n + " / " + max + " caractères" + (n > max ? " — trop long pour un des réseaux cochés" : "");
    body.setAttribute("aria-invalid", n > max ? "true" : "false");
  }
  body.addEventListener("input", update);
  boxes.forEach(function (b) { b.addEventListener("change", update); });
  update();
  var later = form.querySelector("[data-social-later]");
  var at = later && later.querySelector('input[type="datetime-local"]');
  var utc = form.querySelector("[data-social-utc]");
  [].forEach.call(form.querySelectorAll("[data-social-when]"), function (r) {
    r.addEventListener("change", function () { later.hidden = r.value !== "later" || !r.checked; if (!later.hidden) at.focus(); });
  });
  form.addEventListener("submit", function () {
    if (at && at.value) { var d = new Date(at.value); if (!isNaN(d.getTime())) utc.value = d.toISOString(); }
  });
})();

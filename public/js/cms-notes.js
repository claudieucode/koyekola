// Admin Notes : confort seulement (la page fonctionne sans ce script). Compteurs de caractères, anti double envoi, repli des notes longues.
(function () {
  "use strict";
  document.querySelectorAll("[data-nt-count]").forEach(function (out) {
    var field = document.getElementById(out.getAttribute("data-nt-count"));
    if (!field) return;
    var update = function () { out.textContent = String(field.value.length); };
    field.addEventListener("input", update); update();
  });
  document.querySelectorAll("form[data-nt-once]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (form.getAttribute("data-nt-sending") === "1") { e.preventDefault(); return; }
      var title = form.querySelector('input[name="title"]'), body = form.querySelector('textarea[name="body"]');
      if (title && !title.value.trim()) { e.preventDefault(); title.focus(); title.setAttribute("aria-invalid", "true"); return; }
      if (body && !body.value.trim()) { e.preventDefault(); body.focus(); body.setAttribute("aria-invalid", "true"); return; }
      form.setAttribute("data-nt-sending", "1");
      var btn = form.querySelector("[data-nt-submit], button[type=submit]");
      if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn.textContent = "Enregistrement…"; }
    });
  });
  document.querySelectorAll("[data-nt-body]").forEach(function (el) {
    if (el.scrollHeight <= el.clientHeight + 4 && !el.classList.contains("is-clamped")) {
      el.classList.add("is-clamped");
      if (el.scrollHeight <= el.clientHeight + 4) { el.classList.remove("is-clamped"); return; }
    }
    if (!el.classList.contains("is-clamped")) return;
    var b = document.createElement("button");
    b.type = "button"; b.className = "mk-nt-more"; b.textContent = "Afficher toute la note"; b.setAttribute("aria-expanded", "false");
    b.addEventListener("click", function () { var open = el.classList.toggle("is-clamped") === false; b.textContent = open ? "Réduire" : "Afficher toute la note"; b.setAttribute("aria-expanded", open ? "true" : "false"); });
    el.insertAdjacentElement("afterend", b);
  });
})();

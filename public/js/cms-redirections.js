// Redirections (espace de travail) : confirmation des actions sensibles, sélection de toutes les lignes, lecture d'un fichier dans la zone de texte, fenêtre « Rediriger… ».
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  document.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-rd-confirm]");
    if (f && !window.confirm(f.getAttribute("data-rd-confirm"))) e.preventDefault();
  });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-rd-confirm]");
    if (b && !window.confirm(b.getAttribute("data-rd-confirm"))) { e.preventDefault(); return; }
    var all = e.target.closest("[data-rd-all]");
    if (all) { var t = all.closest("table"); if (t) t.querySelectorAll("tbody input[type=checkbox]:not(:disabled)").forEach(function (c) { c.checked = all.checked; }); }
    var open = e.target.closest("[data-rd-redirect]");
    if (open) {
      var d = $("#rd-redirect"); if (!d) return;
      var p = open.getAttribute("data-rd-redirect");
      $("#rd-redirect-path").value = p; $("#rd-redirect-show").textContent = p;
      if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
      var ti = $("#rd-redirect-target"); if (ti) ti.focus();
    }
    if (e.target.closest("[data-rd-close]")) { var dd = e.target.closest("dialog"); if (dd) dd.close(); }
  });
  document.addEventListener("change", function (e) {
    var a = e.target.closest("[data-rd-autosubmit]");
    if (a && a.form) a.form.submit();
    var file = e.target.closest("[data-rd-file]");
    if (file && file.files && file.files[0]) {
      var area = $(file.getAttribute("data-rd-file"));
      if (file.files[0].size > 2000000) { window.alert("Fichier trop volumineux (2 Mo au plus)."); file.value = ""; return; }
      var rd = new FileReader();
      rd.onload = function () { if (area) area.value = String(rd.result || ""); };
      rd.readAsText(file.files[0]);
    }
  });
  var q = new URLSearchParams(location.search);
  if (q.get("nouvelle") === "1") setTimeout(function () { var nb = document.querySelector("[data-ur-new]"); if (nb) nb.click(); }, 60);
})();

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
    var nw = e.target.closest("[data-rd-new]");
    if (nw) { var dn = $("#rd-new"); if (dn) { if (typeof dn.showModal === "function") dn.showModal(); else dn.setAttribute("open", ""); var si = $("#rd-source"); if (si) si.focus(); } }
    var cd = e.target.closest("[data-rd-closedetails]"); if (cd) { var det = cd.closest("details"); if (det) { det.removeAttribute("open"); var sm = det.querySelector("summary"); if (sm) sm.focus(); } }
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
  // Arrivée avec #nouvelle ou une adresse à rediriger (?source=…) : la fenêtre de création s'ouvre directement
  var auto = $("#rd-new");
  if (auto && (location.hash === "#nouvelle" || /[?&]nouvelle=1/.test(location.search) || auto.getAttribute("data-rd-autoopen") === "1")) { if (typeof auto.showModal === "function") auto.showModal(); else auto.setAttribute("open", ""); }
  // Onglets : l'onglet actif reste visible quand la rangée défile (écrans étroits)
  var cur = document.querySelector(".rd-tabs [aria-current=page]");
  if (cur && cur.scrollIntoView) { var tabs = cur.parentElement; if (tabs && tabs.scrollWidth > tabs.clientWidth) { var fin = cur.offsetLeft + cur.offsetWidth; tabs.scrollLeft = fin > tabs.clientWidth - 8 ? fin - tabs.clientWidth + 32 : 0; } }
  var strip = document.querySelector(".rd-tabs");
  if (strip) { var fade = function () { strip.classList.toggle("is-scrollable", strip.scrollWidth > strip.clientWidth + 2 && strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2); }; fade(); strip.addEventListener("scroll", fade, { passive: true }); window.addEventListener("resize", fade); }
  // Zones de dépôt : un fichier glissé remplit le champ de fichier, comme un choix au clavier
  document.addEventListener("dragover", function (e) { var z = e.target.closest && e.target.closest("[data-rd-drop]"); if (z) { e.preventDefault(); z.classList.add("is-over"); } });
  document.addEventListener("dragleave", function (e) { var z = e.target.closest && e.target.closest("[data-rd-drop]"); if (z) z.classList.remove("is-over"); });
  document.addEventListener("drop", function (e) {
    var z = e.target.closest && e.target.closest("[data-rd-drop]"); if (!z) return;
    e.preventDefault(); z.classList.remove("is-over");
    var input = z.querySelector("input[type=file]"); if (!input || !e.dataTransfer || !e.dataTransfer.files.length) return;
    try { input.files = e.dataTransfer.files; input.dispatchEvent(new Event("change", { bubbles: true })); } catch (err) { /* navigateur sans prise en charge : le choix classique reste disponible */ }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var o = document.querySelector("details.rd-edit[open]"); if (o) { o.removeAttribute("open"); var s = o.querySelector("summary"); if (s) s.focus(); } } });
  var q = new URLSearchParams(location.search);
  if (q.get("nouvelle") === "1") setTimeout(function () { var nb = document.querySelector("[data-ur-new]"); if (nb) nb.click(); }, 60);
})();

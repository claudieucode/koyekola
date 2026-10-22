// KOLAKISA CMS → Apparence → Thèmes : confirmation des actions, anti double envoi, recherche instantanée, notifications fermables, lecture du fichier de paquet.
// Tout fonctionne aussi sans ce script (formulaires et recherche côté serveur) ; il ne fait qu'améliorer l'usage.
(function () {
  "use strict";
  var root = document.querySelector("[data-th-root]");
  if (!root) return;
  var store = function (fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } };
  var status = root.querySelector("[data-th-status]");
  var say = function (t) { if (status) status.textContent = t; };

  // Aide
  root.querySelectorAll("[data-th-toggle]").forEach(function (b) {
    b.addEventListener("click", function () { var p = document.getElementById(b.getAttribute("aria-controls")); var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!open)); if (p) p.hidden = open; });
  });

  // Notifications fermables (mémorisées pour la session)
  root.querySelectorAll("[data-th-notice]").forEach(function (n) {
    var k = n.getAttribute("data-th-notice");
    if (store(function (s) { return s.getItem(k); }) === "1") { n.hidden = true; return; }
    var x = n.querySelector("[data-th-dismiss]");
    if (x) x.addEventListener("click", function () { n.hidden = true; store(function (s) { s.setItem(k, "1"); }); });
  });

  // Confirmation puis anti double envoi
  root.querySelectorAll("form[data-th-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      var b = e.submitter || f.querySelector("button[type=submit]");
      var msg = b && b.getAttribute("data-confirm");
      if (msg && !window.confirm(msg)) { e.preventDefault(); return; }
      if (f.getAttribute("data-busy-now") === "1") { e.preventDefault(); return; }
      f.setAttribute("data-busy-now", "1");
      if (b) { b.setAttribute("aria-busy", "true"); b.textContent = b.getAttribute("data-busy") || "En cours…"; setTimeout(function () { b.disabled = true; }, 0); }
      say("Opération en cours…");
    });
  });

  // Recherche instantanée dans la grille (le formulaire fonctionne aussi côté serveur)
  var input = root.querySelector("[data-th-search]"), cards = root.querySelectorAll("[data-th-card]");
  if (input && cards.length) {
    var filter = function () {
      var q = input.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) { var ok = !q || c.getAttribute("data-th-name").indexOf(q) !== -1; c.hidden = !ok; if (ok) n++; });
      var add = root.querySelector(".mk-th-add"); if (add) add.hidden = Boolean(q);
      say(q ? (n ? n + " thème" + (n > 1 ? "s" : "") + " trouvé" + (n > 1 ? "s" : "") + "." : "Aucun thème ne correspond à cette recherche.") : "");
    };
    input.addEventListener("input", filter);
    if (input.value) filter();
  }

  // Fichier de paquet → zone de texte (lecture locale, bornée ; la validation reste celle du serveur)
  var file = root.querySelector("[data-th-file]"), area = root.querySelector("#th-pkg");
  if (file && area) file.addEventListener("change", function () {
    var f = file.files && file.files[0]; if (!f) return;
    if (f.size > 64 * 1024) { say("Ce fichier dépasse 64 Ko : il ne peut pas être un paquet de thème."); file.value = ""; return; }
    var r = new FileReader();
    r.onload = function () { area.value = String(r.result || ""); say("Fichier « " + f.name + " » chargé : vérifiez le contenu puis installez."); };
    r.onerror = function () { say("Le fichier n'a pas pu être lu."); };
    r.readAsText(f);
  });
})();

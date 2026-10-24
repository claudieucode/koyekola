// KOLAKISA CMS → Outils → Exporter les données : contrôle de saisie (aussi fait côté serveur), case de confirmation directe, sélection globale,
// confirmations avant suppression, vérification des actions groupées et actualisation des statuts (recharge seulement si un état a changé).
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
  var USERNAME = /^[\p{L}\p{N}][\p{L}\p{N}._ -]{1,59}$/u;

  var form = $("[data-px-form]");
  if (form) {
    var input = $("#px-id", form), error = $("[data-px-error]", form), email = $("[data-px-email]", form), direct = $("[data-px-direct]", form), admin = $("[data-px-admin]", form), submit = $("[data-px-submit]", form);
    var showError = function (text) { error.textContent = text; error.hidden = !text; input.setAttribute("aria-invalid", text ? "true" : "false"); };
    var sync = function () {
      var viaEmail = email.checked;
      direct.hidden = viaEmail;
      submit.textContent = viaEmail ? submit.getAttribute("data-label-email") : submit.getAttribute("data-label-direct");
      if (viaEmail) admin.checked = false;
    };
    email.addEventListener("change", sync); sync();
    input.addEventListener("input", function () { if (!error.hidden) showError(""); });
    form.addEventListener("submit", function (e) {
      var v = input.value.trim(), problem = "";
      if (!v) problem = "Saisissez un identifiant ou une adresse e-mail.";
      else if (v.indexOf("@") >= 0 ? !EMAIL.test(v) : !USERNAME.test(v)) problem = v.indexOf("@") >= 0 ? "Cette adresse e-mail n'est pas valide." : "Cet identifiant n'est pas valide (lettres, chiffres, points, tirets, 2 à 60 caractères).";
      else if (!email.checked && !admin.checked) problem = "Sans e-mail de confirmation, cochez la case qui confirme que vous avez vérifié l'identité de la personne.";
      if (problem) { e.preventDefault(); showError(problem); (problem.indexOf("cochez") >= 0 ? admin : input).focus(); }
    });
  }

  // Sélection globale (en-tête et pied de tableau)
  var ones = all("[data-px-one]");
  var alls = all("[data-px-all]");
  var refreshAll = function () { var on = ones.length && ones.every(function (c) { return c.checked; }); alls.forEach(function (a) { a.checked = on; }); };
  alls.forEach(function (a) { a.addEventListener("change", function () { ones.forEach(function (c) { c.checked = a.checked; }); refreshAll(); }); });
  ones.forEach(function (c) { c.addEventListener("change", refreshAll); });

  var bulk = $("[data-px-bulk]");
  if (bulk) bulk.addEventListener("submit", function (e) {
    var msg = $("[data-px-bulk-error]", bulk), action = $("select", bulk).value, any = ones.some(function (c) { return c.checked; }), problem = "";
    if (!action) problem = "Choisissez une action groupée.";
    else if (!any) problem = "Sélectionnez au moins une demande.";
    else if (action === "supprimer" && !window.confirm("Supprimer les demandes sélectionnées et leurs archives ? Les données sources ne sont pas modifiées.")) { e.preventDefault(); return; }
    if (problem) { e.preventDefault(); msg.textContent = problem; msg.hidden = false; } else msg.hidden = true;
  });

  all("[data-px-confirm]").forEach(function (f) { f.addEventListener("submit", function (e) { if (!window.confirm(f.getAttribute("data-px-confirm"))) e.preventDefault(); }); });

  // Actualisation : une demande en attente d'e-mail ou en cours est relue toutes les 12 s ; la page ne se recharge que si un état a changé
  var table = $("#px-table");
  if (table && table.getAttribute("data-px-rows")) {
    var current = table.getAttribute("data-px-rows");
    var live = /:(pending_confirmation|running):/.test(current) || /:pending(,|$)/.test(current);
    if (live) {
      var url = window.location.pathname.replace(/\/?$/, "") + "/etat.json" + window.location.search.replace(/[?&](etat|tri|sens|taille|page)=[^&]*/g, "").replace(/^&/, "?");
      var timer = setInterval(function () {
        if (document.hidden) return;
        fetch(url, { credentials: "same-origin", headers: { Accept: "application/json" } })
          .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
          .then(function (d) {
            var now = d.requests.map(function (r) { return r.id + ":" + r.status + ":" + r.mail; });
            var before = current.split(",").filter(Boolean);
            var changed = before.some(function (b) { return now.indexOf(b) < 0; });
            if (changed && !(document.activeElement && /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))) { clearInterval(timer); window.location.reload(); }
          })
          .catch(function () { /* nouvelle tentative au prochain tour */ });
      }, 12000);
    }
  }
})();

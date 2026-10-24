/* KOLAKISA CMS → Outils → Exporter : interactions. Le serveur est l'unique juge (filtres, droits, périmètre) ; ce script ne fait qu'afficher le filtre pertinent, interroger
   l'aperçu du périmètre (aucune exportation) et verrouiller la double soumission. Sans lui, le formulaire fonctionne (envoi classique, validation serveur). */
(function () {
  "use strict";
  var root = document.querySelector("[data-ex-root]");
  if (!root) return;
  var form = root.querySelector("[data-ex-form]");
  var status = root.querySelector("[data-ex-status]");
  var submit = root.querySelector("[data-ex-submit]");
  var url = root.getAttribute("data-ex-url");
  var timer = null, seq = 0, busy = false, valid = true;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || form).querySelectorAll(s)); };
  function choice() { var r = form.querySelector('input[name="choice"]:checked'); return r ? r.value : "all"; }

  // Un seul panneau de filtres actif : les champs des autres sont désactivés (jamais envoyés)
  function sync() {
    var c = choice();
    $$("[data-ex-opt]").forEach(function (o) { var r = o.querySelector('input[name="choice"]'); o.classList.toggle("is-on", Boolean(r && r.checked)); });
    $$("[data-ex-format]").forEach(function (o) { var r = o.querySelector('input[name="format"]'); o.classList.toggle("is-on", Boolean(r && r.checked)); });
    $$("[data-ex-filters]").forEach(function (p) {
      var active = p.getAttribute("data-ex-filters") === c;
      p.classList.toggle("is-open", active);
      $$("select, input", p).forEach(function (el) { el.disabled = !active; });
    });
    // Un type propre au format natif ne peut pas sortir en WXR : l'option WXR est désactivée tant qu'il est choisi
    var opt = form.querySelector('[data-ex-opt="' + c + '"]');
    var nativeOnly = Boolean(opt && opt.getAttribute("data-ex-wxr") === "0");
    var wxr = form.querySelector('input[name="format"][value="wxr"]');
    if (wxr) { wxr.disabled = nativeOnly; if (nativeOnly && wxr.checked) form.querySelector('input[name="format"][value="json"]').checked = true; }
    $$("[data-ex-format]").forEach(function (o) { var r = o.querySelector("input"); o.classList.toggle("is-on", Boolean(r && r.checked)); });
  }

  function setStatus(text, cls) { if (status) { status.textContent = text; status.className = "pl-status" + (cls ? " " + cls : ""); } }
  function preview() {
    var my = ++seq;
    var fd = new FormData(form);
    var body = new URLSearchParams();
    fd.forEach(function (v, k) { body.append(k, v); });
    fetch(url, { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (my !== seq || busy) return;
        if (!r.ok) { valid = false; setStatus(r.errors.join(" "), "is-bad"); }
        else if (r.empty) { valid = false; setStatus("Aucun contenu ne correspond à cette sélection : modifiez les filtres.", "is-bad"); }
        else { valid = true; setStatus(r.count === null ? "Prêt à exporter." : r.count + " élément" + (r.count > 1 ? "s" : "") + " dans cette sélection.", ""); }
        if (submit) submit.disabled = !valid;
      })
      .catch(function () { /* hors ligne : le serveur revalidera à l'envoi */ });
  }
  function changed() { sync(); clearTimeout(timer); timer = setTimeout(preview, 250); }
  form.addEventListener("input", changed); form.addEventListener("change", changed);
  form.addEventListener("submit", function (e) {
    if (busy) { e.preventDefault(); return; }
    if (!valid) { e.preventDefault(); return; }
    busy = true;
    form.setAttribute("aria-busy", "true");
    if (submit) { submit.disabled = true; var l = submit.querySelector(".ex-label"); if (l) l.textContent = "Préparation du fichier…"; }
    setStatus("Préparation du fichier…", "is-busy");
  });
  sync(); preview();
})();

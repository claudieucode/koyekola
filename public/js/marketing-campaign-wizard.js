/* Assistant de création d'une campagne : une étape de saisie à la fois (nom, destinataires, modèle, suivi), avec barre de
   progression, effectif en direct des destinataires, aperçu de l'objet et récapitulatif. Sans JavaScript, le formulaire
   reste utilisable : les quatre blocs sont affichés ensemble. Aucune donnée n'est insérée comme HTML (textContent). */
(function () {
  "use strict";
  var root = document.getElementById("mk-wizard");
  var form = document.getElementById("mk-campaign-form");
  if (!root || !form) return;
  var steps = Array.prototype.slice.call(form.querySelectorAll(".mk-wizard-step"));
  var items = Array.prototype.slice.call(root.querySelectorAll(".mk-stepper .mk-step"));
  var bar = root.querySelector(".mk-progress");
  var barFill = root.querySelector(".mk-progress-bar");
  var prev = form.querySelector("[data-mk-prev]"), next = form.querySelector("[data-mk-next]"), submit = form.querySelector("[data-mk-submit]");
  var count = document.getElementById("mk-audience-count");
  var subject = document.getElementById("mk-template-subject");
  var recap = document.getElementById("mk-recap");
  var target = document.getElementById("c-target"), category = document.getElementById("c-cat"), template = document.getElementById("c-tpl"), name = document.getElementById("c-name");
  var current = 0, timer = null, seq = 0;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function label(select) { return select && select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : ""; }

  function show(n, focus) {
    current = n;
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    items.forEach(function (li, i) {
      li.classList.toggle("is-done", i < n);
      li.classList.toggle("is-current", i === n);
      if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    var pct = Math.round(((n + 1) / items.length) * 100);
    bar.setAttribute("aria-valuenow", String(n + 1));
    barFill.style.width = pct + "%";
    prev.hidden = n === 0;
    next.hidden = n === steps.length - 1;
    submit.hidden = n !== steps.length - 1;
    if (n === steps.length - 1) buildRecap();
    if (focus) { var first = steps[n].querySelector("input, select, textarea"); if (first) first.focus(); }
  }

  function valid(step) {
    var fields = Array.prototype.slice.call(step.querySelectorAll("input, select, textarea"));
    for (var i = 0; i < fields.length; i++) if (!fields[i].checkValidity()) { fields[i].reportValidity(); return false; }
    return true;
  }

  function buildRecap() {
    if (!recap) return;
    recap.hidden = false; recap.textContent = "";
    [["Nom", name.value], ["Destinataires", label(target)], ["Modèle", label(template)]].forEach(function (row) {
      recap.appendChild(el("dt", {}, row[0])); recap.appendChild(el("dd", {}, row[1]));
    });
  }

  // Effectif des destinataires : une seule réponse utile à la fois (les réponses périmées sont ignorées)
  function refreshCount() {
    if (!count || !target || !target.value) return;
    var mine = ++seq;
    count.textContent = "Calcul du nombre de destinataires…";
    fetch("/marketing/campagnes/apercu-cible", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: target.value, category: category ? category.value : "" }) })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (mine !== seq) return;
        count.textContent = "";
        if (!r.ok) { count.appendChild(el("p", { "class": "form-error", role: "alert" }, r.data.error || "Calcul impossible.")); return; }
        var d = r.data;
        var line = el("p", { "class": d.sendable ? "mk-audience-ok" : "mk-note" });
        line.appendChild(el("strong", {}, String(d.sendable)));
        line.appendChild(document.createTextNode(" contact" + (d.sendable > 1 ? "s" : "") + " joignable" + (d.sendable > 1 ? "s" : "") + " sur " + d.targetTotal + " dans cette cible."));
        count.appendChild(line);
        if (!d.sendable) count.appendChild(el("p", { "class": "field-hint" }, "Aucun envoi ne sera possible tant qu'aucun contact n'a de consentement prouvé : le contrôle avant envoi bloquera la campagne."));
        else if (d.excluded && d.excluded.total) count.appendChild(el("p", { "class": "field-hint" }, d.excluded.total + " contact" + (d.excluded.total > 1 ? "s" : "") + " exclu" + (d.excluded.total > 1 ? "s" : "") + " (sans consentement, désinscrits ou bloqués)."));
      })
      .catch(function () { if (mine === seq) count.textContent = "Calcul impossible pour le moment."; });
  }
  function scheduleCount() { clearTimeout(timer); timer = setTimeout(refreshCount, 300); }

  function showSubject() {
    if (!subject || !template || template.selectedIndex < 0) return;
    var s = template.options[template.selectedIndex].getAttribute("data-subject");
    subject.textContent = s ? "Objet : " + s + (s.indexOf("{{") !== -1 ? " (les variables entre {{ }} sont remplacées à l'envoi)" : "") : "";
  }

  prev.addEventListener("click", function () { if (current > 0) show(current - 1, true); });
  next.addEventListener("click", function () { if (valid(steps[current]) && current < steps.length - 1) show(current + 1, true); });
  // Entrée dans un champ : étape suivante (jamais un envoi du formulaire avant la dernière étape)
  form.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    if (current < steps.length - 1) { e.preventDefault(); next.click(); }
  });
  form.addEventListener("submit", function (e) {
    for (var i = 0; i < steps.length; i++) if (!valid(steps[i])) { e.preventDefault(); show(i, true); return; }
  });
  if (target) { target.addEventListener("change", scheduleCount); if (category) category.addEventListener("change", scheduleCount); }
  if (template) template.addEventListener("change", showSubject);

  showSubject();
  refreshCount();
  show(0, false);
})();

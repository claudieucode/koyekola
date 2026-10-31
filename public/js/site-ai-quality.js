// Médias IA : écran « Qualité des images » (programme 22.7B). Lit le diagnostic en lecture seule et l'affiche avec textContent uniquement (aucun HTML injecté).
(function () {
  "use strict";
  var root = document.querySelector("[data-iq]");
  if (!root) return;
  var btn = root.querySelector("[data-iq-run]"), status = root.querySelector("[data-iq-status]"), out = root.querySelector("[data-iq-out]");
  var LABEL = { trop_sombre: "trop sombre", surexposee: "surexposée", peu_contrastee: "peu contrastée", floue: "floue", petite: "trop petite", lourde: "trop lourde", png_sans_transparence: "PNG sans transparence" };
  function el(tag, text, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " Mo" : Math.round(n / 1024) + " Ko"; }
  function render(d) {
    out.textContent = "";
    var s = d.summary || {}, ul = el("ul");
    [["Doublons", s.duplicates], ["Images inutilisées", s.unused], ["Images trop lourdes", s.heavy], ["Qualité à revoir", s.lowQuality], ["Licence non vérifiée", s.licenseUnverified], ["Textes alternatifs à corriger", s.altProblems], ["Incohérences visuelles", s.consistencyIssues]].forEach(function (r) { ul.appendChild(el("li", r[0] + " : " + (r[1] || 0))); });
    out.appendChild(ul);
    var rows = (d.items || []).filter(function (r) { return (r.flags && r.flags.length) || (r.analysis && r.analysis.flags && r.analysis.flags.length) || (r.altIssues && r.altIssues.length) || r.used === 0; });
    if (!rows.length) { out.appendChild(el("p", "Aucun point d'attention sur les images analysées.", "sw-muted")); return; }
    var t = el("table", undefined, "mk-table"), cap = el("caption", "Images à examiner", "sw-sr"); t.appendChild(cap);
    var hr = el("tr"); ["Image", "Taille", "Points d'attention"].forEach(function (h) { var th = el("th", h); th.scope = "col"; hr.appendChild(th); });
    var th = el("thead"); th.appendChild(hr); t.appendChild(th);
    var tb = el("tbody");
    rows.forEach(function (r) {
      var codes = (r.analysis && r.analysis.flags) || [], notes = [];
      codes.forEach(function (c) { notes.push(LABEL[c] || c); });
      if (r.used === 0) notes.push("non utilisée");
      if (r.altIssues && r.altIssues.length) notes.push("texte alternatif : " + r.altIssues.join(", "));
      var tr = el("tr"); tr.appendChild(el("td", r.name)); tr.appendChild(el("td", (r.width || "?") + "×" + (r.height || "?") + " · " + kb(r.size || 0))); tr.appendChild(el("td", notes.join(" · "))); tb.appendChild(tr);
    });
    t.appendChild(tb); out.appendChild(t);
    if (d.consistency && d.consistency.issues && d.consistency.issues.length) d.consistency.issues.forEach(function (i) { out.appendChild(el("p", typeof i === "string" ? i : (i.message || i.code || ""), "sw-muted")); });
  }
  btn.addEventListener("click", function () {
    btn.disabled = true; status.textContent = "Analyse en cours…";
    fetch(root.dataset.url, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { return r.ok ? r.json() : Promise.reject(new Error(r.status)); })
      .then(function (d) { render(d); status.textContent = "Terminé."; })
      .catch(function () { status.textContent = "Diagnostic indisponible — réessayez."; })
      .then(function () { btn.disabled = false; });
  });
})();

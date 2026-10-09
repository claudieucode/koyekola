// KOLAKISA CMS → Historique : sélection de deux versions à comparer (le bouton n'est actif qu'avec une ou deux cases cochées).
(function () {
  var form = document.querySelector("[data-hi-compare]");
  if (!form) return;
  var boxes = [].slice.call(form.querySelectorAll("[data-hi-pick]")), go = form.querySelector("[data-hi-go]"), hint = form.querySelector("[data-hi-hint]");
  function refresh() {
    var on = boxes.filter(function (b) { return b.checked; });
    if (on.length > 2) { on[0].checked = false; on = on.slice(1); }
    go.disabled = on.length === 0;
    go.textContent = on.length === 2 ? "Comparer les deux versions cochées" : "Comparer avec l'état actuel";
    // Les cases cochées deviennent a et b (ordre chronologique : la plus ancienne d'abord)
    form.querySelectorAll("input[name=a],input[name=b]").forEach(function (x) { x.remove(); });
    var refs = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }).reverse();
    if (refs[0]) { var a = document.createElement("input"); a.type = "hidden"; a.name = "a"; a.value = refs[0]; form.appendChild(a); }
    if (refs[1]) { var c = document.createElement("input"); c.type = "hidden"; c.name = "b"; c.value = refs[1]; form.appendChild(c); }
  }
  boxes.forEach(function (b) { b.addEventListener("change", refresh); b.removeAttribute("name"); });
  refresh();
})();

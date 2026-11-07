/* Cabine Haute — contrôle de gabarit (compare les cotes saisies aux chiffres du tableau de la page) + cotes qui se tracent. Aucune dépendance.
   Les chiffres du tableau sont des EXEMPLES à vérifier auprès de la compagnie ; le résultat est un calcul sur ces chiffres, jamais une garantie d'embarquement. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "cabine-haute") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  body.classList.add("cb-js");

  function dims(str) {
    var p = String(str || "").toLowerCase().split("x").map(function (n) { return parseFloat(String(n).replace(",", ".")); });
    return p.length === 3 && p.every(function (n) { return isFinite(n) && n > 0 && n < 400; }) ? p : null;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function gabarit(table) {
    var ui = document.querySelector("[data-cabine-ui]");
    if (!ui) return;
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-cabine]")).map(function (tr) { return { tr: tr, nom: tr.getAttribute("data-nom") || "", lim: dims(tr.getAttribute("data-cabine")) }; }).filter(function (r) { return r.lim; });
    if (!rows.length) return;
    var start = body.getAttribute("data-pk-sac") === "siege" ? [40, 30, 15] : (dims(table.getAttribute("data-sac")) || [55, 38, 23]);
    ui.textContent = "";
    var fs = el("fieldset"), lg = el("legend", "", "Dimensions de votre bagage, en centimètres (poignées et roues comprises)"), box = el("div", "cb-dims"), inputs = [];
    fs.appendChild(lg);
    ["Longueur", "Largeur", "Hauteur"].forEach(function (name, i) {
      var d = el("div"), id = "cb-dim-" + i, l = el("label", "", name), inp = el("input");
      l.setAttribute("for", id); inp.id = id; inp.type = "number"; inp.min = "1"; inp.max = "300"; inp.step = "0.5"; inp.inputMode = "decimal"; inp.value = String(start[i]);
      d.appendChild(l); d.appendChild(inp); box.appendChild(d); inputs.push(inp);
    });
    fs.appendChild(box);
    var out = el("ul", "cb-res"), live = el("p", "cb-vh"), warn = el("p", "cb-note", "Calcul sur les chiffres d'exemple du tableau, à vérifier auprès de la compagnie : ce n'est pas une garantie d'embarquement.");
    out.setAttribute("aria-label", "Résultat par compagnie"); live.setAttribute("aria-live", "polite"); live.setAttribute("role", "status");
    ui.appendChild(fs); ui.appendChild(out); ui.appendChild(live); ui.appendChild(warn);

    function paint() {
      var mine = inputs.map(function (i) { return parseFloat(String(i.value).replace(",", ".")); });
      out.textContent = "";
      if (!mine.every(function (n) { return isFinite(n) && n > 0; })) { live.textContent = "Saisissez les trois dimensions."; rows.forEach(function (r) { r.tr.classList.remove("is-ok", "is-ko"); }); return; }
      var a = mine.slice().sort(function (x, y) { return y - x; }), okCount = 0;
      rows.forEach(function (r) {
        var b = r.lim.slice().sort(function (x, y) { return y - x; });
        var over = a.map(function (v, i) { return Math.max(0, Math.round((v - b[i]) * 10) / 10); }), fits = over.every(function (o) { return o === 0; });
        if (fits) okCount += 1;
        r.tr.classList.toggle("is-ok", fits); r.tr.classList.toggle("is-ko", !fits);
        var li = el("li", fits ? "is-ok" : "is-ko");
        li.appendChild(el("b", "", r.nom));
        var worst = Math.max.apply(null, over);
        li.appendChild(el("span", "", fits ? "Entre dans la cote d'exemple du tableau." : "Dépasse la cote d'exemple d'au moins " + worst + " cm."));
        out.appendChild(li);
      });
      live.textContent = okCount + " compagnie(s) sur " + rows.length + " dans la cote d'exemple.";
    }
    inputs.forEach(function (i) { i.addEventListener("input", paint); });
    paint();
  }

  function plans() {
    var all = Array.prototype.slice.call(document.querySelectorAll(".cb-plan"));
    if (!all.length) return;
    if (reduce || !("IntersectionObserver" in window)) { all.forEach(function (p) { p.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.3 });
    all.forEach(function (p) { io.observe(p); });
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-cabine-gabarit]")).forEach(gabarit);
    plans();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

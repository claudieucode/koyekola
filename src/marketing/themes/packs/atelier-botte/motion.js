/* Atelier Botte — fiche d'essayage (aperçu de finition et de patine), trait de craie qui se dessine, lien « Essayer en atelier » sur les fiches produit. Aucune dépendance.
   L'aperçu est une illustration : il n'envoie rien. La finition réelle est la variante du produit ; les initiales passent par le champ de personnalisation du moteur ; le rendez-vous passe par la page /boutique/rendez-vous. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "atelier-botte") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  body.classList.add("ab-js");

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function finitions(str) {
    var out = String(str || "").split(";").map(function (p) { var i = p.lastIndexOf(":"); return i > 0 ? { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim() } : null; })
      .filter(function (o) { return o && /^#[0-9a-f]{6}$/i.test(o.value); });
    return out.length ? out : [{ name: "Cognac patiné", value: "#9a5428" }];
  }
  var VEILS = [0, 0.18, 0.34];

  function fiche(root) {
    var stage = root.querySelector("[data-ab-stage]"), ui = root.querySelector("[data-ab-ui]");
    if (!stage || !ui) return;
    var cuirs = finitions(root.getAttribute("data-finitions"));
    var etats = String(root.getAttribute("data-etats") || "Neuf;Après un an;Après cinq ans").split(";").map(function (s) { return s.trim(); }).filter(Boolean).slice(0, VEILS.length);
    if (!etats.length) etats = ["Neuf"];
    var state = { cuir: 0, etat: body.getAttribute("data-pk-patine") === "vieilli" ? Math.min(2, etats.length - 1) : 0 };
    ui.textContent = "";
    function group(title, items, key, swatch) {
      var fs = el("fieldset"), row = el("div", "ab-opts");
      fs.appendChild(el("legend", "", title)); fs.appendChild(row);
      row.setAttribute("role", "group"); row.setAttribute("aria-label", title);
      var btns = items.map(function (it, i) {
        var b = el("button", "ab-opt"); b.type = "button";
        if (swatch) { var s = el("i"); s.style.setProperty("--sw", it.value); b.appendChild(s); }
        b.appendChild(document.createTextNode(it.name));
        b.addEventListener("click", function () { state[key] = i; render(true); });
        row.appendChild(b); return b;
      });
      ui.appendChild(fs); return btns;
    }
    var bCuir = group("Finition", cuirs, "cuir", true);
    var bEtat = group("Le cuir avec le temps", etats.map(function (n) { return { name: n }; }), "etat", false);
    var status = el("p", "ab-vh"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); ui.appendChild(status);
    function render(announce) {
      stage.style.setProperty("--ab-cuir", cuirs[state.cuir].value);
      stage.style.setProperty("--ab-patine", String(VEILS[state.etat] || 0));
      bCuir.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.cuir)); });
      bEtat.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.etat)); });
      if (announce) status.textContent = "Aperçu : finition " + cuirs[state.cuir].name + ", " + etats[state.etat].toLowerCase() + ".";
    }
    render(false);
  }

  // Fiche produit du moteur : lien vers la page de rendez-vous, rattaché au produit (?produit=slug). La page de rendez-vous dit elle-même si elle n'est pas ouverte.
  function lienEssayage() {
    var m = /\/boutique\/produit\/([^\/?#]+)/.exec(location.pathname);
    var buy = document.querySelector(".sh-buy");
    if (!m || !buy || document.querySelector(".ab-essai")) return;
    var p = el("p", "ab-essai"), a = el("a", "", "Essayer ce modèle en atelier");
    a.href = "/boutique/rendez-vous?produit=" + m[1];
    p.appendChild(a); buy.parentNode.insertBefore(p, buy.nextSibling);
  }

  // Le trait de craie se dessine à l'entrée dans l'écran
  function traits() {
    var zones = Array.prototype.slice.call(document.querySelectorAll(".ab-arch,.ab-gab"));
    if (!zones.length) return;
    if (reduce || !("IntersectionObserver" in window)) { zones.forEach(function (z) { z.classList.add("ab-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("ab-in"); io.unobserve(e.target); } }); }, { threshold: 0.25 });
    zones.forEach(function (z) { io.observe(z); });
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-ab-patine]")).forEach(fiche);
    lienEssayage(); traits();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

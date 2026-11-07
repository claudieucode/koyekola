/* Salon Vivant — ambiance jour/soir de la scène, contrôle de passage (calcul local, rien n'est envoyé) et lien « mesurer » sur la fiche produit. Aucune dépendance.
   Sans JavaScript, la scène, les repères et les conseils de mesure restent lisibles et cliquables. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "salon-vivant") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) document.body.classList.add("pk-calme"); // respecte « moins d'animations » : le CSS du thème coupe aussi ses animations
  body.classList.add("sv-js");

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  // Ambiance : le bouton bascule entre la lumière du jour et la lampe allumée. Le réglage du thème donne la valeur de départ.
  function scene(root) {
    var soirDefault = body.getAttribute("data-pk-ambiance") === "soir";
    var btn = el("button", "sv-lamp-btn");
    btn.type = "button";
    function apply(soir) {
      root.classList.toggle("is-soir", soir);
      root.classList.toggle("is-jour", !soir);
      btn.setAttribute("aria-pressed", String(soir));
      btn.textContent = soir ? "Éteindre la lampe" : "Allumer la lampe";
    }
    var soir = soirDefault;
    btn.addEventListener("click", function () { soir = !soir; apply(soir); });
    root.appendChild(btn);
    apply(soir);
  }

  // Contrôle de passage : compare la plus petite dimension du meuble (lue sur sa fiche) au passage le plus étroit mesuré chez soi. Indicatif.
  function passage(root) {
    var uid = "sv" + (window.__svN = (window.__svN || 0) + 1);
    var fb = root.querySelector(".sv-fallback");
    if (fb) fb.parentNode.removeChild(fb);
    function field(label, id) {
      var l = el("label", "", label); l.setAttribute("for", id);
      var i = el("input"); i.type = "number"; i.id = id; i.min = "1"; i.max = "600"; i.step = "1"; i.setAttribute("inputmode", "numeric"); i.autocomplete = "off";
      root.appendChild(l); root.appendChild(i); return i;
    }
    var meuble = field("Plus petite dimension du meuble emballé (cm)", uid + "-m");
    var porte = field("Passage le plus étroit chez vous, porte ou escalier (cm)", uid + "-p");
    var out = el("p", "sv-verdict", "Renseignez les deux mesures pour voir le résultat.");
    out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite");
    root.appendChild(out);
    root.appendChild(el("p", "sv-small", "Résultat indicatif : un meuble long peut aussi se pencher ou se démonter. Gardez 2 cm de marge de chaque côté. Les cotes valables sont celles de la fiche et de votre mètre."));
    function calc() {
      var m = parseFloat(meuble.value), p = parseFloat(porte.value);
      out.classList.remove("is-ok", "is-ko");
      if (!(m > 0) || !(p > 0)) { out.textContent = "Renseignez les deux mesures pour voir le résultat."; return; }
      var marge = p - m;
      if (marge >= 4) { out.classList.add("is-ok"); out.textContent = "Ça devrait passer : il reste environ " + Math.round(marge) + " cm de marge au total."; }
      else if (marge >= 0) { out.classList.add("is-ko"); out.textContent = "Très juste : moins de 4 cm de marge. Vérifiez les poignées, les plinthes et les angles."; }
      else { out.classList.add("is-ko"); out.textContent = "Ne passera pas dans cet état : il manque environ " + Math.round(-marge) + " cm. Écrivez-nous avant de commander."; }
    }
    meuble.addEventListener("input", calc); porte.addEventListener("input", calc);
  }

  // Fiche produit du moteur : rappel de mesurer avant d'acheter (lien vers la page de conseils, rien d'ajouté au panier)
  function fiche() {
    var buy = document.querySelector(".sh-buy, .sh-info");
    if (!buy || document.querySelector(".sv-mesure")) return;
    var p = el("p", "sv-mesure");
    var a = el("a", "", "Mesurer avant de commander : passage et livraison");
    a.href = "/dimensions-livraison";
    p.appendChild(a);
    if (buy.parentNode) buy.parentNode.insertBefore(p, buy.nextSibling);
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-salon-scene]")).forEach(scene);
    Array.prototype.slice.call(document.querySelectorAll("[data-salon-passage]")).forEach(passage);
    fiche();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

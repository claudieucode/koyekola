/* Monture Claire — sélecteur de formes par visage (aperçu visage + monture, ouverture exclusive), note de forme sur la fiche produit, révélation lente.
   Aucune dépendance. L'aperçu est une illustration schématique : rien n'est envoyé ni mémorisé. Sans script, le bloc reste un ensemble de menus « details » avec de vrais liens. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "monture-claire") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  body.classList.add("mc-js");
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function selecteur(root) {
    var stage = root.querySelector("[data-mc-stage]"), status = root.querySelector("[data-mc-status]");
    var dets = all("details[data-visage]", root);
    if (!stage || !dets.length) return;
    var busy = false;

    function paint(det, link) {
      var ic = det.querySelector(".mc-vis-ic svg"), fr = (link || det.querySelector(".mc-fl a")), fi = fr && fr.querySelector(".mc-fi svg");
      if (!ic) return;
      var s = parseFloat(det.getAttribute("data-echelle")) || 0.42;
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("viewBox", "0 0 120 150"); svg.setAttribute("aria-hidden", "true");
      all("*", ic).forEach(function (n) { svg.appendChild(n.cloneNode(true)); });
      if (fi) {
        var g = document.createElementNS(NS, "g");
        g.setAttribute("transform", "translate(" + (60 - 100 * s).toFixed(1) + " " + (72 - 40 * s).toFixed(1) + ") scale(" + s + ")");
        all("*", fi).forEach(function (n) { g.appendChild(n.cloneNode(true)); });
        svg.appendChild(g);
      }
      var old = stage.querySelector("svg");
      if (old) stage.replaceChild(svg, old); else stage.insertBefore(svg, stage.firstChild);
      if (status) status.textContent = "Aperçu : " + det.querySelector(".mc-vis-t b").textContent.toLowerCase() + (fr ? ", monture " + fr.querySelector(".mc-fn").textContent.toLowerCase() + "." : ".");
    }
    dets.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (busy || !d.open) return;
        busy = true; dets.forEach(function (o) { if (o !== d) o.open = false; }); busy = false;
        paint(d);
      });
      all(".mc-fl a", d).forEach(function (a) {
        a.addEventListener("mouseenter", function () { paint(d, a); });
        a.addEventListener("focus", function () { paint(d, a); });
      });
    });
    var start = body.getAttribute("data-pk-visage"), first = dets.filter(function (d) { return d.getAttribute("data-visage") === start; })[0];
    var cur = dets.filter(function (d) { return d.open; })[0];
    if (first && first !== cur) first.open = true; else paint(cur || dets[0]);
  }

  // Fiche produit du moteur : repère de forme tiré des étiquettes réelles du produit. Le lien vers le sélecteur n'est ajouté que si le menu du site le contient.
  var NOTES = {
    ronde: "Forme ronde : une courbe douce, souvent choisie pour adoucir un visage carré ou en cœur.",
    ovale: "Forme ovale : une ligne allongée et légère, qui s'accorde avec beaucoup de visages.",
    carree: "Forme carrée : des angles nets et un volume affirmé, souvent essayée sur un visage rond ou long.",
    rectangulaire: "Forme rectangulaire : une ligne large et basse, qui structure un visage rond.",
    pantos: "Forme pantos : un dessus presque droit et un dessous plein, adaptée à de nombreux visages.",
    aviateur: "Forme aviateur : une goutte fine et fluide, souvent essayée sur un visage carré ou en cœur.",
    papillon: "Forme papillon : un coin extérieur relevé, qui étire le regard."
  };
  function fiche() {
    var metas = all("p.sh-meta"), tagsP = metas.filter(function (p) { return /^\s*Étiquettes\s*:/.test(p.textContent); })[0];
    if (!tagsP || document.querySelector(".mc-fiche-note")) return;
    var tags = tagsP.textContent.replace(/^\s*Étiquettes\s*:/, "").split(",").map(function (t) { return t.trim(); });
    var key = Object.keys(NOTES).filter(function (k) { return tags.indexOf(k) > -1; })[0];
    if (!key) return;
    var p = document.createElement("p"); p.className = "mc-fiche-note"; p.textContent = NOTES[key] + " Un repère esthétique, à confirmer en essayant. ";
    if (document.querySelector('a[href="/formes"]')) { var a = document.createElement("a"); a.href = "/formes"; a.textContent = "Trouver ma forme"; p.appendChild(a); }
    tagsP.parentNode.insertBefore(p, tagsP.nextSibling);
  }

  function reveal() {
    var els = all(".mc-rv");
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  }

  function init() { all("[data-monture-visage]").forEach(selecteur); fiche(); reveal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

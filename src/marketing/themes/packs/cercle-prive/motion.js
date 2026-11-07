/* Cercle Privé — (1) affiche l'état d'une vente seulement à partir des dates posées par le vendeur dans le bloc (data-debut / data-fin, heure UTC) ; sans date valide, le texte
   par défaut reste et rien n'est inventé. Aucune minuterie, aucun délai calculé ni répété : une seule lecture de l'heure au chargement. (2) apparition douce des cartons. Aucune dépendance. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "cercle-prive") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  body.classList.add("cp-js");
  var ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z$/;
  function parse(v) { v = String(v || "").trim(); if (!ISO.test(v)) return null; var d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  function fmt(d) {
    try { return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" }).format(d) + " (UTC)"; }
    catch (e) { return d.toISOString().replace("T", " ").slice(0, 16) + " (UTC)"; }
  }
  function ventes() {
    Array.prototype.slice.call(document.querySelectorAll("[data-cp-vente]")).forEach(function (el) {
      var out = el.querySelector("[data-cp-etat]");
      var a = parse(el.getAttribute("data-debut")), b = parse(el.getAttribute("data-fin"));
      if (!out || (!a && !b)) return;
      var now = new Date(), txt, cls;
      if (a && now < a) { txt = "Cette vente ouvre le " + fmt(a) + (b ? " et se termine le " + fmt(b) + "." : "."); cls = "is-soon"; }
      else if (b && now > b) { txt = "Cette vente est terminée depuis le " + fmt(b) + "."; cls = "is-over"; }
      else { txt = b ? "Vente en cours, jusqu'au " + fmt(b) + "." : "Vente en cours."; cls = "is-open"; }
      out.textContent = txt + " Dates posées par la maison ; la boutique applique elle-même la fenêtre à l'achat."; out.className = "cp-etat " + cls;
    });
  }
  function reveal() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".cp-card"));
    if (reduce || !("IntersectionObserver" in window)) return;
    items.forEach(function (e) { e.classList.add("cp-rv"); });
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    items.forEach(function (e) { io.observe(e); });
  }
  function init() { ventes(); reveal(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

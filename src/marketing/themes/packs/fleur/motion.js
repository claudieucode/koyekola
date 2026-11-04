/* Fleur de sel — fondus lents et zoom très léger. Aucun mouvement brusque ; simplifié si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "fleur") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Hauteur de l'en-tête (menu mobile) et ombre discrète au défilement
  var head = document.querySelector(".fl-head");
  function size() { if (head) b.style.setProperty("--fl-headh", head.offsetHeight + "px"); }
  size(); window.addEventListener("resize", size);
  function scrolled() { if (head) head.classList.toggle("is-scrolled", window.scrollY > 24); }
  scrolled(); window.addEventListener("scroll", scrolled, { passive: true });

  // Fondu lent à l'apparition (contenu visible d'office sans JS ou avec mouvement réduit)
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("fl-js");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 140 + "ms"; io.observe(el); });
  }

  // Très léger glissement de l'illustration du hero (transform seulement, amplitude minime)
  var art = document.querySelector(".fl-hero-art");
  if (art && !reduce && b.getAttribute("data-pk-lent") !== "off") {
    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { tick = false; var y = Math.min(window.scrollY, 900); art.style.translate = "0 " + (y * 0.06).toFixed(1) + "px"; });
    }, { passive: true });
  }

  // Onglets : Déjeuner / Dîner / Carte des vins
  $$(".fl-tabs").forEach(function (tabs) {
    var scope = tabs.closest(".fl-carte") || document;
    var links = $$("a[data-tab]", tabs);
    function show(a, focus) {
      links.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); x.setAttribute("tabindex", on ? "0" : "-1"); });
      $$("[data-panel]", scope).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== a.getAttribute("data-tab"); });
      if (focus) a.focus();
    }
    links.forEach(function (a, i) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); show(a, false); });
      a.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0;
        if (d) { ev.preventDefault(); show(links[(i + d + links.length) % links.length], true); }
      });
    });
    var hash = (location.hash || "").slice(1);
    links.forEach(function (a) { if (a.getAttribute("data-tab") === hash) show(a, false); });
  });

  // Menu mobile : se referme au clic sur un lien ou avec Échap
  $$(".fl-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") $$(".fl-burger[open]").forEach(function (d) { d.open = false; }); });
})();

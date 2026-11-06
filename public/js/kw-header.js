// Entête du site : menu hors-champ (panneau latéral, plein écran, déroulant) et lien actif.
// Ouverture/fermeture au clic, fermeture au clic extérieur et par Échap, focus piégé dans le panneau puis rendu au déclencheur, défilement de la page verrouillé,
// sous-menus ouverts par un bouton (tactile et clavier). Sans JavaScript, le menu principal reste un simple lien (jamais masqué sans le script).
(function () {
  "use strict";
  var heads = document.querySelectorAll("[data-kw-header]");
  if (!heads.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var here = location.pathname.replace(/\/+$/, "") || "/";
  [].forEach.call(document.querySelectorAll(".lp-autohead .kw-menu-link, .lp-oc-nav .kw-menu-link, .lp-site-header .kw-menu-link"), function (a) {
    try { var u = new URL(a.getAttribute("href"), location.href); if (u.origin === location.origin && (u.pathname.replace(/\/+$/, "") || "/") === here) a.setAttribute("aria-current", "page"); } catch (e) { /* adresse non analysable */ }
  });
  [].forEach.call(heads, function (head) {
    var toggle = head.querySelector(".lp-oc-toggle"), panel = head.querySelector(".lp-oc"), back = head.querySelector(".lp-oc-backdrop"), close = head.querySelector(".lp-oc-close");
    if (!toggle || !panel) return;
    var open = false, timer = 0;
    var focusables = function () { return [].slice.call(panel.querySelectorAll("a[href],button:not([disabled])")).filter(function (n) { return n.offsetParent !== null || n === close; }); };
    // Sous-menus : un bouton à côté du lien (aria-expanded)
    [].forEach.call(panel.querySelectorAll(".has-sub"), function (li) {
      var b = document.createElement("button"); b.type = "button"; b.className = "kw-sub-toggle"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-label", "Afficher le sous-menu de " + (li.querySelector(".kw-menu-link") || {}).textContent);
      b.textContent = "▾"; li.insertBefore(b, li.querySelector(".kw-submenu"));
      b.addEventListener("click", function () { var o = li.classList.toggle("is-sub-open"); b.setAttribute("aria-expanded", o ? "true" : "false"); });
    });
    function setOpen(v) {
      if (v === open) return; open = v; clearTimeout(timer);
      toggle.setAttribute("aria-expanded", v ? "true" : "false");
      if (v) {
        panel.hidden = false; void panel.offsetWidth; panel.classList.add("is-open"); if (back) back.classList.add("is-open");
        document.body.classList.add("kw-oc-lock"); (close || panel).focus();
      } else {
        panel.classList.remove("is-open"); if (back) back.classList.remove("is-open"); document.body.classList.remove("kw-oc-lock");
        timer = setTimeout(function () { if (!open) panel.hidden = true; }, reduce ? 0 : 320); toggle.focus();
      }
    }
    toggle.addEventListener("click", function () { setOpen(!open); });
    if (close) close.addEventListener("click", function () { setOpen(false); });
    if (back) back.addEventListener("click", function () { setOpen(false); });
    panel.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest("a[href]"); if (a && !a.parentNode.classList.contains("has-sub")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key !== "Tab") return;
      var f = focusables(); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // Un redimensionnement vers un appareil où le panneau n'existe plus le referme (jamais de page verrouillée)
    window.addEventListener("resize", function () { if (open && getComputedStyle(toggle).display === "none") setOpen(false); });
  });
})();

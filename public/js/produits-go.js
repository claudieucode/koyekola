// Widget « Produits GO » : un clic sur une miniature affiche la photo en grand dans la même carte (aucune sortie du site). Délégation : une seule écoute par page.
(function () {
  if (window.__kwPgo) return;
  window.__kwPgo = true;
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest ? e.target.closest(".kw-pgo-thumb") : null;
    if (!b) return;
    var card = b.closest(".kw-pgo-card"), img = card && card.querySelector(".kw-pgo-img"), src = b.getAttribute("data-kw-pgo-src");
    if (!img || !src || !/^https:\/\//.test(src)) return;
    img.src = src;
    card.querySelectorAll(".kw-pgo-thumb").forEach(function (t) { t.setAttribute("aria-pressed", t === b ? "true" : "false"); });
  });
})();

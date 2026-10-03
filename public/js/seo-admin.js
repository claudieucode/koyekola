// Administration SEO : compteurs de caractères, aperçu Google en direct, aperçu de l'image choisie.
(() => {
  document.querySelectorAll("[data-seo-count]").forEach((span) => {
    const el = document.getElementById(span.dataset.seoCount);
    if (!el) return;
    const max = Number(span.dataset.max);
    const update = () => { const n = el.value.length; span.textContent = `${n} / ${max}`; span.classList.toggle("is-over", n > max); };
    el.addEventListener("input", update);
    update();
  });
  document.querySelectorAll("[data-seo-image]").forEach((sel) => {
    const img = sel.parentElement.querySelector("[data-seo-image-preview]");
    sel.addEventListener("change", () => { if (sel.value) { img.src = sel.value; img.hidden = false; } else img.hidden = true; });
  });
  // Aperçu Google : la valeur saisie, sinon celle actuellement publiée
  const serp = document.querySelector("[data-seo-serp]");
  if (serp) {
    const titleIn = document.querySelector('[data-seo-field="seo_title"]');
    const descIn = document.querySelector('[data-seo-field="seo_description"]');
    const cut = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trim()}…` : t);
    const update = () => {
      const t = titleIn && titleIn.value.trim() ? `${titleIn.value.trim()} · ${serp.dataset.site}` : serp.dataset.title;
      serp.querySelector("[data-serp-title]").textContent = cut(t, 62);
      serp.querySelector("[data-serp-desc]").textContent = cut(descIn && descIn.value.trim() ? descIn.value.trim() : serp.dataset.description, 158);
    };
    [titleIn, descIn].forEach((el) => el && el.addEventListener("input", update));
  }
})();

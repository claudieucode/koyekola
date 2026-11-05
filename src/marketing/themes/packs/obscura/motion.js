/* Obscura — fondus lents, filtres de la planche, échelle de mur et visionneuse plein écran (clavier, glissement, précharge locale). */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "obscura") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var on = function (el, ev, fn) { el.addEventListener(ev, fn); };

  // Apparition par fondu
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("ob-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  // Index : se referme au clic sur un lien et avec Échap
  $$(".ob-idx").forEach(function (d) {
    $$("a", d).forEach(function (a) { on(a, "click", function () { d.open = false; }); });
    on(document, "keydown", function (e) { if (e.key === "Escape" && d.open) { d.open = false; var s = d.querySelector("summary"); if (s) s.focus(); } });
  });

  // Flèche « descendre »
  $$("[data-cue]").forEach(function (a) { on(a, "click", function (e) { e.preventDefault(); var h = a.closest(".ob-hero"); window.scrollTo({ top: h ? h.offsetHeight : window.innerHeight, behavior: reduce ? "auto" : "smooth" }); }); });

  // Filtres de la planche-contact (le fragment d'adresse choisit le genre : /portfolio#portraits)
  $$(".ob-folio").forEach(function (box) {
    var links = $$("[data-filter]", box), items = $$(".ob-mason-i", box), count = box.querySelector("[data-count]");
    function apply(k) {
      var n = 0; links.forEach(function (a) { var x = a.getAttribute("data-filter") === k; a.classList.toggle("is-on", x); if (x) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      items.forEach(function (it) { var show = k === "tout" || it.getAttribute("data-genre") === k; it.hidden = !show; if (show) n++; });
      if (count) count.textContent = n + (n > 1 ? " images" : " image");
    }
    links.forEach(function (a) { on(a, "click", function (e) { e.preventDefault(); apply(a.getAttribute("data-filter")); }); });
    var h = (location.hash || "").slice(1); if (h && links.some(function (a) { return a.getAttribute("data-filter") === h; })) apply(h);
  });

  // Échelle d'un tirage sur un mur de 2,60 m
  $$("[data-scale]").forEach(function (box) {
    var frame = box.querySelector("[data-frame]"), out = box.querySelector("[data-readout]"), links = $$("[data-w]", box);
    function set(a) {
      var w = +a.getAttribute("data-w"), h = +a.getAttribute("data-h"), d = Math.round(Math.sqrt(w * w + h * h) * 1.5 / 10) / 10;
      links.forEach(function (x) { x.classList.toggle("is-on", x === a); if (x === a) x.setAttribute("aria-current", "true"); else x.removeAttribute("aria-current"); });
      if (frame) { frame.style.setProperty("--sx", (w / 75).toFixed(3)); frame.style.setProperty("--sy", (h / 100).toFixed(3)); }
      if (out) out.textContent = "Format " + w + " × " + h + " cm · à regarder depuis " + String(d).replace(".", ",") + " m environ.";
    }
    links.forEach(function (a) { on(a, "click", function (e) { e.preventDefault(); set(a); }); });
    var cur = box.querySelector("[data-w].is-on"); if (cur) set(cur);
  });

  // ---------- Visionneuse plein écran ----------
  var lb, slide, cntEl, tEl, mEl, cEl, items = [], idx = 0, opener = null, cache = {};
  var ARW = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function build() {
    lb = document.createElement("div"); lb.className = "ob-lb"; lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Visionneuse plein écran");
    lb.innerHTML = '<div class="ob-lb-top"><span class="ob-lb-count"></span><button type="button" class="ob-lb-x" aria-label="Fermer la visionneuse">Fermer</button></div>' +
      '<div class="ob-lb-stage"><button type="button" class="ob-lb-nav ob-lb-prev" aria-label="Image précédente">' + ARW("M15 4 7 12l8 8") + '</button><div class="ob-lb-slide"></div><button type="button" class="ob-lb-nav ob-lb-next" aria-label="Image suivante">' + ARW("M9 4l8 8-8 8") + '</button></div>' +
      '<div class="ob-lb-cap" aria-live="polite"><span class="ob-lb-t"></span><span class="ob-lb-m"></span><p class="ob-lb-c"></p></div><span class="ob-lb-hint">← → naviguer · Début / Fin · Échap fermer</span>';
    document.body.appendChild(lb);
    slide = lb.querySelector(".ob-lb-slide"); cntEl = lb.querySelector(".ob-lb-count"); tEl = lb.querySelector(".ob-lb-t"); mEl = lb.querySelector(".ob-lb-m"); cEl = lb.querySelector(".ob-lb-c");
    on(lb.querySelector(".ob-lb-x"), "click", close); on(lb.querySelector(".ob-lb-prev"), "click", function () { go(-1); }); on(lb.querySelector(".ob-lb-next"), "click", function () { go(1); });
    var st = lb.querySelector(".ob-lb-stage");
    on(st, "click", function (e) { if (e.target === st || e.target === slide || e.target.classList.contains("ob-lb-img")) close(); });
    on(document, "keydown", key);
    // glissement tactile / souris : horizontal = image suivante ou précédente, vers le bas = fermer
    var x0 = 0, y0 = 0, dx = 0, dy = 0, drag = false;
    on(st, "pointerdown", function (e) { if (e.target.closest(".ob-lb-nav")) return; drag = true; x0 = e.clientX; y0 = e.clientY; dx = dy = 0; });
    on(st, "pointermove", function (e) { if (!drag) return; dx = e.clientX - x0; dy = e.clientY - y0; if (Math.abs(dx) > Math.abs(dy)) slide.style.transform = "translateX(" + dx * 0.6 + "px)"; });
    function end() { if (!drag) return; drag = false; slide.style.transform = ""; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1); else if (dy > 90 && Math.abs(dx) < 40) close(); }
    on(st, "pointerup", end); on(st, "pointercancel", end);
  }
  function make(i) { // construit (ou réutilise) la diapositive i : tout est déjà dans la page, aucun réseau
    if (cache[i]) return cache[i];
    var a = items[i], src = a.querySelector(".ob-ph"), w = document.createElement("div"); w.className = "ob-lb-img"; w.style.setProperty("--r", a.getAttribute("data-r") || "1.5");
    if (src) w.appendChild(src.cloneNode(true)); return (cache[i] = w);
  }
  function show(i, dir) {
    idx = (i + items.length) % items.length; var a = items[idx], w = make(idx), old = slide.querySelector(".ob-lb-img:not(.is-out)");
    if (old && old !== w) { old.classList.add("is-out"); if (!reduce) old.style.transform = "translateX(" + (-dir * 40) + "px)"; setTimeout(function () { if (old.parentNode && old !== w && old.classList.contains("is-out")) old.parentNode.removeChild(old); }, reduce ? 0 : 480); }
    if (!w.parentNode) { w.classList.add("is-pre"); if (!reduce) w.style.transform = "translateX(" + dir * 40 + "px)"; slide.appendChild(w); void w.offsetWidth; }
    w.classList.remove("is-out", "is-pre"); w.style.transform = "";
    cntEl.textContent = pad(idx + 1) + " / " + pad(items.length); tEl.textContent = a.getAttribute("data-title") || ""; mEl.textContent = a.getAttribute("data-meta") || ""; cEl.textContent = a.getAttribute("data-cap") || "";
    lb.setAttribute("aria-label", "Visionneuse : image " + (idx + 1) + " sur " + items.length);
    make((idx + 1) % items.length); make((idx - 1 + items.length) % items.length); // précharge des voisines
  }
  function go(d) { if (items.length > 1) show(idx + d, d); }
  function open(a) {
    var root = a.closest("[data-lbset]"), name = root && root.getAttribute("data-lbset");
    items = $$(name ? '[data-lbset="' + name + '"] [data-lb]' : "[data-lb]").filter(function (x) { return !x.closest("[hidden]"); });
    if (!items.length) return; if (!lb) build(); cache = {}; slide.innerHTML = ""; opener = a; lb.hidden = false; b.classList.add("ob-lock");
    show(Math.max(0, items.indexOf(a)), 1); lb.querySelector(".ob-lb-x").focus();
  }
  function close() { if (!lb || lb.hidden) return; lb.hidden = true; b.classList.remove("ob-lock"); slide.innerHTML = ""; cache = {}; if (opener) opener.focus(); }
  function key(e) {
    if (!lb || lb.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); } else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); show(0, -1); } else if (e.key === "End") { e.preventDefault(); show(items.length - 1, 1); }
    else if (e.key === "Tab") { var f = $$("button", lb), i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus(); }
  }
  $$("[data-lb]").forEach(function (a) { on(a, "click", function (e) { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(a); }); });
})();

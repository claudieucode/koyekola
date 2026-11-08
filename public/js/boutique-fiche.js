// Fiche produit : galerie (miniatures, zoom plein écran au clavier et au toucher, carrousel) et choix des variantes (prix, image et disponibilité affichés).
// Amélioration progressive : sans JavaScript, la galerie montre les images et le formulaire garde sa liste déroulante de variantes. Le serveur reste seul juge à l'ajout au panier.
(function () {
  "use strict";
  if (window.__kwFicheBound) return;
  window.__kwFicheBound = true;

  // ── Galerie ─────────────────────────────────────────────────────────────────────────────
  function setMain(gal, src) {
    var main = gal.querySelector("[data-kw-main]");
    if (main && src) main.src = src;
    gal.querySelectorAll("[data-kw-thumb]").forEach(function (t) { t.setAttribute("aria-pressed", t.getAttribute("data-kw-thumb") === src ? "true" : "false"); });
  }
  var box = null, boxImg = null, list = [], idx = 0, lastFocus = null;
  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.className = "kw-pgal-box"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Image agrandie");
    box.innerHTML = '<button type="button" class="kw-pgal-x" aria-label="Fermer">×</button><button type="button" class="kw-pgal-bp" aria-label="Image précédente">‹</button><img alt=""><button type="button" class="kw-pgal-bn" aria-label="Image suivante">›</button>';
    document.body.appendChild(box);
    boxImg = box.querySelector("img");
    box.addEventListener("click", function (e) {
      if (e.target.closest(".kw-pgal-x") || e.target === box) close();
      else if (e.target.closest(".kw-pgal-bp")) step(-1);
      else if (e.target.closest(".kw-pgal-bn")) step(1);
    });
  }
  function show() { boxImg.src = list[idx]; box.querySelector(".kw-pgal-bp").hidden = box.querySelector(".kw-pgal-bn").hidden = list.length < 2; }
  function step(d) { idx = (idx + d + list.length) % list.length; show(); }
  function open(gal, src) {
    ensureBox();
    var urls = [];
    gal.querySelectorAll("[data-kw-thumb], .kw-pgal-slide img, .kw-pgal-list img.kw-pgal-img").forEach(function (el) { var u = el.getAttribute("data-kw-thumb") || el.getAttribute("src"); if (u && urls.indexOf(u) < 0) urls.push(u); });
    if (!urls.length && src) urls.push(src);
    list = urls; idx = Math.max(0, urls.indexOf(src));
    lastFocus = document.activeElement; show(); box.hidden = false; document.documentElement.classList.add("kw-pgal-lock");
    box.querySelector(".kw-pgal-x").focus();
  }
  function close() { if (!box || box.hidden) return; box.hidden = true; document.documentElement.classList.remove("kw-pgal-lock"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.addEventListener("keydown", function (e) {
    if (!box || box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "Tab") { var f = box.querySelectorAll("button:not([hidden])"); if (!f.length) return; var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-kw-thumb]");
    var gal = e.target.closest && e.target.closest("[data-kw-gallery]");
    if (t && gal) { setMain(gal, t.getAttribute("data-kw-thumb")); return; }
    var o = e.target.closest && e.target.closest("[data-kw-open]");
    if (o && gal) { var main = gal.querySelector("[data-kw-main]"); var src = o.getAttribute("data-kw-open") || (main && main.getAttribute("src")); open(gal, src); return; }
    var nx = e.target.closest && e.target.closest("[data-kw-next],[data-kw-prev]");
    if (nx && gal) { var tr = gal.querySelector(".kw-pgal-track"); if (tr) tr.scrollBy({ left: (nx.hasAttribute("data-kw-next") ? 1 : -1) * tr.clientWidth, behavior: "smooth" }); }
  });
  // Image de la variante choisie : on montre la miniature correspondante, ou on remplace l'image principale
  document.addEventListener("kw:variant", function (e) {
    var img = e.detail && e.detail.image; if (!img) return;
    document.querySelectorAll("[data-kw-gallery]").forEach(function (g) {
      var th = g.querySelector('[data-kw-thumb="' + String(img).replace(/"/g, '\\"') + '"]');
      if (th) { setMain(g, img); return; }
      var m = g.querySelector("[data-kw-main]"); if (m) m.src = img;
    });
  });

  // ── Variantes ───────────────────────────────────────────────────────────────────────────
  function initBuy(sec) {
    var jsonEl = sec.querySelector("[data-kw-variants]"), form = sec.querySelector("form[data-sh-add]");
    if (!jsonEl || !form) return;
    var vars; try { vars = JSON.parse(jsonEl.textContent || "[]"); } catch (_) { return; }
    if (!vars.length) return;
    var holder = sec.querySelector("[data-kw-opts]"), nativeLabel = sec.querySelector("[data-kw-varselect]"), nativeSel = form.querySelector('select[name="variant_id"]');
    var names = Object.keys(vars[0].options || {});
    if (!names.length || !holder || !nativeSel) return;
    var style = sec.getAttribute("data-style") || "select";
    var values = {}; names.forEach(function (n) { values[n] = []; vars.forEach(function (v) { var x = v.options[n]; if (x != null && values[n].indexOf(x) < 0) values[n].push(x); }); });
    var sel = {};
    var priceEl = sec.querySelector("[data-kw-price]"), nowEl = sec.querySelector("[data-kw-now]"), oldEl = sec.querySelector("[data-kw-old]"), fromEl = sec.querySelector("[data-kw-from]"), stockEl = sec.querySelector("[data-kw-stock]");
    var basePrice = nowEl ? nowEl.textContent : "", baseOld = oldEl ? oldEl.textContent : "", baseOldHidden = oldEl ? oldEl.hidden : true, baseFrom = fromEl ? fromEl.textContent : "";
    var msg = sec.querySelector("[data-sh-msg]");
    function matching(extra) { return vars.filter(function (v) { return names.every(function (n) { var want = extra && n in extra ? extra[n] : sel[n]; return want == null || v.options[n] === want; }); }); }
    function build() {
      holder.innerHTML = "";
      names.forEach(function (n, i) {
        var id = "kwv-" + Math.random().toString(36).slice(2, 7);
        if (style === "select") {
          var lab = document.createElement("label"); lab.className = "kw-pb-var"; lab.innerHTML = '<span class="kw-pb-lbl"></span>'; lab.firstChild.textContent = n;
          var s = document.createElement("select"); s.setAttribute("data-kw-attr", n);
          s.innerHTML = "<option value=''>Choisir…</option>"; values[n].forEach(function (val) { var o = document.createElement("option"); o.value = val; o.textContent = val; s.appendChild(o); });
          lab.appendChild(s); holder.appendChild(lab);
        } else {
          var fs = document.createElement("fieldset"); fs.className = "kw-pb-fs kw-pb-fs--" + style; var lg = document.createElement("legend"); lg.className = "kw-pb-lbl"; lg.textContent = n; fs.appendChild(lg);
          var row = document.createElement("div"); row.className = "kw-pb-choices";
          values[n].forEach(function (val, j) {
            var l = document.createElement("label"); l.className = "kw-pb-choice"; var r = document.createElement("input"); r.type = "radio"; r.name = id; r.value = val; r.setAttribute("data-kw-attr", n);
            var sp = document.createElement("span"); sp.textContent = val;
            if (style === "swatches" && window.CSS && CSS.supports("color", val)) l.style.setProperty("--kw-sw", val);
            l.appendChild(r); l.appendChild(sp); row.appendChild(l);
          });
          fs.appendChild(row); holder.appendChild(fs);
        }
      });
      holder.hidden = false; if (nativeLabel) nativeLabel.hidden = true; nativeSel.required = false;
    }
    function refresh() {
      // Disponibilité : une valeur est proposée si une variante en stock existe avec la sélection actuelle des AUTRES options
      holder.querySelectorAll("[data-kw-attr]").forEach(function (el) {
        var n = el.getAttribute("data-kw-attr");
        if (el.tagName === "SELECT") {
          Array.prototype.forEach.call(el.options, function (o) { if (!o.value) return; var ex = {}; ex[n] = o.value; var ok = matching(ex).some(function (v) { return !v.out; }); o.disabled = !ok; });
          el.value = sel[n] || "";
        } else {
          var ex = {}; ex[n] = el.value; var ok = matching(ex).some(function (v) { return !v.out; });
          el.disabled = !ok; el.parentNode.classList.toggle("is-out", !ok); el.checked = sel[n] === el.value;
          el.parentNode.classList.toggle("is-on", sel[n] === el.value);
        }
      });
      var m = matching(); var chosen = names.every(function (n) { return sel[n] != null; }) && m.length === 1 ? m[0] : null;
      nativeSel.value = chosen && !chosen.out ? String(chosen.id) : "";
      if (nowEl) {
        if (chosen) { nowEl.textContent = chosen.price; if (fromEl) fromEl.textContent = ""; if (oldEl) { oldEl.textContent = chosen.regular; oldEl.hidden = !chosen.regular; } }
        else { nowEl.textContent = basePrice; if (fromEl) fromEl.textContent = baseFrom; if (oldEl) { oldEl.textContent = baseOld; oldEl.hidden = baseOldHidden; } }
      }
      if (stockEl) stockEl.textContent = !chosen ? "En stock" : chosen.out ? "Rupture de stock" : chosen.low ? "Stock faible" : "En stock";
      if (chosen && chosen.image) document.dispatchEvent(new CustomEvent("kw:variant", { detail: { image: chosen.image } }));
      form.querySelectorAll("button[type=submit]").forEach(function (b) { b.setAttribute("aria-disabled", chosen && !chosen.out ? "false" : "true"); });
    }
    build();
    holder.addEventListener("change", function (e) { var el = e.target; var n = el.getAttribute && el.getAttribute("data-kw-attr"); if (!n) return; sel[n] = el.value || null; if (msg) msg.textContent = ""; refresh(); });
    // Sans variante complète et disponible : on n'envoie rien, on explique (le serveur refuserait de toute façon)
    form.addEventListener("submit", function (e) {
      if (!nativeSel.value) { e.preventDefault(); e.stopImmediatePropagation(); if (msg) msg.textContent = "Choisissez " + (names.length > 1 ? "toutes les options" : "une option") + " disponibles avant d'ajouter ce produit."; }
    }, true);
    refresh();
  }
  function boot() { document.querySelectorAll("[data-kw-shopbuy]").forEach(initBuy); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

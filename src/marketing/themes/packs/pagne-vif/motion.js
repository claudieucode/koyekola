/* Pagne Vif — (1) métreur : repères de métrage d'un projet ; (2) fiche produit : sélecteur de mètres avec total en direct, et nuancier construit à partir des variantes réelles.
   Rien n'est envoyé ni stocké : le champ « quantity » et la liste « variant_id » restent ceux du moteur de boutique, qui revérifie prix, stock et quantité (entier de 1 à 99) à l'ajout au panier.
   Sans ce script, tout reste utilisable (le champ Quantité et la liste des variantes d'origine). Aucune dépendance. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "pagne-vif") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) document.body.classList.add("pk-calme"); // respecte « moins d'animations » : le CSS du thème coupe aussi ses animations
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  body.classList.add("pv-js");

  /* ---------- (1) Métreur ---------- */
  all("[data-pv-metreur]").forEach(function (box) {
    var items = all("li[data-m]", box);
    if (!items.length) return;
    var list = box.querySelector("ul"), out = el("div", "pv-res"), num = el("p", "pv-resn"), rule = el("div", "pv-rule"), tip = el("p", "pv-small");
    var chips = el("div", "pv-chips"), cur = 0, m = 0;
    chips.setAttribute("role", "group"); chips.setAttribute("aria-label", "Projet");
    num.setAttribute("role", "status"); num.setAttribute("aria-live", "polite");
    var buttons = items.map(function (li, i) {
      var b = el("button", "pv-chip", li.querySelector("b").textContent); b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { cur = i; m = parseInt(li.getAttribute("data-m"), 10) || 1; draw(); });
      chips.appendChild(b); return b;
    });
    var step = el("div", "pv-stepper"), minus = el("button", "pv-sb", "−"), plus = el("button", "pv-sb", "+");
    minus.type = plus.type = "button"; minus.setAttribute("aria-label", "Un mètre de moins"); plus.setAttribute("aria-label", "Un mètre de plus");
    minus.addEventListener("click", function () { m = Math.max(1, m - 1); draw(); }); plus.addEventListener("click", function () { m = Math.min(99, m + 1); draw(); });
    step.appendChild(minus); step.appendChild(num); step.appendChild(plus);
    function draw() {
      buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", i === cur && m > 0 ? "true" : "false"); });
      num.textContent = m + (m > 1 ? " mètres" : " mètre");
      rule.textContent = "";
      for (var i = 0; i < Math.min(m, 12); i++) rule.appendChild(el("i"));
      tip.textContent = m > 12 ? "Au-delà de 12 mètres, la règle est tronquée à l'écran." : "Un carreau = un mètre entier.";
    }
    out.appendChild(step); out.appendChild(rule); out.appendChild(tip);
    list.hidden = true;
    box.insertBefore(chips, list); box.insertBefore(out, list);
    m = parseInt(items[0].getAttribute("data-m"), 10) || 1; draw();
  });

  /* ---------- (2) Fiche produit ---------- */
  var form = document.querySelector("form[data-sh-add]");
  if (!form) return;
  var qty = form.querySelector('input[name="quantity"]');
  var priceEl = document.querySelector(".sh-price-lg strong") || document.querySelector(".sh-price strong");
  var meta = all(".sh-meta").map(function (p) { return p.textContent; }).join(" ");
  var hasTag = function (t) { return new RegExp("(^|[\\s,:])" + t + "(,|\\s|$)").test(meta); };
  var unit = hasTag("au-metre") ? "m" : hasTag("coupon-6-yards") ? "c" : "";
  var from = !!document.querySelector(".sh-price-lg") && /à partir de/i.test((document.querySelector(".sh-price-lg") || {}).textContent || "");
  var norm = function (s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

  // Nuancier : une pastille par variante réelle ; la liste d'origine reste en place et se met à jour avec elle
  var sel = form.querySelector('select[name="variant_id"]');
  if (sel) {
    var wrapN = el("div", "pv-nuancier"), lg = el("p", "pv-nl", "Coloris"), row = el("div", "pv-nrow"), pills = [];
    row.setAttribute("role", "group"); row.setAttribute("aria-label", "Choisir un coloris");
    all("option", sel).forEach(function (o, i) {
      if (!o.value) return;
      var nm = o.textContent.replace(/\s*—\s*rupture\s*$/, ""), key = norm(nm.split("/").pop().trim());
      var b = el("button", "pv-pill"); b.type = "button";
      var sw = el("i", "pv-pw"); sw.setAttribute("data-c", /indigo|carmin|soleil|foret|hibiscus|terre/.test(key) ? key.match(/indigo|carmin|soleil|foret|hibiscus|terre/)[0] : "n" + (i % 4));
      b.appendChild(sw); b.appendChild(el("span", "", nm + (o.disabled ? " (rupture)" : "")));
      b.setAttribute("aria-pressed", "false"); if (o.disabled) b.disabled = true;
      b.addEventListener("click", function () { sel.value = o.value; sel.dispatchEvent(new Event("change", { bubbles: true })); sync(); });
      row.appendChild(b); pills.push([b, o]);
    });
    var sync = function () { pills.forEach(function (p) { p[0].setAttribute("aria-pressed", sel.value === p[1].value ? "true" : "false"); }); };
    sel.addEventListener("change", sync);
    if (pills.length) { wrapN.appendChild(lg); wrapN.appendChild(row); var lab = sel.closest("label") || sel; lab.parentNode.insertBefore(wrapN, lab); }
  }

  if (!qty || !unit) return;
  var lbl = qty.closest("label"), first = lbl && lbl.firstChild;
  if (first && first.nodeType === 3) first.nodeValue = unit === "m" ? "Mètres" : "Coupons de 6 yards";
  var box = el("span", "pv-qbox"), mi = el("button", "pv-sb", "−"), pl = el("button", "pv-sb", "+");
  mi.type = pl.type = "button"; mi.setAttribute("aria-label", "Un de moins"); pl.setAttribute("aria-label", "Un de plus");
  qty.parentNode.insertBefore(box, qty); box.appendChild(mi); box.appendChild(qty); box.appendChild(pl);
  var min = parseInt(qty.min, 10) || 1, max = parseInt(qty.max, 10) || 99;
  var nudge = function (d) { var v = parseInt(qty.value, 10); if (isNaN(v)) v = min; qty.value = Math.max(min, Math.min(max, v + d)); calc(); };
  mi.addEventListener("click", function () { nudge(-1); }); pl.addEventListener("click", function () { nudge(1); });
  if (unit === "m") {
    var presets = el("span", "pv-presets"); presets.setAttribute("role", "group"); presets.setAttribute("aria-label", "Longueurs courantes");
    [1, 2, 3, 5, 6].forEach(function (n) { var b = el("button", "pv-pre", n + " m"); b.type = "button"; b.addEventListener("click", function () { qty.value = n; calc(); }); presets.appendChild(b); });
    box.parentNode.insertBefore(presets, box.nextSibling);
  }
  var total = el("p", "pv-total"); total.setAttribute("role", "status"); total.setAttribute("aria-live", "polite");
  var btn = form.querySelector('button[type="submit"]'), bar = el("div", "pv-bar2");
  if (btn) { btn.parentNode.insertBefore(bar, btn); bar.appendChild(total); bar.appendChild(btn); } else form.appendChild(total);

  // « 12,50 € » ou « 5 000 F CFA » : on lit le nombre affiché, on garde le reste du texte (devise, espaces) tel quel
  function parse(txt) {
    var m = String(txt).match(/\d(?:[\d\s  ]*\d)?(?:[.,]\d+)?/);
    if (!m) return null;
    var raw = m[0].replace(/[\s  ]/g, ""), dec = (raw.split(/[.,]/)[1] || "").length;
    var n = parseFloat(raw.replace(",", "."));
    return isNaN(n) ? null : { whole: Math.round(n * Math.pow(10, dec)), dec: dec, raw: m[0], txt: String(txt) };
  }
  function fmt(p, q) {
    var tot = (p.whole * q) / Math.pow(10, p.dec);
    var s = tot.toLocaleString(document.documentElement.lang || "fr-FR", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec });
    if (/\.\d+$/.test(p.raw)) s = s.replace(",", ".");
    return p.txt.replace(p.raw, s);
  }
  function calc() {
    var p = priceEl ? parse(priceEl.textContent) : null, q = parseInt(qty.value, 10);
    if (!p || isNaN(q) || q < min || q > max || String(q) !== String(qty.value).trim()) { total.textContent = priceEl ? "Indiquez un nombre entier entre " + min + " et " + max + "." : ""; return; }
    var u = unit === "m" ? (q > 1 ? " mètres" : " mètre") : (q > 1 ? " coupons" : " coupon");
    total.textContent = "";
    var a = el("span", "pv-tl", (from ? "À partir de " : "") + q + u + " × " + priceEl.textContent.trim() + (unit === "m" ? " le mètre" : "") + " = "), b = el("strong", "pv-tt", fmt(p, q));
    total.appendChild(a); total.appendChild(b);
    if (from) total.appendChild(el("small", "", "Le prix exact dépend du coloris : le panier le confirme."));
  }
  qty.addEventListener("input", calc); qty.addEventListener("change", calc); calc();
})();

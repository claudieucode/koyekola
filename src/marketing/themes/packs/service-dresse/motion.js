/* Service Dressé — composeur de service avec total en direct.
   Le script LIT les cartes produit réelles de la page (widget « grille de produits » : nom, catégorie, prix affiché, identifiant) et calcule  pièces par convive × convives × prix affiché.
   Il n'écrit aucun prix. Le total est indicatif : le moteur recalcule prix, stock et quantité (entier de 1 à 99) à chaque ajout.
   Le bouton « Ajouter au panier » envoie, une demande par ligne, le même appel que le bouton d'une carte produit (POST /boutique/panier/ajouter). Rien n'est stocké.
   Sans ce script la page reste un catalogue normal : chaque carte garde son lien et son bouton. Aucune dépendance. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "service-dresse") return;
  var box = document.querySelector("[data-sd-composer]");
  if (!box) return;
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var MAXQ = 99, MAXG = 24, MAXL = 12;
  var fixedCats = (box.getAttribute("data-sd-fixed") || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);

  // « 12,50 € » ou « 5 000 F CFA » : on lit le nombre affiché, on garde le reste du texte (devise, espaces) tel quel
  function parse(txt) {
    var m = String(txt).match(/\d(?:[\d\s  ]*\d)?(?:[.,]\d+)?/);
    if (!m) return null;
    var raw = m[0].replace(/[\s  ]/g, ""), dec = (raw.split(/[.,]/)[1] || "").length, n = parseFloat(raw.replace(",", "."));
    return isNaN(n) ? null : { value: n, dec: dec, raw: m[0], txt: String(txt).trim() };
  }
  function money(tpl, amount) {
    var s = amount.toLocaleString(document.documentElement.lang || "fr-FR", { minimumFractionDigits: tpl.dec, maximumFractionDigits: tpl.dec });
    if (/\.\d+$/.test(tpl.raw)) s = s.replace(",", ".");
    return tpl.txt.replace(tpl.raw, s);
  }

  // Lecture des cartes (une ligne par produit ; un produit présent dans deux grilles n'est compté qu'une fois)
  var seen = {}, lines = [];
  all(".kw-pg-card").forEach(function (card) {
    var link = card.querySelector("a.kw-pg-link"), nameEl = card.querySelector(".kw-pg-name"), priceBox = card.querySelector(".kw-pg-price"), strong = priceBox && priceBox.querySelector("strong");
    if (!link || !nameEl || !strong) return;
    var href = link.getAttribute("href");
    if (seen[href]) return;
    seen[href] = true;
    var price = parse(strong.textContent);
    if (!price) return;
    var catEl = card.querySelector(".kw-pg-cat"), cat = catEl ? catEl.textContent.trim() : "Autres pièces";
    var pid = card.querySelector('form[data-sh-add] input[name="product_id"]');
    lines.push({
      name: nameEl.textContent.trim(), cat: cat, href: href, price: price, out: card.classList.contains("kw-pg-card--out"), variable: /à partir de/i.test(priceBox.textContent),
      pid: pid ? pid.value : "", fixed: fixedCats.indexOf(cat.toLowerCase()) >= 0, q: 0, status: null, row: null,
    });
  });
  var ui = box.querySelector("[data-sd-box]");
  if (!ui || !lines.length) return;
  body.classList.add("sd-js");

  var guests = 6;
  var gWrap = box.querySelector("[data-sd-guests]"), lWrap = box.querySelector("[data-sd-lines]"), sWrap = box.querySelector("[data-sd-sum]");

  // Convives
  var gLab = el("span", "sd-gl", "Convives"), gMinus = el("button", "sd-sb", "−"), gPlus = el("button", "sd-sb", "+"), gNum = el("span", "sd-gn");
  gMinus.type = gPlus.type = "button"; gMinus.setAttribute("aria-label", "Un convive de moins"); gPlus.setAttribute("aria-label", "Un convive de plus");
  gNum.setAttribute("role", "status"); gNum.setAttribute("aria-live", "polite");
  var gRow = el("div", "sd-gstep"); gRow.setAttribute("role", "group"); gRow.setAttribute("aria-label", "Nombre de convives");
  gRow.appendChild(gMinus); gRow.appendChild(gNum); gRow.appendChild(gPlus);
  var dots = el("div", "sd-dots"); dots.setAttribute("aria-hidden", "true");
  gWrap.appendChild(gLab); gWrap.appendChild(gRow); gWrap.appendChild(dots);
  gMinus.addEventListener("click", function () { guests = Math.max(1, guests - 1); update(); });
  gPlus.addEventListener("click", function () { guests = Math.min(MAXG, guests + 1); update(); });

  // Lignes, regroupées par catégorie dans l'ordre de la page
  var groups = [], byCat = {};
  lines.forEach(function (l) { if (!byCat[l.cat]) { byCat[l.cat] = { name: l.cat, fixed: l.fixed, items: [] }; groups.push(byCat[l.cat]); } byCat[l.cat].items.push(l); });
  groups.forEach(function (g) {
    var sec = el("section", "sd-grp"), h = el("h3", "sd-gh", g.name), hint = el("span", "sd-gm", g.fixed ? "en tout" : "par convive");
    h.appendChild(hint); sec.appendChild(h);
    g.items.forEach(function (l) {
      var row = el("div", "sd-row"), nm = el("a", "sd-rn", l.name), pr = el("span", "sd-rp", (l.variable ? "à partir de " : "") + l.price.txt.replace(/^à partir de\s*/i, ""));
      nm.href = l.href;
      var st = el("span", "sd-rs"); st.setAttribute("role", "status");
      l.statusEl = st; l.row = row;
      row.appendChild(nm); row.appendChild(pr);
      if (l.out) { row.appendChild(el("span", "sd-ro", "Rupture de stock")); row.classList.add("sd-row--out"); }
      else {
        var m = el("button", "sd-sb", "−"), p = el("button", "sd-sb", "+"), n = el("span", "sd-qn", "0"), grp = el("span", "sd-qs");
        m.type = p.type = "button"; m.setAttribute("aria-label", "Une pièce de moins : " + l.name); p.setAttribute("aria-label", "Une pièce de plus : " + l.name);
        grp.setAttribute("role", "group"); grp.setAttribute("aria-label", l.name + (g.fixed ? ", pièces en tout" : ", pièces par convive"));
        grp.appendChild(m); grp.appendChild(n); grp.appendChild(p); row.appendChild(grp);
        m.addEventListener("click", function () { l.q = Math.max(0, l.q - 1); update(); });
        p.addEventListener("click", function () { l.q = Math.min(MAXL, l.q + 1); update(); });
        l.numEl = n;
      }
      row.appendChild(st); sec.appendChild(row);
    });
    lWrap.appendChild(sec);
  });

  // Récapitulatif et ajout au panier
  var tot = el("p", "sd-tot"); tot.setAttribute("role", "status"); tot.setAttribute("aria-live", "polite");
  var sub = el("p", "sd-sub"), warn = el("p", "sd-warn"), rec = el("ul", "sd-rec"), btn = el("button", "sd-add", "Ajouter ces pièces au panier");
  btn.type = "button";
  var cartLink = el("a", "sd-cart", "Voir le panier"); cartLink.href = "/boutique/panier";
  var out = el("p", "sd-out"); out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite");
  var reset = el("button", "sd-reset", "Tout remettre à zéro"); reset.type = "button";
  sWrap.appendChild(tot); sWrap.appendChild(sub); sWrap.appendChild(warn); sWrap.appendChild(rec);
  var acts = el("div", "sd-acts"); acts.appendChild(btn); acts.appendChild(reset); acts.appendChild(cartLink); sWrap.appendChild(acts); sWrap.appendChild(out);
  reset.addEventListener("click", function () { lines.forEach(function (l) { l.q = 0; clearStatus(l); }); out.textContent = ""; update(); });

  function qtyOf(l) { return l.fixed ? l.q : l.q * guests; }
  function clearStatus(l) { l.status = null; if (l.statusEl) l.statusEl.textContent = ""; }
  var tplPrice = lines[0].price;

  function update() {
    gNum.textContent = guests + (guests > 1 ? " convives" : " convive");
    dots.textContent = "";
    for (var i = 0; i < guests; i++) dots.appendChild(el("i"));
    var fixedSum = 0, perGuest = 0, varSum = 0, count = 0, over = [], chosen = [], buyable = 0;
    lines.forEach(function (l) {
      if (l.numEl) l.numEl.textContent = String(l.q);
      if (l.row) l.row.classList.toggle("sd-row--on", l.q > 0);
      if (l.q <= 0 || l.out) return;
      var q = qtyOf(l);
      count += q; chosen.push(l);
      var amount = q * l.price.value;
      if (l.variable) varSum += amount; else { fixedSum += amount; if (!l.fixed) perGuest += l.q * l.price.value; }
      if (q > MAXQ) over.push(l.name);
      else if (l.pid && !l.variable) buyable++;
    });
    var round = function (v) { return Math.round(v * 100) / 100; };
    tot.textContent = "";
    if (!chosen.length) {
      tot.appendChild(el("span", "sd-tl", "Choisissez des pièces pour voir le total."));
      sub.textContent = ""; warn.textContent = ""; rec.textContent = ""; btn.disabled = true; return;
    }
    tot.appendChild(el("span", "sd-tl", "Total des pièces à prix fixe"));
    tot.appendChild(el("strong", "sd-tt", money(tplPrice, round(fixedSum))));
    sub.textContent = count + " pièce" + (count > 1 ? "s" : "") + " pour " + guests + (guests > 1 ? " convives" : " convive")
      + (perGuest > 0 ? " · soit " + money(tplPrice, round(perGuest)) + " de pièces par convive" : "")
      + (varSum > 0 ? " · plus, à partir de " + money(tplPrice, round(varSum)) + ", pour les pièces à variantes (prix exact sur leur fiche)" : "") + ".";
    warn.textContent = over.length ? "La boutique accepte 99 pièces au plus par ligne : réduisez les convives ou les pièces pour " + over.join(", ") + "." : "";
    rec.textContent = "";
    chosen.forEach(function (l) {
      var q = qtyOf(l), li = el("li", "", q + " × " + l.name + " — ");
      li.appendChild(el("b", "", money(tplPrice, round(q * l.price.value))));
      if (l.variable) li.appendChild(el("em", "", " (à partir de ; choisir sur la fiche)"));
      rec.appendChild(li);
    });
    btn.disabled = buyable === 0 || over.length > 0;
  }

  // Ajout au panier : une demande réelle par ligne, dans l'ordre. Le serveur reste seul juge (stock, quantité, âge, accès).
  var busy = false;
  btn.addEventListener("click", function () {
    if (busy || !window.fetch) return;
    var todo = lines.filter(function (l) { return l.q > 0 && !l.out && l.pid && !l.variable && qtyOf(l) <= MAXQ; });
    if (!todo.length) return;
    busy = true; btn.disabled = true; out.textContent = "Ajout en cours…";
    var okCount = 0, failCount = 0, i = 0;
    (function next() {
      if (i >= todo.length) {
        busy = false; update();
        var skipped = lines.filter(function (l) { return l.q > 0 && !l.out && l.variable; }).length;
        out.textContent = okCount + " ligne" + (okCount > 1 ? "s" : "") + " ajoutée" + (okCount > 1 ? "s" : "") + " au panier" + (failCount ? ", " + failCount + " refusée" + (failCount > 1 ? "s" : "") + " par la boutique (voir le détail sur chaque ligne)" : "") + "."
          + (skipped ? " " + skipped + " pièce" + (skipped > 1 ? "s" : "") + " à variantes à ajouter depuis leur fiche." : "");
        return;
      }
      var l = todo[i++], data = new URLSearchParams();
      data.set("product_id", l.pid); data.set("quantity", String(qtyOf(l))); data.set("retour", "/boutique");
      fetch("/boutique/panier/ajouter", { method: "POST", body: data, headers: { Accept: "application/json", "X-Requested-With": "fetch" }, credentials: "same-origin" })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) { if (res.ok) { okCount++; l.statusEl.textContent = "Ajouté."; } else { failCount++; l.statusEl.textContent = res.d && res.d.message ? res.d.message : "Refusé par la boutique."; } })
        .catch(function () { failCount++; l.statusEl.textContent = "Connexion impossible."; })
        .then(next);
    })();
  });
  update();
})();

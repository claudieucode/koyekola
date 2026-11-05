/* Convoi — colis sur la carte, suivi de colis, calculateur de devis. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "convoi") return;
  var rm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg", fr = function (n, d) { return Number(n).toLocaleString("fr-FR", { maximumFractionDigits: d || 0 }); };
  b.classList.add("cv-js");

  // apparition au défilement
  var els = $$("[data-reveal]");
  if ("IntersectionObserver" in window && !rm) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add("is-in"); });

  // compteurs
  var cs = $$("[data-count]");
  function setC(el, v) { var d = +el.getAttribute("data-dec") || 0; el.textContent = fr(v, d).replace(/^(-?)/, "$1") + (el.getAttribute("data-suffix") || ""); }
  if (cs.length && "IntersectionObserver" in window && !rm) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target); var el = e.target, to = parseFloat(el.getAttribute("data-count")), t0 = null;
      (function st(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); setC(el, to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(st); })(performance.now());
    }); }, { threshold: 0.4 });
    cs.forEach(function (c) { co.observe(c); });
  } else cs.forEach(function (c) { setC(c, parseFloat(c.getAttribute("data-count"))); });

  // colis qui circulent sur les routes
  $$("svg.cv-map").forEach(function (svg) {
    var items = [];
    $$("path[data-route]", svg).forEach(function (p, i) {
      var k = p.getAttribute("data-route"), len = p.getTotalLength(), n = k === "road" ? 2 : 1;
      for (var j = 0; j < n; j++) {
        var r = document.createElementNS(NS, "rect"); r.setAttribute("width", "8"); r.setAttribute("height", "8"); r.setAttribute("rx", "2"); r.setAttribute("class", "cv-pk" + (k === "road" ? "" : " cv-pk--" + k));
        svg.appendChild(r); items.push({ el: r, p: p, len: len, off: (i * 0.173 + j * 0.5) % 1, sp: (k === "road" ? 38 : 70) / len });
      }
    });
    function draw(t) { items.forEach(function (o) { var u = ((t * o.sp + o.off) % 1 + 1) % 1, pt = o.p.getPointAtLength(u * o.len); o.el.setAttribute("transform", "translate(" + (pt.x - 4).toFixed(1) + " " + (pt.y - 4).toFixed(1) + ")"); }); }
    if (rm) { draw(3); return; }
    var on = true, last = 0;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) loop(performance.now()); }).observe(svg);
    function loop(ts) { if (!on) return; draw(ts / 1000); requestAnimationFrame(loop); }
    loop(performance.now());
  });

  // filtres (services, agences, offres)
  $$("[data-fscope]").forEach(function (sc) {
    var tabs = $$("a[data-filter]", sc), items = $$("[data-cat]", sc);
    tabs.forEach(function (a) { a.addEventListener("click", function (ev) {
      ev.preventDefault(); var f = a.getAttribute("data-filter");
      tabs.forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
      items.forEach(function (it) { it.hidden = !(f === "*" || it.getAttribute("data-cat") === f); });
    }); });
  });

  // suivi de colis
  $$("[data-track]").forEach(function (box, bi) {
    var ui = box.querySelector(".cv-trk-ui"), cases = $$(".cv-case", box), id = "cv-no" + bi;
    if (!ui || !cases.length) return;
    ui.innerHTML = '<form class="cv-tf" novalidate><label for="' + id + '">Numéro de suivi</label><div class="cv-tf-row"><input type="text" id="' + id + '" autocomplete="off" maxlength="12" placeholder="CV-482913" aria-describedby="' + id + 'm"><button type="submit">Suivre</button></div><p class="cv-tm" id="' + id + 'm" role="status" aria-live="polite"></p></form><p class="cv-ex">Numéros de démonstration : ' + cases.map(function (c) { var n = c.getAttribute("data-no"); return '<a href="#' + n + '" data-no="' + n + '">' + n + "</a>"; }).join(" ") + "</p>";
    var inp = ui.querySelector("input"), msg = ui.querySelector(".cv-tm");
    function show(no, say) {
      cases.forEach(function (c) {
        var on = c.getAttribute("data-no") === no; c.hidden = !on; if (!on) return;
        var pos = +c.getAttribute("data-pos"); $$(".cv-steps li", c).forEach(function (li, i) { li.className = i < pos ? "is-done" : i === pos ? "is-now" : ""; if (i === pos) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current"); });
        var rt = c.querySelector(".cv-rt"), mk = c.querySelector(".cv-mk");
        if (rt && mk) { var pt = rt.getPointAtLength(rt.getTotalLength() * parseFloat(c.getAttribute("data-prog"))); mk.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")"); }
      });
      if (say) msg.textContent = say;
    }
    function find(v) { v = v.toUpperCase().replace(/\s+/g, ""); if (/^\d{6}$/.test(v)) v = "CV-" + v; return cases.filter(function (c) { return c.getAttribute("data-no") === v; })[0]; }
    ui.querySelector("form").addEventListener("submit", function (ev) {
      ev.preventDefault(); var v = inp.value.trim(), c = find(v);
      if (!v) { msg.textContent = "Saisissez un numéro de suivi, par exemple CV-482913."; return; }
      if (!c) { msg.textContent = "Aucun colis ne correspond à « " + v + " ». Démonstration : essayez un des numéros proposés."; return; }
      var n = c.getAttribute("data-no"); show(n, "Colis " + n + " : " + c.querySelector(".cv-badge").textContent + ". " + c.querySelector(".cv-eta").textContent + ".");
    });
    $$(".cv-ex a", ui).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); var n = a.getAttribute("data-no"); inp.value = n; show(n, "Colis " + n + " : " + find(n).querySelector(".cv-badge").textContent + ". " + find(n).querySelector(".cv-eta").textContent + "."); }); });
    show(cases[0].getAttribute("data-no"), "Exemple affiché : " + cases[0].getAttribute("data-no") + ".");
  });

  // calculateur de devis (estimation indicative de démonstration)
  $$("[data-quote]").forEach(function (box) {
    var ui = box.querySelector(".cv-q-ui"); if (!ui) return;
    var M = [["Colis express (messagerie)", 9, 0.55, 250, 1, [0, 1, 2, 3]], ["Palette et groupage", 38, 0.11, 300, 2, [0, 1, 2, 3]], ["Camion complet (affrètement)", 420, 0.02, 250, 2, [1, 2, 3]], ["Fret aérien express", 60, 2.4, 167, 1, [2, 3, 4]], ["Fret maritime conteneur", 240, 0.07, 400, 12, [3, 4]], ["Livraison urbaine (dernier kilomètre)", 6, 0.3, 200, 0, [0, 1]]];
    var Z = [["Locale (moins de 100 km)", 0.5, 0], ["Régionale (100 à 400 km)", 1, 0], ["Nationale (400 à 1 000 km)", 1.8, 1], ["Europe", 3.2, 2], ["Internationale", 5.5, 5]];
    var D = [["Économique", 0.85, 1], ["Standard", 1, 0], ["Express", 1.55, -1]];
    var opt = function (a, sel) { return a.map(function (x, i) { return '<option value="' + i + '"' + (i === sel ? " selected" : "") + ">" + x[0] + "</option>"; }).join(""); };
    ui.innerHTML = '<div class="cv-q-grid"><div class="cv-q-form"><div class="cv-fld cv-fld--w"><label for="cq-m">Type de flux</label><select id="cq-m">' + opt(M, 0) + '</select></div>' +
      '<div class="cv-fld"><label for="cq-w">Poids (kg)</label><input id="cq-w" type="number" inputmode="decimal" min="1" max="24000" step="1" value="45"><small>De 1 à 24 000 kg</small></div>' +
      '<div class="cv-fld"><label for="cq-v">Volume (m³)</label><input id="cq-v" type="number" inputmode="decimal" min="0" max="90" step="0.1" value="0.4"><small>Facultatif, jusqu\'à 90 m³</small></div>' +
      '<div class="cv-fld"><label for="cq-z">Distance / zone</label><select id="cq-z">' + opt(Z, 2) + '</select></div>' +
      '<div class="cv-fld"><label for="cq-d">Délai souhaité</label><select id="cq-d">' + opt(D, 1) + '</select></div></div>' +
      '<div class="cv-q-res" aria-live="polite"><h3>Estimation indicative</h3><p class="cv-price" id="cq-p"></p><p class="cv-q-msg" id="cq-e" hidden></p><dl id="cq-dl"></dl>' +
      '<label class="cv-sr" for="cq-s">Résumé à coller dans le formulaire</label><textarea id="cq-s" readonly rows="6"></textarea>' +
      '<div class="cv-q-act"><button type="button" class="cv-btn cv-btn--line" id="cq-c">Copier le résumé</button><a class="cv-btn" href="/contact">Envoyer au contact</a></div><p class="cv-q-fine" id="cq-cm" role="status"></p><p class="cv-q-fine">Estimation de démonstration, sans valeur contractuelle. Aucun envoi n\'est enregistré : collez le résumé dans le formulaire de contact.</p></div></div>';
    var g = function (i) { return ui.querySelector("#" + i); }, m = g("cq-m"), w = g("cq-w"), v = g("cq-v"), z = g("cq-z"), d = g("cq-d");
    function calc() {
      var mo = M[+m.value], zo = Z[+z.value], dl = D[+d.value], kg = parseFloat(w.value), vol = parseFloat(v.value) || 0, err = "";
      if (!(kg >= 1 && kg <= 24000)) err = "Indiquez un poids entre 1 et 24 000 kg.";
      else if (vol < 0 || vol > 90) err = "Indiquez un volume entre 0 et 90 m³.";
      else if (mo[5].indexOf(+z.value) < 0) err = "« " + mo[0] + " » n'est pas proposé sur cette zone. Choisissez un autre flux ou une autre distance.";
      var e = g("cq-e"), p = g("cq-p"), out = g("cq-dl"), s = g("cq-s");
      e.hidden = !err; e.textContent = err;
      if (err) { p.textContent = "—"; out.innerHTML = ""; s.value = ""; return; }
      var ch = Math.max(kg, vol * mo[3]), pr = (mo[1] + mo[2] * ch * zo[1]) * dl[1], lo = Math.round(pr * 0.9 / 5) * 5, hi = Math.round(pr * 1.1 / 5) * 5;
      var days = Math.max(mo[4] === 0 ? 0 : 1, mo[4] + zo[2] + dl[2]), dt = days === 0 ? "Même jour" : "J+" + days;
      p.textContent = fr(lo) + " € à " + fr(hi) + " € HT";
      out.innerHTML = "<dt>Délai estimé</dt><dd>" + dt + "</dd><dt>Poids taxable</dt><dd>" + fr(ch, 1) + " kg</dd><dt>Flux</dt><dd>" + mo[0].split(" (")[0] + "</dd>";
      s.value = "Demande de devis (estimation de démonstration)\nFlux : " + mo[0] + "\nPoids : " + fr(kg, 1) + " kg · Volume : " + fr(vol, 1) + " m³\nDistance / zone : " + zo[0] + "\nDélai souhaité : " + dl[0] + " (" + dt + ")\nEstimation indicative : " + fr(lo) + " à " + fr(hi) + " € HT";
    }
    [m, w, v, z, d].forEach(function (x) { x.addEventListener("input", calc); x.addEventListener("change", calc); });
    g("cq-c").addEventListener("click", function () {
      var s = g("cq-s"), cm = g("cq-cm"); if (!s.value) { cm.textContent = "Complétez d'abord les champs."; return; }
      var ok = function () { cm.textContent = "Résumé copié : collez-le dans le formulaire de contact."; }, ko = function () { s.focus(); s.select(); cm.textContent = "Sélectionnez le texte ci-dessus et copiez-le (Ctrl + C)."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s.value).then(ok, ko); else ko();
    });
    calc();
  });

  // menu mobile
  $$(".cv-drawer a").forEach(function (a) { a.addEventListener("click", function () { var dt = a.closest("details"); if (dt) dt.open = false; }); });
})();

/* Performance Pure — (1) calculateur de besoins (Mifflin-St Jeor, estimation indicative) ; (2) durée d'un contenant et rythme de réassort ; (3) récapitulatif prix + rythme sous le choix de formule d'abonnement ;
   (4) apparition douce des blocs. Aucune dépendance, rien n'est envoyé ni enregistré. Sans ce script, les formules restent écrites en clair et l'achat fonctionne (formulaires du moteur). */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "performance-pure") return;
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  var fr = function (n, d) { return n.toLocaleString("fr-FR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
  body.classList.add("pp-js");
  var uid = 0;
  var field = function (label, input) { var w = el("div", "pp-fld"), l = el("label", "", label); uid += 1; input.id = "pp-f" + uid; l.setAttribute("for", input.id); w.appendChild(l); w.appendChild(input); return w; };
  var num = function (min, max, step, ph) { var i = el("input"); i.type = "number"; i.min = min; i.max = max; i.step = step || 1; i.inputMode = "decimal"; if (ph) i.placeholder = ph; return i; };
  var select = function (opts) { var s = el("select"); var o0 = el("option", "", "Choisir…"); o0.value = ""; s.appendChild(o0); opts.forEach(function (o) { var o1 = el("option", "", o[1]); o1.value = o[0]; s.appendChild(o1); }); return s; };

  /* ---------- (1) Calculateur de besoins ---------- */
  all("[data-pp-calc]").forEach(function (box) {
    var acts = [];
    for (var k = 1; k <= 9; k++) { var v = box.getAttribute("data-act-" + k); if (v) { var p = v.split("|"); if (!isNaN(parseFloat(p[0]))) acts.push([p[0], p[1] || p[0]]); } }
    if (!acts.length) return;
    var pMin = parseFloat(box.getAttribute("data-prot-min")) || 1.2, pMax = parseFloat(box.getAttribute("data-prot-max")) || 2.0;
    box.textContent = "";
    var sex = select([["h", "Homme"], ["f", "Femme"]]), age = num(18, 80, 1, "ans"), tai = num(120, 230, 1, "cm"), poi = num(30, 250, 0.1, "kg"), act = select(acts);
    var row = el("div", "pp-row2"); row.appendChild(field("Âge", age)); row.appendChild(field("Taille", tai)); row.appendChild(field("Poids", poi));
    box.appendChild(field("Sexe pris dans la formule", sex)); box.appendChild(row); box.appendChild(field("Activité habituelle", act));
    var err = el("p", "pp-err"); err.setAttribute("role", "alert"); box.appendChild(err);
    var go = el("button", "pp-btn", "Calculer"); go.type = "button"; box.appendChild(go);
    var res = el("div", "pp-res"); res.hidden = true; res.setAttribute("role", "status"); res.setAttribute("aria-live", "polite"); box.appendChild(res);
    var kpi = function (t, v, u) { var d = el("div", "pp-kpi"); d.appendChild(el("small", "", t)); d.appendChild(el("strong", "", v)); d.appendChild(el("span", "", u)); return d; };
    function run() {
      var a = parseInt(age.value, 10), h = parseFloat(tai.value), w = parseFloat(poi.value), m = parseFloat(act.value);
      err.textContent = ""; res.hidden = true;
      if (!sex.value) { err.textContent = "Choisissez le sexe pris dans la formule (la formule en distingue deux)."; return; }
      if (!(a >= 18 && a <= 80) || String(a) !== String(age.value).trim()) { err.textContent = "L'âge doit être un nombre entier entre 18 et 80 ans : l'outil n'est pas prévu en dehors."; return; }
      if (!(h >= 120 && h <= 230)) { err.textContent = "La taille doit être comprise entre 120 et 230 cm."; return; }
      if (!(w >= 30 && w <= 250)) { err.textContent = "Le poids doit être compris entre 30 et 250 kg."; return; }
      if (!(m > 0)) { err.textContent = "Choisissez votre niveau d'activité."; return; }
      var bmr = 10 * w + 6.25 * h - 5 * a + (sex.value === "h" ? 5 : -161), tdee = bmr * m;
      var r10 = function (x) { return Math.round(x / 10) * 10; };
      res.textContent = "";
      var k3 = el("div", "pp-kpis");
      k3.appendChild(kpi("Au repos", fr(r10(bmr)), "kcal par jour"));
      k3.appendChild(kpi("Jour moyen", fr(r10(tdee)), "kcal par jour"));
      k3.appendChild(kpi("Protéines (repère)", fr(Math.round(w * pMin)) + " à " + fr(Math.round(w * pMax)), "g par jour"));
      res.appendChild(k3);
      res.appendChild(el("p", "pp-small", "Estimation indicative, arrondie à 10 kcal : Mifflin-St Jeor × multiplicateur d'activité " + fr(m, 3).replace(/0+$/, "").replace(/,$/, "") + ". Ce n'est ni un conseil médical ni un conseil nutritionnel personnalisé. Rien n'a été envoyé ni enregistré."));
      res.hidden = false;
    }
    go.addEventListener("click", run);
    [sex, age, tai, poi, act].forEach(function (i) { i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); run(); } }); });
  });

  /* ---------- (2) Durée d'un contenant → rythme de réassort ---------- */
  all("[data-pp-cadence]").forEach(function (box) {
    box.textContent = "";
    var per = num(1, 200, 1, "ex. 30"), day = num(1, 20, 1, "ex. 1");
    var row = el("div", "pp-row2"); row.appendChild(field("Portions par contenant", per)); row.appendChild(field("Portions par jour", day));
    box.appendChild(row);
    var out = el("p", "pp-recap", "Renseignez les deux valeurs."); out.setAttribute("role", "status"); out.setAttribute("aria-live", "polite"); box.appendChild(out);
    box.appendChild(el("p", "pp-small", "Le rythme proposé est un ordre de grandeur. Les formules réellement disponibles (et leur prix) sont affichées sur la fiche du produit."));
    function label(days) {
      var w = days / 7;
      if (w < 1.5) return "chaque semaine";
      if (w < 3) return "toutes les 2 semaines";
      if (days < 40) return "toutes les 4 semaines ou chaque mois";
      return "tous les " + Math.min(12, Math.round(days / 30)) + " mois";
    }
    function calc() {
      var p = parseInt(per.value, 10), d = parseInt(day.value, 10);
      if (!(p >= 1 && p <= 200) || !(d >= 1 && d <= 20)) { out.textContent = "Renseignez les deux valeurs (entiers positifs)."; return; }
      var days = Math.floor(p / d);
      out.textContent = "Un contenant dure environ " + days + (days > 1 ? " jours" : " jour") + " : un réassort " + label(days) + " serait cohérent.";
    }
    per.addEventListener("input", calc); day.addEventListener("input", calc);
  });

  /* ---------- (3) Fiche produit : récapitulatif prix + rythme AVANT le paiement d'un abonnement ---------- */
  all("form.sh-sub-form").forEach(function (form) {
    var sel = form.querySelector('select[name="plan_id"]');
    if (!sel) return;
    var recap = el("p", "pp-recap"); recap.setAttribute("role", "status"); recap.setAttribute("aria-live", "polite");
    var btn = form.querySelector('button[type="submit"]');
    form.insertBefore(recap, btn);
    function show() {
      var o = sel.options[sel.selectedIndex];
      recap.textContent = o && o.value ? "Vous paierez : " + o.textContent.replace(/^.*?—\s*/, "") + ", jusqu'à ce que vous résiliez (en un clic). La première échéance est payée maintenant." : "Choisissez une formule : son prix et son rythme s'afficheront ici.";
    }
    sel.addEventListener("change", show); show();
  });

  /* ---------- (4) Apparition douce ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = all(".pp-st li, .pp-formulas li, .pp-kpi");
  targets.forEach(function (t) { t.setAttribute("data-pp-reveal", ""); });
  if (reduce || !("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("pp-in"); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("pp-in"); io.unobserve(e.target); } }); }, { threshold: 0.15 });
  targets.forEach(function (t) { io.observe(t); });
})();

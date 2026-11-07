/* Box du Mois — (1) aperçu de gestion d'abonnement : pause, changement de formule, résiliation EN UN CLIC, pour de faux (rien n'est envoyé, rien n'est modifié) ;
   (2) récapitulatif prix + rythme sous le choix de formule du moteur, avant le paiement ; (3) apparition douce des cartes. Aucune dépendance.
   Sans ce script, la page de gestion réelle (/boutique/abonnements) et le formulaire d'abonnement du moteur fonctionnent normalement. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "box-du-mois") return;
  var all = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  body.classList.add("bm-js");

  /* ---------- (1) Aperçu de gestion ---------- */
  all("[data-bm-demo]").forEach(function (box) {
    var name = box.getAttribute("data-bm-name") || "Box du mois", price = box.getAttribute("data-bm-price") || "", rhythm = box.getAttribute("data-bm-rhythm") || "", alt = box.getAttribute("data-bm-alt") || "";
    var plan = price + " " + rhythm;
    box.textContent = "";
    var top = el("div", "bm-demo-top"); top.appendChild(el("strong", "", name)); top.appendChild(el("span", "bm-badge", "Aperçu · rien n'est modifié"));
    var info = el("p", "bm-small"), state = el("p", "bm-state"); state.setAttribute("role", "status"); state.setAttribute("aria-live", "polite");
    var actions = el("div", "bm-actions"), mail = el("p", "bm-mail"); mail.hidden = true;
    var b = function (label, cls, fn) { var x = el("button", "bm-ab" + (cls ? " " + cls : ""), label); x.type = "button"; x.addEventListener("click", fn); return x; };
    var cur = "active", planNow = plan;
    var pause = b("Mettre en pause", "", function () { cur = "paused"; draw(); });
    var resume = b("Reprendre", "", function () { cur = "active"; draw(); });
    var change = b(alt ? "Passer à : " + alt : "Changer de formule", "", function () { planNow = planNow === plan ? alt : plan; change.textContent = planNow === plan ? "Passer à : " + alt : "Revenir à : " + plan; draw(); });
    var cancel = b("Résilier mon abonnement", "bm-ab--danger", function () { cur = "ended"; draw(); });
    var again = b("Recommencer l'aperçu", "", function () { cur = "active"; planNow = plan; change.textContent = alt ? "Passer à : " + alt : "Changer de formule"; draw(); });
    [pause, resume, change, cancel, again].forEach(function (x) { actions.appendChild(x); });
    function draw() {
      info.textContent = "Formule : " + planNow + " · tout compris";
      state.setAttribute("data-s", cur);
      state.textContent = cur === "active" ? "Statut : actif" : cur === "paused" ? "Statut : en pause. Aucun prélèvement, aucune box." : "Statut : résilié. Plus aucun prélèvement.";
      pause.hidden = cur !== "active"; resume.hidden = cur !== "paused"; change.hidden = !alt || cur === "ended"; cancel.hidden = cur === "ended"; again.hidden = cur !== "ended";
      mail.hidden = cur !== "ended";
      mail.textContent = cur === "ended" ? "Un e-mail de confirmation de résiliation est envoyé dans le vrai parcours. Une seule étape a suffi : pas de question, pas de justification." : "";
    }
    box.appendChild(top); box.appendChild(info); box.appendChild(state); box.appendChild(actions); box.appendChild(mail); draw();
  });

  /* ---------- (2) Fiche produit : prix + rythme écrits AVANT le paiement d'un abonnement ---------- */
  all("form.sh-sub-form").forEach(function (form) {
    var sel = form.querySelector('select[name="plan_id"]');
    if (!sel) return;
    var recap = el("p", "bm-recap"); recap.setAttribute("role", "status"); recap.setAttribute("aria-live", "polite");
    var btn = form.querySelector('button[type="submit"]');
    form.insertBefore(recap, btn);
    function show() {
      var o = sel.options[sel.selectedIndex];
      recap.textContent = o && o.value ? "Vous paierez : " + o.textContent.replace(/^.*?—\s*/, "") + ", jusqu'à ce que vous résiliez (en un clic). La première échéance est payée maintenant." : "Choisissez une formule : son prix et son rythme s'afficheront ici.";
    }
    sel.addEventListener("change", show); show();
  });

  /* ---------- (3) Apparition douce ---------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = all(".bm-fold");
  targets.forEach(function (t) { t.setAttribute("data-bm-pop", ""); });
  if (reduce || !("IntersectionObserver" in window)) { targets.forEach(function (t) { t.classList.add("bm-in"); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("bm-in"); io.unobserve(e.target); } }); }, { threshold: 0.15 });
  targets.forEach(function (t) { io.observe(t); });
})();

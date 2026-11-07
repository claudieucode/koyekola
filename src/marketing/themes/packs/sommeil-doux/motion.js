/* Sommeil doux — quiz de recommandation de matelas. Aucune dépendance. Le quiz est un RÉPÈRE : il ne stocke rien, n'envoie rien, et aboutit à un lien vers le vrai catalogue
   (catégorie + étiquette de fermeté), que la boutique a créé. Sans ce script, le contenu écrit dans la page (repères dépliants et liens) reste pleinement utilisable. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "sommeil-doux") return;
  body.classList.add("sd-js");

  var QUESTIONS = [
    { key: "pos", title: "Dans quelle position vous endormez-vous le plus souvent ?", items: [
      ["cote", "Sur le côté", "Épaule et hanche s'enfoncent", 1], ["dos", "Sur le dos", "Allongé, bras le long du corps", 2], ["ventre", "Sur le ventre", "Visage tourné, bassin à plat", 3], ["change", "Je change souvent", "Dans la même nuit", 2]] },
    { key: "sens", title: "Quelle sensation aimez-vous en vous couchant ?", items: [
      ["moelleux", "Enveloppante", "Je m'enfonce un peu", -1], ["equilibre", "Équilibrée", "Ni trop mou ni trop dur", 0], ["soutenant", "Soutenante", "Je préfère un appui franc", 1]] },
    { key: "duo", title: "Vous dormez…", items: [
      ["seul", "Seul(e)", "Je gère tout l'espace", 0], ["couple", "À deux", "Les mouvements de l'autre me réveillent parfois", 0]] },
  ];
  var WHY = { 1: "Un accueil souple laisse l'épaule et la hanche s'enfoncer, ce qui garde la colonne alignée.", 2: "Un soutien médian maintient le creux des reins sans pousser : le plus polyvalent.", 3: "Une surface plus ferme évite que le bassin s'enfonce et que le dos se cambre." };
  var LABEL = { 1: "souple", 2: "mi-ferme", 3: "ferme" };

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function link(href, cls, txt) { var a = el("a", cls, txt); a.setAttribute("href", href); return a; }
  function slug(s) { return String(s || "").replace(/[^a-z0-9-]/gi, "").slice(0, 40); }

  function quiz(root) {
    var cat = slug(root.getAttribute("data-cat")) || "matelas";
    var tags = String(root.getAttribute("data-tags") || "souple;mi-ferme;ferme").split(";").map(slug);
    if (tags.length !== 3 || tags.some(function (t) { return !t; })) tags = ["souple", "mi-ferme", "ferme"];
    var coupleTag = slug(root.getAttribute("data-couple")) || "couple";
    var answers = {}, step = 0;
    var live = el("div", "sd-live"); live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    var panel = el("div", "sd-panel");
    root.textContent = ""; root.appendChild(live); root.appendChild(panel);

    function dots() {
      var ol = el("ol", "sd-dots"); ol.setAttribute("aria-label", "Progression");
      QUESTIONS.forEach(function (q, i) { var li = el("li", i < step ? "is-done" : i === step ? "is-now" : ""); li.textContent = String(i + 1); if (i === step) li.setAttribute("aria-current", "step"); ol.appendChild(li); });
      return ol;
    }
    function ask() {
      var q = QUESTIONS[step]; panel.textContent = ""; panel.appendChild(dots());
      var h = el("h3", "sd-qt", q.title); h.setAttribute("tabindex", "-1"); panel.appendChild(h);
      var grp = el("div", "sd-opts"); grp.setAttribute("role", "group"); grp.setAttribute("aria-label", q.title);
      q.items.forEach(function (it) {
        var b = el("button", "sd-opt"); b.type = "button";
        b.appendChild(el("b", "", it[1])); b.appendChild(el("span", "", it[2]));
        b.setAttribute("aria-pressed", answers[q.key] === it[0] ? "true" : "false");
        b.addEventListener("click", function () { answers[q.key] = it[0]; if (step < QUESTIONS.length - 1) { step++; ask(); focusTitle(); } else { result(); } });
        grp.appendChild(b);
      });
      panel.appendChild(grp);
      if (step > 0) { var back = el("button", "sd-back", "Question précédente"); back.type = "button"; back.addEventListener("click", function () { step--; ask(); focusTitle(); }); panel.appendChild(back); }
      live.textContent = "Question " + (step + 1) + " sur " + QUESTIONS.length;
    }
    function focusTitle() { var t = panel.querySelector(".sd-qt"); if (t && t.focus) t.focus({ preventScroll: true }); }
    function val(key) { var q = QUESTIONS.filter(function (x) { return x.key === key; })[0]; var it = q.items.filter(function (i) { return i[0] === answers[key]; })[0]; return it ? it[3] : 0; }
    function result() {
      var score = Math.max(1, Math.min(3, val("pos") + val("sens")));
      var tag = tags[score - 1];
      panel.textContent = "";
      var card = el("div", "sd-res"); 
      card.appendChild(el("p", "sd-lab sd-lab--l", "Votre repère"));
      var h = el("h3", "sd-qt", "Un matelas " + LABEL[score]); h.setAttribute("tabindex", "-1"); card.appendChild(h);
      card.appendChild(el("p", "sd-why", WHY[score]));
      var gauge = el("span", "sd-gdots sd-gdots--l"); gauge.setAttribute("aria-hidden", "true");
      [1, 2, 3].forEach(function (k) { gauge.appendChild(el("i", k <= score ? "on" : "")); }); card.appendChild(gauge);
      var acts = el("p", "sd-acts");
      acts.appendChild(link("/boutique?categorie=" + cat + "&etiquette=" + tag, "sd-btn", "Voir les matelas " + LABEL[score] + "s"));
      if (answers.duo === "couple") acts.appendChild(link("/boutique/etiquette/" + coupleTag, "sd-btn sd-btn--o", "Voir les matelas pour couples"));
      card.appendChild(acts);
      var rule = el("details", "sd-rule"); rule.appendChild(el("summary", "", "Comment ce résultat est calculé"));
      rule.appendChild(el("p", "", "La position de sommeil donne la base (côté : souple, dos ou changeante : mi-ferme, ventre : ferme). La sensation recherchée la déplace d'un cran vers plus de moelleux ou plus d'appui. Vous dormez à deux : on ajoute les modèles à ressorts indépendants. C'est un repère général, pas un avis médical."));
      card.appendChild(rule);
      var again = el("button", "sd-back", "Recommencer le quiz"); again.type = "button"; again.addEventListener("click", function () { answers = {}; step = 0; ask(); focusTitle(); });
      card.appendChild(again); panel.appendChild(card);
      live.textContent = "Résultat : un matelas " + LABEL[score];
      if (h.focus) h.focus({ preventScroll: true });
    }
    ask();
  }

  function init() { Array.prototype.slice.call(document.querySelectorAll("[data-sommeil-quiz]")).forEach(quiz); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

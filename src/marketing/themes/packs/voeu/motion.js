/* Vœu — pétales, apparitions, compte à rebours, onglets/filtres et assistant de réponse (RSVP). Sans dépendance ; mouvement réduit respecté. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "voeu") return;
  var b = document.body, reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n, l) { n = String(n); while (n.length < (l || 2)) n = "0" + n; return n; };

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("vo-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });
  }

  // Pétales qui tombent (décoratif)
  $$(".vo-petals").forEach(function (box) {
    if (reduce) return;
    for (var i = 0; i < 12; i++) {
      var p = document.createElement("span"); p.className = "vo-petal";
      p.style.left = Math.round(Math.random() * 96) + "%"; p.style.animationDelay = (-Math.random() * 12).toFixed(1) + "s";
      p.style.animationDuration = (10 + Math.random() * 8).toFixed(1) + "s"; p.style.setProperty("--vo-dx", Math.round(-40 + Math.random() * 120) + "px");
      p.style.width = 9 + Math.round(Math.random() * 8) + "px"; p.style.height = parseInt(p.style.width, 10) + 4 + "px";
      box.appendChild(p);
    }
  });

  // Compte à rebours
  $$("[data-countdown]").forEach(function (box) {
    var end = new Date(box.getAttribute("data-countdown")).getTime(); if (isNaN(end)) return;
    var c = {}; $$("[data-u]", box).forEach(function (x) { c[x.getAttribute("data-u")] = x; });
    var t;
    function tick() {
      var s = Math.max(0, Math.floor((end - Date.now()) / 1000));
      c.d.textContent = pad(Math.floor(s / 86400), 3); c.h.textContent = pad(Math.floor(s % 86400 / 3600)); c.m.textContent = pad(Math.floor(s % 3600 / 60)); c.s.textContent = pad(s % 60);
      if (!s) clearInterval(t);
    }
    tick(); t = setInterval(tick, reduce ? 60000 : 1000);
  });

  // Onglets et filtres : liens [data-show] qui montrent les éléments [data-for] correspondants
  $$("[data-switch]").forEach(function (g) {
    var links = $$("[data-show]", g), items = $$("[data-for]", g), out = g.querySelector("[data-out]");
    function set(v) {
      links.forEach(function (a) { a.setAttribute("aria-pressed", a.getAttribute("data-show") === v ? "true" : "false"); });
      var n = 0;
      items.forEach(function (i) { var ok = v === "all" || (" " + i.getAttribute("data-for") + " ").indexOf(" " + v + " ") > -1; i.hidden = !ok; if (ok) n++; });
      if (out) out.textContent = n + (n > 1 ? " résultats affichés" : " résultat affiché");
    }
    links.forEach(function (a) {
      a.addEventListener("click", function (e) { e.preventDefault(); set(a.getAttribute("data-show")); });
      a.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); a.click(); } });
    });
    if (links.length) set(links[0].getAttribute("data-show"));
  });

  // Assistant de réponse à l'invitation (aucun envoi : récapitulatif à coller dans /contact)
  $$("[data-rsvp]").forEach(function (box) {
    var radios = function (name, list) { return list.map(function (t, i) { var id = "vo-" + name + i; return '<input type="radio" id="' + id + '" name="' + name + '" value="' + t + '"><label for="' + id + '">' + t + "</label>"; }).join(""); };
    box.innerHTML = '<form class="vo-form" novalidate><div class="vo-err" role="alert" tabindex="-1" hidden></div>' +
      '<div class="vo-fld"><label for="vo-nom">Votre nom et prénom <span aria-hidden="true">*</span></label><input type="text" id="vo-nom" name="nom" autocomplete="name" required aria-describedby="vo-nom-e"><p class="vo-fe" id="vo-nom-e" hidden></p></div>' +
      '<fieldset class="vo-fld" id="vo-pres-f"><legend>Serez-vous des nôtres ? <span aria-hidden="true">*</span></legend><div class="vo-choices">' + radios("pres", ["Oui, avec grande joie", "Non, à regret"]) + '</div><p class="vo-fe" id="vo-pres-e" hidden></p></fieldset>' +
      '<div data-yes hidden><div class="vo-fld" style="margin-bottom:22px"><label for="vo-acc">Nombre d\'accompagnants</label><p class="vo-hint" id="vo-acc-h">Sans vous compter. Les enfants sont les bienvenus : précisez leur âge dans votre message.</p><select id="vo-acc" name="acc" aria-describedby="vo-acc-h"><option>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>' +
      '<fieldset class="vo-fld" style="margin-bottom:22px"><legend>Menu <span aria-hidden="true">*</span></legend><div class="vo-choices">' + radios("menu", ["Viande", "Poisson", "Végétarien", "Menu enfant"]) + '</div><p class="vo-fe" id="vo-menu-e" hidden></p></fieldset>' +
      '<div class="vo-fld"><label for="vo-all">Allergies ou régimes particuliers</label><input type="text" id="vo-all" name="all" placeholder="Par exemple : sans gluten, arachides"></div></div>' +
      '<div class="vo-fld"><label for="vo-msg">Un mot pour les mariés (facultatif)</label><textarea id="vo-msg" name="msg" rows="4"></textarea></div>' +
      '<div><button type="submit" class="vo-btn">Voir mon récapitulatif</button></div></form>';
    var f = box.querySelector("form"), err = box.querySelector(".vo-err"), yes = box.querySelector("[data-yes]");
    var val = function (n) { var c = f.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : ""; };
    f.addEventListener("change", function () { yes.hidden = val("pres").indexOf("Oui") !== 0; });

    function show(id, msg, ctl) { var p = box.querySelector("#" + id); if (p) { p.textContent = msg; p.hidden = !msg; } if (ctl) { if (msg) ctl.setAttribute("aria-invalid", "true"); else ctl.removeAttribute("aria-invalid"); } }
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = f.nom, pres = val("pres"), menu = val("menu"), go = pres.indexOf("Oui") === 0, errs = [];
      show("vo-nom-e", nom.value.trim() ? "" : "Indiquez votre nom.", nom); if (!nom.value.trim()) errs.push(["Indiquez votre nom.", nom]);
      show("vo-pres-e", pres ? "" : "Choisissez une réponse."); if (!pres) errs.push(["Dites-nous si vous serez présent(e).", f.querySelector('input[name="pres"]')]);
      show("vo-menu-e", !go || menu ? "" : "Choisissez un menu."); if (go && !menu) errs.push(["Choisissez un menu.", f.querySelector('input[name="menu"]')]);
      if (errs.length) {
        err.innerHTML = "<p style=\"margin:0\">Quelques informations manquent :</p><ul>" + errs.map(function (x) { return "<li>" + x[0] + "</li>"; }).join("") + "</ul>";
        err.hidden = false; err.focus(); return;
      }
      err.hidden = true;
      var L = ["Réponse à l'invitation — Camille & Aurèle, 11 septembre 2027", "Nom : " + nom.value.trim(), "Présence : " + pres];
      if (go) { L.push("Accompagnants : " + f.acc.value, "Menu : " + menu, "Allergies : " + (f.all.value.trim() || "aucune")); }
      if (f.msg.value.trim()) L.push("Message : " + f.msg.value.trim());
      var txt = L.join("\n");
      var rc = document.createElement("div"); rc.className = "vo-recap";
      rc.innerHTML = '<h3 tabindex="-1">Votre récapitulatif</h3><p>Rien n\'a encore été envoyé. Copiez ce texte, puis collez-le dans le formulaire de contact : c\'est lui qui nous transmet votre réponse.</p><textarea readonly aria-label="Récapitulatif de votre réponse"></textarea>' +
        '<div class="vo-actions"><button type="button" class="vo-btn" data-copy>Copier le récapitulatif</button><a class="vo-btn vo-btn--line" href="/contact">Aller au formulaire de contact</a><button type="button" class="vo-btn vo-btn--line" data-edit>Modifier mes réponses</button></div><p class="vo-ok" role="status" aria-live="polite"></p>';
      var ta = rc.querySelector("textarea"); ta.value = txt;
      f.hidden = true; box.appendChild(rc); rc.querySelector("h3").focus();
      var ok = rc.querySelector(".vo-ok");
      rc.querySelector("[data-copy]").addEventListener("click", function () {
        function done() { ok.textContent = "Récapitulatif copié."; }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { ta.select(); ok.textContent = "Sélectionné : faites Ctrl+C (ou Cmd+C)."; });
        else { ta.select(); try { document.execCommand("copy"); done(); } catch (x) { ok.textContent = "Sélectionné : faites Ctrl+C (ou Cmd+C)."; } }
      });
      rc.querySelector("[data-edit]").addEventListener("click", function () { box.removeChild(rc); f.hidden = false; nom.focus(); });
    });
  });
})();

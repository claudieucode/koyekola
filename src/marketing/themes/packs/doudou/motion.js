/* Doudou — journée type cliquable, menus à onglets, filtres, pré-inscription guidée (rien n'est enregistré), apparitions douces. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "doudou") return;
  var R = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var Q = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var n = 0, uid = function (el) { if (!el.id) el.id = "dd-" + (++n); return el.id; };

  // Apparition au défilement (contenu visible sans JS ou en mouvement réduit)
  if (!R && "IntersectionObserver" in window) {
    b.classList.add("dd-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    Q("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Compteurs
  var cs = Q("[data-count]");
  if (cs.length && "IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
      if (R || isNaN(to) || to < 5) { el.textContent = to + suf; return; }
      var t0 = null; (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    cs.forEach(function (c) { co.observe(c); });
  }

  // Menu mobile : se referme au clic
  Q(".dd-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Onglets (journée type, menus) : clavier, rôles et liens ARIA
  var players = [];
  Q("[data-dd-tabs]").forEach(function (root) {
    var tabs = Q('[role="tab"]', root), panels = Q("[data-dd-panel]", root), cur = 0;
    tabs.forEach(function (t, i) { t.setAttribute("aria-controls", uid(panels[i])); panels[i].setAttribute("aria-labelledby", uid(t)); });
    function sel(i, focus) {
      cur = i;
      tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on); t.setAttribute("tabindex", on ? "0" : "-1"); panels[k].hidden = !on; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function (e) { e.preventDefault(); stop(); sel(i); });
      t.addEventListener("keydown", function (e) {
        var k = e.key, j = k === "ArrowRight" || k === "ArrowDown" ? (i + 1) % tabs.length : k === "ArrowLeft" || k === "ArrowUp" ? (i + tabs.length - 1) % tabs.length : k === "Home" ? 0 : k === "End" ? tabs.length - 1 : -1;
        if (j > -1) { e.preventDefault(); stop(); sel(j, true); }
      });
    });
    panels.forEach(function (p) { p.setAttribute("tabindex", "-1"); });
    sel(0);
    // Particularités de la journée type
    var live = root.querySelector(".dd-live"), timer = null, play = root.querySelector("[data-play]"), now = root.querySelector('a[href="#maintenant"]');
    function stop() { if (timer) { clearInterval(timer); timer = null; if (play) { play.setAttribute("aria-pressed", "false"); play.textContent = "Parcourir la journée"; } } }
    if (play) players.push(stop);
    if (now) now.addEventListener("click", function (e) {
      e.preventDefault(); stop();
      var d = new Date(), m = d.getHours() * 60 + d.getMinutes(), i = 0;
      tabs.forEach(function (t, k) { if (m >= +t.getAttribute("data-at")) i = k; });
      sel(i);
      var h = d.getHours() + "h" + (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
      var out = m < 450 || m > 1110;
      if (live) live.textContent = out ? "Il est " + h + " : la maison est fermée. Voici le premier moment de la journée." : "Il est " + h + " sur votre appareil : voici ce qui se passe à ce moment d'une journée type.";
    });
    if (play) play.addEventListener("click", function (e) {
      e.preventDefault();
      if (timer) { stop(); return; }
      play.setAttribute("aria-pressed", "true"); play.textContent = "Arrêter la visite";
      timer = setInterval(function () { sel((cur + 1) % tabs.length); }, R ? 7000 : 4500);
    });
  });

  // Filtres des actualités
  Q("[data-dd-filter]").forEach(function (root) {
    var chips = Q("[data-f]", root), items = Q("[data-cat]", root), out = root.querySelector("[data-count-out]");
    chips.forEach(function (c) { c.addEventListener("click", function (e) {
      e.preventDefault(); var f = c.getAttribute("data-f"), k = 0;
      chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      items.forEach(function (it) { var ok = f === "Tout" || it.getAttribute("data-cat") === f; it.hidden = !ok; if (ok) k++; });
      if (out) out.textContent = k + (k > 1 ? " actualités affichées" : " actualité affichée") + (f === "Tout" ? "." : " : " + f + ".");
    }); });
  });

  // Pré-inscription guidée : tout reste dans la page, rien n'est enregistré
  Q("[data-dd-wiz]").forEach(function (root) {
    var steps = Q("[data-step]", root), dots = Q(".dd-steps li", root), prev = root.querySelector("[data-prev]"), next = root.querySelector("[data-next]"), at = 0;
    var recap = root.querySelector("[data-recap]"), said = root.querySelector("[data-copied]"), text = "";
    var state = {};
    Q(".dd-g", root).forEach(function (g) {
      var key = g.getAttribute("data-key"), radio = g.getAttribute("data-type") === "radio", opts = Q(".dd-opt", g), err = g.querySelector(".dd-err"), box = g.querySelector(".dd-opts");
      state[key] = []; err.hidden = true;
      err.setAttribute("id", "dd-e" + (++n)); box.setAttribute("aria-describedby", err.id);
      function paint() { opts.forEach(function (o) { var on = state[key].indexOf(o.getAttribute("data-v")) > -1; o.setAttribute("aria-checked", on); o.setAttribute("tabindex", !radio || on || (!state[key].length && o === opts[0]) ? "0" : "-1"); }); }
      function pick(o) {
        var v = o.getAttribute("data-v"), s = state[key], i = s.indexOf(v);
        if (radio) state[key] = [v];
        else if (o.hasAttribute("data-none")) state[key] = i > -1 ? [] : [v];
        else { s = s.filter(function (x) { return x.indexOf("Aucun") !== 0; }); if (i > -1) s = s.filter(function (x) { return x !== v; }); else s.push(v); state[key] = s; }
        err.hidden = true; box.removeAttribute("aria-invalid"); box.classList.remove("is-bad"); paint();
      }
      opts.forEach(function (o, i) {
        o.addEventListener("click", function (e) { e.preventDefault(); pick(o); });
        o.addEventListener("keydown", function (e) {
          if (e.key === " ") { e.preventDefault(); pick(o); }
          if (radio && /^Arrow/.test(e.key)) { e.preventDefault(); var j = (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length; opts[j].focus(); pick(opts[j]); }
        });
      });
      g.check = function () {
        if (g.getAttribute("data-req") === "1" && !state[key].length) {
          err.textContent = radio ? "Merci de choisir une réponse : " + g.getAttribute("data-label") : "Merci de choisir au moins une réponse : " + g.getAttribute("data-label");
          err.hidden = false; box.setAttribute("aria-invalid", "true"); box.classList.add("is-bad"); return opts[0]; }
        return null;
      };
      paint();
    });
    var labels = { age: "Âge", rentree: "Rentrée", besoins: "Besoins", jours: "Jours", formule: "Durée", foyer: "Foyer", contact: "Contact souhaité" };
    function show(i, quiet) {
      at = i;
      steps.forEach(function (s, k) { s.hidden = k !== i; });
      dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); d.classList.toggle("is-done", k < i); if (k === i) d.setAttribute("aria-current", "step"); else d.removeAttribute("aria-current"); });
      prev.hidden = i === 0 || i === steps.length - 1; next.hidden = i === steps.length - 1;
      next.textContent = i === steps.length - 2 ? "Voir le récapitulatif" : "Continuer";
      var h = steps[i].querySelector("[data-focus]"); if (h && !quiet) { h.setAttribute("tabindex", "-1"); h.focus(); }
      if (i === steps.length - 1) build();
    }
    function build() {
      recap.innerHTML = ""; text = "Pré-inscription (démonstration)\n";
      Object.keys(labels).forEach(function (k) {
        var v = state[k] && state[k].length ? state[k].join(", ") : "Non précisé";
        var div = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
        dt.textContent = labels[k]; dd.textContent = v; div.appendChild(dt); div.appendChild(dd); recap.appendChild(div); text += labels[k] + " : " + v + "\n";
      });
    }
    next.addEventListener("click", function (e) {
      e.preventDefault();
      var bad = null; Q(".dd-g", steps[at]).forEach(function (g) { var f = g.check(); if (f && !bad) bad = f; });
      if (bad) { bad.focus(); return; }
      show(at + 1);
    });
    prev.addEventListener("click", function (e) { e.preventDefault(); show(at - 1); });
    var cp = root.querySelector('a[href="#copier"]'), rs = root.querySelector('a[href="#recommencer"]');
    cp.addEventListener("click", function (e) {
      e.preventDefault();
      function done(ok) { said.textContent = ok ? "Récapitulatif copié. Collez-le dans le formulaire de contact." : "Copie impossible : sélectionnez le texte ci-dessus et copiez-le à la main."; }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); }); else done(false);
    });
    rs.addEventListener("click", function (e) {
      e.preventDefault(); Object.keys(state).forEach(function (k) { state[k] = []; });
      Q(".dd-opt", root).forEach(function (o) { o.setAttribute("aria-checked", "false"); }); said.textContent = ""; show(0);
    });
    steps.forEach(function (s, k) { s.hidden = k !== 0; }); show(0, true);
  });
})();

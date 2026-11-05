/* Recueil — fondu très doux, recherche d'avis, fiche par ancre, bougie symbolique, message préparé vers /contact, démarches cochables. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "recueil") return;
  var R = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var one = function (s, r) { return (r || document).querySelector(s); };
  var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim(); };
  var store = function (k, v) { try { if (v === undefined) return localStorage.getItem(k); v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} return null; };
  var sess = function (k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) {} return null; };
  function mk(tag, cls, txt, at) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; for (var k in at || {}) e.setAttribute(k, at[k]); return e; }

  // Fondu très doux
  if (!R && b.getAttribute("data-pk-fondu") !== "off" && "IntersectionObserver" in window) {
    b.classList.add("rc-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    $("[data-reveal]").forEach(function (el) { io.observe(el); });
  }

  // Recherche d'avis : nom, ville, date
  var find = one("[data-rc-find]");
  if (find) {
    var items = $("[data-rc-list] > li"), empty = one("[data-rc-empty]"), ville = "", q = "";
    find.textContent = "";
    var f = mk("div", "rc-fld"), lab = mk("label", "", "Rechercher par nom, ville ou date (par exemple : Lenoir, Valmorin, 7 novembre, 07/11)", { "for": "rc-q" });
    var inp = mk("input", "", "", { id: "rc-q", type: "search", autocomplete: "off", spellcheck: "false" });
    f.appendChild(lab); f.appendChild(inp); find.appendChild(f);
    var fs = mk("fieldset", "rc-chips"); fs.appendChild(mk("legend", "", "Filtrer par ville"));
    var vs = [""].concat((find.getAttribute("data-villes") || "").split("|")), chips = [];
    vs.forEach(function (v) { var c = mk("button", "rc-chip", v || "Toutes les villes", { type: "button", "aria-pressed": v === "" ? "true" : "false" }); c.addEventListener("click", function () { ville = v; run(); }); chips.push([c, v]); fs.appendChild(c); });
    find.appendChild(fs);
    var cnt = mk("p", "rc-count", "", { role: "status" }); find.appendChild(cnt);
    function run() {
      var t = norm(q).split(" ").filter(Boolean), n = 0;
      items.forEach(function (li) {
        var hay = norm(li.getAttribute("data-search")), ok = t.every(function (w) { return hay.indexOf(w) > -1; }) && (!ville || li.getAttribute("data-ville") === ville);
        li.hidden = !ok; if (ok) n++;
      });
      chips.forEach(function (c) { c[0].setAttribute("aria-pressed", c[1] === ville ? "true" : "false"); });
      cnt.textContent = n === 0 ? "Aucun avis trouvé." : n + (n > 1 ? " avis affichés." : " avis affiché.");
      if (empty) empty.hidden = n > 0;
    }
    inp.addEventListener("input", function () { q = inp.value; run(); });
    run();
  }

  // Fiche : un avis à la fois, choisi par l'ancre
  var fiches = $(".rc-fiche[data-av]");
  function show(first) {
    var h = decodeURIComponent((location.hash || "").slice(1)), cur = fiches.filter(function (s) { return s.getAttribute("data-av") === h; })[0] || fiches[0];
    fiches.forEach(function (s) { s.hidden = s !== cur; });
    if (!first && cur) { var t = one(".rc-fnom", cur); if (t) { t.setAttribute("tabindex", "-1"); t.focus(); window.scrollTo(0, cur.getBoundingClientRect().top + window.pageYOffset - 20); } }
  }
  if (fiches.length) {
    show(true); window.addEventListener("hashchange", function () { show(false); });
    $("[data-rc-go]").forEach(function (a) { a.addEventListener("click", function () { if (location.hash === "#" + a.getAttribute("data-rc-go")) show(false); }); });
  }

  // Bougie symbolique : simple état coché, sans animation
  var FL = '<svg class="rc-fl-off" viewBox="0 0 20 28" aria-hidden="true" focusable="false"><path d="M10 2c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10 17v9" stroke="currentColor" stroke-width="1.3"/></svg><svg class="rc-fl-on" viewBox="0 0 20 28" aria-hidden="true" focusable="false"><path d="M10 2c3 4 5 6 5 9a5 5 0 0 1-10 0c0-3 2-5 5-9z" fill="currentColor"/><path d="M10 17v9" stroke="currentColor" stroke-width="1.3"/></svg>';
  $("[data-rc-candle]").forEach(function (box) {
    var slug = box.getAttribute("data-av"), art = box.closest(".rc-card"), out = art && one("[data-rc-n='bou']", art), base = out ? parseInt(out.textContent, 10) || 0 : 0;
    var on = store("rc-bou-" + slug) === "1";
    var btn = mk("button", "rc-flame", "", { type: "button", "aria-pressed": on ? "true" : "false" });
    btn.innerHTML = FL + '<span></span>';
    function paint() { btn.setAttribute("aria-pressed", on ? "true" : "false"); one("span", btn).textContent = on ? "Bougie allumée" : "Allumer une bougie"; if (out) out.textContent = base + (on ? 1 : 0); }
    btn.addEventListener("click", function () { on = !on; store("rc-bou-" + slug, on ? "1" : null); paint(); });
    paint(); box.appendChild(btn);
    box.appendChild(mk("p", "rc-hint", "Geste symbolique, enregistré seulement sur cet appareil."));
  });

  // Message de condoléances : préparé, jamais publié ; envoyé via /contact
  $("[data-rc-compose]").forEach(function (box) {
    var slug = box.getAttribute("data-av"), nom = box.getAttribute("data-nom"), p = "rc-" + slug;
    box.textContent = "";
    var fm = mk("form", "", "", { novalidate: "novalidate" }), fs = mk("fieldset");
    fs.appendChild(mk("legend", "", "Écrire un message à la famille"));
    function fld(id, label, el, hint) { var d = mk("div", "rc-fld"); d.appendChild(mk("label", "", label, { "for": p + id })); el.id = p + id; d.appendChild(el); if (hint) d.appendChild(mk("p", "rc-hint", hint)); fs.appendChild(d); return el; }
    var n = fld("-n", "Votre nom (facultatif)", mk("input", "", "", { type: "text", autocomplete: "name" }));
    var l = mk("select"); ["", "Un(e) ami(e)", "Un membre de la famille", "Un(e) collègue", "Un voisin ou une voisine", "Autre lien"].forEach(function (o) { l.appendChild(mk("option", "", o || "Choisir (facultatif)", { value: o })); });
    fld("-l", "Votre lien avec la personne", l);
    var m = fld("-m", "Votre message", mk("textarea", "", "", { rows: "6", maxlength: "800", "aria-describedby": p + "-h" }));
    m.setAttribute("aria-required", "true");
    var h = mk("p", "rc-hint", "Démonstration : votre message n'est pas publié. Il est préparé puis envoyé à la famille depuis la page Contact. 800 caractères au plus.", { id: p + "-h" }); fs.appendChild(h);
    var er = mk("p", "rc-err", "", { role: "alert" }); fs.appendChild(er);
    var go = mk("button", "rc-btn", "Préparer mon message", { type: "submit" }); fs.appendChild(go);
    fm.appendChild(fs); box.appendChild(fm);
    var rc = mk("div", "rc-recap", "", { role: "region", "aria-label": "Message prêt à être envoyé" }); rc.hidden = true; box.appendChild(rc);
    fm.addEventListener("submit", function (e) {
      e.preventDefault(); var txt = m.value.trim();
      if (txt.length < 10) { er.textContent = "Votre message est trop court : écrivez au moins quelques mots."; m.setAttribute("aria-invalid", "true"); m.focus(); return; }
      er.textContent = ""; m.removeAttribute("aria-invalid");
      var full = "Message de condoléances pour " + nom + (l.value ? " (" + l.value.toLowerCase() + ")" : "") + "\n\n" + txt + (n.value.trim() ? "\n\nSigné : " + n.value.trim() : "");
      sess("rc-msg", full); rc.textContent = ""; rc.appendChild(mk("h4", "rc-h3", "Votre message est prêt"));
      rc.appendChild(mk("pre", "", full)); rc.appendChild(mk("p", "rc-hint", "Il n'est pas publié sur cette page. Pour le transmettre à la famille, continuez vers le formulaire de contact : il y sera repris."));
      var act = mk("p", "rc-act"), a = mk("a", "rc-btn", "Continuer vers la page Contact", { href: "/contact" }), ed = mk("button", "rc-btn rc-btn--line", "Modifier mon message", { type: "button" });
      ed.addEventListener("click", function () { rc.hidden = true; fm.hidden = false; m.focus(); });
      act.appendChild(a); act.appendChild(ed); rc.appendChild(act); fm.hidden = true; rc.hidden = false; rc.setAttribute("tabindex", "-1"); rc.focus();
    });
  });

  // Contact : reprend le message préparé
  var msg = sess("rc-msg");
  if (msg && /\/contact\/?$/.test(location.pathname)) {
    var ta = one(".lp-main textarea");
    if (ta && !ta.value) {
      ta.value = msg; var main = one(".lp-main form"), nt = mk("p", "rc-notice", "Votre message de condoléances a été repris dans le formulaire ci-dessous. Relisez-le puis envoyez-le.", { role: "status" });
      if (main && main.parentNode) main.parentNode.insertBefore(nt, main);
      try { ta.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
    }
  }

  // Guide : démarches cochables (état gardé sur l'appareil)
  var steps = $("li[data-step]"), prog = one("[data-rc-prog]");
  if (steps.length) {
    var done = {}; try { done = JSON.parse(store("rc-guide") || "{}"); } catch (e) {}
    var upd = function () { var n = steps.filter(function (s) { return s.classList.contains("is-done"); }).length; if (prog) { prog.hidden = false; prog.textContent = n + " démarche" + (n > 1 ? "s" : "") + " faite" + (n > 1 ? "s" : "") + " sur " + steps.length + "."; } };
    steps.forEach(function (li) {
      var id = li.getAttribute("data-step"), t = one(".rc-h3", li).textContent, bt = mk("button", "rc-tick", "", { type: "button" });
      function paint() { var d = !!done[id]; li.classList.toggle("is-done", d); bt.setAttribute("aria-pressed", d ? "true" : "false"); bt.textContent = d ? "Faite" : "Marquer comme faite"; bt.setAttribute("aria-label", (d ? "Faite : " : "Marquer comme faite : ") + t); }
      bt.addEventListener("click", function () { if (done[id]) delete done[id]; else done[id] = 1; store("rc-guide", JSON.stringify(done)); paint(); upd(); });
      paint(); li.appendChild(bt);
    });
    upd();
  }
})();

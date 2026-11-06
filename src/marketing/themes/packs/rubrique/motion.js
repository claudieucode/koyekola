/* Rubrique — comportements : date du jour, progression de lecture, filtres des archives, article hydraté depuis l'ancre, copie du lien. Aucune dépendance. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "rubrique") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };

  // Date du jour dans la manchette
  var dt = $("[data-date]");
  if (dt) { try { dt.textContent = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch (e) {} }

  // Menu mobile : se referme après un clic
  $$(".rb-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Progression de lecture (article) : un simple repère, sans animation lorsque le mouvement est réduit
  var bar = $("[data-prog]");
  if (bar) {
    if (!reduce) bar.style.transition = "transform .1s linear";
    var tick = function () { var h = document.documentElement; var max = h.scrollHeight - h.clientHeight; bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")"; };
    window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick); tick();
  }

  // Copier le lien
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest("[data-copy-link]"); if (!b) return;
    ev.preventDefault();
    var done = function () { var t = b.textContent; b.textContent = "Lien copié ✓"; setTimeout(function () { b.textContent = t; }, 2000); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, done); else done();
  });

  // Archives : filtres par rubrique, auteur, mois, étiquette, texte et tri
  var list = $("[data-list]");
  if (list) {
    var grid = $("[data-grid]", list), cards = $$(".rb-card", grid), empty = $("[data-empty]", list), nEl = $("[data-n]", list);
    var st = { rub: "all", aut: "all", mois: "all", etq: "all", q: "", tri: "new" };
    var slug = function (t) { return t.replace(/[^a-z]/gi, "").toLowerCase(); };
    var box = document.createElement("input"); box.type = "search"; box.placeholder = "Filtrer par mot (titre, étiquette)…"; box.setAttribute("aria-label", "Filtrer les articles par mot");
    var tools = $(".rb-tools", list); if (tools) tools.appendChild(box);
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) {
        var txt = c.getAttribute("data-txt");
        var ok = (st.rub === "all" || c.getAttribute("data-rub") === st.rub) && (st.aut === "all" || c.getAttribute("data-aut") === st.aut) && (st.mois === "all" || c.getAttribute("data-mois") === st.mois) && (!st.q || txt.indexOf(st.q) > -1) && (st.etq === "all" || txt.indexOf(st.etq.toLowerCase()) > -1);
        c.hidden = !ok; if (ok) n++;
      });
      cards.slice().sort(function (a, b) { return st.tri === "pop" ? b.getAttribute("data-views") - a.getAttribute("data-views") : (b.getAttribute("data-date") > a.getAttribute("data-date") ? 1 : -1); }).forEach(function (c) { grid.appendChild(c); });
      if (nEl) nEl.textContent = n; if (empty) empty.classList.toggle("is-on", n === 0);
      $$(".rb-chip", list).forEach(function (c) { var g = c.parentNode.getAttribute("data-g"), on = st[g] === c.getAttribute("data-v"); c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$("a[data-mois]", list).forEach(function (a) { a.classList.toggle("is-on", st.mois === a.getAttribute("data-mois")); });
      $$("[data-etq]", list).forEach(function (a) { a.classList.toggle("is-on", st.etq === a.getAttribute("data-etq")); });
      list.className = "rb-list pk-bleed" + (st.rub !== "all" ? " rb-r-" + st.rub : "");
    };
    var fromHash = function () {
      var m = /^#(rub|aut|tri|mois|etq)-(.+)$/.exec(location.hash); if (!m) return;
      if (m[1] === "etq") { var hit = $$("[data-etq]", list).filter(function (a) { return slug(a.getAttribute("data-etq")) === m[2]; })[0]; st.etq = hit ? hit.getAttribute("data-etq") : "all"; }
      else st[m[1]] = m[2];
      apply();
    };
    list.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href^='#']"); if (!a) return;
      ev.preventDefault();
      if (a.hasAttribute("data-reset")) { st = { rub: "all", aut: "all", mois: "all", etq: "all", q: "", tri: "new" }; box.value = ""; history.replaceState(null, "", "#rub-all"); return apply(); }
      var m = /^#(rub|aut|tri|mois|etq)-/.exec(a.getAttribute("href")); if (!m) return;
      if (m[1] === "mois") st.mois = st.mois === a.getAttribute("data-mois") ? "all" : a.getAttribute("data-mois");
      else if (m[1] === "etq") st.etq = st.etq === a.getAttribute("data-etq") ? "all" : a.getAttribute("data-etq");
      else st[m[1]] = a.getAttribute("data-v");
      history.replaceState(null, "", a.getAttribute("href")); apply();
    });
    box.addEventListener("input", function () { st.q = box.value.trim().toLowerCase(); apply(); });
    window.addEventListener("hashchange", fromHash); fromHash(); apply();
  }

  // Article : le contenu est lu dans le magasin de la page selon l'ancre (#a1 … #a16)
  var art = $("[data-art]");
  if (art) {
    var store = {}; $$(".rb-store [data-id]").forEach(function (d) { store[d.getAttribute("data-id")] = d; });
    var names = { soc: "Société", cul: "Culture", cui: "Cuisine", voy: "Voyage", ide: "Idées" };
    var who = { cm: ["Claire Maurel", "Rédactrice en chef"], ib: ["Idriss Benali", "Reporter"], hv: ["Hélène Vasseur", "Critique culture"], tl: ["Thomas Lefèvre", "Voyageur et photographe"], nr: ["Nadia Roussel", "Cuisinière et autrice"] };
    var P = function (k) { return $$('[data-p="' + k + '"]'); };
    var set = function (k, t) { P(k).forEach(function (e) { e.textContent = t; }); };
    var ids = Object.keys(store), cur = "a1";
    var render = function () {
      var id = location.hash.slice(1); if (!store[id]) id = "a1"; if (id === cur && id === "a1") return;
      var d = store[id], rub = d.getAttribute("data-rub"), w = who[d.getAttribute("data-a")]; cur = id;
      art.className = "rb-art-h pk-bleed rb-r-" + rub;
      set("title", d.getAttribute("data-t")); set("chapo", d.getAttribute("data-c")); set("kick", names[rub]); set("crumbr", names[rub]);
      var ini = w[0].split(" ").map(function (x) { return x[0]; }).join("");
      set("aut", w[0]); set("aut2", w[0]); set("aut3", w[0]); set("role", w[1]); set("av", ini); set("av2", ini); set("bio", w[1] + " dans la rédaction.");
      set("when", d.getAttribute("data-d") + " · " + d.getAttribute("data-m") + " min de lecture");
      P("tags").forEach(function (e) { e.innerHTML = ""; d.getAttribute("data-tags").split("|").forEach(function (t) { var a = document.createElement("a"); a.href = "/articles"; a.textContent = t; e.appendChild(a); }); });
      var body = $('[data-p="body"]'); body.innerHTML = "";
      $$("p", d).forEach(function (p) { var n = document.createElement("p"); n.textContent = p.textContent; body.appendChild(n); });
      document.title = d.getAttribute("data-t");
      var i = ids.indexOf(id), pv = $("[data-prev]"), nx = $("[data-next]");
      if (pv) pv.setAttribute("href", "/article#" + ids[(i + ids.length - 1) % ids.length]);
      if (nx) nx.setAttribute("href", "/article#" + ids[(i + 1) % ids.length]);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", render); render();
  }
})();

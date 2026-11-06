// Balance — comportements du thème : comparateur à trois colonnes (meilleure valeur surlignée), classement filtrable par budget et triable, bascule du test affiché selon l'adresse
// (note, critères, points forts, lien d'offre), compteurs. Aucune dépendance ; sans script, le tableau comparatif montre les huit colonnes et chaque lien fonctionne.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "balance") return;
  var body = document.body;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";
  var CRIT = ["Qualité du café", "Facilité d'usage", "Entretien", "Rapport qualité-prix"];

  if (!calm && "IntersectionObserver" in window) {
    body.classList.add("bl-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (n) { if (n.getBoundingClientRect().top < window.innerHeight) n.classList.add("is-in"); else io.observe(n); });
    setTimeout(function () { $$("[data-reveal]").forEach(function (n) { n.classList.add("is-in"); }); }, 2500);
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; co.unobserve(e.target);
        var el = e.target, to = +el.getAttribute("data-count"), t0 = null;
        (function step(t) { if (t0 === null) t0 = t; var p = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
      });
    }, { threshold: .5 });
    $$("[data-count]").forEach(function (n) { co.observe(n); });
  }

  // ----- classement : filtre par budget, tri -----
  var fil = $("[data-filters]"), list = $("[data-list]");
  if (fil && list) {
    var items = $$(".bl-r", list), empty = $("[data-empty]"), cnt = $("[data-count-n]"), st = { budget: "", sort: "score" };
    var apply = function () {
      var n = 0; items.forEach(function (it) { var ok = !st.budget || it.getAttribute("data-budget") === st.budget; it.hidden = !ok; if (ok) n++; });
      $$("[data-budget]", fil).forEach(function (c) { var v = c.getAttribute("data-budget"), on = (v === "tous" ? "" : v) === st.budget; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$("[data-sort]", fil).forEach(function (c) { var on = c.getAttribute("data-sort") === st.sort; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      var cmp = st.sort === "price" ? function (a, b) { return a.getAttribute("data-price") - b.getAttribute("data-price"); } : function (a, b) { return a.getAttribute("data-n") - b.getAttribute("data-n"); };
      items.slice().sort(cmp).forEach(function (it, i) { list.appendChild(it); $(".bl-r-n", it).textContent = i + 1; });
      if (empty) empty.hidden = n > 0; if (cnt) cnt.textContent = n;
    };
    var fromHash = function () { var h = (location.hash || "").slice(1); st.budget = h && h !== "tous" && $("[data-budget='" + h + "']", fil) ? h : ""; };
    fromHash(); apply();
    fil.addEventListener("click", function (ev) {
      var c = ev.target.closest && ev.target.closest(".bl-chip"); if (!c) return; ev.preventDefault();
      if (c.hasAttribute("data-sort")) st.sort = c.getAttribute("data-sort"); else { var v = c.getAttribute("data-budget"); st.budget = v === "tous" ? "" : v; try { history.replaceState(null, "", st.budget ? "#" + st.budget : location.pathname); } catch (e) {} }
      apply();
    });
    window.addEventListener("hashchange", function () { fromHash(); apply(); });
  }

  // ----- comparateur -----
  var pick = $("[data-pick]"), cmp = $("[data-cmp]");
  if (pick && cmp) {
    var chips = $$("[data-pid]", pick), msg = $("[data-msg]", pick), MAX = 3;
    var sel = chips.filter(function (c) { return c.classList.contains("is-on"); }).map(function (c) { return c.getAttribute("data-pid"); });
    var render = function () {
      $$("[data-col]", cmp).forEach(function (cell) { cell.hidden = sel.indexOf(cell.getAttribute("data-col")) < 0; });
      chips.forEach(function (c) { var on = sel.indexOf(c.getAttribute("data-pid")) > -1; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      $$("[data-row]", cmp).forEach(function (r) {
        var cells = $$("td[data-v]", r).filter(function (td) { return !td.hidden; }); cells.forEach(function (td) { td.classList.remove("is-best"); });
        if (cells.length < 2) return;
        var low = r.hasAttribute("data-low"), best = cells.reduce(function (b, td) { var v = +td.getAttribute("data-v"); return b === null || (low ? v < b : v > b) ? v : b; }, null);
        cells.forEach(function (td) { if (+td.getAttribute("data-v") === best) td.classList.add("is-best"); });
      });
      msg.textContent = sel.length + " modèle" + (sel.length > 1 ? "s" : "") + " comparé" + (sel.length > 1 ? "s" : "") + (sel.length >= MAX ? " (maximum atteint : retirez-en un pour en ajouter)" : "");
    };
    pick.addEventListener("click", function (ev) {
      var c = ev.target.closest && ev.target.closest("[data-pid]"); if (!c) return; ev.preventDefault();
      var id = c.getAttribute("data-pid"), i = sel.indexOf(id);
      if (i > -1) { if (sel.length > 1) sel.splice(i, 1); } else if (sel.length < MAX) sel.push(id); else { msg.textContent = "Trois modèles au maximum : retirez-en un d'abord."; return; }
      render();
    });
    render();
  }

  // ----- test affiché selon l'adresse -----
  var store = $("[data-data]"), tbody = $("[data-t-body]");
  if (store && tbody) {
    var arc = function (s) { var r = 40, a = Math.min(359.9, s / 10 * 360) * Math.PI / 180; return "M50 10 A40 40 0 " + (a > Math.PI ? 1 : 0) + " 1 " + (50 + r * Math.sin(a)).toFixed(2) + " " + (50 - r * Math.cos(a)).toFixed(2); };
    var show = function () {
      var h = (location.hash || "").slice(1), a = h ? $("[data-slug='" + h + "']", store) : null; if (!a) return;
      var name = a.getAttribute("data-name"), g = a.getAttribute("data-g"), s = a.getAttribute("data-s").split("|"), pros = a.getAttribute("data-pros").split("|"), cons = a.getAttribute("data-cons").split("|");
      $("[data-t-title]").textContent = "Test de la " + name + " : " + a.getAttribute("data-verdict").split(".")[0].toLowerCase();
      $("[data-t-lead]").textContent = a.getAttribute("data-verdict"); $("[data-t-crumb]").textContent = name;
      $("[data-t-type]").textContent = a.getAttribute("data-type") + " · testée " + a.getAttribute("data-weeks") + " semaines";
      $("[data-t-g]").textContent = g; var fg = $(".bl-score .bl-dial-fg"); if (fg) fg.setAttribute("d", arc(parseFloat(g.replace(",", "."))));
      var div = function (t, txt) { var e = document.createElement(t); e.textContent = txt; return e; };
      tbody.textContent = "";
      tbody.appendChild(div("p", name + " est un modèle de type « " + a.getAttribute("data-type").toLowerCase() + " », testé pendant " + a.getAttribute("data-weeks") + " semaines selon la même méthode que les autres machines de notre sélection."));
      tbody.appendChild(div("h2", "Notre verdict")); tbody.appendChild(div("p", a.getAttribute("data-verdict")));
      tbody.appendChild(div("h2", "Pour qui ?")); tbody.appendChild(div("p", a.getAttribute("data-ideal")));
      tbody.appendChild(div("h2", "Ce que nous avons relevé"));
      var ul = document.createElement("ul"); pros.forEach(function (x) { ul.appendChild(div("li", "+ " + x)); }); cons.forEach(function (x) { ul.appendChild(div("li", "− " + x)); }); tbody.appendChild(ul);
      var side = $("[data-t-side]"); var top = $(".bl-v-top b", side); if (top) top.textContent = a.getAttribute("data-price") + " €";
      $$(".bl-crit li", side).forEach(function (li, i) { $("b", li).textContent = s[i]; var rect = $$("rect", li)[1]; if (rect) rect.setAttribute("width", String(Math.round(parseFloat(s[i].replace(",", ".")) * 10))); });
      var lists = $$(".bl-pc ul", side); [pros, cons].forEach(function (arr, k) { if (lists[k]) { lists[k].textContent = ""; arr.forEach(function (x) { lists[k].appendChild(div("li", x)); }); } });
      var idl = $(".bl-ideal", side); if (idl) { idl.textContent = ""; var b = div("b", "Idéale pour : "); idl.appendChild(b); idl.appendChild(document.createTextNode(a.getAttribute("data-ideal"))); }
      var link = $("a[rel~='sponsored']"); if (link) { link.setAttribute("href", "https://example.com/offre/" + h); link.textContent = "Voir l'offre pour " + name + " (lien affilié)"; }
      document.title = "Test " + name;
    };
    show(); window.addEventListener("hashchange", show);
  }
})();

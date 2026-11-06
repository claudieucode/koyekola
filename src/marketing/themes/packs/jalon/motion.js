/* Jalon — filtres du journal (type, version majeure, mot), mémoire du filtre dans l'adresse, recherche dans les versions. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "jalon") return;
  var one = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };
  b.classList.add("jl-js");

  // Journal : filtres par type de changement, par version majeure et par mot ; les versions sans ligne visible se replient
  var tools = one("[data-jl-tools]");
  if (tools) {
    var road = one("[data-jl-road]"), rels = all(".jl-rel", road), cnt = one("[data-jl-count]"), none = one("[data-jl-none]");
    var TYPES = [["", "Tout"], ["nouveau", "Nouveautés"], ["mieux", "Améliorations"], ["correctif", "Correctifs"], ["securite", "Sécurité"]];
    var majors = []; rels.forEach(function (r) { var m = r.getAttribute("data-v"); if (majors.indexOf(m) < 0) majors.push(m); });
    var type = "", maj = "";
    var inp = document.createElement("input"); inp.type = "search"; inp.className = "jl-find"; inp.placeholder = "Un mot : calendrier, mobile, sécurité…"; inp.setAttribute("aria-label", "Chercher dans le journal"); inp.autocomplete = "off"; tools.appendChild(inp);
    var sel = document.createElement("select"); sel.className = "jl-sel"; sel.setAttribute("aria-label", "Version majeure");
    var o0 = document.createElement("option"); o0.value = ""; o0.textContent = "Toutes les versions"; sel.appendChild(o0);
    majors.forEach(function (m) { var o = document.createElement("option"); o.value = m; o.textContent = "Version " + m + ".x"; sel.appendChild(o); });
    tools.appendChild(sel);
    var chips = TYPES.map(function (t) { var bt = document.createElement("button"); bt.type = "button"; bt.className = "jl-chip"; bt.textContent = t[1]; bt.setAttribute("data-t", t[0]); bt.setAttribute("aria-pressed", t[0] ? "false" : "true"); tools.appendChild(bt); return bt; });
    var apply = function (fromUser) {
      var q = norm(inp.value).split(/\s+/).filter(Boolean), nr = 0, ni = 0;
      rels.forEach(function (r) {
        var okMaj = !maj || r.getAttribute("data-v") === maj, hay = norm(r.getAttribute("data-s")), okQ = q.every(function (w) { return hay.indexOf(w) >= 0; }), shown = 0;
        all(".jl-items li", r).forEach(function (li) {
          var t = li.getAttribute("data-t"), tx = norm(li.textContent), ok = (!type || t === type) && (!q.length || q.every(function (w) { return tx.indexOf(w) >= 0 || norm(one(".jl-rel-m", r).textContent + " " + one("h2,h3", r).textContent).indexOf(w) >= 0; }));
          li.hidden = !ok; if (ok) shown++;
        });
        var vis = okMaj && okQ && shown > 0; if (vis && r.hidden && fromUser) { r.classList.remove("is-shown"); void r.offsetWidth; r.classList.add("is-shown"); }
        r.hidden = !vis; if (vis) { nr++; ni += shown; }
      });
      if (cnt) cnt.textContent = plural(nr, "version") + " · " + plural(ni, "changement");
      if (none) none.hidden = nr > 0;
      try { var h = type || ""; history.replaceState(null, "", location.pathname + (h ? "#" + h : "")); } catch (e) {}
    };
    inp.addEventListener("input", function () { apply(true); }); sel.addEventListener("change", function () { maj = sel.value; apply(true); });
    chips.forEach(function (bt) { bt.addEventListener("click", function () { type = bt.getAttribute("data-t"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); }); apply(true); }); });
    var h0 = (location.hash || "").slice(1), pre = chips.filter(function (x) { return h0 && x.getAttribute("data-t") === h0; })[0]; if (pre) pre.click(); else apply(false);
  }

  // Page de recherche : filtre les versions selon ?q=
  var idx = one("[data-jl-index]");
  if (idx) {
    var rels2 = all(".jl-rel", idx), empty = one("[data-jl-empty]"), rc = one("[data-jl-rcount]"), qs = "";
    try { qs = new URLSearchParams(location.search).get("q") || ""; } catch (e) {}
    var inp2 = one(".lp-main input[type=search], .lp-main input[name=q]");
    var run = function (val) {
      var q = norm(val).split(/\s+/).filter(Boolean), n = 0;
      rels2.forEach(function (r) { var ok = q.every(function (w) { return norm(r.getAttribute("data-s")).indexOf(w) >= 0; }); r.hidden = !ok; if (ok) n++; });
      if (rc) rc.textContent = q.length ? plural(n, "résultat") + " pour « " + val + " »" : "Saisissez un mot dans la recherche, ou parcourez les versions.";
      if (empty) { empty.hidden = !(q.length && !n); var s = one("[data-jl-q]", empty); if (s) s.textContent = val; }
    };
    if (qs) { run(qs); if (inp2 && !inp2.value) inp2.value = qs; }
    if (inp2) inp2.addEventListener("input", function () { run(inp2.value); });
  }
})();

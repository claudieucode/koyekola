/* Plume — filet de progression, filtre des archives (mot, rubrique) et recherche dans l'index. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "plume") return;
  var one = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  b.classList.add("pl-js");
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };

  // Filet de progression de lecture (articles uniquement) ; vertical quand l'en-tête est un rail
  var prog = one("[data-pl-prog]"), art = one(".pl-article");
  if (prog && art) {
    var upd = function () {
      var r = art.getBoundingClientRect(), tot = r.height - window.innerHeight;
      var p = tot > 0 ? Math.min(1, Math.max(0, -r.top / tot)) : 0;
      if (b.getAttribute("data-pk-entete") === "rail" && window.innerWidth >= 1000) { prog.style.height = (p * 100) + "%"; prog.style.width = ""; }
      else { prog.style.width = (p * 100) + "%"; prog.style.height = ""; }
    };
    window.addEventListener("scroll", upd, { passive: true }); window.addEventListener("resize", upd); upd();
  }

  // Archives : champ de recherche et filtres par rubrique
  var tools = one("[data-pl-tools]");
  if (tools) {
    var items = all(".pl-item"), years = all(".pl-year"), none = one("[data-pl-none]"), count = one("[data-pl-count]");
    var cats = []; items.forEach(function (li) { var c = li.getAttribute("data-c"); if (cats.indexOf(c) < 0) cats.push(c); });
    var inp = document.createElement("input"); inp.type = "search"; inp.className = "pl-find"; inp.placeholder = "Chercher un mot, un titre, un nom…"; inp.setAttribute("aria-label", "Chercher dans les archives"); inp.autocomplete = "off";
    tools.appendChild(inp);
    var chips = [];
    ["Toutes"].concat(cats).forEach(function (c, i) {
      var bt = document.createElement("button"); bt.type = "button"; bt.className = "pl-chip"; bt.textContent = c; bt.setAttribute("aria-pressed", i === 0 ? "true" : "false"); bt.setAttribute("data-c", i === 0 ? "" : c);
      tools.appendChild(bt); chips.push(bt);
    });
    var cur = "";
    var apply = function () {
      var q = norm(inp.value).split(/\s+/).filter(Boolean), total = 0;
      items.forEach(function (li) {
        var hay = norm(li.getAttribute("data-s")), ok = (!cur || li.getAttribute("data-c") === cur) && q.every(function (w) { return hay.indexOf(w) >= 0; });
        li.hidden = !ok; if (ok) total++;
      });
      years.forEach(function (y) { var n = all(".pl-item:not([hidden])", y).length; y.hidden = !n; var s = one("[data-n]", y); if (s) s.textContent = plural(n, "texte"); });
      if (count) count.textContent = plural(total, "texte") + (cur || q.length ? " trouvé" + (total > 1 ? "s" : "") : "");
      if (none) none.hidden = total > 0;
    };
    inp.addEventListener("input", apply);
    chips.forEach(function (bt) { bt.addEventListener("click", function () { cur = bt.getAttribute("data-c"); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); }); apply(); }); });
    var h = decodeURIComponent((location.hash || "").slice(1)).toLowerCase();
    var m = h ? chips.filter(function (x) { return x.getAttribute("data-c").toLowerCase() === h; })[0] : null; if (m) m.click();
  }

  // Page de recherche : filtre l'index des textes selon ?q= (le bloc de recherche du CMS reste disponible au-dessus)
  var idx = one("[data-pl-index]");
  if (idx) {
    var items2 = all(".pl-item", idx), empty = one("[data-pl-empty]"), rc = one("[data-pl-rcount]"), qs = "";
    try { qs = new URLSearchParams(location.search).get("q") || ""; } catch (e) {}
    var inp2 = one(".lp-main input[type=search], .lp-main input[name=q]");
    var run = function (val) {
      var q = norm(val).split(/\s+/).filter(Boolean), n = 0;
      items2.forEach(function (li) { var hay = norm(li.getAttribute("data-s")), ok = q.every(function (w) { return hay.indexOf(w) >= 0; }); li.hidden = !ok; if (ok) n++; });
      if (rc) rc.textContent = q.length ? plural(n, "résultat") + " pour « " + val + " »" : "Saisissez un mot dans la recherche, ou parcourez l'index ci-dessous.";
      if (empty) { empty.hidden = !(q.length && !n); var s = one("[data-pl-q]", empty); if (s) s.textContent = val; }
    };
    if (qs) { run(qs); if (inp2 && !inp2.value) inp2.value = qs; }
    if (inp2) inp2.addEventListener("input", function () { run(inp2.value); });
  }
})();

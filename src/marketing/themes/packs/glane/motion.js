/* Glane — comportements : filtres de la veille (thème, type, source, mot), suivi « lu », sélection « pour la lettre » et digest Markdown copiable, numéro d'édition, copie du lien. */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "glane") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };
  var toast = function (t) { var e = $(".gl-gl-toast"); if (!e) { e = document.createElement("div"); e.className = "gl-gl-toast"; e.setAttribute("role", "status"); document.body.appendChild(e); } e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { e.hidden = true; }, 2400); };
  var copy = function (txt, ok) {
    var fb = function () { var a = document.createElement("textarea"); a.value = txt; a.setAttribute("readonly", ""); a.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(a); a.select(); try { document.execCommand("copy"); ok(); } catch (e) { toast("Copie impossible"); } document.body.removeChild(a); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, fb); else fb();
  };

  $$(".gl-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  document.addEventListener("click", function (ev) { var b = ev.target.closest && ev.target.closest("[data-copy-link]"); if (!b) return; ev.preventDefault(); copy(location.href, function () { toast("Lien copié"); }); });

  var items = $$(".gl-it");
  if (!items.length) return;
  var KEY = "glane-suivi", memo = { read: {}, pick: {} };
  try { memo = JSON.parse(localStorage.getItem(KEY) || "") || memo; } catch (e) {}
  memo.read = memo.read || {}; memo.pick = memo.pick || {};
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(memo)); } catch (e) {} };

  var veille = $("[data-veille]"), st = { th: "all", typ: "all", src: "all", q: "" };
  var counters = function () {
    var shown = items.filter(function (i) { return !i.hidden; });
    var n = $("[data-n]"), u = $("[data-unread]"), p = $("[data-pn]"), e = $("[data-empty]");
    if (n) n.textContent = shown.length; if (u) u.textContent = shown.filter(function (i) { return !memo.read[i.getAttribute("data-id")]; }).length;
    if (p) p.textContent = Object.keys(memo.pick).filter(function (k) { return memo.pick[k]; }).length;
    if (e) e.classList.toggle("is-on", shown.length === 0);
    $$("[data-week]").forEach(function (w) { var c = $$(".gl-it", w).filter(function (i) { return !i.hidden; }).length; w.hidden = veille ? c === 0 : false; var l = $("[data-wn]", w); if (l) l.textContent = c + " lien" + (c > 1 ? "s" : ""); });
  };
  var paint = function () {
    items.forEach(function (i) {
      var id = i.getAttribute("data-id"), r = !!memo.read[id], p = !!memo.pick[id];
      i.classList.toggle("is-read", r);
      var rb = $("[data-read]", i), pb = $("[data-pick]", i);
      if (rb) { rb.setAttribute("aria-pressed", r ? "true" : "false"); rb.textContent = r ? "Lu" : "Marquer comme lu"; }
      if (pb) { pb.setAttribute("aria-pressed", p ? "true" : "false"); pb.textContent = p ? "Dans la lettre" : "Pour la lettre"; }
    });
    counters();
  };
  var apply = function () {
    items.forEach(function (i) {
      var ok = (st.th === "all" || i.getAttribute("data-th") === st.th) && (st.typ === "all" || i.getAttribute("data-typ") === st.typ) && (st.src === "all" || i.getAttribute("data-src") === st.src) && (!st.q || i.getAttribute("data-txt").indexOf(st.q) > -1);
      i.hidden = !ok;
    });
    $$(".gl-chip").forEach(function (c) { var g = c.parentNode.getAttribute("data-g"), on = st[g] === c.getAttribute("data-v"); c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
    counters();
  };

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("[data-read],[data-pick],.gl-chip,[data-digest],[data-reset]"); if (!t) return;
    ev.preventDefault();
    if (t.hasAttribute("data-read")) { var id = t.getAttribute("data-read"); memo.read[id] = !memo.read[id]; save(); paint(); return; }
    if (t.hasAttribute("data-pick")) { var k = t.getAttribute("data-pick"); memo.pick[k] = !memo.pick[k]; save(); paint(); return; }
    if (t.hasAttribute("data-reset")) { st = { th: "all", typ: "all", src: "all", q: "" }; var b = $(".gl-search"); if (b) b.value = ""; history.replaceState(null, "", "#theme-all"); apply(); return; }
    if (t.hasAttribute("data-digest")) {
      var chosen = items.filter(function (i) { return memo.pick[i.getAttribute("data-id")]; }); if (!chosen.length) chosen = items.filter(function (i) { return !i.hidden; }).slice(0, 8);
      var md = "## La veille Glane\n\n" + chosen.map(function (i) { var a = $(".gl-it-t a", i); return "- [" + a.textContent + "](" + a.getAttribute("href") + ") (" + $(".gl-it-s", i).textContent + ") — " + $(".gl-note", i).textContent.trim(); }).join("\n") + "\n";
      copy(md, function () { toast("Digest copié : " + chosen.length + " lien" + (chosen.length > 1 ? "s" : "")); }); return;
    }
    if (t.classList.contains("gl-chip")) { st[t.parentNode.getAttribute("data-g")] = t.getAttribute("data-v"); history.replaceState(null, "", t.getAttribute("href")); apply(); }
  });

  if (veille) {
    var box = document.createElement("input"); box.type = "search"; box.className = "gl-search"; box.placeholder = "Filtrer par mot (titre, note)…"; box.setAttribute("aria-label", "Filtrer les liens par mot");
    var bar = $(".gl-bar", veille); if (bar) bar.parentNode.insertBefore(box, bar);
    box.addEventListener("input", function () { st.q = box.value.trim().toLowerCase(); apply(); });
    var m = /^#(theme|type|source)-(\w+)$/.exec(location.hash); if (m) st[{ theme: "th", type: "typ", source: "src" }[m[1]]] = m[2];
  }
  apply(); paint();
})();

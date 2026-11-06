// Préface — comportements du thème : compte à rebours réel (date lue dans l'attribut data-launch du bloc « cadran », plus le réglage « report » en jours),
// barre d'avancement, jalons cochés selon la date du jour, filtre du journal, numéro de page. Aucune dépendance ; sans script, les dates restent écrites en toutes lettres.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "preface") return;
  var body = document.body;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var DEFAULT_LAUNCH = "2027-03-15T09:00:00+01:00", DEFAULT_START = "2026-06-02";

  // ----- date d'ouverture : bloc cadran (modifiable) + report en jours -----
  var cad = $("[data-launch]");
  var report = parseInt((getComputedStyle(body).getPropertyValue("--pk-report") || body.getAttribute("data-pk-report") || "0").trim(), 10) || 0;
  var launch = new Date(cad ? cad.getAttribute("data-launch") : DEFAULT_LAUNCH);
  if (isNaN(launch.getTime())) launch = new Date(DEFAULT_LAUNCH);
  launch = new Date(launch.getTime() + report * 864e5);
  var start = new Date((cad && cad.getAttribute("data-start") || DEFAULT_START) + "T00:00:00");
  var cells = { d: $$("[data-cd='d']"), h: $$("[data-cd='h']"), m: $$("[data-cd='m']"), s: $$("[data-cd='s']") };
  var pad = function (n) { return n < 10 ? "0" + n : String(n); };
  var set = function (k, v, fx) { cells[k].forEach(function (n) { if (n.textContent !== v) { n.textContent = v; if (fx && !calm) { n.classList.remove("is-tick"); void n.offsetWidth; n.classList.add("is-tick"); } } }); };
  function tick() {
    var left = Math.max(0, launch.getTime() - Date.now());
    var d = Math.floor(left / 864e5), h = Math.floor(left % 864e5 / 36e5), m = Math.floor(left % 36e5 / 6e4), s = Math.floor(left % 6e4 / 1e3);
    set("d", String(d)); set("h", pad(h)); set("m", pad(m)); set("s", pad(s), true);
    if (cad) {
      var done = left === 0;
      $$(".pf-cad-u", cad).forEach(function (u) { u.hidden = done; });
      var msg = $("[data-done]", cad); if (msg) msg.hidden = !done;
      cad.setAttribute("aria-label", done ? "L'ouverture a eu lieu" : "Ouverture dans " + d + " jours, " + h + " heures et " + m + " minutes");
    }
    var tot = launch.getTime() - start.getTime(), pct = tot > 0 ? Math.max(0, Math.min(100, (Date.now() - start.getTime()) / tot * 100)) : 100;
    var bar = $("[data-elapsed]"), pc = $("[data-pct]");
    if (bar) bar.style.width = pct.toFixed(1) + "%"; if (pc) pc.textContent = Math.round(pct) + " %";
  }
  tick(); setInterval(tick, 1000);

  // ----- jalons selon la date du jour -----
  var js = $$("[data-jalons] .pf-j"), nextTitle = "";
  var now = Date.now(), first = true;
  js.forEach(function (j) {
    var t = new Date(j.getAttribute("data-date") + "T23:59:59").getTime();
    var st = $("[data-state]", j);
    if (j.getAttribute("data-date") === launch.toISOString().slice(0, 10) || j === js[js.length - 1]) { /* l'ouverture suit la date réglée */ t = launch.getTime(); }
    if (t < now) { j.classList.add("is-done"); st.textContent = "fait"; }
    else if (first) { j.classList.add("is-next"); st.textContent = "prochaine étape"; first = false; nextTitle = $(".pf-j-t", j).textContent; }
    else st.textContent = "à venir";
  });
  var nx = $("[data-nextj]");
  if (nx) {
    var arr = $$(".pf-j"); var nxt = null;
    if (!js.length) { /* page d'accueil : étapes connues */ var L = [["2026-11-20", "pose des rayonnages"], ["2027-01-12", "commande des premiers livres"], ["2027-02-05", "recrutement de l'équipe"], ["2027-02-27", "soirée des voisins"]]; for (var i = 0; i < L.length; i++) if (new Date(L[i][0] + "T23:59:59").getTime() >= now) { nxt = L[i][1]; break; } nx.textContent = nxt ? "prochaine étape : " + nxt : "dernière ligne droite"; }
  }

  // ----- journal : filtre -----
  var fil = $("[data-filters]");
  if (fil) {
    var items = $$(".pf-b"), empty = $("[data-empty]"), cur = "";
    var apply = function () {
      var n = 0; items.forEach(function (it) { var ok = !cur || it.getAttribute("data-tag") === cur; it.hidden = !ok; if (ok) n++; });
      $$(".pf-chip", fil).forEach(function (c) { var v = c.getAttribute("data-tag"), on = (v === "tous" ? "" : v) === cur; c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
      if (empty) empty.hidden = n > 0;
    };
    var fromHash = function () { var h = (location.hash || "").slice(1); cur = h && h !== "tous" && $("[data-tag='" + h + "']", fil) ? h : ""; };
    fromHash(); apply();
    fil.addEventListener("click", function (ev) { var c = ev.target.closest && ev.target.closest(".pf-chip"); if (!c) return; ev.preventDefault(); var v = c.getAttribute("data-tag"); cur = v === "tous" ? "" : v; try { history.replaceState(null, "", cur ? "#" + cur : location.pathname); } catch (e) {} apply(); });
    window.addEventListener("hashchange", function () { fromHash(); apply(); });
  }

  // ----- numéro de page (un hasard stable par adresse) et révélation -----
  var f = $("[data-folio]");
  if (f) { var p = location.pathname, h = 0; for (var k = 0; k < p.length; k++) h = (h * 31 + p.charCodeAt(k)) % 97; f.textContent = String(h % 40 + 1); }
  if (!calm && "IntersectionObserver" in window) {
    body.classList.add("pf-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
    $$("[data-reveal]").forEach(function (n) { io.observe(n); });
  }
})();

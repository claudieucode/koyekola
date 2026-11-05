/* Sève — animations douces, sans dépendance. Toutes désactivées si l'utilisateur préfère moins de mouvement ; aucun contenu n'est masqué sans JavaScript. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "seve") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("sv-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });
  }

  // Taille du texte (mémorisée si possible)
  function setSize(v, save) {
    b.classList.toggle("sv-big", v === "grand");
    $$("[data-size]").forEach(function (a) { a.setAttribute("aria-pressed", a.getAttribute("data-size") === v ? "true" : "false"); });
    if (save) { try { localStorage.setItem("sv-size", v); } catch (e) {} }
  }
  $$("[data-size]").forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); setSize(a.getAttribute("data-size"), true); }); });
  try { var st = localStorage.getItem("sv-size"); if (st === "grand" || st === "normal") setSize(st, false); } catch (e) {}

  // Statut d'ouverture et jour courant dans les horaires
  var now = new Date(), day = now.getDay(), hr = now.getHours() + now.getMinutes() / 60;
  function openNow(spec) {
    var ok = false, until = null;
    spec.split(";").forEach(function (p) {
      var a = p.split(":"), d = parseInt(a[0].split("-")[0], 10), d2 = parseInt((a[0].split("-")[1] || a[0].split("-")[0]), 10), h = a[1].split("-");
      var s = parseFloat(h[0]), e = parseFloat(h[1]);
      if (day >= d && day <= d2 && hr >= s && hr < e) { ok = true; until = e; }
    });
    return { ok: ok, until: until };
  }
  function fmt(h) { var m = Math.round((h % 1) * 60); return Math.floor(h) + " h" + (m ? " " + (m < 10 ? "0" + m : m) : ""); }
  $$("[data-open]").forEach(function (el) {
    var r = openNow(el.getAttribute("data-open"));
    el.classList.add(r.ok ? "is-open" : "is-closed");
    el.textContent = r.ok ? "Accueil ouvert jusqu'à " + fmt(r.until) : "Accueil fermé actuellement";
  });
  $$("[data-open-short]").forEach(function (el) {
    var r = openNow(el.getAttribute("data-open-short"));
    el.textContent = r.ok ? "Ouvert jusqu'à " + fmt(r.until) : "Accueil fermé pour l'instant";
  });
  $$(".sv-hours tr[data-day]").forEach(function (tr) { if (parseInt(tr.getAttribute("data-day"), 10) === day) tr.classList.add("is-today"); });

  // Respiration guidée (texte alterné ; le cercle est animé en CSS)
  $$("[data-breath]").forEach(function (box) {
    var lab = box.querySelector("[data-breath-label]"); if (!lab) return;
    if (reduce) { lab.textContent = "Respirez"; return; }
    var phase = 0, words = ["Inspirez", "Expirez"];
    lab.textContent = words[0];
    setInterval(function () { phase = 1 - phase; lab.textContent = words[phase]; }, 4500);
  });

  // Filtres (soins, conseils, FAQ)
  $$(".sv-fscope").forEach(function (scope) {
    var chips = $$("[data-filter]", scope), items = $$("[data-cat]", scope), out = scope.querySelector("[data-fcount]");
    chips.forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        var f = a.getAttribute("data-filter"), n = 0;
        chips.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        items.forEach(function (it) { var show = f === "tous" || it.getAttribute("data-cat") === f; it.hidden = !show; if (show) n++; });
        if (out) out.textContent = n;
      });
    });
  });

  // Menu mobile : se referme au clic sur un lien
  $$(".sv-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
  // Un seul conseil ou une seule réponse ouverte à la fois par liste
  $$(".sv-arts,.sv-faq-list").forEach(function (list) {
    $$("details", list).forEach(function (d) { d.addEventListener("toggle", function () { if (d.open) $$("details", list).forEach(function (o) { if (o !== d) o.open = false; }); }); });
  });
})();

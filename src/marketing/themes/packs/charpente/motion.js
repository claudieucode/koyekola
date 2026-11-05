/* Charpente — curseur avant/après, filtres, fiche chantier, onglets, apparitions. Sans dépendance ; calme si l'utilisateur préfère moins de mouvement. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "charpente") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var tx = function (s) { return String(s == null ? "" : s); };
  function esc(s) { return tx(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Hauteur de l'en-tête (menu mobile) + page courante
  var head = document.querySelector(".cp-head");
  function size() { if (head) b.style.setProperty("--cp-headh", head.offsetHeight + "px"); }
  size(); window.addEventListener("resize", size);
  var here = location.pathname.replace(/\/+$/, "").split("/").pop();
  all(".cp-nav a, .cp-drawer a").forEach(function (a) { var h = a.getAttribute("href").replace(/\/+$/, "").split("/").pop(); if (h && h === here) a.setAttribute("aria-current", "page"); });
  all(".cp-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.removeAttribute("open"); }); });

  // Apparitions et poutres qui s'assemblent
  if (!reduce) {
    b.classList.add("cp-js");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      all("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
      all(".cp-g-t").forEach(function (el) { io.observe(el); });
    } else { all("[data-reveal]").forEach(function (el) { el.classList.add("is-in"); }); }
  }

  // Compteurs
  function run(el) {
    var to = parseFloat(el.getAttribute("data-to")); if (isNaN(to)) return; var t0 = null;
    function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1300); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  var counters = all("[data-to]");
  if (!reduce && "IntersectionObserver" in window && counters.length) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(e.target); co.unobserve(e.target); } }); }, { threshold: 0.4 });
    counters.forEach(function (c) { co.observe(c); });
  }

  // Curseur avant / après : souris, tactile, clavier, lecteur d'écran
  function initBA(box) {
    var h = box.querySelector(".cp-ba-h"); if (!h || box.__ba) return; box.__ba = 1;
    var pos = 50, drag = false;
    h.setAttribute("tabindex", "0"); h.setAttribute("aria-orientation", "horizontal"); h.setAttribute("aria-valuemin", "0"); h.setAttribute("aria-valuemax", "100");
    function set(v) {
      pos = Math.max(0, Math.min(100, v)); box.style.setProperty("--cp-pos", pos + "%");
      h.setAttribute("aria-valuenow", Math.round(pos));
      h.setAttribute("aria-valuetext", pos < 8 ? "Avant, entièrement visible" : pos > 92 ? "Après, entièrement visible" : Math.round(100 - pos) + " % de l'après visible");
    }
    function from(ev) { var r = box.getBoundingClientRect(); set((ev.clientX - r.left) / r.width * 100); }
    box.addEventListener("pointerdown", function (ev) { if (ev.button > 0) return; drag = true; try { box.setPointerCapture(ev.pointerId); } catch (e) {} from(ev); });
    box.addEventListener("pointermove", function (ev) { if (drag) from(ev); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (n) { box.addEventListener(n, function () { drag = false; }); });
    h.addEventListener("keydown", function (ev) {
      var k = ev.key, d = ev.shiftKey ? 20 : 5;
      if (k === "ArrowLeft" || k === "ArrowDown") set(pos - d); else if (k === "ArrowRight" || k === "ArrowUp") set(pos + d);
      else if (k === "Home") set(0); else if (k === "End") set(100); else if (k === "PageDown") set(pos - 25); else if (k === "PageUp") set(pos + 25); else return;
      ev.preventDefault();
    });
    set(50);
  }
  all("[data-ba]").forEach(initBA);

  // Filtres (chantiers, offres) : groupes combinés, compteur annoncé
  var fbar = document.querySelector(".cp-fbar");
  if (fbar) {
    var state = {}, items = all(".cp-it"), cnt = fbar.querySelector("[data-count]"), empty = document.querySelector(".cp-empty");
    all("a[data-f]", fbar).forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault(); var f = a.getAttribute("data-f"), v = a.getAttribute("data-v"); state[f] = v;
        all("a[data-f='" + f + "']", fbar).forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
        var n = 0;
        items.forEach(function (it) { var ok = Object.keys(state).every(function (k) { return state[k] === "*" || it.getAttribute("data-" + k) === state[k]; }); it.classList.toggle("is-off", !ok); if (ok) n++; });
        if (cnt) cnt.textContent = n; if (empty) empty.classList.toggle("is-on", n === 0);
      });
    });
  }

  // Fiche chantier : ouverture depuis une carte, fermeture (bouton, Échap, fond)
  var panel = document.querySelector(".cp-panel"), last = null;
  if (panel) {
    var body = panel.querySelector(".cp-pbody"), close = panel.querySelector("[data-close]");
    var shut = function () { panel.classList.remove("is-open"); b.style.overflow = ""; if (last) { last.focus(); last = null; } };
    all("[data-open]").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        var c = a.closest(".cp-card"); if (!c) return; ev.preventDefault(); last = a;
        var steps = tx(c.getAttribute("data-steps")).split("~").map(function (s) { var p = s.split("|"); return "<li>" + esc(p[0]) + "<span>" + esc(p[1] || "") + "</span></li>"; }).join("");
        var ba = c.querySelector(".cp-ba").cloneNode(true); ba.__ba = 0; ba.removeAttribute("style");
        var hd = ba.querySelector(".cp-ba-h"); if (hd) hd.removeAttribute("tabindex");
        body.innerHTML = "<div class='cp-pba'></div><div><p class='cp-ct'>" + esc(c.getAttribute("data-ville")) + " · " + esc(c.getAttribute("data-an")) + "</p><h3>" + esc(c.getAttribute("data-name")) + "</h3><dl><div><dt>Surface</dt><dd>" + esc(c.getAttribute("data-surf")) + "</dd></div><div><dt>Durée</dt><dd>" + esc(c.getAttribute("data-dur")) + "</dd></div><div><dt>Maître d'ouvrage</dt><dd>" + esc(c.getAttribute("data-client")) + "</dd></div></dl><ol aria-label='Étapes du chantier'>" + steps + "</ol><a class='cp-btn cp-btn--k' href='/devis'>Un chantier similaire ?</a></div>";
        body.firstChild.appendChild(ba); initBA(ba);
        panel.classList.add("is-open"); b.style.overflow = "hidden"; panel.scrollTop = 0; close.focus();
      });
    });
    close.addEventListener("click", function (ev) { ev.preventDefault(); shut(); });
    panel.addEventListener("click", function (ev) { if (ev.target === panel) shut(); });
    document.addEventListener("keydown", function (ev) {
      if (!panel.classList.contains("is-open")) return;
      if (ev.key === "Escape") shut();
      if (ev.key === "Tab") {
        var f = all("a[href], [tabindex='0']", panel); if (!f.length) return; var a = f[0], z = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); z.focus(); } else if (!ev.shiftKey && document.activeElement === z) { ev.preventDefault(); a.focus(); }
      }
    });
  }

  // Onglets (devis)
  all("[data-tabs]").forEach(function (box) {
    var tabs = all("a[data-tab]", box);
    tabs.forEach(function (a, i) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        tabs.forEach(function (x) { var on = x === a; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        all("[data-panel]", box).forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-panel") === a.getAttribute("data-tab")); });
      });
      a.addEventListener("keydown", function (ev) { var d = ev.key === "ArrowRight" ? 1 : ev.key === "ArrowLeft" ? -1 : 0; if (d) { ev.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); } });
    });
  });
})();

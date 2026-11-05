/* Roulotte — camion, tournée, menu. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "roulotte") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
  var eur = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var host = document.querySelector(".lp-main") || b; host.classList.add("rt-js");

  // Apparition au défilement
  if (!reduce && "IntersectionObserver" in window) {
    host.classList.add("rt-rev");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }

  // Compteurs
  $$("[data-count]").forEach(function (el) {
    var to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "";
    if (reduce || isNaN(to) || !("IntersectionObserver" in window)) return;
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; o.disconnect(); var t0 = null;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
    }, { threshold: 0.5 }); o.observe(el);
  });

  // Menu mobile
  $$(".rt-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // ---------- Tournée : jours, camion sur la carte, prochain arrêt ----------
  var tours = $$("[data-tour]");
  var base = tours[0];
  function hm(s) { var p = s.split(":"); return [+p[0], +p[1]]; }
  function nextInfo() {
    if (!base) return null;
    var now = new Date(), best = null;
    $$(".rt-day", base).forEach(function (d) {
      var s = hm(d.getAttribute("data-start")), e = hm(d.getAttribute("data-end")), dow = +d.getAttribute("data-dow");
      var st = new Date(now); st.setHours(s[0], s[1], 0, 0); st.setDate(st.getDate() + ((dow - now.getDay() + 7) % 7));
      var en = new Date(st); en.setHours(e[0], e[1], 0, 0);
      if (en <= now) { st.setDate(st.getDate() + 7); en.setDate(en.getDate() + 7); }
      var open = st <= now && now < en, key = open ? -1 : st - now;
      if (!best || key < best.key) best = { key: key, i: +d.getAttribute("data-i"), start: st, open: open, name: d.getAttribute("data-name"), day: d.getAttribute("data-day") };
    });
    return best;
  }
  function updateNext() {
    var n = nextInfo(); if (!n) return;
    var diff = n.open ? 0 : Math.max(0, Math.floor((n.start - Date.now()) / 1000));
    var when = n.open ? "Ouvert en ce moment !" : n.day + " · " + n.start.getHours() + " h " + pad(n.start.getMinutes());
    $$(".rt-nextbox").forEach(function (box) {
      var set = function (k, v) { var el = box.querySelector('[data-nx="' + k + '"]'); if (el) el.textContent = v; };
      set("name", n.name); set("when", when); set("d", pad(Math.floor(diff / 86400))); set("h", pad(Math.floor(diff % 86400 / 3600))); set("m", pad(Math.floor(diff % 3600 / 60))); set("s", pad(diff % 60));
    });
  }
  if (base) { updateNext(); setInterval(updateNext, reduce ? 30000 : 1000); }

  tours.forEach(function (root) {
    var days = $$(".rt-day", root), dots = $$(".rt-dot", root), panels = $$(".rt-panel", root), pin = root.querySelector(".rt-pin"), flip = root.querySelector(".rt-flip");
    var cur = -1, mv;
    function select(i, focus) {
      if (i === cur) return;
      var d = days[i], x = +d.getAttribute("data-x"), y = +d.getAttribute("data-y") - 16;
      if (pin) {
        var px = cur >= 0 ? +days[cur].getAttribute("data-x") : x;
        if (flip && x !== px) flip.classList.toggle("is-left", x < px);
        pin.style.transform = "translate(" + x + "px," + y + "px)";
        if (!reduce) { pin.classList.add("is-moving"); clearTimeout(mv); mv = setTimeout(function () { pin.classList.remove("is-moving"); }, 950); }
        else pin.style.transition = "none";
      }
      cur = i;
      days.forEach(function (a, k) { var on = k === i; a.classList.toggle("is-on", on); a.setAttribute("aria-selected", on ? "true" : "false"); });
      dots.forEach(function (a, k) { a.classList.toggle("is-on", k === i); });
      panels.forEach(function (p, k) { p.classList.toggle("is-on", k === i); });
      if (focus) d.focus();
    }
    days.forEach(function (a, i) {
      a.addEventListener("click", function (ev) { ev.preventDefault(); select(i); });
      a.addEventListener("keydown", function (ev) {
        var k = ev.key, n = days.length;
        if (k === "ArrowRight" || k === "ArrowDown") { ev.preventDefault(); select((cur + 1) % n, true); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { ev.preventDefault(); select((cur + n - 1) % n, true); }
      });
    });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { select(i); }); });
    var go = root.querySelector(".rt-goto");
    if (go) go.addEventListener("click", function (ev) { ev.preventDefault(); var n = nextInfo(); if (n) select(n.i); var m = root.querySelector(".rt-mapbox"); if (m && m.scrollIntoView) m.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); });
    var n0 = nextInfo(); select(n0 ? n0.i : 0);
  });

  // ---------- Menu : filtres et récapitulatif ----------
  $$("[data-menu]").forEach(function (root) {
    var dishes = $$(".rt-dish", root), chips = $$("[data-filter]", root), out = root.querySelector("[data-count-out]");
    chips.forEach(function (c) {
      c.addEventListener("click", function (ev) {
        ev.preventDefault(); var f = c.getAttribute("data-filter"), n = 0;
        chips.forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
        dishes.forEach(function (d) { var show = f === "all" || (" " + d.getAttribute("data-tags") + " ").indexOf(" " + f + " ") > -1; d.hidden = !show; if (show) n++; });
        if (out) out.textContent = n + (n > 1 ? " recettes" : " recette");
      });
    });
    var cartEl = root.querySelector("[data-cart]"), list = root.querySelector("[data-cart-list]"), empty = root.querySelector("[data-cart-empty]"), totRow = root.querySelector("[data-cart-totalrow]"), tot = root.querySelector("[data-cart-total]");
    var sum = root.querySelector("[data-cart-sum]"), copy = root.querySelector("[data-cart-copy]"), send = root.querySelector("[data-cart-send]");
    var bar = document.querySelector("[data-cartbar]"), cart = {}, order = [];
    var info = {}; dishes.forEach(function (d) { info[d.getAttribute("data-id")] = { n: d.getAttribute("data-name"), p: parseFloat(d.getAttribute("data-price")) }; });
    function render() {
      var count = 0, total = 0, lines = [];
      list.innerHTML = "";
      order.forEach(function (id) {
        var q = cart[id]; if (!q) return; var it = info[id]; count += q; total += q * it.p; lines.push(q + " × " + it.n);
        var li = document.createElement("li");
        li.innerHTML = '<span class="rt-cart-name"></span><span class="rt-cart-line">' + eur(q * it.p) + '</span><span class="rt-qty"><a href="#moins" data-q="-1" data-id="' + id + '" aria-label="Retirer un"></a><b>' + q + '</b><a href="#plus" data-q="1" data-id="' + id + '" aria-label="Ajouter un"></a></span>';
        li.querySelector(".rt-cart-name").textContent = it.n;
        li.querySelectorAll("a")[0].textContent = "−"; li.querySelectorAll("a")[1].textContent = "+";
        list.appendChild(li);
      });
      empty.hidden = count > 0; totRow.hidden = !count; sum.hidden = !count; copy.hidden = !count;
      tot.textContent = eur(total);
      var text = count ? "Ma sélection Roulotte : " + lines.join(", ") + ". Total indicatif : " + eur(total) + "." : "";
      sum.textContent = text ? text.replace(/, /g, "\n").replace(": ", ":\n") : "";
      sum.setAttribute("data-text", text);
      send.setAttribute("href", count ? "/contact?message=" + encodeURIComponent(text) : "/contact");
      if (bar) { bar.hidden = !count; bar.querySelector("[data-cartbar-n]").textContent = count + (count > 1 ? " plats" : " plat"); bar.querySelector("[data-cartbar-t]").textContent = eur(total); }
    }
    root.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a"); if (!a || !root.contains(a)) return;
      if (a.hasAttribute("data-add")) { ev.preventDefault(); var id = a.getAttribute("data-add"); if (!cart[id]) { cart[id] = 0; order.push(id); } cart[id]++; render(); if (!reduce) { a.classList.remove("is-pop"); void a.offsetWidth; a.classList.add("is-pop"); } }
      else if (a.hasAttribute("data-q")) { ev.preventDefault(); var i2 = a.getAttribute("data-id"); cart[i2] = Math.max(0, (cart[i2] || 0) + parseInt(a.getAttribute("data-q"), 10)); render(); }
      else if (a === copy) { ev.preventDefault(); var t = sum.getAttribute("data-text") || ""; var done = function () { copy.textContent = "Copié !"; setTimeout(function () { copy.textContent = "Copier le récapitulatif"; }, 2000); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () {}); else done(); }
    });
    if (bar) bar.addEventListener("click", function (ev) { ev.preventDefault(); if (cartEl.scrollIntoView) cartEl.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    render();
  });

  // ---------- Estimateur d'événement ----------
  $$("[data-est]").forEach(function (root) {
    var tabs = $$("[data-f]", root), g = 60, f = tabs[0], gEl = root.querySelector("[data-est-g]"), tEl = root.querySelector("[data-est-total]"), sEl = root.querySelector("[data-est-sum]");
    function upd() {
      var p = +f.getAttribute("data-p"), n = f.getAttribute("data-n");
      gEl.textContent = g; tEl.textContent = (p * g).toLocaleString("fr-FR") + " €";
      sEl.textContent = "Formule " + n + " pour " + g + " invités, soit " + p + " € par invité (estimation).";
      $$("[data-fd]", root).forEach(function (d) { d.hidden = d.getAttribute("data-fd") !== f.getAttribute("data-f"); });
      tabs.forEach(function (t) { var on = t === f; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
    }
    tabs.forEach(function (t) { t.addEventListener("click", function (ev) { ev.preventDefault(); f = t; upd(); }); });
    $$("[data-g]", root).forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); g = Math.min(300, Math.max(30, g + parseInt(a.getAttribute("data-g"), 10))); upd(); }); });
    upd();
  });
})();

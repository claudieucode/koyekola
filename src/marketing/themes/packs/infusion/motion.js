/* Infusion — révélations, panier fictif, filtres de boutique, carte d'origines, roue des saveurs, minuteur d'infusion. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "infusion") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var eur = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var press = function (el, fn) { el.addEventListener("click", function (e) { e.preventDefault(); fn(e); }); };

  // Hauteur d'en-tête (menu mobile) et apparitions
  var head = $(".ia-head");
  function sizeHead() { if (head) b.style.setProperty("--ia-headh", head.offsetHeight + "px"); }
  sizeHead(); window.addEventListener("resize", sizeHead);
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("ia-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  }
  $$(".ia-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  /* ---------- Panier fictif ---------- */
  var cart = {}, KEY = "ia-cart-demo";
  try { cart = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (x) { cart = {}; }
  var panel, veil, lastFocus;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (x) {} }
  function count() { var n = 0; for (var k in cart) n += cart[k].q; return n; }
  function total() { var t = 0; for (var k in cart) t += cart[k].q * cart[k].p; return t; }
  function recap() {
    var L = ["Demande de démonstration — Infusion (aucune commande réelle)"];
    for (var k in cart) L.push(cart[k].q + " × " + cart[k].n + " — " + eur(cart[k].q * cart[k].p));
    L.push("Total indicatif : " + eur(total()), "Mes goûts / remarques : ");
    return L.join("\n");
  }
  function badge() { $$("[data-cart-count]").forEach(function (e) { e.textContent = count(); }); }
  function build() {
    if (panel) return;
    veil = document.createElement("div"); veil.className = "ia-veil";
    panel = document.createElement("aside"); panel.className = "ia-cart"; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-labelledby", "ia-cart-t");
    panel.innerHTML = '<div class="ia-cart-head"><h2 id="ia-cart-t">Votre panier</h2><button type="button" class="ia-xbtn" aria-label="Fermer le panier">×</button></div>' +
      '<p class="ia-cart-note">Panier de démonstration : aucune commande ni paiement. Le résumé se transmet par le formulaire de contact.</p><ul class="ia-cart-list"></ul>' +
      '<div class="ia-cart-total"><span>Total indicatif</span><b>0,00 €</b></div><label for="ia-cart-r" class="ia-sr">Récapitulatif à copier</label><textarea id="ia-cart-r" readonly></textarea>' +
      '<div class="ia-cart-actions"><button type="button" class="ia-btn" data-copy>Copier le récapitulatif</button><a class="ia-btn ia-btn--line" href="/contact">Continuer vers le contact</a><button type="button" class="ia-btn ia-btn--line" data-clear>Vider le panier</button></div><p class="ia-cart-ok" role="status" aria-live="polite"></p>';
    b.appendChild(veil); b.appendChild(panel);
    press($(".ia-xbtn", panel), close); veil.addEventListener("click", close);
    press($("[data-clear]", panel), function () { cart = {}; save(); render(); });
    press($("[data-copy]", panel), function () {
      var ta = $("textarea", panel), ok = $(".ia-cart-ok", panel); ta.select();
      var done = function () { ok.textContent = "Récapitulatif copié : collez-le dans le formulaire de contact."; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { ok.textContent = "Sélectionné : faites Ctrl+C (ou Cmd+C)."; });
      else { try { document.execCommand("copy"); done(); } catch (x) { ok.textContent = "Sélectionné : faites Ctrl+C (ou Cmd+C)."; } }
    });
    panel.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var f = $$("button,a[href],textarea", panel).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return; var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    render();
  }
  function render() {
    badge(); if (!panel) return;
    var ul = $(".ia-cart-list", panel); ul.innerHTML = "";
    var keys = Object.keys(cart);
    if (!keys.length) { ul.innerHTML = '<li class="ia-cart-empty">Votre panier est vide. Parcourez la <a href="/boutique">boutique</a>.</li>'; }
    keys.forEach(function (k) {
      var it = cart[k], li = document.createElement("li");
      li.innerHTML = '<b></b><span class="ia-pl"></span><span class="ia-qty"><button type="button" aria-label="Retirer une unité">−</button><output aria-live="polite"></output><button type="button" aria-label="Ajouter une unité">+</button></span><button type="button" class="ia-rm">Retirer</button>';
      $("b", li).textContent = it.n; $(".ia-pl", li).textContent = eur(it.q * it.p); $("output", li).textContent = it.q;
      var bs = $$("button", li);
      press(bs[0], function () { it.q--; if (it.q < 1) delete cart[k]; save(); render(); focusIn(k, 0); });
      press(bs[1], function () { it.q++; save(); render(); focusIn(k, 1); });
      press(bs[2], function () { delete cart[k]; save(); render(); });
      ul.appendChild(li);
    });
    $(".ia-cart-total b", panel).textContent = eur(total());
    $("textarea", panel).value = keys.length ? recap() : "";
    $("[data-copy]", panel).disabled = !keys.length;
  }
  function focusIn(k, i) { if (!cart[k]) return; var li = $$(".ia-cart-list li", panel)[Object.keys(cart).indexOf(k)]; if (li) $$("button", li)[i].focus(); }
  function open() { build(); lastFocus = document.activeElement; panel.classList.add("is-on"); veil.classList.add("is-on"); b.classList.add("ia-lock"); $(".ia-xbtn", panel).focus(); }
  function close() { if (!panel) return; panel.classList.remove("is-on"); veil.classList.remove("is-on"); b.classList.remove("ia-lock"); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  $$("[data-cart-open]").forEach(function (a) { press(a, open); });
  $$("[data-add]").forEach(function (a) {
    a.setAttribute("role", "button");
    a.addEventListener("keydown", function (e) { if (e.key === " ") { e.preventDefault(); a.click(); } });
    press(a, function () {
      var id = a.getAttribute("data-add");
      if (!cart[id]) cart[id] = { n: a.getAttribute("data-name"), p: parseFloat(a.getAttribute("data-price")), q: 0 };
      cart[id].q++; save(); render();
      var old = a.textContent; a.textContent = "Ajouté ✓"; a.classList.add("is-done");
      setTimeout(function () { a.textContent = old; a.classList.remove("is-done"); }, 1400);
    });
  });
  badge();

  /* ---------- Boutique : filtres ---------- */
  var grid = $("[data-shopgrid]");
  if (grid) {
    var st = { type: "", origin: "", force: "", bio: "", price: "" };
    var cards = $$(".ia-card", grid), cnt = $("[data-count]"), empty = $("[data-empty]");
    var ok = {
      type: function (c, v) { return c.dataset.type === v; }, origin: function (c, v) { return c.dataset.origin === v; },
      force: function (c, v) { var f = +c.dataset.force; return v === "douce" ? f <= 2 : v === "moyenne" ? f === 3 : f >= 4; },
      bio: function (c, v) { return c.dataset.bio === v; },
      price: function (c, v) { var p = +c.dataset.price; return v === "low" ? p < 13 : v === "mid" ? p >= 13 && p <= 18 : p > 18; }
    };
    var apply = function () {
      var n = 0;
      cards.forEach(function (c) { var show = Object.keys(st).every(function (k) { return !st[k] || ok[k](c, st[k]); }); c.hidden = !show; if (show) n++; });
      $$(".ia-chip").forEach(function (a) { a.setAttribute("aria-pressed", (st[a.dataset.f] || "all") === a.dataset.v ? "true" : "false"); });
      cnt.textContent = n + (n > 1 ? " références" : " référence"); empty.hidden = n > 0;
    };
    $$(".ia-chip").forEach(function (a) { press(a, function () { st[a.dataset.f] = a.dataset.v === "all" ? "" : a.dataset.v; apply(); }); });
    $$("[data-reset]").forEach(function (a) { press(a, function () { st = { type: "", origin: "", force: "", bio: "", price: "" }; apply(); }); });
    var fromHash = function () { var h = location.hash.slice(1); if (/^(the-vert|the-noir|oolong|infusion|cafe)$/.test(h)) { st.type = h; apply(); } };
    fromHash(); window.addEventListener("hashchange", fromHash);
    var fd = $(".ia-fil-d"); if (fd) { var fit = function () { fd.open = window.innerWidth > 1024; }; fit(); window.addEventListener("resize", function () { if (window.innerWidth > 1024) fd.open = true; }); }
  }

  /* ---------- Origines : carte et panneaux ---------- */
  $$("[data-omap]").forEach(function (box) {
    var panels = $$("[data-opanel]");
    function pick(k) {
      $$(".ia-pin", box).forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-o") === k); });
      $$(".ia-legend a", box).forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-o") === k); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-opanel") !== k; });
    }
    $$(".ia-pin", box).forEach(function (p) {
      p.setAttribute("tabindex", "0"); p.setAttribute("role", "button"); p.setAttribute("aria-label", "Voir " + p.querySelector("title").textContent);
      p.addEventListener("click", function () { pick(p.getAttribute("data-o")); });
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(p.getAttribute("data-o")); } });
    });
    $$(".ia-legend a", box).forEach(function (a) { press(a, function () { pick(a.getAttribute("data-o")); }); });
    var h = location.hash.slice(1); pick(panels.some(function (p) { return p.getAttribute("data-opanel") === h; }) ? h : "darjeeling");
  });

  /* ---------- Roue des saveurs ---------- */
  $$("[data-wheelbox]").forEach(function (box) {
    var segs = $$(".ia-wseg", box), links = $$(".ia-wnote", box), desc = $("[data-wdesc]", box);
    function sel(i) {
      box.classList.add("has-sel");
      segs.forEach(function (s, j) { s.classList.toggle("is-on", j === i); });
      links.forEach(function (a, j) { a.classList.toggle("is-on", j === i); });
      desc.innerHTML = ""; var bt = document.createElement("b"); bt.textContent = links[i].firstChild.nextSibling ? links[i].textContent.replace(/\d\/5$/, "") : ""; desc.appendChild(bt); desc.appendChild(document.createTextNode(" — " + links[i].getAttribute("data-desc")));
    }
    segs.forEach(function (s, i) {
      s.setAttribute("tabindex", "0"); s.setAttribute("role", "button"); s.setAttribute("aria-label", links[i].textContent);
      s.addEventListener("click", function () { sel(i); });
      s.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); sel(i); } });
    });
    links.forEach(function (a, i) { press(a, function () { sel(i); }); });
  });

  /* ---------- Minuteur d'infusion ---------- */
  $$("[data-timer]").forEach(function (box) {
    var base = +box.getAttribute("data-sec"), left = base, run = null, end = 0;
    var read = $("[data-read]", box), fill = $(".ia-ringfill", box), stat = $("[data-stat]", box), ctl = $("[data-ctl]", box), C = 339.3;
    ctl.innerHTML = '<button type="button" aria-label="Retirer 15 secondes">−15 s</button><button type="button" class="ia-go">Lancer</button><button type="button" aria-label="Remettre à zéro">Réinitialiser</button><button type="button" aria-label="Ajouter 15 secondes">+15 s</button>';
    var bs = $$("button", ctl), go = bs[1];
    function show() {
      var s = Math.max(0, Math.ceil(left)); read.textContent = Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
      fill.style.strokeDashoffset = (C * (1 - (base ? left / base : 0))).toFixed(1);
    }
    function stop() { clearInterval(run); run = null; box.classList.remove("is-run"); go.textContent = left > 0 && left < base ? "Reprendre" : "Lancer"; }
    function tick() {
      left = (end - Date.now()) / 1000;
      if (left <= 0) { left = 0; stop(); box.classList.add("is-done"); stat.textContent = "Votre infusion est prête. Retirez les feuilles et servez."; go.textContent = "Relancer"; if (navigator.vibrate) try { navigator.vibrate([200, 100, 200]); } catch (x) {} }
      show();
    }
    press(go, function () {
      if (run) { stop(); stat.textContent = "En pause."; return; }
      if (left <= 0) left = base;
      box.classList.remove("is-done"); end = Date.now() + left * 1000; box.classList.add("is-run"); go.textContent = "Pause"; stat.textContent = "Infusion en cours à " + box.getAttribute("data-temp") + " °C.";
      run = setInterval(tick, 250);
    });
    press(bs[2], function () { stop(); left = base; box.classList.remove("is-done"); stat.textContent = ""; go.textContent = "Lancer"; show(); });
    function adj(d) { return function () { base = Math.max(15, base + d); left = Math.max(0, Math.min(base, left + d)); if (run) end += d * 1000; box.classList.remove("is-done"); show(); stat.textContent = "Durée réglée : " + Math.round(base / 60 * 10) / 10 + " min."; }; }
    press(bs[0], adj(-15)); press(bs[3], adj(15));
    show();
  });

  /* ---------- Onglets des rituels ---------- */
  $$(".ia-tabs").forEach(function (tabs) {
    var wrap = tabs.parentNode, links = $$("a[data-tab]", tabs);
    function pick(k) {
      links.forEach(function (a) { var on = a.getAttribute("data-tab") === k; a.classList.toggle("is-on", on); a.setAttribute("aria-selected", on ? "true" : "false"); });
      $$("[data-panel]", wrap).forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== k; });
    }
    links.forEach(function (a, i) {
      press(a, function () { pick(a.getAttribute("data-tab")); });
      a.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = links[(i + (e.key === "ArrowRight" ? 1 : links.length - 1)) % links.length]; n.focus(); n.click(); } });
    });
    pick(links[0].getAttribute("data-tab"));
  });
})();

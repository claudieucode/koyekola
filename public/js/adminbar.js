// KOLAKISA CMS — barre d'administration supérieure : menus déroulants (clavier, Échap, clic extérieur, positionnement dans l'écran), filtre des sites et notifications.
// Le serveur reste la seule source de vérité : le compteur et la liste viennent de /marketing/barre/notifications.json (site vérifié côté serveur), l'état « lu » n'est modifié
// qu'après la réponse du serveur, et aucune actualisation « en direct » n'est simulée (la liste est relue à l'ouverture et au retour sur l'onglet).
(function () {
  "use strict";
  var bar = document.querySelector("[data-kab]");
  if (!bar) return;
  var SITE = bar.getAttribute("data-site") || "";
  var NOTIF_URL = bar.getAttribute("data-notif-url");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var OPEN = null;

  function qs() { return SITE ? "?site=" + encodeURIComponent(SITE) : ""; }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === null || v === undefined || v === false) return; if (k === "text") n.textContent = v; else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), v); else n.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function toast(text, error) {
    var box = document.getElementById("kab-toasts"); if (!box) return;
    var t = el("div", { class: "kab-toast" + (error ? " is-error" : ""), role: error ? "alert" : "status", text: text });
    box.appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); setTimeout(function () { t.remove(); }, 280); }, error ? 6000 : 2800);
  }

  // ---------- Menus ----------
  function items(pop) { return $$("[role=menuitem]:not([hidden]), [role=menuitemradio], a[href]:not([hidden]), button:not([disabled]):not([hidden]), input", pop).filter(function (n) { return n.offsetParent !== null; }); }
  function place(wrap, pop) {
    pop.classList.remove("align-end");
    var r = pop.getBoundingClientRect();
    if (r.right > window.innerWidth - 8) pop.classList.add("align-end");
    r = pop.getBoundingClientRect();
    if (r.left < 8) { pop.classList.remove("align-end"); pop.style.left = (8 - wrap.getBoundingClientRect().left) + "px"; } else pop.style.left = "";
  }
  function openMenu(wrap, focusFirst) {
    var btn = $("[data-kab-toggle]", wrap), pop = $(".kab-pop", wrap);
    if (!btn || !pop) return;
    if (OPEN && OPEN !== wrap) closeMenu(OPEN, false);
    clearTimeout(pop._t); pop.classList.remove("is-closing");
    pop.hidden = false; btn.setAttribute("aria-expanded", "true");
    place(wrap, pop);
    pop.classList.add("is-open"); OPEN = wrap;
    var f = $("[data-kab-filter]", pop);
    if (focusFirst) { var first = f || items(pop)[0]; if (first) first.focus({ preventScroll: true }); }
    wrap.dispatchEvent(new CustomEvent("kab:open"));
  }
  function closeMenu(wrap, returnFocus) {
    var btn = $("[data-kab-toggle]", wrap), pop = $(".kab-pop", wrap);
    if (!pop || pop.hidden) return;
    btn.setAttribute("aria-expanded", "false");
    pop.classList.remove("is-open"); pop.classList.add("is-closing");
    clearTimeout(pop._t); pop._t = setTimeout(function () { pop.hidden = true; pop.classList.remove("is-closing"); }, 100);
    if (OPEN === wrap) OPEN = null;
    if (returnFocus) btn.focus();
  }
  $$("[data-kab-menu]").forEach(function (wrap) {
    var btn = $("[data-kab-toggle]", wrap), pop = $(".kab-pop", wrap);
    if (!btn || !pop) return;
    btn.addEventListener("click", function () { if (btn.getAttribute("aria-expanded") === "true") closeMenu(wrap, false); else openMenu(wrap, false); });
    btn.addEventListener("keydown", function (e) { if ((e.key === "ArrowDown" || e.key === "ArrowUp") && btn.getAttribute("aria-expanded") !== "true") { e.preventDefault(); openMenu(wrap, true); } });
    wrap.addEventListener("keydown", function (e) {
      if (pop.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(wrap, true); return; }
      if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(e.key) < 0) return;
      var list = items(pop); if (!list.length) return;
      var i = list.indexOf(document.activeElement);
      if (document.activeElement === btn) i = -1;
      e.preventDefault();
      if (e.key === "ArrowDown") i = i + 1 >= list.length ? 0 : i + 1;
      else if (e.key === "ArrowUp") i = i - 1 < 0 ? list.length - 1 : i - 1;
      else if (e.key === "Home") i = 0; else i = list.length - 1;
      list[i].focus();
    });
    wrap.addEventListener("focusout", function (e) { if (!e.relatedTarget || wrap.contains(e.relatedTarget)) return; if (OPEN === wrap) closeMenu(wrap, false); });
  });
  document.addEventListener("click", function (e) { if (OPEN && !OPEN.contains(e.target)) closeMenu(OPEN, false); });
  window.addEventListener("resize", function () { if (OPEN) place(OPEN, $(".kab-pop", OPEN)); });
  window.addEventListener("scroll", function () { /* les menus suivent la barre fixe : rien à recalculer */ }, { passive: true });

  // ---------- Filtre des sites ----------
  $$("[data-kab-filter]").forEach(function (input) {
    var pop = input.closest(".kab-pop"), empty = $(".kab-empty", pop), status = $("[data-kab-filter-status]", pop);
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase(), shown = 0;
      $$("[data-filter]", pop).forEach(function (a) { var ok = !q || a.getAttribute("data-filter").indexOf(q) >= 0; a.hidden = !ok; if (ok) shown++; });
      if (empty) empty.hidden = shown > 0;
      if (status) status.textContent = shown + " site" + (shown > 1 ? "s" : "") + " affiché" + (shown > 1 ? "s" : "");
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { var first = $$("[data-filter]:not([hidden])", pop)[0]; if (first) { e.preventDefault(); first.click(); } } });
  });

  // ---------- Notifications ----------
  var nwrap = $("[data-kab-notif]");
  if (nwrap) {
    var body = $("[data-kab-notif-body]", nwrap), readAll = $("[data-kab-readall]", nwrap), badge = $("[data-kab-badge]", nwrap), bell = $("[data-kab-toggle]", nwrap);
    var busy = false, lastLoad = 0;
    function setBadge(n, label) {
      var was = badge.hidden ? "" : badge.textContent;
      badge.hidden = !n; badge.textContent = label;
      if (n && was !== label) { badge.style.animation = "none"; void badge.offsetWidth; badge.style.animation = ""; } // transition discrète, sans déplacer la barre
      bell.setAttribute("aria-label", "Notifications" + (n ? " : " + n + " non lue" + (n > 1 ? "s" : "") : ""));
    }
    function state(icon, title, text, retry) {
      body.textContent = "";
      var s = el("div", { class: "kab-state" }, [icon === "spin" ? el("span", { class: "kab-spin", "aria-hidden": "true" }) : null, el("strong", { text: title }), text ? el("span", { text: text }) : null]);
      if (retry) s.appendChild(el("button", { type: "button", class: "kab-btn kab-retry", text: "Réessayer", onclick: load, style: "color:var(--accent-dark,#0369a1);background:var(--accent-light,#e3f1fb)" }));
      body.appendChild(s);
    }
    function when(iso) {
      var d = new Date(String(iso).replace(" ", "T") + "Z"); if (isNaN(d)) return "";
      var s = Math.max(0, (Date.now() - d.getTime()) / 1000);
      if (s < 60) return "à l'instant"; if (s < 3600) return "il y a " + Math.floor(s / 60) + " min"; if (s < 86400) return "il y a " + Math.floor(s / 3600) + " h";
      return "le " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
    function render(data) {
      setBadge(data.unread, data.label); readAll.disabled = !data.unread;
      if (!data.items.length) { state("", "Aucune notification", "Rien à signaler pour " + data.siteName + "."); return; }
      var ul = el("ul", { class: "kab-nlist", role: "list" });
      data.items.forEach(function (it) {
        var li = el("li", { class: "kab-n" + (it.unread ? " is-unread" : "") });
        var a = el("a", { href: it.href }, [el("span", { class: "kab-dot", "aria-hidden": "true" }), el("span", { class: "kab-n-text" }, [el("strong", { text: it.title }), it.detail ? el("span", { text: it.detail }) : null, it.excerpt ? el("span", { text: "« " + it.excerpt + " »" }) : null, el("small", { text: when(it.at) })])]);
        li.appendChild(a);
        if (it.unread) li.appendChild(el("button", { type: "button", class: "kab-n-mark", "aria-label": "Marquer comme lue : " + it.title, title: "Marquer comme lue", onclick: function (e) { e.preventDefault(); markOne(it, li, e.currentTarget); } }, [checkIcon()]));
        ul.appendChild(li);
      });
      body.textContent = ""; body.appendChild(ul);
    }
    function checkIcon() { var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("width", "14"); s.setAttribute("height", "14"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2.4"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); var p = document.createElementNS("http://www.w3.org/2000/svg", "polyline"); p.setAttribute("points", "20 6 9 17 4 12"); s.appendChild(p); return s; }
    function call(method, path, payload) {
      var opts = { method: method, credentials: "same-origin", headers: { Accept: "application/json" } };
      if (payload) { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(Object.assign({ site: SITE }, payload)); }
      return fetch(path + qs(), opts).then(function (res) {
        return res.text().then(function (t) {
          var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; }
          if (!res.ok) { var err = new Error((d && d.error && d.error.message) || (res.status === 401 ? "Votre session a expiré : reconnectez-vous." : res.status === 403 ? "Vous n'avez pas accès à ces notifications." : "Erreur du serveur (" + res.status + ")")); err.status = res.status; throw err; }
          return d;
        });
      }, function () { var err = new Error("Connexion impossible : vérifiez votre réseau."); err.network = true; throw err; });
    }
    function load() {
      state("spin", "Chargement…"); lastLoad = Date.now();
      call("GET", NOTIF_URL).then(render, function (e) { state("", "Notifications indisponibles", e.message, true); });
    }
    function markOne(it, li, btn) {
      if (busy) return; busy = true; btn.disabled = true;
      call("POST", "/marketing/barre/notifications/lu", { key: it.key }).then(function (r) {
        busy = false; li.classList.remove("is-unread"); btn.remove(); it.unread = false; setBadge(r.unread, r.label); readAll.disabled = !r.unread;
      }, function (e) { busy = false; btn.disabled = false; toast(e.message, true); });
    }
    readAll.addEventListener("click", function () {
      if (busy) return; busy = true; readAll.disabled = true;
      call("POST", "/marketing/barre/notifications/tout-lu", {}).then(function (r) { busy = false; setBadge(r.unread, r.label); toast("Notifications marquées comme lues."); load(); }, function (e) { busy = false; readAll.disabled = false; toast(e.message, true); });
    });
    nwrap.addEventListener("kab:open", load);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && Date.now() - lastLoad > 60000 && !(OPEN === nwrap)) { lastLoad = Date.now(); call("GET", NOTIF_URL).then(function (d) { setBadge(d.unread, d.label); }, function () { /* le compteur reste celui de la page */ }); } });
  }

  // ---------- Thème : « Mode » du menu étroit suit la préférence existante (shell.js gère le reste) ----------
  // Les boutons data-kola-theme-set du menu « ··· » sont pris en charge par le script du thème de la coque.
})();

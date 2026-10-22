// KOLAKISA — comportements partagés de la zone de contenu de l'administration : infobulles, filtres instantanés, démarrage (étapes),
// bandeaux fermables, sélection de lignes, menus d'actions. Tout fonctionne aussi sans ce script (formulaires et liens classiques) : il n'ajoute que le confort.
(function () {
  "use strict";
  var DATA = window.KOLA_TIPS || { nav: {}, group: {}, status: {}, ctl: {} };
  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };
  var $$ = function (sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); };
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  // ===================================================================================================================
  // 1. Infobulles
  // ===================================================================================================================
  // Adresse d'un lien de menu → clé du registre : sans « /marketing », sans « /sites/<id> » ni « /principal »
  function keyOfHref(href) {
    var p;
    try { p = new URL(href, window.location.origin).pathname; } catch (e) { return null; }
    p = p.replace(/^\/marketing/, "").replace(/\/sites\/\d+(?=\/|$)/, "").replace(/\/principal(?=\/|$)/, "").replace(/\/$/, "");
    if (p === "/site-web/principal") p = "/site-web";
    return p;
  }
  var norm = function (s) { return String(s || "").replace(/\s+/g, " ").trim().toLowerCase(); };
  function hasVisibleText(el) { return norm(el.textContent).replace(/[^\p{L}\p{N}]/gu, "").length > 0; }

  function prepare() {
    // a. Menu latéral : texte du registre ; l'ancien attribut « title » (nom seul) devient le nom accessible, sans doublon d'infobulle native
    $$(".mk-nav-link, .mk-nav-sublink, .mk-nav-head, .mk-cms-back, .mk-create-btn, .mk-collapse-btn, .mk-cms-fold, .mk-close-btn").forEach(function (el) {
      if (el.hasAttribute("data-tip")) return;
      var tip = null, href = el.getAttribute("href");
      if (href) { var k = keyOfHref(href); if (k !== null && DATA.nav[k]) tip = DATA.nav[k]; }
      else if (el.classList.contains("mk-nav-head")) { var g = el.closest("[data-mk-group]"); if (g && DATA.group[g.getAttribute("data-mk-group")]) tip = DATA.group[g.getAttribute("data-mk-group")]; }
      var title = el.getAttribute("title");
      if (!tip && el.classList.contains("mk-create-btn")) tip = "Créez rapidement un e-mail, une page, un contact ou un formulaire.";
      if (!tip && el.classList.contains("mk-cms-back")) tip = "Revenir à l'espace Marketing (campagnes, audience, automatisations).";
      if (!tip && (el.classList.contains("mk-collapse-btn") || el.classList.contains("mk-cms-fold"))) tip = "Réduit le menu en icônes pour gagner de la place ; cliquez de nouveau pour le déplier.";
      if (!tip && title) tip = title;
      if (title) { if (!el.hasAttribute("aria-label") && !hasVisibleText(el)) el.setAttribute("aria-label", title); el.removeAttribute("title"); }
      if (tip) { el.setAttribute("data-tip", tip); el.setAttribute("data-tip-side", "right"); }
    });
    // b. Pastilles de statut : sens du mot
    $$(".mk-status, .badge.mk-status-ok, .badge.mk-status-warn, .badge.mk-status-err").forEach(function (el) {
      if (el.hasAttribute("data-tip")) return;
      var t = DATA.status[norm(el.textContent)];
      if (t) { el.setAttribute("data-tip", t); if (!el.hasAttribute("tabindex") && !el.closest("a, button")) el.setAttribute("tabindex", "0"); }
    });
    // c. Commandes : « title » → infobulle ; boutons sans texte → leur nom accessible ; libellés courants
    $$(".mk-content [title], .mk-topbar [title], .mk-cms-topbar [title], header [title]").forEach(function (el) {
      if (el.hasAttribute("data-tip") || el.closest("svg") || el.tagName === "IFRAME" || el.tagName === "ABBR") return;
      var title = el.getAttribute("title");
      if (!title) return;
      if (!el.hasAttribute("aria-label") && !hasVisibleText(el) && (el.tagName === "BUTTON" || el.tagName === "A")) el.setAttribute("aria-label", title);
      el.setAttribute("data-tip", title); el.removeAttribute("title");
    });
    $$(".mk-content button[aria-label], .mk-content a[aria-label], .mk-topbar button[aria-label], .mk-topbar a[aria-label]").forEach(function (el) {
      if (el.hasAttribute("data-tip") || hasVisibleText(el)) return;
      el.setAttribute("data-tip", el.getAttribute("aria-label"));
    });
    $$(".mk-content :is(.btn, .mk-filter-clear, a.mk-pb-btn)").forEach(function (el) {
      if (el.hasAttribute("data-tip") || el.querySelector("[data-tip]")) return;
      var t = DATA.ctl[norm(el.textContent)];
      if (t) el.setAttribute("data-tip", t);
    });
    // d. Libellés de chiffres et d'en-têtes de colonnes qui portent un data-tip : repère visuel (pointillés) et accès au clavier
    $$(".mk-stat-label[data-tip], .mk-kpi-label[data-tip], .mk-dotted[data-tip], th[data-tip]").forEach(function (el) { if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0"); });
  }

  var tipEl = null, current = null, showTimer = null, hideTimer = null, uid = 0;
  function ensureTip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement("div");
    tipEl.className = "kola-tip"; tipEl.setAttribute("role", "tooltip"); tipEl.id = "kola-tip";
    document.body.appendChild(tipEl);
    return tipEl;
  }
  function place(target) {
    var tip = ensureTip(), r = target.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, gap = 10;
    tip.style.left = "0px"; tip.style.top = "0px";
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var pref = target.getAttribute("data-tip-side") || "top", side = pref;
    var room = { top: r.top, bottom: vh - r.bottom, left: r.left, right: vw - r.right };
    var need = { top: h + gap, bottom: h + gap, left: w + gap, right: w + gap };
    if (room[side] < need[side]) {
      var order = side === "left" || side === "right" ? ["right", "left", "bottom", "top"] : ["top", "bottom", "right", "left"];
      side = order.filter(function (s) { return room[s] >= need[s]; })[0] || (room.bottom > room.top ? "bottom" : "top");
    }
    var x, y, arrow;
    if (side === "top" || side === "bottom") {
      x = Math.max(8, Math.min(vw - w - 8, r.left + r.width / 2 - w / 2));
      y = side === "top" ? r.top - h - gap : r.bottom + gap;
      arrow = Math.max(14, Math.min(w - 14, r.left + r.width / 2 - x));
    } else {
      y = Math.max(8, Math.min(vh - h - 8, r.top + r.height / 2 - h / 2));
      x = side === "left" ? r.left - w - gap : r.right + gap;
      arrow = Math.max(14, Math.min(h - 14, r.top + r.height / 2 - y));
    }
    tip.setAttribute("data-side", side);
    tip.style.setProperty("--kt-arrow", arrow + "px");
    tip.style.left = Math.round(x) + "px"; tip.style.top = Math.round(y) + "px";
  }
  function show(target) {
    var text = target.getAttribute("data-tip");
    if (!text) return;
    clearTimeout(hideTimer);
    var tip = ensureTip();
    tip.textContent = "";
    var title = target.getAttribute("data-tip-title");
    if (title) { var b = document.createElement("strong"); b.textContent = title; tip.appendChild(b); }
    tip.appendChild(document.createTextNode(text));
    current = target;
    if (!target.getAttribute("aria-describedby")) { target.setAttribute("aria-describedby", "kola-tip"); target.setAttribute("data-tip-described", "1"); }
    place(target);
    tip.classList.add("is-on");
  }
  function hide() {
    clearTimeout(showTimer);
    if (!tipEl || !current) return;
    var t = current; current = null;
    tipEl.classList.remove("is-on");
    if (t.getAttribute("data-tip-described")) { t.removeAttribute("aria-describedby"); t.removeAttribute("data-tip-described"); }
  }
  function targetOf(e) { return e.target && e.target.closest ? e.target.closest("[data-tip]") : null; }
  document.addEventListener("mouseover", function (e) {
    if (coarse) return;
    var t = targetOf(e);
    if (!t || t === current) return;
    clearTimeout(showTimer); hide();
    showTimer = setTimeout(function () { show(t); }, 350);
  });
  document.addEventListener("mouseout", function (e) {
    var t = targetOf(e);
    if (!t) return;
    if (e.relatedTarget && t.contains(e.relatedTarget)) return;
    clearTimeout(showTimer); hide();
  });
  document.addEventListener("focusin", function (e) {
    var t = targetOf(e);
    if (!t) return;
    var keyboard = true;
    try { keyboard = e.target.matches(":focus-visible"); } catch (err) { keyboard = true; }
    if (keyboard || coarse) { clearTimeout(showTimer); show(t); if (coarse) { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 3200); } }
  });
  document.addEventListener("focusout", function (e) { if (targetOf(e)) hide(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
  document.addEventListener("click", function (e) {
    var t = targetOf(e);
    if (!coarse) { if (!t || t !== current) hide(); return; }
    // Écran tactile : pas de survol. Un élément d'information (non cliquable) affiche son explication au toucher ; les commandes l'affichent quand elles reçoivent le focus.
    if (t && !t.closest("a, button, summary, input, select, label") && t !== current) { show(t); clearTimeout(hideTimer); hideTimer = setTimeout(hide, 4000); }
    else if (!t) hide();
  });
  window.addEventListener("scroll", hide, true);
  window.addEventListener("resize", hide);

  // ===================================================================================================================
  // 2. Filtres instantanés : un changement de sélection ou une recherche applique le filtre (le bouton reste pour le clavier)
  // ===================================================================================================================
  $$("form.mk-filterbar[method=get], form.mk-filterbar:not([method])").forEach(function (form) {
    if (form.hasAttribute("data-no-live")) return;
    form.classList.add("is-live");
    var timer = null;
    $$("select", form).forEach(function (s) { s.addEventListener("change", function () { if (form.requestSubmit) form.requestSubmit(); else form.submit(); }); });
    $$("input[type=search], input[type=text]", form).forEach(function (inp) {
      var last = inp.value;
      inp.addEventListener("input", function () {
        clearTimeout(timer);
        var v = inp.value.trim();
        if (v === last.trim()) return;
        if (v.length === 1) return; // un seul caractère : trop vague, on attend la suite
        timer = setTimeout(function () { last = inp.value; if (form.requestSubmit) form.requestSubmit(); else form.submit(); }, 500);
      });
    });
  });

  // ===================================================================================================================
  // 3. Démarrage : étapes à gauche, détail à droite
  // ===================================================================================================================
  $$("[data-setup]").forEach(function (box) {
    var steps = $$("[data-step]", box), panels = $$("[data-panel]", box);
    function open(id) {
      steps.forEach(function (s) { var on = s.getAttribute("data-step") === id; s.setAttribute("aria-selected", String(on)); s.classList.toggle("is-current", on); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== id; });
    }
    steps.forEach(function (s) { s.addEventListener("click", function () { open(s.getAttribute("data-step")); }); });
    var first = steps.filter(function (s) { return !s.classList.contains("is-done"); })[0] || steps[0];
    if (first) open(first.getAttribute("data-step"));
  });

  // ===================================================================================================================
  // 4. Bandeaux fermables (mémorisés dans ce navigateur)
  // ===================================================================================================================
  $$("[data-banner]").forEach(function (b) {
    var key = "kolaBanner:" + b.getAttribute("data-banner");
    if (store.get(key) === "1") { b.hidden = true; return; }
    var x = b.querySelector(".mk-banner-x");
    if (x) x.addEventListener("click", function () { b.hidden = true; store.set(key, "1"); });
  });

  // ===================================================================================================================
  // 5. Sélection de lignes : case d'en-tête (état indéterminé), barre d'actions groupées
  // ===================================================================================================================
  $$("table[data-kola-select]").forEach(function (table) {
    var all = table.querySelector("[data-select-all]"), rows = $$("[data-select-row]", table);
    var bar = document.querySelector("[data-bulk-for='" + (table.id || "") + "']") || table.closest(".mk-content").querySelector(".mk-bulk");
    function sync() {
      var n = rows.filter(function (r) { return r.checked; }).length;
      rows.forEach(function (r) { var tr = r.closest("tr"); if (tr) tr.classList.toggle("is-selected", r.checked); });
      if (all) { all.checked = n > 0 && n === rows.length; all.indeterminate = n > 0 && n < rows.length; }
      if (bar) { bar.classList.toggle("is-on", n > 0); var c = bar.querySelector("[data-bulk-count]"); if (c) c.textContent = n + (n > 1 ? " sélectionnés" : " sélectionné"); }
    }
    if (all) all.addEventListener("change", function () { rows.forEach(function (r) { r.checked = all.checked; }); sync(); });
    rows.forEach(function (r) { r.addEventListener("change", sync); });
    sync();
  });

  // ===================================================================================================================
  // 6. Menus d'actions (details.mk-dd) : un seul ouvert, fermé par Échap ou un clic à côté
  // ===================================================================================================================
  document.addEventListener("click", function (e) { $$("details.mk-dd[open]").forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute("open"); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    $$("details.mk-dd[open]").forEach(function (d) { d.removeAttribute("open"); var s = d.querySelector("summary"); if (s) s.focus(); });
  });

  // ===================================================================================================================
  // 7. Pagination : le champ « Page » se valide avec Entrée ; le nombre de lignes s'applique au changement
  // ===================================================================================================================
  $$("form.mk-pb-size select, form.mk-pb-nav input.mk-pb-page").forEach(function (el) {
    el.addEventListener("change", function () { if (el.form) { if (el.form.requestSubmit) el.form.requestSubmit(); else el.form.submit(); } });
  });

  prepare();
  // Contenus ajoutés après coup (aperçus, résultats rechargés) : les nouvelles commandes reçoivent aussi leur infobulle
  if (window.MutationObserver) {
    var pending = null;
    new MutationObserver(function (recs) {
      if (recs.every(function (r) { return tipEl && (r.target === tipEl || tipEl.contains(r.target)); })) return; // l'infobulle elle-même change à chaque affichage : rien à préparer
      clearTimeout(pending); pending = setTimeout(prepare, 120);
    }).observe(document.body, { childList: true, subtree: true });
  }
  window.KolaTips = { show: show, hide: hide, refresh: prepare, data: DATA };
  void uid;
})();

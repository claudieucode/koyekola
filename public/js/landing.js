// Page d'atterrissage : fuseau horaire du navigateur transmis avec l'inscription (envoi des e-mails à l'heure locale)
(function () {
  "use strict";
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    Array.prototype.forEach.call(document.querySelectorAll("input[data-tz]"), function (i) { i.value = tz; });
  } catch (e) { /* fuseau inconnu : rien n'est envoyé */ }
})();

// Sections libres : onglets (sans script, tous les panneaux restent lisibles l'un sous l'autre) et comptes à rebours
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-tabs]"), function (box, k) {
    var panels = box.querySelectorAll(".kw-tab-panel");
    if (panels.length < 2) return;
    var list = document.createElement("div");
    var vertical = box.classList.contains("is-vertical");
    list.className = "kw-tab-list";
    list.setAttribute("role", "tablist");
    if (vertical) list.setAttribute("aria-orientation", "vertical");
    var buttons = [];
    var show = function (i, focus) {
      buttons.forEach(function (b, j) { b.setAttribute("aria-selected", i === j ? "true" : "false"); b.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
      if (focus) buttons[i].focus();
    };
    Array.prototype.forEach.call(panels, function (panel, i) {
      var id = "kw-tabs-" + k + "-" + i;
      panel.id = id + "-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", id);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "kw-tab-btn";
      b.id = id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", panel.id);
      b.textContent = panel.getAttribute("data-kw-tab-title") || "";
      var ic = panel.querySelector(".kw-tab-icon-src");
      if (ic) { var sp = document.createElement("span"); sp.className = "kw-tab-icon"; sp.setAttribute("aria-hidden", "true"); sp.innerHTML = ic.innerHTML; b.insertBefore(sp, b.firstChild); }
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("keydown", function (e) {
        var next = vertical ? e.key === "ArrowDown" : e.key === "ArrowRight", prev = vertical ? e.key === "ArrowUp" : e.key === "ArrowLeft";
        if (next || prev) { e.preventDefault(); show((i + (next ? 1 : -1) + panels.length) % panels.length, true); }
        else if (e.key === "Home" || e.key === "End") { e.preventDefault(); show(e.key === "Home" ? 0 : panels.length - 1, true); }
      });
      buttons.push(b);
      list.appendChild(b);
    });
    box.insertBefore(list, box.firstChild);
    box.classList.add("is-enhanced");
    show(0);
  });
  // Carrousel : défilement natif (doigt, molette, clavier), boutons précédent / suivant ajoutés par le script
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-carousel]"), function (box) {
    var track = box.querySelector(".kw-carousel-track");
    if (!track || box.classList.contains("is-enhanced")) return;
    var mk = function (label, dir) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "kw-carousel-btn " + (dir < 0 ? "is-prev" : "is-next"); b.setAttribute("aria-label", label);
      b.textContent = dir < 0 ? "‹" : "›";
      b.addEventListener("click", function () { var s = track.querySelector(".kw-carousel-slide"); track.scrollBy({ left: dir * (s ? s.getBoundingClientRect().width + 12 : track.clientWidth), behavior: "smooth" }); });
      box.appendChild(b);
      return b;
    };
    var slides = track.querySelectorAll(".kw-carousel-slide");
    var loop = box.hasAttribute("data-kw-loop");
    var current = function () { var w = slides[0] ? slides[0].getBoundingClientRect().width + 12 : track.clientWidth; return Math.round(track.scrollLeft / w); };
    var goTo = function (i) { var s = slides[(i + slides.length) % slides.length]; if (s) track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: "smooth" }); };
    var prev = mk("Image précédente", -1), next = mk("Image suivante", 1);
    var dots = [];
    if (box.hasAttribute("data-kw-dots") && slides.length > 1) {
      var nav = document.createElement("div"); nav.className = "kw-carousel-dots";
      Array.prototype.forEach.call(slides, function (sl, i) {
        var d = document.createElement("button"); d.type = "button"; d.className = "kw-carousel-dot"; d.setAttribute("aria-label", "Image " + (i + 1) + " sur " + slides.length);
        d.addEventListener("click", function () { goTo(i); });
        nav.appendChild(d); dots.push(d);
      });
      box.appendChild(nav);
    }
    var sync = function () {
      var atStart = track.scrollLeft <= 2, atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      prev.disabled = !loop && atStart; next.disabled = !loop && atEnd;
      var c = atEnd ? slides.length - 1 : current();
      dots.forEach(function (d, i) { d.setAttribute("aria-current", i === c ? "true" : "false"); });
    };
    // Transition « fondu » : un seul élément visible à la fois (empilés, l'actif est opaque) ; sans ce script, le défilement natif reste en place
    var fade = box.getAttribute("data-kw-effect") === "fade" && slides.length > 1, idx = 0;
    if (fade) {
      box.classList.add("is-fade");
      var show = function (i) {
        idx = (i + slides.length) % slides.length;
        Array.prototype.forEach.call(slides, function (s, k) { s.classList.toggle("is-active", k === idx); s.setAttribute("aria-hidden", k === idx ? "false" : "true"); });
        dots.forEach(function (d, k) { d.setAttribute("aria-current", k === idx ? "true" : "false"); });
        prev.disabled = !loop && idx === 0; next.disabled = !loop && idx === slides.length - 1;
      };
      current = function () { return idx; };
      goTo = function (i) { show(i); };
      sync = function () { show(idx); };
      prev.replaceWith(prev = prev.cloneNode(true)); next.replaceWith(next = next.cloneNode(true));
      prev.addEventListener("click", function () { show(idx - 1); });
      next.addEventListener("click", function () { show(idx + 1); });
    }
    if (loop && !fade) {
      prev.onclick = null; next.onclick = null;
      prev.replaceWith(prev = prev.cloneNode(true)); next.replaceWith(next = next.cloneNode(true));
      prev.addEventListener("click", function () { var atStart = track.scrollLeft <= 2; goTo(atStart ? slides.length - 1 : current() - 1); });
      next.addEventListener("click", function () { var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; goTo(atEnd ? 0 : current() + 1); });
    }
    // Lecture automatique : jamais si la personne réduit les animations ; arrêt au survol, au focus, ou après un geste
    var every = Number(box.getAttribute("data-kw-autoplay"));
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (every && !reduceMotion && !document.body.hasAttribute("data-kw-builder")) {
      var paused = false, stopped = false;
      ["mouseenter", "focusin"].forEach(function (t) { box.addEventListener(t, function () { paused = true; }); });
      ["mouseleave", "focusout"].forEach(function (t) { box.addEventListener(t, function () { paused = false; }); });
      track.addEventListener("pointerdown", function () { stopped = true; });
      setInterval(function () {
        if (paused || stopped || document.hidden) return;
        var atEnd = fade ? idx === slides.length - 1 : track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
        if (atEnd && !loop) { stopped = true; return; }
        goTo(atEnd ? 0 : current() + 1);
      }, every * 1000);
    }
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    box.classList.add("is-enhanced");
    sync();
  });
  // Animations d'entrée (moteur de mouvement) : l'élément joue son animation quand elle est déclenchée — en arrivant à l'écran
  // (par défaut), au chargement, au clic ou au survol. Jamais dans l'éditeur (le contenu y reste visible), rien n'est masqué sans ce
  // script, et si la personne a demandé moins de mouvement l'animation est supprimée (ou réduite à un fondu court), sauf choix contraire
  // explicite de l'auteur (data-kw-motion-always).
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var inBuilder = document.body.hasAttribute("data-kw-builder");
  var animated = document.querySelectorAll("[data-kw-anim]");
  if (animated.length && !inBuilder) {
    var canObserve = "IntersectionObserver" in window;
    if (canObserve) document.documentElement.classList.add("kw-anim-ready");
    var io = canObserve ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var again = en.target.hasAttribute("data-kw-anim-repeat");
        if (en.isIntersecting) { en.target.classList.add("is-in"); if (!again) io.unobserve(en.target); }
        else if (again) en.target.classList.remove("is-in"); // rejouée à la prochaine arrivée à l'écran
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }) : null;
    // Rejouer sur place (clic, survol) : on retire la classe, on force le calcul de style, on la remet
    var replay = function (el) { el.classList.remove("is-in", "kw-ix-replay"); void el.offsetWidth; el.classList.add("kw-ix-replay"); };
    Array.prototype.forEach.call(animated, function (el) {
      var calm = reduce && !el.hasAttribute("data-kw-motion-always");
      if (calm && el.getAttribute("data-kw-anim-rm") !== "fade") { el.classList.add("is-in"); return; } // visible tout de suite, sans mouvement
      var trigger = el.getAttribute("data-kw-anim-trigger") || "viewport";
      if (trigger === "click") el.addEventListener("click", function () { replay(el); });
      else if (trigger === "hover") el.addEventListener("mouseenter", function () { replay(el); });
      else if (trigger === "load" || !io) window.requestAnimationFrame(function () { el.classList.add("is-in"); });
      else io.observe(el);
    });
  }
  // Galerie : agrandir une image (visionneuse), flèches et Échap ; sans script, le lien ouvre l'image
  // Réglages du site (Visionneuse) : lus sur la page ; désactivée, le lien ouvre simplement l'image
  var lbSet = document.body.dataset;
  var lbOff = lbSet.kwLb === "off", lbArrows = lbSet.kwLbArrows !== "0", lbOverlayClose = lbSet.kwLbOverlayClose !== "0", lbAnim = lbSet.kwLbAnim || "fade";
  Array.prototype.forEach.call(lbOff ? [] : document.querySelectorAll("[data-kw-lightbox]"), function (box) {
    var links = box.querySelectorAll(".kw-lb-open");
    if (!links.length || typeof HTMLDialogElement !== "function") return;
    var dlg = document.createElement("dialog"); dlg.className = "kw-lightbox is-anim-" + lbAnim; dlg.setAttribute("aria-label", "Image agrandie");
    var img = document.createElement("img"); var cap = document.createElement("p"); cap.className = "kw-lightbox-cap";
    var close = document.createElement("button"); close.type = "button"; close.className = "kw-lightbox-close"; close.setAttribute("aria-label", "Fermer"); close.textContent = "×";
    var pv = document.createElement("button"); pv.type = "button"; pv.className = "kw-lightbox-nav is-prev"; pv.setAttribute("aria-label", "Image précédente"); pv.textContent = "‹";
    var nx = document.createElement("button"); nx.type = "button"; nx.className = "kw-lightbox-nav is-next"; nx.setAttribute("aria-label", "Image suivante"); nx.textContent = "›";
    dlg.appendChild(close); dlg.appendChild(pv); dlg.appendChild(img); dlg.appendChild(nx); dlg.appendChild(cap);
    document.body.appendChild(dlg);
    var at = 0;
    var show = function (i) { at = (i + links.length) % links.length; var l = links[at], im = l.querySelector("img"); img.src = l.getAttribute("href"); img.alt = im ? im.alt : ""; var fc = l.parentNode.querySelector("figcaption"); cap.textContent = fc ? fc.textContent : img.alt; };
    Array.prototype.forEach.call(links, function (l, i) { l.addEventListener("click", function (e) { e.preventDefault(); show(i); dlg.showModal(); }); });
    close.addEventListener("click", function () { dlg.close(); });
    // précédente / suivante : les images masquées par un filtre sont sautées
    var step = function (d) { var n = at; for (var k = 0; k < links.length; k++) { n = (n + d + links.length) % links.length; var fig = links[n].closest(".kw-gallery-item"); if (!fig || !fig.hidden) { show(n); return; } } };
    pv.addEventListener("click", function () { step(-1); }); nx.addEventListener("click", function () { step(1); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); });
    dlg.addEventListener("click", function (e) { if (lbOverlayClose && e.target === dlg) dlg.close(); });
    pv.hidden = nx.hidden = links.length < 2 || !lbArrows;
  });
  // Playlist vidéo : cliquer un titre lit la vidéo dans le lecteur (sans script, le titre ouvre la vidéo dans un nouvel onglet)
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-vplay]"), function (box) {
    var frame = box.querySelector(".kw-vp-frame"), items = box.querySelectorAll(".kw-vp-item");
    if (!frame) return;
    var play = function (a) {
      var src = a.getAttribute("data-kw-vp-src"); if (!src) return false;
      frame.src = src; frame.title = a.getAttribute("data-kw-vp-title") || "";
      Array.prototype.forEach.call(items, function (o) { var on = o === a; o.classList.toggle("is-current", on); if (on) o.setAttribute("aria-current", "true"); else o.removeAttribute("aria-current"); });
      return true;
    };
    Array.prototype.forEach.call(items, function (a) { a.addEventListener("click", function (e) { if (play(a)) e.preventDefault(); }); a.removeAttribute("target"); });
  });
  // Diaporama en arrière-plan : une image après l'autre (immobile si « réduire les animations »)
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-bgslides]"), function (box) {
    var imgs = box.querySelectorAll(".kw-bgslide"), sec = Math.max(2, Number(box.getAttribute("data-kw-bgslides")) || 5), at = 0;
    if (imgs.length < 2 || document.body.hasAttribute("data-kw-builder") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
    setInterval(function () { imgs[at].classList.remove("is-on"); at = (at + 1) % imgs.length; imgs[at].classList.add("is-on"); }, sec * 1000);
  });
  // Galerie : barre de filtres par étiquette (les images sans étiquette ne s'affichent que sous « Tous »)
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-gal-filters]"), function (bar) {
    var gal = bar.parentNode;
    Array.prototype.forEach.call(bar.querySelectorAll(".kw-gal-filter"), function (b) {
      b.addEventListener("click", function () {
        var tag = b.getAttribute("data-tag");
        Array.prototype.forEach.call(bar.querySelectorAll(".kw-gal-filter"), function (o) { var on = o === b; o.classList.toggle("is-on", on); o.setAttribute("aria-pressed", on ? "true" : "false"); });
        Array.prototype.forEach.call(gal.querySelectorAll(".kw-gallery-item"), function (f) { f.hidden = Boolean(tag) && f.getAttribute("data-tag") !== tag; });
      });
    });
  });
  // En-tête réglé dans le Header Builder (data-kw-scroll) : classe is-scrolled au-delà du seuil (data-kw-threshold, 8 px par défaut), masquage en descendant /
  // réapparition en remontant (data-kw-hide), espaceur d'un en-tête « fixé ». Un seul écouteur passif, une mise à jour par image ; aucune animation si le visiteur demande moins de mouvement.
  var fxHead = document.querySelector(".lp-site-header[data-kw-scroll]");
  if (fxHead && !document.body.hasAttribute("data-kw-builder")) {
    var fxThr = Number(fxHead.getAttribute("data-kw-threshold")); if (!(fxThr >= 0 && fxThr <= 1000)) fxThr = 8;
    var fxHide = fxHead.hasAttribute("data-kw-hide"), fxTol = Number(fxHead.getAttribute("data-kw-hide-tol")); if (!(fxTol >= 0 && fxTol <= 100)) fxTol = 8;
    var fxTick = false, fxLast = window.pageYOffset || document.documentElement.scrollTop || 0;
    var fxSet = function () {
      fxTick = false;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      fxHead.classList.toggle("is-scrolled", y > fxThr);
      if (fxHide) {
        var open = fxHead.querySelector("[aria-expanded=true]") || fxHead.contains(document.activeElement);
        if (y <= fxThr || y < fxLast - fxTol || open) { fxHead.classList.remove("is-hidden"); fxLast = y; }
        else if (y > fxLast + fxTol) { fxHead.classList.add("is-hidden"); fxLast = y; }
      }
    };
    window.addEventListener("scroll", function () { if (!fxTick) { fxTick = true; window.requestAnimationFrame(fxSet); } }, { passive: true });
    if (fxHide) fxHead.addEventListener("focusin", function () { fxHead.classList.remove("is-hidden"); });
    fxSet();
    // « Se cache » : masqué quand on descend (au-delà de 120 px), réaffiché dès qu'on remonte ; jamais masqué tant qu'un menu de l'en-tête a le focus ou est ouvert
    if (fxHead.getAttribute("data-kw-scroll") === "hide") {
      var hideLast = window.pageYOffset || 0, hideTick = false;
      window.addEventListener("scroll", function () {
        if (hideTick) return; hideTick = true;
        window.requestAnimationFrame(function () {
          hideTick = false; var y = window.pageYOffset || document.documentElement.scrollTop || 0;
          if (Math.abs(y - hideLast) > 6) { fxHead.classList.toggle("is-hidden", y > hideLast && y > 120 && !fxHead.querySelector("[aria-expanded=true]")); hideLast = y; }
        });
      }, { passive: true });
    }
  }
  // Barre fermable ([data-kw-dismissible]) : le bouton masque la barre ; le choix est mémorisé dans le navigateur du visiteur (clé = identifiant de la barre + empreinte de son texte :
  // si le texte change, la barre revient). Rien n'est supprimé ; dans l'éditeur et dans l'aperçu de la bibliothèque, rien n'est mémorisé.
  if (!document.body.hasAttribute("data-kw-builder")) Array.prototype.forEach.call(document.querySelectorAll("[data-kw-dismissible]"), function (bar) {
    var btn = bar.querySelector(":scope > [data-kw-dismiss]"); if (!btn) return;
    var memo = !document.body.hasAttribute("data-kw-demo"), id = (bar.className.match(/kw-n-[A-Za-z0-9_-]+/) || ["bar"])[0], t = (bar.textContent || "").replace(/\s+/g, " ").trim(), hsh = 0;
    for (var ci = 0; ci < t.length; ci += 1) hsh = (hsh * 31 + t.charCodeAt(ci)) | 0;
    var key = "kw-dismiss:" + id + ":" + (hsh >>> 0).toString(36);
    try { if (memo && window.localStorage.getItem(key) === "1") bar.classList.add("is-dismissed"); } catch (e) { /* stockage indisponible : la barre reste affichée */ }
    btn.addEventListener("click", function () { bar.classList.add("is-dismissed"); try { if (memo) window.localStorage.setItem(key, "1"); } catch (e) { /* non mémorisé */ } });
  });
  // Menus : sous-menus (bouton, clavier), et menu mobile replié derrière un bouton
  Array.prototype.forEach.call(document.querySelectorAll(".kw-sub-toggle"), function (b) {
    b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", open ? "false" : "true"); });
    // Échap referme et rend le focus à la rubrique ; « is-dismissed » masque le sous-menu / le panneau même si le focus reste dans la rubrique (sinon :focus-within le garderait ouvert), jusqu'à la sortie de la souris ou du focus
    var li0 = b.parentNode, undismiss = function () { li0.classList.remove("is-dismissed"); };
    li0.addEventListener("keydown", function (e) { if (e.key === "Escape") { b.setAttribute("aria-expanded", "false"); li0.classList.add("is-dismissed"); b.focus(); } else if (e.key === "ArrowDown" || e.key === "ArrowRight") undismiss(); });
    li0.addEventListener("mouseleave", undismiss);
    li0.addEventListener("focusout", function (e) { if (!e.relatedTarget || !li0.contains(e.relatedTarget)) undismiss(); });
    b.addEventListener("click", undismiss);
  });
  // Menu mobile : bouton « Menu » qui déplie la liste sous lui, ou — réglage « tiroir » (data-kw-menu-drawer) — l'ouvre dans un panneau latéral : fond assombri, défilement de la page bloqué,
  // focus gardé dans le panneau (Tab boucle), Échap / clic extérieur / choix d'un lien le ferment et le focus revient au bouton. La classe is-menu-open est posée sur l'en-tête (état de style « Menu ouvert »).
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-menu-toggle]"), function (nav) {
    var list = nav.querySelector(".kw-menu-list");
    var b = document.createElement("button"); b.type = "button"; b.className = "kw-menu-burger"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", list.id);
    b.innerHTML = '<span aria-hidden="true"></span><span class="kw-menu-burger-label">Menu</span>';
    var side = nav.getAttribute("data-kw-menu-drawer"), head = nav.closest(".lp-site-header"), small = window.matchMedia ? window.matchMedia("(max-width: " + (Number(nav.getAttribute("data-kw-menu-bp")) || 767) + "px)") : null;
    var panel = null, backdrop = null, locked = null;
    var focusables = function () { return Array.prototype.filter.call(panel.querySelectorAll("a[href], button:not([disabled])"), function (e) { return e.offsetParent !== null; }); };
    var setOpen = function (on) {
      b.setAttribute("aria-expanded", on ? "true" : "false"); nav.classList.toggle("is-open", on);
      if (head) head.classList.toggle("is-menu-open", on);
      if (!side) return;
      if (on) {
        var host = nav.closest(".lp-site") || document.body; // le panneau garde les couleurs et les polices du site, mais sort de l'en-tête (un fond flouté ou un transform y piégerait un panneau fixé)
        panel = document.createElement("div"); panel.className = "kw-menu-panel is-" + side; panel.setAttribute("role", "dialog"); panel.setAttribute("aria-modal", "true"); panel.setAttribute("aria-label", nav.getAttribute("aria-label") || "Menu");
        var close = document.createElement("button"); close.type = "button"; close.className = "kw-menu-close"; close.setAttribute("aria-label", "Fermer le menu"); close.innerHTML = "<span aria-hidden=\"true\">×</span>";
        close.addEventListener("click", function () { setOpen(false); b.focus(); });
        backdrop = document.createElement("div"); backdrop.className = "kw-menu-backdrop"; backdrop.addEventListener("click", function () { setOpen(false); b.focus(); });
        panel.appendChild(close); panel.appendChild(list); host.appendChild(backdrop); host.appendChild(panel);
        locked = document.documentElement.style.overflow; document.documentElement.style.overflow = "hidden";
        panel.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("a[href]")) setOpen(false); });
        panel.addEventListener("keydown", function (e) {
          if (e.key === "Escape") { e.stopPropagation(); setOpen(false); b.focus(); return; }
          if (e.key !== "Tab") return;
          var f = focusables(); if (!f.length) return; var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
        var f0 = focusables(); (f0[1] || f0[0] || close).focus();
      } else if (panel) {
        nav.appendChild(list); panel.remove(); backdrop.remove(); panel = null; backdrop = null; document.documentElement.style.overflow = locked || ""; locked = null;
      }
    };
    b.addEventListener("click", function () { setOpen(b.getAttribute("aria-expanded") !== "true"); });
    // 22.8 — clavier et lecteurs d'écran : Échap referme le menu et rend le focus au bouton ; Tab hors du menu le referme (jamais de menu resté ouvert hors de vue)
    nav.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); b.focus(); } });
    nav.addEventListener("focusout", function (e) { if (!side && nav.classList.contains("is-open") && e.relatedTarget && !nav.contains(e.relatedTarget)) setOpen(false); });
    var collapse = function () { nav.classList.toggle("is-collapsed", !small || small.matches); }; collapse(); // repli selon la largeur d'écran choisie (767 px par défaut)
    if (small && small.addEventListener) small.addEventListener("change", function (e) { collapse(); if (!e.matches && b.getAttribute("aria-expanded") === "true") setOpen(false); }); // retour sur grand écran : le menu redevient celui de l'en-tête
    nav.insertBefore(b, list);
    nav.classList.add("is-enhanced");
  });
  // Menus : clavier (flèches). Menu horizontal : Droite / Gauche changent de rubrique, Bas ouvre le sous-menu et va sur son premier lien. Liste verticale (menu vertical, tiroir) et sous-menus :
  // Bas / Haut parcourent les liens, Droite ouvre un sous-menu imbriqué, Gauche le referme et revient à sa rubrique. Début / Fin : premier / dernier lien. Échap referme (géré plus haut).
  Array.prototype.forEach.call(document.querySelectorAll(".kw-menu-list"), function (ul) {
    ul.addEventListener("keydown", function (e) {
      var k = e.key; if (["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].indexOf(k) < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
      var link = e.target.closest ? e.target.closest(".kw-menu-link") : null; if (!link) return;
      var li = link.parentNode, group = li.parentNode, top = group === ul;
      var sibs = Array.prototype.filter.call(group.children, function (x) { return x.tagName === "LI"; }), at = sibs.indexOf(li), n = sibs.length;
      var root = ul.closest(".kw-menu"), vertical = !top || !root || root.classList.contains("is-vertical") || Boolean(ul.closest(".kw-menu-panel"));
      var focusLink = function (x) { var l = x && x.querySelector(":scope > .kw-menu-link"); if (l) { e.preventDefault(); l.focus(); } };
      var openSub = function () {
        var t = li.querySelector(":scope > .kw-sub-toggle"); if (!t) return false; t.setAttribute("aria-expanded", "true");
        var first = li.querySelector(":scope > .kw-submenu > li"); if (first) { focusLink(first); return true; }
        var mega = li.querySelector(":scope > .kw-mega"), f = mega && mega.querySelector("a[href], button:not([disabled])"); // méga-menu : le premier lien ou bouton du panneau
        if (f) { e.preventDefault(); f.focus(); return true; } return false;
      };
      if (k === "Home") return focusLink(sibs[0]);
      if (k === "End") return focusLink(sibs[n - 1]);
      if (k === (vertical ? "ArrowDown" : "ArrowRight")) return focusLink(sibs[(at + 1) % n]);
      if (k === (vertical ? "ArrowUp" : "ArrowLeft")) return focusLink(sibs[(at - 1 + n) % n]);
      if (!vertical && k === "ArrowDown") { openSub(); return; }          // menu horizontal : Bas entre dans le sous-menu
      if (vertical && k === "ArrowRight") { openSub(); return; }           // liste verticale : Droite entre dans le sous-menu
      if (!top && k === "ArrowLeft") {                                     // sous-menu : Gauche referme et remonte à la rubrique
        var parent = group.parentNode, t = parent && parent.querySelector(":scope > .kw-sub-toggle"); if (t) t.setAttribute("aria-expanded", "false"); focusLink(parent);
      }
    });
  });
  // Mini-panier en tiroir : le panier s'ouvre dans un panneau latéral (dialogue natif : Échap ferme, le focus revient au bouton)
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-cart-open]"), function (open) {
    var dlg = document.getElementById(open.getAttribute("data-kw-cart-open")); if (!dlg || typeof dlg.showModal !== "function" || document.body.hasAttribute("data-kw-builder")) return;
    open.addEventListener("click", function () { dlg.showModal(); var f = dlg.querySelector(".kw-cart-close"); if (f) f.focus(); });
    var close = dlg.querySelector(".kw-cart-close"); if (close) close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener("close", function () { open.focus(); });
  });
  // Menu du compte (<details>) : Échap, clic en dehors ou focus qui sort le referment ; le focus revient au titre après Échap
  Array.prototype.forEach.call(document.querySelectorAll(".kw-account-details"), function (d) {
    d.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.open) { d.open = false; var s = d.querySelector("summary"); if (s) s.focus(); } });
    d.addEventListener("focusout", function (e) { if (d.open && e.relatedTarget && !d.contains(e.relatedTarget)) d.open = false; });
    document.addEventListener("click", function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
  // Recherche : loupe → recherche en plein écran (dialogue natif : Échap ferme, le focus est rendu à la loupe), et suggestions pendant la frappe (data-kw-suggest) :
  // requête différée de 200 ms, une seule à la fois, résultats écrits avec textContent (jamais de HTML), flèches Haut / Bas, Entrée suit le lien, annonce du nombre de résultats pour les lecteurs d'écran.
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-search-open]"), function (open) {
    var dlg = document.getElementById(open.getAttribute("data-kw-search-open")); if (!dlg || typeof dlg.showModal !== "function" || document.body.hasAttribute("data-kw-builder")) return;
    open.addEventListener("click", function () { dlg.showModal(); var input = dlg.querySelector("input[type=search]"); if (input) input.focus(); });
    var close = dlg.querySelector(".kw-search-close"); if (close) close.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); }); // clic sur le fond
    dlg.addEventListener("close", function () { open.focus(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-suggest]"), function (form) {
    var input = form.querySelector("input[type=search]"), host = form.parentNode, list = host.querySelector(".kw-search-suggest"), status = host.querySelector("[data-kw-suggest-status]");
    if (!input || !list || document.body.hasAttribute("data-kw-builder")) return;
    var url = form.getAttribute("data-kw-suggest"), timer = null, ctl = null, shown = -1;
    var hide = function () { list.hidden = true; list.textContent = ""; shown = -1; input.setAttribute("aria-expanded", "false"); input.removeAttribute("aria-activedescendant"); };
    var mark = function (i) { var items = list.querySelectorAll("[role=option]"); Array.prototype.forEach.call(items, function (it, k) { it.setAttribute("aria-selected", k === i ? "true" : "false"); }); shown = i; if (items[i]) input.setAttribute("aria-activedescendant", items[i].id); else input.removeAttribute("aria-activedescendant"); };
    var paint = function (results) {
      list.textContent = "";
      if (!results.length) { hide(); if (status) status.textContent = "Aucune suggestion"; return; }
      results.forEach(function (r, k) {
        var li = document.createElement("li"), a = document.createElement("a"), kind = document.createElement("span");
        li.setAttribute("role", "option"); li.id = list.id + "-" + k; li.setAttribute("aria-selected", "false");
        a.href = r.url; a.textContent = r.title; kind.className = "kw-suggest-kind"; kind.textContent = r.kind || ""; a.appendChild(kind); li.appendChild(a); list.appendChild(li);
      });
      list.hidden = false; input.setAttribute("aria-expanded", "true"); shown = -1;
      if (status) status.textContent = results.length + (results.length > 1 ? " suggestions disponibles" : " suggestion disponible");
    };
    input.setAttribute("role", "combobox"); input.setAttribute("aria-expanded", "false");
    input.addEventListener("input", function () {
      clearTimeout(timer); var q = input.value.trim();
      if (q.length < 2) { if (ctl) ctl.abort(); hide(); if (status) status.textContent = ""; return; }
      timer = setTimeout(function () {
        if (ctl) ctl.abort(); ctl = typeof AbortController === "function" ? new AbortController() : null;
        fetch(url + "?q=" + encodeURIComponent(q), { credentials: "same-origin", signal: ctl ? ctl.signal : undefined }).then(function (r) { return r.ok ? r.json() : { results: [] }; })
          .then(function (j) { if (input.value.trim() === q) paint(Array.isArray(j.results) ? j.results.slice(0, 6) : []); }, function () { /* annulée ou hors ligne : aucune suggestion */ });
      }, 200);
    });
    input.addEventListener("keydown", function (e) {
      var items = list.querySelectorAll("[role=option]");
      if (e.key === "ArrowDown" && items.length) { e.preventDefault(); mark((shown + 1) % items.length); }
      else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); mark((shown - 1 + items.length) % items.length); }
      else if (e.key === "Enter" && shown >= 0 && items[shown]) { e.preventDefault(); items[shown].querySelector("a").click(); }
      else if (e.key === "Escape" && !list.hidden) { e.stopPropagation(); hide(); }
    });
    document.addEventListener("click", function (e) { if (!host.contains(e.target)) hide(); });
  });
  // Méga-menu : le panneau est recalé pour rester dans l'écran (décalage horizontal minimal), à l'ouverture au survol, au focus ou au clic
  var fitMega = function (li) {
    var p = li.querySelector(":scope > .kw-mega"); if (!p || window.getComputedStyle(p).position !== "absolute" || li.closest("[data-kw-mega-width=full]")) return;
    p.style.marginLeft = "0px";
    var r = p.getBoundingClientRect(), vw = document.documentElement.clientWidth, shift = 0;
    if (r.right > vw - 8) shift = vw - 8 - r.right;
    if (r.left + shift < 8) shift = 8 - r.left;
    p.style.marginLeft = shift + "px";
  };
  Array.prototype.forEach.call(document.querySelectorAll(".kw-menu-item.has-mega"), function (li) {
    var later = function () { window.requestAnimationFrame(function () { fitMega(li); }); };
    li.addEventListener("mouseenter", later); li.addEventListener("focusin", later);
    var t = li.querySelector(":scope > .kw-sub-toggle"); if (t) t.addEventListener("click", later);
  });
  // Méga-menu et sous-menus ouverts au clic ou au clavier : un clic en dehors du menu, ou le focus qui le quitte, les referme (jamais de panneau resté ouvert hors de portée)
  document.addEventListener("click", function (e) {
    Array.prototype.forEach.call(document.querySelectorAll(".kw-menu .kw-sub-toggle[aria-expanded=true]"), function (t) { var li = t.parentNode; if (li && !li.contains(e.target)) t.setAttribute("aria-expanded", "false"); });
  });
  Array.prototype.forEach.call(document.querySelectorAll(".kw-menu-item.has-mega"), function (li) {
    li.addEventListener("focusout", function (e) { var t = li.querySelector(":scope > .kw-sub-toggle"); if (t && e.relatedTarget && !li.contains(e.relatedTarget)) t.setAttribute("aria-expanded", "false"); });
  });
  // Fenêtres (modales) de la page
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-modal-open]"), function (b) {
    var dlg = document.getElementById(b.getAttribute("data-kw-modal-open"));
    if (!dlg || typeof dlg.showModal !== "function" || document.body.hasAttribute("data-kw-builder")) return;
    // Coin et barre du bas : fenêtres NON bloquantes (le reste de la page reste utilisable) ; les autres sont des fenêtres modales
    var soft = dlg.classList.contains("kw-popup-corner") || dlg.classList.contains("kw-popup-bar");
    var animIn = dlg.getAttribute("data-kw-anim-in"), animOut = dlg.getAttribute("data-kw-anim-out"), noScroll = dlg.hasAttribute("data-kw-noscroll");
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; // mouvement réduit : pas d'animation
    var show = function () {
      if (soft) dlg.show(); else dlg.showModal();
      if (animIn && !calm) { dlg.setAttribute("data-kw-anim", animIn); dlg.addEventListener("animationend", function done() { dlg.removeEventListener("animationend", done); dlg.removeAttribute("data-kw-anim"); }); }
      if (noScroll) document.documentElement.classList.add("kw-noscroll");
    };
    // Fermeture : animation de sortie (si demandée), puis fermeture réelle ; le défilement de la page est rendu
    var closing = false;
    var shut = function () { if (dlg.open) HTMLDialogElement.prototype.close.call(dlg); if (noScroll) document.documentElement.classList.remove("kw-noscroll"); };
    dlg.close = function () {
      if (!dlg.open || closing) return;
      if (animOut && !calm) {
        closing = true; dlg.setAttribute("data-kw-anim-out-run", animOut);
        var fin = function () { dlg.removeEventListener("animationend", fin); dlg.removeAttribute("data-kw-anim-out-run"); closing = false; shut(); };
        dlg.addEventListener("animationend", fin); setTimeout(function () { if (closing) fin(); }, 600);
      } else shut();
    };
    dlg.addEventListener("close", function () { if (noScroll) document.documentElement.classList.remove("kw-noscroll"); });
    b.addEventListener("click", show);
    dlg.querySelector("[data-kw-modal-close]").addEventListener("click", function () { dlg.close(); b.focus(); });
    // « Ne plus afficher » : mémorisé pour ce visiteur (stockage local), la fenêtre ne s'ouvre plus d'elle-même
    var offKey = "kw-pop-off-" + dlg.id, off = dlg.querySelector("[data-kw-modal-dismiss]");
    if (off) off.addEventListener("click", function () { try { window.localStorage.setItem(offKey, "1"); } catch (e) { /* stockage refusé : la fenêtre pourra revenir */ } dlg.close(); });
    var lock = dlg.hasAttribute("data-kw-lock");
    dlg.addEventListener("click", function (e) { if (e.target === dlg && !lock) dlg.close(); });
    if (lock) dlg.addEventListener("cancel", function (e) { e.preventDefault(); }); // Échap ne ferme pas : seul le bouton « × » ferme
    // Ouverture automatique : déclencheur choisi, une fois par fenêtre ; fréquence mémorisée (toujours / une fois par visite / une seule fois pour ce visiteur)
    var mode = dlg.getAttribute("data-kw-auto");
    if (mode) {
      var key = "kw-pop-" + dlg.id, freq = dlg.getAttribute("data-kw-auto-freq") || "session", done = false;
      var seen = function () { try { return freq === "once" ? window.localStorage.getItem(key) : freq === "session" ? window.sessionStorage.getItem(key) : null; } catch (e) { return null; } };
      var mark = function () { try { if (freq === "once") window.localStorage.setItem(key, "1"); else if (freq === "session") window.sessionStorage.setItem(key, "1"); } catch (e) { /* stockage refusé : la fenêtre pourra revenir */ } };
      var open = function () {
        if (done || seen() || dlg.open || document.querySelector("dialog[open]")) return; // jamais deux fenêtres en même temps
        try { if (window.localStorage.getItem(offKey)) return; } catch (e) { /* stockage refusé */ }
        var today = new Date(), iso = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2); // jour du visiteur
        var from = dlg.getAttribute("data-kw-auto-from"), until = dlg.getAttribute("data-kw-auto-until");
        if ((from && iso < from) || (until && iso > until)) return; // hors de la période d'affichage
        if (views < minViews || (source && source !== origin)) return; // règles d'affichage non remplies
        done = true; mark(); show();
        var secs = Number(dlg.getAttribute("data-kw-auto-close")) || 0;
        if (secs) setTimeout(function () { if (dlg.open) dlg.close(); }, secs * 1000);
      };
      var delay = (Number(dlg.getAttribute("data-kw-auto-delay")) || 0) * 1000;
      // Pages vues pendant la visite (compteur de session, une seule fois par page chargée) et provenance du visiteur
      var minViews = Number(dlg.getAttribute("data-kw-auto-views")) || 0, source = dlg.getAttribute("data-kw-auto-source") || "", views = 1, origin = "direct";
      try { views = Number(window.sessionStorage.getItem("kw-views") || 0); if (!window.__kwViewed) { window.__kwViewed = true; views += 1; window.sessionStorage.setItem("kw-views", String(views)); } } catch (e) { /* stockage refusé */ }
      var ref = document.referrer, host = ""; try { host = ref ? new URL(ref).hostname.replace(/^www\./, "") : ""; } catch (e) { host = ""; }
      if (host && host !== location.hostname.replace(/^www\./, "")) origin = /(^|\.)(google|bing|duckduckgo|qwant|ecosia|yahoo|yandex|brave)\./.test(host) ? "search" : /(facebook|instagram|twitter|x\.com|t\.co|linkedin|tiktok|youtube|pinterest|reddit|whatsapp|snapchat)/.test(host) ? "social" : "other";
      else if (host) origin = "internal";
      if (mode === "clicks") {
        var need = Number(dlg.getAttribute("data-kw-auto-clicks")) || 3, count = 0;
        document.addEventListener("click", function onClk(e) { if (e.target.closest && e.target.closest("dialog")) return; if (++count >= need) { document.removeEventListener("click", onClk); open(); } });
      }
      if (mode === "scrollup") {
        var lastY = window.scrollY, upFrom = lastY;
        var onUp = function () { var y = window.scrollY; if (y > lastY) upFrom = y; else if (upFrom - y > 80) { window.removeEventListener("scroll", onUp); open(); } lastY = y; };
        window.addEventListener("scroll", onUp, { passive: true });
      } else if (mode === "element") {
        var tid = dlg.getAttribute("data-kw-auto-target"), tgt = tid && (document.getElementById(tid) || document.querySelector('[name="' + tid + '"]'));
        if (tgt && "IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); open(); } }); io.observe(tgt); }
      }
      if (mode === "load") setTimeout(open, delay);
      else if (mode === "scroll") {
        var at = (Number(dlg.getAttribute("data-kw-auto-scroll")) || 50) / 100;
        var onScroll = function () { var h = document.documentElement.scrollHeight - window.innerHeight; if (h > 0 && window.scrollY / h >= at) { window.removeEventListener("scroll", onScroll); open(); } };
        window.addEventListener("scroll", onScroll, { passive: true });
      } else if (mode === "exit") {
        document.addEventListener("mouseout", function onOut(e) { if (!e.relatedTarget && e.clientY <= 0) { document.removeEventListener("mouseout", onOut); open(); } });
      } else if (mode === "idle") {
        var timer, reset = function () { clearTimeout(timer); timer = setTimeout(open, delay || 20000); };
        ["mousemove", "keydown", "scroll", "touchstart", "click"].forEach(function (ev) { window.addEventListener(ev, reset, { passive: true }); });
        reset();
      }
    }
  });
  // Alertes que l'on peut fermer
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-dismiss]"), function (box) {
    var c = document.createElement("button"); c.type = "button"; c.className = "kw-alert-close"; c.setAttribute("aria-label", "Fermer ce message"); c.textContent = "×";
    c.addEventListener("click", function () { box.hidden = true; });
    box.appendChild(c);
  });
  // Compteurs et barres de progression animés à l'apparition (la valeur finale est déjà écrite dans la page)
  var counters = document.querySelectorAll("[data-kw-count]"), bars = document.querySelectorAll(".kw-progress-anim");
  if ((counters.length || bars.length) && "IntersectionObserver" in window && !document.body.hasAttribute("data-kw-builder") && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    document.documentElement.classList.add("kw-count-ready");
    var run = function (el) {
      var target = Number(el.getAttribute("data-kw-count")), dec = Number(el.getAttribute("data-kw-decimals")) || 0, dur = Number(el.getAttribute("data-kw-duration")) || 1500, wait = Number(el.getAttribute("data-kw-delay")) || 0, from = Number(el.getAttribute("data-kw-start")) || 0, ease = el.getAttribute("data-kw-ease");
      var out = el.querySelector(".kw-counter-value"), t0 = null;
      var sepMode = el.getAttribute("data-kw-sep");
      var fmt = function (v) { var s = v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); return sepMode === "dot" ? s.replace(/[\u202f\u00a0]/g, ".") : sepMode === "none" ? s.replace(/[\u202f\u00a0]/g, "") : s; };
      var step = function (t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur); var e = ease === "linear" ? k : ease === "out" ? 1 - Math.pow(1 - k, 5) : 1 - Math.pow(1 - k, 3); out.textContent = fmt(from + (target - from) * e); if (k < 1) requestAnimationFrame(step); else out.textContent = fmt(target); };
      if (wait > 0) setTimeout(function () { requestAnimationFrame(step); }, wait); else requestAnimationFrame(step);
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (!en.isIntersecting) return; obs.unobserve(en.target); if (en.target.hasAttribute("data-kw-count")) run(en.target); else en.target.classList.add("is-in"); });
    }, { threshold: 0.3 });
    Array.prototype.forEach.call(counters, function (el) { el.querySelector(".kw-counter-value").textContent = (Number(el.getAttribute("data-kw-start")) || 0).toLocaleString("fr-FR", { minimumFractionDigits: Number(el.getAttribute("data-kw-decimals")) || 0, maximumFractionDigits: Number(el.getAttribute("data-kw-decimals")) || 0 }); obs.observe(el); });
    Array.prototype.forEach.call(bars, function (el) { obs.observe(el); });
  }
  // Interactions : [déclencheur, action, élément visé] ; l'élément visé est retrouvé par sa classe (.kw-n-<id>)
  var builder = document.body.hasAttribute("data-kw-builder");
  var targetOf = function (id) { return /^[a-z0-9]{6,20}$/.test(id) ? document.querySelector(".kw-n-" + id) : null; };
  var runAction = function (action, el) {
    if (!el) return;
    if (action === "show") { el.classList.remove("kw-ix-hidden"); el.classList.add("kw-ix-shown"); }
    else if (action === "hide") { el.classList.add("kw-ix-hidden"); el.classList.remove("kw-ix-shown"); }
    else if (action === "toggle") { var hide = !el.classList.contains("kw-ix-hidden"); el.classList.toggle("kw-ix-hidden", hide); el.classList.toggle("kw-ix-shown", !hide); }
    else if (action === "scroll") el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    else if (action === "open") { var d = el.querySelector("dialog"); if (d && typeof d.showModal === "function" && !d.open) d.showModal(); }
    else if (action === "animate" && !reduce) { el.classList.remove("is-in", "kw-ix-replay"); void el.offsetWidth; el.classList.add("kw-ix-replay"); }
  };
  if (!builder) Array.prototype.forEach.call(document.querySelectorAll("[data-kw-ix]"), function (el) {
    var list; try { list = JSON.parse(el.getAttribute("data-kw-ix")); } catch (e) { return; }
    (Array.isArray(list) ? list : []).forEach(function (ix) {
      var trigger = ix[0], action = ix[1], target = targetOf(ix[2]);
      if (!target) return;
      var go = function () { runAction(action, target); };
      if (trigger === "click") {
        el.addEventListener("click", function (e) { if (action !== "scroll" || !el.closest("a[href]")) e.preventDefault(); go(); });
        if (!/^(A|BUTTON|SUMMARY)$/.test(el.tagName) && !el.hasAttribute("tabindex")) { el.setAttribute("tabindex", "0"); el.setAttribute("role", el.getAttribute("role") || "button"); }
        el.addEventListener("keydown", function (e) { if ((e.key === "Enter" || e.key === " ") && !/^(A|BUTTON|SUMMARY)$/.test(el.tagName)) { e.preventDefault(); go(); } });
        if (/^(toggle|show|hide)$/.test(action)) el.setAttribute("aria-controls", target.id || (target.id = "kw-ix-" + ix[2]));
      } else if (trigger === "hover") { el.addEventListener("mouseenter", go); el.addEventListener("focusin", go); }
      else if (trigger === "viewport" && "IntersectionObserver" in window) { var ob = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { go(); ob.disconnect(); } }, { threshold: 0.3 }); ob.observe(el); }
      else if (trigger === "load") go();
    });
  });
  // Points d'intérêt d'une image : un bouton ouvre / ferme sa note (clavier compris)
  Array.prototype.forEach.call(document.querySelectorAll(".kw-spot-dot"), function (b) {
    b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; Array.prototype.forEach.call(b.closest(".kw-hotspot").querySelectorAll(".kw-spot-dot"), function (x) { x.setAttribute("aria-expanded", "false"); }); b.setAttribute("aria-expanded", open ? "false" : "true"); });
    b.addEventListener("keydown", function (e) { if (e.key === "Escape") b.setAttribute("aria-expanded", "false"); });
  });
  // Vidéo de fond : arrêtée si la personne a demandé à réduire les animations
  if (reduce) Array.prototype.forEach.call(document.querySelectorAll(".kw-bg-video"), function (v) { v.removeAttribute("autoplay"); try { v.pause(); } catch (e) { /* rien */ } });
  // Texte animé lettre par lettre : décalages posés ici (jamais de style en ligne) ; sans ce script ou sous « réduire les animations », le texte reste entier
  if (!inBuilder && !reduce) Array.prototype.forEach.call(document.querySelectorAll(".kw-splittext"), function (el) {
    var parts = el.querySelectorAll(".kw-st-c"), dur = Number(el.getAttribute("data-kw-dur")) || 600;
    var step = Math.min(Number(el.getAttribute("data-kw-stagger")) || 40, parts.length > 1 ? 2500 / (parts.length - 1) : 40);
    Array.prototype.forEach.call(parts, function (c, i) { c.style.transitionDuration = dur + "ms"; c.style.transitionDelay = Math.round(i * step) + "ms"; });
    el.classList.add("kw-st-ready");
    var go = function () { requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add("is-in"); }); }); };
    if (el.getAttribute("data-kw-trigger") === "load" || !("IntersectionObserver" in window)) { go(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); go(); } }); }, { threshold: 0.2 });
    io.observe(el);
  });
  // Titre animé : les mots se succèdent (jamais dans l'éditeur, jamais si la personne réduit les animations)
  if (!inBuilder && !reduce) Array.prototype.forEach.call(document.querySelectorAll(".kw-rotate[data-kw-words]"), function (el) {
    var words; try { words = JSON.parse(el.getAttribute("data-kw-words")); } catch (e) { return; }
    if (!words || words.length < 2) return;
    var i = 0, every = Number(el.getAttribute("data-kw-interval")) || 2500, typing = el.classList.contains("is-type");
    setInterval(function () {
      i = (i + 1) % words.length;
      if (!typing) { el.classList.add("is-out"); setTimeout(function () { el.textContent = words[i]; el.classList.remove("is-out"); }, 350); return; }
      var w = words[i], k = 0; el.textContent = "";
      var t = setInterval(function () { k += 1; el.textContent = w.slice(0, k); if (k >= w.length) clearInterval(t); }, Math.max(30, Math.min(90, (every * 0.4) / w.length)));
    }, every);
  });
  // Boîte retournable : un toucher (ou Entrée / Espace) la retourne ; un lien du verso reste un lien
  Array.prototype.forEach.call(document.querySelectorAll(".kw-flipbox"), function (box) {
    box.addEventListener("click", function (e) { if (e.target.closest("a")) return; box.classList.toggle("is-flipped"); });
    box.addEventListener("keydown", function (e) { if (e.target === box && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); box.classList.toggle("is-flipped"); } });
  });
  // Code : bouton « Copier » (presse-papiers ; sans autorisation, le texte est sélectionné)
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-copy]"), function (b) {
    b.addEventListener("click", function () {
      var code = b.parentNode.querySelector("pre code"); if (!code) return;
      var done = function (ok) { var t = b.textContent; b.textContent = ok ? "Copié" : "Sélectionné"; setTimeout(function () { b.textContent = t; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code.textContent).then(function () { done(true); }, function () { var r = document.createRange(); r.selectNodeContents(code); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done(false); });
      else { var r = document.createRange(); r.selectNodeContents(code); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); done(false); }
    });
  });
  // Barre de lecture : part de la page déjà défilée
  var readbars = document.querySelectorAll(".kw-readbar-fill"), readrings = document.querySelectorAll(".kw-readring");
  if ((readbars.length || readrings.length) && !inBuilder) {
    var readTick = false;
    var readUpdate = function () { readTick = false; var d = document.documentElement, max = d.scrollHeight - d.clientHeight; var r = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0; Array.prototype.forEach.call(readrings, function (g) { g.style.setProperty("--kw-rp", String(Math.round(r * 100))); var tx = g.querySelector(".kw-readring-pct"); if (tx) tx.textContent = Math.round(r * 100) + "%"; }); Array.prototype.forEach.call(readbars, function (f) { f.style.transform = "scaleX(" + r + ")"; }); };
    window.addEventListener("scroll", function () { if (!readTick) { readTick = true; requestAnimationFrame(readUpdate); } }, { passive: true });
    window.addEventListener("resize", readUpdate);
    readUpdate();
  }
  var LABELS = [["jours", 86400], ["heures", 3600], ["minutes", 60], ["secondes", 1]];
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-countdown]"), function (box) {
    var end = Date.parse(box.getAttribute("data-kw-countdown"));
    // Minuteur par visiteur : la fin est fixée à la première visite (mémorisée dans ce navigateur), puis conservée
    var ever = Number(box.getAttribute("data-kw-cd-evergreen"));
    if (ever > 0) {
      var key = "kw-cd-" + (box.getAttribute("data-kw-cd-key") || "x") + "-" + ever, saved = NaN;
      try { saved = Number(window.localStorage.getItem(key)); } catch (e) { saved = NaN; }
      if (!isFinite(saved) || saved <= 0) { saved = Date.now() + ever * 60000; try { window.localStorage.setItem(key, String(saved)); } catch (e) { /* stockage refusé : le minuteur repart à chaque visite */ } }
      end = saved;
    }
    if (!isFinite(end)) return;
    var hidden = (box.getAttribute("data-kw-hide-units") || "").split(" "), HIDE = { jours: "days", heures: "hours", minutes: "minutes", secondes: "seconds" };
    var expire = box.getAttribute("data-kw-expire"), redirect = box.getAttribute("data-kw-redirect");
    var render = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      box.textContent = "";
      if (!left) {
        if (expire === "hide") { box.hidden = true; return false; }
        if (expire === "redirect" && redirect) { window.location.assign(redirect); return false; }
        var p = document.createElement("p"); p.textContent = box.getAttribute("data-kw-end-text") || ""; box.appendChild(p); return false;
      }
      LABELS.forEach(function (l) {
        if (hidden.indexOf(HIDE[l[0]]) >= 0) return; // unité masquée : son temps s'ajoute à l'unité plus petite
        var v = Math.floor(left / l[1]); left -= v * l[1];
        var u = document.createElement("span"); u.className = "kw-countdown-unit";
        var n = document.createElement("strong"); n.textContent = String(v);
        u.appendChild(n); u.appendChild(document.createTextNode(l[0])); box.appendChild(u);
      });
      return true;
    };
    box.setAttribute("role", "timer");
    if (render()) { var t = setInterval(function () { if (!render()) clearInterval(t); }, 1000); }
  });
})();

// Boucles : « Voir plus » et défilement infini. Sans JavaScript, le lien reste une vraie page suivante.
(function () {
  function bind(nav) {
    var link = nav.querySelector("a.kw-loop-more");
    if (!link || nav.getAttribute("data-bound")) return;
    nav.setAttribute("data-bound", "1");
    var busy = false;
    function load() {
      if (busy) return; busy = true;
      var href = link.getAttribute("href");
      link.setAttribute("aria-busy", "true");
      fetch(href, { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error(); return r.text(); }).then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        var id = nav.getAttribute("data-loop");
        var grid = nav.parentElement;
        var from = doc.querySelector(".kw-n-" + id);
        var next = from ? from.querySelector('nav.kw-loop-pages[data-loop="' + id + '"]') : null;
        if (from) from.querySelectorAll(":scope > .kw-loop-item").forEach(function (it) { grid.insertBefore(document.importNode(it, true), nav); });
        var more = next && next.querySelector("a.kw-loop-more");
        if (more) { link.setAttribute("href", more.getAttribute("href")); link.removeAttribute("aria-busy"); busy = false; if (nav.getAttribute("data-mode") === "infinite") watch(); }
        else nav.remove();
      }).catch(function () { window.location.href = href; });
    }
    function watch() {
      if (!("IntersectionObserver" in window)) return;
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: "200px" });
      io.observe(nav);
    }
    link.addEventListener("click", function (e) { e.preventDefault(); load(); });
    if (nav.getAttribute("data-mode") === "infinite") watch();
  }
  document.querySelectorAll("nav.kw-loop-pages[data-mode]").forEach(bind);
})();

// Animations Lottie : la bibliothèque (public/js/vendor/lottie_light.min.js, SVG, sans expressions) n'est chargée que lorsqu'une animation approche de l'écran.
(function () {
  var stages = document.querySelectorAll("[data-kw-lottie]");
  if (!stages.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var loading = null;
  function lib() {
    if (window.lottie) return Promise.resolve(window.lottie);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = document.createElement("script"); s.src = "/js/vendor/lottie_light.min.js"; s.async = true;
      s.onload = function () { resolve(window.lottie); }; s.onerror = function () { reject(new Error("lottie")); }; document.head.appendChild(s);
    });
    return loading;
  }
  function start(box) {
    if (box.getAttribute("data-kw-ready")) return;
    box.setAttribute("data-kw-ready", "1");
    lib().then(function (lottie) {
      var anim = lottie.loadAnimation({ container: box, renderer: "svg", loop: box.hasAttribute("data-kw-loop"), autoplay: false, path: box.getAttribute("data-kw-lottie"), rendererSettings: { preserveAspectRatio: "xMidYMid meet" } });
      anim.setSpeed(parseFloat(box.getAttribute("data-kw-speed")) || 1);
      var trigger = box.getAttribute("data-kw-trigger");
      box._kwAnim = anim;
      anim.addEventListener("DOMLoaded", function () {
        box.setAttribute("data-kw-state", "loaded");
        if (reduce || box.hasAttribute("data-kw-still")) { anim.goToAndStop(0, true); return; }
        if (trigger === "hover") { box.addEventListener("mouseenter", function () { anim.play(); box.setAttribute("data-kw-state", "playing"); }); box.addEventListener("mouseleave", function () { anim.pause(); box.setAttribute("data-kw-state", "paused"); }); anim.goToAndStop(0, true); }
        else if (trigger === "click") { anim.goToAndStop(0, true); box.style.cursor = "pointer"; box.addEventListener("click", function () { if (anim.isPaused) { anim.play(); box.setAttribute("data-kw-state", "playing"); } else { anim.pause(); box.setAttribute("data-kw-state", "paused"); } }); }
        else { anim.play(); box.setAttribute("data-kw-state", "playing"); }
      });
      anim.addEventListener("data_failed", function () { box.setAttribute("data-kw-state", "error"); });
    }).catch(function () { box.setAttribute("data-kw-state", "error"); });
  }
  Array.prototype.forEach.call(stages, function (box) {
    var trigger = box.getAttribute("data-kw-trigger");
    if (trigger === "load" || !("IntersectionObserver" in window)) { start(box); return; }
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); start(box); } }); }, { rootMargin: "200px" });
    io.observe(box);
  });
})();

// Onglets imbriqués (conteneur en mode « onglets ») : un enfant = un onglet, titre = nom de l'enfant. Sans script, toutes les sections restent visibles
// avec leur titre (voir .kw-ntabs:not(.is-enhanced) dans landing.css). Clavier : flèches, Début, Fin.
(function () {
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-ntabs]"), function (box, k) {
    var panels = Array.prototype.filter.call(box.children, function (c) { return c.classList.contains("kw-ntab-panel"); });
    if (!panels.length || box.classList.contains("is-enhanced")) return;
    var list = document.createElement("div"); list.className = "kw-ntab-list"; list.setAttribute("role", "tablist");
    var tabs = panels.map(function (panel, i) {
      var id = "kw-ntabs-" + k + "-" + i;
      var b = document.createElement("button"); b.type = "button"; b.className = "kw-ntab"; b.id = id + "-tab"; b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", id + "-panel"); b.textContent = panel.getAttribute("data-kw-title") || "Onglet " + (i + 1);
      panel.id = id + "-panel"; panel.setAttribute("role", "tabpanel"); panel.setAttribute("aria-labelledby", b.id);
      list.appendChild(b); return b;
    });
    function show(i, focus) {
      tabs.forEach(function (t, j) { var on = i === j; t.setAttribute("aria-selected", on ? "true" : "false"); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) {
        var to = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % tabs.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (to >= 0) { e.preventDefault(); show(to, true); }
      });
    });
    box.insertBefore(list, box.firstChild);
    box.classList.add("is-enhanced");
    var start = parseInt(box.getAttribute("data-kw-tabs-start"), 10) || 1;
    show(Math.min(Math.max(start, 1), tabs.length) - 1);
  });
})();

// Accordéon à volets libres (conteneur en mode « accordéon ») : chaque volet = un conteneur enfant ; bouton-titre, aria-expanded, clavier (Entrée / Espace natifs, Début / Fin / flèches)
(function () {
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-nacc]"), function (box, k) {
    var panels = Array.prototype.filter.call(box.children, function (c) { return c.classList.contains("kw-nacc-panel"); });
    if (!panels.length || box.classList.contains("is-enhanced")) return;
    var single = box.hasAttribute("data-kw-acc-single"), start = box.getAttribute("data-kw-acc-start") || "first", heads = [];
    panels.forEach(function (panel, i) {
      var id = "kw-nacc-" + k + "-" + i, b = document.createElement("button");
      b.type = "button"; b.className = "kw-nacc-head"; b.id = id + "-head"; b.setAttribute("aria-controls", id + "-body"); b.textContent = panel.getAttribute("data-kw-title") || "Volet " + (i + 1);
      panel.id = id + "-body"; panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", b.id);
      panel.parentNode.insertBefore(b, panel); heads.push(b);
    });
    var set = function (i, on) { heads[i].setAttribute("aria-expanded", on ? "true" : "false"); panels[i].hidden = !on; };
    heads.forEach(function (b, i) {
      set(i, start === "all" || (start === "first" && i === 0));
      b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") !== "true"; if (open && single) heads.forEach(function (_, j) { set(j, false); }); set(i, open); });
      b.addEventListener("keydown", function (e) {
        var to = e.key === "ArrowDown" ? (i + 1) % heads.length : e.key === "ArrowUp" ? (i - 1 + heads.length) % heads.length : e.key === "Home" ? 0 : e.key === "End" ? heads.length - 1 : -1;
        if (to >= 0) { e.preventDefault(); heads[to].focus(); }
      });
    });
    if (single && start === "all") heads.forEach(function (_, j) { set(j, j === 0); });
    box.classList.add("is-enhanced");
  });
})();

// Carrousels de résultats : flèches Précédent / Suivant (le glissement et le clavier fonctionnent déjà sans elles)
(function () {
  document.querySelectorAll("[data-kw-slider]").forEach(function (box) {
    if (box.getAttribute("data-bound")) return;
    var track = box.classList.contains("kw-loop-slider") ? box : box.querySelector(".kw-ql-items");
    if (!track || !track.parentNode) return;
    box.setAttribute("data-bound", "1");
    var wrap = document.createElement("div"); wrap.className = "kw-slider-wrap";
    track.parentNode.insertBefore(wrap, track); wrap.appendChild(track);
    track.setAttribute("tabindex", "0"); track.setAttribute("role", "region");
    if (!track.getAttribute("aria-label")) track.setAttribute("aria-label", "Résultats défilants");
    function btn(cls, label, dir) {
      var b = document.createElement("button"); b.type = "button"; b.className = "kw-slider-btn " + cls; b.setAttribute("aria-label", label); b.textContent = dir < 0 ? "‹" : "›";
      b.addEventListener("click", function () { track.scrollBy({ left: dir * Math.max(track.clientWidth * 0.8, 200), behavior: "smooth" }); });
      wrap.appendChild(b); return b;
    }
    var prev = btn("kw-slider-prev", "Précédent", -1), next = btn("kw-slider-next", "Suivant", 1);
    function sync() { prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; }
    track.addEventListener("scroll", sync, { passive: true }); window.addEventListener("resize", sync); sync();
  });
})();

// Avant / Après : le champ « range » natif (clavier, souris, doigt) déplace la ligne de séparation
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-compare]"), function (box) {
    var range = box.querySelector(".kw-compare-range");
    if (!range) return;
    var apply = function () { box.style.setProperty("--kw-cmp-pos", range.value + "%"); };
    range.addEventListener("input", apply);
    apply();
  });
})();

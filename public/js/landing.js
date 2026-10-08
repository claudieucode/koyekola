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
    if (loop) {
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
        var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
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
    pv.addEventListener("click", function () { show(at - 1); }); nx.addEventListener("click", function () { show(at + 1); });
    dlg.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft") show(at - 1); if (e.key === "ArrowRight") show(at + 1); });
    dlg.addEventListener("click", function (e) { if (lbOverlayClose && e.target === dlg) dlg.close(); });
    pv.hidden = nx.hidden = links.length < 2 || !lbArrows;
  });
  // Menus : sous-menus (bouton, clavier), et menu mobile replié derrière un bouton
  Array.prototype.forEach.call(document.querySelectorAll(".kw-sub-toggle"), function (b) {
    b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", open ? "false" : "true"); });
    b.parentNode.addEventListener("keydown", function (e) { if (e.key === "Escape") { b.setAttribute("aria-expanded", "false"); b.focus(); } });
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-menu-toggle]"), function (nav) {
    var list = nav.querySelector(".kw-menu-list");
    var b = document.createElement("button"); b.type = "button"; b.className = "kw-menu-burger"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", list.id);
    b.innerHTML = '<span aria-hidden="true"></span><span class="kw-menu-burger-label">Menu</span>';
    b.addEventListener("click", function () { var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", open ? "false" : "true"); nav.classList.toggle("is-open", !open); });
    nav.insertBefore(b, list);
    nav.classList.add("is-enhanced");
  });
  // Fenêtres (modales) de la page
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-modal-open]"), function (b) {
    var dlg = document.getElementById(b.getAttribute("data-kw-modal-open"));
    if (!dlg || typeof dlg.showModal !== "function" || document.body.hasAttribute("data-kw-builder")) return;
    b.addEventListener("click", function () { dlg.showModal(); });
    dlg.querySelector("[data-kw-modal-close]").addEventListener("click", function () { dlg.close(); b.focus(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
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
      var target = Number(el.getAttribute("data-kw-count")), dec = Number(el.getAttribute("data-kw-decimals")) || 0, dur = Number(el.getAttribute("data-kw-duration")) || 1500;
      var out = el.querySelector(".kw-counter-value"), t0 = null;
      var fmt = function (v) { return v.toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
      var step = function (t) { if (t0 === null) t0 = t; var k = Math.min(1, (t - t0) / dur); var e = 1 - Math.pow(1 - k, 3); out.textContent = fmt(target * e); if (k < 1) requestAnimationFrame(step); else out.textContent = fmt(target); };
      requestAnimationFrame(step);
    };
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (!en.isIntersecting) return; obs.unobserve(en.target); if (en.target.hasAttribute("data-kw-count")) run(en.target); else en.target.classList.add("is-in"); });
    }, { threshold: 0.3 });
    Array.prototype.forEach.call(counters, function (el) { el.querySelector(".kw-counter-value").textContent = (0).toLocaleString("fr-FR"); obs.observe(el); });
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
  // Barre de lecture : part de la page déjà défilée
  var readbars = document.querySelectorAll(".kw-readbar-fill");
  if (readbars.length && !inBuilder) {
    var readTick = false;
    var readUpdate = function () { readTick = false; var d = document.documentElement, max = d.scrollHeight - d.clientHeight; var r = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0; Array.prototype.forEach.call(readbars, function (f) { f.style.transform = "scaleX(" + r + ")"; }); };
    window.addEventListener("scroll", function () { if (!readTick) { readTick = true; requestAnimationFrame(readUpdate); } }, { passive: true });
    window.addEventListener("resize", readUpdate);
    readUpdate();
  }
  var LABELS = [["jours", 86400], ["heures", 3600], ["minutes", 60], ["secondes", 1]];
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-countdown]"), function (box) {
    var end = Date.parse(box.getAttribute("data-kw-countdown"));
    if (!isFinite(end)) return;
    var render = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      box.textContent = "";
      if (!left) { var p = document.createElement("p"); p.textContent = box.getAttribute("data-kw-end-text") || ""; box.appendChild(p); return false; }
      LABELS.forEach(function (l) {
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

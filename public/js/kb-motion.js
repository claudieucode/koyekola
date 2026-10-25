// KOLAKISA — niveau de mouvement adaptatif : html[data-kb-motion="full" | "lite" | "off"].
//   off   mouvement réduit demandé par le système : plus aucune animation ni transition (les changements d'état restent immédiats) ;
//   lite  appareil modeste, économie de données, ou fluidité mesurée insuffisante : transitions raccourcies, aucun effet décoratif ;
//   full  vocabulaire normal (120 / 180 ms, ouverture des fenêtres animée).
// Signaux utilisés, dans cet ordre, sans test de puissance ni donnée envoyée : préférence « mouvement réduit », économie de données,
// mémoire / cœurs annoncés par le navigateur, choix explicite (localStorage.kbMotion), puis MESURE : après un clic ou une touche, la durée
// des images affichées est échantillonnée pendant 1,5 s (au plus une fois toutes les 10 s). Deux fenêtres consécutives dont 25 % des images
// dépassent 50 ms font passer en « lite » ; le retour en « full » exige trois fenêtres fluides de suite. Le niveau mesuré ne vaut que pour la
// session (sessionStorage) : jamais de changement incessant, jamais de donnée conservée au-delà.
// API : window.KolaMotion.level() / .set("full" | "lite" | "off" | "auto") ; événement « kb-motion » sur document.
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "kbMotion";
  var store = {
    get: function (s, k) { try { return window[s].getItem(k); } catch (e) { return null; } },
    set: function (s, k, v) { try { if (v === null) window[s].removeItem(k); else window[s].setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  };
  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false, addEventListener: function () {} };
  var valid = function (v) { return v === "full" || v === "lite" || v === "off"; };

  function declared() {
    if (reduce.matches) return "off";
    var forced = store.get("localStorage", KEY);
    if (valid(forced)) return forced;
    var c = navigator.connection || {};
    if (c.saveData) return "lite";
    if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) return "lite";
    return "full";
  }
  var level = declared();
  var measured = store.get("sessionStorage", KEY) === "lite" ? "lite" : null;
  function effective() { var d = declared(); return d === "off" ? "off" : (d === "lite" || measured === "lite") ? "lite" : "full"; }
  function apply(reason) {
    var next = effective();
    if (next === level && root.getAttribute("data-kb-motion") === next) return;
    level = next; root.setAttribute("data-kb-motion", next);
    try { document.dispatchEvent(new CustomEvent("kb-motion", { detail: { level: next, reason: reason || "" } })); } catch (e) { /* IE absent */ }
  }
  root.setAttribute("data-kb-motion", level);
  if (reduce.addEventListener) reduce.addEventListener("change", function () { apply("système"); });

  // --- mesure de fluidité : courte, déclenchée par l'utilisateur, jamais en continu ---
  var sampling = false, lastRun = -Infinity, slowWindows = 0, goodWindows = 0;
  function sample() {
    if (sampling || effective() === "off") return;
    var now = performance.now(); if (now - lastRun < 10000) return;
    sampling = true; lastRun = now;
    var frames = 0, slow = 0, prev = 0, start = 0;
    function tick(t) {
      if (!prev) { prev = t; start = t; window.requestAnimationFrame(tick); return; }
      var d = t - prev; prev = t; frames += 1; if (d > 50) slow += 1;
      if (t - start < 1500) { window.requestAnimationFrame(tick); return; }
      sampling = false;
      if (document.hidden || frames < 8) return;          // onglet masqué ou presque aucune image : mesure inexploitable
      var ratio = slow / frames;
      if (ratio >= 0.25) { slowWindows += 1; goodWindows = 0; } else { goodWindows += 1; slowWindows = 0; }
      if (slowWindows >= 2 && measured !== "lite") { measured = "lite"; store.set("sessionStorage", KEY, "lite"); apply("fluidité mesurée"); }
      else if (goodWindows >= 3 && measured === "lite" && declared() === "full") { measured = null; store.set("sessionStorage", KEY, null); apply("fluidité retrouvée"); }
    }
    window.requestAnimationFrame(tick);
  }
  ["pointerdown", "keydown"].forEach(function (ev) { window.addEventListener(ev, sample, { passive: true, capture: true }); });

  window.KolaMotion = {
    level: function () { return level; },
    set: function (v) { if (valid(v)) store.set("localStorage", KEY, v); else store.set("localStorage", KEY, null); measured = null; store.set("sessionStorage", KEY, null); slowWindows = goodWindows = 0; apply("choix"); return level; },
  };
})();

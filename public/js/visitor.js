// Bandeau de consentement et suivi des visiteurs (Site Web, phase 6). Sans dépendance.
// - Tant que la personne n'a pas choisi, RIEN n'est suivi ; « Accepter » et « Refuser » sont proposés à égalité.
// - Choix gardé 6 mois (cookie kw_consent) ; modifiable à tout moment (lien « Cookies » en bas de page).
// - Accord : identifiant de visiteur aléatoire (cookie kw_vid, 13 mois) ; événements envoyés à /w/e : pages vues,
//   clics sur les boutons, sections atteintes, formulaires affichés, pop-ups, vidéos, téléchargements. Jamais de texte
//   saisi, jamais l'adresse complète (chemin + paramètres utm seulement).
// - Refus : rien n'est envoyé, l'identifiant éventuel est effacé.
(function () {
  "use strict";
  var CHOICE_DAYS = 182, VID_DAYS = 395, SESSION_MS = 30 * 60 * 1000;
  function getCookie(name) {
    var m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value, days) {
    document.cookie = name + "=" + encodeURIComponent(value) + "; Max-Age=" + Math.round(days * 86400) + "; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "");
  }
  function random() {
    var a = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  var consented = function () { return getCookie("kw_consent") === "1"; };
  var visitorId = function () { var v = getCookie("kw_vid"); return v && /^[A-Za-z0-9_-]{16,40}\.\d{13}$/.test(v) ? v : null; };

  // ---------- Visite (onglet) ----------
  var session = null;
  function currentSession() {
    if (session) return session;
    var now = Date.now(), s = null;
    try { s = JSON.parse(sessionStorage.getItem("kw_sess") || "null"); } catch (e) { s = null; }
    var isNew = !s || now - s.last > SESSION_MS;
    if (isNew) s = { id: random().slice(0, 24), start: now, last: now };
    s.last = now;
    try { sessionStorage.setItem("kw_sess", JSON.stringify(s)); } catch (e) { /* onglet sans stockage : une visite par page */ }
    session = { id: s.id, start: s.start, isNew: isNew };
    return session;
  }
  var firstSeen = function () { var v = visitorId(); return v ? Number(v.split(".")[1]) : null; };
  // Visiteur déjà venu lors d'une visite précédente (seulement si le suivi est accepté ; sinon inconnu = null)
  function isReturning() {
    if (!consented() || !visitorId()) return null;
    return firstSeen() < currentSession().start - 1000;
  }

  // ---------- Envoi des événements ----------
  var queue = [];
  var device = function () { var w = window.innerWidth || 1024; return w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop"; };
  function track(type, target, extra) {
    if (!consented() || !visitorId()) return;
    var e = { t: type, p: location.pathname, x: target ? String(target).slice(0, 120) : "", d: device(), at: Date.now() };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) e[k] = extra[k];
    queue.push(e);
    if (queue.length >= 20) flush();
  }
  function flush() {
    if (!queue.length || !consented()) return;
    var body = JSON.stringify({ s: currentSession().id, e: queue.splice(0, 30) });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/w/e", new Blob([body], { type: "application/json" }))) return;
    } catch (e) { /* repli ci-dessous */ }
    try { fetch("/w/e", { method: "POST", body: body, headers: { "Content-Type": "application/json" }, credentials: "same-origin", keepalive: true }); } catch (e) { /* hors ligne : tant pis */ }
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
  window.addEventListener("pagehide", flush);
  setInterval(flush, 10000);

  // ---------- Ce qui est suivi (après accord) ----------
  function referrerHost() {
    try { var h = document.referrer ? new URL(document.referrer).hostname : ""; return h && h !== location.hostname ? h : ""; } catch (e) { return ""; }
  }
  function startTracking() {
    if (startTracking.done || !consented()) return;
    startTracking.done = true;
    if (!visitorId()) setCookie("kw_vid", random() + "." + Date.now(), VID_DAYS);
    var s = currentSession();
    if (s.isNew) {
      var q = new URLSearchParams(location.search);
      track("session_start", "", { r: referrerHost(), us: q.get("utm_source") || "", um: q.get("utm_medium") || "", uc: q.get("utm_campaign") || "" });
    }
    track("page_view", document.title || "");
    // Clics sur les boutons et liens d'action ; téléchargements
    document.addEventListener("click", function (ev) {
      var el = ev.target.closest && ev.target.closest("a, button");
      if (!el || el.closest("#kw-consent")) return;
      var href = el.getAttribute("href") || "";
      var label = (el.textContent || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 80);
      // Action repérée par la page elle-même (ex. ajout au panier : « add_to_cart:12 »)
      var named = el.getAttribute("data-kw-event");
      if (named && /^[a-z_]{3,30}:\d{1,9}$/.test(named)) { track("button_click", named); flush(); return; }
      if (el.hasAttribute("download") || /\.(pdf|zip|docx?|xlsx?|pptx?)(\?|$)/i.test(href)) track("download", href.split("?")[0] || label);
      else if (el.matches(".btn, .lp-btn, button[type=submit]")) track("button_click", label + (href && href.charAt(0) === "/" ? " → " + href.split("?")[0] : ""));
    }, true);
    // Sections atteintes (pages du site) et formulaires affichés
    if ("IntersectionObserver" in window) {
      var seen = new Set();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target, key = el.getAttribute("data-sid") || el.getAttribute("action") || "";
          if (seen.has(key)) return;
          seen.add(key);
          io.unobserve(el);
          if (el.tagName === "FORM") track("form_view", el.getAttribute("action"));
          else track("section_view", el.getAttribute("data-stype") + ":" + key);
        });
      }, { threshold: 0.4 });
      Array.prototype.forEach.call(document.querySelectorAll("[data-sid], form[action^='/f/'], form[action*='/inscription']"), function (el) { io.observe(el); });
    }
    Array.prototype.forEach.call(document.querySelectorAll("video"), function (v) {
      v.addEventListener("play", function onPlay() { v.removeEventListener("play", onPlay); track("video_start", v.getAttribute("title") || v.currentSrc || ""); });
    });
  }
  // Pop-ups (public/js/popup.js) : affichage et fermeture
  document.addEventListener("kw:track", function (ev) { if (ev.detail && ev.detail.type) track(ev.detail.type, ev.detail.target); });

  // ---------- Bandeau ----------
  function banner() { return document.getElementById("kw-consent"); }
  // Affichage du bandeau. Aucun bouton n'est mis en avant (ni focus automatique sur « Accepter ») ; rouvert à la demande,
  // c'est le bandeau entier qui reçoit le focus, pour les personnes au clavier ou au lecteur d'écran
  function showBanner(fromLink) { var b = banner(); if (!b) return; b.hidden = false; if (fromLink) b.focus({ preventScroll: true }); }
  function choose(accept) {
    setCookie("kw_consent", accept ? "1" : "0", CHOICE_DAYS);
    var b = banner();
    if (b) b.hidden = true;
    if (accept) startTracking();
    else {
      queue = [];
      document.cookie = "kw_vid=; Max-Age=0; Path=/; SameSite=Lax";
      try { sessionStorage.removeItem("kw_sess"); } catch (e) { /* rien */ }
    }
  }
  function init() {
    var b = banner();
    if (b) {
      b.querySelector("[data-kw-accept]").addEventListener("click", function () { choose(true); });
      b.querySelector("[data-kw-refuse]").addEventListener("click", function () { choose(false); });
    }
    Array.prototype.forEach.call(document.querySelectorAll("[data-kw-consent-open]"), function (a) { a.addEventListener("click", function (e) { e.preventDefault(); showBanner(true); }); });
    var choice = getCookie("kw_consent");
    if (choice === "1") startTracking();
    else if (choice !== "0") showBanner();
  }
  window.KolakisaVisitor = { consented: consented, isReturning: isReturning, track: track };
  if (document.readyState !== "loading") init(); else document.addEventListener("DOMContentLoaded", init);
})();

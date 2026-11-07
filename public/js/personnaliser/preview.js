/* Personnaliser — aperçu : vrai rendu HTML du site dans un cadre de même origine, chargement, erreur, actualisation, largeur de l'appareil, canal sécurisé panneau ↔ aperçu.
   Canal : K.preview.send(type, données) écrit dans le cadre par postMessage (origine fixée, jamais « * ») ; les messages reçus ne sont acceptés que s'ils viennent de CE cadre,
   de CETTE origine, avec le préfixe « kwpz: ». Le moteur de synchronisation des réglages viendra avec les catégories ; ici seule l'infrastructure existe. */
(function () {
  "use strict";
  var K = window.KWPZ; if (!K) return;
  var stage = document.getElementById("pz-stage");
  var wrap = document.getElementById("pz-frame-wrap");
  var frame = document.getElementById("pz-frame");
  var err = document.getElementById("pz-error");
  var errText = document.getElementById("pz-error-text");
  var origin = window.location.origin;
  var TIMEOUT_MS = 30000;
  var timer = null, current = null, token = 0, keepScroll = null;

  function safeUrl(u) {
    // Même origine uniquement : aucun site externe n'est jamais chargé dans l'aperçu
    try { var x = new URL(u, origin); if (x.origin !== origin) return null; return x.pathname + x.search + x.hash; } catch (e) { return null; }
  }
  function withMarker(path) { // « ?kwpz=1 » : reconnaît un aperçu demandé par Personnaliser (sans effet sur le rendu)
    var x = new URL(path, origin); x.searchParams.set("kwpz", "1"); x.searchParams.set("kwcustom", "1"); return x.pathname + x.search + x.hash;
  }
  function setLoading(on) { stage.classList.toggle("is-loading", on); }
  function showError(message) { clearTimeout(timer); setLoading(false); errText.textContent = message || "Vérifiez votre connexion puis réessayez."; err.hidden = false; }

  function load(url) {
    var path = safeUrl(url);
    if (!path) { showError("Cette adresse ne peut pas être affichée dans l'aperçu."); return; }
    current = path; err.hidden = true; setLoading(true);
    var mine = ++token;
    clearTimeout(timer);
    timer = setTimeout(function () { if (mine === token) showError("Le site met trop de temps à répondre."); }, TIMEOUT_MS);
    frame.src = withMarker(path);
  }

  frame.addEventListener("load", function () {
    clearTimeout(timer);
    // Une page d'erreur ou de connexion renvoyée dans le cadre est détectée sans lire son contenu sensible
    var bad = false;
    try { var d = frame.contentDocument; if (d && d.body && d.body.getAttribute("data-pz-error")) bad = true; } catch (e) { bad = true; }
    if (bad) { showError("Le site n'a pas pu être affiché."); return; }
    setLoading(false); err.hidden = true;
    var d = preview.doc(), w = frame.contentWindow;
    if (keepScroll !== null) { try { w.scrollTo(0, keepScroll); } catch (e) { /* ignoré */ } keepScroll = null; }
    if (d) {
      // La navigation reste dans l'aperçu (les réglages en cours restent appliqués) ; un lien externe s'ouvre à part ; aucun envoi de formulaire
      d.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[href]"); if (!a) return;
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) === "#" || /^(mailto:|tel:)/i.test(href)) return;
        e.preventDefault();
        if (/^javascript:/i.test(href)) return;
        var u; try { u = new URL(a.href, w.location.href); } catch (x) { return; }
        if (u.origin !== origin) { K.toast("Lien externe : il s'ouvre hors de l'aperçu."); window.open(u.href, "_blank", "noopener"); return; }
        load(u.pathname + u.search + u.hash);
      }, true);
      d.addEventListener("submit", function (e) { e.preventDefault(); K.toast("Les formulaires sont désactivés dans l'aperçu."); }, true);
    }
    K.emit("preview:loaded", current);
  });
  frame.addEventListener("error", function () { showError(); });

  // Appareil : largeur réelle du viewport de l'aperçu (le site réagit à ses propres media queries)
  function applyDevice(id) {
    var devices = K.boot.devices || [], d = null;
    for (var i = 0; i < devices.length; i++) if (devices[i].id === id) d = devices[i];
    if (!d) return;
    wrap.style.width = d.width ? d.width + "px" : "100%";
    document.body.setAttribute("data-device", d.id);
  }

  // Canal sécurisé
  var preview = K.preview = {
    reload: function () { if (current) load(current); },
    doc: function () { try { return frame.contentDocument; } catch (e) { return null; } },
    // Recharge la page affichée en gardant la position de défilement (changement de contenu : nom, logos, mise en page…)
    softReload: function () {
      var w = frame.contentWindow, y = 0; try { y = w ? w.scrollY : 0; } catch (e) { y = 0; }
      keepScroll = y; err.hidden = true; setLoading(true);
      try { w.location.reload(); } catch (e) { if (current) load(current); }
    },
    load: load,
    send: function (type, data) { try { frame.contentWindow.postMessage({ kwpz: type, data: data }, origin); } catch (e) { /* cadre pas prêt : ignoré */ } }
  };
  window.addEventListener("message", function (e) {
    if (e.origin !== origin || e.source !== frame.contentWindow) return;
    var m = e.data; if (!m || typeof m !== "object" || typeof m.kwpz !== "string") return;
    K.emit("preview:message", m);
  });

  K.on("change:device", applyDevice);
  document.getElementById("pz-reload").addEventListener("click", preview.reload);
  document.getElementById("pz-retry").addEventListener("click", preview.reload);
  applyDevice(K.state.device);
  load((K.boot.preview && K.boot.preview.url) || "/");
})();

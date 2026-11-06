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
  var timer = null, current = null, token = 0;

  function safeUrl(u) {
    // Même origine uniquement : aucun site externe n'est jamais chargé dans l'aperçu
    try { var x = new URL(u, origin); if (x.origin !== origin) return null; return x.pathname + x.search + x.hash; } catch (e) { return null; }
  }
  function withMarker(path) { // « ?kwpz=1 » : reconnaît un aperçu demandé par Personnaliser (sans effet sur le rendu)
    var x = new URL(path, origin); x.searchParams.set("kwpz", "1"); return x.pathname + x.search + x.hash;
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
    setLoading(false); err.hidden = true; K.emit("preview:loaded", current);
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

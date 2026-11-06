// Motion Studio : module « form-feedback » (retour de formulaire animé). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// MODE DÉMO : construit un mini-formulaire (vrai <input type="email">, étiquette, bouton) qui valide pour de vrai (API de validation du navigateur) et montre l'état erreur
//   (secousse, aria-invalid, message annoncé) ou succès (coche tracée, message annoncé). Il n'envoie RIEN.
// MODE PAGE : s'attache aux formulaires d'inscription de la page (.kw-signup-form) : avant l'envoi, vérifie les champs obligatoires visibles ; s'il en manque, bloque l'envoi,
//   secoue les champs, annonce un résumé (zone role=alert) et place le focus sur le premier. Sinon l'envoi part normalement vers le serveur. Au retour de la page, le message de
//   remerciement (.lp-thanks) reçoit une coche tracée, le message d'erreur du serveur (.lp-error) une secousse. Autres formulaires : non concernés.
// Mouvement réduit : mêmes états et mêmes messages, sans animation. destroy() retire tout ce qui a été ajouté.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("form-feedback", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var NONE = "none";
  var CHECK = '<svg viewBox="0 0 24 24" width="20" height="20" focusable="false"><path class="kw-ms-ff-tick" d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24" width="20" height="20" focusable="false"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  // Images-clés de l'état « erreur » selon l'effet
  function errorFrames(preset) {
    if (preset === "fade") return [{ opacity: 0.3 }, { opacity: 1 }];
    if (preset === "nudge") return [{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(.99)" }, { transform: "scale(1)" }];
    return [{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(7px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(3px)" }, { transform: "translateX(0)" }];
  }
  var cleanLabel = function (t) { return String(t || "").replace(/\s*\*\s*$/, "").replace(/\s+/g, " ").trim(); };
  function init(ctx) {
    var el = ctx.el, doc = ctx.doc, win = ctx.win;
    if (ctx.mode === "editor") return {};
    var mode = el.getAttribute("data-kw-ms-mode"), added = [], undo = [];
    var dur = ctx.cfg.duration, motion = !ctx.reduced && typeof el.animate === "function";
    var ease = win.KWMS && win.KWMS.easingCss ? win.KWMS.easingCss(ctx.cfg.easing) : "ease-out";
    var play = function (target, frames, opt) { if (motion && target) { try { target.animate(frames, opt || { duration: dur, easing: ease }); } catch (e) { /* animation impossible */ } } };
    var tick = function (box) { var path = box.querySelector(".kw-ms-ff-tick"); if (motion && path) { try { path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: Math.max(250, dur), easing: ease, fill: "backwards" }); } catch (e) { /* sans animation */ } } };
    var uid = "kwff" + Math.random().toString(36).slice(2, 7);

    if (mode === "demo") {
      var stat = el.querySelector(".kw-ms-ff-static"); if (!stat) return {};
      stat.hidden = true;
      var form = doc.createElement("form"); form.className = "kw-ms-ff-form"; form.noValidate = true; form.setAttribute("aria-label", el.getAttribute("data-kw-ms-title") || "Formulaire de démonstration");
      var t = el.getAttribute("data-kw-ms-title");
      var h = null; if (t) { h = doc.createElement("p"); h.className = "kw-ms-ff-title"; h.textContent = t; form.appendChild(h); }
      var field = doc.createElement("div"); field.className = "kw-ms-ff-field";
      var lab = doc.createElement("label"); lab.setAttribute("for", uid + "-e"); lab.textContent = el.getAttribute("data-kw-ms-field") || "Votre adresse e-mail";
      var inp = doc.createElement("input"); inp.type = "email"; inp.id = uid + "-e"; inp.name = "email"; inp.required = true; inp.autocomplete = "email"; inp.setAttribute("aria-describedby", uid + "-m"); inp.setAttribute("inputmode", "email");
      var btn = doc.createElement("button"); btn.type = "submit"; btn.className = "kw-button kw-btn-primary kw-ms-ff-btn"; btn.textContent = el.getAttribute("data-kw-ms-button") || "Envoyer";
      var msg = doc.createElement("p"); msg.className = "kw-ms-ff-msg"; msg.id = uid + "-m"; msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite");
      field.appendChild(lab); field.appendChild(inp); form.appendChild(field); form.appendChild(btn); form.appendChild(msg);
      var note = null; if (el.getAttribute("data-kw-ms-note") === "1") { note = doc.createElement("p"); note.className = "kw-ms-ff-note"; note.textContent = "Démonstration : rien n'est envoyé."; }
      el.appendChild(form); if (note) el.appendChild(note);
      var set = function (state, text) {
        el.setAttribute("data-kw-ms-feedback", state || "");
        msg.className = "kw-ms-ff-msg" + (state === "ok" ? " is-ok" : state === "err" ? " is-err" : "");
        msg.setAttribute("role", state === "err" ? "alert" : "status");
        msg.innerHTML = ""; if (!state) return;
        var ic = doc.createElement("span"); ic.className = "kw-ms-ff-ic"; ic.setAttribute("aria-hidden", "true"); ic.innerHTML = state === "ok" ? CHECK : CROSS;
        var tx = doc.createElement("span"); tx.textContent = text; msg.appendChild(ic); msg.appendChild(tx);
        inp.setAttribute("aria-invalid", state === "err" ? "true" : "false");
        if (state === "ok") { tick(msg); play(msg, [{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: NONE }]); }
        else { play(field, errorFrames(ctx.cfg.preset)); }
      };
      var onSubmit = function (e) {
        e.preventDefault();
        if (!inp.validity.valid) { set("err", el.getAttribute("data-kw-ms-err")); inp.focus(); return; }
        set("ok", el.getAttribute("data-kw-ms-ok"));
      };
      var onInput = function () { if (el.getAttribute("data-kw-ms-feedback")) { inp.setAttribute("aria-invalid", "false"); set("", ""); } };
      form.addEventListener("submit", onSubmit); inp.addEventListener("input", onInput);
      return { destroy: function () { form.removeEventListener("submit", onSubmit); inp.removeEventListener("input", onInput); if (form.parentNode) form.parentNode.removeChild(form); if (note && note.parentNode) note.parentNode.removeChild(note); stat.hidden = false; el.removeAttribute("data-kw-ms-feedback"); } };
    }

    // ---- mode page : formulaires d'inscription de la page
    var forms = Array.prototype.slice.call(doc.querySelectorAll(".kw-signup-form"));
    var alertBox = doc.createElement("p"); alertBox.className = "kw-ms-ff-msg is-err"; alertBox.setAttribute("role", "alert"); alertBox.hidden = true; el.appendChild(alertBox);
    var visible = function (c) { return !c.disabled && c.type !== "hidden" && c.getClientRects().length > 0 && !c.closest(".hp-field"); };
    forms.forEach(function (f) {
      var onSubmit = function (e) {
        var bad = Array.prototype.slice.call(f.elements).filter(function (c) { return c.willValidate && visible(c) && !c.validity.valid; });
        if (!bad.length) { f.setAttribute("aria-busy", "true"); alertBox.hidden = true; return; }
        e.preventDefault();
        var names = [];
        bad.forEach(function (c) {
          c.setAttribute("aria-invalid", "true");
          var box = c.closest(".field-group, .checkbox-row") || c.parentNode; box.classList.add("kw-ms-ff-bad"); play(box, errorFrames(ctx.cfg.preset));
          var l = c.id ? f.querySelector('label[for="' + c.id + '"]') : null; if (!l) { var fs = c.closest("fieldset"); l = fs ? fs.querySelector("legend") : null; }
          var n = cleanLabel(l ? l.textContent : c.name); if (n && names.indexOf(n) < 0) names.push(n);
        });
        alertBox.textContent = (el.getAttribute("data-kw-ms-summary") || "Merci de corriger les champs suivants") + " : " + names.join(", ") + ".";
        alertBox.hidden = false; play(alertBox, [{ opacity: 0, transform: "translateY(-6px)" }, { opacity: 1, transform: NONE }]);
        bad[0].focus();
      };
      var onInput = function (e) {
        var c = e.target; if (!c || !c.getAttribute || c.getAttribute("aria-invalid") !== "true") return;
        if (c.validity.valid) { c.setAttribute("aria-invalid", "false"); var box = c.closest(".field-group, .checkbox-row") || c.parentNode; box.classList.remove("kw-ms-ff-bad"); }
      };
      f.addEventListener("submit", onSubmit); f.addEventListener("input", onInput); f.addEventListener("change", onInput);
      undo.push(function () { f.removeEventListener("submit", onSubmit); f.removeEventListener("input", onInput); f.removeEventListener("change", onInput); f.removeAttribute("aria-busy"); });
    });
    // Retour du serveur : remerciement ou erreur déjà dans la page
    Array.prototype.slice.call(doc.querySelectorAll(".kw-signup .lp-thanks")).forEach(function (m) {
      var ic = doc.createElement("span"); ic.className = "kw-ms-ff-ic"; ic.setAttribute("aria-hidden", "true"); ic.innerHTML = CHECK; m.insertBefore(ic, m.firstChild); added.push(ic);
      tick(m); play(m, [{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: NONE }]);
    });
    Array.prototype.slice.call(doc.querySelectorAll(".kw-signup .lp-error")).forEach(function (m) { play(m, errorFrames(ctx.cfg.preset)); });
    return {
      destroy: function () { undo.forEach(function (u) { u(); }); added.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); }); if (alertBox.parentNode) alertBox.parentNode.removeChild(alertBox); },
    };
  }
  return { errorFrames: errorFrames, cleanLabel: cleanLabel, init: init };
});

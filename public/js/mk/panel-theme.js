/* Apparence des PANNEAUX de l'éditeur d'e-mails (rail, panneau gauche, panneau droit) : Clair (d'origine), Sombre, Bleu Kolakisa, Personnalisé.
   Seuls ces trois panneaux sont touchés : ni le canevas (l'e-mail), ni le contenu, ni les e-mails envoyés. Les couleurs viennent du générateur
   de palette KWTheme (page-builder-theme.js) qui garantit les contrastes (texte ≥ 7:1, texte secondaire ≥ 5,5:1, accent ≥ 3:1, texte sur accent
   blanc ou presque noir selon le meilleur contraste) : une couleur choisie reste reconnaissable, jamais au prix de la lisibilité.
   Le choix est un réglage d'interface mémorisé dans ce navigateur (localStorage), jamais enregistré dans le message. */
(function () {
  "use strict";
  var STORE = "mk:panel-theme";
  var SKINS = [["light", "Clair"], ["dark", "Sombre"], ["blue", "Bleu Kolakisa"], ["custom", "Personnalisé"]];
  var DEFAULT_CUSTOM = { panel: "#1f2937", accent: "#3b82f6", text: "" };
  var K = window.KWTheme;
  if (!K) return;
  var state = (function () { try { var v = JSON.parse(localStorage.getItem(STORE)); if (v && SKINS.some(function (s) { return s[0] === v.skin; })) return { skin: v.skin, custom: Object.assign({}, DEFAULT_CUSTOM, v.custom || {}) }; } catch (e) { /* ignoré */ } return { skin: "light", custom: Object.assign({}, DEFAULT_CUSTOM) }; })();
  function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ } }

  function paletteFor(skin, custom) {
    if (skin === "dark") return K.derive({ accent: "#3b8fd1", panel: "#181b20", bg: "#0f1114" });
    if (skin === "blue") return K.derive({ accent: "#38a3e0", panel: "#0a2438", bg: "#071c2c", top: "#0b2a40" });
    if (skin === "custom") return K.derive({ accent: custom.accent, panel: custom.panel, text: custom.text || undefined });
    return null;
  }
  // Jeton de l'éditeur de pages → jeton de l'espace marketing
  var MAP = { "--mk-surface": "--editor-panel", "--mk-bg": "--editor-bg", "--mk-text": "--editor-text", "--mk-text-soft": "--editor-text-secondary", "--muted": "--editor-muted",
    "--mk-border": "--editor-border", "--mk-border-strong": "--editor-border-strong", "--mk-hover": "--editor-hover", "--mk-selected": "--editor-active", "--surface-alt": "--editor-panel-secondary",
    "--accent": "--editor-accent", "--accent-dark": "--editor-accent-text", "--accent-light": "--editor-active", "--danger": "--editor-danger", "--danger-light": "--editor-danger-bg",
    "--success": "--editor-success", "--primary": "--editor-text", "--primary-dark": "--editor-text", "--text": "--editor-text", "--border": "--editor-border", "--card": "--editor-card", "--mk-focus": "--editor-focus", "--mk-on-accent": "--editor-on-accent", "--mk-card": "--editor-card" };
  var panels = function () { return [].slice.call(document.querySelectorAll(".mk-b-rail, .mk-b-side, .mk-b-props")); };

  function apply() {
    var pal = paletteFor(state.skin, state.custom), dark = pal && pal.scheme === "dark";
    panels().forEach(function (p) {
      Object.keys(MAP).forEach(function (k) { p.style.removeProperty(k); });
      p.style.removeProperty("color-scheme"); p.style.removeProperty("--mk-warn-bg"); p.style.removeProperty("--warning-bg"); p.style.removeProperty("--warning-text");
      if (!pal) { p.removeAttribute("data-mk-themed"); return; }
      Object.keys(MAP).forEach(function (k) { p.style.setProperty(k, pal.tokens[MAP[k]]); });
      p.style.setProperty("color-scheme", pal.scheme);
      if (dark) { p.style.setProperty("--warning-bg", "#3a2f10"); p.style.setProperty("--warning-text", "#f5d98a"); }
      p.setAttribute("data-mk-themed", pal.scheme);
    });
    document.dispatchEvent(new CustomEvent("mk:panel-theme", { detail: { skin: state.skin, scheme: pal ? pal.scheme : "light" } }));
  }
  function setSkin(skin) { state.skin = skin; save(); apply(); render(); }
  function setCustom(patch) { Object.assign(state.custom, patch); state.skin = "custom"; save(); apply(); render(true); }
  function reset() { state = { skin: "light", custom: Object.assign({}, DEFAULT_CUSTOM) }; save(); apply(); render(); }

  // ---------- Fenêtre de choix ----------
  var btn = null, pop = null;
  function el(tag, cls, attrs, text) { var n = document.createElement(tag); if (cls) n.className = cls; Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); if (text !== undefined) n.textContent = text; return n; }
  var ICON = "<svg viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.4-.7-.4-1.1 0-.9.8-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.7 17 3 12 3z'/><circle cx='7.5' cy='11' r='1'/><circle cx='10' cy='7' r='1'/><circle cx='14.5' cy='7' r='1'/></svg>";
  function swatch(skin) {
    var pal = paletteFor(skin, state.custom), t = pal ? pal.tokens : { "--editor-panel": "#ffffff", "--editor-text": "#0b2a40", "--editor-accent": "#0277b6", "--editor-border": "#e1e8ee" };
    var s = el("span", "mk-pt-swatch", { "aria-hidden": "true" });
    s.style.background = t["--editor-panel"]; s.style.borderColor = t["--editor-border"];
    var a = el("span", "mk-pt-dot"); a.style.background = t["--editor-accent"]; var b = el("span", "mk-pt-line"); b.style.background = t["--editor-text"];
    s.appendChild(a); s.appendChild(b); return s;
  }
  function field(label, key, value) {
    var wrap = el("label", "mk-pt-field"); wrap.appendChild(el("span", "mk-pt-flabel", null, label));
    var row = el("span", "mk-pt-frow"); var inp = el("input", "mk-pt-color", { type: "color", "aria-label": label }); inp.value = value || "#000000";
    inp.addEventListener("input", function () { var p = {}; p[key] = inp.value; setCustom(p); });
    row.appendChild(inp);
    if (key === "text") { var auto = el("button", "mk-pt-auto", { type: "button", "aria-pressed": String(!state.custom.text) }, "Auto"); auto.addEventListener("click", function () { setCustom({ text: "" }); }); row.appendChild(auto); }
    wrap.appendChild(row); return wrap;
  }
  function render(keepFocus) {
    if (!pop || pop.hidden) return;
    var focusId = keepFocus && document.activeElement && pop.contains(document.activeElement) ? document.activeElement.getAttribute("aria-label") : null;
    pop.textContent = "";
    pop.appendChild(el("p", "mk-pt-title", null, "Apparence des panneaux"));
    var group = el("div", "mk-pt-skins", { role: "radiogroup", "aria-label": "Apparence des panneaux" });
    SKINS.forEach(function (s) {
      var on = state.skin === s[0];
      var b = el("button", "mk-pt-skin" + (on ? " is-on" : ""), { type: "button", role: "radio", "aria-checked": String(on), tabindex: on ? "0" : "-1" });
      b.appendChild(swatch(s[0])); b.appendChild(el("span", "mk-pt-name", null, s[1]));
      b.addEventListener("click", function () { setSkin(s[0]); });
      b.addEventListener("keydown", function (e) { var i = SKINS.findIndex(function (x) { return x[0] === state.skin; }), n = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0; if (n) { e.preventDefault(); setSkin(SKINS[(i + n + SKINS.length) % SKINS.length][0]); var nb = pop.querySelector(".mk-pt-skin.is-on"); if (nb) nb.focus(); } });
      group.appendChild(b);
    });
    pop.appendChild(group);
    if (state.skin === "custom") {
      var box = el("div", "mk-pt-custom");
      box.appendChild(field("Couleur du panneau", "panel", K.toHex(K.parseHex(state.custom.panel) || [31, 41, 55])));
      box.appendChild(field("Couleur d'accent", "accent", K.toHex(K.parseHex(state.custom.accent) || [59, 130, 246])));
      var pal = paletteFor("custom", state.custom);
      box.appendChild(field("Couleur du texte", "text", state.custom.text || pal.tokens["--editor-text"]));
      var rep = pal.report;
      box.appendChild(el("p", "mk-pt-note", { role: "status" }, "Lisibilité garantie automatiquement" + (rep.accentAdjusted ? " : l'accent a été éclairci ou assombri pour rester visible." : ".") + " Texte " + rep.text.toFixed(1) + ":1."));
      pop.appendChild(box);
    }
    var foot = el("button", "mk-pt-reset", { type: "button" }, "Réinitialiser l'apparence");
    foot.addEventListener("click", reset); pop.appendChild(foot);
    if (focusId) { var f = pop.querySelector("[aria-label=\"" + focusId + "\"]"); if (f) f.focus(); }
  }
  function openPop() {
    pop.hidden = false; btn.setAttribute("aria-expanded", "true"); render();
    var r = btn.getBoundingClientRect(); pop.style.top = r.bottom + 6 + "px"; pop.style.right = Math.max(8, window.innerWidth - r.right) + "px";
    var on = pop.querySelector(".mk-pt-skin.is-on"); if (on) on.focus();
  }
  function closePop() { if (!pop || pop.hidden) return; pop.hidden = true; btn.setAttribute("aria-expanded", "false"); }
  function init() {
    var tools = document.querySelector(".mk-b-tools");
    if (!tools || btn) return;
    btn = el("button", "mk-b-icon mk-pt-btn", { type: "button", id: "mk-panel-theme", "aria-haspopup": "dialog", "aria-expanded": "false", "aria-controls": "mk-pt-pop", "aria-label": "Apparence des panneaux", "data-tip": "Apparence des panneaux" });
    btn.innerHTML = ICON;
    pop = el("div", "mk-pt-pop", { id: "mk-pt-pop", role: "dialog", "aria-label": "Apparence des panneaux" }); pop.hidden = true;
    var more = tools.querySelector(".mk-b-more"); tools.insertBefore(btn, more || null);
    document.body.appendChild(pop);
    btn.addEventListener("click", function () { if (pop.hidden) openPop(); else closePop(); });
    // Fermeture : clic ou frappe extérieurs, y compris dans l'iframe du canevas (ses événements ne remontent pas au document parent)
    var outside = function (e) { if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) closePop(); };
    document.addEventListener("pointerdown", outside, true);
    window.addEventListener("blur", function () { var a = document.activeElement; if (a && a.tagName === "IFRAME") closePop(); });
    var frame = document.getElementById("mk-frame");
    var watch = function () { try { frame.contentDocument.addEventListener("pointerdown", outside, true); } catch (e) { /* autre origine */ } };
    if (frame) { frame.addEventListener("load", watch); watch(); }
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !pop.hidden) { closePop(); btn.focus(); } }, true);
    window.addEventListener("resize", closePop);
    apply();
  }
  window.MKPanelTheme = { apply: apply, setSkin: setSkin, state: function () { return JSON.parse(JSON.stringify(state)); }, reset: reset };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

// Assistant IA des visiteurs : le script du widget ElevenLabs n'est chargé qu'APRÈS le clic du visiteur
// (aucune requête vers un tiers, aucun accès au micro avant). Sans dépendance, comme le reste du site.
(function () {
  "use strict";
  var root = document.querySelector("[data-kb-agent]");
  if (!root) return;
  var btn = root.querySelector("[data-kb-agent-open]");
  var note = root.querySelector("[data-kb-agent-note]");
  var busy = false;

  // Le bandeau de consentement (en bas de page, plus haut dans la pile) ne doit pas cacher le bouton : on le remonte tant que le bandeau est affiché
  var banner = document.getElementById("kw-consent");
  function lift() {
    var h = banner && !banner.hidden ? banner.getBoundingClientRect().height : 0;
    root.style.setProperty("--kb-agent-lift", h ? Math.ceil(h) + 12 + "px" : "0px");
  }
  if (banner) {
    lift();
    if (window.MutationObserver) new MutationObserver(lift).observe(banner, { attributes: true, attributeFilter: ["hidden", "class", "style"] });
    window.addEventListener("resize", lift);
    window.setTimeout(lift, 600);
  }

  function say(text) { note.textContent = text; note.hidden = !text; }

  // Le widget s'affiche réduit : on l'ouvre pour le visiteur (il vient de cliquer pour cela)
  function expand(el) {
    var tries = 0;
    (function look() {
      var shadow = el.shadowRoot;
      var inner = shadow && shadow.querySelector("button");
      if (inner) { inner.click(); return; }
      if (tries++ < 40) setTimeout(look, 150);
    })();
  }

  btn.addEventListener("click", function () {
    if (busy) return;
    busy = true;
    btn.setAttribute("aria-busy", "true");
    say("Chargement de l'assistant…");
    var script = document.createElement("script");
    script.src = root.getAttribute("data-src");
    script.integrity = root.getAttribute("data-integrity");
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = function () {
      var el = document.createElement("elevenlabs-convai");
      el.setAttribute("agent-id", root.getAttribute("data-agent-id"));
      el.setAttribute("dismissible", "true");
      document.body.appendChild(el);
      root.classList.add("is-live");
      say("");
      expand(el);
    };
    script.onerror = function () {
      busy = false;
      btn.removeAttribute("aria-busy");
      say("L'assistant est indisponible pour le moment. Écrivez-nous via la page Contact.");
    };
    document.head.appendChild(script);
  });
})();

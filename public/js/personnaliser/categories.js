/* Personnaliser — navigation des catégories : liste, sélection, vue détail avec retour. Les catégories viennent du serveur (boot.categories).
   Un panneau de réglages se branche avec KWPZ.registerPanel(id, { render(container) }) ; tant qu'une catégorie n'a pas de panneau, aucun faux réglage n'est affiché. */
(function () {
  "use strict";
  var K = window.KWPZ; if (!K) return;
  var cats = K.boot.categories || [];
  var list = document.getElementById("pz-cats");
  var home = document.getElementById("pz-view-home");
  var detail = document.getElementById("pz-view-detail");
  var title = document.getElementById("pz-detail-title");
  var body = document.getElementById("pz-detail-body");
  var back = document.getElementById("pz-back");
  var panels = {};
  var lastButton = null, selected = null; // la dernière catégorie ouverte reste repérée dans la liste au retour

  K.registerPanel = function (id, impl) { panels[id] = impl; };

  function byId(id) { for (var i = 0; i < cats.length; i++) if (cats[i].id === id) return cats[i]; return null; }

  function build() {
    var frag = document.createDocumentFragment();
    cats.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pz-cat"; b.dataset.cat = c.id;
      var s = document.createElement("span"); s.textContent = c.label; b.appendChild(s);
      b.insertAdjacentHTML("beforeend", '<svg aria-hidden="true"><use href="#pz-i-chev"/></svg>');
      b.addEventListener("click", function () { lastButton = b; K.set("category", c.id); });
      frag.appendChild(b);
    });
    list.appendChild(frag);
  }

  function enter(el) { el.classList.remove("is-enter"); void el.offsetWidth; el.classList.add("is-enter"); }

  function show(id) {
    var c = id ? byId(id) : null;
    if (c) selected = c.id;
    Array.prototype.forEach.call(list.children, function (b) { if (selected && b.dataset.cat === selected) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    if (!c) { detail.hidden = true; home.hidden = false; enter(home); if (lastButton) lastButton.focus({ preventScroll: true }); return; }
    title.textContent = c.label; body.textContent = "";
    var impl = panels[c.id];
    if (impl && typeof impl.render === "function") impl.render(body);
    else { var p = document.createElement("p"); p.textContent = "Les réglages de cette catégorie ne sont pas encore disponibles."; body.appendChild(p); }
    home.hidden = true; detail.hidden = false; enter(detail); title.focus({ preventScroll: true });
  }

  build();
  K.on("change:category", show);
  back.addEventListener("click", function () { K.set("category", null); });
  detail.addEventListener("keydown", function (e) { if (e.key === "Escape") K.set("category", null); });

  // Aide : texte repliable sous l'identité du site
  var help = document.getElementById("pz-help"), helpText = document.getElementById("pz-help-text");
  help.addEventListener("click", function () { var open = help.getAttribute("aria-expanded") !== "true"; help.setAttribute("aria-expanded", String(open)); helpText.hidden = !open; });
})();

// Éditeur de pages — panneau « Règles et magnétisme » et menu rapide.
// Il ne possède AUCUNE donnée : il lit et modifie les réglages du moteur (window.pbRules, fourni par page-builder.js) ;
// règles, guides, grille et magnétisme restent donc synchronisés avec le canevas, le menu des guides et les raccourcis.
// Ce sont des préférences d'interface : rien ici n'entre dans le contenu de la page ni dans la page publiée.
(function () {
  "use strict";
  var R = window.pbRules;
  var dlg = document.querySelector("[data-pb-rules]");
  if (!R || !dlg) return;
  var h = R.h, KS = window.KWSnap;
  var body = dlg.querySelector("[data-pb-rules-body]");
  var head = dlg.querySelector("[data-pb-rules-head]");

  // ---------- Lignes du panneau ----------
  // Chaque contrôle sait lire sa valeur dans l'état et l'écrire : sync() les remet à jour sans reconstruire le panneau
  // (le champ en cours de saisie n'est jamais écrasé).
  var controls = [];
  function reg(kind, el, read, write) { controls.push({ kind: kind, el: el, read: read, write: write }); return el; }
  var st = function () { return R.state(); };

  function check(label, read, write, hint) {
    var input = h("input", { type: "checkbox" });
    input.addEventListener("change", function () { write(input.checked); });
    reg("check", input, read, null);
    return h("label", { class: "pb-check", title: hint || null }, input, " " + label);
  }
  function numberField(label, read, write, opts) {
    var o = opts || {};
    var input = h("input", { type: "number", min: o.min, max: o.max, step: o.step || 1, inputmode: "decimal" });
    input.addEventListener("change", function () { var v = parseFloat(input.value); if (isFinite(v)) write(v); else sync(); });
    reg("value", input, read, null);
    var id = "pbr-" + Math.random().toString(36).slice(2, 8);
    input.id = id;
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), input);
  }
  function selectField(label, options, read, write) {
    var sel = h("select");
    options.forEach(function (op) { sel.appendChild(h("option", { value: op[0], text: op[1] })); });
    sel.addEventListener("change", function () { write(sel.value); });
    reg("value", sel, read, null);
    var id = "pbr-" + Math.random().toString(36).slice(2, 8);
    sel.id = id;
    return h("div", { class: "pb-field" }, h("label", { for: id, text: label }), sel);
  }
  function section(title, hint) { return h("section", { class: "pb-rules-sec" }, h("h3", { text: title }), hint ? h("p", { class: "pb-hint", text: hint }) : null); }

  // ---------- Construction ----------
  var P = function () { return st().prefs; };
  var upd = function (fn) { R.update(fn); };
  var gridCfg = function () { var s = st(); return s.device === "desktop" ? s.prefs.web : s.prefs.devices[s.device]; };
  var gridSet = function (k, v) { upd(function (p) { var s = st(); (s.device === "desktop" ? p.web : p.devices[s.device])[k] = v; }); };

  var screenLine = h("p", { class: "pb-rules-screen", "aria-live": "polite" });
  var guideList = h("div", { class: "pb-guide-list" });
  var sectionDisplay = section("Affichage");
  [
    ["Règles (R)", function () { return st().aids.rulers; }, function (v) { R.setAid("rulers", v); }],
    ["Guides (Maj + R)", function () { return st().aids.guides !== false; }, function (v) { R.setAid("guides", v); }],
    ["Grille (Maj + G)", function () { return st().aids.grid; }, function (v) { R.setAid("grid", v); }],
    ["Marges de la grille web", function () { return P().show.margins; }, function (v) { upd(function (p) { p.show.margins = v; }); }],
    ["Colonnes de la grille web", function () { return P().show.columns; }, function (v) { upd(function (p) { p.show.columns = v; }); }],
    ["Zone de sécurité", function () { return P().show.safe; }, function (v) { upd(function (p) { p.show.safe = v; }); }],
    ["Limites du conteneur (largeur maximale, centré)", function () { return P().show.container; }, function (v) { upd(function (p) { p.show.container = v; }); }],
  ].forEach(function (c) { sectionDisplay.appendChild(check(c[0], c[1], c[2])); });

  var sectionSnap = section("Magnétisme", "Alt (Option) maintenu pendant un geste : mouvement libre, sans accrochage.");
  var snapOn = check("Magnétisme général (Maj + M)", function () { return st().aids.snap; }, function (v) { R.setAid("snap", v); });
  sectionSnap.appendChild(snapOn);
  var snapSub = h("div", { class: "pb-rules-sub" });
  [
    ["Aux guides", "guides"], ["À la grille (pas ou colonnes)", "grid"], ["Aux bords (page, conteneur, parent)", "edges"], ["Au centre", "center"],
    ["Aux colonnes (grille web et pistes de Grille CSS)", "columns"], ["Aux autres éléments", "elements"],
    ["Guides intelligents (repères pendant le geste)", "smart"], ["Distances intelligentes (écarts en px)", "distances"],
  ].forEach(function (c) { snapSub.appendChild(check(c[0], function () { return P().snap[c[1]]; }, function (v) { upd(function (p) { p.snap[c[1]] = v; }); })); });
  sectionSnap.appendChild(snapSub);

  var sectionUnits = section("Unités", "Les règles et les guides sont des coordonnées en pixels de la page ; une autre unité n'en change que l'affichage (% : largeur de la page en x, hauteur en y).");
  sectionUnits.appendChild(selectField("Unité des règles et des guides", KS.UNITS.map(function (u) { return [u, { px: "px : pixels", "%": "% : pourcentage de la page", rem: "rem : taille de texte de la page", em: "em : taille de texte de la sélection", vw: "vw : largeur de la fenêtre", vh: "vh : hauteur de la fenêtre" }[u]]; }), function () { return P().unit; }, function (v) { upd(function (p) { p.unit = v; }); }));

  var sectionGuides = section("Guides");
  sectionGuides.appendChild(check("Guides indépendants par écran (ordinateur, tablette, mobile)", function () { return P().perDevice; }, function (v) { upd(function (p) { p.perDevice = v; }); }, "Désactivé : les mêmes guides s'affichent sur tous les écrans"));
  sectionGuides.appendChild(screenLine);
  sectionGuides.appendChild(guideList);
  var addAxis = selectField("Nouveau guide", [["v", "Vertical (position X)"], ["h", "Horizontal (position Y)"]], function () { return addAxis.__v || "v"; }, function (v) { addAxis.__v = v; });
  var addInput = h("input", { type: "text", inputmode: "decimal", "aria-label": "Position du nouveau guide", placeholder: "ex. 640 ou 50 %" });
  var addBtn = h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Ajouter", onclick: addGuide });
  function addGuide() { if (R.add(addAxis.querySelector("select").value, addInput.value)) { addInput.value = ""; sync(); } }
  addInput.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); addGuide(); } });
  sectionGuides.appendChild(h("div", { class: "pb-rules-add" }, addAxis, h("div", { class: "pb-field" }, h("label", { text: "Position" }), addInput), addBtn));
  sectionGuides.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-rules-clear": "", text: "Supprimer tous les guides de cet écran", onclick: function () { R.clear(); } }));

  var sectionGrid = section("Grille");
  var modeSel = selectField("Type de grille", [["free", "Libre : lignes à pas régulier"], ["web", "Web : colonnes, gouttières et marges"]], function () { return P().mode; }, function (v) { upd(function (p) { p.mode = v; }); });
  sectionGrid.appendChild(modeSel);
  var freeBox = h("div", { class: "pb-rules-sub" });
  freeBox.appendChild(selectField("Pas de la grille", [["4", "4 px"], ["8", "8 px"], ["10", "10 px"], ["12", "12 px"], ["16", "16 px"], ["24", "24 px"], ["32", "32 px"]], function () { return String(P().step); }, function (v) { upd(function (p) { p.step = Number(v); }); }));
  freeBox.appendChild(numberField("…ou pas personnalisé (px)", function () { return P().step; }, function (v) { upd(function (p) { p.step = v; }); }, { min: 2, max: 200 }));
  var webBox = h("div", { class: "pb-rules-sub" });
  webBox.appendChild(h("p", { class: "pb-hint", "data-rules-webscreen": "" }));
  webBox.appendChild(selectField("Colonnes", KS.COLUMN_CHOICES.map(function (n) { return [String(n), n + (n > 1 ? " colonnes" : " colonne")]; }), function () { return String(gridCfg().columns); }, function (v) { gridSet("columns", Number(v)); }));
  webBox.appendChild(h("div", { class: "pb-grid-2" },
    numberField("Gouttière (px)", function () { return gridCfg().gutter; }, function (v) { gridSet("gutter", v); }, { min: 0, max: 100 }),
    numberField("Largeur maximale (px, 0 = page entière)", function () { return gridCfg().maxWidth; }, function (v) { gridSet("maxWidth", v); }, { min: 0, max: 4000 })));
  webBox.appendChild(h("div", { class: "pb-grid-2" },
    numberField("Marge gauche (px)", function () { return gridCfg().marginL; }, function (v) { gridSet("marginL", v); }, { min: 0, max: 400 }),
    numberField("Marge droite (px)", function () { return gridCfg().marginR; }, function (v) { gridSet("marginR", v); }, { min: 0, max: 400 })));
  sectionGrid.appendChild(freeBox); sectionGrid.appendChild(webBox);
  sectionGrid.appendChild(h("p", { class: "pb-hint", text: "La grille n'est qu'un repère de conception : elle n'impose rien au rendu final et n'apparaît jamais sur le site publié." }));
  sectionGrid.appendChild(h("p", { class: "pb-subtitle", text: "Zone de sécurité (px)" }));
  sectionGrid.appendChild(h("div", { class: "pb-grid-2" },
    numberField("Haut", function () { return P().safe.top; }, function (v) { upd(function (p) { p.safe.top = v; }); }, { min: 0, max: 400 }),
    numberField("Bas", function () { return P().safe.bottom; }, function (v) { upd(function (p) { p.safe.bottom = v; }); }, { min: 0, max: 400 })));
  sectionGrid.appendChild(h("div", { class: "pb-grid-2" },
    numberField("Gauche", function () { return P().safe.left; }, function (v) { upd(function (p) { p.safe.left = v; }); }, { min: 0, max: 400 }),
    numberField("Droite", function () { return P().safe.right; }, function (v) { upd(function (p) { p.safe.right = v; }); }, { min: 0, max: 400 })));

  var sectionPrec = section("Précision");
  sectionPrec.appendChild(selectField("Force du magnétisme", [["1", "Légère"], ["2", "Normale"], ["3", "Forte"]], function () { return String(P().strength); }, function (v) { upd(function (p) { p.strength = Number(v); }); }));
  sectionPrec.appendChild(selectField("Distance d'accrochage", [["4", "4 px"], ["8", "8 px"], ["12", "12 px"], ["16", "16 px"], ["24", "24 px"]], function () { return String(P().distance); }, function (v) { upd(function (p) { p.distance = Number(v); }); }));
  sectionPrec.appendChild(numberField("…ou distance personnalisée (px d'écran)", function () { return P().distance; }, function (v) { upd(function (p) { p.distance = v; }); }, { min: 1, max: 48 }));

  var sectionKeys = section("Raccourcis");
  var keys = h("dl", { class: "pb-rules-keys" });
  [["R", "Règles"], ["Maj + R", "Guides"], ["Maj + G", "Grille"], ["Maj + M", "Magnétisme"], ["Alt (pendant un geste)", "Mouvement libre, sans accrochage"], ["Maj (poignée d'angle)", "Garder les proportions"], ["Alt + survol", "Distances avec l'élément survolé"], ["Suppr", "Supprimer le guide sélectionné"], ["Double-clic sur un guide", "Saisir sa position"]]
    .forEach(function (k) { keys.appendChild(h("dt", null, h("kbd", { text: k[0] }))); keys.appendChild(h("dd", { text: k[1] })); });
  sectionKeys.appendChild(keys);

  [sectionDisplay, sectionSnap, sectionUnits, sectionGuides, sectionGrid, sectionPrec, sectionKeys].forEach(function (x) { body.appendChild(x); });

  // ---------- Liste des guides de l'écran ----------
  function guideRows() {
    var s = st(), g = s.guides;
    guideList.textContent = "";
    var any = false;
    [["v", "Vertical · X", g.v], ["h", "Horizontal · Y", g.h]].forEach(function (grp) {
      grp[2].forEach(function (pos, i) {
        any = true;
        var sel = s.selected && s.selected.axis === grp[0] && s.selected.i === i;
        var input = h("input", { type: "text", inputmode: "decimal", value: R.format(grp[0], pos), "aria-label": "Position du guide " + (grp[0] === "v" ? "vertical" : "horizontal") + " " + (i + 1), "data-guide-axis": grp[0], "data-guide-index": String(i) });
        var commit = function () { if (input.value.trim() !== R.format(grp[0], pos)) R.move(grp[0], i, input.value); else R.select(grp[0], i); };
        input.addEventListener("change", commit);
        input.addEventListener("focus", function () { R.select(grp[0], i); });
        input.addEventListener("keydown", function (e) { e.stopPropagation(); if (e.key === "Enter") { e.preventDefault(); commit(); } });
        guideList.appendChild(h("div", { class: "pb-guide-row" + (sel ? " is-selected" : "") },
          h("span", { class: "pb-guide-kind", text: grp[1] }), input, h("span", { class: "pb-guide-unit", text: P().unit }),
          h("button", { type: "button", class: "pb-icon-btn", "aria-label": "Supprimer ce guide", "data-tip": "Supprimer ce guide", text: "×", onclick: function () { R.remove(grp[0], i); } })));
      });
    });
    if (!any) guideList.appendChild(h("p", { class: "pb-hint", text: "Aucun guide sur cet écran. Tirez-en un depuis une règle, ou ajoutez-en un ci-dessous." }));
  }

  // ---------- Synchronisation ----------
  function sync() {
    var s = st();
    screenLine.textContent = "Écran actif : " + s.deviceLabel + " · " + s.width + " px" + (s.prefs.perDevice ? "" : " (guides communs à tous les écrans)");
    controls.forEach(function (c) {
      if (document.activeElement === c.el && c.el.tagName === "INPUT" && c.el.type !== "checkbox") return;
      var v = c.read();
      if (c.kind === "check") c.el.checked = Boolean(v); else c.el.value = String(v);
    });
    snapSub.querySelectorAll("input").forEach(function (i) { i.disabled = !s.aids.snap; });
    freeBox.hidden = s.prefs.mode !== "free"; webBox.hidden = s.prefs.mode !== "web";
    var ws = webBox.querySelector("[data-rules-webscreen]");
    if (ws) ws.textContent = "Réglages de l'écran « " + s.deviceLabel + " » (" + s.width + " px)" + (s.device === "desktop" ? "." : " : propres à cet écran.");
    var clear = sectionGuides.querySelector("[data-rules-clear]"); if (clear) clear.disabled = !(s.guides.h.length || s.guides.v.length);
    var focusedGuide = document.activeElement && document.activeElement.closest && document.activeElement.closest(".pb-guide-list") && document.activeElement.tagName === "INPUT";
    if (!focusedGuide) guideRows();
    syncQuick();
  }
  R.subscribe(function () { if (dlg.open) sync(); syncQuick(); });

  // ---------- Menu rapide (barre du haut) ----------
  var quickBtn = document.querySelector("[data-pb-rules-menu]");
  var pop = h("div", { class: "pb-rules-pop", role: "menu", "aria-label": "Règles, guides et magnétisme", hidden: true });
  var quickChecks = [];
  // Deux groupes (Affichage / Alignement) ; chaque ligne entière est cliquable (le libellé est dans le <label>) ; mêmes réglages qu'avant
  var QUICK = [
    ["Affichage", [["Règles", function () { return st().aids.rulers; }, function (v) { R.setAid("rulers", v); }],
      ["Guides", function () { return st().aids.guides !== false; }, function (v) { R.setAid("guides", v); }],
      ["Grille", function () { return st().aids.grid; }, function (v) { R.setAid("grid", v); }]]],
    ["Alignement", [["Magnétisme", function () { return st().aids.snap; }, function (v) { R.setAid("snap", v); }],
      ["Guides intelligents", function () { return P().snap.smart; }, function (v) { upd(function (p) { p.snap.smart = v; }); }]]],
  ];
  QUICK.forEach(function (g) {
    var group = h("div", { class: "pb-pop-group", role: "group", "aria-label": g[0] }, h("span", { class: "pb-pop-title", "aria-hidden": "true", text: g[0] }));
    g[1].forEach(function (c) {
      var input = h("input", { type: "checkbox", role: "menuitemcheckbox" });
      input.addEventListener("change", function () { c[2](input.checked); });
      quickChecks.push({ el: input, read: c[1] });
      group.appendChild(h("label", { class: "pb-check pb-pop-row" }, input, h("span", { text: c[0] })));
    });
    pop.appendChild(group);
  });
  pop.appendChild(h("button", { type: "button", class: "pb-menu-item pb-pop-more", role: "menuitem", onclick: function () { closePop(); open(); } }, R.icon("sliders"), h("span", { text: "Paramètres…" }), R.icon("chevronRight")));
  document.body.appendChild(pop);
  function syncQuick() { quickChecks.forEach(function (c) { c.el.checked = Boolean(c.read()); }); }
  function closePop() { pop.hidden = true; if (quickBtn) quickBtn.setAttribute("aria-expanded", "false"); }
  function togglePop() {
    if (!pop.hidden) { closePop(); return; }
    syncQuick();
    var r = quickBtn.getBoundingClientRect();
    pop.hidden = false;
    var below = r.bottom + 6, fits = below + pop.offsetHeight <= window.innerHeight - 8;
    pop.style.top = Math.max(8, fits ? below : r.top - 6 - pop.offsetHeight) + "px";
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + "px";
    quickBtn.setAttribute("aria-expanded", "true");
    var f = pop.querySelector("input"); if (f) f.focus();
  }
  if (quickBtn) quickBtn.addEventListener("click", function (e) { e.stopPropagation(); togglePop(); });
  document.addEventListener("click", function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== quickBtn && !(quickBtn && quickBtn.contains(e.target))) closePop(); });
  pop.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closePop(); if (quickBtn) quickBtn.focus(); } });

  // ---------- Ouverture et déplacement de la fenêtre ----------
  function open(where) {
    if (!dlg.open) dlg.show();
    sync();
    var target = where === "guides" ? body.querySelector(".pb-guide-row.is-selected input") || addInput : body.querySelector("input");
    if (target) { target.focus(); if (target.scrollIntoView) target.scrollIntoView({ block: "nearest" }); }
  }
  R.open = open;
  dlg.querySelector("[data-pb-close]").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("keydown", function (e) { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); dlg.close(); } });
  head.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    var r = dlg.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    function move(ev) { dlg.style.left = Math.max(0, Math.min(ev.clientX - dx, window.innerWidth - 80)) + "px"; dlg.style.top = Math.max(0, Math.min(ev.clientY - dy, window.innerHeight - 40)) + "px"; dlg.style.right = "auto"; }
    function up() { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
  });
  sync();
})();

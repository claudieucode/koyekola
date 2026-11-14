/* KOLAKISA — outils avancés de la barre contextuelle : informations de l'élément, déplacement vers un autre conteneur, personnalisation de la barre.
   Chargé À LA DEMANDE (première utilisation seulement) : il n'est jamais inclus dans le chargement initial de l'éditeur ni sur le site publié.
   Il ne possède AUCUNE donnée : tout passe par l'interface `api` donnée par page-builder.js (même document, même historique, mêmes dialogues). */
(function (root) {
  "use strict";
  var A = null;
  var q = function (n, one, many) { return n + " " + (n > 1 ? many : one); };

  // ---------- Informations : uniquement des faits lus dans le document ----------
  function info(it) {
    var l = A.locate(it.id);
    var kids = A.kidsOf(it) || [], all = 0, widgets = 0;
    A.walk(function () { all++; }, kids);
    A.walk(function (x) { if (A.isNode(x) && !A.kidsOf(x)) widgets++; }, kids);
    var path = l ? l.ancestors.map(A.nameOf).concat([A.nameOf(it)]) : [A.nameOf(it)];
    var rows = [["Type", A.typeLabel(it)], ["Nom", it.name || "— (nom automatique)"], ["Identifiant", it.id], ["Emplacement", path.join(" › ")]];
    if (kids.length || A.kidsOf(it)) rows.push(["Contenu", q(kids.length, "enfant direct", "enfants directs") + " · " + q(all, "élément", "éléments") + " au total"]);
    var states = [];
    if (it.hidden) states.push("masqué sur le site publié");
    if (it.locked) states.push("verrouillé");
    if ((it.hideOn || []).length) states.push("masqué sur : " + it.hideOn.map(A.bpLabel).join(", "));
    if (it.audience) states.push("affichage conditionné à l'audience");
    rows.push(["État", states.length ? states.join(" · ") : "visible partout, modifiable"]);
    var devs = Object.keys(it.styles || {}).filter(function (d) { return it.styles[d] && Object.keys(it.styles[d]).length; });
    var nStates = Object.keys(it.states || {}).filter(function (s) { return it.states[s] && Object.keys(it.states[s]).length; });
    rows.push(["Réglages de style", devs.length ? devs.map(function (d) { return A.bpLabel(d) + " (" + Object.keys(it.styles[d]).length + ")"; }).join(" · ") : "aucun"]);
    if (nStates.length) rows.push(["États (survol, focus…)", nStates.join(", ")]);
    if (it.classes) rows.push(["Classes CSS", String(it.classes)]);
    if (it.anchor) rows.push(["Ancre", "#" + it.anchor]);
    if ((it.attrs || []).length) rows.push(["Attributs personnalisés", it.attrs.map(function (a) { return a.name + (a.value ? '="' + a.value + '"' : ""); }).join(", ")]);
    if (it.note) rows.push(["Note de l'équipe", it.note + " (jamais publiée)"]);
    if (it.type === "component") {
      var c = A.components().filter(function (x) { return x.id === it.componentId; })[0];
      rows.push(["Composant global", c ? c.name + " · utilisé " + q(c.uses || 0, "fois", "fois") : "introuvable (supprimé ?)"]);
    }
    if (it.css) rows.push(["CSS personnalisé", it.css.length + " caractères"]);
    var wr = widgets && A.isNode(it) ? widgets : 0;
    if (wr && kids.length) rows.push(["Widgets contenus", String(wr)]);
    A.dialog({ title: "Informations · " + A.typeLabel(it), confirmLabel: "Fermer", hideCancel: true, build: function (body) {
      var dl = A.h("dl", { class: "pb-ctx-info" });
      rows.forEach(function (r) { dl.appendChild(A.h("dt", { text: r[0] })); dl.appendChild(A.h("dd", { text: r[1] })); });
      body.appendChild(dl);
    }, onConfirm: function () { return true; } });
  }

  // ---------- Déplacer vers un autre conteneur : seuls les emplacements réellement valides sont proposés ----------
  function targets(it) {
    var out = [], self = A.locate(it.id), isSection = !A.isNode(it);
    if (!isSection) {
      A.walk(function (x, parent, depth) {
        if (!A.kidsOf(x) || x.id === it.id) return;
        if (A.lockedDeep(x.id)) return;
        var l = A.locate(x.id);
        if (l.ancestors.some(function (a) { return a.id === it.id; })) return; // jamais dans un de ses descendants
        if (self && self.parent && self.parent.id === x.id) return;             // déjà là
        out.push({ item: x, depth: depth });
      });
    }
    return out;
  }
  function moveDialog(it) {
    var list = targets(it), isSection = !A.isNode(it);
    if (!list.length) { A.toast(isSection ? "Une section ne se place pas dans un conteneur : utilisez Monter / Descendre." : "Aucun autre conteneur disponible pour cet élément.", true); return; }
    var sel = A.h("select", { id: "pb-ctx-move-to", class: "pb-select" });
    var self = A.locate(it.id);
    if (self && self.parent) sel.appendChild(A.h("option", { value: "" }, "Racine de la page (nouvelle section)"));
    list.forEach(function (t) { sel.appendChild(A.h("option", { value: t.item.id, text: new Array(t.depth + 1).join("— ") + A.nameOf(t.item) })); });
    var pos = A.h("select", { id: "pb-ctx-move-pos", class: "pb-select" }, A.h("option", { value: "end" }, "À la fin"), A.h("option", { value: "start" }, "Au début"));
    A.dialog({ title: "Déplacer « " + A.nameOf(it) + " »", confirmLabel: "Déplacer", build: function (body) {
      body.appendChild(A.h("div", { class: "pb-field" }, A.h("label", { for: "pb-ctx-move-to", text: "Vers le conteneur" }), sel));
      body.appendChild(A.h("div", { class: "pb-field" }, A.h("label", { for: "pb-ctx-move-pos", text: "Position" }), pos));
      body.appendChild(A.h("p", { class: "pb-hint", text: "Un élément ne va jamais dans un de ses propres descendants ni dans un emplacement verrouillé. Annulable avec Ctrl/⌘ + Z." }));
    }, onConfirm: function () {
      var cur = A.byId(it.id); if (!cur) throw new Error("L'élément n'existe plus.");
      var parent = sel.value ? A.byId(sel.value) : null;
      if (sel.value && !parent) throw new Error("Le conteneur choisi n'existe plus.");
      var idx = pos.value === "start" ? 0 : 1e9;
      A.moveTo([it.id], parent, idx);
      return true;
    } });
  }

  // ---------- Personnalisation de la barre : choisir ses raccourcis, restaurer la disposition par défaut ----------
  function customize(optional, hidden, save) {
    var boxes = {};
    A.dialog({ title: "Personnaliser la barre d'actions", confirmLabel: "Enregistrer", build: function (body) {
      body.appendChild(A.h("p", { class: "pb-hint", text: "Choisissez les raccourcis visibles sur la barre. Les autres restent dans le menu « Plus d'actions ». Déplacer, Plus d'actions et Supprimer sont toujours affichés. Ce réglage est propre à votre compte sur ce navigateur." }));
      var ul = A.h("div", { class: "pb-ctx-pref", role: "group", "aria-label": "Raccourcis visibles" });
      optional.forEach(function (o) {
        var cb = A.h("input", { type: "checkbox", id: "pb-ctx-pref-" + o.key, checked: hidden.indexOf(o.key) < 0 });
        boxes[o.key] = cb;
        ul.appendChild(A.h("label", { class: "pb-ctx-pref-row", for: "pb-ctx-pref-" + o.key }, cb, A.icon(o.icon), A.h("span", { text: o.label })));
      });
      body.appendChild(ul);
      body.appendChild(A.h("button", { type: "button", class: "btn btn-ghost btn-sm", onclick: function () { optional.forEach(function (o) { boxes[o.key].checked = true; }); } }, "Restaurer la disposition par défaut"));
    }, onConfirm: function () {
      save(optional.filter(function (o) { return !boxes[o.key].checked; }).map(function (o) { return o.key; }));
      return true;
    } });
  }

  root.pbCtx = { attach: function (api) { A = api; return root.pbCtx; }, info: info, moveDialog: moveDialog, customize: customize, targets: targets };
})(window);

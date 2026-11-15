// KOLAKISA CMS → Médiathèque : panneau d'aperçu rapide (même panneau latéral que « Informations », onglet « Aperçu »).
// Il suit la sélection : flèches, clic ou boutons précédent / suivant changent le fichier sans fermer le panneau. La visionneuse (media-viewer.js) est créée UNE fois et réutilisée ;
// elle est détruite (lecteurs arrêtés, sources vidées) dès que le panneau se ferme ou change d'onglet. Les informations affichées viennent de la liste (aucun téléchargement du fichier complet).
(function () {
  "use strict";
  var MX = window.MX, V = window.MXViewer; if (!MX || !V) return;
  var h = MX.h, K = MX.K;
  var root = null, hostEl = null, viewer = null, curId = null, measured = {}, ui = {}, curSpec = function () { return {}; };
  var fdate = function (v) { return v ? String(v).slice(0, 10).split("-").reverse().join("/") : "—"; };

  function btn(label, run, o) { o = o || {}; return h("button", { type: "button", class: o.cls || "btn btn-outline btn-sm", text: o.text === undefined ? label : o.text, "aria-label": label, title: o.title || label, onclick: run }); }
  function iconBtn(label, glyph, run, key) { return h("button", { type: "button", class: "mx-iconbtn is-small", "aria-label": label, title: label, "data-ql": key || null, onclick: run, text: glyph }); }

  function build(host) {
    var spec = function () { return curSpec(); }; // toujours l'état COURANT (fichier sélectionné maintenant), jamais celui de l'ouverture
    release();
    hostEl = host; host.textContent = "";
    ui.prev = iconBtn("Fichier précédent (flèche haut ou gauche)", "‹", function () { spec().onStep(-1); }, "prev");
    ui.next = iconBtn("Fichier suivant (flèche bas ou droite)", "›", function () { spec().onStep(1); }, "next");
    ui.count = h("span", { class: "mx-ql-count", "aria-live": "polite" });
    ui.tools = h("div", { class: "mx-ql-tools", role: "toolbar", "aria-label": "Zoom et rotation de l'image" }, [
      iconBtn("Zoom arrière", "−", function () { viewer.zoom(0.8); }, "z-"), iconBtn("Zoom avant", "+", function () { viewer.zoom(1.25); }, "z+"),
      iconBtn("Pivoter de 90°", "⟳", function () { viewer.rotate(); }, "rot"), iconBtn("Ajuster à la largeur", "⤢", function () { viewer.fit(); }, "fit"), btn("Taille réelle (100 %)", function () { viewer.actual(); }, { text: "100 %", cls: "mx-ql-100", title: "Taille réelle : charge l'image d'origine" }),
    ]);
    ui.stage = h("div", { class: "mx-ql-stage", "data-ql-stage": "" });
    ui.empty = h("p", { class: "mx-ql-empty", text: "Sélectionnez un fichier pour le voir ici. Astuce : touche Espace." });
    ui.name = h("h2", { class: "mx-ql-name" });
    ui.dl = h("dl", { class: "mx-dl mx-ql-dl" });
    ui.note = h("p", { class: "mx-ql-note", role: "status" });
    ui.actions = h("div", { class: "mx-info-actions" }, [
      btn("Télécharger", function () { var m = spec().m; if (m) MX.download([{ id: m.id, name: m.name, path: m.path }]); }),
      btn("Copier le lien", function () { var m = spec().m; if (m) K.copy(K.absolute(m.path)).then(function () { MX.toast("Lien copié.", "ok"); }, function () { MX.toast("Copie automatique impossible.", "error"); }); }),
      btn("Plein écran", function () { var m = spec().m; if (m) spec().onFull(m.id); }, { title: "Ouvrir dans une fenêtre superposée" }),
      btn("Informations", function () { spec().onInfo(); }),
    ]);
    ui.prefs = h("details", { class: "mx-ql-prefs" }, [h("summary", { text: "Réglages de l'aperçu" }), prefsBody(spec)]);
    root = h("div", { class: "mx-ql", "data-mx-ql": "" }, [
      h("div", { class: "mx-ql-bar" }, [ui.prev, ui.count, ui.next, h("span", { class: "mx-ql-sp" }), ui.tools]),
      ui.stage, ui.empty,
      h("div", { class: "mx-ql-meta" }, [ui.name, ui.dl, ui.note, ui.actions, ui.prefs]),
    ]);
    host.appendChild(root);
    viewer = V.create(ui.stage, { eager: false, wheelZoom: false, onMeta: function (info) { measured[curId] = info; paintMeta(spec().m); } });
  }
  function prefsBody(spec) {
    var sel = function (label, name, opts, cur, onchange) {
      var s = h("select", { "aria-label": label }, opts.map(function (o) { return h("option", { value: o[0], text: o[1], selected: o[0] === cur ? "" : null }); }));
      s.addEventListener("change", function () { onchange(s.value); });
      return h("label", { class: "mx-ql-pref" }, [h("span", { text: label }), s]);
    };
    var p = spec().prefs;
    return h("div", { class: "mx-ql-prefbody" }, [
      sel("Ouvrir l'aperçu rapide (Espace)", "previewMode", [["panneau", "Dans le panneau latéral"], ["fenetre", "Dans une fenêtre superposée"]], p.previewMode, function (v) { spec().setPref({ previewMode: v }); }),
      sel("Double-clic sur un fichier", "dblclick", [["plein-ecran", "Fenêtre plein écran"], ["panneau", "Panneau d'aperçu"], ["infos", "Panneau d'informations"], ["aucune", "Aucune action"]], p.dblclick, function (v) { spec().setPref({ dblclick: v }); }),
    ]);
  }
  function row(dt, dd) { return [h("dt", { text: dt }), h("dd", {}, [dd])]; }
  function paintMeta(m) {
    if (!ui.dl || !m) return;
    var me = measured[m.id] || {}, w = m.width || me.width, hh = m.height || me.height, rows = [];
    var add = function (k, v) { if (v === null || v === undefined || v === "") return; rows.push.apply(rows, row(k, typeof v === "string" ? document.createTextNode(v) : v)); };
    add("Type", (K.TYPE_LABELS[m.type] || "Fichier") + (m.mime ? " · " + m.mime : ""));
    add("Taille", K.fmtSize(m.size));
    if ((m.type === "image" || m.type === "video") && w) add("Dimensions", w + " × " + hh + " px");
    if ((m.type === "video" || m.type === "audio") && me.duration && isFinite(me.duration)) add("Durée", V.fmtDur(me.duration));
    add("Ajouté le", fdate(m.createdAt)); add("Modifié le", fdate(m.updatedAt || m.createdAt));
    add("Dossier", m.folderName || "Racine");
    var tags = m.tags && m.tags.length ? h("span", {}, m.tags.map(function (t) { return h("span", { class: "mx-chip", text: t }); })) : null;
    add("Étiquettes", tags || "Aucune");
    ui.dl.textContent = ""; rows.forEach(function (n) { ui.dl.appendChild(n); });
  }

  // spec() : fonction renvoyant l'état courant { m, selected, pos, total, canPrev, canNext, onStep, onFull, onInfo, prefs, setPref }
  function render(host, spec) {
    curSpec = spec; var s = spec(), m = s.m;
    if (!root || hostEl !== host || !host.contains(root)) build(host);
    ui.prev.disabled = !s.canPrev; ui.next.disabled = !s.canNext;
    ui.count.textContent = m ? (s.pos + 1) + " / " + s.total : "";
    ui.empty.hidden = Boolean(m); ui.stage.hidden = !m; ui.tools.hidden = !m || m.type !== "image"; ui.name.hidden = ui.dl.hidden = ui.actions.hidden = !m;
    ui.note.textContent = m && s.selected > 1 ? "Aperçu du dernier fichier sélectionné (" + s.selected + " sélectionnés)." : "";
    if (!m) { viewer.clear(); curId = null; return; }
    ui.name.textContent = m.name;
    if (curId !== m.id) { curId = m.id; viewer.show(m); V.preload(s.next); V.preload(s.prev); }
    paintMeta(m);
  }
  function release() {
    if (viewer) { try { viewer.destroy(); } catch (e) { /* déjà libéré */ } }
    if (root && root.parentNode) root.parentNode.removeChild(root);
    viewer = null; root = null; hostEl = null; curId = null; ui = {}; measured = {};
  }
  window.MXQuick = { render: render, release: release, isActive: function () { return Boolean(root); }, viewer: function () { return viewer; } };
})();

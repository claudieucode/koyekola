// KOLAKISA CMS → Médiathèque : aperçu en fenêtre superposée (plein écran). Il utilise la même visionneuse que le panneau d'aperçu rapide (media-viewer.js) :
// images (zoom, déplacement, rotation), vidéo et audio (lecteurs), PDF, fiche de propriétés pour les autres formats ; précédent / suivant dans la liste affichée (recherche, dossier, catégorie).
// L'image d'origine n'est chargée qu'à l'ouverture de cette fenêtre (la grille n'affiche que des miniatures) ; une version moyenne sert d'aperçu immédiat pendant le chargement.
(function () {
  "use strict";
  var MX = window.MX, V = window.MXViewer; if (!MX || !V) return;
  var K = MX.K, h = MX.h;
  var el = null, list = [], at = 0, opener = null, viewer = null, token = 0;

  function build() {
    el = h("div", { id: "mx-preview", class: "mx-preview", role: "dialog", "aria-modal": "true", "aria-label": "Aperçu du fichier", hidden: "" }, [
      h("header", { class: "mx-pv-bar" }, [
        h("div", { class: "mx-pv-title" }, [h("strong", { "data-pv-name": "" }), h("span", { class: "mx-pv-count", "data-pv-count": "", "aria-live": "polite" })]),
        h("div", { class: "mx-pv-tools", "data-pv-tools": "" }, [
          tool("Zoom arrière (-)", function () { viewer.zoom(0.8); }, "z-"), tool("Zoom avant (+)", function () { viewer.zoom(1.25); }, "z+"), tool("Pivoter (R)", function () { viewer.rotate(); }, "rot"), tool("Ajuster à l'écran (0)", function () { viewer.fit(); }, "fit"),
        ]),
        h("div", { class: "mx-pv-actions" }, [
          btn("Télécharger", function () { var m = list[at]; MX.download([{ id: m.id, name: m.name, path: m.path }]); }),
          btn("Copier le lien", function () { K.copy(K.absolute(list[at].path)).then(function () { MX.toast("Lien copié.", "ok"); }, function () { MX.toast("Copie automatique impossible.", "error"); }); }),
          btn("Dans le panneau", function () { var id = list[at].id; close(); if (MX.quick) MX.quick.show(id); }, "Afficher ce fichier dans le panneau d'aperçu"),
          btn("Informations", function () { var id = list[at].id; close(); MX.selectOnly(id); MX.openInfo(true, "infos"); }),
          h("button", { type: "button", class: "mx-pv-x", "aria-label": "Fermer l'aperçu (Échap)", text: "×", onclick: close }),
        ]),
      ]),
      h("button", { type: "button", class: "mx-pv-nav is-prev", "aria-label": "Fichier précédent (flèche gauche)", text: "‹", onclick: function () { go(-1); } }),
      h("div", { class: "mx-pv-stage", "data-pv-stage": "" }),
      h("button", { type: "button", class: "mx-pv-nav is-next", "aria-label": "Fichier suivant (flèche droite)", text: "›", onclick: function () { go(1); } }),
      h("footer", { class: "mx-pv-foot", "data-pv-foot": "" }),
    ]);
    document.body.appendChild(el);
    el.addEventListener("click", function (e) { if (e.target === el || e.target.hasAttribute("data-pv-stage")) close(); });
    el.addEventListener("keydown", keys);
    var stage = el.querySelector("[data-pv-stage]");
    viewer = V.create(stage, { eager: true, wheelZoom: true, panAlways: true, onMeta: function (info) { meta(info); } });
  }
  function tool(label, run, key) { return h("button", { type: "button", class: "mx-iconbtn", "aria-label": label, title: label, "data-pv-tool": key, onclick: run, text: { "z-": "−", "z+": "+", rot: "⟳", fit: "⤢" }[key] }); }
  function btn(label, run, title) { return h("button", { type: "button", class: "btn btn-outline btn-sm", text: label, title: title || null, onclick: run }); }

  function meta(info) {
    var m = list[at]; if (!m || !el) return;
    var s = el.querySelector("[data-pv-extra]"); if (!s) return;
    var bits = [];
    if (info.duration && isFinite(info.duration)) bits.push("Durée " + V.fmtDur(info.duration));
    if (m.type === "video" && info.width) bits.push(info.width + " × " + info.height + " px");
    if (bits.length) s.textContent = " · " + bits.join(" · ");
  }
  function show(i) {
    at = (i + list.length) % list.length;
    var m = list[at], my = ++token;
    el.querySelector("[data-pv-name]").textContent = m.name; el.querySelector("[data-pv-count]").textContent = list.length > 1 ? (at + 1) + " / " + list.length : "";
    el.querySelector("[data-pv-tools]").hidden = m.type !== "image";
    el.querySelector(".is-prev").hidden = el.querySelector(".is-next").hidden = list.length < 2;
    foot(m, my);
    viewer.show(m);
    // Précharger les voisins (images, version moyenne) pour une navigation instantanée
    V.preload(list[(at + 1) % list.length]); V.preload(list[(at - 1 + list.length) % list.length]);
  }
  function foot(m, my) {
    var f = el.querySelector("[data-pv-foot]"); f.textContent = "";
    var base = [K.TYPE_LABELS[m.type] || "Fichier", m.mime, K.fmtSize(m.size), m.width ? m.width + " × " + m.height + " px" : null].filter(Boolean).join(" · ");
    f.appendChild(h("span", { text: base })); f.appendChild(h("span", { "data-pv-extra": "" }));
    if (m.type === "image") V.detail(m.id).then(function (d) {
      if (my !== token) return;
      var ex = d.exif; if (!ex) return; var bits = [];
      if (ex.make || ex.model) bits.push([ex.make, ex.model].filter(Boolean).join(" ")); if (ex.takenAt) bits.push(ex.takenAt); if (ex.fNumber) bits.push("f/" + Math.round(ex.fNumber * 10) / 10); if (ex.iso) bits.push("ISO " + ex.iso);
      if (bits.length) f.appendChild(h("span", { class: "mx-pv-exif", text: " · " + bits.join(" · ") }));
    }, function () { /* informations complémentaires indisponibles */ });
  }
  function go(d) { if (list.length > 1) show(at + d); }
  var inMedia = function (t) { return t && t.closest && t.closest("video, audio, input, iframe"); };
  function keys(e) {
    if (e.key === "Escape" || (e.key === " " && !e.target.closest("button, a, video, audio, iframe, input"))) { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowLeft" && !inMedia(e.target)) { e.preventDefault(); go(-1); } else if (e.key === "ArrowRight" && !inMedia(e.target)) { e.preventDefault(); go(1); }
    else if (e.key === "+" || e.key === "=") viewer.zoom(1.25); else if (e.key === "-") viewer.zoom(0.8); else if (e.key === "0") viewer.fit(); else if (e.key === "r" || e.key === "R") viewer.rotate();
    else if (e.key === "Tab") { var f = el.querySelectorAll("button:not([hidden]), a[href], iframe, video, audio, [tabindex]"); var vis = Array.prototype.filter.call(f, function (n) { return n.offsetParent !== null; }); if (!vis.length) return; var first = vis[0], last = vis[vis.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  function open(items, index) {
    if (!el) build();
    list = items.slice(); opener = document.activeElement; el.hidden = false; document.documentElement.style.overflow = "hidden";
    show(index || 0); el.querySelector(".mx-pv-x").focus();
  }
  function close() {
    if (!el || el.hidden) return;
    token++; viewer.clear(); el.hidden = true; document.documentElement.style.overflow = ""; list = []; // lecteurs arrêtés, sources vidées, liste libérée
    if (opener && opener.focus) opener.focus(); opener = null;
  }
  window.MXPreview = { open: open, close: close, isOpen: function () { return Boolean(el && !el.hidden); } };
})();

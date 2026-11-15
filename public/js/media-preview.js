// KOLAKISA CMS → Médiathèque : prévisualisation plein écran (images avec zoom, déplacement et rotation ; vidéo et audio avec lecteur ; PDF ; navigation entre les fichiers).
// L'image d'origine n'est chargée qu'à l'ouverture (la grille n'affiche que des miniatures) ; une version moyenne sert d'aperçu immédiat pendant le chargement.
(function () {
  "use strict";
  var MX = window.MX; if (!MX) return;
  var K = MX.K, h = MX.h;
  var el = null, list = [], at = 0, st = { z: 1, x: 0, y: 0, r: 0 }, opener = null, drag = null, token = 0;

  function build() {
    el = h("div", { id: "mx-preview", class: "mx-preview", role: "dialog", "aria-modal": "true", "aria-label": "Aperçu du fichier", hidden: "" }, [
      h("header", { class: "mx-pv-bar" }, [
        h("div", { class: "mx-pv-title" }, [h("strong", { "data-pv-name": "" }), h("span", { class: "mx-pv-count", "data-pv-count": "", "aria-live": "polite" })]),
        h("div", { class: "mx-pv-tools", "data-pv-tools": "" }, [
          tool("zoomOut", "Zoom arrière (-)", function () { zoom(0.8); }, "z-"), tool("zoomIn", "Zoom avant (+)", function () { zoom(1.25); }, "z+"), tool("rotateCw", "Pivoter (R)", function () { st.r = (st.r + 90) % 360; paint(); }, "rot"), tool("maximize", "Ajuster à l'écran (0)", fit, "fit"),
        ]),
        h("div", { class: "mx-pv-actions" }, [
          btn("Télécharger", function () { var m = list[at]; MX.download([{ id: m.id, name: m.name, path: m.path }]); }), btn("Copier le lien", function () { K.copy(K.absolute(list[at].path)).then(function () { MX.toast("Lien copié.", "ok"); }, function () { MX.toast("Copie automatique impossible.", "error"); }); }),
          btn("Informations", function () { var id = list[at].id; close(); MX.selectOnly(id); MX.openInfo(true); }),
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
    stage.addEventListener("wheel", function (e) { if (!imgEl()) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false });
    stage.addEventListener("pointerdown", function (e) { var i = imgEl(); if (!i || e.button !== 0) return; drag = { x: e.clientX - st.x, y: e.clientY - st.y }; stage.setPointerCapture(e.pointerId); i.classList.add("is-drag"); });
    stage.addEventListener("pointermove", function (e) { if (!drag) return; st.x = e.clientX - drag.x; st.y = e.clientY - drag.y; paint(); });
    stage.addEventListener("pointerup", function () { drag = null; var i = imgEl(); if (i) i.classList.remove("is-drag"); });
    stage.addEventListener("dblclick", function (e) { if (!imgEl()) return; st.z = st.z > 1.05 ? 1 : 2.5; if (st.z === 1) { st.x = 0; st.y = 0; } paint(); });
    // Pincement tactile
    var pts = {}, startDist = 0, startZ = 1;
    stage.addEventListener("pointerdown", function (e) { pts[e.pointerId] = e; if (Object.keys(pts).length === 2) { var a = Object.values(pts); startDist = Math.hypot(a[0].clientX - a[1].clientX, a[0].clientY - a[1].clientY); startZ = st.z; drag = null; } });
    stage.addEventListener("pointermove", function (e) { if (!pts[e.pointerId]) return; pts[e.pointerId] = e; var a = Object.values(pts); if (a.length === 2 && startDist) { st.z = Math.min(8, Math.max(0.3, startZ * Math.hypot(a[0].clientX - a[1].clientX, a[0].clientY - a[1].clientY) / startDist)); paint(); } });
    ["pointerup", "pointercancel"].forEach(function (n) { stage.addEventListener(n, function (e) { delete pts[e.pointerId]; startDist = 0; }); });
  }
  function tool(icon, label, run, key) { return h("button", { type: "button", class: "mx-iconbtn", "aria-label": label, title: label, "data-pv-tool": key, onclick: run, text: { "z-": "−", "z+": "+", rot: "⟳", fit: "⤢" }[key] }); }
  function btn(label, run) { return h("button", { type: "button", class: "btn btn-outline btn-sm", text: label, onclick: run }); }
  var imgEl = function () { return el && el.querySelector(".mx-pv-img"); };
  function zoom(f) { st.z = Math.min(8, Math.max(0.3, st.z * f)); paint(); }
  function fit() { st.z = 1; st.x = 0; st.y = 0; paint(); }
  function paint() { var i = imgEl(); if (i) i.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.z + ") rotate(" + st.r + "deg)"; }

  function show(i) {
    at = (i + list.length) % list.length; st = { z: 1, x: 0, y: 0, r: 0 };
    var m = list[at], stage = el.querySelector("[data-pv-stage]"), my = ++token;
    stopMedia(); stage.textContent = "";
    el.querySelector("[data-pv-name]").textContent = m.name; el.querySelector("[data-pv-count]").textContent = list.length > 1 ? (at + 1) + " / " + list.length : "";
    var imgTools = m.type === "image"; el.querySelector("[data-pv-tools]").hidden = !imgTools;
    el.querySelector(".is-prev").hidden = el.querySelector(".is-next").hidden = list.length < 2;
    var node;
    if (m.type === "image") {
      node = h("img", { class: "mx-pv-img", alt: m.alt || m.name, draggable: "false", src: m.medium || m.path });
      var big = new Image(); big.onload = function () { if (my === token && node.isConnected) node.src = m.path; }; big.src = m.path; // version d'origine : remplace l'aperçu quand elle est chargée
    } else if (m.type === "video") node = h("video", { class: "mx-pv-media", src: m.path, controls: "", preload: "metadata", playsinline: "" });
    else if (m.type === "audio") node = h("div", { class: "mx-pv-audio" }, [h("span", { class: "mk-ml-badge", text: K.badge(m) }), h("strong", { text: m.name }), h("audio", { src: m.path, controls: "", preload: "metadata" })]);
    else if (m.type === "pdf") node = h("iframe", { class: "mx-pv-pdf", src: m.path, title: "Aperçu du PDF " + m.name });
    else node = h("div", { class: "mx-pv-audio" }, [h("span", { class: "mk-ml-badge", text: K.badge(m) }), h("strong", { text: m.name }), h("p", { class: "field-hint", text: "Pas d'aperçu pour ce format : téléchargez le fichier pour l'ouvrir." })]);
    stage.appendChild(node); paint();
    foot(m, my);
    // Précharger les voisins (images) pour une navigation instantanée
    [at - 1, at + 1].forEach(function (n) { var o = list[(n + list.length) % list.length]; if (o && o.type === "image" && o !== m) { var p = new Image(); p.src = o.medium || o.path; } });
  }
  function foot(m, my) {
    var f = el.querySelector("[data-pv-foot]"); f.textContent = "";
    var base = [K.TYPE_LABELS[m.type] || "Fichier", m.mime, K.fmtSize(m.size), m.width ? m.width + " × " + m.height + " px" : null].filter(Boolean).join(" · ");
    f.appendChild(h("span", { text: base }));
    if (m.type === "image" || m.type === "video" || m.type === "audio") K.detail(m.id).then(function (d) {
      if (my !== token) return;
      var ex = d.exif; if (ex) { var bits = []; if (ex.make || ex.model) bits.push([ex.make, ex.model].filter(Boolean).join(" ")); if (ex.takenAt) bits.push(ex.takenAt); if (ex.fNumber) bits.push("f/" + Math.round(ex.fNumber * 10) / 10); if (ex.exposure) bits.push(ex.exposure < 1 ? "1/" + Math.round(1 / ex.exposure) + " s" : ex.exposure + " s"); if (ex.iso) bits.push("ISO " + ex.iso); if (bits.length) f.appendChild(h("span", { text: bits.join(" · ") })); }
      if (d.media.type === "video" || d.media.type === "audio") { var v = el.querySelector("video, audio"); if (v) v.addEventListener("loadedmetadata", function () { if (my !== token) return; var s = Math.round(v.duration || 0); f.appendChild(h("span", { text: "Durée " + Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2) + (v.videoWidth ? " · " + v.videoWidth + " × " + v.videoHeight + " px" : "") })); }); }
    }, function () { /* informations complémentaires indisponibles */ });
  }
  function stopMedia() { if (!el) return; el.querySelectorAll("video, audio").forEach(function (m) { try { m.pause(); } catch (e) { /* déjà arrêté */ } }); }
  function go(d) { if (list.length > 1) show(at + d); }
  function keys(e) {
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); } else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "+" || e.key === "=") zoom(1.25); else if (e.key === "-") zoom(0.8); else if (e.key === "0") fit(); else if (e.key === "r" || e.key === "R") { st.r = (st.r + 90) % 360; paint(); }
    else if (e.key === "Tab") { var f = el.querySelectorAll("button:not([hidden]), a[href], iframe, video, audio, [tabindex]"); var vis = Array.prototype.filter.call(f, function (n) { return n.offsetParent !== null; }); if (!vis.length) return; var first = vis[0], last = vis[vis.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  function open(items, index) {
    if (!el) build();
    list = items.slice(); opener = document.activeElement; el.hidden = false; document.documentElement.style.overflow = "hidden";
    show(index || 0); el.querySelector(".mx-pv-x").focus();
  }
  function close() { if (!el || el.hidden) return; stopMedia(); el.hidden = true; el.querySelector("[data-pv-stage]").textContent = ""; document.documentElement.style.overflow = ""; if (opener && opener.focus) opener.focus(); }
  window.MXPreview = { open: open, close: close };
})();

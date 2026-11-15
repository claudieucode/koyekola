// KOLAKISA CMS → Médiathèque : visionneuse partagée (panneau d'aperçu rapide ET fenêtre superposée).
// Un seul code pour les deux : image (zoom, déplacement, rotation, pincement), vidéo et audio (lecteurs natifs : lecture/pause, progression, durée, volume), PDF (visionneuse du navigateur :
// pages, zoom, défilement), autres formats (fiche de propriétés + téléchargement). Aucune information inventée : ce que le fichier ne dit pas n'est pas affiché.
// Performance : la grille n'affiche que des miniatures ; ici l'image « moyenne » sert d'aperçu et l'ORIGINAL n'est chargé qu'à la demande (zoom, taille réelle, ou fenêtre plein écran) ;
// vidéo et audio ne chargent que leurs métadonnées (preload="metadata") ; le PDF n'est chargé que lorsqu'il est affiché. À chaque changement de fichier et à la fermeture, les lecteurs
// sont arrêtés et leur source vidée, les images en attente sont abandonnées : aucune lecture ni aucun téléchargement ne continue en arrière-plan.
(function () {
  "use strict";
  var MX = window.MX; if (!MX) return;
  var h = MX.h, K = MX.K;

  // Cache des informations détaillées (EXIF, utilisation) : borné, pour ne pas redemander le même fichier en parcourant la liste
  var detailCache = new Map();
  function detail(id) {
    if (detailCache.has(id)) { var v = detailCache.get(id); detailCache.delete(id); detailCache.set(id, v); return v; }
    var p = K.detail(id).then(function (d) { return d; }, function (e) { detailCache.delete(id); throw e; });
    detailCache.set(id, p); if (detailCache.size > 40) detailCache.delete(detailCache.keys().next().value);
    return p;
  }
  // Images voisines préchargées (taille « moyenne » seulement), bornées
  var warm = [];
  function preload(m) {
    if (!m || m.type !== "image") return;
    var src = m.medium || m.path; if (!src || warm.some(function (w) { return w.s === src; })) return;
    var im = new Image(); im.decoding = "async"; im.src = src; warm.push({ s: src, i: im }); if (warm.length > 8) { var old = warm.shift(); old.i.src = ""; }
  }
  var fmtDur = function (s) { s = Math.round(s); var hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60; return (hh ? hh + ":" + (mm < 10 ? "0" : "") : "") + mm + ":" + (ss < 10 ? "0" : "") + ss; };

  function create(stage, o) {
    o = o || {};
    var st = { z: 1, x: 0, y: 0, r: 0 }, cur = null, token = 0, drag = null, full = false, ac = new AbortController(), pts = {}, startDist = 0, startZ = 1;
    var img = function () { return stage.querySelector(".mx-pv-img"); };
    function paint() { var i = img(); if (i) i.style.transform = "translate(" + st.x + "px," + st.y + "px) scale(" + st.z + ") rotate(" + st.r + "deg)"; }
    function ensureFull() {
      var i = img(); if (!i || full || !cur) return; full = true;
      if (!cur.medium || cur.medium === cur.path) return;
      var my = token, big = new Image(); big.decoding = "async";
      big.onload = function () { if (my === token && i.isConnected) i.src = cur.path; }; big.src = cur.path;
    }
    function zoom(f) { st.z = Math.min(8, Math.max(0.3, st.z * f)); if (st.z > 1.15) ensureFull(); paint(); }
    function fit() { st.z = 1; st.x = 0; st.y = 0; paint(); }
    function rotate() { st.r = (st.r + 90) % 360; paint(); }
    function actual() { ensureFull(); var i = img(); if (i && i.naturalWidth) { var f = i.naturalWidth / Math.max(1, i.clientWidth); st.z = Math.min(8, Math.max(1, f)); st.x = 0; st.y = 0; paint(); } }
    function stopMedia() {
      stage.querySelectorAll("video, audio").forEach(function (m) { try { m.pause(); } catch (e) { /* déjà arrêté */ } m.removeAttribute("src"); try { m.load(); } catch (e2) { /* rien à libérer */ } });
      stage.querySelectorAll("iframe").forEach(function (f) { f.src = "about:blank"; });
      stage.querySelectorAll("img").forEach(function (im) { im.removeAttribute("src"); });
    }
    function clear() { token++; stopMedia(); stage.textContent = ""; cur = null; full = false; st = { z: 1, x: 0, y: 0, r: 0 }; }
    function card(m, text, extra) {
      return h("div", { class: "mx-pv-audio" }, [h("span", { class: "mk-ml-badge", text: MX.K.badge(m) }), h("strong", { text: m.name }), text ? h("p", { class: "field-hint", text: text }) : null].concat(extra || []));
    }
    function show(m) {
      clear(); cur = m; var my = token, node;
      st = { z: 1, x: 0, y: 0, r: 0 }; full = false;
      if (m.type === "image") {
        node = h("img", { class: "mx-pv-img", alt: m.alt || m.name, draggable: "false", decoding: "async", src: o.eager ? m.path : (m.medium || m.path) });
        if (o.eager) { full = true; } else { /* version moyenne : l'original ne vient qu'au zoom */ }
        node.addEventListener("load", function () { if (my === token && o.onMeta) o.onMeta({ width: node.naturalWidth, height: node.naturalHeight }); });
        if (o.eager && m.medium && m.medium !== m.path) { node.src = m.medium; full = false; var big = new Image(); big.decoding = "async"; big.onload = function () { if (my === token && node.isConnected) { node.src = m.path; full = true; } }; big.src = m.path; }
      } else if (m.type === "video") {
        node = h("video", { class: "mx-pv-media", src: m.path, controls: "", preload: "metadata", playsinline: "", "aria-label": "Lecteur vidéo : " + m.name });
        node.addEventListener("loadedmetadata", function () { if (my === token && o.onMeta) o.onMeta({ duration: node.duration, width: node.videoWidth, height: node.videoHeight }); });
      } else if (m.type === "audio") {
        var au = h("audio", { src: m.path, controls: "", preload: "metadata", "aria-label": "Lecteur audio : " + m.name });
        au.addEventListener("loadedmetadata", function () { if (my === token && o.onMeta) o.onMeta({ duration: au.duration }); });
        node = h("div", { class: "mx-pv-audio" }, [h("span", { class: "mk-ml-badge", text: K.badge(m) }), h("strong", { text: m.name }), au]);
      } else if (m.type === "pdf") {
        node = h("iframe", { class: "mx-pv-pdf", src: m.path + "#toolbar=1&navpanes=0", title: "Aperçu du PDF " + m.name });
      } else node = card(m, "Pas d'aperçu pour ce format : consultez ses propriétés ou téléchargez le fichier.");
      stage.appendChild(node); paint();
      stage.setAttribute("data-kind", m.type);
    }
    // Interactions image (molette, glisser, double-clic, pincement) : posées une fois sur la scène, retirées à la destruction
    var sig = { signal: ac.signal };
    stage.addEventListener("wheel", function (e) { if (!img() || !(e.ctrlKey || e.metaKey || o.wheelZoom)) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 0.89); }, { passive: false, signal: ac.signal });
    stage.addEventListener("pointerdown", function (e) {
      var i = img(); if (!i || e.button !== 0) return; pts[e.pointerId] = e;
      if (Object.keys(pts).length === 2) { var a = Object.values(pts); startDist = Math.hypot(a[0].clientX - a[1].clientX, a[0].clientY - a[1].clientY); startZ = st.z; drag = null; return; }
      if (st.z <= 1.01 && !o.panAlways) return;
      drag = { x: e.clientX - st.x, y: e.clientY - st.y }; try { stage.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ } i.classList.add("is-drag");
    }, sig);
    stage.addEventListener("pointermove", function (e) {
      if (pts[e.pointerId]) pts[e.pointerId] = e;
      var a = Object.values(pts); if (a.length === 2 && startDist) { st.z = Math.min(8, Math.max(0.3, startZ * Math.hypot(a[0].clientX - a[1].clientX, a[0].clientY - a[1].clientY) / startDist)); if (st.z > 1.15) ensureFull(); paint(); return; }
      if (!drag) return; st.x = e.clientX - drag.x; st.y = e.clientY - drag.y; paint();
    }, sig);
    ["pointerup", "pointercancel"].forEach(function (n) { stage.addEventListener(n, function (e) { delete pts[e.pointerId]; startDist = 0; drag = null; var i = img(); if (i) i.classList.remove("is-drag"); }, sig); });
    stage.addEventListener("dblclick", function (e) { if (!img()) return; e.stopPropagation(); if (st.z > 1.05) fit(); else { st.z = 2.5; ensureFull(); paint(); } }, sig);
    function destroy() { clear(); ac.abort(); }
    return { show: show, zoom: zoom, fit: fit, rotate: rotate, actual: actual, clear: clear, destroy: destroy, hasImage: function () { return Boolean(img()); }, current: function () { return cur; }, state: function () { return st; } };
  }
  window.MXViewer = { create: create, detail: detail, preload: preload, fmtDur: fmtDur };
})();

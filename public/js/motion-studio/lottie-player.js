// Motion Studio — module « lottie-player » : lecteur Lottie / dotLottie. Rendu par public/js/vendor/lottie_light.min.js (SVG, sans expressions), chargé à la demande.
//   .json    : lu tel quel.
//   .lottie  : archive ZIP lue ICI, sans bibliothèque : annuaire central du ZIP + DecompressionStream("deflate-raw") du navigateur (Chrome 80+, Safari 16.4+, Firefox 113+).
//              Une animation (la première du manifest) et ses images (converties en data:) sont extraites ; si le navigateur ne sait pas décompresser, l'état « error » est posé et l'image d'attente reste.
// Déclencheurs : ceux du runtime (viewport, load, click, hover, scroll). « scroll » = animation pilotée par le défilement (position = progression). Mouvement réduit : première image, sans lecture.
// Les fichiers ont été contrôlés à l'envoi (src/marketing/media/lottie.js) ; ce module ne fait que les lire.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.KWMS) root.KWMS.register("lottie-player", api.init);
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var num = function (v, d, a, b) { var n = Number(v); return isFinite(n) && v !== "" && v !== null && v !== undefined ? clamp(n, a, b) : d; };

  // Segment lu dans les réglages : [début, fin] en images, borné à la durée réelle ; fin 0 = jusqu'à la fin ; début ≥ fin → toute l'animation
  function segment(params, total) {
    var p = params || {}, t = Math.max(1, Math.floor(Number(total) || 1));
    var s = clamp(Math.floor(num(p.segStart, 0, 0, 36000)), 0, t - 1), e = Math.floor(num(p.segEnd, 0, 0, 36000));
    if (!e || e > t) e = t;
    if (s >= e) { s = 0; e = t; }
    return [s, e];
  }
  // Progression du défilement (0–1) → image
  function frameAt(progress, seg) { return Math.round(seg[0] + clamp(progress, 0, 1) * (seg[1] - seg[0] - 1)); }

  // ---------- dotLottie ----------
  function u16(b, i) { return b[i] | (b[i + 1] << 8); }
  function u32(b, i) { return (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0; }
  // Annuaire central d'un ZIP : [{ name, method, csize, usize, local }]
  function readZip(b) {
    var eocd = -1, i;
    for (i = b.length - 22; i >= Math.max(0, b.length - 22 - 65535); i--) if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error("zip");
    var count = u16(b, eocd + 10), p = u32(b, eocd + 16), out = [];
    if (count > 200) throw new Error("zip");
    for (var n = 0; n < count; n++) {
      if (u32(b, p) !== 0x02014b50) throw new Error("zip");
      var nl = u16(b, p + 28), xl = u16(b, p + 30), cl = u16(b, p + 32), name = "";
      for (i = 0; i < nl; i++) name += String.fromCharCode(b[p + 46 + i]);
      out.push({ name: name, method: u16(b, p + 10), csize: u32(b, p + 20), usize: u32(b, p + 24), local: u32(b, p + 42) });
      p += 46 + nl + xl + cl;
    }
    return out;
  }
  function rawOf(b, e) {
    if (u32(b, e.local) !== 0x04034b50) throw new Error("zip");
    var start = e.local + 30 + u16(b, e.local + 26) + u16(b, e.local + 28);
    return b.subarray(start, start + e.csize);
  }
  function inflate(raw, limit) {
    if (typeof DecompressionStream === "undefined") return Promise.reject(new Error("decompression"));
    var stream = new Blob([raw]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).arrayBuffer().then(function (ab) { if (ab.byteLength > limit) throw new Error("taille"); return new Uint8Array(ab); });
  }
  function bytesOf(b, e) { return e.method === 0 ? Promise.resolve(rawOf(b, e)) : inflate(rawOf(b, e), 8 * 1024 * 1024); }
  function mimeOf(name) { return /\.png$/i.test(name) ? "image/png" : /\.jpe?g$/i.test(name) ? "image/jpeg" : /\.webp$/i.test(name) ? "image/webp" : "image/gif"; }
  function base64(u8) { var s = "", step = 0x8000; for (var i = 0; i < u8.length; i += step) s += String.fromCharCode.apply(null, u8.subarray(i, i + step)); return btoa(s); }
  var text = function (u8) { return new TextDecoder("utf-8").decode(u8); };

  // Archive .lottie (ArrayBuffer) → objet d'animation Lottie (images converties en data:)
  function unzipLottie(buffer) {
    var b = new Uint8Array(buffer), entries = readZip(b), by = {};
    entries.forEach(function (e) { by[e.name] = e; });
    if (!by["manifest.json"]) return Promise.reject(new Error("manifest"));
    return bytesOf(b, by["manifest.json"]).then(function (m) {
      var manifest = JSON.parse(text(m)), list = manifest.animations || [], first = (manifest.initial && manifest.initial.animation) || (list[0] && list[0].id);
      var e = by["animations/" + first + ".json"] || by["a/" + first + ".json"];
      if (!e) throw new Error("animation");
      return bytesOf(b, e).then(function (u8) {
        var data = JSON.parse(text(u8)), jobs = [];
        (data.assets || []).forEach(function (a) {
          if (!a || typeof a.p !== "string" || a.layers || /^data:/.test(a.p)) return;
          var file = (String(a.u || "").replace(/^\/+/, "") + a.p), base = file.split("/").pop();
          var ie = by["images/" + base] || by["i/" + base];
          if (!ie) return;
          jobs.push(bytesOf(b, ie).then(function (img) { a.u = ""; a.p = "data:" + mimeOf(base) + ";base64," + base64(img); a.e = 1; }));
        });
        return Promise.all(jobs).then(function () { return data; });
      });
    });
  }
  function fetchAnimation(win, src) {
    return win.fetch(src, { credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("http");
      return /\.lottie(\?|$)/i.test(src) ? r.arrayBuffer().then(unzipLottie) : r.json();
    });
  }

  var loading = null;
  function library(win, doc) {
    if (win.lottie) return Promise.resolve(win.lottie);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var s = doc.createElement("script"); s.src = "/js/vendor/lottie_light.min.js"; s.async = true;
      s.onload = function () { win.lottie ? resolve(win.lottie) : reject(new Error("lottie")); }; s.onerror = function () { reject(new Error("lottie")); };
      doc.head.appendChild(s);
    });
    loading.catch(function () { loading = null; });
    return loading;
  }

  function init(ctx) {
    var el = ctx.el, win = ctx.win, doc = ctx.doc, stage = el.querySelector(".kw-ms-lt-stage"), src = ctx.opts && ctx.opts.src;
    if (!stage || !src || !/^\/uploads\/marketing\//.test(src)) return {};
    var p = ctx.cfg.params || {}, speed = num(p.speed, 1, 0.25, 4), loop = p.loop === true, reverse = p.reverse === true;
    var anim = null, loaded = null, seg = null, btn = null, userPaused = false, disposed = false, wantRun = false;
    var setState = function (s) { stage.setAttribute("data-kw-lt", s); };
    // Représentant du temps pour le runtime (déclencheur « scroll » : seek(ms) avec ms de 0 à 1000)
    if (!ctx.reduced) ctx.animate(stage, [{ opacity: 1 }, { opacity: 1 }], { duration: 1000, noBaseDelay: true });

    function load() {
      if (loaded) return loaded;
      loaded = Promise.all([library(win, doc), fetchAnimation(win, src)]).then(function (r) {
        if (disposed) return null;
        var poster = stage.querySelector(".kw-ms-lt-poster");
        anim = r[0].loadAnimation({ container: stage, renderer: "svg", loop: false, autoplay: false, animationData: r[1], rendererSettings: { preserveAspectRatio: "xMidYMid meet" } });
        seg = segment(p, anim.totalFrames || 1);
        anim.setSpeed(speed);
        anim.addEventListener("complete", function () { if (!userPaused) setState("finished"); });
        anim.goToAndStop(reverse && ctx.reduced === false ? seg[1] - 1 : seg[0], true);
        if (poster && poster.parentNode) poster.parentNode.removeChild(poster);
        setState("ready");
        return anim;
      }).catch(function () { setState("error"); return null; });
      return loaded;
    }
    function startPlayback() {
      if (!anim || disposed) return;
      userPaused = false; labelBtn();
      anim.loop = loop;
      anim.setSpeed(speed);
      anim.playSegments(reverse ? [seg[1], seg[0]] : [seg[0], seg[1]], true);
      setState("playing");
    }
    function labelBtn() { if (!btn) return; btn.setAttribute("aria-pressed", String(userPaused)); btn.textContent = userPaused ? "Reprendre l'animation" : "Pause de l'animation"; }
    function makeButton() {
      if (btn || ctx.reduced || ctx.mode === "editor" || !loop || p.pausable === false) return;
      btn = doc.createElement("button"); btn.type = "button"; btn.className = "kw-ms-lt-pause"; btn.setAttribute("aria-label", "Mettre en pause ou reprendre l'animation");
      btn.addEventListener("click", function () {
        if (!anim) return;
        userPaused = !userPaused; labelBtn();
        if (userPaused) { anim.pause(); setState("paused"); } else { anim.play(); setState("playing"); }
      });
      labelBtn(); el.appendChild(btn);
    }
    // Chargement : dès que le bloc approche de l'écran (la bibliothèque et le fichier ne sont pas demandés pour une animation lointaine) ; tout de suite en éditeur / mouvement réduit
    var io = null;
    if (ctx.cfg.trigger === "load" || ctx.mode === "editor" || ctx.reduced || !win.IntersectionObserver) load();
    else { io = new win.IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); load(); } }); }, { rootMargin: "300px" }); io.observe(el); }
    ctx.onCleanup(function () { disposed = true; if (io) io.disconnect(); if (anim) { try { anim.destroy(); } catch (e) { /* déjà détruite */ } } if (btn && btn.parentNode) btn.parentNode.removeChild(btn); });

    return {
      // Appelé par le runtime au déclencheur (arrivée à l'écran, chargement, clic, survol) et par « Lire » dans l'éditeur
      play: function () {
        if (ctx.reduced) return;
        wantRun = true;
        load().then(function (a) { if (a && wantRun) { makeButton(); startPlayback(); } });
      },
      pause: function () { if (anim) { anim.pause(); setState("paused"); } },
      // Déclencheur « défilement » : ms de 0 à 1000 → image
      seek: function (ms) { load().then(function (a) { if (a) { anim.goToAndStop(frameAt(clamp(ms / 1000, 0, 1), seg), true); setState("scrub"); } }); },
    };
  }
  return { segment: segment, frameAt: frameAt, readZip: readZip, unzipLottie: unzipLottie, init: init };
});

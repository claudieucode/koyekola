/* KOLAKISA CMS → Médias : interactions de l'écran. Le serveur reste l'unique juge (validation et enregistrement) ; ce script ajoute l'aperçu des proportions
   (mêmes règles que le moteur média : boîte maximale, recadrage centré, jamais d'agrandissement), la validation à la saisie, la détection des modifications non
   enregistrées et la protection contre la double soumission. Sans lui, le formulaire fonctionne (envoi classique). */
(function () {
  "use strict";
  var form = document.querySelector("[data-md-form]");
  if (!form) return;
  var data = {};
  try { data = JSON.parse((document.getElementById("md-data") || {}).textContent || "{}"); } catch (e) { data = {}; }
  var cfg = data.config || {};
  var $$ = function (s, r) { return Array.prototype.slice.call((r || form).querySelectorAll(s)); };
  var status = form.querySelector("[data-md-status]");
  var saveBtn = form.querySelector("[data-md-save]");
  var readonly = form.hasAttribute("data-md-readonly");
  var MIN = data.min || 16, MAX = data.maxPx || 4000;
  var SAMPLES = { landscape: [4000, 3000], portrait: [3000, 4000], square: [3000, 3000] };
  var busy = false, valid = true;

  function field(name) { return form.elements[name]; }
  function num(name) { var el = field(name); var raw = el ? String(el.value).trim() : ""; return /^-?\d+$/.test(raw) ? Number(raw) : null; }
  function bool(name) { var el = field(name); return Boolean(el && el.checked); }
  function snapshot() { return JSON.stringify($$("[data-md-num]").map(function (el) { return el.type === "checkbox" ? el.checked : el.value; })); }
  var initial = JSON.stringify(["thumb_w", "thumb_h", "thumb_crop", "medium_w", "medium_h", "large_w", "large_h", "organize"].map(function (k) { return k === "thumb_crop" || k === "organize" ? Boolean(cfg[k]) : String(cfg[k]); }));
  // L'ordre de snapshot() suit celui du DOM ; on recale la référence sur l'état affiché au chargement SI le serveur n'a pas renvoyé une saisie refusée
  var serverForm = !document.querySelector(".mk-flash-error");
  if (serverForm) initial = snapshot();

  /* ---- Règles du moteur média, côté aperçu ---- */
  function fit(sw, sh, w, h, crop) {
    if (crop) {
      if (sw < w || sh < h) return { w: sw, h: sh, original: true, note: "Image plus petite que la cible : l'original est servi (jamais agrandi)." };
      return { w: w, h: h, note: "Recadrage centré aux dimensions exactes." };
    }
    if (sw <= w && (!h || sh <= h)) return { w: sw, h: sh, original: true, note: "Image déjà dans les limites : l'original est servi." };
    var scale = Math.min(w / sw, h ? h / sh : Infinity);
    return { w: Math.max(1, Math.round(sw * scale)), h: Math.max(1, Math.round(sh * scale)), note: "Proportions conservées." };
  }
  function sizes() {
    return {
      thumb: { w: num("thumb_w"), h: num("thumb_h"), crop: bool("thumb_crop") },
      medium: { w: num("medium_w"), h: num("medium_h"), crop: false },
      large: { w: num("large_w"), h: num("large_h"), crop: false },
    };
  }
  function orientation() { var r = form.querySelector('input[name="md_orient"]:checked'); return SAMPLES[r ? r.value : "landscape"]; }
  function renderPreview() {
    var s = sizes(), o = orientation();
    var all = ["thumb", "medium", "large"].map(function (k) { var v = s[k]; return v.w ? fit(o[0], o[1], v.w, v.h || 0, v.crop && v.h) : null; });
    var maxW = Math.max.apply(null, all.map(function (r) { return r ? r.w : 1; }).concat([1]));
    $$("[data-md-tile]").forEach(function (tile, i) {
      var r = all[i], img = tile.querySelector("[data-md-img]"), out = tile.querySelector("[data-md-out]"), note = tile.querySelector("[data-md-note]");
      if (!r) { out.textContent = "—"; note.textContent = ""; return; }
      // Cadre de hauteur fixe ; l'image y est dessinée à l'échelle commune (mêmes proportions que les dimensions réelles)
      var scale = 100 / Math.max(maxW, r.h > r.w ? r.h * (maxW / Math.max(r.w, r.h)) : maxW);
      var wPct = Math.max(8, Math.min(100, (r.w / maxW) * 100));
      var ratio = r.w / r.h;
      img.style.width = wPct + "%";
      img.style.aspectRatio = ratio.toFixed(4);
      img.classList.toggle("is-original", Boolean(r.original));
      out.textContent = r.w + " × " + r.h + " px";
      note.textContent = r.note;
      void scale;
    });
  }

  /* ---- Validation à la saisie (le serveur revalide tout) ---- */
  function validateAll() {
    var errs = { thumb: [], medium: [], large: [] };
    var s = sizes();
    ["thumb", "medium", "large"].forEach(function (k) {
      var v = s[k];
      if (v.w === null || v.w < MIN || v.w > MAX) errs[k].push("Largeur : de " + MIN + " à " + MAX + " px.");
      if (v.h === null || (v.h !== 0 && (v.h < MIN || v.h > MAX))) errs[k].push("Hauteur : 0 (libre) ou de " + MIN + " à " + MAX + " px.");
    });
    if (s.thumb.crop && !s.thumb.h) errs.thumb.push("Le recadrage exige une hauteur.");
    if (!errs.medium.length && !errs.large.length && s.medium.w > s.large.w) errs.medium.push("La taille moyenne ne peut pas dépasser la grande taille en largeur.");
    valid = !errs.thumb.length && !errs.medium.length && !errs.large.length;
    $$("[data-md-msg]").forEach(function (el) { var k = el.getAttribute("data-md-msg"); el.textContent = errs[k].join(" "); el.classList.toggle("is-bad", errs[k].length > 0); });
    $$("input[type=number][data-md-num]").forEach(function (el) {
      var k = el.name.split("_")[0]; el.setAttribute("aria-invalid", errs[k] && errs[k].length ? "true" : "false");
    });
  }

  function setStatus(text, cls) { if (status) { status.textContent = text; status.className = "pl-status" + (cls ? " " + cls : ""); } }
  function refreshState() {
    var dirty = snapshot() !== initial;
    form.classList.toggle("is-dirty", dirty);
    if (saveBtn) saveBtn.disabled = !dirty || !valid || busy;
    if (readonly) return;
    if (busy) setStatus("Enregistrement…", "is-busy");
    else if (!valid) setStatus("Corrigez les dimensions pour pouvoir enregistrer.", "is-bad");
    else if (dirty) setStatus("Modifications non enregistrées.", "is-dirty");
    else setStatus("Aucune modification.", "");
  }
  function changed() { validateAll(); renderPreview(); refreshState(); }

  $$("[data-md-num], input[name=md_orient]").forEach(function (el) { el.addEventListener("input", changed); el.addEventListener("change", changed); });
  var limits = $$("input[name^=media_max_]"); limits.forEach(function (el) { el.addEventListener("input", refreshState); });

  form.addEventListener("submit", function (e) {
    if (busy) { e.preventDefault(); return; }
    if (!valid) { e.preventDefault(); var bad = form.querySelector('[aria-invalid="true"]'); if (bad) bad.focus(); return; }
    busy = true;
    form.setAttribute("aria-busy", "true");
    if (saveBtn) { saveBtn.disabled = true; var l = saveBtn.querySelector(".md-save-label"); if (l) l.textContent = "Enregistrement…"; }
    setStatus("Enregistrement…", "is-busy");
    initial = snapshot();
  });
  window.addEventListener("beforeunload", function (e) { if (!busy && snapshot() !== initial) { e.preventDefault(); e.returnValue = ""; } });

  validateAll(); renderPreview(); refreshState();
})();

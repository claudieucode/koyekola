/* KOLAKISA CMS → Permaliens : interactions de l'écran. Le serveur reste l'unique juge (validation, impact, enregistrement) ; ce script ajoute
   l'insertion des balises à la position du curseur, l'aperçu instantané, la validation à la volée (aperçu serveur, sans écriture), la détection des
   modifications non enregistrées et la protection contre la double soumission. Sans lui, le formulaire fonctionne (envoi classique). */
(function () {
  "use strict";
  var form = document.querySelector("[data-pl-form]");
  if (!form) return;
  var dataEl = document.getElementById("pl-data");
  var data = {};
  try { data = JSON.parse(dataEl ? dataEl.textContent : "{}"); } catch (e) { data = {}; }
  var $ = function (s, r) { return (r || form).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || form).querySelectorAll(s)); };
  var input = $("[data-pl-input]");
  var customRadio = $("[data-pl-custom-radio]");
  var msg = $("[data-pl-msg]");
  var status = $("[data-pl-status]");
  var saveBtn = $("[data-pl-save]");
  var impactBox = document.getElementById("pl-impact");
  var impactBody = impactBox && impactBox.querySelector("[data-pl-impact-body]");
  var prefixMsg = $("[data-pl-prefix-msg]");
  var readonly = form.hasAttribute("data-pl-readonly");
  var PLAIN = "?p=%post_id%";
  var DEFAULT = "/blog/%postname%";
  var sample = data.sample || {};
  var hostLabel = (data.base || "").replace(/^https?:\/\//, "");
  // État de référence : la configuration ENREGISTRÉE (pas les valeurs affichées, qui peuvent venir d'un envoi refusé par le serveur)
  var cur = data.current || {};
  var initial = JSON.stringify({ p: data.preset || "", s: cur.structure || "", c: cur.categoryBase || "", t: cur.tagBase || "", n: data.normalize === undefined ? null : data.normalize });
  var valid = true, busy = false, timer = null, seq = 0;

  function snapshot() {
    var r = form.querySelector('input[name="preset"]:checked');
    return JSON.stringify({ p: r ? r.value : "", s: input ? input.value : "", c: val("category_base"), t: val("tag_base"), n: normValue() });
  }
  function val(n) { var el = form.elements[n]; return el ? el.value : ""; }
  function normValue() { var el = form.elements.normalize_paths; return el ? el.checked : null; }
  function currentStructure() {
    var r = form.querySelector('input[name="preset"]:checked');
    if (!r) return input ? input.value : "";
    if (r.value === "custom") return input ? input.value : "";
    return r.getAttribute("data-pl-structure");
  }

  /* ---- Aperçu instantané (mêmes règles de construction que le moteur ; la validité vient du serveur) ---- */
  function parts(date) {
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?/.exec(String(date || ""));
    var now = new Date();
    var p = function (n) { return String(n).padStart(2, "0"); };
    if (!m) return { year: String(now.getUTCFullYear()), monthnum: p(now.getUTCMonth() + 1), day: p(now.getUTCDate()), hour: p(now.getUTCHours()), minute: p(now.getUTCMinutes()), second: p(now.getUTCSeconds()) };
    return { year: m[1], monthnum: m[2], day: m[3], hour: m[4] || "00", minute: m[5] || "00", second: m[6] || "00" };
  }
  function build(structure) {
    if (structure === PLAIN) return "/?p=" + sample.id;
    var d = parts(sample.date);
    return structure.replace(/%([a-z_]+)%/g, function (all, t) {
      if (d[t] !== undefined) return d[t];
      if (t === "post_id") return String(sample.id);
      if (t === "postname") return sample.slug;
      if (t === "category") return sample.category;
      if (t === "author") return sample.author;
      return all;
    }).replace(/\/{2,}/g, "/");
  }
  function renderBar(path) {
    var host = $("[data-pl-host]"), pEl = $("[data-pl-path]"), sEl = $("[data-pl-slug]");
    if (!host || !pEl || !sEl) return;
    var q = path.indexOf("?");
    var plain = q === 0 || path.indexOf("/?") === 0;
    if (plain) { pEl.textContent = "/"; sEl.textContent = path.slice(path.indexOf("?")); return; }
    var trail = /\/$/.test(path);
    var segs = path.split("/").filter(Boolean);
    var slug = segs.length ? segs.pop() : "";
    pEl.textContent = segs.length ? "/" + segs.join("/") + "/" : "/";
    sEl.textContent = slug + (trail ? "/" : "");
  }
  function refreshPreview() {
    var s = currentStructure();
    var path = /%[a-z_]+%/.test(s) || s === PLAIN ? build(s.charAt(0) === "/" || s === PLAIN ? s : "/" + s) : "";
    if (path) renderBar(path);
    var cat = (val("category_base") || "").replace(/^\/+|\/+$/g, "") || (data.defaults ? data.defaults.category.replace(/^\//, "") : "");
    var tag = (val("tag_base") || "").replace(/^\/+|\/+$/g, "") || (data.defaults ? data.defaults.tag.replace(/^\//, "") : "");
    var c = $('[data-pl-prefix-preview="category"]'), t = $('[data-pl-prefix-preview="tag"]');
    if (c) c.textContent = hostLabel + "/" + cat + "/actualites";
    if (t) t.textContent = hostLabel + "/" + tag + "/innovation";
    $$("[data-pl-opt]").forEach(function (o) { var r = o.querySelector('input[type="radio"]'); o.classList.toggle("is-on", Boolean(r && r.checked)); });
  }

  /* ---- État : modifications non enregistrées, validité, bouton ---- */
  function setStatus(text, cls) { if (status) { status.textContent = text; status.className = "pl-status" + (cls ? " " + cls : ""); } }
  function refreshState() {
    var dirty = snapshot() !== initial;
    form.classList.toggle("is-dirty", dirty);
    if (saveBtn) saveBtn.disabled = !dirty || !valid || busy;
    if (readonly) return;
    if (busy) setStatus("Enregistrement…", "is-busy");
    else if (!valid) setStatus("Corrigez la structure pour pouvoir enregistrer.", "is-bad");
    else if (dirty) setStatus("Modifications non enregistrées.", "is-dirty");
    else setStatus("Aucune modification.", "");
  }

  /* ---- Validation et impact : aperçu serveur (aucune écriture), débouché 250 ms ---- */
  function showMessages(r) {
    var errs = (r && r.errors) || [];
    var onStructure = errs.filter(function (e) { return !/^Préfixe/.test(e); });
    var onPrefix = errs.filter(function (e) { return /^Préfixe/.test(e); });
    if (msg) { msg.textContent = onStructure.join(" "); msg.classList.toggle("is-bad", onStructure.length > 0); }
    if (input) input.setAttribute("aria-invalid", onStructure.length ? "true" : "false");
    if (prefixMsg) { prefixMsg.textContent = onPrefix.join(" "); prefixMsg.classList.toggle("is-bad", onPrefix.length > 0); }
    ["category_base", "tag_base"].forEach(function (n) { var el = form.elements[n]; if (el) el.setAttribute("aria-invalid", onPrefix.some(function (e) { return e.indexOf(n === "category_base" ? "catégories" : "étiquettes") >= 0; }) ? "true" : "false"); });
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function showImpact(r) {
    if (!impactBox || !impactBody) return;
    var im = r && r.impact;
    var warns = (r && r.warnings) || [];
    if (!im) { impactBox.hidden = true; return; }
    var html = "<p>" + im.changed + " article" + (im.changed > 1 ? "s" : "") + " publié" + (im.changed > 1 ? "s" : "") + " sur " + im.total + " change" + (im.changed > 1 ? "nt" : "") + " d'adresse.";
    if (im.changed) html += " Les anciennes adresses (<code>/blog/…</code>, l'ancienne structure et <code>/?p=…</code>) redirigent automatiquement en 301 vers la nouvelle : aucun lien partagé n'est perdu, sans chaîne ni boucle.";
    html += "</p>";
    if (im.examples && im.examples.length) html += '<ul class="pl-ex">' + im.examples.map(function (e) { return '<li><span class="pl-ex-title">' + esc(e.title) + "</span><code>" + esc(e.before) + '</code> <span aria-hidden="true">→</span><span class="sr-only">devient</span> <code>' + esc(e.after) + "</code></li>"; }).join("") + "</ul>";
    if (im.collisions) html += '<p class="pl-warn">' + im.collisions + " article" + (im.collisions > 1 ? "s" : "") + " garde" + (im.collisions > 1 ? "nt" : "") + " l'adresse <code>/blog/…</code> : leur titre entrerait en conflit avec une route du site ou une page.</p>";
    if (warns.length) html += '<ul class="pl-warns">' + warns.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>";
    impactBody.innerHTML = html;
    impactBox.hidden = snapshot() === initial;
  }
  function validate() {
    var url = form.getAttribute("data-pl-url");
    if (!url || readonly) return;
    var my = ++seq;
    var body = JSON.stringify({ structure: currentStructure(), category_base: val("category_base"), tag_base: val("tag_base") });
    fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: body })
      .then(function (r) { return r.json().catch(function () { return null; }); })
      .then(function (r) {
        if (my !== seq || !r) return;
        valid = Boolean(r.ok);
        showMessages(r);
        showImpact(r);
        if (r.ok && r.example) renderBar(r.example);
        refreshState();
      })
      .catch(function () { /* hors ligne : l'enregistrement revalidera côté serveur */ });
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(validate, 250); }
  function changed() { refreshPreview(); refreshState(); schedule(); }

  /* ---- Insertion d'une balise à la position du curseur ---- */
  $$("[data-pl-tag]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!input || readonly) return;
      if (customRadio && !customRadio.checked) {
        // Passer en « personnalisée » en reprenant la structure affichée comme point de départ
        var cur = currentStructure();
        input.value = cur === PLAIN ? "/" : cur;
        customRadio.checked = true;
      }
      var token = "%" + btn.getAttribute("data-pl-tag") + "%";
      var start = input.selectionStart == null ? input.value.length : input.selectionStart;
      var end = input.selectionEnd == null ? start : input.selectionEnd;
      var v = input.value;
      // Curseur à l'intérieur d'une balise existante : on insère après elle (jamais au milieu, ce qui la casserait)
      var re = /%[a-z_]*%/g, hit;
      while ((hit = re.exec(v))) { if (start > hit.index && start < hit.index + hit[0].length) { start = hit.index + hit[0].length; end = start; break; } }
      // Un séparateur est ajouté si la balise suivrait directement une autre balise (« %year%%monthnum% » serait ambigu)
      var before = v.slice(0, start), after = v.slice(end);
      var glue = /%$/.test(before) ? "/" : "";
      var glue2 = /^%/.test(after) ? "/" : "";
      input.value = before + glue + token + glue2 + after;
      var pos = (before + glue + token).length;
      input.focus();
      try { input.setSelectionRange(pos, pos); } catch (e) { /* champ non sélectionnable */ }
      btn.classList.add("is-pulse");
      setTimeout(function () { btn.classList.remove("is-pulse"); }, 260);
      changed();
    });
  });

  /* ---- Choix d'une structure courante / saisie libre ---- */
  $$('input[name="preset"]').forEach(function (r) {
    r.addEventListener("change", function () {
      if (r.value !== "custom" && input) input.value = r.getAttribute("data-pl-structure");
      changed();
    });
  });
  if (input) {
    input.addEventListener("input", function () { if (customRadio && !customRadio.checked) customRadio.checked = true; changed(); });
    input.addEventListener("focus", function () { if (customRadio && !customRadio.checked) { customRadio.checked = true; changed(); } });
  }
  ["category_base", "tag_base", "normalize_paths"].forEach(function (n) { var el = form.elements[n]; if (el) { el.addEventListener("input", changed); el.addEventListener("change", changed); } });

  /* ---- Copier l'adresse d'exemple ---- */
  var copy = $("[data-pl-copy]");
  if (copy) copy.addEventListener("click", function () {
    var text = hostLabel ? (data.base || "") + ($("[data-pl-path]").textContent + $("[data-pl-slug]").textContent) : "";
    var done = function (ok) { var l = copy.querySelector(".pl-copy-label"); if (l) { l.textContent = ok ? "Copié" : "Non copié"; setTimeout(function () { l.textContent = "Copier"; }, 1400); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });

  /* ---- Envoi : une seule soumission, protection contre la perte de modifications ---- */
  form.addEventListener("submit", function (e) {
    if (busy) { e.preventDefault(); return; }
    if (!valid) { e.preventDefault(); if (input) input.focus(); return; }
    busy = true;
    form.setAttribute("aria-busy", "true");
    if (saveBtn) { saveBtn.disabled = true; var l = saveBtn.querySelector(".pl-save-label"); if (l) l.textContent = "Enregistrement…"; }
    setStatus("Enregistrement…", "is-busy");
    initial = snapshot(); // la page suivante est celle du serveur : plus de garde
  });
  window.addEventListener("beforeunload", function (e) {
    if (!busy && snapshot() !== initial) { e.preventDefault(); e.returnValue = ""; }
  });

  refreshPreview();
  refreshState();
  if (snapshot() !== initial) validate();
})();

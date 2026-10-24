// KOLAKISA CMS → Paramètres → Général. Données = JSON #sg-data posé par le serveur. Un seul enregistrement « tout ou rien » (PUT /parametres/api/general) : le serveur REVALIDE tout,
// applique les droits et le site de l'adresse ; rien n'est annoncé comme réussi avant sa réponse, et une valeur refusée n'est jamais réinitialisée.
(function () {
  var root = document.querySelector("[data-sg-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  var boot = JSON.parse(document.getElementById("sg-data").textContent);
  var F = boot.fields, form = $("[data-sg-form]");
  var saveBtn = $("[data-sg-save]"), cancelBtn = $("[data-sg-cancel]"), stateEl = $("[data-sg-state]"), barState = $("[data-sg-bar-state]");
  var banner = $("[data-sg-banner]"), bannerTitle = $("[data-sg-banner-title]"), bannerList = $("[data-sg-banner-list]");
  var busy = false, savedAt = "";
  var LOCALES = { fr: "fr-FR", en: "en-US", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", ar: "ar", sw: "sw" };

  // ---------- Lecture / écriture des champs ----------
  function fieldEls(key) { return $$('[data-sg-field="' + key + '"]'); }
  function read(key) {
    var els = fieldEls(key); if (!els.length) return undefined;
    var el = els[0];
    if (el.type === "checkbox") return el.checked;
    if (el.type === "radio") { var on = els.filter(function (e) { return e.checked; })[0]; return on ? on.value : ""; }
    return el.value;
  }
  function write(key, value) {
    var els = fieldEls(key); if (!els.length) return;
    var el = els[0];
    if (el.type === "checkbox") el.checked = value === true || value === "true" || value === "1";
    else if (el.type === "radio") els.forEach(function (e) { e.checked = String(e.value) === String(value); });
    else el.value = value === null || value === undefined ? "" : value;
  }
  function norm(key, v) { if (v === null || v === undefined) return ""; if (typeof v === "boolean") return v ? "1" : ""; if (v === "true") return "1"; if (v === "false") return ""; return String(v).replace(/\s+/g, " ").trim(); }
  var saved = {};
  function snapshot() { Object.keys(F).forEach(function (k) { if (fieldEls(k).length) saved[k] = norm(k, read(k)); }); }
  function editableKeys() { return Object.keys(F).filter(function (k) { return F[k].editable && fieldEls(k).length; }); }
  function changed() { return editableKeys().filter(function (k) { return norm(k, read(k)) !== saved[k]; }); }
  var dirty = function () { return changed().length > 0; };

  // ---------- État, erreurs ----------
  function setState() {
    var n = changed().length, d = n > 0;
    var text = busy ? "Enregistrement…" : d ? "Modifications non enregistrées (" + n + ")" : savedAt ? "Enregistré à " + savedAt : "Aucune modification";
    stateEl.textContent = text; barState.textContent = text;
    stateEl.classList.toggle("is-dirty", d); stateEl.classList.toggle("is-busy", busy);
    saveBtn.disabled = busy || !d || !boot.canSave; cancelBtn.disabled = busy || !d;
    saveBtn.textContent = busy ? "Enregistrement…" : "Enregistrer les modifications";
    document.title = (d ? "• " : "") + document.title.replace(/^• /, "");
  }
  function clearErrors() { $$("[data-sg-err]").forEach(function (e) { e.hidden = true; e.textContent = ""; }); $$("[aria-invalid]").forEach(function (e) { e.removeAttribute("aria-invalid"); }); banner.hidden = true; bannerList.textContent = ""; }
  function fieldError(key, msg) {
    var e = $('[data-sg-err="' + key + '"]'); if (e) { e.textContent = msg; e.hidden = false; }
    fieldEls(key).forEach(function (el) { el.setAttribute("aria-invalid", "true"); });
  }
  function showBanner(title, lines) {
    bannerTitle.textContent = title; bannerList.textContent = "";
    (lines || []).forEach(function (l) { var li = document.createElement("li"); li.textContent = l; bannerList.appendChild(li); });
    banner.hidden = false; banner.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  // « Nom du site : obligatoire. » → le champ dont le libellé ouvre le message
  function keyOfMessage(msg) {
    var hit = null;
    Object.keys(F).forEach(function (k) { if (msg.indexOf(F[k].label + " :") === 0 && (!hit || F[k].label.length > F[hit].label.length)) hit = k; });
    return hit;
  }

  // ---------- Enregistrement ----------
  function payload(confirm) {
    var values = {}; changed().forEach(function (k) { var v = read(k); values[k] = typeof v === "boolean" ? v : v; });
    var body = { values: values }; if (confirm) body.confirm = true;
    return body;
  }
  function apply(values) {
    Object.keys(values || {}).forEach(function (k) { if (fieldEls(k).length) write(k, values[k]); });
    snapshot(); syncImages(); refresh();
  }
  function save(confirm) {
    if (busy || !dirty()) return;
    clearErrors(); busy = true; setState();
    fetch(boot.save, { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload(confirm)) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; }); })
      .then(function (res) {
        busy = false;
        if (res.status === 200 && res.body.ok) {
          savedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          apply(res.body.values || {}); setState();
          var n = (res.body.changed || []).length;
          announce(n ? n + " réglage" + (n > 1 ? "s" : "") + " enregistré" + (n > 1 ? "s" : "") + "." : "Aucune modification à enregistrer.");
          return;
        }
        setState();
        if (res.status === 409 && res.body.confirmRequired) return askConfirm(res.body.confirmRequired);
        var errs = res.body.errors || (res.body.error ? [typeof res.body.error === "string" ? res.body.error : res.body.error.message] : ["L'enregistrement a échoué (code " + res.status + "). Vos valeurs sont conservées : réessayez."]);
        errs.forEach(function (m) { var k = keyOfMessage(m); if (k) fieldError(k, m.replace(F[k].label + " :", "").trim().replace(/^./, function (c) { return c.toUpperCase(); })); });
        showBanner("Rien n'a été enregistré. Corrigez puis réessayez :", errs);
        var first = $('[aria-invalid="true"]'); if (first) first.focus();
      })
      .catch(function () { busy = false; setState(); showBanner("Rien n'a été enregistré.", ["Le serveur ne répond pas (réseau). Vos valeurs sont conservées dans le formulaire : réessayez."]); });
  }
  var liveRegion = document.createElement("p"); liveRegion.className = "sr-only"; liveRegion.setAttribute("role", "status"); liveRegion.setAttribute("aria-live", "polite"); root.appendChild(liveRegion);
  function announce(t) { liveRegion.textContent = ""; setTimeout(function () { liveRegion.textContent = t; }, 30); }

  // ---------- Confirmation des réglages sensibles ----------
  var dlgConfirm = $("[data-sg-dlg-confirm]");
  function askConfirm(items) {
    var ul = $("[data-sg-confirm-list]"); ul.textContent = "";
    items.forEach(function (c) {
      var li = document.createElement("li"), b = document.createElement("strong"), p = document.createElement("p"), d = document.createElement("p");
      b.textContent = c.label; p.textContent = c.before + " → " + c.after; d.textContent = c.impact; d.className = "mk-sg-help";
      li.appendChild(b); li.appendChild(p); li.appendChild(d); ul.appendChild(li);
    });
    if (dlgConfirm.showModal) dlgConfirm.showModal(); else dlgConfirm.setAttribute("open", "");
  }
  $("[data-sg-confirm-ok]").addEventListener("click", function () { dlgConfirm.close(); save(true); });
  $$("[data-sg-close]").forEach(function (b) { b.addEventListener("click", function () { var d = b.closest("dialog"); if (d) d.close(); }); });

  form.addEventListener("submit", function (e) { e.preventDefault(); save(false); });
  cancelBtn.addEventListener("click", function () { Object.keys(saved).forEach(function (k) { if (F[k] && F[k].editable) write(k, saved[k] === "1" && fieldEls(k)[0] && fieldEls(k)[0].type === "checkbox" ? true : saved[k]); }); clearErrors(); syncImages(); refresh(); announce("Modifications annulées."); });
  form.addEventListener("input", function (e) { var k = e.target && e.target.getAttribute && e.target.getAttribute("data-sg-field"); if (k) { var er = $('[data-sg-err="' + k + '"]'); if (er) { er.hidden = true; } e.target.removeAttribute("aria-invalid"); } refresh(); });
  form.addEventListener("change", function () { refresh(); });

  // Perte accidentelle de modifications : fermeture de l'onglet ET clic sur un lien
  window.addEventListener("beforeunload", function (e) { if (dirty() && !busy) { e.preventDefault(); e.returnValue = ""; } });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && dirty() && !a.target && !a.hasAttribute("download") && !/^#/.test(a.getAttribute("href")) && !confirm("Des modifications ne sont pas enregistrées. Quitter cette page sans les enregistrer ?")) e.preventDefault();
  }, true);

  // ---------- Aperçus : horloge, formats de date et d'heure, calendrier ----------
  function localeOf() {
    var v = read("language");
    if (v === undefined) return "fr-FR";
    return LOCALES[v] || String(v).replace("_", "-");
  }
  function tzOf() { var v = read("timezone"); return v || "Europe/Paris"; }
  var PATTERNS = { iso: "y-m-d", dmy: "d/m/y", mdy: "m/d/y", dots: "d.m.y" };
  function fmtDate(date, style, locale, tz) {
    try {
      if (PATTERNS[style]) {
        var parts = {}; new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz }).formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
        return PATTERNS[style].replace("y", parts.year).replace("m", parts.month).replace("d", parts.day);
      }
      return date.toLocaleDateString(locale, { dateStyle: style, timeZone: tz });
    } catch (e) { return "—"; }
  }
  function fmtTime(date, fmt, locale, tz) { try { return date.toLocaleTimeString(locale, { timeStyle: "short", hour12: fmt === "12h", timeZone: tz }); } catch (e) { return "—"; } }
  function renderExamples() {
    var now = new Date(), loc = localeOf(), tz = tzOf();
    $$("[data-sg-example-date]").forEach(function (o) { o.textContent = fmtDate(now, o.getAttribute("data-sg-example-date"), loc, tz); });
    $$("[data-sg-example-time]").forEach(function (o) { o.textContent = fmtTime(now, o.getAttribute("data-sg-example-time"), loc, tz); });
    var prev = $("[data-sg-preview]");
    if (prev && fieldEls("date_format").length) prev.textContent = "Aperçu : " + fmtDate(now, read("date_format") || "long", loc, tz) + " à " + fmtTime(now, read("time_format") || "24h", loc, tz);
  }
  function renderClock() {
    var el = $("[data-sg-clock]"); if (!el) return;
    var now = new Date(), tz = tzOf();
    try {
      var local = new Intl.DateTimeFormat(localeOf(), { dateStyle: "full", timeStyle: "medium", timeZone: tz }).format(now);
      var off = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(now).filter(function (p) { return p.type === "timeZoneName"; })[0];
      el.textContent = "Heure locale du site : " + local + (off ? " (" + off.value + ")" : "") + " · Heure universelle : " + now.toISOString().slice(11, 19);
    } catch (e) { el.textContent = "Fuseau horaire inconnu."; }
  }
  function renderCalendar() {
    var cal = $("[data-sg-cal]"); if (!cal) return;
    var start = ({ monday: 1, sunday: 0, saturday: 6 })[read("week_start")]; if (start === undefined) start = 1;
    var loc = localeOf(), tz = tzOf(), now = new Date();
    var ymd = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now).split("-").map(Number);
    var y = ymd[0], m = ymd[1] - 1, today = ymd[2];
    var first = new Date(Date.UTC(y, m, 1)).getUTCDay(), days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate(), offset = (first - start + 7) % 7;
    var names = []; for (var i = 0; i < 7; i++) names.push(new Date(Date.UTC(2024, 0, 7 + ((start + i) % 7))).toLocaleDateString(loc, { weekday: "narrow", timeZone: "UTC" }));
    var html = '<p class="mk-sg-cal-title">' + new Date(Date.UTC(y, m, 15)).toLocaleDateString(loc, { month: "long", year: "numeric", timeZone: "UTC" }) + "</p><div class=\"mk-sg-cal-grid\">";
    names.forEach(function (n) { html += "<span>" + n + "</span>"; });
    for (var b = 0; b < offset; b++) html += "<i></i>";
    for (var d = 1; d <= days; d++) html += "<b" + (d === today ? ' class="is-today"' : "") + ">" + d + "</b>";
    cal.innerHTML = html + "</div>";
  }
  function counters() { $$("[data-sg-count]").forEach(function (c) { var k = c.getAttribute("data-sg-count"), el = fieldEls(k)[0]; if (el && F[k]) { c.textContent = el.value.length + " / " + F[k].max; } }); }
  function refresh() { setState(); renderExamples(); renderClock(); renderCalendar(); counters(); }

  // ---------- Choix d'une image de la médiathèque (icône, logo) ----------
  var dlgImg = $("[data-sg-dlg-image]"), grid = $("[data-sg-imggrid]"), search = $("[data-sg-img-search]"), pickFor = "";
  function syncImages() {
    $$("[data-sg-image]").forEach(function (box) {
      var k = box.getAttribute("data-sg-image"), v = read(k) || "", img = $("[data-sg-thumb-img]", box), none = $("[data-sg-thumb-empty]", box), clear = $("[data-sg-clear]", box);
      if (v) { img.src = v; img.hidden = false; none.hidden = true; } else { img.removeAttribute("src"); img.hidden = true; none.hidden = false; }
      if (clear) clear.hidden = !v;
    });
  }
  function drawImages() {
    var q = (search.value || "").toLowerCase().trim(); grid.textContent = ""; var n = 0;
    boot.choices.images.forEach(function (im) {
      if (q && im.name.toLowerCase().indexOf(q) < 0) return; n++;
      var li = document.createElement("li"), b = document.createElement("button"), i = document.createElement("img"), s = document.createElement("span");
      b.type = "button"; b.setAttribute("aria-label", "Choisir " + im.name); i.src = im.path; i.alt = ""; i.loading = "lazy"; s.textContent = im.name;
      b.appendChild(i); b.appendChild(s);
      b.addEventListener("click", function () { write(pickFor, im.path); dlgImg.close(); syncImages(); refresh(); var t = $('[data-sg-pick="' + pickFor + '"]'); if (t) t.focus(); });
      li.appendChild(b); grid.appendChild(li);
    });
    $("[data-sg-img-empty]").hidden = n > 0;
  }
  $$("[data-sg-pick]").forEach(function (b) { b.addEventListener("click", function () { pickFor = b.getAttribute("data-sg-pick"); search.value = ""; drawImages(); if (dlgImg.showModal) dlgImg.showModal(); else dlgImg.setAttribute("open", ""); search.focus(); }); });
  $$("[data-sg-clear]").forEach(function (b) { b.addEventListener("click", function () { write(b.getAttribute("data-sg-clear"), ""); syncImages(); refresh(); }); });
  if (search) search.addEventListener("input", drawImages);

  snapshot(); syncImages(); refresh();
  setInterval(function () { renderClock(); renderExamples(); }, 1000);
})();

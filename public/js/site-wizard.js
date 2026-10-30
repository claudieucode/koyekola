// Assistant de création de site : améliorations progressives (tout fonctionne sans JavaScript : formulaires classiques).
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ── Accueil : modes, catégories, filtre des modèles ──────────────────────────────────────────────────────────────────────────
  var hub = $("[data-sw-hub]");
  if (hub) {
    var tpl = $("[data-sw-templates]", hub), shop = $("[data-sw-shop]", hub), cat = $("[data-sw-category]", hub);
    var mode = function () { var r = $("input[name=mode]:checked", hub); return r ? r.value : "blank"; };
    var refresh = function () {
      var m = mode();
      tpl.hidden = m !== "template"; shop.hidden = m !== "shop"; cat.hidden = m === "shop";
      $$("input[name=pack]", hub).forEach(function (i) { i.required = m === "template"; });
    };
    var filter = function () {
      var q = ($("[data-sw-search]", hub).value || "").toLowerCase(), sec = $("[data-sw-sector]", hub).value;
      $$("[data-pack-card]", hub).forEach(function (c) { c.hidden = (q && c.dataset.text.indexOf(q) < 0) || (sec && c.dataset.sector !== sec); });
    };
    $$("input[name=mode]", hub).forEach(function (i) { i.addEventListener("change", refresh); });
    // La catégorie conseille un modèle (sans l'imposer)
    $$("input[name=category]", hub).forEach(function (i) {
      i.addEventListener("change", function () {
        var p = i.closest("label").dataset.pack, t = p && $("input[name=pack][value='" + p + "']", hub);
        if (t) t.checked = true;
      });
    });
    var s = $("[data-sw-search]", hub), sec = $("[data-sw-sector]", hub);
    if (s) s.addEventListener("input", filter); if (sec) sec.addEventListener("change", filter);
    refresh();
  }

  // ── Assistant ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  var root = $("[data-sw-wizard]");
  if (!root) return;
  var status = $("[data-sw-status]", root), revision = Number(root.dataset.revision), pending = null, failed = false, busy = false;
  var say = function (t, bad) { if (status) { status.textContent = t; status.classList.toggle("is-bad", !!bad); } };

  $$("form[data-sw-autosave]", root).forEach(function (form) {
    var step = root.dataset.step;
    var collect = function () {
      var out = {};
      $$("input,select,textarea", form).forEach(function (el) {
        if (!el.name || el.type === "file" || el.name === "revision" || el.name === "logoUrl") return;
        if (el.type === "radio" && !el.checked) return;
        out[el.name] = el.value;
      });
      return out;
    };
    var send = function () {
      if (busy) { pending = setTimeout(send, 600); return; }
      busy = true; say("Enregistrement…");
      fetch(root.dataset.draftUrl, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ step: step, fields: collect(), revision: revision }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (b) { return { status: r.status, body: b }; }); })
        .then(function (r) {
          busy = false;
          if (r.body && r.body.ok) { revision = r.body.revision; failed = false; $$("input[name=revision]", root).forEach(function (i) { i.value = revision; }); say("Enregistré"); return; }
          if (r.status === 409) { say("Modifié ailleurs : rechargez la page pour ne rien perdre.", true); return; }
          if (r.status === 401 || r.status === 403) { say("Session expirée ou droit manquant : reconnectez-vous, vos saisies restent dans le formulaire.", true); return; }
          failed = true; say((r.body && r.body.error) || "Non enregistré — nouvel essai à la prochaine modification.", true);
        })
        .catch(function () { busy = false; failed = true; say("Hors connexion — nouvel essai au retour du réseau.", true); });
    };
    var schedule = function () { clearTimeout(pending); say("Modifications non enregistrées…"); pending = setTimeout(send, 900); };
    form.addEventListener("input", schedule); form.addEventListener("change", schedule);
    window.addEventListener("online", function () { if (failed) send(); });
  });

  // Pays → langue, fuseau et devise proposés ; formats d'exemple (Intl du navigateur)
  var country = $("[data-sw-country]", root);
  if (country) {
    var fmt = $("[data-sw-fmt]", root);
    var show = function () {
      var o = country.selectedOptions[0], lang = $("[data-sw-lang]", root).value, cur = $("[data-sw-cur]", root).value, tz = $("[data-sw-tz]", root).value;
      if (!o || !o.value || !fmt) return;
      try {
        var loc = lang + "-" + o.value, d = new Date("2026-03-14T15:30:00Z");
        fmt.textContent = "Formats (" + loc + ") : " + new Intl.DateTimeFormat(loc, { dateStyle: "long", timeZone: tz || "UTC" }).format(d) + " · " + new Intl.NumberFormat(loc).format(1234567.89) + " · " + new Intl.NumberFormat(loc, { style: "currency", currency: cur }).format(1234.5);
      } catch (e) { /* format indisponible : l'aperçu reste celui du serveur */ }
    };
    country.addEventListener("change", function () {
      var o = country.selectedOptions[0]; if (!o || !o.value) return;
      $("[data-sw-lang]", root).value = o.dataset.lang; $("[data-sw-tz]", root).value = o.dataset.tz; $("[data-sw-cur]", root).value = o.dataset.cur; show();
    });
    ["[data-sw-lang]", "[data-sw-cur]", "[data-sw-tz]"].forEach(function (s) { var e = $(s, root); if (e) e.addEventListener("change", show); });
  }

  // Identité : aperçu en direct (couleurs, polices, style)
  var pv = $("[data-sw-preview]", root);
  if (pv) {
    var val = function (k) { var e = $("[data-sw-color=" + k + "]", root); return e ? e.value : ""; };
    var apply = function () {
      var h = $("[data-sw-font=heading]", root), b = $("[data-sw-font=body]", root);
      pv.style.background = val("background"); pv.style.color = val("text");
      $("[data-sw-pv-h]", pv).style.color = val("primary"); $("[data-sw-pv-a]", pv).style.color = val("secondary");
      var btn = $("[data-sw-pv-btn]", pv); btn.style.background = val("primary"); btn.style.color = "#fff";
      if (h) $("[data-sw-pv-h]", pv).style.fontFamily = h.selectedOptions[0].dataset.stack;
      if (b) pv.style.fontFamily = b.selectedOptions[0].dataset.stack;
    };
    $$("[data-sw-color],[data-sw-font]", root).forEach(function (e) { e.addEventListener("input", apply); e.addEventListener("change", apply); });
    apply();
    var file = $("[data-sw-logo-file]", root), msg = $("[data-sw-logo-msg]", root);
    if (file) file.addEventListener("change", function () {
      if (!file.files[0]) return;
      var fd = new FormData(); fd.append("file", file.files[0]); msg.textContent = "Envoi du logo…";
      fetch("/marketing/site-web/medias", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json" }, body: fd })
        .then(function (r) { return r.json().then(function (b) { return { ok: r.ok, body: b }; }); })
        .then(function (r) { if (r.ok && r.body.media) { $("[data-sw-logo-url]", root).value = r.body.media.path; msg.textContent = "Logo importé : enregistrez l'étape pour l'appliquer."; } else msg.textContent = (r.body.error && r.body.error.message) || "Envoi impossible."; })
        .catch(function () { msg.textContent = "Envoi impossible (connexion)."; });
    });
  }

  // Pages : réorganisation au clavier et à la souris (boutons ↑ ↓) ; l'ordre est enregistré par le bouton dédié
  var body = $("[data-sw-pages]", root);
  if (body) {
    var order = $("[data-sw-order]", root), sync = function () { if (order) order.value = $$("tr[data-id]", body).map(function (r) { return r.dataset.id; }).join(","); $$("tr", body).forEach(function (r, i, all) { var u = $("[data-sw-up]", r), d = $("[data-sw-down]", r); if (u) u.disabled = i === 0; if (d) d.disabled = i === all.length - 1; }); };
    body.addEventListener("click", function (e) {
      var up = e.target.closest("[data-sw-up]"), down = e.target.closest("[data-sw-down]"), row = e.target.closest("tr"); if (!row || (!up && !down)) return;
      if (up && row.previousElementSibling) body.insertBefore(row, row.previousElementSibling);
      if (down && row.nextElementSibling) body.insertBefore(row.nextElementSibling, row);
      sync(); (up || down).focus();
    });
    sync();
  }
})();

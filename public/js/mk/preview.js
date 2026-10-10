// Fenêtre « Aperçu » de l'éditeur d'e-mails : rendu réel du moteur commun dans un vrai viewport (Bureau / Tablette /
// Mobile, largeurs réelles en pixels CSS : les règles mobiles du message s'appliquent réellement), puis vérifications
// calculées sur ce rendu : débordements à chaque largeur, images, liens, HTML, balises de fusion, taille.
// La réduction éventuelle à l'écran (fenêtre trop étroite) est purement visuelle et n'altère jamais le viewport.
(function () {
  "use strict";
  var DEVICES = {
    desktop: { label: "Bureau", widths: [1024, 800, 640], def: 800 },
    tablet: { label: "Tablette", widths: [768, 600], def: 768 },
    mobile: { label: "Mobile", widths: [390, 375, 360, 320], def: 375 },
  };
  var CHECK_WIDTHS = [1024, 800, 768, 640, 600, 390, 375, 360, 320]; // largeurs testées pour le responsive

  function create(api) {
    var $ = function (id) { return document.getElementById(id); };
    var dlg = $("mk-preview-dialog"), frame = $("mk-preview-frame"), device = $("mk-pv-device"), stage = $("mk-pv-stage");
    var widthSel = $("mk-pv-width"), contactSel = $("mk-pv-contact"), scaleNote = $("mk-pv-scale");
    var state = { device: "desktop", width: DEVICES.desktop.def, data: null, seq: 0, measured: null, key: null };
    var el = api.el;

    // ---------- Appareil et largeur ----------
    function fillWidths() {
      widthSel.textContent = "";
      DEVICES[state.device].widths.forEach(function (w) { widthSel.appendChild(el("option", { value: String(w) }, w + " px")); });
      widthSel.value = String(state.width);
    }
    function setDevice(dev) {
      state.device = dev; state.width = DEVICES[dev].def;
      [].forEach.call(dlg.querySelectorAll("[data-pdevice]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-pdevice") === dev ? "true" : "false"); });
      fillWidths(); applyWidth();
      api.announce("Aperçu " + DEVICES[dev].label.toLowerCase() + " : " + state.width + " px.");
    }
    // Largeur réelle du document (viewport de l'iframe) ; réduction visuelle seulement si la place manque
    function applyWidth() {
      frame.style.width = state.width + "px";
      fitHeight();
      var avail = stage.clientWidth - 32;
      var k = Math.min(1, avail / state.width);
      frame.style.transform = k < 1 ? "scale(" + k.toFixed(4) + ")" : "";
      device.style.width = Math.round(state.width * k) + "px";
      device.style.height = Math.round(frame.offsetHeight * k) + "px";
      scaleNote.textContent = k < 1 ? "Affiché à " + Math.round(k * 100) + " % pour tenir à l'écran — le message est rendu à " + state.width + " px réels." : "Rendu réel à " + state.width + " px.";
      measureCurrent();
    }
    function doc() { try { return frame.contentDocument; } catch (e) { return null; } }
    function fitHeight() {
      var d = doc(); if (!d || !d.documentElement) return;
      frame.style.height = Math.max(480, d.documentElement.scrollHeight) + "px";
    }

    // ---------- Chargement du rendu réel ----------
    // Le cadre n'est montré qu'une fois le rendu PRÊT (taille réelle, images chargées, vérifications faites) : on ne voit jamais le cadre vide à sa
    // taille par défaut, ni son agrandissement en plusieurs temps, ni l'ancien contenu remplacé sous les yeux (data-ready dans le CSS).
    function setReady(on) { dlg.setAttribute("data-ready", on ? "true" : "false"); }
    // Même contenu et même contact que le rendu déjà affiché : il reste valable, rien n'est rechargé (force = demande explicite d'actualiser)
    function load(force) {
      var body = { template: api.payload(), mode: "preview" };
      if (contactSel.value) body.contactId = parseInt(contactSel.value, 10);
      var key = JSON.stringify(body);
      if (force !== true && state.data && state.key === key) { setReady(true); setBusy(false); applyWidth(); return false; }
      var seq = ++state.seq;
      state.measured = {};
      setBusy(true); setReady(false);
      api.postJson("/marketing/modeles/apercu", body).then(function (j) {
        if (seq !== state.seq) return;
        state.data = j; state.key = key;
        frame.onload = function () { fitHeight(); applyWidth(); waitImages().then(function () { if (seq === state.seq) { fitHeight(); applyWidth(); runChecks(); setBusy(false); setReady(true); } }); };
        frame.srcdoc = j.html;
        renderInfo(j);
        $("mk-text").textContent = j.text;
      }).catch(function (e) {
        if (seq !== state.seq) return;
        state.data = null; state.key = null; frame.srcdoc = "";
        renderInfo(null, e.message);
        renderChecks([{ key: "html", label: "HTML", status: "error", summary: "Rendu impossible : " + e.message }]);
        setBusy(false); setReady(true);
      });
    }
    function setBusy(on) { dlg.setAttribute("aria-busy", on ? "true" : "false"); $("mk-pv-status").textContent = on ? "Génération de l'aperçu…" : ""; }
    // Images : attendre leur chargement (ou leur échec), 6 s au plus
    function waitImages() {
      var d = doc(); if (!d) return Promise.resolve();
      var imgs = [].slice.call(d.images);
      return Promise.race([
        Promise.all(imgs.map(function (img) { return img.complete ? Promise.resolve() : new Promise(function (r) { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); }); })),
        new Promise(function (r) { setTimeout(r, 6000); }),
      ]);
    }

    // ---------- Mesures (débordements) ----------
    function describe(n) {
      var tag = n.tagName.toLowerCase(), text = (n.textContent || "").replace(/\s+/g, " ").trim().slice(0, 40);
      var kind = tag === "img" ? "image" : tag === "a" ? "lien ou bouton" : /^h[1-6]$/.test(tag) ? "titre" : tag === "table" || tag === "td" ? "tableau" : tag === "p" || tag === "div" ? "texte" : tag;
      return kind + (tag === "img" ? " (" + (n.getAttribute("alt") || n.getAttribute("src") || "").slice(0, 40) + ")" : text ? " « " + text + (n.textContent.trim().length > 40 ? "…" : "") + " »" : "");
    }
    function overflowAt() {
      var d = doc(); if (!d || !d.body) return null;
      var de = d.documentElement, vw = de.clientWidth, over = de.scrollWidth - vw;
      var culprits = [];
      if (over > 0) {
        // l'élément le plus profond qui dépasse : la vraie cause (ses parents dépassent seulement parce qu'il les étire)
        var all = [].slice.call(d.body.querySelectorAll("*")).filter(function (n) { var r = n.getBoundingClientRect(); return r.width && (r.right > vw + 1 || r.left < -1); });
        all.filter(function (n) { return !all.some(function (m) { return m !== n && n.contains(m); }); }).slice(0, 3).forEach(function (n) {
          var r = n.getBoundingClientRect(); culprits.push({ what: describe(n), px: Math.round(Math.max(r.right - vw, -r.left)) });
        });
      }
      return { width: state.width, over: Math.max(0, over), culprits: culprits };
    }
    function measureCurrent() { var m = overflowAt(); if (m && state.measured) state.measured.current = m; }
    // Vérification responsive réelle : le document est rendu successivement à chaque largeur, puis remis à la largeur choisie
    function measureAll() {
      var res = [];
      var keep = frame.style.width;
      CHECK_WIDTHS.forEach(function (w) { frame.style.width = w + "px"; void frame.offsetWidth; var d = doc(); if (d) void d.documentElement.offsetWidth; var m = overflowAt(); if (m) { m.width = w; res.push(m); } });
      frame.style.width = keep; fitHeight();
      return res;
    }

    // ---------- Vérifications ----------
    function runChecks() {
      var j = state.data; if (!j) return;
      var d = doc(), checks = [];
      // Responsive
      var widths = measureAll();
      var bad = widths.filter(function (m) { return m.over > 0; });
      checks.push(bad.length
        ? { key: "responsive", label: "Responsive", status: "error", summary: "Débordement à " + bad.map(function (m) { return m.width + " px"; }).join(", "), details: bad.map(function (m) { return m.width + " px : +" + m.over + " px — " + (m.culprits.map(function (c) { return c.what + " (+" + c.px + " px)"; }).join(" ; ") || "élément non identifié"); }) }
        : { key: "responsive", label: "Responsive", status: "ok", summary: "Aucun débordement de " + CHECK_WIDTHS[CHECK_WIDTHS.length - 1] + " à " + CHECK_WIDTHS[0] + " px (" + CHECK_WIDTHS.length + " largeurs testées)" });
      // Images
      var imgs = d ? [].slice.call(d.images) : [];
      var broken = imgs.filter(function (i) { return i.complete && i.naturalWidth === 0; }).map(function (i) { return i.getAttribute("alt") || i.getAttribute("src"); });
      var lost = j.missingImages || [];
      checks.push(lost.length || broken.length
        ? { key: "images", label: "Images", status: "error", summary: (lost.length + broken.length) + " image(s) introuvable(s) ou non chargée(s)", details: lost.map(function (p) { return "Absente du serveur : " + p.split("/").pop(); }).concat(broken.map(function (b) { return "Non chargée : " + String(b).slice(0, 80); })) }
        : { key: "images", label: "Images", status: "ok", summary: imgs.length ? imgs.length + " image(s) chargée(s), aucune ne dépasse" : "Aucune image" });
      // Liens
      var links = j.links || [], le = links.filter(function (l) { return l.status === "error"; }), lw = links.filter(function (l) { return l.status === "warning"; });
      checks.push({ key: "links", label: "Liens", status: le.length ? "error" : lw.length ? "warning" : "ok", summary: (links.length - le.length - lw.length) + " valide(s)" + (lw.length ? " · " + lw.length + " à vérifier" : "") + (le.length ? " · " + le.length + " en erreur" : ""), details: le.concat(lw).map(function (l) { var t = l.text.length > 50 ? l.text.slice(0, 50) + "…" : l.text; return "« " + t + " » : " + l.reason; }) });
      // HTML (blocs)
      var be = j.blockErrors || [];
      checks.push(be.length
        ? { key: "html", label: "HTML", status: "error", summary: be.length + " bloc(s) incomplet(s) : le message ne peut pas partir", details: be.map(function (x) { return "Bloc " + (x.index + 1) + " : " + x.message; }) }
        : { key: "html", label: "HTML", status: "ok", summary: "Généré sans erreur par le moteur d'envoi" });
      // Balises de fusion
      var tags = j.mergeTags || [], empty = tags.filter(function (t) { return t.empty; });
      var noDef = (j.warnings || []).filter(function (w) { return w.code === "variable_no_default"; });
      checks.push(!tags.length ? { key: "vars", label: "Variables", status: "ok", summary: "Aucune balise de fusion" }
        : { key: "vars", label: "Variables", status: empty.length || noDef.length ? "warning" : "ok", summary: tags.length + " balise(s)" + (empty.length ? " · " + empty.length + " vide(s) pour ce destinataire" : ""), details: empty.map(function (t) { return "{{" + t.path + "}} est vide pour ce destinataire"; }).concat(noDef.map(function (w) { return w.message; })) });
      // Taille
      var sz = j.size;
      checks.push({ key: "size", label: "Taille", status: sz.level === "high" ? "warning" : "ok", summary: sz.kb.toLocaleString("fr-FR") + " Ko / " + sz.limitKb + " Ko · " + { low: "faible", moderate: "modérée", high: "élevée" }[sz.level], details: sz.level === "high" ? ["Gmail coupe l'affichage au-delà d'environ " + sz.limitKb + " Ko de HTML (« Message tronqué »)."] : [] });
      renderChecks(checks);
      renderLinks(links);
    }

    // ---------- Affichage ----------
    var ICON = { ok: "✓", warning: "!", error: "✕" };
    var WORD = { ok: "Valide", warning: "À vérifier", error: "Erreur" };
    function renderChecks(checks) {
      var ul = $("mk-pv-checks"); ul.textContent = "";
      checks.forEach(function (c) {
        var li = el("li", { "class": "mk-pv-check is-" + c.status, "data-check": c.key });
        var head = el("div", { "class": "mk-pv-check-head" });
        head.appendChild(el("span", { "class": "mk-pv-badge", "aria-hidden": "true" }, ICON[c.status]));
        head.appendChild(el("strong", {}, c.label));
        head.appendChild(el("span", { "class": "sr-only" }, " : " + WORD[c.status] + ". "));
        head.appendChild(el("span", { "class": "mk-pv-check-sum" }, c.summary));
        li.appendChild(head);
        if (c.details && c.details.length) {
          var det = el("ul", { "class": "mk-pv-check-details" });
          c.details.slice(0, 12).forEach(function (t) { det.appendChild(el("li", {}, t)); });
          li.appendChild(det);
        }
        ul.appendChild(li);
      });
      var worst = checks.some(function (c) { return c.status === "error"; }) ? "error" : checks.some(function (c) { return c.status === "warning"; }) ? "warning" : "ok";
      var g = $("mk-pv-global"); g.className = "mk-pv-global is-" + worst;
      g.textContent = worst === "ok" ? "Toutes les vérifications sont valides" : worst === "warning" ? "Prêt, avec des points à vérifier" : "Des erreurs empêchent un envoi correct";
    }
    function renderLinks(links) {
      var box = $("mk-pv-links"); box.textContent = "";
      $("mk-pv-links-count").textContent = String(links.length);
      if (!links.length) { box.appendChild(el("p", { "class": "mk-pv-muted" }, "Aucun lien dans le message.")); return; }
      var ul = el("ul", { "class": "mk-pv-linklist" });
      links.forEach(function (l) {
        var li = el("li", { "class": "is-" + l.status });
        li.appendChild(el("span", { "class": "mk-pv-badge", "aria-hidden": "true" }, ICON[l.status]));
        var t = el("div", {});
        t.appendChild(el("strong", {}, l.text));
        t.appendChild(el("span", { "class": "mk-pv-href" }, l.href == null ? "(aucune adresse)" : l.href || "(adresse vide)"));
        t.appendChild(el("span", { "class": "mk-pv-muted" }, WORD[l.status] + " — " + l.reason));
        li.appendChild(t); ul.appendChild(li);
      });
      box.appendChild(ul);
    }
    function row(dl, label, value, cls) { dl.appendChild(el("dt", {}, label)); dl.appendChild(el("dd", cls ? { "class": cls } : {}, value)); }
    function renderInfo(j, error) {
      var dl = $("mk-pv-info"); dl.textContent = "";
      if (!j) { row(dl, "Aperçu", "Impossible : " + (error || "erreur inconnue"), "is-error"); return; }
      row(dl, "Destinataire", (j.recipient.name ? j.recipient.name + " · " : "") + j.recipient.email + (j.recipient.sample ? " (données d'exemple)" : ""));
      row(dl, "Expéditeur", j.sender ? j.sender.address : "Aucun expéditeur configuré (Réglages d'envoi)", j.sender ? "" : "is-warning");
      row(dl, "Objet", j.subject || "(objet vide)", j.subject ? "" : "is-error");
      row(dl, "Texte d'aperçu", j.preheader || "Vide : les messageries afficheront le début du message.", j.preheader ? "" : "is-warning");
      var tags = $("mk-pv-tags"); tags.textContent = "";
      if (!(j.mergeTags || []).length) tags.appendChild(el("p", { "class": "mk-pv-muted" }, "Aucune balise de fusion dans ce message."));
      else {
        var t = el("dl", { "class": "mk-pv-tags" });
        j.mergeTags.forEach(function (m) { t.appendChild(el("dt", {}, "{{" + m.path + "}}")); t.appendChild(el("dd", m.empty ? { "class": "is-warning" } : {}, m.empty ? "(vide)" : m.value)); });
        tags.appendChild(t);
      }
    }

    // ---------- Afficher dans le navigateur (HTML final du modèle enregistré) ----------
    function openInBrowser() {
      var url = "/marketing/modeles/" + api.templateId + "/apercu" + (contactSel.value ? "?contact=" + encodeURIComponent(contactSel.value) : "");
      var w = window.open("about:blank", "_blank"); // ouverte tout de suite (sinon bloquée), remplie après l'enregistrement
      api.ensureSaved().then(function (ok) {
        if (!ok) { if (w) w.close(); api.toast("Enregistrement impossible : corrigez d'abord l'erreur affichée, puis réessayez.", "error"); return; }
        if (w) { w.opener = null; w.location.href = url; } else api.toast("Le navigateur a bloqué le nouvel onglet : autorisez les fenêtres pour ce site.", "error");
      });
    }

    // ---------- Envoi de test (système d'envoi existant, réponse JSON) ----------
    var sending = false;
    function sendTest() {
      if (sending) return;
      var to = $("mk-pv-test-to").value, msg = $("mk-pv-test-msg"), btn = $("mk-pv-test-send");
      if (!to) { msg.className = "mk-pv-test-msg is-error"; msg.textContent = "Choisissez un destinataire."; return; }
      if (state.data && (state.data.blockErrors || []).length) { msg.className = "mk-pv-test-msg is-error"; msg.textContent = "Complétez d'abord les blocs en erreur (voir « HTML »)."; return; }
      sending = true; btn.disabled = true; btn.textContent = "Envoi…"; msg.className = "mk-pv-test-msg"; msg.textContent = "Enregistrement puis envoi du test…";
      var done = function (ok, text) { sending = false; btn.disabled = false; btn.textContent = "Envoyer le test"; msg.className = "mk-pv-test-msg " + (ok ? "is-ok" : "is-error"); msg.textContent = text; api.announce(text); };
      api.ensureSaved().then(function (ok) {
        if (!ok) return done(false, "Enregistrement impossible : le test n'est pas parti. Corrigez l'erreur affichée dans l'éditeur.");
        var ctrl = window.AbortController ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
        var body = { to: to }; if (contactSel.value) body.contact_id = contactSel.value;
        fetch("/marketing/modeles/" + api.templateId + "/test", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body), signal: ctrl ? ctrl.signal : undefined })
          .then(function (res) { return res.json().catch(function () { return { ok: false, message: "Réponse inattendue du serveur (" + res.status + ")." }; }); })
          .then(function (j) { clearTimeout(timer); done(!!j.ok, j.message || (j.ok ? "Envoyé." : "Échec de l'envoi.")); })
          .catch(function (e) { clearTimeout(timer); done(false, e && e.name === "AbortError" ? "Délai dépassé (30 s) : le serveur d'envoi ne répond pas. Réessayez." : "Envoi impossible : vérifiez votre connexion."); });
      });
    }

    // ---------- Branchements ----------
    [].forEach.call(dlg.querySelectorAll("[data-pdevice]"), function (b) { b.addEventListener("click", function () { setDevice(b.getAttribute("data-pdevice")); }); });
    widthSel.addEventListener("change", function () { state.width = parseInt(widthSel.value, 10); applyWidth(); });
    contactSel.addEventListener("change", function () { api.setContact(contactSel.value); load(true); });
    $("mk-pv-browser").addEventListener("click", openInBrowser);
    if ($("mk-pv-test-send")) $("mk-pv-test-send").addEventListener("click", sendTest);
    $("mk-pv-refresh").addEventListener("click", function () { load(true); });
    window.addEventListener("resize", function () { if (dlg.open) applyWidth(); });

    function open() {
      contactSel.value = api.contact();
      api.openDialog("mk-preview-dialog");
      fillWidths();
      load(false); // rendu déjà affiché et à jour : réutilisé tel quel (aucun rechargement)
    }
    return { open: open, reload: function () { return load(true); } };
  }
  window.MkPreview = { create: create, DEVICES: DEVICES, CHECK_WIDTHS: CHECK_WIDTHS };
})();

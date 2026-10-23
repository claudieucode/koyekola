// KOLAKISA CMS → Apparence → Éditeur du site : espace de travail d'un site autour du VRAI Page Builder. Données = JSON #se-data posé par le serveur.
// Le canevas est le Page Builder existant (même origine, ?cadre=1) : son enregistrement automatique, son historique et ses contrôles sont conservés. Ce script ne fait que naviguer entre pages
// et parties globales (en demandant confirmation si l'éditeur a des modifications en cours), afficher l'aperçu par appareil et publier les pages prêtes (par le serveur, contrôles habituels).
(function () {
  var root = document.querySelector("[data-se-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === false || v == null) return; if (k === "text") el.textContent = v; else if (k === "onclick") el.addEventListener("click", v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var S = JSON.parse(document.getElementById("se-data").textContent);
  var tab = "pages", q = "", mode = "edit", dev = "desktop", cur = null, busy = false;
  var frame = $("[data-se-frame]"), stage = $("[data-se-stage]"), wrap = $("[data-se-stagewrap]");
  var liveEl = $("[data-se-live-region]");
  function say(t) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = t; }, 30); }
  function banner(text) { $("[data-se-banner-text]").textContent = text || ""; $("[data-se-banner]").hidden = !text; }
  var norm = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };
  var site = function (u) { return u + (S.siteId ? (u.indexOf("?") >= 0 ? "&" : "?") + "site=" + S.siteId : ""); };

  // ---------- Modifications en cours dans l'éditeur ----------
  // Le Page Builder enregistre automatiquement ; son indicateur dit où il en est. « Non enregistré » ou « Enregistrement… » = quitter maintenant risque de perdre un instant de travail.
  function editorDirty() {
    try { var d = frame.contentDocument, s = d && d.querySelector("[data-pb-save]"); return !!s && /is-dirty|is-error/.test(s.className); } catch (e) { return false; }
  }
  function confirmLeave(what) { return !(mode === "edit" && cur && editorDirty()) || confirm("L'éditeur a des modifications qui ne sont pas encore enregistrées" + (what ? " (avant de " + what + ")" : "") + ". Patientez une seconde, ou continuez et risquez de les perdre. Continuer ?"); }
  window.addEventListener("beforeunload", function (e) { if (mode === "edit" && cur && editorDirty()) { e.preventDefault(); e.returnValue = ""; } });

  // ---------- Barre de travail ----------
  function chip(p) { return p.hasDraft ? ["Brouillon en cours", "is-info"] : p.published ? ["En ligne", ""] : ["Non publiée", "is-off"]; }
  function toolbar() {
    $("[data-se-title]").textContent = cur ? cur.label : "Aucune page";
    var c = $("[data-se-chip]"); c.hidden = !(cur && cur.page); if (cur && cur.page) { var x = chip(cur.page); c.textContent = x[0]; c.className = "mk-nm-chip " + x[1]; }
    var full = $("[data-se-full]"), live = $("[data-se-live]");
    full.hidden = !cur; if (cur) full.href = cur.editUrl.replace(/[?&]cadre=1/, "");
    live.hidden = !(cur && cur.page && cur.page.published && S.publicUrl); if (!live.hidden) live.href = S.publicUrl + "/p/" + cur.page.slug;
    $("[data-se-devices]").hidden = mode !== "preview";
  }
  function fit() {
    var w = { desktop: 0, tablet: 768, mobile: 390 }[dev], avail = wrap.clientWidth || 1;
    if (mode === "edit" || !w) { stage.style.width = "100%"; stage.style.transform = "none"; stage.style.height = "calc(100vh - 220px)"; return; }
    var sc = Math.min(1, avail / w); stage.style.width = w + "px"; stage.style.transform = sc < 1 ? "scale(" + sc + ")" : "none"; stage.style.transformOrigin = "top left"; stage.style.height = Math.round((Math.max(520, window.innerHeight - 220)) / sc) + "px"; wrap.style.height = Math.round(Math.max(520, window.innerHeight - 220)) + "px";
  }
  if (window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  window.addEventListener("resize", fit);
  function load() {
    if (!cur) { stage.hidden = true; $("[data-se-empty]").hidden = false; toolbar(); return; }
    $("[data-se-empty]").hidden = true; stage.hidden = false; $("[data-se-frameload]").hidden = false; $("[data-se-frameload]").textContent = mode === "edit" ? "Ouverture de l'éditeur…" : "Chargement de l'aperçu…";
    frame.setAttribute("src", mode === "edit" ? cur.editUrl : cur.previewUrl); toolbar(); fit();
  }
  frame.addEventListener("load", function () {
    var l = $("[data-se-frameload]"); l.hidden = true;
    try { var d = frame.contentDocument; if (d && d.body && /introuvable|erreur/i.test((d.title || "")) && !d.querySelector(".pb-top")) { l.hidden = false; l.textContent = "Cette page n'a pas pu être ouverte (supprimée ou non autorisée)."; } } catch (e) { /* cadre d'une autre origine : jamais attendu */ }
    if (mode === "preview") try { var doc = frame.contentDocument; doc.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest("a[href]"); if (a && (a.getAttribute("href") || "").charAt(0) !== "#") ev.preventDefault(); }, true); doc.addEventListener("submit", function (ev) { ev.preventDefault(); }, true); } catch (e) { /* ignoré */ }
  });
  function openPage(p) { if (cur && cur.page && cur.page.id === p.id) return; if (!confirmLeave("changer de page")) return; cur = { kind: "page", label: p.name, page: p, editUrl: S.urls.pageEditor + "/" + p.id + "/editeur?cadre=1", previewUrl: S.urls.preview + "/" + p.id + "/apercu" }; say("Page « " + p.name + " » ouverte."); load(); renderRail(); }
  function openPart(kind, part) {
    if (!confirmLeave("ouvrir cette partie")) return;
    cur = { kind: kind, label: (kind === "header" ? "En-tête du site : " : "Pied de page du site : ") + part.name, page: null, editUrl: S.urls.componentEditor + "/" + part.id + "/editeur?cadre=1", previewUrl: null };
    if (mode === "preview") { mode = "edit"; syncModes(); }
    say(cur.label + " ouvert."); load(); renderRail();
  }
  function syncModes() { $$("[data-se-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-se-mode") === mode)); }); fit(); toolbar(); }
  $$("[data-se-mode]").forEach(function (b) { b.addEventListener("click", function () {
    var m = b.getAttribute("data-se-mode"); if (m === mode) return;
    if (m === "preview" && (!cur || !cur.previewUrl)) { banner("L'aperçu par appareil est disponible pour les pages (pas pour l'en-tête ou le pied de page, qui s'affichent dans chaque page)."); return; }
    if (!confirmLeave("passer à l'aperçu")) return; banner(""); mode = m; syncModes(); load();
  }); });
  $$("[data-se-device]").forEach(function (b) { b.addEventListener("click", function () { dev = b.getAttribute("data-se-device"); $$("[data-se-device]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); }); fit(); say("Aperçu : " + b.textContent + "."); }); });

  // ---------- Rail de gauche ----------
  var TABS = [["pages", "Pages"], ["parts", "Parties globales"], ["publish", "Publication"], ["tools", "Outils"]];
  function renderTabs() {
    var box = $("[data-se-tabs]"); box.textContent = "";
    TABS.forEach(function (t) {
      var n = t[0] === "publish" ? S.pending.length : 0;
      var b = h("button", { type: "button", role: "tab", id: "se-tab-" + t[0], "aria-selected": String(tab === t[0]), "aria-controls": "se-rail", "data-se-tab": t[0], tabindex: tab === t[0] ? "0" : "-1" }, [t[1], n ? h("span", { class: "mk-st-count", text: String(n) }) : null]);
      b.addEventListener("click", function () { tab = t[0]; renderTabs(); renderRail(); if (tab === "publish" || tab === "pages") refresh(); });
      b.addEventListener("keydown", function (e) { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; var i = TABS.findIndex(function (x) { return x[0] === tab; }); i = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length; tab = TABS[i][0]; renderTabs(); renderRail(); var nb = $('[data-se-tab="' + tab + '"]'); if (nb) nb.focus(); });
      box.appendChild(b);
    });
  }
  function railPages(box) {
    box.appendChild(h("label", { class: "sr-only", for: "se-search", text: "Rechercher une page" })); var s = h("input", { id: "se-search", type: "search", placeholder: "Rechercher une page…", autocomplete: "off", value: q }); s.addEventListener("input", function () { q = s.value.trim(); var pos = s.selectionStart; renderRail(); var ns = $("#se-search"); if (ns) { ns.focus(); try { ns.setSelectionRange(pos, pos); } catch (e) { /* ignoré */ } } }); box.appendChild(s);
    var list = S.pages.filter(function (p) { return !q || norm(p.name + " " + p.slug).indexOf(norm(q)) >= 0; });
    if (!S.pages.length) box.appendChild(h("p", { class: "mk-se-none" }, ["Ce site n'a encore aucune page. ", h("a", { href: S.links.templates, text: "Importer un modèle" }), " ou ", h("a", { href: S.links.pages, text: "créer une page" }), "."]));
    else if (!list.length) box.appendChild(h("p", { class: "mk-se-none", text: "Aucune page ne correspond." }));
    var ul = h("ul", { class: "mk-se-pages", "aria-label": "Pages du site" });
    list.forEach(function (p) {
      var c = chip(p), on = cur && cur.page && cur.page.id === p.id;
      ul.appendChild(h("li", null, h("button", { type: "button", class: "mk-se-page" + (on ? " is-current" : ""), "aria-current": on ? "page" : null, "data-id": String(p.id), onclick: function () { openPage(p); } }, [h("span", { class: "mk-se-page-name", text: (p.home ? "★ " : "") + p.name }), h("span", { class: "mk-nm-chip " + c[1], text: c[0] })])));
    });
    box.appendChild(ul);
    box.appendChild(h("p", { class: "field-hint" }, [plural(S.pages.length, "page"), " · ", h("a", { href: S.links.pages, text: "Gérer les pages" }), " · ", h("a", { href: S.links.templates, text: "Importer un modèle" })]));
  }
  function railParts(box) {
    box.appendChild(h("p", { class: "field-hint", text: "L'en-tête et le pied de page sont des composants du site : les modifier met à jour toutes les pages qui les affichent." }));
    [["header", "En-tête du site", S.parts.header, S.links.header], ["footer", "Pied de page du site", S.parts.footer, S.links.footer]].forEach(function (x) {
      var card = h("div", { class: "mk-se-part" }, [h("strong", { text: x[1] })]);
      if (x[2]) { card.appendChild(h("span", { class: "field-hint", text: x[2].name + (x[2].hasDraft ? " — brouillon" : "") })); card.appendChild(h("button", { type: "button", class: "mk-wd-btn", "aria-label": "Modifier " + x[1], text: "Modifier", disabled: !S.can.edit && false, onclick: function () { openPart(x[0], x[2]); } })); }
      else card.appendChild(h("span", { class: "field-hint" }, [S.siteId ? "Aucun composant défini. " : "Le site principal compose son en-tête et son pied de page dans les réglages d'apparence. ", h("a", { href: x[3], text: S.siteId ? "Définir dans les réglages du site" : "Ouvrir les réglages" })]));
      box.appendChild(card);
    });
    var m = Object.keys(S.menus);
    box.appendChild(h("div", { class: "mk-se-part" }, [h("strong", { text: "Menus affichés" }), h("span", { class: "field-hint", text: m.length ? m.map(function (k) { return ({ header: "En-tête", footer: "Pied de page", mobile: "Mobile" }[k] || k) + " : " + S.menus[k].name; }).join(" · ") : "Aucun menu affecté : le site garde son affichage d'origine." }), h("a", { href: S.links.menus, text: "Gérer les menus →" })]));
  }
  function railPublish(box) {
    box.appendChild(h("p", { class: "field-hint", text: "Brouillons non publiés et pages pas encore en ligne. Chaque page est contrôlée avant publication (formulaire publié, formation en ligne, widgets complets…)." }));
    if (S.styles.draftCount) box.appendChild(h("p", { class: "mk-wd-banner" }, [plural(S.styles.draftCount, "réglage") + " de style en brouillon (Styles / Personnaliser) : ", h("a", { href: S.links.styles, text: "ouvrir Styles pour les publier" })]));
    if (!S.pending.length) { box.appendChild(h("p", { class: "mk-se-none", text: "Rien à publier : toutes les pages sont en ligne, sans brouillon en attente." })); return; }
    var form = h("div", { class: "mk-se-pending" });
    S.pending.forEach(function (p) {
      var id = "se-pub-" + p.id, cb = h("input", { type: "checkbox", id: id, value: String(p.id), disabled: !S.can.publish || !p.ready ? true : null }); cb.checked = p.ready && S.can.publish;
      form.appendChild(h("div", { class: "mk-se-pend" + (p.ready ? "" : " is-blocked") }, [h("label", { for: id, class: "mk-cms-check" }, [cb, " " + p.name + (p.kind === "new" ? " (nouvelle page, pas encore en ligne)" : "")]), p.ready ? null : h("ul", { class: "mk-se-errs" }, p.errors.map(function (e) { return h("li", { text: e }); }))]));
    });
    box.appendChild(form);
    var btn = h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--primary", "data-se-publish": "", text: "Publier la sélection", disabled: !S.can.publish ? true : null }); btn.addEventListener("click", publish); box.appendChild(btn);
    if (!S.can.publish) box.appendChild(h("p", { class: "field-hint", text: "Seuls les comptes autorisés à publier (pages.publish) peuvent mettre en ligne." }));
    box.appendChild(h("div", { class: "mk-se-result", "data-se-result": "", role: "status", hidden: true }));
  }
  function railTools(box) {
    box.appendChild(h("p", { class: "field-hint", text: "Les autres outils de conception du site :" }));
    var ul = h("ul", { class: "mk-se-tools" });
    [["Styles", S.links.styles, "Palette, typographie, formes, boutons"], ["Personnaliser", S.links.customizer, "Identité, en-tête, pied de page, CSS"], ["Patterns", S.links.patterns, "Compositions à insérer dans les pages"], ["Templates", S.links.templates, "Modèles de pages et de sites"], ["Menus", S.links.menus, "Navigation et emplacements"], ["Widgets", S.links.widgets, "Zones du blog et du pied de page"], ["Thèmes", S.links.themes, "Aspect général"], ["Polices", S.links.fonts, "Bibliothèque de polices"]].forEach(function (t) { ul.appendChild(h("li", null, h("a", { href: t[1] }, [h("strong", { text: t[0] }), h("span", { class: "field-hint", text: t[2] })]))); });
    box.appendChild(ul);
  }
  function renderRail() { var box = $("[data-se-railbody]"); box.textContent = ""; box.setAttribute("aria-labelledby", "se-tab-" + tab); ({ pages: railPages, parts: railParts, publish: railPublish, tools: railTools })[tab](box); }

  // ---------- Publication ----------
  function refresh() {
    return fetch(S.base + "/etat" + S.query, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { return r.json(); }).then(function (d) { if (d && d.ok) { apply(d); } });
  }
  function apply(d) { S.pages = d.pages; S.parts = d.parts; S.menus = d.menus; S.styles = d.styles; S.pending = d.pending; if (cur && cur.page) { var np = S.pages.filter(function (p) { return p.id === cur.page.id; })[0]; if (np) cur.page = np; } renderTabs(); renderRail(); toolbar(); stateText(); }
  function stateText() { var n = S.pending.length; $("[data-se-state]").textContent = n ? plural(n, "page") + " à publier" : "Tout est publié"; }
  function publish() {
    if (busy) return; var ids = $$(".mk-se-pend input:checked").map(function (c) { return Number(c.value); });
    if (!ids.length) { banner("Cochez au moins une page prête à publier."); return; }
    if (mode === "edit" && cur && editorDirty()) { banner("L'éditeur a des modifications en cours d'enregistrement : attendez « Tout est enregistré » avant de publier."); return; }
    if (!confirm("Publier " + plural(ids.length, "page") + " sur le site « " + (document.querySelector("[data-se-root] h1 + p strong") ? document.querySelector("[data-se-root] h1 + p strong").textContent : "") + " » ? Elles seront visibles par tous les visiteurs.")) return;
    busy = true; banner(""); var btn = $("[data-se-publish]"); if (btn) { btn.disabled = true; btn.textContent = "Publication…"; }
    fetch(S.base + "/publier" + S.query, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ pageIds: ids, site: S.siteId === null ? "" : String(S.siteId) }) })
      .then(function (res) { return res.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; } if (!res.ok || !d || !d.ok) throw new Error((d && d.error) || (res.status === 403 ? "Vous n'avez pas le droit de publier." : "Le serveur n'a pas pu publier (erreur " + res.status + "). Rien n'a été annoncé comme publié.")); return d; }); }, function () { throw new Error("Connexion impossible : la publication n'est pas confirmée. Vérifiez l'état des pages avant de réessayer."); })
      .then(function (d) {
        busy = false; apply(d);
        var ok = d.results.filter(function (r) { return r.ok; }), bad = d.results.filter(function (r) { return !r.ok; });
        var res = $("[data-se-result]"); if (res) { res.hidden = false; res.textContent = ""; res.appendChild(h("p", null, h("strong", { text: ok.length ? plural(ok.length, "page") + " publiée" + (ok.length > 1 ? "s" : "") + "." : "Aucune page publiée." }))); bad.forEach(function (b) { var p = S.pages.filter(function (x) { return x.id === b.id; })[0]; res.appendChild(h("p", { class: "mk-st-err", text: "Non publiée : " + (p ? p.name + " — " : "") + b.error })); }); }
        say(ok.length + " page(s) publiée(s)."); if (mode === "preview") load();
      }, function (e) { busy = false; var b = $("[data-se-publish]"); if (b) { b.disabled = false; b.textContent = "Publier la sélection"; } banner(e.message); });
  }

  // L'état (brouillons, publication) change pendant que l'éditeur enregistre automatiquement : relu régulièrement (page visible, pas de publication en cours) et au retour sur la fenêtre
  setInterval(function () { if (!document.hidden && !busy) refresh().catch(function () { /* hors ligne : la prochaine relecture réessaie */ }); }, 5000);
  window.addEventListener("focus", function () { if (!busy) refresh().catch(function () {}); });

  // ---------- Démarrage ----------
  if (S.readOnly) banner("Ce site est archivé ou supprimé : consultation seule.");
  $("[data-se-loading]").hidden = true; $("[data-se-layout]").hidden = false;
  renderTabs(); renderRail(); stateText(); toolbar(); fit();
  var first = new URLSearchParams(location.search).get("page");
  var start = first && S.pages.filter(function (p) { return String(p.id) === first; })[0];
  if (start) openPage(start);
})();

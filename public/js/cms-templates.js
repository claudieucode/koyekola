// KOLAKISA CMS → Apparence → Templates : bibliothèque de modèles d'un site. Données = JSON #tp-data posé par le serveur. L'importation passe par le serveur (une transaction, un jeton
// d'idempotence : un double clic ou une nouvelle tentative ne crée jamais les pages deux fois). Aucun succès n'est annoncé avant sa réponse.
(function () {
  var root = document.querySelector("[data-tp-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === false || v == null) return; if (k === "text") el.textContent = v; else if (k === "onclick") el.addEventListener("click", v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var S = JSON.parse(document.getElementById("tp-data").textContent);
  var source = "pack", cat = "", q = "", busy = false;
  var liveEl = $("[data-tp-live]");
  function say(t) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = t; }, 30); }
  function banner(text) { $("[data-tp-banner-text]").textContent = text || ""; $("[data-tp-banner]").hidden = !text; }
  var norm = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plural = function (n, w) { return n + " " + w + (n > 1 ? "s" : ""); };
  function token() { var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }

  // ---------- Liste ----------
  var SOURCES = [["pack", "Packs de site"], ["page", "Modèles de pages"], ["mine", "Mes modèles"], ["hist", "Imports"]];
  function items() { return S.items.filter(function (i) { return i.source === source && (!cat || i.category === cat) && (!q || norm(i.name + " " + i.category + " " + i.description).indexOf(norm(q)) >= 0); }); }
  function renderFilters() {
    var box = $("[data-tp-sources]"); box.textContent = "";
    SOURCES.forEach(function (s) {
      var n = s[0] === "hist" ? S.history.length : S.items.filter(function (i) { return i.source === s[0]; }).length;
      var b = h("button", { type: "button", role: "tab", "aria-selected": String(source === s[0]), "data-tp-source": s[0] }, [s[1] + " ", h("span", { class: "mk-st-count", text: String(n) })]);
      b.addEventListener("click", function () { source = s[0]; cat = ""; renderAll(); }); box.appendChild(b);
    });
    var sel = $("[data-tp-cat]"), cats = {}; S.items.filter(function (i) { return i.source === source; }).forEach(function (i) { cats[i.category] = 1; });
    sel.textContent = ""; sel.appendChild(h("option", { value: "", text: "Toutes les catégories" })); Object.keys(cats).sort().forEach(function (c) { sel.appendChild(h("option", { value: c, text: c, selected: cat === c ? true : null })); }); sel.disabled = source === "hist";
  }
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var f = e.target; if (!f.getAttribute("src")) f.setAttribute("src", f.getAttribute("data-src")); io.unobserve(f); } }); }, { rootMargin: "300px" }) : null;
  function previewUrl(ref, page) { return S.base + "/apercu?ref=" + encodeURIComponent(ref) + (page ? "&page=" + encodeURIComponent(page) : "") + (S.siteId ? "&site=" + S.siteId : ""); }
  function card(i) {
    var f = h("iframe", { title: "", "aria-hidden": "true", tabindex: "-1", "data-src": previewUrl(i.ref, i.pages[0].key), referrerpolicy: "same-origin", scrolling: "no" }); if (io) io.observe(f); else f.setAttribute("src", f.getAttribute("data-src"));
    var meta = [h("span", { class: "mk-nm-chip" + (i.source === "pack" ? " is-info" : ""), text: i.source === "pack" ? "Pack" : i.source === "mine" ? "Mon site" : "Page" }), " " + i.category + " · " + plural(i.pageCount, "page") + " · " + plural(i.elements, "élément")];
    var body = [h("h3", { text: i.name }), h("p", { class: "mk-pt-meta" }, meta), i.description ? h("p", { class: "field-hint", text: i.description }) : null];
    if (i.style) body.push(h("p", { class: "mk-tp-style", "aria-label": "Palette : " + i.style.paletteLabel }, [h("span", { class: "mk-st-pal-sw", "aria-hidden": "true" }, ["primary", "secondary", "background", "text"].map(function (k) { return h("i", { style: "background:" + i.style.colors[k] }); })), " " + i.style.paletteLabel]));
    if (i.lastImport) body.push(h("p", { class: "field-hint mk-tp-done", text: "Déjà importé le " + i.lastImport + " UTC" }));
    body.push(h("div", { class: "mk-pt-card-actions" }, [h("button", { type: "button", class: "mk-wd-btn", "aria-label": "Aperçu de " + i.name, text: "Aperçu", onclick: function () { openPreview(i); } }),
      h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--primary", "aria-label": "Importer " + i.name, text: "Importer", disabled: !S.can.import ? true : null, onclick: function () { openImport(i); } })]));
    return h("li", { class: "mk-pt-card", "data-ref": i.ref }, [h("div", { class: "mk-pt-thumb" }, f), h("div", { class: "mk-pt-card-body" }, body)]);
  }
  function fitThumbs() { $$(".mk-pt-thumb").forEach(function (t) { var w = t.clientWidth || 300, sc = w / 1200; t.style.height = Math.round(760 * sc) + "px"; var f = t.querySelector("iframe"); if (f) f.style.transform = "scale(" + sc + ")"; }); }
  window.addEventListener("resize", fitThumbs);
  function renderHistory() {
    var sec = $("[data-tp-history]"), ul = $("[data-tp-history-list]"); ul.textContent = "";
    S.history.forEach(function (x) { ul.appendChild(h("li", null, [h("strong", { text: x.label }), " — " + plural(x.pages, "page") + (x.menu ? " + menu" : "") + (x.styles ? " + brouillon de styles" : "") + " · " + x.at + " UTC" + (x.by ? " · " + x.by : "")])); });
    sec.hidden = source !== "hist" || !S.history.length;
  }
  function renderAll() {
    renderFilters(); var list = source === "hist" ? [] : items(), grid = $("[data-tp-grid]"); grid.textContent = "";
    list.forEach(function (i) { grid.appendChild(card(i)); }); fitThumbs(); renderHistory();
    $("[data-tp-count]").textContent = source === "hist" ? "" : plural(list.length, "modèle") + (q || cat ? " correspondant" + (list.length > 1 ? "s" : "") + " à votre recherche" : "");
    var e = $("[data-tp-empty]"); e.hidden = source === "hist" ? !!S.history.length : list.length > 0;
    e.textContent = source === "hist" ? "Aucun import pour l'instant." : source === "mine" && !S.items.some(function (i) { return i.source === "mine"; }) ? "Vous n'avez enregistré aucun modèle de page pour ce site. Dans le Page Builder, « Enregistrer comme modèle » les ajoute ici." : "Aucun modèle ne correspond à votre recherche.";
  }
  $("[data-tp-search]").addEventListener("input", function (e) { q = e.target.value.trim(); renderAll(); });
  $("[data-tp-cat]").addEventListener("change", function (e) { cat = e.target.value; renderAll(); });

  // ---------- Fenêtres ----------
  function open(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function closeAll(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; var d = $$("dialog").filter(function (x) { return x.open; })[0]; if (d) { e.preventDefault(); closeAll(d); } });
  $$("[data-tp-close]").forEach(function (b) { b.addEventListener("click", function () { closeAll(b.closest("dialog")); }); });
  var W = { desktop: 0, tablet: 768, mobile: 390 }, prev = null, prevPage = null, dev = "desktop";
  function setDevice(d) {
    dev = d; $$("[data-tp-device]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-tp-device") === d)); });
    var fr = $("[data-tp-prev-frame]"), wrap = $("[data-tp-prevwrap]"); fr.style.width = W[d] ? W[d] + "px" : "100%";
    var avail = wrap.clientWidth || 1, sc = W[d] ? Math.min(1, avail / W[d]) : 1; fr.style.transform = sc < 1 ? "scale(" + sc + ")" : "none"; fr.style.transformOrigin = "top left"; fr.style.height = Math.round(560 / sc) + "px"; wrap.style.height = "560px";
  }
  function showPage(i, key) {
    prevPage = key; $$("[data-tp-prev-tabs] button").forEach(function (b) { b.setAttribute("aria-selected", String(b.getAttribute("data-key") === key)); });
    $("[data-tp-prev-frame]").setAttribute("src", previewUrl(i.ref, key));
  }
  function openPreview(i) {
    prev = i; $("[data-tp-prev-title]").textContent = "Aperçu : " + i.name; var tabs = $("[data-tp-prev-tabs]"); tabs.textContent = "";
    i.pages.forEach(function (p) { var b = h("button", { type: "button", role: "tab", "data-key": p.key, "aria-selected": "false", text: p.name }); b.addEventListener("click", function () { showPage(i, p.key); }); tabs.appendChild(b); });
    tabs.hidden = i.pages.length < 2; $("[data-tp-prev-import]").hidden = !S.can.import; open($("[data-tp-dlg-preview]")); setDevice("desktop"); showPage(i, i.pages[0].key);
  }
  $$("[data-tp-device]").forEach(function (b) { b.addEventListener("click", function () { setDevice(b.getAttribute("data-tp-device")); }); });
  $("[data-tp-prev-import]").addEventListener("click", function () { closeAll($("[data-tp-dlg-preview]")); openImport(prev); });

  // ---------- Importation ----------
  var imp = null, impKey = null, done = null;
  function openImport(i) {
    imp = i; impKey = token(); done = null; var d = $("[data-tp-dlg-import]");
    $("[data-tp-imp-title]").textContent = "Importer : " + i.name; $("[data-tp-imp-err]").hidden = true; $("[data-tp-imp-result]").hidden = true; $("[data-tp-imp-ok]").hidden = false; $("[data-tp-imp-ok]").disabled = false; $("[data-tp-imp-ok]").textContent = "Importer";
    $("[data-tp-imp-what]").textContent = i.source === "pack" ? "Ce pack va créer " + plural(i.pageCount, "page") + " dans « " + S.siteName + " » :" : "Ce modèle va créer une page dans « " + S.siteName + " » :";
    var list = $("[data-tp-imp-list]"); list.textContent = ""; var ul = h("ul", { class: "mk-tp-pages" }); i.pages.forEach(function (p) { ul.appendChild(h("li", null, [h("strong", { text: p.name }), " — " + plural(p.sections, "section") + ", " + plural(p.elements, "élément")])); }); list.appendChild(ul);
    var single = i.source !== "pack"; $("[data-tp-imp-single]").hidden = !single; $("[data-tp-imp-name]").value = single ? i.name : "";
    var opts = $("[data-tp-imp-options]"); opts.hidden = i.source !== "pack"; var m = $("[data-tp-imp-menu]"), st = $("[data-tp-imp-styles]");
    m.checked = false; st.checked = false; m.disabled = !S.can.menu; st.disabled = !S.can.styles;
    if (i.source === "pack") { m.parentNode.title = S.can.menu ? "" : "Vous n'avez pas le droit de créer un menu"; st.parentNode.title = S.can.styles ? "" : "Vous n'avez pas le droit de modifier les styles"; }
    var warn = $("[data-tp-imp-warn]"); warn.hidden = !i.lastImport; if (i.lastImport) warn.textContent = "Ce modèle a déjà été importé dans ce site le " + i.lastImport + " UTC. Importer à nouveau créera de NOUVELLES pages (avec un numéro dans leur nom) : les pages existantes ne seront ni remplacées ni modifiées.";
    open(d);
  }
  $("[data-tp-form-import]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy || done) return; busy = true; var err = $("[data-tp-imp-err]"), ok = $("[data-tp-imp-ok]"); err.hidden = true; ok.disabled = true; ok.textContent = "Importation…";
    var body = { ref: imp.ref, importKey: impKey, name: imp.source === "pack" ? "" : $("[data-tp-imp-name]").value, menu: imp.source === "pack" && $("[data-tp-imp-menu]").checked, styles: imp.source === "pack" && $("[data-tp-imp-styles]").checked, site: S.siteId === null ? "" : String(S.siteId) };
    fetch(S.base + "/importer" + S.query, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) })
      .then(function (res) { return res.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (x) { d = null; } if (!res.ok || !d || !d.ok) throw new Error((d && d.error) || (res.status === 403 ? "Vous n'avez pas le droit d'importer des modèles." : "Le serveur n'a pas pu importer le modèle (erreur " + res.status + "). Rien n'a été créé ; vous pouvez réessayer.")); return d; }); }, function () { throw new Error("Connexion impossible : l'importation n'est peut-être pas arrivée au serveur. Vous pouvez réessayer sans risque : une même demande ne crée jamais les pages deux fois."); })
      .then(function (d) {
        busy = false; done = d.result; S.items = d.items; S.history = d.history; renderAll(); ok.hidden = true;
        var res = $("[data-tp-imp-result]"); res.textContent = ""; res.hidden = false;
        res.appendChild(h("p", null, [h("strong", { text: (d.result.replay ? "Déjà importé : " : "Importé : ") + plural(d.result.pages.length, "page") + (d.result.menu ? " + le menu « " + d.result.menu.name + " »" : "") + (d.result.styles ? " + un brouillon de styles" : "") + "." }), " Rien n'est publié."]));
        var ul = h("ul", { class: "mk-tp-pages" }); d.result.pages.forEach(function (p) { ul.appendChild(h("li", null, h("a", { href: S.links.editor + "/" + p.id + "/editeur", text: p.name + " — ouvrir dans l'éditeur" }))); }); res.appendChild(ul);
        var links = h("p", null); if (d.result.menu) links.appendChild(h("a", { href: S.links.menus, text: "Voir les menus" })); if (d.result.styles) { if (d.result.menu) links.appendChild(document.createTextNode(" · ")); links.appendChild(h("a", { href: S.links.styles, text: "Voir le brouillon de styles" })); } if (links.childNodes.length) res.appendChild(links);
        say("Modèle importé."); res.setAttribute("tabindex", "-1"); res.focus();
      }, function (x) { busy = false; ok.disabled = false; ok.textContent = "Réessayer"; err.textContent = x.message; err.hidden = false; });
  });

  // ---------- Démarrage ----------
  if (S.readOnly) banner("Ce site est archivé ou supprimé : consultation seule.");
  $("[data-tp-loading]").hidden = true; $("[data-tp-main]").hidden = false; renderAll();
})();

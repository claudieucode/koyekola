// KOLAKISA CMS → Médiathèque : gestionnaire de fichiers (le serveur rend la page ; ici : navigation fluide, vues, sélection, menus, glisser-déposer, actions, panneau d'informations).
// Toute écriture passe par l'API de la médiathèque (KWMedia) : rien n'est affiché comme fait avant la réponse réussie du serveur. Les dossiers et collections sont LOGIQUES (aucun fichier ne bouge sur le disque).
// Les rubriques calculées (accueil, doublons, stockage) et la prévisualisation sont dans media-sections.js et media-preview.js, qui s'appuient sur window.MX.
(function () {
  "use strict";
  var K = window.KWMedia, rootEl = document.querySelector("[data-mx]"), cfgEl = document.getElementById("ml-config");
  if (!K || !rootEl || !cfgEl) return;
  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var BASE = K.BASE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "text") el.textContent = v; else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : v);
    });
    [].concat(kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var toast = K.toast;
  var plural = function (n, one, many) { return n + " " + (n > 1 ? many : one); };
  var errMsg = function (e) { return (e && e.message) || "Une erreur est survenue."; };
  var spaceBase = cfg.spaceBase || rootEl.getAttribute("data-base") || location.pathname;
  rootEl.setAttribute("data-base", spaceBase);

  // =============================================================== Fenêtres (formulaires et confirmations, centrées)
  function openDialog(title, body, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var dlg = h("dialog", { class: "mk-dialog mk-modal" + (o.wide ? " mk-modal-wide" : " mk-dialog-sm"), "aria-labelledby": "mx-dlg-t" });
      var form = h("form", { method: "dialog" });
      var close = function (v) { try { dlg.close(); } catch (e) { /* déjà fermée */ } dlg.remove(); resolve(v); };
      var ok = h("button", { type: "submit", class: "btn " + (o.danger ? "btn-danger" : "btn-primary") + " btn-sm", text: o.ok || "Valider" });
      form.appendChild(h("header", { class: "mk-dialog-head" }, [h("div", { class: "mk-dialog-titles" }, [h("h2", { id: "mx-dlg-t", text: title }), o.lead ? h("p", { class: "field-hint", text: o.lead }) : null]), h("button", { type: "button", class: "mk-dialog-close", "aria-label": "Fermer", text: "×", onclick: function () { close(null); } })]));
      form.appendChild(h("div", { class: "mk-dialog-body" }, body));
      form.appendChild(h("div", { class: "mk-dialog-actions" }, [h("button", { type: "button", class: "btn btn-outline btn-sm", text: o.cancel || "Annuler", onclick: function () { close(null); } }), o.noOk ? null : ok]));
      form.addEventListener("submit", function (e) { e.preventDefault(); var v = o.collect ? o.collect() : true; if (v === undefined) return; close(v); });
      dlg.appendChild(form); dlg.addEventListener("cancel", function (e) { e.preventDefault(); close(null); });
      document.body.appendChild(dlg); dlg.showModal();
      var first = $("input:not([type=hidden]), select, textarea", dlg); if (first) { first.focus(); if (first.select && first.type === "text") first.select(); }
    });
  }
  function askText(title, o) {
    o = o || {};
    var input = h("input", { type: "text", id: "mx-ask", maxlength: o.max || "80", value: o.value || "", placeholder: o.placeholder || "", autocomplete: "off" });
    var body = h("div", { class: "field-group" }, [h("label", { for: "mx-ask", text: o.label || "Nom" }), input, o.hint ? h("p", { class: "field-hint", text: o.hint }) : null]);
    return openDialog(title, body, { ok: o.ok, collect: function () { var v = input.value.trim(); if (!v && !o.empty) { input.focus(); return undefined; } return v; } });
  }
  function confirmDialog(title, text, ok, danger) { return openDialog(title, h("p", { text: text }), { ok: ok || "Confirmer", danger: danger }).then(function (v) { return v === true; }); }

  // Choisir un dossier de destination (arbre) : renvoie un numéro, null (racine) ou undefined (annulé)
  function pickFolder(title, o) {
    o = o || {};
    var folders = cfg.folders || [], chosen = o.current === undefined ? null : o.current, ex = o.exclude || new Set();
    var kids = function (pid) { return folders.filter(function (f) { return (f.parentId || null) === pid; }); };
    var list = h("div", { class: "mx-pick", role: "radiogroup", "aria-label": "Dossier de destination" });
    var row = function (id, name, depth, off) {
      var b = h("label", { class: "mx-pick-row" + (off ? " is-off" : ""), style: "padding-left:" + (8 + depth * 18) + "px" }, [h("input", { type: "radio", name: "mx-pick", value: id === null ? "" : String(id), checked: chosen === id ? "" : null, disabled: off ? "" : null }), h("span", { text: name })]);
      list.appendChild(b);
    };
    row(null, "Sans dossier (racine)", 0, false);
    (function walk(pid, depth) { kids(pid).forEach(function (f) { row(f.id, f.name, depth + 1, ex.has(f.id)); walk(f.id, depth + 1); }); })(null, 0);
    return openDialog(title, list, { ok: o.ok || "Déplacer ici", lead: o.lead, collect: function () { var r = $("input[name=mx-pick]:checked", list); return r ? (r.value === "" ? { id: null } : { id: Number(r.value) }) : undefined; } }).then(function (v) { return v ? v.id : undefined; });
  }

  // =============================================================== Préférences (par personne et par site)
  var prefs = cfg.prefs || {}, saveTimer = null, pending = {};
  function savePrefs(patch) {
    Object.keys(patch).forEach(function (k) { prefs[k] = patch[k]; pending[k] = patch[k]; });
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { var p = pending; pending = {}; K.api("POST", BASE + "/preferences", p).catch(function () { /* préférence non enregistrée : l'affichage reste correct pour cette session */ }); }, 350);
  }

  // ----- Apparence (couleurs libres, rayon, espacement, taille d'icônes) : enregistrée par personne et par site -----
  var PRESETS = {
    clair: { sideBg: "#0d2238", mainBg: "#ffffff", text: "#0b2a40", textSoft: "#5b6b7b", icon: "#9fb0c4", sep: "#2a4058", sel: "#e3eefa", hover: "#eaf1f8", folder: "#4f8fd6", accent: "#0a74b5", border: "#dbe3ec", badge: "#2a4058" },
    sombre: { sideBg: "#08131f", mainBg: "#0f1b2a", text: "#e6edf6", textSoft: "#9fb0c4", icon: "#9fb0c4", sep: "#22364b", sel: "#1d4670", hover: "#16283b", folder: "#6fb4ff", accent: "#6fb4ff", border: "#22364b", badge: "#22364b" }
  };
  function themeOf() { var t = prefs.theme || {}; return { mode: t.mode === "sombre" || t.mode === "personnalise" ? t.mode : "clair", colors: t.colors || {}, radius: t.radius == null ? 8 : t.radius, space: t.space == null ? 100 : t.space, iconSize: t.iconSize == null ? 16 : t.iconSize }; }
  function themeColor(t, k) { return t.colors[k] || (PRESETS[t.mode] || PRESETS.clair)[k]; }
  function lum(hex) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function applyTheme() {
    var t = themeOf(), st = rootEl.style, c = function (k) { return themeColor(t, k); };
    var custom = t.mode !== "clair" || Object.keys(t.colors).length > 0, vars = {};
    if (custom) {
      var darkSide = lum(c("sideBg")) < 0.55;
      vars = { "--mx-bg": c("mainBg"), "--mx-text": c("text"), "--mx-muted": c("textSoft"), "--mx-sel": c("sel"), "--mx-hover": c("hover"), "--mx-folder": c("folder"), "--mx-accent": c("accent"), "--mx-accent-ink": c("accent"), "--mx-line": c("border"), "--mx-badge": c("badge"),
        "--mxs-bg": c("sideBg"), "--mxs-icon": c("icon"), "--mxs-sep": c("sep"), "--mxs-folder": c("folder"), "--mxs-text": darkSide ? "#e6edf6" : c("text"), "--mxs-muted": darkSide ? "#9fb0c4" : c("textSoft") };
      // survol, sélection et accent de la barre latérale : seulement si la personne les a choisis elle-même (les valeurs du thème clair sont pensées pour la zone centrale)
      if (t.colors.hover) vars["--mxs-hover"] = t.colors.hover; if (t.colors.sel) vars["--mxs-sel"] = t.colors.sel; if (t.colors.accent) vars["--mxs-accent"] = t.colors.accent;
    }
    var sideEl = $("[data-mx-side]", rootEl);
    ["--mx-bg", "--mx-text", "--mx-muted", "--mx-sel", "--mx-hover", "--mx-folder", "--mx-accent", "--mx-accent-ink", "--mx-line", "--mx-badge"].forEach(function (k) { if (vars[k]) st.setProperty(k, vars[k]); else st.removeProperty(k); });
    ["--mxs-bg", "--mxs-icon", "--mxs-sep", "--mxs-folder", "--mxs-text", "--mxs-muted", "--mxs-hover", "--mxs-sel", "--mxs-accent"].forEach(function (k) { if (!sideEl) return; if (vars[k]) sideEl.style.setProperty(k, vars[k]); else sideEl.style.removeProperty(k); });
    st.setProperty("--mx-radius", t.radius + "px"); st.setProperty("--mx-space", String(t.space / 100)); st.setProperty("--mx-icon", t.iconSize + "px");
  }
  function themeSave(patch) { var t = themeOf(); var next = { mode: t.mode, colors: Object.assign({}, t.colors), radius: t.radius, space: t.space, iconSize: t.iconSize }; patch(next); savePrefs({ theme: next }); applyTheme(); syncThemeUi(); }
  function syncThemeUi() {
    var pop = $("[data-mx-theme]", rootEl); if (!pop) return; var t = themeOf();
    $$("[data-mx-theme-color]", pop).forEach(function (i) { i.value = themeColor(t, i.getAttribute("data-mx-theme-color")); });
    $$("[data-mx-theme-mode]", pop).forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-mx-theme-mode") === t.mode ? "true" : "false"); });
    ["radius", "space", "iconSize"].forEach(function (k) { var r = $("[data-mx-theme-range=" + k + "]", pop), o = $("[data-mx-theme-out=" + k + "]", pop); if (r) r.value = t[k]; if (o) o.textContent = k === "space" ? t[k] + " %" : t[k] + " px"; });
  }
  var themeSnapshot = null;
  function applyPrefs() {
    if (prefs.sidebar === "hidden") prefs.sidebar = "rail";
    rootEl.setAttribute("data-sidebar", prefs.sidebar || "open"); syncCollapse(); applyTheme(); rootEl.setAttribute("data-info", prefs.info || "closed"); rootEl.setAttribute("data-density", prefs.density || "confortable");
    rootEl.style.setProperty("--mx-size", (prefs.size || 160) + "px"); rootEl.style.setProperty("--mx-info-w", (prefs.infoWidth || 340) + "px");
    var cols = prefs.columns || [];
    rootEl.className = rootEl.className.replace(/\bhas-c-\w+/g, "").replace(/\s+/g, " ").trim();
    cols.forEach(function (c) { rootEl.classList.add("has-c-" + c); });
    setView(cfg.view || prefs.view || "grille", true);
    $$("[data-mx-view]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mx-view") === (cfg.view || prefs.view))); });
    var size = $("[data-mx-size]"); if (size) size.value = prefs.size || 160;
    var ib = $("[data-mx-info-toggle]"); if (ib) ib.setAttribute("aria-pressed", String(prefs.info === "open"));
    $$("[data-mx-col]").forEach(function (c) { c.checked = cols.indexOf(c.value) >= 0; });
    var den = $("[data-mx-density]"); if (den) den.checked = prefs.density === "compacte";
  }
  function setView(v, quiet) {
    cfg.view = v; rootEl.setAttribute("data-view", v);
    var ul = $("[data-mx-items]", rootEl);
    if (ul) { ul.setAttribute("data-view", v); var list = v === "liste" || v === "details"; ul.removeAttribute("data-ml-list"); ul.removeAttribute("data-ml-grid"); ul.setAttribute(list ? "data-ml-list" : "data-ml-grid", ""); $$("img", ul).forEach(function (img) { var it = img.closest("[data-ml-item]"); }); }
    var colBtn = $("[data-mx-cols]"); if (colBtn) colBtn.hidden = !(v === "liste" || v === "details");
    if (!quiet) { $$("[data-mx-view]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mx-view") === v)); }); savePrefs({ view: v }); }
  }
  function small() { return window.matchMedia("(max-width: 900px)").matches; }
  document.addEventListener("click", function (e) { if (rootEl.getAttribute("data-drawer") === "open" && !e.target.closest("[data-mx-side], [data-mx-side-toggle]")) rootEl.removeAttribute("data-drawer"); });
  function fitHeight() { var top = rootEl.getBoundingClientRect().top + window.scrollY; rootEl.style.setProperty("--mx-h", Math.max(480, window.innerHeight - (top - window.scrollY) - 16) + "px"); }

  // =============================================================== Navigation fluide (le serveur rend le fragment ; on remplace barre latérale, en-tête, contenu)
  var navAbort = null, navSeq = 0;
  function readCfg(doc) { var el = doc.getElementById("ml-config") || doc.querySelector("#ml-config"); if (!el) return null; try { return JSON.parse(el.textContent); } catch (e) { return null; } }
  function swap(doc) {
    ["side", "head", "body"].forEach(function (k) {
      var src = $('[data-frag="' + k + '"]', doc), dst = $('[data-frag="' + k + '"]', rootEl);
      if (src && dst) dst.innerHTML = src.innerHTML;
    });
    var next = readCfg(doc); if (next) { next.spaceBase = spaceBase; var keepPrefs = prefs; cfg = next; cfg.prefs = keepPrefs; cfgEl.textContent = JSON.stringify(cfg); }
  }
  function go(href, o) {
    o = o || {};
    var u = new URL(href, location.href), shown = u.pathname + u.search; u.searchParams.set("fragment", "1");
    if (navAbort) navAbort.abort(); navAbort = new AbortController(); var mine = ++navSeq;
    rootEl.setAttribute("aria-busy", "true");
    return fetch(u.toString(), { credentials: "same-origin", signal: navAbort.signal, headers: { Accept: "text/html" } }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.text();
    }).then(function (html) {
      if (mine !== navSeq) return;
      swap(new DOMParser().parseFromString(html, "text/html"));
      if (o.replace) history.replaceState({ mx: 1 }, "", shown); else if (!o.pop) history.pushState({ mx: 1 }, "", shown);
      afterRender(!o.quiet);
    }).catch(function (e) { if (e && e.name === "AbortError") return; location.href = href; /* secours : navigation classique */ })
      .then(function () { if (mine === navSeq) rootEl.removeAttribute("aria-busy"); });
  }
  function refresh() { return go(location.pathname + location.search, { replace: true, quiet: true }); }
  window.addEventListener("popstate", function () { go(location.pathname + location.search, { pop: true }); });
  rootEl.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || u.pathname !== new URL(spaceBase, location.origin).pathname) return;
    e.preventDefault(); closeMenu(); rootEl.removeAttribute("data-drawer"); go(a.href);
  });
  rootEl.addEventListener("submit", function (e) {
    var f = e.target.closest("[data-mx-filters]"); if (!f) return;
    e.preventDefault();
    var p = new URLSearchParams(); new FormData(f).forEach(function (v, k) { if (String(v).trim() !== "" && k !== "site" && k !== "fragment") p.append(k, String(v).trim()); });
    if (p.get("tri") === "recent") p.delete("tri");
    var d = $("details[open].mx-pop", f); if (d) d.removeAttribute("open");
    go(spaceBase + (p.toString() ? "?" + p : ""));
  });
  rootEl.addEventListener("change", function (e) {
    if (e.target.id === "ml-tri") { var f = e.target.form; if (f) f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); }
  });

  // =============================================================== Sélection
  var sel = new Set(), selF = new Set(), anchor = null;
  function selecting() { return rootEl.hasAttribute("data-selecting"); }
  function itemEls() { return $$("[data-ml-item]", rootEl); }
  function itemEl(id) { return $('[data-ml-item][data-id="' + id + '"]', rootEl); }
  function folderEl(id) { return $('.mx-folder[data-mx-folder="' + id + '"]', rootEl); }
  function dataOf(el) { return { id: Number(el.getAttribute("data-id")), name: el.getAttribute("data-name") || "", type: el.getAttribute("data-type"), size: Number(el.getAttribute("data-size")) || 0, path: el.getAttribute("data-path") || "", folderId: Number(el.getAttribute("data-folder")) || null, starred: el.getAttribute("data-mx-star-state") === "1" }; }
  function paintSelection() {
    itemEls().forEach(function (el) { var on = sel.has(Number(el.getAttribute("data-id"))); el.classList.toggle("is-selected", on); var c = $("[data-ml-check]", el); if (c) c.checked = on; });
    $$(".mx-folder[data-mx-folder]", rootEl).forEach(function (el) { el.classList.toggle("is-selected", selF.has(Number(el.getAttribute("data-mx-folder")))); });
    if (sel.size || selF.size) rootEl.setAttribute("data-selecting", ""); else if (!$("[data-ml-select-toggle][aria-pressed=true]")) rootEl.removeAttribute("data-selecting");
    renderBulk(); if (prefs.info === "open") renderInfo();
  }
  function clearSelection() { sel.clear(); selF.clear(); anchor = null; paintSelection(); }
  function selectOnly(id) { sel.clear(); selF.clear(); sel.add(id); anchor = id; paintSelection(); }
  function toggle(id) { if (sel.has(id)) sel["delete"](id); else sel.add(id); anchor = id; paintSelection(); }
  function range(toId) {
    var ids = itemEls().map(function (el) { return Number(el.getAttribute("data-id")); }), a = ids.indexOf(anchor === null ? toId : anchor), b = ids.indexOf(toId);
    if (a < 0 || b < 0) return toggle(toId);
    sel.clear(); ids.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(function (i) { sel.add(i); }); paintSelection();
  }
  function selectedData() { return Array.from(sel).map(function (id) { var el = itemEl(id); return el ? dataOf(el) : null; }).filter(Boolean); }
  var selectToggle = function () { return $("[data-ml-select-toggle]"); };
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-ml-select-toggle]"); if (!t || !rootEl.contains(t)) return;
    var on = t.getAttribute("aria-pressed") !== "true"; t.setAttribute("aria-pressed", String(on)); t.textContent = on ? "Annuler la sélection" : "Sélection groupée";
    if (on) rootEl.setAttribute("data-selecting", ""); else { clearSelection(); rootEl.removeAttribute("data-selecting"); }
  });
  rootEl.addEventListener("change", function (e) {
    var c = e.target.closest("[data-ml-check]"); if (c) { var id = Number(c.value); if (c.checked) { sel.add(id); anchor = id; } else sel["delete"](id); paintSelection(); return; }
    var all = e.target.closest("[data-ml-all]"); if (all) { if (all.checked) itemEls().forEach(function (el) { sel.add(Number(el.getAttribute("data-id"))); }); else sel.clear(); paintSelection(); }
  });
  // Clic sur un fichier : le sélectionne (Maj : plage ; Ctrl / Cmd : ajoute) ; double-clic : aperçu
  rootEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-mx-star], [data-mx-more], [data-ml-check], a, input, select, textarea, label")) return;
    var item = e.target.closest("[data-ml-item]");
    if (item) {
      var id = Number(item.getAttribute("data-id"));
      closeMenu();
      if (e.shiftKey) range(id); else if (e.metaKey || e.ctrlKey || selecting()) toggle(id); else { selF.clear(); selectOnly(id); if (prefs.info !== "open" && window.matchMedia("(max-width: 900px)").matches) openInfo(true); }
      return;
    }
    var fo = e.target.closest(".mx-folder[data-mx-folder]");
    if (fo && !fo.classList.contains("is-trashed")) { if (e.metaKey || e.ctrlKey || e.shiftKey || selecting()) { e.preventDefault(); var fid = Number(fo.getAttribute("data-mx-folder")); if (selF.has(fid)) selF["delete"](fid); else selF.add(fid); paintSelection(); } return; }
    if (e.target.closest("[data-mx-scroll]") && !e.target.closest(".mx-bulk, .mx-banner, .mx-section, .mx-sec-title, .mx-colhead, .mx-pager")) { if (sel.size || selF.size) clearSelection(); }
  }, true);
  rootEl.addEventListener("dblclick", function (e) { var item = e.target.closest("[data-ml-item]"); if (item && !e.target.closest("[data-mx-star], [data-mx-more], input")) openPreview(Number(item.getAttribute("data-id"))); });
  rootEl.addEventListener("click", function (e) {
    var st = e.target.closest("[data-mx-star]"); if (!st) return;
    e.preventDefault(); e.stopPropagation();
    var el = st.closest("[data-ml-item], .mx-folder"), isFolder = st.getAttribute("data-mx-star") === "folder", id = Number(isFolder ? el.getAttribute("data-mx-folder") : el.getAttribute("data-id"));
    setStar(isFolder ? "folder" : "media", id, st.getAttribute("aria-pressed") !== "true");
  });
  function setStar(kind, id, on) {
    return K.api("POST", BASE + "/favoris", { kind: kind, id: id, on: on }).then(function () {
      var el = kind === "folder" ? folderEl(id) : itemEl(id);
      if (el) { var b = $("[data-mx-star]", el); if (b) { b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", String(on)); b.innerHTML = starSvg(on); } el.setAttribute("data-mx-star-state", on ? "1" : "0"); }
      toast(on ? "Ajouté aux favoris." : "Retiré des favoris.", "ok");
      if (cfg.pageKey === "favoris" && !on && el && kind === "media") refresh();
    }, function (e) { toast(errMsg(e), "error"); });
  }
  function starSvg(on) { return '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="' + (on ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>'; }

  // =============================================================== Actions
  function openPreview(id) {
    var list = itemEls().map(dataOf), i = list.findIndex(function (m) { return m.id === id; });
    if (window.MXPreview && i >= 0) return window.MXPreview.open(list, i);
    selectOnly(id); openInfo(true);
  }
  function download(items) {
    if (items.length === 1) { var a = h("a", { href: items[0].path, download: items[0].name }); document.body.appendChild(a); a.click(); a.remove(); return; }
    var u = K.withSite(BASE + "/telecharger.zip?ids=" + items.map(function (m) { return m.id; }).join(","));
    var a2 = h("a", { href: u, download: "" }); document.body.appendChild(a2); a2.click(); a2.remove();
    toast("Archive de " + plural(items.length, "fichier", "fichiers") + " en préparation…", "ok");
  }
  function usageOf(ids) {
    var cap = ids.slice(0, 25);
    return Promise.all(cap.map(function (id) { return K.detail(id).then(function (d) { return { id: id, name: d.media.name, usage: d.usage }; }, function () { return { id: id, name: "#" + id, usage: [] }; }); })).then(function (rows) { return rows.filter(function (r) { return r.usage.length; }); });
  }
  function bulkRun(action, ids, doneText) {
    return K.bulk(action, ids).then(function (r) {
      var msg = plural(r.done.length, "fichier traité", "fichiers traités") + (doneText ? " : " + doneText : ".");
      if (r.failed.length) msg += " " + plural(r.failed.length, "refusé", "refusés") + " : " + r.failed.map(function (f) { return "« " + f.name + " » : " + f.message; }).join(" · ");
      toast(msg, r.failed.length ? "error" : "ok"); clearSelection(); return refresh();
    }, function (e) { toast(errMsg(e), "error"); });
  }
  function trashFiles(items) {
    var ids = items.map(function (m) { return m.id; });
    return usageOf(ids).then(function (used) {
      var text = items.length === 1 ? "« " + items[0].name + " » ira à la corbeille ; vous pourrez le restaurer." : plural(items.length, "fichier ira", "fichiers iront") + " à la corbeille ; vous pourrez les restaurer.";
      if (used.length) text += " Attention : " + used.slice(0, 3).map(function (u) { return "« " + u.name + " » est utilisé par " + u.usage.slice(0, 2).map(function (x) { return x.kind + " « " + x.name + " »"; }).join(", "); }).join(" ; ") + (used.length > 3 ? " (et " + (used.length - 3) + " autre(s))" : "") + ". Ces contenus continuent de l'afficher tant qu'il est à la corbeille.";
      return confirmDialog("Mettre à la corbeille ?", text, "Mettre à la corbeille", false);
    }).then(function (ok) { if (ok) return bulkRun("corbeille", ids, "à la corbeille."); });
  }
  function purgeFiles(items) {
    var ids = items.map(function (m) { return m.id; });
    return confirmDialog("Supprimer définitivement ?", plural(ids.length, "fichier sera effacé", "fichiers seront effacés") + " pour de bon : cette action est irréversible. Un fichier encore utilisé par une page, un article ou un e-mail est refusé.", "Supprimer définitivement", true).then(function (ok) { if (ok) return bulkRun("supprimer", ids, "supprimés."); });
  }
  function restoreFiles(items) { return bulkRun("restaurer", items.map(function (m) { return m.id; }), "restaurés."); }
  function moveFiles(items, to) {
    var go2 = function (dest) { if (dest === undefined) return; return K.move(items.map(function (m) { return m.id; }), dest).then(function (r) { var msg = plural(r.done.length, "fichier déplacé", "fichiers déplacés") + "."; if (r.failed.length) msg += " Refusé : " + r.failed.map(function (f) { return "« " + f.name + " » : " + f.message; }).join(" · "); toast(msg, r.failed.length ? "error" : "ok"); clearSelection(); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); };
    if (to !== undefined) return go2(to);
    return pickFolder(items.length === 1 ? "Déplacer « " + items[0].name + " »" : "Déplacer " + plural(items.length, "fichier", "fichiers"), { current: items[0] && items.every(function (m) { return m.folderId === items[0].folderId; }) ? items[0].folderId : undefined }).then(go2);
  }
  function renameFile(m) { return askText("Renommer le fichier", { value: m.name, max: 120, label: "Nouveau nom" }).then(function (name) { if (!name || name === m.name) return; return K.update(m.id, { name: name }).then(function () { toast("Fichier renommé.", "ok"); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); }); }
  function copyFile(m) { return K.api("POST", BASE + "/" + m.id + "/copier", {}).then(function (r) { toast("Copie créée : « " + r.media.name + " ».", "ok"); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); }
  function copyText(text, ok) { return K.copy(text).then(function () { toast(ok, "ok"); }, function () { toast("Copie automatique impossible : sélectionnez le texte et faites Ctrl+C.", "error"); }); }
  function tagDialog(items) {
    var ids = items.map(function (m) { return m.id; });
    return K.api("GET", BASE + "/tags.json").then(function (r) {
      var existing = r.tags, input = h("input", { type: "text", id: "mx-newtag", maxlength: "40", placeholder: "Nouveau tag (séparez par des virgules)", autocomplete: "off" });
      var boxes = existing.map(function (t) { return h("label", { class: "mx-check-row" }, [h("input", { type: "checkbox", value: t.name }), " " + t.name + " (" + t.count + ")"]); });
      var body = h("div", {}, [h("div", { class: "mx-tagpick" }, boxes.length ? boxes : [h("p", { class: "field-hint", text: "Aucun tag pour l'instant : créez-en un ci-dessous." })]), h("div", { class: "field-group" }, [h("label", { for: "mx-newtag", text: "Ajouter" }), input])]);
      return openDialog("Étiqueter " + plural(items.length, "fichier", "fichiers"), body, { ok: "Appliquer les tags", collect: function () { var add = $$("input[type=checkbox]:checked", body).map(function (c) { return c.value; }).concat(input.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean)); if (!add.length) { input.focus(); return undefined; } return add; } }).then(function (add) {
        if (!add) return; return K.api("POST", BASE + "/etiqueter", { ids: ids, add: add }).then(function (res) { toast(plural(res.done.length, "fichier étiqueté", "fichiers étiquetés") + ".", res.failed.length ? "error" : "ok"); clearSelection(); return refresh(); });
      });
    }).catch(function (e) { toast(errMsg(e), "error"); });
  }
  function collectionDialog(items) {
    var ids = items.map(function (m) { return m.id; });
    return K.api("GET", BASE + "/collections.json").then(function (r) {
      var input = h("input", { type: "text", id: "mx-newcol", maxlength: "60", placeholder: "Ou créer une nouvelle collection", autocomplete: "off" });
      var radios = r.collections.map(function (c) { return h("label", { class: "mx-check-row" }, [h("input", { type: "radio", name: "mx-col", value: String(c.id) }), " " + c.name + " (" + c.count + ")"]); });
      var body = h("div", {}, [h("div", { class: "mx-tagpick" }, radios.length ? radios : [h("p", { class: "field-hint", text: "Aucune collection pour l'instant." })]), h("div", { class: "field-group" }, [h("label", { for: "mx-newcol", text: "Nouvelle collection" }), input])]);
      return openDialog("Ajouter à une collection", body, { ok: "Ajouter", lead: "Une collection regroupe des fichiers sans les déplacer.", collect: function () { var rad = $("input[name=mx-col]:checked", body), name = input.value.trim(); if (!rad && !name) { input.focus(); return undefined; } return name ? { name: name } : { id: Number(rad.value) }; } }).then(function (v) {
        if (!v) return;
        var ensure = v.name ? K.api("POST", BASE + "/collections", { name: v.name }).then(function (x) { return x.collection.id; }) : Promise.resolve(v.id);
        return ensure.then(function (cid) { return K.api("POST", BASE + "/collections/" + cid + "/ajouter", { ids: ids }); }).then(function (res) { toast(plural(res.done.length, "fichier ajouté", "fichiers ajoutés") + " à la collection.", "ok"); clearSelection(); return refresh(); });
      });
    }).catch(function (e) { toast(errMsg(e), "error"); });
  }
  function starFiles(items, on) { return Promise.all(items.map(function (m) { return K.api("POST", BASE + "/favoris", { kind: "media", id: m.id, on: on }); })).then(function () { toast(on ? "Ajoutés aux favoris." : "Retirés des favoris.", "ok"); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); }

  // ---- Dossiers
  var folderById = function (id) { id = Number(id); return (cfg.folders || []).filter(function (f) { return Number(f.id) === id; })[0] || null; };
  function descendantsOf(id) { var out = new Set([id]), grew = true; while (grew) { grew = false; (cfg.folders || []).forEach(function (f) { if (f.parentId && out.has(f.parentId) && !out.has(f.id)) { out.add(f.id); grew = true; } }); } return out; }
  function folderPath(id) { var out = [], cur = folderById(id), n = 0; while (cur && n++ < 12) { out.unshift(cur.name); cur = cur.parentId ? folderById(cur.parentId) : null; } return "Médiathèque / " + out.join(" / "); }
  function newFolder(parentId) {
    return askText("Nouveau dossier", { label: "Nom du dossier", placeholder: "Ex. Photos produits" }).then(function (name) { if (!name) return; return K.folderCreate(name, parentId === undefined ? cfg.folder : parentId, cfg.category).then(function (f) { toast("Dossier « " + f.name + " » créé" + (cfg.category && !(parentId === undefined ? cfg.folder : parentId) ? " dans " + (cfg.pageTitle || "cette catégorie") : "") + ".", "ok"); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); });
  }
  function renameFolder(id) { var f = folderById(id); if (!f) { toast("Ce dossier n'est plus dans la liste : actualisation.", "error"); return refresh(); } return askText("Renommer le dossier", { value: f.name }).then(function (name) { if (!name || name === f.name) return; return K.folderRename(id, name).then(function () { toast("Dossier renommé.", "ok"); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); }); }
  function folderProps(id) {
    var f = folderById(id); if (!f) return;
    return K.api("GET", BASE + "/dossiers/" + id + "/proprietes.json").then(function (r) {
      var p = r.properties, color = f.color || "", desc = h("textarea", { id: "mx-fdesc", rows: "3", maxlength: "300", text: p.description || "" }); desc.value = p.description || "";
      var ICONS = [["", "Dossier"], ["image", "Image"], ["video", "Vidéo"], ["music", "Audio"], ["fileText", "Document"], ["star", "Étoile"], ["heart", "Cœur"], ["home", "Maison"], ["briefcase", "Mallette"], ["book", "Livre"], ["globe", "Globe"], ["cart", "Boutique"], ["gallery", "Galerie"], ["hardDrive", "Archive"], ["shield", "Bouclier"]];
      var ficon = h("select", { id: "mx-ficon" }, ICONS.map(function (o) { return h("option", { value: o[0], text: o[1] }); })); ficon.value = p.icon || "";
      var sw = ["", "bleu", "vert", "orange", "rouge", "violet", "jaune", "rose", "gris"].map(function (c) { return h("label", { class: "mx-swatch", "data-color": c || null, title: c || "Aucune" }, [h("input", { type: "radio", name: "mx-fcolor", value: c, checked: c === color ? "" : null }), h("span", { class: "sr-only", text: c || "Aucune couleur" })]); });
      var nameIn = h("input", { type: "text", id: "mx-fname", maxlength: "120", autocomplete: "off" }); nameIn.value = f.name;
      var body = h("div", {}, [
        h("div", { class: "field-group" }, [h("label", { for: "mx-fname", text: "Nom du dossier" }), nameIn]),
        h("dl", { class: "mx-dl" }, [h("dt", { text: "Chemin" }), h("dd", { text: p.path }), h("dt", { text: "Contenu" }), h("dd", { text: plural(p.files, "fichier", "fichiers") + " (" + plural(p.subfolders, "sous-dossier", "sous-dossiers") + ")" }), h("dt", { text: "Taille" }), h("dd", { text: K.fmtSize(p.bytes) }), h("dt", { text: "Créé le" }), h("dd", { text: K.fmtDate(p.createdAt) })]),
        h("div", { class: "field-group" }, [h("label", { text: "Couleur" }), h("div", { class: "mx-swatches" }, sw)]),
        h("div", { class: "field-group" }, [h("label", { for: "mx-ficon", text: "Icône" }), ficon]),
        h("div", { class: "field-group" }, [h("label", { for: "mx-fdesc", text: "Description" }), desc]),
      ]);
      return openDialog("Propriétés du dossier « " + f.name + " »", body, { ok: "Enregistrer", collect: function () { var c = $("input[name=mx-fcolor]:checked", body); return { name: nameIn.value, color: c ? c.value : color, description: desc.value, icon: ficon.value }; } }).then(function (v) { if (!v) return; return K.api("POST", BASE + "/dossiers/" + id + "/meta", v).then(function () { toast("Dossier mis à jour.", "ok"); return refresh(); }); });
    }).catch(function (e) { toast(errMsg(e), "error"); });
  }
  function trashFolder(id) {
    var f = folderById(id); if (!f) return;
    return confirmDialog("Mettre le dossier à la corbeille ?", "« " + f.name + " », ses sous-dossiers et " + plural(f.count, "fichier", "fichiers") + " (hors sous-dossiers) iront à la corbeille. Vous pourrez tout restaurer d'un geste. Les contenus qui utilisent ces fichiers continuent de les afficher.", "Mettre à la corbeille", false).then(function (ok) {
      if (!ok) return; return K.api("POST", BASE + "/dossiers/" + id + "/corbeille", {}).then(function (r) { toast("Dossier à la corbeille (" + plural(r.files, "fichier", "fichiers") + ").", "ok"); if (cfg.folder && descendantsOf(id).has(cfg.folder)) return go(spaceBase); return refresh(); }, function (e) { toast(errMsg(e), "error"); });
    });
  }
  function dissolveFolder(id) {
    var f = folderById(id); if (!f) return;
    return confirmDialog("Supprimer le dossier sans ses fichiers ?", "Le dossier « " + f.name + " » disparaît ; ses fichiers et sous-dossiers remontent d'un niveau. Aucun fichier n'est supprimé.", "Supprimer le dossier", true).then(function (ok) { if (!ok) return; return K.folderDelete(id).then(function () { toast("Dossier supprimé ; ses fichiers sont conservés.", "ok"); if (cfg.folder && descendantsOf(id).has(cfg.folder)) return go(spaceBase); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); });
  }
  function moveFolders(ids, to) {
    var run = function (dest) { if (dest === undefined) return; return Promise.all(ids.map(function (id) { return K.api("POST", BASE + "/dossiers/" + id, { parent_id: dest }); })).then(function () { toast(plural(ids.length, "dossier déplacé", "dossiers déplacés") + ".", "ok"); selF.clear(); return refresh(); }, function (e) { toast(errMsg(e), "error"); }); };
    if (to !== undefined) return run(to);
    var ex = new Set(); ids.forEach(function (id) { descendantsOf(id).forEach(function (d) { ex.add(d); }); });
    return pickFolder("Déplacer " + (ids.length === 1 ? "le dossier « " + (folderById(ids[0]) || {}).name + " »" : plural(ids.length, "dossier", "dossiers")), { exclude: ex }).then(run);
  }
  function starFolder(id) { var f = folderById(id); return setStar("folder", id, !(f && f.starred)).then(function () { if (f) f.starred = !f.starred; return refresh(); }); }

  // =============================================================== Menu contextuel
  var menuEl = null;
  function closeMenu() { if (menuEl) { var m = menuEl; menuEl = null; m.remove(); document.removeEventListener("keydown", menuKeys, true); } }
  function menuKeys(e) {
    if (!menuEl) return;
    var btns = $$("button:not(:disabled)", menuEl), i = btns.indexOf(document.activeElement);
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeMenu(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); (btns[(i + 1) % btns.length] || btns[0]).focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); (btns[(i - 1 + btns.length) % btns.length] || btns[0]).focus(); }
    else if (e.key === "Tab") closeMenu();
  }
  function openMenu(x, y, entries, label) {
    closeMenu();
    var m = h("div", { class: "mx-menu", role: "menu", "aria-label": label || "Actions" });
    entries.forEach(function (en) {
      if (en === "-") return m.appendChild(h("div", { class: "mx-menu-sep", role: "separator" }));
      var b = h("button", { type: "button", role: "menuitem", class: en.danger ? "is-danger" : "", disabled: en.disabled ? "" : null }, [en.icon ? iconEl(en.icon) : null, h("span", { text: en.label }), en.key ? h("span", { class: "mx-menu-k", text: en.key }) : null]);
      b.addEventListener("click", function () { closeMenu(); en.run(); });
      m.appendChild(b);
    });
    document.body.appendChild(m); menuEl = m;
    var r = m.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(x, window.innerWidth - r.width - 8)) + "px"; m.style.top = Math.max(8, Math.min(y, window.innerHeight - r.height - 8)) + "px";
    document.addEventListener("keydown", menuKeys, true);
    var first = $("button:not(:disabled)", m); if (first) first.focus();
  }
  var ICONS = { panelLeft: "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 4v16", eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", download: "M12 3v12M7 10l5 5 5-5M5 21h14", link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1", edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z", copy: "M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1", star: "M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z", moveTo: "M5 12h14M13 6l6 6-6 6M3 5v14", folder: "M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", tag: "M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01", trash: "M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14", undo: "M3 7v6h6M3 13a9 9 0 1 0 3-7", info: "M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", plus: "M12 5v14M5 12h14", refresh: "M21 12a9 9 0 1 1-3-6.7M21 3v6h-6", upload: "M12 15V3M7 8l5-5 5 5M5 21h14", check: "M5 12l5 5 9-10", gallery: "M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" };
  function iconEl(name) { var d = ICONS[name]; var s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("class", "icon"); s.setAttribute("width", "16"); s.setAttribute("height", "16"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("fill", "none"); s.setAttribute("stroke", "currentColor"); s.setAttribute("stroke-width", "2"); s.setAttribute("stroke-linecap", "round"); s.setAttribute("stroke-linejoin", "round"); s.setAttribute("aria-hidden", "true"); var p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", d || ""); s.appendChild(p); return s; }
  function trashedView() { return Boolean(cfg.trashed); }
  function fileEntries(items) {
    var one = items.length === 1, m = items[0], w = cfg.canWrite, out = [];
    if (trashedView()) {
      if (w) out.push({ label: "Restaurer", icon: "undo", run: function () { restoreFiles(items); } });
      if (cfg.canDelete) out.push({ label: "Supprimer définitivement", icon: "trash", danger: true, run: function () { purgeFiles(items); } });
      out.push("-"); out.push({ label: one ? "Télécharger" : "Télécharger (archive ZIP)", icon: "download", run: function () { download(items); } });
      return out;
    }
    if (one) out.push({ label: "Aperçu", icon: "eye", key: "Entrée", run: function () { openPreview(m.id); } }, { label: "Informations", icon: "info", key: "⌘ I", run: function () { selectOnly(m.id); openInfo(true); } });
    out.push({ label: one ? "Télécharger" : "Télécharger (archive ZIP)", icon: "download", run: function () { download(items); } });
    if (one) out.push({ label: "Copier le lien", icon: "link", run: function () { copyText(K.absolute(m.path), "Lien copié."); } }, { label: "Copier le chemin", icon: "copy", run: function () { copyText(m.path, "Chemin copié."); } });
    out.push("-");
    var allStar = items.every(function (x) { return x.starred; });
    out.push({ label: allStar ? "Retirer des favoris" : "Ajouter aux favoris", icon: "star", run: function () { starFiles(items, !allStar); } });
    if (w) {
      if (one) out.push({ label: "Renommer", icon: "edit", key: "F2", run: function () { renameFile(m); } }, { label: "Dupliquer", icon: "copy", disabled: !cfg.canUpload, run: function () { copyFile(m); } });
      if (cfg.folderEnabled) out.push({ label: "Déplacer vers…", icon: "moveTo", run: function () { moveFiles(items); } });
      if (cfg.scoped) out.push({ label: "Modifier les tags…", icon: "tag", run: function () { tagDialog(items); } }, { label: "Ajouter à une collection…", icon: "gallery", run: function () { collectionDialog(items); } });
      out.push("-", { label: "Mettre à la corbeille", icon: "trash", key: "Suppr", danger: true, run: function () { trashFiles(items); } });
    }
    return out;
  }
  function folderEntries(ids) {
    var one = ids.length === 1, id = ids[0], f = folderById(id), w = cfg.canWrite, out = [];
    if (one) out.push({ label: "Ouvrir", icon: "folder", run: function () { go(spaceBase + "?dossier=" + id); } });
    if (one) out.push({ label: f && f.starred ? "Retirer des favoris" : "Ajouter aux favoris", icon: "star", run: function () { starFolder(id); } });
    if (w) {
      if (one) out.push({ label: "Renommer", icon: "edit", run: function () { renameFolder(id); } }, { label: "Propriétés et couleur…", icon: "info", run: function () { folderProps(id); } });
      out.push({ label: "Déplacer vers…", icon: "moveTo", run: function () { moveFolders(ids); } });
    }
    if (one) out.push({ label: "Copier le chemin", icon: "copy", run: function () { copyText(folderPath(id), "Chemin copié."); } });
    if (w && one) out.push("-", { label: "Supprimer en gardant les fichiers", icon: "folder", run: function () { dissolveFolder(id); } });
    if (w) out.push({ label: "Mettre à la corbeille", icon: "trash", danger: true, run: function () { if (one) trashFolder(id); else confirmDialog("Mettre " + plural(ids.length, "dossier", "dossiers") + " à la corbeille ?", "Chaque dossier part avec ses sous-dossiers et ses fichiers ; tout est restaurable.", "Mettre à la corbeille", false).then(function (ok) { if (ok) Promise.all(ids.map(function (i) { return K.api("POST", BASE + "/dossiers/" + i + "/corbeille", {}); })).then(function () { toast("Dossiers à la corbeille.", "ok"); selF.clear(); refresh(); }, function (e) { toast(errMsg(e), "error"); }); }); } });
    return out;
  }
  function backgroundEntries() {
    var out = [];
    if (cfg.canWrite && cfg.scoped && !trashedView() && !cfg.section) out.push({ label: "Nouveau dossier", icon: "folder", run: function () { newFolder(); } });
    if (cfg.canUpload && !trashedView()) out.push({ label: "Importer des fichiers…", icon: "upload", run: function () { openImport(); } });
    out.push({ label: "Tout sélectionner", icon: "check", key: "⌘ A", run: selectAll }, { label: "Actualiser", icon: "refresh", run: function () { refresh(); } });
    return out;
  }
  function selectAll() { itemEls().forEach(function (el) { sel.add(Number(el.getAttribute("data-id"))); }); paintSelection(); }
  // Collections et tags (barre latérale) : ouvrir, renommer, supprimer — les fichiers ne sont jamais touchés
  function labelEntries(kind, id, name, href) {
    var out = [{ label: "Ouvrir", icon: kind === "collection" ? "gallery" : "tag", run: function () { go(href); } }];
    if (!cfg.canWrite) return out;
    var path = kind === "collection" ? "/collections/" : "/tags/", noun = kind === "collection" ? "collection" : "tag";
    out.push({ label: "Renommer", icon: "edit", run: function () { askText("Renommer " + (kind === "collection" ? "la collection" : "le tag"), { value: name, max: kind === "collection" ? 60 : 40 }).then(function (v) { if (!v || v === name) return; K.api("POST", BASE + path + id, { name: v }).then(function () { toast(kind === "collection" ? "Collection renommée." : "Tag renommé.", "ok"); refresh(); }, function (er) { toast(errMsg(er), "error"); }); }); } });
    out.push({ label: "Supprimer", icon: "trash", danger: true, run: function () { confirmDialog("Supprimer " + (kind === "collection" ? "la collection" : "le tag") + " « " + name + " » ?", "Seul le regroupement disparaît : aucun fichier n'est supprimé ni déplacé.", "Supprimer", true).then(function (ok) { if (ok) K.api("POST", BASE + path + id + "/supprimer", {}).then(function () { toast(kind === "collection" ? "Collection supprimée." : "Tag supprimé.", "ok"); if (String(cfg.pageKey) === (kind === "collection" ? "col:" : "tag:") + id) go(spaceBase); else refresh(); }, function (er) { toast(errMsg(er), "error"); }); }); } });
    return out;
  }
  rootEl.addEventListener("contextmenu", function (e) {
    var item = e.target.closest("[data-ml-item]"), fo = e.target.closest(".mx-folder[data-mx-folder], .mx-tree-row[data-mx-folder]");
    if (e.target.closest("input, textarea, select, .mx-info, .mx-import")) return;
    var col = e.target.closest("[data-mx-collection]"), tg = e.target.closest("[data-mx-tag]");
    if (col || tg) { e.preventDefault(); var el = col || tg; openMenu(e.clientX, e.clientY, labelEntries(col ? "collection" : "tag", Number(el.getAttribute(col ? "data-mx-collection" : "data-mx-tag")), el.getAttribute("data-name"), el.getAttribute("href")), col ? "Actions de la collection" : "Actions du tag"); return; }
    e.preventDefault();
    if (item) { var id = Number(item.getAttribute("data-id")); if (!sel.has(id)) { selF.clear(); selectOnly(id); } openMenu(e.clientX, e.clientY, fileEntries(selectedData()), "Actions du fichier"); }
    else if (fo && !fo.classList.contains("is-trashed")) { var fid = Number(fo.getAttribute("data-mx-folder")); var ids = selF.has(fid) ? Array.from(selF) : [fid]; openMenu(e.clientX, e.clientY, folderEntries(ids), "Actions du dossier"); }
    else if (e.target.closest("[data-mx-scroll]")) openMenu(e.clientX, e.clientY, backgroundEntries(), "Actions de la médiathèque");
  });
  rootEl.addEventListener("click", function (e) {
    var more = e.target.closest("[data-mx-more]"); if (!more) return;
    e.preventDefault(); e.stopPropagation();
    var r = more.getBoundingClientRect(), kind = more.getAttribute("data-mx-more");
    if (kind === "file") { var item = more.closest("[data-ml-item]"), id = Number(item.getAttribute("data-id")); if (!sel.has(id)) { selF.clear(); selectOnly(id); } openMenu(r.left, r.bottom + 4, fileEntries(selectedData()), "Actions du fichier"); }
    else { var fo = more.closest(".mx-folder"), fid = Number(fo.getAttribute("data-mx-folder")); openMenu(r.left, r.bottom + 4, folderEntries(selF.has(fid) ? Array.from(selF) : [fid]), "Actions du dossier"); }
  });
  document.addEventListener("click", function (e) { if (menuEl && !menuEl.contains(e.target) && !e.target.closest("[data-mx-more]")) closeMenu(); });
  window.addEventListener("resize", closeMenu); window.addEventListener("blur", closeMenu);
  // Appui long (tactile) : menu contextuel
  (function () { var t = null, sx = 0, sy = 0; rootEl.addEventListener("touchstart", function (e) { var item = e.target.closest("[data-ml-item], .mx-folder[data-mx-folder]"); if (!item || e.touches.length !== 1) return; sx = e.touches[0].clientX; sy = e.touches[0].clientY; t = setTimeout(function () { var ev = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: sx, clientY: sy }); item.dispatchEvent(ev); }, 520); }, { passive: true }); ["touchend", "touchcancel"].forEach(function (n) { rootEl.addEventListener(n, function () { clearTimeout(t); }, { passive: true }); }); rootEl.addEventListener("touchmove", function (e) { if (Math.abs(e.touches[0].clientX - sx) + Math.abs(e.touches[0].clientY - sy) > 10) clearTimeout(t); }, { passive: true }); })();

  // =============================================================== Barre d'actions de la sélection
  function renderBulk() {
    var bar = $("[data-mx-bulk]", rootEl); if (!bar) return;
    var n = sel.size, nf = selF.size, any = n + nf > 0;
    bar.hidden = !any; var tools = bar.closest("[data-mx-tools]"); if (tools) tools.classList.toggle("has-bulk", any); var count = $("[data-ml-bulk-count]", bar), box = $("[data-mx-bulk-actions]", bar), all = $("[data-ml-all]", bar);
    if (!any) { if (box) box.textContent = ""; return; }
    var items = selectedData(), bytes = items.reduce(function (s, m) { return s + m.size; }, 0);
    count.textContent = (n ? plural(n, "fichier sélectionné", "fichiers sélectionnés") + " · " + K.fmtSize(bytes) : "") + (n && nf ? " · " : "") + (nf ? plural(nf, "dossier sélectionné", "dossiers sélectionnés") : "");
    var total = itemEls().length; all.checked = n > 0 && n === total; all.indeterminate = n > 0 && n < total;
    box.textContent = "";
    var add = function (label, ic, run, cls) { box.appendChild(h("button", { type: "button", class: "btn " + (cls || "btn-outline") + " btn-sm", onclick: run }, [iconEl(ic), " " + label])); };
    if (n && !nf) {
      if (trashedView()) { if (cfg.canWrite) add("Restaurer", "undo", function () { restoreFiles(items); }); if (cfg.canDelete) add("Supprimer définitivement", "trash", function () { purgeFiles(items); }, "btn-danger"); add("Télécharger", "download", function () { download(items); }); }
      else {
        add("Télécharger", "download", function () { download(items); });
        if (cfg.folderEnabled && cfg.canWrite) add("Déplacer", "moveTo", function () { moveFiles(items); });
        if (cfg.scoped && cfg.canWrite) { add("Tags", "tag", function () { tagDialog(items); }); add("Collection", "gallery", function () { collectionDialog(items); }); }
        var allStar = items.every(function (x) { return x.starred; }); add(allStar ? "Retirer des favoris" : "Favoris", "star", function () { starFiles(items, !allStar); });
        if (cfg.canWrite) add("Corbeille", "trash", function () { trashFiles(items); });
      }
    } else if (nf && !n) {
      if (cfg.canWrite) { add("Déplacer", "moveTo", function () { moveFolders(Array.from(selF)); }); add("Corbeille", "trash", function () { var ids = Array.from(selF); confirmDialog("Mettre " + plural(ids.length, "dossier", "dossiers") + " à la corbeille ?", "Chaque dossier part avec ses sous-dossiers et ses fichiers ; tout est restaurable.", "Mettre à la corbeille", false).then(function (ok) { if (ok) Promise.all(ids.map(function (i) { return K.api("POST", BASE + "/dossiers/" + i + "/corbeille", {}); })).then(function () { toast("Dossiers à la corbeille.", "ok"); selF.clear(); refresh(); }, function (e) { toast(errMsg(e), "error"); }); }); }); }
    }
  }
  rootEl.addEventListener("click", function (e) { if (e.target.closest("[data-mx-clear-selection]")) clearSelection(); });

  // =============================================================== Panneau d'informations (réductible, masquable, redimensionnable)
  var infoAside = $("[data-ml-panel]", rootEl), infoEl = $("[data-mx-info-body]", rootEl) || infoAside, infoSeq = 0;
  function openInfo(on) { prefs.info = on ? "open" : "closed"; savePrefs({ info: prefs.info }); applyPrefs(); if (on) renderInfo(); }
  function renderInfo() {
    if (prefs.info !== "open" || !infoEl) return;
    if (infoAside) infoAside.hidden = false;
    var my = ++infoSeq;
    if (sel.size === 1) {
      var id = Array.from(sel)[0]; infoEl.textContent = "Chargement…";
      K.detail(id).then(function (d) { if (my !== infoSeq) return; paintFile(d); }, function (err) { if (my !== infoSeq) return; infoEl.textContent = ""; infoEl.appendChild(h("p", { class: "mk-ml-error", role: "alert", text: errMsg(err) })); });
    } else if (sel.size > 1) {
      var items = selectedData(), bytes = items.reduce(function (s, m) { return s + m.size; }, 0), types = {}; items.forEach(function (m) { types[m.type] = (types[m.type] || 0) + 1; });
      infoEl.textContent = "";
      infoEl.appendChild(h("h2", { text: plural(items.length, "fichier sélectionné", "fichiers sélectionnés") }));
      infoEl.appendChild(h("dl", { class: "mx-dl" }, [h("dt", { text: "Taille totale" }), h("dd", { text: K.fmtSize(bytes) }), h("dt", { text: "Types" }), h("dd", { text: Object.keys(types).map(function (t) { return (K.TYPE_LABELS[t] || t) + " : " + types[t]; }).join(" · ") })]));
      infoEl.appendChild(h("div", { class: "mx-info-actions" }, [h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Télécharger (ZIP)", onclick: function () { download(items); } })]));
    } else if (selF.size === 1) {
      var fid = Array.from(selF)[0]; infoEl.textContent = "Chargement…";
      K.api("GET", BASE + "/dossiers/" + fid + "/proprietes.json").then(function (r) { if (my !== infoSeq) return; var p = r.properties; infoEl.textContent = ""; infoEl.appendChild(h("h2", { text: p.name })); infoEl.appendChild(h("dl", { class: "mx-dl" }, [h("dt", { text: "Chemin" }), h("dd", { text: p.path }), h("dt", { text: "Contenu" }), h("dd", { text: plural(p.files, "fichier", "fichiers") + " · " + plural(p.subfolders, "sous-dossier", "sous-dossiers") }), h("dt", { text: "Taille" }), h("dd", { text: K.fmtSize(p.bytes) }), p.description ? h("dt", { text: "Description" }) : null, p.description ? h("dd", { text: p.description }) : null])); }, function () { infoEl.textContent = ""; });
    } else {
      infoEl.textContent = "";
      var cur = cfg.folder ? folderById(cfg.folder) : null;
      infoEl.appendChild(h("h2", { text: cur ? cur.name : cfg.pageTitle || "Médiathèque" }));
      infoEl.appendChild(h("p", { class: "mx-empty-info", text: "Sélectionnez un fichier ou un dossier pour voir ses informations." }));
      if (cur) K.api("GET", BASE + "/dossiers/" + cur.id + "/proprietes.json").then(function (r) { if (my !== infoSeq) return; var p = r.properties; infoEl.appendChild(h("dl", { class: "mx-dl" }, [h("dt", { text: "Chemin" }), h("dd", { text: p.path }), h("dt", { text: "Contenu" }), h("dd", { text: plural(p.files, "fichier", "fichiers") + " · " + plural(p.subfolders, "sous-dossier", "sous-dossiers") }), h("dt", { text: "Taille" }), h("dd", { text: K.fmtSize(p.bytes) })])); if (cfg.canWrite) infoEl.appendChild(h("div", { class: "mx-info-actions" }, [h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Propriétés et couleur…", onclick: function () { folderProps(cur.id); } })])); }, function () { /* sans propriétés */ });
    }
  }
  function field(label, id, value, o) { o = o || {}; var c = o.multiline ? h("textarea", { id: id, rows: "3", maxlength: o.max, disabled: o.disabled ? "" : null }) : h("input", { id: id, type: "text", maxlength: o.max, disabled: o.disabled ? "" : null }); c.value = value || ""; return h("div", { class: "field-group" }, [h("label", { for: id, text: label }), c, o.hint ? h("p", { class: "field-hint", text: o.hint }) : null]); }
  function paintFile(d) {
    var m = d.media, usage = d.usage || [], trashed = Boolean(m.deletedAt), locked = !cfg.canWrite || trashed, exif = d.exif;
    infoEl.textContent = "";
    var prev = m.type === "image" ? h("img", { class: "mx-prev", src: m.medium || m.path, alt: m.alt || "", tabindex: "0", onclick: function () { openPreview(m.id); } })
      : m.type === "video" ? h("video", { class: "mx-prev", src: m.path, controls: "", preload: "metadata" }) : m.type === "audio" ? h("audio", { class: "mk-ml-prev-audio", src: m.path, controls: "", preload: "metadata" })
      : m.type === "pdf" ? h("iframe", { class: "mk-ml-prev-pdf", src: m.path, title: "Aperçu du PDF " + m.name, loading: "lazy" }) : h("div", { class: "mk-ml-prev-file" }, [h("span", { class: "mk-ml-badge", text: K.badge(m) }), h("span", { class: "mk-sub", text: "Pas d'aperçu pour ce format : téléchargez le fichier pour l'ouvrir." })]);
    var status = h("p", { class: "field-hint", role: "status", "aria-live": "polite" });
    var dl = [["Type", (K.TYPE_LABELS[m.type] || "Fichier")], ["Format", m.mime || "—"], ["Taille", K.fmtSize(m.size)], m.width ? ["Dimensions", m.width + " × " + m.height + " px"] : null, ["Ajouté le", K.fmtDate(m.createdAt)], ["Modifié le", K.fmtDate(m.updatedAt || m.createdAt)], m.lastUsedAt ? ["Dernière utilisation", K.fmtDate(m.lastUsedAt)] : null, ["Emplacement", m.folderId ? folderPath(m.folderId) : "Médiathèque (sans dossier)"], ["Portée", m.reach === "site" ? "Propre à ce site" : "Commune à tous les sites"], m.sha256 ? ["Empreinte SHA-256", m.sha256.slice(0, 16) + "…"] : null, ["Ajouté par", m.author || "—"], trashed ? ["Corbeille", "depuis le " + K.fmtDate(m.deletedAt)] : null].filter(Boolean);
    var info = h("dl", { class: "mx-dl" }); dl.forEach(function (r) { info.appendChild(h("dt", { text: r[0] })); info.appendChild(h("dd", { text: r[1], title: r[0] === "Empreinte SHA-256" ? m.sha256 : null })); });
    var exifBox = null;
    if (exif) { var er = []; if (exif.make || exif.model) er.push(["Appareil", [exif.make, exif.model].filter(Boolean).join(" ")]); if (exif.takenAt) er.push(["Prise de vue", exif.takenAt]); if (exif.lens) er.push(["Objectif", exif.lens]); if (exif.focalLength) er.push(["Focale", Math.round(exif.focalLength) + " mm"]); if (exif.fNumber) er.push(["Ouverture", "f/" + (Math.round(exif.fNumber * 10) / 10)]); if (exif.exposure) er.push(["Exposition", exif.exposure < 1 ? "1/" + Math.round(1 / exif.exposure) + " s" : exif.exposure + " s"]); if (exif.iso) er.push(["ISO", String(exif.iso)]); if (exif.software) er.push(["Logiciel", exif.software]); if (exif.hasGps) er.push(["Position GPS", "présente dans le fichier (non affichée)"]);
      if (er.length) { exifBox = h("div", {}, [h("h3", { text: "Informations de la photo (EXIF)" })]); var edl = h("dl", { class: "mx-dl" }); er.forEach(function (r) { edl.appendChild(h("dt", { text: r[0] })); edl.appendChild(h("dd", { text: r[1] })); }); exifBox.appendChild(edl); if (exif.hasGps) exifBox.appendChild(h("p", { class: "field-hint", text: "Ce fichier contient une position GPS : elle part avec le fichier quand vous le partagez." })); } }
    var act = h("div", { class: "mx-info-actions" });
    var ab = function (label, run, cls) { var b = h("button", { type: "button", class: "btn " + (cls || "btn-outline") + " btn-sm", text: label, onclick: run }); act.appendChild(b); return b; };
    ab("Aperçu", function () { openPreview(m.id); }); ab("Télécharger", function () { download([{ id: m.id, name: m.name, path: m.path }]); }); ab("Copier le lien", function () { copyText(K.absolute(m.path), "Lien copié."); });
    var starBtn = ab(m.starred ? "★ Favori" : "☆ Favori", function () { var on = !m.starred; setStar("media", m.id, on).then(function () { m.starred = on; starBtn.textContent = on ? "★ Favori" : "☆ Favori"; }); });
    if (cfg.canWrite && !trashed) { if (cfg.canUpload) ab("Dupliquer", function () { copyFile({ id: m.id }); }); if (cfg.folderEnabled) ab("Déplacer…", function () { moveFiles([{ id: m.id, name: m.name, folderId: m.folderId }]); }); ab("Corbeille", function () { trashFiles([{ id: m.id, name: m.name }]); }); }
    if (cfg.canWrite && trashed) ab("Restaurer", function () { restoreFiles([{ id: m.id }]); });
    if (cfg.canDelete && trashed) ab("Supprimer définitivement", function () { purgeFiles([{ id: m.id }]); }, "btn-danger");
    // Tags
    var tagBox = null;
    if (cfg.scoped) {
      var tags = (m.tags || []).map(function (t) { return t.name; });
      var list = h("div", { class: "mx-taglist" });
      var paintTags = function () { list.textContent = ""; tags.forEach(function (name) { var chip = h("span", { class: "mx-chip" }, [name]); if (!locked) chip.appendChild(h("button", { type: "button", "aria-label": "Retirer le tag " + name, text: "×", onclick: function () { tags = tags.filter(function (x) { return x !== name; }); saveTags(); } })); list.appendChild(chip); }); if (!tags.length) list.appendChild(h("span", { class: "mx-empty-info", text: "Aucun tag." })); };
      var saveTags = function () { K.api("POST", BASE + "/" + m.id + "/tags", { tags: tags }).then(function (r) { tags = r.tags.map(function (t) { return t.name; }); paintTags(); status.textContent = "Tags enregistrés."; var it = itemEl(m.id); if (it) refreshSoon(); }, function (e) { status.textContent = errMsg(e); }); };
      var tin = h("input", { type: "text", maxlength: "40", placeholder: "Ajouter un tag, puis Entrée", "aria-label": "Ajouter un tag", disabled: locked ? "" : null, list: "mx-taglist-data" });
      tin.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); var v = tin.value.replace(/,/g, "").trim(); if (v && tags.indexOf(v) < 0) { tags.push(v); tin.value = ""; saveTags(); } } });
      var dlist = h("datalist", { id: "mx-taglist-data" }); (cfg.tagNames || []).forEach(function (n) { dlist.appendChild(h("option", { value: n })); });
      tagBox = h("div", {}, [h("h3", { text: "Tags" }), list, locked ? null : tin, dlist]); paintTags();
      if ((m.collections || []).length) tagBox.appendChild(h("div", {}, [h("h3", { text: "Collections" }), h("div", { class: "mx-taglist" }, m.collections.map(function (c) { return h("a", { class: "mx-chip", href: spaceBase + "?collection=" + c.id, text: c.name }); }))]));
    }
    var fName = field("Nom du fichier", "ml-f-name", m.name, { max: 120, disabled: locked }), fTitle = field("Titre", "ml-f-title", m.title, { max: 150, disabled: locked });
    var fAlt = m.type === "image" ? field("Texte alternatif (accessibilité)", "ml-f-alt", m.alt, { max: 200, disabled: locked, hint: "Décrit l'image pour les personnes qui ne la voient pas et pour les moteurs de recherche." }) : null;
    var fCap = field("Légende", "ml-f-cap", m.caption, { max: 300, disabled: locked }), fDesc = field("Description", "ml-f-desc", m.description, { max: 1000, multiline: true, disabled: locked });
    var save = locked ? null : h("button", { type: "button", class: "btn btn-primary btn-sm", text: "Enregistrer les informations", onclick: function () {
      save.disabled = true; status.textContent = "Enregistrement…";
      var val = function (f) { return f ? $("input,textarea", f).value : undefined; };
      K.update(m.id, { name: val(fName), title: val(fTitle), alt: val(fAlt), caption: val(fCap), description: val(fDesc) }).then(function (saved) { m.name = saved.name; status.textContent = "Enregistré."; toast("Informations enregistrées.", "ok"); var it = itemEl(m.id); if (it) { it.setAttribute("data-name", saved.name); $$("[data-ml-name]", it).forEach(function (n) { n.textContent = saved.name; }); } save.disabled = false; }, function (err) { status.textContent = errMsg(err); save.disabled = false; });
    } });
    var urlInput = h("input", { id: "ml-f-url", type: "text", readonly: "", value: K.absolute(m.path), "aria-label": "Adresse du fichier", onfocus: function () { this.select(); } });
    var CONF = { confirmed: "confirmé", probable: "probable" };
    var usageBox = h("div", {}, [h("h3", { text: "Utilisation dans le site" }), usage.length ? h("ul", {}, usage.map(function (u) { var label = u.kind + " « " + u.name + " »"; return h("li", {}, [u.href ? h("a", { href: u.href, text: label }) : document.createTextNode(label), h("span", { class: "mk-sub", text: " — " + (CONF[u.confidence] || "probable") })]); })) : h("p", { class: "field-hint", text: "Aucune référence connue dans les éléments analysés." }), h("p", { class: "field-hint", text: "« Confirmé » : relation enregistrée. « Probable » : l'adresse du fichier est citée dans le contenu." + (d.analysis ? " Analysés : " + d.analysis.scanned.join(", ") + ". Non analysés : " + d.analysis.notScanned.join(", ") + " — ne supposez pas un fichier inutilisé sans les vérifier." : "") })]);
    var twins = (d.duplicates || []).length ? h("div", {}, [h("h3", { text: "Doublons" }), h("p", { class: "field-hint", text: "Même contenu (même empreinte) que :" }), h("ul", {}, d.duplicates.map(function (t) { return h("li", { text: t.name }); }))]) : null;
    [h("h2", { text: m.name }), prev, act, info, exifBox, tagBox, h("h3", { text: "Informations modifiables" }), fName, fTitle, fAlt, fCap, fDesc, save, status, h("div", { class: "field-group" }, [h("label", { for: "ml-f-url", text: "Adresse (URL)" }), urlInput]), usageBox, twins].forEach(function (n) { if (n) infoEl.appendChild(n); });
  }
  var refreshTimer = null; function refreshSoon() { clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 600); }
  document.addEventListener("click", function (e) { var t = e.target.closest("[data-mx-info-toggle]"); if (t && rootEl.contains(t)) openInfo(prefs.info !== "open"); if (e.target.closest("[data-mx-info-close]") && rootEl.contains(e.target)) openInfo(false); });
  // Redimensionner le panneau : souris, tactile et clavier
  (function () {
    var rz = $("[data-mx-resizer]", rootEl); if (!rz) return;
    var drag = false;
    var setW = function (w) { w = Math.min(Math.max(Math.round(w), 280), 560); rootEl.style.setProperty("--mx-info-w", w + "px"); prefs.infoWidth = w; };
    rz.addEventListener("pointerdown", function (e) { drag = true; rz.setPointerCapture(e.pointerId); rz.classList.add("is-drag"); e.preventDefault(); });
    rz.addEventListener("pointermove", function (e) { if (!drag) return; setW(rootEl.getBoundingClientRect().right - e.clientX); });
    rz.addEventListener("pointerup", function () { if (!drag) return; drag = false; rz.classList.remove("is-drag"); savePrefs({ infoWidth: prefs.infoWidth }); });
    rz.addEventListener("keydown", function (e) { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setW((prefs.infoWidth || 340) + (e.key === "ArrowLeft" ? 24 : -24)); savePrefs({ infoWidth: prefs.infoWidth }); } });
  })();

  // =============================================================== Barre latérale, vues, tailles, colonnes
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-mx-side-toggle]"); if (t && rootEl.contains(t)) { if (small()) { if (rootEl.getAttribute("data-drawer") === "open") rootEl.removeAttribute("data-drawer"); else rootEl.setAttribute("data-drawer", "open"); return; } savePrefs({ sidebar: prefs.sidebar === "rail" ? "open" : "rail" }); applyPrefs(); return; }
    var tm = e.target.closest("[data-mx-theme-mode]"); if (tm && rootEl.contains(tm)) { var m = tm.getAttribute("data-mx-theme-mode"); themeSave(function (n) { n.mode = m; if (m !== "personnalise") n.colors = {}; }); return; }
    if (e.target.closest("[data-mx-theme-reset]")) { themeSave(function (n) { n.mode = "clair"; n.colors = {}; n.radius = 8; n.space = 100; n.iconSize = 16; }); return; }
    if (e.target.closest("[data-mx-theme-undo]") && themeSnapshot) { var snap = themeSnapshot; themeSave(function (n) { n.mode = snap.mode; n.colors = Object.assign({}, snap.colors); n.radius = snap.radius; n.space = snap.space; n.iconSize = snap.iconSize; }); return; }
    var ts = e.target.closest("[data-mx-theme] > summary"); if (ts && rootEl.contains(ts)) { var cur = themeOf(); themeSnapshot = { mode: cur.mode, colors: Object.assign({}, cur.colors), radius: cur.radius, space: cur.space, iconSize: cur.iconSize }; syncThemeUi(); }
    var c = e.target.closest("[data-mx-side-collapse]"); if (c && rootEl.contains(c)) { if (small()) { rootEl.removeAttribute("data-drawer"); return; } savePrefs({ sidebar: prefs.sidebar === "rail" ? "open" : "rail" }); applyPrefs(); return; }
    var v = e.target.closest("[data-mx-view]"); if (v && rootEl.contains(v)) { setView(v.getAttribute("data-mx-view")); return; }
    var tg = e.target.closest("[data-mx-tree-toggle]"); if (tg && rootEl.contains(tg)) { e.preventDefault(); var li = tg.closest(".mx-tree-item"), grp = $(".mx-tree-group", li), open = li.getAttribute("aria-expanded") !== "true"; li.setAttribute("aria-expanded", String(open)); if (grp) grp.hidden = !open; var openIds = $$('.mx-tree-item[aria-expanded="true"]', rootEl).map(function (x) { return x.getAttribute("data-mx-folder-node"); }); try { sessionStorage.setItem("mxTree", JSON.stringify(openIds)); } catch (x) { /* sans stockage */ } return; }
    if (e.target.closest("[data-mx-new-folder]")) { newFolder(); return; }
    if (e.target.closest("[data-mx-new-collection]")) { askText("Nouvelle collection", { label: "Nom de la collection", max: 60 }).then(function (name) { if (!name) return; K.api("POST", BASE + "/collections", { name: name }).then(function () { toast("Collection créée.", "ok"); refresh(); }, function (er) { toast(errMsg(er), "error"); }); }); return; }
  });
  rootEl.addEventListener("input", function (e) { if (e.target.matches("[data-mx-size]")) { var v = Number(e.target.value); rootEl.style.setProperty("--mx-size", v + "px"); prefs.size = v; savePrefs({ size: v }); } });
  rootEl.addEventListener("change", function (e) {
    if (e.target.matches("[data-mx-col]")) { var cols = $$("[data-mx-col]:checked", rootEl).map(function (c) { return c.value; }); savePrefs({ columns: cols }); applyPrefs(); }
    if (e.target.matches("[data-mx-density]")) { savePrefs({ density: e.target.checked ? "compacte" : "confortable" }); applyPrefs(); }
    if (e.target.matches("[data-mx-retention]")) { K.api("POST", BASE + "/corbeille/conservation", { days: Number(e.target.value) }).then(function (r) { toast(r.days ? "Suppression automatique après " + r.days + " jours (jamais pour un élément utilisé)." : "Plus de suppression automatique : la corbeille se vide à la main.", "ok"); }, function (er) { toast(errMsg(er), "error"); }); }
  });
  function openImport() { var z = document.getElementById("ml-upload"); if (!z) return; z.hidden = false; z.classList.remove("is-min"); var b = $("[data-ml-browse]"); if (b) b.setAttribute("aria-expanded", "true"); var dest = $("[data-mx-import-dest]", z); if (dest && cfg.folder) dest.value = String(cfg.folder); var d = $("[data-ml-drop]", z); if (d) d.focus(); }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ml-browse]"); if (b) { var z = document.getElementById("ml-upload"); if (z) { if (z.hidden) openImport(); else { z.hidden = true; b.setAttribute("aria-expanded", "false"); } } return; }
    if (e.target.closest("[data-mx-import-close]")) { var z2 = document.getElementById("ml-upload"); z2.hidden = true; var b2 = $("[data-ml-browse]"); if (b2) b2.setAttribute("aria-expanded", "false"); return; }
    if (e.target.closest("[data-mx-import-min]")) { document.getElementById("ml-upload").classList.toggle("is-min"); return; }
    if (e.target.closest("[data-mx-import-folder]")) { var fi = $("[data-mx-folder-input]"); if (fi) fi.click(); return; }
  });

  // =============================================================== Glisser-déposer : fichiers et dossiers (déplacement), fichiers du bureau (importation)
  var drag = null, ghost = null, blankImg = null, reorder = null;
  function dropTargetOf(el) { return el && el.closest ? el.closest("[data-mx-folder], [data-mx-folder-root]") : null; }
  function targetId(t) { return t.hasAttribute("data-mx-folder-root") ? null : Number(t.getAttribute("data-mx-folder")); }
  function targetName(t) { return t.hasAttribute("data-mx-folder-root") ? "Sans dossier" : (folderById(targetId(t)) || {}).name || t.getAttribute("data-name") || "ce dossier"; }
  function canDrop(t) {
    if (!drag) return { ok: false };
    var to = targetId(t);
    if (drag.kind === "folder") { var banned = new Set(); drag.ids.forEach(function (id) { descendantsOf(id).forEach(function (d) { banned.add(d); }); }); if (to !== null && banned.has(to)) return { ok: false, why: "Un dossier ne peut pas entrer dans lui-même ni dans un de ses sous-dossiers." }; if (drag.ids.every(function (id) { var f = folderById(id); return f && (f.parentId || null) === to; })) return { ok: false, why: "Déjà dans ce dossier." }; return { ok: true }; }
    if (drag.ids.every(function (id) { var el = itemEl(id); return el && (Number(el.getAttribute("data-folder")) || null) === to; })) return { ok: false, why: "Déjà dans ce dossier." };
    return { ok: true };
  }
  function ghostText(t) {
    var n = drag.ids.length, what = drag.kind === "folder" ? plural(n, "dossier", "dossiers") : plural(n, "fichier", "fichiers");
    if (!t) return what;
    var c = canDrop(t); return c.ok ? "Déplacer " + what + " vers « " + targetName(t) + " »" : (c.why || "Déplacement impossible");
  }
  rootEl.addEventListener("dragstart", function (e) {
    var el = e.target.closest("[data-mx-draggable]"); if (!el || !cfg.canWrite || cfg.trashed) { return; }
    var kind = el.getAttribute("data-mx-draggable"), ids;
    // La sélection est mise à jour APRÈS le début du glisser : changer la mise en page pendant « dragstart » fait échouer le glisser natif dans Chrome
    if (kind === "file") { var id = Number(el.getAttribute("data-id")); ids = sel.has(id) ? Array.from(sel) : [id]; if (!sel.has(id)) setTimeout(function () { selF.clear(); selectOnly(id); }, 0); } else { var fid = Number(el.getAttribute("data-mx-folder")); ids = selF.has(fid) ? Array.from(selF) : [fid]; }
    drag = { kind: kind, ids: ids };
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "kw-media:" + kind + ":" + ids.join(","));
    // Image de glisser invisible : l'indication de destination est notre bulle (suit le pointeur et dit où le fichier ira). L'élément doit être dans le document pendant le glisser.
    blankImg = h("div", { style: "position:fixed;top:-20px;left:-20px;width:1px;height:1px;opacity:0;pointer-events:none", "aria-hidden": "true" }); document.body.appendChild(blankImg); e.dataTransfer.setDragImage(blankImg, 0, 0);
    ghost = h("div", { class: "mx-drag-ghost", text: ghostText(null) }); document.body.appendChild(ghost); moveGhost(e.clientX, e.clientY);
    setTimeout(function () { if (!drag) return; $$("[data-ml-item].is-selected, .mx-folder.is-selected", rootEl).forEach(function (x) { x.classList.add("is-dragging"); }); el.classList.add("is-dragging"); }, 0);
  });
  function moveGhost(x, y) { if (ghost) { ghost.style.left = x + "px"; ghost.style.top = y + "px"; } }
  function clearDropMarks() { reorder = null; $$(".is-drop, .is-nodrop, .is-before, .is-after", document).forEach(function (x) { x.classList.remove("is-drop", "is-nodrop", "is-before", "is-after"); }); }
  // Ordre personnalisé : lâcher un dossier sur le BORD gauche/droit d'un dossier du même emplacement le place avant/après (la position change, rien n'est déplacé). Le centre = déplacer DANS ce dossier.
  function reorderOf(t, e) {
    if (!drag || drag.kind !== "folder" || !t.classList.contains("mx-folder") || t.hasAttribute("data-mx-folder-root")) return null;
    var tid = Number(t.getAttribute("data-mx-folder")), tf = folderById(tid); if (!tf || drag.ids.indexOf(tid) >= 0) return null;
    if (!drag.ids.every(function (id) { var f = folderById(id); return f && (f.parentId || null) === (tf.parentId || null); })) return null;
    var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / Math.max(1, r.width);
    if (x < 0.22) return { id: tid, after: false, parent: tf.parentId || null };
    if (x > 0.78) return { id: tid, after: true, parent: tf.parentId || null };
    return null;
  }
  function applyReorder(d, ro) {
    var cards = $$("[data-mx-folders] > .mx-folder", rootEl).map(function (el) { return Number(el.getAttribute("data-mx-folder")); });
    var order = cards.filter(function (id) { return d.ids.indexOf(id) < 0; }), at = order.indexOf(ro.id) + (ro.after ? 1 : 0);
    order.splice.apply(order, [at, 0].concat(d.ids.filter(function (id) { return cards.indexOf(id) >= 0; })));
    return K.api("POST", BASE + "/dossiers/ordre", { parent_id: ro.parent, ids: order }).then(function () { toast("Ordre des dossiers enregistré.", "ok"); return refresh(); }, function (er) { toast(errMsg(er), "error"); });
  }
  function endDrag() { drag = null; if (blankImg) { blankImg.remove(); blankImg = null; } if (ghost) { ghost.remove(); ghost = null; } clearDropMarks(); $$(".is-dragging", rootEl).forEach(function (x) { x.classList.remove("is-dragging"); }); }
  document.addEventListener("dragover", function (e) {
    if (!drag) return;
    moveGhost(e.clientX, e.clientY);
    var t = dropTargetOf(e.target); clearDropMarks();
    var ro = t ? reorderOf(t, e) : null;
    if (ro) { reorder = ro; t.classList.add(ro.after ? "is-after" : "is-before"); e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (ghost) { ghost.textContent = "Placer " + (ro.after ? "après" : "avant") + " « " + targetName(t) + " »"; ghost.classList.remove("is-no"); } return; }
    if (t) { var c = canDrop(t); t.classList.add(c.ok ? "is-drop" : "is-nodrop"); if (c.ok) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } else e.dataTransfer.dropEffect = "none"; if (ghost) { ghost.textContent = ghostText(t); ghost.classList.toggle("is-no", !c.ok); } }
    else if (ghost) { ghost.textContent = ghostText(null); ghost.classList.remove("is-no"); }
  });
  document.addEventListener("drop", function (e) {
    if (!drag) return;
    var t = dropTargetOf(e.target); if (!t) { endDrag(); return; }
    var ro = reorder; if (ro) { e.preventDefault(); var dd = drag; endDrag(); applyReorder(dd, ro); return; }
    var c = canDrop(t); e.preventDefault();
    if (!c.ok) { if (c.why) toast(c.why, "error"); endDrag(); return; }
    var d = drag, to = targetId(t); endDrag();
    if (d.kind === "folder") moveFolders(d.ids, to); else { moveFiles(d.ids.map(function (id) { var el = itemEl(id); return el ? dataOf(el) : { id: id, name: "#" + id }; }), to); }
  });
  document.addEventListener("dragend", endDrag);
  // Fichiers venant du bureau : voile de dépôt avec la destination, puis file d'importation (même file que « Ajouter un fichier média »)
  var veil = $("[data-mx-dropveil]", rootEl), veilDepth = 0;
  var hasFiles = function (e) { return e.dataTransfer && Array.prototype.indexOf.call(e.dataTransfer.types || [], "Files") >= 0; };
  function destOf(el) { var t = dropTargetOf(el); if (t) return { id: targetId(t), name: targetName(t) }; return { id: cfg.folder || null, name: cfg.folder ? (folderById(cfg.folder) || {}).name : "la médiathèque" }; }
  rootEl.addEventListener("dragenter", function (e) { if (!cfg.canUpload || cfg.trashed || !hasFiles(e) || e.target.closest("#ml-upload")) return; veilDepth++; if (veil) { veil.hidden = false; $("[data-mx-dropveil-dest]", veil).textContent = "Destination : « " + destOf(e.target).name + " »"; } });
  rootEl.addEventListener("dragover", function (e) { if (!cfg.canUpload || cfg.trashed || !hasFiles(e) || e.target.closest("#ml-upload")) return; e.preventDefault(); e.dataTransfer.dropEffect = "copy"; var t = dropTargetOf(e.target); clearDropMarks(); if (t) t.classList.add("is-drop"); if (veil) $("[data-mx-dropveil-dest]", veil).textContent = "Destination : « " + destOf(e.target).name + " »"; });
  rootEl.addEventListener("dragleave", function (e) { if (!hasFiles(e)) return; veilDepth = Math.max(0, veilDepth - 1); if (!veilDepth && veil) veil.hidden = true; });
  rootEl.addEventListener("drop", function (e) {
    if (!cfg.canUpload || cfg.trashed || !hasFiles(e) || e.target.closest("#ml-upload")) return;
    e.preventDefault(); e.stopPropagation(); veilDepth = 0; if (veil) veil.hidden = true; clearDropMarks();
    var dest = destOf(e.target);
    importDropped(e.dataTransfer, dest.id);
  });
  window.addEventListener("dragend", function () { veilDepth = 0; if (veil) veil.hidden = true; });

  // =============================================================== Importation : destination, dossiers entiers, conflits de noms
  function readEntries(reader) { return new Promise(function (res) { var all = []; (function next() { reader.readEntries(function (b) { if (!b.length) res(all); else { all = all.concat(Array.prototype.slice.call(b)); next(); } }, function () { res(all); }); })(); }); }
  function walkEntry(entry, prefix, out) {
    if (entry.isFile) return new Promise(function (res) { entry.file(function (f) { f.mxPath = prefix; out.push(f); res(); }, function () { res(); }); });
    return readEntries(entry.createReader()).then(function (kids) { return kids.reduce(function (p, k) { return p.then(function () { return walkEntry(k, prefix + entry.name + "/", out); }); }, Promise.resolve()); });
  }
  function importDropped(dt, destId) {
    var z = document.getElementById("ml-upload"), dest = $("[data-mx-import-dest]", z || document);
    var items = dt.items ? Array.prototype.slice.call(dt.items).map(function (i) { return i.webkitGetAsEntry ? i.webkitGetAsEntry() : null; }).filter(Boolean) : [];
    var hasDir = items.some(function (en) { return en.isDirectory; });
    var go2 = function (files) { if (dest) dest.value = destId ? String(destId) : ""; if (z) { z.hidden = false; z.classList.remove("is-min"); } takeFiles(files, destId); };
    if (!hasDir) return go2(Array.prototype.slice.call(dt.files));
    var out = []; Promise.all(items.map(function (en) { return walkEntry(en, "", out); })).then(function () { go2(out); });
  }
  // Un dossier importé recrée ses sous-dossiers dans la médiathèque (créés avant l'envoi, jamais en double)
  // Une création de dossier par chemin, partagée entre tous les fichiers du lot (sinon deux fichiers créent « Campagne » en même temps : conflit 409) ; en cas de conflit, le dossier existant est relu
  var folderJobs = {};
  function folderStep(parent, name) {
    var key = (parent || 0) + "/" + name.toLowerCase();
    if (folderJobs[key]) return folderJobs[key];
    var known = function () { return (cfg.folders || []).filter(function (f) { return (f.parentId || null) === (parent || null) && f.name.toLowerCase() === name.toLowerCase(); })[0]; };
    var p = known() ? Promise.resolve(known().id) : K.folderCreate(name, parent).then(function (f) { (cfg.folders = cfg.folders || []).push({ id: f.id, parentId: f.parent_id || null, name: f.name, color: "", description: "", count: 0 }); return f.id; }, function (e) {
      if (e && e.status === 409) return K.api("GET", BASE + "/dossiers.json").then(function (r) { cfg.folders = r.folders.map(function (x) { return { id: x.id, parentId: x.parentId || null, name: x.name, color: x.color || "", description: "", count: x.count }; }); var again = known(); if (again) return again.id; throw e; });
      throw e;
    });
    folderJobs[key] = p; p["catch"](function () { delete folderJobs[key]; });
    return p;
  }
  function ensureFolderPath(rootId, path) {
    var chain = Promise.resolve(rootId || null);
    path.split("/").filter(Boolean).forEach(function (name) { chain = chain.then(function (parent) { return folderStep(parent, name); }); });
    return chain;
  }
  function takeFiles(files, destId) {
    var ctl = window.KWUploadCtl; if (!ctl) { toast("L'importation n'est pas disponible sur cet écran.", "error"); return; }
    var withPaths = files.filter(function (f) { return f.mxPath || f.webkitRelativePath; });
    var prep = withPaths.length ? Promise.all(withPaths.map(function (f) { var rel = f.mxPath || (f.webkitRelativePath || "").split("/").slice(0, -1).join("/"); return ensureFolderPath(destId, rel).then(function (id) { f.mxFolder = id ? String(id) : ""; }); })) : Promise.resolve();
    prep.then(function () { ctl.take(files); }, function (e) { toast("Impossible de recréer les dossiers : " + errMsg(e), "error"); });
  }
  var folderInput = $("[data-mx-folder-input]");
  if (folderInput) folderInput.addEventListener("change", function () { var files = Array.prototype.slice.call(folderInput.files); folderInput.value = ""; var dest = $("[data-mx-import-dest]"); takeFiles(files, dest && dest.value ? Number(dest.value) : null); });
  function sha256(file) { if (!window.crypto || !crypto.subtle || file.size > 60 * 1048576) return Promise.resolve(null); return file.arrayBuffer().then(function (b) { return crypto.subtle.digest("SHA-256", b); }).then(function (d) { return Array.prototype.map.call(new Uint8Array(d), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }).catch(function () { return null; }); }
  // Avant l'envoi : le serveur dit lesquels existent déjà (même nom dans la destination, ou même contenu) ; la politique choisie s'applique à chacun, et rien n'est silencieux
  window.MXImport = { beforeAdd: function (files) {
    var dest = $("[data-mx-import-dest]"), folder = dest && dest.value ? Number(dest.value) : null, pol = ($("input[name=mx-conflict]:checked") || {}).value || "both";
    return Promise.all(files.map(function (f) { return sha256(f); })).then(function (shas) {
      return K.api("POST", BASE + "/verifier", { files: files.map(function (f, i) { return { name: f.name, sha256: shas[i], folder_id: f.mxFolder !== undefined ? Number(f.mxFolder) || null : folder }; }) }).then(function (r) {
        var keep = [], skipped = [], renamed = 0;
        files.forEach(function (f, i) {
          var c = r.files[i] || { sameName: [], sameContent: [] };
          if (c.sameContent.length || c.sameName.length) {
            if (pol === "skip") { skipped.push(f.name); return; }
            if (pol === "both" && c.sameName.length) { var dot = f.name.lastIndexOf("."), base = dot > 0 ? f.name.slice(0, dot) : f.name, ext = dot > 0 ? f.name.slice(dot) : ""; f.mxName = base + " (2)" + ext; renamed++; }
          }
          keep.push(f);
        });
        if (skipped.length) toast(plural(skipped.length, "fichier ignoré", "fichiers ignorés") + " (déjà présent" + (skipped.length > 1 ? "s" : "") + ") : " + skipped.slice(0, 3).join(", ") + (skipped.length > 3 ? "…" : ""), "error");
        if (renamed) toast(plural(renamed, "fichier renommé", "fichiers renommés") + " pour garder les deux.", "ok");
        return keep;
      });
    }).catch(function () { return files; });
  } };
  window.addEventListener("kw-media-saved", function () { refreshSoon(); });

  // =============================================================== Recherche : suggestions
  var sgTimer = null, sgSeq = 0;
  rootEl.addEventListener("input", function (e) {
    if (!e.target.matches("[data-mx-search]")) return;
    var box = $("[data-mx-suggest]", rootEl), q = e.target.value.trim(); clearTimeout(sgTimer);
    if (q.length < 2) { box.hidden = true; e.target.setAttribute("aria-expanded", "false"); return; }
    var my = ++sgSeq;
    sgTimer = setTimeout(function () {
      K.api("GET", BASE + "/suggestions.json" + K.query({ q: q })).then(function (r) {
        if (my !== sgSeq) return; box.textContent = "";
        r.items.forEach(function (it, i) { var li = h("li", { role: "option", id: "mx-sg-" + i, "data-kind": it.kind, "data-id": it.id || "", "data-value": it.value || it.label }, [h("span", { text: it.label }), h("span", { class: "mx-sg-kind", text: { media: "Fichier", tag: "Tag", folder: "Dossier" }[it.kind] })]); box.appendChild(li); });
        box.hidden = !r.items.length; e.target.setAttribute("aria-expanded", String(!!r.items.length));
      }, function () { box.hidden = true; });
    }, 160);
  });
  rootEl.addEventListener("keydown", function (e) {
    var input = e.target.closest("[data-mx-search]"); if (!input) return;
    var box = $("[data-mx-suggest]", rootEl), opts = $$("li", box), cur = opts.findIndex(function (o) { return o.getAttribute("aria-selected") === "true"; });
    if (box.hidden && e.key !== "Escape") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); opts.forEach(function (o) { o.removeAttribute("aria-selected"); }); var n = e.key === "ArrowDown" ? (cur + 1) % opts.length : (cur - 1 + opts.length) % opts.length; opts[n].setAttribute("aria-selected", "true"); input.setAttribute("aria-activedescendant", opts[n].id); }
    else if (e.key === "Enter" && cur >= 0) { e.preventDefault(); pickSuggestion(opts[cur]); }
    else if (e.key === "Escape") { box.hidden = true; input.setAttribute("aria-expanded", "false"); }
  });
  rootEl.addEventListener("mousedown", function (e) { var li = e.target.closest("[data-mx-suggest] li"); if (li) { e.preventDefault(); pickSuggestion(li); } });
  document.addEventListener("click", function (e) { var box = $("[data-mx-suggest]", rootEl); if (box && !box.hidden && !e.target.closest("[data-mx-filters]")) box.hidden = true; });
  function pickSuggestion(li) {
    var kind = li.getAttribute("data-kind"), id = li.getAttribute("data-id");
    if (kind === "tag") go(spaceBase + "?tag=" + id); else if (kind === "folder") go(spaceBase + "?dossier=" + id); else go(spaceBase + "?q=" + encodeURIComponent(li.getAttribute("data-value")));
  }

  // =============================================================== Corbeille : restaurer / supprimer définitivement un dossier, vider
  document.addEventListener("click", function (e) {
    var rb = e.target.closest("[data-mx-trash-restore]"), pb = e.target.closest("[data-mx-trash-purge]"), eb = e.target.closest("[data-mx-empty-trash]");
    if (!rootEl.contains(e.target)) return;
    if (rb || pb) {
      var row = (rb || pb).closest("[data-mx-trash-folder]"), id = Number(row.getAttribute("data-mx-trash-folder")), name = row.getAttribute("data-name");
      if (rb) K.api("POST", BASE + "/dossiers/" + id + "/restaurer", {}).then(function (r) { toast("Dossier « " + r.folder.name + " » restauré avec son contenu.", "ok"); refresh(); }, function (er) { toast(errMsg(er), "error"); });
      else confirmDialog("Supprimer définitivement le dossier ?", "« " + name + " » et tous ses fichiers seront effacés pour de bon. Si l'un d'eux est encore utilisé par un contenu, la suppression est refusée et rien n'est effacé.", "Supprimer définitivement", true).then(function (ok) { if (ok) K.api("POST", BASE + "/dossiers/" + id + "/supprimer-definitivement", {}).then(function (r) { toast("Dossier supprimé (" + plural(r.files, "fichier", "fichiers") + ").", "ok"); refresh(); }, function (er) { toast(errMsg(er), "error"); }); });
    }
    if (eb) confirmDialog("Vider la corbeille ?", "Tout ce qui est à la corbeille sera supprimé définitivement, sauf ce qui est encore utilisé par un contenu (conservé et signalé). Cette action est irréversible.", "Vider la corbeille", true).then(function (ok) {
      if (ok) K.api("POST", BASE + "/corbeille/vider", {}).then(function (r) { var msg = plural(r.purged, "fichier supprimé", "fichiers supprimés") + "."; if (r.kept.length) msg += " Conservés car utilisés : " + r.kept.slice(0, 3).map(function (k) { return "« " + k.name + " »"; }).join(", ") + (r.kept.length > 3 ? "…" : ""); toast(msg, r.kept.length ? "error" : "ok"); refresh(); }, function (er) { toast(errMsg(er), "error"); });
    });
  });

  // =============================================================== Clavier
  document.addEventListener("keydown", function (e) {
    if (!rootEl.isConnected) return;
    var mod = e.metaKey || e.ctrlKey, typing = e.target.closest("input, textarea, select, [contenteditable]");
    if (mod && (e.key === "i" || e.key === "I") && !typing) { e.preventDefault(); openInfo(prefs.info !== "open"); return; }
    if (mod && (e.key === "b" || e.key === "B") && !typing) { e.preventDefault(); savePrefs({ sidebar: prefs.sidebar === "rail" ? "open" : "rail" }); applyPrefs(); return; }
    if (typing || document.querySelector("dialog[open]") || (document.getElementById("mx-preview") && !document.getElementById("mx-preview").hidden)) return;
    if (e.key === "Escape") { if (menuEl) return; if (sel.size || selF.size) { clearSelection(); return; } if (prefs.info === "open") { openInfo(false); return; } }
    if (mod && (e.key === "a" || e.key === "A") && e.target.closest("[data-mx-scroll], [data-ml-item]")) { e.preventDefault(); selectAll(); return; }
    var cur = e.target.closest("[data-ml-item]") || (sel.size === 1 ? itemEl(Array.from(sel)[0]) : null);
    if (e.key === "Enter" && cur && !e.target.closest("button, a")) { e.preventDefault(); openPreview(Number(cur.getAttribute("data-id"))); return; }
    if (e.key === " " && cur && e.target.closest("[data-ml-item]") && !e.target.closest("button, input")) { e.preventDefault(); toggle(Number(cur.getAttribute("data-id"))); return; }
    if (e.key === "F2" && cfg.canWrite && !sel.size && selF.size === 1) { e.preventDefault(); renameFolder(Array.from(selF)[0]); return; }
    if (e.key === "F2" && cfg.canWrite && sel.size === 1) { e.preventDefault(); renameFile(selectedData()[0]); return; }
    if ((e.key === "Delete" || e.key === "Backspace") && cfg.canWrite && sel.size && e.target.closest("[data-mx-scroll], [data-ml-item]")) { e.preventDefault(); var its = selectedData(); if (trashedView()) { if (cfg.canDelete) purgeFiles(its); } else trashFiles(its); return; }
    if ((e.key === "ContextMenu" || (e.shiftKey && e.key === "F10")) && cur) { e.preventDefault(); var r = cur.getBoundingClientRect(), id = Number(cur.getAttribute("data-id")); if (!sel.has(id)) selectOnly(id); openMenu(r.left + 24, r.top + 24, fileEntries(selectedData()), "Actions du fichier"); return; }
    if (/^Arrow(Left|Right|Up|Down)$/.test(e.key) && e.target.closest("[data-mx-items]")) { e.preventDefault(); moveFocus(e.key, e.shiftKey); }
  });
  function moveFocus(key, extend) {
    var els = itemEls(); if (!els.length) return;
    var cur = e_cur(els), i = els.indexOf(cur); if (i < 0) i = 0;
    var list = rootEl.getAttribute("data-view") === "liste" || rootEl.getAttribute("data-view") === "details", next = i;
    if (list) next = key === "ArrowDown" || key === "ArrowRight" ? Math.min(els.length - 1, i + 1) : Math.max(0, i - 1);
    else {
      var r = cur.getBoundingClientRect(), best = null, bestD = Infinity;
      els.forEach(function (el, n) { if (n === i) return; var b = el.getBoundingClientRect(), dx = (b.left + b.width / 2) - (r.left + r.width / 2), dy = (b.top + b.height / 2) - (r.top + r.height / 2); var ok = key === "ArrowRight" ? dx > 8 && Math.abs(dy) < r.height / 2 : key === "ArrowLeft" ? dx < -8 && Math.abs(dy) < r.height / 2 : key === "ArrowDown" ? dy > 8 : dy < -8; if (!ok) return; var d = key === "ArrowLeft" || key === "ArrowRight" ? Math.abs(dx) + Math.abs(dy) * 4 : Math.abs(dy) * 4 + Math.abs(dx); if (d < bestD) { bestD = d; best = n; } });
      if (best !== null) next = best;
    }
    var el = els[next]; el.focus({ preventScroll: false }); el.scrollIntoView({ block: "nearest" });
    var id = Number(el.getAttribute("data-id")); if (extend) { if (anchor === null) anchor = Number(cur.getAttribute("data-id")); range(id); } else if (!selecting()) selectOnly(id);
  }
  function e_cur(els) { return document.activeElement && document.activeElement.closest && document.activeElement.closest("[data-ml-item]") || (sel.size ? itemEl(Array.from(sel)[0]) : els[0]) || els[0]; }

  // =============================================================== Chargement progressif (page suivante ajoutée sous la liste)
  var io = null, loadingMore = false;
  function setupMore() {
    if (io) { io.disconnect(); io = null; }
    var next = $("[data-mx-next]", rootEl), sc = $("[data-mx-scroll]", rootEl); if (!next || !sc || !("IntersectionObserver" in window)) return;
    io = new IntersectionObserver(function (en) { if (en.some(function (x) { return x.isIntersecting; })) loadMore(); }, { root: sc, rootMargin: "0px 0px 400px 0px" });
    io.observe($("[data-mx-pager]", rootEl));
  }
  function loadMore() {
    var next = $("[data-mx-next]", rootEl); if (!next || loadingMore) return; loadingMore = true;
    var u = new URL(next.href, location.href); u.searchParams.set("fragment", "1");
    fetch(u.toString(), { credentials: "same-origin", headers: { Accept: "text/html" } }).then(function (r) { if (!r.ok) throw new Error(); return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html"), body = $('[data-frag="body"]', doc), ul = $("[data-mx-items]", rootEl), more = $("[data-mx-items]", body);
      if (ul && more) $$("[data-ml-item]", more).forEach(function (li) { li.classList.add("is-new"); ul.appendChild(li); });
      var pg = $("[data-mx-pager]", body), cur = $("[data-mx-pager]", rootEl); if (pg && cur) cur.innerHTML = pg.innerHTML;
      var nc = readCfg(doc); if (nc) cfg.nextUrl = nc.nextUrl;
      initItems(); paintSelection();
    }).catch(function () { toast("Impossible de charger la suite : utilisez « Suivant ».", "error"); if (io) io.disconnect(); }).then(function () { loadingMore = false; setupMore(); });
  }

  // Éléments déplaçables (le conteneur, pas l'image ni le lien qu'il contient) et navigation clavier à un seul arrêt de tabulation (flèches entre les fichiers)
  function initItems(scope) {
    $$("[data-mx-draggable]", scope || rootEl).forEach(function (el) {
      if (cfg.canWrite && !cfg.trashed) el.setAttribute("draggable", "true");
      $$("img, a", el).forEach(function (x) { x.setAttribute("draggable", "false"); });
    });
    itemEls().forEach(function (el, i) {
      el.setAttribute("tabindex", i === 0 ? "0" : "-1");
      $$(".mx-thumb, .mx-star, .mx-more, .mx-check", el).forEach(function (b) { b.setAttribute("tabindex", "-1"); });
    });
  }
  rootEl.addEventListener("focusin", function (e) {
    var it = e.target.closest && e.target.closest("[data-ml-item]"); if (!it) return;
    itemEls().forEach(function (x) { x.setAttribute("tabindex", x === it ? "0" : "-1"); });
  });

  // =============================================================== Après chaque affichage
  function afterRender(animated) {
    sel.clear(); selF.clear(); anchor = null; cfg.view = cfg.view || prefs.view; applyPrefs(); renderBulk();
    var names = cfg.tagNames; if (!names) { try { names = $$("[data-mx-tag]", rootEl).map(function (t) { return t.getAttribute("data-name"); }); } catch (x) { names = []; } cfg.tagNames = names; }
    try { var open = JSON.parse(sessionStorage.getItem("mxTree") || "[]"); open.forEach(function (id) { var li = $('.mx-tree-item[data-mx-folder-node="' + id + '"]', rootEl); if (li && $(".mx-tree-group", li)) { li.setAttribute("aria-expanded", "true"); $(".mx-tree-group", li).hidden = false; } }); } catch (x) { /* sans stockage */ }
    var sc = $("[data-mx-scroll]", rootEl); if (sc) { sc.scrollTop = 0; if (animated) { sc.classList.remove("is-entering"); void sc.offsetWidth; sc.classList.add("is-entering"); } }
    var t = $("[data-mx-title], .mx-title", rootEl); if (t) document.title = t.textContent + " — Médiathèque";
    var rt = $("[data-mx-retention]", rootEl); if (rt && cfg.retention !== undefined) rt.value = String(cfg.retention);
    // Rubriques calculées (accueil, doublons, stockage) : montées par media-sections.js
    var section = $("[data-mx-section]", rootEl); if (section && window.MXSections) window.MXSections.mount(section.getAttribute("data-mx-section"), section);
    initItems(); setupMore(); fitHeight();
    if (prefs.info === "open") renderInfo();
    if (window.MXPreview && window.MXPreview.refreshList) window.MXPreview.refreshList();
  }
  // Rubrique de la barre latérale : bouton de repli (ajouté une fois)
    rootEl.addEventListener("input", function (e) {
    var ci = e.target.closest && e.target.closest("[data-mx-theme-color]"); if (ci) { var k = ci.getAttribute("data-mx-theme-color"), v = ci.value; themeSave(function (n) { n.mode = "personnalise"; n.colors[k] = v; }); return; }
    var ri = e.target.closest && e.target.closest("[data-mx-theme-range]"); if (ri) { var rk = ri.getAttribute("data-mx-theme-range"), rv = Number(ri.value); themeSave(function (n) { n[rk] = rv; }); }
  });
  function syncCollapse() { var b = $("[data-mx-side-collapse]", rootEl); if (!b) return; var open = (prefs.sidebar || "open") === "open"; b.setAttribute("aria-expanded", open ? "true" : "false"); b.setAttribute("aria-label", open ? "Replier la barre latérale" : "Déployer la barre latérale"); b.setAttribute("title", (open ? "Replier" : "Déployer") + " la barre latérale (Cmd/Ctrl + B)"); }
  (function () { var side = $("[data-mx-side]", rootEl); if (side && !$("[data-mx-side-collapse]", side)) { var b = h("button", { type: "button", class: "mx-iconbtn mx-side-collapse", "data-mx-side-collapse": "", "aria-controls": "mx-side" }, [iconEl("panelLeft")]); side.appendChild(b); syncCollapse(); } })();
  window.addEventListener("resize", fitHeight);
  try { var flash = sessionStorage.getItem("mlFlash"); if (flash) { sessionStorage.removeItem("mlFlash"); var fl = JSON.parse(flash); toast(fl.text, fl.type); } } catch (x) { /* ignoré */ }

  // Interface publique pour media-sections.js et media-preview.js
  window.MX = { K: K, cfg: function () { return cfg; }, root: rootEl, $: $, $$: $$, h: h, toast: toast, plural: plural, errMsg: errMsg, go: go, refresh: refresh, openDialog: openDialog, confirm: confirmDialog, selectOnly: selectOnly, itemEls: itemEls, dataOf: dataOf, openInfo: openInfo, setStar: setStar, download: download, folderPath: folderPath, folderById: folderById, trashFiles: trashFiles, iconEl: iconEl, spaceBase: spaceBase, base: BASE };
  afterRender(false);
})();

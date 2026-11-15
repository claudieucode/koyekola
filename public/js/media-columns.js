// KOLAKISA CMS → Médiathèque : colonnes personnalisables du mode liste.
// Choisir, masquer, réorganiser (glisser-déposer, ou boutons monter / descendre au clavier), élargir (tirer le bord d'un titre, ou flèches), réinitialiser, enregistrer plusieurs
// configurations et en définir une par défaut. Tout est conservé côté serveur, par personne et par site (même mécanisme que les autres préférences d'affichage).
// « Affichage intelligent » : dans une catégorie (Images, Vidéos, Audio, Documents), la liste propose les colonnes qui ont un sens pour elle (images : dimensions, résolution, format…).
// Aucune valeur inventée : la durée, la résolution d'une vidéo et la date de prise de vue sont LUES dans le fichier par le navigateur (lignes visibles seulement, métadonnées uniquement,
// résultat mis en cache) ; sans information, la cellule affiche « — ».
(function () {
  "use strict";
  var MX = window.MX; if (!MX) return;
  var h = MX.h, $ = MX.$, $$ = MX.$$, root = MX.root;
  var CAT = { image: "image", video: "video", audio: "audio", documents: "documents", pdf: "documents", document: "documents", lottie: "lottie" };
  var NAME_MIN = 160, FIXED_LEFT = 98, FIXED_RIGHT = 80;

  function defs() { return MX.cfg().columnDefs || {}; }
  function prefs() { return MX.prefs(); }
  function category() { var p = prefs(); return p.colSmart && CAT[MX.cfg().type] ? CAT[MX.cfg().type] : ""; }
  function activeList() {
    var p = prefs(), c = category(), d = defs();
    var list = c ? (p.colByType && p.colByType[c]) || (MX.cfg().typeColumns || {})[c] || p.columns : p.columns;
    return (list || []).filter(function (k) { return d[k]; });
  }
  function widthOf(k) { var p = prefs(), d = defs(); return (p.colWidths && p.colWidths[k]) || (d[k] && d[k].width) || 100; }
  function persist(list) { var p = prefs(), c = category(); if (c) { var by = Object.assign({}, p.colByType); by[c] = list; MX.savePrefs({ colByType: by }); } else MX.savePrefs({ columns: list }); }

  // ---------------------------------------------------------------- Application à l'écran (classes, ordre et largeurs en variables CSS)
  function apply() {
    var list = activeList(), d = defs();
    root.className = root.className.replace(/\bhas-c-\w+/g, "").replace(/\s+/g, " ").trim();
    var sum = 0;
    Object.keys(d).forEach(function (k) {
      var i = list.indexOf(k);
      root.style.setProperty("--o-" + k, i < 0 ? 99 : i + 1);
      root.style.setProperty("--w-" + k, widthOf(k) + "px");
      if (i >= 0) { root.classList.add("has-c-" + k); sum += widthOf(k) + 12; }
    });
    root.style.setProperty("--mx-rowmin", (FIXED_LEFT + NAME_MIN + sum + FIXED_RIGHT) + "px");
    lazy();
  }

  // ---------------------------------------------------------------- Glisser-déposer des titres et redimensionnement
  var dragKey = null;
  root.addEventListener("dragstart", function (e) {
    var c = e.target.closest && e.target.closest(".mx-colhead [data-col]"); if (!c || c.getAttribute("data-col") === "name") return;
    dragKey = c.getAttribute("data-col"); e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/x-mx-col", dragKey); } catch (x) { /* ignoré */ }
    c.classList.add("is-dragcol");
  });
  function clearMarks() { $$(".mx-colhead .is-dropbefore, .mx-colhead .is-dropafter, .mx-colhead .is-dragcol", root).forEach(function (n) { n.classList.remove("is-dropbefore", "is-dropafter", "is-dragcol"); }); }
  root.addEventListener("dragover", function (e) {
    if (!dragKey) return; var c = e.target.closest(".mx-colhead [data-col]"); if (!c) return; e.preventDefault(); e.dataTransfer.dropEffect = "move";
    var r = c.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2; $$(".mx-colhead .is-dropbefore, .mx-colhead .is-dropafter", root).forEach(function (n) { n.classList.remove("is-dropbefore", "is-dropafter"); });
    if (c.getAttribute("data-col") !== dragKey) c.classList.add(after ? "is-dropafter" : "is-dropbefore");
  });
  root.addEventListener("drop", function (e) {
    if (!dragKey) return; var c = e.target.closest(".mx-colhead [data-col]"); if (!c) { clearMarks(); dragKey = null; return; }
    e.preventDefault(); var r = c.getBoundingClientRect(), after = e.clientX > r.left + r.width / 2, to = c.getAttribute("data-col");
    var k = dragKey; dragKey = null; clearMarks(); if (to !== k) move(k, to, after);
  });
  root.addEventListener("dragend", function () { dragKey = null; clearMarks(); });
  // Déplace la colonne « k » avant ou après « to » (si « k » est masquée, elle devient visible)
  function move(k, to, after) {
    var list = activeList().filter(function (x) { return x !== k; }), i = list.indexOf(to);
    if (i < 0) list.push(k); else list.splice(after ? i + 1 : i, 0, k);
    persist(list); apply(); paintPanel();
  }
  // Largeur : tirer le bord droit du titre (souris, tactile), flèches au clavier, double-clic pour revenir à la largeur d'origine
  var rs = null;
  root.addEventListener("pointerdown", function (e) {
    var g = e.target.closest && e.target.closest("[data-mx-resize]"); if (!g) return;
    e.preventDefault(); e.stopPropagation(); var k = g.getAttribute("data-mx-resize"), cell = g.closest("[data-col]"); cell.draggable = false;
    rs = { k: k, x: e.clientX, w: widthOf(k), g: g, cell: cell }; try { g.setPointerCapture(e.pointerId); } catch (x) { /* ignoré */ } g.classList.add("is-drag");
  }, true);
  root.addEventListener("pointermove", function (e) { if (!rs) return; setWidth(rs.k, rs.w + (e.clientX - rs.x), true); });
  function endResize() { if (!rs) return; rs.g.classList.remove("is-drag"); rs.cell.draggable = true; var k = rs.k; rs = null; var w = Object.assign({}, prefs().colWidths); w[k] = widthOf(k); MX.savePrefs({ colWidths: w }); }
  root.addEventListener("pointerup", endResize); root.addEventListener("pointercancel", endResize);
  function setWidth(k, w, live) { w = Math.min(Math.max(Math.round(w), 56), 480); var p = prefs(); p.colWidths = Object.assign({}, p.colWidths); p.colWidths[k] = w; apply(); if (!live) MX.savePrefs({ colWidths: p.colWidths }); }
  root.addEventListener("keydown", function (e) {
    var g = e.target.closest && e.target.closest("[data-mx-resize]"); if (!g || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault(); e.stopPropagation(); var k = g.getAttribute("data-mx-resize"); setWidth(k, widthOf(k) + (e.key === "ArrowRight" ? 10 : -10));
  }, true);
  root.addEventListener("dblclick", function (e) {
    var g = e.target.closest && e.target.closest("[data-mx-resize]"); if (!g) return; e.stopPropagation();
    var k = g.getAttribute("data-mx-resize"), p = prefs(), w = Object.assign({}, p.colWidths); delete w[k]; p.colWidths = w; apply(); MX.savePrefs({ colWidths: w });
  }, true);
  // Un clic sur le bord d'un titre ne doit jamais déclencher le tri
  root.addEventListener("click", function (e) { if (e.target.closest && e.target.closest("[data-mx-resize]")) { e.preventDefault(); e.stopPropagation(); } }, true);

  // ---------------------------------------------------------------- Tri : mémorisé avant la navigation (le serveur relit la préférence)
  root.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-mx-sort]"); if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var tri = new URL(a.href, location.href).searchParams.get("tri") || "recent";
    e.preventDefault(); e.stopPropagation();
    MX.savePrefs({ sort: tri }); MX.flushPrefs().then(function () { MX.go(a.href); });
  }, true);

  // ---------------------------------------------------------------- Chargement différé des informations lues dans le fichier (durée, résolution vidéo, date de prise de vue)
  var cache = new Map(), queue = [], running = 0, io = null;
  var fdate = function (v) { return v ? String(v).slice(0, 10).split("-").reverse().join("/") + " " + String(v).slice(11, 16) : "—"; };
  var vres = function (hh) { return hh >= 2160 ? "4K (2160p)" : hh ? hh + "p" : "—"; };
  function fill(cell, info) {
    var kind = cell.getAttribute("data-lazy"), v = "—";
    if (info) {
      if (kind === "duration" && info.duration && isFinite(info.duration)) v = window.MXViewer ? window.MXViewer.fmtDur(info.duration) : String(Math.round(info.duration)) + " s";
      else if (kind === "vdims" && info.width) v = info.width + " × " + info.height + " px";
      else if (kind === "vres" && info.height) v = vres(info.height);
      else if (kind === "taken" && info.takenAt) v = fdate(info.takenAt);
    }
    cell.textContent = v; cell.setAttribute("data-lazy-done", "1");
  }
  function probe(id, type, path, kinds) {
    if (cache.has(id)) return cache.get(id);
    var p = new Promise(function (resolve) {
      if (kinds.indexOf("taken") >= 0 && type === "image") { window.MXViewer.detail(id).then(function (d) { resolve({ takenAt: d.exif && d.exif.takenAt || "" }); }, function () { resolve(null); }); return; }
      var m = document.createElement(type === "audio" ? "audio" : "video"); m.preload = "metadata"; m.muted = true;
      var done = function (r) { m.onloadedmetadata = m.onerror = null; m.removeAttribute("src"); try { m.load(); } catch (e) { /* rien à libérer */ } resolve(r); };
      m.onloadedmetadata = function () { done({ duration: m.duration, width: m.videoWidth || 0, height: m.videoHeight || 0 }); };
      m.onerror = function () { done(null); };
      setTimeout(function () { done(null); }, 12000);
      m.src = path;
    });
    cache.set(id, p); return p;
  }
  function pump() {
    while (running < 2 && queue.length) {
      var cell = queue.shift(); if (!cell.isConnected || cell.getAttribute("data-lazy-done")) continue;
      var li = cell.closest("[data-ml-item]"); if (!li) continue; running++;
      var kind = cell.getAttribute("data-lazy");
      probe(Number(li.getAttribute("data-id")), li.getAttribute("data-type"), li.getAttribute("data-path"), [kind]).then(function (c) { return function (info) { fill(c, info); running--; pump(); }; }(cell));
    }
  }
  function lazy() {
    if (io) io.disconnect();
    if (typeof IntersectionObserver === "undefined") return;
    var scroller = $("[data-mx-scroll]", root);
    io = new IntersectionObserver(function (entries) { entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); queue.push(en.target); } }); pump(); }, { root: scroller, rootMargin: "200px 1500px 200px 1500px" });
    $$("[data-lazy]:not([data-lazy-done])", root).forEach(function (cell) {
      var k = (cell.getAttribute("data-col") || ""); if (!root.classList.contains("has-c-" + k) || root.getAttribute("data-view") !== "liste") return;
      io.observe(cell);
    });
  }

  // ---------------------------------------------------------------- Panneau « Colonnes et affichage »
  var panel = null, chosenCfg = "";
  function newId() { return Math.random().toString(36).slice(2, 10); }
  function configs() { return prefs().colConfigs || []; }
  function typeApplies(k) { var c = MX.cfg().type, d = defs()[k]; if (!c || !d) return true; var t = c === "documents" ? ["pdf", "document"] : [c]; return t.some(function (x) { return d.apply.indexOf(x) >= 0; }); }
  function paintPanel() {
    panel = $("[data-mx-colpanel]", root); if (!panel) return;
    var d = defs(), list = activeList(), c = category(), p = prefs(), cf = configs();
    var rest = Object.keys(d).filter(function (k) { return list.indexOf(k) < 0; });
    panel.textContent = "";
    panel.appendChild(h("p", { class: "mx-pop-title", text: "Colonnes affichées" }));
    if (c) panel.appendChild(h("p", { class: "mx-pop-note", text: "Disposition propre à cette catégorie (" + ({ image: "images", video: "vidéos", audio: "audio", documents: "documents", lottie: "animations" }[c]) + ")." }));
    var ul = h("ul", { class: "mx-collist", role: "list" });
    ul.appendChild(h("li", { class: "mx-colrow is-fixed" }, [h("span", { class: "mx-grip", "aria-hidden": "true" }), h("input", { type: "checkbox", checked: "", disabled: "", "aria-label": "Nom (toujours affiché)" }), h("span", { class: "mx-colname", text: "Nom" }), h("span", { class: "mx-colhint", text: "toujours affiché" })]));
    list.concat(rest).forEach(function (k) {
      var on = list.indexOf(k) >= 0, i = list.indexOf(k), ok = typeApplies(k);
      var cb = h("input", { type: "checkbox", value: k, checked: on ? "" : null, "aria-label": d[k].label });
      cb.addEventListener("change", function () { var l = activeList().filter(function (x) { return x !== k; }); if (cb.checked) l.push(k); persist(l); apply(); paintPanel(); });
      var up = h("button", { type: "button", class: "mx-iconbtn is-small", "aria-label": "Monter la colonne " + d[k].label, title: "Monter", text: "↑", disabled: !on || i === 0 ? "" : null, onclick: function () { var l = activeList(); l.splice(i, 1); l.splice(i - 1, 0, k); persist(l); apply(); paintPanel(); } });
      var dn = h("button", { type: "button", class: "mx-iconbtn is-small", "aria-label": "Descendre la colonne " + d[k].label, title: "Descendre", text: "↓", disabled: !on || i === list.length - 1 ? "" : null, onclick: function () { var l = activeList(); l.splice(i, 1); l.splice(i + 1, 0, k); persist(l); apply(); paintPanel(); } });
      var li = h("li", { class: "mx-colrow" + (on ? "" : " is-off"), "data-colrow": k, draggable: on ? "true" : null }, [h("span", { class: "mx-grip", "aria-hidden": "true", text: "⋮⋮" }), cb, h("span", { class: "mx-colname", text: d[k].label }), !ok ? h("span", { class: "mx-colhint", text: "peu utile ici" }) : d[k].lazy ? h("span", { class: "mx-colhint", text: "lu dans le fichier" }) : null, up, dn]);
      li.addEventListener("dragstart", function (e) { dragKey = k; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/x-mx-col", k); } catch (x) { /* ignoré */ } li.classList.add("is-dragcol"); });
      li.addEventListener("dragover", function (e) { if (!dragKey || dragKey === k || list.indexOf(k) < 0) return; e.preventDefault(); var r = li.getBoundingClientRect(); $$(".is-dropbefore, .is-dropafter", ul).forEach(function (n) { n.classList.remove("is-dropbefore", "is-dropafter"); }); li.classList.add(e.clientY > r.top + r.height / 2 ? "is-dropafter" : "is-dropbefore"); });
      li.addEventListener("drop", function (e) { if (!dragKey) return; e.preventDefault(); var r = li.getBoundingClientRect(), from = dragKey; dragKey = null; if (from !== k) move(from, k, e.clientY > r.top + r.height / 2); });
      li.addEventListener("dragend", function () { dragKey = null; $$(".is-dragcol, .is-dropbefore, .is-dropafter", ul).forEach(function (n) { n.classList.remove("is-dragcol", "is-dropbefore", "is-dropafter"); }); });
      ul.appendChild(li);
    });
    panel.appendChild(ul);
    var smart = h("label", { class: "mx-check-row" }, [h("input", { type: "checkbox", "data-mx-smart": "", checked: p.colSmart ? "" : null }), document.createTextNode(" Adapter les colonnes au type de fichier")]);
    smart.firstChild.addEventListener("change", function (e) { MX.savePrefs({ colSmart: e.target.checked }); apply(); paintPanel(); });
    panel.appendChild(smart);
    panel.appendChild(h("label", { class: "mx-check-row" }, [Object.assign(h("input", { type: "checkbox", "data-mx-density": "", checked: p.density === "compacte" ? "" : null }), {}), document.createTextNode(" Lignes serrées")]));
    // Configurations enregistrées
    panel.appendChild(h("p", { class: "mx-pop-title", text: "Configurations" }));
    var select = h("select", { "data-mx-cfg": "", "aria-label": "Configurations d'affichage enregistrées" }, [h("option", { value: "", text: cf.length ? "Disposition actuelle" : "Aucune enregistrée" })].concat(cf.map(function (x) { return h("option", { value: x.id, text: (p.colDefault === x.id ? "★ " : "") + x.name, selected: chosenCfg === x.id ? "" : null }); })));
    select.addEventListener("change", function () { chosenCfg = select.value; var x = cf.find(function (y) { return y.id === select.value; }); if (x) applyConfig(x); });
    if (chosenCfg && !cf.some(function (y) { return y.id === chosenCfg; })) chosenCfg = "";
    panel.appendChild(select);
    var act = h("div", { class: "mx-cfg-actions" }, [
      small("Enregistrer sous…", saveNew), small("Mettre à jour", function () { var x = cur(); if (x) update(x); else MX.toast("Choisissez d'abord une configuration.", "error"); }),
      small("Renommer", function () { var x = cur(); if (x) rename(x); }), small("Par défaut", function () { var x = cur(); if (x) setDefault(x); }), small("Supprimer", function () { var x = cur(); if (x) del(x); }),
    ]);
    function cur() { return cf.find(function (y) { return y.id === select.value; }); }
    panel.appendChild(act);
    panel.appendChild(h("button", { type: "button", class: "btn btn-ghost btn-sm mx-colreset", "data-mx-colreset": "", text: "Réinitialiser la disposition", onclick: reset }));
  }
  function small(label, run) { return h("button", { type: "button", class: "btn btn-outline btn-sm", text: label, onclick: run }); }
  function snapshot() { var p = prefs(); return { columns: activeList(), colWidths: Object.assign({}, p.colWidths) }; }
  function applyConfig(x) { persist(x.columns.slice()); var p = prefs(); p.colWidths = Object.assign({}, x.colWidths); MX.savePrefs({ colWidths: p.colWidths }); apply(); paintPanel(); MX.toast("Configuration « " + x.name + " » appliquée.", "ok"); }
  function saveNew() {
    if (configs().length >= 12) { MX.toast("Douze configurations au maximum : supprimez-en une.", "error"); return; }
    MX.askText("Enregistrer la disposition", { label: "Nom de la configuration", max: "40", ok: "Enregistrer", placeholder: "Ex. : Photos, Vidéos pour le web" }).then(function (name) {
      if (!name) return; var s = snapshot(), list = configs().concat([{ id: newId(), name: name, columns: s.columns, colWidths: s.colWidths }]);
      MX.savePrefs({ colConfigs: list }); paintPanel(); MX.toast("Configuration « " + name + " » enregistrée.", "ok");
    });
  }
  function update(x) { var s = snapshot(); MX.savePrefs({ colConfigs: configs().map(function (y) { return y.id === x.id ? Object.assign({}, y, s) : y; }) }); paintPanel(); MX.toast("Configuration « " + x.name + " » mise à jour.", "ok"); }
  function rename(x) { MX.askText("Renommer la configuration", { label: "Nom", value: x.name, max: "40", ok: "Renommer" }).then(function (name) { if (!name) return; MX.savePrefs({ colConfigs: configs().map(function (y) { return y.id === x.id ? Object.assign({}, y, { name: name }) : y; }) }); paintPanel(); }); }
  function setDefault(x) { MX.savePrefs({ colDefault: prefs().colDefault === x.id ? "" : x.id }); paintPanel(); MX.toast(prefs().colDefault === x.id ? "« " + x.name + " » est la configuration par défaut." : "Plus de configuration par défaut.", "ok"); }
  function del(x) { MX.confirm("Supprimer la configuration ?", "« " + x.name + " » sera supprimée. Les colonnes affichées ne changent pas.", "Supprimer", true).then(function (ok) { if (!ok) return; var p = prefs(); MX.savePrefs({ colConfigs: configs().filter(function (y) { return y.id !== x.id; }), colDefault: p.colDefault === x.id ? "" : p.colDefault }); paintPanel(); }); }
  // Réinitialiser : retour à la configuration par défaut si elle existe, sinon à la disposition d'origine (catégorie : celle proposée pour elle)
  function reset() {
    var p = prefs(), def = configs().find(function (y) { return y.id === p.colDefault; }), c = category();
    if (def) { applyConfig(def); return; }
    if (c) { var by = Object.assign({}, p.colByType); delete by[c]; p.colByType = by; MX.savePrefs({ colByType: by, colWidths: {} }); }
    else MX.savePrefs({ columns: ["type", "size", "dims", "modified"], colWidths: {} });
    p.colWidths = {}; if (!c) p.columns = ["type", "size", "dims", "modified"];
    apply(); paintPanel(); MX.toast("Disposition réinitialisée.", "ok");
  }
  // Ouverture du panneau : on le dessine à la demande (liste à jour, catégorie courante)
  root.addEventListener("toggle", function (e) { if (e.target.matches && e.target.matches("[data-mx-cols]") && e.target.open) paintPanel(); }, true);

  window.MXColumns = { apply: apply, move: move, setWidth: setWidth, active: activeList, paint: paintPanel, reset: reset, lazy: lazy };
  MX.columns = window.MXColumns;
  apply();
})();

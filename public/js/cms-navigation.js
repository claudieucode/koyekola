// KOLAKISA CMS → Apparence → Menus : éditeur d'un menu. La structure vit en mémoire et s'écrit EN UNE FOIS (« Enregistrer le menu »), tout ou rien, avec contrôle de version.
// Tout le contenu vient du JSON #nm-data posé par le serveur ; le serveur REVALIDE tout à l'enregistrement (adresses, appartenance au site, profondeur, boucles).
// Accessibilité : boutons Monter / Descendre / Imbriquer / Remonter (et Alt + flèches) en plus du glisser-déposer ; changements annoncés dans une zone vocale.
(function () {
  var root = document.querySelector("[data-nm]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] === false || attrs[k] == null) return; if (k === "text") el.textContent = attrs[k]; else el.setAttribute(k, attrs[k] === true ? "" : attrs[k]); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var D = JSON.parse(document.getElementById("nm-data").textContent);
  var CAN = D.canWrite, MAX = D.maxDepth, MAXITEMS = D.maxItems;
  var TYPE_LABEL = {}; Object.keys(D.types).forEach(function (k) { TYPE_LABEL[k] = D.types[k].label; });
  var seq = 0, nk = function () { return "k" + (++seq); };

  // ---------- Modèle ----------
  var S = { revision: D.menu.revision, name: D.menu.name, description: D.menu.description, status: D.menu.status, auto: !!D.menu.autoAddPages, locations: {}, items: [] };
  D.locations.forEach(function (l) { S.locations[l.key] = l.on; });
  function build(flat) {
    var by = {}, roots = [];
    flat.forEach(function (f) { by[f.id] = { key: nk(), id: f.id, type: f.type, object_id: f.object_id, url: f.url, label: f.label, title_attr: f.title_attr, css_class: f.css_class, icon: f.icon || "", description: f.description || "", badge: f.badge || "", new_tab: f.new_tab, rel: f.rel ? f.rel.split(" ").filter(Boolean) : [], visibility: f.visibility, status: f.status, resource: f.resource, stateLabel: f.stateLabel, children: [], open: false }; });
    flat.forEach(function (f) { var n = by[f.id]; if (f.parent && by[f.parent]) by[f.parent].children.push(n); else roots.push(n); });
    return roots;
  }
  S.items = build(D.items);
  function ser(nodes, forSnap) {
    return nodes.map(function (n) {
      var o = { type: n.type, label: n.label, title_attr: n.title_attr, css_class: n.css_class, icon: n.icon || "", description: n.description || "", badge: n.badge || "", new_tab: !!n.new_tab, rel: n.rel.join(" "), visibility: n.visibility, status: n.status, children: ser(n.children, forSnap) };
      if (!forSnap) { if (n.id) o.id = n.id; else o.key = n.key; }
      if (D.types[n.type] && D.types[n.type].needsObject) o.object_id = n.object_id;
      if (n.type === "custom") o.url = n.url;
      return o;
    });
  }
  var payload = function () { var p = { revision: S.revision, name: S.name, description: S.description, status: S.status, autoAddPages: S.auto, items: ser(S.items) }; if (D.canPublish) p.locations = S.locations; return p; };
  var snap = function () { return JSON.stringify({ n: S.name, d: S.description, s: S.status, a: S.auto, l: S.locations, i: ser(S.items, true) }); };
  var saved = snap(), saving = false, conflict = false, savedAt = "";
  var undo = [], redo = [];
  var flatten = function (nodes, out) { out = out || []; nodes.forEach(function (n) { out.push(n); flatten(n.children, out); }); return out; };
  var count = function () { return flatten(S.items).length; };
  function find(key, list, parent) {
    list = list || S.items;
    for (var i = 0; i < list.length; i += 1) {
      if (list[i].key === key) return { list: list, index: i, node: list[i], parent: parent || null };
      var r = find(key, list[i].children, list[i]); if (r) return r;
    }
    return null;
  }
  function depthOf(node) { var d = 1, p = findParent(node.key); while (p) { d += 1; p = findParent(p.key); } return d; }
  function findParent(key) { var r = find(key); return r && r.parent; }
  var height = function (n) { return 1 + n.children.reduce(function (m, c) { return Math.max(m, height(c)); }, 0); };
  var contains = function (n, key) { return n.key === key || n.children.some(function (c) { return contains(c, key); }); };
  function clone(n) { var c = JSON.parse(JSON.stringify(n)); (function fresh(x) { x.key = nk(); x.id = null; x.children.forEach(fresh); })(c); return c; }
  function label(n) { return n.label || (n.resource && n.resource.title) || "(sans titre)"; }

  // ---------- Annonces, bandeau, état ----------
  var live = $("[data-nm-live]"), stateEl = $("[data-nm-state]"), banner = $("[data-nm-banner]"), bannerText = $("[data-nm-banner-text]"), bannerBtn = $("[data-nm-banner-action]");
  function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }
  function showBanner(text, actionLabel, action) {
    bannerText.textContent = text; banner.hidden = false;
    bannerBtn.hidden = !actionLabel; bannerBtn.textContent = actionLabel || ""; bannerBtn.onclick = action || null;
  }
  var hideBanner = function () { banner.hidden = true; };
  var dirty = function () { return snap() !== saved; };
  function refresh() {
    var d = dirty();
    stateEl.classList.toggle("is-dirty", d);
    stateEl.textContent = saving ? "Enregistrement…" : d ? "Modifications non enregistrées" : savedAt ? "Menu enregistré à " + savedAt + "." : "Aucune modification.";
    var sv = $("[data-nm-save]");
    if (sv) { sv.disabled = !d || saving || conflict; sv.classList.toggle("is-busy", saving); sv.textContent = saving ? "Enregistrement…" : "Enregistrer le menu"; }
    $("[data-nm-undo]").disabled = !undo.length; $("[data-nm-redo]").disabled = !redo.length;
    var empty = !count(); $("[data-nm-empty]").hidden = !empty;
    $("[data-nm-help]").textContent = CAN && count() > 1 ? "Glissez un élément par sa poignée, ou utilisez les boutons ↑ ↓ ← → (Alt + flèches au clavier). Un élément déposé au milieu d'un autre devient son sous-élément (" + MAX + " niveaux au plus)." : "";
    document.title = (d ? "• " : "") + document.title.replace(/^• /, "");
  }
  function guard(e) { if (dirty()) { e.preventDefault(); e.returnValue = ""; } }
  window.addEventListener("beforeunload", guard);
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (a && dirty() && !a.target && !confirm("Des modifications du menu ne sont pas enregistrées. Quitter cette page sans les enregistrer ?")) e.preventDefault();
  }, true);
  // Sélecteur de menu : avertit avant de quitter un menu modifié (Annuler remet le menu actuel dans la liste)
  $$("[data-nm-pick]").forEach(function (sel) {
    var here = sel.value;
    sel.addEventListener("change", function () {
      if (dirty() && !confirm("Des modifications du menu ne sont pas enregistrées. Changer de menu sans les enregistrer ?")) { sel.value = here; return; }
      window.removeEventListener("beforeunload", guard); location.href = sel.value;
    });
  });
  $$("[data-nm-dirty-guard]").forEach(function (f) { f.addEventListener("submit", function (e) { if (dirty() && !confirm("Des modifications du menu ne sont pas enregistrées. La copie ne les contiendra pas. Continuer ?")) e.preventDefault(); }); });

  // ---------- Historique (structure : ajout, retrait, déplacement, duplication) ----------
  function remember() { undo.push(JSON.stringify(S.items)); if (undo.length > 50) undo.shift(); redo = []; }
  function restore(from, to, msg) {
    if (!from.length) return;
    to.push(JSON.stringify(S.items)); S.items = JSON.parse(from.pop());
    render(); refresh(); say(msg);
  }

  // ---------- Rendu de la structure ----------
  var tree = $("[data-nm-tree]"), openKeys = {};
  function chip(text, cls) { return h("span", { class: "mk-nm-chip " + (cls || ""), text: text }); }
  function row(n, depth, idx, total) {
    var li = h("li", { class: "mk-nm-item" + (n.status === "hidden" ? " is-hidden" : "") + (bad(n) ? " is-broken" : ""), "data-key": n.key, role: "treeitem", "aria-level": String(depth), "aria-posinset": String(idx + 1), "aria-setsize": String(total), "aria-expanded": n.children.length ? "true" : null });
    var pid = "nm-p-" + n.key, open = !!openKeys[n.key];
    var head = h("div", { class: "mk-nm-row" });
    if (CAN) head.appendChild(h("button", { type: "button", class: "mk-nm-handle", "data-act": "drag", "aria-label": "Déplacer « " + label(n) + " » (glisser, ou Alt + flèches)", title: "Glisser pour déplacer" }, "⋮⋮"));
    var toggle = h("button", { type: "button", class: "mk-nm-toggle", "data-act": "toggle", "aria-expanded": String(open), "aria-controls": pid }, [
      h("span", { class: "mk-nm-label", text: label(n) }),
      h("span", { class: "mk-nm-type", text: TYPE_LABEL[n.type] || n.type }),
      n.status === "hidden" ? chip("Masqué", "is-off") : null,
      n.visibility !== "all" ? chip(n.visibility === "members" ? "Membres" : "Visiteurs", "is-info") : null,
      bad(n) ? chip(n.stateLabel || "Lien à réparer", "is-err") : null,
    ]);
    head.appendChild(toggle);
    if (CAN) {
      var acts = h("div", { class: "mk-nm-moves", role: "group", "aria-label": "Déplacer « " + label(n) + " »" });
      [["up", "↑", "Monter"], ["down", "↓", "Descendre"], ["in", "→", "Imbriquer sous l'élément précédent"], ["out", "←", "Remonter d'un niveau"]].forEach(function (m) {
        var b = h("button", { type: "button", class: "mk-nm-mv", "data-act": m[0], "aria-label": m[2] + " : " + label(n), title: m[2] }, m[1]);
        if (!can(n, m[0])) b.disabled = true;
        acts.appendChild(b);
      });
      head.appendChild(acts);
    }
    li.appendChild(head);
    li.appendChild(panel(n, pid, open));
    if (n.children.length) { var ol = h("ol", { class: "mk-nm-children", role: "group" }); n.children.forEach(function (c, i) { ol.appendChild(row(c, depth + 1, i, n.children.length)); }); li.appendChild(ol); }
    return li;
  }
  function bad(n) { return n.type !== "custom" && n.type !== "home" && n.resource && n.resource.state !== "ok"; }
  function render() { tree.textContent = ""; S.items.forEach(function (n, i) { tree.appendChild(row(n, 1, i, S.items.length)); }); }

  // Possibilité d'un déplacement (les boutons impossibles sont désactivés)
  function can(n, dir) {
    var r = find(n.key); if (!r) return false;
    if (dir === "up") return r.index > 0;
    if (dir === "down") return r.index < r.list.length - 1;
    if (dir === "in") return r.index > 0 && depthOf(r.list[r.index - 1]) + height(n) <= MAX;
    if (dir === "out") return !!r.parent;
    return false;
  }
  function move(key, dir) {
    var r = find(key); if (!r || !can(r.node, dir)) return;
    remember();
    var n = r.node;
    r.list.splice(r.index, 1);
    if (dir === "up") r.list.splice(r.index - 1, 0, n);
    else if (dir === "down") r.list.splice(r.index + 1, 0, n);
    else if (dir === "in") { var p = r.list[r.index - 1]; p.children.push(n); openKeys[p.key] = openKeys[p.key]; }
    else { var pr = find(r.parent.key); pr.list.splice(pr.index + 1, 0, n); }
    after(key, dir);
  }
  function after(key, dir) {
    render(); refresh();
    var r = find(key), li = tree.querySelector('[data-key="' + key + '"]');
    var btn = li && (li.querySelector(':scope > .mk-nm-row [data-act="' + dir + '"]:not(:disabled)') || li.querySelector(':scope > .mk-nm-row [data-act="toggle"]'));
    if (btn) btn.focus();
    if (r) say("« " + label(r.node) + " » : niveau " + depthOf(r.node) + ", position " + (r.index + 1) + " sur " + r.list.length + ".");
  }
  // Dépôt (glisser-déposer) : avant / après / dans la cible
  function drop(key, targetKey, kind) {
    var r = find(key), t = find(targetKey);
    if (!r || !t || contains(r.node, targetKey)) return;
    if (kind === "inside" && depthOf(t.node) + height(r.node) > MAX) kind = "after";
    var targetDepth = kind === "inside" ? depthOf(t.node) : depthOf(t.node) - 1;
    if (targetDepth + height(r.node) > MAX) { say("Déplacement impossible : " + MAX + " niveaux au plus."); return; }
    remember();
    r.list.splice(r.index, 1);
    var t2 = find(targetKey);
    if (kind === "inside") t2.node.children.push(r.node);
    else t2.list.splice(t2.index + (kind === "after" ? 1 : 0), 0, r.node);
    after(key, "toggle");
  }

  // ---------- Panneau d'options d'un élément ----------
  function field(id, text, input, hint) { return h("div", { class: "field-group" }, [h("label", { for: id, text: text }), input, hint ? h("span", { class: "field-hint", text: hint }) : null]); }
  function check(id, text, on, fn) { var i = h("input", { type: "checkbox", id: id }); i.checked = on; i.disabled = !CAN; i.addEventListener("change", function () { fn(i.checked); }); return h("label", { class: "mk-cms-check", for: id }, [i, " " + text]); }
  function panel(n, pid, open) {
    var p = h("div", { class: "mk-nm-panel", id: pid, hidden: open ? null : true });
    if (!open) return p;
    var id = pid + "-";
    function text(name, key, max, opts) {
      var i = h("input", { type: "text", id: id + name, maxlength: String(max), autocomplete: "off", placeholder: opts && opts.placeholder || null });
      i.value = n[key] || ""; i.disabled = !CAN || (opts && opts.readonly);
      i.addEventListener("input", function () { n[key] = i.value; if (key === "label" || key === "url") syncRow(n); refresh(); });
      return i;
    }
    var isRes = D.types[n.type] && D.types[n.type].needsObject;
    p.appendChild(field(id + "label", "Libellé de navigation", text("label", "label", 80, { placeholder: n.resource && n.resource.title || "" }), isRes ? "Laissez vide pour reprendre le titre de la ressource. Changer ce libellé ne modifie jamais la ressource." : null));
    if (n.type === "custom") p.appendChild(field(id + "url", "Adresse (URL)", text("url", "url", 500), "/page, https://exemple.org, une ancre (#tarifs), mailto: ou tel:."));
    else if (n.type === "home") p.appendChild(h("p", { class: "field-hint", text: "Destination : page d'accueil du site (/)." }));
    else p.appendChild(h("p", { class: "field-hint" }, ["Destination : ", h("strong", { text: n.resource && n.resource.title || "introuvable" }), n.resource && n.resource.url ? " — " + n.resource.url : ""]));
    if (isRes && CAN) p.appendChild(replacer(n, id));
    p.appendChild(h("details", { class: "mk-nm-adv" }, [h("summary", { text: "Options avancées" }), h("div", { class: "mk-nm-adv-body" }, [
      field(id + "title", "Attribut « title » du lien", text("title", "title_attr", 120)),
      field(id + "css", "Classes CSS supplémentaires", text("css", "css_class", 100), "Cinq classes au plus ; lettres, chiffres, tiret et soulignement."),
      field(id + "badge", "Pastille (ex. Nouveau, -20 %)", text("badge", "badge", 16), "Petit texte affiché à côté du lien dans l'en-tête du site (16 caractères au plus)."),
      field(id + "desc", "Description sous le lien", text("desc", "description", 160), "Affichée sous le lien dans les menus de l'en-tête qui l'activent."),
      field(id + "icon", "Icône (nom, ex. home, star)", text("icon", "icon", 30), "Nom d'une icône du site ; vide = aucune."),
      h("div", { class: "mk-nm-opts" }, [
        check(id + "tab", "Ouvrir dans un nouvel onglet", n.new_tab, function (v) { n.new_tab = v; refresh(); }),
        check(id + "hid", "Masquer cet élément sur le site", n.status === "hidden", function (v) { n.status = v ? "hidden" : "published"; syncRow(n); refresh(); }),
      ]),
      (function () {
        var sel = h("select", { id: id + "vis" }, [["all", "Tout le monde"], ["members", "Membres connectés"], ["guests", "Visiteurs non connectés"]].map(function (o) { var op = h("option", { value: o[0], text: o[1] }); if (n.visibility === o[0]) op.selected = true; return op; }));
        sel.disabled = !CAN; sel.addEventListener("change", function () { n.visibility = sel.value; syncRow(n); refresh(); });
        return field(id + "vis", "Visible pour", sel);
      })(),
      h("fieldset", { class: "mk-nm-rel" }, [h("legend", { text: "Attributs du lien (rel)" })].concat(D.rel.map(function (r) {
        return check(id + "rel-" + r, r, n.rel.indexOf(r) >= 0, function (v) { n.rel = n.rel.filter(function (x) { return x !== r; }); if (v) n.rel.push(r); refresh(); });
      })).concat([h("span", { class: "field-hint", text: "« noopener noreferrer » est ajouté automatiquement aux liens externes et aux nouveaux onglets." })])),
    ])]));
    if (CAN) p.appendChild(h("div", { class: "mk-nm-panel-actions" }, [
      h("button", { type: "button", class: "mk-wd-btn", "data-act": "dup" }, "Dupliquer"),
      h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--danger", "data-act": "remove" }, "Retirer du menu"),
    ]));
    return p;
  }
  function syncRow(n) {
    var li = tree.querySelector('[data-key="' + n.key + '"]'); if (!li) return;
    var row = li.querySelector(":scope > .mk-nm-row"), l = row.querySelector(".mk-nm-label"); if (l) l.textContent = label(n);
    li.classList.toggle("is-hidden", n.status === "hidden");
    var oldChips = row.querySelectorAll(".mk-nm-chip"); oldChips.forEach(function (c) { c.remove(); });
    var t = row.querySelector(".mk-nm-toggle");
    if (n.status === "hidden") t.appendChild(chip("Masqué", "is-off"));
    if (n.visibility !== "all") t.appendChild(chip(n.visibility === "members" ? "Membres" : "Visiteurs", "is-info"));
    if (bad(n)) t.appendChild(chip(n.stateLabel || "Lien à réparer", "is-err"));
    li.classList.toggle("is-broken", bad(n));
  }
  // Remplacer la destination (réparer un lien cassé) : recherche côté serveur
  function replacer(n, id) {
    var input = h("input", { type: "search", id: id + "rep", placeholder: "Rechercher " + (TYPE_LABEL[n.type] || "").toLowerCase() + "…", autocomplete: "off" });
    var list = h("ul", { class: "mk-nm-results", "aria-live": "polite" }), timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!input.value.trim()) { list.textContent = ""; return; }
        fetchResources({ type: n.type, q: input.value, offset: 0 }).then(function (d) {
          list.textContent = "";
          if (!d.results.length) list.appendChild(h("li", { class: "mk-nm-none", text: "Aucun résultat." }));
          d.results.forEach(function (r) {
            var b = h("button", { type: "button", class: "mk-nm-pick", text: r.title });
            b.addEventListener("click", function () { n.object_id = r.id; n.resource = { title: r.title, url: r.detail, state: "ok" }; n.stateLabel = ""; syncRow(n); list.textContent = ""; list.appendChild(h("li", { class: "mk-nm-none", text: "Destination choisie : " + r.title + " — enregistrez le menu pour l'appliquer." })); refresh(); say("Destination remplacée par " + r.title + "."); });
            list.appendChild(h("li", null, b));
          });
        }, function () { list.textContent = ""; list.appendChild(h("li", { class: "mk-nm-none", text: "Recherche indisponible." })); });
      }, 250);
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
    return h("div", { class: "field-group" }, [h("label", { for: id + "rep", text: "Remplacer la destination" }), input, list]);
  }

  // Actions sur la structure (délégation)
  tree.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b) return;
    var li = b.closest("li.mk-nm-item"), key = li.getAttribute("data-key"), act = b.getAttribute("data-act");
    if (act === "toggle") { var r0 = find(key); openKeys[key] = !openKeys[key]; render(); var nb = tree.querySelector('[data-key="' + key + '"] > .mk-nm-row [data-act="toggle"]'); if (nb) nb.focus(); if (openKeys[key]) { var f = tree.querySelector('[data-key="' + key + '"] > .mk-nm-panel input[type=text]'); if (f) f.focus(); } void r0; return; }
    if (!CAN) return;
    if (act === "up" || act === "down" || act === "in" || act === "out") return move(key, act);
    var r = find(key);
    if (act === "remove") {
      remember();
      var kids = r.node.children; r.list.splice.apply(r.list, [r.index, 1].concat(kids)); // les sous-éléments remontent d'un niveau
      render(); refresh(); say("« " + label(r.node) + " » retiré du menu (non enregistré). Annulez pour le rétablir.");
      var nx = tree.querySelector(".mk-nm-toggle"); if (nx) nx.focus();
    }
    if (act === "dup") {
      var sz = flatten([r.node]).length;
      if (count() + sz > MAXITEMS) return showBanner("Un menu contient " + MAXITEMS + " éléments au plus.");
      remember(); var c = clone(r.node); r.list.splice(r.index + 1, 0, c); openKeys[c.key] = true; render(); refresh(); say("« " + label(c) + " » dupliqué.");
      var f2 = tree.querySelector('[data-key="' + c.key + '"] > .mk-nm-row [data-act="toggle"]'); if (f2) f2.focus();
    }
  });
  tree.addEventListener("keydown", function (e) {
    if (!CAN || !e.altKey) return;
    var li = e.target.closest("li.mk-nm-item"); if (!li) return;
    var dir = { ArrowUp: "up", ArrowDown: "down", ArrowRight: "in", ArrowLeft: "out" }[e.key];
    if (!dir) return;
    e.preventDefault(); move(li.getAttribute("data-key"), dir);
  });

  // ---------- Glisser-déposer (souris, stylet, tactile) ----------
  var drag = null;
  function clearDrop() { $$(".is-drop-before, .is-drop-after, .is-drop-inside").forEach(function (el) { el.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); }
  function endDrag() { if (!drag) return; drag.li.classList.remove("is-dragging"); document.body.classList.remove("mk-nm-dragging"); clearDrop(); drag = null; }
  tree.addEventListener("pointerdown", function (e) {
    var hd = e.target.closest('[data-act="drag"]'); if (!hd || !CAN || e.button > 0) return;
    drag = { li: hd.closest("li.mk-nm-item"), x: e.clientX, y: e.clientY, active: false, target: null };
    try { hd.setPointerCapture(e.pointerId); } catch (x) { /* facultatif */ }
  });
  tree.addEventListener("pointermove", function (e) {
    if (!drag) return;
    if (!drag.active) { if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 5) return; drag.active = true; drag.li.classList.add("is-dragging"); document.body.classList.add("mk-nm-dragging"); }
    e.preventDefault();
    if (e.clientY < 70) window.scrollBy(0, -14); else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
    var el = document.elementFromPoint(e.clientX, e.clientY), li = el && el.closest ? el.closest("li.mk-nm-item") : null;
    clearDrop(); drag.target = null;
    if (!li || !tree.contains(li) || drag.li === li || drag.li.contains(li)) return;
    var rect = li.querySelector(":scope > .mk-nm-row").getBoundingClientRect(), y = e.clientY - rect.top, third = rect.height / 3;
    var kind = y < third ? "before" : y > 2 * third ? "after" : "inside";
    var dragged = find(drag.li.getAttribute("data-key")), tgt = find(li.getAttribute("data-key"));
    if (kind === "inside" && depthOf(tgt.node) + height(dragged.node) > MAX) kind = y < rect.height / 2 ? "before" : "after";
    if ((kind === "inside" ? depthOf(tgt.node) : depthOf(tgt.node) - 1) + height(dragged.node) > MAX) return;
    li.classList.add("is-drop-" + kind); drag.target = { key: li.getAttribute("data-key"), kind: kind };
  });
  tree.addEventListener("pointerup", function () { if (!drag) return; var d = drag; var t = d.active && d.target; var key = d.li.getAttribute("data-key"); endDrag(); if (t) drop(key, t.key, t.kind); });
  tree.addEventListener("pointercancel", endDrag);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drag) endDrag(); });
  tree.addEventListener("dragstart", function (e) { e.preventDefault(); });

  // ---------- Panneau « Ajouter des éléments » ----------
  function fetchResources(o) {
    var q = new URLSearchParams(); if (o.type) q.set("type", o.type); if (o.source) q.set("source", o.source); q.set("q", o.q || ""); q.set("offset", String(o.offset || 0));
    var base = D.urls.resources + (D.urls.resources.indexOf("?") >= 0 ? "&" : "?");
    return fetch(base + q.toString(), { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error("Recherche indisponible (" + r.status + ")."); return r.json(); });
  }
  function addNodes(nodes) {
    if (count() + nodes.length > MAXITEMS) { showBanner("Un menu contient " + MAXITEMS + " éléments au plus."); return false; }
    hideBanner(); remember(); nodes.forEach(function (n) { S.items.push(n); });
    render(); refresh();
    say(nodes.length + " élément" + (nodes.length > 1 ? "s" : "") + " ajouté" + (nodes.length > 1 ? "s" : "") + " au menu (non enregistré).");
    var li = tree.querySelector('[data-key="' + nodes[0].key + '"]'); if (li) { li.scrollIntoView({ block: "nearest" }); li.classList.add("is-new"); setTimeout(function () { li.classList.remove("is-new"); }, 1500); }
    return true;
  }
  var newNode = function (o) { return Object.assign({ key: nk(), id: null, object_id: null, url: "", label: "", title_attr: "", css_class: "", icon: "", description: "", badge: "", new_tab: false, rel: [], visibility: "all", status: "published", resource: { title: "", url: "", state: "ok" }, stateLabel: "", children: [], open: false }, o); };
  function picker(def) {
    var uid = "nm-pk-" + def.id, selected = new Map(), shown = [], offset = 0, query = "", seqn = 0, timer = null;
    var input = h("input", { type: "search", id: uid + "-q", placeholder: "Rechercher…", autocomplete: "off" });
    var list = h("ul", { class: "mk-nm-results", role: "group", "aria-label": def.label });
    var status = h("p", { class: "mk-nm-none", role: "status", "aria-live": "polite" });
    var all = h("input", { type: "checkbox", id: uid + "-all" });
    var more = h("button", { type: "button", class: "mk-wd-btn", text: "Charger plus", hidden: true });
    var add = h("button", { type: "button", class: "mk-wd-btn", text: "Ajouter au menu", disabled: true });
    function sync() { add.disabled = !selected.size; add.textContent = selected.size ? "Ajouter au menu (" + selected.size + ")" : "Ajouter au menu"; all.checked = shown.length > 0 && shown.every(function (r) { return selected.has(r.id); }); }
    function paint(append) {
      if (!append) list.textContent = "";
      shown.slice(append ? shown.length - append : 0).forEach(function (r) {
        var cid = uid + "-" + String(r.id).replace(/[^A-Za-z0-9_-]/g, "_"), box = h("input", { type: "checkbox", id: cid });
        box.checked = selected.has(r.id);
        box.addEventListener("change", function () { if (box.checked) selected.set(r.id, r); else selected.delete(r.id); sync(); });
        list.appendChild(h("li", null, h("label", { for: cid }, [box, " " + r.title, r.detail ? h("span", { class: "mk-nm-sub", text: r.detail }) : null])));
      });
      sync();
    }
    function load(reset) {
      var n = ++seqn; if (reset) { offset = 0; shown = []; list.textContent = ""; }
      status.textContent = "Chargement…"; more.hidden = true;
      fetchResources({ type: def.type, source: def.source, q: query, offset: offset }).then(function (d) {
        if (n !== seqn) return;
        var before = shown.length; shown = shown.concat(d.results); offset += d.results.length;
        status.textContent = shown.length ? "" : query ? "Aucun résultat pour « " + query + " »." : "Rien à ajouter pour l'instant.";
        more.hidden = !d.hasMore; paint(reset ? 0 : shown.length - before);
      }, function (err) {
        if (n !== seqn) return; status.textContent = "";
        var retry = h("button", { type: "button", class: "mk-wd-btn", text: "Réessayer" }); retry.addEventListener("click", function () { load(reset); });
        status.appendChild(document.createTextNode(err.message + " ")); status.appendChild(retry);
      });
    }
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { query = input.value.trim(); load(true); }, 250); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
    more.addEventListener("click", function () { load(false); });
    all.addEventListener("change", function () { shown.forEach(function (r) { if (all.checked) selected.set(r.id, r); else selected.delete(r.id); }); $$("input[type=checkbox]", list).forEach(function (b) { b.checked = all.checked; }); sync(); });
    add.addEventListener("click", function () {
      var nodes = [];
      selected.forEach(function (r) { nodes.push(def.source ? newNode({ type: "custom", label: r.title, url: r.url, resource: { title: r.title, url: r.url, state: "ok" } }) : newNode({ type: def.type, object_id: Number(r.id), resource: { title: r.title, url: r.detail, state: "ok" } })); });
      if (addNodes(nodes)) { selected.clear(); $$("input[type=checkbox]", list).forEach(function (b) { b.checked = false; }); sync(); }
    });
    var body = h("div", { class: "mk-nm-sec-body" }, [h("label", { class: "sr-only", for: uid + "-q", text: "Rechercher parmi : " + def.label.toLowerCase() }), input, status, list, more,
      h("div", { class: "mk-nm-sec-foot" }, [h("label", { class: "mk-cms-check", for: uid + "-all" }, [all, " Tout sélectionner"]), add])]);
    var d = h("details", { class: "mk-nm-section", "data-type": def.type || def.source }, [h("summary", { text: def.label }), body]);
    var loaded = false; d.addEventListener("toggle", function () { if (d.open && !loaded) { loaded = true; load(true); } });
    if (def.open) { d.open = true; loaded = true; setTimeout(function () { load(true); }, 0); }
    return d;
  }
  function customForm() {
    var lab = h("input", { type: "text", id: "nm-cu-label", maxlength: "80", autocomplete: "off" }), url = h("input", { type: "text", id: "nm-cu-url", maxlength: "500", autocomplete: "off", placeholder: "/contact, https://… ou #tarifs" });
    var tab = h("input", { type: "checkbox", id: "nm-cu-tab" }), err = h("p", { class: "mk-nm-err", role: "alert" });
    var add = h("button", { type: "button", class: "mk-wd-btn", text: "Ajouter au menu" });
    add.addEventListener("click", function () {
      var l = lab.value.trim(), u = url.value.trim();
      if (!l) { err.textContent = "Donnez un texte au lien."; lab.focus(); return; }
      if (!u || /[\s\u0000-\u001f]/.test(u) || !/^(\/(?![\/\\])|#[A-Za-z0-9_:.%-]+$|https?:\/\/[^\s/]+\.[^\s/]+|mailto:[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$|tel:\+?[0-9 ().-]{4,25}$)/i.test(u)) { err.textContent = "Adresse invalide : commencez par /, #, https://, http://, mailto: ou tel:. Les autres protocoles (javascript:, data:…) sont refusés."; url.focus(); return; }
      err.textContent = "";
      if (addNodes([newNode({ type: "custom", label: l, url: u, new_tab: tab.checked || /^https?:/i.test(u), resource: { title: l, url: u, state: "ok" } })])) { lab.value = ""; url.value = ""; tab.checked = false; }
    });
    return h("details", { class: "mk-nm-section" }, [h("summary", { text: "Liens personnalisés" }), h("div", { class: "mk-nm-sec-body" }, [
      h("div", { class: "field-group" }, [h("label", { for: "nm-cu-label", text: "Texte du lien" }), lab]),
      h("div", { class: "field-group" }, [h("label", { for: "nm-cu-url", text: "Adresse (URL)" }), url]),
      h("label", { class: "mk-cms-check", for: "nm-cu-tab" }, [tab, " Ouvrir dans un nouvel onglet"]), err,
      h("div", { class: "mk-nm-sec-foot" }, [add])])]);
  }
  var secs = $("[data-nm-sections]");
  if (CAN && secs) {
    [["page", "Pages"], ["article", "Articles"], ["category", "Catégories"], ["tag", "Étiquettes"]].forEach(function (t, i) { if (D.types[t[0]]) secs.appendChild(picker({ id: t[0], type: t[0], label: t[1], open: i === 0 })); });
    secs.appendChild(customForm());
    var home = h("button", { type: "button", class: "mk-wd-btn", text: "Ajouter « Accueil »" });
    home.addEventListener("click", function () { addNodes([newNode({ type: "home", resource: { title: "Accueil", url: "/", state: "ok" } })]); });
    secs.appendChild(h("details", { class: "mk-nm-section" }, [h("summary", { text: "Accueil" }), h("div", { class: "mk-nm-sec-body" }, home)]));
    D.sources.forEach(function (s) { secs.appendChild(picker({ id: "src-" + s.key, source: s.key, label: s.label })); });
  }

  // ---------- Réglages : nom, état, description, emplacements ----------
  var nameI = $("[data-nm-name]"), descI = $("[data-nm-desc]"), statI = $("[data-nm-status]");
  nameI.value = S.name; descI.value = S.description; statI.value = S.status;
  [nameI, descI, statI].forEach(function (i) { i.disabled = !CAN; });
  nameI.addEventListener("input", function () { S.name = nameI.value; refresh(); });
  descI.addEventListener("input", function () { S.description = descI.value; refresh(); });
  statI.addEventListener("change", function () { S.status = statI.value; refresh(); });
  var autoI = $("[data-nm-autoadd]");
  if (autoI) { autoI.checked = S.auto; autoI.disabled = !CAN; autoI.addEventListener("change", function () { S.auto = autoI.checked; refresh(); }); }
  var slots = $("[data-nm-locations]");
  D.locations.forEach(function (l) {
    var id = "nm-loc-" + l.key, c = h("input", { type: "checkbox", id: id });
    c.checked = !!S.locations[l.key]; c.disabled = !CAN || !D.canPublish;
    c.addEventListener("change", function () { S.locations[l.key] = c.checked; refresh(); });
    slots.appendChild(h("div", { class: "mk-nm-slot" }, [h("label", { class: "mk-cms-check", for: id }, [c, " " + l.label]), h("span", { class: "field-hint", text: l.hint + (l.takenBy ? " Actuellement : « " + l.takenBy + " » (sera remplacé)." : "") })]));
  });
  if (!D.canPublish) slots.appendChild(h("p", { class: "field-hint", text: "Seuls les administrateurs affectent un menu à un emplacement." }));

  // ---------- Enregistrement ----------
  function save() {
    if (saving || conflict || !dirty()) return;
    if (!S.name.trim()) { showBanner("Donnez un nom au menu avant d'enregistrer."); nameI.focus(); return; }
    saving = true; hideBanner(); refresh();
    var sent = snap(), fresh = [];
    (function pre(nodes) { nodes.forEach(function (n) { if (!n.id) fresh.push(n); pre(n.children); }); })(S.items);
    fetch(D.urls.save, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload()) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { r: r, d: d }; }); })
      .then(function (x) {
        saving = false;
        if (x.r.ok && x.d.ok) {
          S.revision = x.d.revision; S.name = x.d.name || S.name;
          // les nouveaux éléments reçoivent leur identifiant (ordre de parcours identique à celui du serveur) : un second enregistrement les met à jour au lieu de les recréer
          var map = x.d.idMap || {};
          Object.keys(map).sort(function (p, q) { return Number(p.slice(1)) - Number(q.slice(1)); }).forEach(function (ref, i) { if (fresh[i]) fresh[i].id = map[ref]; });
          saved = sent;
          var d = new Date(); savedAt = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
          $("[data-nm-title]").textContent = S.name; refresh(); say("Menu enregistré.");
          return;
        }
        if (x.r.status === 409 || x.d.conflict) { conflict = true; refresh(); showBanner(x.d.error || "Ce menu a été modifié ailleurs.", "Recharger la page", function () { location.reload(); }); return; }
        showBanner(x.d.error || "Le serveur n'a pas pu enregistrer le menu (erreur " + x.r.status + "). Vos modifications sont conservées ici.", "Réessayer", save); refresh();
      }, function () {
        saving = false; refresh();
        showBanner("Connexion impossible : le menu n'est PAS enregistré. Vos modifications sont conservées dans cet écran.", "Réessayer", save);
      });
  }
  var sv = $("[data-nm-save]"); if (sv) sv.addEventListener("click", save);
  $("[data-nm-undo]").addEventListener("click", function () { restore(undo, redo, "Modification annulée."); });
  $("[data-nm-redo]").addEventListener("click", function () { restore(redo, undo, "Modification rétablie."); });
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    else if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); restore(undo, redo, "Modification annulée."); }
  });

  // ---------- Aperçu (rendu public de la VERSION ENREGISTRÉE) ----------
  var dlg = $("[data-nm-dialog]");
  $("[data-nm-preview]").addEventListener("click", function () {
    var body = $("[data-nm-preview-body]"), note = $("[data-nm-preview-note]");
    note.textContent = dirty() ? "Aperçu de la version ENREGISTRÉE : enregistrez le menu pour y voir vos modifications." : "Rendu du menu tel que le site le montre (éléments masqués ou non publiés exclus).";
    body.textContent = "Chargement…";
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
    fetch(D.urls.preview, { credentials: "same-origin", headers: { Accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function (d) { body.innerHTML = d.html; $$("a", body).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); }); if (!$("li", body)) body.textContent = "Ce menu n'affiche aucun élément pour le moment."; }, function () { body.textContent = "Aperçu indisponible. Réessayez."; });
  });
  if (/[?&]apercu=1/.test(location.search)) setTimeout(function () { $("[data-nm-preview]").click(); }, 0);
  $("[data-nm-dialog-close]").addEventListener("click", function () { dlg.close ? dlg.close() : dlg.removeAttribute("open"); });

  // ---------- Démarrage ----------
  $("[data-nm-loading]").hidden = true; $("[data-nm-layout]").hidden = false;
  render(); refresh();
  if (!CAN) { var dis = $("[data-nm-undo]"); if (dis) dis.hidden = true; var rd = $("[data-nm-redo]"); if (rd) rd.hidden = true; }
})();

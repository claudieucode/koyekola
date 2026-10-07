// Éditeur de pages — « Réglages du menu » : gestionnaire du menu de navigation.
// Il ne possède AUCUNE donnée : il lit et modifie le widget « Menu de navigation » (nœud `menu`) du document de la page,
// par la même fonction change() que l'inspecteur. Canevas, panneau Structure, historique (annuler / rétablir),
// enregistrement, aperçu et publication restent donc automatiquement synchronisés (une seule source de vérité).
(function () {
  "use strict";
  var nav = window.pbNav;
  var dlg = document.querySelector("[data-pb-navmgr]");
  if (!nav || !dlg) return;
  var h = nav.h;
  var body = dlg.querySelector("[data-pb-navmgr-body]");
  var MAX_TOP = 12, MAX_SUB = 10;   // limites du moteur de pages (validées aussi par le serveur)
  var curId = null;                  // menu affiché dans le gestionnaire
  var mine = false;                  // vrai pendant une modification faite ICI (pas de redessin pendant la frappe)
  var drag = null;

  // ---------- Lecture des menus de la page ----------
  function menus() {
    var out = [];
    nav.walk(function (it, parent, depth) {
      if (it.type !== "menu") return;
      var top = nav.topOf(it.id);
      out.push({ id: it.id, name: (it.props && it.props.label) || "Menu", section: nav.sectionNumber(top) });
    });
    return out;
  }
  function pickCurrent(list) {
    var sel = nav.selection().filter(function (id) { var n = nav.byId(id); return n && n.type === "menu"; });
    if (sel.length) curId = sel[0];
    if (!list.some(function (m) { return m.id === curId; })) curId = list.length ? list[0].id : null;
    return curId ? nav.byId(curId) : null;
  }

  // ---------- Modifications (toujours sur une copie, appliquée seulement si elle est valide) ----------
  function find(items, ref) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] === ref) return { list: items, index: i, top: true };
      var k = items[i].children || [];
      for (var j = 0; j < k.length; j++) if (k[j] === ref) return { list: k, index: j, top: false, parent: items[i] };
    }
    return null;
  }
  function tidy(items) { items.forEach(function (x) { if (x.children && !x.children.length) delete x.children; }); return items; }
  // fn(copie) renvoie un message d'erreur (refus) ou rien (accepté)
  function edit(label, fn, opts) {
    var node = nav.byId(curId);
    if (!node) return;
    var copy = JSON.parse(JSON.stringify(node.props.items || []));
    var refuse = fn(copy);
    if (refuse) { nav.toast(refuse, true); return; }
    tidy(copy);
    if (copy.length > MAX_TOP) { nav.toast("Un menu compte " + MAX_TOP + " liens principaux au plus.", true); return; }
    mine = Boolean(opts && opts.light);
    nav.change(function () { nav.byId(curId).props.items = copy; }, { label: label, key: opts && opts.key, light: opts && opts.light });
    mine = false;
    if (!(opts && opts.light)) render();
  }
  function at(items, path) { return path.length === 1 ? items[path[0]] : items[path[0]].children[path[1]]; }
  function moveBy(path, dir) {
    edit("Menu : déplacer un lien", function (items) {
      var r = find(items, at(items, path)), to = r.index + dir;
      if (to < 0 || to >= r.list.length) return "Déjà à cette extrémité.";
      r.list.splice(to, 0, r.list.splice(r.index, 1)[0]);
    });
  }
  function indent(path) {
    edit("Menu : placer dans un sous-menu", function (items) {
      var it = at(items, path), r = find(items, it);
      if (!r.top || r.index === 0) return "Pour créer un sous-menu, placez le lien sous un autre lien.";
      if (it.children && it.children.length) return "Ce lien a déjà son propre sous-menu : un seul niveau de sous-menu est possible.";
      var prev = items[r.index - 1];
      if ((prev.children || []).length >= MAX_SUB) return "Un sous-menu compte " + MAX_SUB + " liens au plus.";
      items.splice(r.index, 1);
      (prev.children = prev.children || []).push(it);
    });
  }
  function outdent(path) {
    edit("Menu : sortir d'un sous-menu", function (items) {
      var it = at(items, path), r = find(items, it);
      if (r.top) return "Ce lien est déjà au premier niveau.";
      r.list.splice(r.index, 1);
      items.splice(items.indexOf(r.parent) + 1, 0, it);
    });
  }
  function drop(srcPath, dstPath, zone) {
    edit("Menu : réordonner", function (items) {
      var src = at(items, srcPath), dst = at(items, dstPath);
      if (src === dst) return "";
      var s = find(items, src), d = find(items, dst);
      if (zone === "inside") {
        if (!d.top) return "Un seul niveau de sous-menu est possible.";
        if (src.children && src.children.length) return "Ce lien a un sous-menu : il ne peut pas devenir lui-même un sous-lien.";
        if (s.parent !== dst && (dst.children || []).length >= MAX_SUB) return "Un sous-menu compte " + MAX_SUB + " liens au plus.";
        s.list.splice(s.index, 1);
        (dst.children = dst.children || []).push(src);
        return;
      }
      if (!d.top && src.children && src.children.length) return "Ce lien a un sous-menu : il ne peut pas être placé dans un sous-menu.";
      s.list.splice(s.index, 1);
      var nd = find(items, dst);
      nd.list.splice(nd.index + (zone === "after" ? 1 : 0), 0, src);
    });
  }
  function remove(path) {
    var node = nav.byId(curId), it = at(node.props.items, path);
    var subs = (it.children || []).length;
    if (!window.confirm("Retirer « " + it.label + " » du menu" + (subs ? " (avec ses " + subs + " sous-liens)" : "") + " ?\nLa page correspondante n'est PAS supprimée : seul le lien disparaît de ce menu.")) return;
    edit("Menu : retirer un lien", function (items) {
      var x = at(items, path), r = find(items, x);
      if (r.top && items.length === 1) return "Un menu garde au moins un lien : ajoutez-en un autre avant de retirer celui-ci.";
      r.list.splice(r.index, 1);
    });
  }
  function add(label, url, parentPath) {
    edit("Menu : ajouter un lien", function (items) {
      if (parentPath) {
        var p = items[parentPath[0]];
        if ((p.children || []).length >= MAX_SUB) return "Un sous-menu compte " + MAX_SUB + " liens au plus.";
        (p.children = p.children || []).push({ label: label, url: url });
      } else {
        if (items.length >= MAX_TOP) return "Un menu compte " + MAX_TOP + " liens principaux au plus.";
        items.push({ label: label, url: url });
      }
    });
  }
  function setField(path, key, value) {
    var uid = curId + ":nav:" + path.join(".") + ":" + key;
    edit("Menu : modifier un lien", function (items) { at(items, path)[key] = value; }, { key: uid, light: true });
  }

  // ---------- Dessin ----------
  function button(text, tip, onclick, disabled, extra) {
    return h("button", { type: "button", class: "pb-nav-btn" + (extra ? " " + extra : ""), "aria-label": tip, "data-tip": tip, disabled: disabled || null, onclick: onclick }, text);
  }
  function row(it, path, top, n, canUp, canDown) {
    var ro = !nav.canWrite;
    var tag = path.join(".");
    var r = h("div", { class: top ? "pb-nav-row" : "pb-nav-row is-sub", draggable: ro ? null : "true", "data-nav-path": tag },
      h("span", { class: "pb-nav-grip", "aria-hidden": "true", text: "⠿" }),
      h("input", { type: "text", class: "pb-nav-label", value: it.label, maxlength: "60", "aria-label": "Texte du lien", disabled: ro || null, "data-nav-label": tag }),
      h("div", { class: "pb-nav-actions" },
        button("↑", "Monter", function () { moveBy(path, -1); }, ro || !canUp),
        button("↓", "Descendre", function () { moveBy(path, 1); }, ro || !canDown),
        top ? button("→", "Placer dans le sous-menu du lien précédent", function () { indent(path); }, ro || path[0] === 0) : button("←", "Sortir du sous-menu", function () { outdent(path); }, ro),
        button("✕", "Retirer du menu (la page est conservée)", function () { remove(path); }, ro, "is-danger")),
      h("input", { type: "text", class: "pb-nav-url", value: it.url, maxlength: "500", list: "pb-links", "aria-label": "Adresse du lien (/page, https://… ou #ancre)", disabled: ro || null, "data-nav-url": tag }));
    r.querySelector("[data-nav-label]").addEventListener("input", function (e) { setField(path, "label", e.target.value); });
    r.querySelector("[data-nav-url]").addEventListener("input", function (e) { setField(path, "url", e.target.value); });
    r.addEventListener("dragstart", function (e) { drag = path; e.dataTransfer.effectAllowed = "move"; try { e.dataTransfer.setData("text/plain", tag); } catch (x) { /* navigateur sans données de glisser */ } r.classList.add("is-dragging"); });
    r.addEventListener("dragend", function () { drag = null; clearMarks(); });
    r.addEventListener("dragover", function (e) { if (!drag) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; mark(r, zoneOf(e, r, top)); });
    r.addEventListener("drop", function (e) { if (!drag) return; e.preventDefault(); var z = zoneOf(e, r, top), src = drag; drag = null; clearMarks(); drop(src, path, z); });
    return r;
  }
  function zoneOf(e, el, top) {
    var b = el.getBoundingClientRect(), y = (e.clientY - b.top) / b.height;
    if (top && y > 0.35 && y < 0.65) return "inside";
    return y < 0.5 ? "before" : "after";
  }
  function mark(el, zone) { clearMarks(); el.classList.add(zone === "inside" ? "is-drop-inside" : zone === "before" ? "is-drop-before" : "is-drop-after"); }
  function clearMarks() { body.querySelectorAll(".is-dragging,.is-drop-inside,.is-drop-before,.is-drop-after").forEach(function (x) { x.classList.remove("is-dragging", "is-drop-inside", "is-drop-before", "is-drop-after"); }); }

  function render() {
    var list = menus(), node = pickCurrent(list), ro = !nav.canWrite;
    body.textContent = "";
    var addMenu = h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: ro || null, "data-nav-addmenu": "", onclick: function () { nav.addElement("menu"); } }, "Ajouter un menu à la page");
    if (!node) {
      body.appendChild(h("p", { class: "pb-note", text: "Cette page n'a pas encore de menu de navigation. Ajoutez le widget « Menu de navigation » : ses liens se gèrent ensuite ici." }));
      body.appendChild(h("div", { class: "pb-row" }, addMenu));
      return;
    }
    var picker = h("select", { class: "pb-nav-pick", "aria-label": "Menu à gérer", "data-nav-pick": "", onchange: function () { curId = this.value; nav.select(curId); render(); } },
      list.map(function (m) { return h("option", { value: m.id, selected: m.id === curId || null }, m.name + " — section " + m.section); }));
    body.appendChild(h("div", { class: "pb-nav-head" }, picker,
      button("Voir", "Sélectionner ce menu dans le canevas et dans Structure", function () { nav.select(curId); }, false, "pb-nav-btn-text"), addMenu));
    body.appendChild(h("label", { class: "pb-nav-field" }, h("span", { text: "Nom du menu (lu par les lecteurs d'écran)" }),
      h("input", { type: "text", maxlength: "60", value: node.props.label || "", disabled: ro || null, "data-nav-name": "", oninput: function (e) {
        mine = true; nav.change(function () { nav.byId(curId).props.label = e.target.value; }, { label: "Menu : renommer", key: curId + ":nav:name", light: true }); mine = false;
      } })));
    var items = node.props.items || [];
    var ul = h("div", { class: "pb-nav-list", "data-nav-list": "", role: "list" });
    items.forEach(function (it, i) {
      ul.appendChild(row(it, [i], true, items.length, i > 0, i < items.length - 1));
      var kids = it.children || [];
      kids.forEach(function (c, j) { ul.appendChild(row(c, [i, j], false, kids.length, j > 0, j < kids.length - 1)); });
    });
    body.appendChild(ul);
    body.appendChild(h("p", { class: "pb-hint", text: "Glissez une ligne pour la déplacer : sur le haut ou le bas d'une ligne pour l'intercaler, au milieu d'un lien principal pour en faire un sous-lien." }));

    // Ajouter : une page du site ou un lien personnalisé (tout est enregistré avec la page)
    var pages = nav.links.filter(function (l) { return !items.some(function (m) { return m.url === l.url; }); });
    var sel = h("select", { class: "pb-nav-pick", "aria-label": "Page à ajouter", "data-nav-pages": "", disabled: ro || !pages.length || null },
      pages.length ? pages.map(function (l, k) { return h("option", { value: String(k) }, l.label); }) : h("option", { value: "" }, "Toutes les pages sont déjà dans le menu"));
    var parent = h("select", { class: "pb-nav-pick", "aria-label": "Où l'ajouter", "data-nav-where": "", disabled: ro || null },
      h("option", { value: "" }, "Premier niveau"), items.map(function (it, i) { return h("option", { value: String(i) }, "Sous-menu de « " + it.label + " »"); }));
    body.appendChild(h("fieldset", { class: "pb-nav-add" }, h("legend", { text: "Ajouter un élément" }), parent,
      h("div", { class: "pb-row" }, sel, h("button", { type: "button", class: "btn btn-primary btn-sm", disabled: ro || !pages.length || null, "data-nav-addpage": "", onclick: function () {
        var l = pages[Number(sel.value)]; if (!l) return;
        add(l.label.replace(/^Page « |»$/g, "").trim(), l.url, parent.value === "" ? null : [Number(parent.value)]);
      } }, "Ajouter la page")),
      h("div", { class: "pb-row" }, h("button", { type: "button", class: "btn btn-outline btn-sm", disabled: ro || null, "data-nav-addlink": "", onclick: function () {
        add("Nouveau lien", "/", parent.value === "" ? null : [Number(parent.value)]);
        var inputs = body.querySelectorAll("[data-nav-label]"); var last = inputs[inputs.length - 1]; if (last) { last.focus(); last.select(); }
      } }, "Ajouter un lien personnalisé"))));

    // Affichage : réglages réels du widget (le menu replié sur mobile est le système responsive du site)
    var check = function (text, key, hint) {
      return h("label", { class: "pb-check", title: hint }, h("input", { type: "checkbox", checked: node.props[key] === true || null, disabled: ro || null, "data-nav-opt": key, onchange: function () {
        var v = this.checked; mine = false; nav.change(function () { nav.byId(curId).props[key] = v; }, { label: "Menu : " + text.toLowerCase() }); render();
      } }), " " + text);
    };
    body.appendChild(h("fieldset", { class: "pb-nav-add" }, h("legend", { text: "Affichage" }),
      check("Liens les uns sous les autres", "vertical", "Menu vertical au lieu d'horizontal"),
      check("Sur mobile, replier derrière un bouton « Menu »", "mobileToggle", "Sur téléphone, le menu s'ouvre depuis un bouton"),
      h("div", { class: "pb-nav-screens" }, h("span", { text: "Afficher sur :" }), [["desktop", "Ordinateur"], ["tablet", "Tablette"], ["mobile", "Mobile"]].map(function (b) {
        return h("label", { class: "pb-check" }, h("input", { type: "checkbox", checked: (node.hideOn || []).indexOf(b[0]) < 0 || null, disabled: ro || null, "data-nav-screen": b[0], onchange: function () {
          var hidden = ["desktop", "tablet", "mobile"].filter(function (x) { return x === b[0] ? !this.checked : (nav.byId(curId).hideOn || []).indexOf(x) >= 0; }, this);
          if (hidden.length === 3) { this.checked = true; nav.toast("Le menu doit rester visible sur au moins un écran.", true); return; }
          nav.change(function () { var n = nav.byId(curId); if (hidden.length) n.hideOn = hidden; else delete n.hideOn; }, { label: "Menu : écrans d'affichage" });
        } }), " " + b[1]);
      })),
      h("p", { class: "pb-hint", text: "Sur mobile, le menu peut se replier derrière un bouton. Les mêmes liens s'affichent sur tous les écrans choisis." })));
  }

  // ---------- Ouverture, déplacement de la fenêtre, synchronisation ----------
  function open() { if (!dlg.open) dlg.show(); render(); var f = body.querySelector("input,select,button"); if (f) f.focus(); }
  nav.open = open;
  nav.subscribe(function () { if (dlg.open && !mine) render(); });
  var head = dlg.querySelector("[data-pb-navmgr-head]");
  head.addEventListener("pointerdown", function (e) {
    if (e.target.closest("button")) return;
    var r = dlg.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    function move(ev) { dlg.style.left = Math.max(0, Math.min(ev.clientX - dx, window.innerWidth - 80)) + "px"; dlg.style.top = Math.max(0, Math.min(ev.clientY - dy, window.innerHeight - 40)) + "px"; dlg.style.right = "auto"; }
    function up() { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); }
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
  });
})();

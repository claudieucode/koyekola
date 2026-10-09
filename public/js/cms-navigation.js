// KOLAKISA CMS → Navigation : recherche de ressources (serveur), panneau de modification d'un élément, glisser-déposer.
// Les boutons de la structure sont de vrais formulaires (ils marchent sans ce script) ; le glisser-déposer envoie la structure
// entière au serveur, qui la valide (aucune boucle, profondeur limitée) et l'écrit d'un seul bloc. Un refus recharge la page.
(function () {
  var BASE = "/marketing/site-web/navigation";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function h(tag, attrs, text) { var el = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); }); if (text !== undefined) el.textContent = text; return el; }
  function search(type, q) {
    return fetch(BASE + "/ressources?type=" + encodeURIComponent(type) + "&q=" + encodeURIComponent(q || ""), { credentials: "same-origin", headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("Recherche indisponible."); return r.json(); }).then(function (d) { return d.results; });
  }

  // Recherche + sélection multiple (ajout au menu)
  $$("[data-nav-picker]").forEach(function (form) {
    var type = form.getAttribute("data-type"), input = $("[data-nav-search]", form), list = $("[data-nav-results]", form), submit = $("button[type=submit]", form), timer = null, seq = 0;
    function refresh() { submit.disabled = !$$("input[type=checkbox]:checked", form).length; }
    function paint(results) {
      var checked = $$("input[type=checkbox]:checked", form).map(function (c) { return c.value; });
      list.textContent = "";
      if (!results.length) { list.appendChild(h("li", { class: "mk-nav-none" }, "Aucun résultat.")); }
      results.forEach(function (r) {
        var id = "nr-" + type + "-" + r.id, li = h("li"), label = h("label", { for: id }), box = h("input", { type: "checkbox", id: id, name: "object_id", value: String(r.id) });
        if (checked.indexOf(String(r.id)) >= 0) box.checked = true;
        box.addEventListener("change", refresh);
        label.appendChild(box); label.appendChild(document.createTextNode(" " + r.title));
        if (r.detail) label.appendChild(h("span", { class: "mk-sub" }, r.detail));
        li.appendChild(label); list.appendChild(li);
      });
      refresh();
    }
    function run() { var n = ++seq; search(type, input.value).then(function (res) { if (n === seq) paint(res); }, function (e) { list.textContent = ""; list.appendChild(h("li", { class: "mk-nav-none" }, e.message)); }); }
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 200); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
    var details = form.closest("details");
    var loaded = false;
    function first() { if (!loaded) { loaded = true; run(); } }
    if (details) { if (details.open) first(); details.addEventListener("toggle", function () { if (details.open) first(); }); } else first();
  });

  // Remplacer la destination d'un élément (réparer un lien cassé)
  $$("[data-nav-replace]").forEach(function (box) {
    var type = box.getAttribute("data-type"), input = $("[data-nav-replace-search]", box), hidden = $("[data-nav-replace-id]", box), list = $("[data-nav-replace-results]", box), timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (!input.value.trim()) { list.textContent = ""; return; }
        search(type, input.value).then(function (res) {
          list.textContent = "";
          if (!res.length) list.appendChild(h("li", { class: "mk-nav-none" }, "Aucun résultat."));
          res.forEach(function (r) {
            var li = h("li"), b = h("button", { type: "button", class: "btn btn-ghost btn-sm" }, r.title);
            b.addEventListener("click", function () { hidden.value = String(r.id); input.value = r.title; list.textContent = ""; list.appendChild(h("li", { class: "mk-nav-none" }, "Destination choisie : " + r.title + " — enregistrez pour l'appliquer.")); });
            li.appendChild(b); list.appendChild(li);
          });
        }, function () {});
      }, 200);
    });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });
  });

  // Panneau de modification d'un élément
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-nav-edit]");
    if (!b) return;
    var panel = document.getElementById(b.getAttribute("aria-controls"));
    var open = panel.hidden;
    panel.hidden = !open; b.setAttribute("aria-expanded", String(open));
    if (open) { var f = $("input[type=text]", panel); if (f) f.focus(); }
  });

  // Glisser-déposer
  var tree = $("[data-nav-tree]");
  if (!tree || tree.getAttribute("data-can-write") !== "1") return;
  var MAX = Number(tree.getAttribute("data-max-depth")) || 3, status = $("[data-nav-status]"), dragged = null, zone = null;
  function say(t) { if (status) status.textContent = t; }
  function depthOf(li) { var d = 0, el = li; while (el && el !== tree) { if (el.tagName === "LI") d += 1; el = el.parentElement; } return d; }
  function height(li) { var kids = $$(":scope > ol > li", li); return 1 + kids.reduce(function (m, k) { return Math.max(m, height(k)); }, 0); }
  function serialize(ol) { return $$(":scope > li", ol).map(function (li) { return { id: Number(li.getAttribute("data-id")), children: serialize($(":scope > ol", li) || document.createElement("ol")) }; }); }
  function clear() { $$(".is-drop-before, .is-drop-after, .is-drop-inside").forEach(function (el) { el.classList.remove("is-drop-before", "is-drop-after", "is-drop-inside"); }); }
  tree.addEventListener("dragstart", function (e) {
    var handle = e.target.closest("[data-nav-handle]");
    if (!handle) { e.preventDefault(); return; }
    dragged = handle.closest("li");
    dragged.classList.add("is-dragging");
    e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragged.getAttribute("data-id"));
  });
  tree.addEventListener("dragend", function () { if (dragged) dragged.classList.remove("is-dragging"); dragged = null; clear(); });
  tree.addEventListener("dragover", function (e) {
    if (!dragged) return;
    var li = e.target.closest("li.mk-nav-item");
    if (!li || li === dragged || dragged.contains(li)) { clear(); zone = null; return; } // jamais dans soi-même ni dans un de ses descendants (boucle)
    e.preventDefault();
    var row = $(".mk-nav-row", li).getBoundingClientRect(), y = e.clientY - row.top, third = row.height / 3;
    var kind = y < third ? "before" : y > 2 * third ? "after" : "inside";
    if (kind === "inside" && depthOf(li) + height(dragged) > MAX) kind = y < row.height / 2 ? "before" : "after";
    clear(); li.classList.add(kind === "before" ? "is-drop-before" : kind === "after" ? "is-drop-after" : "is-drop-inside"); zone = { li: li, kind: kind };
  });
  tree.addEventListener("drop", function (e) {
    if (!dragged || !zone) return;
    e.preventDefault();
    var li = zone.li, kind = zone.kind, item = dragged;
    if (kind === "before") li.parentElement.insertBefore(item, li);
    else if (kind === "after") li.parentElement.insertBefore(item, li.nextSibling);
    else { var ol = $(":scope > ol", li); ol.appendChild(item); }
    clear(); persist();
  });
  function persist() {
    say("Enregistrement…");
    fetch(tree.getAttribute("data-save"), { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ tree: serialize(tree) }) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) { if (r.ok) say("Ordre enregistré."); else { say(r.d.error || "Refusé."); setTimeout(function () { location.reload(); }, 1200); } },
        function () { say("Connexion impossible : rechargement…"); setTimeout(function () { location.reload(); }, 1200); });
  }
})();

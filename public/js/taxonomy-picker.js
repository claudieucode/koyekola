// Classement d'un article dans l'éditeur du blog : catégorie principale, catégories (arbre), étiquettes avec recherche et création
// rapide. Les choix sont réellement enregistrés avec l'article (champs category_ids, primary_category_id, tag_ids du formulaire) ;
// les anciens champs texte de l'éditeur (category, subcategory, tags) sont tenus à jour comme miroir pour ses aperçus et contrôles.
(function () {
  var root = document.querySelector("[data-taxo]");
  if (!root) return;
  var data;
  try { data = JSON.parse(document.getElementById("taxo-data").textContent); } catch (e) { return; }
  var $ = function (s) { return root.querySelector(s); };
  var form = root.closest("form");
  var primarySel = $("[data-taxo-primary]"), catsEl = $("[data-taxo-cats]"), catSearch = $("[data-taxo-cat-search]");
  var catIds = $("[data-taxo-category-ids]"), tagIds = $("[data-taxo-tag-ids]");
  var tagsEl = $("[data-taxo-tags]"), tagInput = $("[data-taxo-tag-input]"), suggest = $("[data-taxo-suggest]"), status = $("[data-taxo-status]");
  var newBox = $("[data-taxo-new]"), newName = $("[data-taxo-new-name]"), newParent = $("[data-taxo-new-parent]"), newStatus = $("[data-taxo-new-status]");

  var cats = data.categories.slice();                       // arbre à plat : { id, name, depth, parent_id }
  var chosen = data.selected.categories.map(function (c) { return c.id; });
  var primary = data.selected.primary ? data.selected.primary.id : null;
  var tags = data.selected.tags.map(function (t) { return { id: t.id, name: t.name }; });

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === null || v === undefined || v === false) return; if (k === "text") el.textContent = v; else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var indent = function (c) { return new Array(c.depth + 1).join("— ") + c.name; };
  var byId = function (id) { return cats.find(function (c) { return c.id === id; }); };
  var legacy = function (name) { return form.querySelector('[data-legacy-taxonomy] [name="' + name + '"]'); };

  // Le sélecteur dit à l'éditeur que le formulaire a changé (enregistrement automatique, indicateur « non enregistré »)
  function changed() { form.dispatchEvent(new Event("input", { bubbles: true })); }
  function say(text, error) { status.textContent = text; status.className = "wp-help" + (error ? " tx-error" : ""); }

  // Miroir des anciens champs : catégorie = racine de la principale, sous-catégorie = la principale si elle a un parent
  function mirror() {
    var p = byId(primary), name = "", sub = "";
    if (p) { var root = p; while (root.parent_id && byId(root.parent_id)) root = byId(root.parent_id); if (root.id === p.id) name = p.name; else { name = root.name; sub = p.name; } }
    var c = legacy("category"), s = legacy("subcategory"), t = legacy("tags");
    if (c) c.value = name; if (s) s.value = sub; if (t) t.value = tags.map(function (x) { return x.name; }).join(", ");
    if (c) c.dispatchEvent(new Event("input", { bubbles: true }));
  }
  function sync(fire) {
    catIds.value = chosen.join(",");
    tagIds.value = tags.map(function (t) { return t.id; }).join(",");
    mirror();
    if (fire) changed();
  }

  function renderPrimary() {
    primarySel.textContent = "";
    primarySel.appendChild(h("option", { value: "", text: chosen.length ? "—" : "Aucune catégorie" }));
    chosen.forEach(function (id) { var c = byId(id); if (c) primarySel.appendChild(h("option", { value: String(c.id), text: indent(c), selected: c.id === primary ? "" : null })); });
    primarySel.value = primary ? String(primary) : "";
    primarySel.disabled = !chosen.length;
  }
  function renderCats() {
    var q = catSearch.value.trim().toLowerCase();
    catsEl.textContent = "";
    var shown = cats.filter(function (c) { return !q || c.name.toLowerCase().indexOf(q) >= 0 || chosen.indexOf(c.id) >= 0; });
    if (!cats.length) { catsEl.appendChild(h("li", { class: "wp-help", text: "Aucune catégorie : créez la première ci-dessous." })); return; }
    if (!shown.length) catsEl.appendChild(h("li", { class: "wp-help", text: "Aucune catégorie ne correspond." }));
    shown.forEach(function (c) {
      var id = "tx-cat-" + c.id;
      var box = h("input", { type: "checkbox", id: id, value: String(c.id), checked: chosen.indexOf(c.id) >= 0 ? "" : null, onchange: function () { toggleCat(c.id, box.checked); } });
      catsEl.appendChild(h("li", { style: "padding-left:" + (c.depth * 14) + "px" }, h("label", { for: id }, [box, " ", c.name])));
    });
  }
  function toggleCat(id, on) {
    if (on && chosen.indexOf(id) < 0) chosen.push(id);
    if (!on) chosen = chosen.filter(function (x) { return x !== id; });
    if (!chosen.length) primary = null; else if (!primary || chosen.indexOf(primary) < 0) primary = chosen[0];
    renderPrimary(); sync(true);
  }
  primarySel.addEventListener("change", function () { primary = Number(primarySel.value) || null; sync(true); });
  catSearch.addEventListener("input", renderCats);
  catSearch.addEventListener("keydown", function (e) { if (e.key === "Enter") e.preventDefault(); });

  // Création rapide d'une catégorie : réelle (API), tout de suite sélectionnée dans l'article
  function renderParents() {
    newParent.textContent = "";
    newParent.appendChild(h("option", { value: "", text: "Aucune (catégorie de premier niveau)" }));
    cats.forEach(function (c) { newParent.appendChild(h("option", { value: String(c.id), text: indent(c) })); });
  }
  function api(method, url, body) {
    var siteId = (document.getElementById("be-form") || { dataset: {} }).dataset.site; // accès limité à un site : le site de l'article accompagne chaque appel (validé par le serveur)
    if (siteId && String(url).indexOf("/formateur/blog/api/") === 0) url += (String(url).indexOf("?") >= 0 ? "&" : "?") + "site=" + encodeURIComponent(siteId);
    return fetch(url, { method: method, credentials: "same-origin", headers: Object.assign({ Accept: "application/json" }, body ? { "Content-Type": "application/json" } : {}), body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || "Erreur (" + r.status + ")."); return d; }); },
        function () { throw new Error("Connexion impossible : réessayez."); });
  }
  $("[data-taxo-new-add]").addEventListener("click", function () {
    var name = newName.value.trim();
    if (!name) { newStatus.textContent = "Saisissez un nom."; newStatus.className = "wp-help tx-error"; return; }
    newStatus.textContent = "Création…"; newStatus.className = "wp-help";
    api("POST", "/formateur/blog/api/termes", { taxonomy: "category", name: name, parent_id: newParent.value || null }).then(function (r) {
      // arbre rechargé (profondeur et ordre corrects), la nouvelle catégorie est cochée
      return api("GET", "/formateur/blog/api/termes?taxonomy=category").then(function (list) {
        cats = list.terms; chosen.push(r.term.id); if (!primary) primary = r.term.id;
        newName.value = ""; newStatus.textContent = "Catégorie « " + r.term.name + " » créée et ajoutée à l'article."; newStatus.className = "wp-help";
        renderCats(); renderParents(); renderPrimary(); sync(true);
      });
    }, function (err) { newStatus.textContent = err.message; newStatus.className = "wp-help tx-error"; });
  });
  newName.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("[data-taxo-new-add]").click(); } });

  // Étiquettes : jetons, recherche (saisie semi-automatique) et création rapide
  function renderTags() {
    tagsEl.textContent = "";
    tags.forEach(function (t) {
      tagsEl.appendChild(h("li", { class: "tx-token" }, [h("span", { text: t.name }), h("button", { type: "button", "aria-label": "Retirer l'étiquette " + t.name, text: "×", onclick: function () { tags = tags.filter(function (x) { return x.id !== t.id; }); renderTags(); sync(true); } })]));
    });
  }
  function addTag(term) {
    if (tags.some(function (t) { return t.id === term.id; })) { say("« " + term.name + " » est déjà dans l'article."); return; }
    if (tags.length >= 10) { say("10 étiquettes au plus.", true); return; }
    tags.push({ id: term.id, name: term.name }); renderTags(); sync(true); say("Étiquette « " + term.name + " » ajoutée.");
  }
  var timer = null, options = [], active = -1;
  function closeSuggest() { suggest.hidden = true; tagInput.setAttribute("aria-expanded", "false"); active = -1; }
  function paintSuggest() {
    suggest.textContent = "";
    options.forEach(function (o, i) {
      suggest.appendChild(h("li", { role: "option", id: "tx-opt-" + i, "aria-selected": String(i === active), class: i === active ? "is-active" : "", onmousedown: function (e) { e.preventDefault(); choose(o); } }, o.create ? "Créer « " + o.name + " »" : o.name + (o.count ? " (" + o.count + ")" : "")));
    });
    suggest.hidden = !options.length; tagInput.setAttribute("aria-expanded", String(options.length > 0));
    if (active >= 0) tagInput.setAttribute("aria-activedescendant", "tx-opt-" + active); else tagInput.removeAttribute("aria-activedescendant");
  }
  function choose(o) {
    if (!o.create) { addTag(o); tagInput.value = ""; closeSuggest(); return; }
    say("Création de l'étiquette…");
    api("POST", "/formateur/blog/api/termes", { taxonomy: "tag", name: o.name }).then(function (r) { addTag(r.term); tagInput.value = ""; closeSuggest(); }, function (err) { say(err.message, true); });
  }
  function search() {
    var q = tagInput.value.trim();
    if (!q) { closeSuggest(); return; }
    api("GET", "/formateur/blog/api/termes?taxonomy=tag&q=" + encodeURIComponent(q)).then(function (r) {
      options = r.terms.filter(function (t) { return !tags.some(function (x) { return x.id === t.id; }); });
      var exact = r.terms.some(function (t) { return t.name.toLowerCase() === q.toLowerCase(); });
      if (!exact) options.push({ create: true, name: q });
      active = options.length ? 0 : -1; paintSuggest();
    }, function (err) { say(err.message, true); });
  }
  tagInput.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(search, 180); });
  tagInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" && options.length) { e.preventDefault(); active = (active + 1) % options.length; paintSuggest(); }
    else if (e.key === "ArrowUp" && options.length) { e.preventDefault(); active = (active - 1 + options.length) % options.length; paintSuggest(); }
    else if (e.key === "Escape") closeSuggest();
    else if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (!tagInput.value.trim()) return;
      if (options.length && active >= 0) choose(options[active]); else choose({ create: true, name: tagInput.value.trim().replace(/,$/, "") });
    } else if (e.key === "Backspace" && !tagInput.value && tags.length) { tags.pop(); renderTags(); sync(true); }
  });
  tagInput.addEventListener("blur", function () { setTimeout(closeSuggest, 120); });

  renderCats(); renderParents(); renderPrimary(); renderTags(); sync(false);
})();

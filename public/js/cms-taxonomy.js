// KOLAKISA CMS → Catégories / Étiquettes : remplit les fenêtres (création, modification, suppression, fusion) avec le terme choisi.
// Les données viennent de la ligne du tableau (attributs data-tx-*) ; tout l'enregistrement passe par de vrais formulaires.
(function () {
  var BASE = "/marketing/site-web/articles/termes";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var parse = function (el, attr) { try { return JSON.parse(el.getAttribute(attr)); } catch (e) { return null; } };
  var open = function (d) { if (d && typeof d.showModal === "function" && !d.open) d.showModal(); };

  var form = $("#tx-form");
  if (form) {
    var f = $("[data-tx-form]", form), title = $("#tx-form-title", form), slugTouched = false;
    var isTag = $("[name=taxonomy]", f).value === "tag";
    var fill = function (t) {
      f.action = t ? BASE + "/" + t.id : BASE;
      title.textContent = t ? (isTag ? "Modifier l'étiquette" : "Modifier la catégorie") : (isTag ? "Ajouter une étiquette" : "Ajouter une catégorie");
      $("#tx-name").value = t ? t.name : ""; $("#tx-slug").value = t ? t.slug : ""; $("#tx-desc").value = t ? t.description : "";
      var p = $("#tx-parent");
      if (p) {
        p.value = t && t.parent_id ? String(t.parent_id) : "";
        // une catégorie ne peut pas devenir fille d'elle-même : son option est masquée (le serveur refuse aussi les cycles)
        [].forEach.call(p.options, function (o) { o.hidden = Boolean(t && o.value === String(t.id)); });
      }
      slugTouched = Boolean(t);
    };
    document.addEventListener("click", function (e) {
      var n = e.target.closest("[data-tx-new]"), ed = e.target.closest("[data-tx-edit]");
      if (n) { fill(null); open(form); $("#tx-name").focus(); }
      if (ed) { fill(parse(ed, "data-tx-edit")); open(form); $("#tx-name").focus(); }
    });
    $("#tx-slug").addEventListener("input", function () { slugTouched = true; });
    // Création : l'adresse proposée suit le nom tant qu'on ne l'a pas modifiée (modifier un nom existant ne touche jamais l'adresse)
    $("#tx-name").addEventListener("input", function () {
      if (slugTouched) return;
      $("#tx-slug").value = this.value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
    });
  }

  var del = $("#tx-delete");
  if (del) {
    var df = $("[data-tx-delete-form]", del), reassign = $("[data-tx-reassign]", del), sel = $("#tx-reassign", del), txt = $("[data-tx-delete-text]", del), ok = $("[data-tx-delete-ok]", del);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tx-delete]");
      if (!b) return;
      var t = parse(b, "data-tx-delete"), tag = $("[name=taxonomy]", df).value === "tag";
      df.action = BASE + "/" + t.id + "/supprimer";
      $("#tx-delete-title", del).textContent = "Supprimer « " + t.name + " »";
      var used = t.total > 0;
      txt.textContent = used
        ? "« " + t.name + " » est utilisée par " + t.total + " article" + (t.total > 1 ? "s" : "") + ". Choisissez où les ranger avant de la supprimer."
        : "« " + t.name + " » n'est utilisée par aucun article." + (t.children ? " Ses sous-catégories remontent d'un niveau." : "");
      reassign.hidden = !used; sel.required = used; sel.value = "";
      [].forEach.call(sel.options, function (o) { o.hidden = o.value === String(t.id); });
      if (used && tag) { txt.textContent += " Pour une étiquette, utilisez plutôt « Fusionner avec… »."; ok.disabled = true; } else ok.disabled = false;
      open(del);
    });
  }

  var mg = $("#tx-merge");
  if (mg) {
    var mf = $("[data-tx-merge-form]", mg);
    document.addEventListener("click", function (e) {
      var b = e.target.closest("[data-tx-merge]");
      if (!b) return;
      var t = parse(b, "data-tx-merge");
      mf.action = BASE + "/" + t.id + "/fusionner";
      $("#tx-merge-title", mg).textContent = "Fusionner « " + t.name + " »";
      $("[data-tx-merge-text]", mg).textContent = "« " + t.name + " » (" + t.total + " article" + (t.total > 1 ? "s" : "") + ") sera fusionnée dans un autre terme.";
      var s = $("#tx-target", mg), nm = $("#tx-target-name", mg);
      if (s) { s.value = ""; [].forEach.call(s.options, function (o) { o.hidden = o.value === String(t.id); }); }
      if (nm) nm.value = "";
      open(mg);
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-tx-close]")) { var d = e.target.closest("dialog"); if (d) d.close(); }
  });
})();

// ----- Formulaire « Ajouter » (colonne de gauche) et actions groupées du tableau (haut et bas) -----
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var slugOf = function (v) { return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80); };

  var add = $("[data-tx-add]");
  if (add) {
    var name = $("[name=name]", add), slug = $("[name=slug]", add), touched = false;
    slug.addEventListener("input", function () { touched = slug.value !== ""; });
    // Le slug proposé suit le nom tant qu'on ne l'a pas saisi soi-même (vide : le serveur le tire du nom)
    name.addEventListener("input", function () { if (!touched) slug.value = slugOf(name.value); });
    add.addEventListener("submit", function () { // pas de double envoi ; en cas d'erreur le serveur recharge la page
      var b = $("[data-tx-add-submit]", add);
      setTimeout(function () { if (b) b.disabled = true; }, 0);
    });
  }

  var bulk = $("[data-tx-bulk]");
  if (!bulk) return;
  var noun = bulk.getAttribute("data-cms-noun") || "terme";
  var rows = $$("[data-tx-row]", bulk), all = $$("[data-tx-select-all]", bulk);
  var select = $("[data-tx-bulk-select]", bulk), apply = $("[data-tx-bulk-apply]", bulk), count = $("[data-tx-bulk-count]", bulk);
  var mirror = $("[data-tx-bulk-mirror]", bulk), apply2 = $("[data-tx-bulk-apply2]", bulk);
  if (!select) return;
  var picked = function () { return rows.filter(function (r) { return r.checked; }).length; };
  function refresh() {
    var n = picked();
    select.disabled = n === 0; apply.disabled = n === 0 || !select.value;
    count.textContent = n ? n + " " + noun + (n > 1 ? "s" : "") + " sélectionné" + (n > 1 ? "s" : "") : "";
    all.forEach(function (a) { a.checked = n > 0 && n === rows.length; a.indeterminate = n > 0 && n < rows.length; });
    if (mirror) {
      if (mirror.options.length !== select.options.length) mirror.innerHTML = select.innerHTML;
      mirror.value = select.value; mirror.disabled = select.disabled; apply2.disabled = apply.disabled;
    }
  }
  all.forEach(function (a) { a.addEventListener("change", function () { rows.forEach(function (r) { r.checked = a.checked; }); refresh(); }); });
  rows.forEach(function (r) { r.addEventListener("change", refresh); });
  select.addEventListener("change", refresh);
  if (mirror) {
    mirror.addEventListener("change", function () { select.value = mirror.value; refresh(); });
    apply2.addEventListener("click", function () { if (bulk.requestSubmit) bulk.requestSubmit(apply); else apply.click(); });
  }
  var confirmed = false;
  bulk.addEventListener("submit", function (e) {
    if (confirmed) return; // deuxième passage (après confirmation) : le formulaire part
    if (select.value !== "supprimer") return;
    e.preventDefault();
    var n = picked();
    var texts = { title: "Supprimer ?", text: n + " " + noun + (n > 1 ? "s" : "") + " ser" + (n > 1 ? "ont" : "a") + " supprimé" + (n > 1 ? "s" : "") + ". Aucun article n'est supprimé ; les termes utilisés par des articles sont refusés (utilisez « Supprimer » sur la ligne pour choisir où ranger leurs articles).", ok: "Supprimer" };
    var go = function () { confirmed = true; if (bulk.requestSubmit) bulk.requestSubmit(apply); else bulk.submit(); setTimeout(function () { $$("button", bulk).forEach(function (b) { b.disabled = true; }); }, 0); };
    if (window.mkConfirm) window.mkConfirm(texts, go); else if (window.confirm(texts.text)) go();
  });
  refresh();
})();

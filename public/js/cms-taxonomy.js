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

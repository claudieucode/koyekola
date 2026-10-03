/* Éditeur d'article (formateur) : barre de mise en forme (insère la syntaxe dans le texte), envoi d'image,
   carte de formation, date en UTC, contrôles SEO du mot-clé. Sans script, le champ texte reste utilisable. */
(function () {
  "use strict";
  var form = document.querySelector("[data-blog-editor]");
  if (!form) return;
  var area = document.getElementById("post-content");
  var toolbar = form.querySelector("[data-blog-toolbar]");
  if (toolbar) toolbar.hidden = false;

  function insert(before, after, placeholder, block) {
    area.focus();
    var start = area.selectionStart, end = area.selectionEnd, value = area.value;
    var selected = value.slice(start, end) || placeholder || "";
    var prefix = before;
    if (block && start > 0 && value[start - 1] !== "\n") prefix = "\n\n" + prefix;
    else if (block && start > 1 && value.slice(start - 2, start) !== "\n\n" && value[start - 1] === "\n") prefix = "\n" + prefix;
    var text = prefix + selected + (after || "");
    area.setRangeText(text, start, end, "end");
    var selStart = start + prefix.length;
    area.setSelectionRange(selStart, selStart + selected.length);
    area.dispatchEvent(new Event("input"));
  }
  var ACTIONS = {
    h2: function () { insert("## ", "\n\n", "Titre de section", true); },
    h3: function () { insert("### ", "\n\n", "Sous-titre", true); },
    bold: function () { insert("**", "**", "texte en gras"); },
    italic: function () { insert("*", "*", "texte en italique"); },
    ul: function () { insert("- ", "\n- \n", "Premier élément", true); },
    ol: function () { insert("1. ", "\n2. \n", "Première étape", true); },
    quote: function () { insert("> ", "\n\n", "Une citation", true); },
    link: function () { insert("[", "](https://)", "texte du lien"); },
    conseil: function () { insert(":::conseil\n", "\n:::\n\n", "Votre conseil.", true); },
    "a-retenir": function () { insert(":::a-retenir\n", "\n:::\n\n", "L'idée essentielle à retenir.", true); },
    "bon-a-savoir": function () { insert(":::bon-a-savoir\n", "\n:::\n\n", "Une information utile.", true); },
    button: function () { insert("[[bouton:", "|/catalogue]]\n\n", "Découvrir les formations", true); },
  };
  form.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-insert]");
    if (btn && ACTIONS[btn.getAttribute("data-insert")]) { e.preventDefault(); ACTIONS[btn.getAttribute("data-insert")](); }
  });

  // Formation : insère sa carte
  var courseSelect = form.querySelector("[data-insert-course]");
  if (courseSelect) courseSelect.addEventListener("change", function () {
    if (!courseSelect.value) return;
    insert("[[formation:" + courseSelect.value + "]]", "\n\n", "", true);
    courseSelect.value = "";
  });

  // Image : envoyée sur le site, puis insérée avec son texte alternatif
  var imageInput = form.querySelector("[data-insert-image]");
  if (imageInput) imageInput.addEventListener("change", function () {
    var file = imageInput.files && imageInput.files[0];
    if (!file) return;
    var alt = window.prompt("Texte alternatif de l'image (décrivez ce qu'elle montre) :", "") || "";
    var body = new FormData();
    body.append("article_image", file);
    fetch("/formateur/blog/images", { method: "POST", body: body, credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.path) throw new Error(data.error || "Envoi impossible.");
        insert("![" + alt.replace(/[\[\]]/g, "") + "](" + data.path + ")", "\nLégende : \n\n", "", true);
      })
      .catch(function (err) { window.alert(err.message || "L'image n'a pas pu être envoyée."); })
      .then(function () { imageInput.value = ""; });
  });

  // Date de publication : saisie en heure locale, envoyée en UTC
  var dateIn = form.querySelector("[data-utc-source]");
  var dateOut = form.querySelector("[data-utc-target]");
  if (dateIn && dateOut) {
    // La valeur initiale vient du serveur en UTC : on l'affiche en heure locale
    if (dateIn.value) {
      var d0 = new Date(dateIn.value + ":00Z");
      if (!isNaN(d0)) dateIn.value = new Date(d0.getTime() - d0.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    var initial = dateIn.value;
    form.addEventListener("submit", function () {
      if (dateIn.value && dateIn.value !== initial) { var d = new Date(dateIn.value); if (!isNaN(d)) dateOut.value = d.toISOString(); }
    });
  }

  // Statistiques et contrôles du mot-clé principal (aide, jamais bloquant)
  var stats = form.querySelector("[data-editor-stats]");
  var keyword = form.querySelector("[data-seo-keyword]");
  var checks = form.querySelector("[data-seo-checks]");
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
  function update() {
    var text = area.value;
    var words = (text.match(/[\p{L}\p{N}’']+/gu) || []).length;
    var h2 = (text.match(/^##\s+/gm) || []).length;
    if (stats) stats.textContent = words + " mots · environ " + Math.max(1, Math.round(words / 230)) + " min de lecture · " + h2 + " titre" + (h2 > 1 ? "s" : "") + " de section (sommaire " + (h2 >= 2 ? "affiché" : "masqué : il faut au moins 2 titres") + ")";
    if (!keyword || !checks) return;
    var k = norm(keyword.value.trim());
    checks.innerHTML = "";
    if (!k) return;
    var seoTitle = form.querySelector("#post-seo-title").value || form.querySelector("#post-title").value;
    var desc = form.querySelector("#post-seo-desc").value || form.querySelector("#post-excerpt").value;
    var first = text.split(/\n\s*\n/).find(function (b) { return b.trim() && !/^#/.test(b.trim()); }) || "";
    [
      ["dans le titre", norm(seoTitle).indexOf(k) >= 0],
      ["dans la description", norm(desc).indexOf(k) >= 0],
      ["dans le premier paragraphe", norm(first).indexOf(k) >= 0],
      ["dans au moins un titre de section", text.split("\n").some(function (l) { return /^#{2,3}\s/.test(l) && norm(l).indexOf(k) >= 0; })],
    ].forEach(function (c) {
      var li = document.createElement("li");
      li.className = c[1] ? "is-ok" : "is-todo";
      li.textContent = (c[1] ? "✓ Mot-clé présent " : "○ Mot-clé absent ") + c[0];
      checks.appendChild(li);
    });
  }
  ["input", "change"].forEach(function (ev) { form.addEventListener(ev, update); });
  update();
})();

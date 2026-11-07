/* Plume d'Or — aperçu de gravure en direct. Ajoute un champ de saisie, des styles de gravure et des laques au bloc [data-po-grav]. Sans dépendance.
   C'est un aperçu : le texte réellement commandé se saisit sur la fiche produit (personnalisation par ligne du moteur). Rien n'est envoyé, stocké ni mis au panier. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "plume-or") return;
  var all = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  all("[data-po-grav]").forEach(function (root) {
    var tools = root.querySelector("[data-po-tools]"), out = root.querySelector("[data-po-out]"), pen = root.querySelector(".po-pen");
    if (!tools || !out || !pen) return;
    var max = parseInt(root.getAttribute("data-max"), 10) || 20, fallback = out.textContent;
    var clean = function (v) { return String(v || "").replace(/[\u0000-\u001f\u007f<>]+/g, " ").replace(/\s+/g, " ").slice(0, max); };
    var cell = function (cls) { var d = document.createElement("div"); if (cls) d.className = cls; return d; };
    var lab = function (txt, forId) { var l = document.createElement(forId ? "label" : "p"); l.className = forId ? "" : "po-tl"; if (forId) l.setAttribute("for", forId); l.textContent = txt; return l; };

    var left = cell(), inp = document.createElement("input"), cnt = document.createElement("p"), uid = "po-in-" + (window.__poN = (window.__poN || 0) + 1);
    inp.type = "text"; inp.className = "po-in"; inp.id = uid; inp.maxLength = max; inp.placeholder = "Votre texte"; inp.value = fallback; inp.autocomplete = "off"; inp.setAttribute("aria-describedby", uid + "-c");
    cnt.className = "po-cnt"; cnt.id = uid + "-c"; cnt.setAttribute("aria-live", "polite");
    left.appendChild(lab("Texte de l'aperçu", uid)); left.appendChild(inp); left.appendChild(cnt);

    var right = cell(), styles = cell("po-grp"), laques = cell("po-grp");
    var group = function (host, title, items, attr, current, swatch) {
      var btns = [];
      items.forEach(function (it) {
        var bt = document.createElement("button"); bt.type = "button"; bt.className = "po-chip" + (swatch ? " po-sw" : ""); bt.setAttribute("aria-pressed", it[0] === current ? "true" : "false");
        if (swatch) { bt.setAttribute("aria-label", it[1]); bt.title = it[1]; var i = document.createElement("i"); i.style.background = it[2]; bt.appendChild(i); } else bt.textContent = it[1];
        bt.addEventListener("click", function () { pen.setAttribute(attr, it[0]); btns.forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); }); });
        btns.push(bt); host.appendChild(bt);
      });
      host.setAttribute("role", "group"); host.setAttribute("aria-label", title);
    };
    group(styles, "Style de gravure", [["capitales", "Capitales"], ["italique", "Italique"], ["monogramme", "Monogramme"]], "data-style", "capitales");
    group(laques, "Laque du stylo", [["petrole", "Pétrole", "#1d6070"], ["bordeaux", "Bordeaux", "#5a1730"], ["nuit", "Bleu nuit", "#16264d"], ["noir", "Noir", "#1a1b1d"]], "data-laque", "petrole", true);
    pen.setAttribute("data-style", "capitales"); pen.setAttribute("data-laque", "petrole");
    right.appendChild(lab("Style")); right.appendChild(styles); right.appendChild(lab("Laque")); right.appendChild(laques);
    tools.appendChild(left); tools.appendChild(right);

    var upd = function () {
      var v = clean(inp.value); out.textContent = v || " ";
      cnt.textContent = v.length + " sur " + max + " caractères (aperçu)";
      if (inp.value !== v && document.activeElement !== inp) inp.value = v;
    };
    inp.addEventListener("input", function () { var v = clean(inp.value); if (inp.value !== v) inp.value = v; upd(); });
    upd();
  });
})();

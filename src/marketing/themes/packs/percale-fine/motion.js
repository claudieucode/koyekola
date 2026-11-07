/* Percale Fine — sélecteur du configurateur par dimensions de lit + fils qui se tendent à l'entrée. Aucune dépendance.
   Le sélecteur ne fait que mettre en avant une ligne du tableau (qui reste lisible sans script) : rien n'est envoyé, rien n'est ajouté au panier. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "percale-fine") return;
  body.classList.add("pc-js");
  var KEY = "percale-fine-lit";

  function store(v) { try { if (v === undefined) return window.localStorage.getItem(KEY); window.localStorage.setItem(KEY, v); } catch (e) { /* stockage indisponible */ } return null; }

  function conf(root) {
    var pick = root.querySelector("[data-pc-pick]"), res = root.querySelector("[data-pc-res]"), table = root.querySelector("table");
    if (!pick || !res || !table) return;
    var rows = Array.prototype.slice.call(table.querySelectorAll("tbody tr[data-lit]"));
    var heads = Array.prototype.slice.call(table.querySelectorAll("thead th a"));
    if (!rows.length) return;
    var buttons = [];

    function show(row, remember) {
      var lit = row.getAttribute("data-lit");
      rows.forEach(function (r) { r.classList.toggle("pc-on", r === row); r.classList.toggle("pc-dim", r !== row); });
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-lit") === lit ? "true" : "false"); });
      var cells = row.querySelectorAll("td");
      var box = document.createElement("div"); box.className = "pc-res-b";
      var p = document.createElement("p"); p.textContent = "Pour un lit de " + lit + " cm, choisissez ces valeurs dans la liste « Variante » de la fiche produit :";
      var ul = document.createElement("ul");
      heads.forEach(function (a, i) {
        if (!cells[i]) return;
        var li = document.createElement("li"), s = document.createElement("span"), b = document.createElement("b"), l = document.createElement("a");
        s.textContent = a.textContent; b.textContent = cells[i].textContent; l.textContent = "Voir : " + a.textContent.toLowerCase(); l.href = a.getAttribute("href");
        li.appendChild(s); li.appendChild(b); li.appendChild(document.createElement("br")); li.appendChild(l); ul.appendChild(li);
      });
      box.appendChild(p); box.appendChild(ul);
      res.innerHTML = ""; res.appendChild(box);
      if (remember) store(lit);
    }

    pick.innerHTML = "";
    pick.setAttribute("role", "group"); pick.setAttribute("aria-label", "Largeur de votre lit");
    rows.forEach(function (row) {
      var th = row.querySelector("th"), name = th && th.querySelector("span") ? th.querySelector("span").textContent : "";
      var b = document.createElement("button"); b.type = "button"; b.className = "pc-opt"; b.setAttribute("data-lit", row.getAttribute("data-lit")); b.setAttribute("aria-pressed", "false");
      b.appendChild(document.createTextNode(row.getAttribute("data-lit") + " cm"));
      if (name) { var sm = document.createElement("small"); sm.textContent = name; b.appendChild(sm); }
      b.addEventListener("click", function () { show(row, true); });
      pick.appendChild(b); buttons.push(b);
    });
    var saved = store();
    if (saved) rows.forEach(function (r) { if (r.getAttribute("data-lit") === saved) show(r, false); });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-percale-conf]"), conf);

  var titles = document.querySelectorAll(".pc-h2");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (list) { list.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("pc-in"); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    Array.prototype.forEach.call(titles, function (t) { io.observe(t); });
  } else Array.prototype.forEach.call(titles, function (t) { t.classList.add("pc-in"); });
})();

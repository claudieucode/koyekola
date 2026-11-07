/* Boucles fières — diagnostic de boucles (type, porosité, besoin → routine en quatre gestes) + tracé des boucles à l'entrée dans l'écran. Aucune dépendance.
   Les choix ne sont ni envoyés ni enregistrés : ils servent seulement à composer des liens vers les étiquettes réelles du catalogue. Sans JavaScript, les fiches dépliantes restent lisibles. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "boucles-fieres") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  body.classList.add("bf-js");

  var TYPES = [
    { k: "3A", fam: "3", d: "Boucles amples en S" }, { k: "3B", fam: "3", d: "Ressorts bien formés" }, { k: "3C", fam: "3", d: "Tire-bouchons serrés" },
    { k: "4A", fam: "4", d: "Petits ressorts en S" }, { k: "4B", fam: "4", d: "Boucles en Z" }, { k: "4C", fam: "4", d: "Boucles très serrées" }
  ];
  var PORO = [
    { k: "basse", n: "Basse", d: "L'eau perle, les soins pénètrent lentement" },
    { k: "moyenne", n: "Moyenne", d: "Les cheveux absorbent et gardent bien l'eau" },
    { k: "haute", n: "Haute", d: "Les cheveux boivent vite et sèchent vite" }
  ];
  var NEEDS = [
    { k: "hydrater", n: "Hydrater" }, { k: "demeler", n: "Démêler" }, { k: "definir", n: "Définir mes boucles" }, { k: "proteger", n: "Protéger la nuit" }
  ];
  var TAG = /^[a-z0-9-]{2,40}$/;

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }

  // La routine : quatre gestes (cinq si le besoin est la protection de nuit). Chaque geste = une étiquette réelle du catalogue.
  function routine(s) {
    var light = s.type.fam === "3", p = s.poro, n = s.need;
    var steps = [
      { t: "Nettoyer", tag: "nettoyage-doux", key: false,
        x: p === "haute" ? "Un lavage doux, ou un co-wash entre deux lavages, pour ne pas dessécher les longueurs." : p === "basse" ? "Un shampoing doux ; un clarifiant léger de temps en temps si les produits s'accumulent." : "Un shampoing doux environ une fois par semaine, à ajuster selon votre rythme." },
      { t: n === "demeler" ? "Démêler" : "Hydrater", tag: n === "demeler" ? "demelage" : "hydratation", key: n === "hydrater" || n === "demeler",
        x: n === "demeler" ? "Un soin glissant, des pointes vers les racines, avec les doigts ou un peigne à dents larges, cheveux mouillés." : p === "haute" ? "Un masque riche, laissé poser, puis un leave-in : les cheveux très poreux aiment les soins nourrissants." : p === "basse" ? "Un leave-in fluide en couche fine, éventuellement sous la chaleur douce d'une serviette ou d'un bonnet." : "Un masque ou un leave-in, selon la saison, sur cheveux bien humides." },
      { t: "Définir", tag: "definition", key: n === "definir",
        x: light ? "Une crème ou un gel léger, appliqué par sections sur cheveux mouillés, en lissant la mèche sans frotter." : "Une crème riche ou un beurre fouetté, appliqué par sections sur cheveux bien humides." },
      { t: "Sceller", tag: p === "basse" ? "protection" : "scellage", key: false,
        x: p === "basse" ? "Très peu de matière : une goutte d'huile fine sur les pointes suffit." : "Un beurre ou une huile sur les longueurs pour garder l'hydratation plus longtemps." }
    ];
    if (n === "proteger") steps.push({ t: "Protéger la nuit", tag: "protection", key: true, x: "Un bonnet, un foulard ou une taie en satin réduisent le frottement pendant le sommeil." });
    return steps;
  }

  function diag(root) {
    var ui = root.querySelector("[data-dg-ui]");
    if (!ui) return;
    var base = root.getAttribute("data-base") || "/boutique/etiquette/";
    if (base.charAt(0) !== "/") base = "/boutique/etiquette/";
    var s = { type: null, poro: null, need: null };
    ui.textContent = "";
    function link(tag, label, cls) {
      if (!TAG.test(tag)) return el("span", cls, label);
      var a = el("a", cls, label); a.href = base + tag; return a;
    }
    var groups = {}, results, status;
    function group(title, hint, items, key, withIcon) {
      var fs = el("fieldset", "bf-fs"), lg = el("legend", "", title); fs.appendChild(lg);
      if (hint) fs.appendChild(el("p", "bf-small", hint));
      var row = el("div", "bf-opts"); row.setAttribute("role", "group"); row.setAttribute("aria-label", title);
      var btns = items.map(function (it) {
        var b = el("button", "bf-opt"); b.type = "button";
        if (withIcon) {
          var src = root.querySelector('[data-dg-type="' + it.k + '"] svg');
          if (src) { var sp = el("span", "bf-opt-ic"); sp.appendChild(src.cloneNode(true)); b.appendChild(sp); }
        }
        b.appendChild(el("b", "", it.k.length <= 2 ? it.k : (it.n || it.k)));
        var sub = it.d || (it.n && it.k.length <= 2 ? it.n : ""); if (sub) b.appendChild(el("span", "", sub));
        b.addEventListener("click", function () { s[key] = it; paint(true); });
        row.appendChild(b); return b;
      });
      fs.appendChild(row); ui.appendChild(fs); groups[key] = { btns: btns, items: items };
    }
    group("1. Votre type de boucles", "Un repère, pas une étiquette : choisissez ce qui ressemble le plus à votre texture dominante.", TYPES, "type", true);
    group("2. La porosité de vos cheveux", "Estimation : ce n'est pas une mesure exacte.", PORO.map(function (p) { return { k: p.k, n: p.n, d: p.d }; }), "poro", false);
    group("3. Votre besoin du moment", "", NEEDS, "need", false);
    status = el("p", "bf-vh"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); ui.appendChild(status);
    results = el("div", "bf-res"); ui.appendChild(results);

    function paint(announce) {
      Object.keys(groups).forEach(function (k) { groups[k].btns.forEach(function (b, i) { b.setAttribute("aria-pressed", String(s[k] === groups[k].items[i])); }); });
      results.textContent = "";
      if (!s.type || !s.poro || !s.need) {
        results.className = "bf-res";
        var left = [!s.type && "le type", !s.poro && "la porosité", !s.need && "le besoin"].filter(Boolean);
        if (announce) status.textContent = "Il reste à choisir : " + left.join(", ") + ".";
        results.appendChild(el("p", "bf-small", "Choisissez un repère dans chaque groupe : votre routine apparaît ici. Reste à choisir : " + left.join(", ") + "."));
        return;
      }
      results.className = "bf-res is-on";
      var steps = routine({ type: s.type, poro: s.poro.k, need: s.need.k });
      results.appendChild(el("h3", "bf-h3", "Votre routine : boucles " + s.type.k + ", porosité " + s.poro.n.toLowerCase() + ", besoin « " + s.need.n.toLowerCase() + " »"));
      var ol = el("ol", "bf-rsteps");
      steps.forEach(function (st) {
        var li = el("li", st.key ? "is-key" : ""), d = el("div");
        d.appendChild(el("b", "", st.t)); d.appendChild(el("span", "", st.x));
        d.appendChild(link(st.tag, "Voir les soins : " + st.t.toLowerCase(), "bf-rl"));
        li.appendChild(d); ol.appendChild(li);
      });
      results.appendChild(ol);
      var chips = el("p", "bf-links");
      chips.appendChild(link("boucles-" + s.type.fam, "Tous les soins pour boucles " + s.type.fam));
      if (s.poro.k !== "moyenne") chips.appendChild(link("porosite-" + s.poro.k, "Soins pour porosité " + s.poro.k));
      var again = el("button", "bf-again", "Recommencer"); again.type = "button";
      again.addEventListener("click", function () { s.type = s.poro = s.need = null; paint(false); status.textContent = "Choix effacés."; var f = ui.querySelector(".bf-opt"); if (f) f.focus(); });
      chips.appendChild(again);
      results.appendChild(chips);
      if (announce) status.textContent = "Routine composée : " + steps.length + " gestes.";
    }
    paint(false);
  }

  // Tracé des boucles qui se dessinent à l'entrée dans l'écran
  function traces() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll(".bf-curl"));
    if (!nodes.length) return;
    if (reduce || !("IntersectionObserver" in window)) { nodes.forEach(function (n) { n.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.3 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function init() { Array.prototype.slice.call(document.querySelectorAll("[data-boucles-diag]")).forEach(diag); traces(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Cuir — atelier de personnalisation (aperçu en direct) + couture qui se tisse. Aucune dépendance. Le texte saisi ici n'est PAS envoyé : il illustre seulement.
   Le texte réellement commandé se saisit dans le champ de personnalisation de la fiche produit (moteur de boutique). */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "cuir") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  body.classList.add("cu-js");

  function parse(str, fallback) {
    var out = String(str || "").split(";").map(function (p) { var i = p.lastIndexOf(":"); return i > 0 ? { name: p.slice(0, i).trim(), value: p.slice(i + 1).trim() } : null; })
      .filter(function (o) { return o && /^#[0-9a-f]{6}$/i.test(o.value) || (o && /^[a-z]+$/.test(o.value)); });
    return out.length ? out : fallback;
  }
  function clean(v, max) { return String(v || "").replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, "").toUpperCase().slice(0, max); }
  function spaced(s) { return s.split("").join(" "); }

  // Illustrations (le cuir et le fil se règlent par variables CSS ; le monogramme est du texte SVG créé ici)
  var SHAPES = {
    sac: { svg: '<svg viewBox="0 0 400 360" role="img" aria-label="Sac en cuir : aperçu des initiales"><path class="cu-handle" d="M130 132 C130 40 270 40 270 132"/><path class="cu-leather" d="M70 130 H330 L352 330 Q353 342 341 342 H59 Q47 342 48 330 Z"/><path class="cu-light" d="M70 130 H330 L336 190 H64 Z"/><path class="cu-shade" d="M70 130 H330 L318 204 Q200 246 82 204 Z"/><path class="cu-thread" d="M86 146 H314 L303 196 Q200 232 97 196 Z"/><path class="cu-thread" d="M64 322 H336"/><circle class="cu-hardware" cx="200" cy="222" r="11"/><circle class="cu-shade" cx="200" cy="222" r="4"/></svg>', x: 200, y: 294, anchor: "middle" },
    portefeuille: { svg: '<svg viewBox="0 0 400 360" role="img" aria-label="Portefeuille en cuir : aperçu des initiales"><rect class="cu-leather" x="50" y="80" width="300" height="200" rx="16"/><rect class="cu-light" x="50" y="80" width="300" height="70" rx="16"/><path class="cu-shade" d="M50 150 H350 V264 Q350 280 334 280 H66 Q50 280 50 264 Z"/><rect class="cu-thread" x="66" y="96" width="268" height="168" rx="10"/><path class="cu-thread" d="M66 150 H334"/><rect class="cu-hardware" x="188" y="136" width="24" height="28" rx="4"/><circle class="cu-shade" cx="200" cy="150" r="4"/></svg>', x: 322, y: 246, anchor: "end" }
  };

  function mono(svg, shape) {
    var g = document.createElementNS(NS, "g");
    ["cu-mono cu-mono--sh", "cu-mono"].forEach(function (cls, i) {
      var t = document.createElementNS(NS, "text");
      t.setAttribute("class", cls); t.setAttribute("x", shape.x + (i ? 0 : 1.5)); t.setAttribute("y", shape.y + (i ? 0 : 1.5)); t.setAttribute("text-anchor", shape.anchor);
      g.appendChild(t);
    });
    svg.appendChild(g);
    return Array.prototype.slice.call(g.childNodes);
  }

  function atelier(root) {
    var stage = root.querySelector("[data-cuir-stage]"), ui = root.querySelector("[data-cuir-ui]");
    if (!stage || !ui) return;
    var max = Math.max(1, Math.min(6, parseInt(root.getAttribute("data-max"), 10) || 3));
    var cuirs = parse(root.getAttribute("data-cuirs"), [{ name: "Cognac", value: "#9a4a1e" }]);
    var fils = parse(root.getAttribute("data-fils"), [{ name: "Or", value: "#d6b06a" }]);
    var modeles = parse(root.getAttribute("data-modeles"), [{ name: "Sac", value: "sac" }]).filter(function (m) { return SHAPES[m.value]; });
    if (!modeles.length) modeles = [{ name: "Sac", value: "sac" }];
    var start = body.getAttribute("data-pk-atelier");
    var state = { modele: (modeles.filter(function (m) { return m.value === start; })[0] || modeles[0]).value, cuir: 0, fil: 0, text: "" };
    var uid = "cu" + (window.__cuN = (window.__cuN || 0) + 1), texts = [], status;

    ui.textContent = "";
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
    // champ des initiales
    var fl = el("div"), lab = el("label", "", "Vos initiales (" + max + " lettres au plus)"); lab.setAttribute("for", uid + "-i");
    var inp = el("input"); inp.type = "text"; inp.id = uid + "-i"; inp.maxLength = max; inp.autocomplete = "off"; inp.setAttribute("autocapitalize", "characters"); inp.setAttribute("spellcheck", "false"); inp.placeholder = "AB";
    fl.appendChild(lab); fl.appendChild(inp); ui.appendChild(fl);
    function group(title, items, key, swatch) {
      var fs = el("fieldset"), lg = el("legend", "", title), row = el("div", "cu-opts"); fs.appendChild(lg); fs.appendChild(row);
      row.setAttribute("role", "group"); row.setAttribute("aria-label", title);
      var btns = items.map(function (it, i) {
        var b = el("button", "cu-opt"); b.type = "button";
        if (swatch) { var s = el("i"); s.style.setProperty("--sw", it.value); b.appendChild(s); }
        b.appendChild(document.createTextNode(it.name));
        b.addEventListener("click", function () { state[key] = key === "modele" ? it.value : i; render(true); });
        row.appendChild(b); return b;
      });
      ui.appendChild(fs); return btns;
    }
    var bModele = modeles.length > 1 ? group("Modèle", modeles, "modele", false) : [];
    var bCuir = group("Couleur du cuir", cuirs, "cuir", true);
    var bFil = group("Couleur du fil", fils, "fil", true);
    status = el("p", "cu-vh"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); ui.appendChild(status);

    var shapeNow = null;
    function build() {
      stage.innerHTML = SHAPES[state.modele].svg;
      var svg = stage.querySelector("svg"); texts = mono(svg, SHAPES[state.modele]); shapeNow = state.modele;
    }
    function render(announce) {
      if (shapeNow !== state.modele) build();
      stage.style.setProperty("--cu-leather", cuirs[state.cuir].value);
      stage.style.setProperty("--cu-fil", fils[state.fil].value);
      var ghost = !state.text, shown = spaced(ghost ? "AB" : state.text);
      texts.forEach(function (t) { t.textContent = shown; t.classList.toggle("is-ghost", ghost); });
      bModele.forEach(function (b, i) { b.setAttribute("aria-pressed", String(modeles[i].value === state.modele)); });
      bCuir.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.cuir)); });
      bFil.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === state.fil)); });
      if (announce) status.textContent = "Aperçu : " + (state.text ? "initiales " + state.text.split("").join(" ") : "sans initiales") + ", cuir " + cuirs[state.cuir].name + ", fil " + fils[state.fil].name + ".";
    }
    inp.addEventListener("input", function () { var v = clean(inp.value, max); if (v !== inp.value.toUpperCase()) inp.value = v; state.text = v; render(false); });
    inp.addEventListener("change", function () { render(true); });
    build(); render(false);
  }

  // Fiche produit du moteur : petit aperçu sous le champ de personnalisation, suivi du coloris choisi (variante dont le nom correspond à un cuir connu)
  var COLORS = { cognac: "#9a4a1e", noir: "#1d1814", bordeaux: "#5a1d26", "vert sapin": "#24392f", sable: "#c8a77a", tabac: "#7a3b1a", camel: "#b98a52", marine: "#1f2d45" };
  function fiche() {
    var field = document.querySelector("input[data-sh-custom]");
    if (!field || document.querySelector(".cu-mini")) return;
    var host = field.closest("label") || field.parentNode;
    var wrapEl = document.createElement("div"); wrapEl.className = "cu-mini";
    var st = document.createElement("div"); st.className = "cu-stage"; st.setAttribute("aria-hidden", "true"); wrapEl.appendChild(st);
    var cap = document.createElement("p"); cap.className = "cu-small"; cap.textContent = "Aperçu illustratif de vos initiales."; wrapEl.appendChild(cap);
    host.parentNode.insertBefore(wrapEl, host.nextSibling);
    st.innerHTML = SHAPES.sac.svg;
    var t = mono(st.querySelector("svg"), SHAPES.sac);
    var sel = document.querySelector("select[name=variant_id]");
    function paint() {
      var v = clean(field.value, 6) , ghost = !v;
      t.forEach(function (n) { n.textContent = spaced(ghost ? "AB" : v); n.classList.toggle("is-ghost", ghost); });
      var label = sel && sel.selectedIndex > 0 ? sel.options[sel.selectedIndex].text.toLowerCase() : "", col = null;
      Object.keys(COLORS).forEach(function (k) { if (label.indexOf(k) > -1) col = COLORS[k]; });
      st.style.setProperty("--cu-leather", col || "#9a4a1e");
    }
    field.addEventListener("input", paint); if (sel) sel.addEventListener("change", paint); paint();
  }

  // Couture qui se tisse à l'entrée dans l'écran
  function coutures() {
    var seams = Array.prototype.slice.call(document.querySelectorAll(".cu-seam"));
    if (!seams.length) return;
    if (reduce || !("IntersectionObserver" in window)) { seams.forEach(function (s) { s.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { threshold: 0.3 });
    seams.forEach(function (s) { io.observe(s); });
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-cuir-atelier]")).forEach(atelier);
    fiche(); coutures();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Corde et bois — grille de filtres niveau × style. Aucune dépendance. Le bloc du Page Builder contient déjà la grille complète avec tous ses liens (étiquettes réelles du moteur) et
   fonctionne sans script ; ce script ajoute deux rangées de puces (niveau, style), surligne la ligne et la colonne choisies et propose le lien exact, copié de la grille.
   Si le réglage « mémoire » est actif, le niveau choisi est gardé dans CE navigateur seulement (rien n'est envoyé). */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "corde-et-bois") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) document.body.classList.add("pk-calme"); // respecte « moins d'animations » : le CSS du thème coupe aussi ses animations
  var KEY = "corde-et-bois-niveau";
  var memoire = body.getAttribute("data-pk-memoire") !== "off";
  body.classList.add("cb-js");

  function mem(get, value) {
    if (!memoire) return "";
    try {
      if (get) return window.localStorage.getItem(KEY) || "";
      if (value) window.localStorage.setItem(KEY, value); else window.localStorage.removeItem(KEY);
    } catch (e) { /* stockage indisponible : le thème fonctionne sans */ }
    return "";
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function copy(a, cls) { var c = el("a", cls, a.getAttribute("data-label") || a.textContent); c.setAttribute("href", a.getAttribute("href")); return c; }

  function grille(root) {
    var ui = root.querySelector("[data-corde-ui]"), liste = root.querySelector("[data-corde-liste]");
    if (!ui || !liste) return;
    var colonnes = [].slice.call(liste.querySelectorAll("thead th[data-niveau]"));
    var lignes = [].slice.call(liste.querySelectorAll("tbody th[data-style]"));
    if (!colonnes.length || !lignes.length) return;
    var state = { niveau: "", style: "" };
    var saved = mem(true);
    if (saved && colonnes.some(function (c) { return c.getAttribute("data-niveau") === saved; })) state.niveau = saved;
    ui.textContent = "";
    var rows = el("div", "cb-rows"), out = el("div", "cb-out"), status = el("p", "cb-vh");
    status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    ui.appendChild(rows); ui.appendChild(out); ui.appendChild(status);

    function groupe(titre) {
      var box = el("div", "cb-row"), chips = el("div", "cb-chp");
      chips.setAttribute("role", "group"); chips.setAttribute("aria-label", titre);
      box.appendChild(el("p", "cb-fine", titre)); box.appendChild(chips); rows.appendChild(box); return chips;
    }
    var gN = groupe("Votre niveau"), gS = groupe("Votre style");
    function puce(host, label, on, fn) {
      var b = el("button", "cb-cp", label); b.type = "button"; b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", fn); host.appendChild(b);
    }
    function nomNiveau(v) { var c = colonnes.filter(function (x) { return x.getAttribute("data-niveau") === v; })[0]; return c ? c.querySelector("a").textContent : v; }
    function nomStyle(v) { var l = lignes.filter(function (x) { return x.getAttribute("data-style") === v; })[0]; return l ? l.querySelector("a").textContent : v; }

    function draw(announce) {
      gN.textContent = ""; gS.textContent = "";
      colonnes.forEach(function (c) { var v = c.getAttribute("data-niveau"); puce(gN, c.querySelector("a").textContent, v === state.niveau, function () { state.niveau = state.niveau === v ? "" : v; mem(false, state.niveau); draw(true); }); });
      lignes.forEach(function (l) { var v = l.getAttribute("data-style"); puce(gS, l.querySelector("a").textContent, v === state.style, function () { state.style = state.style === v ? "" : v; draw(true); }); });
      // surbrillance dans la grille
      [].forEach.call(liste.querySelectorAll("[data-niveau],[data-style]"), function (n) {
        var okN = state.niveau && n.getAttribute("data-niveau") === state.niveau, okS = state.style && n.getAttribute("data-style") === state.style;
        n.classList.toggle("cb-hl", Boolean(okN || okS));
        n.classList.toggle("cb-hl2", Boolean(okN && okS));
      });
      // résultats : lien exact d'abord (copié de la grille), puis niveau seul, puis style seul
      out.textContent = "";
      var combo = state.niveau && state.style ? liste.querySelector("a[data-kind='combo'][data-niveau='" + state.niveau + "'][data-style='" + state.style + "']") : null;
      var titre = state.niveau || state.style ? "Sélection : " + [state.niveau && nomNiveau(state.niveau).toLowerCase(), state.style && nomStyle(state.style).toLowerCase()].filter(Boolean).join(" · ") : "Choisissez un niveau, un style, ou les deux.";
      out.appendChild(el("p", "cb-out-t", titre));
      var go = el("div", "cb-go");
      if (combo) { var a = el("a", "cb-gb", "Voir " + nomNiveau(state.niveau).toLowerCase() + " · " + nomStyle(state.style).toLowerCase()); a.setAttribute("href", combo.getAttribute("href")); go.appendChild(a); }
      else if (state.niveau && state.style) go.appendChild(el("p", "cb-small", "Pas encore d'instrument pour cette combinaison. Voici le niveau seul ou le style seul."));
      if (state.niveau) { var n = colonnes.filter(function (x) { return x.getAttribute("data-niveau") === state.niveau; })[0]; var ln = copy(n.querySelector("a"), "cb-gb" + (combo ? " cb-gb--o" : "")); ln.textContent = "Tous les instruments " + nomNiveau(state.niveau).toLowerCase(); go.appendChild(ln); }
      if (state.style) { var s = lignes.filter(function (x) { return x.getAttribute("data-style") === state.style; })[0]; var ls = copy(s.querySelector("a"), "cb-gb" + (combo || state.niveau ? " cb-gb--o" : "")); ls.textContent = "Tout le " + nomStyle(state.style).toLowerCase(); go.appendChild(ls); }
      out.appendChild(go);
      if (announce) status.textContent = titre;
    }
    draw(false);
  }

  function init() { [].slice.call(document.querySelectorAll("[data-corde-filtres]")).forEach(grille); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

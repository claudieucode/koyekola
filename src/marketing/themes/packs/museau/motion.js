/* Museau — profil d'animal. Aucune dépendance. Le bloc « profil » du Page Builder contient déjà tous les liens (étiquettes et catégories réelles) et fonctionne sans script ;
   ce script en fait un sélecteur : animal, âge, gabarit, avec la mascotte qui s'adapte, puis affiche les liens correspondants (copiés du bloc).
   Si le réglage « mémoire » est activé, le choix est gardé dans CE navigateur seulement (rien n'est envoyé) pour proposer « Pour mon chien » dans l'en-tête. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "museau") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) document.body.classList.add("pk-calme"); // respecte « moins d'animations » : le CSS du thème coupe aussi ses animations
  var KEY = "museau-profil";
  var memoire = body.getAttribute("data-pk-memoire") !== "off";
  body.classList.add("mu-js");

  function store(get, value) {
    if (!memoire) return null;
    try {
      if (get) { var raw = window.localStorage.getItem(KEY); return raw ? JSON.parse(raw) : null; }
      window.localStorage.setItem(KEY, JSON.stringify(value));
    } catch (e) { /* stockage indisponible : le thème fonctionne sans */ }
    return null;
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function linksOf(root, kind, value) {
    return Array.prototype.slice.call(root.querySelectorAll("a[data-kind='" + kind + "']")).filter(function (a) { return value === undefined || a.getAttribute("data-v") === value; });
  }
  // Lien le plus précis pour un profil : âge, sinon gabarit, sinon l'animal entier
  function best(root, animal, age, taille) {
    var det = root.querySelector("details[data-animal='" + animal + "']");
    if (!det) return null;
    var a = (age && linksOf(det, "age", age)[0]) || (taille && linksOf(det, "taille", taille)[0]) || linksOf(det, "tout")[0];
    return a ? { href: a.getAttribute("href"), label: a.textContent, nom: (det.getAttribute("data-nom") || animal).toLowerCase() } : null;
  }

  function profil(root) {
    var ui = root.querySelector("[data-museau-ui]"), list = root.querySelector("[data-museau-liste]");
    if (!ui || !list) return;
    var dets = Array.prototype.slice.call(list.querySelectorAll("details[data-animal]"));
    if (!dets.length) return;
    var state = { animal: dets[0].getAttribute("data-animal"), age: "", taille: "" };
    var saved = store(true);
    if (saved && dets.some(function (d) { return d.getAttribute("data-animal") === saved.a; })) { state.animal = saved.a; state.age = saved.g || ""; state.taille = saved.t || ""; }
    ui.textContent = "";
    var rows = el("div", "mu-rows"), out = el("div", "mu-out"), status = el("p", "mu-vh"); status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite");
    ui.appendChild(rows); ui.appendChild(out); ui.appendChild(status);
    var groups = {};
    function group(title, key) {
      var box = el("div", "mu-row"), t = el("p", "mu-fine", title), chips = el("div", "mu-chips");
      chips.setAttribute("role", "group"); chips.setAttribute("aria-label", title);
      box.appendChild(t); box.appendChild(chips); rows.appendChild(box); groups[key] = { box: box, chips: chips };
    }
    group("Qui est-ce ?", "animal"); group("Son âge", "age"); group("Son gabarit", "taille");
    function chip(host, label, on, fn) {
      var b = el("button", "mu-cp", label); b.type = "button"; b.setAttribute("aria-pressed", String(on));
      b.addEventListener("click", fn); host.appendChild(b); return b;
    }
    function det() { return dets.filter(function (d) { return d.getAttribute("data-animal") === state.animal; })[0]; }
    function draw(announce) {
      var d = det();
      groups.animal.chips.textContent = ""; groups.age.chips.textContent = ""; groups.taille.chips.textContent = "";
      dets.forEach(function (x) { var v = x.getAttribute("data-animal"); chip(groups.animal.chips, x.getAttribute("data-nom") || v, v === state.animal, function () { state.animal = v; state.age = ""; state.taille = ""; draw(true); }); });
      linksOf(d, "age").forEach(function (a) { var v = a.getAttribute("data-v"); chip(groups.age.chips, a.textContent, v === state.age, function () { state.age = state.age === v ? "" : v; draw(true); }); });
      var tailles = linksOf(d, "taille");
      groups.taille.box.hidden = !tailles.length;
      tailles.forEach(function (a) { var v = a.getAttribute("data-v"); chip(groups.taille.chips, a.textContent, v === state.taille, function () { state.taille = state.taille === v ? "" : v; draw(true); }); });
      // mascotte : l'animal, l'âge et le gabarit pilotent des attributs lus par le CSS
      root.setAttribute("data-animal", state.animal); root.setAttribute("data-age", state.age || "adulte"); root.setAttribute("data-taille", state.taille || "moyen");
      // résultats : liens copiés du bloc, du plus précis au plus large
      out.textContent = "";
      var nom = (d.getAttribute("data-nom") || state.animal).toLowerCase();
      var parts = [state.age && (linksOf(d, "age", state.age)[0] || {}).textContent, state.taille && (linksOf(d, "taille", state.taille)[0] || {}).textContent].filter(Boolean);
      var title = el("p", "mu-out-t", "Sélection pour : " + nom + (parts.length ? " · " + parts.join(", ").toLowerCase() : ""));
      out.appendChild(title);
      var top = el("div", "mu-out-top");
      if (state.age) linksOf(d, "age", state.age).forEach(function (a) { top.appendChild(copy(a, "mu-go")); });
      if (state.taille) linksOf(d, "taille", state.taille).forEach(function (a) { top.appendChild(copy(a, "mu-go")); });
      linksOf(d, "tout").forEach(function (a) { top.appendChild(copy(a, "mu-go" + (top.childNodes.length ? " mu-go--o" : ""))); });
      out.appendChild(top);
      var rub = linksOf(d, "rubrique");
      if (rub.length) {
        out.appendChild(el("p", "mu-fine", "Les rayons"));
        var r = el("div", "mu-out-rub"); rub.forEach(function (a) { r.appendChild(copy(a, "mu-rb")); }); out.appendChild(r);
      }
      var b = best(root, state.animal, state.age, state.taille);
      if (announce) store(false, { a: state.animal, g: state.age, t: state.taille, h: b ? b.href : "" }); // seulement après un vrai choix du visiteur (jamais le chien par défaut au premier affichage)
      mon();
      if (announce) status.textContent = "Sélection mise à jour : " + nom + (parts.length ? ", " + parts.join(", ").toLowerCase() : "") + ".";
    }
    function copy(a, cls) { var c = el("a", cls, a.textContent); c.setAttribute("href", a.getAttribute("href")); return c; }
    draw(false);
    list.setAttribute("hidden", "");
  }

  // Pastille de l'en-tête : « Pour mon chien » si un animal a été choisi sur cet appareil
  function mon() {
    var saved = store(true), chips = document.querySelectorAll("[data-museau-mon]");
    if (!saved || !chips.length) return;
    var NAMES = { chien: "chien", chat: "chat", "petit-animal": "petit animal" };
    var href = saved.h || "/boutique/etiquette/" + saved.a;
    if (!/^\/boutique\/etiquette\/[a-z0-9-]+$/.test(href)) return;
    Array.prototype.forEach.call(chips, function (c) { c.setAttribute("href", href); c.textContent = "Pour mon " + (NAMES[saved.a] || "animal"); });
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-museau-profil]")).forEach(profil);
    mon();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

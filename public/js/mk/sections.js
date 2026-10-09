/* Sections repliables de l'éditeur d'e-mails (panneaux gauche et droit).
   Une section = un <section class="mk-b-section"> avec son titre <h3 class="mk-b-section-title"> ; enhance() fait du titre un VRAI bouton
   (aria-expanded + aria-controls) et range le contenu dans une zone qu'il masque (attribut hidden : les champs restent dans la page,
   leurs valeurs ne sont jamais perdues). L'état ouvert/fermé est un réglage d'INTERFACE : mémorisé dans ce navigateur (localStorage),
   jamais dans le message ni dans ses versions. */
(function () {
  "use strict";
  var KEY = "mk:sections", seq = 0;
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function write(map) { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) { /* stockage indisponible : l'état reste valable pour cette page */ } }
  var memory = read();
  function remember(key, open) { memory[key] = open ? 1 : 0; write(memory); }
  function el(tag, cls, attrs) { var n = document.createElement(tag); if (cls) n.className = cls; Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); }); return n; }

  // opts : { key, open } — open = état par défaut (sans mémoire). Une section qui contient un champ en erreur s'ouvre toujours.
  function enhance(section, opts) {
    opts = opts || {};
    var title = section.querySelector(":scope > .mk-b-section-title");
    if (!title || title.tagName === "SUMMARY" || section.getAttribute("data-mk-sec")) return null;
    var key = opts.key || (section.getAttribute("aria-labelledby") || title.textContent);
    var saved = memory[key];
    var open = saved === undefined ? opts.open !== false : saved === 1;
    if (section.querySelector("[aria-invalid='true']")) open = true;
    var id = "mk-sec-" + (++seq);
    var text = title.textContent;
    var btn = el("button", "mk-sec-btn", { type: "button", "aria-expanded": String(open), "aria-controls": id });
    btn.appendChild(el("span", "mk-sec-chev", { "aria-hidden": "true" }));
    btn.appendChild(el("span", "mk-sec-label")).textContent = text;
    var body = el("div", "mk-sec-body", { id: id });
    if (!open) body.hidden = true;
    [].slice.call(section.childNodes).forEach(function (n) { if (n !== title) body.appendChild(n); });
    title.textContent = ""; title.appendChild(btn);
    section.appendChild(body);
    section.classList.add("is-collapsible"); section.classList.toggle("is-open", open);
    section.setAttribute("data-mk-sec", key);
    btn.addEventListener("click", function () { set(section, body.hidden); });
    return section;
  }
  function set(section, open, persist) {
    var btn = section.querySelector(":scope > .mk-b-section-title .mk-sec-btn"), body = section.querySelector(":scope > .mk-sec-body");
    if (!btn || !body) return;
    body.hidden = !open; btn.setAttribute("aria-expanded", String(open)); section.classList.toggle("is-open", open);
    if (persist !== false) remember(section.getAttribute("data-mk-sec"), open);
  }
  function all(container, open) { [].forEach.call(container.querySelectorAll(".mk-b-section.is-collapsible"), function (s) { set(s, open); }); }
  // Petite barre « Tout développer · Tout réduire » (discrète : deux liens textuels alignés à droite)
  function tools(container) {
    var bar = el("div", "mk-sec-tools", { role: "group", "aria-label": "Sections du panneau" });
    var expand = el("button", "mk-sec-all", { type: "button" }); expand.textContent = "Tout développer";
    var collapse = el("button", "mk-sec-all", { type: "button" }); collapse.textContent = "Tout réduire";
    expand.addEventListener("click", function () { all(container, true); });
    collapse.addEventListener("click", function () { all(container, false); });
    bar.appendChild(expand); bar.appendChild(el("span", "mk-sec-dot", { "aria-hidden": "true" })).textContent = "·"; bar.appendChild(collapse);
    return bar;
  }
  // Volet statique (HTML du serveur) : toutes ses sections, la première ouverte par défaut, avec la barre d'outils
  function pane(root, prefix) {
    var sections = [].slice.call(root.querySelectorAll(":scope > .mk-b-section"));
    if (sections.length < 2) return;
    sections.forEach(function (s, i) { enhance(s, { key: prefix + ":" + (s.getAttribute("aria-labelledby") || i), open: i === 0 }); });
    var head = root.querySelector(":scope > .mk-b-pane-head");
    var bar = tools(root);
    if (head && head.nextSibling) root.insertBefore(bar, head.nextSibling); else root.insertBefore(bar, sections[0]);
  }
  window.MKSections = { enhance: enhance, set: set, all: all, tools: tools, pane: pane };
})();

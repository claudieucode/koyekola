// Page d'atterrissage : fuseau horaire du navigateur transmis avec l'inscription (envoi des e-mails à l'heure locale)
(function () {
  "use strict";
  try {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    Array.prototype.forEach.call(document.querySelectorAll("input[data-tz]"), function (i) { i.value = tz; });
  } catch (e) { /* fuseau inconnu : rien n'est envoyé */ }
})();

// Sections libres : onglets (sans script, tous les panneaux restent lisibles l'un sous l'autre) et comptes à rebours
(function () {
  "use strict";
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-tabs]"), function (box, k) {
    var panels = box.querySelectorAll(".kw-tab-panel");
    if (panels.length < 2) return;
    var list = document.createElement("div");
    var vertical = box.classList.contains("is-vertical");
    list.className = "kw-tab-list";
    list.setAttribute("role", "tablist");
    if (vertical) list.setAttribute("aria-orientation", "vertical");
    var buttons = [];
    var show = function (i, focus) {
      buttons.forEach(function (b, j) { b.setAttribute("aria-selected", i === j ? "true" : "false"); b.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
      if (focus) buttons[i].focus();
    };
    Array.prototype.forEach.call(panels, function (panel, i) {
      var id = "kw-tabs-" + k + "-" + i;
      panel.id = id + "-panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", id);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "kw-tab-btn";
      b.id = id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", panel.id);
      b.textContent = panel.getAttribute("data-kw-tab-title") || "";
      b.addEventListener("click", function () { show(i); });
      b.addEventListener("keydown", function (e) {
        var next = vertical ? e.key === "ArrowDown" : e.key === "ArrowRight", prev = vertical ? e.key === "ArrowUp" : e.key === "ArrowLeft";
        if (next || prev) { e.preventDefault(); show((i + (next ? 1 : -1) + panels.length) % panels.length, true); }
        else if (e.key === "Home" || e.key === "End") { e.preventDefault(); show(e.key === "Home" ? 0 : panels.length - 1, true); }
      });
      buttons.push(b);
      list.appendChild(b);
    });
    box.insertBefore(list, box.firstChild);
    box.classList.add("is-enhanced");
    show(0);
  });
  // Carrousel : défilement natif (doigt, molette, clavier), boutons précédent / suivant ajoutés par le script
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-carousel]"), function (box) {
    var track = box.querySelector(".kw-carousel-track");
    if (!track || box.classList.contains("is-enhanced")) return;
    var mk = function (label, dir) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "kw-carousel-btn " + (dir < 0 ? "is-prev" : "is-next"); b.setAttribute("aria-label", label);
      b.textContent = dir < 0 ? "‹" : "›";
      b.addEventListener("click", function () { var s = track.querySelector(".kw-carousel-slide"); track.scrollBy({ left: dir * (s ? s.getBoundingClientRect().width + 12 : track.clientWidth), behavior: "smooth" }); });
      box.appendChild(b);
      return b;
    };
    var prev = mk("Image précédente", -1), next = mk("Image suivante", 1);
    var sync = function () { prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2; };
    track.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    box.classList.add("is-enhanced");
    sync();
  });
  var LABELS = [["jours", 86400], ["heures", 3600], ["minutes", 60], ["secondes", 1]];
  Array.prototype.forEach.call(document.querySelectorAll("[data-kw-countdown]"), function (box) {
    var end = Date.parse(box.getAttribute("data-kw-countdown"));
    if (!isFinite(end)) return;
    var render = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      box.textContent = "";
      if (!left) { var p = document.createElement("p"); p.textContent = box.getAttribute("data-kw-end-text") || ""; box.appendChild(p); return false; }
      LABELS.forEach(function (l) {
        var v = Math.floor(left / l[1]); left -= v * l[1];
        var u = document.createElement("span"); u.className = "kw-countdown-unit";
        var n = document.createElement("strong"); n.textContent = String(v);
        u.appendChild(n); u.appendChild(document.createTextNode(l[0])); box.appendChild(u);
      });
      return true;
    };
    box.setAttribute("role", "timer");
    if (render()) { var t = setInterval(function () { if (!render()) clearInterval(t); }, 1000); }
  });
})();

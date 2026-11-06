/* Coulisse — comportements : compte à rebours réel, programme filtrable, « Mon programme » (étoiles conservées sur l'appareil, conflits d'horaire, export agenda). */
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "coulisse") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, e) { return (e || document).querySelector(s); };
  var $$ = function (s, e) { return Array.prototype.slice.call((e || document).querySelectorAll(s)); };

  $$(".co-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

  // Compte à rebours vers l'ouverture (18 mars 2027, 9 h 30, heure locale du visiteur)
  var target = new Date(2027, 2, 18, 9, 30, 0).getTime();
  var cd = function () {
    var ms = target - Date.now(), over = ms <= 0; ms = Math.max(0, ms);
    var d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    $$('[data-cd="d"]').forEach(function (e) { e.textContent = d; }); $$('[data-cd="h"]').forEach(function (e) { e.textContent = h; }); $$('[data-cd="m"]').forEach(function (e) { e.textContent = m; });
    if (over) $$(".co-cd").forEach(function (e) { e.textContent = "L'événement a commencé"; });
  };
  if ($("[data-cd]")) { cd(); setInterval(cd, 30000); }

  var prog = $("[data-prog]") ? document : null;
  if (!prog) return;
  var cells = $$(".co-ses", prog), days = $$("[data-dayblock]", prog), nEl = $("[data-n]", prog), empty = $("[data-empty]", prog);
  var st = { day: "all", salle: "all", th: "all" }, KEY = "coulisse-mon-programme", mine = {};
  try { mine = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { mine = {}; }
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(mine)); } catch (e) {} };
  var SLOT = ["09:30-10:30", "11:00-12:00", "14:00-15:00", "15:30-16:30", "17:00-18:00"];
  var info = function (c) { return { id: c.getAttribute("data-id"), day: +c.getAttribute("data-day"), slot: +c.getAttribute("data-slot"), title: $(".co-ses-ti", c).textContent, room: $(".co-ses-r", c).textContent }; };

  var apply = function () {
    var n = 0;
    cells.forEach(function (c) {
      var ok = (st.day === "all" || c.getAttribute("data-day") === st.day) && (st.salle === "all" || c.getAttribute("data-salle") === st.salle || c.classList.contains("co-ses--all")) && (st.th === "all" || c.getAttribute("data-th") === st.th);
      c.hidden = !ok; if (ok) n++;
    });
    $$("[data-row]", prog).forEach(function (r) { r.hidden = !$$(".co-ses", r).some(function (c) { return !c.hidden; }); });
    days.forEach(function (d) { d.hidden = !$$(".co-ses", d).some(function (c) { return !c.hidden; }); });
    if (nEl) nEl.textContent = n; if (empty) empty.classList.toggle("is-on", n === 0);
    $$(".co-chip", prog).forEach(function (c) { var g = c.parentNode.getAttribute("data-g"), on = st[g] === c.getAttribute("data-v"); c.classList.toggle("is-on", on); c.setAttribute("aria-pressed", on ? "true" : "false"); });
  };
  var render = function () {
    var chosen = cells.filter(function (c) { return mine[c.getAttribute("data-id")]; }).map(info), clash = {}, list = $("[data-mine-list]", prog);
    chosen.forEach(function (a) { chosen.forEach(function (b) { if (a.id !== b.id && a.day === b.day && a.slot === b.slot) clash[a.id] = 1; }); });
    cells.forEach(function (c) {
      var id = c.getAttribute("data-id"), on = !!mine[id], b = $(".co-star", c);
      c.classList.toggle("is-mine", on); c.classList.toggle("is-clash", !!clash[id]);
      b.setAttribute("aria-pressed", on ? "true" : "false"); $("span", b).textContent = on ? "★" : "☆"; $(".co-star-l", b).textContent = on ? "Dans ma liste" : "Ajouter";
    });
    chosen.sort(function (a, b) { return a.day - b.day || a.slot - b.slot; });
    list.innerHTML = "";
    chosen.forEach(function (s) { var li = document.createElement("li"), sm = document.createElement("small"); li.appendChild(document.createTextNode(s.title)); sm.textContent = (s.day === 1 ? "Jeudi " : "Vendredi ") + SLOT[s.slot] + " · " + s.room; li.appendChild(sm); list.appendChild(li); });
    $("[data-mine-n]", prog).textContent = chosen.length; $("[data-mine-h]", prog).textContent = chosen.length + " h";
    var w = Object.keys(clash).length;
    $("[data-mine-warn]", prog).textContent = w ? "Attention : " + w + " sessions se chevauchent (surlignées en rouge dans la grille)." : "";
    $("[data-mine-empty]", prog).style.display = chosen.length ? "none" : "block";
    var ics = $("[data-ics]", prog); ics.setAttribute("aria-disabled", chosen.length ? "false" : "true"); ics.style.opacity = chosen.length ? "1" : ".55";
  };

  prog.addEventListener("click", function (ev) {
    var star = ev.target.closest && ev.target.closest("[data-star]");
    if (star) { ev.preventDefault(); var id = star.getAttribute("data-star"); if (mine[id]) delete mine[id]; else mine[id] = 1; save(); render(); return; }
    var ics = ev.target.closest && ev.target.closest("[data-ics]");
    if (ics) {
      ev.preventDefault();
      var chosen = cells.filter(function (c) { return mine[c.getAttribute("data-id")]; }).map(info); if (!chosen.length) return;
      var pad = function (n) { return (n < 10 ? "0" : "") + n; };
      var out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Rencontres Coulisse//FR"];
      chosen.forEach(function (s) {
        var t = SLOT[s.slot].split("-"), day = 17 + s.day, f = function (h) { var p = h.split(":"); return "202703" + pad(day) + "T" + p[0] + p[1] + "00"; };
        out.push("BEGIN:VEVENT", "UID:" + s.id + "@coulisse.example", "DTSTAMP:20261105T090000Z", "DTSTART:" + f(t[0]), "DTEND:" + f(t[1]), "SUMMARY:" + s.title.replace(/[,;]/g, " "), "LOCATION:" + s.room + " – Halle Tony-Garnier (fictive)", "END:VEVENT");
      });
      out.push("END:VCALENDAR");
      var blob = new Blob([out.join("\r\n")], { type: "text/calendar" }), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "mon-programme-coulisse.ics"; document.body.appendChild(a); a.click(); document.body.removeChild(a); return;
    }
    var chip = ev.target.closest && ev.target.closest(".co-chip");
    if (chip) { ev.preventDefault(); st[chip.parentNode.getAttribute("data-g")] = chip.getAttribute("data-v"); history.replaceState(null, "", chip.getAttribute("href")); apply(); return; }
    var rs = ev.target.closest && ev.target.closest("[data-reset]");
    if (rs) { ev.preventDefault(); st = { day: "all", salle: "all", th: "all" }; history.replaceState(null, "", "#jour-all"); apply(); }
  });
  var h = /^#(jour|salle|theme)-(\w+)$/.exec(location.hash);
  if (h) st[{ jour: "day", salle: "salle", theme: "th" }[h[1]]] = h[2];
  apply(); render();
})();

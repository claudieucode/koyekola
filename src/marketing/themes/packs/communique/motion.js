/* Communiqué : archives filtrables, copie de texte et de codes, impression, compte à rebours d'embargo, date du jour. Aucune dépendance ; inactif hors du thème Communiqué. */
(function () {
  var B = document.body;
  if (!B || B.getAttribute("data-kw-pack") !== "communique") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var one = function (s, e) { return (e || document).querySelector(s); };
  var prevent = function (e) { if (e && e.preventDefault) e.preventDefault(); };

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === " " && t && t.tagName === "A" && t.getAttribute("role") === "button") { e.preventDefault(); t.click(); }
  });

  // ----- date du jour dans le bandeau -----
  var td = one("[data-cq-today]");
  if (td) { try { td.textContent = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }); } catch (x) { /* la date écrite dans la page reste affichée */ } }

  // ----- copie (texte d'un bloc ou code) avec confirmation sur le bouton -----
  var copy = function (txt, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () { fb(txt, done); }); return; }
    fb(txt, done);
  };
  var fb = function (txt, done) {
    var t = document.createElement("textarea"); t.value = txt; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x) { /* rien */ }
    document.body.removeChild(t);
  };
  var flash = function (a, msg) {
    var old = a.innerHTML; a.classList.add("is-ok"); a.textContent = msg;
    setTimeout(function () { a.classList.remove("is-ok"); a.innerHTML = old; }, 1700);
  };
  all("[data-cq-copy]").forEach(function (a) { a.addEventListener("click", function (e) { prevent(e); copy(a.getAttribute("data-cq-copy"), function () { flash(a, "Copié"); }); }); });
  all("[data-cq-copytext]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e);
      var src = one(a.getAttribute("data-cq-copytext")); if (!src) return;
      var text = (src.innerText || src.textContent || "").replace(/\n{3,}/g, "\n\n").trim();
      copy(text, function () { flash(a, "Texte copié"); });
    });
  });
  all("[data-cq-print]").forEach(function (a) { a.addEventListener("click", function (e) { prevent(e); window.print(); }); });

  // ----- compte à rebours d'embargo -----
  var cd = one("[data-cq-countdown]");
  if (cd) {
    var end = new Date(cd.getAttribute("data-cq-countdown")).getTime(), txt = one("[data-cq-cd-text]");
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    var tick = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      var set = function (k, v) { var el = one("[data-" + k + "]", cd); if (el) el.textContent = v; };
      set("d", Math.floor(left / 86400)); set("h", pad(Math.floor(left % 86400 / 3600))); set("m", pad(Math.floor(left % 3600 / 60))); set("s", pad(left % 60));
      if (left === 0 && txt) txt.textContent = "L'embargo est levé : le communiqué est en ligne.";
      return left;
    };
    if (tick() > 0 && !RM) { var iv = setInterval(function () { if (tick() === 0) clearInterval(iv); }, 1000); }
  }

  // ----- archives : année, thème, mot -----
  var list = one("[data-cq-list]");
  if (list) {
    var items = all(".cq-item", list), st = { y: "tout", t: "tout", q: "" }, cnt = one("[data-cq-count]"), empty = one("[data-cq-empty]");
    var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var n = 0;
      items.forEach(function (it) {
        var ok = (st.y === "tout" || it.getAttribute("data-year") === st.y) && (st.t === "tout" || it.getAttribute("data-theme") === st.t) && (!st.q || norm(it.getAttribute("data-hay") || "").indexOf(st.q) > -1);
        it.classList.toggle("cq-hid", !ok); if (ok) n++;
      });
      if (cnt) cnt.textContent = n === 0 ? "Aucun communiqué" : n === 1 ? "1 communiqué" : n + " communiqués";
      if (empty) empty.classList.toggle("cq-hid", n !== 0);
    };
    var slot = one("[data-cq-search]");
    if (slot) {
      var inp = document.createElement("input");
      inp.type = "search"; inp.placeholder = "Mot, référence (CP-2026-31)…"; inp.setAttribute("aria-label", "Rechercher dans les communiqués");
      inp.addEventListener("input", function () { st.q = norm(inp.value.trim()); apply(); });
      slot.appendChild(inp);
    }
    var bind = function (attr, key) {
      all("[" + attr + "]").forEach(function (a) {
        a.addEventListener("click", function (e) {
          prevent(e); st[key] = a.getAttribute(attr);
          all("[" + attr + "]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
          apply();
        });
      });
    };
    bind("data-cq-year", "y"); bind("data-cq-theme", "t");
    var rs = one("[data-cq-reset]");
    if (rs) rs.addEventListener("click", function (e) {
      prevent(e); st = { y: "tout", t: "tout", q: "" };
      all("[data-cq-year],[data-cq-theme]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-cq-year") === "tout" || x.getAttribute("data-cq-theme") === "tout"); });
      var i2 = slot && one("input", slot); if (i2) i2.value = ""; apply();
    });
  }
})();

/* Ricochet : vague d'encre au toucher, copie et partage d'adresse, compte à rebours réel, filtre des liens. Aucune dépendance ; inactif hors du thème Ricochet. */
(function () {
  var B = document.body;
  if (!B || B.getAttribute("data-kw-pack") !== "ricochet") return;
  var RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var all = function (s, e) { return [].slice.call((e || document).querySelectorAll(s)); };
  var one = function (s, e) { return (e || document).querySelector(s); };
  var prevent = function (e) { if (e && e.preventDefault) e.preventDefault(); };
  if (!RM && B.getAttribute("data-pk-motion") !== "off" && B.getAttribute("data-pk-motion") !== "calm") B.classList.add("rc-js");

  document.addEventListener("keydown", function (e) {
    var t = e.target;
    if (e.key === " " && t && t.tagName === "A" && t.getAttribute("role") === "button") { e.preventDefault(); t.click(); }
  });

  // ----- vague d'encre à l'endroit du toucher -----
  if (!RM) {
    document.addEventListener("pointerdown", function (e) {
      var host = e.target.closest && e.target.closest(".rc-link, .rc-btn, .rc-chip");
      if (!host) return;
      var r = host.getBoundingClientRect(), s = document.createElement("span");
      s.className = "rc-ink"; s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
      host.appendChild(s); setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 750);
    }, { passive: true });
  }

  // ----- copie d'adresse -----
  var copyText = function (txt, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(txt).then(done, function () { fallback(txt, done); }); return; }
    fallback(txt, done);
  };
  var fallback = function (txt, done) {
    var t = document.createElement("textarea"); t.value = txt; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (x) { /* rien à faire */ }
    document.body.removeChild(t);
  };
  all("[data-rc-copy]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e);
      copyText(a.getAttribute("data-rc-copy"), function () {
        a.classList.add("is-ok"); var old = a.getAttribute("aria-label"); a.setAttribute("aria-label", "Adresse copiée");
        setTimeout(function () { a.classList.remove("is-ok"); a.setAttribute("aria-label", old); }, 1600);
      });
    });
  });

  // ----- partage de la page -----
  all("[data-rc-share]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      prevent(e);
      var data = { title: document.title, url: location.href.split("#")[0] };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      copyText(data.url, function () { var t = a.textContent; a.textContent = "Adresse copiée"; setTimeout(function () { a.textContent = t; }, 1600); });
    });
  });

  // ----- compte à rebours réel -----
  var cd = one("[data-rc-countdown]");
  if (cd) {
    var end = new Date(cd.getAttribute("data-rc-countdown")).getTime(), txt = one("[data-rc-cd-text]");
    var pad = function (n) { return n < 10 ? "0" + n : String(n); };
    var tick = function () {
      var left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      var set = function (k, v) { var el = one("[data-" + k + "]", cd); if (el) el.textContent = v; };
      set("d", Math.floor(left / 86400)); set("h", pad(Math.floor(left % 86400 / 3600))); set("m", pad(Math.floor(left % 3600 / 60))); set("s", pad(left % 60));
      if (left === 0 && txt) txt.textContent = "La précommande est terminée : merci à toutes et à tous.";
      return left;
    };
    if (tick() > 0) { var iv = setInterval(function () { if (tick() === 0) clearInterval(iv); }, 1000); }
  }

  // ----- liste complète : rubriques et recherche par mot -----
  var list = one("[data-rc-list]");
  if (list) {
    var rows = all(".rc-row", list), st = { f: "tout", q: "" }, cnt = one("[data-rc-count]"), empty = one("[data-rc-empty]");
    var norm = function (s) { return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    var apply = function () {
      var n = 0;
      rows.forEach(function (r) {
        var ok = (st.f === "tout" || r.getAttribute("data-cat") === st.f) && (!st.q || norm(r.getAttribute("data-hay") || "").indexOf(st.q) > -1);
        r.classList.toggle("rc-hid", !ok); if (ok) n++;
      });
      if (cnt) cnt.textContent = n === 0 ? "Aucun lien" : n === 1 ? "1 lien" : n + " liens";
      if (empty) empty.classList.toggle("rc-hid", n !== 0);
    };
    var slot = one("[data-rc-search]");
    if (slot) {
      var inp = document.createElement("input");
      inp.type = "search"; inp.placeholder = "Chercher un lien…"; inp.setAttribute("aria-label", "Chercher un lien");
      inp.addEventListener("input", function () { st.q = norm(inp.value.trim()); apply(); });
      slot.appendChild(inp);
    }
    all("[data-rc-f]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        prevent(e); st.f = a.getAttribute("data-rc-f");
        all("[data-rc-f]").forEach(function (x) { x.classList.toggle("is-on", x === a); });
        apply();
      });
    });
    var rs = one("[data-rc-reset]");
    if (rs) rs.addEventListener("click", function (e) {
      prevent(e); st = { f: "tout", q: "" };
      all("[data-rc-f]").forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-rc-f") === "tout"); });
      var i2 = slot && one("input", slot); if (i2) i2.value = ""; apply();
    });
  }
})();

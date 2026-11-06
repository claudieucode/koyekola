// Obturateur — visionneuse de planche (clavier, compteur, panneau de réglages), filtres par série et photographe, recherche instantanée. Sans dépendance ; inactif hors du thème Obturateur.
(function () {
  if (document.body.getAttribute("data-kw-pack") !== "obturateur") return;
  var $ = function (s, r) { return (r || document).querySelector(s); }, $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var burger = $(".ob-burger");
  if (burger) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") burger.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!burger.contains(e.target)) burger.removeAttribute("open"); });
  }

  // Filtres : série et photographe se combinent ; le compteur et l'état vide suivent
  var box = $("[data-filter]");
  if (box) {
    var state = {}, count = $("[data-count]", box), none = $("[data-none]", box);
    var items = function () { return $$("[data-frames] > li"); };
    var apply = function () {
      var shown = 0;
      items().forEach(function (li) {
        var ok = Object.keys(state).every(function (k) { return !state[k] || li.getAttribute("data-" + k) === state[k]; });
        li.classList.toggle("is-hidden", !ok); if (ok) shown++;
      });
      if (count) count.innerHTML = "<b>" + shown + "</b> " + (shown > 1 ? "vues" : "vue");
      if (none) none.hidden = shown !== 0;
    };
    $$("[data-chips]", box).forEach(function (ul) {
      var key = ul.getAttribute("data-chips");
      ul.addEventListener("click", function (e) {
        var a = e.target.closest("a"); if (!a) return; e.preventDefault();
        $$("a", ul).forEach(function (x) { x.classList.toggle("is-on", x === a); x.setAttribute("aria-pressed", x === a ? "true" : "false"); });
        state[key] = a.getAttribute("data-v") === "tout" ? "" : a.getAttribute("data-v"); apply();
      });
    });
    var reset = $("[data-reset]", box);
    if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); state = {}; $$("[data-chips] a", box).forEach(function (x) { x.classList.toggle("is-on", x.getAttribute("data-v") === "tout"); }); apply(); });
  }

  // Recherche instantanée
  var sr = $("[data-search]");
  if (sr) {
    var list = $$("[data-results] > li", sr), nn = $("[data-none]", sr), hint = $("[data-hint]", sr);
    var wrap = document.createElement("div"), input = document.createElement("input");
    wrap.className = "ob-sf"; input.type = "search"; input.placeholder = "brume, Marseille, Léa, Leica…"; input.setAttribute("aria-label", "Rechercher une vue"); input.autocomplete = "off";
    wrap.appendChild(input); sr.insertBefore(wrap, sr.firstChild);
    var run = function () {
      var q = norm(input.value).trim(), words = q.split(/\s+/).filter(Boolean), shown = 0;
      list.forEach(function (li) { var ok = !q || words.every(function (w) { return li.getAttribute("data-q").indexOf(w) >= 0; }); li.classList.toggle("is-hidden", !ok); if (ok) shown++; });
      nn.hidden = shown !== 0;
      if (hint) hint.textContent = !q ? "Saisissez quelques lettres pour filtrer les " + list.length + " vues." : shown + (shown > 1 ? " vues trouvées" : " vue trouvée") + " pour « " + input.value.trim() + " ».";
    };
    input.addEventListener("input", run);
    var qs = new URLSearchParams(location.search).get("q"); if (qs) { input.value = qs; run(); }
  }

  // Visionneuse : ouvre la vue cliquée, flèches gauche / droite, Échap, focus conservé
  var links = function () { return $$("[data-photo]").filter(function (a) { return !a.closest(".is-hidden"); }); };
  if ($("[data-photo]")) {
    var lb = document.createElement("div"); lb.className = "ob-lb"; lb.hidden = true; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Visionneuse");
    lb.innerHTML = '<div class="ob-lb-stage"></div><div class="ob-lb-side"><p class="ob-lb-count"></p><h2></h2><p class="ob-lb-meta"></p><dl></dl></div>' +
      '<button type="button" class="ob-lb-btn ob-lb-x" aria-label="Fermer">×</button><button type="button" class="ob-lb-btn ob-lb-p" aria-label="Vue précédente">‹</button><button type="button" class="ob-lb-btn ob-lb-n" aria-label="Vue suivante">›</button>';
    document.body.appendChild(lb);
    var cur = -1, last = null, set = [];
    var rows = ["Boîtier", "Objectif", "Focale", "Ouverture", "Vitesse", "ISO", "Support"];
    var show = function (i) {
      cur = (i + set.length) % set.length; var a = set[cur], info = (a.getAttribute("data-info") || "").split("|");
      var svg = $("svg", a).cloneNode(true); svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      var vb = (svg.getAttribute("viewBox") || "0 0 300 200").split(" "); svg.style.setProperty("--lbr", vb[2] + "/" + vb[3]);
      var st = $(".ob-lb-stage", lb); st.innerHTML = ""; st.appendChild(svg);
      $(".ob-lb-count", lb).textContent = "Vue " + (cur + 1) + " / " + set.length;
      $("h2", lb).textContent = $(".ob-fr-cap b", a).textContent;
      $(".ob-lb-meta", lb).textContent = info[2] + " · " + info[0] + " · " + info[1];
      var cam = (info[3] || "").split(" · "), vals = [cam[0], cam[1], info[4], info[5], info[6] + " s", "ISO " + info[7], info[8]];
      $("dl", lb).innerHTML = rows.map(function (r, k) { return "<dt>" + r + "</dt><dd></dd>"; }).join("");
      $$("dd", lb).forEach(function (d, k) { d.textContent = vals[k] || ""; });
    };
    var open = function (a) { set = links(); last = a; document.body.classList.add("ob-lock"); lb.hidden = false; show(set.indexOf(a)); $(".ob-lb-x", lb).focus(); };
    var close = function () { lb.hidden = true; document.body.classList.remove("ob-lock"); if (last) last.focus(); };
    document.addEventListener("click", function (e) { var a = e.target.closest("[data-photo]"); if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); open(a); });
    $(".ob-lb-x", lb).addEventListener("click", close);
    $(".ob-lb-p", lb).addEventListener("click", function () { show(cur - 1); });
    $(".ob-lb-n", lb).addEventListener("click", function () { show(cur + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("ob-lb-stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
      else if (e.key === "Tab") { var f = $$("button", lb), first = f[0], end = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); end.focus(); } else if (!e.shiftKey && document.activeElement === end) { e.preventDefault(); first.focus(); } }
    });
  }
  if (reduce) document.body.setAttribute("data-ob-calm", "1");
})();

// KOLAKISA CMS → Apparence → Thèmes : confirmation des actions, anti double envoi, recherche instantanée, notifications fermables, lecture du fichier de paquet.
// Tout fonctionne aussi sans ce script (formulaires et recherche côté serveur) ; il ne fait qu'améliorer l'usage.
(function () {
  "use strict";
  var root = document.querySelector("[data-th-root]");
  if (!root) return;
  var store = function (fn) { try { return fn(window.sessionStorage); } catch (e) { return null; } };
  var status = root.querySelector("[data-th-status]");
  var say = function (t) { if (status) status.textContent = t; };

  // Aide
  root.querySelectorAll("[data-th-toggle]").forEach(function (b) {
    b.addEventListener("click", function () { var p = document.getElementById(b.getAttribute("aria-controls")); var open = b.getAttribute("aria-expanded") === "true"; b.setAttribute("aria-expanded", String(!open)); if (p) p.hidden = open; });
  });

  // Notifications fermables (mémorisées pour la session)
  root.querySelectorAll("[data-th-notice]").forEach(function (n) {
    var k = n.getAttribute("data-th-notice");
    if (store(function (s) { return s.getItem(k); }) === "1") { n.hidden = true; return; }
    var x = n.querySelector("[data-th-dismiss]");
    if (x) x.addEventListener("click", function () { n.hidden = true; store(function (s) { s.setItem(k, "1"); }); });
  });

  // Actions (installer, utiliser, revenir, supprimer) : UNE SEULE écoute déléguée sur la racine, valable pour les cartes d'origine comme pour celles
  // rechargées par les filtres. (Avant : deux écouteurs sur chaque formulaire de carte ; le second voyait le drapeau « occupé » posé par le premier et annulait
  // l'envoi : le bouton restait sur « Installation… » sans que rien ne parte.) L'envoi est un vrai POST (fetch) avec états terminaux garantis :
  // redirection du serveur → on y va ; erreur HTTP, réseau coupé ou délai dépassé → le bouton est rendu et un message d'erreur reste affiché.
  var TIMEOUT_MS = Number(window.__thTimeoutMs) || 45000;   // (window.__thTimeoutMs : réglage réservé aux tests)
  var alertBox = null;
  var showError = function (text) {
    if (!alertBox) { alertBox = document.createElement("div"); alertBox.className = "mk-th-notice mk-th-notice--warn"; alertBox.setAttribute("role", "alert"); var head = root.querySelector(".mk-th-notices") || root.firstElementChild; head.parentNode.insertBefore(alertBox, head.nextSibling); }
    alertBox.textContent = text; alertBox.hidden = false; say(text);
  };
  var setBusy = function (f, b, on) {
    if (on) { f.setAttribute("data-busy-now", "1"); if (b) { if (!b.hasAttribute("data-label")) b.setAttribute("data-label", b.textContent); b.setAttribute("aria-busy", "true"); b.textContent = b.getAttribute("data-busy") || "En cours…"; b.disabled = true; } say("Opération en cours…"); }
    else { f.removeAttribute("data-busy-now"); if (b) { b.removeAttribute("aria-busy"); if (b.hasAttribute("data-label")) b.textContent = b.getAttribute("data-label"); b.disabled = false; } }
  };
  var send = function (f, b) {
    var ctl = typeof AbortController === "function" ? new AbortController() : null, timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT_MS);
    setBusy(f, b, true); if (alertBox) alertBox.hidden = true;
    fetch(f.action, { method: "POST", credentials: "same-origin", headers: { "X-Requested-With": "kolakisa-fetch", "Accept": "application/json" }, body: new URLSearchParams(new FormData(f)), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); if (!/json/.test(r.headers.get("content-type") || "")) throw new Error("session"); return r.json(); })
      .then(function (j) { clearTimeout(timer); if (j && j.redirect) window.location.assign(j.redirect); else window.location.reload(); })
      .catch(function (err) {
        clearTimeout(timer); setBusy(f, b, false);
        showError(err && err.name === "AbortError" ? "Le serveur met trop de temps à répondre : l'opération n'a pas été confirmée. Vérifiez l'état du thème dans la bibliothèque, puis réessayez."
          : err && err.message === "session" ? "Votre session a expiré : reconnectez-vous, puis réessayez (rien n'a été modifié)."
          : "L'opération a échoué (" + (err && /^http (\d+)/.test(err.message) ? "erreur " + err.message.slice(5) : "connexion interrompue") + "). Rien n'a été modifié ; vous pouvez réessayer.");
      });
  };
  root.addEventListener("submit", function (e) {
    var f = e.target && e.target.closest ? e.target.closest("form[data-th-form]") : null;
    if (!f) return;
    e.preventDefault();
    var b = e.submitter || f.querySelector("button[type=submit]");
    var msg = b && b.getAttribute("data-confirm");
    if (msg && !window.confirm(msg)) return;
    if (f.getAttribute("data-busy-now") === "1") return;          // second clic pendant l'opération : ignoré, la première continue
    send(f, b);
  });
  // retour arrière / cache de navigation : jamais de bouton resté « en cours »
  window.addEventListener("pageshow", function (e) { if (e.persisted) root.querySelectorAll("form[data-th-form][data-busy-now]").forEach(function (f) { setBusy(f, f.querySelector("button[type=submit]"), false); }); });

  // Recherche instantanée dans la grille (le formulaire fonctionne aussi côté serveur)
  var input = root.querySelector("[data-th-search]"), cards = root.querySelectorAll("[data-th-card]");
  if (input && cards.length) {
    var filter = function () {
      var q = input.value.trim().toLowerCase(), n = 0;
      cards.forEach(function (c) { var ok = !q || c.getAttribute("data-th-name").indexOf(q) !== -1; c.hidden = !ok; if (ok) n++; });
      var add = root.querySelector(".mk-th-add"); if (add) add.hidden = Boolean(q);
      say(q ? (n ? n + " thème" + (n > 1 ? "s" : "") + " trouvé" + (n > 1 ? "s" : "") + "." : "Aucun thème ne correspond à cette recherche.") : "");
    };
    input.addEventListener("input", filter);
    if (input.value) filter();
  }

  // Fichier de paquet → zone de texte (lecture locale, bornée ; la validation reste celle du serveur)
  var file = root.querySelector("[data-th-file]"), area = root.querySelector("#th-pkg");
  if (file && area) file.addEventListener("change", function () {
    var f = file.files && file.files[0]; if (!f) return;
    if (f.size > 64 * 1024) { say("Ce fichier dépasse 64 Ko : il ne peut pas être un paquet de thème."); file.value = ""; return; }
    var r = new FileReader();
    r.onload = function () { area.value = String(r.result || ""); say("Fichier « " + f.name + " » chargé : vérifiez le contenu puis installez."); };
    r.onerror = function () { say("Le fichier n'a pas pu être lu."); };
    r.readAsText(f);
  });
})();

// ---- Bibliothèque : filtres sans rechargement (le même écran existe côté serveur), changement d'appareil de l'aperçu complet ----
(function () {
  "use strict";
  var root = document.querySelector("[data-tg-url]");
  if (root) {
    var form = root.querySelector("[data-tg-form]"), box = root.querySelector("[data-tg-results]"), cat = form.querySelector("[data-tg-cat]"), timer = null, seq = 0;
    var load = function (pushUrl) {
      var qs = new URLSearchParams(new FormData(form)); qs.delete("fragment");
      var clean = new URLSearchParams(); qs.forEach(function (v, k) { if (v !== "") clean.set(k, v); });
      var site = root.getAttribute("data-tg-site"); if (site) clean.set("site", site);
      var page = pushUrl && pushUrl.page; if (page) clean.set("page", page);
      var frag = new URLSearchParams(clean); frag.set("fragment", "1");
      var mine = ++seq; box.setAttribute("aria-busy", "true");
      fetch(root.getAttribute("data-tg-url") + "?" + frag.toString(), { credentials: "same-origin" })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then(function (html) { if (mine !== seq) return; box.innerHTML = html; box.setAttribute("aria-busy", "false"); try { window.history.replaceState(null, "", root.getAttribute("data-tg-url") + (clean.toString() ? "?" + clean.toString() : "")); } catch (e) { /* adresse inchangée */ } wire(); })
        .catch(function () { box.setAttribute("aria-busy", "false"); form.submit(); });
    };
    var setCat = function (key) {
      cat.value = key || "";
      root.querySelectorAll("[data-tg-catlink]").forEach(function (a) { var on = a.getAttribute("data-tg-catlink") === (key || ""); a.classList.toggle("is-active", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); load(); });
    var q = form.querySelector("[data-tg-search]");
    if (q) q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(load, 250); });
    form.querySelectorAll("[data-tg-auto]").forEach(function (s) { s.addEventListener("change", function () { load(); }); });
    root.querySelectorAll("[data-tg-catlink]").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); setCat(a.getAttribute("data-tg-catlink")); load(); }); });
    var wire = function () {
      box.querySelectorAll(".mk-tg-pager a").forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var u = new URL(a.href, window.location.href); load({ page: u.searchParams.get("page") }); window.scrollTo({ top: root.querySelector(".mk-tg-cats").offsetTop - 12, behavior: "smooth" }); }); });
    };
    wire();
  }
  // Fiche d'un thème : le cadre de rendu en direct (1280 px de large virtuels) est mis à l'échelle de son conteneur ; la capture reste affichée tant que le rendu n'est pas prêt
  document.querySelectorAll("[data-td-live]").forEach(function (live) {
    var frame = live.querySelector("[data-td-frame]"), cap = document.querySelector("[data-td-caption]"), vw = Number(live.getAttribute("data-td-vw")) || 1280, ready = false;
    var scale = function () { live.style.setProperty("--td-s", String(Math.max(0.05, live.clientWidth / vw))); if (frame) frame.style.height = Math.round(live.clientHeight / Math.max(0.05, live.clientWidth / vw)) + "px"; };
    scale();
    if (typeof ResizeObserver === "function") new ResizeObserver(scale).observe(live); else window.addEventListener("resize", scale);
    if (!frame) return;
    frame.addEventListener("load", function () { ready = true; live.classList.add("is-live"); });
    setTimeout(function () { if (!ready && cap) cap.textContent = "Le rendu en direct n'a pas pu se charger : voici l'image de présentation du thème (ce n'est pas un rendu interactif). Utilisez « Prévisualiser » pour réessayer."; }, 15000);
  });
  // Aperçu complet : largeur du cadre selon l'appareil
  var stage = document.querySelector("[data-tp-stage]");
  if (stage) {
    var frame = stage.querySelector("[data-tp-frame]");
    document.querySelectorAll("[data-tp-width]").forEach(function (b) {
      b.addEventListener("click", function () {
        var w = b.getAttribute("data-tp-width");
        frame.style.boxSizing = /px$/.test(w) ? "content-box" : "border-box";   // la largeur de l'appareil est celle du rendu : la bordure du cadre ne la rogne pas (820 px choisis = 820 px de viewport)
        frame.style.width = w;
        document.querySelectorAll("[data-tp-width]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      });
    });
  }
})();

// KOLAKISA CMS → Apparence → Thèmes : confirmation des actions, anti double envoi, filtres, notifications fermables, lecture du fichier de paquet.
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
    var BASE = root.getAttribute("data-tg-url"), SITE = root.getAttribute("data-tg-site");
    var form = root.querySelector("[data-tg-form]"), box = root.querySelector("[data-tg-results]"), cat = form.querySelector("[data-tg-cat]"), bar = root.querySelector("[data-tg-progress]");
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    form.classList.add("is-live");

    // ---- Filtres sans rechargement : une requête à la fois (la précédente est ANNULÉE), réponses récentes gardées en mémoire, erreur affichée avec « Réessayer » ----
    var seq = 0, ctl = null, timer = null, slow = null, cache = new Map(), TTL = 60000, errBox = null, last = null;
    var query = function (page) {
      var qs = new URLSearchParams(new FormData(form)), out = new URLSearchParams();
      qs.forEach(function (v, k) { if (v !== "" && !(k === "tri" && v === "relevance")) out.set(k, v); });
      if (SITE) out.set("site", SITE);
      if (page && Number(page) > 1) out.set("page", page);
      return out;
    };
    var setBusy = function (on) {
      box.setAttribute("aria-busy", on ? "true" : "false");
      clearTimeout(slow);
      if (on) slow = setTimeout(function () { bar.hidden = false; }, 150); else bar.hidden = true;   // la barre n'apparaît que si la réponse tarde (> 150 ms) : pas de clignotement
    };
    var showError = function (retry) {
      if (!errBox) {
        errBox = document.createElement("div"); errBox.className = "mk-th-notice mk-th-notice--warn mk-tg-error"; errBox.setAttribute("role", "alert");
        errBox.innerHTML = '<p>Les thèmes n\'ont pas pu être chargés (connexion interrompue ou serveur indisponible). Vos filtres sont conservés.</p><button type="button" class="btn btn-outline btn-sm">Réessayer</button>';
        box.parentNode.insertBefore(errBox, box);
        errBox.querySelector("button").addEventListener("click", function () { if (last) load(last.page, true); });
      }
      errBox.hidden = false;
    };
    var applyMeta = function (m) {
      var set = function (k, n) { root.querySelectorAll('[data-tg-n="' + k + '"]').forEach(function (e) { e.textContent = String(n); }); };
      set("all", m.all); set("state:all", m.state.all); set("state:installed", m.state.installed); set("state:available", m.state.available);
      Object.keys(m.cats).forEach(function (k) {
        set("cat:" + k, m.cats[k]);
        var a = root.querySelector('[data-tg-catlink="' + k + '"]'); if (!a) return;
        var off = m.cats[k] === 0 && !a.classList.contains("is-active");
        a.classList.toggle("is-empty", off);
        if (off) { a.setAttribute("aria-disabled", "true"); a.setAttribute("tabindex", "-1"); } else { a.removeAttribute("aria-disabled"); a.removeAttribute("tabindex"); }
      });
      form.querySelectorAll("[data-tg-style]").forEach(function (o) {
        var k = o.getAttribute("data-tg-style"), n = m.styles[k] || 0;
        if (!o.hasAttribute("data-label")) o.setAttribute("data-label", o.textContent.replace(/\s*\(\d+\)$/, ""));
        o.textContent = o.getAttribute("data-label") + " (" + n + ")"; o.disabled = n === 0 && !o.selected;
      });
    };
    var apply = function (html, qs, mine) {
      if (mine !== seq) return;
      box.innerHTML = html;
      try { var meta = JSON.parse(box.querySelector("[data-tg-meta]").textContent); applyMeta(meta); } catch (e) { /* compteurs inchangés */ }
      if (errBox) errBox.hidden = true;
      setBusy(false);
      try { window.history.replaceState(null, "", BASE + (qs.toString() ? "?" + qs.toString() : "")); } catch (e) { /* adresse inchangée */ }
    };
    function load(page, force) {
      var qs = query(page), key = qs.toString(), mine = ++seq;
      last = { page: page };
      if (ctl) ctl.abort();                                                  // la requête précédente n'a plus d'intérêt : on la libère
      var hit = !force && cache.get(key);
      if (hit && Date.now() - hit.at < TTL) { ctl = null; apply(hit.html, qs, mine); return; }
      var frag = new URLSearchParams(qs); frag.set("fragment", "1");
      ctl = typeof AbortController === "function" ? new AbortController() : null;
      setBusy(true);
      fetch(BASE + "?" + frag.toString(), { credentials: "same-origin", signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.text(); })
        .then(function (html) {
          if (cache.size > 40) cache.delete(cache.keys().next().value);
          cache.set(key, { at: Date.now(), html: html }); apply(html, qs, mine);
        })
        .catch(function (err) { if ((err && err.name === "AbortError") || mine !== seq) return; setBusy(false); showError(); });
    }
    var setCat = function (key) {
      cat.value = key || "";
      root.querySelectorAll("[data-tg-catlink]").forEach(function (a) { var on = a.getAttribute("data-tg-catlink") === (key || ""); a.classList.toggle("is-active", on); if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
    };
    var reset = function () {
      form.querySelector("[data-tg-search]").value = ""; form.querySelector("[name=style]").value = ""; form.querySelector("[name=tri]").value = "relevance";
      var all = form.querySelector('[name=etat][value=""]'); if (all) all.checked = true;
      setCat(""); load();
    };
    form.addEventListener("submit", function (e) { e.preventDefault(); clearTimeout(timer); load(); });
    var q = form.querySelector("[data-tg-search]"), lastQ = q ? q.value : "";
    if (q) q.addEventListener("input", function () { clearTimeout(timer); if (q.value === lastQ) return; lastQ = q.value; timer = setTimeout(function () { load(); }, 120); });
    form.querySelectorAll("[data-tg-auto]").forEach(function (s) { s.addEventListener("change", function () { load(); }); });
    // Retrait d'UN filtre actif (pastille) : les autres sont conservés
    var clear = function (what) {
      if (what === "q") { var qi = form.querySelector("[data-tg-search]"); qi.value = ""; lastQ = ""; }
      else if (what === "style") form.querySelector("[name=style]").value = "";
      else if (what === "etat") { var all = form.querySelector('[name=etat][value=""]'); if (all) all.checked = true; }
      else if (what === "categorie") setCat("");
      load();
    };
    // Miniature qui ne se charge pas : état honnête (jamais une fausse capture), dimensions conservées
    root.addEventListener("error", function (e) {
      var img = e.target; if (!img || img.tagName !== "IMG" || !/mk-tg-(shot|active-shot)/.test(img.className)) return;
      var ph = document.createElement("span"); ph.className = img.className + " mk-tg-missing"; ph.setAttribute("role", "img"); ph.setAttribute("aria-label", "Aperçu indisponible"); ph.textContent = "Aperçu indisponible";
      img.replaceWith(ph);
    }, true);
    root.addEventListener("click", function (e) {
      var rm = e.target.closest ? e.target.closest("[data-tg-remove]") : null; if (rm) { e.preventDefault(); clear(rm.getAttribute("data-tg-remove")); return; }
      var a = e.target.closest ? e.target.closest("a") : null; if (!a || !root.contains(a)) return;
      if (a.hasAttribute("data-tg-catlink")) { e.preventDefault(); if (a.getAttribute("aria-disabled") === "true") return; setCat(a.getAttribute("data-tg-catlink")); load(); return; }
      if (a.hasAttribute("data-tg-reset")) { e.preventDefault(); reset(); return; }
      if (a.closest(".mk-tg-pager") && /[?&]page=/.test(a.href)) {
        e.preventDefault(); load(new URL(a.href, window.location.href).searchParams.get("page"));
        var top = root.querySelector(".mk-tg-cats"); if (top && top.scrollIntoView) top.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      }
    });

    // ---- Aperçu rapide : site de démonstration isolé dans un cadre créé à l'ouverture et DÉTRUIT à la fermeture ----
    var dlg = root.querySelector("[data-tq]");
    if (dlg && typeof dlg.showModal === "function") {
      var $ = function (s) { return dlg.querySelector(s); };
      var view = $("[data-tq-view]"), poster = $("[data-tq-poster]"), skel = $("[data-tq-skel]"), stateBox = $("[data-tq-state]"), msg = $("[data-tq-msg]"), retry = $("[data-tq-retry]"), pagesNav = $("[data-tq-pages]"), actions = $("[data-tq-actions]");
      var list = [], idx = 0, pageKey = "", token = 0, frame = null, opener = null, wait = null;
      var qsite = SITE ? "?site=" + encodeURIComponent(SITE) : "";
      var info = function (a) { var pages = []; try { pages = JSON.parse(a.getAttribute("data-th-pages") || "[]"); } catch (e) { pages = []; } return { key: a.closest("[data-th-card]").getAttribute("data-th-key"), name: a.getAttribute("data-th-label"), cat: a.getAttribute("data-th-cat"), poster: a.getAttribute("data-th-poster"), pages: pages, card: a.closest("[data-th-card]") }; };
      var destroy = function () {                                          // arrête le chargement en cours et libère la page de démonstration
        token++; clearTimeout(wait);
        if (frame) { try { frame.src = "about:blank"; } catch (e) { /* déjà détaché */ } frame.remove(); frame = null; }
      };
      var say = function (text, canRetry) { msg.textContent = text || ""; retry.hidden = !canRetry; stateBox.hidden = !text; };
      var mount = function () {
        destroy();
        var t = token, th = list[idx];
        view.classList.remove("is-ready"); skel.hidden = false;
        if (th.poster && pageKey === th.pages[0][0]) { poster.src = th.poster; poster.hidden = false; } else { poster.hidden = true; poster.removeAttribute("src"); }
        say("Chargement du rendu…", false);
        var fr = document.createElement("iframe");
        fr.className = "tq-frame"; fr.setAttribute("sandbox", "allow-scripts allow-forms"); fr.setAttribute("referrerpolicy", "no-referrer");
        fr.title = "Rendu du thème " + th.name + " : page « " + ((th.pages.filter(function (p) { return p[0] === pageKey; })[0] || [0, ""])[1]) + " » du site de démonstration";
        fr.addEventListener("load", function () {
          if (t !== token || fr.getAttribute("src") === "about:blank") return;      // chargement d'un cadre déjà remplacé : ignoré (jamais d'ancien aperçu après le nouveau)
          clearTimeout(wait); view.classList.add("is-ready"); say("", false);
          setTimeout(function () { if (t === token) { skel.hidden = true; poster.hidden = true; poster.removeAttribute("src"); } }, reduced ? 0 : 180);
        });
        wait = setTimeout(function () { if (t === token && !view.classList.contains("is-ready")) say("Le rendu met plus de temps que prévu à s'afficher. Vous pouvez continuer à attendre ou réessayer.", true); }, 12000);
        frame = fr; fr.src = BASE + "/" + th.key + "/demo/" + pageKey + qsite; view.appendChild(fr);
      };
      var tabs = function () {
        var th = list[idx]; pagesNav.textContent = "";
        th.pages.forEach(function (p) {
          var b = document.createElement("button"); b.type = "button"; b.textContent = p[1]; b.setAttribute("data-tq-page", p[0]);
          if (p[0] === pageKey) b.setAttribute("aria-current", "page");
          pagesNav.appendChild(b);
        });
      };
      var fill = function () {
        var th = list[idx];
        $("[data-tq-name]").textContent = th.name; $("[data-tq-cat]").textContent = th.cat;
        $("[data-tq-count]").textContent = (idx + 1) + " / " + list.length;
        $("[data-tq-prev]").disabled = list.length < 2; $("[data-tq-next]").disabled = list.length < 2;
        $("[data-tq-full]").href = BASE + "/" + th.key + "/apercu" + qsite; $("[data-tq-details]").href = BASE + "/" + th.key + "/details" + qsite;
        actions.textContent = "";
        var src = th.card.querySelector("form[data-th-form]");   // la VRAIE action de la carte (installer, utiliser)
        if (src) actions.appendChild(src.cloneNode(true));
      };
      var show = function (i) {
        idx = (i + list.length) % list.length;
        var th = list[idx]; if (!th.pages.some(function (p) { return p[0] === pageKey; })) pageKey = th.pages[0][0];
        fill(); tabs(); mount();
      };
      var collect = function () { var seen = {}; list = []; box.querySelectorAll("[data-th-card] [data-th-preview]").forEach(function (a) { var t = info(a); if (!seen[t.key]) { seen[t.key] = 1; list.push(t); } }); };
      // Intention d'ouvrir (survol ou focus) : UNE requête légère par thème réchauffe la page de démonstration (rendu serveur gardé en mémoire + cache HTTP privé) ; jamais en mode économie de données
      var warmed = {};
      var warm = function (e) {
        var a = e.target.closest ? e.target.closest("[data-th-preview]") : null; if (!a || (navigator.connection && navigator.connection.saveData)) return;
        var t = info(a), first = t.pages[0] && t.pages[0][0]; if (!first || warmed[t.key]) return; warmed[t.key] = 1;
        try { fetch(BASE + "/" + t.key + "/demo/" + first + qsite, { credentials: "same-origin", priority: "low" }).catch(function () { warmed[t.key] = 0; }); } catch (err) { /* sans objet */ }
      };
      root.addEventListener("mouseover", warm); root.addEventListener("focusin", warm);
      root.addEventListener("click", function (e) {
        var a = e.target.closest ? e.target.closest("[data-th-preview]") : null;
        if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;     // clic modifié : le lien normal (nouvel onglet) reste disponible
        e.preventDefault(); opener = a; collect();
        var key = info(a).key; idx = 0; list.forEach(function (t, i) { if (t.key === key) idx = i; });
        pageKey = list[idx].pages[0][0];
        dlg.showModal(); show(idx);
        var h = $("[data-tq-name]"); if (h) h.focus();
      });
      dlg.addEventListener("click", function (e) {
        if (e.target === dlg) { dlg.close(); return; }
        var t = e.target.closest ? e.target.closest("button") : null; if (!t || !dlg.contains(t)) return;
        if (t.hasAttribute("data-tq-close")) dlg.close();
        else if (t.hasAttribute("data-tq-prev")) show(idx - 1);
        else if (t.hasAttribute("data-tq-next")) show(idx + 1);
        else if (t.hasAttribute("data-tq-retry")) mount();
        else if (t.hasAttribute("data-tq-page")) { pageKey = t.getAttribute("data-tq-page"); tabs(); mount(); }
        else if (t.hasAttribute("data-tq-width")) {
          view.style.width = t.getAttribute("data-tq-width");
          dlg.querySelectorAll("[data-tq-width]").forEach(function (o) { o.setAttribute("aria-pressed", o === t ? "true" : "false"); });
        }
      });
      dlg.addEventListener("keydown", function (e) {
        if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.ctrlKey && !e.metaKey && !(e.target.closest && e.target.closest("input, select, textarea"))) { e.preventDefault(); show(idx + (e.key === "ArrowRight" ? 1 : -1)); }
      });
      dlg.addEventListener("close", function () {                          // fermeture (bouton, Échap, arrière-plan) : plus aucun cadre, plus d'image, focus rendu à la carte
        destroy(); poster.removeAttribute("src"); view.classList.remove("is-ready"); actions.textContent = ""; say("", false);
        if (opener && document.contains(opener)) opener.focus(); opener = null;
      });
    }
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

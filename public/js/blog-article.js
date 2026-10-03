/* Article du blog : section active du sommaire, progression de lecture, « Copier le lien », partage natif, newsletter.
   Sans dépendance ; la page reste entièrement lisible et navigable sans ce script (liens d'ancre, formulaire classique). */
(function () {
  "use strict";
  var article = document.querySelector("[data-article]");
  if (!article) return;
  var content = article.querySelector(".article-content");

  // ---------- Progression de lecture (barre + « Lecture : 65 % ») ----------
  var bar = document.querySelector("[data-progress-bar]");
  var texts = document.querySelectorAll("[data-progress-text]");
  var lastPct = -1;
  function progress() {
    var target = content || article;
    var rect = target.getBoundingClientRect();
    var total = rect.height - window.innerHeight * 0.6;
    var read = -rect.top + window.innerHeight * 0.25;
    var pct = total <= 0 ? (rect.top < window.innerHeight ? 100 : 0) : Math.round(Math.min(1, Math.max(0, read / total)) * 100);
    if (pct === lastPct) return;
    lastPct = pct;
    if (bar) bar.style.transform = "scaleX(" + pct / 100 + ")";
    for (var i = 0; i < texts.length; i++) texts[i].textContent = pct + " %";
  }

  // ---------- Section active du sommaire ----------
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-toc-link]"));
  var headings = links.map(function (a) { return document.getElementById(a.getAttribute("data-toc-link")); }).filter(Boolean);
  var current = null;
  function setActive(id) {
    if (id === current) return;
    current = id;
    links.forEach(function (a) {
      var on = a.getAttribute("data-toc-link") === id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  }
  function activeSection() {
    if (!headings.length) return;
    var offset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 72) + 40;
    var id = headings[0].id;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].getBoundingClientRect().top - offset <= 0) id = headings[i].id; else break;
    }
    setActive(id);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () { ticking = false; progress(); activeSection(); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // Clic dans le sommaire : la section devient active tout de suite ; le sommaire mobile se referme
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('.article-toc-list a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    setActive(id);
    var details = a.closest("details");
    if (details) details.open = false;
  });

  // ---------- Copier le lien ----------
  document.querySelectorAll("[data-copy-link]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = btn.getAttribute("data-copy-link");
      var label = btn.querySelector(".share-copy-text");
      var done = function (ok) {
        btn.classList.toggle("is-copied", ok);
        if (label) label.textContent = ok ? "Lien copié !" : "Copie impossible";
        btn.setAttribute("aria-label", ok ? "Lien copié" : "Copie impossible : sélectionnez l'adresse dans la barre du navigateur");
        setTimeout(function () {
          btn.classList.remove("is-copied");
          if (label) label.textContent = "Copier le lien";
          btn.setAttribute("aria-label", "Copier le lien de l'article");
        }, 2500);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(fallbackCopy(url)); });
      } else {
        done(fallbackCopy(url));
      }
    });
  });
  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  // ---------- Partage natif (téléphones) ----------
  if (navigator.share) {
    document.querySelectorAll("[data-native-share]").forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener("click", function () {
        navigator.share({ title: btn.getAttribute("data-title"), url: btn.getAttribute("data-url") }).catch(function () {});
      });
    });
  }

  // ---------- Newsletter : inscription sans quitter l'article ----------
  var form = document.querySelector("[data-blog-newsletter]");
  if (form && window.fetch && window.FormData) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = form.querySelector("[data-newsletter-msg]");
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      fetch(form.action, {
        method: "POST",
        headers: { "x-mk-popup": "1", "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: new URLSearchParams(new FormData(form)).toString(),
        credentials: "same-origin",
      })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (data) {
          msg.hidden = false;
          msg.className = "side-newsletter-msg " + (data.ok ? "is-ok" : "is-error");
          msg.textContent = data.ok ? (data.thankYouText || "Merci, votre inscription est enregistrée.") : (data.error || "Inscription impossible pour le moment.");
          if (data.ok) form.reset();
        })
        .catch(function () {
          msg.hidden = false;
          msg.className = "side-newsletter-msg is-error";
          msg.textContent = "Inscription impossible pour le moment. Réessayez dans un instant.";
        })
        .then(function () { button.disabled = false; });
    });
  }
})();

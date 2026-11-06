// Chargement automatique des publications précédentes (Publication unique). Réutilise la page publique de l'article précédent (même rendu, mêmes données) :
// on en extrait la zone de l'article, sans commentaires ni formulaires. Aucune dépendance. Adresses de même origine seulement.
(function () {
  "use strict";
  var cfgEl = document.getElementById("sp-autoload-config");
  var main = document.querySelector("[data-article]");
  if (!cfgEl || !main || !("IntersectionObserver" in window) || !window.fetch) return;
  var cfg; try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }
  var loaded = {}; loaded[location.pathname] = true;
  var count = 0, next = cfg.prev, busy = false, done = false;
  var original = { title: document.title, url: location.pathname + location.search };
  var status = document.createElement("p"); status.className = "sp-autoload-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); status.hidden = true;
  var sentinel = document.createElement("div"); sentinel.setAttribute("aria-hidden", "true"); sentinel.style.height = "1px";
  main.parentNode.insertBefore(sentinel, main.nextSibling); sentinel.parentNode.insertBefore(status, sentinel.nextSibling);

  function sameOrigin(u) { try { var a = new URL(u, location.href); return a.origin === location.origin ? a : null; } catch (e) { return null; } }
  function show(text, retry) {
    status.hidden = !text; status.textContent = text || "";
    if (retry) { var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-outline btn-sm"; b.textContent = "Réessayer"; b.style.marginLeft = "8px"; b.addEventListener("click", function () { load(); }); status.appendChild(b); }
  }
  function load() {
    if (busy || done) return;
    var u = next && sameOrigin(next);
    if (!u) { finish(); return; }
    if (loaded[u.pathname] || count >= cfg.max) { finish(); return; } // jamais deux fois le même article, jamais au-delà du maximum
    busy = true; show(cfg.loading, false);
    fetch(u.pathname + u.search, { credentials: "same-origin", headers: { Accept: "text/html" } }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.text();
    }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var art = doc.querySelector("[data-article]");
      if (!art) throw new Error("page sans article");
      var item = document.createElement("article"); item.className = "sp-autoload-item"; item.setAttribute("data-sp-url", u.pathname); item.setAttribute("data-sp-title", doc.title || "");
      var canon = doc.querySelector('link[rel="canonical"]'); if (canon) item.setAttribute("data-sp-canonical", canon.href);
      var desc = doc.querySelector('meta[name="description"]'); if (desc) item.setAttribute("data-sp-description", desc.content);
      [].slice.call(art.children).forEach(function (el) {
        if (el.matches(".article-comments,.article-final-cta,.article-pager,.share,.article-toc-mobile,.sp-nav,.sp-comments,.sp-related,.sp-authorbox")) return;
        var c = el.cloneNode(true);
        [].slice.call(c.querySelectorAll("[id]")).forEach(function (n) { n.removeAttribute("id"); }); // pas d'identifiants en double
        [].slice.call(c.querySelectorAll("script,form")).forEach(function (n) { n.remove(); });
        item.appendChild(c);
      });
      var cfg2 = doc.getElementById("sp-autoload-config"); next = null;
      if (cfg2) { try { next = JSON.parse(cfg2.textContent).prev; } catch (e) { next = null; } }
      loaded[u.pathname] = true; count += 1; busy = false; show("", false);
      sentinel.parentNode.insertBefore(item, sentinel);
      watch(item);
      if (!next || count >= cfg.max) finish();
    }).catch(function () { busy = false; show(cfg.error, true); });
  }
  function finish() { done = true; show(cfg.end, false); io.disconnect(); }
  // Quand un article chargé occupe le milieu de l'écran : adresse et titre de l'onglet suivent (remplacement, sans polluer le bouton « retour »)
  var seen = new IntersectionObserver(function (entries) {
    if (!cfg.updateUrl) return;
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, url = el.getAttribute("data-sp-url") || original.url, title = el.getAttribute("data-sp-title") || original.title;
      if (location.pathname !== url) { try { history.replaceState({ sp: true }, "", url); } catch (x) { /* ignoré */ } }
      document.title = title;
      var canon = document.querySelector('link[rel="canonical"]'), c = el.getAttribute("data-sp-canonical");
      if (canon && c) canon.setAttribute("href", c);
      var d = document.querySelector('meta[name="description"]'), dc = el.getAttribute("data-sp-description");
      if (d && dc !== null) d.setAttribute("content", dc);
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
  function watch(el) { seen.observe(el); }
  watch(main);
  var io = new IntersectionObserver(function (entries) { if (entries.some(function (e) { return e.isIntersecting; })) load(); }, { rootMargin: "0px 0px 600px 0px" });
  io.observe(sentinel);
})();

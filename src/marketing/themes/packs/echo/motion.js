/* Écho — lecteur d'épisodes simulé (aucune ressource externe), mini-lecteur persistant, filtres et apparitions. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "echo") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var D = function (t, c) { var e = document.createElement(t); if (c) e.className = c; return e; };
  var SP = [1, 1.25, 1.5, 2, 0.75], N = 72;
  b.classList.add("ec-on");

  // Apparition au défilement (contenu visible sans JS ou en mouvement réduit)
  if (!reduce && "IntersectionObserver" in window) {
    b.classList.add("ec-js");
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 60 + "ms"; io.observe(el); });
  }
  // Compteurs
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) { es.forEach(function (e) {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      var el = e.target, to = parseInt(el.getAttribute("data-count"), 10), suf = el.getAttribute("data-suffix") || "", t0 = null;
      if (reduce || isNaN(to)) return;
      (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
    }); }, { threshold: 0.5 });
    $$("[data-count]").forEach(function (c) { co.observe(c); });
  }

  // ----- catalogue -----
  var cat = {}, order = [];
  function parse(s) { return (s || "").split("~").map(function (x) { var i = x.indexOf("|"); return { t: +x.slice(0, i), s: x.slice(i + 1) }; }); }
  $$(".ec-cat [data-ep]").forEach(function (e) { var id = +e.getAttribute("data-ep"); order.push(id); cat[id] = { id: id, t: e.getAttribute("data-t"), g: e.getAttribute("data-g"), d: +e.getAttribute("data-d"), ch: parse(e.getAttribute("data-ch")), tr: parse(e.getAttribute("data-tr")) }; });
  if (!order.length) return;
  var S = { ep: order[0], t: 0, play: false, sp: 1, q: [order[1], order[2]] };
  try { var sv = JSON.parse(sessionStorage.getItem("ec-st") || "null"); if (sv && cat[sv.ep]) { S = sv; S.q = (S.q || []).filter(function (i) { return cat[i]; }); } } catch (e) {}
  var m = /^#ep-(\d+)$/.exec(location.hash); if (m && cat[+m[1]] && $$("[data-ec-panel]").length) { S.ep = +m[1]; S.t = 0; S.play = false; }
  function save() { try { sessionStorage.setItem("ec-st", JSON.stringify(S)); } catch (e) {} }
  function f(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
  function amp(i, ep) { return 0.14 + 0.86 * (Math.abs(Math.sin(i * 0.37 + ep)) * Math.abs(Math.cos(i * 0.11 + ep * 2)) * 0.7 + Math.abs(Math.sin(i * 1.3 + ep * 5)) * 0.3); }
  var live = document.querySelector("[data-ec=live]");
  function say(t) { if (live) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 40); } }
  function cur() { return cat[S.ep]; }
  function chIdx() { var c = cur().ch, k = 0; for (var i = 0; i < c.length; i++) if (S.t >= c[i].t) k = i; return k; }
  function trIdx() { var c = cur().tr, k = -1; for (var i = 0; i < c.length; i++) if (S.t >= c[i].t) k = i; return k; }

  // ----- construction des listes -----
  function link(href, attr, val, kids, label) { var a = D("a"); a.href = href; a.setAttribute(attr, val); if (label) a.setAttribute("aria-label", label); kids.forEach(function (k) { a.appendChild(k); }); return a; }
  function span(t, tag) { var e = D(tag || "span"); e.textContent = t; return e; }
  function buildCh() { $$("[data-ec=chapters]").forEach(function (ol) { ol.textContent = ""; cur().ch.forEach(function (c, i) { var li = D("li"); li.appendChild(link("#chap-" + (i + 1), "data-seek", c.t, [span(f(c.t), "i"), span(c.s)])); ol.appendChild(li); }); }); }
  function buildTr() { $$("[data-ec=tr]").forEach(function (box) { box.textContent = ""; cur().tr.forEach(function (l) { var p = D("p"); p.appendChild(link("#ligne", "data-seek", l.t, [span(f(l.t), "i"), document.createTextNode(" " + l.s)])); box.appendChild(p); }); box.scrollTop = 0; }); }
  function buildWave() {
    var c = cur();
    $$("[data-ec=wave]").forEach(function (w) {
      var rs = $$("rect", w); rs.forEach(function (r, i) { var h = Math.round(amp(i, S.ep) * 1500) / 10; r.setAttribute("height", h); r.setAttribute("y", Math.round((80 - h / 2) * 10) / 10); });
      $$(".ec-flag", w).forEach(function (x) { x.parentNode.removeChild(x); });
      c.ch.forEach(function (ch, i) { if (!i) return; var fl = D("span", "ec-flag"); fl.style.left = (ch.t / c.d * 100) + "%"; fl.setAttribute("aria-hidden", "true"); fl.title = ch.s; w.appendChild(fl); });
      w.__rs = rs; w.__last = -1;
    });
  }
  function buildQueue() {
    $$("[data-ec=queue]").forEach(function (ol) {
      ol.textContent = "";
      if (!S.q.length) { var li0 = D("li", "ec-q ec-q--empty"); li0.textContent = "La file est vide. Ajoutez un épisode avec « + File »."; ol.appendChild(li0); return; }
      S.q.forEach(function (id) {
        var e = cat[id], li = D("li", "ec-q"), a = D("a", "ec-q-t"); a.href = "#lire-" + id; a.setAttribute("role", "button"); a.setAttribute("data-ec-play", id);
        a.setAttribute("aria-label", "Lire : " + e.t); a.appendChild(span(e.t, "b")); a.appendChild(span(e.g.split(",")[0] + " · " + f(e.d), "small"));
        var x = D("a", "ec-q-x"); x.href = "#retirer-" + id; x.setAttribute("role", "button"); x.setAttribute("data-ec-del", id); x.setAttribute("aria-label", "Retirer de la file : " + e.t); x.textContent = "×";
        li.appendChild(a); li.appendChild(x); ol.appendChild(li);
      });
    });
  }

  // ----- affichage -----
  function txt(sel, v) { $$("[data-ec=" + sel + "]").forEach(function (e) { if (e.textContent !== v) e.textContent = v; }); }
  function setSlider() {
    $$("[data-ec=wave]").forEach(function (w) { w.setAttribute("aria-valuemax", cur().d); w.setAttribute("aria-valuenow", Math.floor(S.t)); w.setAttribute("aria-valuetext", f(S.t) + " sur " + f(cur().d)); });
  }
  function paintEp() {
    var e = cur(); txt("title", e.t); txt("guest", "Avec " + e.g); txt("num", "Épisode " + e.id); txt("dur", f(e.d));
    buildWave(); buildCh(); buildTr(); buildQueue(); paintSt(); paintT(true);
    $$("[data-ep-row]").forEach(function (r) { r.classList.toggle("is-cur", +r.getAttribute("data-ep-row") === S.ep); });
    $$("[data-ec-panel]").forEach(function (p) { p.hidden = +p.getAttribute("data-ec-panel") !== S.ep; });
    $$("[data-ec-ptab]").forEach(function (a) { var on = +a.getAttribute("data-ec-ptab") === S.ep; a.classList.toggle("is-on", on); a.setAttribute("aria-pressed", on); });
  }
  function paintSt() {
    b.setAttribute("data-ec-state", S.play ? "play" : "pause");
    $$("[data-ec=toggle]").forEach(function (a) { a.classList.toggle("is-playing", S.play); a.setAttribute("aria-label", S.play ? "Mettre en pause" : "Lire"); });
    $$("[data-ec=speed]").forEach(function (a) { a.textContent = S.sp + "×"; a.setAttribute("aria-label", "Vitesse de lecture : " + S.sp + " fois. Changer."); });
  }
  var lastCh = -1, lastTr = -2, lastSec = -1;
  function paintT(force) {
    var d = cur().d, p = Math.min(1, S.t / d), sec = Math.floor(S.t);
    $$("[data-ec=fill]").forEach(function (e) { e.style.transform = "scaleX(" + p + ")"; });
    if (sec !== lastSec || force) { lastSec = sec; txt("cur", f(S.t)); txt("left", "−" + f(d - S.t)); setSlider(); }
    var n = Math.min(N - 1, Math.floor(p * N));
    $$("[data-ec=wave]").forEach(function (w) {
      var rs = w.__rs; if (!rs || (w.__last === n && !force)) return;
      for (var i = 0; i < rs.length; i++) { var on = i <= n && S.t > 0, near = S.play && Math.abs(i - n) < 4; rs[i].classList.toggle("is-played", on); rs[i].classList.toggle("is-near", near); }
      w.__last = n;
    });
    var ci = chIdx(), ti = trIdx();
    if (ci !== lastCh || force) {
      $$("[data-ec=chapters] li").forEach(function (li, i) { var a = li.firstChild; if (i === ci) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      if (S.play && lastCh !== -1 && ci !== lastCh) say("Chapitre " + (ci + 1) + " : " + cur().ch[ci].s);
      lastCh = ci;
    }
    if (ti !== lastTr || force) {
      lastTr = ti;
      $$("[data-ec=tr]").forEach(function (box) {
        var ps = $$("p", box); ps.forEach(function (p2, i) { p2.classList.toggle("is-now", i === ti); });
        var el = ps[ti]; if (el && !force) { var to = el.offsetTop - box.clientHeight / 3; if (box.scrollTo) box.scrollTo({ top: to, behavior: reduce ? "auto" : "smooth" }); else box.scrollTop = to; }
      });
    }
  }
  function load(id, play, t) { S.ep = id; S.t = t || 0; S.play = !!play; S.q = S.q.filter(function (i) { return i !== id; }); lastCh = -1; lastTr = -2; paintEp(); save(); }
  function seek(t) { S.t = Math.max(0, Math.min(cur().d - 0.5, t)); paintT(true); save(); }
  function nextEp(auto) {
    if (S.q.length) { var id = S.q[0]; load(id, S.play || auto, 0); say("Lecture : " + cur().t); }
    else if (auto) { S.play = false; S.t = cur().d; paintSt(); paintT(true); save(); say("Fin de l'épisode. La file d'attente est vide."); }
    else say("La file d'attente est vide.");
  }
  setInterval(function () {
    if (!S.play) return;
    S.t += 0.25 * S.sp;
    if (S.t >= cur().d) { nextEp(true); return; }
    paintT(false); if (Math.floor(S.t * 4) % 8 === 0) save();
  }, 250);
  window.addEventListener("pagehide", save);

  // ----- commandes -----
  function act(a) {
    var k = a.getAttribute("data-ec");
    if (k === "toggle") { if (S.t >= cur().d - 1) S.t = 0; S.play = !S.play; paintSt(); paintT(true); save(); say(S.play ? "Lecture : " + cur().t : "Pause"); }
    else if (k === "back") seek(S.t - 15);
    else if (k === "fwd") seek(S.t + 15);
    else if (k === "speed") { S.sp = SP[(SP.indexOf(S.sp) + 1) % SP.length]; paintSt(); save(); say("Vitesse " + S.sp + " fois"); }
    else if (k === "next") nextEp(false);
    else if (k === "prev") { if (S.t > 3) seek(0); else { var i = order.indexOf(S.ep); if (i > 0) { load(order[i - 1], S.play, 0); say("Lecture : " + cur().t); } else seek(0); } }
  }
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest ? ev.target.closest("a") : null; if (!t) return;
    var v;
    if (t.getAttribute("data-ec") && t.getAttribute("data-ec") !== "wave") { ev.preventDefault(); act(t); return; }
    if ((v = t.getAttribute("data-ec-play"))) { ev.preventDefault(); load(+v, true, 0); say("Lecture : " + cur().t); return; }
    if ((v = t.getAttribute("data-ec-add"))) {
      ev.preventDefault(); v = +v; var i = S.q.indexOf(v);
      if (v === S.ep) { say("Cet épisode est déjà en cours."); return; }
      if (i < 0) { S.q.push(v); say("Ajouté à la file : " + cat[v].t); } else { S.q.splice(i, 1); say("Retiré de la file : " + cat[v].t); }
      buildQueue(); save(); $$("[data-ec-add=\"" + v + "\"]").forEach(function (a) { a.classList.toggle("is-on", S.q.indexOf(v) >= 0); }); return;
    }
    if ((v = t.getAttribute("data-ec-del"))) { ev.preventDefault(); S.q = S.q.filter(function (x) { return x !== +v; }); buildQueue(); save(); say("Retiré de la file"); $$("[data-ec-add=\"" + v + "\"]").forEach(function (a) { a.classList.remove("is-on"); }); return; }
    if ((v = t.getAttribute("data-seek"))) { ev.preventDefault(); seek(+v); if (!S.play) { S.play = true; paintSt(); } save(); return; }
    if ((v = t.getAttribute("data-ec-ptab"))) { ev.preventDefault(); load(+v, false, 0); try { history.replaceState(null, "", "#ep-" + v); } catch (e) {} say("Épisode " + v + " : " + cur().t); return; }
    if ((v = t.getAttribute("data-ec-filter"))) {
      ev.preventDefault(); var n = 0;
      $$("[data-ec-filter]").forEach(function (a) { a.classList.toggle("is-on", a === t); a.setAttribute("aria-pressed", a === t); });
      $$("[data-ec=eplist] .ec-ep").forEach(function (r) { var ok = v === "all" || r.getAttribute("data-cats") === v; r.hidden = !ok; if (ok) n++; });
      say(n + (n > 1 ? " épisodes affichés" : " épisode affiché"));
    }
  });
  document.addEventListener("keydown", function (ev) {
    var t = ev.target, k = ev.key;
    if (k === " " && t.matches && t.matches("a[role=button]")) { ev.preventDefault(); t.click(); return; }
    if (t.matches && t.matches("[data-ec=wave]")) {
      var s = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, PageUp: 30, PageDown: -30 }[k];
      if (s) { ev.preventDefault(); seek(S.t + s); } else if (k === "Home") { ev.preventDefault(); seek(0); } else if (k === "End") { ev.preventDefault(); seek(cur().d - 1); }
    }
  });

  // ----- forme d'onde : clic, glisser, aperçu -----
  $$("[data-ec=wave]").forEach(function (w) {
    w.setAttribute("role", "slider"); w.setAttribute("tabindex", "0"); w.setAttribute("aria-label", "Position de lecture"); w.setAttribute("aria-valuemin", "0");
    var hov = w.querySelector(".ec-hov"), ht = w.querySelector("[data-ec=hovt]"), down = false;
    function frac(ev) { var r = w.getBoundingClientRect(); return Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)); }
    w.addEventListener("pointerdown", function (ev) { down = true; try { w.setPointerCapture(ev.pointerId); } catch (e) {} seek(frac(ev) * cur().d); });
    w.addEventListener("pointermove", function (ev) { var fr = frac(ev); if (hov) { hov.style.transform = "translateX(" + fr * w.clientWidth + "px)"; hov.classList.add("is-on"); } if (ht) ht.textContent = f(fr * cur().d); if (down) seek(fr * cur().d); });
    w.addEventListener("pointerup", function () { down = false; save(); });
    w.addEventListener("pointerleave", function () { if (hov) hov.classList.remove("is-on"); });
  });

  // Marque les boutons « + File » déjà en file
  paintEp();
  S.q.forEach(function (id) { $$("[data-ec-add=\"" + id + "\"]").forEach(function (a) { a.classList.add("is-on"); }); });
  // Hauteur de la barre pour le menu mobile
  function sizeBar() { var bar = document.querySelector(".ec-bar"); if (bar) b.style.setProperty("--ec-barh", bar.offsetHeight + "px"); }
  sizeBar(); window.addEventListener("resize", sizeBar);
})();

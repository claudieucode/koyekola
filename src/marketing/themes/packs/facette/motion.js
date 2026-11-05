/* Facette — gemme réactive, atelier à loupe (pointeur et clavier), filtres, anatomie. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
if (document.body.getAttribute("data-kw-pack") !== "facette") return;
 var b = document.body, reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
 var $ = function (s, r) { return (r || document).querySelector(s); };
 var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
 var host = $(".lp-main") || b; host.classList.add("fc-js");
 if (!reduce && "IntersectionObserver" in window) {
 host.classList.add("fc-rev");
 var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px" });
 $$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
 }
 $$(".fc-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });
 function radioGroup(g, onPick) {
 var items = $$("[role=radio]", g);
 function rove() { items.forEach(function (a) { a.setAttribute("tabindex", a.getAttribute("aria-checked") === "true" ? "0" : "-1"); }); }
 function pick(a, focus) { items.forEach(function (x) { x.setAttribute("aria-checked", x === a ? "true" : "false"); }); rove(); if (focus) a.focus(); onPick(a.getAttribute("data-v")); }
 items.forEach(function (a, i) {
 a.addEventListener("click", function (e) { e.preventDefault(); pick(a, false); });
 a.addEventListener("keydown", function (e) {
 var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
 if (d) { e.preventDefault(); pick(items[(i + d + items.length) % items.length], true); }
 else if (e.key === " ") { e.preventDefault(); pick(a, false); }
 });
 });
 rove(); return { set: function (v) { var a = items.filter(function (x) { return x.getAttribute("data-v") === v; })[0]; if (a) { items.forEach(function (x) { x.setAttribute("aria-checked", x === a ? "true" : "false"); }); rove(); } } };
 }
 var hero = $(".fc-hero"), hg = $(".fc-hero-gem");
 if (hero && hg && !reduce) {
 var facets = $$(".fc-f", hg), last = -1, raf = 0, ev;
 hero.addEventListener("pointermove", function (e) {
 ev = e; if (raf) return;
 raf = requestAnimationFrame(function () {
 raf = 0; var r = hg.getBoundingClientRect(), dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2);
 hg.style.transform = "rotateX(" + (-Math.max(-1, Math.min(1, dy / 500)) * 9).toFixed(1) + "deg) rotateY(" + (Math.max(-1, Math.min(1, dx / 500)) * 9).toFixed(1) + "deg)";
 var a = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, q = Math.round(a / 15); if (q === last) return; last = q;
 facets.forEach(function (f) { var d = Math.abs(((+f.getAttribute("data-a") - a + 540) % 360) - 180); f.classList.toggle("is-lit", d < 34); });
 });
 });
 hero.addEventListener("pointerleave", function () { hg.style.transform = ""; last = -1; facets.forEach(function (f) { f.classList.remove("is-lit"); }); });
 }
 var demo = $("[data-fc-demo]");
 if (demo) {
 var sws = $$("[data-demo-metal]"), order = sws.map(function (s) { return s.getAttribute("data-demo-metal"); }), iv, user = false;
 var setM = function (m) { demo.setAttribute("data-metal", m); sws.forEach(function (s) { s.setAttribute("aria-pressed", s.getAttribute("data-demo-metal") === m ? "true" : "false"); }); };
 sws.forEach(function (s) { s.addEventListener("click", function (e) { e.preventDefault(); user = true; clearInterval(iv); setM(s.getAttribute("data-demo-metal")); }); });
 if (!reduce) iv = setInterval(function () { if (!user) setM(order[(order.indexOf(demo.getAttribute("data-metal")) + 1) % order.length]); }, 3400);
 }
 var coll = $("[data-coll]");
 if (coll) {
 var fk = "tout", fm = "tous", vits = $$(".fc-vit"), out = $("[data-count-out]"), emp = $("[data-empty]");
 var run = function () {
 var n = 0; vits.forEach(function (v) { var ok = (fk === "tout" || v.getAttribute("data-kind") === fk) && (fm === "tous" || v.getAttribute("data-metal") === fm); v.classList.toggle("is-off", !ok); if (ok) { n++; v.classList.add("is-in"); } });
 out.textContent = n + (n > 1 ? " pièces" : " pièce"); emp.classList.toggle("is-on", n === 0);
 };
 var bind = function (attr, set) { $$("[" + attr + "]", coll).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); set(a.getAttribute(attr)); $$("[" + attr + "]", coll).forEach(function (x) { x.setAttribute("aria-pressed", x === a ? "true" : "false"); }); run(); }); }); };
 bind("data-fk", function (v) { fk = v; }); bind("data-fm", function (v) { fm = v; });
 }
 var an = $("[data-anat]");
 if (an) {
 var tabs = $$("[data-part-tab]", an), parts = $$(".fc-part", an), tt = $("[data-part-t]", an), td = $("[data-part-d]", an);
 var show = function (t) {
 tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); x.setAttribute("tabindex", x === t ? "0" : "-1"); });
 var k = t.getAttribute("data-part-tab"); parts.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-part") === k); });
 tt.textContent = t.textContent; td.textContent = t.getAttribute("data-d") || "";
 };
 tabs.forEach(function (t, i) {
 t.addEventListener("click", function (e) { e.preventDefault(); show(t); });
 t.addEventListener("keydown", function (e) { var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (d) { e.preventDefault(); var n = tabs[(i + d + tabs.length) % tabs.length]; show(n); n.focus(); } });
 });
 parts.forEach(function (p) { p.addEventListener("pointerenter", function () { var t = tabs.filter(function (x) { return x.getAttribute("data-part-tab") === p.getAttribute("data-part"); })[0]; if (t) show(t); }); });
 show(tabs[0]);
 }
 var cfg = $("[data-fc-cfg]");
 if (cfg) {
 var stage = $(".fc-stage", cfg), view = $(".fc-view", stage), lens = $(".fc-lens", stage), lin = $(".fc-lens-in", lens);
 var NAME = { jaune: "Or jaune", rose: "Or rose", argent: "Argent", platine: "Platine" };
 var STONE = { diamant: "Diamant", emeraude: "Émeraude", saphir: "Saphir", rubis: "Rubis", amethyste: "Améthyste" };
 var SIZE = { fine: "Fine, environ 0,5 ct", classique: "Classique, environ 0,8 ct", genereuse: "Généreuse, environ 1,2 ct" };
 var tpl = {}; $$(".fc-tpl").forEach(function (t) { tpl[t.getAttribute("data-id")] = t; });
 var st = { piece: "aurore", metal: stage.getAttribute("data-metal"), stone: stage.getAttribute("data-stone"), size: "classique" };
 var groups = {}, Z = 2.6, pin = false, over = false, px = 0.5, py = 0.42;
 var live = $(".fc-recap", cfg);
 function lensDraw() {
 var w = stage.clientWidth, h = stage.clientHeight, R = lens.offsetWidth / 2;
 lin.style.width = w * Z + "px"; lin.style.height = h * Z + "px";
 lin.style.transform = "translate(" + (R - px * w * Z).toFixed(1) + "px," + (R - py * h * Z).toFixed(1) + "px)";
 lens.style.transform = "translate(" + (px * w - R).toFixed(1) + "px," + (py * h - R).toFixed(1) + "px)";
 lens.classList.toggle("is-on", pin || over); $("[data-zlev]").textContent = "×" + String(Z).replace(".", ",");
 }
 function apply() {
 view.innerHTML = tpl[st.piece].innerHTML; lin.innerHTML = tpl[st.piece].innerHTML;
 stage.setAttribute("data-metal", st.metal); stage.setAttribute("data-stone", st.stone); stage.setAttribute("data-size", st.size);
 var nm = tpl[st.piece].getAttribute("data-name");
 $$("[data-r]", cfg).forEach(function (d) { var k = d.getAttribute("data-r"); d.textContent = k === "piece" ? nm : k === "metal" ? NAME[st.metal] : k === "stone" ? STONE[st.stone] : SIZE[st.size]; });
 lensDraw();
 }
 function summary() { return "Pièce : " + tpl[st.piece].getAttribute("data-name") + " · Métal : " + NAME[st.metal].toLowerCase() + " · Pierre : " + STONE[st.stone].toLowerCase() + " · Taille de la pierre : " + SIZE[st.size].toLowerCase() + " (poids indicatif)"; }
 $$("[data-group]", cfg).forEach(function (g) { var k = g.getAttribute("data-group"); groups[k] = radioGroup(g, function (v) { st[k] = v; apply(); }); });
 function choose(id) { if (!tpl[id]) return; st.piece = id; st.metal = tpl[id].getAttribute("data-metal"); st.stone = tpl[id].getAttribute("data-stone"); groups.piece.set(id); groups.metal.set(st.metal); groups.stone.set(st.stone); apply(); }
 if (location.hash && tpl[location.hash.slice(1)]) choose(location.hash.slice(1)); else apply();
 var move = function (e) { var r = stage.getBoundingClientRect(); px = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); py = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); lensDraw(); };
 stage.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { over = true; move(e); } });
 stage.addEventListener("pointerleave", function () { over = false; lensDraw(); });
 stage.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse" || pin) move(e); });
 stage.addEventListener("pointerdown", function (e) { if (pin) move(e); });
 function setPin(v) { pin = v; stage.classList.toggle("is-pin", v); var t = $("[data-zoom=toggle]", cfg); t.setAttribute("aria-pressed", v ? "true" : "false"); lensDraw(); }
 function zoom(d) { Z = Math.max(1.6, Math.min(4, Math.round((Z + d) * 10) / 10)); lensDraw(); }
 $$("[data-zoom]", cfg).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); var k = a.getAttribute("data-zoom"); if (k === "toggle") setPin(!pin); else zoom(k === "in" ? 0.4 : -0.4); }); });
 stage.setAttribute("tabindex", "0"); stage.setAttribute("role", "group"); stage.setAttribute("aria-label", "Vue de la pièce. Entrée active la loupe, les flèches la déplacent, plus et moins règlent le grossissement.");
 stage.addEventListener("keydown", function (e) {
 var k = e.key, s = 0.05, hit = true;
 if (k === "Enter" || k === " ") setPin(!pin);
 else if (k === "Escape") setPin(false);
 else if (k === "+" || k === "=") zoom(0.4); else if (k === "-" || k === "_") zoom(-0.4);
 else if (k === "ArrowLeft") px = Math.max(0, px - s); else if (k === "ArrowRight") px = Math.min(1, px + s);
 else if (k === "ArrowUp") py = Math.max(0, py - s); else if (k === "ArrowDown") py = Math.min(1, py + s); else hit = false;
 if (hit) { e.preventDefault(); if (k.indexOf("Arrow") === 0 && !pin) setPin(true); else lensDraw(); }
 });
 window.addEventListener("resize", lensDraw);
 var send = $("[data-fc-send]", cfg), copy = $("[data-fc-copy]", cfg);
 send.addEventListener("click", function () { try { sessionStorage.setItem("fc-recap", "Bonjour, je souhaiterais un devis pour la pièce suivante.\n" + summary().replace(/ · /g, "\n")); } catch (x) {} });
 copy.addEventListener("click", function (e) {
 e.preventDefault(); var txt = summary(), done = function () { copy.textContent = "Récapitulatif copié"; setTimeout(function () { copy.textContent = "Copier le récapitulatif"; }, 2200); };
 if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () {});
 else done();
 });
 }
 var ta = document.querySelector(".lp-main textarea"), saved = null;
 try { saved = sessionStorage.getItem("fc-recap"); } catch (x) {}
 if (ta && saved && !ta.value) { ta.value = saved; ta.dispatchEvent(new Event("input", { bubbles: true })); try { sessionStorage.removeItem("fc-recap"); } catch (x) {} }
})();

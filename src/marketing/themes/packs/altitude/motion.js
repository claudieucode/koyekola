/* Altitude : trajectoire du hero, filtres, comparateur et demande de vol (haversine). Respecte prefers-reduced-motion. */
(function () {
var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "altitude") return;
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var $ = function (s, r) { return (r || document).querySelector(s); };
var host = $(".lp-main") || b; host.classList.add("al-js");
var R = Math.PI / 180, K = 1000 / 360;
if (!reduce && "IntersectionObserver" in window) {
host.classList.add("al-rev");
var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
$$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
}
var menu = $(".al-menu");
if (menu) {
document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; var s = $("summary", menu); if (s) s.focus(); } });
}
function place(g, path, l, sc) {
var T = path.getTotalLength(), p = path.getPointAtLength(l), q = path.getPointAtLength(Math.min(l + 1, T)), a;
if (l >= T - 1) { q = path.getPointAtLength(T - 2); a = Math.atan2(p.y - q.y, p.x - q.x) / R; } else a = Math.atan2(q.y - p.y, q.x - p.x) / R;
g.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ") rotate(" + a.toFixed(1) + ") scale(" + sc + ")");
}
function fly(g, path, ms, delay, sc) {
var len = path.getTotalLength(), t0 = null;
if (reduce) { place(g, path, len, sc); return; }
place(g, path, 0, sc);
(function step(ts) {
if (t0 === null) t0 = ts + delay; var p = Math.max(0, Math.min(1, (ts - t0) / ms)), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
place(g, path, len * e, sc); if (p < 1) requestAnimationFrame(step);
})(performance.now());
}
var tr = $(".al-trace"), pl = $(".al-plane");
if (tr && tr.getTotalLength) {
var L = tr.getTotalLength(); tr.style.setProperty("--al-len", L);
tr.setAttribute("stroke-dasharray", L);
if (pl) { if (b.getAttribute("data-pk-trail") === "off") place(pl, tr, L, 1.7); else fly(pl, tr, 5000, 500, 1.7); }
}
$$("[data-tabs]").forEach(function (root) {
var tabs = $$("[data-t]", root);
function pick(t) {
tabs.forEach(function (x) { x.setAttribute("aria-selected", x === t ? "true" : "false"); });
var v = t.getAttribute("data-t");
$$("[data-p]", root).forEach(function (p) { if (p.getAttribute("data-p") === v) p.setAttribute("data-on", "1"); else p.removeAttribute("data-on"); });
$$("[data-region]", root).forEach(function (r) { r.hidden = !(v === "all" || r.getAttribute("data-region") === v); });
}
tabs.forEach(function (t) { t.addEventListener("click", function (e) { e.preventDefault(); pick(t); }); });
});
var plan = $("[data-plan]"); if (!plan) return;
var PAD = +plan.getAttribute("data-pad") || 22;
var out = function (k) { return $('[data-o="' + k + '"]', plan); };
var set = function (k, v) { var e = out(k); if (e) e.textContent = v; };
var nb = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
var hm = function (m) { return Math.floor(m / 60) + " h " + ("0" + (m % 60)).slice(-2); };
var S = { d: null, a: null, day: null, pax: 2, cat: null };
var groups = { d: $('[data-side="d"]', plan), a: $('[data-side="a"]', plan) };
var apts = {}; $$(".al-ap", groups.d).forEach(function (el) { apts[el.getAttribute("data-code")] = { c: el.getAttribute("data-code"), lat: +el.getAttribute("data-lat"), lon: +el.getAttribute("data-lon"), n: el.getAttribute("data-name") }; });
var cats = $$(".al-cat", plan), svgPath = $(".al-rt", plan), ra = $(".al-ra", plan), rb = $(".al-rb", plan), pj = $(".al-pj", plan);
var svgMap = $(".al-map--p", plan), pjScale = 0.9;
var proj = function (lon, lat) { return [(lon + 180) * K, (84 - lat) * K]; };
function gc(a, b, n) {
var f1 = a.lat * R, l1 = a.lon * R, f2 = b.lat * R, l2 = b.lon * R, d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((f2 - f1) / 2), 2) + Math.cos(f1) * Math.cos(f2) * Math.pow(Math.sin((l2 - l1) / 2), 2)));
var s = "", px = null;
for (var i = 0; i <= n; i++) {
var f = i / n, A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
var x = A * Math.cos(f1) * Math.cos(l1) + B * Math.cos(f2) * Math.cos(l2), y = A * Math.cos(f1) * Math.sin(l1) + B * Math.cos(f2) * Math.sin(l2), z = A * Math.sin(f1) + B * Math.sin(f2);
var P = proj(Math.atan2(y, x) / R, Math.atan2(z, Math.hypot(x, y)) / R);
s += (px === null || Math.abs(P[0] - px) > 400 ? "M" : "L") + P[0].toFixed(1) + " " + P[1].toFixed(1); px = P[0];
}
var hdg = (Math.atan2(Math.sin(l2 - l1) * Math.cos(f2), Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(l2 - l1)) / R + 360) % 360;
return { d: s, km: 6371 * d, hdg: hdg };
}
var days = $("[data-days]", plan), now = new Date();
for (var i = 2; i < 11; i++) {
var dt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i), a = document.createElement("a");
a.className = "al-day"; a.setAttribute("role", "radio"); a.setAttribute("aria-checked", "false"); a.href = "#jour-" + i;
a.setAttribute("data-label", dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
a.innerHTML = "<span>" + dt.toLocaleDateString("fr-FR", { weekday: "short" }) + "</span><b>" + dt.getDate() + "</b><span>" + dt.toLocaleDateString("fr-FR", { month: "short" }) + "</span>";
days.appendChild(a);
}
function radio(el, group) { $$('[role="radio"]', group).forEach(function (x) { x.setAttribute("aria-checked", x === el ? "true" : "false"); }); }
function route() {
var dots = $$(".al-dot", plan); dots.forEach(function (x) { var c = x.getAttribute("data-code"); x.classList.toggle("on", c === S.d || c === S.a); });
if (!S.d || !S.a) { svgPath.setAttribute("d", ""); return null; }
var A = apts[S.d], B = apts[S.a], g = gc(A, B, 64), pa = proj(A.lon, A.lat), pb = proj(B.lon, B.lat);
svgPath.setAttribute("d", g.d); ra.setAttribute("cx", pa[0]); ra.setAttribute("cy", pa[1]); rb.setAttribute("cx", pb[0]); rb.setAttribute("cy", pb[1]);
var bb = svgPath.getBBox(), w = Math.max(bb.width * 1.6, bb.height * 1.6 * 1000 / 394, 420), h = w * 394 / 1000, cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
if (g.d.indexOf("M", 1) > 0) { w = 1000; h = 394; cx = 500; cy = 197; }
var vx = Math.max(0, Math.min(1000 - w, cx - w / 2)), vy = Math.max(0, Math.min(394 - h, cy - h / 2)), z = 1000 / w;
svgMap.setAttribute("viewBox", vx.toFixed(1) + " " + vy.toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1));
svgPath.setAttribute("stroke-width", (2.4 / z).toFixed(2)); ra.setAttribute("r", 6 / z); rb.setAttribute("r", 6 / z); pjScale = 0.9 / z;
$$(".al-dot", plan).forEach(function (x) { x.setAttribute("r", 3.4 / z); });
var len = svgPath.getTotalLength(); svgPath.setAttribute("stroke-dasharray", len);
if (!reduce) { svgPath.style.transition = "none"; svgPath.style.strokeDashoffset = len; svgPath.getBoundingClientRect(); svgPath.style.transition = "stroke-dashoffset 1.4s ease"; svgPath.style.strokeDashoffset = 0; }
else svgPath.style.strokeDashoffset = 0;
if (g.d.indexOf("M", 1) > 0) pj.setAttribute("transform", "translate(-40 -40)"); else fly(pj, svgPath, 1400, 0, pjScale);
return g;
}
function update() {
var g = route(), km = g ? g.km : 0, cur = null;
cats.forEach(function (c) {
var seats = +c.getAttribute("data-seats"), rg = +c.getAttribute("data-range"), w = $(".al-cat-w", c), why = "";
if (S.pax > seats) why = "Trop petit pour " + S.pax + " passagers"; else if (g && km > rg) why = "Portée insuffisante pour ce trajet";
c.setAttribute("aria-disabled", why ? "true" : "false"); w.hidden = !why; w.textContent = why; if (c.getAttribute("data-id") === S.cat) cur = c;
});
var ok = cats.filter(function (c) { return c.getAttribute("aria-disabled") === "false"; });
if (!cur || cur.getAttribute("aria-disabled") === "true") { cur = ok[0] || cats[cats.length - 1]; S.cat = cur.getAttribute("data-id"); }
radio(cur, cur.parentNode);
var sp = +cur.getAttribute("data-speed"), mn = g ? Math.round(km / sp * 60 + PAD) : 0, cn = cur.getAttribute("data-n");
set("note", ok[0] ? "Appareil recommandé : " + ok[0].getAttribute("data-n") + "." : "Aucun appareil ne relie ces deux aéroports sans escale : un conseiller étudiera une escale technique.");
set("dist", g ? nb(km) + " km" : "—"); set("time", g ? hm(mn) : "—"); set("hdg", g ? Math.round(g.hdg) + "°" : "—"); set("pax", S.pax);
var rt = S.d && S.a ? apts[S.d].n + " (" + S.d + ") → " + apts[S.a].n + " (" + S.a + ")" : "À choisir";
var day = S.day ? S.day.getAttribute("data-label") : "À préciser dans le message";
set("s-route", rt); set("s-date", day); set("s-pax", S.pax + (S.pax > 1 ? " passagers" : " passager")); set("s-cat", cn + " (" + cur.querySelector(".al-cat-k").textContent + ")");
set("s-dd", g ? nb(km) + " km · environ " + hm(mn) : "—");
var warn = ""; if (g && cur.getAttribute("aria-disabled") === "true") warn = "Ce trajet dépasse la portée de l'appareil choisi : une escale technique serait nécessaire."; else if (ok.length === 0) warn = "Trajet à étudier avec un conseiller.";
set("warn", warn);
S.text = "Demande de vol (démonstration)\nTrajet : " + rt + "\nDate souhaitée : " + day + "\nPassagers : " + S.pax + "\nAppareil : " + cn + "\n" + (g ? "Distance : " + nb(km) + " km · durée estimée " + hm(mn) : "");
}
function activate(el) {
var g = el.parentNode, side = g.getAttribute("data-side");
if (el.classList.contains("al-ap")) {
var c = el.getAttribute("data-code"), o = side === "d" ? "a" : "d";
if (S[o] === c) { S[o] = null; radio({}, groups[o]); }
S[side] = c; radio(el, g);
$$(".al-ap", groups[o]).forEach(function (x) { x.setAttribute("aria-disabled", x.getAttribute("data-code") === c ? "true" : "false"); });
} else if (el.classList.contains("al-day")) { S.day = el; radio(el, g); }
else if (el.classList.contains("al-cat")) { S.cat = el.getAttribute("data-id"); }
else if (el.hasAttribute("data-pax")) { S.pax = Math.max(1, Math.min(16, S.pax + (+el.getAttribute("data-pax")))); }
update();
}
plan.addEventListener("click", function (e) {
var el = e.target.closest ? e.target.closest("a[href^='#']") : null; if (!el || !plan.contains(el)) return;
e.preventDefault();
if (el.hasAttribute("data-copy")) {
var m = out("copied"), ok = function () { m.textContent = "Récapitulatif copié : collez-le dans le message de la page contact."; }, ko = function () { m.textContent = "Copie impossible : recopiez les informations ci-dessus dans votre message."; };
if (navigator.clipboard) navigator.clipboard.writeText(S.text).then(ok, ko); else ko();
return;
}
if (el.getAttribute("aria-disabled") !== "true") activate(el);
});
plan.addEventListener("keydown", function (e) {
var el = e.target; if (!el.getAttribute) return;
var role = el.getAttribute("role");
if (e.key === " " && (role === "radio" || role === "button")) { e.preventDefault(); el.click(); return; }
var d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
if (d && role === "radio") {
e.preventDefault(); var all = $$('[role="radio"]:not([aria-disabled="true"])', el.parentNode), n = all[(all.indexOf(el) + d + all.length) % all.length]; if (n) { n.focus(); n.click(); }
}
});
var cp = $("[data-copy]", plan); if (cp) cp.hidden = false;
var h = (location.hash || "").match(/^#([A-Z]{3})-([A-Z]{3})$/), d0 = h && apts[h[1]] && apts[h[2]] ? h : [0, "VBS", "PCR"];
activate($('.al-ap[data-code="' + d0[1] + '"]', groups.d)); activate($('.al-ap[data-code="' + d0[2] + '"]', groups.a));
activate($(".al-day", days)); update();
})();

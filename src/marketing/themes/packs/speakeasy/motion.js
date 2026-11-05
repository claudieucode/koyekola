/* Speakeasy — carte interactive, demande de table, recette à l'échelle, lampe tamisée. Sans dépendance ; respecte prefers-reduced-motion. */
(function () {
var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "speakeasy") return;
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var $ = function (s, r) { return (r || document).querySelector(s); };
var host = $(".lp-main") || b; host.classList.add("sp-js");
var fav = "", lastRecap = "";
var click = function (root, sel, fn) { root.addEventListener("click", function (ev) { var a = ev.target.closest && ev.target.closest(sel); if (a && root.contains(a)) { ev.preventDefault(); fn(a); } }); };
var copy = function (txt, el, label) {
var done = function () { el.textContent = "Copié !"; setTimeout(function () { el.textContent = label; }, 2000); };
if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () {}); else done();
};
var scrollTo = function (el) { if (el && el.scrollIntoView) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); };

if (!reduce && "IntersectionObserver" in window) {
host.classList.add("sp-rev");
var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
$$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
$$("[data-count]").forEach(function (el) {
var to = parseInt(el.getAttribute("data-count"), 10); if (isNaN(to) || to < 1) return;
var o = new IntersectionObserver(function (es) {
if (!es[0].isIntersecting) return; o.disconnect(); var t0 = null, from = to > 100 ? to - 60 : 0;
(function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1400); el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(performance.now());
}, { threshold: 0.6 }); o.observe(el);
});
}

$$(".sp-drawer a").forEach(function (a) { a.addEventListener("click", function () { var d = a.closest("details"); if (d) d.open = false; }); });

// Lampe tamisée qui suit le curseur
var lamp = $(".sp-hero .sp-lamp, .sp-sig .sp-lamp");
if (lamp && !reduce && window.matchMedia("(pointer: fine)").matches) {
var sec = lamp.parentNode, raf = 0, px = 0, py = 0;
sec.addEventListener("pointermove", function (e) {
var r = sec.getBoundingClientRect(); px = (e.clientX - r.left - r.width / 2) * 0.35; py = (e.clientY - r.top) * 0.18;
if (!raf) raf = requestAnimationFrame(function () { raf = 0; lamp.style.transform = "translate(" + px.toFixed(0) + "px," + py.toFixed(0) + "px)"; });
});
}

// Ouvert ce soir ? (horaires de démonstration)
var SCHED = { 0: [17, 24], 1: null, 2: [18, 25], 3: [18, 25], 4: [18, 25], 5: [18, 27], 6: [18, 27] };
var DN = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
function openState() {
var now = new Date(), d = now.getDay(), h = now.getHours() + now.getMinutes() / 60, y = (d + 6) % 7;
if (SCHED[y] && SCHED[y][1] > 24 && h < SCHED[y][1] - 24) return { open: true, txt: "Ouvert · dernier verre à " + (SCHED[y][1] - 24 | 0) + " h" };
if (SCHED[d] && h >= SCHED[d][0] && h < Math.min(24, SCHED[d][1])) return { open: true, txt: "Ouvert · jusqu'à " + (SCHED[d][1] % 24 | 0) + " h" };
for (var i = 0; i < 8; i++) { var k = (d + i) % 7, s = SCHED[k]; if (s && (i > 0 || h < s[0])) return { open: false, txt: "Fermé · ouvre " + (i === 0 ? "ce soir" : i === 1 ? "demain" : DN[k]) + " à " + s[0] + " h" }; }
return { open: false, txt: "Fermé" };
}
var st = openState();
$$("[data-open-box]").forEach(function (bx) { bx.classList.toggle("is-open", st.open); var t = $("[data-open-t]", bx); if (t) t.textContent = st.txt; });
$$("[data-hours] tr[data-dow]").forEach(function (tr) { if (+tr.getAttribute("data-dow") === new Date().getDay()) tr.classList.add("is-today"); });

// ---------- Carte : spiritueux, fiche ----------
var tabs = $$("[data-sp]"), parts = $$("[data-part]"), wide = function () { return window.matchMedia("(min-width:1025px)").matches; };
function setup(part) {
var panel = $("[data-panel]", part), pin = $("[data-panel-in]", part), openId = "";
function closeP() { panel.classList.remove("is-open"); $$(".sp-row-a", part).forEach(function (a) { a.setAttribute("aria-expanded", "false"); }); openId = ""; }
function openC(id, focus) {
var f = $('[data-f="' + id + '"]', part); if (!f) return;
pin.innerHTML = f.innerHTML; openId = id;
$$(".sp-row-a", part).forEach(function (a) { a.setAttribute("aria-expanded", a.getAttribute("data-open") === id ? "true" : "false"); });
panel.classList.add("is-open");
if (focus && !wide()) { panel.setAttribute("tabindex", "-1"); panel.focus(); }
}
part._first = function () { closeP(); if (wide()) { var r = $(".sp-row-a", part); if (r) openC(r.getAttribute("data-open")); } };
click(part, "[data-open]", function (a) { var id = a.getAttribute("data-open"); if (id === openId && !wide()) closeP(); else openC(id, true); });
click(panel, ".sp-panel-x", closeP);
panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closeP(); });
click(panel, "[data-fav]", function (a) { fav = a.getAttribute("data-fav"); a.textContent = "Noté : " + fav; updAll(); });
}
function pick(k) {
tabs.forEach(function (t) { var on = t.getAttribute("data-sp") === k; t.classList.toggle("is-on", on); t.setAttribute("aria-selected", on ? "true" : "false"); });
parts.forEach(function (p) { var on = p.getAttribute("data-part") === k; p.classList.toggle("is-on", on); if (on) p._first(); });
}
if (tabs.length) {
parts.forEach(setup);
tabs.forEach(function (t, i) {
t.addEventListener("click", function (e) { e.preventDefault(); pick(t.getAttribute("data-sp")); });
t.addEventListener("keydown", function (e) { var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (!n) return; e.preventDefault(); var t2 = tabs[(i + n + tabs.length) % tabs.length]; t2.focus(); pick(t2.getAttribute("data-sp")); });
});
pick("gin");
window.addEventListener("resize", function () { var p = $(".sp-part.is-on"); if (p && wide() && !$(".sp-panel.is-open", p)) p._first(); });
}

// ---------- Demande de table ----------
var resList = [];
$$("[data-res]").forEach(function (root) {
var S = { d: -1, p: 2, t: "20 h", pl: "Au salon vert" }, dEl = $("[data-dates]", root), days = [];
var M = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."], A = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
for (var i = 0; i < 7; i++) {
var dt = new Date(); dt.setDate(dt.getDate() + i); var closed = dt.getDay() === 1;
days.push({ lbl: (i === 0 ? "ce soir" : A[dt.getDay()] + " " + dt.getDate() + " " + M[dt.getMonth()]), closed: closed });
var a = document.createElement("a"); a.className = "sp-chip" + (closed ? " is-off" : ""); a.href = "#soir"; a.setAttribute("role", "radio"); a.setAttribute("aria-checked", "false"); a.setAttribute("data-di", i);
if (closed) a.setAttribute("aria-disabled", "true");
a.innerHTML = "<span>" + (i === 0 ? "Ce soir" : A[dt.getDay()] + " " + dt.getDate()) + "</span><small>" + (closed ? "fermé" : M[dt.getMonth()]) + "</small>";
dEl.appendChild(a);
if (!closed && S.d < 0) S.d = i;
}
function render() {
$$("[data-di]", root).forEach(function (c) { var on = +c.getAttribute("data-di") === S.d; c.classList.toggle("is-on", on); c.setAttribute("aria-checked", on ? "true" : "false"); });
$("[data-pn]", root).textContent = S.p; $("[data-pl]", root).textContent = S.p > 1 ? "personnes" : "personne";
var txt = "Table pour " + S.p + (S.p > 1 ? " personnes" : " personne") + ", " + (S.d === 0 ? "ce soir" : days[S.d].lbl) + " à " + S.t + ", " + S.pl.toLowerCase() + "." + (fav ? " Je voudrais goûter : " + fav + "." : "");
$("[data-rs]", root).textContent = txt; root._txt = txt; lastRecap = txt;
try { sessionStorage.setItem("sp-recap", txt); } catch (e) {}
}
root._render = render; resList.push(root);
click(root, "[data-di]", function (c) { if (c.classList.contains("is-off")) return; S.d = +c.getAttribute("data-di"); render(); });
click(root, "[data-p]", function (c) { S.p = Math.max(1, Math.min(10, S.p + parseInt(c.getAttribute("data-p"), 10))); render(); });
click(root, "[data-t]", function (c) { S.t = c.getAttribute("data-t"); $$("[data-t]", root).forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on ? "true" : "false"); }); render(); });
click(root, "[data-pl]", function (c) { if (!c.hasAttribute("href")) return; S.pl = c.getAttribute("data-pl"); $$("[data-places] [data-pl]", root).forEach(function (x) { var on = x === c; x.classList.toggle("is-on", on); x.setAttribute("aria-checked", on ? "true" : "false"); }); render(); });
var cp = $("[data-rcopy]", root); click(root, "[data-rcopy]", function () { copy(root._txt || "", cp, "Copier le récapitulatif"); });
render();
});
function updAll() { resList.forEach(function (r) { r._render(); }); }

// Récapitulatif repris sur la page de contact
$$("[data-recap]").forEach(function (box) {
var t = ""; try { t = sessionStorage.getItem("sp-recap") || ""; } catch (e) {}
if (!t) return; box.classList.add("is-on"); $("[data-recap-t]", box).textContent = t;
var cb = $("[data-recap-copy]", box); click(box, "[data-recap-copy]", function () { copy(t, cb, "Copier le texte"); });
});

// ---------- Recette à l'échelle ----------
$$("[data-scale]").forEach(function (root) {
var n = 1, nums = $$("[data-q]", root);
function upd() {
$("[data-sn]", root).textContent = n; $("[data-sl]", root).textContent = n > 1 ? "verres" : "verre";
nums.forEach(function (el) { var v = parseFloat(el.getAttribute("data-q")) * n; el.textContent = (Math.round(v * 10) / 10).toString().replace(".", ","); });
}
click(root, "[data-n]", function (a) { n = Math.max(1, Math.min(12, n + parseInt(a.getAttribute("data-n"), 10))); upd(); });
});

// ---------- Espace conseillé pour une soirée privée ----------
$$("[data-cap]").forEach(function (root) {
var g = 20, out = $("[data-cr]", root), snd = $("[data-csend]", root), cc = $("[data-ccopy]", root), txt = "";
function upd() {
var r = g <= 14 ? "L'Alcôve (8 à 14 invités)" : g <= 40 ? "Le Salon vert (15 à 40 invités)" : "Le Bar entier (41 à 90 invités)";
$("[data-cn]", root).textContent = g;
txt = "Soirée privée pour " + g + " invités, espace conseillé : " + r + ".";
out.textContent = g < 8 ? "Pour moins de 8 invités, une simple réservation au salon suffit." : txt;
try { sessionStorage.setItem("sp-recap", txt); } catch (e) {}
}
click(root, "[data-c]", function (a) { g = Math.max(5, Math.min(90, g + parseInt(a.getAttribute("data-c"), 10))); upd(); });
click(root, "[data-ccopy]", function () { copy(txt, cc, "Copier le résumé"); });
upd();
});

$$('a[href="#reserver"]').forEach(function (a) { a.addEventListener("click", function (ev) { var r = $("[data-res]"); if (r) { ev.preventDefault(); scrollTo(r); } else { a.setAttribute("href", "/carte"); } }); });
if (!$("[data-res]")) $$('a[href="#reserver"]').forEach(function (a) { a.setAttribute("href", "/carte"); });
$$('a[href="#ajouter"],a[href="#copier"],a[href="#heure"],a[href="#place"],a[href="#soir"]').forEach(function (a) { a.addEventListener("click", function (ev) { ev.preventDefault(); }); });
})();

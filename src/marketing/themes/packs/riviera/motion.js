/* Riviera — démonstration : rien n'est réservé. */
(function () {
var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "riviera") return;
var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var head = $("[data-head]");
function onScroll() { if (head) head.classList.toggle("is-solid", (window.pageYOffset || 0) > 30); }
window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
if (!reduce && "IntersectionObserver" in window) {
b.classList.add("rv-js");
var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
$$("[data-reveal]").forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; io.observe(el); });
}
var fl = $("[data-filter]");
if (fl) {
var cards = $$(".rv-vc"), cn = $("[data-count-n]");
var applyF = function (f) {
var n = 0;
cards.forEach(function (c) { var ok = f === "toutes" || c.getAttribute("data-dest") === f; c.hidden = !ok; if (ok) n++; });
$$("a", fl).forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("data-f") === f); });
if (cn) cn.textContent = n;
};
$$("a", fl).forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); applyF(a.getAttribute("data-f")); }); });
var h0 = (location.hash || "").slice(1); if (h0 && $('a[data-f="' + h0 + '"]', fl)) applyF(h0);
}
var book = $("[data-book]");
if (book) {
var DAY = 864e5, MIN = 3;
var FAC = [0.75, 0.75, 0.8, 0.9, 1, 1.2, 1.55, 1.6, 1.2, 0.95, 0.8, 0.9];
var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
var body = $("[data-cal-body]", book), title = $("[data-cal-title]", book), msg = $("[data-msg]", book), send = $("[data-send]", book);
var panels = $$("[data-villa]"), chips = $$("[data-vsw] a");
var dn = function (y, m, d) { return Math.round(Date.UTC(y, m, d) / DAY); };
var nd = new Date(), today = dn(nd.getFullYear(), nd.getMonth(), nd.getDate());
var parts = function (n) { var d = new Date(n * DAY); return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() }; };
var fmt = function (n) { return new Date(n * DAY).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }); };
var eur = function (n) { return Math.round(n).toLocaleString("fr-FR") + " €"; };
var villa = null, vy = nd.getFullYear(), vm = nd.getMonth(), A = null, D = null, guests = 2, cache = {};
function busy(y, m) {
var k = villa.seed + "-" + y + "-" + m; if (cache[k]) return cache[k];
var s = villa.seed * 7919 + y * 12 + m, set = {}, cnt = (m === 6 || m === 7) ? 3 : 2, len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
function R() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s; }
for (var i = 0; i < cnt; i++) { var st = 1 + R() % 24, l = 3 + R() % 6; for (var j = st; j < st + l && j <= len; j++) set[dn(y, m, j)] = 1; }
return (cache[k] = set);
}
var isBusy = function (n) { var p = parts(n); return !!busy(p.y, p.m)[n]; };
function freeRange(a, d) { for (var n = a; n < d; n++) if (isBusy(n)) return false; return true; }
function render() {
if (!villa) return;
var two = window.innerWidth >= 1024, out = "", names = [];
body.classList.toggle("is-two", two);
for (var i = 0; i < (two ? 2 : 1); i++) {
var y = vy + Math.floor((vm + i) / 12), m = (vm + i) % 12, first = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7, len = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
names.push(MOIS[m] + " " + y);
out += '<div class="rv-mo"><p class="rv-mo-t">' + MOIS[m] + " " + y + '</p><div class="rv-wd" aria-hidden="true"><span>lun</span><span>mar</span><span>mer</span><span>jeu</span><span>ven</span><span>sam</span><span>dim</span></div><div class="rv-days">';
for (var p = 0; p < first; p++) out += '<span class="rv-d is-pad"></span>';
for (var d = 1; d <= len; d++) {
var n = dn(y, m, d), c = "rv-d", st = "libre", bz = busy(y, m)[n];
if (n < today) { c += " is-past"; st = "passé"; } else if (bz) { c += " is-busy"; st = "réservé"; }
if (A !== null && n === A) c += " is-start"; if (D !== null && n === D) c += " is-end";
if (A !== null && D !== null && n > A && n < D) c += " is-in";
out += '<button type="button" class="' + c + '" data-n="' + n + '"' + (n < today ? " disabled" : "") + ' aria-label="' + d + " " + MOIS[m] + " " + y + ", " + st + (n === A ? ", arrivée" : n === D ? ", départ" : "") + '">' + d + "</button>";
}
out += "</div></div>";
}
body.innerHTML = out; title.textContent = names.length > 1 ? MOIS[vm] + " – " + names[1] : names[0];
}
function nights() {
var t = 0; for (var n = A; n < D; n++) t += villa.base * FAC[parts(n).m]; return t;
}
function summary() {
var ready = A !== null && D !== null, tot = ready ? nights() + villa.clean : 0;
$("[data-s-in]", book).textContent = A !== null ? fmt(A) : "à choisir";
$("[data-s-out]", book).textContent = D !== null ? fmt(D) : "à choisir";
$("[data-s-n]", book).textContent = ready ? (D - A) + (D - A > 1 ? " nuits" : " nuit") : "—";
$("[data-s-g]", book).textContent = guests;
$("[data-s-tot]", book).textContent = ready ? "≈ " + eur(tot) : "—";
send.setAttribute("aria-disabled", ready ? "false" : "true");
if (ready) say("Environ " + eur(tot / (D - A)) + " la nuit en moyenne, ménage de " + eur(villa.clean) + " compris dans le total. Prix indicatif, à confirmer par écrit.");
return ready ? ["Demande de séjour (démonstration)", "Villa : " + villa.name, "Arrivée : " + fmt(A), "Départ : " + fmt(D), "Nuits : " + (D - A), "Voyageurs : " + guests, "Budget indicatif : environ " + eur(tot) + ", ménage compris"].join("\n") : "";
}
function say(t) { msg.textContent = t; }
function pick(n) {
if (n < today) return;
if (A === null || D !== null) { if (isBusy(n)) { say("Cette nuit est déjà réservée."); return; } A = n; D = null; say("Arrivée le " + fmt(n) + ". Choisissez maintenant le jour de départ."); }
else if (n <= A) { if (isBusy(n)) { say("Cette nuit est déjà réservée."); return; } A = n; say("Arrivée le " + fmt(n) + ". Choisissez le jour de départ."); }
else if (n - A < MIN) say("Séjour minimum : " + MIN + " nuits.");
else if (!freeRange(A, n)) say("Cette période contient des nuits déjà réservées. Choisissez un autre départ.");
else D = n;
render(); summary();
}
function setVilla(id, push) {
var p = panels.filter(function (x) { return x.getAttribute("data-villa") === id; })[0] || panels[0];
panels.forEach(function (x) { x.hidden = x !== p; });
chips.forEach(function (c) { c.classList.toggle("is-on", c.getAttribute("data-v") === p.getAttribute("data-villa")); });
villa = { id: p.getAttribute("data-villa"), name: p.getAttribute("data-name"), base: +p.getAttribute("data-base"), seed: +p.getAttribute("data-seed"), max: +p.getAttribute("data-max"), clean: +p.getAttribute("data-clean") };
$("[data-bk-name]", book).textContent = villa.name;
A = D = null; guests = Math.min(guests, villa.max); cache = {};
say("Choisissez votre jour d'arrivée, puis votre jour de départ (" + MIN + " nuits minimum).");
render(); summary();
if (push) { try { history.replaceState(null, "", "#" + villa.id); } catch (e) {} }
}
body.addEventListener("click", function (e) { var t = e.target.closest && e.target.closest("[data-n]"); if (t) pick(+t.getAttribute("data-n")); });
$$("[data-nav]", book).forEach(function (a) {
a.addEventListener("click", function (e) {
e.preventDefault(); var s = +a.getAttribute("data-nav"), cur = nd.getFullYear() * 12 + nd.getMonth(), t = vy * 12 + vm + s;
if (t < cur) return; vy = Math.floor(t / 12); vm = t % 12; render();
});
});
$$("[data-guests]", book).forEach(function (a) {
a.addEventListener("click", function (e) {
e.preventDefault(); var g = guests + +a.getAttribute("data-guests");
if (g > villa.max) { say("Cette villa accueille " + villa.max + " voyageurs au maximum."); return; }
if (g < 1) return; guests = g; summary();
});
});
chips.forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); setVilla(a.getAttribute("data-v"), true); }); });
send.addEventListener("click", function (e) {
if (send.getAttribute("aria-disabled") === "true") { e.preventDefault(); say("Choisissez d'abord vos dates d'arrivée et de départ."); return; }
try { sessionStorage.setItem("rv-resume", summary()); } catch (er) {}
});
var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(render, 150); });
setVilla((location.hash || "").slice(1), false);
}
var cmp = $("[data-cmp]");
if (cmp) {
var sel = ["azur", "alma"], links = $$("[data-pick]", cmp), verdict = $("[data-verdict]", cmp);
var cols = function (id) { return $$('[data-c="' + id + '"]', cmp); };
var nm = function (id) { return $('thead [data-c="' + id + '"]', cmp).textContent.trim(); };
var val = function (key, id) { var c = $('tr[data-k="' + key + '"] td[data-c="' + id + '"]', cmp); return c ? +c.getAttribute("data-n") : 0; };
var drawC = function () {
$$("[data-c]", cmp).forEach(function (el) { el.hidden = sel.indexOf(el.getAttribute("data-c")) < 0; el.classList.remove("is-best"); });
links.forEach(function (a) { var s = +a.closest("[data-slot]").getAttribute("data-slot"); a.classList.toggle("is-on", a.getAttribute("data-pick") === sel[s]); });
$$("tr[data-best]", cmp).forEach(function (tr) {
var cs = $$("td", tr).filter(function (c) { return !c.hidden; }); if (cs.length < 2) return;
var x = +cs[0].getAttribute("data-n"), y = +cs[1].getAttribute("data-n"); if (x === y) return;
(tr.getAttribute("data-best") === "max" ? (x > y ? cs[0] : cs[1]) : (x < y ? cs[0] : cs[1])).classList.add("is-best");
});
var a = sel[0], c = sel[1], s = [], d;
d = val("ch", a) - val("ch", c); if (d) s.push((d > 0 ? nm(a) : nm(c)) + " compte " + Math.abs(d) + " chambre" + (Math.abs(d) > 1 ? "s" : "") + " de plus.");
d = val("prix", a) - val("prix", c); if (d) s.push((d < 0 ? nm(a) : nm(c)) + " est moins chère de " + Math.abs(d) + " € par nuit (tarif de base).");
d = val("plage", a) - val("plage", c); if (d) s.push((d < 0 ? nm(a) : nm(c)) + " est la plus proche de la plage.");
verdict.textContent = s.join(" ");
};
links.forEach(function (a) {
a.addEventListener("click", function (e) {
e.preventDefault(); var s = +a.closest("[data-slot]").getAttribute("data-slot"), id = a.getAttribute("data-pick");
if (sel[1 - s] === id) sel[1 - s] = sel[s]; sel[s] = id; drawC();
});
});
drawC();
}
var ta = $(".lp-main textarea");
if (ta) { try { var r = sessionStorage.getItem("rv-resume"); if (r && !ta.value) { ta.value = r; ta.dispatchEvent(new Event("input", { bubbles: true })); } } catch (e) {} }
})();

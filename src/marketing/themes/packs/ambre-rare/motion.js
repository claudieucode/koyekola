/* Ambre Rare — fiches de dégustation (une fiche à la fois, le verre prend la robe) et niveau d'ambre qui monte lentement. Aucune dépendance.
   Sans JavaScript : toutes les fiches restent lisibles l'une sous l'autre, le verre garde sa couleur par défaut. */
(function () {
  var body = document.body;
  if (!body || body.getAttribute("data-kw-pack") !== "ambre-rare") return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  body.classList.add("ar-js");

  function fill(liquid) {
    if (!liquid || reduce) return;
    liquid.classList.remove("is-fill");
    void liquid.getBoundingClientRect();
    liquid.classList.add("is-fill");
  }

  function fiches(root) {
    var list = root.querySelector("[data-ambre-list]"), glassBox = root.querySelector("[data-ambre-glass]");
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll(".ar-fiche"));
    if (items.length < 2) return;
    var liquid = glassBox && glassBox.querySelector(".ar-liquid");
    var n = (window.__arN = (window.__arN || 0) + 1);
    var start = Math.max(1, Math.min(items.length, parseInt(body.getAttribute("data-pk-fiche"), 10) || 1)) - 1;
    var tabs = document.createElement("div"); tabs.className = "ar-tabs"; tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Choisir une fiche de dégustation");
    var buttons = items.map(function (it, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "ar-tab"; b.setAttribute("role", "tab");
      var sw = document.createElement("i"); sw.style.setProperty("--sw", it.getAttribute("data-robe") || "#c98a2b"); b.appendChild(sw);
      b.appendChild(document.createTextNode(it.getAttribute("data-nom") || "Fiche " + (i + 1)));
      it.id = "ar-f" + n + "-" + i; b.id = "ar-t" + n + "-" + i; b.setAttribute("aria-controls", it.id); it.setAttribute("role", "tabpanel"); it.setAttribute("aria-labelledby", b.id);
      b.addEventListener("click", function () { show(i, true); });
      b.addEventListener("keydown", function (e) {
        var k = e.key, j = i;
        if (k === "ArrowRight" || k === "ArrowDown") j = (i + 1) % items.length; else if (k === "ArrowLeft" || k === "ArrowUp") j = (i + items.length - 1) % items.length; else return;
        e.preventDefault(); show(j, true); buttons[j].focus();
      });
      tabs.appendChild(b); return b;
    });
    list.parentNode.insertBefore(tabs, list);
    function show(i, animate) {
      items.forEach(function (it, j) { it.hidden = j !== i; buttons[j].setAttribute("aria-selected", j === i ? "true" : "false"); buttons[j].tabIndex = j === i ? 0 : -1; });
      var col = items[i].getAttribute("data-robe");
      if (/^#[0-9a-f]{6}$/i.test(col || "")) root.style.setProperty("--ar-robe", col);
      if (animate) fill(liquid);
    }
    show(start, false);
  }

  function observe() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".ar-liquid"));
    if (!els.length) return;
    if (reduce || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-fill"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } }); }, { threshold: 0.4 });
    els.forEach(function (e) { io.observe(e); });
  }

  function init() {
    Array.prototype.slice.call(document.querySelectorAll("[data-ambre-fiches]")).forEach(fiches);
    observe();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

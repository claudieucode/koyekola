// FAQ (administration) : confirmation avant suppression (sans onsubmit en ligne) et compteur de caractères. Sans ce script, les formulaires fonctionnent tels quels.
(function () {
  [].forEach.call(document.querySelectorAll("form[data-confirm]"), function (f) {
    f.addEventListener("submit", function (e) { if (!window.confirm(f.getAttribute("data-confirm"))) e.preventDefault(); });
  });
  [].forEach.call(document.querySelectorAll("textarea[data-count]"), function (t) {
    var out = document.getElementById(t.getAttribute("data-count")), max = Number(t.getAttribute("maxlength")) || 5000;
    function show() { if (out) out.textContent = t.value.length + " / " + max; }
    t.addEventListener("input", show); show();
  });
})();

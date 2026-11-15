/* Permissions : mémorise les catégories ouvertes/fermées (le temps de la session) pendant le changement de rôle,
   et ajoute « Tout déplier / Tout replier ». Aucune permission n'est lue ni modifiée ici : présentation seulement. */
(function () {
  var root = document.querySelector("[data-perm-acc]"); if (!root) return;
  var KEY = "kola.perm.open", groups = [].slice.call(root.querySelectorAll("details[data-k]"));
  var saved = null; try { saved = JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (e) {}
  if (saved && typeof saved === "object") groups.forEach(function (d) { if (d.dataset.k in saved) d.open = !!saved[d.dataset.k]; });
  function save() { var o = {}; groups.forEach(function (d) { o[d.dataset.k] = d.open; }); try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  groups.forEach(function (d) { d.addEventListener("toggle", save); });
  var bar = document.createElement("div"); bar.className = "cp-acc-tools";
  [["Tout déplier", true], ["Tout replier", false]].forEach(function (b) {
    var el = document.createElement("button"); el.type = "button"; el.className = "btn btn-ghost btn-sm"; el.textContent = b[0];
    el.addEventListener("click", function () { groups.forEach(function (d) { d.open = b[1]; }); save(); }); bar.appendChild(el);
  });
  root.parentNode.insertBefore(bar, root);
})();

// Programme d'une formation (Chapitres) : replier, renommer, déplacer (souris, clavier, tactile), confirmer les suppressions.
// Sans JavaScript, tout reste utilisable : les boutons sont de vrais formulaires et le serveur répond par une redirection.
// Les changements d'ordre passent par une file : une seule requête à la fois, dans l'ordre des gestes, pour qu'un ordre ancien
// n'écrase jamais un ordre récent ; en cas d'échec, l'écran revient à l'état enregistré et le dit.
(function () {
  "use strict";
  var outline = document.querySelector(".builder-outline");
  var list = document.getElementById("sectionList");
  if (!outline || !list) return;
  var courseId = outline.dataset.courseId;
  var statusEl = outline.querySelector("[data-cur-status]");
  var queue = Promise.resolve();
  var statusTimer = null;

  function say(text, bad) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.classList.toggle("is-error", !!bad);
    clearTimeout(statusTimer);
    if (!bad) statusTimer = setTimeout(function () { statusEl.textContent = ""; }, 3500);
  }
  function post(url, body) {
    return fetch(url, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body || {}) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || j.ok === false) throw new Error(j.error || (r.status === 401 || r.status === 403 ? "Session expirée : reconnectez-vous." : "L'enregistrement a échoué."));
          return j;
        });
      }, function () { throw new Error("Connexion perdue : la modification n'a pas été enregistrée."); });
  }
  var blocks = function () { return Array.prototype.slice.call(list.querySelectorAll(".chapter-block")); };
  var rowsOf = function (block) { return Array.prototype.slice.call(block.querySelectorAll(".cur-lesson")); };
  var listOf = function (block) { return block.querySelector(".lesson-list"); };

  // ---- état de l'écran selon la structure ----
  function refresh() {
    var all = blocks(), totalLessons = 0, totalMin = 0;
    all.forEach(function (b, i) {
      var rows = rowsOf(b), mins = 0;
      rows.forEach(function (r) { mins += Number(r.dataset.min) || 0; });
      totalLessons += rows.length; totalMin += mins;
      b.querySelector("[data-cur-num]").textContent = i + 1;
      b.querySelector("[data-cur-num-sr]").textContent = i + 1;
      b.querySelector("[data-cur-meta]").textContent = rows.length + " sous-chapitre" + (rows.length > 1 ? "s" : "") + (mins ? " · " + mins + " min" : "");
      var ph = b.querySelector("[data-cur-lesson-empty]");
      if (!rows.length && !ph) { ph = document.createElement("p"); ph.className = "cur-lesson-empty"; ph.setAttribute("data-cur-lesson-empty", ""); ph.textContent = "Aucun sous-chapitre dans ce chapitre."; listOf(b).appendChild(ph); }
      if (rows.length && ph) ph.remove();
      var up = b.querySelector(".chapter-block-header [data-cur-move='up']"), down = b.querySelector(".chapter-block-header [data-cur-move='down']");
      up.disabled = i === 0; down.disabled = i === all.length - 1;
      rows.forEach(function (r, j) {
        r.querySelector("[data-cur-move='up']").disabled = i === 0 && j === 0;
        r.querySelector("[data-cur-move='down']").disabled = i === all.length - 1 && j === rows.length - 1;
      });
    });
    var sum = document.querySelector("[data-cur-summary]");
    if (sum) sum.textContent = all.length + " chapitre" + (all.length > 1 ? "s" : "") + " · " + totalLessons + " sous-chapitre" + (totalLessons > 1 ? "s" : "") + (totalMin ? " · " + (totalMin >= 60 ? Math.floor(totalMin / 60) + " h " + String(totalMin % 60).padStart(2, "0") : totalMin + " min") : "");
  }
  function snapshot() { return blocks().map(function (b) { return { block: b, rows: rowsOf(b) }; }); }
  function restore(snap) {
    snap.forEach(function (s) { list.appendChild(s.block); s.rows.forEach(function (r) { listOf(s.block).appendChild(r); }); });
    refresh();
  }
  function enqueue(job, snap, okText) {
    queue = queue.then(job).then(function () { say(okText); }, function (e) { restore(snap); say(e.message, true); });
  }
  function saveSections(snap) {
    enqueue(function () { return post("/formateur/cours/" + courseId + "/sections/reorder", { order: blocks().map(function (b) { return Number(b.dataset.sectionId); }) }); }, snap, "Ordre des chapitres enregistré.");
  }
  function saveLessons(blockSet, snap) {
    // Le chapitre de destination reçoit la liste complète ; les chapitres d'origine sont renumérotés par le serveur.
    var target = blockSet[0];
    enqueue(function () { return post("/formateur/sections/" + target.dataset.sectionId + "/lecons/reorder", { order: rowsOf(target).map(function (r) { return Number(r.dataset.lessonId); }) }); }, snap, "Ordre des sous-chapitres enregistré.");
  }

  // ---- replier / déplier (mémorisé par formation) ----
  var foldKey = "curFold:" + courseId;
  function loadFolded() { try { return JSON.parse(localStorage.getItem(foldKey) || "[]"); } catch (e) { return []; } }
  function saveFolded() { try { localStorage.setItem(foldKey, JSON.stringify(blocks().filter(function (b) { return b.classList.contains("is-folded"); }).map(function (b) { return b.dataset.sectionId; }))); } catch (e) { /* stockage indisponible */ } }
  function setFold(block, folded) {
    block.classList.toggle("is-folded", folded);
    var btn = block.querySelector("[data-cur-fold]"), title = block.dataset.title;
    btn.setAttribute("aria-expanded", folded ? "false" : "true");
    btn.setAttribute("aria-label", (folded ? "Déplier le chapitre " : "Replier le chapitre ") + title);
    block.querySelector(".chapter-body").hidden = folded;
  }
  var folded = loadFolded();
  blocks().forEach(function (b) {
    // le chapitre qui contient le sous-chapitre ouvert reste toujours déplié
    var holdsActive = !!b.querySelector(".cur-lesson.is-active");
    setFold(b, folded.indexOf(b.dataset.sectionId) >= 0 && !holdsActive);
  });
  var allBtn = outline.querySelector("[data-cur-toggle-all]");
  function syncAllBtn() { if (!allBtn) return; var every = blocks().every(function (b) { return b.classList.contains("is-folded"); }); allBtn.textContent = every ? "Tout déplier" : "Tout replier"; allBtn.setAttribute("aria-pressed", every ? "true" : "false"); }
  syncAllBtn();
  outline.addEventListener("click", function (e) {
    var fold = e.target.closest("[data-cur-fold]");
    if (fold) { var b = fold.closest(".chapter-block"); setFold(b, !b.classList.contains("is-folded")); saveFolded(); syncAllBtn(); return; }
    if (e.target.closest("[data-cur-toggle-all]")) {
      var target = !blocks().every(function (b) { return b.classList.contains("is-folded"); });
      blocks().forEach(function (b) { setFold(b, target && !b.querySelector(".cur-lesson.is-active")); });
      saveFolded(); syncAllBtn();
    }
    var ren = e.target.closest("[data-cur-rename]");
    if (ren) startRename(ren.closest(".chapter-block"), ren);
  });

  // ---- renommer un chapitre sur place ----
  function startRename(block, trigger) {
    var h = block.querySelector("[data-cur-title]");
    if (!h || block.querySelector(".cur-rename")) return;
    var input = document.createElement("input");
    input.type = "text"; input.className = "cur-rename"; input.value = block.dataset.title; input.maxLength = 120; input.setAttribute("aria-label", "Nouveau titre du chapitre");
    h.hidden = true; h.parentNode.insertBefore(input, h.nextSibling);
    input.focus(); input.select();
    var done = false;
    function finish(save) {
      if (done) return; done = true;
      var value = input.value.replace(/\s+/g, " ").trim();
      input.remove(); h.hidden = false;
      if (save && value && value !== block.dataset.title) {
        var before = block.dataset.title;
        applyTitle(block, value);
        queue = queue.then(function () { return post("/formateur/sections/" + block.dataset.sectionId + "/renommer", { title: value }); })
          .then(function (j) { applyTitle(block, j.title || value); say("Chapitre renommé."); }, function (err) { applyTitle(block, before); say(err.message, true); });
      } else if (save && !value) { say("Le titre du chapitre est obligatoire.", true); }
      trigger.focus();
    }
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); finish(true); } else if (e.key === "Escape") { e.preventDefault(); finish(false); } });
    input.addEventListener("blur", function () { finish(true); });
  }
  function applyTitle(block, title) {
    block.dataset.title = title;
    block.querySelector("[data-cur-title]").textContent = title;
    block.querySelector("[data-cur-fold]").setAttribute("aria-label", (block.classList.contains("is-folded") ? "Déplier le chapitre " : "Replier le chapitre ") + title);
    block.querySelectorAll(".chapter-block-header [data-cur-move]").forEach(function (b) { b.setAttribute("aria-label", (b.dataset.curMove === "up" ? "Monter le chapitre " : "Descendre le chapitre ") + title); });
    block.querySelector("[data-cur-rename]").setAttribute("aria-label", "Renommer le chapitre " + title);
    block.querySelector("form[data-cur-confirm]").dataset.confirmTitle = "Supprimer le chapitre « " + title + " » ?";
    block.querySelector("form[data-cur-confirm] button").setAttribute("aria-label", "Supprimer le chapitre " + title);
    var add = block.querySelector("[data-cur-add] input"); if (add) add.setAttribute("aria-label", "Ajouter un sous-chapitre au chapitre " + title);
  }

  // ---- monter / descendre (clavier, lecteur d'écran, tactile) ----
  outline.addEventListener("submit", function (e) {
    var form = e.target, btn = form.querySelector("[data-cur-move]");
    if (!btn) return;
    e.preventDefault();
    var dir = btn.dataset.curMove, snap = snapshot();
    var row = form.closest(".cur-lesson"), focusSel = null;
    if (row) {
      var block = row.closest(".chapter-block"), rows = rowsOf(block), at = rows.indexOf(row), all = blocks(), bi = all.indexOf(block);
      var targetBlock = block;
      if (dir === "up" && at > 0) rows[at - 1].before(row);
      else if (dir === "down" && at < rows.length - 1) rows[at + 1].after(row);
      else if (dir === "up" && bi > 0) { targetBlock = all[bi - 1]; listOf(targetBlock).appendChild(row); if (targetBlock.classList.contains("is-folded")) { setFold(targetBlock, false); saveFolded(); syncAllBtn(); } }
      else if (dir === "down" && bi < all.length - 1) { targetBlock = all[bi + 1]; listOf(targetBlock).insertBefore(row, listOf(targetBlock).querySelector(".cur-lesson")); if (targetBlock.classList.contains("is-folded")) { setFold(targetBlock, false); saveFolded(); syncAllBtn(); } }
      else return;
      var empty = listOf(targetBlock).querySelector("[data-cur-lesson-empty]"); if (empty) empty.remove();
      refresh(); saveLessons([targetBlock], snap);
      focusSel = ".cur-lesson[data-lesson-id='" + row.dataset.lessonId + "'] [data-cur-move='" + dir + "']";
    } else {
      var sec = form.closest(".chapter-block"), arr = blocks(), i = arr.indexOf(sec);
      if (dir === "up" && i > 0) arr[i - 1].before(sec); else if (dir === "down" && i < arr.length - 1) arr[i + 1].after(sec); else return;
      refresh(); saveSections(snap);
      focusSel = ".chapter-block[data-section-id='" + sec.dataset.sectionId + "'] .chapter-block-header [data-cur-move='" + dir + "']";
    }
    var next = outline.querySelector(focusSel);
    // le bouton peut être désactivé au bout de la liste : le focus passe alors à son vis-à-vis
    if (next && next.disabled) next = outline.querySelector(focusSel.replace("'" + dir + "'", "'" + (dir === "up" ? "down" : "up") + "'"));
    if (next) next.focus();
  }, true);

  // ---- glisser-déposer à la souris (les boutons ci-dessus couvrent clavier et tactile) ----
  var dragged = null, dragKind = null, dragSnap = null;
  function afterElement(container, y, selector) {
    return Array.prototype.slice.call(container.querySelectorAll(selector)).reduce(function (closest, child) {
      var box = child.getBoundingClientRect(), offset = y - box.top - box.height / 2;
      return offset < 0 && offset > closest.offset ? { offset: offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
  }
  list.addEventListener("dragstart", function (e) {
    var row = e.target.closest && e.target.closest(".cur-lesson"), block = e.target.closest && e.target.closest(".chapter-block");
    if (e.target.closest && e.target.closest("input, button, textarea")) { e.preventDefault(); return; }
    dragSnap = snapshot();
    if (row) { dragged = row; dragKind = "lesson"; e.stopPropagation(); } else if (block) { dragged = block; dragKind = "chapter"; } else return;
    dragged.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", ""); } catch (err) { /* Firefox exige une donnée */ }
  });
  list.addEventListener("dragend", function () {
    if (dragged) dragged.classList.remove("dragging");
    list.querySelectorAll(".drag-over").forEach(function (n) { n.classList.remove("drag-over"); });
    dragged = null; dragKind = null;
  });
  list.addEventListener("dragover", function (e) {
    if (!dragged) return;
    e.preventDefault();
    // plan long : le défilement suit le pointeur près des bords de la colonne
    var box = outline.getBoundingClientRect();
    if (e.clientY < box.top + 36) outline.scrollTop -= 14; else if (e.clientY > box.bottom - 36) outline.scrollTop += 14;
    if (dragKind === "chapter") {
      var afterB = afterElement(list, e.clientY, ".chapter-block:not(.dragging)");
      if (afterB == null) list.appendChild(dragged); else if (afterB !== dragged.nextElementSibling) list.insertBefore(dragged, afterB);
    } else {
      var overBlock = e.target.closest(".chapter-block");
      if (!overBlock) return;
      var l = listOf(overBlock);
      list.querySelectorAll(".drag-over").forEach(function (n) { if (n !== l) n.classList.remove("drag-over"); });
      l.classList.add("drag-over");
      var afterR = afterElement(l, e.clientY, ".cur-lesson:not(.dragging)");
      if (afterR == null) l.appendChild(dragged); else if (afterR !== dragged.nextElementSibling) l.insertBefore(dragged, afterR);
    }
  });
  list.addEventListener("drop", function (e) {
    if (!dragged) return;
    e.preventDefault();
    var snap = dragSnap, kind = dragKind, node = dragged;
    if (kind === "chapter") { refresh(); saveSections(snap); }
    else { var tb = node.closest(".chapter-block"); var empty = listOf(tb).querySelector("[data-cur-lesson-empty]"); if (empty) empty.remove(); refresh(); saveLessons([tb], snap); }
  });

  // ---- doubles envois : un ajout n'est envoyé qu'une fois ----
  outline.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f.matches || !f.matches("[data-cur-add]")) return;
    var input = f.querySelector("input");
    if (!input.value.trim()) { e.preventDefault(); return; }
    if (f.dataset.sending) { e.preventDefault(); return; }
    f.dataset.sending = "1"; setTimeout(function () { input.readOnly = true; }, 0);
  });

  // ---- confirmation des suppressions (dialogue natif <dialog> : focus, Échap et lecteurs d'écran gérés) ----
  var dialog = document.getElementById("curDialog");
  var pending = null;
  document.addEventListener("submit", function (e) {
    var form = e.target;
    if (!form.matches || !form.matches("form[data-cur-confirm]") || form.dataset.confirmed === "1") return;
    if (!dialog || typeof dialog.showModal !== "function") { if (!window.confirm(form.dataset.confirmTitle || "Supprimer ?")) e.preventDefault(); return; }
    e.preventDefault();
    pending = form;
    document.getElementById("curDialogTitle").textContent = form.dataset.confirmTitle || "Supprimer ?";
    document.getElementById("curDialogText").textContent = form.dataset.confirmText || "";
    dialog.showModal();
  }, true);
  if (dialog) dialog.addEventListener("close", function () {
    var form = pending; pending = null;
    if (form && dialog.returnValue === "ok") { form.dataset.confirmed = "1"; form.submit(); }
    else if (form) { var b = form.querySelector("button"); if (b) b.focus(); }
    dialog.returnValue = "";
  });

  refresh();
})();

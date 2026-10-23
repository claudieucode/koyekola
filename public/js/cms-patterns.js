// KOLAKISA CMS → Apparence → Patterns : bibliothèque de compositions d'un site. Données = JSON #pt-data posé par le serveur ; toute écriture passe par le serveur
// (qui revalide, limite chaque action au site et refuse un identifiant d'un autre site). Aucun succès n'est annoncé avant sa réponse.
(function () {
  var root = document.querySelector("[data-pt-root]");
  if (!root) return;
  var $ = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { var v = attrs[k]; if (v === false || v == null) return; if (k === "text") el.textContent = v; else if (k === "onclick") el.addEventListener("click", v); else el.setAttribute(k, v === true ? "" : v); });
    [].concat(kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  var S = JSON.parse(document.getElementById("pt-data").textContent);
  var source = "all", cat = "", q = "", busy = false;
  var liveEl = $("[data-pt-live]");
  function say(t) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = t; }, 30); }
  function banner(text) { var b = $("[data-pt-banner]"); $("[data-pt-banner-text]").textContent = text || ""; b.hidden = !text; }
  var norm = function (t) { return String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };

  // ---------- Appels au serveur ----------
  function post(path, body) {
    return fetch(S.base + "/" + path + S.query, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(Object.assign({ site: S.siteId === null ? "" : String(S.siteId) }, body)) })
      .then(function (res) { return res.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = null; } if (!res.ok || !d || !d.ok) { var err = new Error((d && d.error) || (res.status === 403 ? "Vous n'avez pas le droit de faire cela." : res.status === 401 ? "Votre session a expiré : reconnectez-vous." : "Le serveur n'a pas pu traiter la demande (erreur " + res.status + ").")); err.status = res.status; throw err; } return d; }); },
        function () { throw new Error("Connexion impossible : vérifiez votre réseau. Rien n'a été modifié."); });
  }
  function apply(d) { if (d.builtin) S.builtin = d.builtin; if (d.mine) S.mine = d.mine; if (d.trash) S.trash = d.trash; if (d.pages) S.pages = d.pages; renderAll(); }

  // ---------- Liste ----------
  var SOURCES = [["all", "Tous"], ["builtin", "Intégrés"], ["mine", "Mes compositions"], ["trash", "Corbeille"]];
  function items() {
    var list = [];
    if (source === "all" || source === "builtin") list = list.concat(S.builtin);
    if (source === "all" || source === "mine") list = list.concat(S.mine);
    if (source === "trash") return S.trash.map(function (t) { return { ref: "trash:" + t.id, id: t.id, label: t.label, description: t.description, category: "Corbeille", sections: 0, elements: 0, source: "trash", deletedAt: t.deletedAt }; });
    return list.filter(function (p) { return (!cat || p.category === cat) && (!q || norm(p.label + " " + p.category + " " + p.description).indexOf(norm(q)) >= 0); });
  }
  function renderFilters() {
    var box = $("[data-pt-sources]"); box.textContent = "";
    SOURCES.forEach(function (s) {
      var n = s[0] === "builtin" ? S.builtin.length : s[0] === "mine" ? S.mine.length : s[0] === "trash" ? S.trash.length : S.builtin.length + S.mine.length;
      var b = h("button", { type: "button", role: "tab", "aria-selected": String(source === s[0]), "data-pt-source": s[0] }, [s[1] + " ", h("span", { class: "mk-st-count", text: String(n) })]);
      b.addEventListener("click", function () { source = s[0]; cat = ""; renderAll(); });
      box.appendChild(b);
    });
    var sel = $("[data-pt-cat]"), cats = {}; (source === "trash" ? [] : (source === "builtin" ? S.builtin : source === "mine" ? S.mine : S.builtin.concat(S.mine))).forEach(function (p) { cats[p.category] = 1; });
    sel.textContent = ""; sel.appendChild(h("option", { value: "", text: "Toutes les catégories" })); Object.keys(cats).sort().forEach(function (c) { sel.appendChild(h("option", { value: c, text: c, selected: cat === c ? true : null })); }); sel.disabled = source === "trash";
  }
  var io = window.IntersectionObserver ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var f = e.target; if (!f.getAttribute("src")) f.setAttribute("src", f.getAttribute("data-src")); io.unobserve(f); } }); }, { rootMargin: "300px" }) : null;
  function card(p) {
    var thumb = null;
    if (p.source !== "trash") { var f = h("iframe", { title: "", "aria-hidden": "true", tabindex: "-1", "data-src": S.base + "/apercu?ref=" + encodeURIComponent(p.ref) + (S.siteId ? "&site=" + S.siteId : ""), referrerpolicy: "same-origin", scrolling: "no" }); thumb = h("div", { class: "mk-pt-thumb" }, f); if (io) io.observe(f); else f.setAttribute("src", f.getAttribute("data-src")); }
    var actions = h("div", { class: "mk-pt-card-actions" });
    if (p.source === "trash") {
      if (S.can.manage) { actions.appendChild(h("button", { type: "button", class: "mk-wd-btn", text: "Restaurer", onclick: function () { run("restaurer", { id: p.id }, "« " + p.label + " » restauré."); } })); actions.appendChild(h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--danger", text: "Supprimer définitivement", onclick: function () { if (confirm("Supprimer définitivement « " + p.label + " » ? Cette action est irréversible (les pages qui l'ont déjà inséré ne changent pas).")) run("purger", { id: p.id }, "Supprimé définitivement."); } })); }
    } else {
      actions.appendChild(h("button", { type: "button", class: "mk-wd-btn", "aria-label": "Aperçu de " + p.label, text: "Aperçu", onclick: function () { openPreview(p); } }));
      actions.appendChild(h("button", { type: "button", class: "mk-wd-btn mk-wd-btn--primary", "aria-label": "Insérer " + p.label + " dans une page", text: "Insérer", disabled: !S.can.insert ? true : null, onclick: function () { openInsert(p); } }));
      if (p.source === "mine" && S.can.manage) {
        var more = h("details", { class: "mk-pt-more" }, [h("summary", { text: "Plus", "aria-label": "Plus d'actions pour " + p.label }), h("div", { class: "mk-pt-moremenu" }, [
          h("button", { type: "button", text: "Renommer", onclick: function () { openRename(p); } }),
          h("button", { type: "button", text: "Dupliquer", onclick: function () { run("dupliquer", { id: p.id }, "« " + p.label + " » dupliqué."); } }),
          h("button", { type: "button", text: "Mettre à la corbeille", onclick: function () { if (confirm("Mettre « " + p.label + " » à la corbeille ? Les pages qui l'ont déjà inséré ne changent pas ; vous pourrez le restaurer.")) run("supprimer", { id: p.id }, "« " + p.label + " » mis à la corbeille."); } })])]);
        actions.appendChild(more);
      }
    }
    return h("li", { class: "mk-pt-card", "data-ref": p.ref }, [thumb, h("div", { class: "mk-pt-card-body" }, [h("h3", { text: p.label }), h("p", { class: "mk-pt-meta" }, [h("span", { class: "mk-nm-chip" + (p.source === "mine" ? " is-info" : ""), text: p.source === "builtin" ? "Intégré" : p.source === "mine" ? "Mon site" : "Corbeille" }), p.source === "trash" ? " supprimé le " + p.deletedAt : " " + p.category + " · " + p.sections + " section" + (p.sections > 1 ? "s" : "") + " · " + p.elements + " élément" + (p.elements > 1 ? "s" : "")]), p.description ? h("p", { class: "field-hint", text: p.description }) : null, actions])]);
  }
  // Vignettes : la page est rendue à 1200 px de large puis réduite à la largeur de la carte (ratio constant)
  function fitThumbs() { $$(".mk-pt-thumb").forEach(function (t) { var w = t.clientWidth || 300, sc = w / 1200; t.style.height = Math.round(760 * sc) + "px"; var f = t.querySelector("iframe"); if (f) f.style.transform = "scale(" + sc + ")"; }); }
  window.addEventListener("resize", fitThumbs);
  function renderAll() {
    $("[data-pt-create]").disabled = !S.can.manage || !S.pages.length;
    renderFilters();
    var list = items(), grid = $("[data-pt-grid]"); grid.textContent = "";
    list.forEach(function (p) { grid.appendChild(card(p)); });
    $("[data-pt-count]").textContent = list.length + " pattern" + (list.length > 1 ? "s" : "") + (q || cat ? " correspondant" + (list.length > 1 ? "s" : "") + " à votre recherche" : "");
    var e = $("[data-pt-empty]");
    fitThumbs(); e.hidden = list.length > 0; e.textContent = source === "trash" ? "La corbeille est vide." : source === "mine" && !S.mine.length ? "Vous n'avez encore enregistré aucune composition. Utilisez « Enregistrer une composition » pour réutiliser des sections d'une de vos pages." : "Aucun pattern ne correspond à votre recherche.";
  }
  function run(path, body, okMsg) {
    if (busy) return; busy = true; banner("");
    return post(path, body).then(function (d) { busy = false; apply(d); say(okMsg); return d; }, function (e) { busy = false; banner(e.message); throw e; }).catch(function () {});
  }
  $("[data-pt-search]").addEventListener("input", function (e) { q = e.target.value.trim(); renderAll(); });
  $("[data-pt-cat]").addEventListener("change", function (e) { cat = e.target.value; renderAll(); });

  // ---------- Fenêtres ----------
  function open(d) { if (d.showModal) d.showModal(); else d.setAttribute("open", ""); }
  function closeAll(d) { if (d.close) d.close(); else d.removeAttribute("open"); }
  // Échap ferme la fenêtre ouverte (même si le focus est dans l'aperçu ou sur un bouton)
  document.addEventListener("keydown", function (e) { if (e.key !== "Escape") return; var d = $$("dialog").filter(function (x) { return x.open; })[0]; if (d) { e.preventDefault(); closeAll(d); } });
  $$("[data-pt-close]").forEach(function (b) { b.addEventListener("click", function () { closeAll(b.closest("dialog")); }); });
  var W = { desktop: 0, tablet: 768, mobile: 390 }, prevRef = null;
  function openPreview(p) {
    prevRef = p; var d = $("[data-pt-dlg-preview]"); $("[data-pt-prev-title]").textContent = "Aperçu : " + p.label;
    var fr = $("[data-pt-prev-frame]"); fr.setAttribute("src", S.base + "/apercu?ref=" + encodeURIComponent(p.ref) + (S.siteId ? "&site=" + S.siteId : ""));
    $("[data-pt-prev-insert]").hidden = !S.can.insert; setDevice("desktop"); open(d);
  }
  function setDevice(dev) {
    $$("[data-pt-device]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-pt-device") === dev)); });
    var fr = $("[data-pt-prev-frame]"), wrap = $("[data-pt-prevwrap]"); fr.style.width = W[dev] ? W[dev] + "px" : "100%";
    var avail = wrap.clientWidth || 1, sc = W[dev] ? Math.min(1, avail / W[dev]) : 1; fr.style.transform = sc < 1 ? "scale(" + sc + ")" : "none"; fr.style.transformOrigin = "top left"; fr.style.height = Math.round(560 / sc) + "px"; wrap.style.height = "560px";
  }
  $$("[data-pt-device]").forEach(function (b) { b.addEventListener("click", function () { setDevice(b.getAttribute("data-pt-device")); }); });
  $("[data-pt-prev-insert]").addEventListener("click", function () { closeAll($("[data-pt-dlg-preview]")); openInsert(prevRef); });

  var insRef = null;
  function openInsert(p) {
    insRef = p; var d = $("[data-pt-dlg-insert]"), sel = $("[data-pt-ins-page]"); $("[data-pt-ins-err]").hidden = true;
    $("[data-pt-ins-what]").textContent = "Pattern : « " + p.label + " » — " + p.sections + " section" + (p.sections > 1 ? "s" : "") + ".";
    sel.textContent = ""; S.pages.forEach(function (pg) { sel.appendChild(h("option", { value: String(pg.id), text: pg.name + (pg.hasDraft ? " (brouillon en cours)" : "") })); });
    if (!S.pages.length) { $("[data-pt-ins-err]").hidden = false; $("[data-pt-ins-err]").textContent = "Ce site n'a encore aucune page : créez-en une dans Pages."; }
    refreshAfter(); $$("input[name=pos]", d)[0].checked = true; $("[data-pt-ins-after]").disabled = true; open(d);
  }
  function refreshAfter() {
    var pg = S.pages.filter(function (x) { return String(x.id) === $("[data-pt-ins-page]").value; })[0], a = $("[data-pt-ins-after]"); a.textContent = "";
    (pg ? pg.sections : []).forEach(function (s) { a.appendChild(h("option", { value: String(s.index), text: (s.index + 1) + ". " + s.label })); });
    $$("input[name=pos]")[2].disabled = !pg || !pg.sections.length;
  }
  $("[data-pt-ins-page]").addEventListener("change", refreshAfter);
  $$("input[name=pos]").forEach(function (r) { r.addEventListener("change", function () { $("[data-pt-ins-after]").disabled = r.value !== "after" || !r.checked; if (r.checked && r.value !== "after") $("[data-pt-ins-after]").disabled = true; }); });
  $("[data-pt-form-insert]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return; busy = true; var err = $("[data-pt-ins-err]"); err.hidden = true;
    var pos = ($$("input[name=pos]").filter(function (r) { return r.checked; })[0] || {}).value || "end";
    post("inserer", { ref: insRef.ref, pageId: Number($("[data-pt-ins-page]").value), position: pos, after: pos === "after" ? Number($("[data-pt-ins-after]").value) : null }).then(function (d) {
      busy = false; apply(d); closeAll($("[data-pt-dlg-insert]")); var i = d.inserted;
      banner(""); var b = $("[data-pt-banner]"); $("[data-pt-banner-text]").textContent = i.added + " section" + (i.added > 1 ? "s" : "") + " ajoutée" + (i.added > 1 ? "s" : "") + " au brouillon de la page « " + i.pageName + " » (position " + (i.at + 1) + "). Rien n'est publié. "; b.hidden = false;
      b.querySelector("[data-pt-open]") && b.querySelector("[data-pt-open]").remove(); $("[data-pt-banner-text]").appendChild(h("a", { href: S.links.editor + "/" + i.pageId + "/editeur", "data-pt-open": "", text: "Ouvrir dans l'éditeur →" })); say("Pattern inséré dans la page.");
    }, function (x) { busy = false; err.textContent = x.message; err.hidden = false; });
  });

  function openCreate() {
    var d = $("[data-pt-dlg-create]"), sel = $("[data-pt-cr-page]"); $("[data-pt-cr-err]").hidden = true; $("[data-pt-cr-name]").value = ""; $("[data-pt-cr-desc]").value = "";
    sel.textContent = ""; S.pages.forEach(function (pg) { sel.appendChild(h("option", { value: String(pg.id), text: pg.name })); }); crSections(); open(d);
  }
  function crSections() {
    var pg = S.pages.filter(function (x) { return String(x.id) === $("[data-pt-cr-page]").value; })[0], box = $("[data-pt-cr-sections]"); box.textContent = "";
    if (!pg || !pg.sections.length) { box.appendChild(h("p", { class: "field-hint", text: "Cette page n'a aucune section." })); return; }
    pg.sections.forEach(function (s) { var id = "pt-cs-" + s.index; box.appendChild(h("label", { for: id, class: "mk-cms-check" }, [h("input", { type: "checkbox", id: id, value: String(s.index) }), " " + (s.index + 1) + ". " + s.label])); });
  }
  $("[data-pt-cr-page]").addEventListener("change", crSections); $("[data-pt-create]").addEventListener("click", openCreate);
  $("[data-pt-form-create]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return; busy = true; var err = $("[data-pt-cr-err]"); err.hidden = true;
    var idx = $$("[data-pt-cr-sections] input:checked").map(function (c) { return Number(c.value); });
    post("creer", { pageId: Number($("[data-pt-cr-page]").value), sections: idx, name: $("[data-pt-cr-name]").value, description: $("[data-pt-cr-desc]").value }).then(function (d) { busy = false; apply(d); closeAll($("[data-pt-dlg-create]")); source = "mine"; renderAll(); say("Composition enregistrée."); },
      function (x) { busy = false; err.textContent = x.message; err.hidden = false; });
  });
  var rnId = null;
  function openRename(p) { rnId = p.id; $("[data-pt-rn-name]").value = p.label; $("[data-pt-rn-desc]").value = p.description || ""; $("[data-pt-rn-err]").hidden = true; open($("[data-pt-dlg-rename]")); }
  $("[data-pt-form-rename]").addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return; busy = true; var err = $("[data-pt-rn-err]"); err.hidden = true;
    post("renommer", { id: rnId, name: $("[data-pt-rn-name]").value, description: $("[data-pt-rn-desc]").value }).then(function (d) { busy = false; apply(d); closeAll($("[data-pt-dlg-rename]")); say("Pattern renommé."); }, function (x) { busy = false; err.textContent = x.message; err.hidden = false; });
  });

  // ---------- Démarrage ----------
  if (S.readOnly) banner("Ce site est archivé ou supprimé : consultation seule.");
  $("[data-pt-loading]").hidden = true; $("[data-pt-main]").hidden = false; renderAll();
})();

// KOLAKISA CMS → Médiathèque : rubriques calculées (Accueil, Doublons, Stockage). Les chiffres viennent du serveur (stockage.json, doublons.json, liste.json) : rien n'est simulé.
(function () {
  "use strict";
  var MX = window.MX; if (!MX) return;
  var K = MX.K, h = MX.h, BASE = MX.base, plural = MX.plural;
  var fmt = K.fmtSize;
  var COLORS = { image: "#2f6fb5", video: "#7a5bc7", audio: "#e08a2b", pdf: "#d1473f", document: "#2e9a6a", lottie: "#d6589b" };
  var TYPE = { image: "Images", video: "Vidéos", audio: "Audio", pdf: "PDF", document: "Documents", lottie: "Animations" };
  var seq = 0;
  var thumbOf = function (m) { return m.type === "image" ? h("img", { src: m.thumb || m.path, alt: "", loading: "lazy", decoding: "async" }) : h("span", { class: "mk-ml-badge", text: K.badge(m) }); };
  var card = function (value, label) { return h("div", { class: "mx-card" }, [h("strong", { text: value }), h("span", { text: label })]); };

  // ---------------------------------------------------------------- Accueil
  function accueil(el) {
    var my = ++seq; el.textContent = "";
    var cfg = MX.cfg();
    Promise.all([K.api("GET", BASE + "/stockage.json"), K.list({ recents: 1, limite: 12 }), K.list({ utilise: 1, limite: 12 }), K.list({ favoris: 1, limite: 12 })]).then(function (r) {
      if (my !== seq) return;
      var st = r[0];
      el.appendChild(h("div", { class: "mx-cards" }, [card(String(st.files), st.files > 1 ? "fichiers" : "fichier"), card(String(st.folders), st.folders > 1 ? "dossiers" : "dossier"), card(fmt(st.bytes), "espace utilisé"), card(String(st.trash.files), "à la corbeille")]));
      var actions = h("div", { class: "mx-info-actions" });
      if (cfg.canUpload) actions.appendChild(h("button", { type: "button", class: "btn btn-primary btn-sm", "data-ml-browse": "", text: "Ajouter un fichier média" }));
      if (cfg.canWrite && cfg.scoped) actions.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", "data-mx-new-folder": "", text: "Nouveau dossier" }));
      actions.appendChild(h("a", { class: "btn btn-outline btn-sm", href: MX.spaceBase + "?section=stockage", text: "Voir le stockage" }));
      el.appendChild(actions);
      var strip = function (title, res, href) {
        if (!res.items.length) return;
        var row = h("div", { class: "mx-strip" });
        res.items.forEach(function (m) { row.appendChild(h("button", { type: "button", class: "mx-home-item", "data-mx-open-media": m.id, title: m.name }, [h("span", { class: "mx-thumb" }, thumbOf(m)), h("span", { class: "mx-name", text: m.name }), h("span", { class: "mx-meta", text: (K.TYPE_LABELS[m.type] || "Fichier") + " · " + fmt(m.size) })])); });
        el.appendChild(h("div", { class: "mx-nav-head" }, [h("h2", { class: "mx-sec-title", text: title }), h("a", { href: href, class: "btn btn-ghost btn-sm", text: "Tout voir" })])); el.appendChild(row);
      };
      strip("Récemment ajoutés", r[1], MX.spaceBase + "?recents=1"); strip("Récemment utilisés dans les éditeurs", r[2], MX.spaceBase + "?utilise=1"); strip("Favoris", r[3], MX.spaceBase + "?favoris=1");
      if (!r[1].items.length && !r[3].items.length) el.appendChild(h("p", { class: "mx-empty-info", text: "Votre médiathèque est vide : importez vos premiers fichiers pour les retrouver ici." }));
      el.appendChild(h("p", { class: "mx-empty-info", text: "« Récemment utilisés » liste les fichiers que vous avez choisis dans un éditeur (pages, articles…)." }));
    }, function (e) { el.textContent = MX.errMsg(e); });
  }
  document.addEventListener("click", function (e) { var b = e.target.closest("[data-mx-open-media]"); if (!b || !MX.root.contains(b)) return; var id = Number(b.getAttribute("data-mx-open-media")); K.detail(id).then(function (d) { if (window.MXPreview) window.MXPreview.open([d.media], 0); }); });


  // ---------------------------------------------------------------- Historique des opérations (lecture seule : le journal ne permet pas d'annuler)
  function historique(el) {
    var my = ++seq; el.textContent = "";
    var action = "", list = h("ul", { class: "mx-hist", "aria-live": "polite" }), more = h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Charger la suite", hidden: "" }), note = h("p", { class: "mx-empty-info", text: "Ce journal garde la trace des opérations. Rien n'est annulé d'ici : pour revenir en arrière, utilisez la corbeille (restauration) ou déplacez de nouveau les éléments." });
    var sel = h("select", { "aria-label": "Filtrer par type d'opération", onchange: function () { action = sel.value; list.textContent = ""; load(null); } }, [h("option", { value: "", text: "Toutes les opérations" })]);
    el.appendChild(h("div", { class: "mx-inline" }, [h("label", { class: "sr-only", for: "mx-hist-f", text: "Type d'opération" }), sel])); sel.id = "mx-hist-f";
    el.appendChild(list); el.appendChild(h("div", { class: "mx-pager" }, more)); el.appendChild(note);
    var when = function (at) { var d = new Date(String(at).replace(" ", "T") + "Z"); return isNaN(d) ? at : d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }); };
    var filled = false, nextId = null;
    function load(before) {
      K.api("GET", BASE + "/historique.json?limite=40" + (before ? "&avant=" + before : "") + (action ? "&action=" + encodeURIComponent(action) : "")).then(function (r) {
        if (my !== seq) return;
        if (!filled) { r.actions.forEach(function (a) { sel.appendChild(h("option", { value: a.key, text: a.label })); }); filled = true; }
        if (!r.items.length && !before) list.appendChild(h("li", { class: "mx-empty-info", text: "Aucune opération enregistrée pour le moment." }));
        r.items.forEach(function (i) { list.appendChild(h("li", { class: "mx-hist-row" }, [h("span", { class: "mx-hist-what" }, [h("strong", { text: i.label }), i.target ? " — " + i.target : "", i.count > 1 ? " (" + i.count + " éléments)" : ""]), h("span", { class: "mx-hist-meta", text: i.user + " · " + when(i.at) })])); });
        nextId = r.next; more.hidden = !nextId;
      }, function (e) { list.textContent = ""; list.appendChild(h("li", { text: MX.errMsg(e) })); });
    }
    more.addEventListener("click", function () { if (nextId) load(nextId); });
    load(null);
  }

  // ---------------------------------------------------------------- Stockage
  function stockage(el) {
    var my = ++seq; el.textContent = "";
    K.api("GET", BASE + "/stockage.json").then(function (s) {
      if (my !== seq) return;
      var saved = Math.max(0, s.bytes - s.uniqueBytes);
      el.appendChild(h("div", { class: "mx-cards" }, [card(String(s.files), s.files > 1 ? "fichiers" : "fichier"), card(String(s.folders), s.folders > 1 ? "dossiers" : "dossier"), card(fmt(s.bytes), "espace logique utilisé"), card(fmt(saved), "récupérable sans les doublons"), card(fmt(s.trash.bytes), "dans la corbeille (" + s.trash.files + ")")]));
      el.appendChild(h("p", { class: "mx-empty-info", text: s.note }));
      var al = s.alerts || {};
      if (al.level === "crit" || al.level === "warn") el.appendChild(h("p", { class: "mx-banner is-" + al.level, role: "alert", text: (al.level === "crit" ? "Seuil critique dépassé : " : "Seuil d'avertissement dépassé : ") + fmt(s.bytes) + " utilisés (" + (al.level === "crit" ? al.critMb : al.warnMb) + " Mo fixés)." }));
      if (al.editable && MX.cfg().canWrite) {
        var w = h("input", { type: "number", min: "0", inputmode: "numeric", id: "mx-warn", value: al.warnMb || "", placeholder: "désactivé", style: "width:120px" }), c = h("input", { type: "number", min: "0", inputmode: "numeric", id: "mx-crit", value: al.critMb || "", placeholder: "désactivé", style: "width:120px" });
        el.appendChild(h("details", { class: "mx-alerts" }, [h("summary", { text: "Alertes de stockage" }), h("p", { class: "mx-theme-note", text: "Kolakisa ne connaît pas la capacité de votre hébergement : fixez vous-même vos seuils (en Mo, comptés sur la taille des fichiers enregistrés). 0 ou vide = désactivé." }),
          h("form", { class: "mx-inline", onsubmit: function (ev) { ev.preventDefault(); K.api("POST", BASE + "/stockage/alertes", { warn_mb: w.value, crit_mb: c.value }).then(function () { MX.toast("Seuils enregistrés.", "ok"); stockage(el); MX.refresh(); }, function (er) { MX.toast(MX.errMsg(er), "error"); }); } }, [h("label", { for: "mx-warn", text: "Avertir à partir de (Mo) " }), w, h("label", { for: "mx-crit", text: " Critique à partir de (Mo) " }), c, h("button", { type: "submit", class: "btn btn-primary btn-sm", text: "Enregistrer" })])]));
      }
      // Répartition par type
      var total = Math.max(1, s.bytes);
      el.appendChild(h("h2", { class: "mx-sec-title", text: "Répartition par type" }));
      var stack = h("div", { class: "mx-stack", role: "img", "aria-label": "Répartition de l'espace par type de fichier" });
      s.byType.forEach(function (t) { stack.appendChild(h("span", { style: "width:" + (t.bytes / total * 100).toFixed(2) + "%;background:" + (COLORS[t.type] || "#6b7a8a"), title: (TYPE[t.type] || t.type) + " : " + fmt(t.bytes) })); });
      el.appendChild(stack);
      var legend = h("ul", { class: "mx-legend" }); s.byType.forEach(function (t) { legend.appendChild(h("li", {}, [h("i", { style: "background:" + (COLORS[t.type] || "#6b7a8a") }), (TYPE[t.type] || t.type) + " — " + fmt(t.bytes) + " (" + plural(t.count, "fichier", "fichiers") + ")"])); }); el.appendChild(legend);
      var bars = h("ul", { class: "mx-bars" });
      s.byType.forEach(function (t) { bars.appendChild(h("li", {}, [h("a", { href: MX.spaceBase + "?type=" + (t.type === "pdf" || t.type === "document" ? "documents" : t.type), text: TYPE[t.type] || t.type }), h("div", { class: "mx-bar" }, h("span", { style: "width:" + (t.bytes / total * 100).toFixed(1) + "%" })), h("span", { text: fmt(t.bytes) })])); });
      if (s.byType.length) el.appendChild(bars);
      // Évolution : espace cumulé par mois d'ajout
      if (s.monthly.length > 1) {
        el.appendChild(h("h2", { class: "mx-sec-title", text: "Évolution de l'espace utilisé (fichiers encore présents, par mois d'ajout)" }));
        var acc = 0, cum = s.monthly.map(function (m) { acc += m.bytes; return { month: m.month, bytes: acc }; }), top = cum[cum.length - 1].bytes || 1;
        var spark = h("div", { class: "mx-spark", role: "img", "aria-label": "Espace cumulé par mois" }); cum.slice(-24).forEach(function (c) { spark.appendChild(h("span", { style: "height:" + Math.max(4, c.bytes / top * 100) + "%", title: c.month + " : " + fmt(c.bytes) + " cumulés" })); }); el.appendChild(spark);
        el.appendChild(h("p", { class: "mx-empty-info", text: "L'historique réel (fichiers supprimés depuis) n'est pas conservé : cette courbe reconstitue l'espace des fichiers actuels selon leur date d'ajout." }));
      }
      // Fichiers volumineux : recherche par taille et type
      el.appendChild(h("h2", { class: "mx-sec-title", text: "Rechercher les fichiers volumineux" }));
      var mb = h("input", { type: "number", min: "1", value: "5", id: "mx-bigmb", "aria-label": "Taille minimale en Mo", style: "width:90px" });
      var typeSel = h("select", { "aria-label": "Type" }, [["", "Tous les types"], ["image", "Images"], ["video", "Vidéos"], ["audio", "Audio"], ["documents", "Documents"]].map(function (o) { return h("option", { value: o[0], text: o[1] }); }));
      el.appendChild(h("form", { class: "mx-inline", onsubmit: function (ev) { ev.preventDefault(); MX.go(MX.spaceBase + "?tmin=" + Math.round((Number(mb.value) || 1) * 1024) + "&tri=taille" + (typeSel.value ? "&type=" + typeSel.value : "")); } }, [h("label", { for: "mx-bigmb", text: "Plus de " }), mb, " Mo ", typeSel, " ", h("button", { type: "submit", class: "btn btn-outline btn-sm", text: "Rechercher" })]));
      var big = h("ul", { class: "mx-bars" });
      s.largest.forEach(function (m) { big.appendChild(h("li", {}, [h("button", { type: "button", class: "btn btn-ghost btn-sm", text: m.name, "data-mx-open-media": m.id }), h("div", { class: "mx-bar" }, h("span", { style: "width:" + (m.size / Math.max(1, s.largest[0].size) * 100).toFixed(1) + "%" })), h("span", { text: fmt(m.size) })])); });
      if (s.largest.length) el.appendChild(big);
      var lim = Object.keys(s.limits).map(function (t) { return (TYPE[t] || t) + " " + s.limits[t] + " Mo"; }).join(" · ");
      el.appendChild(h("p", { class: "mx-empty-info", text: "Poids maximal d'un envoi : " + lim + "." }));
    }, function (e) { el.textContent = MX.errMsg(e); });
  }

  // ---------------------------------------------------------------- Doublons
  function doublons(el) {
    var my = ++seq; el.textContent = ""; var note = h("p", { class: "mx-loading", role: "status", text: "Analyse des fichiers (empreintes)…" }); el.appendChild(note);
    // Les empreintes manquantes sont calculées par lots, puis les groupes sont lus
    function hash() { return K.api("POST", BASE + "/empreintes", {}).then(function (r) { if (my !== seq) return null; if (r.left > 0 && r.done > 0) { note.textContent = "Analyse des fichiers… " + r.left + " restant" + (r.left > 1 ? "s" : "") + "."; return hash(); } return r; }); }
    hash().then(function () { if (my !== seq) return; return K.api("GET", BASE + "/doublons.json"); }).then(function (r) {
      if (!r || my !== seq) return; el.textContent = "";
      el.appendChild(h("p", { class: "mx-empty-info", text: "Les fichiers sont comparés par leur contenu (empreinte SHA-256), pas par leur nom ni leur taille. Rien n'est supprimé sans votre validation, et « supprimer » met d'abord le fichier à la corbeille." }));
      if (!r.groups.length) { el.appendChild(h("div", { class: "mx-empty mk-empty" }, [h("h2", { text: "Aucun doublon" }), h("p", { text: "Aucun fichier de cette médiathèque n'a un contenu identique à un autre." })])); return; }
      var waste = r.groups.reduce(function (s, g) { return s + g.wastedBytes; }, 0);
      el.appendChild(h("div", { class: "mx-cards" }, [card(String(r.groups.length), r.groups.length > 1 ? "groupes de doublons" : "groupe de doublons"), card(fmt(waste), "récupérables")]));
      r.groups.forEach(function (g) { el.appendChild(group(g)); });
    }, function (e) { el.textContent = MX.errMsg(e); });
  }
  function group(g) {
    var box = h("section", { class: "mx-dup", "aria-label": "Groupe de " + g.count + " fichiers identiques" });
    var keep = g.items[0].id, body = h("div", { class: "mx-dup-grid" });
    var head = h("div", { class: "mx-dup-head" }, [h("strong", { text: plural(g.count, "fichier identique", "fichiers identiques") + " · " + fmt(g.wastedBytes) + " récupérables" })]);
    var render = function (items) {
      body.textContent = "";
      items.forEach(function (m) {
        var it = h("div", { class: "mx-dup-item" + (m.id === keep ? " is-keep" : "") }, [
          m.type === "image" || /\.(png|jpe?g|webp|gif|avif)$/i.test(m.path) ? h("img", { src: m.thumb || m.path, alt: "", loading: "lazy", decoding: "async" }) : h("span", { class: "mk-ml-badge", text: K.badge(m) }),
          h("label", { class: "mx-check-row" }, [h("input", { type: "radio", name: "keep-" + g.sha256, value: String(m.id), checked: m.id === keep ? "" : null, onchange: function () { keep = m.id; render(items); } }), " Conserver celui-ci"]),
          h("strong", { class: "mx-name", text: m.name }), h("span", { class: "mx-meta", text: fmt(m.size) + " · ajouté le " + K.fmtDate(m.createdAt) }), h("span", { class: "mx-meta", text: m.path_label || (m.folderId ? MX.folderPath(m.folderId) : "Médiathèque") }),
          m.usage ? (m.usage.length ? h("ul", {}, m.usage.slice(0, 4).map(function (u) { return h("li", { text: u.kind + " « " + u.name + " »" }); })) : h("span", { class: "mx-meta", text: "Aucune utilisation connue" })) : null,
          h("button", { type: "button", class: "btn btn-ghost btn-sm", text: "Aperçu", onclick: function () { if (window.MXPreview) window.MXPreview.open(items, items.indexOf(m)); } }),
        ]);
        body.appendChild(it);
      });
    };
    var items = g.items.map(function (m) { return Object.assign({ type: /\.(png|jpe?g|webp|gif|avif)$/i.test(m.path) ? "image" : "document", mime: "" }, m); });
    render(items);
    var actions = h("div", { class: "mx-info-actions" });
    actions.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Examiner (utilisations)", onclick: function () { K.api("GET", BASE + "/doublons/" + g.sha256 + ".json").then(function (r) { items = r.items; render(items); }, function (e) { MX.toast(MX.errMsg(e), "error"); }); } }));
    if (MX.cfg().canWrite) {
      actions.appendChild(h("button", { type: "button", class: "btn btn-primary btn-sm", text: "Garder l'exemplaire choisi, mettre les autres à la corbeille", onclick: function () {
        var others = items.filter(function (m) { return m.id !== keep; });
        MX.confirm("Mettre " + plural(others.length, "exemplaire", "exemplaires") + " à la corbeille ?", "L'exemplaire choisi est conservé. Les autres vont à la corbeille (restaurables). Un contenu qui cite un exemplaire écarté continue de l'afficher tant qu'il est à la corbeille : vérifiez les utilisations avec « Examiner » avant de vider la corbeille.", "Mettre à la corbeille", false).then(function (ok) {
          if (!ok) return; K.api("POST", BASE + "/doublons/resoudre", { sha256: g.sha256, keep_id: keep, action: "trash" }).then(function (r) { MX.toast(plural(r.done.length, "doublon mis à la corbeille", "doublons mis à la corbeille") + ".", r.failed && r.failed.length ? "error" : "ok"); MX.refresh(); }, function (e) { MX.toast(MX.errMsg(e), "error"); });
        });
      } }));
      if (MX.cfg().folderEnabled) actions.appendChild(h("button", { type: "button", class: "btn btn-outline btn-sm", text: "Déplacer les autres vers un dossier…", onclick: function () {
        var others = items.filter(function (m) { return m.id !== keep; });
        var folders = MX.cfg().folders || [], sel = h("select", { "aria-label": "Dossier" }, [h("option", { value: "", text: "Sans dossier (racine)" })].concat(folders.map(function (f) { return h("option", { value: String(f.id), text: MX.folderPath(f.id).replace("Médiathèque / ", "") }); })));
        MX.openDialog("Déplacer les doublons", h("div", { class: "field-group" }, [h("label", { text: "Dossier de destination" }), sel]), { ok: "Déplacer", collect: function () { return { id: sel.value ? Number(sel.value) : null }; } }).then(function (v) { if (!v) return; K.api("POST", BASE + "/doublons/resoudre", { sha256: g.sha256, keep_id: keep, action: "move", folder_id: v.id, ids: others.map(function (m) { return m.id; }) }).then(function () { MX.toast("Doublons déplacés.", "ok"); MX.refresh(); }, function (e) { MX.toast(MX.errMsg(e), "error"); }); });
      } }));
    }
    box.appendChild(head); box.appendChild(body); box.appendChild(actions);
    return box;
  }

  window.MXSections = { mount: function (name, el) { if (name === "accueil") accueil(el); else if (name === "stockage") stockage(el); else if (name === "doublons") doublons(el); else if (name === "historique") historique(el); } };
  var first = document.querySelector("[data-mx-section]"); if (first) window.MXSections.mount(first.getAttribute("data-mx-section"), first);
})();

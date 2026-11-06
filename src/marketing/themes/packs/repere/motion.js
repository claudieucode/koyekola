/* Repère — recherche instantanée (clavier, surlignage, état « aucun résultat »), sommaire d'article, « utile ? » mémorisé, premiers pas à cocher, filtres de catégories. Sans dépendance. */
(function () {
  var b = document.body; if (!b || b.getAttribute("data-kw-pack") !== "repere") return;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduceMotion) b.setAttribute("data-pk-reduced", "1");
  var one = function (s, r) { return (r || document).querySelector(s); };
  var all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };

  // Index des articles d'aide : [catégorie, titre, résumé]
  var DATA = [["Démarrer", "Créer votre compte en cinq minutes", "Adresse, mot de passe, première connexion et choix de l'espace de travail."], ["Démarrer", "Renseigner les informations de votre entreprise", "Nom, adresse, numéro de TVA, mentions obligatoires sur vos factures."], ["Démarrer", "Importer vos clients depuis un tableur", "Format du fichier, colonnes reconnues, correction des erreurs d'import."], ["Démarrer", "Choisir le modèle de facture qui vous ressemble", "Logo, couleurs, pied de page et mentions légales par défaut."], ["Factures et devis", "Créer et envoyer votre première facture", "De la saisie des lignes à l'envoi par message, avec lien de paiement."], ["Factures et devis", "Transformer un devis accepté en facture", "Conserver les lignes, ajuster, numéroter, garder l'historique."], ["Factures et devis", "Corriger une facture déjà envoyée", "Avoir, annulation et nouvelle facture : la méthode conforme."], ["Factures et devis", "Programmer une facture récurrente", "Périodicité, date de départ, arrêt et modification en cours de route."], ["Factures et devis", "Relancer automatiquement un client en retard", "Trois modèles de relance, délais conseillés et ton à adopter."], ["Clients", "Créer et classer vos fiches clients", "Champs, étiquettes, notes privées et regroupement par secteur."], ["Clients", "Fusionner deux fiches en doublon", "Ce qui est conservé, ce qui est remplacé, comment annuler."], ["Clients", "Exporter la liste de vos clients", "Format CSV, champs inclus et précautions de confidentialité."], ["Paiements", "Accepter le paiement par carte sur une facture", "Activation, frais, délais de versement et remboursement."], ["Paiements", "Rapprocher un virement reçu", "Associer un virement à une facture, gérer les paiements partiels."], ["Paiements", "Demander un acompte", "Pourcentage ou montant, facture d'acompte et solde final."], ["Paiements", "Que faire si un paiement est refusé ?", "Causes fréquentes, messages au client, nouvelle tentative."], ["Compte et sécurité", "Activer la double authentification", "Application d'authentification, codes de secours, perte du téléphone."], ["Compte et sécurité", "Changer de mot de passe ou le retrouver", "Réinitialisation par message, durée de validité du lien."], ["Compte et sécurité", "Inviter un collaborateur et choisir ses droits", "Rôles, accès aux clients, historique des modifications."], ["Compte et sécurité", "Supprimer votre compte et vos données", "Ce qui est effacé, ce qui doit être conservé légalement, délais."], ["Exports et comptabilité", "Exporter vos écritures pour votre comptable", "Choix de la période, format FEC, vérification avant envoi."], ["Exports et comptabilité", "Préparer votre déclaration de TVA", "Totaux par taux, régime réel ou simplifié, pièces à joindre."], ["Exports et comptabilité", "Archiver vos factures pendant dix ans", "Durées légales, archive téléchargeable et intégrité des fichiers."], ["Exports et comptabilité", "Retrouver une facture ancienne", "Recherche par numéro, client, montant ou période."]];

  var mark = function (text, words) {
    var out = esc(text);
    words.forEach(function (w) { if (w.length < 2) return; var re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"); out = out.replace(re, function (m, a, off, str) { return str.lastIndexOf("<", off) > str.lastIndexOf(">", off) ? m : "<mark>" + a + "</mark>"; }); });
    return out;
  };
  var search = function (q) {
    var words = norm(q).split(/\s+/).filter(Boolean); if (!words.length) return [];
    return DATA.map(function (d) {
      var t = norm(d[1]), s = norm(d[2] + " " + d[0]), score = 0;
      for (var i = 0; i < words.length; i++) { if (t.indexOf(words[i]) >= 0) score += 3; else if (s.indexOf(words[i]) >= 0) score += 1; else return null; }
      return { d: d, score: score };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
  };
  var render = function (q, hits, host) {
    var words = q.split(/\s+/).filter(Boolean);
    if (!hits.length) { host.innerHTML = '<div class="rp-none-l"><b>Aucun résultat pour « ' + esc(q) + ' »</b>Essayez un mot plus simple (facture, TVA, paiement) ou <a href="/contact">demandez directement au support</a> : nous ajoutons un article quand la question revient.</div>'; return; }
    host.innerHTML = hits.slice(0, 6).map(function (h, i) { return '<a class="rp-res" role="option" aria-selected="false" id="rp-o' + i + '" href="/article"><small>' + esc(h.d[0]) + "</small><b>" + mark(h.d[1], words) + "</b><span>" + mark(h.d[2], words) + "</span></a>"; }).join("") + (hits.length > 6 ? '<a class="rp-res" href="/recherche?q=' + encodeURIComponent(q) + '"><b>Voir les ' + hits.length + " résultats</b></a>" : "");
  };

  all("[data-rp-search]").forEach(function (box, n) {
    var mode = box.getAttribute("data-rp-search"), inp = document.createElement("input"), drop = document.createElement("div"), id = "rp-d" + n, cur = -1;
    inp.type = "search"; inp.className = "rp-field"; inp.placeholder = mode === "mini" ? "Rechercher dans l'aide" : "Décrivez votre problème : facture, paiement, mot de passe…"; inp.autocomplete = "off";
    inp.setAttribute("aria-label", "Rechercher dans le centre d'aide"); inp.setAttribute("role", "combobox"); inp.setAttribute("aria-expanded", "false"); inp.setAttribute("aria-controls", id);
    drop.className = "rp-drop"; drop.id = id; drop.setAttribute("role", "listbox"); drop.hidden = true;
    box.appendChild(inp); box.appendChild(drop);
    var host = mode === "page" ? one("[data-rp-results]") : drop;
    var run = function () {
      var q = inp.value.trim(); cur = -1;
      if (!q) { if (host === drop) { drop.hidden = true; inp.setAttribute("aria-expanded", "false"); } else if (host) host.innerHTML = ""; return; }
      if (host === drop) { render(q, search(q), drop); drop.hidden = false; inp.setAttribute("aria-expanded", "true"); }
      else if (host) { host.className = "rp-results"; var hits = search(q); render(q, hits, host); host.firstChild && host.classList.add("rp-drop", "rp-drop-static"); host.hidden = false; }
    };
    inp.addEventListener("input", run);
    inp.addEventListener("focus", function () { if (host === drop && inp.value.trim()) run(); });
    inp.addEventListener("keydown", function (e) {
      var items = all(".rp-res", host || drop);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { if (!items.length) return; e.preventDefault(); cur = (cur + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach(function (x, i) { x.setAttribute("aria-selected", i === cur ? "true" : "false"); }); inp.setAttribute("aria-activedescendant", items[cur].id || ""); }
      else if (e.key === "Enter") { if (cur >= 0 && items[cur]) { e.preventDefault(); location.href = items[cur].getAttribute("href"); } else if (mode !== "page" && inp.value.trim()) { e.preventDefault(); location.href = "/recherche?q=" + encodeURIComponent(inp.value.trim()); } }
      else if (e.key === "Escape") { drop.hidden = true; inp.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("click", function (e) { if (host === drop && !box.contains(e.target)) { drop.hidden = true; inp.setAttribute("aria-expanded", "false"); } });
    if (mode === "page") { var q0 = ""; try { q0 = new URLSearchParams(location.search).get("q") || ""; } catch (e) {} if (q0) { inp.value = q0; run(); } }
  });
  document.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { var f = one(".rp-bigsearch .rp-field") || one(".rp-hsearch .rp-field"); if (f) { e.preventDefault(); f.focus(); } } });

  // Catégories : filtre des articles
  var tools = one("[data-rp-tools]");
  if (tools) {
    var arts = all("[data-rp-list] .rp-art"), cnt = one("[data-rp-count]"), none = one("[data-rp-none]"), cats = [];
    arts.forEach(function (a) { var c = norm(a.getAttribute("data-c")); if (cats.indexOf(c) < 0) cats.push(c); });
    var NAMES = { demarrer: "Démarrer", facturation: "Factures et devis", clients: "Clients", paiements: "Paiements", compte: "Compte et sécurité", export: "Exports et comptabilité" };
    var cur2 = "";
    var chips = [["", "Toutes"]].concat(cats.map(function (c) { return [c, NAMES[c] || c]; })).map(function (p) { var bt = document.createElement("button"); bt.type = "button"; bt.className = "rp-chip"; bt.textContent = p[1]; bt.setAttribute("data-c", p[0]); bt.setAttribute("aria-pressed", p[0] ? "false" : "true"); tools.appendChild(bt); return bt; });
    chips.forEach(function (bt) { bt.addEventListener("click", function () { cur2 = bt.getAttribute("data-c"); var n = 0; arts.forEach(function (a) { var ok = !cur2 || a.getAttribute("data-c") === cur2; a.hidden = !ok; if (ok) n++; }); chips.forEach(function (x) { x.setAttribute("aria-pressed", x === bt ? "true" : "false"); }); if (cnt) cnt.textContent = n + " article" + (n > 1 ? "s" : ""); if (none) none.hidden = n > 0; }); });
  }

  // Sommaire de l'article (construit depuis les titres de niveau 2)
  var toc = one("[data-rp-toc]"), doc = one(".rp-doc");
  if (toc && doc) {
    var hs = all("h2", doc); if (hs.length > 1) {
      var html = "<p>Dans cet article</p>";
      hs.forEach(function (h, i) { h.id = "rp-h" + (i + 1); html += '<a href="#rp-h' + (i + 1) + '">' + esc(h.textContent) + "</a>"; });
      toc.innerHTML = html;
      if ("IntersectionObserver" in window) {
        var links = all("a", toc), io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { links.forEach(function (l) { l.classList.toggle("is-on", l.getAttribute("href") === "#" + e.target.id); }); } }); }, { rootMargin: "-10% 0px -75% 0px" });
        hs.forEach(function (h) { io.observe(h); });
      }
    }
  }

  // « Cet article vous a-t-il aidé ? » (mémorisé dans ce navigateur uniquement)
  all("[data-rp-vote]").forEach(function (box) {
    var key = "rp-vote-" + box.getAttribute("data-rp-vote"), val = store.get(key);
    var q = document.createElement("p"), yes = document.createElement("button"), no = document.createElement("button"), msg = document.createElement("p");
    q.textContent = "Cet article vous a-t-il aidé ?"; yes.type = no.type = "button"; yes.className = "rp-btn rp-btn--line"; no.className = "rp-btn rp-btn--line"; yes.textContent = "Oui"; no.textContent = "Non";
    msg.setAttribute("role", "status"); msg.setAttribute("aria-live", "polite");
    var show = function (v) {
      yes.setAttribute("aria-pressed", v === "oui" ? "true" : "false"); no.setAttribute("aria-pressed", v === "non" ? "true" : "false");
      msg.innerHTML = v === "oui" ? "Merci, c'est noté." : v === "non" ? 'Merci pour l\'honnêteté. <a href="/contact">Posez votre question au support</a> : nous améliorons l\'article avec votre retour.' : "";
    };
    yes.addEventListener("click", function () { store.set(key, "oui"); show("oui"); }); no.addEventListener("click", function () { store.set(key, "non"); show("non"); });
    box.appendChild(q); box.appendChild(yes); box.appendChild(no); box.appendChild(msg); show(val);
  });

  // Premiers pas : liste à cocher mémorisée
  var prog = one("[data-rp-prog]");
  if (prog) {
    var steps = all("[data-rp-step]"), state = []; try { state = JSON.parse(store.get("rp-steps") || "[]"); } catch (e) {}
    var bar = one("[data-rp-bar]"), txt = one("[data-rp-ptxt]"), done = one("[data-rp-done]");
    var paint = function () {
      var n = 0; steps.forEach(function (li, i) { var on = state.indexOf(i) >= 0; li.classList.toggle("is-done", on); one("[data-rp-chk]", li).setAttribute("aria-checked", on ? "true" : "false"); if (on) n++; });
      bar.style.width = (n / steps.length * 100) + "%"; txt.textContent = n + " étape" + (n > 1 ? "s" : "") + " sur " + steps.length; if (done) done.hidden = n < steps.length;
    };
    steps.forEach(function (li, i) {
      var c = one("[data-rp-chk]", li); c.setAttribute("tabindex", "0"); var tg = function () { var k = state.indexOf(i); if (k >= 0) state.splice(k, 1); else state.push(i); store.set("rp-steps", JSON.stringify(state)); paint(); };
      c.addEventListener("click", tg); c.addEventListener("keydown", function (e) { if (e.key === " " || e.key === "Enter") { e.preventDefault(); tg(); } });
    });
    var reset = one("[data-rp-reset]"); if (reset) reset.addEventListener("click", function (e) { e.preventDefault(); state = []; store.set("rp-steps", "[]"); paint(); });
    paint();
  }
})();

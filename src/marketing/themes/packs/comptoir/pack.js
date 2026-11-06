// Comptoir — vitrine de PME polyvalente. Direction artistique : le comptoir d'une boutique de quartier. Crème chaud, bleu faïence, beurre d'enseigne ; slab serif Bree + Karla ;
// auvent rayé, étiquettes de prix à coins coupés, ticket de caisse. Signature : le devis en 3 questions (type, taille, délai) qui calcule une fourchette dans le navigateur,
// recopie le récapitulatif dans le formulaire de contact du CMS, et le badge « ouvert maintenant » calculé sur les horaires. Les services et prix de démonstration sont des données du thème.
const { sec, esc, nav } = require("../kit");

const ICON = {
  cle: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9m-3 0v4m-4-4v3"/>', clef: '<path d="M14 6a5 5 0 1 0-3 8l-7 7h4l1-2h2v-2l1-1"/><circle cx="16" cy="7" r="1.2"/>',
  goutte: '<path d="M12 3s6 6 6 10a6 6 0 0 1-12 0c0-4 6-10 6-10z"/>', eclair: '<path d="M13 2 5 14h6l-1 8 8-12h-6z"/>', pinceau: '<path d="M4 20c0-3 2-4 4-4l9-9 3 3-9 9c0 2-1 4-4 4-2 0-3-1-3-3z"/>',
  boite: '<path d="M3 8l9-5 9 5v9l-9 5-9-5zM3 8l9 5 9-5M12 13v9"/>', feuille: '<path d="M5 19C5 9 11 4 20 4c0 9-5 15-14 15zM5 19l8-8"/>', outils: '<path d="M14 7a4 4 0 0 0 5 5l-9 9-4-4 9-9zM7 5l3 3-2 2-3-3z"/>',
  maison: '<path d="M3 11 12 4l9 7v9H3zM9 20v-6h6v6"/>',
};
const ic = (n) => `<svg class="cp-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[n]}</svg>`;

// p : prix « à partir de » en euros ; d : durée habituelle
const SERVICES = [
  { id: "serrurerie", n: "Serrurerie et clés", c: "Dépannage", i: "clef", p: 69, d: "30 à 60 min", x: "Porte claquée, serrure grippée, double de clés : nous intervenons le jour même dans la commune et les quartiers voisins.", t: "Ouverture de porte sans dégât quand c'est possible." },
  { id: "plomberie", n: "Plomberie de dépannage", c: "Dépannage", i: "goutte", p: 79, d: "1 à 2 h", x: "Fuite, robinet qui coule, chasse d'eau capricieuse : un diagnostic clair avant tout travail.", t: "Devis annoncé avant de commencer, toujours." },
  { id: "electricite", n: "Électricité du quotidien", c: "Dépannage", i: "eclair", p: 85, d: "1 à 2 h", x: "Prise qui chauffe, disjoncteur qui saute, luminaire à poser : remise en sécurité et mise aux normes simples.", t: "Intervention par un électricien habilité." },
  { id: "entretien", n: "Entretien annuel", c: "Entretien", i: "maison", p: 120, d: "2 h", x: "Chaudière, VMC, étanchéité des joints, vérification des serrures : une visite par an qui évite les mauvaises surprises.", t: "Rapport remis par écrit." },
  { id: "jardin", n: "Entretien du jardin", c: "Entretien", i: "feuille", p: 55, d: "demi-journée", x: "Taille, tonte, désherbage et évacuation des déchets verts, à la demi-journée ou à l'abonnement.", t: "Passage régulier possible chaque mois." },
  { id: "peinture", n: "Peinture et rafraîchissement", c: "Travaux", i: "pinceau", p: 180, d: "1 à 3 jours", x: "Une pièce, un couloir, une cage d'escalier : préparation des supports, deux couches, protection du mobilier.", t: "Peintures sans solvant sur demande." },
  { id: "petits-travaux", n: "Petits travaux de maison", c: "Travaux", i: "outils", p: 60, d: "à l'heure", x: "Étagères, portes qui frottent, joints, store à poser : la liste des choses à faire que personne ne fait.", t: "Tarif à l'heure, matériel à part." },
  { id: "montage", n: "Montage de meubles", c: "Boutique", i: "boite", p: 45, d: "1 à 2 h", x: "Armoire, cuisine ou lit livrés en carton : nous montons, fixons au mur si nécessaire et reprenons les emballages.", t: "Reprise des emballages incluse." },
  { id: "boutique", n: "Boutique : quincaillerie et clés minute", c: "Boutique", i: "cle", p: 3, d: "sur place", x: "Visserie au détail, produits d'entretien, ampoules, double de clés en cinq minutes au comptoir.", t: "Conseil gratuit au comptoir." },
];
const CATS = ["Dépannage", "Entretien", "Travaux", "Boutique"];
const CONSEILS = [
  ["12 oct. 2026", "Entretien", "Les cinq gestes de l'automne pour une maison au sec", "Gouttières, joints de fenêtres, vidange du jardin : une demi-heure par geste."],
  ["28 sept. 2026", "Dépannage", "Que faire en cas de porte claquée ?", "Garder son calme, vérifier les fenêtres, ne rien forcer : voici l'ordre des gestes."],
  ["9 sept. 2026", "Boutique", "Faire un double de clé : ce qu'il faut savoir", "Clés plates, clés à pompe, clés sécurisées : ce qu'on peut copier au comptoir."],
  ["22 août 2026", "Travaux", "Peindre un plafond sans traces", "Matériel, ordre des couches, éclairage : la méthode du peintre de l'équipe."],
  ["30 juin 2026", "Dépannage", "Coupure d'eau : où est votre vanne générale ?", "Le repérage prend deux minutes et vous sauve un week-end."],
  ["4 juin 2026", "Entretien", "Pourquoi faire vérifier sa ventilation chaque année", "La VMC encrassée coûte de l'énergie et de l'air frais."],
  ["15 mai 2026", "Travaux", "Combien coûte vraiment un petit chantier ?", "Postes de dépenses, ordre de grandeur et questions à poser avant de signer."],
  ["2 avr. 2026", "Entretien", "Jardin de printemps : par où commencer", "Dans l'ordre : nettoyer, tailler, amender, planter."],
];
const HOURS = [["Lundi", "8 h – 12 h · 14 h – 18 h 30"], ["Mardi", "8 h – 12 h · 14 h – 18 h 30"], ["Mercredi", "8 h – 12 h · 14 h – 18 h 30"], ["Jeudi", "8 h – 12 h · 14 h – 18 h 30"], ["Vendredi", "8 h – 12 h · 14 h – 18 h 30"], ["Samedi", "9 h – 12 h 30"], ["Dimanche", "Fermé (urgences par téléphone)"]];
const HOURS_DATA = '[[8,12,14,18.5],[8,12,14,18.5],[8,12,14,18.5],[8,12,14,18.5],[8,12,14,18.5],[9,12.5],[]]';
const price = (p, pre = "dès ") => `<span class="cp-price">${pre}<b>${p} €</b></span>`;

const tile = (s) => `<article class="cp-svc" data-c="${s.c}" data-s="${esc((s.n + " " + s.x + " " + s.c).toLowerCase())}"><a class="cp-svc-a" href="/service"><span class="cp-svc-i">${ic(s.i)}</span><span class="cp-svc-b"><span class="cp-svc-c">${s.c}</span><h3>${esc(s.n)}</h3><p>${esc(s.x)}</p></span><span class="cp-svc-p">${price(s.p)}<small>${esc(s.d)}</small></span></a></article>`;

const header = (c) => `<header class="cp-head pk-bleed"><div class="cp-strip"><div class="cp-in"><span class="cp-open" data-cp-open data-hours='${HOURS_DATA}'>Horaires : voir ci-dessous</span><span>Comptoir Delorme · 18 rue des Tanneurs, 69007 Lyon · 04 72 00 00 00</span></div></div>
  <div class="cp-bar cp-in"><a class="cp-logo" href="/" aria-label="${esc(c.brand)} — accueil"><span class="cp-plate"><b>COMPTOIR</b><i>Delorme</i></span><small>Services et boutique depuis 1987</small></a>
  <div class="cp-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div><a class="cp-btn cp-btn--call" href="/devis">Devis en 3 questions</a>
  <details class="cp-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="cp-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="cp-btn" href="/devis">Devis en 3 questions</a></div></details></div>
  <div class="cp-awning" aria-hidden="true"></div></header>`;
const footer = (c) => `<footer class="cp-foot pk-bleed"><div class="cp-in cp-foot-g"><div class="cp-tag"><p class="cp-foot-k">Comptoir Delorme</p><p>18 rue des Tanneurs<br>69007 Lyon<br>04 72 00 00 00<br><a href="/contact">Écrire à l'équipe</a></p></div>
  <div class="cp-tag"><p class="cp-foot-k">Services</p>${["Dépannage|/services", "Entretien|/services", "Travaux|/services", "Boutique|/services", "Devis|/devis"].map((x) => `<a href="${x.split("|")[1]}">${x.split("|")[0]}</a>`).join("")}</div>
  <div class="cp-tag"><p class="cp-foot-k">La maison</p><a href="/a-propos">L'équipe et les horaires</a><a href="/conseils">Conseils</a><a href="/blocs">Mise en page</a><a href="/recherche">Recherche</a></div>
  <div class="cp-tag"><p class="cp-foot-k">Cadre</p><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a><a href="/contact">Contact</a></div></div>
  <p class="cp-legal cp-in">Site de démonstration : entreprise, prix et avis fictifs. Merci d'être passé au comptoir. <span class="cp-tick" aria-hidden="true">— TOTAL 0,00 € · MERCI —</span></p></footer>`;
const wrap = (c, ...inner) => [sec(header(c)), ...inner.map((h) => (typeof h === "string" ? sec(h) : h)), sec(footer(c))];
const lead = (kicker, title, sub) => `<section class="cp-lead pk-bleed"><div class="cp-in"><p class="cp-kick">${esc(kicker)}</p><div class="cp-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="cp-sub">${esc(sub)}</p>` : ""}</div></section>`;
const bloc = (inner, cls = "") => `<section class="cp-sec pk-bleed ${cls}"><div class="cp-in">${inner}</div></section>`;
const crumb = (...p) => `<p class="cp-crumb"><a href="/">Accueil</a>${p.map(([l, u]) => ` <span aria-hidden="true">›</span> ${u ? `<a href="${u}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}`).join("")}</p>`;
const hoursTable = `<dl class="cp-hours">${HOURS.map(([d, h]) => `<div><dt>${d}</dt><dd>${h}</dd></div>`).join("")}</dl>`;

const avis = [["Nadia R.", "Porte claquée un dimanche soir : quelqu'un a répondu au téléphone et le serrurier est venu en 40 minutes. Prix annoncé, prix payé.", 5], ["Jean-Pierre M.", "Peinture de l'entrée et du couloir en deux jours. Propre, ponctuel, les meubles étaient protégés.", 5], ["Camille et Yoann", "On vient surtout pour la quincaillerie : un conseil gratuit sur le bon joint, ça n'a pas de prix.", 4]];
const accueil = (c) => wrap(c,
  `<section class="cp-hero pk-bleed"><div class="cp-in cp-hero-g"><div><p class="cp-kick">Services à domicile et boutique · Lyon 7e</p><div class="cp-h1" role="heading" aria-level="1">Le bon artisan, <em>au coin de la rue.</em></div><p class="cp-sub">Dépannage, entretien, petits et gros travaux, et une quincaillerie où l'on trouve ce que les grandes surfaces ne vendent plus à l'unité. Prix annoncés avant d'intervenir.</p><p class="cp-cta"><a class="cp-btn" href="/devis">Avoir une fourchette en 3 questions</a><a class="cp-btn cp-btn--line" href="/services">Voir les services</a></p></div>
  <aside class="cp-ticket" aria-label="Horaires du jour"><p class="cp-ticket-k">Ouvert au comptoir</p>${hoursTable}<p class="cp-ticket-n">Urgence en dehors des heures : 04 72 00 00 00</p></aside></div></section>`,
  bloc(`<ul class="cp-proof">${[["37 ans", "au même endroit"], ["4 200", "interventions l'an dernier"], ["2 h", "délai moyen en urgence"], ["4,8 / 5", "sur 312 avis (démonstration)"]].map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join("")}</ul>`, "cp-sec--tight"),
  bloc(`<h2 class="cp-h2">Ce que nous faisons</h2><div class="cp-grid">${SERVICES.slice(0, 6).map(tile).join("")}</div><p class="cp-more"><a href="/services">Tous les services et leurs prix</a></p>`),
  bloc(`<div class="cp-q3"><div><h2 class="cp-h2">Un devis en trois questions</h2><p>Quel service, quelle taille, pour quand ? Vous obtenez tout de suite une fourchette, sans laisser vos coordonnées. Si elle vous convient, le récapitulatif s'envoie en un clic.</p></div><p><a class="cp-btn" href="/devis">Commencer</a></p></div>`, "cp-sec--band"),
  bloc(`<h2 class="cp-h2">Ils sont passés au comptoir</h2><div class="cp-avis">${avis.map(([n, t, s]) => `<figure><blockquote><p>${esc(t)}</p></blockquote><figcaption>${esc(n)} <span role="img" aria-label="${s} sur 5">${"★".repeat(s)}${"☆".repeat(5 - s)}</span></figcaption></figure>`).join("")}</div><p class="cp-note">Avis de démonstration, rédigés pour le thème.</p>`),
  bloc(`<div class="cp-split"><div><h2 class="cp-h2">Questions fréquentes</h2>${[["Le devis est-il gratuit ?", "Oui. La fourchette en ligne est indicative ; le prix ferme est annoncé sur place avant le début des travaux."], ["Intervenez-vous le week-end ?", "Le samedi matin au comptoir, et en urgence sept jours sur sept par téléphone, avec une majoration annoncée."], ["Jusqu'où vous déplacez-vous ?", "Lyon, Villeurbanne, Bron, Caluire, Saint-Fons et Vénissieux. Au-delà, nous étudions la demande."]].map(([q, a]) => `<details class="cp-faq"><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
  <div><h2 class="cp-h2">Nous trouver</h2><p>18 rue des Tanneurs, 69007 Lyon. Métro Jean Macé, à cinq minutes à pied. Vélo et poussette bienvenus.</p><p><a class="cp-btn cp-btn--line" href="/contact">Nous écrire</a></p></div></div>`));

const servicesPage = (c) => wrap(c, lead("Services et boutique", "Tout ce qu'on peut faire pour vous", "Neuf prestations, des prix de départ annoncés. Filtrez par famille ou tapez un mot."),
  bloc(`<div class="cp-tools" data-cp-tools></div><h2 class="cp-sr">Les services</h2><p class="cp-count" role="status" aria-live="polite" data-cp-count>9 services</p><div class="cp-grid cp-grid--list" data-cp-list>${SERVICES.map(tile).join("")}</div><p class="cp-none" data-cp-none hidden>Rien ne correspond. Essayez « clé », « peinture » ou <a href="/contact">demandez-nous</a>.</p>`));

const servicePage = (c) => { const s = SERVICES[0]; return wrap(c,
  `<section class="cp-sec pk-bleed"><div class="cp-in">${crumb(["Services", "/services"], [s.n])}<div class="cp-fiche"><div class="cp-fiche-m"><p class="cp-kick">${s.c}</p><div class="cp-h1" role="heading" aria-level="1">${esc(s.n)}</div><p class="cp-sub">${esc(s.x)}</p>
  <h2>Comment ça se passe</h2><ol class="cp-steps"><li><b>Vous appelez</b> ou vous passez au comptoir : nous notons l'adresse et le type de serrure.</li><li><b>Nous annonçons le prix</b> avant de partir, par téléphone, avec le déplacement inclus.</li><li><b>Nous intervenons</b> avec le matériel dans la camionnette, en général en moins d'une heure.</li><li><b>Vous réglez</b> sur place, avec facture détaillée.</li></ol>
  <h2>Ce qui est compris</h2><ul class="cp-check"><li>Déplacement dans la zone Lyon 7e, Villeurbanne et Bron</li><li>Ouverture de porte sans dégât quand c'est possible</li><li>Remplacement du cylindre au prix de la pièce</li><li>Facture et garantie de deux ans sur les pièces</li></ul>
  <h2>Questions sur ce service</h2><details class="cp-faq"><summary>Dois-je prouver que j'habite là ?</summary><p>Oui, une pièce d'identité et un justificatif (facture, courrier) suffisent.</p></details><details class="cp-faq"><summary>Et la nuit ?</summary><p>Nous intervenons de nuit avec une majoration annoncée au téléphone, jamais découverte à la facture.</p></details></div>
  <aside class="cp-fiche-s"><div class="cp-tag cp-tag--big"><p class="cp-foot-k">À partir de</p><p class="cp-big">${s.p} €</p><p>Durée habituelle : ${s.d}</p><p>${esc(s.t)}</p><a class="cp-btn" href="/devis">Estimer mon cas</a><a class="cp-btn cp-btn--line" href="/contact">Nous écrire</a></div></aside></div></div></section>`,
  bloc(`<h2 class="cp-h2">À lire aussi</h2><ul class="cp-news">${CONSEILS.slice(1, 3).map(([d, k, t, x]) => `<li><a href="/conseils"><span class="cp-svc-c">${k} · ${d}</span><b>${esc(t)}</b><span>${esc(x)}</span></a></li>`).join("")}</ul>`)); };

const OPT = (q, v, label, extra = "") => `<a class="cp-opt" role="radio" aria-checked="false" href="/devis" data-q="${q}" data-v="${v}"><b>${label}</b>${extra ? `<small>${extra}</small>` : ""}</a>`;
const devisPage = (c) => wrap(c, lead("Devis", "Votre fourchette en trois questions", "Aucune coordonnée demandée. Le résultat est indicatif : le prix ferme est annoncé avant d'intervenir."),
  bloc(`<div class="cp-wiz" data-cp-wiz><ol class="cp-wiz-steps" aria-label="Étapes"><li class="is-on" data-cp-s="1">1 · Quoi</li><li data-cp-s="2">2 · Quelle taille</li><li data-cp-s="3">3 · Pour quand</li><li data-cp-s="4">Résultat</li></ol>
  <div class="cp-wiz-p" data-cp-p="1"><h2>Que faut-il faire ?</h2><div class="cp-opts" role="radiogroup" aria-label="Type de besoin">${OPT(1, "depannage", "Dépanner", "Serrure, fuite, panne")}${OPT(1, "entretien", "Entretenir", "Visite, jardin, contrôle")}${OPT(1, "travaux", "Faire des travaux", "Peinture, petits travaux")}${OPT(1, "montage", "Monter ou installer", "Meubles, accessoires")}</div></div>
  <div class="cp-wiz-p" data-cp-p="2" hidden><h2>Quelle est l'importance du besoin ?</h2><div class="cp-opts" role="radiogroup" aria-label="Taille">${OPT(2, "petit", "Petit", "Un seul point, moins de 2 h")}${OPT(2, "moyen", "Moyen", "Une pièce, une demi-journée")}${OPT(2, "grand", "Grand", "Plusieurs pièces, plusieurs jours")}</div></div>
  <div class="cp-wiz-p" data-cp-p="3" hidden><h2>Pour quand ?</h2><div class="cp-opts" role="radiogroup" aria-label="Délai">${OPT(3, "urgent", "Dans les 24 h", "Majoration d'urgence")}${OPT(3, "semaine", "Cette semaine", "Tarif normal")}${OPT(3, "planifie", "À planifier", "Remise de 5 %")}</div></div>
  <div class="cp-wiz-p cp-wiz-r" data-cp-p="4" hidden aria-live="polite"><h2>Votre fourchette</h2><p class="cp-range" data-cp-range>—</p><p data-cp-recap></p><dl class="cp-calc" data-cp-calc></dl><p class="cp-note">Estimation indicative de démonstration, hors matériel spécifique. Le prix ferme est annoncé sur place.</p><p class="cp-cta"><a class="cp-btn" href="/contact" data-cp-send>Envoyer ce récapitulatif</a><a class="cp-btn cp-btn--line" href="/devis" data-cp-reset>Recommencer</a></p></div>
  <p class="cp-wiz-b"><a href="/devis" data-cp-back hidden>← Question précédente</a></p></div>`));

const aproposPage = (c) => wrap(c, lead("La maison", "Trois générations derrière le comptoir", "Une équipe de neuf personnes, la même rue depuis 1987."),
  bloc(`<div class="cp-split"><div><h2 class="cp-h2">L'équipe</h2><ul class="cp-team">${[["Hélène Delorme", "Direction et devis", "HD"], ["Karim Benali", "Serrurerie et dépannage", "KB"], ["Sophie Marchetti", "Peinture et finitions", "SM"], ["Paul Girard", "Boutique et conseil", "PG"]].map(([n, r, i]) => `<li><span class="cp-av" aria-hidden="true">${i}</span><div><b>${n}</b><span>${r}</span></div></li>`).join("")}</ul></div><div><h2 class="cp-h2">Horaires du comptoir</h2>${hoursTable}<p class="cp-note">Jours fériés : ouverture le matin seulement.</p></div></div>`),
  bloc(`<h2 class="cp-h2">Zone d'intervention</h2><ul class="cp-zone">${["Lyon 7e", "Lyon 8e", "Villeurbanne", "Bron", "Caluire-et-Cuire", "Saint-Fons", "Vénissieux", "Saint-Priest"].map((z) => `<li>${z}</li>`).join("")}</ul>`, "cp-sec--band"));

const conseilsPage = (c) => wrap(c, lead("Conseils", "Les bons gestes, expliqués simplement", "Un article par quinzaine, sans jargon."),
  bloc(`<ul class="cp-news cp-news--wide">${CONSEILS.map(([d, k, t, x]) => `<li data-s="${esc((t + " " + x + " " + k).toLowerCase())}"><a href="/conseils"><span class="cp-svc-c">${k} · ${d}</span><b>${esc(t)}</b><span>${esc(x)}</span></a></li>`).join("")}</ul>`));

const blocsPage = (c) => wrap(c, lead("Mise en page", "Tous les blocs de la maison", "Titres, listes, citations, tableaux, code, encadrés, colonnes et boutons."),
  bloc(`<div class="cp-prose"><h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6>
  <p>Un paragraphe courant avec un <a href="/services">lien</a>, du <strong>gras</strong>, de l'<em>italique</em> et du <code>code en ligne</code>.</p><ul><li>Liste à puces</li><li>Seconde ligne<ul><li>Sous-liste</li></ul></li></ul><ol><li>Liste numérotée</li><li>Deuxième étape</li></ol>
  <blockquote><p>« Un prix annoncé avant de commencer, c'est la moitié du métier. »</p><footer>— Hélène Delorme</footer></blockquote>
  <figure class="cp-fig"><svg viewBox="0 0 640 200" role="img" aria-label="Illustration : façade de boutique avec auvent rayé"><rect x="40" y="70" width="560" height="120" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 70h580l-30-40H60z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M120 30l-20 40M200 30l-10 40M280 30v40M360 30v40M440 30l10 40M520 30l20 40" stroke="currentColor" stroke-width="2"/><rect x="270" y="110" width="100" height="80" fill="none" stroke="currentColor" stroke-width="2"/></svg><figcaption>Une image avec sa légende.</figcaption></figure>
  <div class="cp-tablewrap" role="region" aria-label="Tableau défilant"><table><caption>Tarifs indicatifs de la boutique</caption><thead><tr><th scope="col">Prestation</th><th scope="col">Durée</th><th scope="col">À partir de</th></tr></thead><tbody>${SERVICES.slice(0, 5).map((s) => `<tr><td>${esc(s.n)}</td><td>${esc(s.d)}</td><td>${s.p} €</td></tr>`).join("")}</tbody></table></div>
  <pre class="cp-pre"><code>Ticket n° 0421
Double de clé plate ....... 3,50 €
Ampoule LED E27 ........... 4,90 €</code></pre>
  <div class="cp-cols"><div><h3>Colonne gauche</h3><p>Les colonnes se replient en une seule sur mobile.</p></div><div><h3>Colonne droite</h3><p>Même corps, même interligne.</p></div></div>
  <aside class="cp-callout" role="note"><b>Encadré.</b> Un encadré met en avant une précision, un tarif ou une consigne de sécurité.</aside><p><a class="cp-btn" href="/devis">Bouton plein</a> <a class="cp-btn cp-btn--line" href="/contact">Bouton filet</a></p></div>`));

const contactPage = (c) => wrap(c, lead("Contact", "Passez nous voir ou écrivez-nous", "Réponse sous un jour ouvré ; pour une urgence, téléphonez."),
  bloc(`<div class="cp-split"><div><h2 class="cp-h2">Au comptoir</h2><p>18 rue des Tanneurs, 69007 Lyon<br>04 72 00 00 00</p>${hoursTable}</div><div class="cp-formnote" data-cp-recapbox hidden><h2 class="cp-h2">Votre devis</h2><p data-cp-recapt></p></div></div>`),
  { type: "form", heading: "Votre message", intro: "Décrivez votre besoin en quelques lignes : adresse approximative, type de travaux, disponibilités." });
const searchIndex = () => `<section class="cp-sec pk-bleed cp-search-page"><div class="cp-in"><h2 class="cp-h2">Résultats dans le site</h2><p class="cp-count" role="status" aria-live="polite" data-cp-rcount>Saisissez un mot dans la recherche, ou parcourez la liste.</p><div class="cp-grid cp-grid--list" data-cp-index>${SERVICES.map(tile).join("")}</div>
  <div class="cp-empty" data-cp-empty hidden><p class="cp-empty-t">Rien sur l'étagère.</p><p>Nous n'avons rien trouvé pour « <span data-cp-q></span> ». Essayez un mot plus simple (clé, fuite, peinture) ou appelez le comptoir.</p><p><a class="cp-btn cp-btn--line" href="/services">Voir tous les services</a></p></div></div></section>`;
const recherchePage = (c) => wrap(c, lead("Recherche", "Chercher dans le site", "Un service, un conseil, une question."), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher : clé, fuite, peinture…" } }] }, searchIndex());
const introuvablePage = (c) => wrap(c, `<section class="cp-404 pk-bleed"><div class="cp-in"><p class="cp-kick">Erreur 404</p><div class="cp-h1" role="heading" aria-level="1">Cette adresse n'est plus en rayon.</div><p class="cp-sub">La page a été déplacée ou n'a jamais existé. Voici le chemin vers le comptoir.</p><p class="cp-cta"><a class="cp-btn" href="/">Retour à l'accueil</a><a class="cp-btn cp-btn--line" href="/services">Voir les services</a><a class="cp-btn cp-btn--line" href="/recherche">Rechercher</a></p></div></section>`);
const legal = (k, t, body) => (c) => wrap(c, lead(k, t, "Document de démonstration à adapter avant publication."), bloc(`<div class="cp-prose">${body}</div>`));
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Comptoir Delorme SARL (société fictive), 18 rue des Tanneurs, 69007 Lyon. Capital, numéro d'immatriculation et TVA à renseigner.</p><h2>Direction de la publication</h2><p>Hélène Delorme.</p><h2>Hébergement</h2><p>Hébergeur à renseigner.</p><h2>Garanties et assurances</h2><p>Assurance responsabilité civile professionnelle et garantie décennale : références à indiquer.</p><h2>Médiation</h2><p>Médiateur de la consommation à indiquer.</p>`);
const confid = legal("Confidentialité", "Politique de confidentialité", `<h2>Données collectées</h2><p>Nom, adresse électronique, téléphone et message saisis dans le formulaire de contact. Le devis en trois questions ne collecte rien : le calcul reste dans votre navigateur.</p><h2>Finalités</h2><p>Répondre à votre demande et établir un devis.</p><h2>Durée et droits</h2><p>Les demandes sont conservées trois ans. Vous pouvez demander l'accès, la rectification ou l'effacement via la page <a href="/contact">Contact</a>.</p>`);

module.exports = {
  key: "comptoir", name: "Comptoir", version: "1.0.0", collection: "pro", category: "services", tags: ["chaleureux", "classique", "moderne"], siteType: "Vitrine de PME polyvalente",
  concept: "Le comptoir d'une boutique de quartier : auvent rayé, étiquettes de prix, ticket de caisse, et un devis en trois questions qui donne une fourchette sans demander ses coordonnées.",
  description: "Vitrine de PME polyvalente : services avec prix de départ, devis en 3 questions, badge ouvert maintenant, fiche de service, conseils, équipe et horaires, formulaire de contact.",
  brand: "Comptoir Delorme", modules: ["formulaires", "recherche"],
  contentModel: "Les services, prix, horaires et conseils sont écrits dans les pages du thème (le CMS n'a pas de type de contenu « service »). Le devis en 3 questions est un calcul indicatif côté navigateur, pas un module de devis du CMS.",
  dna: { hero: "titre-et-ticket-d-horaires-a-droite", header: "bandeau-d-infos-barre-et-auvent-raye", grid: "tuiles-de-services-et-etiquettes-de-prix", typo: "bree-serif-et-karla", shapes: "coins-coupes-et-pointilles-de-ticket", motion: "auvent-qui-ondule-et-selecteurs-de-devis", rhythm: "dense-d-etalage", signature: "devis-en-trois-questions-et-badge-ouvert", palette: "creme-chaud-bleu-faience-beurre", image: "pictogrammes-au-trait-sans-photo", list: "etiquettes-de-prix-en-grille-ou-lignes-de-comptoir", article: "fiche-service-avec-ticket-de-prix-lateral", sidebar: "ticket-de-prix-collant-a-droite", reading: "mesure-68-caracteres-corps-17-px" },
  tokens: {
    colors: { primary: "#1d6a9c", secondary: "#2b2118", accent: "#f2c14e", background: "#f6f1e7", surface: "#fffdf8", text: "#2b2118", muted: "#675c50", success: "#2f6f46", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.bree-serif", body: "font.karla", button: "font.karla", link: "font.karla" },
    radius: { sm: 0, md: 2, lg: 4, button: 2, field: 2, card: 2 }, shadow: { card: "none", button: "none" }, border: { width: 2, color: "#2b2118" },
    type: { h1: { size: 52, weight: 400, lineHeight: 1.08 }, h2: { size: 30, weight: 400, lineHeight: 1.15 } },
  },
  options: [
    { key: "accent", label: "Couleur de l'enseigne", type: "color", default: "#1d6a9c" },
    { key: "entete", label: "En-tête", type: "choice", default: "double", choices: [["double", "Bandeau d'infos et barre"], ["enseigne", "Enseigne centrée sous l'auvent"], ["barre", "Barre simple"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "etiquettes", choices: [["etiquettes", "Quatre étiquettes de prix"], ["ticket", "Ticket de caisse compact"]] },
    { key: "liste", label: "Liste des services", type: "choice", default: "etiquettes", choices: [["etiquettes", "Étiquettes en grille"], ["comptoir", "Lignes de comptoir avec prix"], ["vitrine", "Grandes tuiles de vitrine"]] },
    { key: "service", label: "Fiche de service", type: "choice", default: "tiroir", choices: [["tiroir", "Ticket de prix à droite"], ["pleine", "Pleine largeur, ticket en tête"]] },
    { key: "nuit", label: "Mode nuit (enseigne éclairée)", type: "choice", default: "non", choices: [["non", "Jour"], ["oui", "Nuit"]] },
  ],
  menu: [["Accueil", "/"], ["Services", "/services"], ["Devis", "/devis"], ["Conseils", "/conseils"], ["La maison", "/a-propos"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: accueil }, { key: "services", name: "Services", render: servicesPage }, { key: "service", name: "Fiche de service", render: servicePage },
    { key: "devis", name: "Devis en 3 questions", render: devisPage }, { key: "conseils", name: "Conseils", render: conseilsPage }, { key: "a-propos", name: "La maison", render: aproposPage },
    { key: "blocs", name: "Blocs", render: blocsPage }, { key: "contact", name: "Contact", render: contactPage }, { key: "recherche", name: "Recherche", render: recherchePage },
    { key: "introuvable", name: "Page introuvable", render: introuvablePage }, { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};

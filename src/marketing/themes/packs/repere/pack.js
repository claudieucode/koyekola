// Repère — centre d'aide. Direction artistique : le repère que l'on cherche quand on est perdu. Gris-bleu très clair, encre indigo, un violet franc et un surligneur jaune pour les mots trouvés ;
// Plus Jakarta Sans + Onest ; cartes à filets, index en colonnes. Signature : la recherche instantanée (clavier, surlignage, état « aucun résultat » qui mène au support) sur 24 articles,
// le « Cet article vous a-t-il aidé ? » mémorisé dans le navigateur et la liste « Premiers pas » à cocher. Les articles d'aide sont des données du thème (le CMS n'a pas de type « article d'aide »).
const { sec, esc, nav } = require("../kit");

const CATS = [
  { id: "demarrer", n: "Démarrer", d: "Créer son compte, régler l'essentiel, importer ses premiers clients.", i: "M5 19V5l14 7z" },
  { id: "facturation", n: "Factures et devis", d: "Créer, envoyer, relancer, corriger une facture ou un devis.", i: "M6 3h9l4 4v14H6zM9 12h7M9 16h7" },
  { id: "clients", n: "Clients", d: "Fiches clients, contacts, historique, import et export.", i: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" },
  { id: "paiements", n: "Paiements", d: "Moyens de paiement, rapprochement, acomptes et retards.", i: "M3 6h18v12H3zM3 10h18" },
  { id: "compte", n: "Compte et sécurité", d: "Mot de passe, double authentification, équipe, données.", i: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" },
  { id: "export", n: "Exports et comptabilité", d: "FEC, exports comptables, déclarations et archives.", i: "M12 3v12m-4-4l4 4 4-4M5 21h14" },
];
// c : catégorie ; m : minutes de lecture ; u : mise à jour
const ARTS = [
  ["demarrer", "Créer votre compte en cinq minutes", 3, "oct. 2026", "Adresse, mot de passe, première connexion et choix de l'espace de travail."],
  ["demarrer", "Renseigner les informations de votre entreprise", 4, "oct. 2026", "Nom, adresse, numéro de TVA, mentions obligatoires sur vos factures."],
  ["demarrer", "Importer vos clients depuis un tableur", 5, "sept. 2026", "Format du fichier, colonnes reconnues, correction des erreurs d'import."],
  ["demarrer", "Choisir le modèle de facture qui vous ressemble", 3, "sept. 2026", "Logo, couleurs, pied de page et mentions légales par défaut."],
  ["facturation", "Créer et envoyer votre première facture", 6, "nov. 2026", "De la saisie des lignes à l'envoi par message, avec lien de paiement."],
  ["facturation", "Transformer un devis accepté en facture", 3, "oct. 2026", "Conserver les lignes, ajuster, numéroter, garder l'historique."],
  ["facturation", "Corriger une facture déjà envoyée", 4, "oct. 2026", "Avoir, annulation et nouvelle facture : la méthode conforme."],
  ["facturation", "Programmer une facture récurrente", 4, "sept. 2026", "Périodicité, date de départ, arrêt et modification en cours de route."],
  ["facturation", "Relancer automatiquement un client en retard", 5, "août 2026", "Trois modèles de relance, délais conseillés et ton à adopter."],
  ["clients", "Créer et classer vos fiches clients", 3, "oct. 2026", "Champs, étiquettes, notes privées et regroupement par secteur."],
  ["clients", "Fusionner deux fiches en doublon", 3, "sept. 2026", "Ce qui est conservé, ce qui est remplacé, comment annuler."],
  ["clients", "Exporter la liste de vos clients", 2, "août 2026", "Format CSV, champs inclus et précautions de confidentialité."],
  ["paiements", "Accepter le paiement par carte sur une facture", 5, "oct. 2026", "Activation, frais, délais de versement et remboursement."],
  ["paiements", "Rapprocher un virement reçu", 4, "sept. 2026", "Associer un virement à une facture, gérer les paiements partiels."],
  ["paiements", "Demander un acompte", 3, "sept. 2026", "Pourcentage ou montant, facture d'acompte et solde final."],
  ["paiements", "Que faire si un paiement est refusé ?", 3, "août 2026", "Causes fréquentes, messages au client, nouvelle tentative."],
  ["compte", "Activer la double authentification", 3, "nov. 2026", "Application d'authentification, codes de secours, perte du téléphone."],
  ["compte", "Changer de mot de passe ou le retrouver", 2, "oct. 2026", "Réinitialisation par message, durée de validité du lien."],
  ["compte", "Inviter un collaborateur et choisir ses droits", 4, "sept. 2026", "Rôles, accès aux clients, historique des modifications."],
  ["compte", "Supprimer votre compte et vos données", 3, "août 2026", "Ce qui est effacé, ce qui doit être conservé légalement, délais."],
  ["export", "Exporter vos écritures pour votre comptable", 5, "oct. 2026", "Choix de la période, format FEC, vérification avant envoi."],
  ["export", "Préparer votre déclaration de TVA", 6, "sept. 2026", "Totaux par taux, régime réel ou simplifié, pièces à joindre."],
  ["export", "Archiver vos factures pendant dix ans", 3, "août 2026", "Durées légales, archive téléchargeable et intégrité des fichiers."],
  ["export", "Retrouver une facture ancienne", 2, "juil. 2026", "Recherche par numéro, client, montant ou période."],
];
const catN = (id) => CATS.find((c) => c.id === id).n;
const cardOf = (c) => `<a class="rp-cat" href="/categorie"><svg viewBox="0 0 24 24" class="rp-ci" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${c.i}"/></svg><h3>${c.n}</h3><p>${c.d}</p><span class="rp-cnt">${ARTS.filter((a) => a[0] === c.id).length} articles</span></a>`;
const artRow = (a) => `<li class="rp-art" data-c="${a[0]}" data-s="${esc((a[1] + " " + a[4] + " " + catN(a[0])).toLowerCase())}"><a href="/article"><span class="rp-art-t">${esc(a[1])}</span><span class="rp-art-x">${esc(a[4])}</span><span class="rp-art-m">${catN(a[0])} · ${a[2]} min · mis à jour ${a[3]}</span></a></li>`;

const header = (c) => `<header class="rp-head pk-bleed"><div class="rp-top"><div class="rp-in"><span>Calepin · Centre d'aide</span><span class="rp-status"><i aria-hidden="true"></i> Tous les services fonctionnent</span></div></div>
  <div class="rp-bar rp-in"><a class="rp-logo" href="/" aria-label="${esc(c.brand)} — accueil"><svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg><span>Repère</span></a>
  <div class="rp-hsearch" data-rp-search="mini"></div>
  <div class="rp-nav" role="navigation" aria-label="Navigation principale">${nav(c.menu)}</div><a class="rp-btn rp-btn--sm" href="/contact">Contacter le support</a>
  <details class="rp-burger"><summary aria-label="Ouvrir le menu"><span></span><span></span><span></span></summary><div class="rp-drawer" role="navigation" aria-label="Menu mobile">${nav(c.menu)}<a class="rp-btn" href="/contact">Contacter le support</a></div></details></div></header>`;
const footer = (c) => `<footer class="rp-foot pk-bleed"><div class="rp-in"><div class="rp-foot-g"><div class="rp-help"><p class="rp-fk">Besoin d'un humain ?</p><p>Le support répond du lundi au vendredi, de 9 h à 18 h, en général en moins de quatre heures ouvrées.</p><a class="rp-btn" href="/contact">Écrire au support</a></div>
  <div class="rp-plan"><p class="rp-fk">Catégories</p>${CATS.map((k) => `<a href="/categorie">${k.n}</a>`).join("")}</div><div class="rp-plan"><p class="rp-fk">Aller plus vite</p><a href="/premiers-pas">Premiers pas</a><a href="/recherche">Recherche</a><a href="/blocs">Mise en page</a><a href="/mentions">Mentions légales</a><a href="/confidentialite">Confidentialité</a></div></div>
  <p class="rp-legal">© 2026 Calepin SAS — centre d'aide de démonstration. Produit, articles et chiffres fictifs.</p></div></footer>`;
const wrap = (c, ...inner) => [sec(header(c)), ...inner.map((h) => (typeof h === "string" ? sec(h) : h)), sec(footer(c))];
const sect = (inner, cls = "") => `<section class="rp-sec pk-bleed ${cls}"><div class="rp-in">${inner}</div></section>`;
const lead = (kicker, title, sub) => sect(`<p class="rp-kick">${esc(kicker)}</p><div class="rp-h1" role="heading" aria-level="1">${title}</div>${sub ? `<p class="rp-sub">${esc(sub)}</p>` : ""}`, "rp-lead");
const crumb = (...p) => `<p class="rp-crumb"><a href="/">Aide</a>${p.map(([l, u]) => ` <span aria-hidden="true">›</span> ${u ? `<a href="${u}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}`).join("")}</p>`;

const accueil = (c) => wrap(c,
  `<section class="rp-hero pk-bleed"><div class="rp-in"><p class="rp-kick">Centre d'aide Calepin</p><div class="rp-h1" role="heading" aria-level="1">Que cherchez-vous aujourd'hui ?</div><div class="rp-bigsearch" data-rp-search="big"></div><p class="rp-pop">Recherches fréquentes : <a href="/recherche?q=facture">facture</a> <a href="/recherche?q=paiement">paiement</a> <a href="/recherche?q=tva">TVA</a> <a href="/recherche?q=mot%20de%20passe">mot de passe</a></p></div></section>`,
  sect(`<h2 class="rp-h2">Parcourir par catégorie</h2><div class="rp-cats">${CATS.map(cardOf).join("")}</div>`),
  sect(`<div class="rp-two"><div><h2 class="rp-h2">Articles les plus lus</h2><ol class="rp-top5">${[4, 6, 12, 16, 20].map((i) => `<li><a href="/article">${esc(ARTS[i][1])}</a><span>${catN(ARTS[i][0])}</span></li>`).join("")}</ol></div><aside class="rp-start"><p class="rp-kick">Nouveau sur Calepin ?</p><h2 class="rp-h2">Cinq étapes pour être prêt</h2><p>Une liste à cocher, qui se souvient de votre avancement sur cet appareil.</p><a class="rp-btn" href="/premiers-pas">Commencer</a></aside></div>`, "rp-sec--band"),
  sect(`<div class="rp-two"><div><h2 class="rp-h2">Mises à jour récentes</h2><ul class="rp-list rp-list--plain">${ARTS.filter((a) => /nov|oct/.test(a[3])).slice(0, 4).map(artRow).join("")}</ul></div><div><h2 class="rp-h2">Vous ne trouvez pas ?</h2><p>Le support est là. Joignez une capture d'écran si possible : nous répondons plus vite.</p><p><a class="rp-btn rp-btn--line" href="/contact">Contacter le support</a></p></div></div>`));

const categoriesPage = (c) => wrap(c, lead("Catégories", "Toutes les catégories d'aide", "Six catégories, vingt-quatre articles, mis à jour chaque mois."),
  sect(`<div class="rp-cats rp-cats--index">${CATS.map(cardOf).join("")}</div>`),
  sect(`<h2 class="rp-h2">Tous les articles</h2><div class="rp-tools" data-rp-tools></div><p class="rp-count" role="status" aria-live="polite" data-rp-count>24 articles</p><ul class="rp-list" data-rp-list>${ARTS.map(artRow).join("")}</ul><p class="rp-none" data-rp-none hidden>Aucun article dans cette catégorie pour ce mot. <a href="/contact">Demandez au support</a>.</p>`));

const categoriePage = (c) => { const k = CATS[1]; return wrap(c, sect(`${crumb(["Catégories", "/categories"], [k.n])}<p class="rp-kick">Catégorie</p><div class="rp-h1" role="heading" aria-level="1">${k.n}</div><p class="rp-sub">${k.d}</p>`, "rp-lead"),
  sect(`<div class="rp-catpage"><ul class="rp-list">${ARTS.filter((a) => a[0] === k.id).map(artRow).join("")}</ul><aside class="rp-side"><h2 class="rp-h3">Autres catégories</h2>${CATS.filter((x) => x.id !== k.id).map((x) => `<a href="/categorie">${x.n}</a>`).join("")}</aside></div>`)); };

const articlePage = (c) => wrap(c, `<article class="rp-sec pk-bleed rp-docwrap"><div class="rp-in">${crumb(["Factures et devis", "/categorie"], ["Créer et envoyer votre première facture"])}
  <div class="rp-doc-g"><aside class="rp-toc" data-rp-toc aria-label="Sommaire"></aside><div class="rp-doc"><p class="rp-kick">Factures et devis · 6 min · mis à jour en novembre 2026</p><div class="rp-h1" role="heading" aria-level="1">Créer et envoyer votre première facture</div><p class="rp-sub">En cinq minutes : choisir le client, saisir les lignes, vérifier les mentions et envoyer avec un lien de paiement.</p>
  <h2>Avant de commencer</h2><p>Vérifiez que les informations de votre entreprise sont renseignées (nom, adresse, numéro de TVA). Sans elles, Calepin vous signalera les mentions manquantes avant l'envoi.</p>
  <aside class="rp-tip" role="note"><b>Astuce.</b> Gardez sous la main le bon de commande ou le devis accepté : vous pourrez le joindre à la facture.</aside>
  <h2>Étapes</h2><ol class="rp-steps"><li><b>Ouvrez « Factures »</b> puis cliquez sur « Nouvelle facture ».</li><li><b>Choisissez le client</b> dans la liste ou créez-le à la volée.</li><li><b>Saisissez les lignes</b> : désignation, quantité, prix unitaire et taux de TVA.</li><li><b>Vérifiez le total</b> et la date d'échéance (30 jours par défaut).</li><li><b>Envoyez</b> : le client reçoit un message avec la facture en pièce jointe et un lien de paiement.</li></ol>
  <h2>Mentions obligatoires</h2><p>Une facture doit comporter la date, le numéro, l'identité des deux parties, la désignation des prestations, le total hors taxe, le taux de TVA et l'indemnité forfaitaire de recouvrement. Calepin les ajoute automatiquement.</p>
  <div class="rp-tablewrap" role="region" aria-label="Tableau défilant"><table><caption>Délais de paiement usuels</caption><thead><tr><th scope="col">Situation</th><th scope="col">Délai conseillé</th></tr></thead><tbody><tr><td>Particulier</td><td>Paiement à réception</td></tr><tr><td>Professionnel, sans accord</td><td>30 jours</td></tr><tr><td>Maximum légal</td><td>60 jours</td></tr></tbody></table></div>
  <h2>Et ensuite ?</h2><p>Vous pouvez <a href="/article">programmer une relance automatique</a> ou <a href="/article">accepter le paiement par carte</a>. Si quelque chose ne se passe pas comme prévu, <a href="/contact">le support</a> répond en général en quelques heures.</p>
  <div class="rp-vote" data-rp-vote="creer-facture"></div></div></div>
  <div class="rp-related"><h2 class="rp-h2">Articles liés</h2><ul class="rp-list rp-list--plain">${[5, 6, 12].map((i) => artRow(ARTS[i])).join("")}</ul></div></div></article>`);

const STEPS = [["Renseigner votre entreprise", "Nom, adresse et numéro de TVA : trois minutes."], ["Importer vos clients", "Depuis un tableur, ou un par un."], ["Choisir votre modèle de facture", "Logo, couleurs et mentions par défaut."], ["Envoyer une première facture de test", "À vous-même, pour voir ce que voit votre client."], ["Activer la double authentification", "Un dernier réglage de sécurité."]];
const premiersPage = (c) => wrap(c, lead("Premiers pas", "Cinq étapes pour être prêt", "Cochez au fur et à mesure : votre avancement est conservé dans ce navigateur."),
  sect(`<div class="rp-prog" data-rp-prog><div class="rp-prog-bar"><i data-rp-bar></i></div><p role="status" aria-live="polite" data-rp-ptxt>0 étape sur 5</p></div><ol class="rp-check">${STEPS.map(([t, x], i) => `<li data-rp-step="${i}"><span class="rp-chk" data-rp-chk="${i}" role="checkbox" aria-checked="false" aria-label="Étape ${i + 1} : ${esc(t)}"></span><div><b>${esc(t)}</b><span>${esc(x)}</span><a href="/article">Lire l'article</a></div></li>`).join("")}</ol><p class="rp-done" data-rp-done hidden><b>Bravo.</b> Vous êtes prêt. Si une étape vous a posé problème, <a href="/contact">dites-le-nous</a>.</p><p><a class="rp-btn rp-btn--line" href="/premiers-pas" data-rp-reset>Tout décocher</a></p>`));

const blocsPage = (c) => wrap(c, lead("Mise en page", "Tous les blocs d'un article d'aide", "Titres, listes, citations, tableaux, code, encadrés, colonnes et boutons."),
  sect(`<div class="rp-doc rp-doc--solo"><h2>Titre de niveau 2</h2><h3>Titre de niveau 3</h3><h4>Titre de niveau 4</h4><h5>Titre de niveau 5</h5><h6>Titre de niveau 6</h6><p>Un paragraphe avec un <a href="/premiers-pas">lien</a>, du <strong>gras</strong>, de l'<em>italique</em>, un raccourci <kbd>Ctrl</kbd> + <kbd>K</kbd> et du <code>code en ligne</code>.</p><ul><li>Puce un</li><li>Puce deux<ul><li>Sous-puce</li></ul></li></ul><ol class="rp-steps"><li><b>Étape un</b> avec une explication.</li><li><b>Étape deux</b> avec une autre.</li></ol>
  <blockquote><p>« Le meilleur article d'aide est celui qu'on n'a pas besoin de relire. »</p><footer>— Équipe support</footer></blockquote>
  <figure class="rp-fig"><svg viewBox="0 0 640 200" role="img" aria-label="Capture schématique d'une liste de factures avec un bouton Nouvelle facture"><rect x="1" y="1" width="638" height="198" fill="none" stroke="currentColor" opacity=".4"/><rect x="20" y="20" width="160" height="28" fill="#5b3fd1"/><path d="M20 80h600M20 116h600M20 152h600" stroke="currentColor" opacity=".3" fill="none"/></svg><figcaption>Une capture d'écran schématique avec sa légende.</figcaption></figure>
  <div class="rp-tablewrap" role="region" aria-label="Tableau défilant"><table><caption>Raccourcis clavier</caption><thead><tr><th scope="col">Action</th><th scope="col">Raccourci</th><th scope="col">Page</th></tr></thead><tbody><tr><td>Rechercher</td><td><kbd>Ctrl</kbd> + <kbd>K</kbd></td><td>Toutes</td></tr><tr><td>Nouvelle facture</td><td><kbd>N</kbd></td><td>Factures</td></tr><tr><td>Envoyer</td><td><kbd>Ctrl</kbd> + <kbd>Entrée</kbd></td><td>Facture</td></tr></tbody></table></div>
  <pre class="rp-pre"><code>GET /api/factures?statut=en_retard
{ "total": 3, "montant": 1860.00 }</code></pre><div class="rp-cols"><div><h3>Colonne gauche</h3><p>Deux colonnes, une seule sur mobile.</p></div><div><h3>Colonne droite</h3><p>Même interligne, même corps.</p></div></div>
  <aside class="rp-tip" role="note"><b>Astuce.</b> Un encadré d'astuce.</aside><aside class="rp-tip rp-tip--warn" role="note"><b>Attention.</b> Un encadré d'avertissement, pour ce qui ne peut pas être annulé.</aside><p><a class="rp-btn" href="/contact">Bouton plein</a> <a class="rp-btn rp-btn--line" href="/categories">Bouton filet</a></p></div>`));

const contactPage = (c) => wrap(c, lead("Support", "Contacter le support", "Avant d'écrire, ces articles répondent à la plupart des questions."),
  sect(`<div class="rp-deflect"><h2 class="rp-h3">Les plus consultés en ce moment</h2><ul class="rp-list rp-list--plain">${[4, 16, 20].map((i) => artRow(ARTS[i])).join("")}</ul><p class="rp-small">Réponse du support en général sous quatre heures ouvrées, du lundi au vendredi.</p></div>`),
  { type: "form", heading: "Décrivez votre question", intro: "Donnez le nom de la page, ce que vous attendiez et ce qui s'est passé. Une capture d'écran peut être envoyée en réponse." });

const searchPage = (c) => wrap(c, lead("Recherche", "Chercher dans l'aide", "Un mot, une question, un message d'erreur."),
  sect(`<div class="rp-bigsearch" data-rp-search="page"></div><div class="rp-results" data-rp-results aria-live="polite"></div>`),
  sect(`<h2 class="rp-h3">Dans tout le site</h2><p class="rp-small">La recherche ci-dessus porte sur les articles d'aide ; celle-ci interroge l'ensemble du site.</p>`, "rp-sec--tight"), { type: "layout", children: [{ type: "search", props: { placeholder: "Rechercher dans le site…" } }] });
const introuvablePage = (c) => wrap(c, sect(`<p class="rp-kick">Erreur 404</p><div class="rp-h1" role="heading" aria-level="1">Cette page d'aide n'existe pas (ou plus).</div><p class="rp-sub">Elle a peut-être été fusionnée avec un autre article. Essayez la recherche ou parcourez les catégories.</p><div class="rp-bigsearch" data-rp-search="page"></div><p class="rp-pop"><a href="/categories">Toutes les catégories</a> <a href="/premiers-pas">Premiers pas</a> <a href="/contact">Contacter le support</a></p>`, "rp-lead rp-404"));
const legal = (k, t, body) => (c) => wrap(c, lead(k, t, "Document de démonstration à adapter avant publication."), sect(`<div class="rp-doc rp-doc--solo">${body}</div>`));
const mentions = legal("Mentions légales", "Mentions légales", `<h2>Éditeur</h2><p>Calepin SAS (société fictive), 12 rue des Capucines, 75002 Paris. Capital et immatriculation à renseigner.</p><h2>Direction de la publication</h2><p>Direction du support client.</p><h2>Hébergement</h2><p>Hébergeur à renseigner.</p>`);
const confid = legal("Confidentialité", "Politique de confidentialité", `<h2>Retours sur les articles</h2><p>Le bouton « Cet article vous a-t-il aidé ? » enregistre votre réponse uniquement dans votre navigateur, pour ne pas vous la redemander. Aucune donnée n'est envoyée au serveur.</p><h2>Formulaire de contact</h2><p>Nom, adresse électronique et message sont utilisés pour répondre à votre demande puis conservés douze mois.</p><h2>Vos droits</h2><p>Accès, rectification et effacement via la page <a href="/contact">Contact</a>.</p>`);

module.exports = {
  key: "repere", name: "Repère", version: "1.0.0", collection: "pro", category: "services", tags: ["moderne", "technique", "minimaliste"], siteType: "Centre d'aide et base de connaissances",
  concept: "Le repère que l'on cherche quand on est perdu : une recherche instantanée au centre, des catégories lisibles, des articles à sommaire et un « cet article vous a-t-il aidé ? » qui mène au support.",
  description: "Centre d'aide : recherche instantanée au clavier, 6 catégories, 24 articles, article avec sommaire, « utile ? » mémorisé, liste de premiers pas à cocher, contact avec suggestions.",
  brand: "Repère — Centre d'aide Calepin", modules: ["recherche", "formulaires"],
  contentModel: "Les 24 articles d'aide et les 6 catégories sont des données écrites dans les pages du thème (pas de type de contenu « article d'aide » dans le CMS). Les retours « utile ? » restent dans le navigateur ; aucune statistique serveur.",
  dna: { hero: "titre-central-et-champ-de-recherche-geant", header: "bandeau-d-etat-barre-et-mini-recherche", grid: "cartes-de-categories-et-index-en-lignes", typo: "plus-jakarta-sans-et-onest", shapes: "cartes-a-filets-fins-et-coins-de-4-px", motion: "resultats-qui-glissent-et-surlignage-jaune", rhythm: "modulaire-sections-d-egale-hauteur", signature: "recherche-instantanee-clavier-et-utile-oui-non", palette: "gris-bleute-encre-indigo-violet-franc-surligneur", image: "pictogrammes-au-trait-et-captures-schematiques", list: "articles-a-extrait-et-ligne-de-meta", article: "sommaire-colle-a-gauche-etapes-numerotees-encadres", sidebar: "sommaire-et-categories-liees-a-droite", reading: "mesure-70-caracteres-corps-17-px-et-etapes-numerotees" },
  tokens: {
    colors: { primary: "#5b3fd1", secondary: "#1c1b2e", accent: "#ffe27a", background: "#f6f7fb", surface: "#ffffff", text: "#1c1b2e", muted: "#5a5b72", success: "#1f7a4d", warning: "#8a5a00", error: "#b3261e" },
    fonts: { heading: "font.plus-jakarta-sans", body: "font.onest", button: "font.plus-jakarta-sans", link: "font.onest" },
    radius: { sm: 2, md: 4, lg: 6, button: 4, field: 4, card: 4 }, shadow: { card: "none", button: "none" }, border: { width: 1, color: "#dcdcea" },
    type: { h1: { size: 48, weight: 800, lineHeight: 1.1 }, h2: { size: 28, weight: 700, lineHeight: 1.2 } },
  },
  options: [
    { key: "accent", label: "Couleur principale", type: "color", default: "#5b3fd1" },
    { key: "entete", label: "En-tête", type: "choice", default: "mini", choices: [["mini", "Barre avec mini-recherche"], ["classique", "Barre classique sans recherche"], ["etat", "Barre avec bandeau d'état"]] },
    { key: "pied", label: "Pied de page", type: "choice", default: "plan", choices: [["plan", "Plan du centre d'aide"], ["aide", "Appel au support seul"]] },
    { key: "liste", label: "Liste d'articles et de catégories", type: "choice", default: "cartes", choices: [["cartes", "Cartes à filets"], ["lignes", "Lignes denses"], ["colonnes", "Index en deux colonnes"]] },
    { key: "article", label: "Article d'aide", type: "choice", default: "sommaire", choices: [["sommaire", "Sommaire collé à gauche"], ["colonne", "Colonne unique, sommaire en tête"]] },
    { key: "nuit", label: "Mode sombre", type: "choice", default: "non", choices: [["non", "Clair"], ["oui", "Nuit"]] },
  ],
  menu: [["Accueil", "/"], ["Catégories", "/categories"], ["Premiers pas", "/premiers-pas"], ["Recherche", "/recherche"], ["Contact", "/contact"]],
  pages: [
    { key: "accueil", name: "Accueil", render: accueil }, { key: "categories", name: "Catégories et articles", render: categoriesPage }, { key: "categorie", name: "Catégorie", render: categoriePage },
    { key: "article", name: "Article d'aide", render: articlePage }, { key: "premiers-pas", name: "Premiers pas", render: premiersPage }, { key: "blocs", name: "Blocs", render: blocsPage },
    { key: "contact", name: "Contact", render: contactPage }, { key: "recherche", name: "Recherche", render: searchPage }, { key: "introuvable", name: "Page introuvable", render: introuvablePage },
    { key: "mentions", name: "Mentions légales", render: mentions }, { key: "confidentialite", name: "Confidentialité", render: confid },
  ],
};

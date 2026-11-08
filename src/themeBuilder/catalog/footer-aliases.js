// GEL DES IDENTIFIANTS du catalogue « Pied de page » d'avant la refonte (100 identifiants "composition.identité"), et TABLE D'ALIAS.
// Généré par code à partir de l'ancien catalogue (footer/ancien.js) le 8 novembre 2026 ; ne pas retaper à la main. Le test tests/footer-aliases.test.js vérifie que cette liste est exactement celle de l'ancien catalogue.
//
// POURQUOI : les pieds déjà installés sur des sites sont des COPIES indépendantes (rien à migrer), mais leur colonne mk_tb_templates.origin_key garde l'identifiant du modèle d'origine ;
// « Revenir au modèle d'origine », la vignette et l'aperçu relisent le catalogue avec cet identifiant. Un identifiant ne doit donc JAMAIS devenir introuvable.
//
// RÈGLES
//  1. ANCIENS_IDENTIFIANTS ne change jamais (ni ajout, ni retrait, ni renommage).
//  2. ALIAS[ancien] = identifiant qui le remplace. Les 15 familles étant construites, chaque ancien pointe vers un identifiant NOUVEAU (« ft-<famille>-<nn>-<nom> ») : « Revenir au modèle d'origine » donnera alors le modèle qui remplace l'ancien.
//  3. Un ancien identifiant n'est JAMAIS listé dans la bibliothèque dès que sa famille est construite (champ built) ou qu'il est redirigé vers un autre modèle ; il reste seulement ouvrable.
//  4. Une valeur d'alias doit être un nouveau modèle existant : le test le vérifie.
const ANCIENS_IDENTIFIANTS = Object.freeze([
  "ligne-copyright-menu.clair",
  "logo-et-copyright.marque",
  "copyright-centre-seul.nuit",
  "copyright-et-legal.editorial",
  "logo-menu-reseaux.doux",
  "titre-copyright-reseaux.clair",
  "menu-puis-copyright.marque",
  "filet-menu-legal.nuit",
  "copyright-et-bouton.editorial",
  "trois-zones.doux",
  "trois-colonnes-marque.marque",
  "quatre-colonnes-liens.nuit",
  "cinq-colonnes-grand-site.editorial",
  "deux-colonnes-asymetriques.doux",
  "trois-navigations.clair",
  "colonnes-et-appel.marque",
  "colonnes-centrees.nuit",
  "quatre-colonnes-sans-marque.editorial",
  "colonnes-et-barre-alternee.doux",
  "colonnes-en-cartes.clair",
  "newsletter-carte-centree.nuit",
  "newsletter-et-menus.editorial",
  "newsletter-bandeau-couleur.doux",
  "newsletter-marque-a-gauche.clair",
  "newsletter-et-reseaux.marque",
  "newsletter-titre-geant.nuit",
  "newsletter-deux-rangees.editorial",
  "newsletter-compacte.doux",
  "newsletter-reseaux-centres.clair",
  "newsletter-blog.marque",
  "coordonnees-trois-colonnes.editorial",
  "carte-a-droite.doux",
  "carte-pleine-largeur.clair",
  "coordonnees-bandeau-couleur.marque",
  "contact-rendez-vous.nuit",
  "horaires-et-carte.editorial",
  "contact-et-reseaux.doux",
  "contact-centre.clair",
  "carte-a-gauche.marque",
  "contact-compact.nuit",
  "reseaux-centres.doux",
  "reseaux-logo-menu.clair",
  "reseaux-colonne-droite.marque",
  "reseaux-bandeau-couleur.nuit",
  "reseaux-trois-liens-legaux.editorial",
  "reseaux-pastilles-carrees.doux",
  "reseaux-et-abonnement.clair",
  "reseaux-titre-geant.marque",
  "reseaux-et-coordonnees.nuit",
  "reseaux-deux-rangees.editorial",
  "boutique-quatre-colonnes.clair",
  "boutique-service-client.marque",
  "boutique-compte-panier.nuit",
  "boutique-recherche.editorial",
  "boutique-offres-newsletter.doux",
  "boutique-bandeau-appel.clair",
  "boutique-formations.marque",
  "boutique-categories-articles.nuit",
  "boutique-mini.editorial",
  "boutique-cartes.doux",
  "journal-titre-et-filets.marque",
  "magazine-trois-listes.nuit",
  "blog-recherche-et-recents.editorial",
  "editorial-quatre-colonnes.doux",
  "blog-abonnement-et-rubriques.clair",
  "journal-date-et-reseaux.marque",
  "magazine-populaires-et-reseaux.nuit",
  "blog-a-lire.editorial",
  "editorial-colophon.doux",
  "magazine-archives.clair",
  "entreprise-bandeau-appel.nuit",
  "saas-produit-ressources.editorial",
  "saas-essai-gratuit.doux",
  "corporate-trois-groupes.clair",
  "corporate-rendez-vous.marque",
  "saas-compte-et-aide.nuit",
  "corporate-reseaux-legal.editorial",
  "saas-newsletter-produit.doux",
  "corporate-sombre-large.clair",
  "entreprise-deux-niveaux.marque",
  "marque-en-geant.editorial",
  "cartes-coordonnees.doux",
  "asymetrique-invitation.clair",
  "cadre-contour.marque",
  "accordeons-mobile.nuit",
  "portfolio-titre-et-reseaux.editorial",
  "invitation-geante-couleur.doux",
  "pile-a-gauche.clair",
  "annonce-et-liens.marque",
  "double-bande-cartes.nuit",
  "centre-logo-menu-copyright.doux",
  "centre-reseaux.clair",
  "centre-titre-double-filet.marque",
  "centre-abonnement.nuit",
  "centre-question.editorial",
  "centre-legal.doux",
  "centre-logo-au-milieu.clair",
  "centre-presentation.marque",
  "centre-deux-lignes.nuit",
  "centre-contact.editorial",
]);

// ancien → remplaçant : chaque ancien identifiant pointe vers le NOUVEAU modèle le plus proche par usage et par structure (voir docs/footer-builder/ALIAS_ANCIENS_MODELES.md pour la table argumentée).
// Plusieurs anciens peuvent pointer vers le même nouveau modèle. Un test vérifie que chaque cible est un vrai nouveau modèle listé.
const ALIAS = Object.freeze({
  // Minimalistes : une ligne ou deux, quelques mots
  "ligne-copyright-menu.clair": "ft-minimalistes-03-barre-fine-retour-en-haut", // une seule ligne copyright + liens
  "logo-et-copyright.marque": "ft-minimalistes-07-deux-zones-asymetriques", // identité d'un côté, copyright de l'autre
  "copyright-centre-seul.nuit": "ft-minimalistes-05-cartouche-centre", // pied réduit au copyright, centré
  "copyright-et-legal.editorial": "ft-minimalistes-03-barre-fine-retour-en-haut", // copyright et liens légaux sur une ligne
  "logo-menu-reseaux.doux": "ft-minimalistes-04-marque-phrase-reseaux", // marque, menu et réseaux sur une ligne
  "titre-copyright-reseaux.clair": "ft-minimalistes-04-marque-phrase-reseaux", // titre, mention et réseaux
  "menu-puis-copyright.marque": "ft-minimalistes-01-menu-et-mentions", // menu puis mentions, deux lignes
  "filet-menu-legal.nuit": "ft-minimalistes-01-menu-et-mentions", // menu entre filets puis mentions
  "copyright-et-bouton.editorial": "ft-minimalistes-03-barre-fine-retour-en-haut", // copyright à gauche, bouton à droite
  "trois-zones.doux": "ft-minimalistes-08-trois-volets-compacts", // trois petites zones côte à côte
  // Corporate : colonnes d'entreprise
  "trois-colonnes-marque.marque": "ft-corporate-01-grande-marque-volets", // marque + navigation + contact en colonnes
  "quatre-colonnes-liens.nuit": "ft-corporate-01-grande-marque-volets", // quatre volets de liens
  "cinq-colonnes-grand-site.editorial": "ft-corporate-02-bandeau-appel-cinq-colonnes", // cinq colonnes pour un grand site
  "deux-colonnes-asymetriques.doux": "ft-corporate-01-grande-marque-volets", // grande zone de marque face à des liens
  "trois-navigations.clair": "ft-corporate-03-double-navigation-services", // plusieurs groupes de navigation
  "colonnes-et-appel.marque": "ft-corporate-02-bandeau-appel-cinq-colonnes", // appel à l'action au-dessus des colonnes
  "colonnes-centrees.nuit": "ft-corporate-06-certifications-centre", // colonnes centrées sous une marque centrée
  "quatre-colonnes-sans-marque.editorial": "ft-corporate-05-implantations-en-colonnes", // quatre colonnes d'information sans bloc de marque
  "colonnes-et-barre-alternee.doux": "ft-corporate-08-contact-et-trois-niveaux-legaux", // colonnes puis barre de mentions distincte
  "colonnes-en-cartes.clair": "ft-corporate-04-rendez-vous-en-cartes", // colonnes présentées en cartes
  "entreprise-bandeau-appel.nuit": "ft-corporate-02-bandeau-appel-cinq-colonnes", // bandeau d'appel puis colonnes
  "corporate-trois-groupes.clair": "ft-corporate-03-double-navigation-services", // groupes de navigation avec bouton
  "corporate-rendez-vous.marque": "ft-corporate-04-rendez-vous-en-cartes", // navigation et prise de rendez-vous
  "corporate-reseaux-legal.editorial": "ft-corporate-08-contact-et-trois-niveaux-legaux", // réseaux et mentions légales renforcées
  "corporate-sombre-large.clair": "ft-corporate-07-affiche-noir-et-or", // grand pied sombre à fort caractère
  "entreprise-deux-niveaux.marque": "ft-corporate-01-grande-marque-volets", // deux niveaux : marque/liens puis mentions
  // Lettre d'information et communauté (abonnement, réseaux)
  "newsletter-carte-centree.nuit": "ft-landing-pages-06-capture-sobre-colonne", // abonnement seul dans une carte centrée
  "newsletter-et-menus.editorial": "ft-communautes-03-club-accueil-et-gazette", // abonnement + menus
  "newsletter-bandeau-couleur.doux": "ft-editoriaux-07-lettre-independante", // bandeau d'abonnement en couleur
  "newsletter-marque-a-gauche.clair": "ft-saas-tech-07-lettre-et-nouveautes", // abonnement en grande colonne à gauche + liens
  "newsletter-et-reseaux.marque": "ft-communautes-03-club-accueil-et-gazette", // abonnement et réseaux sociaux
  "newsletter-titre-geant.nuit": "ft-ecommerce-07-club-newsletter", // très grand titre d'invitation à s'abonner
  "newsletter-deux-rangees.editorial": "ft-saas-tech-07-lettre-et-nouveautes", // invitation puis liens en deux rangées
  "newsletter-compacte.doux": "ft-landing-pages-03-inscription-courte-honnete", // petit formulaire d'inscription compact
  "newsletter-reseaux-centres.clair": "ft-communautes-06-groupes-grandes-pastilles", // abonnement et réseaux centrés en pastilles
  "newsletter-blog.marque": "ft-editoriaux-03-carnet-chaleureux", // blog : abonnement, récents et rubriques
  "reseaux-centres.doux": "ft-communautes-06-groupes-grandes-pastilles", // réseaux centrés en pastilles
  "reseaux-logo-menu.clair": "ft-minimalistes-04-marque-phrase-reseaux", // logo, navigation et réseaux sur une rangée
  "reseaux-colonne-droite.marque": "ft-communautes-01-reseau-social-dense", // réseaux dans une colonne latérale
  "reseaux-bandeau-couleur.nuit": "ft-ong-associations-02-association-quartier-chaleureuse", // bandeau de réseaux coloré (associatif)
  "reseaux-trois-liens-legaux.editorial": "ft-communautes-02-forum-rubriques-et-charte", // réseaux et liens légaux
  "reseaux-pastilles-carrees.doux": "ft-communautes-06-groupes-grandes-pastilles", // réseaux en grandes pastilles
  "reseaux-et-abonnement.clair": "ft-communautes-03-club-accueil-et-gazette", // réseaux + abonnement
  "reseaux-titre-geant.marque": "ft-creatifs-portfolios-01-pied-affiche-titre-geant", // très grand titre avec réseaux
  "reseaux-et-coordonnees.nuit": "ft-communautes-01-reseau-social-dense", // réseaux et coordonnées en colonnes
  "reseaux-deux-rangees.editorial": "ft-communautes-01-reseau-social-dense", // navigation puis réseaux en deux rangées
  // Services et contact (coordonnées, cartes, horaires)
  "coordonnees-trois-colonnes.editorial": "ft-services-05-domicile-zone-horaires", // coordonnées en trois colonnes
  "carte-a-droite.doux": "ft-immobilier-01-agence-de-quartier-estimation", // coordonnées avec carte (agence)
  "carte-pleine-largeur.clair": "ft-services-05-domicile-zone-horaires", // carte large sous les colonnes
  "coordonnees-bandeau-couleur.marque": "ft-services-01-artisan-grand-telephone", // bandeau de coordonnées coloré avec téléphone
  "contact-rendez-vous.nuit": "ft-finance-juridique-04-cabinet-comptable-echeances", // cabinet : contact et rendez-vous
  "horaires-et-carte.editorial": "ft-restauration-hotellerie-05-maison-hotes-carte-horaires", // horaires, carte et navigation
  "contact-et-reseaux.doux": "ft-services-04-agence-devis-formulaire", // contact, réseaux et liens
  "contact-centre.clair": "ft-services-02-consultant-rendez-vous-sobre", // coordonnées centrées et sobres
  "carte-a-gauche.marque": "ft-services-05-domicile-zone-horaires", // carte à gauche, contact à droite
  "contact-compact.nuit": "ft-services-02-consultant-rendez-vous-sobre", // contact compact
  "centre-presentation.marque": "ft-services-06-cabinet-de-soins-accueillant", // présentation centrée (santé)
  // Boutique et e-commerce
  "boutique-quatre-colonnes.clair": "ft-ecommerce-01-mega-enseigne", // boutique en quatre colonnes denses
  "boutique-service-client.marque": "ft-ecommerce-08-service-client-en-deux-volets", // service client mis en avant
  "boutique-compte-panier.nuit": "ft-ecommerce-06-mobile-first", // compte, panier, suivi
  "boutique-recherche.editorial": "ft-ecommerce-06-mobile-first", // recherche dans le catalogue
  "boutique-offres-newsletter.doux": "ft-ecommerce-07-club-newsletter", // offres par e-mail
  "boutique-bandeau-appel.clair": "ft-ecommerce-03-place-de-marche", // bandeau d'appel vers la boutique
  "boutique-formations.marque": "ft-education-04-centre-de-formation-inscription", // formations et espace élève
  "boutique-categories-articles.nuit": "ft-ecommerce-03-place-de-marche", // catégories et articles en colonnes
  "boutique-mini.editorial": "ft-ecommerce-02-maison-luxe-sobre", // boutique minimale et aérée
  "boutique-cartes.doux": "ft-ecommerce-04-boutique-de-niche", // boutique en cartes
  // Éditoriaux : journal, blog, magazine
  "journal-titre-et-filets.marque": "ft-editoriaux-01-pied-de-journal", // titre de journal entre filets
  "magazine-trois-listes.nuit": "ft-editoriaux-02-grandes-rubriques", // listes d'articles par rubrique
  "blog-recherche-et-recents.editorial": "ft-editoriaux-04-media-numerique-nuit", // recherche et articles récents
  "editorial-quatre-colonnes.doux": "ft-editoriaux-02-grandes-rubriques", // quatre colonnes éditoriales
  "blog-abonnement-et-rubriques.clair": "ft-editoriaux-07-lettre-independante", // abonnement et rubriques
  "journal-date-et-reseaux.marque": "ft-editoriaux-01-pied-de-journal", // date du jour, réseaux et grand titre
  "magazine-populaires-et-reseaux.nuit": "ft-editoriaux-06-journal-de-quartier", // articles populaires, réseaux et à propos
  "blog-a-lire.editorial": "ft-editoriaux-03-carnet-chaleureux", // suggestions de lecture
  "editorial-colophon.doux": "ft-editoriaux-05-revue-et-colophon", // colophon centré
  "magazine-archives.clair": "ft-editoriaux-04-media-numerique-nuit", // rubriques, récents, populaires, recherche
  // SaaS et technologie
  "saas-produit-ressources.editorial": "ft-saas-tech-01-mega-pied-six-colonnes", // produit, ressources, entreprise
  "saas-essai-gratuit.doux": "ft-saas-tech-03-grand-appel-essai-gratuit", // invitation à l'essai gratuit
  "saas-compte-et-aide.nuit": "ft-saas-tech-02-pied-minimal-produit", // compte, aide et navigation légers
  "saas-newsletter-produit.doux": "ft-saas-tech-07-lettre-et-nouveautes", // produit et actualités
  // Créatifs, portfolios et agences
  "marque-en-geant.editorial": "ft-creatifs-portfolios-01-pied-affiche-titre-geant", // grande zone de marque
  "cartes-coordonnees.doux": "ft-creatifs-portfolios-04-index-projets-reseaux", // trois cartes de contacts
  "asymetrique-invitation.clair": "ft-creatifs-portfolios-03-invitation-a-ecrire", // invitation à écrire, mise en page asymétrique
  "cadre-contour.marque": "ft-creatifs-portfolios-02-cadre-exposition", // cadre dessiné autour du contenu
  "accordeons-mobile.nuit": "ft-corporate-03-double-navigation-services", // rubriques qui se déplient sur mobile
  "portfolio-titre-et-reseaux.editorial": "ft-creatifs-portfolios-04-index-projets-reseaux", // titre de portfolio et grands réseaux
  "invitation-geante-couleur.doux": "ft-creatifs-portfolios-03-invitation-a-ecrire", // grande invitation colorée
  "pile-a-gauche.clair": "ft-creatifs-portfolios-05-signature-artiste", // pile d'éléments alignés à gauche, sobre
  "annonce-et-liens.marque": "ft-creatifs-portfolios-06-bande-annonce-neon", // annonce en bande puis liens
  "double-bande-cartes.nuit": "ft-creatifs-portfolios-04-index-projets-reseaux", // marque puis cartes alternées
  // Pieds centrés (anciennement « landing »)
  "centre-logo-menu-copyright.doux": "ft-minimalistes-01-menu-et-mentions", // logo, menu et copyright centrés
  "centre-reseaux.clair": "ft-minimalistes-04-marque-phrase-reseaux", // logo, menu et réseaux centrés
  "centre-titre-double-filet.marque": "ft-minimalistes-02-signature-typographique", // titre centré sous double filet
  "centre-abonnement.nuit": "ft-landing-pages-03-inscription-courte-honnete", // logo, abonnement et navigation centrés
  "centre-question.editorial": "ft-services-03-freelance-parlons-projet", // invitation à nous contacter
  "centre-legal.doux": "ft-minimalistes-05-cartouche-centre", // navigation et mentions centrées
  "centre-logo-au-milieu.clair": "ft-ecommerce-02-maison-luxe-sobre", // logo au centre, menu de part et d'autre
  "centre-deux-lignes.nuit": "ft-minimalistes-01-menu-et-mentions", // navigation, filet, copyright
  "centre-contact.editorial": "ft-services-02-consultant-rendez-vous-sobre", // coordonnées centrées avec navigation
});

module.exports = { ANCIENS_IDENTIFIANTS, ALIAS };

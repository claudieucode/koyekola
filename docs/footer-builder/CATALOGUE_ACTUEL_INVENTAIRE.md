# Catalogue actuel des pieds de page : inventaire des 100 modèles

Date : 8 novembre 2026. Dépôt : branche audit-footer (copie de main).

**Vérifié par exécution** : le tableau a été produit en chargeant `src/themeBuilder/catalog` par code (Node) et en parcourant le document réel de chaque modèle (`thumbDoc`), avec et sans formulaire d'inscription du site. **Non vérifié ici** : rendu visuel des 100 (voir AUDIT_CAHIER_DES_CHARGES_ECARTS.md pour ce qui a été mesuré dans Chrome).

Lecture des colonnes : « Rangées » = bandes pleine largeur empilées ; « Zones » = nombre de colonnes/zones de chaque rangée (ex. 4/2 = 4 colonnes puis 2 zones) ; « Newsletter » : « formulaire réel » = le modèle contient le bloc d'inscription relié à un formulaire du site s'il en existe un ; sinon il affiche seulement un titre, un texte et un bouton « Nous contacter » (pas de champ e-mail). « Accordéon mobile » = seul modèle avec des blocs repliables. Les réseaux affichés par défaut sont Facebook, LinkedIn, Instagram (et YouTube pour les grandes icônes) : réglable ensuite dans l'éditeur.

| # | Identifiant (id stable) | Nom | Famille déclarée | Identité | Rangées | Zones | Widgets de données / spéciaux | Newsletter | Réseaux | Contact | Paiement | Accordéon |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `ligne-copyright-menu.clair` | Une ligne | Minimal et compact | lumiere | 1 | 2 | - | - | - | - | - | - |
| 2 | `logo-et-copyright.marque` | Logo et copyright | Minimal et compact | cobalt | 1 | 2 | - | - | - | - | - | - |
| 3 | `copyright-centre-seul.nuit` | Copyright seul, centré | Minimal et compact | minuit | 1 | 1 | - | - | - | - | - | - |
| 4 | `copyright-et-legal.editorial` | Copyright et liens légaux | Minimal et compact | journal | 1 | 2 | bizlegal | - | - | - | - | - |
| 5 | `logo-menu-reseaux.doux` | Logo, menu et réseaux | Minimal et compact | rose | 2 | 2/1 | social | - | oui | - | - | - |
| 6 | `titre-copyright-reseaux.clair` | Titre, copyright et réseaux | Minimal et compact | terracotta | 1 | 2 | social | - | oui | - | - | - |
| 7 | `menu-puis-copyright.marque` | Menu puis copyright | Minimal et compact | emeraude | 2 | 1/1 | - | - | - | - | - | - |
| 8 | `filet-menu-legal.nuit` | Filet, menu et mentions | Minimal et compact | graphite | 2 | 2/1 | bizlegal | - | - | - | - | - |
| 9 | `copyright-et-bouton.editorial` | Copyright et bouton de contact | Minimal et compact | revue | 1 | 2 | - | - | - | - | - | - |
| 10 | `trois-zones.doux` | Trois zones | Minimal et compact | menthe | 1 | 3 | - | - | - | - | - | - |
| 11 | `trois-colonnes-marque.marque` | Marque, navigation et contact | Multi-colonnes | prune | 2 | 3/2 | bizcontact, bizlegal | - | - | oui | - | - |
| 12 | `quatre-colonnes-liens.nuit` | Quatre colonnes de liens | Multi-colonnes | foret | 2 | 4/2 | querylist, bizlegal | - | - | - | - | - |
| 13 | `cinq-colonnes-grand-site.editorial` | Cinq colonnes pour un grand site | Multi-colonnes | gazette | 2 | 5/2 | querylist, social, bizlegal | - | oui | - | - | - |
| 14 | `deux-colonnes-asymetriques.doux` | Deux colonnes asymétriques | Multi-colonnes | ciel | 2 | 2/1 | social | - | oui | - | - | - |
| 15 | `trois-navigations.clair` | Trois navigations | Multi-colonnes | sauge | 2 | 3/1 | - | - | - | - | - | - |
| 16 | `colonnes-et-appel.marque` | Colonnes et appel à l'action | Multi-colonnes | brique | 2 | 3/2 | bizlegal | - | - | - | - | - |
| 17 | `colonnes-centrees.nuit` | Colonnes centrées | Multi-colonnes | bordeaux | 2 | 3/1 | bizcontact | - | - | oui | - | - |
| 18 | `quatre-colonnes-sans-marque.editorial` | Quatre colonnes sans marque | Multi-colonnes | atlas | 2 | 4/1 | querylist | - | - | - | - | - |
| 19 | `colonnes-et-barre-alternee.doux` | Colonnes et barre alternée | Multi-colonnes | lavande | 2 | 3/2 | bizcontact, bizlegal | - | - | oui | - | - |
| 20 | `colonnes-en-cartes.clair` | Colonnes en cartes | Multi-colonnes | corail | 2 | 3/1 | bizcontact | - | - | oui | - | - |
| 21 | `newsletter-carte-centree.nuit` | Abonnement en carte centrée | Newsletter et abonnement | minuit | 1 | 2 | - | formulaire réel (si formulaire) | - | - | - | - |
| 22 | `newsletter-et-menus.editorial` | Abonnement et deux menus | Newsletter et abonnement | manuscrit | 2 | 3/2 | bizlegal, backtotop | formulaire réel (si formulaire) | - | - | - | - |
| 23 | `newsletter-bandeau-couleur.doux` | Bandeau d'abonnement coloré | Newsletter et abonnement | rose | 2 | 1/2 | - | formulaire réel (si formulaire) | - | - | - | - |
| 24 | `newsletter-marque-a-gauche.clair` | Marque et abonnement à gauche | Newsletter et abonnement | grisindigo | 2 | 3/2 | bizlegal | formulaire réel (si formulaire) | - | - | - | - |
| 25 | `newsletter-et-reseaux.marque` | Abonnement et réseaux | Newsletter et abonnement | cobalt | 2 | 2/1 | social | formulaire réel (si formulaire) | oui | - | - | - |
| 26 | `newsletter-titre-geant.nuit` | Grand titre d'abonnement | Newsletter et abonnement | graphite | 2 | 3/1 | - | formulaire réel (si formulaire) | - | - | - | - |
| 27 | `newsletter-deux-rangees.editorial` | Deux rangées : invitation puis liens | Newsletter et abonnement | journal | 3 | 2/3/1 | social | formulaire réel (si formulaire) | oui | - | - | - |
| 28 | `newsletter-compacte.doux` | Abonnement compact | Newsletter et abonnement | menthe | 1 | 2 | - | formulaire réel (si formulaire) | - | - | - | - |
| 29 | `newsletter-reseaux-centres.clair` | Abonnement, réseaux et copyright centrés | Newsletter et abonnement | lumiere | 1 | 3 | social | formulaire réel (si formulaire) | oui | - | - | - |
| 30 | `newsletter-blog.marque` | Abonnement, récents et rubriques | Newsletter et abonnement | emeraude | 2 | 3/2 | querylist, bizlegal, backtotop | formulaire réel (si formulaire) | - | - | - | - |
| 31 | `coordonnees-trois-colonnes.editorial` | Coordonnées en trois colonnes | Coordonnées et carte | revue | 2 | 3/2 | bizcontact, bizhours, bizlegal, backtotop | - | - | oui | - | - |
| 32 | `carte-a-droite.doux` | Coordonnées et carte à droite | Coordonnées et carte | immo | 2 | 2/2 | bizcontact, bizhours, map, bizlegal, backtotop | - | - | oui | - | - |
| 33 | `carte-pleine-largeur.clair` | Carte large sous les colonnes | Coordonnées et carte | terracotta | 3 | 3/1/2 | bizcontact, map, bizlegal, backtotop | - | - | oui | - | - |
| 34 | `coordonnees-bandeau-couleur.marque` | Bandeau de coordonnées coloré | Coordonnées et carte | prune | 2 | 2/2 | bizcontact | - | - | oui | - | - |
| 35 | `contact-rendez-vous.nuit` | Contact et rendez-vous | Coordonnées et carte | cabinet | 2 | 3/2 | bizcontact, bizphone, bizlegal, backtotop | - | - | oui | - | - |
| 36 | `horaires-et-carte.editorial` | Horaires, carte et navigation | Coordonnées et carte | resto | 2 | 3/1 | bizhours, map | - | - | - | - | - |
| 37 | `contact-et-reseaux.doux` | Contact, réseaux et liens | Coordonnées et carte | ciel | 2 | 3/2 | bizcontact, social, bizlegal | - | oui | oui | - | - |
| 38 | `contact-centre.clair` | Coordonnées centrées | Coordonnées et carte | sauge | 1 | 5 | bizcontact | - | - | oui | - | - |
| 39 | `carte-a-gauche.marque` | Carte à gauche, contact à droite | Coordonnées et carte | brique | 2 | 2/2 | map, bizcontact, bizhours, bizlegal | - | - | oui | - | - |
| 40 | `contact-compact.nuit` | Contact compact | Coordonnées et carte | foret | 2 | 2/2 | bizcontact, social, bizlegal | - | oui | oui | - | - |
| 41 | `reseaux-centres.doux` | Réseaux centrés | Réseaux sociaux et légal | lavande | 1 | 3 | social | - | oui | - | - | - |
| 42 | `reseaux-logo-menu.clair` | Rangée logo, navigation et réseaux | Réseaux sociaux et légal | corail | 2 | 2/2 | social, bizlegal, backtotop | - | oui | - | - | - |
| 43 | `reseaux-colonne-droite.marque` | Réseaux en colonne de droite | Réseaux sociaux et légal | cobalt | 2 | 3/2 | social, bizlegal | - | oui | - | - | - |
| 44 | `reseaux-bandeau-couleur.nuit` | Bandeau de réseaux coloré | Réseaux sociaux et légal | asso | 2 | 2/2 | social | texte + bouton | oui | - | - | - |
| 45 | `reseaux-trois-liens-legaux.editorial` | Réseaux et trois liens légaux | Réseaux sociaux et légal | gazette | 1 | 2 | bizlegal, social | - | oui | - | - | - |
| 46 | `reseaux-pastilles-carrees.doux` | Pastilles carrées | Réseaux sociaux et légal | rose | 2 | 2/2 | social | - | oui | - | - | - |
| 47 | `reseaux-et-abonnement.clair` | Réseaux et abonnement | Réseaux sociaux et légal | grisindigo | 2 | 2/1 | social | formulaire réel (si formulaire) | oui | - | - | - |
| 48 | `reseaux-titre-geant.marque` | Grand titre et réseaux | Réseaux sociaux et légal | emeraude | 2 | 3/1 | social, bizlegal | - | oui | - | - | - |
| 49 | `reseaux-et-coordonnees.nuit` | Réseaux et coordonnées | Réseaux sociaux et légal | bordeaux | 2 | 3/2 | bizcontact, social, bizlegal | - | oui | oui | - | - |
| 50 | `reseaux-deux-rangees.editorial` | Deux rangées : navigation puis réseaux | Réseaux sociaux et légal | atlas | 2 | 2/3 | social, bizlegal | - | oui | - | - | - |
| 51 | `boutique-quatre-colonnes.clair` | Boutique en quatre colonnes | Boutique et e-commerce | mode | 2 | 4/2 | bizpayments, bizdelivery, account, minicart, bizlegal, backtotop | - | - | - | oui | - |
| 52 | `boutique-service-client.marque` | Service client et boutique | Boutique et e-commerce | prune | 2 | 3/2 | social, bizphone, bizemail, bizdelivery, bizpayments | - | oui | oui | oui | - |
| 53 | `boutique-compte-panier.nuit` | Compte et panier en ligne | Boutique et e-commerce | minuit | 2 | 2/2 | account, minicart, bizpayments, bizlegal, backtotop | - | - | - | oui | - |
| 54 | `boutique-recherche.editorial` | Recherche dans le catalogue | Boutique et e-commerce | manuscrit | 2 | 3/2 | search, bizdelivery, account, social | - | oui | - | - | - |
| 55 | `boutique-offres-newsletter.doux` | Offres par e-mail | Boutique et e-commerce | menthe | 2 | 3/2 | account, minicart, bizpayments | formulaire réel (si formulaire) | - | - | oui | - |
| 56 | `boutique-bandeau-appel.clair` | Bandeau d'appel vers la boutique | Boutique et e-commerce | lumiere | 2 | 2/2 | - | - | - | - | - | - |
| 57 | `boutique-formations.marque` | Formations et espace élève | Boutique et e-commerce | ecole | 2 | 3/2 | courselist, account, bizlegal, backtotop | - | - | - | - | - |
| 58 | `boutique-categories-articles.nuit` | Catégories et articles | Boutique et e-commerce | graphite | 2 | 4/1 | querylist, social | - | oui | - | - | - |
| 59 | `boutique-mini.editorial` | Boutique minimale | Boutique et e-commerce | journal | 2 | 2/1 | minicart | - | - | - | - | - |
| 60 | `boutique-cartes.doux` | Boutique en cartes | Boutique et e-commerce | ciel | 2 | 3/1 | bizpayments, bizdelivery, account, minicart | - | - | - | oui | - |
| 61 | `journal-titre-et-filets.marque` | Titre de journal sous double filet | Éditorial et magazine | media | 2 | 3/2 | dyntext, bizlegal | - | - | - | - | - |
| 62 | `magazine-trois-listes.nuit` | Trois listes d'articles | Éditorial et magazine | foret | 2 | 3/2 | querylist, social, backtotop | - | oui | - | - | - |
| 63 | `blog-recherche-et-recents.editorial` | Blog, recherche et récents | Éditorial et magazine | revue | 2 | 3/1 | search, querylist | - | - | - | - | - |
| 64 | `editorial-quatre-colonnes.doux` | Quatre colonnes éditoriales | Éditorial et magazine | lavande | 2 | 4/2 | querylist, dyntext, backtotop | - | - | - | - | - |
| 65 | `blog-abonnement-et-rubriques.clair` | Abonnement au blog | Éditorial et magazine | terracotta | 2 | 3/2 | querylist, bizlegal, backtotop | formulaire réel (si formulaire) | - | - | - | - |
| 66 | `journal-date-et-reseaux.marque` | Date, réseaux et grand titre | Éditorial et magazine | brique | 3 | 2/2/2 | dyntext, social, bizlegal, backtotop | - | oui | - | - | - |
| 67 | `magazine-populaires-et-reseaux.nuit` | Populaires, réseaux et à propos | Éditorial et magazine | bordeaux | 2 | 3/1 | querylist, social | - | oui | - | - | - |
| 68 | `blog-a-lire.editorial` | À lire aussi | Éditorial et magazine | gazette | 2 | 2/2 | querylist, backtotop | - | - | - | - | - |
| 69 | `editorial-colophon.doux` | Colophon centré | Éditorial et magazine | rose | 1 | 5 | divider | - | - | - | - | - |
| 70 | `magazine-archives.clair` | Rubriques, récents, populaires, recherche | Éditorial et magazine | sauge | 2 | 4/1 | querylist, search | - | - | - | - | - |
| 71 | `entreprise-bandeau-appel.nuit` | Bandeau d'appel, puis trois colonnes | Entreprise et SaaS | minuit | 3 | 2/3/2 | bizcontact, bizlegal, backtotop | - | - | oui | - | - |
| 72 | `saas-produit-ressources.editorial` | Produit, ressources, entreprise | Entreprise et SaaS | saas | 2 | 4/2 | social, bizlegal, backtotop | - | oui | - | - | - |
| 73 | `saas-essai-gratuit.doux` | Invitation à l'essai | Entreprise et SaaS | menthe | 3 | 2/3/2 | bizlegal | - | - | - | - | - |
| 74 | `corporate-trois-groupes.clair` | Marque, navigation, contact et bouton | Entreprise et SaaS | corail | 2 | 3/2 | bizcontact, bizlegal, backtotop | - | - | oui | - | - |
| 75 | `corporate-rendez-vous.marque` | Navigation et rendez-vous | Entreprise et SaaS | cobalt | 2 | 2/2 | bizphone, bizlegal, backtotop | - | - | oui | - | - |
| 76 | `saas-compte-et-aide.nuit` | Compte, aide et navigation | Entreprise et SaaS | graphite | 2 | 3/1 | - | - | - | - | - | - |
| 77 | `corporate-reseaux-legal.editorial` | Entreprise : réseaux et mentions légales | Entreprise et SaaS | atlas | 2 | 3/2 | social, bizlegal, backtotop | - | oui | - | - | - |
| 78 | `saas-newsletter-produit.doux` | Produit et actualités | Entreprise et SaaS | ciel | 2 | 3/2 | bizlegal, backtotop | formulaire réel (si formulaire) | - | - | - | - |
| 79 | `corporate-sombre-large.clair` | Pied sombre large | Entreprise et SaaS | grisindigo | 2 | 4/2 | bizcontact, bizlegal, backtotop | - | - | oui | - | - |
| 80 | `entreprise-deux-niveaux.marque` | Deux niveaux | Entreprise et SaaS | emeraude | 2 | 3/3 | social | - | oui | - | - | - |
| 81 | `marque-en-geant.editorial` | Grande zone de marque | Créatif et portfolio | agence | 2 | 3/1 | - | - | - | - | - | - |
| 82 | `cartes-coordonnees.doux` | Trois cartes ombrées | Créatif et portfolio | lavande | 2 | 3/1 | bizcontact | - | - | oui | - | - |
| 83 | `asymetrique-invitation.clair` | Invitation asymétrique | Créatif et portfolio | lumiere | 2 | 2/2 | - | - | - | - | - | - |
| 84 | `cadre-contour.marque` | Cadre contour | Créatif et portfolio | prune | 2 | 3/1 | bizcontact | - | - | oui | - | - |
| 85 | `accordeons-mobile.nuit` | Rubriques qui se déplient | Créatif et portfolio | foret | 2 | 2/2 | toggle | - | - | - | - | oui |
| 86 | `portfolio-titre-et-reseaux.editorial` | Portfolio : titre et grands réseaux | Créatif et portfolio | portfolio | 2 | 2/2 | social | - | oui | - | - | - |
| 87 | `invitation-geante-couleur.doux` | Grande invitation colorée | Créatif et portfolio | rose | 2 | 2/2 | social | - | oui | - | - | - |
| 88 | `pile-a-gauche.clair` | Pile à gauche | Créatif et portfolio | terracotta | 1 | 1 | - | - | - | - | - | - |
| 89 | `annonce-et-liens.marque` | Annonce et liens | Créatif et portfolio | brique | 3 | 2/3/2 | bizlegal, backtotop | - | - | - | - | - |
| 90 | `double-bande-cartes.nuit` | Marque et cartes alternées | Créatif et portfolio | bordeaux | 3 | 2/2/1 | social, bizcontact | - | oui | oui | - | - |
| 91 | `centre-logo-menu-copyright.doux` | Logo, menu et copyright centrés | Centré et navigation horizontale | menthe | 1 | 3 | - | - | - | - | - | - |
| 92 | `centre-reseaux.clair` | Logo, menu et réseaux centrés | Centré et navigation horizontale | sauge | 1 | 4 | social | - | oui | - | - | - |
| 93 | `centre-titre-double-filet.marque` | Titre centré sous double filet | Centré et navigation horizontale | cobalt | 1 | 3 | - | - | - | - | - | - |
| 94 | `centre-abonnement.nuit` | Logo, abonnement et navigation centrés | Centré et navigation horizontale | minuit | 1 | 4 | - | formulaire réel (si formulaire) | - | - | - | - |
| 95 | `centre-question.editorial` | Invitation à nous contacter | Centré et navigation horizontale | manuscrit | 1 | 4 | - | - | - | - | - | - |
| 96 | `centre-legal.doux` | Navigation et mentions centrées | Centré et navigation horizontale | ciel | 1 | 4 | bizlegal | - | - | - | - | - |
| 97 | `centre-logo-au-milieu.clair` | Logo au centre, menu et réseaux de part et d'autre | Centré et navigation horizontale | corail | 2 | 3/1 | social | - | oui | - | - | - |
| 98 | `centre-presentation.marque` | Présentation centrée | Centré et navigation horizontale | sante | 1 | 5 | social | - | oui | - | - | - |
| 99 | `centre-deux-lignes.nuit` | Navigation, filet, copyright | Centré et navigation horizontale | graphite | 1 | 3 | divider | - | - | - | - | - |
| 100 | `centre-contact.editorial` | Coordonnées centrées avec navigation | Centré et navigation horizontale | journal | 1 | 4 | bizcontact | - | - | oui | - | - |

## Descriptions déclarées

| Identifiant | Description |
|---|---|
| `ligne-copyright-menu.clair` | Copyright à gauche, navigation du pied de page à droite, sur une seule ligne. |
| `logo-et-copyright.marque` | Petit logo à gauche, copyright à droite. |
| `copyright-centre-seul.nuit` | Uniquement la ligne de copyright, centrée. |
| `copyright-et-legal.editorial` | Copyright à gauche, liens cookies et contact à droite. |
| `logo-menu-reseaux.doux` | Logo et navigation à gauche, icônes de réseaux sans fond à droite, copyright dessous. |
| `titre-copyright-reseaux.clair` | Titre du site et copyright à gauche, réseaux à droite. |
| `menu-puis-copyright.marque` | Navigation centrée, copyright centré dessous. |
| `filet-menu-legal.nuit` | Navigation et liens légaux sous un filet fin, copyright en dessous. |
| `copyright-et-bouton.editorial` | Copyright à gauche, bouton « Nous contacter » à droite. |
| `trois-zones.doux` | Titre à gauche, navigation au centre, copyright à droite. |
| `trois-colonnes-marque.marque` | Grande colonne de marque, navigation, coordonnées ; copyright et liens légaux sous un filet. |
| `quatre-colonnes-liens.nuit` | Marque, navigation du pied, navigation du site et catégories. |
| `cinq-colonnes-grand-site.editorial` | Marque, deux navigations, articles récents et réseaux. |
| `deux-colonnes-asymetriques.doux` | Large colonne de marque avec réseaux, étroite colonne de liens. |
| `trois-navigations.clair` | Navigation du pied, navigation du site et liens d'aide en trois colonnes égales. |
| `colonnes-et-appel.marque` | Marque, navigation et un encart « Une question ? » avec bouton. |
| `colonnes-centrees.nuit` | Trois colonnes dont le contenu est centré. |
| `quatre-colonnes-sans-marque.editorial` | Navigations, catégories et articles récents ; copyright centré. |
| `colonnes-et-barre-alternee.doux` | Trois colonnes, puis barre de copyright sur fond alterné. |
| `colonnes-en-cartes.clair` | Trois cartes : marque, navigation, coordonnées. |
| `newsletter-carte-centree.nuit` | Bloc d'abonnement mis en avant au centre, copyright dessous. |
| `newsletter-et-menus.editorial` | Grande colonne d'abonnement, navigation du pied et navigation du site. |
| `newsletter-bandeau-couleur.doux` | Bandeau d'abonnement de couleur au-dessus d'un pied compact. |
| `newsletter-marque-a-gauche.clair` | Marque, présentation et abonnement dans la grande colonne ; deux fines colonnes de liens. |
| `newsletter-et-reseaux.marque` | Abonnement à gauche, réseaux à droite, copyright dessous. |
| `newsletter-titre-geant.nuit` | Grand titre d'invitation, formulaire, navigation en ligne. |
| `newsletter-deux-rangees.editorial` | Rangée d'invitation (titre et abonnement), rangée de marque, navigation et réseaux. |
| `newsletter-compacte.doux` | Un abonnement et le copyright, sur une ligne. |
| `newsletter-reseaux-centres.clair` | Pile centrée : abonnement, réseaux, copyright. |
| `newsletter-blog.marque` | Abonnement, articles récents et catégories du blog. |
| `coordonnees-trois-colonnes.editorial` | Marque, navigation, coordonnées cliquables et horaires lus dans les Données de l'entreprise. |
| `carte-a-droite.doux` | Marque, coordonnées et horaires à gauche ; carte à droite. |
| `carte-pleine-largeur.clair` | Trois colonnes de contact et de liens, puis une carte pleine largeur. |
| `coordonnees-bandeau-couleur.marque` | Bandeau de couleur : coordonnées en ligne et bouton ; navigation dessous. |
| `contact-rendez-vous.nuit` | Marque, coordonnées et un bouton « Prendre rendez-vous ». |
| `horaires-et-carte.editorial` | Horaires d'ouverture (avec « ouvert maintenant »), carte et navigation en trois colonnes. |
| `contact-et-reseaux.doux` | Présentation et coordonnées, réseaux, navigation. |
| `contact-centre.clair` | Logo, coordonnées en ligne, bouton et navigation, centrés. |
| `carte-a-gauche.marque` | Grande carte à gauche, coordonnées, horaires et bouton à droite. |
| `contact-compact.nuit` | Coordonnées en ligne et réseaux, puis copyright. |
| `reseaux-centres.doux` | Invitation à suivre, grandes icônes de réseaux centrées, copyright. |
| `reseaux-logo-menu.clair` | Logo, navigation et icônes de réseaux sur une rangée ; copyright et légal dessous. |
| `reseaux-colonne-droite.marque` | Marque et navigation à gauche, réseaux et bouton à droite. |
| `reseaux-bandeau-couleur.nuit` | Bandeau de couleur : invitation et réseaux ; navigation et copyright dessous. |
| `reseaux-trois-liens-legaux.editorial` | Copyright, liens cookies / contact / FAQ et réseaux sans fond. |
| `reseaux-pastilles-carrees.doux` | Titre du site et pastilles carrées de réseaux, navigation dessous. |
| `reseaux-et-abonnement.clair` | Réseaux à gauche, abonnement à droite, copyright dessous. |
| `reseaux-titre-geant.marque` | Nom du site en très grand, réseaux et liens légaux. |
| `reseaux-et-coordonnees.nuit` | Présentation, coordonnées et réseaux en trois colonnes. |
| `reseaux-deux-rangees.editorial` | Navigation et bouton, puis rangée alternée de réseaux, copyright et légal. |
| `boutique-quatre-colonnes.clair` | Marque et moyens de paiement, aide et livraison, espace client avec panier, accès à la boutique. |
| `boutique-service-client.marque` | Marque et réseaux, service client, liens de la boutique. |
| `boutique-compte-panier.nuit` | Logo et navigation, compte et mini-panier ; copyright et légal dessous. |
| `boutique-recherche.editorial` | Grande recherche du catalogue, aide et espace client. |
| `boutique-offres-newsletter.doux` | Abonnement aux nouveautés, aide et espace client. |
| `boutique-bandeau-appel.clair` | Bandeau de couleur invitant à visiter la boutique, puis navigation compacte. |
| `boutique-formations.marque` | Formations récentes, navigation et espace élève. |
| `boutique-categories-articles.nuit` | Catégories, articles récents, aide et réseaux. |
| `boutique-mini.editorial` | Logo, navigation et panier sur une ligne, copyright centré. |
| `boutique-cartes.doux` | Trois cartes : marque, aide et espace client. |
| `journal-titre-et-filets.marque` | Titre centré, rubriques en capitales et date du jour sous double filet. |
| `magazine-trois-listes.nuit` | À la une, les plus lus et rubriques en trois colonnes. |
| `blog-recherche-et-recents.editorial` | Présentation avec recherche, articles récents et rubriques. |
| `editorial-quatre-colonnes.doux` | Titre et présentation, deux navigations et rubriques sous un filet épais. |
| `blog-abonnement-et-rubriques.clair` | Abonnement au blog, rubriques et articles récents. |
| `journal-date-et-reseaux.marque` | Date et réseaux, grand titre et rubriques, mentions en bas. |
| `magazine-populaires-et-reseaux.nuit` | Grande colonne d'articles populaires, réseaux et présentation. |
| `blog-a-lire.editorial` | Grande colonne d'articles à lire, navigation étroite. |
| `editorial-colophon.doux` | Titre, présentation, filet, rubriques en capitales et copyright, centrés. |
| `magazine-archives.clair` | Quatre colonnes de découverte du contenu. |
| `entreprise-bandeau-appel.nuit` | Bandeau de couleur « Prêt à commencer ? », puis marque, navigation, coordonnées. |
| `saas-produit-ressources.editorial` | Marque avec réseaux, puis trois colonnes de liens. |
| `saas-essai-gratuit.doux` | Invitation à commencer avec deux boutons, puis marque et navigations. |
| `corporate-trois-groupes.clair` | Les trois groupes du pied type : marque, navigation, contact avec bouton. |
| `corporate-rendez-vous.marque` | Logo, navigation et bouton de rendez-vous ; mentions dessous. |
| `saas-compte-et-aide.nuit` | Marque, accès au compte (connexion, inscription) et aide. |
| `corporate-reseaux-legal.editorial` | Titre et présentation, navigation, réseaux ; copyright et trois liens légaux. |
| `saas-newsletter-produit.doux` | Marque, navigation et abonnement aux actualités du produit. |
| `corporate-sombre-large.clair` | Rangée d'encre : marque, deux navigations, coordonnées ; mentions sur fond alterné. |
| `entreprise-deux-niveaux.marque` | Rangée alternée de navigations, rangée de marque, réseaux et mentions. |
| `marque-en-geant.editorial` | Nom du site en très grand, navigation et bouton dessous. |
| `cartes-coordonnees.doux` | Marque, liens et coordonnées dans trois cartes à ombre. |
| `asymetrique-invitation.clair` | Logo étroit, grande invitation « Parlons de votre projet » avec bouton ; navigation dessous. |
| `cadre-contour.marque` | Marque, navigation et coordonnées dans un cadre fin. |
| `accordeons-mobile.nuit` | Logo et deux rubriques repliables (idéal sur téléphone), navigation et copyright. |
| `portfolio-titre-et-reseaux.editorial` | Titre du site à gauche, grandes icônes de réseaux à droite ; navigation et copyright. |
| `invitation-geante-couleur.doux` | Grand titre « Restons en contact » et réseaux sur fond de couleur ; navigation dessous. |
| `pile-a-gauche.clair` | Une seule colonne alignée à gauche : logo, présentation, navigation, copyright. |
| `annonce-et-liens.marque` | Pastille « Nouveau » et message avec bouton, puis marque et navigation. |
| `double-bande-cartes.nuit` | Rangée de marque et de réseaux, rangée alternée de deux cartes. |
| `centre-logo-menu-copyright.doux` | Pile centrée : logo, navigation horizontale, copyright. |
| `centre-reseaux.clair` | Pile centrée : logo, navigation, réseaux, copyright. |
| `centre-titre-double-filet.marque` | Titre du site, rubriques en capitales et copyright sous double filet. |
| `centre-abonnement.nuit` | Pile centrée : logo, abonnement, navigation, copyright. |
| `centre-question.editorial` | Titre « Une question ? », bouton, navigation, copyright, centrés. |
| `centre-legal.doux` | Navigation, liens légaux, informations légales de l'entreprise et copyright centrés. |
| `centre-logo-au-milieu.clair` | Navigation à gauche, logo au centre, réseaux à droite ; copyright dessous. |
| `centre-presentation.marque` | Logo, présentation, navigation, réseaux et copyright, centrés. |
| `centre-deux-lignes.nuit` | Navigation centrée, filet, copyright centré. |
| `centre-contact.editorial` | Logo, coordonnées en ligne, navigation et copyright, centrés. |

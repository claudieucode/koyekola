# Campagne visuelle finale des 100 pieds de page

Date : 8 novembre 2026. Dépôt : branche `footer-reconstruction`. Auteur : agent de campagne visuelle (regard d'ensemble sur les 100 modèles, mesure en vrai Chrome, corrections).

## 1. Méthode (ce qui a vraiment été fait)

1. **Mesure en vrai Chrome** : `scripts/audit-pieds-cdp.js` sur les 100 modèles, 5 largeurs (390, 820, 1280, 1440, 1920), avec et sans données d'entreprise = **1 000 mesures**. Règles : débordement horizontal, chevauchement, élément hors écran, texte coupé, erreur JavaScript, bande pleine largeur, cible tactile < 44 px (mobile), contraste < AA.
2. **Faux positif de la flèche de sous-menu (28 px)** : la règle `footer .kw-sub-toggle { 44px }` de `public/css/landing.css` ne s'appliquait pas, car l'aperçu de la bibliothèque rendait le pied dans un `<div>`. Sur un site publié, la vue `views/marketing-public/_sections.ejs` pose la balise `<footer>` quand la partie est un pied du Theme Builder. Correction : `previewDoc` (`src/marketing/web/themeRender.js`) marque maintenant le pied comme « pied du site » (même marquage que le site publié), donc `<footer>` + ligne légale du site, comme en vrai. Vérifié en Chrome (script `toggle.js` du dossier de captures) : à 390 px la flèche mesure 44 × 44 px dans le `<footer>` ; à 1280 px elle reste à 28 px (voulu).
3. **Regard** : captures COMPLÈTES du `<footer>` (fenêtre haute de 3 000 px) pour les 100 modèles à 1280 px et à 390 px, avec et sans données, assemblées en planches-contact (4 à 5 modèles par planche) et ouvertes une par une (outil de lecture d'images). Les 58 planches « 1280 px avec données » ont été toutes ouvertes avant corrections ; les 25 planches « 390 px » ont été générées, 14 ouvertes (voir limites). Après corrections : nouvelles captures des modèles modifiés, rouvertes.
4. **Corrections** : seulement dans les fichiers de famille et, pour les défauts communs, dans `footer/elements.js`, `footer/moteur.js`, `themeRender.js`.

## 2. Chiffres des mesures

| | Avant (état de départ) | Après |
|---|---|---|
| Mesures | 1 000 | 1 000 |
| Mesures avec défaut | 0 (avec l'enveloppe `<footer>` corrigée ; la mesure d'origine, avec la flèche à 28 px, n'a PAS été relancée telle quelle : voir limites) | **0** |
| Détail après | — | débordement 0, chevauchement 0, hors écran 0, texte coupé 0, erreur JS 0, bande non pleine 0, cible tactile 0, contraste 0 |

Fichiers : `/private/tmp/claude-501/camp/m0/*.json` (premier passage) et `/private/tmp/claude-501/camp/m3/*.json` (passage final, 3 fichiers : 390 + 310 + 300 mesures).
Le dernier réglage de la zone de recherche (largeur maximale 420 px, ligne à trois zones du modèle éditorial 04) a été fait APRÈS ce passage de 1 000 mesures ; les 9 modèles qui contiennent une recherche ont été remesurés ensuite (90 mesures, 0 défaut) et le modèle éditorial 04 revu en capture.

Similarité de structure 100 × 100 (`footer/empreinte.js`, via `node scripts/documenter-pieds.js`) : **maximum 0,723** (seuil 0,85), moyenne 0,275, 2 paires au-dessus de 0,70, aucune empreinte identique.

## 3. Notes A / B / C

| Note | Avant | Après |
|---|---|---|
| A (excellent) | 56 | 67 |
| B (bon) | 36 | 33 |
| C (à corriger) | 8 | 0 |

A = alignements rigoureux, hiérarchie claire, pas de grand vide, identité nette. B = bon mais un défaut mineur (vide dû à un widget non configuré, colonnes inégales, ressemblance avec un autre modèle). C = défaut visible. Une note « après » n'est A que si le modèle a été REVU après correction (ou n'avait aucun défaut). Les modèles non listés ci-dessous sont A avant et après.

## 4. Les 100 modèles

| Identifiant | Nom | Avant | Après | Défaut / correction |
|---|---|---|---|---|
| `ft-minimalistes-01-menu-et-mentions` | Menu centré et mentions | B | B | Info d'entreprise un peu sèche ; sans données : très court mais propre |
| `ft-minimalistes-02-signature-typographique` | Signature typographique | A | A | — |
| `ft-minimalistes-03-barre-fine-retour-en-haut` | Barre fine avec retour en haut | A | A | — |
| `ft-minimalistes-04-marque-phrase-reseaux` | Marque, phrase et réseaux | B | B | Petit et sobre |
| `ft-minimalistes-05-cartouche-centre` | Cartouche centré | A | A | — |
| `ft-minimalistes-06-index-numerote` | Index numéroté | A | A | — |
| `ft-minimalistes-07-deux-zones-asymetriques` | Deux zones asymétriques | B | B | Grand vide à droite du bouton |
| `ft-minimalistes-08-trois-volets-compacts` | Trois volets compacts | A | A | — |
| `ft-corporate-01-grande-marque-volets` | Grande marque et quatre volets | B | B | Bloc lettre d'information vide (non configurée) |
| `ft-corporate-02-bandeau-appel-cinq-colonnes` | Bandeau d'appel et cinq colonnes | A | A | — |
| `ft-corporate-03-double-navigation-services` | Double navigation et groupes de services | A | A | — |
| `ft-corporate-04-rendez-vous-en-cartes` | Rendez-vous, implantations et garanties en cartes | B | B | Cartes de hauteurs inégales |
| `ft-corporate-05-implantations-en-colonnes` | Implantations et bureaux en colonnes | A | A | — |
| `ft-corporate-06-certifications-centre` | Marque centrée et bandeau de certifications | A | A | — |
| `ft-corporate-07-affiche-noir-et-or` | Affiche de marque noir et or | A | A | — |
| `ft-corporate-08-contact-et-trois-niveaux-legaux` | Formulaire de contact et trois niveaux légaux | B | B | Formulaire non configuré : zone vide |
| `ft-ecommerce-01-mega-enseigne` | Méga-pied de grande enseigne | C | B | Colonne « Informations » : les liens légaux étaient alignés en ligne (étroit) → vraie pile verticale ; colonnes resserrées |
| `ft-ecommerce-02-maison-luxe-sobre` | Maison de luxe sobre | B | B | Ressemble un peu à l'hôtel sobre (même ivoire + capitales) |
| `ft-ecommerce-03-place-de-marche` | Pied de place de marché | B | B | Champ de recherche : bouton plus gros que le champ |
| `ft-ecommerce-04-boutique-de-niche` | Boutique de niche chaleureuse | B | A | Sans données : carte du milieu réduite à un titre → titre masqué |
| `ft-ecommerce-05-confiance-paiement-livraison` | Pied confiance : paiement et livraison | A | A | — |
| `ft-ecommerce-06-mobile-first` | Pied boutique pensé pour le mobile | B | B | — |
| `ft-ecommerce-07-club-newsletter` | Grande newsletter du club | A | A | — |
| `ft-ecommerce-08-service-client-en-deux-volets` | Service client en deux volets | B | B | Sans données : colonnes inégales |
| `ft-saas-tech-01-mega-pied-six-colonnes` | Méga-pied produit à six colonnes | A | A | — |
| `ft-saas-tech-02-pied-minimal-produit` | Pied minimal d'application | B | B | — |
| `ft-saas-tech-03-grand-appel-essai-gratuit` | Grand appel à l'essai gratuit | B | A | Barre basse : liens légaux sur 3 lignes → barre à deux zones |
| `ft-saas-tech-04-pied-developpeurs-api` | Pied développeurs et API | A | A | — |
| `ft-saas-tech-05-statut-et-securite` | Statut du service et sécurité | A | A | — |
| `ft-saas-tech-06-startup-decontracte-centre` | Startup décontractée centrée | A | A | — |
| `ft-saas-tech-07-lettre-et-nouveautes` | Lettre d'information et nouveautés | B | B | — |
| `ft-saas-tech-08-integrations-et-expert` | Intégrations et parler à un expert | A | A | — |
| `ft-editoriaux-01-pied-de-journal` | Pied de journal à double filet | A | A | — |
| `ft-editoriaux-02-grandes-rubriques` | Magazine à grandes rubriques | A | A | — |
| `ft-editoriaux-03-carnet-chaleureux` | Carnet de blog chaleureux | A | A | — |
| `ft-editoriaux-04-media-numerique-nuit` | Média numérique en mode nuit | B | A | Recherche : bouton sous le champ → sur une ligne |
| `ft-editoriaux-05-revue-et-colophon` | Revue culturelle avec colophon | A | A | — |
| `ft-editoriaux-06-journal-de-quartier` | Journal de quartier en trois cartes | B | A | Sans données : carte « La rédaction » vide → masquée |
| `ft-editoriaux-07-lettre-independante` | Lettre indépendante, abonnement d'abord | A | A | — |
| `ft-creatifs-portfolios-01-pied-affiche-titre-geant` | Pied-affiche au titre géant | A | A | — |
| `ft-creatifs-portfolios-02-cadre-exposition` | Cadre d'exposition | C | B | Barre basse : trois zones étroites faisaient passer les liens légaux sur 3 lignes → deux zones |
| `ft-creatifs-portfolios-03-invitation-a-ecrire` | Invitation à écrire | A | A | — |
| `ft-creatifs-portfolios-04-index-projets-reseaux` | Index de projets et de réseaux | A | A | — |
| `ft-creatifs-portfolios-05-signature-artiste` | Signature d'artiste | B | B | — |
| `ft-creatifs-portfolios-06-bande-annonce-neon` | Bande d'annonce néon | A | A | — |
| `ft-education-01-universite-cinq-colonnes` | Université à cinq colonnes et candidatures | C | A | Barre basse : liens légaux sur 3 lignes → deux zones |
| `ft-education-02-plateforme-de-cours-vivante` | Plateforme de cours vivante | A | A | — |
| `ft-education-03-ecole-chaleureuse-parents` | École chaleureuse pour les parents | A | A | — |
| `ft-education-04-centre-de-formation-inscription` | Centre de formation avec inscription et financement | B | B | — |
| `ft-education-05-cours-ouvert-questions` | Cours ouvert minimal avec questions | A | A | — |
| `ft-education-06-campus-plan-et-horaires` | Campus avec plan, horaires et accès | C | B | Barre basse corrigée ; le plan (carte) n'apparaît pas en capture : il charge une carte externe, non vérifiable ici |
| `ft-communautes-01-reseau-social-dense` | Réseau social dense en cinq volets | A | A | — |
| `ft-communautes-02-forum-rubriques-et-charte` | Forum à rubriques et charte | C | B | Barre basse : logo, copyright et liens sur deux lignes décalées ; recherche : bouton sous le champ → corrigés |
| `ft-communautes-03-club-accueil-et-gazette` | Club chaleureux et sa gazette | B | B | — |
| `ft-communautes-04-developpeurs-contribuer` | Communauté de développeurs : contribuer | B | A | Barre basse recomposée en deux lignes alignées |
| `ft-communautes-05-evenement-agenda-billets` | Événement : agenda et billetterie | A | A | — |
| `ft-communautes-06-groupes-grandes-pastilles` | Plateforme de groupes à grandes pastilles | A | A | — |
| `ft-services-01-artisan-grand-telephone` | Artisan et grand numéro de téléphone | B | A | Sans données : colonne « Horaires » réduite à un titre → masquée |
| `ft-services-02-consultant-rendez-vous-sobre` | Consultant sobre et prise de rendez-vous | A | A | — |
| `ft-services-03-freelance-parlons-projet` | Freelance et invitation à parler du projet | A | A | — |
| `ft-services-04-agence-devis-formulaire` | Agence à devis et formulaire de contact | B | B | Formulaire non configuré : grand vide à droite |
| `ft-services-05-domicile-zone-horaires` | Service à domicile, zone et horaires | A | A | — |
| `ft-services-06-cabinet-de-soins-accueillant` | Cabinet de soins accueillant | C | B | Quatrième colonne « Rendez-vous » tombait seule sous les autres → fusionnée dans « Infos pratiques » |
| `ft-services-07-depannage-urgent-24h` | Dépannage urgent 24 h sur 24 | A | A | — |
| `ft-restauration-hotellerie-01-bistrot-ardoise-du-jour` | Bistrot et ardoise du jour | A | A | — |
| `ft-restauration-hotellerie-02-hotel-sobre-chambres-bons-cadeaux` | Hôtel sobre, chambres et bons cadeaux | B | B | Liens en capitales sur deux lignes (colonne étroite) |
| `ft-restauration-hotellerie-03-cafe-boulangerie-cartes-chaudes` | Café-boulangerie en cartes chaudes | A | A | — |
| `ft-restauration-hotellerie-04-table-gastronomique-centree` | Table gastronomique centrée | B | B | — |
| `ft-restauration-hotellerie-05-maison-hotes-carte-horaires` | Maison d'hôtes, avis et volets pratiques | A | A | — |
| `ft-restauration-hotellerie-06-bar-nocturne-ouvert-ce-soir` | Bar nocturne, ouvert ce soir | A | A | — |
| `ft-immobilier-01-agence-de-quartier-estimation` | Agence de quartier et estimation offerte | A | A | — |
| `ft-immobilier-02-reseau-national-mentions-renforcees` | Réseau national et mentions renforcées | B | B | Deux boutons orange côte à côte |
| `ft-immobilier-03-promoteur-programmes-numerotes` | Promoteur et programmes numérotés | A | A | — |
| `ft-immobilier-04-portail-annonces-recherche` | Portail d'annonces et recherche | B | B | Texte indicatif du champ peu lisible sur fond orange → corrigé (couleur héritée) |
| `ft-immobilier-05-gestion-locative-espaces` | Gestionnaire locatif et deux espaces | A | A | — |
| `ft-finance-juridique-01-banque-en-ligne-securite` | Banque en ligne et conseils de sécurité | B | B | Bloc légal long et liens empilés |
| `ft-finance-juridique-02-assurance-sinistre-et-produits` | Mutuelle d'assurance, sinistre et produits | B | A | Trop proche des pieds « brique + Fraunces » (artisan, mairie) → palette bleue + Lora |
| `ft-finance-juridique-03-cabinet-avocats-discret` | Cabinet d'avocats élégant et discret | A | A | — |
| `ft-finance-juridique-04-cabinet-comptable-echeances` | Cabinet comptable, échéances et rendez-vous | B | B | Ressemblait à l'agence immobilière (crème + brique) → palette prune |
| `ft-finance-juridique-05-courtier-avertissement-reglementaire` | Courtier et encadré d'avertissement | B | B | Dense mais lisible |
| `ft-finance-juridique-06-fintech-moderne-statut` | Fintech moderne et statut du service | C | B | Barre basse : liens légaux sur 3 lignes → deux zones |
| `ft-ong-associations-01-ong-humanitaire-appel-au-don` | Grande ONG humanitaire : appel au don | A | A | — |
| `ft-ong-associations-02-association-quartier-chaleureuse` | Association de quartier chaleureuse | B | A | Ressemblait à l'école chaleureuse (crème, 3 cartes) → version nuit/orange |
| `ft-ong-associations-03-fondation-sobre-institutionnelle` | Fondation sobre et institutionnelle | B | B | — |
| `ft-ong-associations-04-collectif-militant-ton-fort` | Collectif militant au ton fort | A | A | — |
| `ft-ong-associations-05-tiers-lieu-adhesion-agenda` | Tiers-lieu : adhésion et agenda | B | A | Barre basse : liens légaux sur 3 lignes → deux zones |
| `ft-landing-pages-01-bouton-achat-final` | Bouton d'achat final | A | A | — |
| `ft-landing-pages-02-garantie-satisfait-rembourse` | Garantie satisfait ou remboursé | A | A | — |
| `ft-landing-pages-03-inscription-courte-honnete` | Inscription courte et honnête | A | A | — |
| `ft-landing-pages-04-webinaire-inscription` | Webinaire en trois temps | A | A | — |
| `ft-landing-pages-05-lancement-ligne-confiance` | Lancement et ligne de confiance | A | A | — |
| `ft-landing-pages-06-capture-sobre-colonne` | Capture sobre en colonne étroite | A | A | — |
| `ft-institutionnels-01-portail-national-six-colonnes` | Portail national à six colonnes | A | A | — |
| `ft-institutionnels-02-mairie-horaires-et-demarches` | Mairie chaleureuse, horaires et démarches | B | A | Même hero brique que l'artisan → palette verte |
| `ft-institutionnels-03-agence-plan-du-site-trois-niveaux` | Agence publique, plan du site à trois niveaux | A | A | — |
| `ft-institutionnels-04-etablissement-de-sante-visiteurs` | Établissement public de santé, venir et visiter | B | B | — |
| `ft-institutionnels-05-musee-index-numerote` | Institution culturelle et index numéroté | A | A | — |
| `ft-institutionnels-06-organisme-europeen-multilingue` | Organisme européen multilingue | A | A | — |
| `ft-institutionnels-07-prefecture-bandeau-officiel` | Préfecture sobre à bandeau officiel | C | B | Barre basse : cinq liens légaux empilés en colonne → ligne |
| `ft-institutionnels-08-intercommunalite-services-en-cartes` | Intercommunalité et services en cartes | B | B | — |

## 5. Corrections principales

1. Aperçu et mesure dans une vraie balise `<footer>` + ligne légale du site (comme sur un site publié).
2. Ligne légale du site (« Nom du site · Cookies » sous chaque pied) : liens bleus par défaut → couleur héritée, soulignés, plus compacts, filet fin.
3. Liste de liens légaux « en pile » : la 2e moitié restait en ligne (pages légales) → vraie pile verticale (`elements.js`).
4. Sans données d'entreprise : une colonne ou une carte réduite à un titre est masquée (règle CSS `p.kw-heading:only-child`) au lieu de montrer un titre vide (modèles e-commerce 04, éditorial 06, services 01 et autres).
5. Barres basses « trois zones » où les liens légaux passaient sur 3 lignes → deux zones (créatifs 02, éducation 01 et 06, SaaS 03, finance 06, ONG 04 et 05, communautés 02 et 04, institutionnels 07).
6. Champ de recherche : texte indicatif lisible sur fond coloré, hauteur 44 px, largeur maximale 420 px.
7. Services 06 : la 4e colonne « Rendez-vous » tombait seule sous les autres → fusionnée.
8. Ressemblances à l'œil : trois pieds « brique + Fraunces » (artisan, assurance, mairie), école/association, comptable/agence → assurance en bleu + Lora, mairie en vert, association en nuit + orange, comptable en prune.
9. Éditorial 04 : barre de tête recomposée (3 zones) pour que la recherche tienne sur une ligne.
10. Script d'audit : nouvel essai automatique du lancement de Chrome (machine lente : 14 s de démarrage).

## 6. Ce qui reste imparfait / ce qui n'a pas pu être vu

- **Accordéons mobile (plié/déplié)** : l'aperçu de la bibliothèque ne charge aucun script ; les volets apparaissent donc TOUS dépliés en capture mobile. Leur comportement réel (pli, ouverture, flèche) relève de l'autre agent (comportements) ; une capture avec le script de la page a été tentée mais le lancement de Chrome a échoué : non vue.
- **Mobile 390 px** : 25 planches générées, 14 ouvertes (minimalistes 1-8, corporate 1-4, e-commerce 1-4, éditoriaux 5-7, créatifs 1, communautés 6, services 1-3, + 6 modèles de recherche/forum/éducation) ; au total environ 40 modèles vus à 390 px, mais PAS tous les modèles à accordéon repliés.
- **Plan interactif (éducation 06)** : la carte externe ne s'affiche pas en capture (seul le bouton « Ouvrir dans Maps ») : un grand vide à gauche en capture, probablement comblé par la carte sur un vrai site : non vérifié.
- **Recherche étroite** : dans une colonne très étroite (e-commerce 03, forum) le bouton passe sous le champ ; acceptable mais pas parfait.
- **Ressemblance** : finance 04 (comptable) garde la même composition que immobilier 01 (agence) ; seule la palette a changé.
- **E-commerce 01** : la colonne « Informations » passe encore sous « Catégories » à 1280 px (grille de 4 volets trop large pour 9/12) : B.
- **Petites icônes de réseaux** (variante « plain ») : glyphes de 12 px dans plusieurs modèles ; lisibles mais petites.
- **Ligne légale du site** : sa couleur de fond n'est pas celle de la dernière bande du pied ; c'est une bande blanche neutre sous le pied. Un réglage propre demanderait de porter le fond de la dernière bande sur l'enveloppe `<footer>` (vue `_sections.ejs`) : non fait.
- Test `theme-builder-pieds-bibliotheque` : « anciennes clés : 404 » échoue dans l'arbre partagé (clés d'anciens modèles désormais résolues par la couche d'alias de l'agent « interface bibliothèque ») ; sans lien avec ces corrections.

## 7. Planches-contact (hors dépôt)

Dossier `/private/tmp/claude-501/camp/` :
- `planches/` : 58 planches 1280 px avec données, AVANT corrections.
- `planches2/` : 25 planches 390 px avec données (avant la dernière série de corrections) ; planches 1280 px sans données des 16 modèles les plus changés.
- `planches3/`, `planches4/`, `planches5/` : modèles modifiés, après corrections (1280 px avec et sans données, 390 px, recherche).
- `shots`, `shots2`..`shots6` : captures individuelles complètes (`camp-<id>.<avec|sans>.<largeur>.png`).

## 8. Mise à jour après la passe de correctifs finaux (8 novembre 2026)

- **Accordéons mobile dans l'aperçu** : corrigé (l'aperçu complet charge le script de la page ; vérifié en Chrome à 390 px sur 5 modèles à accordéon : repliés au départ, s'ouvrent au clic). Le §6 « l'aperçu ne charge aucun script » ne vaut plus.
- **Ligne légale** : elle reprend maintenant le fond et la couleur de la dernière bande du pied (`_sections.ejs`) : plus de bande blanche sous un pied coloré, sur le site publié comme dans l'aperçu.
- **Recherche étroite** : le champ se réduit (`flex: 1 1 120px`) et le bouton reste à côté dans une colonne étroite.
- **Icônes de réseaux « plain »** : cible de 44 px, pictogramme de 24 px (au lieu de 12 px).
- **Test « anciennes clés »** : passe seul (les clés qu'il cite ne sont pas des alias) ; voir `FOOTER_RECONSTRUCTION_RAPPORT_FINAL.md`.
- Mesure complète refaite après ces changements : voir le rapport final (1 000 mesures).


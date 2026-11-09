# Catalogue de 100 concepts de pieds de page Kolakisa (Footer v2, phase 1)

Date : 9 novembre 2026. Branche `footer-v2-etude`. **Document de conception : aucun code du produit n'a été écrit.** Les images, polices, marques, chiffres et numéros cités sont fictifs ou à saisir par le client. Les données lisibles par machine sont dans `concepts/concepts.json` ; la mesure de diversité est dans `CONCEPTS_MATRICE_DIVERSITE.md`.

## Comment lire ce document

- Chaque concept a une **fiche** (titres et puces) avec tous les champs demandés : direction artistique, composition, structure, hiérarchie, logo, menus, coordonnées, réseaux, newsletter, CTA, couleurs, typographies, espacements, fonds, formes, décor, interactions, responsive (390 / 820 / 1280), widgets, geste fort, risques.
- Les références sont citées par numéro : **R-xx** = pied de page étudié dans `MARKETPLACES_REFERENCES.md`, **P-xx** = principe de `MARKETPLACES_ANALYSE.md` (P1 logo monumental, P2 phrase géante, P3 carte arrondie décollée, P4 grille nette, P5 contraste d'échelle, P6 aplat franc, P7 fond sombre sobre, P8 serif éditorial, P9 réseaux typographiques, P10 newsletter légère, P11 informations vivantes, P12 micro-détails, P13 navigation en pilule, P14 retour en haut, P15 sélecteurs pratiques, P16 pied qui se révèle, P17 un seul geste par pied).
- Un widget précédé d'une étoile (`*`) **n'existe pas encore** dans Kolakisa : il est listé en fin de document. Les autres sont des types de nœuds réels du Page Builder (vérifiés dans `src/marketing/pages/nodes.js`).
- Une inspiration est une **transformation**, jamais une copie : les noms de marque sont fictifs.

## Méthode en six lignes

1. Lecture des études précédentes (références de places de marché, principes, widgets disponibles, architecture actuelle, catalogue actuel).
2. Choix de 32 types de composition (liste fermée ci-dessous) et de 14 familles de secteurs, avec au moins un concept pour chacun des 40 secteurs demandés.
3. Rédaction de 100 fiches, chacune avec ses propres jetons : palette de 5 à 6 couleurs, paire de polices Google Fonts, formes, fond, geste fort.
4. Mesure de la diversité par script (distance pondérée composition 30 %, structure 25 %, direction visuelle 25 %, geste et interactions 10 %, responsive 10 %), puis retouches jusqu'à zéro paire sous 0,45.
5. Comparaison aux 100 modèles actuels : 8 concepts trop proches ont été reconçus.
6. Vérification par script des contrastes AA (100 palettes conformes) et de la faisabilité (aucun WebGL, canvas, vidéo ni faux compte à rebours).

## Taxonomie des compositions (liste fermée, 32 types)

| Type | Définition | Nb de concepts |
|---|---|---|
| `2col` | Deux colonnes équilibrées : une pour l'identité ou l'information vivante, l'autre pour la navigation. | 2 |
| `3col` | Trois colonnes de contenu de poids comparables, sous une éventuelle ligne de marque. | 2 |
| `4col` | Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre. | 4 |
| `5-6col-mega` | Méga-pied de cinq à sept colonnes de liens, pour les sites très riches. | 2 |
| `asymetrique` | Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). | 5 |
| `marque-monumentale` | Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté. | 4 |
| `phrase-geante` | Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens. | 4 |
| `carte-decollee` | Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond. | 3 |
| `bandes-superposees` | Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle. | 3 |
| `editorial-colonne` | Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes. | 3 |
| `centre-pile` | Pile centrée d'éléments (marque, liens, mentions), symétrique. | 4 |
| `navigation-verticale` | La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur. | 3 |
| `navigation-horizontale-compacte` | Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs. | 3 |
| `modulaire-bento` | Mosaïque de tuiles de tailles différentes, chacune avec une fonction. | 4 |
| `annuaire` | Longues listes classées (pays, villes, rubriques, documents) en colonnes fines. | 4 |
| `tableau-de-bord` | Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. | 5 |
| `ticker-statique` | Un ruban ou bandeau défilant (arrêté en mouvement réduit) tient le rôle principal. | 2 |
| `image-de-fond` | Une image, une illustration ou un motif plein cadre est le fond du pied. | 4 |
| `immersif` | Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible. | 3 |
| `ligne-unique` | Une seule ligne de 56 à 80 px de haut. | 2 |
| `cta-plein` | Une grande zone d'appel à l'action occupe la plus grande part du pied. | 4 |
| `formulaire-integre` | Un formulaire (e-mail, recherche, candidature) est le geste principal du pied. | 3 |
| `carte-localisation` | La carte (réelle ou dessinée) du lieu est l'élément principal. | 2 |
| `split-vertical` | Le pied est coupé en deux moitiés nettes, de fonds différents. | 4 |
| `index-numerote` | Les liens forment un index numéroté, comme une table des matières. | 2 |
| `cartes-empilees` | Plusieurs cartes qui se superposent ou se décalent en escalier. | 2 |
| `colophon` | Le pied est rédigé ou dessiné comme un colophon ou un cartouche (page technique d'un ouvrage ou d'un plan). | 2 |
| `onglets` | Des onglets permettent d'afficher une seule liste de liens à la fois. | 2 |
| `accordeon` | Les rubriques sont des accordéons, y compris sur grand écran. | 2 |
| `frise` | Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. | 5 |
| `bandeau-lateral` | Une bande verticale latérale porte la marque ou un signe, le contenu est à côté. | 3 |
| `cadre-passe-partout` | Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte. | 3 |

Le type le plus fréquent compte 5 concepts sur 100 ; la limite fixée était 15.

## Répartition par famille de secteurs

| Famille | Nb | Concepts |
|---|---|---|
| Corporate et institutions | 8 | Bastion Ardoise, Registre Public, Colophon du Cabinet, Usine et Plan, Chancellerie, Agora en Tuiles, Pacte en Deux, Cap sur le Téléphone |
| Finance et assurance | 6 | Banque Nocturne, Assurance Claire, Gestion Privée, Fintech Tableau, Mutuelle en Cartes, Index du Comptable |
| SaaS, tech et startup | 9 | Palette de Commandes, Onglets Documentation, Phrase de Lancement, Aurore IA, Statut Nuage, Appli Diptyque, Terminal Vigie, Atelier Sticker, Laboratoire Données |
| E-commerce, mode et luxe | 9 | Maison Ivoire, Marché du Terroir, Drop Sneakers, Concept Store Pastel, Frise de Confiance, Botanique Bio, Horlogerie en Bandeau, Grand Club Lettre, Brocante Annuaire |
| Médias et éditorial | 8 | Journal Triple Filet, Mode en Capitales, Carnet de Marges, Revue Sommaire, Barres de Son, Presse Régionale, Reportage Légendé, Rubriques Géantes |
| Agences, portfolios et art | 11 | Bonjour Écrit, Nom Rogné Rouge, Nom et Heure, Planche Contact, Cartel de Musée, Néon en Mouvement, Gouache et Feuilles, Grille Brutale, Index des Projets, Grain de Pellicule, Spécimen Typographique |
| Restauration, hôtellerie et tourisme | 8 | Bistro Ardoise, Palace Annuaire, Anse Turquoise, Heures du Four, Carte du Gîte, Étiquette de Cave, Semaine en Frise, Commande en Grand |
| Immobilier et architecture | 7 | Votre Agent Local, Programmes Neufs, Cartouche de Plan, Estimation Photo, Chantier Rayures, Coliving Arche, Jardin Botanique |
| Éducation et université | 6 | Campus Blason, École de Code, Journée d'École, Parcours Formation, Cotes de Bibliothèque, Cours Ouverts |
| Santé et bien-être | 6 | Repères de Clinique, Galets de Spa, Rendez-vous Bleu, Croix de Garde, Cercle de Souffle, Deux Rives |
| Culture et événementiel | 6 | Affiche de Festival, Rideau de Scène, Numéros d'Inventaire, Sillon et Label, Plan du Salon, Pellicule et Salles |
| Associatif et ONG | 6 | Don en un Geste, Carte du Quartier, Contributeurs, Rapports Ouverts, Climat en Chiffres, Bénévoles en Cartes |
| Automobile, sport et mobilité | 5 | Concession Contraste, Garage Damier, Maillot en Biais, Planning de Salle, Courbes de Niveau |
| Minimalisme et expérimentation | 5 | Juste une Ligne, Point Final, Inversion Noir Blanc, Glitch au Survol, Pied en Phrases |

## Couverture des secteurs demandés

| Secteur demandé | Concepts |
|---|---|
| corporate premium | `c-001-bastion-ardoise`, `c-003-colophon-du-cabinet` |
| minimaliste | `c-011-gestion-privee`, `c-043-nom-et-heure` |
| ultra-minimaliste | `c-096-juste-une-ligne`, `c-097-point-final` |
| luxe | `c-024-maison-ivoire`, `c-030-horlogerie-bandeau`, `c-053-palace-annuaire` |
| noir et blanc | `c-098-inversion-noir-blanc`, `c-040-rubriques-geantes`, `c-034-mode-en-capitales`, `c-044-planche-contact` |
| éditorial | `c-035-carnet-de-marges`, `c-036-revue-sommaire`, `c-100-pied-en-phrases` |
| magazine | `c-033-journal-triple-filet`, `c-034-mode-en-capitales`, `c-038-presse-regionale` |
| agence créative | `c-041-bonjour-ecrit`, `c-042-nom-rogne-rouge` |
| portfolio | `c-043-nom-et-heure`, `c-049-index-des-projets`, `c-044-planche-contact` |
| artistique | `c-045-cartel-de-musee`, `c-047-gouache-et-feuilles` |
| technologique | `c-018-aurore-ia`, `c-021-terminal-vigie` |
| SaaS | `c-015-palette-de-commandes`, `c-019-statut-nuage` |
| startup | `c-017-phrase-de-lancement` |
| e-commerce | `c-025-marche-du-terroir`, `c-026-drop-sneakers`, `c-027-concept-store-pastel` |
| boutique de luxe | `c-024-maison-ivoire` |
| magazine de mode | `c-034-mode-en-capitales` |
| photographique | `c-044-planche-contact`, `c-039-reportage-legende` |
| architectural | `c-062-cartouche-de-plan` |
| immobilier | `c-060-votre-agent-local`, `c-061-programmes-neufs`, `c-063-estimation-photo` |
| éducatif | `c-069-journee-d-ecole`, `c-072-cours-ouverts` |
| université | `c-067-campus-blason` |
| institutionnel | `c-002-registre-public`, `c-006-agora-en-tuiles` |
| financier | `c-012-fintech-tableau`, `c-014-index-du-comptable` |
| bancaire | `c-009-banque-nocturne` |
| automobile | `c-091-concession-contraste` |
| sportif | `c-093-maillot-en-biais`, `c-094-planning-de-salle` |
| gastronomique | `c-052-bistro-ardoise`, `c-055-heures-du-four`, `c-057-etiquette-de-cave` |
| hôtelier | `c-053-palace-annuaire`, `c-054-anse-turquoise` |
| touristique | `c-056-carte-du-gite`, `c-058-semaine-en-frise` |
| médical | `c-073-reperes-de-clinique`, `c-075-rendez-vous-bleu` |
| santé et bien-être | `c-074-galets-de-spa`, `c-077-cercle-de-souffle` |
| événementiel | `c-079-affiche-de-festival`, `c-083-plan-du-salon` |
| culturel | `c-080-rideau-de-scene`, `c-081-numeros-d-inventaire` |
| communautaire | `c-087-contributeurs`, `c-086-carte-du-quartier` |
| associatif | `c-090-benevoles-en-cartes`, `c-086-carte-du-quartier` |
| ONG | `c-085-don-en-un-geste` |
| média | `c-037-barres-de-son`, `c-040-rubriques-geantes` |
| journal numérique | `c-033-journal-triple-filet` |
| blog personnel | `c-035-carnet-de-marges` |
| créatif expérimental | `c-099-glitch-au-survol`, `c-048-grille-brutale`, `c-046-neon-en-mouvement` |

Les 40 secteurs demandés ont au moins un concept ; les secteurs courants (corporate, SaaS, e-commerce, médias, portfolios, restauration, hôtellerie, immobilier, éducation, finance, santé) en ont de 6 à 11 dans leur famille.

## Répartition par composition

```
asymetrique                       5  █████
frise                             5  █████
tableau-de-bord                   5  █████
4col                              4  ████
annuaire                          4  ████
centre-pile                       4  ████
cta-plein                         4  ████
image-de-fond                     4  ████
marque-monumentale                4  ████
modulaire-bento                   4  ████
phrase-geante                     4  ████
split-vertical                    4  ████
bandeau-lateral                   3  ███
bandes-superposees                3  ███
cadre-passe-partout               3  ███
carte-decollee                    3  ███
editorial-colonne                 3  ███
formulaire-integre                3  ███
immersif                          3  ███
navigation-horizontale-compacte   3  ███
navigation-verticale              3  ███
2col                              2  ██
3col                              2  ██
5-6col-mega                       2  ██
accordeon                         2  ██
carte-localisation                2  ██
cartes-empilees                   2  ██
colophon                          2  ██
index-numerote                    2  ██
ligne-unique                      2  ██
onglets                           2  ██
ticker-statique                   2  ██
```

## Sommaire par famille

### Corporate et institutions

- [c-001 · Bastion Ardoise](#c-001-bastion-ardoise) : corporate premium (bandeau-lateral)
- [c-002 · Registre Public](#c-002-registre-public) : institutionnel (annuaire)
- [c-003 · Colophon du Cabinet](#c-003-colophon-du-cabinet) : corporate premium (colophon)
- [c-004 · Usine et Plan](#c-004-usine-et-plan) : B2B industrie (bandes-superposees)
- [c-005 · Chancellerie](#c-005-chancellerie) : cabinet juridique (cadre-passe-partout)
- [c-006 · Agora en Tuiles](#c-006-agora-en-tuiles) : collectivité (modulaire-bento)
- [c-007 · Pacte en Deux](#c-007-pacte-en-deux) : corporate RSE (split-vertical)
- [c-008 · Cap sur le Téléphone](#c-008-cap-sur-le-telephone) : services aux entreprises (navigation-horizontale-compacte)

### Finance et assurance

- [c-009 · Banque Nocturne](#c-009-banque-nocturne) : banque (marque-monumentale)
- [c-010 · Assurance Claire](#c-010-assurance-claire) : assurance (3col)
- [c-011 · Gestion Privée](#c-011-gestion-privee) : gestion de patrimoine (centre-pile)
- [c-012 · Fintech Tableau](#c-012-fintech-tableau) : fintech (tableau-de-bord)
- [c-013 · Mutuelle en Cartes](#c-013-mutuelle-en-cartes) : mutuelle (cartes-empilees)
- [c-014 · Index du Comptable](#c-014-index-du-comptable) : expert-comptable (index-numerote)

### SaaS, tech et startup

- [c-015 · Palette de Commandes](#c-015-palette-de-commandes) : SaaS pour développeurs (formulaire-integre)
- [c-016 · Onglets Documentation](#c-016-onglets-documentation) : documentation technique (onglets)
- [c-017 · Phrase de Lancement](#c-017-phrase-de-lancement) : startup (phrase-geante)
- [c-018 · Aurore IA](#c-018-aurore-ia) : intelligence artificielle (image-de-fond)
- [c-019 · Statut Nuage](#c-019-statut-nuage) : infrastructure cloud (tableau-de-bord)
- [c-020 · Appli Diptyque](#c-020-appli-diptyque) : application mobile (split-vertical)
- [c-021 · Terminal Vigie](#c-021-terminal-vigie) : cybersécurité (ticker-statique)
- [c-022 · Atelier Sticker](#c-022-atelier-sticker) : outil no-code (3col)
- [c-023 · Laboratoire Données](#c-023-laboratoire-donnees) : analytique de données (asymetrique)

### E-commerce, mode et luxe

- [c-024 · Maison Ivoire](#c-024-maison-ivoire) : boutique de luxe (marque-monumentale)
- [c-025 · Marché du Terroir](#c-025-marche-du-terroir) : e-commerce alimentaire (carte-decollee)
- [c-026 · Drop Sneakers](#c-026-drop-sneakers) : e-commerce streetwear (ticker-statique)
- [c-027 · Concept Store Pastel](#c-027-concept-store-pastel) : concept store (4col)
- [c-028 · Frise de Confiance](#c-028-frise-de-confiance) : e-commerce électronique (frise)
- [c-029 · Botanique Bio](#c-029-botanique-bio) : cosmétique bio (image-de-fond)
- [c-030 · Horlogerie en Bandeau](#c-030-horlogerie-bandeau) : horlogerie de luxe (bandeau-lateral)
- [c-031 · Grand Club Lettre](#c-031-grand-club-lettre) : marque de lettre d'info (formulaire-integre)
- [c-032 · Brocante Annuaire](#c-032-brocante-annuaire) : seconde main (annuaire)

### Médias et éditorial

- [c-033 · Journal Triple Filet](#c-033-journal-triple-filet) : journal numérique (5-6col-mega)
- [c-034 · Mode en Capitales](#c-034-mode-en-capitales) : magazine de mode (marque-monumentale)
- [c-035 · Carnet de Marges](#c-035-carnet-de-marges) : blog personnel (editorial-colonne)
- [c-036 · Revue Sommaire](#c-036-revue-sommaire) : revue de longue lecture (navigation-verticale)
- [c-037 · Barres de Son](#c-037-barres-de-son) : radio et podcast (frise)
- [c-038 · Presse Régionale](#c-038-presse-regionale) : presse locale (4col)
- [c-039 · Reportage Légendé](#c-039-reportage-legende) : photojournalisme (image-de-fond)
- [c-040 · Rubriques Géantes](#c-040-rubriques-geantes) : média alternatif (navigation-verticale)

### Agences, portfolios et art

- [c-041 · Bonjour Écrit](#c-041-bonjour-ecrit) : agence créative (phrase-geante)
- [c-042 · Nom Rogné Rouge](#c-042-nom-rogne-rouge) : studio de branding (asymetrique)
- [c-043 · Nom et Heure](#c-043-nom-et-heure) : portfolio de développeur (ligne-unique)
- [c-044 · Planche Contact](#c-044-planche-contact) : photographe (modulaire-bento)
- [c-045 · Cartel de Musée](#c-045-cartel-de-musee) : galerie d'art (cadre-passe-partout)
- [c-046 · Néon en Mouvement](#c-046-neon-en-mouvement) : motion designer (immersif)
- [c-047 · Gouache et Feuilles](#c-047-gouache-et-feuilles) : illustratrice (image-de-fond)
- [c-048 · Grille Brutale](#c-048-grille-brutale) : collectif expérimental (navigation-horizontale-compacte)
- [c-049 · Index des Projets](#c-049-index-des-projets) : directeur artistique (navigation-verticale)
- [c-050 · Grain de Pellicule](#c-050-grain-de-pellicule) : vidéaste (immersif)
- [c-051 · Spécimen Typographique](#c-051-specimen-typographique) : fonderie typographique (modulaire-bento)

### Restauration, hôtellerie et tourisme

- [c-052 · Bistro Ardoise](#c-052-bistro-ardoise) : gastronomique (2col)
- [c-053 · Palace Annuaire](#c-053-palace-annuaire) : hôtellerie de luxe (annuaire)
- [c-054 · Anse Turquoise](#c-054-anse-turquoise) : resort balnéaire (carte-decollee)
- [c-055 · Heures du Four](#c-055-heures-du-four) : boulangerie artisanale (bandes-superposees)
- [c-056 · Carte du Gîte](#c-056-carte-du-gite) : tourisme rural (carte-localisation)
- [c-057 · Étiquette de Cave](#c-057-etiquette-de-cave) : cave à vins (editorial-colonne)
- [c-058 · Semaine en Frise](#c-058-semaine-en-frise) : office de tourisme (frise)
- [c-059 · Commande en Grand](#c-059-commande-en-grand) : restauration rapide (cta-plein)

### Immobilier et architecture

- [c-060 · Votre Agent Local](#c-060-votre-agent-local) : agence immobilière (asymetrique)
- [c-061 · Programmes Neufs](#c-061-programmes-neufs) : promoteur immobilier (4col)
- [c-062 · Cartouche de Plan](#c-062-cartouche-de-plan) : architectural (colophon)
- [c-063 · Estimation Photo](#c-063-estimation-photo) : immobilier de prestige (cta-plein)
- [c-064 · Chantier Rayures](#c-064-chantier-rayures) : BTP (split-vertical)
- [c-065 · Coliving Arche](#c-065-coliving-arche) : coliving (cadre-passe-partout)
- [c-066 · Jardin Botanique](#c-066-jardin-botanique) : paysagiste (4col)

### Éducation et université

- [c-067 · Campus Blason](#c-067-campus-blason) : université (onglets)
- [c-068 · École de Code](#c-068-ecole-de-code) : école de programmation (formulaire-integre)
- [c-069 · Journée d'École](#c-069-journee-d-ecole) : école primaire (frise)
- [c-070 · Parcours Formation](#c-070-parcours-formation) : formation professionnelle (2col)
- [c-071 · Cotes de Bibliothèque](#c-071-cotes-de-bibliotheque) : bibliothèque universitaire (index-numerote)
- [c-072 · Cours Ouverts](#c-072-cours-ouverts) : plateforme e-learning (accordeon)

### Santé et bien-être

- [c-073 · Repères de Clinique](#c-073-reperes-de-clinique) : clinique (annuaire)
- [c-074 · Galets de Spa](#c-074-galets-de-spa) : spa et bien-être (asymetrique)
- [c-075 · Rendez-vous Bleu](#c-075-rendez-vous-bleu) : cabinet médical (cta-plein)
- [c-076 · Croix de Garde](#c-076-croix-de-garde) : pharmacie (bandeau-lateral)
- [c-077 · Cercle de Souffle](#c-077-cercle-de-souffle) : yoga (centre-pile)
- [c-078 · Deux Rives](#c-078-deux-rives) : association santé mentale (cartes-empilees)

### Culture et événementiel

- [c-079 · Affiche de Festival](#c-079-affiche-de-festival) : festival de musique (phrase-geante)
- [c-080 · Rideau de Scène](#c-080-rideau-de-scene) : théâtre (frise)
- [c-081 · Numéros d'Inventaire](#c-081-numeros-d-inventaire) : musée (asymetrique)
- [c-082 · Sillon et Label](#c-082-sillon-et-label) : label de disques (centre-pile)
- [c-083 · Plan du Salon](#c-083-plan-du-salon) : salon professionnel (tableau-de-bord)
- [c-084 · Pellicule et Salles](#c-084-pellicule-et-salles) : cinéma d'art et d'essai (bandes-superposees)

### Associatif et ONG

- [c-085 · Don en un Geste](#c-085-don-en-un-geste) : ONG humanitaire (cta-plein)
- [c-086 · Carte du Quartier](#c-086-carte-du-quartier) : association de quartier (carte-localisation)
- [c-087 · Contributeurs](#c-087-contributeurs) : communauté open source (5-6col-mega)
- [c-088 · Rapports Ouverts](#c-088-rapports-ouverts) : fondation (tableau-de-bord)
- [c-089 · Climat en Chiffres](#c-089-climat-en-chiffres) : collectif pour le climat (modulaire-bento)
- [c-090 · Bénévoles en Cartes](#c-090-benevoles-en-cartes) : association de bénévoles (carte-decollee)

### Automobile, sport et mobilité

- [c-091 · Concession Contraste](#c-091-concession-contraste) : concession automobile (marque-monumentale)
- [c-092 · Garage Damier](#c-092-garage-damier) : garage moto (navigation-horizontale-compacte)
- [c-093 · Maillot en Biais](#c-093-maillot-en-biais) : club de football (split-vertical)
- [c-094 · Planning de Salle](#c-094-planning-de-salle) : salle de sport (tableau-de-bord)
- [c-095 · Courbes de Niveau](#c-095-courbes-de-niveau) : outdoor et trail (immersif)

### Minimalisme et expérimentation

- [c-096 · Juste une Ligne](#c-096-juste-une-ligne) : ultra-minimaliste (ligne-unique)
- [c-097 · Point Final](#c-097-point-final) : ultra-minimaliste éditorial (centre-pile)
- [c-098 · Inversion Noir Blanc](#c-098-inversion-noir-blanc) : noir et blanc éditorial (accordeon)
- [c-099 · Glitch au Survol](#c-099-glitch-au-survol) : créatif expérimental (phrase-geante)
- [c-100 · Pied en Phrases](#c-100-pied-en-phrases) : pied rédigé (editorial-colonne)

---

# Les 100 fiches

## Famille : Corporate et institutions

<a id="c-001-bastion-ardoise"></a>
### c-001-bastion-ardoise · Bastion Ardoise

- **Secteur cible** : corporate premium (famille : Corporate et institutions)
- **Composition** : `bandeau-lateral` — Une bande verticale latérale porte la marque ou un signe, le contenu est à côté.
- **Direction artistique** : Groupe de conseil fictif « Bastion ». Bleu ardoise très sombre, un seul jaune ambré pour les chiffres et le bouton. Les preuves sont en bande verticale à gauche plutôt qu'en frise horizontale : un pied d'entreprise qui commence par ses chiffres (R26, R40, P4, P5).
- **Références** : R26, R40, P4, P5
- **Geste fort** : *chiffres-cles* — Une colonne verticale ardoise foncée, à gauche, empile quatre chiffres-clés en grand corps séparés par des filets ; ils sont saisis par le client, jamais inventés.
- **Structure** : `R1[bande gauche : logo + 4 chiffres empilés ; zone droite : 3 colonnes de liens] > R2[contact + newsletter ; réseaux] > R3[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 chiffres-clés empilés > 2 colonnes de liens > 3 contact et légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-bleu) : fond `#12202E` · texte `#F2F5F8` · texte discret `#AEBBC8` · accent `#E3B04B` · surface `#1B3144`
  - Contrastes calculés : texte/fond 15.1:1, discret/fond 8.4:1, texte/surface 12.2:1, accent 8.3:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Sora ; liens et texte courant : Inter.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #12202E, surface #1B3144.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Filets verticaux 1 px, petits carrés ambrés devant chaque chiffre, aucune illustration.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Une bande verticale latérale porte la marque ou un signe, le contenu est à côté. Disposition : R1[bande gauche : logo + 4 chiffres empilés ; zone droite : 3 colonnes de liens] > R2[contact + newsletter ; réseaux] > R3[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). La bande passe en haut, chiffres en grille 2x2 ; colonnes de liens en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `counter`, `menu`, `bizcontact`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Chiffres vides si le client ne les renseigne pas : prévoir une variante sans frise.

<a id="c-002-registre-public"></a>
### c-002-registre-public · Registre Public

- **Secteur cible** : institutionnel (famille : Corporate et institutions)
- **Composition** : `annuaire` — Longues listes classées (pays, villes, rubriques, documents) en colonnes fines.
- **Direction artistique** : Pied d'une collectivité fictive. Fond blanc bleuté, texte encre, un seul bleu institutionnel pour les liens et le focus. Le plan du site complet est visible (pas caché), précédé d'une ligne « Accessibilité, langue, taille du texte ». Clarté avant décoration (P4), sélecteurs pratiques (P15).
- **Références** : R40, R47, P4, P15
- **Geste fort** : *accordeons-ouverts* — Un annuaire de 5 groupes de liens (démarches, services, élus, publications, accessibilité) lisibles en un coup d'oeil, avec un bandeau d'accessibilité et de langue toujours visible en tête de pied.
- **Structure** : `R1[logo large + sélecteur langue + lien accessibilité] > R2[annuaire 5 groupes x 6 liens] > R3[contact+horaires] > R4[légal]`
- **Colonnes** : 5 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 groupes de démarches > 2 accessibilité et langue > 3 mentions
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`annuaire-dense`) : Annuaire de listes fines (13 à 14 px) en plusieurs colonnes.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : clair-froid) : fond `#F7F9FB` · texte `#14212D` · texte discret `#46586B` · accent `#0B5CAD` · surface `#E4EAF1`
  - Contrastes calculés : texte/fond 15.5:1, discret/fond 6.9:1, texte/surface 13.5:1, accent 6.3:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Atkinson Hyperlegible ; liens et texte courant : Public Sans.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F7F9FB, surface #E4EAF1.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filets gris 1 px entre groupes, petites icônes de ligne devant les titres.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Longues listes classées (pays, villes, rubriques, documents) en colonnes fines. Disposition : R1[logo large + sélecteur langue + lien accessibilité] > R2[annuaire 5 groupes x 6 liens] > R3[contact+horaires] > R4[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Annuaire en accordéon ouvert au premier groupe, accessibilité en haut. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `sitemap`, `menu`, `bizcontact`, `bizhours`, `bizlegal`, `copyright`, `backtotop` ; nouveaux : **`*selecteur-langue`**
- **Risques techniques** : Liste très longue : tenir 44 px de hauteur cliquable sans allonger le pied à l'excès.

<a id="c-003-colophon-du-cabinet"></a>
### c-003-colophon-du-cabinet · Colophon du Cabinet

- **Secteur cible** : corporate premium (famille : Corporate et institutions)
- **Composition** : `colophon` — Le pied est rédigé ou dessiné comme un colophon ou un cartouche (page technique d'un ouvrage ou d'un plan).
- **Direction artistique** : Cabinet de conseil fictif « Maréchal & Associés ». Papier blanc cassé, encre chaude, un rouge brique discret pour les renvois. Texte justifié étroit, notes de marge en petit corps, un esprit livre imprimé qui rassure par sa retenue (P8). Aucune icône.
- **Références** : R21, R44, P8, P12
- **Geste fort** : *colophon-imprime* — Un pied rédigé comme la dernière page d'un livre : « Cet ouvrage a été composé en... », adresse, associés, mentions, comme un colophon d'éditeur, avec des notes en marge.
- **Structure** : `R1[titre colophon en colonne centrale 5/12 + notes marge 3/12] > R2[liste associés ; adresse ; mentions]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 phrase colophon > 2 adresse > 3 notes de marge
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : blanc-casse) : fond `#FBF8F2` · texte `#1E1B16` · texte discret `#5E574B` · accent `#8A3B2A` · surface `#EDE6D8`
  - Contrastes calculés : texte/fond 16.2:1, discret/fond 6.7:1, texte/surface 13.8:1, accent 7.2:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Newsreader ; liens et texte courant : Work Sans.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FBF8F2, surface #EDE6D8.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filet double sous le titre, appels de note en exposant (1, 2), lettrine rouge brique.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le pied est rédigé ou dessiné comme un colophon ou un cartouche (page technique d'un ouvrage ou d'un plan). Disposition : R1[titre colophon en colonne centrale 5/12 + notes marge 3/12] > R2[liste associés ; adresse ; mentions].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Notes de marge passent sous le texte, colonne unique, texte aligné à gauche. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `text`, `bizcontact`, `bizlegal`, `menu`, `copyright`, `social` ; nouveaux : aucun
- **Risques techniques** : Beaucoup de texte : faible valeur de conversion, à réserver aux métiers de confiance.

<a id="c-004-usine-et-plan"></a>
### c-004-usine-et-plan · Usine et Plan

- **Secteur cible** : B2B industrie (famille : Corporate et institutions)
- **Composition** : `bandes-superposees` — Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle.
- **Direction artistique** : Industriel fictif « Ferroval ». Jaune franc et noir, comme un panneau de chantier (P6). Quadrillage millimétré en fond (CSS pur), cotes dans les marges. Tableau des sites : ligne, ville, spécialité, téléphone. Dense mais ordonné.
- **Références** : R17, R33, P6, P12
- **Geste fort** : *grille-blueprint* — Fond jaune sécurité quadrillé comme un papier millimétré, bandes empilées dont une bande noire « Demander un devis », et tableau de sites avec références de ligne.
- **Structure** : `R1[bande noire CTA devis] > R2[tableau 3 colonnes sites ; menu ; contact] > R3[bande jaune légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bande devis > 2 tableau des sites > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`cartes-multiples`) : Plusieurs cartes de contact (service, lieu, urgence).
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`bande-pleine`) : Bande pleine largeur dédiée à l'abonnement.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : vif-sature) : fond `#FFD21F` · texte `#111111` · texte discret `#3A3A3A` · accent `#111111` · surface `#FFE680`
  - Contrastes calculés : texte/fond 13.0:1, discret/fond 7.8:1, texte/surface 15.2:1, accent 15.2:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Barlow Condensed ; liens et texte courant : Barlow.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #FFD21F, surface #FFE680.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Quadrillage 24 px par dégradés linéaires, flèches de cote, rayures noires fines sur le bandeau.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle. Disposition : R1[bande noire CTA devis] > R2[tableau 3 colonnes sites ; menu ; contact] > R3[bande jaune légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Tableau en cartes une-colonne, bande devis collante en tête du pied. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `table`, `menu`, `bizcontact`, `bizphone`, `cta`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Noir sur jaune parfait (AA), mais jaune vif fatigant sur de grandes surfaces : limiter à 2 bandes.

<a id="c-005-chancellerie"></a>
### c-005-chancellerie · Chancellerie

- **Secteur cible** : cabinet juridique (famille : Corporate et institutions)
- **Composition** : `cadre-passe-partout` — Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte.
- **Direction artistique** : Cabinet d'avocats fictif « Maître & Fils ». Bordeaux très sombre, crème, laiton. Le cadre (bordure double dessinée en CSS) isole le pied du reste de la page comme un diplôme. Majuscules espacées, lien légal réglementaire en bonne place.
- **Références** : R16, R28, P8, P12
- **Geste fort** : *cadre-passe-partout* — Un double cadre fin couleur laiton entoure tout le pied, comme un acte encadré, avec un blason typographique au centre.
- **Structure** : `R1[monogramme + nom] > R2[menu horizontal 5 liens] > R3[adresse+tél] > R4[mentions réglementaires]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 monogramme et nom > 2 menu > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`aucun`) : Pas de réseaux sociaux.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-chaud) : fond `#2A1215` · texte `#F3E9DC` · texte discret `#C9B79E` · accent `#C9A55C` · surface `#3A1B1F`
  - Contrastes calculés : texte/fond 14.6:1, discret/fond 9.0:1, texte/surface 12.9:1, accent 7.5:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Cormorant Garamond ; liens et texte courant : Lato.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #2A1215, surface #3A1B1F.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Double bordure 1 px + 3 px d'espace, losange central entre deux filets.
- **Interactions** : Survol et focus : un soulignement se dessine de gauche à droite (200 ms). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte. Disposition : R1[monogramme + nom] > R2[menu horizontal 5 liens] > R3[adresse+tél] > R4[mentions réglementaires].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Cadre conservé, menu en 2 lignes centrées, mentions réduites. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizcontact`, `bizlegal`, `copyright`, `divider` ; nouveaux : aucun
- **Risques techniques** : Le cadre mange 24 px de chaque côté sur mobile : vérifier la lisibilité à 390 px.

<a id="c-006-agora-en-tuiles"></a>
### c-006-agora-en-tuiles · Agora en Tuiles

- **Secteur cible** : collectivité (famille : Corporate et institutions)
- **Composition** : `modulaire-bento` — Mosaïque de tuiles de tailles différentes, chacune avec une fonction.
- **Direction artistique** : Mairie fictive « Val-de-Rive ». Fond bleu pâle, tuiles blanches à coins 20 px. Grandes cibles tactiles, une tuile par besoin (horaires avec pastille ouvert/fermé, urgences, démarches). Lisible pour tous publics.
- **Références** : R30, R41, P3, P4
- **Geste fort** : *bento-tuiles* — Six tuiles de tailles différentes (démarches, horaires, urgences, agenda, plan, actualités) formant une mosaïque, chacune cliquable en entier.
- **Structure** : `R1[mosaïque 6 tuiles : 2x2, 1x1, 1x1, 2x1, 1x1, 1x1] > R2[newsletter pilule+réseaux] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 tuile démarches > 2 tuile horaires/urgence > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : pastel) : fond `#EEF3FB` · texte `#17233A` · texte discret `#4A5A75` · accent `#3D63DD` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 14.1:1, discret/fond 6.3:1, texte/surface 15.7:1, accent 5.2:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Lexend ; liens et texte courant : Atkinson Hyperlegible.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #EEF3FB, surface #FFFFFF.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Pictogrammes de ligne 28 px dans des disques pastel, coins 20 px, ombre douce.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Mosaïque de tuiles de tailles différentes, chacune avec une fonction. Disposition : R1[mosaïque 6 tuiles : 2x2, 1x1, 1x1, 2x1, 1x1, 1x1] > R2[newsletter pilule+réseaux] > R3[légal].
  - 820 : 2 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Mosaïque en 2 colonnes de tuiles égales sur mobile, tuile urgence en premier. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `iconbox`, `bizhours`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*ouvert-ferme`**
- **Risques techniques** : Pastille ouvert/fermé nécessite un widget lié aux horaires.

<a id="c-007-pacte-en-deux"></a>
### c-007-pacte-en-deux · Pacte en Deux

- **Secteur cible** : corporate RSE (famille : Corporate et institutions)
- **Composition** : `split-vertical` — Le pied est coupé en deux moitiés nettes, de fonds différents.
- **Direction artistique** : Société à mission fictive « Terrane ». Deux aplats francs (vert forêt, crème) et un jaune ambré pour le bouton (P6). Titre serif en 56 px sur la moitié verte, liens en sans-serif sur la crème. Un seul grand geste : la coupe verticale.
- **Références** : R15, R33, P6, P8
- **Geste fort** : *split-moitie* — Le pied est coupé en deux moitiés nettes : à gauche un aplat vert profond avec la promesse en grand, à droite un aplat crème avec la navigation.
- **Structure** : `R1[moitié G : promesse + bouton ; moitié D : menu 2 colonnes + email] > R2[légal pleine largeur]`
- **Colonnes** : 2 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 promesse > 2 e-mail et bouton > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`email-geant`) : L'adresse e-mail est affichée en très grand corps, comme un appel.
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : bicolore-contraste) : fond `#1F4D3A` · texte `#F6F0E4` · texte discret `#CFE0D4` · accent `#E0A526` · surface `#F6F0E4`
  - Contrastes calculés : texte/fond 8.5:1, discret/fond 7.0:1, texte/surface 12.5:1, accent 4.4:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Fraunces ; liens et texte courant : Figtree.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #1F4D3A, surface #F6F0E4.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Coupe verticale nette, petite feuille SVG en filigrane à gauche.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Le pied est coupé en deux moitiés nettes, de fonds différents. Disposition : R1[moitié G : promesse + bouton ; moitié D : menu 2 colonnes + email] > R2[légal pleine largeur].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Les moitiés s'empilent, promesse d'abord, la coupe devient horizontale. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `heading`, `menu`, `button`, `bizemail`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Deux fonds : vérifier contrastes texte/fond de chaque moitié (fait par script).

<a id="c-008-cap-sur-le-telephone"></a>
### c-008-cap-sur-le-telephone · Cap sur le Téléphone

- **Secteur cible** : services aux entreprises (famille : Corporate et institutions)
- **Composition** : `navigation-horizontale-compacte` — Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs.
- **Direction artistique** : PME de dépannage fictive. Bleu uni, texte blanc, un orange vif pour la flèche et la pastille d'appel. Le numéro est le héros (cible : appeler). Menu en pilules sur une ligne, légal minimal.
- **Références** : R16, R12, P12, P13
- **Geste fort** : *fleche-geante* — Le numéro de téléphone du service passe en 48 px à côté d'une grande flèche ↗, la navigation tient en une seule ligne de pilules.
- **Structure** : `R1[logo ; téléphone géant + flèche] > R2[pilules menu] > R3[légal+réseaux]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 numéro > 2 pilules > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#0D3B66` · texte `#FFFFFF` · texte discret `#B9D0E6` · accent `#FAA307` · surface `#175089`
  - Contrastes calculés : texte/fond 11.4:1, discret/fond 7.2:1, texte/surface 8.2:1, accent 5.6:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Schibsted Grotesk ; liens et texte courant : Hanken Grotesk.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0D3B66, surface #175089.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Flèche ↗ SVG 64 px, pastille « Disponible aujourd'hui » dérivée des horaires.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs. Disposition : R1[logo ; téléphone géant + flèche] > R2[pilules menu] > R3[légal+réseaux].
  - 820 : 1 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Numéro en pleine largeur et lien tel:, pilules en défilement horizontal. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `bizphone`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Si pas de numéro renseigné le geste disparaît : prévoir un repli e-mail.

## Famille : Finance et assurance

<a id="c-009-banque-nocturne"></a>
### c-009-banque-nocturne · Banque Nocturne

- **Secteur cible** : banque (famille : Finance et assurance)
- **Composition** : `marque-monumentale` — Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté.
- **Direction artistique** : Banque en ligne fictive « Nocto ». Bleu nuit, texte clair, corail pour le nom monumental et la lueur (R27, R26, P1, P7). Au-dessus du nom : quatre colonnes de liens (comptes, cartes, aide, société) et un bloc de mentions d'agrément que le client saisit lui-même, jamais de faux numéro.
- **Références** : R27, R26, P1, P7
- **Geste fort** : *logo-monumental* — Le nom « nocto » en minuscules corail de 20 vw, entouré d'une lueur douce, occupe tout le bas du pied.
- **Structure** : `R1[4 colonnes de liens ; bloc mentions réglementaires] > R2[nom monumental avec lueur] > R3[copyright ; réseaux ; langue]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom monumental > 2 colonnes de liens > 3 mentions réglementaires
- **Logo** : Nom ou logo monumental (clamp, 14 à 34 vw), rogné ou pleine largeur.
- **Menus** (`mega-grille`) : Grille de colonnes de liens avec titres, type méga-menu.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-bleu) : fond `#0A1128` · texte `#F2F4FA` · texte discret `#AEB6D0` · accent `#FF6B57` · surface `#141E40`
  - Contrastes calculés : texte/fond 17.0:1, discret/fond 9.3:1, texte/surface 14.8:1, accent 6.7:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Red Hat Display ; liens et texte courant : DM Sans.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #0A1128, surface #141E40.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Lueur radiale corail à 10 %, filet horizontal de 1 px au-dessus du nom.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté. Disposition : R1[4 colonnes de liens ; bloc mentions réglementaires] > R2[nom monumental avec lueur] > R3[copyright ; réseaux ; langue].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Nom à 28 vw, colonnes en accordéon, mentions toujours dépliées. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizlegal`, `social`, `copyright` ; nouveaux : **`*selecteur-langue`**
- **Risques techniques** : Lueur radiale : vérifier que le texte reste AA sur la zone éclairée ; taille du nom plafonnée pour éviter tout débordement.

<a id="c-010-assurance-claire"></a>
### c-010-assurance-claire · Assurance Claire

- **Secteur cible** : assurance (famille : Finance et assurance)
- **Composition** : `3col` — Trois colonnes de contenu de poids comparables, sous une éventuelle ligne de marque.
- **Direction artistique** : Assureur fictif « Clairmont ». Fond bleu très pâle, teal pour l'autocollant et les liens. Trois colonnes (produits, sinistres, à propos). La pastille urgence est le geste fort (P17).
- **Références** : R30, R27, P12
- **Geste fort** : *sticker-pastille* — Une pastille ronde « En cas de sinistre » avec le numéro d'urgence se détache en haut à droite, comme un autocollant.
- **Structure** : `R1[3 colonnes + pastille urgence] > R2[mentions assureur] > R3[copyright]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 pastille urgence > 2 colonnes > 3 mentions
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : clair-froid) : fond `#F1F7FA` · texte `#10303F` · texte discret `#3F5F6E` · accent `#00897B` · surface `#DDEBF1`
  - Contrastes calculés : texte/fond 12.8:1, discret/fond 6.3:1, texte/surface 11.4:1, accent 4.0:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Outfit ; liens et texte courant : Nunito Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F1F7FA, surface #DDEBF1.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Pastille ronde 112 px inclinée -6°, trait pointillé interne.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Trois colonnes de contenu de poids comparables, sous une éventuelle ligne de marque. Disposition : R1[3 colonnes + pastille urgence] > R2[mentions assureur] > R3[copyright].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Pastille pleine largeur en tête, colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizphone`, `badge`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Inclinaison à neutraliser en mouvement réduit (statique).

<a id="c-011-gestion-privee"></a>
### c-011-gestion-privee · Gestion Privée

- **Secteur cible** : gestion de patrimoine (famille : Finance et assurance)
- **Composition** : `centre-pile` — Pile centrée d'éléments (marque, liens, mentions), symétrique.
- **Direction artistique** : Cabinet de gestion fictif « Delorme Patrimoine ». Beige sable et encre brune, aucun bouton. Une signature en script remplace le logo, très discrète (P12). La confiance par l'écrit.
- **Références** : R28, R21, P8
- **Geste fort** : *signature-script* — Au centre, une signature manuscrite du fondateur en script fin sert de logo, sous un monogramme à filet.
- **Structure** : `R1[signature] > R2[3 liens] > R3[adresse ligne] > R4[mentions]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 signature > 2 trois liens > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`aucun`) : Pas de réseaux sociaux.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : beige-sable) : fond `#EFE7D8` · texte `#24201A` · texte discret `#665C4C` · accent `#7A5C2E` · surface `#E3D8C2`
  - Contrastes calculés : texte/fond 13.2:1, discret/fond 5.3:1, texte/surface 11.5:1, accent 5.0:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Bodoni Moda ; liens et texte courant : Jost ; accent manuscrit ou décoratif : Homemade Apple (jamais pour de l'information).
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #EFE7D8, surface #E3D8C2.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filet fin, monogramme en cercle.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 1 colonne(s) : Pile centrée d'éléments (marque, liens, mentions), symétrique. Disposition : R1[signature] > R2[3 liens] > R3[adresse ligne] > R4[mentions].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Rien ne change sauf les interlignes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `text`, `menu`, `bizcontact`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Script décoratif : ne jamais l'utiliser pour du texte informatif.

<a id="c-012-fintech-tableau"></a>
### c-012-fintech-tableau · Fintech Tableau

- **Secteur cible** : fintech (famille : Finance et assurance)
- **Composition** : `tableau-de-bord` — Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux.
- **Direction artistique** : Néobanque fictive « Ledgr ». Noir verdâtre, vert menthe vif. Mono pour tout sauf les titres. La barre d'état fournit l'information vivante (P11). Le statut doit venir d'une vraie source, sinon masqué (pas de faux état).
- **Références** : R22, R23, P7, P11
- **Geste fort** : *curseur-statut* — Une barre d'état en bas affiche « Tous les services opérationnels » avec un point vert, une ligne de commandes et la version, comme un terminal.
- **Structure** : `R1[4 colonnes de liens en mono] > R2[barre d'état : statut ; version ; langue]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 statut > 2 colonnes > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : neon-sombre) : fond `#0B0F0C` · texte `#E6F2E8` · texte discret `#93A89A` · accent `#3DFFA0` · surface `#131A15`
  - Contrastes calculés : texte/fond 16.8:1, discret/fond 7.6:1, texte/surface 15.4:1, accent 14.7:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : JetBrains Mono ; liens et texte courant : IBM Plex Sans.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #0B0F0C, surface #131A15.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Point pulsé (arrêt en mouvement réduit), accolades décoratives { }.
- **Interactions** : Anneau de focus de 3 px très visible, champ qui s'agrandit au focus ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. Disposition : R1[4 colonnes de liens en mono] > R2[barre d'état : statut ; version ; langue].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Barre d'état en 2 lignes, colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*pastille-statut`**
- **Risques techniques** : Statut système : nouveau widget, avec vraie source.

<a id="c-013-mutuelle-en-cartes"></a>
### c-013-mutuelle-en-cartes · Mutuelle en Cartes

- **Secteur cible** : mutuelle (famille : Finance et assurance)
- **Composition** : `cartes-empilees` — Plusieurs cartes qui se superposent ou se décalent en escalier.
- **Direction artistique** : Mutuelle coopérative fictive « La Rive ». Vert profond, crème, ocre pour le liseré actif. Éventail de trois cartes (R13, P3) : tout le contenu reste dans la page, accessible au clavier et au lecteur d'écran, et les cartes sont toutes entièrement visibles sur mobile.
- **Références** : R13, R30, P3
- **Geste fort** : *pile-cartes* — Trois cartes posées en éventail comme un jeu : celle du dessus (Adhérer) montre tout son contenu, les deux autres (Être remboursé, Nous trouver) laissent dépasser leur titre ; le focus clavier ramène une carte devant.
- **Structure** : `R1[éventail de 3 cartes : Adhérer ; Être remboursé ; Nous trouver] > R2[menu court ; réseaux] > R3[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte adhérer > 2 cartes remboursement et agences > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`cartes-multiples`) : Plusieurs cartes de contact (service, lieu, urgence).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : monochrome-couleur) : fond `#17443B` · texte `#F3EFE6` · texte discret `#CFE3D8` · accent `#F2B04B` · surface `#225A4F`
  - Contrastes calculés : texte/fond 9.5:1, discret/fond 8.1:1, texte/surface 6.9:1, accent 5.8:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Nunito ; liens et texte courant : Fraunces.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #17443B, surface #225A4F.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Cartes tournées de -4°, 0° et +4°, coins 28/28/28/6, ombre douce.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Plusieurs cartes qui se superposent ou se décalent en escalier. Disposition : R1[éventail de 3 cartes : Adhérer ; Être remboursé ; Nous trouver] > R2[menu court ; réseaux] > R3[légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Cartes empilées sans rotation, toutes lisibles. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `imagebox`, `button`, `bizcontact`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Éventail géré par :focus-within en CSS : tester au clavier ; aucune carte ne doit cacher un texte à lire.

<a id="c-014-index-du-comptable"></a>
### c-014-index-du-comptable · Index du Comptable

- **Secteur cible** : expert-comptable (famille : Finance et assurance)
- **Composition** : `index-numerote` — Les liens forment un index numéroté, comme une table des matières.
- **Direction artistique** : Cabinet comptable fictif « Chiffre & Lettre ». Papier crème, vert sapin sobre. Numéros en slab, liens en sans-serif, pointillés CSS. Rigueur chaleureuse, aucune fioriture.
- **Références** : R25, R12, P12
- **Geste fort** : *index-chiffre* — Les liens sont numérotés 01 à 08 comme les lignes d'un grand livre, reliés à leur page par un pointillé.
- **Structure** : `R1[logo+phrase ; index 01-08 sur 2 colonnes] > R2[adresse+horaires] > R3[légal]`
- **Colonnes** : 2 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 index numéroté > 2 adresse > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`index-numerote`) : Liste numérotée 01, 02… avec filets, comme un index.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : blanc-casse) : fond `#F9F7F1` · texte `#1C2420` · texte discret `#56605A` · accent `#1F6F5C` · surface `#E8E6DA`
  - Contrastes calculés : texte/fond 14.8:1, discret/fond 6.1:1, texte/surface 12.7:1, accent 5.6:1 (AA : conforme)
- **Typographies** (slab) : Titre et grande échelle : Zilla Slab ; liens et texte courant : Source Sans 3.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F9F7F1, surface #E8E6DA.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Pointillés, numéros en chiffres tabulaires.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Les liens forment un index numéroté, comme une table des matières. Disposition : R1[logo+phrase ; index 01-08 sur 2 colonnes] > R2[adresse+horaires] > R3[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Index en accordéon unique, numéros conservés. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizcontact`, `bizhours`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Les numéros sont purement visuels (liste ordonnée accessible).

## Famille : SaaS, tech et startup

<a id="c-015-palette-de-commandes"></a>
### c-015-palette-de-commandes · Palette de Commandes

- **Secteur cible** : SaaS pour développeurs (famille : SaaS, tech et startup)
- **Composition** : `formulaire-integre` — Un formulaire (e-mail, recherche, candidature) est le geste principal du pied.
- **Direction artistique** : SaaS fictif « Relay ». Noir presque pur, gris moyens, un violet pâle réservé au focus du champ et au filet du haut (R22, R23, P7, P17). Pas de six colonnes : le pied invite d'abord à chercher, puis range ses liens en trois lignes denses.
- **Références** : R22, R23, P7, P17
- **Geste fort** : *palette-commandes* — Une barre de recherche centrale façon palette de commandes (« Rechercher dans le site… », raccourci ⌘K affiché à titre décoratif) précède trois lignes de liens groupés par rubrique.
- **Structure** : `R1[champ de recherche large] > R2[3 lignes : Produit ; Ressources ; Société, liens séparés par des points] > R3[langue ; réseaux ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 champ de recherche > 2 trois lignes de liens > 3 langue et légal
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : noir) : fond `#08090A` · texte `#EDEEF0` · texte discret `#9A9FA8` · accent `#7C8CFF` · surface `#14161A`
  - Contrastes calculés : texte/fond 17.2:1, discret/fond 7.5:1, texte/surface 15.6:1, accent 6.7:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Geist ; liens et texte courant : Geist Mono.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #08090A, surface #14161A.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Raccourci ⌘K décoratif (aria-hidden), filet lumineux de 1 px au bord haut.
- **Interactions** : Survol et focus : un soulignement se dessine de gauche à droite (200 ms). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Un formulaire (e-mail, recherche, candidature) est le geste principal du pied. Disposition : R1[champ de recherche large] > R2[3 lignes : Produit ; Ressources ; Société, liens séparés par des points] > R3[langue ; réseaux ; légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Champ pleine largeur, lignes de liens à la suite, langue en bas. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `search`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*selecteur-langue`**
- **Risques techniques** : Le raccourci ⌘K est décoratif et ne doit pas être présenté comme fonctionnel ; la recherche utilise le widget search du site.

<a id="c-016-onglets-documentation"></a>
### c-016-onglets-documentation · Onglets Documentation

- **Secteur cible** : documentation technique (famille : SaaS, tech et startup)
- **Composition** : `onglets` — Des onglets permettent d'afficher une seule liste de liens à la fois.
- **Direction artistique** : Plateforme API fictive « Portail ». Gris charbon chaud, ambre pour l'onglet actif. Le pied reste bas et court (un seul panneau visible) pour une documentation très riche. Typographie mono pour les onglets, sans pour les liens.
- **Références** : R23, R41, P4
- **Geste fort** : *tab-bascule* — Trois onglets en tête du pied (Produit, Développeurs, Société) changent la liste affichée dessous, comme un explorateur de fichiers.
- **Structure** : `R1[onglets x3] > R2[panneau de liens 2 colonnes] > R3[légal+copyright]`
- **Colonnes** : 3 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 onglet actif > 2 liens du panneau > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`onglets`) : Onglets qui affichent une rubrique à la fois.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#1A1B1E` · texte `#E8E6E1` · texte discret `#A7A39B` · accent `#F2A93B` · surface `#26272B`
  - Contrastes calculés : texte/fond 13.8:1, discret/fond 6.8:1, texte/surface 12.0:1, accent 8.6:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : IBM Plex Mono ; liens et texte courant : IBM Plex Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #1A1B1E, surface #26272B.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Soulignement ambré de l'onglet actif, curseur ▌ décoratif.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Des onglets permettent d'afficher une seule liste de liens à la fois. Disposition : R1[onglets x3] > R2[panneau de liens 2 colonnes] > R3[légal+copyright].
  - 820 : 1 colonne(s). Les onglets restent affichés avec leur panneau, en deux colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques deviennent des onglets ; un seul panneau est affiché. Onglets en défilement horizontal, panneau en liste simple. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `tabs`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Onglets sans JavaScript non garanti : le widget Tabs gère l'accessibilité clavier.

<a id="c-017-phrase-de-lancement"></a>
### c-017-phrase-de-lancement · Phrase de Lancement

- **Secteur cible** : startup (famille : SaaS, tech et startup)
- **Composition** : `phrase-geante` — Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens.
- **Direction artistique** : Startup fictive « Orbito ». Violet électrique, blanc, un citron vif pour le bouton. La phrase monumentale remplace le bloc de liens (P2) ; les liens utiles tiennent sur une ligne minuscule (P5).
- **Références** : R19, R09, P2, P5, P10
- **Geste fort** : *phrase-geante* — « Prêts à lancer ? » en 12 vw sur toute la largeur, avec un champ e-mail souligné sur la même ligne que la fin de la phrase.
- **Structure** : `R1[phrase géante + champ e-mail] > R2[ligne liens+réseaux+légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 phrase > 2 champ e-mail > 3 ligne de liens
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`grande-phrase`) : Le champ e-mail se glisse à la fin d'une phrase géante.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : degrade) : fond `#4B2BFF` · texte `#FFFFFF` · texte discret `#D6D0FF` · accent `#CAFF3D` · surface `#6347FF`
  - Contrastes calculés : texte/fond 6.8:1, discret/fond 4.6:1, texte/surface 5.4:1, accent 5.8:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Unbounded ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #4B2BFF, surface #6347FF.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Soulignement épais du champ, flèche → animée.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens. Disposition : R1[phrase géante + champ e-mail] > R2[ligne liens+réseaux+légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Phrase sur 3 lignes, champ pleine largeur, liens en 2 lignes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `heading`, `emailsubscribe`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Taille en vw : plafonner avec clamp pour éviter le débordement à 1920 px.

<a id="c-018-aurore-ia"></a>
### c-018-aurore-ia · Aurore IA

- **Secteur cible** : intelligence artificielle (famille : SaaS, tech et startup)
- **Composition** : `image-de-fond` — Une image, une illustration ou un motif plein cadre est le fond du pied.
- **Direction artistique** : Produit d'IA fictif « Lumen ». Fond nuit, deux taches de dégradé flou (radial-gradient) et une carte au flou d'arrière-plan. Les liens sont en pilules sombres. Effet moderne sans image ni canvas.
- **Références** : R09, R11, P7, P13
- **Geste fort** : *verre-flou* — Une aurore de dégradés violet-cyan en CSS derrière une grande carte de verre dépoli qui porte la navigation.
- **Structure** : `R1[carte de verre : logo ; pilules ; champ] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte de verre > 2 pilules > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : degrade) : fond `#0B0B1E` · texte `#F4F4FF` · texte discret `#B4B4D6` · accent `#8F7BFF` · surface `#1A1A38`
  - Contrastes calculés : texte/fond 17.8:1, discret/fond 9.7:1, texte/surface 15.4:1, accent 6.0:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Space Grotesk ; liens et texte courant : Figtree.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Carte de verre dépoli (backdrop-filter) sur fond dégradé ; repli en fond uni. Palette : fond #0B0B1E, surface #1A1A38.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Deux radial-gradient, bordure 1 px blanche à 14 %, backdrop-filter avec repli en fond uni.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 4 colonne(s) : Une image, une illustration ou un motif plein cadre est le fond du pied. Disposition : R1[carte de verre : logo ; pilules ; champ] > R2[légal].
  - 820 : 2 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Carte pleine largeur, pilules en menu déroulant compact. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : backdrop-filter absent sur anciens navigateurs : repli fond uni prévu.

<a id="c-019-statut-nuage"></a>
### c-019-statut-nuage · Statut Nuage

- **Secteur cible** : infrastructure cloud (famille : SaaS, tech et startup)
- **Composition** : `tableau-de-bord` — Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux.
- **Direction artistique** : Hébergeur fictif « Altocloud ». Blanc bleuté, bleu franc. Le pied dit tout de suite si le service va bien (information vivante P11) puis donne cinq colonnes. Statut seulement s'il existe une vraie source.
- **Références** : R23, R26, P11, P15
- **Geste fort** : *sticker-pastille* — Une pastille de statut « Tous les systèmes fonctionnent » (vraie source) à côté du bouton d'essai, au sommet du pied.
- **Structure** : `R1[pastille statut ; bouton essai ; langue] > R2[5 colonnes] > R3[légal]`
- **Colonnes** : 5 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 statut > 2 colonnes > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : clair-froid) : fond `#F4F7FB` · texte `#0F1B2D` · texte discret `#4C5B70` · accent `#0A6ED1` · surface `#E1E9F3`
  - Contrastes calculés : texte/fond 16.1:1, discret/fond 6.4:1, texte/surface 14.1:1, accent 4.7:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Figtree ; liens et texte courant : Hanken Grotesk.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F4F7FB, surface #E1E9F3.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Point vert/orange/rouge avec libellé texte (pas la couleur seule).
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. Disposition : R1[pastille statut ; bouton essai ; langue] > R2[5 colonnes] > R3[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Statut + bouton en tête, 5 rubriques en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `button`, `menu`, `bizlegal`, `copyright` ; nouveaux : **`*pastille-statut`**, **`*selecteur-langue`**
- **Risques techniques** : Widget de statut nouveau, dépendant d'un flux réel.

<a id="c-020-appli-diptyque"></a>
### c-020-appli-diptyque · Appli Diptyque

- **Secteur cible** : application mobile (famille : SaaS, tech et startup)
- **Composition** : `split-vertical` — Le pied est coupé en deux moitiés nettes, de fonds différents.
- **Direction artistique** : Appli de budget fictive « Pocket ». Pastel lavande-bleu, panneaux blancs très arrondis. Le téléphone est dessiné en SVG et reste contenu dans son panneau (aucun débordement) (R20, R41, P3).
- **Références** : R20, R41, P3, P4
- **Geste fort** : *illustration-svg* — À gauche, un téléphone dessiné en SVG sur dégradé lavande avec les deux boutons de téléchargement ; à droite, les liens en pilules.
- **Structure** : `R1[moitié G : téléphone SVG + badges ; moitié D : pilules + newsletter] > R2[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 téléphone et badges > 2 pilules de liens > 3 newsletter
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : pastel) : fond `#EAF1FF` · texte `#172036` · texte discret `#4A5876` · accent `#5B6CFF` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 14.3:1, discret/fond 6.3:1, texte/surface 16.2:1, accent 4.2:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Plus Jakarta Sans ; liens et texte courant : Nunito Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #EAF1FF, surface #FFFFFF.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Téléphone SVG 220 px, étoiles décoratives, séparation en courbe douce.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le pied est coupé en deux moitiés nettes, de fonds différents. Disposition : R1[moitié G : téléphone SVG + badges ; moitié D : pilules + newsletter] > R2[légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Moitiés empilées, téléphone réduit à 160 px. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `imagebox`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*badges-appli`**
- **Risques techniques** : Badges des magasins : images fournies par le client.

<a id="c-021-terminal-vigie"></a>
### c-021-terminal-vigie · Terminal Vigie

- **Secteur cible** : cybersécurité (famille : SaaS, tech et startup)
- **Composition** : `ticker-statique` — Un ruban ou bandeau défilant (arrêté en mouvement réduit) tient le rôle principal.
- **Direction artistique** : Éditeur de sécurité fictif « Vigie ». Noir brun et ambre type vieux terminal, texture de lignes de balayage en CSS. Le marquee défile lentement et s'arrête au survol, au focus et en mouvement réduit.
- **Références** : R38, R18, P12
- **Geste fort** : *marquee-defilant* — Un bandeau défilant lent de messages type journal d'événements (ex. « LISTE DES SERVICES · MENTIONS · CONTACT »), en ambre sur noir.
- **Structure** : `R1[marquee] > R2[3 liens ; contact] > R3[légal]`
- **Colonnes** : 3 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bandeau > 2 liens > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : neon-sombre) : fond `#0E0A04` · texte `#FFB44A` · texte discret `#D9A25E` · accent `#FFB44A` · surface `#1B1409`
  - Contrastes calculés : texte/fond 11.2:1, discret/fond 8.7:1, texte/surface 10.3:1, accent 11.2:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Share Tech Mono ; liens et texte courant : IBM Plex Mono.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #0E0A04, surface #1B1409.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Lignes de balayage (repeating-linear-gradient), curseur clignotant.
- **Interactions** : Défilement lent d'un ruban (40 s la boucle), pause au survol et au focus. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Défilement lent d'un ruban (40 s la boucle), pause au survol et au focus.
  - Mouvement réduit : Sous prefers-reduced-motion : le ruban s'arrête et devient une ligne fixe.
- **Responsive**
  - 1280 : 3 colonne(s) : Un ruban ou bandeau défilant (arrêté en mouvement réduit) tient le rôle principal. Disposition : R1[marquee] > R2[3 liens ; contact] > R3[légal].
  - 820 : 1 colonne(s). Tous les éléments restent visibles, les moins importants se réduisent. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments secondaires sont retirés au profit de l'essentiel (indiqué ci-dessous). Bandeau remplacé par une ligne fixe, 3 liens empilés. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `marquee`, `menu`, `bizcontact`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Texte défilant : doit rester duplicable en statique ; pas de contenu essentiel dedans.

<a id="c-022-atelier-sticker"></a>
### c-022-atelier-sticker · Atelier Sticker

- **Secteur cible** : outil no-code (famille : SaaS, tech et startup)
- **Composition** : `3col` — Trois colonnes de contenu de poids comparables, sous une éventuelle ligne de marque.
- **Direction artistique** : Outil no-code fictif « Brique ». Jaune franc, noir, violet pour l'accent. Trois autocollants (Produit, Aide, Société) avec ombres dures. Ludique mais lisible (noir sur jaune).
- **Références** : R37, R17, P12
- **Geste fort** : *ombre-dure* — Chaque bloc est un autocollant à bordure noire de 3 px et ombre dure décalée de 6 px, légèrement incliné.
- **Structure** : `R1[3 cartes autocollants] > R2[bande légal]`
- **Colonnes** : 3 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 logo et autocollants > 2 inscription > 3 légal
- **Logo** : Logo placé à droite, en fin de ligne ou de bloc.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : vif-sature) : fond `#FFE14D` · texte `#14110B` · texte discret `#3B3520` · accent `#6C3BFF` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 14.5:1, discret/fond 9.4:1, texte/surface 18.8:1, accent 5.7:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Bagel Fat One ; liens et texte courant : Rubik.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #FFE14D, surface #FFFFFF.
- **Formes** (brutaliste) : Bordures noires de 3 px, ombres dures décalées sans flou, rayon 0.
- **Décor, icônes, illustrations** : Inclinaisons ±2°, bordure 3 px, ombre 6 px 6 px 0 noire.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Trois colonnes de contenu de poids comparables, sous une éventuelle ligne de marque. Disposition : R1[3 cartes autocollants] > R2[bande légal].
  - 820 : 3 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Autocollants empilés sans rotation. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `container`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Inclinaisons coupées en mouvement réduit.

<a id="c-023-laboratoire-donnees"></a>
### c-023-laboratoire-donnees · Laboratoire Données

- **Secteur cible** : analytique de données (famille : SaaS, tech et startup)
- **Composition** : `asymetrique` — Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information).
- **Direction artistique** : Outil d'analyse fictif « Trame ». Un seul orange brûlé en toutes nuances, texte crème. Grand contraste d'échelle (P5) : le chiffre énorme sert de décor, les liens font 13 px.
- **Références** : R36, R18, P5
- **Geste fort** : *contraste-echelle* — Un énorme « 01 » de plusieurs centaines de pixels, tronqué par le bord gauche, face à de minuscules libellés sur la droite.
- **Structure** : `R1[gros chiffre ; colonne 8/12 liens] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 chiffre géant > 2 liste de liens > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`liste-geante`) : Liste verticale de grandes lignes (9 vw maximum), une rubrique par ligne.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#9A3412` · texte `#FFF7ED` · texte discret `#FED7AA` · accent `#FFEDD5` · surface `#B4440F`
  - Contrastes calculés : texte/fond 6.9:1, discret/fond 5.4:1, texte/surface 5.2:1, accent 6.4:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Familjen Grotesk ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #9A3412, surface #B4440F.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Chiffre en 38 vw, opacité 18 %, rogné par overflow hidden.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). Disposition : R1[gros chiffre ; colonne 8/12 liens] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Chiffre réduit en haut, liens dessous. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `heading`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Chiffre en décor : aria-hidden.

## Famille : E-commerce, mode et luxe

<a id="c-024-maison-ivoire"></a>
### c-024-maison-ivoire · Maison Ivoire

- **Secteur cible** : boutique de luxe (famille : E-commerce, mode et luxe)
- **Composition** : `marque-monumentale` — Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté.
- **Direction artistique** : Maison de maroquinerie fictive « Aubrac Paris ». Ivoire, encre, un seul laiton fin. Le nom monumental très pâle est rogné par le bas (P1), les liens sont petits et espacés. L'abondance de vide est le luxe.
- **Références** : R21, R28, R36, P1, P8
- **Geste fort** : *texte-rogne* — Le nom de la maison en lettres de 18 vw, très pâles, rogné par le bas du pied et servant de filigrane derrière les liens.
- **Structure** : `R1[liens ; newsletter ; contact] > R2[nom monumental rogné]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom en filigrane > 2 newsletter > 3 liens
- **Logo** : Nom en filigrane très pâle (opacité 8 à 18 %) derrière le contenu, ne portant aucune information.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : blanc-casse) : fond `#F7F3EC` · texte `#221E19` · texte discret `#6A6055` · accent `#9C7A4A` · surface `#EFE8DB`
  - Contrastes calculés : texte/fond 15.0:1, discret/fond 5.6:1, texte/surface 13.6:1, accent 3.6:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Cormorant Garamond ; liens et texte courant : Jost.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F7F3EC, surface #EFE8DB.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Lettres filigrane, filet laiton 1 px.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté. Disposition : R1[liens ; newsletter ; contact] > R2[nom monumental rogné].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Filigrane réduit à 24 vw ; colonnes de liens en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Le filigrane ne doit jamais gêner la lisibilité (contraste mesuré sur le texte seul).

<a id="c-025-marche-du-terroir"></a>
### c-025-marche-du-terroir · Marché du Terroir

- **Secteur cible** : e-commerce alimentaire (famille : E-commerce, mode et luxe)
- **Composition** : `carte-decollee` — Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond.
- **Direction artistique** : Épicerie en ligne fictive « Terroirs & Co ». Vert pomme franc, carte crème, encre verte. La carte décollée évite la barre grise pleine largeur (P3), les crédits restent lisibles sur le vert (P6).
- **Références** : R13, R17, P3, P6
- **Geste fort** : *carte-arrondie* — Une grande carte crème aux coins de 36 px, posée à 24 px des bords sur un aplat vert pomme, avec les mentions légales sur le vert.
- **Structure** : `R1[carte : marque ; liens ; newsletter ; horaires] > R2[légal sur aplat]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte newsletter > 2 liens > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : vif-sature) : fond `#8DBF3F` · texte `#22301A` · texte discret `#2F4A1F` · accent `#2F4A1F` · surface `#F6EFDD`
  - Contrastes calculés : texte/fond 6.4:1, discret/fond 4.5:1, texte/surface 12.2:1, accent 8.6:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Young Serif ; liens et texte courant : Karla.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #8DBF3F, surface #F6EFDD.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Coins 36 px, ombre légère, étiquette ronde rotative décorative.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond. Disposition : R1[carte : marque ; liens ; newsletter ; horaires] > R2[légal sur aplat].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Carte à 12 px des bords, tout en pile. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `bizhours`, `bizdelivery`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Vert pomme sous texte sombre uniquement.

<a id="c-026-drop-sneakers"></a>
### c-026-drop-sneakers · Drop Sneakers

- **Secteur cible** : e-commerce streetwear (famille : E-commerce, mode et luxe)
- **Composition** : `ticker-statique` — Un ruban ou bandeau défilant (arrêté en mouvement réduit) tient le rôle principal.
- **Direction artistique** : Boutique de baskets fictive « Pointure ». Noir, blanc, citron. Le ruban n'annonce que des services vrais, aucune rareté inventée ni compte à rebours. Majuscules condensées en 28 px.
- **Références** : R3, R11, P12
- **Geste fort** : *ruban-incline* — Un ruban noir et citron, incliné de -2°, défile en continu avec les engagements réels de la boutique (livraison, retours, paiement sécurisé).
- **Structure** : `R1[ruban citron] > R2[logo ; liens ; newsletter bande] > R3[paiements+légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 ruban > 2 newsletter > 3 liens
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`grille-labels`) : Grille de libellés de réseaux, façon étiquettes.
- **Newsletter** (`bande-pleine`) : Bande pleine largeur dédiée à l'abonnement.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : noir) : fond `#0D0D0D` · texte `#FFFFFF` · texte discret `#B8B8B8` · accent `#D4FF2A` · surface `#1A1A1A`
  - Contrastes calculés : texte/fond 19.4:1, discret/fond 9.8:1, texte/surface 17.4:1, accent 16.8:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Anton ; liens et texte courant : Archivo.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0D0D0D, surface #1A1A1A.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Ruban incliné -2°, flèches dans les liens.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Un ruban ou bandeau défilant (arrêté en mouvement réduit) tient le rôle principal. Disposition : R1[ruban citron] > R2[logo ; liens ; newsletter bande] > R3[paiements+légal].
  - 820 : 2 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Ruban plus fin, liens en menu compact. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `marquee`, `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizdelivery`, `bizpayments`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Aucun faux message d'urgence ; ruban statique en mouvement réduit.

<a id="c-027-concept-store-pastel"></a>
### c-027-concept-store-pastel · Concept Store Pastel

- **Secteur cible** : concept store (famille : E-commerce, mode et luxe)
- **Composition** : `4col` — Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre.
- **Direction artistique** : Concept store fictif « Petit Nuage ». Rose poudré, prune doux, framboise. Les pastilles aux couleurs différentes servent de navigation visuelle.
- **Références** : R31, R13, P12
- **Geste fort** : *sticker-pastille* — Des pastilles ovales de catégories (Maison, Papeterie, Beauté) colorées comme des bonbons au-dessus des colonnes.
- **Structure** : `R1[logo centré ; pastilles] > R2[4 colonnes] > R3[newsletter ; légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 pastilles > 2 colonnes > 3 newsletter
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : pastel) : fond `#FBEFF0` · texte `#3A2230` · texte discret `#6B4A5C` · accent `#E0568A` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 12.9:1, discret/fond 6.8:1, texte/surface 14.5:1, accent 3.6:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Quicksand ; liens et texte courant : Fredoka.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FBEFF0, surface #FFFFFF.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Pastilles 40 px de haut, confettis SVG discrets.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre. Disposition : R1[logo centré ; pastilles] > R2[4 colonnes] > R3[newsletter ; légal].
  - 820 : 2 colonne(s). La rangée défilante montre 3 éléments à la fois. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments en rangée défilent horizontalement avec accroche (scroll-snap), un élément et demi visible. Pastilles en défilement horizontal, colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `shopcategories`, `menu`, `emailsubscribe`, `social`, `bizdelivery`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Plusieurs couleurs de pastilles : texte foncé partout (AA).

<a id="c-028-frise-de-confiance"></a>
### c-028-frise-de-confiance · Frise de Confiance

- **Secteur cible** : e-commerce électronique (famille : E-commerce, mode et luxe)
- **Composition** : `frise` — Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens.
- **Direction artistique** : Boutique d'électronique fictive « Voltage ». Blanc, bleu nuit, rouge. Avant les catégories, le pied raconte la promesse de service étape par étape, avec les délais réels du client (aucun chiffre inventé) (R7, R11, P11).
- **Références** : R7, R11, R82, P4
- **Geste fort** : *frise-garanties* — Une frise en quatre étapes reliées par un fil (Commande, Expédition, Livraison, Retour) donne les vrais délais et conditions saisis par la boutique, une icône par étape.
- **Structure** : `R1[frise 4 étapes] > R2[aide : téléphone, suivi, retours ; catégories x4] > R3[légal ; paiements]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 frise de confiance > 2 aide > 3 catégories
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : bicolore-contraste) : fond `#FFFFFF` · texte `#0F172A` · texte discret `#475569` · accent `#E11D48` · surface `#F1F5F9`
  - Contrastes calculés : texte/fond 17.9:1, discret/fond 7.6:1, texte/surface 16.3:1, accent 4.7:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Red Hat Display ; liens et texte courant : Public Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #FFFFFF, surface #F1F5F9.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Fil rouge de 3 px reliant quatre pastilles numérotées, icônes de ligne.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. Disposition : R1[frise 4 étapes] > R2[aide : téléphone, suivi, retours ; catégories x4] > R3[légal ; paiements].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Frise verticale, fil à gauche ; catégories en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `timeline`, `iconbox`, `bizdelivery`, `bizpayments`, `bizphone`, `shopcategories`, `shoplinks`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Trois niveaux de bandes : bien limiter la hauteur.

<a id="c-029-botanique-bio"></a>
### c-029-botanique-bio · Botanique Bio

- **Secteur cible** : cosmétique bio (famille : E-commerce, mode et luxe)
- **Composition** : `image-de-fond` — Une image, une illustration ou un motif plein cadre est le fond du pied.
- **Direction artistique** : Cosmétique bio fictif « Herba ». Vert mousse, crème, doré. Photo fournie par le client avec voile 55 %. À défaut de photo, repli en dégradé vert.
- **Références** : R13, R31, P3
- **Geste fort** : *photo-plein-cadre* — Une photo de feuillage en fond, assombrie, avec une carte de newsletter centrale en verre clair.
- **Structure** : `R1[carte newsletter centrale] > R2[liens ; réseaux] > R3[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 newsletter > 2 liens > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : terre-naturel) : fond `#2B3A2A` · texte `#F3EEDF` · texte discret `#CFC8B0` · accent `#D9B26F` · surface `#3C4E3A`
  - Contrastes calculés : texte/fond 10.4:1, discret/fond 7.2:1, texte/surface 7.7:1, accent 6.1:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Cormorant Garamond ; liens et texte courant : Mulish.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Photo fournie par le client, voilée (50 à 70 %) pour garder le contraste ; repli en dégradé si absente. Palette : fond #2B3A2A, surface #3C4E3A.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Voile dégradé, coins 28 px, feuille SVG.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 3 colonne(s) : Une image, une illustration ou un motif plein cadre est le fond du pied. Disposition : R1[carte newsletter centrale] > R2[liens ; réseaux] > R3[légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Carte pleine largeur, liens empilés. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `image`, `emailsubscribe`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Dépendance à une photo du client ; repli prévu.

<a id="c-030-horlogerie-bandeau"></a>
### c-030-horlogerie-bandeau · Horlogerie en Bandeau

- **Secteur cible** : horlogerie de luxe (famille : E-commerce, mode et luxe)
- **Composition** : `bandeau-lateral` — Une bande verticale latérale porte la marque ou un signe, le contenu est à côté.
- **Direction artistique** : Horloger fictif « Verdan ». Noir, blanc de nacre, acier bleuté. Bande latérale de 96 px avec nom vertical (writing-mode), contenu à droite en trois colonnes très aérées.
- **Références** : R28, R36, P1
- **Geste fort** : *bandeau-vertical* — Le nom de la maison est écrit à la verticale dans une bande étroite à gauche, comme la signature gravée sur un bracelet.
- **Structure** : `R1[bande gauche nom vertical ; 3 colonnes] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom vertical > 2 colonnes > 3 légal
- **Logo** : Nom écrit à la verticale (writing-mode) dans une bande latérale.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : noir) : fond `#0C0C0D` · texte `#F1EEE6` · texte discret `#A9A59C` · accent `#B8C2CC` · surface `#18181A`
  - Contrastes calculés : texte/fond 16.9:1, discret/fond 8.0:1, texte/surface 15.3:1, accent 10.8:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Cormorant Garamond ; liens et texte courant : Manrope.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0C0C0D, surface #18181A.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Texte vertical, filets d'acier.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 2 colonne(s) : Une bande verticale latérale porte la marque ou un signe, le contenu est à côté. Disposition : R1[bande gauche nom vertical ; 3 colonnes] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Bande passe en horizontale au-dessus. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : writing-mode : lisible à l'envers de tête, prévoir aria.

<a id="c-031-grand-club-lettre"></a>
### c-031-grand-club-lettre · Grand Club Lettre

- **Secteur cible** : marque de lettre d'info (famille : E-commerce, mode et luxe)
- **Composition** : `formulaire-integre` — Un formulaire (e-mail, recherche, candidature) est le geste principal du pied.
- **Direction artistique** : Marque de thé fictive « Feuille du Dimanche ». Pêche, brun profond. La lettre est la vraie action, le champ est le héros. Consentement clair sous le champ.
- **Références** : R13, R19, P10
- **Geste fort** : *champ-geant* — Le champ e-mail occupe toute la largeur, en 64 px, sans cadre, avec une ligne de base épaisse.
- **Structure** : `R1[invitation ; champ géant] > R2[3 liens ; légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 champ > 2 invitation > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`formulaire-complet`) : Formulaire à plusieurs champs (e-mail, choix) avec consentement explicite.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : bicolore-contraste) : fond `#F2D8C9` · texte `#2A1710` · texte discret `#5B3A2B` · accent `#2A1710` · surface `#FFF4EC`
  - Contrastes calculés : texte/fond 12.6:1, discret/fond 7.4:1, texte/surface 15.8:1, accent 15.8:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Instrument Serif ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F2D8C9, surface #FFF4EC.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Ligne de base 4 px, flèche ➝ en bout.
- **Interactions** : Anneau de focus de 3 px très visible, champ qui s'agrandit au focus ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Un formulaire (e-mail, recherche, candidature) est le geste principal du pied. Disposition : R1[invitation ; champ géant] > R2[3 liens ; légal].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Champ sur deux lignes, bouton en dessous. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `heading`, `emailsubscribe`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Consentement RGPD à garder visible.

<a id="c-032-brocante-annuaire"></a>
### c-032-brocante-annuaire · Brocante Annuaire

- **Secteur cible** : seconde main (famille : E-commerce, mode et luxe)
- **Composition** : `annuaire` — Longues listes classées (pays, villes, rubriques, documents) en colonnes fines.
- **Direction artistique** : Marketplace d'occasion fictive « Revenant ». Papier kraft, brun et rouge tampon. Six colonnes de catégories dense. Tampon circulaire en SVG avec texte sur courbe.
- **Références** : R7, R10, P12
- **Geste fort** : *tampon-rotatif* — Un tampon rond de texte en cercle (« Seconde vie · Seconde main ») tourne lentement à côté du logo.
- **Structure** : `R1[logo+tampon ; newsletter] > R2[annuaire 6 colonnes] > R3[légal]`
- **Colonnes** : 6 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 catégories > 2 tampon > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : beige-sable) : fond `#EBDFC9` · texte `#2B2218` · texte discret `#5A4B37` · accent `#B3412E` · surface `#F6EEDD`
  - Contrastes calculés : texte/fond 11.8:1, discret/fond 6.4:1, texte/surface 13.5:1, accent 4.9:1 (AA : conforme)
- **Typographies** (slab) : Titre et grande échelle : Zilla Slab ; liens et texte courant : Karla.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #EBDFC9, surface #F6EEDD.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Tampon textpath, rotation 40 s, motif papier.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 6 colonne(s) : Longues listes classées (pays, villes, rubriques, documents) en colonnes fines. Disposition : R1[logo+tampon ; newsletter] > R2[annuaire 6 colonnes] > R3[légal].
  - 820 : 3 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Catégories en grille de deux colonnes, tampon figé. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `textpath`, `shopcategories`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Rotation arrêtée en mouvement réduit.

## Famille : Médias et éditorial

<a id="c-033-journal-triple-filet"></a>
### c-033-journal-triple-filet · Journal Triple Filet

- **Secteur cible** : journal numérique (famille : Médias et éditorial)
- **Composition** : `5-6col-mega` — Méga-pied de cinq à sept colonnes de liens, pour les sites très riches.
- **Direction artistique** : Quotidien numérique fictif « La Gazette du Port ». Papier chaud, noir encre, un rouge d'édition. Six colonnes de rubriques et d'articles récents, la lettre du matin en champ souligné. Tradition de presse, structure très lisible.
- **Références** : R10, R29, P8, P12
- **Geste fort** : *filet-epais* — Le titre du journal est centré entre un triple filet (épais, fin, fin) comme la une d'un quotidien papier.
- **Structure** : `R1[titre + triple filet] > R2[rubriques x5 ; derniers articles] > R3[abonnement ; légal]`
- **Colonnes** : 7 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 titre du journal > 2 rubriques > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`annuaire-dense`) : Annuaire de listes fines (13 à 14 px) en plusieurs colonnes.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : blanc-casse) : fond `#FAF8F3` · texte `#141414` · texte discret `#55524B` · accent `#B3261E` · surface `#ECE8DD`
  - Contrastes calculés : texte/fond 17.4:1, discret/fond 7.3:1, texte/surface 15.1:1, accent 6.2:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Playfair Display ; liens et texte courant : Source Serif 4.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FAF8F3, surface #ECE8DD.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Triple filet 4/1/1 px, date en petites capitales.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 7 colonne(s) : Méga-pied de cinq à sept colonnes de liens, pour les sites très riches. Disposition : R1[titre + triple filet] > R2[rubriques x5 ; derniers articles] > R3[abonnement ; légal].
  - 820 : 3 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Rubriques en accordéon, derniers articles sous le titre. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `querylist`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Liste d'articles dynamique : prévoir le cas « aucun article ».

<a id="c-034-mode-en-capitales"></a>
### c-034-mode-en-capitales · Mode en Capitales

- **Secteur cible** : magazine de mode (famille : Médias et éditorial)
- **Composition** : `marque-monumentale` — Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté.
- **Direction artistique** : Magazine de mode fictif « MODE ». Noir et blanc pur. Le titre monumental est l'unique décor ; liens à 12 px en capitales espacées au-dessus. Contraste d'échelle maximal (P5).
- **Références** : R29, R44, R36, P1, P5
- **Geste fort** : *logo-monumental* — Le titre du magazine en capitales didone de 26 vw, blanc sur noir, occupe toute la largeur et toute la hauteur du bas du pied.
- **Structure** : `R1[liens ; abonnement ; réseaux] > R2[titre monumental]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 titre géant > 2 abonnement > 3 liens
- **Logo** : Nom ou logo monumental (clamp, 14 à 34 vw), rogné ou pleine largeur.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : noir) : fond `#000000` · texte `#FFFFFF` · texte discret `#BDBDBD` · accent `#FFFFFF` · surface `#111111`
  - Contrastes calculés : texte/fond 21.0:1, discret/fond 11.2:1, texte/surface 18.9:1, accent 21.0:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Playfair Display ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #000000, surface #111111.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Capitales didone avec empattements fins, filet blanc 1 px.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 3 colonne(s) : Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté. Disposition : R1[liens ; abonnement ; réseaux] > R2[titre monumental].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Titre sur toute la largeur en 20 vw, liens en pile. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Les empattements très fins demandent une taille ≥ 14 vw pour rester nets.

<a id="c-035-carnet-de-marges"></a>
### c-035-carnet-de-marges · Carnet de Marges

- **Secteur cible** : blog personnel (famille : Médias et éditorial)
- **Composition** : `editorial-colonne` — Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes.
- **Direction artistique** : Blog personnel fictif « Carnet de Salomé ». Papier beige, encre brune, rouille. Colonne de lecture étroite de 560 px, marge à droite pour la citation. Chaleureux et humain.
- **Références** : R44, R21, P8
- **Geste fort** : *citation-marge* — Une citation de l'auteur en italique occupe la marge droite, comme une note griffonnée à côté du texte.
- **Structure** : `R1[colonne texte 7/12 ; marge citation 3/12] > R2[copyright]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 phrase d'au revoir > 2 abonnement > 3 citation
- **Logo** : Logo petit, en signature au bas du pied, après le contenu.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : beige-sable) : fond `#F1E8D6` · texte `#2B241B` · texte discret `#64584A` · accent `#9A4F1D` · surface `#E6DAC1`
  - Contrastes calculés : texte/fond 12.6:1, discret/fond 5.7:1, texte/surface 11.1:1, accent 4.9:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Lora ; liens et texte courant : Karla ; accent manuscrit ou décoratif : Caveat (jamais pour de l'information).
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #F1E8D6, surface #E6DAC1.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Texture papier légère, guillemets décoratifs.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes. Disposition : R1[colonne texte 7/12 ; marge citation 3/12] > R2[copyright].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Citation sous le texte, une seule colonne. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `quote`, `menu`, `emailsubscribe`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Texture papier en CSS pur (pas d'image).

<a id="c-036-revue-sommaire"></a>
### c-036-revue-sommaire · Revue Sommaire

- **Secteur cible** : revue de longue lecture (famille : Médias et éditorial)
- **Composition** : `navigation-verticale` — La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur.
- **Direction artistique** : Revue fictive « Longue Vue ». Brun sombre, papier, orange pâle. Sommaire à pointillés, derniers numéros en liste, abonnement en carte.
- **Références** : R44, R10, P8
- **Geste fort** : *index-chiffre* — Les rubriques sont présentées comme un sommaire de revue : numéro de page, titre, filet pointillé.
- **Structure** : `R1[sommaire vertical (rubrique ; page) ; derniers numéros ; carte abonnement] > R2[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 sommaire > 2 abonnement > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-chaud) : fond `#2C1B18` · texte `#F1E5D8` · texte discret `#CDB9A6` · accent `#E8A87C` · surface `#3B2622`
  - Contrastes calculés : texte/fond 13.3:1, discret/fond 8.7:1, texte/surface 11.4:1, accent 8.1:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Libre Caslon Text ; liens et texte courant : Hanken Grotesk.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #2C1B18, surface #3B2622.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Pointillés, numéros en chiffres elzéviriens.
- **Interactions** : Survol et focus : une flèche ↗ glisse de 4 px à côté du lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur. Disposition : R1[sommaire vertical (rubrique ; page) ; derniers numéros ; carte abonnement] > R2[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Sommaire en accordéon unique, numéros de page conservés. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `querylist`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Pointillés : décoratifs (aria-hidden).

<a id="c-037-barres-de-son"></a>
### c-037-barres-de-son · Barres de Son

- **Secteur cible** : radio et podcast (famille : Médias et éditorial)
- **Composition** : `frise` — Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens.
- **Direction artistique** : Podcast fictif « Onde Courte ». Corail vif, noir profond. Les barres bougent seulement hors mouvement réduit. Les plateformes d'écoute sont des pastilles texte.
- **Références** : R3, R37, P12
- **Geste fort** : *barres-son* — Une frise des cinq derniers épisodes, chacun avec une mini-forme d'onde faite de barres CSS qui oscillent doucement.
- **Structure** : `R1[frise 5 épisodes] > R2[plateformes ; abonnement] > R3[légal]`
- **Colonnes** : 5 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 épisodes > 2 plateformes > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : vif-sature) : fond `#FF4F3A` · texte `#140806` · texte discret `#3B1510` · accent `#140806` · surface `#FFB3A6`
  - Contrastes calculés : texte/fond 6.0:1, discret/fond 4.9:1, texte/surface 11.5:1, accent 11.5:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Syne ; liens et texte courant : Albert Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FF4F3A, surface #FFB3A6.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Barres 4 px animées en décalé, bordures noires.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. Disposition : R1[frise 5 épisodes] > R2[plateformes ; abonnement] > R3[légal].
  - 820 : 3 colonne(s). La rangée défilante montre 3 éléments à la fois. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments en rangée défilent horizontalement avec accroche (scroll-snap), un élément et demi visible. Frise en défilement horizontal avec accroche, 1,2 carte visible. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `querylist`, `motionbars`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Animations d'onde : arrêt par mouvement réduit.

<a id="c-038-presse-regionale"></a>
### c-038-presse-regionale · Presse Régionale

- **Secteur cible** : presse locale (famille : Médias et éditorial)
- **Composition** : `4col` — Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre.
- **Direction artistique** : Quotidien régional fictif « Le Courrier du Val ». Blanc, noir, rouge franc. Quatre colonnes (communes, sports, économie, services) sous une bande rouge d'abonnement.
- **Références** : R10, R29, P6
- **Geste fort** : *cta-bande* — Une large bande rouge d'abonnement coupe le pied en deux, avec le prix à saisir par le client.
- **Structure** : `R1[4 colonnes communes ; sports ; éco ; services] > R2[bande rouge abonnement] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bande d'abonnement > 2 rubriques > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`annuaire-dense`) : Annuaire de listes fines (13 à 14 px) en plusieurs colonnes.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`bande-pleine`) : Bande pleine largeur dédiée à l'abonnement.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : bicolore-contraste) : fond `#FFFFFF` · texte `#171717` · texte discret `#505050` · accent `#C8102E` · surface `#F2F2F2`
  - Contrastes calculés : texte/fond 17.9:1, discret/fond 8.1:1, texte/surface 16.0:1, accent 5.9:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Oswald ; liens et texte courant : Source Sans 3.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #FFFFFF, surface #F2F2F2.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Bande 96 px, titres en Oswald majuscules.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre. Disposition : R1[4 colonnes communes ; sports ; éco ; services] > R2[bande rouge abonnement] > R3[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Bande en tête de pied, colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `querylist`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Prix d'abonnement : saisi par le client.

<a id="c-039-reportage-legende"></a>
### c-039-reportage-legende · Reportage Légendé

- **Secteur cible** : photojournalisme (famille : Médias et éditorial)
- **Composition** : `image-de-fond` — Une image, une illustration ou un motif plein cadre est le fond du pied.
- **Direction artistique** : Agence photo fictive « Foyer ». Noir, blanc, un jaune d'alerte. La photo est choisie par le client, la légende est un vrai texte (lieu, date, crédit). Voile 60 %.
- **Références** : R24, R29, P12
- **Geste fort** : *legende-photo* — Une photo plein cadre assombrie avec sa légende et son crédit au coin, comme sous un reportage.
- **Structure** : `R1[photo ; légende] > R2[liens ; abonnement] > R3[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 photo > 2 légende > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : noir) : fond `#0A0A0A` · texte `#F5F5F5` · texte discret `#C6C6C6` · accent `#FFD60A` · surface `#171717`
  - Contrastes calculés : texte/fond 18.2:1, discret/fond 11.6:1, texte/surface 16.4:1, accent 14.0:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Archivo ; liens et texte courant : Archivo Narrow.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Photo fournie par le client, voilée (50 à 70 %) pour garder le contraste ; repli en dégradé si absente. Palette : fond #0A0A0A, surface #171717.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Légende en petites capitales, trait jaune.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Une image, une illustration ou un motif plein cadre est le fond du pied. Disposition : R1[photo ; légende] > R2[liens ; abonnement] > R3[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Photo en hauteur réduite, légende sous la photo. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `image`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Texte sur photo : voile obligatoire pour AA.

<a id="c-040-rubriques-geantes"></a>
### c-040-rubriques-geantes · Rubriques Géantes

- **Secteur cible** : média alternatif (famille : Médias et éditorial)
- **Composition** : `navigation-verticale` — La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur.
- **Direction artistique** : Média indépendant fictif « Fronde ». Noir et blanc brut. Cinq à sept rubriques en très grand, chacune avec une flèche. Aucune autre décoration.
- **Références** : R19, R16, P2
- **Geste fort** : *nav-geante* — Chaque rubrique est une ligne de 9 vw, noir sur blanc, qui s'inverse au survol : un pied de page qui est une table des matières.
- **Structure** : `R1[liste verticale 6 rubriques] > R2[réseaux ; légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 rubriques > 2 réseaux > 3 légal
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`liste-geante`) : Liste verticale de grandes lignes (9 vw maximum), une rubrique par ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : noir) : fond `#FFFFFF` · texte `#000000` · texte discret `#3D3D3D` · accent `#000000` · surface `#F2F2F2`
  - Contrastes calculés : texte/fond 21.0:1, discret/fond 10.9:1, texte/surface 18.8:1, accent 21.0:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Archivo Black ; liens et texte courant : Archivo.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FFFFFF, surface #F2F2F2.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Filets noirs 2 px, flèches ↗ à droite.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur. Disposition : R1[liste verticale 6 rubriques] > R2[réseaux ; légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Taille 14 vw, rubriques sur toute la largeur. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Cibles ≥ 44 px garanties par la taille.

## Famille : Agences, portfolios et art

<a id="c-041-bonjour-ecrit"></a>
### c-041-bonjour-ecrit · Bonjour Écrit

- **Secteur cible** : agence créative (famille : Agences, portfolios et art)
- **Composition** : `phrase-geante` — Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens.
- **Direction artistique** : Agence créative fictive « Bonsoir ». Vermillon, noir chaud. L'e-mail en géant remplace tout bloc de contact. Tout le reste est minuscule.
- **Références** : R16, R19, P2, P5
- **Geste fort** : *email-geant* — L'adresse e-mail de l'agence écrite en 8 vw avec une flèche ↗, comme seul appel du pied.
- **Structure** : `R1[phrase + e-mail géant] > R2[liens ; réseaux ; légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 e-mail > 2 phrase > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`email-geant`) : L'adresse e-mail est affichée en très grand corps, comme un appel.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : beige-sable) : fond `#EFE5D3` · texte `#150A06` · texte discret `#4A3A30` · accent `#D93A1D` · surface `#F8F0E0`
  - Contrastes calculés : texte/fond 15.6:1, discret/fond 8.7:1, texte/surface 17.2:1, accent 4.0:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Bricolage Grotesque ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #EFE5D3, surface #F8F0E0.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Flèche ↗ qui glisse au survol, trait épais.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens. Disposition : R1[phrase + e-mail géant] > R2[liens ; réseaux ; légal].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. E-mail sur deux lignes, liens en pile. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `bizemail`, `heading`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : E-mail en dynamique : repli si non renseigné.

<a id="c-042-nom-rogne-rouge"></a>
### c-042-nom-rogne-rouge · Nom Rogné Rouge

- **Secteur cible** : studio de branding (famille : Agences, portfolios et art)
- **Composition** : `asymetrique` — Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information).
- **Direction artistique** : Studio fictif « Lueur ». Crème et bleu cobalt, deux couleurs seulement. Nom à 34 vw rogné par overflow hidden. Les informations sont minuscules au-dessus.
- **Références** : R36, R01, P1, P5
- **Geste fort** : *logo-monumental* — Le nom du studio, si grand que la première lettre sort du cadre à gauche et que le bas des lettres est rogné.
- **Structure** : `R1[nom monumental rogné 8/12 ; colonne contact et liens 4/12] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom > 2 contact > 3 liens
- **Logo** : Nom ou logo monumental (clamp, 14 à 34 vw), rogné ou pleine largeur.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : bicolore-contraste) : fond `#ECE6D6` · texte `#1B34E0` · texte discret `#3D4FD1` · accent `#1B34E0` · surface `#DDD5C0`
  - Contrastes calculés : texte/fond 6.5:1, discret/fond 5.2:1, texte/surface 5.5:1, accent 6.5:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Dela Gothic One ; liens et texte courant : Inter.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #ECE6D6, surface #DDD5C0.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Rognage en bas et à gauche, grille 12 colonnes visible en filets.
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). Disposition : R1[nom monumental rogné 8/12 ; colonne contact et liens 4/12] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Nom sur toute la largeur, rogné en bas. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Le rognage ne doit masquer aucune information utile.

<a id="c-043-nom-et-heure"></a>
### c-043-nom-et-heure · Nom et Heure

- **Secteur cible** : portfolio de développeur (famille : Agences, portfolios et art)
- **Composition** : `ligne-unique` — Une seule ligne de 56 à 80 px de haut.
- **Direction artistique** : Portfolio fictif de développeur. Anthracite et orange. L'heure se met à jour chaque seconde (petit script). Un seul geste : la ligne vivante (R18, R21, P11).
- **Références** : R18, R21, P11, P17
- **Geste fort** : *horloge-direct* — Une seule ligne mono : nom, heure locale en direct, disponibilité, e-mail.
- **Structure** : `R1[nom ; heure ; disponibilité ; e-mail]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 heure > 2 e-mail > 3 nom
- **Logo** : Logo placé à droite, en fin de ligne ou de bloc.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#161616` · texte `#F2F0EA` · texte discret `#A9A7A0` · accent `#FF7A2F` · surface `#222222`
  - Contrastes calculés : texte/fond 15.9:1, discret/fond 7.5:1, texte/surface 14.0:1, accent 7.0:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Martian Mono ; liens et texte courant : DM Sans.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #161616, surface #222222.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Pastille de disponibilité, séparateurs ·.
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Une seule ligne de 56 à 80 px de haut. Disposition : R1[nom ; heure ; disponibilité ; e-mail].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Ligne passe sur 3 lignes, heure en premier. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `bizemail`, `social`, `copyright` ; nouveaux : **`*horloge-locale`**
- **Risques techniques** : Heure : nouveau widget avec petit script ; repli sans script.

<a id="c-044-planche-contact"></a>
### c-044-planche-contact · Planche Contact

- **Secteur cible** : photographe (famille : Agences, portfolios et art)
- **Composition** : `modulaire-bento` — Mosaïque de tuiles de tailles différentes, chacune avec une fonction.
- **Direction artistique** : Photographe fictif. Noir et blanc, mono pour les numéros. Les six miniatures viennent du client, repli en rectangles gris. Le survol inverse la case.
- **Références** : R24, R04, P5
- **Geste fort** : *planche-contact* — Une planche contact de six miniatures noir et blanc numérotées 01 à 06 comme un film développé, liant vers les séries.
- **Structure** : `R1[planche 6 cases ; colonne contact]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 planche > 2 contact > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : noir) : fond `#101010` · texte `#F0F0F0` · texte discret `#B0B0B0` · accent `#E5E5E5` · surface `#1C1C1C`
  - Contrastes calculés : texte/fond 16.7:1, discret/fond 8.8:1, texte/surface 14.9:1, accent 15.1:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Hanken Grotesk ; liens et texte courant : IBM Plex Mono.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #101010, surface #1C1C1C.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Numéros 01-06, cadres à bordure fine blanche.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Mosaïque de tuiles de tailles différentes, chacune avec une fonction. Disposition : R1[planche 6 cases ; colonne contact].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Planche 3x2 puis 2x3, contact en dessous. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `gallery`, `menu`, `bizemail`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Dépend d'images fournies ; repli prévu.

<a id="c-045-cartel-de-musee"></a>
### c-045-cartel-de-musee · Cartel de Musée

- **Secteur cible** : galerie d'art (famille : Agences, portfolios et art)
- **Composition** : `cadre-passe-partout` — Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte.
- **Direction artistique** : Galerie fictive « Espace Quatre ». Gris de mur de galerie, un rouge pastille « vernissage ». Cartel à bordure 1 px, texte en deux tailles. Un pied muséal.
- **Références** : R33, R24, P8, P12
- **Geste fort** : *cartel-etiquette* — Les informations sont présentées dans un petit cartel blanc à bordure fine, comme l'étiquette d'une oeuvre : artiste, titre, année, lieu.
- **Structure** : `R1[cartel adresse ; cartel horaires ; liens]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 cartel > 2 horaires > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`aucun`) : Pas de réseaux sociaux.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : blanc-casse) : fond `#F4F4F2` · texte `#1A1A1A` · texte discret `#666666` · accent `#C0392B` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 15.8:1, discret/fond 5.2:1, texte/surface 17.4:1, accent 5.4:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Libre Franklin ; liens et texte courant : Libre Baskerville.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F4F4F2, surface #FFFFFF.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Cartel 280 px, petit rond rouge, passe-partout 24 px.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte. Disposition : R1[cartel adresse ; cartel horaires ; liens].
  - 820 : 2 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Cartels empilés. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `text`, `bizcontact`, `bizhours`, `menu`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Faible contraste du gris de mur contrôlé (tx2).

<a id="c-046-neon-en-mouvement"></a>
### c-046-neon-en-mouvement · Néon en Mouvement

- **Secteur cible** : motion designer (famille : Agences, portfolios et art)
- **Composition** : `immersif` — Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible.
- **Direction artistique** : Motion designer fictif. Violet nuit, rose néon. Contours (-webkit-text-stroke) et tracé animé SVG, statique en mouvement réduit. Un seul effet.
- **Références** : R37, R15, P17
- **Geste fort** : *trait-anime* — Le nom s'écrit en lettres vides (contour) dont le tracé se dessine à l'apparition, comme un tube de néon.
- **Structure** : `R1[nom contour animé] > R2[liens ; e-mail ; réseaux]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom animé > 2 e-mail > 3 liens
- **Logo** : Nom ou logo monumental (clamp, 14 à 34 vw), rogné ou pleine largeur.
- **Menus** (`liste-geante`) : Liste verticale de grandes lignes (9 vw maximum), une rubrique par ligne.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : neon-sombre) : fond `#0A0612` · texte `#FFFFFF` · texte discret `#C9C0DD` · accent `#FF2E93` · surface `#150C24`
  - Contrastes calculés : texte/fond 20.0:1, discret/fond 11.5:1, texte/surface 18.9:1, accent 5.8:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Unbounded ; liens et texte courant : Space Grotesk.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0A0612, surface #150C24.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : Texte contour 2 px rose, halo léger.
- **Interactions** : Tracé SVG qui se dessine à l'apparition ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Tracé SVG qui se dessine à l'apparition ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : le tracé est affiché d'emblée, sans animation.
- **Responsive**
  - 1280 : 3 colonne(s) : Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible. Disposition : R1[nom contour animé] > R2[liens ; e-mail ; réseaux].
  - 820 : 2 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Nom moins large, liens en menu compact. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `animatedheading`, `motionsvgdraw`, `menu`, `social`, `bizemail`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Le tracé repose sur des widgets Motion Studio ; non essentiels.

<a id="c-047-gouache-et-feuilles"></a>
### c-047-gouache-et-feuilles · Gouache et Feuilles

- **Secteur cible** : illustratrice (famille : Agences, portfolios et art)
- **Composition** : `image-de-fond` — Une image, une illustration ou un motif plein cadre est le fond du pied.
- **Direction artistique** : Illustratrice fictive. Fond crème rosé, rose brique, texte brun. Illustrations SVG vectorielles intégrées au pied (pas d'image lourde).
- **Références** : R13, R21, P12
- **Geste fort** : *illustration-svg* — Des feuilles et des fleurs dessinées en SVG, à l'allure de gouache, encadrent le centre de l'écran.
- **Structure** : `R1[illustration] > R2[nom ; 3 liens ; réseaux] > R3[copyright]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 illustration > 2 nom > 3 liens
- **Logo** : Logo petit, en signature au bas du pied, après le contenu.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : pastel) : fond `#FDF1E4` · texte `#3B2A2A` · texte discret `#6B5050` · accent `#C85555` · surface `#F7DFC8`
  - Contrastes calculés : texte/fond 12.2:1, discret/fond 6.5:1, texte/surface 10.5:1, accent 3.9:1 (AA : conforme)
- **Typographies** (script-accent) : Titre et grande échelle : Gloock ; liens et texte courant : Nunito ; accent manuscrit ou décoratif : Reenie Beanie (jamais pour de l'information).
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #FDF1E4, surface #F7DFC8.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : SVG de feuillage en deux couches, pastilles fleurs.
- **Interactions** : Survol et focus : changement de couleur de texte vers l'accent (si contraste ≥ 4,5:1). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Une image, une illustration ou un motif plein cadre est le fond du pied. Disposition : R1[illustration] > R2[nom ; 3 liens ; réseaux] > R3[copyright].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). SVG réduit et recentré. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `image`, `menu`, `social`, `bizemail`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Illustrations à fournir ou à dessiner : coût de création.

<a id="c-048-grille-brutale"></a>
### c-048-grille-brutale · Grille Brutale

- **Secteur cible** : collectif expérimental (famille : Agences, portfolios et art)
- **Composition** : `navigation-horizontale-compacte` — Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs.
- **Direction artistique** : Collectif d'art fictif « Pli ». Vert acide, noir, rouge alerte. Bordures épaisses, mono, texte brut. Très reconnaissable.
- **Références** : R38, R37, P12
- **Geste fort** : *ombre-dure* — Une grille de cases à bordures noires de 3 px, dont chaque case contient un lien, comme un tableau HTML assumé.
- **Structure** : `R1[grille 4x3 de cases liens] > R2[copyright]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 grille > 2 contact > 3 copyright
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`grille-labels`) : Grille de libellés de réseaux, façon étiquettes.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : vif-sature) : fond `#C8FF00` · texte `#000000` · texte discret `#2B2B2B` · accent `#FF2D00` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 17.8:1, discret/fond 12.0:1, texte/surface 21.0:1, accent 3.7:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Space Mono ; liens et texte courant : Work Sans.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #C8FF00, surface #FFFFFF.
- **Formes** (brutaliste) : Bordures noires de 3 px, ombres dures décalées sans flou, rayon 0.
- **Décor, icônes, illustrations** : Bordures 3 px noires, cases qui s'inversent.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs. Disposition : R1[grille 4x3 de cases liens] > R2[copyright].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Grille 2 colonnes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `table`, `menu`, `bizcontact`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Vert acide : texte noir uniquement.

<a id="c-049-index-des-projets"></a>
### c-049-index-des-projets · Index des Projets

- **Secteur cible** : directeur artistique (famille : Agences, portfolios et art)
- **Composition** : `navigation-verticale` — La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur.
- **Direction artistique** : Directeur artistique fictif. Gris pierre, encre noire. Les projets sont liés dynamiquement. La liste est le décor.
- **Références** : R21, R25, P9
- **Geste fort** : *index-chiffre* — La liste des six derniers projets, numérotés, avec année à droite et un fin filet entre chaque ligne.
- **Structure** : `R1[liste projets 01-06] > R2[contact ; réseaux]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 projets > 2 contact > 3 réseaux
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`index-numerote`) : Liste numérotée 01, 02… avec filets, comme un index.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#1A1A1A` · texte `#F2F1ED` · texte discret `#B9B6AD` · accent `#F2F1ED` · surface `#262626`
  - Contrastes calculés : texte/fond 15.4:1, discret/fond 8.6:1, texte/surface 13.4:1, accent 15.4:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Hind ; liens et texte courant : Hind.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #1A1A1A, surface #262626.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filets 1 px, années en colonne droite.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : La navigation est une liste verticale de grandes lignes cliquables, sur toute la largeur. Disposition : R1[liste projets 01-06] > R2[contact ; réseaux].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Liste complète sur toute la largeur. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `querylist`, `menu`, `bizemail`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Liste dynamique : cas vide à prévoir.

<a id="c-050-grain-de-pellicule"></a>
### c-050-grain-de-pellicule · Grain de Pellicule

- **Secteur cible** : vidéaste (famille : Agences, portfolios et art)
- **Composition** : `immersif` — Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible.
- **Direction artistique** : Vidéaste fictif. Noir bordeaux, ambre. Le grain vient d'un dégradé répété et d'un bruit SVG de petite taille (data-URI). Pas de vidéo.
- **Références** : R37, R24, P7
- **Geste fort** : *grain-pellicule* — Un grain de pellicule généré en CSS et un dégradé du noir au bordeaux donnent une ambiance de salle de cinéma.
- **Structure** : `R1[titre ; liens ; contact]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 titre > 2 contact > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-chaud) : fond `#140608` · texte `#F4EDE8` · texte discret `#C9B8B3` · accent `#F2A65A` · surface `#24090E`
  - Contrastes calculés : texte/fond 17.1:1, discret/fond 10.4:1, texte/surface 16.2:1, accent 9.8:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Syne ; liens et texte courant : Manrope.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #140608, surface #24090E.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Grain SVG feTurbulence 4 %, barres de cinéma haut/bas.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 3 colonne(s) : Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible. Disposition : R1[titre ; liens ; contact].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Grain conservé, liens en pile. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizemail`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Grain à désactiver en mode économie.

<a id="c-051-specimen-typographique"></a>
### c-051-specimen-typographique · Spécimen Typographique

- **Secteur cible** : fonderie typographique (famille : Agences, portfolios et art)
- **Composition** : `modulaire-bento` — Mosaïque de tuiles de tailles différentes, chacune avec une fonction.
- **Direction artistique** : Fonderie fictive « Glyphe ». Blanc et bleu électrique. Tuiles : Aa, 123, &, ¶. Chaque tuile mène à une famille de caractères.
- **Références** : R21, R44, P5
- **Geste fort** : *specimen-typo* — Des tuiles montrent une lettre ou un mot dans la police de la fonderie, comme un spécimen de caractères.
- **Structure** : `R1[tuiles spécimen x4] > R2[liens ; contact]`
- **Colonnes** : 6 (desktop) / 3 (tablette) / 2 (mobile)
- **Hiérarchie de lecture** : 1 spécimen > 2 liens > 3 contact
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : blanc-casse) : fond `#FAF9F6` · texte `#111111` · texte discret `#5B5B57` · accent `#3B3BFF` · surface `#EDECE6`
  - Contrastes calculés : texte/fond 17.9:1, discret/fond 6.5:1, texte/surface 15.9:1, accent 6.1:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Instrument Serif ; liens et texte courant : Inter ; accent manuscrit ou décoratif : Syne (jamais pour de l'information).
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #FAF9F6, surface #EDECE6.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Lettre géante 120 px, grille 8 px.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 6 colonne(s) : Mosaïque de tuiles de tailles différentes, chacune avec une fonction. Disposition : R1[tuiles spécimen x4] > R2[liens ; contact].
  - 820 : 3 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 2 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Tuiles 2x2. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `heading`, `menu`, `bizemail`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Polices du client : licence à vérifier.

## Famille : Restauration, hôtellerie et tourisme

<a id="c-052-bistro-ardoise"></a>
### c-052-bistro-ardoise · Bistro Ardoise

- **Secteur cible** : gastronomique (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `2col` — Deux colonnes équilibrées : une pour l'identité ou l'information vivante, l'autre pour la navigation.
- **Direction artistique** : Bistro fictif « Chez Marthe ». Ardoise sombre, craie, un jaune d'oeuf. Deux colonnes : l'ardoise (horaires avec points de conduite) et l'adresse. Texture de craie en CSS (bruit et rayures), cadre bois en bordure brune.
- **Références** : R14, R19, P12
- **Geste fort** : *points-de-conduite* — Les horaires et la carte sont écrits « à la craie » sur une ardoise, avec des points de conduite entre le jour et l'heure, comme sur un menu.
- **Structure** : `R1[ardoise horaires ; adresse+réservation] > R2[réseaux ; légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 ardoise horaires > 2 réservation > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#262B29` · texte `#F3EFE3` · texte discret `#C5C9BE` · accent `#F2C14E` · surface `#2F3532`
  - Contrastes calculés : texte/fond 12.5:1, discret/fond 8.5:1, texte/surface 10.9:1, accent 8.6:1 (AA : conforme)
- **Typographies** (script-accent) : Titre et grande échelle : Caveat Brush ; liens et texte courant : Mulish.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #262B29, surface #2F3532.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Points de conduite en CSS, cadre de bois, traits de craie SVG.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 2 colonne(s) : Deux colonnes équilibrées : une pour l'identité ou l'information vivante, l'autre pour la navigation. Disposition : R1[ardoise horaires ; adresse+réservation] > R2[réseaux ; légal].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Colonnes empilées, ardoise d'abord. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `bizhours`, `bizcontact`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*ouvert-ferme`**
- **Risques techniques** : Police manuscrite : titres seulement, jamais les horaires.

<a id="c-053-palace-annuaire"></a>
### c-053-palace-annuaire · Palace Annuaire

- **Secteur cible** : hôtellerie de luxe (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `annuaire` — Longues listes classées (pays, villes, rubriques, documents) en colonnes fines.
- **Direction artistique** : Groupe hôtelier fictif « Maison Altaïr ». Bleu nuit, ivoire, champagne. Annuaire à cinq colonnes (pays > villes), sélecteur de langue, newsletter discrète. Calme, luxueux.
- **Références** : R28, P4, P15
- **Geste fort** : *annuaire-villes* — Les adresses de l'hôtel et de ses établissements sœurs sont classées par pays et par ville en colonnes très fines, comme un annuaire de maisons.
- **Structure** : `R1[logo centré ; langue] > R2[annuaire 5 colonnes] > R3[newsletter ; réseaux] > R4[légal]`
- **Colonnes** : 5 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 annuaire > 2 newsletter > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`carte-bureaux`) : Liste de plusieurs bureaux ou lieux, une carte par adresse.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-bleu) : fond `#0F1B2D` · texte `#F4EEE2` · texte discret `#B9C0CC` · accent `#D1B27A` · surface `#18273D`
  - Contrastes calculés : texte/fond 15.0:1, discret/fond 9.4:1, texte/surface 13.0:1, accent 8.5:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Marcellus ; liens et texte courant : Lato.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #0F1B2D, surface #18273D.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filets or 1 px, nom en capitales espacées.
- **Interactions** : Survol et focus : une flèche ↗ glisse de 4 px à côté du lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Longues listes classées (pays, villes, rubriques, documents) en colonnes fines. Disposition : R1[logo centré ; langue] > R2[annuaire 5 colonnes] > R3[newsletter ; réseaux] > R4[légal].
  - 820 : 3 colonne(s). Les onglets restent affichés avec leur panneau, en deux colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques deviennent des onglets ; un seul panneau est affiché. Un onglet par pays ; les villes s'affichent dessous. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*liste-adresses`**, **`*selecteur-langue`**
- **Risques techniques** : Liste de plusieurs adresses : nouveau widget.

<a id="c-054-anse-turquoise"></a>
### c-054-anse-turquoise · Anse Turquoise

- **Secteur cible** : resort balnéaire (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `carte-decollee` — Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond.
- **Direction artistique** : Resort fictif « Anse Bleue ». Turquoise profond, sable, corail doré. La carte sable (texte brun) est décollée de 24 px, les mentions sont sur le fond turquoise. Photo du client en option.
- **Références** : R2, R13, P3
- **Geste fort** : *vagues-bord* — Le haut de la carte sable suit une ligne de vagues dessinée en SVG, comme un rivage entre deux eaux.
- **Structure** : `R1[carte sable : logo ; liens ; newsletter] > R2[mentions sur turquoise]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte > 2 newsletter > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : degrade) : fond `#0E7490` · texte `#FFFFFF` · texte discret `#DDF3F8` · accent `#F4C27A` · surface `#F6E7CB`
  - Contrastes calculés : texte/fond 5.4:1, discret/fond 4.7:1, texte/surface 12.9:1, accent 3.3:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Outfit ; liens et texte courant : Urbanist.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Photo fournie par le client, voilée (50 à 70 %) pour garder le contraste ; repli en dégradé si absente. Palette : fond #0E7490, surface #F6E7CB.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Coins 40 px, vagues SVG au bord supérieur.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 2 colonne(s) : Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond. Disposition : R1[carte sable : logo ; liens ; newsletter] > R2[mentions sur turquoise].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Carte à 12 px des bords. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Photo optionnelle ; repli dégradé turquoise.

<a id="c-055-heures-du-four"></a>
### c-055-heures-du-four · Heures du Four

- **Secteur cible** : boulangerie artisanale (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `bandes-superposees` — Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle.
- **Direction artistique** : Boulangerie fictive « Le Fournil de Jeanne ». Croûte, farine, braise. La pastille calcule l'état à partir des vraies horaires (aucun faux message). Texture de farine en CSS.
- **Références** : R86, R14, P11
- **Geste fort** : *statut-ouverture* — Une grande pastille en forme de pain annonce « Ouvert jusqu'à 19 h » ou « Fermé, ouvre demain à 7 h » selon l'heure réelle.
- **Structure** : `R1[pastille état] > R2[horaires ; adresse] > R3[liens ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 état ouvert/fermé > 2 horaires > 3 liens
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : beige-sable) : fond `#F3E3C3` · texte `#3A2412` · texte discret `#6B4A2C` · accent `#B5471B` · surface `#E8D2A6`
  - Contrastes calculés : texte/fond 11.5:1, discret/fond 6.3:1, texte/surface 9.8:1, accent 4.3:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Alegreya ; liens et texte courant : Alegreya Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #F3E3C3, surface #E8D2A6.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Pastille organique SVG, épis de blé.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 3 colonne(s) : Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle. Disposition : R1[pastille état] > R2[horaires ; adresse] > R3[liens ; légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Pastille d'abord, horaires dessous. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `bizhours`, `menu`, `bizcontact`, `social`, `copyright` ; nouveaux : **`*ouvert-ferme`**
- **Risques techniques** : État calculé côté serveur ou script léger ; repli : horaires statiques.

<a id="c-056-carte-du-gite"></a>
### c-056-carte-du-gite · Carte du Gîte

- **Secteur cible** : tourisme rural (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `carte-localisation` — La carte (réelle ou dessinée) du lieu est l'élément principal.
- **Direction artistique** : Gîte fictif « Les Genêts ». Lin, vert mousse, terre cuite. La carte est le geste : on trouve avant de lire. Itinéraire en texte (voiture, train).
- **Références** : R14, R25, P3
- **Geste fort** : *carte-geo* — La carte Google Maps du lieu occupe la moitié du pied, entourée d'un cadre arrondi avec l'itinéraire en trois lignes.
- **Structure** : `R1[carte 6/12 ; adresse+itinéraire 6/12] > R2[liens ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte > 2 adresse > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : terre-naturel) : fond `#E9E2D0` · texte `#2D3A2A` · texte discret `#55624F` · accent `#8C4A2F` · surface `#D9CFB5`
  - Contrastes calculés : texte/fond 9.3:1, discret/fond 5.0:1, texte/surface 7.7:1, accent 5.2:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Crimson Pro ; liens et texte courant : Cabin.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #E9E2D0, surface #D9CFB5.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Cadre 24 px arrondi, marqueur SVG.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : La carte (réelle ou dessinée) du lieu est l'élément principal. Disposition : R1[carte 6/12 ; adresse+itinéraire 6/12] > R2[liens ; légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Carte pleine largeur en 240 px de haut. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `map`, `sitelogo`, `bizcontact`, `bizhours`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Carte tierce : consentement cookies à prévoir.

<a id="c-057-etiquette-de-cave"></a>
### c-057-etiquette-de-cave · Étiquette de Cave

- **Secteur cible** : cave à vins (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `editorial-colonne` — Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes.
- **Direction artistique** : Cave fictive « Clos Saint-Aubin ». Bordeaux profond, ivoire, or. Colonne unique de 420 px. La mention légale d'alcool (« L'abus d'alcool est dangereux ») doit être présente.
- **Références** : R28, R21, P8
- **Geste fort** : *etiquette-bouteille* — Le pied est dessiné comme l'étiquette d'une bouteille : cartouche ovale, millésime en chiffres romains, mention du domaine.
- **Structure** : `R1[cartouche : nom ; devise] > R2[liens ; newsletter] > R3[mentions alcool+légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 cartouche > 2 newsletter > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-chaud) : fond `#3A0F1C` · texte `#F6E9DD` · texte discret `#DCC3B2` · accent `#D9A441` · surface `#4A1727`
  - Contrastes calculés : texte/fond 13.9:1, discret/fond 9.9:1, texte/surface 12.2:1, accent 7.4:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : EB Garamond ; liens et texte courant : Montserrat.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #3A0F1C, surface #4A1727.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Cadre double, cartouche ovale, chiffres romains.
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes. Disposition : R1[cartouche : nom ; devise] > R2[liens ; newsletter] > R3[mentions alcool+légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Cartouche réduit, liens sur deux lignes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `text`, `menu`, `emailsubscribe`, `bizcontact`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Mention de santé publique à conserver.

<a id="c-058-semaine-en-frise"></a>
### c-058-semaine-en-frise · Semaine en Frise

- **Secteur cible** : office de tourisme (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `frise` — Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens.
- **Direction artistique** : Office de tourisme fictif « Pays des Étangs ». Bleu ciel, blanc. Agenda dynamique (événements à venir) ; en son absence, l'espace est masqué.
- **Références** : R41, R14, P11
- **Geste fort** : *calendrier-agenda* — Une frise des sept prochains jours liste les événements à venir, chaque jour dans une petite tuile.
- **Structure** : `R1[frise 7 jours] > R2[liens ; infos] > R3[légal]`
- **Colonnes** : 7 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 agenda > 2 infos pratiques > 3 légal
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : clair-froid) : fond `#E6F4FA` · texte `#0B2A3C` · texte discret `#3C5A6E` · accent `#0077B6` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 13.2:1, discret/fond 6.5:1, texte/surface 14.9:1, accent 4.9:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Albert Sans ; liens et texte courant : Epilogue.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #E6F4FA, surface #FFFFFF.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Tuiles datées avec jour en gros, trait de jour courant.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 7 colonne(s) : Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. Disposition : R1[frise 7 jours] > R2[liens ; infos] > R3[légal].
  - 820 : 3 colonne(s). La rangée défilante montre 3 éléments à la fois. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments en rangée défilent horizontalement avec accroche (scroll-snap), un élément et demi visible. Frise défilante, 1,5 tuile visible. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `querylist`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Dépend d'un flux d'événements ; masqué si vide.

<a id="c-059-commande-en-grand"></a>
### c-059-commande-en-grand · Commande en Grand

- **Secteur cible** : restauration rapide (famille : Restauration, hôtellerie et tourisme)
- **Composition** : `cta-plein` — Une grande zone d'appel à l'action occupe la plus grande part du pied.
- **Direction artistique** : Burger de quartier fictif « Dalle ». Orange et brun noir. Le bouton Commander mène à la vraie page de commande du client. Texte noir sur orange (AA).
- **Références** : R17, R39, P2
- **Geste fort** : *fleche-geante* — Un énorme bouton orange « Commander » avec flèche occupe toute la largeur, sous le numéro de la boutique.
- **Structure** : `R1[bouton géant] > R2[téléphone ; horaires] > R3[liens ; légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bouton > 2 téléphone > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : vif-sature) : fond `#FF7A00` · texte `#1A0E00` · texte discret `#3A2000` · accent `#1A0E00` · surface `#FFB066`
  - Contrastes calculés : texte/fond 7.3:1, discret/fond 5.8:1, texte/surface 10.5:1, accent 10.5:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Bebas Neue ; liens et texte courant : Karla.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FF7A00, surface #FFB066.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Flèche → 56 px, bordure noire 4 px.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Une grande zone d'appel à l'action occupe la plus grande part du pied. Disposition : R1[bouton géant] > R2[téléphone ; horaires] > R3[liens ; légal].
  - 820 : 1 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Bouton plein écran, menu compact. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `cta`, `bizphone`, `bizhours`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Ne pas ajouter de faux délai.

## Famille : Immobilier et architecture

<a id="c-060-votre-agent-local"></a>
### c-060-votre-agent-local · Votre Agent Local

- **Secteur cible** : agence immobilière (famille : Immobilier et architecture)
- **Composition** : `asymetrique` — Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information).
- **Direction artistique** : Agence immobilière fictive « Toit & Moi ». Bleu profond, menthe pour les boutons. L'humain avant le catalogue : la carte de l'agent de quartier remplace le moteur de recherche (R93, R11, P3). Mentions de l'agent à saisir par le client (aucun numéro de carte professionnelle inventé).
- **Références** : R93, R11, P10
- **Geste fort** : *carte-agent* — Une grande carte de profil de l'agent du secteur (photo fournie, nom, ligne directe, horaires, bouton « Écrire à... ») occupe la moitié gauche du pied.
- **Structure** : `R1[carte agent 5/12 ; 2 colonnes de liens 7/12] > R2[mentions de l'agent ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte de l'agent > 2 colonnes de liens > 3 mentions
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-bleu) : fond `#14284B` · texte `#FFFFFF` · texte discret `#BFCBE0` · accent `#4DD0A5` · surface `#1D3664`
  - Contrastes calculés : texte/fond 14.6:1, discret/fond 8.9:1, texte/surface 11.9:1, accent 7.6:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Manrope ; liens et texte courant : Source Sans 3.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #14284B, surface #1D3664.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Photo ronde de 96 px, bulle de message, coins 20 px.
- **Interactions** : Anneau de focus de 3 px très visible, champ qui s'agrandit au focus ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). Disposition : R1[carte agent 5/12 ; 2 colonnes de liens 7/12] > R2[mentions de l'agent ; légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Carte de l'agent en tête, colonnes de liens en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `profilecard`, `sitelogo`, `menu`, `bizcontact`, `bizlegal`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Photo et coordonnées de l'agent à fournir (donnée personnelle, consentement nécessaire).

<a id="c-061-programmes-neufs"></a>
### c-061-programmes-neufs · Programmes Neufs

- **Secteur cible** : promoteur immobilier (famille : Immobilier et architecture)
- **Composition** : `4col` — Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre.
- **Direction artistique** : Promoteur fictif « Maison Brique ». Terre cuite, crème. Quatre cartes pour quatre programmes ; plan dessiné en filigrane. Mentions légales spécifiques à saisir.
- **Références** : R93, R55, P12
- **Geste fort** : *plan-etage* — Un plan d'étage dessiné en lignes fines sert de motif, avec les programmes en cartes comme autant de pièces.
- **Structure** : `R1[4 cartes programmes] > R2[liens ; contact] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 cartes programmes > 2 contact > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`cartes-multiples`) : Plusieurs cartes de contact (service, lieu, urgence).
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : terre-naturel) : fond `#A4472B` · texte `#FFF6EE` · texte discret `#FBE6D8` · accent `#F2B880` · surface `#8F3A22`
  - Contrastes calculés : texte/fond 5.6:1, discret/fond 5.0:1, texte/surface 7.0:1, accent 4.3:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Prata ; liens et texte courant : Figtree.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #A4472B, surface #8F3A22.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Plan SVG filigrane 10 %, angles biseautés.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre. Disposition : R1[4 cartes programmes] > R2[liens ; contact] > R3[légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Cartes en pile, plan simplifié. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `querylist`, `imagebox`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Liste de programmes dynamique ou saisie.

<a id="c-062-cartouche-de-plan"></a>
### c-062-cartouche-de-plan · Cartouche de Plan

- **Secteur cible** : architectural (famille : Immobilier et architecture)
- **Composition** : `colophon` — Le pied est rédigé ou dessiné comme un colophon ou un cartouche (page technique d'un ouvrage ou d'un plan).
- **Direction artistique** : Cabinet d'architectes fictif « Équerre ». Bleu de plan, traits blancs, jaune de cotation. Fond quadrillé, cotes en marge, cartouche à cases.
- **Références** : R25, R55, P12
- **Geste fort** : *cartouche-plan* — Les informations sont inscrites dans un cartouche de plan d'architecte : projet, échelle, date, numéro de plan, dessinateur.
- **Structure** : `R1[cartouche à 8 cases] > R2[copyright]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 cartouche > 2 adresse > 3 réseaux
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#0F3D63` · texte `#E8F2FA` · texte discret `#A9C6DF` · accent `#FFD166` · surface `#164B77`
  - Contrastes calculés : texte/fond 9.9:1, discret/fond 6.3:1, texte/surface 8.0:1, accent 7.8:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Roboto Mono ; liens et texte courant : Roboto Condensed.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #0F3D63, surface #164B77.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Quadrillage, flèches de cote SVG.
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Le pied est rédigé ou dessiné comme un colophon ou un cartouche (page technique d'un ouvrage ou d'un plan). Disposition : R1[cartouche à 8 cases] > R2[copyright].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Cartouche en 2 colonnes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `table`, `menu`, `bizcontact`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Mono dense : taille minimale 13 px.

<a id="c-063-estimation-photo"></a>
### c-063-estimation-photo · Estimation Photo

- **Secteur cible** : immobilier de prestige (famille : Immobilier et architecture)
- **Composition** : `cta-plein` — Une grande zone d'appel à l'action occupe la plus grande part du pied.
- **Direction artistique** : Agence de prestige fictive « Rive Gauche Immobilier ». Beige sable, brun foncé. Photo du client en fond avec voile clair. Mentions de l'agent à saisir.
- **Références** : R93, R28, P2
- **Geste fort** : *photo-plein-cadre* — Une photo d'intérieur plein cadre derrière un grand « Estimer mon bien » et le téléphone de l'agent.
- **Structure** : `R1[photo+titre+CTA] > R2[liens ; mentions]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 titre CTA > 2 téléphone > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : beige-sable) : fond `#EADFCB` · texte `#2A2118` · texte discret `#5F5040` · accent `#2A2118` · surface `#F6EFE0`
  - Contrastes calculés : texte/fond 12.0:1, discret/fond 5.9:1, texte/surface 13.8:1, accent 13.8:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : DM Serif Display ; liens et texte courant : Manrope.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Photo fournie par le client, voilée (50 à 70 %) pour garder le contraste ; repli en dégradé si absente. Palette : fond #EADFCB, surface #F6EFE0.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Voile 70 % clair, filet fin.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 2 colonne(s) : Une grande zone d'appel à l'action occupe la plus grande part du pied. Disposition : R1[photo+titre+CTA] > R2[liens ; mentions].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Photo hauteur réduite. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `cta`, `bizphone`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Photo dépendante du client ; repli aplat.

<a id="c-064-chantier-rayures"></a>
### c-064-chantier-rayures · Chantier Rayures

- **Secteur cible** : BTP (famille : Immobilier et architecture)
- **Composition** : `split-vertical` — Le pied est coupé en deux moitiés nettes, de fonds différents.
- **Direction artistique** : Entreprise de BTP fictive « Ardoise Construction ». Charbon, orange. Rayures CSS à 45°, titres condensés. Urgence : numéro de chantier en grand.
- **Références** : R17, R39, P12
- **Geste fort** : *motif-geometrique* — Une bande verticale de rayures obliques orange et charbon sépare le numéro de chantier (à gauche) des colonnes de liens (à droite), comme un ruban de chantier.
- **Structure** : `R1[numéro de chantier en grand ; bande rayée verticale ; colonnes] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bande rayée > 2 téléphone > 3 colonnes
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#22252A` · texte `#F5F5F2` · texte discret `#C2C6CC` · accent `#FF6A00` · surface `#2E3238`
  - Contrastes calculés : texte/fond 14.1:1, discret/fond 9.0:1, texte/surface 11.8:1, accent 5.3:1 (AA : conforme)
- **Typographies** (slab) : Titre et grande échelle : Roboto Slab ; liens et texte courant : Chivo.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #22252A, surface #2E3238.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Rayures repeating-linear-gradient, angles biseautés.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Le pied est coupé en deux moitiés nettes, de fonds différents. Disposition : R1[numéro de chantier en grand ; bande rayée verticale ; colonnes] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Les rayures deviennent horizontales, numéro d'abord. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizphone`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Rayures décoratives : ne pas passer sous du texte.

<a id="c-065-coliving-arche"></a>
### c-065-coliving-arche · Coliving Arche

- **Secteur cible** : coliving (famille : Immobilier et architecture)
- **Composition** : `cadre-passe-partout` — Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte.
- **Direction artistique** : Coliving fictif « Les Voisins ». Sauge, pêche. L'arche est une forme CSS pure (border-radius 999px 999px 0 0). Doux et accueillant.
- **Références** : R13, R31, P3
- **Geste fort** : *arche* — Le contenu est dans une arche de pierre douce (coins supérieurs arrondis à 50 %) en sauge, sur fond pêche.
- **Structure** : `R1[arche : logo ; pilules ; newsletter] > R2[légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 arche > 2 newsletter > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : pastel) : fond `#E5EFE2` · texte `#2C3A2E` · texte discret `#55675A` · accent `#C0603A` · surface `#FBE3D2`
  - Contrastes calculés : texte/fond 10.2:1, discret/fond 5.1:1, texte/surface 9.7:1, accent 3.6:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Lexend ; liens et texte courant : Literata.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #E5EFE2, surface #FBE3D2.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Arche CSS, soleil en demi-cercle.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 1 colonne(s) : Le contenu est encadré (bordure, passe-partout, arche) comme une oeuvre ou un acte. Disposition : R1[arche : logo ; pilules ; newsletter] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Arche pleine largeur. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Forme pure CSS, aucun risque.

<a id="c-066-jardin-botanique"></a>
### c-066-jardin-botanique · Jardin Botanique

- **Secteur cible** : paysagiste (famille : Immobilier et architecture)
- **Composition** : `4col` — Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre.
- **Direction artistique** : Paysagiste fictif « Verdelot ». Vert profond, ocre. Motif SVG répété (feuilles à faible opacité). Trois colonnes : réalisations, conseils, contact.
- **Références** : R15, R13, P12
- **Geste fort** : *motif-botanique* — Un motif de feuilles de fougère répété en filigrane sur fond vert profond, sans image.
- **Structure** : `R1[3 colonnes sur motif] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 colonnes > 2 contact > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#1F3220` · texte `#EEF0DF` · texte discret `#BCC7A8` · accent `#E0B84F` · surface `#2A422B`
  - Contrastes calculés : texte/fond 11.8:1, discret/fond 7.7:1, texte/surface 9.5:1, accent 7.2:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Spectral ; liens et texte courant : Jost.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #1F3220, surface #2A422B.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : SVG de feuilles à 6 % d'opacité.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 4 colonne(s) : Quatre colonnes de liens ou de cartes, la grille classique, ici toujours accompagnée d'un parti pris propre. Disposition : R1[3 colonnes sur motif] > R2[légal].
  - 820 : 2 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Colonnes en grille de deux, motif conservé. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizcontact`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Motif : texte doit rester AA au-dessus.

## Famille : Éducation et université

<a id="c-067-campus-blason"></a>
### c-067-campus-blason · Campus Blason

- **Secteur cible** : université (famille : Éducation et université)
- **Composition** : `onglets` — Des onglets permettent d'afficher une seule liste de liens à la fois.
- **Direction artistique** : Université fictive « Université du Val-de-Rive ». Bordeaux académique, or. Quatre onglets plutôt que cinq colonnes, sous un blason (R47, R48, R40, P4). Bandeau d'alerte « fraude aux admissions » possible, texte saisi par l'établissement.
- **Références** : R47, R48, R40, P4
- **Geste fort** : *blason-svg* — Un blason dessiné en SVG (livre, tour, laurier) précède quatre onglets (Formations, Recherche, Vie de campus, International) : un seul panneau de liens est visible à la fois.
- **Structure** : `R1[blason ; langue ; accessibilité] > R2[onglets x4 + panneau de 3 colonnes] > R3[adresse ; réseaux] > R4[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 blason > 2 onglets et panneau > 3 légal
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`onglets`) : Onglets qui affichent une rubrique à la fois.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-chaud) : fond `#5B1B2B` · texte `#FFFFFF` · texte discret `#EBCDD3` · accent `#F0C36A` · surface `#6F2438`
  - Contrastes calculés : texte/fond 12.8:1, discret/fond 8.7:1, texte/surface 10.6:1, accent 7.8:1 (AA : conforme)
- **Typographies** (slab) : Titre et grande échelle : Merriweather ; liens et texte courant : Open Sans.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #5B1B2B, surface #6F2438.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Blason SVG 96 px, filets or.
- **Interactions** : Survol et focus : une flèche ↗ glisse de 4 px à côté du lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Des onglets permettent d'afficher une seule liste de liens à la fois. Disposition : R1[blason ; langue ; accessibilité] > R2[onglets x4 + panneau de 3 colonnes] > R3[adresse ; réseaux] > R4[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Les quatre onglets deviennent quatre accordéons ; bandeau d'accessibilité conservé. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `image`, `tabs`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*selecteur-langue`**
- **Risques techniques** : Blason à fournir par l'établissement.

<a id="c-068-ecole-de-code"></a>
### c-068-ecole-de-code · École de Code

- **Secteur cible** : école de programmation (famille : Éducation et université)
- **Composition** : `formulaire-integre` — Un formulaire (e-mail, recherche, candidature) est le geste principal du pied.
- **Direction artistique** : École fictive « Ligne 42 ». Bleu nuit, cyan. Le champ de pré-inscription est stylé en invite de commande ; le consentement est affiché dessous (R23, R94, P7, P10).
- **Références** : R23, R94, P7
- **Geste fort** : *invite-commande* — Le formulaire de pré-inscription est une ligne de commande : « $ candidater --email vous@exemple.fr » avec un bouton Entrée.
- **Structure** : `R1[invite de commande + champ e-mail + bouton] > R2[3 colonnes de liens] > R3[légal ; logo en signature]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 invite de commande > 2 colonnes de liens > 3 légal
- **Logo** : Logo petit, en signature au bas du pied, après le contenu.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`formulaire-complet`) : Formulaire à plusieurs champs (e-mail, choix) avec consentement explicite.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-neutre) : fond `#101418` · texte `#E9F1F5` · texte discret `#A9BCC7` · accent `#5CE1E6` · surface `#1A2128`
  - Contrastes calculés : texte/fond 16.2:1, discret/fond 9.4:1, texte/surface 14.2:1, accent 11.8:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : JetBrains Mono ; liens et texte courant : Figtree.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #101418, surface #1A2128.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : Invite $ clignotante (statique en mouvement réduit), accolades.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Un formulaire (e-mail, recherche, candidature) est le geste principal du pied. Disposition : R1[invite de commande + champ e-mail + bouton] > R2[3 colonnes de liens] > R3[légal ; logo en signature].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Champ pleine largeur, colonnes en pile. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `emailsubscribe`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Champ stylé en terminal : étiquettes et messages d'erreur doivent rester accessibles.

<a id="c-069-journee-d-ecole"></a>
### c-069-journee-d-ecole · Journée d'École

- **Secteur cible** : école primaire (famille : Éducation et université)
- **Composition** : `frise` — Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens.
- **Direction artistique** : École fictive « Les Petits Chênes ». Couleurs de craie, formes rondes ; la journée type (horaires saisis par l'école) rassure les parents avant tout. Le soleil ne bouge qu'hors mouvement réduit (R13, P3).
- **Références** : R13, P3
- **Geste fort** : *journee-type* — Une frise horizontale de la journée d'école (accueil, classe, cantine, sortie) en quatre bulles colorées, avec un petit soleil qui passe d'une bulle à l'autre.
- **Structure** : `R1[frise 4 moments + heures saisies] > R2[pilules : inscrire, cantine ; contact] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 frise de la journée > 2 pilules d'inscription et de cantine > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : beige-sable) : fond `#FFF2CC` · texte `#2B2250` · texte discret `#55497E` · accent `#F45B69` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 13.0:1, discret/fond 7.1:1, texte/surface 14.5:1, accent 3.2:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Andika ; liens et texte courant : Mulish.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #FFF2CC, surface #FFFFFF.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Bulles organiques, soleil SVG, ligne pointillée entre les moments.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 4 colonne(s) : Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. Disposition : R1[frise 4 moments + heures saisies] > R2[pilules : inscrire, cantine ; contact] > R3[légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Frise verticale : les quatre moments s'empilent le long d'une ligne pointillée à gauche. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `timeline`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Cartes colorées : texte sombre uniquement.

<a id="c-070-parcours-formation"></a>
### c-070-parcours-formation · Parcours Formation

- **Secteur cible** : formation professionnelle (famille : Éducation et université)
- **Composition** : `2col` — Deux colonnes équilibrées : une pour l'identité ou l'information vivante, l'autre pour la navigation.
- **Direction artistique** : Organisme fictif « Cap Compétences ». Blanc vert, vert profond. Les trois étapes sont du contenu réel du client ; les mentions de certification sont à saisir.
- **Références** : R94, R48, P12
- **Geste fort** : *parcours-etapes* — Trois étapes en flèches (Candidater → Financer → Démarrer) précèdent la grille de liens.
- **Structure** : `R1[étapes x3] > R2[2 colonnes de liens ; contact] > R3[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 étapes > 2 liens > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : blanc-casse) : fond `#F3F6F4` · texte `#15281F` · texte discret `#475A50` · accent `#0B7A4B` · surface `#E1EAE4`
  - Contrastes calculés : texte/fond 14.2:1, discret/fond 6.8:1, texte/surface 12.6:1, accent 5.0:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Work Sans ; liens et texte courant : Source Serif 4.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F3F6F4, surface #E1EAE4.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Chevrons SVG entre les étapes.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Deux colonnes équilibrées : une pour l'identité ou l'information vivante, l'autre pour la navigation. Disposition : R1[étapes x3] > R2[2 colonnes de liens ; contact] > R3[légal].
  - 820 : 1 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Étapes verticales, colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `iconlist`, `button`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Mentions de certification : champs à saisir.

<a id="c-071-cotes-de-bibliotheque"></a>
### c-071-cotes-de-bibliotheque · Cotes de Bibliothèque

- **Secteur cible** : bibliothèque universitaire (famille : Éducation et université)
- **Composition** : `index-numerote` — Les liens forment un index numéroté, comme une table des matières.
- **Direction artistique** : Bibliothèque fictive « Fonds Lemaire ». Papier, brun, bordeaux. Étiquettes de rayon en CSS. Horaires d'ouverture en direct.
- **Références** : R44, R47, P12
- **Geste fort** : *cote-bibliotheque* — Les liens sont des étiquettes de dos de livre avec une cote (000, 100, 200...) à la façon d'un classement par sujet.
- **Structure** : `R1[index de cotes] > R2[horaires ; adresse] > R3[légal]`
- **Colonnes** : 5 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 index > 2 horaires > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : beige-sable) : fond `#EFE6D2` · texte `#2A2218` · texte discret `#5C4F3C` · accent `#7A2E22` · surface `#E3D6B8`
  - Contrastes calculés : texte/fond 12.6:1, discret/fond 6.4:1, texte/surface 10.9:1, accent 7.5:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Vollkorn ; liens et texte courant : Work Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #EFE6D2, surface #E3D6B8.
- **Formes** (cadre-bordure) : Cadres : bordures de 1 à 3 px, doubles bordures, passe-partout, rayon 0 à 4 px.
- **Décor, icônes, illustrations** : Étiquettes à bords arrondis, pointillés.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Les liens forment un index numéroté, comme une table des matières. Disposition : R1[index de cotes] > R2[horaires ; adresse] > R3[légal].
  - 820 : 3 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Étiquettes de cotes en grille de deux colonnes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizhours`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*ouvert-ferme`**
- **Risques techniques** : Numéros de cote décoratifs.

<a id="c-072-cours-ouverts"></a>
### c-072-cours-ouverts · Cours Ouverts

- **Secteur cible** : plateforme e-learning (famille : Éducation et université)
- **Composition** : `accordeon` — Les rubriques sont des accordéons, y compris sur grand écran.
- **Direction artistique** : Plateforme fictive « Savoirs ». Violet profond vers indigo, jaune de soleil. Quatre accordéons ouverts par défaut. Accessibilité : button et aria-expanded.
- **Références** : R94, R41, P4
- **Geste fort** : *accordeons-ouverts* — Les rubriques sont des accordéons même sur grand écran, tous ouverts par défaut mais repliables, avec un fin chevron.
- **Structure** : `R1[logo ; newsletter] > R2[4 accordéons] > R3[légal]`
- **Colonnes** : 4 (desktop) / 4 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 accordéons > 2 newsletter > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`accordeon`) : Rubriques en accordéons (bouton, aria-expanded), même sur grand écran.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`champ-pilule`) : Champ e-mail en pilule avec bouton rond intégré.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : degrade) : fond `#2D1E7A` · texte `#FFFFFF` · texte discret `#D6D0F5` · accent `#FFC857` · surface `#3D2C96`
  - Contrastes calculés : texte/fond 13.3:1, discret/fond 9.0:1, texte/surface 10.5:1, accent 8.7:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Poppins ; liens et texte courant : Lato.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #2D1E7A, surface #3D2C96.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Chevron animé 200 ms (statique en mouvement réduit).
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Les rubriques sont des accordéons, y compris sur grand écran. Disposition : R1[logo ; newsletter] > R2[4 accordéons] > R3[légal].
  - 820 : 4 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Accordéons fermés par défaut. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `accordion`, `emailsubscribe`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Dégradé sous le texte : contraste mesuré au point le plus clair.

## Famille : Santé et bien-être

<a id="c-073-reperes-de-clinique"></a>
### c-073-reperes-de-clinique · Repères de Clinique

- **Secteur cible** : clinique (famille : Santé et bien-être)
- **Composition** : `annuaire` — Longues listes classées (pays, villes, rubriques, documents) en colonnes fines.
- **Direction artistique** : Clinique fictive « Clinique du Parc ». Vert d'eau et teal. Le pied sert de signalétique : un étage, une couleur, une liste de services (R40, R86, P4). La mention d'urgence reste sobre, aucune promesse de guérison.
- **Références** : R86, R30, P12
- **Geste fort** : *reperes-etages* — Quatre pastilles de couleur, une par étage, guident le visiteur : chaque étage liste ses services, comme les repères d'un hôpital (le numéro est toujours écrit, la couleur ne porte jamais seule l'information).
- **Structure** : `R1[bande accueil et urgence] > R2[annuaire : 4 étages x liste de services] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 repères par étage > 2 bande d'accueil > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`index-numerote`) : Liste numérotée 01, 02… avec filets, comme un index.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : pastel) : fond `#EAF6F5` · texte `#0E2F33` · texte discret `#3F6065` · accent `#0E8C8C` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 12.9:1, discret/fond 6.2:1, texte/surface 14.3:1, accent 4.1:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Be Vietnam Pro ; liens et texte courant : Open Sans.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #EAF6F5, surface #FFFFFF.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Pastilles de 24 px avec numéro d'étage écrit, coins de 16 px.
- **Interactions** : Survol et focus : changement de couleur de texte vers l'accent (si contraste ≥ 4,5:1). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Longues listes classées (pays, villes, rubriques, documents) en colonnes fines. Disposition : R1[bande accueil et urgence] > R2[annuaire : 4 étages x liste de services] > R3[légal].
  - 820 : 2 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Grille 2x2 de grosses pastilles d'étage ; un appui ouvre la liste de services de l'étage. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `bizphone`, `bizhours`, `iconlist`, `menu`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Mentions de santé : à valider par le client.

<a id="c-074-galets-de-spa"></a>
### c-074-galets-de-spa · Galets de Spa

- **Secteur cible** : spa et bien-être (famille : Santé et bien-être)
- **Composition** : `asymetrique` — Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information).
- **Direction artistique** : Spa fictif « Source Basalte ». Sable, terre, brun doux. Les galets sont des cercles CSS. Aucune promesse thérapeutique.
- **Références** : R86, R28, P2
- **Geste fort** : *galets* — À gauche un seul mot géant « Respirer », à droite trois galets ronds de tailles différentes portant horaires, adresse, réservation.
- **Structure** : `R1[mot géant ; 3 galets] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 mot > 2 galets > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : beige-sable) : fond `#E8DCCB` · texte `#3A3027` · texte discret `#6A5D4E` · accent `#8A6F55` · surface `#D8C8B1`
  - Contrastes calculés : texte/fond 9.5:1, discret/fond 4.7:1, texte/surface 7.8:1, accent 3.5:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Italiana ; liens et texte courant : Jost.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #E8DCCB, surface #D8C8B1.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Cercles de 120 à 200 px, ombre très douce.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 2 colonne(s) : Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). Disposition : R1[mot géant ; 3 galets] > R2[légal].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Galets en une rangée, mot réduit. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `heading`, `bizhours`, `bizcontact`, `button`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Cercles : veiller à la zone de clic entière.

<a id="c-075-rendez-vous-bleu"></a>
### c-075-rendez-vous-bleu · Rendez-vous Bleu

- **Secteur cible** : cabinet médical (famille : Santé et bien-être)
- **Composition** : `cta-plein` — Une grande zone d'appel à l'action occupe la plus grande part du pied.
- **Direction artistique** : Cabinet fictif « Dr Lemaire ». Teal et jaune doux. La bande est le seul geste. Pas de faux créneau : la pastille vient d'un vrai agenda ou n'existe pas.
- **Références** : R86, R17, P2
- **Geste fort** : *cta-bande* — Une large bande « Prendre rendez-vous » en jaune sur teal profond, avec pastille « prochain créneau » si le client la relie à son agenda.
- **Structure** : `R1[bande rendez-vous] > R2[horaires ; téléphone] > R3[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 bande > 2 horaires > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : monochrome-couleur) : fond `#0F5F66` · texte `#FFFFFF` · texte discret `#CFEAEC` · accent `#FFD27A` · surface `#14747C`
  - Contrastes calculés : texte/fond 7.4:1, discret/fond 5.8:1, texte/surface 5.5:1, accent 5.2:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Urbanist ; liens et texte courant : Inter.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0F5F66, surface #14747C.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Pilule jaune, pastille créneau optionnelle.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Une grande zone d'appel à l'action occupe la plus grande part du pied. Disposition : R1[bande rendez-vous] > R2[horaires ; téléphone] > R3[légal].
  - 820 : 1 colonne(s). Tous les éléments restent visibles, les moins importants se réduisent. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments secondaires sont retirés au profit de l'essentiel (indiqué ci-dessous). Bande pleine largeur ; seule la ligne des horaires est conservée. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `cta`, `sitelogo`, `bizhours`, `bizphone`, `menu`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Pastille créneau : intégration à voir.

<a id="c-076-croix-de-garde"></a>
### c-076-croix-de-garde · Croix de Garde

- **Secteur cible** : pharmacie (famille : Santé et bien-être)
- **Composition** : `bandeau-lateral` — Une bande verticale latérale porte la marque ou un signe, le contenu est à côté.
- **Direction artistique** : Pharmacie fictive « Pharmacie des Tilleuls ». Vert pharmacie, noir vert. Aucun numéro officiel inventé : le lien ou numéro de garde est saisi par le client.
- **Références** : R86, P11
- **Geste fort** : *statut-ouverture* — Une bande verte latérale porte une grande croix et une pastille « Ouvert maintenant » ou « Fermé, ouvre demain à 8 h 30 » calculée à partir des vraies horaires ; pour la garde, un lien vers le service officiel que le client renseigne.
- **Structure** : `R1[bande verte croix ; 3 colonnes] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 croix et état > 2 horaires > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : vif-sature) : fond `#12B76A` · texte `#06210F` · texte discret `#0D3B1F` · accent `#06210F` · surface `#3CCB85`
  - Contrastes calculés : texte/fond 6.5:1, discret/fond 4.8:1, texte/surface 8.2:1, accent 8.2:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : M PLUS Rounded 1c ; liens et texte courant : Noto Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #12B76A, surface #3CCB85.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Croix CSS (deux barres), pastille d'état.
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Une bande verticale latérale porte la marque ou un signe, le contenu est à côté. Disposition : R1[bande verte croix ; 3 colonnes] > R2[légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Bande en haut, horizontale. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `bizhours`, `bizcontact`, `menu`, `bizlegal`, `copyright` ; nouveaux : **`*ouvert-ferme`**
- **Risques techniques** : Lien de garde : à fournir par le client.

<a id="c-077-cercle-de-souffle"></a>
### c-077-cercle-de-souffle · Cercle de Souffle

- **Secteur cible** : yoga (famille : Santé et bien-être)
- **Composition** : `centre-pile` — Pile centrée d'éléments (marque, liens, mentions), symétrique.
- **Direction artistique** : Studio de yoga fictif « Souffle ». Vert d'eau et menthe, un seul cercle qui respire. Trois liens et une ligne, tout le reste est du vide (R86, R13).
- **Références** : R86, R13
- **Geste fort** : *cercle-respirant* — Un cercle doux grossit et rétrécit très lentement (8 secondes) pour accompagner la respiration ; il s'arrête en mouvement réduit.
- **Structure** : `R1[cercle ; 3 liens] > R2[légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 cercle > 2 liens > 3 légal
- **Logo** : Logo petit, en signature au bas du pied, après le contenu.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#DDEEEA` · texte `#1D3B38` · texte discret `#4B6B66` · accent `#2F7F76` · surface `#F0F8F5`
  - Contrastes calculés : texte/fond 10.1:1, discret/fond 4.9:1, texte/surface 11.2:1, accent 4.4:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Comfortaa ; liens et texte courant : Nunito Sans.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #DDEEEA, surface #F0F8F5.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Cercle dégradé, animation 8 s ease-in-out.
- **Interactions** : Un élément décoratif respire (échelle 1 à 1,12 en 8 s) ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Un élément décoratif respire (échelle 1 à 1,12 en 8 s) ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : le cercle reste fixe.
- **Responsive**
  - 1280 : 1 colonne(s) : Pile centrée d'éléments (marque, liens, mentions), symétrique. Disposition : R1[cercle ; 3 liens] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Cercle plus petit. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `motionanimatedbg`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Animation : arrêt par mouvement réduit.

<a id="c-078-deux-rives"></a>
### c-078-deux-rives · Deux Rives

- **Secteur cible** : association santé mentale (famille : Santé et bien-être)
- **Composition** : `cartes-empilees` — Plusieurs cartes qui se superposent ou se décalent en escalier.
- **Direction artistique** : Association fictive « Deux Rives ». Teal, sable. Aucun numéro d'écoute inventé : le client saisit les numéros officiels. Ton calme.
- **Références** : R30, R15, P6
- **Geste fort** : *bord-ondule* — Deux cartes aux bords ondulés (écoute à gauche, ressources à droite) se chevauchent légèrement, comme deux rives qui se rejoignent.
- **Structure** : `R1[carte teal : message ; carte sable : ressources, chevauchement de 16 px] > R2[légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 message > 2 ressources > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : bicolore-contraste) : fond `#134B4B` · texte `#F7F1E6` · texte discret `#CFE0DA` · accent `#F0B35E` · surface `#E9DCC3`
  - Contrastes calculés : texte/fond 8.8:1, discret/fond 7.2:1, texte/surface 10.8:1, accent 5.3:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Gelasio ; liens et texte courant : Mulish.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #134B4B, surface #E9DCC3.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Bord ondulé SVG entre les cartes (ni texte ni lien sous le chevauchement).
- **Interactions** : Aucune animation ; survol : changement de couleur seulement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : Plusieurs cartes qui se superposent ou se décalent en escalier. Disposition : R1[carte teal : message ; carte sable : ressources, chevauchement de 16 px] > R2[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Cartes empilées sans chevauchement. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `heading`, `bizphone`, `bizcontact`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Numéros d'écoute : à saisir par le client.

## Famille : Culture et événementiel

<a id="c-079-affiche-de-festival"></a>
### c-079-affiche-de-festival · Affiche de Festival

- **Secteur cible** : festival de musique (famille : Culture et événementiel)
- **Composition** : `phrase-geante` — Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens.
- **Direction artistique** : Festival fictif « Plein Phare ». Rose vif, noir, jaune. Noms d'artistes dynamiques (liste). Pas d'urgence factice : billetterie réelle seulement.
- **Références** : R3, R37, P2
- **Geste fort** : *affiche-programme* — La programmation est présentée comme une affiche typographique : noms d'artistes de tailles différentes, séparés par des points ronds.
- **Structure** : `R1[affiche programmation] > R2[billetterie ; newsletter] > R3[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 affiche > 2 billetterie > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`liste-geante`) : Liste verticale de grandes lignes (9 vw maximum), une rubrique par ligne.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`bande-pleine`) : Bande pleine largeur dédiée à l'abonnement.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : vif-sature) : fond `#F72585` · texte `#1A0010` · texte discret `#3D0024` · accent `#1A0010` · surface `#FFE600`
  - Contrastes calculés : texte/fond 5.3:1, discret/fond 4.5:1, texte/surface 15.8:1, accent 15.8:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Rubik Mono One ; liens et texte courant : Work Sans.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F72585, surface #FFE600.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : Tailles variables, bande jaune de billetterie.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens. Disposition : R1[affiche programmation] > R2[billetterie ; newsletter] > R3[légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Noms en 8 vw. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `heading`, `querylist`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Liste dynamique ; sinon texte saisi.

<a id="c-080-rideau-de-scene"></a>
### c-080-rideau-de-scene · Rideau de Scène

- **Secteur cible** : théâtre (famille : Culture et événementiel)
- **Composition** : `frise` — Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens.
- **Direction artistique** : Théâtre fictif « Théâtre de la Rotonde ». Bordeaux, or, ivoire. Plis en dégradés répétés. Frise : prochains spectacles (dynamiques).
- **Références** : R28, R44, P8
- **Geste fort** : *rideau-de-scene* — Des plis verticaux de velours rouge, faits de dégradés CSS, encadrent la frise des spectacles de la saison.
- **Structure** : `R1[rideau ; frise 5 spectacles] > R2[infos ; légal]`
- **Colonnes** : 5 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 frise > 2 billetterie > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-chaud) : fond `#4A0E1A` · texte `#F8EBDD` · texte discret `#E1C6B8` · accent `#E8B04F` · surface `#5D1424`
  - Contrastes calculés : texte/fond 13.1:1, discret/fond 9.5:1, texte/surface 11.3:1, accent 7.9:1 (AA : conforme)
- **Typographies** (serif-contraste) : Titre et grande échelle : Cormorant SC ; liens et texte courant : Raleway.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #4A0E1A, surface #5D1424.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Plis repeating-linear-gradient, cordon or.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 5 colonne(s) : Une frise horizontale (jours, épisodes, spectacles, moments) précède les liens. Disposition : R1[rideau ; frise 5 spectacles] > R2[infos ; légal].
  - 820 : 3 colonne(s). La rangée défilante montre 3 éléments à la fois. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments en rangée défilent horizontalement avec accroche (scroll-snap), un élément et demi visible. Frise défilante. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `querylist`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Dégradé : ne pas passer sous du texte long.

<a id="c-081-numeros-d-inventaire"></a>
### c-081-numeros-d-inventaire · Numéros d'Inventaire

- **Secteur cible** : musée (famille : Culture et événementiel)
- **Composition** : `asymetrique` — Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information).
- **Direction artistique** : Musée fictif « Musée du Port ». Gris pierre, beige. Numéros inventés mais clairement fictifs (non officiels). Liste de liens aérée.
- **Références** : R24, R44
- **Geste fort** : *numero-inventaire* — Des numéros d'inventaire (A.1998.04) en mono fin accompagnent chaque lien comme s'il s'agissait d'une pièce de collection.
- **Structure** : `R1[colonne marque ; liste inventaire] > R2[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 liste > 2 adresse > 3 légal
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#2F2E2B` · texte `#F1EEE6` · texte discret `#C4C0B4` · accent `#D4C5A0` · surface `#3B3A36`
  - Contrastes calculés : texte/fond 11.7:1, discret/fond 7.5:1, texte/surface 9.8:1, accent 8.0:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Gentium Plus ; liens et texte courant : Overpass.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #2F2E2B, surface #3B3A36.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Mono fin 11 px, filets pierre.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Deux zones de poids très inégaux (grande zone d'expression, colonne étroite d'information). Disposition : R1[colonne marque ; liste inventaire] > R2[légal].
  - 820 : 2 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Liste repliée derrière un bouton « Collections ». Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `bizcontact`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Numéros décoratifs, jamais de vraies cotes.

<a id="c-082-sillon-et-label"></a>
### c-082-sillon-et-label · Sillon et Label

- **Secteur cible** : label de disques (famille : Culture et événementiel)
- **Composition** : `centre-pile` — Pile centrée d'éléments (marque, liens, mentions), symétrique.
- **Direction artistique** : Label fictif « Sillon ». Noir bleuté, orange. Le disque (repeating-radial-gradient) tourne en 24 s, arrêt en mouvement réduit. Plateformes d'écoute en pastilles.
- **Références** : R3, R37
- **Geste fort** : *rotation-vinyle* — Un disque vinyle dessiné en CSS (anneaux concentriques) tourne très lentement au centre, étiquette orange.
- **Structure** : `R1[disque] > R2[pastilles plateformes ; newsletter] > R3[légal]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 disque > 2 plateformes > 3 légal
- **Logo** : Nom en filigrane très pâle (opacité 8 à 18 %) derrière le contenu, ne portant aucune information.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-neutre) : fond `#111A1C` · texte `#F3EFE6` · texte discret `#B7C2C0` · accent `#FF8A3D` · surface `#1B2A2D`
  - Contrastes calculés : texte/fond 15.4:1, discret/fond 9.7:1, texte/surface 12.9:1, accent 7.5:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Bowlby One ; liens et texte courant : Hind.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #111A1C, surface #1B2A2D.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Anneaux concentriques CSS, étiquette orange.
- **Interactions** : Un élément décoratif tourne très lentement (24 s) ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Un élément décoratif tourne très lentement (24 s) ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : la rotation est supprimée.
- **Responsive**
  - 1280 : 1 colonne(s) : Pile centrée d'éléments (marque, liens, mentions), symétrique. Disposition : R1[disque] > R2[pastilles plateformes ; newsletter] > R3[légal].
  - 820 : 1 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Disque plus petit, plateformes en grille. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Rotation : arrêt par mouvement réduit.

<a id="c-083-plan-du-salon"></a>
### c-083-plan-du-salon · Plan du Salon

- **Secteur cible** : salon professionnel (famille : Culture et événementiel)
- **Composition** : `tableau-de-bord` — Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux.
- **Direction artistique** : Salon fictif « Expo Atelier ». Blanc bleuté, orange brique. Informations d'accès réelles du client. Aucun compteur à rebours.
- **Références** : R40, R41, P11
- **Geste fort** : *pictogrammes-acces* — Un tableau d'informations pratiques (accès métro, parking, horaires, accessibilité) avec une pictogramme par ligne.
- **Structure** : `R1[tableau infos pratiques] > R2[exposants ; presse ; newsletter] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 infos pratiques > 2 exposants > 3 légal
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`cartes-multiples`) : Plusieurs cartes de contact (service, lieu, urgence).
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : bicolore-contraste) : fond `#111B2E` · texte `#F1F4F8` · texte discret `#B8C2D8` · accent `#FF8A5B` · surface `#1A2742`
  - Contrastes calculés : texte/fond 15.6:1, discret/fond 9.6:1, texte/surface 13.5:1, accent 7.4:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Onest ; liens et texte courant : Onest.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #111B2E, surface #1A2742.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Pictogrammes de ligne 24 px.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. Disposition : R1[tableau infos pratiques] > R2[exposants ; presse ; newsletter] > R3[légal].
  - 820 : 2 colonne(s). Grille à 3 colonnes. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments passent en grille de deux colonnes de cibles égales. Tableau transformé en cartes sur deux colonnes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `table`, `iconlist`, `bizhours`, `bizcontact`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Informations à fournir et tenir à jour.

<a id="c-084-pellicule-et-salles"></a>
### c-084-pellicule-et-salles · Pellicule et Salles

- **Secteur cible** : cinéma d'art et d'essai (famille : Culture et événementiel)
- **Composition** : `bandes-superposees` — Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle.
- **Direction artistique** : Cinéma fictif « Le Studio 9 ». Bleu nuit, or pâle. Perforations en gradient. Séances dynamiques si disponibles.
- **Références** : R37, R24
- **Geste fort** : *perforations-pellicule* — Une bande de pellicule avec ses perforations carrées (CSS) sépare la grille de séances et les liens.
- **Structure** : `R1[séances] > R2[pellicule perforée] > R3[liens ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 séances > 2 pellicule > 3 liens
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : sombre-bleu) : fond `#0C1020` · texte `#F2F0E8` · texte discret `#BDBFC9` · accent `#E8C468` · surface `#161B30`
  - Contrastes calculés : texte/fond 16.6:1, discret/fond 10.3:1, texte/surface 14.9:1, accent 11.3:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : League Gothic ; liens et texte courant : Libre Franklin.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #0C1020, surface #161B30.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : Perforations 12 px, cadres de photogrammes.
- **Interactions** : Défilement lent d'un ruban (40 s la boucle), pause au survol et au focus. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Défilement lent d'un ruban (40 s la boucle), pause au survol et au focus.
  - Mouvement réduit : Sous prefers-reduced-motion : le ruban s'arrête et devient une ligne fixe.
- **Responsive**
  - 1280 : 3 colonne(s) : Plusieurs bandes pleine largeur de fonds différents, empilées, chacune avec un rôle. Disposition : R1[séances] > R2[pellicule perforée] > R3[liens ; légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Pellicule horizontale en défilement. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `querylist`, `bizhours`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Séances : dynamiques ou saisies.

## Famille : Associatif et ONG

<a id="c-085-don-en-un-geste"></a>
### c-085-don-en-un-geste · Don en un Geste

- **Secteur cible** : ONG humanitaire (famille : Associatif et ONG)
- **Composition** : `cta-plein` — Une grande zone d'appel à l'action occupe la plus grande part du pied.
- **Direction artistique** : ONG fictive « Aide Horizon ». Bleu franc, jaune. Montants proposés par le client (modifiables). Mentions fiscales et de transparence à saisir. Aucune statistique inventée.
- **Références** : R30, R48, P6
- **Geste fort** : *don-rapide* — Trois pastilles de montants (10 €, 25 €, 50 €) mènent à la page de don réelle avec le montant pré-rempli.
- **Structure** : `R1[CTA don + pastilles] > R2[3 colonnes] > R3[transparence ; légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 don > 2 colonnes > 3 mentions
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : sombre-bleu) : fond `#0A66C2` · texte `#FFFFFF` · texte discret `#DCEBFA` · accent `#FFD23F` · surface `#0B4F96`
  - Contrastes calculés : texte/fond 5.7:1, discret/fond 4.7:1, texte/surface 8.2:1, accent 5.7:1 (AA : conforme)
- **Typographies** (humaniste) : Titre et grande échelle : Noto Sans ; liens et texte courant : Noto Serif.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #0A66C2, surface #0B4F96.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Pastilles 56 px, coeur SVG.
- **Interactions** : Anneau de focus de 3 px très visible, champ qui s'agrandit au focus ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Une grande zone d'appel à l'action occupe la plus grande part du pied. Disposition : R1[CTA don + pastilles] > R2[3 colonnes] > R3[transparence ; légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Pastilles sur 2 lignes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `cta`, `button`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Reçus fiscaux : texte à saisir.

<a id="c-086-carte-du-quartier"></a>
### c-086-carte-du-quartier · Carte du Quartier

- **Secteur cible** : association de quartier (famille : Associatif et ONG)
- **Composition** : `carte-localisation` — La carte (réelle ou dessinée) du lieu est l'élément principal.
- **Direction artistique** : Association fictive « Rue des Possibles ». Jaune pâle, rose brique. Plan simplifié en SVG ; la vraie adresse reste en texte. Ton convivial.
- **Références** : R25, P3
- **Geste fort** : *plan-stylise* — Un plan stylisé du quartier, dessiné en SVG avec ses rues et son parc, dont trois points cliquables mènent aux lieux de l'association.
- **Structure** : `R1[plan SVG ; adresses] > R2[liens ; légal]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 plan > 2 adresses > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : pastel) : fond `#FFF0C2` · texte `#2E2A1A` · texte discret `#5E5638` · accent `#D1495B` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 12.7:1, discret/fond 6.5:1, texte/surface 14.4:1, accent 4.4:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Fira Sans ; liens et texte courant : Fira Sans Condensed.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #FFF0C2, surface #FFFFFF.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : Rues SVG, points cliquables.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 2 colonne(s) : La carte (réelle ou dessinée) du lieu est l'élément principal. Disposition : R1[plan SVG ; adresses] > R2[liens ; légal].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Plan pleine largeur. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `map`, `sitelogo`, `menu`, `bizcontact`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Plan SVG : à redessiner par quartier.

<a id="c-087-contributeurs"></a>
### c-087-contributeurs · Contributeurs

- **Secteur cible** : communauté open source (famille : Associatif et ONG)
- **Composition** : `5-6col-mega` — Méga-pied de cinq à sept colonnes de liens, pour les sites très riches.
- **Direction artistique** : Projet libre fictif « Fabrique ». Gris charbon, vert. Avatars du client. Liens vers dépôt, docs, gouvernance, code de conduite.
- **Références** : R22, R41, P9
- **Geste fort** : *avatars-contributeurs* — Une rangée d'avatars ronds de contributeurs (galerie du client) avec « Merci à nos X contributeurs » (nombre réel).
- **Structure** : `R1[avatars ; merci] > R2[5 colonnes] > R3[légal]`
- **Colonnes** : 5 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 avatars > 2 colonnes > 3 légal
- **Logo** : Logo petit, en signature au bas du pied, après le contenu.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : sombre-neutre) : fond `#17191C` · texte `#E6E8EB` · texte discret `#A3A9B1` · accent `#3FB950` · surface `#22262B`
  - Contrastes calculés : texte/fond 14.3:1, discret/fond 7.4:1, texte/surface 12.4:1, accent 6.9:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Source Code Pro ; liens et texte courant : Source Sans 3.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Quadrillage fin tracé en dégradés CSS (type papier millimétré). Palette : fond #17191C, surface #22262B.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Avatars 40 px chevauchés de 8 px.
- **Interactions** : Anneau de focus de 3 px très visible, champ qui s'agrandit au focus ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Méga-pied de cinq à sept colonnes de liens, pour les sites très riches. Disposition : R1[avatars ; merci] > R2[5 colonnes] > R3[légal].
  - 820 : 3 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Avatars sur une ligne, colonnes en deux rangées. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `gallery`, `sitelogo`, `menu`, `button`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Avatars : images fournies, repli initiales.

<a id="c-088-rapports-ouverts"></a>
### c-088-rapports-ouverts · Rapports Ouverts

- **Secteur cible** : fondation (famille : Associatif et ONG)
- **Composition** : `tableau-de-bord` — Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux.
- **Direction artistique** : Fondation fictive « Fondation Alma ». Gris bleu, violet. Les documents sont ceux du client ; pas de chiffres inventés.
- **Références** : R40, R30, P4
- **Geste fort** : *liste-documents* — Une liste de documents publics (rapports annuels, comptes, statuts) avec année et poids du fichier, bien visible.
- **Structure** : `R1[tableau des documents (nom ; année ; poids) ; colonnes de liens] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 documents > 2 colonnes > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`champ-souligne`) : Champ e-mail à simple filet souligné, flèche en bout, consentement discret dessous.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : pastel) : fond `#EFEAF7` · texte `#241B3A` · texte discret `#52476E` · accent `#5B3A8C` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 13.8:1, discret/fond 7.2:1, texte/surface 16.2:1, accent 8.7:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : Cardo ; liens et texte courant : Lato.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #EFEAF7, surface #FFFFFF.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Pictogramme PDF, filets fins.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. Disposition : R1[tableau des documents (nom ; année ; poids) ; colonnes de liens] > R2[légal].
  - 820 : 2 colonne(s). Les zones se réorganisent en deux rangées équilibrées. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : L'ordre et la proportion des zones sont redessinés (pas une simple réduction). Tableau transformé en cartes d'une colonne. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `querylist`, `menu`, `emailsubscribe`, `bizcontact`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Poids de fichier : donnée à saisir.

<a id="c-089-climat-en-chiffres"></a>
### c-089-climat-en-chiffres · Climat en Chiffres

- **Secteur cible** : collectif pour le climat (famille : Associatif et ONG)
- **Composition** : `modulaire-bento` — Mosaïque de tuiles de tailles différentes, chacune avec une fonction.
- **Direction artistique** : Collectif fictif « Après-Demain ». Vert forêt, vert vif. Les chiffres sont fournis et sourcés par le client. Sinon la frise est masquée.
- **Références** : R30, R15, P5
- **Geste fort** : *chiffres-cles* — Trois chiffres vérifiés du collectif (à saisir et sourcer) en grand sur un dégradé vert profond vers turquoise.
- **Structure** : `R1[tuiles : 3 chiffres sourcés + tuile newsletter + tuile liens] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 2 (mobile)
- **Hiérarchie de lecture** : 1 chiffres > 2 newsletter > 3 légal
- **Logo** : Logo en tête, sur une barre pleine largeur partagée avec un sélecteur ou un lien d'accès.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`carte-dediee`) : Carte dédiée à la lettre d'information (titre court, champ, bouton).
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : degrade) : fond `#0B3D2E` · texte `#F0F7EE` · texte discret `#BFDCCB` · accent `#C5F04A` · surface `#12513E`
  - Contrastes calculés : texte/fond 11.2:1, discret/fond 8.3:1, texte/surface 8.5:1, accent 9.3:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Epilogue ; liens et texte courant : Karla.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #0B3D2E, surface #12513E.
- **Formes** (arrondis) : Rayons de 12 à 20 px sur boutons, champs et cartes ; ombres très légères.
- **Décor, icônes, illustrations** : Dégradé vertical, chiffre en 72 px.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 4 colonne(s) : Mosaïque de tuiles de tailles différentes, chacune avec une fonction. Disposition : R1[tuiles : 3 chiffres sourcés + tuile newsletter + tuile liens] > R2[légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 2 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Tuiles sur deux colonnes, chiffres en premier. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `counter`, `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Chiffres factuels : source obligatoire.

<a id="c-090-benevoles-en-cartes"></a>
### c-090-benevoles-en-cartes · Bénévoles en Cartes

- **Secteur cible** : association de bénévoles (famille : Associatif et ONG)
- **Composition** : `carte-decollee` — Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond.
- **Direction artistique** : Association fictive « Main Tendue ». Deux jaunes et du brun. Coins 40 px. Joyeux et lisible.
- **Références** : R13, R17, P3
- **Geste fort** : *sticker-pastille* — Trois grosses pastilles-boutons (Donner du temps, Donner, Nous suivre) cousues dans la carte comme des badges.
- **Structure** : `R1[carte : 3 appels] > R2[légal sur aplat]`
- **Colonnes** : 3 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 carte > 2 appels > 3 légal
- **Logo** : Logo placé à droite, en fin de ligne ou de bloc.
- **Menus** (`pilules`) : Liens en pilules de 44 px de haut, qui reviennent à la ligne.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`pastilles-texte`) : Noms de réseaux en pastilles.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Bouton d'appel principal (widget button ou cta) dont le libellé est choisi par le client
- **Palette** (famille : pastel) : fond `#FFE08A` · texte `#2A2200` · texte discret `#4D4000` · accent `#2A2200` · surface `#FFF6D6`
  - Contrastes calculés : texte/fond 12.3:1, discret/fond 8.0:1, texte/surface 14.6:1, accent 14.6:1 (AA : conforme)
- **Typographies** (arrondie-douce) : Titre et grande échelle : Mali ; liens et texte courant : Lato.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #FFE08A, surface #FFF6D6.
- **Formes** (cartes) : Cartes à rayon 20 à 36 px, ombre douce ou bordure fine.
- **Décor, icônes, illustrations** : Coins 40 px, ombre légère.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Le contenu est dans une grande carte à coins arrondis, décollée des bords, posée sur un aplat ou une photo ; les mentions restent sur le fond. Disposition : R1[carte : 3 appels] > R2[légal sur aplat].
  - 820 : 3 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Carte à 12 px des bords. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `button`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Texte brun sur jaune : AA.

## Famille : Automobile, sport et mobilité

<a id="c-091-concession-contraste"></a>
### c-091-concession-contraste · Concession Contraste

- **Secteur cible** : concession automobile (famille : Automobile, sport et mobilité)
- **Composition** : `marque-monumentale` — Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté.
- **Direction artistique** : Concession fictive « Axiom Motors ». Noir, rouge de signal. Liste des concessions en colonnes minuscules. Aucun prix factice.
- **Références** : R2, R32, P5
- **Geste fort** : *contraste-echelle* — Le nom de la marque en capitales très larges de 14 vw, puis seulement une ligne de liens en 11 px : le contraste d'échelle est le luxe.
- **Structure** : `R1[nom monumental] > R2[concessions ; liens] > R3[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom > 2 concessions > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`annuaire-dense`) : Annuaire de listes fines (13 à 14 px) en plusieurs colonnes.
- **Coordonnées** (`carte-bureaux`) : Liste de plusieurs bureaux ou lieux, une carte par adresse.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-neutre) : fond `#14161A` · texte `#F5F5F5` · texte discret `#B4B4B8` · accent `#E10600` · surface `#1E2126`
  - Contrastes calculés : texte/fond 16.6:1, discret/fond 8.8:1, texte/surface 14.8:1, accent 3.6:1 (AA : conforme)
- **Typographies** (display) : Titre et grande échelle : Michroma ; liens et texte courant : Titillium Web.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #14161A, surface #1E2126.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : Filet rouge 2 px, lettres larges.
- **Interactions** : Survol et focus : soulignement de 1 à 2 px sous le lien. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Le nom ou le logo occupe une grande partie de la largeur, les informations sont minuscules à côté. Disposition : R1[nom monumental] > R2[concessions ; liens] > R3[légal].
  - 820 : 2 colonne(s). Tous les éléments restent visibles, les moins importants se réduisent. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments secondaires sont retirés au profit de l'essentiel (indiqué ci-dessous). Concessions en accordéon masqué. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : **`*liste-adresses`**
- **Risques techniques** : Michroma très large : réduire sur mobile.

<a id="c-092-garage-damier"></a>
### c-092-garage-damier · Garage Damier

- **Secteur cible** : garage moto (famille : Automobile, sport et mobilité)
- **Composition** : `navigation-horizontale-compacte` — Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs.
- **Direction artistique** : Garage moto fictif « Cylindre ». Brun rouille, orange. Damier CSS en conic-gradient. Numéro d'atelier en grand.
- **Références** : R32, R39, P12
- **Geste fort** : *damier-course* — Un bandeau à damier noir et blanc (CSS) souligne la ligne de menu comme un drapeau de course.
- **Structure** : `R1[menu ; téléphone] > R2[damier] > R3[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 téléphone > 2 menu > 3 légal
- **Logo** : Logo placé à droite, en fin de ligne ou de bloc.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`telephone-en-avant`) : Le téléphone est mis en avant en grand corps, avec lien tel:.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-chaud) : fond `#3B2A22` · texte `#F6EBDD` · texte discret `#D9C6B2` · accent `#FF5A1F` · surface `#4B372D`
  - Contrastes calculés : texte/fond 11.6:1, discret/fond 8.2:1, texte/surface 9.5:1, accent 4.4:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Staatliches ; liens et texte courant : Roboto Condensed.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #3B2A22, surface #4B372D.
- **Formes** (brutaliste) : Bordures noires de 3 px, ombres dures décalées sans flou, rayon 0.
- **Décor, icônes, illustrations** : conic-gradient 4 couleurs, bordures épaisses.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Toute la navigation tient sur une ou deux lignes (pilules ou liens), l'information forte est ailleurs. Disposition : R1[menu ; téléphone] > R2[damier] > R3[légal].
  - 820 : 2 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Menu compact. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizphone`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Damier : décoratif seulement.

<a id="c-093-maillot-en-biais"></a>
### c-093-maillot-en-biais · Maillot en Biais

- **Secteur cible** : club de football (famille : Automobile, sport et mobilité)
- **Composition** : `split-vertical` — Le pied est coupé en deux moitiés nettes, de fonds différents.
- **Direction artistique** : Club fictif « AS Rivage ». Bleu royal, jaune. Clip-path pour la diagonale. Billetterie, boutique, fan-club.
- **Références** : R32, R46, P6
- **Geste fort** : *diagonale-club* — Une diagonale tranche le pied entre le bleu et le jaune du club, comme les bandes d'un maillot.
- **Structure** : `R1[2 colonnes séparées par diagonale] > R2[légal]`
- **Colonnes** : 4 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 logo > 2 billetterie > 3 légal
- **Logo** : Logo centré, en tête de la pile.
- **Menus** (`cartes-liens`) : Liens présentés en cartes ou tuiles cliquables entières.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`icones-rondes`) : Icônes dans des disques de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : sombre-bleu) : fond `#0A2A66` · texte `#FFFFFF` · texte discret `#C7D6F3` · accent `#FFD100` · surface `#0F3A8C`
  - Contrastes calculés : texte/fond 13.7:1, discret/fond 9.3:1, texte/surface 10.5:1, accent 9.4:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Teko ; liens et texte courant : Barlow Semi Condensed.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Deux aplats de couleurs différentes se partageant la surface. Palette : fond #0A2A66, surface #0F3A8C.
- **Formes** (facettes) : Coupes nettes en diagonale (clip-path), angles biseautés, rayon 0.
- **Décor, icônes, illustrations** : clip-path polygon, numéros de maillot.
- **Interactions** : Survol et focus : le lien ou la carte se décale de 4 px (translate). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 4 colonne(s) : Le pied est coupé en deux moitiés nettes, de fonds différents. Disposition : R1[2 colonnes séparées par diagonale] > R2[légal].
  - 820 : 2 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Moitiés empilées, la diagonale devient une coupe droite. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `bizcontact`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : clip-path : repli rectangle.

<a id="c-094-planning-de-salle"></a>
### c-094-planning-de-salle · Planning de Salle

- **Secteur cible** : salle de sport (famille : Automobile, sport et mobilité)
- **Composition** : `tableau-de-bord` — Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux.
- **Direction artistique** : Salle fictive « Forge ». Rouge brique, jaune. Tableau de cours fourni par le client. Aucun faux « places limitées ».
- **Références** : R32, R46, P11
- **Geste fort** : *grille-horaires* — Un tableau des cours de la semaine (lundi à dimanche) avec heure et nom du cours, en colonnes serrées.
- **Structure** : `R1[tableau 7 colonnes] > R2[liens ; légal]`
- **Colonnes** : 5 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 planning > 2 liens > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`tableau`) : Liens rangés en tableau (lignes et colonnes avec en-têtes).
- **Coordonnées** (`horaires-en-direct`) : Horaires d'ouverture, avec indication ouvert/fermé calculée sur l'heure réelle.
- **Réseaux** (`icones-carrees`) : Icônes dans des carrés de 44 px.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : degrade) : fond `#B71C1C` · texte `#FFFFFF` · texte discret `#FFD9D0` · accent `#FFD166` · surface `#8E1313`
  - Contrastes calculés : texte/fond 6.6:1, discret/fond 5.0:1, texte/surface 9.3:1, accent 6.5:1 (AA : conforme)
- **Typographies** (condensee) : Titre et grande échelle : Saira Extra Condensed ; liens et texte courant : Saira.
  - Échelle : Échelle serrée : titres de colonnes 12 px en capitales espacées, liens 13 à 14 px (interligne 1,5), texte 14 px, mentions 12 px ; un seul niveau de titre à 20 px au plus.
- **Espacements et rythme** : Dense : marges verticales 40 à 56 px (32 px mobile), pas de base 4 px, interligne 1,5.
- **Arrière-plan** : Dégradé CSS (linear ou radial) sur toute la surface. Palette : fond #B71C1C, surface #8E1313.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Case du jour surlignée.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 5 colonne(s) : Pied organisé comme un tableau d'information : états, horaires, statuts, tableaux. Disposition : R1[tableau 7 colonnes] > R2[liens ; légal].
  - 820 : 2 colonne(s). La rangée défilante montre 3 éléments à la fois. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les éléments en rangée défilent horizontalement avec accroche (scroll-snap), un élément et demi visible. Tableau en défilement horizontal. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `table`, `sitelogo`, `menu`, `bizhours`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Tableau dense : cibles tactiles à vérifier.

<a id="c-095-courbes-de-niveau"></a>
### c-095-courbes-de-niveau · Courbes de Niveau

- **Secteur cible** : outdoor et trail (famille : Automobile, sport et mobilité)
- **Composition** : `immersif` — Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible.
- **Direction artistique** : Marque outdoor fictive « Sentier Nord ». Vert mousse, ocre. Courbes SVG répétées. Trois colonnes de liens.
- **Références** : R14, R25
- **Geste fort** : *motif-topographique* — Des courbes de niveau tracées en SVG, comme une carte IGN, parcourent tout le fond du pied.
- **Structure** : `R1[3 colonnes] > R2[légal]`
- **Colonnes** : 3 (desktop) / 2 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 colonnes > 2 newsletter > 3 légal
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : terre-naturel) : fond `#3A4A33` · texte `#F1EFE0` · texte discret `#D0D5BC` · accent `#E9A23B` · surface `#46583E`
  - Contrastes calculés : texte/fond 8.2:1, discret/fond 6.3:1, texte/surface 6.7:1, accent 4.4:1 (AA : conforme)
- **Typographies** (slab) : Titre et grande échelle : Bitter ; liens et texte courant : Assistant.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Motif répétitif en CSS ou SVG (rayures, points, feuilles, courbes), opacité faible. Palette : fond #3A4A33, surface #46583E.
- **Formes** (organique) : Formes asymétriques (rayons différents par coin, arches, galets), contours doux.
- **Décor, icônes, illustrations** : SVG isolignes 8 %, point coté.
- **Interactions** : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Voir survol/animation : Apparition en fondu doux (400 ms) quand le pied entre à l'écran ; survol : soulignement.
  - Mouvement réduit : Sous prefers-reduced-motion : l'apparition est instantanée.
- **Responsive**
  - 1280 : 3 colonne(s) : Le pied est une scène : fond travaillé (dégradé, grain, motif) et texte posé dessus, sans cadre visible. Disposition : R1[3 colonnes] > R2[légal].
  - 820 : 2 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Colonnes en accordéon. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitelogo`, `menu`, `emailsubscribe`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Motif : texte reste AA.

## Famille : Minimalisme et expérimentation

<a id="c-096-juste-une-ligne"></a>
### c-096-juste-une-ligne · Juste une Ligne

- **Secteur cible** : ultra-minimaliste (famille : Minimalisme et expérimentation)
- **Composition** : `ligne-unique` — Une seule ligne de 56 à 80 px de haut.
- **Direction artistique** : Pied ultra-minimaliste fictif. Blanc pur, noir, filet d'un pixel. Tout tient en 56 px de haut. Les mentions légales sont un seul lien.
- **Références** : P12, P17
- **Geste fort** : *retenue* — Une ligne, un filet, rien d'autre : nom, trois liens, année. La retenue est le geste.
- **Structure** : `R1[nom ; 3 liens ; année]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 nom > 2 liens > 3 année
- **Logo** : Logo à gauche, en tête du pied (hauteur 32 à 40 px).
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`ligne-compacte`) : Coordonnées sur une ligne (adresse · téléphone · e-mail).
- **Réseaux** (`aucun`) : Pas de réseaux sociaux.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : blanc-casse) : fond `#FFFFFF` · texte `#111111` · texte discret `#595959` · accent `#111111` · surface `#F4F4F4`
  - Contrastes calculés : texte/fond 18.9:1, discret/fond 7.0:1, texte/surface 17.2:1, accent 18.9:1 (AA : conforme)
- **Typographies** (sans-geometrique) : Titre et grande échelle : Inter Tight ; liens et texte courant : Inter Tight.
  - Échelle : Échelle large : marque ou phrase d'accroche 28 à 48 px, liens 15 à 16 px (interligne 1,7), mentions 12 px ; capitales espacées à 0,12 em pour les petits titres.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FFFFFF, surface #F4F4F4.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filet 1 px.
- **Interactions** : Survol et focus : un soulignement se dessine de gauche à droite (200 ms). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Une seule ligne de 56 à 80 px de haut. Disposition : R1[nom ; 3 liens ; année].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Ligne en deux lignes. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `sitetitle`, `menu`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Trop sobre pour certains sites : mentions légales à garder.

<a id="c-097-point-final"></a>
### c-097-point-final · Point Final

- **Secteur cible** : ultra-minimaliste éditorial (famille : Minimalisme et expérimentation)
- **Composition** : `centre-pile` — Pile centrée d'éléments (marque, liens, mentions), symétrique.
- **Direction artistique** : Pied fictif. Noir pur, un point typographique monumental comme signature. Étrange et mémorable. Les liens font 12 px.
- **Références** : P1, P17
- **Geste fort** : *point-final* — Un seul point final géant de 20 vw, blanc sur noir, avec trois liens minuscules dessous.
- **Structure** : `R1[point ; 3 liens]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 point > 2 liens > 3 copyright
- **Logo** : Nom ou logo monumental (clamp, 14 à 34 vw), rogné ou pleine largeur.
- **Menus** (`ligne-horizontale`) : Une ligne horizontale de 4 à 6 liens séparés par des espaces ou des points.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`aucun`) : Pas de réseaux sociaux.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : noir) : fond `#0A0A0A` · texte `#F2F2F2` · texte discret `#A8A8A8` · accent `#F2F2F2` · surface `#141414`
  - Contrastes calculés : texte/fond 17.7:1, discret/fond 8.3:1, texte/surface 16.5:1, accent 17.7:1 (AA : conforme)
- **Typographies** (serif-editorial) : Titre et grande échelle : DM Serif Text ; liens et texte courant : DM Mono.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Aérée : marges verticales 96 à 120 px (64 px mobile), pas de base 8 px, interligne 1,7.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #0A0A0A, surface #141414.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : Le point est un caractère, pas une image.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Pile centrée d'éléments (marque, liens, mentions), symétrique. Disposition : R1[point ; 3 liens].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Point de 40 vw ; liens en pile ; mentions légales conservées. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `text`, `menu`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Peut sembler vide : prévoir libellé accessible.

<a id="c-098-inversion-noir-blanc"></a>
### c-098-inversion-noir-blanc · Inversion Noir Blanc

- **Secteur cible** : noir et blanc éditorial (famille : Minimalisme et expérimentation)
- **Composition** : `accordeon` — Les rubriques sont des accordéons, y compris sur grand écran.
- **Direction artistique** : Pied fictif en noir et blanc. Quatre colonnes séparées par des filets. L'inversion est instantanée, sans animation longue.
- **Références** : R19, R36
- **Geste fort** : *inversion-survol* — Chaque colonne s'inverse (blanc sur noir) quand on la survole ou qu'on y met le focus, comme un négatif.
- **Structure** : `R1[4 colonnes] > R2[légal]`
- **Colonnes** : 3 (desktop) / 3 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 colonnes > 2 réseaux > 3 légal
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`colonnes-titrees`) : Colonnes de liens avec titres de 12 px en petites capitales.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : bicolore-contraste) : fond `#F5F5F5` · texte `#0A0A0A` · texte discret `#404040` · accent `#0A0A0A` · surface `#FFFFFF`
  - Contrastes calculés : texte/fond 18.2:1, discret/fond 9.5:1, texte/surface 19.8:1, accent 19.8:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Archivo ; liens et texte courant : Archivo Narrow.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #F5F5F5, surface #FFFFFF.
- **Formes** (filets) : Pas de boîtes : filets de 1 px (parfois 2 ou 6 px) pour structurer, rayon 0.
- **Décor, icônes, illustrations** : Filets 1 px, inversion de couleur sur toute la colonne.
- **Interactions** : Survol et focus : inversion fond/texte du lien ou de la case. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 3 colonne(s) : Les rubriques sont des accordéons, y compris sur grand écran. Disposition : R1[4 colonnes] > R2[légal].
  - 820 : 3 colonne(s). Deux colonnes ; les rubriques restent dépliées mais peuvent se replier. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Les rubriques de liens se replient en accordéons de 48 px de haut (contact et légal restent visibles). Accordéons. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `accordion`, `menu`, `social`, `bizlegal`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Inversion : le focus clavier doit aussi inverser.

<a id="c-099-glitch-au-survol"></a>
### c-099-glitch-au-survol · Glitch au Survol

- **Secteur cible** : créatif expérimental (famille : Minimalisme et expérimentation)
- **Composition** : `phrase-geante` — Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens.
- **Direction artistique** : Studio fictif « Bug ». Aubergine, rose fluo. Effet limité au survol (CSS clip-path), jamais permanent. Bruit en CSS.
- **Références** : R37, R38
- **Geste fort** : *glitch-survol* — Au survol, la phrase géante « Quelque chose a glissé » se décale en deux couches magenta et cyan, comme un défaut d'image, puis revient.
- **Structure** : `R1[phrase géante avec glitch au survol ; 3 liens] > R2[e-mail ; réseaux]`
- **Colonnes** : 2 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 titre > 2 e-mail > 3 liens
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`aucun`) : Pas de bloc de coordonnées (elles restent accessibles par un lien Contact).
- **Réseaux** (`liste-texte`) : Liste de noms de réseaux en texte, sans icône.
- **Newsletter** (`aucune`) : Pas de newsletter dans ce pied.
- **CTA** : Pas de bouton dédié : le lien Contact joue le rôle d'appel discret
- **Palette** (famille : monochrome-couleur) : fond `#3D0A3D` · texte `#FFE6FF` · texte discret `#E7B5E7` · accent `#FF4DFF` · surface `#4E1250`
  - Contrastes calculés : texte/fond 13.8:1, discret/fond 9.3:1, texte/surface 11.8:1, accent 5.9:1 (AA : conforme)
- **Typographies** (mono) : Titre et grande échelle : Major Mono Display ; liens et texte courant : Manrope.
  - Échelle : Contraste d'échelle : élément géant en clamp(4rem, 12 à 26 vw, 24rem), titres de colonnes 12 px en capitales, liens 13 à 14 px, mentions 12 px ; interligne 0,9 pour le géant, 1,6 pour le texte.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Texture légère en CSS (bruit SVG très petit, rayures, grain) ; aucune image lourde. Palette : fond #3D0A3D, surface #4E1250.
- **Formes** (angles-droits) : Angles droits (rayon 0 à 2 px), bordures de 1 px, aucune ombre.
- **Décor, icônes, illustrations** : text-shadow double, clip-path animé 300 ms.
- **Interactions** : Effet de révélation sur le texte principal au survol uniquement. Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : l'effet est supprimé (texte simplement lisible).
- **Responsive**
  - 1280 : 2 colonne(s) : Une phrase d'appel de plusieurs dizaines de pixels remplace le bloc de liens. Disposition : R1[phrase géante avec glitch au survol ; 3 liens] > R2[e-mail ; réseaux].
  - 820 : 1 colonne(s). La navigation reste visible sur deux lignes ; le bouton « Menu » n'apparaît pas encore. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : La navigation se replie derrière un bouton « Menu » ; seuls le contact et le légal restent visibles. Effet désactivé au toucher. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `animatedheading`, `menu`, `social`, `bizemail`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Effet seulement au survol, désactivé en mouvement réduit.

<a id="c-100-pied-en-phrases"></a>
### c-100-pied-en-phrases · Pied en Phrases

- **Secteur cible** : pied rédigé (famille : Minimalisme et expérimentation)
- **Composition** : `editorial-colonne` — Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes.
- **Direction artistique** : Pied rédigé fictif. Papier blanc, encre, bleu de lien. Six phrases courtes, chacune avec un lien souligné. Le ton remplace la structure.
- **Références** : R44, R16, P2, P8
- **Geste fort** : *lien-dans-phrase* — Tout le pied est un paragraphe : « Pour nous écrire, c'est ici. Pour nous voir, c'est là. » avec les liens intégrés aux phrases.
- **Structure** : `R1[paragraphe de phrases] > R2[copyright]`
- **Colonnes** : 1 (desktop) / 1 (tablette) / 1 (mobile)
- **Hiérarchie de lecture** : 1 phrases > 2 contact > 3 copyright
- **Logo** : Pas de logo : le nom apparaît seulement dans le texte ou la mention légale.
- **Menus** (`minimal-3liens`) : Trois liens seulement (plus les mentions), le reste est du vide.
- **Coordonnées** (`bloc-adresse`) : Bloc adresse + téléphone + e-mail en texte simple.
- **Réseaux** (`fleches-texte`) : Noms de réseaux suivis d'une flèche ↗.
- **Newsletter** (`inline-bouton`) : Champ et bouton sur une même ligne, compacts.
- **CTA** : Le champ d'abonnement joue le rôle d'appel
- **Palette** (famille : blanc-casse) : fond `#FFFDF5` · texte `#1F1F1F` · texte discret `#5A5A52` · accent `#0044CC` · surface `#F2EFE2`
  - Contrastes calculés : texte/fond 16.2:1, discret/fond 6.8:1, texte/surface 14.3:1, accent 7.6:1 (AA : conforme)
- **Typographies** (grotesque) : Titre et grande échelle : Instrument Sans ; liens et texte courant : Instrument Sans.
  - Échelle : Échelle moyenne : titre d'accroche 24 à 36 px, titres de colonnes 12 à 13 px, liens 14 à 15 px (interligne 1,6), mentions 12 px.
- **Espacements et rythme** : Moyenne : marges verticales 64 à 80 px (48 px mobile), pas de base 8 px, interligne 1,6.
- **Arrière-plan** : Aplat de couleur uni. Palette : fond #FFFDF5, surface #F2EFE2.
- **Formes** (pilules) : Boutons, champs et liens en pilules (rayon 999 px, 44 px de haut).
- **Décor, icônes, illustrations** : Liens en pastilles soulignées au coeur des phrases, phrases en 28 px.
- **Interactions** : Survol et focus : changement de couleur de texte vers l'accent (si contraste ≥ 4,5:1). Contour visible de 2 px couleur accent (ou texte) avec décalage de 2 px, jamais supprimé. Pas d'animation d'entrée.
  - Mouvement réduit : Sous prefers-reduced-motion : aucune animation n'est jouée, les états de survol deviennent de simples changements de couleur.
- **Responsive**
  - 1280 : 1 colonne(s) : Une colonne étroite de lecture, comme une page de livre, avec une marge pour les notes. Disposition : R1[paragraphe de phrases] > R2[copyright].
  - 820 : 1 colonne(s). Passage à 2 colonnes ou à une pile large ; marges latérales 32 px. Les cibles restent ≥ 44 px.
  - 390 : 1 colonne(s). Stratégie : Toutes les zones passent en une colonne, dans l'ordre de lecture voulu. Phrases sur toute la largeur. Cibles tactiles ≥ 44 px, texte ≥ 14 px, aucun défilement horizontal de page.
- **Widgets** : existants : `text`, `menu`, `bizcontact`, `emailsubscribe`, `social`, `copyright` ; nouveaux : aucun
- **Risques techniques** : Texte long : à traduire avec soin.

---

## Widgets nouveaux nécessaires (dédoublonnés)

| Widget | Nb de concepts qui en dépendent | Rôle | Concepts |
|---|---|---|---|
| `selecteur-langue` | 6 | Sélecteur de langue : liste de liens vers les versions du site, utilisable au clavier. | `c-002`, `c-009`, `c-015`, `c-019`, `c-053`, `c-067` |
| `ouvert-ferme` | 5 | Pastille « Ouvert / Fermé » calculée à partir des horaires saisis dans les Données de l'entreprise (rendu serveur ou petit script). | `c-006`, `c-052`, `c-055`, `c-071`, `c-076` |
| `pastille-statut` | 2 | Pastille de statut alimentée par une VRAIE source (la page de statut du client) ; masquée s'il n'y a pas de source. | `c-012`, `c-019` |
| `liste-adresses` | 2 | Liste de plusieurs adresses ou bureaux saisis (le widget de coordonnées actuel ne gère qu'une seule entité). | `c-053`, `c-091` |
| `badges-appli` | 1 | Boutons App Store / Google Play (images et liens fournis par le client). | `c-020` |
| `horloge-locale` | 1 | Heure locale en direct (petit script) ; repli sans script : texte fixe avec fuseau horaire. | `c-043` |

**85 concepts sur 100 se réalisent avec les widgets existants seulement ; 15 dépendent d'au moins un widget nouveau.** Les six widgets nouveaux sont petits (sélecteur, pastille, liste d'adresses, deux petits scripts) : aucun n'exige WebGL ni service externe. Trois widgets possibles n'ont pas été utilisés : formulaire de contact autonome, bandeau promo, sélecteur de devise.

### Widgets existants les plus utilisés

`copyright` (100), `menu` (94), `social` (87), `bizlegal` (84), `sitelogo` (59), `bizcontact` (42), `emailsubscribe` (37), `sitetitle` (25), `bizhours` (22), `bizphone` (11), `querylist` (11), `bizemail` (10), `heading` (9), `button` (8), `text` (6), `table` (5), `cta` (5), `bizdelivery` (4), `image` (4), `imagebox` (3), `shopcategories` (3), `iconlist` (3), `counter` (2), `iconbox` (2), `tabs` (2).

## Les 10 concepts « phares » proposés pour la phase 3

Choix : couvrir les **capacités du moteur** différentes (texte monumental, carte décollée, filigrane rogné, liste dynamique, onglets, ruban défilant, deux zones, navigation géante, dégradés/verre, cadre), sur des secteurs variés, **sans aucun widget nouveau**, pour valider vite le système avant de construire le reste.

1. **Phrase de Lancement** (`c-017-phrase-de-lancement`, startup, phrase-geante) : Phrase géante et champ e-mail sur la même ligne : teste le texte en vw (clamp), le champ souligné et la fusion phrase + formulaire. Aucun widget nouveau.
2. **Marché du Terroir** (`c-025-marche-du-terroir`, e-commerce alimentaire, carte-decollee) : Grande carte arrondie décollée des bords sur aplat, avec mentions sur le fond : teste les coins de 36 px, les conteneurs imbriqués et les marges latérales. Aucun widget nouveau.
3. **Maison Ivoire** (`c-024-maison-ivoire`, boutique de luxe, marque-monumentale) : Nom monumental en filigrane rogné par le bas : teste le masque (overflow) et la superposition texte sur texte sans perte de contraste. Aucun widget nouveau.
4. **Journal Triple Filet** (`c-033-journal-triple-filet`, journal numérique, 5-6col-mega) : Méga-pied éditorial à sept colonnes avec derniers articles dynamiques : teste les listes de contenu (querylist), le triple filet et la grille dense.
5. **Onglets Documentation** (`c-016-onglets-documentation`, documentation technique, onglets) : Onglets dans le pied : teste l'interaction clavier des onglets et le choix d'un seul panneau visible. Aucun widget nouveau.
6. **Drop Sneakers** (`c-026-drop-sneakers`, e-commerce streetwear, ticker-statique) : Ruban défilant (marquee) avec arrêt au survol et en mouvement réduit : teste la seule animation de défilement prévue.
7. **Bastion Ardoise** (`c-001-bastion-ardoise`, corporate premium, bandeau-lateral) : Bande latérale de chiffres-clés (widget counter) + colonnes : teste le plan à deux zones, la réorganisation mobile et l'accordéon.
8. **Rubriques Géantes** (`c-040-rubriques-geantes`, média alternatif, navigation-verticale) : Navigation verticale géante avec inversion au survol : teste les cibles tactiles énormes et les liens en 9 vw.
9. **Aurore IA** (`c-018-aurore-ia`, intelligence artificielle, image-de-fond) : Dégradés radiaux et carte de verre avec repli : teste backdrop-filter et son repli sans image.
10. **Chancellerie** (`c-005-chancellerie`, cabinet juridique, cadre-passe-partout) : Double cadre fin et texture : teste les bordures décoratives, le centrage strict et le contraste crème sur bordeaux.

## Polices citées (Google Fonts)

123 familles différentes, la plus utilisée étant Inter (9 fois). Liste : Albert Sans, Alegreya, Alegreya Sans, Andika, Anton, Archivo, Archivo Black, Archivo Narrow, Assistant, Atkinson Hyperlegible, Bagel Fat One, Barlow, Barlow Condensed, Barlow Semi Condensed, Be Vietnam Pro, Bebas Neue, Bitter, Bodoni Moda, Bowlby One, Bricolage Grotesque, Cabin, Cardo, Caveat, Caveat Brush, Chivo, Comfortaa, Cormorant Garamond, Cormorant SC, Crimson Pro, DM Mono, DM Sans, DM Serif Display, DM Serif Text, Dela Gothic One, EB Garamond, Epilogue, Familjen Grotesk, Figtree, Fira Sans, Fira Sans Condensed, Fraunces, Fredoka, Geist, Geist Mono, Gelasio, Gentium Plus, Gloock, Hanken Grotesk, Hind, Homemade Apple, IBM Plex Mono, IBM Plex Sans, Instrument Sans, Instrument Serif, Inter, Inter Tight, Italiana, JetBrains Mono, Jost, Karla, Lato, League Gothic, Lexend, Libre Baskerville, Libre Caslon Text, Libre Franklin, Literata, Lora, M PLUS Rounded 1c, Major Mono Display, Mali, Manrope, Marcellus, Martian Mono, Merriweather, Michroma, Montserrat, Mulish, Newsreader, Noto Sans, Noto Serif, Nunito, Nunito Sans, Onest, Open Sans, Oswald, Outfit, Overpass, Playfair Display, Plus Jakarta Sans, Poppins, Prata, Public Sans, Quicksand, Raleway, Red Hat Display, Reenie Beanie, Roboto Condensed, Roboto Mono, Roboto Slab, Rubik, Rubik Mono One, Saira, Saira Extra Condensed, Schibsted Grotesk, Share Tech Mono, Sora, Source Code Pro, Source Sans 3, Source Serif 4, Space Grotesk, Space Mono, Spectral, Staatliches, Syne, Teko, Titillium Web, Unbounded, Urbanist, Vollkorn, Work Sans, Young Serif, Zilla Slab.

## Limites

- Ce sont des **concepts écrits** : la différence réelle entre deux concepts ne sera confirmée qu'à la maquette. Voir `CONCEPTS_MATRICE_DIVERSITE.md` pour la méthode et ses limites.
- Les textes (noms, phrases, chiffres) sont fictifs ; le moteur final affichera les textes du client.
- Les polices et leur licence sont à revérifier à l'intégration ; aucune image n'est fournie (les photos sont celles du client, avec repli en dégradé).
- Certaines idées (éventail de cartes avec focus, onglets dans un pied, backdrop-filter) demandent un essai en conditions réelles avant d'être retenues.


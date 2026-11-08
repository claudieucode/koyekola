# Plan des 100 modèles Page individuelle et contrôle de diversité

**Concepts proposés — rien n'est généré.** Chaque concept est une conception écrite à la main (un fichier de mise en page par modèle, comme la bibliothèque Article v2), **jamais un assemblage ouverture × corps × conclusion**. Chaque modèle contient exactement un `{{post.title}}` (H1) et un `postcontent`, et utilise au moins un élément propre à son usage (voir colonne « Éléments clés »). Textes d'exemple = consignes entre crochets ; aucun prix, chiffre, nom, adresse ni témoignage inventé.

## 1. Critères de diversité (mesurables)
Profil de 14 champs par modèle : (1) ouverture, (2) colonnes, (3) nombre de sections, (4) place du `postcontent`, (5) place du CTA, (6) widgets propres, (7) interaction (onglets, accordéon, carrousel, compte à rebours, filtre…), (8) formulaire, (9) navigation interne, (10) hiérarchie typographique, (11) fond/rythme des bandes, (12) responsive (réorganisation, pas simple réduction), (13) objectif, (14) public. Refus si ≥ 9 champs sur 14 sont identiques à un autre modèle **ou** si la similarité structurelle dépasse **0,70** (seuil plus strict que les 0,80 des articles : l'audit montre que l'existant en compte 30 au-dessus de 0,60). Une autre palette ne compte jamais.

## 2. Légende
Place du contenu : H = sous l'ouverture, G = colonne principale à gauche, C = au centre entre deux bandes, S = entre sections de modèle, D = dans un onglet/volet. Éléments clés : widgets Kolakisa existants (voir inventaire) ; ⚙ = nécessite une brique à ajouter ou à confirmer.

## 3. Les 100 concepts

### 1. Pages d'accueil (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 1 | Accueil corporate | présenter une entreprise B2B | héros 2 colonnes, bande de preuves, 3 services, CTA | S | `iconbox`, `testimonialcarousel`, `cta` |
| 2 | Accueil minimaliste | marque sobre | titre géant seul, contenu étroit, pied calme | C | `heading`, `divider` |
| 3 | Accueil créatif | studio | héros typographique animé, galerie horizontale | S | `animatedheading`, `motionhgallery` |
| 4 | Accueil SaaS | éditeur de logiciel | héros produit, bande de logos, tarifs courts | S | `marquee`, `pricing`, `cta` |
| 5 | Accueil e-commerce | boutique ⚙ module Commerce | héros promo, grille produits | S | `shopgrid` (si module actif) |
| 6 | Accueil éditorial | média | à la une + liste d'articles récents | G | `querylist` |
| 7 | Accueil communautaire | réseau de membres | invitation, compteurs, derniers membres | S | `counter`, `profilecard` |

### 2. À propos (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 8 | Présentation d'entreprise | prospects | ouverture + 3 colonnes de repères | H | `iconbox`, `counter` |
| 9 | Histoire de marque | récit | chapitres verticaux | S | `timeline` |
| 10 | Mission et vision | institutions | deux grands blocs face à face | C | `flipbox` |
| 11 | Équipe | recrues, clients | grille de profils | G | `profilecard` |
| 12 | Valeurs | culture | cartes numérotées + citation | S | `iconbox`, `testimonial` |
| 13 | Chronologie | parcours | frise alternée gauche/droite | D | `timeline`, `motiontimeline` |
| 14 | Fondateur | personnalisation | portrait + biographie | G | `profilecard`, `quote` |

### 3. Services (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 15 | Catalogue de prestations | B2B | cartes filtrables | S | `catfilter` ⚙, `iconbox` |
| 16 | Services premium | haut de gamme | une prestation par bande plein écran | S | `imagebox` |
| 17 | Services B2B | acheteurs pros | tableau d'offres + processus | S | `table`, `motionprocess` |
| 18 | Services créatifs | agences | grille masonry d'exemples | S | `gallery` |
| 19 | Services numériques | SaaS/IT | onglets par domaine | D | `tabs` |
| 20 | Conseil | consultants | méthode en étapes + CTA rendez-vous | S | `timeline`, `cta` |
| 21 | Prestations avec devis | demande de devis | colonne latérale formulaire | G | `signupform` |

### 4. Contact (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 22 | Contact minimaliste | tous | formulaire seul centré | C | `signupform` |
| 23 | Contact corporate | entreprises | coordonnées + formulaire 2 colonnes | G | `bizphone`, `bizemail`, `bizhours` |
| 24 | Formulaire avancé | qualification | formulaire en étapes | D | `signupform`, `accordion` |
| 25 | Contact avec carte | commerces | carte pleine largeur + coordonnées | S | `map` |
| 26 | Multi-départements | grandes structures | onglets par service | D | `tabs`, `bizcontact` |
| 27 | Plusieurs bureaux | groupes | cartes de bureaux | S | `map`, `iconbox` |
| 28 | Rendez-vous | cabinets | créneaux (lien externe fourni par le site) ⚙ | G | `cta` |

### 5. Vente et conversion (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 29 | Landing page | campagne | héros + bénéfices + CTA répétés | S | `cta`, `iconbox` |
| 30 | Page de vente longue | offre à fort enjeu | argumentaire, preuves, garantie, FAQ | S | `testimonial`, `accordion` |
| 31 | Présentation d'offre | offre unique | colonne offre collante | G | `pricing` |
| 32 | Lancement | produit à venir | compte à rebours + liste d'attente | S | `countdown`, `emailsubscribe` |
| 33 | Génération de prospects | B2B | document à recevoir contre e-mail | G | `signupform` |
| 34 | Capture d'e-mails | newsletter | une promesse, un champ | C | `emailsubscribe` |
| 35 | Page produit | produit physique ⚙ | galerie + caractéristiques | G | `shopbuy` (module), `gallery` |

### 6. Portfolio (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 36 | Portfolio graphique | designers | grille régulière | S | `gallery` |
| 37 | Portfolio photo | photographes | images pleine largeur | S | `mediacarousel` |
| 38 | Portfolio vidéo | vidéastes | liste de lecture | S | `videoplaylist` |
| 39 | Portfolio d'agence | agences | études de cas en cartes | S | `imagebox` |
| 40 | Études de cas | B2B | récit problème/solution/résultat | S | `tabs`, `timeline` |
| 41 | Portfolio éditorial | illustrateurs | colonnes alternées | G | `image` |
| 42 | Portfolio immersif | créatifs | scènes épinglées | S | `motionportfolio`, `motionpinscenes` |

### 7. Institutionnel (6)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 43 | Organisation | publics | présentation + domaines d'action | H | `iconbox` |
| 44 | ONG | donateurs | mission, actions, appel à soutien | S | `counter`, `cta` |
| 45 | Association | adhérents | activités + calendrier | S | `timeline` |
| 46 | Fondation | mécénat | gouvernance et projets | S | `profilecard` |
| 47 | Administration | usagers | démarches par thème | D | `accordion`, `search` |
| 48 | Gouvernance | transparence | organigramme en blocs, documents | S | `table` |

### 8. Éducation (6)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 49 | École | parents | présentation, projet, contact | S | `iconbox`, `bizcontact` |
| 50 | Université | étudiants | facultés en onglets | D | `tabs` |
| 51 | Centre de formation | adultes | catalogue de cours | S | `courselist` |
| 52 | Programme pédagogique | candidats | semaines en frise | S | `timeline` |
| 53 | Admission | candidats | étapes + dates à renseigner | S | `timeline`, `signupform` |
| 54 | Enseignants | familles | grille de profils | G | `profilecard` |

### 9. Communauté (6)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 55 | Présentation de communauté | nouveaux venus | charte + avantages | S | `iconbox` |
| 56 | Adhésion | futurs membres | formules + formulaire | S | `pricing`, `signupform` |
| 57 | Membres | réseau | cartes de membres | S | `profilecard` |
| 58 | Groupes | thématiques | liste de groupes | S | `iconbox` |
| 59 | Bénévolat | volontaires | missions + inscription | S | `accordion`, `signupform` |
| 60 | Événement communautaire | habitants | programme + plan | S | `timeline`, `map` |

### 10. Tarification (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 61 | Pricing classique | tous | 3 colonnes | S | `pricing` |
| 62 | Pricing SaaS | logiciel | commutateur mensuel/annuel | S | `toggle`, `pricing` |
| 63 | Comparaison de forfaits | indécis | tableau comparatif | S | `table` |
| 64 | Colonnes + recommandé | conversion | colonne centrale mise en avant | S | `pricing` |
| 65 | Abonnement | récurrent | frise des avantages + formules | S | `pricelist` |
| 66 | Tarification B2B | entreprises | « sur devis » + formulaire | G | `signupform` |
| 67 | Tarifs + FAQ | rassurer | formules puis questions | S | `pricing`, `accordion` |

### 11. FAQ et assistance (6)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 68 | FAQ classique | tous | accordéon unique | G | `accordion` |
| 69 | FAQ par catégories | clients | onglets | D | `tabs`, `accordion` |
| 70 | Centre d'aide | clients | recherche + thèmes | S | `search`, `iconbox` |
| 71 | Documentation | utilisateurs | sommaire collant + contenu | G | `toc` |
| 72 | Support | clients | canaux de contact | S | `bizcontact` |
| 73 | Dépannage | utilisateurs | arbre de questions | D | `accordion` |

### 12. Événements (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 74 | Présentation d'événement | participants | date, lieu, programme | S | `countdown`, `map` |
| 75 | Conférence | pros | intervenants + programme | S | `profilecard`, `tabs` |
| 76 | Webinaire | prospects | inscription + sujets | G | `signupform` |
| 77 | Atelier | amateurs | déroulé + places | S | `timeline` |
| 78 | Salon | exposants | plan + exposants | S | `map`, `table` |
| 79 | Événement culturel | public | affiche + billetterie | S | `cta` |
| 80 | Intervenants | participants | grille d'intervenants | S | `profilecard` |

### 13. Immobilier et local (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 81 | Agence immobilière | acheteurs | biens à renseigner + contact | S | `iconbox`, `bizcontact` |
| 82 | Présentation d'un bien | acheteurs | galerie + caractéristiques | G | `gallery`, `table` |
| 83 | Quartier | habitants | atouts + plan | S | `map` |
| 84 | Établissement | clients | horaires, accès | S | `bizhours`, `map` |
| 85 | Restaurant | convives | carte en onglets | D | `tabs`, `pricelist` |
| 86 | Hôtel | voyageurs | chambres + services | S | `imagebox` |
| 87 | Tourisme | visiteurs | circuits | S | `timeline`, `map` |

### 14. Pages personnelles (6)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 88 | CV en ligne | recruteurs | frise parcours + compétences | S | `timeline`, `progress` |
| 89 | Biographie | lecteurs | texte + repères | G | `profilecard` |
| 90 | Profil professionnel | pros | expertise + références | S | `iconbox` |
| 91 | Freelance | clients | offre + disponibilité | S | `cta` |
| 92 | Témoignages | prospects | mur de témoignages | S | `testimonialcarousel` |
| 93 | Réalisations | clients | liste de projets | S | `imagebox` |

### 15. Créatif et expérimental (7)
| # | Nom | Objectif / public | Structure | Contenu | Éléments clés |
|---|---|---|---|---|---|
| 94 | Asymétrique | créatifs | colonnes décalées | G | `grid` |
| 95 | Immersive | marques | sections plein écran | S | `motionhero` |
| 96 | Narrative | récit | défilement épinglé | S | `motionstickystory` |
| 97 | Défilement horizontal | portfolios | rail horizontal (desktop), pile en mobile | S | `motionhgallery` |
| 98 | Typographique | éditorial | texte monumental | C | `motionkinetictext` |
| 99 | Photo plein écran | photographes | une image par écran | S | `image` |
| 100 | Plans multiples | marques | couches en flux | S | `motiontilt…`/`container` |

## 4. Points à décider avant génération
1. **Cadre ou page complète ?** (voir `TARGET_ARCHITECTURE.md`) : recommandé = cadre riche autour de `postcontent`, plus aucune duplication avec la bibliothèque de pages complètes.
2. Concepts ⚙ (5, 15, 28, 35) : produits seulement avec les briques existantes (ex. 15 sans filtre, 5 et 35 uniquement si le module Commerce est actif, 28 avec un lien fourni par le propriétaire).
3. Seuil de similarité 0,70 au lieu de 0,80 ; remplacement des 100 modèles actuels (voie B), ancien lot conservé jusqu'à validation des nouveaux.

## 5. Directions artistiques par concept

Chaque concept reçoit **sa propre direction artistique en valeurs FIXES** (jamais les jetons du site) : palette (fond · texte · accent) et paire de polices de la **bibliothèque locale** (1 775 polices libres servies depuis le site, aucun service tiers ; seules les polices réellement utilisées par un modèle sont chargées). Ambiance : L claire, D sombre, B couleur franche, E éditoriale, S douce. Les 100 couples palette + polices sont tous distincts. Ce sont des **propositions** à valider visuellement (étape 5).

| # | Concept | Ambiance | Palette (fond · texte · accent) | Polices (titres + texte) |
|---|---|---|---|---|
| 1 | Accueil corporate | B | Cobalt + bleu roi · `#1d4ed8` `#ffffff` `#2b59ff` | League Spartan + Lato |
| 2 | Accueil minimaliste | E | Journal + bleu roi · `#f4efe6` `#161616` `#2b59ff` | Playfair Display + Source Sans 3 |
| 3 | Accueil créatif | D | Minuit + bleu roi · `#0b0f1a` `#eef2ff` `#2b59ff` | Space Grotesk + IBM Plex Sans |
| 4 | Accueil SaaS | B | Tomate + cuivre · `#c2410c` `#fff7ed` `#c4622d` | Poppins + Nunito Sans |
| 5 | Accueil e-commerce | B | Forêt + violet · `#065f46` `#ecfdf5` `#7c5cff` | Barlow Condensed + Barlow |
| 6 | Accueil éditorial | E | Ivoire + cuivre · `#fbf6ee` `#2a1215` `#c4622d` | Fraunces + Inter |
| 7 | Accueil communautaire | S | Pêche + bleu roi · `#fff4ee` `#4a2c2a` `#2b59ff` | Lora + Nunito |
| 8 | Présentation d'entreprise | L | Craie + bleu roi · `#faf9f6` `#1b1b1b` `#2b59ff` | Manrope + Inter |
| 9 | Histoire de marque | L | Brume + cuivre · `#f3f6f8` `#1e2a33` `#c4622d` | DM Sans + Work Sans |
| 10 | Mission et vision | L | Lin + violet · `#f6f3ea` `#2a2a1c` `#7c5cff` | Plus Jakarta Sans + Source Sans 3 |
| 11 | Équipe | L | Sable + ambre · `#f7f1e8` `#26303a` `#d98b3a` | Outfit + Mulish |
| 12 | Valeurs | S | Menthe + cuivre · `#eefaf5` `#1f3d33` `#c4622d` | Quicksand + Nunito Sans |
| 13 | Chronologie | L | Porcelaine + bleu roi · `#ffffff` `#10231f` `#2b59ff` | Urbanist + Karla |
| 14 | Fondateur | S | Lavande + violet · `#f5f1fb` `#2e2447` `#7c5cff` | Fredoka + Mulish |
| 15 | Catalogue de prestations | L | Craie + cuivre · `#faf9f6` `#1b1b1b` `#c4622d` | Manrope + Inter |
| 16 | Services premium | L | Brume + violet · `#f3f6f8` `#1e2a33` `#7c5cff` | DM Sans + Work Sans |
| 17 | Services B2B | L | Lin + ambre · `#f6f3ea` `#2a2a1c` `#d98b3a` | Plus Jakarta Sans + Source Sans 3 |
| 18 | Services créatifs | L | Sable + bleu roi · `#f7f1e8` `#26303a` `#2b59ff` | Outfit + Mulish |
| 19 | Services numériques | L | Porcelaine + cuivre · `#ffffff` `#10231f` `#c4622d` | Urbanist + Karla |
| 20 | Conseil | L | Craie + violet · `#faf9f6` `#1b1b1b` `#7c5cff` | Manrope + Inter |
| 21 | Prestations avec devis | B | Violet + ambre · `#5b21b6` `#faf5ff` `#d98b3a` | Rubik + Open Sans |
| 22 | Contact minimaliste | E | Blanc pur + violet · `#ffffff` `#000000` `#7c5cff` | Cormorant Garamond + Lato |
| 23 | Contact corporate | L | Brume + ambre · `#f3f6f8` `#1e2a33` `#d98b3a` | DM Sans + Work Sans |
| 24 | Formulaire avancé | L | Lin + bleu roi · `#f6f3ea` `#2a2a1c` `#2b59ff` | Plus Jakarta Sans + Source Sans 3 |
| 25 | Contact avec carte | L | Sable + cuivre · `#f7f1e8` `#26303a` `#c4622d` | Outfit + Mulish |
| 26 | Multi-départements | L | Porcelaine + violet · `#ffffff` `#10231f` `#7c5cff` | Urbanist + Karla |
| 27 | Plusieurs bureaux | L | Craie + ambre · `#faf9f6` `#1b1b1b` `#d98b3a` | Manrope + Inter |
| 28 | Rendez-vous | L | Brume + bleu roi · `#f3f6f8` `#1e2a33` `#2b59ff` | DM Sans + Work Sans |
| 29 | Landing page | B | Soleil + bleu roi · `#fde047` `#1c1917` `#2b59ff` | Archivo Black + Archivo |
| 30 | Page de vente longue | B | Cobalt + cuivre · `#1d4ed8` `#ffffff` `#c4622d` | League Spartan + Lato |
| 31 | Présentation d'offre | B | Tomate + violet · `#c2410c` `#fff7ed` `#7c5cff` | Poppins + Nunito Sans |
| 32 | Lancement | B | Forêt + ambre · `#065f46` `#ecfdf5` `#d98b3a` | Barlow Condensed + Barlow |
| 33 | Génération de prospects | B | Violet + bleu roi · `#5b21b6` `#faf5ff` `#2b59ff` | Rubik + Open Sans |
| 34 | Capture d'e-mails | B | Soleil + cuivre · `#fde047` `#1c1917` `#c4622d` | Archivo Black + Archivo |
| 35 | Page produit | B | Cobalt + violet · `#1d4ed8` `#ffffff` `#7c5cff` | League Spartan + Lato |
| 36 | Portfolio graphique | L | Lin + cuivre · `#f6f3ea` `#2a2a1c` `#c4622d` | Plus Jakarta Sans + Source Sans 3 |
| 37 | Portfolio photo | L | Sable + violet · `#f7f1e8` `#26303a` `#7c5cff` | Outfit + Mulish |
| 38 | Portfolio vidéo | D | Graphite + cuivre · `#111111` `#f4f4ef` `#c4622d` | Syne + Inter |
| 39 | Portfolio d'agence | L | Porcelaine + ambre · `#ffffff` `#10231f` `#d98b3a` | Urbanist + Karla |
| 40 | Études de cas | L | Craie + corail · `#faf9f6` `#1b1b1b` `#e4572e` | DM Sans + Work Sans |
| 41 | Portfolio éditorial | E | Beige + ambre · `#e9e1d3` `#131313` `#d98b3a` | Libre Baskerville + Work Sans |
| 42 | Portfolio immersif | D | Cuivre sombre + violet · `#17120e` `#f3e9dc` `#7c5cff` | Unbounded + DM Sans |
| 43 | Organisation | E | Vert anglais + bleu roi · `#f3f1e8` `#14281d` `#2b59ff` | EB Garamond + DM Sans |
| 44 | ONG | L | Brume + sarcelle · `#f3f6f8` `#1e2a33` `#0f766e` | Plus Jakarta Sans + Source Sans 3 |
| 45 | Association | S | Abricot + ambre · `#fff8ec` `#473216` `#d98b3a` | Literata + Figtree |
| 46 | Fondation | E | Journal + cuivre · `#f4efe6` `#161616` `#c4622d` | Playfair Display + Source Sans 3 |
| 47 | Administration | E | Ivoire + violet · `#fbf6ee` `#2a1215` `#7c5cff` | Fraunces + Inter |
| 48 | Gouvernance | E | Blanc pur + ambre · `#ffffff` `#000000` `#d98b3a` | Cormorant Garamond + Lato |
| 49 | École | S | Ciel + bleu roi · `#eef6fb` `#1c3550` `#2b59ff` | Spectral + Karla |
| 50 | Université | L | Lin + citron · `#f6f3ea` `#2a2a1c` `#c6ff3d` | Outfit + Mulish |
| 51 | Centre de formation | L | Sable + turquoise · `#f7f1e8` `#26303a` `#4cc2ff` | Urbanist + Karla |
| 52 | Programme pédagogique | L | Porcelaine + corail · `#ffffff` `#10231f` `#e4572e` | Manrope + Inter |
| 53 | Admission | S | Pêche + cuivre · `#fff4ee` `#4a2c2a` `#c4622d` | Lora + Nunito |
| 54 | Enseignants | S | Menthe + violet · `#eefaf5` `#1f3d33` `#7c5cff` | Quicksand + Nunito Sans |
| 55 | Présentation de communauté | S | Lavande + ambre · `#f5f1fb` `#2e2447` `#d98b3a` | Fredoka + Mulish |
| 56 | Adhésion | L | Craie + sarcelle · `#faf9f6` `#1b1b1b` `#0f766e` | DM Sans + Work Sans |
| 57 | Membres | S | Abricot + bleu roi · `#fff8ec` `#473216` `#2b59ff` | Literata + Figtree |
| 58 | Groupes | S | Ciel + cuivre · `#eef6fb` `#1c3550` `#c4622d` | Spectral + Karla |
| 59 | Bénévolat | S | Pêche + violet · `#fff4ee` `#4a2c2a` `#7c5cff` | Lora + Nunito |
| 60 | Événement communautaire | S | Menthe + ambre · `#eefaf5` `#1f3d33` `#d98b3a` | Quicksand + Nunito Sans |
| 61 | Pricing classique | B | Tomate + ambre · `#c2410c` `#fff7ed` `#d98b3a` | Poppins + Nunito Sans |
| 62 | Pricing SaaS | B | Forêt + bleu roi · `#065f46` `#ecfdf5` `#2b59ff` | Barlow Condensed + Barlow |
| 63 | Comparaison de forfaits | B | Violet + cuivre · `#5b21b6` `#faf5ff` `#c4622d` | Rubik + Open Sans |
| 64 | Colonnes + recommandé | L | Brume + citron · `#f3f6f8` `#1e2a33` `#c6ff3d` | Plus Jakarta Sans + Source Sans 3 |
| 65 | Abonnement | B | Soleil + violet · `#fde047` `#1c1917` `#7c5cff` | Archivo Black + Archivo |
| 66 | Tarification B2B | B | Cobalt + ambre · `#1d4ed8` `#ffffff` `#d98b3a` | League Spartan + Lato |
| 67 | Tarifs + FAQ | B | Tomate + bleu roi · `#c2410c` `#fff7ed` `#2b59ff` | Poppins + Nunito Sans |
| 68 | FAQ classique | L | Lin + turquoise · `#f6f3ea` `#2a2a1c` `#4cc2ff` | Outfit + Mulish |
| 69 | FAQ par catégories | L | Sable + corail · `#f7f1e8` `#26303a` `#e4572e` | Urbanist + Karla |
| 70 | Centre d'aide | L | Porcelaine + sarcelle · `#ffffff` `#10231f` `#0f766e` | Manrope + Inter |
| 71 | Documentation | L | Craie + citron · `#faf9f6` `#1b1b1b` `#c6ff3d` | DM Sans + Work Sans |
| 72 | Support | L | Brume + turquoise · `#f3f6f8` `#1e2a33` `#4cc2ff` | Plus Jakarta Sans + Source Sans 3 |
| 73 | Dépannage | L | Lin + corail · `#f6f3ea` `#2a2a1c` `#e4572e` | Outfit + Mulish |
| 74 | Présentation d'événement | L | Sable + sarcelle · `#f7f1e8` `#26303a` `#0f766e` | Urbanist + Karla |
| 75 | Conférence | B | Forêt + cuivre · `#065f46` `#ecfdf5` `#c4622d` | Barlow Condensed + Barlow |
| 76 | Webinaire | B | Violet + violet · `#5b21b6` `#faf5ff` `#7c5cff` | Rubik + Open Sans |
| 77 | Atelier | B | Soleil + ambre · `#fde047` `#1c1917` `#d98b3a` | Archivo Black + Archivo |
| 78 | Salon | B | Cobalt + corail · `#1d4ed8` `#ffffff` `#e4572e` | Poppins + Nunito Sans |
| 79 | Événement culturel | L | Porcelaine + citron · `#ffffff` `#10231f` `#c6ff3d` | Manrope + Inter |
| 80 | Intervenants | L | Craie + turquoise · `#faf9f6` `#1b1b1b` `#4cc2ff` | DM Sans + Work Sans |
| 81 | Agence immobilière | L | Brume + corail · `#f3f6f8` `#1e2a33` `#e4572e` | Plus Jakarta Sans + Source Sans 3 |
| 82 | Présentation d'un bien | L | Lin + sarcelle · `#f6f3ea` `#2a2a1c` `#0f766e` | Outfit + Mulish |
| 83 | Quartier | S | Lavande + bleu roi · `#f5f1fb` `#2e2447` `#2b59ff` | Fredoka + Mulish |
| 84 | Établissement | L | Sable + citron · `#f7f1e8` `#26303a` `#c6ff3d` | Urbanist + Karla |
| 85 | Restaurant | S | Abricot + cuivre · `#fff8ec` `#473216` `#c4622d` | Literata + Figtree |
| 86 | Hôtel | S | Ciel + violet · `#eef6fb` `#1c3550` `#7c5cff` | Spectral + Karla |
| 87 | Tourisme | L | Porcelaine + turquoise · `#ffffff` `#10231f` `#4cc2ff` | Manrope + Inter |
| 88 | CV en ligne | L | Craie + olive · `#faf9f6` `#1b1b1b` `#6b7a2a` | Plus Jakarta Sans + Source Sans 3 |
| 89 | Biographie | E | Beige + bleu roi · `#e9e1d3` `#131313` `#2b59ff` | Libre Baskerville + Work Sans |
| 90 | Profil professionnel | L | Brume + bordeaux · `#f3f6f8` `#1e2a33` `#7a1f2b` | Outfit + Mulish |
| 91 | Freelance | L | Lin + rose · `#f6f3ea` `#2a2a1c` `#ff4d8d` | Urbanist + Karla |
| 92 | Témoignages | S | Pêche + ambre · `#fff4ee` `#4a2c2a` `#d98b3a` | Lora + Nunito |
| 93 | Réalisations | L | Sable + noir · `#f7f1e8` `#26303a` `#111111` | Manrope + Inter |
| 94 | Asymétrique | E | Vert anglais + cuivre · `#f3f1e8` `#14281d` `#c4622d` | EB Garamond + DM Sans |
| 95 | Immersive | D | Encre + ambre · `#0a1628` `#e8f0fb` `#d98b3a` | Bricolage Grotesque + Geist |
| 96 | Narrative | D | Obsidienne + bleu roi · `#14090f` `#f8e9f0` `#2b59ff` | Archivo Black + Archivo |
| 97 | Défilement horizontal | D | Minuit + cuivre · `#0b0f1a` `#eef2ff` `#c4622d` | Space Grotesk + IBM Plex Sans |
| 98 | Typographique | E | Journal + violet · `#f4efe6` `#161616` `#7c5cff` | Playfair Display + Source Sans 3 |
| 99 | Photo plein écran | D | Graphite + violet · `#111111` `#f4f4ef` `#7c5cff` | Syne + Inter |
| 100 | Plans multiples | D | Cuivre sombre + ambre · `#17120e` `#f3e9dc` `#d98b3a` | Unbounded + DM Sans |

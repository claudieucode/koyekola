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

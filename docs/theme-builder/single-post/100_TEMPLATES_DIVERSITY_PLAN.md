# Plan des 100 modèles Article individuel et contrôle de diversité

**Proposition de concepts — rien n'est généré.** Les 100 concepts ci-dessous sont des *propositions à valider*. Ils s'appuient uniquement sur des widgets qui existent aujourd'hui (voir `FEATURE_PARITY_MATRIX.md`) ; les concepts qui demandent une brique absente sont marqués ⚙ (brique à ajouter d'abord : champ personnalisé, réactions…).

## 1. Situation de départ
La bibliothèque actuelle compte déjà 100 compositions en 23 familles (audit : 0 défaut, seuil de similarité 80 %). Les familles demandées qui n'y figurent pas comme telles : santé/bien-être médical, éducation (objectifs, exercices, quiz), photographie comparatif avant/après, juridique/financier, code technique, expérimentation visuelle. **Deux voies**, à choisir à la validation :
* **A (recommandée)** — conserver les compositions actuelles de bonne qualité (aucun risque pour les liens d'aperçu) et remplacer seulement celles qui sont trop proches des nouveaux concepts ;
* **B** — remplacement complet par les 100 concepts ci-dessous (clés nouvelles, anciennes retirées du catalogue ; les sites existants ne sont pas touchés car « Utiliser » copie).

## 2. Critères mesurables de diversité (par modèle)
Chaque modèle reçoit un « profil » de 13 champs : (1) composition, (2) structure en colonnes, (3) position du titre, (4) image principale, (5) métadonnées, (6) organisation du contenu, (7) widgets présents, (8) sidebar, (9) navigation, (10) fonctionnalités, (11) interactions, (12) style éditorial, (13) responsive. Deux modèles sont jugés trop proches s'ils partagent ≥ 9 champs sur 13, ou si le script structurel dépasse 80 % de similarité. Une autre palette ne compte pas comme différence. Contrôle à refaire après chaque groupe de 10.

## 3. Légende des colonnes
Titre : H = haut centré, G = gauche, S = sur l'image (en flux, jamais en absolu), M = monumental, V = vertical, C = collant. Image : – aucune, T = en tête pleine largeur, L/R = latérale, I = incrustée, F = fond de bandeau, Sp = split 50/50, Ga = galerie.

## 4. Les 100 concepts

### 1. Blogs minimalistes (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 1 | Page blanche | colonne unique 640 px | H | – | métadonnées en pied seulement |
| 2 | Typo pure | colonne 680, corps serif 20 px | M | – | initiale ornée, aucune carte |
| 3 | Large lecture | colonne 920 px, interligne 1,8 | G | T | lecture confortable écran large |
| 4 | Étroit 520 | colonne 520 px | G | – | notes de marge discrètes |
| 5 | Méta fantôme | colonne 700 | G | I | métadonnées visibles au survol/focus |
| 6 | Titre colossal | colonne 720 sous titre 12vw | M | – | titre sur 2 lignes, date en exposant |
| 7 | Nu et sommaire | colonne + sommaire inline | G | – | `toc` replié |
| 8 | Respiration | colonne 660, grands espaces | H | I | une citation en exergue |

### 2. Magazines professionnels (10)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 9 | Une éditoriale | 2 colonnes 2/1 | G | T | chapeau + filet double |
| 10 | Magazine moderne | grille 12 col. | S | F | bandeau coloré, auteur en carte |
| 11 | Culture | colonne + marge de notes | G | Sp | note de marge, citation large |
| 12 | Lifestyle | duo image/texte alterné | H | L | cartes liées en fin |
| 13 | Économie | 3 colonnes (sommaire/texte/chiffres) | G | – | bloc « chiffres clés » (`iconlist`) |
| 14 | Tech mag | 2 colonnes, panneau collant | G | T | panneau sommaire collant |
| 15 | Photo mag | image plein cadre puis colonne | S | F | légende en filet |
| 16 | Navigation latérale | rail gauche collant | G | T | `toc` + partage dans le rail |
| 17 | Méta avancées | fiche métadonnées en tête | G | R | `postmeta` complet + `postterms` |
| 18 | Recommandés | texte + rail de cartes | G | T | `querylist` related en colonne |

### 3. Journaux numériques (10)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 19 | Presse classique | 2 colonnes texte (CSS columns) | G | T | filet, signature |
| 20 | Alerte | bandeau d'alerte + colonne | G | – | `alert` « mise à jour » + date de modification |
| 21 | Investigation | colonne + encadrés | G | I | encadrés « méthode / sources » |
| 22 | Analyse | texte + graphique textuel | G | – | tableau de données, notes numérotées |
| 23 | Citations | colonne + exergues | H | – | `quote` large récurrent |
| 24 | Chronologie | colonne + frise verticale | G | – | liste datée (`iconlist`) |
| 25 | Encadrés | colonne + bloc latéral | G | L | « à retenir » collant |
| 26 | Données | grille de chiffres + texte | G | – | statistiques en tête |
| 27 | Multi-images | colonne + galerie | G | Ga | galerie sous le texte |
| 28 | Navigation éditoriale | colonne + précédent/suivant ample | G | T | `postnav` en bandeau, même catégorie |

### 4. Blogs personnels et professionnels (10)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 29 | Carnet perso | colonne + date en marge | G | – | signature manuscrite (police) |
| 30 | Consultant | colonne + bandeau CTA | G | L | CTA « me contacter » |
| 31 | Développeur | colonne + bloc code | G | – | style code, sommaire |
| 32 | Graphiste | image dominante + texte bas | S | F | palette de l'article |
| 33 | Photographe | colonne étroite + grandes images | H | T | légendes |
| 34 | Entreprise | colonne + encadré marque | G | T | `authorbox` sobre |
| 35 | Agence | split titre/texte | G | Sp | étiquettes projet |
| 36 | Créateur | colonne + abonnement | H | I | `sharebuttons` + abonnement |
| 37 | Voyageur | colonne + bande de photos | H | Ga | lieu et date |
| 38 | Cuisinier | colonne + fiche | G | R | fiche temps/portions |

### 5. Technologie et logiciels (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 39 | SaaS annonce | héros + colonne | M | F | CTA essai, liste de nouveautés |
| 40 | Logiciel | 2 colonnes (texte/specs) | G | R | tableau des versions |
| 41 | Tutoriel technique | rail sommaire + étapes | G | – | étapes numérotées |
| 42 | Dev web | colonne + blocs code | G | – | blocs code larges |
| 43 | Démo | texte + vidéo | G | T | vidéo en tête |
| 44 | Captures | alternance texte/captures | G | I | légendes numérotées |
| 45 | Doc complémentaire | texte + liens associés | G | – | liste de ressources |
| 46 | Ressources | texte + téléchargements | G | – | boutons de fichiers |

### 6. Éducation et formation (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 47 | Pédagogique | colonne + encadré objectifs | G | – | objectifs en tête |
| 48 | Pas à pas | rail d'étapes | G | – | progression de lecture |
| 49 | Objectifs | bandeau objectifs + texte | G | I | durée, niveau |
| 50 | Ressources cours | texte + panneau ressources | G | L | liens et fichiers |
| 51 | Vidéo cours | vidéo + notes | G | T | notes à droite |
| 52 | Exercices | texte + accordéons | G | – | `accordion` solutions repliées |
| 53 | Auto-évaluation | texte + `accordion` questions/réponses | G | – | questions repliables, score non calculé (pas de faux quiz) |
| 54 | Cours associés | texte + `querylist` | G | – | « cours suivants » |

### 7. Photographie et création (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 55 | Photo reportage | images plein écran en alternance | H | T | texte court |
| 56 | Galerie immersive | galerie en tête | S | Ga | texte sous galerie |
| 57 | Plein écran | une image par écran | G | F | défilement |
| 58 | Avant et après | deux images côte à côte | G | Sp | légendes « avant » / « après » (pas de curseur interactif) |
| 59 | Portfolio éditorial | grille d'images + texte | G | Ga | fiche projet |
| 60 | Images alternées | zigzag | G | L/R | alternance |
| 61 | Illustrations | colonne + planches | H | I | légendes, crédits |
| 62 | Narration visuelle | image/texte en séquence | M | T | séquence numérotée |

### 8. Business et corporate (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 63 | Article entreprise | colonne + encadré chiffres | G | T | encadré « à propos » |
| 64 | Étude de cas | héros + résultats | G | F | bloc résultats |
| 65 | Communiqué | colonne formelle | G | – | contact presse |
| 66 | Institutionnel | 2 colonnes sobres | G | R | mentions |
| 67 | Conseil | colonne + CTA | G | – | CTA rendez-vous |
| 68 | Financier | colonne + tableau | G | – | avertissement éditorial |
| 69 | Juridique | colonne + sommaire numéroté | G | – | références, date de mise à jour |
| 70 | Stratégie / témoignages | texte + témoignages | G | – | `quote` clients |

### 9. Voyage et lifestyle (6)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 71 | Récit de voyage | image large + texte | S | T | galerie finale |
| 72 | Guide touristique | texte + infos pratiques | G | L | encadré infos |
| 73 | Lieux et plan d'accès | texte + liste d'adresses | G | R | adresses en `iconlist`, lien externe fourni par l'auteur |
| 74 | Itinéraire | jours en colonnes | G | I | étapes jour par jour |
| 75 | Gastronomie | image + fiche | G | R | adresse, prix |
| 76 | Culturel | colonne + agenda | G | Sp | dates utiles |

### 10. Santé, sport et bien-être (6)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 77 | Sport | héros + stats | M | F | chiffres de séance |
| 78 | Entraînement | séances en cartes | G | I | plan hebdo |
| 79 | Nutrition | texte + fiche aliments | G | R | tableau |
| 80 | Bien-être | colonne apaisée | H | I | citation douce |
| 81 | Médical informatif | colonne + avertissement | G | – | avertissement éditorial, références |
| 82 | Infographie | texte + visuel | G | T | légende de sources |

### 11. Formats éditoriaux avancés (8)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 83 | Long format | colonne + progression | G | T | `readingprogress`, chapitres |
| 84 | Storytelling | chapitres plein écran | H | F | `toc` flottant |
| 85 | Interview | Q/R alternées | G | R | style question/réponse |
| 86 | Portrait | portrait + texte | G | L | fiche personne |
| 87 | Analyse comparative | 2 colonnes comparées | G | – | tableau comparatif |
| 88 | Liste éditoriale | éléments numérotés | M | T | numéros géants |
| 89 | Dossier spécial | sommaire + sous-articles | G | T | `querylist` du dossier |
| 90 | Reportage multimédia | texte + vidéo + audio | G | T | blocs médias |

### 12. Expériences visuelles et créatives (10)
| # | Nom | Composition | Titre | Image | Éléments distinctifs |
|---|---|---|---|---|---|
| 91 | Asymétrique | grille décalée | G | R | colonnes inégales |
| 92 | Titre vertical | titre en écriture verticale | V | L | mise en page en deux zones |
| 93 | Image décalée | image chevauchant | G | I | décalage contrôlé |
| 94 | Plans multiples | couches en flux | S | F | profondeur sans absolu |
| 95 | Navigation flottante | barre latérale collante | G | T | partage + toc flottants |
| 96 | Sommaire fixe | rail latéral | G | – | `toc` sticky |
| 97 | Lecture immersive | fond sombre, colonne | H | T | `readingprogress` |
| 98 | Défilement narratif | sections plein écran | M | F | animations de révélation |
| 99 | Interactif | accordéons + onglets | G | – | `tabs`, `accordion` |
| 100 | Expérimental maîtrisé | alternance de rythmes | M | I | contraste d'échelle |

## 5. Répartition
Blogs minimalistes 8, magazines 10, journaux 10, blogs personnels/pro 10, tech 8, éducation 8, photo 8, business 8, voyage/lifestyle 6, santé/sport 6, formats avancés 8, créatif 10 = **100**. Aucune famille au-dessus de 10 %.

## 6. Décisions validées (étape 2)
* **Voie B retenue** (8 novembre 2026) : remplacement complet de la bibliothèque, par groupes, jamais en une seule fois.
* Les trois concepts ⚙ (53, 58, 73) sont remplacés par des versions réalisables avec les widgets existants ; aucune fonction simulée.
* Anciennes clés : conservées comme alias de lecture seule (aperçus déjà partagés) mais retirées de la liste affichée. Aucun site ni article n'est touché.
* Le catalogue affiché ne dépassera jamais 100 modèles : l'ancien lot reste en place jusqu'à ce que les 100 nouveaux soient validés, puis bascule en une seule opération annulable.

## 7. Points qui restaient à valider
* Voie A (conserver) ou B (remplacer).
* ⚙ Les concepts 53, 58, 73 dépendent d'une brique inexistante : les produire seulement après l'ajout (ou les remplacer).
* Les concepts « avertissement éditorial » (81, 68) utilisent des textes génériques **modifiables** : aucun conseil médical/financier n'est inventé.

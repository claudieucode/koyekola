# Fiches de conception — les 100 modèles « Article individuel » v3

Fichier **généré** par `node scripts/generer-fiches-article.js` à partir du catalogue réel : les widgets, grilles et éléments collants listés sont ceux qui sont effectivement posés dans chaque modèle. Les médias riches (galerie, vidéo, audio, tableau, code, carte) se placent dans le contenu de l'article avec les blocs de l'éditeur d'article ; ils ne sont pas simulés par le modèle.

## Matrice de diversité

| # | Clé | Nom | Direction artistique | Archétype | Titre | Image | Colonnes max | Grilles | Collant | Éléments | Widgets d'accompagnement |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 001 | `grand-numero.ai-001` | Grand Numéro | Magazine éditorial premium | Imprimé expérimental | asymétrique | portrait vertical | 2 | 1 | 1 | 14 | authorbox, postmeta, postnav, quote |
| 002 | `couverture.ai-002` | Couverture | Magazine éditorial premium | Ouverture superposée | superposé bas-gauche | plein écran | 2 | 1 | 1 | 19 | postmeta, querylist, sharebuttons |
| 003 | `le-fil-rouge.ai-003` | Le Fil Rouge | Magazine éditorial premium | Trois colonnes magazine | gauche | carré décalé | 3 | 1 | 3 | 19 | authorbox, postmeta, querylist, sharebuttons, toc |
| 004 | `cahier-central.ai-004` | Cahier Central | Magazine éditorial premium | Lookbook asymétrique | centré | diptyque | 2 | 2 | 0 | 17 | postmeta, quote |
| 005 | `edition-du-soir.ai-005` | Édition du Soir | Journal numérique international | Journal en colonnes | gauche | bande étroite | 2 | 0 | 0 | 12 | postmeta, postnav |
| 006 | `depeche.ai-006` | Dépêche | Journal numérique international | Colonne étroite et marginalia | gauche | aucune | 2 | 1 | 1 | 13 | postmeta |
| 007 | `grand-angle.ai-007` | Grand Angle | Journal numérique international | Plein cadre | sous l'image | panoramique | 1 | 0 | 0 | 13 | postcomments, postmeta, querylist, quote |
| 008 | `enquete.ai-008` | Enquête | Journal numérique international | Long format à chapitres | monumental pleine largeur | aucune | 2 | 1 | 1 | 17 | postcomments, postmeta, readingprogress, toc |
| 009 | `silence.ai-009` | Silence | Article minimaliste | Colonne étroite et marginalia | centré | aucune | 2 | 1 | 1 | 10 | postmeta |
| 010 | `blanc-casse.ai-010` | Blanc Cassé | Article minimaliste | Affiche typographique | monumental pleine largeur | aucune | 1 | 0 | 0 | 9 | postmeta |
| 011 | `marge-fine.ai-011` | Marge Fine | Article minimaliste | Colonne étroite et marginalia | gauche | bande étroite | 2 | 2 | 2 | 17 | postmeta, postterms |
| 012 | `respire.ai-012` | Respire | Article minimaliste | Manifeste typographique | centré | aucune | 1 | 0 | 0 | 11 | postmeta, quote |
| 013 | `maison-noire.ai-013` | Maison Noire | Magazine de luxe | Ouverture superposée | superposé centré | plein écran | 1 | 0 | 0 | 10 | postmeta |
| 014 | `atelier.ai-014` | Atelier | Magazine de luxe | Lookbook asymétrique | gauche | détourée | 2 | 2 | 1 | 17 | postmeta, postnav |
| 015 | `prestige.ai-015` | Prestige | Magazine de luxe | Carte chevauchante | asymétrique | carte chevauchante | 1 | 0 | 0 | 15 | postmeta, querylist, sharebuttons |
| 016 | `collection.ai-016` | Collection | Magazine de luxe | Fiche technique | centré | détourée | 2 | 1 | 2 | 17 | authorbox |
| 017 | `epreuve.ai-017` | Épreuve | Article photographique | Reportage séquentiel | gauche | plein écran | 2 | 1 | 1 | 20 | postmeta, postnav |
| 018 | `planche-contact.ai-018` | Planche Contact | Article photographique | Mosaïque d'images | centré | mosaïque | 2 | 1 | 0 | 20 | postmeta, sharebuttons |
| 019 | `chambre-noire.ai-019` | Chambre Noire | Article photographique | Immersif par chapitres sombres | centré | plein écran | 1 | 0 | 0 | 13 | postmeta, readingprogress |
| 020 | `cadre-large.ai-020` | Cadre Large | Article photographique | Plein cadre | sous l'image | cadre épais | 2 | 2 | 1 | 18 | postmeta, querylist, quote |
| 021 | `vernissage.ai-021` | Vernissage | Article artistique | Split vertical | split droite | portrait vertical | 2 | 1 | 1 | 19 | authorbox, postmeta |
| 022 | `cartel.ai-022` | Cartel | Article artistique | Encyclopédique | gauche | cadre épais | 2 | 1 | 2 | 18 | postmeta |
| 023 | `atelier-ouvert.ai-023` | Atelier Ouvert | Article artistique | Lookbook asymétrique | asymétrique | flottante habillée | 2 | 2 | 1 | 15 | postmeta |
| 024 | `passage.ai-024` | Passage | Article artistique | Imprimé expérimental | vertical | mosaïque | 2 | 2 | 1 | 19 | postmeta, quote |
| 025 | `terminal.ai-025` | Terminal | Article technologique | Sommaire latéral collant | gauche | aucune | 2 | 2 | 1 | 17 | postmeta, postnav, toc |
| 026 | `lancement.ai-026` | Lancement | Article technologique | Carte chevauchante | centré | carte chevauchante | 2 | 1 | 1 | 15 | postmeta, sharebuttons |
| 027 | `benchmark.ai-027` | Benchmark | Article technologique | Test et verdict | gauche | détourée | 2 | 1 | 0 | 17 | postmeta |
| 028 | `changelog.ai-028` | Changelog | Article technologique | Chronologie verticale | gauche | aucune | 1 | 0 | 0 | 13 | postmeta, toc |
| 029 | `resume.ai-029` | Résumé | Article scientifique | Dossier scientifique | gauche | aucune | 2 | 2 | 3 | 18 | postmeta, postterms, toc |
| 030 | `figure-1.ai-030` | Figure 1 | Article scientifique | Données et infographie | centré | pleine largeur | 1 | 0 | 0 | 15 | postmeta |
| 031 | `protocole.ai-031` | Protocole | Article scientifique | Guide pas à pas | gauche | aucune | 1 | 0 | 0 | 13 | alert, postmeta |
| 032 | `revue.ai-032` | Revue | Article scientifique | Encyclopédique | gauche | aucune | 2 | 2 | 3 | 21 | postmeta, toc |
| 033 | `cours-du-jour.ai-033` | Cours du Jour | Article financier | Données et infographie | gauche | bande étroite | 1 | 0 | 0 | 16 | alert, postmeta |
| 034 | `bilan.ai-034` | Bilan | Article financier | Fiche technique | gauche | aucune | 2 | 1 | 2 | 14 | — |
| 035 | `mandat.ai-035` | Mandat | Article financier | Tribune d'opinion | centré | portrait vertical | 2 | 1 | 1 | 16 | authorbox, postmeta, quote |
| 036 | `perspective.ai-036` | Perspective | Article économique | Rail droit collant | gauche | panoramique | 2 | 1 | 1 | 19 | authorbox, postmeta, querylist, sharebuttons |
| 037 | `passerelle.ai-037` | Passerelle | Article de mode | Lookbook asymétrique | asymétrique | portrait vertical | 2 | 1 | 0 | 12 | postmeta |
| 038 | `lookbook.ai-038` | Lookbook | Article de mode | Split vertical | split droite | plein écran | 2 | 2 | 2 | 19 | postmeta, querylist |
| 039 | `maille.ai-039` | Maille | Article de mode | Plein cadre | centré | cadre épais | 1 | 0 | 0 | 17 | postmeta, postnav, quote |
| 040 | `coulisses.ai-040` | Coulisses | Article de mode | Interview en dialogue | gauche | portrait vertical | 2 | 2 | 1 | 16 | authorbox, postmeta |
| 041 | `carnet-d-ailleurs.ai-041` | Carnet d'Ailleurs | Article de voyage | Carnet de lieu | gauche | panoramique | 2 | 1 | 1 | 21 | postmeta, postnav |
| 042 | `horizon.ai-042` | Horizon | Article de voyage | Ouverture superposée | superposé bas-gauche | plein écran | 1 | 0 | 0 | 14 | postmeta, querylist |
| 043 | `etapes.ai-043` | Étapes | Article de voyage | Chronologie verticale | gauche | bande étroite | 1 | 0 | 0 | 12 | postmeta |
| 044 | `terre-rouge.ai-044` | Terre Rouge | Article de voyage | Long format à chapitres | monumental pleine largeur | plein écran | 2 | 1 | 1 | 17 | postmeta, readingprogress |
| 045 | `mise-en-place.ai-045` | Mise en Place | Article gastronomique | Guide pas à pas | gauche | flottante habillée | 2 | 1 | 1 | 17 | postmeta, toc |
| 046 | `table-du-chef.ai-046` | Table du Chef | Article gastronomique | Split vertical | split droite | portrait vertical | 2 | 1 | 1 | 15 | postmeta |
| 047 | `marche.ai-047` | Marché | Article gastronomique | Mosaïque d'images | centré | mosaïque | 2 | 2 | 1 | 20 | postmeta, postterms |
| 048 | `mi-temps.ai-048` | Mi-Temps | Article sportif | Carte chevauchante | gauche | carte chevauchante | 1 | 0 | 0 | 14 | postmeta, sharebuttons |
| 049 | `effort.ai-049` | Effort | Article sportif | Ouverture superposée | superposé bas-gauche | plein écran | 2 | 1 | 1 | 14 | postmeta |
| 050 | `seance.ai-050` | Séance | Article sportif | Guide pas à pas | gauche | aucune | 2 | 2 | 1 | 17 | alert, postmeta |
| 051 | `tribune-du-stade.ai-051` | Tribune du Stade | Article sportif | Trois colonnes magazine | gauche | bande étroite | 3 | 2 | 3 | 17 | postmeta, querylist, toc |
| 052 | `essai-routier.ai-052` | Essai Routier | Article automobile | Test et verdict | gauche | panoramique | 2 | 1 | 0 | 14 | postmeta |
| 053 | `concept.ai-053` | Concept | Article automobile | Immersif par chapitres sombres | centré | plein écran | 2 | 1 | 1 | 16 | postmeta |
| 054 | `fiche-de-serie.ai-054` | Fiche de Série | Article automobile | Fiche technique | gauche | détourée | 2 | 1 | 2 | 19 | — |
| 055 | `plan-libre.ai-055` | Plan Libre | Article architectural | Encyclopédique | asymétrique | panoramique | 2 | 2 | 2 | 20 | postmeta, querylist |
| 056 | `elevation.ai-056` | Élévation | Article architectural | Plein cadre | sous l'image | pleine largeur | 2 | 2 | 1 | 16 | postmeta |
| 057 | `beton.ai-057` | Béton | Article architectural | Imprimé expérimental | vertical | bande étroite | 2 | 1 | 1 | 15 | postmeta, quote |
| 058 | `visite.ai-058` | Visite | Article immobilier | Fiche technique | gauche | mosaïque | 2 | 2 | 2 | 20 | — |
| 059 | `quartier.ai-059` | Quartier | Article immobilier | Carnet de lieu | gauche | panoramique | 2 | 1 | 1 | 20 | postmeta |
| 060 | `conseil-de-notaire.ai-060` | Conseil de Notaire | Article immobilier | Dossier scientifique | gauche | aucune | 2 | 1 | 2 | 17 | alert, postmeta, toc |
| 061 | `lecon.ai-061` | Leçon | Article éducatif | Guide pas à pas | gauche | aucune | 2 | 2 | 2 | 16 | postmeta, readingprogress, toc |
| 062 | `cahier.ai-062` | Cahier | Article éducatif | Colonne étroite et marginalia | gauche | flottante habillée | 2 | 2 | 2 | 15 | postmeta |
| 063 | `amphi.ai-063` | Amphi | Article universitaire | Sommaire latéral collant | gauche | aucune | 2 | 1 | 1 | 15 | postmeta, querylist, toc |
| 064 | `atelier-junior.ai-064` | Atelier Junior | Article éducatif | Lookbook asymétrique | asymétrique | flottante habillée | 2 | 1 | 0 | 14 | postmeta |
| 065 | `generique.ai-065` | Générique | Article cinématographique | Long format à chapitres | centré | plein écran | 1 | 0 | 0 | 15 | postmeta |
| 066 | `pochette.ai-066` | Pochette | Article musical | Split vertical | split droite | carré décalé | 2 | 2 | 1 | 18 | postmeta |
| 067 | `plateau.ai-067` | Plateau | Article musical | Audio d'abord | gauche | carré décalé | 2 | 1 | 2 | 18 | postmeta, sharebuttons, toc |
| 068 | `projection.ai-068` | Projection | Article cinématographique | Vidéo d'abord | gauche | vidéo | 2 | 1 | 1 | 13 | postmeta |
| 069 | `affiche-de-scene.ai-069` | Affiche de Scène | Article de divertissement | Affiche typographique | monumental pleine largeur | aucune | 1 | 0 | 0 | 12 | postmeta |
| 070 | `saison.ai-070` | Saison | Article culturel | Chronologie verticale | gauche | bande étroite | 2 | 1 | 1 | 18 | postmeta |
| 071 | `passerelle-culturelle.ai-071` | Passerelle Culturelle | Article culturel | Encyclopédique | gauche | cadre épais | 2 | 3 | 3 | 23 | postmeta |
| 072 | `cabinet.ai-072` | Cabinet | Article de santé | Dossier scientifique | gauche | aucune | 2 | 1 | 2 | 18 | alert, postcomments, postmeta, toc |
| 073 | `souffle.ai-073` | Souffle | Article de bien-être | Colonne étroite et marginalia | centré | cadre épais | 2 | 1 | 1 | 12 | postmeta |
| 074 | `nutrition.ai-074` | Nutrition | Article de santé | Guide pas à pas | gauche | flottante habillée | 2 | 1 | 1 | 16 | postmeta |
| 075 | `etude-de-cas.ai-075` | Étude de Cas | Article d'entreprise | Mosaïque d'images | gauche | bande étroite | 1 | 0 | 0 | 15 | postmeta |
| 076 | `rapport.ai-076` | Rapport | Article institutionnel | Communiqué formel | gauche | aucune | 2 | 1 | 1 | 16 | — |
| 077 | `campagne.ai-077` | Campagne | Article marketing | Carte chevauchante | asymétrique | carte chevauchante | 1 | 0 | 0 | 11 | postmeta, sharebuttons |
| 078 | `place-publique.ai-078` | Place Publique | Article communautaire | Rail droit collant | gauche | flottante habillée | 2 | 1 | 1 | 17 | postcomments, postmeta, sharebuttons |
| 079 | `mot-du-directeur.ai-079` | Mot du Directeur | Article d'entreprise | Lettre | centré | aucune | 1 | 0 | 0 | 15 | authorbox |
| 080 | `lettre-ouverte.ai-080` | Lettre Ouverte | Article institutionnel | Lettre | gauche | aucune | 2 | 1 | 1 | 16 | sharebuttons |
| 081 | `journal.ai-081` | Journal | Article personnel | Colonne étroite et marginalia | gauche | flottante habillée | 2 | 1 | 1 | 16 | postmeta, postnav, postterms |
| 082 | `cap-interieur.ai-082` | Cap Intérieur | Article de développement personnel | Tribune d'opinion | centré | portrait vertical | 1 | 0 | 0 | 11 | postmeta, quote |
| 083 | `fiche-de-lecture.ai-083` | Fiche de Lecture | Article personnel | Test et verdict | gauche | détourée | 2 | 2 | 1 | 18 | postmeta |
| 084 | `scrollytelling.ai-084` | Scrollytelling | Format éditorial expérimental | Reportage séquentiel | centré | plein écran | 1 | 0 | 0 | 19 | postmeta, readingprogress |
| 085 | `typographie-cinetique.ai-085` | Typographie Cinétique | Format éditorial expérimental | Manifeste typographique | monumental pleine largeur | aucune | 1 | 0 | 0 | 7 | postmeta |
| 086 | `papier-decoupe.ai-086` | Papier Découpé | Format éditorial expérimental | Imprimé expérimental | asymétrique | mosaïque | 2 | 3 | 2 | 20 | postmeta, quote |
| 087 | `marge-infinie.ai-087` | Marge Infinie | Format éditorial expérimental | Colonne étroite et marginalia | dans la marge | aucune | 2 | 2 | 2 | 14 | postmeta |
| 088 | `cyanotype.ai-088` | Cyanotype | Article artistique | Plein cadre | centré | cadre épais | 1 | 0 | 0 | 12 | postmeta, quote |
| 089 | `vitrail.ai-089` | Vitrail | Article culturel | Encyclopédique | gauche | portrait vertical | 2 | 2 | 3 | 22 | postmeta |
| 090 | `atlas.ai-090` | Atlas | Article culturel | Carnet de lieu | gauche | pleine largeur | 1 | 0 | 0 | 19 | postmeta |
| 091 | `fanzine.ai-091` | Fanzine | Format éditorial expérimental | Imprimé expérimental | vertical | diptyque | 2 | 2 | 1 | 16 | postmeta, quote |
| 092 | `observatoire.ai-092` | Observatoire | Article scientifique | Sommaire latéral collant | centré | plein écran | 2 | 2 | 1 | 16 | postmeta |
| 093 | `herbier.ai-093` | Herbier | Article scientifique | Encyclopédique | gauche | détourée | 2 | 1 | 2 | 22 | postmeta |
| 094 | `sillage.ai-094` | Sillage | Article sportif | Plein cadre | gauche | panoramique | 1 | 0 | 0 | 13 | postmeta |
| 095 | `atelier-de-code.ai-095` | Atelier de Code | Article technologique | Communiqué formel | gauche | aucune | 2 | 2 | 2 | 20 | — |
| 096 | `rendez-vous.ai-096` | Rendez-vous | Article communautaire | Fiche technique | gauche | bande étroite | 2 | 1 | 2 | 16 | — |
| 097 | `dossier-thematique.ai-097` | Dossier Thématique | Magazine culturel | Navigation éditoriale | gauche | bande étroite | 2 | 2 | 1 | 17 | postmeta, postnav, querylist, toc |
| 098 | `reportage-long.ai-098` | Reportage Long | Article de reportage | Long format à chapitres | superposé bas-gauche | plein écran | 2 | 1 | 1 | 17 | postmeta, readingprogress, toc |
| 099 | `verso.ai-099` | Verso | Article d'entreprise | Trois colonnes magazine | gauche | carré décalé | 3 | 1 | 3 | 14 | postmeta, toc |
| 100 | `derniere-page.ai-100` | Dernière Page | Format éditorial expérimental | Manifeste typographique | centré | aucune | 1 | 0 | 0 | 9 | postmeta, postnav, quote |

## Fiches

### AI-001 — Grand Numéro

- **Clé** : `grand-numero.ai-001` · **Direction artistique** : Magazine éditorial premium · **Secteur cible** : Presse magazine
- **Usage éditorial** : Le titre s'étire sur deux colonnes, la photo verticale déborde sur la marge comme dans un magazine papier.
- **Composition** : Imprimé expérimental — Grille de magazine papier, colonnes décalées, folios.
- **Structure générale** : grille 12 colonnes décalée ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 0
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 620 px · **Métadonnées** : folio en marge · **Auteur** : signature en fin de texte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox, postmeta, postnav, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : folio de page, lettrine, citation monumentale · **Interactions** : éléments collants pendant la lecture, navigation précédent / suivant
- **Couleurs** : fond #f2efe9, texte #171412, accent #c8102e, surface #e4dfd5 · **Typographies** : titres playfair-display, texte source-serif-4
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-002 — Couverture

- **Clé** : `couverture.ai-002` · **Direction artistique** : Magazine éditorial premium · **Secteur cible** : Presse magazine
- **Usage éditorial** : Une couverture : l'image occupe tout l'écran, le titre repose sur son bord inférieur.
- **Composition** : Ouverture superposée — Image à l'écran entier, titre posé sur l'image, texte ensuite.
- **Structure générale** : 1 colonne après l'ouverture ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 2, de corps 1
- **Titre** : superposé bas-gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 680 px · **Métadonnées** : sous le titre, une ligne · **Auteur** : carte en fin d'article · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, querylist, sharebuttons · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : ouverture plein écran, partage en fin · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #0d1b2a, texte #f4f1ea, accent #ffb703, surface #1b2d44 · **Typographies** : titres bodoni-moda, texte inter
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-003 — Le Fil Rouge

- **Clé** : `le-fil-rouge.ai-003` · **Direction artistique** : Magazine éditorial premium · **Secteur cible** : Presse magazine
- **Usage éditorial** : Un fil rouge vertical relie sommaire, texte et rail : la page se lit comme une maquette.
- **Composition** : Trois colonnes magazine — Sommaire, texte et rail d'accompagnement côte à côte.
- **Structure générale** : sommaire | texte | rail ; jusqu'à 3 colonnes, 1 grille(s), variante d'ouverture 1, de fin 1, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carré décalé
- **Largeur de lecture** : 600 px · **Métadonnées** : rail droit · **Auteur** : rail droit · **Sidebar** : droite
- **Widgets d'accompagnement posés** : authorbox, postmeta, querylist, sharebuttons, toc · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : sommaire sticky, rail de lecture · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #ffffff, texte #101820, accent #e4002b, surface #f1f3f5 · **Typographies** : titres dm-serif-display, texte dm-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-004 — Cahier Central

- **Clé** : `cahier-central.ai-004` · **Direction artistique** : Magazine éditorial premium · **Secteur cible** : Presse magazine
- **Usage éditorial** : Deux images en diptyque, une marge de légendes, le texte glisse entre les deux.
- **Composition** : Lookbook asymétrique — Images alternées en décalage, texte court.
- **Structure générale** : images alternées en décalage ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 1, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : diptyque
- **Largeur de lecture** : 560 px · **Métadonnées** : sous le titre · **Auteur** : en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : images en décalage, légendes marginales · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #e9eef2, texte #1a1a1a, accent #0057b8, surface #d5dde4 · **Typographies** : titres fraunces, texte work-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-005 — Édition du Soir

- **Clé** : `edition-du-soir.ai-005` · **Direction artistique** : Journal numérique international · **Secteur cible** : Presse quotidienne
- **Usage éditorial** : Titre en gras serré, deux colonnes de presse, heure de mise à jour en tête.
- **Composition** : Journal en colonnes — Texte réparti en deux colonnes de presse sous un grand titre.
- **Structure générale** : 2 colonnes de presse ; jusqu'à 2 colonnes, 0 grille(s), variante d'ouverture 3, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 700 px · **Métadonnées** : ligne de dépêche · **Auteur** : ligne d'auteur · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : colonnes CSS, heure de mise à jour · **Interactions** : navigation précédent / suivant
- **Couleurs** : fond #fbfaf6, texte #1c1c1c, accent #9b1c1c, surface #efece3 · **Typographies** : titres gloock, texte pt-serif
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-006 — Dépêche

- **Clé** : `depeche.ai-006` · **Direction artistique** : Journal numérique international · **Secteur cible** : Agence de presse
- **Usage éditorial** : Aucun décor : lieu, heure et auteur dans la marge, le texte occupe le centre.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : colonne étroite + marges ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 2, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 560 px · **Métadonnées** : marge gauche · **Auteur** : marge droite · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : bandeau « mis à jour », notes de marge · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffffff, texte #111827, accent #d97706, surface #f3f4f6 · **Typographies** : titres inter-tight, texte source-serif-4
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-007 — Grand Angle

- **Clé** : `grand-angle.ai-007` · **Direction artistique** : Journal numérique international · **Secteur cible** : Presse internationale
- **Usage éditorial** : Photo panoramique à bords perdus, titre dessous, légende alignée sur la colonne.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 2, de corps 0
- **Titre** : sous l'image · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 660 px · **Métadonnées** : sous l'image · **Auteur** : carte en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postcomments, postmeta, querylist, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : légende d'image, articles liés · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f6f7f9, texte #0b132b, accent #1b75c8, surface #e3e8ef · **Typographies** : titres libre-baskerville, texte public-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-008 — Enquête

- **Clé** : `enquete.ai-008` · **Direction artistique** : Journal numérique international · **Secteur cible** : Journalisme d'investigation
- **Usage éditorial** : Un seul titre colossal sur fond noir, barre orange de progression sous le menu.
- **Composition** : Long format à chapitres — Sections successives avec progression de lecture.
- **Structure générale** : chapitres numérotés ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 1, de corps 1
- **Titre** : monumental pleine largeur · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 640 px · **Métadonnées** : au pied du titre · **Auteur** : encadré « méthode » · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postcomments, postmeta, readingprogress, toc · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : barre de lecture, encadré méthode, chapitres · **Interactions** : éléments collants pendant la lecture, barre de progression de lecture, sommaire à ancres
- **Couleurs** : fond #101010, texte #ededed, accent #ff4d00, surface #1d1d1d · **Typographies** : titres archivo, texte newsreader
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-009 — Silence

- **Clé** : `silence.ai-009` · **Direction artistique** : Article minimaliste · **Secteur cible** : Blog personnel
- **Usage éditorial** : Un titre, un texte, rien d'autre ; les métadonnées viennent après la dernière phrase.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : 1 colonne seule ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 1, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 560 px · **Métadonnées** : pied de texte · **Auteur** : une ligne · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : interligne généreux · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fcfcfa, texte #222222, accent #6b7280, surface #f0f0ec · **Typographies** : titres cormorant-garamond, texte lora
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-010 — Blanc Cassé

- **Clé** : `blanc-casse.ai-010` · **Direction artistique** : Article minimaliste · **Secteur cible** : Blog design
- **Usage éditorial** : Le titre prend toute la largeur en très grand corps, le texte reste modeste.
- **Composition** : Affiche typographique — Titre monumental seul, sans image ; le texte démarre sous l'affiche.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 0, de corps 0
- **Titre** : monumental pleine largeur · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 600 px · **Métadonnées** : sous le titre · **Auteur** : en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : sommaire discret · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f7f7f5, texte #0f0f0f, accent #2f6f4e, surface #ebebe6 · **Typographies** : titres instrument-serif, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-011 — Marge Fine

- **Clé** : `marge-fine.ai-011` · **Direction artistique** : Article minimaliste · **Secteur cible** : Blog professionnel
- **Usage éditorial** : Un trait rose très fin sépare le texte d'une marge où vivent date, rubrique et auteur.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : colonne + marge de notes ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 3, de fin 2, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 520 px · **Métadonnées** : dans la marge · **Auteur** : dans la marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postterms · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : notes de marge sticky · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffffff, texte #262626, accent #be185d, surface #f5f5f5 · **Typographies** : titres libre-baskerville, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-012 — Respire

- **Clé** : `respire.ai-012` · **Direction artistique** : Article minimaliste · **Secteur cible** : Bien-être
- **Usage éditorial** : Texte en grand corps, lignes courtes, une seule citation qui sert de respiration.
- **Composition** : Manifeste typographique — Texte seul en très grand corps, rythme par la typographie.
- **Structure générale** : 1 colonne en grand corps ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 1, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 640 px · **Métadonnées** : après le texte · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : corps 22 px, citation unique · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f4f8f5, texte #1f2d27, accent #0f766e, surface #e4eee8 · **Typographies** : titres fraunces, texte mulish
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-013 — Maison Noire

- **Clé** : `maison-noire.ai-013` · **Direction artistique** : Magazine de luxe · **Secteur cible** : Luxe et joaillerie
- **Usage éditorial** : Noir profond, filet or, image qui remplit l'écran : l'article s'ouvre comme un écrin.
- **Composition** : Ouverture superposée — Image à l'écran entier, titre posé sur l'image, texte ensuite.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 1, de corps 0
- **Titre** : superposé centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 600 px · **Métadonnées** : capitales fines sous le titre · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : image plein écran, filet doré · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0a0a0a, texte #f3ede0, accent #c9a24b, surface #171717 · **Typographies** : titres cinzel, texte cormorant-garamond
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 32px, rembourrage 20px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-014 — Atelier

- **Clé** : `atelier.ai-014` · **Direction artistique** : Magazine de luxe · **Secteur cible** : Maroquinerie
- **Usage éditorial** : Objets détourés sur fond sombre qui s'alternent avec le récit d'atelier.
- **Composition** : Lookbook asymétrique — Images alternées en décalage, texte court.
- **Structure générale** : images alternées ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 540 px · **Métadonnées** : ligne fine · **Auteur** : carte discrète · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : image détourée, alternance · **Interactions** : éléments collants pendant la lecture, navigation précédent / suivant
- **Couleurs** : fond #1c1917, texte #f5f0e8, accent #b08d57, surface #292524 · **Typographies** : titres bodoni-moda, texte jost
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 32px, rembourrage 20px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-015 — Prestige

- **Clé** : `prestige.ai-015` · **Direction artistique** : Magazine de luxe · **Secteur cible** : Hôtellerie
- **Usage éditorial** : Une carte ivoire au titre doré mord sur une photo d'hôtel pleine largeur.
- **Composition** : Carte chevauchante — Bandeau d'image, carte de titre qui mord sur l'image.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 2, de fin 2, de corps 2
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carte chevauchante
- **Largeur de lecture** : 620 px · **Métadonnées** : sous la carte · **Auteur** : en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, querylist, sharebuttons · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : carte de titre qui chevauche · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f1ece4, texte #2b2118, accent #8a6a2f, surface #e4dccd · **Typographies** : titres prata, texte lora
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 32px, rembourrage 20px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-016 — Collection

- **Clé** : `collection.ai-016` · **Direction artistique** : Magazine de luxe · **Secteur cible** : Horlogerie
- **Usage éditorial** : Fond anthracite et acier : fiche de la pièce, puis histoire de la manufacture.
- **Composition** : Fiche technique — Bloc de caractéristiques en tête, essai ensuite.
- **Structure générale** : fiche + récit ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 2, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche technique · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : tableau de caractéristiques, image détourée · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #101418, texte #e8e8e8, accent #c0c0c8, surface #1b2128 · **Typographies** : titres marcellus, texte work-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 32px, rembourrage 20px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-017 — Épreuve

- **Clé** : `epreuve.ai-017` · **Direction artistique** : Article photographique · **Secteur cible** : Photographie d'art
- **Usage éditorial** : Une photographie par écran, légende en bas, le texte en petit corps entre deux images.
- **Composition** : Reportage séquentiel — Une image par écran, texte intercalé.
- **Structure générale** : une image par écran ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 1, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 480 px · **Métadonnées** : légende sous chaque image · **Auteur** : en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : défilement image par écran, légendes · **Interactions** : éléments collants pendant la lecture, navigation précédent / suivant
- **Couleurs** : fond #111111, texte #f2f2f2, accent #ff3b30, surface #1c1c1c · **Typographies** : titres syne, texte inter
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-018 — Planche Contact

- **Clé** : `planche-contact.ai-018` · **Direction artistique** : Article photographique · **Secteur cible** : Reportage photo
- **Usage éditorial** : Une planche contact de neuf vignettes ouvre l'article avant le récit.
- **Composition** : Mosaïque d'images — Grille d'images en ouverture, récit dessous.
- **Structure générale** : grille 3 × n puis texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 0, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : mosaïque
- **Largeur de lecture** : 620 px · **Métadonnées** : sous la mosaïque · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, sharebuttons · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : mosaïque, lightbox · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #ececec, texte #111111, accent #e11d48, surface #dcdcdc · **Typographies** : titres space-grotesk, texte dm-sans
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-019 — Chambre Noire

- **Clé** : `chambre-noire.ai-019` · **Direction artistique** : Article photographique · **Secteur cible** : Photographie argentique
- **Usage éditorial** : Les sections changent de fond du noir au gris comme le virage d'un tirage.
- **Composition** : Immersif par chapitres sombres — Fond qui change à chaque section, plein écran.
- **Structure générale** : chapitres sur fonds alternés ; colonne unique, 0 grille(s), variante d'ouverture 2, de fin 0, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 560 px · **Métadonnées** : ligne de prise de vue · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, readingprogress · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : fonds alternés, barre de lecture · **Interactions** : barre de progression de lecture
- **Couleurs** : fond #0b0b0b, texte #e9e4d8, accent #d4a373, surface #161616 · **Typographies** : titres eb-garamond, texte karla
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-020 — Cadre Large

- **Clé** : `cadre-large.ai-020` · **Direction artistique** : Article photographique · **Secteur cible** : Photographie de nature
- **Usage éditorial** : L'image est montée dans un cadre épais, comme accrochée au mur d'une galerie.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 1
- **Titre** : sous l'image · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 600 px · **Métadonnées** : sous le cadre · **Auteur** : en fin · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, querylist, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : cadre épais, légende · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f5f4ef, texte #1d2b24, accent #2d6a4f, surface #e4e6dd · **Typographies** : titres lora, texte source-sans-3
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-021 — Vernissage

- **Clé** : `vernissage.ai-021` · **Direction artistique** : Article artistique · **Secteur cible** : Galerie d'art
- **Usage éditorial** : Une œuvre reste collée à gauche pendant que la critique défile à droite.
- **Composition** : Split vertical — Deux moitiés : image collante à une moitié, titre puis texte à l'autre.
- **Structure générale** : image collante / texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 2
- **Titre** : split droite · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 520 px · **Métadonnées** : dans la moitié texte · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox, postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : image collante · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f4f1ff, texte #1b1530, accent #7c3aed, surface #e6e0fb · **Typographies** : titres young-serif, texte figtree
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-022 — Cartel

- **Clé** : `cartel.ai-022` · **Direction artistique** : Article artistique · **Secteur cible** : Critique d'exposition
- **Usage éditorial** : Un cartel de musée accompagne l'œuvre : artiste, date, technique.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : texte + infobox flottante ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 580 px · **Métadonnées** : cartel de l'œuvre · **Auteur** : signature · **Sidebar** : infobox droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : cartel d'œuvre, infobox · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fafafa, texte #202020, accent #ea580c, surface #eeeeee · **Typographies** : titres bodoni-moda, texte ibm-plex-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-023 — Atelier Ouvert

- **Clé** : `atelier-ouvert.ai-023` · **Direction artistique** : Article artistique · **Secteur cible** : Illustration
- **Usage éditorial** : Le texte contourne les illustrations, qui flottent à gauche puis à droite.
- **Composition** : Lookbook asymétrique — Images alternées en décalage, texte court.
- **Structure générale** : texte qui épouse l'image ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 1, de fin 0, de corps 1
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 560 px · **Métadonnées** : marge · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : texte habillé autour de l'image · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fff7ed, texte #2a1a10, accent #0d9488, surface #fde8d0 · **Typographies** : titres fraunces, texte nunito-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-024 — Passage

- **Clé** : `passage.ai-024` · **Direction artistique** : Article artistique · **Secteur cible** : Art contemporain
- **Usage éditorial** : Le titre est posé à la verticale le long de la marge gauche.
- **Composition** : Imprimé expérimental — Grille de magazine papier, colonnes décalées, folios.
- **Structure générale** : grille décalée ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 1, de fin 2, de corps 2
- **Titre** : vertical · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : mosaïque
- **Largeur de lecture** : 500 px · **Métadonnées** : folio · **Auteur** : colonne latérale · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : titre vertical, folio · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #e5e7eb, texte #0f0f0f, accent #048fa9, surface #d1d5db · **Typographies** : titres unbounded, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-025 — Terminal

- **Clé** : `terminal.ai-025` · **Direction artistique** : Article technologique · **Secteur cible** : Développement logiciel
- **Usage éditorial** : Colonne de code très large, sommaire collé, versions en mono.
- **Composition** : Sommaire latéral collant — Plan de l'article collé à gauche pendant la lecture.
- **Structure générale** : sommaire | code ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 700 px · **Métadonnées** : ligne de version · **Auteur** : carte compacte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : postmeta, postnav, toc · **Blocs à placer dans le contenu** : code
- **Fonctionnalités** : sommaire collant, blocs de code, temps de lecture · **Interactions** : éléments collants pendant la lecture, sommaire à ancres, navigation précédent / suivant
- **Couleurs** : fond #0d1117, texte #e6edf3, accent #3fb950, surface #161b22 · **Typographies** : titres jetbrains-mono, texte ibm-plex-sans
- **Espacements et formes** : arrondi 8px, bordure 1px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-026 — Lancement

- **Clé** : `lancement.ai-026` · **Direction artistique** : Article technologique · **Secteur cible** : Produit SaaS
- **Usage éditorial** : Annonce de produit : carte d'annonce, visuel, puis les nouveautés en liste.
- **Composition** : Carte chevauchante — Bandeau d'image, carte de titre qui mord sur l'image.
- **Structure générale** : 1 colonne ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 1
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carte chevauchante
- **Largeur de lecture** : 640 px · **Métadonnées** : sous le titre · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, sharebuttons · **Blocs à placer dans le contenu** : cta
- **Fonctionnalités** : bandeau d'annonce, appel à l'action · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f5f3ff, texte #1e1b4b, accent #6d28d9, surface #e9e5ff · **Typographies** : titres sora, texte inter
- **Espacements et formes** : arrondi 8px, bordure 1px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-027 — Benchmark

- **Clé** : `benchmark.ai-027` · **Direction artistique** : Article technologique · **Secteur cible** : Matériel informatique
- **Usage éditorial** : Notes et barres de progression avant l'analyse, tableau de mesures en pied.
- **Composition** : Test et verdict — Verdict synthétique en tête, analyse détaillée dessous.
- **Structure générale** : verdict | analyse ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 620 px · **Métadonnées** : bloc verdict · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table, rating, progress
- **Fonctionnalités** : verdict en tête, tableau de mesures · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0f172a, texte #e2e8f0, accent #22d3ee, surface #1e293b · **Typographies** : titres space-grotesk, texte inter
- **Espacements et formes** : arrondi 8px, bordure 1px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-028 — Changelog

- **Clé** : `changelog.ai-028` · **Direction artistique** : Article technologique · **Secteur cible** : Documentation produit
- **Usage éditorial** : Chaque version est un point sur une frise ; la date en police mono.
- **Composition** : Chronologie verticale — Frise centrale, événements à gauche et à droite.
- **Structure générale** : frise de versions ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 0, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 560 px · **Métadonnées** : date de version · **Auteur** : aucune · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, toc · **Blocs à placer dans le contenu** : timeline
- **Fonctionnalités** : frise de versions, ancres · **Interactions** : sommaire à ancres
- **Couleurs** : fond #fafafa, texte #18181b, accent #e76c16, surface #f0f0f0 · **Typographies** : titres ibm-plex-mono, texte ibm-plex-sans
- **Espacements et formes** : arrondi 8px, bordure 1px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-029 — Résumé

- **Clé** : `resume.ai-029` · **Direction artistique** : Article scientifique · **Secteur cible** : Recherche universitaire
- **Usage éditorial** : Résumé encadré, mots-clés, plan numéroté collé, références en pied.
- **Composition** : Dossier scientifique — Résumé, mots-clés, plan numéroté, références.
- **Structure générale** : résumé | plan | texte ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 1, de fin 2, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 680 px · **Métadonnées** : bloc de métadonnées de publication · **Auteur** : liste d'auteurs · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : postmeta, postterms, toc · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : plan numéroté, mots-clés, bloc « comment citer » · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #ffffff, texte #0f172a, accent #1d4ed8, surface #f1f5f9 · **Typographies** : titres source-serif-4, texte ibm-plex-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-030 — Figure 1

- **Clé** : `figure-1.ai-030` · **Direction artistique** : Article scientifique · **Secteur cible** : Vulgarisation
- **Usage éditorial** : Une figure en pleine largeur ouvre l'article ; le texte l'explique.
- **Composition** : Données et infographie — Chiffres et figure pleine largeur avant le texte.
- **Structure générale** : figure + texte ; colonne unique, 0 grille(s), variante d'ouverture 2, de fin 1, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : pleine largeur
- **Largeur de lecture** : 620 px · **Métadonnées** : sous la figure · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : motionchart, table
- **Fonctionnalités** : figure pleine largeur, graphique · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f0fdf4, texte #052e16, accent #16a34a, surface #dcfce7 · **Typographies** : titres literata, texte figtree
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-031 — Protocole

- **Clé** : `protocole.ai-031` · **Direction artistique** : Article scientifique · **Secteur cible** : Laboratoire
- **Usage éditorial** : Fiche de matériel, étapes numérotées et encadré de précautions modifiable.
- **Composition** : Guide pas à pas — Fiche pratique puis étapes numérotées.
- **Structure générale** : fiche + étapes ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche du protocole · **Auteur** : carte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : alert, postmeta · **Blocs à placer dans le contenu** : list
- **Fonctionnalités** : étapes numérotées, encadré de sécurité · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f8fafc, texte #0b1220, accent #0891b2, surface #e2e8f0 · **Typographies** : titres red-hat-display, texte ibm-plex-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-032 — Revue

- **Clé** : `revue.ai-032` · **Direction artistique** : Article scientifique · **Secteur cible** : Revue académique
- **Usage éditorial** : Page de revue : infobox de publication, sommaire, notes numérotées.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : infobox + sommaire ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 0, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 660 px · **Métadonnées** : infobox · **Auteur** : liste d'auteurs · **Sidebar** : infobox droite
- **Widgets d'accompagnement posés** : postmeta, toc · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : infobox, références · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #fffdf7, texte #1b1b1b, accent #7a1f1f, surface #f1ecdd · **Typographies** : titres spectral, texte source-sans-3
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-033 — Cours du Jour

- **Clé** : `cours-du-jour.ai-033` · **Direction artistique** : Article financier · **Secteur cible** : Marchés
- **Usage éditorial** : Bandeau de chiffres clés au-dessus du titre, avertissement éditorial en pied.
- **Composition** : Données et infographie — Chiffres et figure pleine largeur avant le texte.
- **Structure générale** : bandeau de chiffres + texte ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 2, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 640 px · **Métadonnées** : ligne de marché · **Auteur** : carte compacte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : alert, postmeta · **Blocs à placer dans le contenu** : motionnumberticker, table
- **Fonctionnalités** : bandeau de chiffres, avertissement modifiable · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #06281f, texte #eafaf1, accent #34d399, surface #0b3b2d · **Typographies** : titres archivo, texte source-serif-4
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-034 — Bilan

- **Clé** : `bilan.ai-034` · **Direction artistique** : Article financier · **Secteur cible** : Économie d'entreprise
- **Usage éditorial** : Tableaux en pleine largeur, lecture sobre, encadré de synthèse.
- **Composition** : Fiche technique — Bloc de caractéristiques en tête, essai ensuite.
- **Structure générale** : fiche + analyse ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 660 px · **Métadonnées** : bloc de chiffres · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : tableaux larges, encadré « à retenir » · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f6f7fb, texte #111827, accent #b45309, surface #e5e7f0 · **Typographies** : titres libre-baskerville, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-035 — Mandat

- **Clé** : `mandat.ai-035` · **Direction artistique** : Article financier · **Secteur cible** : Banque privée
- **Usage éditorial** : Tribune signée : le portrait de l'auteur ouvre la page, la signature la ferme.
- **Composition** : Tribune d'opinion — Portrait de l'auteur en grand, texte centré, signature.
- **Structure générale** : portrait + texte centré ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 1, de corps 1
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 560 px · **Métadonnées** : signature · **Auteur** : portrait en tête · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox, postmeta, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : portrait de l'auteur, signature · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #14213d, texte #f8f9fa, accent #fca311, surface #1d2d50 · **Typographies** : titres playfair-display, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-036 — Perspective

- **Clé** : `perspective.ai-036` · **Direction artistique** : Article économique · **Secteur cible** : Analyse macro
- **Usage éditorial** : Rail collant qui garde auteur, partage et repères sous les yeux.
- **Composition** : Rail droit collant — Panneau auteur, partage et repères collé à droite.
- **Structure générale** : texte + rail collant ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 620 px · **Métadonnées** : dans le rail · **Auteur** : dans le rail · **Sidebar** : droite sticky
- **Widgets d'accompagnement posés** : authorbox, postmeta, querylist, sharebuttons · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : rail collant, recommandations · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fafaf9, texte #1c1917, accent #dc2626, surface #ece9e4 · **Typographies** : titres newsreader, texte inter-tight
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-037 — Passerelle

- **Clé** : `passerelle.ai-037` · **Direction artistique** : Article de mode · **Secteur cible** : Défilés
- **Usage éditorial** : Portraits verticaux en cascade, texte en petites interventions.
- **Composition** : Lookbook asymétrique — Images alternées en décalage, texte court.
- **Structure générale** : images décalées ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 0
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 480 px · **Métadonnées** : ligne fine · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : images décalées, texte court · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #fdf2f8, texte #2b1020, accent #db2777, surface #fbd5ea · **Typographies** : titres bodoni-moda, texte jost
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-038 — Lookbook

- **Clé** : `lookbook.ai-038` · **Direction artistique** : Article de mode · **Secteur cible** : Prêt-à-porter
- **Usage éditorial** : L'image de la collection reste fixe ; texte et pièces défilent à côté.
- **Composition** : Split vertical — Deux moitiés : image collante à une moitié, titre puis texte à l'autre.
- **Structure générale** : image collante ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 0, de fin 2, de corps 1
- **Titre** : split droite · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 500 px · **Métadonnées** : dans la moitié texte · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, querylist · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : image collante, suggestions de la même rubrique · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #111111, texte #fafafa, accent #ff5a5f, surface #1e1e1e · **Typographies** : titres yeseva-one, texte dm-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-039 — Maille

- **Clé** : `maille.ai-039` · **Direction artistique** : Article de mode · **Secteur cible** : Mode durable
- **Usage éditorial** : Teintes de lin et de sauge, image encadrée comme une étiquette de vêtement.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 1, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 560 px · **Métadonnées** : sous le titre · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : cadre épais, citation · **Interactions** : navigation précédent / suivant
- **Couleurs** : fond #eef2e6, texte #26301e, accent #808d6c, surface #dfe7d0 · **Typographies** : titres fraunces, texte karla
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-040 — Coulisses

- **Clé** : `coulisses.ai-040` · **Direction artistique** : Article de mode · **Secteur cible** : Reportage de mode
- **Usage éditorial** : Interview : portrait à gauche, questions en gras, réponses en retrait.
- **Composition** : Interview en dialogue — Portrait de l'invité, questions et réponses alternées.
- **Structure générale** : dialogue ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 580 px · **Métadonnées** : en tête · **Auteur** : portrait invité · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox, postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : questions et réponses, portrait · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fff1e6, texte #1f1308, accent #c2410c, surface #ffe0c7 · **Typographies** : titres cormorant-garamond, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-041 — Carnet d'Ailleurs

- **Clé** : `carnet-d-ailleurs.ai-041` · **Direction artistique** : Article de voyage · **Secteur cible** : Récit de voyage
- **Usage éditorial** : Bandeau de lieu et d'altitude, annotations manuscrites dans la marge.
- **Composition** : Carnet de lieu — Bandeau de lieu, notes de marge, récit.
- **Structure générale** : bandeau de lieu + marges ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 600 px · **Métadonnées** : bandeau de lieu · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav · **Blocs à placer dans le contenu** : map, gallery
- **Fonctionnalités** : carte du lieu, notes de marge · **Interactions** : éléments collants pendant la lecture, navigation précédent / suivant
- **Couleurs** : fond #f4efe1, texte #2d2a1f, accent #0f766e, surface #e6dfc8 · **Typographies** : titres caveat, texte lora
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-042 — Horizon

- **Clé** : `horizon.ai-042` · **Direction artistique** : Article de voyage · **Secteur cible** : Destination
- **Usage éditorial** : Un horizon plein écran, titre condensé sur le ciel, itinéraire en dessous.
- **Composition** : Ouverture superposée — Image à l'écran entier, titre posé sur l'image, texte ensuite.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 2, de corps 2
- **Titre** : superposé bas-gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 640 px · **Métadonnées** : sous le titre · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, querylist · **Blocs à placer dans le contenu** : map
- **Fonctionnalités** : image plein écran, carte · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0e2a47, texte #f8fafc, accent #f59e0b, surface #173b63 · **Typographies** : titres barlow-condensed, texte source-sans-3
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-043 — Étapes

- **Clé** : `etapes.ai-043` · **Direction artistique** : Article de voyage · **Secteur cible** : Itinéraire
- **Usage éditorial** : Chaque jour est un point de la frise ; photo et texte à côté.
- **Composition** : Chronologie verticale — Frise centrale, événements à gauche et à droite.
- **Structure générale** : frise des étapes ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 560 px · **Métadonnées** : jour par jour · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : timeline, gallery
- **Fonctionnalités** : frise des étapes, galerie par étape · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #fff8e6, texte #1b2a41, accent #df6c50, surface #fde9b8 · **Typographies** : titres bricolage-grotesque, texte figtree
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-044 — Terre Rouge

- **Clé** : `terre-rouge.ai-044` · **Direction artistique** : Article de voyage · **Secteur cible** : Voyage d'aventure
- **Usage éditorial** : Titres écrasants en condensé sur fond de terre, chapitres plein écran.
- **Composition** : Long format à chapitres — Sections successives avec progression de lecture.
- **Structure générale** : chapitres plein écran ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 1, de corps 1
- **Titre** : monumental pleine largeur · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 600 px · **Métadonnées** : altitude et distance · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, readingprogress · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : chapitres plein écran, barre de lecture · **Interactions** : éléments collants pendant la lecture, barre de progression de lecture
- **Couleurs** : fond #3b1f14, texte #f6e9dc, accent #ff7b00, surface #52301f · **Typographies** : titres anton, texte karla
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-045 — Mise en Place

- **Clé** : `mise-en-place.ai-045` · **Direction artistique** : Article gastronomique · **Secteur cible** : Cuisine
- **Usage éditorial** : Fiche de la recette à droite, étapes numérotées avec photo habillée.
- **Composition** : Guide pas à pas — Fiche pratique puis étapes numérotées.
- **Structure générale** : fiche + étapes ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche pratique · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, toc · **Blocs à placer dans le contenu** : list, gallery
- **Fonctionnalités** : fiche pratique, étapes numérotées · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #fff9f0, texte #2b1b12, accent #b91c1c, surface #fdebd0 · **Typographies** : titres fraunces, texte nunito-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-046 — Table du Chef

- **Clé** : `table-du-chef.ai-046` · **Direction artistique** : Article gastronomique · **Secteur cible** : Restaurant
- **Usage éditorial** : Le plat reste visible pendant que l'histoire du chef défile.
- **Composition** : Split vertical — Deux moitiés : image collante à une moitié, titre puis texte à l'autre.
- **Structure générale** : image collante ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 0, de corps 0
- **Titre** : split droite · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 520 px · **Métadonnées** : dans la moitié texte · **Auteur** : portrait · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : map
- **Fonctionnalités** : image collante, adresse · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #1f2a24, texte #f4f1e8, accent #e9c46a, surface #2c3b33 · **Typographies** : titres playfair-display, texte dm-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-047 — Marché

- **Clé** : `marche.ai-047` · **Direction artistique** : Article gastronomique · **Secteur cible** : Produits de saison
- **Usage éditorial** : Étal de produits en mosaïque avant le texte.
- **Composition** : Mosaïque d'images — Grille d'images en ouverture, récit dessous.
- **Structure générale** : mosaïque puis texte ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 3, de fin 2, de corps 1
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : mosaïque
- **Largeur de lecture** : 580 px · **Métadonnées** : saison en tête · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postterms · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : mosaïque de produits, étiquettes de saison · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f7fbe8, texte #25301a, accent #df6c4f, surface #e9f1c9 · **Typographies** : titres young-serif, texte work-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-048 — Mi-Temps

- **Clé** : `mi-temps.ai-048` · **Direction artistique** : Article sportif · **Secteur cible** : Football
- **Usage éditorial** : Bloc de score en tête, classement en tableau, carte de titre sur l'action.
- **Composition** : Carte chevauchante — Bandeau d'image, carte de titre qui mord sur l'image.
- **Structure générale** : texte + rail ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 1, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carte chevauchante
- **Largeur de lecture** : 600 px · **Métadonnées** : score et date en tête · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta, sharebuttons · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : bloc de score, tableau de classement · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #06241a, texte #f3faf6, accent #b6ff3b, surface #0d3b2a · **Typographies** : titres teko, texte inter
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-049 — Effort

- **Clé** : `effort.ai-049` · **Direction artistique** : Article sportif · **Secteur cible** : Course à pied
- **Usage éditorial** : Compteurs de distance et de temps qui s'animent à l'ouverture.
- **Composition** : Ouverture superposée — Image à l'écran entier, titre posé sur l'image, texte ensuite.
- **Structure générale** : 1 colonne ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 1, de corps 1
- **Titre** : superposé bas-gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 620 px · **Métadonnées** : distance et temps · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : motionnumberticker
- **Fonctionnalités** : compteurs animés, barre de lecture · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #111111, texte #f6f6f6, accent #ff4500, surface #1c1c1c · **Typographies** : titres oswald, texte barlow
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-050 — Séance

- **Clé** : `seance.ai-050` · **Direction artistique** : Article sportif · **Secteur cible** : Entraînement
- **Usage éditorial** : Plan de séance découpé en blocs, barre de progression par bloc.
- **Composition** : Guide pas à pas — Fiche pratique puis étapes numérotées.
- **Structure générale** : fiche + étapes ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche d'entraînement · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : alert, postmeta · **Blocs à placer dans le contenu** : list, progress
- **Fonctionnalités** : plan de séance, progression · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #eaf4ff, texte #0b2239, accent #e26207, surface #d6e8fb · **Typographies** : titres bebas-neue, texte figtree
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-051 — Tribune du Stade

- **Clé** : `tribune-du-stade.ai-051` · **Direction artistique** : Article sportif · **Secteur cible** : Analyse tactique
- **Usage éditorial** : Trois colonnes d'analyse avec tableaux de compositions d'équipes.
- **Composition** : Trois colonnes magazine — Sommaire, texte et rail d'accompagnement côte à côte.
- **Structure générale** : sommaire | texte | rail ; jusqu'à 3 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 580 px · **Métadonnées** : rail · **Auteur** : rail · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta, querylist, toc · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : sommaire sticky, tableaux de composition · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #f8f9fa, texte #1b1f23, accent #2563eb, surface #e9ecef · **Typographies** : titres league-spartan, texte source-sans-3
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-052 — Essai Routier

- **Clé** : `essai-routier.ai-052` · **Direction artistique** : Article automobile · **Secteur cible** : Essai automobile
- **Usage éditorial** : Panoramique sur la route, verdict noté avant l'essai complet.
- **Composition** : Test et verdict — Verdict synthétique en tête, analyse détaillée dessous.
- **Structure générale** : verdict | essai ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 660 px · **Métadonnées** : bloc verdict · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : rating, table, gallery
- **Fonctionnalités** : verdict en tête, fiche technique · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0f1115, texte #f2f2f2, accent #ff2d2d, surface #1a1d22 · **Typographies** : titres archivo, texte inter
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-053 — Concept

- **Clé** : `concept.ai-053` · **Direction artistique** : Article automobile · **Secteur cible** : Concept-car
- **Usage éditorial** : Fond nuit, image en parallaxe, sections qui s'allument l'une après l'autre.
- **Composition** : Immersif par chapitres sombres — Fond qui change à chaque section, plein écran.
- **Structure générale** : chapitres sombres ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 1, de corps 1
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 560 px · **Métadonnées** : au pied du titre · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery, motionimageparallax
- **Fonctionnalités** : parallaxe d'image, chapitres · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #050816, texte #eef2ff, accent #7dd3fc, surface #0c1230 · **Typographies** : titres syne, texte space-grotesk
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-054 — Fiche de Série

- **Clé** : `fiche-de-serie.ai-054` · **Direction artistique** : Article automobile · **Secteur cible** : Fiche technique
- **Usage éditorial** : Voiture détourée, tableau de motorisations en tête.
- **Composition** : Fiche technique — Bloc de caractéristiques en tête, essai ensuite.
- **Structure générale** : fiche + texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 640 px · **Métadonnées** : tableau technique · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : table, gallery
- **Fonctionnalités** : tableau de motorisations, galerie · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f4f6f8, texte #101418, accent #0e94d0, surface #e3e8ee · **Typographies** : titres chivo, texte public-sans
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-055 — Plan Libre

- **Clé** : `plan-libre.ai-055` · **Direction artistique** : Article architectural · **Secteur cible** : Architecture
- **Usage éditorial** : Fiche projet dessinée comme un cartouche de plan.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : texte + fiche projet ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 0, de corps 0
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 620 px · **Métadonnées** : fiche projet · **Auteur** : carte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : postmeta, querylist · **Blocs à placer dans le contenu** : table, gallery
- **Fonctionnalités** : fiche projet, projets voisins · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #eceae6, texte #141414, accent #a67e16, surface #dcd9d3 · **Typographies** : titres instrument-serif, texte ibm-plex-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-056 — Élévation

- **Clé** : `elevation.ai-056` · **Direction artistique** : Article architectural · **Secteur cible** : Architecture d'intérieur
- **Usage éditorial** : Comparateur avant/après, texte sobre.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 1
- **Titre** : sous l'image · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : pleine largeur
- **Largeur de lecture** : 600 px · **Métadonnées** : sous l'image · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery, beforeafter
- **Fonctionnalités** : avant / après, galerie · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f8f6f2, texte #2d2a26, accent #0f766e, surface #ece8df · **Typographies** : titres gelasio, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-057 — Béton

- **Clé** : `beton.ai-057` · **Direction artistique** : Article architectural · **Secteur cible** : Urbanisme
- **Usage éditorial** : Gris béton et jaune de chantier, grille brute et décalée.
- **Composition** : Imprimé expérimental — Grille de magazine papier, colonnes décalées, folios.
- **Structure générale** : grille décalée ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 2
- **Titre** : vertical · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 540 px · **Métadonnées** : folio · **Auteur** : marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : titre vertical, grille brute · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #c9c9c4, texte #111111, accent #7a670a, surface #b5b5af · **Typographies** : titres archivo, texte ibm-plex-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-058 — Visite

- **Clé** : `visite.ai-058` · **Direction artistique** : Article immobilier · **Secteur cible** : Annonce de bien
- **Usage éditorial** : Mosaïque de photos, fiche du bien et contact collés à droite.
- **Composition** : Fiche technique — Bloc de caractéristiques en tête, essai ensuite.
- **Structure générale** : mosaïque + fiche ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 0, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : mosaïque
- **Largeur de lecture** : 620 px · **Métadonnées** : fiche du bien · **Auteur** : carte contact · **Sidebar** : droite sticky
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : gallery, table, map
- **Fonctionnalités** : mosaïque, plan d'accès, contact · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffffff, texte #0b2239, accent #e11d48, surface #f1f5f9 · **Typographies** : titres manrope, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-059 — Quartier

- **Clé** : `quartier.ai-059` · **Direction artistique** : Article immobilier · **Secteur cible** : Guide de quartier
- **Usage éditorial** : Bandeau de quartier avec carte, adresses utiles en liste.
- **Composition** : Carnet de lieu — Bandeau de lieu, notes de marge, récit.
- **Structure générale** : bandeau de lieu + texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 600 px · **Métadonnées** : bandeau de quartier · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : map, list
- **Fonctionnalités** : carte, adresses utiles · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #e8f1f2, texte #13293d, accent #006494, surface #d3e5e8 · **Typographies** : titres red-hat-display, texte public-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-060 — Conseil de Notaire

- **Clé** : `conseil-de-notaire.ai-060` · **Direction artistique** : Article immobilier · **Secteur cible** : Conseil juridique
- **Usage éditorial** : Plan numéroté, date de mise à jour visible, avertissement de portée générale.
- **Composition** : Dossier scientifique — Résumé, mots-clés, plan numéroté, références.
- **Structure générale** : résumé | plan | texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 2, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 640 px · **Métadonnées** : date de mise à jour · **Auteur** : carte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : alert, postmeta, toc · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : plan numéroté, avertissement modifiable · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #fbfbfd, texte #1b2559, accent #b8860b, surface #eceef8 · **Typographies** : titres libre-baskerville, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-061 — Leçon

- **Clé** : `lecon.ai-061` · **Direction artistique** : Article éducatif · **Secteur cible** : Cours en ligne
- **Usage éditorial** : Objectifs d'apprentissage en tête, corrigés cachés dans des volets repliables.
- **Composition** : Guide pas à pas — Fiche pratique puis étapes numérotées.
- **Structure générale** : objectifs | étapes ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 640 px · **Métadonnées** : durée de lecture · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta, readingprogress, toc · **Blocs à placer dans le contenu** : accordion
- **Fonctionnalités** : objectifs, barre de progression, corrigés repliables · **Interactions** : éléments collants pendant la lecture, barre de progression de lecture, sommaire à ancres
- **Couleurs** : fond #fffbea, texte #1f2937, accent #2563eb, surface #fef3c7 · **Typographies** : titres lexend, texte lexend
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-062 — Cahier

- **Clé** : `cahier.ai-062` · **Direction artistique** : Article éducatif · **Secteur cible** : Pédagogie
- **Usage éditorial** : Marge de cahier d'écolier, encadrés « à retenir ».
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : colonne + marge de notes ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 3, de fin 1, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 560 px · **Métadonnées** : marge · **Auteur** : marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : notes de marge, encadrés « à retenir » · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fff9db, texte #1c1917, accent #16a34a, surface #fdf0a6 · **Typographies** : titres caveat, texte nunito-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-063 — Amphi

- **Clé** : `amphi.ai-063` · **Direction artistique** : Article universitaire · **Secteur cible** : Enseignement supérieur
- **Usage éditorial** : Plan du cours collé à gauche, bibliographie en pied.
- **Composition** : Sommaire latéral collant — Plan de l'article collé à gauche pendant la lecture.
- **Structure générale** : sommaire | texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 680 px · **Métadonnées** : plan du cours · **Auteur** : carte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : postmeta, querylist, toc · **Blocs à placer dans le contenu** : table
- **Fonctionnalités** : plan du cours, bibliographie · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #f8f9fb, texte #102a43, accent #c1121f, surface #e4e8ef · **Typographies** : titres crimson-pro, texte public-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-064 — Atelier Junior

- **Clé** : `atelier-junior.ai-064` · **Direction artistique** : Article éducatif · **Secteur cible** : Jeunesse
- **Usage éditorial** : Pastilles colorées et images qui alternent, ton ludique.
- **Composition** : Lookbook asymétrique — Images alternées en décalage, texte court.
- **Structure générale** : images alternées ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 0, de corps 2
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 560 px · **Métadonnées** : badges · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : pastilles colorées, images alternées · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #e8f7ff, texte #0c2d48, accent #d86e56, surface #c7ecff · **Typographies** : titres fredoka, texte nunito-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-065 — Générique

- **Clé** : `generique.ai-065` · **Direction artistique** : Article cinématographique · **Secteur cible** : Critique de film
- **Usage éditorial** : Titre en lettres de générique sur une image plein écran, note en fin.
- **Composition** : Long format à chapitres — Sections successives avec progression de lecture.
- **Structure générale** : chapitres sombres ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 2, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 560 px · **Métadonnées** : fiche du film · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : rating, gallery
- **Fonctionnalités** : affiche plein écran, note · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0a0a0a, texte #f5f5f5, accent #e50914, surface #161616 · **Typographies** : titres limelight, texte inter
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-066 — Pochette

- **Clé** : `pochette.ai-066` · **Direction artistique** : Article musical · **Secteur cible** : Critique d'album
- **Usage éditorial** : Pochette carrée collée à gauche, lecteur et liste des pistes.
- **Composition** : Split vertical — Deux moitiés : image collante à une moitié, titre puis texte à l'autre.
- **Structure générale** : image collante ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 1, de corps 2
- **Titre** : split droite · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carré décalé
- **Largeur de lecture** : 540 px · **Métadonnées** : fiche de l'album · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : audio, list
- **Fonctionnalités** : lecteur audio, liste des pistes · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #1b1035, texte #f4efff, accent #ff9f1c, surface #2a1a52 · **Typographies** : titres syne, texte dm-sans
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-067 — Plateau

- **Clé** : `plateau.ai-067` · **Direction artistique** : Article musical · **Secteur cible** : Podcast
- **Usage éditorial** : Le lecteur est la première chose vue, la transcription suit avec ses chapitres.
- **Composition** : Audio d'abord — Lecteur audio en tête, transcription dessous.
- **Structure générale** : lecteur | transcription ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carré décalé
- **Largeur de lecture** : 620 px · **Métadonnées** : épisode et durée · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta, sharebuttons, toc · **Blocs à placer dans le contenu** : audio
- **Fonctionnalités** : lecteur audio en tête, transcription avec chapitres · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #fef3f2, texte #2a0a08, accent #d92d20, surface #fde1de · **Typographies** : titres bricolage-grotesque, texte figtree
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-068 — Projection

- **Clé** : `projection.ai-068` · **Direction artistique** : Article cinématographique · **Secteur cible** : Entretien de réalisateur
- **Usage éditorial** : Vidéo large dans un cadre sombre, notes écrites dessous.
- **Composition** : Vidéo d'abord — Vidéo large en tête, notes écrites dessous.
- **Structure générale** : vidéo | notes ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : vidéo
- **Largeur de lecture** : 640 px · **Métadonnées** : sous la vidéo · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : video
- **Fonctionnalités** : vidéo en tête, notes écrites · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #12100e, texte #efe8dc, accent #d4af37, surface #1c1916 · **Typographies** : titres gloock, texte karla
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-069 — Affiche de Scène

- **Clé** : `affiche-de-scene.ai-069` · **Direction artistique** : Article de divertissement · **Secteur cible** : Spectacle
- **Usage éditorial** : Affiche typographique avec compte à rebours jusqu'au lever de rideau.
- **Composition** : Affiche typographique — Titre monumental seul, sans image ; le texte démarre sous l'affiche.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 2, de corps 2
- **Titre** : monumental pleine largeur · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 580 px · **Métadonnées** : dates et lieu · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : countdown, map
- **Fonctionnalités** : compte à rebours, carte de la salle · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #2d0a31, texte #fff4d6, accent #ff3cac, surface #411246 · **Typographies** : titres abril-fatface, texte dm-sans
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-070 — Saison

- **Clé** : `saison.ai-070` · **Direction artistique** : Article culturel · **Secteur cible** : Festival
- **Usage éditorial** : Le programme s'affiche en frise jour par jour.
- **Composition** : Chronologie verticale — Frise centrale, événements à gauche et à droite.
- **Structure générale** : programme en frise ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 2, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 600 px · **Métadonnées** : dates · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : timeline, gallery
- **Fonctionnalités** : programme en frise · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fffbeb, texte #2b2d42, accent #df243c, surface #fdeeb5 · **Typographies** : titres rozha-one, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-071 — Passerelle Culturelle

- **Clé** : `passerelle-culturelle.ai-071` · **Direction artistique** : Article culturel · **Secteur cible** : Musée
- **Usage éditorial** : Infobox d'horaires et d'accès, texte de salle.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : texte + infobox ; jusqu'à 2 colonnes, 3 grille(s), variante d'ouverture 2, de fin 1, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 600 px · **Métadonnées** : infobox horaires · **Auteur** : carte · **Sidebar** : infobox droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table, map
- **Fonctionnalités** : infobox pratique, plan d'accès · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ede9e0, texte #1e1b16, accent #7c2d12, surface #ded8c9 · **Typographies** : titres cardo, texte source-sans-3
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-072 — Cabinet

- **Clé** : `cabinet.ai-072` · **Direction artistique** : Article de santé · **Secteur cible** : Santé grand public
- **Usage éditorial** : Résumé, plan, date de révision et sources, avertissement clair.
- **Composition** : Dossier scientifique — Résumé, mots-clés, plan numéroté, références.
- **Structure générale** : résumé | plan | texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 640 px · **Métadonnées** : date de mise à jour · **Auteur** : carte validée · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : alert, postcomments, postmeta, toc · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : avertissement médical modifiable, date de mise à jour, sources · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #f0f9ff, texte #0c2340, accent #0284c7, surface #dff1fb · **Typographies** : titres lexend, texte public-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-073 — Souffle

- **Clé** : `souffle.ai-073` · **Direction artistique** : Article de bien-être · **Secteur cible** : Yoga et méditation
- **Usage éditorial** : Sauge, grandes marges, lecteur audio pour une pratique guidée.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : 1 colonne ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 580 px · **Métadonnées** : pied de texte · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : audio
- **Fonctionnalités** : audio guidé, citation douce · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f2f6f0, texte #233127, accent #75907d, surface #e0e9dc · **Typographies** : titres cormorant-garamond, texte nunito-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-074 — Nutrition

- **Clé** : `nutrition.ai-074` · **Direction artistique** : Article de santé · **Secteur cible** : Nutrition
- **Usage éditorial** : Tableau nutritionnel et liste d'ingrédients à côté du récit.
- **Composition** : Guide pas à pas — Fiche pratique puis étapes numérotées.
- **Structure générale** : fiche + étapes ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 0, de fin 2, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 620 px · **Métadonnées** : fiche nutritionnelle · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table, list
- **Fonctionnalités** : tableau nutritionnel, liste d'ingrédients · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fffaf0, texte #2a2118, accent #639e0d, surface #f6edd6 · **Typographies** : titres fraunces, texte mulish
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-075 — Étude de Cas

- **Clé** : `etude-de-cas.ai-075` · **Direction artistique** : Article d'entreprise · **Secteur cible** : Conseil
- **Usage éditorial** : Résultats chiffrés en tête, récit chronologique, citation du client.
- **Composition** : Mosaïque d'images — Grille d'images en ouverture, récit dessous.
- **Structure générale** : chiffres + récit ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 1, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 640 px · **Métadonnées** : bloc de résultats · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : motionnumberticker, cta
- **Fonctionnalités** : résultats chiffrés, citation de client · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f3f6fb, texte #0b1f3a, accent #0e7490, surface #e0e8f3 · **Typographies** : titres manrope, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-076 — Rapport

- **Clé** : `rapport.ai-076` · **Direction artistique** : Article institutionnel · **Secteur cible** : Institution
- **Usage éditorial** : Grille formelle, pièces jointes listées, informations de publication.
- **Composition** : Communiqué formel — Grille sobre, bloc d'informations, pièces jointes.
- **Structure générale** : grille formelle ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 1, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 660 px · **Métadonnées** : bloc d'informations · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : table, list
- **Fonctionnalités** : pièces jointes, informations de publication · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffffff, texte #1d1d1b, accent #005a9c, surface #f0f2f4 · **Typographies** : titres public-sans, texte public-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-077 — Campagne

- **Clé** : `campagne.ai-077` · **Direction artistique** : Article marketing · **Secteur cible** : Marketing
- **Usage éditorial** : Carte de titre vive, formulaire d'inscription à la lettre au milieu du texte.
- **Composition** : Carte chevauchante — Bandeau d'image, carte de titre qui mord sur l'image.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 1, de corps 0
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carte chevauchante
- **Largeur de lecture** : 620 px · **Métadonnées** : sous la carte · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, sharebuttons · **Blocs à placer dans le contenu** : cta, emailsubscribe
- **Fonctionnalités** : inscription à la lettre, appel à l'action · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #fff1f2, texte #2b0a14, accent #e11d48, surface #ffdde1 · **Typographies** : titres syne, texte dm-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-078 — Place Publique

- **Clé** : `place-publique.ai-078` · **Direction artistique** : Article communautaire · **Secteur cible** : Association
- **Usage éditorial** : Rail d'actions collant : partager, s'inscrire, répondre.
- **Composition** : Rail droit collant — Panneau auteur, partage et repères collé à droite.
- **Structure générale** : texte + rail ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 2, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 600 px · **Métadonnées** : rail · **Auteur** : rail · **Sidebar** : droite sticky
- **Widgets d'accompagnement posés** : postcomments, postmeta, sharebuttons · **Blocs à placer dans le contenu** : emailsubscribe
- **Fonctionnalités** : rail d'actions, commentaires · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fffbe6, texte #27210a, accent #b45309, surface #fdf0b0 · **Typographies** : titres young-serif, texte nunito-sans
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-079 — Mot du Directeur

- **Clé** : `mot-du-directeur.ai-079` · **Direction artistique** : Article d'entreprise · **Secteur cible** : Communication interne
- **Usage éditorial** : En-tête de lettre, formule d'appel, signature manuscrite en pied.
- **Composition** : Lettre — Mise en page de lettre : en-tête, destinataire, texte, signature.
- **Structure générale** : lettre ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 2, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 560 px · **Métadonnées** : en-tête de lettre · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : authorbox · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : mise en page de lettre · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f7f4ee, texte #1b2a3a, accent #a4161a, surface #ebe5d8 · **Typographies** : titres eb-garamond, texte source-sans-3
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-080 — Lettre Ouverte

- **Clé** : `lettre-ouverte.ai-080` · **Direction artistique** : Article institutionnel · **Secteur cible** : Plaidoyer
- **Usage éditorial** : Destinataire en tête, texte, appel à signer.
- **Composition** : Lettre — Mise en page de lettre : en-tête, destinataire, texte, signature.
- **Structure générale** : lettre ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 1, de fin 1, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 600 px · **Métadonnées** : destinataire · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : sharebuttons · **Blocs à placer dans le contenu** : emailsubscribe
- **Fonctionnalités** : destinataire, appel à signer · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f1f5f9, texte #0f172a, accent #dc2626, surface #e2e8f0 · **Typographies** : titres libre-baskerville, texte inter-tight
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-081 — Journal

- **Clé** : `journal.ai-081` · **Direction artistique** : Article personnel · **Secteur cible** : Blog personnel
- **Usage éditorial** : La date en grand à gauche comme une page de carnet.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : colonne + date en marge ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : flottante habillée
- **Largeur de lecture** : 560 px · **Métadonnées** : date en grand à gauche · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav, postterms · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : date monumentale, étiquettes · **Interactions** : éléments collants pendant la lecture, navigation précédent / suivant
- **Couleurs** : fond #fef6ec, texte #2c1810, accent #d62828, surface #fbe6cc · **Typographies** : titres caveat, texte lora
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-082 — Cap Intérieur

- **Clé** : `cap-interieur.ai-082` · **Direction artistique** : Article de développement personnel · **Secteur cible** : Coaching
- **Usage éditorial** : Portrait de l'auteur, une phrase clé en exergue, appel à l'action doux.
- **Composition** : Tribune d'opinion — Portrait de l'auteur en grand, texte centré, signature.
- **Structure générale** : portrait + texte centré ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 0, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 580 px · **Métadonnées** : signature · **Auteur** : portrait · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : cta
- **Fonctionnalités** : citation en exergue, appel à l'action · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #fff4e6, texte #2f1b0c, accent #e8590c, surface #ffe3c4 · **Typographies** : titres bricolage-grotesque, texte lora
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-083 — Fiche de Lecture

- **Clé** : `fiche-de-lecture.ai-083` · **Direction artistique** : Article personnel · **Secteur cible** : Critique de livre
- **Usage éditorial** : Couverture détourée, note, citations choisies.
- **Composition** : Test et verdict — Verdict synthétique en tête, analyse détaillée dessous.
- **Structure générale** : verdict | analyse ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 3, de fin 2, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 620 px · **Métadonnées** : bloc de lecture · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : rating
- **Fonctionnalités** : note, citations choisies · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #faf5ff, texte #2e1065, accent #9333ea, surface #efe1fc · **Typographies** : titres literata, texte work-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-084 — Scrollytelling

- **Clé** : `scrollytelling.ai-084` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Narration visuelle
- **Usage éditorial** : Chaque scène occupe l'écran et se transforme au défilement.
- **Composition** : Reportage séquentiel — Une image par écran, texte intercalé.
- **Structure générale** : scènes plein écran ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 1, de corps 2
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 520 px · **Métadonnées** : ligne de repère · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, readingprogress · **Blocs à placer dans le contenu** : motionstickystory
- **Fonctionnalités** : scènes collantes, barre de lecture · **Interactions** : barre de progression de lecture
- **Couleurs** : fond #06060a, texte #f0f0ff, accent #8f62f6, surface #101018 · **Typographies** : titres unbounded, texte inter
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-085 — Typographie Cinétique

- **Clé** : `typographie-cinetique.ai-085` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Design
- **Usage éditorial** : Le titre se déploie lettre à lettre ; la page reste lisible sans mouvement.
- **Composition** : Manifeste typographique — Texte seul en très grand corps, rythme par la typographie.
- **Structure générale** : texte en grand corps ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 1, de corps 0
- **Titre** : monumental pleine largeur · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 700 px · **Métadonnées** : après le texte · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : motionkinetictext
- **Fonctionnalités** : titre cinétique · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #f4f4f0, texte #0a0a0a, accent #ff3d00, surface #e6e6e0 · **Typographies** : titres anybody, texte inter-tight
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-086 — Papier Découpé

- **Clé** : `papier-decoupe.ai-086` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Édition indépendante
- **Usage éditorial** : Jaune éditorial et collage de colonnes décalées.
- **Composition** : Imprimé expérimental — Grille de magazine papier, colonnes décalées, folios.
- **Structure générale** : collage de colonnes ; jusqu'à 2 colonnes, 3 grille(s), variante d'ouverture 2, de fin 0, de corps 1
- **Titre** : asymétrique · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : mosaïque
- **Largeur de lecture** : 500 px · **Métadonnées** : folio · **Auteur** : marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : collage de colonnes · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffe45e, texte #1a1a1a, accent #d15078, surface #ffd21f · **Typographies** : titres staatliches, texte space-grotesk
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-087 — Marge Infinie

- **Clé** : `marge-infinie.ai-087` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Essai
- **Usage éditorial** : Le titre vit dans la marge, le texte se lit au centre.
- **Composition** : Colonne étroite et marginalia — Colonne de lecture étroite, notes et métadonnées dans les marges.
- **Structure générale** : texte étroit + marginalia ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 3, de fin 0, de corps 1
- **Titre** : dans la marge · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 500 px · **Métadonnées** : dans la marge · **Auteur** : dans la marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : titre dans la marge · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #ffffff, texte #111111, accent #0044ff, surface #f0f0f0 · **Typographies** : titres dm-serif-display, texte ibm-plex-mono
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-088 — Cyanotype

- **Clé** : `cyanotype.ai-088` · **Direction artistique** : Article artistique · **Secteur cible** : Photographie historique
- **Usage éditorial** : Camaïeu bleu de cyanotype, comparateur d'une image d'archive et de sa restauration.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 3, de fin 2, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : cadre épais
- **Largeur de lecture** : 580 px · **Métadonnées** : sous le cadre · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : beforeafter
- **Fonctionnalités** : comparateur avant/après · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #0b3d63, texte #e6f2fb, accent #9ad1f5, surface #0f4c7a · **Typographies** : titres spectral, texte ibm-plex-sans
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-089 — Vitrail

- **Clé** : `vitrail.ai-089` · **Direction artistique** : Article culturel · **Secteur cible** : Patrimoine
- **Usage éditorial** : Bleu nuit et or de vitrail, infobox de l'édifice.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : texte + infobox ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 0, de fin 1, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : portrait vertical
- **Largeur de lecture** : 600 px · **Métadonnées** : infobox · **Auteur** : carte · **Sidebar** : infobox droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table, gallery, map
- **Fonctionnalités** : infobox d'édifice, plan d'accès · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #1e1b3a, texte #f4efe3, accent #e0a100, surface #2a2650 · **Typographies** : titres cinzel, texte cardo
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-090 — Atlas

- **Clé** : `atlas.ai-090` · **Direction artistique** : Article culturel · **Secteur cible** : Géographie
- **Usage éditorial** : Carte en pleine largeur, légende de planche, texte d'atlas.
- **Composition** : Carnet de lieu — Bandeau de lieu, notes de marge, récit.
- **Structure générale** : carte + texte ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : pleine largeur
- **Largeur de lecture** : 620 px · **Métadonnées** : légende de carte · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : map, table
- **Fonctionnalités** : carte pleine largeur, légende · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #eef4ea, texte #1f3324, accent #bc4749, surface #dbe7d4 · **Typographies** : titres gelasio, texte public-sans
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-091 — Fanzine

- **Clé** : `fanzine.ai-091` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Contre-culture
- **Usage éditorial** : Machine à écrire, noir et vert, collage de coupures.
- **Composition** : Imprimé expérimental — Grille de magazine papier, colonnes décalées, folios.
- **Structure générale** : grille décalée ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 0, de corps 0
- **Titre** : vertical · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : diptyque
- **Largeur de lecture** : 520 px · **Métadonnées** : folio · **Auteur** : marge · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, quote · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : collage, titre vertical · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #e9e9e9, texte #000000, accent #00983f, surface #d4d4d4 · **Typographies** : titres special-elite, texte ibm-plex-mono
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-092 — Observatoire

- **Clé** : `observatoire.ai-092` · **Direction artistique** : Article scientifique · **Secteur cible** : Astronomie
- **Usage éditorial** : Fond de nuit, observations datées, graphique de courbe de lumière.
- **Composition** : Sommaire latéral collant — Plan de l'article collé à gauche pendant la lecture.
- **Structure générale** : chapitres sombres ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 1
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 560 px · **Métadonnées** : date d'observation · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : motionchart
- **Fonctionnalités** : chapitres sombres, graphique · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #020617, texte #e2e8f0, accent #fbbf24, surface #0b1230 · **Typographies** : titres space-grotesk, texte source-sans-3
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-093 — Herbier

- **Clé** : `herbier.ai-093` · **Direction artistique** : Article scientifique · **Secteur cible** : Nature et biologie
- **Usage éditorial** : Fiche d'espèce à droite, spécimen détouré.
- **Composition** : Encyclopédique — Infobox flottante, sommaire, sections denses.
- **Structure générale** : texte + infobox ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : détourée
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche d'espèce · **Auteur** : carte · **Sidebar** : infobox droite
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : table, gallery
- **Fonctionnalités** : fiche d'espèce · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #f3f7ee, texte #1e2a16, accent #6a994e, surface #e1eadb · **Typographies** : titres spectral, texte karla
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-094 — Sillage

- **Clé** : `sillage.ai-094` · **Direction artistique** : Article sportif · **Secteur cible** : Voile et nautisme
- **Usage éditorial** : Panoramique marin, carte du parcours, texte aéré.
- **Composition** : Plein cadre — Image pleine largeur, titre dessous, colonne de lecture.
- **Structure générale** : 1 colonne ; colonne unique, 0 grille(s), variante d'ouverture 0, de fin 1, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : panoramique
- **Largeur de lecture** : 620 px · **Métadonnées** : conditions et lieu · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta · **Blocs à placer dans le contenu** : gallery, map
- **Fonctionnalités** : carte du parcours · **Interactions** : lecture simple, sans animation
- **Couleurs** : fond #e6f4f7, texte #08324a, accent #019a9d, surface #cfe8ee · **Typographies** : titres outfit, texte inter
- **Espacements et formes** : arrondi 2px, bordure 2px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-095 — Atelier de Code

- **Clé** : `atelier-de-code.ai-095` · **Direction artistique** : Article technologique · **Secteur cible** : Open source
- **Usage éditorial** : Informations de version et de licence, liste de contributeurs.
- **Composition** : Communiqué formel — Grille sobre, bloc d'informations, pièces jointes.
- **Structure générale** : grille formelle ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 1, de fin 0, de corps 1
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 680 px · **Métadonnées** : version et licence · **Auteur** : carte · **Sidebar** : droite
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : code, list, table
- **Fonctionnalités** : bloc de licence, liste de contributeurs · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #fdfdfd, texte #111111, accent #6063e8, surface #f1f1f4 · **Typographies** : titres jetbrains-mono, texte inter
- **Espacements et formes** : arrondi 8px, bordure 1px, écart 24px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-096 — Rendez-vous

- **Clé** : `rendez-vous.ai-096` · **Direction artistique** : Article communautaire · **Secteur cible** : Événement local
- **Usage éditorial** : Fiche d'événement collante avec compte à rebours et carte.
- **Composition** : Fiche technique — Bloc de caractéristiques en tête, essai ensuite.
- **Structure générale** : fiche + texte ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 2, de fin 0, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 600 px · **Métadonnées** : fiche de l'événement · **Auteur** : carte · **Sidebar** : droite sticky
- **Widgets d'accompagnement posés** : aucun · **Blocs à placer dans le contenu** : countdown, map, emailsubscribe
- **Fonctionnalités** : compte à rebours, carte · **Interactions** : éléments collants pendant la lecture
- **Couleurs** : fond #e0f2fe, texte #082f49, accent #d2681e, surface #bfe3f9 · **Typographies** : titres league-spartan, texte figtree
- **Espacements et formes** : arrondi 20px, bordure 0px, écart 22px, rembourrage 22px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-097 — Dossier Thématique

- **Clé** : `dossier-thematique.ai-097` · **Direction artistique** : Magazine culturel · **Secteur cible** : Dossier
- **Usage éditorial** : Colonne de navigation avec les autres articles du dossier.
- **Composition** : Navigation éditoriale — Navigation entre articles et rubriques en colonne fixe.
- **Structure générale** : navigation de dossier + texte ; jusqu'à 2 colonnes, 2 grille(s), variante d'ouverture 2, de fin 2, de corps 0
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : bande étroite
- **Largeur de lecture** : 620 px · **Métadonnées** : chapitre courant · **Auteur** : carte · **Sidebar** : gauche
- **Widgets d'accompagnement posés** : postmeta, postnav, querylist, toc · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : navigation de dossier, articles du même dossier · **Interactions** : éléments collants pendant la lecture, sommaire à ancres, navigation précédent / suivant
- **Couleurs** : fond #f9f7f3, texte #1d1a16, accent #007f5f, surface #ebe6da · **Typographies** : titres playfair-display, texte work-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-098 — Reportage Long

- **Clé** : `reportage-long.ai-098` · **Direction artistique** : Article de reportage · **Secteur cible** : Grand reportage
- **Usage éditorial** : Reportage en chapitres : une image d'ouverture par chapitre.
- **Composition** : Long format à chapitres — Sections successives avec progression de lecture.
- **Structure générale** : chapitres plein écran ; jusqu'à 2 colonnes, 1 grille(s), variante d'ouverture 3, de fin 1, de corps 1
- **Titre** : superposé bas-gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : plein écran
- **Largeur de lecture** : 600 px · **Métadonnées** : lieu et date · **Auteur** : carte · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, readingprogress, toc · **Blocs à placer dans le contenu** : gallery
- **Fonctionnalités** : chapitres plein écran, barre de lecture, sommaire · **Interactions** : éléments collants pendant la lecture, barre de progression de lecture, sommaire à ancres
- **Couleurs** : fond #1a1a1a, texte #f1ece1, accent #e6404c, surface #262626 · **Typographies** : titres newsreader, texte inter
- **Espacements et formes** : arrondi 10px, bordure 1px, écart 26px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-099 — Verso

- **Clé** : `verso.ai-099` · **Direction artistique** : Article d'entreprise · **Secteur cible** : Rapport annuel
- **Usage éditorial** : Trois colonnes de rapport, chiffres clés animés, sommaire collant.
- **Composition** : Trois colonnes magazine — Sommaire, texte et rail d'accompagnement côte à côte.
- **Structure générale** : sommaire | texte | rail ; jusqu'à 3 colonnes, 1 grille(s), variante d'ouverture 0, de fin 0, de corps 2
- **Titre** : gauche · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : carré décalé
- **Largeur de lecture** : 600 px · **Métadonnées** : rail · **Auteur** : rail · **Sidebar** : droite
- **Widgets d'accompagnement posés** : postmeta, toc · **Blocs à placer dans le contenu** : motionnumberticker, table
- **Fonctionnalités** : chiffres animés, sommaire · **Interactions** : éléments collants pendant la lecture, sommaire à ancres
- **Couleurs** : fond #f4f1fb, texte #1a1033, accent #5b21b6, surface #e6dff7 · **Typographies** : titres fraunces, texte ibm-plex-sans
- **Espacements et formes** : arrondi 0px, bordure 1px, écart 28px, rembourrage 18px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, éléments collants remis dans le flux, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

### AI-100 — Dernière Page

- **Clé** : `derniere-page.ai-100` · **Direction artistique** : Format éditorial expérimental · **Secteur cible** : Essai de clôture
- **Usage éditorial** : Jaune sur bleu nuit, une phrase par écran, signature en fin.
- **Composition** : Manifeste typographique — Texte seul en très grand corps, rythme par la typographie.
- **Structure générale** : texte seul en grand corps ; colonne unique, 0 grille(s), variante d'ouverture 1, de fin 0, de corps 0
- **Titre** : centré · **Sous-titre** : chapô = extrait de l'article (`{{post.excerpt}}`) · **Image principale** : aucune
- **Largeur de lecture** : 680 px · **Métadonnées** : signature · **Auteur** : signature · **Sidebar** : aucune
- **Widgets d'accompagnement posés** : postmeta, postnav, quote · **Blocs à placer dans le contenu** : aucun
- **Fonctionnalités** : une phrase par écran, signature · **Interactions** : navigation précédent / suivant
- **Couleurs** : fond #101820, texte #fee715, accent #fee715, surface #1b2733 · **Typographies** : titres young-serif, texte work-sans
- **Espacements et formes** : arrondi 0px, bordure 3px, écart 28px, rembourrage 16px
- **Responsive** : grilles repliées en 1 colonne sous 640 px, titre réduit (78 % puis 56 %), images en pleine largeur
- **Identité** : propre (valeurs fixes) ; modes « suit le site » et « hybride » au choix à l'insertion

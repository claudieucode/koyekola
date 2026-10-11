# 18 — Matrice de comparaison Elementor ↔ KOLAKISA

_Établie le 2026-10-10. **Preuve** = ce qui a été réellement fait dans cette session : « code » = lecture du code ; « test » = test exécuté ; « —» = non testé. Les lignes « Présent (code) » ne sont **pas** « Présent et opérationnel » : ce statut exige un test de bout en bout, indiqué dans la colonne Preuve._
Légende des statuts : OPÉ = présent et opérationnel (testé) · PRÉS = présent, vérifié dans le code seulement · INC = présent mais incomplet · ABS = absent · NA = non applicable · ? = à vérifier.
Comparaison détaillée widget par widget (phase 1) : voir `ELEMENTOR_FEATURE_INVENTORY.md` (racine) ; cette matrice ne la remplace pas.

| # | Domaine | Fonctionnalité Elementor (source) | Dispo. Elementor | KOLAKISA | Preuve | Écart / décision | Prio | Action |
|---|---|---|---|---|---|---|---|---|
| 1 | Images | Résolution de l'image : miniature / taille / complète (image-widget) | Image, Image Box, Galerie, Carrousel… | **OPÉ (implémenté ici)** : 5 tailles + original + adaptative, Image / Galerie / Carrousel / Boîte d'image / Points d'intérêt | test : 8 serveur + 4 navigateur | Tailles carrées et « personnalisée » non reprises (voir limites) | P1 | fait |
| 2 | Images | Résolution des autres widgets à source d'image | ✔ | **OPÉ (implémenté ici)** pour l'**image de fond** (tout conteneur) et la **photo de témoignage** ; **NA** pour les vignettes d'articles/formations/image mise en avant (elles viennent des bibliothèques du blog et du catalogue, hors médiathèque du Page Builder) | test : 2 serveur | logo du site et image du bandeau « héros » historique : non traités | P2 | fait / reste documenté |
| 3 | Images | Object-fit / ratio d'aspect / filtres / opacité sur Image | ✔ | PRÉS (propriétés de style `objectFit`, `aspectRatio`, `filter`) | code | test de rendu public non refait | — | vérifier |
| 4 | Images | Lien, légende, texte alternatif, titre, nouvel onglet | ✔ | OPÉ | test (cms-media, tests widgets) | — | — | conserver |
| 5 | Images | Lightbox (visionneuse) | ✔ | **OPÉ** : galerie, et **widget Image seul (ajouté ici, désactivé par un lien)** | test : cms-media, images-resolutions, galerie-options | l'original s'ouvre même si une version réduite est affichée | — | fait |
| 6 | Galerie | Dispositions Grille (ratios) / Justifiée / Maçonnerie ; 1–24 colonnes ; filtres ; surcouche | ✔ | **OPÉ (ajouté ici)** : disposition (grille, mosaïque, justifiée), colonnes 1–6, ratio d'aspect (grille), hauteur des lignes (justifiée), légende au survol, barre de filtres par étiquette ; la visionneuse saute les images filtrées | test : 5 navigateur | Elementor : jusqu'à 24 colonnes ; type « Multiple » avec titre : non repris | P2 | fait |
| 7 | Texte | Contour du texte (text stroke) | ✔ | **OPÉ (ajouté ici)** : épaisseur + couleur, tous les éléments à typographie | test : 4 navigateur (propriétés restantes, rendu calculé) | — | P3 | fait |
| 8 | Texte | Ombre du texte, mode de fusion | ✔ | PRÉS (`textShadow`, `mixBlendMode`) | code | — | — | vérifier |
| 9 | Texte | Balise HTML du titre H1–H6 (+div/span/p) | ✔ | PRÉS (niveau 1–6) ; div/span/p non | code | partiel | P3 | évaluer |
| 10 | Bouton | ID du bouton, icône + position | ✔ | PRÉS (ID d'ancre général, icône) | code | — | — | vérifier |
| 11 | Accordéon | Schéma FAQ | ✔ | PRÉS (`faqSchema`) | code | test non refait | — | vérifier |
| 12 | Formulaire | Types de champs, actions, anti-spam | ✔ | ➡️ module Formulaires de KOLAKISA | code | hors éditeur | — | — |
| 13 | Structure | Conteneur flex : direction, justification, alignement, écart, retour à la ligne, débordement, hauteur min vh | ✔ | OPÉ (testés par les suites existantes, p. ex. canvas-vide-compatibilite) | test | — | — | conserver |
| 14 | Structure | Grille (Grid) | non documenté (non vérifié) | PRÉS | code | ne pas comparer | — | — |
| 15 | Structure | Conteneur « a » cliquable / balise HTML | ✔ | PRÉS (lien du conteneur, balises) | code | — | — | vérifier |
| 16 | Responsive | Trois écrans par défaut, héritage descendant | ✔ | PRÉS : ordinateur, tablette (820), mobile (390) | code | héritage KOLAKISA : valeurs par écran ; non recomparé | — | ? |
| 17 | Responsive | Points de rupture personnalisés / appareils supplémentaires | ✔ (statut ?) | ABS (3 écrans fixes) | code | à évaluer, coût élevé (moteur CSS) | P3 | reporter |
| 18 | Responsive | Masquer par appareil | ✔ | OPÉ (`hideOn`) | code + tests antérieurs | — | — | conserver |
| 19 | Avancé | ID CSS, classes CSS, attributs personnalisés, z-index, position, ordre | ✔ (attributs Pro) | PRÉS | code | — | — | conserver |
| 20 | Avancé | CSS personnalisé **par widget** | Pro | NA : CSS personnalisé existe au niveau site/page, validé ; par widget = risque de sécurité | code | décision : exclu | — | exclu |
| 21 | Avancé | Masque, transformation, arrière-plans/dégradés, bordure/ombre | ✔ | PRÉS | code | — | — | conserver |
| 22 | Avancé | Conditions d'affichage | ✔ | PRÉS sous une autre forme (public cible, programmation) | code | modèle différent | — | conserver |
| 23 | Animation | Animation d'entrée, effets de défilement, effets de souris, sticky | ✔ (défilement/sticky Pro) | PRÉS (moteur de mouvement) | code, mémoire projet | — | — | conserver |
| 24 | Interface | Raccourcis : annuler/rétablir, copier/coller, coller le style, dupliquer, enregistrer, structure | ✔ | OPÉ (Ctrl+Z, Maj+Z, C, V, X, D, S, Ctrl+Maj+V, Ctrl+K palette, Ctrl+Maj+H) | code | Finder = palette Ctrl+K ; Historique Ctrl+Maj+H = *masquer* (autre sens) | P3 | documenter |
| 25 | Interface | Menu contextuel : Copier/Coller/Coller le style/Réinitialiser le style/Enregistrer comme modèle/Structure | ✔ | PRÉS | code | détail non comparé | — | ? |
| 26 | Interface | « Coller depuis un autre site » | ✔ | ABS | code (aucune occurrence) | pertinent seulement entre sites KOLAKISA | P3 | évaluer |
| 27 | Historique | Historique de session + révisions + enregistrement auto | ✔ | OPÉ (annuler 150 pas, brouillon enregistré à 1 s, versions restaurables) | test (suites existantes) | pas d'effacement de l'historique | — | conserver |
| 28 | Styles | Couleurs/polices globales, Theme Style | ✔ | PRÉS (réglages du site, jetons) | code | — | — | conserver |
| 29 | Styles | Classes globales + états (V4), styles enregistrés | ✔ | PRÉS (« Enregistrer comme style », classes) | commit 011e395 | — | — | conserver |
| 30 | Réutilisation | Composants / éléments globaux, détachement | Pro (V4) | PRÉS (composants cycle de vie) | commit 4e42592 | — | — | conserver |
| 31 | Réutilisation | Modèles, import/export, kits | ✔ | PRÉS (modèles de pages) | code | export/import de kits non comparé | — | ? |
| 32 | CMS | Étiquettes dynamiques, boucles, Theme Builder, conditions | ✔ | PRÉS | ELEMENTOR_FEATURE_INVENTORY | — | — | conserver |
| 33 | IA | Modifier avec l'IA | ✔ | PRÉS (studio IA, respecte le verrou : test) | test format-mise-en-page | — | — | conserver |

# KOLAKISA — Personnaliser : audit, matrice de parité WordPress, architecture cible (mission TITAN XVIII)

Branche `personnaliser-titan18`, issue de `origin/main`. Référence WordPress : `docs/wordpress-customizer/`. Complète `KOLAKISA_CMS_PERSONNALISER.md` (architecture du palier initial, toujours valable). Ce document décrit l'état **réel** ; les statuts reposent sur du code lu et sur des tests exécutés (indiqués).

## 1. Constat d'audit

Le « Personnaliser » **existe déjà et fonctionne** (écran plein cadre, aperçu du vrai site, brouillon, publication, versions, par site). Ce n'est donc pas une reconstruction : on conserve l'architecture et on comble les écarts.

| Brique | État constaté |
|---|---|
| Catalogue fermé de réglages (`src/services/customizer.js`) | ~95 réglages avant la mission, par type de site (principal / site) |
| Écriture | Dans les moteurs existants seulement (`appearance` pour le principal, `pages.saveSiteDesign` pour un site) : aucun second moteur |
| Brouillon, conflits, publication, historique | Tables `cms_customizer_drafts` / `cms_customizer_versions` (migration 096), verrou optimiste, une transaction par publication |
| Aperçu | Page réelle dans un cadre ; CSS recalculé par le même code que le site public ; réglages « contenu » = rechargement avec défilement conservé |
| Droits | `appearance.read / styles / publish`, `pages.code`, `seo.edit` côté serveur |
| Isolation | Site vérifié par le serveur (`target()`), brouillons/versions/session par site ; images limitées à la médiathèque du site |
| Tests avant mission | `tests/personnalisateur.test.js` (23 tests) |

### Écart principal découvert
Le moteur de rendu des **sites** (`tokens.js`, `themeCss.js`, `siteSettings.js`) sait déjà rendre bien plus que ce que le Personnaliser exposait : arrière-plan (couleur, dégradé, image, répétition…), titres 4 à 6, légendes, polices des boutons et liens, casse des titres, états « au clic » des boutons, images (arrondi, bordure, ombre, cadrage), champs de formulaire, couleurs de messages, arrondis/épaisseurs/hauteurs, points de rupture, transitions de page. Ces réglages n'étaient modifiables que dans d'autres écrans, **sans aperçu ni brouillon**.

## 2. Travail réalisé dans cette mission

- Catalogue : **+ 58 réglages** pour les sites, tous rendus par le moteur existant (aucun réglage décoratif). Trois nouveaux panneaux : *Arrière-plan*, *Images*, *Champs de formulaire* ; ajouts dans Couleurs, Typographie, Mise en page, Boutons.
- Le site **principal** ne les propose pas : son moteur d'apparence ne les rend pas (liste « non disponible » maintenue, testé).
- Couleurs référencées (`token:primary`) : affichées en hexadécimal dans l'écran ; acceptées à la restauration d'une version (bug trouvé par les tests : une restauration contenant un dégradé par défaut était refusée).
- Conditions d'affichage (`showIf`) : listes de valeurs et « n'importe quelle valeur non vide ».
- Tests : `tests/personnalisateur-etendu.test.js`.

## 3. Matrice de parité WordPress → Kolakisa

Légende : **Conforme** = comportement, données, aperçu, sauvegarde et effet public vérifiés par test ; **Partiel** ; **Absent** ; **N/A** (justifié).

### A. Customizer classique
| Fonction WordPress | Kolakisa | Statut | Test / remarque |
|---|---|---|---|
| Titre du site | `name` (site) / logo texte (principal) | Conforme | personnalisateur.test |
| Slogan | `identity.description` (site, aussi SEO) / slogan du pied (principal) | Conforme | idem |
| Logo | logo principal + mobile (site), image (principal), médiathèque du site | Conforme | idem (isolation médias) |
| Icône du site | favicon (site) | Conforme (site) · Absent (principal : fichier du projet) | |
| Afficher/masquer titre+slogan | — | À investiguer | dépend du composant d'en-tête (Page Builder) |
| Couleurs | 10 couleurs de base + liens + bordures + messages | Conforme | |
| Mode sombre du site | — | Absent | le moteur n'a pas de jeu sombre par site ; plan §5 |
| Image / couleur de fond + position, taille, répétition, fixe | panneau Arrière-plan (site) | Conforme (site) · Absent (principal) | personnalisateur-etendu |
| Dégradé de fond | oui (site) | Conforme (site) | idem |
| Image d'en-tête (bandeau) | — | N/A | l'en-tête d'un site est un composant du Page Builder |
| Menus (créer, items, emplacements) | écran Navigation (système existant, non dupliqué) ; le panneau liste les menus et actualise l'aperçu | Partiel (volontaire) | pas de second système |
| Widgets / zones | Widgets = blocs du Page Builder / zones du principal | N/A dans le Personnaliser | doc `KOLAKISA_CMS_WIDGETS.md` |
| Page d'accueil statique | Réglages du site (page d'accueil) | N/A ici (autre écran) | |
| Extraits | — | À investiguer | gabarits du blog |
| CSS additionnel | site : oui, validé, droit `pages.code` ; principal : non | Conforme (site) · Absent (principal) | |
| Aperçu d'appareil | Ordinateur / Tablette 768 / Mobile 390 | Conforme | navigateur testé au palier initial |
| Crayon d'édition directe | — | Absent | plan §5 (palier E) |
| Contexte (`active_callback`) | pages à prévisualiser par site ; `showIf` | Partiel | |
| Brouillon, publication, planification, lien de partage | brouillon + publication ; planification et lien : absents | Partiel | **[Connu]** côté WordPress |
| Annuler/rétablir, avertissement avant de quitter | oui (100 niveaux) | Conforme | |
| Versions / restauration | 40 versions par site, retour = brouillon | Conforme | test restauration |
| Conflits entre sessions | verrou optimiste + base_rev | Conforme (mieux que la doc WP consultée) | |

### B. Éditeur de site moderne
| Fonction | Kolakisa | Statut |
|---|---|---|
| Styles globaux : couleurs, typo, espacements, largeurs | oui (jetons) | Conforme |
| Palette personnalisée nommée | jetons `customColors` existent dans le moteur mais ne sont pas gérés ici | Absent (palier B suivant) |
| Tailles préréglées / fluides | tailles en px par niveau | Partiel |
| Styles par bloc | styles par composant dans le Page Builder (`tokens` boutons/images/champs ici ; autres par widget) | Partiel |
| Variations de styles | **Thèmes** (écran existant, `KOLAKISA_CMS_THEMES.md`) | Conforme (autre écran) |
| Style Book | — | Absent |
| CSS global / par bloc | global oui (site) ; par bloc : classes du Page Builder | Partiel |
| Révisions / réinitialisation | versions + bouton réinitialiser par réglage | Conforme |
| Modèles de pages, parties de modèles (en-tête/pied) | Page Builder : modèles et en-tête/pied par site, hors Personnaliser | N/A ici (lien direct), à intégrer plus tard |
| Compositions / synchronisées | blocs/sections réutilisables du Page Builder | Autre module |
| Navigation | écran Navigation | Autre module |
| Export du thème | export de thème existant côté Thèmes | Autre écran |
| Sélection d'un élément dans l'aperçu | — | Absent |

## 4. Architecture cible (inchangée dans son principe)
Un seul catalogue → deux moteurs existants → un brouillon → une publication. Extension : un nouveau thème/composant ajoute des lignes au catalogue (`add(...)`), sans toucher à l'écran. Tout réglage doit avoir (1) un champ du moteur, (2) une validation du moteur, (3) un effet visible dans le rendu public, (4) un test.

## 5. Plan restant (non fait dans cette mission, par ordre de valeur)
1. Palette de couleurs nommées (`customColors`) gérée dans l'écran.
2. Sélection directe dans l'aperçu (survol → ouverture du réglage), à partir de repères `data-kw-…` du rendu.
3. Valeurs par appareil (nécessite un jeu de valeurs tablette/mobile dans le moteur).
4. Mode sombre par site (jeu de couleurs sombre dans le moteur).
5. En-tête/pied d'un site dans le Personnaliser (aujourd'hui composants du Page Builder).
6. Planification de publication et lien d'aperçu partageable.

## 6. Tests et résultats (exécutés le 26 octobre 2026)
- `tests/personnalisateur.test.js` (23, un attendu adapté : la liste des panneaux d'un site contient les 3 nouveaux) + `tests/personnalisateur-etendu.test.js` (9) : **32 / 32 réussis**.
  - Le premier lancement groupé avec le test Chrome a échoué entièrement pour une raison d'environnement (« Le serveur de test n'a pas démarré », machine à charge 23–34) ; relancé seul : réussi.
- `tests/personnalisateur-etendu-navigateur.test.js` (vrai Chrome) : **2 / 2 réussis** — saisie d'une couleur → aperçu sans recharger → publication → base et rendu public ; panneaux Images / Formulaires, condition d'affichage du dégradé, absence de débordement horizontal à 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 px, aucune erreur de console. Captures examinées (1440 px et 390 px).
- Isolation vérifiée : publier sur A ne modifie ni les jetons/réglages de B ni la publication du principal ; image de fond d'un autre site refusée ; éditeur limité au site A refusé sur B (403) ; éditeur sans droit de publication refusé.
- Mesures de performance (temps d'ouverture, mémoire, requêtes) : **non réalisées** dans cette mission ; aucune amélioration de performance n'est revendiquée.

## 7. Limites assumées
- Les 58 réglages ajoutés ne concernent que les **sites** ; le site principal garde son catalogue (son moteur d'apparence ne rend pas ces réglages).
- Les couleurs « token:… » restaurées gardent leur lien avec la couleur du site ; modifiées dans l'écran, elles deviennent un code hexadécimal fixe.
- La documentation WordPress contient des points **[Connu]** non revérifiés (voir `docs/wordpress-customizer/sources-and-limitations.md`).
- Rien de ce qui figure en §5 n'est développé.

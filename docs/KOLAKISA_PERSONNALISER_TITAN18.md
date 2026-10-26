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

- Catalogue : **+ 58 réglages** (premier lot, commit `ff4d166`) puis le lot « complet » ci-dessous, pour les sites, tous rendus par le moteur existant (aucun réglage décoratif). Trois nouveaux panneaux : *Arrière-plan*, *Images*, *Champs de formulaire* ; ajouts dans Couleurs, Typographie, Mise en page, Boutons.
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
| Mode sombre du site | panneau « Mode sombre » (site) : couleurs de remplacement sous `prefers-color-scheme: dark`, aperçu forcé | Conforme (site) · Absent (principal) | personnalisateur-complet |
| Image / couleur de fond + position, taille, répétition, fixe | panneau Arrière-plan (site) | Conforme (site) · Absent (principal) | personnalisateur-etendu |
| Dégradé de fond | oui (site) | Conforme (site) | idem |
| Image d'en-tête (bandeau) | — | N/A | l'en-tête d'un site est un composant du Page Builder ; on choisit ici lequel (`parts.header`) |
| Menus (créer, items, emplacements) | écran Navigation (système existant, non dupliqué) ; le panneau liste les menus et actualise l'aperçu | Partiel (volontaire) | pas de second système |
| Widgets / zones | Widgets = blocs du Page Builder / zones du principal | N/A dans le Personnaliser | doc `KOLAKISA_CMS_WIDGETS.md` |
| Page d'accueil statique | Réglages du site (page d'accueil) | N/A ici (autre écran) | |
| Extraits | — | À investiguer | gabarits du blog |
| CSS additionnel | site : oui, validé, droit `pages.code` ; principal : non | Conforme (site) · Absent (principal) | |
| Valeurs différentes par appareil | panneau « Tablette et mobile » (titres 1-3, texte, marge, espacements) rendu sous les points de rupture du site | Conforme (site) | personnalisateur-complet |
| Aperçu d'appareil | Ordinateur / Tablette 768 / Mobile 390 | Conforme | navigateur testé au palier initial |
| Crayon d'édition directe | bouton « Sélectionner un élément » : clic sur un élément de la page réelle → réglage ouvert et sélectionné, chemin affiché | Conforme (par balises/classes du rendu ; voir §7) | navigateur |
| Contexte (`active_callback`) | pages à prévisualiser par site ; `showIf` | Partiel | |
| Brouillon, publication, planification, lien de partage | brouillon, publication, **planification** (heure choisie, droits revérifiés, échec signalé), **lien d'aperçu partageable** (jeton secret, 7 jours, révocable) | Conforme | personnalisateur-complet ; référence WordPress = **[Connu]** |
| Annuler/rétablir, avertissement avant de quitter | oui (100 niveaux) | Conforme | |
| Versions / restauration | 40 versions par site, retour = brouillon | Conforme | test restauration |
| Conflits entre sessions | verrou optimiste + base_rev | Conforme (mieux que la doc WP consultée) | |

### B. Éditeur de site moderne
| Fonction | Kolakisa | Statut |
|---|---|---|
| Styles globaux : couleurs, typo, espacements, largeurs | oui (jetons) | Conforme |
| Palette personnalisée nommée | panneau « Palette du site » + pastilles dans les sélecteurs de couleur ; suppression d'une couleur utilisée refusée par le moteur | Conforme (site) |
| Tailles préréglées / fluides | tailles en px par niveau | Partiel |
| Styles par bloc | styles par composant dans le Page Builder (`tokens` boutons/images/champs ici ; autres par widget) | Partiel |
| Variations de styles | **Thèmes** (écran existant, `KOLAKISA_CMS_THEMES.md`) | Conforme (autre écran) |
| Style Book | — | Absent |
| CSS global / par bloc | global oui (site) ; par bloc : classes du Page Builder | Partiel |
| Révisions / réinitialisation | versions + bouton réinitialiser par réglage | Conforme |
| Parties de modèles (en-tête/pied) | choix du composant d'en-tête et de pied du site, aperçu et publication | Conforme (choix) · le contenu du composant reste dans le Page Builder |
| Modèles de pages | Page Builder (gabarits de pages), hors Personnaliser | Autre module |
| Compositions / synchronisées | blocs/sections réutilisables du Page Builder | Autre module |
| Navigation | écran Navigation | Autre module |
| Export du thème | export de thème existant côté Thèmes | Autre écran |
| Sélection d'un élément dans l'aperçu | oui (voir ci-dessus) | Conforme |

## 4. Architecture cible (inchangée dans son principe)
Un seul catalogue → deux moteurs existants → un brouillon → une publication. Extension : un nouveau thème/composant ajoute des lignes au catalogue (`add(...)`), sans toucher à l'écran. Tout réglage doit avoir (1) un champ du moteur, (2) une validation du moteur, (3) un effet visible dans le rendu public, (4) un test.

## 5. Lot « complet » (suite de la mission)
- **Valeurs par appareil** : `settings.responsive.{tablet,mobile}` (titres 1-3, texte courant, marge latérale, espacements L et XL). Rendu par `siteSettings.layoutCss` sous les points de rupture du site, en `!important` sur les variables `--kw-*` (les jetons sont posés en style de l'élément `<body>`).
- **Mode sombre** : `settings.dark` (`off` | `auto`, fond, surface, texte, texte discret, couleur principale). Règle `@media (prefers-color-scheme:dark)` + règle `html[data-kw-force-dark]` utilisée par l'aperçu (« Aperçu en mode sombre » dans le menu). Une couleur de fond fixe choisie dans « Arrière-plan » reste appliquée en mode sombre.
- **Palette nommée** : type de réglage `palette` (liste nom + couleur, 30 au plus) ; doublons et noms vides refusés ; pastilles de la palette dans tous les sélecteurs de couleur.
- **En-tête / pied d'un site** : `parts.header`, `parts.footer` = composant réutilisable du Page Builder (limité aux composants du site et communs). Aperçu : `services/previewParts.js` (contexte asynchrone propre à la requête) lu par `pages.withSiteParts` ; publication par `pages.setSiteParts`.
- **Sélection directe** : bouton pointeur ; survol = cadre et nom du réglage, clic = panneau ouvert + champ sélectionné + chemin (`main › section › p`) ; Échap quitte. Rattachement par balise et classe du rendu (`h1-h6`, `button/.kw-button/.lp-btn`, champs, `img`, liens, `header`, `footer`, `p/li`, fond).
- **Publication planifiée** : migration `110` (colonnes `publish_at`, `scheduled_by`, `publish_error` ; table `cms_customizer_shares`). `customizer.schedule / unschedule / runDue`. Vérifiée chaque minute par le serveur et à chaque ouverture de l'écran. Les droits de la personne qui a planifié sont **revérifiés** à l'heure dite ; en cas d'échec (droit retiré, conflit, validation) la planification est annulée et la raison s'affiche. **Toute modification du brouillon annule la planification.**
- **Lien d'aperçu partageable** : jeton aléatoire de 48 caractères hexadécimaux, **seule l'empreinte SHA-256 est stockée**, 7 jours (1 à 30), révocable, copie **figée** du brouillon enregistré. Accès : `/p/<page publiée du site>?kwshare=<jeton>` sans compte, lecture seule, `noindex`, `no-store`, vue **non comptée** dans les statistiques ; ne montre rien d'un autre site. Réservé aux sites et aux comptes qui peuvent publier.

## 6. Tests et résultats (26 octobre 2026)
| Fichier | Tests | Résultat |
|---|---|---|
| `personnalisateur.test.js` (existant, un attendu adapté : liste des panneaux) | 23 | réussis |
| `personnalisateur-etendu.test.js` | 9 | réussis |
| `personnalisateur-complet.test.js` | 13 | réussis |
| `personnalisateur-etendu-navigateur.test.js` (Chrome) | 2 | réussis |
| `personnalisateur-complet-navigateur.test.js` (Chrome) | 3 | réussis |
- Isolation : publier, planifier, partager sur le site A ne modifie ni B ni le principal ; composant d'en-tête d'un autre site refusé ; jeton du site A ne montre rien du site B ; l'éditeur (sans droit de publier) reçoit 403 sur publier, planifier, partager.
- Adaptations de tests existants, sans affaiblir une assertion : classement de la nouvelle table `cms_customizer_shares` (inventaire des tables), borne de la dernière migration (109 → 110).
- Non-régression : `site-espace-unitaire`, `marketing-fondations`, `apparence-templates`, `apparence-styles`, `apparence-parcours`, `contenus-par-site-unitaire` réussis ; `site-menu-p1a` réussi hors l'assertion de migration, corrigée.
- **Échec préexistant, sans lien** : `portee-des-routes` (« oracle », route `GET /pages` avec `?site=2`) échoue de la même façon indépendamment de cette mission.
- Plusieurs lancements ont dépassé le délai de démarrage du serveur de test (« Le serveur de test n'a pas démarré ») quand la machine était saturée (charge > 300) ; relancés seuls, ils passent.

## 7. Mesures de performance (Chrome headless, machine très chargée : à lire comme un ordre de grandeur, pas une référence)
| Mesure | Valeur |
|---|---|
| Ouverture du Personnaliser jusqu'à l'aperçu affiché | ≈ 6,0 à 6,5 s (machine saturée) ; 12 requêtes |
| Délai entre une saisie de couleur et son apparition dans l'aperçu | ≈ 290 ms (dont 220 ms de regroupement volontaire des frappes) |
| Enregistrement du brouillon | ≈ 75 à 130 ms |
| Publication | ≈ 360 à 490 ms |
| 60 changements successifs | mémoire JavaScript 5,3 → 6,3 Mo (pas de fuite visible) ; 4 tâches longues, la plus longue ≈ 149 ms |
Aucune mesure « avant » n'existait : **aucune amélioration n'est revendiquée**, seulement un état mesuré. Le temps d'ouverture est dominé par le chargement de la page réelle dans le cadre ; il n'a pas été optimisé.

## 8. Limites assumées
- Les réglages ajoutés ne concernent que les **sites** ; le site principal garde son catalogue (son moteur ne les rend pas).
- La sélection directe repose sur les balises et classes du rendu : un élément très personnalisé peut renvoyer au réglage général le plus proche (« Fond de la page »). Pas de sélection au clavier dans la page : les panneaux restent le chemin accessible.
- Le contenu de l'en-tête et du pied d'un site se compose dans le Page Builder ; ici on choisit seulement le composant.
- L'heure planifiée est saisie dans le fuseau de l'appareil et stockée en UTC ; l'exécution a la précision de la vérification (1 minute) et dépend du processus serveur en marche.
- Un brouillon planifié ne se publie pas si la version en ligne a changé entre-temps (conflit) : la raison est affichée.
- Le lien partageable s'appuie sur une page publiée du site ; une page non publiée n'est pas prévisualisable par lien.
- La référence WordPress contient des points **[Connu]** non revérifiés (voir `docs/wordpress-customizer/sources-and-limitations.md`).

## 9. Reste à faire (non développé)
Sélection d'élément au clavier dans l'aperçu ; en-tête/pied avec réglages visuels propres (hauteur, ombre, comportement au défilement : à ajouter au moteur d'abord) ; mode sombre pour le site principal ; mesure avant/après pour une optimisation de l'ouverture.

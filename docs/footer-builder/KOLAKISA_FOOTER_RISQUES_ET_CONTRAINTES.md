# Pied de page : risques, contraintes, tests à préserver (audit du 7 novembre 2026)

## 1. Dépendances (ce sur quoi repose le pied)

| Dépendance | Pourquoi c'est sensible | Preuve |
|---|---|---|
| Éditeur du Page Builder (`public/js/page-builder.js` 8 735 l., `nodes.js` 2 177 l.) | Le pied n'a pas d'éditeur propre : toute évolution de l'éditeur touche tout le site (pages, en-têtes, archives, 404, articles) | `themeBuilder.js:30` (URL d'édition = éditeur de composants) |
| Fonctions partagées `withSiteParts`, `partOf`, `siteParts` (`pages/index.js:936-1000`) | Servent l'en-tête ET le pied ; une correction du pied peut décaler l'en-tête | `pages/index.js:961` |
| `themeRender.renderParts` / `themeLayout` (`themeRender.js:99`, `themeLayout.js`) | Même pipeline pour en-tête, pied, barre latérale, modèles personnalisés | idem |
| `catalog/kit.js`, `identities.js` | Partagés entre les 100 en-têtes et les 100 pieds (« Identités PROPRES partagées par les en-têtes et les pieds », `identities.js:1`) ; une modification casse les en-têtes livrés | `identities.js:1-2` |
| Menus (Apparence → Menus, emplacements `footer`/`header`) | Le pied lit le menu affecté, jamais une liste copiée | `nodes.js:594-625` |
| Formulaires (Audience) | `signupform` exige un formulaire existant | `nodes.js:845` |
| Réglages du site (identité, logo, points de rupture) | Logo, titre, copyright, largeur, breakpoints viennent des réglages du site | `siteSettings.js` |
| Anciens mécanismes | `footer_component_id`, `appearance_configs.footer`, zones `footer-1/2` : encore lus comme repli (voir ARCHITECTURE §5) | `footer.ejs`, `pages/index.js:966` |
| Sécurité des adresses/images | `linkUrl`/`imageUrl` valident tous les widgets ; toucher à `linkUrl` (pour `tel:`/`mailto:`) élargit la surface d'attaque de tout le site | `pages/sections.js:19-38` |

## 2. Collisions possibles

* **Autres branches** : le dépôt compte de nombreuses branches locales (`abonnements`, `blog-archive`, `boutique-lot1/2/3`, `briques-moteur`, `correctif-apparence-themes`, `personnaliser-shell`, `site-principal-theme-builder`, `themes-interactifs`…) et des worktrees (`/private/tmp/claude-501/appar-wt`, `inter-wt`, `wt-retrait`…). Mémoire du projet : « D'autres sessions refont en parallèle en-têtes, pieds, résultats de recherche, archives produits et article individuel » → **toujours fusionner `main` avant de pousser**, ne jamais dupliquer leur travail. `git branch -a`/`worktree list` consultés en lecture seule ; état exact des branches `boutique-*` et `briques-moteur` (qui concernent le pied de boutique) **non vérifié**.
* **Composants partagés avec l'en-tête** : `kit.js`, `identities.js`, `catalog/index.js`, `store.js`, `render.js`, `themeRender.js`, `_sections.ejs`, `landing.css`, `theme-builder.js`. Le plus dangereux : `_sections.ejs:18-19` (logique « collant » de l'en-tête et classes `lp-site-part` dans la même ligne que le pied).
* **Archives / 404 / article / produit** : `conditions.js`, `match.js`, `types.js`, `resolve.js` sont communs à tous les types. Toute évolution de condition doit garder les suites `noyau`, `regles`, `couverture-rendu`, `contexte-rendu` vertes.
* **Éditeur** : `page-builder.js` est modifié par toutes les équipes (mémoire : « sessions parallèles »). Prévoir des changements minimaux et localisés, ou un seul agent.
* **Fichiers neufs** (widgets) : collisions faibles, sauf l'enregistrement dans `src/marketing/pages/widgets/index.js` et le gabarit `_node.ejs`.

## 3. Migrations nécessaires (éventuelles)

Aujourd'hui : dernière migration **139** (`139_abonnements.sql`), 124 fichiers au total ; tables du pied inchangées depuis `128`. Une migration serait requise pour :
* des **données d'entreprise centrales** (adresse, téléphone, e-mail, horaires, slogan) — si on ne les met pas dans `mk_sites.settings`/`mk_settings` existants ;
* des **révisions par enregistrement** (nouvelle table ou extension de `mk_tb_versions`) ;
* une **clé d'origine** du pied (`libraryKey`) — elle est aujourd'hui dans le document (premier conteneur), pas besoin de colonne ;
* un **droit propre** au thème (si la gestion des permissions est en base : non vérifié).
Contraintes : **ne jamais modifier une migration existante** (test `tests/marketing-migrations-figees.test.js` : empreinte sha256 de chaque fichier ; un mot changé a déjà coupé l'emailing en production, incident du 2026-10-03) ; créer **`140_*.sql`** et ajouter son empreinte au test une fois publiée ; les migrations du pied passent par une recopie de table (voir 128) : SQLite sans `ALTER ... DROP`. Migration sans perte : l'import des anciens pieds (`legacy.js`) doit rester **idempotent** (`legacy_ref` unique par site et par NULL via `COALESCE(site_id, 0)`).

## 4. Tests existants à préserver (liste ciblée pied / Theme Builder)

Résultats **exécutés pendant cet audit** : `theme-builder-pied-unique` **4/4** (209 s) ; `theme-builder-noyau` **14/14** ; `theme-builder-regles` **12/12**. Une boucle de relance (`pieds-identites`, `widgets-theme-builder-unicite`, `pieds-bibliotheque`, `pied-de-page-coherence`, `stockage`) a été lancée mais son filtre de sortie était faux : **résultat non exploitable, ces suites sont à considérer « non vérifiées »** (la machine exécutait aussi une grosse suite d'une autre session ; un arrêt de ses processus a été refusé par le système et n'a pas été contourné).

À ne pas casser (par rôle) :
* Un seul pied : `theme-builder-pied-unique`, `theme-builder-pied-de-page-coherence` (10 tests, dont Chrome 1280/820/390 px), `widgets-theme-builder-unicite*`, `theme-builder-pieds-bibliotheque` (100 modèles, « UNE seule fois », grammaire, responsive).
* Identités : `theme-builder-pieds-identites`.
* Conditions/résolution : `theme-builder-noyau`, `-regles`, `-rendu`, `-couverture-rendu`, `-contexte-rendu`, `-stockage`, `-routes`, `-site-principal`, `site-principal-theme-builder`.
* Édition/cycle : `theme-builder-stabilisation` (14), `-modeles-editeur`, `-vignettes-retour`, `-apercu-vignette`.
* Interface : `theme-builder-kolakisa-ui`, `-elementor-ui`, `-navigateur`, `-refonte*-navigateur`, `-bibliotheque-navigateur`, `-catalogue*`.
* En-têtes (collision) : `theme-builder-entetes-*`, `-en-tete-collant-public`.
* Éditeur : `editeur-*` (notamment `editeur-widgets-parties-navigateur`).
Pièges de lancement (mémoire du projet) : `TEST_START_TIMEOUT_MS=900000` (le serveur de test met 2 à 10 min à démarrer quand la machine est chargée) ; `--test-concurrency=1` ; les suites `*-navigateur` se sautent sans navigateur piloté ; Chrome headless ne se ferme pas seul (tuer le groupe de processus, répertoire utilisateur neuf).

## 5. Échecs préexistants à ne pas confondre avec une régression

Liste donnée par la mission (**non revérifiés** dans cet audit : ils demandent un serveur complet ; ils concernent ces fichiers de `tests/`) :
* `cms-interface.test.js` ;
* « D2 / D3 » (lots de tests/diagnostics de la mission précédente : non retrouvés par ce nom dans le dépôt ; à demander à l'utilisateur) ;
* migration 081 (`marketing-migrations.test.js` / `marketing-migrations-figees.test.js` : vérifier l'empreinte de `081_*` ; non vérifié) ;
* `agent-ia.test.js`, `agent-ia-navigateur.test.js`, `agent-ia-reponses.test.js` ;
* `infobulles.test.js` ;
* `apparence-themes.test.js` — cas « supprimer depuis un autre site » (branche `correctif-apparence-themes` en cours dans un autre worktree).
Règle : avant toute modification, lancer la même suite sur `main` pour confirmer l'état de départ ; ne comparer que les différences.
Autre échec connu (mémoire du projet) : `theme-builder-apercu-vignette` « toutes les catégories » échoue sur `main` à cause d'un bandeau (détail non rappelé ici).

## 6. Risques fonctionnels propres au pied

1. **Régression de la règle « un seul pied »** en unifiant les chemins A/B/C (ARCHITECTURE §3-4). Mitigation : écrire d'abord un test de parité (même modèle → mêmes éléments sur page Page Builder, article, 404, boutique).
2. **Pied fantôme** : repli silencieux sur l'ancien pied (déjà corrigé une fois, cause racine n° 4) ; toute nouvelle logique doit garder `managed`.
3. **Conditions plus riches = plus de conflits** ; le calcul `condOverlap` doit être étendu en même temps que les types de condition, sinon des chevauchements ne seront plus détectés.
4. **Publication « tout le site » par erreur** (pas de fenêtre de conditions) ; ne pas changer le comportement sans communiquer (les pieds publiés existants continuent de s'appliquer).
5. **Mouvement / vidéo de fond** : poids et lecture automatique ; vérifier `prefers-reduced-motion` avant de proposer ces options dans le catalogue.
6. **Liens `tel:`/`mailto:`** : élargir `linkUrl` (`sections.js:19`) doit rester une liste blanche stricte (schémas fixes, caractères restreints, jamais `javascript:` ni `data:`).
7. **Rétrocompatibilité des documents** : 100 modèles × sites existants contiennent des nœuds figés ; ne pas renommer de propriétés, ajouter seulement (grammaire fermée : une propriété inconnue est rejetée par `normalizeNode`).
8. **Export/import** : le format `kolakisa-theme-template@1` est déjà en circulation ; versionner (`@2`) plutôt que modifier.
9. **Performance** : `published()` met en cache la liste des modèles par site (invalidation `stampOf`) ; une résolution plus coûteuse (nouvelles conditions) s'exécute à chaque page non statique.
10. **Droits** : le pied dépend de `forms.*` ; si on crée un droit propre, prévoir la migration des rôles existants (non vérifié : où sont stockés les droits).
11. **Médias et formulaires entre sites** : validation de forme seulement (voir ARCHITECTURE §6) ; à durcir avant de promettre le « partage entre sites ».
12. **Site principal** : `site_id NULL` ; tous les nouveaux SQL doivent utiliser `IS ?` (et non `= ?`) comme `store.js`, sinon le site principal disparaît.

## 7. Ce qui n'a pas pu être vérifié (à ne pas affirmer)
* Aucun rendu dans Chrome pendant cet audit (aucun test navigateur relancé) : toute affirmation visuelle repose sur le code ou sur la documentation existante (`PIED_DE_PAGE_CAUSES_RACINES`, `kolakisa-footer-library-verification`).
* Pied dans les pages boutique (affirmé par lecture de `_bottom.ejs`, pas d'exécution).
* Contrôle d'accès aux fichiers du dossier `uploads` (images d'un autre site par adresse).
* État des branches `boutique-*`, `briques-moteur`, `personnaliser-shell` vis-à-vis du pied.
* Résultats des échecs préexistants listés au §5.

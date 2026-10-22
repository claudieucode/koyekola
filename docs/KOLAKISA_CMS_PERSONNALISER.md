# KOLAKISA CMS — Apparence → Personnaliser (palier APPARENCE)

Branche `apparence-personnaliser`, issue de `origin/main` (`0af5b97`). Référence : le personnalisateur WordPress (panneau de réglages à gauche, vrai site à droite, brouillon puis publication). Ce document décrit l'état **réel**.

## 1. Audit de l'existant (avant le palier)

| Élément | Constat |
|---|---|
| Moteur de design du **site principal** | `appearance_configs` (`services/appearance.js`) : jetons, en-tête, pied de page ; brouillon / publication / historique ; CSS compilé servi par `res.locals.appearance()` ; mémo invalidé par `version`. Un aperçu du brouillon existe (`?kwpreview=1`). |
| Moteur de design d'un **site** | `mk_sites.tokens` (schéma unique `pages/tokens.js`) + `mk_sites.settings` (identité, mise en page, CSS du site…) ; enregistrement par `pages.saveSiteDesign` (révision, conflits, invalidation des caches). **Aucun brouillon** : tout enregistrement est en ligne. |
| Éditeur actuel (Apparence → Éditeur du site) | Formulaires sans aperçu en direct ; **toutes ses routes ne visent que le site principal** (`appearance.*(null, …)`), famille « organisation ». Un site ne pouvait pas modifier son apparence avec brouillon/publication. |
| Thèmes (palier précédent) | Un thème = des jetons ; activé via les moteurs ci-dessus. Aperçu par `?kwtheme=` (`middlewares/themePreview.js`). |
| Médiathèque | `KWMediaPicker` / `KWMedia` : sélecteur partagé, site vérifié par le serveur (`<meta name="mk-media-site">`). |
| Menus | `services/navigation.js` (menus et emplacements par site). |
| Droits / site | `appearance.read | styles | publish`, `pages.code` (CSS), `seo.edit` ; le site vient de l'adresse (`routeScopes.js`, `target()` comme Thèmes). |
| CSS du site | `settings.customCss` validé par `normalizeSiteCss` (préfixe `.lp-site`, ni `@`, ni ressource externe). |

Lacunes : pas d'écran unique avec aperçu réel, pas de brouillon pour un site, pas de réglages d'identité (logos, favicon) éditables avec aperçu, pas de conflit entre sessions, pas d'historique des publications d'un site.

## 2. Architecture retenue (aucun second moteur)

Le personnalisateur **écrit dans les moteurs existants au moment de publier** ; il n'ajoute que le brouillon, l'historique et le calcul d'aperçu.

| Brique | Fichier |
|---|---|
| Service : catalogue des réglages, validation, brouillon, aperçu, publication, versions | `src/services/customizer.js` |
| Routes (écran, aperçu, brouillon, publier, annuler, restaurer) | `src/marketing/web/customizer.js` |
| Aperçu réel de la page (réglages en cours superposés en mémoire) | `src/middlewares/customizerPreview.js` (branché dans `locals.js`, paramètre `?kwcustom=1`) |
| Interface | `views/marketing/customizer.ejs`, `public/js/customizer.js`, `public/css/customizer.css` |
| Données | migration `096_personnalisateur.sql` : `cms_customizer_drafts`, `cms_customizer_versions` (toutes deux par site, `site_id` NULL = principal) |
| Intégration | `cmsNav.js` (entrée « Personnaliser », mode `customizer`), `routeScopes.js` (règle `personnaliser-du-site`, famille `personnaliser-par-site`), `appearance.parts({ override })` (aperçu), ids de feuilles de style dans `landing.ejs` |

**Un brouillon** est un objet `{ "chemin.du.réglage": valeur }` ne contenant que les réglages **différents** de la version en ligne. Chaque chemin doit exister dans le **catalogue** (`CONTROLS`) de CE type de site : un réglage que le moteur ne sait pas rendre n'est jamais proposé (la liste de ce qui manque est affichée dans l'écran, « Non disponible pour ce site »).

**Publier** : le serveur relit le brouillon, le revalide avec les validateurs des moteurs (strict : une valeur refusée est une erreur, jamais corrigée en silence), puis, en une transaction :
- site principal → `appearance.setDraft` + `appearance.publish` (CSS compilé, historique, mémo invalidé) ;
- site → `pages.saveSiteDesign` (révision vérifiée, caches de sites invalidés) ;
- ajoute une ligne d'historique (valeurs publiées **et** valeurs remplacées), supprime le brouillon, journalise `customizer.published` avec le site.
L'interface n'annonce le succès qu'après cette réponse.

**Conflits** : le brouillon porte une version (`rev`, verrou optimiste) : deux sessions ne s'écrasent pas ; la publication refuse si le moteur a été publié ailleurs depuis le début du brouillon (`base_rev`), et, pour le principal, si un brouillon de l'Éditeur du site est en cours (pour ne jamais publier le travail d'une autre personne).

**Aperçu en direct** : la page réelle est affichée dans un cadre (même origine). Les réglages qui ne changent que le CSS recalculent les feuilles de style par le **même code que le site public** (`appearance.buildCss`, `siteAssets`) et les remplacent dans le cadre sans recharger ; les réglages qui changent le contenu (nom, logos, en-tête…) rechargent le cadre en gardant la position de défilement. La copie de travail est gardée **dans la session de la personne, par site** ; elle n'est appliquée qu'avec `?kwcustom=1`, pour un site où la personne a `appearance.read`.

## 3. Matrice WordPress → Kolakisa

| Personnalisateur WordPress | Kolakisa | État |
|---|---|---|
| Identité du site (titre, slogan, logo, icône) | Panneau « Identité du site » : nom, slogan/description, logo principal, logo mobile, favicon (sites) ; nom, logo, texte alternatif, slogan du pied (principal). Images : sélecteur de la médiathèque **du site actif**, remplacer / retirer avec confirmation | ✅ |
| Logo pour fond sombre | — | ❌ non géré par le moteur (indiqué) |
| Couleurs globales | « Couleurs » : principale, secondaire, accent (sites), fond, surface, texte, texte discret, liens, liens au survol, bordures ; sélecteur + saisie HEX validée, réinitialisation, alerte de contraste | ✅ |
| Typographie | polices titres/texte, tailles, graisses, interlignes (H1-H3, texte), espacement des lettres (sites), soulignement des liens | ✅ (pas de réglage par appareil) |
| Mise en page / largeurs | principal : largeurs large/étroite ; sites : pleine largeur, conteneur, texte, marge latérale, espacements, arrondis, ombre des cartes | ✅ |
| En-tête | principal : logo, recherche, panier, compte, annonce, bouton, bouton mobile ; sites : lien vers le Page Builder (l'en-tête y est un composant) | ✅ principal · ↗ sites |
| Pied de page | principal : marque, copyright, cookies ; sites : lien vers le Page Builder | ✅ principal · ↗ sites |
| Menus | liste des menus du site et de leurs emplacements ; lien vers Navigation | ↗ (les menus s'enregistrent directement dans Navigation) |
| Boutons | arrondi, marges, couleurs normal/survol, focus ; bordure et ombre (sites) | ✅ |
| CSS additionnel | sites : zone de saisie avec compteur, validation serveur, droit `pages.code` | ✅ sites · ❌ principal (pas de stockage) |
| Widgets, page d'accueil statique | — | ❌ absents de l'architecture (Accueil : Réglages) |
| Brouillon / Publier / aperçu appareil | oui (voir §2) ; Ordinateur / Tablette 768 px / Mobile 390 px | ✅ |
| Annuler / rétablir | historique local (100 niveaux), Ctrl/⌘+Z, Ctrl/⌘+Y | ✅ |
| Versions publiées | « Versions publiées… » : revenir en arrière = ancien état placé dans le brouillon | ✅ |
| Thème actif / Changer | lien vers Apparence → Thèmes | ↗ |

## 4. Isolation multisite et sécurité

- Le site vient de `?site=` / du champ « site » **vérifié par le serveur** (`target()` + garde de portée) : un accès limité au site A obtient 403 sur toute lecture/écriture visant B, le principal, une valeur forgée ou invalide (testé sur les 5 routes × 4 formes de site).
- Brouillons, versions, copie de travail d'aperçu et clés de session sont **par site** ; publier A ne change ni B, ni le principal, ni leurs brouillons (comparaison de l'état avant/après).
- Images : l'image choisie doit appartenir à la médiathèque du site (ou être commune) ; celle d'un autre site est refusée côté serveur.
- Droits revérifiés à chaque requête : lecture (`appearance.read`), brouillon/aperçu (`appearance.styles`), publication/restauration (`appearance.publish`), CSS (`pages.code`), slogan du site (`seo.edit`).
- Site archivé/supprimé : lecture seule (409 sur toute écriture).
- CSS du site : isolé par préfixe `.lp-site` (le panneau d'administration n'est jamais affecté), validé par le moteur existant ; le CSS compilé est nettoyé de `<` `>` avant d'être injecté ; le JSON de démarrage de la page échappe `<`.
- Aperçu : `no-store`, `noindex`, jamais mis en cache ; les formulaires sont désactivés dans le cadre, les liens externes s'ouvrent hors de l'aperçu.

## 5. Tests

`tests/personnalisateur.test.js` (23 tests, vraies routes, vraie base, vrais comptes : équipe, administrateur / éditeur / lecteur du site A, sites A et B, principal) : écran et catalogue par type de site, aperçu et rejet des valeurs invalides, aperçu de la page réelle limité à la session et au site, brouillon et conflit de versions, publication vérifiée **dans le moteur et dans le rendu**, historique et retour en arrière, principal (moteur d'apparence + site public), blocage par un brouillon de l'Éditeur, médias, permissions par rôle, accès limité forgé, site archivé, visiteur, menu. Le parcours a aussi été exécuté dans un **vrai navigateur** (Chromium piloté par le protocole DevTools) : ouverture, panneau Couleurs, saisie d'un code HEX (aperçu instantané), code invalide (erreur, publication bloquée), aperçu mobile, enregistrement du brouillon, confirmation et publication (base mise à jour), sans erreur de console.

Tests existants adaptés dans le même commit (compteurs et classements, aucune assertion affaiblie) : registre du menu (65 entrées de site, 70 au registre, 69 + Composants + 10 Marketing), dernière migration 096, entrée « Personnaliser » classée « ouverte » avec son lien plein cadre `?site=<id du menu>` exigé identique au site courant, inventaire des tables (`cms_customizer_*` classées « isolee »).
Non-régression : lot de 183 fichiers puis relance en isolation des fichiers touchés par des délais de démarrage du serveur de test (machine très chargée) ; échecs restants = ceux déjà présents sur `main` propre (migrations 090/091 ×3, oracle `portee-des-routes`, index 079, `contenus-par-site-unitaire` annulés).

## 6. Limites connues (non faites, pas simulées)

- **Réglages par appareil** (valeurs distinctes tablette/mobile) : le moteur de jetons est global ; l'aperçu montre le vrai comportement responsive.
- **Logo pour fonds sombres, hauteur/ombre/comportement au défilement de l'en-tête, options des articles/archives/pagination** : non rendus par le moteur actuel, donc non proposés (liste visible dans l'écran).
- **En-tête et pied de page d'un site** : composants du Page Builder, modifiés là (lien direct) ; non éditables dans ce panneau.
- **Menus** : sélection et ordre se font dans Navigation (enregistrement direct, hors brouillon) ; l'écran liste les menus et actualise l'aperçu.
- **CSS additionnel du site principal** : pas de stockage dans le moteur d'apparence principal. **Coloration syntaxique** : aucune bibliothèque d'éditeur n'est présente dans le projet ; la zone de saisie est un champ de code simple avec validation serveur.
- **Aperçu** : la page choisie est celle du site (accueil, pages ; principal : accueil, blog, catalogue, à propos, dernier article). Un changement de contenu (nom, logo, en-tête) recharge le cadre.
- **Principal** : si un brouillon de l'Éditeur du site est en cours, la publication depuis Personnaliser est refusée avec un message (pour ne pas publier ce travail par erreur).
- **Domaines personnalisés** : l'aperçu s'ouvre dans le domaine d'administration (même origine, nécessaire au contrôle du cadre) ; le site public d'un domaine personnalisé lit les mêmes jetons publiés (moteur inchangé).
- **Thèmes** : activer un thème (Apparence → Thèmes) remplace les jetons du site, comme avant ; un brouillon du personnalisateur en attente garde ses valeurs (revalidées à la publication).

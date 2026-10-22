# KOLAKISA CMS — Barre d'administration supérieure (palier BARRE-ADMIN)

Branche `barre-admin`, issue de `origin/main` (`09408c6`). Référence fonctionnelle : la barre d'administration de WordPress (accès au site, création rapide, notifications, profil, actions contextuelles) — **réinterprétée** dans l'identité Kolakisa (marine, discrète, animée avec retenue). Ce document décrit l'état **réel**.

## 1. Audit de l'existant

| Élément | Constat |
|---|---|
| Coque du CMS | `views/marketing/partials/top.ejs` : rail d'applications, menu latéral (`cms-nav`), barre du contenu `.mk-topbar` (fil d'Ariane + actions). `cms` (menu calculé par `cmsNav.js`) vaut `null` hors CMS : le Marketing garde sa coque. |
| Barre du haut (avant) | `cms-topbar.ejs` : recherche (principal), « Voir le site » (**toujours `/`**, même pour un site à domaine propre), menu « Ajouter » (Page seulement dans un site), thème, menu du compte dans `top.ejs`. Sélecteur de site : dans le menu latéral (`cms-site-switch.ejs`). |
| Sites autorisés | `helpers.cmsSites(ctx)` (liste filtrée par les droits : équipe = tous, membre = les siens) ; site principal réservé à l'équipe (`ctx.siteScope === undefined`). |
| URL publiques | `services/urls.js` (domaine propre `settings.seo.publicUrl`, sinon `/p/<adresse>`) : on ne suppose jamais un domaine unique. |
| Notifications | `services/notifications.js` (élèves) et **centre d'activité du formateur** `services/gestion/activity.js` (`activity_reads`, `activity_state`) : données réelles, **mais non isolées par site** (les commentaires de tous les sites y sont mêlés). Aucune notification par site n'existait. |
| Profil / déconnexion | `/formateur/profil`, `/mon-compte`, `/formateur`, `/mes-cours` ; déconnexion `POST /deconnexion`. |
| Menus déroulants | `public/js/mk/shell.js` (`data-mk-dropdown`) : sans recherche, sans animation de fermeture ; réutilisé tel quel ailleurs, non modifié. |
| Thème clair / sombre | `data-kola-theme`, bouton `data-kola-theme-cycle` et choix `data-kola-theme-set` pris en charge par `shell.js` : réutilisés. |
| Positions « collantes » | ~10 règles CSS dépendent de `--mk-topbar-h` (barre du haut, menu latéral, barre d'actions groupées, aperçus…). |

## 2. Architecture retenue (une seule implémentation, aucun second système)

| Brique | Fichier |
|---|---|
| Données de la barre (sites, adresse publique, création, actions contextuelles, profil, compteur) — calculées côté serveur, filtrées par les droits | `src/services/adminBar.js` (+ `helpers.adminBar`) |
| Notifications d'un site (liste, ouverture, « lu », « tout lu ») | `src/marketing/web/adminBar.js` (`/marketing/barre/…`) ; site vérifié par `web/siteTarget.js` (option `json` ajoutée) |
| Composant | `views/marketing/partials/cms-adminbar.ejs` (inclus UNE fois par `top.ejs`, pour tous les écrans de la coque CMS) |
| Comportement (menus, clavier, filtre des sites, notifications) | `public/js/adminbar.js` |
| Habillage et intégration (décalage de la coque) | `public/css/adminbar.css` |
| Portée des routes | `routeScopes.js` : règle `barre-du-site`, famille `barre-par-site` |

Supprimés (remplacés, plus aucune référence) : `cms-topbar.ejs`, `cms-site-switch.ejs`. Le menu du compte et le bouton de thème de la barre du contenu ne subsistent que pour les écrans **Marketing** (hors CMS).

**Écrans** : tous ceux de la coque CMS (tableau de bord du principal et des sites, pages, articles, médias, commentaires, apparence, thèmes, polices, navigation, utilisateurs, SEO, redirections, tests A/B, outils, paramètres, fiche d'une page…). **Exceptions** : site public, connexion, aperçus, Page Builder, éditeur du blog, Personnaliser, éditeurs plein cadre (ils n'utilisent pas cette coque), et le Marketing (coque propre).

## 3. Fonctions de la barre

- **Identité** : logo cliquable → tableau de bord du site courant (ou « Mes sites » hors site). Pas d'avertissement nécessaire : les écrans de la coque n'ont pas de travail non enregistré en cours (les éditeurs plein cadre n'affichent pas la barre).
- **Sélecteur de site** : site courant (nom, favicon, domaine), liste des sites **autorisés** (+ « Site principal » et « Gérer les sites » pour l'équipe), recherche au-delà de 5 sites, clavier complet ; choisir un site ouvre SON tableau de bord (nouveau contexte, calculé par le serveur à partir de l'adresse).
- **Voir le site** : domaine propre → `https://domaine/` ; sinon accueil publié `/p/<adresse>` ; sinon bouton **désactivé** avec l'explication (aucune page publiée, site archivé) ; principal → `/`. Nouvel onglet.
- **Créer** : Page, Article, Média, Formulaire (de CE site) et Site (équipe), chacun vers son vrai écran de création ; filtré par droits et par modules ouverts dans le site.
- **Actions liées à l'écran** : fiche d'une page → Modifier avec l'éditeur / Prévisualiser / Voir la page (publiée) avec l'identifiant de la page consultée (vérifiée comme appartenant au site) ; tableau de bord d'un site → Modifier la page d'accueil (si elle existe), Personnaliser ; Apparence → Personnaliser.
- **Notifications** : cloche + compteur réel (« 9+ » au-delà) ; panneau (non lues marquées d'un point, « Marquer comme lue », « Tout marquer comme lu », état vide, chargement, erreur avec « Réessayer ») ; lien vers l'élément (qui le marque lu). **Sources réelles** : commentaires à modérer **du site courant** (droit `comments.moderate`) ; pour le site principal d'un formateur, en plus : ventes, inscriptions, comptes élèves et messages déjà suivis par le centre d'activité. L'état « lu » est celui du centre d'activité (`activity_reads`) : une seule vérité ; « tout lu » ne concerne que le site courant.
- **Profil** : initiale, nom, rôle ; Mon profil, Paramètres du compte, Mon espace / Mes formations, thème Clair / Sombre / Auto, Déconnexion (formulaire POST existant).
- **Raccourcis secondaires** (recherche du CMS pour le principal, thème) ; menu « ··· » sur écran étroit.
- **Extensibilité** : une zone = un bloc du composant ; ajouter un raccourci = ajouter une entrée dans `adminBar.build()` (le gabarit boucle sur `create` / `context`).

## 4. Interaction et accessibilité

Menus : s'ouvrent sous leur bouton, restent dans l'écran (bascule à droite, hauteur maximale, défilement interne), Échap ferme et rend le focus, clic extérieur ferme, flèches / Début / Fin, focus visible, `aria-haspopup` / `aria-expanded` / `aria-controls`, ouverture et fermeture par courtes transitions d'opacité et de déplacement (pas de saut de mise en page), infobulles après 450 ms (souris **et** clavier), `prefers-reduced-motion` respecté, aucun polling : la liste est relue à l'ouverture et au retour sur l'onglet.

## 5. Isolation et sécurité

- Le site des notifications vient de `?site=` / du champ « site » **vérifié côté serveur** (accès limité → son site seulement ; équipe → le site choisi, sinon le principal) ; liste, compteur, lecture et « tout lu » ne portent que sur les éléments **de ce site** ; un élément d'un autre site est refusé (404) et rien ne change.
- Chaque lien de la barre est filtré par les permissions, mais n'est **pas** la protection : les routes de destination revérifient droits et portée. Les identifiants des actions contextuelles viennent du contenu réellement affiché.
- Noms de site, de personne et textes de notification sont échappés (HTML) ou injectés par `textContent`.
- La déconnexion utilise le formulaire POST de la plateforme (session invalidée, vérifié).

## 6. Tests

`tests/barre-admin.test.js` (24 tests, vraies routes / base / comptes équipe, administrateur, éditeur, lecteur) : présence unique de la barre et exceptions, sélecteur (équipe vs accès limité, échappement), adresse publique (domaine, `/p/…`, désactivée, principal), création selon les droits, actions de contenu avec identifiants exacts, notifications par site (compteurs, isolation, 403, lecture, « tout lu » local, ouverture), profil et déconnexion réelle, accessibilité. Parcours vérifié aussi dans **Chrome** (écrans 1440, 1000 et 390 px, clair et sombre) : barre de 44 px, coque décalée sans chevauchement, menus (Créer, sites avec recherche, notifications, profil), Échap, marquage « lu » avec compteur, aucun défilement horizontal, aucune erreur de console. Tests existants adaptés : sélecteurs des tests navigateur (`.kab-site`) ; aucune assertion affaiblie.

## 7. Limites connues (non faites, pas simulées)

- **Marketing** : sa coque propre n'a pas cette barre (palier ultérieur possible : même composant, autre jeu de données).
- **Public** : la barre n'est pas affichée par-dessus le site public (« Modifier cette page » depuis la page publique) : les pages publiques sont une exception volontaire.
- **Notifications** : pas de temps réel (aucun canal poussé n'existe) ; sources limitées à celles qui existent (commentaires à modérer par site ; activité de la plateforme pour le principal d'un formateur). Les avis sur les formations ne sont pas dans la cloche (non rattachés à un site).
- **Changement de site** : mène au tableau de bord du site (le même écran dans un autre site n'est pas conservé).
- **Recherche globale** : reprise de la recherche du CMS (principal seulement) ; pas de palette de commandes.
- **Aide** : aucune page d'aide centrale n'existe, donc aucune entrée « Aide » n'est affichée.
- Les anciennes règles CSS du sélecteur de site latéral (`.mk-cms-site*`) subsistent dans `cms.css` (inutilisées).

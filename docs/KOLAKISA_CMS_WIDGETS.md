# KOLAKISA CMS — Apparence → Widgets (palier WIDGETS-01)

Branche `apparence-widgets-01`, issue de `main` (`0af5b97`). Référence : l'éditeur de widgets de WordPress (Gutenberg). Ce document décrit l'état **réel**.

## 1. État initial (audit)

- **Il n'existait aucun écran « Widgets »** ni notion de zone de widgets. Les « widgets » du code (`src/marketing/pages/widgets/*`) sont les éléments du Page Builder (autre concept, conservé tel quel).
- Les emplacements réels du site : pied de page du **site principal** (`views/partials/footer.ejs`, déjà piloté par Apparence → Pied de page et le menu « footer »), liste et pages d'articles du **blog** (`views/blog/index.ejs`, `show.ejs`, sans colonne latérale), pied de page minimal des **pages d'un site** (`views/marketing-public/landing.ejs`).
- Le site courant est établi par le serveur : site d'un domaine (`req.kwSite`, public), `ctx.siteScope` / `?site=` / `/sites/<id>/…` (admin). Les articles d'un domaine sont filtrés par `urls.contentScope`.
- Permissions existantes réutilisées : `appearance.read` (voir), `appearance.publish` (enregistrer — les widgets sont publics, comme l'activation d'un thème).

## 2. Architecture (aucun second moteur)

| Brique | Fichier |
|---|---|
| Zones (3, toutes réellement rendues) et **18 blocs** : réglages décrits, validation, rendu HTML échappé | `src/marketing/widgets/catalog.js` |
| Service : lecture, enregistrement tout-ou-rien avec contrôle de version, rendu d'une zone, aperçu d'un bloc | `src/services/widgets.js` |
| Routes : écran, `POST /enregistrer` (JSON), `POST /apercu` (JSON) | `src/marketing/web/widgets.js` |
| Éditeur (barre d'outils, zones, panneau Blocs / Réglages / Structure, glisser-déposer, historique, enregistrement) | `views/marketing/widgets.ejs`, `public/js/cms-widgets.js`, `.mk-wd-*` dans `public/css/cms.css` |
| Widgets publics | `public/css/widgets.css` ; points d'insertion : `partials/footer.ejs`, `marketing-public/landing.ejs`, `blog/index.ejs`, `blog/show.ejs` ; fonctions `widgetZone` / `widgetZoneFor` dans `middlewares/locals.js` |
| Données | migration `095_widgets_par_site.sql` (table `cms_widget_layouts`) |
| Menu, délégation, portée | `cmsNav.js` (entrée « Widgets », module délégué), `routeScopes.js` (`widgets-du-site`, famille `widgets-par-site`) |

**Zones** : `sidebar` (colonne à droite de la liste du blog ; sous l'article sur la page d'un article), `footer-1` et `footer-2` (sections du pied de page du principal, du blog et des pages d'un site). Une zone n'est proposée que si le moteur la rend. Il n'y a pas de zone « en-tête » : le moteur ne la prend pas en charge (Apparence → En-tête gère l'en-tête).

**Blocs** (tous rendus côté serveur, jamais de code exécutable) : Paragraphe, Titre, Liste, Image, Galerie, Vidéo (fichier), Audio (fichier), Bouton, Séparateur, Espace, Identité du site, Navigation (un menu du site), Recherche, Articles récents, Commentaires récents, Catégories, Nuage d'étiquettes, HTML personnalisé (assaini par liste blanche : ni script, ni cadre, ni formulaire, ni gestionnaire d'événement, ni `javascript:`).

## 3. Modèle de données

`cms_widget_layouts` : **une ligne par site** (`site_id` NULL = principal), index unique `COALESCE(site_id, 0)`. `layout` = JSON `{ zones: { <zone>: [bloc] }, inactive: [bloc] }` ; bloc = `{ id, type, settings }`. `revision` : compteur incrémenté à chaque enregistrement ; **un enregistrement avec une version périmée est refusé (409)**. Les widgets désactivés vivent dans `inactive` : ils gardent leurs réglages et ne sont jamais rendus. Migration additive ; annulation : `DROP TABLE cms_widget_layouts` (sans ligne, un site n'affiche aucun widget).

## 4. Fonctions

- **Barre d'outils** : titre, « + » (catalogue), Annuler, Rétablir, Structure, indicateur « Modifications non enregistrées », Enregistrer (chargement / réussite / erreur), panneau, menu d'actions (replier / déplier, abandonner, gérer les menus).
- **Zones** : repliables (mémorisé par site dans le navigateur, le contenu n'est jamais perdu), description, nombre de blocs, bouton d'ajout, état vide, zone « Widgets désactivés ».
- **Catalogue** : recherche instantanée sans accent, catégories, nombre d'utilisations, état vide ; clic ou glisser dans une zone.
- **Gestion** : ajouter à une zone précise, déplacer (monter/descendre, glisser-déposer avec ligne d'insertion, menu « Déplacer vers… », Alt+↑/↓), dupliquer, supprimer (annulable ; confirmation pour la suppression définitive d'un désactivé), désactiver / restaurer, sélection depuis la zone ou la structure. Déplacements invalides refusés (zone pleine à 40 blocs ; un nouveau bloc ne se dépose pas dans « désactivés »).
- **Réglages** : formulaire généré depuis la description du bloc ; l'aperçu de chaque bloc est le **rendu du serveur** (même code que le site public), actualisé à la saisie.
- **Annuler / Rétablir** : historique local (100 niveaux, saisie regroupée). Annuler après un enregistrement crée une nouvelle modification à enregistrer : un enregistrement serveur n'est jamais « annulé » silencieusement. Raccourcis sans interférer avec la saisie (Ctrl+Z dans un champ reste celui du champ).
- **Enregistrement** : tout ou rien (une erreur n'écrit rien), anti double envoi, conflit de version avec message et blocage, erreur réseau/serveur avec « Réessayer » (les modifications restent dans l'éditeur), protection à la fermeture (`beforeunload`), après succès l'état affiché est **celui que le serveur a normalisé et enregistré**.

## 5. Isolation multisite

- Le site vient de l'adresse vérifiée (`/sites/<id>/widgets` → `?site=<id>`, ou paramètre `site`) ; **jamais** du corps de la requête quand l'adresse en fournit un, jamais d'un cookie ou d'un état global.
- Accès limité à un site : tout autre site, le principal, ou une valeur forgée (adresse, paramètre, corps) → 403, aussi pour l'aperçu ; garde de portée `routeScopes` en plus. Site inconnu → 404 ; site archivé / supprimé → consultation seule, enregistrement refusé.
- Chaque lecture/écriture est limitée à la ligne du site ; **aucune configuration globale**. Le bloc Navigation ne rend que les menus **du même site** (vérifié à l'affichage : un identifiant de menu forgé d'un autre site n'affiche rien) ; les blocs dynamiques utilisent le filtre de contenu du domaine (`urls.contentScope`).
- **Aucun cache** : le rendu relit la base (les blocs dynamiques doivent rester à jour) ; il n'y a donc aucune clé de cache à isoler.
- Rendu public : le site d'un domaine / d'une page lit **sa** ligne ; le principal lit la sienne ; un site sans widgets garde son pied de page d'origine.

## 6. Permissions (côté serveur)

| Action | Permission | Rôle minimal |
|---|---|---|
| Voir l'éditeur, aperçu d'un bloc | `appearance.read` | lecteur |
| Enregistrer | `appearance.publish` | administrateur |

L'interface désactive l'édition sans ce droit, mais le contrôle est refait par la route.

## 7. Validation et tests

- `tests/apparence-widgets.test.js` — 30 tests sur de vraies routes, une vraie base, 3 sites + principal, comptes administrateur / éditeur / lecteur : ouverture, catalogue, persistance, réorganisation, désactivés, duplication, conflit de version, double envoi concurrent, validation (zones/blocs inconnus, doublons, limites, JSON illisible), assainissement (adresses dangereuses, HTML, classes), rendu public (principal, blog, article, pages d'un site, désactivés jamais rendus), navigation inter-sites, aperçu, permissions, isolation (adresse, paramètre, corps forgés), site inconnu/archivé, contenu corrompu en base.
- `tests/apparence-widgets-navigateur.test.js` — parcours dans un **vrai Chrome** (Playwright, ignoré si absent) : ajout, réglages, annuler/rétablir, glisser-déposer (dans une zone, entre zones, depuis le catalogue, refus dans les désactivés), déplacer/dupliquer/désactiver/restaurer, clavier, structure, panneau, protection à la fermeture, erreur serveur et « Réessayer », persistance et rendu public, double clic, conflit, lecture seule, isolation, absence de défilement horizontal à 1400 / 900 / 390 px, absence d'erreur JavaScript.

## 8. Limites connues (non faites, pas simulées)

- **Pas de zone « en-tête »** (non prise en charge par le moteur) ; pas de zones propres à un thème : les trois zones sont celles du moteur de rendu de Kolakisa (le thème n'ajoute pas d'emplacements).
- **La colonne latérale** s'affiche à droite de la liste du blog (écran large) mais **sous l'article** sur la page d'un article ; elle n'existe que là où le blog est servi (site principal, domaine d'un site). Les pages d'un site (landing) n'ont pas de colonne latérale.
- **Blocs non proposés** car le moteur n'a pas la fonction : *Archives* par mois (aucune page d'archive par date), *Liste de pages*, *Groupe de boutons*, vidéo/audio intégrés depuis YouTube/Vimeo/etc. (seuls les fichiers). Le bloc HTML n'accepte ni script, ni cadre, ni formulaire.
- **Images** : adresse d'un fichier du site (`/uploads/…`) ou `https` saisie à la main ; pas encore de sélecteur de la médiathèque dans l'éditeur.
- **Panneau latéral** : ouvrable/fermable, pas redimensionnable.
- **Pas de brouillon** : enregistrer publie (comme l'activation d'un thème) ; l'historique des versions n'est pas conservé (seul le journal d'audit enregistre qui a enregistré, quand, combien de blocs).
- Les blocs de commentaires récents ne montrent pas d'extrait (nom + article) ; l'aperçu dans l'éditeur n'applique pas le thème du site (il montre la structure et les données réelles).

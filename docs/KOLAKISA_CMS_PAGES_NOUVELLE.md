# KOLAKISA CMS — Pages → Ajouter une page (palier PAGES-02)

Branche `pages-02-ajouter`, issue de `origin/main` (`7c7eed6`). Ce document sépare ce qui est **prouvé** (test qui échouait avant et passe après) de ce qui est **constaté par lecture du code**.

## 1. Audit du parcours existant (réutilisé, aucun second assistant)

- **Une seule boîte** `views/marketing/partials/new-page-dialog.ejs`, incluse par la liste centrale (`landing-list.ejs`) et par l'écran Pages de chaque espace de site (`cms-screen.ejs`, site = celui de l'espace, champ caché revérifié par le serveur). Elle proposait déjà : nom, **Modèle de départ** (page vierge, *Mes modèles* du site, 23 modèles intégrés dont vente, lead, webinaire, formation…), **Mise en page** (conception libre / guidée par un format).
- **Création** `POST /marketing/pages` (`landing.js`) → `pages.createPage` (service partagé) → l'éditeur visuel `/marketing/pages/:id/editeur`. Droits `forms.write`, site vérifié par `routeScopes` (`creation-avec-site`) et `assertSiteScope`.
- **Entrées** : bouton de la liste, bouton principal du menu et « Ajouter → Page » de la barre du haut (liens `…/pages#nouvelle`, déjà dans le cadre du site pour un site), plus quelques liens du principal.

## 2. Pourquoi le parcours ne garantissait pas « boîte d'abord, éditeur ensuite, une seule page »

(Points 1, 2 et 3 : **prouvés** — leurs tests échouent sur l'ancien code. Points 4 et 6 : **constatés par lecture du code**, non reproduits par un test. Point 5 : constaté dans le code ; seule la logique du nom et du double envoi est testée, pas le rendu navigateur.)

1. **Ouverture de la boîte** : elle ne reposait que sur l'**ancre** `#nouvelle` et sur JavaScript ; l'ancre est perdue par toute redirection et rien ne rendait la boîte ouverte côté serveur.
2. **Aucune idempotence** : un double clic, une requête répétée ou une nouvelle tentative réseau créaient **plusieurs brouillons** (le nom étant unique, la seconde tentative échouait avec une erreur au lieu de rouvrir la page).
3. **Un seul mode d'édition** : le champ caché `ouvrir=editeur` imposait l'éditeur visuel ; aucun choix, et aucune explication sur Gutenberg.
4. **Création non atomique** : la page était insérée avant la validation de son modèle ; un refus tardif (section, droits d'un widget…) pouvait laisser un brouillon orphelin — seul le cas « formulaire d'un autre site » était défait à la main.
5. **Boîte sans garde-fous** : bouton actif avec un nom vide, pas d'état « création en cours », fermeture (Annuler, croix, Échap, fond) sans avertissement quand un nom était saisi.
6. Lien « modèle supprimé » ramenant à la liste **du principal**.

Le routage multisite de la création, lui, était déjà correct (testé : les tests multisites passent aussi sur l'ancien code) : le site vient de l'espace et est revérifié par le serveur.

## 3. Ce qui change

| Sujet | Détail |
|---|---|
| Ouverture garantie | `?nouvelle=1` (liste du principal **et** liste d'un site) rend la boîte **déjà ouverte** côté serveur (`<dialog open>`, promue en modale par JavaScript) ; l'ancre `#nouvelle` continue de fonctionner. Ouvrir ne crée **rien** (testé) |
| Création unique | Chaque ouverture de la boîte porte un **jeton** (`request_id`, usage unique). Même jeton = **même page** : la seconde réponse rouvre la page créée (double clic, requêtes simultanées, nouvelle tentative, échec d'ouverture de l'éditeur → le brouillon existe et la liste le montre). Un jeton ne sert pas à une autre personne (clé = compte + jeton). Mémoire du processus, 500 entrées — **limite** : un redémarrage du serveur oublie les jetons |
| Atomicité | `pages.createPage` s'exécute dans une transaction : page + contenu du modèle + mise en page, tout ou rien |
| Modèles | modèle personnel **d'un autre site**, supprimé ou inconnu : « Ce modèle n'est pas disponible pour ce site… Aucune page n'a été créée. » ; la liste de la boîte ne montre que les modèles du site (déjà le cas, testé) |
| Mode d'édition | section **Éditeur** : *Éditeur visuel KOLAKISA* (défaut, `/pages/:id/editeur`) ou *Édition par sections* (la fiche `/pages/:id`, formulaire par section). Tous les modèles sont compatibles avec les deux (même contenu) ; la **mise en page guidée** est un réglage de l'éditeur visuel : elle n'est ni appliquée ni annoncée avec l'édition par sections (champs désactivés) ; valeur inconnue : refusée |
| Boîte | nom nettoyé (espaces superflus retirés), bouton désactivé tant que le nom est vide, « Création en cours… » + double envoi bloqué, retour arrière du navigateur géré, **confirmation avant d'abandonner** une saisie (Annuler, croix, Échap, clic sur le fond) ; sans saisie la boîte se ferme directement ; aucune page n'est jamais créée à l'annulation |
| Liens | la suppression d'un modèle ramène à la liste **du site du modèle** avec la boîte ouverte |

Aucune migration, aucune table, aucune permission nouvelle.

## 4. Modes d'édition réellement disponibles — et Gutenberg

- **Éditeur visuel KOLAKISA** (Page Builder) : opérationnel (titre, site, modèle, mise en page et contenu de départ ; médias du **site de la page** ; enregistrement du brouillon, aperçu ; publication explicite et soumise à `pages.publish`).
- **Édition par sections** : opérationnelle (fiche de la page).
- **Éditeur de blocs de type Gutenberg pour les pages : non disponible, et NON simulé.** Le seul éditeur de blocs de Kolakisa est celui des **articles** : il stocke du HTML structuré. Les pages stockent des **sections JSON** rendues par le Page Builder ; brancher l'éditeur d'articles sur les pages créerait un second éditeur et un format incompatible (pas de migration définie). Dépendance bloquante : un modèle de contenu commun pages / blocs HTML, à décider dans un palier dédié. La boîte le dit.

## 5. Sécurité et multisite (testé)

Création limitée aux sites administrables (lecteur 403, anonyme refusé, accès limité à A : rien dans B) ; le site vient de l'espace vérifié par le serveur, jamais cru sur le champ caché ; brouillon jamais publié automatiquement (`draft`, `published_at` nul) ; publication refusée à un lecteur ; pages A / B isolées (listes, éditeur) ; sélecteur de médias de l'éditeur = celui du site de la page (`mk-media-site`) ; retour de l'éditeur vers la liste du site ; aucune adresse de domaine codée en dur.

## 6. Tests

`tests/pages-02-nouvelle-page.test.js` (23, dont 2 de logique navigateur sous Node). **Sur `main` : 10 échecs / 21 ; sur la branche : 23 réussis.** Les tests de pages, modèles, boîte commune et création en contexte de site existants passent inchangés (173/173).

## 7. Limites (non faites, pas simulées)

- **Rendu et interactions du navigateur** (boîte modale, défilement, confirmation d'abandon, focus) : non exécutés ici (tests navigateur ignorés sur cette machine) ; la logique du nom et du double envoi est testée sous Node, pas le DOM.
- **Jetons d'idempotence en mémoire** : protègent un serveur à un seul processus ; ils ne survivent pas à un redémarrage.
- **Prévisualisation d'un modèle** dans la boîte : non faite (nom, catégorie, description réels seulement).
- **Gutenberg pour les pages** : voir §4.

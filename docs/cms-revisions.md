# KOLAKISA CMS — Palier 10 : historique, sauvegarde, corbeille, récupération

## Audit : ce qui existait
| | Pages (et modèles) | Articles | Apparence (en-tête, pied de page, styles) | Patterns |
|---|---|---|---|---|
| Brouillon séparé du publié | oui (`draft`) | non (un seul état + autosave) | oui (brouillon / publié) | — |
| Historique | **versions publiées seulement** (`mk_page_versions`, 100 max, plus anciennes effacées) | **complet** (`post_revisions` : kind, meta, empreinte ; 100 max) | publications seulement (`appearance_revisions`, 30) | aucun |
| Sauvegarde auto | brouillon (PUT /brouillon) | `post_autosaves` | brouillon | — |
| Conflit | oui (`revision`) | **non** | **non** | non |
| Restauration | copie dans le brouillon **sans garder l'ancien brouillon** | sûre (état avant conservé, restauration tracée) | écrasait le brouillon | — |
| Corbeille | oui (`archived_at`) | oui (`deleted_at`) | — | **suppression directe** |
Aussi : médias (`deleted_at`) et commentaires (statut `trash`) avaient leur corbeille ; aucune vue commune ; aucun historique des états de brouillon des pages et de l'apparence.
Risques de perte : un brouillon de page restauré/écrasé sans copie ; états intermédiaires de page jamais conservés avant publication ; deux onglets sur un article ou sur l'apparence pouvaient s'écraser en silence ; pattern supprimé = perdu.

## Architecture retenue (une couche commune, pas de remplacement)
`src/services/revisions.js` : adaptateurs `page`, `post`, `appearance`, `pattern` derrière la même interface (`list`, `get`, `compare`, `restore`). Les historiques qui fonctionnent sont **lus tels quels** (articles, versions publiées des pages, publications de l'apparence) ; la nouvelle table `cms_revisions` ne conserve que ce qui manquait : points de **brouillon** des pages et de l'apparence, états **avant restauration**, restaurations, historique des patterns. Aucune donnée existante n'est copiée ni modifiée.

## Types de sauvegarde
- **Sauvegarde / autosave** : brouillon (pages : PUT /brouillon ; apparence : formulaires ; articles : éditeur). Jamais la version publique.
- **Publication** : version publiée archivée (existant, transactionnel).
- **Révision** : point d'historique (`cms_revisions` ou historique existant). Sauvegardes de brouillon rapprochées (5 min, même personne) = **un seul point** ; 100 points de brouillon conservés par élément au plus (règle explicite) ; publications, restaurations et états avant restauration ne sont **jamais** effacés automatiquement (l'historique des versions publiées d'une page reste borné à 100 par l'existant).
- **Restauration** : transaction — état actuel du brouillon conservé (`before_restore`), contenu revalidé comme une saisie (droits de widgets compris), nouveau point `restore`. Rien n'est publié. Les articles se restaurent par la route éprouvée de l'éditeur.

## Écrans (CMS)
Historique par contenu (`/site-web/historique/<page|post|appearance|pattern>/<id>`) : points groupés par jour, auteur, type, pagination 25, filtre ; Voir (contenu, aperçu rendu pour les pages) ; Comparer (pages : différences structurées par élément ; articles : texte ligne à ligne ; apparence : styles / en-tête / pied de page) ; Restaurer. **Corbeille** commune (`/site-web/corbeille`) : pages, articles, médias, commentaires, patterns ; restaurer (jamais republié d'office), supprimer définitivement (irréversible, confirmé, hors corbeille interdit). Points d'entrée : menus des listes de pages et d'articles, Apparence, Patterns, Templates, CMS → Outils → Corbeille.

## Conflits et récupération
Pages : `revision` (409). Articles : `base_updated_at` envoyé par l'éditeur (409, texte conservé à l'écran et dans le navigateur ; clients sans version = comportement d'avant). Apparence : numéro de version du brouillon (`draft_rev`) sur chaque formulaire et sur « Publier ». Récupération : sauvegarde automatique d'article plus récente que l'article (proposée à la réouverture, listée dans l'historique), brouillon de page persistant et signalé. L'éditeur n'affiche jamais « Enregistré » après un échec (testé en coupant le réseau).

## Droits (palier 9)
`revisions.view`, `revisions.restore` (éditeur ; l'Auteur sur ses articles), `revisions.delete` (administrateur : points de brouillon seulement) + le droit du contenu (pages `forms.read/write`, articles `articles.read` et propriété, apparence, patterns). Suppression définitive : `pages.delete`, `articles.delete`, `media.delete`, `comments.delete`, `appearance.patterns`. Pages : droits du site de la page (rôles par site) ; aucune lecture d'un point d'un autre contenu par manipulation de la référence.

## Limites volontaires
Hors ligne long (le navigateur ne garde qu'une copie de secours de l'éditeur d'articles ; le Page Builder n'a pas de copie locale) · patterns synchronisés (= composants du Page Builder, non versionnés ici) · menus de navigation non versionnés · historique d'un seul état « avant » par restauration · pas de nettoyage automatique de l'historique des publications au-delà des bornes existantes.

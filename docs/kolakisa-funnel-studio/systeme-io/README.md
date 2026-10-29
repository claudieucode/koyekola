# systeme.io — Tunnels de vente : documentation pour l'équipe de développement

Date de l'étude : 2026-10-27. Langue : français. Les libellés d'interface sont cités en anglais tels que publiés dans le centre d'aide anglophone (l'interface peut être traduite selon la langue du compte).

## Index

| Fichier | Contenu |
|---|---|
| PERIMETRE_ET_SOURCES.md | URLs réellement lues, ce qui n'a pas pu être lu |
| INTERFACE_ET_NAVIGATION.md | Menus, création/gestion/partage/activation d'un tunnel, domaines |
| TYPES_DE_TUNNELS.md | Les 4 types, parcours visiteur complet, différences |
| ETAPES_ET_PARCOURS.md | Types d'étapes, liens, redirections, deadline, A/B test |
| EDITEUR_DE_PAGES.md | Éditeur glisser-déposer, éléments, SEO, code, popups |
| FORMULAIRES_ET_CONTACTS.md | Formulaires, champs, double opt-in, tags, sondage, contacts |
| PRODUITS_ET_PAIEMENTS.md | Order form, plans tarifaires, produits, coupons, passerelles |
| UPSELLS_ET_DOWNSELLS.md | Upsell, downsell, order bump |
| EMAILS_ET_AUTOMATISATIONS.md | Campagnes, newsletters, règles, workflows, SMS |
| ANALYTICS_ET_CONVERSIONS.md | Statistiques, pixel Meta, CAPI, tracking |
| INTEGRATIONS_ET_API.md | API publique, webhooks, MCP, intégrations |
| PERMISSIONS_ET_SECURITE.md | Sous-comptes, rôles, restrictions de compte, clés |
| RESPONSIVE_ET_ACCESSIBILITE.md | Mobile, accessibilité (très peu documenté) |

MATRICE_PARITE.md n'est volontairement pas créée (réalisée par le demandeur).

## Méthode

1. Lecture uniquement de sources publiques sans connexion : page de fonctionnalités, tarifs, centre d'aide (catégories puis articles détaillés).
2. Chaque fait porte l'URL de l'article d'où il vient. Aucun libellé, limite ou chiffre n'est déduit ou inventé.
3. Les extraits ont été obtenus via un outil de lecture de pages qui résume le contenu ; les captures d'écran des articles n'étaient pas lisibles. Les points visuels sont donc marqués À VÉRIFIER.
3b. Convention de citation : `Hnnn` = https://help.systeme.io/article/nnn-... (slug complet dans PERIMETRE_ET_SOURCES.md) ; les URLs complètes sont données quand c'est plus clair.
4. Légende : **À VÉRIFIER** = non démontré par une source publique lue, ou nécessitant un compte. Moyen de vérification : créer un compte gratuit sur systeme.io (plan Free : 3 tunnels, source https://systeme.io/pricing) et manipuler l'écran concerné.
5. Les résultats d'une recherche web (WebSearch) servent uniquement à trouver des URLs ; seuls les articles ensuite lus directement sont cités comme source de fait.

## Grandes lacunes publiques (résumé)

- Aucun article lu ne décrit les statistiques/tableaux de bord de tunnel (visiteurs, taux de conversion).
- Responsive / accessibilité de l'éditeur : quasi non documenté.
- Double opt-in : seul son principe est évoqué (article dédié non lu).
- Droits précis d'un tunnel partagé : non documentés.

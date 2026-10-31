# SEO technique et données structurées

## Existant (non modifié par 22.6)
Sitemap XML (exclusions motivées, index au-delà de 5 000 adresses), robots.txt (espaces privés, règles du site, `Disallow: /` hors environnement public), canonical absolu sans paramètres de suivi, `noindex` sur recherche interne / pages privées / 404, Open Graph, Twitter Cards, graphe JSON-LD (`Organization`, `WebSite`, `WebPage`, `BreadcrumbList`, `Course`, `Article`, `Product`, `FAQPage`, `LocalBusiness` selon réglages), redirections (boucles refusées, cibles externes https seulement), erreurs 404 journalisées, audit de 41 règles avec exploration réelle. Détail : `KOLAKISA_SEO_AUDIT.md`, `SEO_CORE.md`.

## Contrôle de cohérence ajouté (`technical.js`)
| Constat | Niveau |
|---|---|
| `noindex` avec une canonical : consignes contradictoires | avertissement |
| Page publiée mais non indexable (noindex ou indexation désactivée) | info — **jamais déclarée indexable** |
| Canonical qui n'est ni un chemin du site ni une adresse https (ex. `javascript:`) | erreur |
| `FAQPage` sans question/réponse visible sur la page | erreur : balisage non conforme au contenu |
| `FAQPage` avec questions visibles | info : l'affichage enrichi dans Google est limité à certains types de sites, règles susceptibles d'évoluer |
| `Product` sans bloc produit ni prix visible | avertissement |
| `Article` sur un texte de moins de 150 mots | avertissement |

Ces contrôles apparaissent dans l'analyse d'une page (`technical.issues`) et alimentent le compteur « problèmes techniques » du tableau de bord.

## Principe
Les données structurées doivent correspondre au contenu réellement présent : le contrôleur le vérifie pour FAQ, Product et Article ; Kolakisa n'émet aucun balisage que la page ne justifie pas.

## Limites
- Le contrôle est local ; il ne valide pas auprès de Google (outil externe) et ne prouve pas qu'une page est indexée.
- `hreflang` est émis pour les pages du CMS reliées entre elles (voir `KOLAKISA_MULTILINGUAL_CONTENT_SEO.md`).
- Les types `Organization`/`LocalBusiness`/`WebSite`/`BreadcrumbList` restent gérés par l'existant.

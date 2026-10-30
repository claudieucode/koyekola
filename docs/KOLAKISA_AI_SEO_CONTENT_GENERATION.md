# SEO Content Engine

S'appuie sur le SEO **existant** : le brouillon d'une page porte `seo { title ≤ 70, description ≤ 160, focusKeyword, … }`, lu par le moteur SEO du site. Aucun système parallèle.

## Ce qui est produit (par page)
`title`, `description`, `focusKeyword`, `slug` (proposé, **jamais appliqué** : changer l'adresse d'une page casserait ses liens), `keywordSource` (`provided` | `external` | `suggested`), `internalLinks` (suggestions seulement, jamais insérées), `keywords` (étiquetés).
Application : `seo.title/description/focusKeyword` du brouillon, avec les mêmes protections que les textes (vides ou issus de ce moteur seulement ; `overwriteManual: ["seo.title"]` pour forcer).

## Mots-clés
Trois provenances jamais mélangées : **fournis** par la personne, **suggérés** par l'IA (à confirmer), **externes** (source déclarée par l'appelant). `volume`, `difficulty`, `competition` valent **toujours `null`** avec la note « Aucune donnée … n'est disponible dans Kolakisa ». Aucune intégration de données de recherche n'existe dans le dépôt.

## Contrôles (`seo.js`)
| Contrôle | Gravité | Certain ? |
|---|---|---|
| Titre > 70 / description > 160 (limites du CMS) | critique | oui |
| Titre > 60 (repère courant d'affichage) | à améliorer | non |
| Titre/description absents | important | oui |
| Description < 70 caractères, titre < 15 | suggestion | non |
| Mot-clé absent du titre SEO / du H1 | suggestion | non |
| Bourrage : mot-clé > 3 % des mots (≥ 60 mots) | important | oui |
| Pas de H1 / plusieurs H1 / saut de niveau | important / à améliorer | oui |
| Image sans texte alternatif (section image, image du bandeau) | important | oui |
| Cannibalisation : même mot-clé principal ou titres très proches (Jaccard ≥ 0,7) avec une autre page du site ou un autre ensemble généré | important / à améliorer | oui / non |

La hiérarchie de titres est **déduite** de la convention du rendu (`_sections.ejs` : titre du bandeau = H1, titres de section = H2, titres Markdown à leur niveau) : à revérifier visuellement si le rendu évolue.

## Limites
Pas de recherche de mots-clés réelle, pas de données de classement, pas de maillage interne automatique, pas de données structurées générées. Les seuils sont des repères courants, non des garanties de classement.

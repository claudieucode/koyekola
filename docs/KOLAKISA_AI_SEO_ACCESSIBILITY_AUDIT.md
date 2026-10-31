# Audit SEO et accessibilité (22.1)

**Palier 22.1 · 2026-10-30 · Données : `docs/quality-lab/results.json`.**

**Aucune conformité WCAG ou référentiel équivalent n'est affirmée.** Il s'agit d'un contrôle statique partiel du HTML rendu (pas de lecteur d'écran, pas de navigation clavier réelle, pas de contraste mesuré sur le rendu final).

## Résultats (53 pages publiées)
| Contrôle | Résultat | Gravité si défaut |
|---|---|---|
| `<title>` renseigné | 53 / 53 (« Page · Nom du site ») | — |
| **Meta description renseignée** | **0 / 53** | Majeure (SEO) |
| Un seul `h1` | 53 / 53 | — |
| Ordre des titres sans saut | conforme sur les accueils des sites vérifiés (non systématiquement contrôlé page par page) | — |
| `lang` sur `<html>` | présent | — |
| Canonical | 53 / 53 | — |
| JSON-LD valide | 53 / 53 | — |
| `viewport` | 53 / 53 | — |
| Images sans `alt` | sans objet (0 image) | Majeure dès que des images existent |
| Champs de formulaire sans label | non évalué (les pages de contact ne sont pas publiables d'origine) | Majeure |
| Repères `main`, `nav`, `footer` | partiels : `nav` absent des pages lues (pas de menu) | Moyenne |
| Lien d'évitement | non détecté | Mineure |

## Constats
- **S1 (P1)** Aucune meta description : cause racine Page Generator (Q3).
- **S2 (P2)** Slugs : générés depuis le nom (`accueil-4`, `services-2` pour les homonymes) — pas de slug lisible garanti quand plusieurs sites ont des pages de même nom.
- **S3 (P2)** Liens internes : l'accueil renvoie vers ses pages ; aucune stratégie de maillage automatique évaluée.
- **S4 (P3)** Texte alternatif « (image générée) » (M3).
- **S5 (non évalué)** Contrastes sur le rendu final, taille des cibles tactiles, focus visible, navigation clavier des composants interactifs (FAQ repliable) : à tester avec un navigateur (axe-core / Playwright).

## Points solides
Structure sémantique du titre, canonical et données structurées présentes sans effort de l'utilisateur ; contrastes des palettes vérifiés à la génération (45/45).

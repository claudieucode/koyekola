# KOLAKISA — Prévisualisation et publication

## Prévisualisation
L'étape 7 affiche, dans un cadre, l'**aperçu natif** `/marketing/pages/:id/apercu` de chaque page générée (les brouillons actuels, avec le site et ses réglages) en largeur **ordinateur / tablette (820 px) / mobile (390 px)**. Aucun second moteur de rendu. « Retour à l'édition » ramène aux pages sans rien perdre. Les modifications faites aux étapes précédentes sont visibles car l'aperçu relit les brouillons.
**Vérifications automatiques** affichées : contrôle de préparation natif de chaque page, textes d'exemple restants, images manquantes, boutons sans adresse, descriptions SEO absentes. **Non automatisées** (à juger à l'œil) : cohérence visuelle, liens externes, rendu mobile (le contrôle « Version mobile » est volontairement de niveau « information »).
La proposition de pages (avant application) s'ouvre dans l'aperçu du générateur (`…/generateur/:run/apercu`) : rien n'est enregistré.

## Liste de contrôle de publication (calculée sur l'état réel)
| Contrôle | Bloquant | Source |
|---|---|---|
| Site actif | oui | site non archivé/supprimé |
| Plan validé | oui | statut du plan |
| Pages générées | oui (aucune) / avertissement (partielles) | pages natives existantes |
| Préparation des pages | oui | `landing.preflight` natif (celui de `pages.publish`) |
| Contenus | non | textes d'exemple entre crochets restants |
| Images | non | emplacements vides ; génération en cours = avertissement |
| Boutons et liens | non | boutons sans adresse |
| Description SEO | non | pages sans description |
| Identité visuelle | non | direction artistique appliquée ? |
| Version mobile | non (information) | non vérifiable automatiquement |
| Domaine | non | domaines vérifiés du site |

## Publication
`POST /marketing/ia/studio/:id/publier` (droit `pages.publish`, côté serveur) refuse si un contrôle bloquant est en erreur (HTTP 422, **aucune page publiée**), sinon appelle **`pages.publish` natif** page par page (historique de versions inclus) et rend le résultat **page par page** : une page refusée par le contrôle natif est signalée sans empêcher les autres. Une confirmation nomme les pages avant l'envoi.
**Hors périmètre de ce bouton** : publier le brouillon du personnalisateur (apparence) et le menu du site ; configurer un domaine. L'interface le dit (contrôles « Identité visuelle » et « Domaine »).

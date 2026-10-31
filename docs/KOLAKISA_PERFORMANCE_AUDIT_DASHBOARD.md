# Tableau de bord

Écran `/marketing/site-web/sites/<id>/performance` (droit `forms.read`; réglage : `forms.write`). Aucun lien de menu n'a été ajouté (adresse directe).

- **Vue globale** : nombre de pages, analysées, avec constat élevé, sans constat ; mention explicite « aucune donnée terrain ».
- **Par page** : poids HTML (gzip), JS, CSS, éléments DOM ; détail avec **chaque métrique, son origine (Mesure / Estimation / Indisponible) et son environnement** ; LCP/INP/CLS affichés « indisponible » tant qu'aucune mesure n'existe.
- **Recommandations** : gravité, origine, impact, correction, difficulté, nature (mesure/estimation), « corrigé automatiquement » le cas échéant.
- **Historique et comparaison** : deux rapports d'une même page ; une comparaison automatique avec le rapport précédent suit chaque analyse.
- **Réglage** : « Priorité de l'image principale », journal des 5 derniers changements.

**Aucun score n'est fabriqué ; aucun score Lighthouse n'est affiché.** Seules les pages **publiées** sont analysables (le brouillon n'est pas servi aux visiteurs).

## Limites
Les mesures de laboratoire (LCP/CLS) ne sont pas ingérées dans le tableau de bord (script manuel, résultats dans la documentation) : accepter des métriques envoyées par un navigateur serait une donnée non fiable sans authentification forte. Pas de graphique d'évolution : tableau de l'historique seulement.

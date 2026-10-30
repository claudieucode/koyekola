# Sources de données SEO et fournisseurs externes

## Cinq catégories, jamais mélangées
| Catégorie | Étiquette affichée | Exemple |
|---|---|---|
| Calculé par Kolakisa | « Calculé par Kolakisa » | score éditorial, lisibilité, maillage |
| Fourni par une API externe | « Fourni par une API externe » | requêtes Search Console (si connectée) |
| Saisi manuellement | « Saisi manuellement » | un volume que la personne recopie d'un outil |
| Estimation de l'IA | « Estimation de l'IA » | idée de mot-clé : **jamais de chiffre** |
| Non disponible | « Non disponible » | volume, difficulté, tendances sans source |

## Règles appliquées par le code (`providers.add`)
- Une **estimation de l'IA** ne peut porter aucune métrique (`no_invented_metrics`, 422).
- Une donnée **externe** exige une **source** et une **date** AAAA-MM-JJ (`source_required`, 422).
- Une donnée **manuelle** reçoit la source « Saisie manuelle » et la date du jour.
- Chaque affichage rappelle « Valeurs fournies par … le … ; non vérifiées par Kolakisa ».
- Aucun appel payant n'est déclenché : `paidCallsTriggered: false` pour tous les connecteurs.

## Registre des connecteurs (`providers.describe`, route `…/api/sources`)
| Connecteur | État | Fournit | Portée |
|---|---|---|---|
| Google Search Console | lu depuis `seo/integrations` (« Non connecté » sans configuration) | clics, impressions, position, requêtes **de ce site** | central (une clé de service par installation) |
| PageSpeed Insights | idem | performance d'une page | central |
| Google Analytics 4 | idem | sessions, pages vues | central |
| Recherche de mots-clés (tiers au choix) | **aucun connecteur implémenté** | volume, difficulté, tendances | à définir |

Pour chaque connecteur le registre porte : authentification, coûts, quotas, pays, langues, fréquence de mise à jour, conditions d'utilisation, limites. **Quand une caractéristique n'a pas été vérifiée, le champ le dit** (« À vérifier auprès du fournisseur au moment de l'intégration »). Aucun quota ni tarif n'est affirmé de mémoire.

## Ajouter un fournisseur
Écrire un connecteur qui respecte le même contrat (entrée : site vérifié + requête ; sortie : valeurs + source + date + limites), l'ajouter à `CONNECTORS`, documenter ses conditions réelles, exiger une configuration et une autorisation avant tout appel payant. SEMrush, Ahrefs et équivalents : **non intégrés, non simulés**.

## Données par site
Mots-clés, provenance et métriques sont dans `mk_ci_keywords` (`site_id` obligatoire). Les clés de connexion restent celles de `seo/integrations` (centrales, chiffrées) : un modèle de clés par site n'existe pas et reste à décider (voir `KOLAKISA_SEO_AUDIT.md` §4).

# KOLAKISA — AI Core : consommation, coûts et quotas

## Journal (`mk_ai_core_usage`)
Une ligne par tentative sur un modèle : organisation, site, utilisateur, module, tâche, fournisseur, modèle, statut, code d'erreur, jetons et leur origine, coût et sa nature, coût réservé, durée, tentatives, `counted`. **Jamais le texte** envoyé ni reçu.

## Coûts
- Estimation = jetons × tarif du registre, en micro-dollars entiers. Tarif inconnu → coût `null` / `unknown`. Tarif périmé (> 90 jours) → estimation signalée.
- **Aucun coût « confirmé »** : les API de génération ne renvoient pas la facture. La colonne existe pour une future réconciliation avec la facturation ; la synthèse affiche toujours `confirmedCostMicroUsd` séparément et la mention « Aucun coût confirmé ».
- Un échec dont le coût est inconnu (délai dépassé, coupure) reste compté avec son **coût réservé** (estimation prudente) : il consomme le quota.
- Un échec connu pour n'avoir rien coûté (clé refusée, limite de débit, saturation) a `counted = 0`.

## Quotas (`mk_ai_core_quotas`)
Portées : **global** (toute la plateforme), **organisation**, **site**, **utilisateur**, **module**. Périodes : jour ou mois (UTC). Limites : nombre de requêtes et/ou coût estimé. Toutes les portées s'appliquent en même temps : la plus stricte bloque.
- Contrôle **avant** l'appel, synchrone avec la réservation : au-delà de la limite, le fournisseur **n'est pas appelé** et l'erreur `quota_exceeded` dit quelle portée, quelle période et quelle valeur (« Rien n'a été envoyé au fournisseur »). Aucune consommation payante ne continue en silence.
- Une limite de **coût** exige un tarif **vérifié** : sinon `cost_unverified` (refus plutôt que dépense non contrôlée).
- Le basculement vers un modèle de secours ne contourne pas les quotas.
- Réglage des quotas : administration centrale seulement (`admin.setQuota`). Un administrateur de site les consulte (`forSite.quotas`), ne les modifie pas.

## Lecture
`admin.metrics` (organisation), `admin.platformMetrics` (plateforme), `forSite.usage` (un site, le sien seulement) : requêtes, réussites, échecs, durée moyenne, jetons, coûts estimés/confirmés, requêtes à coût inconnu, quotas atteints, répartition par fournisseur/modèle/module/utilisateur/site, erreurs par fournisseur. `admin.trace(requestId)` relie les tentatives d'une même requête.

## Limites connues
Plafonds de coût fondés sur des estimations de jetons (≈ 3 caractères par jeton) avant l'appel ; les quotas globaux comptent toutes les organisations de la base ; pas d'alerte avant d'atteindre un seuil.

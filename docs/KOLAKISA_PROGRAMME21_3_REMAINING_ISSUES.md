# Programme 21.3 — Limites et restant à faire

## Prérequis non remplis
1. **Programme 21.2 (AI Core) jamais exécuté.** Le palier s'appuie sur `aiCore` + `ai.call` existants (réels, testés) mais : fournisseur unique (Anthropic), modèle codé en dur (`claude-opus-5-5`), pas de registre de modèles ni de routage, pas d'estimation de coût (seulement le nombre de requêtes et les tokens de sortie), plafond par **organisation** (le plafond par site reste à créer).
2. **Programmes 20.3 à 20.7 non exécutés** ; 20.2 non fusionné. Le plan ne peut donc pas encore s'appuyer, par exemple, sur un E-commerce Builder (20.5 ?) : la boutique de produits reste « indisponible » dans le registre.

## Qualité non démontrée
- **Aucun vrai modèle n'a été appelé.** La qualité des analyses (compréhension, pertinence des questions, plans utiles) n'est pas évaluée ; seule la robustesse du traitement l'est. Un essai réel borné est nécessaire (autorisation, budget, clé).
- Les contrôles de preuve (citations) et les règles de contradiction sont volontairement simples ; elles ne détectent ni paraphrases ni contradictions subtiles.
- Détection de langue par indices lexicaux limitée à fr/en/es/pt ; table de pays courte (12) ; aucune vérification des moyens de paiement, livraisons ou obligations locales (toujours « unverified »).

## Fonctionnel absent
- **Aucune interface** (palier 21.8) : seulement l'API JSON.
- **Pas de purge** du texte des briefs ni de rétention définie ; pas branché sur « Effacer les données » (migration 102).
- Pas d'abandon/archivage d'un plan ; pas de comparaison entre deux versions d'un plan (seul l'historique des actions existe) ; l'historique ne garde pas l'état avant/après.
- Une réponse aux questions relance l'analyse (un appel IA) et peut changer les identifiants de questions ; les réponses déjà données restent rattachées.
- Pas de limitation de débit par utilisateur au-delà du plafond quotidien ; pas de verrou « une génération à la fois par site ».
- Le registre ne modélise pas les contraintes fines de compatibilité entre éléments ni les 110 propriétés de style.
- `acknowledge_feature` autorise la validation d'une exigence indisponible : le Page Generator devra la traiter (page/section « à fournir autrement »).

## Dette de tests et dépôt
- Quatre tests existants ont dû être mis à jour (numéro de migration 117, oracle de portée) ; `site-espace` et `site-menu-p1a` échouaient déjà sur `main` à cause de la migration 115.
- **Conflit prévisible** : la branche `feat/lms-universel` utilise aussi le numéro 115 (`115_cours_par_site.sql`) alors que `main` a pris 115 : elle devra être renumérotée avant fusion, et cette migration 116 peut entrer en collision avec elle.
- Tests lents sous charge ; CI GitHub inutilisable.

## Conditions pour le programme 21.4 (Page Generator)
1. Décision humaine sur 21.2 : soit l'exécuter (adaptateurs, modèles, coûts, plafond par site), soit acter que `ai.call` en tient lieu.
2. Un essai réel borné pour évaluer la qualité des plans avec un vrai modèle et ajuster prompts/règles.
3. Fusionner ce palier (après revue) pour que 21.4 consomme `validatedPlan()` / `pagePlans()`.
4. Décider du traitement des fonctionnalités reconnues « indisponibles » et des données réelles manquantes (`requiredData`).
5. Décider de la durée de conservation des briefs.

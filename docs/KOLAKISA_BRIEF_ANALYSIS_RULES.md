# Règles d'analyse des briefs

## R1 — Contrôles avant appel
Vide, sans lettres → `brief_empty`. < 15 caractères ou < 3 mots → `brief_too_short` (avec exemple). > 6 000 caractères → `brief_too_long`. Aucun coût engagé.

## R2 — Statut des faits
- **explicit** : dit dans le brief ; la citation doit y figurer (comparaison sans accents ni ponctuation, ≥ 3 caractères), sinon déclassé en inferred.
- **inferred** : déduit raisonnablement (confiance ≤ 0,8), sans citation.
- **assumed** : hypothèse de travail (confiance ≤ 0,6), listée dans `assumptions`.
- **unknown** : valeur vide, confiance 0, génère au besoin une question.

## R3 — Ne pas transformer chaque mot en fonctionnalité
Le prompt exige les seuls besoins réels ; une fonctionnalité utile mais non demandée est une **recommandation** du planificateur, jamais une exigence. L'IA ne peut pas déclarer `required` ce que le brief ne demande pas.

## R4 — Type de projet
18 catégories fermées + `secondaryTypes` (jusqu'à 4) : un projet peut être à la fois « immobilier » et « vitrine ». Valeur hors liste → « autre » (alerte). Type non identifiable → `insufficient`, aucun plan.

## R5 — Questions
Maximum 5 ; bloquantes d'abord ; jamais sur un sujet déjà connu (nom, type, secteur, public, pays, langue, ton, style, couleurs) ; doublons fusionnés ; `why` toujours présent ; les non bloquantes peuvent être passées ; les réponses sont modifiables et relancent l'analyse.

## R6 — Contradictions
Règles déterministes : vente sans paiement ; blog demandé et refusé ; « une seule page » avec plusieurs rubriques ; épuré ET très chargé. Plus celles relevées par le modèle. Toute contradiction rend la fiche `blocked` jusqu'à correction du brief.

## R7 — Langue
Détectée par indices lexicaux (fr, en, es, pt) et par le modèle. Langues de génération prises en charge : **fr, en**. Autre langue demandée pour le site → alerte `error` + question bloquante ; le brief lui-même peut être écrit dans n'importe quelle langue comprise par le modèle.

## R8 — Pays et usages locaux
Table courte (12 pays) : devise, fuseau, langues. Ville/pays cités → pays déduit. Pays absent de la table → contexte « inconnu », sans valeur par défaut. `payments` et `legal` valent **toujours** `unverified` ; aucune recommandation juridique n'est présentée comme un fait ; le plan ne présume aucun moyen de paiement, livraison ou obligation fiscale.

## R9 — Disponibilité
Toute fonctionnalité citée reçoit son état du registre (available / partial / unavailable). Les non disponibles génèrent une alerte, jamais un composant.

## R10 — Authenticité
Témoignages, chiffres, prix, photographies : `requiredData` = donnée réelle à fournir. Le planificateur n'écrit ni chiffre, ni adresse, ni avis, ni certification.

## R11 — Niveau de préparation
`insufficient` : pas de type de projet, ou ni secteur ni objectif ni fonctionnalité. `blocked` : question/manque bloquant, contradiction ou langue non prise en charge. Sinon `ready`.

## R12 — Injection
Le brief est une donnée entre balises ; le modèle n'a aucun outil ; la sortie est contrainte par schéma puis revalidée ; aucune instruction contenue dans le brief ne peut publier, supprimer ou lire d'autres données.

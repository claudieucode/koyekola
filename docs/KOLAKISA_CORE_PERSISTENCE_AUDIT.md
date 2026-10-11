# Audit de la persistance

## Chemin
Client `payload()` → `PUT /brouillon {content, revision}` → `saveDraft` : `normalizeContent` (renormalise tout) → droits des widgets réservés → contrôle du format verrouillé → `UPDATE … WHERE revision = ?` (0 ligne modifiée → 409 « conflit ») → point d'historique commun.

## Résilience constatée
- Conflit (409) : l'éditeur se bloque, garde une copie locale (`backup`), prévient.
- Erreur réseau : nouvel essai espacé (5 s × n, jusqu'à 25 s).
- Refus de validation (422) : message, élément fautif mis en évidence (`itemFromError`).
- Fermeture de l'onglet avec modifications : confirmation + copie locale.
- Avertissements non bloquants (`warnings`) : renvoyés au client qui nettoie son document (`healIgnored`) ; type ajouté : `interaction_target` (D2).

## Aller-retour
Test `noyau-integrite` : enregistrer, relire le brouillon, le réenregistrer → document identique (identifiants, ordre, réglages, notes). Ouvrir l'éditeur ne modifie pas le brouillon (test navigateur).

## Migrations
Aucune migration de base ni de schéma dans cette mission : tous les ajouts sont des vérifications ; aucune donnée existante n'est réécrite. Retour arrière : revenir au commit précédent suffit.

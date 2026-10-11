# IA Kolakisa — audit de l'existant (LOT 0)

Date : 2026-10-10. Audit du code réel avant toute implémentation.

## 1. Ce qui existe et qui est réutilisé

| Besoin | Existant réel | Décision |
|---|---|---|
| Appel au modèle | `src/services/aiCore.js` : SDK Anthropic, sortie JSON contrainte par schéma, traduction des erreurs, client factice pour les tests (`setClientForTests`) | Réutilisé tel quel (couche fournisseur interchangeable : un seul point d'appel `runJson`) |
| Plafond, journal, clé | `src/marketing/ai/index.js` : `getAiSettings` (clé lue côté serveur, jamais envoyée au navigateur), plafond par organisation sur 24 h (`mk_ai_requests`), journal **sans texte** | Réutilisé : `call` exporté, option `system` ajoutée |
| Permissions | `need("forms.read" / "forms.write")` du marketing ; `ctx.can` pour les widgets réservés | Mêmes permissions que l'enregistrement du brouillon |
| Document de page | Sections `layout` + arbre d'éléments (`nodes.js`, 100+ propriétés de style par écran `desktop/tablet/mobile`, états `hover/focus/active`) ; validation unique `pages.normalizeContent` | L'IA n'écrit jamais de HTML : elle propose des opérations sur ce document, validé par le même moteur |
| Historique | `change(fn, {label})` : instantanés JSON, 150 étapes, Ctrl+Z | Une proposition appliquée = UNE étape |
| Enregistrement | Brouillon automatique (1 s) avec contrôle de révision (409) | Aperçu = application provisoire avec enregistrement suspendu |
| Écrans | Un seul cadre (iframe) dont la largeur change (820 / 390 px) : les requêtes média réagissent | Mesures réelles du rendu à chaque écran |
| Interface | `<dialog>`, jetons `--editor-*`, mouvement `kol-motion`, icônes en `<template>` | Même langage visuel ; nouvelles icônes dans `icons.js` |

## 2. Ce qui n'existait pas

- Aucune IA dans l'éditeur de pages (seule l'IA de rédaction d'e-mails/SMS existait).
- Aucun moteur d'opérations sur le document ; aucune mesure responsive ; aucune annotation.
- Aucune envoi d'image au modèle : `runJson` n'accepte que du texte.

## 3. Risques identifiés et réponses

| Risque | Réponse |
|---|---|
| Le modèle invente des identifiants ou des types | Les identifiants des nouveaux éléments sont créés par le serveur ; types, propriétés et valeurs revalidés champ par champ |
| Le modèle sort du périmètre demandé | Périmètre « sélection » = sous-arbre ; toute opération hors périmètre est refusée |
| Suppression silencieuse (même d'un enfant) | Comparaison des identifiants avant/après : toute disparition exige une case de confirmation |
| Une correction mobile abîme l'ordinateur | Les opérations responsive ne ciblent qu'un écran ; contrôle interne comparant l'écran ordinateur avant/après (refus si différent) |
| Page modifiée pendant l'attente | Révision envoyée (409 côté serveur) et empreinte du document côté éditeur (refus d'application) |
| Deux demandes simultanées | Verrou par page (429 « occupé ») |
| Clé / coût | Clé uniquement serveur ; plafond quotidien ; journal sans texte ; erreur explicite sans clé |
| Annotations publiées par erreur | Elles vivent dans un `<canvas>` temporaire hors du document ; jamais dans `content` |

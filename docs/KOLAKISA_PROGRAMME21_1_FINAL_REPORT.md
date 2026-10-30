# Programme 21.1 — Rapport final

**Statut : VALIDÉ AVEC RÉSERVES** (phase de conception ; aucune fonctionnalité livrée, aucun code applicatif modifié).

## État réel
- **Site Builder** : sections (16 types fermés), éléments (94 types, 110 propriétés de style), jetons, gabarits, 22 blocs, 5 packs de site, 5 thèmes, modèles de thème, éditeur avec brouillon à révision atomique. Solide et réutilisable.
- **IA existante** : AI Studio (modifie une page par opérations validées), rédaction e-mail/SMS, plafond et journal, module `ai` par site, connecteurs. **Pas de flux brief → site.**
- **Programme 20** : 20.1 non vérifiable (aucun document) ; 20.2 poussé sur sa branche, non fusionné ; **20.3 à 20.7 non exécutés** (aucune trace). Ils ne sont pas considérés validés.

## Composants réutilisables
`aiCore.runJson`, `ai.call`, `studio.js` (modèle de la boucle proposer → valider → différences → accepter), `sections/nodes/tokens`, `sitePacks` + `templates`, `saveDraft`, `transaction`, `siteModules`, `ctx.siteScope`, connecteurs chiffrés.

## Limites techniques
Modèle Anthropic codé en dur ; adaptateurs OpenAI/Google sans sortie structurée ; plafond par organisation seulement ; aucune banque ni génération d'images ; protection du travail manuel limitée aux éléments verrouillés ; CI GitHub inopérante ; ~10 tests déjà en échec sur `main`.

## Livrables
Audit, étude de référence, architecture, contrats de données, analyse des fournisseurs, sécurité et confidentialité, feuille de route 21.1–21.11, ce rapport.

## Réserves (pourquoi pas « VALIDÉ »)
1. **Étude de référence incomplète** : Wix et Elementor ont reçu une recherche web (pages non lues en entier) ; WordPress, Framer, Durable, 10Web et Webflow **ne sont pas étudiés** (marqués « à vérifier » plutôt que remplis de mémoire).
2. **Coûts, quotas, latences, rétention des données non relevés**.
3. Aucun essai réel de fournisseur (non autorisé).
4. Architecture non éprouvée par prototype.
5. Suite de tests non exécutée (rien n'a changé dans le code).

## Risques et dépendances
Voir feuille de route (coût, sorties hors schéma, faits inventés, écrasement du travail, dépendance fournisseur). Dépendances : décision sur 20.2/20.7, tests de base réparés, autorisation d'un essai borné, décision commerciale sur la clé et les quotas.

## Préconditions du 21.2
Les six listées dans `KOLAKISA_PROGRAMME21_ROADMAP.md`.

## Git
Branche `docs/programme-21-1-ai-website-builder` issue de `origin/main` (`bd794900`). Commit : `docs(kolakisa): define AI website builder architecture`. Rien fusionné, rien déployé, aucun push forcé. Le palier 21.2 n'est pas commencé.

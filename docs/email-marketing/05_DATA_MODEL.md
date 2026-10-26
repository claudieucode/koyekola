# 05 — Modèle de données

Le schéma complet est décrit dans `EMAIL_MARKETING_DATABASE.md` (racine du dépôt) et dans les migrations `src/marketing/migrations/001…111`. Principes inchangés : toutes les tables sont préfixées `mk_`, chaque ligne porte `organization_id`, le journal d'audit est en écriture seule (déclencheurs `BEFORE UPDATE/DELETE`), les preuves de consentement ne se modifient pas.

## Changement de cette mission

`111_message_reserve.sql` : `ALTER TABLE mk_messages ADD COLUMN claimed_at TEXT;`

- Rôle : réserver un message d'e-mail de scénario juste avant l'appel au fournisseur (voir `02_FUNCTIONAL_SPECIFICATIONS.md`, F7).
- Pourquoi une colonne et non un nouvel état : la contrainte `CHECK (status IN (…))` de `mk_messages` ne contient pas « sending » ; la modifier exige de reconstruire la table (risque et durée inutiles).
- Additive, nulle par défaut, aucune ligne touchée. Annulation : `ALTER TABLE mk_messages DROP COLUMN claimed_at`.

## Contraintes qui expliquent les limites actuelles

- `mk_automation_runs UNIQUE (automation_id, contact_id)` : un contact n'entre qu'une fois dans un scénario (voir la conception de la ré-entrée dans `08_GAP_ANALYSIS.md`).
- `mk_messages UNIQUE (campaign_id, contact_id)` : base de l'idempotence d'envoi.
- `mk_api_keys UNIQUE (organization_id, name)` : une clé révoquée garde son nom ; c'est ce qui causait l'erreur 500 de la connexion mobile (corrigé en renommant les anciennes clés).

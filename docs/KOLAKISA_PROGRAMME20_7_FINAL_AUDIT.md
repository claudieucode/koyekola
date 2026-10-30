# Programme 20.7 — audit final (Site Builder & Template Studio)

Date : 2026-10-30 · Base : `origin/main` (04c1070a puis 904709af) · **Verdict : BLOQUÉ pour déclarer le programme 20 « validé »** (voir §3). La plateforme existante n'est pas en cause : aucun défaut P0/P1 nouveau n'a été trouvé ; ce sont des fonctions annoncées qui n'existent pas et une preuve de test incomplète.

## 1. Constat sur les « programmes 20.1 à 20.6 »
Aucun document ni commit ne porte ces numéros. Le code réel correspondant (vérifié par lecture et par test) :

| Annoncé | Réalité dans le code | État |
|---|---|---|
| 20.1/20.2 Site Builder, gestion des sites | `mk_sites`, `/site-web/sites` : création, modification, duplication, archivage, restauration, suppression, domaines (113), droits par site | **Disponible** — testé |
| 20.3 Theme Builder | `pages/themeTemplates.js` : 8 familles, conditions, priorité, repli explicite, « pourquoi ce modèle ? » | **Partiel** : réglage de **l'organisation** (`mk_settings` clé `theme.templates`), pas de chaque site ; écran réservé à l'équipe |
| 20.4 Template Library | `services/templateLibrary.js`, `cms_template_imports` (098) : packs, gabarits, « Mes modèles » par site, aperçu, import idempotent et atomique | **Disponible** — testé (`apparence-templates`) |
| 20.5 E-commerce Builder | Produits = **formations numériques** ; commandes sans `site_id` ; parcours d'achat volontairement fermé aux domaines de site ; **ni variantes, ni stock, ni livraison, ni fiscalité** | **Non disponible** comme annoncé |
| 20.6 Création guidée | `src/siteWizard` (assistant par catégorie, `/sites/:id/assistant`) puis Créateur IA (21.8) | **Disponible** (correction : une première version de cet audit affirmait à tort qu'aucun assistant n'existait) |

## 2. Preuves exécutées
- Nouveau test d'intégration `tests/programme20-7-integration.test.js` : **6/6** (deux sites indépendants, archivage/restauration, slug unique, personne limitée à un site refusée pour créer/supprimer/archiver/toucher aux modèles de thème, repli du Theme Builder brouillon/publié, prix du panier calculé par le serveur, panier et commande exigent une connexion). Poussé (04c1070a).
- Tests d'isolation et de migration pertinents rejoués en 21.8 : 369/369 (isolation, portées de routes, migrations, assistant de création, apparence/templates, AI Core/Media, paliers 17-18).
- Suite complète : **non terminée pour ce palier** (voir TEST_RESULTS). Dernière suite complète terminée : palier 18 (6 660 tests, 6 625 réussis, 25 échecs dont 10 préexistants documentés).

## 3. Critères de validation (§16)
| # | Critère | Résultat |
|---|---|---|
| 1-2 | Site Builder / gestion des sites | **Validé** (tests) |
| 3 | Éditeur visuel et persistance | Couvert par ~175 fichiers navigateur existants ; **non rejoués ici** (voir TEST_RESULTS) |
| 4 | Theme Builder applique ses modèles | **Réserves** : fonctionne, mais non propre à chaque site |
| 5 | Template Library | **Validé** (tests existants) |
| 6 | E-commerce Builder | **Non disponible** |
| 7 | Assistant guidé | **Validé** (assistant de création + Créateur IA) |
| 8-9 | Isolation et permissions serveur | **Validé** (palier 17/18 + test 20.7) |
| 10 | Parcours de bout en bout | Partiel |
| 11 | P0/P1 corrigés | Aucun trouvé |
| 12 | Documentation cohérente | Corrigée ici |
→ Les critères 3, 4, 6 et 10 ne sont pas satisfaits : **le programme 20 ne peut pas être déclaré validé**.

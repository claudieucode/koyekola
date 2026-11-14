# Commerce et LMS dans le moteur d'extensions

**Principe : aucune ligne de logique métier n'a été déplacée ni dupliquée.** La boutique et le LMS existants sont *déclarés* par manifeste, puis rendus activables site par site par le moteur.

## Kolakisa Commerce (`commerce`, identifiant stable)
- Manifeste : `src/extensions/manifests/commerce.js` — 18 migrations (121 → 152), 4 permissions `shop.*`, menus (Produits, Commandes, Clients, Réglages), routes d'administration `/boutique`, `/site-web/boutique`, `/revenus`, pages publiques `/boutique`.
- Inchangé : produits, catégories, avis, commandes, clients, abonnements, rendez-vous, listes cadeaux, rapports, factures, accès membre, taxes et expédition, paiements, réglages (58 tables `mk_shop_*`, services `src/marketing/shop/*`, routes `shop*.js`, API `api/shop.js`, webhooks, passerelles).
- **Ce qui change** : (1) les écrans d'administration d'un site (`/site-web/sites/N/boutique/…`) sont maintenant refusés quand Commerce n'est pas activé pour N (avant : seulement la boutique publique, l'API et les webhooks l'étaient) ; (2) le groupe de menu « Boutique » vient du manifeste et disparaît du menu d'un site où Commerce est désactivé.
- Désactivé : menus retirés, écrans d'administration 403, boutique publique/API/webhooks/widgets/plan du site fermés (garde existante), **données et réglages conservés**. Réactivé : tout est retrouvé (test : produit créé, désactivation, réactivation, produit présent).

## Kolakisa LMS (`lms`, identifiant stable)
- Manifeste : `src/extensions/manifests/lms.js` — migrations `core` (schéma historique de `config/database.js`) et `119_cours_par_site.sql`, permission `lms.manage` (nouvelle, rôle minimum administrateur), menu « Formation → Mes formations » (ouvre `/formateur`).
- Inchangé : cours, chapitres, leçons, enseignants, étudiants, inscriptions, progression, quiz, évaluations, certificats, paiements, accès, tableaux de bord, gestion pédagogique ; tables sans préfixe ; rattachement par `mk_course_sites`.
- **Ce qui change** : (1) les pages publiques et `/formateur` d'un **domaine de site** répondent 404 si LMS n'y est pas activé (garde `runtime.publicGuard`, placée après le routage des pages du site, pour ne jamais masquer une page libre du site) ; (2) le menu « Formation » n'apparaît dans l'espace d'un site que si LMS y est activé et que la personne a `lms.manage`.
- Désactivé : aucune donnée supprimée (cours, inscriptions, progression, certificats intacts) ; réactivé : retrouvés (test `lms-par-site` : désactivation sans perte, inchangé et passant).

## Les quatre autres modules historiques
`sms`, `ai`, `social`, `scoring` sont déclarés de la même façon (leurs gardes existantes sont reprises telles quelles). Leur interface d'activation reste compatible.

## Retour arrière
1. Revenir au commit précédent (`git revert` de la fusion) : `siteModules.js` retrouve sa liste codée ; `mk_site_modules` n'a pas changé de forme ; les tables 153 restent, inutilisées.
2. Hors production, après sauvegarde : supprimer les déclencheurs `trg_mk_ext_*` puis `DROP TABLE mk_extension_settings, mk_extension_events`.
3. Aucune donnée de boutique ni de formation n'est lue ou écrite par la migration 153.

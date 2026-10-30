# KOLAKISA — Palier 18 : audit global (rapport)

Date : 2026-10-29 · Base auditée : `origin/main` au commit `e98b0cfa` (SEO lot 2), dans un worktree propre détaché · Documents liés : [matrice de tests](KOLAKISA_PALIER18_TEST_MATRIX.md), [défauts restants](KOLAKISA_PALIER18_REMAINING_ISSUES.md), [préparation à la production](KOLAKISA_PALIER18_PRODUCTION_READINESS.md), [implémentation](KOLAKISA_PALIER18_IMPLEMENTATION.md).

## 1. Périmètre audité
Moteur CMS multi-sites (sites, domaines, modules, rôles), éditeur de pages et d'articles, widgets, médias, SEO, Marketing (e-mails, formulaires, SMS, automatisations), LMS / « Mon espace », isolation entre sites, migrations, sauvegarde/restauration, dépendances, responsive (120 écrans × 3 largeurs), performance statique.

Hors périmètre ou non vérifiable ici : production réelle (Hostinger : aucun accès), services externes réellement branchés (Stripe, SMTP, Search Console/GA4, réseaux sociaux, fournisseurs SMS), DNS/HTTPS réels des domaines des sites.

## 2. État initial du dépôt
- Branche `main`, `origin/main` = `e98b0cfa`. Travail d'audit mené dans un worktree détaché sur ce commit (aucune modification du dépôt principal).
- Fichiers non suivis d'une autre session dans le dépôt principal (`docs/kolakisa-funnel-studio/`, `src/routes/tunnelOffers.js`, `tests/tunnel-paiement.test.js`, `views/tunnel-offer.ejs`) : non touchés.
- Node 24 ; Express + EJS + `node:sqlite` ; 652 fichiers de tests (`tests/*.test.js`), dont 175 pilotent un vrai Chrome (`*-navigateur.test.js`) ; 99 fichiers dans `src/marketing/migrations` (numérotation jusqu'à 114 avant ce palier, 115 après).
- Scripts : `npm test` (séquentiel), `sauvegarde`, `restaurer`, `build:editor`, `audit:medias` ; scripts d'audit du dépôt (`scripts/audit-*.js`). Il n'y a ni linter ni vérificateur de types ni étape de compilation de production dans `package.json` (voir limites).

## 3. Commandes exécutées et résultats
| Commande | Résultat |
|---|---|
| `node --check` sur 789 fichiers JS (src, public/js, scripts, server.js) | 0 erreur de syntaxe |
| Recherche de secrets dans les fichiers suivis (clés `sk_live`, `AKIA…`, clés privées, jetons Slack) | Aucun secret réel : motifs présents uniquement dans `.env.example`, la documentation et des tests de masquage |
| `npm audit --omit=dev` (avant) | 6 vulnérabilités (2 hautes : `body-parser`, `multer` ; 3 modérées : `nodemailer`, `qs`, `sanitize-html` ; 1 basse : `deepmerge`) |
| `npm audit fix --omit=dev` (isolé) puis `npm audit --omit=dev` | **0 vulnérabilité** ; seules des versions correctives dans les plages existantes changent (body-parser 1.20.9, multer 2.5.0, nodemailer 10.3.1, qs 6.16.2, sanitize-html 2.18.1, launder 1.7.2 ; `deepmerge` retiré) |
| Suite complète `node --test`, 4 tranches parallèles de 163 fichiers | **6 660 tests : 6 625 réussis, 25 échoués, 10 ignorés, 0 annulé** (avant corrections) |
| Ré-exécution des 22 fichiers touchés par les corrections (avec les dépendances corrigées), après toutes les corrections | **242 tests : 242 réussis, 0 échec, 0 ignoré** |
| 157 fichiers touchant envois / téléversements / assainissement, avec les dépendances corrigées | 2 207 tests : 2 200 réussis, 6 échoués (5 défauts préexistants connus + 1 test instable, corrigé ensuite), 1 ignoré |
| `scripts/audit-widgets.js` (vrai Chrome) | 94 types au registre · 94 enregistrés · 94 canevas OK · 86 publiés et rendus · 7 dans leur contexte · 1 à vérifier (« menu » : aucun rendu sans menu configuré) |
| `scripts/audit-responsive.js` (390 / 768 / 1280 px) | 120 écrans, 360 mesures : 0 débordement horizontal de page, 1 élément hors cadre, 46 petites cibles tactiles, 0 champ < 16 px |

## 4. Défauts découverts et traitement
Détail dans `KOLAKISA_PALIER18_IMPLEMENTATION.md` (corrigés) et `KOLAKISA_PALIER18_REMAINING_ISSUES.md` (non corrigés).

- **P2 corrigés** : 2 dépendances à vulnérabilité haute (+ 4 autres) ; outil de migration R9 pouvant annuler à tort une migration à cause d'une écriture concurrente ; deux clés étrangères sans index (explorateur de médias).
- **P3 corrigés** : liste déroulante du tableau de bord sans flèche ; `z-index` hors échelle sur la visionneuse d'images ; test d'infobulles et registres du menu en retard sur 4 écrans SEO ; écran « Informations » affichant « Site (identifiant N) » au lieu du nom pour un site créé à l'instant ; plusieurs tests figés périmés (voir implémentation).
- **P0 / P1** : aucun défaut identifié.

## 5. Sécurité et isolation (preuves)
Nouveau test `tests/palier18-isolation.test.js` (7 cas, accès directs sans passer par l'interface) :
- anonyme : aucune route d'administration servie (redirection ou refus) ;
- personne limitée au site A : le contenu du site B n'apparaît ni en lecture (éditeur, aperçu, export, médias, équipe) ni avec `?site=A`, `?site=B` ou sans paramètre ; contrôle positif : sa propre page s'ouvre ;
- identifiants de site falsifiés (`principal`, vide, `999999`, `0`, `-1`, `1 OR 1=1`, `../../etc`, `%00`) : jamais de 500, aucune fuite ;
- écritures directes (supprimer, dupliquer, publier, modifier) sur une page du site B depuis un compte limité au site A, avec champ de formulaire `site` falsifié : refusées, page B strictement inchangée ;
- page publique : brouillon d'un autre site non servi, 404 sans trace d'erreur.
Complété par les suites existantes d'isolation (`admin-multisite`, `portee-des-routes` : plusieurs milliers de combinaisons adresse × méthode × variante, `siteContext`, patterns, menus, médias…) qui passent.

## 6. Limites de l'audit
- Aucun accès à la production ni à Hostinger : le déploiement et le retour arrière n'ont pas été éprouvés. Le workflow GitHub « Tests » ne démarre pas (blocage de facturation du compte), donc aucune intégration continue n'a validé ces commits.
- Pas de linter, pas de typage, pas de compilation de production dans le projet : ces contrôles sont `NOT_IMPLEMENTED`, pas « réussis ».
- Parcours de bout en bout dans un navigateur : couverts par les tests `*-navigateur` de la suite (175 fichiers, passent) et par les audits widgets/responsive ; pas de campagne manuelle sur appareils réels, pas de test de perte réseau côté éditeur dans cette passe, pas de test de charge.
- Accessibilité : vérifications partielles via les tests existants (focus, libellés, contrastes en tests statiques) ; aucune conformité WCAG complète n'est revendiquée. Les 46 petites cibles tactiles relevées restent à traiter.
- Intégrations externes (paiement, SMTP réel, Google, réseaux sociaux, SMS) : interface et logique testées avec des doublures locales ; connexion réelle non vérifiée.

## 7. Bilan
Voir `KOLAKISA_PALIER18_PRODUCTION_READINESS.md`. État final proposé : **VALIDÉ AVEC RÉSERVES** — aucun P0/P1, isolation et sécurité démontrées par des tests directs, mais 10 échecs de tests préexistants non corrigés, aucune intégration continue active, déploiement non vérifié.

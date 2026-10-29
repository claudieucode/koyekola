# Kolakisa SEO — architecture (état réel et cible)

## Principe
Un seul moteur partagé par tous les sites, des données isolées par site. Aucun second moteur de domaines : le site est celui de l'adresse servie (`req.kwSite`, `req.seoSpace`), jamais une valeur envoyée par le navigateur.

## Composants existants (à étendre, pas à dupliquer)
| Couche | Fichiers |
|---|---|
| Calcul du `<head>` (titre, description, canonical, robots, OG, Twitter, JSON-LD) | `src/seo/resolver.js`, `meta.js`, `templates.js`, `schema.js` |
| Réglages central / par site / par contenu | `settings.js` (`FIELDS`, `SITE_KEYS`), `meta.js` |
| Sitemap, robots | `sitemap.js`, `robots.js` |
| Redirections, 404 | `redirects.js` (middleware serveur avant toute page), `notfound.js` |
| Audit en arrière-plan (états : en attente, en cours, terminé, échec) | `audit.js`, `jobs.js`, `rules.js`, `reports.js` |
| Éditeur : analyse non bloquante | `guard.js`, `text.js`, `public/js/cms-seo-site.js` |
| Intégrations | `integrations.js` (clé chiffrée AES-256-GCM, « Non connecté » sans configuration) |
| Administration par site | `src/marketing/web/siteSeo.js`, `views/marketing/site-seo/*`, permissions `seo.view` / `seo.edit` / `redirects.*` |
| Historique | `store.js` (`seo_changes`) |

## Priorité des valeurs (rendu public)
Valeur explicite de la page > réglage du type de contenu > modèle du site > réglage central > valeur générée. Les brouillons et pages privées ne produisent jamais de métadonnées publiques (`noindex, nofollow`).

## Extensions de cette mission
- Redirections : statuts 307, 308, 410 (410 sans destination, `X-Robots-Tag: noindex`, hors graphe de chaînes). Aucune migration : la colonne `status` existait.
- SEO local : six réglages d'organisation (téléphone, e-mail, rue, code postal, ville, pays) dans la liste blanche par site ; publiés dans le JSON-LD seulement s'ils sont valides ; type `LocalBusiness` proposé. Aucune migration (table clé/valeur).

## Cible (non implémentée)
Règles de redirection par préfixe, sélecteur de schéma par page, export/import JSON des réglages par site, suggestions de liens internes, édition en masse des textes alternatifs, interface fournisseur IA, suivi de positions via un fournisseur autorisé. Voir `KOLAKISA_SEO_GAP_ANALYSIS.md` pour l'ordre.

## Sécurité (déjà en place)
Site dérivé de l'adresse vérifiée ; sources protégées (`/formateur`, `/connexion`, `/api`, `/uploads`…) jamais redirigeables ; destinations externes en https seulement et permission `redirects.external` ; validation des entrées ; boucles refusées ; clés d'intégration chiffrées.

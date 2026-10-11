# Preuves et méthode de vérification (palier 23)

Toutes les sondes démarrent un **serveur de test jetable** (`tests/helpers.js` : base temporaire, dossier d'envois temporaire), créent leurs propres données par les vraies routes, puis s'arrêtent. Rien n'est écrit dans la production ni dans le code. Pour les rejouer : `node audit-parite/sonde-<nom>.js` (les sondes Chrome demandent `NODE_PATH` vers `playwright-core`). Les sorties brutes sont dans `audit-parite/resultats/`.

| Sonde | Ce qu'elle prouve | Sortie |
|---|---|---|
| `sonde-permissions.js` | 360 routes d'administration × 6 profils : anonyme, élève non membre, lecteur, contributeur, auteur, éditeur. Résultat : anonyme 360/360 → redirection vers la connexion ; élève non membre 360/360 → 403 ; écritures acceptées pour un lecteur : seulement `POST /apparence` (préférence personnelle de menu), `POST /pages/:id/rendu` et `POST /modeles/apercu` (aperçus sans enregistrement), `POST /site-web/parametres/reinitialiser` (le moteur refuse : vérifié) | `resultats/matrice.json` |
| `sonde-scenarios.js` | SEO d'un article publié (titre, description, canonical, Open Graph, JSON-LD, sitemap), archives, changement d'adresse 301, dépublication, duplication, corbeille, menus, nom du site, XSS (4 vecteurs), CSRF, en-têtes, performance avec 1 000 articles | `resultats/sortie-scenarios.txt`, `scenarios.json` |
| `sonde-publique.js` | Réponses publiques : statuts, titre, canonical, robots, cache, absence de flux RSS, 404 | `resultats/sortie-publique.txt` |
| `sonde-complements.js` | Droits d'édition des articles pour 5 rôles, programmation, présence de `site_id` dans 6 tables | `resultats/sortie-complements.txt` |
| `sonde-export.js` | Export JSON puis import (modes « ignorer » et « dupliquer »), JSON cassé | `resultats/sortie-export.txt` |
| `sonde-navigateur.js` | Chrome réel : 24 écrans × 2 largeurs, erreurs de console, requêtes échouées, débordement, champs sans nom, petites cibles, poids, temps | `resultats/navigateur.json` |
| `sonde-contraste.js` / `sonde-contraste-admin.js` | Contraste WCAG mesuré : sélecteur de médias dans l'éditeur (clair/sombre), 8 écrans × 4 thèmes de menu | `resultats/sortie-contraste*.txt`, `mediatheque-*.png` |
| `sonde-decoratif.js` | 45 écrans : liens `href="#"`, commandes désactivées, mentions « bientôt » | `resultats/sortie-decoratif.txt` |

**Suites automatisées relancées** (`resultats/cmsrun.txt`) : 40 fichiers `cms-*`, `seo-*`, `audit-corrections` : 833 tests, 833 réussis. **Tests Chrome** fichier par fichier (`resultats/pwscan.txt`) : 68 fichiers.

**Corrections apportées à mes propres sondes pendant l'audit** (par honnêteté) : la sonde d'import ne passait pas le champ `types` obligatoire (refus de ma part, pas du produit) ; la sonde d'enregistrement de brouillon envoyait un contenu invalide (422) ; le premier téléchargement d'export arrivait avant la fin du traitement asynchrone (410). Ces trois points sont des erreurs de sonde, pas des défauts du produit.

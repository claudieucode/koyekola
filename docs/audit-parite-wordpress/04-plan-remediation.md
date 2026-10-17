# Plan de remédiation priorisé (palier 23)

**Ce plan n'est pas exécuté.** Il attend ta décision. Les corrections sont rangées dans l'ordre demandé (sécurité et données d'abord). Chaque ligne renvoie au registre des anomalies (`02-registre-anomalies.md`) et à la matrice.

Aucune anomalie P0 n'a été trouvée : il n'y a donc **pas d'urgence de sécurité ni de perte de données prouvée**. Le seul P1 est fonctionnel (rédaction des articles).

## Décisions humaines nécessaires avant de coder

| # | Question | Pourquoi ça change le plan |
|---|---|---|
| D1 | Le multi-site doit-il couvrir le blog, les catégories, les commentaires et les médias ? | Décide AN-02 (le plus gros chantier, il touche des tables). |
| D2 | Les rôles Auteur / Contributeur / Éditeur doivent-ils pouvoir écrire dans l'éditeur d'articles ? | Décide AN-01. |
| D3 | Un « Lecteur » doit-il voir les contacts et les revenus ? | Décide AN-16. |
| D4 | Une page du site doit-elle être indexée par défaut ? | Décide AN-05. |
| D5 | La migration depuis WordPress et une API de contenu sont-elles des objectifs ? | Décide AN-10 et AN-15 (sinon on n'y touche pas). |
| D6 | Les doublons de l'inventaire AN-14 : lesquels fusionner ? | Évite de reconstruire un système qui sera supprimé. |

## 1. Sécurité et intégrité des données

| Problème | Objectif | Résultat attendu | Composants | Dépendances | Risques | Tests nécessaires | Priorité | Palier conseillé |
|---|---|---|---|---|---|---|---|---|
| AN-08 sauvegardes sur le même disque | Copie externe planifiée de la base et des fichiers | Une perte du disque ne perd plus le site | `services/backups.js`, hébergement | Choix d'un stockage externe (décision hors code) | Faible | Restauration complète sur un site de test | P2 | Palier « exploitation » |
| AN-09 connexions non journalisées, pas de 2FA | Journal des connexions, puis 2FA administrateurs | Piste d'audit ; comptes d'équipe protégés | `auth`, `mk_audit_logs`, `cmsAccess` | — | Verrouillage de comptes | Échecs/réussites journalisés ; 2FA obligatoire pour les admins | P2 | Palier sécurité |
| AN-18 CSRF sans jeton | Jeton sur les formulaires d'administration, refuser les POST connectés sans `Origin` | Fermer la faille résiduelle | `middlewares/security.js`, gabarits | Tous les formulaires à jour | Casser des formulaires | Chaque formulaire d'écriture testé avec/sans jeton | P3 | Palier sécurité |
| AN-19/20 CSP partielle, 1 dépendance haute | CSP avec `script-src` ; `npm audit fix` | Moins de surface d'attaque | `security.js`, `package.json` | Scripts en ligne éventuels | CSP trop stricte | Suite complète + parcours Chrome | P3 | Palier sécurité |
| AN-16 lecture sensible par le Lecteur | Droits de lecture plus fins (contacts, revenus) | Moindre privilège | `organizations.js` (permissions) | Décision D3 | Retirer un accès attendu | Matrice de permissions relancée (`sonde-permissions.js`) | P2 | Palier droits |
| AN-12 effacement RGPD d'un invité | Effacer par adresse e-mail | Demande traitée en un geste | `services/comments.js` | Contact Core | Effacer trop | Effacement + trace d'audit | P2 | Palier commentaires |

## 2. Fonctionnalités essentielles cassées ou inutilisables

| Problème | Objectif | Résultat attendu | Composants | Dépendances | Risques | Tests | Priorité | Palier |
|---|---|---|---|---|---|---|---|---|
| **AN-01 rédaction réservée au créateur** | Ouvrir l'éditeur d'articles aux rôles qui ont `articles.write` / `articles.edit_own` | Plusieurs rédacteurs ; un Auteur ne touche que ses articles et ne publie pas | `routes/blog.js` (gardes), `cmsAccess`, `posts.author_id` | Décision D2 | Un auteur voit les articles d'un autre | 5 rôles × (créer, ouvrir, modifier, publier) ; IDOR entre deux auteurs | **P1** | **Palier « articles multi-auteurs »** |

## 3. Persistance et perte de travail

| Problème | Objectif | Résultat attendu | Composants | Dépendances | Risques | Tests | Priorité | Palier |
|---|---|---|---|---|---|---|---|---|
| AN-07 pas de copie locale du Page Builder | Copie locale + proposition de restauration | Plus de travail perdu après une coupure | `public/js/marketing-editor.js` | — | Restaurer une copie périmée (utiliser la révision) | Couper le réseau, recharger, restaurer ; conflit avec une révision plus récente | P2 | Palier éditeur |

## 4. Intégration entre moteurs

| Problème | Objectif | Résultat attendu | Composants | Dépendances | Risques | Tests | Priorité | Palier |
|---|---|---|---|---|---|---|---|---|
| AN-13 événements CMS sans abonné | Brancher `comment.created`, etc. sur le bus | L'automatisation réagit au CMS | `services/comments.js`, bus marketing | Décision d'usage | Inscriptions non voulues (règle : un commentaire n'inscrit pas) | Test « un commentaire n'inscrit toujours personne » | P2 | Palier orchestration |
| AN-14 doublons | Inventaire daté, décision par doublon | Moins de systèmes parallèles | Voir AN-14 | D6 | Fusion risquée | Tests de chaque module concerné | P2 | Palier « nettoyage » |
| AN-17 collision de migrations | Vérifier le dernier numéro avant tout envoi | Plus de démarrage refusé | process | — | — | `tests/audit-corrections.test.js` après fusion | P2 | Immédiat (règle de travail) |

## 5. Fonctionnalités manquantes importantes

| Problème | Objectif | Résultat attendu | Composants | Dépendances | Risques | Tests | Priorité | Palier |
|---|---|---|---|---|---|---|---|---|
| AN-03 flux RSS | Flux Atom/RSS du blog et par catégorie | Abonnement possible | `routes/blog.js`, `seo` | — | Fuite de brouillons | Brouillons exclus, échappement, validation du flux | P2 | Palier contenu |
| AN-04 recherche globale | Recherche pages + articles ; recherche d'administration | Visiteurs et rédacteurs retrouvent un contenu | Templates « recherche », `cmsScreens` | — | Fuite de brouillons / de pages privées | Brouillon non trouvé ; noindex conservé | P2 | Palier contenu |
| AN-02 multi-site du blog / médias | Selon D1 : `site_id` + filtres + héritage | Un blog et une médiathèque par site | `posts`, `taxonomy_terms`, `blog_comments`, `mk_media` | D1 | **Élevé** (migrations, 4 tables) | Deux sites × tous les écrans ; IDOR | P2 | Palier multi-site |
| AN-06 programmation des pages | Même mécanisme que les articles | Lancement planifié | `landing`, `promoteScheduled` | — | Promotion hors délai (lecture seule) | Page programmée publique à l'heure, jamais avant | P2 | Palier contenu |
| AN-10 API de contenu | Ressources en lecture d'abord | Intégrations externes | `api/router.js` | D5 | Exposer un brouillon | Clés d'API par site, brouillons exclus | P2 | Palier API |
| AN-15 import WordPress | Lire un export WXR | Migration facilitée | `services/tools/importer.js` | D5 | Contenus mal convertis | Jeu d'export réel | P2 | Optionnel |

## 6. Qualité du rendu public

| Problème | Objectif | Résultat attendu | Composants | Priorité | Palier |
|---|---|---|---|---|---|
| AN-05 pages non indexées par défaut | Défaut selon le type | Les pages du site apparaissent dans le sitemap | `landing`, migration | P2 | Palier SEO |
| AN-11 variantes d'image | Miniatures, `srcset`, WebP | Pages plus rapides sur mobile | `media/index.js`, rendu | P2 | Palier performance |
| AN-24 page 404 | Modèle par défaut utile | 404 claire avec liens | `appearance` | P3 | Palier apparence |
| AN-21 archives par date | Au besoin | — | `routes/blog.js` | P3 | À décider |

## 7. Expérience utilisateur

| Problème | Objectif | Priorité | Palier |
|---|---|---|---|
| AN-04 recherche d'administration désactivée | Brancher ou retirer le champ | P2 | Palier UX |
| AN-28 notifications / aide désactivées | Brancher ou retirer | P3 | Palier UX |
| AN-12 notification des commentaires au modérateur | E-mail via le moteur existant | P2 | Palier commentaires |
| AN-25 / AN-26 / AN-27 fenêtre blanche en thème sombre, avatar, petites cibles | Retouches | P3 | Palier UX |

## 8. Performance

Aucune mesure alarmante dans cet audit (blog à 1 000 articles : 26 à 460 ms). À surveiller : poids de l'éditeur (1,2 à 1,8 Mo) et variantes d'image (AN-11). Les requêtes lentes en production sont « non mesurées » (PF-04) : prévoir une mesure en production.

## 9. Améliorations secondaires

AN-22 (taxonomies personnalisées), AN-23 (permaliens, hiérarchie dans l'URL), AN-29, AN-30, AN-31, AN-32 : à reprendre selon les décisions D1 à D6.

## Ordre que je conseille (si tu valides)

1. **D1 à D6** (décisions, sans code).
2. **Articles multi-auteurs** (AN-01), le seul P1.
3. **Exploitation** : sauvegarde externe (AN-08), journal de connexions (AN-09).
4. **Contenu public** : RSS (AN-03), recherche (AN-04), indexation par défaut (AN-05), programmation des pages (AN-06).
5. **Multi-site du blog** (AN-02) si D1 = oui : le plus risqué, à faire après les précédents.

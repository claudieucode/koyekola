# Corrections apportées après l'audit (palier 23, phase 2)

Après le rapport, j'ai reçu la consigne « fais tout, puis pousse et déploie ». Les décisions D1 à D6 n'ayant pas été données une à une, j'ai appliqué mes recommandations. **Une correction n'a pas été faite** : le système a bloqué la modification des droits d'écriture des articles (voir plus bas).

## Corrigé et testé (`tests/cms-remediation.test.js`, 19 tests)

| Anomalie | Ce qui a changé | Fichiers |
|---|---|---|
| **AN-05** pages non indexées par défaut | Une page de **site** créée depuis le CMS est maintenant indexable par défaut (présente au plan du site, sans `noindex`). Une page d'atterrissage ou une étape de tunnel reste non indexée. Les pages existantes ne changent pas. Le réglage reste modifiable dans la fiche de la page. | `src/marketing/pages/index.js` |
| **AN-03** pas de flux RSS | `/blog/feed.xml` (RSS 2.0, 20 derniers articles **publiés** ; brouillons, programmés et corbeille exclus ; texte échappé) ; `/feed` redirige (301) ; lien de découverte automatique dans l'en-tête de toutes les pages. | `src/routes/blog.js`, `views/partials/header.ejs` |
| **AN-04** pas de recherche | **Public** : `/recherche?q=` cherche dans les articles publiés (titre, extrait, catégorie, étiquettes, texte) et les pages de site publiées, sans tenir compte des accents ni des majuscules, en `noindex`. **Administration** : la barre du haut est une vraie recherche (pages, articles, médias, menus), limitée aux familles que la personne a le droit de lire ; les jokers `%` et `_` saisis sont neutralisés. | `src/routes/blog.js`, `views/search.ejs`, `src/marketing/web/cmsSearch.js`, `views/marketing/cms-search.ejs`, `views/marketing/partials/cms-topbar.ejs` |
| **AN-06** pas de programmation des pages | Bouton « Programmer la publication » (date en heure locale, convertie en UTC avec le décalage du navigateur). La page est publiée **à la première visite après l'heure** (comme les articles, sans tâche de fond ; au plus une vérification toutes les 15 s). Les contrôles de publication sont faits à la programmation **et** à l'heure dite ; en cas d'échec, la programmation est retirée et l'échec est consigné (jamais silencieux). Publier à la main, archiver ou annuler retire la programmation. **Migration 069** (`scheduled_at`, additive). | `src/marketing/pages/index.js`, `src/marketing/web/landing.js`, `views/marketing/landing.ejs`, `server.js` (1 ligne), `069_pages_programmees.sql` |
| **AN-09** connexions non journalisées (en partie) | Connexions réussies, échecs et comptes suspendus de l'**équipe** dans le journal d'audit existant. Mot de passe jamais écrit ; adresse IP et e-mail d'un compte inconnu seulement sous forme d'empreinte courte ; une connexion d'élève n'est pas journalisée. **Pas de double authentification** (non faite). | `src/routes/auth.js` |
| **AN-12** pas d'alerte de commentaires (en partie) | Un commentaire en attente met en file **un seul e-mail par tranche de 10 minutes** pour l'adresse administrative (nombre de commentaires en attente + lien ; jamais le texte du commentaire). `COMMENT_NOTIFY=0` coupe l'alerte. L'effacement RGPD d'un invité n'est **pas** fait. | `src/services/comments.js` |

**Trouvé en testant** : la fonction d'audit existante ignore les actions sans personne connectée. J'ai donc consigné directement la mise en ligne automatique et ses échecs (utilisateur vide = le système). Un de mes tests passait à vide (les invités n'étaient pas autorisés) : je l'ai rendu strict.

## Non fait, et pourquoi

| Anomalie | Raison |
|---|---|
| **AN-01** rédaction par les autres rôles (**P1**) | **Bloqué par le système de permissions de l'outil** : élargir les droits d'accès à l'éditeur d'articles n'était pas explicitement approuvé. Je n'ai rien contourné. Le code est prêt dans ma tête et prévu : l'éditeur s'ouvrirait aux seuls rôles `articles.write` (tous les articles) ou `articles.edit_own` (les leurs), l'auteur resterait forcé à la personne connectée, publier garderait `articles.publish`, et un article en ligne ne serait pas modifiable sans ce droit. **Il faut ton accord explicite pour que je le fasse.** |
| AN-02 multi-site du blog / médias | Décision D1 : non pour l'instant (chantier lourd, quatre tables). |
| AN-16 droits du Lecteur | Décision D3 : modifier la table des permissions touche beaucoup de modules ; à valider. |
| AN-07 copie locale du Page Builder | Le fichier de l'éditeur (`public/js/marketing-editor.js`) est modifié en parallèle par d'autres sessions : je n'y touche pas. |
| AN-08 sauvegarde hors serveur | Demande un stockage externe et des identifiants que je n'ai pas (et je ne touche pas aux variables de l'hébergeur). |
| AN-09 (2FA), AN-10, AN-11, AN-13, AN-15, AN-18 à AN-32 | Hors de ce lot : décisions de périmètre ou chantiers à part. `npm audit fix` n'a pas été lancé : il modifierait le dossier `node_modules` partagé entre les sessions. |

## Score recalculé (mêmes règles que `05-score-parite.md`)

| Dimension | Avant | Après |
|---|---|---|
| Parité fonctionnelle | 80 % | **83 %** |
| Sécurité et gestion des données | 77 % | **82 %** |
| Expérience utilisateur | 67 % | **78 %** |

Lignes de la matrice qui changent : PG-14, PG-15, AR-10, AR-16, UX-05, CM-05, US-07, SC-12 (voir `audit-parite/apres-corrections.js`). La matrice d'origine (`01-matrice-parite.md`) est conservée telle quelle : c'est l'état au moment de l'audit.

## Vérifications

- `tests/cms-remediation.test.js` : 19 / 19.
- Suites proches relancées : `cms-pages`, `cms-seo`, `cms-comments`, `cms-articles`, `cms-urls`, `cms-revisions`, `cms-outils`, `cms-interface`, `cms-abtest*`, `seo-core`, `seo-technical`, `audit-corrections` (migrations) : toutes vertes. Seul échec : « les ombres sont teintées de bleu nuit » (`refonte-design`), **déjà en échec avant mes changements** (CSS d'une autre session).

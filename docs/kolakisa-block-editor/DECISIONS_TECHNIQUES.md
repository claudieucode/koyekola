# Décisions techniques

## DT-1 — Périmètre : l'éditeur d'articles Tiptap, pas le Page Builder
L'éditeur « de type Gutenberg » est l'éditeur d'articles (`src/editor/blog-editor.js`). Les pages (Page Builder, sections JSON) restent hors périmètre : `KOLAKISA_CMS_PAGES_NOUVELLE.md` §4 les déclare volontairement sans éditeur de blocs HTML, faute de modèle de contenu commun. Statut : **BLOQUÉ** (décision de produit requise, voir PLAN §Blocages).

## DT-2 — Format de stockage : on garde le HTML structuré (`kb-*` + `data-*`)
Le rapport de référence (`PERSISTANCE_ET_COMPATIBILITE.md` §9) compare quatre options et recommande à titre provisoire un JSON canonique versionné. **Nous ne le retenons pas maintenant**, pour ces raisons :
- Le HTML structuré est le format en production pour tous les articles existants ; une migration vers du JSON toucherait tout le contenu enregistré, ce que la mission interdit sans plan de récupération testé sur données réelles (règle 7).
- Le rendu public, le SEO (sommaire, FAQ, Schema), le RSS, la recherche, les révisions et l'import WordPress reposent sur ce HTML.
- Les avantages cités pour le JSON (migrations de schéma, blocs inconnus, diff par bloc) sont atteignables en gardant le HTML : identifiants de blocs stables déjà présents (`data-block-id`), futur registre central, bloc de repli pour les inconnus (P0/P4).
À rouvrir seulement si un besoin concret (collaboration temps réel, API publique de blocs) l'exige ; une migration serait alors versionnée, réversible, et précédée d'une sauvegarde.

## DT-3 — Pas de dépendance aux paquets `@wordpress/*`
Architecture native sur Tiptap/ProseMirror, déjà en place. Gutenberg sert de référence fonctionnelle, pas de dépendance.

## DT-4 — Une seule source de vérité des blocs (registre) — à construire
Aujourd'hui un bloc existe en deux endroits non reliés : le nœud Tiptap (`nodes.js`) et la liste blanche de sanitisation (`blogHtml.js`). Tout nouveau bloc doit ajouter les deux. Cible : un registre central décrivant attributs, rendu, sanitisation et transformations, dont les deux consommateurs sont dérivés. Étape P4, après stabilisation P0/P1.

## DT-5 — Sécurité : refus plutôt que troncature
Une sauvegarde automatique trop grosse est refusée (HTTP 413, message) au lieu d'être tronquée en JSON invalide (D2). Même principe pour toute future limite : jamais de perte silencieuse.

## DT-6 — Accès limité et brouillon automatique
Un administrateur de site à accès limité ne peut pas appeler `/api/brouillon` (refus voulu, `LIMITED_API`). Son éditeur ne crée donc le brouillon qu'au premier enregistrement manuel. Limite connue, pas corrigée : à rediscuter avec le propriétaire du produit.

## DT-7 — Outillage
Le worktree utilise un lien symbolique `node_modules` vers `KOYEKOLA-deploy` (non versionné). Ce dossier n'a pas CodeMirror : `npm run build:editor` échoue sur `theme-code-editor` avant d'écrire quoi que ce soit. Le bundle `blog-editor.js` a été reconstruit avec exactement les mêmes options esbuild que `scripts/build-editor.js`, pour ce seul point d'entrée. À refaire proprement avec un `npm ci` avant tout déploiement.

## DT-8 — Pas de bloc « HTML personnalisé » *(remplacée par DT-16 : le bloc existe désormais, réservé au compte créateur et signé)*
Gutenberg l'offre aux administrateurs. Kolakisa le refuse : tout le contenu est assaini par liste blanche (jamais de script, de gestionnaire d'événement ni d'iframe libre), et un bloc HTML libre contredirait cette garantie pour les articles publiés. **Statut BLOQUÉ, décision produit** : le réserver aux administrateurs, le passer aussi par le filtre (donc un « HTML » qui ne peut rien exécuter), ou ne pas l'offrir. Les besoins courants sont couverts autrement : contenu embarqué à liste blanche (8 services), Google Maps, FAQ, étapes.

## DT-9 — Classes supplémentaires : préfixe `kb-x-` obligatoire
Gutenberg laisse saisir n'importe quelle classe CSS. Ici : seulement `kb-x-[a-z0-9-]{1,30}`, 5 au maximum, stockées dans `data-class` puis déposées en `class` au rendu. Raison : pas de collision avec le CSS du site, pas de classe qui ferait apparaître du contenu masqué, pas d'injection de mise en forme. Les classes servent de crochets au CSS personnalisé du site.

## DT-10 — Notes : table séparée, jamais publiées
Les notes de travail vivent dans `post_notes` (clé étrangère `ON DELETE CASCADE` vers l'article), hors du contenu, des révisions, du flux RSS et du plan du site (test : le texte d'une note n'apparaît dans aucune page publique). Droits : ceux de l'éditeur (`articles.write` / `articles.edit_own`, périmètre de site imposé par le serveur) ; supprimer : l'auteur, ou qui peut modifier tous les articles du site.

## DT-11 — Blocs réutilisables : colonne `site_id` nullable, aucun contenu migré
`blog_reusable_blocks.site_id` est ajoutée par `ALTER TABLE … ADD COLUMN` idempotent au démarrage du service. **NULL = bibliothèque partagée** (comportement d'avant : aucune ligne existante n'est modifiée, aucun article ne change). Un bloc créé depuis l'éditeur d'un site appartient à ce site ; un site ne voit que les blocs partagés et les siens ; une référence vers un bloc non visible est retirée à l'enregistrement et ignorée à l'affichage. **Retour arrière** : l'ancienne version du code ignore la colonne et les deux tables ajoutées (`blog_reusable_versions`, `post_notes`) — SQLite tolère les colonnes et tables en plus ; aucune sauvegarde de données n'est détruite.

## DT-12 — Aucune migration de contenu
Aucun format de bloc existant n'a changé de sens : les articles enregistrés restent lisibles tels quels. Le registre porte une version de schéma (`SCHEMA_VERSION`) et le diagnostic compte les classes inconnues, mais **aucun mécanisme de migration n'est fabriqué sans besoin** : une dépréciation sera ajoutée le jour où un attribut changera de sens.

## DT-13 — Conflit de modification par empreinte, sans nouvelle colonne
La date `updated_at` est précise à la seconde : deux enregistrements dans la même seconde passaient. L'éditeur envoie désormais `base_rev` = empreinte (SHA-1) du contenu et des réglages (`revisionFingerprint`, déjà utilisée pour les révisions). Le serveur compare ; sans `base_rev`, l'ancien contrôle par date s'applique (formulaires classiques). L'autosave et la restauration appliquent le même contrôle.

## DT-14 — Contenu embarqué : liste blanche élargie, adresse reconstruite
Ajout de Spotify, SoundCloud, Dailymotion, Loom et TED. Comme pour YouTube/Vimeo, l'adresse du lecteur est **reconstruite par le serveur** à partir d'identifiants validés (domaine exact, https obligatoire) ; une adresse qui ressemble (`soundcloud.com.evil.org`) reste un simple lien (tests).

## DT-15 — D8 / D9 réévalués : portée du compte créateur
Constat : `requireBlogAccess` laisse passer le rôle « formateur » sans limite, mais les routes de médiathèque et de blocs ne sont dans la liste des routes d'écriture d'aucun autre rôle (`WRITER_ROUTES`). Un administrateur de site ou un rédacteur n'y accède donc pas : le « formateur » est le compte créateur de la plateforme. Le risque d'accès entre sites est **faible** (pas de fuite entre membres) ; il reste **la décision produit n° 4** (restreindre ou non le compte créateur par site). La seule voie de lecture entre sites par un rôle limité passait par une référence `data-ref` saisie à la main : fermée par DT-11.


## DT-16 — Bloc « HTML personnalisé » : code libre, mais signé et réservé au compte créateur
Décision du propriétaire (« tout à 100 % ») : le bloc existe, c'est le **seul** à pouvoir contenir du code libre (scripts, iframes, styles). Garde-fous : le code est stocké **encodé** (`data-code`, base64url) avec une **signature HMAC-SHA-256** (`data-sig`) calculée par le serveur avec `ENCRYPTION_KEY` — **seulement** pour le compte créateur (rôle « formateur » sans restriction de site). À l'enregistrement, tout bloc sans signature valide est retiré ; à l'affichage la signature est revérifiée (une valeur injectée en base, un code modifié, une signature copiée sur un autre code ne sont jamais restitués). Sans clé de chiffrement, le bloc est indisponible. Le code n'est pas indexé (texte brut, nombre de mots) et n'apparaît jamais dans les flux RSS (`allowCustomHtml: false`). Dans l'éditeur, l'aperçu est un `<iframe sandbox>` sans script. Fichiers : `src/utils/customHtml.js`, `src/routes/blog.js` (`mayWriteHtml`). Tests : `editeur-blocs-widgets` (signature), `editeur-blocs-widgets-navigateur`, `editeur-blocs-pages`.

## DT-17 — Réglages de style communs : listes fermées, aucun style libre
`src/shared/blockStyles.js` décrit une fois chaque réglage (typographie, couleur, dimensions, espacement, bordure, ombre, filtre). L'éditeur en dérive les attributs des nœuds et le panneau de réglages ; le serveur en dérive les valeurs acceptées. Une valeur est une entrée d'une liste fermée ou une couleur `#rrggbb` ; les couleurs libres sont déposées en **variables CSS** (`--kb-color`…) à l'affichage, jamais en style libre. La mise en forme vient de règles CSS fixes (`public/css/style.css`). Un test vérifie que **chaque valeur de chaque liste a sa règle CSS** (aucun réglage décoratif sans effet). Conséquence assumée : pas de valeur numérique libre (taille, interligne, position absolue) — divergence de Gutenberg, notée « variante sûre » dans la matrice.

## DT-18 — Widgets dynamiques : rendus par le serveur, limités au site de l'article, sans réseau à l'affichage
Les 11 widgets ne sont enregistrés que comme **marqueurs** (`<div class="kb-latest" data-count="5">`). Le serveur fabrique leur contenu à l'affichage (`src/utils/blogDynamic.js`) à partir de `src/services/blogWidgets.js`, qui impose la portée du site de l'article (`siteContent.scopeForSite`) : un article d'un site ne liste jamais le contenu d'un autre site (test d'isolation sur 3 sites). Tout texte passe par des nœuds texte. Un widget sans données n'affiche rien.

## DT-19 — Flux RSS : cache seul à l'affichage, requêtes sortantes verrouillées
`src/services/rssFeeds.js` : https seulement, port 443, sans identifiants ni IP brute ; le nom d'hôte est résolu **avant** la connexion et refusé si une seule adresse est privée, locale, de lien local, CGNAT, multicast ou non spécifiée (IPv4, IPv6, IPv4 encapsulé) ; connexion sur l'adresse vérifiée (pas de seconde résolution) ; 2 redirections au plus, revalidées ; 6 s ; 512 Ko ; types XML seulement. L'affichage d'un article lit le cache (table `feed_cache`, classée « plateforme ») et déclenche l'actualisation en tâche de fond (une par adresse, 4 en parallèle, échec mémorisé 15 min). L'aperçu dans l'éditeur (`/formateur/blog/api/flux`) est réservé au compte créateur et limité en débit.

## DT-20 — Pages du site : une ligne « support » dans `posts`, jamais un article
Pour offrir l'éditeur complet (versions, sauvegarde automatique, notes, aperçu) à la page « À propos », la page a une ligne support dans `posts` (`page_key = 'a-propos'`), **hors ligne** (`published = 0`) et **dans la corbeille** (`deleted_at`, `deleted_from_status = 'page'`) : toutes les listes, recherches, exports, flux et plans d'articles ignorent déjà les contenus supprimés. Les trois endroits qui lisent la corbeille (liste et compteurs d'articles, corbeille générale) excluent `page_key`, et `articles.get()` refuse une page : aucune action d'article (publier, copier, supprimer) ne l'atteint. Enregistrer dans l'éditeur copie le contenu assaini dans `site_pages.content_html` ; la page publique l'affiche avec sa mise en page (titre, introduction, sections `<h2>`). Tant que `content_html` est vide, rien ne change (Markdown). « Revenir au texte simple » vide `content_html` sans rien supprimer. Accès : compte créateur seulement (`requireBlogAccess`). Alternative écartée : une table séparée — elle aurait obligé à recopier toutes les routes de l'éditeur.

## DT-21 — Intégrations : une table de services, une règle
`src/shared/embedProviders.js` : pour chaque service, les hôtes exacts et une expression qui valide l'identifiant ; l'adresse du lecteur est **reconstruite**. Hôte déguisé, http, identifiants, port, identifiant piégé : refusés (test). Les cadres des services tiers portent `sandbox`. Le même module sert l'inserteur (un bloc par service) et le collage d'une adresse (« coller = lecteur »). Les services qui ne s'intègrent que par requête « oEmbed » ne sont pas pris : une requête sortante par affichage est un risque que DT-19 réserve aux flux explicitement ajoutés.

## DT-22 — Verrous partiels par identité de bloc
`locked` (contenu), `lockMove`, `lockRemove` sont des attributs globaux. Le filtre de transactions compare les **identités de blocs** (`data-block-id`) avant et après : un bloc `lockRemove` doit rester ; un bloc `lockMove` garde le même parent et l'**ordre relatif** des blocs voisins qui existaient déjà (insérer un bloc à côté reste permis, enjamber le bloc verrouillé non). Les commandes (déplacer, supprimer) donnent un message précis ; le filtre est le filet de sécurité (glisser-déposer, collage).

## DT-23 — Firefox : test de fumée par WebDriver BiDi, sans module à installer
Firefox 153 est installé ; Playwright n'en pilote que sa propre version. Le test `editeur-blocs-firefox.test.js` parle **WebDriver BiDi** (protocole standard, `WebSocket` natif de Node 24) : il démarre Firefox sans interface, pose le cookie de session, charge l'éditeur et les pages publiques, vérifie l'absence d'erreur JavaScript, l'aller-retour des blocs, la frappe et l'annulation au clavier réel, le zoom et la lightbox. Ignoré avec un message explicite si Firefox est absent. Safari n'est pas testé.

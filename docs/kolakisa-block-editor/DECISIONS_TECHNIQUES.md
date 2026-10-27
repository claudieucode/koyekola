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

## DT-8 — Pas de bloc « HTML personnalisé »
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

# KOLAKISA — Palier 3 : Phase B — plan d'architecture et de migration (à valider)

Plan seulement : **aucune migration, aucune donnée modifiée, rien de poussé.** Il complète `KOLAKISA_PALIER_3_AUDIT.md` (Phase A). Les décisions D1 à D5 de l'utilisateur sont intégrées ; la D6 (audit de production) conditionne le démarrage.

## 0. Décisions prises et conséquences
| Décision | Conséquence technique |
|---|---|
| D1 Blog par site, sur son domaine | articles, catégories, étiquettes, commentaires, blocs réutilisables et pages d'archives par site ; blog public servi sur le domaine du site (aujourd'hui `/blog…` est un 404 sur un domaine de site) |
| D2 Médiathèque par site, partage explicite | `site_id` + indicateur de partage contrôlé (table de partage, pas un simple drapeau) |
| D3 Formulaires, soumissions, contacts, consentements isolés par défaut ; Emailing commun ; partage explicite respectant les consentements | un site ne voit que les contacts qui lui sont rattachés ; un consentement vaut pour un site ; partage = action tracée, sans jamais créer de consentement |
| D4 Modèles et blocs privés ou globaux | `site_id` NULL = bibliothèque globale (pour ces deux tables seulement) |
| D5 SEO par site, valeurs globales = défauts | réglages et métadonnées par site avec repli sur le global |
| D6 Audit de production avant migration | Phase B0 : lecture seule, bloquante |

**Convention de lecture de `site_id` (rappel)** : pour pages, articles, formulaires, médias, contacts… NULL = **site principal**. Exception voulue (D4) : modèles de pages et blocs enregistrés, où NULL = **bibliothèque globale**. Cette différence sera écrite en tête de chaque migration concernée et testée.

## 1. Impacts

### Architecture du CMS
- Chaque site doit ressembler à l'administration d'un WordPress : un **espace de site** (`/marketing/site-web/sites/:id/…`, déjà existant pour les pages) qui regroupe Tableau de bord, Pages, Articles, Catégories/Étiquettes, Commentaires, Médias, Formulaires, Contacts, Menus, Apparence, SEO, Réglages, Équipe. Les modules existent déjà en version globale : le travail est de les **monter dans le contexte du site** et de les isoler en base, pas de refaire des écrans. Le site principal devient un espace de même forme (adresses historiques conservées comme alias).
- Le contexte de site (`req.mk.site`, `ctx.canOn`) reste l'unique source : **le site est déduit de l'adresse (site) ou de la ressource (article → son site)**, puis vérifié ; jamais lu dans un champ envoyé par le navigateur.
- Les services passent par une aide commune de portée de site (une seule clause SQL réutilisée : `site_id = ?` / `IS NULL`), afin qu'aucune requête de lecture ou d'écriture ne soit écrite sans filtre.
- Éditeur d'articles : aujourd'hui **réservé au compte créateur** (`/formateur/blog`, `requireInstructor`) et sans notion de site. Il doit accepter un contexte de site et les droits de site (voir Permissions).

### Emailing (moteur commun, données isolées)
- Déjà par site (palier 16) : listes, segments, modèles d'e-mail, campagnes, automatisations, tunnels (`siteScope` imposé côté serveur).
- À faire : `mk_contacts` est unique par **organisation** (`UNIQUE(organization_id, email)`) : une même adresse = un seul enregistrement. Pour isoler sans casser cette contrainte ni fusionner/dupliquer des personnes, on ajoute une table de **rattachement contact ↔ site** (origine, formulaire, liste, import, partage) ; un site ne lit que les contacts rattachés à lui. `mk_consents` reçoit `site_id` : un consentement donné sur le site A n'autorise **pas** un envoi depuis le site B.
- Envoi : le moteur vérifie, pour la campagne d'un site, que le contact est rattaché à ce site **et** a un consentement valide pour ce site. Les suppressions « dures » (rebond, plainte, effacement demandé) restent **globales** pour la sécurité juridique.
- Aucune modification de l'ordonnanceur, des files d'envoi, du suivi : seulement les filtres d'audience et la vérification de consentement.

### Permissions et utilisateurs
- Rôles existants : équipe d'organisation (`mk_org_members`) et rôles par site (`mk_site_members`, `effectivePermissions(user,{siteId})`). On les réutilise ; **aucun nouveau type de rôle**.
- Ajouter/réutiliser les droits `articles.*`, `taxonomies.*`, `forms.*`, `media.*` **évalués par site**. Une personne limitée à un site ne voit et n'agit que sur ce site (déjà vrai pour les pages).
- Les commentaires (`blog_comments`) sont modérés par site.
- Utilisateurs (comptes) : inchangés ; auteurs d'articles = comptes existants, un auteur peut écrire sur plusieurs sites s'il en a le droit.

### Données existantes
- Tout l'existant reste attribué au **site principal** (NULL), aucune ligne n'est déplacée ni supprimée. Les identifiants sont conservés. Les chemins de fichiers ne changent pas.
- Cas ambigus (§4) : listés par l'audit, laissés intacts jusqu'à décision.

### Modules futurs
- Toute nouvelle table de contenu devra porter `site_id` et passer par l'aide de portée ; un test automatique d'inventaire (liste des tables sans `site_id` et leur justification) échouera si une table de contenu l'oublie.
- Les paliers suivants (non commencés) hériteront de la même règle.

## 2. Modèle cible par entité
| Entité | Changement | Unicités | Contrainte de cohérence |
|---|---|---|---|
| Médias CMS `mk_media` | `+site_id` ; nouvelle table `mk_media_shares(media_id, site_id, granted_by, granted_at)` | inchangé (`organization_id,path` : un fichier physique) | un site n'utilise (page, article, composant) que ses médias ou les médias partagés avec lui |
| Médias du blog `media` | `+site_id` | `path` unique inchangé | idem |
| Formulaires `mk_forms` | `+site_id` | `slug` unique **par site** (reconstruction de table) | page ↔ formulaire du même site (déclencheur comme au palier 2) ; `mk_form_files`, `mk_pending_confirmations` suivent le formulaire |
| Contacts | table `mk_contact_sites(contact_id, site_id NULL=principal, via, since)` ; `mk_consents +site_id` | une ligne par (contact, site) | lecture filtrée par rattachement |
| Modèles / blocs (`mk_page_templates`, `mk_saved_blocks`) | `+site_id` (NULL = global) | nom unique par site (reconstruction légère) | un site applique un modèle global ou le sien |
| Articles `posts` (+ révisions, autosaves, corbeille de blocs, historique de slugs) | `posts +site_id` ; les tables filles héritent par leur article | `slug` unique **par site** (reconstruction de `posts`) | l'article et ses termes sont du même site (déclencheur) |
| Catégories/étiquettes `taxonomy_terms` | `+site_id` | `(taxonomy, slug)` unique **par site** (reconstruction) | un terme n'est attribuable qu'à un article du même site |
| Commentaires `blog_comments` | héritent du site de l'article ; pas de colonne en plus (jointure) | — | — |
| Blocs réutilisables du blog `blog_reusable_blocks` | `+site_id` | — | idem articles |
| SEO | `seo_settings` du site principal inchangé ; nouvelles tables `seo_site_settings(site_id,key,value)` et `seo_site_meta` (clé `site_id, entity_type, entity_key`) avec **repli sur le global** | PK incluant le site | — |
| Pages fixes `site_pages` (À propos, FAQ) | inchangé (site principal) | — | — |

**Pourquoi des reconstructions de tables ?** SQLite ne sait pas retirer une contrainte d'unicité. `posts.slug`, `taxonomy_terms(taxonomy,slug)`, `mk_forms(organization_id,slug)` et `mk_page_templates(organization_id,name)` sont uniques à l'échelle de la plateforme : sans reconstruction, deux sites ne pourraient pas avoir le même article/catégorie/formulaire. Pour les tables qui peuvent éviter la reconstruction (SEO, partages, rattachement de contacts), j'ajoute des tables **à côté** plutôt que de modifier les existantes.

## 3. Phases d'exécution (chacune : migration propre, tests d'accès croisé, retour arrière, aucun déploiement)
| Phase | Contenu | Migration |
|---|---|---|
| **B0** (bloquante) | Étendre l'audit existant (lecture seule) : médias, formulaires, modèles, blocs utilisés par une page d'un site non principal ; articles/termes/contacts à rattacher ; unicités à vérifier. Examiner l'audit de production. | aucune |
| **B1** Fondations | aide de portée de site ; espace de site unifié (menu type WordPress) ; inventaire automatique des tables ; droits par site ; **site principal comme espace** | aucune table |
| **B2** Médias | `mk_media.site_id`, `media.site_id`, `mk_media_shares`, bibliothèque, usage, suppression protégée, sélecteurs d'images des pages/composants | 072 |
| **B3** Modèles et blocs | `site_id` (NULL = global), privés/globaux | 073 |
| **B4** Formulaires et contacts | `mk_forms.site_id` (+reconstruction), soumissions, `mk_contact_sites`, `mk_consents.site_id`, filtres d'audience, vérification de consentement à l'envoi | 074-075 |
| **B5** Blog | `posts`/`taxonomy_terms`/blocs (+reconstruction), commentaires, éditeur dans le contexte du site, blog public sur le domaine du site (liste, article, catégories, étiquettes, auteurs, flux RSS, recherche), widgets/requêtes du CMS, navigation | 076-077 |
| **B6** SEO | tables par site, repli global, sitemap/robots/canonical/données structurées des articles par site | 078 |
| **B7** Sécurité et non-régression | accès croisé (IDOR), caches, exports, recherche, performance (index), suite complète | — |
| **B8** Documentation | 11 livrables | — |

Chaque migration est **additive**, numérotée à partir de 072 (dernières existantes : 070, 071 gelées), crée sa propre **sauvegarde « avant migration »** (mécanisme déjà utilisé), vérifie avant/après le nombre de lignes de chaque table touchée, l'intégrité et les clés étrangères, et s'arrête (sans rien appliquer) en cas d'écart. Les reconstructions se font dans une transaction, identifiants conservés, déclencheurs et index recréés, comparaison table par table.

## 4. Règles de migration des données
1. **Aucune ligne n'est réécrite arbitrairement.** Les lignes existantes gardent NULL (site principal).
2. **Exception tracée** : un contact, une soumission ou un consentement dont le site se déduit d'un fait objectif (`origin_site_id`, formulaire d'une page d'un site, liste d'un site) reçoit ce rattachement ; les cas où deux faits se contredisent sont **laissés en « à décider »**, avec un rapport.
3. Médias/formulaires/modèles utilisés par des pages de plusieurs sites : restent intacts ; le rapport les liste ; après décision, partage explicite (média, formulaire non partageable : il est dupliqué par site à la demande).
4. Contrôles automatiques avant et après : nombre de lignes par table, somme de contrôle des identifiants, aucune référence orpheline, aucune relation entre sites différents (réutilise `auditSites`).
5. Migration réexécutable sans doublon (clés d'unicité + `INSERT OR IGNORE`).

## 5. Compatibilité et retour arrière
- **Compatibilité** : colonnes facultatives ; l'ancien code (qui ne les connaît pas) continue de fonctionner sur le nouveau schéma, car NULL = site principal. Adresses historiques (`/formateur/blog`, `/blog`, `/formulaires`, `/site-web/medias`) conservées pour le site principal.
- **Retour arrière du code** : `git revert` du commit de fusion. **Du schéma** : colonnes et tables ajoutées inoffensives, laissées en place ; pour les tables reconstruites, restauration de la sauvegarde « avant migration ». Perte à connaître : toute donnée créée *après* la migration serait perdue en cas de restauration complète ; un retour arrière du seul code est donc préférable tant qu'aucun site n'a de contenu propre.
- Chaque phase est livrable et annulable séparément ; aucune ne sera déployée sans votre autorisation.

## 6. Risques
- **R1 – Reconstruction de `posts` et `taxonomy_terms` en production** (tables centrales, clés étrangères, déclencheurs). Atténuation : essai sur copie de la production (audit), transaction, sauvegarde automatique, comparaison avant/après, arrêt en cas d'écart.
- **R2 – Surface de l'éditeur de blog** (~60 routes `/formateur/blog/*`) : à passer en contexte de site sans casser l'éditeur actuel.
- **R3 – Contacts** : seule table où un enregistrement représente une personne unique de l'organisation ; le modèle de rattachement évite de la casser, mais l'envoi doit être revérifié de bout en bout.
- **R4 – Règle « NULL »** différente pour modèles/blocs (globaux) que pour le reste (site principal) : source d'erreur ; couverte par tests.
- **R5 – Charge de travail** : palier volumineux ; livraison par phases courtes.

## 7. Décisions supplémentaires nécessaires
- **D7 – Désinscription.** Se désinscrire depuis un e-mail du site A doit-il laisser l'abonnement au site B intact ? *Recommandation : oui (désinscription par site), mais rebond, plainte et demande d'effacement restent globaux.*
- **D8 – Reconstruction de tables en production** (`posts`, `taxonomy_terms`, `mk_forms`, `mk_page_templates`) avec les garde-fous du §3. *Recommandation : accepter. Alternative : conserver des adresses d'articles/catégories/formulaires uniques sur toute la plateforme (pas de reconstruction, mais deux sites ne pourront pas utiliser la même adresse).*
- **D9 – Éditeur d'articles.** Les membres d'équipe d'un site (non « créateur ») peuvent-ils utiliser l'éditeur d'articles avec les droits `articles.*` de leur site ? *Recommandation : oui (sinon un site n'est pas autonome).*
- **D10 – Site principal comme espace.** Le site principal reçoit le même espace d'administration que les autres sites (adresses actuelles conservées). *Recommandation : oui.*
- **D11 – Périmètre « WordPress ».** Dans ce palier : seulement l'**organisation** de l'espace d'un site à partir des modules existants isolés (pas de nouveau module : extensions, thèmes… sont hors périmètre). *Recommandation : oui.*
- **D12 – Contacts déjà communs.** Un contact déjà rattaché à plusieurs sites par les faits (listes de plusieurs sites) reste visible de chacun de ces sites, sans consentement automatique entre sites. *Recommandation : oui.*

## 8. Prochaine étape
Après **votre validation de ce plan** et **l'examen de l'audit de production** : Phase B0 (extension de l'audit, lecture seule), puis B1. Avant cela, aucune migration ni modification de données.

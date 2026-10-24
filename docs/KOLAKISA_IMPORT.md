# KOLAKISA CMS — Outils → Importer

Écran : **Outils → Importer** (`/marketing/site-web/outils/importer`, ou « Outils → Importer » dans le cadre d'un site). Référence : l'écran WordPress « Importer ».

## 1. Audit avant la mission

| Fonction | État | Constat |
|---|---|---|
| Import natif `kolakisa-site@1` (`services/tools/importer.js`, `exchange.js`) | **Opérationnel** | Fichier → **analyse à blanc** → rapport → confirmation → import par lots (annulable) → rapport final → « Annuler cet import ». Créations par les services métier, jamais d'écriture directe ; pages et articles toujours en brouillon ; aucune suppression ; stratégie de conflit explicite. **Conservé et réutilisé tel quel.** |
| Export (`Outils → Exporter`) | Opérationnel | Format JSON `kolakisa-site@1`. **Réimportable** : taxonomies, pages, articles, menus, redirections, métadonnées de médias, SEO, réglages. **Non réimportables** : commentaires (confidentialité), contacts. |
| File de travaux, progression, annulation (`runner.js`, `runs.js`) | Opérationnels | Réutilisés (tâche = « opération » avec identifiant, progression réelle, reprise après arrêt du serveur marquée « interrompue »). |
| Téléchargement distant sécurisé (`marketing/rss/feed.js`) | Opérationnel (flux RSS des campagnes) | Garde-fous anti-SSRF complets. **Généralisé** par `fetchBuffer` (même code, pas de seconde protection). |
| Médiathèque (`media.saveUpload`) | Opérationnelle | Type réel vérifié par le contenu, limites, stockage : réutilisée pour les médias importés. |
| Importateurs WordPress, flux, convertisseur, registre, doublons par identifiant source, correspondance des auteurs | **Absents** | Créés par cette mission. |

Aucun second moteur : les importateurs externes **convertissent** leur source vers le format interne, puis passent par le moteur existant (analyse, confirmation, lots, rapport, annulation).

## 2. Registre d'importateurs (`services/tools/importers`)

Chaque importateur est déclaré (`defs/NN-nom.js`) : identifiant, nom, description, formats et types MIME acceptés, données prises en charge, limites connues, dépendances, permissions, version, état. Une **extension** appelle `registry.register({...})` ; un doublon ou une déclaration invalide est refusé. **Un importateur n'est listé que s'il fonctionne.**

| Importateur | Entrée | Données |
|---|---|---|
| **Kolakisa** | export `.json` | pages, articles, catégories/étiquettes, menus, redirections, métadonnées des médias, SEO, réglages |
| **WordPress** | export WXR `.xml` (1.0 à 1.2) | articles, pages, commentaires, catégories (avec parents) et étiquettes, auteurs (correspondance), dates, image mise en avant, médias (téléchargement facultatif), titres/résumés SEO Yoast |
| **Flux** | RSS 2.0 / Atom : fichier **ou adresse** (téléchargée avec accord) | articles (titre, contenu, résumé, date), étiquettes depuis les catégories, auteur |
| **Convertisseur** | outil (aucun fichier) | catégories → étiquettes et étiquettes → catégories, sélectif, avec aperçu |

**Sources non prises en charge** (affichées honnêtement, jamais comme importateurs) : Blogger, Tumblr, LiveJournal, Movable Type / TypePad (authentification à une API distante ou format propre non lu). **Il n'y a aucun bouton « Installer maintenant »** : les importateurs sont livrés avec l'application (installés) ; seule leur **activation** est une vraie préférence (table `mk_importer_state`) qui ferme le parcours, côté serveur, s'il est désactivé.

## 3. Parcours (WordPress, flux)
1. **Source** : fichier (extension, type MIME **et** contenu réel contrôlés ; 20 Mo ; binaire refusé) ou, pour le flux, adresse + accord explicite.
2. **Analyse à blanc** : aucun écrit ; rapport selon le contenu **réellement détecté** (articles, pages, termes, commentaires, médias) et liste des éléments non convertibles (types de contenu inconnus, champs personnalisés, taxonomies personnalisées, codes courts, blocs d'extensions absentes, pings, commentaires de pages, protégés par mot de passe, hiérarchie des pages).
3. **Auteurs** : chaque auteur de la source est associé à un compte **existant de l'équipe** (jamais un compte d'élève) ou à l'auteur par défaut. **Aucun compte n'est créé, aucun mot de passe ni jeton importé.**
4. **Médias** : par défaut, **non téléchargés** (les liens restent chez la source). Si demandé : accord explicite ; 200 fichiers, 12 Mo chacun, 150 Mo au total, 15 s ; **réseau public seulement** (adresses privées, bouclage, métadonnées cloud 169.254.x, noms réservés, redirections vers ces adresses refusés **à la connexion**) ; type et contenu réels vérifiés par la médiathèque ; nom de fichier entièrement fabriqué par le serveur. Un échec n'arrête pas l'import : l'article garde un lien vers la source (jamais une image supprimée en silence).
5. **Confirmation** : récapitulatif (destination, options, stratégie) ; défaut « Créer des copies » (jamais de remplacement : une source externe ne met jamais à jour l'existant). Double confirmation sans effet.
6. **Exécution et résultat** : progression réelle, lots, résultat par type (importés / ignorés / échecs), liste des échecs, **rapport JSON téléchargeable** (sans fichier source ni e-mail). Jamais « réussi » si un élément a échoué : « Import terminé AVEC des échecs ».

## 4. Doublons, reprise, annulation
- Table `mk_import_sources` : (organisation, site, source, type, **identifiant d'origine**) → contenu créé. Relancer le même fichier, ou **reprendre** un import interrompu, reconnaît ce qui existe déjà (« déjà importé le … ») : rien n'est recréé. Le titre seul n'est jamais le critère.
- **Reprendre** : nouvelle analyse du même fichier (conservé 48 h) ; les contenus déjà importés sont ignorés.
- **Annuler cet import** : articles à la corbeille (restaurables), commentaires et médias créés par l'import retirés, termes inutilisés supprimés ; ce qui existait avant n'est jamais touché. Aucun nettoyage automatique d'un import partiel.

## 5. Données et relations
Titres, contenu (blocs Gutenberg : commentaires de blocs retirés, HTML conservé ; contenu « classique » : paragraphes reconstitués), dates d'origine, auteurs, catégories avec parents, étiquettes, commentaires avec réponses et statuts (approuvé, en attente, **indésirable**), résumé, image mise en avant, adresses d'images réécrites vers les fichiers locaux. Les identifiants sources sont convertis en références ; les identifiants primaires ne sont jamais réutilisés. **Commentaires** : importés sans notification, sans adresse IP ; l'e-mail de l'auteur est conservé comme pour les commentaires du site (jamais affiché). **Pages WordPress** : converties en une section de texte (Markdown) en brouillon.

## 6. Sécurité et isolation
XML lu par un analyseur sans résolution d'entités ; `DOCTYPE` avec `ENTITY`, `SYSTEM`, `PUBLIC` ou sous-ensemble interne **refusé d'emblée** (XXE, « billion laughs ») ; XML mal formé refusé ; contenu assaini (script, cadres, événements, `javascript:` retirés) ; titres échappés à l'affichage ; adresses normalisées (pas de `../`). Permissions : `tools.import` + celles de chaque ressource (l'import d'articles, de catégories et de commentaires est réservé à l'équipe de l'organisation) ; `tools.maintenance` pour activer/désactiver ; `articles.publish` pour publier ; `media.upload` pour les médias. Chaque requête vérifie le site choisi ; une opération n'est lisible que dans son organisation, avec les droits sur **son** site. Le fichier source est stocké dans la base (jamais dans un dossier public), conservé 48 h au plus pour la reprise. Journal d'activité sans contenu ni adresse e-mail.

## 7. Limites connues
- Pas d'import depuis un compte distant (Blogger, Tumblr, LiveJournal) ni de format Movable Type.
- Types de contenu personnalisés, taxonomies personnalisées, champs personnalisés WordPress, hiérarchie des pages, commentaires de pages : signalés, non convertis.
- Les liens internes absolus vers l'ancien site ne sont pas réécrits.
- Les pages importées sont du texte (pas de reconstruction de la mise en page d'origine).
- Le téléchargement des médias est séquentiel (200 fichiers au plus par import).

## 8. Fichiers
`src/services/tools/importers/` (`registry.js`, `defs/*`, `xml.js`, `html.js`, `wordpress.js`, `feed.js`, `termConverter.js`) · `src/services/tools/exchange.js`, `importer.js`, `exporter.js` (adaptations) · `src/marketing/web/importers.js` (routes), `tools.js` · `src/marketing/rss/feed.js` (`fetchBuffer`) · `src/services/comments.js` (`importOne`) · migration `104_importateurs.sql` · `views/marketing/tools-import-*.ejs`, `tools-run.ejs` · `public/js/cms-import.js`, `public/css/kola-pages.css` · test `tests/importateurs.test.js`.

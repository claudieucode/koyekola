# KOLAKISA — Outils → Exporter

Référence : « Exporter » de WordPress (capture fournie, format WXR). État **réel** de Kolakisa.

## 1. État initial (audit) et éléments réutilisés

Un export existait déjà (palier 13) : format JSON `kolakisa-site@1` réimportable, exécution asynchrone par lots avec progression réelle (`cms_tool_runs`, `runner.js`), fichier conservé 24 h, contrôle de fuite de secrets, droits `tools.export` + droit de lecture de chaque ressource, import correspondant (Outils → Importer) et sauvegarde d'un site avec médias (`siteBundle.js`, format binaire propre). **Réutilisés tels quels** : le moteur d'exécution, la table des opérations, les droits, le contrôle de secrets, l'import. **Ajoutés** : filtres, portée stricte par site, format WXR, archive ZIP, écran à la manière de WordPress, téléchargement privé.

## 2. Sélection, filtres, périmètre

| Choix | Contenu | Filtres (validés par le serveur) |
|---|---|---|
| Tout le contenu (défaut) | tout ce qui est exportable pour le site et les droits de la personne, sauf les données personnelles | — |
| Articles | articles + catégories et étiquettes utilisées (et leurs parents) ; commentaires approuvés en WXR | catégorie (sous-catégories comprises), auteur, date de début, date de fin, statut |
| Pages | pages avec leur page parente (`parentRef`) | auteur, dates, statut |
| Autres types | liste alimentée par le registre réel : réglages, termes, menus, redirections, médias, SEO (site principal), commentaires, contacts (données personnelles, choix volontaire) | — |

- **Dates** : saisies en jour local, converties selon le **fuseau du site** (heure d'été comprise) ; elles portent sur la date de publication (création pour un brouillon).
- Un filtre invalide (statut inconnu, catégorie ou auteur d'un autre site, date impossible, début après fin) est refusé avec un message ; une sélection sans résultat n'ouvre aucune opération et **la saisie est conservée**. L'aperçu (`/exporter/apercu`) annonce le nombre d'éléments avant l'export, sans rien écrire.
- **Portée de site** : l'export d'un site ne contient que le contenu **rattaché à ce site** (articles, termes, commentaires, médias, pages, menus, redirections) ; le site principal = contenu non rattaché. Jamais le contenu d'un autre site. Le référencement (`seo_meta`) n'est pas rattaché à un site : exporté seulement pour le site principal.

## 3. Formats

- **Natif Kolakisa** (`kolakisa-site@1`, JSON) : manifeste (version, site source — nom seulement —, date, sélection, filtres, comptages, politique des médias, somme de contrôle), références stables `p12 / a5 / t3…` que l'import remappe sur de **nouveaux** identifiants (jamais réutilisés comme clés primaires). Nom d'auteur ajouté aux articles et aux pages.
- **WordPress WXR 1.2** (`wxr.js`) : catégories (avec parent), étiquettes, articles, pages (**texte** de l'éditeur visuel), commentaires approuvés, médias (URL absolues), menus (éléments `nav_menu_item`), auteurs (nom d'affichage). Dates locales + GMT, `]]>` protégé, caractères XML interdits retirés, emoji conservés. **Aucune adresse e-mail ni IP** (champs vides). Contrôlé avec `xmllint` (bien formé). **Non vérifié avec l'importateur WordPress** (aucun WordPress n'est disponible ici) : la compatibilité est conforme au format documenté, pas démontrée par un import réel.
  - Conservés **seulement** dans le format natif : mise en page de l'éditeur visuel, réglages, redirections, référencement, contacts. Un type qui n'existe qu'en natif est refusé en WXR (message clair) ; « Tout le contenu » les ignore et l'indique dans le rapport.

## 4. Médias

Par défaut : références et métadonnées seulement (dit dans le manifeste et à l'écran). Option **« Inclure les fichiers médias dans une archive ZIP »** : `export.json|xml` + `media/…` + `manifest.json` (fichiers inclus, introuvables, nombre de fichiers d'autres sites **exclus**). Les fichiers viennent uniquement du dossier du site ; chemins contrôlés (aucun `..`), noms normalisés ; limites 2 000 fichiers et 300 Mo ; l'archive est relue et chaque entrée vérifiée (somme de contrôle) avant d'annoncer « prêt ». Ce n'est **pas** une sauvegarde du serveur : aucun secret, aucun fichier de configuration. L'archive n'est pas réimportable directement (décompressez-la, importez `export.json` ; pour restaurer un site avec ses médias, utilisez « Sauvegarde du site »).

## 5. Téléchargement et sécurité

- Export asynchrone par lots, annulable, progression réelle ; texte (JSON/XML) conservé 24 h en base (comme avant), **archive ZIP dans un dossier privé** (`data/exports/`, hors de `uploads/`, jamais servi statiquement) ; nom contrôlé à la lecture ; supprimée du disque à l'expiration (nettoyage des opérations).
- Droits côté serveur à chaque étape : `tools.export`, droit de lecture du type, accès au site (jamais pris dans un champ du navigateur : l'adresse vérifiée décide). Lecteur et anonyme refusés ; l'opération d'un site n'est pas lisible depuis un autre (404).
- Jamais de mot de passe, jeton, clé, e-mail de compte, e-mail ou IP de commentaire ; filet de sécurité qui interrompt l'export si une valeur ressemble à un secret. Fichier nommé `kolakisa-<site>[-articles|-pages]-AAAA-MM-JJ.<json|xml|zip>`.

## 6. Limites

- 5 000 éléments par type et par export (message clair, à réduire par les filtres ou par site).
- Pages en WXR : texte seulement (la mise en page est dans le format natif).
- Types de contenu ajoutés par des extensions : aucun registre d'exporteurs externes n'existe dans Kolakisa à ce jour ; l'ajout se fait dans `exporter.js` (TYPES, EXPORTERS).
- Pas d'import WXR dans Kolakisa.

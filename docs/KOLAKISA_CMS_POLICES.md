# KOLAKISA CMS — Apparence → Polices

Bibliothèque de polices **propre à chaque site** : Bibliothèque · Téléversement · Installer des polices.

## Ce qui existait, ce qui a été ajouté

| Avant | Maintenant |
|---|---|
| Un Font Manager central (1 775 familles Google Fonts hébergées dans `public/fonts/library`, sélecteur unique) | Conservé tel quel : c'est le seul moteur typographique. |
| Aucun écran « Polices » dans le CMS, aucune notion de « polices d'un site » | Écran à trois onglets, menu **Apparence → Polices**, ouvert dans le cadre du site. |
| Impossible d'importer une police | Téléversement WOFF2 / WOFF / TTF / OTF, contrôlé sur le serveur. |
| Un seul catalogue pour tous | Chaque site a sa bibliothèque (`cms_fonts`), ses fichiers (`cms_font_files`) et ses usages. |

## Les trois onglets

- **Bibliothèque** : recherche instantanée (sans accent), filtres combinables (origine, catégorie, statut, « utilisées par le site »), tri, liste ou grille, pagination, texte de démonstration et taille réglables, fiche de détail, désactiver / réactiver / supprimer.
- **Téléversement** : glisser-déposer ou sélection, liste des fichiers avant envoi (nom, format, taille, état, retrait possible), progression réelle, compte rendu fichier par fichier (un refus ne bloque pas les autres). Sans JavaScript, le formulaire fonctionne aussi.
- **Installer des polices** : catalogue Google Fonts (recherche, catégories, tri, pagination), fiche d'une famille avec aperçu de chaque variante, choix des variantes, installation réelle, réinstallation sans doublon.

## « Installer » : ce que cela fait réellement

Les fichiers WOFF2 des familles sont **déjà copiés sur le serveur** (hébergés par Kolakisa : aucun appel à Google pour les visiteurs). Installer une famille sur un site :

1. vérifie qu'elle existe dans le catalogue et que le fichier de **chaque variante choisie** est présent sur le disque (sinon : refus, rien n'est écrit) ;
2. l'enregistre dans `cms_fonts` pour CE site, avec ses variantes ;
3. la rend visible dans la bibliothèque du site.

Aucune clé d'API n'est nécessaire : la source est le manifeste de la bibliothèque (produit par `scripts/fonts/build-library.js`).

## Téléversement : validation côté serveur

- Le **format réel** est lu dans les octets (`src/utils/fontFile.js`) : signature WOFF2 / WOFF / TrueType / OpenType, table des tables, bornes, tables obligatoires (`head`, `cmap`, `glyf` ou `CFF`). L'extension et le type MIME du navigateur ne servent à rien.
- WOFF2 : flux Brotli décompressé avec plafond (24 Mo) ; WOFF : tables décompressées avec le même plafond (anti « bombe »).
- Famille, graisse et style sont lus dans `name` et `OS/2` ; une police variable est reconnue par `fvar` (plage de graisses).
- Limites configurables : `FONT_MAX_FILE_MB` (5, max 5), `FONT_SITE_QUOTA_MB` (60), `FONT_MAX_FILES_PER_UPLOAD` (12), `FONT_MAX_FAMILIES_PER_SITE` (80).
- Doublon (même contenu, même variante) refusé ; plusieurs graisses d'une famille sont regroupées.
- Stockage : `<UPLOADS_DIR>/fonts/<48 caractères aléatoires>.<ext>`, jamais sous `public/`, jamais exécuté. Il suit donc `UPLOADS_DIR` / `DATA_DIR` et les sauvegardes de fichiers existantes (Centre de gestion → Sauvegardes).

## Isolation entre les sites

- Le site vient de l'adresse **vérifiée par le serveur** (`siteTarget.js`, partagé avec Thèmes), jamais d'un état du navigateur. Un accès limité au site B reçoit 403 sur A, même en forgeant `?site=` ou le champ `site`.
- Toute lecture / écriture passe par `sameScope("site_id")` : une police de A est « introuvable » (404) quand on la vise par son identifiant depuis B ou le principal.
- Un fichier téléversé n'appartient qu'à UNE famille d'UN site (aucun partage) ; supprimer sur B ne touche rien de A. Pour les familles Google, les fichiers sont mutualisés (références partagées en lecture seule), jamais les associations.
- Adresse publique d'un fichier : `/polices/site/<secret>.<ext>` : non devinable, servie seulement tant que la famille est **active** (désactivée ou supprimée : 404). Un site public doit pouvoir charger ses propres polices ; l'isolation repose sur le secret propre à chaque fichier et sur la base.
- Les jetons typographiques d'un site n'acceptent que **ses** polices téléversées (`fontScope`), en écriture ; en rendu, les `@font-face` ne sont livrés que pour le site demandé.

## Intégration

- **Réglages typographiques** (titres, texte, boutons, liens) : les polices téléversées du site apparaissent dans le sélecteur (puce « Téléversées ») de **Apparence → Styles** (site principal), de **Réglages du site** et du panneau de design du Page Builder. Identifiant : `font.u<n>`.
- **Rendu public** : `@font-face` livrés avec la page du site (pile de repli selon la catégorie choisie, `font-display: swap`). Pour le site principal, ils sont ajoutés à chaque rendu (une variante ajoutée après publication est prise en compte sans republier).
- **Protection** : une police utilisée (réglages du site, page) ne peut être ni supprimée ni désactivée ; le message dit où elle sert. Supprimer une police Google libère la famille du site mais la laisse dans le catalogue.
- Journal d'audit : `font.installed`, `font.uploaded`, `font.updated`, `font.enabled`, `font.disabled`, `font.removed`, `font.variant_removed`, avec le site.

## Limites connues (dites sans détour)

- Les polices téléversées sont proposées dans les **réglages typographiques du site** ; les sélecteurs de police *par bloc* du Page Builder et des e-mails n'acceptent que la bibliothèque Google (un bloc ne peut pas référencer une police téléversée).
- Les variantes retenues à l'installation d'une famille Google sont enregistrées et affichées ; les `@font-face` livrés au public restent ceux de la famille entière (le navigateur ne télécharge que les fichiers dont il a besoin).
- La détection d'usage lit les réglages du site et les pages (publiées ou en brouillon) ; elle ne parcourt pas les articles de blog ni les e-mails.
- Les polices téléversées ne sont pas copiées d'un site à l'autre (volontairement) ; pour la même police sur deux sites, il faut l'importer deux fois.
- Licence : c'est à la personne qui importe de détenir le droit d'usage web.

## Fichiers

Migration `095_polices_par_site.sql` · `src/utils/fontFile.js` · `src/utils/fontLibrary.js` (police téléversée reconnue dans les jetons) · `src/services/siteFonts.js` · `src/marketing/web/fonts.js` · `src/marketing/web/siteTarget.js` · `src/routes/fonts.js` (fichiers publics) · vues `polices*.ejs` · `public/css/cms-polices.css` · `public/js/cms-polices.js` · `public/js/font-manager.js` · tests `tests/polices-par-site.test.js`.

# KOLAKISA CMS — Paramètres → Général (mission PARAMETRES-GENERAL-01)

Branche `parametres-general-01`, issue de `origin/main` (`3bb93af`). Référence : « Réglages généraux » de WordPress (organisation fonctionnelle seulement). Ce document décrit l'état **réel**.

## 1. Audit initial

**Deux écrans différents portaient le nom « Général » :**

| Écran | Où | Contenu avant la mission |
|---|---|---|
| Paramètres → Général d'un **site** (menu de l'espace du site) | `/sites/<id>/reglages` → `views/marketing/site.ejs` (fiche « Réglages du site ») | Nom, identifiant, description interne, type, page d'accueil · En-tête du site (création, variantes, exceptions) · composants En-tête / Pied de page · **Design system** complet · liste des pages · bloc « À venir » |
| Paramètres → Général du **site principal** (ou `?site=`) | `/parametres` → `views/marketing/settings-group.ejs` (moteur de réglages) | Un long formulaire d'une seule carte : nom, description, langue, fuseau, format de date et d'heure, e-mail administratif (+ logo, favicon, domaine pour un site) |

**Un moteur de réglages complet existait** (`src/services/settings/index.js`, palier 14) : définitions, validation côté serveur, droits par réglage, réglages sensibles avec confirmation, écriture « tout ou rien » en transaction, journal d'activité, isolation par site. Il n'a donc pas été remplacé : l'écran Général en est la **présentation**, rien d'autre. Source de vérité de chaque valeur :

| Réglage | Source (inchangée) |
|---|---|
| Nom, identifiant, type, note interne d'un site | `mk_sites` (`name`, `slug`, `site_type`, `description`) via `pages.updateSite` |
| Slogan / description courte | `mk_sites.settings.identity.description` (site) · `seo_settings.default_description` (principal) — **le même champ** que « Slogan / description du site » de Personnaliser |
| Icône (favicon), logo | `mk_sites.settings.identity.faviconUrl / logoUrl` (déjà rendus par la page publique : `<link rel="icon">`) |
| Domaine personnalisé | `mk_sites.settings.seo.publicUrl` (sensible, unique par site) |
| Page d'accueil | `mk_sites.home_page_id` (site) · `mk_settings cms.homepage_page` (principal) — groupe « Lecture » du moteur ; **une seule valeur**, lue par les deux écrans |
| Langue, fuseau, formats de date et d'heure | `mk_sites.settings.extras.language`, `general.*` (site) · `mk_settings cms.*` / `seo og_locale` (principal) |

**Ce qui n'existait pas et a été ajouté :** premier jour de la semaine ; inscriptions publiques ouvertes / fermées ; formats de date supplémentaires (AAAA-MM-JJ, JJ/MM/AAAA, MM/JJ/AAAA, JJ.MM.AAAA) ; sélecteur d'icône avec aperçu ; fuseaux regroupés par zone avec heure locale en direct.

**Audit des comptes :** l'inscription publique (`/inscription`) existe et ne crée **que** des comptes `etudiant` (accès aux formations achetées, aucun accès à l'administration) ; c'est une fonction de la **plateforme** (site principal), pas d'un site du CMS. Il n'existe pas de « rôle par défaut » choisissable : proposer un sélecteur aurait été décoratif et un risque d'escalade de privilèges. L'écran affiche donc le rôle (fixé par le serveur, un champ `role` envoyé dans le formulaire est ignoré) et renvoie vers Utilisateurs pour les droits d'équipe.

## 2. Structure de la nouvelle page

Cinq sections (titre + explication à gauche, champs à droite ; une seule surface par section ; largeur maximale 1040 px, centrée) puis « Réglages liés » et « Gestion du site » :

1. **Identité du site** — nom · slogan et description courte (compteur) · icône du site (sélecteur d'image de la médiathèque, aperçu, retrait) · logo · identifiant · type · note interne (site seulement).
2. **Adresses et URL** — adresse publique (calculée, informative) · adresse de l'administration (indépendante du domaine) · page d'accueil · domaine personnalisé (sensible, site seulement). Le site principal n'a pas d'URL modifiable : `SITE_URL` est une variable d'hébergement, jamais éditable depuis le CMS.
3. **Comptes et inscriptions** — inscriptions publiques (principal, sensible) · rôle des nouveaux comptes (information) · e-mail administratif (principal).
4. **Langue et localisation** — langue du site · fuseau horaire IANA (heure locale et heure universelle en direct, changements d'heure gérés).
5. **Dates, heures et calendrier** — format de date (7 choix avec exemples en direct) · format d'heure · premier jour de la semaine (calendrier d'aperçu) · aperçu complet.

Barre d'enregistrement fixe : état (« Aucune modification » / « Modifications non enregistrées (n) » / « Enregistrement… » / « Enregistré à HH:MM »), **Annuler les modifications**, **Enregistrer les modifications**.

**Écrans déplacés (aucune donnée ni fonction perdue)** — leurs formulaires, routes `POST` et données sont inchangés ; seul l'emplacement a changé :

| Avant | Maintenant |
|---|---|
| « En-tête du site » (création, variantes, exceptions) | Apparence → **En-tête** : `/sites/<id>/reglages/en-tete` |
| « En-tête et pied de page » (composants) | Apparence → **Pied de page** : `/sites/<id>/reglages/pied-de-page` |
| « Design system » (couleurs, typographie, espacements, rayons, ombres) | `/sites/<id>/reglages/design-system` (lié depuis Général, depuis Styles et depuis la liste centrale « Styles ») |
| « Pages du site » | Pages (déjà existant) ; lien dans « Réglages liés » |
| « À venir pour ce site » | Supprimé (texte d'attente, aucune fonction) |

Les anciennes ancres (`/reglages#entete`, `#parties`, `#design`) n'existent plus : tous les liens internes (éditeur de composants, Personnaliser, éditeur de pages, listes centrales) pointent vers les nouvelles adresses.

**Règle de priorité (Général / Personnaliser / Styles)** : une valeur n'a qu'**une** source (tableau ci-dessus). Général, Personnaliser et la fiche SEO lisent et écrivent la même valeur ; le dernier enregistrement l'emporte et chaque écran relit la valeur réelle. Général n'enregistre jamais de brouillon : il écrit directement (avec confirmation pour les réglages sensibles) ; Personnaliser et Styles gardent leur brouillon / publication pour les réglages visuels.

## 3. API et fichiers

- `PUT /marketing/site-web/parametres/api/general[?site=<id>]` — `{ values: { clé: valeur }, confirm? }` : un seul enregistrement tout ou rien ; réponse : `{ ok, changed, values }` (valeurs réellement enregistrées) · `409 { confirmRequired }` (sensible, avec l'impact) · `422 { errors }` · `403` (droit, site). Les clés étrangères à l'écran sont refusées.
- `GET /site-web/parametres` (principal ou `?site=`) et `GET /site-web/sites/<id>/reglages` — l'écran ; `…/reglages/en-tete`, `…/pied-de-page`, `…/design-system` — écrans déplacés.
- Code : `src/marketing/web/generalSettings.js`, `views/marketing/settings-general.ejs`, `public/js/cms-general.js`, CSS `.mk-sg-*` ; `views/marketing/site-header.ejs`, `site-footer.ejs`, `site-design.ejs` (anciennes sections de `site.ejs`).
- Moteur : nouveaux réglages `week_start`, `registration_open`, `site_slug`, `site_type`, `site_note` ; type `slug` ; formats de date étendus (`src/utils/format.js` : `iso`, `dmy`, `mdy`, `dots`, calculés dans le fuseau du site). Réglages d'un site : `identity`, `general.weekStart` (`src/marketing/pages/siteSettings.js`).
- Effets : `src/routes/auth.js` (inscriptions fermées : 403 sur la page **et** sur l'envoi), `src/editor/blog/datePicker.js` + `src/routes/blog.js` (premier jour de la semaine du calendrier de publication), `public/js/blog-editor.js` reconstruit.
- **Aucune migration** : tout vit dans les colonnes et tables existantes (`mk_sites.settings` JSON, `mk_settings`).

## 4. Registre

| # | Fonctionnalité | Statut | Preuve |
|---|---|---|---|
| G1 | Page en sections, valeurs réelles, principal et site | Testée · Vérifiée visuellement | `parametres-general` « l'écran » ; navigateur « l'écran s'ouvre » |
| G2 | Nom, slogan, note interne : validation, enregistrement, rechargement | Testée · Vérifiée visuellement | « enregistrement unique » ; navigateur « modifier puis enregistrer » |
| G3 | Icône et logo : sélecteur, aperçu, retrait, validation, **favicon public** | Testée · Vérifiée visuellement | « effet réel sur le site public » ; navigateur « icône du site » |
| G4 | Identifiant, domaine, page d'accueil (sensibles : confirmation, unicité, isolation) | Testée · Vérifiée visuellement | « réglages sensibles » ; navigateur « domaine personnalisé » |
| G5 | Adresse publique / administration (informatives, jamais de secret) | Testée | « l'écran » |
| G6 | Inscriptions publiques : effet réel sur `/inscription` (page + envoi), rôle fixé par le serveur | Testée | « inscriptions publiques » |
| G7 | Langue, fuseau IANA, heure locale en direct, heure d'été | Testée · Vérifiée visuellement | « formats de date et fuseaux » ; navigateur « aperçus en direct » |
| G8 | Formats de date (7) et d'heure (2), appliqués à l'affichage sans toucher aux dates UTC | Testée | « formats de date » ; « effet réel : le format et le fuseau » |
| G9 | Premier jour de la semaine : calendrier de publication de l'éditeur d'articles | Testée · Vérifiée visuellement | navigateur « effet réel : le premier jour… » |
| G10 | Enregistrement tout ou rien, état, erreurs, réseau, double clic, sortie protégée | Testée · Vérifiée visuellement | « validation côté serveur », « double envoi » ; navigateur (erreurs, réseau, double clic, protection) |
| G11 | Droits (lecture seule, sensible) et isolation entre sites | Testée · Vérifiée visuellement | « droits et isolation » ; navigateur « lecture seule » |
| G12 | Écrans déplacés (en-tête, pied de page, design system) et anciens liens | Testée | « écrans déplacés » ; `site-web-entete(-navigateur)` mis à jour |
| G13 | Téléphone (390 px), clavier, aucune erreur JavaScript | Vérifiée visuellement | navigateur « téléphone » |

## 5. Limites connues (non faites, pas simulées)

- **Pas de langue d'administration distincte** : l'interface du CMS est en français ; l'écran le dit. Aucun second système de traduction n'a été inventé.
- **Pas de format de date « personnalisé »** (motif libre) : le moteur sait appliquer 7 formats validés ; un motif libre n'aurait pas pu être validé ni appliqué partout.
- **Premier jour de la semaine** : appliqué au calendrier de publication de l'éditeur d'articles (le seul calendrier de l'application) ; les sélecteurs de date natifs du navigateur (`<input type="date">`) suivent la langue du navigateur et ne peuvent pas être pilotés.
- Le calendrier de l'éditeur d'articles affiche toujours l'heure du **navigateur** (il n'applique pas le fuseau du site) : l'écran Général règle l'affichage des dates publiques et du CMS, pas ce champ de saisie.
- **Rôle par défaut des nouveaux comptes** : non éditable (voir l'audit) ; **inscriptions par site** : n'existent pas (l'inscription est une fonction de la plateforme).
- **URL de base** du site principal : `SITE_URL` (hébergement), jamais modifiable depuis le CMS ; un site peut recevoir un domaine personnalisé (sensible, validé, unique).
- Le bouton « Restaurer les valeurs par défaut du groupe » de l'ancien formulaire n'est pas repris dans Général (le nom du site est obligatoire : sa « valeur par défaut » vide était refusée). La route `/parametres/reinitialiser` et le formulaire des autres groupes restent inchangés.
- Dans le menu latéral d'un site, « Lecture », « Commentaires » et « Médias » (sous Paramètres) restent « Bientôt » : hors périmètre de cette mission.
- Échecs de tests déjà présents sur `main` avant cette mission (non causés par elle) : `marketing-r0-coque`, `portee-des-routes` « mêmes résultats… », `seo-import-migrations`, `cms-appearance`, D3 (index des clés étrangères du personnalisateur), ombre noire de `kola-pages.css`.

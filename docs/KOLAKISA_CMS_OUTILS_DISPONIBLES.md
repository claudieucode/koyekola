# KOLAKISA CMS — Outils → Outils disponibles (mission OUTILS-DISPO-01)

Branche `outils-disponibles-01`, issue de `origin/main`. Référence : l'écran « Outils » de WordPress (carte « Convertisseur de catégories et étiquettes »). Ce document décrit l'état **réel**.

## 1. Audit initial

| Élément | Constat |
|---|---|
| Page « Outils disponibles » | **N'existait pas.** La racine `Outils` (`/site-web/outils`) est « Santé du site ». |
| Registre central des outils | **N'existait pas** : seulement le registre de navigation (`cmsNav.js`, entrées du menu) et la liste d'onglets de `tools.js`. |
| Outils présents | Importer, Exporter, Exporter les données, Sauvegarde du site, Santé du site, Diagnostic, Informations système, Maintenance, Caches, Outils de contenu, Sauvegardes, Journal d'activité, Corbeille, Effacer les données, Admin Notes. |
| Convertisseur catégories ↔ étiquettes | **N'existe pas** (documenté dans `KOLAKISA_CMS_ETIQUETTES.md` : « aucun lien factice »). |
| Exporter les données personnelles (côté administration) | Livré par une autre session pendant cette mission (`/outils/donnees`) : référencé comme outil réel. |
| Outils fournis par des extensions | Aucun aujourd'hui. Les « extensions » de Kolakisa sont les modules par site (`siteModules`) ; le registre sait les accueillir. |

## 2. Fonctionnement du registre (`src/services/toolsCatalog.js`)

- `register({ id, name, description, category, icon, permission, scope, module, state, source, order, navKey | href })` ; `unregister(id)` ; `catalog(ctx)`.
- **Aucune adresse écrite deux fois** : pour un outil du cœur, `navKey` renvoie à l'entrée de navigation (`cmsNav`), qui reste la source de l'adresse, du libellé, de la permission et du cadre de site. Une extension fournit un `href` (`/marketing/…`).
- Validation à l'enregistrement : identifiant unique (un doublon est refusé), catégorie connue, permission obligatoire, adresse `/marketing/…` seulement, module connu. Une entrée mal formée est refusée avec la raison.
- Disponibilité calculée **à chaque requête** pour (utilisateur, site) :
  - permission côté serveur (aucune permission ⇒ la carte n'existe pas) ;
  - portée : une fonction « centrale » (Sauvegardes, Informations système, Journal d'activité) n'apparaît jamais dans un site ni pour un accès limité à un site ;
  - module requis : activé sur CE site (le site principal n'est pas soumis à l'activation) ; sinon carte en état « Extension … désactivée sur ce site », sans lien, avec « Gérer les modules du site » seulement pour qui a le droit `sites.modules` ;
  - état `planned` : « Pas encore disponible », sans lien ni bouton.
- Une entrée qui échoue (lecture impossible…) est écartée et consignée ; les autres cartes s'affichent.
- La carte n'accorde aucun droit : chaque destination contrôle ses propres permissions (vérifié par test).

## 3. Écran

`/marketing/site-web/outils/disponibles[?site=<id>]` (et `/sites/<id>/outils/disponibles` dans le cadre d'un site) : grille responsive de cartes (icône, titre, description, « Ouvrir »), regroupées par catégorie (Importation et exportation, Diagnostic et maintenance, Confidentialité, Administration, Extensions — une catégorie vide n'est pas affichée), section « Pas encore disponibles », état vide « Aucun outil n'est actuellement disponible pour votre compte ». Entrée « Outils disponibles » ajoutée en tête du groupe Outils du menu (et onglet).

Fichiers : `src/services/toolsCatalog.js`, `src/marketing/web/tools.js`, `src/marketing/web/cmsNav.js`, `views/marketing/tools-available.ejs`, `public/css/cms.css` (`.mk-tc-*`), tests `outils-disponibles(.|-navigateur.)test.js`. Aucune migration.

## 4. Limites

- Convertisseur de catégories et d'étiquettes : **non développé** ; affiché « Pas encore disponible », sans action.
- Aucun outil d'extension n'est enregistré aujourd'hui (le mécanisme est testé avec une entrée de test).
- Le menu latéral n'est pas généré à partir du registre : l'entrée « Outils disponibles » y a été ajoutée à la main ; le registre s'appuie sur la navigation, pas l'inverse.

# Entête — architecture

## Où vit la rubrique
La rubrique **Entête** est un panneau du personnalisateur existant (« Apparence → Personnaliser », `src/services/customizer.js`, `public/js/customizer.js`). Il n'existe pas de second personnalisateur. La rubrique « Global » mentionnée dans la demande n'existe pas dans ce dépôt : l'Entête a donc été intégrée au seul personnalisateur présent, sans toucher aux autres panneaux.

## Une table, trois usages
`src/marketing/pages/headerSettings.js` décrit chaque réglage une seule fois (clé, type, défaut, bornes, onglet, groupe, libellé, aide) :
1. **validation** — `normalize(…, { strict })` dans `siteSettings.normalizeSettings` (clé `settings.header`) : toute valeur invalide est refusée avec un message clair à l'enregistrement ;
2. **interface** — `catalog()` alimente les contrôles du panneau (`settings.header.<clé>`), générés à l'identique : aucun réglage sans contrôle, aucun contrôle sans réglage (testé) ;
3. **rendu** — `headerStyle.headerCss(…)` traduit les réglages en CSS ; `_autohead.ejs` produit le balisage.

## Flux de données
```
Contrôle (interface) → set() → POST /rendu (validation serveur, brouillon en session)
  → l'aperçu (iframe ?kwcustom=1) rend la VRAIE page avec les réglages superposés en mémoire
  → « Enregistrer le brouillon » (cms_customizer_drafts) → « Publier » (mk_sites.settings.header, version, historique)
  → page publiée : siteAssets() ajoute headerCssOf(settings) au CSS du thème ; landing.ejs inclut _autohead.ejs
```
Brouillon, publication, historique, annulation/rétablissement, versions et isolation par site sont ceux du personnalisateur (par site : `site_id`). Les réglages d'un site ne sont jamais lus par un autre.

## Rendu
- **Entête automatique** (`views/marketing-public/_autohead.ejs`) : marque (logo, titre, slogan), menu principal (`_autonav`), menu hors-champ (panneau + bouton + voile). Il s'affiche si le site a un menu « En-tête du site », ou si « Afficher l'entête automatique » est activé, et jamais quand la page a déjà son composant d'en-tête (Theme Builder) — pas de doublon.
- **Composant d'en-tête du Theme Builder** (`.lp-site-header`) : reçoit largeur, marges, transparence, couleurs/police/espacements du menu ; pas le logo ni le menu hors-champ.
- **Script** `public/js/kw-header.js` : ouverture/fermeture, Échap, clic extérieur, focus piégé, défilement verrouillé, sous-menus au clavier/tactile, lien actif (`aria-current`).
- Un site qui n'a jamais ouvert « Entête » garde EXACTEMENT son rendu : aucun CSS n'est émis tant qu'un réglage n'est pas renseigné (testé).

## Par appareil
Voir `RESPONSIVE_HEADER_SPECIFICATION.md`.

## Moteur de composition (état)
Le modèle représente une rangée principale et trois éléments (identité, menu principal, menu hors-champ), chacun avec un identifiant stable, une visibilité par appareil et ses réglages de style. Prévu mais **non livré** (aucun élément équivalent n'existe encore dans le moteur du site) : rangées « au-dessus » et « sous l'entête », réorganisation par glisser-déposer, éléments recherche, bouton, HTML, widgets, réseaux sociaux, compte, panier. Les ajouter demande un élément de rendu dédié dans `_autohead.ejs` et ses lignes dans la table.

## Sécurité
- Texte : balises et caractères de contrôle retirés, longueurs bornées ; échappé par EJS au rendu.
- Couleurs : `#rrggbb` ou `token:nom` uniquement ; adresses d'image : `/uploads/…` ou `https://…` (mêmes règles que le reste du site) et appartenance à la médiathèque du site vérifiée par le personnalisateur.
- Logo « SVG / masque » : le fichier n'est jamais inséré dans la page (pas de SVG en ligne) : il sert de masque CSS, donc aucun script SVG ne peut s'exécuter.
- Droits : `appearance.styles` (brouillon), `appearance.publish` (publication), accès limité à son site.
- Accessibilité : panneau `role="dialog"` + `aria-modal`, déclencheur `aria-expanded`/`aria-controls`, focus piégé puis rendu, zones cliquables ≥ 44 px, `prefers-reduced-motion` respecté.

## Pas de fonctionnalités « Pro »
Les encarts « Mettre à niveau » d'Astra ne sont pas reproduits : toutes les fonctionnalités livrées sont disponibles sans verrou.

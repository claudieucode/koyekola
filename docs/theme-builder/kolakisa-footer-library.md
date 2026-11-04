# Bibliothèque de pieds de page du Theme Builder

État au 3 novembre 2026. Code : `src/themeBuilder/catalog/footer.js` (+ `kit.js`, `index.js`, `use.js`). Tests : `tests/theme-builder-pieds-bibliotheque.test.js`. Contrôle visuel : `scripts/audit-pieds.js`.
Liste des modèles : `kolakisa-footer-library-modeles.md`. Référence Elementor : `elementor-footer-reference.md`. Audit initial : `kolakisa-footer-audit.md`. Rapport visuel : `kolakisa-footer-library-verification.md`.

## 1. Périmètre

La catégorie **Pied de page** du Theme Builder propose **100 compositions distinctes** (10 familles × 10). Chaque modèle fixe sa propre identité visuelle ; l'identité est un jeu de couleurs, de typographie, de bordures et d'arrondis tiré du site (jetons `token:…`) :
20 modèles par identité (clair épuré, couleur de marque, nuit, éditorial, doux et arrondi). Ce n'est **pas** un croisement mise en page × couleur : deux modèles de même identité ont toujours des structures différentes, et le test refuse toute paire de même structure.

| Famille | Contenu |
|---|---|
| Minimal et compact | une rangée : copyright, menu, logo, réseaux, légal |
| Multi-colonnes | 2 à 5 colonnes : marque, menus affectés, catégories, articles, coordonnées, cartes |
| Newsletter et abonnement | formulaire d'inscription réel du site, en carte, bandeau, colonne ou ligne |
| Coordonnées et carte | liste d'icônes de coordonnées, horaires, carte, rendez-vous |
| Réseaux sociaux et légal | réseaux en pastilles rondes, carrées, simples ou grandes ; liens légaux |
| Boutique et e-commerce | compte, mini-panier, recherche du catalogue, formations, aide |
| Éditorial et magazine | double filet, date du jour, listes d'articles récents / populaires, rubriques |
| Entreprise et SaaS | bandeau d'appel à l'action, produit / ressources, essai, connexion / inscription |
| Créatif et portfolio | grande marque, cartes, cadre contour, accordéons, invitation, pile à gauche |
| Centré et navigation horizontale | logo centré, menu horizontal, trois zones, mentions centrées |

## 2. Architecture

```
catalog/footer.js   100 modèles, grammaire de rangées, éléments, familles
catalog/kit.js      identités (SKINS) + fabrique de nœuds natifs du Page Builder (k.row, k.col, k.band, k.inner, k.W…)
catalog/index.js    catalogue « plat » : entries / list / find / build (cache borné) / thumbDoc
catalog/use.js      « Utiliser ce modèle » : copie indépendante (composant + modèle brouillon)
web/themeBuilder.js routes …/api/bibliotheque/(liste | footer/:key/(apercu|vignette|miniature) | utiliser)
web/themeRender.js  previewDoc : rend le document du catalogue avec le vrai moteur
```

**Une seule source de données** : l'aperçu, la vignette, la miniature et « Utiliser » appellent tous `Catalog.build("footer", key, env)`. La copie du site est un composant indépendant (modifier la copie ne change jamais le catalogue ; supprimer le catalogue ne change jamais une copie).

## 3. Grammaire des rangées

Un modèle = `[famille, clé, nom, étiquettes, description, rangées]`. Les rangées sont empilées dans **un** conteneur pleine largeur (`container full`, sans espace entre rangées). Quatre types :

| Constructeur | Rôle |
|---|---|
| `C([[poids, …codes], …], opts)` | colonnes Flexbox : `flexBasis 0`, `flexGrow = poids`, `minWidth 200 px` (160 px à partir de 5 colonnes) ; elles passent à la ligne |
| `L(gauche, droite, opts)` | une ligne à deux zones, `space-between` |
| `T(gauche, centre, droite, opts)` | trois zones de poids égal : le centre est réellement centré |
| `Z([codes], opts)` | pile centrée (colonne, `alignItems center`) |

Options de rangée : `bg` (`alt`, `accent`, `ink` : identité locale lisible), `pad` (`xs`, `sm`, `md`, `lg`, `xl`), `rule` (`none`, `thin`, `accent`, `thick`, `double` : filet **au-dessus** de la rangée), `cards` (chaque colonne dans une carte), `frame` (cadre contour), `center` (colonnes centrées), `max` (largeur de colonne).

### Éléments (« nom:argument|libellé|adresse »)

| Code | Widget natif | Remarque |
|---|---|---|
| `logo:N`, `title:N` | `sitelogo`, `sitetitle` | taille en px |
| `about`, `text\|…`, `head\|…`, `H\|titre\|niveau` | `text`, `heading` | textes à modifier (jamais de faux slogan chiffré) |
| `menu`, `hmenu` | `menu` vertical | menu **affecté** à « Pied de page » / « En-tête » |
| `menuh`, `menuh:caps`, `hmenuh` | `menu` horizontal | **sans** bouton « hamburger » : les liens passent à la ligne |
| `links\|libellé>/adresse\|…` | `link` empilés | adresses locales seulement |
| `social`, `social:plain/big/sq` | `social` | Facebook, LinkedIn, Instagram, YouTube : adresses génériques à remplacer |
| `copy`, `copy:c` | `copyright` | année courante + nom du site |
| `legal`, `legal:3` | `link` | Cookies, Contact (+ FAQ) |
| `news\|titre\|texte` | `signupform` | **formulaire d'inscription réel** du site ; sinon titre, texte et bouton « Nous contacter » |
| `cta`, `cta2` | `button` | principal / contour |
| `contact`, `contact:inline` | `iconlist` | e-mail, téléphone, adresse : **textes à remplacer**, icônes de la couleur d'accent |
| `hours` | `text` | horaires à renseigner |
| `map`, `map:wide` | `map` | adresse neutre « France » (voir limites) |
| `cats`, `recent:N`, `popular:N`, `courses:N` | `querylist`, `courselist` | listes **dynamiques** : les vrais contenus du site |
| `search`, `account`, `cart` | `search`, `account`, `minicart` | |
| `toggle\|titre\|texte` | `toggle` | accordéon |
| `date`, `badge\|…`, `div` | `dyntext`, `text`, `divider` | la date est masquée sur mobile |

Un code inconnu lève une erreur au chargement (`Pied de page : élément inconnu`) : un modèle ne peut pas se construire à moitié.

## 4. Schéma de données

Le catalogue ne stocke rien. `Catalog.entries("footer")` → `{ key, type, layoutKey (famille), layoutId, skinKey, name, layoutLabel, skinLabel, desc, tags }`.
`Catalog.build("footer", key, { formId })` → `{ name, kind: "component", section: { type: "layout", children: [conteneur pleine largeur → bandes → zone centrée → colonnes → widgets] } }`, chaque nœud avec `id` unique, `props`, `styles.{desktop,tablet,mobile}`.
« Utiliser » écrit : un composant (`mk_web_components`) + une ligne `mk_tb_templates` (`type footer`, `status draft`, `source_kind component`). Aucune migration.

## 5. Règles de rendu

* Largeur : le rendu hors Page Builder (`themeRender.renderVm`) et le Page Builder (`_sections.ejs`, `lp-part-bleed`) sortent les bandes de la colonne ; la zone de contenu est centrée (1180 px max).
* Pas de position absolue ni fixe ; pas d'ombre sous un pied (`boxShadow: none` sur chaque bande).
* Le filet d'une rangée est un `border-top` : la première rangée prend le filet de l'identité (aucun, simple ou double), les suivantes aucun sauf demande.
* Menus : lus dans le moteur de navigation à l'affichage ; sans menu affecté, **rien** (sauf dans la bibliothèque, où `demoMenu` affiche un menu d'exemple pour montrer la mise en page).
* Formulaire : `siteFormId` choisit le premier formulaire du site ; la bibliothèque et « Utiliser » utilisent la même valeur → aperçu = copie.

## 6. Comportements responsive

* Colonnes : retour à la ligne natif (Flexbox) ; chaque colonne garde une largeur minimale, donc une seule colonne sous ≈ 420 px.
* Lignes `L` : en pile sous 640 px (`flexDirection: column` sur le style mobile de la zone).
* Marges latérales 20 px (tablette) / 16 px (mobile) ; bandes `lg` / `xl` réduites à 32 px de remplissage vertical sur mobile.
* Éléments masqués : seulement la date (`hideOn: ["mobile"]`). Liens, réseaux, mentions et formulaire restent visibles.
* Vérifié par `scripts/audit-pieds.js` : 100 modèles × 3 largeurs (1280, 820, 390 px) — débordement, chevauchement, éléments hors écran, contraste.

## 6 bis. Règles d'affichage, sauvegarde, publication

Inchangées : conditions du Theme Builder (inclure / exclure, le plus précis gagne, **un seul pied par page**) ; brouillon → publication ; remplacement explicite si deux pieds ont les mêmes conditions ; export / import JSON ; archivage. Un pied publié remplace l'ancien réglage du site (jamais deux pieds).

## 7. Différences avec Elementor

Voir `elementor-footer-reference.md` §6. En bref : colonnes Flexbox à largeur minimale au lieu de largeurs en % + Wrap ; menu affecté au lieu d'un menu libre ; formulaire réel du site ; pas de réglage « HTML Tag » (le pied est un `div.kw-theme-footer`) ; pas de contrôle décoratif.

## 8. Procédures de test

```
node --test tests/theme-builder-pieds-bibliotheque.test.js        # 100 modèles, distinction, grammaire, rendu, publication, un seul pied
node --test tests/theme-builder-pied-unique.test.js tests/theme-builder-pied-de-page-coherence.test.js tests/widgets-theme-builder-unicite.test.js
NODE_PATH=<…/node_modules> TEST_START_TIMEOUT_MS=900000 node scripts/audit-pieds.js <dossier> [clés ou familles]   # contrôle visuel Chrome
```

## 9. Limites connues

* **Carte** : le catalogue ne connaît pas l'adresse du site ; les modèles « carte » affichent la France entière (adresse « France », zoom 5). À remplacer dans l'éditeur (widget Google Maps → Adresse). Aucune adresse n'est inventée.
* **Coordonnées, horaires, présentation** : textes d'exemple explicites (« Votre adresse e-mail »…). Le catalogue n'invente aucun numéro ni adresse.
* **Réseaux** : adresses génériques des sites des réseaux (facebook.com, linkedin.com…) — à remplacer par les comptes du site.
* **Étiquette HTML** : pas de réglage « footer » ; le pied est un `div` (identique à l'en-tête).
* **Abonnement** : sans formulaire d'inscription dans le site, le modèle affiche un bouton vers la page de contact ; il se lie au formulaire dès que « Utiliser » est lancé sur un site qui en a un.
* **Effets** (animations d'apparition, pied « révélé » au défilement) : non reproduits.

## 10. Ajouter ou modifier un modèle

1. Choisir la famille dans `footer.js` (`fam("<famille>", [...])`) et ajouter `["identifiant-unique", "Nom unique", ["étiquettes"], "Description", [rangées]]`.
   L'identifiant ne doit **jamais** reprendre un identifiant de l'ancien catalogue (`OLD_LAYOUTS` dans le test).
2. L'identité vient de la position dans la famille (`SKIN_ORDER[(i + f) % 5]`) : garder **10 modèles par famille** pour conserver 20 par identité.
3. Composer les rangées avec `C/L/T/Z` et les codes ci-dessus. Besoin d'un nouvel élément : l'ajouter dans `item()` **avec un widget natif existant** (nodes.js) — jamais de HTML libre.
4. `node --test tests/theme-builder-pieds-bibliotheque.test.js` puis `scripts/audit-pieds.js <dossier> <clé>` ; relire la capture aux trois largeurs.
5. Mettre à jour la liste (`kolakisa-footer-library-modeles.md`, générée) et le décompte des tests.

## 11. Décisions techniques

| Décision | Raison |
|---|---|
| Catalogue « plat » (une composition = un modèle) | Le croisement 20 × 5 ne donnait que 20 structures ; le test de distinction l'interdit désormais |
| Grammaire à quatre types de rangée | Garantit des alignements cohérents (mêmes marges, mêmes largeurs, même zone centrée) sans CSS libre |
| Colonnes `flexBasis 0` + `minWidth` | Même principe que « Wrap + largeur 100 % » du tutoriel Elementor, sans règle de point de rupture |
| Menus affectés, jamais recopiés | Une seule source de vérité de navigation ; le modèle suit les menus du site |
| Carte « France » plutôt qu'une adresse inventée | Le widget exige une adresse ; un faux lieu serait un contenu factice |
| Pas de « hamburger » dans un pied | Les liens d'un pied doivent rester visibles ; ils passent à la ligne |
| Bibliothèque lue par code, pas par données | Aucune migration, aucune suppression destructive, copies de sites intactes |

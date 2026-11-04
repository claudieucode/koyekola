# Référence Elementor — partie de site « Pied de page » (Footer)

Document établi **avant** la reconstruction de la catégorie Pied de page du Theme Builder de Kolakisa (3 novembre 2026). Il complète `elementor-header-reference.md`,
`ELEMENTOR_SITE_PARTS.md`, `ELEMENTOR_DISPLAY_CONDITIONS.md` et `ELEMENTOR_TEMPLATE_LIFECYCLE.md` (même dossier).

Légende : **[C]** confirmé par le corps d'un article officiel lu pour ce document · **[O]** observé dans l'interface réelle · **[N]** non vérifiable ici · **[K]** choix propre à Kolakisa.

> Aucune interface Elementor réelle n'a pu être ouverte : **aucun point n'est marqué [O]**. Les articles officiels ont été lus par l'API publique du centre d'aide
> (`elementor.com/help/wp-json/wp/v2/posts/<id>`), parce que les pages HTML ne renvoient que le menu de navigation à un lecteur automatique.
> Ce qui n'y figure pas est marqué [N], jamais supposé.

## 1. Sources lues (corps d'article complet)

| Article | Identifiant | Dernière modification | Adresse |
|---|---|---|---|
| Create or modify your footer | 3766 | 27 janvier 2026 | https://elementor.com/help/footer-site-part/ |
| Create a footer using a Flexbox container | 29183 | 14 mai 2026 | https://elementor.com/help/creating-a-footer-template-with-the-container/ |
| Customize your Hello Biz Footer | 54633 | 18 août 2026 | https://elementor.com/help/customize-your-hello-biz-footer/ |
| How to fix a missing header or footer in Elementor? | 163845 | 23 février 2026 | https://elementor.com/help/how-to-fix-a-missing-header-or-footer-in-elementor/ |

Les pages de widgets (Social Icons, Site Logo, Nav Menu, Form, Menu Cart) n'ont pas été retrouvées par la recherche du centre d'aide : leurs contrôles ne sont **pas** documentés ici (voir `elementor-header-reference.md` pour Nav Menu).

## 2. Cycle de vie d'un pied de page

* **[C]** Un pied de page apparaît « en bas de la plupart des pages » ; en général **un seul pied standard pour tout le site**, certaines pages pouvant n'en avoir aucun ou un spécifique.
* **[C]** Création : Elementor › Theme Builder › carte « Footer » › « + » ; la bibliothèque de modèles s'ouvre ; on peut choisir un pied prêt à l'emploi ou la fermer et partir de zéro. « Publish » enregistre puis **demande les pages d'affichage** (conditions).
* **[C]** Modification : clic sur la carte › « Edit » (contenu) ou « Edit Conditions » (pages d'affichage).
* **[C]** Accessibilité : réglage « Footer Settings » › « HTML Tag » = `footer`, qui identifie le pied aux lecteurs d'écran.
* **[C]** Export : menu « trois points » de la carte › Export (fichier `.json`). Corbeille : menu › Trash, avec confirmation. Renommer : menu › Rename.
* **[C]** Dépannage « pied absent » : conditions mal posées (« Entire Site » pour un pied global), mise en page de page « Canvas » (masque volontairement en-tête et pied), modèle non publié (bouton rose « Publish » = brouillon ; « Update » ou grisé = publié), éléments masqués par les options responsive, cache à vider.
* **[C]** Pastille de conditions et masquage « Hide on Desktop / Tablet / Mobile » : cités par l'article de dépannage.

## 3. Construction d'un pied avec des conteneurs Flexbox [C]

Tutoriel officiel (article 29183), à retenir comme standard de structure :

1. **Conteneur parent** pleine largeur, hauteur minimale (exemple : 40 vh), couleur de fond (couleur globale du site), remplissage (exemple : 3 %).
2. **Conteneurs enfants = colonnes** : exemple 60 % (direction ligne) et 40 % (direction colonne). Le nombre d'éléments imbriqués doit rester minimal pour la performance.
3. **Contenu d'une colonne** : widgets « Text Editor » (un titre H3 puis des liens, dupliqués une fois par groupe de liens) ; « Site Logo » (aligné à gauche, l'image doit être définie dans l'identité du site) ; texte de mission ; « Search » **ou « Form »** (« la recherche peut devenir un formulaire d'abonnement ») ; un « Heading » en balise `p` qui invite à suivre les réseaux ; « Social Icons » alignés à gauche (taille exemple : 16 px).
4. **Conteneur de copyright** distinct, pleine largeur, éléments centrés, remplissage (exemple : 1 %) : un « Heading » en `p` alimenté par l'étiquette dynamique **« Current Date and Time »** (date personnalisée « Y » = l'année), avec « © » avant et le texte après. Sans Elementor Pro : texte saisi à la main.
5. **Responsive** : option **Wrap** sur le parent ; **largeur 100 %** dans chaque enfant pour empiler les colonnes sur tablette et mobile ; l'ordre des conteneurs peut être changé (onglet Avancé).

## 4. Composition d'un pied « type » (thème Hello Biz) [C]

Le thème propose trois groupes : **Brand** (logo du site *ou* nom du site, description, icônes de réseaux avec une adresse par réseau, mention de copyright), **Navigation** (liens rapides vers les pages principales), **Contact** (adresse, téléphone, e-mail). Un pied contient « généralement le logo, des liens de navigation et un bouton d'appel à l'action ». Contrôles de style : typographie par groupe (taille, graisse…).

## 5. Ce qui n'a PAS pu être confirmé

* **[N]** Contrôles détaillés des widgets Social Icons, Site Logo, Form, Menu Cart (pages d'aide non retrouvées).
* **[N]** Modèles de pieds de la bibliothèque propriétaire d'Elementor : ils ne sont ni consultables ici ni reproductibles ; **aucune ressource Elementor n'est reprise**.
* **[N]** Points de rupture exacts de l'éditeur : l'article parle de « tablette et mobile » sans valeurs.
* **[N]** Comportement d'un pied « collant » : non décrit par les articles de pied (le cas d'usage Elementor est l'en-tête).

## 6. Différences et choix Kolakisa

| Sujet | Elementor | Kolakisa |
|---|---|---|
| Structure | Conteneur parent + conteneurs enfants (Flexbox), largeur % | **[K]** Bandes pleine largeur (`container full`) + zone centrée (`inner`) + colonnes `stack` en Flexbox (`flexBasis` + `flexGrow` + `minWidth`) ; retour à la ligne natif, aucune position absolue |
| Colonnes responsive | Wrap + largeur 100 % en tablette/mobile | **[K]** Chaque colonne a une largeur minimale (≈ 200 px) : elle passe à la ligne et occupe la largeur disponible ; aucune règle de point de rupture à écrire |
| Navigation | Texte libre ou widget Nav Menu | **[K]** Menu **affecté à l'emplacement « Pied de page »** (Apparence › Menus) ; « Explorer » = menu de l'emplacement « En-tête ». Aucun lien de navigation inventé |
| Copyright | Étiquette dynamique « date » + texte | **[K]** Widget natif `copyright` (année courante + nom du site, texte modifiable) |
| Abonnement | Widget Form | **[K]** Widget `signupform` lié à un **formulaire d'inscription réel** du site ; sans formulaire : titre, texte et bouton vers la page de contact (jamais de faux champ) |
| Carte | Widget Google Maps | **[K]** Widget `map` par adresse ; le catalogue ne connaît pas l'adresse du site : valeur neutre « France » à remplacer (voir limites) |
| Étiquette HTML | Réglage « HTML Tag = footer » | **[K]** `<div class="kw-theme-part kw-theme-footer">` ; l'élément `footer` n'est pas posé par le modèle (limite connue, identique à l'en-tête) |
| Visibilité | Hide on Desktop / Tablet / Mobile | **[K]** `hideOn: ["tablet" \| "mobile"]` par élément |
| Conditions | Edit Conditions › Entire Site… | **[K]** Conditions du Theme Builder (inclure / exclure, le plus précis gagne) ; **un seul pied rendu par page** |
| Corbeille / export / renommer | Menu de la carte | **[K]** Archiver, export / import JSON, renommer : déjà présents dans le Theme Builder |
| Bibliothèque | Modèles propriétaires | **[K]** Catalogue en code (`catalog/footer.js`), 100 compositions ; copie indépendante à l'utilisation |

## 7. Ce que cela impose à la bibliothèque

1. Un modèle de pied ne contient que ce que Kolakisa sait afficher : logo, titre du site, présentation, menus affectés, listes dynamiques (catégories, articles, formations), recherche, compte, mini-panier, formulaire d'inscription réel, réseaux, coordonnées, carte, boutons, liens légaux, copyright.
2. Les colonnes se construisent en **Flexbox avec retour à la ligne** (le tutoriel Elementor fait de même avec Wrap + 100 %).
3. Le **copyright est dans une rangée distincte**, pleine largeur (structure du tutoriel).
4. Le pied « type » a trois groupes (marque, navigation, contact) : les familles de la bibliothèque les combinent, et en retirent ou en ajoutent.
5. Les fonctions Elementor non reproduites ne sont **pas affichées** dans l'interface : pas de contrôle décoratif.

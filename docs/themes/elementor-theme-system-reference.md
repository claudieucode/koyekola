# Elementor — système de thèmes : documentation de référence pour la refonte de la bibliothèque de thèmes Kolakisa

Date de rédaction et de consultation des sources : **2026-11-03**.
Public : l'équipe Kolakisa qui refond la bibliothèque de thèmes (`Apparence → Thèmes`, Theme Builder, Page Builder).
Ce document décrit des **fonctionnalités** ; il ne reproduit ni code, ni ressources, ni textes d'Elementor (citations limitées à quelques mots).

## 0. Lecture du document

### 0.1 Étiquettes de fiabilité (obligatoires sur chaque affirmation)

| Étiquette | Sens |
|---|---|
| **[Confirmé]** | Affirmation lue dans une source officielle Elementor ouverte pendant cette mission ; l'URL est donnée (numéros `S1`…`S33` de la section « Sources consultées »). |
| **[Observé]** | Comportement vu dans une démo ou une interface réelle. **Aucune interface Elementor n'a été ouverte pendant cette mission** : cette étiquette n'est donc utilisée que pour reprendre des observations déjà consignées dans le dépôt (cité) ou, côté Kolakisa, des constats faits dans le code. |
| **[Non vérifiable]** | Non confirmé par une source officielle lue, ou dépendant d'une version Pro / payante non testable, ou issu de ma connaissance générale. |
| **[Adaptation Kolakisa]** | Décision ou proposition propre à Kolakisa (pas une affirmation sur Elementor). |

### 0.2 Méthode et honnêteté sur les sources

- Les pages `elementor.com/help/...` sont très tronquées par l'outil de lecture de pages (le corps de l'article est noyé sous le menu de navigation). Pour obtenir le **texte réel** des articles, j'ai donc lu le **flux JSON public du centre d'aide** (`elementor.com/help/wp-json/wp/v2/...`), qui renvoie le corps de chaque article avec sa date de dernière modification. L'URL citée est toujours celle de l'article public ; le texte lu vient de ce flux. Même méthode que celle déjà employée par le dépôt (`docs/ELEMENTOR_REFERENCE.md`).
- Chaque source porte une **date de modification** (champ `modified` du flux) : elle est indiquée dans la section « Sources consultées ».
- Je distingue **Elementor gratuit (« Editor »)** et **Elementor Pro**. Une page qui n'indique pas le plan est notée « plan non précisé ». La page marketing `S1` indique : *Editor Pro ajoute le Theme Builder, le Popup Builder, le code et CSS personnalisés, l'eCommerce et les notes collaboratives* **[Confirmé, S1]**. Ce que Elementor appelle « Elementor One » est une offre d'abonnement, hors sujet ici.
- Les noms de produit récents (Editor V4, éléments « atomiques », Angie, MCP) apparaissent dans les menus du centre d'aide **[Confirmé, S2]** mais **ne sont pas détaillés** ici : seuls les titres ont été vus.
- Pages **non ouvertes ou sans corps exploitable** : « Configure Site Settings » (`elementor.com/help/site-settings/`, corps absent de la lecture), « About Elementor Website kits » et « What is included in a kit » (entrées du type `elementor_library`, corps vide dans le flux), la page « Prioritize conflicting styles » (Editor V4), les pages de popups autres que `conditions-triggers-and-advanced-rules`, Loop Item / Loop Grid, la documentation de l'API des Theme Locations. Chaque point concerné est marqué **[Non vérifiable]**.

---

## A. Theme Builder

### A.1 Ce que c'est

| Point | Contenu | Étiquette |
|---|---|---|
| Définition | Le Theme Builder sert à créer des **« site parts »** (parties de site) qui s'ajoutent à la hiérarchie de pages, aux réglages de mise en page et au CSS du thème WordPress, ou les remplacent. | **[Confirmé, S3]** |
| Parties couvertes | En-tête, pied de page, **pages et articles globaux**, **archives globales**, produits et archives de produits WooCommerce. | **[Confirmé, S3]** |
| Plan | Pro : parties existantes affichées ; Gratuit : on **voit** quelles parties existeraient avec Pro. La page marketing classe le Theme Builder dans « Editor Pro ». | **[Confirmé, S3, S1]** |
| Tableau de bord | Vue d'ensemble de toutes les parties, pour s'assurer qu'aucun modèle ne manque ; vignettes générées automatiquement ; l'**image mise en avant** d'une partie remplace la vignette automatique. | **[Confirmé, S3]** |
| Voyants | Pastille **verte** = partie « en ligne » (au moins une condition d'affichage) ; pastille **grise** = brouillon (aucune condition). Étiquette **Instances** = lieux où le modèle est effectivement utilisé. | **[Confirmé, S3]** |
| Accès | Menu WordPress *Elementor > Theme Builder*, menu du logo dans l'éditeur, raccourci Cmd/Ctrl + Maj + E. | **[Confirmé, S3]** |
| Export du thème | Un thème Elementor **ne s'exporte pas en zip de thème WordPress** ; on migre via les outils d'import/export (réglages ou contenu complet). | **[Confirmé, S3]** |

### A.2 Types de modèles

| Type | Ce que dit la documentation | Plan | Étiquette |
|---|---|---|---|
| En-tête (Header) | Partie de site globale ; créée depuis le Theme Builder. Le centre d'aide propose des guides pour un en-tête collant (sticky) et responsive en Flexbox. | Plan non précisé sur les pages lues ; Theme Builder = Pro | **[Confirmé, S3]** pour l'existence ; titres seuls pour les guides sticky/Flexbox (**[Non vérifiable]** pour leur contenu) |
| Pied de page (Footer) | Idem ; guide « Create a footer using a Flexbox container » existe. | Idem | **[Confirmé, S3]** ; guide : **[Non vérifiable]** |
| Page individuelle (Single Page) | Modèle **par défaut des pages** : « crée un design par défaut pour les nouvelles pages ». On y place des widgets **dynamiques** (titre, image mise en avant…), pas du contenu en dur. | Pro (Theme Builder) | **[Confirmé, S6]** |
| Article individuel (Single Post) | Même principe pour les articles. | Pro | **[Confirmé, S3]** (liste des parties) ; détails : **[Non vérifiable]** (page dédiée non ouverte) |
| Archive | Modèle « standard » d'affichage de groupes d'articles : blog, catégorie, auteur, date, étiquette, autre taxonomie. Utilise le widget « Archive Posts ». | Pro | **[Confirmé, S7, S8]** |
| Résultats de recherche | **Cas particulier d'archive** : se gère dans le Theme Builder, onglet « Search Results ». | Pro | **[Confirmé, S9]** |
| Erreur 404 | Condition « 404 Page » existe dans la liste des conditions (le modèle de 404 est donc ciblable). | Pro | **[Confirmé, S5]** (condition) ; guide dédié : **[Non vérifiable]** |
| Loop Item | Modèle de carte répétée pour les widgets Loop Grid / Loop Carousel. Les pages « Customize items in loop », « Create a category page using the Loop Grid » existent. | Plan non précisé | Titres seuls : **[Non vérifiable]** pour le fonctionnement |
| Popup | Popup Builder « exclusivement dans Elementor Pro (plans Advanced et supérieurs) ». | Pro (Advanced+) | **[Confirmé, S16]** |
| Produit / Archive de produits (WooCommerce) | Parties de site pour la boutique ; conditions dédiées (voir A.4). | Pro | **[Confirmé, S3, S5]** |
| Éléments flottants (Floating Elements) | Existent (la condition « Floating buttons » figure dans la liste). | Plan non précisé | **[Confirmé, S5]** pour la condition ; le reste **[Non vérifiable]** |
| Barre latérale (Sidebar) | Dépend du thème : il faut que le thème **enregistre** l'emplacement via l'API Theme Locations (guide « Create a sidebar template » avec le thème Hello). | Pro | **[Confirmé, S7]** (note sur les sidebars) |

Points d'attention confirmés :

- Les modèles d'archive d'Elementor **suppriment les barres latérales du thème** par défaut ; les restaurer demande l'API Theme Locations côté thème **[Confirmé, S7]**.
- Un modèle « Single Page » ne s'applique qu'aux pages dont le réglage de modèle est **« Default Template »**. Les pages en **Canvas** ou **Full Width** ne reçoivent pas le modèle, même si les conditions correspondent **[Confirmé, S6]**.
- Remplacer **seulement** l'en-tête ou **seulement** le pied de page peut casser la page avec certains thèmes (balises ouvertes dans l'un, fermées dans l'autre) : Elementor recommande de concevoir les deux ensemble **[Confirmé, S4]**.

### A.3 Création, édition, duplication, suppression, import/export

| Action | Fonctionnement documenté | Étiquette |
|---|---|---|
| Créer | Bouton « Add New » en haut à droite, signe « + » au survol du libellé ou sur la vignette ; la **Template Library** s'ouvre : on peut insérer un bloc/une page prête, ou fermer la fenêtre pour partir de zéro. | **[Confirmé, S3, S6, S7]** |
| Créer par import | Icône d'import : on dépose un `.json` ou `.zip` ; l'import nécessite d'autoriser les envois de fichiers non filtrés. | **[Confirmé, S3]** |
| Modifier la conception | « Edit » sur la carte de la partie → ouvre l'éditeur. | **[Confirmé, S3]** |
| Modifier les conditions seules | « Edit Conditions » en bas à gauche de la carte, ou, depuis l'éditeur, flèche à côté de « Publish » → « Display Conditions ». | **[Confirmé, S3, S5]** |
| Renommer | Menu « trois points » → Rename. | **[Confirmé, S6, S7]** |
| Exporter | Menu « trois points » → Export : fichier `.json`. | **[Confirmé, S3, S6, S7]** |
| Supprimer | Trois points → Trash / Delete, avec fenêtre de confirmation. | **[Confirmé, S3, S7]** |
| Dupliquer | **Aucune action « Dupliquer » n'a été vue** dans les pages lues du Theme Builder. Une copie se fait par **Export puis Import**, ou via « Save as Template » (voir C.4). | **[Non vérifiable]** pour une fonction native de duplication |
| Brouillon / publication | Une partie sans condition est un **brouillon** (pastille grise). La fenêtre de conditions s'ouvre **au clic sur Publish**. Le Theme Style (A.9 / B.3) fonctionne aussi en brouillon / publication, avec historique et révisions. | **[Confirmé, S3, S5, S11]** |

### A.4 Conditions d'affichage des modèles (site parts)

**Principe [Confirmé, S5]** : à la publication, la fenêtre de conditions s'ouvre ; « Add condition » ; la **liste de gauche** choisit *Include* (inclure) ou *Exclude* (exclure) ; la **liste de droite** choisit les pages visées ; **plusieurs conditions** peuvent être cumulées (exemple officiel : toutes les pages de catégorie « Shirts » **et** celles de « Pants »). Laisser le réglage par défaut = tout le site.

**Les mêmes conditions** servent aux modèles du Theme Builder, aux popups et au Custom Code ; elles ont été introduites avec Elementor Pro 2.0 et la page développeur est rédigée pour Pro **[Confirmé, S12]**. Elles couvrent « la plupart de la hiérarchie des modèles de WordPress » et peuvent être étendues par des conditions personnalisées (groupe, données, vérification, sous-conditions) **[Confirmé, S12]**.

| Groupe | Options officielles | Étiquette |
|---|---|---|
| Entire Site | Toutes les pages du site. | **[Confirmé, S5]** |
| Singular | All Singular ; Front Page ; Posts (tous ou choisis) ; In Category ; In Child Categories ; In Tag ; Posts by Author ; Pages ; Page by Author ; Landing Pages (+ par auteur) ; Floating buttons (+ par auteur) ; Media (+ par auteur) ; Direct child of ; Any child of ; By Author ; **404 Page**. | **[Confirmé, S5]** |
| Archives | Toutes ou certaines ; Author Archive ; Date Archive ; **Search Results** ; Posts Archive ; Categories ; Direct Child Category of ; Any Child Category of ; Tags. | **[Confirmé, S5]** |
| WooCommerce | Par défaut toutes les pages boutique ; All Product Archives ; Shop Page ; Search Results ; Product Category ; Product Tags ; (la liste continue : produits, produits d'une catégorie, d'une étiquette, par auteur — la lecture s'arrête à « Product Tags », le reste vient de la matrice du dépôt). | **[Confirmé, S5]** jusqu'à « Product Tags » ; suite **[Non vérifiable]** (reprise de `docs/ELEMENTOR_PARITY_MATRIX.md` EL-TB019, elle-même issue d'une lecture antérieure) |

**Avertissement de conflit [Confirmé, S5]** : si la condition choisie entre en conflit avec celle d'une autre partie (exemple officiel : deux en-têtes « toute page »), **un avertissement apparaît**.

### A.5 Priorité entre modèles globaux et spécifiques

| Question | Réponse | Étiquette |
|---|---|---|
| Elementor documente-t-il la règle de priorité (spécifique contre global, plusieurs modèles égaux) ? | **Non, pas dans les pages lues.** La page des conditions mentionne seulement l'avertissement de conflit ; la page développeur des conditions ne traite pas la priorité. Une recherche de la règle officielle n'a trouvé que des plugins tiers aux comportements divergents (non retenus). | **[Confirmé, S5, S12]** pour l'absence dans ces pages |
| Comportement réel en cas de plusieurs modèles applicables | Connaissance générale : Elementor choisit le modèle dont la condition est la plus précise (un article précis l'emporte sur une catégorie, qui l'emporte sur « tout le site »), l'exclusion écartant le modèle. Je ne l'ai **pas** vérifié dans une source lue. | **[Non vérifiable]** |
| Effet du plan | Le sélecteur d'affichage exige Pro. | **[Confirmé, S12]** |

**[Adaptation Kolakisa]** : ne pas copier une règle floue. Kolakisa a déjà une règle **déterministe et documentée** (`docs/KOLAKISA_THEME_BUILDER_DISPLAY_RULES.md`) : article précis 8, catégorie 4 (+0,5 pour la catégorie propre), étiquette 2, public 1, général 0 ; exclusion toujours prioritaire ; à égalité, l'ancienneté d'affectation ; écran « Pourquoi ce modèle ? » **[Observé dans le dépôt]**. À conserver telle quelle et à présenter comme un avantage.

### A.6 Compatibilité avec pages, articles, archives et WooCommerce

| Cible | Constat | Étiquette |
|---|---|---|
| Pages | Modèle Single Page appliqué **seulement** aux pages en « Default Template » ; Canvas et Full Width l'ignorent. | **[Confirmé, S6]** |
| Articles | Le modèle Single Post existe ; mêmes conditions (catégorie, enfants, étiquette, auteur). | **[Confirmé, S3, S5]** |
| Archives | Un modèle d'archive est un modèle de liste ; pour le blog il faut d'abord désigner la **page des articles** dans les réglages de lecture de WordPress. Les types de contenu personnalisés demandent « Has Archive » = vrai. | **[Confirmé, S7]** |
| Recherche | Archive spéciale ; condition *Include > Search Results*. | **[Confirmé, S9]** |
| WooCommerce | Parties de site Produit / Archive de produits ; conditions boutique (A.4). Détail des widgets requis (Add To Cart, Archive Products) : repris du dépôt, non relu ici. | **[Confirmé, S3, S5]** ; détail **[Non vérifiable]** |
| Thèmes WordPress tiers | Le Theme Builder fonctionne avec tout thème respectant les standards WordPress ; les emplacements supplémentaires (sidebar…) exigent que le thème les enregistre via l'API Theme Locations. | **[Confirmé, S4]** |

**[Adaptation Kolakisa]** : Kolakisa n'a pas de thème WordPress tiers ; la notion de « compatibilité thème » est sans objet (déjà classée « Non applicable » dans `docs/ELEMENTOR_PARITY_MATRIX.md` EL-SS026 / EL-TB024).

### A.7 Aperçu, sauvegarde, publication, réutilisation

| Sujet | Fonctionnement documenté | Étiquette |
|---|---|---|
| Aperçu avec contenu réel | Pour un modèle d'archive : **icône d'engrenage en bas à gauche** pour choisir l'archive d'aperçu. Pour la recherche : *Settings > Preview Settings > Search Term*, « Apply & Preview » ; tester aussi un terme **sans résultat** pour voir l'état vide. | **[Confirmé, S8, S9]** |
| Aperçu pour pages / articles | Le sélecteur « aperçu avec tel article / telle page » existe dans l'éditeur de modèle ; son détail n'a pas été relu. | **[Non vérifiable]** (repris de EL-TB021 du dépôt) |
| Sauvegarde | Brouillon d'abord ; la **publication** déclenche la fenêtre de conditions. Un modèle sans condition reste brouillon. | **[Confirmé, S5, S3]** |
| Publication | « Publish » puis « Save & Close » dans la fenêtre de conditions. | **[Confirmé, S6, S5]** |
| Réutilisation | Export `.json` d'une partie ; import `.json`/`.zip` ; « Save as Template » depuis le menu Publish vers *Site Templates* (local) ou *Cloud Templates* (compte Elementor, quota selon abonnement). | **[Confirmé, S3, S14]** |
| Multilingue | Un article sur les modèles du Theme Builder avec WPML existe. | Titre seul : **[Non vérifiable]** |

### A.8 Conditions d'affichage **d'un élément** (distinctes des conditions de modèle)

| Point | Contenu | Étiquette |
|---|---|---|
| Où | Dans un élément : Réglages > icône « Display Conditions » en bas du panneau ; « + Add Condition ». | **[Confirmé, S17]** |
| Logique | **ET** (bouton AND) et **OU** (« Add Condition group ») combinables ; plusieurs valeurs par règle (ex. auteur Alex, Francis ou Jaime). | **[Confirmé, S17]** |
| Prise d'effet | Après **enregistrement ou publication** de la page seulement. | **[Confirmé, S17]** |
| Conditions disponibles (extrait) | Pages : page parent, auteur. Articles : catégories, étiquettes, date de modification, date de publication, auteur… (la liste complète continue : connexion, rôle, date/heure, URL, etc., cf. matrice du dépôt EL-TB022). | **[Confirmé, S17]** pour l'extrait ; reste **[Non vérifiable]** |
| Bonne pratique | Placer les conditions **dans un modèle** plutôt que sur chaque instance. | **[Confirmé, S17]** |
| Plan | Non précisé sur la page lue. | **[Non vérifiable]** |

### A.9 Popups (rappel)

- Trois niveaux : **Conditions** (où), **Triggers** (déclencheurs liés à l'utilisateur : défilement, clic, intention de sortie, inactivité), **Advanced Rules** (autres exigences : nombre de visites, URL d'origine, appareils) **[Confirmé, S16]**.
- Accès : bouton Publish → fenêtre « Display Conditions » à la première publication, puis flèche à côté de Publish **[Confirmé, S16]**.
- Plan : exclusivement Pro, plans Advanced et supérieurs **[Confirmé, S16]**.

---

## B. Site Settings et système de design

### B.1 Structure du panneau

La documentation développeur décrit **trois sections** **[Confirmé, S13]** :

| Section | Rôle | Étiquette |
|---|---|---|
| Design System | Couleurs et polices **globales**. | **[Confirmé, S13]** |
| Theme Style | Styles généraux du thème : repli de style pour les balises HTML ; les widgets sans définition propre utilisent ces styles. | **[Confirmé, S13, S11]** |
| Settings | Identité du site, mise en page (Layout), points de rupture (Breakpoints), CSS personnalisé… | **[Confirmé, S13]** |

Accès : logo Elementor de la barre du haut → « Site Settings » ; ou *Elementor > Editor* dans l'administration **[Confirmé, S11]**. Les menus officiels listent aussi des pages « Lightbox », « Custom Fonts », « Custom Icons », « Custom Code », « Page Transitions », « Maintenance Mode » (titres vus dans la navigation) **[Confirmé, S2]** pour leur existence ; contenu non relu ici (voir la matrice du dépôt EL-SS030 à EL-SS050).

### B.2 Couleurs et typographies globales

| Point | Contenu | Étiquette |
|---|---|---|
| Intérêt | Cohérence de marque ; un changement se répercute partout. | **[Confirmé, S18, S19]** |
| Couleurs système | Quatre couleurs « système » prédéfinies (**Primary, Secondary, Text, Accent**), **non supprimables**. | **[Confirmé, S18]** |
| Couleurs personnalisées | « Add Color » → nouvelle entrée nommée ; on peut **renommer** (clic sur le nom), **supprimer** (icône), **réordonner** (flèches), puis « Save Changes ». | **[Confirmé, S18]** |
| Polices globales | Même modèle : styles typographiques système (4) non supprimables + « Add Style » pour des styles nommés ; l'édition ouvre le contrôle Typographie complet. | **[Confirmé, S19]** |
| Mécanisme | Les couleurs/polices globales sont des **variables CSS** ; une valeur globale appliquée à un élément se met à jour partout. | **[Confirmé, S21]** |
| Variables | Le menu liste aussi « Variables » et « How to sync variables and global elements » (Editor V4). | Titres seuls : **[Non vérifiable]** |
| Désactiver les valeurs par défaut | Cases « Disable Default Fonts » et « Disable Default Colors » dans *Elementor > Settings* : nécessaires pour que le Theme Style prenne le dessus sur les widgets Elementor. | **[Confirmé, S11]** |

### B.3 Theme Style (styles de thème)

Le Theme Style définit des styles **par défaut** pour : arrière-plans, titres, boutons, images, champs de formulaire **[Confirmé, S11]**. **Par défaut il ne s'applique qu'aux éléments non construits par Elementor** (champs de paiement WooCommerce, libellés Contact Form 7, titres tiers) ; on peut le forcer sur les éléments Elementor en désactivant les couleurs/polices par défaut **[Confirmé, S11]**.

| Catégorie | Options officielles | Étiquette |
|---|---|---|
| Typographie | Couleur du texte ; typographie ; **espacement des paragraphes** (marge basse) ; **liens** (couleur et typographie, normal / survol) ; **H1 à H6** (couleur, typographie). | **[Confirmé, S11]** |
| Boutons | Typographie ; ombre du texte ; normal / survol : couleur du texte, couleur de fond, type de bordure (aucune, pleine, double, pointillée, tirets, rainurée), ombre, rayon, remplissage (padding). | **[Confirmé, S11]** |
| Champs de formulaire | Libellés (couleur, typographie) ; champs : typographie ; normal / focus : couleur du texte, fond, bordure, rayon, ombre, **durée de transition (focus)**, padding. | **[Confirmé, S11]** |
| Images | Normal / survol : bordure, rayon, opacité, ombre, **filtres CSS** (flou, luminosité, contraste, saturation), durée de transition (survol). | **[Confirmé, S11]** |
| Thème Hello | Si le thème Hello est utilisé, on peut aussi régler l'en-tête et le pied de page du thème. | **[Confirmé, S11]** |
| Historique | Annuler / rétablir, **révisions**, mode **brouillon / publication** : on teste sans toucher le site en ligne. | **[Confirmé, S11]** |
| Plan | La page ne précise pas le plan du Theme Style ; elle dit seulement que le **CSS global** est Pro. | **[Confirmé, S11]** (CSS global = Pro) ; Theme Style : **[Non vérifiable]** |

### B.4 Priorité : global < thème < élément

La question posée est « ordre de priorité global < thème < élément ». Ce que disent les sources :

| Couche | Rôle | Priorité | Étiquette |
|---|---|---|---|
| Theme Style | Repli sur les balises HTML (`h1`, `body`, `label`…), « aussi général que possible », valeur de base « si aucune définition d'élément n'a été posée ». | La plus basse | **[Confirmé, S21]** |
| Couleurs / polices globales | Couche de variables CSS « qui se superpose au Theme Style et **a priorité** » ; un élément sans valeur globale retombe sur le Theme Style. | Au-dessus du Theme Style | **[Confirmé, S21]** |
| Valeur posée sur un élément (réglage direct du widget) | Plus spécifique que les deux couches précédentes. | La plus haute | **[Non vérifiable]** : la phrase explicite « élément > global » n'a pas été lue ; c'est la lecture naturelle de « sans définition d'élément » dans S21 et le fonctionnement CSS habituel |
| Editor V4 | Une page « Prioritize conflicting styles » existe. | — | Titre seul : **[Non vérifiable]** |

**Attention de vocabulaire.** L'énoncé de la mission écrit « global < thème < élément ». La documentation officielle dit l'inverse pour les deux premières couches : le **Theme Style est le plus faible** et le **global (couleurs/polices) a priorité sur lui** **[Confirmé, S21]**. Pour Kolakisa, il faut décider et documenter la hiérarchie (voir E.3).

### B.5 Identité du site

| Champ | Contenu documenté | Étiquette |
|---|---|---|
| Nom du site, description (slogan) | Réglés dans *Site Settings > Site Identity*. | **[Confirmé, S22]** |
| Logo | Utilisé par le widget Site Logo et d'autres fonctions ; formats jpg, png, gif ; SVG possible s'il est déjà dans la médiathèque, avec une taille à définir dans le style du widget. | **[Confirmé, S22, S25]** |
| Favicon | Image via la médiathèque. | **[Confirmé, S22]** |
| Après import d'un kit | Menus, nom du site, logo : à **reconnecter** manuellement. | **[Confirmé, S24, S25]** |

### B.6 Mise en page globale (Layout)

Table **[Confirmé, S23]** (page « Control your global layout settings ») :

| Réglage | Effet |
|---|---|
| Content width | Largeur par défaut des conteneurs/sections « Boxed » ; 1140 px généralement. |
| Container padding | Marge intérieure par défaut des conteneurs, liens pour dissocier haut/bas/gauche/droite. |
| Gaps | Espace par défaut entre éléments d'un conteneur (colonnes et rangées dissociables). |
| Page title selector | Sélecteur du titre de page (défaut `h1.entry-title`) pour le masquer à l'édition. |
| Stretched Section Fit To | Balise limitant la largeur de page dans le thème (souvent `body`). |
| Default Page Layout | Rend « Elementor Canvas » ou « Elementor Full Width » le modèle par défaut des pages. |

### B.7 Arrière-plans, Lightbox, transitions

- Le Theme Style gère l'arrière-plan par défaut **[Confirmé, S11]** (intro de la page). Le détail de l'option « Background » du site (couleur, image, arrière-plan mobile distinct) vient de la matrice du dépôt (EL-SS020, EL-SS021) **[Non vérifiable]** ici, car la page n'a pas été relue.
- Lightbox, Page Transitions : pages listées au menu **[Confirmé, S2]** ; détails repris du dépôt, **[Non vérifiable]** ici.

### B.8 Points de rupture (breakpoints)

| Point | Contenu | Étiquette |
|---|---|---|
| Valeurs par défaut | PC au-dessus de 1024 px, tablette entre 767 et 1024 px, mobile en dessous de 767 px (« 1024 px pour la tablette, 767 px pour le mobile »). | **[Confirmé, S26]** |
| Personnalisation | *Site Settings > Layout > Breakpoints* : modifier les points par défaut, **ajouter** des appareils (grand écran, tablette paysage, mobile paysage…). | **[Confirmé, S26]** |
| Cascade | L'édition responsive est **descendante** : une valeur posée sur un écran large s'applique aux plus étroits ; l'inverse non. Pour le grand écran, Elementor « cascade vers le haut » en héritant la valeur du bureau. Les valeurs héritées s'affichent en grisé. | **[Confirmé, S26, S27]** |
| Marqueurs | Les réglages adaptables par appareil portent une icône d'appareil. | **[Confirmé, S26]** |
| Nombre maximal de points | Non lu dans les pages ouvertes. | **[Non vérifiable]** (la matrice du dépôt parle de 6 écrans) |

### B.9 CSS personnalisé

| Niveau | Contenu | Plan | Étiquette |
|---|---|---|---|
| Global (site) | *Site Settings > Settings > Custom CSS*. S'applique à tout le site. | **Pro** | **[Confirmé, S28, S11]** |
| Par élément | Page « Add Custom CSS to an element » et mot-clé `selector` : titres seuls. | Pro (connaissance générale) | **[Non vérifiable]** |
| Custom Code (head / body) | Existe au menu ; priorité 1-10 et conditions : reprises du dépôt (EL-SS044 à 047). | Pro | **[Confirmé, S1]** (le code et CSS personnalisés sont dans Editor Pro) ; détails **[Non vérifiable]** |

### B.10 Ce que contient exactement un « kit » côté réglages

L'export/import distingue **Templates** (parties de site + modèles enregistrés), **Content** (pages, articles, types personnalisés) et **Settings & configurations** (polices globales, Theme Style, layout, lightbox, arrière-plan) **[Confirmé, S15]**. L'import par la bibliothèque de kits propose la même séparation avec « Site Settings » : couleurs globales, polices globales, Theme Style, layout, lightbox, arrière-plan **[Confirmé, S24]**. **[Adaptation Kolakisa]** : c'est exactement la séparation « jetons / pages » que Kolakisa utilise déjà (`docs/KOLAKISA_THEMES.md`).

---

## C. Bibliothèque et expérience utilisateur

### C.1 Deux bibliothèques à ne pas confondre

La documentation officielle l'écrit explicitement **[Confirmé, S14]** : « template » désigne deux choses.

| | Site parts (Theme Builder) | Template Library |
|---|---|---|
| Nature | En-têtes, pieds, modèles d'article/page/archive utilisés **partout** sur le site | Blocs, conteneurs, pages **préfabriqués**, insérés dans une page puis modifiés |
| Où | Theme Builder | Éditeur : icône « Add template » |
| Réutilisation | Conditions d'affichage | Insertion ponctuelle |

**[Adaptation Kolakisa]** : Kolakisa a déjà ces deux notions séparées (`src/marketing/web/templatesLibrary.js` = bibliothèque de modèles de pages/blocs ; `themeTemplates.js` = affectation Theme Builder) **[Observé dans le dépôt]**.

### C.2 Template Library (blocs et pages)

| Point | Contenu | Plan | Étiquette |
|---|---|---|---|
| Contenu | Des centaines de mises en page et de blocs conçus par des designers, avec images libres d'usage. | Plan non précisé (compte gratuit requis) | **[Confirmé, S29]** |
| Connexion | À la première insertion, il faut **connecter un compte Elementor gratuit** (création possible sur place). | Gratuit | **[Confirmé, S29]** |
| Choix | Un **Bloc**, une **Page** entière, ou un **modèle personnel** (onglet My Templates). | — | **[Confirmé, S29]** |
| Recherche | Champ de recherche pour un modèle précis. | — | **[Confirmé, S29]** |
| Favoris | Icône cœur. | — | **[Confirmé, S29]** |
| Insertion | Bouton « Insert ». | — | **[Confirmé, S29]** |
| Variantes IA | « Generate Variations » pour les utilisateurs d'Elementor AI. | AI | **[Confirmé, S29]** |
| Téléverser / exporter | Téléverser un `.json` ou `.zip` ; exporter un modèle sauvegardé via le menu « ... ». | — | **[Confirmé, S29]** |
| Stockage | **Site library** ou **Cloud library** (rattachée au compte ; nombre et taille selon l'abonnement). | — | **[Confirmé, S14, S29]** |
| Catégories et filtres détaillés de la bibliothèque de blocs | Non décrits dans les pages lues (seul le champ de recherche l'est). | — | **[Non vérifiable]** |

### C.3 Kit Library (kits de sites complets)

| Point | Contenu | Étiquette |
|---|---|---|
| Accès | *Templates > Website Templates* → page « Kit Library ». | **[Confirmé, S24]** |
| Aperçu | « View Demo » au survol ; aperçu des pages en **bureau / tablette / mobile** par des icônes. | **[Confirmé, S24]** |
| Aperçu du contenu | « Overview » liste les pages et parties de site (en-tête, pied, pages, modèles, archives, 404) incluses. | **[Confirmé, S24]** |
| Application | « Apply » : **Apply All** (tout) ou **Customize** (choix : modules/plugins requis, Templates, Content avec type de contenu, Site Settings). | **[Confirmé, S24]** |
| Dépendances techniques | Autorisation d'importer des **SVG** (« hautement recommandée ») ; plugins requis à choisir. | **[Confirmé, S24, S15]** |
| Taille | Téléchargement du kit en zip si l'installation directe échoue pour cause de taille. | **[Confirmé, S24]** |
| Bonne pratique | Installer sur un **site propre** sans autre kit, en-tête ou pied ; sauvegarder avant d'importer. | **[Confirmé, S24, S15]** |
| Support | Elementor ne prend pas en charge les modèles tiers. | **[Confirmé, S24]** |
| Catégories, filtres, tri de la Kit Library | **Non décrits** dans les pages lues. | **[Non vérifiable]** |
| Retrait | Pages « Remove a kit » existent : titres seuls. | **[Non vérifiable]** |

### C.4 Modification après insertion / application

| Point | Contenu | Étiquette |
|---|---|---|
| Après application d'un kit | Tout est modifiable : pages, articles, popups, parties de site (Theme Builder), réglages globaux. | **[Confirmé, S25]** |
| Dépendances manquantes | Menu, nom du site, logo, catégories d'articles, popups, produits (kit boutique) sont « **à connecter** » : comportement attendu. | **[Confirmé, S25]** |
| Menus | Un kit ne génère pas la navigation ; il faut créer puis **assigner** un menu dans l'en-tête / pied. | **[Confirmé, S24, S25]** |
| Contenu dynamique | Les modèles utilisent des widgets dynamiques (titre, image mise en avant…) alimentés par le contenu réel ; les étiquettes dynamiques sont Pro (reprise du dépôt). | **[Confirmé, S6]** pour l'usage dynamique ; plan **[Non vérifiable]** |
| Aperçu / brouillon / publication | On prévisualise, enregistre en brouillon, puis publie. | **[Confirmé, S25]** |
| Enregistrer ses propres modèles | « Save as Template » (page, depuis le menu Publish) ou clic droit « Save as template » (conteneur), vers site local ou cloud. | **[Confirmé, S14]** |

### C.5 Importation et exportation de sites

| Point | Contenu | Étiquette |
|---|---|---|
| Où | *Elementor > Editor > Tools > Website Templates*. | **[Confirmé, S15]** |
| Export | Nom, description ; cases Templates / Content / Settings & configurations ; « Save to library » ou zip. | **[Confirmé, S15]** |
| Import | Zip glissé ; choix des trois blocs ; « Import and apply » ; avertissement si le kit contient des SVG ; sauvegarde recommandée. | **[Confirmé, S15]** |
| Usages | Sauvegarde, migration d'hébergement, modèle de départ d'un nouveau site. | **[Confirmé, S15]** |

---

## D. Rendu

### D.1 Containers : Flexbox et Grid

| Point | Contenu | Plan | Étiquette |
|---|---|---|---|
| Flexbox container | Remplace section / colonne / section interne ; direction (ligne ou colonne) réglable **par point de rupture**, largeurs/hauteurs et **ordre personnalisé** par appareil. | Plan non précisé | **[Confirmé, S30]** |
| Grid container | Type de conteneur formé de cellules en lignes et colonnes ; on fixe le nombre de lignes et colonnes sans déposer chaque conteneur ; sert aux designs symétriques et à l'alignement. | Plan non précisé | **[Confirmé, S31]** (page de 2024-03 ; plus de détails sur « Style options for grid containers » non lus : **[Non vérifiable]**) |
| Marges et paddings | Unités PX, EM, %, REM ; liens pour dissocier les côtés. Margin gauche/droite sur un conteneur de premier niveau = largeur 100 % + marge, d'où un défilement horizontal : mettre la marge sur un conteneur enfant. | — | **[Confirmé, S32]** |
| Largeur d'un élément | Full Width (100 %), Inline (auto), Custom (PX, %, VW) ; « Inline » ne s'applique pas aux conteneurs (on utilise la direction). | — | **[Confirmé, S32]** |
| Alignement individuel | `Align Self` surcharge `align-items` du conteneur. | — | **[Confirmé, S32]** |
| Positionnement | Absolu / fixe : repère dans le panneau Structure pour les éléments sortis du flux. | — | **[Confirmé, S32]** |
| Rapport sections / conteneurs | Les sections restent supportées ; l'article d'héritage des valeurs responsives précise qu'il concerne « sections et colonnes » seulement. | — | **[Confirmé, S27]** |

### D.2 Responsive

| Point | Contenu | Étiquette |
|---|---|---|
| Trois versions par défaut (PC, tablette, mobile) | Oui ; réglage par appareil via icônes ; poignées de redimensionnement du canevas hors vue PC. | **[Confirmé, S26]** |
| Cascade | Top-down (B.8). | **[Confirmé, S26, S27]** |
| Avec les conteneurs | Moins de points de rupture nécessaires ; ordre et direction par appareil ; plus besoin de sections masquées par appareil. | **[Confirmé, S30]** |

### D.3 Cohérence éditeur / aperçu / publié

| Point | Contenu | Étiquette |
|---|---|---|
| Brouillon / publication / aperçu | Documentés pour les pages, le Theme Style et les kits. | **[Confirmé, S11, S25]** |
| Garantie de rendu identique entre éditeur, aperçu et site publié | **Non documentée** dans les pages lues. Des pages de dépannage existent (aperçu non chargé, CSS personnalisé inopérant, thèmes en conflit) : titres seuls. | **[Non vérifiable]** |
| Effets du thème WordPress sur le rendu | Le Theme Style ne s'applique qu'aux éléments non Elementor sauf réglage ; la « fuite » de CSS du thème est une cause de divergence connue en pratique. | **[Confirmé, S11]** pour le premier point ; reste **[Non vérifiable]** |

### D.4 Performance et chargement

| Point | Contenu | Étiquette |
|---|---|---|
| Moins de `div` | Un exemple officiel passe de **37 `div`** (sections + colonnes + section interne) à **23** (un conteneur), soit **14 de moins** et **29 lignes de HTML de moins** (105 contre 76), CSS non comparé. | **[Confirmé, S33]** |
| Raison | Flexbox (direction, alignement, justification, retour à la ligne) remplace l'imbrication. | **[Confirmé, S30, S33]** |
| Modules d'expérimentation / fonctions de performance | Page « Improve performance features » : titre seul. | **[Non vérifiable]** |

---

## E. Adaptations nécessaires dans Kolakisa

### E.1 Résumé de l'existant (vérifié dans le dépôt)

| Fait | Preuve | Étiquette |
|---|---|---|
| 160 thèmes (21 catégories) = jetons de design + 4 à 6 pages de démonstration en sections du Page Builder + visuels SVG originaux. | `docs/KOLAKISA_THEMES.md` ; `src/marketing/themes/library/index.js`, `specs/*.js`, `compose.js`, `art.js` | **[Observé dans le dépôt]** |
| Galerie filtrable, fiche, aperçu isolé, installation, activation, retour au thème précédent, suppression. | Routes dans `src/marketing/web/themes.js` : `GET /site-web/themes`, `/ajouter`, `/:key/details`, `/:key/apercu`, `POST /installer`, `/:key/activer`, `/:key/demo`, `/revenir`, `/:key/supprimer` | **[Observé dans le dépôt]** (grep) |
| Aperçu de démonstration isolé. | `src/marketing/web/themeDemo.js` (`GET /site-web/themes/:key/demo/:page?`) | **[Observé dans le dépôt]** |
| Modèles du Theme Builder (affectations par organisation, 11 familles). | `src/marketing/pages/themeTemplates.js` (`TYPES`, `CONDITIONS`, `pick`, `explain`) ; routes `GET/POST /site-web/modeles-de-theme`, `/resolution.json`, `/:tid/modifier`, `/:tid/supprimer` dans `src/marketing/web/siteWeb.js` | **[Observé dans le dépôt]** |
| Rendu des régions de thème. | `src/marketing/web/themeRender.js` (`renderRegion`) ; repli sur l'affichage d'origine | **[Observé dans le dépôt]** |
| Jetons de design (couleurs 10 clés, polices, types H1-H6, boutons, images, formulaires, liens). | `src/marketing/pages/tokens.js`, `src/marketing/pages/themeCss.js` | **[Observé dans le dépôt]** |
| Réglages du site (identité, layout, breakpoints tablet 1023 / mobile 767 / wide 1920, arrière-plan, CSS personnalisé, lightbox, transitions). | `src/marketing/pages/siteSettings.js` (lignes 21-29 : `layout`, `customCss`) | **[Observé dans le dépôt]** |
| Bibliothèque de modèles de pages/blocs, import/export JSON, secteurs. | `src/marketing/web/templatesLibrary.js` (routes `/site-web/templates`, `/catalogue.json`, `/detail.json`, `/apercu`, `/importer`, `/enregistrer`, `/export.json`, `/importer-fichier`, `/secteurs`) ; `src/services/templateLibrary.js` | **[Observé dans le dépôt]** |
| En-tête / pied : composants globaux. | `src/marketing/pages/parts.js`, `libraryParts.js` ; `mk_sites.header_component_id` | **[Observé dans le dépôt]** |
| Mise en page : propriétés Flexbox et Grid dans le moteur de nœuds (`display`, `flexDirection`, `flexWrap`, `justifyContent`, `columns`, `gridTemplate`). | `src/marketing/pages/nodes.js:119-136` | **[Observé dans le dépôt]** (grep) |
| Contrôles qualité de la bibliothèque. | `scripts/themes-check.js`, `scripts/themes-previews.js`, `scripts/themes-responsive.js`, `src/marketing/themes/library/verify.js` | **[Observé dans le dépôt]** |
| Pas de thème tiers ni de CPT ; boutique « en cours ». | `docs/KOLAKISA_THEMES.md` (limites) ; familles `product`, `product_archive` dans `themeTemplates.js` | **[Observé dans le dépôt]** |

### E.2 Tableau fonction Elementor → équivalent Kolakisa → écart → décision

Légende de la colonne Décision : **Garder** = déjà au niveau ou au-dessus ; **Compléter** = à développer ; **Ne pas faire** = hors périmètre. Toutes les décisions sont des **[Adaptation Kolakisa]**.

| # | Fonction Elementor (source) | Équivalent Kolakisa existant (fichier / route vérifiés) | Écart | Décision |
|---|---|---|---|---|
| 1 | Tableau de bord Theme Builder : liste des parties, pastille en ligne / brouillon, instances, renommer, exporter, supprimer (S3) | Écran `GET /site-web/modeles-de-theme` (`siteWeb.js:74`) ; `POST …/:tid/modifier`, `…/supprimer` | Pas d'export JSON d'un modèle de thème ; voyant « en ligne / brouillon » à confirmer sur l'écran ; pas de « Instances » | Compléter : badge en ligne / brouillon, liste des pages concernées, export du modèle |
| 2 | Types : header, footer (S3) | Composants globaux de site (`parts.js`, `mk_sites.header_component_id`) | Autre mécanisme que les modèles (brouillon + « Mettre à jour ») ; pas de conditions par page sauf exceptions | Garder ; unifier l'interface (même liste que les modèles) sans changer le moteur |
| 3 | Single Post (S3, S5) | Famille `single_post` (`themeTemplates.js:11`) | Aucun | Garder |
| 4 | Single Page par défaut, seulement pages en « Default Template » (S6) | Famille `static_page` limitée à la page « À propos » ; limite connue L4 du dépôt | Pas de modèle commun à toutes les pages ; pas de notion Default / Canvas / Full Width par page | Compléter : famille « page » + réglage de gabarit par page (Défaut / Pleine largeur / Canvas) |
| 5 | Archive : blog, catégorie, étiquette, auteur, date (S7, S5) | `blog_archive`, `category_archive`, `tag_archive`, `author_archive` | Archive par date absente | Garder ; ajouter la date seulement si le blog l'expose |
| 6 | Résultats de recherche, terme d'aperçu (S9) | `search_results` ; recherche du blog uniquement | Pas de moteur de recherche global ; pas de terme d'aperçu dans l'éditeur | Compléter : champ « terme d'aperçu » (cf. ligne 14) |
| 7 | 404 (S5) | `not_found` ; `server.js` conserve le code HTTP 404 | Aucun | Garder |
| 8 | Loop Item (modèle de boucle) | Boucles intégrées à la grille (`nodes.js`, `loopProps`) | Pas de modèle de carte réutilisable | Compléter plus tard (priorité basse) |
| 9 | Popup Builder, conditions + déclencheurs + règles avancées (S16) | Élément modal et module popups des formulaires | Pas de déclencheurs complets ni de règles de fréquence ; pas de conditions d'affichage par page | Compléter si le produit en a besoin ; hors refonte des thèmes |
| 10 | Produit / archive produits WooCommerce (S3, S5) | Familles `product`, `product_archive` (`themeTemplates.js`), condition catégorie | Pas d'étiquette produit ni de produit précis | Compléter après stabilisation du module boutique |
| 11 | Conditions Include / Exclude, cumul, groupes Singular / Archives (S5) | `themeTemplates.add/update` ; tableau de critères dans `docs/KOLAKISA_THEME_BUILDER_DISPLAY_RULES.md` | Pas de conditions « enfant de », « par auteur » pour les articles ; auteur = « public » seulement | Compléter : « par auteur » ; ne pas imiter « enfant de » tant que les pages n'ont pas de hiérarchie |
| 12 | Avertissement de conflit (S5) | Champ `conflicts` à l'ajout / modification (« même précision que… ») | Aucun | Garder |
| 13 | Priorité entre modèles (non documentée chez Elementor, S5, S12) | `pick` / `explain` ; `GET …/resolution.json` | Kolakisa **dépasse** la doc officielle | Garder et mettre en avant (« Pourquoi ce modèle ? ») |
| 14 | Aperçu d'un modèle avec contenu réel (S8, S9) | `previewScope` : dernier article / dernière formation | Impossible de choisir l'article d'aperçu (limite reconnue dans `KOLAKISA_THEME_BUILDER_ARCHITECTURE.md`) | Compléter : sélecteur d'article / formation / terme de recherche |
| 15 | Brouillon / publication, historique, révisions (S3, S11) | Même éditeur que le Page Builder : brouillon, publication, 100 versions | Aucun | Garder |
| 16 | Display Conditions d'un élément, ET / OU (S17) | Audiences et conditions d'élément (`nodes.js`, `AUDIENCES`) ; matrice EL-TB022 | Pas toutes les conditions d'Elementor ; logique OU à vérifier | Compléter par besoin métier (connexion, rôle, date) |
| 17 | Couleurs globales : 4 système + personnalisées nommées, renommer / supprimer / réordonner (S18) | `tokens.colors` : **10 clés fermées** (`tokens.js:6`) | **Pas de couleur nommée ajoutable** | Compléter : liste `customColors` (nom + hex), proposée dans le sélecteur de couleur |
| 18 | Polices globales : 4 styles + styles nommés (S19) | `tokens.fonts` (heading, body, button, link) + `tokens.type` (h1-h6, body, caption, button) ; classes globales | Pas de styles de texte nommés reliés aux widgets par référence | Compléter : « styles de texte globaux » nommés (sous-ensemble des classes) |
| 19 | Theme Style : typographie, liens, boutons, champs, images (S11) | `themeCss.js` (liens, boutons, images, formulaires) | Formulaires du module Formulaires non couverts ; filtres CSS d'image (flou, contraste…) à confirmer | Compléter : étendre aux formulaires ; filtres d'image si absents |
| 20 | Priorité Theme Style < global < élément (S21) | Jetons du thème < classes globales < styles du nœud (à formaliser) | Hiérarchie non écrite dans la doc Kolakisa | Décider et documenter (voir E.3) |
| 21 | Identité : nom, slogan, logo, favicon (S22) | `settings.identity` (`siteSettings.js`), nom dans `mk_sites.name` | Aucun (logo mobile en plus) | Garder |
| 22 | Layout : largeur, padding conteneur, gaps, gabarit de page par défaut (S23) | `layout.contentWidth` (480-1600, 760), `containerWidth` (1100), `gutter`, `layout.fullWidth` | Pas de padding / gap par défaut des conteneurs ; pas de « Canvas » par défaut | Compléter : `containerPadding`, `defaultGap`, `defaultPageLayout` |
| 23 | Breakpoints modifiables, appareils supplémentaires (S26) | `layout.breakpoints` tablet 1023 / mobile 767 / wide 1920 (`siteSettings.js:22`) | Pas de laptop ni paysage | Garder 3 niveaux + grand écran ; élargir seulement sur demande |
| 24 | Cascade descendante des valeurs responsives (S26, S27) | Héritage descendant depuis le bureau (matrice EL-SS028, EL-F023) | Aucun | Garder |
| 25 | CSS global (Pro) (S28) | `settings.customCss` (20 000 caractères, préfixé `.lp-site`) | Pas de `@media`, `@font-face`, `:root` | Compléter prudemment (`@media` bornés) ; Kolakisa l'offre sans palier Pro, **à trancher côté produit** |
| 26 | Template Library : blocs et pages, recherche, favoris, insertion, upload / export, local ou cloud (S29, S14) | `templatesLibrary.js` : `/site-web/templates`, `catalogue.json`, `detail.json`, `apercu`, `importer`, `enregistrer`, `export.json`, `importer-fichier`, `secteurs` | Favoris et stockage cloud entre sites non vérifiés ; « variations IA » hors sujet | Compléter : favoris ; copie de modèle entre sites d'une même organisation |
| 27 | Kit Library : aperçu bureau / tablette / mobile, Overview, Apply All / Customize (S24) | Galerie thèmes (`themes.js`), aperçu isolé (`themeDemo.js`, `…/apercu`), « Utiliser ce thème » + pages de démo en brouillon | **Pas d'écran « Overview »** listant ce que le thème va créer ; pas de choix granulaire « jetons seuls / pages / menu » avant application | Compléter : fenêtre d'application à 3 cases (Réglages / Pages de démonstration / Menu) — voir E.4 |
| 28 | Import / export de site : Templates / Content / Settings (S15) | Import-export `tools.import` (administrateur) ; export de modèles en JSON | Pas d'export d'un thème personnalisé comme paquet | Compléter : exporter les jetons + pages du site comme « thème personnel » |
| 29 | Dépendances après import : menus, logo, popups, produits à reconnecter (S25) | À l'activation : menu et pages de démo proposés ; modules requis déclarés (`modules`) | Pas de liste « à faire après » après application | Compléter : checklist post-application (logo, menu, formulaire de contact) |
| 30 | Containers Flexbox / Grid, direction et ordre par appareil (S30, S31) | Propriétés de layout dans `nodes.js:119-136` ; `gridTemplate`, `columns` ; réduction à 2 colonnes en tablette (`nodes.js:2090`) | Ordre personnalisé par appareil à vérifier | Garder ; vérifier l'ordre par appareil |
| 31 | Performance : moins de `div` (S33) | Un seul moteur de rendu ; aperçus en WebP ; polices auto-hébergées | Pas de mesure du nombre de nœuds DOM par thème | Compléter : ajouter le nombre de nœuds DOM à `scripts/themes-check.js` |
| 32 | Cohérence éditeur / aperçu / publié (non documenté, D.3) | Aperçu rendu par le même moteur ; tests navigateur (`tests/themes-bibliotheque-navigateur.test.js`) | — | Garder ; exiger un test « éditeur = aperçu = publié » par thème |
| 33 | Compatibilité thèmes tiers, Theme Locations API (S4) | Sans objet | — | Ne pas faire |
| 34 | Hello / sidebars / CPT (S7) | Sans objet | — | Ne pas faire |

### E.3 Hiérarchie de style recommandée pour Kolakisa

| Rang (du plus faible au plus fort) | Couche | Équivalent Elementor | Étiquette |
|---|---|---|---|
| 1 | Base du moteur (valeurs par défaut du rendu) | Styles du thème WordPress | **[Adaptation Kolakisa]** |
| 2 | Jetons du thème actif (Theme Style) : balises, liens, boutons, champs, images | Theme Style (S11, S21) | **[Adaptation Kolakisa]** |
| 3 | Réglages du site (couleurs globales, polices globales, layout, CSS du site) | Design System + Layout + CSS global (S21, S23, S28) | **[Adaptation Kolakisa]** |
| 4 | Classes globales réutilisables | Éléments globaux (connaissance générale) | **[Adaptation Kolakisa]** / **[Non vérifiable]** côté Elementor |
| 5 | Réglages du nœud (par appareil) | Réglages du widget | **[Adaptation Kolakisa]** |

Remarque : l'énoncé initial plaçait « global < thème < élément ». La documentation officielle place le **Theme Style en dessous des couleurs et polices globales** (S21). Je recommande de suivre Elementor sur ce point et de l'écrire dans la documentation produit, car le rang 2 / 3 ci-dessus détermine ce qui se passe quand un utilisateur change de thème (ses couleurs globales personnalisées sont conservées, ce que fait déjà `docs/KOLAKISA_THEMES.md`).

### E.4 Proposition d'expérience pour la refonte de la bibliothèque de thèmes

**[Adaptation Kolakisa]** (propositions ; rien n'est implémenté par ce document).

| Étape | Proposition | S'appuie sur |
|---|---|---|
| Parcourir | Garder la galerie actuelle (recherche, catégories, style, tri). Ajouter des filtres « avec boutique », « multilingue », « type de site » si les métadonnées existent (`type de site`, `modules requis` figurent déjà dans les fiches). | `src/marketing/themes/library/index.js`, `docs/KOLAKISA_THEMES.md` |
| Prévisualiser | Garder l'aperçu isolé bureau / tablette / mobile (l'équivalent de « View Demo », S24) et ajouter un onglet **Overview** : liste des pages, des parties (en-tête, pied, 404, recherche) et des modules requis. | `themeDemo.js`, `themes-preview.ejs` |
| Appliquer | Remplacer le double clic « Installer » puis « Utiliser » par une fenêtre à cases : **Réglages (jetons)**, **Pages de démonstration (brouillon)**, **Menu**. Valeur par défaut : Réglages seuls (pas de suppression, pas de publication). | `POST /site-web/themes/installer`, `/:key/activer`, `/:key/demo` |
| Après application | Checklist « À connecter » : logo, nom, menu, formulaire de contact, adresse e-mail de réception (modèle du S25). | `siteSettings.identity` |
| Modifier | Les pages de démonstration sont des pages normales du Page Builder (déjà le cas). Ajouter un lien « Personnaliser les jetons » vers le personnalisateur existant. | `docs/KOLAKISA_THEMES.md` |
| Revenir | Garder « Revenir au thème précédent ». | `POST /site-web/themes/revenir` |
| Réutiliser | Exporter / importer un thème personnel (jetons + pages), sur le modèle de l'export en trois blocs de S15. | `/site-web/templates/export.json`, `importer-fichier` |
| Qualité | Ajouter à `scripts/themes-check.js` : nombre de nœuds DOM par page, un seul `h1`, contrastes AA (déjà fait), test « éditeur = aperçu = publié ». | `scripts/themes-check.js`, `verify.js` |
| Droits | Conserver `appearance.read` / `appearance.styles` / `appearance.publish` / `forms.write`. | `themes.js` |

### E.5 Ce que Kolakisa ne doit pas copier

| Point | Raison | Étiquette |
|---|---|---|
| Priorité de modèles non documentée | Le système Kolakisa est déjà explicite et déterministe. | **[Adaptation Kolakisa]** |
| Dépendance à un compte pour accéder à la bibliothèque (S29) | Catalogue local déjà disponible sans compte. | **[Adaptation Kolakisa]** |
| Kits qui écrasent ou ajoutent à un site existant sans restauration (S24 recommande un site propre) | Kolakisa : changer de thème ne supprime jamais de contenu et permet de revenir en arrière (déjà vrai). | **[Adaptation Kolakisa]** |
| Images de démonstration sous licence tierce | Kolakisa utilise des illustrations vectorielles originales. | **[Adaptation Kolakisa]** |
| Code, images, textes ou kits Elementor | Interdit de les reprendre ; seules les fonctionnalités sont décrites. | **[Adaptation Kolakisa]** |

---

## F. Tableau de synthèse : Gratuit contre Pro (ce que les sources permettent d'affirmer)

| Fonction | Gratuit | Pro | Étiquette |
|---|---|---|---|
| Éditeur à glisser-déposer, conteneurs | Oui (éditeur de base) | Oui | **[Confirmé, S1]** pour l'éditeur ; conteneurs : **[Non vérifiable]** (non précisé) |
| Theme Builder (création de parties de site) | Aperçu des parties « disponibles avec Pro » | Création et gestion | **[Confirmé, S1, S3]** |
| Conditions d'affichage des modèles | — | Oui (page développeur : Pro 2.0) | **[Confirmé, S12]** |
| Popup Builder | — | Pro, plans Advanced et supérieurs | **[Confirmé, S16]** |
| Custom CSS global | — | Oui | **[Confirmé, S28, S11]** |
| Code personnalisé | — | Oui | **[Confirmé, S1]** |
| Couleurs et polices globales | Non précisé | Non précisé | **[Non vérifiable]** |
| Theme Style | Non précisé | Non précisé | **[Non vérifiable]** |
| Template Library (blocs / pages) | Avec compte gratuit | — | **[Confirmé, S29]** (certains modèles peuvent être réservés Pro : **[Non vérifiable]**) |
| Kit Library, import / export de site | Non précisé | Non précisé | **[Non vérifiable]** |
| Cloud Templates | Quota selon l'abonnement | — | **[Confirmé, S14]** |

---

## Sources consultées (date de consultation : 2026-11-03)

Toutes les URLs ci-dessous ont été **réellement ouvertes** (texte de l'article lu, sauf mention). Les articles `elementor.com/help/...` ont été lus via le flux JSON public du centre d'aide (corps de l'article) ; la date entre parenthèses est le champ « modifié » renvoyé par ce flux.

| Réf. | URL | Remarque |
|---|---|---|
| S1 | https://elementor.com/help/theme-builder/ | Page marketing (Free / Pro / One) lue via l'outil de lecture de pages. Ne détaille pas les types de modèles. |
| S2 | https://elementor.com/help/site-settings/ | Ouverte : seul le menu de navigation est lisible, **corps de l'article absent** ; utilisée uniquement pour les titres du menu. |
| S3 | https://elementor.com/help/the-elementor-theme-builder/ | « What is the Theme Builder? » (2026-09-15) |
| S4 | https://elementor.com/help/considerations-for-theme-builder-compatibility/ | (2025-06-15) |
| S5 | https://elementor.com/help/conditions/ | « Set conditions for site part templates » (2026-10-01) ; la liste WooCommerce est coupée après « Product Tags » dans ma lecture |
| S6 | https://elementor.com/help/single-page-site-part/ | (2026-06-19) |
| S7 | https://elementor.com/help/archive-site-part/ | (2026-10-01) |
| S8 | https://elementor.com/help/create-archive-template/ | (2026-09-25) |
| S9 | https://elementor.com/help/customize-the-search-results-archive/ | (2024-11-11) |
| S10 | https://elementor.com/help/how-to-create-sidebar-templates-with-hello-theme/ | **Titre vu dans les résultats de recherche seulement ; corps non lu.** Cité uniquement pour l'existence du guide. |
| S11 | https://elementor.com/help/theme-style-global-settings/ | « Set a Theme Style » (2026-09-15) |
| S12 | https://developers.elementor.com/docs/theme-conditions/ | Documentation développeur, lue via l'outil de lecture de pages |
| S13 | https://developers.elementor.com/docs/editor/site-settings-panel | Documentation développeur, lue via l'outil de lecture de pages |
| S14 | https://elementor.com/help/create-templates-for-faster-website-building/ | (2025-10-21) |
| S15 | https://elementor.com/help/what-is-import-export/ | (2026-08-07) |
| S16 | https://elementor.com/help/conditions-triggers-and-advanced-rules/ | Popups (2026-08-27) |
| S17 | https://elementor.com/help/show-and-hide-elements-on-a-page-display-conditions/ | (2026-09-15) ; liste complète des conditions coupée par ma lecture |
| S18 | https://elementor.com/help/view-and-edit-global-colors/ | (2026-09-10) |
| S19 | https://elementor.com/help/view-and-edit-global-fonts/ | (2026-09-15) |
| S20 | https://elementor.com/help/disable-elementors-default-fonts-and-colors/ | **Titre vu dans la recherche seulement, corps non lu** ; la mention des variables CSS vient de S21 |
| S21 | https://elementor.com/help/how-elementors-theme-style-and-design-system-options-work-together/ | (2025-02-05) |
| S22 | https://elementor.com/help/setting-up-your-site-identity/ | (2026-08-07) |
| S23 | https://elementor.com/help/global-layout-settings/ | (2025-11-30) |
| S24 | https://elementor.com/help/apply-selected-parts-kit/ | « Install a website template » / Kit Library (2026-05-18) |
| S25 | https://elementor.com/help/customizing-an-elementor-site-kit/ | (2026-06-19) |
| S26 | https://elementor.com/help/mobile-editing/ | (2026-10-23) |
| S27 | https://elementor.com/help/inherited-responsive-values/ | (2025-06-16) |
| S28 | https://elementor.com/help/global-custom-css/ | (2026-09-25) |
| S29 | https://elementor.com/help/template-library/ | (2026-09-15) |
| S30 | https://elementor.com/help/responsive-design-using-containers/ | (2026-10-23) |
| S31 | https://elementor.com/help/what-is-a-grid-container/ | (2024-03-07) ; page courte |
| S32 | https://elementor.com/help/container-advanced-tab-settings/ | (2026-08-11) |
| S33 | https://elementor.com/help/container-performance-a-closer-look/ | (2026-05-18) ; voir aussi https://elementor.com/help/improve-performance-with-containers/ (2026-05-18) |

Autres pages ouvertes et utilisées de façon secondaire : https://elementor.com/help/kit-has-been-imported-what-to-do-next/ (2024-01-31, source de B.5 et C.4, citée « S25 » par proximité de sujet — en toute rigueur c'est une page distincte).

Sources internes du dépôt (lues et réutilisées) : `docs/ELEMENTOR_REFERENCE.md`, `docs/ELEMENTOR_LAYOUT_AND_STYLE.md`, `docs/ELEMENTOR_PARITY_MATRIX.md` (lignes EL-TB et EL-SS), `docs/KOLAKISA_THEME_BUILDER_ARCHITECTURE.md`, `docs/KOLAKISA_THEME_BUILDER_DISPLAY_RULES.md`, `docs/KOLAKISA_THEMES.md`.

Nombre de sources officielles Elementor dont le **corps** a été lu : 28 articles du centre d'aide (S3 à S9, S11, S14 à S19, S21 à S33, plus `kit-has-been-imported-what-to-do-next` et `improve-performance-with-containers`), 2 pages de documentation développeur (S12, S13), 1 page marketing (S1). Pages ouvertes sans corps exploitable : S2. Cités par titre seulement : S10, S20.

## Limites

1. **Aucune interface Elementor n'a été testée** (ni gratuit, ni Pro). Aucune observation d'écran : l'étiquette « Observé » ne porte que sur le dépôt Kolakisa.
2. **Priorité entre modèles** : la règle officielle n'est écrite dans aucune page lue ; la description du comportement réel est de la connaissance générale, non vérifiée.
3. **Plan Gratuit / Pro** : non précisé pour les couleurs et polices globales, le Theme Style, la Kit Library et les conteneurs. Seuls le Theme Builder, les conditions, les popups, le CSS global et le code personnalisé sont confirmés Pro.
4. **Catégories, filtres et tri** de la Kit Library et de la bibliothèque de blocs : non documentés dans les pages lues ; pas d'accès à l'interface.
5. **Pages non lues** : Configure Site Settings (corps), Prioritize conflicting styles / Editor V4 / Variables / éléments atomiques, Loop Item et Loop Grid, Style options for grid containers, popups (hors conditions), Custom Fonts, Custom Icons, Custom Code, Lightbox, Page Transitions, Maintenance Mode, guides sticky header, pages WooCommerce de modèles, API Theme Locations. Les informations sur ces sujets viennent uniquement de la matrice du dépôt, qui précise elle-même quelles lignes sont « déduites ».
6. **Dates et évolutions** : le centre d'aide change souvent (les dates « modifié » vont de 2024-01 à 2026-10) ; les menus mentionnent Editor V4 et de nouveaux outils d'IA dont les règles de style peuvent différer de celles décrites ici.
7. **Lecture par flux JSON** : le texte lu est le corps HTML converti en texte ; les images, captures et vidéos n'ont pas été vues.
8. **Références S10 et S20** : citées par titre ; aucune affirmation de fond ne repose uniquement sur elles. La page `kit-has-been-imported-what-to-do-next` a été lue mais regroupée sous S25 par commodité : une référence S34 distincte serait plus rigoureuse.
9. **Ce document ne modifie aucun code** de Kolakisa ; les décisions de la section E sont des propositions à arbitrer par l'équipe produit.

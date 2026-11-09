# Elementor / Elementor Pro : référence « Footer » (étude vérifiée)

Accès aux pages : 9 nov. 2026. Les numéros S/T/U renvoient à `ELEMENTOR_SOURCES.md`.
Niveaux : **CONFIRMÉE** (doc officielle lue) · **OBSERVÉE** (interface vue : *aucune dans cette étude*) · **DÉDUITE** · **NON VÉRIFIABLE**.
Étiquettes d'offre : **[Gratuit]** = Elementor de base · **[Pro]** = Elementor Pro · **[Tiers]** = extension d'un autre éditeur (rien de tiers n'est utilisé comme preuve ici).

Avertissement important : tout vient de pages officielles lues via un outil de résumé ; aucune interface Elementor n'a été ouverte. Les noms exacts des boutons peuvent différer d'une version à l'autre.

## 0. Fait nouveau à connaître : Elementor V4 (éditeur « atomique »)
* Elementor 4.0 est sorti stable le 30 mars 2026 ; « à partir d'avril 2026 tous les nouveaux sites tournent en V4 par défaut ». Les sites existants activent V4 à la main (Elementor > Editor > Settings > Atomic Editor). Le cœur reste gratuit. CONFIRMÉE (S30) ; date 4.0 : extrait de recherche seulement (T3).
* Les anciens widgets/containers v3 continuent de marcher avec les nouveaux éléments V4 sur la même page (« Nothing breaks »). CONFIRMÉE (S30). Si le Theme Builder fonctionne avec V4 : la FAQ ne le dit pas. NON VÉRIFIABLE.
* Conséquence : les documents d'aide montrent maintenant deux chemins (v3 : onglet Avancé ; v4 : onglet Style). Exemples : sticky (S20), masquer par appareil (S37).

## 1. Theme Builder : créer, gérer, publier
| Affirmation | Niveau | Source |
|---|---|---|
| Le Theme Builder est une fonction Pro ; un utilisateur gratuit voit les parties de site « qu'il aurait avec Pro ». Le tableau gratuit/Pro marque « Header & footer builder » : Pro. | CONFIRMÉE | S5, S10 |
| Types de modèles : Header, Footer, Global Pages and Posts, Global Archives, WooCommerce (produits et archives). | CONFIRMÉE | S5 |
| Accès : Elementor > Theme Builder (admin WP) ; depuis l'éditeur, logo en haut à gauche > Theme Builder ; raccourci Cmd/Ctrl+Maj+E. | CONFIRMÉE | S5 |
| Créer un footer : Theme Builder > « + » sur la carte Footer > la Bibliothèque de modèles s'ouvre ; on peut choisir un footer prêt à l'emploi ou la fermer et partir de zéro > on dessine > Publish > on choisit où il s'affiche. | CONFIRMÉE | S4, S16 |
| Modifier : carte du footer > Edit (contenu) ; Edit Conditions (où il s'affiche). | CONFIRMÉE | S4, S16 |
| Exporter : menu « trois points » de la carte > Export = fichier `.json`. Supprimer : trois points > Trash. Renommer : trois points > Rename. | CONFIRMÉE | S4, S16 |
| Importer : icône Import du Theme Builder, fichier `.json` ou `.zip` ; il faut avant activer « unfiltered uploads » (Elementor > Settings > Advanced). | CONFIRMÉE | S5 |
| **Dupliquer** un footer : aucune page lue ne décrit un bouton « Dupliquer » dans le Theme Builder. | NON VÉRIFIABLE | (absence dans S4, S5, S16) |
| Brouillon / publié : un modèle enregistré en **Draft** ou **Private** « n'apparaît pas sur le site public » ; il faut cliquer Publish. | CONFIRMÉE | S2 |
| Dépublier / autosave / historique de brouillon : non décrits dans les pages lues. (L'étude existante cite « révisions » et « annuler/rétablir » : « Revision History » et « Redo/Undo » figurent bien dans le tableau gratuit/Pro, S10, mais *pas* comme fonctions propres au footer.) | NON VÉRIFIABLE pour le footer | S10 |
| **Aperçu** : dans un modèle, l'engrenage en bas à gauche du panneau > « **Preview Dynamic Content As** » (type Post/Page/Media… puis un contenu précis). L'article l'appelle « Preview Panel », *pas* « Preview Settings ». Article de février 2024 : libellés possiblement changés. | CONFIRMÉE (page datée 2024) | S17 |
| Website Kits (« website templates ») : design complet (pages, formulaires, popups). « La plupart incluent un header ; certains aussi un footer (coordonnées, plan du site, réseaux sociaux) ». Installation : assistant au démarrage, ou Elementor > Editor > Templates > Website Templates. Gratuit ou Pro : l'article ne le dit pas. | CONFIRMÉE (contenu) / NON VÉRIFIABLE (plan) | S35 |
| Nombre de footers dans la bibliothèque : aucune source officielle chiffrée. Le site annonce « 300+ templates/kits » au total (moteur de recherche, T3 ; non relu en page). Les footers viennent surtout comme parties de kits. | NON VÉRIFIABLE (nombre par footer) | S10, S35 |
| L'article d'aide Hello Biz décrit un footer en 3 zones (Marque / Navigation / Contact) ; Hello Biz va passer en « maintenance », Elementor recommande Hello. | EXTRAIT seulement | T2 |

## 2. Conditions d'affichage (Theme Builder)
Source principale : S1 (mis à jour 1 oct. 2026).
* Réglage par défaut = toutes les pages ; sinon menu de gauche **Include / Exclude**, menu de droite = la cible. **CONFIRMÉE**
* Options listées : **Entire Site** ; **Singular** (All Singular, Front Page, Posts avec In Category / In Child Categories / In Tag / Posts by Author, Pages, Page by Author, Landing Pages, Floating buttons, Media, Direct child of, Any Child of, By Author, 404 Page) ; **Archives** (Author, Date, Search Results, Posts Archive, Categories, Direct Child Category of, Any Child Category of, Tags) ; **WooCommerce** (All Product Archives, Shop Page, Search Results, Product Category, Product Tags, Products, In Category, In Child Product Categories, In Tag, Products by Author). **CONFIRMÉE**
* Plusieurs conditions sur un même modèle (exemple : catégories Chemises + Pantalons). **CONFIRMÉE**
* **Conflit** : « si une nouvelle condition chevauche celle d'une autre partie du site, un avertissement s'affiche » (exemple : deux headers sur toutes les pages). **CONFIRMÉE**
* **Priorité / spécificité** (quel footer gagne si plusieurs correspondent) : *non expliquée* par S1. L'étude existante dit déjà « non écrite » : exact. Ne pas inventer une règle. **NON VÉRIFIABLE**
* Modifier plus tard : ouvrir le modèle > flèche à côté de Publish > Display Conditions. **CONFIRMÉE** (S1) ; le bouton « Edit Conditions » de la carte aussi (S4).
* Sans condition, le Theme Builder « ne sait pas où l'afficher ». Pour un footer global : **Entire Site**. **CONFIRMÉE** (S2)
* Ne pas confondre : les « Display Conditions » de l'onglet Avancé d'un *élément* (rôle d'utilisateur, titre de page, dates…) sont une autre fonction ; elles ne gèrent pas la visibilité par taille d'écran. **CONFIRMÉE** (S37, S31). L'étude existante les classe « hors périmètre » : cohérent.

## 3. Construction
| Sujet | Ce qui est établi | Niveau | Source |
|---|---|---|---|
| Container Flexbox | « Content Width » : **Boxed** (le contenu se redimensionne, le conteneur garde sa taille) ou **Full Width** (le contenu suit la largeur du conteneur). Largeur/hauteur en px, %, unités d'écran ; Min Height ; Overflow (Default/Hidden/Auto) ; **HTML Tag** (dont « a » = conteneur cliquable). Le Container et le Grid sont des widgets **gratuits** (liste gratuite). | CONFIRMÉE | S14, S11 |
| Container Grid | Présent dans la liste gratuite ; aucune page d'aide Grid lue (réglages non documentés ici). | CONFIRMÉE (existence) / NON VÉRIFIABLE (réglages) | S11 |
| Sections/colonnes (ancien) | « Columns » figure dans la liste gratuite ; cet ancien modèle n'est pas détaillé dans les pages lues. | NON VÉRIFIABLE (détail) | S10 |
| Onglet Avancé d'un élément | Layout (marges, padding, largeur, order, z-index, ID/classes CSS, Display Conditions) ; Motion Effects ; Transform ; Background ; Border (rayon, **Box Shadow**) ; Mask ; Responsive (Hide On Desktop/Tablet/Mobile) ; **Attributes [Pro]** ; **Custom CSS [Pro]**. | CONFIRMÉE | S31 |
| Arrière-plan | Classique ou dégradé (onglet Avancé, états normal/survol). **Overlay** et **Gradient** sont dans la liste gratuite (« Background Overlay », « Background Gradient Effect »). Vidéo / diaporama / image : aucune page lue ne les détaille. | CONFIRMÉE (dégradé, overlay) / NON VÉRIFIABLE (vidéo, diaporama) | S31, S10 |
| Ombres | « Box Shadow » et « Text Shadow » : **[Gratuit]** | CONFIRMÉE | S10 |
| Motion Effects | Scrolling Effects (vertical, horizontal, transparence, flou, rotation, échelle), Mouse Effects (Mouse Track, 3D Tilt, bureau seulement), Sticky, Entrance Animation. « Part of Elementor Pro » ; Scrolling Effects et Sticky marqués « Pro Only ». Entrance Animation est dans la liste gratuite. Elementor respecte la préférence système « réduire les animations » : les effets sont désactivés pour ce visiteur. | CONFIRMÉE | S19, S31, S10 |
| Sticky | v3 : Avancé > Motion Effects > Sticky (Top/Bottom), appareils choisis, offset. v4 : Style > Position > Sticky. L'article ne mentionne pas les footers et ne dit pas « Pro » dans son texte (« Pro Only » dans S31). Un footer collant n'est donc *pas* documenté. | CONFIRMÉE (mécanisme) / NON VÉRIFIABLE (cas footer) | S20, S31 |
| CSS personnalisé | **[Pro]** (« Custom CSS (Pro Only) »). Mot-clé `selector` = l'élément lui-même ; Elementor conseille de l'utiliser « pour des éléments individuels, pas pour du CSS de page ou de site ». | CONFIRMÉE | S31, S15 |
| Custom Code (site) | Nommé comme fonction Pro (« Theme Builder, Popup Builder, custom code & CSS ») dans la page marketing ; non détaillé. | EXTRAIT marketing / NON VÉRIFIABLE (détail) | recherche |
| Tutoriel officiel | Footer type : conteneur parent Full Width (2 colonnes 60 %/40 %, hauteur en vh, fond, padding) + conteneur « copyright » en dessous ; colonne gauche = 4 Text Editor (titre H3 + liens) ; colonne droite = Site Logo, Text Editor, Search ou Form, Heading (balise p), Social Icons. Responsive : activer **Wrap** et mettre chaque enfant à 100 %. | CONFIRMÉE | S29 |

## 4. Widgets
Voir `ELEMENTOR_WIDGET_INVENTAIRE.md` (tableau complet). Points forts :
* **[Gratuit]** : Heading, Text Editor, Image, Button, Icon, Icon List, Social Icons, Divider, Spacer, Counter, Tabs, Accordion, Toggle, HTML, Shortcode, Menu Anchor, Sidebar, Alert… (S10, S11).
* **[Pro]** : Site Logo, Site Title, Nav/WordPress Menu, Menu (nouveau), Search, Form, Login, Sitemap, Breadcrumbs, Posts/Loop Grid, Post Info, Share Buttons, Countdown, Template, Global Widget, Off-Canvas (⚠ voir ci-dessous), WooCommerce (Menu Cart…).
* Discordance à signaler : la liste « gratuite » du *tableau d'aide* (S10) contient « Off Canvas » ; la page *widgets Pro* (S11) classe « Off-Canvas » chez Essential Pro. Les deux sont officielles et datées 2026 : **contradiction non résolue** ; ne pas compter dessus.
* Discordance 2 : le tableau (S10) marque « Menu Cart » comme Pro « Advanced et plus » ; S11 le range dans les widgets WooCommerce des paliers Advanced/Expert : **cohérent**.

## 5. Responsive
* Par défaut : bureau > 1024 px ; tablette 767–1024 px ; mobile < 767 px. « Points de rupture 1024 px (tablette) et 767 px (mobile) ». On ne peut pas supprimer ces deux-là. CONFIRMÉE (S3)
* Personnalisation : Site Settings > Layout > Breakpoints ; champ en px ; Save Changes. CONFIRMÉE (S3)
* Points supplémentaires : « Active Breakpoints » > « + » > **six options** (Mobile, Mobile Extra, Tablet, Tablet Extra, Laptop, Widescreen). Fonction « Additional Custom Breakpoints » classée **stable** (S26). Tous sont en `max-width` *sauf Widescreen* (`min-width`) ; si Widescreen est actif, le bureau est limité à « valeur Widescreen − 1 px ». CONFIRMÉE (S3, S24, S26)
* **Valeurs par défaut de Laptop / Tablet Extra / Mobile Extra / Widescreen** : la doc développeur dit explicitement ne pas lister de valeurs. Les blogs tiers donnent 1366 et 2400 mais se contredisent. **NON VÉRIFIABLE** (à lire dans l'interface). Ces valeurs de l'étude existante : à ne pas reprendre sans vérification.
* Masquer par appareil : v3 Avancé > Responsive > Hide On Desktop / Tablet Portrait / Mobile Portrait ; v4 Style > Layout > Display = None dans la vue de l'appareil. CONFIRMÉE (S31, S37)
* Un footer masqué par erreur sur un appareil est une cause classique de « footer absent ». CONFIRMÉE (S2)
* Ordre/empilement : tutoriel S29 = Wrap + largeur 100 % + ordre dans l'onglet Avancé (« Order »). CONFIRMÉE

## 6. Styles globaux et isolation
Détail dans `ELEMENTOR_ISOLATION_STYLES.md`. Résumé :
* Site Settings = Design System (couleurs et polices globales : Primary, Secondary, Text, Accent, modifiables et extensibles) + Theme Style (Typography, Buttons, Form Fields, Images). CONFIRMÉE (S6, S9)
* Priorité décrite : Global Colors/Fonts (variables CSS) > Theme Style (« repli si aucune définition d'élément »). Surcharge directement sur un widget/conteneur : non décrite en toutes lettres dans S7. DÉDUITE (comportement CSS normal)
* Variables : `--e-global-color-primary|secondary|text|accent` (et `--e-global-color-<id>` pour les couleurs ajoutées). CONFIRMÉE (code officiel, S36)
* « Disable Default Colors / Fonts » (Elementor > Settings > General) : « les couleurs et polices du thème deviennent celles par défaut ». CONFIRMÉE (S8)
* Hello (thème d'Elementor) : réglages pour retirer header+footer du thème, `reset.css`, `theme.css`. CONFIRMÉE (S28)
* « Optimized Markup » : expérience **alpha**, « ne pas utiliser en production » ; 1 enveloppe `<div>` par widget au lieu de 2 ; classe `.elementor-widget-container` obsolète. CONFIRMÉE (S27, daté nov. 2024 : l'état actuel n'est pas vérifié).

## 7. Rendu public
* Le thème appelle `elementor_theme_do_location( 'footer' )` ; si Elementor ne fournit rien, il charge son footer d'origine. Le code officiel (S22) :
  `if ( ! function_exists('elementor_theme_do_location') || ! elementor_theme_do_location('footer') ) { get_template_part('template-parts/footer'); } wp_footer();` CONFIRMÉE
* Pour que ça marche, le thème doit déclarer ses emplacements (`elementor/theme/register_locations`, `register_all_core_location()`). CONFIRMÉE (S22). Elementor peut éditer header et footer sur la plupart des thèmes ; les autres emplacements demandent l'API Theme Locations. CONFIRMÉE (S21)
* Si on ne remplace qu'un des deux, des balises peuvent rester ouvertes (un thème ouvre souvent un `div` dans le header et le ferme dans le footer) : Elementor conseille de remplacer **les deux**. CONFIRMÉE (S21)
* Balise `<footer>` : **réglage manuel** : Footer Settings (engrenage du haut) > HTML Tag = `footer`, pour les lecteurs d'écran. Ce n'est donc pas posé automatiquement dans la doc lue. CONFIRMÉE (S4, S16) ; l'étude existante dit « posée automatiquement » : **corrigé** (voir §9). Chaque conteneur a aussi une liste « HTML Tag » (S14).
* Absence de footer : conditions, mise en page « Canvas » (cache volontairement header/footer), brouillon/privé, masqué par appareil, cache. CONFIRMÉE (S2)
* Doublons : la doc lue ne parle pas explicitement de doublons ; le risque vient d'un thème qui imprime son propre footer (voir Hello : « Disable theme header & footer », S28). DÉDUITE
* Différence aperçu/publié : brouillon invisible en ligne (S2) ; l'aperçu dynamique utilise « Preview Dynamic Content As » (S17). Le détail de rendu aperçu ≠ publié n'est pas documenté. NON VÉRIFIABLE
* HTML exact rendu par Elementor Pro autour du footer : source tierce bloquée (U5). NON VÉRIFIABLE

## 8. Modèles fournis
* Une Bibliothèque de modèles s'ouvre à la création ; on y trouve des footers prêts à l'emploi ou on la ferme. CONFIRMÉE (S4)
* Les « Pro Templates » sont marqués Pro dans le tableau (S10). Nombre exact de footers, styles : **NON VÉRIFIABLE** (nécessite d'ouvrir la bibliothèque avec un compte Pro).

## 9. Existant `docs/footer-builder/ELEMENTOR_FOOTER_*.md` : confirmé / corrigé / infirmé
Comparaison faite avec `ELEMENTOR_FOOTER_SYNTHESE.md` et des passages de `…RESPONSIVE_ET_ANIMATIONS.md` et `…WIDGETS.md` (les 7 fichiers n'ont pas été relus ligne à ligne).

**Confirmé**
* Footer = modèle Theme Builder Pro, inclure/exclure, export `.json`. (S4, S5, S10)
* Points de rupture 1024/767, non supprimables, six points optionnels via Site Settings > Layout > Breakpoints. (S3)
* Copyright : Current Date and Time, format personnalisé « Y », © dans « Before », texte dans « After » ; sans Pro, texte tapé. (S29)
* Respect de « reduced motion ». (S19)
* Priorité entre footers : non écrite. (S1)
* HTML/Shortcode, CSS perso : fonctions Pro avancées ; Custom CSS et Attributes « Pro Only ». (S31)

**Corrigé / nuancé**
* « Balise `footer` posée automatiquement [C] » : la doc dit qu'il faut **choisir** HTML Tag = footer dans Footer Settings. Corrigé.
* « Aperçu non décrit » : en fait décrit sous le nom **Preview Dynamic Content As** (S17), mais article de 2024.
* « Sticky ne serait documenté que pour l'en-tête » : l'aide sticky est générale (conteneur/widget) et ne cite aucun type de partie de site (S20) ; un footer collant n'est ni documenté ni interdit.
* « Points de rupture 1024/767 » : exact, mais « tablette portrait entre 767 et 1024 » : l'aide parle de « moins de 767 px » pour mobile ; la limite 767/768 varie selon les sources.
* « Pied collant, Lottie, Off Canvas… » : Off-Canvas est classé gratuit dans une page et Pro dans une autre (S10 vs S11).
* Le futur « Elementor V4 » n'apparaît pas dans l'existant.

**Infirmé**
* Aucun point franchement faux relevé sur ce que j'ai comparé, hormis la balise automatique ci-dessus.

**Toujours non confirmé**
* Brouillon = pastille grise, en ligne = pastille verte ; HTML/Shortcode « limités aux administrateurs » ; « autosave » ; accessibilité interne des widgets. Je ne les ai pas retrouvés dans les pages lues.

## 10. Choses non vérifiables (liste sèche)
1. Règle de priorité entre plusieurs footers publiés.
2. Bouton « Dupliquer » du Theme Builder.
3. Valeurs par défaut Laptop / Tablet Extra / Mobile Extra / Widescreen.
4. Réglages du Grid Container, arrière-plan vidéo et diaporama (pages non lues).
5. Nombre et style des footers de la bibliothèque.
6. HTML exact rendu pour un footer Pro (source bloquée).
7. Fonctionnement du Theme Builder avec les éléments V4.
8. Off-Canvas : gratuit ou Pro (sources contradictoires).
9. Comportement des conditions à l'import d'un footer.
10. Toute observation « dans l'interface » : aucune effectuée.

# Architecture du Footer Builder d'Elementor — référence pour Kolakisa

Document de référence (aucun code). Rédigé le 7 novembre 2026. Il dépasse `docs/theme-builder/elementor-footer-reference.md` (3 nov. 2026) : on y ajoute les conditions complètes, les dépendances Pro/gratuit, les cas limites (Canvas, WPML, thème incompatible), la sauvegarde, les révisions et l'import/export, le tout relu à la source.

## Légende de fiabilité
* **[C]** confirmé : l'article officiel a été lu pour ce document (corps complet, voir §12).
* **[O]** observé / déduit : conséquence logique d'un point [C], ou lu dans une doc interne du projet, mais pas écrit tel quel par Elementor.
* **[N]** non vérifiable : non trouvé dans les articles lus. Ne pas le traiter comme un fait.
* **[K]** choix propre à Kolakisa (recommandation, pas un fait Elementor).

> Méthode : le centre d'aide d'Elementor renvoie un menu vide à un lecteur de pages classique. Les articles ont donc été lus par l'interface publique du site (`elementor.com/help/wp-json/wp/v2/posts?slug=…`), qui donne le même texte que la page. Aucune interface Elementor réelle n'a été ouverte : **rien n'est marqué « observé dans l'éditeur »**.

## 1. Ce qu'est le Footer dans Elementor

* **[C]** Le Theme Builder crée des « parties de site » (site parts) : des modèles qui *s'ajoutent à* ou *remplacent* la hiérarchie des modèles du thème WordPress, ses réglages de mise en page et son CSS. Parties citées : En-tête, Pied de page, Pages et Articles globaux, Archives globales, Produits et Archives de produits WooCommerce.
* **[C]** Le pied de page « apparaît en bas de la plupart des pages » ; en général **un pied standard pour tout le site**, certaines pages pouvant n'en avoir aucun ou un spécifique.
* **[C]** Le Theme Builder liste tous les pieds créés et permet d'en ajouter, modifier, supprimer.
* **[C]** Le pied est un modèle Elementor comme les autres : on le conçoit dans l'éditeur visuel avec les mêmes widgets et conteneurs que pour une page.

## 2. Accès au Theme Builder [C]

1. Menu WordPress : Elementor > Theme Builder.
2. Dans l'éditeur d'une page/article : logo en haut à gauche du panneau > Theme Builder.
3. Raccourci : Cmd+Maj+E (Mac) / Ctrl+Maj+E (Windows), depuis n'importe quel écran.

## 3. Tableau de bord

* **[C]** Utilisateur gratuit : il voit quelles parties existeraient avec Pro. Utilisateur Pro : ses parties existantes, vignettes générées automatiquement.
* **[C]** Une « image mise en avant » affectée à la partie sert de vignette à la place de la vignette automatique.
* **[C]** Sans partie construite : vignettes par défaut pour chaque type disponible.
* **[C]** Pastille en haut à gauche de la carte : **verte = en ligne (des conditions d'affichage existent)** ; **grise = brouillon (aucune condition)**.
* **[C]** Étiquette « Instances » (en bas à gauche) : où le modèle est utilisé sur le site.
* **[C]** Ajout : « Add New » (haut droite), « + » au survol de l'étiquette latérale, « + » sur la vignette, ou icône Import.
* **[C]** Menu « trois points » de la carte : Export (fichier `.json`), Trash (fenêtre de confirmation « Move to Trash »), Rename (fenêtre « Rename Part », boutons Change/Cancel).
* **[C]** Duplication d'une partie : **non décrite** dans les articles de pied de page/Theme Builder lus → **[N]**.

## 4. Création d'un pied (parcours officiel) [C]

1. Elementor > Theme Builder.
2. Dans le volet de droite, « + » sur la carte **Footer**.
3. La **bibliothèque de modèles** s'ouvre. Option : choisir un pied tout fait, ou la fermer pour partir de zéro.
4. Concevoir le pied dans l'éditeur Elementor.
5. **Publish** enregistre le pied et **ouvre la fenêtre des conditions** (« où doit-il apparaître ? »).

Modification : carte du pied > **Edit** (contenu) ou **Edit Conditions** (pages d'affichage). Depuis l'éditeur : flèche à côté de « Publish » > « Display Conditions » **[C]**.

## 5. Réglage « Footer Settings » et accessibilité

* **[C]** Barre du haut de l'éditeur : icône « Footer Settings » > liste « HTML Tag » > choisir `footer`. Cette balise « identifie le pied aux lecteurs d'écran et est une partie importante de l'accessibilité ».
* **[C]** (Un conteneur peut aussi recevoir une balise HTML choisie : `a`, etc. — voir fichier Conteneur.)
* **[N]** Liste complète des autres réglages du panneau « Footer Settings » (on sait seulement que le panneau existe et contient HTML Tag).
* **[K]** Kolakisa : la balise `footer` devrait être posée automatiquement (`<footer>` + `role="contentinfo"` par défaut) ; le projet note qu'aujourd'hui le modèle rend un `div` (limite connue, voir `elementor-footer-reference.md`).

## 6. Rendu public, priorité et « un seul footer »

* **[C]** Un pied publié avec conditions remplace le pied du thème sur les pages concernées. Un pied en brouillon ou en « Private » **n'apparaît pas** sur le site public.
* **[C]** Conflit : si les conditions d'un modèle entrent en conflit avec un autre modèle de même type (exemple officiel : deux en-têtes sur « toutes les pages »), **un avertissement s'affiche** au moment de définir la condition.
* **[N]** La règle exacte de priorité (quel pied gagne quand plusieurs correspondent) n'est **pas écrite** dans les articles lus. Elementor ne publie pas de barème. Ne pas inventer.
* **[K]** Kolakisa a défini son propre barème (le plus précis gagne ; exclusion > inclusion ; égalité : le plus récemment publié puis plus petit identifiant) dans `ELEMENTOR_DISPLAY_CONDITIONS.md`. Il est cohérent avec l'avertissement d'Elementor mais **n'est pas un fait Elementor**. Un seul pied est rendu par page.
* **[C]** Mise en page de page « Elementor Canvas » : **supprime en-tête, pied et barres latérales** (voulu : pages d'atterrissage, « bientôt disponible », maintenance). Pour un pied absent sur une seule page : mettre « Page Layout » sur Default ou Elementor Full Width.
* **[C]** Mise en page « Elementor Canvas » peut aussi être le défaut du site : logo Elementor > Site Settings > Layout > Page Layout.

## 7. Compatibilité avec le thème

* **[C]** Le Theme Builder fonctionne avec tout thème respectant les standards WordPress ; les thèmes peuvent déclarer des « emplacements » via l'API « Theme Locations » d'Elementor.
* **[C]** Recommandation officielle : **concevoir l'en-tête ET le pied ensemble**. Raison : certains thèmes ouvrent une balise `div` dans l'en-tête et la ferment dans le pied ; remplacer un seul des deux peut casser la mise en page.
* **[K]** Kolakisa : l'en-tête et le pied sont rendus par le même gestionnaire, donc ce risque n'existe pas ; à conserver dans le test « un seul des deux est publié ».

## 8. Dépendances Pro / gratuit

| Fonction | Statut | Fiabilité |
|---|---|---|
| Header & footer builder (Theme Builder) | Pro (colonne « Core » vide, toutes les offres payantes cochées) | [C] |
| Bibliothèque de modèles, import/export de modèles, aperçu mobile, historique des révisions, annulation/rétablissement | Gratuit (Core) | [C] |
| Widgets Image, Titre, Texte, Bouton, Icône, Boîte d'icône/d'image, Réseaux sociaux, Liste d'icônes, Séparateur, Espaceur, Compteur, Barre de progression, Onglets, Accordéon, Bascule, Témoignage, HTML, Shortcode, Ancre de menu, Google Maps, Vidéo | Gratuit | [C] |
| Nav Menu, Site Logo, Site Title, Page Title, Share Buttons, Formulaire, Post Navigation, Lottie, Login, Animated Headline | Pro | [C] |
| Menu Cart, Custom CSS, Custom Code, attributs personnalisés, formulaires intégrés, WooCommerce Builder | Pro offre « Advanced » et au-dessus | [C] |
| Animation d'entrée, animation au survol, ombres, forme de séparation, fond dégradé, Off Canvas | Gratuit | [C] |
| Effets de défilement (Scrolling Effects), sticky | Pro | [C] |
| Étiquettes dynamiques de base (WordPress natif) | Offre Essential et plus | [C] |
| Intégrations ACF / Toolset / Pods | Advanced et plus | [C] |

Remarque : le tableau officiel de comparaison marque le « Custom CSS » en Advanced+, alors que l'article de l'onglet Avancé dit seulement « Pro only » → les deux sont compatibles ; on retient « Advanced+ » **[C]**.

## 9. Sauvegarde, brouillon, publication

* **[C]** Bouton rose « **Publish** » = le modèle est un brouillon ; bouton « **Update** » ou grisé = déjà publié.
* **[C]** « Publish » = enregistrer + ouvrir les conditions la première fois.
* **[C]** Un modèle « Draft » ou « Private » n'apparaît jamais sur le site public.
* **[C]** Les conditions d'un élément (Display Conditions de widget) ne prennent effet qu'après « Save » ou « Publish » de la page.
* **[C]** Dépannage « Publish/Update ne marche pas » : sections erronées, limite de mémoire PHP, trop de révisions stockées, HTTP/HTTPS, plugin de sécurité (erreur 403), pare-feu serveur.
* **[N]** Enregistrement automatique (autosave) : aucun article lu n'en décrit le fonctionnement. Seul l'article « changes don't appear online » existe pour le cache et n'a pas été lu. Ne rien affirmer.
* **[N]** Bouton « Preview Changes » et « Save as Draft » : cités par habitude, pas dans les articles lus ; marquer **[N]**.

## 10. Révisions et historique

* **[C]** Panneau Historique : deux onglets **Actions** (chaque action de la session d'édition en cours, retour en arrière en cliquant) et **Revisions** (versions enregistrées/publiées : une révision est créée à **chaque enregistrement ou publication**).
* **[C]** Annuler : Ctrl/Cmd+Z ; rétablir : Ctrl/Cmd+Maj+Z.
* **[C]** Le nombre de révisions est régi par WordPress (`WP_POST_REVISIONS` dans `wp-config.php`), pas par Elementor. Sur l'hébergement Elementor : seules les **25 dernières** sont conservées.
* **[C]** Trop de révisions peut épuiser la mémoire et empêcher l'enregistrement.

## 11. Import / export

* **[C]** Export d'un pied : carte > ⋯ > Export > fichier `.json`.
* **[C]** Import d'une partie : icône Import du Theme Builder > glisser un `.json` ou `.zip`. **Prérequis : « unfiltered uploads » activés** (Elementor > Settings > Advanced) et **API REST active** (sinon l'écran Theme Builder ne marche pas et affiche une erreur).
* **[C]** Un Theme Builder ne s'exporte pas comme un thème WordPress autonome ; on migre avec l'outil « Website Templates » (Elementor > Editor > Tools > Website Templates > Export) qui propose : Contenu, **Modèles** (en-têtes, pieds, parties du Theme Builder, widgets globaux), Réglages (couleurs/polices globales, style du thème, mise en page, lightbox, arrière-plans), fichiers personnalisés (polices, icônes, code — Pro), thème, extensions. Sortie : zip ou « Save to library » (cloud).
* **[C]** Bibliothèque de modèles : insérer un modèle, importer un `.json`/`.zip`, favoris (cœur), exporter un modèle enregistré (⋯ > Export).
* **[K]** Kolakisa : n'accepter qu'un `.json` au schéma validé, sans identifiants de site, sans code exécutable (déjà décidé dans `ELEMENTOR_TEMPLATE_LIFECYCLE.md`).

## 12. Traductions (WPML)

**[C]** Pour le Theme Builder avec WPML : ne pas utiliser le « + » pour la 2e langue ; créer un nouveau modèle puis le **lier** au modèle principal. Les **conditions doivent exister uniquement sur le modèle de la langue principale**, et la taxonomie de la langue secondaire doit être liée à la principale.

## 13. Limites et cas particuliers (récapitulatif)

| Cas | Comportement | Fiab. |
|---|---|---|
| API REST désactivée | Theme Builder inutilisable, message d'erreur | [C] |
| Import sans « unfiltered uploads » | Import incorrect | [C] |
| Page en mise en page Canvas | Aucun pied | [C] |
| Pied jamais publié ou « Private » | Invisible au public | [C] |
| Éléments masqués « Hide on desktop/tablet/mobile » | Pied absent sur cet appareil | [C] |
| Conditions mal posées (pas « Entire Site » pour un pied global) | Pied du thème affiché | [C] |
| Cache serveur/plugin | Ancienne version affichée, à vider | [C] |
| Thème qui ouvre un `div` dans l'en-tête | Mise en page cassée si un seul des deux est remplacé | [C] |
| Page 404 | Condition « 404 Page » existe | [C] |
| Limite du nombre de conditions par modèle | non documentée | [N] |
| Résultat quand une page correspond à une inclusion ET une exclusion | non documenté | [N] |
| Suppression : modèle encore utilisé | non documenté | [N] |

## 14. Articles réellement lus (identifiants du centre d'aide)

`footer-site-part` (modifié 27/01/2026) · `the-elementor-theme-builder` (15/09/2026) · `conditions` (01/10/2026) · `creating-a-footer-template-with-the-container` · `how-to-fix-a-missing-header-or-footer-in-elementor` · `considerations-for-theme-builder-compatibility` · `using-elementor-pros-theme-builder-templates-with-wpml` · `using-elementors-canvas-page-template` · `revision-history-undo-and-redo` · `how-many-versions-of-a-post-does-elementor-store` · `publish-update-button-not-work` · `import-and-export-elementor-website-templates` · `what-is-import-export` · `template-library` · `elementor-pro-vs-free` — tous sous `https://elementor.com/help/<identifiant>/`.

# Elementor : héritage, surcharge et isolation des styles

Accès : 9 nov. 2026. S/T/U : voir `ELEMENTOR_SOURCES.md`. Aucune interface ouverte ; aucun inspecteur de page réelle utilisé : tout ce qui touche au CSS généré en pratique est DÉDUIT sauf mention.

## 1. Les couches de style (de la plus faible à la plus forte)
1. **Thème WordPress / navigateur / plugins** : s'appliquent aux éléments qu'Elementor ne style pas. « Les éléments sans style dans Theme Style ni dans les globaux peuvent hériter du thème, du navigateur ou d'un plugin. » CONFIRMÉE (S7)
2. **Theme Style** (Site Settings) : Typography, Buttons, Form Fields, Images. « Repli, seulement si aucune définition d'élément n'a été faite. » CONFIRMÉE (S6, S7). Sert surtout aux éléments *non-Elementor* (champs de caisse WooCommerce, libellés Contact Form 7). Pour qu'il s'applique aussi aux widgets Elementor, il faut d'abord désactiver les couleurs/polices par défaut d'Elementor. CONFIRMÉE (S9)
3. **Global Colors / Global Fonts** (Design System) : couleurs Primary, Secondary, Text, Accent et typographies équivalentes, modifiables, extensibles. « Couches supplémentaires qui utilisent des variables CSS » et qui **prennent le pas sur Theme Style**. CONFIRMÉE (S6, S7)
4. **Réglage direct sur le widget / conteneur** (valeur propre ou lien vers un global) : non décrit noir sur blanc dans S7, mais c'est le comportement normal d'un réglage d'élément. DÉDUITE
5. **CSS personnalisé [Pro]** (Avancé > Custom CSS) avec le mot-clé `selector` ; Elementor conseille de le réserver à l'élément. CONFIRMÉE (S15, S31)

## 2. Ce qui est généré (CSS et variables)
* Variables des couleurs globales : `--e-global-color-primary`, `-secondary`, `-text`, `-accent` (le motif est `--e-global-color-{{_id}}`). CONFIRMÉE (code officiel, S36). Pour des couleurs ajoutées par l'utilisateur, la forme de l'identifiant n'est pas visible dans ce fichier : NON VÉRIFIABLE.
* Typographies globales : même principe par analogie (`--e-global-typography-…`) : **DÉDUITE, non lue**.
* Classes `.elementor-element-<id>` et fichiers CSS par publication : **non lus dans une source officielle de cette étude** → NON VÉRIFIABLE ici. (Les pages de dépannage mentionnent « régénérer les fichiers CSS » via Elementor > Editor > Tools > Clear Files & Data, S2 : cela suggère des fichiers CSS générés, confiance DÉDUITE.) Le réglage « CSS Print Method » (feuille externe ou dans chaque page) est cité dans un extrait de recherche seulement (T4).
* Enveloppes d'un widget : par défaut `.elementor-widget` + `.elementor-widget-container` ; avec l'expérience **Optimized Markup** (alpha en nov. 2024, « ne pas utiliser en production »), une seule enveloppe ; `.elementor-widget-container` devient obsolète. Six widgets gardent l'enveloppe interne : Spacer, Menu, Loop, TOC, Form, Hotspot. CONFIRMÉE (S27, daté ; statut actuel non vérifié).

## 3. Indépendance par rapport au thème actif
* Elementor Pro Theme Builder fonctionne avec « tout thème qui suit les standards WordPress », mais l'intégration dépend du thème. CONFIRMÉE (S21)
* Si le thème n'est pas connu comme compatible : créer **header ET footer** dans le Theme Builder (balises `div` ouvertes dans l'un et fermées dans l'autre sinon). CONFIRMÉE (S21)
* Le thème choisit l'emplacement : `elementor_theme_do_location('footer')` ; sinon il imprime son footer. CONFIRMÉE (S22)
* **Hello** (thème d'Elementor) est le thème « neutre » : réglages pour retirer header+footer du thème, `reset.css`, `theme.css`, la méta-description, le lien d'évitement (skip link), le titre de page. Tout est désactivé par défaut (rien n'est retiré tant qu'on ne coche pas). CONFIRMÉE (S28)
* **Disable Default Colors / Fonts** : rend les couleurs et polices du *thème* prioritaires sur celles d'Elementor : c'est l'inverse de l'isolation. CONFIRMÉE (S8). À retenir : Elementor propose de choisir **qui gagne** (Elementor ou le thème), il ne crée pas d'isolation étanche (pas de Shadow DOM).
* Thème « classique » qui contamine : Elementor ne documente pas officiellement de mécanisme d'isolation de ses footers contre les styles d'un thème tiers. Les articles disent seulement que les éléments non stylés héritent du thème (S7). Les conflits (marges, polices de liens, tailles de titres) sont donc possibles. DÉDUITE.
* Page en mise en page **Canvas** : Elementor cache volontairement header et footer. CONFIRMÉE (S2)

## 4. Elementor V4 (classes et variables)
* V4 (stable 30 mars 2026, par défaut pour les nouveaux sites) repose sur « une architecture atomique, CSS d'abord » avec Classes, Variables, Interactions et Components. CONFIRMÉE (S30)
* Les variables V4 peuvent être synchronisées avec les anciens Global Colors/Fonts ; classes limitées à 1000 ; import/export de classes et variables en ZIP complet. EXTRAIT de recherche (T3), pas relu en page.

## 5. Ce que Kolakisa peut en retenir
1. **Hiérarchie claire** : styles par défaut du site < styles globaux (variables) < réglage de l'élément < CSS perso. Pour une bibliothèque de footers indépendants, la couche « styles du thème » doit être neutralisée, car Elementor lui-même ne l'isole pas.
2. **Variables nommées par rôle** (`primary/secondary/text/accent`) : modèle simple et éprouvé ; Kolakisa peut proposer des variables locales au footer plutôt que globales au site.
3. **Offrir le choix** « Footer indépendant » (ses propres couleurs/polices) ou « Hérité du site » : Elementor n'offre qu'un interrupteur global (Disable Default Colors/Fonts), pas un choix par footer.
4. **`selector`** : mot-clé qui cible l'élément lui-même : idée utile pour un CSS perso limité au footer (portée automatique), sans écrire d'identifiant.
5. **Footer = remplacement du thème, avec secours** (`function_exists` + `get_template_part`) : à copier pour ne jamais produire de page sans footer.

## 6. Pièges documentés ou probables
* Footer qui ne s'affiche pas : conditions absentes, Canvas, brouillon/privé, masqué par appareil, cache (S2). CONFIRMÉE
* Remplacer seulement header **ou** footer : balises déséquilibrées (S21). CONFIRMÉE
* Deux footers (le thème + Elementor) : possible si le thème n'est pas compatible ; Hello permet de retirer le sien (S28). DÉDUITE
* CSS qui cible `.elementor-widget-container` : casse avec Optimized Markup (S27). CONFIRMÉE
* Mélanger v3 et v4 : autorisé (« Nothing breaks », S30) mais deux chemins de réglage (Avancé vs Style) : risque de confusion en documentation.
* Les 'sticky' et mouvements : le visiteur avec « réduire les animations » n'a aucun effet de mouvement (S19). CONFIRMÉE

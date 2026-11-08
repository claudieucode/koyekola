# Elementor — système de styles (couleurs, polices, héritage, remplacements)

**Statut des sources (8 novembre 2026).** Les pages d'aide « Global Colors » et « Global Fonts » ont été demandées aujourd'hui : le serveur a renvoyé la page d'accueil du site, **sans article** (aucune information obtenue). La page « Site Settings » a été lue, mais seulement en partie : le début est un menu de navigation, le reste est un résumé généré, pas le texte. Aucune interface Elementor n'a été observée. Légende : **C** confirmé par un texte lu, **R** résumé de page non littéral, **D** déduit (connaissance générale, non revérifiée), **N** non vérifiable.

## 1. Ce qui est établi
| Point | Contenu | Statut |
|---|---|---|
| Panneau « Site Settings » | Design System : couleurs globales prédéfinies (Primary, Secondary, Text, Accent) + couleurs personnalisées ; styles de texte globaux prédéfinis + personnalisés. Theme Style : styles par défaut des éléments HTML (typographie, boutons, images, champs de formulaire, en-tête/pied). Settings : identité du site, arrière-plan, mise en page (polices génériques, largeur de contenu, espacement par défaut des widgets, modèle de page par défaut), lightbox, transitions de page, CSS personnalisé | R |
| Rôle du Theme Style | Réglages par défaut, utilisés **en dernier recours** quand l'élément n'a pas de définition propre | R |
| Précédence détaillée entre réglages du site, du kit et du widget | **Non énoncée** dans la page lue ; une page liée (« How Elementor's theme style and design system options work together ») pourrait y répondre, non lue | N |

## 2. Ce qui est connu de façon générale (non revérifié aujourd'hui)
* **D** — Les couleurs et polices globales sont des variables que les widgets peuvent référencer ; modifier la globale propage le changement à tous les widgets qui la référencent.
* **D** — Un widget peut aussi recevoir une valeur **locale** (couleur ou police choisie directement) : elle se détache du global et ne suit plus ses changements.
* **D** — Les styles d'un widget l'emportent sur le Theme Style (qui n'est qu'un défaut), et un CSS personnalisé écrit à la main peut l'emporter sur les deux selon sa spécificité.
* **D** — Les modèles importés d'une bibliothèque ou d'un kit suivent le plus souvent le kit global du site qui les reçoit ; les kits de modèles complets proposent parfois d'importer leurs propres globaux.

## 3. Ce que cela implique pour Kolakisa
La demande (modèle à identité propre, modèle qui suit le site, retour possible de l'un à l'autre) correspond à **trois niveaux** qu'Elementor connaît seulement en partie : global du site, valeur locale du widget, et — absent chez Elementor à notre connaissance — une identité portée par le modèle lui-même avec bascule volontaire. Kolakisa doit donc concevoir ce troisième niveau lui-même ; il ne peut pas être « copié » d'Elementor (voir `STYLE_INHERITANCE_AND_OVERRIDES.md` et `TARGET_ARCHITECTURE.md`).

## 4. À lire avant l'étape de conception (non fait)
Pages d'aide Global Colors, Global Fonts, « theme style and design system options work together », « sync variables and global elements ». À relire quand le serveur renverra les articles ; ne pas présenter de règle de précédence d'Elementor comme confirmée avant.

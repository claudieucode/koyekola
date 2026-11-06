# En-têtes : interface et exécution (V3)

Branche `headers-100-ui`. Ce document décrit ce qui a été livré pour combler les « Limites restantes » de `HEADER_LIBRARY_100_MODELS_REPORT.md` côté interface et exécution, et ce qui ne l'est pas. Le catalogue (modèles, architectures) est traité par une autre branche : rien ici ne touche `src/themeBuilder/catalog/**`.

## 1. Aperçu de la bibliothèque

* **Sélecteur d'appareil** : il existait déjà dans la fenêtre d'aperçu (Ordinateur 1280 px, Tablette 820 px, Mobile 390 px). Le rapport précédent le jugeait absent à tort. Le cadre d'aperçu est un vrai `iframe` de la largeur choisie (réduit par un zoom visuel seulement) : les règles responsive du modèle s'appliquent réellement. Vérifié dans Chrome : largeur interne du cadre = 1280 / 820 / 390, pas de défilement horizontal, menu replié derrière un bouton sur mobile.
* **Contexte de page** (`themeRender.previewDoc`) : sous l'en-tête, un fond d'ouverture NEUTRE (dégradé CSS ardoise, sans image ni texte qui paraisse réel) portant le libellé « Aperçu · fond d'ouverture neutre », puis une page de remplissage grise (4 blocs « Contenu de la page (aperçu) ») assez longue pour faire défiler. Cela permet de juger un en-tête superposé, transparent ou en verre.
* **Défilement réel dans l'aperçu** : l'en-tête est rendu comme sur le site (`sitePart: "header"`), et le script public `landing.js` est chargé dans l'aperçu complet : « se réduit », « devient plein », « se cache », logo alternatif et barre fermable agissent pour de bon. Le corps porte `data-kw-demo="1"` : aucune fermeture de barre n'est mémorisée dans l'aperçu.
* **Vignettes** : même fond neutre (version courte, sans libellé), sans aucun script. Test mis à jour : `tests/theme-builder-apercu-vignette.test.js` (le corps du modèle reste identique entre vignette et aperçu) et `tests/theme-builder-entetes-atelier.test.js` (aperçu : seul le fichier `landing.js` est autorisé, jamais de code dans la page ; vignette : aucun script).
* **Fluidité** : inchangée (3 rendus de vignettes en parallèle au plus, HTML mis en cache pour la session, chargement à la demande).

## 2. Revenir au modèle initial

* À l'installation (`POST …/bibliotheque/utiliser`, type `header`), la clé du modèle est gardée dans le document : propriété `libraryKey` du premier conteneur de l'en-tête (grammaire fermée : `^[a-z0-9.-]{3,80}$`). Aucune migration de base : la clé voyage avec le document (duplication, export).
* Carte et ligne d'un modèle du site : champ `origin` (clé et nom du modèle d'origine). Menu « ⋯ » : **Revenir au modèle initial**, visible seulement si l'origine est connue, jamais sur un modèle archivé ni pour un en-tête créé autrement.
* Route : `POST …/api/modeles/:id/revenir-au-modele`. Elle (1) enregistre l'état actuel comme version (`store.checkpoint`, visible dans « Versions »), (2) reconstruit le modèle d'origine depuis la bibliothèque, (3) l'écrit en copie de travail du SEUL composant de ce modèle. Rien n'est publié ; les autres modèles, les autres sites et le catalogue ne changent pas. La confirmation (navigateur) explique ce qui est remplacé et comment annuler.
* **Annulation** : « Versions » › Restaurer la version n (message affiché après le retour).
* Limite : les en-têtes installés AVANT cette version n'ont pas de clé d'origine : le bouton n'apparaît pas pour eux (le retour se fait alors en réutilisant le modèle depuis la bibliothèque).

## 3. Identité du modèle ou du site

* Propriété `headerIdentity` du premier conteneur de l'en-tête : absente (défaut) = identité du modèle ; `"site"` = couleurs et polices du site. Jamais appliqué sans choix.
* Réglage dans l'éditeur (conteneur pleine largeur, à côté de « Effet de l'en-tête au défilement ») : « Couleurs et polices de l'en-tête » — « Identité du modèle » / « Couleurs et polices du site ».
* Rendu (`src/marketing/pages/headerIdentity.js`, branché dans `landing.viewModel`, donc public, aperçu et canevas) : à l'affichage seulement, les couleurs (texte, fond, bordure, contour, dégradé, image de fond, ombres), polices et couleurs d'icônes propres au modèle sont retirées ; la mise en page est conservée. Le document enregistré n'est pas modifié : revenir sur « Identité du modèle » rétablit tout. L'en-tête non superposé reçoit alors le fond et le texte du site (`landing.css`, `data-kw-identity="site"`).
* Limite : le CSS libre déjà saisi par l'auteur sur un élément (champ « CSS ») n'est pas retiré.

## 4. Comportements au défilement

* Existant (inchangé) : se réduit, devient plein, se cache (`headerFx`).
* **Logo ou titre alternatif au défilement** (livré) : réglages du logo (`scrollHeight` : taille une fois défilé ; `scrollText` : texte alternatif quand le logo est un texte) et du titre du site (`scrollText`). L'en-tête collant ou superposé porte `is-scrolled` (posé par `landing.js` après 8 px) ; les deux versions sont dans la page, l'inactive est masquée en CSS (`display: none`, donc absente des lecteurs d'écran). Mouvement réduit : pas de transition. Limites : le logo « image » n'a que l'échelle alternative (pas une seconde image : il faudrait un second fichier média géré par les réglages SEO, non fait) ; l'effet exige un en-tête collant ou superposé (un en-tête qui défile avec la page n'a rien à changer).
* **Barre supérieure fermable** (livré) : propriété `dismissible` d'un conteneur (case « Barre fermable » dans l'éditeur). Un vrai bouton (clavier, `aria-label`) masque la barre (classe `is-dismissed`, rien n'est supprimé). Le choix est mémorisé dans le navigateur du visiteur (clé : identifiant de la barre + empreinte de son texte : si le texte change, la barre revient). Ni dans l'éditeur ni dans l'aperçu.
* Non fait : versions claire/sombre du logo (le site n'a qu'un logo).

## 5. Animations d'en-tête dans l'éditeur

Vérification faite : le panneau « Effets de mouvement » (onglet Avancé, `public/js/page-builder-effects.js`) s'applique à tous les éléments, donc à ceux d'un en-tête. Il donne l'animation d'entrée, la durée, le délai, la courbe (dont cubic-bezier), la répétition, la direction, le déclenchement, le réglage « selon l'écran », l'accessibilité (mouvement réduit) et l'effet au survol. Aucun manque d'accès constaté ; un test d'éditeur le confirme sur un élément d'un vrai modèle d'en-tête. Les effets de l'en-tête lui-même (réduction, plein, masquage) restent sur le premier conteneur.

## 6. Tests

* `tests/theme-builder-entetes-ui-execution.test.js` : unités (identité, grammaire fermée), serveur (aperçu, origine, retour au modèle, annulation, isolation, droits), Chrome réel (appareils, contexte, défilement dans l'aperçu, vignette, retour au modèle dans l'interface, identité sur site publié, logo alternatif, barre fermable, aucune erreur JavaScript), éditeur simulé (nouveaux réglages, accès aux réglages d'animation).
* Tests existants relancés : voir le rapport de livraison.

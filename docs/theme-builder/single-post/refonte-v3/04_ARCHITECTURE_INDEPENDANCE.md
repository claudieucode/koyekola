# Architecture d'indépendance graphique — Article individuel v3

## 1. Mesure réelle des fuites (avant la reconstruction)
Sonde exécutée dans Chrome : un site à charte volontairement « hostile » (polices Fredoka et Comfortaa, titres de 90 px rose vif, liens rouges, boutons verts, fond jaune, texte bleu) reçoit 10 modèles de la bibliothèque précédente (v2 + identités propres de la PR #37). Mesure des polices et couleurs calculées sur chaque élément textuel du modèle.

| Constat mesuré | Détail |
|---|---|
| **Couleurs : aucune fuite** | Aucune couleur du site sur du texte ou un fond de modèle (les couleurs fixes tiennent). |
| **Polices : fuite sur les éléments qui ne posent pas leur propre police** | Titre du sommaire et ses liens, métadonnées (`kw-pm-item`), liens de partage, badge, encadré (`kw-alert-title`), fil d'Ariane, état vide des listes (« Rien à afficher »), signature de citation. Ces éléments héritent de `.lp-site { font-family: var(--kw-font-body) }`. |
| **Cause** | Les modèles posaient police/couleur sur les éléments qu'ils créaient, pas sur leur **racine** : tout élément sans police explicite retombe sur la police du site. |
| Faux positifs écartés | Deux identités de la PR #37 utilisent elles-mêmes Fredoka ou Comfortaa : leurs titres ne sont pas une fuite. |

## 2. Architecture retenue (réutilise le moteur existant, aucun nouveau moteur de rendu)
1. **Identité = valeurs fixes** (couleurs hexadécimales, polices `font.<id>` de la bibliothèque locale), dérivée de la fiche de conception par `catalog/single_post/v3/skin.js` ; **contraste vérifié au chargement** (texte/fond 4,5 ; secondaire 4,4 ; accent/fond 3 ; texte d'accent 4,5). Un concept illisible fait échouer le catalogue, jamais le visiteur. L'accent est ajusté vers l'encre par petits pas si nécessaire (21 concepts sur 100) ; la fiche publie la couleur finale.
2. **Racine isolée** (`catalog/single_post/apply.js` → `isolate`) : chaque bande de premier niveau déclare elle-même `font-family`, `color`, `font-size`, `line-height`, et redéfinit localement les variables `--kw-*` (`scopeCss`, le même mécanisme que la Page individuelle v2). Les widgets qui lisent les variables du site (badge, progression, boutons, cartes) lisent donc celles du modèle.
3. **Contenu de l'article** (`apply` → `parts`) : texte, titres, citations, liens reçoivent police et couleur de l'identité via le réglage natif « parties » (modifiable dans l'éditeur).
4. **Trois modes** par le mécanisme déjà présent sur `main` pour la Fiche produit (`catalog/identityModes.js`, `identity.js`, colonne `identity_mode`, route `…/modeles/:id/identite`), étendu au type `single_post` : *indépendant* (défaut), *suit le site* (couleurs → jetons, polices → rôles du site), *hybride* (le modèle garde son style, l'accent suit la marque du site). La conversion d'un modèle installé ne touche que les valeurs que l'utilisateur n'a pas modifiées et conserve un point de retour dans l'historique.
5. En mode « suit le site » ou « hybride », la racine ne redéfinit plus les variables du site (sinon le mode n'aurait aucun effet).

## 3. Priorité des styles (de la plus faible à la plus forte)
défauts du moteur (`landing.css`, `:where()` de spécificité 0) → jetons et styles globaux du site → **racine du modèle** (police, couleur, taille, variables `--kw-*`) → valeurs du modèle sur chaque élément → réglages de l'utilisateur dans l'éditeur. Aucun `!important`.

## 4. Persistance
L'identité est dans le document du modèle (copie indépendante créée par « Utiliser ») : elle survit à l'insertion, à l'ouverture dans l'éditeur, à l'enregistrement, au rechargement, à l'aperçu, à la publication et aux modifications de la charte du site (test : charte bleu marine puis « hostile », règles du modèle identiques à l'octet près).

## 5. Limites connues
- **Feuilles de thème (« packs ») sans `@layer`** : un pack actif qui cible `a`, `h1`, `button` peut encore peser sur un modèle indépendant (14 packs ciblent déjà des classes `.kw-…`). Un changement de moteur transversal (couches CSS) est à planifier ; non fait ici car il touche tous les types.
- **CSS personnalisé du site** : chargé en dernier, il peut tout écraser (comportement voulu).
- **Image de fond dynamique** : la grammaire n'accepte pas `{{post.image}}` en fond ; « titre superposé » est donc réalisé par une carte qui mord sur l'image (marge négative), jamais par du texte posé sur la photo.
- **Champs personnalisés** : le CMS n'en stocke pas pour les articles ; aucun widget ne les simule.

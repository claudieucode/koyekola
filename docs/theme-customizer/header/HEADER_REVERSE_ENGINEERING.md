# Entête — étude de la rubrique « Header » du Customizer WordPress / Astra

Sources : 13 captures fournies (3 h 06 → 3 h 09, 6 novembre 2026) et la documentation publique d'Astra (Header Builder, Primary Header, Transparent Header, couleurs de menu). Les encarts « Mettre à niveau » / « Débloquer Pro » sont de la promotion Astra : ils ne sont **pas** reproduits (voir `HEADER_ARCHITECTURE.md`, § Pro).

## 1. Navigation (capture 1, 2)

Chemin : `Personnalisation → Entête`. Barre du haut : ✕ (fermer), pinceau (« Style Guide »), **Publier** + roue. Sous la barre : flèche retour, fil d'Ariane (« Vous personnalisez » puis le titre du panneau), titre. Deux onglets : **ÉLÉMENTS** et **DESIGN**. Pied : « Masquer les contrôles », puis **Ordinateur / Tablette / Mobile**.

### ÉLÉMENTS
| Zone | Contenu | Effet |
|---|---|---|
| Préréglages de l'entête (+ crayon) | 3 lignes à chevron : *Titre et logo du site*, *Menu hors-champ*, *Menu principal* | ouvre le sous-panneau ; le crayon ouvre la composition des rangées |
| Types d'entête | 1 ligne : *Entête transparent* | ouvre le sous-panneau |

### DESIGN
| Contrôle | Valeurs | Effet |
|---|---|---|
| Largeur | *Pleine largeur* / *Largeur du contenu* (segment) | largeur du fond de l'entête ; en « contenu », le contenu est borné à la largeur du site |
| Marge externe (écran + unité px) | haut / droite / bas / gauche + liaison | marge autour de l'entête, par appareil |

## 2. Titre et logo (captures 3, 4, 5)

Fil : `Personnalisation ▸ Logo`. Onglets **GÉNÉRAL** / **DESIGN**.

### Général
- **Logo** : bouton *Sélectionner un logo* → fenêtre de médias (capture 5 : onglets *Téléverser des fichiers*, *Médiathèque*, *Rechercher des images* ; suggestion « 180 × 60 px » ; recherche ; grille ; colonne de détails ; bouton *Sélectionner* désactivé tant que rien n'est choisi).
- **Utiliser le logo SVG** (interrupteur) : le logo est inséré tel quel (SVG assaini) pour pouvoir être coloré.
- **Largeur du logo** (écran, réinitialiser, px) : curseur + champ numérique, par appareil.
- **Titre du site** (champ texte).
- **Visibilité du titre du site** : trois boutons bascule (ordinateur / tablette / mobile).
- **Logo et titre du site sur la même ligne** (interrupteur).
- **Slogan** (champ texte) et **Visibilité du slogan du site** (3 appareils).
- **Visibilité** de l'ensemble (3 appareils).
- **Favicon** : ligne à chevron → panneau dédié.

### Design (capture 4)
- **Couleur du logo** (aide « ? », réinitialiser, pastille) ; **Couleur de titre** (pastille normale + pastille « globale ») ; **Slogan** (pastille).
- **Taille de la police de titre** (écran, réinitialiser, px) : curseur + champ (valeur 26 dans la capture).
- **Espacement → Marge externe** : 4 côtés + liaison + unité.

## 3. Menu principal (captures 9, 10, 11)

### Général
- **Configurez le menu ici.** (chevron) → gestionnaire de menus.
- **Sous-menu → Largeur** (réinitialiser, px) : curseur + champ.
- **Séparateur d'élément** (interrupteur).
- **Visibilité** (3 appareils).

### Design
- **Style au survol de menu** : liste (*Aucun(e)*…).
- **Conteneur de sous-menu** : *Décalage supérieur* (curseur + champ) ; *Animation de sous-menu* (liste) ; *Largeur de bordure* (4 côtés, valeurs 2/0/0/0 dans la capture, liaison) ; *Couleur de bordure* ; *Rayon de bordure* (4 coins, écran, px).
- **Couleur de menu** : *Texte/lien* (3 pastilles : normal, survol, actif) ; *Arrière-plan* (3 pastilles).
- **Police** : *Police du menu* (hérité / hérité).
- **Espacement** : *Menu* et *Marge externe* (4 côtés, liaison, écran, px).

## 4. Menu hors-champ (captures 6, 7)

### Général
*Configurez le menu ici.* ; *Séparateur d'élément* ; *Visibilité* (3 appareils).
### Design
*Couleur de menu* : Lien (3 pastilles) et Arrière-plan (3 pastilles) ; *Police du menu* ; *Espacement de menu* et *Marge externe*.

## 5. Entête transparent (captures 12, 13, 14)

### Général
- **Activer sur tout le site** (interrupteur).
- **Activer sur** : *Ordinateur* / *Mobile* / *Ordinateur + Mobile* (segment ; la tablette suit le mobile — décision Kolakisa, voir spécification).
- **Logo transparent différent** (interrupteur) → choix d'un second logo.
### Design
*Taille de bordure inférieure* (0 px) ; **Couleurs et arrière-plan** : couleur du logo ; *Superposition d'arrière-plan* (au-dessus / principal / sous l'entête) ; titre du site (normal + survol) ; couleur de menu, de sous-menu ; médias sociaux ; recherche (icône) ; bouton (texte, arrière-plan, bordure — normal + survol) ; compte (icône, texte) ; permutation (icône, arrière-plan, bordure) ; HTML (texte, lien).

## 6. Éléments d'interface communs

| Contrôle | Comportement reproduit |
|---|---|
| Visibilité 3 appareils | 3 boutons à bascule indépendants (bleu = visible) |
| Curseur + champ + unité + réinitialiser | borné, la réinitialisation rend la valeur d'origine du thème |
| Marge 4 côtés | liaison : saisir une valeur la copie aux 4 côtés |
| Pastille de couleur | normal / survol / actif ; vide = couleur d'origine du thème |
| Icône écran | la valeur est celle de l'appareil d'aperçu courant |

## 7. Ce que Kolakisa ne reproduit pas
Encarts promotionnels (« Mettre à niveau », mega-menus Pro, mode sombre Pro) ; la liste des éléments à ajouter (recherche, bouton, HTML, widgets, réseaux, compte, panier) est préparée dans le modèle de données mais n'est pas rendue tant que l'élément n'existe pas dans le moteur du site.

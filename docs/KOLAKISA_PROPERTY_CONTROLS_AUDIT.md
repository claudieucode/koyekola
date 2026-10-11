# Audit du moteur de propriétés et de contrôles

*Chantier « Prompt 2 » — auteur : audit réalisé sur le code réel (branche `controles-proprietes`, partie de `830b7d8`). Les rapports du chantier précédent (`KOLAKISA_CORE_*.md`) ont été lus ; leurs interfaces (historique, `change()`, `patchCanvas`, enregistrement avec révision) ont été réutilisées sans modification.*

## 1. Méthode

Aucune case n'a été remplie « de mémoire ». Trois mesures complémentaires :

1. **Lecture du code** : `src/marketing/pages/nodes.js` (modèle, validateurs, génération du CSS), `public/js/page-builder.js` (fabrication des contrôles, écriture dans le document), `public/js/font-manager.js`, `docs/CONTROLES-NUMERIQUES.md`.
2. **Contrôles automatiques du contrat** (sans navigateur) : chaque propriété est éprouvée avec des valeurs valides, invalides et hostiles ; les tables de l'interface (bornes, unités) sont rapprochées du serveur.
3. **Pilotage de l'inspecteur réel dans Chrome** : chaque réglage est actionné comme une personne le ferait, puis relu dans le **document enregistré**, le **CSS généré** (canevas), la **page publiée** et après **rechargement**.

## 2. Ce qui existe (état initial)

| Élément | Quantité | Où |
|---|---|---|
| Propriétés de style | **110** (`STYLE_PROPS`) | `nodes.js` |
| Propriétés composées | **8** (fond image, dégradé, voile, ombre, filtres, filtres d'arrière-plan, transformation, masque) | `nodes.js` (`COMPOSED`) |
| Types d'éléments | **92** (79 instanciables sans contexte) | `NODE_TYPES` |
| Familles de contrôles | liste, boutons à icônes, nombre (NumericControl), longueur+unité, couleur, texte de grille, police, espacement 4 côtés, bordure/arrondi déliés, composées | `page-builder.js` |
| Écrans / états | 4 écrans (ordinateur, grand écran, tablette, mobile) × 3 états (survol, focus, clic) | `BREAKPOINTS`, `STATES` |

Le système est **déjà bien structuré** : une source de vérité côté serveur fabrique les contrôles côté client. L'audit n'a donc pas conduit à un nouveau système mais à des corrections ciblées.

## 3. Défauts démontrés (tous corrigés, chacun avec un test qui échouait avant)

| # | Défaut | Preuve | Correction |
|---|---|---|---|
| **D1** | **Couleur du site sans effet sur le contour du texte.** `textStrokeColor` acceptait `token:…` mais ne le convertissait pas en `var(--kw-…)` : le CSS contenait littéralement `-webkit-text-stroke-color:token:primary` (invalide, ignoré par le navigateur). La référence aux couleurs du site ne s'affichait jamais pour ce réglage. | Matrice navigateur (jeton choisi dans le nuancier) + `controles-contrat` + `controles-coherence` : échec avant, succès après | `out: colorCss` dans `STYLE_PROPS.textStrokeColor` |
| **D2** | **« Colonnes de texte » et « Lignes maximum » sans bornes côté interface.** Le champ proposait −9999…9999 et des décimales alors que le serveur n'accepte que 1–6 et 1–10, entiers : une saisie hors plage partait au serveur au lieu d'être refusée sur place. | Comparaison automatique interface/serveur (`controles-contrat`) : échec avant, succès après | `NUM` et `NUMCFG` complétés dans `page-builder.js` |
| **D3** | **Position du texte d'un séparateur perdue.** Le choix « à droite » fait avant de saisir le texte était écarté à l'enregistrement (la position n'était gardée qu'avec un texte). Contrôle visible, sans effet, valeur perdue. | Matrice de contenu : « option sans effet sur le document » | La position est conservée même sans texte (`nodes.js`, séparateur) |
| **D4** | **Champ « image dynamique » : saisie ignorée sans aucun message.** Taper autre chose qu'une étiquette `{{…}}` ne faisait rien, sans explication ; vider le champ non plus. | Matrice de contenu : « sans effet ET sans aucun message » | Messages explicites (`page-builder.js`) |
| **D5** | **Positions du fond et de l'image limitées à 5 mots-clés** (centre, haut, bas, gauche, droite) : les quatre coins (haut gauche, haut droit, bas gauche, bas droit) manquaient — écart avec les 9 positions d'Elementor. | Comparaison avec la référence | Quatre coins ajoutés à `backgroundPosition` et `objectPosition` ; les listes de l'interface se complètent seules |
| **D6 (tests)** | **Trois tests de contrôles étaient périmés sans que personne le sache.** Les suites en navigateur simulé (jsdom) sont *ignorées* sur cette machine faute de `jsdom` : l'interface avait évolué (unités de largeur, bloc Espacement, écran « grand écran ») sans que ces tests, jamais exécutés, ne le signalent. | Installation de jsdom hors du projet puis exécution : 3 échecs réels | Tests mis à jour sur le comportement actuel (aucune régression du produit) |

## 4. Ce qui a été vérifié et trouvé correct (préservé sans modification)

* **110 propriétés** : toute option de liste est acceptée par le serveur ; tout validateur est idempotent, sans `NaN` / `undefined` dans le CSS ; aucune injection CSS possible (`;`, `}`, `url()`, `expression`, `!important`, `\`) ; toute couleur / longueur du site est convertie en `var()`.
* **Bornes et unités** : 16 nombres sans unité ont exactement les bornes du serveur ; aucune unité proposée par un menu n'est refusée par le serveur.
* **Valeur vide = hériter** (clé retirée du document), **invalide = refus nommant le réglage**, document précédent intact ; **absente ≠ écrasante** (aucune déclaration CSS).
* **Écrans et états** : une valeur de tablette / mobile / grand écran / survol va dans sa zone du document, jamais dans « ordinateur » ; ↺ rend l'héritage.
* **Couleur** : HEX 3/6/8 chiffres, `rgb()`, `hsl()`, transparence, jetons du site conservés comme références.
* **Police** : choix de la bibliothèque et réglages historiques écrits, rendus dans le canevas, restaurés au rechargement ; les fichiers d'une même police ne sont pas redemandés.
* **Performance** : 40 pressions de flèche = 1 à 4 rendus et **1** enregistrement ; curseur (60 pas) et nuancier (30 pas) = **1 rendu, 1 enregistrement**. Aucun changement nécessaire (voir rapport de performance).
* **Accessibilité** : tous les contrôles actifs de l'inspecteur ont un nom accessible ; aucun identifiant en double ; aucune zone cliquable minuscule.

## 5. Non touché volontairement

Voir `KOLAKISA_PROPERTY_CONTROLS_LIMITATIONS.md` : grammaire de longueurs fermée (sécurité), « nouvel onglet » réservé aux adresses `https://`, champs liés par paires, unités non converties lors d'un changement d'unité (comportement annoncé par un message).

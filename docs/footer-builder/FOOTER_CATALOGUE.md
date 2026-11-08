# Pied de page : mise à jour du catalogue (chantier F, 7 novembre 2026)

## 1. Ce que contient vraiment le catalogue (total exact)

* **100 modèles** = **10 familles × 10 compositions**. Chaque composition a **sa propre identité** (couleurs fixes et polices de la bibliothèque locale) : la liste des filtres propose **34 identités**, dont **33 réellement utilisées** par au moins un modèle.
* Ce n'est PAS « 20 mises en page × 5 identités » : cette formule décrivait l'ancien catalogue (remplacé avant ce chantier). Le chiffre 100 est juste ; la structure « 20 × 5 » ne l'est plus.
* Les clés `<mise en page>.<identité>` n'ont **pas changé** (les sites ont déjà des copies indépendantes). Aucune mise en page n'a été supprimée ni ajoutée : le total reste **100** (testé : `tests/footer-catalogue-widgets.test.js`).

## 2. Les nouveaux widgets dans les modèles

Les widgets « Pied de page » (chantier C) lisent les **Données de l'entreprise** du site (Paramètres → Données de l'entreprise). Ils n'affichent **rien** tant que le site n'a rien saisi. Aucun modèle ne contient de fausse donnée (ni téléphone, ni adresse, ni année écrite à la main).

| Élément | Widget | Où |
|---|---|---|
| `contact`, `contact:inline` | Coordonnées (`bizcontact`) : adresse, téléphone `tel:`, e-mail `mailto:` cliquables | 21 modèles : famille Coordonnées (9 sur 10), colonnes, entreprise, centre, réseaux, créatif |
| `hours` | Horaires (`bizhours`) avec « ouvert maintenant » calculé par le serveur | 4 modèles |
| `phone`, `email` | Téléphone et e-mail cliquables seuls | 3 modèles (rendez-vous, service client, entreprise) ; l'e-mail seul : 1 modèle (service client) |
| `legal` (barre du bas) | liens Cookies / Contact (pages de la plateforme) **+** pages légales du site (mentions, confidentialité, CGV) dès qu'elles sont renseignées (`bizlegal`) | 39 modèles (tous ceux qui avaient des « liens légaux » + informations légales) |
| `legalinfo` | Informations légales (raison sociale, forme, SIRET/RCS/TVA) | pied sombre large, mentions entreprise, « légal » centré |
| `pay`, `deliv` | Moyens de paiement et livraison / retours | `pay` : 5 modèles, `deliv` : 4 modèles, famille Boutique |
| `top` | Retour en haut (lien en ligne, vrai lien `<a href="#">`) | 23 modèles : barres du bas des familles Boutique, Éditorial, Entreprise, Contact… |
| `copy` | Copyright automatique : `{{business.legalname}}` comme propriétaire. Année courante ; si la raison sociale est vide, c'est le nom du site | les 100 modèles |

**Pourquoi l'abonnement par e-mail (`emailsubscribe`) n'est pas dans les modèles** : ce widget bloque la publication tant que le site n'a pas de formulaire d'inscription publié. Les modèles continuent d'utiliser le widget « formulaire d'inscription » avec le formulaire réel du site, ou un bouton vers le contact quand il n'y en a pas (comportement testé depuis la bibliothèque d'origine). Un modèle ne doit jamais empêcher de publier.

### Pas de trou quand le site n'a rien saisi
Un widget de données vide ne produit aucun HTML. Une colonne ou une rangée faite *uniquement* de ces widgets deviendrait donc un trou. Règle appliquée et **testée** : chaque colonne, zone ou rangée garde un élément permanent (titre, lien « Nous écrire », bouton, logo, réseaux). Exemple : la colonne « Contact » = titre + coordonnées (si saisies) + lien vers la page de contact.
Le titre « Horaires d'ouverture », « Paiement accepté », « Livraison et retours » appartient au widget lui-même : il disparaît avec lui.

### Aperçu de la bibliothèque
L'aperçu et la vignette de la bibliothèque n'ont pas de données d'entreprise (c'est voulu : aucune donnée d'exemple). On y voit donc les modèles « comme sur un site qui n'a rien saisi ». Dans l'éditeur, les widgets montrent un cadre d'aide qui renvoie vers les Données de l'entreprise.

## 3. États, contraste, zones cliquables, tabulation

* **Survol et focus** : définis avec le modèle de données existant (`states` des nœuds et des *parties* `parts.link` / `parts.button`) : lien (souligné, couleur d'accent seulement si elle atteint 4,5:1), bouton plein (couleurs inversées au survol), bouton contour (remplissage au survol), menu, compte, mini-panier, réseaux, coordonnées cliquables, retour en haut. Le **focus** est un contour plein de 2 px, décalé de 3 px, à la couleur du texte (jamais supprimé). Le moteur conserve ce contour même en « mouvement réduit ». Rien d'inventé : seul ce que le moteur sait déjà écrire est utilisé (`hover`, `focus`).
* **Contraste WCAG AA (4,5:1)** : mesuré **par calcul sur les 100 documents construits** (texte sur son fond réel, y compris fonds alternés et semi-transparents, couleurs de survol, contour de focus sur le fond parent). Correction trouvée par la mesure : le texte secondaire de 4 identités (Rose poudré, Menthe, Restaurant chaleureux, Bien-être doux) tombait à 4,2–4,5:1 sur les cartes ; `legible()` (dans `footer.js`) le rapproche de la couleur du texte à la construction, sans toucher à `identities.js` (partagé avec les en-têtes).
* **Zones cliquables sur mobile** (confirmées dans Chrome : 0 cible sous 44 px sur 600 mesures) : liens, boutons et mini-panier `min-height: 44px` ; menus et compte avec 12 px de marge haut et bas ; icônes de réseaux 44 × 44 px ; coordonnées et liens légaux cliquables avec lignes de 44 px minimum ; retour en haut 44 px ; titre du site (marges calculées selon la taille) ; logo porté à 44 px de haut sur mobile s'il est plus petit.
* **Police des liens** : le site impose sa police aux liens ; les liens des widgets de données (coordonnées, légal, retour en haut) reprennent donc la police et la casse de l'identité du modèle (parties `link` / `button`).
* **Ordre de tabulation** : aucun `tabindex`, aucun `order`, aucune colonne inversée : l'ordre du clavier suit l'ordre du document, qui suit l'ordre visuel (testé).
* **Liens** : uniquement des pages de la plateforme qui existent (`/contact`, `/cookies`, `/faq`, `/connexion`, `/inscription`, `/catalogue`, `/boutique`, `/blog` : présence des routes vérifiée par le test) et les adresses `tel:`/`mailto:`/pages légales construites par les widgets à partir des données saisies. Aucun lien vide.

## 4. Responsive

Inchangé dans son principe (colonnes Flexbox à largeur minimale qui passent à la ligne, aucune position absolue, rangées repliées en pile sous 640 px). Mesure réelle dans Chrome : voir §6.

## 5. Aperçu = vignette = « Utiliser » (même document)

Les trois appellent `Catalog.build("footer", key, env)`. Testé sur les 100 modèles : même suite d'éléments dans l'aperçu et la vignette ; la copie du site contient exactement les mêmes types d'éléments que le catalogue (un échantillon par famille).

### Échec existant corrigé : « 100 aperçus … aucun script »
Cause : l'aperçu complet de la bibliothèque ajoute `<script src="/js/landing.js">` pour **tous** les types depuis le chantier « aperçu des en-têtes en contexte » (commit `c4627acd`, nécessaire au comportement au défilement d'un en-tête). Le test des pieds, plus ancien, exigeait zéro script. Ce n'est pas un test devenu faux : un aperçu de pied n'a pas besoin de `landing.js` (ses seuls comportements sont natifs : `<details>`, liens). Correction côté **aperçu uniquement** (`src/marketing/web/themeRender.js`, 1 condition : `type === "footer"`), le site public et l'aperçu des en-têtes ne changent pas. Le test d'origine est conservé tel quel et passe.

## 6. Preuves exécutées (7 novembre 2026)

**Tests (un par un, `TEST_START_TIMEOUT_MS=900000 node --test --test-concurrency=1 …`)** — avant / après :

| Suite | Avant | Après |
|---|---|---|
| `theme-builder-pieds-bibliotheque` | 16/17 (échec : aperçus avec `<script src=/js/landing.js>`) | **17/17** |
| `theme-builder-pieds-identites` | non relancé avant mes changements | 4/4 |
| `theme-builder-pied-unique` | non relancé avant mes changements | 4/4 |
| `theme-builder-pied-de-page-coherence` | non relancé avant mes changements | 7/7 |
| `theme-builder-apercu-vignette` | non relancé avant mes changements | 5/5 |
| `footer-rendu-unifie` | non relancé avant mes changements | 10/10 |
| `footer-widgets-entreprise` | non relancé avant mes changements | 40/40 |
| `footer-catalogue-widgets` (nouveau) | — | **15/15** |
| `theme-builder-catalogue` | 20/21 (1er passage, après mes changements) | 20/21 (même échec avec le `footer.js` d'origine : le test lit le type « header » en premier, recherche « ÉDITORIAL » : 2 résultats au lieu de 5 ; avec `TB_TYPES=footer` : 5/5) |
| `theme-builder-catalogue-public` | 4/5 | 4/5 (même échec avec le `footer.js` d'origine : l'en-tête `tech-01` ne montre pas `kw-sitelogo` sur l'accueil ; ne concerne pas le pied) |

Ces deux derniers échecs viennent des en-têtes (chantier voisin) et ne sont pas causés par ce chantier : ils échouent à l'identique avec la version d'origine de `footer.js` (essai fait en remettant temporairement le fichier d'origine, puis restauré à l'identique).

**Chrome réel (Chrome 150, profil neuf, 1280 / 820 / 390 px)** :
* `scripts/audit-pieds.js` (aperçu de la bibliothèque, sans données) : 100 modèles × 3 largeurs = **300 mesures, 0 défaut** (débordement horizontal, chevauchements, éléments hors écran, contraste < 3, colonne de hauteur nulle).
* `scripts/audit-pieds-donnees.js` (copie du modèle sur un site SANS données puis sur un site AVEC données) : 100 modèles × 2 sites × 3 largeurs = **600 mesures** : débordement horizontal **0**, éléments hors écran **0**, copyright coupé ou absent **0**, liens et boutons de moins de 44 px de haut sur mobile **0** (69 au premier passage : logo, titre du site et « Retour en haut » ; corrigés), erreurs JavaScript **0**.
* « Colonnes vides » : 18 mesures (3 modèles × 2 sites × 3 largeurs) : `trois-zones`, `blog-a-lire`, `centre-logo-au-milieu`. Ce sont des zones dont le seul contenu est le menu du pied de page, et le site de test n'a pas affecté de menu à cet emplacement : comportement d'origine, indépendant des données d'entreprise (voir §7).

## 7. Limites connues (honnêtes)
* Un menu du pied de page non affecté laisse sa zone vide dans les trois modèles ci-dessus (et son titre « Navigation » dans les autres) : c'est le comportement d'origine (« aucun lien de navigation inventé »). Non modifié.
* Non mesuré : le survol et le focus réels à la souris/clavier (les états sont vérifiés dans le document enregistré et par calcul de contraste, pas par simulation dans Chrome) ; les captures n'ont été relues à l'œil que pour 2 modèles (sans et avec données).
* L'aperçu de la bibliothèque n'a pas de balise `<footer>` (c'est un composant dans une zone « partie de thème ») : la balise `<footer>` est posée par le rendu du site publié (chantier A) ; testé : un seul `<footer>` sur le site publié, avec et sans données.

### Autres limites
* Les adresses des réseaux sociaux restent des adresses génériques (`https://www.facebook.com/` …) à remplacer : les Données de l'entreprise n'ont pas de champ « réseaux ». Elles ne sont pas mortes mais ne sont pas celles de l'entreprise.
* La carte (`map`) garde l'adresse neutre « France » : le champ adresse du widget est une saisie, pas une étiquette (limite du chantier C).
* Les pages `/contact`, `/cookies`, `/faq`… existent comme routes de la plateforme ; sur un site à domaine propre, le contenu de ces pages est celui de la plateforme (non mesuré site par site).
* Les libellés des widgets (« Ouvert maintenant », jours, moyens de paiement) sont en français seulement.
* Les panneaux « Style » de l'éditeur par écran pour les états survol/focus (chantier D) ne sont pas utilisés ici : seuls les états déjà écrits dans le document sont définis.

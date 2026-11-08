# Reconstruction de la bibliothèque de pieds de page : architecture (étape « Fondations »)

Date : 8 novembre 2026. Branche `footer-reconstruction`. Cette étape prépare le terrain : **aucun des 100 nouveaux modèles n'est encore écrit**. Les 100 anciens restent listés (par famille, voir §4) tant que leur famille n'est pas construite.

## 1. Ce qui a été fait, en une phrase par morceau

1. **Gel et alias** : `catalog/footer-aliases.js` fige les 100 identifiants actuels (générés par code) et porte la table d'alias ; `catalog/index.js` sait ouvrir n'importe quel ancien identifiant.
2. **Modules par famille** : `catalog/footer.js` est devenu un assembleur ; 15 fichiers `catalog/footer/familles/<famille>.js` (vides) ; le moteur est partagé (`footer/moteur.js`) ; le système de conception est `footer/kit-conception.js`.
3. **Éléments réels** : newsletter honnête, formulaire de contact, 13 réseaux, accordéon mobile, menu déroulant mobile, catégories de produits, liens de boutique, liens légaux (voir §6).
4. **Outillage** : `scripts/audit-pieds-cdp.js` (mesure Chrome), `tests/footer-reconstruction.test.js`, `tests/footer-aliases.test.js`, `tests/footer-elements-refonte.test.js`, `footer/empreinte.js`, `GUIDE_AJOUTER_UN_MODELE.md`.
5. **Non-régression** : voir le rapport de fin (résultats avant/après de 21 fichiers de test).

## 2. Arborescence

```
src/themeBuilder/catalog/
  index.js                    registre unique (list / find / build / thumbDoc) ; find() suit les alias ; entrées « cachées » ouvrables
  footer.js                   ASSEMBLEUR (nouveau) : charge les 15 familles + les anciens, applique la logique de liste
  footer-aliases.js           100 anciens identifiants gelés + table ALIAS (la seule partie que les agents modifient)
  footer/
    ancien.js                 l'ancien catalogue (git mv de l'ancien footer.js, sans changement de comportement)
    moteur.js                 moteur partagé extrait de l'ancien fichier : tone/legible (contrastes), états focus/survol, finishNode (44 px), item/rawItem, band, wrap, accordéon mobile, registre EXTRA
    elements.js               éléments ajoutés (newsletter, contactform, socials, shopcats, shoplinks, legallinks)
    kit-conception.js         échelles, ambiances AA, rangées, éléments en fonction, modele() — l'API des agents de famille
    empreinte.js              empreinte structurelle et similarité (tests et contrôle final)
    familles/<famille>.js     15 modules { key, label, description, target, built, models }
```

Vérifié par exécution : les 100 anciens modèles produisent **exactement les mêmes documents** qu'avant (empreinte MD5 de 200 constructions — avec et sans formulaire — identique à l'état de départ). Aucun second moteur : l'ancien code a été **déplacé**, pas dupliqué.

## 3. Un modèle = un objet déclaratif

`{ id, name, family, description, tags, structure: { rows }, identity, responsive, widgets }` (voir le guide). L'assembleur le transforme en « mise en page » du catalogue plat, puis `index.js` produit **le même format de sortie qu'avant** : une section de composant du Page Builder (`{ name, kind: "component", section }`). Insertion (« Utiliser ce modèle ») = copie indépendante, vignettes et aperçus calculés depuis le document réel : rien n'a changé de ce côté (`use.js` n'a pas été modifié).

Identifiant stable `ft-<famille>-<nn>-<nom>` (contrôlé par `modele()` et par les tests). Nouveau champ d'une entrée de catalogue : `fullKey` (identifiant complet imposé) ; les anciens gardent « composition.identité ».

## 4. Logique de liste (pas de liste vide, pas de doublon)

- Tous les **nouveaux** modèles des modules de famille sont listés.
- Un **ancien** modèle est rattaché à l'une des 15 familles (table dans `footer.js` : identité sectorielle sinon famille d'origine ; ex. anciennes colonnes → corporate, anciennes newsletters et réseaux → communautés, centrés → landing pages). Il n'est listé que si :
  - sa famille n'a pas `built: true`, **et**
  - son alias n'a pas été redirigé vers un nouveau modèle.
- Un ancien non listé reste **ouvrable** par son identifiant (ouverture, « Utiliser », « Revenir au modèle d'origine », vignette) : `Catalog.find` consulte d'abord la liste puis la table d'alias puis les modèles cachés.
- Une famille qui n'a ni nouveau ni ancien listé n'apparaît pas dans le filtre ; à la fin les 15 apparaissent.
- Cible finale : 15 familles `built` = **100 nouveaux listés, 0 ancien**. Garde-fou : `built: true` exige `models.length === target` (erreur au chargement sinon).
- État actuel (mesuré) : 100 entrées listées = 100 anciens, réparties en 14 familles (institutionnels n'a encore aucun modèle).

## 5. Alias : règles

1. `ANCIENS_IDENTIFIANTS` ne change jamais. 2. `ALIAS[ancien]` pointe d'abord vers lui-même ; l'agent d'une famille le remappe vers un nouvel identifiant quand il existe un remplaçant. 3. Un ancien identifiant ne réapparaît **jamais** dans la liste dès que sa famille est construite ou qu'il est redirigé (test). 4. Un nouvel identifiant ne peut pas être un ancien (test). 5. Les pieds déjà installés sont des copies : rien n'est migré, rien n'est touché ; seule la colonne `origin_key` est relue, et `find()` la résout toujours. Les autres catégories du Theme Builder n'ont ni alias ni marqueur (test).

## 6. Éléments ajoutés : où et comment

| Besoin | Réalisation | État sans données |
|---|---|---|
| Newsletter | widget existant `emailsubscribe` + 3 réglages (`fields`, `showWhenMissing`, `missingText`) ; code `newsletter` | « Inscription par e-mail non configurée pour le moment. » (public et éditeur, rôle `status`) ; l'éditeur ajoute le chemin Audience → Formulaires d'inscription ; aucun faux champ ; `preflight` ne bloque plus la publication quand `showWhenMissing` est coché ; consentement et messages succès/erreur = ceux du formulaire réel |
| Formulaire de contact | même widget en mode `fields: "all"` (tous les champs d'un formulaire publié du site, de préférence nommé contact/message) ; code `contactform` | « Formulaire de contact non configuré pour le moment. » |
| Réseaux (13) | widget `social` existant ; la limite de 12 éléments est portée à **13** (`nodes.js`) ; codes `socials:…` et `reseaux()` ; adresses par défaut = page d'accueil du réseau, modifiables | — |
| Paiements en pastilles | widget existant `bizpayments` (code `pay`) | rien en public / aide dans l'éditeur (comportement existant) |
| Accordéon mobile | **mécanisme existant** « conteneur en mode accordéon » (`landing.js`, `_node.ejs`) + une option `accMobile` : volets seulement sous 767 px, affichage normal au-dessus ; boutons de 44 px, `aria-expanded`/`aria-controls`, flèches/Début/Fin, focus visible, contenu lisible sans JavaScript (titres de colonne), mouvement réduit respecté ; case à cocher dans le panneau du Page Builder ; rangée `A()` | — |
| Menu déroulant mobile | le même accordéon avec **un seul volet** : `menuDeroulant(titre, codes)` | — |
| Catégories de produits | nouveau widget `shopcategories` (catégories réelles de la boutique du site, ignorées si vides) ; code `shopcats` | « Aucune catégorie de produits pour le moment. » ; l'éditeur dit si le module Commerce est inactif ou la boutique fermée |
| Suivi de commande, compte, panier, souhaits, livraison/retours | nouveau widget `shoplinks` (vrais liens `/boutique/…` ; « Livraison et retours » pointe vers la page des conditions de vente si renseignée) | « La boutique n'est pas encore ouverte. » |
| Liens légaux | widget existant `bizlegal` + réglage `hintMissing` ; code `legallinks` | les visiteurs ne voient jamais de lien mort ; l'éditeur nomme les pages non renseignées |

Les nouveaux widgets ont des « parties » stylables (`parts.js`), des gabarits (`views/marketing-public/widgets/`), un schéma éditable dans le panneau comme les autres widgets.

## 7. Décisions prises (et pourquoi)

- **Déplacer, pas réécrire** le moteur : zéro risque de régression sur les 100 pieds existants (preuve par empreinte).
- **Rattacher les anciens aux 15 familles** plutôt que garder deux listes de familles : le filtre de l'interface reste un seul menu ; les tests existants qui parlaient de « 10 familles de 10 » ont été adaptés (voir rapport).
- **Public : phrase simple, pas de jargon** pour l'état « non configuré » ; le chemin de réglage n'est montré que dans l'éditeur.
- **Pages légales manquantes** : pas de lien mort en public (contrairement à la newsletter, un lien vers une page absente est pire qu'une absence) ; signalement explicite dans l'éditeur.
- **Clés de famille sans accent** (`creatifs-portfolios`, `ecommerce`…) : sûres dans les adresses.
- **Ambiances par jetons** : l'agent choisit fond/texte/accent, le reste est calculé ; une ambiance qui échoue AA est refusée à la création.
- **Pas de migration** : tout est dans le code ; aucun changement de base. Favoris (par utilisateur et par site), tri, version de composition : **non faits** dans cette étape (étapes 8 à 10 du plan, hors périmètre « fondations »).

## 8. Limites connues

- Aucun des 100 nouveaux modèles n'existe : les tests de l'état final (100 listés, répartition, similarité ≤ 0,85) sont **ignorés** tant que les 15 familles ne sont pas `built`.
- La mesure Chrome utilise l'aperçu du catalogue (`/api/bibliotheque/footer/<id>/apercu`) ; elle ne remplace pas un regard humain sur les captures.
- L'accordéon mobile se calcule au chargement et au changement de taille (requête `matchMedia`) ; un défilement de 767 px à la limite exacte n'a pas été testé sur appareil réel.
- La soumission d'un formulaire placé dans un pied dépend du mécanisme existant des widgets de formulaire (route `/p/<page>/inscription`) : non retesté de bout en bout dans cette étape.
- Le contraste mesuré par le script est celui du texte sur le fond opaque le plus proche ; un texte posé sur une image n'est pas évalué (aucun modèle n'utilise d'image).
- L'interface de la bibliothèque (favoris, tri, 15 filtres dédiés) n'a pas été modifiée.

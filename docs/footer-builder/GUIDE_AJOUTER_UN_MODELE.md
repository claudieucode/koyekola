# Guide : ajouter un modèle de pied de page (agents de famille et développeurs)

Date : 8 novembre 2026. Pour l'architecture et les décisions, voir `FOOTER_RECONSTRUCTION_ARCHITECTURE.md`.

## 1. Où écrire

- Un fichier par famille : `src/themeBuilder/catalog/footer/familles/<famille>.js` (15 fichiers déjà créés, vides). **Ne modifiez que le fichier de votre famille** (et, à la fin, la table d'alias, voir §7).
- Le kit commun : `src/themeBuilder/catalog/footer/kit-conception.js` (échelles, ambiances, rangées, éléments). Le moteur est `footer/moteur.js` : **ne le modifiez pas** sans accord (il sert à tous les modèles).
- Exemple de départ (à copier) : ouvrez un fichier de famille, remplissez `models` et passez `built: true` quand la famille compte exactement sa cible.

## 2. Format d'un modèle

```js
const { modele, identifiantModele, C, L, T, Z, A, colonnes12 } = require("../kit-conception");

module.exports = {
  key: "corporate", label: "Corporate", description: "…", target: 8, built: false,
  models: [
    modele({
      id: identifiantModele("corporate", 1, "grande-marque"),   // "ft-corporate-01-grande-marque" (stable, jamais réutilisé)
      name: "Grande marque et quatre colonnes",                   // unique dans toute la bibliothèque (80 caractères au plus)
      family: "corporate",
      description: "Grande zone de marque, quatre colonnes de liens, mentions légales d'entreprise.", // 280 caractères au plus
      tags: ["corporate", "colonnes", "mentions"],
      identity: "marine",                                         // une ambiance du kit, ou ambiance({...}) (voir §4)
      structure: { rows: [ C([[4, "logo", "about"], [2, "head|Société", "menu"], …], { pad: "lg" }), L(["copy"], ["legallinks"], { pad: "sm" }) ] },
      responsive: { mobile: { gap: "20px" } },                    // réglages ajoutés à l'intérieur de chaque rangée, par écran (facultatif)
      widgets: ["sitelogo", "menu", "copyright"],                 // types de widgets réellement utilisés (le test le vérifie)
    }, "corporate"),
    // … jusqu'à la cible
  ],
};
```

`modele()` valide tout de suite et écrit une erreur claire (identifiant, famille, longueur des textes, identité, type de rangée).

## 3. Structure : rangées, colonnes, éléments

Un pied = des **rangées** empilées, chacune est une **bande pleine largeur** dont le contenu est dans un conteneur intérieur centré (1 180 px par défaut ; `max: "960px"` pour plus étroit).

| Rangée | Sens | Exemple |
|---|---|---|
| `C(colonnes, o)` | colonnes qui passent à la ligne ; le **poids** de chaque colonne est sa largeur sur 12 (`colonnes12` vérifie que le total fait 12) | `C([[4, "logo", "about"], [8, …]])` |
| `L(gauche, droite, o)` | une ligne, deux zones (« space-between ») | `L(["copy"], ["legallinks"])` |
| `T(g, c, d, o)` | trois zones, le centre vraiment centré | `T(["menuh"], ["logo:44"], ["socials"])` |
| `Z(éléments, o)` | pile centrée | `Z(["logo:56", "about", "menuh", "copy:c"])` |
| `A(volets, o)` | colonnes qui deviennent un **accordéon sur mobile** | `A([["Produits", "menu"], ["Aide", "links|FAQ>/faq"]])` |

Options de rangée (`o`) : `bg` (`"alt"`, `"accent"`, `"ink"`), `pad` (`xs sm md lg xl` ou `"48px"`), `rule` (`thin accent thick double none`), `max`, `gap`, `frame`, `cards`, `min` (largeur minimale d'une colonne), `tablet` / `mobile` (réglages de style de la rangée par écran).

### Éléments (codes en texte `nom:arg|libellé|texte`)

Anciens (inchangés) : `logo:40`, `title:22`, `about`, `text|…`, `head|Titre`, `H|Titre|2`, `menu` (menu affecté « Pied de page », vertical), `menuh` (horizontal), `hmenu`/`hmenuh` (menu de l'en-tête), `links|Libellé>/page|…`, `link|Libellé|/page`, `social[:plain|big|sq]`, `copy[:c]`, `legal`, `legalinfo[:inline]`, `phone`, `email`, `contact[:inline]`, `hours`, `map`, `cats`, `recent:3`, `popular:3`, `courses:3`, `pay`, `deliv`, `top`, `cta|Libellé|/page`, `cta2|…` (contour), `search`, `account`, `cart`, `toggle|Titre|Texte`, `badge|Nouveau`, `div`, et `news` (ancien, voir ci-dessous).

**Ajoutés par la refonte** (à utiliser dans les nouveaux modèles) :

| Code | Effet | Sans données |
|---|---|---|
| `newsletter\|Titre\|Introduction` | abonnement e-mail (widget `emailsubscribe`) branché sur un formulaire d'inscription publié du site | message « Inscription par e-mail non configurée pour le moment. » visible aux visiteurs et dans l'éditeur (avec le chemin Audience → Formulaires d'inscription) ; aucun faux champ ; la publication n'est pas bloquée |
| `contactform\|Titre\|Introduction` | formulaire de contact : tous les champs d'un formulaire publié du site | « Formulaire de contact non configuré pour le moment. » |
| `socials:facebook+tiktok+x\|big` | réseaux, parmi les 13 (`facebook instagram linkedin youtube x tiktok whatsapp telegram pinterest reddit threads website email`) ; adresses par défaut modifiables dans le panneau | (toujours affichés) |
| `shopcats[:6]` | catégories de produits réelles de la boutique | « Aucune catégorie de produits pour le moment. » |
| `shoplinks` | suivi de commande, panier, souhaits, livraison et retours (vrais liens `/boutique/…`) | « La boutique n'est pas encore ouverte. » |
| `legallinks[:stack]` | Cookies, Contact, pages légales renseignées | pas de lien mort pour les visiteurs ; l'éditeur liste les pages manquantes |
| `pay\|Titre` | moyens de paiement en pastilles (Données de l'entreprise) | rien en public, aide dans l'éditeur |

**Éléments en fonction** (quand un code en texte ne suffit pas) : `widget(type, props, { desktop, tablet, mobile, hideOn, name })` pose n'importe quel widget existant avec ses réglages par écran ; `reseaux([{ network, url }], { taille, forme, titre })` ; `accordeon([{ title, codes }], { start, single })` (volets seulement sur mobile) ; `menuDeroulant("Liens utiles", ["menu"])` (liste de liens repliable sur mobile).

### Règles de contenu

- Jamais de texte, d'adresse ou de coordonnée inventée : utilisez les widgets qui lisent les **Données de l'entreprise** (`contact`, `phone`, `email`, `hours`, `legalinfo`, `legallinks`, `pay`, `deliv`, `copy`). Chaque colonne garde un élément permanent (titre, bouton ou lien) pour ne jamais laisser un trou.
- Les liens relatifs doivent appartenir à `LIENS_PLATEFORME` (kit) : `/ /contact /cookies /faq /connexion /inscription /blog /catalogue /boutique …`. Autre cas : menu affecté, widget de données ou adresse `https://`.
- Pas d'image, de vidéo, de script ni de second `<footer>` : le thème pose l'unique `<footer>`.
- Textes courts, en français, sans jargon technique.

## 4. Identité visuelle (ambiances)

`identity: "marine"` choisit une des 12 ambiances du kit : `neutre ivoire ardoise marine sauge technologie contraste papier poudre institution solidaire luxe`. Pour une ambiance propre à votre famille :

```js
const { ambiance } = require("../kit-conception");
const lagon = ambiance({ key: "lagon", label: "Lagon", humeur: "soft", fond: "#f2fbfa", texte: "#0b3a3a", accent: "#0f766e", police: "font.nunito-sans", titres: "font.lora" });
// …  identity: lagon
```

Vous ne donnez que fond, texte et accent : le texte secondaire, le fond alterné, les filets, la couleur du texte de bouton sont **calculés** et les contrastes **AA (4,5:1)** sont vérifiés à la création (erreur sinon). Polices : uniquement la bibliothèque locale (`font.<nom>`).

## 5. Échelles du kit

Espacement `4 8 12 16 24 32 48 64 96` (`espace(24)`), grille 12 colonnes (`GRILLE`, `colonnes12`), conteneurs (`CONTENEURS`), typographie (`TEXTE`), rayons (`RAYONS`), ombres (`OMBRES`), filets (`FILETS`). Les états survol/focus (`linkStates`, `buttonStates`, `FOCUS`) et les cibles de 44 px sur mobile sont posés **automatiquement** par le moteur pour tous les liens, boutons, menus, réseaux, champs.

## 6. Tester et mesurer

```
# cohérence de toutes les familles construites + garde-fous (rapide, sans serveur)
node --test --test-concurrency=1 tests/footer-reconstruction.test.js tests/footer-aliases.test.js tests/footer-elements-refonte.test.js

# mesure en vrai Chrome (390 / 820 / 1280 / 1440 / 1920 px, avec et sans données d'entreprise)
TEST_START_TIMEOUT_MS=900000 node scripts/audit-pieds-cdp.js --famille=corporate --captures=/tmp/pieds-corporate --sortie=/tmp/pieds-corporate.json
#   options : --id=ft-corporate-01-…  --largeurs=390,1280  --donnees=avec  --max=40
```

Le résumé JSON dit, par catégorie, les défauts : débordement, chevauchement, hors écran, texte coupé, erreur JavaScript, bande non pleine largeur, cible tactile < 44 px (mobile), contraste < AA. Visez **0 défaut** avant de passer `built: true`. Regardez aussi les captures.

Les tests vérifient pour chaque modèle : identifiant `ft-<famille>-<nn>-<nom>` unique, nom unique, famille valide, widgets connus, aucun lien mort, un seul pied, HTML conforme au nettoyeur, description ≤ 280, **empreinte structurelle** distincte (`footer/empreinte.js`). Au final (15 familles construites) : exactement 100 modèles, répartition = cible, **aucune paire de similarité > 0,85**.

## 7. Terminer une famille

1. `models.length === target` et `built: true` dans le fichier de la famille.
2. Les anciens modèles rattachés à votre famille ne sont plus listés (ils restent ouvrables). Pour que « Revenir au modèle d'origine » d'un ancien pied propose le modèle qui le remplace, **remappez** dans `src/themeBuilder/catalog/footer-aliases.js` : `"ancien.id": "ft-<famille>-<nn>-<nom>"` (une valeur d'alias doit exister ; **ne retirez jamais** un ancien identifiant).
3. Lancez les trois fichiers de test ci-dessus et la mesure Chrome de la famille.

## 8. Interdits

Ne touchez pas aux autres types du Theme Builder (en-tête, page, article, archive, recherche, 404, produit, archive produit), aux 24 pieds du Page Builder (`libraryComponents.js`), ni aux pieds déjà installés sur des sites (ce sont des copies). Ne réutilisez jamais un identifiant. Pas de `git push`.

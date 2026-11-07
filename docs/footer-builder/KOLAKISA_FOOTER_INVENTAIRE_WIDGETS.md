# Pied de page : inventaire réel des widgets utilisables (audit du 7 novembre 2026)

Source : exécution de `require("./src/marketing/pages/nodes.js")` (registre `NODE_TYPES`/`WIDGETS`), lecture de `nodes.js` (grammaire des propriétés), `views/marketing-public/_node.ejs` et `widgets/*.js`, et analyse par script des 100 pieds du catalogue.

## 1. Ce qui est vrai pour TOUS les widgets (réglages communs)

Un pied utilise **les mêmes éléments que le Page Builder** : il n'existe aucun registre « widgets de pied ». Le registre contient **149 types** (vérifié par exécution : `Object.keys(NODE_TYPES).length = 149`), dont 6 conteneurs (`container, columns, column, grid, stack, group`), 45 éléments « Motion Studio » (`motion*`) et le reste en éléments classiques.
Groupes de la bibliothèque (`WIDGET_GROUPS`, `nodes.js`) : Mise en page, Basique, Général, Formulaire, Avancé, Site, E-commerce, Réseaux sociaux. Catégories internes (`CATEGORIES`) : Structure, Texte, Média, Interaction, Marketing, Formations, Contenu dynamique, Avancé.

Réglages communs (preuves : `STYLE_PROPS` 86 propriétés ; `capsOf` `nodes.js:1577` ; `matrice de contrôle` `KOLAKISA_WIDGET_CONTROL_MATRIX.md`) :
| Famille de réglage | Disponible | Preuve |
|---|---|---|
| Style (typo, couleurs, marges/remplissages, bordures, rayons, ombre, opacité, filtres/flou d'arrière-plan, position, z-index, ordre, flex/grille…) | OUI sur tous (au niveau de la racine du widget) | `STYLE_PROPS` ; limite : les **sous-parties internes** d'un widget ne sont stylables que via le mécanisme `parts` pour quelques widgets (menu, compte, recherche, logo) |
| États Survol / Focus clavier / Clic | OUI, **un jeu par état, non décliné par écran**, activé selon le widget | `STATES` `nodes.js:31` ; matrice §1 |
| Responsive Ordinateur / Tablette / Mobile (+ Grand écran) avec héritage vers le bas | OUI | `BREAKPOINTS` `nodes.js:24` ; points de rupture réglables par site (820–1279 / 400–767 / grand écran) `siteSettings.js:126-134` |
| Masquer par écran | OUI (`hideOn`) | `nodes.js:1806`, classes `lp-hide-*` |
| Animations d'entrée (≈ registre central), survol, défilement/souris, transformation, masque, « collant » (conteneurs) | OUI selon `capsOf` (tous sauf `spacer`/`modal` ; « collant » seulement conteneurs) | `nodes.js:1577-1586`, `motion.js` |
| Avancé : classes, attributs, CSS de l'élément, interactions, programmation (dates), « masqué au départ », identifiant d'ancre | OUI (CSS/attributs soumis à la permission `pages.code`) | `nodes.js:1840s` |
| Conteneurs seulement : balise HTML (`div, section, header, footer, article, aside, nav`), lien sur tout le conteneur, séparateurs de forme, diaporama de fond, vidéo de fond (mp4/webm, début/fin/secours/une fois), mode onglets/accordéon/carrousel | OUI | `nodes.js:389`, `1825`, `1838`, `1842` |

Les 100 pieds du catalogue n'utilisent, eux, qu'un sous-ensemble : `layout 100, container 466, group 195, stack 170, heading 125, copyright 100, menu 88, link 95, sitelogo 48, text 46, social 34, button 21, iconlist 21, querylist 21, signupform 15, sitetitle 17, map 4, account 6, minicart 5, search 3, dyntext 3, divider 2, toggle 2, courselist 1` (script d'analyse de cet audit). **Jamais** utilisés dans le catalogue : image, galerie, vidéo, accordéon, témoignage, citation, tableau, `sharebuttons`, `html`, animations d'entrée, vidéo de fond, états survol, balise `footer`.

## 2. Inventaire par famille demandée

Statuts : **OK** = équivalent présent et utilisé/rendu (preuve donnée) ; **partiel** = présent mais incomplet ; **ABSENT** ; **non vérifié** = présent au registre, pas d'exécution dédiée au pied dans cet audit.
« Réglages de contenu » = champs de la fiche du widget (grammaire `props` de `nodes.js`).

### 2.1 Identité
| Besoin | Équivalent | Statut | Réglages de contenu (principaux) | Remarques / manques |
|---|---|---|---|---|
| Logo | `sitelogo` | **OK** (48 pieds) | hauteur 20–160, lien vers l'accueil, hauteur/texte au défilement | lit le logo des réglages d'identité du site ; pas de logo alternatif clair/sombre ; `nodes.js:792` |
| Titre du site | `sitetitle` | **OK** (17) | balise (`p, span, h1–h3`), lien, texte au défilement | `nodes.js:797` |
| Description / slogan | **ABSENT** comme source dynamique | partiel | texte libre (`text`) ou `heading` ; le catalogue met un texte-exemple « Décrivez en une ou deux phrases… » (`footer.js:23`) | aucune étiquette `{{site.tagline}}` ni champ « slogan » du site ; seules sources `site.name`, `site.url` (`dynamic.js:95-96`) |
| Texte | `text` | **OK** | HTML riche nettoyé | — |
| Image | `image`, `imagebox` | OK (registre), non utilisé par le catalogue | médiathèque ou https, texte alternatif obligatoire, lien | non vérifié dans un pied |
| Galerie | `gallery`, `carousel`, `mediacarousel` | OK (registre), non vérifié dans un pied | — | — |
| Icône | `icon`, `iconbox` | OK (registre) | 145 icônes (`iconNames()`, vérifié) | — |
| Liste d'icônes | `iconlist` | **OK** (21) | lignes `{texte, icône, lien}` jusqu'à 30, couleur d'icône, en ligne, séparateurs | utilisée pour adresse/e-mail/téléphone (`footer.js:75`) : texte **saisi à la main** |

### 2.2 Navigation
| Besoin | Équivalent | Statut | Réglages | Remarques / manques |
|---|---|---|---|---|
| Menu principal / secondaire | `menu` (source `location` header/footer/mobile, `name`, ou `manual`), `cmsmenu` | **OK** (88 pieds) | emplacement ou nom de menu, vertical/horizontal, bouton mobile, 1 niveau de sous-menu (12 liens, 10 enfants en saisie manuelle) | lit le menu AFFECTÉ dans Apparence → Menus (une seule source) ; `nodes.js:594` |
| Menu déroulant | `menu` avec enfants | partiel | un seul niveau de sous-menu | pas de méga-menu dans un pied |
| Liste de liens | `link` (ou `links` du catalogue = pile de `link`), `list` | **OK** (95) | libellé, adresse, nouvel onglet, rel | — |
| Catégories / taxonomies | `querylist` (source `categories`, `tags`, `authors`, `pages`, `posts`, `courses`, `products`) | **OK** (21 pieds : catégories, récents, populaires) | titre, source, mode, nombre, disposition, compteur | catégories de PRODUITS : source `products` listée, **liste de catégories de produits** non vérifiée |
| Plan du site | `sitemap` | OK (registre), non vérifié | pages, articles… | — |
| Fil d'Ariane | `breadcrumb` | OK (registre) | — | peu utile en pied |

### 2.3 Contenus
| Besoin | Équivalent | Statut | Remarques |
|---|---|---|---|
| Titre | `heading` (1–6, balise `p` possible) | OK (125) | — |
| Texte / liste / séparateur | `text`, `list`, `divider` | OK (`divider` 2) | — |
| Bouton | `button`, `motionbutton`, `cta` | OK (21) | lien, variante primaire/contour |
| Accordéon | `accordion` (question/réponse) + mode accordéon sur conteneur | OK (registre) ; non utilisé au catalogue | utile pour pied mobile |
| Bascule (toggle) | `toggle` | OK (2) | — |
| Témoignages | `testimonial`, `testimonialcarousel`, `reviews`, `motiontestimonials` | OK (registre), non vérifié dans un pied | — |
| Citation | `quote` | OK (registre) | — |
| Carte | `map` (Google Maps par adresse, sans clé d'API) | **OK** (4) | adresse, zoom 1–20, hauteur 150–800 ; l'adresse du site n'est **pas** connue du catalogue (valeur neutre « France ») `footer.js:76` |

### 2.4 Réseaux sociaux
| Besoin | Équivalent | Statut | Réglages | Manques |
|---|---|---|---|---|
| Icônes de réseaux | `social` | **OK** (34) | 13 réseaux (Facebook, Instagram, LinkedIn, YouTube, X, TikTok, WhatsApp, e-mail, Telegram, Pinterest, Reddit, Threads, site) ; 12 liens ; taille 24/32/40/48 ; forme rond/carré/simple ; nom accessible | pas de Snapchat/Discord/GitHub/Twitch ; les adresses du catalogue sont des **exemples** (facebook.com…) à remplacer ; pas de couleur de marque par réseau (non vérifié) |
| Partage | `sharebuttons` | OK (registre), jamais au catalogue | 9 réseaux (Facebook, X, LinkedIn, WhatsApp, Telegram, Pinterest, Reddit, Threads, e-mail) | adresse de partage construite côté serveur, https uniquement |

### 2.5 Communication
| Besoin | Équivalent | Statut | Remarques |
|---|---|---|---|
| Formulaire de contact / inscription / newsletter | `signupform` (formulaire RÉEL de l'espace Audience) | **OK** (15 pieds) | titre, intro, bouton ; **pas de champ libre** : il faut avoir créé un formulaire ; sans formulaire, le catalogue se replie sur un bouton « Nous contacter » (`footer.js:55-57`) |
| Champ e-mail seul | via `signupform` d'un formulaire à un champ | partiel | pas de widget « champ e-mail » autonome |
| CTA | `button`, `cta`, `motionbutton`, `floatingbutton` (WhatsApp/Messenger/e-mail/SMS fixé à l'écran) | OK | — |

### 2.6 Informations professionnelles
| Besoin | Équivalent | Statut | Remarques |
|---|---|---|---|
| Adresse, téléphone, e-mail, coordonnées | `iconlist` / `text` avec texte saisi | **partiel** | **aucune donnée centrale « Coordonnées de l'entreprise »** : tout est saisi à la main dans chaque pied (`footer.js:75` met « Votre adresse e-mail… ») ; aucun lien `tel:`/`mailto:` automatique (non vérifié pour `iconlist.link`) |
| Horaires d'ouverture | `text` libre ; item `hours` du catalogue | **partiel** | texte « Indiquez vos jours et heures » (`footer.js:77`) ; pas de widget horaires (jours, ouvert/fermé maintenant) |
| Mentions légales / confidentialité / CGV | `link` vers des pages | **partiel** | le catalogue code en dur `/cookies`, `/contact`, `/faq` (`footer.js:68`) : l'existence des pages `/contact` et `/faq` n'est pas garantie (non vérifié) ; le lien de confidentialité automatique n'existe que dans la ligne légale ajoutée au chemin A (`_foot-legal.ejs`), pas dans le dessin du pied ; aucune page « CGV » créée automatiquement |

### 2.7 Dynamique
| Besoin | Équivalent | Statut | Preuve |
|---|---|---|---|
| Copyright automatique | `copyright` | **OK** (100/100 pieds) | rendu `© <année> <propriétaire>. <texte>` (`_node.ejs:129`), propriétaire vide = nom du site |
| Année courante | `copyright` ; `dyntext source=year` ; étiquette `{{date.year}}` | **OK** | `nodes.js:749`, `dynamic.js:98` |
| Nom du site | `sitetitle` ; `{{site.name}}` | **OK** | `dynamic.js:95` |
| Logo dynamique | `sitelogo` | **OK** | — |
| Infos utilisateur connecté | `account` (se connecter / mon compte / panier), `dyntext firstName`, étiquettes `{{user.first_name}}`, `{{user.logged_in}}`, `{{user.cart_count}}` | partiel | prénom, état connecté, panier seulement ; pas d'avatar, e-mail, rôle |
| Champs personnalisés | **ABSENT** | — | aucune source `meta.*`/champ personnalisé dans `dynamic.js` (60 sources : post, author, term, archive, product, user, site, date, query, page) |
| Slogan, e-mail, téléphone, adresse, horaires du site en dynamique | **ABSENT** | — | seules `site.name` et `site.url` existent |

### 2.8 E-commerce
| Besoin | Équivalent | Statut | Remarques |
|---|---|---|---|
| Panier | `minicart` (icône + compteur), `cart`, `shopcart` | **OK** (5) | `minicart` : texte, compteur, masquer si vide |
| Compte client | `account` | OK (6) | affiche connexion/compte |
| Boutique / catégories de produits | `querylist source=products`, `shopgrid`, `shopsearch`, `shopfilters` | partiel | pas de « liste de catégories de produits » dédiée (non vérifié) |
| Moyens de paiement (logos) | **ABSENT** | — | seuls `stripebutton`, `paypalbutton` (boutons de paiement hébergés) ; pas de rangée d'icônes Visa/MasterCard/PayPal |
| Livraison / retours | **ABSENT** (texte libre possible) | — | — |

### 2.9 Autres
| Besoin | Équivalent | Statut | Remarques |
|---|---|---|---|
| Retour en haut | **ABSENT** | — | aucun widget ni comportement « scroll to top » (recherche dans `src`, `public/js`, `views` : seulement des occurrences sans rapport dans des thèmes) ; contournement : bouton + ancre `#` |
| Carte Google Maps | `map` | OK | voir 2.3 |
| Vidéo | `video` (YouTube, Vimeo, mp4 médiathèque), `videoplaylist` | OK (registre) | titre obligatoire (accessibilité) |
| HTML contrôlé | `html` (balises de texte, SVG nettoyés) | OK (registre) | permission `pages.code` ; **jamais** utilisé au catalogue |
| Ancre | `menuanchor` | OK (registre) | nom d'ancre unique dans la page |
| Langue / devise | **ABSENT** | — | pas d'internationalisation dans les éléments |
| Compte à rebours, compteur, progression | `countdown`, `counter`, `progress` | OK (registre) | — |

## 3. Ce qui MANQUE (liste courte, triée par utilité pour un pied)

0. **Liens `tel:` / `mailto:` / `sms:`** acceptés par la validation d'adresse (aujourd'hui refusés `sections.js:19`).
1. **Données d'entreprise centrales** (adresse, téléphone, e-mail, horaires, slogan, SIRET/mentions, adresse postale) + étiquettes dynamiques `{{site.phone}}` etc. + widget « Coordonnées » et « Horaires d'ouverture » (avec « ouvert maintenant »).
2. **Retour en haut** (bouton ou lien, mouvement réduit respecté).
3. **Liens légaux gérés** (mentions légales, confidentialité, CGV, cookies) : une source unique de pages légales du site, avec lien automatique ; aujourd'hui `/cookies` codé en dur et ligne légale seulement sur le chemin A.
4. **Moyens de paiement** (rangée de logos) et **livraison/retours** (blocs de réassurance).
5. **Catégories de produits** (liste dédiée) et **sélecteur de langue/devise**.
6. **Champs personnalisés / étiquettes dynamiques de site** (au-delà de `site.name`, `site.url`).
7. **Balise `<footer>` posée automatiquement** sur la racine du pied (aucun des 100 modèles ne la pose).
8. **Champ e-mail autonome** (newsletter minimale sans devoir créer un formulaire).
9. Réseaux : couleurs de marque, davantage de réseaux, widget « rejoignez-nous » prêt à l'emploi.
10. Sous-parties stylables (liens d'un menu, champs/bouton d'un formulaire) : limité au mécanisme `parts` (menu, compte, recherche, logo seulement).

## 4. Notes de fiabilité

* « Fonctionnel » = le widget a un schéma validé (`nodes.js`) et un gabarit de rendu public (`_node.ejs`/`widgets/*.js`). Les widgets cités « OK (registre) » n'ont pas été rendus dans un pied pendant cet audit.
* Les 100 pieds sont validés par `tests/theme-builder-pieds-bibliotheque.test.js` (grammaire du Page Builder, 100 aperçus 200, un seul pied par page) ; non relancé en entier ici (durée), voir `RISQUES_ET_CONTRAINTES`.
* Tests liés aux widgets : `widgets-theme-builder-unicite*` (unicité), non relancés ici.

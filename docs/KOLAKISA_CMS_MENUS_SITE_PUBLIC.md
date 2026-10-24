# Menus : du menu enregistré au site public (mission MENUS-PUBLIC-01)

Branche `menus-public-01`, issue de `origin/main` (`8a14d17`). Complète `KOLAKISA_CMS_MENUS.md` (moteur et administration). Ce document décrit le **rendu public** et ce qui a été corrigé.

## 1. Problème reproduit

Site « teste second » : menu « Menu principal » (tarifs, page teste deux, Defilements deux) **publié** et **affecté à « En-tête du site »** ; le site public affichait « Programme » et « Blog » en haut et « teste second · Cookies » en bas. Reproduit à l'identique dans un vrai serveur avant toute modification (capture « avant »).

## 2. Cause confirmée (code, données, rendu)

1. **Le widget « Menu » du Page Builder est une liste de liens écrite dans la page**, avec une **valeur par défaut de démonstration** (`Programme → /catalogue`, `Blog → /blog`, `nodes.js`). Un en-tête composé avec ce widget (cas courant) contient ces deux liens figés.
2. **Aucun consommateur n'interprétait l'affectation d'un emplacement.** Le moteur de navigation sait dire « quel menu pour `header` ? » (`forLocation`), mais seul le widget « Menu du CMS », à ajouter à la main, l'appelait. Le gabarit public (`landing.ejs`) n'avait ni en-tête ni emplacement de pied de page : une affectation sans widget ne s'affichait nulle part.
3. **Repli entre sites** : le widget « Menu du CMS » retombait sur les menus du **site principal** quand le site n'avait pas de menu propre.
4. « teste second · Cookies » n'est **pas un menu** : c'est la ligne légale du gabarit (nom du site + lien de réouverture du consentement aux cookies), fonction légitime conservée, rendue une seule fois.
5. Non en cause (vérifié) : cache (les pages publiques sont en `no-store`, aucune mémorisation côté serveur), aperçu (même `viewModel` que la page publiée), ordre des éléments, isolation des affectations par site (déjà correcte dans `nav_locations`).

## 3. Correction (un seul moteur : `services/navigation`)

- **Widget « Menu »** : nouvelle propriété `source` — `location` (menu affecté à un emplacement : en-tête / pied de page / mobile), `name` (un menu précis **du site**) ou `manual` (liste écrite, forme historique). Les nouveaux widgets prennent `location: header` **sans aucun lien de démonstration**. En `location` / `name`, **aucun lien n'est écrit dans la page** : ils sont lus à l'affichage (`landing/index.js › resolveMenuNode`), donc l'aperçu, la page publiée et le canevas suivent toujours le menu enregistré.
- **Anciens en-têtes sans migration** : un widget `manual` dont la liste est **exactement** la démonstration non modifiée (`isDemoMenu`) est traité comme « en-tête » (il cède la place au menu affecté ; sans menu affecté il n'affiche rien). Une liste modifiée, même d'un mot, reste explicite et intacte. **Aucune donnée n'est réécrite ni supprimée.**
- **Isolation** : un menu n'est cherché que dans **le site de la page** (`site_id` NULL = site principal) ; **plus aucun repli** vers le principal ou vers un autre site (widget « Menu du CMS » corrigé). Sans menu affecté : rien (état vide), jamais un menu par défaut.
- **En-tête et pied de page automatiques** (`autoNavigation`, `_autonav.ejs`) : une page de site sans en-tête / sans pied de page **composé** affiche le menu affecté à l'emplacement (c'est le rôle d'une affectation). Jamais en double (si la page montre déjà ce menu par widget), jamais si l'en-tête est retiré pour la page, jamais pour une page d'atterrissage ou une étape de tunnel.
- **Starter pack** : le menu du pack est créé **dans le site** et **affecté explicitement** à l'en-tête s'il est libre (jamais en remplaçant un menu déjà affecté) ; il reste brouillon jusqu'à la publication de ses pages.
- **Nouveaux sites** : aucun menu, aucune affectation, aucun lien imposé (vérifié) ; leur premier menu affecté s'affiche aussitôt.
- **Éditeur** : l'inspecteur du widget propose « Source des liens » (emplacement / menu précis / liste manuelle) ; passer en liste propose un premier lien (jamais un widget invalide) ; le canevas montre le menu affecté ou un état vide explicite.
- **Styles** : `landing.css` (en-tête automatique, navigation du pied de page, sous-menus au survol / au clavier, mobile) ; les menus composés gardent le style de leur thème.

## 4. Fichiers

`src/marketing/pages/nodes.js` (source, valeur par défaut, `isDemoMenu`) · `src/marketing/landing/index.js` (`resolveMenuNode`, `autoNavigation`, `menuFor`) · `views/marketing-public/_node.ejs`, `_autonav.ejs`, `landing.ejs` · `src/marketing/pages/widgets/site.js` (plus de repli) · `src/services/templateLibrary.js` (affectation du menu d'un pack) · `public/js/page-builder.js` · `public/css/landing.css`. **Aucune migration.**

## 5. Tests

`tests/menus-site-public.test.js` (8, serveur réel) : reproduction, en-tête et pied de page indépendants (ou même menu aux deux), persistance, brouillon = rien, réordonner / sous-menu / retirer / désaffecter, aperçu = public, isolation et droits entre sites, site neuf, liste manuelle explicite, menu précis limité au site, starter pack. `tests/editeur-menu-source-navigateur.test.js` (Chrome). Adaptés : `navigation-par-site-unitaire` (plus de repli) et `apparence-templates` (menu de pack affecté à l'en-tête).

## 6. Limites connues

- Le **menu mobile** (emplacement « mobile ») est lu par le widget (source `location: mobile`) mais n'a pas d'affichage automatique.
- L'en-tête automatique est volontairement sobre (nom ou logo du site + menu) ; le style fin d'un en-tête se compose dans Apparence → En-tête.
- Un en-tête composé de **liens écrits à la main modifiés** continue d'afficher ces liens (choix explicite) : l'inspecteur propose de passer à la source « emplacement ».
- Les pages **d'atterrissage** et les étapes de tunnel n'affichent pas de navigation automatique (campagnes sans distraction).

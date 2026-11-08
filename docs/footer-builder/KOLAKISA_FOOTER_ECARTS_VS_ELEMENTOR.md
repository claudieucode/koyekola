# Pied de page : écarts Kolakisa / Elementor et chantiers (audit du 7 novembre 2026)

Sources Elementor : `docs/theme-builder/elementor-footer-reference.md` et les sept fichiers `docs/footer-builder/ELEMENTOR_FOOTER_*.md` (relus à la fin de l'audit). Fiabilité Elementor reprise de ces fichiers : [C] confirmé par article officiel, [N] non vérifiable, [K] recommandation Kolakisa. Aucune interface Elementor réelle n'a été ouverte par personne : ne rien lire comme « observé ».
Colonne Kolakisa : OK / partiel / absent (preuves dans les cinq autres documents de ce dossier ; ici le fichier:ligne principal).
Priorité : **P0** bloquant pour un « Footer Builder professionnel » · **P1** important · **P2** souhaitable. Effort : S (≤ 1 jour), M (2–5 jours), L (> 1 semaine). Risque : B/M/E pour faible/moyen/élevé (casser l'existant ou entrer en collision).

## 1. Matrice

| # | Fonctionnalité | Elementor | Kolakisa | Preuve | Prio | Effort | Risque |
|---|---|---|---|---|---|---|---|
| 1 | Un seul pied rendu par page | un pied standard [C] ; priorité exacte non publiée [N] | **OK** (barème propre) | `render.js:51`, `landing.ejs:43`, `footer.ejs:8` ; test `pied-unique` 4/4 | — | — | — |
| 2 | Balise `<footer>` / repère `contentinfo` | « Footer Settings > HTML Tag = footer » [C] | **partiel** : possible sur un conteneur, jamais posé, rendu `<div>` | `nodes.js:389`, `_sections.ejs:19`, comptage 0/100 | **P0** | S | B |
| 3 | Rendu identique sur toutes les pages (Page Builder / blog / boutique / compte) | un seul rendu thème [C] | **partiel** : 3 chemins, boutique non couvert, zones `footer-1/2` + ligne légale seulement chemin A | `landingPublic.js:48`, `themeLayout.js:12`, `views/boutique/_bottom.ejs:2` | **P0** | M | M |
| 4 | Fenêtre « Où afficher ? » à la première publication | oui [C] | **absent** (conditions séparées, défaut = tout le site) | `views/marketing/theme-builder.ejs:59-65`, `theme-builder.js:128` | **P0** | S | B |
| 5 | Conditions inclure / exclure, plusieurs, précision | oui ; barème non publié [N] | **OK** | `conditions.js`, `match.js:13` ; `noyau` 14/14, `regles` 12/12 | — | — | — |
| 6 | Cibles : produit, boutique, compte, formation, types perso | Woo, CPT [C] | **partiel** : produit/boutique en logique mais sans effet visible ; compte, formation, CPT absents | `types.js:5`, `render.js:21-31` | **P0** (formations = cœur du produit) | M | M |
| 7 | Choix de cible par liste (pages, catégories, étiquettes) | sélecteur à recherche [C] | **partiel** : champs texte (identifiants, noms séparés par virgules) | `theme-builder.js:317-327` | P1 | M | B |
| 8 | Conflits signalés | avertissement [C] | **OK** (bloquant + avertissement) | `resolve.js:51` | — | — | — |
| 9 | Conditions par rôle / connecté / langue / date / appareil | Display Conditions d'élément (Pro) [C] | **absent** au niveau du pied ; partiel par élément (`schedule`, audiences, `hideOn`) | `nodes.js` normalizeSchedule | P2 | M | M |
| 10 | Pastille en ligne / brouillon, Instances | oui [C] | **OK** | `themeBuilder.js:41`, `instances.js` | — | — | — |
| 11 | Renommer, dupliquer, archiver, supprimer confirmé | rename/trash [C], duplication [N] | **OK** | `store.js:97-171`, `theme-builder.js:286` | — | — | — |
| 12 | Aperçu | Preview [N] | **OK** | `pages/index.js:975` (`force`) | — | — | — |
| 13 | Autosave | [N] | **OK** 1 s + copie locale | `page-builder.js:8356,8381` | — | — | — |
| 14 | Annuler / rétablir | oui [C] | **OK** | `page-builder.js:257-258` | — | — | — |
| 15 | Révisions à chaque enregistrement (25) | oui [C] | **partiel** : instantané à chaque **publication**, 30 | `store.js:125-152` | P1 | M | M |
| 16 | Retour au modèle initial / réinstaller | — | **absent** pour le pied (existe pour l'en-tête) | `themeBuilder.js:108-121` | P2 | S | B |
| 17 | Import / export JSON | export + import `.json/.zip` [C] | **OK** `.json` seulement ; conditions allégées ; import en brouillon | `portable.js:8-42` | P2 (lot, zip) | S | M |
| 18 | Bibliothèque de pieds prêts | modèles propriétaires [N] | **OK** : 100 compositions distinctes | `catalog/footer.js` ; `pieds-bibliotheque` | — | — | — |
| 19 | Conteneurs imbriqués, flex, grille | oui [C] | **OK** | `STYLE_PROPS`, `nodes.js:18-19` | — | — | — |
| 20 | Boxed / pleine largeur | oui [C] | **OK** | `props.full/band`, `partBleeds` | — | — | — |
| 21 | Arrière-plan couleur/dégradé/image/vidéo | oui (vidéo : widget/conteneur [C]) | **OK** (vidéo avec secours, pause en mouvement réduit) | `nodes.js:1842`, `landing.js:398` | — | — | — |
| 22 | Séparateur de forme, ombre, bordure, rayon | oui [C] | **OK** | `nodes.js:1825` | — | — | — |
| 23 | Pied « boxed » réglé globalement (réglages du pied) | Footer Settings [N] | **absent** | — | P1 | M | M |
| 24 | États Survol / Focus / Actif | survol [C] | **OK** mais un jeu non décliné par écran ; 0 état dans les 100 pieds | `nodes.js:31` | P1 | M | M |
| 25 | Transformations, filtres, transitions | oui [C] | **OK** | `COMPOSED` | — | — | — |
| 26 | Animations d'entrée (37 chez Elementor) | oui, gratuit [C] | **OK** (registre central) | `motion.js` | — | — | — |
| 27 | Effets de défilement / sticky | Pro [C] | **OK** en capacité ; pas de comportement de pied | `nodes.js:1580` | P2 | M | M |
| 28 | Respect de prefers-reduced-motion | [N] (non détaillé) | **partiel** : entrées, défilement, vidéo, survol prédéfini ; pas les transitions/transformations manuelles | `motion.js:8`, `kw-effects.js:94`, `landing.js:398`, `landing.css:665` | **P0** (accessibilité) | S | B |
| 29 | Responsive 3 appareils + héritage | oui [C] | **OK** (+ grand écran) | `nodes.js:24`, `page-builder.js:22` | — | — | — |
| 30 | Points de rupture personnalisables / supplémentaires | 2 modifiables + jusqu'à 6 [C] | **partiel** : 2 modifiables **par site** (+ grand écran), pas de supplémentaires, pas par pied | `siteSettings.js:126-134` | P2 | M | M |
| 31 | Ordre et masquage par appareil | oui [C] | **OK** | `nodes.js:1806` | — | — | — |
| 32 | Logo, titre du site | Pro [C] | **OK** | `nodes.js:792,797` | — | — | — |
| 33 | Menu de navigation | Pro [C] | **OK** (menu affecté) | `nodes.js:594` | — | — | — |
| 34 | Icônes sociales | gratuit [C] | **OK** (13 réseaux) | `nodes.js:667` | P2 (couleurs de marque) | S | B |
| 35 | Formulaire / newsletter | Pro [C] | **OK** (formulaire réel obligatoire, pas de champ libre) | `nodes.js:845` | P1 (champ e-mail simple) | M | M |
| 36 | Liens `tel:`/`mailto:` | oui (lien libre) | **absent** : validation refuse | `pages/sections.js:19-26` | **P0** | S | M (sécurité à garder) |
| 37 | Coordonnées / horaires centralisés | texte libre ; étiquettes dynamiques [C] | **absent** (saisie manuelle par pied) | `footer.js:75-77`, `dynamic.js:95-96` | **P0** | M | M |
| 38 | Copyright avec année automatique | Heading + étiquette date [C] | **OK** (widget natif) | `_node.ejs:129` | — | — | — |
| 39 | Liens légaux (mentions, confidentialité, CGV) | texte/menu | **partiel** : liens codés en dur `/cookies`, `/contact`, `/faq` ; ligne légale seulement chemin A | `footer.js:68`, `_foot-legal.ejs` | P1 | M | M |
| 40 | Retour en haut | — (non central) | **absent** | recherche dans le code | P1 | S | B |
| 41 | Moyens de paiement, livraison | Woo | **absent** | — | P2 | S | B |
| 42 | Champs personnalisés dynamiques | ACF/Pods (Advanced+) [C] | **absent** | `dynamic.js` | P2 | L | M |
| 43 | Carte | gratuit [C] | **OK** (adresse neutre « France » par défaut) | `nodes.js:853` | P2 (adresse du site) | S | B |
| 44 | HTML / shortcode / CSS perso | Pro avancé [C] | **OK** `html` nettoyé + CSS (permission `pages.code`) | `nodes.js:694` | — | — | — |
| 45 | Accessibilité interne des widgets | [N] | **non vérifié** | — | P1 | M | B |
| 46 | Droit de gestion propre au thème | rôles WP | **partiel** : droits « formulaires » (`forms.read/write`) | `themeBuilder.js:2` | P2 | S | M |
| 47 | Isolation multisite | multisite WP | **OK** | `store.js:15-26` ; `pied-unique` isolation | — | — | — |
| 48 | Migration d'un ancien pied du site | — | **OK** idempotent | `legacy.js:37-58` | — | — | — |
| 49 | Multilingue (WPML) | lien entre modèles [C] | **absent** | — | P2 | L | E |
| 50 | Pas de défilement horizontal / contraste testés par modèle | — | **non vérifié** | — | P1 | M | B |

## 2. Liste ordonnée des écarts à combler

**P0 d'abord** (dans l'ordre) : 2 balise `footer` → 3 rendu unifié → 4 fenêtre « Où afficher ? » → 6 cibles formation/compte/boutique → 36 liens `tel:`/`mailto:` → 37 données d'entreprise → 28 mouvement réduit général. **Puis P1** : 7 sélecteurs de cible, 15 révisions, 23 réglages du pied, 24 états par écran, 35 champ e-mail, 39 liens légaux, 40 retour en haut, 45 accessibilité, 50 tests visuels. **Puis P2**.

## 3. Chantiers indépendants (parallélisables) et fichiers probablement touchés

| Chantier | Contenu (écarts) | Fichiers probablement touchés | Collision à surveiller |
|---|---|---|---|
| **A. Rendu unifié du pied** | 2, 3, une seule logique A/B, balise `footer` + `role`, ligne légale et zones `footer-1/2` cohérentes, pied dans la boutique/compte | `src/themeBuilder/render.js`, `src/marketing/pages/index.js` (zone 930-1060), `src/marketing/web/themeRender.js`, `src/middlewares/themeLayout.js`, `views/partials/footer.ejs`, `views/marketing-public/{landing,_sections,_foot-extra,_foot-legal}.ejs`, `views/boutique/{_top,_bottom}.ejs`, `src/marketing/web/shopPublic.js`, `public/css/landing.css` | **forte** avec l'en-tête (mêmes `withSiteParts`, `themeRender`, `_sections.ejs`) ; tests `pied-unique`, `pied-de-page-coherence`, `en-tete-collant-public`, `pieds-bibliotheque` |
| **B. Conditions et publication** | 4, 6, 7, 9 (partiel) : étape de publication, vues compte/formation/boutique, sélecteurs, droit propre | `src/themeBuilder/{conditions,match,types,resolve,store}.js`, `src/marketing/web/themeBuilder.js`, `public/js/theme-builder.js`, `views/marketing/theme-builder.ejs`, `public/css/theme-builder.css` | moyenne : conditions partagées avec archives/404/produit (tests `noyau`, `regles`, `couverture-rendu`) ; dépend de A pour le rendu des vues boutique |
| **C. Données d'entreprise et widgets manquants** | 36, 37, 39 (source), 40, 41, 43, 34, 35 | nouveaux fichiers `src/marketing/pages/widgets/*.js` (+ `widgets/index.js`), `src/marketing/pages/dynamic.js`, `src/marketing/pages/sections.js` (`linkUrl`), `views/marketing-public/widgets/*.ejs`, `public/css/landing.css`, réglages du site (`siteSettings.js`), éventuelle migration `140_*.sql` | **forte** pour `sections.js`/`nodes.js` (grammaire commune : tout le monde la touche) ; `linkUrl` change la sécurité de tous les widgets → revue obligatoire |
| **D. Éditeur et styles du pied** | 23, 24, 28, 30, 27 : réglages du pied, états par écran, mouvement réduit général, points de rupture | `public/js/page-builder.js` (8 735 lignes), `src/marketing/pages/nodes.js`, `src/marketing/pages/{motion,motionStudio}.js`, `public/js/{kw-effects,landing}.js`, `public/css/{landing,page-builder}.css` | **très forte** : l'éditeur est partagé par toutes les parties et pages ; à isoler en dernier ou à faire par un seul agent |
| **E. Historique et révisions** | 15, 16 : version par enregistrement, comparaison, retour au modèle initial du pied | `src/themeBuilder/store.js`, `src/marketing/web/themeBuilder.js`, `public/js/theme-builder.js`, nouvelle migration (clé d'origine / révisions) | moyenne : `store.js` commun à tous les types ; la migration doit passer le test des migrations figées |
| **F. Catalogue et qualité visuelle** | 18 (mise à jour des 100 pieds pour utiliser les nouveaux widgets, balise footer, états de survol, liens légaux), 50, 45 | `src/themeBuilder/catalog/{footer,identities,kit}.js`, `tests/theme-builder-pieds-*.test.js`, scripts de vérification visuelle | **forte** : `kit.js` et `identities.js` sont partagés avec les en-têtes (100 modèles livrés) ; ne jamais modifier une clé existante |
| **G. Import / export** | 17 : lots, validation du formulaire et des médias par site | `src/themeBuilder/portable.js`, `src/marketing/web/themeBuilder.js` (2 routes), `tests/theme-builder-stockage.test.js` | faible |

Ordre conseillé : **A + B** (P0 rendu et conditions, mais A d'abord car B en dépend pour les vues boutique) ; **C** en parallèle (fichiers neufs) ; **E, G** ensuite ; **F** après C (utilise les nouveaux widgets) ; **D** à part, en dernier ou monopolisé.

## 4. Points où Kolakisa fait déjà mieux qu'Elementor (à ne pas casser)
* Un seul pied par page **testé**, avec explication des conflits (« Pourquoi ce modèle ? »).
* Isolation par site contrôlée à chaque requête ; exports sans identifiants de site.
* 100 pieds livrés prêts à l'emploi, sans contenu inventé (menus lus dans les menus affectés, formulaire réel ou bouton).
* Vidéo de fond avec image de secours et pause en mouvement réduit.

# Programme 20.6 — Guided Website Creation Experience : implémentation

## État initial (audité dans le code, pas dans la documentation)
Dépôt `claudieucode/koyekola`, `origin/main` au commit `bd794900`. Déjà opérationnels et **réutilisés** : création de sites (`pages.createSite`), packs de modèles (`templateLibrary`, 5 packs), gabarits de pages (23), jetons de design et palettes, modules activables par site (`siteModules`), registre de domaines (`siteDomains`), navigation, médiathèque, aperçu de page, publication avec contrôle (`pages.publish`), SEO local par site.
**Absent** (constaté) : tout parcours guidé ; toute boutique avec panier (le catalogue de commerce = formations ; `pageTypes.js` marque « Boutique en ligne (panier et paiement) » comme manquante).
Les programmes 20.1 à 20.5 n'ont pas de documents sous ces noms dans le dépôt : l'audit s'est donc fait sur le code.

## Livré
- Assistant en 9 étapes (voir `KOLAKISA_GUIDED_ONBOARDING_FLOWS.md`), accueil à `/marketing/site-web/assistant`, reprise à `/marketing/site-web/sites/:id/assistant`, bouton « Assistant de création » dans « Mes sites ».
- 3 modes : site vierge, modèle professionnel (Template Library), boutique (réduite à ce qui existe).
- 18 types de sites avec description, icône, structure de pages réelle, modèle conseillé, fonctionnalités conseillées.
- Informations régionales par pays (18 pays), 6 langues, 11 devises, formats Intl.
- Identité : 7 orientations (= palette + 2 polices du moteur), 5 couleurs, polices du système de jetons, logo via la médiathèque.
- Pages : propositions par type, ajout (gabarit ou vierge), renommage, corbeille réversible, accueil, ordre, navigation, création du menu.
- Contenus : titre, description, accroche et bouton ; détection des textes d'exemple entre crochets.
- Fonctionnalités : 16 entrées classées « inclus », « module activable » ou « absent » ; prérequis affichés ; aucune connexion externe automatique.
- Aperçu ordinateur/tablette/mobile par le moteur de pages ; alertes non bloquantes.
- Publication : liste de vérification, domaine en lecture, confirmation explicite, résultat page par page.
- Progression : étapes terminées / ignorées / à corriger, pourcentage, sauvegarde automatique avec gestion de conflit et de coupure réseau.

## Fichiers
Créés : `src/siteWizard/catalog.js`, `src/siteWizard/index.js`, `src/marketing/web/siteWizard.js`, `views/marketing/site-wizard.ejs`, `views/marketing/site-wizard-hub.ejs`, `public/js/site-wizard.js`, `public/css/site-wizard.css`, `tests/assistant-creation-site.test.js`, cinq documents `docs/KOLAKISA_*20_6*` / `GUIDED_*`.
Modifiés : `src/marketing/web/index.js` (montage du routeur), `src/marketing/web/routeScopes.js` (l'accueil `/site-web/assistant` classé « organisation »), `views/marketing/sites.ejs` (bouton).

## Base de données
Une table `mk_site_wizard`, créée à la demande, sans migration (114 et 115 sont figées par test). Aucune suppression, aucune modification de table existante.

## Sécurité
Voir l'architecture. Points vérifiés par test : site pris du chemin, page d'un autre site refusée, création réservée à l'équipe, lecteur sans écriture, anonyme renvoyé à la connexion, publication refusée sans confirmation et sans droit.

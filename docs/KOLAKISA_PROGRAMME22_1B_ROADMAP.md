# KOLAKISA — Programme 22 : feuille de route fondée sur les mesures du palier 22.1

Chaque ligne s'appuie sur une observation reproductible (`docs/quality-lab-navigateur/`, `tests/programme22-1b-lab-navigateur.test.js`). Rien ici n'est développé dans le palier 22.1. Les identifiants renvoient au registre des défauts de `KOLAKISA_PROGRAMME22_1B_QUALITY_AUDIT.md`.

## Ordre proposé des paliers

| Palier | Contenu | Pourquoi dans cet ordre |
|---|---|---|
| **22.2 — Assemblage du site** | P0-1, P1-1, P1-2, P1-8 | Sans doublons inter-sites, menus et formulaires, aucun site généré n'est utilisable ; ce sont des défauts de **fonction**, indépendants de l'IA. |
| **22.3 — Du plan au contenu** | P1-3, P1-6 | Les objectifs du plan doivent atteindre les pages ; rien d'inventé ni de crochets publiés. |
| **22.4 — Direction artistique et diversité** | P1-5 + P2-3, P2-4 | Les sites doivent cesser de se ressembler ; dépend d'un assemblage correct (22.2) pour être jugé. |
| **22.5 — Boutiques** | P1-4, P2-6 | L'accueil et les pages de boutique ; réutilise les éléments de page natifs de 20.5. |
| **22.6 — Évaluation avec un vrai fournisseur** | P1-7 | **Exige une clé, un plafond de dépense et une autorisation explicite du propriétaire.** Évalue enfin brief, plan, contenu et images. |
| **22.7 — Finition** | P2-1, P2-2, P2-5, P2-7, P3 | Médias, mobile, accessibilité, performance, structure de données. |

## P0 — fonction essentielle bloquée

### P0-1 · Détection de doublons à l'échelle du site (D-G1)
- **Problème** : une 2e boutique d'une organisation ne peut pas créer ses pages (« Aucune page à enregistrer ») ; sur un site vitrine, les pages « Accueil », « Contact », « À propos » d'un 2e site entrent en conflit avec celles du 1er et reçoivent un suffixe « (2) » visible.
- **Cause racine** : `existingFor` (`src/pageGen/index.js`) cherche par nom et adresse dans **toute l'organisation** ; `applyPages` du constructeur de boutique transforme tout doublon en « ignorer » sans solution.
- **Moteur** : Page Generator ; Shop builder (`ai/shop/project.js`).
- **Solution** : limiter la détection au site visé (`site_id`) ; conserver la protection contre l'écrasement **dans le même site** ; garder l'unicité des adresses publiques (déjà gérée par `freeSlug`) sans modifier le **titre**.
- **Dépendances** : aucune. **Risques** : adresse publique identique entre deux sites sur le domaine principal (aujourd'hui : suffixe) ; ne jamais écraser la page d'un autre site.
- **Tests** : inverser `D-G1` (2e site : application directe, sans suffixe dans le titre) ; test d'isolation : la page d'un autre site n'est jamais modifiée ; 2e et 3e boutiques créent leurs pages.
- **Critères d'acceptation** : 15 scénarios générés dans une **même organisation** sans conflit ; les titres sont ceux du plan ; les tests d'isolation 21.11 restent verts.

## P1 — qualité majeure

### P1-1 · Navigation générée (D-N1)
- **Problème** : aucun menu : l'accueil n'a que 2 liens internes.
- **Cause** : `navigation.main` du plan n'est appliqué par aucun moteur.
- **Moteur** : Workspace / Page Generator (nouvelle étape « assemblage ») ; rendu natif des menus.
- **Solution** : créer, à l'application des pages, l'en-tête et le pied de page à partir de `navigation` du plan (élément « menu » natif, emplacements en-tête/pied), avec le nom du site ; idempotent ; annulable avec les pages.
- **Dépendances** : P0-1. **Risques** : ne pas écraser un menu existant du site ; respecter les modèles de thème.
- **Tests** : accueil avec ≥ 2 liens d'en-tête ; aucun lien cassé ; annulation retire le menu créé ; un menu manuel existant est préservé.
- **Acceptation** : contrôle « navigation entre les pages » vert sur 15/15 ; `liens internes ≥ pages − 1`.

### P1-2 · Formulaires créés ou rattachés (D-G2)
- **Problème** : contact, devis, réservation, rendez-vous, newsletter : non publiables sans formulaire choisi à la main.
- **Cause** : le mapper produit une section de formulaire sans créer ni rattacher de formulaire.
- **Moteur** : Page Generator + moteur de formulaires natif.
- **Solution** : proposer (puis créer sur acceptation) un formulaire natif minimal (nom, e-mail, message) lié à la page, avec consentement ; jamais d'envoi sans configuration d'e-mail.
- **Dépendances** : aucune. **Risques** : anti-spam, RGPD (consentement) — réutiliser les formulaires existants.
- **Tests** : page de contact publiable ; soumission enregistrée ; consentement tracé.
- **Acceptation** : 0 page de conversion bloquée sur 15 ; contrôle « UX » sans pénalité de blocage.

### P1-8 · Adresses réservées (D-U1)
- **Problème** : la page « À propos » (et « Contact », « FAQ », « Cookies »…) est créée, publiée, puis **introuvable (404)** sur le domaine du site : son adresse est réservée à la plateforme.
- **Cause racine** : le Site Planner a sa propre liste `RESERVED_SLUGS` (12 entrées) alors que la plateforme réserve ≈ 70 adresses (`urls.RESERVED`).
- **Moteur** : Site Planner (`reconcile`), Page Generator (`freeSlug`).
- **Solution** : une **seule** source de vérité (`urls.isReserved`) consultée par le planificateur et le générateur ; adresse de remplacement proposée et **annoncée** (« a-propos » → « a-propos-page » ou « notre-histoire ») ; l'adresse réservée ne doit jamais être publiée en silence.
- **Dépendances** : aucune. **Risques** : changer l'adresse d'une page déjà publiée (redirections existantes à conserver).
- **Tests** : inverser `D-U1` ; chaque page publiée est atteignable (200) sur le domaine du site ; aucune adresse réservée affectée.
- **Acceptation** : 0 page publiée en 404 sur 15 scénarios (colonne « erreurs console/réseau » à 0).

### P1-3 · Du plan au contenu (D-C1)
- **Problème** : bandeau titré « Accueil », sans bouton ; section d'appel à l'action disparue ; crochets publiés.
- **Cause** : `bridge.js` ne transmet que le genre ; `mapper.hero` reprend le nom de page ; la publication ne contrôle pas les crochets.
- **Moteur** : Bridge, Component Mapper, Workspace (contrôle de publication), Content Generator.
- **Solution** : transmettre objectif, titre proposé et bouton (avec adresse = page cible du plan) ; ne jamais titrer un bandeau par le nom de la page ; **avertir puis bloquer** la publication tant qu'il reste des crochets (déverrouillable explicitement) ; proposer la rédaction par IA dans le flux avec estimation de coût.
- **Dépendances** : P1-2 (adresse de formulaire). **Risques** : ne rien inventer (adresses, chiffres) ; coût IA.
- **Tests** : accueil avec titre ≠ nom de page et un bouton ; section d'appel à l'action conservée ; publication refusée avec crochets ; texte d'exemple jamais présenté comme réel.
- **Acceptation** : « accueil sans texte d'exemple » et « bouton d'action » verts après l'étape de contenu ; aucun fait inventé (tests adverses).

### P1-4 · Accueil et pages de boutique (D-S1)
- **Problème** : l'accueil d'une boutique est une page de services avec « [Service 1] ».
- **Cause** : recette d'accueil unique ; les éléments de boutique (grille, panier, recherche, filtres) ne sont pas utilisés par le constructeur.
- **Moteur** : Page Generator + Shop builder.
- **Solution** : recette « accueil de boutique » (bandeau, produits mis en avant via l'élément de grille natif, catégories, livraison et retours, bouton vers `/boutique`).
- **Dépendances** : P1-1 (menu avec « Boutique »). **Risques** : ne rien promettre (livraison, retours) sans configuration.
- **Tests** : accueil contenant l'élément de grille ; lien vers `/boutique` ; parcours d'achat simulé inchangé.
- **Acceptation** : 3 boutiques sans crochets sur l'accueil ; parcours d'achat vert aux 3 formats.

### P1-5 · Diversité artistique par secteur (D-V1)
- **Problème** : 14/15 couleurs principales bleues ; 2 associations typographiques.
- **Cause** : `designGen/analyzer.js` ne reçoit que le type de site ; `SECTOR_HUE` ne couvre que 12 catégories ; défaut = 215°.
- **Moteur** : Design Generator (+ Design System).
- **Solution** : passer le **secteur** et le ton du brief à l'analyseur ; élargir les teintes et les associations typographiques ; générer 3 directions réellement distinctes (teinte, typographie, densité) ; contrôle de contraste inchangé ; respecter les couleurs citées.
- **Dépendances** : aucune. **Risques** : cohérence de marque ; charte de la plateforme (le bleu marine reste l'identité de l'**application**, pas des sites générés).
- **Tests** : inverser `D-V1` (≥ 6 teintes distinctes sur 15 scénarios ; ≥ 4 associations) ; contraste AA conservé ; « même brief → mêmes directions » (déterminisme).
- **Acceptation** : diversité mesurée par le laboratoire ; aucune régression de contraste.

### P1-6 · Aucune valeur inventée (D-B1)
- **Problème** : nom, public et ton inventés par le modèle sont conservés.
- **Cause** : `normFact` déclasse sans retirer.
- **Moteur** : Brief Analyzer.
- **Solution** : pour les **noms propres, chiffres, adresses**, une valeur sans citation est **retirée** et remplacée par une question ; l'analyse n'est « prête » que si les faits bloquants sont sourcés.
- **Dépendances** : aucune. **Risques** : trop de questions → plafond de 5 déjà présent.
- **Tests** : inverser `D-B1` ; les valeurs déduites **légitimes** (pays déduit d'une ville) restent possibles.
- **Acceptation** : 0 valeur inventée survivante dans les tests adverses.

### P1-7 · Évaluation avec un vrai fournisseur (blocage externe)
- **Problème** : compréhension, plan, rédaction, images : non évalués.
- **Cause** : aucun fournisseur vérifié ; aucune autorisation de dépense.
- **Solution** : sur autorisation explicite : clé de test, plafond de dépense, **mêmes 15 briefs figés**, relecture humaine à l'aveugle par grille (clarté, ton, exactitude, répétition, invention), mesure du coût et des délais réels.
- **Dépendances** : **décision du propriétaire** (clé, budget). **Risques** : coût ; données personnelles : aucune dans les briefs.
- **Tests** : le laboratoire accepte un fournisseur réel derrière un drapeau explicite, **désactivé par défaut**.
- **Acceptation** : critères « brief » et « contenus » notés avec preuves.

## P2 — importantes

| Id | Problème | Cause | Solution | Tests / acceptation |
|---|---|---|---|---|
| P2-1 | Un seul visuel, d'attente, texte alternatif générique (D-M1) | Fournisseur réel non vérifié ; alt non rédigé | Texte alternatif tiré de l'objectif de la section ; teinte d'attente alignée sur la palette ; `srcset` | alt descriptif ; aucune image cassée |
| P2-2 | Cibles tactiles < 32 px sur mobile (D-R1) | Liens du pied de page et de l'en-tête | Zone cliquable ≥ 44 px dans les composants natifs concernés | 0 cible < 32 px sur 15 sites |
| P2-3 | Contraste mesurable sur peu d'éléments | Fonds à image ou dégradé non évalués | Contrôle du texte sur images (voile garanti) | contraste évalué sur le bandeau |
| P2-4 | Design appliqué non relu dans le rendu | Le laboratoire confirme l'application (aucune erreur) mais ne compare pas les jetons au rendu | Comparer palette appliquée et styles calculés ; appliquer le design aux boutiques | écart palette/rendu = 0 |
| P2-5 | Nom de boutique non détecté sans guillemets (D-B2) | Règle volontairement stricte | Question dédiée avec proposition issue du brief, jamais d'invention | « PixelPort » proposé, confirmé par la personne |
| P2-6 | Titres et descriptions SEO minimaux (D-X1) | Content Generator non exécuté | SEO par page dans le flux de contenu ; longueur et unicité contrôlées | titres uniques, 50–160 car. |
| P2-7 | Performance mesurée par outils maison | Lighthouse non installé | Ajouter Lighthouse ou équivalent hors production, budget de ressources | rapport reproductible |

## P3 — complémentaires

Données structurées produit (JSON-LD `Product`) ; tests Firefox et Safari ; évaluation multilingue (en, es, ar) ; modèles par secteur ; comparaison A/B de directions artistiques ; galerie native (aujourd'hui une image par section).

## Dépendances externes à décider par le propriétaire

1. Fournisseur d'IA texte (clé, plafond mensuel) — **P1-7**.
2. Fournisseur d'images (clé de test, plafond) — **P1-7 / P2-1**.
3. Autorisation de modifier le moteur de pages pour P0-1 (touche `src/pageGen`, partagé par tous les sites).

# KOLAKISA — Programme 22.1B : audit de qualité des sites générés (laboratoire de rendu en navigateur)

Date de la mesure : 2026-10-30 · Code audité : `origin/main` `3abf0fd1` (programmes 20.5 et 21.1 à 21.11 fusionnés) · Branche d'audit : `docs/programme22-1-quality-audit`

> **Lecture obligatoire avant les chiffres.** Aucun fournisseur d'IA n'est configuré ni vérifié sur ce dépôt (aucune clé, aucune autorisation de dépense). Le laboratoire a donc exécuté **les vrais moteurs déterministes** (garde-fous du Brief Analyzer et du Site Planner, Page Generator, Component Mapper, Design Generator, Media Generator en mode « démonstration », rendu natif, publication) avec un **fournisseur d'IA simulé** qui sert des plans de référence écrits à la main. Cet audit mesure donc la **chaîne de fabrication** de Kolakisa, **pas l'intelligence d'un modèle de langage**. La compréhension réelle des briefs, la rédaction et le choix des images par un vrai modèle **n'ont pas été évalués** ; ils sont marqués « non évalué » partout, jamais estimés.

## 1. Méthode

| Élément | Choix |
|---|---|
| Scénarios | 15 briefs de référence figés (empreinte SHA-256 dans les tests) : 12 sites vitrines, 3 boutiques. Données entièrement fictives. |
| Moteurs | Les vrais : `plans.analyzeBrief` → `createPlan` → `ws.generatePages` → `applyPages` → `generateDesign` → `applyDesign` (tenté) → `aiMedia` (fournisseur « demo ») → `pages.publish` ; pour les boutiques, `ai/shop/project` puis le moteur natif 20.5 et ses routes d'administration. |
| IA | Simulée (déterministe). Aucun appel réseau, aucun coût. |
| Rendu | Vrai serveur Kolakisa (processus séparé, base de test jetable), pages publiées visitées par un **vrai Chrome** 150 sous 4 formats : bureau 1440, portable 1024, tablette 768, mobile 375 px. |
| Notation | Grille de 100 points commune (voir `KOLAKISA_PROGRAMME22_1B_QUALITY_SCORE.md`) ; les critères non mesurables sont **exclus du dénominateur** et la couverture est affichée. |
| Reproductibilité | `node scripts/quality-lab-navigateur/run-all.js` (lot « vitrines » + une boutique par serveur) puis résultats dans `docs/quality-lab-navigateur/` ; 15 tests déterministes dans `tests/programme22-1b-lab-navigateur.test.js`. |

## 1 bis. Relation avec l'audit 22.1 déjà présent sur `main`

**Un autre audit 22.1 existait déjà sur `main`** (commit `89e5ff88`, `KOLAKISA_PROGRAMME22_1_QUALITY_AUDIT.md`, laboratoire `tests/quality-lab/`), réalisé en parallèle par une autre session. Les deux travaux ont été **conservés tels quels** : le présent audit porte le suffixe **« 1B »** (documents `KOLAKISA_PROGRAMME22_1B_*`, laboratoire `scripts/quality-lab-navigateur/`, résultats `docs/quality-lab-navigateur/`) pour ne rien écraser. Il est **complémentaire** : l'audit existant parcourt l'assistant de création guidé (catalogue 20.6) **sans navigateur** ; celui-ci passe par la **chaîne du studio IA** (21.3 à 21.10) et lit les pages dans un **vrai Chrome**.

| Constat | Audit existant | Audit 1B |
|---|---|---|
| Conflit de noms entre sites d'une organisation | Q8 (P2) | D-G1 : **P0**, car le constructeur de boutique n'a **aucun contournement** (deuxième et troisième boutiques : « Aucune page à enregistrer ») |
| Valeur inventée conservée par le Brief Analyzer | Q9 (P2) | D-B1 (P1) — même preuve, trouvée indépendamment |
| Direction artistique quasi unique (bleu) | Q7 (P2) : 11 sites sur 15 | D-V1 (P1) : 14 sur 15 par le parcours du studio (catégorie = type de site) |
| Textes d'exemple publiables | Q2 : 44/53 pages | D-C1 : mêmes crochets sur 20 des 42 pages vitrines publiées ; **plus** titre « Accueil » partout, 0 bouton, 21 % de sections perdues |
| Contact / rendez-vous non publiables | Q6 | D-G2 — même constat sur la chaîne du studio |
| Boutique | Q5 : catalogue de formations, parcours d'achat « non démontré » | D-S1 : accueil de boutique = recette « services » ; **parcours d'achat simulé réussi** (catalogue → commande en paiement manuel) aux 3 formats sur les 3 boutiques construites par le constructeur 21.10 |
| **Navigation absente** | non mesuré (pas de navigateur) | **D-N1 (P1)** |
| **Page « À propos » en 404** (adresse réservée) | non mesuré | **D-U1 (P1)** |
| Responsive, cibles tactiles, performance dans Chrome | non mesuré (« Chrome absent ») | mesuré (4 formats) |
| Méta-description | absente sur 53/53 pages | **présente mais générique** (« Accueil ») sur la chaîne du studio : la différence vient du parcours utilisé |
| Garde-fous du Content Generator (12/12 affirmations inventées détectées), contraste de 45 directions, architectures répétitives (Q10), format 16:9 absent (Q12), suffixe « (image générée) » de l'alt (Q11) | oui | non repris (à lire dans l'audit existant) |

Notes : les deux grilles de notation diffèrent (borne basse « non mesuré = 0 » et pourcentage du mesurable dans l'audit existant ; points évalués et plafond par défaillance critique ici) ; les chiffres ne sont **pas comparables entre eux**. Aucun des deux audits n'a évalué un modèle de langage réel.

## 2. État réel du programme 21 (vérifié, pas supposé)

Le rapport final 21.11 existe (`KOLAKISA_PROGRAMME21_FINAL_REPORT.md`, statut « VALIDÉ AVEC RÉSERVES ») et a été relu. L'état ci-dessous croise ce rapport avec le code et avec l'exécution du laboratoire.

| Composant demandé | Présent dans le code | Opérationnel dans le laboratoire | Constat |
|---|---|---|---|
| AI Core (21.2) | `src/ai/*` (routeur, modèles, usage, journal) | Non exercé : aucun fournisseur | PARTIEL : testé avec fournisseurs simulés ; le constructeur général passe encore par l'ancien `aiCore`/`ai.call`. |
| AI Provider Infrastructure | adaptateurs Anthropic, OpenAI, Gemini, Mistral | Non exercé | PARTIEL : jamais appelés en réel (aucune clé). |
| Brief Analyzer (21.3) | `builder/brief.js` | Oui (garde-fous) | OPÉRATIONNEL pour les contrôles ; qualité du modèle non évaluée. |
| Site Planner (21.3) | `builder/planner.js` | Oui (rapprochement) | OPÉRATIONNEL ; registre non aligné sur la boutique native (I1). |
| Page Generator + Component Mapper (21.4) | `src/pageGen/*` | Oui | OPÉRATIONNEL ; produit des structures natives valides, avec **textes d'exemple**. |
| Design Generator (21.5) | `src/designGen/*` | Oui | OPÉRATIONNEL ; propositions générées et **appliquées sans erreur** sur les 12 sites vitrines ; non exercé sur les boutiques dans ce laboratoire. |
| Content Generator (21.6) | `src/contentGen/*` | Non : exige le modèle | NON ÉVALUÉ. |
| Media Generator + Asset Manager (21.7) | `src/aiMedia/*` | Oui, **fournisseur « demo » seulement** | PARTIEL : le fournisseur OpenAI est écrit mais jamais appelé en réel ; aucun autre fournisseur d'images. |
| Interface du constructeur (21.8) | `routes/…/ia/studio`, `public/js/ai-builder.js` | Non (le laboratoire appelle les services, pas l'interface) | Non évalué ici ; couvert par les tests 21.8. |
| Régénération intelligente (21.9) | `src/regen/*` | Non | Non évalué ici ; ne couvre pas le catalogue (I4). |
| History Manager | `src/regen/history.js` | Non | Idem. |
| E-commerce Builder (21.10) | `src/marketing/ai/shop/*` | Oui (3 boutiques) | OPÉRATIONNEL pour l'analyse, la structure, les produits ; **pages éditoriales et accueil de boutique insuffisants** (D-S1, D-G1). |
| Prévisualisation | aperçu natif des pages | Non évalué ici | — |
| Publication | `pages.publish`, `ws.publishAll` | Oui | OPÉRATIONNEL, avec blocages légitimes (formulaire manquant). |

Aucun élément essentiel du programme 21 ne bloque l'audit du programme 22 : les moteurs déterministes tournent. **Le seul blocage est l'absence de fournisseur d'IA vérifié**, qui interdit d'évaluer la compréhension, la rédaction et les images réelles (voir « Limites »).

## 3. Résultats

### 3.1 Notes par scénario

<!--TABLE:Notes par scénario-->
| Scénario | Note /100 (sur points évalués) | Couverture | Statut | Critique |
| --- | ---: | ---: | --- | --- |
| entreprise | 64 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| immobilier | 63 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Contact (2), Estimer mon bien |
| construction | 65 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Demander un devis |
| tech | 63 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Contact (4) |
| photo | 72 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Réserver |
| portfolio | 71 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, page(s) de conversion non publiable(s) : Contact (5) |
| institution | 63 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Contact (6) |
| restaurant | 71 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 1 page(s), page(s) de conversion non publiable(s) : Réserver (2) |
| blog | 75 | 80/100 | À AMÉLIORER (plafonné : défaillance critique) | aucune navigation : 3 pages publiées sans lien entre elles, page(s) de conversion non publiable(s) : Lettre d'information |
| boutique | 58 | 80/100 | À AMÉLIORER | aucune navigation : 8 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| mode | 58 | 80/100 | À AMÉLIORER | aucune navigation : 7 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| informatique | 58 | 80/100 | À AMÉLIORER | aucune navigation : 7 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Contact |
| services | 66 | 80/100 | À AMÉLIORER | aucune navigation : 3 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Devis |
| education | 63 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 3 page(s), page(s) de conversion non publiable(s) : Inscription |
| sante | 66 | 80/100 | À AMÉLIORER | aucune navigation : 4 pages publiées sans lien entre elles, textes d'exemple publiés sur 2 page(s), page(s) de conversion non publiable(s) : Rendez-vous |
<!--/TABLE-->

Les notes sont des **notes sur les points évalués** (couverture indiquée). Elles ne valent pas un jugement sur la qualité rédactionnelle ni sur la direction artistique, non chiffrées. Un statut est **plafonné** dès qu'une défaillance critique est constatée.

### 3.2 Détail des critères

<!--TABLE:Détail des critères-->
| Scénario | brief | architecture | visuel | sections | contenus | medias | responsive | ux | seo | perf |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| entreprise | — | 7/10 | 8/20 | 5.1/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| immobilier | — | 3/10 | 10/20 | 7.6/10 | — | 10/10 | 8.2/10 | 1.5/10 | 5/5 | 5/5 |
| construction | — | 6/10 | 10/20 | 5.1/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| tech | — | 6/10 | 10/20 | 2.5/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| photo | — | 6/10 | 12/20 | 7.6/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| portfolio | — | 6/10 | 12/20 | 10/10 | — | 10/10 | 8.8/10 | 1.1/10 | 4.2/5 | 5/5 |
| institution | — | 6/10 | 10/20 | 3.4/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| restaurant | — | 6/10 | 12/20 | 7.6/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| blog | — | 6/10 | 12/20 | 10/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| boutique | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.3/5 | 5/5 |
| mode | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.2/5 | 5/5 |
| informatique | — | 8/10 | 6/20 | 6/10 | — | 6/10 | 7/10 | 4/10 | 4.2/5 | 5/5 |
| services | — | 6/10 | 10/20 | 5.1/10 | — | 10/10 | 8.2/10 | 3.5/10 | 5/5 | 5/5 |
| education | — | 6/10 | 10/20 | 3.4/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
| sante | — | 6/10 | 10/20 | 6/10 | — | 10/10 | 7.6/10 | 3.5/10 | 5/5 | 5/5 |
<!--/TABLE-->

### 3.3 Génération

<!--TABLE:Génération-->
| Scénario | Pages | Publiées | Conflit inter-sites | Pages bloquées | Médias (besoins/bandeaux) | Durées ms (pages/design/médias/publication) |
| --- | ---: | ---: | --- | --- | --- | --- |
| entreprise | 5 | 4 | non | Contact | 6/1 | 102 / 34 / 412 / 90 |
| immobilier | 5 | 3 | oui | Contact (2), Estimer mon bien | 12/1 | 21 / 30 / 923 / 47 |
| construction | 5 | 4 | oui | Demander un devis | 9/1 | 8 / 11 / 452 / 152 |
| tech | 4 | 3 | oui | Contact (4) | 5/1 | 138 / 32 / 1498 / 10 |
| photo | 4 | 3 | oui | Réserver | 8/1 | 7 / 18 / 193 / 24 |
| portfolio | 4 | 3 | oui | Contact (5) | 8/1 | 45 / 16 / 62 / 106 |
| institution | 5 | 4 | oui | Contact (6) | 6/1 | 6 / 5 / 51 / 17 |
| restaurant | 5 | 4 | oui | Réserver (2) | 6/1 | 5 / 11 / 42 / 19 |
| blog | 4 | 3 | oui | Lettre d'information | 5/1 | 7 / 126 / 78 / 5 |
| boutique | 9 | 8 | non | Contact | — | 85 / — / — / 569 |
| mode | 8 | 7 | non | Contact | — | 124 / — / — / 153 |
| informatique | 8 | 7 | non | Contact | — | 771 / — / — / 1352 |
| services | 4 | 3 | oui | Devis | 5/1 | 4 / 7 / 122 / 17 |
| education | 5 | 4 | oui | Inscription | 6/1 | 29 / 12 / 32 / 6 |
| sante | 5 | 4 | oui | Rendez-vous | 6/1 | 6 / 41 / 43 / 13 |
<!--/TABLE-->

## 4. Registre des défauts

Gravités : **P0** sécurité / intégrité / fonction essentielle bloquée · **P1** majeur pour la qualité des sites · **P2** important · **P3** complémentaire. « Origine » : 1 compréhension · 2 planification · 3 génération · 4 mapping · 5 rendu · 6 données · 7 configuration · 8 dépendance externe.

| Id | Gravité | Défaut observé (preuve) | Moteur en cause | Origine |
|---|---|---|---|---|
| D-G1 | **P0** | Une 2e boutique d'une même organisation **ne peut pas créer ses pages éditoriales** : `applyPages` du constructeur de boutique force « ignorer » pour tout nom déjà pris **par un autre site**, d'où l'erreur « Aucune page à enregistrer » (mesuré : 2e et 3e boutiques). Pour les sites vitrines, la 1re application échoue avec un conflit ; le contournement « nouvelle page » ajoute des suffixes visibles « (2) », « (3) » aux titres. Test : `D-G1`. | Page Generator (`existingFor`), Shop builder (`applyPages`) | 3 génération |
| D-N1 | P1 | **Aucune navigation générée** : les sites de 3 à 5 pages publiées n'ont aucun menu ; la page d'accueil n'a que 2 liens internes (`/` et `/cookies`). Le plan contient bien `navigation.main`, mais aucun moteur ne l'applique (aucune référence à un menu dans `workspace.js`, `bridge.js`, `pageGen`). | Workspace / Page Generator | 3 génération |
| D-C1 | P1 | **Le titre de l'accueil est « Accueil » sur 15 sites sur 15** (nom de la page) ; sous-titre et bouton vides (0 bouton sur 15 accueils) ; **31 des 145 sections prévues par les plans vitrines (21 %) disparaissent** à la génération (section d'appel à l'action sans adresse, texte ou image sans contenu) : sur 4 sites (photographe, portfolio, restaurant, blog) **l'accueil se réduit à un bandeau seul** (1 mot) ; les autres contiennent des **crochets d'exemple** (« [Avantage 1] », « [Une phrase qui décrit ce que la personne obtient] »). Ils sont **publiés** : seul le formulaire manquant bloque la publication. | Bridge (ne transmet que le « genre »), Component Mapper | 4 mapping |
| D-G2 | P1 | **La page de contact, de devis, de réservation ou de rendez-vous n'est pas publiable** : la section « formulaire » n'a pas de formulaire et le générateur n'en crée ni n'en rattache aucun (mesuré sur 12 sites vitrines et sur la boutique). C'est la page de conversion. | Page Generator / Mapper | 3 génération |
| D-S1 | P1 | **L'accueil d'une boutique est un accueil de site de services** (« Services », « [Service 1] ») : aucun produit, aucun lien vers `/boutique`, alors que les éléments de boutique (grille, panier…) existent. | Page Generator (recette « accueil ») + Shop builder | 3 génération |
| D-V1 | P1 | **Direction artistique quasi unique** : 14 scénarios sur 15 reçoivent une couleur principale bleue (190–240°) ; 2 associations typographiques seulement. Cause : la teinte n'est choisie que d'après le type de site (vitrine, boutique…) ou un mot de couleur du brief ; le secteur n'est pas utilisé (`SECTOR_HUE` ne connaît que 12 catégories de l'assistant). | Design Generator (`analyzer.js`) | 2 planification / 7 configuration |
| D-B1 | P1 | **Un fait inventé par le modèle est conservé** : nom d'entreprise, public cible et ton absents du brief sont déclassés en « déduit » mais **gardent leur valeur inventée**, et la demande est jugée « prête ». Test `D-B1`. | Brief Analyzer | 1 compréhension |
| D-U1 | P1 | **La page « À propos » générée est introuvable sur le domaine du site** : publiée avec l'adresse `/a-propos`, elle répond **404** (mesuré sur le portfolio et sur la boutique, deux serveurs distincts). `a-propos`, `faq`, `contact`, `cookies`, `panier`… sont des adresses **réservées à la plateforme** (`urls.RESERVED`) que le planificateur et le générateur ne connaissent pas : la page est créée, publiée, annoncée… et inaccessible. « À propos » et « Contact » figurent dans presque tous les plans. Test `D-U1`. | Site Planner (`RESERVED_SLUGS` local), Page Generator | 2 planification |
| D-M1 | P2 | **Un seul visuel (bandeau de l'accueil) est généré**, en « démonstration » (dégradé dont la teinte varie d'un site à l'autre : violet, bleu, vert), sans lien avec la palette appliquée, avec un texte alternatif générique ; les boutiques n'en ont aucun. Aucun fournisseur d'images réel n'est vérifié. | Media Generator | 8 dépendance externe |
| D-B2 | P2 | Analyseur de boutique : le nom n'est reconnu qu'entre guillemets ou après « nommée » : « PixelPort » n'est pas détecté et la demande est « insuffisante ». Choix prudent (rien d'inventé) mais très strict. | Shop analyzer | 1 compréhension |
| D-R1 | P2 | Cibles tactiles sous 32 px sur mobile (liens du pied de page notamment), voir `RESPONSIVE`. | Renderer / Design System | 5 rendu |
| D-X1 | P3 | Titre de page : « Accueil · Norvalis Conseil » et description « Accueil » : métadonnées minimales tant que le contenu n'est pas rédigé. | Content Generator (non exécuté) | 3 génération |

Aucune faille de sécurité, aucune perte de données, aucune fuite entre sites n'a été observée pendant le laboratoire. Les tests de sécurité du programme 21.11 sont rejoués (voir §7).

## 5. Causes racines

1. **Le pont entre le planificateur et le générateur de pages est volontairement « muet »** (`bridge.js`) : il ne transmet que le type de section, jamais le titre, l'objectif, le texte attendu ni l'adresse du bouton. Tout ce que le planificateur a compris est perdu (D-C1) ; le contenu dépend ensuite d'une **seconde passe d'IA** non exécutée par défaut.
2. **Aucun moteur ne possède l'assemblage du site** : le plan décrit pages, navigation et formulaires, mais l'application ne crée que des pages. Menus (D-N1), formulaires (D-G2) et accueil de boutique (D-S1) n'appartiennent à personne.
3. **La détection de doublons est globale à l'organisation** (D-G1) alors que tout le produit est « une organisation, plusieurs sites ».
4. **Le Design Generator ne connaît pas les secteurs** : il ne reçoit que le type de site et n'a que 12 teintes sectorielles ; tout le reste tombe sur le bleu par défaut (D-V1).
5. **Les garde-fous du Brief Analyzer vérifient les citations, pas les valeurs** : une valeur sans citation est déclassée mais pas retirée (D-B1).
6. **Deux listes d'adresses réservées coexistent** : celle de la plateforme (`urls.RESERVED`, ≈ 70 entrées) et celle du planificateur (`RESERVED_SLUGS`, 12 entrées) ; elles ne sont pas synchronisées (D-U1).

## 6. Benchmark (comportements observables, jamais copiés)

**Aucun concurrent n'a été testé** (aucun compte, aucune clé, aucune génération réelle). Ce qui suit est **documenté** d'après des sources publiques consultées le 2026-10-30, dont une part est issue de blogs ou d'avis tiers ; à vérifier avant toute décision.

| Produit | Ce que la documentation publique indique | Écart utile pour Kolakisa |
|---|---|---|
| Wix (Harmony / générateur IA) | Pose quelques questions (secteur, objectifs, style), génère mise en page, textes, images et identité ensemble ; modifications par invite ; avis tiers : « un brouillon, pas un site fini ». | Kolakisa génère la structure mais **pas le contenu par défaut** ni la navigation. |
| Elementor AI Site Planner | Brief par conversation, plan du site, **wireframe responsive prérempli de contenu**, composants de boutique (panier, caisse, compte). | Idem : plan puis **maquette complète** ; Kolakisa livre des crochets. |
| Framer AI | Structure, sections et premier texte à partir d'une invite ; mises en page responsives modifiables sur le canevas ; SEO jugé à reprendre à la main (avis tiers). | Éditeur proche, génération moins complète chez Kolakisa. |
| Webflow AI site builder | Jusqu'à 5 pages par invite, structure, contenu et thème ; limites de plan ; sections sans images (selon un blog). | Kolakisa n'a pas de plafond de pages à 5 ; le thème généré est moins varié. |
| 10Web | Génère un site WordPress/Elementor depuis une description ou une URL ; textes (OpenAI) et images (DALL·E) ; hébergement et optimisation de vitesse inclus. | Kolakisa : images d'attente seulement, pas d'optimisation de vitesse intégrée à la génération. |
| Durable | Site en environ 30 secondes, CRM et blog intégrés ; avis : conceptions parfois fades, personnalisation limitée. | Kolakisa est **plus rapide en fabrication** (quelques millisecondes hors IA) mais sans contenu. |
| Shopify (Magic, Sidekick) | Descriptions de produits, thème et contenus générés dans l'administration ; assistant conversationnel ; détails du « store builder » surtout décrits par des tiers. | Kolakisa génère des descriptions **à gabarit** (sans IA) et un catalogue ; pas de thème de boutique généré. |

Opportunités : contenu rédigé dès la génération, navigation et formulaires créés avec le site, accueil de boutique composé de produits réels, diversité visuelle par secteur.

## 7. Tests exécutés

Voir `KOLAKISA_PROGRAMME22_1B_IMPLEMENTATION.md` (section « Résultats des tests ») : 15 tests du laboratoire, passes ciblées des tests 21.x et 20.5, lot complet du laboratoire.

## 8. Limites de cet audit

- **Pas de modèle de langage réel** : compréhension, rédaction, qualité d'image : non évaluées.
- **Pas de Lighthouse ni d'axe-core** (non installés) : accessibilité et performance mesurées par des contrôles maison, partiels, qui **ne valent pas conformité WCAG** ; contraste calculé seulement sur les éléments dont le fond est une couleur unie (les zones à image ou dégradé sont « inconnues »).
- **Performance mesurée en local**, sur une machine très chargée (charge > 40), réseau non limité : chiffres comparables entre exécutions, **pas des temps de production**.
- **Jugement visuel** : appuyé sur des contrôles structurels automatiques et sur l'inspection de captures ; il reste subjectif sur l'originalité et l'harmonie.
- **Benchmark documentaire** uniquement.
- L'interface du studio (21.8) n'est pas pilotée : le laboratoire appelle les services avec les mêmes paramètres que l'interface.

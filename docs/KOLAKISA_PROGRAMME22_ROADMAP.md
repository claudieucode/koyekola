# Programme 22 — Feuille de route fondée sur les observations du palier 22.1

**2026-10-30.** Chaque ligne s'appuie sur une preuve du laboratoire (`docs/quality-lab/results.json`) ou sur le rapport 21.11. Rien n'est développé dans ce palier.

## 0. Mesure de référence à battre (15 briefs inchangés)
Borne basse 48,6/100 · 75,4 % du mesurable · 1 accueil distinct sur 15 · 0 image · 0 meta description · 44/53 pages avec espaces réservés · 19/72 pages non publiables · 3 boutiques plafonnées. Garde-fous : contenu 12/12, contrastes 45/45 (à ne pas dégrader).

## 1. Priorités
### P0 — sécurité, intégrité, fonctionnel critique
Aucun P0 observé dans le laboratoire. Rappel 21.11 : aucun fournisseur d'IA ni de paiement n'a été vérifié en réel ; tout palier qui ajoute un appel payant exige une clé de test, un budget plafonné et une autorisation explicite.

### P1 — qualité majeure des sites générés
| Réf. | Problème | Cause racine | Moteur | Solution proposée | Dépendances | Risques | Tests | Critère d'acceptation |
|---|---|---|---|---|---|---|---|---|
| R1 | Q2 : espaces réservés et faux témoignage publiables | Pas de contrôle à la publication | Publication native + Page Generator | Contrôle « prêt à publier » : avertissement bloquant (déblocable par confirmation) si `[…]` ou texte d'exemple subsiste ; ne plus générer de témoignage factice (section absente tant qu'il n'y a pas de vrai témoignage) | Aucune | Bloquer des utilisateurs avancés : prévoir un passage forcé tracé | Lab : pages avec marqueurs = 0 à la publication sans confirmation ; tests de publication | 0 page publiée avec marqueur sans confirmation explicite |
| R2 | Q1/Q10 : accueils identiques, architectures répétitives | Recettes fixes `RECIPES`, catalogue grossier | Page Generator, Site Planner, catalogue | Recettes par secteur et par objectif (devis, réservation, vente, inscription) ; variantes d'accueil (3 à 5 compositions) ; catégories supplémentaires (construction, santé, photographie) | Palier sur le planificateur IA (21.3) | Régression des tests existants qui figent les recettes | Lab : accueils distincts ≥ 8/15, Jaccard < 0,6 | Mesure de diversité atteinte sans perte d'architecture (≥ 9/10) |
| R3 | Q3 : aucune meta description | Le Page Generator n'écrit pas le SEO | Page Generator / Content Generator | Générer titre SEO + description à la génération (gabarit sans IA, puis IA) ; contrôle de longueur | Content Generator (21.6) | Descriptions génériques | Lab : 53/53 pages avec description 70–160 car. | 100 % des pages publiées |
| R4 | Q4 : aucune image | Étape médias séparée | Media Generator / studio | Enchaîner la planification des médias et proposer les visuels d'attente ; signaler « image à ajouter » ; avec clé réelle, générer | Fournisseur d'images vérifié | Coût : plafond et autorisation | Lab (démo) + essai réel plafonné sur 3 scénarios | ≥ 1 image pertinente et un alt par bandeau |
| R5 | Q5 : boutiques = catalogue de formations | `TYPE_OF.catalogue = formation`, catégorie antérieure à 20.5, registre « indisponible » | Catalogue de l'assistant, registre du planificateur (I1 de 21.11) | Relier la catégorie « boutique » au moteur natif (20.5) et à la boutique IA (21.10) ; mettre à jour le registre et le texte de la catégorie | 20.5, 21.10 | Régressions du parcours « formations » | Lab boutique : fiche produit, panier, commande simulée atteints ; plafond levé | 3 boutiques sans défaillance critique |
| R6 | Q6/U1 : Contact et Rendez-vous non publiables | Aucun formulaire associé | Component Mapper + parcours | Créer ou proposer en un clic un formulaire de contact lié à la page à la génération | Module Formulaires | Données personnelles : consentement | Lab : 0 page non publiable | 72/72 pages publiables |

### P2 — expérience et performances
| Réf. | Problème | Cause racine | Moteur | Solution | Tests / critère |
|---|---|---|---|---|---|
| R7 | Q7 : 3 directions = 1 teinte, 11 sites bleus | `design.proposals` ne varie pas la teinte | Design Generator | Une direction principale + une alternative de teinte voisine (±30–60°) + une contrastée ; teintes par secteur | Lab : écart ≥ 30° sur 2/3 propositions ; contrastes 100 % |
| R8 | Q8 : 2e site bloqué par les homonymes | `existingFor` global à l'organisation | Page Generator | Chercher les homonymes dans le site seulement ; stratégie « nouvelle page » par défaut | Sonde homonymes : pagesCreated = nombre de pages ; noms sans suffixe |
| R9 | Q9 : valeurs inventées conservées | Déclassement sans rejet | Brief Analyzer | Écarter (ou marquer « à confirmer ») toute valeur sans citation ; exiger une confirmation ; refuser les briefs < 5 mots utiles | Test F-BRIEF-1 inversé ; lab brief |
| R10 | P-2 : 123,5 Ko de CSS par page | Feuille commune non allégée | Renderer | Mesure de couverture, découpage, compression, cache HTTP | Lighthouse local ; poids CSS < 60 Ko |
| R11 | Multilingue (C3) | Langue non transmise au Page Generator | Page Generator / Content Generator | Transmettre la langue du site, localiser les titres de recettes | Lab : briefs anglais → titres anglais |
| R12 | Mesures visuelles et responsive absentes | Pas de navigateur | Outillage | Installer Playwright/Chrome sur la machine de recette ; captures 4 formats ; axe-core ; Lighthouse local | 15 sites × 4 formats sans défilement horizontal ; rapport axe sans violation sérieuse |

### P3 — compléments
R13 alt des images sans « (image générée) » et décrivant le sujet (Q11) · R14 ratio 16:9 pour les bandeaux (Q12) · R15 composant galerie natif (grille + agrandissement) · R16 lien d'évitement et focus visible · R17 base de démarrage pré-migrée pour accélérer le laboratoire (P-3).

## 2. Enchaînement conseillé
22.2 Prêt à publier (R1, R3, R6, R8) → 22.3 Accueils et architectures par secteur (R2) → 22.4 Boutiques reliées (R5) → 22.5 Directions artistiques réellement distinctes (R7) → 22.6 Médias bout en bout (R4, R13, R14) → 22.7 Mesure réelle navigateur (R12, R10) → 22.8 Brief et multilingue (R9, R11). Chaque palier relance le laboratoire et compare à la référence.

## 3. Benchmark (documenté, NON testé)
Aucune des plateformes ci-dessous n'a été utilisée dans ce palier (comptes, coûts, conditions d'utilisation) ; les lignes reposent sur des connaissances générales, non revérifiées à la date du jour, et ne doivent pas être lues comme des mesures.
| Plateforme | Écart probable à examiner | Statut |
|---|---|---|
| Wix AI / Durable | Site complet (textes, images, structure) en quelques minutes : à comparer sur la **complétude à la première génération** (images, SEO, contact fonctionnel) | documenté |
| Elementor AI / 10Web | Génération intégrée à un éditeur : à comparer sur la **régénération sélective** et la qualité des sections | documenté |
| Framer AI / Webflow | Qualité visuelle et responsive des gabarits : à comparer sur la **diversité** et la finition | documenté |
| Shopify | Parcours d'achat complet prêt à l'emploi : à comparer sur la **boutique** (fiche produit, panier, paiement) | documenté |
Pour les rendre comparables : mêmes 15 briefs, mêmes critères, même grille, relecture humaine à l'aveugle — prévu en 22.7.

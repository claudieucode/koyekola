# Parcours de création guidée — étapes et flux

Neuf étapes, navigables dans n'importe quel ordre (la page d'étape se rend côté serveur : la reprise se fait par l'adresse). Boutons : Retour, Continuer, Ignorer cette étape (facultatives), Enregistrer et quitter, Prévisualiser (étape Aperçu), Ouvrir dans l'éditeur (pages, contenus).

| # | Étape | Facultative | Ce qui est écrit |
|---|---|---|---|
| 1 | Mode : vierge / modèle / boutique | non | site + ligne de progression ; vierge → page Accueil ; modèle → import Template Library (pages + menu) |
| 2 | Type de site (18 catégories) | non | catégorie (recommande pages, modèle, fonctionnalités) |
| 3 | Informations (nom, entreprise, activité, pays, langue, fuseau, devise, contact) | non | site, SEO local, réponses de l'assistant |
| 4 | Identité (orientation, couleurs, polices, logo) | oui | jetons du site, logo des réglages du site |
| 5 | Pages (proposées, ajout, renommage, retrait, accueil, ordre, navigation, menu) | non | pages, accueil, menu |
| 6 | Contenus (titre, description, accroche, bouton) | oui | brouillon des pages |
| 7 | Fonctionnalités | oui | modules activés (équipe) |
| 8 | Aperçu (ordinateur 1280, tablette 820, mobile 390 px) + alertes | oui | rien |
| 9 | Domaine et publication | oui | pages publiées après confirmation |

## Mode « boutique » — ce qui est réellement disponible
Disponible : pages de présentation et de catalogue de **formations**, module **Commerce** (revenus, commande et paiement par carte de formations) à activer par l'équipe, compte Stripe à configurer par l'équipe.
**Non disponible** : panier multi-produits, produits physiques, livraison, taxes, fiches produit dynamiques, pages Panier / Commande / Mon compte. L'assistant ne les propose pas et le dit à l'écran.

## Reprise et erreurs
- Chaque champ des étapes Informations et Identité est sauvegardé automatiquement (900 ms après la dernière frappe) ; l'état s'affiche (« Enregistré », « Hors connexion — nouvel essai au retour du réseau », « Modifié ailleurs : rechargez la page »).
- Sans JavaScript, les formulaires classiques fonctionnent.
- La liste « Reprendre une création » (accueil) montre le pourcentage et la dernière modification.
- Indicateur d'étape : terminée (✓), à corriger (!), ignorée, à faire ; texte alternatif pour les lecteurs d'écran.

## Publication
1. Liste « À vérifier » : pages, contenu réel, navigation, mobile, SEO de base, domaine.
2. Domaine : état lu dans le registre (propriété, DNS, HTTPS) ; « opérationnel » seulement après vérification technique réelle (écran Domaines). Aucun DNS n'est modifié.
3. Cases de pages + case de confirmation obligatoire ; le moteur contrôle chaque page (`preflight`) et les échecs sont rapportés un par un.

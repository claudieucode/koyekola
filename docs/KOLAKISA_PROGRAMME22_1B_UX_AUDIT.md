# KOLAKISA — Audit de l'expérience utilisateur des sites générés (programme 22.1)

## Méthode

Pour chaque site publié : parcours des pages dans Chrome (4 formats), vérification des **liens internes** (chaque adresse relative trouvée est requêtée depuis le navigateur), des **erreurs console et réseau**, de la présence d'une **navigation**, d'un **bouton d'action**, de la **publiabilité** des pages de conversion. Pour les boutiques : **parcours simulé** catalogue → fiche produit → ajout au panier → panier → caisse → commande en **paiement manuel** (aucun paiement réel) aux largeurs 1280, 820 et 375 px.

## Résultats

<!--TABLE:Contenu livré-->
| Scénario | pages avec crochets | textes entre crochets | exemples | liens internes | liens cassés | erreurs console/réseau |
| --- | --- | --- | --- | --- | --- | --- |
| entreprise | 2/4 | 13 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| immobilier | 1/3 | 6 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| construction | 2/4 | 13 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| tech | 3/3 | 20 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| photo | 1/3 | 6 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| portfolio | 0/3 | 0 | — | 2 | 0 | 8 |
| institution | 3/4 | 14 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| restaurant | 1/4 | 6 | [Service 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Service 2] | 2 | 0 | 0 |
| blog | 0/3 | 0 | — | 2 | 0 | 0 |
| boutique | 2/10 | 7 | [Service 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Service 2] | 11 | 0 | 8 |
| mode | 2/9 | 7 | [Service 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Service 2] | 11 | 0 | 8 |
| informatique | 2/9 | 7 | [Service 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Service 2] | 11 | 0 | 8 |
| services | 2/3 | 13 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| education | 3/4 | 14 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
| sante | 2/4 | 7 | [Avantage 1] ; [Une phrase qui décrit ce que la personne obtient] ; [Avantage 2] | 2 | 0 | 0 |
<!--/TABLE-->

<!--TABLE:Parcours d'achat-->
| Boutique | 1280 px | 820 px | 375 px |
| --- | --- | --- | --- |
| boutique | ok (1567 ms) | ok (852 ms) | ok (1822 ms) |
| mode | ok (2574 ms) | ok (939 ms) | ok (990 ms) |
| informatique | ok (1884 ms) | ok (1380 ms) | ok (1081 ms) |
<!--/TABLE-->

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

## Constats

1. **Un visiteur ne peut pas naviguer** (défaut D-N1, P1) : la page d'accueil de chaque site ne contient que deux liens internes (la page elle-même et « Cookies »). Les 3 à 8 pages publiées ne sont atteignables qu'en connaissant leur adresse. Pour une boutique, **aucun lien de l'accueil n'amène au catalogue** (`/boutique`). Un site sans menu n'est pas un site utilisable.
2. **La page de conversion n'est pas publiable** (D-G2, P1) : contact, devis, réservation, rendez-vous, inscription, lettre d'information. La section « formulaire » demande un formulaire que le générateur ne crée ni ne rattache ; le studio affiche bien le blocage (« La section d'inscription a besoin d'un formulaire »), ce qui est **honnête**, mais le parcours « je veux un devis » est interrompu pour les 15 sites.
3. **Pas d'appel à l'action sur l'accueil** (D-C1) : le bouton du bandeau est vide et la section « appel à l'action » du plan est écartée faute d'adresse. Aucune action n'est mise en valeur.
4. **Les textes d'exemple sont visibles** si la personne publie sans rédiger : « [Service 1] », « [Une phrase qui décrit ce que la personne obtient] » (pas de faux contenu, mais pas un parcours finalisé).
5. **Aucune erreur JavaScript**, **aucun lien interne cassé** parmi les liens présents ; **mais** la page « À propos » publiée est introuvable (404 sur `/a-propos`, adresse réservée à la plateforme, défaut D-U1) : 8 erreurs de chargement mesurées sur le portfolio et chaque boutique (4 formats × navigation et réseau).
6. **Parcours d'achat des boutiques : réussi aux trois formats** (paiement manuel ; commande créée « en attente de paiement », jamais « payée » : règle du moteur 20.5). Le **parcours de découverte** (de l'accueil au produit) est en revanche **cassé** : l'accueil de la boutique n'expose ni produits ni lien vers le catalogue (D-S1) ; le catalogue n'est atteignable que par son adresse.
7. **Les formulaires natifs** (quand ils existent) ont des étiquettes et des champs accessibles : aucun champ sans étiquette mesuré.
8. **Mobile** : aucune différence de parcours ; cibles tactiles trop petites dans le pied de page (`RESPONSIVE`).

## Causes racines

Navigation : aucun moteur n'applique `navigation.main`. Formulaires : le mapper n'en crée pas. Découverte de la boutique : recette d'accueil unique pour tous les types de site. Détail dans le registre des défauts.

## Recommandations

P0/P1 : voir les paliers 22.2 (navigation, formulaires) et 22.5 (boutique). P2 : un contrôle automatique « parcours minimal » (accueil → page de conversion → confirmation) exécuté **avant** l'activation de la publication groupée. P3 : tests d'utilisateurs réels sur trois sites générés.

## Limites

Pas d'utilisateurs réels : l'« expérience » est évaluée par des contrôles automatiques et le parcours d'achat scripté, pas par l'observation de personnes. Pas de mesure de la compréhension des libellés (textes d'exemple).

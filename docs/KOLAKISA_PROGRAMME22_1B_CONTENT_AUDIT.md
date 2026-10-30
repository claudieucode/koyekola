# KOLAKISA — Audit de la qualité des contenus générés (programme 22.1)

## Périmètre réel

**La qualité rédactionnelle d'un modèle de langage n'a pas pu être évaluée** : aucun fournisseur d'IA n'est configuré ni vérifié, et la mission interdit tout appel payant non autorisé. Ce document décrit donc deux choses vérifiées : (1) **ce que le système livre quand aucun modèle ne rédige** (les textes d'exemple), (2) **les garde-fous déterministes contre l'invention** (testés par des tests unitaires adversaires). Les titres, paragraphes, FAQ, appels à l'action, SEO rédactionnel et multilingue produits par un vrai modèle restent **non évalués**.

## 1. Ce qui est livré sans modèle

Le Page Generator ne transmet que le **genre** de chaque section (`bridge.js`) ; le Component Mapper complète avec des textes d'exemple **entre crochets**, signalés comme tels :

| Section | Texte livré |
|---|---|
| Services / avantages | « [Service 1] », « [Avantage 1] » + « [Une phrase qui décrit ce que la personne obtient] » |
| Témoignages | « Remplacez par le témoignage réel d'un client, avec son accord. » / « Prénom N. » |
| Étapes, FAQ, formules | textes d'exemple entre crochets |
| Bandeau | titre = nom de la page (« Accueil »), sans sous-titre ni bouton |

### Mesures sur les 15 sites

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

Constats :

- **Les textes d'exemple sont publiés.** La publication n'est bloquée que par le formulaire manquant ; elle ne l'est pas par les crochets (D-C1). Un visiteur verrait « [Service 1] ».
- **Aucun faux témoignage, aucune fausse statistique, aucune fausse certification n'est inventé** : le système préfère un texte d'exemple explicite. C'est conforme à la règle de la mission.
- **Les objectifs du plan sont perdus** : le planificateur formule pour chaque section un objectif et un contenu attendu ; le pont ne les transmet pas. **31 sections sur 145 (21 %) disparaissent** des sites vitrines (section d'appel à l'action sans adresse ; texte, image ou vidéo sans contenu) ; le **titre de l'accueil est « Accueil » sur 15 sites sur 15**.

<!--TABLE:Sections du plan-->
| Scénario | sections prévues | sections générées | perdues | exemple (page : prévu → généré) |
| --- | ---: | ---: | ---: | --- |
| entreprise | 13 | 11 | 2 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| immobilier | 12 | 11 | 1 | Accueil : hero+features+cta → hero+features |
| construction | 14 | 11 | 3 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| tech | 13 | 11 | 2 | Accueil : hero+features+video+cta → hero+features |
| photo | 11 | 7 | 4 | Accueil : hero+image+cta → hero |
| portfolio | 10 | 6 | 4 | Accueil : hero+image+text → hero |
| institution | 13 | 11 | 2 | Accueil : hero+features+cta → hero+features |
| restaurant | 13 | 8 | 5 | Accueil : hero+text+image+cta → hero |
| blog | 10 | 7 | 3 | Accueil : hero+text+cta → hero |
| services | 11 | 10 | 1 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| education | 13 | 12 | 1 | Accueil : hero+features+testimonials+cta → hero+features+testimonials |
| sante | 12 | 9 | 3 | Accueil : hero+features+cta → hero+features |
<!--/TABLE-->
- **SEO de départ minimal** : titre « Accueil · <nom du site> », description « Accueil » : exact mais pauvre (D-X1).

## 2. Garde-fous contre l'invention (tests déterministes)

| Garde-fou | Résultat |
|---|---|
| Brief vide, trop court ou sans mots refusé **avant** tout appel | ✔ aucun coût (test) |
| Contradictions évidentes du brief détectées par des règles (« sans paiement » + boutique ; « blog » + « pas de blog ») | ✔ |
| Citation absente du brief : le fait « explicite » est déclassé | ✔ |
| Plafond de 5 questions ; fonctionnalité inconnue du registre écartée | ✔ |
| **Valeur inventée sans citation** | ✘ **conservée** (déclassée en « déduit ») — nom d'entreprise, public et ton inventés survivent (défaut D-B1) |
| Galerie sans image fournie | ✔ ignorée (aucune image sans rapport) |
| Témoignage, statistique, prix réels | ✔ jamais inventés : texte d'exemple |

## 3. Ce qui reste à évaluer (avec un fournisseur vérifié)

Titres, sous-titres, paragraphes, descriptions, boutons et appels à l'action ; FAQ et contenus commerciaux ; SEO rédactionnel ; multilingue (le Content Generator sait localiser, voir 21.6) ; fluidité, répétitions, ton, adaptation au secteur et au public ; exactitude. **Protocole proposé** : relecture humaine à l'aveugle par grille (clarté, ton, exactitude, répétition, invention) sur les mêmes 15 briefs, avec un budget IA plafonné et une autorisation explicite.

## 4. Causes racines

| Défaut | Cause |
|---|---|
| Crochets publiés | La publication ne contrôle pas le contenu (seulement la validité structurelle). |
| Objectifs de section perdus | Le pont `bridge.js` ne transmet que `kind`. |
| Bandeau titré « Accueil » | `mapper.hero` : `title = s.title || page.name`. |
| Valeur inventée conservée | `brief.js` : `normFact` déclasse sans retirer. |

## 5. Recommandations

P1 : bloquer ou avertir la publication tant qu'il reste des crochets ; transmettre objectifs et bouton ; rédiger le contenu **dans le flux par défaut** (avec confirmation de coût) ; retirer les valeurs sans citation pour les noms propres. P2 : contrôle automatique des répétitions entre pages ; titres et descriptions SEO propres à chaque page. Détail : `KOLAKISA_PROGRAMME22_1B_ROADMAP.md`.

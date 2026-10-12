# Limites et suite — widgets

## 1. Fonctions non validées (aucune preuve dans cette mission)

| Sujet | Détail | Statut |
|---|---|---|
| Services tiers | Chargement réel des vidéos (YouTube / Vimeo), cartes Google, Facebook, fichiers Lottie : les tests coupent le réseau externe ; seule la balise produite (titre, `https`, `noopener`) est vérifiée. Widgets : `video`, `audio`, `embed`, `map`, `facebookbutton`, `facebookembed`, `lottie`. | PARTIEL (externe) |
| Données réelles du site | Articles, formations du catalogue, panier, compte, commentaires, menu CMS, plan du site, texte dynamique : exercés avec leur contenu par défaut seulement. 22 types (voir la matrice). Des tests préexistants les couvrent en partie (`site-widgets`, `editeur-dynamique`…) sans être rejoués ici. | PARTIEL (données) |
| Formation / formulaire | `course`, `addtocart`, `courserating`, `signupform` : l'insertion exige un objet réel du site ; non créés dans ces tests. 118 tests préexistants qui les nomment ont été relancés et réussissent (`editeur-boutique`, `editeur-widgets`, `marketing-r5-*`, `formulaires-etendus`, `marketing-forms-public`). | PARTIEL |
| Navigateurs | Chrome 150 / macOS uniquement. Aucun Firefox, Safari, Edge, ni tactile. Les gestes tactiles (carrousel au doigt, boîte retournable au toucher) ne sont pas éprouvés. | NON TESTÉ |
| Contrastes | Non mesuré dans cette mission (l'accessibilité testée = noms, alternatives, identifiants, focus, ARIA des onglets). | NON TESTÉ |
| Lecteurs d'écran réels | Aucun test avec NVDA / VoiceOver ; seuls les attributs ARIA sont vérifiés. | NON TESTÉ |
| Réseau coupé pendant l'édition d'un widget | Couvert par la mission 7 pour l'enregistrement, pas rejoué widget par widget. | non repris |
| Composants globaux (en-tête / pied de page) | Cycle de publication non audité. | → mission 9 |
| Suite complète | **Non relancée** (≈ 4 840 tests, plus de 1 h 30). Depuis la mission 2, aucune exécution complète de bout en bout. Un lot ciblé de 26 fichiers a été exécuté (voir le rapport de tests). | non exécutée |

## 2. Limites de la méthode

* **D5 (canevas qui disparaît)** : corrigé, mais la course dépend du minutage de Chrome et n'est pas reproduite à coup sûr par un test ; l'invariant est gardé et la mesure à 380 widgets sert de détecteur statistique. D'autres chevauchements de rendu (autre moteur, autre navigateur) ne sont pas éprouvés.

* « Tous les widgets » signifie les 88 éléments qu'une personne peut ajouter sans objet réel du site ; les 4 autres sont dans le tableau ci-dessus.
* Les charges hostiles sont **un champ de texte à la fois** : une combinaison de champs ne l'est pas. Le widget `html` n'est pas dans ce test (permission administrateur, filtre dédié, 43 tests préexistants).
* Le contrôle de débordement lit le bord du widget ; un texte coupé volontairement par `overflow:hidden` n'est pas signalé comme défaut.
* Le parcours des réglages de contenu écrit des valeurs d'essai (`Essai zq`, `/essai-zq`) : il détecte « sans effet ET sans message », pas « valeur sensée ».
* Les liens externes ne sont pas suivis (réseau coupé).

## 3. Lacunes reportées

| Sujet | Mission |
|---|---|
| Autres paires texte + adresse sans message (G2), onglets / accordéon sans éléments imbriqués (G3), publication des composants globaux (G5) | 9 |
| Profil du geste de poignée avec des widgets variés ; suite complète nocturne ; Firefox / Safari / tactile ; contrastes (G1, G6) | 10 |
| Widgets Elementor absents : shortcode, barre latérale, portfolio, méga-menu, boutons de paiement, avant / après, défilement continu (G4) | à planifier avec le produit |

## 4. Recommandations de suivi

1. Lancer la suite complète **la nuit, avec une concurrence de 1**, et conserver le journal (`node --test --test-concurrency=1 tests/*.test.js > journal.txt`). Ne pas lancer d'autre session de tests en parallèle (les mesures de fluidité en dépendent).
2. Rejouer `CONTENU_COMPLET=1 node --test tests/controles-contenu-navigateur.test.js` (≈ 1 h 15 sur cette machine) après tout changement d'un panneau de l'inspecteur.
3. Ajouter à ce lot de tests tout nouveau widget : `widgets-helpers.js` le couvre automatiquement pour l'insertion, la publication, l'accessibilité et la sécurité (`creatable`) ; seul son contenu de départ (`OVER`) est à fournir s'il demande un choix à l'insertion.
4. Lorsque le serveur change les règles d'un champ (ex. « Lignes surlignées »), mettre à jour l'éditeur en même temps (règle copiée, voir le rapport d'implémentation).

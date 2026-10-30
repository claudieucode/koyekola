# Programme 21 — audit de sécurité

## Méthode
Lecture du code des routes, services et vues du programme 21 ; recherche d'hôtes de fournisseurs côté navigateur et de secrets ; tests automatisés d'isolation (`programme21-securite-multisite`, `r7-coherence-moteurs`, tests propres à chaque moteur) ; `npm audit --omit=dev`.

## Résultats
| Domaine | Résultat |
|---|---|
| Appels de fournisseurs depuis le navigateur | **Aucun** (aucun hôte de fournisseur dans `public/` ni `views/`) |
| Accès à un autre site (lecture) | 17 adresses des moteurs 21.x testées avec les identifiants du site B : toutes refusées (403/404/302), aucune fuite de contenu (« brief secret », consigne, texte) |
| Accès à un autre site (écriture) | 23 actions (valider/modifier un plan, publier, appliquer ou annuler une génération de pages, un design, un contenu, une tâche d'images, placer ou décrire un média) tentées par un administrateur du site A sur les objets de B, par l'adresse de A et par celle de B : refusées ; **base strictement inchangée** (instantané complet avant/après) |
| Lecteur d'un site / anonyme | aucune écriture ; anonyme renvoyé à la connexion |
| Rôle à droits minimaux (`forms.read` seul) | **Faille corrigée (F1)** : voyait le studio et les plans IA ; refusé désormais (`templates.read`) |
| Publication | **Corrigée (F2)** : confirmation exigée par le service |
| Clés et secrets | `scrub` des messages d'erreur (clés `sk-…`, longues chaînes) ; clés des connecteurs chiffrées, jamais renvoyées ; aucune clé dans les réponses des écrans (test) ; historique des médias sans clé |
| Téléversements | type réel par signature, taille, dimensions, nom fabriqué, SVG refusé (médiathèque native) ; images de fournisseurs validées avant enregistrement |
| Requêtes externes (SSRF) | couche des connecteurs : HTTPS, hôte déclaré (jamais fourni par l'utilisateur), adresses privées refusées, pas de redirection, taille/délai bornés ; aucune URL externe téléchargée |
| Injection | textes de l'assistant et des chats rendus en `textContent` (client) / échappés (EJS) ; sections validées par les normaliseurs natifs ; propriétés inconnues rejetées (Page Generator) |
| Dépendances | `npm audit --omit=dev` : 0 vulnérabilité connue |

## Risques restants
Pas d'antivirus sur les fichiers ; EXIF des originaux importés conservés ; permission `ai.use` de l'AI Core sans rôle (non utilisée) ; pas de test d'intrusion externe ; le journal d'audit n'a pas été revu ligne à ligne.

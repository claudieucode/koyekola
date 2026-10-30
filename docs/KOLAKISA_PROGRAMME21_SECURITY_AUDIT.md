# Programme 21 — audit de sécurité

Méthode : lecture du code des routes et services ; recherche d'hôtes de fournisseurs côté navigateur ; tests d'isolation par les adresses réelles (`programme21-securite-multisite`, `programme21-securite-regen-boutique`, `r7-coherence-moteurs`, tests propres à chaque moteur) ; `npm audit --omit=dev`.
| Domaine | Résultat |
|---|---|
| Appels de fournisseurs depuis le navigateur | **Aucun** |
| Lecture inter-sites | 17 adresses des moteurs 21.3-21.8 + 9 adresses de la régénération (versions, comparaison, historique) et de la boutique par IA : toutes refusées, aucune fuite de contenu |
| Écriture inter-sites | 23 actions (plans, publication, pages, design, contenus, tâches et métadonnées de médias) + 9 actions (restauration, prise de version, régénération, annulation, modification et publication d'une boutique) tentées par un administrateur du site A sur les objets de B, par l'adresse de A et celle de B : refusées ; **base strictement inchangée** (instantané complet avant/après) |
| Lecteur d'un site / anonyme | aucune écriture ; anonyme renvoyé à la connexion |
| Rôle à droits minimaux (`forms.read` seul) | **Faille corrigée (F1)** sur quatre routeurs (studio, plans, régénération, boutique par IA) : `templates.read` exigé |
| Publication du studio | **Corrigée (F2)** : confirmation exigée par le service |
| Paiement (moteur de boutique) | montant calculé côté serveur, prix du navigateur ignoré, webhook signé obligatoire, montant falsifié ignoré, rejeu sans effet, retour client sans preuve de paiement ne paie rien, jeton de commande, cookie HttpOnly — **testés contre un faux Stripe, jamais le vrai** |
| Clés et secrets | messages d'erreur nettoyés ; clés des connecteurs chiffrées ; aucune clé dans l'état d'un projet de boutique ni dans les écrans (tests) |
| Téléversements | type réel par signature, taille, dimensions, nom fabriqué, SVG refusé ; images de fournisseurs validées avant enregistrement |
| Requêtes externes (SSRF) | couche des connecteurs : HTTPS, hôte déclaré, adresses privées refusées, pas de redirection, taille/délai bornés |
| Injection | échappement EJS, `textContent` côté client, état embarqué échappé (`<`, U+2028/9), recherche de la boutique échappée, sections validées par les normaliseurs natifs |
| Dépendances | `npm audit --omit=dev` : 0 vulnérabilité |
**Risques restants** : pas d'antivirus ; EXIF des originaux conservés ; permission `ai.use` de l'AI Core sans rôle ; Stripe et fournisseurs d'IA jamais vérifiés en réel ; le webhook Stripe partagé avec les formations a été modifié par le palier 20.5 (couvert par leurs tests, pas par un essai réel) ; pas de test d'intrusion externe.

# KOLAKISA — Assistant contextuel : ce qu'il est et ce qu'il n'est pas

## C'est un assistant À RÈGLES, pas une IA
`src/marketing/ai/builder/assistant.js` reconnaît des demandes **formulées en français** et les traduit en propositions de modification du plan. **Aucun modèle d'IA n'interprète le message** : il n'y a donc ni coût, ni envoi de votre texte à un fournisseur, mais aussi une compréhension limitée. Brancher un vrai modèle (AI Core 21.2, non branché aujourd'hui) est le travail suivant.

## Demandes comprises
| Demande (exemples) | Résultat |
|---|---|
| « Ajoute une page À propos / Tarifs » | **Proposition** `add_page` (type deviné : à propos, contact, FAQ, tarifs…) |
| « Ajoute une section FAQ [à la page Contact] » | **Proposition** `add_section` sur la page nommée, sinon la page ouverte dans le plan ; types : FAQ, services, témoignages, formulaire, appel à l'action, vidéo, galerie/image, texte, bandeau |
| « Renomme la page X en Y » · « Renomme le site en Z » | **Proposition** `rename_page` / `rename_site` |
| Questions (« Comment… ? », « Quel… ? ») | **Conseil** : rappel du contenu du plan, aucune modification |
| Couleurs, polices, textes, images, mobile, publication | **Orientation** vers l'étape concernée, aucune modification |
| « Supprime… » | **Refus explicatif** : l'assistant ne propose **jamais** de suppression ; supprimer se fait à l'étape Plan, avec confirmation |
| Autre | « Je n'ai pas compris » avec des exemples |

## Garanties (testées)
- Une proposition **ne change rien** avant « Accepter » ; elle montre le changement, l'ancienne et la nouvelle valeur.
- L'acceptation passe par le **même chemin que vos propres modifications** (`workspace.edit` → `plans.edit`), protégé par la révision : une proposition périmée est refusée (409) ; une proposition ne s'applique qu'une fois.
- L'acceptation est **annulable** (bouton Annuler, une seule entrée).
- Le périmètre se limite à la demande : une page ajoutée n'en modifie aucune autre ; aucune page ni section existante n'est jamais supprimée par l'assistant.
- L'historique de la conversation est conservé (200 messages affichés) ; le contexte transmis est l'étape ouverte et la page choisie dans le plan.
- Un message est borné (600 caractères), nettoyé ; le texte est affiché sans interprétation HTML.

## Limites
Pas de contexte « composant sélectionné » (l'interface n'a pas d'éditeur de composants : l'édition fine se fait dans l'éditeur natif) · pas de reformulation de textes par l'assistant (étape Contenus) · pas de modification de couleurs par la conversation (étape Design) · pas de « génération d'une autre image pour cette bannière » par la conversation (étape Images).

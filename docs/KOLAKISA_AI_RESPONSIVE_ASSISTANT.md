# KOLAKISA — Assistant responsive (22.8)

Déterministe : **aucun appel IA**, aucun coût. Il ne comprend pas de phrases libres (« optimise pour mobile ») : il propose des corrections issues des règles de l'audit.

Flux (API `/site-web/sites/:id/responsive/api`) : `GET analyse` / `pages/:pid/analyse` (lecture seule) → `POST proposer {pageId, scope: page|section|node, sectionId?, nodeId?, rules?}` (n'écrit rien) → `POST operations/:id/appliquer {confirm?, allow?}` → `POST operations/:id/annuler`; `refuser` abandonne.
Garanties (testées sur serveur réel) :
* Portée explicite ; une correction « élément » ne touche que cet élément ; « vérifier toutes les pages » est en lecture seule et nomme page et élément.
* Écrit uniquement des valeurs **tablette / mobile absentes** : l'ordinateur et les valeurs manuelles par écran sont intacts.
* Brouillon seulement (jamais publié) ; validation par le normaliseur natif avant proposition ; instantanés avant/après et historique 21.9 ; annulation exacte.
* Section verrouillée : 423 ; validée ou modifiée à la main : confirmation exigée ; plusieurs sections : confirmation ; conflit de révision : 409.
* Droits : `forms.write` pour proposer/appliquer ; `revisions.restore` en plus pour annuler ; isolation par site (opération d'un autre site : 404).
Non fait : interprétation de demandes en langage naturel, correction d'une seule page vers « toutes les pages » en une opération (volontairement refusé).

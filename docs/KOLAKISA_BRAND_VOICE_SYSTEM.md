# Voix de marque

Le système existe depuis 21.6 (`contentGen/voice.js`, table `mk_content_voice`, une voix **par site**) : 14 orientations (professionnel, corporate, premium, commercial, accessible, institutionnel, éducatif, technique, créatif…), formalité, longueur des phrases, vocabulaire, argumentation, tu/vous/nous, personnalité, termes du secteur, **termes à éviter**. Ajustement local par page possible (`voice.effective`).

## Ce que 22.6 ajoute : le CONTRÔLE de la cohérence
`quality.js` compare le texte réel à la voix du site :
| Contrôle | Critère | Gravité |
|---|---|---|
| Tutoiement dans un site au vouvoiement (ou l'inverse) | cohérence éditoriale | important |
| Longueur moyenne des phrases supérieure à la cible de la voix (+8 mots) | cohérence éditoriale | facultatif |
| Termes que la voix demande d'éviter | cohérence avec la marque | important |
| Nom de l'entreprise absent d'un texte de plus de 100 mots | cohérence avec la marque | facultatif |
| Texte illisible pour une voix « vocabulaire courant » | lisibilité | important |

L'action « Harmoniser le ton avec le site » de l'assistant d'optimisation reformule via la régénération 21.9 (la voix du site est appliquée par le moteur de révision).

## Limites
- Les préférences terminologiques « à privilégier » ne sont pas contrôlées automatiquement (seul « à éviter » l'est).
- L'écran 22.6 affiche la voix mais **ne permet pas de la modifier** : elle se règle là où elle l'était (Content Generator / API `voice`).
- Les tests d'adresse tu/vous valent pour le français.

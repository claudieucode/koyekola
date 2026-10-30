# Flexbox

Utilisé pour les rangées de boutons (`flexWrap`, `gap`, `justifyContent`), les lignes de cartes en colonne (`flexDirection: column`), les rangées numéro + texte (`alignItems`). Choix Grid / Flex : Grid dès qu'il y a deux axes ou des portées ; Flex pour un seul axe (boutons, pile de contenu). Les piles sont des nœuds `stack` (pas d'imbrication ajoutée : profondeur ≤ 6 testée).
Non réalisé : `order` et alignements individuels (`alignSelf`) sont supportés par le moteur mais utilisés seulement pour la carte superposée (`alignSelf: center`) ; pas de réorganisation d'ordre par `order` (l'ordre source suit la lecture mobile).

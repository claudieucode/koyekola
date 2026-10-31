# Réseau et API

## Constaté
- Brotli actif en production pour HTML/CSS/JS (curl : `content-encoding: br`). Home de production : **TTFB 0,43 s, 4 466 o** (un seul relevé depuis cette machine, réseau réel, non répété : indicatif).
- Domaines externes : l'analyseur les liste ; aucune page de test n'en charge.
- Pas de `preconnect` inutile ajouté. Pas de préchargement généralisé.

## Fait
Rapport par page : nombre de références (estimation), scripts bloquants, feuilles bloquantes, domaines externes, compression de la réponse, TTFB local mesuré.

## Non fait
Mesure des appels API en conditions réelles, pagination des listes CMS, déduplication de requêtes : aucun problème mesuré, aucune modification.

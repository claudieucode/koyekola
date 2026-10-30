# KOLAKISA — AI Core : sécurité

## Secrets
- Clés : centre de connecteurs (chiffrement AES-256-GCM, `ENCRYPTION_KEY`, par site). Le Core ne les lit que côté serveur, pour un appel, et les place dans un en-tête HTTP (jamais dans l'adresse). Aucune clé dans le code client, les réponses, les journaux ou la base d'utilisation (testé : clé factice absente de toutes ces sorties, y compris quand un fournisseur la recopie dans son message d'erreur).
- Pas de cryptographie maison : on réutilise celle des connecteurs. Rotation, suppression et masquage dans l'administration : fournis par le centre de connecteurs existant (hors de ce programme, non retesté ici).
- Aucune fausse clé de démonstration dans le code livré (la clé factice n'existe que dans les tests).

## Permissions (`security.js`)
| Permission | Donne |
|---|---|
| `ai.use` | Exécuter une requête sur un site de son organisation (et, si l'accès est limité à un site, sur ce site seulement) |
| `ai.site_admin` | Activer l'IA pour **son** site, restreindre ses modèles à ceux que le niveau central autorise, consulter sa consommation |
| `ai.admin` (accès non limité à un site) | Fournisseurs, modèles, tarifs, routage, secours, quotas, métriques de l'organisation et de la plateforme |
Aucune route HTTP n'est branchée : ces contrôles sont dans les services, que les routes devront appeler. `actor` est construit par le serveur, jamais lu d'un corps de requête.

## Isolation
Site d'une autre organisation, site inexistant ou identifiant forgé → `not_authorized`. Accès limité à un autre site ou sans site → refus. La portée du site est transmise au résolveur de clés (une clé propre à un site ne sert pas un autre). Journal et quotas filtrés par organisation/site. L'inventaire des tables classe `mk_ai_core_usage` comme **isolée**.

## Entrées et sorties
Limites de taille, rôles contrôlés (pas de « system » dans les messages), instructions système réservées aux modules enregistrés. Sorties : toujours `trusted: false`, bornées, nettoyées, JSON validé. **Le Core n'exécute rien et n'écrit rien dans le site** : toute action issue d'une réponse devra passer par un service autorisé de l'appelant. L'injection d'instructions n'est **réduite, pas supprimée** : séparer les rôles n'empêche pas un contenu utilisateur de tromper un modèle ; l'appelant doit traiter la sortie comme non fiable.

## Réseau
Couche commune des connecteurs : HTTPS, nom d'hôte déclaré par l'adaptateur, refus des adresses privées, aucune redirection, délai et taille bornés.

## Confidentialité
Le contenu envoyé est transmis au fournisseur choisi ; la configuration centrale limite les fournisseurs autorisés (`allowedProviders`) et le secours ne peut pas sortir de cette liste. Aucun contenu n'est conservé par le Core.

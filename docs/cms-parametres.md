# CMS KOLAKISA — Paramètres (palier 14)

## Audit de départ
Les réglages existaient déjà, éparpillés : SEO (`seo_settings`), commentaires (`mk_settings 'comments.settings'`), conception du site CMS (`mk_sites.settings`), page d'accueil (`mk_sites.home_page_id`), préférences utilisateur (`user_prefs`). Les écrans « Paramètres » du CMS n'étaient que des maquettes désactivées.

## Architecture
Une **couche de configuration** (`src/services/settings/index.js`) au-dessus des stockages existants — aucune nouvelle table, aucun système parallèle. Chaque réglage a une définition : clé, groupe, type, portées, permission, sensibilité, impact, validation, valeur par défaut.

| Portée | Stockage | Modifiable |
|---|---|---|
| Plateforme | variables d'environnement | lecture seule (jamais exposée si secrète) |
| Site principal | `mk_settings` (`cms.*`) ou moteur propriétaire (SEO, commentaires) | oui, selon permission |
| Site CMS | `mk_sites` (nom, `home_page_id`, `settings.general`) | oui, isolé par site |
| Préférence utilisateur | `user_prefs` | seulement par la personne elle-même |

Une préférence utilisateur ne peut jamais écraser un réglage de sécurité global.

## Garanties
- `update()` est tout-ou-rien (transaction imbriquable, SAVEPOINT).
- Réglages sensibles (adresse publique, page d'accueil, permaliens, visibilité moteurs) : confirmation explicite + permission `settings.sensitive`.
- Réinitialisation par réglage ou par groupe (jamais globale).
- Journal d'audit pour chaque changement ; invalidation des caches concernés.
- API JSON : `/site-web/parametres/api` (liste, clé, groupe atomique, préférences).

## Réglages et consommateurs réels
Nom du site, langue (`<html lang>`), fuseau et formats de date/heure (`utils/format`), e-mail administrateur (contact), page d'accueil (routage, canonical, sitemap), articles par page (blog), commentaires, limites de médias, permaliens (`normalizePaths`), SEO (titres, image sociale), page de confidentialité (pied de page, bannière), visibilité moteurs (en-tête, meta, robots.txt, sitemap).

## Intégrations
Export/import (type `settings`, clés sensibles ignorées à l'import), Santé du site (5 contrôles), journal d'audit.

## Limites connues
Début de semaine non implémenté ; logo/favicon = chemins de la médiathèque ; pas de type JSON ; pas de réglages commentaires/médias par site CMS ; logo du site principal géré dans Apparence ; pas de slogan ; drapeaux de fonctionnalité en lecture seule.

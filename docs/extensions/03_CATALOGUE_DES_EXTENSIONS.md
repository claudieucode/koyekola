# Catalogue des extensions (version 1.0.0)

| Identifiant | Nom | Catégorie | Portée | Ce qu'elle commande |
|---|---|---|---|---|
| `commerce` | Kolakisa Commerce | commerce | site principal toujours actif | écrans `/boutique/*` de l'espace d'un site, revenus, boutique publique, API, webhooks, widgets, plan du site |
| `lms` | Kolakisa LMS | formation | site principal toujours actif | pages publiques des formations, panier/commande de formations, `/formateur` sur le domaine du site |
| `sms` | SMS | communication | site principal toujours actif | écrans `/sms`, SMS d'un contact |
| `ai` | Intelligence artificielle | ia | site principal toujours actif | écrans `/ia` |
| `social` | Réseaux sociaux | marketing | site principal toujours actif | écrans `/reseaux` |
| `scoring` | Score des contacts | analyse | site principal toujours actif | écrans `/score` |

Les manifestes sont dans `src/extensions/manifests/<id>.js`. L'état d'activation par site est dans `mk_site_modules` ; l'historique dans `mk_extension_events` ; les paramètres dans `mk_extension_settings`.

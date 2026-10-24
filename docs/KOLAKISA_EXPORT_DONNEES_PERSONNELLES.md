# Outils → Exporter les données (données personnelles)

Écran : **Administration du site → Outils → Exporter les données** (`/marketing/site-web/outils/donnees?site=<id>`, ou depuis l'espace d'un site : `/sites/<id>/outils/donnees`).
Le moteur est **commun** à tous les sites ; chaque demande, chaque archive et chaque réglage appartient à **un seul site** (`site_id` vide = site principal). Un nouveau site dispose de la fonction sans réglage.

## Cycle de vie d'une demande
`En attente de confirmation → Confirmée → Export en cours → Export prêt → Envoyée` (+ `Expirée`, `Échec`, `Aucune donnée`). L'état reflète le résultat réel :
- **Création** : saisie validée (adresse e-mail, ou identifiant d'un compte retrouvé EXACTEMENT), une seule demande ouverte par personne et par site, site archivé = lecture seule. Avec « Envoyer un e-mail de confirmation » : jeton aléatoire (32 octets), **jamais conservé** (empreinte SHA-256), usage unique, durée configurable, lien lié à la demande donc au site. L'e-mail ne contient ni identité ni donnée.
- **Confirmation** : page publique `/donnees-personnelles/confirmer/<jeton>` — un GET n'enregistre rien (les antivirus ouvrent les liens), seul le bouton confirme. Réponse identique pour un lien inconnu, expiré ou déjà utilisé.
- **Sans e-mail** : exige le droit `tools.export` **et** une case explicite (« identité vérifiée ») ; l'administrateur est enregistré comme ayant confirmé.
- **Génération** (administrateur, après confirmation seulement) : exécution des collecteurs, archive ZIP, relecture du fichier écrit (empreinte + CRC) avant « Export prêt ». Aucune donnée → « Aucune donnée » et **aucune archive**. Échec d'écriture → « Échec », fichiers temporaires supprimés, nouvel essai possible.
- **Envoi du lien** : e-mail (file d'envoi existante, texte effacé après envoi) à la **seule adresse vérifiée de la demande**, avec nom du site, expiration et consigne en cas de problème. « Envoyée » n'est affiché que lorsque le service d'e-mail a réellement envoyé ; sinon l'erreur est visible et l'envoi peut être refait **sans régénérer l'archive** (un nouveau lien invalide l'ancien).
- **Téléchargement** : administrateur (`/archive`, droit + site vérifiés) ou personne (`/donnees-personnelles/telecharger/<jeton>`, bouton POST, 10 téléchargements au plus, durée ≤ conservation de l'archive).
- **Actions** réellement disponibles selon l'état : renvoyer la confirmation, générer / réessayer, télécharger, envoyer le lien, relancer (expirée, en échec, sans donnée), supprimer (demandes terminées ; supprime aussi l'archive, **jamais les données sources**). Actions groupées : renvoyer, générer, envoyer, supprimer — chaque demande est contrôlée une par une, avec récapitulatif réussites / refus motivés.

## Moteur et collecteurs (`src/services/privacy/exportEngine/`)
Registre de collecteurs : un fichier de `collectors/` (ou `registry.register()`) déclare `id`, `title`, `category`, `owner`, `description`, `fields`, `method`, `filter`, `limits`, `scope` (`site` | `principal` | `both`), `permission`, `orgOnly` et `collect(ctx)`. Le moteur n'a aucune règle propre à un module : **ajouter un module = ajouter un fichier**. Un collecteur en échec est isolé (message court, les autres résultats sont conservés). Le rapport distingue : exportées, sans donnée, non applicables au site, non autorisées, en échec, et sources externes.

| Collecteur | Portée | Droit | Source (relation réelle) | Limites |
|---|---|---|---|---|
| compte, préférences | principal | équipe | `users` / `user_prefs` du compte retrouvé | ni mot de passe ni jeton ; photo non incluse |
| formation | principal | équipe | inscriptions, leçons, quiz, notes, favoris, avis, certificats (`user_id`) | contenu des formations non exporté |
| commandes | principal | équipe | `orders`, `order_items` (`user_id`) | données bancaires chez le prestataire |
| support | principal | équipe | tickets, messages, notifications (`user_id`) ; messages de contact (e-mail identique) | |
| commentaires | site ou principal | — | `blog_comments` : compte OU e-mail d'invité identique, contenu rattaché au site (`mk_content_sites`) | IP non exportée |
| contact-fiche, consentements, listes | site ou principal | `contacts.view_sensitive` | `mk_contacts` (e-mail identique) rattaché au site (`mk_contact_sites`) ; consentements et listes du site | |
| contact-organisation | principal | équipe + sensible | étiquettes, propriétés, préférences de catégories, notes internes | partagés entre sites : jamais dans l'export d'un site |
| activite | site ou principal | sensible | `mk_events` du site (dont envois de formulaires) | 2 000 événements au plus |
| envois | site ou principal | sensible | e-mails et SMS de campagne du site | traces d'envoi seulement |
| sondages | principal | équipe + sensible | `mk_survey_responses` | sondages non rattachés à un site |
| fichiers-formulaires | site ou principal | sensible | références des fichiers déposés | fichiers non copiés dans l'archive |

Sources externes signalées (jamais prétendues collectées) : sauvegardes de la plateforme, prestataire d'e-mail (si SMTP configuré), prestataire de paiement (si clé de paiement présente).

## Contenu du ZIP
`donnees-personnelles.html` (rapport lisible, échappé, UTF-8, regroupé par catégorie), `donnees.json` (`kolakisa-export-personnel@1`, mêmes données), `manifeste.json` (catégories, champs, méthode, filtre, limites, empreintes SHA-256 des fichiers). Toute colonne ou ligne ressemblant à un secret est retirée par le moteur.

## Sécurité, expiration, rétention
- Stockage **privé** : `<DATA_DIR>/private-exports/<main|site-N>/<48 hex aléatoires>.zip` (droits 0600), hors `public/` et `uploads/`, servi uniquement par une route contrôlée (droit + site + empreinte).
- Durées par site (Réglages sur l'écran) : validité du lien de confirmation (48 h), du lien de téléchargement (72 h), conservation de l'archive (7 j), conservation des demandes terminées (180 j). Entretien toutes les 15 min et au démarrage : archives expirées supprimées, demandes bloquées « en cours » mises en échec, fichiers orphelins de plus d'une heure effacés, demandes terminées purgées après leur durée.
- Essais invalides limités à 10 par adresse et par 15 min (429) ; `Referrer-Policy: same-origin`, `Cache-Control: no-store`, `noindex`.
- Journal d'activité : actions tracées (identifiant de demande, site, résultat) **sans adresse e-mail, sans jeton, sans lien, sans contenu**.

## Limites connues
Les liens sont construits sur l'adresse principale (`SITE_URL`) ; l'e-mail est en français ; les sauvegardes quotidiennes ne sont pas modifiées ; les fichiers déposés dans les formulaires ne sont pas copiés dans l'archive ; le module e-commerce n'existe pas encore (seules les commandes de formations sont couvertes).
Tables : `cms_privacy_requests` (migration `104_export_donnees_personnelles.sql`, additive).

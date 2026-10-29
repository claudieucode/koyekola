# Analytics et conversions

Préfixe `H` = https://help.systeme.io/article/

## 1. Statistiques natives

- Statistiques de tunnel (visiteurs, conversions, revenus par étape) : **aucun article lu ne les décrit** ; la page https://systeme.io/features ne les détaille pas. À VÉRIFIER : créer un tunnel gratuit et ouvrir le tableau de bord et chaque tunnel.
- Statistiques du test A/B : un tableau apparaît après « Start A/B test » ; colonnes non décrites (H218-how-to-create-a-split-test).
- Statistiques SMS : SMS > Statistics (H4483-how-to-send-sms-messages-with-systeme-io).
- Statistiques e-mail via l'API : envois, ouvertures, clics, rebonds, plaintes spam ; période maximale de 31 jours (H2323-how-to-create-a-public-api-key-on-systeme-io).
- Transactions : Sales > Transactions, filtres e-mail, produit, dates (H151-how-to-make-a-test-purchase). Commandes de produits physiques : Ventes > Commandes (H292).
- Sous-comptes : statistiques distinctes par sous-compte, vue globale sur le compte principal (H4243-how-to-create-a-sub-account-on-systeme-io).
- Déclencheur de suivi : visite d'une page choisie (workflows, webhook `contact.page.visited`) (H1542, H144).

## 2. Pixel Meta (Facebook)

Source : H1632-how-to-add-facebook-pixel-and-setup-events.
- Prérequis : compte Business, compte publicitaire, domaine personnalisé.
- Installation manuelle : code dans Settings de la page (section Tracking > header) ou globalement Settings > Sales funnel > code de suivi. Le pixel doit figurer sur toutes les pages.
- Événements : configuration automatique peu fiable ; ajout manuel recommandé (exemple View content).
- Vérification de domaine : balise meta dans l'en-tête ou les paramètres du tunnel.
- Déduplication Pixel + CAPI via eventID : placeholders `%FACEBOOK_PURCHASE_EVENT_ID%`, `%FACEBOOK_EVENT_ID%`, `%FACEBOOK_NEW_LEAD_EVENT_ID%` (l'article cite aussi une syntaxe `{{...}}` : À VÉRIFIER laquelle est valide).
- Achat : événement Purchase avec montant/devise ; bumps et upsells présents à l'achat regroupés dans un seul événement.

## 3. Conversions API (CAPI)

Source : H1719-facebook-conversions-api. Côté Meta : Events Manager > Using the Conversions API > Set up manually > jeton d'accès. Côté systeme.io : Settings > Custom Domains > "..." > Settings > Pixel ID + token > Save. Ensuite associer l'événement à chaque page dans ses paramètres. Au moins un paramètre d'information client par événement. Suivi page par page.

## 4. Autres pixels / suivi

- Code de suivi libre (Google Analytics, TikTok, etc.) via header/footer par page ou code global (H306-is-it-possible-to-insert-html-css-or-js-code). Aucun article spécifique à GA ou TikTok n'a été lu. À VÉRIFIER.
- UTM / suivi d'affiliation : programme d'affiliation (catégorie 160, non lue). Le lien de partage de tunnel est un lien d'affiliation (H148).

## 5. Relations

- Un test d'achat est requis pour valider le suivi Purchase (H1632).
- Les statistiques e-mail/newsletters (ouvertures, clics) sont mentionnées dans le tableau de bord e-mail : voir EMAILS_ET_AUTOMATISATIONS.md. Écran exact : À VÉRIFIER.

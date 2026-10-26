# Audit de code (lecture seule) : modules 12 à 21 de l'emailing / marketing

Date : 2026-10-26. Branche `feat/email-marketing`. Périmètre : infrastructure d'envoi et délivrabilité, conformité, statistiques, CRM léger, pont e-commerce/LMS, SMS, API publique + clés + webhooks sortants, IA, comptes/rôles/isolation, facturation/quotas, tableau de bord.

Méthode : lecture du code (les documents `EMAIL_MARKETING_*.md` n'ont pas servi de source), exécution de tests existants, et petits scripts de reproduction jetables (hors dépôt, dans le dossier temporaire de session) pour confirmer chaque bug annoncé. Aucun fichier du projet n'a été modifié en dehors de ce rapport.

Légende des états : **V** = Fonctionnelle et vérifiée (test) · **I** = Fonctionnelle, insuffisamment testée · **P** = Partielle · **UI** = Interface sans logique · **N** = Non implémentée · **B** = Bloquée externe (dépend d'un fournisseur, d'un DNS ou d'une clé que le code ne contrôle pas).

---

## 1. Synthèse

Le socle est sérieux : la garde d'envoi (`isSendable` + équivalent SQL en masse) est revérifiée à chaque message, les envois interrompus ne sont jamais rejoués, les jetons sont signés et séparés par type, l'isolation par organisation passe par un dépôt de données qui impose `organization_id`, le rendu d'e-mail échappe/assainit tout (sondes XSS négatives), les secrets sont chiffrés (AES-GCM lié au contexte) et jamais relayés dans les erreurs.

Écarts réels confirmés par reproduction (détail §3) :

| # | Gravité | Écart | Preuve |
|---|---|---|---|
| B1 | Haute | SSRF par redirection dans les webhooks sortants : la requête suit les redirections et ne fige pas l'IP résolue | `src/marketing/webhooks/delivery.js:72` |
| B2 | Haute | Un tiers peut réabonner une personne désinscrite (ou abonner n'importe quelle adresse) via un formulaire sans double confirmation ou via l'inscription au LMS (case cochée, adresse non vérifiée) | `compliance/consent.js:14`, `forms/index.js:326`, `routes/auth.js:64` |
| B3 | Haute | Connexion mobile : une seconde connexion échoue toujours (500) ; en plus, toute connexion révoque la clé de tous les utilisateurs, et le rôle dans l'organisation n'est pas contrôlé (un « lecteur » obtient une clé `write`) | `api/mobile-auth.js:67-73` + `migrations/012_cles_api.sql` |
| B4 | Moyenne | Un scénario ne se déclenche qu'une seule fois par contact, à vie (y compris les scénarios « transactionnels » : confirmation de la 2e commande jamais envoyée) | `automations/engine.js:71-73`, `migrations/009_pont_automatisations.sql:53` |
| B5 | Moyenne | Usurpation d'expéditeur : un domaine ajouté sans aucune preuve de propriété est accepté comme expéditeur d'un site | `sending/builder.js:67`, `domains/index.js:addDomain` |
| B6 | Moyenne | Le type « transactionnel » contourne le consentement et la désinscription (seule la liste de suppression compte) ; aucun contrôle du contenu | `automations/actions/send.js:37-40` |
| B7 | Moyenne | Tout code SMTP 550/551/553 devient une suppression définitive et non levable, même pour un blocage de politique (anti-spam, réputation) | `sending/providers/smtp.js:7`, `sending/dispatch.js:185` |
| B8 | Moyenne | Risque de double envoi : SMS (Twilio, sans clé d'idempotence) et SMTP réessayés après un délai dépassé alors que le fournisseur a peut-être déjà accepté ; e-mail de scénario sans état « sending » | `sms/campaigns.js:352`, `automations/actions/send.js:46-62` |
| B9 | Basse | Webhook sortant : toute réponse 4xx (dont 408 et 429) abandonne définitivement la livraison | `webhooks/delivery.js:84` |
| B10 | Basse | Consentement SMS non vérifié (aucun code de confirmation sur le numéro) | `forms/index.js:301`, `sms/consent.js:recordSmsConsent` |

Non implémenté (écarts fonctionnels, §2) : facturation/forfaits, échauffement d'IP et limitation par domaine destinataire, mise en pause automatique sur pic de rebonds/plaintes, signature DKIM par l'application (déléguée au fournisseur), détection des ouvertures automatiques Apple MPP, rétention/purge des événements d'e-mail, API d'envoi.

---

## 2. États par fonction

### 2.1 Infrastructure d'envoi et délivrabilité

| Fonction | État | Preuves (code) | Preuves (tests) / remarques |
|---|---|---|---|
| Abstraction fournisseur (console, SMTP, Resend) | **V** | `sending/providers/index.js` (interface `send(message)`, `PROVIDERS`), `providers/errors.js` (SendError normalisée, messages génériques) | `tests/marketing-providers.test.js` : « classement des erreurs… », « le message d'erreur exposé ne contient jamais le texte brut du serveur », « la clé d'API n'apparaît JAMAIS dans une erreur ni dans les journaux » (exécuté : réussi) |
| Fournisseur Resend (API, idempotence, délai) | **V** | `providers/resend.js:19-45` (`Idempotency-Key`, `AbortController` 15 s, 429 → `rate_limited` avec `Retry-After`, 401/403 → `config`) | `marketing-providers` : « requête : … clé d'idempotence », « délai maximal », « réponse sans identifiant : erreur temporaire » |
| Fournisseur SMTP | **P** | `providers/smtp.js:7` : 550/551/553 = adresse refusée | Pas d'événements de retour (rebonds différés inconnus). Voir B7 |
| File d'attente (SQLite) | **V** | `queue/jobs.js` : réservation atomique `UPDATE … RETURNING`, bail 60 s, reprise des baux expirés, `dead` après épuisement ; `queue/worker.js` : délai max < bail | `tests/marketing-file-evenements.test.js` ; `marketing-campaigns` « le worker exécute l'envoi complet » (exécuté : 35/35 réussis, 90 s) |
| Reprises (retries) | **V** | `dispatch.js:MAX_ATTEMPTS=3`, délai `RETRY_BASE_MS*2^(n-1)` ; file : `backoffMs` ±20 % | `marketing-campaigns` : « échec temporaire : nouvelle tentative plus tard (attente croissante), puis succès ; abandon après 3 essais » |
| Idempotence d'envoi | **V** | `builder.js:51` clé `campaign:<id>:contact:<id>` ; `UNIQUE(campaign_id, contact_id)` sur `mk_messages` (`migrations/008_envoi.sql:76`) ; reprise d'un job : `INSERT OR IGNORE`, destinataire « claim » atomique (`dispatch.js:claim`) | `marketing-campaigns` : « idempotence : rappeler l'envoi ne renvoie rien », « envoi interrompu… JAMAIS renvoyé automatiquement ». Limites : voir B8 |
| Limites de débit / plafond quotidien | **V** | `dispatch.js:capacity` (calculé depuis la base, valable après redémarrage et multi-worker) | `marketing-campaigns` : « débit par minute… », « plafond quotidien… (UTC) ». Limite : le plafond est par organisation, jamais par domaine destinataire ; jour UTC |
| Échauffement (warm-up) / réputation | **N** | Aucun code ; seuls des seuils d'alerte passifs dans `sending/stats.js:11-13` (rebond 2 %, plainte 0,1 %) | Aucune mise en pause automatique sur dépassement |
| Contrôle avant envoi (preflight) | **V** | `sending/preflight.js` : modèle prêt, expéditeur, https, clé, audience, avertissement domaine | `marketing-campaigns` « erreurs bloquantes… », « Resend sans clé… ». Adresse postale absente = simple avertissement (`preflight.js:~67`) |
| Domaines SPF/DKIM/DMARC | **P** | `domains/index.js` : vraies requêtes DNS (`lookup`), analyse SPF (doublon, `+all`, >10 recherches), DMARC (`p=`), DKIM par sélecteurs courants ou Resend | `tests/marketing-domaines.test.js` (« propriété seule → vérifié ; tout publié → authentifié… », « DNS injoignable : rien n'est conclu »). Limites : DKIM « ok » dès qu'une clé existe à l'un des 15 sélecteurs courants (pas forcément celui utilisé) ; SPF non confronté au fournisseur réel ; `senderWarning` jamais bloquant ; propriété non exigée pour utiliser le domaine (B5). **B** pour la propagation DNS |
| Signature DKIM | **B** | Pas de signature dans l'application : déléguée à Resend / au SMTP | Non vérifiable en code |
| Rebonds | **V** (Resend) / **P** (SMTP) | `sending/webhooks.js:applyEvent` : dur → suppression ; temporaire → enregistré seulement ; « livré » tardif n'écrase pas un rebond | `tests/marketing-tracking.test.js` : « rebond permanent… », « rebond temporaire : enregistré, MAIS pas de suppression », « ordre inversé… ». SMTP : seul le refus synchrone est connu. Pas de seuil « N rebonds mous → suppression » |
| Plaintes | **V** (Resend) / **N** (SMTP) | `sending/webhooks.js` ; aucune boucle de retour (FBL) hors Resend | `marketing-tracking` : « plainte : contact « complained », suppression… » |
| Liste de suppression | **V** | `compliance/suppression.js`, `compliance/sendable.js` (`NOT EXISTS mk_suppressions`) ; seul le motif « manual » est levable | `marketing-conformite` : « un contact suppressed ne peut JAMAIS être réabonné », « retrait : seulement pour « manual » » |
| Webhooks fournisseur signés (entrants) | **V** | `sending/webhooks.js:verifySvixSignature` (HMAC-SHA256, tolérance 300 s, `timingSafeEqual`), `web/webhooks.js:15-37` (corps brut, secret par organisation, limiteur 600/min, `dedupe_key = svix-id`) | `marketing-tracking` : « refus : corps modifié, autre secret… horodatage périmé ou futur », « webhook signé : livré puis rebond permanent → suppression ; rejeu sans effet », « webhook refusé : … organisation inconnue ou sans secret » |
| En-têtes List-Unsubscribe / one-click | **V** | `builder.js:50` (`List-Unsubscribe: <https://…/u/<jeton>>`, `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, `Precedence: bulk`) ; `web/public.js:48-62` (POST one-click → 200 sans page) | `marketing-campaigns` « tout est envoyé… en-têtes de désinscription en un clic » ; `marketing-public` « désinscription « en un clic »… ». Absent : variante `mailto:` du List-Unsubscribe (non requise par Gmail/Yahoo si https one-click) |
| Test A/B, heure locale / optimisée | **V** (hors périmètre détaillé) | `sending/abtest.js`, `sendtime.js` | `tests/marketing-tests-ab.test.js`, `marketing-heure-envoi.test.js` (existants, non réexécutés ici) |

### 2.2 Conformité

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Consentement par canal (e-mail / SMS séparés) | **V** | `compliance/consent.js:recordConsent` (finalité `marketing`), `sms/consent.js:recordSmsConsent` (finalité `sms`, preuve liée au numéro) | `marketing-sms` : « un abonné e-mail n'est PAS abonné aux SMS », « le consentement vaut pour SON numéro » ; `marketing-conformite` |
| Preuve de consentement | **V** | texte exact, source, IP tronquée (`truncateIp`), site de collecte ; table protégée en écriture | `marketing-conformite` : « les preuves ne se modifient ni ne se suppriment directement (base protégée) » |
| Double opt-in | **P** | `forms/index.js:326-338` (jeton 32 octets, hash SHA-256, validité 7 j, usage unique `confirmSubscription`) ; activé par défaut seulement via la page de création (`web/forms.js:29`), `createForm(... doubleOptin=false)` par défaut | Absent pour l'inscription LMS et les formulaires existants. Voir B2 |
| Désinscription (jeton, one-click, GET sans effet) | **V** | `web/public.js` : GET n'écrit rien ; POST désinscrit ; jeton sans expiration (`security/tokens.js`) | `marketing-public` : « GET : … aucune désinscription (les aperçus de liens ne doivent rien faire) », « jetons faux… : réponse neutre » |
| Désinscription par liste / catégorie | **V** | `sendable.js` (clauses liste + catégorie) | `marketing-campaigns` : « désinscription de LA LISTE ciblée entre-temps : respectée aussi » ; invariant masse = unitaire (« INVARIANT : le calcul en masse donne exactement les contacts que isSendable accepte ») |
| Centre de préférences | **V** | `compliance/preferences.js`, `web/public.js:75-118` | `marketing-public` : « GET : catégories cochées… », « un désinscrit peut se réabonner LUI-MÊME » |
| Réabonnement interdit aux imports / API / admin | **V** | `PERSON_SOURCES` (`consent.js:14`), `import/service.js:177-182` (consentement « déclaré » = case + texte ≥ 10 caractères) | `marketing-conformite` : « les importations, l'API, l'admin ne peuvent PAS le réabonner » ; **mais** `form` et `signup` valent « la personne » sans preuve de contrôle de la boîte (B2) |
| Export des données (droit d'accès) | **I** | `services/privacy/exportRequests.js`, `exportEngine/collectors`, `modules/60-emailing.js` ; `audience/export.js` (CSV contacts, formules neutralisées, audité) | `tests/export-contacts-par-site.test.js`, `rgpd-compte.test.js` existants ; non rejoués ici. Le CSV de contacts ne contient pas les preuves de consentement |
| Effacement (droit à l'effacement) | **V** | `services/privacy/erasers/50-marketing.js` (suppression de la fiche, anonymisation des événements, fiche partagée entre sites non effacée depuis un seul site) | `marketing-conformite` : « l'effacement du contact emporte ses preuves » ; `marketing-campaigns` : « effacement d'un contact en cours de route ». Écart : la désinscription (`mk_unsubscribes`) disparaît avec la fiche, seule `mk_suppressions` est conservée (le texte affiché « Liste de suppression (désinscriptions) » est trompeur) |
| Rétention des événements d'e-mail | **N** | Aucune purge de `mk_message_events` ni des travaux « dead » (payload conservé) ; seule la purge des visites (`visitors/index.js:purge`) existe | |
| Adresse postale dans l'e-mail | **P** | Avertissement seulement (`preflight.js`) | Non bloquant |

### 2.3 Statistiques et rapports

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Stats par campagne (compteurs, taux, liens, alertes) | **V** | `sending/stats.js:campaignStats` : taux sur les envoyés (dénominateur explicite), alertes rebond/plainte | `marketing-tracking` : « compteurs, taux (avec dénominateur explicite), liens, alertes… », « aucun envoi : taux nuls sans division par zéro » |
| Agrégation depuis événements réels | **P** | Deux sources parallèles : compteurs `mk_campaigns.*_count` (`sending/events.js:bump`, utilisés par `stats.js`) et événements `mk_message_events` (utilisés par `analytics/engine.js:188`) | Risque de divergence entre l'écran de campagne et Analytics ; pas de contrôle de cohérence |
| Ouvertures / clics, robots | **P** | `sending/tracking.js:7` : filtre par user-agent (regex) ; événements « robot » enregistrés mais exclus | `marketing-tracking` : « robots… événement gardé, statistiques inchangées ». Limite : Apple MPP, GoogleImageProxy et préchargement d'antivirus avec UA générique sont comptés ; pas d'indicateur « ouverture machine ». Annoncé comme « indicatif » dans `stats.js:33` et `analytics/engine.js:199` |
| Redirection de clic | **V** | destination lue dans `mk_links`, https exigé (`tracking.js:recordClick`) | `marketing-tracking` : « aucune redirection ouverte… » |
| Export CSV de rapports | **V** | `analytics/compare.js:toCsv` (séparateur « ; », cellules neutralisées) ; `web/analytics.js:56,96` | `tests/marketing-rapports-comparatifs.test.js` (existant) |
| Rapports comparatifs / enregistrés | **I** | `analytics/compare.js` (rapports enregistrés `mk_saved_reports`) | tests existants non rejoués |
| Revenus attribués | **I** | `revenue/index.js` (ouvertures exclues explicitement, fenêtre en jours) | `marketing-revenus*.test.js` existants |

### 2.4 CRM léger

| Fonction | État | Preuves |
|---|---|---|
| Fiches, propriétés personnalisées, étiquettes, listes, notes, journal | **V/I** | `audience/contacts.js`, `properties.js`, `tags.js`, `lists.js`, `notes.js`, `timeline.js`, `contactcore/index.js` ; tests `marketing-audience`, `marketing-r2-contacts-data`, `cms-contacts-core` |
| Fusion, archivage, cycle de vie | **I** | `contactcore/index.js` (`setLifecycle`, fusion `merged_into_id`) ; `tests/cms-contacts-core.test.js` |
| Segments dynamiques | **V** | `segments/engine.js`, `index.js` | `tests/marketing-segments.test.js`, `marketing-r3-segments-data.test.js` ; invariant conformité masse = unitaire |
| Score de contacts | **I** | `scoring/index.js` | `tests/score-contacts.test.js`, `score-par-site.test.js` |
| Import CSV | **V** | `import/service.js`, `import/csv.js` (statut jamais importable, consentement déclaré) | `marketing-import*.test.js` |
| Demandes de rattachement entre sites | **I** | `contactcore/requests.js` | `tests/demandes-rattachement-contacts.test.js` |

### 2.5 Pont e-commerce / LMS

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Synchronisation des comptes en contacts (sans consentement) | **V** | `bridge/lms.js:syncLmsUsers` | `marketing-pont-lms` : « chaque compte devient un contact « unknown »… SANS consentement », « idempotente » |
| Case d'inscription facultative | **P** | `routes/auth.js:64` : `marketing_optin === "on"` → consentement immédiat | `marketing-pont-lms` : « inscription avec la case cochée : abonné avec une preuve complète ». Pas de confirmation d'adresse (B2) |
| Événements (inscription, commande, leçon, formation terminée, remboursement, avis, certificat) | **V** | `bridge/events.js` : lecture par curseur toutes les 30 s, première lecture sans événement, clés d'idempotence | `marketing-pont-evenements` : « la première lecture pose les curseurs et n'émet AUCUN événement », « idempotence : relire après un plantage… » |
| Temps réel | **P** | Sondage toutes les 30 s (pas d'écoute directe) ; seulement les lignes nouvelles (pas les modifications/suppressions) | |
| Panier abandonné / e-commerce externe (Shopify, Woo) | **N** (hors LMS) | Seul le LMS interne est pontable ; événements `cart.*` côté tunnels (`funnels/abandon.js`) | |
| Déclenchement unique par contact | **Bug** | B4 | |

### 2.6 SMS

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Fournisseur Twilio / console | **V** | `sms/providers/twilio.js` (codes d'erreur classés, jeton jamais relayé) | `marketing-sms` : « requête conforme… », « erreurs classées, sans jamais relayer le texte de Twilio » |
| Consentement, STOP/START/AIDE, suppression par numéro | **V** | `sms/consent.js`, `sms/webhooks.js:handleInboundSms`, `web/webhooks.js:44-67` (signature X-Twilio-Signature) | `marketing-sms` : « bloquer un numéro désabonne tout contact qui l'utilise », « effacer puis recréer le contact ne débloque pas le numéro », « STOP / invalide : non levables » |
| Heures de silence, dimanche et jours fériés FR | **V** | `sms/quiet.js` | `marketing-sms` : « 22 h à Kinshasa = silence », « jours fériés français… » |
| Envoi de campagne SMS (débit, plafond, segments) | **V** | `sms/campaigns.js` | `marketing-sms-campagnes.test.js`, `marketing-sms-parcours.test.js` (existants) |
| Vérification du numéro (code à usage unique) | **N** | `forms/index.js:301` : n'importe quel numéro saisi est enregistré comme accord | B10 |
| Double envoi SMS | **P** | `sms/campaigns.js:352` : `temporary` → réessai ; Twilio n'a pas de clé d'idempotence ici | B8 |

### 2.7 API publique, clés, webhooks sortants

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Clés d'API (hash SHA-256, affichage unique, révocation immédiate, portée read/write, portée de site figée) | **V** | `api/keys.js` | `marketing-api-keys` : « la clé complète est renvoyée une fois, jamais stockée en clair », « une clé révoquée n'authentifie plus, immédiatement » ; `portee-api-webhooks-unitaire` : « un utilisateur à accès limité au site A ne crée que des clés de A… » |
| API REST `/api/v1` (contacts, événements, campagnes pause/reprise/annulation, listes, overview) | **V** | `api/router.js` ; limiteur 120/min/clé ; clé de site → `siteScope` et refus `out_of_scope` | `marketing-api-router` : « clé en lecture seule : écriture refusée (403) », « pagination par curseur », « Idempotency-Key », « plafond : 120 requêtes par minute » |
| Pas d'envoi via l'API (transactionnel, campagne) | **N** | Aucune route d'envoi | |
| Authentification mobile | **Bug** | `api/mobile-auth.js` (B3) ; aucun test dédié (aucun `*.test.js` ne mentionne `/api/mobile`) | |
| Webhooks sortants : signature | **V** | `webhooks/delivery.js:signPayload` (HMAC-SHA256 sur `t.corps`) | `marketing-webhooks-delivery` : « HMAC-SHA256 vérifiable par le destinataire », « un secret différent… » |
| Webhooks sortants : file, reprises, idempotence, portée de site | **V** | `eventHandler`, clé `webhook:<endpoint>:<event>`, 6 tentatives | `marketing-webhooks-delivery` : « rejouer le même événement… », `portee-api-webhooks-unitaire` : « un point de site ne reçoit que SON site… » |
| Webhooks sortants : SSRF | **Bug** | `delivery.js:55-72` | B1. Le test « adresse privée… refusée AVANT toute requête réseau » ne couvre que l'adresse initiale |
| Rotation du secret d'un point d'accès | **N** | aucun code | |
| Secret des points d'accès | **V** | chiffré, révélation auditée (`endpoints.js:revealSecret`) | `marketing-webhooks-endpoints` : « jamais le secret, même chiffré » |

### 2.8 IA

| Fonction | État | Preuves |
|---|---|---|
| Objets, préheaders, réécriture, brouillon, conseils, texte de SMS | **V** | `ai/index.js` ; sortie validée par le moteur de modèles (variables inconnues retirées), liens jamais écrits par l'IA ; `tests/marketing-ia-redaction.test.js` : « objets : propositions valides seulement… journal SANS texte », « plafond quotidien… », « brouillon : … lien du bouton fourni par la personne » |
| Quota quotidien par organisation | **V** | `ai/index.js:call` (contrôle puis journalisation ; non atomique, dépassement possible de quelques unités en concurrence) |
| Clé API | **V** | connecteurs (`services/connectors/http.js` : https, hôte déclaré, résolution privée refusée, `redirect: "manual"`), sinon variable d'environnement |
| Données envoyées au tiers | Remarque | Le contenu rédigé par l'utilisateur part chez l'éditeur du modèle ; aucune donnée de contact (le prompt n'en contient pas) |
| Studio de pages IA | **I** | `ai/studio.js` : `tests/marketing-ia-redaction.test.js` ne couvre que l'éditeur d'e-mail et le SMS ; tests dédiés Studio dans `KOLAKISA_AI_STUDIO_TEST_REPORT.md` (non vérifié ici) |

### 2.9 Comptes, rôles, permissions, isolation par site

| Fonction | État | Preuves | Remarques |
|---|---|---|---|
| Rôles et permissions | **V** | `organizations.js:PERMISSIONS` (liste fermée : permission absente = refusée), rôles personnalisés (migration 049) ; `campaigns.send` = admin | tests `cms-users*.test.js` |
| Isolation par organisation | **V** (couche données) | `db/repository.js` impose `organization_id` ; tests à deux organisations (`freshMarketing` A/B) dans tous les fichiers | `marketing-campaigns` : « isolation : une autre organisation ne peut ni lancer, ni envoyer, ni voir la campagne ». **Une seule organisation est exposée** par l'interface (KOLAKISA) : l'isolation multi-organisation n'est pas exploitée en production |
| Isolation par site | **V** | `ctx.siteScope` propagé (dépôt, clés, webhooks, campagnes, imports, SMS) ; table déclarative `web/routeScopes.js` + test qui échoue si une route n'est classée | `tests/isolation-des-sites.test.js`, `isolation-des-sites-caches.test.js`, `portee-api-webhooks.test.js`, `contacts-par-site-*.test.js` (existants) |
| Clé d'API mobile et rôle | **Bug** | B3 | |

### 2.10 Facturation et quotas

| Fonction | État | Preuves |
|---|---|---|
| Forfaits, facturation de l'usage, quotas par plan | **N** | Aucun code (`grep` billing/plan/quota : seulement le quota IA et les plafonds d'envoi) |
| Plafonds d'envoi e-mail/SMS, quota IA | **V** | `sending/config.js` (débit ≤ 6000/min, jour ≤ 1 000 000), `sms/config.js`, `ai/index.js` |
| Estimation du coût SMS | **P** | `price_per_segment` par campagne ; pas de solde ni de facture |

### 2.11 Tableau de bord

| Fonction | État | Preuves |
|---|---|---|
| Accueil (chiffres, croissance, campagnes récentes, alertes, préparation) | **V** | `overview/index.js` (lecture seule, « pas d'envoi = pas de taux »), réutilisé par `GET /api/v1/overview` (refusé aux clés de site) ; `tests/marketing-r1-accueil.test.js` |
| Journal d'activité / audit | **V** | `audit.js`, `auditJournal.js`, export CSV | `tests` d'audit existants |

---

## 3. Bugs et failles : scénarios reproductibles

### B1. SSRF par redirection dans les webhooks sortants (haute)
`sendWebhook` contrôle la résolution DNS de l'hôte (`assertPublicHost`), puis appelle `fetch(parsed.toString(), …)` **sans** `redirect: "manual"` (`webhooks/delivery.js:72`). Deux conséquences : (1) un point d'accès public qui répond `307 Location: http://127.0.0.1:…` ou `http://169.254.169.254/…` fait émettre la requête signée (POST, corps conservé en 307/308) vers le réseau interne ; (2) la vérification DNS et la connexion font deux résolutions distinctes (DNS rebinding). Le gabarit sûr existe déjà dans `services/connectors/http.js` (`redirect: "manual"`, plages privées plus complètes).
Reproduction (réussie) : serveur local A répondant 307 vers serveur local B ; `sendWebhook({ url: "http://localhost:<A>/hook", lookup: async () => [{ address: "8.8.8.8" }], … })` → statut OK, et B reçoit `POST /internal-admin` signé. Le test existant ne couvre que l'adresse initiale (`marketing-webhooks-delivery` : « adresse privée : refusée AVANT toute requête réseau »).
Complément : `isPrivateAddress` (delivery.js:22) omet 100.64.0.0/10 (CGNAT), 192.0.0.0/24, 198.18.0.0/15, ce que la couche des connecteurs couvre. Le flux RSS (`rss/feed.js`) est correct : résolution fixée par `safeLookup`, redirections revalidées une à une.
Correctif : `redirect: "manual"` (statut 3xx = échec définitif), connexion à l'IP validée (agent avec `lookup` personnalisé), reprendre la liste de plages de `connectors/http.js`.

### B2. Réabonnement / abonnement par un tiers (haute, conformité)
`PERSON_SOURCES = {form, preference_center, signup, checkout}` (`consent.js:14`) : ces sources sont crues « la personne elle-même », sans preuve que la boîte est contrôlée. Le double opt-in n'existe que sur les formulaires qui l'activent (`forms/index.js:326`), et `createForm` le désactive par défaut.
Reproduction (réussie, script de session) : formulaire publié sans double opt-in ; `submitForm({email:"victime@exemple.fr"})` → abonné ; la victime se désinscrit (`unsubscribe`) → `unsubscribed` ; un tiers renvoie `submitForm({email:"victime@exemple.fr", ip:"9.9.9.9"})` → statut `subscribed`, `isSendable().ok === true`. La preuve enregistrée porte l'IP du tiers.
Même mécanisme à l'inscription LMS : `routes/auth.js:64` enregistre le consentement dès que `marketing_optin=on`, avant la confirmation de l'adresse (le lien de confirmation part ensuite, `sendSignupWelcomeEmail`). Un test existant entérine ce comportement (`marketing-pont-lms` : « un ancien désinscrit qui coche la case lui-même se réabonne »).
Impact : envois à une personne qui a retiré son accord ; mail-bombing par abonnements d'adresses tierces.
Correctif : exiger la confirmation par e-mail pour tout réabonnement d'une adresse `unsubscribed` et, de préférence, pour toute source publique (activer le double opt-in par défaut, y compris à l'inscription).

### B3. Authentification mobile `/api/mobile/login` (haute)
Trois défauts dans `api/mobile-auth.js` :
1. La clé « App Mobile » est révoquée (`revoked_at`) mais `mk_api_keys` a `UNIQUE (organization_id, name)` sur le nom sans condition de révocation (`migrations/012_cles_api.sql:16`) : `createApiKey` lève `duplicate` → le `catch` renvoie 500. Reproduction (réussie) : créer « App Mobile », la révoquer, recréer → `duplicate Une clé nommée « App Mobile » existe déjà.` La **deuxième connexion mobile de toute l'organisation échoue donc toujours**.
2. La révocation vise toutes les clés « App Mobile » de l'organisation, pas celles du compte (commentaire : « pour ce compte »). Si (1) était corrigé, chaque connexion déconnecterait les autres appareils/utilisateurs.
3. Le rôle dans l'organisation n'est pas lu (`membership.role` ignoré, lignes 52-58) : tout membre (même « viewer », ou rôle personnalisé sans `campaigns.send`) obtient une clé `write` d'organisation qui peut mettre en pause/annuler des campagnes et écrire des contacts/événements, alors que l'interface exige `campaigns.send` (admin) et `api_keys.manage` (admin).
Aucun test ne couvre cette route.
Correctif : nom de clé unique par compte (ex. « App Mobile #<userId> »), index unique partiel `WHERE revoked_at IS NULL`, contrôle `can(role, "api_keys.manage")`, portée `read` pour les rôles sans `campaigns.send`.

### B4. Un scénario ne se déclenche qu'une fois par contact (moyenne)
`INSERT OR IGNORE INTO mk_automation_runs` avec `UNIQUE (automation_id, contact_id)` (`engine.js:71-73`, migration 009:53) : toute nouvelle occurrence du déclencheur est ignorée (« déjà passé dans ce scénario »). Un scénario « Confirmation de commande » (transactionnel) ou « Panier abandonné » n'envoie donc rien pour la 2e commande d'un même client. De plus `mk_messages` est `UNIQUE (campaign_id, contact_id)` : même en contournant le passage, l'e-mail de la campagne système ne partirait qu'une fois.
Correctif : option de ré-entrée (nouveau passage par occurrence d'événement, clé d'idempotence `trigger_event_id`), et message unique par `(campagne, contact, passage)`.

### B5. Usurpation d'expéditeur par domaine non vérifié (moyenne)
`addDomain` (`domains/index.js`) enregistre n'importe quel domaine public sans preuve ; `siteIdentity` (`builder.js:67`) accepte l'adresse d'expéditeur d'un site dès que le domaine figure dans `mk_sending_domains`, quel que soit son statut (`pending` inclus). Reproduction (réussie) : `addDomain(ctx, "paypal.com")` (statut `pending`) puis réglage du site `from_address = service@paypal.com` → `From: KOLAKISA <service@paypal.com>`. Un fournisseur à vérification de domaine (Resend) refuserait, un relais SMTP permissif non. Requiert les droits `domains.manage` et `settings.write`.
Correctif : n'accepter que les domaines `verified`/`authenticated`.

### B6. « Transactionnel » = contournement du consentement (moyenne)
Pour `automation.kind === "transactional"`, seule la suppression (rebond/plainte/blocage) est vérifiée (`automations/actions/send.js:37-40`) ; ni statut, ni consentement, ni désinscription, et aucun lien de désinscription n'est ajouté (`builder.js:22,48-50`). Le type est un simple choix du modèle (`web/templates.js:115`) sans contrôle du contenu. Un message promotionnel étiqueté « transactionnel » part aux désinscrits. Réserver ce type aux événements de commande/accès (liste fermée de déclencheurs) et bloquer les liens/boutons promotionnels.

### B7. Suppression définitive sur tout 550/551/553 (moyenne)
`providers/smtp.js:7` classe 550/551/553 en `recipient_rejected` ; `dispatch.js:185-189` et `automations/actions/send.js` ajoutent alors l'adresse à `mk_suppressions` (motif `bounced`, non levable : `suppression.js:removeSuppression`). Or 550 couvre aussi « blocked by policy / spam / réputation IP ». Une panne de réputation peut supprimer à vie des adresses valides. Resend, lui, ne supprime que sur « Permanent » explicite (bon comportement). Correctif : analyser le code étendu (5.1.1 = utilisateur inconnu) ; sinon échec simple sans suppression.

### B8. Doubles envois possibles (moyenne)
- SMS : `sms/campaigns.js:352-356` réessaie après `temporary` (dont délai dépassé de 15 s, `twilio.js` : `catch` → `temporary`), sans clé d'idempotence côté Twilio ; si Twilio avait accepté, le SMS part deux fois (et est facturé deux fois).
- SMTP : même scénario (délai/coupure après acceptation). Resend est protégé par `Idempotency-Key`.
- E-mail de scénario : `sendEmailStep` n'a pas d'état « sending » (contrairement aux campagnes, `dispatch.js:claim`) ; un arrêt entre `provider.send` et la mise à jour `sent` laisse `pending` et renvoie au passage suivant. Le SMS de scénario, lui, marque bien `sending`/« interrompu ».
Correctif : état `sending` + « interrompu = échec signalé » pour l'e-mail de scénario ; pour SMS/SMTP, ne pas réessayer automatiquement un délai dépassé après envoi de la requête (ou réconcilier via `StatusCallback`).

### B9. Webhooks sortants : 4xx définitifs, y compris 408/429 (basse)
`delivery.js:84` : tout 4xx lève `UnrecoverableError`. Un destinataire qui limite le débit (429) ou expire (408) perd l'événement. Traiter 408, 425, 429 comme reprises.

### B10. Consentement SMS sans preuve de possession du numéro (basse)
`forms/index.js:296-301` et `sms/consent.js:recordSmsConsent` : le numéro saisi est enregistré tel quel (aussi en double opt-in e-mail, qui ne prouve pas le mobile). Un tiers peut inscrire le numéro de quelqu'un d'autre ; il reste le STOP, mais le premier SMS est déjà commercial. Ajouter un SMS de confirmation (code ou « OUI »).

### Autres constats (basse)
- `forms/antispam.js:8` : secret de repli codé en dur (`"kolakisa-formulaires"`) si ni `SESSION_SECRET` ni `ENCRYPTION_KEY` ne sont définis.
- Journal d'audit `webhook.created` conserve l'URL complète (`endpoints.js`), souvent porteuse d'un secret (Slack, Zapier).
- Les jetons de désinscription/suivi dérivent de `ENCRYPTION_KEY` : toute rotation invalide les anciens liens de désinscription et rend les secrets chiffrés illisibles ; aucune procédure de rotation.
- `sameOriginOnly` (`middlewares/security.js:38`) laisse passer les POST sans `Origin` ni `Referer` (aucun jeton CSRF) : pas propre au module, mais les POST d'administration marketing en dépendent.
- Quota IA non atomique (`ai/index.js:call`).
- Les plafonds d'envoi utilisent le jour UTC.

### Contrôles négatifs (rien trouvé)
- **XSS dans le rendu d'e-mail** : sondes réelles (prénom `"><script>…<img onerror>`, bouton `javascript:` ou avec guillemet, image `data:`, HTML riche avec `<iframe>`, `onclick`, `javascript:`) : variables échappées (`engine.js:233`), URL limitées à https/mailto sans guillemet (`blocks.js:urlNodes`), HTML riche assaini par `sanitize-html` (`blocks.js:269`). Aucune injection exécutable.
- **Injection d'en-têtes** : `stripControls` sur l'objet, `parseSender` refuse les caractères de contrôle.
- **Redirection ouverte** : la destination d'un clic vient de `mk_links` (https seulement).
- **Envoi à un désinscrit via une campagne** : la garde est revérifiée à chaque message et correspond exactement à la version SQL en masse (test d'invariant). Les seuls chemins d'envoi à un désinscrit trouvés sont B2 (réabonnement) et B6 (transactionnel).
- **Fuite entre sites/organisations** : aucune trouvée dans le code lu (dépôt à portée imposée, jetons signés portant l'organisation, clés de site figées, webhooks de site doublement filtrés).
- **Secrets dans les journaux** : clés Resend/Twilio jamais relayées (tests dédiés), `SendError` à messages génériques ; réserve : URL de webhook (voir ci-dessus).
- **SSRF ailleurs** : RSS correct ; connecteurs IA corrects ; réseaux sociaux = hôtes fixes (graph.facebook.com, api.linkedin.com) ; domaines = requêtes DNS uniquement.

---

## 4. Écarts priorisés

**P0 (à corriger avant toute mise en production d'envois réels)**
1. B2 : réabonnement/abonnement par un tiers (double opt-in par défaut et obligatoire pour toute adresse `unsubscribed`, y compris à l'inscription LMS).
2. B1 : SSRF des webhooks sortants (redirections, IP figée, plages privées complètes).
3. B3 : authentification mobile (500 à la 2e connexion, révocation globale, rôle ignoré).
4. B6 : garde-fous du type « transactionnel ».

**P1 (fonctionnel important)**
5. B4 : ré-entrée dans les scénarios (confirmations de commande récurrentes).
6. B5 : n'accepter comme expéditeur que les domaines vérifiés.
7. B7 : suppression sur 550 uniquement pour « utilisateur inconnu ».
8. B8 : double envoi (SMS/SMTP/scénario).
9. Mise en pause automatique d'une campagne au-delà des seuils rebond/plainte ; limitation par domaine destinataire ; échauffement d'IP.
10. Rétention/purge de `mk_message_events` et des travaux `dead` (RGPD).

**P2**
11. B10 : confirmation de numéro SMS.
12. Détection des ouvertures automatiques (MPP/proxys) : au minimum un indicateur « ouverture probablement automatique » (ouverture < quelques secondes après l'envoi, proxys connus) et mise en avant du taux de clic ; réconcilier les deux sources de chiffres (compteurs vs événements).
13. DKIM : vérifier le sélecteur réellement utilisé ; SPF : confronter à l'include du fournisseur.
14. B9 (408/429), rotation du secret des webhooks, API d'envoi transactionnel (si prévue).
15. Facturation / forfaits (inexistants) si l'offre multi-organisations est visée.

**P3**
16. Secret de repli de l'anti-robot, URL de webhook dans l'audit, rotation de `ENCRYPTION_KEY`, jour de plafond en UTC, tests dédiés de `mobile-auth` et du Studio IA.

---

## 5. Tests exécutés pour cet audit

Environnement très chargé pendant l'audit (charge machine > 100, d'autres exécutions concurrentes) : un des lancements (`marketing-conformite`) a été interrompu par le système (« Interrupted while running ») sans résultat exploitable et a été relancé.

Résultats : voir la section 6 (ajoutée en fin d'exécution).

Scripts de reproduction (jetables, dans le dossier temporaire de session, rien dans le dépôt) : SSRF par redirection (`ssrf.js`), 2e connexion mobile (`mob.js`), réabonnement par un tiers (`resub.js`), usurpation d'expéditeur (`spoof.js`), sondes XSS (`xss.js`).

---

## 6. Résultats des tests exécutés

Commande : `NODE_PATH=/Users/imac/ClaudeProjects/KOYEKOLA-deploy/node_modules TEST_START_TIMEOUT_MS=600000 node --test tests/<fichier>.test.js`.

| Fichier | Résultat |
|---|---|
| `tests/marketing-providers.test.js` | 20 / 20 réussis |
| `tests/marketing-campaigns.test.js` | 35 / 35 réussis |
| `tests/marketing-conformite.test.js` | 29 / 29 réussis (1re tentative interrompue par le système, 2e complète) |
| `tests/marketing-tracking.test.js` | 27 / 27 réussis |

Les autres fichiers cités dans les tableaux (`marketing-domaines`, `marketing-public`, `marketing-api-router`, `marketing-webhooks-*`, `marketing-sms`, `marketing-ia-redaction`, `marketing-pont-*`, `portee-api-webhooks-unitaire`, etc.) ont été lus (noms de tests cités) mais **leur exécution n'était pas terminée à la clôture du rapport** (machine saturée, charge > 300) : leur état « vérifié » repose sur la lecture des assertions, pas sur une exécution de cet audit. Aucun test existant ne couvre les bugs B1 à B10 : un test qui les couvrirait échouerait aujourd'hui.

### Mise à jour : exécution terminée

Tous les fichiers listés ci-dessus ont ensuite été exécutés : `marketing-domaines` 13/13, `marketing-public` 16/16, `marketing-api-router` 18/18, `marketing-webhooks-delivery` 37/37, `marketing-webhooks-endpoints` 16/16, `marketing-api-keys` 15/15, `marketing-sms` 47/47, `marketing-ia-redaction` 12/12, `marketing-pont-evenements` 18/18, `marketing-forms-data` 20/20, `marketing-forms-public` 8/8, `marketing-import` 30/30, `portee-api-webhooks-unitaire` 17/17.

Un échec : `marketing-file-evenements` 42/43, test « start/stop : une seule exécution à la fois, arrêt propre… » (`tests/marketing-file-evenements.test.js:335`, attendu 4, obtenu 1). Test fondé sur des délais, exécuté sous une charge machine > 300 : probablement instable sous charge, non confirmé comme défaut du worker (à relancer sur machine calme). La phrase ci-dessus « exécution non terminée » est donc caduque.

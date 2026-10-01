# Conformité et limites — module marketing

> Ce document décrit ce que **l'outil garantit techniquement** et ce qui **reste de votre responsabilité**.
> L'outil ne rend pas votre activité « conforme » à lui seul : RGPD, ePrivacy/LCEN, règles de votre pays, contenu des messages, base légale et information des personnes dépendent de vous (et, au besoin, d'un conseil juridique).

## Ce que l'outil garantit (chaque point est couvert par des tests)

| Garantie | Comment |
|---|---|
| Aucun envoi marketing sans consentement prouvé | Un contact n'est « abonné » que si une **preuve** existe : source, texte exact présenté, date, IP tronquée. `isSendable()` refuse sinon, et détecte les incohérences (statut « abonné » sans preuve) |
| Un import ne crée jamais de consentement par défaut | Les contacts importés restent « pas de consentement ». Un consentement « déclaré » exige une case cochée **et** un texte de preuve (10 caractères minimum) |
| Personne n'est réabonné par erreur | Import, API, synchronisation, saisie manuelle : impossible de réabonner un désinscrit. Seule la personne (formulaire, centre de préférences, inscription, commande) le peut |
| Rebonds et plaintes sont définitifs | Une adresse en liste de suppression n'est jamais jointe, même réimportée après effacement du contact. Seul un blocage **manuel** peut être levé, et la personne redevient « désinscrite » |
| Désinscription simple | Lien `/u/:token` sans compte ni connexion ; un `GET` ne fait rien (les antivirus et aperçus de liens ouvrent les URL) ; seul le `POST` désinscrit ; prise en charge du « un clic » des clients mail (RFC 8058) ; réponse identique pour tout jeton invalide |
| Préférences par catégorie | Centre `/preferences/:token` ; refuser une catégorie n'affecte pas les autres |
| Droit à l'effacement | Effacer un contact supprime ses propriétés, étiquettes, listes, préférences, preuves. Option pour garder l'adresse bloquée. Le journal d'audit ne contient jamais d'adresse e-mail |
| Minimisation | IP tronquée avant stockage (`203.0.113.0`, préfixe /48 en IPv6) ; adresse masquée sur les pages publiques ; fichier d'import vidé à la fin |
| Liens signés | HMAC-SHA256, clé dérivée de `ENCRYPTION_KEY`, type de jeton signé (un jeton de désinscription ne sert pas de jeton de préférences) ; les liens de désinscription n'expirent pas |
| Fuites limitées | Pages publiques : `Referrer-Policy: no-referrer`, `Cache-Control: no-store`, `noindex`, exclues de `robots.txt`, limitation de débit par IP |
| Formulaires d'inscription publics (jalon M5, §24) | La case de consentement est revérifiée **côté serveur** (pas seulement `required` en HTML) avant toute création de contact ; le texte présenté est enregistré comme preuve, avec l'identifiant du formulaire précis (`mk_consents.form_id`) ; champ piège + limite de débit (5/h/IP) contre les robots |

## À l'envoi (M3)
- La règle « joignable » est appliquée **deux fois** : au calcul de l'audience, puis **à chaque message au moment de partir**. Un contact désinscrit, bloqué ou dont le consentement est retiré entre-temps ne reçoit rien.
- Chaque message marketing porte un lien de désinscription signé et les en-têtes `List-Unsubscribe` / `List-Unsubscribe-Post` (un clic).
- Un rebond permanent ou une plainte remonté par le fournisseur alimente automatiquement la liste de suppression.
- Le lancement exige un droit d'administrateur, une confirmation par saisie du nombre de destinataires et une case de confirmation du consentement.
- Le fournisseur `console` (défaut) n'envoie rien.

## Ce qui reste de votre responsabilité
- Avoir une **base légale** et informer les personnes (politique de confidentialité, mentions légales).
- Le **texte** de la case d'inscription (`SIGNUP_CONSENT_TEXT`, dans `src/marketing/bridge/lms.js`) et la **preuve** saisie à l'import : ils doivent être véridiques.
- Le contenu des messages, l'identification de l'expéditeur et l'adresse postale si votre pays l'exige (jalon M2/M3).
- Les durées de conservation : l'outil ne supprime pas automatiquement les contacts inactifs.
- Les demandes d'accès et de portabilité (export) : non automatisées à ce stade.

## Limites connues (M1)
- L'envoi existe depuis M3 (voir `EMAIL_MARKETING_ENVOI.md`) ; la conformité était en place avant le premier envoi.
- **XLSX non pris en charge** : exporter en CSV depuis Excel (« Enregistrer sous »). Séparateur `,` `;` tabulation ou `|` détecté ; encodage UTF-8 ou Windows-1252 détecté.
- **Import > 5 000 lignes** : passe par le worker (`MARKETING_WORKER=on`). Limites : 10 Mo, 100 000 lignes, 60 colonnes.
- **Volumes** : SQLite tient ~100 000 contacts raisonnablement ; au-delà, PostgreSQL et un worker séparé (voir `EMAIL_MARKETING_ARCHITECTURE.md`).
- **Sans `ENCRYPTION_KEY`**, les pages publiques de désinscription répondent « indisponible » (503) plutôt que de valider n'importe quel lien : définissez-la avant tout envoi. Changer cette clé invalide tous les liens déjà envoyés.
- **Les noms d'utilisateur du LMS** servent de « prénom » aux comptes synchronisés (le LMS ne stocke pas de prénom) : modifiables dans la fiche contact.
- Un changement d'e-mail dans le LMS n'est pas encore répercuté sur le contact (jalon M4, pont LMS).
- La délivrabilité (arrivée en boîte de réception) ne peut être garantie par aucun outil ; les ouvertures mesurées sont peu fiables (protection de la vie privée d'Apple Mail).

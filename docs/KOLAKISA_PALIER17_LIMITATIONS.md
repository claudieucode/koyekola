# Palier 17 — limites et risques résiduels

**Kolakisa n'est ni certifié ni « entièrement sécurisé » : ce palier couvre les failles confirmées ci-dessous, sur la base d'une revue de code et de tests locaux.**

## Non corrigé (relevé à la lecture, non reproduit sauf mention)
1. `POST /pages/:id` : réglages (slug, déplacement, indexation) écrits avant le contrôle de révision du brouillon, sans transaction (409 laisse un état partiel). Publication sans numéro de révision. Composants : révision facultative.
2. `duplicateSite` ne remappe pas les `componentId` : la copie peut afficher des composants propres au site d'origine.
3. Noms de pages/composants uniques par organisation : message « porte déjà ce nom » = fuite d'existence entre sites.
4. Automatisation → `webhook_call` vers un webhook d'**organisation** (portée non vérifiée côté site).
5. `contacts/:id/effacer` par le site d'origine d'un contact lié à d'autres sites (supprime pour tous) : à trancher (décision D2).
6. Téléversements en mémoire : médiathèque 50 Mo × 20, formulaire public avant limitation de débit, paquet de site 464 Mo : risque de saturation mémoire.
7. Import « mettre à jour » : un brouillon d'article d'un autre site peut être écrasé (comptes d'équipe plafonnés à un site) ; `loadRun` contrôle `tools.import` sur le mauvais site.
8. Ping : rebond DNS possible (SSRF aveugle, HTTPS uniquement).
9. Invitation d'un e-mail déjà inscrit non vérifié : accès accordé au compte existant (squat d'adresse). Inscription sans limite ni vérification d'e-mail ; limitation de connexion par IP en mémoire seulement ; énumération par temps de réponse / message.
10. Un rôle d'administrateur de site peut activer un module sur son site (commentaire du code : « équipe seulement »). Modules désactivés : garde partielle (`lms` sans garde).
11. `trust proxy = 1` : `X-Forwarded-Host` lu par Express et accepté par `sameOriginOnly` ; CSRF sans en-tête Origin/Referer atténué par SameSite=Lax (pas de jeton CSRF). À valider avec l'hébergeur avant de durcir : un changement à l'aveugle peut casser la production.
12. Journalisation : réinitialisation de mot de passe, confirmation de changement d'e-mail, suppression de compte, connexions mobiles, usage des clés, articles (création/publication/suppression), restauration hors pages, redirections, taxonomies, modération, publication de l'apparence. Les opérations d'outils vont dans `audit_log`, table distincte de celle lue par « Journal d'activité ». Le journal n'est pas inviolable (SQLite modifiable par l'application).
13. Pas de magic bytes pour miniatures/blog/vidéos (type déclaré par le client) ; l'extension est imposée donc pas de HTML/SVG servi.

## Non testé
Production, DNS/HTTPS réels, concurrence réelle (opérations simultanées), charge, Firefox/Safari, rendu public d'un contenu hostile bout en bout (lu, jugé assaini), certificats/PDF (aucune génération trouvée), `reports.js`, widgets de landing, `forms.js`/`segments.js`/`social*.js`/`sms*.js`/`privacy*.js` (lecture partielle).

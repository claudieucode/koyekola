# Mailchimp — journal des modifications

## Ajouté
- **Migration `124_mailchimp.sql`** : huit tables additives — `mk_mc_audiences`, `mk_mc_members`, `mk_mc_campaigns` (miroirs en lecture et correspondances), `mk_mc_events` (webhooks reçus), `mk_mc_requests` (journal des appels sortants), `mk_mc_state` (état de la synchronisation), `mk_mc_template_html` (HTML des modèles créés depuis Kolakisa), `mk_mc_erased` (empreintes des personnes effacées). Retour arrière : `DROP TABLE` de ces huit tables.
- **Module `src/marketing/mailchimp/`** : `client.js` (HTTP, plafond de requêtes simultanées partagé par organisation, nouvelles tentatives, journal), `errors.js` (erreurs normalisées en français), `connection.js` (clé chiffrée, jeton de webhook), `catalog.js` (156 opérations de l'API Marketing v3), `operations.js` (validation et exécution), `composite.js` (import/export CSV, existence, rebonds, comparaison, aperçu de modèle, tableau de bord), `sync.js` (synchronisation Mailchimp ↔ Kolakisa), `inbound.js` (webhooks entrants), `scheduler.js` (synchronisation horaire), `transactional.js` (Mailchimp Transactional / Mandrill, 31 opérations).
- **Routes** : `src/marketing/web/mailchimp.js` (écran et API interne `/marketing/mailchimp/api/…`), route publique `POST/GET/HEAD /webhooks/mailchimp/:organisation/:jeton` dans `src/marketing/web/webhooks.js`.
- **Écran Marketing → Mailchimp** (menu Intégrations) : 14 onglets (Connexion, Vue d'ensemble, Audiences, Contacts, Campagnes avec assistant en 5 étapes, Modèles, Rapports, Webhooks, Automatisations, Boutiques, Pages, Compte, Transactionnel, Journal) — `views/marketing/mailchimp.ejs`, `public/js/mailchimp*.js`, `public/css/mailchimp.css`.
- **Permission** `mailchimp.manage` (administrateur) dans `src/marketing/organizations.js`.
- **Génération de la documentation** : `scripts/mailchimp-doc.js` → `docs/mailchimp/MAILCHIMP_DOC.md`.
- **Tests** : 10 fichiers (`mailchimp-client`, `-sync`, `-relecture`, `-routes`, `-navigateur`, `-navigateur-flux`, `-firefox`, `-contrat-ecran`, `-doc`) et le simulateur `tests/fake-mailchimp.js`.
- **Documents** : `docs/mailchimp/{AUDIT, MAILCHIMP_DOC, INTEGRATION_PLAN, TEST_RESULTS, README_MAILCHIMP, ENV_EXAMPLE, CHANGELOG}.md`.

## Modifié (existant)
- `server.js` : une ligne — limite de corps JSON portée à 2 Mo pour `/marketing/mailchimp/api` (import de 5 000 contacts, contenu HTML de campagne).
- `src/marketing/index.js` : démarrage du minuteur de synchronisation (désactivé en test sauf demande explicite).
- `src/marketing/audience/contacts.js` (`deleteContact` : anonymisation des événements Mailchimp, empreinte d'effacement) ; `server.js` (jeton de webhook masqué dans le journal d'erreurs) ; `src/marketing/web/index.js` (montage de la route), `nav.js` (entrée de menu), `routeScopes.js` (la route est classée « moteurs transverses »).
- `views/marketing/partials/top.ejs` et `bottom.ejs` : chargement du CSS et des scripts de l'écran (uniquement quand l'écran les demande).
- `.env.example` : variables facultatives documentées.
- Tests existants dont l'attendu change avec la nouvelle migration : `site-espace.test.js`, `palier12-migration-composants-revision.test.js`, `site-menu-p1a.test.js` (plafond de migration 123 → 124) et `fixtures/inventaire-tables-sites.json` (six tables classées « plateforme »).

## Non modifié
Le moteur d'e-mailing interne (campagnes, audiences, consentements, suppressions, automatisations), les connecteurs d'IA et l'envoi d'e-mails de Kolakisa : l'intégration s'y **ajoute** sans les remplacer.

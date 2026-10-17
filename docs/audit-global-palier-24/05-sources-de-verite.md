# Inventaire des sources de vérité et des doublons (palier 24)

Aucun doublon n'est fusionné ni supprimé par cet audit. Pour chaque responsabilité : le propriétaire des données, les lecteurs, et les systèmes parallèles constatés. Les noms de tables viennent d'une base de test jetable créée par le serveur (155 tables, `PRAGMA integrity_check` = ok, `foreign_key_check` = 0 ligne, mode WAL, 17 déclencheurs, 319 index).

## Moteurs centraux (propriétaires des données)

| Responsabilité | Propriétaire (source de vérité) | Lecteurs / consommateurs | Preuve |
|---|---|---|---|
| Identité des personnes à contacter | **Contact Core** (`src/marketing/contactcore`, table `mk_contacts`, unique par organisation) | Email, SMS, automatisations, commerce (lit les commandes, ne les copie pas), formulaires, commentaires, analytics | docs/cms-contacts.md ; cms-contacts-core |
| Comptes de connexion | Table `users` (LMS) + `mk_org_members` / `mk_site_members` / `mk_roles` | Droits calculés par `services/cmsAccess.js` | docs/cms-utilisateurs.md ; sonde 360 routes |
| Pages et rendu public | `mk_landing_pages` + moteur de pages commun (`/p/<adresse>`), Page Builder | Tunnels (références), A/B (copie B figée), SEO, sitemap | docs/cms-tunnel.md, cms-ab-testing.md |
| Articles | `posts` + éditeur Tiptap (`routes/blog.js`) | Blog public, taxonomies, commentaires, SEO | docs/cms-articles.md |
| Journal d'événements métier | **`mk_events`** (immuable, idempotent) | Automatisations, fiche contact, analytics | docs/cms-contacts.md |
| Commandes et paiements | `orders`, `order_items`, `checkout_sessions`, `order_refunds` (la boutique reste propriétaire) | Contact Core (événements), Analytics (lecture) | docs/cms-commerce.md |
| Consentements et suppressions | `mk_consents`, `mk_suppressions`, `mk_unsubscribes` (+ cookie `kw_consent` pour la mesure web) | Email, SMS, tracking | docs/cms-contacts.md |
| URL et redirections | `seo_redirects`, `cms_url_history`, `post_slug_history`, `course_slug_history` + `src/seo/resolver.js` | Pages, articles, menus | docs/cms-urls.md |
| Droits d'accès | `cmsAccess.effectivePermissions` | Toutes les routes `/marketing` | cms-users |
| Tâches de fond | `mk_jobs` (+ worker `MARKETING_WORKER=on`) ; `seo_jobs` (SEO_JOBS) | Envois, scénarios, pont boutique | server.js lignes 240-251 |

## Doublons et systèmes parallèles constatés (à gouverner, pas à supprimer)

| # | Doublon | Détail | Risque | Statut |
|---|---|---|---|---|
| D-01 | Deux journaux d'audit | `audit_log` (application) et `mk_audit_logs` (marketing) | Un évènement n'apparaît que dans l'un des deux | Documenté nulle part comme règle |
| D-02 | Deux stockages de médias | `media` (anciennes images du blog) et `mk_media` (médiathèque du CMS) | Image utilisée sans fiche, suppression incohérente | Voulu (compatibilité), à clore |
| D-03 | Sept tables de suivi | `mk_events`, `mk_web_events`, `mk_web_visitors`, `mk_landing_events`, `mk_message_events`, `mk_page_test_events`, `mk_sms_clicks` | Chiffres différents selon la table lue ; chacune a sa règle de consentement | Documenté (Analytics lit, ne stocke pas) |
| D-04 | Deux moteurs A/B | Tests de pages (`mk_page_tests`) et tests A/B de campagnes e-mail | Deux méthodes statistiques | Documenté, séparés |
| D-05 | Deux systèmes de styles de site | `appearance_configs` (site public principal) et `mk_sites.tokens` (sites du Page Builder) | Règle d'héritage double | Documenté |
| D-06 | Réglages dans huit stockages | `mk_settings`, `seo_settings`, `user_prefs`, `editor_prefs`, `dashboard_prefs`, `appearance_configs`, `mk_sites.settings`, variables d'environnement | Valeur contradictoire possible | Couche commune `services/settings` (palier 14) |
| D-07 | E-mails transactionnels et marketing séparés | `utils/mailer.js` + `mail_outbox` (confirmations, mots de passe, alertes) ; Email Engine + `mk_jobs` (campagnes, scénarios) | Deux files, deux comptes-rendus d'échec | Voulu (confirmation d'achat historique) |
| D-08 | Cinq éditeurs | Page Builder (pages), éditeur de document Tiptap (articles), éditeur de blocs e-mail, canevas d'automatisation, éditeur de formation | Interfaces et sauvegardes différentes | Voulu, documenté |
| D-09 | Deux en-têtes de site public | Menu/en-tête du moteur d'apparence et en-tête d'origine (repli) | Deux chemins de rendu | Voulu (« sans rien casser ») |
| D-10 | Deux consentements | Preuves `mk_consents` (e-mail/SMS) et cookie `kw_consent` (mesure web) | Un « oui » ne vaut pas pour l'autre | Voulu, à documenter dans le parcours |
| D-11 | Branche en double | `cms-roles` (palier 9) existe en copie parallèle non poussée, alors que le palier 9 est sur origin/main | Confusion de fusion | Connu (mémoire du projet) |

## Données à portée « organisation » (sans site)

`posts`, `taxonomy_terms`, `blog_comments`, `mk_media`, `mk_contacts`, `orders`, `order_items`, `courses` : pas de `site_id`. 23 tables sur 155 ont un `site_id` : `appearance_configs`, `appearance_patterns`, `appearance_revisions`, `cms_revisions`, `cms_tool_runs`, `cms_url_history`, `mk_automations`, `mk_campaigns`, `mk_conversions`, `mk_events`, `mk_funnels`, `mk_invitations`, `mk_landing_pages`, `mk_lists`, `mk_page_tests`, `mk_segments`, `mk_site_members`, `mk_templates`, `mk_web_components`, `mk_web_events`, `nav_locations`, `nav_menus`, `seo_redirects`. Trois tables `mk_*` n'ont ni `organization_id` ni `site_id` : `mk_organizations` (racine), `mk_page_test_events` (portée par le test), `mk_rss_seen`.

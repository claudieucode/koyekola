# Registre des anomalies (palier 23)

Chaque anomalie renvoie aux lignes de la matrice (`01-matrice-parite.md`). **Aucune anomalie P0 (critique) n'a été trouvée.** Une cause n'est dite « confirmée » que si je l'ai vérifiée dans le code ou par un test ; sinon c'est une « hypothèse ».

Rappel de gravité : P0 perte de données ou faille majeure · P1 fonction essentielle inutilisable ou risque important · P2 défaut notable, limite ou intégration incomplète · P3 amélioration, ergonomie, dette limitée.

---

## P1 — Élevée

### AN-01 — Seul le compte créateur peut écrire des articles
- **Matrice** : AR-02.
- **Description** : les rôles Administrateur, Éditeur, Auteur et Contributeur ne peuvent ni créer un article, ni ouvrir l'éditeur d'un article existant. L'éditeur d'articles (`/formateur/blog/…`) est réservé au compte formateur créateur. Les rôles « Auteur » et « Contributeur » sont décrits comme gérant « leurs propres articles », mais la permission `articles.edit_own` n'a aucun effet pratique.
- **Preuve** : sonde `sonde-complements.js` et sonde ciblée : pour chacun des 5 rôles, éditeur riche = 403 ; liste CMS = 200 ; « créer » par le CMS = refus (aucun article créé : le nombre d'articles reste à 1) ; Administrateur et Éditeur peuvent seulement publier un article existant. L'écran affiche : « La rédaction des articles se fait dans l'éditeur du blog, réservé au compte créateur ». Sortie : `audit-parite/resultats/sortie-complements.txt`.
- **Reproduction** : créer un compte, l'ajouter à l'équipe avec le rôle Éditeur ; ouvrir `/formateur/blog/nouveau` → 403 ; sur CMS → Articles, il n'y a pas de bouton « Nouvel article ».
- **Impact** : impossible de travailler à plusieurs sur le blog. Un CMS professionnel suppose plusieurs rédacteurs. Pas de perte de données ; le message est honnête (pas de faux succès).
- **Cause** : **confirmée par la documentation et le comportement** (choix assumé du palier 4, repris au palier 9 « l'éditeur d'articles reste réservé au compte créateur »). Le mécanisme exact dans le code (`loadPost` / garde du routeur du blog) n'a pas été relu ligne à ligne.
- **Dépendances** : Droits (palier 9), éditeur Tiptap, propriété des articles (`posts.author_id`).
- **Recommandation** : ouvrir l'éditeur aux rôles qui ont `articles.write` (tous les articles) ou `articles.edit_own` (les leurs), sans second éditeur.
- **Test de validation futur** : un Auteur crée et modifie son article, ne voit pas celui d'un autre, ne peut pas le publier ; un Contributeur idem ; test de non-régression des 403 sur les autres rôles.

---

## P2 — Moyenne

### AN-02 — Le multi-site s'arrête aux pages : articles, catégories, commentaires, médias sans site
- **Matrice** : AR-17, TX-07, MD-08, CM-09, NV-06.
- **Description** : `posts`, `taxonomy_terms`, `blog_comments` et `mk_media` n'ont pas de colonne `site_id` (confirmé). Les pages, redirections, réglages, outils, tests A/B, emails ont un site. Un deuxième site ne peut donc pas avoir son propre blog, ses catégories ni sa médiathèque.
- **Preuve** : sonde : `PRAGMA table_info` sur les 4 tables (`audit-parite/resultats/sortie-complements.txt`) ; `nav_menus.site_id` existe mais le palier 7 indique « non branché dans les pages ».
- **Impact** : limite fonctionnelle, pas une fuite : une personne limitée à un site n'accède pas à ces écrans (route-par-route : 360/360 refus).
- **Cause** : confirmée (choix documenté : « le blog est celui du site principal »).
- **Recommandation** : **décision humaine d'abord** (le multi-site doit-il couvrir le blog ?). Si oui : migration additive `site_id` + filtres + héritage.
- **Test futur** : deux sites, deux blogs, mêmes adresses autorisées ; une personne limitée au site A ne voit rien du site B.

### AN-03 — Pas de flux RSS du blog
- **Matrice** : AR-16. **Preuve** : 4 adresses (`/feed`, `/blog/feed`, `/rss.xml`, `/blog/rss.xml`) répondent 404 (`sortie-scenarios.txt`). Le dossier `src/marketing/rss` lit des flux entrants pour l'emailing.
- **Impact** : lecteurs de flux, agrégateurs et certains outils d'e-mail automatisé ne peuvent pas suivre le blog. **Cause** : confirmée (absent). **Reco** : flux Atom/RSS du blog et par catégorie. **Test** : flux valide, brouillons exclus, échappement.

### AN-04 — Pas de recherche globale du site, ni de recherche d'administration
- **Matrice** : AR-10, UX-05. **Preuve** : `/recherche?q=` → 404 ; `/blog?q=` fonctionne (articles seulement, en `noindex`) ; champ « Rechercher… » du CMS **désactivé** (« Disponible dans un prochain palier »).
- **Impact** : visiteurs et rédacteurs ne trouvent pas une page. **Cause** : confirmée. **Reco** : recherche pages + articles côté public ; brancher ou retirer le champ de l'administration. **Test** : une page et un article sont trouvés ; un brouillon ne l'est pas.

### AN-05 — Une page publiée n'est pas indexée par défaut
- **Matrice** : PG-15. **Preuve** : page publiée → `robots = noindex, nofollow`, absente du sitemap (sonde) ; `indexable DEFAULT 0` (migration 027, héritage « comme Mailchimp »).
- **Impact** : une personne qui publie « À propos » ou « Contact » croit que la page est visible sur Google alors qu'elle ne l'est pas. L'écran indique « (non indexée…) » dans le message de publication, ce qui limite l'effet. **Cause** : confirmée. **Reco** : défaut selon le type (page du site : indexée ; page d'atterrissage : non). **Test** : une page du site publiée est dans le sitemap et sans noindex.

### AN-06 — Pas de programmation de publication pour les pages
- **Matrice** : PG-14. **Preuve** : aucune colonne de programmation dans `mk_landing_pages` ; `promoteScheduled` ne traite que les articles. **Impact** : les lancements de pages doivent être faits à la main. **Cause** : confirmée. **Reco** : même mécanisme que les articles (promotion à la lecture).

### AN-07 — Le Page Builder n'a pas de copie locale de secours
- **Matrice** : PB-09. **Preuve** : `docs/cms-revisions.md` : « le Page Builder n'a pas de copie locale ». Le brouillon est enregistré sur le serveur (autosave) mais ce qui n'a pas encore été envoyé est perdu en cas de coupure ou de fermeture. **Cause** : confirmée par la documentation (non reproduite en coupant le réseau). **Reco** : copie locale + proposition de restauration. **Test futur** : couper le réseau pendant une modification, recharger, retrouver la copie.

### AN-08 — Sauvegardes : copie sur le même disque, fichiers médias non automatiques
- **Matrice** : TL-07. **Preuve** : `src/services/backups.js` : copie quotidienne de la base (14 gardées) sur le même disque ; téléchargement manuel base + fichiers ; pas de copie hors serveur automatique.
- **Impact** : une perte du disque ferait perdre site, base et médias (les sauvegardes de l'hébergeur n'ont **pas** été vérifiées : hors de ma portée). **Reco** : copie externe planifiée ; vérifier ce que l'hébergeur sauvegarde. **Test** : restauration complète sur un site de test.

### AN-09 — Pas de double authentification, connexions non journalisées
- **Matrice** : US-07, US-08, SC-12. **Preuve** : aucune trace de TOTP/2FA dans `src` et `views` ; `docs/cms-utilisateurs.md` : connexions non journalisées. Limiteur de tentatives présent (10 échecs / 15 min).
- **Impact** : sécurité des comptes d'équipe. **Reco** : journal de connexions, puis 2FA pour les administrateurs.

### AN-10 — Aucune API REST sur le contenu du CMS
- **Matrice** : EX-01. **Preuve** : `src/marketing/api/router.js` : contacts, événements, campagnes, listes, aperçu ; rien pour pages, articles, médias, menus. **Impact** : pas d'intégration externe ni d'application « headless » sur le contenu. **Reco** : décision de périmètre, puis ressources en lecture d'abord.

### AN-11 — Aucune variante d'image (miniatures, `srcset`, WebP)
- **Matrice** : MD-06, PF-03. **Preuve** : pas de bibliothèque d'image dans `package.json` ; `media/index.js` ne lit que les dimensions. **Impact** : images lourdes sur mobile, effet sur la vitesse et le SEO. **Reco** : variantes générées à l'envoi.

### AN-12 — Commentaires : pas de notification au modérateur ; pas d'effacement des données d'un invité
- **Matrice** : CM-05, CM-08. **Preuve** : `docs/cms-comments.md` (« préparé, non implémenté »). **Impact** : les commentaires attendent sans que personne ne soit prévenu ; demande d'effacement RGPD à traiter à la main. **Reco** : notification par le moteur d'e-mails ; effacement par adresse e-mail.

### AN-13 — Les événements du CMS ne déclenchent rien
- **Matrice** : KO-10. **Preuve** : `comment.*`, `term.*`, `menu.*` sont émis ; les documents indiquent que rien n'y est abonné. **Impact** : l'automatisation ne réagit pas aux contenus du CMS. **Reco** : brancher ceux qui ont un usage clair.

### AN-14 — Systèmes parallèles à surveiller
- **Matrice** : AP-06, KO-09, NV-08, PB-16. **Preuve** : documentation de chaque palier. Détails : apparence du site principal (`appearance_configs`) et des sites du Page Builder (`mk_sites.tokens`) ; deux éditeurs (pages / articles, assumé) ; en-tête d'origine codé en dur comme repli ; deux A/B (pages / e-mails) ; deux stockages d'images (anciennes miniatures du blog / médiathèque) ; commandes sans `site_id`.
- **Impact** : risque d'incohérence et de coût de maintenance ; aucune incohérence visible n'a été reproduite. **Reco** : un inventaire daté des doublons avec décision par doublon.

### AN-15 — Pas d'importation d'un site WordPress
- **Matrice** : TL-03. **Preuve** : l'importateur n'accepte que l'export KOLAKISA (JSON). **Reco** : à planifier seulement si la migration depuis WordPress est un objectif commercial.

### AN-16 — Le rôle « Lecteur » voit les contacts, les revenus et les abonnés SMS
- **Matrice** : US-06 (observation). **Preuve** : sonde matrice : un Lecteur obtient 200 sur `/contacts`, `/contacts/:id`, `/revenus`, `/analytics`, `/sms/abonnes`, `/formulaires`… alors que Auteur et Contributeur ont moins de droits que lui (23 et 26 écrans en 200 contre 55 pour le lecteur). Aucune écriture permise.
- **Impact** : confidentialité (données de personnes) : à décider, car un « lecteur » d'équipe marketing est parfois voulu. **Cause** : confirmée (conception : `VIEWER_KEYS`). **Reco** : décision humaine sur les droits de lecture sensibles (contacts, revenus).

### AN-17 — Numéros de migration : collision entre sessions
- **Preuve** : incident réel lors de la mise en ligne du palier 22 : une autre session a pris le numéro 067 en même temps ; le serveur refuse de démarrer quand deux migrations ont le même numéro ; le premier envoi (`9a03bda`) était donc cassé jusqu'à `65cbce7`. **Impact** : indisponibilité possible lors d'un envoi. **Cause** : confirmée. **Reco** : vérifier le dernier numéro juste avant l'envoi et lancer `tests/audit-corrections.test.js` après fusion.

---

## P3 — Faible

| ID | Description | Matrice | Preuve | Recommandation |
|---|---|---|---|---|
| AN-18 | Protection CSRF sans jeton : une requête sans `Origin` ni `Referer` est acceptée (le cookie SameSite=Lax limite le risque) | SC-07 | sonde : POST sans en-tête = 302 accepté ; Origin étranger = 403 | jeton sur les formulaires sensibles ; refuser l'absence d'en-tête pour un POST connecté |
| AN-19 | CSP limitée à `object-src`, `base-uri`, `frame-ancestors` (pas de `script-src`) | SC-08 | en-têtes de kolakisa.com | CSP stricte si les scripts en ligne le permettent |
| AN-20 | 1 vulnérabilité haute indirecte (`source-map-js`, déni de service par fichier de cartes source) | SC-11 | `npm audit --omit=dev` | `npm audit fix` puis tests |
| AN-21 | Pas d'archives par date | AR-08 | `/blog/archives` → 404 | à décider |
| AN-22 | Taxonomies personnalisées sans pages publiques | TX-06 | docs | planifier avec les types de contenu |
| AN-23 | Permaliens non configurables (volontaire) ; hiérarchie des pages non reflétée dans l'URL | UR-04, PG-13 | docs, vue | décision de produit |
| AN-24 | Page 404 par défaut générique (« Erreur · KOLAKISA ») | AP-04 | sonde | modèle 404 utile par défaut |
| AN-25 | Fenêtre de la médiathèque blanche dans l'éditeur en thème sombre (lisible : aucun texte sous 4,5:1) | MD-09 | sonde contraste + capture | adapter au thème sombre (esthétique) |
| AN-26 | Initiale d'avatar à 3,75:1 (blanc sur rose) | UX-04 | sonde contraste | assombrir |
| AN-27 | 1 à 8 petites cibles (< 24 px) par écran | UX-08 | sonde navigateur | agrandir |
| AN-28 | Commandes désactivées « Notifications » et « Aide » | UX-06 | sonde décoratif | brancher ou retirer |
| AN-29 | Export sans les fichiers médias ; journal d'activité vide sur site neuf | TL-01, TL-08 | sonde export | documenter / vérifier l'alimentation |
| AN-30 | Menus non versionnés ; corbeille sans purge automatique | RV-04, RV-05 | docs | à planifier |
| AN-31 | Revue SQL non exhaustive (182 gabarits avec fragment dynamique ; aucun ne reçoit directement une donnée de requête) | SC-06 | `git grep` | revue complète si audit externe |
| AN-32 | Tests Chrome instables sous charge : `editeur-structure-navigateur` (« Promise resolution is still pending… ») et `automatisations-palette-navigateur` échouent une fois puis passent seuls | (qualité des tests) | scan fichier par fichier ; deux relances réussies (25/25 et 15/15) | augmenter les délais ou isoler les tests Chrome lourds ; **cause = hypothèse** (lenteur de la machine chargée) |

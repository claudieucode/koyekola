# KOLAKISA CMS — Paramètres → Commentaires

Écran : **Paramètres → Commentaires** (`/marketing/site-web/parametres/commentaires`, ou dans le cadre d'un site). Réglages **propres à chaque site**.

## 1. Audit avant la mission

| Fonction | État | Constat |
|---|---|---|
| Moteur de commentaires (`services/comments.js`, table `blog_comments`) | **Opérationnel** | Statuts pending / approved / spam / trash, réponses, anti-robot (piège + jeton d'heure), limites de débit, empreinte d'adresse (HMAC, effacée à 90 jours), événements. **Conservé.** |
| Commentaires ouverts par défaut | Opérationnel, **principal seulement** | Valeur de départ des nouveaux articles ; l'article garde son choix (`posts.comments_enabled`). |
| Visiteurs sans compte | Opérationnel | `guests_allowed` (= « compte obligatoire » inversé). |
| Modération none / premier commentaire / tous | Opérationnel | Le « premier commentaire » reconnaissait un visiteur **par son e-mail seul**. |
| Nombre de liens | **Partiel** | Seuil fixe (3), sans réglage, seulement `http(s)://`. |
| Réponses imbriquées, profondeur | Partiel | De 1 à 5. |
| Pagination | **Partiel** | Fixe : 20 par page, plus anciens d'abord, première page. |
| Notification d'attente | Partiel | Globale, au plus un e-mail / 10 min, non désactivable. |
| Nom et e-mail obligatoires | Absent (toujours obligatoires) | |
| Fermeture automatique, cookie de consentement, listes de modération et de blocage, avatars, notification « publié » | **Absents** | |
| Réglages par site | **Absents** | Un seul jeu pour toute l'organisation. |
| Ping sortant | Existe ailleurs | **Paramètres → Écriture** (autre module : journal, 3 essais, anti-SSRF). Lié, non dupliqué. |
| Pings / rétroliens entrants, notation par étoiles | **N'existent pas** | Voir limites. |

## 2. Correspondance avec WordPress

| WordPress | KOLAKISA |
|---|---|
| Notifier les sites liés | Lien vers **Écriture** (déjà implémenté, par site). |
| Autoriser les pings entrants | **Non proposé** : Kolakisa ne reçoit ni pings ni rétroliens. Pas de contrôle inopérant. |
| Autoriser les commentaires sur les nouvelles publications | `enabled_default` — par site, jamais rétroactif. |
| Nom et e-mail obligatoires | `require_name_email` (visiteurs). |
| Un compte doit être connecté | `guests_allowed` décoché — refus **côté serveur**. |
| Fermer après N jours | `close_enabled` + `close_days` (1 à 3 650), N jours après la publication, **UTC côté serveur**. Les commentaires publiés restent visibles. |
| Case cookies | `cookie_consent` : la case apparaît ; le cookie `kw_commenter` (HttpOnly, SameSite=Lax, Secure en HTTPS, 180 jours) n'est écrit **que si elle est cochée** ; réglage inactif = jamais de cookie. |
| Commentaires imbriqués, niveaux | `replies_allowed`, `max_depth` de 1 à **10**. Sur mobile, l'indentation s'arrête à 4 niveaux. |
| Pagination, par page, page par défaut, ordre | `paginate`, `per_page` (1 à 100), `default_page` (première / dernière), `order` (anciens / récents). Pagination par commentaires de **premier niveau** ; les réponses suivent leur parent et ne sont pas comptées ; réponses toujours dans l'ordre chronologique. Sans pagination : 1 000 au plus. |
| M'envoyer un message : publié / en attente | `notify_published` (un e-mail par commentaire de visiteur publié) et `notify_pending` (au plus un e-mail / 10 min **par site**). File d'envoi existante : un échec est noté et réessayé. |
| « N'importe qui peut publier une note » | **Pas d'équivalent** : Kolakisa n'a pas de notation. Aucun réglage sans effet. |
| Approuver manuellement / auteur déjà approuvé | `moderation` : **publication immédiate / auteur sans commentaire approuvé / tout approuver**. « Tous » l'emporte. Un membre est reconnu par son compte ; un visiteur par **e-mail ET nom** (un e-mail seul ne prouve rien). |
| Liens avant modération | `max_links` (0 à 50) : plus de N liens → en attente. Comptent : `http(s)://`, `www.`, adresses encodées (`%68ttp…`). Jamais supprimé. |
| Modération de commentaires (liste) | `mod_keys` : un terme, e-mail, domaine ou IP par ligne → **en attente**. |
| Clés non autorisées | `block_keys` : même forme → **indésirable** (jamais publié, jamais supprimé, restaurable dans Commentaires → Indésirables). Stockage distinct ; le blocage l'emporte. |
| Avatars : afficher, classement, défaut | `show_avatars`, `avatar_rating` (G / PG / R / X), `avatar_default` (dix choix), `avatar_external`. |

### Règles de la liste de modération et de blocage
Comparaison sans casse ni accents, **à l'intérieur des mots** (« press » trouve « WordPress » : risque de faux positifs, à choisir avec soin). Champs : texte, nom, e-mail, **agent utilisateur** (non conservé), **adresse IP** (écrite en entier, comparée à celle de l'envoi ; seule son empreinte est stockée). Limites : 500 lignes, 200 caractères par ligne. Une personne qui modère n'est jamais retenue par ces règles.

Priorité (la plus sévère gagne) : piège anti-robot ou liste de blocage → indésirable ; sinon liste de modération → en attente ; « tous » → en attente ; « auteur sans commentaire approuvé » → en attente ; trop de liens → en attente ; sinon publié.

## 3. Avatars et confidentialité
- **Locaux (par défaut)** : personne mystère, vide, identicon, initiales, couleur — SVG dessinés par Kolakisa à partir d'une **empreinte HMAC** (jamais l'e-mail). Aucune donnée ne quitte le serveur.
- **Gravatar** (logo, Wavatar, MonsterID, rétro, RoboHash) : **désactivé par défaut**, réglage sensible avec confirmation. Activé, le **serveur** (jamais le navigateur du visiteur) envoie à gravatar.com une empreinte SHA-256 de l'e-mail ; l'image passe par `/avatar/g/<n° de commentaire>` (commentaire publié d'un contenu publié seulement), gardée 24 h en mémoire (bornée). Le classement maximal est transmis à Gravatar, seul à connaître la classification ; les avatars locaux sont tous « G ». Sans accord, un choix externe retombe sur la personne mystère. À mentionner dans votre politique de confidentialité.
- Une personne qui a téléversé sa photo l'affiche (son choix), sauf si les avatars sont désactivés.

## 4. Multi-site
- **Stockage** : site principal → `mk_settings` (`comments.settings`, comme avant) ; site → bloc `comments` de `mk_sites.settings`. Un site **sans réglages propres hérite du principal** (comportement d'avant) jusqu'à sa première modification, qui crée son propre bloc sans toucher au principal.
- Le site d'un commentaire est celui de son contenu (`mk_content_sites`) : réglages, listes de modération et de blocage, notifications et limites sont ceux de ce site. Un administrateur limité à un site ne peut pas modifier un autre.

## 5. Sécurité
Validation serveur de chaque valeur (plages, choix fermés, listes bornées) ; le moteur de réglages vérifie droits et site à chaque écriture ; réglage Gravatar sensible (`settings.sensitive`, confirmation) ; journal d'activité ; textes de listes stockés comme texte et échappés ; routes d'avatars publiques sans cookie ni donnée personnelle dans l'adresse ; aperçu d'avatars externes réservé aux personnes connectées (adresse de démonstration).

## 6. Limites connues
- Pas de réception de pings ni de rétroliens ; pas de notation par étoiles.
- Pas de champ « site Web » dans le formulaire de commentaire (donc pas d'URL à examiner).
- Les avatars Gravatar dépendent de la disponibilité de gravatar.com (repli automatique sur l'avatar local).
- La limite « un e-mail / 10 min » des commentaires en attente est gardée en mémoire du serveur (elle repart à zéro au redémarrage).
- L'illustration contextuelle optionnelle n'a pas été ajoutée : elle n'apportait pas de compréhension supplémentaire.

## 7. Fichiers
`src/services/comments.js` (réglages par site, règles, pagination, notifications) · `src/services/avatars.js`, `src/routes/avatars.js` · `src/services/settings/index.js` (définitions, type « liste ») · `src/marketing/pages/siteSettings.js` (bloc `comments`) · `src/services/urls.js` (`attachedSite` exporté) · `src/services/articles.js`, `src/marketing/web/articles.js` (défaut par site) · `src/routes/blog.js`, `views/blog/show.ejs`, `views/blog/_comment.ejs` · `views/marketing/partials/comments-fields.ejs`, `views/marketing/settings-group.ejs`, `src/marketing/web/settings.js` · `public/js/cms-commentaires.js`, `public/css/kola-pages.css`, `public/css/style.css` · test `tests/reglages-commentaires.test.js`.

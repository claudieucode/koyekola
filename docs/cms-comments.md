# KOLAKISA CMS — Palier 6 : moteur de commentaires

## Principe
Un seul système, réutilisé : la table existante `blog_comments` a été étendue (aucune ligne perdue, tous les anciens commentaires sont « approved »).
Un commentaire se rattache à un contenu générique : `content_type` + `content_id` (aujourd'hui `post` ; `registerContent()` ajoute pages, produits…).
`post_id` est conservé pour les articles (anciens lecteurs, suppression en cascade avec l'article).

## Modèle (`blog_comments`)
id · post_id · content_type · content_id · parent_id (réponses, relation réelle) · user_id (facultatif : membre) · author_name / author_email (invités) ·
ip_hash · body (texte brut) · status (`pending` | `approved` | `spam` | `trash`) · prev_status · approved_at · approved_by · deleted_at · metadata · created_at · updated_at.
Supprimer un commentaire fait remonter ses réponses d'un niveau (déclencheur SQL).

## Flux
Public : formulaire sur l'article → validation → anti-spam → création (`pending` ou `approved` selon les réglages) → modération → affichage.
Membre connecté : compte existant (aucun nouveau système d'utilisateurs). Invité : nom + e-mail (jamais affiché).
Un commentaire n'inscrit JAMAIS son auteur à une liste marketing (consentement distinct, futur Contact Core).

## Réglages (CMS → Paramètres → Commentaires, clé `comments.settings`)
ouverts par défaut sur les nouveaux articles · invités autorisés · modération (aucune / premier commentaire / tous) · réponses autorisées ·
profondeur maximale (1–5) · liens autorisés. Les commentaires de l'équipe (éditeur et plus) sont toujours publiés tout de suite.
Ouverture/fermeture par article : option « Autoriser les commentaires » de l'éditeur (`posts.comments_enabled`) ; fermer ne supprime rien (la section est masquée).

## Sécurité
Le texte est du texte brut, échappé à l'affichage ; seules les adresses http(s) deviennent des liens (`rel="nofollow ugc noopener"`) ; `javascript:`/`data:` ne sont jamais des liens.
Anti-spam : piège à robots (champ caché), jeton d'heure d'affichage signé (celui des formulaires publics : un envoi en moins de 2 s ou sans jeton est classé indésirable),
limite de débit (membres : 6 / 10 min ; invités : 3 / 10 min et 1 / 5 s par adresse), détection des doublons, 3 liens ou plus = relu.
Adresse IP : jamais en clair, seulement une empreinte HMAC non réversible (`ip_hash`), sert à limiter les abus, effacée après 90 jours, aucun écran ne l'affiche.
E-mail d'un invité : visible seulement avec le droit `comments.email` (administrateur).

## Droits
`comments.read` (lecteur) voir · `comments.moderate` (éditeur) approuver / indésirable / corbeille / restaurer / répondre · `comments.delete` (administrateur) suppression définitive (depuis la corbeille) ·
`comments.email` (administrateur) e-mails des invités · réglages : `settings.read` / `settings.write`. Être auteur d'un article ne donne aucun droit de modération.

## Administration
`/marketing/site-web/commentaires` (Tous = tout sauf corbeille) · `/en-attente` · `/approuves` · `/indesirables` · `/corbeille`.
Recherche (texte, auteur, contenu, e-mail si autorisé), filtres (contenu, auteur, période), tri, pagination de 30, actions groupées et par ligne, réponse d'un modérateur.
Depuis la liste des articles : compteur réel et lien vers les commentaires de l'article.

## Événements (points d'accroche futurs)
`events` de `src/services/comments.js` : comment.created · comment.pending · comment.approved · comment.spam · comment.deleted (corbeille) · comment.restored · comment.replied · comment.purged.
Rien n'y est branché dans ce palier (Contact Core, Emailing, Automation, Analytics s'y abonneront).

## Préparé, non implémenté
Statut « rejeté » distinct · blocage d'un auteur (user_id / empreinte) · mots et domaines interdits · e-mails de notification · images dans les commentaires (désactivées) ·
commentaires sur les pages/produits (le registre est prêt) · multi-site (l'isolation viendra avec le contenu : les commentaires suivent leur contenu) · export/effacement des commentaires d'un invité par e-mail.

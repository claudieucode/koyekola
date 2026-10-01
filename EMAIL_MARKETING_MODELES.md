# Modèles d'e-mails — guide et limites (jalon M2)

Un modèle est une liste de **blocs** (titre, texte, image, bouton, séparateur, espace, deux colonnes), plus un objet, un préheader, un thème (couleurs, police) et une phrase de pied de page. Le HTML n'est jamais saisi ni stocké : il est produit à partir des blocs.

## Variables et filtres
`{{ contact.first_name }}` · `{{ contact.first_name | default:"cher(e) membre" }}` · `{{ contact.props.niveau | upper }}`

| Variable | Contenu |
|---|---|
| `contact.first_name`, `last_name`, `full_name`, `email`, `company`, `country`, `language`, `phone` | Champs du contact (vides si non renseignés) |
| `contact.props.<clé>` | Propriétés personnalisées de l'organisation |
| `org.name`, `org.address` | Nom et adresse postale de l'organisation (adresse : page Modèles) |
| `unsubscribe_url`, `preferences_url`, `view_url` | Liens système (fournis à l'envoi ; désinscription et préférences déjà présents dans le pied de page) |

Filtres : `default:"…"`, `upper`, `lower`, `capitalize`, `title`, `trim`, `truncate:N`, `number`, `date` (4 au plus par variable). Toute variable hors de cette liste est **refusée à l'enregistrement**, avec le numéro du bloc.

## Conditions
`{% if contact.country == "FR" %} … {% elif … %} … {% else %} … {% endif %}` avec `==`, `!=`, `contains`, `and`, `or`, `not` (5 niveaux d'imbrication au plus).
- **Dans l'objet, le préheader, le pied de page et les titres** : conditions directes.
- **Sur un bloc entier** : champ « Condition d'affichage » (ex. `contact.country == "FR"`).
- **Dans un texte Markdown** : interdites (voir « Pourquoi »).

## Texte (Markdown sûr)
`**gras**`, `*italique*`, `[lien](https://…)`, `## Titre`, `- liste`, `1. liste numérotée`, `> citation`. Le HTML brut, les images Markdown et les liens `http:`, `javascript:`, `data:` ou relatifs ne sont **pas** rendus actifs.

## Garanties (couvertes par des tests)
- **Aucune exécution de code** : grammaire écrite à la main, sans `eval` ; seules les propriétés propres du contexte sont lues (`constructor`, `__proto__`… inaccessibles) ; taille du gabarit, nombre de balises, profondeur et taille de sortie bornés ; entrées pathologiques traitées en moins de 500 ms.
- **Une valeur n'est jamais réinterprétée** : un contact nommé `{{ contact.email }}`, `<script>` ou `[Cliquez](https://evil)` s'affiche tel quel, échappé. Les variables sont insérées **après** la mise en forme Markdown.
- **Pas d'injection d'en-tête** : retours à la ligne et caractères de contrôle retirés de l'objet.
- **Pas de variable dans l'adresse d'un lien** (seuls les 3 liens système sont permis) : pas de redirection ni d'hameçonnage par donnée de contact.
- **Couleurs validées** (`#rrggbb`), liens `https:` uniquement, texte alternatif obligatoire pour les images : pas d'injection CSS.
- **Pied de page automatique et non supprimable** pour un e-mail marketing : lien « Se désinscrire », préférences, adresse postale.
- **Concurrence** : enregistrer à partir d'une version périmée est refusé (aucun écrasement silencieux) ; les 20 dernières versions sont conservées et restaurables.
- **E-mail de test** : uniquement vers un membre de l'équipe, objet `[TEST]`, liens factices, 10 par heure et par utilisateur.

## Pourquoi pas de condition dans un texte Markdown ?
L'ordre sûr est « Markdown d'abord, valeurs ensuite ». Une condition au milieu d'un paragraphe obligerait à mélanger les deux et rouvrirait la porte aux injections. La condition d'affichage d'un bloc couvre les vrais besoins (« ce paragraphe seulement pour la France »).

## Limites connues
- **Le rendu réel dans Outlook, Gmail et Apple Mail n'est pas testé ici** (aucun de ces clients n'est disponible) : la structure est prudente (tableaux, styles en ligne, 600 px), mais **envoyez-vous toujours un e-mail de test** et ouvrez-le dans vos clients réels avant une campagne. Le mode sombre des clients peut modifier les couleurs.
- Les contrôles qualité (objet trop long, mots en majuscules, variables sans valeur par défaut, image seule, poids proche de 102 Ko…) sont des **conseils**, pas une garantie d'arriver en boîte de réception.
- **Pas d'envoi de campagne** : l'e-mail de test passe par le SMTP existant (`SMTP_*`) ; les fournisseurs d'envoi, les campagnes et le suivi arrivent au jalon M3.
- Pas de téléversement d'images : une image est référencée par son adresse `https://` (à héberger vous-même).
- Pas de glisser-déposer tactile : sur mobile, utilisez les boutons ↑ ↓.

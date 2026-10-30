# KOLAKISA — Programme 21.8 : limites et reste à faire

## Statut : VALIDÉ AVEC RÉSERVES
Le parcours complet (brief → plan → pages → design → contenus → images → aperçu → publication) fonctionne de bout en bout sur un vrai serveur et dans Chrome, avec des fournisseurs **simulés**. Les réserves ci-dessous sont réelles.

## Qualité IA non démontrée
1. **Aucun vrai modèle n'a été évalué** : analyse du brief, plan, textes, directions artistiques, images. Les tests prouvent le traitement, pas la pertinence. Un essai réel borné (clé, budget) reste à faire pour chaque moteur.
2. **Images** : seul le fournisseur « démonstration » (images de substitution) est utilisable ; le fournisseur réel écrit pour OpenAI n'a jamais été appelé en réel (21.7).
3. **AI Core (21.2) non branché** : les moteurs utilisent encore `ai.call` (Anthropic seul). Deux comptabilités de consommation coexistent.

## Fonctions de la spécification absentes ou partielles
| # | Fonction | État |
|---|---|---|
| L1 | Assistant « intelligent » | **À règles** (sans IA) : quelques demandes françaises ; pas de reformulation, pas de couleurs, pas d'images par la conversation |
| L2 | Modifier le brief après analyse | Absent : seules les réponses aux questions le sont ; sinon nouveau projet |
| L3 | Ton éditorial, variantes comparées, changement de langue | Disponibles dans le moteur 21.6, **sans écran** dans l'interface (la révision par opération existe) |
| L4 | Modifier les couleurs / polices par champ | Non : choisir une direction, puis ajuster dans le **personnalisateur natif** (lien) |
| L5 | Historique des versions du plan avec comparaison | Historique des actions seulement ; annulation sur 30 niveaux |
| L6 | Verrouillage d'éléments | Verrouillage de champs de texte (21.6) ; pas de verrou de page/section du plan (les éléments créés par l'utilisateur sont marqués « ajoutée par vous ») |
| L7 | Vérifier les liens et la cohérence visuelle | Seuls les boutons sans adresse et les contrôles natifs de préparation sont vérifiés ; liens externes et cohérence visuelle non vérifiés |
| L8 | Publication complète du site | Publie les **pages générées** ; le brouillon du personnalisateur, le menu et le domaine sont publiés/configurés à part (la liste de contrôle le signale) |
| L9 | Images : accepter/refuser, mais pas de recadrage ni de fond de section ni de produit | Limites du 21.7 |
| L10 | Annulation des requêtes devenues inutiles, virtualisation | Non faites (volumes bornés par les moteurs) ; **performance non mesurée** avec des dizaines de pages |
| L11 | Une génération à la fois par site | Non verrouillé : deux onglets peuvent lancer deux générations |
| L12 | Accès d'un membre limité à un site | Par `?site=<id>` ; **aucune entrée de menu** ne l'y conduit (le lien existe dans l'assistant de création de site, réservé à l'équipe) |
| L13 | Accessibilité | Clavier, focus, rôles testés ; **pas de lecteur d'écran réel**, contrastes non mesurés, Chrome seul (ni Firefox ni Safari) |
| L14 | Journal d'audit propre à l'interface | Absent (les moteurs journalisent les leurs) |

## Dette
- `tests/palier12-…`, `site-espace`, `site-menu-p1a` : plafonds de migration passés à 120 (conséquence de la migration 120).
- **Aucun script lint / typecheck / build** n'existe dans ce dépôt pour le code modifié (seuls `build:editor` et `build:automation-flow`, non concernés) : vérification de syntaxe par `node --check` et exécution des tests.
- Suite complète `npm test` (654+ fichiers) **non exécutée**.

## Pour le palier suivant
Brancher l'assistant sur l'AI Core ; essai réel borné par moteur ; écran du ton éditorial et des variantes ; verrou « une génération à la fois » ; lien de menu pour les accès limités ; comparaison de versions du plan.

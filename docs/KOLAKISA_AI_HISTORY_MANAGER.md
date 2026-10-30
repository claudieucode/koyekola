# History Manager

`src/regen/history.js`, table `mk_regen_ops`.

## Enregistré pour chaque opération
Identifiant, site, utilisateur, **acteur** (`ai` pour les propositions issues d'une demande, `human` pour restaurations, annulations, rétablissements), type, **demande initiale**, intention, périmètre, cible (page, section, élément, champ, éléments touchés), plan (pourquoi, impact), **changements** (chemin, avant, après — valeurs bornées à 500 caractères), statut (`proposed`, `applied`, `rejected`, `undone`, `failed`, `superseded`), opération parente, nombre d'appels IA, fournisseur/modèle, coût (`none` | `unknown` | `estimated`), base de conflit, réversibilité, dates, snapshots avant/après.

**Jamais** de clé API ni de réponse brute d'un fournisseur ; le texte de la demande est celui de la personne.

## Principes
- Une restauration, une annulation, un rétablissement sont de **nouvelles** opérations (`parent_id`) : rien n'est réécrit ni supprimé.
- Liste paginée (25 par défaut, 100 au plus), filtrable par page, section, acteur, statut, type.
- Consommation : appels IA et coût estimé **seulement s'il est connu** ; `ai.call` ne communique pas le coût : il est « non communiqué » et la note précise que ce n'est pas un coût réel.

## Limites
Le journal est celui de CE moteur : les opérations faites directement dans l'éditeur, le Content Generator ou le Page Generator hors de ce moteur restent dans leurs historiques propres (et dans l'historique natif des révisions pour les pages) ; elles apparaissent ici comme des « modifications non suivies » détectées par les conflits.

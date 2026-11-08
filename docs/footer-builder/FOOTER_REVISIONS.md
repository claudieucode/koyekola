# Pied de page : révisions, historique et retour au modèle d'origine (chantier E)

## Ce qui est gardé
Une **révision** est une copie du contenu de travail d'un pied de page. Elle est créée :
- à chaque **enregistrement du brouillon** dans l'éditeur (type « Brouillon ») ;
- à chaque **publication** (type « Publication ») ;
- automatiquement **avant** une restauration ou un retour au modèle d'origine, si le brouillon actuel n'est pas déjà dans l'historique (type « Sécurité ») ;
- à la fin d'une restauration ou d'un retour (type « Restauration »).

Règles : un contenu identique à la dernière révision n'ajoute rien ; deux enregistrements du même auteur à moins de 60 secondes sont fusionnés (l'enregistrement automatique ne remplit pas l'historique) ; **50 révisions au plus par pied**, les plus anciennes partent, **la dernière publication est toujours conservée**. Les autres types de modèles (en-tête, page, etc.) ne sont pas touchés. Les versions publiées existantes (« Versions », 30 gardées) continuent de fonctionner comme avant.

## Ce que fait l'écran (menu d'un pied › « Historique des révisions »)
Liste (date, auteur, type, nombre d'éléments, résumé), « Voir les plus anciennes » (liste paginée, jamais le document entier), **Aperçu** (aperçu filaire + éléments par type), **Restaurer en brouillon** (confirmation), **Comparer** deux révisions cochées (éléments ajoutés / retirés / modifiés). Restaurer ne publie jamais : la version en ligne ne change qu'à la prochaine publication explicite.

## Revenir au modèle d'origine
Un pied installé depuis la bibliothèque mémorise sa clé d'origine (colonne `origin_key`). Menu › « Revenir au modèle initial » : confirmation claire, révision de sécurité, brouillon recréé depuis le catalogue, rien n'est publié, annulable depuis l'historique. Les pieds créés avant ce chantier ou autrement (vide, import, duplication) n'ont pas de modèle d'origine connu : le bouton n'apparaît pas.

## Protection contre la perte
- Supprimer : il faut d'abord **archiver** (l'archive sert de corbeille : « Restaurer » la ramène en brouillon, sans limite de durée). La suppression définitive demande le droit de suppression, affiche les conditions d'affichage dans la confirmation, et **garde le document (composant) et son historique**.
- Archiver un pied publié demande confirmation en rappelant où il s'affiche.
- « Non enregistré » : l'éditeur de composants et le Theme Builder avertissent déjà à la fermeture (tests de présence dans `footer-revisions.test.js`).

## Technique
- Migration `141_pied_revisions.sql` (additive) : table `mk_tb_revisions` (sans lien forcé vers le modèle, pour survivre à sa suppression), colonne `mk_tb_templates.origin_key`.
- `src/themeBuilder/revisions.js` (logique), `src/marketing/web/footerRevisions.js` (routes `/modeles/:id/revisions…`), accroches dans `saveComponentDraft` (pages/index.js) et `store.publish`. Une panne de l'historique ne bloque jamais un enregistrement ni une publication.
- Droits : lecture = `forms.read`, restauration / retour = `forms.write`. Tout passe par `store.get` (site, organisation, accès limité à un site).

## Limites connues
- Pas de purge automatique des révisions d'un pied dont le modèle est supprimé définitivement (elles restent liées au document).
- Pas de récupération d'un modèle supprimé définitivement en un clic (le document reste dans les composants).
- La comparaison compte les éléments, sans détailler quelle propriété a changé.
- Seuls les pieds installés après ce chantier peuvent revenir au modèle d'origine.

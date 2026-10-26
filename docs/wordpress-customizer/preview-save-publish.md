# Aperçu, sauvegarde, publication

## Customizer classique
- **Aperçu** : cadre sur le vrai site, avec les valeurs non publiées. [Doc]
- **Transports** : `refresh` (défaut : l'aperçu se recharge via Ajax, plus lent) ; `postMessage` (un script JS de l'aperçu met à jour le DOM directement, sans serveur ; convient aux changements simples — texte, classe de `body` — mais **duplique** la logique de rendu côté JS). [Doc]
- **Selective Refresh** (4.5+) : le serveur renvoie le HTML des seules zones concernées, avec le **même code PHP** que le site (aperçu fidèle, pas de duplication) ; `add_partial` avec `settings`, `selector`, `container_inclusive`, `render_callback`, `fallback_refresh` ; événements JS (`partial-content-rendered`, `widget-updated`…) ; raccourcis d'édition (crayon) 4.7+. Recommandé par défaut. [Doc]
- **Validation côté client** : `setting.validate` ; notifications (`error`, `warning`, `info`) ; la validation **serveur reste obligatoire**. [Doc]
- **Brouillon / planification / lien de partage / changesets** : le Customizer enregistre les changements non publiés comme « jeu de modifications » (changeset), permet d'enregistrer un brouillon, de planifier, de partager un lien d'aperçu. [Connu — non relu dans les pages officielles consultées ; à vérifier avant de s'en inspirer]
- **Perte de modifications** : avertissement à la fermeture avec changements non enregistrés. [Connu]
- **Publication** : bouton Publier ; les réglages sont écrits (`theme_mod` ou option) après sanitisation. [Doc pour le principe]

## Éditeur de site
- **Aperçu** : l'éditeur est lui-même le rendu ; menu Aperçu, redimensionnement, styles responsifs par fenêtre (7.x). [Doc]
- **Enregistrer** : liste des entités modifiées (modèles, parties, compositions, menus) avec choix de ce qu'on enregistre ; avertit de la portée (partout où l'élément est utilisé). [Doc]
- **Annuler/rétablir** pendant la session ; **révisions de styles**, **réinitialisation** (styles, modèle). [Doc]
- **Exporter** : zip du thème avec modèles, parties et styles modifiés. [Doc]
- **Quitter** avec modifications non enregistrées : l'éditeur demande d'enregistrer ou revoir. [Doc]

## Enseignements retenus pour Kolakisa [Déduit]
1. L'aperçu doit utiliser le **moteur de rendu réel** (leçon de Selective Refresh).
2. Une mise à jour CSS seule peut se faire sans recharger ; un changement de contenu recharge (déjà le cas dans Kolakisa).
3. Dire clairement la **portée** d'un enregistrement (une page ou tout le site).
4. Distinguer modifications de l'utilisateur et valeurs du thème, avec réinitialisation par réglage.

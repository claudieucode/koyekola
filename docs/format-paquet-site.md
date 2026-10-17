# Paquet de sauvegarde d'un site : `kolakisa-site-bundle@1`

Un paquet contient **un seul site** : son contenu (export `kolakisa-site@1` des types de portée site : réglages, paramètres, pages, menus, redirections) et les **fichiers médias** qui lui appartiennent ou que ce contenu utilise. Extension conseillée : `.kksite`. Aucun ZIP, aucun secret, aucun compte.

## Disposition binaire

| Partie | Taille | Contenu |
|---|---|---|
| Signature | 8 octets | `KKSITE1\n` (ASCII) |
| Longueur du manifeste | 4 octets | entier non signé, grand-boutiste (≤ 24 Mo) |
| Manifeste | N octets | JSON UTF-8 |
| Fichiers | somme des tailles | octets des fichiers, bout à bout, dans l'ordre de `manifest.files` |

## Manifeste

```json
{
  "format": "kolakisa-site-bundle@1",
  "createdAt": "2026-10-16T12:00:00.000Z",
  "generator": "KOLAKISA CMS",
  "source": { "siteId": 3, "siteName": "Alpha" },
  "dataSha256": "<SHA-256 hexadécimal de JSON.stringify(data)>",
  "data": { "format": "kolakisa-site@1", "...": "export du contenu (format existant, réimportable seul)" },
  "files": [
    { "id": "f1", "path": "/uploads/marketing/1/site-3/…png", "name": "logo.png", "mime": "image/png", "kind": "image", "type": "image",
      "size": 1234, "sha256": "<hex>", "offset": 0, "length": 1234, "width": 10, "height": 10, "alt": "", "title": "", "caption": "", "description": "", "reach": "site" }
  ],
  "missing": ["chemins dont la fiche existait mais dont le fichier était introuvable à l'export"]
}
```

`offset` est relatif au début de la partie « Fichiers » ; les fichiers sont contigus (`offset` du premier = 0, chacun commence où le précédent finit) et `length` = `size`.

## Validation (faite avant toute écriture, à l'analyse et de nouveau à la restauration)

Refus, sans aucune modification, si : signature ou format inconnu ; manifeste absent, trop gros, tronqué ou illisible ; `dataSha256` différent ; somme de contrôle du format d'export différente ; plus de 500 fichiers ; identifiant de fichier invalide ou en double ; `path` d'origine hors de `/uploads/marketing/<organisation>/[site-<id>/]<nom>` (donc tout `..`, tout chemin absolu ailleurs) ; deux fichiers de même chemin d'origine ; position/taille incohérente ; fichier tronqué ; octets en trop après le dernier fichier ; SHA-256 d'un fichier différent ; type réel (lu dans les octets) inconnu, différent du type annoncé, ou au-delà de la taille maximale de son type ; contenu référençant un chemin `/uploads/…` dangereux. Les références à des fichiers absents du paquet sont signalées (avertissement), pas bloquantes.

## Restauration (dans un site existant, choisi par la personne)

1. Validation complète puis analyse à blanc du contenu (aucune écriture).
2. Pour chaque fichier : **réutilisation** si un fichier identique (mêmes octets) est déjà visible pour ce site (commun ou propre au site) ; sinon création dans `/uploads/marketing/<organisation>/site-<site cible>/` (adresse d'origine conservée seulement si elle est libre et déjà dans ce dossier, sinon nom neuf fabriqué par le serveur). Les chemins du paquet ne servent **jamais** de chemin sur le disque. Création exclusive (jamais d'écrasement).
3. Les références du contenu sont remappées en un seul passage, puis le contenu est appliqué par le moteur d'import existant (pages en brouillon). Stratégies admises : ignorer, créer des copies, tout arrêter (pas « mettre à jour »).
4. En cas d'échec : le contenu créé est retiré (corbeille ou suppression selon le type), les réglages du site cible sont rétablis, les fichiers et fiches créés par la restauration sont supprimés.

Les fichiers restaurés appartiennent au site cible (`reach = 'site'`). Aucune donnée d'un autre site n'est modifiée ; une page ou une redirection d'un autre site portant la même adresse est ignorée, jamais modifiée.

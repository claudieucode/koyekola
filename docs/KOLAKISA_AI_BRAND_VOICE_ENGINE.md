# Brand Voice Engine

## Modèle (`voice.js`)
| Réglage | Valeurs |
|---|---|
| `orientations` (1 à 3) | professionnel, corporate, premium, élégant, commercial, convaincant, amical, accessible, institutionnel, éducatif, technique, créatif, minimaliste, éditorial (14) |
| `formality` | très formel · formel · neutre · décontracté |
| `sentences` | courtes (10-15 mots) · moyennes · longues |
| `vocabulary` | simple · professionnel · expert |
| `argumentation` | directe · persuasive · émotionnelle · factuelle · premium · éducative · orientée conversion |
| `address` | vous · tu · nous/impersonnel |
| `personality` | texte libre ≤ 200 caractères (assaini, sans balises) |
| `sectorTerms`, `avoid` | jusqu'à 20 mots chacun, ≤ 40 caractères |

Toute valeur hors liste revient à la valeur de base ; rien n'est interprété comme instruction autre qu'un réglage.

## Portées
- **Site** : `mk_content_voice` (une ligne par site, isolée) — `POST /contenus/voix`.
- **Page** : `voiceOverride` à la génération ; seuls les champs fournis changent (`voice.effective`). La voix effective est mémorisée dans l'ensemble généré, donc les révisions ultérieures gardent la voix du moment.

## Application
`voice.toPrompt` convertit la voix en consignes (registre, adresse, style, vocabulaire du secteur, mots à éviter). La voix ne contient jamais de fait sur l'entreprise.

## Contrôles a posteriori (`validate`)
- mot de la liste `avoid` présent → *important*, **certain** ;
- tutoiement/vouvoiement contraire à la voix (français) → *important*, **probable** ;
- phrase nettement plus longue que le réglage → *suggestion*, probable.

## Limites
La cohérence stylistique réelle d'un modèle n'est pas mesurable ici : les contrôles ci-dessus sont des garde-fous mécaniques. Le tutoiement/vouvoiement n'est contrôlé qu'en français.

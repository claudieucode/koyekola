# Régénération sélective et périmètre minimal

## Planificateur (`planScope`)
Choisit l'exécuteur le plus étroit possible à partir de l'intention et de la cible **résolue** (voir tableau de `KOLAKISA_AI_INTELLIGENT_REGENERATION.md`). Exemples testés :
- « change uniquement le fond de cette section en sombre » → `style_section`, **aucun appel IA**, les autres sections et pages sont identiques (comparaison structurelle dans les tests) ;
- « raccourcis ce texte » + champ → `text_field`, **un** appel IA, un seul champ écrit ;
- « réécris le texte de présentation » + section → `text_section` : seuls les champs de cette section sont proposés et écrits ;
- « rends la page … plus professionnelle » → `text_page`, confirmation d'impact, structure, styles et images conservés ;
- « ajoute une section FAQ après les services » → insertion à la position demandée, sections existantes inchangées ; plusieurs « services » → question.

## Garde-fous
- **Variante inventant un fait** (chiffre, contact, certification non fournis) : jamais proposée (`unsupported_claim`).
- **Aucun écrasement silencieux** : champ/section modifié par la personne depuis la dernière écriture IA → `needs_confirmation` ; verrouillé → `protected` (HTTP 423).
- **Quotas** : les appels passent par `ai.call` (plafond quotidien d'organisation, module « ia » du site) ; refus remonté sans rien écrire.
- **Images** : seule la génération d'UNE image est lancée (fournisseur de démonstration, estimation affichée). L'association au site reste une action explicite (remplacement confirmé) du 21.7 : elle n'est **pas** automatisée ici.

## Hors périmètre
Régénération de la **structure** d'une page par le Page Generator (seuls les textes sont régénérés à l'échelle d'une page), restyle d'une page entière, taille du titre d'une section native, adaptation mobile.

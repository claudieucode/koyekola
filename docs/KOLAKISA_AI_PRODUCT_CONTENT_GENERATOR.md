# KOLAKISA — Génération de contenu produit

## Chemins
1. **Gabarit sans IA** (par défaut, gratuit) : rédige uniquement à partir des caractéristiques fournies, selon le style (professionnel, commercial, premium, minimaliste, technique, informatif).
2. **IA facultative** (`ai.call`, quota existant) : consigne « n'utilise QUE les faits fournis », sortie JSON bornée par schéma. En cas d'échec, repli sur le gabarit (signalé).
Les deux passent par le **même garde-fou** (`contentGen.facts.guard`).

## Garde-fou anti-invention (testé avec une IA simulée hostile)
Tout chiffre, année, e-mail, adresse web ou téléphone **absent des faits** est remplacé par « [à compléter] » ; toute affirmation de certification, garantie, récompense, classement, « meilleur », partenariat non étayée est signalée **critique**. Un produit à contenu critique **ne peut pas être créé** tant qu'il n'est pas corrigé. Aucun avis ni note n'est généré.

## Champs produits
Description courte, description (caractéristiques en liste), points forts, informations techniques (style technique), titre SEO (≤ 60), méta-description (≤ 155), texte alternatif, FAQ **seulement si fournie** (le gabarit n'en invente pas). Langue = celle du brief.

## Données jamais inventées
Prix (le moteur l'exige : sans prix, pas de création), stock (non géré tant qu'il n'est pas saisi), SKU, image, poids, délais. Listés dans `missing`.

## Variantes
Produit « variable » : attributs saisis (ex. Taille : S, M ; Couleur : Bleu, Rouge) → **combinaisons** créées dans le moteur **sans SKU, sans prix propre et avec stock 0** (rupture à renseigner) ; 100 combinaisons au plus. SKU saisi conservé tel quel ; doublon de SKU refusé par le moteur.

## Lot et CSV
Colonnes reconnues : nom, sku, prix, stock, categorie, caracteristiques (`|`), image, type, attributs. Détection du séparateur, guillemets, prix décimal selon la devise (XOF, XAF, RWF sans décimale), 500 lignes et 1 Mo au plus. L'**aperçu n'écrit rien** ; doublons (lot et catalogue : adresse, SKU) écartés ; lignes invalides expliquées ; création produit par produit, en **brouillon**.

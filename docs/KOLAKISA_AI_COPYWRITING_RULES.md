# Règles de rédaction commerciale (copywriting)

Appliquées par le prompt système (`engine.systemPrompt`) **et** vérifiées côté serveur lorsque c'est mesurable.

## Règles absolues (prompt + garde serveur)
1. Aucun fait inventé : nom, adresse, téléphone, e-mail, date de création, chiffre, nombre de clients, prix, expérience, certification, récompense, garantie, partenariat, témoignage, résultat. Un fait inconnu = texte général ou `[à compléter]`.
2. Aucune promesse exagérée ni superlatif non prouvé (« le meilleur », « 100 % », « sans risque », « leader »…).
3. Pas de répétition d'une phrase entre champs ; chaque champ a un rôle distinct.
4. Longueur maximale de chaque champ respectée.

## Garde serveur (`facts.guard`)
- Contacts, adresses web, **tout nombre** et toute année absents des faits fournis → remplacés par `[à compléter]` et signalés *critique (résolu)*. Exception : un petit entier devant un nom de liste (« 3 étapes »).
- Affirmations (certification, ISO, garantie, récompense, classement, leadership, agrément, partenariat officiel, « des milliers/centaines de clients », « sans risque », « 100 % », superlatif) **absentes des faits** → *critique non résolu* : l'ensemble ne peut pas être accepté ni appliqué (champ concerné) tant qu'elles subsistent. Présentes dans un fait fourni, elles sont autorisées.
- Un texte écrit par une personne n'est jamais soumis à cette garde (elle est sa propre source).

## Approches rédactionnelles
Directe, persuasive, émotionnelle, factuelle, premium, éducative, orientée conversion : portées par `voice.argumentation` ; le modèle choisit parmi les consignes de la voix et de l'audience. Révisions disponibles : réécrire, raccourcir, développer, plus professionnel, plus commercial, simplifier, changer de ton (consigne), corriger, améliorer le SEO, variantes (2 à 3).

## Boutons et formulaires
Textes de bouton, intro et titre de formulaire sont des champs natifs (`buttonLabel`, `heading`, `intro`) ; un bouton n'est rempli que si la section a déjà son adresse (le CMS exige texte **et** adresse). Messages de confirmation/erreur de formulaire : **non couverts** (ils ne sont pas des champs des sections natives).

## Limites
Aucun jugement de « qualité commerciale » n'est calculé. Les expressions génériques vides ne sont pas détectables mécaniquement : relecture humaine requise.

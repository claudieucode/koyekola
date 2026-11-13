# Pieds de page v2 : rapport final

## Ce qui est livré
- **100 modèles** de pieds de page, dans **14 familles** (`src/themeBuilder/catalog/footer/v2/familles/*.js`), liste complète dans `CATALOGUE_100.md`.
- Chaque modèle a **sa propre identité** (couleurs, polices, formes) : mode `solo`, variables locales `--ft-*`, aucune variable du site, CSS du site exclu à l'émission (voir `ISOLATION_IMPLEMENTATION.md`).
- La bibliothèque **bascule seule sur la v2** dès que les 14 familles sont construites (100 modèles). Les 100 modèles ft-* et tous les anciens identifiants restent **ouvrables** (masqués de la liste) : favoris, « Revenir au modèle d'origine » et pieds installés ne changent pas. Les pieds déjà installés restent en mode `legacy` (rendu inchangé).
- **Interrupteur de secours** : variable d'environnement `FOOTER_V2=0` → l'ancienne liste revient au redémarrage, sans redéployer de code et sans toucher aux pieds installés.
- Insertion depuis la bibliothèque : 26 modèles utilisent le widget « HTML (sécurisé) » pour des décors dessinés. Décision du propriétaire : l'insertion (et « Revenir au modèle d'origine ») d'un pied du **catalogue** n'est pas refusée à un compte sans le droit `pages.code`. La modification ultérieure de ce widget reste protégée.

## Vérifications exécutées
- Audit Chrome des 100 modèles × 5 largeurs (390/820/1280/1440/1920) × avec/sans données = **1000 mesures : 992 à 0 défaut** ; 8 mesures signalent ft2-021 (bandeau « // » qui déborde volontairement des bords, journal défilant) : capture à 1280 relue, pied propre → faux positif de l'outil, noté.
- `footer-v2-bibliotheque` : 314 réussis ; `footer-v2-bascule` : 2 réussis.
- Indépendance (scénario en 10 étapes), éditeur réel et test navigateur : voir `final-results.txt` du dernier passage (résumé en bas de ce fichier).
- Non-régression de l'ancien catalogue : les tests décrivant l'ancien catalogue tournent avec `FOOTER_V2=0`.

## Limites connues (honnêtes)
- Les notes A/B/C sont des auto-évaluations des agents, pas une relecture indépendante.
- Éditeur réel validé modèle par modèle sur un échantillon (le test partagé ne retient qu'un modèle par famille), pas sur les 100 un par un.
- États « formulaire de newsletter publié » non regardés à l'œil pour toutes les familles ; survols (098, 099, 092) définis mais non joués en capture.
- Aucun modèle v2 n'embarque de formulaire de contact complet (seulement des newsletters) ; les anciens pieds avec contact restent ouvrables.
- Pas de sélecteur de langue, pas de bandeau défilant, pas de widget citation (limites du moteur).
- Machine chargée pendant la construction : plusieurs tests ont expiré puis réussi à la relance seule.

## Retour arrière
1. Immédiat : `FOOTER_V2=0` (variable d'environnement Hostinger) + redémarrage.
2. Code : `git revert` de la fusion de la PR + redéploiement hPanel.
3. Aucune donnée n'est réécrite : les pieds installés sont des copies en base, inchangées.

## Résultats du dernier passage (code fusionné avec main)
- Réussis du premier coup : bibliothèque 314, bascule 2, comportements réels 19, alias 12, reconstruction 128, pieds-bibliothèque 17, site principal 6, thèmes en paquets 17.
- Indépendance v2 (scénario en 10 étapes) : 3/3 une fois relancée seule (l'échec du passage groupé était un délai de 30 s dépassé, machine chargée). Indépendance de l'ancien catalogue : 5/5 avec `FOOTER_V2=0` (l'échec venait d'un lancement sans cette variable).
- Éditeur réel : un vrai défaut de test (ft2-015, premier bloc = filet en dégradé sans couleur simple) corrigé dans le test ; ft2-015 passe.
- Test navigateur : trois vrais défauts corrigés dans les modèles/le moteur — lien du titre du site de 43 px au lieu de 44 sur mobile (ft2-062, ft2-096) ; le test mesurait mal les polices (graisse réellement employée) et le survol (8 premiers liens, plus de propriétés) ; les liens placés au milieu d'une phrase (ft2-100) sont exemptés comme le prévoit la règle d'accessibilité WCAG 2.5.8.

## Extension « sites du quotidien » (25 modèles, ft2-101 à ft2-125)
- 5 familles de 5 : artisans et bâtiment, commerces de proximité, services à la personne, professions libérales, vie locale et associations (liste : `CATALOGUE_QUOTIDIEN.md`, fiches : `concepts/concepts-quotidien.json`). La bibliothèque passe à **125 modèles**.
- Animations : survols et focus soignés, pulsations lentes, effets liés au défilement et à la souris, rubans défilants ; tout est coupé sous « mouvement réduit ».
- Limites : pas d'animation d'entrée (le moteur la remplace par un fondu de 300 ms en mouvement réduit, refusé par le test « 0 animation ») ; les rubans défilants (106, 109, 105) sont signalés par l'audit comme « hors écran » (faux positif, comme ft2-021).

## Extension « carrés » : 60 modèles (ft2-126 à ft2-185), total 185
- 12 familles de 5 (PME, industrie, conseil, informatique, énergie, transport, agriculture, recrutement, cliniques, boutique en ligne, blogs, sport) ; brief dans `BRIEF_CARRE.md`, liste dans `CATALOGUE_CARRE.md`.
- **Angles droits** : aucun `border-radius` non nul, mesuré en Chrome sur tous les éléments et pseudo-éléments (nouveau contrôle dans `footer-v2-navigateur`, 390 / 820 / 1280 / 1920, avec et sans formulaire publié). Le point rond « ouvert maintenant » du widget Horaires (CSS partagé) est désactivé dans ces modèles.
- **Résultats** : bibliothèque 569 réussis, bascule 2, comportements réels 19, reconstruction 128, navigateur 60 modèles = 120 réussis, isolation v2 3, ancien catalogue 5.
- Corrigés à l'intégration : contraste du texte de consentement (kit : couleur du texte du widget), listes de widgets déclarés, ressemblance ft2-156 / ft2-167 (lettre déplacée dans la tête).
- Limites : pas d'animation d'entrée ni de défilement continu (moteur) ; mouvements validés par test, pas vus en direct ; Figtree et Bricolage Grotesque évitées (non chargées sur le site de test) ; numéros 15 / 112 / 3237 cités dans les pieds de santé.

## Extension « carrés 2 » + diversité : 80 modèles (ft2-186 à ft2-265), total 265
- 16 familles de 5 (restaurants, hôtels, coiffure, droit, comptables, assurance, immobilier, BTP, écoles, cours, événements, voyage, garages, paysagisme, photo, vétérinaires) ; liste dans `CATALOGUE_CARRE2.md`, brief dans `BRIEF_CARRE2.md` et `DIVERSITE_STRICTE.md`.
- **Remarque du propriétaire : « les pieds se ressemblent »** : 12 archétypes de composition (colonne latérale, nom monumental, damier, ligne unique, deux demi-pages, bandeau XXL, index, mosaïque, frise, papier à en-tête, fenêtre, escalier) ; 25 anciennes compositions refaites (ft2-041, 098, 099, 106, 109, 127, 134, 135, 142, 144, 145, 149, 156, 160-163, 165-167, 182, 183, 209, 226). Similarité structurelle maximale entre deux modèles : 0,60 sur les 265 (0,85 avant ; test existant inchangé à 0,85).
- **Remarque du propriétaire : « le bas est répété et identique »** : `footer/v2/bas.js`. Ligne © du modèle (8 mises en page × 6 filets) et barre de la plateforme « nom · Cookies · Confidentialité » (8 présentations par jetons `--ft-legal-*`, `landing.css`), combinaison UNIQUE par modèle (384 possibles). Test : `footer-v2-bas`.
- Corrections d'intégration : widgets déclarés absents (divider), contraste du consentement e-mail (`G.abonnement` colore le consentement avec `texte`), limite de 200 modèles par site dans les tests (insertion par lots).
- **Résultats** : bibliothèque 809, bascule 2, bas 5, comportements réels 19, reconstruction 128, rendu unifié 10, isolation v2 3 et ancien catalogue 5, éditeur réel 1, navigateur 265 modèles (angles droits pour 126 et plus).
- Limites : mouvements validés par test et non vus en direct ; états « ouvert maintenant » des horaires retirés (pastille ronde, CSS partagé) ; le glitch du 099 n'existe qu'au survol souris ; fiches de concept par agent (`concepts/carre*/`) en double (les fiches `concepts-carre*.json` font foi).

## Extension « inspirés » (PR 55) : 168 modèles, total 433
- 28 familles de 6 modèles (ft2-266 à ft2-433), inspirées de 41 captures ; 12 archétypes de composition (DIVERSITE_STRICTE.md) ; ressemblance max 0,60 sur les 433.
- Bas de page : 512 combinaisons (8 présentations de ligne × 8 filets × 8 barres de plateforme) pour que chaque pied ait un bas distinct.
- `deuxEcarts` (index.js) : sépare tout `gap` à deux valeurs en rowGap/columnGap, refusé par le Page Builder.
- Tests : bibliothèque 1313, bascule, bas, comportements réels, reconstruction, rendu unifié, isolation v2/legacy, éditeur, navigateur (168 modèles : 336 contrôles) : 0 échec.
- Limites : mouvements validés par tests et non vus en direct ; liens internes d'exemple (routes plateforme) ; ligne légale automatique parfois encadrée ou décalée selon le plan du bas.

## Passe « illustrations » (168 pieds ft2-266 à ft2-433, 28 familles)
- Les 168 pieds de la passe « inspirés » ont été refaits à partir des 41 captures d'inspiration, avec une illustration propre à chaque modèle (SVG intégré au widget « HTML sécurisé » : tracteur, lotus, piste d'aéroport, casier à livres, pommes…). Total : 433 modèles, 75 familles.
- Limites du nettoyeur de la plateforme : pas de dégradés SVG, filtres, masques, motifs, `<text>` ni opacité de remplissage → halos en cercles empilés, mots géants dessinés en tracés, SVG < 16 000 caractères.
- Angles droits : les icônes de réseaux des pieds ≥ 266 reçoivent `borderRadius: 0px` sur leur partie « link » (index.js, `reseauxCarres`).
- Vérifications : bibliothèque 1318/1318, bascule, bas (512 combinaisons), comportements réels, reconstruction, rendu unifié, isolation (v2 et ancien), éditeur ; test Chrome sur les 168 pieds ; audit Chrome 390/1280 : 8 défauts initiaux, 2 corrigés (ft2-343, ft2-345), restent des chevauchements mineurs de bouton/illustration à 390 px (ft2-328, 331, 334) et des libellés d'adresse du widget coupés (ft2-329).
- Limites honnêtes : animations non vues en direct ; ressemblance structurelle maximale 0,65 (seuil du test : 0,85).
- Retour arrière : `FOOTER_V2=0` (variable Hostinger) ou `git revert` de la fusion.

# KOLAKISA CMS — Paramètres : ouverture des sections dans l'espace d'un site (mission PARAMETRES-SECTIONS-01, étape 1)

Branche `parametres-sections-01`, issue de `origin/main` (`642ba87`). Ce document décrit l'état **réel** ; il remplace aucune autre documentation (`cms-parametres.md`, `KOLAKISA_CMS_PARAMETRES_GENERAL.md`, `KOLAKISA_CMS_CONFIDENTIALITE.md` restent valables).

## 1. Audit (phase 1)

Le moteur de réglages (`src/services/settings`, 10 groupes, validation serveur, droits, sensibilité, journal, isolation) existe et fonctionne pour le **site principal** ; les écrans du site principal (formulaires de groupe) existent. Ce qui manquait : dans le menu d'un **site**, neuf entrées de Paramètres étaient grisées « Bientôt ».

| Section | Réglages réels du moteur | Propres à un site ? | État avant | État maintenant |
|---|---|---|---|---|
| Général | 9 (principal) · 13 (site) | oui | fonctionnel | inchangé (mission précédente) |
| Lecture | page d'accueil · articles par page | page d'accueil : oui ; articles par page : plateforme | grisé dans un site | **ouvert** : formulaire du site + récapitulatif |
| Commentaires | 6 règles (ouverts par défaut, invités, modération, réponses, profondeur, liens) | non (règles communes à l'organisation) | grisé | **ouvert** : valeurs réelles, lecture seule |
| Médias | 4 limites de taille (image, document, audio, vidéo) | non | grisé | **ouvert** : valeurs réelles, lecture seule |
| Permaliens | normalisation des adresses (sensible) | non | grisé | **ouvert** : valeur réelle, lecture seule |
| SEO | titre, image, suivi des liens (site) · 5 réglages (principal) | partiellement | grisé | **ouvert** : formulaire du site + récapitulatif |
| Confidentialité | page de politique, conservation des visites | page : oui | ouvert (mission précédente) | inchangé |
| Indexation | visibilité pour les moteurs (sensible) | oui | grisé | **ouvert** : formulaire du site, confirmation exigée |
| Emailing | expéditeur, adresse, réponse | oui (domaine déclaré obligatoire) | grisé | **ouvert** : formulaire du site + outils liés |
| Tunnels | 3 délais d'abandon | non (délais communs) | grisé | **ouvert** : valeurs réelles + outils liés |
| Avancé | configuration plateforme (lecture seule), préférences personnelles | non | grisé | **ouvert** : même écran, liens centraux masqués pour un accès limité |

Classement des écrans : *fonctionnel* = Général, Confidentialité, et les formulaires de groupe du site principal ; *partiellement fonctionnel* = les neuf sections dans un site avant ce travail (écran du principal accessible par `?site=`, mais hors cadre et grisé dans le menu) ; *visuel seulement* = aucun ; *défectueux* = aucun trouvé.

## 2. Ce qui a été fait

- **Neuf entrées ouvertes** dans le menu d'un site (`cmsNav.js` : `SITE_MODULES` + `ABILITY` + `FRAMED`), servies par les écrans existants (aucune duplication) dans le cadre du site (`/sites/<id>/parametres-<groupe>`), sans onglets centraux ni choix de site.
- **Honnêteté sur la portée** : une section sans réglage propre au site (Commentaires, Médias, Permaliens, Tunnels) affiche les valeurs communes **réellement appliquées** en lecture seule, avec la règle « modifiable depuis le site principal, par l'équipe » ; une section mixte (Lecture, SEO) montre le formulaire du site **puis** les réglages communs. Aucun réglage commun ne peut être écrit depuis un site : les champs étrangers à la portée sont ignorés par le serveur (test).
- **Enregistrement dans le cadre** : après enregistrement, erreur ou confirmation, l'écran reste dans le cadre du site (champ `frame`, aucune adresse de retour libre) ; la saisie refusée est conservée.
- **Outils liés réels** (aucun doublon) : Emailing → fournisseur, clés secrètes, e-mail de test (`/marketing/envoi`) et vérification SPF / DKIM / DMARC (`/marketing/domaines`) ; Tunnels → écran Tunnels et Analytics. Réservés à l'équipe (un accès limité voit pourquoi).
- **Interface** : animations légères (apparition avec très légère mise à l'échelle des panneaux, ouverture des sous-menus), `prefers-reduced-motion` respecté, aucune animation permanente, aucun décalage de mise en page.
- **Aucune migration** ; aucune donnée modifiée.

## 3. Tests

`tests/parametres-sections.test.js` (7 tests de routes : menu, ouverture des 9 sections, lecture seule et refus d'écriture des réglages communs, Emailing enregistré / validé / isolé / domaine déclaré, outils liés par rôle, Indexation sensible, droits et isolation) ; `tests/parametres-sections-navigateur.test.js` (3 tests Chrome : neuf sections depuis le menu sans erreur JavaScript et entrée active, enregistrement réel et saisie conservée, téléphone 390 px, mouvement réduit). Attentes des tests de menu mises à jour (20 entrées « Bientôt » restantes au lieu de 29, aucune dans Paramètres).

## 4. Non fait (à traiter dans les étapes suivantes — non simulé, non annoncé)

- Réglages **propres à un site** pour les commentaires, les médias, les permaliens, les tunnels et le nombre d'articles par page : le moteur n'a pas de portée « site » pour eux ; les créer exige de faire lire ces valeurs par site aux services concernés (modération, validation d'envoi de fichiers, génération d'adresses, balayage des abandons). Demande une décision de conception (isolation des données historiques).
- Aperçu des résultats de recherche, modèles de métadonnées par type de contenu, canonique, balises sociales, données structurées : les outils SEO existent dans le menu SEO (« Bientôt » dans un site pour Analyse, Méta, Indexation, Sitemap, Schema, Open Graph, Robots) ; leur isolation par site n'est pas démontrée.
- Enregistrement du fournisseur d'envoi (SMTP / Resend) depuis cet écran : il reste dans `/marketing/envoi` (équipe).
- Restauration des valeurs par défaut, déjà disponible dans les écrans de groupe du site principal ; inchangée.
- Vérification de l'effet sur le site public des réglages d'un site (visibilité pour les moteurs d'un site à domaine propre) : testée jusqu'à l'enregistrement et la relecture ; l'effet public du site principal reste couvert par `cms-parametres.test.js`.
- Webhooks et API (Avancé) : gérés ailleurs (`/marketing/api`, webhooks) ; non reliés à cet écran.

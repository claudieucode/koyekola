# Formulaires et contacts

Préfixe `H` = https://help.systeme.io/article/

## 1. Formulaire de capture (opt-in)

Source : H1602-how-to-build-your-contact-list-using-a-sales-funnel ; H1662-how-to-add-a-form-input.
- Objectif : créer des contacts à partir d'une page ou d'un popup.
- Deux approches : élément **Form input** (champs isolés) + **Button**, ou élément **Form** (conteneur groupant champs, cases et bouton ; plusieurs formulaires indépendants par page).
- Paramètres Form input : **Input type** (liste complète non documentée ; « Email » cité), **Placeholder**, style (typographie, couleurs, bordures, alignement).
- Paramètres Form (onglet Elements) : champs standard supprimables (corbeille), **Placeholder**, case **Optional**, icône, bouton (+) pour champs prédéfinis (ex. code postal, nom de l'entreprise), case à cocher supplémentaire, champ personnalisé ; réordonnancement par glisser-déposer. Onglet Design : mise en page, espacements, fond, bordures. Onglet Actions : **No redirection** (message de succès), **Custom URL**, **Double opt-in**, **In-editor automations** (ajout de tag, inscription à une campagne, envoi d'e-mail).
- Validation : au moins un champ Email obligatoire. Message d'erreur : « At least one email input is required on this page » (H623-what-does-it-mean-when-the-error-at-least-one-email-input-is-required-on-this-pags-is-displayed-on-one-of-your-pages). Résolutions : ajouter un champ Email (Input type = Email) ou changer l'action du bouton (Open URL / Next step URL).
- Bouton obligatoire pour enregistrer les données (H1662, H170). Plusieurs boutons « Submit form » sur une page doivent porter les mêmes champs et déclencher les mêmes règles (H170-how-to-set-up-a-button).
- Après envoi (question « Do you want to redirect users after contact registration? ») : To the next step / To the custom URL (champ Redirection URL) / No redirection avec texte affiché (H1602).
- Validation côté champ (format téléphone, pays, etc.) : non documentée. À VÉRIFIER.
- Antispam / captcha / consentement RGPD : non documentés. À VÉRIFIER.

## 2. Double opt-in

- Case « double opt-in » : le contact reçoit un e-mail avec un lien ; sans clic sous 24 h il est supprimé de la liste automatiquement (H1602). Article dédié « How to set up double opt-in » non lu : personnalisation de l'e-mail de confirmation, comportement des règles avant confirmation : À VÉRIFIER.

## 3. Champs personnalisés

Source : H172-how-to-add-a-custom-form-field.
- Création : CRM > Contacts > ouvrir un contact > **Add new custom field** > **Name** et **Unique key** > Save.
- Usage : élément Form input > **Input Type** = le champ personnalisé > Save. Dans l'élément Form, les champs personnalisés apparaissent sous « Custom fields ».
- Types de données d'un champ personnalisé, limites : non documentés. À VÉRIFIER. L'API expose les « slugs » des champs personnalisés (H2323-how-to-create-a-public-api-key-on-systeme-io).

## 4. Formulaire « order form en deux étapes »

Source : H235-what-is-two-step-order-form. Élément **Two-step order form** : coordonnées en premier ; le contact est ajouté à la liste même sans achat. Déclencheur de règle : « Funnel step form subscribed ».

## 5. Sondage (Survey)

Source : H1398-how-to-use-the-survey-element.
- Élément **Survey** (tunnels et blogs uniquement). Icône réglages > **Edit survey questions** > **Add question**, sous-titre, **Add answer**, tag optionnel par réponse, **Open-ended answer** (réponse libre, sans tag), réordonnancement, suppression, bouton BACK. Nombre de questions illimité.
- **Final step** : champs de saisie et bouton ; champ Email présent et obligatoire par défaut.
- Réponses visibles dans CRM > Contacts > contact > section **Surveys**. Automatisation par déclencheur « Tag added ».
- Cours : créer le sondage sur une page de tunnel et lier depuis le cours.

## 6. Formulaire/popup intégrés sur un site externe

Source : H266-how-to-create-and-integrate-a-form-or-a-popup-on-your-external-site. Add step > catégorie Opt-in > **Inline form** ou **Popup form** > Select > Edit page > **Script** > **Copy link to clipboard**. Formulaire : coller dans section HTML/Widget ; popup : coller dans le code header ou footer. Mise à jour du code après modification : non précisé. À VÉRIFIER.

## 7. Contacts (CRM)

Titres d'articles (contenu non lu sauf tags) : import/export de liste (H238), ajout manuel (H310), suppression multiple (H308), contacts rebond (H627), restauration (H11332), inscription à une campagne à l'import (H1062), création/suppression de tag (H303/H309). Source de liste : https://help.systeme.io/category/537-contacts-management.
- Ajout de tag manuel : CRM > Contacts > cocher > **More actions** > **Add tag** > choisir > **Add tag to contacts**. Auto : règles d'automatisation, ressources « Tags » d'un order form. Un tag peut déclencher des actions ; vérifier les règles avant modification. Source : H348-how-to-automatically-and-manually-add-tags-to-your-contacts.
- Champs d'un contact, doublons, fusion, segments : non documentés dans les sources lues. À VÉRIFIER.
- Limites de contacts : Free 2 000, Startup 5 000, Webinar 10 000, Unlimited illimité (https://systeme.io/pricing). Détails de restriction : PERMISSIONS_ET_SECURITE.md.
- Notification e-mail pour nouveau lead : article 2292, non lu. À VÉRIFIER.
- Un champ Email et First Name sont requis sur les pages de paiement Stripe (H225-how-to-connect-your-stripe-account-to-systeme-io).

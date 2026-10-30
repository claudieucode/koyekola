# Sécurité et confidentialité de l'AI Website Builder

## 1. Menaces et parades

| Menace | Parade (réutilise l'existant) |
|---|---|
| Lecture des données d'un autre site | `site_id` jamais lu de la requête ; `ctx.siteScope` + `validSite` ; toute lecture de génération filtrée ; test d'isolation A→B obligatoire (modèle : `programme20-2-site-builder.test.js`). |
| Contexte envoyé au fournisseur trop large | Liste blanche : brief de la personne, textes de la page visée, catalogue de types. **Jamais** : contacts, commandes, e-mails, clés, autres sites, journaux. |
| Injection d'instructions (dans le brief ou dans un texte importé) | Le texte utilisateur est une donnée dans le prompt, sortie contrainte par schéma ; l'IA ne dispose d'**aucun outil** (ni suppression, ni publication, ni lecture libre) ; seules des opérations validées sont appliquées. |
| Sortie malveillante (HTML/JS, liens `javascript:`) | Grammaire fermée : pas de HTML/CSS/JS libres ; `linkUrl` (https ou chemin du site) ; `sanitize-html` ; médias limités à `/uploads/marketing/…`. |
| Contenu trompeur (faux avis, certifications, chiffres) | Contrat §5 : espaces réservés, détection de nombres/contacts hors `knownFacts`, pas de génération de témoignages ; validation humaine avant publication. |
| Publication / suppression par l'IA | Impossible par conception : la génération écrit des **brouillons** ; publier exige la permission et l'action humaines habituelles. |
| Écrasement du travail manuel | Empreintes, éléments modifiés exclus, verrous respectés, acceptation explicite, annulation par révision. |
| Fuite de clé API | Clés dans connecteurs (chiffrées, `ENCRYPTION_KEY`) ou variable serveur ; masquage `sk-ant-…` déjà fait par `aiCore` ; jamais dans le navigateur, les logs, les réponses d'erreur. |
| Abus / coût | Module `ai` à activer par site, permission d'écriture, plafond quotidien organisation (+ plafond par site à ajouter), limite de pages par génération, une génération active par site, anti double envoi `data-mk-once`, limitation de débit par utilisateur. |
| Conflit d'écritures concurrentes | `saveDraft` à révision atomique (409) ; génération écrite en une transaction. |
| Média non valide | Validation existante de la médiathèque (types, taille) ; aucune URL d'image distante enregistrée telle quelle. |

## 2. Permissions
Création/régénération : droit d'écriture sur les pages du site (`forms.write` actuel pour le studio) **et** module `ai` actif. Lecture de l'historique : lecture du site. Un membre limité au site A voit uniquement les générations de A.

## 3. Données personnelles
- Le brief peut contenir des données personnelles ou commerciales : avertissement dans l'interface avant envoi (« ce texte est transmis au fournisseur choisi »).
- `privacyNote` des connecteurs existe déjà (ex. OpenAI : transmission aux États-Unis) ; à étendre à Anthropic une fois la politique de rétention lue.
- Journal : pas de prompt ni de texte complet (comportement actuel de `mk_ai_requests`). Pour l'historique de génération, conserver plan et résultat **nécessaires à l'annulation** pendant une durée fixée ; purge planifiée ; branchement sur « effacement des données » (migration 102) à prévoir.
- Aucune donnée d'élève ou de client n'est jamais utilisée pour construire un prompt de site.

## 4. Journalisation et audit
Événements `audit()` : `ai.site.planned`, `ai.site.generated`, `ai.site.accepted`, `ai.site.rejected`, `ai.site.undone`, avec utilisateur, site, identifiant de génération, tailles. Sans texte.

## 5. Tests exigés avant toute mise en production (21.11)
Isolation entre sites ; refus sans module/permission ; réponse fournisseur hostile simulée (propriété inconnue, HTML, `javascript:`, 10 000 sections) → rejet sans écriture ; double envoi ; plafond ; absence de secret dans les réponses et logs ; annulation restaure l'état exact.

## 6. Non vérifié ici
Politique de rétention des fournisseurs ; conformité juridique (RGPD / droit congolais) ; test de charge. Rien n'a été exécuté contre un fournisseur réel.

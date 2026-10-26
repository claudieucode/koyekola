# 14 — Rapport final de parité avec Mailchimp

**Conclusion honnête : Kolakisa ne possède pas toutes les fonctions de Mailchimp.** Il couvre solidement le cœur (contacts, consentement, segmentation, campagnes, éditeur, modèles, automatisations, formulaires, suivi, API, SMS, IA) et présente des lacunes importantes ailleurs (voir ci-dessous). La comparaison s'appuie sur ≈ 218 fonctions Mailchimp inventoriées (`01a_…`, `01b_…`), dont les détails chiffrés sont à revérifier (voir `00_SCOPE_AND_METHODOLOGY.md`).

## Par domaine

| Domaine | Parité | Preuve | Ce qui manque |
|---|---|---|---|
| Audiences et contacts | forte | `marketing-audience`, `marketing-import*`, `cms-contacts-core`, `contacts-fusion-refus` | doublons flous, export avec propriétés et consentement |
| Segmentation | forte (ET/OU/NON, imbrication, moteur unique) | `marketing-segments`, `marketing-r3-segments-data` | segments prédictifs, entrée/sortie de segment comme déclencheur |
| Campagnes | forte | `marketing-campaigns`, `marketing-heure-envoi` | récurrence, replanification, fuseau de saisie, renvoi aux non-ouvreurs |
| Éditeur et modèles | bonne | `marketing-r5-*`, `marketing-templates-*`, `marketing-linkcheck*` | texte brut éditable, accessibilité complète, bibliothèque plus riche |
| Personnalisation | bonne | `marketing-templates-engine` | boucles, recommandations de produits |
| Tests A/B | bonne (avec preuve statistique) | `marketing-tests-ab`, `marketing-ab-preuve` | test sur l'heure ou l'expéditeur, multivarié |
| Automatisations | bonne (43 déclencheurs, 22 actions, branches, reprise) | `marketing-automations*`, `cms-automation-engine` | ré-entrée, calendrier, entrée de segment |
| Formulaires et pages | bonne | `marketing-forms-*`, `marketing-pages-atterrissage` | CAPTCHA, domaine par page, préférences complètes |
| Délivrabilité | partielle (code solide, rien de réel vérifié) | `marketing-providers`, `marketing-domaines`, `marketing-reputation` | envoi réel, échauffement d'IP, retours SMTP |
| Conformité | bonne | `marketing-conformite`, `marketing-public` | rétention, règles pays par pays à valider juridiquement |
| Statistiques | partielle | `marketing-tracking` | une seule source de chiffres, ouvertures automatiques, rebonds mous |
| CRM léger | bonne | `cms-contacts-*` | — |
| E-commerce | partielle (LMS interne seulement) | `marketing-pont-*` | boutiques externes non connectées |
| SMS | bonne côté code ; **bloquée par un opérateur réel** | `marketing-sms*` | confirmation du numéro, idempotence |
| API et webhooks | bonne | `marketing-api-*`, `marketing-webhooks-*` | API d'envoi, rotation du secret |
| IA | bonne (sortie validée, quota) | `marketing-ia-redaction` | — |
| Comptes et permissions | forte | `cms-users*`, `isolation-*`, `marketing-mobile-auth` | — |
| Facturation | **absente** | — | décision commerciale préalable |

## Bilan de la mission

- **Audité** : 21 modules, deux audits indépendants avec preuves fichier:ligne.
- **Défauts relevés par les audits** : 14, chacun relu dans le code avant correction. **8 corrigés** avec test de non-régression (dont les 4 de gravité haute : webhooks sortants, réinscription par un tiers, connexion mobile, fusion de contacts ; plus domaine d'expédition, classification SMTP, 408/429, export CSV). **3 corrigés en partie** : scénario transactionnel (déclencheur contrôlé, pas le contenu), double envoi (e-mail de scénario corrigé, SMS non), fiche archivée (libellé corrigé, réactivation à décider). **3 ouverts**, documentés : ré-entrée de scénario, confirmation du numéro SMS, fuseau de programmation. Détail : `08_GAP_ANALYSIS.md`.
- **Ajouté** : pause automatique sur plaintes et rebonds, contrôle HTTP des liens, valeur probante des tests A/B.
- **Tests** : 6 339 tests hors navigateur ; 22 échecs préexistants sur `main`, 0 échec attribuable à cette mission après adaptation de 5 tests qui encodaient les anciens comportements (`11_TEST_STRATEGY.md`).

## Ce qui n'est pas vérifié

- Aucun envoi réel, aucune délivrabilité réelle, aucun appel à Resend, Twilio ou au fournisseur d'IA.
- Aucun test navigateur (éditeur, glisser-déposer, bouton « Vérifier les liens » dans l'aperçu : la route est testée, pas le clic).
- Aucun test de charge : aucune capacité de volume n'est affirmée.
- Pas de validation juridique.

## Statuts de la matrice initiale

| Statut | Domaines |
|---|---|
| Implémenté et testé | contacts, segmentation, campagnes, éditeur, modèles, personnalisation, A/B, automatisations, formulaires, désinscription, API, IA, permissions |
| Partiellement implémenté | délivrabilité, statistiques, e-commerce, landing pages, bibliothèque de modèles |
| Bloqué par une dépendance externe | envoi réel, SMS réels, boutiques externes, paiement |
| Non implémenté | facturation, ré-entrée de scénario, déclencheur calendaire, segments prédictifs, échauffement d'IP, CAPTCHA |
| À approfondir | contenu des messages « transactionnels », rétention des données, règles par pays |

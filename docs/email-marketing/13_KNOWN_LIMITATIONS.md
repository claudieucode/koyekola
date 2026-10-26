# 13 — Limites connues et anomalies restantes

Classées par importance. « Décision » = il faut un choix du propriétaire du produit avant de coder.

## À traiter avant des envois réels à grande échelle

1. **Aucun envoi réel n'a été vérifié.** Fournisseurs simulés seulement. Il faut un domaine vérifié, une clé de fournisseur et le webhook de retour (voir `07_DELIVERABILITY.md`).
2. **Double envoi SMS** possible si l'opérateur a accepté le message mais que la réponse expire (pas de clé d'idempotence chez Twilio dans le code actuel).
3. **Messages « transactionnels »** : seul le déclencheur est contrôlé. Des relances d'engagement livrées avec l'application (reprise de formation, demande d'avis) sont traitées comme service. **Décision** : les reclasser en marketing ?
4. **SMTP sans retours** : pas de rebonds différés ni de plaintes, donc le garde de réputation est aveugle avec SMTP seul.

## Fonctions absentes

| Fonction | Remarque |
|---|---|
| Ré-entrée dans un scénario | conception dans `08_GAP_ANALYSIS.md` ; un panier abandonné ne peut être relancé qu'une fois par contact |
| Déclencheur calendaire (date, anniversaire, récurrent) | le parcours « Anniversaire » s'affiche « non disponible » |
| Entrée ou sortie de segment comme déclencheur | absent du catalogue |
| Campagne récurrente, renvoi aux non-ouvreurs | absents |
| Replanification d'une campagne programmée | pause, reprise ou annulation seulement |
| Fuseau de programmation | saisie et affichage en UTC ; l'heure locale du contact est gérée à part |
| Texte brut éditable | généré automatiquement, non modifiable |
| Accessibilité de l'éditeur | texte alternatif et contraste du bouton ; pas de hiérarchie des titres ni d'intitulés de liens |
| Boucles et recommandations de produits dans les modèles | moteur de gabarits sans `for` |
| Segments prédictifs | absents |
| Page de préférences | catégories seulement ; pas de fréquence ni d'abonnements par liste |
| CAPTCHA | absent |
| Confirmation du numéro SMS par code | absente |
| Rotation du secret d'un webhook sortant | absente |
| API d'envoi (transactionnel, campagne) | l'API publique ne permet pas d'envoyer |
| Facturation, forfaits, quotas par offre | absents (décision commerciale préalable) |
| Échauffement d'IP, limitation par domaine destinataire | absents |
| Rétention et purge des événements d'e-mail | absentes |
| Boutiques externes (Shopify, WooCommerce) | non connectées ; seul le LMS interne est relié |
| Domaine personnalisé par landing page | pages servies sous `/p/<adresse>` |
| Bibliothèque de modèles | 15 modèles de départ, pas de modèles sectoriels ; aucun n'utilise les blocs formation, coupon, articles, sondage |

## Anomalies connues

- **Fiche archivée qui se réinscrit** : réussite affichée, fiche toujours non joignable. **Décision** : la réactiver sur consentement explicite ?
- **Deux sources de chiffres** pour les statistiques (compteurs de campagne et événements) : peuvent diverger.
- **Rebonds mous** jamais comptés.
- **Détection des ouvertures automatiques** (confidentialité des clients de messagerie) : indicative seulement.
- **Tests fragiles sous charge**, non liés au code : `marketing-templates-blocks.test.js` (« 5 000 rendus … rapide », seuil absolu de 3 s, dépasse sur une machine lente) ; `marketing-file-evenements.test.js` (« start/stop … » fondé sur des délais).
- **Test déjà en échec sur `main`**, sans rapport avec cette mission : `blog-medias-protection.test.js`, « article supprimé : sa couverture… ».
- **Tests Playwright** (`*-navigateur.test.js`) : non lancés pour cette mission ; l'annulation/rétablissement et le glisser-déposer de l'éditeur ne sont vérifiés que par eux (ignorés sans Chrome).

## Limites de la recherche Mailchimp

Voir `00_SCOPE_AND_METHODOLOGY.md` : chiffres et plans à revérifier, une vingtaine de pages non ouvertes, page Gmail/Yahoo en 404.

## Limite de portée de cette mission

La mission demandait d'implémenter l'ensemble des 21 modules. Elle a audité les 21, corrigé les défauts d'intégrité, de sécurité et de conformité vérifiés, et ajouté trois fonctions (valeur probante des tests A/B, pause automatique de réputation, contrôle HTTP des liens). Les fonctions absentes ci-dessus restent à faire ; elles sont listées avec leur état exact plutôt que présentées comme couvertes.

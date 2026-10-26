# 06 — Sécurité et conformité

Ce document décrit ce qui a été vérifié, ce qui a été corrigé pendant la mission et ce qui reste ouvert. Il ne vaut pas avis juridique : **le logiciel n'est pas présenté comme juridiquement conforme** ; les choix d'implémentation ci-dessous sont à faire valider pour chaque marché visé.

## Ce que l'audit a trouvé de solide (vérifié par lecture et tests)

- La garde d'envoi `isSendable` (et son équivalent SQL en masse `sendableSql`) est **revérifiée à chaque message**, pas seulement à la création de la campagne.
- Un envoi interrompu n'est **jamais rejoué** (campagnes, SMS ; désormais aussi les e-mails de scénario).
- Jetons de désinscription et de préférences signés et séparés par type ; la page de désinscription n'écrit rien en GET, seul le POST désinscrit ; en-têtes `List-Unsubscribe` et `List-Unsubscribe-Post` (un clic).
- Preuves de consentement : texte exact, source, adresse IP tronquée, site de collecte ; table protégée contre la modification et la suppression directes.
- Isolation par organisation (dépôt de données qui impose `organization_id`) et par site (`siteScope`) ; un test échoue si une route n'est pas classée dans la table de portées.
- Rendu des e-mails sans injection : valeurs échappées selon le contexte, sondes XSS négatives.
- Secrets chiffrés (clés de fournisseur, secrets de webhooks), jamais relayés dans les messages d'erreur.
- Effacement des données personnelles et export des données de la personne.

## Défauts corrigés pendant cette mission

| Sujet | Risque | Correction |
|---|---|---|
| SSRF des webhooks sortants | un point d'accès pouvait répondre par une redirection (307) vers une adresse interne et recevoir la requête signée ; un nom DNS pouvait changer de cible entre la vérification et la connexion | redirections jamais suivies ; connexion épinglée sur l'adresse validée ; plages CGNAT et réservées refusées |
| Réabonnement par un tiers | taper l'adresse d'un tiers dans un formulaire sans double confirmation, ou cocher la case à l'inscription du LMS, réabonnait une personne qui s'était désinscrite | une personne désinscrite passe toujours par le lien de confirmation envoyé à sa boîte ; la case cochée à l'inscription ne la réabonne pas |
| Fusion de contacts | les désabonnements par liste et les refus de catégorie de la fiche absorbée disparaissaient : la personne redevenait joignable | ils sont reportés sur la fiche conservée (le plus restrictif l'emporte) |
| Connexion mobile | deuxième connexion en erreur 500 ; la révocation touchait les clés de tous les utilisateurs ; le rôle n'était pas contrôlé | une clé par utilisateur, anciennes clés renommées puis révoquées, droit `api_keys.manage` exigé |
| Usurpation d'expéditeur | un domaine ajouté sans preuve de propriété servait d'adresse d'expédition d'un site | seuls les domaines vérifiés ou authentifiés sont acceptés |
| Suppression définitive injustifiée | tout SMTP 550/551/553 mettait le destinataire en liste de suppression définitive | suppression seulement si le code détaillé 5.1.x ou le texte désigne le destinataire |
| Scénario « transactionnel » | contourne le consentement sans aucun contrôle | déclencheurs limités aux événements de service (voir limite ci-dessous) |

Chaque ligne a un test de non-régression (voir `08_GAP_ANALYSIS.md`).

## Limites et risques ouverts

- **Contenu des messages « transactionnels ».** Seul le déclencheur est contrôlé, pas le contenu. Certains parcours livrés (« Reprenez votre formation » après 14 jours, demande d'avis) sont des relances d'engagement que plusieurs pays rangent dans le marketing. Recommandation : reclasser ces parcours en « marketing » (leur envoi dépendrait alors du consentement). C'est une décision de produit : elle changerait qui reçoit ces e-mails. Les scénarios déjà installés ne sont pas modifiés.
- **Double envoi SMS.** Twilio n'a pas de clé d'idempotence ici : un SMS réessayé après un délai dépassé peut partir deux fois si l'opérateur l'avait déjà accepté. Non corrigé.
- **Confirmation du numéro SMS.** Un accord SMS est enregistré sans code de vérification du numéro. Non corrigé.
- **Anti-spam des formulaires.** Champ piège, jeton de temps signé et limiteur en mémoire ; pas de CAPTCHA ; le limiteur ne survit pas à un redémarrage et n'est pas partagé entre processus.
- **Rétention.** `mk_message_events` et les travaux « dead » ne sont jamais purgés. À décider avec la politique de conservation.
- **Fiche archivée.** Une personne archivée qui se réinscrit par formulaire voit une réussite, mais reste non joignable (la fiche reste archivée). Le résumé d'audience l'indique maintenant correctement (« fiches archivées ou fusionnées »). Réactiver la fiche sur consentement explicite est une décision à prendre.
- **Exigences par pays.** Le logiciel enregistre la preuve, respecte le désabonnement et la liste de suppression, et exige une adresse postale en avertissement (non bloquant). Les règles précises (RGPD, CAN-SPAM, CASL, loi congolaise, etc.) n'ont pas été analysées pays par pays dans cette mission.

## Ce qui n'a pas été testé

Aucun test d'intrusion externe. Aucune campagne réelle. Les fournisseurs (SMTP, Resend, Twilio, IA) sont simulés dans les tests.

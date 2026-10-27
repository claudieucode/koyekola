# Permissions et sécurité

Préfixe `H` = https://help.systeme.io/article/

## 1. Sous-comptes et rôles

Source : H4243-how-to-create-a-sub-account-on-systeme-io.
- Création : photo de profil > Sous-comptes > Créer > nom (obligatoire) + sous-domaine > Enregistrer ; "..." > Se connecter au sous-compte ; renommer via Paramètres ; Supprimer.
- Inviter : dans le sous-compte, Paramètres > Membres de l'espace de travail > Inviter > e-mail + niveau d'accès **Assistant** ou **Administrateur**.
- Droits exacts de chaque rôle : non documentés. À VÉRIFIER.
- Nombre de sous-comptes illimité (même en Free) ; mêmes limites que le compte principal par sous-compte (ex. 10 tunnels en Startup) ; statistiques distinctes ; passerelle de paiement propre à chaque sous-compte.
- Partage de tunnels, newsletters, campagnes, cours, blocs personnalisés entre comptes/sous-comptes.
- Conformité : proposer des sous-comptes à vie ou en dessous des tarifs officiels viole les CGV (suspension).
- Rôles Client/Étudiant : retrait du rôle Client après 6 mois d'inactivité (H1086).

## 2. Partage de tunnel

H148-how-to-share-a-sales-funnel : lien = lien d'affiliation ; droits du destinataire non précisés. À VÉRIFIER.

## 3. Clés et secrets

- API publique : 3 clés max, nom unique, expiration optionnelle, visible une fois (H2323-how-to-create-a-public-api-key-on-systeme-io). Clés MCP : Settings > MCP & API keys (H11408).
- Webhooks : URL HTTPS, clé secrète, journaux, IP sources de l'action webhook (H2930, H144). Mécanisme de signature : non documenté.
- Stripe : OAuth « Authorize access to this account » (H225).

## 4. Restrictions de compte

Source : H1086-what-happens-when-my-account-gets-restricted.
- Déclenchement : dépassement du plafond de contacts (Freemium 2 000, Startup 5 000, Webinar 10 000) ou des limites de fonctionnalités après changement de plan.
- Pré-restriction : 3 e-mails (1 par jour) et alerte tableau de bord ; restriction automatique au 4e jour sans action. Éléments dépassés en rouge dans Profil > Paramètres > Mon plan.
- Freemium restreint : opt-ins et paiements interrompus, ajout/import de contacts impossible (formulaires, saisie, automatisations, Zapier, API), ventes bloquées, newsletters interdites, campagnes suspendues, nouveaux déclencheurs d'automatisation inactifs (ceux en cours continuent), élèves sans accès aux cours.
- Plan payant : passage automatique au palier supérieur ; retour via support après nettoyage.
- Comptes inactifs : avertissement après 5 mois ; après 6 mois rôle Client retiré ; données restaurables 1 mois puis supprimées.

## 5. Sécurité des pages et du paiement

- HTTPS : requis pour les webhooks (H2930). HTTPS des pages sur domaine personnalisé : la redirection de racine peut n'être qu'en HTTP chez certains registraires (H135-how-to-connect-your-domain-to-systemeio) ; certificat géré par systeme.io : non documenté dans les articles lus. À VÉRIFIER.
- Stripe Radar (article 4450), litiges (4338) : non lus.
- Code personnalisé : balises head/html/body/footer interdites dans les zones de code ; Raw HTML non prévisualisé (H306). Assainissement des scripts : non documenté.
- Pages masquées des moteurs par défaut (H510).
- Pages thank you/conference de webinaire inaccessibles hors inscription (H265).
- Suppression : confirmation + irréversible pour une page (H305) ; récupération de contenu supprimé : article 10861 listé, non lu ; restauration de contacts : 11332 non lu.
- Conformité RGPD, consentement, journalisation d'audit : non documentés. À VÉRIFIER.

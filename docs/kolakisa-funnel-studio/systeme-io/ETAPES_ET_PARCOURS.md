# Étapes et parcours

Préfixe `H` = https://help.systeme.io/article/

## 1. Types d'étapes (champ « Type » de « Create funnel step »)

Libellés confirmés par les articles lus :
| Type | Catégorie citée | Source |
|---|---|---|
| Opt-in page | Opt-in | H152-how-to-create-a-opt-in-page |
| Inline form | Opt-in | H266-how-to-create-and-integrate-a-form-or-a-popup-on-your-external-site |
| Popup form | Opt-in | H266 |
| Sales page | (Sales) | H287-how-to-create-a-sales-page |
| Order form | (Sales) | H252-how-to-create-an-order-form-payment-page |
| Upsell / Downsell | (Sales) | H243-how-to-create-an-upsell-and-a-downsell |
| Thank You page (« Sales Thank You ») | Sales | H352-how-to-add-the-order-summary-on-the-thank-you-page |
| Opt-in Thank You | Opt-in | H352 |
| Pages webinaire (inscription, thank you, conference) | webinaire | H265-how-to-create-automated-webinars |
| Info page, Link in bio | — | H11408-how-to-manage-your-funnels-with-the-systeme-io-mcp-server (liste MCP), H306 (page de type Info) |

Liste exhaustive des types et de leurs catégories : À VÉRIFIER (ouvrir « Add step » dans un compte gratuit).

Procédure commune : Add step > Type > modèle ou page vierge > Save > Select (modèle) > Edit page. Chaque création propose une bibliothèque de modèles. Après création, un panneau de configuration de l'étape (règles d'automatisation, paramètres) s'affiche (H243). Contenu précis de ce panneau : À VÉRIFIER.

## 2. Panneau de configuration d'une étape

- Éléments confirmés : onglet/menu **Automation rules** avec **Add rule** (opt-in, order form) ; onglet **A/B test** ; Settings de page (SEO, Tracking). Sources : H235-what-is-two-step-order-form, H280-how-to-send-an-automatic-email-when-a-lead-subscribes, H218-how-to-create-a-split-test.

## 3. Liens et redirections entre étapes

Source : H330-how-to-link-between-the-pages-of-a-funnel.
- Opt-in vers étape suivante : bouton, « Action when button clicked » = « Submit form », redirection « To the next step ».
- Sales page vers order form : bouton « Open URL » + champ « URL » (l'URL du formulaire de commande).
- Automatismes après commande (sans configuration manuelle) : paiement validé vers upsell ; upsell accepté vers thank you ; upsell refusé vers downsell puis thank you ; sans thank you personnalisée, version par défaut.
- Actions de bouton (5) : Submit form, Show popup, Open URL (même onglet ou nouvel onglet), Next step URL, Download file (H170-how-to-set-up-a-button).
- Redirection après inscription : To the next step / To the custom URL (champ « Redirection URL ») / No redirection (H1602).
- Le schéma d'ordre exigé des étapes est une image non lisible : À VÉRIFIER.
- Comportement d'un refus d'upsell numérique sans bouton de refus : non précisé (H243). À VÉRIFIER.

## 4. Deadline (échéance par contact)

Source : H1574-how-to-create-a-deadline-for-a-sales-funnel.
- Accès : tunnel > **Deadline settings** > **Enable deadline feature**.
- Champs : **Deadline page expires in** (nombre de jours), **Time when deadline page should expire** (case + heure, facultatif), **Funnel step to redirect to once the deadline has expired**, sélection des pages concernées. Compte à rebours synchronisable : « Same as the deadline funnel settings ».
- Limites : uniquement pages « Order Form » et « Sales Page » ; le délai court à partir de l'inscription du contact (l'e-mail doit être connu) ; fuseau horaire du compte ; sans formulaire d'opt-in menant à la page, les pages restent accessibles après l'échéance.
- Autres types de compte à rebours (élément « countdown ») : mentionné en marketing (https://systeme.io/features), non détaillé. À VÉRIFIER.

## 5. Test A/B de pages

Source : H218-how-to-create-a-split-test.
- Préparation : 2 pages dans le même tunnel (variantes), redirection de chacune vers une **page objectif**.
- Écran : onglet **A/B test** > **Choose a variant** > champs **Variant page** et **Goal page** > Save > **Start A/B test**. Annulation possible en cas d'erreur de variante.
- Résultats : tableau de statistiques (colonnes non décrites).
- Limites : duplication possible, suppression/déplacement impossibles ; l'aperçu désactive la logique A/B (lien « View funnel step » affiche une page seule). Nombre de variantes, répartition du trafic, durée, seuil de significativité, désignation d'un gagnant : non documentés. À VÉRIFIER.

## 6. Activation d'un tunnel

- Un tunnel peut être inactif ; menu "..." > **Activate** > **Confirm**. Source : H277. Statut par défaut à la création, effets d'un tunnel inactif sur les URL publiques : non documentés. À VÉRIFIER.

## 7. Achat test

- Ouvrir l'order form > **View funnel step**, remplir, valider ; contrôler dans Sales > Transactions (filtres e-mail, produit, dates). Recommandation : prix bas (ex. 1 $). Stripe interdit les tests en mode Live avec de vraies coordonnées de paiement. Source : H151-how-to-make-a-test-purchase.
- Existence d'un mode test/sandbox : non documentée. À VÉRIFIER.

## 8. Pages d'accès restreint

- Les pages thank you et conference d'un webinaire evergreen ne sont pas atteignables par URL directe (H265).

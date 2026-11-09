// Famille « Finance et juridique » — 6 modèles. Voir docs/footer-builder/GUIDE_AJOUTER_UN_MODELE.md.
// Marques de démonstration FICTIVES (banque en ligne, mutuelle d'assurance, cabinet d'avocats, cabinet comptable, courtier, fintech). Les liens https://exemple.fr/… sont des liens D'EXEMPLE à remplacer ;
// numéros d'agrément, d'immatriculation (ORIAS, barreau), garanties, médiateurs, certifications, échéances et taux sont des VALEURS D'EXEMPLE clairement marquées « exemple » : aucun numéro n'est présenté comme réel.
// Les coordonnées et les mentions réelles viennent des Données de l'entreprise (contact, horaires, bizlegal).
const { modele, identifiantModele, ambiance, C, L, T, Z, A, accordeon } = require("../kit-conception");
const Moteur = require("../moteur");

const F = "finance-juridique";
const E = "https://exemple.fr";
const ids = (n, s) => identifiantModele(F, n, s);

// ── Aides locales (le kit ne les propose pas) ────────────────────────────────────────────────────────────────────────────────────────
const liens = (list, size = "14px", poids = "500") => (k, env, center) => k.col(list.map((it) => { const [label, url] = it.split(">"); return k.LINK(label, url, { fontSize: size, fontWeight: poids, ...(center ? { textAlign: "center" } : {}) }); }), { gap: "8px", alignItems: center ? "center" : "flex-start" });
const grand = (texte, px = 44, mob = 32, extra = {}) => (k, env, center) => k.H(texte, "2", { fontSize: `${px}px`, lineHeight: 1.1, ...(center ? { textAlign: "center" } : {}), ...extra }, undefined, { fontSize: `${mob}px` });
const para = (texte, extra = {}) => (k, env, center) => k.T(`<p>${texte}</p>`, { color: k.S.mute, fontSize: "14px", ...(center ? { textAlign: "center", marginLeft: "auto", marginRight: "auto" } : {}), ...extra });
const deux = (a, b) => (k, env, center) => k.row([k.B(a[0], a[1]), k.B(b[0], b[1], "outline", { borderColor: k.S.fg, color: k.S.fg })], { gap: "12px", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
const carte = (codes, st = {}) => (k, env, center) => k.card(codes.map((c) => Moteur.item(k, c, env, center)), { gap: "14px", ...st });
// Valeur d'exemple d'une mention réglementaire : titre, texte, puis rappel « exemple »
const mention = (titre, texte) => (k) => k.col([k.L(titre), k.T(`<p>${texte}</p>`, { fontSize: "13px", color: k.S.fg }), k.T("<p><em>Valeur d'exemple : à remplacer par votre mention réelle.</em></p>", { fontSize: "12px", color: k.S.mute })], { gap: "6px" });
// Encadré d'avertissement (bordure pleine, fond alterné)
const alerte = (titre, texte, st = {}) => (k) => k.col([k.L(titre), k.T(`<p>${texte}</p>`, { fontSize: "13px", color: k.S.fg })], { gap: "8px", backgroundColor: k.S.alt, borderStyle: "solid", borderWidth: "1.5px", borderColor: k.S.fg, borderRadius: k.S.radius, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", width: "100%", ...st });
// Pastilles NON cliquables de certification (exemples) : texte seul
const pastilles = (list) => (k, env, center) => k.row(list.map((t) => k.T(`<p><strong>${t}</strong></p>`, { fontSize: "12px", lineHeight: 1.3, borderStyle: "solid", borderWidth: "1px", borderColor: k.S.line, borderRadius: "999px", paddingTop: "6px", paddingBottom: "6px", paddingLeft: "12px", paddingRight: "12px", backgroundColor: k.S.bg })), { gap: "8px", flexWrap: "wrap", alignItems: "center", ...(center ? { justifyContent: "center" } : {}) });
// Liste datée « date ........ échéance » (échéances d'EXEMPLE)
const echeances = (lignes) => (k) => k.col(lignes.map(([d, t]) => k.row([k.T(`<p><strong>${d}</strong></p>`, { fontSize: "14px", color: k.S.accent, minWidth: "64px" }), k.T(`<p>${t}</p>`, { fontSize: "14px", flexGrow: 1 })], { gap: "16px", flexWrap: "nowrap", alignItems: "baseline", borderBottomStyle: "solid", borderBottomWidth: "1px", borderBottomColor: k.S.line, paddingBottom: "8px", width: "100%" })), { gap: "10px", width: "100%" });
// Chiffre-clé : grand nombre + légende (valeurs d'EXEMPLE)
const chiffres = (list) => (k) => k.row(list.map(([n, t]) => k.col([k.T(`<p>${n}</p>`, { fontFamily: k.S.head, fontSize: "40px", lineHeight: 1, color: k.S.accent }), k.T(`<p>${t}</p>`, { fontSize: "12px", color: k.S.mute })], { gap: "6px", flexBasis: "0px", flexGrow: 1, minWidth: "110px" })), { gap: "24px", alignItems: "flex-start", flexWrap: "wrap" });

// ── Ambiances propres à la famille (contrastes AA vérifiés à la création) ────────────────────────────────────────────────────────────
const banque = ambiance({ key: "fin-banque-lagune", label: "Bleu canard de banque", humeur: "light", fond: "#f4f8fa", texte: "#0c2b3a", accent: "#0b6a80", police: "font.public-sans", titres: "font.manrope" });
const assurance = ambiance({ key: "fin-assurance-brique", label: "Brique et crème de mutuelle", humeur: "light", fond: "#f4f7fc", texte: "#14213d", accent: "#2446a8", police: "font.figtree", titres: "font.lora" });
const avocat = ambiance({ key: "fin-avocat-bordeaux", label: "Bordeaux et or de cabinet", humeur: "dark", fond: "#1d1316", texte: "#efe7dc", accent: "#cba76b", police: "font.eb-garamond", titres: "font.cormorant-garamond" });
const compta = ambiance({ key: "fin-compta-terracotta", label: "Terracotta chaleureux", humeur: "soft", fond: "#f7f3fa", texte: "#2b1d36", accent: "#6a2c91", police: "font.nunito", titres: "font.young-serif" });
const courtier = ambiance({ key: "fin-courtier-vert", label: "Vert d'encre de courtier", humeur: "edit", fond: "#eef2ed", texte: "#14231c", accent: "#245c3d", police: "font.work-sans", titres: "font.roboto-slab" });
const fintech = ambiance({ key: "fin-fintech-nuit", label: "Nuit et lavande de fintech", humeur: "dark", fond: "#0b0c1f", texte: "#eeeefc", accent: "#a99bff", police: "font.sora", titres: "font.unbounded" });

module.exports = {
  key: "finance-juridique",
  label: "Finance et juridique",
  description: "Mentions réglementaires, numéros d'agrément, avertissements, trois niveaux de mentions légales.",
  target: 6,
  built: true,
  models: [
    modele({
      id: ids(1, "banque-en-ligne-securite"),
      name: "Banque en ligne et conseils de sécurité",
      family: F,
      description: "Pied sobre de banque en ligne : barre logo, menu et accès à l'espace client, quatre volets (accordéon mobile), encadré « ne communiquez jamais vos codes » avec certifications d'exemple, puis niveaux légaux.",
      tags: ["banque", "sécurité", "espace client", "sobre", "rassurant", "médiateur"],
      identity: banque,
      structure: { rows: [
        T(["logo:40"], ["menuh"], ["cta2|Ouvrir un compte|/inscription", "cta|Espace client|/connexion"], { pad: "md", rule: "none" }),
        A([
          ["Comptes et cartes", liens([`Compte courant>${E}/comptes`, `Cartes bancaires>${E}/cartes`, `Virements et prélèvements>${E}/virements`, `Tarifs (exemple)>${E}/tarifs`])],
          ["Épargne et crédits", liens([`Livrets (exemple)>${E}/epargne`, `Crédit immobilier>${E}/credit-immobilier`, `Crédit conso>${E}/credit-conso`, `Simulateurs>${E}/simulateurs`])],
          ["Aide et sécurité", liens([`Questions fréquentes>/faq`, `Cartes perdues ou volées>${E}/opposition`, `Signaler une fraude>${E}/fraude`, `Accessibilité>${E}/accessibilite`])],
          ["Nous joindre", "contact", "hours|-"],
        ], { pad: "lg", rule: "thin", min: "170px", gap: "32px" }),
        C([
          [8, alerte("Votre sécurité avant tout", "Votre banque ne vous demandera jamais votre code confidentiel, vos codes reçus par SMS ni de valider une opération par téléphone. En cas de doute, raccrochez et contactez-nous par votre espace sécurisé.")],
          [4, "head|Nos garanties (exemples)", pastilles(["Données chiffrées", "Authentification forte", "Dépôts garantis jusqu'à 100 000 € (exemple)"])],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "260px", gap: "32px" }),
        C([[12, mention("Établissement agréé", "Banque Cap Azur (marque fictive de démonstration), établissement de crédit agréé sous le numéro 00000 (exemple). Réclamation : écrivez-nous, puis saisissez le médiateur [nom du médiateur] (exemple)."), "legalinfo:inline", liens([`Réclamations (exemple)>${E}/reclamations`, `Accessibilité (exemple)>${E}/accessibilite`])]], { pad: "md", rule: "thin", min: "0px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "menu", "button", "link", "bizcontact", "bizhours", "text", "heading", "bizlegal", "copyright"],
    }, F),

    modele({
      id: ids(2, "assurance-sinistre-et-produits"),
      name: "Mutuelle d'assurance, sinistre et produits",
      family: F,
      description: "Pied de mutuelle : bandeau « un sinistre ? » avec boutons et téléphone, cinq colonnes par produit (accordéon mobile), puis trois blocs de mentions : informations légales, vos données, réclamations.",
      tags: ["assurance", "sinistre", "produits", "réclamations", "colonnes"],
      identity: assurance,
      structure: { rows: [
        C([
          [7, grand("Un sinistre ? Une question ? Nous sommes là.", 40, 30, { maxWidth: "560px" }), para("Mutuelle Rive Claire (marque fictive de démonstration). Déclarez en ligne en quelques minutes, un conseiller vous rappelle.", { fontSize: "15px", maxWidth: "460px" })],
          [5, deux(["Déclarer un sinistre", `${E}/sinistre`], ["Prendre rendez-vous", "/contact"]), "phone"],
        ], { bg: "accent", pad: "lg", rule: "none", min: "280px", gap: "40px" }),
        A([
          ["Auto et moto", liens([`Assurance auto>${E}/auto`, `Assurance moto>${E}/moto`, `Assistance 24 h sur 24>${E}/assistance`, `Devis en ligne>${E}/devis`])],
          ["Habitation", liens([`Locataire>${E}/habitation/locataire`, `Propriétaire>${E}/habitation/proprietaire`, `Dégât des eaux>${E}/degat-des-eaux`, `Devis en ligne>${E}/devis`])],
          ["Santé", liens([`Complémentaire santé>${E}/sante`, `Remboursements>/connexion`, `Réseau de soins>${E}/reseau`, `Tiers payant>${E}/tiers-payant`])],
          ["Prévoyance", liens([`Garantie décès>${E}/deces`, `Arrêt de travail>${E}/arret-travail`, `Épargne retraite>${E}/retraite`, `Obsèques>${E}/obseques`])],
          ["Professionnels", liens([`Multirisque pro>${E}/pro`, `Responsabilité civile>${E}/rc-pro`, `Flotte automobile>${E}/flotte`, `Espace pro>/connexion`])],
        ], { pad: "lg", rule: "none", min: "150px", gap: "28px" }),
        C([
          [4, "head|Informations légales", "legalinfo", para("Entreprise régie par le Code des assurances, contrôlée par l'autorité de contrôle prudentiel (mention d'exemple, à remplacer).", { fontSize: "12px" })],
          [4, "head|Vos données", liens([`Confidentialité>${E}/confidentialite`, `Accessibilité>${E}/accessibilite`, `Exercer mes droits>${E}/droits`, `Conditions générales>${E}/cgu`])],
          [4, "head|Réclamations et médiation", para("Une réclamation ? Écrivez-nous d'abord ; sans réponse sous deux mois, saisissez [nom du médiateur] (valeur d'exemple)."), liens([`Faire une réclamation>${E}/reclamations`, `Médiateur de l'assurance (exemple)>${E}/mediateur`])],
        ], { pad: "lg", bg: "alt", rule: "thin", min: "230px", gap: "40px" }),
        L(["copy"], ["socials:facebook+linkedin+youtube|plain", "legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["heading", "text", "button", "bizphone", "link", "bizlegal", "social", "copyright"],
    }, F),

    modele({
      id: ids(3, "cabinet-avocats-discret"),
      name: "Cabinet d'avocats élégant et discret",
      family: F,
      description: "Pied de cabinet d'avocats : signature centrée et menu en capitales, trois colonnes (nous rencontrer, domaines, secret professionnel), avertissement d'information et ligne de bas de page à trois zones.",
      tags: ["avocats", "cabinet", "élégant", "discret", "avertissement", "secret professionnel"],
      identity: avocat,
      structure: { rows: [
        Z(["logo:52", para("Cabinet Valmont et Associés (marque fictive de démonstration). Avocats au barreau de [votre ville] (exemple).", { fontSize: "14px", maxWidth: "520px" }), "menuh:caps"], { pad: "xl", rule: "double", gap: "22px", max: "860px" }),
        C([
          [4, "head|Nous rencontrer", "contact", "hours|-"],
          [4, "head|Domaines d'intervention", liens([`Droit des affaires>${E}/affaires`, `Droit de la famille>${E}/famille`, `Droit pénal>${E}/penal`, `Droit immobilier>${E}/immobilier`, `Contentieux>${E}/contentieux`])],
          [4, "head|Votre confidentialité", para("Nos échanges sont couverts par le secret professionnel. Ne nous envoyez aucune pièce confidentielle par un formulaire ouvert : demandez d'abord un échange sécurisé."), "cta2|Demander un rendez-vous|/contact"],
        ], { pad: "lg", rule: "thin", min: "230px", gap: "48px" }),
        Z([para("Les informations de ce site sont d'ordre général et ne constituent pas un conseil juridique. L'envoi d'un message ne crée pas de relation d'avocat à client. Honoraires librement convenus (exemple).", { fontSize: "12px", maxWidth: "720px" }), "legalinfo:inline", (k, env, c) => k.row([k.LINK("Déontologie (exemple)", `${E}/deontologie`, { fontSize: "13px" }), k.LINK("Réclamations (exemple)", `${E}/reclamations`, { fontSize: "13px" })], { gap: "20px", justifyContent: "center" })], { pad: "md", bg: "alt", rule: "thin", gap: "10px", max: "860px" }),
        L(["copy"], ["legallinks", "top"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "menu", "text", "heading", "bizcontact", "bizhours", "button", "bizlegal", "link", "copyright", "backtotop"],
    }, F),

    modele({
      id: ids(4, "cabinet-comptable-echeances"),
      name: "Cabinet comptable, échéances et rendez-vous",
      family: F,
      description: "Pied chaleureux de cabinet comptable : promesse et boutons à gauche, carte des prochaines échéances fiscales (exemples), trois cartes (espace client, joindre, lettre d'information) et mentions de l'ordre.",
      tags: ["comptabilité", "échéances", "chaleureux", "espace client", "lettre d'information"],
      identity: compta,
      structure: { rows: [
        C([
          [6, "logo:44", grand("Vos comptes en ordre, vos soirées libres.", 42, 30, { maxWidth: "500px" }), deux(["Prendre rendez-vous", "/contact"], ["Espace client", "/connexion"])],
          [6, carte(["head|Prochaines échéances (exemples)", echeances([["15 janv.", "Acompte de TVA du trimestre"], ["28 fév.", "Déclaration des revenus des indépendants"], ["15 mai", "Dépôt des comptes annuels"], ["30 juin", "Liasse fiscale"]]), "text|Dates d'exemple : vérifiez le calendrier officiel de l'administration."])],
        ], { pad: "xl", min: "290px", gap: "48px" }),
        C([
          [4, "head|Déposer mes pièces", para("Factures, relevés et justificatifs : un seul endroit sécurisé pour tout envoyer."), "cta2|Accéder à mon espace|/connexion"],
          [4, "head|Nous joindre", "contact", "hours|-", "socials:linkedin+facebook|plain"],
          [4, "newsletter|La lettre du cabinet|Une fois par mois : les échéances, les nouveautés fiscales et nos conseils."],
        ], { pad: "lg", cards: true, bg: "alt", rule: "thin", min: "250px", gap: "24px" }),
        Z([para("Cabinet Équilibre Conseil (marque fictive de démonstration), société d'expertise comptable inscrite au tableau de l'ordre de [votre région], numéro d'exemple 00-000000 (valeur d'exemple).", { fontSize: "12px", maxWidth: "760px" })], { pad: "sm", rule: "thin", max: "860px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "heading", "text", "button", "bizcontact", "bizhours", "social", "emailsubscribe", "copyright", "bizlegal"],
    }, F),

    modele({
      id: ids(5, "courtier-avertissement-reglementaire"),
      name: "Courtier et encadré d'avertissement",
      family: F,
      description: "Pied de courtier : quatre colonnes (société, courtage, simulateurs, contact), grand encadré d'avertissement réglementaire à bordure pleine, immatriculation et médiateur d'exemple, puis liens légaux en pile.",
      tags: ["courtier", "avertissement", "orias", "réglementaire", "médiateur", "simulateurs"],
      identity: courtier,
      structure: { rows: [
        C([
          [3, "logo:40", para("Courtage Boussole (marque fictive de démonstration). Comparer, négocier, vous accompagner : prêts, assurances et placements.", { maxWidth: "260px" }), "badge|Indépendant (exemple)"],
          [3, "head|Nos courtages", liens([`Prêt immobilier>${E}/pret-immobilier`, `Rachat de crédit>${E}/rachat-credit`, `Assurance emprunteur>${E}/emprunteur`, `Placements>${E}/placements`])],
          [3, "head|Simulateurs", liens([`Capacité d'emprunt>${E}/capacite`, `Mensualités>${E}/mensualites`, `Frais de notaire>${E}/notaire`, `Questions fréquentes>/faq`])],
          [3, "head|Parler à un courtier", "contact", "hours|-", "cta|Être rappelé|/contact"],
        ], { pad: "xl", min: "200px", gap: "36px" }),
        C([[12, alerte("Avertissement réglementaire", "Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant de vous engager. Tout investissement comporte un risque de perte en capital ; les performances passées ne préjugent pas des performances futures. Texte d'exemple, à remplacer par vos mentions obligatoires.")]], { pad: "lg", bg: "alt", rule: "thin", max: "1000px", min: "0px" }),
        C([
          [6, mention("Immatriculation", "Intermédiaire en opérations de banque et en assurance, immatriculé sous le numéro 00 000 000 (exemple) au registre des intermédiaires."), "legalinfo"],
          [6, mention("Garantie et médiation", "Garantie financière et assurance de responsabilité civile professionnelle conformes à la loi. Médiateur : [nom du médiateur], [adresse du médiateur].")],
        ], { pad: "md", rule: "thin", min: "260px", gap: "40px" }),
        L(["copy"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["sitelogo", "text", "heading", "link", "bizcontact", "bizhours", "button", "bizlegal", "copyright"],
    }, F),

    modele({
      id: ids(6, "fintech-moderne-statut"),
      name: "Fintech moderne et statut du service",
      family: F,
      description: "Pied sombre de fintech : grande accroche avec lettre d'information, chiffres-clés d'exemple et volets produit, développeurs, société (accordéon mobile), grand nom de marque en filigrane, puis agrément et avertissement.",
      tags: ["fintech", "moderne", "sombre", "chiffres", "statut", "développeurs"],
      identity: fintech,
      structure: { rows: [
        C([
          [6, grand("L'argent, enfin simple.", 56, 36, { maxWidth: "480px" }), para("Payvia (marque fictive de démonstration) : comptes, paiements et cartes pour les équipes qui vont vite.", { fontSize: "15px", maxWidth: "420px" }), chiffres([["2 min", "pour ouvrir un compte (exemple)"], ["0 €", "de frais de tenue (exemple)"], ["24/7", "support en ligne (exemple)"]])],
          [6, "newsletter|Les nouveautés produit|Une lettre courte, une fois par mois, désinscription en un clic."],
        ], { pad: "xl", min: "290px", gap: "56px" }),
        A([
          ["Produit", liens([`Comptes>${E}/comptes`, `Cartes>${E}/cartes`, `Paiements>${E}/paiements`, `Tarifs (exemple)>${E}/tarifs`])],
          ["Développeurs", liens([`Documentation>${E}/docs`, `Référence de l'API>${E}/api`, `État du service>${E}/statut`, `Sécurité>${E}/securite`])],
          ["Société", liens([`À propos>${E}/a-propos`, `Carrières>${E}/carrieres`, `Presse>${E}/presse`, `Contact>/contact`])],
          ["Nous joindre", "contact", "hours|-"],
        ], { pad: "lg", rule: "thin", min: "170px", gap: "32px" }),
        Z([(k) => k.T("<p>PAYVIA</p>", { fontFamily: k.S.head, fontSize: "112px", lineHeight: 1, letterSpacing: "4px", color: k.S.accent, textAlign: "center" }, undefined, { fontSize: "56px" })], { pad: "xs", rule: "none", bg: "alt" }),
        C([
          [6, mention("Agrément", "Établissement de paiement agréé sous le numéro 00000 (exemple). Vos fonds sont protégés par cantonnement."), "legalinfo:inline"],
          [6, alerte("À savoir", "Les moyens de paiement et de crédit engagent votre responsabilité. Les chiffres affichés sont des exemples, sans valeur contractuelle.", { backgroundColor: "transparent" })],
        ], { pad: "lg", rule: "thin", min: "260px", gap: "40px" }),
        L(["copy", "socials:linkedin+x+youtube|plain"], ["legallinks"], { pad: "sm", rule: "thin" }),
      ] },
      widgets: ["heading", "text", "emailsubscribe", "link", "bizlegal", "social", "copyright"],
    }, F),
  ],
};

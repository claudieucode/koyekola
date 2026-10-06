// Modèles de tunnels : chaque modèle crée les VRAIES étapes (pages du moteur, en brouillon, faites de vraies sections ;
// formation réelle du catalogue). Aucun faux produit ni faux prix. Les modèles qui demandent un paiement (bon de
// commande, offre complémentaire, offre supérieure, panier abandonné…) arrivent avec le paiement (phase 9) ; ceux qui
// demandent un agenda de réservation ou un espace membre ne sont pas proposés : ces outils n'existent pas encore.
const step = (type, name, template) => ({ type, name, ...(template ? { template } : {}) });

const TEMPLATES = [
  { key: "aimant", category: "Formation", name: "Aimant à prospects", description: "Une ressource offerte contre l'adresse e-mail, puis une page de remerciement.",
    steps: [step("optin", "Capture", "lead"), step("thankyou", "Remerciement", "merci")] },
  { key: "webinaire", category: "Formation", name: "Webinaire", description: "Inscription au webinaire, puis confirmation.",
    steps: [step("webinar", "Inscription", "webinaire"), step("thankyou", "Confirmation", "merci")] },
  { key: "vente-formation", category: "Formation", name: "Vente d'une formation", description: "Page de vente, puis la vraie page de la formation (achat ou inscription).", requiresCourse: true,
    steps: [step("sales", "Page de vente", "vente"), step("course", "Formation")] },
  { key: "lancement", category: "Formation", name: "Lancement (liste d'attente)", description: "Annonce et liste d'attente, puis confirmation.",
    steps: [step("optin", "Liste d'attente", "bientot"), step("thankyou", "Confirmation", "merci")] },
  { key: "leads", category: "Business", name: "Génération de prospects", description: "Présentation de l'offre, formulaire, remerciement.",
    steps: [step("landing", "Présentation", "produit"), step("optin", "Inscription", "inscription"), step("thankyou", "Remerciement", "merci")] },
  { key: "consultation", category: "Business", name: "Consultation", description: "Demande de rendez-vous, puis confirmation.",
    steps: [step("optin", "Demande de rendez-vous", "consultation"), step("thankyou", "Confirmation", "merci")] },
  { key: "devis", category: "Business", name: "Demande de devis", description: "Présentation du service avec formulaire de demande, puis remerciement.",
    steps: [step("optin", "Demande de devis", "service"), step("thankyou", "Remerciement", "merci")] },
  { key: "newsletter", category: "Créateur", name: "Newsletter", description: "Inscription à la lettre, puis bienvenue.",
    steps: [step("optin", "Inscription", "newsletter"), step("thankyou", "Bienvenue", "merci")] },
  { key: "ebook", category: "Créateur", name: "Guide ou ebook offert", description: "Ressource à télécharger contre l'inscription, puis remerciement.",
    steps: [step("download", "Téléchargement", "telechargement"), step("thankyou", "Remerciement", "merci")] },
];

const get = (key) => TEMPLATES.find((t) => t.key === key) || null;
const catalog = () => TEMPLATES.map(({ key, category, name, description, requiresCourse, steps }) => ({ key, category, name, description, requiresCourse: Boolean(requiresCourse), steps: steps.map((s) => s.name) }));

module.exports = { TEMPLATES, get, catalog };

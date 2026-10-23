// Intégrations DÉJÀ présentes dans Kolakisa, gérées par leur propre module : le catalogue en montre l'état RÉEL (lu à leur configuration) et renvoie vers leur écran.
// Elles ne sont PAS dupliquées ici (aucune clé n'est copiée ni redemandée) : une migration vers le coffre commun se fera connecteur par connecteur, sans casser leurs écrans.
const safe = (fn, fallback) => { try { return fn(); } catch { return fallback; } };

module.exports = [
  {
    id: "email-sending", kind: "external", name: "E-mail (envoi)", provider: "SMTP / Resend", category: "email", mark: "@",
    description: "Envoi des e-mails de campagnes et des messages du CMS.", manage: { label: "Ouvrir Envoi", href: "/marketing/envoi" }, docsUrl: "https://resend.com/docs/api-reference/introduction",
    managedBy: "Marketing → Envoi (fournisseur, clés chiffrées, e-mail de test) et Marketing → Domaines (SPF, DKIM, DMARC)",
    status(ctx) {
      const c = safe(() => require("../../marketing/sending/config").getSendingConfig(ctx), null);
      if (!c) return { state: "unknown", detail: "État indisponible." };
      if (c.provider === "console") return { state: "unconfigured", detail: "Aucun fournisseur choisi : rien ne part (mode console)." };
      if (c.provider === "smtp") return { state: process.env.SMTP_HOST ? "configured" : "unconfigured", detail: process.env.SMTP_HOST ? "SMTP du serveur (variables d'hébergement)." : "SMTP non configuré sur le serveur." };
      return { state: c.apiKeySet ? "configured" : "unconfigured", detail: c.apiKeySet ? `Fournisseur « ${c.provider} », clé enregistrée (chiffrée).` : `Fournisseur « ${c.provider} » sans clé.` };
    },
  },
  {
    id: "sms-twilio", kind: "external", name: "SMS (Twilio)", provider: "Twilio", category: "messaging", mark: "T",
    description: "Envoi de SMS de campagnes (module SMS).", manage: { label: "Ouvrir SMS", href: "/marketing/sms" }, docsUrl: "https://www.twilio.com/docs/sms/api",
    managedBy: "Marketing → SMS (identifiants Twilio, jeton chiffré)",
    status(ctx) {
      const c = safe(() => require("../../marketing/sms/config").getSmsConfig(ctx), null);
      if (!c) return { state: "unknown", detail: "État indisponible." };
      const ok = Boolean(c.accountSid) && c.authTokenSet;
      return { state: ok ? "configured" : "unconfigured", detail: ok ? "Identifiants Twilio enregistrés (jeton chiffré)." : "Identifiants Twilio incomplets." };
    },
  },
  {
    id: "stripe", kind: "external", name: "Stripe", provider: "Stripe", category: "payments", mark: "S",
    description: "Paiements des formations et offres (module Commerce).", manage: { label: "Voir la documentation", href: "https://docs.stripe.com/api" }, docsUrl: "https://docs.stripe.com/api",
    managedBy: "Variables d'hébergement STRIPE_SECRET_KEY et STRIPE_WEBHOOK_SECRET (jamais modifiables depuis le CMS)",
    status() {
      const key = Boolean(process.env.STRIPE_SECRET_KEY), hook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
      return { state: key ? "configured" : "unconfigured", detail: key ? `Clé présente côté serveur${hook ? " ; secret de webhook présent" : " ; secret de webhook absent"}.` : "Aucune clé Stripe sur le serveur : les paiements réels sont désactivés." };
    },
  },
];

// Pages des modèles d'e-mails : liste, création, éditeur par blocs, aperçu, enregistrement, historique.
const express = require("express");
const templates = require("../templates");
const { STARTERS } = require("../templates/starters");
const library = require("../templates/library");
const { CATEGORIES } = require("../templates/categories");
const { listCourses } = require("../bridge/catalog");
const { MarketingError } = require("../errors");
const { sendTestEmail, teamRecipients } = require("../templates/testSend");
const inspect = require("../templates/inspect");
const { missingImages } = require("../templates/lint");
const { getSendingConfig } = require("../sending/config");
const { markdownToRich } = require("../templates/richtext");
const { FONTS } = require("../templates/blocks");
// Ouverture dans l'éditeur : un texte (ou des colonnes) encore en Markdown est présenté en texte riche. Rien n'est
// modifié en base tant que l'auteur n'enregistre pas (le rendu Markdown reste valable jusque-là).
function forEditor(blocks) {
  return (blocks || []).map((b) => {
    if (b && b.type === "text" && typeof b.html !== "string" && typeof b.markdown === "string") { const { markdown, ...rest } = b; return { ...rest, html: markdownToRich(markdown) }; }
    if (b && b.type === "columns" && typeof b.leftHtml !== "string" && typeof b.left === "string") { const { left, right, ...rest } = b; return { ...rest, leftHtml: markdownToRich(left), rightHtml: markdownToRich(right) }; }
    return b;
  });
}
const { testChannel } = require("../sending/config");
const { createRateLimiter } = require("../../middlewares/security");
const { attempt, need, safeJson } = require("./kit");
const { icon } = require("../../utils/icons");
const multer = require("multer");
const media = require("../media");

// Fichiers de la médiathèque : en mémoire le temps de vérifier leur contenu (le type est lu dans le fichier lui-même)
const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX_DOCUMENT, files: 1 } });

// Blocs de l'éditeur : libellé, icône (utils/icons.js, flat), description courte. Seuls les blocs que le moteur sait
// rendre (templates/blocks.js#TYPES) ; aucun bloc « HTML libre » ni « code » (contenu non maîtrisé dans un e-mail).
const BLOCKS = {
  heading: ["Titre", "type", "Un titre de section"], text: ["Texte", "alignLeft", "Paragraphes, gras, liens, listes"], quote: ["Citation", "quote", "Une phrase mise en avant"], list: ["Liste", "list", "Puces, numéros ou coches"],
  image: ["Image", "image", "Depuis la médiathèque ou une adresse"], video: ["Vidéo", "video", "Miniature cliquable vers la vidéo"],
  button: ["Bouton", "mousePointer", "Un appel à l'action"], social: ["Réseaux sociaux", "share2", "Liens vers vos réseaux"], course: ["Formation", "graduation", "Une formation du catalogue"],
  columns: ["Deux colonnes", "columns", "Deux textes côte à côte, largeurs réglables"], divider: ["Séparateur", "minus", "Une ligne fine"], spacer: ["Espace", "moveVertical", "Un espace vertical"],
  link: ["Lien", "link", "Un lien texte (site, PDF, e-mail)"], coupon: ["Coupon", "tag", "Un code promo mis en valeur"],
  posts: ["Articles", "fileText", "Les derniers articles du blog (rempli à chaque envoi d'une campagne RSS)"],
  survey: ["Sondage", "listChecks", "Un bouton (et la 1re question) vers un sondage, avec le lien personnel de chaque destinataire"],
};
// Ajouts en un clic (pas des types de blocs) : préréglages et ensembles prêts à l'emploi, construits avec les blocs ci-dessus
const PRESETS = { gif: ["GIF animé", "image", "Une image animée (GIF) de la médiathèque"], cta: ["Appel à l'action", "zap", "Titre, texte et bouton"], offer: ["Offre", "coin", "Titre, coupon et bouton"] };
// Icônes utilisées par le script de l'éditeur (SVG du registre fixe, jamais de texte saisi)
const EDITOR_ICONS = ["listChecks", "grip", "zap", "coin", "tag", "list", "copy", "eye", "eyeOff", "trash", "arrowUp", "arrowDown", "edit", "grip", "upload", "plus", "search", "alertTriangle", "checkCircle", "close", "image", "fileText", "link", "maximize", "monitor", "tablet", "smartphone", "layers", "palette", "braces", "settings", "undo", "redo", "moreHorizontal", "alertCircle", "chevronRight", "info", "externalLink", "alignLeft", "alignCenter", "alignRight", "alignJustify", "listOrdered", "indentMore", "indentLess", "highlighter", "clearFormat", "borderBox", "spacing", "chevronDown", "type", "video"];
// Palette de l'éditeur : groupes et blocs (libellés français)
const PALETTE = [
  { title: "Texte", blocks: [["heading", "Titre"], ["text", "Texte"], ["quote", "Citation"], ["list", "Liste"]] },
  { title: "Médias", blocks: [["image", "Image"], ["video", "Vidéo"]], presets: [["gif", "GIF animé"]] },
  { title: "Actions", blocks: [["button", "Bouton"], ["link", "Lien"], ["social", "Réseaux sociaux"]] },
  { title: "Mise en page", blocks: [["columns", "Deux colonnes"], ["divider", "Séparateur"], ["spacer", "Espace"]] },
  { title: "Contenu", blocks: [["course", "Formation"], ["posts", "Articles"], ["survey", "Sondage"], ["coupon", "Coupon"]], presets: [["cta", "Appel à l'action"], ["offer", "Offre"]] },
];
const KIND_LABEL = { marketing: "Marketing", transactional: "Transactionnel" };
const TABS_ALL = "";

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

// Réponse JSON pour les appels de l'éditeur : erreur métier → 400 (409 en cas de conflit, 404 si introuvable)
function jsonError(res, error) {
  if (!(error instanceof MarketingError)) throw error;
  const status = error.code === "conflict" ? 409 : error.code === "not_found" ? 404 : 400;
  return res.status(status).json({ error: error.message });
}

module.exports = ({ db }) => {
  const router = express.Router();
  const testLimiter = createRateLimiter(10, 60 * 60 * 1000); // 10 e-mails de test par heure et par utilisateur

  router.get("/modeles", need("templates.read"), (req, res) => {
    const { ctx } = req.mk;
    const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const q = text(req.query.q, 100);
    const categorie = typeof req.query.categorie === "string" && (req.query.categorie === "none" || CATEGORIES.some((c) => c.key === req.query.categorie)) ? req.query.categorie : TABS_ALL;
    const type = req.query.type === "marketing" || req.query.type === "transactional" ? req.query.type : "";
    const rows = templates.searchTemplates(ctx, { q, kind: type || undefined, category: categorie || undefined }, { sort: req.query.tri, dir: req.query.sens });
    const sortKey = ["name", "kind", "category", "updated"].includes(req.query.tri) ? req.query.tri : "updated";
    const dirKey = req.query.sens === "asc" || req.query.sens === "desc" ? req.query.sens : (sortKey === "updated" ? "desc" : "asc");
    const view = { ...(q && { q }), ...(categorie && { categorie }), ...(type && { type }), ...(req.query.tri && { tri: sortKey, sens: dirKey }) };
    const url = (changes = {}) => {
      const merged = { ...view, ...changes };
      const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => [k, String(v)])).toString();
      return `/marketing/modeles${qs ? `?${qs}` : ""}`;
    };
    const counts = templates.templateCategoryCounts(ctx);
    res.render("marketing/templates", {
      title: "Modèles", active: "templates", templates: rows, rows, counts, categories: CATEGORIES, categorie, type, q, view, url, sortKey, dirKey, hasFilters: Boolean(q || categorie || type),
      starterGroups: library.starterLibrary(), address: templates.getOrgProfile(ctx).address, kindLabel: KIND_LABEL,
    });
  });

  // Bibliothèque : tous les modèles de départ par catégories, avec aperçu réel (dans une iframe isolée)
  router.get("/modeles/bibliotheque", need("templates.read"), (req, res) => {
    res.render("marketing/template-library", { title: "Bibliothèque de modèles", active: "templates", groups: library.starterLibrary(), kindLabel: KIND_LABEL });
  });

  // Contenu de l'iframe d'aperçu : document HTML complet, sans script, chargé uniquement par le même site
  router.get("/modeles/bibliotheque/:key/apercu", need("templates.read"), (req, res) => {
    if (!library.starterOf(req.params.key)) return res.status(404).render("error", { message: "Modèle de départ introuvable." });
    const preview = library.previewStarter(req.mk.ctx, req.params.key);
    res.set({
      "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
      "X-Frame-Options": "SAMEORIGIN", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, max-age=300",
    });
    res.send(preview.html);
  });

  router.post("/modeles", need("templates.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/modeles/${created.id}` : "/marketing/modeles"), () => {
      const starter = library.starterOf(req.body.starter);
      if (!starter) throw new MarketingError("invalid_field", "Modèle de départ inconnu.");
      const kind = starter.template.kind === "transactional" || req.body.kind === "transactional" ? "transactional" : "marketing";
      created = templates.createTemplate(req.mk.ctx, { ...starter.template, name: req.body.name, kind, category: starter.category });
      return "Modèle créé : personnalisez-le puis enregistrez.";
    });
  });

  router.post("/modeles/adresse", need("settings.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/modeles", () => {
      const address = templates.setOrgAddress(req.mk.ctx, req.body.address);
      return address ? "Adresse enregistrée : elle apparaît dans le pied de page des e-mails marketing." : "Adresse effacée.";
    }));

  // Aperçu d'un brouillon (rendu réel avec données d'exemple ou d'un contact) : aucun envoi, aucun jeton réel
  router.post("/modeles/apercu", need("templates.read"), (req, res, next) => {
    try {
      const contact = req.body.contactId ? { id: intOrNull(req.body.contactId) } : null;
      if (contact && !contact.id) throw new MarketingError("invalid_field", "Contact invalide.");
      const full = req.body.mode === "preview"; // fenêtre « Aperçu » : rendu réel + informations et vérifications
      const r = templates.previewTemplate(req.mk.ctx, req.body.template, { contact, annotate: req.body.annotate === true, tolerant: full });
      const body = { subject: r.subject, html: r.html, text: r.text, warnings: r.warnings, blockErrors: r.blockErrors || [] };
      if (full) {
        const cfg = getSendingConfig(req.mk.ctx);
        const from = cfg.from || require("../../utils/mailer").fromAddress() || "";
        Object.assign(body, {
          preheader: inspect.preheaderOf(r.html),
          sender: from ? { address: from, provider: cfg.provider || "smtp" } : null,
          recipient: r.contact ? { email: r.contact.email, name: [r.contact.first_name, r.contact.last_name].filter(Boolean).join(" "), sample: false } : { email: r.data.contact.email, name: r.data.contact.full_name, sample: true },
          links: inspect.analyzeLinks(r.html),
          size: inspect.sizeInfo(r.html),
          mergeTags: inspect.mergeTags(r.variables, r.data),
          missingImages: missingImages(r.html),
        });
      }
      res.json(body);
    } catch (error) {
      // Pour l'aperçu, toute erreur métier (contact ou contenu invalide) est une erreur de saisie : 400
      if (error instanceof MarketingError) return res.status(400).json({ error: error.message });
      next(error);
    }
  });

  const load = (req, res) => {
    const id = intOrNull(req.params.id);
    const template = id ? templates.getTemplate(req.mk.ctx, id) : null;
    if (!template) res.status(404).render("error", { message: "Modèle introuvable." });
    return template;
  };

  // Aperçu d'un modèle enregistré (vignette « Contenu » de la liste de contrôle d'une campagne) : même document
  // isolé que l'aperçu de la bibliothèque — sans script, données d'exemple, chargé uniquement par le même site
  router.get("/modeles/:id/apercu", need("templates.read"), (req, res, next) => {
    const template = load(req, res);
    if (!template) return;
    try {
      const contactId = req.query.contact ? intOrNull(req.query.contact) : null;
      const preview = templates.previewTemplate(req.mk.ctx, template, { contact: contactId ? { id: contactId } : null });
      res.set({
        "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; img-src 'self' https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'",
        "X-Frame-Options": "SAMEORIGIN", "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store",
      });
      res.send(preview.html);
    } catch (error) {
      if (error instanceof MarketingError) return res.status(422).render("error", { message: error.message });
      next(error);
    }
  });

  router.get("/modeles/:id", need("templates.read"), (req, res) => {
    const template = load(req, res);
    if (!template) return;
    const { ctx } = req.mk;
    const data = {
      readOnly: !req.mk.can("templates.write"),
      template: { id: template.id, name: template.name, kind: template.kind, category: template.category, subject: template.subject, preheader: template.preheader, theme: template.theme, footer: template.footer, blocks: forEditor(template.blocks), version: template.version },
      variables: templates.variableCatalog(ctx), categories: CATEGORIES, courses: listCourses(ctx),
      surveys: ctx.db.prepare("SELECT id, name, status FROM mk_surveys WHERE organization_id = ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId),
      versions: templates.listVersions(ctx, template.id),
      blocks: Object.fromEntries(Object.entries(BLOCKS).map(([type, [label, ic, description]]) => [type, { label, icon: icon(ic, { size: 18 }), description }])),
      fonts: Object.keys(FONTS),
      icons: Object.fromEntries(EDITOR_ICONS.map((n) => [n, icon(n, { size: 16 })])),
      contacts: db.prepare("SELECT id, email FROM mk_contacts WHERE organization_id = ? ORDER BY id DESC LIMIT 20").all(ctx.organizationId),
    };
    res.render("marketing/template-editor", {
      title: template.name, active: "templates", template, data: safeJson(data), readOnly: data.readOnly, versions: data.versions, palette: PALETTE, blockInfo: BLOCKS, presetInfo: PRESETS, categories: CATEGORIES,
      recipients: teamRecipients(ctx), currentEmail: String(req.session.user.email || "").toLowerCase(), contacts: data.contacts,
    });
  });

  router.post("/modeles/:id", need("templates.write"), (req, res, next) => {
    const id = intOrNull(req.params.id);
    try {
      if (!id) throw new MarketingError("not_found", "Modèle introuvable.");
      if (!Number.isInteger(req.body.version)) throw new MarketingError("invalid_field", "Version du modèle manquante : rechargez la page.");
      if (!req.body.template || typeof req.body.template !== "object") throw new MarketingError("invalid_field", "Contenu du modèle manquant.");
      const saved = templates.updateTemplate(req.mk.ctx, id, req.body.template, { expectedVersion: req.body.version, autosave: req.body.autosave === true });
      // Instantanés des blocs « formation » pris dans le catalogue : l'éditeur les garde tels quels (le prix ne change pas tout seul)
      const courseSnapshots = Object.fromEntries(saved.blocks.filter((b) => b.type === "course" && b.snapshot).map((b) => [b.id, b.snapshot]));
      res.json({ ok: true, version: saved.version, warnings: templates.renderTemplate(req.mk.ctx, id, null).warnings, courseSnapshots });
    } catch (error) {
      try { jsonError(res, error); } catch (e) { next(e); }
    }
  });

  // ---------- Médiathèque (images et PDF des e-mails) ----------
  router.get("/medias", need("templates.read"), (req, res) => {
    res.json(media.listMedia(req.mk.ctx, { q: req.query.q, kind: req.query.type, limit: req.query.limite, offset: req.query.depuis }));
  });
  router.post("/medias", need("templates.write"), (req, res, next) => {
    mediaUpload.single("file")(req, res, (uploadError) => {
      if (uploadError) {
        const message = uploadError.code === "LIMIT_FILE_SIZE" ? `Fichier trop lourd : ${media.MAX_DOCUMENT / 1048576} Mo au plus (5 Mo pour une image).` : "Envoi du fichier impossible.";
        return res.status(400).json({ error: message });
      }
      try {
        if (!req.file) throw new MarketingError("invalid_field", "Aucun fichier reçu.");
        // multer lit le nom du fichier en latin-1 : « Bannière » arriverait en « BanniÃ¨re » ; on le relit en UTF-8
        const utf8 = Buffer.from(req.file.originalname, "latin1").toString("utf8");
        const originalName = utf8.includes("\uFFFD") ? req.file.originalname : utf8;
        const saved = media.saveUpload(req.mk.ctx, { buffer: req.file.buffer, originalName, declaredType: req.file.mimetype });
        res.status(201).json({ media: saved });
      } catch (error) {
        try { jsonError(res, error); } catch (e) { next(e); }
      }
    });
  });
  router.post("/medias/:id", need("templates.write"), (req, res, next) => {
    try { res.json({ media: media.updateMedia(req.mk.ctx, intOrNull(req.params.id), req.body || {}) }); } catch (error) { try { jsonError(res, error); } catch (e) { next(e); } }
  });
  router.post("/medias/:id/supprimer", need("templates.write"), (req, res, next) => {
    try { res.json({ ok: media.deleteMedia(req.mk.ctx, intOrNull(req.params.id)) }); } catch (error) { try { jsonError(res, error); } catch (e) { next(e); } }
  });

  // E-mail de test vers un membre de l'équipe (jamais une adresse libre)
  router.post("/modeles/:id/test", need("templates.write"), (req, res, next) => {
    const template = load(req, res);
    if (!template) return;
    const back = `/marketing/modeles/${template.id}`;
    const key = String(req.session.user.id);
    // Depuis l'aperçu (fetch) : réponse JSON ; sinon message affiché après redirection (formulaire classique)
    const wantsJson = /application\/json/.test(req.get("Accept") || "");
    const reply = (type, text, status) => { if (wantsJson) return res.status(status || (type === "ok" ? 200 : 400)).json({ ok: type === "ok", message: text }); req.session.mkFlash = { type, text }; return res.redirect(back); };
    if (testLimiter.isLimited(key)) return reply("error", "Trop d'envois de test : 10 par heure au plus. Réessayez plus tard.", 429);
    testLimiter.hit(key); // compté à chaque tentative (y compris refusée) pour empêcher de sonder les adresses
    const contactId = req.body.contact_id ? intOrNull(req.body.contact_id) : undefined;
    sendTestEmail(req.mk.ctx, template.id, { to: req.body.to, ...(testChannel(req.mk.ctx) || {}), contactId }).then(
      (r) => {
        const msg = r.sent
          ? { type: "ok", text: `E-mail de test envoyé à ${r.to} (pensez à vérifier le dossier des indésirables).` }
          : { type: "error", text: r.reason === "smtp_not_configured" ? "Aucun service d'envoi configuré : aucun e-mail n'a été envoyé. Choisissez Resend dans Réglages d'envoi, ou renseignez SMTP_HOST (et les variables SMTP_*) dans la configuration du serveur." : "L'envoi a échoué : vérifiez la configuration SMTP (détails dans le journal du serveur)." };
        reply(msg.type, msg.text, msg.type === "ok" ? 200 : 502);
      },
      (error) => {
        if (!(error instanceof MarketingError)) return next(error);
        reply("error", error.message, 400);
      },
    );
  });

  router.post("/modeles/:id/dupliquer", need("templates.write"), (req, res, next) => {
    const template = load(req, res);
    if (!template) return;
    attempt(req, res, next, "/marketing/modeles", () => `Modèle dupliqué : « ${templates.duplicateTemplate(req.mk.ctx, template.id).name} ».`);
  });

  router.post("/modeles/:id/supprimer", need("templates.write"), (req, res, next) => {
    const template = load(req, res);
    if (!template) return;
    attempt(req, res, next, "/marketing/modeles", () => {
      templates.deleteTemplate(req.mk.ctx, template.id);
      return "Modèle supprimé.";
    });
  });

  router.post("/modeles/:id/restaurer", need("templates.write"), (req, res, next) => {
    const template = load(req, res);
    if (!template) return;
    attempt(req, res, next, `/marketing/modeles/${template.id}`, () => {
      templates.restoreVersion(req.mk.ctx, template.id, intOrNull(req.body.version));
      return "Version restaurée (une nouvelle version a été créée).";
    });
  });

  return router;
};

require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");
const compression = require("compression");

const { uploadsRoot, dataDir, dbFile } = require("./src/config/paths");
const db = require("./src/config/database");
const { SqliteStore } = require("./src/config/sessionStore");
const { bootstrapInstructorFromEnv } = require("./src/config/bootstrap");
const { securityHeaders, sameOriginOnly } = require("./src/middlewares/security");
const { injectLocals } = require("./src/middlewares/locals");
const authRoutes = require("./src/routes/auth");
const courseRoutes = require("./src/routes/courses");
const cartRoutes = require("./src/routes/cart");
const orderRoutes = require("./src/routes/orders");
const learningRoutes = require("./src/routes/learning");
const instructorRoutes = require("./src/routes/instructor");
const mediaRoutes = require("./src/routes/media");
const favoritesRoutes = require("./src/routes/favorites");
const seoRoutes = require("./src/routes/seo");
const pagesRoutes = require("./src/routes/pages");
const blogRoutes = require("./src/routes/blog");
const profileRoutes = require("./src/routes/profile");
const marketingWeb = require("./src/marketing/web").createMarketingRouters({ db });
const { UserError } = require("./src/utils/errors");

// En ligne (NODE_ENV=production, ou SITE_URL en https), on refuse de démarrer avec un secret faible
const isProduction = process.env.NODE_ENV === "production" || /^https:/i.test(process.env.SITE_URL || "");
const sessionSecret = process.env.SESSION_SECRET;
const secretIsWeak = !sessionSecret || sessionSecret.length < 16 || sessionSecret === "change-moi-en-production";
if (secretIsWeak && isProduction) {
  console.error("[KOYEKOLA] SESSION_SECRET est absente ou trop faible (16 caractères minimum). Définissez-la dans la configuration de l'hébergeur.");
  process.exit(1);
}
if (secretIsWeak) console.warn("[KOYEKOLA] Attention : SESSION_SECRET faible ou absente (acceptable en local uniquement).");

bootstrapInstructorFromEnv();

// Module marketing : migrations, organisation KOYEKOLA, réglages (n'empêche jamais le LMS de démarrer)
const marketing = require("./src/marketing").initMarketing({ db, dbFile, dataDir });

const app = express();
app.locals.marketing = marketing;

app.disable("x-powered-by");
// L'hébergeur place un proxy HTTPS devant l'application : nécessaire pour req.secure et req.ip
app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(compression()); // pages, CSS et JS envoyés compressés (gzip) : environ 4 fois plus légers
app.use(securityHeaders);
// Webhooks du fournisseur d'envoi : corps BRUT (la signature porte sur les octets exacts), donc avant l'analyse JSON
app.use("/webhooks", express.raw({ type: "*/*", limit: "256kb" }), marketingWeb.webhooks);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// API publique /api/v1 : authentification par clé (jamais par cookie), donc montée avant la session et le contrôle d'origine
app.use("/api/v1", marketingWeb.api);

// Fichiers du site : quand l'adresse porte un numéro de version (?v=…, voir src/utils/assets.js),
// le navigateur peut les garder un an ; sans numéro, une heure seulement.
app.use((req, res, next) => {
  if (req.query.v && (req.path.startsWith("/css/") || req.path.startsWith("/js/"))) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});
// Photos du site (diaporama de l'accueil) : 30 jours
app.use("/img", express.static(path.join(__dirname, "public", "img"), { maxAge: "30d" }));
app.use(express.static(path.join(__dirname, "public"), { maxAge: "1h" }));
// Miniatures publiques (noms de fichiers uniques, donc mise en cache longue sans risque).
// Les vidéos et ressources passent par src/routes/media.js (accès vérifié).
app.use("/uploads/thumbnails", express.static(path.join(uploadsRoot, "thumbnails"), { maxAge: "30d", immutable: true }));

// Toutes les pages générées par le site sont personnalisées (connexion, panier) : jamais gardées en cache
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "private, no-cache");
  next();
});

app.use(
  session({
    store: new SqliteStore(),
    secret: sessionSecret || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, sameSite: "lax", secure: "auto" },
  })
);

app.use(injectLocals);
// Après injectLocals : la page d'erreur affichée en cas de refus a besoin de ses variables
app.use(sameOriginOnly);

// Les navigateurs demandent /favicon.ico : on les renvoie vers l'icône SVG
app.get("/favicon.ico", (req, res) => res.redirect(301, "/favicon.svg"));

// Vérification rapide que le site et sa base répondent (utile après un déploiement)
app.get("/sante", (req, res) => {
  const { c } = db.prepare("SELECT COUNT(*) c FROM courses").get();
  res.json({ statut: "ok", formations: c });
});

app.use(seoRoutes);
app.use(mediaRoutes);
app.use(authRoutes);
app.use(courseRoutes);
app.use(cartRoutes);
app.use(orderRoutes);
app.use(learningRoutes);
app.use(favoritesRoutes);
app.use(pagesRoutes);
app.use(blogRoutes);
app.use(profileRoutes);
app.use(instructorRoutes);
app.use("/marketing", marketingWeb.admin);
app.use(marketingWeb.publicRoutes);

app.use((req, res) => {
  res.status(404).render("error", { message: "Page introuvable." });
});

// Gestion d'erreurs : un message n'est montré à l'utilisateur que s'il lui est destiné (UserError).
// Les erreurs techniques sont journalisées ici et jamais affichées (elles peuvent révéler la structure du site).
const STATUS_MESSAGES = {
  400: "Requête invalide.",
  403: "Accès refusé.",
  404: "Page introuvable.",
  413: "Fichier trop volumineux.",
};
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = 500;
  let message = "Une erreur est survenue. Réessayez dans un instant.";

  if (err instanceof UserError) {
    status = err.status;
    message = err.message;
  } else if (err.name === "MulterError") {
    status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (300 Mo maximum)." : "Envoi de fichier invalide.";
  } else if (Number.isInteger(err.status) && err.status >= 400 && err.status < 500) {
    status = err.status; // erreurs de requête détectées par Express (URL mal formée, corps illisible…)
    message = STATUS_MESSAGES[status] || STATUS_MESSAGES[400];
  } else {
    console.error(`[KOYEKOLA] Erreur sur ${req.method} ${req.originalUrl} :`, err);
  }
  res.status(status).render("error", { message });
});

// Filet de sécurité : une promesse rejetée sans gestionnaire ne doit pas arrêter tout le site
process.on("unhandledRejection", (reason) => {
  console.error("[KOYEKOLA] Promesse rejetée non gérée :", reason);
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`KOYEKOLA disponible sur http://localhost:${PORT}`);
  // Travaux marketing en arrière-plan (événements, envois) : activés seulement avec MARKETING_WORKER=on
  if (marketing.ready && process.env.MARKETING_WORKER === "on") {
    marketing.worker.start();
    marketing.startBridge(); // lecture périodique du LMS → événements (30 s)
    console.log("[KOYEKOLA] Worker marketing démarré.");
    process.once("SIGTERM", () => marketing.worker.stop().finally(() => process.exit(0)));
  }
});

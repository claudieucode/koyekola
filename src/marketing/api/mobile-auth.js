// Authentification mobile : échange email+mot de passe contre une clé d'API.
// Réservé aux utilisateurs de rôle 'formateur'. Chaque connexion révoque la clé
// « App Mobile » précédente et en génère une nouvelle (la valeur brute ne peut pas
// être récupérée après coup : c'est normal, elle est hachée en base).
const express = require("express");
const bcrypt = require("bcryptjs");
const { membershipsOf } = require("../organizations");
const { createApiKey, listApiKeys } = require("./keys");

const MOBILE_KEY_NAME = "App Mobile";

function createMobileAuthRouter({ db }) {
  const router = express.Router();
  router.use(express.json({ limit: "32kb" }));

  router.post("/login", (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({ error: { code: "invalid_field", message: "Email et mot de passe requis." } });
      }

      // Vérifier les identifiants dans la table users
      const user = db
        .prepare("SELECT id, username, email, role, password_hash FROM users WHERE email = ?")
        .get(email.trim().toLowerCase());

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: { code: "unauthorized", message: "Email ou mot de passe incorrect." } });
      }

      // Seuls les formateurs (administrateurs) peuvent accéder au module marketing
      if (user.role !== "formateur") {
        return res.status(403).json({ error: { code: "forbidden", message: "Accès réservé aux administrateurs de la plateforme." } });
      }

      const marketing = req.app.locals.marketing;
      if (!marketing?.ready) {
        return res.status(503).json({ error: { code: "unavailable", message: "Le module marketing est indisponible." } });
      }

      // Vérifier que l'utilisateur est membre de l'organisation marketing
      const memberships = membershipsOf(db, user.id);
      const membership = memberships.find((m) => m.organization_id === marketing.organizationId);
      if (!membership) {
        return res.status(403).json({ error: { code: "forbidden", message: "Cet utilisateur n'a pas accès au module marketing. Ajoutez-le dans Marketing → Équipe." } });
      }

      const ctx = {
        db,
        organizationId: marketing.organizationId,
        userId: user.id,
        bus: marketing.bus,
        settings: marketing.settings,
      };

      // Révoquer toutes les clés mobiles existantes pour ce compte
      const existingKeys = listApiKeys(ctx).filter((k) => k.name === MOBILE_KEY_NAME && !k.revoked_at);
      for (const k of existingKeys) {
        db.prepare("UPDATE mk_api_keys SET revoked_at = datetime('now') WHERE id = ?").run(k.id);
      }

      // Créer une nouvelle clé mobile (scope « write » pour piloter les campagnes)
      const result = createApiKey(ctx, { name: MOBILE_KEY_NAME, scope: "write" });

      return res.json({
        data: {
          token: result.key, // mk_live_… : à stocker côté app, jamais récupérable ensuite
          user: { id: user.id, username: user.username, email: user.email, role: user.role },
        },
      });
    } catch (error) {
      console.error("[KOLAKISA mobile-auth] Erreur :", error);
      return res.status(500).json({ error: { code: "server_error", message: "Erreur interne." } });
    }
  });

  // Vérification de token (l'app peut appeler ce endpoint au démarrage pour valider un token stocké)
  router.get("/me", (req, res) => {
    try {
      const header = req.get("authorization") || "";
      const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
      if (!raw) return res.status(401).json({ error: { code: "unauthorized", message: "Token manquant." } });

      const { authenticate } = require("./keys");
      const auth = authenticate(db, raw);
      if (!auth) return res.status(401).json({ error: { code: "unauthorized", message: "Token invalide ou révoqué." } });

      const marketing = req.app.locals.marketing;
      const row = db.prepare("SELECT id, username, email, role FROM users WHERE id IN (SELECT created_by FROM mk_api_keys WHERE organization_id = ? AND key_hash = (SELECT key_hash FROM mk_api_keys WHERE id = ?))").get(auth.organizationId, auth.keyId);
      return res.json({ data: { authenticated: true, user: row || null } });
    } catch (error) {
      return res.status(500).json({ error: { code: "server_error", message: "Erreur interne." } });
    }
  });

  return router;
}

module.exports = { createMobileAuthRouter };

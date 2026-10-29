// Authentification mobile : échange email+mot de passe contre une clé d'API.
// Réservé aux utilisateurs de rôle 'formateur'. Chaque connexion révoque la clé
// « App Mobile » précédente et en génère une nouvelle (la valeur brute ne peut pas
// être récupérée après coup : c'est normal, elle est hachée en base).
const express = require("express");
const bcrypt = require("bcryptjs");
const { membershipsOf, can } = require("../organizations");
const { createApiKey } = require("./keys");
const { loginBlocked, recordLoginFailure, clearLoginFailures } = require("../../middlewares/security");

const MOBILE_KEY_NAME = "App Mobile";

function createMobileAuthRouter({ db }) {
  const router = express.Router();
  router.use(express.json({ limit: "32kb" }));

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({ error: { code: "invalid_field", message: "Email et mot de passe requis." } });
      }

      // Même limite que la connexion du site (10 échecs par adresse IP en 15 minutes, compteur partagé)
      if (loginBlocked(req)) {
        return res.status(429).json({ error: { code: "rate_limited", message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." } });
      }

      // Vérifier les identifiants dans la table users
      const user = db
        .prepare("SELECT id, username, email, role, password_hash, status FROM users WHERE email = ?")
        .get(email.trim().toLowerCase());

      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        recordLoginFailure(req);
        return res.status(401).json({ error: { code: "unauthorized", message: "Email ou mot de passe incorrect." } });
      }

      clearLoginFailures(req);

      // Compte suspendu ou désactivé : même refus que la connexion web (aucune clé n'est délivrée)
      if (user.status && user.status !== "active") {
        return res.status(403).json({ error: { code: "forbidden", message: "Ce compte est suspendu." } });
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

      // Même règle que l'écran « Clés d'API » : seul un administrateur de l'organisation peut en obtenir une
      if (!can(membership.role, "api_keys.manage")) {
        return res.status(403).json({ error: { code: "forbidden", message: "Votre rôle dans l'organisation ne permet pas de créer une clé d'API." } });
      }

      const ctx = {
        db,
        organizationId: marketing.organizationId,
        userId: user.id,
        bus: marketing.bus,
        settings: marketing.settings,
      };

      // Une clé mobile PAR utilisateur (le nom en porte l'identifiant : la contrainte d'unicité (organisation, nom) ne mélange jamais deux comptes).
      // Les anciennes clés de CET utilisateur sont révoquées puis renommées : un nom de clé révoquée reste réservé par la contrainte et
      // bloquait la deuxième connexion (erreur 500).
      const keyName = `${MOBILE_KEY_NAME} #${user.id}`;
      const previous = db.prepare("SELECT id FROM mk_api_keys WHERE organization_id = ? AND (name = ? OR name LIKE ?)").all(ctx.organizationId, keyName, `${keyName} (ancienne %`);
      for (const k of previous) {
        db.prepare("UPDATE mk_api_keys SET revoked_at = COALESCE(revoked_at, datetime('now')), name = ? WHERE id = ?").run(`${keyName} (ancienne ${k.id})`, k.id);
      }

      const scope = "write";
      const result = createApiKey(ctx, { name: keyName, scope });

      return res.json({
        data: {
          token: result.key, // mk_live_… : à stocker côté app, jamais récupérable ensuite
          scope,
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

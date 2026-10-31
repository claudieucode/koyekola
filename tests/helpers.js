// Outils des tests d'intégration : un vrai serveur KOLAKISA est lancé avec ses propres dossiers
// de données temporaires (jamais vos vraies données), et interrogé en HTTP comme le ferait un navigateur.
const { spawn } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const INSTRUCTOR = { email: "prof@test.local", username: "Prof", password: "MotDePasseProf123" };

async function startServerOnce(extraEnv = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-test-"));
  const port = 20000 + Math.floor(Math.random() * 20000);
  const env = {
    ...process.env,
    PORT: String(port),
    DATA_DIR: path.join(dir, "data"),
    UPLOADS_DIR: path.join(dir, "uploads"),
    SESSION_SECRET: "secret-de-test-assez-long-1234567890",
    NODE_ENV: "test",
    SITE_URL: "",
    ALLOW_INDEXING: "1", // les serveurs de test simulent un site public ; un test d'environnement local passe ALLOW_INDEXING: "auto"
    FORMATEUR_EMAIL: INSTRUCTOR.email,
    FORMATEUR_USERNAME: INSTRUCTOR.username,
    FORMATEUR_PASSWORD: INSTRUCTOR.password,
    ...extraEnv,
  };
  // Recette sur copie (R8 étape 8) : KOYEKOLA_TEST_SEED_DB = base de DÉPART du serveur de test (COPIE d'une copie de production, jamais la production) ; elle est recopiée dans le dossier temporaire du test
  if (process.env.KOYEKOLA_TEST_SEED_DB) { fs.mkdirSync(path.join(dir, "data"), { recursive: true }); fs.copyFileSync(process.env.KOYEKOLA_TEST_SEED_DB, path.join(dir, "data", "KOYEKOLA.db")); }
  const child = spawn(process.execPath, ["server.js"], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
  let log = "";
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));

  await new Promise((resolve, reject) => {
    // Machine lente ou chargée : 120 s (TEST_START_TIMEOUT_MS pour l'allonger) (le démarrage dépasse 30 s quand d'autres programmes occupent le processeur). En cas d'échec, le serveur et la surveillance sont arrêtés (sinon la suite
    // de tests attendrait indéfiniment un processus orphelin)
    const timer = setTimeout(() => { clearInterval(poll); child.kill("SIGKILL"); reject(new Error("Le serveur de test n'a pas démarré :\n" + log)); }, Number(process.env.TEST_START_TIMEOUT_MS) || 120000);
    const poll = setInterval(() => {
      if (log.includes("disponible sur")) {
        clearTimeout(timer);
        clearInterval(poll);
        resolve();
      }
    }, 50);
    child.on("exit", (code) => {
      clearTimeout(timer);
      clearInterval(poll);
      reject(new Error(`Le serveur de test s'est arrêté (code ${code}) :\n${log}`));
    });
  });

  return {
    base: `http://localhost:${port}`,
    dir,
    // Jeton anti-robot des formulaires publics, comme celui de la page affichée à un humain (signé avec la clé du
    // serveur de test, daté de 5 secondes : voir src/marketing/forms/antispam.js)
    formToken: () => {
      const ts = Date.now() - 5000;
      const secret = env.SESSION_SECRET || env.ENCRYPTION_KEY || "kolakisa-formulaires";
      return `${ts}.${require("node:crypto").createHmac("sha256", secret).update(`form-time:${ts}`).digest("base64url").slice(0, 22)}`;
    },
    log: () => log,
    // Lecture/écriture directe dans la base du serveur de test (préparation ou vérification)
    db: () => {
      const db = new DatabaseSync(path.join(dir, "data", "KOYEKOLA.db"));
      db.exec("PRAGMA busy_timeout = 5000");
      return db;
    },
    stop: async () => {
      child.kill();
      await new Promise((r) => child.on("exit", r));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

// Petit navigateur : garde les cookies, ne suit pas les redirections (on veut les voir)
class Client {
  constructor(base) {
    this.base = base;
    this.cookies = new Map();
  }

  async request(url, { method = "GET", form, multipart, json, headers = {} } = {}) {
    const h = { ...headers };
    const cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    if (cookie) h.cookie = cookie;
    let body;
    if (form) {
      body = new URLSearchParams(form).toString();
      h["Content-Type"] = "application/x-www-form-urlencoded";
    } else if (multipart) {
      body = multipart;
    } else if (json !== undefined) {
      body = JSON.stringify(json);
      h["Content-Type"] = "application/json";
    }
    // Délai maximum : une requête qui ne répond pas fait échouer le test avec son adresse, au lieu de bloquer toute la suite
    let res;
    try {
      res = await fetch(this.base + url, { method, headers: h, body, redirect: "manual", signal: AbortSignal.timeout(30000) });
    } catch (error) {
      if (error && error.name === "TimeoutError") throw new Error(`Pas de réponse en 30 s : ${method} ${url}`);
      throw error;
    }
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(";");
      const i = pair.indexOf("=");
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1));
    }
    const raw = Buffer.from(await res.arrayBuffer()); // octets bruts (fichiers binaires : archives, images) en plus du texte
    return { status: res.status, location: res.headers.get("location"), headers: res.headers, text: raw.toString("utf8"), body: raw };
  }

  get(url, opts) { return this.request(url, { ...opts, method: "GET" }); }
  postJson(url, json, opts) { return this.request(url, { ...opts, method: "POST", json }); }
  post(url, form, opts) { return this.request(url, { ...opts, method: "POST", form }); }

  async login(email, password) {
    const r = await this.post("/connexion", { email, password });
    if (r.status !== 302) throw new Error(`Connexion refusée pour ${email} (statut ${r.status})`);
    return this;
  }
}

async function loginInstructor(srv) {
  return new Client(srv.base).login(INSTRUCTOR.email, INSTRUCTOR.password);
}

let studentCounter = 0;
async function newStudent(srv) {
  studentCounter += 1;
  const email = `eleve${studentCounter}@test.local`;
  const c = new Client(srv.base);
  const r = await c.post("/inscription", { username: `eleve${studentCounter}`, email, password: "MotDePasseEleve123" });
  if (r.status !== 302) throw new Error("Inscription de test refusée : " + r.status);
  return Object.assign(c, { email });
}

// Crée une formation complète par les vraies routes du formateur.
// Renvoie { id, slug, sectionId, lessons: [{ id, title }] }
async function createCourse(instructor, srv, { title = "Formation de test", price = 20, publish = true, lessons = [{ title: "Leçon 1", preview: false }], extra = {} } = {}) {
  await instructor.post("/formateur/cours/nouveau", { title, category: "Test", level: "debutant", price: String(price), description: "desc", ...extra });
  const db = srv.db();
  const course = db.prepare("SELECT id, slug FROM courses WHERE title = ? ORDER BY id DESC").get(title);
  await instructor.post(`/formateur/cours/${course.id}/sections`, { title: "Chapitre 1" });
  const section = db.prepare("SELECT id FROM sections WHERE course_id = ?").get(course.id);
  const created = [];
  for (const l of lessons) {
    await instructor.post(`/formateur/sections/${section.id}/lecons`, { title: l.title });
    const lesson = db.prepare("SELECT id FROM lessons WHERE section_id = ? AND title = ?").get(section.id, l.title);
    const fd = new FormData();
    fd.append("title", l.title);
    fd.append("duration_minutes", "5");
    if (l.preview) fd.append("is_preview", "1");
    if (l.videoUrl) fd.append("video_url", l.videoUrl);
    if (l.video) fd.append("video", new Blob([l.video], { type: "video/mp4" }), "v.mp4");
    if (l.description) fd.append("description", l.description);
    await instructor.request(`/formateur/lecons/${lesson.id}/modifier`, { method: "POST", multipart: fd });
    if (l.resource) {
      const att = new FormData();
      att.append("title", l.resource.name);
      att.append("attachment", new Blob([l.resource.content], { type: l.resource.type }), l.resource.name);
      await instructor.request(`/formateur/lecons/${lesson.id}/pieces-jointes`, { method: "POST", multipart: att });
    }
    created.push({ id: lesson.id, title: l.title });
  }
  if (publish) await instructor.post(`/formateur/cours/${course.id}/publier`, {});
  db.close();
  return { ...course, sectionId: section.id, lessons: created };
}

// Achat simulé complet par les vraies routes : panier puis commande
async function buy(student, course) {
  await student.post(`/panier/ajouter/${course.id}`, {});
  return student.post("/commande", {});
}

// Page vide ouverte dans l'éditeur : l'écran de création GUIDÉE (catalogue de gabarits) recouvre le canevas. Les tests qui partent d'un canevas vide pour
// manipuler le « + » parcourent le parcours (page vide → Continuer, format standard) et referment le sélecteur de structures qui s'ouvre ensuite ;
// sans effet si l'écran n'est pas affiché. La page porte alors le format recommandé (largeur et marges initialisées).
async function dismissStart(page) {
  const start = page.locator("[data-pb-start]");
  if (!(await start.isVisible().catch(() => false))) return;
  await page.locator("[data-pb-cat-next]").click();
  await page.locator("[data-pb-start-continue]").click();
  await start.waitFor({ state: "hidden" });
  await page.keyboard.press("Escape");
}

// Le port est tiré au hasard : si un autre programme de la machine l'occupe déjà (EADDRINUSE), on recommence avec un autre port
async function startServer(extraEnv = {}) {
  for (let attempt = 1; ; attempt++) {
    try { return await startServerOnce(extraEnv); } catch (error) {
      if (attempt >= 5 || !/EADDRINUSE/.test(String(error.message))) throw error;
    }
  }
}

module.exports = { startServer, Client, loginInstructor, newStudent, createCourse, buy, INSTRUCTOR, dismissStart };

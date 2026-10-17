// Assistant de rédaction IA du marketing (point 10 de la parité Mailchimp, équivalent de l'« Intuit Assist » / Creative
// Assistant) : objets et préheaders, réécriture d'un texte (raccourcir, allonger, ton, correction), brouillon d'e-mail
// complet à partir d'une consigne, conseils d'optimisation, texte de SMS. Règles (testées) :
//  - l'IA PROPOSE, la personne choisit : rien n'est enregistré sans action de sa part dans l'éditeur ;
//  - aucune adresse n'est écrite par l'IA : les liens des boutons viennent de la consigne ou du catalogue du site ;
//  - tout brouillon est validé par le moteur des modèles (variables connues seulement) avant d'être proposé ;
//  - un SMS proposé est mesuré (segments facturés) avec le même calcul que l'envoi ;
//  - plafond quotidien par organisation (coût maîtrisé), journal SANS aucun texte (seulement action, résultat, tailles) ;
//  - « voix de la marque » réglable (Paramètres → Assistant IA), ajoutée à chaque consigne.
const { runJson, AiError, isConfigured, MODEL } = require("../../services/aiCore");
const { checkCtx, cleanText, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const { compileTemplate } = require("../templates/blocks");
const { allowedFor } = require("../templates/context");
const { markdownToRich } = require("../templates/richtext");
const { getCourse, listCourses } = require("../bridge/catalog");
const smsRender = require("../sms/render");
const { getSmsConfig } = require("../sms/config");
const siteModules = require("../siteModules");
const { validSite } = require("../audit");

const DAY = 86400000;
const VOICE_KEY = "ai.brand_voice";
const LIMIT_KEY = "ai.daily_limit";
const DEFAULT_LIMIT = 100;
const MAX_INPUT = 12000;
const TONES = { amical: "amical et chaleureux", professionnel: "professionnel et posé", enthousiaste: "enthousiaste et énergique", simple: "très simple, pour des débutants", urgent: "avec un sentiment d'urgence honnête (sans fausse promesse)" };
const LENGTHS = { court: "court (80 à 120 mots)", moyen: "moyen (150 à 250 mots)", long: "long (300 à 450 mots)" };
const REWRITE = {
  reecrire: "Réécris ce texte pour qu'il soit plus fluide et plus convaincant, sans changer son sens ni ajouter d'information. Garde à peu près la même longueur.",
  raccourcir: "Raccourcis ce texte d'environ moitié en gardant l'essentiel et l'appel à l'action.",
  allonger: "Développe ce texte : explique davantage et ajoute un exemple concret, sans inventer de chiffres ni de faits.",
  corriger: "Corrige l'orthographe, la grammaire, la ponctuation et la typographie française (espaces avant : ; ! ?, guillemets « »). Ne change ni le style ni le sens.",
  ...Object.fromEntries(Object.entries(TONES).map(([k, t]) => [`ton_${k}`, `Réécris ce texte sur un ton ${t}, sans changer les informations.`])),
};
const AREAS = { objet: "Objet", preheader: "Préheader", contenu: "Contenu", appel: "Appel à l'action", lisibilite: "Lisibilité", personnalisation: "Personnalisation", delivrabilite: "Délivrabilité" };
const ACTIONS = { subjects: "Objets et préheaders", rewrite: "Réécriture", draft: "Brouillon d'e-mail", optimize: "Conseils d'optimisation", sms: "Texte de SMS" };

const bad = (message) => new MarketingError("invalid_field", message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const clip = (v, max = MAX_INPUT) => String(v ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
const str = { type: "string" };
const obj = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });

// ---------- Réglages ----------
function getAiSettings(ctx) {
  checkCtx(ctx);
  const s = ctx.settings;
  const limit = Number(s ? s.get(ctx.organizationId, LIMIT_KEY, DEFAULT_LIMIT) : DEFAULT_LIMIT);
  return { voice: s ? String(s.get(ctx.organizationId, VOICE_KEY, "") || "") : "", dailyLimit: Number.isInteger(limit) && limit >= 1 ? limit : DEFAULT_LIMIT, configured: isConfigured(), model: MODEL };
}
function saveAiSettings(ctx, { voice, dailyLimit }) {
  checkCtx(ctx);
  const v = cleanText(voice ?? "", { max: 1000, field: "voice" });
  const n = typeof dailyLimit === "string" && dailyLimit.trim() !== "" ? Number(dailyLimit) : dailyLimit;
  if (!Number.isInteger(n) || n < 1 || n > 2000) throw bad("Plafond quotidien : un nombre entier entre 1 et 2000.");
  ctx.settings.set(ctx.organizationId, VOICE_KEY, v);
  ctx.settings.set(ctx.organizationId, LIMIT_KEY, n);
  audit(ctx, "ai.settings_updated", "settings", null, { dailyLimit: n, voice: Boolean(v) });
  return getAiSettings(ctx);
}
// R7 lot 6.2 — le QUOTA est commun à l'organisation (`orgLast24h`, jamais borné par le site) ; la CONSOMMATION se lit par site : un accès limité ne voit que celle de SON site, l'équipe voit le total et la répartition.
const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;
const orgLast24h = (ctx, now) => ctx.db.prepare("SELECT COUNT(*) n FROM mk_ai_requests WHERE organization_id = ? AND created_at > ?").get(ctx.organizationId, now - DAY).n;
function usage(ctx, now = nowOf(ctx)) {
  const since = now - DAY;
  const site = limited(ctx) ? (Number.isInteger(ctx.siteScope) ? { sql: " AND site_id = ?", params: [ctx.siteScope] } : { sql: " AND 1 = 0", params: [] }) : { sql: "", params: [] };
  const r = ctx.db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(ok), 0) ok FROM mk_ai_requests WHERE organization_id = ? AND created_at > ?${site.sql}`).get(ctx.organizationId, since, ...site.params);
  const byAction = ctx.db.prepare(`SELECT action, COUNT(*) n FROM mk_ai_requests WHERE organization_id = ? AND created_at > ?${site.sql} GROUP BY action`).all(ctx.organizationId, now - 30 * DAY, ...site.params);
  const out = { last24h: r.n, ok24h: r.ok, last30d: Object.fromEntries(byAction.map((x) => [x.action, x.n])) };
  // Répartition par site (équipe seulement) : NULL = organisation / site principal / historique sans site
  if (!limited(ctx)) out.bySite24h = ctx.db.prepare("SELECT r.site_id, s.name, COUNT(*) n FROM mk_ai_requests r LEFT JOIN mk_sites s ON s.id = r.site_id WHERE r.organization_id = ? AND r.created_at > ? GROUP BY r.site_id ORDER BY n DESC").all(ctx.organizationId, since).map((x) => ({ siteId: x.site_id, name: x.name || null, n: x.n }));
  return out;
}

// ---------- Appel commun : plafond, consigne de marque, journal ----------
function systemFor(ctx, channel) {
  const voice = getAiSettings(ctx).voice;
  return [
    "Tu es l'assistant de rédaction marketing de KOLAKISA, une plateforme francophone de formations en ligne (graphisme, vidéo, bureautique, marketing digital, développement web, intelligence artificielle).",
    `Tu rédiges en français, pour ${channel === "sms" ? "des SMS" : "des e-mails"} envoyés à des abonnés qui ont donné leur accord.`,
    "Tu n'inventes jamais de faits, de chiffres, de prix, de dates, de réductions, de témoignages ni de citations : tu t'appuies uniquement sur la consigne et le texte fournis.",
    "Pas de majuscules à outrance, pas de points d'exclamation en série, pas de promesses trompeuses (« gratuit », « urgent », « gagnez ») sauf si la consigne les justifie : cela nuit à la délivrabilité.",
    "Tu n'écris jamais d'adresse web : les liens sont ajoutés par le logiciel.",
    voice ? `Voix de la marque à respecter : ${voice}` : "",
    "Tu réponds uniquement avec l'objet JSON demandé.",
  ].filter(Boolean).join(" ");
}

async function call(ctx, action, { channel = "email", prompt, schema, effort = "medium", system = null, siteId } = {}) {
  checkCtx(ctx);
  // R7 lot 6.2 — un accès LIMITÉ à un site n'utilise l'IA que si le module est activé pour CE site (chemin unique : e-mails, SMS, studio de pages)
  siteModules.assertEnabled(ctx, "ai");
  const now = nowOf(ctx);
  const settings = getAiSettings(ctx);
  if (!settings.configured) throw new AiError("not_configured", "L'assistant IA n'est pas activé : ajoutez la variable ANTHROPIC_API_KEY (clé de console.anthropic.com) dans la configuration du serveur.");
  if (orgLast24h(ctx, now) >= settings.dailyLimit) throw new AiError("quota", `Plafond atteint : ${settings.dailyLimit} demandes à l'IA sur les dernières 24 heures (réglable dans Paramètres → Assistant IA).`);
  // Site de la consommation : jamais lu d'une requête — site explicite d'un appelant interne (ex. site de la page éditée, relu en base), sinon le site imposé à un accès limité ; toujours revalidé
  // (un accès LIMITÉ est toujours attribué à SON site, quoi qu'un appelant interne passe ; l'équipe : site explicite relu en base, sinon aucun)
  const site = limited(ctx) ? validSite(ctx.db, ctx.organizationId, ctx.siteScope) : validSite(ctx.db, ctx.organizationId, siteId);
  const log = (ok, code = "", out = 0) => ctx.db.prepare("INSERT INTO mk_ai_requests (organization_id, user_id, action, ok, error_code, input_chars, output_tokens, created_at, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(ctx.organizationId, ctx.userId ?? null, action, ok ? 1 : 0, code, prompt.length, out, now, site);
  try {
    const r = await runJson({ system: system || systemFor(ctx, channel), prompt, schema, effort });
    log(true, "", (r.usage && r.usage.output_tokens) || 0);
    return r.data;
  } catch (error) {
    log(false, String((error && error.code) || "error").slice(0, 30));
    throw error;
  }
}

// ---------- Objets et préheaders ----------
async function suggestSubjects(ctx, { content, goal, subject } = {}) {
  const text = clip(content);
  if (!text && !clip(goal)) throw bad("Écrivez d'abord le contenu de l'e-mail (ou indiquez son objectif).");
  const data = await call(ctx, "subjects", {
    schema: obj({ proposals: { type: "array", items: obj({ subject: str, preheader: str, why: str }) } }),
    prompt: `Propose 5 couples objet + préheader pour cet e-mail. Objet : 30 à 60 caractères, précis et honnête, qui donne envie d'ouvrir ; varie les angles (bénéfice, question, curiosité, personnalisation). Préheader : 50 à 100 caractères, complète l'objet sans le répéter. Pour personnaliser, tu peux utiliser EXACTEMENT {{contact.first_name | default:"…"}} (avec une valeur de secours), rien d'autre entre accolades. « why » : l'angle choisi, en quelques mots.${goal ? `\nObjectif de l'e-mail : ${clip(goal, 300)}` : ""}${subject ? `\nObjet actuel : ${clip(subject, 200)}` : ""}\n\n<email>\n${text}\n</email>`,
  });
  const allowed = allowedFor(ctx);
  const valid = (s, p) => { try { compileTemplate({ subject: s, preheader: p, blocks: [] }, { allowed }); return true; } catch { return false; } };
  const proposals = (data.proposals || [])
    .map((p) => ({ subject: clip(p.subject, 200).replace(/\s+/g, " "), preheader: clip(p.preheader, 200).replace(/\s+/g, " "), why: clip(p.why, 120) }))
    .filter((p) => p.subject && valid(p.subject, p.preheader))
    .slice(0, 5);
  if (!proposals.length) throw new AiError("format", "Aucune proposition utilisable : réessayez.");
  return { proposals };
}

// ---------- Réécriture d'un texte (bloc de l'éditeur) ----------
async function rewrite(ctx, { text, mode } = {}) {
  const source = clip(text, 6000);
  if (!source) throw bad("Le texte à réécrire est vide.");
  if (!Object.hasOwn(REWRITE, mode)) throw bad("Action de réécriture inconnue.");
  const data = await call(ctx, "rewrite", {
    schema: obj({ text: str }),
    prompt: `${REWRITE[mode]} Garde intactes les variables entre doubles accolades ({{…}}). Mise en forme : paragraphes séparés par une ligne vide, **gras** autorisé avec parcimonie, listes avec « - » si utile.\n\n<texte>\n${source}\n</texte>`,
  });
  const out = clip(data.text, 6000);
  if (!out) throw new AiError("format", "Réponse vide : réessayez.");
  // Une variable inventée (inconnue du moteur) est retirée plutôt que de casser le modèle
  return { text: out, html: safeRich(ctx, out) };
}
function safeRich(ctx, md) {
  const allowed = allowedFor(ctx);
  const html = markdownToRich(md);
  try { compileTemplate({ blocks: [{ type: "text", html }] }, { allowed }); return html; } catch { return markdownToRich(md.replace(/\{\{[\s\S]*?\}\}/g, "")); }
}

// ---------- Brouillon d'e-mail complet ----------
async function draftEmail(ctx, { topic, goal, audience, tone = "amical", length = "moyen", ctaLabel, ctaUrl, courseId } = {}) {
  const subject = clip(topic, 300);
  if (!subject) throw bad("Indiquez le sujet de l'e-mail.");
  if (!Object.hasOwn(TONES, tone)) throw bad("Ton inconnu.");
  if (!Object.hasOwn(LENGTHS, length)) throw bad("Longueur inconnue.");
  const url = String(ctaUrl || "").trim();
  if (url && !/^https:\/\/[^\s<>"]+$/i.test(url) && !/^\/[^\s<>"]*$/.test(url)) throw bad("Lien du bouton : une adresse https://… ou un chemin du site (/catalogue).");
  const course = courseId ? getCourse(ctx, Number(courseId)) : null;
  if (courseId && !course) throw bad("Formation introuvable (ou non publiée).");
  const data = await call(ctx, "draft", {
    effort: "high",
    schema: obj({
      subject: str, preheader: str,
      sections: { type: "array", items: obj({ kind: { type: "string", enum: ["heading", "text", "list"] }, text: str, items: { type: "array", items: str } }) },
      buttonLabel: str,
    }),
    prompt: [
      `Rédige un e-mail marketing complet. Sujet : ${subject}.`,
      goal ? `Objectif : ${clip(goal, 300)}.` : "",
      audience ? `Destinataires : ${clip(audience, 300)}.` : "",
      `Ton : ${TONES[tone]}. Longueur du corps : ${LENGTHS[length]}.`,
      course ? `Formation à mettre en avant (n'invente RIEN d'autre à son sujet) : « ${course.title} »${course.subtitle ? ` — ${course.subtitle}` : ""}.` : "",
      "Structure : un titre accrocheur (heading), 2 à 5 paragraphes (text, **gras** autorisé avec parcimonie), éventuellement une liste de 3 à 5 points (list, items).",
      "Pour « heading » et « text », « items » est une liste vide ; pour « list », « text » est vide.",
      "Personnalisation possible avec EXACTEMENT {{contact.first_name | default:\"…\"}} (valeur de secours obligatoire), aucune autre variable.",
      `Objet : 30 à 60 caractères. Préheader : 50 à 100 caractères. « buttonLabel » : 2 à 5 mots pour le bouton d'appel à l'action${ctaLabel ? ` (proposition de la personne : « ${clip(ctaLabel, 60)} »)` : ""}.`,
    ].filter(Boolean).join("\n"),
  });
  const blocks = [];
  for (const s of (data.sections || []).slice(0, 12)) {
    if (s.kind === "heading" && clip(s.text, 200)) blocks.push({ type: "heading", text: clip(s.text, 200).replace(/\s+/g, " "), level: blocks.length ? 2 : 1, align: "left" });
    else if (s.kind === "text" && clip(s.text, 4000)) blocks.push({ type: "text", html: safeRich(ctx, clip(s.text, 4000)) });
    else if (s.kind === "list") { const items = (s.items || []).map((x) => clip(x, 300).replace(/\s+/g, " ")).filter(Boolean).slice(0, 8); if (items.length) blocks.push({ type: "list", style: "bullets", items }); }
  }
  if (!blocks.length) throw new AiError("format", "Le brouillon proposé est vide : réessayez.");
  // Appel à l'action : la formation (bloc « formation » du catalogue), sinon un bouton vers l'adresse donnée
  const label = clip(data.buttonLabel || ctaLabel || "En savoir plus", 80).replace(/\s+/g, " ");
  if (course) blocks.push({ type: "course", courseId: course.id, cta: label });
  else if (url) blocks.push({ type: "button", label, url: url.startsWith("/") ? `${String(ctx.baseUrl || "").replace(/\/+$/, "")}${url}` : url, align: "center" });
  let draft = { subject: clip(data.subject, 200).replace(/\s+/g, " "), preheader: clip(data.preheader, 200).replace(/\s+/g, " "), blocks };
  const allowed = allowedFor(ctx);
  // Le bloc « formation » est complété (instantané du catalogue) à l'enregistrement du modèle : vérifié à part, plus haut
  const check = (d) => compileTemplate({ kind: "marketing", ...d, blocks: d.blocks.filter((b) => b.type !== "course") }, { allowed });
  try { check(draft); } catch {
    // Variable non reconnue dans l'objet, le titre ou une liste : on la retire (les textes riches sont déjà nettoyés)
    const strip = (v) => String(v).replace(/\{\{[\s\S]*?\}\}/g, "").replace(/\s{2,}/g, " ").trim();
    draft = { subject: strip(draft.subject), preheader: strip(draft.preheader), blocks: blocks.map((b) => (b.type === "heading" ? { ...b, text: strip(b.text) || "Bonjour" } : b.type === "list" ? { ...b, items: b.items.map(strip) } : b)) };
    try { check(draft); } catch (error) { throw new AiError("format", `Brouillon inutilisable (${error.message}) : réessayez.`); }
  }
  return { draft, missingLink: !course && !url };
}

// ---------- Conseils d'optimisation ----------
async function optimize(ctx, { subject, preheader, content } = {}) {
  const text = clip(content);
  if (!text) throw bad("L'e-mail est vide : rien à analyser.");
  const data = await call(ctx, "optimize", {
    schema: obj({ summary: str, tips: { type: "array", items: obj({ area: { type: "string", enum: Object.keys(AREAS) }, issue: str, suggestion: str }) } }),
    prompt: `Analyse cet e-mail marketing comme un expert : objet, préheader, clarté du contenu, appel à l'action, lisibilité (phrases longues, blocs de texte), personnalisation, risques de délivrabilité (mots alarmistes, majuscules, ponctuation excessive). Donne 3 à 7 conseils CONCRETS, du plus important au moins important, chacun avec le problème constaté (cite le passage) et une suggestion applicable (une formulation proposée si possible). Ne donne aucun score chiffré et ne prétends pas connaître les statistiques d'ouverture. « summary » : une phrase d'appréciation générale.\n\nObjet : ${clip(subject, 200) || "(vide)"}\nPréheader : ${clip(preheader, 200) || "(vide)"}\n\n<email>\n${text}\n</email>`,
  });
  return { summary: clip(data.summary, 400), tips: (data.tips || []).slice(0, 7).map((t) => ({ area: t.area, areaLabel: AREAS[t.area] || t.area, issue: clip(t.issue, 500), suggestion: clip(t.suggestion, 700) })) };
}

// ---------- SMS ----------
async function smsText(ctx, { brief, text, mode = "write", trackClicks = true } = {}) {
  if (!["write", "shorten"].includes(mode)) throw bad("Action inconnue.");
  const source = clip(mode === "write" ? brief : text, 2000);
  if (!source) throw bad(mode === "write" ? "Décrivez le SMS à rédiger." : "Le texte du SMS est vide.");
  const cfg = getSmsConfig(ctx);
  const measure = (t) => smsRender.estimateFor(t, { first_name: "Marie-Christine", last_name: "Nkounkou" }, { baseUrl: ctx.baseUrl, trackClicks });
  const budget = measure("").units; // mention STOP ajoutée automatiquement : elle compte dans le SMS facturé
  const room = Math.max(40, 160 - budget);
  const consigne = {
    write: `Rédige un SMS marketing à partir de cette consigne. Au plus ${room} caractères, sans accents rares (ê, â, î, ô, û, ç, œ) ni emoji pour rester à 160 caractères par SMS. Pas de lien (ajouté par le logiciel si besoin), pas de mention STOP (ajoutée automatiquement).`,
    shorten: `Raccourcis ce SMS à ${room} caractères au plus, en gardant l'essentiel et les liens éventuels tels quels. Pas de mention STOP (ajoutée automatiquement).`,
  }[mode];
  const data = await call(ctx, "sms", {
    channel: "sms",
    schema: obj({ text: str }),
    prompt: `${consigne} Personnalisation possible avec {{prenom}} ou {{nom}} (avec une valeur de secours : {{prenom|bonjour}}), aucune autre variable.\n\n<${mode === "write" ? "consigne" : "sms"}>\n${source}\n</${mode === "write" ? "consigne" : "sms"}>`,
  });
  let out = clip(data.text, 1600);
  // Variable inconnue retirée ; accolades orphelines restantes : toutes les variables sont retirées (texte sûr)
  for (const tag of smsRender.unknownTags(out)) out = out.split(tag).join("");
  if (smsRender.unknownTags(out).length) out = out.replace(/\{\{[^{}]*\}\}/g, "").replace(/\{\{|\}\}/g, "");
  out = out.replace(/[ \t]{2,}/g, " ").replace(/ +([,.!?])/g, "$1").trim();
  if (!out) throw new AiError("format", "Réponse vide : réessayez.");
  const m = measure(out);
  return { text: out, segments: m.segments, encoding: m.encoding, units: m.units, overLimit: m.segments > cfg.maxSegments, maxSegments: cfg.maxSegments };
}

module.exports = {
  ACTIONS, TONES, LENGTHS, REWRITE, AREAS, DEFAULT_LIMIT, AiError,
  getAiSettings, saveAiSettings, usage, call, suggestSubjects, rewrite, draftEmail, optimize, smsText, listCourses,
};

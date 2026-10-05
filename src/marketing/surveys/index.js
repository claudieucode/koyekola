// Sondages (point 7 de la parité Mailchimp). Questions : choix unique, choix multiples (option « Autre » possible),
// échelle (1 à 5 ou 1 à 10), texte court ou long ; obligatoires ou non. Chaque option peut ajouter une étiquette au
// contact qui la choisit (étiquetage automatique, contacts connus seulement).
// Répondant : rattaché à son contact par le lien PERSONNEL signé des e-mails (jeton « survey ») ; sinon anonyme, ou
// identifié par l'adresse qu'il donne (jamais d'abonnement sans case cochée : preuve de consentement comme un formulaire).
// Un contact connu n'a qu'une réponse par sondage (la nouvelle remplace l'ancienne) ; les réponses anonymes s'ajoutent.
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { upsertContact, findByEmail, getContact } = require("../audience/contacts");
const { validateEmail } = require("../audience/email");
const { tagContact } = require("../audience/tags");
const { addToList, getList } = require("../audience/lists");
const { recordConsent } = require("../compliance/consent");
const { signToken, verifyToken } = require("../security/tokens");

const TYPES = { single: "Choix unique", multiple: "Choix multiples", range: "Échelle", text: "Texte court", longtext: "Texte long" };
const STATUSES = { draft: "Brouillon", published: "Ouvert", closed: "Clos" };
const MAX_QUESTIONS = 30;
const MAX_OPTIONS = 20;
const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const bad = (m) => new MarketingError("invalid_field", m);
const line = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
const block = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const parse = (row) => (row ? { ...row, questions: JSON.parse(row.questions || "[]") } : null);

// ---------- Questions ----------
// Options saisies une par ligne, « Libellé | étiquette » pour l'étiquetage automatique (facultatif)
function parseOptions(raw, at) {
  const rows = (Array.isArray(raw) ? raw : String(raw || "").split(/\r?\n/)).map((r) => (typeof r === "object" && r ? r : { label: String(r).split("|")[0], tag: String(r).split("|")[1] || "" }));
  const out = rows.map((o) => ({ label: line(o.label, 120), tag: line(o.tag, 64) })).filter((o) => o.label);
  if (out.length < 2) throw bad(`${at} : au moins deux réponses possibles (une par ligne).`);
  if (out.length > MAX_OPTIONS) throw bad(`${at} : ${MAX_OPTIONS} réponses possibles au plus.`);
  if (new Set(out.map((o) => o.label.toLowerCase())).size !== out.length) throw bad(`${at} : deux réponses identiques.`);
  return out;
}
function normalizeQuestion(raw, i) {
  const at = `Question ${i + 1}`;
  if (!raw || !Object.hasOwn(TYPES, raw.type)) throw bad(`${at} : type inconnu.`);
  const text = line(raw.text, 300);
  if (!text) throw bad(`${at} : l'intitulé est obligatoire.`);
  const q = { type: raw.type, text, help: line(raw.help, 300), required: raw.required === true || raw.required === "on" };
  if (raw.type === "single" || raw.type === "multiple") { q.options = parseOptions(raw.options, at); q.other = raw.other === true || raw.other === "on"; }
  if (raw.type === "range") {
    q.scale = Number(raw.scale) === 10 ? 10 : 5;
    q.low = line(raw.low, 60) || "Pas du tout"; q.high = line(raw.high, 60) || "Tout à fait";
  }
  return q;
}

// ---------- Sondages ----------
function getSurvey(ctx, id) {
  checkCtx(ctx);
  return parse(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_surveys WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requireSurvey(ctx, id) {
  const s = getSurvey(ctx, id);
  if (!s) throw new MarketingError("not_found", "Sondage introuvable.");
  return s;
}
const getPublicSurvey = (db, slug) => parse(SLUG.test(String(slug || "")) ? db.prepare("SELECT * FROM mk_surveys WHERE slug = ? AND status IN ('published', 'closed')").get(slug) : null);
function listSurveys(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT s.*, (SELECT COUNT(*) FROM mk_survey_responses r WHERE r.survey_id = s.id) AS responses FROM mk_surveys s WHERE s.organization_id = ? ORDER BY s.updated_at DESC, s.id DESC").all(ctx.organizationId).map(parse);
}
const slugify = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "") || "sondage";
function freeSlug(ctx, base) { let s = base, n = 2; while (ctx.db.prepare("SELECT 1 FROM mk_surveys WHERE slug = ?").get(s)) s = `${base.slice(0, 55)}-${n++}`; return s; }

function createSurvey(ctx, { name } = {}) {
  checkCtx(ctx);
  const n = line(name, 100);
  if (!n) throw bad("Le nom du sondage est obligatoire.");
  if (ctx.db.prepare("SELECT 1 FROM mk_surveys WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n)) throw new MarketingError("duplicate", "Un sondage porte déjà ce nom.");
  const questions = [{ type: "range", text: "Dans l'ensemble, êtes-vous satisfait(e) ?", help: "", required: true, scale: 5, low: "Pas du tout", high: "Tout à fait" }];
  const id = Number(ctx.db.prepare("INSERT INTO mk_surveys (organization_id, name, slug, title, questions, thank_you, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, n, freeSlug(ctx, slugify(n)), n, JSON.stringify(questions), "Merci pour vos réponses !", ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "survey.created", "survey", id, {});
  return getSurvey(ctx, id);
}
// Un sondage déjà publié garde ses questions tant qu'il a des réponses (sinon les résultats deviendraient incohérents)
function saveSurvey(ctx, id, input = {}) {
  const current = requireSurvey(ctx, id);
  const name = line(input.name, 100);
  if (!name) throw bad("Le nom du sondage est obligatoire.");
  const dup = ctx.db.prepare("SELECT id FROM mk_surveys WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name);
  if (dup && dup.id !== id) throw new MarketingError("duplicate", "Un sondage porte déjà ce nom.");
  const slug = line(input.slug, 60).toLowerCase();
  if (!SLUG.test(slug)) throw bad("Adresse du sondage : lettres minuscules sans accent, chiffres et tirets.");
  if (ctx.db.prepare("SELECT 1 FROM mk_surveys WHERE slug = ? AND id <> ?").get(slug, id)) throw new MarketingError("duplicate", `L'adresse « /sondage/${slug} » est déjà utilisée.`);
  const raw = Array.isArray(input.questions) ? input.questions : [];
  if (!raw.length) throw bad("Ajoutez au moins une question.");
  if (raw.length > MAX_QUESTIONS) throw bad(`${MAX_QUESTIONS} questions au plus.`);
  const questions = raw.map(normalizeQuestion);
  const answered = ctx.db.prepare("SELECT COUNT(*) n FROM mk_survey_responses WHERE survey_id = ?").get(id).n;
  if (answered && JSON.stringify(questions.map((q) => [q.type, (q.options || []).map((o) => o.label), q.scale])) !== JSON.stringify(current.questions.map((q) => [q.type, (q.options || []).map((o) => o.label), q.scale]))) {
    throw new MarketingError("invalid_state", `Ce sondage a déjà ${answered} réponse${answered > 1 ? "s" : ""} : les questions et leurs réponses possibles ne peuvent plus changer (seuls les intitulés, aides et étiquettes peuvent être corrigés). Dupliquez-le pour une nouvelle version.`);
  }
  const askEmail = ["no", "optional", "required"].includes(input.askEmail) ? input.askEmail : "optional";
  let listId = null;
  let consentText = "";
  if (input.listId !== undefined && input.listId !== null && input.listId !== "") {
    listId = Number(input.listId);
    if (!getList(ctx, listId)) throw bad("Liste introuvable.");
    consentText = line(input.consentText, 500);
    if (consentText.length < 10) throw bad("Inscription proposée : écrivez le texte de la case de consentement (ce que la personne accepte).");
    if (askEmail === "no") throw bad("Pour proposer l'inscription, le sondage doit demander l'adresse e-mail.");
  }
  ctx.db.prepare("UPDATE mk_surveys SET name = ?, slug = ?, title = ?, intro = ?, questions = ?, thank_you = ?, ask_email = ?, list_id = ?, consent_text = ?, updated_at = datetime('now') WHERE id = ?")
    .run(name, slug, line(input.title, 150) || name, block(input.intro, 1000), JSON.stringify(questions), block(input.thankYou, 500) || "Merci pour vos réponses !", askEmail, listId, consentText, id);
  audit(ctx, "survey.saved", "survey", id, { questions: questions.length });
  return getSurvey(ctx, id);
}
function setStatus(ctx, id, status) {
  requireSurvey(ctx, id);
  if (!Object.hasOwn(STATUSES, status) || status === "draft") throw bad("État inconnu.");
  ctx.db.prepare("UPDATE mk_surveys SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  audit(ctx, `survey.${status}`, "survey", id, {});
}
function deleteSurvey(ctx, id) {
  requireSurvey(ctx, id);
  ctx.db.prepare("DELETE FROM mk_surveys WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "survey.deleted", "survey", id, {});
}

// ---------- Lien personnel (e-mails) ----------
const respondentToken = (organizationId, contactId, key) => signToken({ o: organizationId, c: contactId, k: "survey" }, key);
function contactFromToken(ctx, token) {
  if (!token || !ctx.tokenKey) return null;
  let v;
  try { v = verifyToken(String(token), ctx.tokenKey, { kind: "survey" }); } catch { return null; }
  if (!v.ok || v.payload.o !== ctx.organizationId || !Number.isInteger(v.payload.c)) return null;
  return getContact(ctx, v.payload.c) || null;
}

// ---------- Réponses ----------
// Valide les réponses du formulaire public : { q0: "1", q1: ["0","2"], q1_other: "…", q2: "4", q3: "texte" }
function readAnswers(survey, body) {
  const answers = {};
  const errors = [];
  survey.questions.forEach((q, i) => {
    const key = `q${i}`;
    const raw = body[key];
    if (q.type === "single") {
      const v = raw === undefined || raw === "" ? null : String(raw);
      if (v === "other" && q.other) { const t = line(body[`${key}_other`], 200); if (t) answers[key] = { other: t }; else errors.push(`${q.text} : précisez votre réponse « Autre ».`); }
      else if (v !== null) { const idx = Number(v); if (Number.isInteger(idx) && q.options[idx]) answers[key] = { choice: idx }; else errors.push(`${q.text} : réponse invalide.`); }
    } else if (q.type === "multiple") {
      const list = (Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]).map(String);
      const choices = [...new Set(list.filter((v) => v !== "other").map(Number))].filter((n) => Number.isInteger(n) && q.options[n]).sort((a, b) => a - b);
      const other = list.includes("other") && q.other ? line(body[`${key}_other`], 200) : "";
      if (list.includes("other") && q.other && !other) errors.push(`${q.text} : précisez votre réponse « Autre ».`);
      if (choices.length || other) answers[key] = { choices, ...(other ? { other } : {}) };
    } else if (q.type === "range") {
      if (raw !== undefined && raw !== "") { const n = Number(raw); if (Number.isInteger(n) && n >= 1 && n <= q.scale) answers[key] = { value: n }; else errors.push(`${q.text} : note invalide.`); }
    } else {
      const t = q.type === "text" ? line(raw, 300) : block(raw, 3000);
      if (t) answers[key] = { text: t };
    }
    if (q.required && !answers[key] && !errors.some((e) => e.startsWith(q.text))) errors.push(`« ${q.text} » est obligatoire.`);
  });
  return { answers, errors };
}

// Enregistre une réponse. contact : contact connu (lien personnel) ; sinon adresse saisie (selon le réglage du sondage).
function submitResponse(ctx, survey, body, { contact = null, ip = null, now = Date.now() } = {}) {
  if (survey.status !== "published") return { ok: false, error: "Ce sondage est clos : il n'accepte plus de réponses." };
  const { answers, errors } = readAnswers(survey, body);
  let respondent = contact;
  const email = line(body.email, 254);
  if (!respondent && survey.ask_email !== "no") {
    if (email) {
      const v = validateEmail(email);
      if (!v.ok) errors.push("Adresse e-mail invalide.");
    } else if (survey.ask_email === "required") errors.push("Votre adresse e-mail est obligatoire.");
  }
  if (errors.length) return { ok: false, error: errors.join(" "), answers };
  return transaction(ctx.db, () => {
    if (!respondent && email && survey.ask_email !== "no") respondent = findByEmail(ctx, email) || upsertContact({ ...ctx, audit: false }, { email, source: "survey" }).contact;
    // Inscription seulement si la case a été cochée (preuve = texte exact de la case), comme un formulaire
    if (respondent && survey.list_id && body.consent && survey.consent_text) {
      const c = recordConsent(ctx, respondent.id, { source: "form", textShown: survey.consent_text, ip });
      if (c.ok) addToList({ ...ctx, audit: false }, survey.list_id, [respondent.id]);
    }
    const json = JSON.stringify(answers);
    if (respondent) {
      const existing = ctx.db.prepare("SELECT id FROM mk_survey_responses WHERE survey_id = ? AND contact_id = ?").get(survey.id, respondent.id);
      if (existing) ctx.db.prepare("UPDATE mk_survey_responses SET answers = ?, updated_at = ?, source = ? WHERE id = ?").run(json, now, contact ? "email" : "link", existing.id);
      else ctx.db.prepare("INSERT INTO mk_survey_responses (organization_id, survey_id, contact_id, source, answers, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(ctx.organizationId, survey.id, respondent.id, contact ? "email" : "link", json, now, now);
      // Étiquetage automatique selon les options choisies
      survey.questions.forEach((q, i) => {
        const a = answers[`q${i}`];
        if (!a || !q.options) return;
        const picked = q.type === "single" ? (a.choice !== undefined ? [a.choice] : []) : a.choices || [];
        for (const idx of picked) if (q.options[idx].tag) tagContact({ ...ctx, audit: false }, respondent.id, q.options[idx].tag);
      });
    } else {
      ctx.db.prepare("INSERT INTO mk_survey_responses (organization_id, survey_id, contact_id, source, answers, created_at, updated_at) VALUES (?, ?, NULL, 'link', ?, ?, ?)").run(ctx.organizationId, survey.id, json, now, now);
    }
    return { ok: true, contact: respondent };
  });
}

// ---------- Résultats ----------
function results(ctx, id) {
  const survey = requireSurvey(ctx, id);
  const rows = ctx.db.prepare("SELECT r.*, c.email FROM mk_survey_responses r LEFT JOIN mk_contacts c ON c.id = r.contact_id WHERE r.survey_id = ? ORDER BY r.updated_at DESC").all(id).map((r) => ({ ...r, answers: JSON.parse(r.answers) }));
  const questions = survey.questions.map((q, i) => {
    const key = `q${i}`;
    const given = rows.filter((r) => r.answers[key]);
    const out = { ...q, index: i, answered: given.length };
    if (q.options) {
      out.counts = q.options.map((o, idx) => ({ label: o.label, tag: o.tag, n: given.filter((r) => (q.type === "single" ? r.answers[key].choice === idx : (r.answers[key].choices || []).includes(idx))).length, contacts: given.filter((r) => r.contact_id && (q.type === "single" ? r.answers[key].choice === idx : (r.answers[key].choices || []).includes(idx))).length }));
      out.others = given.map((r) => r.answers[key].other).filter(Boolean);
    } else if (q.type === "range") {
      const values = given.map((r) => r.answers[key].value);
      out.counts = Array.from({ length: q.scale }, (_, k) => ({ label: String(k + 1), n: values.filter((v) => v === k + 1).length }));
      out.average = values.length ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10 : null;
    } else {
      out.texts = given.map((r) => ({ text: r.answers[key].text, email: r.email || null }));
    }
    return out;
  });
  return { survey, total: rows.length, known: rows.filter((r) => r.contact_id).length, questions, rows };
}
// Texte lisible d'une réponse (tableau des réponses individuelles et export)
function answerText(q, a) {
  if (!a) return "";
  if (q.type === "single") return a.other !== undefined ? `Autre : ${a.other}` : q.options[a.choice].label;
  if (q.type === "multiple") return [...(a.choices || []).map((i) => q.options[i].label), ...(a.other ? [`Autre : ${a.other}`] : [])].join(" ; ");
  if (q.type === "range") return `${a.value} / ${q.scale}`;
  return a.text;
}
function toCsv(ctx, id) {
  const r = results(ctx, id);
  const cell = (v) => { const s = String(v ?? ""); const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
  const head = ["Date", "Contact", "Source", ...r.survey.questions.map((q) => q.text)];
  const lines = r.rows.map((row) => [new Date(row.updated_at).toISOString().slice(0, 16).replace("T", " "), row.email || "anonyme", row.source === "email" ? "e-mail" : "lien", ...r.survey.questions.map((q, i) => answerText(q, row.answers[`q${i}`]))]);
  return "﻿" + [head, ...lines].map((l) => l.map(cell).join(";")).join("\r\n");
}
// Étiqueter les contacts qui ont choisi une réponse (depuis le rapport)
function tagRespondents(ctx, id, questionIndex, optionIndex, tag) {
  const survey = requireSurvey(ctx, id);
  const q = survey.questions[questionIndex];
  if (!q || !q.options || !q.options[optionIndex]) throw bad("Réponse introuvable.");
  const name = line(tag, 64);
  if (!name) throw bad("Nom d'étiquette obligatoire.");
  const key = `q${questionIndex}`;
  const ids = ctx.db.prepare("SELECT contact_id, answers FROM mk_survey_responses WHERE survey_id = ? AND contact_id IS NOT NULL").all(id)
    .filter((r) => { const a = JSON.parse(r.answers)[key]; return a && (q.type === "single" ? a.choice === optionIndex : (a.choices || []).includes(optionIndex)); })
    .map((r) => r.contact_id);
  transaction(ctx.db, () => { for (const cid of ids) tagContact({ ...ctx, audit: false }, cid, name); });
  audit(ctx, "survey.tagged", "survey", id, { count: ids.length, tag: name });
  return ids.length;
}

module.exports = {
  createSurvey, saveSurvey, getSurvey, requireSurvey, getPublicSurvey, listSurveys, setStatus, deleteSurvey, respondentToken, contactFromToken,
  readAnswers, submitResponse, results, answerText, toCsv, tagRespondents, normalizeQuestion, TYPES, STATUSES,
};

// Sondages dans Marketing (Audience → Sondages) : liste, éditeur de questions, aperçu, ouverture/clôture, rapport,
// export CSV, étiquetage des contacts selon leurs réponses. Un seul formulaire par sondage : ajouter, déplacer ou
// supprimer une question ENREGISTRE aussi la saisie en cours.
const express = require("express");
const surveys = require("../surveys");
const audience = require("../audience");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const STATUS_CLASS = { draft: "", published: "mk-status-ok", closed: "mk-status-warn" };
const BLANK = {
  single: { type: "single", text: "Votre question ?", options: "Oui\nNon", required: false },
  multiple: { type: "multiple", text: "Qu'est-ce qui vous intéresse ?", options: "Première réponse\nDeuxième réponse", required: false },
  range: { type: "range", text: "Quelle note donnez-vous ?", scale: 5, low: "Pas du tout", high: "Tout à fait", required: false },
  text: { type: "text", text: "Votre réponse en quelques mots", required: false },
  longtext: { type: "longtext", text: "Avez-vous une remarque ?", required: false },
};
// Formulaire HTML → questions (options : une par ligne, « Libellé | étiquette »)
function questionsFromBody(body) {
  const raw = body.questions && typeof body.questions === "object" ? Object.keys(body.questions).sort((a, b) => Number(a) - Number(b)).map((k) => body.questions[k]) : [];
  return raw.map((q) => ({ ...q, required: q.required === "on", other: q.other === "on" }));
}
const optionsText = (q) => (q.options || []).map((o) => (o.tag ? `${o.label} | ${o.tag}` : o.label)).join("\n");

module.exports = () => {
  const router = express.Router();

  router.get("/sondages", need("forms.read"), (req, res) => {
    res.render("marketing/surveys", { title: "Sondages", active: "surveys", items: surveys.listSurveys(req.mk.ctx), STATUSES: surveys.STATUSES, STATUS_CLASS });
  });
  router.post("/sondages", need("forms.write"), (req, res, next) => {
    let created = null;
    attempt(req, res, next, () => (created ? `/marketing/sondages/${created.id}` : "/marketing/sondages"), () => {
      created = surveys.createSurvey(req.mk.ctx, { name: req.body.name });
      return "Sondage créé (brouillon) : écrivez vos questions, puis ouvrez-le.";
    });
  });

  const load = (req, res) => {
    const s = surveys.getSurvey(req.mk.ctx, intOrNull(req.params.id));
    if (!s) res.status(404).render("error", { message: "Sondage introuvable." });
    return s;
  };
  router.get("/sondages/:id(\\d+)", need("forms.read"), (req, res) => {
    const survey = load(req, res);
    if (!survey) return;
    const count = req.mk.ctx.db.prepare("SELECT COUNT(*) n FROM mk_survey_responses WHERE survey_id = ?").get(survey.id).n;
    res.render("marketing/survey", {
      title: survey.name, active: "surveys", survey, responses: count, TYPES: surveys.TYPES, STATUSES: surveys.STATUSES, STATUS_CLASS, BLANK, optionsText,
      lists: audience.listLists(req.mk.ctx), canWrite: req.mk.can("forms.write"), publicUrl: `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/sondage/${survey.slug}`,
    });
  });
  router.get("/sondages/:id(\\d+)/apercu", need("forms.read"), (req, res) => {
    const survey = load(req, res);
    if (!survey) return;
    res.render("marketing-public/survey", { survey: { ...survey, status: "published" }, values: {}, error: null, done: false, contact: null, token: "", preview: true });
  });
  router.post("/sondages/:id(\\d+)", need("forms.write"), (req, res, next) => {
    const survey = load(req, res);
    if (!survey) return;
    const b = req.body;
    let anchor = "";
    attempt(req, res, next, () => `/marketing/sondages/${survey.id}${anchor}`, () => {
      const questions = questionsFromBody(b);
      const action = String(b.action || "save");
      let m;
      if ((m = /^(up|down|remove):(\d{1,2})$/.exec(action))) {
        const i = Number(m[2]);
        if (i < questions.length) {
          if (m[1] === "remove") questions.splice(i, 1);
          else { const j = m[1] === "up" ? i - 1 : i + 1; if (j >= 0 && j < questions.length) { [questions[i], questions[j]] = [questions[j], questions[i]]; anchor = `#question-${j}`; } }
        }
      } else if ((m = /^add:([a-z]+)$/.exec(action)) && BLANK[m[1]]) {
        questions.push({ ...BLANK[m[1]] });
        anchor = `#question-${questions.length - 1}`;
      }
      surveys.saveSurvey(req.mk.ctx, survey.id, { name: b.name, slug: b.slug, title: b.title, intro: b.intro, thankYou: b.thank_you, askEmail: b.ask_email, listId: b.list_id, consentText: b.consent_text, questions });
      return action.startsWith("add:") ? "Question ajoutée." : action.startsWith("remove:") ? "Question supprimée." : action === "save" ? "Sondage enregistré." : "Question déplacée.";
    });
  });
  for (const [path, status, text] of [["ouvrir", "published", "Sondage ouvert : son lien accepte les réponses."], ["clore", "closed", "Sondage clos : il n'accepte plus de réponses (les résultats restent)."]]) {
    router.post(`/sondages/:id(\\d+)/${path}`, need("forms.write"), (req, res, next) => {
      const survey = load(req, res);
      if (!survey) return;
      attempt(req, res, next, `/marketing/sondages/${survey.id}`, () => { surveys.setStatus(req.mk.ctx, survey.id, status); return text; });
    });
  }
  router.post("/sondages/:id(\\d+)/supprimer", need("forms.write"), (req, res, next) => {
    const survey = load(req, res);
    if (!survey) return;
    attempt(req, res, next, "/marketing/sondages", () => { surveys.deleteSurvey(req.mk.ctx, survey.id); return `Sondage « ${survey.name} » supprimé, avec ses réponses.`; });
  });

  // ---------- Résultats ----------
  router.get("/sondages/:id(\\d+)/resultats", need("contacts.read"), (req, res) => {
    const survey = load(req, res);
    if (!survey) return;
    res.render("marketing/survey-results", { title: `Résultats — ${survey.name}`, active: "surveys", r: surveys.results(req.mk.ctx, survey.id), answerText: surveys.answerText, canTag: req.mk.can("contacts.write"), canExport: req.mk.can("contacts.export") });
  });
  router.get("/sondages/:id(\\d+)/export.csv", need("contacts.export"), (req, res) => {
    const survey = load(req, res);
    if (!survey) return;
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="sondage-${survey.slug}.csv"`);
    res.send(surveys.toCsv(req.mk.ctx, survey.id));
  });
  router.post("/sondages/:id(\\d+)/etiqueter", need("contacts.write"), (req, res, next) => {
    const survey = load(req, res);
    if (!survey) return;
    attempt(req, res, next, `/marketing/sondages/${survey.id}/resultats`, () => {
      const n = surveys.tagRespondents(req.mk.ctx, survey.id, intOrNull(req.body.q), intOrNull(req.body.o), req.body.tag);
      return `Étiquette « ${String(req.body.tag).trim()} » ajoutée à ${n} contact${n > 1 ? "s" : ""}.`;
    });
  });
  return router;
};

// Assistant de rédaction IA (point 10 de la parité Mailchimp) : appels JSON depuis l'éditeur d'e-mails et l'éditeur de
// SMS, et page de réglages (Paramètres → Assistant IA). L'IA propose ; rien n'est enregistré ici, sauf les réglages.
const express = require("express");
const ai = require("../ai");
const { MarketingError } = require("../errors");
const { attempt, need } = require("./kit");

// Action → permission : rédiger un e-mail = modifier les modèles ; un SMS = modifier les campagnes
const ACTIONS = {
  objets: { permission: "templates.write", run: (ctx, b) => ai.suggestSubjects(ctx, { content: b.content, goal: b.goal, subject: b.subject }) },
  reecrire: { permission: "templates.write", run: (ctx, b) => ai.rewrite(ctx, { text: b.text, mode: b.mode }) },
  brouillon: { permission: "templates.write", run: (ctx, b) => ai.draftEmail(ctx, { topic: b.topic, goal: b.goal, audience: b.audience, tone: b.tone, length: b.length, ctaLabel: b.ctaLabel, ctaUrl: b.ctaUrl, courseId: b.courseId }) },
  optimiser: { permission: "templates.write", run: (ctx, b) => ai.optimize(ctx, { subject: b.subject, preheader: b.preheader, content: b.content }) },
  sms: { permission: "campaigns.write", run: (ctx, b) => ai.smsText(ctx, { brief: b.brief, text: b.text, mode: b.mode, trackClicks: b.trackClicks !== false }) },
};
const STATUS = { not_configured: 503, quota: 429, rate: 429 };

module.exports = () => {
  const router = express.Router();

  router.get("/ia/etat", need("templates.read"), (req, res) => {
    const s = ai.getAiSettings(req.mk.ctx);
    res.json({ configured: s.configured, tones: ai.TONES, lengths: ai.LENGTHS, rewrite: Object.keys(ai.REWRITE) });
  });

  for (const [path, a] of Object.entries(ACTIONS)) {
    router.post(`/ia/${path}`, need(a.permission), async (req, res, next) => {
      try {
        res.json({ ok: true, ...(await a.run(req.mk.ctx, req.body || {})) });
      } catch (error) {
        if (error instanceof ai.AiError) return res.status(STATUS[error.code] || 400).json({ ok: false, error: error.message, code: error.code });
        if (error instanceof MarketingError) return res.status(400).json({ ok: false, error: error.message, code: error.code });
        next(error);
      }
    });
  }

  // ---------- Paramètres → Assistant IA ----------
  router.get("/ia", need("settings.read"), (req, res) => {
    const { ctx } = req.mk;
    res.render("marketing/ai-settings", { title: "Assistant IA", active: "ai", settings: ai.getAiSettings(ctx), usage: ai.usage(ctx), ACTIONS: ai.ACTIONS, canWrite: req.mk.can("settings.write") });
  });
  router.post("/ia", need("settings.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/ia", () => { ai.saveAiSettings(req.mk.ctx, { voice: req.body.voice, dailyLimit: req.body.dailyLimit }); return "Réglages de l'assistant IA enregistrés."; });
  });
  return router;
};

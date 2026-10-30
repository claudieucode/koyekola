// Assistant IA contextuel du constructeur. Il ne modifie JAMAIS directement : il COMPREND une demande (règles déterministes sur le français, aucun appel IA pour décider), la transforme en PROPOSITION
// (description, élément concerné, ancienne et nouvelle valeur) enregistrée dans le journal du projet ; la personne l'accepte ou la refuse. À l'acceptation, l'action passe par le moteur concerné
// (Site Planner, Content Generator, AI Media) avec ses contrôles et son contrôle de révision. Une demande de conseil ne modifie rien. Une demande sans moteur sait le dire (navigation vers l'écran natif).
const { MarketingError } = require("../marketing/errors");
const core = require("./index");
const store = require("./store");

const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const { json } = store;
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const SECTION_WORDS = { faq: "faq", "questions frequentes": "faq", services: "features", service: "features", avantages: "features", "points forts": "features", temoignages: "testimonials", contact: "form", formulaire: "form", "appel a l'action": "cta", "appel a l action": "cta", presentation: "text", texte: "text", video: "video", bandeau: "hero" };
const FEATURE_WORDS = { blog: "blog", newsletter: "newsletter", galerie: "galerie" };
const OP_WORDS = [[/raccourci|plus court|resume/, "shorten"], [/developpe|plus long|detaille/, "expand"], [/professionnel/, "professional"], [/commercial|vendeur|persuasi/, "commercial"], [/simplifi|plus simple|facile/, "simplify"], [/corrige|faute/, "fix"], [/reecri|reformul|ameliore|rewrite/, "rewrite"], [/seo|referencement/, "seo"]];

// Intentions : advice (aucune modification) | add_page | add_section | add_feature | remove_page | rename_page | revise_text | regenerate_image | change_color | mobile | unknown
function classify(message, ctx = {}) {
  const t = norm(message);
  if (!t) return { intent: "empty" };
  const m = (re) => re.exec(t);
  if (m(/^(ajoute|cree|ajouter|creer|rajoute)\s+(une |la |un )?page\s+(.+)$/)) { const g = m(/^(?:ajoute|cree|ajouter|creer|rajoute)\s+(?:une |la |un )?page\s+(.+)$/); return { intent: "add_page", name: clean(message.replace(/^\s*\S+\s+(une |la |un )?page\s+/i, "")) || g[1] }; }
  if (m(/(supprime|retire|enleve)\s+(la )?page\s+(.+)/)) return { intent: "remove_page", name: m(/(?:supprime|retire|enleve)\s+(?:la )?page\s+(.+)/)[1] };
  if (m(/renomme\s+(la )?page\s+(.+?)\s+(en|par)\s+(.+)/)) { const g = m(/renomme\s+(?:la )?page\s+(.+?)\s+(?:en|par)\s+(.+)/); return { intent: "rename_page", from: g[1], to: clean(message.split(/\s(?:en|par)\s/i).slice(1).join(" ")) }; }
  const sec = m(/(ajoute|rajoute|insere)\s+(?:une |la |un )?section\s+(?:de |d'|des |sur |presentant |presentation )?(.*)$/);
  if (sec) { const w = Object.keys(SECTION_WORDS).find((k) => sec[2].includes(k)); return { intent: "add_section", type: w ? SECTION_WORDS[w] : null, label: sec[2] }; }
  if (m(/(ajoute|rajoute)\s+(?:une |un )?(faq|questions frequentes)/)) return { intent: "add_section", type: "faq", label: "faq" };
  const feat = Object.keys(FEATURE_WORDS).find((k) => m(new RegExp(`(ajoute|active|rajoute).*\\b${k}\\b`)));
  if (feat) return { intent: "add_feature", feature: FEATURE_WORDS[feat] };
  if (m(/(couleur|palette|bleu|rouge|vert|police|typographie|style visuel)/) && m(/(change|modifie|mets|passe|utilise|adopte)/)) return { intent: "change_color" };
  if (m(/(image|photo|banniere|illustration)/) && m(/(genere|regenere|autre|nouvelle|change|remplace)/)) return { intent: "regenerate_image", needKey: ctx.needKey || null };
  if (m(/(telephone|mobile|smartphone|responsive)/)) return { intent: "mobile" };
  const op = OP_WORDS.find(([re]) => re.test(t));
  if (op && m(/(texte|titre|paragraphe|description|presentation|section|page|ceci|cela|le |la |ce )/)) return { intent: "revise_text", op: op[1], instruction: clean(message) };
  if (m(/\?|^(comment|pourquoi|que |quel|quelle|est-ce|peux-tu m'expliquer|conseil|que penses|faut-il|dois-je)/)) return { intent: "advice" };
  return { intent: "unknown" };
}
const clean = (s) => String(s || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").replace(/[.!?]+$/, "").trim().slice(0, 80);
const find = (plan, name) => { const n = norm(name); return plan.pages.find((p) => norm(p.name) === n || p.key === n || norm(p.name).includes(n)); };

// Construit la proposition ; AUCUNE écriture (hors journal)
async function propose(ctx, siteId, pid, { message, step = null, pageKey = null, fieldKey = null, setId = null, needKey = null, can = () => true, call = null } = {}) {
  const row = core.row(ctx, siteId, pid), p = core.shape(row);
  const text = String(message || "").trim().slice(0, 600);
  if (!text) throw bad("Écrivez votre demande.");
  const userEvent = core.log(ctx, pid, { kind: "chat", role: "user", text, payload: { step, pageKey } });
  const view = p.planId ? core.planView(ctx, p) : null;
  const i = classify(text, { needKey });
  const reply = (textOut, proposal = null) => {
    const id = core.log(ctx, pid, { kind: "chat", role: "assistant", text: textOut, payload: { proposal }, status: proposal ? "pending" : "done" });
    return { id, userEventId: userEvent, intent: i.intent, text: textOut, proposal: proposal ? { ...proposal, eventId: id } : null };
  };
  if (i.intent === "empty") throw bad("Écrivez votre demande.");
  if (i.intent === "advice") return reply(await advice(ctx, p, view, text, step, call));
  if (i.intent === "mobile") return reply("L'adaptation mobile se vérifie dans l'aperçu « Mobile » de l'étape Prévisualisation, puis se règle dans l'éditeur de la page (écran Mobile). Je ne la modifie pas automatiquement : le rendu mobile dépend de chaque section.", { type: "navigate", summary: "Ouvrir la prévisualisation mobile", target: "preview" });
  if (i.intent === "change_color") return reply("Les couleurs et polices se règlent dans les propositions de l'étape Design (choix d'une direction) puis, pour un réglage précis, dans le Personnaliser natif. Je ne change pas une couleur à votre place sans passer par ces écrans, qui protègent vos réglages manuels.", { type: "navigate", summary: "Aller à l'étape Design", target: "design" });
  if (i.intent === "unknown") return reply("Je n'ai pas compris s'il s'agit d'un conseil ou d'une modification. Exemples : « Ajoute une page À propos », « Ajoute une section FAQ », « Raccourcis ce texte » (après avoir sélectionné un champ), « Génère une autre image pour cette bannière ».");
  if (["add_page", "remove_page", "rename_page", "add_section", "add_feature"].includes(i.intent)) {
    if (!view || !view.plan) return reply("Il n'y a pas encore de plan de site : analysez le brief et proposez le plan avant de le modifier.");
    if (view.status === "validated") { /* une modification repassera le plan en « modifié » : signalé */ }
    let op = null, summary = "", elementLabel = "", before = "", after = "";
    if (i.intent === "add_page") { if (!i.name) return reply("Quel nom donner à la page ?"); if (find(view.plan, i.name) && norm(find(view.plan, i.name).name) === norm(i.name)) return reply(`Une page « ${find(view.plan, i.name).name} » existe déjà dans le plan.`); op = { op: "add_page", name: i.name }; summary = `Ajouter la page « ${i.name} » au plan et au menu principal.`; elementLabel = "Plan du site"; before = `${view.plan.pages.length} page(s)`; after = `${view.plan.pages.length + 1} page(s)`; }
    if (i.intent === "remove_page") { const pg = find(view.plan, i.name); if (!pg) return reply(`Je ne trouve pas de page « ${i.name} » dans le plan.`); if (pg.key === "accueil") return reply("La page d'accueil ne peut pas être supprimée."); op = { op: "remove_page", key: pg.key }; summary = `Retirer la page « ${pg.name} » du plan (les pages déjà générées dans le site ne sont pas supprimées).`; elementLabel = pg.name; before = `${pg.sections.length} section(s)`; after = "page retirée du plan"; if (pg.origin === "user" || pg.priority === "essential") summary += " Cette page est marquée essentielle ou demandée par vous : confirmez avec attention."; }
    if (i.intent === "rename_page") { const pg = find(view.plan, i.from); if (!pg || !i.to) return reply(`Je ne trouve pas la page « ${i.from} ».`); op = { op: "rename_page", key: pg.key, name: i.to }; summary = `Renommer la page « ${pg.name} » en « ${i.to} ».`; elementLabel = pg.name; before = pg.name; after = i.to; }
    if (i.intent === "add_section") {
      const pg = pageKey ? view.plan.pages.find((x) => x.key === pageKey) : null;
      if (!pg) return reply("Sur quelle page ? Sélectionnez une page dans l'étape Plan ou Pages, puis redemandez.");
      if (!i.type) return reply("Quel type de section ? (FAQ, services, témoignages, contact, appel à l'action, présentation, vidéo…)");
      op = { op: "add_section", pageKey: pg.key, type: i.type, purpose: i.label ? clean(i.label) : i.type }; summary = `Ajouter une section « ${i.type} » à la fin de la page « ${pg.name} ».`; elementLabel = pg.name; before = `${pg.sections.length} section(s)`; after = `${pg.sections.length + 1} section(s)`;
    }
    if (i.intent === "add_feature") { op = { op: "add_feature", key: i.feature, level: "optional" }; summary = `Ajouter la fonctionnalité « ${i.feature} » (optionnelle) au plan.`; elementLabel = "Fonctionnalités"; before = "absente"; after = "ajoutée"; }
    return reply(`Voici ce que je propose : ${summary}`, { type: "plan", op, summary, element: elementLabel, before, after, revision: view.revision, planId: p.planId });
  }
  if (i.intent === "revise_text") {
    if (!setId || !fieldKey) return reply("Sélectionnez d'abord le texte à modifier dans l'étape Contenus, puis redemandez.");
    const variants = await require("../contentGen").revise(ctx, siteId, Number(setId), { fieldKey, op: i.op, instruction: i.instruction, count: 1, call });
    const v = variants.variants[0];
    if (v.blocking) return reply("La variante proposée contient une information non étayée (chiffre, contact ou affirmation non fournie) : je ne la propose pas. Reformulez votre demande ou modifiez le texte à la main.");
    return reply(`Voici une variante (${i.op}) pour « ${fieldKey} ».`, { type: "revise", summary: `Remplacer le texte du champ (${i.op}).`, element: fieldKey, before: variants.before, after: v.text, setId: Number(setId), fieldKey, variantId: v.id, manual: variants.manual });
  }
  if (i.intent === "regenerate_image") {
    const key = i.needKey || needKey;
    if (!key) return reply("Sélectionnez d'abord l'image concernée dans l'étape Images et médias, puis redemandez.");
    const est = require("../aiMedia").estimate(ctx, siteId, { needKeys: [key], provider: "demo" });
    return reply("Je peux relancer la génération de cette image avec le fournisseur de démonstration (aucun coût). Un fournisseur réel se choisit dans l'étape Images, avec son coût estimé.", { type: "media", summary: "Régénérer l'image de cet emplacement (fournisseur de démonstration).", element: key, before: "image actuelle conservée dans la médiathèque", after: "nouvelle image proposée (à accepter séparément)", needKey: key, estimate: est });
  }
  return reply("Demande non prise en charge pour l'instant.");
}
async function advice(ctx, p, view, text, step, call) {
  const ai = call || require("../marketing/ai").call;
  const context = { etape: step, site: view && view.plan ? { pages: view.plan.pages.map((x) => x.name), type: view.plan.site.typeLabel } : null };
  try {
    const out = await ai(ctx, "builder_advice", { prompt: `Question de la personne : ${text}\nContexte du projet (données) : ${JSON.stringify(context).slice(0, 3000)}`, schema: { type: "object", additionalProperties: false, required: ["answer"], properties: { answer: { type: "string" } } }, system: "Tu es le conseiller d'un constructeur de sites. Réponds en français, en 4 phrases au plus, sans rien inventer sur l'entreprise, sans prétendre modifier quoi que ce soit : tu donnes seulement un conseil.", siteId: p.siteId, effort: "low" });
    return String(out && out.answer || "").slice(0, 900) || "Je n'ai pas de conseil précis à donner.";
  } catch (e) {
    if (e && ["not_configured", "module_disabled", "quota", "rate"].includes(e.code)) return `Je ne peux pas répondre à cette question pour le moment (${e.code === "quota" || e.code === "rate" ? "limite d'utilisation de l'IA atteinte" : "l'IA n'est pas disponible pour ce site"}). Rien n'a été modifié.`;
    throw e;
  }
}

// Décision de la personne
function decide(ctx, siteId, pid, eventId, accept, { can = () => true, replaceManual = false } = {}) {
  core.row(ctx, siteId, pid);
  const e = ctx.db.prepare("SELECT * FROM mk_aib_events WHERE id = ? AND project_id = ? AND organization_id = ?").get(Number(eventId), Number(pid), ctx.organizationId);
  if (!e || e.status !== "pending") throw bad("Proposition introuvable ou déjà traitée.", "not_found");
  const pl = json(e.payload, {}), pr = pl.proposal;
  if (!accept) { ctx.db.prepare("UPDATE mk_aib_events SET status = 'rejected' WHERE id = ?").run(e.id); return { status: "rejected" }; }
  let out = {};
  if (pr.type === "plan") out = core.editPlan(ctx, siteId, pid, pr.op, pr.revision);
  else if (pr.type === "revise") {
    const done = require("../contentGen").choose(ctx, siteId, pr.setId, { fieldKey: pr.fieldKey, variantId: pr.variantId, replaceManual });
    core.log(ctx, pid, { kind: "system", text: "Texte remplacé (variante acceptée). L'historique du champ permet de revenir en arrière." });
    out = { after: done.after };
  } else if (pr.type === "media") {
    out = core.mediaStart(ctx, siteId, pid, { needKeys: [pr.needKey], provider: "demo", regenerate: true });
  } else if (pr.type === "navigate") out = { target: pr.target };
  else throw bad("Type de proposition inconnu.");
  ctx.db.prepare("UPDATE mk_aib_events SET status = 'accepted' WHERE id = ?").run(e.id);
  return { status: "accepted", result: out };
}
module.exports = { classify, propose, decide, norm };

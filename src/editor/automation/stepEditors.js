// Réglages de chaque type d'étape, affichés dans la boîte de dialogue « Modifier ». Chaque éditeur modifie un
// BROUILLON (copie des données du nœud) ; validate() reprend les règles du serveur (src/marketing/automations/steps.js,
// qui reste seul juge à l'enregistrement) pour signaler une erreur avant d'envoyer quoi que ce soit.
import { el, field, select, text, number, checkbox, note, hint, nextId } from "./ui";
import { estimateFor, unknownTags } from "../../marketing/sms/render";

// Mêmes valeurs que steps.js#UNITS / CHECKS / EDITABLE_FIELDS (à tenir synchronisées avec le serveur)
export const UNITS = [["minutes", "minutes"], ["hours", "heures"], ["days", "jours"], ["weeks", "semaines"]];
const UNIT_MS = { minutes: 60000, hours: 3600000, days: 86400000, weeks: 7 * 86400000 };
const MAX_WAIT_MS = 365 * 86400000;
export const CHECKS = [["segment", "correspond à un segment"], ["opened", "a ouvert un e-mail précédent"], ["clicked", "a cliqué un e-mail précédent"]];
export const FIELD_OPTIONS = [["first_name", "Prénom"], ["last_name", "Nom"], ["phone", "Téléphone"], ["company", "Société"], ["country", "Pays"], ["language", "Langue"], ["source", "Source"]];
export const FIELD_LABELS = Object.fromEntries(FIELD_OPTIONS);
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const PROPERTY_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const STATUS_LABELS = { unknown: "Pas de consentement", subscribed: "Abonné", unsubscribed: "Désinscrit", bounced: "Rebond", complained: "Plainte", suppressed: "Bloqué" };
export const TRANSFORM_LABELS = { none: "Aucun nettoyage", trim: "Retirer les espaces en trop", lowercase: "Tout en minuscules", uppercase: "Tout en majuscules", capitalize: "Majuscule à chaque mot", digits: "Garder seulement les chiffres (et +)" };
const WEBHOOK_VARIABLES = ["email", "prenom", "nom", "telephone", "societe", "pays", "score", "event.course_title", "event.course_url", "event.order_total", "event.order_id", "event.lesson_title", "event.learn_url"]; // mêmes variables que integrations.js
const WEEKDAY_OPTIONS = [[1, "Lundi"], [2, "Mardi"], [3, "Mercredi"], [4, "Jeudi"], [5, "Vendredi"], [6, "Samedi"], [7, "Dimanche"]];
const WAIT_UNTIL_MODES = [["time", "Une heure précise"], ["weekday", "Un jour de la semaine"], ["date", "Une date précise"], ["property", "Un champ date du contact"], ["business_hours", "Les heures ouvrables"]];
const WAIT_UNTIL_DEFAULTS = { time: { time: "09:00" }, weekday: { weekday: 1, time: "09:00" }, date: { date: "", time: "09:00" }, property: { property: "", offsetDays: 0, time: "09:00", onMissing: "continue" }, business_hours: { days: [1, 2, 3, 4, 5], from: "09:00", to: "18:00" } };
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const clone = (v) => JSON.parse(JSON.stringify(v));
const MAX_SMS_BODY = 1600; // même limite que steps.js
const SCORE_MAX = 100000, MAX_NOTE = 2000; // mêmes limites que scoring.MAX_ADJUST / audience/notes.MAX_NOTE

// ---------- Condition construite sur place (ET/OU) : même format que le moteur de segments ----------
// { op: "and"|"or", rules: [...] }, volontairement plat (comme le constructeur simple de la page Segments).
function catalogBy(ctx) { const m = {}; (ctx.data.segmentCatalog || []).forEach((f) => { m[f.field] = f; }); return m; }
function cmpInfo(cat, fieldName, cmp) { const f = cat[fieldName]; return f ? f.cmps.find((c) => c.cmp === cmp) : null; }
function defaultRuleValue(f, c) {
  if (c.value === "range") return ["", ""];
  if (c.value === "status" || c.value === "select") return f.options[0];
  if (c.value === "list") return f.lists && f.lists.length ? f.lists[0].id : undefined;
  if (c.value === "none") return undefined;
  return c.value === "days" || c.value === "number" ? undefined : "";
}
function ruleIsComplete(cat, rule) {
  const c = cmpInfo(cat, rule.field, rule.cmp);
  if (!c) return false;
  if (c.value === "none") return true;
  const v = rule.value;
  if (c.value === "range") return Array.isArray(v) && v[0] !== "" && v[1] !== "" && Number.isFinite(Number(v[0])) && Number.isFinite(Number(v[1]));
  if (c.value === "textlist") return Array.isArray(v) && v.length > 0;
  if (c.value === "days" || c.value === "number" || c.value === "list") return typeof v === "number" && Number.isFinite(v);
  return typeof v === "string" && v !== "";
}
function ruleValueControl(rule, c, f, locked) {
  const wrap = el("span", { class: "mk-value" });
  const input = (type, extra) => { const i = el("input", { type, ...extra, "aria-label": "Valeur" }); i.disabled = locked; return i; };
  if (c.value === "text") {
    const t = input("text", { maxlength: "200" }); t.value = rule.value || "";
    t.addEventListener("input", () => { rule.value = t.value; }); wrap.appendChild(t);
  } else if (c.value === "textlist") {
    const t = input("text", {}); t.value = (rule.value || []).join(", ");
    t.addEventListener("input", () => { rule.value = t.value.split(",").map((s) => s.trim()).filter(Boolean); }); wrap.appendChild(t);
  } else if (c.value === "date") {
    const d = input("date", {}); d.value = rule.value || "";
    d.addEventListener("input", () => { rule.value = d.value; }); wrap.appendChild(d);
  } else if (c.value === "days" || c.value === "number") {
    const n = input("number", c.value === "days" ? { min: "0", step: "1" } : { step: "any" });
    n.value = rule.value === undefined ? "" : String(rule.value);
    n.addEventListener("input", () => { rule.value = n.value === "" ? undefined : c.value === "days" ? parseInt(n.value, 10) : Number(n.value); }); wrap.appendChild(n);
  } else if (c.value === "range") {
    if (!Array.isArray(rule.value)) rule.value = ["", ""];
    [0, 1].forEach((k) => {
      const r = input("number", { step: "any", "aria-label": k ? "Maximum" : "Minimum" });
      r.value = rule.value[k] === "" ? "" : String(rule.value[k]);
      r.addEventListener("input", () => { rule.value[k] = r.value === "" ? "" : Number(r.value); }); wrap.appendChild(r);
    });
  } else if (c.value === "status" || c.value === "select" || c.value === "list") {
    const options = c.value === "list" ? (f.lists || []).map((l) => [l.id, l.name]) : f.options.map((o) => [o, c.value === "status" ? STATUS_LABELS[o] || o : o]);
    wrap.appendChild(select(options, rule.value, (v) => { rule.value = c.value === "list" ? Number(v) : v; }, { disabled: locked, label: "Valeur" }));
  }
  return wrap;
}
function conditionBuilder(ctx, draft, rerender) {
  const cat = catalogBy(ctx);
  const locked = ctx.locked;
  if (!draft.definition || !Array.isArray(draft.definition.rules)) draft.definition = { op: "and", rules: [] };
  const def = draft.definition;
  const box = el("div", { class: "mk-cond-builder" });
  const opRow = el("div", { class: "mk-group-op" });
  opRow.appendChild(el("span", {}, "Le contact respecte"));
  opRow.appendChild(select([["and", "tous les critères (ET)"], ["or", "au moins un critère (OU)"]], def.op || "and", (v) => { def.op = v; }, { disabled: locked, label: "Combinaison des critères" }));
  box.appendChild(opRow);
  if (!def.rules.length) box.appendChild(hint("Aucun critère : ajoutez-en un."));
  def.rules.forEach((raw, index) => {
    const not = raw && raw.op === "not";
    const rule = not ? raw.rule : raw;
    if (!rule || !cat[rule.field]) return;
    const f = cat[rule.field];
    const line = el("div", { class: "mk-rule", role: "group", "aria-label": `Critère ${index + 1}` });
    const notCb = el("input", { type: "checkbox" }); notCb.checked = not; notCb.disabled = locked;
    notCb.addEventListener("change", () => { def.rules[index] = notCb.checked ? { op: "not", rule } : rule; });
    const notLabel = el("label", { class: "mk-not" }); notLabel.appendChild(notCb); notLabel.appendChild(document.createTextNode(" NON"));
    line.appendChild(notLabel);
    const fieldSel = el("select", { "aria-label": "Champ" });
    const groups = {};
    (ctx.data.segmentCatalog || []).forEach((c) => {
      if (!groups[c.group]) { groups[c.group] = el("optgroup", { label: c.group }); fieldSel.appendChild(groups[c.group]); }
      groups[c.group].appendChild(el("option", { value: c.field }, c.label));
    });
    fieldSel.value = rule.field; fieldSel.disabled = locked;
    fieldSel.addEventListener("change", () => {
      const nf = cat[fieldSel.value];
      const next = { field: fieldSel.value, cmp: nf.cmps[0].cmp, value: defaultRuleValue(nf, nf.cmps[0]) };
      def.rules[index] = not ? { op: "not", rule: next } : next;
      rerender();
    });
    line.appendChild(fieldSel);
    line.appendChild(select(f.cmps.map((c) => [c.cmp, c.label]), rule.cmp, (v) => { rule.cmp = v; rule.value = defaultRuleValue(f, cmpInfo(cat, rule.field, v)); rerender(); }, { disabled: locked, label: "Comparaison" }));
    const c = cmpInfo(cat, rule.field, rule.cmp);
    if (c && c.value !== "none") line.appendChild(ruleValueControl(rule, c, f, locked));
    if (f.note) line.appendChild(el("p", { class: "mk-rule-note field-hint" }, f.note));
    if (!locked) {
      const rm = el("button", { type: "button", class: "btn btn-outline btn-sm", "aria-label": `Supprimer le critère ${index + 1}` }, "Supprimer");
      rm.addEventListener("click", () => { def.rules.splice(index, 1); rerender(); });
      line.appendChild(rm);
    }
    box.appendChild(line);
  });
  if (!locked) {
    const add = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "+ Ajouter un critère");
    add.addEventListener("click", () => {
      const f0 = (ctx.data.segmentCatalog || [])[0];
      if (!f0) return;
      def.rules.push({ field: f0.field, cmp: f0.cmps[0].cmp, value: defaultRuleValue(f0, f0.cmps[0]) });
      rerender();
    });
    box.appendChild(add);
  }
  return box;
}

// ---------- Étiquette : choisie parmi celles de l'organisation, ou nouvelle (créée au premier passage) ----------
const NEW_TAG = "__new__";
function tagEditor(ctx, draft, rerender, removing) {
  const box = el("div");
  const known = (ctx.data.tags || []).slice();
  const current = draft.tag || "";
  if (current && !known.includes(current)) known.unshift(current);
  if (!known.length && removing) {
    box.appendChild(note("Aucune étiquette n'existe encore dans votre audience."));
    box.appendChild(field("Étiquette à retirer", text(current, (v) => { draft.tag = v; }, { maxlength: 64, disabled: ctx.locked })));
    return box;
  }
  const typing = draft._newTag === true || (!removing && !known.length);
  const options = [["", "Choisir une étiquette…", true], ...known.map((t) => [t, t])];
  if (!removing) options.push([NEW_TAG, "+ Nouvelle étiquette…"]);
  box.appendChild(field(removing ? "Étiquette à retirer" : "Étiquette à ajouter", select(options, typing ? NEW_TAG : current, (v) => {
    if (v === NEW_TAG) { draft._newTag = true; draft.tag = ""; } else { draft._newTag = false; draft.tag = v; }
    rerender();
  }, { disabled: ctx.locked })));
  if (typing && !removing) {
    box.appendChild(field("Nom de la nouvelle étiquette", text(draft.tag, (v) => { draft.tag = v; }, { maxlength: 64, placeholder: "Client potentiel", disabled: ctx.locked }), "Elle sera créée dans votre audience au premier contact qui passera par cette étape."));
  }
  return box;
}

// Section titrée de la grande interface de configuration
function section(title, ...children) {
  const sec = el("section", { class: "mk-step-section" });
  sec.appendChild(el("h3", { class: "mk-step-section-title" }, title));
  children.flat().filter(Boolean).forEach((c) => sec.appendChild(c));
  return sec;
}
const readOnlyRow = (label, value, extra) => {
  const row = el("div", { class: "mk-step-readonly" });
  row.appendChild(el("span", { class: "mk-step-readonly-label" }, label));
  row.appendChild(el("span", { class: "mk-step-readonly-value" }, value));
  if (extra) row.appendChild(extra);
  return row;
};
const link = (href, text) => el("a", { href, class: "mk-step-link", target: "_blank", rel: "noopener" }, text);
// Où mènent les deux sorties d'une condition / d'un tirage, d'après les connexions du canevas
function branchesSection(ctx, yes, no) {
  const b = ctx.branches ? ctx.branches() : { t: null, f: null };
  const line = (label, target) => { const li = el("li"); li.append(el("strong", {}, `${label} → `), document.createTextNode(target || "aucune étape reliée : le contact sort du scénario")); return li; };
  const ul = el("ul", { class: "mk-step-branches" });
  ul.append(line(yes, b.t), line(no, b.f));
  return section("Chemins", ul, hint("Les chemins se relient sur le canevas, depuis les points de sortie du bloc."));
}

// ---------- Éditeurs (un par type d'étape) ----------
const EDITORS = {
  trigger(ctx, draft, rerender) {
    const box = el("div");
    const catalog = ctx.data.triggers;
    box.appendChild(field("Nom du scénario", text(draft.name, (v) => { draft.name = v; }, { maxlength: 150, disabled: ctx.locked })));
    const opts = Object.keys(catalog).map((k) => [k, catalog[k].label]);
    draft.triggers.forEach((trig, ti) => {
      if (draft.triggers.length > 1) box.appendChild(el("h3", { class: "mk-trigger-row-title" }, `Déclencheur ${ti + 1} sur ${draft.triggers.length}`));
      const custom = trig.event && !catalog[trig.event];
      const options = custom ? [[trig.event, `Événement personnalisé : ${trig.event}`], ...opts] : trig.event ? opts : [["", "Choisir un événement…", true], ...opts];
      box.appendChild(field("Se déclenche quand…", select(options, trig.event, (v) => { trig.event = v; trig.filter = {}; rerender(); }, { disabled: ctx.locked })));
      const filters = catalog[trig.event] ? catalog[trig.event].filters : [];
      const choices = filters.length && filters[0][2] && ctx.data.choices ? ctx.data.choices[filters[0][2]] : null;
      if (choices) {
        // Liste des vraies pages, tunnels, formulaires… (une valeur enregistrée qui n'existe plus reste visible)
        const cur = trig.filter && trig.filter.value ? String(trig.filter.value) : "";
        const list = [["", "Tous (aucun filtre)"], ...choices];
        if (cur && !choices.some((c) => c[0] === cur)) list.push([cur, `Élément supprimé (n° ${cur})`]);
        box.appendChild(field(filters[0][1], select(list, cur, (v) => { trig.filter = v ? { key: filters[0][0], value: v } : {}; }, { disabled: ctx.locked }), choices.length ? "Facultatif : « Tous » réagit à chacun." : "Aucun élément pour l'instant : le déclencheur réagira à tous."));
      } else if (filters.length) box.appendChild(field(filters[0][1], text(trig.filter && trig.filter.value, (v) => { trig.filter = v ? { key: filters[0][0], value: v } : {}; }, { disabled: ctx.locked }), "Facultatif : laissez vide pour réagir à tous."));
      const customInput = text("", (v) => { if (v) { trig.event = v.trim(); trig.filter = {}; rerender(); } }, { maxlength: 64, placeholder: "mon_evenement.special", pattern: "[a-z][a-z0-9_.]{1,63}", event: "change", disabled: ctx.locked });
      box.appendChild(field("…ou un événement personnalisé", customInput, "Remplace le choix ci-dessus (par exemple un événement envoyé par l'API). Validé en quittant le champ."));
      if (!ctx.locked && draft.triggers.length > 1) {
        const rm = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "Retirer ce déclencheur");
        rm.addEventListener("click", () => { draft.triggers.splice(ti, 1); rerender(); });
        box.appendChild(rm);
      }
    });
    if (!ctx.locked && draft.triggers.length < 3) {
      const add = el("button", { type: "button", class: "btn btn-outline btn-sm mk-step-add" }, `+ Ajouter un déclencheur (${draft.triggers.length}/3)`);
      add.addEventListener("click", () => { draft.triggers.push({ event: Object.keys(catalog)[0] || "", filter: {} }); rerender(); });
      box.appendChild(add);
    }
    if (draft.triggers.length > 1) box.appendChild(hint("N'importe lequel de ces déclencheurs démarre le scénario (3 au plus)."));
    return box;
  },
  email(ctx, draft, rerender) {
    const box = el("div", { class: "mk-step-sections" });
    const tpls = ctx.data.templates;
    const tpl = tpls.find((t) => t.id === draft.templateId);
    const sender = ctx.data.sender || {};
    box.appendChild(section("Destinataire",
      readOnlyRow("À", "Le contact qui suit ce parcours"),
      ctx.a.kind === "marketing" ? hint("Scénario marketing : le consentement est revérifié avant chaque envoi ; un contact désinscrit sort du scénario.") : hint("Scénario transactionnel : message lié au compte du contact.")));
    box.appendChild(section("Expéditeur",
      readOnlyRow("De", sender.from || "Aucune adresse d'expédition enregistrée", link("/marketing/envoi", "Réglages d'envoi")),
      sender.replyTo ? readOnlyRow("Réponse à", sender.replyTo) : null,
      sender.provider === "console" ? note("Fournisseur « console » : rien ne sera réellement envoyé tant que les réglages d'envoi ne sont pas faits.") : null));
    const msg = [];
    if (!tpls.length) msg.push(note(`Aucun modèle ${ctx.a.kind === "marketing" ? "marketing" : "transactionnel"} : créez-en un dans Modèles.`));
    msg.push(field("Modèle d'e-mail", select([["", "Choisir un modèle…", true], ...tpls.map((t) => [t.id, t.name])], tpl ? tpl.id : "", (v) => { draft.templateId = parseInt(v, 10); rerender(); }, { disabled: ctx.locked })));
    if (tpl) msg.push(readOnlyRow("Objet", tpl.subject || "(sans objet)", link(`/marketing/modeles/${tpl.id}`, "Modifier ce modèle")));
    else { const p = el("p", { class: "field-hint" }, "L'objet, le contenu et les variables viennent du modèle. "); p.appendChild(link("/marketing/modeles", "Ouvrir les modèles")); msg.push(p); }
    msg.push(checkbox("Suivre les clics sur les liens", draft.trackClicks, (v) => { draft.trackClicks = v; }, { disabled: ctx.locked }));
    box.appendChild(section("Message", msg));
    if (tpl) {
      const frame = el("iframe", { class: "mk-step-preview", title: `Aperçu du modèle « ${tpl.name} »`, sandbox: "", loading: "lazy", src: `/marketing/modeles/${tpl.id}/apercu` });
      box.appendChild(section("Aperçu", frame, hint("Rendu réel du modèle avec des données d'exemple : aucun envoi.")));
    }
    return box;
  },
  // Texte du SMS : compteur réel (même calcul que le serveur : liens courts, mention STOP ajoutée, accents qui
  // font passer de 160 à 70 caractères par SMS), prénom d'exemple pour la personnalisation.
  sms(ctx, draft) {
    const box = el("div", { class: "mk-step-sections" });
    const cfg = ctx.data.sms || {};
    box.appendChild(section("Destinataire",
      readOnlyRow("À", "Le numéro de mobile du contact"),
      hint("Seuls les contacts qui ont accepté les SMS (accord prouvé, numéro valide, non bloqué) le reçoivent ; les autres passent l'étape et continuent le parcours."),
      ctx.a.kind !== "marketing" ? note("Réservé aux scénarios marketing : l'accord SMS est un accord marketing.") : null));
    box.appendChild(section("Expéditeur",
      readOnlyRow("De", cfg.sender || "Aucun expéditeur SMS enregistré", link("/marketing/sms/reglages", "Réglages SMS")),
      cfg.provider === "console" ? note("Fournisseur SMS « console » : aucun SMS ne partira réellement tant que les réglages SMS ne sont pas faits.") : null));
    const area = el("textarea", { rows: "5", maxlength: String(MAX_SMS_BODY), "aria-describedby": "au-sms-count" });
    area.value = draft.body || "";
    area.disabled = ctx.locked;
    const count = el("p", { class: "field-hint", id: "au-sms-count", "aria-live": "polite" });
    const preview = el("p", { class: "mk-step-sentence" });
    preview.style.whiteSpace = "pre-line";
    const sync = () => {
      const body = area.value;
      if (!body.trim()) { count.textContent = "Écrivez le texte du SMS."; preview.textContent = ""; return; }
      const est = estimateFor(body, { first_name: "Awa", last_name: "Diallo" }, { baseUrl: cfg.baseUrl, trackClicks: draft.trackClicks !== false });
      const over = cfg.maxSegments && est.segments > cfg.maxSegments ? ` — au-delà de la limite de ${cfg.maxSegments} SMS (réglages SMS) : raccourcissez` : "";
      count.textContent = `${est.units} caractères avec la mention STOP · ${est.segments} SMS facturé${est.segments > 1 ? "s" : ""} par envoi (${est.encoding === "GSM-7" ? "160 caractères par SMS" : "caractères spéciaux : 70 par SMS"})${over}.`;
      preview.textContent = est.text;
    };
    area.addEventListener("input", () => { draft.body = area.value; sync(); });
    const msg = [field("Texte du SMS", area), count,
      hint("Personnalisation : {{prenom}} et {{nom}} (avec une valeur de secours : {{prenom|cher apprenant}}). La mention « STOP SMS : lien » est ajoutée automatiquement et ne peut pas être retirée."),
      checkbox("Suivre les clics (liens raccourcis)", draft.trackClicks !== false, (v) => { draft.trackClicks = v; sync(); }, { disabled: ctx.locked })];
    box.appendChild(section("Message", msg));
    box.appendChild(section("Aperçu pour « Awa Diallo »", preview, hint(`Heures de silence : ${cfg.quietStart ?? 21} h – ${cfg.quietEnd ?? 8} h à l'heure du destinataire ; un SMS prévu la nuit part le matin.`)));
    sync();
    return box;
  },
  wait(ctx, draft) {
    const box = el("div", { class: "mk-step-row" });
    box.appendChild(field("Durée", number(draft.amount, (v) => { draft.amount = v; }, { disabled: ctx.locked })));
    box.appendChild(field("Unité", select(UNITS, draft.unit, (v) => { draft.unit = v; }, { disabled: ctx.locked })));
    const sentence = el("p", { class: "mk-step-sentence", "aria-live": "polite" });
    const sync = () => { const u = (UNITS.find((x) => x[0] === draft.unit) || [null, ""])[1]; sentence.textContent = Number.isInteger(draft.amount) && draft.amount > 0 ? `Le contact attend ${draft.amount} ${draft.amount === 1 ? u.replace(/s$/, "") : u} avant l'étape suivante.` : "Indiquez une durée."; };
    box.addEventListener("input", sync); box.addEventListener("change", sync); sync();
    return section("Durée", box, sentence, hint("Un an au plus. Minutes, heures, jours ou semaines."));
  },
  wait_until(ctx, draft, rerender) {
    const box = el("div");
    const dis = ctx.locked;
    const timeInput = (value, onChange, label) => { const t = el("input", { type: "time", id: nextId(), "aria-label": label, step: "60" }); t.value = value || ""; t.disabled = dis; t.addEventListener("input", () => onChange(t.value)); return t; };
    box.appendChild(field("Attendre jusqu'à", select(WAIT_UNTIL_MODES, draft.mode, (v) => {
      // Un changement de mode repart de valeurs par défaut du nouveau mode (jamais de réglages d'un autre mode qui traînent)
      const zone = draft.zone || "contact";
      Object.keys(draft).forEach((k) => delete draft[k]);
      Object.assign(draft, { mode: v, zone }, WAIT_UNTIL_DEFAULTS[v]);
      rerender();
    }, { disabled: dis })));
    box.appendChild(field("Fuseau horaire", select([["contact", "Celui du contact (repli : celui de l'organisation)"], ["organization", "Celui de l'organisation"]], draft.zone || "contact", (v) => { draft.zone = v; }, { disabled: dis }), "Le fuseau du contact vient de sa fiche, de son compte KOLAKISA ou de son pays. Le changement d'heure est pris en compte."));
    if (draft.mode === "time") box.appendChild(field("Heure", timeInput(draft.time, (v) => { draft.time = v; }, "Heure"), "Le contact attend la prochaine fois qu'il est cette heure-là (aujourd'hui si elle n'est pas passée, sinon demain)."));
    if (draft.mode === "weekday") {
      box.appendChild(field("Jour", select(WEEKDAY_OPTIONS, draft.weekday, (v) => { draft.weekday = Number(v); }, { disabled: dis })));
      box.appendChild(field("Heure", timeInput(draft.time, (v) => { draft.time = v; }, "Heure")));
    }
    if (draft.mode === "date") {
      const d = el("input", { type: "date", id: nextId() }); d.value = draft.date || ""; d.disabled = dis; d.addEventListener("input", () => { draft.date = d.value; });
      box.appendChild(field("Date", d, "Si la date est déjà passée, le contact continue tout de suite."));
      box.appendChild(field("Heure", timeInput(draft.time, (v) => { draft.time = v; }, "Heure")));
    }
    if (draft.mode === "property") {
      const props = ctx.data.dateProperties || [];
      if (!props.length) box.appendChild(note("Aucune propriété de type date : créez-en une dans Audience → Propriétés."));
      else box.appendChild(field("Champ date du contact", select([["", "Choisir un champ…", true], ...props.map((p) => [p.key, p.label])], props.some((p) => p.key === draft.property) ? draft.property : "", (v) => { draft.property = v; }, { disabled: dis })));
      box.appendChild(field("Décalage (jours)", number(draft.offsetDays === undefined ? 0 : draft.offsetDays, (v) => { draft.offsetDays = v; }, { min: -365, max: 365, disabled: dis }), "Négatif : avant la date (−3 = trois jours avant) ; positif : après ; 0 : le jour même."));
      box.appendChild(field("Heure", timeInput(draft.time, (v) => { draft.time = v; }, "Heure")));
      box.appendChild(field("Si le champ est vide", select([["continue", "Passer l'étape et continuer"], ["exit", "Sortir du scénario"]], draft.onMissing || "continue", (v) => { draft.onMissing = v; }, { disabled: dis })));
    }
    if (draft.mode === "business_hours") {
      const days = el("div", { class: "mk-step-days" });
      WEEKDAY_OPTIONS.forEach(([n, name]) => days.appendChild(checkbox(name, (draft.days || []).includes(n), (on) => { const set = new Set(draft.days || []); if (on) set.add(n); else set.delete(n); draft.days = [...set].sort((a, b) => a - b); }, { disabled: dis })));
      box.appendChild(section("Jours ouvrables", days));
      const row = el("div", { class: "mk-step-row" });
      row.appendChild(field("Ouverture", timeInput(draft.from, (v) => { draft.from = v; }, "Heure d'ouverture")));
      row.appendChild(field("Fermeture", timeInput(draft.to, (v) => { draft.to = v; }, "Heure de fermeture")));
      box.appendChild(row);
      box.appendChild(hint("Dans la plage, le contact continue tout de suite ; sinon il attend la prochaine ouverture."));
    }
    return box;
  },
  wait_for_event(ctx, draft) {
    const box = el("div");
    box.appendChild(field("Événement attendu", text(draft.event, (v) => { draft.event = v.trim(); }, { maxlength: 64, placeholder: "lms.course_completed", pattern: "[a-z][a-z0-9_.]{1,63}", disabled: ctx.locked }), "Minuscules, chiffres, « _ » et « . » ; commence par une lettre."));
    const row = el("div", { class: "mk-step-row" });
    row.appendChild(field("Délai maximal", number(draft.amount, (v) => { draft.amount = v; }, { disabled: ctx.locked })));
    row.appendChild(field("Unité", select(UNITS, draft.unit, (v) => { draft.unit = v; }, { disabled: ctx.locked })));
    box.appendChild(row);
    box.appendChild(hint("Si l'événement n'arrive jamais, le scénario reprend une fois le délai maximal écoulé : jamais d'attente sans fin."));
    return box;
  },
  condition(ctx, draft, rerender) {
    const box = el("div");
    box.appendChild(field("Condition", select(CHECKS.map((c) => [c[0], `Le contact ${c[1]}`]), draft.check, (v) => {
      draft.check = v;
      if (v === "segment" && draft.definition === undefined) { const s0 = ctx.data.segments[0]; draft.definition = s0 ? clone(s0.definition) : null; draft._segmentId = s0 ? s0.id : null; }
      rerender();
    }, { disabled: ctx.locked })));
    if (draft.check === "segment") {
      const mode = draft._segmentId != null ? "saved" : "custom";
      box.appendChild(field("Comment définir la condition ?", select([["saved", "Choisir un segment déjà enregistré"], ["custom", "Construire la condition ici (ET / OU)"]], mode, (v) => {
        if (v === "saved") { const s0 = ctx.data.segments[0]; draft._segmentId = s0 ? s0.id : null; draft.definition = s0 ? clone(s0.definition) : null; }
        else { draft._segmentId = null; draft.definition = draft.definition && Array.isArray(draft.definition.rules) ? draft.definition : { op: "and", rules: [] }; }
        rerender();
      }, { disabled: ctx.locked })));
      if (mode === "saved") {
        if (!ctx.data.segments.length) box.appendChild(note("Aucun segment enregistré : créez-en un dans Segments, ou construisez la condition ici."));
        else box.appendChild(field("Segment", select(ctx.data.segments.map((s) => [s.id, s.name]), draft._segmentId, (v) => {
          const seg = ctx.data.segments.find((s) => String(s.id) === v);
          if (seg) { draft._segmentId = seg.id; draft.definition = clone(seg.definition); }
        }, { disabled: ctx.locked })));
      } else if (!(ctx.data.segmentCatalog || []).length) box.appendChild(note("Aucun champ disponible."));
      else box.appendChild(conditionBuilder(ctx, draft, rerender));
    } else {
      const refs = ctx.emailNodes();
      if (!refs.length) box.appendChild(note("Aucune étape « Envoyer un e-mail » sur le canevas : ajoutez-en une pour vérifier son ouverture ou son clic."));
      else box.appendChild(field("E-mail concerné", select([["", "Choisir un e-mail…", true], ...refs.map((r) => [r.id, `L'e-mail « ${r.label} »`])], draft.ref, (v) => { draft.ref = v; }, { disabled: ctx.locked }), "Il doit précéder cette condition dans le scénario."));
    }
    box.appendChild(branchesSection(ctx, "Si oui", "Si non"));
    return box;
  },
  split(ctx, draft) {
    const box = el("div");
    const rest = el("p", { class: "field-hint", "aria-live": "polite" });
    const sync = () => { rest.textContent = Number.isInteger(draft.percentage) && draft.percentage >= 1 && draft.percentage <= 99 ? `Branche B : ${100 - draft.percentage} %` : "Branche B : le reste"; };
    box.appendChild(field("Branche A (%)", number(draft.percentage, (v) => { draft.percentage = v; sync(); }, { min: 1, max: 99, disabled: ctx.locked })));
    sync(); box.appendChild(rest);
    box.appendChild(hint("Tirage au sort à chaque passage, sans lien avec les données du contact (utile pour un test A/B du parcours)."));
    box.appendChild(branchesSection(ctx, "Chemin A", "Chemin B"));
    return box;
  },
  update_field(ctx, draft, rerender) {
    const box = el("div");
    const isProp = typeof draft.field === "string" && draft.field.indexOf("property:") === 0;
    box.appendChild(field("Champ à modifier", select([["", "Choisir un champ…", true], ...FIELD_OPTIONS, ["property", "Propriété personnalisée…"]], isProp ? "property" : draft.field, (v) => {
      draft.field = v === "property" ? "property:" : v; rerender();
    }, { disabled: ctx.locked })));
    if (isProp) box.appendChild(field("Nom de la propriété", text(draft.field.slice(9), (v) => { draft.field = `property:${v.trim()}`; }, { maxlength: 40, placeholder: "niveau_client", disabled: ctx.locked }), "Clé de la propriété (page Propriétés) : minuscules, chiffres et « _ »."));
    box.appendChild(field("Nouvelle valeur", text(draft.value, (v) => { draft.value = v; }, { maxlength: 300, disabled: ctx.locked }), "Laissez vide pour effacer la valeur."));
    return box;
  },
  copy_field(ctx, draft) {
    const box = el("div");
    const props = ctx.data.properties || [];
    const options = (fields, withEmpty) => [["", "Choisir un champ…", true], ...fields, ...props.map((p) => [`property:${p.key}`, `Propriété : ${p.label}`])];
    const readable = [...FIELD_OPTIONS.slice(0, 2), ["email", "E-mail"], ...FIELD_OPTIONS.slice(2)];
    box.appendChild(field("Copier depuis", select(options(readable), draft.from || "", (v) => { draft.from = v; }, { disabled: ctx.locked })));
    box.appendChild(field("Vers", select(options(FIELD_OPTIONS), draft.to || "", (v) => { draft.to = v; }, { disabled: ctx.locked }), "L'e-mail ne peut pas être modifié. Une valeur refusée par le type de la propriété est notée au journal et le scénario continue."));
    box.appendChild(field("Nettoyage", select(Object.keys(TRANSFORM_LABELS).map((k) => [k, TRANSFORM_LABELS[k]]), draft.transform || "none", (v) => { draft.transform = v; }, { disabled: ctx.locked })));
    box.appendChild(hint("Si le champ de départ est vide, rien n'est copié (la destination n'est jamais effacée par une copie)."));
    return box;
  },
  set_date(ctx, draft, rerender) {
    const box = el("div");
    const dates = (ctx.data.properties || []).filter((p) => p.type === "date");
    if (!dates.length) { box.appendChild(note("Aucune propriété de type date : créez-en une dans Audience → Propriétés.")); return box; }
    const opts = [["", "Choisir un champ date…", true], ...dates.map((p) => [`property:${p.key}`, p.label])];
    box.appendChild(field("Champ date à renseigner", select(opts, draft.property || "", (v) => { draft.property = v; }, { disabled: ctx.locked })));
    box.appendChild(field("Point de départ", select([["today", "Aujourd'hui"], ["property", "Un autre champ date du contact"]], draft.base || "today", (v) => { draft.base = v; if (v === "today") delete draft.baseProperty; rerender(); }, { disabled: ctx.locked })));
    if (draft.base === "property") box.appendChild(field("Champ date de départ", select(opts, draft.baseProperty || "", (v) => { draft.baseProperty = v; }, { disabled: ctx.locked })));
    box.appendChild(field("Décalage (jours)", number(draft.offsetDays === undefined ? 0 : draft.offsetDays, (v) => { draft.offsetDays = v; }, { min: -3650, max: 3650, disabled: ctx.locked }), "Négatif : avant ; positif : après ; 0 : la date de départ elle-même."));
    if (draft.base !== "property") box.appendChild(field("Fuseau horaire", select([["contact", "Celui du contact (repli : celui de l'organisation)"], ["organization", "Celui de l'organisation"]], draft.zone || "contact", (v) => { draft.zone = v; }, { disabled: ctx.locked }), "Détermine ce qu'est « aujourd'hui » pour ce contact."));
    return box;
  },
  calculate(ctx, draft) {
    const box = el("div");
    const nums = (ctx.data.properties || []).filter((p) => p.type === "number");
    if (!nums.length) { box.appendChild(note("Aucune propriété de type nombre : créez-en une dans Audience → Propriétés.")); return box; }
    box.appendChild(field("Champ nombre", select([["", "Choisir un champ…", true], ...nums.map((p) => [`property:${p.key}`, p.label])], draft.property || "", (v) => { draft.property = v; }, { disabled: ctx.locked })));
    box.appendChild(field("Opération", select([["add", "Ajouter"], ["subtract", "Retirer"], ["multiply", "Multiplier par"], ["set", "Définir à"]], draft.op || "add", (v) => { draft.op = v; }, { disabled: ctx.locked })));
    const val = el("input", { type: "number", step: "any", id: nextId(), inputmode: "decimal" });
    val.value = draft.value === undefined ? "" : String(draft.value); val.disabled = ctx.locked;
    val.addEventListener("input", () => { draft.value = val.value === "" ? undefined : Number(val.value); });
    box.appendChild(field("Valeur", val, "Un champ vide compte pour 0. Le résultat est arrondi à 6 décimales."));
    return box;
  },
  adjust_score(ctx, draft, rerender) {
    const box = el("div");
    box.appendChild(field("Action sur le score", select([["add", "Ajouter des points"], ["subtract", "Retirer des points"], ["set", "Définir le score"]], draft.mode, (v) => { draft.mode = v; rerender(); }, { disabled: ctx.locked })));
    box.appendChild(field(draft.mode === "set" ? "Nouveau score" : "Nombre de points", number(draft.points, (v) => { draft.points = v; }, { min: draft.mode === "set" ? 0 : 1, max: SCORE_MAX, disabled: ctx.locked })));
    box.appendChild(hint("Le score d'un contact ne descend jamais sous 0. Chaque modification est tracée dans l'historique du score, n'est appliquée qu'une fois par passage et reste après un recalcul des règles. Elle ne déclenche pas d'événement de changement de niveau."));
    return box;
  },
  webhook_call(ctx, draft, rerender) {
    const box = el("div");
    const hooks = ctx.data.webhooks || [];
    if (!hooks.length) { box.appendChild(note("Aucun webhook : créez-en un dans Intégrations → Webhooks (l'adresse du destinataire et son secret de signature y sont réglés).")); return box; }
    const dis = ctx.locked;
    if (!Array.isArray(draft.fields)) draft.fields = [];
    box.appendChild(field("Webhook à appeler", select([["", "Choisir un webhook…", true], ...hooks.map((w) => [w.id, `${w.name} — ${w.host}${w.enabled ? "" : " (en pause)"}`])], hooks.some((w) => w.id === draft.endpointId) ? draft.endpointId : "", (v) => { draft.endpointId = parseInt(v, 10); }, { disabled: dis })));
    const rows = el("div", { class: "mk-kv-rows" });
    draft.fields.forEach((f, i) => {
      const row = el("div", { class: "mk-step-row mk-kv-row" });
      row.appendChild(field("Nom du champ", text(f.key, (v) => { f.key = v; }, { maxlength: 40, placeholder: "email_client", disabled: dis })));
      row.appendChild(field("Valeur", text(f.value, (v) => { f.value = v; }, { maxlength: 300, placeholder: "{{email}}", disabled: dis })));
      if (!dis) { const rm = el("button", { type: "button", class: "btn btn-ghost btn-sm", "aria-label": `Retirer le champ ${i + 1}` }, "Retirer"); rm.addEventListener("click", () => { draft.fields.splice(i, 1); rerender(); }); row.appendChild(rm); }
      rows.appendChild(row);
    });
    box.appendChild(section("Données envoyées", rows));
    if (!dis && draft.fields.length < 20) { const add = el("button", { type: "button", class: "btn btn-outline btn-sm" }, "Ajouter un champ"); add.addEventListener("click", () => { draft.fields.push({ key: "", value: "" }); rerender(); }); box.appendChild(add); }
    box.appendChild(hint(`Variables : ${WEBHOOK_VARIABLES.map((v) => `{{${v}}}`).join(", ")}. Le destinataire reçoit toujours le contact, le scénario et l'étape, plus ces champs sous « fields ».`));
    box.appendChild(hint("Requête POST signée (en-tête X-KOYEKOLA-Signature), envoyée en arrière-plan avec reprises automatiques en cas d'erreur. Le résultat de chaque envoi est visible dans Intégrations → Webhooks (Dernières livraisons). Le scénario n'attend pas la réponse."));
    return box;
  },
  start_automation: (ctx, draft) => automationTargetEditor(ctx, draft, "Scénario à démarrer", true),
  stop_automation: (ctx, draft) => automationTargetEditor(ctx, draft, "Scénario à arrêter", false),
  add_note(ctx, draft) {
    const box = el("div");
    const ta = el("textarea", { id: nextId(), rows: "5", maxlength: String(MAX_NOTE) });
    ta.value = draft.body || ""; ta.disabled = ctx.locked;
    ta.addEventListener("input", () => { draft.body = ta.value; });
    box.appendChild(field("Texte de la note", ta, `Texte simple (${MAX_NOTE} caractères au plus), visible dans la chronologie du contact. Aucun e-mail n'est envoyé.`));
    return box;
  },
  add_tag: (ctx, draft, rerender) => tagEditor(ctx, draft, rerender, false),
  remove_tag: (ctx, draft, rerender) => tagEditor(ctx, draft, rerender, true),
  add_to_list: (ctx, draft) => listEditor(ctx, draft, "Ajouter à la liste"),
  remove_from_list: (ctx, draft) => listEditor(ctx, draft, "Retirer de la liste"),
};
const STATUS_TEXT = { draft: "brouillon", active: "actif", paused: "en pause" };
function automationTargetEditor(ctx, draft, label, starting) {
  const box = el("div");
  const list = ctx.data.automations || [];
  if (!list.length) { box.appendChild(note("Aucun autre scénario : créez-en un dans Automatisations.")); return box; }
  const warn = el("p", { class: "field-hint", "aria-live": "polite" });
  const sync = () => {
    const t = list.find((x) => x.id === draft.automationId);
    warn.textContent = starting && t && t.status !== "active" ? `« ${t.name} » n'est pas actif : cette étape ne démarrera rien tant qu'il ne l'est pas.` : "";
  };
  box.appendChild(field(label, select([["", "Choisir un scénario…", true], ...list.map((x) => [x.id, `${x.name} (${STATUS_TEXT[x.status] || x.status})`])], list.some((x) => x.id === draft.automationId) ? draft.automationId : "", (v) => { draft.automationId = parseInt(v, 10); sync(); }, { disabled: ctx.locked })));
  box.appendChild(warn); sync();
  box.appendChild(hint(starting
    ? "Le contact entre dans ce scénario comme s'il avait déclenché son déclencheur : une seule fois (jamais deux fois dans le même scénario, ce qui évite les boucles), avec ses règles de consentement. Il continue ensuite ICI sans attendre."
    : "Si le contact est en cours dans ce scénario, il en sort tout de suite ; sinon rien ne se passe. Il reste dans celui-ci."));
  return box;
}
function listEditor(ctx, draft, label) {
  const box = el("div");
  if (!ctx.data.lists.length) box.appendChild(note("Aucune liste : créez-en une dans Listes."));
  else box.appendChild(field(label, select([["", "Choisir une liste…", true], ...ctx.data.lists.map((l) => [l.id, l.name])], ctx.data.lists.some((l) => l.id === draft.listId) ? draft.listId : "", (v) => { draft.listId = parseInt(v, 10); }, { disabled: ctx.locked })));
  return box;
}

export const hasEditor = (type) => Object.hasOwn(EDITORS, type);
export const buildEditor = (type, ctx, draft, rerender) => EDITORS[type](ctx, draft, rerender);

// ---------- Validation avant application (mêmes règles que steps.js) ----------
function waitErrors(d, label) {
  const unit = Object.hasOwn(UNIT_MS, d.unit) ? d.unit : null;
  if (!Number.isInteger(d.amount) || d.amount < 1) return [`${label} : un nombre entier supérieur ou égal à 1.`];
  if (!unit) return ["Unité invalide (minutes, heures, jours ou semaines)."];
  if (d.amount * UNIT_MS[unit] > MAX_WAIT_MS) return [`${label} : un an au plus.`];
  return [];
}
export function validate(type, ctx, d) {
  switch (type) {
    case "trigger": {
      const errors = [];
      if (!String(d.name || "").trim()) errors.push("Le nom du scénario est obligatoire.");
      d.triggers.forEach((t, i) => { if (!t.event || (!ctx.data.triggers[t.event] && !EVENT_NAME.test(t.event))) errors.push(`Déclencheur ${i + 1} : événement invalide.`); });
      return errors;
    }
    case "email": return ctx.data.templates.some((t) => t.id === d.templateId) ? [] : ["Choisissez le modèle d'e-mail à envoyer."];
    case "sms": {
      const body = String(d.body || "").trim();
      if (ctx.a.kind !== "marketing") return ["L'envoi d'un SMS est réservé aux scénarios marketing."];
      if (!body) return ["Écrivez le texte du SMS."];
      if (body.length > MAX_SMS_BODY) return [`Texte du SMS trop long (${MAX_SMS_BODY} caractères au plus).`];
      const tags = unknownTags(body);
      return tags.length ? [`Balise inconnue : ${tags.join(", ")}. Utilisez {{prenom}} ou {{nom}}.`] : [];
    }
    case "wait": return waitErrors(d, "Durée");
    case "wait_for_event": return [...(EVENT_NAME.test(d.event || "") ? [] : ["Nom d'événement invalide (minuscules, chiffres, « _ » et « . », 2 à 64 caractères, commence par une lettre)."]), ...waitErrors(d, "Délai maximal")];
    case "wait_until": {
      const errors = [];
      const hourOk = (v) => typeof v === "string" && TIME_RE.test(v);
      if (!["time", "weekday", "date", "property", "business_hours"].includes(d.mode)) return ["Choisissez jusqu'à quand attendre."];
      if (d.mode !== "business_hours" && !hourOk(d.time)) errors.push("Heure invalide (HH:MM).");
      if (d.mode === "weekday" && !(Number.isInteger(d.weekday) && d.weekday >= 1 && d.weekday <= 7)) errors.push("Choisissez un jour de la semaine.");
      if (d.mode === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(d.date || "")) errors.push("Choisissez une date.");
      if (d.mode === "property") {
        if (!(ctx.data.dateProperties || []).some((p) => p.key === d.property)) errors.push("Choisissez un champ date du contact.");
        if (!(Number.isInteger(d.offsetDays) && d.offsetDays >= -365 && d.offsetDays <= 365)) errors.push("Décalage : un nombre entier de jours, de −365 à 365.");
      }
      if (d.mode === "business_hours") {
        if (!Array.isArray(d.days) || !d.days.length) errors.push("Choisissez au moins un jour ouvrable.");
        if (!hourOk(d.from) || !hourOk(d.to)) errors.push("Heures d'ouverture et de fermeture invalides (HH:MM).");
        else if (d.from >= d.to) errors.push("L'ouverture doit précéder la fermeture.");
      }
      return errors;
    }
    case "split": return Number.isInteger(d.percentage) && d.percentage >= 1 && d.percentage <= 99 ? [] : ["Pourcentage de la branche A : un nombre entier de 1 à 99."];
    case "update_field": {
      const errors = [];
      if (typeof d.field === "string" && d.field.indexOf("property:") === 0) { if (!PROPERTY_KEY.test(d.field.slice(9))) errors.push("Nom de propriété invalide (minuscules, chiffres et « _ », commence par une lettre, 40 caractères au plus)."); }
      else if (!FIELD_LABELS[d.field]) errors.push("Choisissez le champ à modifier.");
      if (String(d.value || "").length > 300) errors.push("Valeur trop longue (300 caractères au plus).");
      return errors;
    }
    case "copy_field": {
      const props = (ctx.data.properties || []).map((p) => `property:${p.key}`);
      const okFrom = (v) => ["first_name", "last_name", "email", "phone", "company", "country", "language", "source"].includes(v) || props.includes(v);
      const okTo = (v) => ["first_name", "last_name", "phone", "company", "country", "language", "source"].includes(v) || props.includes(v);
      const errors = [];
      if (!okFrom(d.from)) errors.push("Choisissez le champ de départ.");
      if (!okTo(d.to)) errors.push("Choisissez le champ de destination.");
      if (d.from && d.from === d.to) errors.push("La source et la destination sont identiques.");
      return errors;
    }
    case "set_date": {
      const dates = (ctx.data.properties || []).filter((p) => p.type === "date").map((p) => `property:${p.key}`);
      const errors = [];
      if (!dates.includes(d.property)) errors.push("Choisissez le champ date à renseigner.");
      if (d.base === "property" && !dates.includes(d.baseProperty)) errors.push("Choisissez le champ date de départ.");
      if (!(Number.isInteger(d.offsetDays) && d.offsetDays >= -3650 && d.offsetDays <= 3650)) errors.push("Décalage : un nombre entier de jours, de −3650 à 3650.");
      return errors;
    }
    case "calculate": {
      const errors = [];
      if (!(ctx.data.properties || []).some((p) => p.type === "number" && `property:${p.key}` === d.property)) errors.push("Choisissez le champ nombre à modifier.");
      if (typeof d.value !== "number" || !Number.isFinite(d.value) || Math.abs(d.value) > 1e9) errors.push("Valeur : un nombre entre −1 000 000 000 et 1 000 000 000.");
      return errors;
    }
    case "adjust_score": {
      if (!["add", "subtract", "set"].includes(d.mode)) return ["Choisissez l'action sur le score."];
      const min = d.mode === "set" ? 0 : 1;
      return Number.isInteger(d.points) && d.points >= min && d.points <= SCORE_MAX ? [] : [`Points : un nombre entier de ${min} à ${SCORE_MAX}.`];
    }
    case "add_note": {
      const b = String(d.body || "").trim();
      if (!b) return ["Écrivez le texte de la note."];
      return b.length > MAX_NOTE ? [`Note trop longue (${MAX_NOTE} caractères au plus).`] : [];
    }
    case "webhook_call": {
      const errors = [];
      if (!(ctx.data.webhooks || []).some((w) => w.id === d.endpointId)) errors.push("Choisissez le webhook à appeler.");
      const seen = new Set();
      (d.fields || []).forEach((f, i) => {
        const key = String(f.key || "").trim();
        if (!/^[a-z][a-z0-9_]{0,39}$/i.test(key)) errors.push(`Champ ${i + 1} : nom invalide (lettres, chiffres et « _ », commence par une lettre).`);
        else if (seen.has(key.toLowerCase())) errors.push(`Le champ « ${key} » est présent deux fois.`);
        seen.add(key.toLowerCase());
        const value = String(f.value || "");
        if (value.length > 300) errors.push(`Champ ${i + 1} : valeur trop longue (300 caractères au plus).`);
        const unknown = [...value.matchAll(/\{\{\s*([a-z_.]+)\s*\}\}/g)].map((m) => m[1]).filter((v) => !WEBHOOK_VARIABLES.includes(v));
        if (unknown.length) errors.push(`Champ ${i + 1} : variable inconnue ${unknown.join(", ")}.`);
      });
      return errors;
    }
    case "start_automation": case "stop_automation": return (ctx.data.automations || []).some((x) => x.id === d.automationId) ? [] : ["Choisissez un scénario."];
    case "add_tag": case "remove_tag": {
      const t = String(d.tag || "").trim();
      if (!t) return ["Choisissez une étiquette."];
      return t.length > 64 ? ["Nom d'étiquette trop long (64 caractères au plus)."] : [];
    }
    case "add_to_list": case "remove_from_list": return ctx.data.lists.some((l) => l.id === d.listId) ? [] : ["Choisissez une liste."];
    case "condition": {
      if (d.check === "segment") {
        if (d._segmentId != null) return ctx.data.segments.some((s) => s.id === d._segmentId) ? [] : ["Choisissez un segment."];
        const cat = catalogBy(ctx);
        const rules = d.definition && Array.isArray(d.definition.rules) ? d.definition.rules : [];
        if (!rules.length) return ["Ajoutez au moins un critère."];
        const incomplete = rules.map((r, i) => (ruleIsComplete(cat, r && r.op === "not" ? r.rule : r) ? null : i + 1)).filter(Boolean);
        return incomplete.length ? [`Critère${incomplete.length > 1 ? "s" : ""} ${incomplete.join(", ")} incomplet${incomplete.length > 1 ? "s" : ""} : renseignez la valeur.`] : [];
      }
      return ctx.emailNodes().some((r) => r.id === d.ref) ? [] : ["Choisissez l'e-mail dont l'ouverture ou le clic est vérifié."];
    }
    default: return [];
  }
}
// Données finales (le marqueur d'interface « nouvelle étiquette » et les espaces superflus ne sont jamais enregistrés)
export function clean(type, d) {
  const out = clone(d);
  delete out._newTag;
  if (type === "add_tag" || type === "remove_tag") out.tag = String(out.tag || "").trim();
  if (type === "trigger") out.name = String(out.name || "").trim();
  if (type === "webhook_call") out.fields = (out.fields || []).map((f) => ({ key: String(f.key || "").trim(), value: String(f.value || "").trim() }));
  if (type === "sms" || type === "add_note") out.body = String(out.body || "").replace(/\r\n?/g, "\n").trim();
  return out;
}

// Actions de temps. Aucun processus ne « dort » : le moteur enregistre une date de réveil en base (survit à un redémarrage).
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { UNITS, EVENT_NAME, bad, withNext, validDuration } = require("./shared");

defineAction({
  type: "wait", category: "temps", label: STEP_LABELS.wait, description: "Une durée fixe avant la suite", version: 1, status: "available",
  validate({ raw, i, steps }) {
    if (!validDuration(raw)) throw bad(i, "attente invalide (nombre entier ≥ 1, en minutes, heures, jours ou semaines, un an au plus).");
    return withNext({ type: "wait", amount: raw.amount, unit: raw.unit }, raw, i, steps);
  },
  execute: ({ step }) => ({ log: ["wait", `${step.amount} ${step.unit}`], wait: step.amount * UNITS[step.unit] }),
});

// Attend qu'un événement précis survienne pour CE contact (ex. « a terminé la formation ») ou, à défaut, le
// délai maximal — jamais une attente indéfinie (un contact ne doit jamais pouvoir rester bloqué pour
// toujours). Reprend alors la suite comme une attente ordinaire, un seul chemin, aucun embranchement.
// Techniquement une attente ORDINAIRE (même mécanisme de réveil par date) : la seule différence est qu'un
// événement correspondant, s'il arrive avant le délai, la fait AUSSI reprendre plus tôt — voir engine.js#onEvent.
defineAction({
  type: "wait_for_event", category: "temps", label: STEP_LABELS.wait_for_event, description: "Un événement, avec un délai maximal", version: 1, status: "available",
  validate({ raw, i, steps }) {
    if (typeof raw.event !== "string" || !EVENT_NAME.test(raw.event)) throw bad(i, "nom d'événement invalide (minuscules, chiffres, « _ » et « . », 2 à 64 caractères, commence par une lettre).");
    if (!validDuration(raw)) throw bad(i, "délai maximal invalide (nombre entier ≥ 1, en minutes, heures, jours ou semaines, un an au plus).");
    return withNext({ type: "wait_for_event", event: raw.event, amount: raw.amount, unit: raw.unit }, raw, i, steps);
  },
  execute: ({ step }) => ({ log: ["wait_for_event", `${step.event} (${step.amount} ${step.unit} au plus)`], wait: step.amount * UNITS[step.unit] }),
});

// ---------- Attendre jusqu'à une heure, un jour, une date, un champ date ou les heures ouvrables ----------
// Toujours calculé dans un VRAI fuseau horaire (celui du contact — champ, compte KOLAKISA, pays — avec repli sur le fuseau de
// l'organisation, ou celui de l'organisation) : changement d'heure compris. Une échéance déjà passée ne bloque pas : le contact
// continue. Au-delà d'un an, l'étape est réévaluée un an plus tard (jamais une attente indéfinie).
const sendtime = require("../../sending/sendtime");
const { getContactProperties, listProperties } = require("../../audience/properties");
const { MAX_WAIT_MS } = require("./shared");

const WAIT_MODES = ["time", "weekday", "date", "property", "business_hours"];
const ZONES = ["contact", "organization"];
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;
const PROPERTY_KEY = /^[a-z][a-z0-9_]{0,39}$/;
const DAY_MS = 86400000;
const realYmd = (v) => { const m = YMD.exec(v); if (!m) return false; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] && +m[1] >= 2000 && +m[1] <= 2100; };
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);
const isoWeekday = (ymd) => { const d = new Date(`${ymd}T12:00:00Z`).getUTCDay(); return d === 0 ? 7 : d; }; // 1 = lundi … 7 = dimanche
const hm = (t) => { const m = TIME.exec(t); return [Number(m[1]), Number(m[2])]; };

defineAction({
  type: "wait_until", category: "temps", label: STEP_LABELS.wait_until, description: "Une heure, un jour, une date, un champ date, les heures ouvrables", version: 1, status: "available",
  validate({ ctx, raw, i, steps }) {
    if (!WAIT_MODES.includes(raw.mode)) throw bad(i, "mode d'attente invalide (heure, jour de la semaine, date, champ date, heures ouvrables).");
    const zone = raw.zone === undefined ? "contact" : raw.zone;
    if (!ZONES.includes(zone)) throw bad(i, "fuseau horaire invalide (celui du contact ou celui de l'organisation).");
    const timeOf = (v, label) => { if (typeof v !== "string" || !TIME.test(v)) throw bad(i, `${label} invalide (HH:MM, de 00:00 à 23:59).`); return v; };
    const base = { type: "wait_until", mode: raw.mode, zone };
    if (raw.mode === "time") return withNext({ ...base, time: timeOf(raw.time, "heure") }, raw, i, steps);
    if (raw.mode === "weekday") {
      if (!Number.isInteger(raw.weekday) || raw.weekday < 1 || raw.weekday > 7) throw bad(i, "jour de la semaine invalide (1 = lundi … 7 = dimanche).");
      return withNext({ ...base, weekday: raw.weekday, time: timeOf(raw.time, "heure") }, raw, i, steps);
    }
    if (raw.mode === "date") {
      if (typeof raw.date !== "string" || !realYmd(raw.date)) throw bad(i, "date invalide (AAAA-MM-JJ, une date qui existe).");
      return withNext({ ...base, date: raw.date, time: timeOf(raw.time, "heure") }, raw, i, steps);
    }
    if (raw.mode === "property") {
      const prop = typeof raw.property === "string" && PROPERTY_KEY.test(raw.property) ? listProperties(ctx).find((p) => p.key === raw.property) : null;
      if (!prop || prop.type !== "date") throw bad(i, "choisissez une propriété personnalisée de type date.");
      const offsetDays = raw.offsetDays === undefined ? 0 : raw.offsetDays;
      if (!Number.isInteger(offsetDays) || offsetDays < -365 || offsetDays > 365) throw bad(i, "décalage invalide (un nombre entier de jours, de −365 à 365 ; négatif = avant la date).");
      const onMissing = raw.onMissing === undefined ? "continue" : raw.onMissing;
      if (!["continue", "exit"].includes(onMissing)) throw bad(i, "comportement sans date invalide (continuer ou sortir du scénario).");
      return withNext({ ...base, property: raw.property, offsetDays, time: timeOf(raw.time, "heure"), onMissing }, raw, i, steps);
    }
    // business_hours
    const days = Array.isArray(raw.days) ? [...new Set(raw.days)].sort((a, b) => a - b) : [];
    if (!days.length || days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) throw bad(i, "choisissez au moins un jour ouvrable (1 = lundi … 7 = dimanche).");
    const from = timeOf(raw.from, "heure d'ouverture"), to = timeOf(raw.to, "heure de fermeture");
    if (from >= to) throw bad(i, "l'heure d'ouverture doit précéder l'heure de fermeture.");
    return withNext({ ...base, days, from, to }, raw, i, steps);
  },
  execute({ ctx, step, contact, now }) {
    const zones = step.zone === "contact" ? sendtime.contactZones(ctx, [contact.id])[contact.id] : null;
    const tz = zones ? zones.tz : sendtime.orgTimeZone(ctx);
    const at = (ymd, t) => { const [h, m] = hm(t); return sendtime.zonedToUtc(ymd, h, m, tz); };
    const today = sendtime.localYmd(now, tz);
    let target = null;
    if (step.mode === "time") {
      target = at(today, step.time);
      if (target < now) target = at(addDays(today, 1), step.time);
    } else if (step.mode === "weekday") {
      for (let k = 0; k <= 7 && target === null; k++) { const ymd = addDays(today, k); if (isoWeekday(ymd) === step.weekday && at(ymd, step.time) >= now) target = at(ymd, step.time); }
    } else if (step.mode === "date") {
      target = at(step.date, step.time);
    } else if (step.mode === "property") {
      const value = getContactProperties(ctx, contact.id)[step.property];
      if (typeof value !== "string" || !realYmd(value)) {
        return step.onMissing === "exit" ? { log: ["wait_until", `champ « ${step.property} » sans date : sortie du scénario`], exit: "date_missing" } : { next: true, log: ["wait_until", `champ « ${step.property} » sans date : étape passée`] };
      }
      target = at(addDays(value, step.offsetDays), step.time);
    } else {
      for (let k = 0; k <= 8 && target === null; k++) {
        const ymd = addDays(today, k);
        if (!step.days.includes(isoWeekday(ymd))) continue;
        const open = at(ymd, step.from), close = at(ymd, step.to);
        if (now >= open && now < close) target = now; // dans la plage : on continue tout de suite
        else if (now < open) target = open;
      }
    }
    const remaining = target - now;
    if (remaining <= 0) return { next: true, log: ["wait_until", "échéance atteinte : le contact continue"] };
    const when = new Intl.DateTimeFormat("fr-FR", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(new Date(target));
    // Au-delà d'un an : l'étape est réexécutée un an plus tard et recalcule le temps restant
    if (remaining > MAX_WAIT_MS) return { retry: MAX_WAIT_MS, log: ["wait_until", `échéance au ${when} (${tz}), à plus d'un an : réévaluée dans un an`] };
    return { wait: remaining, log: ["wait_until", `jusqu'au ${when} (${tz})`] };
  },
});

// Texte d'un SMS de campagne, pour UN destinataire :
//  1. personnalisation : {{prenom}} et {{nom}}, avec une valeur de secours facultative ({{prenom|cher apprenant}}) ;
//  2. liens : chaque adresse http(s) du texte est remplacée par un lien court suivi « https://site/s/xxxxxxxx »
//     (si le suivi des clics est actif) ;
//  3. mention de désinscription AJOUTÉE AUTOMATIQUEMENT et non supprimable : « STOP SMS : https://site/s/xxxxxxxx ».
// La longueur (donc le coût) se calcule sur ce texte final : c'est lui qui est facturé.
const { smsLength } = require("./text");

const TAG = /\{\{\s*([a-zA-Zéè_]+)\s*(?:\|([^{}]{0,40}))?\}\}/g;
const FIELDS = { prenom: "first_name", nom: "last_name" };
const URL = /https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]]/g;
const CODE_LENGTH = 8;
const OPT_OUT_LABEL = "STOP SMS : ";

const clean = (text) => String(text ?? "").replace(/\r\n?/g, "\n").replace(/[\x00-\x09\x0b-\x1f\x7f]/g, "");
const shortUrl = (baseUrl, code) => `${String(baseUrl).replace(/\/+$/, "")}/s/${code}`;
const placeholderCode = "x".repeat(CODE_LENGTH);

// Balises inconnues (fautes de frappe : {{prénom}}, {{email}}…) : refusées au contrôle avant envoi
function unknownTags(body) {
  const bad = new Set();
  for (const m of clean(body).matchAll(TAG)) if (!Object.hasOwn(FIELDS, m[1].toLowerCase())) bad.add(m[0]);
  const stray = clean(body).replace(TAG, "");
  if (/\{\{|\}\}/.test(stray)) bad.add("{{…}}");
  return [...bad];
}

const linksIn = (body) => [...new Set(clean(body).replace(TAG, "").match(URL) || [])].slice(0, 10);

// contact : { first_name, last_name } ; links : Map url → url courte (absente = lien laissé tel quel) ; optOutUrl : lien STOP
function renderSms(body, contact, { links = new Map(), optOutUrl } = {}) {
  let text = clean(body).replace(TAG, (_, name, fallback) => {
    const value = String(contact?.[FIELDS[name.toLowerCase()]] ?? "").trim();
    return value || String(fallback ?? "").trim();
  });
  text = text.replace(URL, (url) => links.get(url) ?? url);
  text = text.replace(/[ \t]+\n/g, "\n").trim();
  return optOutUrl ? `${text}\n${OPT_OUT_LABEL}${optOutUrl}` : text;
}

// Estimation pour l'éditeur : liens et mention STOP remplacés par des liens courts de la bonne longueur
function estimateFor(body, contact, { baseUrl, trackClicks = true } = {}) {
  const fake = shortUrl(baseUrl || "https://votre-site.example", placeholderCode);
  const links = new Map(trackClicks ? linksIn(body).map((u) => [u, fake]) : []);
  const text = renderSms(body, contact, { links, optOutUrl: fake });
  return { text, ...smsLength(text) };
}

module.exports = { FIELDS, CODE_LENGTH, OPT_OUT_LABEL, unknownTags, linksIn, renderSms, estimateFor, shortUrl };

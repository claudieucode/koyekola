// Lecture XML SÛRE des fichiers importés : aucune entité externe n'est jamais résolue (pas de XXE), aucune déclaration d'entité n'est acceptée,
// aucun fichier ni adresse n'est ouvert par l'analyseur. Le fichier est lu comme DONNÉE, jamais exécuté. Un XML mal formé est refusé avec un message clair.
const { Parser } = require("htmlparser2");

const fail = (message) => Object.assign(new Error(message), { user: true });

// → arbre { name, attribs, children[], text } ; texte = texte direct (y compris CDATA) de l'élément
function parseXml(input, { maxBytes = 20 * 1024 * 1024 } = {}) {
  let text = Buffer.isBuffer(input) ? input.toString("utf8") : String(input ?? "");
  if (Buffer.byteLength(text) > maxBytes) throw fail(`Fichier trop volumineux (${Math.round(maxBytes / 1048576)} Mo au plus).`);
  text = text.replace(/^﻿/, "");
  if (!text.trim()) throw fail("Le fichier est vide.");
  if (text.includes("\u0000")) throw fail("Ce fichier n'est pas un fichier texte XML (contenu binaire refusé).");
  // Aucune déclaration de type de document avec entités ou références externes : refusée d'emblée (XXE, « billion laughs »)
  if (/<!ENTITY/i.test(text) || /<!DOCTYPE[^>]*\b(SYSTEM|PUBLIC)\b/i.test(text) || /<!DOCTYPE[^>]*\[/i.test(text)) throw fail("Fichier refusé : il déclare des entités ou des ressources externes (DOCTYPE). Un export légitime n'en contient pas.");
  const root = { name: "#root", attribs: {}, children: [], text: "" };
  const stack = [root];
  let malformed = null, nodes = 0;
  const parser = new Parser({
    onopentag(name, attribs) { if (++nodes > 2_000_000) { malformed = "fichier trop complexe"; return; } const n = { name, attribs, children: [], text: "" }; stack[stack.length - 1].children.push(n); stack.push(n); },
    onclosetag(name, implied) { if (implied) malformed = malformed || `balise « ${name} » non fermée ou mal imbriquée`; if (stack.length > 1) stack.pop(); },
    ontext(t) { stack[stack.length - 1].text += t; },
    oncdatastart() { /* le contenu CDATA arrive par ontext */ },
    onerror(e) { malformed = malformed || String(e && e.message || e).slice(0, 120); },
  }, { xmlMode: true, decodeEntities: true, recognizeCDATA: true, lowerCaseTags: false, lowerCaseAttributeNames: false });
  parser.write(text);
  parser.end();
  if (malformed || stack.length > 1) throw fail(`XML mal formé (${malformed || "balise non fermée"}).`);
  if (!root.children.length) throw fail("Le fichier ne contient aucun élément XML.");
  return root.children[0];
}
const kids = (n, name) => (n ? n.children.filter((c) => c.name === name) : []);
const kid = (n, name) => kids(n, name)[0] || null;
const val = (n, name) => { const k = kid(n, name); return k ? k.text.trim() : ""; };
const raw = (n, name) => { const k = kid(n, name); return k ? k.text : ""; };

module.exports = { parseXml, kids, kid, val, raw, fail };

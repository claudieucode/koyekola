// Lecture « légère » des articles pour les listes (blog, recherche, plan du site, articles liés).
//
// Problème mesuré (TITAN XXXI) : ces pages lisaient `SELECT * FROM posts` — le contenu COMPLET de tous les articles publiés — à chaque
// visite, puis filtraient en JavaScript. Avec 2 000 articles de 7 Ko : 132 ms rien que pour lire la base, 273 ms pour la page du blog,
// 1,8 s pour une recherche. Ici : toutes les colonnes SAUF le contenu, plus sa taille en octets (octet_length : lue dans l'en-tête de
// la ligne, sans parcourir le texte). Le contenu reste accessible : `row.content` se charge à la demande, une seule fois (propriété
// paresseuse, non énumérable : elle n'est pas copiée par `{ ...row }` ni envoyée par JSON.stringify, donc jamais traînée dans les vues).
"use strict";
const db = require("../config/database");

let columns = null;
// Colonnes lues APRÈS la création de la base et de ses migrations : relevées au premier usage
function listColumns() {
  if (!columns) columns = [...db.prepare("PRAGMA table_info(posts)").all().map((c) => c.name).filter((n) => n !== "content"), "octet_length(content) AS content_bytes"].join(", ");
  return columns;
}

const loadContent = db.prepare("SELECT content FROM posts WHERE id = ?");
function withLazyContent(row) {
  if (!row || Object.prototype.hasOwnProperty.call(row, "content")) return row;
  let loaded;
  Object.defineProperty(row, "content", {
    configurable: true, enumerable: false,
    get() { if (loaded === undefined) { const r = loadContent.get(row.id); loaded = r ? r.content : ""; } return loaded; },
    set(value) { loaded = value; },
  });
  return row;
}
const lightRows = (rows) => rows.map(withLazyContent);

module.exports = { listColumns, lightRows, withLazyContent };

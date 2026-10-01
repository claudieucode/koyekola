// Lecteur et écrivain CSV (RFC 4180) sans dépendance. Le lecteur tolère les habitudes réelles : BOM, séparateur « ; »
// (Excel en français), fins de ligne mixtes, lignes vides, encodage Windows-1252. Il garde le numéro de ligne du
// fichier de chaque enregistrement pour que les rapports d'erreur pointent la bonne ligne.
const { MarketingError } = require("../errors");

const DELIMITERS = [",", ";", "\t", "|"];
const DEFAULT_LIMITS = { maxRows: 100000, maxColumns: 60 };

function decodeCsv(input) {
  if (typeof input === "string") return input;
  const bytes = input instanceof Uint8Array ? input : Buffer.from(input);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

// Séparateur le plus fréquent hors guillemets sur la première ligne non vide
function detectDelimiter(text) {
  const counts = Object.fromEntries(DELIMITERS.map((d) => [d, 0]));
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (Object.values(counts).some((n) => n > 0)) break;
    } else if (!inQuotes && ch in counts) counts[ch]++;
  }
  return DELIMITERS.reduce((best, d) => (counts[d] > counts[best] ? d : best), ",");
}

function parseCsv(input, { delimiter, maxRows = DEFAULT_LIMITS.maxRows, maxColumns = DEFAULT_LIMITS.maxColumns } = {}) {
  let text = decodeCsv(input);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const sep = delimiter ?? detectDelimiter(text);
  const rows = [];
  const lines = [];
  let record = [];
  let field = "";
  let inQuotes = false;
  let quotedField = false; // le champ courant a été ouvert par un guillemet (donc « "" » est une valeur vide, pas une ligne vide)
  let line = 1;
  let recordLine = 1;

  const pushField = () => { record.push(field); field = ""; quotedField = false; };
  const pushRecord = () => {
    pushField();
    const blank = record.length === 1 && record[0] === "" && !quotedField;
    if (!blank) {
      if (record.length > maxColumns) throw new MarketingError("csv_too_large", `Trop de colonnes (${maxColumns} au plus).`);
      if (rows.length > maxRows) throw new MarketingError("csv_too_large", `Trop de lignes (${maxRows} au plus, hors en-tête).`);
      rows.push(record);
      lines.push(recordLine);
    }
    record = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        if (ch === "\n" || (ch === "\r" && text[i + 1] !== "\n")) line++;
        field += ch;
      }
      continue;
    }
    if (ch === '"' && field === "" && !quotedField) { inQuotes = true; quotedField = true; }
    else if (ch === sep) pushField();
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      pushRecord();
      line++;
      recordLine = line;
    } else field += ch;
  }
  if (inQuotes) throw new MarketingError("invalid_csv", `Guillemet non fermé : le champ commencé à la ligne ${recordLine} n'est jamais terminé.`);
  if (record.length || field !== "" || quotedField) pushRecord();
  if (rows.length > maxRows + 1) throw new MarketingError("csv_too_large", `Trop de lignes (${maxRows} au plus, hors en-tête).`);
  return { delimiter: sep, rows, lines };
}

// Écriture : jamais d'injection de formule dans un tableur (= + - @ en début de cellule → apostrophe)
function toCsv(rows) {
  const cell = (value) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return rows.map((r) => `${r.map(cell).join(",")}\r\n`).join("");
}

module.exports = { parseCsv, decodeCsv, toCsv, detectDelimiter, DEFAULT_LIMITS };

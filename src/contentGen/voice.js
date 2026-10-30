// Brand Voice Engine : voix éditoriale d'un site (réglage global) + ajustement local par page. Données bornées et à listes fermées ; le texte libre (vocabulaire) est assaini.
// La voix est traduite en CONSIGNES dans le prompt (`toPrompt`) ; elle ne contient jamais de fait sur l'entreprise.
const ORIENTATIONS = Object.freeze({
  professionnel: "professionnel, posé", corporate: "corporate, structuré", premium: "premium, sobre et raffiné", elegant: "élégant, soigné", commercial: "commercial, orienté résultats",
  convaincant: "convaincant, argumenté", amical: "amical, chaleureux", accessible: "accessible, simple", institutionnel: "institutionnel, neutre", educatif: "éducatif, pédagogue",
  technique: "technique, précis", creatif: "créatif, imagé (sans excès)", minimaliste: "minimaliste, phrases courtes", editorial: "éditorial, narratif",
});
const FORMALITY = Object.freeze(["tres_formel", "formel", "neutre", "decontracte"]);
const SENTENCES = Object.freeze({ courtes: "phrases courtes (10 à 15 mots)", moyennes: "phrases de longueur moyenne (15 à 22 mots)", longues: "phrases plus développées (jusqu'à 30 mots)" });
const VOCABULARY = Object.freeze({ simple: "vocabulaire courant, sans jargon", professionnel: "vocabulaire professionnel courant", expert: "vocabulaire spécialisé du secteur, défini si nécessaire" });
const ARGUMENTATION = Object.freeze({ directe: "directe : l'essentiel d'abord", persuasive: "persuasive : bénéfices puis preuves fournies", emotionnelle: "émotionnelle mais sobre", factuelle: "factuelle : uniquement ce qui est fourni", premium: "premium : retenue, qualité perçue", educative: "éducative : expliquer avant de vendre", conversion: "orientée conversion : une action claire par section" });
const ADDRESS = Object.freeze({ vous: "vouvoiement (« vous »)", tu: "tutoiement (« tu »)", nous: "forme impersonnelle ou « nous » (sans s'adresser directement au lecteur)" });

const DEFAULT = Object.freeze({ orientations: ["professionnel"], formality: "formel", sentences: "moyennes", vocabulary: "professionnel", argumentation: "directe", address: "vous", personality: "", sectorTerms: [], avoid: [] });
const txt = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");
function pick(v, table, fb) { return typeof v === "string" && Object.hasOwn(table, v) ? v : fb; }
function normalize(input, base = DEFAULT) {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const orientations = (Array.isArray(src.orientations) ? src.orientations : src.orientations === undefined ? base.orientations : []).filter((o) => Object.hasOwn(ORIENTATIONS, o));
  const list = (v, fb, n, m) => (Array.isArray(v) ? v.map((x) => txt(x, m)).filter(Boolean).slice(0, n) : fb);
  return {
    orientations: [...new Set(orientations.length ? orientations : base.orientations)].slice(0, 3),
    formality: FORMALITY.includes(src.formality) ? src.formality : base.formality,
    sentences: pick(src.sentences, SENTENCES, base.sentences), vocabulary: pick(src.vocabulary, VOCABULARY, base.vocabulary),
    argumentation: pick(src.argumentation, ARGUMENTATION, base.argumentation), address: pick(src.address, ADDRESS, base.address),
    personality: src.personality === undefined ? base.personality : txt(src.personality, 200),
    sectorTerms: list(src.sectorTerms, base.sectorTerms, 20, 40), avoid: list(src.avoid, base.avoid, 20, 40),
  };
}
// Voix effective d'une page : voix du site, ajustée localement (seuls les champs fournis changent)
const effective = (siteVoice, pageOverride) => normalize(pageOverride || {}, normalize(siteVoice || {}));
function toPrompt(v, language = "fr") {
  return [
    `Voix de la marque : ${v.orientations.map((o) => ORIENTATIONS[o]).join(" + ")}.`,
    `Registre : ${{ tres_formel: "très formel", formel: "formel", neutre: "neutre", decontracte: "décontracté" }[v.formality]}. Adresse au lecteur : ${ADDRESS[v.address]}${language === "fr" ? "" : " (équivalent dans la langue cible)"}.`,
    `Style : ${SENTENCES[v.sentences]} ; ${VOCABULARY[v.vocabulary]} ; argumentation ${ARGUMENTATION[v.argumentation]}.`,
    v.personality ? `Personnalité : ${v.personality}.` : "", v.sectorTerms.length ? `Vocabulaire du secteur à utiliser à bon escient : ${v.sectorTerms.join(", ")}.` : "", v.avoid.length ? `Mots et formules à éviter : ${v.avoid.join(", ")}.` : "",
  ].filter(Boolean).join("\n");
}
// Cohérence de l'adresse (tu/vous) d'un texte dans la langue française : vrai défaut de voix si le contraire domine
function addressIssues(text, v) {
  const t = ` ${String(text).toLowerCase().replace(/[’']/g, " ")} `;
  const tu = (t.match(/\s(tu|toi|ton|ta|tes)\s/g) || []).length, vous = (t.match(/\s(vous|votre|vos)\s/g) || []).length;
  if (v.address === "vous" && tu > 0 && tu >= vous) return "tutoiement détecté alors que la voix du site est le vouvoiement";
  if (v.address === "tu" && vous > 0 && vous >= tu) return "vouvoiement détecté alors que la voix du site est le tutoiement";
  return "";
}
module.exports = { ORIENTATIONS, FORMALITY, SENTENCES, VOCABULARY, ARGUMENTATION, ADDRESS, DEFAULT, normalize, effective, toPrompt, addressIssues };

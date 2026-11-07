// Change Request Analyzer : demande en français → demande STRUCTURÉE (intention, cible, propriété, périmètre demandé, éléments à préserver, ambiguïtés). Règles déterministes : aucune IA n'est appelée
// pour COMPRENDRE ; l'IA n'intervient qu'ensuite, pour rédiger un texte. Une demande qui ne désigne pas clairement l'élément produit une CLARIFICATION, jamais une modification arbitraire.
const { norm } = require("./util");

const COLOR_WORDS = [["bleu marine", "#0b2a40"], ["marine", "#0b2a40"], ["bleu", "#0277b6"], ["rouge", "#c62828"], ["vert", "#1e7e34"], ["orange", "#f59e0b"], ["violet", "#6d28d9"], ["noir", "#10222f"], ["blanc", "#ffffff"], ["gris", "#5b6b78"]];
const TOKENS = [[/secondaires?/, "secondary"], [/principal(e|es)?/, "primary"], [/accents?/, "accent"], [/(fond|arriere)/, "background"], [/(texte)/, "text"]];
const SECTION_TYPES = [[/(banniere|bandeau|hero|en-tete)/, "hero"], [/(services?|avantages|points forts|cartes)/, "features"], [/(faq|questions)/, "faq"], [/(contact|formulaire|inscription)/, "form"], [/(temoignages?|avis)/, "testimonials"], [/(appel a l.action|cta)/, "cta"], [/(presentation|a propos|texte|paragraphe)/, "text"], [/video/, "video"], [/liste/, "list"]];
const OPS = [[/raccourci|plus court|resume/, "shorten"], [/developpe|plus long|detaille/, "expand"], [/professionnel/, "professional"], [/commercial|vendeur|persuasi/, "commercial"], [/simplifi|plus simple/, "simplify"], [/corrige|faute/, "fix"], [/referencement|seo/, "seo"], [/reecri|reformul|ameliore|rends.*(meilleur|plus clair)/, "rewrite"]];
const BG_WORDS = [[/(sombre|fonce|noir)/, "dark"], [/(principal|marine|bleu)/, "primary"], [/accent/, "accent"], [/(surface|gris clair)/, "surface"], [/(clair|blanc|neutre|par defaut)/, "default"]];

function colorOf(t, raw) {
  const hex = String(raw || "").match(/#[0-9a-fA-F]{6}\b/); if (hex) return { value: hex[0].toLowerCase(), source: "hex" };
  const w = COLOR_WORDS.find(([k]) => t.includes(k)); return w ? { value: w[1], word: w[0], source: "mot" } : null;
}
// Résultat : { intent, op?, target:{kind, pageHint?, typeHint?, fieldHint?}, property?:{name, value?, direction?}, scope:{requested, explicitGlobal}, preserve:[], ambiguities:[], supported, note }
function analyze(text, selection = {}) {
  const raw = String(text || "").slice(0, 600), t = norm(raw);
  const out = { raw, intent: "unknown", target: { kind: "none" }, scope: { requested: "unspecified", explicitGlobal: false }, preserve: [], ambiguities: [], supported: true, note: "" };
  if (!t) { out.ambiguities.push({ field: "request", question: "Que souhaitez-vous modifier ?" }); return out; }
  // portée demandée
  const local = /(uniquement|seulement|juste|cette section|ce titre|ce texte|ce bouton|cet element|cette image)/.test(t);
  const globalW = /(tout le site|toutes? les|partout|ensemble du site|du site)/.test(t);
  out.scope = { requested: local ? "local" : globalW ? "global" : /(cette page|la page|page d|page )/.test(t) ? "page" : "unspecified", explicitGlobal: globalW };
  if (/sans (modifier|toucher|changer) (les )?(autres|le reste)/.test(t)) out.preserve.push("autres éléments");
  if (/sans (modifier|toucher|changer) (les )?images?/.test(t)) out.preserve.push("images");
  if (/sans (modifier|toucher|changer) (les )?textes?/.test(t)) out.preserve.push("textes");
  const pg = t.match(/page (?:d['e ]\s*|de la |du |des )?(?:l['e ]\s*)?([a-z0-9' -]{2,40}?)(?= plus | en | avec | sans | pour | et | moins |,|\.|$)/);
  if (pg && !/^(cette|ce|la|une?)$/.test(pg[1].trim())) out.target.pageHint = pg[1].trim().replace(/^(d['e ]\s*|l['e ]\s*)/, "").replace(/\s+$/, "");
  const typ = SECTION_TYPES.find(([re]) => re.test(t)); if (typ) out.target.typeHint = typ[1];
  if (/titre/.test(t)) out.target.fieldHint = "title"; else if (/(sous-titre)/.test(t)) out.target.fieldHint = "subtitle"; else if (/(bouton)/.test(t)) out.target.fieldHint = "button";
  const here = Boolean(selection.sectionId || selection.nodeId || selection.fieldKey);

  if (/(telephone|smartphone|mobile|responsive|petit ecran)/.test(t)) { out.intent = "mobile_advice"; out.target.kind = selection.pageId ? "page" : "none"; out.supported = false; out.note = "L'adaptation mobile se vérifie dans l'aperçu mobile puis se règle section par section dans l'éditeur : elle n'est pas modifiée automatiquement."; return out; }
  const add = t.match(/(ajoute|rajoute|insere|cree)\s+(une |la |un )?(section|bloc)\s+(?:de |d'|des |sur )?(.*)$/);
  if (add) { out.intent = "add_section"; const ty = SECTION_TYPES.find(([re]) => re.test(add[4].split(/ apres /)[0])); out.target.kind = "page"; out.target.typeHint = ty ? ty[1] : undefined; const after = add[4].match(/apres (?:les |le |la |l'|l’)?(.+)$/); if (after) { const aty = SECTION_TYPES.find(([re]) => re.test(after[1])); out.target.afterType = aty ? aty[1] : null; out.target.afterHint = after[1].trim(); } if (!out.target.typeHint) out.ambiguities.push({ field: "type", question: "Quel type de section ajouter (FAQ, services, témoignages, contact, appel à l'action, texte, vidéo, liste) ?" }); return out; }
  if (/(remplace|change|regenere|genere|nouvelle|autre).*(image|photo|banniere|illustration)/.test(t) || /(image|photo|illustration).*(remplace|change|regenere|autre|nouvelle)/.test(t)) { out.intent = "replace_image"; out.target.kind = here ? "section" : "page"; return out; }
  const col = colorOf(t, raw);
  const tok = TOKENS.find(([re]) => re.test(t));
  if (/(couleur|palette)/.test(t) && (globalW || /(site|principal|secondaire|accent)/.test(t)) && !/(cette section|cette page)/.test(t)) {
    out.intent = "change_design"; out.target.kind = "design"; out.property = { name: "token", token: tok ? tok[1] : null, value: col ? col.value : null, word: col ? col.word : null };
    if (!tok) out.ambiguities.push({ field: "token", question: "Quelle couleur du design modifier : principale, secondaire ou accent ?" });
    if (!col) out.ambiguities.push({ field: "value", question: "Quelle couleur souhaitez-vous (nom ou code #rrggbb) ?" });
    return out;
  }
  if (/(agrandis|augmente|reduis|diminue|plus grand|plus petit).*(titre|texte|police)/.test(t)) { out.intent = "change_style"; out.target.kind = here ? "section" : "page"; out.property = { name: "fontSize", direction: /(agrandis|augmente|plus grand)/.test(t) ? 1 : -1 }; return out; }
  if (/(couleur|fond|arriere-plan|espacement|marge|alignement|aligne|centre|centree|largeur|pleine largeur)/.test(t)) {
    out.intent = "change_style"; out.target.kind = here ? "section" : "page";
    if (/(centre|centree|aligne.*centre)/.test(t)) out.property = { name: "align", value: "center" };
    else if (/aligne.*gauche/.test(t)) out.property = { name: "align", value: "left" };
    else if (/pleine largeur/.test(t)) out.property = { name: "width", value: "full" };
    else if (/(espacement|marge)/.test(t)) out.property = { name: "padding", value: /(grand|large|plus|aere)/.test(t) ? "lg" : /(petit|reduit|moins|serre)/.test(t) ? "sm" : null };
    else { const bg = BG_WORDS.find(([re]) => re.test(t)); out.property = { name: "background", value: bg ? bg[1] : null }; }
    if (!out.property.value) out.ambiguities.push({ field: "value", question: out.property.name === "padding" ? "Plus grand ou plus petit ?" : "Quelle valeur souhaitez-vous (fond sombre, principal, accent, clair…) ?" });
    return out;
  }
  const op = OPS.find(([re]) => re.test(t));
  if (op) { out.intent = "rewrite_text"; out.op = op[1]; out.target.kind = selection.fieldKey ? "field" : here ? "section" : out.target.pageHint || selection.pageId ? "page" : "none"; if (out.scope.requested === "unspecified") out.scope.requested = selection.fieldKey ? "local" : here ? "local" : "page"; return out; }
  if (/(change|refais|modifie|nouveau).*(design|style|apparence)/.test(t) && /page/.test(t)) { out.intent = "redesign_page"; out.target.kind = "page"; out.supported = false; out.note = "Le design est global (moteur de styles) : à l'échelle d'une page, seuls les attributs de style natifs des sections (fond, espacement, alignement, largeur) peuvent être modifiés, section par section."; return out; }
  if (/(conseil|comment|pourquoi|que penses|faut-il|\?)/.test(t)) { out.intent = "advice"; return out; }
  out.ambiguities.push({ field: "intent", question: "Je n'ai pas compris la modification souhaitée. Exemples : « Raccourcis ce texte », « Ajoute une section FAQ après les services », « Change la couleur secondaire du site en bleu marine »." });
  return out;
}
module.exports = { analyze, colorOf, COLOR_WORDS };

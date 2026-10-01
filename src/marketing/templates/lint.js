// Contrôle qualité d'un e-mail compilé et rendu sur un contact d'exemple : alertes lisibles, jamais bloquantes sauf « error ».
// Ces règles sont des CONSEILS de délivrabilité : elles ne garantissent pas l'arrivée en boîte de réception.
const HEAVY_BYTES = 90000; // Gmail coupe (« message tronqué ») au-delà d'environ 102 Ko

function lintEmail(compiled, rendered) {
  const warnings = [];
  const add = (level, code, message) => warnings.push({ level, code, message });
  const meta = compiled.meta;
  const subject = rendered.subject || "";

  if (!subject.trim()) add("error", "subject_empty", "L'objet est vide.");
  if (!meta.blockCount) add("error", "no_content", "Le modèle ne contient aucun bloc.");
  if (subject.length > 60) add("warning", "subject_long", `L'objet fait ${subject.length} caractères : au-delà de 60, il est coupé sur mobile.`);
  const letters = subject.replace(/[^A-Za-zÀ-ÿ]/g, "");
  if (letters.length >= 8 && letters.replace(/[^A-ZÀ-Þ]/g, "").length / letters.length > 0.8) add("warning", "subject_caps", "L'objet est presque entièrement en majuscules : c'est un signal de courrier indésirable.");
  if ((subject.match(/!/g) || []).length >= 2) add("warning", "subject_exclamation", "Plusieurs points d'exclamation dans l'objet : signal de courrier indésirable.");
  if (!meta.preheader) add("warning", "preheader_missing", "Le préheader est vide : les clients mail afficheront le début du contenu à la place.");
  if (meta.varsNoDefault.length) add("warning", "variable_no_default", `Ces variables peuvent s'afficher vides si l'information manque (ajoutez | default:"…") : ${meta.varsNoDefault.join(", ")}.`);
  if (meta.blockCount && !meta.hasText) add("warning", "image_only", "Le message ne contient aucun texte (seulement des images) : mal affiché quand les images sont bloquées, et suspect pour les filtres anti-spam.");
  if (Buffer.byteLength(rendered.html) > HEAVY_BYTES) add("warning", "html_heavy", "Le message est très lourd : Gmail risque de le tronquer (limite d'environ 102 Ko).");
  if (meta.kind === "marketing" && !rendered.meta.addressPresent) add("warning", "address_missing", "Aucune adresse postale dans le pied de page (réglage « org.address ») : elle est exigée par plusieurs législations.");
  if (meta.lowContrast.length) add("warning", "button_contrast", "Le contraste d'un bouton est insuffisant (lisibilité).");
  const linkCount = (rendered.html.match(/<a\s/g) || []).length;
  if (linkCount > 30) add("warning", "many_links", `${linkCount} liens : un grand nombre de liens augmente le risque d'être classé indésirable.`);
  return warnings;
}

module.exports = { lintEmail };

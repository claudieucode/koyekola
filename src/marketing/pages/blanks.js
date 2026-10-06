// Contenu de départ de chaque type de section dans l'éditeur visuel : toujours VALIDE (une section ajoutée s'enregistre
// tout de suite). Les sections qui dépendent de données réelles (formation, image) prennent la première disponible ;
// sans données, elles ne sont pas proposées (jamais de section vide ou factice).
const { listCourses } = require("../bridge/catalog");
const media = require("../media");
const { TYPES } = require("./sections");

function blanks(ctx) {
  const course = listCourses(ctx)[0] || null;
  const image = media.listMedia(ctx, { kind: "image", limit: 1 }).items[0] || null;
  const all = {
    hero: { type: "hero", title: "Un titre qui dit ce que la personne y gagne", subtitle: "Une phrase qui précise la promesse.", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" },
    text: { type: "text", markdown: "Votre texte ici. Vous pouvez mettre du **gras** et des [liens](https://kolakisa.com)." },
    image: image ? { type: "image", src: image.path, alt: image.alt || image.name, caption: "", link: "" } : null,
    list: { type: "list", title: "Ce que vous allez apprendre", items: ["Premier point fort", "Deuxième point fort"] },
    course: course ? { type: "course", courseId: course.id, cta: "Découvrir la formation" } : null,
    button: { type: "button", label: "Découvrir le catalogue", url: "/catalogue", align: "center" },
    quote: { type: "quote", text: "Une phrase marquante d'un élève ou d'un partenaire.", author: "" },
    form: { type: "form", heading: "Inscrivez-vous", intro: "" },
    features: { type: "features", title: "Pourquoi nous choisir", intro: "", columns: 3, items: [{ title: "Avantage 1", text: "Expliquez ce que la personne y gagne." }, { title: "Avantage 2", text: "Un bénéfice concret." }, { title: "Avantage 3", text: "Une preuve ou un chiffre réel." }] },
    faq: { type: "faq", title: "Questions fréquentes", items: [{ q: "Votre première question ?", a: "La réponse, claire et courte." }] },
    cta: { type: "cta", title: "Prêt à commencer ?", text: "Une phrase qui donne envie d'agir maintenant.", buttonLabel: "Je commence", buttonUrl: "/catalogue" },
    video: null, // une vidéo n'a pas d'adresse par défaut : elle s'ajoute avec son adresse (voir l'éditeur)
    testimonials: { type: "testimonials", title: "Ils en parlent", items: [{ text: "Le témoignage d'un élève, avec son accord.", author: "Prénom N.", role: "" }] },
    divider: { type: "divider", line: true, size: "md" },
  };
  // Raison affichée quand un type n'est pas disponible
  const unavailable = {
    image: image ? null : "Ajoutez d'abord une image à la médiathèque (Modèles d'e-mails → Médias).",
    course: course ? null : "Publiez d'abord une formation dans le catalogue.",
  };
  // Vidéo : demande son adresse et son titre à l'ajout (pas de valeur par défaut possible)
  return Object.keys(TYPES).filter((k) => !TYPES[k].builderOnly).map((type) => ({ type, label: TYPES[type].label, blank: all[type] || null, unavailable: unavailable[type] || null, asks: type === "video" ? ["url", "title"] : null }));
}

module.exports = { blanks };

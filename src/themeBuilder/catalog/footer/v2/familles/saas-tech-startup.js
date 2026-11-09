// Famille v2 « SaaS, tech et startup » — cible 9 modèles (concepts c-015 à c-023 de docs/footer-v2/CONCEPTS_100.md).
// Tant que `built` est false, la famille n'apporte rien à la bibliothèque PUBLIQUE (la liste actuelle reste intacte) ; passer à true UNIQUEMENT quand models.length === target.
// Les modèles s'écrivent avec ../kit-v2 (modeleV2, identite, gestes G.*) et s'insèrent en mode « solo » (indépendants du site).
// Modèle de référence de toute la bibliothèque v2 : ft2-017-phrase-de-lancement (annoté dans docs/footer-v2/GUIDE_CONSTRUIRE_UN_MODELE_V2.md).
const { modeleV2, identifiantV2, identite } = require("../kit-v2");

const FAM = "saas-tech-startup";

// ── c-017 « Phrase de Lancement » ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Idée : une PHRASE MONUMENTALE (« Prêts à lancer ? ») remplace le bloc de liens ; le champ e-mail se glisse juste à côté, souligné de citron ; les liens utiles tiennent en pilules,
// les réseaux sont des noms suivis d'une flèche ↗, les mentions légales en 12 px. Violet électrique #4B2BFF, blanc, citron #CAFF3D. Polices : Sora 800 (titre ; remplace Unbounded du concept, défectueux en gras) et Inter (texte), auto-hébergées.
// Contraste d'échelle : 180 px (phrase) contre 12 px (mentions). Aucun logo, aucune coordonnée (elles restent derrière le lien Contact), aucune donnée inventée.
const orbito = identite({
  key: "c017", label: "Violet électrique et citron", humeur: "dark",
  fond: "#4b2bff", texte: "#ffffff", discret: "#d6d0ff", accent: "#caff3d", surface: "#6347ff",
  police: "font.inter", titres: "font.sora", // Sora et non Unbounded : voir « Polices d'affichage » du guide (Unbounded a des encoches parasites dès 500 de graisse)
  rayon: "20px", rayonBouton: "999px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff40",
});

const phraseLancement = modeleV2({
  id: identifiantV2(17, "phrase-de-lancement"), concept: "c-017-phrase-de-lancement",
  name: "Phrase de lancement", family: FAM,
  description: "Une phrase monumentale en violet électrique remplace le bloc de liens : « Prêts à lancer ? ». Le champ e-mail souligné de citron se glisse à côté, les liens sont des pilules, les réseaux des noms suivis d'une flèche.",
  tags: ["startup", "phrase géante", "newsletter", "pilules", "violet", "citron", "typographie"],
  identity: orbito,
  racine: { desktop: { backgroundColor: "#4b2bff", gap: "0px" } }, // le pied lui-même : même fond que le bas du dégradé, pas d'écart blanc avant la ligne légale du site
  widgets: ["text", "emailsubscribe", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    // 1 · la phrase : Sora 800, 64 → 180 px selon l'écran, interligne 0,95 ; le dernier mot et le point d'interrogation en citron
    const phrase = G.geant(`<p>Prêts&nbsp;à<br><span style="color:${S.accent}">lancer&nbsp;?</span></p>`, { taille: [64, 180], tablette: { taille: [110, 150] }, mobile: { taille: [64, 180] }, lh: 0.95, suivi: "-0.035em", poids: "800", police: S.head, couleur: S.fg })(k, env);
    const filetCitron = G.filet({ largeur: "56px", epaisseur: "4px" })(k, env);
    // 2 · la newsletter : titre-libellé + introduction + champ souligné + bouton pilule (ou message « non configuré » en pointillés)
    const abo = G.abonnement({ titre: "Newsletter", intro: "Recevez les nouveautés et les annonces de lancement.", bouton: "S'abonner", largeur: "440px" })(k, env);
    // tablette (768–1023 px) : la phrase prend toute la ligne (plus grande), le champ passe dessous derrière un filet horizontal ; mobile : empilés sans filet
    const gauche = G.colonne(k, [filetCitron, phrase], { poids: 8, min: "300px", gap: "28px", aligne: "flex-start", tablette: { flexBasis: "100%" }, mobile: { flexBasis: "0px" } });
    // à droite : un filet vertical fin sépare la phrase du champ (disparaît quand les deux zones s'empilent sur mobile)
    const droite = G.colonne(k, [abo], { poids: 4, min: "280px", gap: "14px", aligne: "flex-start", soi: "flex-end", extra: { borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: S.line, paddingLeft: "32px", paddingTop: "8px", paddingBottom: "8px" }, tablette: { flexBasis: "100%", borderLeftWidth: "0px", paddingLeft: "0px", borderTopWidth: "1px", paddingTop: "32px" }, mobile: { flexBasis: "0px", borderTopWidth: "0px", paddingTop: "8px" } });
    const haut = G.ligne(k, [gauche, droite], { gap: "48px 64px", aligne: "flex-end", justifie: "space-between", largeur: "100%" });
    // 3 · le filet fin, puis les liens utiles en pilules à gauche et les réseaux en noms ↗ à droite
    const filet = k.divider({ width: "100%", borderColor: S.line, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" });
    const pilules = G.pilules([["Blog", "/blog"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Connexion", "/connexion"]], { contour: "#ffffff66", gap: "10px" })(k, env);
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"], ["X", "https://x.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15 })(k, env);
    const milieu = G.ligne(k, [pilules, reseaux], { gap: "20px 48px", aligne: "center", justifie: "space-between", largeur: "100%" });
    // 4 · les mentions : copyright automatique (année + raison sociale) et liens légaux, 12 px
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true })(k, env);
    const bande = G.bande(k, [haut, filet, milieu, mentions], {
      colonne: true, gap: "44px", max: "1280px", padV: ["112px", "88px", "64px"], padB: ["56px", "48px", "40px"], padH: ["48px", "32px", "20px"], fond: S.bg, innerMobile: { rowGap: "32px" },
      degrade: { from: "#6347ff", to: "#4b2bff", angle: 200 }, nom: "Phrase de lancement",
    });
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "SaaS, tech et startup", target: 9, built: false,
  description: "Logiciels, produits numériques et jeunes entreprises : gestes forts, grande typographie, appels à l'action nets.",
  models: [phraseLancement],
};

// Vignettes légères de la galerie de thèmes, tirées des aperçus complets (sharp) :
//   <clé>-card.webp  480×300 (carte de la galerie, au lieu de l'aperçu 960×600)
//   <clé>-phone.webp 128×277 (pastille mobile affichée à 64 px, au lieu de l'aperçu 390×844)
// Mesuré : la galerie passe d'environ 280 Ko d'images à environ 100 Ko pour les 12 premières cartes.   node scripts/themes-thumbs.js
const fs = require("node:fs"); const path = require("node:path"); const sharp = require("sharp");
const dir = path.join(__dirname, "..", "public", "img", "theme-previews");
(async () => {
  const keys = fs.readdirSync(dir).filter((f) => f.endsWith("-home.webp")).map((f) => f.replace(/-home\.webp$/, ""));
  let before = 0, after = 0;
  for (const k of keys) {
    const home = path.join(dir, `${k}-home.webp`), mob = path.join(dir, `${k}-mobile.webp`);
    before += fs.statSync(home).size + fs.statSync(mob).size;
    await sharp(home).resize(480, 300, { fit: "cover", position: "top" }).webp({ quality: 74, effort: 5 }).toFile(path.join(dir, `${k}-card.webp`));
    await sharp(mob).resize(128, 277, { fit: "cover", position: "top" }).webp({ quality: 72, effort: 5 }).toFile(path.join(dir, `${k}-phone.webp`));
    after += fs.statSync(path.join(dir, `${k}-card.webp`)).size + fs.statSync(path.join(dir, `${k}-phone.webp`)).size;
  }
  console.log(`${keys.length} thèmes : ${Math.round(before / 1024)} Ko d'aperçus complets → ${Math.round(after / 1024)} Ko de vignettes`);
})();

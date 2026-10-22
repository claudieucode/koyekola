// KOLAKISA — registre de suivi de la refonte des zones de contenu : chaque écran des menus CMS et Marketing y figure, avec un état valide.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const cms = require("../src/marketing/web/cmsNav");
const mk = require("../src/marketing/web/nav");

const doc = fs.readFileSync(path.join(__dirname, "..", "docs", "KOLAKISA_REFONTE_CONTENU.md"), "utf8");
const rows = doc.split("\n").filter((l) => /^\| (CMS|Marketing) · /.test(l)).map((l) => l.split("|").map((c) => c.trim()));

test("tout écran du menu CMS et du menu Marketing figure dans le registre, une seule fois, avec un état valide", () => {
  const hrefs = new Set();
  for (const s of cms.SECTIONS) for (const i of s.items) hrefs.add(i.href);
  for (const i of mk.ITEMS) hrefs.add(i.href);
  const inDoc = rows.map((r) => r[3].replace(/`/g, ""));
  assert.deepEqual([...hrefs].filter((h) => !inDoc.includes(h)), [], "écrans absents du registre");
  assert.equal(new Set(inDoc).size, inDoc.length, "une ligne par écran");
  assert.equal(inDoc.length, hrefs.size);
  for (const r of rows) assert.ok(["À auditer", "En cours", "Refondue et testée"].includes(r[5]), `état invalide pour ${r[3]} : ${r[5]}`);
});
test("un écran « Refondue et testée » décrit ce qui a été reconstruit", () => {
  for (const r of rows.filter((x) => x[5] === "Refondue et testée")) assert.ok(r[6].length > 60, `${r[3]} : description trop courte`);
});

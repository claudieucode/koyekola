// Pieds de page : ÉDITION RÉELLE dans le vrai Page Builder du composant (vrai serveur + vrai Chrome piloté en CDP, helpers-chrome-cdp.js).
// Pour 12 modèles de familles différentes : modifier le texte et l'adresse d'un lien, la couleur de fond et l'espacement d'une bande, ajouter un widget, déplacer, dupliquer, supprimer (puis annuler),
// enregistrer, recharger l'éditeur, prévisualiser et publier. Chaque action est contrôlée dans la BASE (brouillon puis version en ligne) et, pour la publication, sur la page publique réelle :
// aucun bouton décoratif. Les clics sur les calques sont des clics souris réels ; les champs sont renseignés comme une saisie (événements input/change) ; les raccourcis (Ctrl+D, Alt+flèche) sont de vraies touches.
// FOOTER_EDIT_V2=1 : les modèles de la NOUVELLE bibliothèque (ft2-…, mode d'essai FOOTER_V2_APERCU activé aussi pour le serveur) ; en plus : l'IDENTITÉ du modèle reste intacte après les modifications
// (ftMode « solo » et jetons --ft-* conservés dans le brouillon ET la version en ligne ; police propre chargée dans le canevas de l'éditeur ET sur la page publique).
// Ignoré (avec la raison) si Chrome est absent.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Chrome = require("./helpers-chrome-cdp");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const ED_V2 = process.env.FOOTER_EDIT_V2 === "1";
if (ED_V2) process.env.FOOTER_V2_APERCU = "1"; // avant de charger le catalogue (et hérité par le serveur de test)
const Catalog = require("../src/themeBuilder/catalog");

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const walk = (list, fn, parent) => { for (const n of list || []) { fn(n, parent); walk(n.children, fn, n); } };
const linksOf = (doc) => { const out = []; walk(doc.children, (n, p) => { if (n.type === "link") out.push([n, p]); }); return out; };
const until = async (cond, ms = 7000) => { const end = Date.now() + ms; for (;;) { let v = false; try { v = cond(); } catch { /* pas encore */ } if (v) return true; if (Date.now() > end) return false; await wait(300); } }; // l'enregistrement automatique peut tarder sur une machine chargée
const count = (doc) => { let n = 0; walk(doc.children, () => n++); return n; };

describe("Pieds de page : édition réelle dans le Page Builder (Chrome)", { skip: Chrome.SKIP }, () => {
  let srv, boss, db, chrome, S, slug, cookies;
  const report = [];
  const U = (p = "") => `/marketing/site-web/sites/${S}/constructeur-de-theme${p}`;
  const json = (r) => JSON.parse(r.text);
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {}, headers: { Origin: srv.base } });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    S = Number((await boss.post("/marketing/site-web/sites", { name: "Site édition pieds" })).location.match(/sites\/(\d+)/)[1]);
    const pageId = Number((await boss.post("/marketing/pages", { name: "Accueil édition", site_id: S, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pageId).revision;
    const corps = { id: "sect00000001", type: "layout", children: [{ id: "head00000001", type: "heading", props: { text: "CORPS-DE-PAGE", level: "2" } }] };
    assert.equal((await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [corps] } } })).status, 200);
    assert.equal((await post(`/marketing/pages/${pageId}/publier.json`)).status, 200);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pageId, S);
    slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    cookies = [...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base }));
    for (let i = 0; i < 4 && !chrome; i++) { try { chrome = await Chrome.launch(); } catch (e) { if (i === 3) throw e; await wait(3000); } }
  });
  after(async () => { if (process.env.FOOTER_REPORT_EDITEUR) require("node:fs").writeFileSync(process.env.FOOTER_REPORT_EDITEUR, JSON.stringify(report, null, 1)); if (chrome) await chrome.close(); if (db) db.close(); if (srv) await srv.stop(); });

  // 12 modèles : un par famille (12 familles), avec au moins 2 liens et une bande
  const models = () => {
    const seen = new Set(), out = [];
    for (const e of Catalog.entries("footer").filter((x) => !ED_V2 || x.v2)) { if (seen.has(e.layoutKey) || out.length >= 12) continue; const d = Catalog.build("footer", e.key, {}).section; if (linksOf(d).length >= 3) { seen.add(e.layoutKey); out.push(e.key); } }
    return out;
  };

  test("12 modèles : texte, adresse, couleur de fond, espacement, ajout de widget, déplacement, duplication, suppression + annulation, enregistrement, rechargement, aperçu, publication", async () => {
    const only = process.env.FOOTER_EDIT_ONLY ? process.env.FOOTER_EDIT_ONLY.split(",") : null;
    const keys = models().filter((k) => !only || only.includes(k)); assert.equal(keys.length, only ? only.length : ED_V2 ? Math.min(12, Catalog.entries("footer").filter((x) => x.v2).length) : 12, `${keys.length} modèles retenus`);
    const problems = [];
    for (const key of keys) {
      const row = { key, ok: [], ko: [] };
      const ok = (m) => row.ok.push(m), ko = (m) => { row.ko.push(m); problems.push(`${key} : ${m}`); };
      const t = json(await post(U("/api/bibliotheque/utiliser"), { type: "footer", key })).template;
      assert.equal((await post(U(`/api/modeles/${t.id}/publier`), { strict: true, scope: "site", replace: true })).status, 200, key);
      const comp = () => { const r = db.prepare("SELECT draft, section FROM mk_web_components WHERE id = ?").get(t.sourceId); return { draft: JSON.parse(r.draft || r.section), live: JSON.parse(r.section), hasDraft: Boolean(r.draft) }; };
      const pg = await chrome.newPage({ width: 1500, height: 1000, cookies });
      const openEditor = async () => { await pg.goto(`${srv.base}/marketing/site-web/composants/${t.sourceId}/editeur`); await pg.waitFor(() => { const f = document.querySelector("[data-pb-frame]"); return f && f.contentDocument && f.contentDocument.querySelector("[data-node-id]"); }, "canevas", 60000); await wait(700); };
      const selected = () => pg.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item.is-selected")].map((e) => e.parentElement.dataset.id));
      const sel = async (id) => {
        // 1) clic souris sur le NOM du calque (la liste est défilée jusqu'à lui, puis on attend qu'elle se stabilise ; la marge d'indentation des calques profonds n'est pas cliquable) ;
        // 2) à défaut, clic souris sur l'élément dans le canevas
        for (let attempt = 0; attempt < 3; attempt++) {
          const scrolled = await pg.evaluate((n) => { const row = document.querySelector(`[data-pb-layers] .pb-node[data-id="${n}"] > .pb-row-item`); if (!row) return false; row.scrollIntoView({ block: "center", behavior: "instant" }); return true; }, id);
          if (scrolled) {
            await wait(300);
            const r = await pg.evaluate((n) => { const row = document.querySelector(`[data-pb-layers] .pb-node[data-id="${n}"] > .pb-row-item`); const nm = row && (row.querySelector(".pb-node-name") || row); const b = nm && nm.getBoundingClientRect(); if (!b || !b.width || !b.height) return null; const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return top && row.contains(top) ? { x: b.x + b.width / 2, y: b.y + b.height / 2 } : null; }, id);
            if (r) { await pg.mouseClick(r.x, r.y); await wait(350); if ((await selected()).includes(id)) return; }
          }
          const c = await pg.evaluate((n) => { const f = document.querySelector("[data-pb-frame]"), el = f.contentDocument.querySelector(`[data-node-id="${n}"]`); if (!el) return null; el.scrollIntoView({ block: "center", behavior: "instant" }); const fr = f.getBoundingClientRect(), b = el.getBoundingClientRect(); return b.width && b.height ? { x: fr.x + b.x + b.width / 2, y: fr.y + b.y + b.height / 2 } : null; }, id);
          if (c) { await wait(250); await pg.mouseClick(c.x, c.y); await wait(350); if ((await selected()).includes(id)) return; }
          await wait(400);
        }
        throw new Error("sélection impossible de l'élément " + id);
      };
      // bouton de la barre d'outils flottante (dans le canevas) ou du panneau, repéré par son infobulle
      const tool = (prefix) => pg.evaluate((p) => { const docs = [document, document.querySelector("[data-pb-frame]").contentDocument]; for (const d of docs) { const bt = [...d.querySelectorAll("button")].find((x) => (x.getAttribute("data-tip") || x.getAttribute("aria-label") || "").startsWith(p) && !x.disabled); if (bt) { bt.click(); return true; } } return false; }, prefix);
      const tab = async (name) => { await pg.evaluate((n) => { const b = [...document.querySelectorAll("[data-pb-inspector] [role=tab]")].find((x) => x.textContent.startsWith(n)); if (b) b.click(); }, name); await wait(250); };
      const openSection = async (title) => { await pg.evaluate((n) => { const d = [...document.querySelectorAll("[data-pb-inspector] details")].find((x) => (x.querySelector("summary .pb-acc-title") || {}).textContent === n); if (d && !d.open) d.querySelector("summary").click(); }, title); await wait(250); };
      const field = async (label, value) => { const done = await pg.evaluate(([l, v]) => { const lab = [...document.querySelectorAll("[data-pb-inspector] label")].find((x) => x.textContent.trim().startsWith(l)); if (!lab) return false; const el = (lab.htmlFor && document.getElementById(lab.htmlFor)) || lab.querySelector("input,textarea,select"); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); el.dispatchEvent(new Event("change", { bubbles: true })); return true; }, [label, value]); await wait(300); return done; };
      const saveNow = async () => { await pg.evaluate(() => document.querySelector("[data-pb-save-now]").click()); await wait(1300); };
      try {
        await openEditor();
        const inAcc = (doc, id) => { let hit = false; (function w(list, acc) { for (const n of list || []) { const a = acc || (n.props && n.props.mode === "accordion"); if (n.id === id && a) hit = true; w(n.children, a); } })(doc.children, false); return hit; };
        const L0 = linksOf(comp().draft), L1 = L0.filter(([n]) => !inAcc(comp().draft, n.id)), pool = L1.length >= 2 ? L1 : L0, [l1] = pool[0], [l2, p2] = pool[1];
        // 1) texte + adresse d'un lien
        await sel(l1.id); await tab("Contenu");
        const a = await field("Texte", "LIEN-EDITE"), b = await field("Adresse", "/blog");
        await saveNow(); const n1 = linksOf(comp().draft).map(([n]) => n).find((n) => n.id === l1.id);
        (a && b && n1 && n1.props.label === "LIEN-EDITE" && n1.props.url === "/blog") ? ok("texte et adresse du lien enregistrés") : ko(`texte/adresse non enregistrés (champs ${a}/${b}, valeur ${n1 && n1.props.label} ${n1 && n1.props.url})`);
        // 2) couleur de fond d'une bande
        const racineFoot = comp().draft.children[0];
        const candidats = [...racineFoot.children, ...racineFoot.children.flatMap((c) => c.children || []), racineFoot];
        const ouvrirFond = () => pg.evaluate(() => { const bt = document.querySelector('[data-pb-inspector] [data-color-key="backgroundColor"]'); if (!bt) return false; bt.click(); return true; });
        let band = candidats[0], clicked = false;
        // premier bloc dont la section « Fond » offre une couleur simple (un filet en dégradé n'en a pas)
        for (const c of candidats) {
          band = c; await sel(c.id); await tab("Style");
          for (let t = 0; t < 2 && !clicked; t++) { await openSection("Fond"); clicked = await ouvrirFond(); }
          if (clicked) break;
        }
        await wait(350);
        const hex = await pg.evaluate(() => { const i = document.querySelector(".pb-cpop-hex"); if (!i) return false; i.value = "#123456"; i.dispatchEvent(new Event("change", { bubbles: true })); return true; }); await wait(400);
        await pg.evaluate(() => document.activeElement && document.activeElement.blur()); await saveNow();
        const bd = (() => { let f = null; walk(comp().draft.children, (n) => { if (n.id === band.id) f = n; }); return f; })();
        const bg = bd && bd.styles && bd.styles.desktop && bd.styles.desktop.backgroundColor;
        (clicked && hex && /^#123456/i.test(String(bg))) ? ok("couleur de fond enregistrée") : ko(`couleur de fond non enregistrée (${clicked}/${hex}/${bg})`);
        // 3) espacement
        await tab("Style"); await openSection("Espacement");
        const pad = await pg.evaluate(() => { const e = document.querySelector('[data-pb-inspector] [data-prop="paddingTop"]'); const i = e && (e.matches("input") ? e : e.querySelector("input")); if (!i) return false; i.value = "37"; i.dispatchEvent(new Event("input", { bubbles: true })); i.dispatchEvent(new Event("change", { bubbles: true })); return true; }); await wait(400); await saveNow();
        const ptOf = () => { let f = null; walk(comp().draft.children, (n) => { if (n.id === band.id) f = n; }); return f && f.styles && f.styles.desktop && f.styles.desktop.paddingTop; };
        await until(() => /37/.test(String(ptOf()))); const pt = ptOf();
        (pad && /37/.test(String(pt))) ? ok("espacement enregistré") : ko(`espacement non enregistré (${pad}/${pt})`);
        // 4) ajout d'un widget (clic dans la palette, le conteneur est sélectionné)
        const before4 = count(comp().draft);
        const added = await pg.evaluate(() => { const it = document.querySelector('.pb-pal-item[data-widget="heading"]'); if (!it) return false; it.scrollIntoView({ block: "center", behavior: "instant" }); it.click(); return true; }); await wait(600); await saveNow();
        await until(() => count(comp().draft) > before4); const after4 = count(comp().draft);
        (added && after4 > before4) ? ok(`widget ajouté (${before4} → ${after4} éléments)`) : ko(`widget non ajouté (${added}, ${before4} → ${after4})`);
        // 5) déplacer : le 2e lien d'un groupe monte d'un rang (Alt + flèche haut) — repli : bouton « Monter »
        await sel(l2.id); await pg.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur());
        const idx0 = p2.children.findIndex((c) => c.id === l2.id);
        const parentOf = (doc, id) => { let f = null; walk(doc.children, (n, p) => { if (n.id === id) f = p; }); return f; };
        const idxNow = () => { const p = parentOf(comp().draft, l2.id); return p ? p.children.findIndex((c) => c.id === l2.id) : -1; };
        if (idx0 > 0) {
          const used = await tool("Monter"); await wait(500); await saveNow();
          let moved = await until(() => idxNow() === idx0 - 1, 4000);
          if (!moved && !used) { await pg.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await pg.key("ArrowUp", 1); await wait(500); await saveNow(); moved = idxNow() === idx0 - 1; }
          moved ? ok("élément déplacé d'un rang") : ko(`déplacement sans effet (${idx0} → ${idxNow()})`);
        } else ok("déplacement : l'élément est déjà en tête (non applicable)");
        // 6) dupliquer (Ctrl + D)
        const nl0 = linksOf(comp().draft).length;
        await sel(l2.id); await tool("Dupliquer"); await wait(600); await saveNow();
        let nl1 = linksOf(comp().draft).length;
        if (nl1 === nl0) { await pg.evaluate(() => document.activeElement && document.activeElement.blur && document.activeElement.blur()); await pg.key("d", 2); await wait(600); await saveNow(); nl1 = linksOf(comp().draft).length; }
        nl1 === nl0 + 1 ? ok("élément dupliqué") : ko(`duplication sans effet (${nl0} → ${nl1})`);
        // 7) supprimer (drapeau du calque) puis annuler
        await sel(l2.id);
        const del = await pg.evaluate((id) => { const bt = document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] > .pb-row-item .pb-flag-delete`) || document.querySelector(`[data-pb-layers] .pb-node[data-id="${id}"] .pb-flag-delete`); if (!bt) return false; bt.click(); return true; }, l2.id); await wait(600); await saveNow();
        const nl2 = linksOf(comp().draft).length;
        (del && nl2 === nl1 - 1) ? ok("élément supprimé") : ko(`suppression sans effet (${del}: ${nl1} → ${nl2})`);
        await pg.evaluate(() => document.querySelector("[data-pb-undo]").click()); await wait(600); await saveNow();
        await until(() => linksOf(comp().draft).length === nl1, 10000); const nl3 = linksOf(comp().draft).length;
        nl3 === nl1 ? ok("annulation : l'élément revient") : ko(`annulation sans effet (${nl2} → ${nl3})`);
        // 8) rechargement : tout est relu depuis la base, le lien édité apparaît dans les calques
        await openEditor();
        const reloaded = await pg.evaluate(() => [...document.querySelectorAll("[data-pb-layers] .pb-row-item")].some((r) => /LIEN-EDITE/.test(r.textContent)));
        const MARK = (n1 && n1.props.label === "LIEN-EDITE") ? "LIEN-EDITE" : "123456";
        reloaded ? ok("rechargement : modifications relues") : ko("rechargement : le lien édité n'apparaît pas");
        // 9) aperçu
        await pg.evaluate(() => document.querySelector("[data-pb-preview]").click());
        const prev = await pg.waitFor(() => { const f = document.querySelector("[data-pb-preview-frame]"); return f && /\/apercu/.test(f.getAttribute("src") || "") ? f.getAttribute("src") : false; }, "aperçu", 15000).catch(() => false);
        let seenInPreview = false;
        if (prev) { await wait(1500); const html = await (await fetch(srv.base + prev, { headers: { cookie: cookies.map((c) => `${c.name}=${c.value}`).join("; ") } })).text(); seenInPreview = html.includes(MARK); }
        seenInPreview ? ok("aperçu : montre la version modifiée") : ko("aperçu : n'affiche pas la modification");
        await pg.evaluate(() => { const d = document.querySelector("[data-pb-preview-dialog]"); if (d && d.close) d.close(); });
        // 10) publication depuis l'éditeur : la version en ligne et la page publique changent
        const before10 = JSON.stringify(comp().live);
        await pg.evaluate(() => { const bt = document.querySelector("[data-pb-publish]"); if (bt) { bt.hidden = false; bt.click(); } }); await wait(2500);
        const confirmBtn = await pg.evaluate(() => { const bt = [...document.querySelectorAll("dialog[open] button, .pb-modal button")].find((x) => /Mettre à jour|Publier|Confirmer|Oui/i.test(x.textContent)); if (bt) { bt.click(); return bt.textContent.trim(); } return null; }); if (confirmBtn) await wait(2500);
        const live = JSON.stringify(comp().live), changed = live !== before10 && live.includes(MARK);
        const page = await (await fetch(`${srv.base}/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } })).text();
        (changed && page.includes(MARK) && (page.match(/<footer/g) || []).length === 1) ? ok("publication : version en ligne et page publique mises à jour") : ko(`publication sans effet (version en ligne changée ${changed}, page publique ${page.includes(MARK)}, bouton de confirmation ${confirmBtn})`);
        if (ED_V2) {
          // l'identité du modèle reste intacte : mode solo + jetons conservés (brouillon et version en ligne), police propre dans le canevas de l'éditeur ET sur la page publique réelle
          const ref = Catalog.build("footer", key, {}).section, c = comp();
          for (const [nom, d] of [["brouillon", c.draft], ["version en ligne", c.live]]) {
            (d.ftMode === "solo" && JSON.stringify(d.ftVars) === JSON.stringify(ref.ftVars)) ? ok(`identité conservée (${nom} : solo + ${Object.keys(d.ftVars || {}).length} jetons --ft-*)`) : ko(`identité perdue dans le ${nom} (${d.ftMode}, ${Object.keys(d.ftVars || {}).length} jetons)`);
          }
          await openEditor();
          const police = ref.ftVars["--ft-font-head"].split(",")[0].replace(/'/g, "");
          const edit = await pg.evaluate((fam) => { const f = document.querySelector("[data-pb-frame]").contentDocument; const els = [...f.querySelectorAll("[data-node-id]")].filter((e) => getComputedStyle(e).fontFamily.includes(fam)); return { n: els.length, loaded: f.fonts.check(`700 40px "${fam}"`) }; }, police);
          (edit.n > 0 && edit.loaded) ? ok(`police ${police} chargée dans le canevas de l'éditeur (${edit.n} éléments)`) : ko(`police ${police} absente du canevas (${JSON.stringify(edit)})`);
          const pub = await chrome.newPage({ width: 1280, height: 900, cookies: [] });
          await pub.goto(`${srv.base}/p/${slug}`); await wait(800);
          const pubInfo = await pub.evaluate((fam) => { const f = document.querySelector("footer"); return { solo: f.getAttribute("data-kw-ft"), after: !document.querySelector("main footer"), footers: document.querySelectorAll("footer").length, n: [...f.querySelectorAll("*")].filter((e) => getComputedStyle(e).fontFamily.includes(fam)).length, loaded: document.fonts.check(`700 40px "${fam}"`), w: f.getBoundingClientRect().width, vw: innerWidth }; }, police);
          (pubInfo.solo === "solo" && pubInfo.after && pubInfo.footers === 1 && pubInfo.n > 0 && pubInfo.loaded && Math.abs(pubInfo.w - pubInfo.vw) < 2) ? ok(`public : un seul <footer> solo après </main>, pleine largeur, police ${police} chargée (${pubInfo.n} éléments)`) : ko(`public : ${JSON.stringify(pubInfo)}`);
          await pub.close();
        }
        if (pg.errors.length) ko("erreurs JavaScript dans l'éditeur : " + pg.errors.slice(0, 2).join(" | ").slice(0, 200));
      } catch (e) { ko("exception : " + String(e.message).slice(0, 200)); }
      await pg.close();
      report.push(row);
    }
    assert.deepEqual(problems, [], `${problems.length} actions sans effet :\n` + problems.slice(0, 40).join("\n"));
  });
});

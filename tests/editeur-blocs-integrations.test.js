// KOLAKISA — intégrations (bloc « Contenu embarqué ») : 30 services reconnus, adresse reconstruite par le serveur, imitations refusées ; collage d'une adresse dans l'éditeur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { embedProvider } = require("../src/utils/video");
const { PROVIDERS } = require("../src/shared/embedProviders");
const { renderBlogHtml } = require("../src/utils/blogHtml");

const GOOD = {
  spotify: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC", soundcloud: "https://soundcloud.com/artiste/titre", dailymotion: "https://www.dailymotion.com/video/x8abc12",
  loom: `https://www.loom.com/share/${"a".repeat(32)}`, ted: "https://www.ted.com/talks/sir_ken_robinson_do_schools_kill_creativity",
  twitter: "https://x.com/compte/status/1234567890123", instagram: "https://www.instagram.com/p/CxYz12_ab/", facebook: "https://www.facebook.com/page/posts/123456789012",
  tiktok: "https://www.tiktok.com/@moi/video/7123456789012345678", pinterest: "https://www.pinterest.com/pin/123456789012/", reddit: "https://www.reddit.com/r/node/comments/abc123/titre_du_post/",
  imgur: "https://imgur.com/a/AbCdE12", giphy: "https://giphy.com/gifs/cat-funny-xT9IgzoKnwFNmISR8I", codepen: "https://codepen.io/user/pen/AbCdEf",
  mixcloud: "https://www.mixcloud.com/dj/set-du-soir/", scribd: "https://www.scribd.com/document/123456789/Titre", issuu: "https://issuu.com/editeur/docs/numero-1",
  kickstarter: "https://www.kickstarter.com/projects/createur/projet-fou", animoto: "https://animoto.com/play/AbCdEfGhIjKlMn", pocketcasts: "https://pca.st/abcd1234",
  videopress: "https://videopress.com/v/AbCd1234", wistia: "https://marque.wistia.com/medias/abc123def4", streamable: "https://streamable.com/abcd1",
  applepodcasts: "https://podcasts.apple.com/fr/podcast/mon-podcast/id1234567890?i=1000123456789", applemusic: "https://music.apple.com/fr/album/mon-album/1234567890",
  deezer: "https://www.deezer.com/fr/track/123456789", googledocs: `https://docs.google.com/document/d/e/${"A".repeat(30)}/pub`,
};

describe("intégrations — serveur", () => {
  test("chaque service de la table a un exemple valide et un identifiant unique ; 27 services + YouTube, Vimeo, Google Maps = 30", () => {
    assert.equal(new Set(PROVIDERS.map((p) => p.id)).size, PROVIDERS.length);
    assert.equal(PROVIDERS.length, 27);
    for (const p of PROVIDERS) assert.ok(GOOD[p.id], `exemple de test manquant pour ${p.id}`);
  });
  for (const [id, url] of Object.entries(GOOD)) {
    test(`${id} : lecteur reconstruit sur l'hôte officiel, https uniquement`, () => {
      const e = embedProvider(url);
      assert.ok(e, url);
      assert.equal(e.provider, id);
      assert.match(e.src, /^https:\/\/[a-z0-9.-]+\//);
      assert.ok(e.height || e.ratio, "hauteur ou proportion définie");
      assert.ok(!e.src.includes("javascript:") && !e.src.includes("<"));
    });
  }
  test("imitations et pièges refusés (hôte déguisé, http, identifiants, port, identifiant piégé)", () => {
    for (const bad of [
      "https://x.com.evil.test/compte/status/1234567890123", "https://evilx.com/compte/status/1234567890123", "http://x.com/compte/status/1234567890123",
      "https://user:pass@x.com/compte/status/1234567890123", "https://x.com:8443/compte/status/1234567890123", "https://x.com/compte/status/12;alert(1)",
      "https://www.instagram.com/p/<script>/", "https://codepen.io/user/pen/a/../../x", "https://example.org/status/1", "javascript:alert(1)", "https://open.spotify.com.evil.test/track/4uLU6hMCjMI75M1A2tKUQC",
    ]) assert.equal(embedProvider(bad), null, bad);
  });
  test("le rendu pose un cadre isolé (sandbox) autour des services tiers et conserve la légende", () => {
    const html = renderBlogHtml(`<div class="kb-embed" data-url="${GOOD.twitter}" data-caption="Notre annonce"></div>`).html;
    assert.match(html, /<figure class="kb-embed-frame kb-embed-twitter"/);
    assert.match(html, /<iframe src="https:\/\/platform\.twitter\.com\/embed\/Tweet\.html\?id=1234567890123[^"]*"[^>]*sandbox="allow-scripts allow-same-origin/);
    assert.match(html, /<figcaption>Notre annonce<\/figcaption>/);
    assert.match(renderBlogHtml('<div class="kb-embed" data-url="https://exemple.org/page"></div>').html, /<p class="kb-embed-link"><a href="https:\/\/exemple\.org\/page" target="_blank" rel="noopener noreferrer nofollow">/);
  });
});

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("intégrations — éditeur (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser;
  const open = async () => {
    const context = await browser.newContext({ viewport: { width: 1500, height: 950 }, permissions: ["clipboard-read", "clipboard-write"] });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    await page.goto(`${srv.base}/formateur/blog/nouveau`);
    await page.waitForFunction(() => document.querySelector(".ProseMirror") && document.querySelector(".ProseMirror").editor);
    return page;
  };
  // Simule un collage de texte brut (le presse-papiers réel varie selon la machine)
  const paste = (page, text) => page.evaluate((t) => {
    const view = document.querySelector(".ProseMirror").editor.view;
    const data = new DataTransfer(); data.setData("text/plain", t);
    const ev = new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true });
    view.dom.dispatchEvent(ev);
    return ev.defaultPrevented;
  }, text);
  const tops = (page) => page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; const out = []; ed.state.doc.forEach((n) => out.push({ type: n.type.name, url: n.attrs.url || "", text: n.textContent })); return out; });
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); browser = await chromium.launch({ executablePath: CHROME, headless: true }); });
  after(async () => { if (browser) await browser.close(); await srv.stop(); });

  test("coller une adresse reconnue dans un paragraphe vide crée le bon bloc (vidéo, publication, musique) ; une adresse inconnue reste du texte", async () => {
    const page = await open();
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent("<p></p>"); ed.commands.focus("start"); });
    assert.equal(await paste(page, "https://www.youtube.com/watch?v=dQw4w9WgXcQ"), true);
    assert.deepEqual((await tops(page))[0].type, "kbVideo");
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent("<p></p>"); ed.commands.focus("start"); });
    assert.equal(await paste(page, GOOD.twitter), true);
    const t = await tops(page);
    assert.equal(t[0].type, "kbEmbed"); assert.equal(t[0].url, GOOD.twitter);
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent("<p></p>"); ed.commands.focus("start"); });
    await paste(page, "https://exemple.org/page-quelconque");
    assert.deepEqual((await tops(page))[0], { type: "paragraph", url: "", text: "https://exemple.org/page-quelconque" }, "adresse inconnue : le collage normal s'applique, le texte reste du texte");
    // Un paragraphe qui contient déjà du texte n'est jamais transformé
    await page.evaluate(() => { const ed = document.querySelector(".ProseMirror").editor; ed.commands.setContent("<p>Bonjour </p>"); ed.commands.focus("end"); });
    await paste(page, GOOD.twitter);
    assert.equal((await tops(page))[0].type, "paragraph");
    assert.match((await tops(page))[0].text, /^Bonjour\s*https:\/\/x\.com/);
    await page.context().close();
  });

  test("l'inserteur propose un bloc par service et refuse l'adresse d'un autre service", async () => {
    const page = await open();
    await page.click('[data-inserter-toggle], button[aria-label="Ajouter un bloc"]');
    await page.fill('[data-inserter-search], input[type="search"]', "tiktok");
    await page.getByRole("button", { name: /TikTok/ }).first().waitFor();
    await page.context().close();
  });
});

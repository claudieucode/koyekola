// Cohérence des valeurs de style de bout en bout (vrai serveur) : enregistrement → brouillon → rendu du canevas → page publiée.
// Couleurs du site conservées comme références, valeurs vides = héritage, valeurs invalides refusées sans abîmer le reste, unités,
// écrans (une valeur d'un écran n'apparaît que dans cet écran).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("cohérence des valeurs de style (vrai serveur)", () => {
  let srv, boss, db, id, slug;
  const row = () => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
  const put = (children) => boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: row().revision, content: { title: "C", sections: [{ id: "sect00000001", type: "layout", children }] } } });
  const draft = () => JSON.parse(row().draft).sections[0].children;
  const rendu = async (children) => (await boss.request(`/marketing/pages/${id}/rendu`, { method: "POST", headers: { Origin: srv.base }, json: { content: { sections: [{ id: "sect00000001", type: "layout", children }] } } })).text;
  const publish = async () => { assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {} })).status, 200); slug = row().slug; return (await boss.get(`/p/${slug}`)).text; };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    id = Number((await boss.post("/marketing/pages", { name: "Cohérence" })).location.match(/(\d+)$/)[1]);
  });
  after(() => srv.stop());

  test("une couleur du site reste une RÉFÉRENCE partout (style, états, dégradé, voile, ombre, séparateur, icônes, formes) : jamais « token: » dans le CSS", async () => {
    const children = [
      { id: "cont00000001", type: "container", props: {}, styles: { desktop: { color: "token:primary", backgroundColor: "token:surface", borderStyle: "solid", borderWidth: "2px", borderColor: "token:accent", outlineStyle: "solid", outlineWidth: "2px", outlineColor: "token:primary", textStrokeWidth: "1px", textStrokeColor: "token:text",
        gradient: { from: "token:primary", to: "token:accent", angle: 90 }, overlay: { color: "token:background" }, shadow: { x: 1, y: 2, blur: 3, spread: 0, color: "token:primary" } } },
        states: { hover: { color: "token:accent", backgroundColor: "token:primary", textStrokeColor: "token:accent" } },
        shapes: [{ position: "top", shape: "wave", color: "token:primary" }], children: [
          { id: "divi00000001", type: "divider", props: { color: "token:primary", thickness: 3 } },
          { id: "list00000001", type: "iconlist", props: { iconColor: "token:accent", items: [{ text: "Un", icon: "check" }] } },
        ] },
    ];
    const r = await put(children);
    assert.equal(r.status, 200, r.text);
    const kept = JSON.stringify(draft());
    assert.match(kept, /"textStrokeColor":"token:text"/, "la référence est enregistrée telle quelle (pas remplacée par une valeur fixe)");
    for (const [where, html] of [["canevas", await rendu(draft())], ["page publiée", await publish()]]) {
      const css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
      assert.doesNotMatch(css, /token:/, `${where} : une référence « token: » est restée dans le CSS`);
      assert.match(css, /-webkit-text-stroke-color:var\(--kw-text, #10222f\)/, `${where} : contour du texte`);
      assert.match(css, /outline-color:var\(--kw-primary, #0277b6\)/, `${where} : contour`);
      assert.match(css, /border-color:var\(--kw-accent, #f59e0b\)/, `${where} : bordure`);
    }
  });

  test("valeur vide = hériter (clé absente du document) ; valeur invalide = refus clair qui nomme le réglage et ne touche à rien d'autre", async () => {
    const base = [{ id: "hed000000001", type: "heading", props: { text: "Titre", level: "2" }, styles: { desktop: { fontSize: "24px", opacity: 0.5, color: "#112233" } } }];
    assert.equal((await put(base)).status, 200);
    const before = JSON.stringify(draft());
    const bad = await put([{ ...base[0], styles: { desktop: { fontSize: "abc", opacity: 0.5, color: "#112233" } } }]);
    assert.equal(bad.status, 422);
    assert.match(bad.text, /fontSize/, "le message nomme le réglage fautif");
    assert.equal(JSON.stringify(draft()), before, "un enregistrement refusé ne modifie rien");
    const out = await put([{ ...base[0], styles: { desktop: { fontSize: "", opacity: null, color: "#112233" } } }]);
    assert.equal(out.status, 200, out.text);
    assert.deepEqual(draft()[0].styles.desktop, { color: "#112233" }, "vide et null : clés retirées, les autres réglages sont intacts");
  });

  test("unités : chaque propriété n'accepte que ce qui a un sens (négatif, auto, tailles intrinsèques, pourcentage) et normalise l'écriture", async () => {
    const tries = [
      ["marginTop", "-10px", "-10px"], ["marginLeft", "auto", "auto"], ["paddingTop", "-1px", null], ["paddingLeft", "auto", null],
      ["width", "fit-content", "fit-content"], ["gap", "fit-content", null], ["width", "12.50px", "12.5px"], ["width", "50%", "50%"], ["maxWidth", "100vw", "100vw"],
      ["borderWidth", "10%", null], ["borderRadius", "50%", "50%"], ["fontSize", "1.5rem", "1.5rem"], ["fontSize", "12pt", null], ["fontSize", "1e3px", null],
      ["letterSpacing", "-0.05em", "-0.05em"], ["lineHeight", "1.55", "1.55"], ["lineHeight", "4", null], ["opacity", "1.2", null], ["zIndex", "-5", "-5"], ["zIndex", "1.5", null],
      ["top", "-20px", "-20px"], ["minHeight", "100vh", "100vh"], ["gap", "token:space-md", "token:space-md"], ["gap", "token:inconnu", null],
    ];
    for (const [key, value, expected] of tries) {
      const r = await put([{ id: "hed000000001", type: "heading", props: { text: "T", level: "2" }, styles: { desktop: { [key]: value } } }]);
      if (expected === null) assert.equal(r.status, 422, `${key}: ${value} aurait dû être refusé`);
      else { assert.equal(r.status, 200, `${key}: ${value} → ${r.text}`); assert.equal(String(draft()[0].styles.desktop[key]), expected, `${key}: ${value}`); }
    }
  });

  test("écrans : une valeur d'un écran n'apparaît que dans le CSS de cet écran ; un écran sans valeur hérite (aucune déclaration écrite)", async () => {
    const r = await put([{ id: "hed000000001", type: "heading", props: { text: "T", level: "2" }, styles: { desktop: { fontSize: "30px" }, tablet: { fontSize: "22px" }, mobile: { textAlign: "center" } } }]);
    assert.equal(r.status, 200, r.text);
    const css = ((await publish()).match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
    const media = (q) => { const m = css.match(new RegExp(`@media[^{]*${q}[^{]*\\{([\\s\\S]*?)\\}\\s*\\}`)); return m ? m[1] : ""; };
    assert.match(css, /\.kw-n-hed000000001\{[^}]*font-size:30px/);
    assert.match(media("max-width: 1023px"), /font-size:22px/, "tablette");
    assert.doesNotMatch(media("max-width: 1023px"), /text-align/, "la tablette n'a pas de valeur d'alignement : rien n'est écrit");
    assert.match(media("max-width: 767px"), /text-align:center/, "mobile");
    assert.doesNotMatch(media("max-width: 767px"), /font-size/, "le mobile hérite de la taille : rien n'est écrit");
  });

  test("anciennes données et valeurs inconnues : une option de liste inconnue est refusée proprement (jamais d'erreur 500) et le document précédent reste intact", async () => {
    const good = [{ id: "hed000000001", type: "heading", props: { text: "Garder", level: "2" }, styles: { desktop: { textAlign: "center" } } }];
    assert.equal((await put(good)).status, 200);
    const snapshot = JSON.stringify(draft());
    for (const [key, value] of [["textAlign", "centré"], ["display", "table"], ["position", "inherit"], ["fontWeight", "950"], ["cursor", "url(x)"], ["objectFit", "scale-down"]]) {
      const r = await put([{ id: "hed000000001", type: "heading", props: { text: "Garder", level: "2" }, styles: { desktop: { [key]: value } } }]);
      assert.equal(r.status, 422, `${key}: ${value} → ${r.status}`);
      assert.match(r.text, new RegExp(key), "le réglage fautif est nommé");
    }
    assert.equal(JSON.stringify(draft()), snapshot);
  });

  test("un réglage de contenu choisi avant son texte n'est pas perdu : la position du texte d'un séparateur est conservée quand le texte est encore vide", async () => {
    const r = await put([{ id: "divi00000001", type: "divider", props: { lineStyle: "dashed", align: "right" } }]);
    assert.equal(r.status, 200, r.text);
    assert.equal(draft()[0].props.align, "right", "le choix « à droite » survit à l'enregistrement");
    const again = await put([{ ...draft()[0], props: { ...draft()[0].props, text: "ou" } }]);
    assert.equal(again.status, 200, again.text);
    assert.deepEqual([draft()[0].props.text, draft()[0].props.align], ["ou", "right"], "puis le texte arrive : la position choisie est celle qui s'applique");
    assert.match(await rendu(draft()), /kw-divider-text is-right/);
    const idem = await put(draft());
    assert.equal(idem.status, 200, "réenregistrer le document normalisé ne change rien");
  });

  test("positions du fond et de l'image : les quatre coins sont proposés ET écrits dans le CSS (parité avec les 9 positions d'Elementor)", async () => {
    for (const [key, value] of [["backgroundPosition", "top left"], ["backgroundPosition", "bottom right"], ["objectPosition", "top right"], ["objectPosition", "bottom left"]]) {
      const r = await put([{ id: "cont00000001", type: "container", props: {}, styles: { desktop: { [key]: value } }, children: [] }]);
      assert.equal(r.status, 200, `${key} ${value} : ${r.text}`);
      const css = ((await rendu(draft())).match(/<style[^>]*>[\s\S]*?<\/style>/g) || []).join("\n");
      assert.ok(css.includes(`${key === "backgroundPosition" ? "background-position" : "object-position"}:${value}`), `${key} ${value} absent du CSS`);
    }
  });
});

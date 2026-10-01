// Marketing M1d (1/2) — lecteur CSV : RFC 4180, séparateur détecté, encodage, limites.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { parseCsv, decodeCsv, toCsv } = require("../src/marketing/import/csv");

describe("parseCsv", () => {
  test("cas simple, ligne finale sans retour à la ligne, retour final ignoré", () => {
    assert.deepEqual(parseCsv("a,b\n1,2\n3,4").rows, [["a", "b"], ["1", "2"], ["3", "4"]]);
    assert.deepEqual(parseCsv("a,b\n1,2\n").rows, [["a", "b"], ["1", "2"]]);
  });
  test("guillemets : virgule, retour à la ligne et guillemet doublé à l'intérieur d'un champ", () => {
    const { rows } = parseCsv('nom,note\n"Dupont, Marie","dit ""bonjour""\nsur deux lignes"\n');
    assert.deepEqual(rows[1], ["Dupont, Marie", 'dit "bonjour"\nsur deux lignes']);
  });
  test("fins de ligne CRLF, LF et CR ; BOM UTF-8 retiré", () => {
    assert.deepEqual(parseCsv("﻿a,b\r\n1,2\r\n3,4\r5,6").rows, [["a", "b"], ["1", "2"], ["3", "4"], ["5", "6"]]);
  });
  test("séparateur détecté : point-virgule (Excel FR), tabulation, barre verticale", () => {
    assert.equal(parseCsv("a;b;c\n1;2;3").delimiter, ";");
    assert.equal(parseCsv("a\tb\n1\t2").delimiter, "\t");
    assert.equal(parseCsv("a|b\n1|2").delimiter, "|");
    assert.equal(parseCsv("a,b\n1,2").delimiter, ",");
    assert.deepEqual(parseCsv("a;b\n\"x;y\";2").rows[1], ["x;y", "2"]);
  });
  test("lignes vides ignorées ; les numéros de ligne du fichier sont conservés", () => {
    const r = parseCsv("a,b\n\n1,2\n\n\n3,4\n");
    assert.deepEqual(r.rows, [["a", "b"], ["1", "2"], ["3", "4"]]);
    assert.deepEqual(r.lines, [1, 3, 6]);
  });
  test("champ vide, espaces conservés dans le champ (le nettoyage se fait plus tard)", () => {
    assert.deepEqual(parseCsv("a,b,c\n,x, y ").rows[1], ["", "x", " y "]);
  });
  test("guillemet non fermé : erreur claire avec le numéro de ligne", () => {
    assert.throws(() => parseCsv('a,b\n1,"pas fermé\n2,3'), (e) => e.code === "invalid_csv" && /ligne 2/.test(e.message));
  });
  test("un guillemet au milieu d'un champ non protégé est gardé tel quel", () => {
    assert.deepEqual(parseCsv('a,b\n5" écran,x').rows[1], ['5" écran', "x"]);
  });
  test("contenu de type formule conservé comme du texte", () => {
    assert.deepEqual(parseCsv("a\n=SOMME(A1)\n+33612345678\n@cmd").rows.slice(1), [["=SOMME(A1)"], ["+33612345678"], ["@cmd"]]);
  });
  test("limites : nombre de lignes et de colonnes", () => {
    assert.throws(() => parseCsv("a\n1\n2\n3", { maxRows: 2 }), (e) => e.code === "csv_too_large" && /lignes/.test(e.message));
    assert.throws(() => parseCsv("a,b,c,d\n1,2,3,4", { maxColumns: 3 }), (e) => e.code === "csv_too_large" && /colonnes/.test(e.message));
  });
  test("fichier vide ou sans donnée", () => {
    assert.deepEqual(parseCsv("").rows, []);
    assert.deepEqual(parseCsv("\n\n").rows, []);
  });
  test("100 000 lignes lues rapidement", () => {
    const big = "email,nom\n" + Array.from({ length: 100000 }, (_, i) => `u${i}@x.fr,Nom ${i}`).join("\n");
    const t = Date.now();
    assert.equal(parseCsv(big, { maxRows: 200000 }).rows.length, 100001);
    assert.ok(Date.now() - t < 3000, `trop lent : ${Date.now() - t} ms`);
  });
});

describe("decodeCsv (encodage)", () => {
  test("UTF-8 tel quel", () => assert.equal(decodeCsv(Buffer.from("prénom;é", "utf8")), "prénom;é"));
  test("Windows-1252 (export Excel français) détecté quand l'UTF-8 est invalide", () => {
    assert.equal(decodeCsv(Buffer.from([0x70, 0x72, 0xe9, 0x6e, 0x6f, 0x6d])), "prénom");
  });
  test("chaîne déjà décodée acceptée", () => assert.equal(decodeCsv("abc"), "abc"));
});

describe("toCsv (export sûr)", () => {
  test("guillemets, séparateur et retours à la ligne protégés", () => {
    assert.equal(toCsv([["a", 'b"c', "d,e", "f\ng"]]), 'a,"b""c","d,e","f\ng"\r\n');
  });
  test("protection contre l'injection de formules tableur (= + - @) : apostrophe ajoutée", () => {
    assert.equal(toCsv([["=1+1", "+33", "-5", "@x", "normal"]]), "'=1+1,'+33,'-5,'@x,normal\r\n");
  });
});

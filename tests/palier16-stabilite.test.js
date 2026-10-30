// Palier 16 — stabilité : caches bornés et sauvegarde des brouillons sans écrasement (ancienne requête contre révision plus récente).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

describe("caches en mémoire bornés", () => {
  test("variantes d'images du blog : la taille du cache ne dépasse jamais sa borne, même avec des milliers d'images distinctes", () => {
    const blog = require("../src/services/blog");
    for (let i = 0; i < blog.VARIANT_CACHE_MAX + 500; i++) blog.rememberVariants(`/uploads/thumbnails/p16-image-${i}.jpg`, Date.now(), []);
    assert.ok(blog.variantCacheSize() <= blog.VARIANT_CACHE_MAX, `taille ${blog.variantCacheSize()}`);
    assert.ok(blog.variantCacheSize() > 0);
  });
  test("une adresse hors du dossier des vignettes n'est jamais mise en cache", () => {
    const blog = require("../src/services/blog");
    const before = blog.variantCacheSize();
    assert.deepEqual(blog.imageVariants("/etc/passwd"), []);
    assert.deepEqual(blog.imageVariants("/uploads/thumbnails/../secret.jpg"), []);
    assert.equal(blog.variantCacheSize(), before);
  });
});

// Garde de réputation : pause automatique d'une campagne en cours quand plaintes ou rebonds permanents deviennent dangereux.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { assess, guardCampaign, MIN_SENT } = require("../src/marketing/sending/reputation");
const dispatch = require("../src/marketing/sending/dispatch");

describe("assess (fonction pure)", () => {
  test("sous l'échantillon minimal : jamais de décision, même avec un taux élevé", () => {
    assert.equal(assess({ sent: MIN_SENT - 1, bounced: 50, complained: 10 }).ok, true);
  });
  test("plaintes ≥ 0,3 % : pause ; juste en dessous : rien", () => {
    assert.equal(assess({ sent: 1000, bounced: 0, complained: 3 }).ok, false);
    assert.equal(assess({ sent: 1000, bounced: 0, complained: 2 }).ok, true);
  });
  test("rebonds permanents ≥ 5 % : pause ; en dessous : rien", () => {
    assert.equal(assess({ sent: 1000, bounced: 50, complained: 0 }).reason, "bounces");
    assert.equal(assess({ sent: 1000, bounced: 49, complained: 0 }).ok, true);
  });
  test("marge doublée après reprise manuelle", () => {
    assert.equal(assess({ sent: 1000, bounced: 0, complained: 3 }, { margin: 2 }).ok, true);
    assert.equal(assess({ sent: 1000, bounced: 0, complained: 6 }, { margin: 2 }).ok, false);
  });
  test("entrées absentes : pas d'exception", () => {
    assert.equal(assess({}).ok, true);
  });
});

describe("guardCampaign (base réelle)", () => {
  let m, A;
  beforeEach(() => { m = freshMarketing(); A = m.A; m.db.prepare("INSERT INTO users (username, email) VALUES ('a','a@x.fr'),('b','b@x.fr'),('c','c@x.fr'),('d','d@x.fr'),('e','e@x.fr'),('f','f@x.fr'),('admin','admin@x.fr')").run(); });
  const make = (status, counts) => {
    return Number(m.db.prepare("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, status, started_at, sent_count, bounced_count, complained_count) VALUES (1, ?, 'list', 1, ?, 1, ?, ?, ?)").run(`C${Math.random()}`, status, counts.sent, counts.bounced, counts.complained).lastInsertRowid);
  };
  test("campagne en cours avec trop de plaintes : mise en pause, message explicite, audit", () => {
    const id = make("sending", { sent: 1000, bounced: 0, complained: 5 });
    assert.deepEqual(guardCampaign(A, id), { paused: true, reason: "complaints" });
    const row = m.db.prepare("SELECT status, error FROM mk_campaigns WHERE id = ?").get(id);
    assert.equal(row.status, "paused");
    assert.match(row.error, /plaintes pour spam/);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'campaign.paused' AND resource_id = ?").get(String(id)).n, 1);
  });
  test("campagne saine, ou pas en cours d'envoi : aucun effet", () => {
    assert.equal(guardCampaign(A, make("sending", { sent: 1000, bounced: 5, complained: 0 })).paused, false);
    const other = make("sent", { sent: 1000, bounced: 500, complained: 50 });
    assert.equal(guardCampaign(A, other).paused, false);
    assert.equal(m.db.prepare("SELECT status FROM mk_campaigns WHERE id = ?").get(other).status, "sent");
  });
  test("reprise manuelle : le garde ne recoupe pas immédiatement au même taux", () => {
    const id = make("sending", { sent: 1000, bounced: 0, complained: 4 });
    assert.equal(guardCampaign(A, id).paused, true);
    dispatch.resumeCampaign(A, id, { now: 1000 });
    assert.equal(guardCampaign(A, id).paused, false, "0,4 % < 2 × 0,3 %");
    m.db.prepare("UPDATE mk_campaigns SET complained_count = 8 WHERE id = ?").run(id);
    assert.equal(guardCampaign(A, id).paused, true, "0,8 % ≥ 0,6 %");
  });
});

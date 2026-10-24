// Outils communs des traitements d'effacement : lecture sans échec des tables facultatives, comptage, forme masquée.
const count = (db, sql, ...params) => { try { return Number(db.prepare(sql).get(...params).n) || 0; } catch { return 0; } };
const all = (db, sql, ...params) => { try { return db.prepare(sql).all(...params); } catch { return []; } };
module.exports = { count, all };

// Transaction imbriquable (SAVEPOINT) : fonctionne seule ou à l'intérieur d'une transaction plus large
// (par exemple celle d'un achat du LMS) ; en cas d'erreur, tout ce qu'elle a écrit est annulé.
let counter = 0;

function transaction(db, fn) {
  const name = `mk_tx_${++counter}`;
  db.exec(`SAVEPOINT ${name}`);
  try {
    const result = fn();
    db.exec(`RELEASE ${name}`);
    return result;
  } catch (error) {
    db.exec(`ROLLBACK TO ${name}`);
    db.exec(`RELEASE ${name}`);
    throw error;
  }
}

module.exports = { transaction };

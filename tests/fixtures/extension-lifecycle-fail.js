// Étape qui échoue APRÈS l'écriture de l'état : l'activation doit être entièrement annulée.
module.exports = { onEnable() { throw new Error("échec simulé de l'étape d'extension"); }, onDisable() { throw new Error("échec simulé à la désactivation"); } };

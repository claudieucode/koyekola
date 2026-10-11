# Audit des sites sur une COPIE de la base de production — mode d'emploi

Objectif : vérifier, sur une copie, qu'aucune donnée de production n'associe deux sites différents. **Rien n'est modifié** : le site en ligne n'est pas touché, la copie est analysée en lecture seule, aucune correction n'est faite automatiquement.

## Ce que font les deux scripts (vérifié dans le code)
| Script | Arguments | Ce qu'il fait |
|---|---|---|
| `scripts/copie-base-audit.js <source.db> <copie.db>` | 2 chemins de fichiers | ouvre la source en **lecture seule**, crée la copie par `VACUUM INTO` (copie cohérente même si la base est en mode WAL ou en cours d'écriture), **refuse d'écraser** un fichier existant, vérifie l'intégrité et le nombre de lignes de chaque table. Code de sortie : 0 = copie conforme, 1 = écart, 2 = erreur d'arguments / fichier |
| `scripts/audit-sites.js <copie.db>` | 1 chemin | ouvre la copie en **lecture seule**, affiche des **nombres** (lignes par site, lignes du site principal, références orphelines, associations entre sites différents). Code : 0 = aucune anomalie, 1 = anomalies, 2 = base illisible |
Contrôlé en pratique : fichier source en lecture seule (`chmod a-w`) → empreinte identique avant / après, aucun fichier `-wal` / `-shm` créé ; seconde copie vers le même fichier → refus ; fichier inexistant → message clair.

## Ce qui ne doit JAMAIS être partagé
Le fichier `.db` contient des comptes, adresses e-mail, hachages de mots de passe, contacts : **ne le partagez pas, ne l'envoyez pas, ne le mettez pas sur un service en ligne**. Il reste sur votre Mac. Seul le résultat de l'audit (`resultat.txt`) est à me transmettre : il ne contient que des **nombres** et des intitulés techniques (aucun nom de site, de personne, d'e-mail ni de mot de passe). Il contient aussi le chemin du dossier sur votre Mac (ligne « Base : … ») : vous pouvez effacer cette ligne avant de me l'envoyer.

## Étapes
Les commandes se tapent dans l'application **Terminal** de votre Mac.

**Étape 1 — Obtenir une copie de la base depuis le site en ligne (sans SSH, sans toucher à la base active)**
1. Ouvrez https://kolakisa.com et connectez-vous avec votre compte formateur.
2. Allez dans **Mon espace → Centre de gestion → Sauvegardes** (adresse : `https://kolakisa.com/formateur/gestion/sauvegardes`).
3. Cliquez sur **Sauvegarder maintenant** (cela crée un fichier `KOYEKOLA-….db` ; c'est exactement ce que fait déjà la sauvegarde automatique quotidienne).
4. Dans la liste, cliquez sur le bouton de téléchargement de la ligne qui vient d'être créée. Le fichier arrive dans votre dossier **Téléchargements**.

**Étape 2 — Ranger le fichier dans un dossier de travail**
```
mkdir -p ~/audit-prod
ls ~/Downloads/KOYEKOLA-*.db
```
La commande `ls` affiche le nom du fichier téléchargé. Copiez-le (remplacez `NOM-DU-FICHIER.db` par le nom affiché, sans changer le reste) :
```
cp ~/Downloads/NOM-DU-FICHIER.db ~/audit-prod/original.db
chmod a-w ~/audit-prod/original.db
```
(`chmod a-w` rend l'original non modifiable.)

**Étape 3 — Vérifier que vous avez la bonne version des scripts**
```
cd ~/ClaudeProjects/KOYEKOLA-deploy
git branch --show-current
ls scripts/copie-base-audit.js scripts/audit-sites.js
node -v
```
Attendu : la branche `site-manager`, les deux fichiers listés, et Node 22.12 ou plus. (Ces scripts sont sur la branche `site-manager`, pas encore en production : ils n'existent pas sur le serveur.)

**Étape 4 — Faire la copie de travail**
```
node scripts/copie-base-audit.js ~/audit-prod/original.db ~/audit-prod/copie.db
```
Attendu : `Intégrité : ok · tables : … · écarts de lignes : 0`. Si un message commence par « Refus d'écraser », c'est que `copie.db` existe déjà : supprimez-la (`rm ~/audit-prod/copie.db`) ou changez son nom.

**Étape 5 — Lancer l'audit et enregistrer le résultat**
```
node scripts/audit-sites.js ~/audit-prod/copie.db | tee ~/audit-prod/resultat.txt
```
Le résultat s'affiche à l'écran ET est enregistré dans `~/audit-prod/resultat.txt`. La dernière ligne dit « Aucune anomalie d'isolation détectée » ou « N anomalie(s) à examiner ».

**Étape 6 — M'envoyer le résultat**
Ouvrez `~/audit-prod/resultat.txt` (ou copiez le texte affiché), effacez éventuellement la ligne « Base : … », et collez le texte dans la conversation. **Ne m'envoyez pas** `original.db` ni `copie.db`.

**Étape 7 — Nettoyer** (après analyse)
```
rm -rf ~/audit-prod
```

## Si le résultat signale des anomalies
Ne corrigez rien vous-même : les corrections proposées (mettre un lien à vide, mettre une page hors ligne…) sont dans `docs/KOLAKISA_PALIER_2_ISOLATION.md`, §4, et seront appliquées seulement après examen avec vous, sur la production après une sauvegarde.

## Ce que cet audit ne couvre pas
Les articles, catégories, médias, formulaires et contacts n'ont pas de colonne de site : il n'y a rien à y vérifier pour l'instant (Palier 3).

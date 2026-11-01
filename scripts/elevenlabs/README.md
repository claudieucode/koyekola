# Assistant IA des visiteurs (ElevenLabs Agents)

Un agent flottant (« Poser une question », en bas à droite) répond en français, **par écrit et à l'oral**, uniquement d'après `knowledge-base.md`.
Quand l'information manque, il le dit et renvoie vers la page Contact. Il ne voit aucune donnée de compte.

## Fichiers
| Fichier | Rôle |
|---|---|
| `knowledge-base.md` | Base de connaissances (**données de démonstration** : formations et prix du jeu de démo `src/config/seed.js`). À remplacer par les vraies informations avant une mise en service réelle. |
| `agent-config.json` | Définition de l'agent : français, `gemini-2.5-flash`, voix, prompt système, durée max 5 min, pages autorisées, couleurs marine et textes du widget en français. |
| `create-agent.sh` | Crée l'agent, ou le met à jour (`bash scripts/elevenlabs/create-agent.sh <agent_id>`). Dépose un nouveau document de connaissances et supprime l'ancien. |
| `helper.py` | Petites fonctions JSON du script (ne lit aucune clé). |

## Clé API
La clé ElevenLabs sert **uniquement** à créer ou mettre à jour l'agent. Elle se passe par la variable d'environnement `XI_API_KEY` (`export XI_API_KEY=sk_...` dans le terminal) et n'est jamais écrite dans le projet, Git, les vues ou le HTML. Le test `tests/agent-ia.test.js` échoue si une clé `sk_…` apparaît dans un fichier suivi par Git.
Seul l'`agent_id` est public.

## Dans le site
- `src/config/agentIa.js` : **seule** source de l'identifiant (`ELEVENLABS_AGENT_ID`, sinon l'agent par défaut du dépôt ; `off` désactive l'assistant), pages exclues, version figée du script du widget + empreinte SRI.
- `views/partials/agent-ia.ejs` (inclus par `footer.ejs`), `public/js/agent-ia.js`, `public/css/agent-ia.css`.
- Affiché sur les pages publiques du **site principal** ; jamais dans les espaces privés (`/formateur`, `/marketing`, `/gestion`…), ni sur connexion, inscription, panier, paiement, ni sur les sites créés.
- **Vie privée** : le script du widget (unpkg.com) et le service ElevenLabs ne sont contactés **qu'après le clic** sur « Poser une question ». Le micro n'est demandé que si le visiteur choisit de parler. Le widget affiche une phrase d'information avant la première conversation, et la page `/cookies` décrit l'assistant.
- En-tête `Permissions-Policy` : `microphone=(self)` (était `microphone=()`, ce qui aurait bloqué la voix).

## Limites et coûts
- Facturation ElevenLabs à la minute de conversation (environ 0,08 $/min d'après des comparatifs tiers, plus le modèle de langage) : durée maximale d'une conversation fixée à 300 s dans `agent-config.json`. Aucune limite de conversations par jour n'est posée dans le projet : à régler dans le tableau de bord ElevenLabs si besoin.
- L'agent n'accepte que les domaines de la liste d'autorisation (`kolakisa.com`, `www.kolakisa.com`, `localhost`).
- Changer la version du widget : voir le commentaire de `src/config/agentIa.js`.

## Tests
- `tests/agent-ia.test.js` : configuration, présence/absence selon les pages, aucun tiers avant le clic, micro, aucune clé dans Git.
- `tests/agent-ia-reponses.test.js` : 11 questions à réponse connue, 3 sans réponse en base, hors sujet, injection de consigne — contre l'agent **réel** (réseau requis, ignoré sinon).
- `tests/agent-ia-navigateur.test.js` : vrai Chrome (affichage, chargement, conversation texte, mobile, aucune erreur).

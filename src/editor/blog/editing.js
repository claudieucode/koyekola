// Outils d'édition de l'éditeur d'articles :
//   - verrouillage d'un bloc (attribut « locked », enregistré dans le HTML) : toute modification ou suppression
//     du bloc est refusée par l'éditeur lui-même (filtre des transactions), pas seulement masquée ;
//   - rechercher / remplacer dans l'article (surlignage des résultats, compteur, un par un ou tout) ;
//   - menu contextuel d'un bloc (clic droit) : uniquement les actions possibles pour ce bloc.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { DOMSerializer } from "@tiptap/pm/model";
import { topNames } from "../../shared/blockRegistry";

// Blocs de premier niveau qui peuvent être verrouillés
export const LOCKABLE_TYPES = topNames(); // dérivé du registre central (src/shared/blockRegistry.js) : un bloc ajouté au registre est verrouillable, avec identité, sans autre liste à tenir à jour
const LOCK_META = "kbLockChange";
export const lockKey = new PluginKey("kbBlockLock");

// Verrous partiels : identités des blocs dont la suppression / le déplacement est verrouillé
function partialLocks(doc) {
  const out = { remove: [], move: [] };
  doc.descendants((n) => { const a = n.attrs; if (a && a.blockId) { if (a.lockRemove) out.remove.push(a.blockId); if (a.lockMove) out.move.push(a.blockId); } return true; });
  return out;
}
// Pour chaque bloc identifié : son parent (identité ou « doc ») et l'ordre de ses frères identifiés
function blockMap(doc) {
  const map = new Map();
  const visit = (parent, parentId) => {
    const ids = [];
    parent.forEach((child) => { if (child.attrs && child.attrs.blockId) ids.push(child.attrs.blockId); });
    parent.forEach((child) => {
      const id = child.attrs && child.attrs.blockId;
      if (id) map.set(id, { parent: parentId, siblings: ids });
      visit(child, id || parentId);
    });
  };
  visit(doc, "doc");
  return map;
}
// Blocs verrouillés d'un document : liste de nœuds (dans l'ordre)
// Blocs verrouillés à TOUS les niveaux (colonnes, groupes, encadrés…) : un bloc imbriqué est protégé comme un bloc de premier niveau
const lockedNodes = (doc) => { const out = []; doc.descendants((n) => { if (n.attrs && n.attrs.locked) out.push(n); return true; }); return out; };

export const BlockLock = Extension.create({
  name: "kbBlockLock",
  addOptions() { return { onBlocked: () => {} }; },
  addGlobalAttributes() {
    return [{
      types: LOCKABLE_TYPES,
      attributes: {
        locked: {
          default: false,
          parseHTML: (el) => el.getAttribute("data-locked") === "true",
          renderHTML: (attrs) => (attrs.locked ? { "data-locked": "true" } : {}),
        },
        // Verrous partiels (comme Gutenberg) : « déplacement » et « suppression » se verrouillent séparément du contenu
        lockMove: {
          default: false,
          parseHTML: (el) => el.getAttribute("data-lock-move") === "true",
          renderHTML: (attrs) => (attrs.lockMove ? { "data-lock-move": "true" } : {}),
        },
        lockRemove: {
          default: false,
          parseHTML: (el) => el.getAttribute("data-lock-remove") === "true",
          renderHTML: (attrs) => (attrs.lockRemove ? { "data-lock-remove": "true" } : {}),
        },
      },
    }];
  },
  addProseMirrorPlugins() {
    const options = this.options;
    return [new Plugin({
      key: lockKey,
      // Refus de toute transaction qui modifie ou supprime un bloc verrouillé (le déplacement d'un bloc intact est permis)
      filterTransaction(tr, state) {
        if (!tr.docChanged || tr.getMeta(LOCK_META)) return true;
        const before = lockedNodes(state.doc);
        const partial = partialLocks(state.doc);
        if (!before.length && !partial.remove.length && !partial.move.length) return true;
        const after = lockedNodes(tr.doc);
        const pool = [...after];
        for (const n of before) {
          const i = pool.findIndex((m) => m.eq(n));
          if (i === -1) { options.onBlocked("locked"); return false; }
          pool.splice(i, 1);
        }
        if (partial.remove.length || partial.move.length) {
          const next = blockMap(tr.doc);
          // Suppression verrouillée : le bloc (même identité) doit rester dans l'article
          for (const id of partial.remove) if (!next.has(id)) { options.onBlocked("remove"); return false; }
          // Déplacement verrouillé : même parent, et l'ordre relatif avec les blocs voisins qui existaient déjà ne change pas
          const prev = blockMap(state.doc);
          for (const id of partial.move) {
            const a = prev.get(id); const b = next.get(id);
            if (!a || !b) continue; // supprimé : relève du verrou de suppression
            if (a.parent !== b.parent) { options.onBlocked("move"); return false; }
            const common = new Set(b.siblings);
            const was = a.siblings.filter((x) => common.has(x));
            const nowIds = new Set(a.siblings);
            const is = b.siblings.filter((x) => nowIds.has(x));
            if (was.join("|") !== is.join("|")) { options.onBlocked("move"); return false; }
          }
        }
        return true;
      },
      props: {
        // Repère visuel : classe sur chaque bloc verrouillé, à tous les niveaux
        decorations(state) {
          const decos = [];
          state.doc.descendants((n, pos) => { if (n.attrs && n.attrs.locked) decos.push(Decoration.node(pos, pos + n.nodeSize, { class: "is-locked", "data-lock-label": "Verrouillé" })); return true; });
          return decos.length ? DecorationSet.create(state.doc, decos) : null;
        },
      },
    })];
  },
});

// Verrouiller / déverrouiller le bloc de premier niveau situé à « pos »
export function setLocked(editor, pos, locked) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || !LOCKABLE_TYPES.includes(node.type.name)) return false;
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, locked });
  tr.setMeta(LOCK_META, true);
  // Hors de l'historique : « Annuler » ne retire pas un verrou par accident
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
  return true;
}
// Verrouillage détaillé d'un bloc : { locked (contenu), lockMove, lockRemove, inner (appliquer aussi aux blocs internes) }
export function setLockState(editor, pos, { locked = false, lockMove = false, lockRemove = false, inner = false } = {}) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || !LOCKABLE_TYPES.includes(node.type.name)) return false;
  const tr = editor.state.tr;
  tr.setNodeMarkup(pos, undefined, { ...node.attrs, locked, lockMove, lockRemove });
  if (inner) {
    node.descendants((child, offset) => {
      if (LOCKABLE_TYPES.includes(child.type.name) || child.type.name === "kbColumn") {
        const at = pos + 1 + offset;
        if (child.attrs && "locked" in child.attrs) tr.setNodeMarkup(tr.mapping.map(at), undefined, { ...child.attrs, locked, lockMove, lockRemove });
      }
      return true;
    });
  }
  tr.setMeta(LOCK_META, true);
  tr.setMeta("addToHistory", false);
  editor.view.dispatch(tr);
  return true;
}
export const isLocked = (node) => Boolean(node && node.attrs && node.attrs.locked);
export const lockSummary = (node) => (node && node.attrs ? [node.attrs.locked && "contenu", node.attrs.lockMove && "déplacement", node.attrs.lockRemove && "suppression"].filter(Boolean) : []);

// ---------- Rechercher / remplacer ----------
export const findKey = new PluginKey("kbFind");
export const FindHighlight = Extension.create({
  name: "kbFind",
  addProseMirrorPlugins() {
    return [new Plugin({
      key: findKey,
      state: {
        init: () => ({ matches: [], index: -1 }),
        apply(tr, prev) {
          const meta = tr.getMeta(findKey);
          if (meta) return meta;
          if (!tr.docChanged || !prev.matches.length) return prev;
          return { ...prev, matches: prev.matches.map((m) => ({ from: tr.mapping.map(m.from), to: tr.mapping.map(m.to) })).filter((m) => m.to > m.from) };
        },
      },
      props: {
        decorations(state) {
          const { matches, index } = findKey.getState(state);
          if (!matches.length) return null;
          return DecorationSet.create(state.doc, matches.map((m, i) => Decoration.inline(m.from, m.to, { class: i === index ? "kb-find-hit is-current" : "kb-find-hit" })));
        },
      },
    })];
  },
});
// Occurrences d'un texte dans les blocs de texte (un résultat ne traverse pas deux paragraphes)
export function findMatches(doc, query, { caseSensitive = false } = {}) {
  if (!query) return [];
  const needle = caseSensitive ? query : query.toLowerCase();
  const out = [];
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;
    let text = "";
    const map = [];
    node.forEach((child, offset) => {
      if (child.isText) { for (let i = 0; i < child.text.length; i++) map.push(pos + 1 + offset + i); text += child.text; }
      else { map.push(null); text += "\ufffc"; }
    });
    const hay = caseSensitive ? text : text.toLowerCase();
    let i = hay.indexOf(needle);
    while (i !== -1) {
      const from = map[i];
      const last = map[i + needle.length - 1];
      if (from !== null && last !== null) out.push({ from, to: last + 1 });
      i = hay.indexOf(needle, i + Math.max(1, needle.length));
    }
    return false;
  });
  return out;
}

// HTML du contenu d'un nœud (blocs enfants)
export function contentHtml(editor, node) {
  const frag = DOMSerializer.fromSchema(editor.schema).serializeFragment(node.content);
  const wrap = document.createElement("div");
  wrap.append(frag);
  return wrap.innerHTML;
}

// HTML d'un bloc (copier vers le presse-papiers du système)
export function blockHtml(editor, pos) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node) return "";
  const dom = DOMSerializer.fromSchema(editor.schema).serializeNode(node);
  const wrap = document.createElement("div");
  wrap.append(dom);
  return wrap.innerHTML;
}

export { NodeSelection, TextSelection };

// Outils d'édition de l'éditeur d'articles :
//   - verrouillage d'un bloc (attribut « locked », enregistré dans le HTML) : toute modification ou suppression
//     du bloc est refusée par l'éditeur lui-même (filtre des transactions), pas seulement masquée ;
//   - rechercher / remplacer dans l'article (surlignage des résultats, compteur, un par un ou tout) ;
//   - menu contextuel d'un bloc (clic droit) : uniquement les actions possibles pour ce bloc.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { DOMSerializer } from "@tiptap/pm/model";

// Blocs de premier niveau qui peuvent être verrouillés
export const LOCKABLE_TYPES = ["paragraph", "heading", "blockquote", "bulletList", "orderedList", "taskList", "codeBlock", "table", "horizontalRule", "details",
  "kbImage", "kbGallery", "kbVideo", "kbAudio", "kbEmbed", "kbCourse", "kbNewsletter", "kbButton", "callout", "kbCta", "kbAccordion", "kbFaq", "kbSteps", "kbCompare", "kbSpacer", "kbPageBreak", "kbColumns", "kbGroup", "kbButtons"];
const LOCK_META = "kbLockChange";
export const lockKey = new PluginKey("kbBlockLock");

// Blocs verrouillés d'un document : liste de nœuds (dans l'ordre)
const lockedNodes = (doc) => { const out = []; doc.forEach((n) => { if (n.attrs && n.attrs.locked) out.push(n); }); return out; };

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
        if (!before.length) return true;
        const after = lockedNodes(tr.doc);
        const pool = [...after];
        for (const n of before) {
          const i = pool.findIndex((m) => m.eq(n));
          if (i === -1) { options.onBlocked(); return false; }
          pool.splice(i, 1);
        }
        return true;
      },
      props: {
        // Repère visuel : classe sur chaque bloc verrouillé
        decorations(state) {
          const decos = [];
          state.doc.forEach((n, pos) => { if (n.attrs && n.attrs.locked) decos.push(Decoration.node(pos, pos + n.nodeSize, { class: "is-locked", "data-lock-label": "Verrouillé" })); });
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
export const isLocked = (node) => Boolean(node && node.attrs && node.attrs.locked);

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

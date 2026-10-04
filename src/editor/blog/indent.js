// Retrait (indentation) : paragraphes et titres décalés de 1 à 4 niveaux, enregistré dans le contenu (data-indent,
// accepté par le serveur et affiché sur la page publique). Dans une liste, le retrait est une VRAIE imbrication
// (sous-liste), pas un décalage visuel : « augmenter » = sinkListItem, « diminuer » = liftListItem.
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";

const TYPES = ["paragraph", "heading"];
const LIST_ITEMS = ["listItem", "taskItem"];
export const MAX_INDENT = 4;

// Type d'élément de liste qui contient la sélection (ou null)
function listItemAt(state) {
  const { $from } = state.selection;
  for (let d = $from.depth; d > 0; d--) if (LIST_ITEMS.includes($from.node(d).type.name)) return $from.node(d).type.name;
  return null;
}

// Décale de delta niveaux chaque paragraphe / titre de la sélection (hors listes)
const shift = (delta) => ({ state, tr, dispatch }) => {
  const { from, to } = state.selection;
  let changed = false;
  state.doc.nodesBetween(from, to, (node, pos, parent) => {
    if (!TYPES.includes(node.type.name)) return true;
    if (parent && LIST_ITEMS.includes(parent.type.name)) return false;
    const current = node.attrs.indent || 0;
    const next = Math.max(0, Math.min(MAX_INDENT, current + delta));
    if (next !== current) { if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next }); changed = true; }
    return false;
  });
  return changed;
};

export const Indent = Extension.create({
  name: "kbIndent",
  addGlobalAttributes() {
    return [{
      types: TYPES,
      attributes: {
        indent: {
          default: 0,
          parseHTML: (el) => Math.max(0, Math.min(MAX_INDENT, parseInt(el.getAttribute("data-indent"), 10) || 0)),
          renderHTML: (attrs) => (attrs.indent ? { "data-indent": String(attrs.indent) } : {}),
        },
      },
    }];
  },
  // Dans une liste, le retrait est l'imbrication de la liste : un paragraphe devenu élément de liste perd son décalage
  // (sinon il serait décalé deux fois, et la page publique ne correspondrait pas à la structure)
  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction: (trs, oldState, state) => {
        if (!trs.some((t) => t.docChanged)) return null;
        let tr = null;
        state.doc.descendants((node, pos, parent) => {
          if (TYPES.includes(node.type.name) && node.attrs.indent && parent && LIST_ITEMS.includes(parent.type.name)) {
            tr = tr || state.tr;
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: 0 });
          }
          return true;
        });
        return tr;
      },
    })];
  },
  addCommands() {
    return {
      indent: () => (props) => { const li = listItemAt(props.state); return li ? props.commands.sinkListItem(li) : shift(1)(props); },
      outdent: () => (props) => { const li = listItemAt(props.state); return li ? props.commands.liftListItem(li) : shift(-1)(props); },
    };
  },
});

export { listItemAt };

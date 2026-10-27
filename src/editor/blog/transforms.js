// Grouper / dégrouper, transformer un bloc en un autre, copier / coller les styles (équivalents des commandes de bloc de Gutenberg).
// Tout passe par de vraies transactions ProseMirror : « Annuler » les défait, un bloc verrouillé est refusé, et une conversion qui ne
// peut pas conserver le contenu est REFUSÉE avec un message (jamais de perte silencieuse).
import { Fragment } from "@tiptap/pm/model";
import { Extension } from "@tiptap/core";
import { NodeSelection, TextSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { closeHistory } from "@tiptap/pm/history";
import { STYLE_PROPS } from "../../shared/blockStyles";
import { supportsStyle } from "./supports";
// Blocs qui peuvent en contenir d'autres au même niveau : la sélection de plusieurs blocs « frères » se groupe dans l'un d'eux
const GROUP_PARENTS = new Set(["doc", "kbGroup", "kbColumn", "callout", "kbCta", "kbCover"]);
export const CALLOUT_TYPES = [["info", "Encadré Information"], ["conseil", "Encadré Conseil"], ["attention", "Encadré Attention"], ["a-retenir", "Encadré À retenir"], ["bon-a-savoir", "Encadré Bon à savoir"], ["note", "Encadré Note"], ["important", "Encadré Important"], ["astuce", "Encadré Astuce"]];

export class TransformError extends Error {}
// Chaque commande de bloc est UNE étape d'historique (comme dans Gutenberg) : « Annuler » la défait seule, sans emporter la frappe qui la précède ou la suit
const step = (editor, tr) => { editor.view.dispatch(closeHistory(editor.state.tr)); editor.view.dispatch(tr); editor.view.dispatch(closeHistory(editor.state.tr)); };
const isLocked = (n) => Boolean(n && n.attrs && n.attrs.locked);
const type = (editor, name) => editor.schema.nodes[name];

// Blocs « frères » touchés par la sélection : { depth, parent, parentPos, start, end, from, to, nodes }
export function blockRange(state) {
  const { selection, doc } = state;
  const $from = selection.$from;
  const $to = selection.$to;
  let d = Math.min($from.sharedDepth($to.pos), $from.depth);
  // La sélection est dans un bloc de texte / de liste / de tableau : le bloc est ce nœud, le conteneur est son parent
  while (d > 0 && !GROUP_PARENTS.has($from.node(d).type.name)) d--;
  if (!GROUP_PARENTS.has($from.node(d).type.name)) return null;
  const parent = $from.node(d);
  const start = $from.index(d);
  const end = Math.max(start, $to.indexAfter(d) - 1);
  let from = $from.start(d);
  for (let i = 0; i < start; i++) from += parent.child(i).nodeSize;
  let to = from;
  const nodes = [];
  for (let i = start; i <= end; i++) { nodes.push({ node: parent.child(i), pos: to }); to += parent.child(i).nodeSize; }
  return { depth: d, parent, parentPos: d === 0 ? -1 : $from.before(d), start, end, from, to, nodes, doc };
}

function replaceRange(editor, from, to, node, { select = true } = {}) {
  const tr = editor.state.tr.replaceWith(from, to, node);
  if (select) { try { tr.setSelection(NodeSelection.create(tr.doc, from)); } catch { /* texte : sélection par défaut */ } }
  step(editor, tr.scrollIntoView());
}

// ---------- Grouper ----------
export function canGroup(editor) {
  const r = blockRange(editor.state);
  if (!r || !r.nodes.length) return { ok: false, reason: "Sélectionnez un ou plusieurs blocs à grouper." };
  if (r.nodes.some(({ node }) => isLocked(node))) return { ok: false, reason: "Un bloc verrouillé ne peut pas être groupé : déverrouillez-le d'abord." };
  if (r.nodes.some(({ node }) => node.type.name === "kbReusableEdit")) return { ok: false, reason: "Terminez d'abord la modification du bloc synchronisé." };
  const g = type(editor, "kbGroup");
  if (!r.parent.canReplaceWith(r.start, r.end + 1, g)) return { ok: false, reason: "Ces blocs ne peuvent pas être groupés à cet endroit." };
  return { ok: true, range: r };
}
export function groupSelection(editor) {
  const c = canGroup(editor);
  if (!c.ok) throw new TransformError(c.reason);
  const r = c.range;
  const group = type(editor, "kbGroup").create({ bg: "none", pad: "m" }, Fragment.from(r.nodes.map((x) => x.node)));
  replaceRange(editor, r.from, r.to, group);
  return r.nodes.length;
}

// ---------- Dégrouper ----------
const UNGROUPABLE = new Set(["kbGroup", "kbColumns", "kbButtons", "callout", "kbCta"]);
export const canUngroup = (node) => Boolean(node) && UNGROUPABLE.has(node.type.name) && !isLocked(node);
function innerBlocks(node) {
  if (node.type.name === "kbColumns") { const out = []; node.forEach((col) => col.forEach((b) => out.push(b))); return out; }
  const out = [];
  node.forEach((b) => out.push(b));
  return out;
}
export function ungroupAt(editor, pos) {
  const node = editor.state.doc.nodeAt(pos);
  if (!canUngroup(node)) throw new TransformError(isLocked(node) ? "Ce bloc est verrouillé : déverrouillez-le d'abord." : "Ce bloc ne peut pas être dégroupé.");
  const kids = innerBlocks(node).filter((n) => !(n.type.name === "paragraph" && !n.content.size && innerBlocks(node).length > 1));
  const content = kids.length ? kids : [type(editor, "paragraph").create()];
  const $pos = editor.state.doc.resolve(pos);
  const parent = $pos.parent;
  if (!parent.canReplace($pos.index(), $pos.index() + 1, Fragment.from(content))) throw new TransformError("Le contenu de ce bloc ne peut pas être placé ici.");
  const tr = editor.state.tr.replaceWith(pos, pos + node.nodeSize, content);
  try { tr.setSelection(TextSelection.near(tr.doc.resolve(pos), 1)); } catch { /* déjà positionnée */ }
  step(editor, tr.scrollIntoView());
  return content.length;
}

// ---------- Transformer un bloc en un autre ----------
const TEXTUAL = new Set(["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock"]);
const jsonOf = (node) => node.toJSON();
const asBlocks = (editor, node) => {
  // Un bloc de texte devient le contenu d'un conteneur : tel quel (il est déjà un bloc)
  return [node];
};

// Liste des conversions possibles pour le bloc situé à « pos » : [{ id, label, run() }]. Chaque run lève TransformError si la conversion est impossible.
export function transformsFor(editor, pos) {
  const doc = editor.state.doc;
  const node = doc.nodeAt(pos);
  if (!node || isLocked(node)) return [];
  const name = node.type.name;
  const out = [];
  const swap = (id, label, build) => out.push({ id, label, run: () => {
    const made = build();
    const $pos = editor.state.doc.resolve(pos);
    if (!$pos.parent.canReplaceWith($pos.index(), $pos.index() + 1, made.type)) throw new TransformError("Cette conversion n'est pas possible à cet endroit.");
    replaceRange(editor, pos, pos + node.nodeSize, made);
  } });

  // Bloc de texte, liste, citation, code → conteneurs
  if (TEXTUAL.has(name)) {
    swap("kbGroup", "Groupe", () => type(editor, "kbGroup").create({ bg: "none", pad: "m" }, Fragment.from(asBlocks(editor, node))));
    swap("kbCta", "Appel à l'action", () => type(editor, "kbCta").create(null, Fragment.from(asBlocks(editor, node))));
    for (const [t, label] of CALLOUT_TYPES) swap(`callout-${t}`, label, () => type(editor, "callout").create({ type: t }, Fragment.from(asBlocks(editor, node))));
    if (name === "blockquote") swap("pullquote", node.attrs.pullquote ? "Citation simple" : "Citation mise en avant", () => type(editor, "blockquote").create({ ...node.attrs, pullquote: !node.attrs.pullquote }, node.content));
  }
  // Encadré → autre type d'encadré, groupe, appel à l'action ; ou ses paragraphes
  if (name === "callout") {
    for (const [t, label] of CALLOUT_TYPES) if (t !== node.attrs.type) swap(`callout-${t}`, label, () => type(editor, "callout").create({ type: t, title: node.attrs.title }, node.content));
    swap("kbGroup", "Groupe", () => type(editor, "kbGroup").create({ bg: "light", pad: "m" }, node.content));
    swap("kbCta", "Appel à l'action", () => type(editor, "kbCta").create(null, node.content));
  }
  if (name === "kbGroup") {
    for (const [t, label] of CALLOUT_TYPES) swap(`callout-${t}`, label, () => type(editor, "callout").create({ type: t }, node.content));
    swap("kbCta", "Appel à l'action", () => type(editor, "kbCta").create(null, node.content));
  }
  if (name === "kbCta") {
    swap("kbGroup", "Groupe", () => type(editor, "kbGroup").create({ bg: "light", pad: "m" }, node.content));
    for (const [t, label] of CALLOUT_TYPES) swap(`callout-${t}`, label, () => type(editor, "callout").create({ type: t }, node.content));
  }
  if (name === "kbColumns") swap("kbGroup", "Groupe (colonnes mises bout à bout)", () => type(editor, "kbGroup").create({ bg: "none", pad: "m" }, Fragment.from(innerBlocks(node))));
  // Médias
  if (name === "kbImage") {
    swap("kbGallery", "Galerie", () => type(editor, "kbGallery").create({ columns: "2", images: [{ src: node.attrs.src, alt: node.attrs.alt || "", caption: node.attrs.caption || "" }] }));
    if (type(editor, "kbMediaText")) swap("kbMediaText", "Média et texte", () => mediaTextFrom(editor, node));
  }
  if (name === "kbGallery") {
    const images = node.attrs.images || [];
    if (images.length) out.push({ id: "images", label: "Images séparées", run: () => {
      const imgs = images.map((i) => type(editor, "kbImage").create({ src: i.src, alt: i.alt || "", caption: i.caption || "", align: "center", width: "100" }));
      const $pos = editor.state.doc.resolve(pos);
      if (!$pos.parent.canReplace($pos.index(), $pos.index() + 1, Fragment.from(imgs))) throw new TransformError("Cette conversion n'est pas possible à cet endroit.");
      step(editor, editor.state.tr.replaceWith(pos, pos + node.nodeSize, imgs).scrollIntoView());
    } });
  }
  if (name === "kbVideo") swap("kbEmbed", "Contenu embarqué", () => type(editor, "kbEmbed").create({ url: node.attrs.url || "", caption: node.attrs.caption || "" }));
  if (name === "kbEmbed") swap("kbVideo", "Vidéo", () => type(editor, "kbVideo").create({ url: node.attrs.url || "", caption: node.attrs.caption || "" }));
  // Boutons
  if (name === "kbButton") swap("kbButtons", "Groupe de boutons", () => type(editor, "kbButtons").create({ align: node.attrs.align || "center" }, Fragment.from(node)));
  return out.filter((t, i, all) => all.findIndex((x) => x.id === t.id) === i);
}
function mediaTextFrom(editor, imageNode) {
  return type(editor, "kbMediaText").create({ side: "left", width: "50" }, Fragment.from([imageNode, type(editor, "kbMediaTextBody").create(null, Fragment.from(type(editor, "paragraph").create()))]));
}

// ---------- Copier / coller les styles ----------
// Seuls les réglages de PRÉSENTATION sont copiés (jamais le contenu, l'identifiant, l'ancre ni le verrou)
export const STYLE_KEYS = {
  kbGroup: ["bg", "pad", "border", "width", "radius", "style"],
  kbColumns: ["gap", "stack", "valign"],
  kbImage: ["align", "width", "ratio", "style"],
  kbGallery: ["columns", "gap"],
  kbButton: ["variant", "align", "size", "radius", "width", "bg", "fg", "border"],
  kbButtons: ["align"],
  kbSpacer: ["size", "sizeMobile"],
  callout: ["type"],
  blockquote: ["pullquote", "style"],
  horizontalRule: ["style"],
  kbCover: ["overlay", "height"],
  kbMediaText: ["side", "width"],
};
const TEXT_STYLE = ["textAlign"];
// + réglages de style communs (typographie, couleur, espacement, bordure, ombre, dimensions) qui s'appliquent à ce type de bloc
const keysOf = (name) => [...(STYLE_KEYS[name] || (["paragraph", "heading"].includes(name) ? TEXT_STYLE : [])), ...STYLE_PROPS.filter((p) => supportsStyle(name, p)).map((p) => p.key)];
export function copyStyles(node) {
  const keys = keysOf(node.type.name);
  if (!keys.length) return null;
  const attrs = {};
  for (const k of keys) if (k in node.attrs) attrs[k] = node.attrs[k];
  return { type: node.type.name, attrs };
}
export function pasteStyles(editor, pos, clip) {
  const node = editor.state.doc.nodeAt(pos);
  if (!node || !clip) throw new TransformError("Aucun style copié.");
  if (isLocked(node)) throw new TransformError("Ce bloc est verrouillé : déverrouillez-le d'abord.");
  const keys = keysOf(node.type.name);
  const same = clip.type === node.type.name;
  // Même type : tous les réglages ; autre type : seulement les réglages de même nom
  const applied = {};
  for (const k of keys) if (k in clip.attrs && (same || k in clip.attrs)) applied[k] = clip.attrs[k];
  if (!Object.keys(applied).length) throw new TransformError("Ces styles ne s'appliquent pas à ce type de bloc.");
  step(editor, editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...applied }));
  return Object.keys(applied).length;
}

// ---------- Opérations sur une plage de blocs frères (sélection multiple) ----------
const stripForCopy = (node) => {
  const json = node.toJSON();
  const clean = (j) => {
    if (j.attrs) { if ("locked" in j.attrs) j.attrs.locked = false; if ("anchor" in j.attrs) j.attrs.anchor = null; if ("blockId" in j.attrs) j.attrs.blockId = null; }
    if (j.content) j.content.forEach(clean);
  };
  clean(json);
  return json;
};
export function duplicateRange(editor, range = blockRange(editor.state)) {
  if (!range || !range.nodes.length) throw new TransformError("Sélectionnez un bloc à dupliquer.");
  const copies = range.nodes.map(({ node }) => editor.schema.nodeFromJSON(stripForCopy(node)));
  if (!range.parent.canReplace(range.end + 1, range.end + 1, Fragment.from(copies))) throw new TransformError("Ces blocs ne peuvent pas être dupliqués ici.");
  step(editor, editor.state.tr.insert(range.to, copies).scrollIntoView());
  return copies.length;
}
export function deleteRange(editor, range = blockRange(editor.state)) {
  if (!range || !range.nodes.length) throw new TransformError("Sélectionnez un bloc à supprimer.");
  if (range.nodes.some(({ node }) => isLocked(node))) throw new TransformError("Un bloc verrouillé ne peut pas être supprimé : déverrouillez-le d'abord.");
  const tr = editor.state.tr.delete(range.from, range.to);
  // Un conteneur ne peut pas rester vide : le document garde au moins un paragraphe
  if (range.depth === 0 && !tr.doc.childCount) tr.insert(0, type(editor, "paragraph").create());
  else if (!range.parent.canReplace(range.start, range.end + 1)) throw new TransformError("Ce bloc ne peut pas être supprimé seul : supprimez le bloc qui le contient.");
  step(editor, tr.scrollIntoView());
  return range.nodes.length;
}
export function moveRange(editor, dir, range = blockRange(editor.state)) {
  if (!range || !range.nodes.length) throw new TransformError("Sélectionnez un bloc à déplacer.");
  if (range.nodes.some(({ node }) => isLocked(node))) throw new TransformError("Un bloc verrouillé ne peut pas être déplacé : déverrouillez-le d'abord.");
  const sibling = dir < 0 ? (range.start > 0 ? range.parent.child(range.start - 1) : null) : (range.end + 1 < range.parent.childCount ? range.parent.child(range.end + 1) : null);
  if (!sibling) throw new TransformError(dir < 0 ? "Ce bloc est déjà le premier." : "Ce bloc est déjà le dernier.");
  const moving = range.nodes.map((x) => x.node);
  const tr = editor.state.tr;
  tr.delete(range.from, range.to);
  const target = dir < 0 ? range.from - sibling.nodeSize : range.from + sibling.nodeSize;
  tr.insert(target, moving);
  try { tr.setSelection(moving.length === 1 && !moving[0].isTextblock ? NodeSelection.create(tr.doc, target) : TextSelection.near(tr.doc.resolve(target + 1))); } catch { /* sélection par défaut */ } // un bloc conteneur reste sélectionné en entier : on peut le déplacer plusieurs fois de suite
  step(editor, tr.scrollIntoView());
  return moving.length;
}
// Déplacer un bloc (par sa position) avant / après / dans un autre bloc (vue en liste : glisser-déposer)
export function moveBlockTo(editor, fromPos, targetPos, where) {
  const doc = editor.state.doc;
  const node = doc.nodeAt(fromPos);
  const target = doc.nodeAt(targetPos);
  if (!node || !target) throw new TransformError("Bloc introuvable.");
  if (isLocked(node)) throw new TransformError("Un bloc verrouillé ne peut pas être déplacé : déverrouillez-le d'abord.");
  if (targetPos >= fromPos && targetPos < fromPos + node.nodeSize) throw new TransformError("Un bloc ne peut pas être déplacé dans lui-même.");
  let at;
  let parent;
  let index;
  if (where === "inside") {
    if (!GROUP_PARENTS.has(target.type.name) || target.type.name === "doc") throw new TransformError("Ce bloc ne peut pas en contenir d'autres.");
    parent = target; index = target.childCount; at = targetPos + target.nodeSize - 1;
  } else {
    const $t = doc.resolve(targetPos);
    parent = $t.parent; index = $t.index() + (where === "after" ? 1 : 0); at = where === "after" ? targetPos + target.nodeSize : targetPos;
  }
  if (!parent.canReplaceWith(index, index, node.type)) throw new TransformError("Ce bloc ne peut pas être placé à cet endroit.");
  const tr = editor.state.tr;
  tr.delete(fromPos, fromPos + node.nodeSize);
  const mapped = tr.mapping.map(at);
  tr.insert(mapped, node);
  try { tr.setSelection(!node.isTextblock ? NodeSelection.create(tr.doc, mapped) : TextSelection.near(tr.doc.resolve(mapped + 1))); } catch { /* sélection par défaut */ }
  step(editor, tr.scrollIntoView());
}
export function insertParagraphAt(editor, pos) {
  const p = type(editor, "paragraph").create();
  const tr = editor.state.tr.insert(pos, p);
  tr.setSelection(TextSelection.near(tr.doc.resolve(pos + 1)));
  step(editor, tr.scrollIntoView());
}

// Repère visuel des blocs de la sélection multiple
export const MultiSelectHighlight = Extension.create({
  name: "kbMultiSelect",
  addProseMirrorPlugins() {
    return [new Plugin({
      key: new PluginKey("kbMultiSelect"),
      props: {
        decorations(state) {
          if (state.selection.empty || state.selection instanceof NodeSelection) return null;
          const r = blockRange(state);
          if (!r || r.nodes.length < 2) return null;
          return DecorationSet.create(state.doc, r.nodes.map(({ node, pos }) => Decoration.node(pos, pos + node.nodeSize, { class: "is-multi-selected" })));
        },
      },
    })];
  },
});

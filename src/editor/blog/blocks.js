// Identité stable des blocs et blocs masqués (Structure de l'article → Vue en liste, Corbeille).
//   - blockId : identifiant permanent de chaque bloc de la structure (premier niveau, colonnes, groupes, boutons),
//     enregistré dans le HTML (data-block-id). C'est la clé commune à la zone d'écriture, à la vue en liste et à la corbeille :
//     jamais l'index d'un tableau. Les doublons (copier-coller, dupliquer) reçoivent automatiquement un nouvel identifiant.
//   - hidden : bloc masqué (data-hidden="true"). Il reste dans l'article et ses données, n'est plus affiché dans la zone
//     d'écriture (une bande « Bloc masqué » le remplace) et n'est jamais publié (filtré par le serveur).
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { LOCKABLE_TYPES } from "./editing";

// Blocs de la structure : ceux du premier niveau (= blocs verrouillables) + les colonnes
export const BLOCK_TYPES = [...LOCKABLE_TYPES, "kbColumn"];
// Conteneurs dont les enfants sont aussi des blocs de la structure (hiérarchie de la vue en liste)
export const TREE_CONTAINERS = new Set(["kbColumns", "kbColumn", "kbGroup", "kbButtons", "kbCover"]);
export const ID_ONLY_META = "kbBlockIdsOnly"; // transaction qui ne fait qu'attribuer des identifiants : pas une modification
const LOCK_META = "kbLockChange"; // laisse passer le filtre des blocs verrouillés (attributs seulement, contenu intact)
export const blocksKey = new PluginKey("kbBlocks");
const ID = /^b[a-z0-9]{8}$/;
export const newBlockId = () => `b${Array.from(crypto.getRandomValues(new Uint8Array(8)), (n) => "abcdefghijklmnopqrstuvwxyz0123456789"[n % 36]).join("")}`;

// Parcours des blocs de la structure, dans l'ordre : fn(node, pos, { depth, parent, parentPos, index })
// Ne descend que dans les conteneurs de mise en page (une liste, un tableau, une citation restent un seul bloc).
export function walkBlocks(doc, fn) {
  const visit = (parentNode, start, depth, parent, parentPos) => {
    parentNode.forEach((node, offset, index) => {
      const pos = start + offset;
      if (fn(node, pos, { depth, parent, parentPos, index }) === false) return;
      if (TREE_CONTAINERS.has(node.type.name)) visit(node, pos + 1, depth + 1, node, pos);
    });
  };
  visit(doc, 0, 0, null, null);
}
// Position d'un bloc par son identifiant (null s'il n'est pas dans l'article)
export function findBlock(doc, id) {
  let found = null;
  if (!id) return null;
  walkBlocks(doc, (node, pos, info) => {
    if (found) return false;
    if (node.attrs.blockId === id) found = { node, pos, ...info };
    return undefined;
  });
  return found;
}
// Bloc de la structure qui contient la sélection : le plus profond (un enfant de colonne, pas la colonne)
export function activeBlockId(state) {
  const sel = state.selection;
  if (sel.node && sel.node.attrs && sel.node.attrs.blockId) return sel.node.attrs.blockId;
  const $p = sel.$from;
  for (let d = $p.depth; d >= 1; d--) { const n = $p.node(d); if (n.attrs && n.attrs.blockId) return n.attrs.blockId; }
  return null;
}

// Transaction qui donne un identifiant aux blocs qui n'en ont pas (ou en partagent un) ; null si rien à faire
function idTransaction(state) {
  const seen = new Set();
  const fixes = [];
  walkBlocks(state.doc, (node, pos) => {
    if (!node.type.spec.attrs || !("blockId" in node.attrs)) return;
    const id = node.attrs.blockId;
    if (!id || !ID.test(id) || seen.has(id)) fixes.push(pos); else seen.add(id);
  });
  if (!fixes.length) return null;
  const tr = state.tr;
  for (const pos of fixes) {
    let id = newBlockId();
    while (seen.has(id)) id = newBlockId();
    seen.add(id);
    tr.setNodeAttribute(pos, "blockId", id);
  }
  return tr.setMeta(LOCK_META, true).setMeta("addToHistory", false).setMeta(ID_ONLY_META, true);
}

export const BlockIdentity = Extension.create({
  name: "kbBlockIdentity",
  addOptions() { return { hiddenLabel: () => "Bloc", onShow: () => {} }; },
  addGlobalAttributes() {
    return [{
      types: BLOCK_TYPES,
      attributes: {
        blockId: {
          default: null,
          keepOnSplit: false, // Entrée au milieu d'un paragraphe : le nouveau paragraphe aura son propre identifiant
          parseHTML: (el) => (ID.test(el.getAttribute("data-block-id") || "") ? el.getAttribute("data-block-id") : null),
          renderHTML: (attrs) => (attrs.blockId ? { "data-block-id": attrs.blockId } : {}),
        },
        hidden: {
          default: false,
          keepOnSplit: false,
          parseHTML: (el) => el.getAttribute("data-hidden") === "true",
          renderHTML: (attrs) => (attrs.hidden ? { "data-hidden": "true" } : {}),
        },
      },
    }];
  },
  addProseMirrorPlugins() {
    const options = this.options;
    return [new Plugin({
      key: blocksKey,
      // Après chaque modification : identifiants manquants ou en double corrigés (copier-coller, dupliquer, nouveau bloc)
      appendTransaction(trs, oldState, newState) {
        if (!trs.some((tr) => tr.docChanged)) return null;
        return idTransaction(newState);
      },
      // À l'ouverture : identifiants donnés aux blocs des articles existants (sans compter comme une modification)
      view(view) {
        setTimeout(() => { const tr = idTransaction(view.state); if (tr && !view.isDestroyed) view.dispatch(tr); }, 0);
        return {};
      },
      props: {
        // Bloc masqué : retiré de l'affichage (classe sur le bloc, y compris ceux affichés par une vue de nœud),
        // et remplacé par une bande discrète qui permet de le réafficher
        decorations(state) {
          const decos = [];
          walkBlocks(state.doc, (node, pos) => {
            if (!node.attrs.hidden) return;
            decos.push(Decoration.node(pos, pos + node.nodeSize, { class: "is-block-hidden" }));
            const label = options.hiddenLabel(node);
            decos.push(Decoration.widget(pos, () => {
              const stub = document.createElement("div");
              stub.className = "kb-hidden-stub";
              stub.contentEditable = "false";
              stub.dataset.hiddenStub = node.attrs.blockId || "";
              const text = document.createElement("span");
              text.textContent = `${label} masqué — non publié`;
              const btn = document.createElement("button");
              btn.type = "button";
              btn.textContent = "Afficher";
              btn.setAttribute("aria-label", `Afficher le bloc ${label}`);
              btn.addEventListener("mousedown", (e) => e.preventDefault());
              btn.addEventListener("click", () => options.onShow(node.attrs.blockId));
              stub.append(text, btn);
              return stub;
            }, { side: -1, key: `hidden-${node.attrs.blockId}-${label}`, ignoreSelection: true }));
            return false; // un bloc masqué masque aussi ses enfants
          });
          return decos.length ? DecorationSet.create(state.doc, decos) : null;
        },
      },
    })];
  },
});

// Masquer / afficher un bloc (transaction normale : « Annuler » la défait)
export function setHidden(editor, id, hidden) {
  const b = findBlock(editor.state.doc, id);
  if (!b) return false;
  const tr = editor.state.tr.setNodeAttribute(b.pos, "hidden", Boolean(hidden)).setMeta(LOCK_META, true);
  editor.view.dispatch(tr);
  return true;
}

// Place d'un bloc dans la structure (pour le restaurer au même endroit) : parent, voisins, rang
export function placeOf(doc, id) {
  const b = findBlock(doc, id);
  if (!b) return null;
  const siblings = b.parent || doc;
  const at = (i) => (i >= 0 && i < siblings.childCount ? siblings.child(i).attrs.blockId || null : null);
  return { ...b, parentId: b.parent ? b.parent.attrs.blockId || null : null, prevId: at(b.index - 1), nextId: at(b.index + 1), position: b.index };
}

// Où réinsérer un bloc restauré : après son ancien voisin précédent, sinon avant le suivant, sinon à son rang dans son
// ancien parent, sinon à son rang au premier niveau, sinon à la fin. Seules les places valides pour ce type sont retenues.
export function restorePosition(doc, node, place) {
  const can = (parent, index) => { try { return parent.canReplaceWith(index, index, node.type); } catch { return false; } };
  const childPos = (parentPos, parent, index) => { let p = parentPos === null ? 0 : parentPos + 1; for (let i = 0; i < index; i++) p += parent.child(i).nodeSize; return p; };
  const near = (id, after) => {
    const s = findBlock(doc, id);
    if (!s) return null;
    const parent = s.parent || doc;
    const index = s.index + (after ? 1 : 0);
    return can(parent, index) ? { pos: after ? s.pos + s.node.nodeSize : s.pos, how: after ? "après son ancien voisin" : "avant son ancien voisin" } : null;
  };
  const prev = place.prevId && near(place.prevId, true);
  if (prev) return prev;
  const next = place.nextId && near(place.nextId, false);
  if (next) return next;
  if (place.parentId) {
    const p = findBlock(doc, place.parentId);
    if (p) { const index = Math.min(place.position || 0, p.node.childCount); if (can(p.node, index)) return { pos: childPos(p.pos, p.node, index), how: "dans son bloc d'origine" }; }
  }
  const index = Math.min(place.position || 0, doc.childCount);
  if (can(doc, index)) return { pos: childPos(null, doc, index), how: place.parentId ? "à son rang (son bloc d'origine n'existe plus)" : "à sa place" };
  return can(doc, doc.childCount) ? { pos: doc.content.size, how: "à la fin de l'article" } : null;
}

// Poignée de bloc : au survol d'un bloc de premier niveau, une poignée « ⠿ » (glisser-déposer pour le déplacer) et un
// bouton « + » (insérer un bloc juste après). Sans dépendance : on s'appuie sur le glisser-déposer natif de ProseMirror
// (sélection du bloc entier puis view.dragging). Au clavier : Alt+Flèche haut/bas déplace le bloc courant.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey, NodeSelection, TextSelection } from "@tiptap/pm/state";

// Position (début) du bloc de premier niveau qui contient une position du document
function topLevelPos(doc, pos) {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  if ($pos.depth === 0) return $pos.pos < doc.content.size ? $pos.pos : null;
  return $pos.before(1);
}

function moveBlock(state, dispatch, dir) {
  const { $from } = state.selection;
  if ($from.depth === 0 && !(state.selection instanceof NodeSelection)) return false;
  const start = state.selection instanceof NodeSelection && state.selection.$from.depth === 0 ? state.selection.from : $from.before(1);
  const node = state.doc.nodeAt(start);
  if (!node) return false;
  const end = start + node.nodeSize;
  if (dir < 0) {
    if (start === 0) return false;
    const before = state.doc.resolve(start).nodeBefore;
    if (!before) return false;
    if (dispatch) {
      const tr = state.tr.delete(start, end).insert(start - before.nodeSize, node);
      tr.setSelection(NodeSelection.create(tr.doc, start - before.nodeSize));
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  const after = state.doc.resolve(end).nodeAfter;
  if (!after) return false;
  if (dispatch) {
    const tr = state.tr.delete(start, end);
    const target = start + after.nodeSize;
    tr.insert(target, node);
    tr.setSelection(NodeSelection.create(tr.doc, target));
    dispatch(tr.scrollIntoView());
  }
  return true;
}

export const BlockHandle = Extension.create({
  name: "blockHandle",
  addOptions() { return { onPlus: () => {} }; },
  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": () => moveBlock(this.editor.state, this.editor.view.dispatch, -1),
      "Alt-ArrowDown": () => moveBlock(this.editor.state, this.editor.view.dispatch, 1),
    };
  },
  addProseMirrorPlugins() {
    const options = this.options;
    let current = null; // position du bloc survolé
    return [
      new Plugin({
        key: new PluginKey("blockHandle"),
        view(view) {
          const bar = document.createElement("div");
          bar.className = "kb-ed-handle";
          bar.hidden = true;
          const plus = document.createElement("button");
          plus.type = "button";
          plus.className = "kb-ed-handle-btn";
          plus.textContent = "+";
          plus.title = "Insérer un bloc ici";
          plus.setAttribute("aria-label", "Insérer un bloc après celui-ci");
          const grip = document.createElement("button");
          grip.type = "button";
          grip.className = "kb-ed-handle-btn kb-ed-grip";
          grip.textContent = "⠿";
          grip.title = "Glisser pour déplacer le bloc (au clavier : Alt + flèche haut / bas)";
          grip.setAttribute("aria-label", "Déplacer le bloc");
          grip.draggable = true;
          bar.append(plus, grip);
          const host = view.dom.parentNode;
          host.style.position = "relative";
          host.append(bar);

          const place = (pos) => {
            const dom = view.nodeDOM(pos);
            if (!(dom instanceof HTMLElement)) { bar.hidden = true; return; }
            const hostBox = host.getBoundingClientRect();
            const box = dom.getBoundingClientRect();
            bar.style.top = `${box.top - hostBox.top + host.scrollTop}px`;
            bar.hidden = false;
          };
          const onMove = (event) => {
            if (!view.editable) return;
            const found = view.posAtCoords({ left: view.dom.getBoundingClientRect().left + 24, top: event.clientY });
            if (!found) return;
            const pos = topLevelPos(view.state.doc, found.inside >= 0 ? found.inside : found.pos);
            if (pos === null) return;
            current = pos;
            place(pos);
          };
          const selectBlock = () => {
            if (current === null || !view.state.doc.nodeAt(current)) return false;
            view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, current)));
            return true;
          };
          plus.addEventListener("mousedown", (e) => e.preventDefault());
          plus.addEventListener("click", () => {
            if (current === null) return;
            const node = view.state.doc.nodeAt(current);
            if (!node) return;
            const after = current + node.nodeSize;
            view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(after - 1))));
            view.focus();
            options.onPlus(after);
          });
          grip.addEventListener("mousedown", () => selectBlock());
          grip.addEventListener("dragstart", (event) => {
            if (!selectBlock()) return;
            const slice = view.state.selection.content();
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", " ");
            const dom = view.nodeDOM(current);
            if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 0, 0);
            view.dragging = { slice, move: true };
          });
          grip.addEventListener("dragend", () => { view.dragging = null; });
          view.dom.addEventListener("mousemove", onMove);
          host.addEventListener("mouseleave", (e) => { if (!bar.contains(e.relatedTarget)) bar.hidden = true; });
          return {
            update() { if (current !== null && !bar.hidden && view.state.doc.nodeAt(current)) place(current); },
            destroy() { view.dom.removeEventListener("mousemove", onMove); bar.remove(); },
          };
        },
      }),
    ];
  },
});

export { moveBlock };

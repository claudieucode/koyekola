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

// Zones qui contiennent des blocs (on y déplace et on y dépose des blocs comme au premier niveau)
export const ZONES = new Set(["kbColumn", "kbGroup"]);
// Début du bloc « de zone » qui contient une position : enfant direct du document, d'une colonne ou d'un groupe
function zoneBlockPos(doc, pos) {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)));
  if ($pos.depth === 0) return $pos.pos < doc.content.size ? $pos.pos : null;
  let best = $pos.before(1);
  for (let d = 2; d <= $pos.depth; d++) if (ZONES.has($pos.node(d - 1).type.name)) best = $pos.before(d);
  return best;
}

function moveBlock(state, dispatch, dir) {
  const { $from } = state.selection;
  if ($from.depth === 0 && !(state.selection instanceof NodeSelection)) return false;
  // Bloc sélectionné en entier (à n'importe quel niveau), sinon bloc de zone qui contient le curseur
  const start = state.selection instanceof NodeSelection ? state.selection.from : zoneBlockPos(state.doc, $from.pos);
  if (start === null) return false;
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
  addOptions() { return { onPlus: () => {}, visual: true }; },
  addKeyboardShortcuts() {
    return {
      "Alt-ArrowUp": () => moveBlock(this.editor.state, this.editor.view.dispatch, -1),
      "Alt-ArrowDown": () => moveBlock(this.editor.state, this.editor.view.dispatch, 1),
    };
  },
  addProseMirrorPlugins() {
    const options = this.options;
    if (!options.visual) return [blockDropPlugin()]; // interface façon Gutenberg : la poignée vit dans la barre d'outils du bloc
    let current = null; // position du bloc survolé
    return [blockDropPlugin(), 
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
            blockDrag = current;
            document.body.classList.add("kb-block-dragging");
          });
          grip.addEventListener("dragend", () => { view.dragging = null; blockDrag = null; document.body.classList.remove("kb-block-dragging"); });
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

// Bloc en cours de déplacement (poignée) : début du bloc dans le document
let blockDrag = null;

// Cible du dépôt, comme Gutenberg : bloc de premier niveau sous le pointeur ; moitié haute → avant, moitié basse → après
function dropTarget(view, event) {
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });
  let pos = found ? zoneBlockPos(view.state.doc, found.inside >= 0 ? found.inside : found.pos) : null;
  if (pos === null) {
    // Sous le dernier bloc (marge basse de la zone d'écriture) : après le dernier bloc
    const last = view.state.doc.lastChild;
    if (!last) return null;
    pos = view.state.doc.content.size - last.nodeSize;
  }
  const node = view.state.doc.nodeAt(pos);
  const dom = view.nodeDOM(pos);
  if (!node || !(dom instanceof HTMLElement)) return null;
  const box = dom.getBoundingClientRect();
  const after = event.clientY > box.top + box.height / 2;
  return { pos, node, dom, after, insert: after ? pos + node.nodeSize : pos };
}

// Dépôt d'un bloc déplacé par sa poignée : ligne bleue à l'endroit d'arrivée, déplacement exact avant / après la cible
function blockDropPlugin() {
  let line = null;
  const hide = () => { if (line) line.hidden = true; };
  const finish = () => { hide(); blockDrag = null; document.body.classList.remove("kb-block-dragging"); };
  return new Plugin({
    key: new PluginKey("blockDrop"),
    view(view) {
      const host = view.dom.parentNode;
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      line = document.createElement("div");
      line.className = "kb-drop-line";
      line.hidden = true;
      line.setAttribute("aria-hidden", "true");
      host.append(line);
      return { destroy() { line.remove(); line = null; } };
    },
    props: {
      handleDOMEvents: {
        dragover(view, event) {
          if (blockDrag === null) return false;
          const t = dropTarget(view, event);
          if (!t || !line) { hide(); return false; }
          const host = view.dom.parentNode;
          const hostBox = host.getBoundingClientRect();
          const box = t.dom.getBoundingClientRect();
          const gap = 4;
          line.style.top = `${(t.after ? box.bottom + gap : box.top - gap) - hostBox.top + host.scrollTop - 1}px`;
          line.style.left = `${box.left - hostBox.left}px`;
          line.style.width = `${box.width}px`;
          line.hidden = false;
          event.preventDefault();
          return false;
        },
        dragleave(view, event) { if (!view.dom.parentNode.contains(event.relatedTarget)) hide(); return false; },
        dragend() { finish(); return false; },
      },
      handleDrop(view, event) {
        if (blockDrag === null) return false;
        const from = blockDrag;
        finish();
        const t = dropTarget(view, event);
        const node = view.state.doc.nodeAt(from);
        event.preventDefault();
        view.dragging = null;
        if (!t || !node) return true;
        const to = from + node.nodeSize;
        // Déposé sur lui-même ou juste à côté de sa place : rien ne change
        if (t.insert >= from && t.insert <= to) return true;
        const tr = view.state.tr.delete(from, to);
        const at = tr.mapping.map(t.insert);
        tr.insert(at, node);
        tr.setSelection(NodeSelection.create(tr.doc, at));
        view.dispatch(tr.scrollIntoView());
        view.focus();
        return true;
      },
    },
  });
}

// Fin du glisser (déposé n'importe où, y compris hors de la zone d'écriture) : tout est remis à zéro
function endBlockDrag() {
  blockDrag = null;
  document.body.classList.remove("kb-block-dragging");
  document.querySelectorAll(".kb-drop-line").forEach((l) => { l.hidden = true; });
}

// Glisser un bloc depuis un bouton extérieur (poignée de la barre d'outils du bloc) : pos = début du bloc à déplacer
function startBlockDrag(view, pos, event) {
  if (!view.state.doc.nodeAt(pos)) return;
  blockDrag = pos;
  document.body.classList.add("kb-block-dragging");
  view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
  const slice = view.state.selection.content();
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", " ");
  const dom = view.nodeDOM(pos);
  if (dom instanceof HTMLElement) event.dataTransfer.setDragImage(dom, 12, 12);
  view.dragging = { slice, move: true };
}

export { moveBlock, startBlockDrag, endBlockDrag, topLevelPos, zoneBlockPos };

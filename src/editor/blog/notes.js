// Notes de travail : pastille « 💬 n » sur les blocs qui ont des notes ouvertes (cliquer ouvre l'onglet Notes).
// Les notes elles-mêmes vivent sur le serveur (src/services/postNotes.js) et ne sont jamais publiées.
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { walkBlocks } from "./blocks";

export const notesKey = new PluginKey("kbNotes");
export const NotesBadges = Extension.create({
  name: "kbNotesBadges",
  addOptions() { return { onClick: () => {} }; },
  addProseMirrorPlugins() {
    const options = this.options;
    return [new Plugin({
      key: notesKey,
      state: { init: () => ({}), apply: (tr, value) => { const meta = tr.getMeta(notesKey); return meta ? meta.counts : value; } },
      props: {
        decorations(state) {
          const counts = notesKey.getState(state);
          if (!counts || !Object.keys(counts).length) return null;
          const decos = [];
          walkBlocks(state.doc, (node, pos) => {
            const id = node.attrs.blockId;
            const n = id && counts[id];
            if (!n) return undefined;
            decos.push(Decoration.widget(pos, () => {
              const b = document.createElement("button");
              b.type = "button";
              b.className = "kb-note-badge";
              b.contentEditable = "false";
              b.textContent = `💬 ${n}`;
              b.title = `${n} note${n > 1 ? "s" : ""} ouverte${n > 1 ? "s" : ""} sur ce bloc`;
              b.setAttribute("aria-label", `${n} note${n > 1 ? "s" : ""} ouverte${n > 1 ? "s" : ""} sur ce bloc : ouvrir les notes`);
              b.addEventListener("mousedown", (e) => e.preventDefault());
              b.addEventListener("click", () => options.onClick(id));
              return b;
            }, { side: -1, key: `note-${id}-${n}`, ignoreSelection: true }));
            return undefined;
          });
          return decos.length ? DecorationSet.create(state.doc, decos) : null;
        },
      },
    })];
  },
});
export function setNoteCounts(editor, counts) {
  editor.view.dispatch(editor.state.tr.setMeta(notesKey, { counts }).setMeta("addToHistory", false));
}

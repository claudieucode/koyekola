// Éditeur de code de « Apparence → Éditeur de fichiers » (CodeMirror 6, licence MIT). Construit en public/js/theme-code-editor.js par `npm run build:code-editor`.
// Expose window.KolakisaCode.create(parent, options) : coloration (JSON, CSS), numéros de lignes, repli, recherche / remplacement (Ctrl/Cmd+F, Ctrl/Cmd+H),
// annulation, indentation, parenthèses, erreurs de syntaxe JSON en ligne. Les couleurs viennent de variables CSS (--tf-*) : clair et sombre.
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, highlightSpecialChars } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { syntaxHighlighting, HighlightStyle, bracketMatching, indentOnInput, foldGutter, foldKeymap } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { tags as t } from "@lezer/highlight";

const highlight = HighlightStyle.define([
  { tag: [t.propertyName, t.definition(t.propertyName)], color: "var(--tf-key)" },
  { tag: [t.string, t.special(t.string)], color: "var(--tf-string)" },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: "var(--tf-number)" },
  { tag: [t.keyword, t.operatorKeyword, t.modifier], color: "var(--tf-keyword)" },
  { tag: [t.className, t.tagName, t.typeName, t.labelName], color: "var(--tf-key)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--tf-comment)", fontStyle: "italic" },
  { tag: [t.punctuation, t.separator, t.bracket], color: "var(--tf-punct)" },
  { tag: t.invalid, color: "var(--tf-error)" },
]);

const frame = EditorView.theme({
  "&": { height: "100%", fontSize: "13.5px", backgroundColor: "var(--tf-bg)", color: "var(--tf-text)" },
  ".cm-scroller": { fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace', lineHeight: "1.6", overflow: "auto" },
  ".cm-content": { caretColor: "var(--tf-caret)", padding: "10px 0" },
  ".cm-gutters": { backgroundColor: "var(--tf-gutter)", color: "var(--tf-gutter-text)", border: "none", borderRight: "1px solid var(--tf-line)" },
  ".cm-activeLine": { backgroundColor: "var(--tf-active-line)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--tf-active-line)", color: "var(--tf-text)" },
  "&.cm-focused": { outline: "none" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": { backgroundColor: "var(--tf-selection) !important" },
  ".cm-cursor": { borderLeftColor: "var(--tf-caret)" },
  ".cm-panels": { backgroundColor: "var(--tf-gutter)", color: "var(--tf-text)", borderTop: "1px solid var(--tf-line)" },
  ".cm-panels input, .cm-panels button": { fontSize: "12.5px" },
  ".cm-searchMatch": { backgroundColor: "var(--tf-match)", outline: "1px solid var(--tf-match-line)" },
  ".cm-tooltip": { backgroundColor: "var(--tf-gutter)", border: "1px solid var(--tf-line)", color: "var(--tf-text)" },
});

const langOf = (name) => (name === "css" ? css() : name === "json" ? [json(), linter(jsonParseLinter()), lintGutter()] : []);

function create(parent, { doc = "", language = "json", readOnly = false, onChange = () => {}, onSave = () => {}, label = "Contenu du fichier" } = {}) {
  const lang = new Compartment(), ro = new Compartment();
  const saveKey = { key: "Mod-s", preventDefault: true, run: () => { onSave(); return true; } };
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [
        lineNumbers(), foldGutter(), highlightActiveLineGutter(), highlightSpecialChars(), history(), drawSelection(), indentOnInput(), bracketMatching(),
        highlightActiveLine(), highlightSelectionMatches(), syntaxHighlighting(highlight), EditorState.tabSize.of(2),
        keymap.of([saveKey, ...defaultKeymap, ...historyKeymap, ...foldKeymap, ...searchKeymap, ...lintKeymap, indentWithTab]),
        frame, lang.of(langOf(language)), ro.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
        EditorView.contentAttributes.of({ "aria-label": label, spellcheck: "false", autocapitalize: "off" }),
        EditorView.updateListener.of((u) => { if (u.docChanged) onChange(u.state.doc.toString()); }),
      ],
    }),
  });
  return {
    getValue: () => view.state.doc.toString(),
    setValue(text, nextLanguage) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text }, selection: { anchor: 0 }, scrollIntoView: true });
      if (nextLanguage) view.dispatch({ effects: lang.reconfigure(langOf(nextLanguage)) });
    },
    setReadOnly(flag) { view.dispatch({ effects: ro.reconfigure([EditorState.readOnly.of(flag), EditorView.editable.of(!flag)]) }); },
    focus: () => view.focus(),
    lineCount: () => view.state.doc.lines,
    destroy: () => view.destroy(),
  };
}

window.KolakisaCode = { create };

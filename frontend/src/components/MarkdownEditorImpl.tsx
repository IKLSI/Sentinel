import { forwardRef, useImperativeHandle, useRef, useMemo } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import {
  EditorView,
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export interface MarkdownEditorHandle {
  applyWrap: (before: string, after: string) => void;
  insertLink: () => void;
  getSelection: () => [number, number];
  focus: () => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  minHeight?: number;
  isDark?: boolean;
  autoFocus?: boolean;
}

// Highlight style: markdown syntax rendered visually
const mdHighlight = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.35em", fontWeight: "700", lineHeight: "1.4" },
  { tag: t.heading2, fontSize: "1.2em", fontWeight: "700", lineHeight: "1.4" },
  { tag: t.heading3, fontSize: "1.1em", fontWeight: "600", lineHeight: "1.4" },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: "600" },
  { tag: t.strong, fontWeight: "700" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.monospace, fontFamily: "var(--font-mono)", fontSize: "0.875em" },
  { tag: t.link, color: "var(--accent)", textDecoration: "underline" },
  { tag: t.url, color: "var(--accent)", opacity: "0.6" },
  // Markers (**, *, `, #) — muted, will be hidden on non-cursor lines
  { tag: t.processingInstruction, color: "var(--muted)", opacity: "0.45" },
  { tag: t.meta, color: "var(--muted)", opacity: "0.45" },
  // HTML comments (our <!-- attachments --> separator) — invisible
  { tag: t.blockComment, color: "transparent" },
  { tag: t.lineComment, color: "transparent" },
]);

// Obsidian-like plugin: hide markdown markers on lines that don't contain the cursor
function buildObsidianPlugin() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.compute(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = this.compute(update.view);
        }
      }

      compute(view: EditorView): DecorationSet {
        const { state } = view;
        const cursorLine = state.doc.lineAt(state.selection.main.head).number;
        const ranges: Array<{ from: number; to: number }> = [];

        syntaxTree(state).iterate({
          enter(node: { name: string; from: number; to: number }) {
            const lineNum = state.doc.lineAt(node.from).number;
            if (lineNum === cursorLine) return;

            switch (node.name) {
              case "EmphasisMark":
              case "CodeMark":
                ranges.push({ from: node.from, to: node.to });
                break;
              case "HeaderMark": {
                const lineEnd = state.doc.lineAt(node.from).to;
                ranges.push({ from: node.from, to: Math.min(node.to + 1, lineEnd) });
                break;
              }
              case "LinkMark":
                ranges.push({ from: node.from, to: node.to });
                break;
            }
          },
        });

        ranges.sort((a, b) => a.from - b.from);

        const builder = new RangeSetBuilder<Decoration>();
        let lastTo = -1;
        for (const { from, to } of ranges) {
          if (from >= lastTo) {
            builder.add(from, to, Decoration.replace({}));
            lastTo = to;
          }
        }
        return builder.finish();
      }
    },
    { decorations: (v: { decorations: DecorationSet }) => v.decorations },
  );
}

export const MarkdownEditor = forwardRef<MarkdownEditorHandle, Props>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder,
      minHeight = 90,
      isDark = false,
      autoFocus = false,
    },
    ref,
  ) => {
    const cmRef = useRef<ReactCodeMirrorRef>(null);

    useImperativeHandle(ref, () => ({
      applyWrap(before, after) {
        const view = cmRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to) || "texte";
        view.dispatch({
          changes: { from, to, insert: before + selected + after },
          selection: {
            anchor: from + before.length,
            head: from + before.length + selected.length,
          },
        });
        view.focus();
      },
      insertLink() {
        const view = cmRef.current?.view;
        if (!view) return;
        const { from, to } = view.state.selection.main;
        const selected = view.state.sliceDoc(from, to).trim();
        if (!selected) return;
        const insert = `<${selected}>`;
        view.dispatch({
          changes: { from, to, insert },
          selection: { anchor: from + insert.length },
        });
        view.focus();
      },
      getSelection() {
        const view = cmRef.current?.view;
        if (!view) return [0, 0];
        const { from, to } = view.state.selection.main;
        return [from, to];
      },
      focus() {
        cmRef.current?.view?.focus();
      },
    }));

    const extensions = useMemo(() => {
      const theme = EditorView.theme({
        "&": { background: "transparent !important" },
        "&.cm-focused": { outline: "none !important" },
        ".cm-scroller": {
          fontFamily: "inherit",
          lineHeight: "1.65",
          overflow: "auto",
        },
        ".cm-content": {
          padding: "12px 16px",
          minHeight: `${minHeight}px`,
          color: "var(--text)",
          caretColor: "var(--text)",
          wordBreak: "break-word",
        },
        ".cm-line": { padding: "0" },
        ".cm-cursor": { borderLeftColor: "var(--text)" },
        ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
          background:
            "color-mix(in srgb, var(--accent) 22%, transparent) !important",
        },
      });

      const linkClickHandler = EditorView.domEventHandlers({
        mousedown(e: MouseEvent, view: EditorView) {
          if (!e.ctrlKey && !e.metaKey) return false;
          const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
          if (pos === null) return false;
          let url: string | null = null;
          syntaxTree(view.state).iterate({
            from: pos,
            to: pos + 1,
            enter(node: { name: string; from: number; to: number }) {
              if (node.name === "URL" || node.name === "Link" || node.name === "Autolink") {
                const raw = view.state.sliceDoc(node.from, node.to);
                url = raw.replace(/^<|>$/g, "");
              }
            },
          });
          if (url) {
            window.open(url as string, "_blank", "noopener,noreferrer");
            e.preventDefault();
            return true;
          }
          return false;
        },
      });

      const submitKeymap = EditorView.domEventHandlers({
        keydown(e: KeyboardEvent) {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            onSubmit?.();
            return true;
          }
          return false;
        },
      });

      return [
        markdown(),
        syntaxHighlighting(mdHighlight),
        buildObsidianPlugin(),
        EditorView.lineWrapping,
        theme,
        submitKeymap,
        linkClickHandler,
        ...(placeholder ? [cmPlaceholder(placeholder)] : []),
      ];
    }, [minHeight, placeholder, onSubmit]);

    return (
      <CodeMirror
        ref={cmRef}
        value={value}
        onChange={(val) => onChange(val)}
        extensions={extensions}
        theme={isDark ? "dark" : "none"}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: false,
          bracketMatching: false,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: false,
          highlightSelectionMatches: false,
          syntaxHighlighting: false,
          searchKeymap: false,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
        autoFocus={autoFocus}
        style={{ width: "100%", fontSize: "13px" }}
      />
    );
  },
);

MarkdownEditor.displayName = "MarkdownEditor";

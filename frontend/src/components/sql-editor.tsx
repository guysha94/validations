"use client";

import { highlight, languages } from "prismjs";
import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism.css";
import { useDbTables } from "~/hooks";

const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "IN",
  "LIKE",
  "BETWEEN",
  "IS",
  "NULL",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "ON",
  "AS",
  "GROUP",
  "BY",
  "HAVING",
  "ORDER",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "DISTINCT",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COALESCE",
  "CAST",
  "TRUE",
  "FALSE",
].map((kw) => kw.toLowerCase());

type SQLEditorProps = {
  value?: string;
  onChange: (value: string | null | undefined) => void;
  placeholder?: string;
  readOnly?: boolean;
};

function findCurrentWord(
  text: string,
  cursorPos: number,
): { word: string; start: number; end: number } {
  let start = cursorPos - 1;
  while (start >= 0 && /[a-zA-Z0-9_]/.test(text[start])) start--;
  start++;
  let end = cursorPos;
  while (end < text.length && /[a-zA-Z0-9_]/.test(text[end])) end++;
  return { word: text.slice(start, end), start, end };
}

export default function SQLEditor({
  value = "",
  onChange,
  placeholder = "Enter SQL query...",
  readOnly = false,
}: SQLEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [_completionState, setCompletionState] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const { data: dbTables = {} } = useDbTables();
  const suggestionsRef = useRef<Set<string>>(new Set());
  const completionStateRef = useRef<{ start: number; end: number } | null>(
    null,
  );

  const allCompletions = useCallback(() => {
    const tables = Object.keys(dbTables);
    const columns = Object.values(dbTables).flat();
    return new Set([...SQL_KEYWORDS, ...tables, ...columns]);
  }, [dbTables]);

  const updateSuggestions = useCallback(
    (text: string, cursorPos: number) => {
      const { word, start, end } = findCurrentWord(text, cursorPos);
      if (word.length < 1) {
        setSuggestions(new Set());
        setCompletionState(null);
        suggestionsRef.current = new Set();
        return;
      }
      const w = word.toLowerCase();
      const matches = new Set(
        [...allCompletions()].filter(
          (c) => c.toLowerCase().startsWith(w) && c.toLowerCase() !== w,
        ),
      );
      if (matches.size > 0) {
        suggestionsRef.current = matches;
        completionStateRef.current = { start, end };
        setSuggestions(matches);
        setCompletionState({ start, end });
        setSelectedIndex(0);
      } else {
        setSuggestions(new Set());
        setCompletionState(null);
        suggestionsRef.current = new Set();
      }
    },
    [allCompletions],
  );

  useEffect(() => {
    const ta = containerRef.current?.querySelector("textarea");
    if (!ta) return;
    const sync = () => {
      const pos = ta.selectionStart;
      updateSuggestions(value, pos);
    };
    ta.addEventListener("input", sync);
    ta.addEventListener("click", sync);
    ta.addEventListener("keyup", sync);
    return () => {
      ta.removeEventListener("input", sync);
      ta.removeEventListener("click", sync);
      ta.removeEventListener("keyup", sync);
    };
  }, [value, updateSuggestions]);

  const applySuggestion = useCallback(
    (suggestion: string) => {
      const state = completionStateRef.current;
      if (!state) return;
      const before = value.slice(0, state.start);
      const after = value.slice(state.end);
      const next = before + suggestion + after;
      onChange(next);
      setSuggestions(new Set());
      setCompletionState(null);
      completionStateRef.current = null;
      suggestionsRef.current = new Set();
      requestAnimationFrame(() => {
        const ta = containerRef.current?.querySelector("textarea");
        if (ta) {
          const pos = state.start + suggestion.length;
          ta.setSelectionRange(pos, pos);
          ta.focus();
        }
      });
    },
    [value, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (suggestions.size === 0) return;

      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        const sel = [...suggestionsRef.current][selectedIndex];
        if (sel) applySuggestion(sel);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, suggestions.size - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Escape") {
        setSuggestions(new Set());
        setCompletionState(null);
        suggestionsRef.current = new Set();
      }
    },
    [suggestions.size, selectedIndex, applySuggestion],
  );

  const handleValueChange = useCallback(
    (v: string) => {
      onChange(v);
    },
    [onChange],
  );

  if (readOnly) {
    return (
      <pre className="bg-muted/30 rounded-lg border p-4 text-sm font-mono overflow-auto max-h-[200px]">
        {value || <span className="text-muted-foreground">{placeholder}</span>}
      </pre>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Editor
        value={value}
        onValueChange={handleValueChange}
        onKeyDown={handleKeyDown}
        highlight={(code) => highlight(code, languages.sql, "sql")}
        padding={10}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 12,
          backgroundColor: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "6px",
        }}
        textareaClassName="dark:bg-background dark:border-input"
      />
      {suggestions.size > 0 && (
        <div
          className="absolute z-50 mt-1 max-h-48 min-w-[160px] overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{ top: "100%" }}
        >
          {[...suggestions].slice(0, 12).map((s, i) => (
            <div
              key={i}
              role="option"
              aria-selected={i === selectedIndex}
              className={`cursor-pointer rounded px-2 py-1.5 text-sm font-mono ${
                i === selectedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                applySuggestion(s);
              }}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {s}
            </div>
          ))}
          <div className="border-t px-2 py-1 text-xs text-muted-foreground">
            Tab or Enter to complete · ↑↓ to navigate
          </div>
        </div>
      )}
    </div>
  );
}

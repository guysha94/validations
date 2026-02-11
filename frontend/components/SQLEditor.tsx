"use client"

import {useEffect, useMemo, useRef, useState} from "react"
import {
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_HIGH,
    KEY_TAB_COMMAND,
    SerializedEditorState,
    TextNode
} from "lexical";
import {$isCodeNode, CodeNode} from "@lexical/code";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {Editor} from '~/components/blocks/editor-x/editor'

type SQLEditorProps = {
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    readOnly?: boolean
}

export default function SQLEditor({value = "", onChange, placeholder = "Enter SQL query...", readOnly = false}: SQLEditorProps) {
    if (readOnly) {
        return (
            <pre className="bg-muted/30 rounded-lg border p-4 text-sm font-mono overflow-auto max-h-[200px]">
                {value || <span className="text-muted-foreground">{placeholder}</span>}
            </pre>
        );
    }

    const handleEditorChange = (state: SerializedEditorState) => {

        if (!onChange) return;
        // Extract text from code node
        const codeNode = state.root.children?.[0] as any;
        if (codeNode && codeNode.type === "code" && codeNode.children) {
            const text = codeNode.children.map((child: any) => child.text || '').join('') || '';
            onChange(text);
        } else {
            onChange('');
        }
    }

    const editorState = useMemo(() => ({
        root: {
            children: [
                {
                    children: [
                        {
                            detail: 0,
                            format: 0,
                            mode: "normal",
                            style: "",
                            text: value,
                            type: "text",
                            version: 1,
                        },
                    ],
                    direction: "ltr",
                    format: "",
                    indent: 0,
                    language: "sql",
                    type: "code",
                    version: 1,
                },
            ],
            direction: "ltr",
            format: "",
            indent: 0,
            type: "root",
            version: 1,
        },
    } as unknown as SerializedEditorState), [value]);

    return (

        <Editor

            editorSerializedState={editorState}
            onSerializedChange={handleEditorChange}
        />
    )
}

type PluginsProps = {
    value: string
    onChange?: (value: string) => void
    placeholder: string
    floatingAnchorElem: HTMLDivElement | null
    onRef: (elem: HTMLDivElement) => void
    isInitialMount: React.MutableRefObject<boolean>
}

// SQL Keywords for autocomplete
const SQL_KEYWORDS = [
    "SELECT", "FROM", "WHERE", "AND", "OR", "NOT", "IN", "LIKE", "BETWEEN", "IS", "NULL",
    "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP",
    "INDEX", "VIEW", "DATABASE", "SCHEMA", "TRUNCATE", "EXEC", "EXECUTE", "CALL", "PROCEDURE",
    "FUNCTION", "TRIGGER", "CONSTRAINT", "PRIMARY", "KEY", "FOREIGN", "UNIQUE", "CHECK",
    "DEFAULT", "AUTO_INCREMENT", "IDENTITY", "SEQUENCE", "AS", "ON", "JOIN", "INNER", "LEFT",
    "RIGHT", "FULL", "OUTER", "CROSS", "UNION", "ALL", "INTERSECT", "EXCEPT", "GROUP", "BY",
    "HAVING", "ORDER", "ASC", "DESC", "LIMIT", "OFFSET", "TOP", "DISTINCT", "COUNT", "SUM",
    "AVG", "MIN", "MAX", "CASE", "WHEN", "THEN", "ELSE", "END", "CAST", "CONVERT", "COALESCE",
    "IFNULL", "NULLIF", "SUBSTRING", "CONCAT", "UPPER", "LOWER", "TRIM", "LTRIM", "RTRIM",
    "LENGTH", "CHAR_LENGTH", "REPLACE", "DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR",
    "MONTH", "DAY", "HOUR", "MINUTE", "SECOND", "NOW", "CURRENT_DATE", "CURRENT_TIME",
    "CURRENT_TIMESTAMP", "EXTRACT", "DATE_ADD", "DATE_SUB", "DATEDIFF", "DATE_FORMAT",
    "EXISTS", "ANY", "SOME", "ALL", "UNION", "INTERSECT", "EXCEPT", "WITH", "RECURSIVE",
    "CTE", "WINDOW", "OVER", "PARTITION", "ROW_NUMBER", "RANK", "DENSE_RANK", "LEAD", "LAG",
    "FIRST_VALUE", "LAST_VALUE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "TRANSACTION",
    "BEGIN", "SAVEPOINT", "LOCK", "UNLOCK", "EXPLAIN", "ANALYZE", "OPTIMIZE", "SHOW",
    "DESCRIBE", "DESC", "USE", "BACKUP", "RESTORE", "IMPORT", "EXPORT"
].map(kw => kw.toLowerCase());

export function SQLAutocompletePlugin() {
    const [editor] = useLexicalComposerContext()
    const [suggestion, setSuggestion] = useState<string | null>(null)
    const [suggestionPosition, setSuggestionPosition] = useState<{ top: number; left: number } | null>(null)
    const suggestionRef = useRef<string | null>(null)
    const completeKeywordRef = useRef<string | null>(null)
    const wordStartRef = useRef<number>(0)
    const wordEndRef = useRef<number>(0)

    useEffect(() => {
        let lastMatch: string | null = null
        let suggestionText: string | null = null
        let wordStart: number = 0
        let wordEnd: number = 0
        let completeKeyword: string | null = null

        function findSQLSuggestion(text: string, cursorPos: number): {
            suggestion: string | null,
            start: number,
            end: number,
            keyword: string | null
        } {
            // Find the current word being typed (backwards from cursor)
            let start = cursorPos - 1
            while (start >= 0 && /[a-zA-Z_]/.test(text[start])) {
                start--
            }
            start++

            let end = cursorPos
            while (end < text.length && /[a-zA-Z_]/.test(text[end])) {
                end++
            }

            const currentWord = text.substring(start, end).toLowerCase()

            if (currentWord.length < 1) {
                return {suggestion: null, start, end, keyword: null}
            }

            // Find matching SQL keywords
            const matches = SQL_KEYWORDS.filter(keyword =>
                keyword.startsWith(currentWord) && keyword !== currentWord
            )

            if (matches.length > 0) {
                // Get the first match
                const match = matches[0]
                return {
                    suggestion: match.substring(currentWord.length),
                    start,
                    end,
                    keyword: match.toUpperCase()
                }
            }

            return {suggestion: null, start, end, keyword: null}
        }

        function updateSuggestion() {
            editor.getEditorState().read(() => {
                const selection = $getSelection()
                if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                    setSuggestion(null)
                    setSuggestionPosition(null)
                    return
                }

                const anchor = selection.anchor
                const node = anchor.getNode()

                // Check if we're in a code node
                let codeNode: CodeNode | null = null
                if ($isCodeNode(node)) {
                    codeNode = node
                } else {
                    // Try to find parent code node
                    let parent = node.getParent()
                    while (parent) {
                        if ($isCodeNode(parent)) {
                            codeNode = parent
                            break
                        }
                        parent = parent.getParent()
                    }
                }

                if (!codeNode) {
                    setSuggestion(null)
                    setSuggestionPosition(null)
                    return
                }

                const text = codeNode.getTextContent()

                // Calculate absolute offset within the code node
                // anchor.offset is relative to the text node, not the code node
                let absoluteOffset = anchor.offset
                const anchorNode = anchor.getNode()

                if ($isTextNode(anchorNode)) {
                    // Sum up all text nodes before the current one
                    const textNodes = codeNode.getChildren().filter($isTextNode) as TextNode[]
                    let currentOffset = 0
                    for (const textNode of textNodes) {
                        if (textNode === anchorNode) {
                            absoluteOffset = currentOffset + anchor.offset
                            break
                        }
                        currentOffset += textNode.getTextContentSize()
                    }
                }

                const result = findSQLSuggestion(text, absoluteOffset)

                if (result.suggestion && result.suggestion !== suggestionText) {
                    suggestionText = result.suggestion
                    wordStartRef.current = result.start
                    wordEndRef.current = result.end
                    completeKeywordRef.current = result.keyword
                    lastMatch = text.substring(0, absoluteOffset)

                    // Get cursor position for tooltip
                    const rootElement = editor.getRootElement()
                    if (rootElement) {
                        const selection = window.getSelection()
                        if (selection && selection.rangeCount > 0) {
                            const range = selection.getRangeAt(0)
                            const rect = range.getBoundingClientRect()
                            const rootRect = rootElement.getBoundingClientRect()
                            setSuggestionPosition({
                                top: rect.bottom - rootRect.top + 4,
                                left: rect.left - rootRect.left
                            })
                        }
                    }
                    setSuggestion(result.suggestion)
                    suggestionRef.current = result.suggestion
                } else if (!result.suggestion) {
                    setSuggestion(null)
                    setSuggestionPosition(null)
                    suggestionRef.current = null
                    completeKeywordRef.current = null
                    suggestionText = null
                    lastMatch = null
                }
            })
        }

        // Handle Tab key to accept suggestion
        const unregisterTab = editor.registerCommand(
            KEY_TAB_COMMAND,
            (event) => {
                const currentSuggestion = suggestionRef.current
                if (currentSuggestion) {
                    if (event) {
                        event.preventDefault()
                        event.stopPropagation()
                        event.stopImmediatePropagation()
                    }
                    editor.update(() => {
                        const selection = $getSelection()
                        if ($isRangeSelection(selection) && selection.isCollapsed()) {
                            const anchor = selection.anchor
                            const node = anchor.getNode()

                            // Make sure we're in a code node
                            let codeNode: CodeNode | null = null
                            if ($isCodeNode(node)) {
                                codeNode = node
                            } else {
                                let parent = node.getParent()
                                while (parent) {
                                    if ($isCodeNode(parent)) {
                                        codeNode = parent
                                        break
                                    }
                                    parent = parent.getParent()
                                }
                            }

                            if (codeNode && completeKeywordRef.current) {
                                // Select the word by moving backwards from cursor
                                const anchor = selection.anchor
                                const node = anchor.getNode()

                                if ($isTextNode(node)) {
                                    const offset = anchor.offset
                                    const text = node.getTextContent()

                                    // Find word boundaries
                                    let wordStart = offset - 1
                                    while (wordStart >= 0 && /[a-zA-Z_]/.test(text[wordStart])) {
                                        wordStart--
                                    }
                                    wordStart++

                                    let wordEnd = offset
                                    while (wordEnd < text.length && /[a-zA-Z_]/.test(text[wordEnd])) {
                                        wordEnd++
                                    }

                                    // Select the word and replace it
                                    node.select(wordStart, wordEnd)
                                    const wordSelection = $getSelection()
                                    if ($isRangeSelection(wordSelection)) {
                                        wordSelection.insertText(completeKeywordRef.current)
                                    }
                                } else {
                                    // Fallback: just insert the complete keyword
                                    selection.insertText(completeKeywordRef.current)
                                }
                            }
                        }
                    })
                    // Clear suggestion after update
                    setSuggestion(null)
                    setSuggestionPosition(null)
                    suggestionRef.current = null
                    return true
                }
                return false
            },
            COMMAND_PRIORITY_HIGH
        )

        const unregisterUpdate = editor.registerUpdateListener(() => {
            updateSuggestion()
        })

        return () => {
            unregisterTab()
            unregisterUpdate()
        }
    }, [editor, suggestion])

    if (!suggestion || !suggestionPosition) {
        return null
    }

    return (
        <div
            className="absolute z-50 bg-popover text-popover-foreground border rounded-md px-2 py-1 text-xs font-mono shadow-md pointer-events-none"
            style={{
                top: `${suggestionPosition.top}px`,
                left: `${suggestionPosition.left}px`,
            }}
        >
            <span className="text-muted-foreground">{suggestion.toUpperCase()}</span>
            <span className="ml-2 text-xs text-muted-foreground">(Tab to accept)</span>
        </div>
    )
}

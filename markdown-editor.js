const MarkdownEditor = {
    lastSelectionRange: null,

    getActiveEditor() {
        if (
            document.activeElement &&
            document.activeElement.id === "systemPromptInput"
        ) {
            return document.activeElement;
        }
        return document.getElementById("userInput");
    },

    getClosestTagNode(node, tagNames) {
        let curr = node;
        const activeEditor = this.getActiveEditor();
        while (curr && curr !== document.body && curr !== activeEditor) {
            if (
                curr.nodeType === Node.ELEMENT_NODE &&
                tagNames.includes(curr.tagName.toLowerCase())
            ) {
                return curr;
            }
            curr = curr.parentNode;
        }
        return null;
    },

    trackSelection() {
        const editor = this.getActiveEditor();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (
                editor &&
                (editor.contains(range.commonAncestorContainer) ||
                    editor === range.commonAncestorContainer)
            ) {
                if (!range.collapsed && range.toString().trim().length > 0) {
                    this.lastSelectionRange = range.cloneRange();
                }
            }
        }
        this.updateDynamicToolbar();
    },

    restoreSelection() {
        if (this.lastSelectionRange) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(this.lastSelectionRange);
        }
    },

    updateDynamicToolbar() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const anchorNode = sel.anchorNode;
        const editor = this.getActiveEditor();
        if (!anchorNode || !editor || !editor.contains(anchorNode)) return;

        const isSelectionActive =
            !sel.isCollapsed && sel.toString().trim().length > 0;

        const codeBlockNode = this.getClosestTagNode(anchorNode, [
            "pre",
            "code",
        ]);
        const isInsidePre = this.getClosestTagNode(anchorNode, ["pre"]);

        const tableNode = this.getClosestTagNode(anchorNode, [
            "table",
            "td",
            "th",
            "tr",
        ]);

        const selectionGroup = [
            "Bar-Bold",
            "Bar-Italic",
            "Bar-Hightlight Text",
            "Bar-Strikethrough",
            "Bar-Inline Code",
        ];
        const startLineGroup = [
            "Bar-H1",
            "Bar-H2",
            "Bar-H3",
            "Bar-H4",
            "Bar-Bullet List",
            "Bar-Numbered List",
            "Bar-Indent List Item",
            "Bar-Checklist Item",
        ];
        const middleGroup = ["Bar-Insert Code Block", "Bar-Insert Table"];
        const tableGroup = [
            "Bar-Add Row",
            "Bar-Add Column",
            "Bar-Delete Row",
            "Bar-Delete Column",
        ];

        const setGroupVisibility = (ids, visible) => {
            ids.forEach((id) => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.display = visible ? "" : "none";
                }
            });
        };

        if (codeBlockNode || isInsidePre) {
            setGroupVisibility(selectionGroup, false);
            setGroupVisibility(startLineGroup, false);
            setGroupVisibility(middleGroup, false);
            setGroupVisibility(tableGroup, false);
            return;
        }

        let showSelection = isSelectionActive;
        let showStartLine = false;
        let showMiddle = false;
        let showTable = !!tableNode;

        if (tableNode) {
            showSelection = isSelectionActive;
            showStartLine = false;
            showMiddle = false;
            showTable = true;
        } else if (isSelectionActive) {
            showSelection = true;
            showStartLine = false;
            showMiddle = false;
        } else {
            showSelection = false;
            showStartLine = true;
            showMiddle = true;
        }

        setGroupVisibility(selectionGroup, showSelection);
        setGroupVisibility(startLineGroup, showStartLine);
        setGroupVisibility(middleGroup, showMiddle);
        setGroupVisibility(tableGroup, showTable);
    },

    renderToolbar() {},

    applyHeading(tag) {
        const editor = this.getActiveEditor();
        if (!editor) return;
        editor.focus();
        this.restoreSelection();

        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const anchorNode = sel.anchorNode;
        const currentBlock = anchorNode
            ? this.getClosestTagNode(anchorNode, [
                  "h1",
                  "h2",
                  "h3",
                  "h4",
                  "p",
                  "div",
                  "li",
              ])
            : null;

        const currentTag = currentBlock
            ? currentBlock.tagName.toLowerCase()
            : "";
        const targetTag =
            currentTag === tag.toLowerCase() ? "p" : tag.toLowerCase();

        if (currentBlock && currentBlock !== editor && currentTag !== "li") {
            const newElem = document.createElement(targetTag);
            newElem.className = currentBlock.className;
            newElem.innerHTML = currentBlock.innerHTML || "<br>";
            currentBlock.parentNode.replaceChild(newElem, currentBlock);

            const range = document.createRange();
            range.selectNodeContents(newElem);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            document.execCommand("formatBlock", false, `<${targetTag}>`);
        }
    },

    unwrapFormatting(node, tagNames) {
        const target = this.getClosestTagNode(node, tagNames);
        if (target) {
            const parent = target.parentNode;
            while (target.firstChild) {
                parent.insertBefore(target.firstChild, target);
            }
            parent.removeChild(target);
            parent.normalize();
        }
    },

    applyWYSIWYG(type) {
        const editor = this.getActiveEditor();
        if (!editor) return;
        editor.focus();
        this.restoreSelection();

        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const anchorNode = sel.anchorNode;
        const li = anchorNode
            ? this.getClosestTagNode(anchorNode, ["li"])
            : null;

        switch (type) {
            case "bold": {
                const existing = this.getClosestTagNode(anchorNode, [
                    "strong",
                    "b",
                ]);
                if (existing) {
                    this.unwrapFormatting(anchorNode, ["strong", "b"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const strong = document.createElement("strong");
                    try {
                        strong.appendChild(range.extractContents());
                        range.insertNode(strong);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(strong);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand("bold");
                    }
                } else {
                    document.execCommand("bold");
                }
                break;
            }
            case "highlight": {
                const existing = this.getClosestTagNode(anchorNode, ["mark"]);
                if (existing) {
                    this.unwrapFormatting(anchorNode, ["mark"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const mark = document.createElement("mark");
                    try {
                        mark.appendChild(range.extractContents());
                        range.insertNode(mark);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(mark);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand(
                            "insertHTML",
                            false,
                            `<mark>${range.toString()}</mark>`,
                        );
                    }
                }
                break;
            }
            case "italic": {
                const existing = this.getClosestTagNode(anchorNode, [
                    "em",
                    "i",
                ]);
                if (existing) {
                    this.unwrapFormatting(anchorNode, ["em", "i"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const em = document.createElement("em");
                    try {
                        em.appendChild(range.extractContents());
                        range.insertNode(em);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(em);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand("italic");
                    }
                } else {
                    document.execCommand("italic");
                }
                break;
            }
            case "strike": {
                const existing = this.getClosestTagNode(anchorNode, [
                    "strike",
                    "s",
                    "del",
                ]);
                if (existing) {
                    this.unwrapFormatting(anchorNode, ["strike", "s", "del"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const strike = document.createElement("strike");
                    try {
                        strike.appendChild(range.extractContents());
                        range.insertNode(strike);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(strike);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand("strikeThrough");
                    }
                } else {
                    document.execCommand("strikeThrough");
                }
                break;
            }
            case "ul":
            case "ol":
                if (li) {
                    document.execCommand("indent");
                } else {
                    document.execCommand(
                        type === "ul"
                            ? "insertUnorderedList"
                            : "insertOrderedList",
                    );
                }
                break;
            case "sublist":
                if (li) document.execCommand("indent");
                break;
            case "task":
                document.execCommand(
                    "insertHTML",
                    false,
                    '<ul style="list-style-type:none"><li class="flex items-center gap-2"><input type="checkbox" class="mr-1" /> Task item</li></ul>',
                );
                break;
            case "table":
                document.execCommand(
                    "insertHTML",
                    false,
                    "<table><thead><tr><th>Header 1</th><th>Header 2</th></tr></thead><tbody><tr><td>Cell 1</td><td>Cell 2</td></tr></tbody></table><p><br></p>",
                );
                break;
            case "addRow": {
                const tr = anchorNode
                    ? this.getClosestTagNode(anchorNode, ["tr"])
                    : null;
                if (tr) {
                    const newTr = document.createElement("tr");
                    for (let i = 0; i < tr.children.length; i++) {
                        const newTd = document.createElement("td");
                        newTd.innerHTML = "Cell content";
                        newTr.appendChild(newTd);
                    }
                    tr.parentNode.insertBefore(newTr, tr.nextSibling);
                }
                break;
            }
            case "addCol": {
                const table = anchorNode
                    ? this.getClosestTagNode(anchorNode, ["table"])
                    : null;
                if (table) {
                    table.querySelectorAll("tr").forEach((row, idx) => {
                        const cell = document.createElement(
                            idx === 0 ? "th" : "td",
                        );
                        cell.innerHTML = idx === 0 ? "Header" : "Cell";
                        row.appendChild(cell);
                    });
                }
                break;
            }
            case "delRow": {
                const tr = anchorNode
                    ? this.getClosestTagNode(anchorNode, ["tr"])
                    : null;
                if (tr) tr.remove();
                break;
            }
            case "delCol": {
                const td = anchorNode
                    ? this.getClosestTagNode(anchorNode, ["td", "th"])
                    : null;
                if (td) {
                    const colIdx = Array.from(
                        td.parentElement.children,
                    ).indexOf(td);
                    const table = td.closest("table");
                    if (table && colIdx !== -1) {
                        table
                            .querySelectorAll("tr")
                            .forEach((r) => r.children[colIdx]?.remove());
                    }
                }
                break;
            }
            case "inlineCode": {
                const existing = this.getClosestTagNode(anchorNode, ["code"]);
                if (existing && !this.getClosestTagNode(anchorNode, ["pre"])) {
                    this.unwrapFormatting(anchorNode, ["code"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const code = document.createElement("code");
                    code.className =
                        "bg-gray-800 text-current font-mono px-1 py-0.5 rounded text-sm";
                    try {
                        code.appendChild(range.extractContents());
                        range.insertNode(code);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(code);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand(
                            "insertHTML",
                            false,
                            `<code class="bg-gray-800 text-current font-mono px-1 py-0.5 rounded text-sm">${range.toString()}</code>`,
                        );
                    }
                } else {
                    document.execCommand(
                        "insertHTML",
                        false,
                        '<code class="bg-gray-800 text-current font-mono px-1 py-0.5 rounded text-sm">code</code>',
                    );
                }
                break;
            }
            case "codeBlock":
            case "code": {
                const selectedText = sel.toString() || "// Write code here";
                const wrapperHtml = `
                    <div class="code-block-wrapper my-2 border border-gray-700 rounded overflow-hidden" contenteditable="false">
                        <div class="code-block-header bg-gray-800 text-gray-300 text-xs px-3 py-1.5 flex justify-between items-center select-none border-b border-gray-700">
                            <div class="flex items-center gap-2">
                                <select onchange="MarkdownEditor.changeLanguage(this)" class="bg-gray-900 text-gray-300 border border-gray-700 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-gray-500">
                                    <option value="javascript">javascript</option>
                                    <option value="python">python</option>
                                    <option value="html">html</option>
                                    <option value="css">css</option>
                                    <option value="json">json</option>
                                    <option value="sql">sql</option>
                                    <option value="bash">bash</option>
                                    <option value="markdown">markdown</option>
                                    <option value="plaintext">plaintext</option>
                                </select>
                            </div>
                            <div class="flex gap-2" contenteditable="false">
                                <button type="button" onclick="MarkdownEditor.toggleCodeCollapse(this)" class="hover:text-white p-1 rounded transition-colors" title="Collapse / Expand">
                                    <svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <button type="button" onclick="MarkdownEditor.copyCode(this)" class="hover:text-white p-1 rounded transition-colors" title="Copy Code">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                </button>
                            </div>
                        </div>
                        <pre class="m-0 rounded-none border-0 p-3 bg-gray-900 text-gray-200 font-mono text-sm overflow-x-auto" contenteditable="true"><code class="language-javascript">${selectedText}</code></pre>
                    </div>
                    <p><br></p>
                `;
                document.execCommand("insertHTML", false, wrapperHtml);
                break;
            }
        }
    },

    handleKeyDown(event) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const anchorNode = sel.anchorNode;
        const codeElem = this.getClosestTagNode(anchorNode, ["code", "pre"]);

        if (codeElem && event.ctrlKey && event.key.toLowerCase() === "a") {
            event.preventDefault();
            const targetCode =
                codeElem.tagName.toLowerCase() === "pre"
                    ? codeElem.querySelector("code") || codeElem
                    : codeElem;
            const range = document.createRange();
            range.selectNodeContents(targetCode);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }

        if (codeElem && event.key === "Backspace") {
            const targetCode =
                codeElem.tagName.toLowerCase() === "pre"
                    ? codeElem.querySelector("code") || codeElem
                    : codeElem;
            const textContent = targetCode.textContent || "";
            const isFullSelection =
                !sel.isCollapsed && sel.toString() === textContent;

            if (textContent.trim() === "" || isFullSelection) {
                event.preventDefault();
                const wrapper = codeElem.closest(".code-block-wrapper");
                if (wrapper) {
                    const nextElem = wrapper.nextElementSibling;
                    if (
                        nextElem &&
                        nextElem.tagName === "P" &&
                        nextElem.innerHTML.trim() === "<br>"
                    ) {
                        nextElem.remove();
                    }
                    const prevElem = wrapper.previousElementSibling;
                    wrapper.remove();

                    const editor = this.getActiveEditor();
                    if (editor) {
                        editor.focus();
                        const range = document.createRange();
                        if (prevElem) {
                            range.selectNodeContents(prevElem);
                            range.collapse(false);
                        } else {
                            range.selectNodeContents(editor);
                            range.collapse(true);
                        }
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                }
                return;
            }
        }

        const li = anchorNode
            ? this.getClosestTagNode(anchorNode, ["li"])
            : null;
        const heading = anchorNode
            ? this.getClosestTagNode(anchorNode, ["h1", "h2", "h3", "h4"])
            : null;

        if (event.key === "Tab" && li) {
            event.preventDefault();
            if (event.shiftKey) {
                document.execCommand("outdent");
            } else {
                document.execCommand("indent");
            }
            return;
        }

        if (event.key === "Enter") {
            if (event.target && event.target.id === "systemPromptInput") return;

            if (event.shiftKey && heading) {
                event.preventDefault();
                const newElem = document.createElement("p");
                newElem.innerHTML = "<br>";
                heading.parentNode.insertBefore(newElem, heading.nextSibling);

                const range = document.createRange();
                range.setStart(newElem, 0);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                return;
            }

            if (!event.shiftKey) {
                if (!li) {
                    event.preventDefault();
                    if (typeof sendMessage === "function") {
                        sendMessage();
                    }
                }
                return;
            }
        }

        if (event.key === "Backspace" && li) {
            const range = sel.getRangeAt(0);
            let isAtStart = false;
            if (range.startOffset === 0 && range.endOffset === 0) {
                if (
                    anchorNode === li ||
                    anchorNode === li.firstChild ||
                    anchorNode.previousSibling === null
                ) {
                    isAtStart = true;
                }
            }

            if (isAtStart) {
                event.preventDefault();
                document.execCommand("outdent");
            }
        }
    },

    getEditorMarkdown(editorElement) {
        if (!editorElement) return "";

        function parseList(listNode, depth = 0) {
            let result = "";
            const children = Array.from(listNode.childNodes);

            children.forEach((child) => {
                if (child.nodeType !== Node.ELEMENT_NODE) return;
                const tag = child.tagName.toLowerCase();

                if (tag === "li") {
                    let inlineText = "";
                    let nestedMarkdown = "";

                    Array.from(child.childNodes).forEach((liChild) => {
                        if (
                            liChild.nodeType === Node.ELEMENT_NODE &&
                            (liChild.tagName.toLowerCase() === "ul" ||
                                liChild.tagName.toLowerCase() === "ol")
                        ) {
                            nestedMarkdown += parseList(liChild, depth + 1);
                        } else {
                            inlineText += parseNodeInline(liChild);
                        }
                    });

                    inlineText = inlineText.trim();
                    if (inlineText) {
                        const indent = "    ".repeat(depth);
                        result += `${indent}- ${inlineText}\n`;
                    }
                    if (nestedMarkdown) {
                        result += nestedMarkdown;
                    }
                } else if (tag === "ul" || tag === "ol") {
                    result += parseList(child, depth + 1);
                }
            });

            return result;
        }

        function parseNodeInline(node) {
            if (!node) return "";

            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.replace(
                    /([\\`*_{}\[\]()#+\-.!~=|>])/g,
                    "\\$1",
                );
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();

                if (tag === "code" && !node.closest("pre")) {
                    return `\`${node.textContent}\``;
                }

                let inner = "";
                node.childNodes.forEach((child) => {
                    inner += parseNodeInline(child);
                });

                if (!inner && node.textContent) {
                    return node.textContent.replace(
                        /([\\`*_{}\[\]()#+\-.!~=|>])/g,
                        "\\$1",
                    );
                }

                if (
                    tag === "mark" ||
                    (node.style && node.style.backgroundColor)
                ) {
                    return `==${inner}==`;
                }
                if (tag === "strong" || tag === "b") {
                    return `**${inner}**`;
                }
                if (tag === "em" || tag === "i") {
                    return `*${inner}*`;
                }
                if (tag === "strike" || tag === "s" || tag === "del") {
                    return `~${inner}~`;
                }
                if (tag === "br") {
                    return "\n";
                }

                return inner;
            }

            return "";
        }

        function parseTable(tableNode) {
            let markdownRows = [];
            const rows = tableNode.querySelectorAll("tr");

            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll("th, td");
                let cellTexts = Array.from(cells).map((cell) =>
                    cell.textContent.trim().replace(/\|/g, "\\|"),
                );
                markdownRows.push(`| ${cellTexts.join(" | ")} |`);

                if (rowIndex === 0) {
                    let separators = Array.from(cells).map(() => "---");
                    markdownRows.push(`| ${separators.join(" | ")} |`);
                }
            });

            return markdownRows.join("\n") + "\n\n";
        }

        function parseNode(node) {
            let result = "";
            node.childNodes.forEach((child) => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const escaped = child.textContent.replace(
                        /([\\`*_{}\[\]()#+\-.!~=|>])/g,
                        "\\$1",
                    );
                    const text = escaped.trim();
                    if (text) {
                        result += `${text}\n\n`;
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toLowerCase();

                    if (tag === "table") {
                        result += parseTable(child);
                    } else if (
                        tag === "div" &&
                        child.classList.contains("code-block-wrapper")
                    ) {
                        const codeElem = child.querySelector("code");
                        const selectElem = child.querySelector("select");
                        const lang = selectElem ? selectElem.value : "";
                        const codeText = codeElem
                            ? codeElem.innerText || codeElem.textContent
                            : "";
                        result += `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
                    } else if (tag === "pre") {
                        const codeElem = child.querySelector("code");
                        const codeText = codeElem
                            ? codeElem.innerText || codeElem.textContent
                            : child.innerText || child.textContent;
                        result += `\`\`\`\n${codeText}\n\`\`\`\n\n`;
                    } else if (tag === "ul" || tag === "ol") {
                        result += parseList(child, 0) + "\n";
                    } else if (/^h[1-6]$/.test(tag)) {
                        const level = parseInt(tag[1], 10);
                        const headingText = parseNodeInline(child).trim();
                        result += `${"#".repeat(level)} ${headingText}\n\n`;
                    } else if (tag === "p" || tag === "div") {
                        if (child.querySelector("table")) {
                            child.querySelectorAll("table").forEach((t) => {
                                result += parseTable(t);
                            });
                        } else {
                            const text = parseNodeInline(child).trim();
                            if (text) result += `${text}\n\n`;
                        }
                    } else if (tag === "br") {
                        result += "\n";
                    } else {
                        result += parseNodeInline(child);
                    }
                }
            });
            return result;
        }

        return parseNode(editorElement).trim();
    },

    toggleCodeCollapse(btn) {
        const wrapper = btn.closest(".code-block-wrapper");
        const pre = wrapper ? wrapper.querySelector("pre") : null;
        if (pre) {
            const isHidden = pre.style.display === "none";
            pre.style.display = isHidden ? "block" : "none";
            const icon = btn.querySelector("svg");
            if (icon) {
                icon.style.transform = isHidden
                    ? "rotate(0deg)"
                    : "rotate(-90deg)";
            }
        }
    },

    copyCode(btn) {
        const wrapper = btn.closest(".code-block-wrapper");
        const code = wrapper ? wrapper.querySelector("code") : null;
        if (code) {
            const textToCopy = code.innerText || code.textContent;
            navigator.clipboard.writeText(textToCopy);
            const icon = btn.querySelector("svg");
            if (icon) {
                const originalHTML = icon.innerHTML;
                icon.innerHTML =
                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
                setTimeout(() => {
                    icon.innerHTML = originalHTML;
                }, 1500);
            }
        }
    },

    changeLanguage(selectElem) {
        const codeElem = selectElem
            .closest(".code-block-wrapper")
            .querySelector("code");
        if (codeElem) {
            codeElem.className = `language-${selectElem.value}`;
        }
    },

    parseMarkdownWithMath(text) {
        if (!text) return "";

        let processed = text
            .replace(/(^|[^\\])==([\s\S]*?)==/g, "$1<mark>$2</mark>")
            .replace(/\\==/g, "==");

        const mathBlocks = [];
        const thoughtBlocks = [];

        processed = processed.replace(
            /(?:<(?:think|thought)>|<\|thought\|>)([\s\S]*?)(?:<\/(?:think|thought)>|<\|\/thought\|>)/gi,
            (match, innerContent) => {
                const parsedInner = marked.parse(innerContent.trim());
                const id = `%%THOUGHT_BLOCK_${thoughtBlocks.length}%%`;
                thoughtBlocks.push({ id, content: parsedInner });
                return id;
            },
        );

        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            const id = `%%DISPLAY_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: true });
            return id;
        });

        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
            const id = `%%DISPLAY_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: true });
            return id;
        });

        processed = processed.replace(
            /\$([^\s$](?:[^\$]*?[^\s$])?)\$/g,
            (match, math) => {
                const id = `%%INLINE_MATH_${mathBlocks.length}%%`;
                mathBlocks.push({ id, math, display: false });
                return id;
            },
        );

        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
            const id = `%%INLINE_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: false });
            return id;
        });

        let html = marked.parse(processed);

        thoughtBlocks.forEach((item) => {
            const thoughtHtml = `<details class="my-2 border border-gray-700 rounded overflow-hidden bg-gray-900/50 text-gray-300">
                <summary class="px-3 py-2 text-xs font-mono bg-gray-800 text-gray-400 cursor-pointer select-none hover:text-white transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                    <span>Thought Process</span>
                </summary>
                <div class="p-3 text-sm text-gray-300 border-t border-gray-700/50">
                    ${item.content}
                </div>
            </details>`;
            html = html.replace(new RegExp(item.id, "g"), thoughtHtml);
        });

        mathBlocks.forEach((item) => {
            try {
                const rendered = katex.renderToString(item.math, {
                    displayMode: item.display,
                    throwOnError: false,
                });
                html = html.replace(new RegExp(item.id, "g"), rendered);
            } catch (e) {
                const safeMath = (item.math || "")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
                html = html.replace(
                    new RegExp(item.id, "g"),
                    `<span class="text-red-500">${safeMath}</span>`,
                );
            }
        });

        const doc = new DOMParser().parseFromString(html, "text/html");

        doc.querySelectorAll("table").forEach((table) => {
            const wrapper = doc.createElement("div");
            wrapper.className =
                "my-3 overflow-x-auto border border-gray-700 rounded-lg bg-gray-900";

            table.className =
                "min-w-full divide-y divide-gray-700 text-left text-sm text-white";

            table.querySelectorAll("th").forEach((th) => {
                th.className =
                    "px-4 py-2.5 bg-gray-800 font-semibold text-white uppercase tracking-wider text-xs border-b border-gray-700";
            });

            table.querySelectorAll("td").forEach((td) => {
                td.className =
                    "px-4 py-2.5 whitespace-nowrap text-white border-b border-gray-800";
            });

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        doc.querySelectorAll("pre").forEach((pre) => {
            const wrapper = doc.createElement("div");
            wrapper.className =
                "code-block-wrapper my-2 border border-gray-700 rounded overflow-hidden";

            const header = doc.createElement("div");
            header.className =
                "code-block-header bg-gray-800 text-gray-300 text-xs px-3 py-1.5 flex justify-between items-center select-none border-b border-gray-700";

            header.innerHTML = `
                <span class="font-mono text-gray-400">code</span>
                <div class="flex gap-2">
                    <button type="button" onclick="MarkdownEditor.toggleCodeCollapse(this)" class="hover:text-white p-1 rounded transition-colors" title="Collapse / Expand">
                        <svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <button type="button" onclick="MarkdownEditor.copyCode(this)" class="hover:text-white p-1 rounded transition-colors" title="Copy Code">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    </button>
                </div>
            `;

            pre.classList.add("m-0", "rounded-none", "border-0");
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });

        return doc.body.innerHTML;
    },
};

function applyHeading(tag) {
    MarkdownEditor.applyHeading(tag);
}
function applyWYSIWYG(type) {
    MarkdownEditor.applyWYSIWYG(type);
}
function handleKeyDown(event) {
    MarkdownEditor.handleKeyDown(event);
}
function getEditorMarkdown(el) {
    return MarkdownEditor.getEditorMarkdown(el);
}
function parseMarkdownWithMath(text) {
    return MarkdownEditor.parseMarkdownWithMath(text);
}
function renderToolbar(el) {
    MarkdownEditor.renderToolbar(el);
}

["keyup", "mouseup", "selectionchange", "focusin"].forEach((evt) => {
    document.addEventListener(evt, () => {
        MarkdownEditor.trackSelection();
    });
});

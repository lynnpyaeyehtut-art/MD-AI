const MarkdownEditor = {
    lastSelectionRange: null,

    toolbarButtons: [
        {
            type: 'heading',
            buttons: [
                { id: 'H1', label: 'H1', title: 'Heading 1 (H1)', class: 'px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-extrabold transition', action: "MarkdownEditor.applyHeading('h1')" },
                { id: 'H2', label: 'H2', title: 'Heading 2 (H2)', class: 'px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold transition', action: "MarkdownEditor.applyHeading('h2')" },
                { id: 'H3', label: 'H3', title: 'Heading 3 (H3)', class: 'px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold transition', action: "MarkdownEditor.applyHeading('h3')" },
                { id: 'H4', label: 'H4', title: 'Heading 4 (H4)', class: 'px-1.5 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-medium transition', action: "MarkdownEditor.applyHeading('h4')" },
            ]
        },
        {
            type: 'button',
            id: 'Bold',
            title: 'Bold',
            icon: 'fa-solid fa-bold',
            action: "MarkdownEditor.applyWYSIWYG('bold')"
        },
        {
            type: 'button',
            id: 'Italic',
            title: 'Italic',
            icon: 'fa-solid fa-italic',
            action: "MarkdownEditor.applyWYSIWYG('italic')"
        },
        {
            type: 'button',
            id: 'Hightlight Text',
            title: 'Highlight Text',
            icon: 'fa-solid fa-highlighter',
            action: "MarkdownEditor.applyWYSIWYG('highlight')",
            class: 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition text-slate-800 dark:text-slate-100 hover:text-black dark:hover:text-white'
        },
        {
            type: 'button',
            id: 'Strikethrough',
            title: 'Strikethrough',
            icon: 'fa-solid fa-strikethrough',
            action: "MarkdownEditor.applyWYSIWYG('strike')"
        },
        {
            type: 'button',
            id: 'Bullet List',
            title: 'Bullet List',
            icon: 'fa-solid fa-list-ul',
            action: "MarkdownEditor.applyWYSIWYG('ul')"
        },
        {
            type: 'button',
            id: 'Numbered List',
            title: 'Numbered List',
            icon: 'fa-solid fa-list-ol',
            action: "MarkdownEditor.applyWYSIWYG('ol')"
        },
        {
            type: 'button',
            id: 'Indent List Item',
            title: 'Indent List Item',
            icon: 'fa-solid fa-indent',
            action: "MarkdownEditor.applyWYSIWYG('sublist')"
        },
        {
            type: 'button',
            id: 'Checklist Item',
            title: 'Checklist Item',
            icon: 'fa-regular fa-square-check',
            action: "MarkdownEditor.applyWYSIWYG('task')"
        },
        {
            type: 'button',
            id: 'Insert Table',
            title: 'Insert Table',
            icon: 'fa-solid fa-table',
            action: "MarkdownEditor.applyWYSIWYG('table')"
        },
        {
            type: 'button',
            id: 'Add Row',
            title: 'Add Row',
            html: '<i class="fa-solid fa-plus text-[9px]"></i><i class="fa-solid fa-grip-lines"></i>',
            class: 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition flex items-center gap-0.5',
            action: "MarkdownEditor.applyWYSIWYG('addRow')"
        },
        {
            type: 'button',
            id: 'Add Column',
            title: 'Add Column',
            html: '<i class="fa-solid fa-plus text-[9px]"></i><i class="fa-solid fa-grip-lines-vertical"></i>',
            class: 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition flex items-center gap-0.5',
            action: "MarkdownEditor.applyWYSIWYG('addCol')"
        },
        {
            type: 'button',
            id: 'Delete Row',
            title: 'Delete Row',
            html: '<i class="fa-solid fa-minus text-[9px]"></i><i class="fa-solid fa-grip-lines"></i>',
            class: 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition flex items-center gap-0.5 text-red-500 hover:text-red-600',
            action: "MarkdownEditor.applyWYSIWYG('delRow')"
        },
        {
            type: 'button',
            id: 'Delete Column',
            title: 'Delete Column',
            html: '<i class="fa-solid fa-minus text-[9px]"></i><i class="fa-solid fa-grip-lines-vertical"></i>',
            class: 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition flex items-center gap-0.5 text-red-500 hover:text-red-600',
            action: "MarkdownEditor.applyWYSIWYG('delCol')"
        },
        {
            type: 'button',
            id: 'Insert Code Block',
            title: 'Insert Code Block',
            icon: 'fa-solid fa-code',
            action: "MarkdownEditor.applyWYSIWYG('code')"
        },
        {
            type: 'button',
            id: 'Inline Code',
            title: 'Inline Code',
            icon: 'fa-solid fa-terminal',
            action: "MarkdownEditor.applyWYSIWYG('inlineCode')"
        },
        {
            type: 'button',
            id: 'Subscript',
            title: 'Subscript',
            icon: 'fa-solid fa-subscript',
            action: "MarkdownEditor.applyWYSIWYG('sub')"
        },
        {
            type: 'button',
            id: 'Superscript',
            title: 'Superscript',
            icon: 'fa-solid fa-superscript',
            action: "MarkdownEditor.applyWYSIWYG('sup')"
        },
        {
            type: 'button',
            id: 'Blockquote',
            title: 'Blockquote',
            icon: 'fa-solid fa-quote-right text-[10px]',
            action: "MarkdownEditor.applyWYSIWYG('blockquote')"
        },
        {
            type: 'button',
            id: 'Divider',
            title: 'Horizontal Divider (---)',
            icon: 'fa-solid fa-grip-lines',
            action: "MarkdownEditor.applyWYSIWYG('divider')"
        },
        {
            type: 'button',
            id: 'FormatSwitch',
            title: 'Toggle Formatted / Unformatted Markdown',
            icon: 'fa-solid fa-eye',
            action: ''
        }
    ],

    renderToolbarHtml(prefix = "") {
        let html = '';
        this.toolbarButtons.forEach(item => {
            if (item.type === 'heading') {
                html += '<div class="flex items-center gap-0.5">';
                item.buttons.forEach(b => {
                    const btnId = prefix + 'Bar-' + b.id;
                    html += `<button onmousedown="event.preventDefault()" onclick="${b.action}" class="${b.class}" title="${b.title}" id="${btnId}">${b.label}</button>`;
                });
                html += '</div>';
            } else {
                const btnId = prefix + 'Bar-' + item.id;
                const cls = item.class || 'p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs transition';
                const inner = item.icon ? `<i class="${item.icon}"></i>` : item.html;
                let action = item.action;
                if (item.id === 'FormatSwitch') {
                    action = `MarkdownEditor.toggleFormatSwitch(this, '${prefix}')`;
                }
                html += `<button onmousedown="event.preventDefault()" onclick="${action}" class="${cls}" title="${item.title}" id="${btnId}">${inner}</button>`;
            }
        });
        return html;
    },

    getActiveEditor() {
        const active = document.activeElement;
        if (active) {
            if (active.id === "systemPromptInput" || active.closest("#systemPromptInput")) {
                return document.getElementById("systemPromptInput");
            }
            if (active.classList && active.classList.contains("persona-prompt-editor") || active.closest(".persona-prompt-editor")) {
                return active.classList.contains("persona-prompt-editor") ? active : active.closest(".persona-prompt-editor");
            }
            if (active.id === "userInput" || active.closest("#userInput")) {
                return document.getElementById("userInput");
            }
            if (active.id === "newSkillContent" || active.closest("#newSkillContent")) {
                return document.getElementById("newSkillContent");
            }
        }
        // Fallback to whichever one was last focused or visible
        const modal = document.getElementById("settingsModal");
        if (modal && !modal.classList.contains("hidden")) {
            const sysInput = document.getElementById("systemPromptInput");
            const skillInput = document.getElementById("newSkillContent");
            const activePersonaInput = modal.querySelector(".persona-prompt-editor:focus, .persona-prompt-editor");
            if (activePersonaInput && (active === activePersonaInput || activePersonaInput.contains(active))) return activePersonaInput;
            if (sysInput && (active === sysInput || sysInput.contains(active))) return sysInput;
            if (skillInput && (active === skillInput || skillInput.contains(active))) return skillInput;
            if (activePersonaInput) return activePersonaInput;
            if (sysInput && (!userInputHasFocus())) return sysInput;
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
        let valid = false;
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (
                editor &&
                (editor.contains(range.commonAncestorContainer) ||
                    editor === range.commonAncestorContainer) &&
                !range.collapsed &&
                range.toString().trim().length > 0
            ) {
                this.lastSelectionRange = range.cloneRange();
                valid = true;
            }
        }
        if (!valid) this.lastSelectionRange = null;
        this.updateDynamicToolbar();
    },

    restoreSelection() {
        const editor = this.getActiveEditor();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const liveInEditor =
                editor &&
                (editor.contains(range.commonAncestorContainer) ||
                    editor === range.commonAncestorContainer);
            if (liveInEditor) return;
        }
        if (this.lastSelectionRange) {
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

        // Fix: explicitly check closest table container from node or its parent element
        const targetEl =
            anchorNode.nodeType === Node.TEXT_NODE
                ? anchorNode.parentNode
                : anchorNode;
        const tableNode = targetEl.closest
            ? targetEl.closest("table, td, th, tr")
            : this.getClosestTagNode(anchorNode, ["table", "td", "th", "tr"]);

        const isSelectionActive =
            !sel.isCollapsed && sel.toString().trim().length > 0;
        const codeBlockNode = this.getClosestTagNode(anchorNode, [
            "pre",
            "code",
        ]);
        const isInsidePre = this.getClosestTagNode(anchorNode, ["pre"]);

        const selectionGroup = [
            "Bar-Bold",
            "Bar-Italic",
            "Bar-Hightlight Text",
            "Bar-Strikethrough",
            "Bar-Inline Code",
            "Bar-Subscript",
            "Bar-Superscript",
            "Bar-Blockquote",
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
        const middleGroup = ["Bar-Insert Code Block", "Bar-Insert Table", "Bar-Divider"];
        const tableGroup = [
            "Bar-Add Row",
            "Bar-Add Column",
            "Bar-Delete Row",
            "Bar-Delete Column",
        ];

        const setGroupVisibility = (ids, visible) => {
            const prefixes = ["", "Sys-", "Skill-", "Persona-"];
            ids.forEach((id) => {
                prefixes.forEach((pfx) => {
                    const el = document.getElementById(pfx + id);
                    if (el) el.style.display = visible ? "" : "none";
                });
            });
        };

        if (editor && editor.dataset.unformatted === "true") {
            setGroupVisibility(selectionGroup, false);
            setGroupVisibility(startLineGroup, false);
            setGroupVisibility(middleGroup, false);
            setGroupVisibility(tableGroup, false);
            return;
        }

        if (codeBlockNode || isInsidePre) {
            setGroupVisibility(selectionGroup, false);
            setGroupVisibility(startLineGroup, false);
            setGroupVisibility(middleGroup, false);
            setGroupVisibility(tableGroup, false);
            return;
        }

        let showTable = !!tableNode;
        let showSelection = isSelectionActive;
        let showStartLine = !showTable && !isSelectionActive;
        let showMiddle = !showTable && !isSelectionActive;

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

            const sel = window.getSelection();
            if (sel) {
                const range = document.createRange();
                range.selectNodeContents(parent);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    },

    rangeIsFullyFormatted(range, tagNames) {
        const common = range.commonAncestorContainer;
        const root =
            common.nodeType === Node.TEXT_NODE ? common.parentNode : common;
        if (!root) return false;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        let node;
        let found = false;
        while ((node = walker.nextNode())) {
            if (!node.textContent) continue;
            if (!range.intersectsNode(node)) continue;
            found = true;
            if (!this.getClosestTagNode(node, tagNames)) return false;
        }
        return found;
    },

    unwrapElement(el) {
        const parent = el.parentNode;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
        parent.normalize();
    },

    splitFormattingAtPoint(container, offset, tagNames) {
        const fmt = this.getClosestTagNode(container, tagNames);
        if (!fmt) return null;
        if (container === fmt && offset === fmt.childNodes.length) return null;

        const tail = document.createRange();
        try {
            tail.setStart(container, offset);
            tail.setEnd(fmt, fmt.childNodes.length);
        } catch (e) {
            return null;
        }
        if (tail.collapsed) return null;

        const frag = tail.extractContents();
        if (!frag.hasChildNodes()) return null;

        const clone = fmt.cloneNode(false);
        clone.appendChild(frag);
        fmt.parentNode.insertBefore(clone, fmt.nextSibling);

        const boundary = document.createRange();
        boundary.setStartAfter(fmt);
        boundary.collapse(true);
        return boundary;
    },

    wrapRangeWithFormat(range, tagNames, createElementFn) {
        const contents = range.extractContents();
        tagNames.forEach((tagName) => {
            contents.querySelectorAll(tagName).forEach((el) => {
                const parent = el.parentNode;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
            });
        });

        const elem = createElementFn();
        elem.appendChild(contents);
        range.insertNode(elem);

        const newRange = document.createRange();
        newRange.selectNodeContents(elem);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(newRange);
    },

    removeFormattingFromRange(range, tagNames) {
        const editor = this.getActiveEditor();
        const contents = range.extractContents();
        tagNames.forEach((tagName) => {
            contents.querySelectorAll(tagName).forEach((el) => {
                const parent = el.parentNode;
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
            });
        });

        const inserted = Array.from(contents.childNodes);

        let insertRange = range;
        const fmt = this.getClosestTagNode(range.startContainer, tagNames);
        if (fmt) {
            if (fmt.textContent === "" ) {
                const parent = fmt.parentNode;
                const ref = fmt.nextSibling;
                parent.removeChild(fmt);
                insertRange = document.createRange();
                if (ref) {
                    insertRange.setStartBefore(ref);
                } else {
                    insertRange.selectNodeContents(parent);
                    insertRange.collapse(false);
                }
                insertRange.collapse(true);
            } else {
                insertRange =
                    this.splitFormattingAtPoint(
                        range.startContainer,
                        range.startOffset,
                        tagNames,
                    ) || range;
            }
        }

        insertRange.insertNode(contents);

        if (editor) {
            editor.querySelectorAll(tagNames.join(",")).forEach((el) => {
                if (!el.textContent && !el.querySelector("img")) el.remove();
            });
        }

        if (inserted.length) {
            const newRange = document.createRange();
            newRange.setStartBefore(inserted[0]);
            newRange.setEndAfter(inserted[inserted.length - 1]);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(newRange);
        }
    },

    toggleFormatting(tagNames, createElementFn) {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;

        if (sel.isCollapsed) {
            const existing = this.getClosestTagNode(sel.anchorNode, tagNames);
            if (existing) this.unwrapFormatting(sel.anchorNode, tagNames);
            return;
        }

        const range = sel.getRangeAt(0);
        const startFmt = this.getClosestTagNode(range.startContainer, tagNames);
        const endFmt = this.getClosestTagNode(range.endContainer, tagNames);
        const fullyFormatted =
            !!startFmt &&
            !!endFmt &&
            this.rangeIsFullyFormatted(range, tagNames);

        if (fullyFormatted) {
            this.removeFormattingFromRange(range, tagNames);
        } else {
            this.wrapRangeWithFormat(range, tagNames, createElementFn);
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
                document.execCommand("bold");
                break;
            }
            case "highlight": {
                this.toggleFormatting(["mark"], () => document.createElement("mark"));
                break;
            }
            case "italic": {
                document.execCommand("italic");
                break;
            }
            case "sub": {
                document.execCommand("subscript");
                break;
            }
            case "sup": {
                document.execCommand("superscript");
                break;
            }
            case "strike": {
                document.execCommand("strikeThrough");
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
            case "task": {
                if (li) {
                    if (li.classList.contains("task-list-item")) {
                        this.removeTaskItem(li);
                    } else {
                        this.makeTaskItem(li);
                    }
                } else {
                    document.execCommand("insertUnorderedList");
                    let newLi = this.getClosestTagNode(
                        window.getSelection().anchorNode,
                        ["li"],
                    );
                    if (!newLi) {
                        const liveRange = window.getSelection().rangeCount
                            ? window.getSelection().getRangeAt(0)
                            : null;
                        if (liveRange) {
                            newLi = this.getClosestTagNode(
                                liveRange.commonAncestorContainer,
                                ["li"],
                            );
                        }
                    }
                    if (!newLi) {
                        const editor = this.getActiveEditor();
                        if (editor) {
                            const emptyLis = Array.from(
                                editor.querySelectorAll("li"),
                            ).filter((item) => !item.textContent.trim());
                            newLi = emptyLis[emptyLis.length - 1] || null;
                        }
                    }
                    if (newLi) this.makeTaskItem(newLi);
                }
                break;
            }
            case "table": {
                const editor = this.getActiveEditor();
                if (!editor) return;
                editor.focus();

                const sel = window.getSelection();
                let range;

                if (
                    sel &&
                    sel.rangeCount > 0 &&
                    editor.contains(sel.anchorNode)
                ) {
                    range = sel.getRangeAt(0);
                } else {
                    range = document.createRange();
                    range.selectNodeContents(editor);
                    range.collapse(false);
                }

                const tableHtml =
                    '<table class="border-collapse border border-gray-700 my-2"><thead><tr><th class="border border-gray-700 p-2">Header 1</th><th class="border border-gray-700 p-2">Header 2</th></tr></thead><tbody><tr><td class="border border-gray-700 p-2">Cell 1</td><td class="border border-gray-700 p-2">Cell 2</td></tr></tbody></table>';

                const div = document.createElement("div");
                div.innerHTML = tableHtml;
                const tableElem = div.firstElementChild;

                const trailingP = document.createElement("p");
                trailingP.innerHTML = "<br>";

                range.deleteContents();
                let blockContainer = this.getClosestTagNode(
                    range.startContainer,
                    ["p", "div", "h1", "h2", "h3", "h4", "li"],
                );

                if (blockContainer && blockContainer !== editor) {
                    blockContainer.parentNode.insertBefore(
                        tableElem,
                        blockContainer.nextSibling,
                    );
                    tableElem.parentNode.insertBefore(
                        trailingP,
                        tableElem.nextSibling,
                    );
                } else {
                    editor.appendChild(tableElem);
                    editor.appendChild(trailingP);
                }

                const firstTd = tableElem.querySelector("td, th");
                if (firstTd) {
                    const newRange = document.createRange();
                    newRange.setStart(firstTd, 0);
                    newRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                }
                break;
            }
            case "addRow": {
                const cell =
                    this.getClosestTagNode(anchorNode, ["td", "th"]) ||
                    (anchorNode.nodeType === 1
                        ? anchorNode.querySelector("td, th")
                        : null);
                const tr = cell ? cell.closest("tr") : null;
                if (tr) {
                    const newTr = document.createElement("tr");
                    const cellCount = tr.children.length;
                    for (let i = 0; i < cellCount; i++) {
                        const newTd = document.createElement("td");
                        newTd.className =
                            "px-4 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800";
                        newTd.innerHTML = "Cell";
                        newTr.appendChild(newTd);
                    }
                    tr.parentNode.insertBefore(newTr, tr.nextSibling);
                }
                break;
            }
            case "addCol": {
                const cell =
                    this.getClosestTagNode(anchorNode, ["td", "th"]) ||
                    (anchorNode.nodeType === 1
                        ? anchorNode.querySelector("td, th")
                        : null);
                const table = cell
                    ? cell.closest("table")
                    : document.querySelector("table");
                if (table) {
                    table.querySelectorAll("tr").forEach((row) => {
                        const isHeader =
                            row.querySelector("th") !== null &&
                            row.querySelectorAll("th").length ===
                                row.children.length;
                        const newCell = document.createElement(
                            isHeader ? "th" : "td",
                        );
                        if (isHeader) {
                            newCell.className =
                                "px-4 py-2.5 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700";
                            newCell.innerHTML = "Header";
                        } else {
                            newCell.className =
                                "px-4 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800";
                            newCell.innerHTML = "Cell";
                        }
                        row.appendChild(newCell);
                    });
                }
                break;
            }
            case "delRow": {
                const cell =
                    this.getClosestTagNode(anchorNode, ["td", "th"]) ||
                    (anchorNode.nodeType === 1
                        ? anchorNode.querySelector("td, th")
                        : null);
                const tr = cell ? cell.closest("tr") : null;
                if (tr) {
                    const table = tr.closest("table");
                    if (table && table.querySelectorAll("tr").length > 1) {
                        tr.remove();
                    }
                }
                break;
            }
            case "delCol": {
                const cell =
                    this.getClosestTagNode(anchorNode, ["td", "th"]) ||
                    (anchorNode.nodeType === 1
                        ? anchorNode.querySelector("td, th")
                        : null);
                if (cell) {
                    const row = cell.parentElement;
                    const colIdx = Array.from(row.children).indexOf(cell);
                    const table = cell.closest("table");
                    if (table && colIdx !== -1) {
                        const allRows = table.querySelectorAll("tr");
                        if (allRows[0] && allRows[0].children.length > 1) {
                            allRows.forEach((r) => {
                                if (r.children[colIdx]) {
                                    r.children[colIdx].remove();
                                }
                            });
                        }
                    }
                }
                break;
            }
            case "inlineCode": {
                const preNode = this.getClosestTagNode(anchorNode, ["pre"]);
                if (!preNode) {
                    this.toggleFormatting(["code"], () => {
                        const code = document.createElement("code");
                        code.className = "bg-gray-800 text-current font-mono px-1 py-0.5 rounded text-sm";
                        return code;
                    });
                }
                break;
            }
            case "blockquote": {
                const existing = this.getClosestTagNode(anchorNode, ["blockquote"]);
                if (existing) {
                    this.unwrapFormatting(anchorNode, ["blockquote"]);
                } else if (!sel.isCollapsed) {
                    const range = sel.getRangeAt(0);
                    const bq = document.createElement("blockquote");
                    bq.className = "border-l-4 border-slate-300 dark:border-slate-600 pl-3 my-2 text-slate-600 dark:text-slate-400 italic";
                    try {
                        bq.appendChild(range.extractContents());
                        range.insertNode(bq);
                        const newRange = document.createRange();
                        newRange.selectNodeContents(bq);
                        sel.removeAllRanges();
                        sel.addRange(newRange);
                    } catch (e) {
                        document.execCommand("formatBlock", false, "blockquote");
                    }
                } else {
                    document.execCommand("formatBlock", false, "blockquote");
                }
                break;
            }
            case "divider": {
                const editor = this.getActiveEditor();
                if (!editor) return;
                editor.focus();

                const sel = window.getSelection();
                let range;

                if (
                    sel &&
                    sel.rangeCount > 0 &&
                    editor.contains(sel.anchorNode)
                ) {
                    range = sel.getRangeAt(0);
                } else {
                    range = document.createRange();
                    range.selectNodeContents(editor);
                    range.collapse(false);
                }

                const hrElem = document.createElement("hr");
                hrElem.className = "my-4 border-slate-300 dark:border-slate-700";

                const trailingP = document.createElement("p");
                trailingP.innerHTML = "<br>";

                range.deleteContents();
                let blockContainer = this.getClosestTagNode(
                    range.startContainer,
                    ["p", "div", "h1", "h2", "h3", "h4", "li"],
                );

                if (blockContainer && blockContainer !== editor) {
                    blockContainer.parentNode.insertBefore(
                        hrElem,
                        blockContainer.nextSibling,
                    );
                    hrElem.parentNode.insertBefore(
                        trailingP,
                        hrElem.nextSibling,
                    );
                } else {
                    editor.appendChild(hrElem);
                    editor.appendChild(trailingP);
                }

                const newRange = document.createRange();
                newRange.setStart(trailingP, 0);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
                break;
            }
            case "codeBlock":
            case "code": {
                const selectedText = sel.toString() || "// Write code here";

                const selRange = sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
                const targetNode = anchorNode || (selRange ? selRange.startContainer : null);

                let currentBlock = targetNode
                    ? this.getClosestTagNode(targetNode, [
                          "p",
                          "div",
                          "h1",
                          "h2",
                          "h3",
                          "h4",
                          "li",
                      ])
                    : null;

                if (!currentBlock && selRange && (targetNode === editor || editor.contains(targetNode))) {
                    const childNodes = Array.from(editor.childNodes);
                    currentBlock =
                        childNodes[selRange.startOffset] ||
                        (selRange.startContainer.nodeType === Node.ELEMENT_NODE
                            ? selRange.startContainer.children[selRange.startOffset]
                            : null);
                }

                const wrapper = document.createElement("div");
                wrapper.className =
                    "code-block-wrapper my-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm";
                wrapper.setAttribute("contenteditable", "false");

                wrapper.innerHTML = `
                                    <div class="code-block-header bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 flex justify-between items-center select-none border-b border-gray-200 dark:border-gray-700">
                                        <div class="flex items-center gap-2">
                                            <select onchange="MarkdownEditor.changeLanguage(this)" class="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-gray-500">
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
                                        <div class="flex gap-2">
                                            <button type="button" onclick="MarkdownEditor.toggleCodeCollapse(this)" class="hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors" title="Collapse / Expand">
                                                <svg width="16" height="16" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </button>
                                            <button type="button" onclick="MarkdownEditor.copyCode(this)" class="hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors" title="Copy Code">
                                                <svg width="16" height="16" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2/2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                    <pre class="m-0 rounded-none border-0 p-3 bg-transparent text-gray-800 dark:text-gray-200 font-mono text-sm overflow-x-auto" contenteditable="true"><code class="language-javascript bg-transparent p-0 text-current"></code></pre>`;
                const codeNode = wrapper.querySelector("code");
                codeNode.textContent = selectedText;

                const trailingParagraph = document.createElement("p");
                trailingParagraph.innerHTML = "<br>";

                if (currentBlock && currentBlock !== editor) {
                    currentBlock.parentNode.insertBefore(
                        wrapper,
                        currentBlock.nextSibling,
                    );
                    currentBlock.parentNode.insertBefore(
                        trailingParagraph,
                        wrapper.nextSibling,
                    );

                    if (
                        !currentBlock.textContent.trim() ||
                        currentBlock.innerHTML === "<br>"
                    ) {
                        currentBlock.remove();
                    }
                } else {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(wrapper);
                    wrapper.parentNode.insertBefore(
                        trailingParagraph,
                        wrapper.nextSibling,
                    );
                }

                const newRange = document.createRange();
                newRange.selectNodeContents(codeNode);
                newRange.collapse(false);
                sel.removeAllRanges();
                sel.addRange(newRange);
                break;
            }
        }
    },

    handlePaste(event) {
        const items = (event.clipboardData || event.originalEvent.clipboardData)
            .items;
        let imageFile = null;

        for (const item of items) {
            if (item.type.indexOf("image") === 0) {
                imageFile = item.getAsFile();
                break;
            }
        }

        if (imageFile) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result;
                const editor = this.getActiveEditor();
                if (!editor) return;

                editor.focus();
                const sel = window.getSelection();
                if (!sel || !sel.rangeCount) return;

                const range = sel.getRangeAt(0);
                range.deleteContents();

                const img = document.createElement("img");
                img.src = base64Data;
                img.className =
                    "max-w-full h-auto my-2 rounded border border-gray-700";

                const p = document.createElement("p");
                p.appendChild(img);

                range.insertNode(p);

                const newRange = document.createRange();
                newRange.setStartAfter(p);
                newRange.collapse(true);
                sel.removeAllRanges();
                sel.addRange(newRange);
            };
            reader.readAsDataURL(imageFile);
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
                } else {
                    const parent = codeElem.parentNode;
                    const textNode = document.createTextNode("");
                    parent.insertBefore(textNode, codeElem);
                    codeElem.remove();

                    const range = document.createRange();
                    range.setStart(textNode, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
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
            const isSystemPrompt =
                event.target && (event.target.id === "systemPromptInput" || event.target.closest("#systemPromptInput"));

            // Ctrl + Enter: Send message
            if (event.ctrlKey) {
                if (!isSystemPrompt) {
                    event.preventDefault();
                    if (typeof sendMessage === "function") {
                        sendMessage();
                    }
                    return;
                }
            }

            // Shift + Enter inside headings: Break out into a new paragraph
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

            // Enter inside a checklist item: create the next checklist item,
            // or leave the list when the current item is empty.
            if (
                !event.shiftKey &&
                li &&
                (li.classList.contains("task-list-item") ||
                    !!li.querySelector(':scope > input[type="checkbox"]'))
            ) {
                const range = sel.getRangeAt(0);
                event.preventDefault();
                if (!range.collapsed) {
                    range.deleteContents();
                    range.collapse(true);
                }
                const text = li.textContent.replace(/\u200b/g, "").trim();
                if (!text) {
                    this.exitTaskItem(li);
                } else {
                    this.splitTaskItem(li, range);
                }
                return;
            }

            // Regular Enter or Shift + Enter: Allow default contenteditable line-break behavior
        }

        if (
            event.key === "Backspace" &&
            li &&
            (li.classList.contains("task-list-item") ||
                !!li.querySelector(':scope > input[type="checkbox"]'))
        ) {
            const range = sel.getRangeAt(0);
            const checkbox = li.querySelector(':scope > input[type="checkbox"]');
            if (checkbox && range.collapsed) {
                let atTaskStart = false;
                if (range.startContainer === li) {
                    atTaskStart = range.startOffset <= 2;
                } else if (
                    range.startContainer.nodeType === Node.TEXT_NODE &&
                    range.startOffset === 0
                ) {
                    let prev = range.startContainer.previousSibling;
                    while (
                        prev &&
                        prev.nodeType === Node.TEXT_NODE &&
                        prev.textContent.trim() === ""
                    ) {
                        prev = prev.previousSibling;
                    }
                    atTaskStart = prev === checkbox;
                }

                if (atTaskStart) {
                    event.preventDefault();
                    const text = li.textContent.replace(/\u200b/g, "").trim();
                    if (!text) {
                        this.exitTaskItem(li);
                    } else {
                        this.removeTaskItem(li);
                    }
                    return;
                }
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

    makeTaskItem(li) {
        if (!li) return;

        const list = li.parentNode;
        if (list && (list.tagName === "UL" || list.tagName === "OL")) {
            list.classList.add("task-list");
        }

        li.classList.add("task-list-item");

        let checkbox = li.querySelector(':scope > input[type="checkbox"]');
        let spaceNode = null;
        if (!checkbox) {
            checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            spaceNode = document.createTextNode(" ");
            li.insertBefore(checkbox, li.firstChild);
            li.insertBefore(spaceNode, checkbox.nextSibling);
        } else {
            spaceNode = checkbox.nextSibling;
        }

        const hasContent = Array.from(li.childNodes).some((node) => {
            if (node === checkbox || node === spaceNode) return false;
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent.trim() !== "";
            }
            return node.tagName !== "BR";
        });

        if (!hasContent) {
            li.querySelectorAll(":scope > br").forEach((br) => br.remove());
        }

        const sel = window.getSelection();
        if (!sel) return;
        const range = document.createRange();
        if (!hasContent && spaceNode && spaceNode.nodeType === Node.TEXT_NODE) {
            range.setStart(spaceNode, spaceNode.textContent.length);
            range.collapse(true);
        } else {
            range.selectNodeContents(li);
            range.collapse(false);
        }
        sel.removeAllRanges();
        sel.addRange(range);
    },

    syncTaskListClass(li) {
        const list = li ? li.parentNode : null;
        if (!list || (list.tagName !== "UL" && list.tagName !== "OL")) return;
        const hasTasks = Array.from(list.children).some(
            (child) =>
                child.tagName === "LI" &&
                child.classList.contains("task-list-item"),
        );
        list.classList.toggle("task-list", hasTasks);
    },

    removeTaskItem(li) {
        if (!li) return;

        const checkbox = li.querySelector(':scope > input[type="checkbox"]');
        if (checkbox) {
            if (
                checkbox.nextSibling &&
                checkbox.nextSibling.nodeType === Node.TEXT_NODE &&
                checkbox.nextSibling.textContent.trim() === ""
            ) {
                checkbox.nextSibling.remove();
            }
            checkbox.remove();
        }

        li.classList.remove("task-list-item");
        this.syncTaskListClass(li);
        if (!li.textContent.trim() && !li.querySelector("ul, ol")) {
            li.innerHTML = "<br>";
        }

        const sel = window.getSelection();
        if (!sel) return;
        const range = document.createRange();
        range.selectNodeContents(li);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    },

    splitTaskItem(li, range) {
        const sel = window.getSelection();
        if (!sel) return;

        const tailRange = document.createRange();
        tailRange.selectNodeContents(li);
        tailRange.setStart(range.startContainer, range.startOffset);
        const fragment = tailRange.extractContents();

        const newLi = document.createElement("li");
        newLi.className = "task-list-item";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        newLi.appendChild(checkbox);
        newLi.appendChild(document.createTextNode(" "));
        newLi.appendChild(fragment);

        li.parentNode.insertBefore(newLi, li.nextSibling);

        const newRange = document.createRange();
        newRange.setStart(newLi, Math.min(2, newLi.childNodes.length));
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
    },

    exitTaskItem(li) {
        const checkbox = li.querySelector(':scope > input[type="checkbox"]');
        if (checkbox) {
            if (
                checkbox.nextSibling &&
                checkbox.nextSibling.nodeType === Node.TEXT_NODE &&
                checkbox.nextSibling.textContent.trim() === ""
            ) {
                checkbox.nextSibling.remove();
            }
            checkbox.remove();
        }
        li.classList.remove("task-list-item");
        this.syncTaskListClass(li);
        if (!li.textContent.trim() && !li.querySelector("ul, ol")) {
            li.innerHTML = "<br>";
        }

        const sel = window.getSelection();
        if (!sel) return;

        let currentLi = this.getClosestTagNode(sel.anchorNode, ["li"]);
        let guard = 0;
        while (currentLi && guard < 20) {
            document.execCommand("outdent");
            currentLi = this.getClosestTagNode(
                window.getSelection().anchorNode,
                ["li"],
            );
            guard++;
        }
    },

    makeEditorCheckboxesEditable(editorEl) {
        if (!editorEl) return;
        editorEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            cb.removeAttribute("disabled");
            const li = cb.closest("li");
            if (li) {
                li.classList.add("task-list-item");
                const list = li.parentNode;
                if (list && (list.tagName === "UL" || list.tagName === "OL")) {
                    list.classList.add("task-list");
                }
            }
        });
    },

    cleanupEmptyInlineFormats() {
        const editor = this.getActiveEditor();
        if (!editor) return;

        const inlineTags = [
            "mark",
            "strong",
            "b",
            "i",
            "em",
            "sub",
            "sup",
            "s",
            "strike",
            "del",
            "code",
        ];

        editor.querySelectorAll(inlineTags.join(",")).forEach((el) => {
            if (el.closest("pre") || el.closest(".code-block-wrapper")) return;
            if (el.querySelector("img")) return;
            if (el.textContent.trim() !== "") return;

            const parent = el.parentNode;
            if (!parent) return;

            while (el.firstChild) {
                parent.insertBefore(el.firstChild, el);
            }
            parent.removeChild(el);

            if (
                parent.nodeType === Node.ELEMENT_NODE &&
                parent !== editor &&
                !parent.firstChild
            ) {
                parent.appendChild(document.createElement("br"));
            }
            parent.normalize();
        });
    },

    toggleFormatSwitch(btn, prefix) {
        let editor = null;
        if (!prefix || prefix === "") {
            editor = document.getElementById("userInput");
        } else if (prefix === "Sys-") {
            editor = document.getElementById("systemPromptInput");
        } else if (prefix === "Skill-") {
            editor = document.getElementById("newSkillContent");
        } else if (prefix.startsWith("Persona_")) {
            const personaId = prefix.replace(/^Persona_/, "").replace(/_$/, "");
            const card = document.querySelector(`.persona-card[data-persona-id="${personaId}"]`);
            if (card) {
                editor = card.querySelector(".persona-prompt-editor");
            }
        }
        if (!editor) {
            editor = this.getActiveEditor();
        }
        if (!editor) return;

        const isUnformatted = editor.dataset.unformatted === "true";
        const barContainer = btn.closest(".flex");

        if (!isUnformatted) {
            const markdownText = this.getEditorMarkdown(editor);
            editor.textContent = markdownText;
            editor.dataset.unformatted = "true";

            if (barContainer) {
                barContainer.querySelectorAll("button, div.flex").forEach(child => {
                    if (child !== btn && !child.contains(btn)) {
                        child.dataset.prevDisplay = child.style.display;
                        child.style.display = "none";
                    }
                });
            }

            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-eye text-sky-500"></i>';
                btn.title = "Switch to Formatted View (Current: Unformatted Markdown)";
                btn.classList.add("bg-sky-500/15", "text-sky-500");
            }
        } else {
            const rawText = editor.textContent || editor.innerText;
            const parsedHtml = this.parseMarkdownWithMath(rawText, { editable: true });
            editor.innerHTML = parsedHtml;
            this.makeEditorCheckboxesEditable(editor);
            editor.dataset.unformatted = "false";

            if (barContainer) {
                barContainer.querySelectorAll("button, div.flex").forEach(child => {
                    if (child !== btn && !child.contains(btn)) {
                        child.style.display = child.dataset.prevDisplay || "";
                    }
                });
            }

            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                btn.title = "Switch to Unformatted Markdown (Current: Formatted)";
                btn.classList.remove("bg-sky-500/15", "text-sky-500");
            }
        }
    },

    getEditorMarkdown(editorElement) {
        if (!editorElement) return "";
        if (editorElement.dataset.unformatted === "true") {
            return editorElement.textContent || "";
        }

        function parseList(listNode, depth = 0) {
            let result = "";
            const children = Array.from(listNode.childNodes);

            children.forEach((child) => {
                if (child.nodeType !== Node.ELEMENT_NODE) return;
                const tag = child.tagName.toLowerCase();

                if (tag === "li") {
                    let inlineText = "";
                    let nestedMarkdown = "";
                    const checkbox = child.querySelector(
                        ':scope > input[type="checkbox"]',
                    );
                    const isTask =
                        !!checkbox || child.classList.contains("task-list-item");

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
                    if (inlineText || isTask) {
                        const indent = "    ".repeat(depth);
                        let marker = "- ";
                        if (isTask) {
                            marker = checkbox && checkbox.checked
                                ? "- [x] "
                                : "- [ ] ";
                        }
                        result += `${indent}${marker}${inlineText}\n`;
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
                    /([\\`*_{}[\]#+\-.!~=|>])/g,
                    "\\$1",
                );
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();

                if (tag === "img") {
                    return `![image](${node.src})`;
                }

                if (tag === "code" && !node.closest("pre")) {
                    return `\`${node.textContent}\``;
                }

                let inner = "";
                node.childNodes.forEach((child) => {
                    inner += parseNodeInline(child);
                });

                if (!inner && node.textContent) {
                    return node.textContent;
                }

                // Browsers leave empty inline format elements behind after
                // Enter/Backspace splits. Don't emit delimiters for them, so
                // stray `==` (empty <mark>) never leaks into the sent message.
                if (inner.trim() === "") {
                    return inner;
                }

                const hasHighlightBg = (() => {
                    if (!node.style || !node.style.backgroundColor) return false;
                    const bg = node.style.backgroundColor
                        .replace(/\s+/g, "")
                        .toLowerCase();
                    return (
                        bg !== "transparent" &&
                        bg !== "rgba(0,0,0,0)" &&
                        bg !== "initial" &&
                        bg !== "inherit"
                    );
                })();

                if (tag === "mark" || hasHighlightBg) {
                    return `==${inner}==`;
                }
                if (tag === "strong" || tag === "b") {
                    return `**${inner}**`;
                }
                if (tag === "em" || tag === "i") {
                    return `*${inner}*`;
                }
                if (tag === "strike" || tag === "s" || tag === "del") {
                    return `~~${inner}~~`;
                }
                if (tag === "sub") {
                    return `~${inner}~`;
                }
                if (tag === "sup") {
                    return `^${inner}^`;
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
                        /([\\`*_{}[\]#+\-.!~=|>])/g,
                        "\\$1",
                    );
                    const text = escaped.trim();
                    if (text) {
                        result += `${text}\n\n`;
                    }
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toLowerCase();

                    if (tag === "img") {
                        result += `![image](${child.src})\n\n`;
                    } else if (tag === "table") {
                        result += parseTable(child);
                    } else if (tag === "hr") {
                        result += `---\n\n`;
                    } else if (
                        tag === "div" &&
                        child.classList.contains("code-block-wrapper")
                    ) {
                        const codeElem =
                            child.querySelector("code") ||
                            child.querySelector("pre");
                        const selectElem = child.querySelector("select");
                        const lang = selectElem
                            ? selectElem.value
                            : "plaintext";
                        const codeText = codeElem
                            ? MarkdownEditor.extractCodeText(codeElem).trim()
                            : "";
                        result += `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
                    } else if (tag === "pre") {
                        const codeElem = child.querySelector("code");
                        const codeText = codeElem
                            ? MarkdownEditor.extractCodeText(codeElem).trim()
                            : MarkdownEditor.extractCodeText(child).trim();
                        result += `\`\`\`\n${codeText}\n\`\`\`\n\n`;
                    } else if (tag === "ul" || tag === "ol") {
                        result += parseList(child, 0) + "\n";
                    } else if (/^h[1-6]/.test(tag)) {
                        const level = parseInt(tag[1], 10);
                        const headingText = parseNodeInline(child).trim();
                        result += `${"#".repeat(level)} ${headingText}\n\n`;
                    } else if (tag === "blockquote") {
                        const text = parseNodeInline(child).trim();
                        if (text) {
                            const quotedText = text.split('\n').map(line => `> ${line}`).join('\n');
                            result += `${quotedText}\n\n`;
                        }
                    } else if (tag === "p" || tag === "div") {
                        if (child.querySelector("table")) {
                            child.querySelectorAll("table").forEach((t) => {
                                result += parseTable(t);
                            });
                        } else if (child.querySelector("ul, ol")) {
                            Array.from(child.childNodes).forEach((sub) => {
                                if (sub.nodeType === Node.ELEMENT_NODE) {
                                    const subTag =
                                        sub.tagName.toLowerCase();
                                    if (subTag === "ul" || subTag === "ol") {
                                        result += parseList(sub, 0) + "\n";
                                        return;
                                    }
                                    if (subTag === "table") {
                                        result += parseTable(sub);
                                        return;
                                    }
                                    if (subTag === "p" || subTag === "div") {
                                        result += parseNode(sub);
                                        return;
                                    }
                                }
                                const text = parseNodeInline(sub).trim();
                                if (text) result += `${text}\n\n`;
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

    extractCodeText(node) {
        if (!node) return "";
        let text = "";
        function walk(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                text += n.textContent;
            } else if (n.nodeType === Node.ELEMENT_NODE) {
                const tag = n.tagName.toLowerCase();
                if (tag === "br") {
                    text += "\n";
                } else {
                    const isBlock = ["div", "p", "tr"].includes(tag);
                    if (isBlock && text.length > 0 && !text.endsWith("\n")) {
                        text += "\n";
                    }
                    for (const child of n.childNodes) {
                        walk(child);
                    }
                    if (isBlock && text.length > 0 && !text.endsWith("\n")) {
                        text += "\n";
                    }
                }
            }
        }
        walk(node);
        return text;
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
        const code = wrapper ? wrapper.querySelector("code") || wrapper.querySelector("pre") : null;
        if (code) {
            const textToCopy = this.extractCodeText(code).trim();
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
        const wrapper = selectElem.closest(".code-block-wrapper");
        const codeElem = wrapper ? wrapper.querySelector("code") : null;
        if (codeElem) {
            codeElem.className = codeElem.className
                .split(/\s+/)
                .filter((cls) => cls && !cls.startsWith("language-"))
                .join(" ");
            codeElem.classList.add(`language-${selectElem.value}`);
        }
    },

    parseMarkdownWithMath(text, options = {}) {
        if (!text) return "";

        const editable = !!options.editable;

        // 1. Clean up broken template syntax leaking into raw text
        let processed = text.replace(/\$\{escapeHtml\((.*?)\)\}/g, (match, p1) => {
            try { return eval(p1); } catch(e) { return ""; }
        });

        const codePlaceholders = [];
        processed = processed.replace(/(`{3}[\s\S]*?`{3}|`[^`\n]+`)/g, (match) => {
            const id = `%%CODE_BLOCK_${codePlaceholders.length}%%`;
            codePlaceholders.push({ id, match });
            return id;
        });

        processed = processed
            .replace(/==([\s\S]*?)==/g, "<mark>$1</mark>")
            .replace(/\\==/g, "==")
            .replace(/~~([\s\S]*?)~~/g, "<s>$1</s>")
            .replace(/~([^~]+)~/g, "<sub>$1</sub>")
            .replace(/\^([^\^]+)\^/g, "<sup>$1</sup>");

        codePlaceholders.forEach(({ id, match }) => {
            processed = processed.split(id).join(match);
        });

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

        processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
            const id = `%%DISPLAY_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: true });
            return id;
        });

        processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
            const id = `%%DISPLAY_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: true });
            return id;
        });

        processed = processed.replace(/\\%([\s\S]*?)\\%/g, (match, math) => {
            const id = `%%INLINE_MATH_${mathBlocks.length}%%`;
            mathBlocks.push({ id, math, display: false });
            return id;
        });

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

        doc.querySelectorAll('li > input[type="checkbox"]').forEach((cb) => {
            cb.setAttribute("disabled", "true");
            if (cb.parentElement) {
                cb.parentElement.classList.add("task-list-item");
            }
        });

        doc.querySelectorAll("ul, ol").forEach((list) => {
            const items = Array.from(list.children).filter(
                (child) => child.tagName === "LI",
            );
            if (
                items.length > 0 &&
                items.every((item) =>
                    item.classList.contains("task-list-item"),
                )
            ) {
                list.classList.add("task-list");
            }
        });

        doc.querySelectorAll("table").forEach((table) => {
            const wrapper = doc.createElement("div");
            wrapper.className =
                "my-3 overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 shadow-sm";

            table.className =
                "min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left text-sm text-gray-900 dark:text-white";

            table.querySelectorAll("th").forEach((th) => {
                th.className =
                    "px-4 py-2.5 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-white uppercase tracking-wider text-xs border-b border-gray-200 dark:border-gray-700";
            });

            table.querySelectorAll("td").forEach((td) => {
                td.className =
                    "px-4 py-2.5 whitespace-nowrap text-gray-700 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800";
            });

            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });

        doc.querySelectorAll("pre").forEach((pre) => {
            if (pre.closest(".code-block-wrapper")) return;
            let codeElem = pre.querySelector("code");
            const langClass = codeElem ? codeElem.className : "";

            const wrapper = doc.createElement("div");
            wrapper.className =
                "code-block-wrapper my-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm";

            const header = doc.createElement("div");
            header.className =
                "code-block-header bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-3 py-1.5 flex justify-between items-center select-none border-b border-gray-200 dark:border-gray-700";

            const match = langClass.match(/language-(\w+)/);
            const lang = match ? match[1] : "plaintext";
            const languages = [
                "javascript",
                "python",
                "html",
                "css",
                "json",
                "sql",
                "bash",
                "markdown",
                "plaintext",
            ];
            const languageControl = editable
                ? `<select onchange="MarkdownEditor.changeLanguage(this)" class="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded px-1.5 py-0.5 text-xs font-mono focus:outline-none focus:border-gray-500">${languages
                      .map(
                          (name) =>
                              `<option value="${name}" ${name === lang ? "selected" : ""}>${name}</option>`,
                      )
                      .join("")}</select>`
                : `<span class="font-mono text-gray-500 dark:text-gray-400">${lang}</span>`;

            header.innerHTML = `
                                <div class="flex items-center gap-2">
                                    ${languageControl}
                                </div>
                                 <div class="flex gap-2">
                                     <button type="button" onclick="MarkdownEditor.toggleCodeCollapse(this)" class="hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors" title="Collapse / Expand">
                                         <svg width="16" height="16" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                     </button>
                                     <button type="button" onclick="MarkdownEditor.copyCode(this)" class="hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors" title="Copy Code">
                                         <svg width="16" height="16" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2/2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                     </button>
                                 </div>
                            `;

            pre.className =
                "m-0 rounded-none border-0 p-3 text-gray-800 dark:text-gray-200 font-mono text-sm overflow-x-auto whitespace-pre-wrap bg-transparent";
            if (editable) {
                pre.setAttribute("contenteditable", "true");
                wrapper.setAttribute("contenteditable", "false");
            }

            if (!codeElem) {
                const newCode = doc.createElement("code");
                newCode.className = `${langClass} bg-transparent p-0 text-current`;
                while (pre.firstChild) {
                    newCode.appendChild(pre.firstChild);
                }
                pre.appendChild(newCode);
            } else {
                codeElem.className = `${langClass} bg-transparent p-0 text-current`;
            }
            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });

        doc.querySelectorAll("blockquote").forEach((bq) => {
            bq.className =
                "border-l-4 border-slate-300 dark:border-slate-600 pl-3 my-2 text-slate-600 dark:text-slate-400 italic";
        });

        let finalHtml = doc.body.innerHTML;
        return finalHtml;
    },
};

function applyHeading(tag) {
    MarkdownEditor.applyHeading(tag);
}
function applyBlockquote() {
    MarkdownEditor.applyWYSIWYG("blockquote");
}
function applyWYSIWYG(type) {
    MarkdownEditor.applyWYSIWYG(type);
}
function handleKeyDown(event) {
    MarkdownEditor.handleKeyDown(event);
}
function handlePaste(event) {
    MarkdownEditor.handlePaste(event);
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
        if (evt === "keyup") {
            MarkdownEditor.cleanupEmptyInlineFormats();
        }
    });
});

let attachedFiles = [];
let attachedSkills = [];

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    files.forEach((file) => {
        const fileObj = {
            id:
                "file_" +
                Date.now() +
                "_" +
                Math.random().toString(36).substring(2, 7),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: null,
            content: null,
            isImage: file.type.startsWith("image/"),
        };

        const reader = new FileReader();
        if (fileObj.isImage) {
            reader.onload = (e) => {
                fileObj.dataUrl = e.target.result;
                attachedFiles.push(fileObj);
                renderAttachedFilesPreview();
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = (e) => {
                fileObj.content = e.target.result;
                attachedFiles.push(fileObj);
                renderAttachedFilesPreview();
            };
            reader.readAsText(file);
        }
    });

    event.target.value = "";
}
function ensureNodeAttachments(node) {
    if (!node) return;
    if (!node.attachments) node.attachments = [];
}

// Add this helper function to main.js
function appendUserTextToElement(element, text) {
    // Standard textContent prevents markdown parsers from converting text into code boxes
    element.textContent = text;
    element.style.whiteSpace = "pre-wrap"; // Preserves line breaks naturally
}
function removeAttachedFile(indexOrId) {
    if (indexOrId === undefined || indexOrId === null) return;

    if (typeof attachedFiles !== "undefined" && Array.isArray(attachedFiles)) {
        if (typeof indexOrId === "number") {
            attachedFiles.splice(indexOrId, 1);
        } else {
            attachedFiles = attachedFiles.filter(
                (f, idx) => String(f.id) !== String(indexOrId) && idx !== indexOrId
            );
        }
    }

    if (typeof activeAttachments !== "undefined" && Array.isArray(activeAttachments)) {
        if (typeof indexOrId === "number") {
            activeAttachments.splice(indexOrId, 1);
        } else {
            activeAttachments = activeAttachments.filter(
                (f, idx) => String(f.id) !== String(indexOrId) && idx !== indexOrId
            );
        }
    }

    if (typeof renderAttachedFilesPreview === "function") {
        renderAttachedFilesPreview();
    }

    if (typeof renderAttachmentPreviews === "function") {
        renderAttachmentPreviews(typeof activeAttachments !== "undefined" ? activeAttachments : []);
    }
}

// Global handler for pasting image files from clipboard directly into attachedFiles state
document.addEventListener("paste", (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    let imagePasted = false;
    for (const item of items) {
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;

            imagePasted = true;
            const fileObj = {
                id:
                    "file_" +
                    Date.now() +
                    "_" +
                    Math.random().toString(36).substring(2, 7),
                name: file.name && file.name !== "image.png" ? file.name : `pasted_image_${Date.now()}.png`,
                type: file.type,
                size: file.size,
                dataUrl: null,
                content: null,
                isImage: true,
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                fileObj.dataUrl = e.target.result;
                attachedFiles.push(fileObj);
                renderAttachedFilesPreview();
            };
            reader.readAsDataURL(file);
        }
    }

    if (imagePasted) {
        event.preventDefault();
    }
});

function closeDropdown(id) {
    const drop = document.getElementById(id);
    if (drop) {
        drop.classList.add("hidden");
    }
}

function parseSkillsFromText(text) {
    if (!text) return [];
    // More robust regex to handle various attribute styles or no attributes
    const skillRegex = /<skill(?:\s+[^>]+)?([\s\S]*?)<\/skill>/gi;
    const parsedSkills = [];
    let match;

    while ((match = skillRegex.exec(text)) !== null) {
        const fullTag = match[0];
        const content = match[1].trim();

        // Extract title or name attribute if present
        const titleMatch = fullTag.match(/(?:title|name)="([^"]+)"/i);
        const title = titleMatch ? titleMatch[1] : "Untitled Skill";

        parsedSkills.push({
            id: "skill_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            title: title.trim(),
            content: content
        });
    }

    return parsedSkills;
}

function renderSkillsManager() {
    const container = document.getElementById("skillsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!state.skills || state.skills.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No skills added yet. Add a skill above or import a .md file.</p>`;
        return;
    }

    state.skills.forEach((s) => {
        const card = document.createElement("div");
        card.className = "p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative group";
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> ${escapeHtml(s.title || s.name)}
                </span>
                <button type="button" onclick="removeSkill('${s.id}')" class="text-red-500 hover:text-red-600 p-1 text-xs" title="Remove Skill">
                    <i class="fa-solid fa-trash-can"></i> Remove
                </button>
            </div>
            <pre class="text-[10px] font-mono bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 max-h-24 overflow-y-auto whitespace-pre-wrap">${escapeHtml(s.content)}</pre>
        `;
        container.appendChild(card);
    });
}

function addNewSkillFromSettings() {
    const titleInput = document.getElementById("newSkillTitle");
    const contentInput = document.getElementById("newSkillContent");
    if (!titleInput || !titleInput.value.trim()) {
        alert("Please enter a skill title.");
        return;
    }
    const title = titleInput.value.trim();
    const content = contentInput ? MarkdownEditor.getEditorMarkdown(contentInput) : "";

    const newSkill = {
        id: "skill_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
        title: title,
        content: content
    };

    if (!state.skills) state.skills = [];
    state.skills.push(newSkill);
    localStorage.setItem("ai_skills", JSON.stringify(state.skills));

    titleInput.value = "";
    if (contentInput) contentInput.innerHTML = "";
    renderSkillsManager();
}

function handleSkillMdUpload(event) {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileText = e.target.result;
            const parsed = parseSkillsFromText(fileText);
            if (parsed.length > 0) {
                state.skills.push(...parsed);
            } else {
                const title = file.name.replace(/\.[^/.]+$/, "");
                state.skills.push({
                    id: "skill_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
                    title: title,
                    content: fileText.trim()
                });
            }
            localStorage.setItem("ai_skills", JSON.stringify(state.skills));
            renderSkillsManager();
        };
        reader.readAsText(file);
    });
    event.target.value = "";
}

function removeSkill(id) {
    state.skills = state.skills.filter(s => s.id !== id);
    localStorage.setItem("ai_skills", JSON.stringify(state.skills));
    renderSkillsManager();
}

function openSkillPickerModal() {
    const list = document.getElementById("skillPickerList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.skills || state.skills.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No skills available. Go to Settings > Skills to add modular skills.</p>`;
    } else {
        state.skills.forEach(s => {
            const isAlreadyAttached = attachedSkills.some(as => as.id === s.id);
            const item = document.createElement("label");
            item.className = "flex items-start gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer transition";
            item.innerHTML = `
                <input type="checkbox" value="${s.id}" ${isAlreadyAttached ? "checked" : ""} class="skill-checkbox mt-0.5 rounded text-sky-500 cursor-pointer" />
                <div class="flex-1 min-w-0">
                    <span class="block text-xs font-bold text-slate-800 dark:text-slate-100">${escapeHtml(s.title || s.name)}</span>
                    ${s.description ? `<span class="block text-[11px] text-slate-500 dark:text-slate-400 truncate">${escapeHtml(s.description)}</span>` : ""}
                </div>
            `;
            list.appendChild(item);
        });
    }
    toggleModal("skillPickerModal");
}
function parseToolResultContent(result) {
    if (result === undefined || result === null) return "";
    if (typeof result === "string") return result;

    let target = result;
    if (target.result !== undefined) {
        target = target.result;
    }

    if (typeof target === "string") return target;

    if (target && typeof target === "object") {
        if (target.error) {
            return typeof target.error === "string" ? target.error : JSON.stringify(target.error);
        }
        const content = target.content;
        if (Array.isArray(content)) {
            return content.map(item => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                    if (typeof item.text === "string") return item.text;
                    if (typeof item.data === "string") return item.data;
                    if (typeof item.content === "string") return item.content;
                }
                return JSON.stringify(item);
            }).filter(Boolean).join("\n");
        }
        if (typeof content === "string") return content;

        if (typeof target.text === "string") return target.text;
        if (typeof target.output === "string") return target.output;
        if (typeof target.message === "string") return target.message;
        if (typeof target.data === "string") return target.data;
    }

    try {
        return JSON.stringify(result);
    } catch (e) {
        return String(result);
    }
}
function confirmSelectedSkills() {
    const checkboxes = document.querySelectorAll(".skill-checkbox");
    const selectedIds = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    attachedSkills = state.skills.filter(s => selectedIds.includes(s.id));
    console.log("confirmSelectedSkills - selectedIds:", selectedIds, "attachedSkills:", attachedSkills);
    renderAttachedFilesPreview();
    toggleModal("skillPickerModal");
}

function removeAttachedSkill(id) {
    attachedSkills = attachedSkills.filter(s => s.id !== id);
    renderAttachedFilesPreview();
}

function renderAttachedFilesPreview() {
    const container = document.getElementById("attachedFilesPreview");
    if (!container) return;

    const hasFiles = Array.isArray(attachedFiles) && attachedFiles.length > 0;
    const hasSkills = Array.isArray(attachedSkills) && attachedSkills.length > 0;

    if (!hasFiles && !hasSkills) {
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    container.className = "flex flex-wrap gap-1 px-3 py-0 my-0 leading-none";
    container.innerHTML = "";

    if (hasFiles) {
        attachedFiles.forEach((file, index) => {
            const item = document.createElement("div");
            item.className =
                "inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-200 dark:bg-slate-700/80 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-xs relative group";

            const fileName = escapeHtml(file.name || "file");
            const iconOrImg = file.isImage && file.dataUrl
                ? `<img src="${file.dataUrl}" alt="${fileName}" class="w-3.5 h-3.5 object-cover rounded" />`
                : `<i class="fa-solid fa-file-code text-sky-500 text-[10px]"></i>`;

            item.innerHTML = `
                ${iconOrImg}
                <span class="truncate max-w-[110px]" title="${fileName}">${fileName}</span>
                <button type="button" class="remove-file-btn text-slate-400 hover:text-red-500 transition ml-0.5" title="Remove File">
                    <i class="fa-solid fa-xmark text-[10px] pointer-events-none"></i>
                </button>
            `;

            const btn = item.querySelector(".remove-file-btn");
            if (btn) {
                btn.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    removeAttachedFile(index);
                };
            }

            container.appendChild(item);
        });
    }

    if (hasSkills) {
        attachedSkills.forEach((skill) => {
            const item = document.createElement("div");
            item.className =
                "inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/15 dark:bg-amber-500/20 rounded-lg text-[11px] font-medium text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs relative group";

            const skillName = escapeHtml(skill.title || skill.name || "skill");
            item.innerHTML = `
                <i class="fa-solid fa-wand-magic-sparkles text-amber-500 text-[10px]"></i>
                <span class="truncate max-w-[110px]" title="${skillName}">${skillName}</span>
                <button type="button" class="remove-skill-btn text-amber-500/70 hover:text-red-500 transition ml-0.5" title="Remove Skill">
                    <i class="fa-solid fa-xmark text-[10px] pointer-events-none"></i>
                </button>
            `;

            const btn = item.querySelector(".remove-skill-btn");
            if (btn) {
                btn.onclick = function (e) {
                    e.stopPropagation();
                    e.preventDefault();
                    removeAttachedSkill(skill.id);
                };
            }

            container.appendChild(item);
        });
    }
}

function processMessageWithAttachments(userText) {
    const contentPayload = [];

    if (userText && userText.trim()) {
        contentPayload.push({
            type: "text",
            text: userText.trim(),
        });
    }

    attachedFiles.forEach((f) => {
        if (f.isImage) {
            contentPayload.push({
                type: "image_url",
                image_url: {
                    url: f.dataUrl,
                },
            });
        } else {
            // Strip triple backticks to prevent triggering markdown code blocks
            const cleanText = f.content.replace(/```/g, "''").trim();
            contentPayload.push({
                type: "text",
                text: `Attached File (${f.name}):\n${cleanText}`,
            });
        }
    });

    const currentAttached = [...attachedFiles];
    attachedFiles = [];
    renderAttachedFilesPreview();

    return {
        content: contentPayload.length > 0 ? contentPayload : userText,
        attachments: currentAttached,
    };
}
const CryptoUtil = {
    async getCryptoKey() {
        const secret = "AI_WRAPPER_SECURE_SALT_2026";
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(secret),
            { name: "PBKDF2" },
            false,
            ["deriveKey"],
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode("static_salt_ai_wrapper"),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"],
        );
    },

    async encrypt(plaintext) {
        if (!plaintext) return "";
        try {
            const key = await this.getCryptoKey();
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(plaintext);
            const ciphertext = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                key,
                encoded,
            );
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertext), iv.length);
            return btoa(String.fromCharCode(...combined));
        } catch (e) {
            console.error("Encryption error:", e);
            return plaintext;
        }
    },

    async decrypt(cipherText) {
        if (!cipherText) return "";
        try {
            const raw = atob(cipherText);
            const combined = new Uint8Array(raw.length);
            for (let i = 0; i < raw.length; i++) {
                combined[i] = raw.charCodeAt(i);
            }
            const iv = combined.slice(0, 12);
            const data = combined.slice(12);
            const key = await this.getCryptoKey();
            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                key,
                data,
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            return cipherText;
        }
    },
};

const PuterSDKBridge = {
    isLoaded: false,

    async init() {
        if (this.isLoaded && window.puter) return true;

        if (document.querySelector('script[src*="js.puter.com"]')) {
            return new Promise((resolve, reject) => {
                let attempts = 0;
                const checkInterval = setInterval(() => {
                    attempts++;
                    if (window.puter) {
                        clearInterval(checkInterval);
                        this.isLoaded = true;
                        resolve(true);
                    } else if (attempts > 20) {
                        clearInterval(checkInterval);
                        reject(
                            new Error(
                                "Timeout waiting for Puter.js initialization.",
                            ),
                        );
                    }
                }, 100);
            });
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://js.puter.com/v2/";
            script.async = true;
            script.onload = () => {
                this.isLoaded = true;
                resolve(true);
            };
            script.onerror = () =>
                reject(
                    new Error(
                        "Failed to load Puter.js script. Are you running this inside Puter?",
                    ),
                );
            document.head.appendChild(script);
        });
    },

    async signIn() {
        await this.init();
        if (!window.puter || !window.puter.auth) {
            throw new Error("Puter environment is not available.");
        }
        return await window.puter.auth.signIn();
    },

    async chatCompletion(model, messages, options = {}) {
        await this.init();
        if (!window.puter || !window.puter.ai) {
            throw new Error("Puter AI interface is not available.");
        }

        const prompt = messages
            .map((m) => `${m.role}: ${m.content}`)
            .join("\n");

        if (options.stream) {
            return await window.puter.ai.chat(prompt, { model, stream: true });
        } else {
            const response = await window.puter.ai.chat(prompt, { model });
            return {
                choices: [
                    { message: { role: "assistant", content: response } },
                ],
            };
        }
    },
};

const PROVIDER_PRESETS = {
    openai: {
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        protocol: "openai",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1", "o3-mini"],
    },
    anthropic: {
        name: "Anthropic",
        baseUrl: "https://api.anthropic.com/v1",
        protocol: "anthropic",
        models: ["claude-3-7-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    },
    google: {
        name: "Google AI",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta",
        protocol: "google",
        models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    },
    puter: {
        name: "puter.js",
        protocol: "openai",
        baseUrl: "https://api.puter.com/v1",
        models: [
            "gpt-4o",
            "claude-3-7-sonnet",
            "gemini-2.5-flash",
            "deepseek-r1",
        ],
    },
    google_ai_oauth: {
        name: "Google AI",
        protocol: "openai",
        baseUrl: "https://generativelanguage.googleapis.com",
        models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    },
    openrouter: {
        name: "OpenRouter",
        protocol: "openai",
        baseUrl: "https://openrouter.ai/api/v1",
        models: [
            "openrouter/auto",
            "anthropic/claude-3.7-sonnet",
            "deepseek/deepseek-r1",
        ],
    },
    glama: {
        name: "Glama",
        protocol: "openai",
        baseUrl: "https://glama.ai/api/v1",
        models: ["glama/default", "anthropic/claude-3.5-sonnet"],
    },
    grok: {
        name: "Grok",
        protocol: "openai",
        baseUrl: "https://api.x.ai/v1",
        models: ["grok-2", "grok-vision-beta"],
    },
    huggingface: {
        name: "Huggingface",
        protocol: "openai",
        baseUrl: "https://api-inference.huggingface.co/v1",
        models: [
            "meta-llama/Llama-3.3-70B-Instruct",
            "mistralai/Mistral-7B-Instruct-v0.3",
        ],
    },
    ollama: {
        name: "Ollama",
        protocol: "openai",
        baseUrl: "http://localhost:11434/v1",
        models: ["llama3.3", "deepseek-r1:8b", "mistral", "qwen2.5"],
    },
};

let state = {
    providers: [],
    currentProviderId:
        localStorage.getItem("ai_current_provider_id") || "",
    currentModel: localStorage.getItem("ai_model") || "gpt-4o-mini",
    currentModel: localStorage.getItem("ai_model") || "gpt-4o-mini",
    personas: JSON.parse(localStorage.getItem("ai_personas") || "[]"),
    agents: JSON.parse(localStorage.getItem("ai_agents") || "[]"),
    skills: JSON.parse(localStorage.getItem("ai_skills") || "[]"),
    currentPersonaId: localStorage.getItem("ai_current_persona_id") || null,
    currentAgentId: localStorage.getItem("ai_current_agent_id") || null,
    conversations: [],
    currentConvId: localStorage.getItem("ai_current_conv_id") || "",
    providerModels: {},
    customParams: JSON.parse(localStorage.getItem("ai_custom_params") || "[]"),
    mcpTools: JSON.parse(
        localStorage.getItem("ai_mcp_tools") ||
            JSON.stringify([
                {
                    id: "mcp_search",
                    name: "Web Search MCP",
                    type: "HTTP",
                    url: "https://api.exa.ai/mcp",
                    description:
                        "Enables real-time internet web search and page content retrieval",
                    enabled: false,
                },
            ]),
    ),
    sidebarOpen: localStorage.getItem("ai_sidebar_open") !== "false",
    canvasOpen: localStorage.getItem("ai_canvas_open") === "true",
    canvasWidth: parseInt(localStorage.getItem("ai_canvas_width")) || 300,
    titleGenEnabled: localStorage.getItem("ai_title_gen_enabled") !== "false",
    titleProviderId: localStorage.getItem("ai_title_provider_id") || "",
    titleModel: localStorage.getItem("ai_title_model") || "",
    titlePrompt: localStorage.getItem("ai_title_prompt") || "",
    isEditing: false,
    editingMode: null,
    editingNodeId: null,
    editingParentId: null,
    editingRole: null,
};

// Safe storage retrieval helper for saved JSON states
try {
    const rawConvs = localStorage.getItem("ai_conversations");
    if (rawConvs) {
        state.conversations = JSON.parse(rawConvs);
    }
} catch (e) {
    console.warn("Failed to parse conversations state from localStorage:", e);
    state.conversations = [];
}

let currentAbortController = null;

// Global Canvas object - accessible from agent scripts, webMCP scripts, and any website script
// Usage: canvas.title.content = "<h1>Hello</h1>"
//        canvas.title.getElementById("myId")
const canvas = {
    title: {}
};

Object.defineProperty(canvas.title, 'content', {
    get() {
        return this._content || "";
    },
    set(html) {
        this._content = html || "";
        const iframe = document.getElementById("canvasIframe");
        if (iframe) {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc) {
                    doc.open();
                    doc.write(html || "");
                    doc.close();
                }
            } catch (e) {
                console.error("Canvas iframe write error:", e);
            }
        }
    },
    configurable: true
});

canvas.title.getElementById = function(id) {
    const iframe = document.getElementById("canvasIframe");
    if (iframe) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) {
            return doc.getElementById(id);
        }
    }
    return null;
};

function toggleCanvas() {
    state.canvasOpen = !state.canvasOpen;
    localStorage.setItem("ai_canvas_open", state.canvasOpen);
    const widthInput = document.getElementById("canvasWidthInput");
    if (widthInput && state.canvasOpen) {
        state.canvasWidth = Math.max(200, Math.min(900, parseInt(widthInput.value) || 300));
        localStorage.setItem("ai_canvas_width", state.canvasWidth);
        renderCanvasContent();
    }
    applyCanvasState();
}

function applyCanvasState() {
    const sidebar = document.getElementById("canvasSidebar");
    const widthInput = document.getElementById("canvasWidthInput");
    if (!sidebar) return;

    if (widthInput) widthInput.value = state.canvasWidth;

    if (state.canvasOpen) {
        sidebar.style.width = state.canvasWidth + "px";
        sidebar.classList.remove(
            "w-0",
            "opacity-0",
            "pointer-events-none",
            "invisible",
        );
        sidebar.classList.add("w-64");
    } else {
        sidebar.style.width = "0px";
        sidebar.classList.remove("w-64");
        sidebar.classList.add(
            "w-0",
            "opacity-0",
            "pointer-events-none",
            "invisible",
        );
    }
}

function updateCanvasWidth() {
    const input = document.getElementById("canvasWidthInput");
    if (!input) return;
    state.canvasWidth = Math.max(200, Math.min(900, parseInt(input.value) || 300));
    localStorage.setItem("ai_canvas_width", state.canvasWidth);
    const sidebar = document.getElementById("canvasSidebar");
    if (sidebar && state.canvasOpen) {
        sidebar.style.width = state.canvasWidth + "px";
    }
}

let isResizingCanvas = false;
let startCanvasX = 0;
let startCanvasWidth = 0;

document.addEventListener("mousedown", (e) => {
    const handle = document.getElementById("canvasResizeHandle");
    if (handle && (e.target === handle || handle.contains(e.target))) {
        isResizingCanvas = true;
        startCanvasX = e.clientX;
        startCanvasWidth = state.canvasWidth;
        document.body.style.cursor = "ew-resize";
        e.preventDefault();
    }
});

document.addEventListener("mousemove", (e) => {
    if (!isResizingCanvas) return;
    const sidebar = document.getElementById("canvasSidebar");
    if (!sidebar) return;

    const delta = startCanvasX - e.clientX;
    const newWidth = Math.max(200, Math.min(900, startCanvasWidth + delta));

    state.canvasWidth = newWidth;
    sidebar.style.width = newWidth + "px";
    sidebar.style.transition = "none";

    const widthInput = document.getElementById("canvasWidthInput");
    if (widthInput) widthInput.value = newWidth;
});

document.addEventListener("mouseup", () => {
    if (isResizingCanvas) {
        isResizingCanvas = false;
        document.body.style.cursor = "";
        const sidebar = document.getElementById("canvasSidebar");
        if (sidebar) {
            sidebar.style.transition = "";
        }
        localStorage.setItem("ai_canvas_width", state.canvasWidth);
    }
});

function renderCanvasContent() {
    const iframe = document.getElementById("canvasIframe");
    if (iframe && canvas.title.content) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (doc) {
            doc.open();
            doc.write(canvas.title.content);
            doc.close();
        }
    }
}

function clearCanvas() {
    canvas.title.content = "";
}

function copyCanvasHtml() {
    const html = canvas.title.content || "";
    if (html) {
        navigator.clipboard.writeText(html).catch(err => console.error("Copy failed:", err));
    }
}

function normalizeBaseUrl(url) {
    if (!url) return "https://api.openai.com/v1";
    return url.trim().replace(/\/+$/, "");
}
function escapeHtml(str) {
    if (!str) return "";
    return String(str);
}

function setGenerationState(isGenerating) {
    const sendBtn = document.getElementById("sendBtn");
    if (!sendBtn) return;

    if (isGenerating) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-square text-xs"></i>';
        sendBtn.title = "Stop Generating";
        sendBtn.onclick = () => {
            if (currentAbortController) {
                currentAbortController.abort();
            }
        };
    } else {
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane text-xs"></i>';
        sendBtn.title = "Send Message";
        sendBtn.onclick = sendMessage;
    }
}

function toggleKeyVisibility(btn) {
    const input = btn.previousElementSibling;
    if (!input) return;
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    btn.innerHTML = isPassword
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
}

async function loadProviders() {
    let rawProviders = null;
    try {
        const encData = localStorage.getItem("ai_providers_enc");
        if (encData) rawProviders = JSON.parse(encData);
    } catch (e) {
        console.warn("Failed to parse providers from localStorage:", e);
    }

    if (rawProviders && Array.isArray(rawProviders) && rawProviders.length > 0) {
        state.providers = await Promise.all(
            rawProviders.map(async (p) => ({
                ...p,
                protocol: p.protocol || "openai",
                baseUrl: normalizeBaseUrl(p.baseUrl),
                apiKey: await CryptoUtil.decrypt(p.apiKey),
            })),
        );
    } else {
        const legacyKey = localStorage.getItem("ai_api_key") || "";
        const legacyBaseUrl = normalizeBaseUrl(
            localStorage.getItem("ai_base_url") || "https://api.openai.com/v1",
        );
        state.providers = [
            {
                id: "prov_default",
                name: "OpenAI",
                protocol: "openai",
                baseUrl: legacyBaseUrl,
                apiKey: legacyKey,
            },
        ];
    }

    // Fallback currentProviderId to a valid loaded provider if missing or invalid
    if (
        !state.currentProviderId ||
        !state.providers.some((p) => p.id === state.currentProviderId)
    ) {
        state.currentProviderId = state.providers[0]?.id || "prov_default";
    }
}

async function saveProvidersToStorage() {
    const encryptedProviders = await Promise.all(
        state.providers.map(async (p) => ({
            ...p,
            protocol: p.protocol || "openai",
            baseUrl: normalizeBaseUrl(p.baseUrl),
            apiKey: await CryptoUtil.encrypt(p.apiKey),
        })),
    );
    localStorage.setItem(
        "ai_providers_enc",
        JSON.stringify(encryptedProviders),
    );
}

function formatSystemPrompt(prompt, attachedSkillsList = []) {
    if (!prompt) prompt = "";
    const now = new Date();

    // Only use explicitly attached skills; do not fall back to all saved skills automatically
    let skillsToUse = attachedSkillsList;

    let skillBlocks = "";
    if (Array.isArray(skillsToUse) && skillsToUse.length > 0) {
        skillBlocks = skillsToUse
            .map(
                (s) =>
                    `<skill title="${escapeHtml(s.title || s.name)}">\n${s.content}\n</skill>`,
            )
            .join("\n\n");
    }

    let formatted = prompt
        .replace(/\{model-id\}/gi, state.currentModel || "unknown-model")
        .replace(/\{time\}/gi, now.toLocaleTimeString())
        .replace(/\{date\}/gi, now.toLocaleDateString())
        .replace(
            /\{place\}/gi,
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "Unknown Location",
        );

    // Inject into placeholder if present, otherwise append automatically at the bottom
    if (formatted.toLowerCase().includes("{skill}") || formatted.toLowerCase().includes("{skills}")) {
        formatted = formatted
            .replace(/\{skill\}/gi, skillBlocks)
            .replace(/\{skills\}/gi, skillBlocks);
    } else if (skillBlocks) {
        formatted = (formatted + "\n\n### Active Skills & Guidelines\n" + skillBlocks).trim();
    }

    return formatted;
}

function getActiveProvider() {
    const found = state.providers.find((p) => p.id === state.currentProviderId);
    return (
        found ||
        state.providers[0] || {
            id: "prov_default",
            name: "OpenAI",
            protocol: "openai",
            baseUrl: "https://api.openai.com/v1",
            apiKey: "",
        }
    );
}

function updateModelButtonLabel() {
    const labelEl = document.getElementById("currentModelLabel");
    if (!labelEl) return;
    if (state.currentAgentId && state.agents) {
        const agent = state.agents.find(a => a.id === state.currentAgentId);
        if (agent) {
            labelEl.innerHTML = `<strong class="font-bold">Agent</strong>: <span class="font-normal">${escapeHtml(agent.name)}</span>`;
            return;
        }
    }
    if (state.currentPersonaId && state.personas) {
        const persona = state.personas.find(p => p.id === state.currentPersonaId);
        if (persona) {
            labelEl.innerHTML = `<strong class="font-bold">Persona</strong>: <span class="font-normal">${escapeHtml(persona.name)}</span>`;
            return;
        }
    }
    const activeProv = getActiveProvider();
    if (activeProv && state.currentModel) {
        labelEl.innerHTML = `<strong class="font-bold">${escapeHtml(activeProv.name)}</strong> <span class="font-normal opacity-90">${escapeHtml(state.currentModel)}</span>`;
    } else {
        labelEl.innerText = "Select Model";
    }
}

function saveConversationsState() {
    localStorage.setItem(
        "ai_conversations",
        JSON.stringify(state.conversations),
    );
    localStorage.setItem("ai_current_conv_id", state.currentConvId);
}

function getActiveConversation() {
    return state.conversations.find((c) => c.id === state.currentConvId);
}

function migrateLegacyMessages() {
    const legacyMessages = JSON.parse(
        localStorage.getItem("ai_messages") || "[]",
    );
    state.conversations.forEach((conv) => {
        if (!conv.rootIds && conv.rootId) {
            conv.rootIds = [conv.rootId];
            conv.rootActiveIndex = 0;
        }
        if (Array.isArray(conv.messages)) {
            const nodes = {};
            let rootId = null;
            let lastId = null;
            conv.messages.forEach((m, idx) => {
                const id = m.id || "msg_" + idx + "_" + Date.now();
                nodes[id] = {
                    id,
                    role: m.role,
                    content: m.content || "",
                    reasoning_content: m.reasoning_content || "",
                    parentId: lastId,
                    children: [],
                    activeChildIndex: 0,
                };
                if (lastId && nodes[lastId]) {
                    nodes[lastId].children.push(id);
                }
                if (!rootId) rootId = id;
                lastId = id;
            });
            conv.nodes = nodes;
            conv.rootId = rootId;
            conv.rootIds = rootId ? [rootId] : [];
            conv.rootActiveIndex = 0;
            conv.activeLeafId = lastId;
            delete conv.messages;
        }
    });

    if (legacyMessages.length > 0) {
        const legacyId = "legacy_" + Date.now();
        const nodes = {};
        let rootId = null;
        let lastId = null;
        legacyMessages.forEach((m, idx) => {
            const id = "msg_legacy_" + idx;
            nodes[id] = {
                id,
                role: m.role,
                content: m.content || "",
                reasoning_content: m.reasoning_content || "",
                parentId: lastId,
                children: [],
                activeChildIndex: 0,
            };
            if (lastId && nodes[lastId]) {
                nodes[lastId].children.push(id);
            }
            if (!rootId) rootId = id;
            lastId = id;
        });

        const migratedConv = {
            id: legacyId,
            title: "Restored Session",
            nodes,
            rootId,
            rootIds: rootId ? [rootId] : [],
            rootActiveIndex: 0,
            activeLeafId: lastId,
            createdAt: Date.now(),
        };
        state.conversations.push(migratedConv);
        state.currentConvId = legacyId;
        saveConversationsState();
        localStorage.removeItem("ai_messages");
    }
}

function createNewConversation(switchActive = true) {
    const newId = "conv_" + Date.now();
    const newConv = {
        id: newId,
        title: "Untitled Chat",
        nodes: {},
        rootId: null,
        rootIds: [],
        rootActiveIndex: 0,
        activeLeafId: null,
        createdAt: Date.now(),
    };
    state.conversations.unshift(newConv);
    saveConversationsState();

    if (switchActive) {
        switchConversation(newId);
    } else {
        document.title = newConv.title;
    }
    return newConv;
}

function switchConversation(id) {
    if (currentAbortController) {
        currentAbortController.abort();
    }
    state.currentConvId = id;
    cancelEditingBranch();
    saveConversationsState();
    renderSidebarConversations();
    renderChatHistory();
    const conv = state.conversations.find((c) => c.id === id);
    if (conv && conv.title) {
        document.title = conv.title;
    }
}

function deleteConversation(event, id) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.currentConvId === id) {
        if (state.conversations.length > 0) {
            state.currentConvId = state.conversations[0].id;
        } else {
            state.currentConvId = "";
        }
    }
    saveConversationsState();

    if (!state.currentConvId) {
        createNewConversation(true);
    } else {
        switchConversation(state.currentConvId);
    }
}

function renameConversation(event, id) {
    event.stopPropagation();
    const conv = state.conversations.find((c) => c.id === id);
    if (!conv) return;

    const newTitle = prompt("Rename this conversation:", conv.title);
    if (newTitle !== null && newTitle.trim() !== "") {
        conv.title = newTitle.trim();
        saveConversationsState();
        renderSidebarConversations();
        if (state.currentConvId === conv.id) {
            document.title = conv.title;
        }
    }
}

function renderSidebarConversations() {
    const container = document.getElementById("conversationsContainer");
    if (!container) return;
    container.innerHTML = "";

    state.conversations.forEach((c) => {
        const isActive = c.id === state.currentConvId;
        const item = document.createElement("div");
        item.className = `flex items-center justify-between gap-1.5 p-2 rounded-xl text-xs transition relative group cursor-pointer ${
            isActive
                ? "bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold border-l-4 border-sky-500"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`;
        item.onclick = () => switchConversation(c.id);

        item.innerHTML = `
            <div class="flex items-center gap-2 truncate flex-1 pr-1.5">
                <i class="fa-regular fa-message text-[11px] opacity-70"></i>
                <span class="truncate" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</span>
            </div>
            <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                <button
                    onclick="renameConversation(event, '${c.id}')"
                    class="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 rounded"
                    title="Rename"
                >
                    <i class="fa-solid fa-pen text-[9px]"></i>
                </button>
                <button
                    onclick="deleteConversation(event, '${c.id}')"
                    class="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-600 rounded"
                    title="Delete"
                >
                    <i class="fa-solid fa-trash-can text-[9px]"></i>
                </button>
            </div>
        `;
        container.appendChild(item);
    });
}

function toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    localStorage.setItem("ai_sidebar_open", state.sidebarOpen);
    applySidebarState();
}

function applySidebarState() {
    const sidebar = document.getElementById("chatSidebar");
    const icon = document.getElementById("sidebarIcon");
    if (!sidebar) return;

    if (state.sidebarOpen) {
        sidebar.style.width = "";
        sidebar.classList.remove(
            "w-0",
            "opacity-0",
            "pointer-events-none",
            "invisible",
        );
        sidebar.classList.add("w-64");
        if (icon) {
            icon.className = "fa-solid fa-bars text-sm";
        }
    } else {
        sidebar.style.width = "0px";
        sidebar.classList.remove("w-64");
        sidebar.classList.add(
            "w-0",
            "opacity-0",
            "pointer-events-none",
            "invisible",
        );
        if (icon) {
            icon.className = "fa-solid fa-bars text-sm opacity-60";
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    marked.setOptions({ breaks: true, gfm: true });

    await loadProviders();
    migrateLegacyMessages();

    if (state.conversations.length === 0) {
        createNewConversation(false);
    }
    if (!state.currentConvId) {
        state.currentConvId = state.conversations[0].id;
    }
    const currentConv = state.conversations.find(c => c.id === state.currentConvId);
    if (currentConv && currentConv.title) {
        document.title = currentConv.title;
    }

    const sysPromptEl = document.getElementById("systemPromptInput");
    if (sysPromptEl) {
        sysPromptEl.innerHTML = MarkdownEditor.parseMarkdownWithMath(state.systemPrompt || "You are a helpful assistant.", { editable: true });
    }

    const bar1 = document.getElementById("markdownBar");
    if (bar1) bar1.innerHTML = MarkdownEditor.renderToolbarHtml("");
    const bar2 = document.getElementById("systemPromptMarkdownBar");
    if (bar2) bar2.innerHTML = MarkdownEditor.renderToolbarHtml("Sys-");
    const bar3 = document.getElementById("skillPromptMarkdownBar");
    if (bar3) bar3.innerHTML = MarkdownEditor.renderToolbarHtml("Skill-");

    updateModelButtonLabel();

    if (localStorage.getItem("theme") === "light") {
        document.documentElement.classList.remove("dark");
        document.getElementById("themeIcon").className =
            "fa-solid fa-sun text-sm";
        if (document.getElementById("themePreviewIcon")) {
            document.getElementById("themePreviewIcon").className =
                "fa-solid fa-sun text-sky-500 text-lg";
        }
    }

    applyThemeStyle(localStorage.getItem("ai_theme_style") || "pro");
    renderThemeStyleDropdown();

    rehydrateWebMcpTools();
    applySidebarState();
    applyCanvasState();
    renderSidebarConversations();
    renderProvidersListInSettings();
    renderPersonasManager();
    renderAgentsManager();
    renderSkillsManager();
    renderChatHistory();
    renderParamsManager();
    renderActiveParamsBar();
    renderMcpToolsList();
    updateTitleModelUI();

    fetchModelsList(false);
});

function renderPersonasManager() {
    const container = document.getElementById("personasContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!state.personas || state.personas.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No personas created yet. Click "Add Persona" to create one.</p>`;
        return;
    }

    state.personas.forEach((p, idx) => {
        const card = document.createElement("div");
        card.className = "p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 persona-card";
        card.dataset.personaId = p.id;

        let modelOptionsHtml = "";
        state.providers.forEach(prov => {
            const models = state.providerModels[prov.id] || ["gpt-4o", "gpt-4o-mini"];
            models.forEach(m => {
                const val = `${prov.id}:::${m}`;
                const sel = (p.providerId === prov.id && p.modelId === m) ? "selected" : "";
                modelOptionsHtml += `<option value="${val}" ${sel}>${escapeHtml(prov.name)} / ${escapeHtml(m)}</option>`;
            });
        });

        let paramsHtml = "";
        const pParams = p.params || [];

        pParams.forEach((param, pParamIdx) => {
            paramsHtml += `
                <div class="flex items-center gap-2 text-xs persona-param-row bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700" data-param-idx="${pParamIdx}">
                    <input type="checkbox" ${param.enabled !== false ? "checked" : ""} class="persona-param-enabled rounded text-sky-500 cursor-pointer" title="Enable parameter" />
                    <input type="text" value="${escapeHtml(param.name)}" placeholder="param name" class="persona-param-name flex-1 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs outline-none focus:border-sky-500" />
                    <input type="text" value="${escapeHtml(param.value)}" placeholder="value" class="persona-param-value w-24 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-center text-xs outline-none focus:border-sky-500" />
                    <button type="button" onclick="removePersonaParam('${p.id}', ${pParamIdx})" class="text-red-500 hover:text-red-600 p-1" title="Delete Parameter">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    Persona #${idx + 1}
                </span>
                <button type="button" onclick="removePersona('${p.id}')" class="text-red-500 hover:text-red-600 p-1 text-xs" title="Delete Persona">
                    <i class="fa-solid fa-trash-can"></i> Remove
                </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <label class="block text-[10px] text-slate-400 mb-0.5">Persona Name</label>
                    <input type="text" class="persona-name-input w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500" value="${escapeHtml(p.name)}" placeholder="e.g. Python Expert" />
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-0.5">Target Model</label>
                    <select class="persona-model-select w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500">
                        ${modelOptionsHtml}
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">System Prompt / Instructions</label>
                <div id="personaPromptBar_${p.id}" class="flex items-center gap-1 overflow-x-auto p-1.5 bg-slate-100 dark:bg-slate-800/95 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 select-none mb-1.5"></div>
                <div class="persona-prompt-editor markdown-body w-full p-3 min-h-[120px] max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 leading-relaxed text-xs text-slate-800 dark:text-slate-100" contenteditable="true" onkeydown="MarkdownEditor.handleKeyDown(event)" placeholder="You are an expert...">${MarkdownEditor.parseMarkdownWithMath(p.systemPrompt || "", { editable: true })}</div>
            </div>
            <div class="space-y-1.5 pt-1">
                <div class="flex items-center justify-between">
                    <label class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hyperparameters (Any Key/Value)</label>
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="addPersonaParamQuick('${p.id}', 'temperature', 0.7)" class="px-1.5 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 text-[10px] rounded">＋ Temp</button>
                        <button type="button" onclick="addPersonaParamQuick('${p.id}', 'top_p', 1.0)" class="px-1.5 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 text-[10px] rounded">＋ TopP</button>
                        <button type="button" onclick="addPersonaParamQuick('${p.id}', 'max_tokens', 4096)" class="px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] rounded">＋ MaxTok</button>
                    </div>
                </div>
                <div class="space-y-1.5 persona-params-container max-h-40 overflow-y-auto pr-1">
                    ${paramsHtml}
                </div>
                <div class="flex items-center gap-2 pt-1">
                    <input type="text" id="newPersonaParamName_${p.id}" placeholder="Param name (e.g. repetition_penalty)" class="flex-1 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono outline-none focus:border-sky-500" />
                    <input type="text" id="newPersonaParamVal_${p.id}" placeholder="Value (e.g. 1.2)" class="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center outline-none focus:border-sky-500" />
                    <button type="button" onclick="addCustomPersonaParam('${p.id}')" class="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-semibold transition">
                        Add
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
        const barEl = document.getElementById(`personaPromptBar_${p.id}`);
        if (barEl) {
            barEl.innerHTML = MarkdownEditor.renderToolbarHtml(`Persona_${p.id}_`);
        }
    });
}

function addNewPersonaUI() {
    readPersonasFromUI();
    const newId = "persona_" + Date.now();
    state.personas.push({
        id: newId,
        name: "New Persona",
        providerId: state.currentProviderId || state.providers[0]?.id || "",
        modelId: state.currentModel || "gpt-4o-mini",
        systemPrompt: "You are an expert assistant.",
        params: [
            { name: "temperature", value: 0.7, enabled: true },
            { name: "max_tokens", value: 4096, enabled: true }
        ]
    });
    renderPersonasManager();
}

function removePersona(id) {
    readPersonasFromUI();
    state.personas = state.personas.filter(p => p.id !== id);
    if (state.currentPersonaId === id) {
        state.currentPersonaId = null;
        localStorage.removeItem("ai_current_persona_id");
    }
    renderPersonasManager();
    updateModelButtonLabel();
    renderModelsDropdown();
    renderActiveParamsBar();
}

function addCustomPersonaParam(personaId) {
    readPersonasFromUI();
    const nameInput = document.getElementById(`newPersonaParamName_${personaId}`);
    const valInput = document.getElementById(`newPersonaParamVal_${personaId}`);
    if (!nameInput || !nameInput.value.trim()) return;
    const name = nameInput.value.trim();
    const rawVal = valInput ? valInput.value.trim() : "0";
    let value = rawVal;
    if (!isNaN(rawVal) && rawVal !== "") {
        value = Number(rawVal);
    } else if (rawVal.toLowerCase() === "true") {
        value = true;
    } else if (rawVal.toLowerCase() === "false") {
        value = false;
    }

    const p = state.personas.find(x => x.id === personaId);
    if (p) {
        if (!p.params) p.params = [];
        p.params.push({ name, value, enabled: true });
    }
    renderPersonasManager();
}

function addPersonaParamQuick(personaId, paramName, defaultVal) {
    readPersonasFromUI();
    const p = state.personas.find(x => x.id === personaId);
    if (p) {
        if (!p.params) p.params = [];
        if (!p.params.some(x => x.name === paramName)) {
            p.params.push({ name: paramName, value: defaultVal, enabled: true });
        }
    }
    renderPersonasManager();
}

function removePersonaParam(personaId, paramIdx) {
    readPersonasFromUI();
    const p = state.personas.find(x => x.id === personaId);
    if (p && p.params) {
        p.params.splice(paramIdx, 1);
    }
    renderPersonasManager();
}

function readPersonasFromUI() {
    const cards = document.querySelectorAll(".persona-card");
    const updated = [];
    cards.forEach(card => {
        const id = card.dataset.personaId;
        const name = card.querySelector(".persona-name-input")?.value.trim() || "Persona";
        const modelSelectVal = card.querySelector(".persona-model-select")?.value || "";
        let providerId = state.currentProviderId;
        let modelId = state.currentModel;
        if (modelSelectVal.includes(":::")) {
            const parts = modelSelectVal.split(":::");
            providerId = parts[0];
            modelId = parts[1];
        }
        const promptEl = card.querySelector(".persona-prompt-editor");
        const systemPrompt = promptEl ? MarkdownEditor.getEditorMarkdown(promptEl) : "";

        const paramRows = card.querySelectorAll(".persona-param-row");
        const params = [];
        paramRows.forEach(row => {
            const paramName = row.querySelector(".persona-param-name")?.value.trim() || "";
            if (!paramName) return;
            const enabled = row.querySelector(".persona-param-enabled")?.checked ?? true;
            const rawVal = row.querySelector(".persona-param-value")?.value.trim() ?? "";
            let value = rawVal;
            if (!isNaN(rawVal) && rawVal !== "") {
                value = Number(rawVal);
            } else if (rawVal.toLowerCase() === "true") {
                value = true;
            } else if (rawVal.toLowerCase() === "false") {
                value = false;
            }
            params.push({ name: paramName, value, enabled });
        });

        updated.push({
            id,
            name,
            providerId,
            modelId,
            systemPrompt,
            params
        });
    });
    if (updated.length > 0) {
        state.personas = updated;
    }
}

function selectPersona(personaId) {
    state.currentPersonaId = personaId;
    state.currentAgentId = null;
    localStorage.setItem("ai_current_persona_id", personaId);
    localStorage.removeItem("ai_current_agent_id");
    const drop = document.getElementById("modelDropdown");
    if (drop) drop.classList.add("hidden");
    updateModelButtonLabel();
    renderModelsDropdown();
    renderActiveParamsBar();
}

function renderAgentsManager() {
    const container = document.getElementById("agentsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (!state.agents || state.agents.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No script agents created yet. Click "Add Agent" to create one.</p>`;
        return;
    }

    state.agents.forEach((a, idx) => {
        const card = document.createElement("div");
        card.className = "p-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 agent-card";
        card.dataset.agentId = a.id;

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <i class="fa-solid fa-robot text-sky-500"></i> Agent #${idx + 1}
                </span>
                <button type="button" onclick="removeAgent('${a.id}')" class="text-red-500 hover:text-red-600 p-1 text-xs" title="Delete Agent">
                    <i class="fa-solid fa-trash-can"></i> Remove
                </button>
            </div>
            <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Agent Name</label>
                <input type="text" class="agent-name-input w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500" value="${escapeHtml(a.name)}" placeholder="e.g. Multi-Step Research Agent" />
            </div>
            <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Description</label>
                <input type="text" class="agent-desc-input w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500" value="${escapeHtml(a.description || '')}" placeholder="Brief description of what this agent does" />
            </div>
            <div>
                <div class="flex items-center justify-between mb-0.5">
                    <label class="block text-[10px] text-slate-400">Agent JavaScript Script (Variables: <code class="text-sky-500">conversation</code>, <code class="text-sky-500">messages</code> [conversation array], <code class="text-sky-500">userInput</code>. Function: <code class="text-sky-500">ask("model-ID", "provider", messagesOrPrompt)</code> supports full conversation arrays)</label>
                </div>
                <textarea class="agent-script-textarea w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 resize-y" rows="6" placeholder="// Write script here...
const reply = await ask('gpt-4o-mini', 'openai', 'Analyze: ' + userInput);
return reply;">${escapeHtml(a.script)}</textarea>
            </div>
        `;
        container.appendChild(card);
    });
}

function addNewAgentUI() {
    readAgentsFromUI();
    const newId = "agent_" + Date.now();
    state.agents.push({
        id: newId,
        name: "New Script Agent",
        description: "Executes a custom script",
        script: `// Entire conversation is available in 'messages' or 'conversation'.
// Use ask("model-ID", "provider", prompt) to call models.
const response = await ask("gpt-4o-mini", "openai", userInput);
return response;`
    });
    renderAgentsManager();
}

function removeAgent(id) {
    readAgentsFromUI();
    state.agents = state.agents.filter(a => a.id !== id);
    if (state.currentAgentId === id) {
        state.currentAgentId = null;
        localStorage.removeItem("ai_current_agent_id");
    }
    renderAgentsManager();
    updateModelButtonLabel();
    renderModelsDropdown();
    renderActiveParamsBar();
}

function readAgentsFromUI() {
    const cards = document.querySelectorAll(".agent-card");
    const updated = [];
    cards.forEach(card => {
        const id = card.dataset.agentId;
        const name = card.querySelector(".agent-name-input")?.value.trim() || "Agent";
        const description = card.querySelector(".agent-desc-input")?.value.trim() || "";
        const script = card.querySelector(".agent-script-textarea")?.value || "";
        updated.push({ id, name, description, script });
    });
    if (updated.length > 0 || cards.length === 0) {
        state.agents = updated;
    }
}

function selectAgent(agentId) {
    state.currentAgentId = agentId;
    state.currentPersonaId = null;
    localStorage.setItem("ai_current_agent_id", agentId);
    localStorage.removeItem("ai_current_persona_id");

    updateModelButtonLabel();
    const drop = document.getElementById("modelDropdown");
    if (drop) drop.classList.add("hidden");
    renderModelsDropdown();
    renderActiveParamsBar();
}

function renderProvidersListInSettings() {
    const container = document.getElementById("providersContainer");
    if (!container) return;
    container.innerHTML = "";

    state.providers.forEach((p, idx) => {
        const card = document.createElement("div");
        card.className =
            "p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 relative provider-card mb-3";
        card.dataset.providerId = p.id;

        card.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <i class="fa-solid fa-server text-sky-500"></i> Provider #${idx + 1}
                </span>
                ${
                    state.providers.length > 1
                        ? `<button onclick="removeProviderUI('${p.id}')" class="text-red-500 hover:text-red-600 p-1 text-xs" title="Remove Provider"><i class="fa-solid fa-trash-can"></i> Remove</button>`
                        : ""
                }
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                    <label class="block text-[10px] text-slate-400 mb-0.5">Provider Protocol</label>
                    <select class="provider-protocol-input w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500">
                        <option value="openai" ${p.protocol === "openai" ? "selected" : ""}>OpenAI Compatible</option>
                        <option value="anthropic" ${p.protocol === "anthropic" ? "selected" : ""}>OpenAI</option>
                        <option value="anthropic_direct" ${p.protocol === "anthropic_direct" ? "selected" : ""}>Anthropic</option>
                        <option value="google" ${p.protocol === "google" ? "selected" : ""}>Google</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-0.5">Provider Name</label>
                    <input type="text" class="provider-name-input w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500" value="${escapeHtml(p.name)}" placeholder="e.g. OpenAI / Grok" />
                </div>
                <div>
                    <label class="block text-[10px] text-slate-400 mb-0.5">Base URL Endpoint</label>
                    <input type="text" class="provider-url-input w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 font-mono" value="${escapeHtml(p.baseUrl)}" placeholder="https://api.openai.com/v1" />
                </div>
            </div>
            <div>
                <label class="block text-[10px] text-slate-400 mb-0.5">Auth ID / API Key (Encrypted)</label>
                <div class="relative flex items-center">
                    <input type="password" class="provider-key-input w-full pl-2.5 pr-8 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 font-mono" value="${escapeHtml(p.apiKey)}" placeholder="sk-... or AuthID" />
                    <button type="button" onclick="toggleKeyVisibility(this)" class="absolute right-2 text-slate-400 hover:text-slate-200 text-xs p-1">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function addNewProviderUI() {
    readProvidersFromUI();
    const newId = "prov_" + Date.now();
    state.providers.push({
        id: newId,
        name: `Provider ${state.providers.length + 1}`,
        protocol: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "",
    });
    renderProvidersListInSettings();
}

function removeProviderUI(id) {
    if (state.providers.length <= 1) return;
    readProvidersFromUI();
    state.providers = state.providers.filter((p) => p.id !== id);
    if (state.currentProviderId === id) {
        state.currentProviderId = state.providers[0].id;
    }
    renderProvidersListInSettings();
}

function readProvidersFromUI() {
    const cards = document.querySelectorAll(".provider-card");
    const updatedList = [];
    cards.forEach((card) => {
        const id = card.dataset.providerId;
        const protocol =
            card.querySelector(".provider-protocol-input")?.value || "openai";
        const name =
            card.querySelector(".provider-name-input")?.value.trim() ||
            "Provider";
        const baseUrl = normalizeBaseUrl(
            card.querySelector(".provider-url-input")?.value,
        );
        const apiKey =
            card.querySelector(".provider-key-input")?.value.trim() || "";
        updatedList.push({ id, protocol, name, baseUrl, apiKey });
    });
    if (updatedList.length > 0) {
        state.providers = updatedList;
    }
}

function switchSettingsTab(tabName) {
    const tabs = ["provider", "models", "personas", "agents", "system", "params", "mcp", "skills", "appearance", "reset"];
    tabs.forEach((t) => {
        const btn = document.getElementById(`tabBtn-${t}`);
        const content = document.getElementById(`tabContent-${t}`);
        if (btn && content) {
            if (t === tabName) {
                btn.className =
                    "settings-tab-btn w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition text-left bg-sky-500/10 text-sky-500 font-bold";
                content.classList.remove("hidden");
            } else {
                btn.className =
                    "settings-tab-btn w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition text-left text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800";
                content.classList.add("hidden");
            }
        }
    });
}

async function saveAllSettings() {
    readProvidersFromUI();
    readPersonasFromUI();
    readAgentsFromUI();

    if (!state.providers.some((p) => p.id === state.currentProviderId)) {
        state.currentProviderId = state.providers[0]?.id || "prov_default";
    }

    const sysPromptEl = document.getElementById("systemPromptInput");
    if (sysPromptEl) {
        state.systemPrompt = MarkdownEditor.getEditorMarkdown(sysPromptEl);
    }

    await saveProvidersToStorage();
    localStorage.setItem("ai_current_provider_id", state.currentProviderId);
    localStorage.setItem("ai_system_prompt", state.systemPrompt);
    localStorage.setItem("ai_personas", JSON.stringify(state.personas));
    localStorage.setItem("ai_agents", JSON.stringify(state.agents));
    if (state.currentPersonaId) {
        localStorage.setItem("ai_current_persona_id", state.currentPersonaId);
    } else {
        localStorage.removeItem("ai_current_persona_id");
    }
    if (state.currentAgentId) {
        localStorage.setItem("ai_current_agent_id", state.currentAgentId);
    } else {
        localStorage.removeItem("ai_current_agent_id");
    }

    const titleEnabledEl = document.getElementById("titleGenEnabled");
    if (titleEnabledEl) {
        state.titleGenEnabled = titleEnabledEl.checked;
        localStorage.setItem(
            "ai_title_gen_enabled",
            state.titleGenEnabled ? "true" : "false",
        );
    }
    const titlePromptEl = document.getElementById("titlePromptInput");
    if (titlePromptEl) {
        state.titlePrompt = titlePromptEl.value.trim();
        localStorage.setItem("ai_title_prompt", state.titlePrompt);
    }

    updateModelButtonLabel();
    updateTitleModelUI();
    toggleModal("settingsModal");
    fetchModelsList(true);
}

function toggleModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.toggle("hidden");
        if (id === "settingsModal" && !modal.classList.contains("hidden")) {
            const sysPromptEl = document.getElementById("systemPromptInput");
            if (sysPromptEl) {
                sysPromptEl.innerHTML = MarkdownEditor.parseMarkdownWithMath(state.systemPrompt || "You are a helpful assistant.", { editable: true });
            }
            const skillContentEl = document.getElementById("newSkillContent");
            if (skillContentEl) {
                skillContentEl.innerHTML = "";
            }
            updateTitleModelUI();
            renderPersonasManager();
            renderSkillsManager();
            const titlePromptEl = document.getElementById("titlePromptInput");
            if (titlePromptEl) titlePromptEl.value = state.titlePrompt || "";
            renderTitleModelDropdown();
        }
    }
}

function toggleDropdown(id) {
    const drop = document.getElementById(id);
    if (drop) {
        drop.classList.toggle("hidden");
        if (!drop.classList.contains("hidden") && id === "modelDropdown") {
            const searchInput = document.getElementById("modelSearchInput");
            if (searchInput) {
                searchInput.value = "";
                renderModelsDropdown();
                setTimeout(() => searchInput.focus(), 50);
            }
        }
        if (!drop.classList.contains("hidden") && id === "titleModelDropdown") {
            const searchInput = document.getElementById(
                "titleModelSearchInput",
            );
            if (searchInput) {
                searchInput.value = "";
                renderTitleModelDropdown();
                setTimeout(() => searchInput.focus(), 50);
            }
        }
    }
}

document.addEventListener("click", (e) => {
    const drop = document.getElementById("modelDropdown");
    const btn = document.getElementById("modelSelectBtn");
    if (
        drop &&
        !drop.classList.contains("hidden") &&
        btn &&
        !btn.contains(e.target) &&
        !drop.contains(e.target)
    ) {
        drop.classList.add("hidden");
    }

    const titleDrop = document.getElementById("titleModelDropdown");
    const titleBtn = document.getElementById("titleModelSelectBtn");
    if (
        titleDrop &&
        !titleDrop.classList.contains("hidden") &&
        titleBtn &&
        !titleBtn.contains(e.target) &&
        !titleDrop.contains(e.target)
    ) {
        titleDrop.classList.add("hidden");
    }

    const themeStyleDrop = document.getElementById("themeStyleDropdown");
    const themeStyleBtn = document.getElementById("themeStyleSelectBtn");
    if (
        themeStyleDrop &&
        !themeStyleDrop.classList.contains("hidden") &&
        themeStyleBtn &&
        !themeStyleBtn.contains(e.target) &&
        !themeStyleDrop.contains(e.target)
    ) {
        themeStyleDrop.classList.add("hidden");
    }

    const plusDrop = document.getElementById("plusMenuDropdown");
    if (
        plusDrop &&
        !plusDrop.classList.contains("hidden") &&
        !e.target.closest(".relative")
    ) {
        plusDrop.classList.add("hidden");
    }

    if (!e.target.closest(".relative")) {
        document.querySelectorAll(".edit-dropdown-menu, .copy-dropdown-menu").forEach((el) => el.classList.add("hidden"));
    }

    if (
        !e.target.closest(".slider-popup-container") &&
        !e.target.closest(".slider-trigger-text")
    ) {
        document
            .querySelectorAll(".slider-popup-widget")
            .forEach((el) => el.classList.add("hidden"));
    }
});

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("themeIcon").className = isDark
        ? "fa-solid fa-moon text-sm"
        : "fa-solid fa-sun text-sm";
    if (document.getElementById("themePreviewIcon")) {
        document.getElementById("themePreviewIcon").className = isDark
            ? "fa-solid fa-moon text-sky-500 text-lg"
            : "fa-solid fa-sun text-sky-500 text-lg";
    }
}

const themesList = [
    {
        name: "Pro",
        white: "#e0f2fe",
        whitePanel: "#f0f9ff",
        fontColor: "#0f172a",
        black: "#030712",
        blackPanel: "#0b1329",
        darkFontColor: "#f8fafc",
        font: "Inter, sans-serif",
        codeFont: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
        icon: "fa-solid fa-wand-magic-sparkles"
    },
    {
        name: "Normal",
        white: "#f3f4f6",
        whitePanel: "#ffffff",
        fontColor: "#111827",
        black: "#111827",
        blackPanel: "#1f2937",
        darkFontColor: "#f9fafb",
        font: "system-ui, -apple-system, sans-serif",
        codeFont: "monospace",
        icon: "fa-solid fa-circle-half-stroke"
    },
    {
        name: "Max",
        white: "#ffffff",
        whitePanel: "#f8fafc",
        fontColor: "#000000",
        black: "#000000",
        blackPanel: "#0a0a0a",
        darkFontColor: "#ffffff",
        font: "system-ui, sans-serif",
        codeFont: "monospace",
        icon: "fa-solid fa-circle"
    },
    {
        name: "Vintage",
        white: "#f7f3e8",
        whitePanel: "#f5f0e3",
        fontColor: "#262320",
        black: "#1c1a18",
        blackPanel: "#262320",
        darkFontColor: "#e8e2d0",
        font: "'Times New Roman', serif",
        codeFont: "'Courier Prime', Courier, monospace",
        icon: "fa-solid fa-scroll"
    }
];

function updateDynamicThemeStyles() {
    let styleTag = document.getElementById("dynamicThemeStyles");
    if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = "dynamicThemeStyles";
        document.head.appendChild(styleTag);
    }

    let css = "";
    themesList.forEach(t => {
        const id = t.name.toLowerCase();
        const wBg = t.white || "#ffffff";
        const wPanel = t.whitePanel || wBg;
        const wColor = t.fontColor || "#0f172a";
        const bBg = t.black || "#000000";
        const bPanel = t.blackPanel || bBg;
        const bColor = t.darkFontColor || "#f8fafc";
        const font = t.font || "inherit";
        const codeFont = t.codeFont || "monospace";

        css += `
            html.theme-${id} body {
                background-color: ${wBg} !important;
                color: ${wColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id} header,
            html.theme-${id} aside,
            html.theme-${id} div[class*="bg-white"],
            html.theme-${id} div[class*="bg-slate-50"],
            html.theme-${id} div[class*="bg-slate-100"],
            html.theme-${id} #settingsModal > div,
            html.theme-${id} #modelDropdown,
            html.theme-${id} #titleModelDropdown {
                background-color: ${wPanel} !important;
                color: ${wColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id} footer {
                background: linear-gradient(to top, ${wPanel} 0%, ${wPanel} 95%, transparent 100%) !important;
                color: ${wColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id} code,
            html.theme-${id} pre,
            html.theme-${id} kbd,
            html.theme-${id} samp {
                font-family: ${codeFont} !important;
            }

            html.theme-${id}.dark body {
                background-color: ${bBg} !important;
                color: ${bColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id}.dark header,
            html.theme-${id}.dark aside,
            html.theme-${id}.dark div[class*="bg-slate-900"],
            html.theme-${id}.dark div[class*="bg-slate-800"],
            html.theme-${id}.dark div[class*="bg-slate-950"],
            html.theme-${id}.dark div[class*="bg-white"],
            html.theme-${id}.dark div[class*="bg-slate-50"],
            html.theme-${id}.dark div[class*="bg-slate-100"],
            html.theme-${id}.dark #modelDropdown,
            html.theme-${id}.dark #titleModelDropdown,
            html.theme-${id}.dark #settingsModal > div {
                background-color: ${bPanel} !important;
                color: ${bColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id}.dark footer {
                background: linear-gradient(to top, ${bPanel} 0%, ${bPanel} 95%, transparent 100%) !important;
                color: ${bColor} !important;
                font-family: ${font} !important;
            }
            html.theme-${id}.dark code,
            html.theme-${id}.dark pre,
            html.theme-${id}.dark kbd,
            html.theme-${id}.dark samp {
                font-family: ${codeFont} !important;
            }
        `;
    });

    styleTag.textContent = css;
}

function setThemeStyle(style) {
    localStorage.setItem("ai_theme_style", style);
    applyThemeStyle(style);
}

function renderThemeStyleDropdown() {
    const container = document.getElementById("themeStyleOptionsList");
    if (!container) return;
    const currentStyle = (localStorage.getItem("ai_theme_style") || "pro").toLowerCase();

    container.innerHTML = themesList.map(t => {
        const id = t.name.toLowerCase();
        const isSelected = id === currentStyle;
        return `
            <button
                type="button"
                onclick="setThemeStyle('${id}')"
                id="styleOption-${id}"
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs ${isSelected ? 'font-semibold bg-sky-500/10 text-sky-500' : 'font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'} transition"
            >
                <span class="flex items-center gap-2">
                    <i class="${t.icon || 'fa-solid fa-palette'} ${isSelected ? 'text-sky-500' : 'text-slate-400'} text-xs"></i>
                    <span>${t.name}</span>
                </span>
                <i id="styleCheck-${id}" class="fa-solid fa-check text-xs text-sky-500 ${isSelected ? '' : 'hidden'}"></i>
            </button>
        `;
    }).join("");
}

function applyThemeStyle(style) {
    const styleId = (style || "pro").toLowerCase();
    localStorage.setItem("ai_theme_style", styleId);

    updateDynamicThemeStyles();

    themesList.forEach(t => {
        document.documentElement.classList.remove(`theme-${t.name.toLowerCase()}`);
    });
    document.documentElement.classList.add(`theme-${styleId}`);

    const themeObj = themesList.find(t => t.name.toLowerCase() === styleId) || themesList[0];
    const labelEl = document.getElementById("currentThemeStyleLabel");
    const iconEl = document.getElementById("currentThemeStyleIcon");
    if (labelEl) labelEl.textContent = themeObj.name;
    if (iconEl) iconEl.className = `${themeObj.icon || 'fa-solid fa-palette'} text-sky-500 text-xs`;

    renderThemeStyleDropdown();

    const drop = document.getElementById("themeStyleDropdown");
    if (drop && !drop.classList.contains("hidden")) {
        drop.classList.add("hidden");
    }
}

function clearChatHistory() {
    if (
        confirm(
            "Erase entire dashboard conversation memory? This resets all chats.",
        )
    ) {
        state.conversations = [];
        state.currentConvId = "";
        saveConversationsState();
        createNewConversation(true);
        toggleModal("settingsModal");
    }
}

// Normalizes whatever the user types into a Font Awesome class name.
// Accepts "temperature", "fa-temperature", "fa-solid fa-temperature", etc.
function normalizeIconName(raw) {
    if (!raw) return "";
    let s = String(raw).trim().toLowerCase().replace(/"/g, "");
    s = s.replace(
        /^(fa-solid|fas|fa-regular|far|fa-brands|fab|fa)\s+/,
        "",
    );
    if (!s) return "";
    return s.startsWith("fa-") ? s : "fa-" + s;
}

function getParamIcon(p) {
    if (!p) return "fa-sliders";
    const custom = normalizeIconName(p.icon);
    if (custom) return custom;

    const byName = {
        temperature: "fa-temperature-half",
        top_p: "fa-percent",
        max_tokens: "fa-coins",
        frequency_penalty: "fa-repeat",
        presence_penalty: "fa-star",
        reasoning_effort: "fa-brain",
        thinking: "fa-lightbulb",
    };
    if (byName[p.name]) return byName[p.name];

    const byType = {
        slider: "fa-sliders",
        dropdown: "fa-list",
        switch: "fa-toggle-on",
    };
    return byType[p.type] || "fa-sliders";
}

function previewNewParamIcon(raw) {
    const preview = document.getElementById("newParamIconPreview");
    if (!preview) return;
    const icon = normalizeIconName(raw);
    preview.innerHTML = `<i class="fa-solid ${icon || "fa-icons"} text-[10px]"></i>`;
}

// Tracks which icon chips in the chat footer are expanded
const expandedParamChips = new Set();

function toggleParamChip(id, event) {
    if (event) event.stopPropagation();
    if (expandedParamChips.has(id)) {
        expandedParamChips.delete(id);
    } else {
        expandedParamChips.add(id);
    }
    renderActiveParamsBar();
}

function toggleParamTypeFields() {
    const type = document.getElementById("newParamType").value;
    document.getElementById("fieldSlider").className =
        type === "slider" ? "grid grid-cols-3 gap-2" : "hidden";
    document.getElementById("fieldDropdown").className =
        type === "dropdown" ? "block" : "hidden";
}

const PARAM_PRESETS = {
    temperature: {
        prefix: "temp_",
        name: "temperature",
        type: "slider",
        icon: "fa-temperature-half",
        min: 0,
        max: 2,
        step: 0.1,
        value: 0.7,
        enabled: true,
        visible: true,
    },
    top_p: {
        prefix: "topp_",
        name: "top_p",
        type: "slider",
        icon: "fa-percent",
        min: 0,
        max: 1,
        step: 0.05,
        value: 1,
        enabled: true,
        visible: true,
    },
    max_tokens: {
        prefix: "maxtok_",
        name: "max_tokens",
        type: "slider",
        icon: "fa-coins",
        min: 1,
        max: 128000,
        step: 1,
        value: 4096,
        enabled: true,
        visible: true,
    },
    frequency_penalty: {
        prefix: "freq_",
        name: "frequency_penalty",
        type: "slider",
        icon: "fa-repeat",
        min: -2,
        max: 2,
        step: 0.1,
        value: 0,
        enabled: true,
        visible: false,
    },
    presence_penalty: {
        prefix: "pres_",
        name: "presence_penalty",
        type: "slider",
        icon: "fa-star",
        min: -2,
        max: 2,
        step: 0.1,
        value: 0,
        enabled: true,
        visible: false,
    },
    reasoning_effort: {
        prefix: "reason_",
        name: "reasoning_effort",
        type: "dropdown",
        icon: "fa-brain",
        options: ["max", "high", "medium", "low", "none"],
        value: "medium",
        enabled: true,
        visible: true,
    },
    thinking: {
        prefix: "think_",
        name: "thinking",
        type: "switch",
        icon: "fa-lightbulb",
        value: true,
        enabled: true,
        visible: true,
    },
};

function addPresetParam(presetName) {
    const preset = PARAM_PRESETS[presetName];
    if (!preset) return;

    const { prefix, ...rest } = preset;
    const id = prefix + Date.now();

    if (state.customParams.some((p) => p.name === rest.name)) {
        const existing = state.customParams.find((p) => p.name === rest.name);
        existing.enabled = true;
        saveCustomParamsState();
        return;
    }

    state.customParams.push({ id, ...rest });
    saveCustomParamsState();
}

function saveNewParam() {
    const name = document.getElementById("newParamName").value.trim();
    const type = document.getElementById("newParamType").value;
    if (!name) return;

    let param = {
        id: "p_" + Date.now(),
        name,
        type,
        icon:
            normalizeIconName(
                document.getElementById("newParamIcon")?.value || "",
            ) || "",
        enabled: true,
        visible: true,
    };
    if (type === "slider") {
        param.min = parseFloat(document.getElementById("paramMin").value) || 0;
        param.max = parseFloat(document.getElementById("paramMax").value) || 1;
        param.step = 0.1;
        param.value =
            parseFloat(document.getElementById("paramVal").value) || 0.7;
    } else if (type === "dropdown") {
        const opts = document
            .getElementById("paramOptions")
            .value.split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        param.options = opts.length ? opts : ["default"];
        param.value = param.options[0];
    } else if (type === "switch") {
        param.value = true;
    }

    state.customParams.push(param);
    document.getElementById("newParamName").value = "";
    const iconInput = document.getElementById("newParamIcon");
    if (iconInput) iconInput.value = "";
    previewNewParamIcon("");
    saveCustomParamsState();
}

function updateParamIcon(id, rawIcon) {
    const p = state.customParams.find((item) => item.id === id);
    if (!p) return;
    p.icon = normalizeIconName(rawIcon);
    localStorage.setItem(
        "ai_custom_params",
        JSON.stringify(state.customParams),
    );

    const row = document.querySelector(`[data-param-id="${id}"]`);
    if (row) {
        const preview = row.querySelector(".param-icon-preview");
        if (preview) preview.className = `param-icon-preview fa-solid ${getParamIcon(p)}`;
    }
    renderActiveParamsBar();
}

function removeParam(id) {
    state.customParams = state.customParams.filter((p) => p.id !== id);
    saveCustomParamsState();
}

function toggleParamEnabled(id) {
    const p = state.customParams.find((item) => item.id === id);
    if (p) {
        p.enabled = !p.enabled;
        saveCustomParamsState();
    }
}

// Toggles whether a parameter's control is shown in the chat footer.
// Hiding it does NOT stop it from being sent to the API — the value can
// still be set from Settings, which keeps the chat bar compact.
function toggleParamVisibility(id) {
    const p = state.customParams.find((item) => item.id === id);
    if (p) {
        p.visible = p.visible === false ? true : false;
        localStorage.setItem(
            "ai_custom_params",
            JSON.stringify(state.customParams),
        );
        renderParamsManager();
        renderActiveParamsBar();
    }
}

function updateParamValue(id, value) {
    const p = state.customParams.find((item) => item.id === id);
    if (p) {
        p.value = p.type === "slider" ? parseFloat(value) : value;
        localStorage.setItem(
            "ai_custom_params",
            JSON.stringify(state.customParams),
        );
        const readout = document.getElementById(`valReadout_${id}`);
        if (readout) readout.innerText = p.value;

        // Keep the matching settings row input in sync without stealing focus
        const row = document.querySelector(`[data-param-id="${id}"]`);
        if (row && p.type === "slider") {
            const range = row.querySelector('input[type="range"]');
            const num = row.querySelector('input[type="number"]');
            if (range && document.activeElement !== range) range.value = p.value;
            if (num && document.activeElement !== num) num.value = p.value;
        }
    }
}

function updateParamValueFromSettings(id, value) {
    updateParamValue(id, value);
    renderActiveParamsBar();
}

function toggleParamSwitchValue(id) {
    const p = state.customParams.find((item) => item.id === id);
    if (p && p.type === "switch") {
        p.value = !p.value;
        localStorage.setItem(
            "ai_custom_params",
            JSON.stringify(state.customParams),
        );
        renderParamsManager();
        renderActiveParamsBar();
    }
}

function toggleSliderPopup(id, event) {
    event.stopPropagation();
    document.querySelectorAll(".slider-popup-widget").forEach((el) => {
        if (el.id !== `sliderPopup_${id}`) el.classList.add("hidden");
    });
    const popup = document.getElementById(`sliderPopup_${id}`);
    if (popup) {
        popup.classList.toggle("hidden");
    }
}

function saveCustomParamsState() {
    localStorage.setItem(
        "ai_custom_params",
        JSON.stringify(state.customParams),
    );
    renderParamsManager();
    renderActiveParamsBar();
}

function renderParamsManager() {
    const list = document.getElementById("paramsList");
    if (!list) return;
    list.innerHTML = "";

    if (state.customParams.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-slate-400 italic">No custom API parameters defined yet.</p>`;
        return;
    }

    state.customParams.forEach((p) => {
        const row = document.createElement("div");
        row.className =
            "p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 space-y-1.5";
        row.dataset.paramId = p.id;

        const isVisible = p.visible !== false;

        let valueControl = "";
        if (p.type === "slider") {
            valueControl = `
                <div class="flex items-center gap-2">
                    <input type="range" min="${p.min}" max="${p.max}" step="${p.step || 0.1}" value="${p.value}" oninput="updateParamValueFromSettings('${p.id}', this.value)" class="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                    <input type="number" min="${p.min}" max="${p.max}" step="${p.step || 0.1}" value="${p.value}" oninput="updateParamValueFromSettings('${p.id}', this.value)" class="w-16 px-1.5 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center" />
                </div>
            `;
        } else if (p.type === "dropdown") {
            const optsHtml = (p.options || [])
                .map(
                    (o) =>
                        `<option value="${escapeHtml(o)}" ${o === p.value ? "selected" : ""}>${escapeHtml(o)}</option>`,
                )
                .join("");
            valueControl = `
                <select onchange="updateParamValueFromSettings('${p.id}', this.value)" class="w-full px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono">
                    ${optsHtml}
                </select>
            `;
        } else if (p.type === "switch") {
            valueControl = `
                <button type="button" onclick="toggleParamSwitchValue('${p.id}')" class="px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${p.value ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}">
                    ${p.value ? "TRUE" : "FALSE"}
                </button>
            `;
        }

        row.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 truncate">
                    <input type="checkbox" ${p.enabled ? "checked" : ""} onchange="toggleParamEnabled('${p.id}')" class="rounded text-sky-500 cursor-pointer" title="Send this parameter to the API" />
                    <span class="font-bold font-mono text-sky-500 truncate">${escapeHtml(p.name)}</span>
                    <span class="text-[10px] text-slate-400">(${escapeHtml(p.type)})</span>
                </div>
                <div class="flex items-center gap-0.5 flex-shrink-0">
                    <button onclick="toggleParamVisibility('${p.id}')" class="p-1 rounded transition ${isVisible ? "text-sky-500 hover:text-sky-600" : "text-slate-400 hover:text-slate-300"}" title="${isVisible ? "Shown in chat — click to hide (value is still sent to the API)" : "Hidden from chat — value is still sent to the API. Click to show"}">
                        <i class="fa-solid ${isVisible ? "fa-eye" : "fa-eye-slash"}"></i>
                    </button>
                    <button onclick="removeParam('${p.id}')" class="text-red-500 hover:text-red-600 p-1" title="Delete Parameter"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            <div class="pl-5 space-y-1.5">
                ${valueControl}
                <div class="flex items-center gap-2">
                    <span class="flex items-center justify-center w-6 h-6 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sky-500 flex-shrink-0">
                        <i class="param-icon-preview fa-solid ${getParamIcon(p)}"></i>
                    </span>
                    <input type="text" value="${escapeHtml(p.icon || "")}" placeholder="icon e.g. fa-bolt" oninput="updateParamIcon('${p.id}', this.value)" class="flex-1 px-2 py-0.5 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono" title="Font Awesome icon name" />
                </div>
            </div>
        `;
        list.appendChild(row);
    });

    if (list.parentElement) {
        const note = list.parentElement.querySelector(".params-eye-hint");
        if (!note) {
            const hint = document.createElement("p");
            hint.className =
                "params-eye-hint text-[10px] text-slate-400 italic";
            hint.innerHTML =
                '<i class="fa-solid fa-eye text-[9px]"></i> Eye = show control in chat. Winking = hidden from chat but still sent to the API. Set values here in Settings to save space.';
            list.parentElement.insertBefore(hint, list.nextSibling);
        }
    }
}

function renderActiveParamsBar() {
    const container = document.getElementById("activeParamsContainer");
    if (!container) return;
    container.innerHTML = "";

    if (state.currentPersonaId) {
        container.classList.add("hidden");
        return;
    }

    const activeParams = state.customParams.filter(
        (p) => p.enabled && p.visible !== false,
    );
    if (activeParams.length === 0) {
        container.classList.add("hidden");
        return;
    }
    container.classList.remove("hidden");

    activeParams.forEach((p) => {
        const isExpanded = expandedParamChips.has(p.id);
        const icon = getParamIcon(p);

        const item = document.createElement("div");
        item.className =
            "flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono shadow-xs relative slider-popup-container transition";

        let controlHtml = "";
        let valueText = p.value;
        if (p.type === "slider") {
            controlHtml = `
                <div class="flex items-center gap-2">
                    <input type="range" min="${p.min}" max="${p.max}" step="${p.step || 0.1}" value="${p.value}" oninput="updateParamValue('${p.id}', this.value)" class="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500" />
                    <span class="text-[11px] font-bold text-slate-700 dark:text-slate-200 w-10 text-right" id="valReadout_${p.id}">${p.value}</span>
                </div>
            `;
        } else if (p.type === "dropdown") {
            const optsHtml = (p.options || [])
                .map(
                    (o) =>
                        `<option value="${escapeHtml(o)}" ${o === p.value ? "selected" : ""}>${escapeHtml(o)}</option>`,
                )
                .join("");
            controlHtml = `
                <select onchange="updateParamValueFromSettings('${p.id}', this.value)" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-200 outline-none cursor-pointer shadow-xs focus:border-indigo-500 transition">
                    ${optsHtml}
                </select>
            `;
            valueText = p.value;
        } else if (p.type === "switch") {
            controlHtml = `
                <button type="button" onclick="toggleParamSwitchValue('${p.id}')" class="px-2.5 py-1 rounded-lg text-[10px] font-bold transition shadow-xs cursor-pointer ${p.value ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}">
                    ${p.value ? "TRUE" : "FALSE"}
                </button>
            `;
            valueText = p.value ? "TRUE" : "FALSE";
        }

        item.innerHTML = `
            <button type="button" onclick="toggleParamChip('${p.id}', event)" class="flex items-center justify-center gap-1.5 h-7 px-2 rounded-xl text-sky-500 hover:text-sky-600 ${isExpanded ? "" : "hover:bg-slate-200 dark:hover:bg-slate-700"}" title="${escapeHtml(p.name)} = ${escapeHtml(String(valueText))}">
                <i class="fa-solid ${icon} text-xs pointer-events-none"></i>
                ${isExpanded ? `<span class="text-[11px] font-bold pointer-events-none">${escapeHtml(p.name)}</span><i class="fa-solid fa-chevron-down text-[9px] opacity-60 pointer-events-none"></i>` : ""}
            </button>
            <div class="${isExpanded ? "flex" : "hidden"} items-center gap-2 pr-2">
                ${controlHtml}
            </div>
        `;

        container.appendChild(item);
    });
}

async function fetchModelsList(force = false) {
    const icon = document.getElementById("refreshModelsIcon");
    if (icon) icon.classList.add("fa-spin");

    const defaultFallback = [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "claude-3-5-sonnet",
        "deepseek-r1",
    ];

    for (const prov of state.providers) {
        if (
            state.providerModels[prov.id] &&
            state.providerModels[prov.id].length > 0 &&
            !force
        ) {
            continue;
        }

        let matchedPresetModels = [];
        for (const key in PROVIDER_PRESETS) {
            if (
                prov.name.toLowerCase() ===
                PROVIDER_PRESETS[key].name.toLowerCase()
            ) {
                matchedPresetModels = PROVIDER_PRESETS[key].models;
                break;
            }
        }

        if (
            prov.apiKey &&
            prov.name.toLowerCase() !== "puter.js"
        ) {
            try {
                const proto = (prov.protocol || "openai").toLowerCase();
                const base = normalizeBaseUrl(prov.baseUrl);
                let url = `${base}/models`;
                let headers = {};

                if (proto === "anthropic" || proto === "anthropic_direct") {
                    headers = {
                        "x-api-key": prov.apiKey,
                        "anthropic-version": "2023-06-01",
                        "anthropic-dangerous-direct-browser-access": "true"
                    };
                } else if (proto === "google") {
                    url = `${base}/models?key=${prov.apiKey}`;
                    headers = {
                        "x-goog-api-key": prov.apiKey
                    };
                } else {
                    headers = {
                        Authorization: `Bearer ${prov.apiKey}`
                    };
                }

                const res = await fetch(url, { headers });

                if (res.ok) {
                    const data = await res.json();
                    if (proto === "google") {
                        if (data && data.models && Array.isArray(data.models)) {
                            state.providerModels[prov.id] = data.models
                                .map((m) => m.baseModelId || (m.name ? m.name.replace(/^models\//, "") : ""))
                                .filter(Boolean)
                                .sort();
                            continue;
                        }
                    } else {
                        if (data && data.data && Array.isArray(data.data)) {
                            state.providerModels[prov.id] = data.data
                                .map((m) => m.id)
                                .filter(Boolean)
                                .sort();
                            continue;
                        }
                    }
                }
            } catch (e) {
                console.warn(`Failed fetching models for ${prov.name}:`, e);
            }
        }

        state.providerModels[prov.id] =
            matchedPresetModels.length > 0
                ? matchedPresetModels
                : defaultFallback;
    }

    renderModelsDropdown();
    renderTitleModelDropdown();
    if (icon) icon.classList.remove("fa-spin");
}

const DEFAULT_TITLE_PROMPT =
    "Generate a concise title (max 6 words) for a conversation that starts with the following message. Reply with the title only, without quotes or punctuation at the end.";

function getTitleGenerationTarget() {
    if (!state.titleModel) {
        return { provider: getActiveProvider(), model: state.currentModel };
    }
    const provider =
        state.providers.find((p) => p.id === state.titleProviderId) ||
        getActiveProvider();
    return { provider, model: state.titleModel };
}

function updateTitleModelUI() {
    const enabledEl = document.getElementById("titleGenEnabled");
    if (enabledEl) enabledEl.checked = !!state.titleGenEnabled;

    const labelEl = document.getElementById("titleModelLabel");
    if (labelEl) {
        if (state.titleModel) {
            const prov = state.providers.find(
                (p) => p.id === state.titleProviderId,
            );
            labelEl.innerHTML = `<strong class="font-bold">${escapeHtml(prov ? prov.name : "Model")}</strong> <span class="font-normal opacity-90">${escapeHtml(state.titleModel)}</span>`;
        } else {
            labelEl.innerText = "Chat Model (Default)";
        }
    }

    const checkEl = document.getElementById("titleModelDefaultCheck");
    if (checkEl) checkEl.classList.toggle("hidden", !!state.titleModel);
}

function renderTitleModelDropdown() {
    const listEl = document.getElementById("titleModelList");
    const countEl = document.getElementById("titleModelCountLabel");
    const searchInput = document.getElementById("titleModelSearchInput");
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";
    if (!listEl) return;

    let totalCount = 0;
    listEl.innerHTML = "";

    state.providers.forEach((prov) => {
        const models = state.providerModels[prov.id] || [];
        const matchingModels = models.filter(
            (modelId) =>
                modelId.toLowerCase().includes(searchTerm) ||
                prov.name.toLowerCase().includes(searchTerm),
        );

        totalCount += matchingModels.length;

        const groupContainer = document.createElement("div");
        groupContainer.className = "space-y-1 mb-2";

        const header = document.createElement("div");
        header.className =
            "px-2 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/60 rounded-lg";
        header.innerText = prov.name;
        groupContainer.appendChild(header);

        if (matchingModels.length === 0) {
            const emptyEl = document.createElement("div");
            emptyEl.className =
                "p-2 text-center text-[11px] text-slate-400 italic";
            emptyEl.innerText = "No models found";
            groupContainer.appendChild(emptyEl);
        } else {
            matchingModels.forEach((modelId) => {
                const isSelected =
                    prov.id === state.titleProviderId &&
                    modelId === state.titleModel;

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = `w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSelected ? "bg-sky-500/10 text-sky-500 font-semibold" : "text-slate-700 dark:text-slate-300"}`;

                btn.innerHTML = `
                    <span class="truncate">
                        <strong class="font-bold mr-1">${escapeHtml(prov.name)}</strong>
                        <span class="font-normal opacity-90">${escapeHtml(modelId)}</span>
                    </span>
                    ${isSelected ? '<i class="fa-solid fa-check text-xs text-sky-500"></i>' : ""}
                `;
                btn.onclick = () => selectTitleModel(prov.id, modelId);
                groupContainer.appendChild(btn);
            });
        }

        listEl.appendChild(groupContainer);
    });

    if (state.providers.length === 0) {
        listEl.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 italic">No providers available</div>`;
    }

    if (countEl) countEl.innerText = `Models (${totalCount})`;
    updateTitleModelUI();
}

function selectTitleModel(providerId, modelId) {
    state.titleProviderId = providerId;
    state.titleModel = modelId;
    localStorage.setItem("ai_title_provider_id", providerId);
    localStorage.setItem("ai_title_model", modelId);

    const drop = document.getElementById("titleModelDropdown");
    if (drop) drop.classList.add("hidden");
    updateTitleModelUI();
    renderTitleModelDropdown();
}

function parseToolResultContent(result) {
    if (result === undefined || result === null) return "";
    if (typeof result === "string") return result;

    let target = result;
    if (target.result !== undefined) {
        target = target.result;
    }

    if (typeof target === "string") return target;

    if (target && typeof target === "object") {
        if (target.error) {
            return typeof target.error === "string" ? target.error : JSON.stringify(target.error);
        }
        const content = target.content;
        if (Array.isArray(content)) {
            return content.map(item => {
                if (typeof item === "string") return item;
                if (item && typeof item === "object") {
                    if (typeof item.text === "string") return item.text;
                    if (typeof item.data === "string") return item.data;
                    if (typeof item.content === "string") return item.content;
                }
                return JSON.stringify(item);
            }).filter(Boolean).join("\n");
        }
        if (typeof content === "string") return content;

        if (typeof target.text === "string") return target.text;
        if (typeof target.output === "string") return target.output;
        if (typeof target.message === "string") return target.message;
        if (typeof target.data === "string") return target.data;
    }

    try {
        return JSON.stringify(result);
    } catch (e) {
        return String(result);
    }
}

function prepareLLMRequest(provider, model, messages, tools, stream = false, maxTokens = 4096) {
    const proto = (provider.protocol || "openai").toLowerCase();
    const base = normalizeBaseUrl(provider.baseUrl);
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const nonSystem = messages.filter(m => m.role !== "system");

    if (proto === "anthropic" || proto === "anthropic_direct") {
        const url = `${base}/messages`;
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": provider.apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        };
        const body = {
            model: model,
            max_tokens: maxTokens,
            ...(systemMsg ? { system: systemMsg } : {}),
            messages: nonSystem.map(m => {
                const contentBlocks = [];
                const rawContent = m.content;
                if (typeof rawContent === "string") {
                    contentBlocks.push({ type: "text", text: rawContent });
                } else if (Array.isArray(rawContent)) {
                    rawContent.forEach(item => {
                        if (item.type === "text") {
                            contentBlocks.push({ type: "text", text: item.text });
                        } else if (item.type === "image_url") {
                            const urlStr = item.image_url?.url || "";
                            if (urlStr.startsWith("data:")) {
                                const parts = urlStr.split(",");
                                const mimeMatch = parts[0].match(/:(.*?);/);
                                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                                const base64Data = parts[1] || "";
                                contentBlocks.push({
                                    type: "image",
                                    source: {
                                        type: "base64",
                                        media_type: mimeType,
                                        data: base64Data
                                    }
                                });
                            }
                        } else if (item.type === "document") {
                            contentBlocks.push(item);
                        }
                    });
                }
                if (m.attachments && Array.isArray(m.attachments)) {
                    m.attachments.forEach(f => {
                        if (f.isImage && f.dataUrl) {
                            const parts = f.dataUrl.split(",");
                            const mimeMatch = parts[0].match(/:(.*?);/);
                            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                            const base64Data = parts[1] || "";
                            contentBlocks.push({
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: mimeType,
                                    data: base64Data
                                }
                            });
                        } else {
                            const textContent = f.content || "";
                            const base64Data = btoa(unescape(encodeURIComponent(textContent)));
                            contentBlocks.push({
                                type: "document",
                                source: {
                                    type: "base64",
                                    media_type: f.type || "text/plain",
                                    data: base64Data
                                },
                                title: f.name || "file"
                            });
                        }
                    });
                }
                if (contentBlocks.length === 0) {
                    contentBlocks.push({ type: "text", text: "" });
                }
                return {
                    role: m.role,
                    content: contentBlocks
                };
            }),
            ...(tools && tools.length > 0 ? {
                tools: tools.map(t => ({
                    name: t.function?.name || t.name,
                    description: t.function?.description || t.description || "",
                    input_schema: t.function?.parameters || t.input_schema || { type: "object", properties: {} }
                }))
            } : {}),
            stream: stream
        };
        return { url, headers, body, proto };
    } else if (proto === "google") {
        const url = stream
            ? `${base}/models/${model}:streamGenerateContent?alt=sse&key=${provider.apiKey}`
            : `${base}/models/${model}:generateContent?key=${provider.apiKey}`;
        const headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": provider.apiKey
        };
        const body = {
            ...(systemMsg ? { systemInstruction: { parts: [{ text: systemMsg }] } } : {}),
            contents: nonSystem.map(m => {
                const parts = [];
                const rawContent = m.content;
                if (typeof rawContent === "string") {
                    parts.push({ text: rawContent });
                } else if (Array.isArray(rawContent)) {
                    rawContent.forEach(item => {
                        if (item.type === "text") {
                            parts.push({ text: item.text });
                        } else if (item.type === "image_url") {
                            const urlStr = item.image_url?.url || "";
                            if (urlStr.startsWith("data:")) {
                                const splitParts = urlStr.split(",");
                                const mimeMatch = splitParts[0].match(/:(.*?);/);
                                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                                const base64Data = splitParts[1] || "";
                                parts.push({
                                    inlineData: {
                                        mimeType: mimeType,
                                        data: base64Data
                                    }
                                });
                            }
                        }
                    });
                }
                if (m.attachments && Array.isArray(m.attachments)) {
                    m.attachments.forEach(f => {
                        if (f.isImage && f.dataUrl) {
                            const splitParts = f.dataUrl.split(",");
                            const mimeMatch = splitParts[0].match(/:(.*?);/);
                            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                            const base64Data = splitParts[1] || "";
                            parts.push({
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            });
                        } else {
                            const textContent = f.content || "";
                            const base64Data = btoa(unescape(encodeURIComponent(textContent)));
                            parts.push({ text: `File: ${f.name}` });
                            parts.push({
                                inlineData: {
                                    mimeType: f.type || "text/plain",
                                    data: base64Data
                                }
                            });
                        }
                    });
                }
                if (parts.length === 0) {
                    parts.push({ text: "" });
                }
                return {
                    role: m.role === "assistant" ? "model" : "user",
                    parts: parts
                };
            }),
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: maxTokens
            }
        };
        return { url, headers, body, proto };
    } else {
        const url = `${base}/chat/completions`;
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${provider.apiKey}`
        };
        const formattedMessages = messages.map(m => {
            let content = m.content;
            if (m.attachments && Array.isArray(m.attachments) && m.attachments.length > 0) {
                if (!Array.isArray(content)) {
                    content = content ? [{ type: "text", text: content }] : [];
                } else {
                    content = [...content];
                }
                m.attachments.forEach(f => {
                    if (f.isImage && f.dataUrl) {
                        content.push({
                            type: "image_url",
                            image_url: { url: f.dataUrl }
                        });
                    } else if (f.content) {
                        content.push({
                            type: "text",
                            text: `Attached File (${f.name}):\n${f.content}`
                        });
                    }
                });
            }
            const msgObj = {
                role: m.role,
                content: content
            };
            if (m.tool_calls) {
                msgObj.tool_calls = m.tool_calls;
            }
            if (m.tool_call_id) {
                msgObj.tool_call_id = m.tool_call_id;
            }
            if (m.name) {
                msgObj.name = m.name;
            }
            return msgObj;
        });
        const body = {
            model: model,
            messages: formattedMessages,
            ...(tools && tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
            stream: stream,
            max_tokens: maxTokens
        };
        return { url, headers, body, proto };
    }
}

function parseLLMResponse(data, proto) {
    if (proto === "anthropic" || proto === "anthropic_direct") {
        if (data?.content && Array.isArray(data.content)) {
            return data.content.map(c => c.text || "").join("");
        }
        return data?.completion || "";
    } else if (proto === "google") {
        const parts = data?.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
            return parts.map(p => p.text || "").join("");
        }
        return "";
    } else {
        const messageObj = data?.choices?.[0]?.message || {};
        return messageObj.content || messageObj.reasoning || messageObj.thinking || "";
    }
}

function parseStreamingDelta(json, proto, newAssistantNode) {
    if (proto === "anthropic" || proto === "anthropic_direct") {
        if (json.type === "content_block_delta" && json.delta?.text) {
            newAssistantNode.content += json.delta.text;
        } else if (json.delta?.thinking) {
            newAssistantNode.reasoning_content += json.delta.thinking;
        }
    } else if (proto === "google") {
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
            newAssistantNode.content += text;
        }
    } else {
        const delta = json.choices?.[0]?.delta || {};
        if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
                if (!newAssistantNode.tool_calls) newAssistantNode.tool_calls = [];
                const idx = tc.index !== undefined ? tc.index : 0;
                if (!newAssistantNode.tool_calls[idx]) {
                    newAssistantNode.tool_calls[idx] = {
                        id: tc.id || `call_${Math.random().toString(36).substring(2, 11)}`,
                        type: "function",
                        function: { name: "", arguments: "" }
                    };
                }
                if (tc.id) newAssistantNode.tool_calls[idx].id = tc.id;
                if (!newAssistantNode.tool_calls[idx].id) {
                    newAssistantNode.tool_calls[idx].id = `call_${Math.random().toString(36).substring(2, 11)}`;
                }
                if (tc.function?.name) newAssistantNode.tool_calls[idx].function.name += tc.function.name;
                if (tc.function?.arguments) newAssistantNode.tool_calls[idx].function.arguments += tc.function.arguments;
            }
        }
        if (delta.reasoning_content || delta.reasoning || delta.thinking) {
            newAssistantNode.reasoning_content += (delta.reasoning_content || delta.reasoning || delta.thinking);
            scheduleChatRender();
        }
        if (delta.content) {
            newAssistantNode.content += delta.content;
        }
    }

    if (newAssistantNode.content && (newAssistantNode.content.includes("<think>") || newAssistantNode.content.includes("<thought>"))) {
        const thinkRegex = /<(?:think|thought)>([\s\S]*?)(?:<\/(?:think|thought)>|$)/gi;
        let match;
        while ((match = thinkRegex.exec(newAssistantNode.content)) !== null) {
            if (match[1]) {
                newAssistantNode.reasoning_content = (newAssistantNode.reasoning_content || "") + match[1];
            }
        }
        newAssistantNode.content = newAssistantNode.content.replace(/<(?:think|thought)>[\s\S]*?(?:<\/(?:think|thought)>|$)/gi, "").trim();
    }
}

async function generateConversationTitle(conv, userText) {
    if (!state.titleGenEnabled || !conv) return;

    let cleanText = "";
    if (typeof userText === "string") {
        cleanText = userText.trim();
    } else if (Array.isArray(userText)) {
        cleanText = userText
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join(" ")
            .trim();
    }
    if (!cleanText) return;

    const { provider, model } = getTitleGenerationTarget();
    if (!provider || !model) return;
    if (!provider.apiKey && provider.name.toLowerCase() !== "puter.js") return;

    const userPrompt = (state.titlePrompt || "").trim() ||
        "Generate a concise, professional title (max 5 words) based on the user's message. Output ONLY the title text. Do not include quotes, greetings, explanations, or punctuation at the end.";

    const messages = [
        { role: "system", content: userPrompt },
        { role: "user", content: cleanText.slice(0, 2000) },
    ];
    const originalTitle = conv.title;

    let rawTitle = "";

    try {
        if (provider.name.toLowerCase() === "puter.js") {
            const response = await PuterSDKBridge.chatCompletion(
                model,
                messages,
                { stream: false },
            );
            rawTitle = response?.choices?.[0]?.message?.content || "";
        } else {
            const req = prepareLLMRequest(provider, model, messages, null, false, 50);
            const response = await fetch(
                req.url,
                {
                    method: "POST",
                    headers: req.headers,
                    body: JSON.stringify(req.body),
                },
            );

            if (response.ok) {
                const data = await response.json();
                rawTitle = parseLLMResponse(data, req.proto);
            }
        }
    } catch (e) {
        // Fallback silently on network errors
    }

    let cleaned = rawTitle.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    cleaned = cleaned
        .replace(/^(here is a title:|title:|the user says.*?:|sure,.*?:|the user wants.*?:|we need to.*?[:\.]|let's.*?:)/gi, "")
        .replace(/^["'`#*\s]+|["'`*\s]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();

    const isThoughtContaminated =
        !cleaned ||
        cleaned.toLowerCase().includes("the user") ||
        cleaned.toLowerCase().includes("we need") ||
        cleaned.toLowerCase().includes("help me") ||
        cleaned.length > 40 ||
        cleaned.split(/\s+/).length > 6;

    let finalTitle = "";

    if (isThoughtContaminated) {
        let fallbackText = cleanText
            .replace(/^(hello|hi|hey|greetings|good\s+(morning|afternoon|evening))[\s,!.]*/i, "")
            .replace(/^(can|could|would|will)\s+(you\s+)?(please\s+)?(help\s+me\s+)?(with\s+)?/i, "")
            .trim();

        if (!fallbackText) fallbackText = cleanText;

        const words = fallbackText.split(/\s+/);
        finalTitle = words.slice(0, 4).join(" ");
        if (words.length > 4) finalTitle += "...";
    } else {
        finalTitle = cleaned;
    }

    if (!finalTitle) finalTitle = "New Conversation";

    finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);

    const liveConv = state.conversations.find((c) => c.id === conv.id);
    if (!liveConv) return;
    if (liveConv.title !== originalTitle && liveConv.title !== "Untitled Chat") return;

    liveConv.title = finalTitle;
    saveConversationsState();
    renderSidebarConversations();
    if (state.currentConvId === liveConv.id) {
        document.title = finalTitle;
    }
}

let modelDropdownMode = "models"; // "models", "personas", or "agents"

function setModelDropdownMode(mode) {
    modelDropdownMode = mode;
    const btnModels = document.getElementById("modelModeBtn-models");
    const btnPersonas = document.getElementById("modelModeBtn-personas");
    const btnAgents = document.getElementById("modelModeBtn-agents");
    const searchInput = document.getElementById("modelSearchInput");

    if (btnModels && btnPersonas && btnAgents) {
        if (mode === "models") {
            btnModels.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition bg-white dark:bg-slate-700 text-sky-500 shadow-xs";
            btnPersonas.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            btnAgents.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            if (searchInput) searchInput.placeholder = "Search models...";
        } else if (mode === "personas") {
            btnPersonas.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition bg-white dark:bg-slate-700 text-indigo-500 shadow-xs";
            btnModels.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            btnAgents.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            if (searchInput) searchInput.placeholder = "Search personas...";
        } else {
            btnAgents.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition bg-white dark:bg-slate-700 text-sky-500 shadow-xs";
            btnModels.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            btnPersonas.className = "flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200";
            if (searchInput) searchInput.placeholder = "Search agents...";
        }
    }
    renderModelsDropdown();
}

function renderModelsDropdown() {
    const listEl = document.getElementById("modelsList");
    const countEl = document.getElementById("modelCountLabel");
    const searchInput = document.getElementById("modelSearchInput");
    const searchTerm = searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";
    if (!listEl) return;

    listEl.innerHTML = "";

    if (modelDropdownMode === "personas") {
        if (countEl) countEl.innerText = `Personas (${state.personas ? state.personas.length : 0})`;
        const matchingPersonas = (state.personas || []).filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            (p.systemPrompt && p.systemPrompt.toLowerCase().includes(searchTerm))
        );

        if (matchingPersonas.length === 0) {
            listEl.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 italic">No personas found. Create one in Settings -> Personas.</div>`;
            return;
        }

        matchingPersonas.forEach(p => {
            const isSelected = state.currentPersonaId === p.id;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSelected ? "bg-indigo-500/10 text-indigo-500 font-semibold" : "text-slate-700 dark:text-slate-300"}`;
            btn.innerHTML = `
                <span class="truncate">
                    <span class="flex items-center gap-2">
                        <strong class="font-bold">${escapeHtml(p.name)}</strong>
                    </span>
                    <span class="block text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(p.systemPrompt || 'No prompt set')}</span>
                </span>
                ${isSelected ? '<i class="fa-solid fa-check text-xs text-indigo-500"></i>' : ""}
            `;
            btn.onclick = () => selectPersona(p.id);
            listEl.appendChild(btn);
        });
        return;
    }

    if (modelDropdownMode === "agents") {
        if (countEl) countEl.innerText = `Agents (${state.agents ? state.agents.length : 0})`;
        const matchingAgents = (state.agents || []).filter(a =>
            a.name.toLowerCase().includes(searchTerm) ||
            (a.description && a.description.toLowerCase().includes(searchTerm))
        );

        if (matchingAgents.length === 0) {
            listEl.innerHTML = `<div class="p-4 text-center text-xs text-slate-400 italic">No script agents found. Create one in Settings -> Agents.</div>`;
            return;
        }

        matchingAgents.forEach(a => {
            const isSelected = state.currentAgentId === a.id;
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = `w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSelected ? "bg-sky-500/10 text-sky-500 font-semibold" : "text-slate-700 dark:text-slate-300"}`;
            btn.innerHTML = `
                <span class="truncate">
                    <span class="flex items-center gap-2">
                        <i class="fa-solid fa-robot text-sky-500"></i>
                        <strong class="font-bold">${escapeHtml(a.name)}</strong>
                    </span>
                    <span class="block text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(a.description || 'No description')}</span>
                </span>
                ${isSelected ? '<i class="fa-solid fa-check text-xs text-sky-500"></i>' : ""}
            `;
            btn.onclick = () => selectAgent(a.id);
            listEl.appendChild(btn);
        });
        return;
    }

    // Models Mode
    let totalCount = 0;
    state.providers.forEach((prov) => {
        const models = state.providerModels[prov.id] || [];
        const matchingModels = models.filter(
            (modelId) =>
                modelId.toLowerCase().includes(searchTerm) ||
                prov.name.toLowerCase().includes(searchTerm),
        );

        totalCount += matchingModels.length;

        const groupContainer = document.createElement("div");
        groupContainer.className = "space-y-1 mb-2";

        const header = document.createElement("div");
        header.className =
            "px-2 py-1 text-[10px] font-bold text-sky-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/60 rounded-lg flex items-center justify-between";
        header.innerHTML = `
            <span>${escapeHtml(prov.name)}</span>
            <div class="flex items-center gap-2">
                <span class="text-[9px] text-slate-400 font-normal">(${matchingModels.length})</span>
                <button onclick="promptAddCustomModel('${prov.id}')" class="text-sky-500 hover:text-sky-600 font-semibold lowercase text-[10px] flex items-center gap-1" title="Add Model ID manually">
                    <i class="fa-solid fa-plus text-[9px]"></i> add model
                </button>
            </div>
        `;
        groupContainer.appendChild(header);

        if (matchingModels.length === 0) {
            const emptyEl = document.createElement("div");
            emptyEl.className =
                "p-2 text-center text-[11px] text-slate-400 italic";
            emptyEl.innerText = `No models found`;
            groupContainer.appendChild(emptyEl);
        } else {
            matchingModels.forEach((modelId) => {
                const isSelected =
                    !state.currentPersonaId &&
                    prov.id === state.currentProviderId &&
                    modelId === state.currentModel;

                const btn = document.createElement("button");
                btn.className = `w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition ${isSelected ? "bg-sky-500/10 text-sky-500 font-semibold" : "text-slate-700 dark:text-slate-300"}`;

                btn.innerHTML = `
                    <span class="truncate" onclick="event.stopPropagation()">
                        <strong class="font-bold mr-1">${escapeHtml(prov.name)}</strong>
                        <span class="font-normal opacity-90">${escapeHtml(modelId)}</span>
                    </span>
                    ${isSelected ? '<i class="fa-solid fa-check text-xs text-sky-500"></i>' : ""}
                `;
                btn.onclick = () => selectModel(prov.id, modelId);
                groupContainer.appendChild(btn);
            });
        }

        listEl.appendChild(groupContainer);
    });

    if (state.providers.length === 0) {
        listEl.innerHTML = `<div class="p-3 text-center text-xs text-slate-400 italic">No providers available</div>`;
    }

    if (countEl) countEl.innerText = `Models (${totalCount})`;
    updateModelButtonLabel();
}

function promptAddCustomModel(providerId) {
    const prov = state.providers.find((p) => p.id === providerId);
    if (!prov) return;

    const modelId = prompt(`Enter model ID to add to "${prov.name}":`, "");
    if (!modelId || !modelId.trim()) return;

    const cleanId = modelId.trim();

    if (!state.providerModels[providerId]) {
        state.providerModels[providerId] = [];
    }

    if (!state.providerModels[providerId].includes(cleanId)) {
        state.providerModels[providerId].push(cleanId);
        state.providerModels[providerId].sort();
    }

    localStorage.setItem(
        "ai_provider_models",
        JSON.stringify(state.providerModels),
    );

    selectModel(providerId, cleanId);
    renderModelsDropdown();
}

function selectModel(providerId, modelId) {
    state.currentProviderId = providerId;
    state.currentModel = modelId;
    state.currentPersonaId = null;
    state.currentAgentId = null;
    localStorage.setItem("ai_current_provider_id", providerId);
    localStorage.setItem("ai_model", modelId);
    localStorage.removeItem("ai_current_persona_id");
    localStorage.removeItem("ai_current_agent_id");

    updateModelButtonLabel();
    const drop = document.getElementById("modelDropdown");
    if (drop) drop.classList.add("hidden");
    renderModelsDropdown();
    renderActiveParamsBar();
}

// mode: "branch" creates a new alternative branch, "edit" rewrites this node in place
function beginMessageEdit(nodeId, mode) {
    const conv = getActiveConversation();
    if (!conv || !conv.nodes[nodeId]) return;

    const node = conv.nodes[nodeId];
    ensureNodeAttachments(node);
    const input = document.getElementById("userInput");
    if (!input) return;

    // Extract raw text if content is array-based
    let rawContent = node.content;
    if (Array.isArray(rawContent)) {
        rawContent = rawContent
            .filter(item => item.type === "text")
            .map(item => item.text)
            .join("\n\n");
    }

    // Load clean prompt text into input
    input.innerHTML = MarkdownEditor.parseMarkdownWithMath(rawContent, {
        editable: true,
    });
    MarkdownEditor.makeEditorCheckboxesEditable(input);

    // Restore node attachments into active attachedFiles
    attachedFiles = node.attachments ? JSON.parse(JSON.stringify(node.attachments)) : [];
    if (typeof renderAttachedFilesPreview === "function") {
        renderAttachedFilesPreview();
    }

    state.isEditing = true;
    state.editingMode = mode;
    state.editingNodeId = nodeId;
    state.editingParentId = node.parentId;
    state.editingRole = node.role;

    const banner = document.getElementById("editBranchBanner");
    if (banner) banner.classList.remove("hidden");

    const bannerText = document.getElementById("editBranchBannerText");
    const bannerIcon = document.getElementById("editBranchBannerIcon");
    if (bannerText) {
        bannerText.textContent =
            mode === "edit"
                ? "Editing message — rewriting this branch"
                : "Editing message — creating a new branch";
    }
    if (bannerIcon) {
        bannerIcon.className =
            mode === "edit"
                ? "fa-solid fa-pen"
                : "fa-solid fa-code-branch";
    }

    input.focus();
}

// Branch = keep the original and add an alternative copy you can switch back to
function branchMessage(nodeId) {
    beginMessageEdit(nodeId, "branch");
}

// Edit = rewrite this message in place and regenerate everything after it
function editMessage(nodeId) {
    beginMessageEdit(nodeId, "edit");
}

function toggleEditDropdown(nodeId, event) {
    event.stopPropagation();
    document.querySelectorAll(".edit-dropdown-menu, .copy-dropdown-menu").forEach((el) => {
        if (el.id !== `editDropdown_${nodeId}`) {
            el.classList.add("hidden");
        }
    });
    const drop = document.getElementById(`editDropdown_${nodeId}`);
    if (drop) {
        drop.classList.toggle("hidden");
    }
}

function toggleCopyDropdown(nodeId, event) {
    event.stopPropagation();
    document.querySelectorAll(".edit-dropdown-menu, .copy-dropdown-menu").forEach((el) => {
        if (el.id !== `copyDropdown_${nodeId}`) {
            el.classList.add("hidden");
        }
    });
    const drop = document.getElementById(`copyDropdown_${nodeId}`);
    if (drop) {
        drop.classList.toggle("hidden");
    }
}

function closeAllDropdowns() {
    document.querySelectorAll(".edit-dropdown-menu, .copy-dropdown-menu").forEach((el) => el.classList.add("hidden"));
}

function copyMessageContent(nodeId, type) {
    const conv = getActiveConversation();
    if (!conv || !conv.nodes || !conv.nodes[nodeId]) return;
    const node = conv.nodes[nodeId];

    let displayContent = node.content;
    if (Array.isArray(node.content)) {
        displayContent = node.content
            .map((item) => {
                if (item.type === "text") return item.text;
                if (item.type === "image_url") return `![Attached Image](${item.image_url.url})`;
                return "";
            })
            .join("\n\n");
    }
    displayContent = displayContent || "";

    if (type === "markdown") {
        navigator.clipboard.writeText(displayContent).catch(err => console.error(err));
    } else if (type === "unformatted") {
        const html = MarkdownEditor.parseMarkdownWithMath(displayContent);
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const plainText = temp.innerText || temp.textContent || displayContent;
        navigator.clipboard.writeText(plainText).catch(err => console.error(err));
    } else if (type === "html") {
        const html = MarkdownEditor.parseMarkdownWithMath(displayContent);
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const plainText = temp.innerText || temp.textContent || displayContent;

        if (navigator.clipboard && window.ClipboardItem) {
            const htmlBlob = new Blob([html], { type: 'text/html' });
            const textBlob = new Blob([plainText], { type: 'text/plain' });
            navigator.clipboard.write([
                new ClipboardItem({
                    'text/html': htmlBlob,
                    'text/plain': textBlob
                })
            ]).catch(err => {
                navigator.clipboard.writeText(html);
            });
        } else {
            navigator.clipboard.writeText(html);
        }
    }

    document.querySelectorAll(".copy-dropdown-menu").forEach((el) => el.classList.add("hidden"));
}

// Remove a node's entire subtree, keeping the node itself
function removeDescendants(conv, nodeId) {
    const node = conv.nodes[nodeId];
    if (!node) return;
    const stack = [...(node.children || [])];
    node.children = [];
    node.activeChildIndex = 0;
    while (stack.length) {
        const id = stack.pop();
        const child = conv.nodes[id];
        if (!child) continue;
        if (child.children) stack.push(...child.children);
        delete conv.nodes[id];
    }
}

function cancelEditingBranch() {
    state.isEditing = false;
    state.editingMode = null;
    state.editingNodeId = null;
    state.editingParentId = null;
    state.editingRole = null;
    const banner = document.getElementById("editBranchBanner");
    if (banner) banner.classList.add("hidden");
}

function switchBranch(parentId, childIndex) {
    const conv = getActiveConversation();
    if (!conv) return;

    let currId;
    if (!parentId || parentId === "null") {
        if (!conv.rootIds || conv.rootIds.length <= childIndex) return;
        conv.rootActiveIndex = childIndex;
        conv.rootId = conv.rootIds[childIndex];
        currId = conv.rootId;
    } else {
        if (!conv.nodes[parentId]) return;
        const parentNode = conv.nodes[parentId];
        if (!parentNode.children || parentNode.children.length <= childIndex)
            return;

        parentNode.activeChildIndex = childIndex;
        currId = parentNode.children[childIndex];
    }

    while (currId && conv.nodes[currId]) {
        const node = conv.nodes[currId];
        if (node.children && node.children.length > 0) {
            const nextIdx = Math.min(
                node.activeChildIndex || 0,
                node.children.length - 1,
            );
            currId = node.children[nextIdx];
        } else {
            break;
        }
    }
    conv.activeLeafId = currId;

    saveConversationsState();
    renderChatHistory();
}

function getActivePath(conv) {
    if (!conv) return [];
    if (!conv.rootIds && conv.rootId) conv.rootIds = [conv.rootId];
    if (!conv.rootIds || conv.rootIds.length === 0) return [];

    const rootIdx = Math.min(
        conv.rootActiveIndex || 0,
        conv.rootIds.length - 1,
    );
    conv.rootId = conv.rootIds[rootIdx];

    const path = [];
    let currId = conv.rootId;

    while (currId && conv.nodes[currId]) {
        const node = conv.nodes[currId];
        ensureNodeAttachments(node);
        path.push(node);

        if (node.children && node.children.length > 0) {
            const idx = Math.min(
                node.activeChildIndex || 0,
                node.children.length - 1,
            );
            currId = node.children[idx];
        } else {
            break;
        }
    }
    return path;
}

function renderChatHistory() {
    const container = document.getElementById("chatContainer");
    const emptyState = document.getElementById("emptyState");
    if (!container) return;

    const conv = getActiveConversation();
    if (!conv || !conv.rootId) {
        container.innerHTML = "";
        if (emptyState) container.appendChild(emptyState);
        return;
    }

    const path = getActivePath(conv);
    if (path.length === 0) {
        container.innerHTML = "";
        if (emptyState) container.appendChild(emptyState);
        return;
    }

    container.innerHTML = "";

    path.forEach((node) => {
        ensureNodeAttachments(node);
        const parentNode = node.parentId ? conv.nodes[node.parentId] : null;
        const siblings = parentNode
            ? parentNode.children
            : conv.rootIds || (conv.rootId ? [conv.rootId] : []);
        const siblingCount = siblings.length;
        const siblingIdx = siblings.indexOf(node.id);

        const isUser = node.role === "user";
        const msgDiv = document.createElement("div");
        msgDiv.className = `flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"} w-full group`;

        let reasoningHtml = "";
        if (node.reasoning_content || node.pre_tool_reasoning || (node.tool_calls && node.tool_calls.length > 0)) {
            let reasoningBody = "";

            // 1. Pre-tool thinking at the top
            if (node.pre_tool_reasoning) {
                reasoningBody += `<div>${MarkdownEditor.parseMarkdownWithMath(node.pre_tool_reasoning)}</div>`;
            }

            // 2. MCP tool call in the middle
            if (node.tool_calls && node.tool_calls.length > 0) {
                if (reasoningBody) {
                    reasoningBody += `<div class="my-2 pt-2 border-t border-slate-200 dark:border-slate-700/60"></div>`;
                }
                const toolCallsContent = node.tool_calls.map((tc, idx) => {
                    const toolName = escapeHtml(tc.function?.name || tc.name || "Unknown Tool");

                    // Format Input JSON
                    let toolArgs = tc.function?.arguments || tc.arguments || "{}";
                    try {
                        toolArgs = JSON.stringify(typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs, null, 2);
                    } catch (e) {}

                    // Format Output / Result JSON
                    let toolOutput = tc.result || tc.output || tc.response || "(no output returned)";
                    try {
                        if (typeof toolOutput === "string" && (toolOutput.trim().startsWith("{") || toolOutput.trim().startsWith("["))) {
                            toolOutput = JSON.stringify(JSON.parse(toolOutput), null, 2);
                        } else if (typeof toolOutput === "object") {
                            toolOutput = JSON.stringify(toolOutput, null, 2);
                        }
                    } catch (e) {}

                    return `
                        <div class="mcp-tool-block my-2 border border-sky-500/30 rounded-lg p-2 bg-sky-500/5">
                            <div class="font-semibold text-xs text-sky-500 flex items-center justify-between pb-1 border-b border-sky-500/20">
                                <span class="flex items-center gap-1.5">
                                    <i class="fa-solid fa-screwdriver-wrench"></i> MCP Tool Call: <strong>${toolName}</strong>
                                </span>
                                <span class="text-[10px] opacity-70 font-mono">#${idx + 1}</span>
                            </div>
                            <div class="mt-2 space-y-1.5">
                                <div>
                                    <div class="text-[11px] font-medium text-slate-500 dark:text-slate-400">Input Arguments:</div>
                                    <pre class="mt-0.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-2 rounded overflow-x-auto text-[11px] font-mono border border-slate-200 dark:border-slate-800"><code>${escapeHtml(toolArgs)}</code></pre>
                                </div>
                                <div>
                                    <div class="text-[11px] font-medium text-slate-500 dark:text-slate-400">Output / Result:</div>
                                    <pre class="mt-0.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-emerald-300 p-2 rounded overflow-x-auto text-[11px] font-mono border border-slate-200 dark:border-slate-800"><code>${escapeHtml(toolOutput)}</code></pre>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("");
                reasoningBody += toolCallsContent;
            }

            // 3. Post-tool thinking below the call
            if (node.reasoning_content) {
                if (reasoningBody) {
                    reasoningBody += `<div class="my-2 pt-2 border-t border-slate-200 dark:border-slate-700/60"></div>`;
                }
                reasoningBody += `<div>${MarkdownEditor.parseMarkdownWithMath(node.reasoning_content)}</div>`;
            }

            reasoningHtml = `
                <details class="reasoning-block group mb-2" open>
                    <summary class="cursor-pointer select-none font-semibold text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 py-1">
                        <i class="fa-solid fa-brain"></i> Thinking Process
                    </summary>
                    <div class="markdown-body text-xs text-slate-600 dark:text-slate-300 mt-1 pl-4 border-l-2 border-indigo-500/30 space-y-2">
                        ${reasoningBody}
                    </div>
                </details>
            `;
        }

        let branchControls = "";
        if (siblingCount > 1) {
            const parentArg = node.parentId ? `'${node.parentId}'` : "null";
            branchControls = `
                <div class="flex items-center gap-1 text-[10px] text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <button onclick="switchBranch(${parentArg}, ${siblingIdx - 1})" ${siblingIdx === 0 ? "disabled class='opacity-30 cursor-not-allowed'" : "class='hover:text-slate-200'"} title="Previous Branch">
                        <i class="fa-solid fa-chevron-left text-[9px]"></i>
                    </button>
                    <span>&lt;${siblingIdx + 1} - ${siblingCount}&gt;</span>
                    <button onclick="switchBranch(${parentArg}, ${siblingIdx + 1})" ${siblingIdx === siblingCount - 1 ? "disabled class='opacity-30 cursor-not-allowed'" : "class='hover:text-slate-200'"} title="Next Branch">
                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                    </button>
                </div>
            `;
        }

        let durationBadge = "";
        if (!isUser && node.duration) {
            durationBadge = `
                <span class="text-[10px] text-slate-400 font-mono flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700" title="Generation time">
                    <i class="fa-regular fa-clock text-[9px]"></i> ${node.duration}s
                </span>
            `;
        }

        let displayContent = node.content;

        if (Array.isArray(node.content)) {
            displayContent = node.content
                .map((item) => {
                    if (item.type === "text") return item.text;
                    if (item.type === "image_url") return `![Attached Image](${item.image_url.url})`;
                    return "";
                })
                .join("\n\n");
        }

        const formattedContent = MarkdownEditor.parseMarkdownWithMath(
            displayContent || "",
        );

        let filePillsHtml = "";
        if (node.attachments && node.attachments.length > 0) {
            const pills = node.attachments.map(f => {
                const fileName = escapeHtml(f.name || "file");
                if (f.isImage && f.dataUrl) {
                    return `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 shadow-xs">
                            <img src="${f.dataUrl}" alt="${fileName}" class="w-4 h-4 object-cover rounded" />
                            <span class="truncate max-w-[140px]" title="${fileName}">${fileName}</span>
                        </div>
                    `;
                } else {
                    return `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200/80 dark:bg-slate-700/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60 shadow-xs">
                            <i class="fa-solid fa-file-code text-sky-500 text-xs"></i>
                            <span class="truncate max-w-[140px]" title="${fileName}">${fileName}</span>
                        </div>
                    `;
                }
            }).join("");
            filePillsHtml = `<div class="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/60">${pills}</div>`;
        }

        msgDiv.innerHTML = `
            <div class="flex items-center gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}">
                <div class="w-7 h-7 rounded-xl ${isUser ? "bg-sky-500 text-white" : "bg-indigo-600 text-white"} flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                    <i class="fa-solid ${isUser ? "fa-user" : "fa-robot"}"></i>
                </div>

                <div class="p-3 sm:p-4 rounded-2xl text-xs sm:text-sm shadow-sm bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 ${
                    isUser ? "rounded-tr-xs" : "rounded-tl-xs"
                }">
                    ${reasoningHtml}
                    <div class="markdown-body">${formattedContent}</div>
                    ${filePillsHtml}
                </div>
            </div>

            <div class="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition">
                ${branchControls}
                ${durationBadge}
                <div class="relative">
                    <button type="button" onclick="toggleEditDropdown('${node.id}', event)" class="text-[10px] text-slate-400 hover:text-sky-400 flex items-center gap-1 p-0.5 rounded" title="Edit options">
                        <i class="fa-solid fa-pen text-[9px]"></i> Edit
                    </button>
                    <div id="editDropdown_${node.id}" class="edit-dropdown-menu hidden absolute bottom-full mb-1 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 min-w-[150px]">
                        <button type="button" onclick="editMessage('${node.id}'); closeAllDropdowns();" class="text-left text-[11px] px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition">
                            <i class="fa-solid fa-pen text-[10px] text-sky-500"></i> Edit (Rewrite)
                        </button>
                        <button type="button" onclick="branchMessage('${node.id}'); closeAllDropdowns();" class="text-left text-[11px] px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition">
                            <i class="fa-solid fa-code-branch text-[10px] text-indigo-500"></i> Branch
                        </button>
                    </div>
                </div>
                <div class="relative">
                    <button type="button" onclick="toggleCopyDropdown('${node.id}', event)" class="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 p-0.5 rounded" title="Copy message">
                        <i class="fa-solid fa-copy text-[9px]"></i> Copy
                    </button>
                    <div id="copyDropdown_${node.id}" class="copy-dropdown-menu hidden absolute bottom-full mb-1 left-0 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 min-w-[165px]">
                        <button type="button" onclick="copyMessageContent('${node.id}', 'unformatted')" class="text-left text-[11px] px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition">
                            <i class="fa-solid fa-file-lines text-[10px] text-slate-400"></i> Unformatted Text
                        </button>
                        <button type="button" onclick="copyMessageContent('${node.id}', 'html')" class="text-left text-[11px] px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition">
                            <i class="fa-solid fa-code text-[10px] text-sky-500"></i> HTML (Formatted)
                        </button>
                        <button type="button" onclick="copyMessageContent('${node.id}', 'markdown')" class="text-left text-[11px] px-2 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition">
                            <i class="fa-solid fa-file-code text-[10px] text-indigo-500"></i> Markdown Syntax
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.appendChild(msgDiv);
    });

    container.querySelectorAll("pre code").forEach((el) => {
        hljs.highlightElement(el);
    });

    container.scrollTop = container.scrollHeight;
}

let _chatRenderScheduled = false;
function scheduleChatRender() {
    if (_chatRenderScheduled) return;
    _chatRenderScheduled = true;
    requestAnimationFrame(() => {
        _chatRenderScheduled = false;
        renderChatHistory();
    });
}

async function sendMessage() {
    const userInputEl = document.getElementById("userInput");
    if (!userInputEl) return;

    const rawText = MarkdownEditor.getEditorMarkdown(userInputEl);

    // Stop only if text, attached files, AND attached skills are missing
    if (
        (!rawText || rawText.trim() === "") &&
        (!attachedFiles || attachedFiles.length === 0) &&
        (!attachedSkills || attachedSkills.length === 0)
    )
        return;

    // 1. Ensure all file contents are fully loaded before constructing the payload
    const fileReadPromises = attachedFiles.map((f) => {
        return new Promise((resolve) => {
            if (f.content || f.dataUrl) return resolve(f);

            const reader = new FileReader();
            if (f.isImage) {
                reader.onload = (e) => {
                    f.dataUrl = e.target.result;
                    resolve(f);
                };
                reader.readAsDataURL(f.fileRaw || f);
            } else {
                reader.onload = (e) => {
                    f.content = e.target.result;
                    resolve(f);
                };
                reader.readAsText(f.fileRaw || f);
            }
        });
    });

    await Promise.all(fileReadPromises);

    const currentAttached = [...attachedFiles];
    const currentAttachedSkills = [...attachedSkills];

    // Clear attachments array
    attachedFiles = [];
    attachedSkills = [];
    if (typeof renderAttachedFilesPreview === "function") {
        renderAttachedFilesPreview();
    }

    const messageContent = rawText || "";

    let conv = getActiveConversation();
    if (!conv) {
        conv = createNewConversation(true);
    }

    // If editing an assistant message, update/branch it directly without calling the API
    if (state.isEditing && state.editingRole === "assistant") {
        if (state.editingMode === "edit" && state.editingNodeId) {
            // Rewrite the assistant message in place and drop anything generated after it
            const targetId = state.editingNodeId;
            const targetNode = conv.nodes[targetId];
            if (targetNode) {
                removeDescendants(conv, targetId);
                targetNode.content = rawText;
                targetNode.reasoning_content = "";
                delete targetNode.tool_calls;
                conv.activeLeafId = targetId;
            }
        } else {
            const assistantMsgId = "msg_" + Date.now();
            const parentId = state.editingParentId;

            const newAssistantNode = {
                id: assistantMsgId,
                role: "assistant",
                content: rawText,
                reasoning_content: "",
                parentId: parentId,
                children: [],
                activeChildIndex: 0,
            };

            conv.nodes[assistantMsgId] = newAssistantNode;

            if (parentId && conv.nodes[parentId]) {
                conv.nodes[parentId].children.push(assistantMsgId);
                conv.nodes[parentId].activeChildIndex =
                    conv.nodes[parentId].children.length - 1;
            }

            conv.activeLeafId = assistantMsgId;
        }

        userInputEl.innerHTML = "";
        cancelEditingBranch();
        saveConversationsState();
        renderSidebarConversations();
        renderChatHistory();
        return;
    }

    const activePersona = state.currentPersonaId ? state.personas.find(p => p.id === state.currentPersonaId) : null;
    const provider = activePersona
        ? (state.providers.find(p => p.id === activePersona.providerId) || getActiveProvider())
        : getActiveProvider();
    const modelToUse = activePersona ? (activePersona.modelId || state.currentModel) : state.currentModel;
    if (
        !provider ||
        (!provider.apiKey && provider.name.toLowerCase() !== "puter.js")
    ) {
        alert(
            "Please set an API key or Auth ID in Settings -> Providers & Auth before sending a message.",
        );
        toggleModal("settingsModal");
        return;
    }

    userInputEl.innerHTML = "";

    if (!conv.rootIds) conv.rootIds = conv.rootId ? [conv.rootId] : [];

    const isNewConversation = !conv.rootId;
    const isEditMode = state.isEditing && state.editingMode === "edit";
    const userMsgId = isEditMode ? state.editingNodeId : "msg_" + Date.now();
    const parentId = state.isEditing
        ? state.editingParentId
        : conv.activeLeafId;

    if (isEditMode && conv.nodes[userMsgId]) {
        // Rewrite the existing user message in place and drop everything after it
        removeDescendants(conv, userMsgId);
        conv.nodes[userMsgId].content = messageContent;
        conv.nodes[userMsgId].attachments = currentAttached;
    } else {
        const newUserNode = {
            id: userMsgId,
            role: "user",
            content: messageContent,
            attachments: currentAttached,
            reasoning_content: "",
            parentId: parentId,
            children: [],
            activeChildIndex: 0,
        };

        conv.nodes[userMsgId] = newUserNode;

        if (parentId && conv.nodes[parentId]) {
            conv.nodes[parentId].children.push(userMsgId);
            conv.nodes[parentId].activeChildIndex =
                conv.nodes[parentId].children.length - 1;
        } else {
            if (!conv.rootIds.includes(userMsgId)) {
                conv.rootIds.push(userMsgId);
            }
            conv.rootActiveIndex = conv.rootIds.length - 1;
            conv.rootId = userMsgId;
        }
    }

    conv.activeLeafId = userMsgId;

    // Trigger background title generation safely now that the conversation node structure exists
    if (isNewConversation) {
        conv.title = rawText.slice(0, 30) + (rawText.length > 30 ? "..." : "");
        document.title = conv.title;
        const convForTitle = conv;
        const titleSourceText = rawText;
        setTimeout(() => generateConversationTitle(convForTitle, titleSourceText), 50);
    }
    cancelEditingBranch();
    saveConversationsState();
    renderSidebarConversations();
    renderChatHistory();

    const pathNodes = getActivePath(conv);
    const apiMessages = [];

    let basePrompt = "";
    if (activePersona) {
        if (activePersona.systemPrompt && activePersona.systemPrompt.trim() !== "") {
            basePrompt = activePersona.systemPrompt;
        }
    } else {
        if (state.systemPrompt && state.systemPrompt.trim() !== "") {
            basePrompt = state.systemPrompt;
        }
    }

    let systemPromptContent = formatSystemPrompt(basePrompt, currentAttachedSkills);

    if (systemPromptContent) {
        apiMessages.push({
            role: "system",
            content: systemPromptContent,
        });
    }

    pathNodes.forEach((n) => {
        ensureNodeAttachments(n);
        const msgObj = {
            role: n.role,
        };
        let content = n.content;
        if (n.attachments && n.attachments.length > 0) {
            const parts = [];
            if (typeof content === "string" && content.trim()) {
                parts.push({ type: "text", text: content });
            } else if (Array.isArray(content)) {
                parts.push(...content);
            }
            n.attachments.forEach(f => {
                if (f.isImage && f.dataUrl) {
                    parts.push({
                        type: "image_url",
                        image_url: { url: f.dataUrl }
                    });
                } else if (f.content) {
                    parts.push({
                        type: "text",
                        text: `Attached File (${f.name}):\n${f.content}`
                    });
                }
            });
            msgObj.content = parts;
        } else {
            msgObj.content = content;
        }

        if (n.tool_calls && n.tool_calls.length > 0) {
            msgObj.tool_calls = n.tool_calls.map(call => {
                const callId = call.id || `call_${Math.random().toString(36).substring(2, 11)}`;
                call.id = callId;
                return {
                    id: callId,
                    type: call.type || "function",
                    function: {
                        name: call.function?.name || call.name || "",
                        arguments: call.function?.arguments || "{}"
                    }
                };
            });
            if (!msgObj.content) {
                msgObj.content = null;
            }
        }


        apiMessages.push(msgObj);

        if (n.tool_calls && n.tool_calls.length > 0) {
            for (const call of n.tool_calls) {
                if (call.result !== undefined && call.result !== null) {
                    const callId = call.id || `call_${Math.random().toString(36).substring(2, 11)}`;
                    call.id = callId;
                    apiMessages.push({
                        role: "tool",
                        tool_call_id: callId,
                        content: parseToolResultContent(call.result)
                    });
                }
            }
        }
    });

    const assistantMsgId = "msg_" + Date.now();
    const newAssistantNode = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        reasoning_content: "",
        parentId: userMsgId,
        children: [],
        activeChildIndex: 0,
    };

    conv.nodes[assistantMsgId] = newAssistantNode;
    conv.nodes[userMsgId].children.push(assistantMsgId);
    conv.nodes[userMsgId].activeChildIndex =
        conv.nodes[userMsgId].children.length - 1;
    conv.activeLeafId = assistantMsgId;

    saveConversationsState();
    renderChatHistory();

    if (state.currentAgentId) {
        const activeAgent = state.agents.find(a => a.id === state.currentAgentId);
        if (activeAgent) {
            async function ask(modelId, providerId, promptOrMessages) {
                let targetProvider = state.providers.find(p => p.id === providerId) || getActiveProvider();
                let targetModel = modelId || state.currentModel;

                let reqMessages = [];
                if (typeof promptOrMessages === "string") {
                    reqMessages = [{ role: "user", content: promptOrMessages }];
                } else if (Array.isArray(promptOrMessages)) {
                    reqMessages = promptOrMessages;
                } else {
                    reqMessages = apiMessages;
                }

                const req = prepareLLMRequest(targetProvider, targetModel, reqMessages, null, false, 4096);
                if (targetProvider.name.toLowerCase() === "puter.js") {
                    const res = await PuterSDKBridge.chatCompletion(targetModel, reqMessages, { stream: false });
                    return res?.choices?.[0]?.message?.content || "";
                } else {
                    const resp = await fetch(req.url, {
                        method: "POST",
                        headers: req.headers,
                        body: JSON.stringify({ ...req.body, stream: false }),
                        signal: currentAbortController?.signal,
                    });
                    if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
                    const data = await resp.json();
                    return parseLLMResponse(data, req.proto);
                }
            }

            const generationStartTime = Date.now();
            try {
                currentAbortController = new AbortController();
                setGenerationState(true);

                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const agentFunc = new AsyncFunction('conversation', 'messages', 'userInput', 'ask', 'canvas', activeAgent.script);

                const result = await agentFunc(conv, apiMessages, messageContent, ask, canvas);

                if (typeof result === "string") {
                    newAssistantNode.content = result;
                } else if (result !== undefined) {
                    newAssistantNode.content = String(result);
                } else if (!newAssistantNode.content.trim()) {
                    newAssistantNode.content = "_Agent script executed successfully with no return value._";
                }
            } catch (scriptErr) {
                if (scriptErr.name !== "AbortError") {
                    newAssistantNode.content = `**Agent Script Execution Error:** ${scriptErr.message}`;
                }
            } finally {
                newAssistantNode.duration = ((Date.now() - generationStartTime) / 1000).toFixed(1);
                currentAbortController = null;
                setGenerationState(false);
                saveConversationsState();
                renderChatHistory();
            }
            return;
        }
    }

    const generationStartTime = Date.now();
    currentAbortController = new AbortController();
    setGenerationState(true);

    try {
        const mcpToolsList = await MCPEngine.discoverTools();
        let toolsParam = null;
        if (mcpToolsList && mcpToolsList.length > 0) {
            toolsParam = mcpToolsList.map((tool) => ({
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description || "",
                    parameters: tool.inputSchema ||
                        tool.parameters || { type: "object", properties: {} },
                },
            }));
        }

        const req = prepareLLMRequest(provider, modelToUse, apiMessages, toolsParam, true, 4096);

        if (activePersona) {
            if (activePersona.params && Array.isArray(activePersona.params)) {
                activePersona.params
                    .filter((p) => p.enabled !== false)
                    .forEach((p) => {
                        req.body[p.name] = p.value;
                    });
            }
        } else {
            state.customParams
                .filter((p) => p.enabled)
                .forEach((p) => {
                    req.body[p.name] = p.value;
                });
        }

        let success = false;
        let lastError = null;

        for (let attempt = 1; attempt <= 5; attempt++) {
            if (currentAbortController && currentAbortController.signal.aborted) {
                throw new DOMException("Aborted", "AbortError");
            }

            try {
                if (attempt > 1) {
                    newAssistantNode.content = "";
                    renderChatHistory();
                }

                if (provider.name.toLowerCase() === "puter.js") {
                    const stream = await PuterSDKBridge.chatCompletion(
                        modelToUse,
                        apiMessages,
                        { stream: true },
                    );
                    for await (const part of stream) {
                        const text = part?.text || part?.delta?.content || "";
                        const reasoning = part?.reasoning || part?.delta?.reasoning_content || part?.thinking || "";
                        if (reasoning) {
                            newAssistantNode.reasoning_content += reasoning;
                            renderChatHistory();
                        }
                        if (text) {
                            newAssistantNode.content += text;
                            renderChatHistory();
                        }
                    }
                } else {
                    const response = await fetch(
                        req.url,
                        {
                            method: "POST",
                            headers: req.headers,
                            body: JSON.stringify(req.body),
                            signal: currentAbortController.signal,
                        },
                    );

                    if (!response.ok) {
                        const errData = await response.json().catch(() => ({}));
                        throw new Error(
                            errData.error?.message ||
                                `HTTP error status: ${response.status}`,
                        );
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder("utf-8");
                    let buffer = "";

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            buffer += decoder.decode(new Uint8Array(0), {
                                stream: false,
                            });
                            if (buffer.trim()) {
                                const finalLines = buffer.split("\n");
                                for (const line of finalLines) {
                                    const trimmed = line.trim();
                                    if (!trimmed || !trimmed.startsWith("data:"))
                                        continue;
                                    if (trimmed === "data: [DONE]") continue;
                                    try {
                                        const json = JSON.parse(
                                            trimmed.substring(5).trim(),
                                        );
                                        parseStreamingDelta(json, req.proto, newAssistantNode);
                                        scheduleChatRender();
                                    } catch (e) {}
                                }
                            }
                            renderChatHistory();
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() || "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith("data:")) continue;
                            if (trimmed === "data: [DONE]") continue;

                            try {
                                const json = JSON.parse(
                                    trimmed.substring(5).trim(),
                                );
                                parseStreamingDelta(json, req.proto, newAssistantNode);
                                scheduleChatRender();
                            } catch (e) {}
                        }
                    }
                }

                success = true;
                break;
            } catch (err) {
                lastError = err;
                if (err.name === "AbortError" || (currentAbortController && currentAbortController.signal.aborted)) {
                    throw err;
                }

                if (attempt < 5) {
                    console.warn(`API error on attempt ${attempt}/5: ${err.message}. Waiting 1 minute before retrying...`);
                    newAssistantNode.content = `_API error (${err.message}). Waiting 1 minute before retry (${attempt}/5)..._`;
                    renderChatHistory();

                    const waitStart = Date.now();
                    while (Date.now() - waitStart < 60000) {
                        if (currentAbortController && currentAbortController.signal.aborted) {
                            throw new DOMException("Aborted", "AbortError");
                        }
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } else {
                    throw err;
                }
            }
        }

        if (success) {
            if (
                newAssistantNode.tool_calls &&
                newAssistantNode.tool_calls.length > 0
            ) {
                newAssistantNode.pre_tool_reasoning = newAssistantNode.reasoning_content || "";
                newAssistantNode.reasoning_content = "";
                // Send a clean copy to the API (strip UI-only fields like `result`)
                const assistantMsgObj = {
                    role: "assistant",
                    tool_calls: newAssistantNode.tool_calls.map((call) => {
                        const callId = call.id || `call_${Math.random().toString(36).substring(2, 11)}`;
                        call.id = callId;
                        return {
                            id: callId,
                            type: call.type || "function",
                            function: {
                                name: call.function?.name || call.name || "",
                                arguments: call.function?.arguments || "{}",
                            },
                        };
                    }),
                    content: newAssistantNode.content || null,
                };
                apiMessages.push(assistantMsgObj);

                for (const call of newAssistantNode.tool_calls) {
                    let args = {};
                    try {
                        args = JSON.parse(call.function.arguments || "{}");
                    } catch (e) {
                        args = {};
                    }
                    const toolResult = await MCPEngine.callTool(
                        call.function.name,
                        args,
                    );

                    // Attach output to call object for UI rendering only
                    call.result = toolResult;

                    const callId = call.id || `call_${Math.random().toString(36).substring(2, 11)}`;
                    call.id = callId;
                    apiMessages.push({
                        role: "tool",
                        tool_call_id: callId,
                        content: parseToolResultContent(toolResult),
                    });
                }

                renderChatHistory();

                const followUpReq = prepareLLMRequest(provider, state.currentModel, apiMessages, null, true, 4096);

                state.customParams
                    .filter((p) => p.enabled)
                    .forEach((p) => {
                        followUpReq.body[p.name] = p.value;
                    });

                const followUpResponse = await fetch(
                    followUpReq.url,
                    {
                        method: "POST",
                        headers: followUpReq.headers,
                        body: JSON.stringify(followUpReq.body),
                        signal: currentAbortController.signal,
                    },
                );

                if (followUpResponse.ok) {
                    const reader2 = followUpResponse.body.getReader();
                    const decoder2 = new TextDecoder("utf-8");
                    let buffer2 = "";

                    while (true) {
                        const { done, value } = await reader2.read();
                        if (done) break;

                        buffer2 += decoder2.decode(value, { stream: true });
                        const lines = buffer2.split("\n");
                        buffer2 = lines.pop() || "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || !trimmed.startsWith("data:"))
                                continue;
                            if (trimmed === "data: [DONE]") break;

                            try {
                                const json = JSON.parse(
                                    trimmed.substring(5).trim(),
                                );
                                parseStreamingDelta(json, followUpReq.proto, newAssistantNode);
                                scheduleChatRender();
                            } catch (e) {}
                        }
                    }

                    if (!newAssistantNode.content.trim()) {
                        if (
                            newAssistantNode.tool_calls &&
                            newAssistantNode.tool_calls.length > 0
                        ) {
                            // Model produced tool calls
                        } else if (
                            newAssistantNode.reasoning_content &&
                            newAssistantNode.reasoning_content.trim()
                        ) {
                            // Reasoning is kept inside the thinking space
                        } else {
                            newAssistantNode.content =
                                "_The tool ran but the model returned no text. Tool output is shown above._";
                            renderChatHistory();
                        }
                    }
                } else {
                    const errText = await followUpResponse
                        .text()
                        .catch(() => "");
                    let errMsg = `HTTP ${followUpResponse.status}`;
                    try {
                        errMsg =
                            JSON.parse(errText).error?.message || errMsg;
                    } catch (e) {}
                    newAssistantNode.content +=
                        (newAssistantNode.content ? "\n\n" : "") +
                        `**Tool follow-up failed:** ${errMsg}`;
                    renderChatHistory();
                }
            } else if (!newAssistantNode.content.trim()) {
                if (
                    newAssistantNode.tool_calls &&
                    newAssistantNode.tool_calls.length > 0
                ) {
                    // Model produced tool calls
                } else if (
                    newAssistantNode.reasoning_content &&
                    newAssistantNode.reasoning_content.trim()
                ) {
                    // Reasoning is kept inside the thinking space
                } else {
                    newAssistantNode.content =
                        "_The model returned no text or tool calls._";
                    renderChatHistory();
                }
            }
        }
    } catch (err) {
        if (err.name !== "AbortError") {
            newAssistantNode.content += `\n\n**Error (All 5 retry attempts failed):** ${err.message}`;
            renderChatHistory();
        }
    } finally {
        newAssistantNode.duration = ((Date.now() - generationStartTime) / 1000).toFixed(1);
        currentAbortController = null;
        setGenerationState(false);
        saveConversationsState();
    }
}

function exportActiveConversation(format = 'chatgpt') {
    const conv = getActiveConversation();
    if (!conv) {
        alert("No active conversation to export.");
        return;
    }

    const safeTitle = (conv.title || "conversation").replace(/[^a-z0-9]/gi, '_').toLowerCase();

    if (format === 'chatgpt') {
        exportActiveConversationJSON();
        return;
    }
    if (format === 'chatgpt_zip') {
        exportActiveConversationZIP();
        return;
    }

    const path = getActivePath(conv);

    if (format === 'claude') {
        const exportData = {
            title: conv.title || "Untitled Conversation",
            name: conv.title || "Untitled Conversation",
            messages: path.map(n => ({
                role: n.role === "assistant" ? "assistant" : (n.role === "system" ? "system" : "user"),
                content: typeof n.content === 'string' ? n.content : (Array.isArray(n.content) ? n.content.map(c => typeof c === 'string' ? c : (c.text || JSON.stringify(c))).join("\n") : String(n.content || ""))
            })),
            chat_messages: path.map((n, idx) => ({
                uuid: n.id || `msg_${idx}`,
                text: typeof n.content === 'string' ? n.content : (Array.isArray(n.content) ? n.content.map(c => typeof c === 'string' ? c : (c.text || JSON.stringify(c))).join("\n") : String(n.content || "")),
                sender: n.role === "assistant" ? "assistant" : (n.role === "system" ? "system" : "human"),
                index: idx
            }))
        };
        downloadJSON(exportData, `${safeTitle}_claude.json`);
    }
}

function downloadJSON(data, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function buildOpenAIExportObject(conv) {
    const mapping = {};
    if (conv.nodes) {
        Object.keys(conv.nodes).forEach((nodeId) => {
            const node = conv.nodes[nodeId];
            let parts = [];
            if (Array.isArray(node.content)) {
                parts = node.content.map(c => typeof c === 'string' ? c : (c.text || JSON.stringify(c)));
            } else if (typeof node.content === 'string') {
                parts = [node.content];
            } else if (node.content && typeof node.content === 'object' && node.content.parts) {
                parts = node.content.parts;
            } else {
                parts = [String(node.content || "")];
            }

            mapping[nodeId] = {
                id: node.id || nodeId,
                parent: node.parentId !== undefined ? node.parentId : null,
                children: node.children || [],
                message: {
                    role: node.role || "user",
                    content: {
                        parts: parts
                    }
                }
            };
        });
    }

    return {
        title: conv.title || "Untitled Chat",
        mapping: mapping,
        current_node: conv.activeLeafId || (Object.keys(mapping).length > 0 ? Object.keys(mapping)[0] : null)
    };
}

function exportActiveConversationJSON() {
    const conv = getActiveConversation();
    if (!conv) {
        alert("No active conversation to export.");
        return;
    }

    const exportData = buildOpenAIExportObject(conv);
    const safeTitle = (conv.title || "conversation").replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadJSON(exportData, `${safeTitle}_openai.json`);
}

async function exportActiveConversationZIP() {
    const conv = getActiveConversation();
    if (!conv) {
        alert("No active conversation to export.");
        return;
    }
    if (typeof JSZip === 'undefined') {
        alert("JSZip library not loaded.");
        return;
    }

    const exportData = buildOpenAIExportObject(conv);
    const conversationsArray = [exportData];

    const zip = new JSZip();
    zip.file("conversations.json", JSON.stringify(conversationsArray, null, 2));

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const safeTitle = (conv.title || "conversation").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = URL.createObjectURL(content);
        downloadAnchor.download = `${safeTitle}_openai.zip`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        URL.revokeObjectURL(downloadAnchor.href);
    } catch (err) {
        console.error("Error generating ZIP:", err);
        alert("Failed to generate ZIP file.");
    }
}

async function handleImportConversationJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.zip') || file.type === 'application/zip' || file.type === 'application/x-zip-compressed') {
        if (typeof JSZip === 'undefined') {
            alert("JSZip library not loaded.");
            return;
        }
        try {
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(file);
            let jsonFile = zipContent.file("conversations.json");
            if (!jsonFile) {
                const jsonFiles = Object.keys(zipContent.files).filter(fn => fn.endsWith('.json') && !zipContent.files[fn].dir);
                if (jsonFiles.length > 0) {
                    jsonFile = zipContent.file(jsonFiles[0]);
                }
            }
            if (!jsonFile) {
                throw new Error("No conversations.json or json file found in zip archive.");
            }
            const text = await jsonFile.async("text");
            processImportJSONText(text, file.name);
        } catch (err) {
            console.error("Error reading ZIP import:", err);
            alert("Failed to import ZIP file: " + err.message);
        }
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            processImportJSONText(e.target.result, file.name);
        } catch (err) {
            alert("Invalid conversation JSON format: " + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function processImportJSONText(text, filename) {
    let json = JSON.parse(text);
    if (Array.isArray(json)) {
        if (json.length === 0) throw new Error("Empty conversation array in JSON.");
        json = json[0];
    }

    const title = json.title || json.name || filename.replace(/\.[^/.]+$/, "") || "Imported Chat";
    const nodes = {};
    const rootIds = [];

    if (json && json.mapping) {
        const mapping = json.mapping;
        Object.keys(mapping).forEach((nodeId) => {
            const nodeData = mapping[nodeId];
            const id = nodeData.id || nodeId;
            const parentId = nodeData.parent !== undefined ? nodeData.parent : null;
            const children = nodeData.children || [];
            const role = nodeData.message?.role || "user";

            let content = "";
            const msgContent = nodeData.message?.content;
            if (msgContent) {
                if (Array.isArray(msgContent.parts)) {
                    content = msgContent.parts.join("\n");
                } else if (typeof msgContent === 'string') {
                    content = msgContent;
                } else if (typeof msgContent.text === 'string') {
                    content = msgContent.text;
                }
            }

            nodes[id] = {
                id: id,
                role: role,
                content: content,
                reasoning_content: nodeData.message?.reasoning_content || "",
                parentId: parentId,
                children: children,
                activeChildIndex: 0
            };

            if (!parentId) {
                rootIds.push(id);
            }
        });

        const rootId = rootIds.length > 0 ? rootIds[0] : (Object.keys(nodes)[0] || null);
        const activeLeafId = json.current_node || (rootIds.length > 0 ? rootIds[rootIds.length - 1] : null);

        const newConv = {
            id: "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            title: title,
            nodes: nodes,
            rootId: rootId,
            rootIds: rootIds,
            rootActiveIndex: 0,
            activeLeafId: activeLeafId,
            createdAt: Date.now()
        };

        state.conversations.unshift(newConv);
        saveConversationsState();
        switchConversation(newConv.id);
        alert(`Successfully imported conversation "${title}" with ${Object.keys(nodes).length} nodes!`);

    } else {
        let msgList = [];
        if (Array.isArray(json)) {
            msgList = json;
        } else if (json.chat_messages && Array.isArray(json.chat_messages)) {
            msgList = json.chat_messages.map(m => ({
                role: m.sender === 'assistant' ? 'assistant' : (m.sender === 'system' ? 'system' : 'user'),
                content: m.text || m.content || ''
            }));
        } else if (json.messages && Array.isArray(json.messages)) {
            msgList = json.messages.map(m => {
                let role = m.role || 'user';
                if (role === 'model') role = 'assistant';
                let content = '';
                if (typeof m.content === 'string') content = m.content;
                else if (Array.isArray(m.parts)) content = m.parts.map(p => p.text || '').join('\n');
                else if (typeof m.text === 'string') content = m.text;
                return { role: role, content: content };
            });
        } else {
            throw new Error("Invalid conversation JSON format.");
        }

        if (msgList.length === 0) {
            throw new Error("No messages found in imported file.");
        }

        let prevId = null;
        let firstId = null;

        msgList.forEach((msg, idx) => {
            const id = `node_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
            if (idx === 0) firstId = id;

            let role = msg.role || 'user';
            if (role === 'model') role = 'assistant';
            if (role === 'human') role = 'user';

            nodes[id] = {
                id: id,
                role: role,
                content: msg.content || '',
                parentId: prevId,
                children: [],
                activeChildIndex: 0
            };

            if (prevId && nodes[prevId]) {
                nodes[prevId].children.push(id);
            }

            prevId = id;
        });

        const rootId = firstId;
        const activeLeafId = prevId;
        const rootIds = [rootId];

        const newConv = {
            id: "conv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
            title: title,
            nodes: nodes,
            rootId: rootId,
            rootIds: rootIds,
            rootActiveIndex: 0,
            activeLeafId: activeLeafId,
            createdAt: Date.now()
        };

        state.conversations.unshift(newConv);
        saveConversationsState();
        switchConversation(newConv.id);
        alert(`Successfully imported conversation "${title}" with ${Object.keys(nodes).length} messages!`);
    }
}

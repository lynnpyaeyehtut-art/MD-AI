let attachedFiles = [];

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
// Add this helper to extract <file> tags into your application's file state format
function parseFileTagsFromPrompt(rawText) {
    const fileRegex = /<file\s+title="([^"]+)">\n?([\s\S]*?)<\/file>/g;
    const extractedFiles = [];
    let match;

    while ((match = fileRegex.exec(rawText)) !== null) {
        extractedFiles.push({
            name: match[1],
            content: match[2].trim(),
            type: "text/plain" // Match whatever structure your app expects
        });
    }

    // Remove the <file> tags from the raw text so the textarea only shows the prompt
    const cleanPromptText = rawText.replace(fileRegex, "").trim();

    return { cleanPromptText, extractedFiles };
}

// Inside your function that OPENS the edit mode:
function openEditMode(messageNode) {
    const { cleanPromptText, extractedFiles } = parseFileTagsFromPrompt(messageNode.content);

    // Set the text field value to the clean text without <file> tags
    document.getElementById("edit-textarea").value = cleanPromptText;

    // Push the extracted files back into your active attachments array
    activeAttachments = [...extractedFiles];

    // Re-render your file attachment preview chips/UI below the input box
    renderAttachmentPreviews(activeAttachments);
}
function extractFileTagsFromText(text) {
    const fileRegex = /<file\s+title="([^"]+)">\n?([\s\S]*?)<\/file>/g;
    const extractedFiles = [];
    let match;

    while ((match = fileRegex.exec(text)) !== null) {
        extractedFiles.push({
            name: match[1],
            content: match[2].trim(),
            isExtractedTag: true
        });
    }

    // Strip the raw <file> tags out so the text content remains clean
    const cleanText = text.replace(fileRegex, '').trim();

    return { cleanText, extractedFiles };
}
// Example usage inside your edit message submission logic
function handleEditSubmit(editedText, existingAttachments = []) {
    const { cleanText, extractedFiles } = extractFileTagsFromText(editedText);

    // Merge existing/uploaded attachments with extracted <file> tags
    const combinedAttachments = [...existingAttachments, ...extractedFiles];

    // Proceed with sending/saving cleanText and combinedAttachments
    updateMessageInState(cleanText, combinedAttachments);
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

function renderAttachedFilesPreview() {
    const container = document.getElementById("attachedFilesPreview");
    if (!container) return;

    if (!Array.isArray(attachedFiles) || attachedFiles.length === 0) {
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    container.className = "flex flex-wrap gap-1 px-3 py-0 my-0 leading-none";
    container.innerHTML = "";

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
    systemPrompt:
        localStorage.getItem("ai_system_prompt") ||
        "You are a helpful assistant.",
    currentModel: localStorage.getItem("ai_model") || "gpt-4o-mini",
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

function formatSystemPrompt(prompt) {
    if (!prompt) return "";
    const now = new Date();
    return prompt
        .replace(/\{model-id\}/gi, state.currentModel || "unknown-model")
        .replace(/\{time\}/gi, now.toLocaleTimeString())
        .replace(/\{date\}/gi, now.toLocaleDateString())
        .replace(
            /\{place\}/gi,
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
                "Unknown Location",
        );
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

    const sysPromptEl = document.getElementById("systemPromptInput");
    if (sysPromptEl) {
        if ("value" in sysPromptEl) {
            sysPromptEl.value = state.systemPrompt || "You are a helpful assistant.";
        } else {
            sysPromptEl.innerText = state.systemPrompt || "You are a helpful assistant.";
            sysPromptEl.style.whiteSpace = "pre-wrap";
        }
    }

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

    rehydrateWebMcpTools();
    applySidebarState();
    renderSidebarConversations();
    renderProvidersListInSettings();
    renderChatHistory();
    renderParamsManager();
    renderActiveParamsBar();
    renderMcpToolsList();

    fetchModelsList(false);
});

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
    const tabs = ["provider", "system", "params", "mcp", "appearance", "reset"];
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

    if (!state.providers.some((p) => p.id === state.currentProviderId)) {
        state.currentProviderId = state.providers[0]?.id || "prov_default";
    }

    const sysPromptEl = document.getElementById("systemPromptInput");
    if (sysPromptEl) {
        const sysPromptEl = document.getElementById("systemPromptInput");
            if (sysPromptEl) {
                state.systemPrompt = ("value" in sysPromptEl && sysPromptEl.value !== undefined)
                    ? sysPromptEl.value
                    : sysPromptEl.innerText;
            }
    }

    await saveProvidersToStorage();
    localStorage.setItem("ai_current_provider_id", state.currentProviderId);
    localStorage.setItem("ai_system_prompt", state.systemPrompt);

    updateModelButtonLabel();
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
                if ("value" in sysPromptEl) {
                    sysPromptEl.value = state.systemPrompt || "You are a helpful assistant.";
                } else {
                    sysPromptEl.innerText = state.systemPrompt || "You are a helpful assistant.";
                    sysPromptEl.style.whiteSpace = "pre-wrap";
                }
            }
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

function setThemeStyle(style) {
    localStorage.setItem("ai_theme_style", style);
    applyThemeStyle(style);
}

function applyThemeStyle(style) {
    document.documentElement.classList.remove("theme-pro", "theme-normal", "theme-max");
    document.documentElement.classList.add(`theme-${style}`);

    ["pro", "normal", "max"].forEach((s) => {
        const btn = document.getElementById(`styleBtn-${s}`);
        if (!btn) return;
        if (s === style) {
            btn.className = "px-3 py-2 rounded-xl text-xs font-semibold border transition flex flex-col items-center gap-1 bg-sky-500/10 text-sky-500 border-sky-500";
        } else {
            btn.className = "px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex flex-col items-center gap-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
        }
    });
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
            prov.protocol !== "anthropic_direct" &&
            prov.protocol !== "google" &&
            prov.name.toLowerCase() !== "puter.js"
        ) {
            try {
                const res = await fetch(
                    `${normalizeBaseUrl(prov.baseUrl)}/models`,
                    {
                        headers: {
                            Authorization: `Bearer ${prov.apiKey}`,
                        },
                    },
                );

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.data && Array.isArray(data.data)) {
                        state.providerModels[prov.id] = data.data
                            .map((m) => m.id)
                            .sort();
                        continue;
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
    if (icon) icon.classList.remove("fa-spin");
}

function renderModelsDropdown() {
    const listEl = document.getElementById("modelsList");
    const countEl = document.getElementById("modelCountLabel");
    const searchInput = document.getElementById("modelSearchInput");
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
    localStorage.setItem("ai_current_provider_id", providerId);
    localStorage.setItem("ai_model", modelId);

    updateModelButtonLabel();
    const drop = document.getElementById("modelDropdown");
    if (drop) drop.classList.add("hidden");
    renderModelsDropdown();
}

// mode: "branch" creates a new alternative branch, "edit" rewrites this node in place
function beginMessageEdit(nodeId, mode) {
    const conv = getActiveConversation();
    if (!conv || !conv.nodes[nodeId]) return;

    const node = conv.nodes[nodeId];
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

    // Parse out existing <file> tags back into attachments
    const { cleanPromptText, extractedFiles } = parseFileTagsFromPrompt(rawContent);

    // Load only clean prompt text into input
    input.innerHTML = MarkdownEditor.parseMarkdownWithMath(cleanPromptText);

    // Restore extracted files into the UI preview
    attachedFiles = [...extractedFiles];
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
        if (node.reasoning_content) {
            reasoningHtml = `
                <details class="reasoning-block group mb-2" open>
                    <summary class="cursor-pointer select-none font-semibold text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1.5 py-1">
                        <i class="fa-solid fa-brain"></i> Thinking Process
                    </summary>
                    <div class="markdown-body text-xs text-slate-600 dark:text-slate-300 mt-1 pl-4 border-l-2 border-indigo-500/30">
                        ${MarkdownEditor.parseMarkdownWithMath(node.reasoning_content)}
                    </div>
                </details>
            `;
        }

        let mcpToolCallsHtml = "";
        if (node.tool_calls && node.tool_calls.length > 0) {
            mcpToolCallsHtml = node.tool_calls.map((tc, idx) => {
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
                    <div class="mcp-tool-block mb-2 border border-sky-500/30 rounded-lg p-2 bg-sky-500/5">
                        <div class="font-semibold text-xs text-sky-500 flex items-center justify-between pb-1.5 border-b border-sky-500/20">
                            <span class="flex items-center gap-1.5">
                                <i class="fa-solid fa-screwdriver-wrench"></i> MCP Tool Call: <strong>${toolName}</strong>
                            </span>
                            <span class="text-[10px] opacity-70 font-mono">#${idx + 1}</span>
                        </div>
                        <div class="mt-2 space-y-2">
                            <details class="group">
                                <summary class="cursor-pointer select-none text-[11px] font-medium text-slate-400 hover:text-sky-400 flex items-center gap-1">
                                    <i class="fa-solid fa-chevron-right text-[9px] group-open:rotate-90 transition-transform"></i> Input Arguments (JSON)
                                </summary>
                                <pre class="mt-1 bg-slate-900 text-slate-200 p-2 rounded overflow-x-auto text-[11px] font-mono border border-slate-800"><code>${escapeHtml(toolArgs)}</code></pre>
                            </details>
                            <details class="group" open>
                                <summary class="cursor-pointer select-none text-[11px] font-medium text-slate-400 hover:text-emerald-400 flex items-center gap-1">
                                    <i class="fa-solid fa-chevron-right text-[9px] group-open:rotate-90 transition-transform"></i> Output / Result (JSON)
                                </summary>
                                <pre class="mt-1 bg-slate-900 text-emerald-300 p-2 rounded overflow-x-auto text-[11px] font-mono border border-slate-800"><code>${escapeHtml(toolOutput)}</code></pre>
                            </details>
                        </div>
                    </div>
                `;
            }).join("");
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

        let displayContent = node.content;

        if (Array.isArray(node.content)) {
            displayContent = node.content
                .map((item) => {
                    if (item.type === "text") {
                        let textContent = item.text;

                        const fileRegex =
                            /<file\s+title="([^"]+)">\n?([\s\S]*?)<\/file>/g;

                        return textContent.replace(
                            fileRegex,
                            (match, fileName) => {
                                return `<div class="inline-flex items-center gap-1.5 px-3 py-1 my-1.5 bg-slate-200/80 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-full border border-slate-300/60 dark:border-slate-600/60 shadow-xs">
                                    <i class="fa-solid fa-file-code text-sky-500 text-[11px]"></i>
                                    <span>${escapeHtml(fileName)}</span>
                                </div>`;
                            },
                        );

                        return textContent;
                    }
                    if (item.type === "image_url")
                        return `![Attached Image](${item.image_url.url})`;
                    return "";
                })
                .join("\n\n");
        }

        const formattedContent = MarkdownEditor.parseMarkdownWithMath(
            displayContent || "",
        );
        msgDiv.innerHTML = `
            <div class="flex items-center gap-2 max-w-[85%] sm:max-w-[75%] ${isUser ? "flex-row-reverse" : "flex-row"}">
                <div class="w-7 h-7 rounded-xl ${isUser ? "bg-sky-500 text-white" : "bg-indigo-600 text-white"} flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                    <i class="fa-solid ${isUser ? "fa-user" : "fa-robot"}"></i>
                </div>

                <div class="p-3 sm:p-4 rounded-2xl text-xs sm:text-sm shadow-sm bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 ${
                    isUser ? "rounded-tr-xs" : "rounded-tl-xs"
                }">
                    ${reasoningHtml}
                    ${mcpToolCallsHtml}
                    <div class="markdown-body">${formattedContent}</div>
                </div>
            </div>

            <div class="flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition">
                ${branchControls}
                <button onclick="branchMessage('${node.id}')" class="text-[10px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 p-0.5 rounded" title="Branch: keep this message and add an alternative">
                    <i class="fa-solid fa-code-branch text-[9px]"></i> Branch
                </button>
                <button onclick="editMessage('${node.id}')" class="text-[10px] text-slate-400 hover:text-sky-400 flex items-center gap-1 p-0.5 rounded" title="Edit: rewrite this message and regenerate what follows">
                    <i class="fa-solid fa-pen text-[9px]"></i> Edit
                </button>
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

    // Stop only if both text AND attached files are missing
    if (
        (!rawText || rawText.trim() === "") &&
        (!attachedFiles || attachedFiles.length === 0)
    )
        return;

    // Process text/code files and images separately
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

    // 2. Inject text/code file contents directly into the prompt text
    let fullTextPrompt = rawText || "";
    const nonImageFiles = attachedFiles.filter((f) => !f.isImage);

    if (nonImageFiles.length > 0) {
        const textFileBlocks = nonImageFiles
            .map(
                (f) =>
                    `\n\n<file title="${escapeHtml(f.name)}">\n${f.content || ""}\n</file>`,
            )
            .join("");
        fullTextPrompt = (fullTextPrompt + textFileBlocks).trim();
    }

    // 3. Construct multi-modal array payload
    const contentPayload = [];

    if (fullTextPrompt) {
        contentPayload.push({
            type: "text",
            text: fullTextPrompt,
        });
    }

    const imageFiles = attachedFiles.filter((f) => f.isImage);
    imageFiles.forEach((f) => {
        contentPayload.push({
            type: "image_url",
            image_url: {
                url: f.dataUrl,
            },
        });
    });

    // Clear attachments array
    attachedFiles = [];
    if (typeof renderAttachedFilesPreview === "function") {
        renderAttachedFilesPreview();
    }

    // Use structured content array if images exist, otherwise fallback to plain text string
    const messageContent =
        imageFiles.length > 0 ? contentPayload : fullTextPrompt;

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

    const provider = getActiveProvider();
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

    if (!conv.rootId) {
        conv.title = rawText.slice(0, 30) + (rawText.length > 30 ? "..." : "");
    }

    const isEditMode = state.isEditing && state.editingMode === "edit";
    const userMsgId = isEditMode ? state.editingNodeId : "msg_" + Date.now();
    const parentId = state.isEditing
        ? state.editingParentId
        : conv.activeLeafId;

    if (isEditMode && conv.nodes[userMsgId]) {
        // Rewrite the existing user message in place and drop everything after it
        removeDescendants(conv, userMsgId);
        conv.nodes[userMsgId].content = messageContent;
    } else {
        const newUserNode = {
            id: userMsgId,
            role: "user",
            content: messageContent,
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
    cancelEditingBranch();
    saveConversationsState();
    renderSidebarConversations();
    renderChatHistory();

    const pathNodes = getActivePath(conv);
    const apiMessages = [];

    if (state.systemPrompt && state.systemPrompt.trim() !== "") {
        apiMessages.push({
            role: "system",
            content: formatSystemPrompt(state.systemPrompt),
        });
    }

    pathNodes.forEach((n) => {
        apiMessages.push({
            role: n.role,
            content: n.content,
        });
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

    currentAbortController = new AbortController();
    setGenerationState(true);

    try {
        const mcpToolsList = await MCPEngine.discoverTools();

        const payload = {
            model: state.currentModel,
            messages: apiMessages,
            stream: true,
        };

        if (mcpToolsList && mcpToolsList.length > 0) {
            payload.tools = mcpToolsList.map((tool) => ({
                type: "function",
                function: {
                    name: tool.name,
                    description: tool.description || "",
                    parameters: tool.inputSchema ||
                        tool.parameters || { type: "object", properties: {} },
                },
            }));
            payload.tool_choice = "auto";
        }

        state.customParams
            .filter((p) => p.enabled)
            .forEach((p) => {
                payload[p.name] = p.value;
            });

        if (provider.name.toLowerCase() === "puter.js") {
            const stream = await PuterSDKBridge.chatCompletion(
                state.currentModel,
                apiMessages,
                { stream: true },
            );
            for await (const part of stream) {
                const text = part?.text || part?.delta?.content || "";
                if (text) {
                    newAssistantNode.content += text;
                    renderChatHistory();
                }
            }
        } else {
            const response = await fetch(
                `${normalizeBaseUrl(provider.baseUrl)}/chat/completions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${provider.apiKey}`,
                    },
                    body: JSON.stringify(payload),
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

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // Flush any remaining bytes left in the decoder
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
                                    const delta =
                                        json.choices?.[0]?.delta || {};
                                    if (delta.content) {
                                        newAssistantNode.content +=
                                            delta.content;
                                        scheduleChatRender();
                                    }
                                } catch (e) {}
                            }
                        }
                        renderChatHistory();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");
                    // Keep the last partial line in the buffer for the next iteration
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith("data:")) continue;
                        if (trimmed === "data: [DONE]") continue;

                        try {
                            const json = JSON.parse(
                                trimmed.substring(5).trim(),
                            );
                            const delta = json.choices?.[0]?.delta || {};

                            if (delta.tool_calls) {
                                for (const tc of delta.tool_calls) {
                                    if (!newAssistantNode.tool_calls)
                                        newAssistantNode.tool_calls = [];
                                    if (
                                        !newAssistantNode.tool_calls[tc.index]
                                    ) {
                                        newAssistantNode.tool_calls[tc.index] =
                                            {
                                                id: tc.id,
                                                type: "function",
                                                function: {
                                                    name: "",
                                                    arguments: "",
                                                },
                                            };
                                    }
                                    if (tc.id)
                                        newAssistantNode.tool_calls[
                                            tc.index
                                        ].id = tc.id;
                                    if (tc.function?.name)
                                        newAssistantNode.tool_calls[
                                            tc.index
                                        ].function.name += tc.function.name;
                                    if (tc.function?.arguments)
                                        newAssistantNode.tool_calls[
                                            tc.index
                                        ].function.arguments +=
                                            tc.function.arguments;
                                }
                            }

                            if (delta.reasoning_content) {
                                newAssistantNode.reasoning_content +=
                                    delta.reasoning_content;
                            } else if (delta.reasoning) {
                                newAssistantNode.reasoning_content +=
                                    delta.reasoning;
                            } else if (delta.thinking) {
                                newAssistantNode.reasoning_content +=
                                    delta.thinking;
                            }

                            if (delta.content) {
                                newAssistantNode.content += delta.content;
                            }

                            scheduleChatRender();
                        } catch (e) {
                            // Ignore parsing errors on incomplete chunks until the next line completes them
                        }
                    }
                }
            } catch (streamErr) {
                console.error("Stream reading error:", streamErr);
            }
            if (
                newAssistantNode.tool_calls &&
                newAssistantNode.tool_calls.length > 0
            ) {
                // Send a clean copy to the API (strip UI-only fields like `result`)
                apiMessages.push({
                    role: "assistant",
                    tool_calls: newAssistantNode.tool_calls.map((call) => ({
                        id: call.id,
                        type: call.type || "function",
                        function: {
                            name: call.function?.name || call.name || "",
                            arguments: call.function?.arguments || "{}",
                        },
                    })),
                    content: newAssistantNode.content || null,
                });

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

                    apiMessages.push({
                        role: "tool",
                        tool_call_id: call.id,
                        content:
                            typeof toolResult === "string"
                                ? toolResult
                                : JSON.stringify(toolResult),
                    });
                }
                renderChatHistory();

                const followUpPayload = {
                    model: state.currentModel,
                    messages: apiMessages,
                    stream: true,
                };

                state.customParams
                    .filter((p) => p.enabled)
                    .forEach((p) => {
                        followUpPayload[p.name] = p.value;
                    });

                const followUpResponse = await fetch(
                    `${normalizeBaseUrl(provider.baseUrl)}/chat/completions`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${provider.apiKey}`,
                        },
                        body: JSON.stringify(followUpPayload),
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
                                const delta = json.choices?.[0]?.delta || {};
                                if (delta.content) {
                                    newAssistantNode.content += delta.content;
                                    scheduleChatRender();
                                }
                            } catch (e) {}
                        }
                    }

                    if (!newAssistantNode.content.trim()) {
                        newAssistantNode.content =
                            "_The tool ran but the model returned no text. Tool output is shown above._";
                        renderChatHistory();
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
                newAssistantNode.content =
                    "_The model returned no text or tool calls._";
                renderChatHistory();
            }
        }
    } catch (err) {
        if (err.name !== "AbortError") {
            newAssistantNode.content += `\n\n**Error:** ${err.message}`;
            renderChatHistory();
        }
    } finally {
        currentAbortController = null;
        setGenerationState(false);
        saveConversationsState();
    }
}

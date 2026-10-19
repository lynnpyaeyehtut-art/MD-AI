const MCPEngine = {
    endpointMapping: {},

    async discoverTools() {
        const tools = [];
        const activeTools = state.mcpTools.filter((t) => t.enabled);



        // Include locally defined WebMCP script tools
        for (const t of activeTools) {
            if (t.execute && typeof t.execute === "function") {
                tools.push({
                    name: t.name,
                    description: t.description || "",
                    inputSchema: t.inputSchema || { type: "object", properties: {} }
                });
            }
        }

        for (const t of activeTools) {
            if (t.type === "Stdio" || typeof t.execute === "function") continue;

            try {
                let targetUrl = t.url;
                if (t.type === "SSE") {
                    const eventSource = new EventSource(t.url);
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            eventSource.close();
                            reject(new Error("SSE connection timeout"));
                        }, 5000);

                        eventSource.addEventListener("endpoint", (event) => {
                            clearTimeout(timeout);
                            let endpoint = event.data;
                            if (endpoint.startsWith("/")) {
                                const parsedUrl = new URL(t.url);
                                endpoint = `${parsedUrl.origin}${endpoint}`;
                            }
                            this.endpointMapping[t.id] = endpoint;
                            eventSource.close();
                            resolve();
                        });

                        eventSource.onerror = (err) => {
                            clearTimeout(timeout);
                            eventSource.close();
                            reject(err);
                        };
                    });
                    targetUrl = this.endpointMapping[t.id] || t.url;
                }

                const res = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "tools/list",
                        id: Date.now(),
                    }),
                });

                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (
                        contentType &&
                        contentType.includes("application/json")
                    ) {
                        const data = await res.json();
                        const toolList = data.result?.tools || data.tools;
                        if (Array.isArray(toolList)) {
                            tools.push(...toolList);
                        }
                    }
                }
            } catch (e) {
                console.warn(
                    `Failed to discover tools from MCP endpoint ${t.name}:`,
                    e,
                );
            }
        }
        return tools;
    },

    async callTool(toolName, args) {
        const activeTools = state.mcpTools.filter((t) => t.enabled);

        // Check local WebMCP script functions first
        const localTool = activeTools.find(
            (t) => t.name === toolName && typeof t.execute === "function"
        );
        if (localTool) {
            try {
                return await localTool.execute(args);
            } catch (e) {
                console.error(`WebMCP script tool execution error for ${toolName}:`, e);
                return { error: e.message || `Error executing WebMCP script ${toolName}` };
            }
        }

        // Fallback to external endpoint MCP tool execution
        for (const t of activeTools) {
            if (t.type === "Stdio") continue;
            const targetUrl =
                t.type === "SSE" ? this.endpointMapping[t.id] : t.url;
            if (!targetUrl) continue;

            try {
                const res = await fetch(targetUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        method: "tools/call",
                        params: { name: toolName, arguments: args },
                        id: Date.now(),
                    }),
                });

                if (res.ok) {
                    const contentType = res.headers.get("content-type");
                    if (
                        contentType &&
                        contentType.includes("application/json")
                    ) {
                        const data = await res.json();
                        if (data.result !== undefined) return data.result;
                        if (data.error)
                            return {
                                error:
                                    data.error.message || "Unknown MCP error",
                            };
                        return data;
                    } else {
                        const textData = await res.text();
                        return { result: textData };
                    }
                } else {
                    return { error: `HTTP ${res.status}: ${res.statusText}` };
                }
            } catch (e) {
                console.error(`MCP Tool execution error for ${toolName}:`, e);
                return { error: e.message || "Network request failed" };
            }
        }
        return {
            error: `Tool ${toolName} execution failed or endpoint unreachable.`,
        };
    },
};

function saveMcpToolsState() {
    // Strip execution functions prior to JSON stringification
    const toolsToSave = (state.mcpTools || []).map(tool => {
        if (tool.type === "WebMCP") {
            const { execute, ...serializableTool } = tool;
            return serializableTool;
        }
        return tool;
    });

    localStorage.setItem("ai_mcp_tools", JSON.stringify(toolsToSave));
    renderMcpToolsList();
}
function saveNewMcpTool() {
    const name = document.getElementById("newMcpName").value.trim();
    const type = document.getElementById("newMcpType").value;
    const url = document.getElementById("newMcpUrl").value.trim();
    const desc = document.getElementById("newMcpDesc").value.trim();
    const jsonConfig = document.getElementById("newMcpJson")
        ? document.getElementById("newMcpJson").value.trim()
        : "";

    if (!name) return;

    // Validate JSON input before saving
    if (jsonConfig) {
        try {
            JSON.parse(jsonConfig);
        } catch (e) {
            alert("Invalid Custom JSON syntax. Please verify formatted JSON.");
            return;
        }
    }

    const newTool = {
        id: "mcp_" + Date.now(),
        name,
        type,
        url,
        description: desc,
        jsonConfig,
        enabled: true,
    };

    if (!state.mcpTools) state.mcpTools = [];
    state.mcpTools.push(newTool);

    // Clear form inputs
    document.getElementById("newMcpName").value = "";
    document.getElementById("newMcpUrl").value = "";
    document.getElementById("newMcpDesc").value = "";
    if (document.getElementById("newMcpJson")) {
        document.getElementById("newMcpJson").value = "";
    }

    saveMcpToolsState();
    renderMcpToolsList();
}

function parseMcpConfig(jsonString) {
    let headers = {};
    let body = {};
    if (!jsonString) return { headers, body };

    try {
        const parsed = JSON.parse(jsonString);
        if (parsed.headers && typeof parsed.headers === "object") {
            headers = parsed.headers;
        }
        if (parsed.body && typeof parsed.body === "object") {
            body = parsed.body;
        }
    } catch (e) {
        console.warn("Failed to parse MCP JSON config:", e);
    }
    return { headers, body };
}

function renderMcpToolsList() {
    const list = document.getElementById("mcpToolsList");
    if (!list) return;
    list.innerHTML = "";

    if (!state.mcpTools || state.mcpTools.length === 0) {
        list.innerHTML = `<p class="text-[11px] text-slate-400 italic">No MCP tools configured yet.</p>`;
        return;
    }

    state.mcpTools.forEach((tool) => {
        const row = document.createElement("div");
        row.className =
            "p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 flex flex-col gap-1.5";

        row.innerHTML = `
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 truncate">
                    <button onclick="toggleMcpToolEnabled('${tool.id}')" class="flex-shrink-0 transition" title="${tool.enabled ? "Disable Tool" : "Enable Tool"}">
                        <i class="fa-solid ${tool.enabled ? "fa-toggle-on text-emerald-500 text-base" : "fa-toggle-off text-slate-400 text-base"}"></i>
                    </button>
                    <span class="font-bold text-slate-800 dark:text-slate-100 truncate">${escapeHtml(tool.name)}</span>
                    <span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-sky-500/10 text-sky-500 uppercase">${escapeHtml(tool.type || "SSE")}</span>
                </div>
                <button onclick="removeMcpTool('${tool.id}')" class="text-red-500 hover:text-red-600 p-1 flex-shrink-0" title="Remove Tool">
                    <i class="fa-solid fa-trash-can text-xs"></i>
                </button>
            </div>
            ${tool.url ? `<div class="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate bg-slate-200/50 dark:bg-slate-900/50 px-2 py-0.5 rounded">${escapeHtml(tool.url)}</div>` : ""}
            ${tool.description ? `<div class="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">${escapeHtml(tool.description)}</div>` : ""}
        `;
        list.appendChild(row);
    });
}

function toggleMcpToolEnabled(id) {
    const tool = state.mcpTools.find((t) => t.id === id);
    if (tool) {
        tool.enabled = !tool.enabled;
        saveMcpToolsState();
    }
}

function removeMcpTool(id) {
    state.mcpTools = state.mcpTools.filter((t) => t.id !== id);
    saveMcpToolsState();
}

function toggleMcpTypeFields() {
    const type = document.getElementById("newMcpType").value;
    const urlGroup = document.getElementById("mcpUrlGroup");
    const jsonGroup = document.getElementById("mcpJsonGroup");
    const webMcpGroup = document.getElementById("mcpWebMcpGroup");

    if (type === "WebMCP") {
        if (urlGroup) urlGroup.classList.add("hidden");
        if (jsonGroup) jsonGroup.classList.add("hidden");
        if (webMcpGroup) webMcpGroup.classList.remove("hidden");
    } else {
        if (urlGroup) urlGroup.classList.remove("hidden");
        if (jsonGroup) jsonGroup.classList.remove("hidden");
        if (webMcpGroup) webMcpGroup.classList.add("hidden");
    }
}
function rehydrateWebMcpTools() {
    if (Array.isArray(state.mcpTools)) {
        state.mcpTools = state.mcpTools.map(tool => {
            if (tool.type === "WebMCP" && tool.scriptText && !tool.execute) {
                try {
                    const evaluated = new Function(`return (${tool.scriptText});`)();
                    tool.execute = evaluated.execute;
                } catch (e) {
                    console.error("Failed to restore WebMCP tool execution:", e);
                }
            }
            return tool;
        });
    }
}
function saveNewMcpTool() {
    const nameEl = document.getElementById("newMcpName");
    const typeEl = document.getElementById("newMcpType");
    const urlEl = document.getElementById("newMcpUrl");
    const descEl = document.getElementById("newMcpDesc");

    const name = nameEl ? nameEl.value.trim() : "";
    const type = typeEl ? typeEl.value : "SSE";
    const url = urlEl ? urlEl.value.trim() : "";
    const desc = descEl ? descEl.value.trim() : "";

    if (!name) {
        alert("Please enter a tool name.");
        return;
    }

    if (!Array.isArray(state.mcpTools)) {
        state.mcpTools = [];
    }

    let parsedTool = {
        id: "mcp_" + Date.now(),
        name,
        type,
        url,
        description: desc,
        enabled: true
    };

    if (type === "WebMCP") {
        const scriptEl = document.getElementById("newWebMcpScript");
        const scriptText = scriptEl ? scriptEl.value.trim() : "";
        if (!scriptText) {
            alert("Please provide the WebMCP script definition.");
            return;
        }

        try {
            const evaluated = new Function(`return (${scriptText});`)();
            parsedTool.inputSchema = evaluated.inputSchema || { type: "object", properties: {} };
            parsedTool.execute = evaluated.execute;
            parsedTool.scriptText = scriptText;
        } catch (e) {
            alert("Invalid WebMCP Script syntax. Ensure it is a valid JavaScript object format:\n" + e.message);
            return;
        }
    } else {
        const jsonEl = document.getElementById("newMcpJson");
        const jsonText = jsonEl ? jsonEl.value.trim() : "";
        if (jsonText) {
            try {
                parsedTool.config = JSON.parse(jsonText);
            } catch (e) {
                alert("Invalid Custom JSON syntax. Please format valid JSON.");
                return;
            }
        }
    }

    state.mcpTools.push(parsedTool);
    saveMcpToolsState();

    // Reset inputs
    if (nameEl) nameEl.value = "";
    if (urlEl) urlEl.value = "";
    if (descEl) descEl.value = "";
    if (document.getElementById("newWebMcpScript")) document.getElementById("newWebMcpScript").value = "";
    if (document.getElementById("newMcpJson")) document.getElementById("newMcpJson").value = "";
}

function addMcpPreset(preset) {
    if (preset === "search") {
        state.mcpTools.push({
            id: "mcp_" + Date.now(),
            name: "Web Search MCP",
            type: "SSE",
            url: "https://mcp.search.example.com/sse",
            description:
                "Enables live internet searching & web content scraping",
            enabled: true,
        });
    } else if (preset === "filesystem") {
        state.mcpTools.push({
            id: "mcp_" + Date.now(),
            name: "Filesystem MCP",
            type: "Stdio",
            url: "npx -y @modelcontextprotocol/server-filesystem /workspace",
            description:
                "File reading, writing, and workspace directory management",
            enabled: true,
        });
    } else if (preset === "github") {
        state.mcpTools.push({
            id: "mcp_" + Date.now(),
            name: "GitHub MCP",
            type: "HTTP",
            url: "https://api.github.com/mcp",
            description:
                "Repository browsing, issue tracking, and PR management",
            enabled: true,
        });
    }
    saveMcpToolsState();
}

const MCP_PAGE_HTML = `
                        <div
                            id="tabContent-mcp"
                            class="settings-tab-panel hidden space-y-4"
                        >
                            <div class="flex items-center justify-between">
                                <div>
                                    <span
                                        class="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block"
                                        >Model Context Protocol (MCP)
                                        Tools</span
                                    >
                                    <p class="text-[10px] text-slate-400">
                                        Configure external tools, servers, and
                                        capabilities
                                    </p>
                                </div>
                                <div class="flex gap-1">
                                    <button
                                        onclick="addMcpPreset('search')"
                                        class="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 text-[10px] font-semibold rounded-lg transition"
                                        title="Add Search MCP"
                                    >
                                        + Web Search
                                    </button>
                                    <button
                                        onclick="addMcpPreset('filesystem')"
                                        class="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 text-[10px] font-semibold rounded-lg transition"
                                        title="Add Filesystem MCP"
                                    >
                                        + Filesystem
                                    </button>
                                    <button
                                        onclick="addMcpPreset('github')"
                                        class="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-semibold rounded-lg transition"
                                        title="Add GitHub MCP"
                                    >
                                        + GitHub
                                    </button>
                                </div>
                            </div>

                            <div
                                id="mcpToolsList"
                                class="space-y-2.5 max-h-48 overflow-y-auto pr-1"
                            ></div>

                            <div
                                class="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                            >
                                <span
                                    class="block text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5"
                                >
                                    <i
                                        class="fa-solid fa-plus text-sky-500 text-xs"
                                    ></i>
                                    Add Custom MCP Tool
                                </span>

                                <div
                                    class="grid grid-cols-1 sm:grid-cols-3 gap-2"
                                >
                                    <div class="sm:col-span-2">
                                        <label
                                            class="block text-[10px] text-slate-400 mb-0.5"
                                            >Tool Name</label
                                        >
                                        <input
                                            id="newMcpName"
                                            type="text"
                                            placeholder="e.g. Memory MCP"
                                            class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            class="block text-[10px] text-slate-400 mb-0.5"
                                            >Transport Type</label
                                        >
                                        <select
                                            id="newMcpType"
                                            onchange="toggleMcpTypeFields()"
                                            class="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500"
                                        >
                                            <option value="SSE">
                                                SSE (Server-Sent Events)
                                            </option>
                                            <option value="Stdio">
                                                Stdio / Command
                                            </option>
                                            <option value="HTTP">
                                                HTTP Endpoint
                                            </option>
                                            <option value="WebMCP">
                                                WebMCP Script
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div id="mcpUrlGroup">
                                    <label
                                        class="block text-[10px] text-slate-400 mb-0.5"
                                        >Server URL or CLI Command</label
                                    >
                                    <input
                                        id="newMcpUrl"
                                        type="text"
                                        placeholder="https://mcp.example.com/sse or npx -y @modelcontextprotocol/server-..."
                                        class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 font-mono"
                                    />
                                </div>

                                <div id="mcpWebMcpGroup" class="hidden">
                                    <label
                                        class="block text-[10px] text-slate-400 mb-0.5"
                                        >WebMCP Script Function (\`inputSchema\` & \`execute\`)</label
                                    >
                                    <textarea
                                        id="newWebMcpScript"
                                        rows="6"
                                        placeholder='{\\n  inputSchema: {\\n    type: "object",\\n    properties: {\\n      PARAM_NAME: { type: "string", description: "Param info" }\\n    },\\n    required: ["PARAM_NAME"]\\n  },\\n  execute: async (input) => {\\n    return { success: true, data: input.PARAM_NAME };\\n  }\\n}'
                                        class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 font-mono resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label
                                        class="block text-[10px] text-slate-400 mb-0.5"
                                        >Description / Capability Summary</label
                                    >
                                    <input
                                        id="newMcpDesc"
                                        type="text"
                                        placeholder="Brief description of functions provided by this tool..."
                                        class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500"
                                    />
                                </div>

                                <div id="mcpJsonGroup">
                                    <label
                                        class="block text-[10px] text-slate-400 mb-0.5"
                                        >Custom JSON Config (Optional Headers &
                                        Body)</label
                                    >
                                    <textarea
                                        id="newMcpJson"
                                        rows="3"
                                        placeholder='{\\n  "headers": {\\n    "Authorization": "Bearer YOUR_KEY"\\n  },\\n  "body": {\\n    "customParam": "value"\\n  }\\n}'
                                        class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-sky-500 font-mono resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    onclick="saveNewMcpTool()"
                                    class="w-full py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 shadow-sm"
                                >
                                    <i class="fa-solid fa-plus text-xs"></i> Add
                                    MCP Tool
                                </button>
                            </div>
                        </div>
`;

function injectMcpSettingsPage() {
    if (document.getElementById("tabContent-mcp")) return;

    const providerPanel = document.getElementById("tabContent-provider");
    const container = providerPanel ? providerPanel.parentElement : null;
    if (!container) return;

    const template = document.createElement("div");
    template.innerHTML = MCP_PAGE_HTML.trim();
    const page = template.firstElementChild;
    if (!page) return;

    const anchor = document.getElementById("tabContent-appearance");
    if (anchor) {
        container.insertBefore(page, anchor);
    } else {
        container.appendChild(page);
    }
}

document.addEventListener("DOMContentLoaded", injectMcpSettingsPage);

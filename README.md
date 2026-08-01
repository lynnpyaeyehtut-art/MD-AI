# MD-AI
AI BYOK with markdown editing for prompts

# Warning
**All** of the content generated for HTML file and the rest of the markdown file is made entirely with the help of AI.
If you do not support AI or AI generated product leave. 

# 🤖 AI Wrapper

A feature-rich, single-file modern web client and wrapper for Large Language Models (LLMs). Built with **Tailwind CSS**, **Vanilla JavaScript**, and packed with advanced formatting tools, secure API key storage, custom parameter controls, and **Model Context Protocol (MCP)** support.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=flat&logo=html5&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338Bdf8.svg?style=flat&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23F7DF1E.svg?style=flat&logo=javascript&logoColor=black)

---

## ✨ Features

- **Multi-Provider & Auth Management:** Configure multiple API providers (OpenAI, Groq, OpenRouter, DeepSeek, etc.) with encrypted AES-GCM local API key storage.
- **Dynamic Model Selection:** Fetch and search through available models directly from your providers with real-time filtering.
- **WYSIWYG Markdown & Math Editor:** 
  - Rich formatting toolbar for headers, bold/italic text, lists, and code blocks.
  - Full **LaTeX / KaTeX** mathematical formula rendering support (`.........`, `......`, `.........`).
  - Interactive table generator with row/column insertion and deletion.
- **Streaming Responses:** Real-time token streaming with support for reasoning/thinking process blocks (compatible with models like DeepSeek-R1).
- **Session & Conversation Management:** Sidebar history to manage, rename, and delete multiple chat threads stored locally in your browser.
- **Custom API Parameters:** Add and tweak custom sliders, dropdowns, and switches (e.g., Temperature, Reasoning Effort, Thinking mode).
- **MCP (Model Context Protocol) Tools:** Configure external capabilities like Web Search, Local Filesystem, and GitHub tools.
- **Dark/Light Theme Support:** Fully responsive interface with automatic UI transitions.

---

## 🚀 Getting Started

Since this project is packaged into a **single, standalone HTML file** (`index.html`), you don't need to run `npm install` or set up complex build pipelines!

### Running Locally
1. Download or clone this repository.
2. Open the `index.html` file in any modern web browser (Chrome, Firefox, Edge, Safari).
3. Click the **Gear icon (Settings)** in the top right to add your AI Provider's Base URL and API Key.
4. Start chatting!

### Deploying Live (Free Hosting)
You can share this project with others instantly using **GitHub Pages**:
1. Upload your code to a GitHub repository (see [Uploading to GitHub](#)).
2. Go to your repository's **Settings** > **Pages**.
3. Under **Branch**, select `main` (or `master`) and click **Save**.
4. GitHub will provide a live URL where anyone can access your web client!

---

## ⚙️ Configuration & Variables

Inside the System Instructions settings, you can use the following dynamic templates:
- `{model-ID}` — Inserts the currently selected model name.
- `{Time}` — Inserts the current local time.
- `{date}` — Inserts the current date.
- `{place}` — Inserts client location metadata.

---

## 🛠️ Built With

- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework for rapid UI design.
- **[Font Awesome](https://fontawesome.com/)** — Icon library for clean vector UI elements.
- **[Marked.js](https://marked.js.org/):** Fast markdown parser and compiler.
- **[Highlight.js](https://highlightjs.org/):** Syntax highlighting for code blocks with copy/download utilities.
- **[KaTeX](https://katex.org/):** Fast math typesetting for the web.



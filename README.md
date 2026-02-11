<div align="center">

# 🪶 Raven

**An intelligent agent chat application built with Vue 3 and Tauri**

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=000)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## ✨ Features

Raven is a powerful desktop application for interacting with AI agents through a rich, intuitive interface.

### 🤖 Agent Chat
- **Multi-Model Support** - Compatible with OpenAI, DeepSeek, OpenRouter, and any OpenAI-compatible API
- **Agent Client Protocol (ACP)** - Full support for [ACP](https://github.com/modelcontextprotocol/agent-client-protocol) agents
- **Slash Commands** - Quick access to agent commands and actions
- **Permission Management** - Granular control over agent permissions
- **Mention Support** - Mention agents and resources in conversations
- **Context Display** - View and manage conversation context

### 📝 Journal
- **Daily Journaling** - Create and edit daily journal entries
- **Rich Text Editor** - Full-featured TipTap editor with markdown support
- **Calendar View** - Navigate entries with an interactive calendar
- **Recent Entries** - Quick access to recent journal entries

### 📚 Documents
- **Document Management** - Create, edit, and organize documents
- **Real-time Collaboration** - Yjs-based CRDT for concurrent editing
- **Markdown Support** - Full markdown with syntax highlighting

### 🎨 Artifacts
- **Content Generation** - View and manage AI-generated artifacts
- **Multiple Formats** - Support for various content types
- **Interactive Preview** - Live preview of generated content

### 💻 Workspace Editor
- **Code Editor** - Syntax-highlighted code editor with 10+ languages
- **Diff Viewer** - Side-by-side diff comparison
- **File Tree** - Navigate workspace files
- **Terminal** - Integrated terminal for command execution

### ⚙️ MCP Integration
- **MCP Server Management** - Configure and manage Model Context Protocol servers
- **Import/Export** - Easy MCP configuration sharing
- **Live Logs** - View MCP server logs in real-time

---

## 🛠️ Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework with Composition API
- **TypeScript** - Type-safe development
- **Nuxt UI** - Beautiful, accessible UI components
- **Tailwind CSS v4** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **TipTap** - Rich text editor
- **CodeMirror 6** - Code editor with syntax highlighting
- **Vue Flow** - Interactive node-based editor
- **Xterm.js** - Terminal emulator

### Backend
- **Tauri 2** - Rust-based desktop framework
- **SQLite** - Embedded database via Tauri SQL plugin

### AI/Agent
- **Agent Client Protocol SDK** - Agent integration
- **Vercel AI SDK** - Streaming AI responses
- **DeepSeek, OpenAI, OpenRouter** - AI model providers

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and Yarn
- **Rust** (for Tauri)
- **System dependencies** for Tauri (see [Tauri prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tauri-app

# Install dependencies
yarn install
```

### Development

```bash
# Start Vite dev server (port 1420)
yarn dev

# Start full Tauri app with hot reload
yarn tauri dev

# Start Tauri in release mode (faster)
yarn tauri dev --release
```

### Building

```bash
# Build frontend for production
yarn build

# Build full desktop application
yarn tauri build

# Build debug version
yarn tauri build --debug
```

### Type Checking

```bash
# TypeScript type checking (run before committing)
yarn vue-tsc --noEmit
```

---

## 📁 Project Structure

```
tauri-app/
├── src/                          # Vue frontend
│   ├── components/               # Reusable Vue components
│   │   ├── AgentChat/           # Agent chat components
│   │   ├── SimpleChat/          # Simple chat components
│   │   ├── Journal/             # Journal components
│   │   ├── NoteEditor/          # Rich text editor
│   │   ├── WorkspaceEditor/     # Code/diff editor
│   │   ├── ChartEditor/         # Flow chart editor
│   │   └── Settings/            # Settings components
│   ├── pages/                   # Page components
│   ├── stores/                  # Pinia stores
│   ├── services/                # Service layer
│   ├── hooks/                   # Vue composables
│   └── db/                      # Database operations
├── src-tauri/                   # Rust backend
│   ├── src/
│   │   ├── handlers.rs         # Tauri commands
│   │   └── lib.rs              # Library entry
│   ├── migrations/             # Database migrations
│   └── Cargo.toml              # Rust dependencies
└── public/                      # Static assets
```

---

## 🎨 Code Style

### Vue Components
- Use `<script setup lang="ts">` syntax
- Import order: Vue → third-party → local (using `@/` alias)
- Props defined with explicit types
- Auto-imported Nuxt UI components

### TypeScript
- Explicit return types on functions
- Export interfaces at module level
- Error handling with typed errors

### Rust/Tauri
- Commands in `src-tauri/src/handlers.rs`
- `#[tauri::command]` macro for exposed functions
- `Result<T, serde_json::Value>` for error handling

> See [AGENTS.md](AGENTS.md) for detailed code style guidelines.

---

## 🔑 Key Concepts

### Agent Chat
Raven supports two chat modes:
- **Simple Chat** - Basic Q&A with AI models
- **Agent Chat** - Full ACP agent interaction with tools, permissions, and context

### MCP Servers
Model Context Protocol servers extend agent capabilities with external tools and resources. Configure servers in Settings > MCP.

### Artifacts
Artifacts are AI-generated content (code, documents, visualizations) that can be previewed and managed separately from the chat.

### Documents
Collaborative documents with real-time editing using Yjs CRDTs.

---

## 🧪 Testing

```bash
# Rust tests
cargo test --manifest-path=src-tauri/Cargo.toml

# Single test
cargo test test_name --manifest-path=src-tauri/Cargo.toml
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please ensure you:
1. Run `yarn vue-tsc --noEmit` before committing
2. Follow the code style guidelines in [AGENTS.md](AGENTS.md)
3. Test your changes thoroughly

---

<div align="center">

**Built with ❤️ using Vue 3 and Tauri**

</div>

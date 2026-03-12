# SmartEdit — AI Video Editing Assistant for Adobe Premiere Pro

SmartEdit is a CEP (Common Extensibility Platform) extension for **Adobe Premiere Pro 2025+** that uses local (Ollama) or cloud (OpenAI) AI to generate structured edit plans, then builds sequences on the Premiere timeline automatically.

---

## Prerequisites

Install the following **before** doing anything else.

### 1. Node.js (v18+ recommended)
- Download from https://nodejs.org/en/download/
- During install, ensure **"Add to PATH"** is checked.
- Verify: open a terminal and run `node -v`

### 2. Adobe Premiere Pro 2025 (v25.0+)

### 3. Choose your AI Provider

**Option A — Ollama (Local, Free)**
- Download from https://ollama.com
- Install and run Ollama, then pull the default model:
  ```
  ollama pull qwen2.5:7b
  ```
- Verify Ollama is running: visit http://localhost:11434 in a browser (should show "Ollama is running")

**Option B — OpenAI (Cloud, Paid)**
- Create an account at https://platform.openai.com
- Generate an API Key at https://platform.openai.com/api-keys
- No local install needed — enter the key in the extension settings.

---

## Installation Steps

### Step 1 — Enable Debug Mode (Required for unsigned extensions)

Open **PowerShell as Administrator** and run:
```powershell
reg add "HKEY_CURRENT_USER\SOFTWARE\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d "1" /f
```

### Step 2 — Copy Extension to Adobe CEP Folder

Copy the `com.smartedit.extension` folder (this folder) to:
```
C:\Users\<YOUR_USERNAME>\AppData\Roaming\Adobe\CEP\extensions\
```

So the final path looks like:
```
C:\Users\<YOUR_USERNAME>\AppData\Roaming\Adobe\CEP\extensions\com.smartedit.extension\
```

> **Tip:** Press `Win+R`, type `%APPDATA%\Adobe\CEP\extensions` and press Enter to open the folder.

### Step 3 — Install Node.js Dependencies

Open **PowerShell** and run:
```powershell
cd "$env:APPDATA\Adobe\CEP\extensions\com.smartedit.extension\node"
npm install
```

This installs: `express`, `axios`, `cors`, `openai`, `zod`, etc.

### Step 4 — Launch Premiere Pro

1. Open **Adobe Premiere Pro 2025**.
2. Go to **Window > Extensions (Legacy) > SmartEdit**.
3. The panel will open. Wait a few seconds for `Server: Connected` or `Server Started` to appear at the bottom.

---

## First Use

1. Paste your **video script** in the text area.
2. Set a **Target Duration** (seconds).
3. Open **⚙️ Settings** to choose your AI provider and model.
4. Click **Generate Edit Plan ✨**.
5. Review the accordion sections: Titles, Visuals, Script, Music.
6. Click **Build Sequence** to create a Premiere sequence with markers on the timeline.

---

## Project Structure

```
com.smartedit.extension/
├── CSXS/
│   └── manifest.xml          ← CEP manifest (targets Premiere Pro 2025)
├── cep/
│   ├── index.html            ← Panel UI
│   ├── main.js               ← Frontend logic + Node.js spawn
│   ├── styles.css            ← Panel styles
│   └── CSInterface.js        ← Adobe CEP library
├── jsx/
│   └── hostscript.jsx        ← ExtendScript (Premiere API calls)
├── node/
│   ├── server.js             ← Express backend (port 3000)
│   ├── package.json
│   └── services/
│       ├── ollamaService.js  ← Ollama integration
│       ├── openaiService.js  ← OpenAI integration
│       └── validationService.js
└── .debug                    ← Enables CEP debug mode
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Extension not in menu | Check registry key (Step 1), verify folder path (Step 2) |
| "Server Starting..." forever | Run `node -v` in terminal to verify Node is on PATH |
| "Failed to communicate with Ollama" | Open http://localhost:11434 in browser to verify Ollama is running |
| Visual Plan is empty `[]` | Regenerate — the AI prompt now forces visual descriptions |
| Build Sequence does nothing | Generate a plan first, then click Build |
| Port 3000 already in use | Run: `netstat -ano | findstr :3000`, then kill that PID |

---

## Development Notes

- The Node.js server auto-starts when the panel loads (via `child_process.spawn`).
- The panel uses **localStorage** to persist settings (provider, model, API key).
- ExtendScript (`hostscript.jsx`) runs inside Premiere Pro's JavaScript engine — it is ES3 level, no ES6+ syntax.
- The `.debug` file at the extension root enables Chrome DevTools debugging for CEP panels.
- To debug the CEP panel: open Chrome and go to `chrome://inspect` while the panel is open.

---

## Current Limitations / Roadmap

- Text clips on timeline: currently implemented as **Markers** (MOGRT text support coming soon).
- Music: AI suggests a mood/genre but does not auto-import audio files yet.
- Footage placement: supports drag-import but does not auto-place on timeline yet.

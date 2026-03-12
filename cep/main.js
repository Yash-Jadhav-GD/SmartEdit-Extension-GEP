/* Main JS for SmartEdit Panel */

// --- Node.js Integration ---
let fs, path, spawn;
let nodeEnabled = false;

try {
    fs = require('fs');
    path = require('path');
    spawn = require('child_process').spawn;
    nodeEnabled = true;
} catch (e) {
    console.error("Node.js integration failed: " + e.message);
}

var csInterface = new CSInterface();
const NODE_SERVER = 'http://localhost:3000';
let serverProcess = null;
let currentPlan = null; // Store the plan globally

// Auto-start server logic
function checkAndStartServer() {
    if (!nodeEnabled) {
        log('Error: Node.js disabled (manifest flag?)');
        return;
    }

    fetch(`${NODE_SERVER}/tags`) // Use tags endpoint as health check
        .then(response => {
            log('Server: Connected.');
            loadModels(); // Load models if server is up
        })
        .catch(() => {
            log('Starting local server...');
            spawnServer();
        });
}

function spawnServer() {
    try {
        const extensionRoot = csInterface.getSystemPath(SystemPath.EXTENSION);
        const nodeDir = path.join(extensionRoot, 'node');
        
        serverProcess = spawn('node', ['server.js'], { cwd: nodeDir, detached: false });

        serverProcess.stdout.on('data', (data) => {
            console.log(`[Node]: ${data}`);
            if (data.includes('running')) {
                log('Server Started.');
                setTimeout(loadModels, 1000); 
            }
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(`[Node Error]: ${data}`);
        });

        serverProcess.on('error', (err) => {
            log('Wait: Server spawn failed.');
            alert("Failed to start Node.js server!\nIs 'node' installed and in your PATH?\n\nError: " + err.message);
        });

    } catch (e) {
        log('Failed to spawn server: ' + e.message);
        alert('Exception spawning server: ' + e.message);
    }
}

// --- UI Logic ---

const btnSettings = document.getElementById('btnSettings');
const settingsPanel = document.getElementById('settingsPanel');
const providerSelect = document.getElementById('providerSelect');
const modelInput = document.getElementById('modelInput');
const apiKeyInput = document.getElementById('apiKeyInput');
const apiKeyGroup = document.getElementById('apiKeyGroup');
const saveSettings = document.getElementById('saveSettings');
const durationInput = document.getElementById('durationInput');

if(btnSettings) {
    btnSettings.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
        if (!settingsPanel.classList.contains('hidden')) {
            loadModels(); // Refresh models on open settings
        }
    });
}

saveSettings.addEventListener('click', () => {
    settingsPanel.classList.add('hidden');
    // Save to localStorage
    localStorage.setItem('smartedit_provider', providerSelect.value);
    localStorage.setItem('smartedit_model', modelInput.value);
    localStorage.setItem('smartedit_apikey', apiKeyInput.value);
});

providerSelect.addEventListener('change', () => {
    updateModelDefaults();
});

function updateModelDefaults() {
    const isOpenAI = providerSelect.value === 'OpenAI';
    if (isOpenAI) {
        apiKeyGroup.classList.remove('hidden');
        if (modelInput.value.includes('qwen') || modelInput.value.includes('llama') || !modelInput.value) {
            modelInput.value = 'gpt-4o'; // Default to GPT-4o
        }
        modelInput.placeholder = 'gpt-4o, gpt-4-turbo';
        
        const listId = 'modelList';
        let datalist = document.getElementById(listId);
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = listId;
            document.body.appendChild(datalist);
            modelInput.setAttribute('list', listId);
        }
        datalist.innerHTML = '';
        ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'].forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            datalist.appendChild(opt);
        });

    } else {
        apiKeyGroup.classList.add('hidden');
        modelInput.placeholder = 'Loading models...';
        if (modelInput.value.includes('gpt')) {
            modelInput.value = 'qwen2.5:7b'; // Default Ollama
        }
        loadModels();
    }
}

// Load Settings
function loadSettings() {
    const p = localStorage.getItem('smartedit_provider');
    const m = localStorage.getItem('smartedit_model');
    const k = localStorage.getItem('smartedit_apikey');
    
    if (p) {
        providerSelect.value = p;
        if (p === 'OpenAI') apiKeyGroup.classList.remove('hidden');
    }
    if (m) modelInput.value = m;
    else modelInput.value = 'qwen2.5:7b'; 
    
    if (k) apiKeyInput.value = k;
}

async function loadModels() {
    if (providerSelect.value === 'OpenAI') return;

    log('Loading Models...');
    try {
        const response = await fetch(`${NODE_SERVER}/tags`);
        const data = await response.json();
        
        if (data.success && data.models) {
            log('Models Loaded.');
            const listId = 'modelList';
            let datalist = document.getElementById(listId);
            
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = listId;
                document.body.appendChild(datalist);
                modelInput.setAttribute('list', listId);
            }
            
            datalist.innerHTML = '';
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                datalist.appendChild(option);
            });
            
            if (!modelInput.value || modelInput.value === 'qwen2.5:7b') {
                 const bestMatch = data.models.find(m => m.includes('qwen')) || data.models.find(m => m.includes('llama')) || data.models[0];
                 if(bestMatch) modelInput.value = bestMatch;
            }
        }
    } catch (e) {
        console.error("Models fetch failed: " + e.message);
    }
}

// --- Core Logic ---

function log(msg) {
    const statusEl = document.getElementById('status');
    if(statusEl) statusEl.innerText = msg;
}

document.getElementById('btnGenerate').addEventListener('click', async () => {
    const script = document.getElementById('scriptInput').value;
    const style = document.getElementById('styleSelect').value;
    const musicMode = document.getElementById('musicMode').value;
    const provider = providerSelect.value;
    const model = modelInput.value;
    const apiKey = apiKeyInput.value;
    const duration = durationInput.value;

    if (!script) {
        alert('Please enter a script first.');
        return;
    }

    log(`Generating with ${provider} (${model})...`);
    
    try {
        const response = await fetch(`${NODE_SERVER}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script, style, musicMode, provider, model, apiKey, duration })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch(e) {
            console.error("Server Raw Response:", text);
            throw new Error(`Server returned non-JSON: ${text.substring(0, 100)}...`);
        }
        
        if (data.success) {
            log('Plan Generated!');
            currentPlan = data.plan; // Store logic
            renderResults(data.plan);
        } else {
            log('Error: ' + data.error);
            alert('Generation Failed: ' + data.error);
        }
    } catch (e) {
        log('Connection Error.');
        console.error(e);
        alert("Connection Failed: " + e.message);
    }
});

function renderResults(plan) {
    const container = document.getElementById('resultsArea');
    container.innerHTML = ''; // Clear previous

    if (!plan.sections || plan.sections.length === 0) {
        alert("Received plan but no sections found!");
        return;
    }

    const titles = plan.sections.filter(s => s.type === 'Title' || s.type === 'LowerThird' || s.type === 'Caption');
    const visuals = plan.sections.filter(s => s.type === 'Visual');
    
    createAccordionItem(container, 'Titles & Graphics', JSON.stringify(titles, null, 2));
    createAccordionItem(container, 'Visual Plan', JSON.stringify(visuals, null, 2));
    createAccordionItem(container, 'Full Script', JSON.stringify(plan.sections, null, 2));
    createAccordionItem(container, 'Music & Atmosphere', `Mood: ${plan.musicMood || 'None'}`);
}

function createAccordionItem(container, title, content) {
    const item = document.createElement('div');
    item.className = 'accordion-item';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerText = title;
    header.onclick = () => {
        const c = item.querySelector('.accordion-content');
        c.classList.toggle('active');
    };

    const body = document.createElement('div');
    body.className = 'accordion-content';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'result-editor';
    textarea.value = content;
    
    body.appendChild(textarea);
    item.appendChild(header);
    item.appendChild(body);
    container.appendChild(item);
}

// Init
try {
    loadSettings();
    checkAndStartServer();
    log('SmartEdit Ready.');
} catch (e) {
    alert("Init Error: " + e.message);
}

// ExtendScript Calls
document.getElementById('btnBuild').addEventListener('click', () => {
    if (!currentPlan) {
        const container = document.getElementById('resultsArea');
        // If user hasn't generated anything yet, check if there's text in the editor
        // Ideally we should generate first.
        alert("Please generate a plan first!");
        return;
    }
    
    // Pass the plan as a string to ExtendScript
    const jsonStr = JSON.stringify(currentPlan);
    
    // Use proper quoting to avoid syntax errors in eval
    // We escape backslashes and single quotes
    const safeJson = jsonStr.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    
    csInterface.evalScript(`SmartEdit.buildSequence('${safeJson}')`);
});

document.getElementById('btnImport').addEventListener('click', () => {
    csInterface.evalScript('SmartEdit.importFootage()');
});

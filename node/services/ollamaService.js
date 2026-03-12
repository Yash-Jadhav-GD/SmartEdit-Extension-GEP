const axios = require('axios');

const OLLAMA_BASE = 'http://localhost:11434';
const GENERATE_URL = `${OLLAMA_BASE}/api/generate`;
const TAGS_URL = `${OLLAMA_BASE}/api/tags`;

async function generateEditPlan(script, style, musicMode, model, duration) {
    const selectedModel = model || 'llama3';
    const finalModel = selectedModel.trim() === '' ? 'llama3' : selectedModel;
    const targetDuration = duration || 60;

    const prompt = `
You are a professional video editor. Convert the following script into a structured edit plan for Adobe Premiere Pro.
Output MUST be valid JSON. No prose.

Script: "${script}"
Style: ${style}
Music Mode: ${musicMode}
Target Duration: ${targetDuration} seconds

CRITICAL INSTRUCTION:
You MUST generate a "Visual" section for every part of the script. Do NOT leave visuals empty.
If the script is just talking, describe B-roll or graphics that match the content.
Ensure the total duration of sections sums up to approximately ${targetDuration} seconds.

JSON Structure:
{
    "sequenceName": "Video Name",
    "musicMood": "Mood description (Genre, Tempo)",
    "sections": [
        {
            "id": "1",
            "text": "Exact text from script or visual description",
            "type": "Title" | "LowerThird" | "Visual" | "Caption",
            "visualDescription": "Detailed description of what should be seen (B-roll, stock, or graphic)",
            "duration": 5
        }
    ]
}
`;

    try {
        const response = await axios.post(GENERATE_URL, {
            model: finalModel,
            prompt: prompt,
            stream: false,
            format: "json"
        });

        if (response.data && response.data.response) {
            return JSON.parse(response.data.response);
        } else {
            throw new Error('Invalid response from Ollama (data.response missing).');
        }
    } catch (error) {
        console.error('Ollama Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            throw new Error(`Could not connect to Ollama at ${OLLAMA_BASE}. Is it running?`);
        }
        if (error.response && error.response.status === 404) {
            throw new Error(`Model '${finalModel}' not found. Run 'ollama pull ${finalModel}' first.`);
        }
        throw error;
    }
}

async function getOllamaModels() {
    try {
        const response = await axios.get(TAGS_URL);
        if (response.data && response.data.models) {
            return response.data.models.map(m => m.name);
        }
        return [];
    } catch (error) {
        console.error('Failed to get tags from Ollama:', error.message);
        throw error;
    }
}

module.exports = { generateEditPlan, getOllamaModels };

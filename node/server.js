const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateEditPlan, getOllamaModels } = require('./services/ollamaService');
const { generateEditPlanOpenAI } = require('./services/openaiService');
const { validateEditPlan } = require('./services/validationService');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('Body:', JSON.stringify(req.body));
    }
    next();
});

// 1. Generate Edit Plan
app.post('/generate', async (req, res) => {
    try {
        const { script, style, musicMode, provider, apiKey, model, duration } = req.body;
        console.log(`Processing Request -> Provider: ${provider}, Model: ${model}, Duration: ${duration}`);

        let rawPlan;

        // Exact match check for provider
        if (provider && provider.trim() === 'OpenAI') {
            console.log('Routing to OpenAI Service...');
            rawPlan = await generateEditPlanOpenAI(script, style, musicMode, apiKey, model, duration);
        } else {
            console.log('Routing to Ollama Service...');
            // Default to Ollama
            rawPlan = await generateEditPlan(script, style, musicMode, model, duration);
        }

        res.json({ success: true, plan: rawPlan });

    } catch (error) {
        console.error('SERVER ERROR:', error.message);
        console.error(error.stack);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Clear Cache
app.post('/clear-cache', (req, res) => {
    console.log('Clearing cache...');
    res.json({ success: true });
});

// 3. Get Models (New Endpoint)
app.get('/tags', async (req, res) => {
    try {
        const models = await getOllamaModels();
        res.json({ success: true, models });
    } catch (error) {
        console.error('Failed to fetch models:', error.message);
        res.json({ success: false, error: error.message, models: [] });
    }
});

app.listen(PORT, () => {
    console.log(`SmartEdit Backend running on http://localhost:${PORT}`);
});

const OpenAI = require('openai');

async function generateEditPlanOpenAI(script, style, musicMode, apiKey, model, duration) {
    if (!apiKey) {
        throw new Error("OpenAI API Key is required.");
    }

    const openai = new OpenAI({ apiKey: apiKey });
    const selectedModel = model || 'gpt-4o';
    const targetDuration = duration || 60;

    const systemPrompt = `
You are a professional video editor. Convert the following script into a structured edit plan for Adobe Premiere Pro.
Output MUST be valid JSON. No prose.

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
        const compl = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Script: "${script}"` }
            ],
            model: selectedModel,
            response_format: { type: "json_object" }
        });

        const content = compl.choices[0].message.content;
        return JSON.parse(content);

    } catch (error) {
        console.error('OpenAI Error:', error.message);
        throw error;
    }
}

module.exports = { generateEditPlanOpenAI };

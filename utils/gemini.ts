export interface ExtractedBeanInfo {
    name?: string;
    roaster?: string;
    origin?: string;
    variety?: string;
    roastLevel?: string;
    process?: string;
    flavorTags?: string[];
    roastDate?: string;
}

let cachedTargetModel: string | null = null;

export async function analyzeCoffeeBagImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedBeanInfo> {
    if (!cachedTargetModel) {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        if (!listRes.ok) {
            const errorText = await listRes.text();
            throw new Error(`Gemini API Error (List Models): ${listRes.status} - ${errorText}`);
        }
        const listData = await listRes.json();
        const models: any[] = listData.models || [];
        
        // Find a model that supports generateContent, preferring flash then pro
        const targetModel = models.find(m => m.name.includes('gemini-2.5-flash') && m.supportedGenerationMethods?.includes('generateContent')) || 
                            models.find(m => m.name.includes('gemini-1.5-flash') && m.supportedGenerationMethods?.includes('generateContent')) ||
                            models.find(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));

        if (!targetModel) {
            const availableNames = models.map(m => m.name).join(', ');
            throw new Error(`No compatible Gemini model found for this API key. Available models: ${availableNames}`);
        }
        cachedTargetModel = targetModel.name;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${cachedTargetModel}:generateContent?key=${apiKey}`;

    const prompt = `Extract coffee info from image into JSON. No markdown.
{
  "name": "string (main name, ex: Finca El Puente. No roaster)",
  "roaster": "string",
  "origin": "string",
  "variety": "string",
  "roastLevel": "string (Light/Medium/Dark. Read from text only, do not guess from bag color)",
  "process": "string",
  "flavorTags": ["string"],
  "roastDate": "string (YYYY-MM-DD)"
}
Omit missing fields. Valid JSON only.`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1
        }
    };

    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const errorText = await res.text();
                if (res.status === 429 && attempt < maxRetries) {
                    // Rate limited: Wait 15 seconds before retrying (exponential backoff)
                    const waitTime = (attempt + 1) * 15000;
                    console.warn(`[Gemini API] 429 Rate Limit hit. Retrying in ${waitTime/1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }
                throw new Error(`Gemini API Error: ${res.status} - ${errorText}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("No text found in response");
            }

            const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const result = JSON.parse(cleanedText) as ExtractedBeanInfo;
            return result;
            
        } catch (error) {
            lastError = error;
            // Only retry if it's explicitly a 429 (handled above), otherwise break and throw
            if (error instanceof Error && !error.message.includes('429')) {
                throw error;
            }
        }
    }
    
    throw lastError;
}

export interface ExtractedRecipeStep {
    name?: string;
    waterAdded?: number;
    duration?: number;
    temperature?: number;
    state?: string;
}

export interface ExtractedRecipeInfo {
    name?: string;
    dripper?: string;
    beanWeight?: number;
    totalWater?: number;
    ratio?: number;
    temperature?: number;
    grindSize?: string;
    steps?: ExtractedRecipeStep[];
}

export async function analyzeRecipeImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedRecipeInfo> {
    if (!cachedTargetModel) {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listRes = await fetch(listUrl);
        if (!listRes.ok) {
            const errorText = await listRes.text();
            throw new Error(`Gemini API Error (List Models): ${listRes.status} - ${errorText}`);
        }
        const listData = await listRes.json();
        const models: any[] = listData.models || [];
        
        const targetModel = models.find(m => m.name.includes('gemini-2.5-flash') && m.supportedGenerationMethods?.includes('generateContent')) || 
                            models.find(m => m.name.includes('gemini-1.5-flash') && m.supportedGenerationMethods?.includes('generateContent')) ||
                            models.find(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'));

        if (!targetModel) {
            const availableNames = models.map(m => m.name).join(', ');
            throw new Error(`No compatible Gemini model found for this API key. Available models: ${availableNames}`);
        }
        cachedTargetModel = targetModel.name;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/${cachedTargetModel}:generateContent?key=${apiKey}`;

    const prompt = `Extract coffee recipe info from image into JSON. No markdown.
{
  "name": "string (name of the recipe)",
  "dripper": "string (e.g. V60, Kalita, Aeropress)",
  "beanWeight": "number (grams of coffee beans)",
  "totalWater": "number (total grams/ml of water)",
  "ratio": "number (if mentioned like 1:15, just put 15)",
  "temperature": "number (Celsius)",
  "grindSize": "string (e.g. Medium-Fine, 25 clicks)",
  "steps": [
    {
      "name": "string (e.g. Bloom, 1st Pour, 2nd Pour)",
      "waterAdded": "number (absolute grams of water poured IN THIS STEP. DO NOT use cumulative total. If step says 'pour to 150g' and previous was 50g, waterAdded is 100)",
      "duration": "number (seconds this step takes. E.g. if it says 0:00 to 0:45, duration is 45)",
      "temperature": "number (Celsius, ONLY if a specific temperature is mentioned for this step, e.g. 'Drop to 70C')",
      "state": "string (Specific actions or states for this step, e.g. 'Switch Close', 'Stir', 'Center Pour')"
    }
  ]
}
Omit missing fields. For steps, calculate absolute water added per step if only cumulative weight is shown. Valid JSON only.`;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.1
        }
    };

    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!res.ok) {
                const errorText = await res.text();
                if (res.status === 429 && attempt < maxRetries) {
                    const waitTime = (attempt + 1) * 15000;
                    console.warn(`[Gemini API] 429 Rate Limit hit. Retrying in ${waitTime/1000}s... (Attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }
                throw new Error(`Gemini API Error: ${res.status} - ${errorText}`);
            }

            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("No text found in response");
            }

            const cleanedText = text.replace(/\`\`\`json\n?/g, '').replace(/\`\`\`\n?/g, '').trim();
            const result = JSON.parse(cleanedText) as ExtractedRecipeInfo;
            return result;
            
        } catch (error) {
            lastError = error;
            if (error instanceof Error && !error.message.includes('429')) {
                throw error;
            }
        }
    }
    
    throw lastError;
}

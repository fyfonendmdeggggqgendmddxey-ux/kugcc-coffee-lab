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
  "roastLevel": "string (Light/Medium/Dark/etc)",
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

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    try {
        let jsonString = data.candidates[0].content.parts[0].text;
        // Sometimes Gemini still wraps JSON in markdown blocks despite response_mime_type
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        const parsed = JSON.parse(jsonString) as ExtractedBeanInfo;
        return parsed;
    } catch (e) {
        console.error("Failed to parse Gemini response", data);
        throw new Error("Failed to parse the extracted data from the AI.");
    }
}

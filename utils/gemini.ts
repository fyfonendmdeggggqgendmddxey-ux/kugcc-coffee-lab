export interface ExtractedBeanInfo {
    name?: string;
    roaster?: string;
    origin?: string;
    variety?: string;
    roastLevel?: string;
    process?: string;
    flavorTags?: string[];
}

export async function analyzeCoffeeBagImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedBeanInfo> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Prompt optimized for coffee bag extraction
    const prompt = `
You are a coffee expert. Analyze this image of a coffee bean bag or label.
Extract the following information and return it strictly as a JSON object.
Do NOT include any markdown formatting, only the raw JSON.

JSON Schema:
{
    "name": "string (the main name of the coffee, e.g. 'Finca El Puente' or 'Ethiopia Yirgacheffe'. Exclude the roaster name if possible)",
    "roaster": "string (the name of the coffee roaster or brand)",
    "origin": "string (the country or region of origin)",
    "variety": "string (the coffee variety, e.g. 'Geisha', 'Bourbon', 'Typica')",
    "roastLevel": "string (e.g. 'Light', 'Medium', 'Dark'. Infer from text if not explicit, but leave empty if unknown)",
    "process": "string (the processing method, e.g. 'Washed', 'Natural', 'Honey', 'Anaerobic')",
    "flavorTags": ["string", "string"] (list of flavor notes or tasting notes found on the bag)
}

If you cannot find a specific piece of information, omit the key or set it to null.
Ensure the output is ONLY valid JSON.
`;

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
            response_mime_type: "application/json",
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

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

export async function analyzeCoffeeBagImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedBeanInfo> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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

export const imagePrompts = {
    bean: `Extract coffee info from image into JSON. No markdown.
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
Omit missing fields. Valid JSON only.`,
    recipe: `Extract coffee recipe info from image into JSON. No markdown.
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
Omit missing fields. For steps, calculate absolute water added per step if only cumulative weight is shown. Valid JSON only.`
} as const;

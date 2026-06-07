export type RecipeStep = {
    id: string;
    name: string;
    waterPercentage: number; // e.g. 20 for 20%
    duration: number; // seconds
};

export type Recipe = {
    id?: string;
    name?: string; // e.g. "Standard V60", "Hot Bloom"
    beanWeight: number; // grams
    ratio: number; // 1:x
    temperature: number; // Celsius
    grindSize: string; // Text description
    grinderModel?: string; // e.g. "Comandante C40"
    dripper?: string; // e.g. "V60", "Kalita"
    accessories?: string[]; // e.g. ["Paragon", "Melodrip", "Sifter"]
    isStarred?: boolean; // New: Favorite status for recipe
    isShopRecipe?: boolean; // New: Model/Shop recipe flag
    notes?: string; // New: Optional notes
    steps: RecipeStep[];
};

export type Bean = {
    id: string;
    name: string;
    englishName?: string; // e.g. "Ethiopia Yirgacheffe G1"
    roaster: string;
    origin?: string;
    variety?: string; // e.g. Geisha, Bourbon
    roastLevel: string; // Light, Medium, Dark
    process: string; // Washed, Natural, Honey
    roastDate: string; // ISO Date string
    isStarred?: boolean; // New: Favorite/Pin status
    recipeOverride?: Recipe; // Kept for backward compatibility or "active" state
    recipes?: Recipe[]; // New: List of saved recipes
    idealAgingDays?: number; // Optional: Theoretical ideal aging days
    shopRecommendedDays?: number; // Optional: Shop's recommended aging days
    storageLocation?: 'Room' | 'HighTemp' | 'Fridge' | 'Freezer'; // Optional: Storage location
    flavorTags?: string[]; // Optional: Flavor profile tags
};

// Default Recipe Template
export const DEFAULT_RECIPE: Recipe = {
    name: 'Standard 4-Pour',
    beanWeight: 15,
    ratio: 16,
    temperature: 93,
    grindSize: "Medium-Fine",
    grinderModel: "S3",
    steps: [
        { id: '1', name: 'Bloom', waterPercentage: 20.833333, duration: 40 }, // 50ml
        { id: '2', name: '2nd Pour', waterPercentage: 25, duration: 40 },     // 60ml
        { id: '3', name: '3rd Pour', waterPercentage: 27.083333, duration: 40 }, // 65ml
        { id: '4', name: '4th Pour', waterPercentage: 27.083333, duration: 40 }, // 65ml
    ]
};

export type AgingThresholds = {
    degas: number; // Days until Degas period ends
    peak: number;  // Days until Peak period ends
    good: number;  // Days until Good period ends
};

export const DEFAULT_AGING_THRESHOLDS: AgingThresholds = {
    degas: 4,
    peak: 14,
    good: 30
};

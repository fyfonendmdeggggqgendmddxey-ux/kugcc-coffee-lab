export type FlavorCategory = 
    | 'Floral'
    | 'Fruity'
    | 'Sour/Fermented'
    | 'Green/Vegetative'
    | 'Roasted'
    | 'Spices'
    | 'Nutty/Cocoa'
    | 'Sweet'
    | 'Other';

export interface FlavorNode {
    name: string;
    category: FlavorCategory;
    colorClasses: string; // Tailwind classes for the pill (e.g. 'bg-pink-950/40 text-pink-300 border-pink-700/50')
}

// Map categories to beautiful glassmorphic Tailwind classes
export const CATEGORY_COLORS: Record<FlavorCategory, string> = {
    'Floral': 'bg-[#e45396]/30 text-pink-800 dark:text-pink-200 border-[#e45396]/80',
    'Fruity': 'bg-[#da1d23]/30 text-red-800 dark:text-red-200 border-[#da1d23]/80',
    'Sour/Fermented': 'bg-[#f6d21e]/20 text-yellow-800 dark:text-yellow-200 border-[#f6d21e]/80',
    'Green/Vegetative': 'bg-[#179038]/40 text-green-800 dark:text-green-200 border-[#179038]/80',
    'Roasted': 'bg-[#9f4521]/40 text-orange-900 dark:text-orange-200 border-[#9f4521]/80',
    'Spices': 'bg-[#c21f31]/40 text-red-900 dark:text-red-200 border-[#c21f31]/80',
    'Nutty/Cocoa': 'bg-[#c38953]/40 text-orange-900 dark:text-orange-200 border-[#c38953]/80',
    'Sweet': 'bg-[#e35a26]/30 text-orange-800 dark:text-orange-200 border-[#e35a26]/80',
    'Other': 'bg-[#3b8c9d]/40 text-cyan-800 dark:text-cyan-200 border-[#3b8c9d]/80'
};

// Sub-colors for specific fruity types to make it pop like the wheel
const CITRUS_COLOR = 'bg-[#f6a22e]/30 text-yellow-800 dark:text-yellow-200 border-[#f6a22e]/80';
const BERRY_COLOR = 'bg-[#d92b4a]/30 text-rose-800 dark:text-rose-200 border-[#d92b4a]/80';
const DARK_FRUIT_COLOR = 'bg-[#833a80]/40 text-purple-800 dark:text-purple-200 border-[#833a80]/80';

export const FLAVOR_WHEEL: FlavorNode[] = [
    // Floral
    { name: 'Floral', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] },
    { name: 'Black Tea', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] },
    { name: 'Chamomile', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] },
    { name: 'Rose', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] },
    { name: 'Jasmine', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] },
    { name: 'Lavender', category: 'Floral', colorClasses: CATEGORY_COLORS['Floral'] }, // Extra

    // Fruity - Berries
    { name: 'Berry', category: 'Fruity', colorClasses: BERRY_COLOR },
    { name: 'Blackberry', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Raspberry', category: 'Fruity', colorClasses: BERRY_COLOR },
    { name: 'Blueberry', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Strawberry', category: 'Fruity', colorClasses: BERRY_COLOR },
    
    // Fruity - Dried/Other
    { name: 'Dried Fruit', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Raisin', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Prune', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Other Fruit', category: 'Fruity', colorClasses: CATEGORY_COLORS['Fruity'] },
    { name: 'Coconut', category: 'Fruity', colorClasses: CATEGORY_COLORS['Fruity'] },
    { name: 'Cherry', category: 'Fruity', colorClasses: BERRY_COLOR },
    { name: 'Pomegranate', category: 'Fruity', colorClasses: BERRY_COLOR },
    { name: 'Pineapple', category: 'Fruity', colorClasses: CATEGORY_COLORS['Fruity'] },
    { name: 'Grape', category: 'Fruity', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Apple', category: 'Fruity', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Peach', category: 'Fruity', colorClasses: CATEGORY_COLORS['Fruity'] },
    { name: 'Pear', category: 'Fruity', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },

    // Fruity - Citrus
    { name: 'Citrus Fruit', category: 'Fruity', colorClasses: CITRUS_COLOR },
    { name: 'Grapefruit', category: 'Fruity', colorClasses: CITRUS_COLOR },
    { name: 'Orange', category: 'Fruity', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Lemon', category: 'Fruity', colorClasses: CITRUS_COLOR },
    { name: 'Lime', category: 'Fruity', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },

    // Sour/Fermented
    { name: 'Sour', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Sour Aromatics', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Acetic Acid', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Butyric Acid', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Isovaleric Acid', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Citric Acid', category: 'Sour/Fermented', colorClasses: CITRUS_COLOR },
    { name: 'Malic Acid', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Alcohol/Fermented', category: 'Sour/Fermented', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Winey', category: 'Sour/Fermented', colorClasses: DARK_FRUIT_COLOR },
    { name: 'Whiskey', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Fermented', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    { name: 'Overripe', category: 'Sour/Fermented', colorClasses: CATEGORY_COLORS['Sour/Fermented'] },
    
    // Green/Vegetative
    { name: 'Green/Vegetative', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Olive Oil', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Raw', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Under-ripe', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Peapod', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Fresh', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Dark Green', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Vegetative', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Hay-like', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Herb-like', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },
    { name: 'Mint', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] }, // Extra
    { name: 'Beany', category: 'Green/Vegetative', colorClasses: CATEGORY_COLORS['Green/Vegetative'] },

    // Roasted
    { name: 'Roasted', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Pipe Tobacco', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Tobacco', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Burnt', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Acrid', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Ashy', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Smoky', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Brown, Roast', category: 'Roasted', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Grain', category: 'Roasted', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Malt', category: 'Roasted', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Cereal', category: 'Roasted', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    
    // Spices
    { name: 'Spices', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Pungent', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Pepper', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Brown Spice', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Anise', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Nutmeg', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Cinnamon', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },
    { name: 'Clove', category: 'Spices', colorClasses: CATEGORY_COLORS['Spices'] },

    // Nutty/Cocoa
    { name: 'Nutty/Cocoa', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Nutty', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Peanuts', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Hazelnut', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Almond', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Cocoa', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Roasted'] },
    { name: 'Chocolate', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Dark Chocolate', category: 'Nutty/Cocoa', colorClasses: CATEGORY_COLORS['Roasted'] },
    
    // Sweet
    { name: 'Sweet', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Sweet Aromatics', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Overall Sweet', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Brown Sugar', category: 'Sweet', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Molasses', category: 'Sweet', colorClasses: CATEGORY_COLORS['Nutty/Cocoa'] },
    { name: 'Maple Syrup', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Caramelized', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Honey', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },
    { name: 'Vanilla', category: 'Sweet', colorClasses: CATEGORY_COLORS['Sweet'] },

    // Other
    { name: 'Other', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Papery/Musty', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Stale', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Cardboard', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Papery', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Woody', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Moldy/Damp', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Musty/Dusty', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Musty/Earthy', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Animalic', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Meaty Brothy', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Phenolic', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Chemical', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Bitter', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Salty', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Medicinal', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Petroleum', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Skunky', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
    { name: 'Rubber', category: 'Other', colorClasses: CATEGORY_COLORS['Other'] },
];

export const DEFAULT_TAG_COLOR = 'bg-gray-800/60 text-gray-300 border-gray-600/50';

export function getFlavorColor(flavorName: string): string {
    const found = FLAVOR_WHEEL.find(f => f.name.toLowerCase() === flavorName.toLowerCase());
    return found ? found.colorClasses : DEFAULT_TAG_COLOR;
}

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

export function normalizeApiKey(value: string): string {
    return value.trim().replace(/^Bearer\s+/i, '').trim();
}

// Older versions saved every provider's key in the Gemini setting.
export function getDeepSeekApiKey(): string {
    const saved = localStorage.getItem('kugcc_deepseek_api_key');
    if (saved !== null) return normalizeApiKey(saved);
    const legacy = normalizeApiKey(localStorage.getItem('kugcc_gemini_api_key') || '');
    if (legacy.startsWith('sk-')) {
        localStorage.setItem('kugcc_deepseek_api_key', legacy);
        return legacy;
    }
    return '';
}

async function requestAnalysis(kind: 'bean' | 'recipe' | 'check', apiKey: string, image?: string, mimeType?: string) {
    const key = normalizeApiKey(apiKey);
    if (!key) throw new Error('設定画面にDeepSeek APIキーを入力してください。');
    if (/\s/.test(key)) throw new Error('APIキーに空白や改行が含まれています。キー全体をコピーし直してください。');
    try {
        const response = await fetch('/api/deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({ kind, image, mimeType }),
            signal: AbortSignal.timeout(55000),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'DeepSeekとの通信に失敗しました。');
        return data;
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            throw new Error('読み取りがタイムアウトしました。少し待って再実行してください。');
        }
        throw error;
    }
}

export async function checkDeepSeekConnection(apiKey: string): Promise<void> {
    await requestAnalysis('check', apiKey);
}

export async function analyzeCoffeeBagImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedBeanInfo> {
    return requestAnalysis('bean', apiKey, base64Image, mimeType);
}

export async function analyzeRecipeImage(base64Image: string, mimeType: string, apiKey: string): Promise<ExtractedRecipeInfo> {
    return requestAnalysis('recipe', apiKey, base64Image, mimeType);
}

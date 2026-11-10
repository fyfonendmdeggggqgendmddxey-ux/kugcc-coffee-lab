import { imagePrompts } from '../../../utils/image-analysis-prompts';

export const runtime = 'nodejs';
export const maxDuration = 60;
const headers = { 'Cache-Control': 'no-store' };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

function apiError(status: number): string {
    if (status === 401 || status === 403) return 'DeepSeekの認証に失敗しました。DeepSeek Platformで発行したAPIキーを確認してください。';
    if (status === 402) return 'DeepSeekの残高が不足しています。DeepSeek Platformで残高を確認してください。';
    if (status === 429) return 'DeepSeekの利用制限に達しました。少し待って再実行してください。';
    if (status === 400 || status === 422) return 'DeepSeekが画像を処理できませんでした。別の写真で再実行してください。';
    return 'DeepSeekが応答できませんでした。少し待って再実行してください。';
}

export async function POST(request: Request) {
    const origin = request.headers.get('origin');
    if (origin && origin !== new URL(request.url).origin) return json({ error: 'このサイトから実行してください。' }, 403);
    const key = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
    if (!key || !key.startsWith('sk-') || /\s/.test(key)) return json({ error: 'DeepSeekのAPIキー（sk-で始まる値）を設定してください。' }, 400);
    if (Number(request.headers.get('content-length')) > 4_000_000) return json({ error: '画像が大きすぎます。小さな画像で再実行してください。' }, 413);
    try {
        // The caller supplies their own credential. It is only forwarded to this fixed host;
        // neither the credential nor upstream error bodies are stored or logged.
        const body = await request.text();
        if (body.length > 4_000_000) return json({ error: '画像が大きすぎます。' }, 413);
        let input;
        try { input = JSON.parse(body); } catch { return json({ error: 'リクエストが不正です。' }, 400); }
        const { kind, image, mimeType } = input || {};
        if (kind !== 'check' && kind !== 'bean' && kind !== 'recipe') return json({ error: '読み取りの種類が不正です。' }, 400);
        if (kind !== 'check' && (typeof image !== 'string' || !image.length || !/^[A-Za-z0-9+/]+={0,2}$/.test(image) || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mimeType))) {
            return json({ error: '画像を選び直してください。' }, 400);
        }
        const upstream = await fetch(kind === 'check' ? 'https://api.deepseek.com/models' : 'https://api.deepseek.com/chat/completions', {
            method: kind === 'check' ? 'GET' : 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            ...(kind === 'check' ? {} : { body: JSON.stringify({
                model: 'deepseek-flash',
                thinking: { type: 'disabled' },
                max_tokens: 3000,
                response_format: { type: 'json_object' },
                messages: [{ role: 'user', content: [
                    { type: 'text', text: imagePrompts[kind as keyof typeof imagePrompts] },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } },
                ] }],
            }) }),
            signal: AbortSignal.timeout(45000),
            cache: 'no-store',
            redirect: 'error',
        });
        if (!upstream.ok) return json({ error: apiError(upstream.status) }, upstream.status);
        const result = await upstream.json();
        if (kind === 'check') {
            if (!result.data?.some((model: { id: string }) => model.id === 'deepseek-flash')) {
                return json({ error: '認証できましたが、画像対応のDeepSeek Flashを利用できません。' }, 400);
            }
            return json({ ok: true });
        }
        const choice = result.choices?.[0];
        if (choice?.finish_reason !== 'stop' || typeof choice.message?.content !== 'string') return json({ error: '読み取り結果が不完全です。写真を撮り直して再実行してください。' }, 502);
        let extracted;
        try { extracted = JSON.parse(choice.message.content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim()); }
        catch { return json({ error: '読み取り結果を解釈できませんでした。再実行してください。' }, 502); }
        if (!extracted || typeof extracted !== 'object' || Array.isArray(extracted)) return json({ error: '読み取り結果が不正です。' }, 502);
        // Discard unexpected fields and reject incorrect types before they reach form state.
        const stringFields = kind === 'bean' ? ['name', 'roaster', 'origin', 'variety', 'roastLevel', 'process', 'roastDate'] : ['name', 'dripper', 'grindSize'];
        const output: Record<string, unknown> = {};
        for (const field of stringFields) if (typeof extracted[field] === 'string') output[field] = extracted[field];
        if (kind === 'bean' && Array.isArray(extracted.flavorTags)) output.flavorTags = extracted.flavorTags.filter((value: unknown) => typeof value === 'string');
        if (kind === 'recipe') {
            for (const field of ['beanWeight', 'totalWater', 'ratio', 'temperature']) if (typeof extracted[field] === 'number' && Number.isFinite(extracted[field])) output[field] = extracted[field];
            if (Array.isArray(extracted.steps)) output.steps = extracted.steps.filter((step: unknown) => step && typeof step === 'object' && !Array.isArray(step)).map((step: Record<string, unknown>) => {
                const clean: Record<string, unknown> = {};
                for (const field of ['name', 'state']) if (typeof step[field] === 'string') clean[field] = step[field];
                for (const field of ['waterAdded', 'duration', 'temperature']) if (typeof step[field] === 'number' && Number.isFinite(step[field])) clean[field] = step[field];
                return clean;
            });
        }
        if (!Object.keys(output).length) return json({ error: '写真から情報を読み取れませんでした。ラベルを大きく写して再実行してください。' }, 422);
        return json(output);
    } catch (error) {
        const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name);
        return json({ error: timedOut ? '読み取りがタイムアウトしました。少し待って再実行してください。' : 'DeepSeekとの通信に失敗しました。再実行してください。' }, timedOut ? 504 : 502);
    }
}

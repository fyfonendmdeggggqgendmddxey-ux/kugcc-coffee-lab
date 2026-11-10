const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => {
    module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }, fileName: filename,
    }).outputText, filename);
};
const { POST } = require('../app/api/deepseek/route.ts');
const { getDeepSeekApiKey, analyzeCoffeeBagImage } = require('../utils/deepseek.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; delete global.localStorage; });
const request = (body, key = 'sk-test-only') => new Request('https://coffee.test/api/deepseek', {
    method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const image = { kind: 'bean', image: 'aGVsbG8=', mimeType: 'image/jpeg' };
test('migrates a DeepSeek key from the previous Gemini field without accepting a Gemini key', () => {
    const storage = new Map([['kugcc_gemini_api_key', '  sk-test-only\n']]);
    global.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) };
    assert.equal(getDeepSeekApiKey(), 'sk-test-only');
    storage.set('kugcc_deepseek_api_key', '');
    assert.equal(getDeepSeekApiKey(), ''); // clearing the new field must not resurrect an old key
    storage.delete('kugcc_deepseek_api_key'); storage.set('kugcc_gemini_api_key', 'AIza-test');
    assert.equal(getDeepSeekApiKey(), '');
});
test('browser sends normalized key only in authorization to same-origin API', async () => {
    global.fetch = async (url, init) => {
        assert.equal(url, '/api/deepseek');
        assert.equal(init.headers.Authorization, 'Bearer sk-test-only');
        assert.ok(!init.body.includes('sk-test-only'));
        return Response.json({ name: 'Coffee' });
    };
    assert.deepEqual(await analyzeCoffeeBagImage('aGVsbG8=', 'image/jpeg', ' Bearer sk-test-only '), { name: 'Coffee' });
});
test('route sends image to DeepSeek Flash and filters unsafe response field types', async () => {
    global.fetch = async (url, init) => {
        assert.equal(url, 'https://api.deepseek.com/chat/completions');
        assert.equal(init.headers.Authorization, 'Bearer sk-test-only');
        const payload = JSON.parse(init.body);
        assert.equal(payload.model, 'deepseek-flash');
        assert.equal(payload.messages[0].content[1].image_url.url, 'data:image/jpeg;base64,aGVsbG8=');
        return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ name: 'Coffee', roastLevel: 42, flavorTags: ['berry', 4] }) } }] });
    };
    const res = await POST(request(image));
    assert.equal(res.status, 200); assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await res.json(), { name: 'Coffee', flavorTags: ['berry'] });
});
test('check validates authentication and availability of the image model without paid generation', async () => {
    global.fetch = async (url, init) => {
        assert.equal(url, 'https://api.deepseek.com/models'); assert.equal(init.method, 'GET');
        return Response.json({ data: [{ id: 'deepseek-flash' }] });
    };
    assert.deepEqual(await (await POST(request({ kind: 'check' }))).json(), { ok: true });
});
test('authentication, balance, rate limits and timeouts have actionable errors without leaking upstream bodies', async () => {
    for (const [status, message] of [[401, /認証/], [402, /残高/], [429, /利用制限/]]) {
        global.fetch = async () => new Response('secret-upstream-data', { status });
        const res = await POST(request(image)); const body = await res.json();
        assert.equal(res.status, status); assert.match(body.error, message); assert.ok(!JSON.stringify(body).includes('secret'));
    }
    global.fetch = async () => { throw new DOMException('timeout', 'TimeoutError'); };
    assert.equal((await POST(request(image))).status, 504);
});
test('invalid inputs never reach upstream and truncated results cannot update forms', async () => {
    global.fetch = async () => { throw new Error('must not fetch'); };
    assert.equal((await POST(request(image, 'AIza-test'))).status, 400);
    assert.equal((await POST(request({ ...image, mimeType: 'text/html' }))).status, 400);
    global.fetch = async () => Response.json({ choices: [{ finish_reason: 'length', message: { content: '{"name":"Coffee"}' } }] });
    assert.equal((await POST(request(image))).status, 502);
});

test('same-origin browser requests survive internal Next.js URL rewriting, foreign origins are rejected', async () => {
    global.fetch = async () => Response.json({ data: [{ id: 'deepseek-flash' }] });
    const make = origin => new Request('http://localhost:3107/api/deepseek', {
        method: 'POST', headers: { host: '127.0.0.1:3107', origin, authorization: 'Bearer sk-test-only' },
        body: JSON.stringify({ kind: 'check' }),
    });
    assert.equal((await POST(make('http://127.0.0.1:3107'))).status, 200);
    assert.equal((await POST(make('https://foreign.test'))).status, 403);
});

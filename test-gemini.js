const https = require('https');

const endpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=invalid',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=invalid',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=invalid'
];

async function checkEndpoint(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: 'POST' }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ url, status: res.statusCode, data }));
        });
        req.on('error', (e) => resolve({ url, error: e.message }));
        req.end();
    });
}

async function main() {
    for (const url of endpoints) {
        const result = await checkEndpoint(url);
        console.log(`URL: ${url.split('?')[0]}`);
        console.log(`Status: ${result.status}`);
        if (result.status === 404) console.log('Result: MODEL NOT FOUND (404)');
        else if (result.status === 400) console.log('Result: ENDPOINT EXISTS (400 Bad Request / API key invalid)');
        else console.log(`Result: ${JSON.stringify(result.data)}`);
        console.log('---');
    }
}
main();

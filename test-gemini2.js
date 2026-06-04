const https = require('https');

const endpoints = [
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=AIzaSyB-RandomStringThatLooksLikeValidKey123',
    'https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyB-RandomStringThatLooksLikeValidKey123'
];

async function checkEndpoint(url) {
    return new Promise((resolve) => {
        const req = https.request(url, { method: url.includes('generateContent') ? 'POST' : 'GET' }, (res) => {
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
        console.log(`Result: ${result.data}`);
        console.log('---');
    }
}
main();

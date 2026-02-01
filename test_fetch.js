const https = require('https');

const API_KEY = "AIzaSyA5i8DGZEd5SpRg4ZKL77in87o_46fq1Ho";
const MODEL = "gemini-1.5-flash"; // Try the standard alias first

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

console.log(`Hitting URL: ${url.replace(API_KEY, 'HIDDEN')}`);

const data = JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }]
});

const req = https.request(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('BODY: ' + body);
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.write(data);
req.end();

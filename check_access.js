const https = require('https');

const apiKey = "AIzaSyATdMkZuSrZYuzyCojuv4oKOLmm5p6Z63Q";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log(`Querying Google API...`);

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log("HTTP Status:", res.statusCode);
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.log("API Error:");
                console.log(JSON.stringify(json.error, null, 2));
            } else if (json.models) {
                console.log("Successfully found models! Here are the ones you can use:");
                json.models.forEach(m => {
                    // Filter for 'generateContent' supported models
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                        console.log(` - ${m.name.replace("models/", "")}`);
                    }
                });
            } else {
                console.log("Response (Unknown format):", data.substring(0, 500));
            }
        } catch (e) {
            console.log("Raw Response (Not JSON):", data.substring(0, 500));
        }
    });
}).on('error', (err) => {
    console.error("Network Error:", err.message);
});

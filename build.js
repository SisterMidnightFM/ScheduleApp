const fs = require('fs');

const { CALENDAR_ID, API_KEY } = process.env;

if (!CALENDAR_ID || !API_KEY) {
    console.warn('Warning: CALENDAR_ID or API_KEY env var missing — .env not written');
    process.exit(0);
}

fs.writeFileSync('.env', `const CONFIG = {
    CALENDAR_ID: '${CALENDAR_ID}',
    API_KEY: '${API_KEY}'
};\n`);

console.log('.env written from environment variables');

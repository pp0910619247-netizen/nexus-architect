import fs from 'node:fs';
const p = 'index.html';
let s = fs.readFileSync(p, 'utf8');

// Social links
s = s.replaceAll('https://t.me/YOUR_TELEGRAM', 'https://t.me/+lWc7bfRVbUBlZTY1');
s = s.replaceAll('https://x.com/YOUR_TWITTER', 'https://x.com/nexusarchitect2');
s = s.replaceAll('https://facebook.com/YOUR_PAGE', 'https://www.facebook.com/groups/28128540746755286/');
s = s.replaceAll('YOUR_TELEGRAM', 'https://t.me/+lWc7bfRVbUBlZTY1');
s = s.replaceAll('YOUR_TWITTER', 'https://x.com/nexusarchitect2');
s = s.replaceAll('YOUR_PAGE', 'https://www.facebook.com/groups/28128540746755286/');

fs.writeFileSync(p, s, 'utf8');
console.log('Social links replaced');

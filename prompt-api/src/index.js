const crypto = require('node:crypto');

// const text = 'c'.repeat(16500);  // Creating a string with 16500 'c' characters
const text = 'c'.repeat(64000);  // Creating a string with 64000 'c' characters
const start = new Date().getTime();
const hash = crypto.createHash('sha256').update(text).digest('hex');
console.log(`Time taken: ${new Date().getTime() - start} ms`);
console.log(`SHA-256 hash: ${hash}`);

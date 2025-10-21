// Lightweight runner file to help hosting platforms (like Render) which may try to `node src/run`
// This file will attempt to load the compiled build at ../dist/index.js (the output of `tsc`).
// If the compiled file is missing, it prints a helpful message and exits with a non-zero code.

const path = require('path');
const fs = require('fs');

const distIndex = path.join(__dirname, '..', 'dist', 'index.js');

if (fs.existsSync(distIndex)) {
  require(distIndex);
} else {
  console.error('\nERROR: compiled server entry not found at', distIndex);
  console.error('Run `npm run build` to produce the dist/ folder, or change your start command to `npm start` which will build automatically.');
  console.error('This helper exists to satisfy hosts that attempt to run `node src/run` directly.\n');
  process.exit(1);
}

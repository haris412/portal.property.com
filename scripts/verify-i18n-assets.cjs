/**
 * Fails the build if ngx-translate JSON files are missing from the browser output.
 * Run after `ng build` (see package.json "build" script).
 */
const fs = require('fs');
const path = require('path');

const i18nDir = path.join(__dirname, '..', 'dist', 'portal-dashboard', 'browser', 'i18n');
const required = ['en.json', 'ur.json'];

for (const file of required) {
  const full = path.join(i18nDir, file);
  if (!fs.existsSync(full)) {
    console.error(`Build verification failed: missing ${full}`);
    process.exit(1);
  }
}
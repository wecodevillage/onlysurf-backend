#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');

const cwd = path.resolve(__dirname, '..');

try {
  const result = execSync(
    'node node_modules/.bin/jest --config ./test/jest-e2e.json --testPathPatterns app.e2e-spec --runInBand --forceExit --no-cache --verbose',
    {
      cwd,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test' },
    },
  );
  console.log(result);
  process.exit(0);
} catch (e) {
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.error(e.stderr);
  process.exit(e.status || 1);
}
